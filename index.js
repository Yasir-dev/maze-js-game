const {
    Engine,
    Render,
    Runner,
    World,
    Bodies,
    Body,
    Events,
} = Matter;

const engine = Engine.create();
// disable the gravity
engine.world.gravity.y = 0;
const { world } = engine;

const render = Render.create({
    element: document.body,
    engine,
    options: {
        wireframes: false,
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT
    }
});

Render.run(render);
Runner.run(Runner.create(), engine);

// draw the the walls
const walls = [
    // (x, y, width, height)
    Bodies.rectangle(CANVAS_WIDTH / 2, 0, CANVAS_WIDTH, 2, {isStatic: true}), //top
    Bodies.rectangle(CANVAS_WIDTH / 2, CANVAS_HEIGHT, CANVAS_WIDTH, 2, {isStatic: true}), //bottom
    Bodies.rectangle(0, CANVAS_HEIGHT / 2, 2, CANVAS_HEIGHT, {isStatic: true}), //left
    Bodies.rectangle(CANVAS_WIDTH, CANVAS_HEIGHT / 2, 2, CANVAS_HEIGHT, {isStatic: true}), //right
];
// add to the world
World.add(world, walls);

// generate grid array
const grid = Array(VERTICAL_CELLS)
    .fill(null)
    .map(() => Array(HORIZONTAL_CELLS).fill(false));

// generate verticals array (to draw vertical maze lines)
const verticals = Array(VERTICAL_CELLS)
    .fill(null)
    .map(() => Array(HORIZONTAL_CELLS - 1).fill(false));

// generate horizontals array (to draw horizontal maze lines)
const horizontals = Array(HORIZONTAL_CELLS - 1)
    .fill(null)
    .map(() => Array(VERTICAL_CELLS).fill(false));

/**
 * Move through the grid cell by cell and set when horizontals and vertical lines should be drawn
 *
 * @param {Number} row
 * @param {Number} column
 */
const moveThroughGrid = (row, column) => {
    //is cell already visited at [row, column]
    if (grid[row][column]) {
        return;
    }
    //mark this cell as visited
    grid[row][column] = true;

    //generate random order neighbours
    const neighbours = shuffleArray([
        [row - 1, column, 'up'], //top - neighbour
        [row + 1, column, 'down'], //bottom - neighbour
        [row, column - 1, 'left'], //left - neighbour
        [row, column + 1, 'right'], //right - neighbour
    ]);

    //for each neighbour
    for (let neighbour of neighbours) {
        const [nextRow, nextColumn, direction] = neighbour;
        //check if neighbour is out of bounds
        if (nextRow < 0 || nextRow >= VERTICAL_CELLS || nextColumn < 0 || nextColumn >= HORIZONTAL_CELLS) {
            continue;
        }
        //if neighbour is visited, move to next neighbour
        if (grid[nextRow][nextColumn]) {
            continue;
        }
        //remove a wall (horizontals or verticals)
        if ('left' === direction) {
            verticals[row][column - 1] = true;
        }

        if ('right' === direction) {
            verticals[row][column] = true;
        }

        if ('up' === direction) {
            horizontals[row - 1][column] = true;
        }

        if ('down' === direction) {
            horizontals[row][column] = true;
        }

        //visit the next cell
        moveThroughGrid(nextRow, nextColumn);
    }
};

// randomly select a start row and column
const startRow = Math.floor(Math.random() * VERTICAL_CELLS);
const startColumn = Math.floor(Math.random() * HORIZONTAL_CELLS);
// move through the grid
moveThroughGrid(startRow, startColumn);

//draw horizontals walls
horizontals.forEach((row, rowIndex) => {
    row.forEach((column, columnIndex) => {
        if (column) {
            return;
        }

        const wall = Bodies.rectangle(
            columnIndex * UNIT_LENGTH_X_AXIS + UNIT_LENGTH_X_AXIS / 2, // x-axis
            rowIndex * UNIT_LENGTH_Y_AXIS + UNIT_LENGTH_Y_AXIS, // y-axis
            UNIT_LENGTH_X_AXIS, // width
            4, // height
            {
                label: 'walls',
                isStatic: true,
                render: {
                  fillStyle: 'blue',
                },
            }
        );

        World.add(world, wall);
    });
});

// draw verticals walls
verticals.forEach((row, rowIndex) => {
    row.forEach((column, columnIndex) => {
        if (column) {
            return;
        }

        const wall = Bodies.rectangle(
            columnIndex  * UNIT_LENGTH_X_AXIS + UNIT_LENGTH_X_AXIS, // x-axis
            rowIndex * UNIT_LENGTH_Y_AXIS + UNIT_LENGTH_Y_AXIS / 2, // y-axis
            4,// width
            UNIT_LENGTH_Y_AXIS, // height
            {
                label: 'walls',
                isStatic: true,
                render: {
                    fillStyle: 'blue',
                },
            }
        );

        World.add(world, wall);
    });
});

// draw the goal
const goal = Bodies.rectangle(
    CANVAS_WIDTH - UNIT_LENGTH_X_AXIS / 2,
    CANVAS_HEIGHT - UNIT_LENGTH_Y_AXIS / 2,
    UNIT_LENGTH_X_AXIS * 0.50,
    UNIT_LENGTH_Y_AXIS * 0.50,
    {
        label: 'goal',
        isStatic: true,
        render: {
            fillStyle: 'red',
        },
    }
);
// add goal to the world
World.add(world, goal);
// draw the ball
const ballRadius = Math.min(UNIT_LENGTH_X_AXIS, UNIT_LENGTH_Y_AXIS) / 4   ;
const ball = Bodies.circle(
    UNIT_LENGTH_X_AXIS / 2,// x-axis
    UNIT_LENGTH_Y_AXIS / 2,// y-axis
    ballRadius,// radius,
    {
        label: 'ball',
        render: {
            fillStyle: 'yellow',
        },
    }
);
// add ball to the world
World.add(world, ball);

// add key press event listener
document.addEventListener('keydown', event => {
    const { x, y } = ball.velocity;
    switch (event.keyCode) {
        case KEY_CODE_W_KEY:// move up
            Body.setVelocity(ball, { x, y: y - 5});
            break;
        case KEY_CODE_Y_KEY: // move down
            Body.setVelocity(ball, { x, y: y + 5});
            break;
        case KEY_CODE_D_KEY: // move right
            Body.setVelocity(ball, { x: x + 5, y});
            break;
        case KEY_CODE_A_KEY: // move left
            Body.setVelocity(ball, { x: x - 5, y});
            break;
        default:
            console.log('unknown key');
    }
});

// detect the win
Events.on(engine, 'collisionStart', event => {
   event.pairs.forEach(collision => {
        const labels = ['ball', 'goal'];
        if (labels.includes(collision.bodyA.label) && labels.includes(collision.bodyB.label)) {
            // add some animation for win - add the gravity :-)
            addGravity();
            showWinMessage();
        }
   });
});

/**
 * Add gravity
 */
const addGravity = () => {
    world.gravity.y = 1;
    world.bodies.forEach(body => {
        if (body.label === 'walls') {
            Body.setStatic(body, false);
        }
    });
};

/**
 * Show win message
 */
const showWinMessage = () => {
    document.querySelector('.win-message').classList.remove('hidden');
};