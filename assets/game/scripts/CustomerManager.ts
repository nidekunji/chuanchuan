import { _decorator, Canvas, Component, Node, Prefab, tween, UITransform, Vec3 } from 'cc';
import { CustomerComponent } from './CustomerComponent';
import { NodePool } from '../../common/scripts/NodePool'; // 确保路径正确
import { GameBoard } from '../script/Test';
import { FoodItem } from './FoodItem';
import { CustomerState } from '../../core/scripts/define/Enums';
import { CustomerMoveConfig, EnterQueueMoveConfig, QueueMoveConfig } from '../../app/config/GameConfig';

const { ccclass, property } = _decorator;
const waitingPositions = {
    1: new Vec3(-86, 92, 0),
    2: new Vec3(-163, -51, 0),
    3: new Vec3(-11, -50, 0),
    4: new Vec3(111, -31, 0),
    5: new Vec3(228, -55, 0),
    6: new Vec3(235, 100, 0)
};
const queuePositions = {
    1: new Vec3(48, 191, 0),
    2: new Vec3(27, 243, 0),
    3: new Vec3(8, 258, 0)
};
// 只有一个食物在桌子上就返回坐标0 有两个食物 返回坐标1 2
const tablePositions = {    
    1: [new Vec3(-196, 401, 0), new Vec3(-92, 282, 0), new Vec3(-53, 282, 0)],  
    2: [new Vec3(-156, 401, 0), new Vec3(39, 282, 0), new Vec3(77, 282, 0)],
    3: [new Vec3(-126, 401, 0), new Vec3(168, 282, 0), new Vec3(208, 282, 0)],
    4: [new Vec3(-96, 401, 0), new Vec3(-92, 282, 0), new Vec3(-53, 282, 0)],  
    5: [new Vec3(-66, 401, 0), new Vec3(39, 282, 0), new Vec3(77, 282, 0)],
    6: [new Vec3(-36, 401, 0), new Vec3(168, 282, 0), new Vec3(208, 282, 0)]
};

@ccclass('CustomerManager')
export class CustomerManager extends Component {
    @property(Prefab)
    customerPrefab: Prefab | null = null; // 顾客的预制体

    @property(Node)
    waitingPoint: Node | null = null; // 顾客生成点

    @property(Prefab)
    foodPrefab: Prefab = null;

    @property(Node)
    tableParent: Node | null = null; // 桌子的位置

    private _GameBoard: GameBoard = null;
    private tables: { foodItem: { type: number, node: Node } | null, isOccupied: boolean }[] = [];
    private foodNodes: Node[] = []; 
     
   
    private gemGroupCountMap: { [key: number]: number } = {};
    private queue: Array<CustomerComponent> = []; // 排队的顾客数组
    private waiting: { [position: number]: CustomerComponent | null } = {};

    private customersToServeByType: { [type: number]: number } = {}; // 按类型记录需要服务的顾客数量-等待区
    private nodePool: NodePool; // 对象池

    onLoad() {
        
    }
    /**
     * 初始化顾客管理器
     * @param gameBoard 总脚本
     * @param gemGroupCountMap 顾客类型和数量
     * @param nodePool 对象池
     */
    init(gameBoard: GameBoard, gemGroupCountMap: { [key: number]: number }, nodePool: NodePool) {
        console.error("customer manager init");
        this.nodePool = nodePool;
        if (this.nodePool) {
            this.nodePool.initializePool(this.customerPrefab); // 初始化池
            this.nodePool.initializePool(this.foodPrefab); // 初始化池
        }
        this._GameBoard = gameBoard;
        this.gemGroupCountMap = gemGroupCountMap;
        console.error("gemGroupCountMap", gemGroupCountMap);
        // 初始化桌子
        this.initTable();
        // 初始化等待区
        this.initWaitingArea();
        // 初始化顾客类型计数
        this.initCustomerTypeCount();
        // 初始化顾客管理器
        this.initCustomerManager();
        
        // 清除食物节点
        this.clearFoodNodes();
    }
    /**
     * 初始化等待区
     */
    initWaitingArea() {
        this.waitingPoint.removeAllChildren();
        this.waiting = {1: null, 2: null, 3: null, 4: null, 5: null, 6: null};
        console.error("initWaitingArea finished", this.waitingPoint.children);
    }
    
