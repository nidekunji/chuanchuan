import { _decorator, Component, find, instantiate, Prefab, Node, UITransform, Vec3 } from 'cc';
import { StorageSlot } from '../../core/scripts/define/Types';
import { ResourceManager } from '../../common/scripts/ResourceManager';
import { LocalStorageManager } from '../../common/scripts/LocalStorageManager';
import { LocalCacheKeys } from '../../app/config/GameConfig';
import { FoodItem } from './FoodItem';

const { ccclass, property } = _decorator;

@ccclass('FoodStorageManager')
export class FoodStorageManager extends Component {

    private tableParent: Node = null;    // 表格父节点引用

    private readonly TOTAL_SLOTS = 6;        // 总格子数
    private readonly INITIAL_UNLOCKED = 3;   // 初始解锁数
    
    // 存放区数据：固定6个位置的数组
    private storageSlots: StorageSlot[] = [];
    start() {
       // this.init();
    }
    /**
     * 初始化存放区
     */
    public init() {
        const loadedData = this.loadCachedStorageData();
        this.reset(); // 先读缓存再清空
        if (loadedData) {
            console.error(loadedData, "存放区有数据");
            this.storageSlots = loadedData;
            this.cacheStorageData();
        }
        this.tableParent = find("Canvas/Center/Table")
        this.updateAllSlots();
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
        LocalStorageManager.setItem(LocalCacheKeys.FoodStorage, storageData);
     //   console.error(storageData, "=======storageData save save save=======");

    }
    private updateAllSlots() {
        // 遍历所有格子更新UI
        for (let i = 0; i < this.TOTAL_SLOTS; i++) {
            this.updateSlotUI(i);
        }
    }
    private async updateSlotUI(slotId: number) {
        // 先清除当前slot的显示
        const state = this.getSlotDisplayState(slotId);
        try {
            if (state.locked) {
                await this.showLockIcon(slotId);
            } else if (state.type !== 0) {
                await this.showFood(slotId, state.type);
            }
            // 空格子的情况已经在开始时处理了
        } catch (error) {
            console.error(`Failed to update slot UI for slot ${slotId}:`, error);
        }
    }
    public findEmptySlot(): number | null {
        const emptySlot = this.storageSlots.find(slot => slot.isUnlocked && slot.type === 0);
        return emptySlot ? emptySlot.id : null;
    }
    /**
     * 获取指定位置的存放区位置
     * @param slotId 位置id 1-6
     * @returns 位置的世界坐标
     */
    public getSlotPosition(slotId: number): Vec3 | null {
        if (!this.tableParent || slotId < 0 || slotId > this.tableParent.children.length) {
            console.error(`Invalid slot index: ${slotId}`);
            return null;
        }

    
        // 获取对应桌子节点
        const tableNode = this.tableParent.children[slotId-1];
        if (!tableNode) {
            console.error(`Table node not found for slot ${slotId}`);
            return null;
        }
    
        // 将桌子的世界坐标转换为 node 的本地坐标
        const targetPosition = this.node.getComponent(UITransform)
            .convertToNodeSpaceAR(tableNode.getWorldPosition());
        // targetPosition.y +=5;
        return targetPosition;
    }
    private loadPrefab(type: 'Lock' | 'Food', slotId: number, foodType?: number): Promise<void> {
        return new Promise((resolve, reject) => {
            const prefabPath = type === 'Lock' ? 'prefab/Lock' : `prefab/Food`;
            
            ResourceManager.loadResourceFromBundle('game', prefabPath, Prefab, (err, prefab) => {
                if (err || !prefab) {
                    console.error(`Failed to load ${type.toLowerCase()} prefab:`, err);
                    reject(err);
                    return;
                }
                const node = instantiate(prefab);
                if (foodType) {
                    node.name = `food_${foodType}`;
                    let com = node.getComponent(FoodItem)
                    if (com) {
                        com.updateFoodImageByType(foodType);
                    } else {
                        console.error('FoodItem component not found');
                    }
                } 
                node['id'] = slotId+1;
                node.active = true;
                // 获取对应表格位置的世界坐标
                const targetPosition = this.getSlotPosition(slotId+1);
                if (targetPosition) {
                    node.setPosition(targetPosition);
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
            this.updateLockedSlotUI(nextUnlocked.id);
            return nextUnlocked.id;
        }
        return -1;
    }
    private updateLockedSlotUI(id: number) {
        for (let i = 0; i < this.node.children.length; i++) {
            const child = this.node.children[i];
            if (child['_id'] == String(id)) {
                child.active = false;
                break;
            }
        }
    }

    
    /**
     * 存放食物
     * @param foodType 食物类型
     * @returns 存放位置的id，失败返回-1
     */
    public async storeFood(foodType: number, id: Number): Promise<number> {
        const emptySlot = this.storageSlots.find(slot => 
            slot.isUnlocked && slot.type === 0 && slot.id === id
        );
        
        if (emptySlot) {
            // 先更新数据
            emptySlot.type = foodType;
            this.cacheStorageData();
        }
        return -1;
    }

    /**
     * 从指定位置取走食物
     * @param foodType 食物类型
     * @returns 食物类型，0表示失败 这里不更新UI UI节点需要执行动画
     */
    public async takeFoodFromSlot(foodType: number, id: number): Promise<number> {
        const slot = this.storageSlots.find(slot => 
            slot.isUnlocked && slot.type === foodType && slot.id === id
        );
        if (slot) {
            slot.type = 0;
            this.cacheStorageData();
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
        this.node.removeAllChildren();
        this.storageSlots = Array(this.TOTAL_SLOTS).fill(null).map((_, index) => {
            const slot = {
                id: index+1,
                type: 0,
                isUnlocked: index < this.INITIAL_UNLOCKED
            };
           // console.log(`Slot ${index} unlocked status:`, slot.isUnlocked); // 添加调试日志
            return slot;
        });
      //  console.log('All slots after reset:', this.storageSlots); // 添加调试日志
        this.cacheStorageData(); // 更新缓存
    }
}