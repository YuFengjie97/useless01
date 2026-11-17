import * as THREE from 'three/webgpu'

export function setLight(scene: THREE.Scene){
  const amb = new THREE.AmbientLight(0xffffff, 1.2)
  scene.add(amb)

  // const pl = new THREE.PointLight(0xffffff, 1000, 50, 3.)
  // pl.position.set(0,10,0)
  // scene.add(pl)
}