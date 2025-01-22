import { _decorator, Canvas, Component, Node, Prefab, tween, UITransform, Vec3 } from 'cc';
import { CustomerComponent } from './CustomerComponent';
import { NodePool } from '../../common/scripts/NodePool'; // 确保路径正确
import { GameBoard } from '../script/Test';
import { FoodItem } from './FoodItem';
import { CustomerState } from '../../core/scripts/define/Enums';
import { CustomerMoveConfig, EnterQueueMoveConfig, QueueMoveConfig } from '../../app/config/GameConfig';

const { ccclass, property } = _decorator;


// 只有一个食物在桌子上就返回坐标0 有两个食物 返回坐标1 2
const tablePositions = {    
    1: [new Vec3(0, 0, 0)],  
    2: [new Vec3(33, 0, 0)],
    3: [new Vec3(66, 0, 0)],
    4: [new Vec3(99, 0, 0)],  
    5: [new Vec3(132, 0, 0)],
    6: [new Vec3(165, 0, 0)]
};

@ccclass('CustomerManager')
export class CustomerManager extends Component {

    @property(Node)
    foodParentNode: Node | null = null; // 食物的父节点

    @property(Prefab)
    customerPrefab: Prefab | null = null; // 顾客的预制体

    @property(Node)
    waitingPoint: Node | null = null; // 顾客生成点

    @property(Prefab)
    foodPrefab: Prefab = null;

    @property(Node)
    tableParent: Node | null = null; // 桌子的位置

    private isResetting: boolean = false;

    private _GameBoard: GameBoard = null;
    private tables: { foodItem: { type: number, node: Node } | null, isOccupied: boolean }[] = [];
    private foodNodes: Node[] = []; 
     
   
    private gemGroupCountMap: { [key: number]: number } = {};
    private queue: Array<CustomerComponent> = []; // 排队的顾客数组
    private waiting: { [position: number]: CustomerComponent | null } = {};

    private customersToServeByType: { [type: number]: number } = {}; // 按类型记录需要服务的顾客数量-等待区
    private nodePool: NodePool; // 对象池

    private clearAllGameElements() {
        // 标记正在重置
        this.isResetting = true;

        // 1. 清理等待区的顾客
        for (const key in this.waiting) {
            const customer = this.waiting[key];
            if (customer) {
                customer.movement.stopAllActions();
                this.recycleCustomer(customer.node);
            }
        }
        this.waiting = {1: null, 2: null, 3: null, 4: null, 5: null, 6: null};

        // 2. 清理排队区的顾客
        for (const customer of this.queue) {
            if (customer) {
                customer.node['processingFood'] = false;
                customer.node['currentOperationId'] = null;
                customer.movement.stopAllActions();
                this.recycleCustomer(customer.node);
            }
        }
        this.queue = [];

        // 3. 清理桌子上的食物
        if (this.tables) {
            for (const table of this.tables) {
                if (table && table.foodItem && table.foodItem.node) {
                    const foodNode = table.foodItem.node;
                    // 停止所有动作
                    foodNode.getComponent(FoodItem).stopAllAnimations();
                    // 标记为非活跃
                    foodNode['isActive'] = false;
                    // 回收到对象池
                    this.nodePool.release(this.foodPrefab, foodNode);
                }
            }
        }
        this.tables = [];

        // 4. 清理所有飞行中的食物节点
        for (const foodNode of this.foodNodes) {
            if (foodNode && foodNode.isValid) {
                foodNode.getComponent(FoodItem).stopAllAnimations();
                foodNode['isActive'] = false;
                this.nodePool.release(this.foodPrefab, foodNode);
            }
        }
        this.foodNodes = [];

        // 5. 清理父节点
        if (this.waitingPoint) {
            this.waitingPoint.removeAllChildren();
        }
        if (this.foodParentNode) {
            this.foodParentNode.removeAllChildren();
        }

        // 6. 重置所有计数器和状态
        this.customersToServeByType = {};
        this.gemGroupCountMap = {};
    }
    /**
     * 初始化顾客管理器
     * @param gameBoard 总脚本
     * @param gemGroupCountMap 顾客类型和数量
     * @param nodePool 对象池
     */
    init(gameBoard: GameBoard, gemGroupCountMap: { [key: number]: number }, nodePool: NodePool) {
       this.clearAllGameElements();
        this.nodePool = nodePool;
        if (this.nodePool) {
            this.nodePool.initializePool(this.customerPrefab); // 初始化池
            this.nodePool.initializePool(this.foodPrefab); // 初始化池
        }
        this._GameBoard = gameBoard;
        this.gemGroupCountMap = gemGroupCountMap;
     //   console.error("gemGroupCountMap", gemGroupCountMap);
        // 初始化桌子
        this.initTable();
        // 初始化等待区
        this.initWaitingArea();
        // 初始化顾客类型计数
        this.initCustomerTypeCount();
        // 清除食物节点
        this.clearFoodNodes();
         // 重置完成
         this.isResetting = false;
          // 初始化顾客管理器
          this.initCustomerManager();
       
    }
    /**
     * 初始化等待区
     */
    initWaitingArea() {
        this.waitingPoint.removeAllChildren();
        this.waiting = {1: null, 2: null, 3: null, 4: null, 5: null, 6: null};
    }
    
