/*-
 * #%L
 * Codenjoy - it's a dojo-like platform from developers to developers.
 * %%
 * Copyright (C) 2012 - 2022 Codenjoy
 * %%
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public
 * License along with this program.  If not, see
 * <http://www.gnu.org/licenses/gpl-3.0.html>.
 * #L%
 */

const stuff = require('./../../engine/stuff.js');
const elements = require('./elements.js');
const { WALL, TREASURE_BOX } = require('./elements.js');

let LastMovement = null

var MollymageSolver = module.exports = {

    get: function (board) {
        /**
         * @return next hero action
         */

        var Games = require('./../../engine/games.js');
        var Point = require('./../../engine/point.js');
        var Direction = Games.require('./direction.js');
        var Element = Games.require('./elements.js');
        var Stuff = require('./../../engine/stuff.js');

        let Actions = {
            "Left": Direction.LEFT,
            "Right": Direction.RIGHT,
            "Up": Direction.UP,
            "Down": Direction.DOWN,
            "Plant": Direction.ACT
        }

        console.clear()
        console.log("------------------------")

        // utils 
        let getLengthBetweenPoints = (x1, y1, x2, y2) => {
            let d = (x2 - x1)*(x2 - x1) + (y2 - y1)*(y2 - y1)
            return Math.sqrt(d)
        }

        let toPosValue = function(Direction) {
            let pos = {'x': 0, 'y':0}
            switch(Direction) {
                case "Right":
                    pos.x += 1
                    break;
                case "Left":
                    pos.x -= 1;
                    break;
                case "Up": 
                    pos.y += 1;
                    break;
                case "Down": 
                    pos.y -= 1;
                    break;
            }
            return pos
        }

        let inverseDirection = function(Direction) {
            switch(Direction) {
                case "Right":
                    return "Left"
                case "Left":
                    return "Right"
                case "Up": 
                    return "Down"
                    break;
                case "Down": 
                    return "Up"
            }
        }
        // getters
        const PendingPotions = board.getPotions()
        let inPotionBlastRadius = function(x, y)
        {
            let result = []
            let inDangerZone = false 
            let Potion = null
            result.push(inDangerZone)
            result.push(Potion)
            PendingPotions.forEach(potion => {
                if ((x === potion.x && y === potion.y) // same position as Hero
                || (x > potion.x - 3 && x < potion.x + 3 && y === potion.y) // in the range of the blast on x axis
                || (y > potion.y - 3 && y < potion.y + 3 && x === potion.x)) { // in the range of the blast on y axis
                    result[0] = true;
                    result[1] = potion
                } 
                if (x > potion.x - 3 && x < potion.x + 3 && y === potion.y) { 
                    console.log('DEBUG: DANGER X')
                } 
                if (y > potion.y - 3 && y < potion.y + 3 && x === potion.x) {
                    console.log('DEBUG: DANGER Y')
                } 
            })
            return result
        } 

        const BorderIndexes = [1,3,5,7]
        let checkCellSafety = (x, y) => {
            // ghost check
            const near = board.getNear(x, y)
            for (let i = 0; i < near.length; i++)
            {
                const cell = near[i]
                if (BorderIndexes.includes(i) && (cell === elements.GHOST || cell === elements.GHOST_DEAD))
                    return false
            }
            // potion blast radius check
            const res = inPotionBlastRadius(x, y)
            const InRadius = res[0]
            const Potion = res[1]
            if (InRadius)
                return false
            return true
        }

        let getPotionValid = function(x, y) {
            const whitelist  = [elements.ENEMY_HERO, elements.ENEMY_HERO_POTION, elements.TREASURE_BOX, elements.OTHER_HERO, elements.GHOST, elements.GHOST_DEAD]
            let blacklist = [elements.WALL, elements.TREASURE_BOX_OPENING]
            blacklist = blacklist.concat(board.getPotions()) 
            let valid = false
            // to the left
            for (let i = x-1; i > x - 4; i--)
            {
                if (board.getPerks().includes(board.getAt(i, y)))
                    return false
                if (whitelist.includes(board.getAt(i, y))) {
                    valid = true
                } else if (blacklist.includes(board.getAt(i, y))) break;
            }
            // to the right
            for (let i = x+1; i < x + 4; i++)
            {
                if (board.getPerks().includes(board.getAt(i, y)))
                    return false
                if (whitelist.includes(board.getAt(i, y))) {
                    valid = true
                } else if (blacklist.includes(board.getAt(i, y))) break;
            }
            // upwards
            for (let i = y+1; i < y + 4; i++)
            {
                if (board.getPerks().includes(board.getAt(x, i)))
                    return false
                if (whitelist.includes(board.getAt(x, i))) {
                    valid = true
                } else if (blacklist.includes(board.getAt(x, i))) break;
            }
            // downwards
            for (let i = y-1; i > y - 4; i--)
            {
                if (board.getPerks().includes(board.getAt(x, i)))
                    return false
                if (whitelist.includes(board.getAt(x, i))) {
                    valid = true
                } else if (blacklist.includes(board.getAt(x, i))) break;
            }
            return valid 
        }


        const Hero = board.getHero()
        let PotionAction = '' // Potion Action
        let MovementAction = '' // Movement Action

        /// TARGET EVALUATION

        const EnemyHeroes = board.getEnemyHeroes()
        const OtherHeroes = board.getOtherHeroes()
        const Perks = board.getPerks() 
        const TreasureBoxes = board.getTreasureBoxes()


        let Target = null
        let EvaluateTargets = function() {

        }


        /// PATHFINDING
        let availableDirections = []
        if (!board.isBarrierAt(Hero.x, Hero.y + 1) && checkCellSafety(Hero.x, Hero.y + 1, "UP")) // UP
            availableDirections.push("Up")
        if (!board.isBarrierAt(Hero.x, Hero.y - 1) && checkCellSafety(Hero.x, Hero.y - 1, "DOWN")) // DOWN
                availableDirections.push("Down")
        if (!board.isBarrierAt(Hero.x + 1, Hero.y) && checkCellSafety(Hero.x + 1, Hero.y, "RIGHT")) // RIGHT
                availableDirections.push("Right")
        if (!board.isBarrierAt(Hero.x - 1, Hero.y) && checkCellSafety(Hero.x - 1, Hero.y, "LEFT")) // LEFT
                availableDirections.push("Left")
        

        /// POTION EVASION 

        let res = inPotionBlastRadius(Hero.x, Hero.y)
        let inDangerZone = res[0]
        let Potion = res[1]
        const BarrierWhitelist = [elements.HERO, elements.HERO_POTION]
        const boardSize = board.size
        let checkTopBottom = function(x, y) {
            let UpBetter = boardSize - y > y // more free space in the top 

            if (UpBetter) {
                if (!board.isBarrierAt(x, y + 1) && checkCellSafety(x, y+1)) {
                    console.log("DEBUG: Path Clear UP: " + (y+1))
                    return "Up"
                }
                if (!board.isBarrierAt(x, y - 1) && checkCellSafety(x, y-1)) {
                    console.log("DEBUG: Path Clear DOWN: " + (y - 1))
                    return "Down"
                }
            } else {
                if (!board.isBarrierAt(x, y - 1) && checkCellSafety(x, y-1)) {
                    console.log("DEBUG: Path Clear DOWN: " + (y - 1))
                    return "Down"
                }
                if (!board.isBarrierAt(x, y + 1) && checkCellSafety(x, y+1)) {
                    console.log("DEBUG: Path Clear UP: " + (y+1))
                    return "Up"
                }
            }
            
            return false
        }

        let checkLeftRight = function(x, y) {
            let RightBetter = boardSize - x > x 

            if (RightBetter) {
                if (!board.isBarrierAt(x + 1, y) && checkCellSafety(x+1, y)) {
                    console.log("DEBUG: Path Clear RIGHT: " + (x+1))
                    return "Right"
                }
                if (!board.isBarrierAt(x - 1, y) && checkCellSafety(x-1, y)) {
                    console.log("DEBUG: Path Clear LEFT: " + (x+1))
                    return "Left"
                }
            } else {
                if (!board.isBarrierAt(x - 1, y) && checkCellSafety(x-1, y)) {
                    console.log("DEBUG: Path Clear LEFT: " + (x+1))
                    return "Left"
                }
                if (!board.isBarrierAt(x + 1, y) && checkCellSafety(x+1, y)) {
                    console.log("DEBUG: Path Clear RIGHT: " + (x+1))
                    return "Right"
                }
            }

            return false
        }

        let PotionEscapeDirection = null
        if (inDangerZone)
        {
            console.log("DEBUG: HERO - " + Hero.x + " " + Hero.y)
            console.log("DEBUG: POTION - " + Potion.x + " " + Potion.y)
            const iterDepth = 6
            // since the hero cant move inside a potion the side that the hero is on is being calculated and moved towards that direction if there is a passthrough
            // Horizontal Iteration
            let RelativeDirectionX = Hero.x - Potion.x > 0 ? 1 : -1 // 1 means to the right of the potion -1 to the left of the potion
            let IncrementCheckX = (i) => {
                if (board.isBarrierAt(i, Hero.y) && !BarrierWhitelist.includes(board.getAt(i, Hero.y)))
                    return true
                let result = checkTopBottom(i, Hero.y)
                if (result) {
                    if (Hero.x === i) {
                        PotionEscapeDirection = result
                        console.log("DEBUG: X " + "Got Result")
                    } else {
                        PotionEscapeDirection = RelativeDirectionX === 1 ? "Right" : "Left"
                        console.log("DEBUG: X " + "Keep Going")
                    }
                    return true
                }
                return false
            }

            // Vertical Iteration
            let RelativeDirectionY = Hero.y - Potion.y > 0 ? 1 : -1 // -1
            let IncrementCheck = function(i)
            {
                if (board.isBarrierAt(Hero.x, i) && !BarrierWhitelist.includes(board.getAt(Hero.x, i))) {
                    console.log(board.getAt(Hero.x, i))
                    return true
                }
                let result = checkLeftRight(Hero.x, i)
                if (result) {
                    if (i === Hero.y) {
                        PotionEscapeDirection = result
                        console.log("DEBUG: Y " + "Got Result")
                    } else {
                        PotionEscapeDirection = RelativeDirectionY === 1 ? "Up" : "Down"
                        console.log("DEBUG: Y " + "Keep Going")
                    }
                    return true
                }
                return false
            }


            if (board.getAt(Hero.x, Hero.y) === elements.HERO_POTION) {
                /// Left
                for (let i = Hero.x; i >= Hero.x - 3; i--)
                {
                    RelativeDirectionX = -1
                    const res = IncrementCheckX(i)
                    if (res) 
                        break;
                }
                /// Right
                for (let i = Hero.x; i <= Hero.x + 3; i++)
                {
                    RelativeDirectionX = 1
                    const res = IncrementCheckX(i)
                    if (res) 
                        break;
                }
                /// Up
                for (let i = Hero.y; i <= Potion.y + iterDepth; i++) {
                    RelativeDirectionY = 1
                    const res = IncrementCheck(i)
                    if (res) 
                        break;
                }
                /// Down
                for (let i = Hero.y; i >= Potion.y - iterDepth; i--) {
                    RelativeDirectionY = -1
                    const res = IncrementCheck(i)
                    if (res) 
                        break;
                }
            }
            if (Hero.y === Potion.y) 
            {
                if (RelativeDirectionX === 1)
                {
                    for (let i = Hero.x; i <= Potion.x + (iterDepth * RelativeDirectionX); i += RelativeDirectionX) {
                        const res = IncrementCheckX(i)
                        if (res) 
                            break;
                    }
                } else {
                    for (let i = Hero.x; i >= Potion.x + (iterDepth * RelativeDirectionX); i += RelativeDirectionX) {
                        const res = IncrementCheckX(i)
                        if (res) 
                            break;
                    }
                }
                
            } 
            if (Hero.x === Potion.x) {
                if (RelativeDirectionY === 1)
                {
                    for (let i = Hero.y; i <= Potion.y + (iterDepth * RelativeDirectionY); i += RelativeDirectionY) {
                        const res = IncrementCheck(i)
                        if (res) 
                            break;
                    }
                } else {
                    for (let i = Hero.y; i >= Potion.y + (iterDepth * RelativeDirectionY); i += RelativeDirectionY) {
                        const res = IncrementCheck(i)
                        if (res) 
                            break;
                    }
                }
            }
        }

        /// GHOST EVASION

        const nearHero = board.getNear(Hero.x, Hero.y)
        const gridDirections = {
            3: "Left",
            5: "Right",
            1: "Up",
            7: "Down"
        }
        let GhostEscapeDirection = null
        for (let i = 0; i < nearHero.length; i++)
        {
            const element = nearHero[i]
            const isBordered = BorderIndexes.includes(i)
            if (isBordered && (element === elements.GHOST || element === elements.GHOST_DEAD) )
            {
                console.log("DEBUG: ghost detected on the BORDER")
                console.log(nearHero)
                /// CHECK FOR SAFE AND FREE CELL AWAY FROM THE GHOST
                GhostEscapeDirection = gridDirections[i]
                let PossibleDirections = []
                // get all directions but the ghostdirection
                for(let key in gridDirections) {
                    let value = gridDirections[key]
                    if (value !== GhostEscapeDirection)
                        PossibleDirections.push(value)
                }
                for (let direction of PossibleDirections)
                {
                    let PosOffset = toPosValue(direction)
                    if (board.isBarrierAt(Hero.x + PosOffset.x, Hero.y + PosOffset.y))
                        continue
                    let safe = checkCellSafety(Hero.x + PosOffset.x, Hero.y + PosOffset.y)
                    if (safe) {
                        GhostEscapeDirection = direction
                        break;
                    }
                }

                break;
            } else if (element === elements.GHOST || element === elements.GHOST_DEAD) {
                console.log("DEBUG: ghost detected on the CORNER")
                let Dir1 = null
                let Dir2 = null
                switch (i){
                    case 2:
                        Dir1 = gridDirections[1]
                        Dir2 = gridDirections[5]
                        break;
                    case 8:
                        Dir1 = gridDirections[7]
                        Dir2 = gridDirections[5]
                        break;
                    case 0:
                        Dir1 = gridDirections[1]
                        Dir2 = gridDirections[3]
                        break;
                    case 6:
                        Dir1 = gridDirections[3]
                        Dir2 = gridDirections[7]
                        break;
                }
                let DirIndex = availableDirections.indexOf(Dir1)
                if (DirIndex !== -1)
                    availableDirections.splice(DirIndex, 1)
                DirIndex = availableDirections.indexOf(Dir2)
                if (DirIndex !== -1) 
                    availableDirections.splice(DirIndex, 1)

                for (let i = 0; i < availableDirections.length; i++)
                {
                    let dir = availableDirections[i]
                    let offset = toPosValue(dir)
                    const safe = checkCellSafety(Hero.x + offset.x, Hero.y + offset.y)
                    if (safe) {
                        GhostEscapeDirection = dir
                        break
                    }
                }
            }
        }

        /// SUICIDE PREVENTION HOTLINE (not going into the direction of the blast)

        const SAFETYNET = 4
        if (!PotionEscapeDirection && !inDangerZone)
        {
            for(let i = 0; i < availableDirections.length; i++)
            {
                let Danger = false
                let dir = availableDirections[i]
                let pos = {'x': Hero.x, 'y': Hero.y}
                switch(dir){
                    case "Right":
                        pos.x += 1
                        break;
                    case "Left":
                        pos.x -= 1;
                        break;
                    case "Up":
                        pos.y += 1;
                        break;
                    case "Down":
                        pos.y -= 1;
                        break;
                }
                for (let j = 0; j < PendingPotions.length; j++)
                {
                    const potion = PendingPotions[j]

                    if ((pos.x === potion.x && pos.y === potion.y) 
                    || (pos.x > potion.x - SAFETYNET && pos.x < potion.x + SAFETYNET && pos.y === potion.y) // in the range of the blast on x axis
                    || (pos.y > potion.y - SAFETYNET && pos.y < potion.y + SAFETYNET && pos.x === potion.x)) { // in the range of the blast on y axis
                        Danger = true
                    } 
                }
                if (Danger)
                    availableDirections.splice(i, 1)
            }
        }

        /// DIRECTION LOGIC
        let MainDirection = null
        if (GhostEscapeDirection) 
        {
            MainDirection = GhostEscapeDirection
            console.log("GHOST EVASION: " + MainDirection + '\n')
        } else if (PotionEscapeDirection) {
            MainDirection = PotionEscapeDirection
            console.log("POTION EVASION: " + MainDirection + '\n')
        } else {
            availableDirections.splice(availableDirections.indexOf(LastMovement), 1)
            let PathDirection = availableDirections[Math.floor(Math.random() * availableDirections.length)]
            MainDirection = PathDirection
            console.log("PATHFINDING DIRECTION: " + MainDirection + '\n')
        }

        MovementAction = Actions[MainDirection]
        LastMovement = MainDirection

        if (!PotionAction && getPotionValid(Hero.x, Hero.y)) 
        {
            PotionAction = Actions["Plant"]
        }


        /// SUICIDE PREVENTION HOTLINE BACKUP (bot not trap itself and die from self inflicted potions)

        if (PotionAction)
        {
            let PossibleDirections = []
            let Blacklist = []
            let PosOffset = MainDirection ? toPosValue(MainDirection) : {'x': 0, 'y': 0}
            const Pos = {'x': Hero.x + PosOffset.x, 'y': Hero.y + PosOffset.y}
            
            if (MainDirection)
                Blacklist.push(inverseDirection(MainDirection))

            console.log("DEBUG: BLACKLIST " + Blacklist)

            let incrementX = (x, y, Direction) => {
                if (Blacklist.includes(Direction))
                    return true;

                if (board.isBarrierAt(x, y) && !BarrierWhitelist.includes(board.getAt(x, y))) {
                    console.log(board.getAt(x, y))
                    return true;
                }
                let result = checkTopBottom(x, y)
                if (result) {
                    PossibleDirections.push(Direction)
                    return true
                }
            }

            let incrementY = (x, y, Direction) => {
                if (Blacklist.includes(Direction))
                    return true;

                if (board.isBarrierAt(x, y) && !BarrierWhitelist.includes(board.getAt(x, y))) {
                    console.log(board.getAt(x, y))
                    return true;
                }
                let result = checkLeftRight(x, y)
                if (result) {
                    PossibleDirections.push(Direction)
                    return true
                }
            }

            // RIGHT
            for (let i = Pos.x+1; i < Pos.x + 4; i++)
            {
                if (incrementX(i, Pos.y, "Right"))
                    break;
            }

            // LEFT
            for (let i = Pos.x-1; i > Pos.x - 4; i--)
            {
                if (incrementX(i, Pos.y, "Left"))
                    break;
            }
            // UP
            for (let i = Pos.y+1; i < Pos.y + 4; i++)
            {
                if (incrementY(Pos.x, i, "Up"))
                    break;
            }
            // DOWN
            for (let i = Pos.y-1; i > Pos.y - 4; i--)
            {
                if (incrementY(Pos.x, i, "Down"))
                    break;
            }

            if (PossibleDirections.length === 0) {
                console.log("DEBUG: ACTION CANCELLED")
                PotionAction = null
                if (!PossibleDirections.length) {
                    console.log("ERROR412") // view death in video Debug05 
                    // MovementAction = null // idunno anymore
                }
            } else {
                // if (!PossibleDirections.includes(MainDirection)) {
                //     let PathDirection = PossibleDirections[Math.floor(Math.random() * PossibleDirections.length)]
                //     MainDirection = PathDirection
                //     MovementAction = Actions[MainDirection]
                //     console.log("SUICIDE HOTLINE GUIDED DIRECTION: " + MainDirection + '\n')
                // }

                // console.log(PossibleDirections)
                // MainDirection = PossibleDirections[Math.floor(Math.random() * PossibleDirections.length)]
                // MovementAction = Actions[MainDirection]
                if (!MainDirection) {

                }
                console.log("DEBUG: POS " + Pos.x + " " + Pos.y)
                console.log("SUICIDE HOTLINE DIRECTION: " + MainDirection)
            }

        }


        let answer1 = !PotionAction ? "" : PotionAction
        let answer2 = !MovementAction ? "" : MovementAction
        console.log("GOING TO: " + answer1.toString() + answer2.toString())
        return answer1.toString() + answer2.toString()
    }
};
