window.addEventListener("load", function () {
  // Matter.js module aliases
  var Engine = Matter.Engine,
    Render = Matter.Render,
    Runner = Matter.Runner,
    World = Matter.World,
    Bodies = Matter.Bodies,
    Body = Matter.Body,
    Common = Matter.Common,
    Events = Matter.Events,
    Constraint = Matter.Constraint,
    Composite = Matter.Composite;

  // provide concave decomposition support library for ellipses
  Common.setDecomp(window.decomp);

  var VIEW = {};
  VIEW.width = window.innerWidth;
  VIEW.height = window.innerHeight;

  var defaultObjectOptions = {
    mass: 2,
    restitution: 0,
    friction: 1,
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

  var speed = url.searchParams.get("speed");

  // fall speed
  if (speed && speed > 0) {
    engine.timing.timeScale = speed;
  }

  var container = document.getElementById("container");

  // create renderer
  var render = Render.create({
    engine: engine,
    element: debug ? container : false,
    options: {
      width: VIEW.width,
      height: VIEW.height,
      background: "#ffe256",
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
    restitution: 0,
    friction: 1,
  };

  var groundopts = {
    isStatic: true,
    restitution: 0,
    friction: 1,
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

  // Elements arraytorender with options
  elements = [
    // {
    //   type: "rectangle",
    //   el: blueBox,
    //   x: VIEW.width / 2,
    //   y: VIEW.height - pinkBox.offsetHeight - orangeBox.offsetHeight,
    //   options: {},
    // },
    {
      type: "ellipse",
      el: orangeBox,
      x: VIEW.width / 2,
      y: VIEW.height - pinkBox.offsetHeight - 20,
      options: {},
    },
    {
      type: "circle",
      el: pinkBox,
      x: VIEW.width / 2,
      y: VIEW.height - pinkBox.offsetHeight / 2,
      options: {},
    },
  ];

  elements.forEach(function (element, i) {
    var boxPositionInfo = element.el.getBoundingClientRect(),
      bodyWidth = boxPositionInfo.width,
      bodyHeight = boxPositionInfo.height;

    var body;

    switch (element.type) {
      case "circle":
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
        break;

      case "ellipse":
        body = createEllipse(
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
        break;

      default:
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

        break;
    }

    body.id = element.el.id;

    bodies.push(body);

    element.el.style.opacity = 1; // make the element visible again
  });

  World.add(engine.world, bodies);

  var orangeBody = bodies[0];
  var pinkBody = bodies[1];

  // Link the bodies

  var constraint = Constraint.create({
    bodyA: pinkBody,
    pointA: { x: 0, y: -pinkBox.offsetHeight / 2 }, // top of the pink box
    bodyB: orangeBody,
    pointB: { x: 0, y: 0 },
    // length: orangeBox.offsetHeight / 2,
    // stiffness: 1,
  });

  Composite.add(world, [pinkBody, orangeBody, constraint]);

  // Animate objects

  // Pink body variables
  var pinkBodyInitialX = pinkBody.position.x;

  // Orange body variables
  var orangeBodyInitialX = orangeBody.position.x,
    maxAngle = 12 * (Math.PI / 180), // 30 gradi
    minAngle = -12 * (Math.PI / 180), // -30 gradi
    rotationDirection = 1,
    rotationSpeed = 0.003;

  Events.on(engine, "beforeUpdate", function (event) {
    var time = engine.timing.timestamp,
      timeScale = (event.delta || 1000 / 60) / 1000;

    /**
     * Pink Body Swing
     */
    // var pinkOffset = 20 * Math.sin(time * 0.001);
    // Body.setPosition(pinkBody, {
    //   x: pinkBodyInitialX + pinkOffset,
    //   y: pinkBody.position.y,
    // });

    /**
     * Orange Body Swing
     */
    // var newAngle = orangeBody.angle + rotationSpeed * rotationDirection;

    // if (newAngle >= maxAngle) {
    //   newAngle = maxAngle;
    //   rotationDirection = -1;
    // } else if (newAngle <= minAngle) {
    //   newAngle = minAngle;
    //   rotationDirection = 1;
    // }

    // Body.setAngle(orangeBody, newAngle);

    // var orangeOffset = 20 * Math.sin(time * 0.001);
    // Body.setPosition(orangeBody, {
    //   x: orangeBodyInitialX + orangeOffset,
    //   y: orangeBody.position.y,
    // });
  });

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

      // bodyDom.style.transform =
      //   "translate( " +
      //   (body.position.x - bodyDom.offsetWidth / 2) +
      //   "px, " +
      //   (body.position.y - bodyDom.offsetHeight / 2) +
      //   "px )";
      // bodyDom.style.transform += "rotate( " + body.angle + "rad )";
    }

    window.requestAnimationFrame(update);
  })();

  function createEllipse(x, y, width, height, options, sides = 100) {
    var vertices = [];
    var a = width / 2; // horizontal radius
    var b = height / 2; // vertical radius

    for (let i = 0; i < sides; i++) {
      var angle = ((2 * Math.PI) / sides) * i;
      vertices.push({
        x: a * Math.cos(angle),
        y: b * Math.sin(angle),
      });
    }

    return Bodies.fromVertices(x, y, [vertices], options, true);
  }
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
  var source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (var key in source) {
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
