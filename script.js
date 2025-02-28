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

  // Boxes default options
  var defaultObjectOptions = {
    // mass: 2,
    restitution: 0,
    friction: 1,
    // sleepThreshold: 80,
    // frictionAir: 0.025, // increasing the frictionAir will make the boxes fall slower
  };

  // Walls default options
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

  // create engine
  var engine = Engine.create({
      // enableSleeping: true,
      pixelRatio: 1,
    }),
    world = engine.world;

  // Reverse gravity
  engine.gravity.y = -1;

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

  function createBodies() {
    Composite.add(world, [
      // ground
      (ground = Bodies.rectangle(
        VIEW.width / 2,
        VIEW.height + 50,
        VIEW.width + 200,
        100,
        groundopts
      )),
      // walls
      (rightWall = Bodies.rectangle(
        VIEW.width + 50,
        VIEW.height / 2,
        100,
        VIEW.height,
        wallopts
      )), // right
      (leftWall = Bodies.rectangle(
        -50,
        VIEW.height / 2,
        100,
        VIEW.height,
        wallopts
      )), // left
    ]);

    // Boxes

    var bodies = [],
      elements = [];

    var blueBox = document.getElementById("blue-box"),
      orangeBox = document.getElementById("orange-box"),
      pinkBox = document.getElementById("pink-box");

    var blueBoxPositionInfo = blueBox.getBoundingClientRect(),
      blueBoxWidth = blueBoxPositionInfo.width,
      blueBoxHeight = blueBoxPositionInfo.height;

    var orangeBoxPositionInfo = orangeBox.getBoundingClientRect(),
      orangeBoxWidth = orangeBoxPositionInfo.width,
      orangeBoxHeight = orangeBoxPositionInfo.height;

    var pinkBoxPositionInfo = pinkBox.getBoundingClientRect(),
      pinkBoxWidth = pinkBoxPositionInfo.width,
      pinkBoxHeight = pinkBoxPositionInfo.height;

    // Elements arraytorender with options
    elements = [
      {
        type: "rectangle",
        el: blueBox,
        x: VIEW.width / 2,
        y: VIEW.height - blueBoxHeight / 2 - orangeBoxHeight - pinkBoxHeight,
        options: {},
      },
      {
        type: "ellipse",
        el: orangeBox,
        x: VIEW.width / 2,
        y: VIEW.height - orangeBoxHeight / 2 - pinkBoxHeight,
        options: {},
      },
      {
        type: "circle",
        el: pinkBox,
        x: VIEW.width / 2,
        y: VIEW.height - pinkBox.offsetHeight / 2,
        options: { isStatic: true },
      },
    ];

    elements.forEach(function (element, i) {
      var body;

      switch (element.type) {
        case "circle":
          body = Bodies.circle(
            element.x,
            element.y,
            pinkBoxWidth / 2,
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
            orangeBoxWidth,
            orangeBoxHeight,
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
            blueBoxWidth,
            blueBoxHeight,
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

    var blueBody = bodies[0];
    var orangeBody = bodies[1];
    var pinkBody = bodies[2];

    // Link the bodies

    var constraintPinkToOrange = Constraint.create({
      bodyA: pinkBody,
      pointA: { x: 0, y: -pinkBoxHeight / 2 }, // top of the pink box
      bodyB: orangeBody,
      pointB: { x: 0, y: orangeBoxHeight / 2 }, // top of the orange box
      length: 1,
      stiffness: 1,
    });

    var constraintBlueToOrange = Constraint.create({
      bodyA: blueBody,
      pointA: { x: 0, y: blueBoxHeight / 2 },
      bodyB: orangeBody,
      pointB: { x: 0, y: -orangeBoxHeight / 2 },
      length: 2,
      stiffness: 1,
    });

    // Add objects to the world
    Composite.add(world, [
      blueBody,
      orangeBody,
      pinkBody,
      constraintPinkToOrange,
      constraintBlueToOrange,
    ]);

    /**
     * Animate objects
     */

    // Pink body variables
    var pinkBodyInitialX = pinkBody.position.x,
      pinkBodyOffset = 80,
      pinkBodySpeed = 0.002;

    // Orange body variables
    var maxAngle = 12 * (Math.PI / 180),
      minAngle = -12 * (Math.PI / 180),
      rotationDirection = 1,
      rotationSpeed = 0.003;

    // Blue body variables
    var maxAngleBlueBody = 14 * (Math.PI / 180),
      minAngleBlueBody = -14 * (Math.PI / 180),
      rotationDirectionBlueBody = 1,
      rotationSpeedBlueBody = 0.003;

    var lastTime = 0,
      forceDirection = 1,
      forceIntensity = 1.5;

    Events.on(engine, "beforeUpdate", function (event) {
      var time = engine.timing.timestamp,
        timeScale = (event.delta || 1000 / 60) / 1000;

      /**
       * Pink Body Swing
       */

      var pinkOffset = pinkBodyOffset * Math.sin(time * pinkBodySpeed);

      Body.setPosition(pinkBody, {
        x: pinkBodyInitialX + pinkOffset,
        y: pinkBody.position.y,
      });

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

      // every tot sec
      // if (engine.timing.timestamp - lastTime >= 4000) {
      //   var forceMagnitude =
      //     forceDirection * forceIntensity * orangeBody.mass * timeScale;

      //   Body.applyForce(
      //     orangeBody,
      //     {
      //       x: orangeBody.position.x + orangeBoxWidth / 2,
      //       y: orangeBody.position.y,
      //     },
      //     {
      //       x: forceMagnitude,
      //       y: 0,
      //     }
      //   );

      //   // update last time
      //   lastTime = engine.timing.timestamp;

      //   forceDirection *= -1;

      //   console.log("every tot secs");
      // }

      /**
       * Blue Body Swing
       */
      // var newAngleBlueBody =
      //   blueBody.angle + rotationSpeedBlueBody * rotationDirectionBlueBody;

      // if (newAngleBlueBody >= maxAngleBlueBody) {
      //   newAngleBlueBody = maxAngleBlueBody;
      //   rotationDirectionBlueBody = -1;
      // } else if (newAngleBlueBody <= minAngleBlueBody) {
      //   newAngleBlueBody = minAngleBlueBody;
      //   rotationDirectionBlueBody = 1;
      // }

      // Body.setAngle(blueBody, newAngleBlueBody);
    });

    Render.lookAt(render, {
      min: { x: 0, y: 0 },
      max: { x: VIEW.width, y: VIEW.height },
    });

    if (debug) {
      blueBox.style.opacity = 0;
      orangeBox.style.opacity = 0;
      pinkBox.style.opacity = 0;
    }

    if (!debug) {
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
    }
  }

  createBodies();

  /**
   * Handle resize
   */
  this.window.addEventListener("resize", function () {
    VIEW.width = window.innerWidth;
    VIEW.height = window.innerHeight;

    render.bounds.max.x = window.innerWidth;
    render.bounds.max.y = window.innerHeight;
    render.options.width = window.innerWidth;
    render.options.height = window.innerHeight;
    render.canvas.width = window.innerWidth;
    render.canvas.height = window.innerHeight;

    Render.setPixelRatio(render, window.devicePixelRatio); // added this

    // Delete all bodies
    World.clear(engine.world, false);

    // Recreate bodies
    createBodies();
  });

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
