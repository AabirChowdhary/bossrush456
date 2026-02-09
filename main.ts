// BOSS RUSH — FINAL CLEAN VERSION (NO ERRORS, CLEAR PLAYER)

namespace SpriteKind {
    export const Boss = SpriteKind.create()
    export const Minion = SpriteKind.create()
    export const PowerUp = SpriteKind.create()
}

let player: Sprite = null
let boss: Sprite = null
let bossHP = 300
let bossPhase = 1
let bossInvincible = false
let tripleShot = false
let speedBoost = false
let shield = false

// BACKGROUND
scene.setBackgroundImage(img`
    8 8 8 8 8 8 8 8 8 8 8 8 8 8 8 8
    8 1 1 1 1 1 1 1 1 1 1 1 1 1 1 8
    8 1 1 1 1 1 1 1 1 1 1 1 1 1 1 8
    8 1 1 1 1 1 1 1 1 1 1 1 1 1 1 8
    8 1 1 1 1 1 1 1 1 1 1 1 1 1 1 8
    8 1 1 1 1 1 1 1 1 1 1 1 1 1 1 8
    8 1 1 1 1 1 1 1 1 1 1 1 1 1 1 8
    8 1 1 1 1 1 1 1 1 1 1 1 1 1 1 8
    8 1 1 1 1 1 1 1 1 1 1 1 1 1 1 8
    8 1 1 1 1 1 1 1 1 1 1 1 1 1 1 8
    8 1 1 1 1 1 1 1 1 1 1 1 1 1 1 8
    8 1 1 1 1 1 1 1 1 1 1 1 1 1 1 8
    8 1 1 1 1 1 1 1 1 1 1 1 1 1 1 8
    8 1 1 1 1 1 1 1 1 1 1 1 1 1 1 8
    8 1 1 1 1 1 1 1 1 1 1 1 1 1 1 8
    8 8 8 8 8 8 8 8 8 8 8 8 8 8 8 8
`)

// PLAYER — CLEAR HERO SPRITE
player = sprites.create(img`
    . . . 2 2 . . .
    . . 2 1 1 2 . .
    . 2 1 f f 1 2 .
    . 2 1 f f 1 2 .
    . 2 1 1 1 1 2 .
    . . 2 1 1 2 . .
    . . 2 1 1 2 . .
    . . . 2 2 . . .
`, SpriteKind.Player)
controller.moveSprite(player, 100, 100)
player.setStayInScreen(true)
player.setPosition(80, 100)
info.setLife(5)

// BOSS
boss = sprites.create(img`
    . . . . . . . . 
    . . 5 5 5 5 . . 
    . 5 5 5 5 5 5 . 
    5 5 5 5 5 5 5 5 
    5 5 5 5 5 5 5 5 
    . 5 5 5 5 5 5 . 
    . . 5 5 5 5 . . 
    . . . . . . . .
`, SpriteKind.Boss)
boss.setPosition(80, 30)
boss.setVelocity(20, 0)
boss.setBounceOnWall(true)

info.setScore(bossHP)

// SHOOTING
controller.A.onEvent(ControllerButtonEvent.Pressed, function () {
    if (tripleShot) {
        for (let angle = -15; angle <= 15; angle += 15) {
            let vx = Math.sin(angle * Math.PI / 180) * 80
            let vy = -100
            sprites.createProjectileFromSprite(img`
                . 2 . 
                2 2 2
                . 2 .
            `, player, vx, vy)
        }
    } else {
        sprites.createProjectileFromSprite(img`
            . 2 . 
            2 2 2
            . 2 .
        `, player, 0, -100)
    }
})

// PLAYER HITS BOSS
sprites.onOverlap(SpriteKind.Projectile, SpriteKind.Boss, function (proj, b) {
    proj.destroy()
    if (bossInvincible || bossHP <= 0) return

    bossInvincible = true
    boss.startEffect(effects.fountain, 100)

    bossHP -= 5
    info.setScore(bossHP)

    pause(800)
    bossInvincible = false

    if (bossHP <= 0) {
        boss.destroy(effects.disintegrate, 500)
        game.over(true, effects.confetti)
    }
})

