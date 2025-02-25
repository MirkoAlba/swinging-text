window.addEventListener("load", function () {
  // Matter.js module aliases
  var Engine = Matter.Engine,
    Render = Matter.Render,
    Runner = Matter.Runner,
    World = Matter.World,
    Bodies = Matter.Bodies,
    Common = Matter.Common;

  // provide concave decomposition support library for ellipses
  Common.setDecomp(window.decomp);

  var VIEW = {};
  VIEW.width = window.innerWidth;
  VIEW.height = window.innerHeight;

  var defaultObjectOptions = {
    // mass: 2,
    // restitution: 0.01,
    // friction: 0.001,
    sleepThreshold: 80,
    // frictionAir: 0.025, // increasing the frictionAir will make the boxes fall slower
  };

  // create engine
  var engine = Engine.create({
      enableSleeping: true,
      pixelRatio: 1,
    }),
    world = engine.world;

  var debug = false,
    url = new URL(window.location.href);

  // ?debug=true
  if (url.searchParams.get("debug") == 1) {
    debug = true;
  }

  var container = document.getElementById("container");

  // create renderer
  var render = Render.create({
    engine: engine,
    element: debug ? container : false,
    options: {
      width: VIEW.width,
      height: VIEW.height,
      background: "#f2f2f2",
      wireframeBackground: false,
      wireframes: false,
      hasBounds: true,
      enabled: true,
      showSleeping: debug,
      showDebug: debug,
      showBroadphase: debug,
      showBounds: debug,
      showVelocity: debug,
      showCollisions: debug,
      showAxes: false,
      showPositions: debug,
      showAngleIndicator: debug,
      showIds: debug,
      showShadows: false,
    },
  });

  Render.run(render);

  // create runner
  var runner = Runner.create({
    enableSleeping: false,
  });

  Runner.run(runner, engine);

  // add walls
  var wallopts = {
    isStatic: true,
    restitution: 0.1,
    friction: 0.2,
  };

  var groundopts = {
    isStatic: true,
    restitution: 0.1,
    friction: 0.2,
  };

  World.add(world, [
    // ground
    Bodies.rectangle(
      VIEW.width / 2,
      VIEW.height + 50,
      VIEW.width + 200,
      100,
      groundopts
    ),
    // walls
    Bodies.rectangle(
      VIEW.width + 50,
      VIEW.height / 2,
      100,
      VIEW.height,
      wallopts
    ), // right
    Bodies.rectangle(-50, VIEW.height / 2, 100, VIEW.height, wallopts), // left
  ]);

  // Boxes

  var bodies = [],
    elements = [];

  var blueBox = document.getElementById("blue-box"),
    orangeBox = document.getElementById("orange-box"),
    pinkBox = document.getElementById("pink-box");

  elements = [
    { type: "rectangle", el: blueBox, x: VIEW.width / 2, y: -500, options: {} },
    {
      type: "ellipse",
      el: orangeBox,
      x: VIEW.width / 2,
      y: 0,
      options: { chamfer: { radius: 265 } },
    },
    { type: "circle", el: pinkBox, x: VIEW.width / 2, y: 0, options: {} },
  ];

  elements.forEach(function (element, i) {
    var boxPositionInfo = element.el.getBoundingClientRect(),
      bodyWidth = boxPositionInfo.width,
      bodyHeight = boxPositionInfo.height;

    var body;

    if (element.type == "circle") {
      body = Bodies.circle(
        element.x,
        element.y,
        bodyWidth / 2,
        deepMerge(
          {},
          {
            ...defaultObjectOptions,
            ...element.options,
          }
        )
      );
    } else if (element.type == "ellipse") {
      function createEllipse(x, y, width, height, sides = 30) {
        const vertices = [];
        const a = width / 2; // raggio orizzontale
        const b = height / 2; // raggio verticale

        for (let i = 0; i < sides; i++) {
          const angle = ((2 * Math.PI) / sides) * i;
          vertices.push({
            x: a * Math.cos(angle),
            y: b * Math.sin(angle),
          });
        }

        // Crea il corpo usando i vertici calcolati
        return Bodies.fromVertices(
          x,
          y,
          [vertices],
          {
            // Opzioni del corpo (es. restitution, friction, ecc.)
          },
          true
        );
      }

      body = createEllipse(element.x, element.y, bodyWidth, bodyHeight);
    } else {
      body = Bodies.rectangle(
        element.x,
        element.y,
        bodyWidth,
        bodyHeight,
        deepMerge(
          {},
          {
            ...defaultObjectOptions,
            ...element.options,
          }
        )
      );
    }

    body.id = element.el.id;

    bodies.push(body);

    element.el.style.opacity = 1; // make the element visible again
  });

  World.add(engine.world, bodies);

  (function update() {
    for (var i = 0, l = elements.length; i < l; i++) {
      var bodyDom = elements[i].el,
        body = null;

      for (var j = 0, k = bodies.length; j < k; j++) {
        if (bodies[j].id == bodyDom.id) {
          body = bodies[j];

          break;
        }
      }

      if (body === null) continue;

      bodyDom.style.transform =
        "translate( " +
        (body.position.x - bodyDom.offsetWidth / 2) +
        "px, " +
        (body.position.y - bodyDom.offsetHeight / 2) +
        "px )";
      bodyDom.style.transform += "rotate( " + body.angle + "rad )";
    }

    window.requestAnimationFrame(update);
  })();
});

/**
 * Simple object check.
 * @param item
 * @returns {boolean}
 */
function isObject(item) {
  return item && typeof item === "object" && !Array.isArray(item);
}

/**
 * Deep merge two objects.
 * @param target
 * @param ...sources
 */
function deepMerge(target, ...sources) {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        deepMerge(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return deepMerge(target, ...sources);
}