    /**
     * 清除食物节点
     */
    clearFoodNodes() {
        this.foodNodes.forEach(node => {
            this.nodePool.release(this.foodPrefab, node); // Release node back to the pool
        });
        this.foodNodes = []; // Clear the list
    }
    initCustomerTypeCount() {
        this.customersToServeByType = JSON.parse(JSON.stringify(this.gemGroupCountMap));
    }
    /**
     * 初始化桌子
     */
    initTable() {
        this.tables = [];
        for (let i = 0; i < 8; i++) {
            this.tables.push({ foodItem: null, isOccupied: false });
        }
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
        if (!this.customerPrefab || !this.waitingPoint) return;
        // 更新等待区顾客类型计数
        const newCustomerNode = this.nodePool.acquire(this.customerPrefab); // 从对象池获取一个顾客节点
        const customerComp = newCustomerNode.getComponent(CustomerComponent);
        if (customerComp) {
            if (isWaiting) {
                const tableId = this.findEmptyWaitingId(); 
                if (tableId !== null) {
                    newCustomerNode.setParent(this.waitingPoint);
                    customerComp.init(customerType, tableId, isWaiting);// 会设置为Idle
                    this.updateWaitingArea(customerComp, 1);
                    this.updateCustomerTypeCount(customerType, -1);
                    this.updateCustomerState(customerComp, CustomerState.Idle);
                }
            }  else {
                // 排队区
                newCustomerNode.setParent(this.waitingPoint);
                customerComp.init(customerType, index, isWaiting);
                newCustomerNode.setSiblingIndex(0);
                // 设置为排队中
                this.updateCustomerState(customerComp, CustomerState.JoiningQueue);
            }
        }
    }
    findAreaCustomer(type: number): CustomerComponent | null {
        for (const key in this.waiting) {
            const customer = this.waiting[key];
            if (customer && customer.customerType === type && customer.currentState === CustomerState.Idle) {
                return customer;
            }
        }
        console.log(`未找到类型为 ${type} 的客户。`);
        return null; 
    }
    // 在 CustomerManager 类中添加一个新的方法来统一处理顾客状态的更新
updateCustomerState(customer: CustomerComponent, newState: CustomerState, callback?: () => void) {
        if (!customer) {
            console.error("Attempted to update state of a null customer.");
            return;
        }
    // 打印状态变更日志，便于调试
    console.log(`Updating customer state from ${CustomerState[customer.currentState]} to ${CustomerState[newState]}`);

    // 更新顾客的状态
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
            // 处理顾客吃食物逻辑       
           // this.checkTable(customer);
           callback && callback();
        break;
        case CustomerState.WaitingEat:
            // 处理顾客等待吃食物逻辑
            callback && callback();
            break;
        case CustomerState.IsReturning: 
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
    formQueneToWaiting(customer: CustomerComponent) {
        let emptyId = this.findEmptyWaitingId();
        if (emptyId) {
            let waypoints = [...QueueMoveConfig.waypoints[emptyId]];
            customer.tableId = emptyId;
            this.updateWaitingArea(customer, 1); 
            customer.movement.startMovingThroughWaypoints(QueueMoveConfig.speed, waypoints, ()=>{
                this.updateCustomerState(customer, CustomerState.Idle);
            });
        } else {
            console.error('No available customer to form quene.');
        }
    }
    private placeFoodOnTable(table: { foodItem: { type: number, node: Node } | null, isOccupied: boolean }, type: number, foodNode: Node): {
        tableIndex: number,
        position: Vec3
    } {
        if (table.isOccupied) {
            console.error("Table is already occupied.");
            return { tableIndex: -1, position: new Vec3() };
        }
    
        table.foodItem = { type: type, node: foodNode };
        // 确保只有在成功放置食物后才标记为已占用
        if (table.foodItem.node) {
            table.isOccupied = true;
        }
    
        const tableIndex = this.tables.indexOf(table);
        const positions = tablePositions[tableIndex+1];
        return {
            tableIndex,
            position: positions[0]
        };
    }
    /**
     * 服务顾客
     * @param type 顾客类型
     * @param localPosition 食物位置
     */
    serveSkewer(type: number, localPosition: Vec3) {
        // 生成食物
        const foodNode = this.nodePool.acquire(this.foodPrefab);
        let canvas = this.node.scene.getComponentInChildren(Canvas);
        foodNode.setParent(canvas.node);
        foodNode.setPosition(localPosition);
        foodNode.active = true;
        const com = foodNode.getComponent(FoodItem);
        this.foodNodes.push(foodNode);
        // 找到顾客
        let customer = this.findAreaCustomer(type);
        if (customer) {
            // 更改顾客状态
          
            // 顾客存在，将食物放置到顾客所在的桌子
            let tableNode = this.tableParent.children[customer.tableId - 1]; 
            let worldPosition = tableNode.getWorldPosition();
            let canvas = this.node.scene.getComponentInChildren(Canvas);
            let positionRelativeToCanvas = canvas.node.getComponent(UITransform).convertToNodeSpaceAR(worldPosition);
            this.updateCustomerState(customer, CustomerState.Eating);
            com.init(type, true, ()=>{
                com.blinkAndFadeOut();
                this.updateCustomerState(customer, CustomerState.IsReturning);
            }, positionRelativeToCanvas);
        } else {
            // 顾客不存在，将食物放置到第一个空桌子
            const tableIndex = this.tables.findIndex(t => !t.isOccupied); // Find index of the first unoccupied table
            if (tableIndex !== -1) {
                const table = this.tables[tableIndex];
                const { position } = this.placeFoodOnTable(table, type, foodNode);
                com.init(type, true, ()=>{
                  //  console.log('foodItem aimi finished', tableIndex, this.tables);
                }, position);
            } else {
                console.error('No available table found to place food.');
            }
        }
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
    // Function to animate food flying to the customer's table and then serve the customer
    flyFoodToCustomer(table: { foodItem: { type: number, node: Node } | null, isOccupied: boolean }, customer: CustomerComponent) {
        if (table.foodItem) {
            let foodNode = table.foodItem.node;
            if (foodNode) {
                const tableIndex = this.tables.findIndex(t => t === table);
                    if (tableIndex !== -1) {
                        this.tables[tableIndex].isOccupied = false; // Mark the table as unoccupied
                        this.tables[tableIndex].foodItem = null; // Clear the food item from the table
                }
                let tableNode = this.tableParent.children[customer.tableId - 1]; 
                let worldPosition = tableNode.getWorldPosition();
                let canvas = this.node.scene.getComponentInChildren(Canvas);
                let positionRelativeToCanvas = canvas.node.getComponent(UITransform).convertToNodeSpaceAR(worldPosition);
                    tween(foodNode)
                    .to(0.5, { position: positionRelativeToCanvas }) // 0.5秒内移动到目标位置
                    .start(); // 开始执行动画
                    foodNode.getComponent(FoodItem).init(customer.customerType, true, ()=>{
                    foodNode.getComponent(FoodItem).blinkAndFadeOut();
                    this.updateCustomerState(customer, CustomerState.IsReturning);
                }, positionRelativeToCanvas);
            }
        }
    }
    checkTable(customer: CustomerComponent) {
         // 获取客户所在桌子的索引
         // 遍历所有桌子，检查食物类型是否与客户需求匹配
         let foundMatchingFood = false;
         for (let table of this.tables) {
             if (table.foodItem && table.foodItem.type === customer.customerType) {
                 console.error(`Food type ${table.foodItem.type} found for customer type ${customer.customerType}`);
                 foundMatchingFood = true;
                 this.updateCustomerState(customer, CustomerState.WaitingEat, ()=>{

                    this.flyFoodToCustomer(table, customer);
                 });
                 break; // 如果找到匹配的食物，退出循环
             }
         }

         if (!foundMatchingFood) {
             console.log(`No matching food found for customer type ${customer.customerType}`);
         }
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