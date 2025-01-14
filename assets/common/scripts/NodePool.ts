/*
 * @Author: Aina
 * @Date: 2025-01-06 17:38:53
 * @LastEditors: Aina
 * @LastEditTime: 2025-01-12 08:30:09
 * @FilePath: /chuanchuan/assets/common/scripts/NodePool.ts
 * @Description: 
 * 
 * Copyright (c) 2025 by ${git_name_email}, All Rights Reserved. 
 */
import { Prefab, instantiate, Node } from 'cc';

export class NodePool {
    private pools: Map<Prefab, Node[]> = new Map();
    private initialSize: number;

    constructor(initialSize: number = 0) {
        this.initialSize = initialSize;
    }

    // 初始化池
    initializePool(prefab: Prefab): void {
        if (!this.pools.has(prefab)) {
            const pool: Node[] = [];
            for (let i = 0; i < this.initialSize; i++) {
                const node = instantiate(prefab);
                pool.push(node);
            }
            this.pools.set(prefab, pool);
        }
    }
    // 获取节点
    acquire(prefab: Prefab): Node {
        this.initializePool(prefab); // 确保池已初始化
        const pool = this.pools.get(prefab);
        return pool.length > 0 ? pool.pop() : instantiate(prefab);
    }

    // 释放节点
    release(prefab: Prefab, node: Node): void {
        this.initializePool(prefab); // 确保池已初始化
        const pool = this.pools.get(prefab);
        // 重置节点状态（可选）
        node.setPosition(0, 0, 0);
        node.setScale(1, 1, 1);
        node.active = false;
        pool.push(node);
    }

    // 获取池中节点数量
    size(prefab: Prefab): number {
        this.initializePool(prefab); // 确保池已初始化
        const pool = this.pools.get(prefab);
        return pool ? pool.length : 0;
    }
}
