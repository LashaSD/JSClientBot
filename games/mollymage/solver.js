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

const { WALL, TREASURE_BOX } = require('./elements.js');


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


        // TODO your code here
        
        let getLengthBetweenPoints = (x1, y1, x2, y2) => {
            let d = (x2 - x1)*(x2 - x1) + (y2 - y1)*(y2 - y1)
            return Math.sqrt(d)
        }
    
        let getPotionValid = (x, y) => {
            let a = false
            for (let i = x - 3; i <= x + 3; x++) {
                if (board.getAt(i, y) !== Element["WALL"]) {
                    a = true 
                } else a = false
            }
            for (let i = y - 3; i <= y; i++)
            {
                if (board.getAt(x, y) !== Element["WALL"])
                    return true
            }
        }


        const Hero = board.getHero()
        let Action1 = ''
        let Action2 = ''

        console.log(board.getAt(Hero.x, Hero.y))

        const TreasureBoxes = board.getTreasureBoxes()
        const enemyHeroes = board.getEnemyHeroes()
        const otherHeroes = board.getOtherHeroes()
        const ghosts = board.getGhosts()
        let target = null
        let ShortestDistance = null

        // Third Priority
        ShortestDistance = null
        for (let i = 0; i < ghosts.length; i++) {
            let PendingTarget = ghosts[i]
            let Distance = getLengthBetweenPoints(Hero.x, Hero.y, PendingTarget.x, PendingTarget.y)
            if (Distance > ShortestDistance) {
                ShortestDistance = Distance
                target = PendingTarget
            }
        }

        // Second Priority
        ShortestDistance = null
        for (let i = 0; i < otherHeroes.length; i++) {
            let PendingTarget = otherHeroes[i]
            let Distance = getLengthBetweenPoints(Hero.x, Hero.y, PendingTarget.x, PendingTarget.y)
            if (Distance > ShortestDistance) {
                ShortestDistance = Distance
                target = PendingTarget
            }
        }

        ShortestDistance = null
        // Top Priority Target
        for (let i = 0; i < enemyHeroes.length; i++) {
            let PendingTarget = enemyHeroes[i]
            let Distance = getLengthBetweenPoints(Hero.x, Hero.y, PendingTarget.x, PendingTarget.y)
            if (Distance > ShortestDistance) {
                ShortestDistance = Distance
                target = PendingTarget
            }
        }


        /// PATHFINDING
        let queue = []
        let visited = []
        

        const maxIters = 10000
        let Iters = 0
        function generatePath(Start, Goal) {
            // if (board.isBarrierAt(Goal.x, Goal.y))
            //         return []
            queue = []
            visited = []
            queue.push({'Node': {'x': Start.x, 'y': Start.y}, 'lastNode': null})
            while (queue.length > 0)
            {
                let NodeInfo = queue.shift()
                if (ValidNodeIter(NodeInfo.Node, NodeInfo.lastNode, Goal))
                    break
                console.log(visited.length)
                Iters += 1;
                if (Iters >= maxIters || board.isGameOver()) 
                    return []
            }
            let path = []
            let currentNode = Goal
            while (visited[currentNode] !== null)
            {
                if (currentNode !== null)
                    path.push(currentNode)
                currentNode = visited[currentNode] // last Pos
            }
            path.reverse()
            return path
        }


        let ValidNodeIter = function(CurrentNode, LastNode, GoalNode)
        {
            if (board.isBarrierAt(CurrentNode.x, CurrentNode.y))
                return false;
            if (visited.indexOf(CurrentNode) > 0)
                return false;
            visited[CurrentNode] = LastNode
            if (CurrentNode.x === GoalNode.x && CurrentNode.y === GoalNode.y)
                return true
            queue.push({"Node": {'x': CurrentNode.x, 'y': CurrentNode.y + 1 }, "lastNode": CurrentNode})
            queue.push({"Node": {'x': CurrentNode.x, 'y': CurrentNode.y - 1 }, "lastNode": CurrentNode})
            queue.push({"Node": {'x': CurrentNode.x + 1, 'y': CurrentNode.y }, "lastNode": CurrentNode})
            queue.push({"Node": {'x': CurrentNode.x - 1, 'y': CurrentNode.y }, "lastNode": CurrentNode})
            return false;
        }


        ///

        // console.log(`X: ${directionX}, Y: ${directionY}`)

        // switch(directionX) {
        //     case "Right":
        //         if (!board.isBarrierAt(Hero.x+1, Hero.y))
        //         {
        //             console.log("Here")
        //             Action2 = Actions["Right"]
        //         } else if (board.getAt(Hero.x+1, Hero.y) !== Element["WALL"]) {
        //             Action1 = Actions["Plant"]
        //         }
        //         break;
        //     case "Left":
        //         if (!board.isBarrierAt(Hero.x-1, Hero.y))
        //         {
        //             Action2 = Actions["Left"]
        //         } else if (board.getAt(Hero.x-1, Hero.y) !== Element["WALL"]) {
        //             Action1 = Actions["Plant"]
        //         }
        // }

        // if (!Action2) {
        //     switch(directionY) {
        //         case "Down":
        //             if (!board.isBarrierAt(Hero.x, Hero.y-1))
        //             {
        //                 Action2 = Actions["Down"]
        //             } else if (board.getAt(Hero.x, Hero.y-1) !== Element["WALL"]) {
        //                 Action1 = Actions["Plant"]
        //             }
        //             break;
        //         case "Up":
        //             if (!board.isBarrierAt(Hero.x, Hero.y+1))
        //             {
        //                 Action2 = Actions["Up"]
        //             } else if (board.getAt(Hero.x, Hero.y-1) !== Element["WALL"]) {
        //                 Action1 = Actions["Plant"]
        //             }
        //             break;
        //     }
        // }

        console.log(`X: ${Hero.x}, Y: ${Hero.y}`)
        target = {'x': 13, 'y': 5}
        console.log(generatePath(Hero, target))

        if (!Action1 && getPotionValid(Hero.x, Hero.y)) 
            Action1 = Actions["Plant"]

        
        let answer1 = !Action1 ? "" : Action1
        let answer2 = !Action2 ? "" : Action2
        return answer1.toString() + answer2.toString()
    }
};
