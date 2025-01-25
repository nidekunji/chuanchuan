/*
 * @Author: Aina
 * @Date: 2025-01-14 11:28:04
 * @LastEditors: Aina
 * @LastEditTime: 2025-01-25 15:21:06
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
        if (pool.length > 0) {
            let node = pool.pop();
            node.active = true; // 重新激活节点
            return node;
        } else {
            console.warn("No nodes available in pool; instantiating new.");
            return instantiate(prefab);
        }
    }

    // 释放节点
    release(prefab: Prefab, node: Node): void {
        this.initializePool(prefab); // 确保池已初始化
        const pool = this.pools.get(prefab);

        if (pool.indexOf(node) === -1) {
            node.removeFromParent(); // 确保节点已从其父节点中移除
            node.setPosition(0, 0, 0);
            node.setScale(1, 1, 1);
            node.active = false;
            pool.push(node);
        } else {
            if (node) {
                node.removeFromParent();
            }
            console.warn("Node is already in the pool.");
        }
    }

    // 获取池中节点数量
    size(prefab: Prefab): number {
        this.initializePool(prefab); // 确保池已初始化
        const pool = this.pools.get(prefab);
        return pool ? pool.length : 0;
    }

    // 清空指定预制体的节点池
    clear(prefab?: Prefab): void {
        if (prefab) {
            // 清空指定预制体的节点池
            if (this.pools.has(prefab)) {
                const pool = this.pools.get(prefab);
                pool.forEach(node => {
                    node.destroy();
                });
                pool.length = 0;
                this.pools.delete(prefab);
            }
        } else {
            // 清空所有节点池
            this.pools.forEach((pool, prefab) => {
                pool.forEach(node => {
                    node.destroy();
                });
                pool.length = 0;
            });
            this.pools.clear();
        }
    }
}
