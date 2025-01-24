import { _decorator, Component, find, instantiate, Prefab, Node, UITransform, Vec3 } from 'cc';
import { StorageSlot } from '../../core/scripts/define/Types';
import { ResourceManager } from '../../common/scripts/ResourceManager';
import { LocalStorageManager } from '../../common/scripts/LocalStorageManager';
import { LocalCacheKeys } from '../../app/config/GameConfig';

const { ccclass, property } = _decorator;

@ccclass('FoodStorageManager')
export class FoodStorageManager extends Component {

    private tableParent: Node = null;    // 表格父节点引用

    private readonly TOTAL_SLOTS = 6;        // 总格子数
    private readonly INITIAL_UNLOCKED = 3;   // 初始解锁数
    
    // 存放区数据：固定6个位置的数组
    private storageSlots: StorageSlot[] = [];
    start() {
        this.init();
    }
    /**
     * 初始化存放区
     */
    public init(cachedData?: StorageSlot[]) {
        const loadedData = cachedData || this.loadCachedStorageData();
        
        this.storageSlots = loadedData || Array(this.TOTAL_SLOTS).fill(null).map((_, index) => ({
            id: index,                             // 位置编号
            isUnlocked: index < this.INITIAL_UNLOCKED,  // 前3个默认解锁
            type: 0                                     // 初始为空
        }));
        this.node.removeAllChildren();
        this.updateAllSlots();
        this.tableParent = find("Canvas/Center/Table")
    }
    public clearStorageAndReinit() {
        // 清除本地缓存
        LocalStorageManager.removeItem(LocalCacheKeys.FoodStorage);
        // 重新初始化（使用默认值）
        this.init();
    }
    private loadCachedStorageData(): StorageSlot[] | null {
        const cachedData = LocalStorageManager.getItem(LocalCacheKeys.FoodStorage);
        if (!cachedData) {
            return null;
        }
        try {
            return JSON.parse(cachedData);
        } catch (error) {
            console.error('Failed to parse cached storage data:', error);
            return null;
        }
    }
     /**
     * 缓存存放区数据
     */
     private cacheStorageData() {
        const storageData = JSON.stringify(this.storageSlots);
        console.log('cacheStorageData', this.storageSlots);
        LocalStorageManager.setItem(LocalCacheKeys.FoodStorage, storageData);

    }
    private updateAllSlots() {
        // 遍历所有格子更新UI
        for (let i = 0; i < this.TOTAL_SLOTS; i++) {
            this.updateSlotUI(i);
        }
    }
    private updateSlotUI(slotId: number) {
        const state = this.getSlotDisplayState(slotId);
        if (state.locked) {
            this.showLockIcon(slotId);
        } else if (state.type === 0) {
            this.showEmptySlot(slotId);
        } else {
            this.showFood(slotId, state.type);
        }
    }
    public findEmptySlot(): number | null {
        return this.storageSlots.findIndex(slot => slot.isUnlocked && slot.type === 0);
    }
    public getSlotPosition(slotIndex: number): Vec3 | null {
        if (!this.tableParent || slotIndex < 0 || slotIndex >= this.tableParent.children.length) {
            console.error(`Invalid slot index: ${slotIndex}`);
            return null;
        }
    
        // 获取对应桌子节点
        const tableNode = this.tableParent.children[slotIndex];
        if (!tableNode) {
            console.error(`Table node not found for slot ${slotIndex}`);
            return null;
        }
    
        // 将桌子的世界坐标转换为 node 的本地坐标
        const targetPosition = this.node.getComponent(UITransform)
            .convertToNodeSpaceAR(tableNode.getWorldPosition());
        
        return targetPosition;
    }
    private loadPrefab(type: 'Lock' | 'Food', slotId: number, foodType?: number): Promise<void> {
        return new Promise((resolve, reject) => {
            const prefabPath = type === 'Lock' ? 'prefab/Lock' : `prefab/Food_${foodType}`;
            
            ResourceManager.loadResourceFromBundle('game', prefabPath, Prefab, (err, prefab) => {
                if (err || !prefab) {
                    console.error(`Failed to load ${type.toLowerCase()} prefab:`, err);
                    reject(err);
                    return;
                }
                const node = instantiate(prefab);
                node.name = `food_${type}`;

                // 移除现有节点
                const existingNode = this.node.children[slotId];
                if (existingNode) {
                    existingNode.removeFromParent();
                }
                
                // 获取对应表格位置的世界坐标
                const tableSlot = this.tableParent.children[slotId];
                if (tableSlot) {
                    const worldPos = tableSlot.worldPosition;
                    // 将世界坐标转换为节点的本地坐标
                    const localPos = this.node.getComponent(UITransform).convertToNodeSpaceAR(worldPos);
                    node.setPosition(localPos);
                }
                
                this.node.addChild(node);
                resolve();
            });
        });
    }

