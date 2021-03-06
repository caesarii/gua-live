var log = console.log.bind(console)

    var imageFromPath = function(path) {
        var img = new Image()
        img.src = path
        // img.onload = function() {
        //     context.drawImage(img, x, y)
        // }
        return img
    }

    const rectIntersects = function(a, b) {
        if(b.y > a.y && b.y < a.y + b.image.height) {
            if(b.x > a.x && b.x < a.x + a.image.width) {
                return true
            }
        }
        return false
    }

    var Paddle = function() {
        var image = imageFromPath('paddle.png')
        var o = {
            image: image,
            x: 100,
            y: 250,
            speed: 15,
        }

        o.move = function(x) {
            if(x < 0) {
                x = 0
            }
            if(x > 400 - o.image.width) {
                x = 400 - o.image.width
            }
            o.x = x
        }

        o.moveLeft = function() {
            o.move(o.x - o.speed)
        }

        o.moveRight = function() {
            o.move(o.x + o.speed)
        }

        o.collide = function(ball) {
            const b = ball
            if(b.y + b.image.height > o.y) {
                if(b.x > o.x && b.x < o.x + o.image.width) {
                    return true
                }
            }
            return false
        }

        return o
    }

    var Block = function(position) {
        // position 是 [0, 0] 格式
        var p = position

        var image = imageFromPath('block.png')
        var o = {
            image: image,
            x: p[0],
            y: p[1],
            w: 50,
            h: 20,
            alive: true,
            lifes: p[2] || 1,
        }

        o.kill = function() {
            o.lifes --
            if(o.lifes < 1) {
                o.alive = false
            }
        }

        o.collide = function(b) {
            return o.alive && (rectIntersects(o, b) || rectIntersects(b, o))
        }

        return o
    }

    var Ball = function() {
        var image = imageFromPath('ball.png')
        var o = {
            image: image,
            x: 100,
            y: 200,
            speedX: 10,
            speedY: 10,
            fired: false,
        }
        o.fire = function() {
            o.fired = true
        }
        o.move = function() {
            if(o.fired) {
                if(o.x < 0 || o.x > 400) {
                    o.speedX = -o.speedX
                }
                if(o.y < 0 || o.y > 300) {
                    o.speedY = -o.speedY
                }
                o.x += o.speedX
                o.y += o.speedY
            }
        }
        o.bounce = function() {
            o.speedY *= -1
        }

        return o
    }

    // for(var i = 0; i < 3; i++) {
    //     var b = Block()
    //     b.x = i * 100 + 3
    //     b.y = 50
    //     blocks.push(b)
    // }

    var GuaGame = function() {
        var g = {
            actions: {},
            keydowns: {},
        }
        var canvas = document.querySelector('#id-canvas')
        var context = canvas.getContext('2d')
        g.canvas = canvas
        g.context = context

        g.drawImage = function(guaImage) {
            g.context.drawImage(guaImage.image, guaImage.x, guaImage.y)
        }

        // events
        window.addEventListener('keydown', function(event) {
            g.keydowns[event.key] = true
        })
    
        window.addEventListener('keyup', function(event) {
            g.keydowns[event.key] = false
        })
        g.registerAction = function(key, callback) {
            g.actions[key] = callback
        }
        
        // timer
        var runloop = function()  {
            // log('fps', fps)
            // events
            var actions = Object.keys(g.actions)
            for(var i = 0; i < actions.length; i++) {
                var key = actions[i]
                if(g.keydowns[key]) {
                    // 如果按键被按下调用注册的action
                    g.actions[key]()
                }
            }
            // update
            g.update()

            // clear
            context.clearRect(0, 0, canvas.width, canvas.height)

            // TODO clamp x

            // draw
            g.draw()
            setTimeout(function() {
                runloop()
            }, 1000/window.fps)
        }

        log('fps', fps)
        setTimeout(function() {
            runloop()
        }, 1000/window.fps)

        return g

    }

    var loadLevel = function(n) {
        var blocks = []
        n = n - 1
        var level = levels[n]
        for(var i = 0; i < level.length; i++) {
            var p = level[i]
            var b = Block(p)
            blocks.push(b)
        }
        return blocks
    }

    var blocks = []

    var enableDebugMode = function(enable) {
        if(!enable) {
            return
        }
        window.addEventListener('keydown', function(event) {
            var k = event.key
            if(k === 'p') {
                // 暂停
                paused = !paused
            } else if('1234567'.includes(k)) {
                blocks = loadLevel(Number(k))
            }
        })

        // 控制速度
        window.fps = 30
        document.querySelector('#id-input-speed').addEventListener('input', function(event) {
            var input = event.target
            window.fps = Number(input.value)
        })
    }

    var __main = function() {
        enableDebugMode(true)

        var game = GuaGame()
        var paddle = Paddle()
        var ball = Ball()
        var score = 0

        var paused = false
        game.registerAction('a', function() {
            paddle.moveLeft()
        })
        game.registerAction('d', function() {
            paddle.moveRight()
        })
        game.registerAction('f', function() {
            ball.fire()
        })
        blocks = loadLevel(1)

        game.update = function() {
            if(paused) {
                return
            }
            ball.move()
            // 板与球相撞
            if(paddle.collide(ball)) {
                ball.speedY *= -1
            }

            // 球与blocks 相撞
            for(var i = 0; i < blocks.length; i++) {
                var block = blocks[i]
                if(block.collide(ball)) {
                    block.kill()
                    ball.bounce()
                    // 更新分数
                    score += 100
                }
            }
        }

        game.draw = function() {
            // draw
            game.drawImage(paddle)
            game.drawImage(ball)
            for(var i = 0; i < blocks.length; i++) {
                var block = blocks[i]
                if(block.alive) {
                    game.drawImage(block)
                }
            }

            // draw labels
            game.context.fillText('分数： ' + score, 10, 290)
        }
    }

    __main()