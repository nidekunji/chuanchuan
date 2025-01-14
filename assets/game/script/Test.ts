import { _decorator, Component, Node, Prefab, instantiate, Vec3, UITransform, tween, Size, Label, Tween, SpriteFrame, Sprite, director, ParticleSystem, dragonBones } from 'cc';
import { Gem } from './Gem';
import { IBoardParams, IGemData } from '../../core/scripts/define/Types';
import { Vector2 } from './Vector2';
import { TouchMgr } from '../scripts/TouchMgr';
import { BoardInitialConfig, LocalCacheKeys, NewUserBoardConfig, NewUserGameConfig, NormalGameConfig, uiLoadingConfigs } from '../../app/config/GameConfig';
import { LocalStorageManager } from '../../common/scripts/LocalStorageManager';
import { UIManager } from '../../common/scripts/UIManager';
import { EventDispatcher } from '../../common/scripts/EventDispatcher';
import { NodePool } from '../../common/scripts/NodePool';
import { AudioManager } from '../../common/scripts/AudioManager';
import { GameState } from '../../core/scripts/define/Enums';
import { CustomerManager } from '../scripts/CustomerManager';
import { sdk } from '../../sdk/sdk';
const { ccclass, property } = _decorator;
// 匹配记录接口
interface MatchRecord {
    timestamp: number;
    matches: { row: number, col: number }[];
}
interface GemMove {
    from: { x: number, y: number };
    to: { x: number, y: number };
}
// 游戏存档数据接口
interface GameSaveData {
    gems: IGemData[];
    matchHistory: MatchRecord[];
    score: number;
    moves: number;
    boardState: number[][];
    gemGroupCountMap: { [key: number]: number };
}

@ccclass('GameBoard')
export class GameBoard extends Component {
    @property(dragonBones.ArmatureDisplay)
    dragonDisplay: dragonBones.ArmatureDisplay = null;

    @property(dragonBones.ArmatureDisplay)
    dragonDisplay2: dragonBones.ArmatureDisplay = null;

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

    customerManager: CustomerManager = null;

