import { _decorator, Canvas, Component, Node, Prefab, tween, UITransform, Vec3 } from 'cc';
import { CustomerComponent } from './CustomerComponent';
import { NodePool } from '../../common/scripts/NodePool'; // 确保路径正确
import { GameBoard } from '../script/Test';
import { FoodItem } from './FoodItem';
import { CustomerState } from '../../core/scripts/define/Enums';
import { CustomerMoveConfig, EnterQueueMoveConfig, LocalCacheKeys, QueueMoveConfig } from '../../app/config/GameConfig';
import { StorageSlot } from '../../core/scripts/define/Types';
import { FoodStorageManager } from './FoodStorageManager';
import { LocalStorageManager } from '../../common/scripts/LocalStorageManager';

const { ccclass, property } = _decorator;

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

    private isResetting: boolean = false;

    private _GameBoard: GameBoard = null;
   
    private foodNodes: Node[] = []; 
     
   
    private gemGroupCountMap: { [key: number]: number } = {};
    private queue: Array<CustomerComponent> = []; // 排队的顾客数组
    private waiting: { [position: number]: CustomerComponent | null } = {};

    private customersToServeByType: { [type: number]: number } = {}; // 按类型记录需要服务的顾客数量-等待区
    private nodePool: NodePool; // 对象池

    private readonly TOTAL_SLOTS = 6;        // 总格子数
    private readonly INITIAL_UNLOCKED = 3;   // 初始解锁数
    
    // 存放区数据：固定6个位置的数组
    private storageSlots: StorageSlot[] = [];

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
                customer.movement.stopAllActions();
                this.recycleCustomer(customer.node);
            }
        }
        this.queue = [];

        // 4. 清理所有飞行中的食物节点
        for (const foodNode of this.foodNodes) {
            if (foodNode && foodNode.isValid) {
                foodNode.getComponent(FoodItem).stopAllAnimations();
                foodNode['isActive'] = false;
                this.recycleFood(foodNode);
            }
        }
        this.foodNodes = [];
        // 5. 重置所有计数器和状态
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
        
         this.addStorageItem();
        // 初始化顾客类型计数
        this.initCustomerTypeCount();
         // 重置完成
         this.isResetting = false;
          // 初始化顾客管理器
          this.initCustomerManager();
    } 
    // 客人总数需要加上  
    addStorageItem() {
        let foodStorage = LocalStorageManager.getItem(LocalCacheKeys.FoodStorage);
        if (foodStorage) {
            try {
                // 确保我们有一个对象数组而不是字符串
                let foodStorageArray = typeof foodStorage === 'string' 
                    ? JSON.parse(foodStorage) 
                    : foodStorage;
    
                // 创建一个计数映射
                let typeCountMap = {};
                
                // 遍历存储数组并统计每种类型的数量
                foodStorageArray.forEach(slot => {
                    if (slot.type > 0) {  // 只统计有效的食物类型（大于0）
                        typeCountMap[slot.type] = (typeCountMap[slot.type] || 0) + 1;
                    }
                });
    
                // 将存储区的食物数量添加到总计数中
                for (let type in typeCountMap) {
                    this.gemGroupCountMap[type] = (this.gemGroupCountMap[type] || 0) + typeCountMap[type];
                }
    
                console.log("Updated gemGroupCountMap with storage items:", this.gemGroupCountMap);
            } catch (error) {
                console.error("Error parsing food storage data:", error);
            }
        }
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
        if (this.gemGroupCountMap) {
            this.customersToServeByType = JSON.parse(JSON.stringify(this.gemGroupCountMap));
        } else  {
            console.error("gemGroupCountMap is null");
            this.customersToServeByType = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0};
        }
    //    console.log(this.gemGroupCountMap, "gemGroupCountMap");
    }
    /**
     * 初始化顾客管理器
     */
    initCustomerManager() {
        // 检查是否有缓存的等待区数据
        const cachedWaitingData = LocalStorageManager.getItem(LocalCacheKeys.WaitingArea);
        
        if (cachedWaitingData) {
            // 使用缓存数据初始化等待区
            const waitingDataObj = JSON.parse(cachedWaitingData);
            console.error(waitingDataObj, "waitingDataObj");
            for (const key in waitingDataObj) {
                if (waitingDataObj[key]) {
                    this.createCustomer(true, waitingDataObj[key], parseInt(key));
                }
            }
        } else {
            // 如果没有缓存数据，按原来的逻辑初始化等待区
            let waitingCount = 0;
            Object.keys(this.customersToServeByType).forEach(key => {
                if (waitingCount < 6) {
                    waitingCount++;
                    this.createCustomer(true, parseInt(key), waitingCount);
                }
            });
        }
    
        // 初始化排队区（保持不变）
        let totalCount = 0;
        let queueCount = 0;
        Object.keys(this.customersToServeByType).forEach(key => {
            const customerType = parseInt(key);
            totalCount += this.customersToServeByType[customerType];
            if (totalCount > 9 && queueCount < 3) {
                queueCount++;
                this.createCustomer(false, customerType, queueCount);
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
    
    createCustomer(isWaiting: boolean, customerType: number, index?: number) {
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
          //  console.log('顾客等待区初始化========', customerType, index);
            this.initWaitingCustomer(customerComp, customerType, index);
        } else {
            console.log('顾客排队区初始化========', customerType);
            
            this.initQueueCustomer(customerComp, customerType, index, newCustomerNode);
        }
    }
    /**
     * 初始化等待区顾客
     * @param customerComp 顾客组件
     * @param customerType 顾客类型
     * @param index 顾客位置索引
     * @returns 
     */
    private initWaitingCustomer(customerComp: CustomerComponent, customerType: number, index?: number) {
        let standPointId = 0
        if (index && this.isWaitingPositionEmpty(index)) {
          //  console.log('有缓存空位，直接使用', index, "顾客类型：", customerType);
            standPointId = index;
        } else {
          //  console.log('没有缓存空位，需要找空位', index);
            standPointId = this.findEmptyWaitingId();
        }
       
        if (standPointId === null) return;
        // 初始化顾客并更新状态
        customerComp.init(customerType, standPointId, true);
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
    
        console.log(`Found ${matchingCustomers.length} matching customers`);
        
        // 如果找到多个匹配的顾客，返回第一个空闲的
        for (const customer of matchingCustomers) {
                console.log('Returning customer:', {
                    type: customer.customerType,
                    state: CustomerState[customer.currentState],
                    tableId: customer.tableId
                });
                return customer;
            
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
    
      //  console.log(`Updating customer ${customer.tableId} state from ${CustomerState[customer.currentState]} 
      //  to ${CustomerState[newState]}`);
    
    customer.updateState(newState);
    // 根据新状态进行额外的逻辑处理 Node-Idle/ Idle -> Eating -> IsReturning  
    // Idle -> EatingWatingEat -> IsReturning
    switch (newState) { // Idle -> Eating -> IsReturning 
        case CustomerState.Idle:
             this.checkTable(customer);
             callback && callback();
            break;
        case CustomerState.Eating:
            this.handleEatingState(customer, node);
            callback && callback();
            break;
        case CustomerState.WaitingEat:
            // 处理顾客等待吃食物逻辑
             // 如果没有找到匹配的顾客，将食物放置到空桌子上
            this.handlePlaceFoodOnEmptyTable(customer.customerType, node);
            callback && callback();
            break;
        case CustomerState.EatingWatingEat: // 顾客进入等待区 吃存放区的食物
            this.flyFoodToCustomer(customer, node); // 食物节点
            callback && callback();
            break;
        case CustomerState.IsReturning: 
            // 处理顾客返回逻辑
            this.customerReturn(customer);
            // 更新队列
            this.moveFirstQueueCustomerToWaiting();
            callback && callback();
            break;
        case CustomerState.MovingToWaitingArea:
            // 处理顾客排队移动到等待区的逻辑
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
 * 创建食物节点
 * @param sourceNode 点击的宝石节点
 * @param targetPosition 目标位置
 * @param customerType 顾客类型
 * @param onComplete 完成回调
 * @param isStatic 是否静态
 * @returns 
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
    const canvas = sourceNode.parent?.parent?.parent;// gem->cube->center->canvas
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
  //  foodNode.setSiblingIndex(0);
    foodNode.active = true;
    foodNode.setPosition(startPosition);
    foodNode.name = `food_${customerType}`;

    const foodComponent = foodNode.getComponent(FoodItem);
    if (!foodComponent) return null;

    this.foodNodes.push(foodNode);

    // 为每个食物节点创建独立的生命周期标志
    foodNode['isActive'] = true;
    
    // 食物生成动画之后飞向客户或者存放区的位置
    foodComponent.init(customerType, isStatic, () => {
        if (foodNode && foodNode.isValid && foodNode['isActive']) {
            onComplete?.(foodNode);
        }
    }, targetPosition);

    return foodNode;
}

private handleEatingState(customer: CustomerComponent, node: Node) {
    const targetPosition = this.getCustomerTablePosition(customer);
    
    // 为这个特定的食物和顾客创建唯一标识
    const operationId = `${customer.tableId}_${Date.now()}`;
    customer.node['currentOperationId'] = operationId;
    customer.stopFoodUIAnim();
    let foodNode = this.createFoodNode(
        node,
        targetPosition, 
        customer.customerType,
        () => {
            // 确保这个回调属于当前操作
            if (customer.node['currentOperationId'] !== operationId) {
                console.log('Operation cancelled - customer has new operation');
                this.recycleFood(foodNode)
                return;
            }

            if (!foodNode || !foodNode.isValid) return;
            
            let firstCom = foodNode.getComponent(FoodItem);
            if (!firstCom) return;
            // 这里要处理顾客头上食物出现绿色的勾
            firstCom.blinkAndFadeOut(() => {
                if (foodNode && foodNode.isValid) {
                    console.log(`Eating finished for customer ${customer.tableId}`);
                    this.updateCustomerState(customer, CustomerState.IsReturning);
                    this.recycleFood(foodNode);
                }
            });
        }
    );
}

formQueneToWaiting(customer: CustomerComponent) {
    let emptyId = this.findEmptyWaitingId();
    if (emptyId && customer.currentState === CustomerState.MovingToWaitingArea) {
        // 运动路径
        let waypoints = [...QueueMoveConfig.waypoints[emptyId]];
        customer.tableId = emptyId;
        // 只更新等待区状态，不更改客户状态（因为在updateQueue中已经设置了）
        this.updateWaitingArea(customer, 1); 
        
        customer.movement.startMovingThroughWaypoints(QueueMoveConfig.speed, waypoints, ()=>{
            // 只有当客户仍在MovingToWaitingArea状态时才更新为Idle
            this.updateCustomerState(customer, CustomerState.Idle);
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
    // 检查是否有 foodStorageManager
    let foodStorageManager = this.foodParentNode.getComponent(FoodStorageManager);
    if (!foodStorageManager) {
        console.error("FoodStorageManager is not initialized");
        return;
    }
    // 尝试找到一个空的存储位置
    const emptySlot = foodStorageManager.findEmptySlot();
    if (emptySlot === null) {
        console.error("No empty storage slot available");
        return;
    }
    console.error("存放食物的空位id", emptySlot)

    // 获取桌子的存储位置的世界坐标
    const targetPosition = foodStorageManager.getSlotPosition(emptySlot);
    if (!targetPosition) {
        console.error("Failed to get slot position");
        return;
    }

    // 创建食物节点并移动到存储位置
    let foodNode = this.createFoodNode(
        node,
        targetPosition,
        type,
        () => {
            // 在食物到达目标位置后，将其添加到存储管理器中
            foodStorageManager.storeFood(type, emptySlot);
            foodNode['isFlyingToStorage'] = false;
            console.error(`Food placed in storage slot ${emptySlot}`);
            let customer = this.findAreaCustomer(type);
            if (customer) {
                this.updateCustomerState(customer, CustomerState.Idle);
            }
        },
        true // 设置为静态食物
    );
    if (foodNode) {
        foodNode['isFlyingToStorage'] = true;
        foodNode['id'] = emptySlot;
    }
}

    customerReturn(customer: CustomerComponent) {
        if (customer.currentState === CustomerState.IsReturning) {
             // 等待区删除这一个
             this.updateWaitingArea(customer, -1);
            let waypoints = [...CustomerMoveConfig.waypoints[customer.tableId]];
            customer.movement.startMovingThroughWaypoints(CustomerMoveConfig.speed, waypoints, ()=>{
               this.recycleCustomer(customer.node);
            });
        }
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
    // Create a simplified data structure for storage
    const waitingAreaData = {};
    Object.keys(this.waiting).forEach(key => {
        const customer = this.waiting[key];
        if (customer) {
            waitingAreaData[key] = customer.customerType;
        }
    });
    console.log(waitingAreaData, "waitingAreaData");
    // Store the simplified data
    LocalStorageManager.setItem(LocalCacheKeys.WaitingArea, JSON.stringify(waitingAreaData));

    // Debug logging
    console.log('Current waiting customers:', 
        Object.keys(this.waiting)
            .map(key => this.waiting[key])
            .filter(c => c !== null)
            .map(c => c.customerType)
    );
    console.log('Current queue customers:', this.customersToServeByType);
}
    /**
     * 
     * @returns 返回等待区id
     */
    private findEmptyWaitingId(): number | null {
        const emptyPositionKey = Object.keys(this.waiting).find(key => this.waiting[key] === null);
        return emptyPositionKey ? parseInt(emptyPositionKey) : null;
    }
    private isWaitingPositionEmpty(position: number): boolean {
        return this.waiting[position] === null;
    }
 
    /**
     * 将第一个排队区顾客移动到等待区
     */
    moveFirstQueueCustomerToWaiting() {
        let emptyId = this.findEmptyWaitingId();
       // console.log('moveFirstQueueCustomerToWaiting', this.queue, emptyId);
        if (this.queue.length > 0 && emptyId) {
            let firstQueueCustomer = this.queue.shift();
            firstQueueCustomer.tableId = emptyId;
            this.updateCustomerState(firstQueueCustomer, CustomerState.MovingToWaitingArea);
        }
    }
    /**
 * 将食物从桌子飞向顾客
 * @param customer 目标顾客
 * @param node 食物节点
 */

private flyFoodToCustomer(customer: CustomerComponent, node: Node) {
    if (!node.isValid || !customer || !customer.node.isValid) {
        console.error("flyFoodToCustomer invalid customer or node");
        return;
    }
    let customerType = customer.customerType;
    let customerState = customer.currentState;
    if (customerState === CustomerState.EatingWatingEat) {
        const foodStorage = this.foodParentNode.getComponent(FoodStorageManager);
        // 顾客位置
        const targetPosition = this.getCustomerTablePosition(customer);
        // 执行食物飞行动画
        this.animateFoodFlight(node, targetPosition, customer, ()=>{
            let id = Number(node['_id'] || 0);
           let success = foodStorage.takeFoodFromSlot(customerType, id); // 更改存放区数据
           if (success) {
            console.error("foodStorage.takeFoodFromSlot success");
            this.recycleFood(node);
           }
        });
    }
}

/**
 * 获取顾客所在桌子的位置
 */
private getCustomerTablePosition(customer: CustomerComponent): Vec3 {
    // 获取客户节点下的 food 节点
    const foodNode = customer.node.getChildByName('food');
    if (!foodNode) {
        console.error('Food node not found in customer node');
        return Vec3.ZERO;
    }
    // 计算 food sprite 的世界坐标
    const worldPos = foodNode.getWorldPosition();
    
    // 将世界坐标转换到 foodParentNode 的本地坐标系
    const targetPosition = this.foodParentNode.getComponent(UITransform)
        .convertToNodeSpaceAR(worldPos);
    
    return targetPosition;
}

/**
 * 执行食物从存放区飞向顾客并更新状态为返回
 */
private animateFoodFlight(foodNode: Node, targetPosition: Vec3, customer: CustomerComponent, callback: () => void) {
    if (!foodNode.isValid || !customer || !customer.node.isValid) {
        console.error("animateFoodFlight invalid customer or node");
        return;
    }
    // 设置食物动画完成后的回调
    const foodComponent = foodNode.getComponent(FoodItem);
    if (!foodComponent) {
        console.error(" animateFoodFlight foodComponent not found");
        return;
    }
    foodComponent.init(customer.customerType, true, () => {
        foodComponent.blinkAndFadeOut(()=>{
            console.error("foodComponent blinkAndFadeOut finished");
            callback();
        });
        this.updateCustomerState(customer, CustomerState.IsReturning);
    }, targetPosition);
}
    checkTable(customer: CustomerComponent) {
        if (!customer) return;
        let customerType = customer.customerType;
        let customerState = customer.currentState;
        if (customerState === CustomerState.Idle) {
            const foodStorage = this.foodParentNode.getComponent(FoodStorageManager);
            const foodNode = foodStorage.findFoodTypeSlot(customerType);
            if (foodNode !== null && !foodNode['isFlyingToStorage']) {  // 只检查是否正在飞向存放区
                console.error("checkTable foodNode found", foodNode.getComponent(FoodItem));
                this.updateCustomerState(customer, CustomerState.EatingWatingEat, null, foodNode);
                return;
            }
        }
    }
    /**
     * 检查还有没有顾客需要服务放入排队区
     */
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
                this.createCustomer(false, customerType, this.queue.length + 1); // 将顾客加入队列
            }
        }
    }
    // 回收顾客节点
    recycleCustomer(customerNode: Node) {
        if (customerNode) {
            this.nodePool.release(this.customerPrefab, customerNode); // 将顾客节点放回对象池
        }
      //  console.error("recycleCustomer finished", this.waitingPoint.children);
    }
    recycleFood(foodNode: Node) {
        if (foodNode) {
            // 从 foodNodes 数组中移除
            const index = this.foodNodes.indexOf(foodNode);
            if (index > -1) {
                this.foodNodes.splice(index, 1);
            }
    
            // 将食物节点放回对象池
            this.nodePool.release(this.foodPrefab, foodNode);
    
            // 获取并检查存储区数据
            const foodStorage = this.foodParentNode.getComponent(FoodStorageManager);
            if (foodStorage) {
                const storageSlots = foodStorage.getStorageSlot();
                // 只输出有食物类型的槽位
                let occupiedSlots = [];
                if (Array.isArray(storageSlots)) {
                    occupiedSlots = storageSlots.filter(slot => slot.type > 0);
                } else if (storageSlots.type > 0) {
                    occupiedSlots = [storageSlots];
                }
                console.log("Occupied storage s lots:", occupiedSlots);
            }

            // 检查节点是否还在场景中
            console.log("Remaining food nodes in parent:", this.foodParentNode.children.length);
        }
    }
    
    public hasCustomerNeedingFood(type: number): boolean {
        return this.customersToServeByType[type] > 0;
    }
 

}