    /**
     * 清除食物节点
     */
    clearFoodNodes() {
        for (const foodNode of this.foodNodes) {
            if (foodNode && foodNode.isValid) {
                foodNode['isActive'] = false;
                this.nodePool.release(this.foodPrefab, foodNode);
            }
        }
        this.foodNodes = [];
    }

    initCustomerTypeCount() {
        this.customersToServeByType = JSON.parse(JSON.stringify(this.gemGroupCountMap));
    }
    /**
     * 初始化桌子
     */
    initTable() {
        // 初始化一个包含8个元素的数组
        this.tables = Array(8).fill(null).map(() => ({
            foodItem: null,
            isOccupied: false
        }));
    }
    /**
     * 初始化顾客管理器
     */
    initCustomerManager() {
        let waitingCount = 0;
        let queueCount = 0;
        let totalCount = 0;
        Object.keys(this.gemGroupCountMap).forEach((key, index) => {
            const customerType = parseInt(key);
            totalCount += this.gemGroupCountMap[customerType];
            if (waitingCount < 6) {
                waitingCount++;
                this.spawnOneCustomer(true, customerType, waitingCount); // 生成等待区的顾客
            } 
            if (totalCount > 9 && queueCount < 3) {
                queueCount++;
                this.spawnOneCustomer(false, customerType, queueCount); // 生成排队区的顾客
            }
        });
    }
    /**
     * 更新顾客类型计数
     * @param customerType 顾客类型
     * @param change 变化值
     */
    updateCustomerTypeCount(customerType: number, change: number) {
        if (this.customersToServeByType[customerType] !== undefined) {
            this.customersToServeByType[customerType] += change;
            if (this.customersToServeByType[customerType] < 0) {
                this.customersToServeByType[customerType] = 0;
            }
        } else {
            this.customersToServeByType[customerType] = Math.max(0, change);
        }
     //   console.error("updateCustomerTypeCount finished", this.customersToServeByType, this.queue.map(customer => customer.customerType));
    }
    /**
     * 生成一个顾客
     * @param isWaiting 是否在等待区
     * @param customerType 顾客类型 1-6
     * @param index 顾客索引 0-5
     * @returns 
     */
    
    spawnOneCustomer(isWaiting: boolean, customerType: number, index: number) {
        if (this.isResetting) {
            console.log('系统正在重置中，跳过创建顾客');
            return;
        }
        if (!this.customerPrefab || !this.waitingPoint) return;
        // 从对象池获取顾客节点
        const newCustomerNode = this.nodePool.acquire(this.customerPrefab);
        const customerComp = newCustomerNode.getComponent(CustomerComponent);
        if (!customerComp) return;
    
        // 设置基础属性
        newCustomerNode.setParent(this.waitingPoint);
        this.updateCustomerState(customerComp, CustomerState.None);
        if (isWaiting) {
         //   console.log('顾客等待区初始化========', customerType);
            this.initWaitingCustomer(customerComp, customerType);
        } else {
            // console.log('顾客排队区初始化========', customerType);
            this.initQueueCustomer(customerComp, customerType, index, newCustomerNode);
        }
    }
    /**
     * 初始化等待区顾客
     */
    private initWaitingCustomer(customerComp: CustomerComponent, customerType: number) {
        const tableId = this.findEmptyWaitingId();
        if (tableId === null) return;
        // 初始化顾客并更新状态
        customerComp.init(customerType, tableId, true);
        this.updateWaitingArea(customerComp, 1);
        this.updateCustomerTypeCount(customerType, -1);
        this.updateCustomerState(customerComp, CustomerState.Idle);
    }