    public board: Node[][] = [];
    public gems: number[][] = [];
    private _gemStartPos: Vec3 = new Vec3(0, 0, 0);
    private _level: number = 0;

  
    private matchHistory: MatchRecord[] = [];
    public score: number = 0;
    private moves: number = 0;
    // 使用一个变量来存储当前的游戏状态
    public currentState: GameState = GameState.Idle;
    private isScheduled: boolean = false;
    public gemGroupCountMap: { [key: number]: number } = {};
    public boardParams: IBoardParams;
    public touchMgr: TouchMgr;
    private nodePool: NodePool = new NodePool(90);
    onLoad() {
        if (!this.getComponent(UITransform)) {
            this.addComponent(UITransform);
        }
        this.init();
        // this.scheduleOnce(() => {
        //     UIManager.instance.openUI(uiLoadingConfigs.RunUIUrl, ()=>{
        //         UIManager.instance.closeUI(uiLoadingConfigs.RunUIUrl.name, 0)
        //     }, 3);
        // }, 0.5);
    }
    start() {
        this.startGame();

    }
    startGame() {
        this.scheduleOnce(() => {
            this.initBoardSize();
            if (!this.loadGame()) {
                this.initBoard();
            }
            this.customerManager.init(this, this.gemGroupCountMap, this.nodePool);
        }, 0);
        this.playAnimation('newAnimation', -1);
        // 检测到哪个可以移动合成 
        // const intervalId = setInterval(() => {
        //     this.findFirstValidMove();
        // }, 2000);
    }
    playAnimation(name: string, loop: number) {
        if (this.dragonDisplay) {
            this.dragonDisplay.playAnimation(name, loop);
        }
        if (this.dragonDisplay2) {
            this.dragonDisplay2.playAnimation('ani_main_btn_xsyd', loop);
        }
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
        eventDispatcher.on('restartGame', this.resetGame.bind(this));

        if (this.customerManagerNode) {
        // 顾客管理器
        this.customerManager = this.customerManagerNode.getComponent(CustomerManager);
        }
    }
    initConfig() {
       LocalStorageManager.clearAllCache();
        const isNull = LocalStorageManager.hasNeverStoredValue(LocalCacheKeys.IsNewUser)
        if (0) {
            this.boardParams = NewUserBoardConfig;
        } else {
            this.boardParams = BoardInitialConfig;
        }
        let level = LocalStorageManager.hasNeverStoredValue(LocalCacheKeys.Level)
        if (!level) {
            this.updateLevel(1);
        } else {
            this.updateLevel(Number(level));
        }
        this.score = 0;
        this.moves = 0;
        this.matchHistory = [];
        this.gemGroupCountMap = {};
        this.currentState = GameState.Idle;
        // 1. 初始化数组
        this.board = Array(this.boardParams.rows).fill(null).map(() => Array(this.boardParams.columns).fill(null));
        this.gems = Array(this.boardParams.rows).fill(null).map(() => Array(this.boardParams.columns).fill(0));
    }
  initBoardSize() {
    const cubeNodeSize = this.cubeNode.getComponent(UITransform).contentSize;
    const gemWidth = this.boardParams.baseGemWidth;
    const gemHeight = this.boardParams.baseGemHeight;
    const spacing = this.boardParams.spacing; // 假设每个宝石之间的间距为10

    // 计算总宽度和高度
    const totalWidth = gemWidth * this.boardParams.columns + (this.boardParams.columns - 1) * spacing;
    const totalHeight = gemHeight * this.boardParams.rows + (this.boardParams.rows - 1) * spacing;

    // 判断是否使用基于 cubeNode 的尺寸或直接计算的尺寸
    let useCubeNodeSize = cubeNodeSize.width < totalWidth && cubeNodeSize.height < totalHeight;

    let finalWidth, finalHeight;
    if (useCubeNodeSize) {
        // 使用 cubeNode 的尺寸
        finalWidth = cubeNodeSize.width;
        finalHeight = cubeNodeSize.height;
    } else {
        // 使用直接计算的尺寸
        finalWidth = totalWidth;
        finalHeight = totalHeight;
    }
    this.boardParams.boardWidth = finalWidth;
    this.boardParams.boardHeight = finalHeight;

    // 计算在可用空间内适合的最大宝石尺寸
    const maxGemWidth = (finalWidth - (this.boardParams.columns - 1) * this.boardParams.spacing) / this.boardParams.columns;
    const maxGemHeight = (finalHeight - (this.boardParams.rows - 1) * this.boardParams.spacing) / this.boardParams.rows;

    // 确定在两个维度内都适合的宝石尺寸
    this.boardParams.gemWidth = Math.min(gemWidth, maxGemWidth);
    this.boardParams.gemHeight = Math.min(gemHeight, maxGemHeight);
    // 计算缩放因子
    const scaleFactorWidth = this.boardParams.gemWidth / this.boardParams.baseGemWidth;
    const scaleFactorHeight = this.boardParams.gemHeight / this.boardParams.baseGemHeight;
    this.boardParams.scaleFactor = parseFloat(Math.min(scaleFactorWidth, scaleFactorHeight).toFixed(2));
    this.boardParams.scaleFactorWidth = scaleFactorWidth;
    this.boardParams.scaleFactorHeight = scaleFactorHeight;

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
        finalWidth + offset,
        finalHeight + offset
    ));
    this.BorderNode.setPosition(this.cubeNode.getPosition());
}
        private checkAndPlayBackgroundMusic() {
            LocalStorageManager.setItem(LocalCacheKeys.BackgroundMusic, 'true');
            const audioManager = AudioManager.instance;
            if (audioManager) {
                audioManager.playBackgroundMusic('bgm');
            } else {
                console.error("AudioManager component not found on this node");
            }
        }
    private init() {
        this.initPool();
        this.initManager();
        this.initConfig();
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
        this.clearBoard();
        this.updateScoreUI(this.score);
    }
    private initPool() {
        this.nodePool.initializePool(this.gemPrefab);
        this.nodePool.initializePool(this.gemBgPrefab);
        this.nodePool.initializePool(this.foodPrefab);
    }
    private onSettingsButtonClicked() {
        const uiManager = UIManager.instance;
        uiManager.openUI(uiLoadingConfigs.SettingUrl);
    }
    onDestroy() {
        this.isScheduled = false;
        // const eventDispatcher = EventDispatcher.getInstance();
        // eventDispatcher.off('restartGame', this.resetGame.bind(this));
        // 取消设置按钮的事件监听
        if (this.settingBtn && this.settingBtn.isValid) {
            this.settingBtn.off(Node.EventType.TOUCH_END, this.onSettingsButtonClicked, this);
        }
    }
    private createGem(row: number, col: number, type: number, isRemoved: boolean = false): Node {
        const startX = this._gemStartPos.x;
        const startY = this._gemStartPos.y;
        const localX = startX + col * (this.boardParams.gemWidth + this.boardParams.spacing);
        const localY = startY - row * (this.boardParams.gemHeight + this.boardParams.spacing);
       
        const gemBg = this.nodePool.acquire(this.gemBgPrefab);
        gemBg.scale = new Vec3(this.boardParams.scaleFactorWidth, this.boardParams.scaleFactorHeight, 1);
        gemBg.setPosition(new Vec3(localX, localY, 0));
        gemBg.active = true;
        this.cubeNodeBg.addChild(gemBg); 
        if (type === 0) {
            return gemBg;
        }
        // Instantiate and set up the gem
        const gem = this.nodePool.acquire(this.gemPrefab);
        gem.scale = new Vec3(this.boardParams.scaleFactor, this.boardParams.scaleFactor, 1);
        this.cubeNode.addChild(gem); 
        gem.active = true;
        const worldPos = this.cubeNode.getComponent(UITransform).convertToWorldSpaceAR(
            new Vec3(localX, localY, 0)
        );

       // 设置定时器并使用标志来跟踪
        this.isScheduled = true;
        this.scheduleOnce(() => {
            if (!this.isScheduled) return; // 检查标志
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
        });
        // Update arrays
        if (!this.board[row]) this.board[row] = [];
        if (!this.gems[row]) this.gems[row] = [];
        this.board[row][col] = gem;
        this.gems[row][col] = type;
        return gem;
    }
    private initBoard() {
        // 2. 使用通用逻辑填充棋盘
        const filledBoard = this.fillBoard();
        let gemCount = 0;
        for (let i = 0; i < this.boardParams.rows; i++) {
            for (let j = 0; j < this.boardParams.columns; j++) {
                const gemType = filledBoard[i][j];
                this.createGem(i, j, gemType);
                gemCount++;
            }
        }
        console.error(`Total gems created: ${gemCount}`, this.cubeNode); // Log the total count
        // 4. 验证每种宝石的数量
        this.validateGemCounts();
        this.printBoardState();
    }
    private fillBoard() {
        // 获取棋盘参数
        let rows = this.boardParams.rows;
        let columns = this.boardParams.columns;
        let gemTypes = this.boardParams.gemTypes;
        let initialMatches = this.boardParams.initialMatches;

        let board = Array.from({ length: rows }, () => Array(columns).fill(0));
        let emptyPositions: Set<string> = new Set();
        let gemCounts = Array(gemTypes).fill(0);
        // 初始化空位置
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < columns; c++) {
                emptyPositions.add(`${r},${c}`);
            }
        }
        // 生成初始三消
        for (let i = 0; i < initialMatches && emptyPositions.size >= 3; i++) {
            let positionArray: string[] = Array.from(emptyPositions);
            let randomPosIndex = Math.floor(Math.random() * positionArray.length);
            let [r, c] = positionArray[randomPosIndex].split(',').map(Number);
            let type = Math.floor(Math.random() * gemTypes) + 1;
            let horizontal = Math.random() > 0.5;
            if (horizontal && c <= columns - 3 && [0, 1, 2].every(i => emptyPositions.has(`${r},${c + i}`))) {
                for (let j = 0; j < 3; j++) {
                    board[r][c + j] = type;
                    emptyPositions.delete(`${r},${c + j}`);
                    gemCounts[type - 1]++;
                }
            } else if (!horizontal && r <= rows - 3 && [0, 1, 2].every(i => emptyPositions.has(`${r + i},${c}`))) {
                for (let j = 0; j < 3; j++) {
                    board[r + j][c] = type;
                    emptyPositions.delete(`${r + j},${c}`);
                    gemCounts[type - 1]++;
                }
            }
        }
        // 填充剩余空位
        while (emptyPositions.size > 0) {
            if (emptyPositions.size < 3) {
                emptyPositions.forEach(pos => {
                    let [r, c] = (pos).split(',').map(Number);
                    let type = Math.floor(Math.random() * gemTypes) + 1;
                    board[r][c] = type;
                    gemCounts[type - 1]++;
                });
                break;
            }

            let type = Math.floor(Math.random() * gemTypes) + 1;
            let positions: string[] = Array.from(emptyPositions);
            let index1 = Math.floor(Math.random() * positions.length);
            let [r1, c1] = (positions[index1]).split(',').map(Number);
            // 尝试放置第二个相邻的宝石
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

                // 随机放置第三个宝石
                if (emptyPositions.size > 0) {
                    let thirdPosIndex = Math.floor(Math.random() * Array.from(emptyPositions).length);
                    let pos: string = Array.from(emptyPositions)[thirdPosIndex];
                    let [r3, c3] = pos.split(',').map(Number);
                    board[r3][c3] = type;
                    emptyPositions.delete(`${r3},${c3}`);
                    gemCounts[type - 1]++;
                }
            } else {
                // 随机放置三个单独的宝石
                for (let i = 0; i < 3; i++) {
                    if (emptyPositions.size > 0) {
                        let positions: string[] = Array.from(emptyPositions);
                        let index = Math.floor(Math.random() * positions.length);
                        let pos = positions[index];
                        let [r, c] = (pos).split(',').map(Number);
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
                            let newType = ((i + 1) % gemTypes) + 1;
                            board[r][c] = newType;
                            gemCounts[i]--;
                            gemCounts[newType - 1]++;
                            needed--;
                        }
                    }
                }
            }
        }
        return board;
    }
    private hasPossibleMatch(board: number[][]): boolean {
        for (let r = 0; r < board.length; r++) {
            for (let c = 0; c < board[r].length; c++) {
                const currentType = board[r][c];
                if (currentType === 0) continue; // Skip empty slots
                // Check all possible moves for this gem
                for (let targetR = 0; targetR < board.length; targetR++) {
                    for (let targetC = 0; targetC < board[targetR].length; targetC++) {
                        if (board[targetR][targetC] === 0) { // Check if target is empty
                            // Simulate moving the gem to the empty slot
                            board[targetR][targetC] = currentType;
                            board[r][c] = 0;

                            // Check for matches
                            if (this.checkForMatch(board, targetR, targetC)) {
                                // Restore original state
                                board[r][c] = currentType;
                                board[targetR][targetC] = 0;
                                return true;
                            }
                            // Restore original state
                            board[r][c] = currentType;
                            board[targetR][targetC] = 0;
                        }
                    }
                }
            }
        }
        return false;
    }

    private checkForMatch(board: number[][], row: number, col: number): boolean {
        const type = board[row][col];
        if (type === 0) return false;
        // Check horizontal match
        let count = 1;
        for (let i = col - 1; i >= 0 && board[row][i] === type; i--) count++;
        for (let i = col + 1; i < board[row].length && board[row][i] === type; i++) count++;
        if (count >= 3) return true;

        // Check vertical match
        count = 1;
        for (let i = row - 1; i >= 0 && board[i][col] === type; i--) count++;
        for (let i = row + 1; i < board.length && board[i][col] === type; i++) count++;
        if (count >= 3) return true;

        return false;
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
        // 更新 gemGroupCountMap
        this.gemGroupCountMap = {};
        for (let type = 1; type <= this.boardParams.gemTypes; type++) {
            this.gemGroupCountMap[type] = Math.floor(gemCounts[type] / 3);
        }
        // 输出统计结果
        console.log("=== Gem Distribution Validation ===");
        for (let type = 1; type <= this.boardParams.gemTypes; type++) {
            const count = gemCounts[type];
            console.log(`Type ${type}: ${count} gems (${count / 3} groups of 3)`);

            if (count % 3 !== 0) {
                console.error(`Error: Gem type ${type} count (${count}) is not divisible by 3!`);
            }
        }
    }
 
   /**
 * 处理推动移动后的状态更新和消除检查
 * @param moveResult 移动结果数组
 * @returns 是否发生了消除
 */
