import * as THREE from 'three/webgpu'
import { abs, attribute, dFdx, dFdy, dot, float, floor, Fn, fract, fwidth, hash, max, min, mix, mx_noise_float, normalLocal, normalView, positionLocal, pow, sin, smoothstep, step, time, transformedNormalView, uniform, uv, varying, vec3, vec4 } from "three/tsl"

export function skybox(scene: THREE.Scene){
  const size = 300
  const geo = new THREE.BoxGeometry(size,size,size,1,1,1)
  const mat = new THREE.MeshPhysicalNodeMaterial()

  mat.side = THREE.BackSide

  
  mat.colorNode = Fn(() => {
    const uv2 = uv().mul(30.)
    const uvi = floor(uv2)
    const uvf = fract(uv2)

    const dx = abs(uvf.x.sub(.5))
    const dy = abs(uvf.y.sub(.5))
    let d = min(dx, dy)
    d = smoothstep(.01, 0., d.sub(.02))


    const c = vec3(.5)
    // const c = vec3(hash(uvi.x.add(uvi.y).mul(113.3)))
    return mix(c, vec3(0.1), d)
  })()

  const mesh = new THREE.Mesh(geo, mat)
  mesh.position.set(0,size/2,0)


  scene.add(mesh)
}