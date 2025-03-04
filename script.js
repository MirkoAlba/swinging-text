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
    restitution: 0.5,
    friction: 1,
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

  // White spawning circle spawing options
  var fallingCircleOptions = {
    seconds: 6,
    xPosition: VIEW.width / 2 + 200,
    yPosition: -VIEW.height,
    circleDimensions: 30,
    fallingSpeed: 20,
    defaultBodyOptions: {
      isStatic: false,
      restitution: 0.6,
      friction: 1,
    },
  };

  // Wobble
  var pinkBodyOffset = 80, // amplitude of the wobble
    pinkBodySpeed = 0.0025; // speed of the wobble

  if (window.matchMedia("(max-width: 576px)").matches) {
    pinkBodyOffset = 40;

    fallingCircleOptions.xPosition = VIEW.width / 2;
    fallingCircleOptions.circleDimensions = 15;
  }

  // Mobile gentle rotation
  var rotationSpeed = 0.001;
  var maxAngle = Math.PI / 20;
  var rotationDirection = 1;

  // Store timeouts ids to be able to clear them
  var timeoutsIds = [],
    intervalsIds = [];

  // create engine
  var engine = Engine.create({
      pixelRatio: window.devicePixelRatio,
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

  if (window.matchMedia("(max-width: 576px)").matches) {
    engine.timing.timeScale = 0.5;
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

  // create runner
  var runner = Runner.create({
    enableSleeping: false,
    // constraintIterations: 6,
    // positionIterations: 8,
    // velocityIterations: 8,
  });

  Runner.run(runner, engine);

  function createBodies() {
    // add walls

    Composite.add(world, [
      // walls
      (rightWall = Bodies.rectangle(
        VIEW.width + 200,
        VIEW.height / 2,
        100,
        VIEW.height,
        wallopts
      )), // right
      (leftWall = Bodies.rectangle(
        -200,
        VIEW.height / 2,
        100,
        VIEW.height,
        wallopts
      )), // left
    ]);

    rightWall.id = "rightWall";
    leftWall.id = "leftWall";
    // ground.id = "ground";

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

    var blueBoxStartingOffset = 0,
      orangeBoxStartingOffset = 0;

    var orangeBodyRestitution = 0.7,
      blueBodyRestitution = 0.7;

    if (window.matchMedia("(max-width: 576px)").matches) {
      orangeBodyRestitution = 0.4;
    }

    // Elements arraytorender with options
    elements = [
      {
        // blue body
        type: "rectangle",
        el: blueBox,
        x: VIEW.width / 2,
        y:
          VIEW.height * 2 -
          blueBoxHeight -
          orangeBoxHeight +
          blueBoxStartingOffset,
        options: {
          restitution: blueBodyRestitution,
          inertia: Infinity,
          // isStatic: true,
        },
      },
      {
        // orange body
        type: "ellipse",
        el: orangeBox,
        x: VIEW.width / 2,
        y: VIEW.height * 2 - orangeBoxHeight + orangeBoxStartingOffset,
        options: {
          restitution: orangeBodyRestitution,
          inertia: Infinity,
          // isStatic: true,
        },
      },
      {
        // pink body
        type: "circle",
        el: pinkBox,
        x: VIEW.width / 2,
        y: VIEW.height * 2,
        options: { isStatic: true },
      },
    ];

    elements.forEach(function (element, i) {
      var body;

      switch (element.type) {
        case "falling-circle":
          body = element.body;

          break;
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
            blueBoxHeight + 4,
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
      length: 3,
      stiffness: 1,
    });

    // Add objects to the world
    Composite.add(world, [blueBody, orangeBody, pinkBody]);

    // Popup/Intro section options
    var tweenTimeScale = 1.5; // speed
    var pinkBodyInitialY = { y: pinkBody.position.y };

    // Final y position of the bodies
    var finalYPinkBody = VIEW.height - pinkBoxHeight - 100,
      finalYPinkBodyBounce = VIEW.height - pinkBoxHeight / 2,
      finalYOrangeBody = VIEW.height - orangeBoxHeight - 60,
      finalYBlueBody =
        VIEW.height - blueBoxHeight - orangeBoxHeight - pinkBoxHeight - 100;

    if (window.matchMedia("(max-width: 576px)").matches) {
      finalYPinkBody = VIEW.height - pinkBoxHeight - 50;

      finalYOrangeBody = VIEW.height - orangeBoxHeight - 100;

      finalYBlueBody =
        VIEW.height - blueBoxHeight - orangeBoxHeight - pinkBoxHeight - 150;
    }

    // Tween pink body
    var tlPinkBody = gsap.to(pinkBodyInitialY, {
      y: finalYPinkBody,
      duration: 1,
      onUpdate() {
        Body.setPosition(pinkBody, {
          x: VIEW.width / 2,
          y: pinkBodyInitialY.y,
        });
      },
      onComplete() {
        var tlPinkBodyBounce = gsap.to(pinkBodyInitialY, {
          y: finalYPinkBodyBounce,
          duration: 1.75,
          ease: "bounce.out",
          onUpdate() {
            Body.setPosition(pinkBody, {
              x: VIEW.width / 2,
              y: pinkBodyInitialY.y,
            });
          },
          onComplete() {
            Composite.add(world, [
              // ground
              Bodies.rectangle(
                VIEW.width / 2,
                VIEW.height + 50,
                VIEW.width + 200,
                100,
                groundopts
              ),
            ]);
          },
        });

        tlPinkBodyBounce.timeScale(tweenTimeScale);
      },
    });

    tlPinkBody.timeScale(tweenTimeScale);

    // Tween orange body
    var orangeBodyInitialY = { y: orangeBody.position.y };

    var tlOrangeBody = gsap.to(orangeBodyInitialY, {
      y: finalYOrangeBody,
      duration: 1,
      onUpdate() {
        Body.setPosition(orangeBody, {
          x: VIEW.width / 2,
          y: orangeBodyInitialY.y,
        });
      },
      onComplete() {
        var toTlOrangeBody = setTimeout(function () {
          // Reverse gravity
          engine.gravity.y = -1;

          Composite.add(world, [constraintPinkToOrange]);
        }, 3100);

        timeoutsIds.push(toTlOrangeBody);
      },
    });

    tlOrangeBody.timeScale(tweenTimeScale);

    // Tween blue body
    var blueBodyInitialY = { y: blueBody.position.y };

    var tlBlueBody = gsap.to(blueBodyInitialY, {
      y: finalYBlueBody,
      duration: 1,
      onUpdate() {
        Body.setPosition(blueBody, {
          x: VIEW.width / 2,
          y: blueBodyInitialY.y,
        });
      },
      onComplete() {
        var toTlBlueBody = setTimeout(function () {
          Composite.add(world, [constraintBlueToOrange]);

          var time = 0;

          // start the animation
          Events.on(engine, "beforeUpdate", function (event) {
            /**
             * White Body Circle
             */
            // Normal gravity
            world.bodies.forEach((body) => {
              if (body.reverseGravity) {
                const additionalForce = {
                  x: 0,
                  y: body.mass * 2 * engine.world.gravity.scale,
                };
                Body.applyForce(body, body.position, additionalForce);
                Body.setAngularVelocity(body, 2);
              }
            });

            /**
             * Pink Body Swing
             */
            var pinkOffset = pinkBodyOffset * Math.sin(time * pinkBodySpeed);
            Body.setPosition(pinkBody, {
              x: pinkBodyInitialX + pinkOffset,
              y: pinkBody.position.y,
            });

            /**
             * Blue Body Swing
             */

            if (window.matchMedia("(max-width: 576px)").matches) {
              if (blueBody.angle >= maxAngle) {
                rotationDirection = -1;
              } else if (blueBody.angle <= -maxAngle) {
                rotationDirection = 1;
              }

              Body.rotate(blueBody, rotationSpeed * rotationDirection);
            }

            // update time
            time = time + 10;
          });

          Events.on(engine, "collisionStart", function (event) {
            event.pairs.forEach((pair) => {
              if (
                pair.bodyB.id == rightWall.id ||
                pair.bodyB.id == leftWall.id
              ) {
                document.getElementById(pair.bodyA.id)?.remove();
                World.remove(world, pair.bodyA);
              }
            });
          });

          spawnFallingCircle(
            fallingCircleOptions.seconds,
            fallingCircleOptions.xPosition,
            fallingCircleOptions.yPosition,
            fallingCircleOptions.circleDimensions,
            fallingCircleOptions.fallingSpeed
          );

          // reset inertia initial values
          Body.setInertia(orangeBody, 17261018.8762768);
          Body.setInertia(blueBody, 43666991.38030446);
        }, 3100);

        timeoutsIds.push(toTlBlueBody);
      },
    });

    tlBlueBody.timeScale(tweenTimeScale);

    /**
     * Animate objects
     * Tweak variables
     */

    // Pink body variables
    var pinkBodyInitialX = pinkBody.position.x;

    Render.lookAt(render, {
      min: { x: 0, y: 0 },
      max: { x: VIEW.width, y: VIEW.height },
    });

    if (debug) {
      blueBox.style.opacity = 0;
      orangeBox.style.opacity = 0;
      pinkBox.style.opacity = 0;

      Render.run(render);
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

        world.bodies.forEach((body) => {
          if (body.id.toString().toLowerCase().includes("falling-circle")) {
            var bodyDom = document.getElementById(body.id);

            bodyDom.style.transform =
              "translate( " +
              (body.position.x - bodyDom.offsetWidth / 2) +
              "px, " +
              (body.position.y - bodyDom.offsetHeight / 2) +
              "px )";
            bodyDom.style.transform += "rotate( " + body.angle + "rad )";
            bodyDom.style.opacity = 1;
          }
        });

        window.requestAnimationFrame(update);
      })();
    }

    function spawnFallingCircle(
      seconds,
      xPosition,
      yPosition,
      circleDimensions,
      fallingSpeed
    ) {
      const circle = Bodies.circle(
        xPosition,
        yPosition,
        circleDimensions,
        fallingCircleOptions.defaultBodyOptions
      );

      Matter.Body.setVelocity(circle, { x: 0, y: fallingSpeed });

      circle.reverseGravity = true;

      circle.id = "falling-circle-" + Math.floor(1000 + Math.random() * 9000);

      var newElement = document.createElement("div");

      newElement.classList.add("box");

      newElement.classList.add("box--white");

      newElement.id = circle.id;

      newElement.style.width = circleDimensions * 2 + "px";

      newElement.style.height = circleDimensions * 2 + "px";

      container.prepend(newElement);

      Composite.add(world, circle);

      var spawnInterval = setInterval(() => {
        const circle = Bodies.circle(
          xPosition,
          yPosition,
          circleDimensions,
          fallingCircleOptions.defaultBodyOptions
        );

        Matter.Body.setVelocity(circle, { x: 0, y: fallingSpeed });

        circle.reverseGravity = true;

        circle.id = "falling-circle-" + Math.floor(1000 + Math.random() * 9000);

        var newElement = document.createElement("div");

        newElement.classList.add("box");

        newElement.classList.add("box--white");

        newElement.id = circle.id;

        newElement.style.width = circleDimensions * 2 + "px";

        newElement.style.height = circleDimensions * 2 + "px";

        container.prepend(newElement);

        Composite.add(world, circle);
      }, seconds * 1000);

      intervalsIds.push(spawnInterval);
    }
  }

  createBodies();

  /**
   * Handle resize
   */

  this.window.addEventListener(
    "resize",
    debounce(function () {
      engine.gravity.y = 1;

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

      // Clear all timeouts
      timeoutsIds.forEach(function (id) {
        clearTimeout(id);
      });

      // Clear all intervals
      intervalsIds.forEach(function (id) {
        clearInterval(id);
      });

      // clear gsap timelines
      gsap.globalTimeline.clear();

      // reset all the dom elements
      document.querySelectorAll(".box").forEach((element) => {
        element.style.transform = "";

        if (element.id.toString().toLowerCase().includes("falling-circle")) {
          element.remove();
        }
      });

      // Recreate bodies
      createBodies();
    })
  );

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

function debounce(func) {
  var timer;
  return function (event) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(func, 100, event);
  };
}