public async handlePushAndMatch(moveResult: { from: { x: number, y: number }, to: { x: number, y: number } }[], willMatch: boolean = true): Promise<boolean> {
        try {
            this.currentState = GameState.Processing;
            // 1. 更新宝石位置和数据
            await this.updateGemsPositions(moveResult);
    
            // 打印移动后的棋盘状态
            console.log('移动后的棋盘状态:');
            this.printBoardState();

            if (willMatch) {
                // 2. 检查是否有可消除的组合
            for (const move of moveResult) {
                const gemType = this.gems[move.to.y][move.to.x];
                console.log(`\n检查目标位置 (${move.to.x}, ${move.to.y}) 的匹配`);
                console.log(`该位置的宝石类型: ${gemType}`);
    
                const matchGroup = this.findMatchGroupAtPosition(
                    move.to.x,
                    move.to.y,
                    gemType
                );
                if (matchGroup.length >= 3) {
                    console.log('\n=== 找到匹配组 ===');
                    console.log('匹配位置:');
                    matchGroup.forEach(pos => {
                        console.log(`位置 (${pos.x}, ${pos.y}) - 类型: ${this.gems[pos.y][pos.x]}`);
                    });
    
                    // 执行消除并更新数据
                    await this.removeMatchGroup(matchGroup);
    
                    // 打印消除后的棋盘状态
                    console.log('\n消除后的棋盘状态:');
                    this.printBoardState();
    
                    return true; // 返回 true 表示发生了消除
                }
                }
            } else {
                console.log('执行移动...')
                return true;
            }
            return false;
            // // 2. 检查是否有可消除的组合
            // for (const move of moveResult) {
            //     const gemType = this.gems[move.to.y][move.to.x];
            //     console.log(`\n检查目标位置 (${move.to.x}, ${move.to.y}) 的匹配`);
            //     console.log(`该位置的宝石类型: ${gemType}`);
    
            //     const matchGroup = this.findMatchGroupAtPosition(
            //         move.to.x,
            //         move.to.y,
            //         gemType
            //     );
            //     if (matchGroup.length >= 3) {
            //         console.log('\n=== 找到匹配组 ===');
            //         console.log('匹配位置:');
            //         matchGroup.forEach(pos => {
            //             console.log(`位置 (${pos.x}, ${pos.y}) - 类型: ${this.gems[pos.y][pos.x]}`);
            //         });
    
            //         // 执行消除并更新数据
            //         await this.removeMatchGroup(matchGroup);
    
            //         // 打印消除后的棋盘状态
            //         console.log('\n消除后的棋盘状态:');
            //         this.printBoardState();
    
            //         return true; // 返回 true 表示发生了消除
            //     }
            // }
    
        } catch (error) {
            console.error('Error in handlePushAndMatch:', error);
            return false;
        } finally {
            this.currentState = GameState.Idle;
        }
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
            // 检查包含点击位置的匹配组
            const matchGroup = this.findMatchGroupAtPosition(pos.x, pos.y, clickedGemType);
            if (matchGroup.length >= 3) {
                this.currentState = GameState.Processing;
                try {
                    await this.removeMatchGroup(matchGroup);
                } finally {
                    this.currentState = GameState.Idle;
                }
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
        console.log(`Checking from (${targetGem.x}, ${targetGem.y}) in direction (${direction.dx}, ${direction.dy}), found ${emptyCount} empty slots`);  // 添加调试日志
        return emptyCount;
}
    public findMatchGroupAtPosition(x: number, y: number, type: number, requireNumber: number = 3): { x: number, y: number }[] {
        // 首先检查参数的有效性
        console.log("findMatchGroupAtPosition", x, y, type, this.gems[y][x], "gem", this.gems[y][x] !== type)
        if (!this.isValidPosition(x, y) || this.gems[y][x] === 0 || this.gems[y][x] !== type) {
            return [];
        }
        // 检查水平方向
        const horizontalMatches = this.findMatchesInDirection(x, y, type, true, requireNumber);
            if (horizontalMatches.length >= requireNumber) {
            return horizontalMatches;
        }
        // 检查垂直方向
        const verticalMatches = this.findMatchesInDirection(x, y, type, false, requireNumber);
            if (verticalMatches.length >= requireNumber) {
            return verticalMatches;
        }

        return [];
    }
    // 查找包含指定位置的匹配组
    private findMatchesInDirection(x: number, y: number, type: number, isHorizontal: boolean, requireNumber: number = 3): { x: number, y: number }[] {
        const sameTypePositions: { x: number, y: number }[] = [];
        // 从点击位置向左/上查找
        let i = isHorizontal ? x : y;
        while (i >= 0) {
            const currentGem = isHorizontal ?
                this.gems[y][i] :
                this.gems[i][x];

            if (currentGem !== type && currentGem !== 0) break; // 遇到其他类型宝石停止

            if (currentGem === type) { // 空格跳过，不计入
                sameTypePositions.unshift({
                    x: isHorizontal ? i : x,
                    y: isHorizontal ? y : i
                });
            }
            i--;
        }
        // 从点击位置向右/下查找（不包含点击位置，因为已经加入）
        i = isHorizontal ? x + 1 : y + 1;
        const maxLength = isHorizontal ? this.boardParams.columns : this.boardParams.rows;
        while (i < maxLength) {
            const currentGem = isHorizontal ?
                this.gems[y][i] :
                this.gems[i][x];

            if (currentGem !== type && currentGem !== 0) break; // 遇到其他类型宝石停止

            if (currentGem === type) { // 空格跳过，不计入
                sameTypePositions.push({
                    x: isHorizontal ? i : x,
                    y: isHorizontal ? y : i
                });
            }
            i++;
        }
        // 如果找到至少3个相同类型的宝石，返回包含点击位置的3个 requireNumber 两个也可以
        if (sameTypePositions.length >= requireNumber) {
            const clickIndex = sameTypePositions.findIndex(pos =>
                (isHorizontal && pos.x === x) || (!isHorizontal && pos.y === y)
            );

            if (clickIndex >= 1 && clickIndex < sameTypePositions.length - 1) {
                return sameTypePositions.slice(clickIndex - 1, clickIndex + 2);
            } else if (clickIndex === 0) {
                return sameTypePositions.slice(0, requireNumber);
            } else {
                return sameTypePositions.slice(-requireNumber);
            }
        }
        return [];
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
        console.log('=== Starting Position Update ===');
        console.log('Move result:', moveResult);
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

            console.log(`Moving gem type ${gemType} from (${move.from.x}, ${move.from.y}) to (${move.to.x}, ${move.to.y})`);

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
        console.log('tempGems', tempGems);
        console.log('tempBoard', tempBoard);
        // 完成所有移动后，更新实际的数组
        this.gems = tempGems;
        this.board = tempBoard;

        // 验证更新
        console.log('\nFinal board state:');
        for (let y = 0; y < this.boardParams.rows; y++) {
            let row = '';
            for (let x = 0; x < this.boardParams.columns; x++) {
                row += (this.gems[y][x] || '0') + ' ';
            }
            console.log(row);
        }
    }
    // 修改 removeMatchGroup 方法确保正确更新数据
    private async removeMatchGroup(matches: { x: number, y: number }[]) {
        try {
            this.currentState = GameState.Processing;

            // 记录匹配
            this.matchHistory.push({
                timestamp: Date.now(),
                matches: matches.map(m => ({ row: m.y, col: m.x }))
            });

            AudioManager.instance.playSoundEffect('remove');
            const gem = this.board[matches[1].y][matches[1].x];
            let localPosition = new Vec3(0, 0, 0);
            const firstGemType = this.gems[matches[0].y][matches[0].x];
            if (gem) {
                const worldPosition = gem.parent.getComponent(UITransform).convertToWorldSpaceAR(gem.position);
                localPosition = this.node.getComponent(UITransform).convertToNodeSpaceAR(worldPosition);
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
            this.onGemEliminated(firstGemType, localPosition);

            // 更新分数
            this.score += matches.length * 10;
            this.updateScoreUI(this.score);

            // 添加金币
            this.addCoins(matches.length);
            // 保存游戏状态
            this.saveGame();

            // 打印更新后的棋盘状态
            this.printBoardState();
            if (this.gameOver()) {
                 console.log('All gems eliminated, restarting the game.');
                this.resetGame();
            }

        } catch (error) {
            console.error('Error in removeMatchGroup:', error);
        } finally {
            this.currentState = GameState.Idle;
        }
    }

    // 添加打印棋盘状态的辅助方法
    private printBoardState() {
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
     * @returns 
     */
    public checkPushWillMatch(moveResult: GemMove[]): number {
        // 创建一个临时的棋盘状态来模拟移动
        const tempBoard = this.gems.map(row => [...row]);
        // 先记录所有要移动的宝石的类型和位置
        const gemMoves = moveResult.map(move => ({
            ...move,
            type: tempBoard[move.from.y][move.from.x]
        }));
        // 先清除原始位置
        gemMoves.forEach(move => {
            tempBoard[move.from.y][move.from.x] = null;
        });
        // 放置到新位置
        gemMoves.forEach(move => {
            tempBoard[move.to.y][move.to.x] = move.type;
        });
    
        // 保存原始棋盘状态
        const originalGems = this.gems.map(row => [...row]);
        // 临时替换棋盘状态
        this.gems = tempBoard;
    
        try {
            // 对每个移动的宝石位置检查是否能形成匹配
            for (const move of gemMoves) {
                const matchGroup = this.findMatchGroupAtPosition(
                    move.to.x,
                    move.to.y,
                    move.type
                );
                console.log('matchGroup', matchGroup);
                if (matchGroup.length >= 3) {
                    return 1; // 返回1表示发生了匹配
                }
                const matchGroup2 = this.findMatchGroupAtPosition(
                    move.to.x,
                    move.to.y,
                    move.type,
                    2
                );
                console.log('matchGroup2', matchGroup2);
                // 检查是否有两个相邻的宝石
                if (matchGroup2.length == 2) {
                    return 2; // 返回2表示有两个相邻的宝石
                }
            }
            return 0; // 如果没有找到匹配或相邻的宝石，返回0
        } finally {
            // 恢复原始棋盘状态
            this.gems = originalGems;
        }
    }
    public findFirstValidMove(): {from: {x: number, y: number}, to: {x: number, y: number}} | null {
        for (let y = 0; y < this.boardParams.rows; y++) {
            for (let x = 0; x < this.boardParams.columns; x++) {
                // 假设可以向四个方向移动
                const directions = [
                    {dx: 1, dy: 0},  // 右
                    {dx: -1, dy: 0}, // 左
                    {dx: 0, dy: 1},  // 上
                    {dx: 0, dy: -1}  // 下
                ];
                for (const direction of directions) {
                    const newX = x + direction.dx;
                    const newY = y + direction.dy;
                    if (this.isValidPosition(newX, newY) && this.gems[newY][newX] === 0) { // 检查位置是否有效且目标位置为空
                        const moveResult = [{from: {x, y}, to: {x: newX, y: newY}}];

                        if (this.checkPushWillMatch(moveResult) == 1) {
                            const gemType = this.gems[y][x];
                            console.error(`Move from (${x}, ${y}) to (${newX}, ${newY}) with gem type ${gemType} can form a match.`);
                            return {from: {x, y}, to: {x: newX, y: newY}};
                        }
                    }
                }
            }
        }
        console.error("No valid move found that can form a match.");
        return null; // 如果没有找到任何可以消除的移动，返回null
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

    private saveGame() {
        const gemData: IGemData[] = [];

        for (let i = 0; i < this.boardParams.rows; i++) {
            for (let j = 0; j < this.boardParams.columns; j++) {
                const node = this.board[i][j];
                // Check if the node exists and is valid
                if (node && node.isValid) {
                    const gem = node.getComponent(Gem);
                    // Ensure the Gem component exists, is valid, and not removed
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
            matchHistory: this.matchHistory,
            score: this.score,
            moves: this.moves,
            boardState: this.gems,
            gemGroupCountMap: this.gemGroupCountMap
        };

        try {
            LocalStorageManager.setItem(LocalCacheKeys.GameSave, JSON.stringify(saveData));
        } catch (error) {
            console.error('Failed to save game:', error);
        }
    }
    // 辅助方法：检查位置是否有效
    private isValidPosition(x: number, y: number): boolean {
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
            console.log("saveData", saveData);
            this.matchHistory = saveData.matchHistory;
            this.updateScoreUI(saveData.score);
            this.moves = saveData.moves;
            this.gems = saveData.boardState;
            this.gemGroupCountMap = saveData.gemGroupCountMap;
            this.validateGemCounts();
           
            let gemCount = 0;
            for (let i = 0; i < saveData.boardState.length; i++) {
                let row = saveData.boardState[i];
                console.log(`Row ${i}:`, row);
                for (let j = 0; j < row.length; j++) {
                    const gemType = row[j];
                    this.createGem(i, j, gemType);
                    gemCount++;
                }
            }
            console.error(`Total gems created: ${gemCount}`); // Log the total count
            console.log('Board and gems restored successfully.');
            return true;
        } catch (e) {
            console.error('Failed to load save data:', e);
            return false;
        }
    }

    private clearBoard() {
        this.board = Array(this.boardParams.rows).fill(null).map(() => Array(this.boardParams.columns).fill(null));
        this.gems = Array(this.boardParams.rows).fill(null).map(() => Array(this.boardParams.columns).fill(0));
      
          // 清空 Cube 和 CubeBg 节点的子节点
        const cubeNode = this.cubeNode;
        const cubeNodeBg = this.cubeNodeBg;
        if (cubeNode) {
            cubeNode.children.forEach(child => {
                this.nodePool.release(this.gemPrefab, child);
            });
        }
        if (cubeNodeBg) {
            cubeNodeBg.children.forEach(child => {
                this.nodePool.release(this.gemBgPrefab, child);
            });
        }
    }

    public getRemovedGems(): IGemData[] {
        const removedGems: IGemData[] = [];
        for (let i = 0; i < this.boardParams.rows; i++) {
            for (let j = 0; j < this.boardParams.columns; j++) {
                if (this.board[i][j]) {
                    const gem = this.board[i][j].getComponent(Gem);
                    if (gem.isGemRemoved()) {
                        removedGems.push(gem.getGemData());
                    }
                }
            }
        }
        return removedGems;
    }

    public getGameStats() {
        return {
            score: this.score,
            moves: this.moves,
            matchCount: this.matchHistory.length,
            matchHistory: this.matchHistory
        };
    }

    public resetGame() {
        if (!this.board || !this.gems) {
            console.error('Board or gems are not initialized!');
            return;
        }
        this.init();
        this.initBoard();
       this.customerManager.init(this, this.gemGroupCountMap, this.nodePool);
        this.saveGame();
        const currentSceneName = director.getScene().name;
        director.loadScene(currentSceneName);
    }
    // 获取连续的可推动宝石
    public getConsecutivePushableGems(pos: { x: number, y: number }, direction: { dx: number, dy: number }): { x: number, y: number }[] {
        const pushableGems: { x: number, y: number }[] = [];

        console.log('开始检查可推动宝石：');
        console.log('当前位置:', pos);
        console.log('推动方向:', direction);
        console.log('当前棋盘状态:');
        this.printBoard();  // 添加这个方法来打印棋盘

        if (direction.dx !== 0) { // 水平方向
            const y = pos.y;

            if (direction.dx > 0) { // 向右推
                console.log('向右推动检查:');
                let hasEmptySpace = false;
                let emptyX = -1;

                // 从点击位置向右找第一个空位
                for (let x = pos.x + 1; x < this.boardParams.columns; x++) {
                    if (this.gems[y][x] === 0) {
                        hasEmptySpace = true;
                        emptyX = x;
                        console.log('找到空位:', { x, y });
                        break;
                    }
                }

                if (hasEmptySpace) {
                    for (let x = pos.x; x < emptyX; x++) {
                        pushableGems.push({ x, y });
                        console.log('添加可推动宝石:', { x, y });
                    }
                }
            } else { // 向左推
                console.log('向左推动检查:');
                let hasEmptySpace = false;
                let emptyX = -1;

                for (let x = pos.x - 1; x >= 0; x--) {
                    if (this.gems[y][x] === 0) {
                        hasEmptySpace = true;
                        emptyX = x;
                        console.log('找到空位:', { x, y });
                        break;
                    }
                }

                if (hasEmptySpace) {
                    for (let x = emptyX + 1; x <= pos.x; x++) {
                        pushableGems.push({ x, y });
                        console.log('添加可推动宝石:', { x, y });
                    }
                }
            }
        } else { // 垂直方向
            const x = pos.x;

            if (direction.dy > 0) { // 向上推
                console.log('向上推动检查:');
                let hasEmptySpace = false;
                let emptyY = -1;

                for (let y = pos.y - 1; y >= 0; y--) {
                    if (this.gems[y][x] === 0) {
                        hasEmptySpace = true;
                        emptyY = y;
                        console.log('找到空位:', { x, y });
                        break;
                    }
                }

                if (hasEmptySpace) {
                    for (let y = emptyY + 1; y <= pos.y; y++) {
                        pushableGems.push({ x, y });
                        console.log('添加可推动宝石:', { x, y });
                    }
                }
            } else { // 向下推
                console.log('向下推动检查:');
                let hasEmptySpace = false;
                let emptyY = -1;

                for (let y = pos.y + 1; y < this.boardParams.rows; y++) {
                    if (this.gems[y][x] === 0) {
                        hasEmptySpace = true;
                        emptyY = y;
                        console.log('找到空位:', { x, y });
                        break;
                    }
                }

                if (hasEmptySpace) {
                    for (let y = pos.y; y < emptyY; y++) {
                        pushableGems.push({ x, y });
                        console.log('添加可推动宝石:', { x, y });
                    }
                }
            }
        }
        console.log('最终可推动宝石列表:', pushableGems);
        return pushableGems;
    }
    updateLevel(level: number) {
        this._level = level;
        this.levelLabel.string = "" + this._level;
        LocalStorageManager.setItem(LocalCacheKeys.Level, "" + this._level);
    }
    // 添加打印棋盘的辅助方法
    private printBoard() {
        console.log('棋盘状态:');
        for (let y = 0; y < this.boardParams.rows; y++) {
            let row = '';
            for (let x = 0; x < this.boardParams.columns; x++) {
                row += (this.gems[y][x] || '0') + ' ';
            }
            console.log(row);
        }
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
        console.log("Hint button clicked");
        const possibleMatch = this.findPossibleMatch();
        if (possibleMatch) {
            this.highlightMatch(possibleMatch);
        } else {
            console.warn("No possible matches found");
        }
    }
    private findPossibleMatch(): { x: number, y: number }[] | null {
        // Implement logic to find a possible match
        // Return the positions of the gems that can be matched
        return null; // Placeholder
    }
    // 提示道具
    private highlightMatch(match: { x: number, y: number }[]) {
        // Implement logic to visually highlight the match
        console.log("Highlighting match:", match);
        const uiManager = UIManager.instance;
        if (uiManager) {
            uiManager.openUI(uiLoadingConfigs.TipPropsUrl);
        }
    }

    // 交换道具
    private onExchangeClicked() {
        const uiManager = UIManager.instance;
        if (uiManager) {
            uiManager.openUI(uiLoadingConfigs.ExchangePropUrl);
        }
    }
    // 打乱道具
    public async shuffleBoard() {
        if (this.currentState !== GameState.Idle) {
            console.warn("当前有其他操作正在进行，无法洗牌。");
            return;
        }

        const uiManager = UIManager.instance;
        if (uiManager) {
            uiManager.openUI(uiLoadingConfigs.RandomPropUrl);
        }

        // sdk.p.showRewardedVideoAd((r: number) => {
        //     if (this.node.isValid) {
        //         if (r) {
        //             this.shuffleLogic();
        //         }
        //     }

        // })
    }

    private shuffleLogic() {
        this.currentState = GameState.Shuffling;
        // 标记开始洗牌
        try {
            let hasMatch = false;
            let maxAttempts = 100; // 限制洗牌尝试次数以防止无限循环
            let attempts = 0;
            let tempGems: number[][];

            while (!hasMatch && attempts < maxAttempts) {
                attempts++;
                // Initialize a temporary array for shuffling
                tempGems = this.gems.map(row => [...row]);

                // Flatten all gems (including empty spaces) for shuffling
                const allGems = [];
                for (let y = 0; y < tempGems.length; y++) {
                    for (let x = 0; x < tempGems[y].length; x++) {
                        allGems.push(tempGems[y][x]);
                    }
                }

                // Shuffle all gems
                for (let i = allGems.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [allGems[i], allGems[j]] = [allGems[j], allGems[i]];
                }

                // Rebuild the gem array
                let index = 0;
                for (let y = 0; y < this.boardParams.rows; y++) {
                    for (let x = 0; x < this.boardParams.columns; x++) {
                        tempGems[y][x] = allGems[index++];
                    }
                }

                // Check if there are any possible matches
                hasMatch = this.hasPossibleMatch(tempGems);
            }

            if (!hasMatch) {
                console.error("在最大尝试次数后未能洗牌到可解状态。");
                return;
            }

            // Assign the shuffled gems to the actual board
            this.gems = tempGems;

            for (let y = 0; y < this.boardParams.rows; y++) {
                for (let x = 0; x < this.boardParams.columns; x++) {
                    const gemType = this.gems[y][x];
                    if (this.board[y][x]) {
                        this.nodePool.release(this.gemPrefab, this.board[y][x]);
                        this.board[y][x] = null;
                    }
                    if (gemType !== 0) {
                        this.createGem(y, x, gemType);
                    }
                }
            }
            console.log('洗牌后的棋盘状态:');
            this.printBoard();
        } finally {
            this.currentState = GameState.Idle; // 标记洗牌结束
        }
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
  
    private onGemEliminated(type: number, localPosition: Vec3) {
        // 调用服务客户逻辑
        console.error("onGemEliminated", type);
        this.customerManager.serveSkewer(type, localPosition);
        this.updateGemGroupCountMap(type);
    }
  
    private gameOver(): boolean {
        this.updateLevel(this._level + 1);
        for (let y = 0; y < this.boardParams.rows; y++) {
            for (let x = 0; x < this.boardParams.columns; x++) {
                if (this.gems[y][x] !== 0) {
                    return false;
                }
            }
        }
        return true;
    }
}
