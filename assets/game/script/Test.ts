import { _decorator, Component, Node, Prefab, instantiate, Vec3, UITransform, tween, Size, Label, Tween, SpriteFrame, Sprite, director, ParticleSystem, dragonBones, Animation, Color, UIOpacity } from 'cc';
import { Gem } from './Gem';
import { IBoardParams, IGemData, StorageSlot } from '../../core/scripts/define/Types';
import { Vector2 } from './Vector2';
import { TouchMgr } from '../scripts/TouchMgr';
import { BoardInitialConfig, levelConfig, LocalCacheKeys, NewUserBoardConfig, NewUserGameConfig, NormalGameConfig, uiLoadingConfigs } from '../../app/config/GameConfig';
import { LocalStorageManager } from '../../common/scripts/LocalStorageManager';
import { UIManager } from '../../common/scripts/UIManager';
import { EventDispatcher } from '../../common/scripts/EventDispatcher';
import { NodePool } from '../../common/scripts/NodePool';
import { AudioManager } from '../../common/scripts/AudioManager';
import { GameState } from '../../core/scripts/define/Enums';
import { CustomerManager } from '../scripts/CustomerManager';
import { sdk } from '../../sdk/sdk';
import { PropManager } from '../scripts/PropManager';
import { HelperManager } from '../scripts/HelperManager';
import { TipUI } from '../scripts/TipUI';
import { FoodStorageManager } from '../scripts/FoodStorageManager';
const { ccclass, property } = _decorator;

interface GemMove {
    from: { x: number, y: number };
    to: { x: number, y: number };
}
// 游戏存档数据接口
interface GameSaveData {
    gems: IGemData[];
    score: number;
    boardState: number[][];
    gemGroupCountMap: { [key: number]: number };
    storageSlots?: StorageSlot[] | StorageSlot  //食物存放区
    originalLevel?: number; // 玩家
}

@ccclass('GameBoard')
export class GameBoard extends Component {  
    @property(Node)
    tipNode: Node = null;

    @property(Animation)
    myAnimationTest: Animation = null;

    @property(Prefab)
    gemPrefab: Prefab = null;

    @property(Prefab)
    gemBgPrefab: Prefab = null;

    @property(Prefab)
    foodPrefab: Prefab = null;

    @property(Label)
    levelLabel: Label = null;
  
    
    @property(Label)
    coinLabel: Label = null;

    @property([SpriteFrame])
    gemSprites: SpriteFrame[] = [];

    @property({ type: Node })
    BorderNode: Node = null;

    @property({ type: Node })
    settingBtn: Node = null;

    @property({ type: Node })
    cubeNode: Node = null;

    @property({ type: Node })
    cubeNodeBg: Node = null;

    @property({ type: Node })
    customerManagerNode: Node = null;

    @property({type: Node})
    foodStorageNode: Node = null;

    public tipUI: TipUI = null;

    
    private isInitialized: boolean = false;
    
    public customerManager: CustomerManager = null;
    public propManager: PropManager = null;
    public helperManager: HelperManager = null;
    public foodStorageManager: FoodStorageManager = null;

    public board: Node[][] = [];
    public gems: number[][] = [];
    public _gemStartPos: Vec3 = new Vec3(0, 0, 0);
    private _level: number = 0;

    public score: number = 0;
    // 使用一个变量来存储当前的游戏状态
    private _currentState: GameState = GameState.Idle;

    // Add getter and setter for currentState
    public get currentState(): GameState {
        return this._currentState;
    }

    public set currentState(value: GameState) {
        this._currentState = value;
        
        // When state changes to Idle, check for game over
        if (value === GameState.Idle) {
            if (this.checkGameover()) {
               this.showGameFailUI();
            }

        }
    }
    public gemGroupCountMap: { [key: number]: number } = {};
    public boardParams: IBoardParams;
    public touchMgr: TouchMgr;
    private nodePool: NodePool;

    private highlightState = {
        clickedGem: null as Node | null,
        clickedPos: null as { x: number, y: number } | null,
        highlightedGems: [] as { x: number, y: number }[],
        originalType: null as number | null
    };

    private exchangeState: {
        isExchanging: boolean;
        firstGem: Node | null;
        firstPos: { x: number, y: number } | null;
    } = {
        isExchanging: false,
        firstGem: null,
        firstPos: null
    };
    onLoad() {
        if (!this.getComponent(UITransform)) {
            this.addComponent(UITransform);
        }
    }
    start() {
        this.init();
        this.startGame()

    }
    startGame() {
        this.scheduleOnce(() => {
            if (!this.loadGame()) {
                this.initBoard();
            } 
        }, 0);
    }
    initManager() {
        // 音效管理器
        const existingAudioManagerNode = director.getScene().getChildByName('AudioManagerNode');
        if (!existingAudioManagerNode) {
            const audioManagerNode = new Node('AudioManagerNode');
            audioManagerNode.addComponent(AudioManager);
            director.addPersistRootNode(audioManagerNode);
            this.checkAndPlayBackgroundMusic();
        }
        // 触摸管理器
        const touchNode = this.node.getChildByName('Center').getChildByName('TouchNode');
        this.touchMgr = touchNode.getComponent(TouchMgr);
        this.touchMgr.init(this);

        // 事件分发器
        const eventDispatcher = EventDispatcher.getInstance();
        if (eventDispatcher) {
            eventDispatcher.on('restartGame', this.resetGame.bind(this));
        } else {
            console.error("EventDispatcher not found!!!");
        }

        // 道具管理
        this.propManager = this.node.getComponent(PropManager);
        this.propManager.init(this);
        // 提示道具
        this.helperManager = this.node.getComponent(HelperManager);
        this.helperManager.init(this);
        // 公用提示UI
        this.tipUI = this.tipNode.getComponent(TipUI);
        this.tipUI.init();
        // 食物缓存区
        this.foodStorageManager = this.foodStorageNode.getComponent(FoodStorageManager)
        if (this.foodStorageManager) {
            this.foodStorageManager.init();
        } else {
            this.tipUI.showTips("FoodStorageManager not found"); 
        }
        if (this.customerManagerNode) {
            // 顾客管理器
            this.customerManager = this.customerManagerNode.getComponent(CustomerManager);
        }
       
    }
    initConfig() {
      //  LocalStorageManager.clearAllCache();
        let level = LocalStorageManager.getItem(LocalCacheKeys.Level)
        if (!level) {
            this._level = 1;
        } else {
            this._level = Number(level);
        }
        if (this._level === 1) {
            LocalStorageManager.removeItem(LocalCacheKeys.GameSave);
            this.updateLevel(this._level);
            this.boardParams = NewUserBoardConfig;
            LocalStorageManager.setItem(LocalCacheKeys.Level, this._level.toString());
            
        } else {
            this.updateLevel(this._level);
            this.boardParams = BoardInitialConfig;
        }
        this.score = 0;
        this.gemGroupCountMap = {};
        // 1. 初始化数组
        this.board = Array(this.boardParams.rows).fill(null).map(() => Array(this.boardParams.columns).fill(null));
        this.gems = Array(this.boardParams.rows).fill(null).map(() => Array(this.boardParams.columns).fill(0));
    }
  initBoardSize() {
     const startPosition = new Vec3(
        -this.boardParams.boardWidth / 2 + this.boardParams.gemWidth / 2,
        this.boardParams.boardHeight / 2 - this.boardParams.gemHeight / 2,
        0
    );
    this._gemStartPos = startPosition; 
    // 设置边框尺寸
    const offset = 20; // 边框与宝石之间的额外空间
    const transform = this.BorderNode.getComponent(UITransform);
    transform.setContentSize(new Size(
        this.boardParams.boardWidth + offset,
        this.boardParams.boardHeight + offset
    ));
    this.BorderNode.setPosition(this.cubeNode.getPosition());
    console.log("initBoardSize success")
}
    private checkAndPlayBackgroundMusic() {
        const audioManager = AudioManager.instance;
        if (audioManager) {
            audioManager.playBackgroundMusic('bgm');
        } else {
            console.error("AudioManager component not found on this node");
        }
    }
    private init() {
        this.currentState = GameState.Null;
        this.initConfig();
        this.initBoardSize();
        this.clearBoard();
        this.initPool();
        this.initManager();
        this.initUI();
    }
    private initUI() {
        if (this.settingBtn) {
            this.settingBtn.on(Node.EventType.TOUCH_END, this.onSettingsButtonClicked, this);
        }
        // // 设置边框尺寸 后续需要加动画
        // const transform = this.BorderNode.getComponent(UITransform);
        // let offset = 35;
        // transform.setContentSize(new Size(
        //     this.boardParams.boardWidth + offset,
        //     this.boardParams.boardHeight + offset
        // ));
        // this.BorderNode.setPosition(this.cubeNode.getPosition());

        // 初始化食物节点UI
        this.updateScoreUI(this.score);
    }
    private initPool() {
        // 检查预制体
        if (!this.gemPrefab || !this.gemBgPrefab || !this.foodPrefab) {
            console.error('预制体未加载:', {
                gemPrefab: !!this.gemPrefab,
                gemBgPrefab: !!this.gemBgPrefab,
                foodPrefab: !!this.foodPrefab
            });
            return false;
        }

        try {
            // 如果已存在且有效，直接返回
            if (this.nodePool && this.isPoolValid()) {
                console.log('使用现有对象池');
                return true;
            }
    
            // 只有当对象池不存在或无效时，才创建新的对象池
            this.nodePool = new NodePool(150);
            this.nodePool.initializePool(this.gemPrefab);
            this.nodePool.initializePool(this.gemBgPrefab);
            this.nodePool.initializePool(this.foodPrefab);
    
            this.isInitialized = true;
            console.log('新对象池初始化成功');
            return true;
        } catch (error) {
            console.error('对象池初始化失败:', error);
            return false;
        }
    }

    // 检查对象池是否有效
    private isPoolValid(): boolean {
        if (!this.nodePool) return false;
        try {
            return this.nodePool.size(this.gemPrefab) >= 0 &&
                   this.nodePool.size(this.gemBgPrefab) >= 0 &&
                   this.nodePool.size(this.foodPrefab) >= 0;
        } catch (error) {
            console.error('对象池验证失败:', error);
            return false;
        }
    }

    // 获取节点的安全方法
    private safeAcquireNode(prefab: Prefab): Node {
        if (!this.isInitialized) {
            this.initPool();
        }

        if (!this.nodePool) {
            console.error('对象池未初始化');
            return instantiate(prefab);
        }

        try {
            return this.nodePool.acquire(prefab);
        } catch (error) {
            console.error('获取节点失败:', error);
            return instantiate(prefab);
        }
    }

    private onSettingsButtonClicked() {
        if (this.currentState !== GameState.Idle) {
            return;
        }
        const uiManager = UIManager.instance;
        uiManager.openUI(uiLoadingConfigs.SettingUrl);
    }
    onDestroy() {
        const eventDispatcher = EventDispatcher.getInstance();
        if (eventDispatcher) {
            eventDispatcher.off('restartGame', this.resetGame.bind(this));
        } else {
            console.error("EventDispatcher not found!!!");
        }
        // 取消设置按钮的事件监听
        if (this.settingBtn && this.settingBtn.isValid) {
            this.settingBtn.off(Node.EventType.TOUCH_END, this.onSettingsButtonClicked, this);
        }
    }
    