    /**
     * 初始化排队区顾客
     */
    private initQueueCustomer(
        customerComp: CustomerComponent, 
        customerType: number, 
        index: number,
        customerNode: Node
    ) {
        // 初始化顾客
        customerComp.init(customerType, index, false);
        customerNode.setSiblingIndex(0);
        
        // 直接设置为排队状态
        this.updateCustomerState(customerComp, CustomerState.JoiningQueue);
    }
    findAreaCustomer(type: number): CustomerComponent | null {
        const matchingCustomers = [];
        
        for (const key in this.waiting) {
            const customer = this.waiting[key];
            if (customer && 
                customer.customerType === type && 
                customer.currentState === CustomerState.Idle) {
                matchingCustomers.push(customer);
            }
        }
    
        // 如果找到多个匹配的顾客，返回第一个空闲的
        for (const customer of matchingCustomers) {
            if (!customer.node['processingFood']) {
                return customer;
            }
        }
    
        console.log(`未找到类型为 ${type} 的空闲客户。`);
        return null; 
    }
  
    // 在 CustomerManager 类中添加一个新的方法来统一处理顾客状态的更新
    updateCustomerState(customer: CustomerComponent, newState: CustomerState, callback?: () => void, node?: Node) {
    // 每个状态更新都带有操作ID
    if (this.isResetting) {
        console.log('系统正在重置中，跳过状态更新');
        return;
    }
    const operationId = `${customer.tableId}_${Date.now()}`;
    
    console.log(`Updating customer ${customer.tableId} state from ${CustomerState[customer.currentState]} 
        to ${CustomerState[newState]}`);
    
    customer.updateState(newState);
    // 根据新状态进行额外的逻辑处理
    switch (newState) { // Idle -> Eating -> IsReturning 
        case CustomerState.Idle:
            // 检查桌子上有没有食物
             // 顾客类型总计数减一
             // 检查桌子
             this.checkTable(customer);
             callback && callback();
            break;
            case CustomerState.Eating:
                if (!customer.node['processingFood']) {
                    this.handleEatingState(customer, node);
                    callback && callback();
                } else {
                    console.log(`Customer ${customer.tableId} is already processing food`);
                }
                break;
        case CustomerState.WaitingEat:
            // 处理顾客等待吃食物逻辑
             // 如果没有找到匹配的顾客，将食物放置到空桌子上
            this.handlePlaceFoodOnEmptyTable(customer.customerType, node);
            callback && callback();
            break;
        case CustomerState.EatingWatingEat:
            this.flyFoodToCustomer(customer);
            callback && callback();
            break;
        case CustomerState.IsReturning: 
            customer.node['processingFood'] = false;
            customer.node['currentOperationId'] = null;
            // 等待区删除这一个
            this.updateWaitingArea(customer, -1);
            // 处理顾客返回逻辑
            this.customerReturn(customer);
            // 更新队列
            this.updateQueue();
            callback && callback();
            break;
        case CustomerState.MovingToWaitingArea:
            // 处理顾客移动到等待区的逻辑
            this.formQueneToWaiting(customer);
            // 更新排队区
            this.enqueueIfPossible();
            callback && callback();
            break;
        case CustomerState.JoiningQueue:
            // 排队区➕一个
            this.queue.push(customer);
            // 顾客类型总计数减一
            this.updateCustomerTypeCount(customer.customerType, -1);
            callback && callback();
            break;
        // 添加其他状态的处理逻辑
        default:
            break;
    }
}