    private async showLockIcon(slotId: number) {
        await this.loadPrefab('Lock', slotId);
    }

    private async showFood(slotId: number, foodType: number) {
        await this.loadPrefab('Food', slotId, foodType);
    }
    private showEmptySlot(slotId: number) {
        // 实现显示空格子的逻辑
        if (!this.node) {
            return;
        }
        if (this.node.children.length <= slotId) {
            return;
        }
        if (this.node.children[slotId]) {
            this.node.children[slotId].removeFromParent();
        }
    }
    /**
     * 解锁位置的存放区
     * @param id 要解锁的位置id（3-5）
     * @returns 是否解锁成功
     */
    
    public unlockNextStorageSlot(): number {
        const nextUnlocked = this.storageSlots.find(slot => !slot.isUnlocked);
        if (nextUnlocked) {
            nextUnlocked.isUnlocked = true;
            this.cacheStorageData();
            return nextUnlocked.id;
        }
        return -1;
    }
    /**
     * 存放食物
     * @param foodType 食物类型
     * @returns 存放位置的id，失败返回-1
     */
    public storeFood(foodType: number): number {
        const emptySlot = this.storageSlots.find(slot => 
            slot.isUnlocked && slot.type === 0
        );
        
        if (emptySlot) {
            emptySlot.type = foodType;
            this.cacheStorageData(); // 添加缓存
            return emptySlot.id;
        }
        return -1;
    }

    /**
     * 从指定位置取走食物
     * @param slotId 位置id
     * @returns 食物类型，0表示失败
     */
    public takeFoodFromSlot(foodType: number): number {
        const slot = this.storageSlots.find(slot => 
            slot.isUnlocked && slot.type === foodType
        );
        
        if (slot) {
            slot.type = 0;
            this.cacheStorageData();
            return foodType;
        }
        return 0;
    }
    public findFoodTypeSlot(foodType: number): Node | null {
        const slotIndex = this.storageSlots.findIndex(slot => 
            slot.isUnlocked && slot.type === foodType
        );
        
        if (slotIndex === -1) {
            return null;
        }
        // Directly find the food node by its name pattern
      //  console.log('findFoodTypeSlot', this.storageSlots, slotIndex, foodType);
        const foodNodeName = `food_${foodType}`;
        return this.node.getChildByName(foodNodeName) || null;
    }

    /**
     * 获取存放区状态
     * @param id 可选，指定位置id。不传则返回所有位置状态
     */
    public getStorageSlot(id?: number): StorageSlot[] | StorageSlot {    
        if (typeof id === 'number') {
            if (id >= 0 && id < this.TOTAL_SLOTS) {
                return this.storageSlots[id];
            }
        }
        return this.storageSlots;
    }

    /**
     * 检查指定位置是否已解锁
     * @param id 位置id
     */
    public isSlotUnlocked(id: number): boolean {
        return this.storageSlots[id]?.isUnlocked || false;
    }

    public getSlotDisplayState(slotId: number): { type: number, locked: boolean } {
        const slot = this.storageSlots[slotId];
        if (!slot) {
            return { type: 0, locked: true };
        }
        
        return {
            type: slot.type,
            locked: !slot.isUnlocked
        };
    }
    /**
     * 检查是否可以存放食物
     * @param foodType 食物类型
     * @returns 是否可以存放
     */
    public hasAvailableSlot(): boolean {
        return this.storageSlots.some(slot => slot.isUnlocked && slot.type === 0);
    }
    public hasLockedSlots(): boolean {
        return this.storageSlots.some(slot => !slot.isUnlocked);
    }

    /**
     * 重置存放区（保持解锁状态）
     */
    public reset() {
        this.storageSlots.forEach((slot, index) => {
            slot.type = 0;  // 清空食物
            slot.isUnlocked = index < this.INITIAL_UNLOCKED;  // 重置解锁状态为初始状态
        });
        this.cacheStorageData(); // 更新缓存
        this.updateAllSlots(); // 更新UI显示
    }
}