    private async initBoard() {
        // 填充棋盘数据
        let filledBoard: any;
        if (this._level === 1) {
            filledBoard = levelConfig[this._level];
        } else {
            filledBoard = this.fillBoard();
        }
        this.gems = filledBoard;
        this.validateGemCounts();
        this.customerManager.init(this, this.gemGroupCountMap, this.nodePool);
        
        // 设置当前状态为动画中
        this.currentState = GameState.Animating;
        try {
            const middleRow = Math.floor(this.boardParams.rows / 2);
            // 同时生成顶部和底部
            for (let offset = 0; offset < middleRow; offset++) {
                // 顶部行和底部行
                const topRow = offset;
                const bottomRow = this.boardParams.rows - 1 - offset;
                
                if (offset % 2 === 0) {
                    // 从右到左(顶部)和从左到右(底部)同时生成
                    for (let i = 0; i < this.boardParams.columns; i++) {
                        const promises = [];
                        // 顶部：从右到左
                        const topCol = this.boardParams.columns - 1 - i;
                        promises.push(this.createGemWithAnimation(topRow, topCol, filledBoard[topRow][topCol]));
                        
                        // 底部：从左到右
                        const bottomCol = i;
                        promises.push(this.createGemWithAnimation(bottomRow, bottomCol, filledBoard[bottomRow][bottomCol]));
                        
                        // 等待当前两个宝石都生成完成
                        await Promise.all(promises);
                    }
                } else {
                    // 从左到右(顶部)和从右到左(底部)同时生成
                    for (let i = 0; i < this.boardParams.columns; i++) {
                        const promises = [];
                        // 顶部：从左到右
                        const topCol = i;
                        promises.push(this.createGemWithAnimation(topRow, topCol, filledBoard[topRow][topCol]));
                        
                        // 底部：从右到左
                        const bottomCol = this.boardParams.columns - 1 - i;
                        promises.push(this.createGemWithAnimation(bottomRow, bottomCol, filledBoard[bottomRow][bottomCol]));
                        
                        // 等待当前两个宝石都生成完成
                        await Promise.all(promises);
                    }
                }
            }
    
            // 如果有中间行(奇数行的情况)，单独处理
            if (this.boardParams.rows % 2 !== 0) {
                // 中间行从右到左生成
                for (let col = this.boardParams.columns - 1; col >= 0; col--) {
                    await this.createGemWithAnimation(middleRow, col, filledBoard[middleRow][col]);
                }
            }
            UIManager.instance.openUI(uiLoadingConfigs.LayerUIUrl, ()=>{
                UIManager.instance.closeUI(uiLoadingConfigs.LayerUIUrl.name, 0)
            }, 2);
        } finally {
            this.openNewGuide()
            this.currentState = GameState.Idle;
        }
    }
    private createGem(row: number, col: number, type: number, isRemoved: boolean = false): Node {
        const startX = this._gemStartPos.x;
        const startY = this._gemStartPos.y;
        const localX = startX + col * (this.boardParams.gemWidth + this.boardParams.spacing);
        const localY = startY - row * (this.boardParams.gemHeight + this.boardParams.spacing);
       
        const gemBg = this.safeAcquireNode(this.gemBgPrefab);
        gemBg.scale = new Vec3(this.boardParams.scaleFactorWidth, this.boardParams.scaleFactorHeight, 1);
        gemBg.setPosition(new Vec3(localX, localY, 0));
        gemBg.active = true;
        this.cubeNodeBg.addChild(gemBg); 
        if (type === 0) {
            return gemBg;
        }
        const gem = this.safeAcquireNode(this.gemPrefab);
        if (!gem) {
            console.error("Gem prefab not found in node pool");
            return null;
        }
        gem.scale = new Vec3(this.boardParams.scaleFactor, this.boardParams.scaleFactor, 1);
        this.cubeNode.addChild(gem); 
        gem.active = true;
        const worldPos = this.cubeNode.getComponent(UITransform).convertToWorldSpaceAR(
            new Vec3(localX, localY, 0)
        );

        const gemComp = gem.getComponent(Gem);
        let gemData: IGemData = {
            type: type,
            isRemoved: isRemoved,
            gridPosition: new Vector2(col, row),
            worldPosition: new Vector2(worldPos.x, worldPos.y),
            scaleFactor: this.boardParams.scaleFactor,
            scaleFactorWidth: this.boardParams.scaleFactorWidth,
            scaleFactorHeight: this.boardParams.scaleFactorHeight,

        }
        gemComp.init(gemData);
        gem.setPosition(new Vec3(localX, localY, 0));
        gem.active = true;
        if (!this.board[row]) this.board[row] = [];
        this.board[row][col] = gem;
        return gem;
    }
    private async createGemWithAnimation(row: number, col: number, type: number): Promise<void> {
        const gem = this.createGem(row, col, type);
        if (!gem) return;
        if (type === 0) return;
        
        let uiOpacity = gem.getComponent(UIOpacity);
        if (!uiOpacity) {
            uiOpacity = gem.addComponent(UIOpacity);
        }
        // 获取Item子节点的Sprite组件
        const itemSprite = gem.getChildByName('Item')?.getComponent(Sprite);
        if (!itemSprite) return;
        
        // 初始状态设置
        gem.scale = new Vec3(0, 0, 0);
        uiOpacity.opacity = 255; // 设置为完全不透明
        itemSprite.color = new Color(0, 0, 0, 255); // 初始颜色设为黑色
        
        const originalPos = gem.position.clone();
        gem.setPosition(new Vec3(
            originalPos.x,
            originalPos.y + 100,
            originalPos.z
        ));

        return new Promise<void>((resolve) => {
            // 同时开始所有动画
            Promise.all([
                new Promise<void>(tweenResolve => {
                    tween(gem)
                        .parallel(
                            tween().to(0.03, { 
                                scale: new Vec3(
                                    this.boardParams.scaleFactor, 
                                    this.boardParams.scaleFactor, 
                                    1
                                )
                            }, {
                                easing: 'backOut'
                            }),
                            tween().to(0.03, { 
                                position: originalPos 
                            }, {
                                easing: 'quadOut'
                            })
                        )
                        .call(() => tweenResolve())
                        .start();
                }),
                new Promise<void>(tweenResolve => {
                    // 颜色渐变动画
                    tween(itemSprite)
                        .to(0.03, { 
                            color: new Color(255, 255, 255, 255) 
                        }, {
                            easing: 'quadOut'
                        })
                        .call(() => tweenResolve())
                        .start();
                })
            ]).then(() => resolve());

            // 音效
            // this.scheduleOnce(() => {
            //     AudioManager.instance.playSoundEffect('pop');
            // }, 0.033);
        });
    }
    findAllValidMatchSetups(board: number[][], rows: number, columns: number): {r: number, c: number}[][] {
        let allMatches = [];

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < columns; c++) {
                if (board[r][c] === 0) { // Check if the current position is empty
                    // Check horizontal possibility
                    if (c <= columns - 3 && [0, 1, 2].every(i => board[r][c + i] === 0)) {
                        allMatches.push([{ r, c }, { r, c: c + 1 }, { r, c: c + 2 }]);
                    }

                    // Check vertical possibility
                    if (r <= rows - 3 && [0, 1, 2].every(i => board[r + i][c] === 0)) {
                        allMatches.push([{ r, c }, { r: r + 1, c }, { r: r + 2, c }]);
                    }
                }
            }
        }

        return allMatches; // Return all found match setups
    }
    private fillBoard() {
        let rows = this.boardParams.rows;
        let columns = this.boardParams.columns;
        let gemTypes = this.boardParams.gemTypes;
        let initialMatches = this.boardParams.initialMatches;
    
        let board = Array(rows).fill(null).map(() => Array(columns).fill(0));
        let emptyPositions: Set<string> = new Set();
        let gemCounts = Array.from({ length: gemTypes }, () => 0);
        let initialTypes = Array.from({ length: gemTypes }, (_, i) => i + 1);
    
        // 初始化空位置
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < columns; c++) {
                emptyPositions.add(`${r},${c}`);
            }
        }
    
        // 生成初始三消
        for (let i = 0; i < initialMatches && emptyPositions.size >= 3; i++) {
            // 在每次循环迭代中调用 findAllValidMatchSetups 来获取当前有效的匹配设置
            const validMatchSetups = this.findAllValidMatchSetups(board, rows, columns);
          //  console.log('Valid Match Setups:', validMatchSetups);
            if (validMatchSetups.length === 0) {
                console.log("No valid positions available for placing new matches.");
                break; // 如果没有有效的位置，中断循环
            }

            // 选择一个有效的匹配设置
            let selectedSetup = validMatchSetups[Math.floor(Math.random() * validMatchSetups.length)];
            let type = initialTypes.length > 0 ? initialTypes.shift() : Math.floor(Math.random() * gemTypes) + 1;

            // 使用选定的匹配设置放置宝石
            selectedSetup.forEach(({ r, c }) => {
                board[r][c] = type;
                emptyPositions.delete(`${r},${c}`);
                gemCounts[type - 1]++;
            });
        }
      //  console.log(board, '==board===');
        // 确保每种类型至少有3个宝石
        // 使用您提供的逻辑填充剩余空位
        while (emptyPositions.size > 0) {
            let type = 0;
            if (initialTypes.length > 0) {
                let typeIndex = Math.floor(Math.random() * initialTypes.length);
                type = initialTypes[typeIndex];
                initialTypes.splice(typeIndex, 1); // 使用后从数组中删除该类型
              //  console.log(type, 'type initialTypes');
            } else {
                type = Math.floor(Math.random() * gemTypes) + 1; // 从所有类型中随机选择
              //  console.log(type, 'type random');
            }
            if (emptyPositions.size < 3) {
                emptyPositions.forEach(pos => {
                    let [r, c] = pos.split(',').map(Number);
                    let type = Math.floor(Math.random() * gemTypes) + 1;
                    board[r][c] = type;
                    gemCounts[type - 1]++;
                });
                break;
            }
    
            let positions: string[] = Array.from(emptyPositions);
            let index1 = Math.floor(Math.random() * positions.length);
            let [r1, c1] = positions[index1].split(',').map(Number);
            let adjacentPositions = [
                [r1, c1 + 1], [r1, c1 - 1], [r1 + 1, c1], [r1 - 1, c1]
            ].filter(([r, c]) => emptyPositions.has(`${r},${c}`) && r < rows && c < columns && r >= 0 && c >= 0);
    
            if (adjacentPositions.length > 0) {
                let [r2, c2] = adjacentPositions[Math.floor(Math.random() * adjacentPositions.length)];
                board[r1][c1] = type;
                board[r2][c2] = type;
                emptyPositions.delete(`${r1},${c1}`);
                emptyPositions.delete(`${r2},${c2}`);
                gemCounts[type - 1] += 2;
    
                if (emptyPositions.size > 0) {
                    let thirdPosIndex = Math.floor(Math.random() * Array.from(emptyPositions).length);
                    let pos = Array.from(emptyPositions)[thirdPosIndex];
                    let [r3, c3] = pos.split(',').map(Number);
                    board[r3][c3] = type;
                    emptyPositions.delete(`${r3},${c3}`);
                    gemCounts[type - 1]++;
                }
            } else {
                for (let i = 0; i < 3; i++) {
                    if (emptyPositions.size > 0) {
                        let positions = Array.from(emptyPositions);
                        let index = Math.floor(Math.random() * positions.length);
                        let pos = positions[index];
                        let [r, c] = pos.split(',').map(Number);
                        board[r][c] = type;
                        emptyPositions.delete(`${r},${c}`);
                        gemCounts[type - 1]++;
                    }
                }
            }
        }
    
        // 最后调整以确保每种宝石的数量是3的倍数
        for (let i = 0; i < gemCounts.length; i++) {
            while (gemCounts[i] % 3 !== 0) {
                let needed = 3 - (gemCounts[i] % 3);
                for (let r = 0; r < rows; r++) {
                    for (let c = 0; c < columns; c++) {
                        if (needed <= 0) break;
                        if (board[r][c] === i + 1) {
                            let possibleTypes = [];
                            for (let j = 0; j < gemCounts.length; j++) {
                                if (gemCounts[j] > 1 && j != i) {
                                    possibleTypes.push(j + 1);
                                }
                            }
                            if (possibleTypes.length > 0) {
                                let newTypeIndex = Math.floor(Math.random() * possibleTypes.length);
                                let newType = possibleTypes[newTypeIndex];
                                board[r][c] = newType;
                                gemCounts[i]--;
                                gemCounts[newType - 1]++;
                                needed--;
                            }
                        }
                    }
                    if (needed <= 0) break;
                }
            }
        }
        //console.log(board, 'Final board setup');
        return board;
    }
    private hasPossibleMatch(board: number[][]): boolean {
        // 检查每个位置是否可以形成三消
        for (let r = 0; r < board.length; r++) {
            for (let c = 0; c < board[r].length; c++) {
                const currentType = board[r][c];
                if (currentType === 0) continue; // 跳过空位
                
                // 检查是否能形成三消
                if (this.checkForMatch(board, r, c)) {
                    return true;
                }
            }
        }
        return false;
    }

    public checkForMatch(board: number[][], row: number, col: number): boolean {
        const type = board[row][col];
        if (type === 0) return false;  // 如果当前位置为空，则不能形成匹配
        // 检查水平方向匹配
        let count = 1;  // 包括当前位置的宝石
        // 向左检查
        for (let i = col - 1; i >= 0 && (board[row][i] === type || board[row][i] === 0); i--) {
            if (board[row][i] === type) {
                count++;
            }
        }
        // 向右检查
        for (let i = col + 1; i < board[row].length && (board[row][i] === type || board[row][i] === 0); i++) {
            if (board[row][i] === type) {
                count++;
            }
        }
        if (count >= 3) return true;  // 如果水平方向上的连续相同类型宝石数量达到3或以上，返回true
    
        // 检查垂直方向匹配
        count = 1;  // 重置计数器，再次包括当前位置的宝石
        // 向上检查
        for (let i = row - 1; i >= 0 && (board[i][col] === type || board[i][col] === 0); i--) {
            if (board[i][col] === type) {
                count++;
            }
        }
        // 向下检查
        for (let i = row + 1; i < board.length && (board[i][col] === type || board[i][col] === 0); i++) {
            if (board[i][col] === type) {
                count++;
            }
        }
        if (count >= 3) return true;  // 如果垂直方向上的连续相同类型宝石数量达到3或以上，返回true
    
        return false;  // 如果没有找到匹配，返回false
    }
    // 验证宝石数量并检查空位
    private validateGemCounts(): void {
        const gemCounts = new Array(this.boardParams.gemTypes + 1).fill(0); // Adjust array size based on gemType
        const emptySlots: { x: number, y: number }[] = []; // Array to store positions of empty slots
        // 统计每种宝石的数量并检查空位
        for (let i = 0; i < this.boardParams.rows; i++) {
            for (let j = 0; j < this.boardParams.columns; j++) {
                const gemType = this.gems[i][j];
                if (gemType === 0) {
                    emptySlots.push({ x: j, y: i }); // 记录空位的位置
                } else {
                    gemCounts[gemType]++;
                }
            }
        }
        this.gemGroupCountMap = {};
        for (let type = 1; type <= this.boardParams.gemTypes; type++) {
            this.gemGroupCountMap[type] = Math.floor(gemCounts[type] / 3);
        }
    //     // 输出统计结果
    //    console.log("=== Gem Distribution Validation ===");
    //     for (let type = 1; type <= this.boardParams.gemTypes; type++) {
    //         const count = gemCounts[type];
    //         console.log(`Type ${type}: ${count} gems (${count / 3} groups of 3)`);

    //         if (count % 3 !== 0) {
    //             console.error(`Error: Gem type ${type} count (${count}) is not divisible by 3!`);
    //         }
    //     }
    }
 
   /**
 * 处理推动移动后的状态更新和消除检查
 * @param moveResult 移动结果数组
 * @returns 是否发生了消除
 */
   private handleMultipleMatches(move: { to: { x: number, y: number } }, matchGroup: { x: number, y: number }[], gemType: number): boolean {
    // 清除之前的高亮状态
    this.resetHighlightState();
    // 获取目标宝石节点
    const targetGem = this.board[move.to.y][move.to.x];
    // 保存点击的宝石信息和匹配组
    this.highlightState.clickedGem = targetGem;
    this.highlightState.clickedPos = { x: move.to.x, y: move.to.y };
    this.highlightState.originalType = gemType;
    this.highlightState.highlightedGems = matchGroup.filter(
        p => p.x !== move.to.x || p.y !== move.to.y
    );

    // 将目标宝石置灰并高亮其他可以形成三消的宝石
    this.grayOutNonHighlightedGems();
    
    // 从高亮宝石中随机选择一个（不包括被点击的宝石）
    const randomHighlightPosition = this.getRandomHighlightedPosition(
        this.highlightState.highlightedGems,
        this.highlightState.clickedPos
    );
    
    if (randomHighlightPosition) {
        this.helperManager.showClickHint(randomHighlightPosition.x, randomHighlightPosition.y);
    }

    return true;
}
private openNewGuide() {
    if (this._level == 1)
    this.helperManager.showTips();
}
public async handlePushAndMatch(moveResult: { from: { x: number, y: number }, to: { x: number, y: number } }[], willMatch: boolean = true): Promise<boolean> {
        try {
            this.currentState = GameState.Processing;
            this.helperManager.hideClickHint();
            // 1. 更新宝石位置和数据
            await this.updateGemsPositions(moveResult);
            if (willMatch) {
                // 2. 检查是否有可消除的组合
                for (const move of moveResult) {
                    const gemType = this.gems[move.to.y][move.to.x];
                    // console.log(`\n检查目标位置 (${move.to.x}, ${move.to.y}) 的匹配`);
                    // console.log(`该位置的宝石类型: ${gemType}`);
        
                    const matchGroup = this.findMatchGroupAtPosition(
                        move.to.x,
                        move.to.y,
                        gemType
                    );
                      // 如果刚好是3个匹配，直接消除
                    if (matchGroup.length === 3) {
                        await this.handleMatchGroupElimination(matchGroup, gemType);
                        return true;
                    } // 如果超过3个匹配，进入选择模式
                    else if (matchGroup.length > 3) {
                        await this.handleMatchGroupElimination(matchGroup, gemType, move);
                        return true; 
                    }
                }
            } else {
                // console.log('执行移动...')
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error in handlePushAndMatch:', error);
            return false;
        } finally {
            this.openNewGuide()
            this.currentState = GameState.Idle;
        }
    }
    private findGemPosition(gem: Node): { x: number, y: number } | null {
        for (let y = 0; y < this.boardParams.rows; y++) {
            for (let x = 0; x < this.boardParams.columns; x++) {
                if (this.board[y][x] === gem) {
                    return { x, y };
                }
            }
        }
        return null;
    }
    /**
     * 处理匹配组消除逻辑
     * @param matchGroup 匹配组
     * @param clickedGemType 点击的宝石类型
     * @param move 移动信息/点击信息，可选
     */
    private async handleMatchGroupElimination(matchGroup: { x: number, y: number }[], 
        clickedGemType: number, move?: { to: { x: number, y: number } }): Promise<void> {
        this.currentState = GameState.Processing;
        // 1. 首先检查是否有顾客需要这种类型的食物
        try {
            const hasCustomerNeed = this.customerManager.findAreaCustomer(clickedGemType);
            if (!hasCustomerNeed) {
                // 2. 如果没有顾客需要，检查存放区
                if (!this.foodStorageManager) {
                    this.tipUI.showTips("FoodStorageManager not found"); 
                    return;
                }
                
                if (!this.foodStorageManager.hasAvailableSlot()) {
                    // 3. 如果存放区已满，检查是否有未解锁的存放区
                    if (this.foodStorageManager.hasLockedSlots()) {
                        const uiManager = UIManager.instance;
                        if (uiManager) {
                         uiManager.openUI(uiLoadingConfigs.CommonVedioUIUrl);
                        }
                       // this.tipUI.showTips("存放区已满，观看视频解锁新的存放区");
                    } else {
                        this.tipUI.showTips("存放区已满，请先清理存放区");
                    }
                    return;
                }
            }
        // 4. 只有在满足上述条件后，才处理匹配逻辑
        if (move) {
            // 进入选择模式
            this.handleMultipleMatches(move, matchGroup, clickedGemType);
            return;
        }

        // 5. 如果正好是3个匹配，执行消除逻辑
        await this.removeMatchGroup(matchGroup);
        } finally {
            this.openNewGuide()
            this.currentState = GameState.Idle;
        }
    }
    private getRandomHighlightedPosition(
        highlightedGems: { x: number, y: number }[], 
        clickedPos: { x: number, y: number }
    ): { x: number, y: number } | null {
        // 过滤掉被点击的宝石位置
        const availableGems = highlightedGems.filter(
            gem => gem.x !== clickedPos.x || gem.y !== clickedPos.y
        );
        if (availableGems.length === 0) return null;
        // 随机选择一个位置
        const randomIndex = Math.floor(Math.random() * availableGems.length);
        return availableGems[randomIndex];
    }
    public async onGemClicked(event: any) {
        try {
            if (this.currentState === GameState.Processing || this.currentState === GameState.Animating) {
                console.log('Currently processing or animating, ignoring click');
                return;
            }
            const gem = event.target;
            if (!gem || !gem.isValid) {
                console.warn('Invalid gem clicked');
                return;
            }

            const pos = this.findGemPosition(gem);
            if (!pos) {
                console.warn('Could not find gem position');
                return;
            }
            // 获取当前点击宝石的类型
            const clickedGemType = this.gems[pos.y][pos.x];
            if (!clickedGemType) {
                console.warn('Invalid gem type');
                return;
            }
            if (this.currentState === GameState.Exchanging) {
                if (!this.exchangeState.firstGem) {
                    // 选择第一个宝石
                    this.exchangeState.firstGem = gem;
                    this.exchangeState.firstPos = pos;
                    
                    // 高亮选中的宝石
                    this.highlightGem(gem, true);
                    this.tipUI.showTips("请选择第二个要交换的宝石");
                } else {
                   // 检查是否点击了同一个宝石
                    if (this.exchangeState.firstPos.x === pos.x && 
                        this.exchangeState.firstPos.y === pos.y) {
                        // 如果是同一个宝石，取消选择
                        this.resetExchangeState();
                        this.tipUI.showTips("已取消选择");
                    } else {
                        // 选择第二个宝石，执行交换
                        await this.executeExchange(this.exchangeState.firstPos!, pos);
                        
                        // 重置交换状态
                        this.resetExchangeState();
                    }
                }
                return;
            }
            // 如果已经有高亮状态，说明是在选择要消除的三个宝石
        if (this.highlightState.highlightedGems.length > 0) {
            // 检查是否点击了高亮的宝石
            if (!this.isHighlightedGem(pos)) {
                console.log('Must click a highlighted gem');
                return;
            }

            // 基于已有的匹配组选择要消除的三个宝石
            const threeGems = this.findThreeGemsIncluding(pos, this.highlightState.highlightedGems);
            if (threeGems.length === 3) {
                await this.handleMatchGroupElimination(threeGems, clickedGemType);
            }
            this.resetHighlightState();
            return;
        }

        // 新的点击，检查匹配组
        const matchGroup = this.findMatchGroupAtPosition(pos.x, pos.y, clickedGemType);

        // 如果正好是3个，直接消除
        if (matchGroup.length === 3) {
            await this.handleMatchGroupElimination(matchGroup, clickedGemType);
            return;
        }

        // 如果超过3个，进入选择模式
     // 修改现有的处理超过3个匹配的代码
        if (matchGroup.length > 3) {
            await this.handleMatchGroupElimination(matchGroup, clickedGemType, { to: pos });
            return;
        } else {
                 this.currentState = GameState.Animating;
                try {
                    await this.shakeMatchingGems(clickedGemType);
                } finally {
                    this.currentState = GameState.Idle;
                }
        }
        } catch (error) {
            console.error('Error in onGemClicked:', error);
            this.currentState = GameState.Idle;
        }
    }

    /**
 * 计算指定方向上可用的空位数量
 * @param gems 要推动的宝石数组
 * @param direction 推动方向
 * @returns 可用空位数量
 */
public countEmptySlots(gems: { x: number, y: number }[], direction: { dx: number, dy: number }): number {
        if (gems.length === 0) return 0;

        // 根据方向选择合适的宝石
        let targetGem = gems[0];
        for (const gem of gems) {
            if (direction.dx > 0 && gem.x > targetGem.x) {  // 向右取最右边的
                targetGem = gem;
            } else if (direction.dx < 0 && gem.x < targetGem.x) {  // 向左取最左边的
                targetGem = gem;
            } else if (direction.dy > 0 && gem.y < targetGem.y) {  // 向上取最上面的
                targetGem = gem;
            } else if (direction.dy < 0 && gem.y > targetGem.y) {  // 向下取最下面的
                targetGem = gem;
            }
        }

        let emptyCount = 0;

        if (direction.dx !== 0) {
            const y = targetGem.y;
            const startX = targetGem.x + direction.dx;

            for (let x = startX;
                direction.dx > 0 ? x < this.boardParams.columns : x >= 0;
                x += direction.dx) {
                if (this.gems[y][x] === 0) emptyCount++;
                else break;
            }
        } else {
            const x = targetGem.x;
            const startY = targetGem.y - direction.dy;  // 修改这里：改为减去direction.dy

            for (let y = startY;
                direction.dy > 0 ? y >= 0 : y < this.boardParams.rows;
                y -= direction.dy) {  // 保持这个不变
                if (this.gems[y][x] === 0) {
                    emptyCount++;
                    console.log(`Found empty slot at (${x}, ${y})`);  // 添加调试日志
                } else {
                    break;
                }
            }
        }
       // console.log(`Checking from (${targetGem.x}, ${targetGem.y}) in direction (${direction.dx}, ${direction.dy}), found ${emptyCount} empty slots`);  // 添加调试日志
        return emptyCount;
}
public findMatchGroupAtPosition(x: number, y: number, type: number, requireNumber: number = 3): { x: number, y: number }[] {
        // First check parameter validity
        if (!this.isValidPosition(x, y) || this.gems[y][x] === 0 || this.gems[y][x] !== type) {
            return [];
        }
        // Check horizontal direction
        const horizontalMatches = this.findMatchesInDirection(x, y, type, true, requireNumber);
        
        // Check vertical direction
        const verticalMatches = this.findMatchesInDirection(x, y, type, false, requireNumber);
       
        const allMatches = [];

        if (horizontalMatches.length >= requireNumber) {
            allMatches.push(...horizontalMatches);
        }
        
        if (verticalMatches.length >= requireNumber) {
            verticalMatches.forEach(vMatch => {
                const exists = allMatches.some(hMatch => 
                    hMatch.x === vMatch.x && hMatch.y === vMatch.y
                );
                if (!exists) {
                    allMatches.push(vMatch);
                }
            });
        }
        return allMatches.length >= requireNumber ? allMatches : [];
    }

    private findMatchesInDirection(x: number, y: number, type: number, isHorizontal: boolean, requireNumber: number = 3): 
    { x: number, y: number }[] {
        const sameTypePositions: { x: number, y: number }[] = [];
        
        // 检查点击位置的宝石类型
        const clickedGem = this.gems[y][x];
        if (clickedGem !== type) {
            return [];
        }

        // 从点击位置向左/上查找最多 (requireNumber-1) 个相同类型的宝石（可以跳过空位）
        let leftCount = 0;
        let i = isHorizontal ? x - 1 : y - 1;
        while (i >= 0 && leftCount < requireNumber - 1) {
            const currentGem = isHorizontal ? this.gems[y][i] : this.gems[i][x];
            
            if (currentGem === type) {
                sameTypePositions.unshift({
                    x: isHorizontal ? i : x,
                    y: isHorizontal ? y : i
                });
                leftCount++;
            } else if (currentGem !== 0) {
                // 如果遇到非空且非目标类型的宝石，停止搜索
                break;
            }
            // 如果是空位(0)，继续搜索
            i--;
        }

        // 添加点击位置
        sameTypePositions.push({ x, y });

        // 从点击位置向右/下查找最多 (requireNumber-1) 个相同类型的宝石（可以跳过空位）
        let rightCount = 0;
        i = isHorizontal ? x + 1 : y + 1;
        const maxLength = isHorizontal ? this.boardParams.columns : this.boardParams.rows;
        while (i < maxLength && rightCount < requireNumber - 1) {
            const currentGem = isHorizontal ? this.gems[y][i] : this.gems[i][x];
            
            if (currentGem === type) {
                sameTypePositions.push({
                    x: isHorizontal ? i : x,
                    y: isHorizontal ? y : i
                });
                rightCount++;
            } else if (currentGem !== 0) {
                // 如果遇到非空且非目标类型的宝石，停止搜索
                break;
            }
            // 如果是空位(0)，继续搜索
            i++;
        }

        // 只返回可以形成指定数量消除的组合
        const validMatches: { x: number, y: number }[] = [];
        
        if (sameTypePositions.length >= requireNumber) {
            const clickIndex = sameTypePositions.findIndex(pos => pos.x === x && pos.y === y);
            
            // 遍历所有可能的组合
            for (let start = Math.max(0, clickIndex - (requireNumber - 1)); 
                start <= clickIndex && start + requireNumber - 1 < sameTypePositions.length; 
                start++) {
                
                // 确保当前组合包含点击位置
                const end = start + requireNumber;
                if (start <= clickIndex && clickIndex < end) {
                    const combination = sameTypePositions.slice(start, end);
                    validMatches.push(...combination);
                }
            }
        }

        // 去重并返回结果
        return Array.from(new Set(validMatches.map(pos => JSON.stringify(pos))))
            .map(str => JSON.parse(str));
    }

    private calculateGemPosition(x: number, y: number): Vec3 {
        // 使用已有的棋盘参数
        const startX = -this.boardParams.boardWidth / 2 + this.boardParams.gemWidth / 2;
        const startY = this.boardParams.boardHeight / 2 - this.boardParams.gemHeight / 2;
        // 计算实际位置，考虑间距
        const posX = startX + x * (this.boardParams.gemWidth + this.boardParams.spacing);
        const posY = startY - y * (this.boardParams.gemHeight + this.boardParams.spacing);

        return new Vec3(posX, posY, 0);
    }
    async updateGemsPositions(moveResult: { from: { x: number, y: number }, to: { x: number, y: number } }[]) {
      //  console.log('=== Starting Position Update ===');
     //   console.log('Move result:', moveResult);
        // 先创建一个临时数组来存储新的状态
        const tempGems = this.gems.map(row => [...row]);
        const tempBoard = this.board.map(row => [...row]);

        // 先清除原始位置
        moveResult.forEach(move => {
            // 清除原始位置的数据
            tempGems[move.from.y][move.from.x] = 0;  // 设置为0表示空位
            tempBoard[move.from.y][move.from.x] = null;
        });
        moveResult.forEach(move => {
            // 获取原始位置的宝石数据
            const gemType = this.gems[move.from.y][move.from.x];
            const gemNode = this.board[move.from.y][move.from.x];
            const gem = gemNode.getComponent(Gem);

         //   console.log(`Moving gem type ${gemType} from (${move.from.x}, ${move.from.y}) to (${move.to.x}, ${move.to.y})`);

            // 在临时数组中更新位置
            tempGems[move.to.y][move.to.x] = gemType;
            tempBoard[move.to.y][move.to.x] = gemNode;

            // 计算新的世界坐标
            const newWorldPos = this.calculateGemPosition(move.to.x, move.to.y);

            // 更新宝石数据
            const gemData: IGemData = {
                type: gemType,
                isRemoved: false,
                gridPosition: new Vector2(move.to.x, move.to.y),
                worldPosition: new Vector2(newWorldPos.x, newWorldPos.y),
                scaleFactor: gem.data.scaleFactor
            };

            // 更新宝石组件数据和位置
            gem.init(gemData);
            gemNode.setPosition(newWorldPos);
        });
    //    console.log('tempGems', tempGems);
     //   console.log('tempBoard', tempBoard);
        // 完成所有移动后，更新实际的数组
        this.gems = tempGems;
        this.board = tempBoard;

        // 验证更新
//    //     console.log('\nFinal board state:');
//         for (let y = 0; y < this.boardParams.rows; y++) {
//             let row = '';
//             for (let x = 0; x < this.boardParams.columns; x++) {
//                 row += (this.gems[y][x] || '0') + ' ';
//             }
//          //   console.log(row);
//         }
    }
    // 修改 removeMatchGroup 方法确保正确更新数据
    private async removeMatchGroup(matches: { x: number, y: number }[]) {
        try {
            this.helperManager.hideTips();
            this.currentState = GameState.Processing;
    
            AudioManager.instance.playSoundEffect('remove');
            if (window['wx']) {
                window['wx'].vibrateShort()
            }
            const gem = this.board[matches[1].y][matches[1].x];
            const firstGemType = this.gems[matches[0].y][matches[0].x];
            if (gem) {
                this.onGemEliminated(firstGemType, gem);
            }
            // 创建所有宝石的消失动画
            const removePromises = matches.map(async pos => {
                const gem = this.board[pos.y][pos.x];
                if (!gem || !gem.isValid) {
                    console.warn(`Invalid gem at position ${pos.x}, ${pos.y}`);
                    return;
                }

                const gemComp = gem.getComponent(Gem);
                if (!gemComp || !gemComp.isValid) {
                    console.warn(`Invalid Gem component at position ${pos.x}, ${pos.y}`);
                    return;
                }
                // 先更新数据结构
                gemComp.setRemoved(true);
                // 明确设置为0表示空位
                this.gems[pos.y][pos.x] = 0;
                this.board[pos.y][pos.x] = null;
                // 执行消失动画
                return new Promise<void>((resolve) => {
                    if (!gem.isValid) {
                        resolve();
                        return;
                    }
                    tween(gem)
                        .sequence(
                            tween().to(0.1, { scale: new Vec3(1.2 * this.boardParams.scaleFactor,
                                 1.2 * this.boardParams.scaleFactor, 1.2 * this.boardParams.scaleFactor) }),
                            tween().to(0.2, { scale: new Vec3(0, 0, 0) })
                        )
                        .call(() => {
                            if (gem.isValid) {
                                this.nodePool.release(this.gemPrefab, gem);

                            }
                            resolve();
                        })
                        .start();
                });
            });
            // 等待所有动画完成
            await Promise.all(removePromises);
            // 假设所有匹配的宝石类型相同，获取第一个宝石的类型
           
            // 更新分数
            this.score += matches.length * 10;
            this.updateScoreUI(this.score);

            // 添加金币
            this.addCoins(matches.length);
            // 保存游戏状态
            this.saveGame();
            // 打印更新后的棋盘状态
            this.printBoardState();
            if (this.allGemEliminated()) {
                this.gameOver(() => {
                    this.resetGame();
                });
            }
        } catch (error) {
            console.error('Error in removeMatchGroup:', error);
        } finally {
            this.currentState = GameState.Idle;
        }
    }

    // 添加打印棋盘状态的辅助方法
    private printBoardState() {
        return
        console.log('\n当前棋盘数据:');
        for (let y = 0; y < this.boardParams.rows; y++) {
            let row = '';
            for (let x = 0; x < this.boardParams.columns; x++) {
                const gemNode = this.board[y][x];
                if (gemNode) {
                    const gemType = this.gems[y][x];
                    row += `${gemType} `; 
                } else {
                    row += '0 ';
                }
            }
            console.log(row.trim()); 
        }
        console.log('\n');
    }
    // 添加抖动效果方法
    private async shakeMatchingGems(gemType: number) {
        const shakingGems: Node[] = [];
        // 找出所有相同类型的宝石
        for (let y = 0; y < this.boardParams.rows; y++) {
            for (let x = 0; x < this.boardParams.columns; x++) {
                if (this.gems[y][x] === gemType) {
                    const gem = this.board[y][x];
                    if (gem) {
                        shakingGems.push(gem);
                    }
                }
            }
        }
        AudioManager.instance.playSoundEffect('clickFood');
        // 创建抖动动画
        const shakePromises = shakingGems.map(gem => {
            return new Promise<void>((resolve) => {
                const originalPos = gem.position.clone();

                tween(gem)
                    .sequence(
                        tween().by(0.05, { position: new Vec3(5, 0, 0) }),
                        tween().by(0.1, { position: new Vec3(-10, 0, 0) }),
                        tween().by(0.1, { position: new Vec3(10, 0, 0) }),
                        tween().by(0.1, { position: new Vec3(-10, 0, 0) }),
                        tween().by(0.1, { position: new Vec3(10, 0, 0) }),
                        tween().by(0.05, { position: new Vec3(-5, 0, 0) })
                    )
                    .call(() => {
                        gem.setPosition(originalPos);
                        resolve();
                    })
                    .start();
            });
        });

        await Promise.all(shakePromises);
    }
    /**
     * 检查推动宝石是否会形成匹配
     * @param moveResult 
     * @param requireMatch 是否需要匹配
     * @returns 1 形成三消 2 形成相邻 0 不形成
     */
    public checkPushWillMatch(moveResult: GemMove[]): number {
        const tempBoard = this.gems.map(row => [...row]);
        
        // 记录移动的宝石信息
        const gemMoves = moveResult.map(move => ({
            ...move,
            type: tempBoard[move.from.y][move.from.x]
        }));

        // 检查移动前是否有相邻的相同类型宝石，并记录这些宝石
        let preExistingMatchPairs: Array<{
            type: number,
            pos1: { x: number, y: number },
            pos2: { x: number, y: number }
        }> = [];

        for (const move1 of gemMoves) {
            for (const move2 of gemMoves) {
                if (move1 === move2) continue;
                if (move1.type === move2.type) {
                    // 检查是否水平或垂直相邻
                    if ((Math.abs(move1.from.x - move2.from.x) === 1 && move1.from.y === move2.from.y) ||
                        (Math.abs(move1.from.y - move2.from.y) === 1 && move1.from.x === move2.from.x)) {
                        // 记录这对相邻宝石
                        preExistingMatchPairs.push({
                            type: move1.type,
                            pos1: move1.from,
                            pos2: move2.from
                        });
                    }
                }
            }
        }
        // 模拟移动
        gemMoves.forEach(move => {
            tempBoard[move.from.y][move.from.x] = null;
        });
        gemMoves.forEach(move => {
            tempBoard[move.to.y][move.to.x] = move.type;
        });

        const originalGems = this.gems.map(row => [...row]);
        this.gems = tempBoard;

        try {
            let hasMatch = false;      // 是否形成三消
            let hasNewAdjacent = false; // 是否形成真正的新相邻

            // 检查移动后的匹配情况
            for (const move of gemMoves) {
                // 检查是否形成三消
                const matchGroup = this.findMatchGroupAtPosition(
                    move.to.x,
                    move.to.y,
                    move.type
                );
                if (matchGroup.length >= 3) {
                    hasMatch = true;
                    break;
                }

                // 检查相邻关系
                const adjacentGroup = this.findMatchGroupAtPosition(
                    move.to.x,
                    move.to.y,
                    move.type,
                    2
                );
                
                if (adjacentGroup.length >= 2) {
                    // 检查这个相邻关系是否是来自原来就相邻的宝石
                    const isPreExistingPair = preExistingMatchPairs.some(pair => {
                        return adjacentGroup.some(pos1 => 
                            adjacentGroup.some(pos2 => {
                                if (pos1 === pos2) return false;
                                // 检查这对相邻的宝石是否就是原来那对相邻的宝石
                                const isSamePair = (
                                    gemMoves.some(m => m.from.x === pair.pos1.x && m.from.y === pair.pos1.y && 
                                        m.to.x === pos1.x && m.to.y === pos1.y) &&
                                    gemMoves.some(m => m.from.x === pair.pos2.x && m.from.y === pair.pos2.y && 
                                        m.to.x === pos2.x && m.to.y === pos2.y)
                                );
                                return isSamePair;
                            })
                        );
                    });

                    if (!isPreExistingPair) {
                        hasNewAdjacent = true;
                    }
                }
            }

            // 判定逻辑
            if (hasMatch) {
                return 1; // 形成三消，一定是有效移动
            }
            
            if (preExistingMatchPairs.length > 0) {
                // 如果移动前有相邻，必须形成新的相邻才有效
                return hasNewAdjacent ? 2 : 0;
            } else {
                // 如果移动前没有相邻，形成任意相邻就有效
                return hasNewAdjacent ? 2 : 0;
            }

        } finally {
            this.gems = originalGems;
        }
    }
    

    private saveGame() {
        const gemData: IGemData[] = [];
        for (let i = 0; i < this.boardParams.rows; i++) {
            for (let j = 0; j < this.boardParams.columns; j++) {
                const node = this.board[i][j];
                if (node && node.isValid) {
                    const gem = node.getComponent(Gem);
                    if (gem && gem.isValid && !gem.isGemRemoved()) {
                        try {
                            const data = gem.getGemData();
                            gemData.push(data);
                        } catch (error) {
                            console.warn(`Failed to get gem data at [${i},${j}]:`, error);
                        }
                    }
                }
            }
        }
        const saveData: GameSaveData = {
            gems: gemData,
            score: this.score,
            boardState: this.gems,
            gemGroupCountMap: this.gemGroupCountMap,
        }; 
        let heistory = LocalStorageManager.getItem(LocalCacheKeys.GameSave)
        let originalLevel = this._level
        if (!heistory) {
            saveData.originalLevel = originalLevel
        }
        try {
            LocalStorageManager.setItem(LocalCacheKeys.GameSave, JSON.stringify(saveData));
        } catch (error) {
            console.error('Failed to save game:', error);
        }
    }
    // 辅助方法：检查位置是否有效
    public isValidPosition(x: number, y: number): boolean {
        return x >= 0 && x < this.boardParams.columns && y >= 0 && y < this.boardParams.rows;
    }

    private addCoins(count: number) {
        const coinsEarned = count * 5; // 假设每个消除的宝石获得5个金币
        console.log(`Earned ${coinsEarned} coins`);
        this.coinLabel.string = "" + this.score;
        // 在这里更新玩家的金币数量
        // 例如：this.coins += coinsEarned;
    }
    public getProgressFromProgressBar(): { currentScore: number, totalPossibleScore: number } {
        const totalGems = this.boardParams.rows * this.boardParams.columns; // Total number of gems
        const totalPossibleScore = totalGems * 5; // Each gem can earn 5 coins
        const currentScore = this.score; // Current score
        // console.error(currentScore, "currentScore", totalPossibleScore, "totalPossibleScore");
        return {
            currentScore: currentScore,
            totalPossibleScore: totalPossibleScore
        };
    }
    private updateScoreUI(newScore: number) {
        this.score = newScore;
        this.coinLabel.string = "" + this.score;
    }
 
    private loadGame(): boolean {
        const saveStr = LocalStorageManager.getItem(LocalCacheKeys.GameSave);
        if (!saveStr) return false;
        try {
            const saveData: GameSaveData = JSON.parse(saveStr);
           // console.error("===saveData====", saveData);
            this.updateScoreUI(saveData.score);
            this.gems = saveData.boardState;
            this.gemGroupCountMap = saveData.gemGroupCountMap;
            let gemCount = 0;
            for (let i = 0; i < saveData.boardState.length; i++) {
                let row = saveData.boardState[i];
                for (let j = 0; j < row.length; j++) {
                    const gemType = row[j];
                    this.createGem(i, j, gemType);
                    gemCount++;
                }
            }
            this.printBoardState();
            this.customerManager.init(this, this.gemGroupCountMap, this.nodePool);
         //   console.log('Board and gems restored successfully.');
            return true;
        } catch (e) {
            console.error('Failed to load save data:', e);
            return false;
        }
    }

    private clearBoard() {
        for (let i = 0; i < this.boardParams.rows; i++) {
            for (let j = 0; j < this.boardParams.columns; j++) {
                // 只清除引用
                this.board[i][j] = null;
                this.gems[i][j] = 0;
            }
        }
        
        // 重新初始化数组
        this.board = Array(this.boardParams.rows).fill(null)
            .map(() => Array(this.boardParams.columns).fill(null));
        this.gems = Array(this.boardParams.rows).fill(null)
            .map(() => Array(this.boardParams.columns).fill(0));
        
        // 清理 cubeNode 中的节点
        if (this.cubeNode) {
            const children = [...this.cubeNode.children];
            children.forEach(child => {
                if (child.isValid) {
                    this.nodePool.release(this.gemPrefab, child);
                }
            });
        }
        
        // 清理背景节点
        if (this.cubeNodeBg) {
            const bgChildren = [...this.cubeNodeBg.children];
            bgChildren.forEach(child => {
                if (child.isValid) {
                    this.nodePool.release(this.gemBgPrefab, child);
                }
            });
        }
    }
    public resetGame() {
        // 1. 先移除存档
        this.clearCache();
        // 2. 确保当前状态为空闲
        this.currentState = GameState.Idle;
    
        this.init()
        // 3. 启动游戏
        this.startGame();
    }
    clearCache() {
        LocalStorageManager.removeItem(LocalCacheKeys.GameSave);
        LocalStorageManager.removeItem(LocalCacheKeys.FoodStorage);
        LocalStorageManager.removeItem(LocalCacheKeys.WaitingArea);
        LocalStorageManager.removeItem(LocalCacheKeys.PropData);
    }
   
    public getConsecutivePushableGems(pos: { x: number, y: number }, direction: { dx: number, dy: number }): { x: number, y: number }[] {
        const pushableGems: { x: number, y: number }[] = [];

        // console.log('开始检查可推动宝石：');
        // console.log('当前位置:', pos);
        // console.log('推动方向:', direction);
        // console.log('当前棋盘状态:');
        this.printBoard();  // 添加这个方法来打印棋盘

        if (direction.dx !== 0) { // 水平方向
            const y = pos.y;

            if (direction.dx > 0) { // 向右推
             //   console.log('向右推动检查:');
                let hasEmptySpace = false;
                let emptyX = -1;

                // 从点击位置向右找第一个空位
                for (let x = pos.x + 1; x < this.boardParams.columns; x++) {
                    if (this.gems[y][x] === 0) {
                        hasEmptySpace = true;
                        emptyX = x;
                     //   console.log('找到空位:', { x, y });
                        break;
                    }
                }

                if (hasEmptySpace) {
                    for (let x = pos.x; x < emptyX; x++) {
                        pushableGems.push({ x, y });
                      //  console.log('添加可推动宝石:', { x, y });
                    }
                }
            } else { // 向左推
              //  console.log('向左推动检查:');
                let hasEmptySpace = false;
                let emptyX = -1;

                for (let x = pos.x - 1; x >= 0; x--) {
                    if (this.gems[y][x] === 0) {
                        hasEmptySpace = true;
                        emptyX = x;
                    //    console.log('找到空位:', { x, y });
                        break;
                    }
                }

                if (hasEmptySpace) {
                    for (let x = emptyX + 1; x <= pos.x; x++) {
                        pushableGems.push({ x, y });
                      //  console.log('添加可推动宝石:', { x, y });
                    }
                }
            }
        } else { // 垂直方向
            const x = pos.x;

            if (direction.dy > 0) { // 向上推
             //   console.log('向上推动检查:');
                let hasEmptySpace = false;
                let emptyY = -1;

                for (let y = pos.y - 1; y >= 0; y--) {
                    if (this.gems[y][x] === 0) {
                        hasEmptySpace = true;
                        emptyY = y;
                     //   console.log('找到空位:', { x, y });
                        break;
                    }
                }

                if (hasEmptySpace) {
                    for (let y = emptyY + 1; y <= pos.y; y++) {
                        pushableGems.push({ x, y });
                     //   console.log('添加可推动宝石:', { x, y });
                    }
                }
            } else { // 向下推
              //  console.log('向下推动检查:');
                let hasEmptySpace = false;
                let emptyY = -1;

                for (let y = pos.y + 1; y < this.boardParams.rows; y++) {
                    if (this.gems[y][x] === 0) {
                        hasEmptySpace = true;
                        emptyY = y;
                      //  console.log('找到空位:', { x, y });
                        break;
                    }
                }

                if (hasEmptySpace) {
                    for (let y = pos.y; y < emptyY; y++) {
                        pushableGems.push({ x, y });
                      //  console.log('添加可推动宝石:', { x, y });
                    }
                }
            }
        }
      //  console.log('最终可推动宝石列表:', pushableGems);
        return pushableGems;
    }
    updateLevel(level: number) {
        this._level = level;
        LocalStorageManager.setItem(LocalCacheKeys.Level, "" + this._level);
        if (this.levelLabel) {
            this.levelLabel.string = "第" + this._level + "波";
        }
    }
    // 添加打印棋盘的辅助方法
    public printBoard() {
       // console.log('棋盘状态:');
        for (let y = 0; y < this.boardParams.rows; y++) {
            let row = '';
            for (let x = 0; x < this.boardParams.columns; x++) {
                row += (this.gems[y][x] || '0') + ' ';
            }
            console.log(row);
        }
    }
    public printGems() {
      //  console.log('=== Gems Board State ===');
        for (let row = 0; row < this.boardParams.rows; row++) {
            let line = '';
            for (let col = 0; col < this.boardParams.columns; col++) {
                line += `${this.gems[row][col] ?? 0}  `;
            }
            console.log(line);
        }
        console.log('=====================');
    }
    // 检查是否可以在指定方向推动
    public canPushInDirection(pos: { x: number, y: number }, direction: { dx: number, dy: number }): boolean {
        // 1. 边缘检查：防止从边界往外推
        if (direction.dx < 0 && pos.x === 0) {
            // 如果在最左边还想往左推
            return false;
        }
        if (direction.dx > 0 && pos.x === this.boardParams.columns - 1) {
            // 如果在最右边还想往右推
            return false;
        }
        if (direction.dy > 0 && pos.y === 0) {
            // 如果在最上边还想往上推
            return false;
        }
        if (direction.dy < 0 && pos.y === this.boardParams.rows - 1) {
            // 如果在最下边还想往下推
            return false;
        }
        // 2. 检查推动方向是否有空位
        return this.hasEmptySpaceInDirection(pos, direction);
    }

    // 检查推动方向是否有空位
    /**
     * 检查推动方向是否有空位       
     * @param pos 当前宝石的网格位置 x列 y行
     * @param direction 推动方向 dx水平 dy垂直  
     * @returns 是否有空位
     */
    private hasEmptySpaceInDirection(pos: { x: number, y: number }, direction: { dx: number, dy: number }): boolean {
       // console.log('hasEmptySpaceInDirection', pos, direction, this.gems);
        // 水平方向
        if (direction.dx !== 0) {
            const row = this.gems[pos.y];  // 直接获取整行
            if (direction.dx > 0) {
                // 向右检查
                for (let x = pos.x + 1; x < this.boardParams.columns; x++) {
                    if (row[x] === 0) {
                        console.log('向右检查找到空位', x);
                        return true;
                    }
                }
            } else {
                // 向左检查
                for (let x = pos.x - 1; x >= 0; x--) {
                    if (row[x] === 0) {
                        console.log('向左检查找到空位', x);
                        return true;
                    }
                }
            }
        }
        // 垂直方向
        else {
            console.log('垂直方向检查', pos.x, this.gems[pos.y], direction.dy);
            if (direction.dy < 0) {
                // 向下检查
                for (let y = pos.y + 1; y < this.boardParams.rows; y++) {
                    if (this.gems[y][pos.x] === 0) {
                        console.log('向下检查找到空位', y);
                        return true;
                    }
                }
            } else {
                // 向上检查
                console.log('向上检查', pos.y, this.gems[pos.y]);
                for (let y = pos.y - 1; y >= 0; y--) {
                    console.log('向上检查', y, this.gems[y][pos.x]);
                    if (this.gems[y][pos.x] === 0) {
                        console.log('找到空位坐标:', { x: pos.x, y });
                        return true;
                    }
                }
            }
        }

        return false;
    }
    // 道具
    public onHintClicked() {
        if (this.propManager.getHintUsed()) {
            this.tipUI.showTips("此回合提示道具已使用");
            return;
        }
        if (this.propManager.getHintCount() <= 0) {
            const uiManager = UIManager.instance;
            if (uiManager) {
                console.error("onHintClicked", uiLoadingConfigs.TipPropsUrl);
                uiManager.openUI(uiLoadingConfigs.TipPropsUrl);
            }
        } else {
            // 使用提示道具
            if (this.helperManager.showTips()) {
                this.propManager.useHint();
            }
        }
    }
    // 交换道具
    private onExchangeClicked() {
        if (this.propManager.getExchangeUsed()) {
            this.tipUI.showTips("此回合交换道具已使用");
            return;
        }
        if (this.propManager.getExchangeCount() <= 0) { 
            const uiManager = UIManager.instance;
            if (uiManager) {
                uiManager.openUI(uiLoadingConfigs.ExchangePropUrl);
            }
        } else {
            this.tipUI.showTips("请选择第一个要交换的宝石");
            this.startExchangeMode();
        }
    }
    private startExchangeMode() {
        this.currentState = GameState.Exchanging;
    }
    
    private resetExchangeState() {
        this.currentState = GameState.Idle;
        this.hideHighlight();
        this.exchangeState.isExchanging = false;
        this.exchangeState.firstGem = null;
        this.exchangeState.firstPos = null;
    }
    private hideHighlight() {
        // 如果有之前高亮的宝石，取消其高亮效果
        if (this.exchangeState.firstGem) {
            this.highlightGem(this.exchangeState.firstGem, false);
        }
    }
    private highlightGem(gem: Node, highlight: boolean) {
        // 实现宝石的高亮效果
        const sprite = gem.getChildByName('Item').getComponent(Sprite);
        if (sprite) {
            // 高亮时使用冰蓝色调，未高亮时使用暗色
            sprite.color = highlight ? 
                new Color(155, 155, 155, 255) : // 高亮时使用冰蓝色 (LightBlue)
                new Color(255, 255, 255, 255);  // 未高亮时使用暗色
        }
    }
    private blackHighlightGem(gem: Node, highlight: boolean) {
        const sprite = gem.getChildByName('Item').getComponent(Sprite);
        if (sprite) {
            sprite.color = highlight ? new Color(150, 150, 150, 255) : new Color(255, 255, 255, 255);
        }
    }
    private restoreAllGems() {
        for (let y = 0; y < this.boardParams.rows; y++) {
            for (let x = 0; x < this.boardParams.columns; x++) {
                const gem = this.board[y][x];
                if (!gem) continue;
                this.grayOutGem(gem, false);
            }
        }
    }
    // 添加这个方法来置灰单个宝石
    private grayOutGem(gem: Node, isGray: boolean) {
        const sprite = gem.getChildByName('Item').getComponent(Sprite);
        if (sprite) {
            if (isGray) {
                sprite.color = new Color(155, 155, 155, 255); // 灰色
            } else {
                sprite.color = Color.WHITE; // 恢复正常颜色
            }
        }
    }
    private grayOutNonHighlightedGems() {
        // 遍历棋盘上的所有宝石
        for (let y = 0; y < this.boardParams.rows; y++) {
            for (let x = 0; x < this.boardParams.columns; x++) {
                const gem = this.board[y][x];
                if (!gem) continue;
    
                // 检查这个宝石是否在高亮列表中
                const isHighlighted = this.highlightState.highlightedGems.some(
                    pos => pos.x === x && pos.y === y
                );
    
                if (!isHighlighted) {
                    console.log('非高亮宝石置灰', gem);
                    // 将非高亮宝石置灰并禁用点击
                    this.grayOutGem(gem, true);
                   // gem.off(Node.EventType.TOUCH_END); // 移除点击监听器
                }
            }
        }
    }
    // 检查位置是否是高亮的宝石
private isHighlightedGem(pos: { x: number, y: number }): boolean {
    return this.highlightState.highlightedGems.some(
        hlPos => hlPos.x === pos.x && hlPos.y === pos.y
    );
}

// 在高亮的宝石中找到包含指定位置的三个宝石组合
private findThreeGemsIncluding(
    clickedPos: { x: number, y: number },
    highlightedGems: { x: number, y: number }[]
): { x: number, y: number }[] {
    // 确保点击的是高亮的宝石
    if (!this.isHighlightedGem(clickedPos)) {
        return [];
    }

    // 获取所有可能的组合（包括原始点击的宝石）
    const allPositions = [this.highlightState.clickedPos!, ...highlightedGems];
    
    // 检查水平和垂直方向的连续三个宝石
    const result = this.findConsecutiveThree(clickedPos, allPositions);
    return result;
}

// 找到包含指定位置的连续三个宝石
private findConsecutiveThree(
    center: { x: number, y: number },
    positions: { x: number, y: number }[]
): { x: number, y: number }[] {
    // 水平检查
    const horizontalMatches = positions.filter(p => p.y === center.y)
        .sort((a, b) => a.x - b.x);
    
    // 垂直检查
    const verticalMatches = positions.filter(p => p.x === center.x)
        .sort((a, b) => a.y - b.y);

    // 在水平方向找包含中心点的三个
    if (horizontalMatches.length >= 3) {
        // 找到中心点在水平匹配中的索引
        const centerIndex = horizontalMatches.findIndex(p => p.x === center.x);
        if (centerIndex !== -1) {
            // 根据中心点的位置选择合适的三个点
            if (centerIndex === 0) {
                return horizontalMatches.slice(0, 3);
            } else if (centerIndex === horizontalMatches.length - 1) {
                return horizontalMatches.slice(-3);
            } else {
                return horizontalMatches.slice(centerIndex - 1, centerIndex + 2);
            }
        }
    }

    // 在垂直方向找包含中心点的三个
    if (verticalMatches.length >= 3) {
        // 找到中心点在垂直匹配中的索引
        const centerIndex = verticalMatches.findIndex(p => p.y === center.y);
        if (centerIndex !== -1) {
            // 根据中心点的位置选择合适的三个点
            if (centerIndex === 0) {
                return verticalMatches.slice(0, 3);
            } else if (centerIndex === verticalMatches.length - 1) {
                return verticalMatches.slice(-3);
            } else {
                return verticalMatches.slice(centerIndex - 1, centerIndex + 2);
            }
        }
    }

    return [];
}

// 重置高亮状态
private resetHighlightState() {
    // 重置高亮状态
    if (this.highlightState.clickedGem) {
        this.blackHighlightGem(this.highlightState.clickedGem, false);
    }

    this.highlightState.highlightedGems.forEach(pos => {
        const gem = this.board[pos.y][pos.x];
        if (gem) {
            this.highlightGem(gem, false);
        }
    });

    // 恢复所有宝石到正常状态
    this.restoreAllGems();

    // 重置高亮状态对象
    this.highlightState = {
        clickedGem: null,
        clickedPos: null,
        highlightedGems: [],
        originalType: null
    };
}
    private async executeExchange(pos1: { x: number, y: number }, pos2: { x: number, y: number }) {
        // 交换节点位置
        const gem1 = this.board[pos1.y][pos1.x];
        const gem2 = this.board[pos2.y][pos2.x];
        
        // 获取宝石类型
        const type1 = this.gems[pos1.y][pos1.x];
        const type2 = this.gems[pos2.y][pos2.x];
        
        // console.log(`=== 宝石交换信息 ===`);
        // console.log(`第一个宝石: 从 (${pos1.x}, ${pos1.y}) 移动到 (${pos2.x}, ${pos2.y}), 类型: ${type1}`);
        // console.log(`第二个宝石: 从 (${pos2.x}, ${pos2.y}) 移动到 (${pos1.x}, ${pos1.y}), 类型: ${type2}`);
        
        const pos1World = this.calculateGemPosition(pos1.x, pos1.y);
        const pos2World = this.calculateGemPosition(pos2.x, pos2.y);
        
        // 执行交换动画
        await Promise.all([
            this.animateGemMove(gem1, pos2World),
            this.animateGemMove(gem2, pos1World)
        ]);
        
        // 使用道具
        this.propManager.useExchange();
        
        // 让 handlePushAndMatch 处理所有数据更新和匹配检查
        const moveResult = [
            { from: pos1, to: pos2 },
            { from: pos2, to: pos1 }
        ];
        
       // console.log(`\n开始更新位置...`);
        await this.handlePushAndMatch(moveResult);
        // console.log(`位置更新完成\n`);
    }
    private animateGemMove(gem: Node, targetPos: Vec3): Promise<void> {
        return new Promise((resolve) => {
            tween(gem)
                .to(0.3, { position: targetPos })
                .call(() => resolve())
                .start();
        });
    }

    // 打乱道具
    public async onShuffleClicked() {
        if (this.currentState !== GameState.Idle) {
            console.warn("当前有其他操作正在进行，无法洗牌。");
            return;
        }
        if (this.propManager.getShuffleUsed()) {
            this.tipUI.showTips("此回合打乱道具已使用");
            return;
        }
        if (this.propManager.getShuffleCount() <= 0) {
            console.warn("没有打乱道具可用。");
            const uiManager = UIManager.instance;
            if (uiManager) {
                uiManager.openUI(uiLoadingConfigs.ShuttlePropUrl);
            }
            return;
        } else {
            this.shuffleLogic();
            this.propManager.useShuffle();
        }
    }
    // private shuffleLogic() {
    //     this.currentState = GameState.Shuffling;
    //     try {
    //         let hasMatch = false;
    //         let maxAttempts = 100;
    //         let attempts = 0;
    //         let tempGems: number[][];
    
    //         while (!hasMatch && attempts < maxAttempts) {
    //             attempts++;
    //             // 复制当前棋盘状态
    //             tempGems = this.gems.map(row => [...row]);
    
    //             // 收集所有非空位置的宝石及其位置
    //             const gemsToShuffle: { value: number, pos: { x: number, y: number } }[] = [];
    //             for (let y = 0; y < tempGems.length; y++) {
    //                 for (let x = 0; x < tempGems[y].length; x++) {
    //                     if (tempGems[y][x] !== 0) {
    //                         gemsToShuffle.push({
    //                             value: tempGems[y][x],
    //                             pos: { x, y }
    //                         });
    //                     }
    //                 }
    //             }
    
    //             // 只打乱宝石的值
    //             for (let i = gemsToShuffle.length - 1; i > 0; i--) {
    //                 const j = Math.floor(Math.random() * (i + 1));
    //                 // 只交换值,保持位置不变
    //                 [gemsToShuffle[i].value, gemsToShuffle[j].value] = 
    //                 [gemsToShuffle[j].value, gemsToShuffle[i].value];
    //             }
    
    //             // 将打乱后的宝石放回原位置
    //             gemsToShuffle.forEach(gem => {
    //                 tempGems[gem.pos.y][gem.pos.x] = gem.value;
    //             });
    
    //             // 检查是否有可能的匹配
    //             hasMatch = this.hasPossibleMatch(tempGems);
    //         }
    
    //         if (!hasMatch) {
    //             console.error("在最大尝试次数后未能洗牌到可解状态。");
    //             return;
    //         }
    
    //         // // 更新棋盘状态
    //         // this.gems = tempGems;
    //         // 执行洗牌动画
    //     this.gems = tempGems;
        

    //     // 更新棋盘状态
    //    // this.gems = tempGems;
    
    //         // 更新实际的宝石节点
    //         for (let y = 0; y < this.boardParams.rows; y++) {
    //             for (let x = 0; x < this.boardParams.columns; x++) {
    //                 const gemType = this.gems[y][x];
    //                 if (this.board[y][x]) {
    //                     this.nodePool.release(this.gemPrefab, this.board[y][x]);
    //                     this.board[y][x] = null;
    //                 }
    //                 if (gemType !== 0) {
    //                     this.createGem(y, x, gemType);
    //                 }
    //             }
    //         }
    
    //         console.log('洗牌后的棋盘状态:');
    //         this.printBoard();
    //     } finally {
    //         this.currentState = GameState.Idle;
    //     }
    // }
    private async shuffleLogic() {
        this.currentState = GameState.Shuffling;
        try {
            let hasMatch = false;
            let maxAttempts = 100;
            let attempts = 0;
            let tempGems: number[][];
            let shuffledGems: { node: Node, value: number, pos: { x: number, y: number } }[] = [];
    
            // 收集所有非空宝石
            const gemsToShuffle: { node: Node, value: number, pos: { x: number, y: number } }[] = [];
            for (let y = 0; y < this.boardParams.rows; y++) {
                for (let x = 0; x < this.boardParams.columns; x++) {
                    if (this.gems[y][x] !== 0 && this.board[y][x]) {
                        gemsToShuffle.push({
                            node: this.board[y][x],
                            value: this.gems[y][x],
                            pos: { x, y }
                        });
                    }
                }
            }
    
            while (!hasMatch && attempts < maxAttempts) {
                attempts++;
                tempGems = this.gems.map(row => [...row]);
                
                // 复制一份用于打乱
                shuffledGems = [...gemsToShuffle];
                
                // 随机打乱宝石值
                for (let i = shuffledGems.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [shuffledGems[i].value, shuffledGems[j].value] = 
                    [shuffledGems[j].value, shuffledGems[i].value];
                }
    
                // 更新临时棋盘
                shuffledGems.forEach(gem => {
                    tempGems[gem.pos.y][gem.pos.x] = gem.value;
                });
    
                hasMatch = this.hasPossibleMatch(tempGems);
            }
    
            if (!hasMatch) {
                console.error("在最大尝试次数后未能洗牌到可解状态。");
                return;
            }
    
            // 执行洗牌动画
            await this.playShuffleAnimation(gemsToShuffle, shuffledGems);
    
            // 更新棋盘状态
            this.gems = tempGems;
    
        } finally {
            this.currentState = GameState.Idle;
        }
    }
    /**
 * 获取宝石在圆上的位置信息
 * @param gemIndex 当前宝石的索引
 * @param circleLayout 圆形布局数组 (每个圆上的宝石数量)
 * @returns {
 *   circle: 所在圆的索引(0-3),
    *   positionInCircle: 在当前圆上的位置,
    *   totalInCircle: 当前圆上的总宝石数
    * }
    */
   private getGemCirclePosition(
       gemIndex: number, 
       circleLayout: number[]
   ): { circle: number; positionInCircle: number; totalInCircle: number } {
       let processedGems = 0;
       
       // 遍历每个圆（最多4个）
       for (let i = 0; i < circleLayout.length; i++) {
           // 如果当前宝石索引小于已处理的宝石数加上当前圆的宝石数
           // 说明这个宝石属于当前圆
           if (gemIndex < processedGems + circleLayout[i]) {
               return {
                   circle: i,  // 圆的索引（0是最内圈，3是最外圈）
                   positionInCircle: gemIndex - processedGems,  // 在当前圆上的位置
                   totalInCircle: circleLayout[i]  // 当前圆上的总宝石数
               };
           }
           processedGems += circleLayout[i];
       }
       
       // 如果somehow没找到对应的圆（不应该发生），返回最后一圈的信息
       return {
           circle: circleLayout.length - 1,
           positionInCircle: gemIndex - processedGems,
           totalInCircle: circleLayout[circleLayout.length - 1]
       };
   }
    private async playShuffleAnimation(
        originalGems: { node: Node, value: number, pos: { x: number, y: number } }[],
        shuffledGems: { node: Node, value: number, pos: { x: number, y: number } }[]
    ): Promise<void> {
        const centerX = 0;
        const centerY = 0;
        const maxRadius = Math.min(this.boardParams.boardWidth, this.boardParams.boardHeight) * 0.25;
        
        // 计算最佳圆形布局
        const circleLayout = this.calculateOptimalCircleLayout(originalGems.length);
        const totalCircles = circleLayout.length;
        
        // 2. 创建飞向圆形的动画
        const flyToCirclePromises = originalGems.map((gem, index) => {
            const { circle, positionInCircle, totalInCircle } = this.getGemCirclePosition(index, circleLayout);
            
            // 基础半径（从内到外递增）
            const radiusRatio = 0.4 + (0.6 * circle / (totalCircles - 1));
            const baseRadius = maxRadius * radiusRatio;
            
            // 添加随机半径偏移 (±15%)
            const radiusVariation = baseRadius * (1 + (Math.random() * 0.3 - 0.15));
            
            // 基础角度
            const baseAngle = (2 * Math.PI / totalInCircle) * positionInCircle;
            // 添加随机角度偏移 (±15度)
            const angleVariation = (Math.random() * 0.5 - 0.25); // ±0.25弧度约等于±15度
            const finalAngle = baseAngle + angleVariation;
            
            // 计算最终位置
            const circleX = centerX + radiusVariation * Math.cos(finalAngle);
            const circleY = centerY + radiusVariation * Math.sin(finalAngle);
    
            // 添加随机旋转
            const randomRotation = Math.random() * 40 - 20; // ±20度
    
            return new Promise<void>((resolve) => {
                tween(gem.node)
                    .to(0.3, { 
                        position: new Vec3(circleX, circleY, 0),
                        scale: new Vec3(0.8, 0.8, 1),
                        angle: randomRotation
                    }, {
                        easing: 'backOut'
                    })
                    .call(() => resolve())
                    .start();
            });
        });
    
        await Promise.all(flyToCirclePromises);
    
        // 3. 创建圆形旋转动画
        const rotations = 2;
        const rotationPromises = originalGems.map((gem) => {
            return new Promise<void>((resolve) => {
                const currentPos = gem.node.position;
                const currentAngle = gem.node.angle;
                const sequence = [];
                
                const steps = 36;
                const anglePerStep = (2 * Math.PI * rotations) / steps;
                
                for (let i = 1; i <= steps; i++) {
                    const angle = anglePerStep * i;
                    const x = centerX + (currentPos.x - centerX) * Math.cos(angle) - 
                        (currentPos.y - centerY) * Math.sin(angle);
                    const y = centerY + (currentPos.x - centerX) * Math.sin(angle) + 
                        (currentPos.y - centerY) * Math.cos(angle);
                    
                    // 保持节点的随机旋转角度
                    sequence.push(tween().to(0.05, { 
                        position: new Vec3(x, y, 0),
                        angle: currentAngle
                    }));
                }
                
                tween(gem.node)
                    .sequence(...sequence)
                    .call(() => resolve())
                    .start();
            });
        });
    
        await Promise.all(rotationPromises);
    
        // 4. 飞回原始位置的动画
        const flyBackPromises = originalGems.map((gem, index) => {
            const targetGem = shuffledGems[index];
            const targetPos = this.calculateGemPosition(targetGem.pos.x, targetGem.pos.y);
    
            return new Promise<void>((resolve) => {
                tween(gem.node)
                    .to(0.3, { 
                        position: targetPos,
                        scale: new Vec3(1, 1, 1),
                        angle: 0  // 恢复正常角度
                    }, {
                        easing: 'backOut'
                    })
                    .call(() => {
                        const gemComp = gem.node.getComponent(Gem);
                        if (gemComp) {
                            gemComp.init({
                                ...gemComp.data,
                                type: targetGem.value
                            });
                        }
                        resolve();
                    })
                    .start();
            });
        });
    
        await Promise.all(flyBackPromises);
    }
    private calculateOptimalCircleLayout(totalGems: number): number[] {
        // 确保总数不超过90
        const gemsCount = Math.min(totalGems, 90);
        
        // 根据宝石总数决定使用几个圆
        let numCircles: number;
        if (gemsCount <= 18) {
            numCircles = 1;
        } else if (gemsCount <= 36) {
            numCircles = 2;
        } else if (gemsCount <= 54) {
            numCircles = 3;
        } else {
            numCircles = 4;
        }
    
        // 计算每个圆的宝石数量
        const layout: number[] = [];
        let remainingGems = gemsCount;
    
        for (let i = 0; i < numCircles; i++) {
            let gemsInCircle: number;
            
            if (numCircles === 1) {
                // 只有一个圆时，放置所有宝石
                gemsInCircle = remainingGems;
            } else if (i === numCircles - 1) {
                // 最外圈，放置所有剩余的宝石，但确保至少18个
                gemsInCircle = Math.max(remainingGems, 18);
            } else {
                // 内圈，确保至少18个
                gemsInCircle = Math.max(18, Math.floor(remainingGems / (numCircles - i)));
            }
    
            layout.push(gemsInCircle);
            remainingGems -= gemsInCircle;
        }
    
        return layout;
    }


    

    private updateGemGroupCountMap(gemType: number, decrement: number = 1) {
        if (this.gemGroupCountMap[gemType]) {
            this.gemGroupCountMap[gemType] -= decrement;
            if (this.gemGroupCountMap[gemType] < 0) {
                this.gemGroupCountMap[gemType] = 0;
            }
        }
    }
    public getGemGroupCountMap(gemType: number): { [key: number]: number} | Number {
        if (gemType > 0) {
            return this.gemGroupCountMap[gemType];
        }
        return this.gemGroupCountMap;
    }
  
    private onGemEliminated(type: number, node: Node) {
        // 调用服务客户逻辑
        this.customerManager.serveSkewer(type, node);
        this.updateGemGroupCountMap(type);
    }
    private allGemEliminated(): boolean {
        for (let y = 0; y < this.boardParams.rows; y++) {
            for (let x = 0; x < this.boardParams.columns; x++) {
                if (this.gems[y][x] !== 0) {
                    return false;
                }
            }
        }
        return true;
    }
  
    private gameOver(callback: () => void) {
        if (this._level === 1) {
            this.updateLevel(this._level + 1);
            UIManager.instance.openUI(uiLoadingConfigs.RunUIUrl, ()=>{
            UIManager.instance.closeUI(uiLoadingConfigs.RunUIUrl.name, 0)
            callback?.();
        }, 3);
        } else {
            this.updateLevel(this._level + 1);
            callback?.();
        }
        
    }
    private checkGameover(): Boolean {
        console.error("checkGameover",this.propManager, this.helperManager, this.customerManager, this.foodStorageManager);
        if (!this.propManager || !this.helperManager || !this.customerManager || !this.foodStorageManager) {
            return false;
        }

        // 1. 如果还有道具，游戏一定可以继续
        if (this.hasAvailableProps()) {
            console.log("hasAvailableProps");
            return false;
        }
    
        // 2. 检查是否有可能的移动
        const result = this.helperManager.checkTips();
        if (!result) {
            return true; // 没有可能的移动，游戏结束
        }
        console.log("有可能的移动");
    
        // 3. 如果有移动，检查这些移动是否有意义
        const hasCustomerNeed = this.customerManager.findAreaCustomer(result.type);

        if (!hasCustomerNeed) {
            // 如果没有顾客需要，检查存放区
            if (!this.foodStorageManager) {
                console.warn("FoodStorageManager not found");
                return false;
            }
    
            // 检查存放区是否已满
            if (!this.foodStorageManager.hasAvailableSlot()) {
                // 如果存放区已满，检查是否有未解锁的存放区
                if (this.foodStorageManager.hasLockedSlots()) {
                    this.tipUI.showTips("存放区已满，观看视频解锁新的存放区");
                    return false;
                } else {
                    return true; // 存放区已满且没有未解锁的存放区，游戏结束
                }
            }
        }
        console.log("有有效的移动可以进行");
    
        return false; // 有有效的移动可以进行
    }
    private hasAvailableProps(): boolean {
        try {
            // 检查道具管理器是否存在
            if (!this.propManager) {
                console.warn('PropManager not initialized');
                return false;
            }
    
            // 检查是否有可用道具
            return this.propManager.hasAvailableProps();
        } catch (error) {
            console.error('Error in hasAvailableProps:', error);
            return false; // 发生错误时返回false
        }
    }
    private showGameFailUI() {
        UIManager.instance.openUI(uiLoadingConfigs.FailUrl);
    }
}