 /**
 * 处理顾客进入用餐状态的逻辑
 * @param customer 当前用餐的顾客
 * @param clickPosition 点击消除的位置
 */
private createFoodNode(
    sourceNode: Node, 
    targetPosition: Vec3, 
    customerType: number, 
    onComplete?: (foodNode: Node) => void,
    isStatic: boolean = false
): Node {
    if (this.isResetting) {
        console.log('系统正在重置中，跳过创建食物节点');
        return null;
    }
    const canvas = sourceNode.parent?.parent?.parent;
    if (!canvas) return null;
    
    // 计算起始位置
    const nodePos = sourceNode.position;
    const parentPos = sourceNode.parent.position;
    const centerPos = sourceNode.parent.parent.position;
    const posInCanvas = new Vec3(
        nodePos.x + parentPos.x + centerPos.x,
        nodePos.y + parentPos.y + centerPos.y,
        0
    );

    // 转换到 foodParent 空间
    const startPosition = this.foodParentNode.getComponent(UITransform)
        .convertToNodeSpaceAR(canvas.getComponent(UITransform)
            .convertToWorldSpaceAR(posInCanvas));

    // 创建食物节点
    const foodNode = this.nodePool.acquire(this.foodPrefab);
    if (!foodNode) return null;

    foodNode.setParent(this.foodParentNode);
    foodNode.active = true;
    foodNode.setPosition(startPosition);
    
    const foodComponent = foodNode.getComponent(FoodItem);
    if (!foodComponent) return null;

    this.foodNodes.push(foodNode);

    // 为每个食物节点创建独立的生命周期标志
    foodNode['isActive'] = true;
    
    foodComponent.init(customerType, isStatic, () => {
        if (foodNode && foodNode.isValid && foodNode['isActive']) {
            onComplete?.(foodNode);
        }
    }, targetPosition);

    return foodNode;
}

private handleEatingState(customer: CustomerComponent, node: Node) {
    customer.node['processingFood'] = true;
    let tableNode = this.tableParent.children[customer.tableId - 1];
    const targetPosition = this.foodParentNode.getComponent(UITransform)
        .convertToNodeSpaceAR(tableNode.getWorldPosition());
    
    // 为这个特定的食物和顾客创建唯一标识
    const operationId = `${customer.tableId}_${Date.now()}`;
    customer.node['currentOperationId'] = operationId;
    
    let foodNode = this.createFoodNode(
        node,
        targetPosition, 
        customer.customerType,
        () => {
            // 确保这个回调属于当前操作
            if (customer.node['currentOperationId'] !== operationId) {
                console.log('Operation cancelled - customer has new operation');
                this.removeFoodNode(foodNode);
                return;
            }

            if (!foodNode || !foodNode.isValid) return;
            
            let firstCom = foodNode.getComponent(FoodItem);
            if (!firstCom) return;

            firstCom.blinkAndFadeOut(() => {
                if (foodNode && foodNode.isValid) {
                    console.log(`Eating finished for customer ${customer.tableId}`);
                    customer.node['processingFood'] = false;
                    this.updateCustomerState(customer, CustomerState.IsReturning);
                    this.removeFoodNode(foodNode);
                }
            });
        }
    );
}

/**
 * 从食物节点列表中移除指定节点
 * @param foodNode 要移除的食物节点
 */
private removeFoodNode(foodNode: Node) {
    if (!foodNode || !foodNode.isValid) return;

    // 标记节点不再活跃
    foodNode['isActive'] = false;
    
    const index = this.foodNodes.indexOf(foodNode);
    if (index > -1) {
        this.foodNodes.splice(index, 1);
    }

    // 确保节点仍然有效才进行回收
    if (foodNode.isValid) {
        this.nodePool.release(this.foodPrefab, foodNode);
    }
}
formQueneToWaiting(customer: CustomerComponent) {
    let emptyId = this.findEmptyWaitingId();
    if (emptyId) {
        let waypoints = [...QueueMoveConfig.waypoints[emptyId]];
        customer.tableId = emptyId;
        // 只更新等待区状态，不更改客户状态（因为在updateQueue中已经设置了）
        this.updateWaitingArea(customer, 1); 
        
        customer.movement.startMovingThroughWaypoints(QueueMoveConfig.speed, waypoints, ()=>{
            // 只有当客户仍在MovingToWaitingArea状态时才更新为Idle
            if (customer.currentState === CustomerState.MovingToWaitingArea) {
                this.updateCustomerState(customer, CustomerState.Idle);
            }
        });
    } else {
        console.error('No available customer to form quene.');
    }
}
    
