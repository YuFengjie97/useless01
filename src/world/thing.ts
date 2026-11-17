import { abs, cos, cross, dot, float, smoothstep, Fn, time, instancedArray, instanceIndex, mat2, mat3, PI, positionLocal, select, sin, vec3, vec2, rotate, length, uv, max, mx_noise_vec3, mx_noise_float, texture, fract, drawIndex, vec4, attribute, hash, step, mix, exp, deltaTime, If, uniform } from 'three/tsl'
import * as THREE from 'three/webgpu'
import { renderer } from './scene'
import { emitter } from '@/utils/emitter'
import { GLTFLoader } from 'three/examples/jsm/Addons.js'
import { gui } from '@/utils/guiPane';

const uniforms = {
  uCol: uniform(vec3(0, 1, 0))
}

export function initPane() {
  const pane = gui.addFolder('color')
  pane.addColor({ col: { r: 0, g: 1, b: 0 } }, 'col', 1).onChange((v) => {
    const {r,g,b} = v
    uniforms.uCol.value.set(r,g,b)
  })
}


const getEdge = (edgeWidth: THREE.Node<'float'>) => {
  const currentUV = uv();
  // 1. 计算 UV 距离中心 (0.5, 0.5) 的绝对距离
  // 范围是 0.0 (中心) 到 0.5 (边缘)
  const distFromCenter = abs(currentUV.sub(0.5));

  // 2. 取 X 和 Y 轴上距离中心最远的那个值作为边缘距离
  // 如果 maxDist 接近 0.5，说明靠近边缘
  const maxDist = max(distFromCenter.x, distFromCenter.y);


  // 4. 计算边缘阈值：0.5 - edgeWidth
  // 如果 maxDist > threshold，说明在边缘范围内
  const threshold = float(0.5).sub(edgeWidth);

  // 5. 生成 0 或 1 的遮罩 (step(edge, x) 返回 x >= edge ? 1 : 0)
  const edgeMask = step(threshold, maxDist);
  return edgeMask
}


// 起伏圆环
export async function cubeRing(scene: THREE.Scene) {
  const geo = new THREE.BoxGeometry(2, 2, 2, 1, 1, 1)
  // const geo = new THREE.IcosahedronGeometry(1, 0)


  const mat = new THREE.MeshStandardNodeMaterial()


  const count = 40
  const posBuffer = instancedArray(new Float32Array(count * 3), 'vec3')
  const faceDirBuffer = instancedArray(new Float32Array(count * 3), 'vec3')
  const angBuffer = instancedArray(new Float32Array(count), 'float')

  const init = Fn(() => {
    const r = float(30)
    const a = float(instanceIndex).div(count).mul(PI).mul(2)
    const x = cos(a).mul(r)
    const z = sin(a).mul(r)
    const y = 10

    posBuffer.element(instanceIndex).assign(vec3(x, y, z))

    faceDirBuffer.element(instanceIndex).assign(vec3(0).sub(vec3(x, y, z)).normalize())

    angBuffer.element(instanceIndex).assign(a)
  })().compute(count)

  renderer.compute(init)

  const rot2D = (a: THREE.Node<'float'>) => {
    const c = cos(a)
    const s = sin(a)
    return mat2(c, -s, s, c)
  }

  mat.positionNode = Fn(() => {
    const pos = posBuffer.element(instanceIndex)
    const dir = faceDirBuffer.element(instanceIndex)

    // const x = cross(dir, vec3(0,1,0)).normalize()
    // const y = cross(x, dir).normalize()
    // const z = dir
    // const rot1 = mat3(x, y, z)

    const ang = angBuffer.element(instanceIndex)
    const yOffset = sin(ang.mul(3).add(time.mul(4)))
      .mul(sin(cos(time).mul(6.))).mul(4.)

    const rot2 = rotate(positionLocal, vec3(time.mul(4)))
    // return rot1.mul(positionLocal).add(pos).add(vec3(0,yOffset,0))
    return rot2.add(pos).add(vec3(0, yOffset, 0))
  })()


  mat.colorNode = Fn(() => {
    const edge = getEdge(float(.06))
    return mix(uniforms.uCol.mul(.2), uniforms.uCol.mul(4.), edge)
  })()

  emitter.on('animate', () => {
  })

  const mesh = new THREE.InstancedMesh(geo, mat, count)

  emitter.on('animate', ({ delta, elapsed }) => {
    mesh.rotation.y -= delta * 1.
  })

  scene.add(mesh)
}

