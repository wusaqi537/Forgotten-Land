/*
新的角色模型组件
*/

import { useAnimations, useGLTF } from "@react-three/drei";
import { useGraph } from "@react-three/fiber";
import React, { useEffect, useMemo, useRef } from "react";
import { Color, LoopOnce, MeshStandardMaterial } from "three";
import { SkeletonUtils } from "three-stdlib";

// 新模型的动画映射表
const ANIMATION_MAPPING = {
  "Idle": "idle",      // 原动画名: 新模型动画名
  "Run": "running",    
  "Walk": "walk",
  "Jump": "jump",
  "Death": "idle"      // 没有死亡动画，暂时用idle
};

export function NewCharacter({
  color = "black",
  animation = "Idle",
  ...props
}) {
  const group = useRef();
  const { scene, materials, animations } = useGLTF(
    "models/character_model/人物.gltf"
  );
  
  // 克隆模型，避免多个实例共享同一个骨骼
  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene]);
  const { nodes } = useGraph(clone);
  const { actions } = useAnimations(animations, group);

  // 动画控制
  useEffect(() => {
    // 获取映射后的动画名
    const mappedAnimation = ANIMATION_MAPPING[animation] || "idle";
    
    // 确保动画存在
    if (actions[mappedAnimation]) {
      // 停止所有其他动画
      Object.values(actions).forEach(action => action.stop());
      
      // 播放新动画
      actions[mappedAnimation].reset().fadeIn(0.2).play();
    }
    
    return () => {
      if (actions[mappedAnimation]) {
        actions[mappedAnimation].fadeOut(0.2);
      }
    };
  }, [animation, actions]);

  // 材质控制
  const playerColorMaterial = useMemo(
    () => new MeshStandardMaterial({
      color: new Color(color),
    }),
    [color]
  );

  // 应用材质和阴影
  useEffect(() => {
    clone.traverse((child) => {
      if (child.isMesh) {
        // 如果需要自定义颜色的部分，可以根据材质名称判断
        // if (child.material.name === "需要自定义颜色的材质名") {
        //   child.material = playerColorMaterial;
        // }
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [clone, playerColorMaterial]);

  return (
    <group {...props} dispose={null} ref={group}>
      <primitive object={clone} />
    </group>
  );
}

useGLTF.preload("models/character_model/人物.gltf"); 