    /**
     * 服务顾客
     * @param type 顾客类型
     * @param localPosition 食物位置
     */
    /**
 * 服务顾客
 * @param type 顾客类型
 * @param node 宝石消除的节点
 */
    serveSkewer(type: number, node: Node) {
        let customer = this.findAreaCustomer(type);
        console.log(`Attempting to serve skewer type ${type} to customer`, customer?.tableId);
        if (customer) { 
            this.updateCustomerState(customer, CustomerState.Eating, null, node);
        } else {
            console.log(`No available customer for type ${type}, placing in waiting area`);
            this.handlePlaceFoodOnEmptyTable(type, node);
        }
    }
/**
 * 处理将食物放置到空桌子的逻辑
 * @param type 食物类型
 * @param node 宝石节点
 */
private handlePlaceFoodOnEmptyTable(type: number, node: Node) {
    let tableIndex = this.tables.findIndex(t => !t.isOccupied);
    let table = this.tables[tableIndex];
    
    if (tableIndex === -1) {
        console.error("No empty table available");
        return;
    }

    const positions = tablePositions[tableIndex + 1];
    const targetPosition = positions[0];

    // 先创建食物节点
   let foodNode = this.createFoodNode(
        node,
        targetPosition,
        type,
        () => {
            // 创建完成后再放置到桌子上
            this.placeFoodOnTable(table, type, foodNode);
            console.log("Food placed on table successfully");
            
        },
        true // 设置为静态食物
    );

}

private placeFoodOnTable(
    table: { foodItem: { type: number, node: Node } | null, isOccupied: boolean },
    type: number,
    foodNode: Node
): void {
    // 找到桌子在数组中的索引
    const tableIndex = this.tables.findIndex(t => t === table);
    if (tableIndex === -1) {
        console.error("Table not found in tables array.");
        return;
    }

    // 直接更新数组中的对象，而不是局部变量
    this.tables[tableIndex] = {
        foodItem: { type, node: foodNode },
        isOccupied: true
    };

    console.log(`Food placed on table ${tableIndex + 1}:`, this.tables[tableIndex], this.tables);
}

