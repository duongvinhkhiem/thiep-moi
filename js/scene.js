/* scene.js — Nền 3D (Three.js): hạt sáng, lưới kỹ thuật số, mũ cử nhân wireframe, vòng quỹ đạo.
 * - Có phương án dự phòng: không có THREE / WebGL → thêm class .no-webgl (nền CSS thay thế).
 * - Tự giảm chất lượng trên thiết bị yếu; dừng render khi tab bị ẩn; dọn tài nguyên khi rời trang.
 */
(function () {
  'use strict';

  var Scene = {};
  var root = document.documentElement;

  var renderer, scene, camera, points, uniforms, grid, board, rings = [], hat;
  var raf = 0, running = false, lastTs = 0, t = 0, rise = 0, warp = 0;
  var mouseX = 0, mouseY = 0, useParallax = false, reduced = false;
  var frames = 0, fpsStart = 0, degraded = false, level = 'high', particleCount = 0;
  var disposables = [];
  var listeners = [];

  function on(target, type, fn, opts) {
    target.addEventListener(type, fn, opts);
    listeners.push([target, type, fn, opts]);
  }

  function pickQuality(cfg) {
    var q = (cfg.effects && cfg.effects.quality) || 'auto';
    if (q === 'off' || q === 'low' || q === 'high') return q;
    var small = window.innerWidth < 720;
    var weak = (navigator.hardwareConcurrency || 4) <= 4 ||
               (navigator.deviceMemory && navigator.deviceMemory <= 4);
    return (small || weak) ? 'low' : 'high';
  }

  function track(obj) { disposables.push(obj); return obj; }

  Scene.init = function (cfg) {
    var canvas = document.getElementById('bg');
    if (!canvas) return false;

    level = pickQuality(cfg);
    reduced = window.GradEffects ? window.GradEffects.reduced() : false;

    if (level === 'off' || typeof window.THREE === 'undefined') {
      root.classList.add('no-webgl');
      return false;
    }
    var THREE = window.THREE;

    try {
      renderer = new THREE.WebGLRenderer({
        canvas: canvas, antialias: level === 'high', alpha: true, powerPreference: 'low-power'
      });
    } catch (err) {
      root.classList.add('no-webgl');
      return false;
    }
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, level === 'high' ? 2 : 1.25));

    on(canvas, 'webglcontextlost', function (e) { e.preventDefault(); Scene.stop(); root.classList.add('no-webgl'); });

    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x050914, 16, 58);
    camera = new THREE.PerspectiveCamera(60, 1, 0.1, 200);
    camera.position.set(0, 0, 14);

    /* --- Hạt sáng (GPU: vị trí cuộn lên bằng shader, không tốn CPU mỗi khung hình) --- */
    var eff = cfg.effects || {};
    particleCount = level === 'high' ? (eff.particlesHigh || 1800) : (eff.particlesLow || 600);
    var pos = new Float32Array(particleCount * 3);
    var col = new Float32Array(particleCount * 3);
    var size = new Float32Array(particleCount);
    var spd = new Float32Array(particleCount);
    var palette = [0x22d3ee, 0x22d3ee, 0x3b82f6, 0x8b5cf6, 0xdbe7ff].map(function (h) { return new THREE.Color(h); });
    for (var i = 0; i < particleCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 60;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 40;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 50 - 6;
      var c = palette[(Math.random() * palette.length) | 0];
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
      size[i] = 0.6 + Math.random() * 1.6;
      spd[i] = 0.35 + Math.random() * 1.0;
    }
    var pg = track(new THREE.BufferGeometry());
    pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    pg.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
    pg.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
    pg.setAttribute('aSpeed', new THREE.BufferAttribute(spd, 1));
    uniforms = { uTime: { value: 0 }, uRise: { value: 0 }, uPx: { value: renderer.getPixelRatio() } };
    var pm = track(new THREE.ShaderMaterial({
      uniforms: uniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: [
        'attribute vec3 aColor; attribute float aSize; attribute float aSpeed;',
        'uniform float uTime; uniform float uRise; uniform float uPx;',
        'varying vec3 vColor; varying float vAlpha;',
        'void main(){',
        '  vec3 p = position;',
        '  p.y = mod(p.y + 20.0 + uRise * aSpeed, 40.0) - 20.0;',
        '  p.x += sin(uTime * 0.25 + position.z) * 0.35;',
        '  vec4 mv = modelViewMatrix * vec4(p, 1.0);',
        '  gl_PointSize = aSize * uPx * (34.0 / -mv.z);',
        '  gl_Position = projectionMatrix * mv;',
        '  vColor = aColor;',
        '  vAlpha = smoothstep(-20.0, -13.0, p.y) * smoothstep(20.0, 13.0, p.y);',
        '}'
      ].join('\n'),
      fragmentShader: [
        'varying vec3 vColor; varying float vAlpha;',
        'void main(){',
        '  float d = length(gl_PointCoord - 0.5);',
        '  float a = smoothstep(0.5, 0.0, d);',
        '  gl_FragColor = vec4(vColor, a * vAlpha * 0.9);',
        '}'
      ].join('\n')
    }));
    points = new THREE.Points(pg, pm);
    points.frustumCulled = false;
    scene.add(points);

    /* --- Lưới kỹ thuật số --- */
    grid = new THREE.GridHelper(140, 70, 0x22d3ee, 0x3b82f6);
    grid.material.transparent = true;
    grid.material.opacity = 0.2;
    grid.position.y = -9;
    track(grid.geometry); track(grid.material);
    scene.add(grid);

    /* --- Mũ cử nhân wireframe + vòng quỹ đạo --- */
    hat = new THREE.Group();
    var edgeMat = track(new THREE.LineBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.8 }));
    var fillMat = track(new THREE.MeshBasicMaterial({ color: 0x0a1a3d, transparent: true, opacity: 0.55 }));
    function solid(geo) {
      track(geo);
      var m = new THREE.Mesh(geo, fillMat);
      var eg = track(new THREE.EdgesGeometry(geo));
      m.add(new THREE.LineSegments(eg, edgeMat));
      return m;
    }
    board = solid(new THREE.BoxGeometry(6, 0.22, 6));
    board.rotation.y = Math.PI / 4;
    board.position.y = 0.9;
    var cap = solid(new THREE.CylinderGeometry(1.7, 2.05, 1.3, 6));
    cap.position.y = -0.15;
    hat.add(board, cap);
    var tasselMat = track(new THREE.LineBasicMaterial({ color: 0x8b5cf6 }));
    var tg = track(new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 1.05, 0), new THREE.Vector3(3.3, 1.05, 0), new THREE.Vector3(3.3, -0.5, 0)
    ]));
    hat.add(new THREE.Line(tg, tasselMat));
    var knobGeo = track(new THREE.SphereGeometry(0.16, 10, 10));
    var knob = new THREE.Mesh(knobGeo, track(new THREE.MeshBasicMaterial({ color: 0x8b5cf6 })));
    knob.position.set(3.3, -0.58, 0);
    hat.add(knob);
    hat.rotation.x = 0.32;
    scene.add(hat);

    var ringDefs = [
      { r: 5.6, tilt: [1.15, 0.2, 0.0], speed: 0.45, color: 0x22d3ee },
      { r: 6.6, tilt: [1.45, 0.0, 0.6], speed: -0.3, color: 0x8b5cf6 }
    ];
    ringDefs.forEach(function (d) {
      var torus = new THREE.Mesh(
        track(new THREE.TorusGeometry(d.r, 0.014, 6, level === 'high' ? 160 : 90)),
        track(new THREE.MeshBasicMaterial({ color: d.color, transparent: true, opacity: 0.55 }))
      );
      var orb = new THREE.Mesh(
        track(new THREE.SphereGeometry(0.14, 10, 10)),
        track(new THREE.MeshBasicMaterial({ color: d.color }))
      );
      orb.position.set(d.r, 0, 0);
      var pivot = new THREE.Group();
      pivot.add(torus, orb);
      var outer = new THREE.Group();
      outer.rotation.set(d.tilt[0], d.tilt[1], d.tilt[2]);
      outer.add(pivot);
      hat.add(outer);
      rings.push({ pivot: pivot, speed: d.speed });
    });

    /* --- Sự kiện --- */
    useParallax = !reduced && cfg.effects && cfg.effects.parallax !== false &&
                  window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (useParallax) {
      on(window, 'pointermove', function (e) {
        mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
        mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
      }, { passive: true });
    }
    var rt = 0;
    on(window, 'resize', function () { clearTimeout(rt); rt = setTimeout(resize, 120); });
    on(document, 'visibilitychange', function () { document.hidden ? Scene.stop() : Scene.start(); });
    on(window, 'pagehide', Scene.dispose);

    resize();
    Scene.start();
    return true;
  };

  function resize() {
    if (!renderer) return;
    var w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    uniforms.uPx.value = renderer.getPixelRatio();
    if (reduced || !running) renderOnce();
  }

  function layout(scrollY) {
    var narrow = camera.aspect < 0.85;
    var s = narrow ? 0.6 : 1;
    hat.scale.setScalar(s);
    var baseY = narrow ? 3.4 : 0.4;
    hat.position.set(0, baseY + scrollY * 0.0085, -4);
    // Ẩn khi đã cuộn qua hero để tiết kiệm GPU
    hat.visible = scrollY < window.innerHeight * 1.3;
  }

  function renderOnce() {
    if (!renderer) return;
    layout(window.scrollY || 0);
    renderer.render(scene, camera);
  }

  function frame(ts) {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    var dt = Math.min(0.05, (ts - lastTs) / 1000 || 0.016);
    lastTs = ts;
    t += dt;

    var scrollY = window.scrollY || 0;
    var maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    var progress = scrollY / maxScroll;

    // Hạt bay lên nhanh hơn khi gần cuối trang (phần Thank You) và khi "warp" lúc mở thiệp
    var boost = (progress > 0.85 ? (progress - 0.85) / 0.15 * 2.4 : 0) + warp * 12;
    rise += dt * (0.45 + boost);
    uniforms.uTime.value = t;
    uniforms.uRise.value = rise;
    warp = Math.max(0, warp - dt * 0.55);

    grid.position.z = (t * 0.9) % 2;
    hat.rotation.y += dt * 0.25;
    for (var i = 0; i < rings.length; i++) rings[i].pivot.rotation.z += dt * rings[i].speed;

    var tx = useParallax ? mouseX * 1.1 : 0;
    var ty = useParallax ? -mouseY * 0.7 : 0;
    camera.position.x += (tx - camera.position.x) * 0.05;
    camera.position.y += (ty - camera.position.y) * 0.05;
    camera.position.z = 14 + warp * 9;
    camera.lookAt(0, 0, 0);

    layout(scrollY);
    renderer.render(scene, camera);

    // Giám sát FPS 4 giây đầu: nếu quá thấp thì tự giảm chất lượng
    if (!degraded) {
      if (!fpsStart) { fpsStart = ts; frames = 0; }
      frames++;
      if (ts - fpsStart > 4000) {
        var fps = frames / ((ts - fpsStart) / 1000);
        if (fps < 28) degrade();
        degraded = true;
      }
    }
  }

  function degrade() {
    renderer.setPixelRatio(1);
    uniforms.uPx.value = 1;
    points.geometry.setDrawRange(0, Math.floor(particleCount * 0.45));
    rings.forEach(function (r) { r.pivot.visible = false; });
    root.classList.add('lite');
    resize();
  }

  Scene.start = function () {
    if (!renderer || running) return;
    if (reduced) { renderOnce(); return; }   // tôn trọng prefers-reduced-motion: chỉ vẽ 1 khung tĩnh
    running = true;
    lastTs = performance.now();
    raf = requestAnimationFrame(frame);
  };

  Scene.stop = function () {
    running = false;
    cancelAnimationFrame(raf);
  };

  /** Hiệu ứng "bay vào" khi mở thiệp. */
  Scene.warp = function () { if (!reduced) warp = 1; };

  Scene.dispose = function () {
    Scene.stop();
    listeners.forEach(function (l) { l[0].removeEventListener(l[1], l[2], l[3]); });
    listeners = [];
    disposables.forEach(function (d) { if (d && d.dispose) d.dispose(); });
    disposables = [];
    if (renderer) { renderer.dispose(); renderer = null; }
  };

  window.GradScene = Scene;
})();