// BOSS BULLET SPREAD
game.onUpdateInterval(700, function () {
    if (bossHP <= 0) return

    let spread = bossPhase == 1 ? 40 : bossPhase == 2 ? 60 : bossPhase == 3 ? 80 : 100
    let step = bossPhase >= 4 ? 8 : bossPhase == 3 ? 12 : 20

    for (let angle = -spread; angle <= spread; angle += step) {
        let vx = Math.sin(angle * Math.PI / 180) * (60 + bossPhase * 10)
        let vy = Math.cos(angle * Math.PI / 180) * (60 + bossPhase * 10)
        sprites.createProjectileFromSprite(img`
            . 1 . 
            1 1 1
            . 1 .
        `, boss, vx, vy)
    }
})

// MINIONS — FASTER + SMARTER
game.onUpdateInterval(2500, function () {
    if (bossHP <= 0) return

    let minion = sprites.create(img`
        . . . . 
        . 9 9 . 
        9 9 9 9
        . 9 9 .
    `, SpriteKind.Minion)

    minion.setPosition(randint(10, 150), 0)
    minion.follow(player, 60 + bossPhase * 20)
})

// MINION SHOOTING — ACCURATE
game.onUpdateInterval(1200, function () {
    sprites.allOfKind(SpriteKind.Minion).forEach(function (m) {
        let dx = player.x - m.x
        let dy = player.y - m.y
        let d = Math.sqrt(dx * dx + dy * dy)
        if (d == 0) return
        let vx = (dx / d) * 70
        let vy = (dy / d) * 70

        sprites.createProjectileFromSprite(img`
            . 9 .
            9 9 9
            . 9 .
        `, m, vx, vy)
    })
})

// POWER-UPS
game.onUpdateInterval(6000, function () {
    if (bossHP <= 0) return

    let p = sprites.create(img`
        . . . . 
        . 7 7 . 
        7 7 7 7
        . 7 7 .
    `, SpriteKind.PowerUp)
    p.setPosition(randint(10, 150), randint(20, 100))
})

// POWER-UP EFFECTS
sprites.onOverlap(SpriteKind.Player, SpriteKind.PowerUp, function (pl, p) {
    p.destroy()
    let choice = randint(0, 2)

    if (choice == 0) {
        tripleShot = true
        pause(6000)
        tripleShot = false
    } else if (choice == 1) {
        speedBoost = true
        controller.moveSprite(player, 150, 150)
        pause(6000)
        speedBoost = false
        controller.moveSprite(player, 100, 100)
    } else {
        shield = true
    }
})

// PHASE CHANGES (INCLUDING POWER SPIKE)
game.onUpdate(function () {
    if (bossHP < 200 && bossPhase == 1) {
        bossPhase = 2
        boss.setVelocity(35, 0)
        boss.startEffect(effects.blizzard, 300)
    }
    if (bossHP < 100 && bossPhase == 2) {
        bossPhase = 3
        boss.setVelocity(50, 0)
        boss.startEffect(effects.fire, 300)
    }
    if (bossHP < 150 && bossPhase == 3) {
        bossPhase = 4
        boss.setVelocity(70, 0)
        boss.startEffect(effects.halo, 300)
    }
})

// MINION DAMAGE
sprites.onOverlap(SpriteKind.Minion, SpriteKind.Player, function (minion, pl) {
    minion.destroy()
    if (shield) shield = false
    else info.changeLifeBy(-1)
})

// ENEMY BULLETS DAMAGE
sprites.onOverlap(SpriteKind.Projectile, SpriteKind.Player, function (proj, pl) {
    if (proj.vy > 0) {
        proj.destroy()
        if (shield) shield = false
        else info.changeLifeBy(-1)
    }
})

info.onLifeZero(function () {
    game.over(false, effects.melt)
})