    customerReturn(customer: CustomerComponent) {
        let waypoints = [...CustomerMoveConfig.waypoints[customer.tableId]];
        customer.movement.startMovingThroughWaypoints(CustomerMoveConfig.speed, waypoints, ()=>{
           // console.log('customer return finished');    
        });
    }
    updateWaitingArea(customer: CustomerComponent, change: number) {
        if (change < 0) {
            Object.keys(this.waiting).forEach(key => {
                if (this.waiting[key] === customer) {
                    this.waiting[key] = null;
                }
            });
        } else if (change > 0) {
            const position = Object.keys(this.waiting).find(key => this.waiting[key] === null);
            if (position) {
                this.waiting[position] = customer;
            }
        }
        // Log current waiting and queue customers
        console.log('Current waiting customers:', 
            Object.keys(this.waiting)
                .map(key => this.waiting[key])
                .filter(c => c !== null)
                .map(c => c.customerType)
        );
     console.log('Current queue customers:', this.customersToServeByType);
    }
    private findEmptyWaitingId(): number | null {
        const emptyPositionKey = Object.keys(this.waiting).find(key => this.waiting[key] === null);
        return emptyPositionKey ? parseInt(emptyPositionKey) : null;
    }
    /**
     * 更新队列 将一个排队区的顾客放入到等待区
     */ 
    updateQueue() {
        let emptyId = this.findEmptyWaitingId();
        console.log('updateQueue', this.queue, emptyId);
        if (this.queue.length > 0 && emptyId) {
            let firstQueueCustomer = this.queue.shift();
            firstQueueCustomer.tableId = emptyId;
            this.updateCustomerState(firstQueueCustomer, CustomerState.MovingToWaitingArea);
        }
    }
    /**
 * 将食物从桌子飞向顾客
 * @param table 食物所在的桌子
 * @param customer 目标顾客
 */

private flyFoodToCustomer(customer: CustomerComponent) {
    for (let table of this.tables) {    
        if (table.foodItem && table.foodItem.type === customer.customerType) {
            console.error(`Food type ${table.foodItem.type} found for customer type ${customer.customerType}`);
            // 获取目标位置
            const targetPosition = this.getCustomerTablePosition(customer);
            // 执行食物飞行动画
            this.animateFoodFlight(table.foodItem.node, targetPosition, customer, ()=>{
                this.clearTableState(table);
            });
            
            break;
        }
    } 
}

/**
 * 清理桌子状态
 */
private clearTableState(table: { foodItem: { type: number, node: Node } | null, isOccupied: boolean }) {
    const tableIndex = this.tables.findIndex(t => t === table);
    if (tableIndex !== -1) {
        this.tables[tableIndex].isOccupied = false;
        this.tables[tableIndex].foodItem = null;
    }
}

/**
 * 获取顾客所在桌子的位置
 */
private getCustomerTablePosition(customer: CustomerComponent): Vec3 {
    const tableNode = this.tableParent.children[customer.tableId - 1];  
    const targetPosition = this.foodParentNode.getComponent(UITransform)
        .convertToNodeSpaceAR(tableNode.getWorldPosition());
    
    return targetPosition;
}

/**
 * 执行食物飞行动画
 */
private animateFoodFlight(foodNode: Node, targetPosition: Vec3, customer: CustomerComponent, callback: () => void) {
    // 执行移动动画
    tween(foodNode)
        .to(0.5, { position: targetPosition })
        .start();

    // 设置食物动画完成后的回调
    const foodComponent = foodNode.getComponent(FoodItem);
    foodComponent.init(customer.customerType, true, () => {
        foodComponent.blinkAndFadeOut(()=>{
            console.error("foodComponent blinkAndFadeOut finished");
            callback();
        });
        this.updateCustomerState(customer, CustomerState.IsReturning);
    }, targetPosition);
}
    checkTable(customer: CustomerComponent) {
         // 获取客户所在桌子的索引
         // 遍历所有桌子，检查食物类型是否与客户需求匹配
         let foundMatchingFood = false;
       // console.log(this.tables, 'tables');
        Array.from(this.tables).forEach(table => {
            if (table.foodItem && table.foodItem.type === customer.customerType) {
                console.error(`找到食物类型 ${table.foodItem.type} 匹配顾客类型 ${customer.customerType}`);
                foundMatchingFood = true;
                console.error("更新顾客状态", table);
                this.updateCustomerState(customer, CustomerState.EatingWatingEat);
            }
        });
    }
    private enqueueIfPossible() {
        // 检查队列是否可以接受更多顾客，并且是否有顾客等待服务
        if (this.queue.length < 3) {
            // 获取所有待服务的顾客类型
            const typesWithCustomers = Object.keys(this.customersToServeByType)
                .filter(type => this.customersToServeByType[type] > 0);
            if (typesWithCustomers.length > 0) {
                // 随机选择一个有剩余顾客的类型
                const randomType = typesWithCustomers[Math.floor(Math.random() * typesWithCustomers.length)];
                let customerType = parseInt(randomType);
                this.queue.forEach((customer, index) => {
                    if (index < 2) { 
                        let waypoints = [...EnterQueueMoveConfig.waypoints[index + 1]];
                        customer.movement.startMovingThroughWaypoints(EnterQueueMoveConfig.speed, waypoints, () => {
                         //   console.log(`Customer moved to position ${index + 1}`);
                        });
                    }
                });
                this.spawnOneCustomer(false, customerType, this.queue.length + 1); // 将顾客加入队列
            }
        }
    }
    // 回收顾客节点
    recycleCustomer(customerNode: Node) {
        if (customerNode) {
            customerNode.removeFromParent(); // 从父节点中移除顾客节点
            this.nodePool.release(this.customerPrefab, customerNode); // 将顾客节点放回对象池
        }
      //  console.error("recycleCustomer finished", this.waitingPoint.children);
    }
}