// 地面噪波
export async function plane(scene: THREE.Scene) {
  const geo = new THREE.PlaneGeometry(300, 300, 1, 1)
  const mat = new THREE.MeshStandardNodeMaterial()
  mat.transparent = true
  mat.side = THREE.DoubleSide

  const texLoader = new THREE.TextureLoader()

  const noiseTex = await texLoader.loadAsync(`${import.meta.env.BASE_URL}img/Swirl 2 - 512x512.png`)
  noiseTex.minFilter = THREE.LinearFilter
  noiseTex.magFilter = THREE.LinearFilter
  noiseTex.wrapS = THREE.RepeatWrapping
  noiseTex.wrapT = THREE.RepeatWrapping


  const noise = (p: THREE.Node<'vec2'>) => {
    return texture(noiseTex, p).r
  }



  mat.colorNode = Fn(() => {
    const n1 = noise(uv().mul(2.))
    const n2 = noise(uv().mul(2.).add(.1))
    const nn = vec2(n1, n2).sub(.5)

    let d = sin(
      length(uv().add(nn.mul(.1)).sub(.5))
        .mul(30).add(time.mul(10.))
    ).mul(.5).add(.5)

    d = max(0.001, d)

    // d = smoothstep(.1, 0., d)
    d = exp(d.mul(-20))
    const col = uniforms.uCol.mul(d)
    const alpha = d
    return vec4(col.mul(4.), alpha)
  })()



  const mesh = new THREE.Mesh(geo, mat)
  mesh.position.set(0, .1, 0)
  mesh.rotation.x = -3.1415926 / 2
  scene.add(mesh)
}

// 中心模型
export async function cubeMatrix(scene: THREE.Scene) {
  const loader = new GLTFLoader()
  const geo = await ((await loader.loadAsync(`${import.meta.env.BASE_URL}cubeMatx.glb`)).scene.children[0] as THREE.Mesh).geometry

  const mat = new THREE.MeshBasicNodeMaterial()


  const cubeId = attribute<'float'>('_id', 'float')
  mat.positionNode = Fn(() => {
    const rot = rotate(positionLocal, vec3(time));
    const pos = rot.mul(sin(time).mul(.5).add(.9))
    return pos
  })()
  mat.colorNode = Fn(() => {
    const h = hash(cubeId.add(time.mul(10.)))
    const glow = step(0.5, h).add(1.)
    return uniforms.uCol.mul(glow)
  })()

  const mesh = new THREE.Mesh(geo, mat)
  mesh.position.set(0, 10, 0)
  mesh.scale.set(6, 6, 6)


  scene.add(mesh)
}

// 环绕cube
export function cubeParticle(scene: THREE.Scene) {
  const count = 3000
  const geo = new THREE.BoxGeometry(1, 1, 1, 1, 1, 1)
  const mat = new THREE.MeshBasicNodeMaterial()

  const posBuffer = instancedArray(new Float32Array(count * 3), 'vec3')
  const lifeBuffer = instancedArray(new Float32Array(count), 'float')



  const getRandomPos = () => {
    const x = hash(float(instanceIndex).add(time).add(2.6)).sub(.5).mul(100)
    const z = hash(float(instanceIndex).add(time).add(6.1)).sub(.5).mul(100)
    const y = hash(float(instanceIndex).add(time).add(9.4)).mul(80)
    return vec3(x, y, z)
  }


  const init = Fn(() => {
    const pos = getRandomPos()
    posBuffer.element(instanceIndex).assign(pos)
    lifeBuffer.element(instanceIndex).assign(hash(instanceIndex))
  })().compute(count)
  renderer.compute(init)


  const update = Fn(() => {
    const pos = posBuffer.element(instanceIndex)
    const life = lifeBuffer.element(instanceIndex)
    If(life.greaterThan(1.), () => {
      life.assign(fract(life))
      const pos = getRandomPos()
      posBuffer.element(instanceIndex).assign(pos)
    })
      .Else(() => {
        life.addAssign(deltaTime.mul(.1))
        pos.assign(mix(pos, vec3(0, 10, 0), life))
      })
  })().compute(count)


  emitter.on('animate', () => {
    renderer.compute(update)
  })


  mat.positionNode = Fn(() => {
    const scale = lifeBuffer.element(instanceIndex)
    const pos = rotate(positionLocal, vec3(time.mul(5)))
    pos.mulAssign(scale.oneMinus())

    pos.addAssign(posBuffer.element(instanceIndex))
    return pos
  })()

  mat.colorNode = Fn(() => {
    const edgeMask = getEdge(float(.08))
    return mix(uniforms.uCol.mul(.1), uniforms.uCol.mul(3.), edgeMask)
  })()

  const mesh = new THREE.InstancedMesh(geo, mat, count)
  scene.add(mesh)
}