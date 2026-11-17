import './style.css'
import { initScene, scene, camera } from './world/scene'
import * as THREE from 'three'
import { setLight } from './world/light'
import { skybox } from './world/skybox'
import { cubeMatrix, cubeParticle, cubeRing, initPane, plane } from './world/thing'


(async() => {
  await initScene()
  camera.position.set(0, 20, 60)

  // const axesHelper = new THREE.AxesHelper(10)
  // scene.add(axesHelper)

  setLight(scene)
  // skybox(scene)
  cubeRing(scene)
  plane(scene)
  cubeMatrix(scene)
  cubeParticle(scene)
  initPane()
})()