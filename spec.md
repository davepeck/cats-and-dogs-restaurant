# Catstaurant - Game Specificati### Food Stations (Left Side of Screen)

Arranged vertically from top to bottom:

1. **Salmon Station** (top) - Stack of 3 salmon plates
2. **Shrimp Station** - Stack of 3 shrimp plates
3. **Mango Cake Station** - Stack of 3 mango cake plates
4. **Milk Station** (bottom) - Stack of 3 milk mugs

**Visual Representation**: Each station displays a pile of 3 identical food items (plates/mugs) to indicate available food and create visual abundance.

**Station Layout**: Equally spaced vertically on the left side of screen, with topmost station aligned with top edge of table graphic for convenience.

**Capacity**: Unlimited food available at all stations.rview

**Catstaurant** is a cat restaurant management game where you play as a girl server who must efficiently serve food to cat customers before their patience runs out.

## Core Gameplay

### Player Character

- **Girl Server**: Controlled with arrow keys (up, down, left, right)
- **Movement**: Can move freely around the restaurant
- **Carrying Capacity**: Can carry multiple plates of the same food type, but cannot mix different food types
- **Actions**:
  - Space bar to pick up plates (when near food stations)
  - Space bar to drop plates (when near tables/cats)

### Cat Customers

- **Behavior**: Cats enter from the right side of the restaurant, animate walking to assigned table seats, and place orders
- **Orders**: Single item orders indicated by speech bubbles above their heads showing food icons
- **Patience**: Each cat has a countdown timer (white progress bar above cat, width of speech bubble)
- **Timer Mechanics**:
  - Initial duration: 12 seconds per cat
  - Difficulty scaling: Reduce by 1 second for every 3 cats successfully served
  - Minimum duration: 5 seconds per cat
  - Visual: White rectangle that shrinks from full to empty as time runs out
- **Success**: If served in time, cat eats and animates walking out to the right side
- **Failure**: If timer reaches zero (bar completely disappears), game ends

### Food Types

1. **Shrimp Sushi**
2. **Salmon Sushi**
3. **Mango Cake**
4. **Milk**

### Food Stations (Left Side of Screen)

Arranged vertically from top to bottom:

1. **Salmon Station** (top) - Stack of 3 salmon plates
2. **Shrimp Station** - Stack of 3 shrimp plates
3. **Mango Cake Station** - Stack of 3 mango cake plates
4. **Milk Station** (bottom) - Stack of 3 milk mugs

**Visual Representation**: Each station displays a pile of 3 identical food items (plates/mugs) to indicate available food and create visual abundance.

### Serving Mechanics

- Girl walks to appropriate food station and picks up plates
- Can carry multiple plates of the same type
- Must walk to cat's table and drop plate within serving range
- **Serving Range**: Each cat owns a zone extending 33% of their sprite width to the left and right
- **Cat Spacing**: No two cats can sit closer than their respective serving zones
- **Visual Feedback**: When girl is in serving range while carrying food, display visual indication (glow behind cat or on table) showing which cat will receive the plate
- **Grid System**: Invisible grid system for plate placement - plates snap to valid positions
- **Cat Seating**: Multiple cats can sit at table simultaneously, as many as fit while following spacing rules

## Game Progression

### Difficulty Scaling

- **Early Game**:
  - Single cat customers
  - Simple one-item orders
  - 12-second countdown timers (patient cats)
- **Progression**:
  - More cats appear simultaneously as game continues
  - Timer duration decreases by 1 second for every 3 cats successfully served
  - Minimum timer duration: 5 seconds per cat
- **Late Game**:
  - Multiple cats simultaneously
  - 5-second countdown timers (impatient cats)
  - More complex serving scenarios

### Win/Lose Conditions

- **Game Over**: Any cat's timer reaches zero before being served
- **Scoring**: Successfully served cats (details TBD)

## Technical Implementation

### Current Assets

- Background (1024x1024)
- Girl character sprites (forward, left, right)
- Cat sprites (cat1, cat3, plus cat2, cat4, cat5 available)
- Table sprites (horizontally tileable)
- Food icons (shrimp-icon, salmon-icon, mango-cake-icon, milk-icon)
- Food plates (shrimp-plate, salmon-plate, mango-cake-plate, milk-mug)
- Speech bubble sprite

### Current Implementation Status

- ✅ Basic canvas setup (1024x1024)
- ✅ Girl character movement (left/right arrow keys)
- ✅ Background and table rendering
- ✅ Cat customers positioned behind tables
- ✅ Speech bubble with mango cake order
- ✅ Sprite scaling and transparent backgrounds

## Questions for Clarification

### Game Mechanics

1. ~~**Food Station Interaction**: How should the food stations be visually represented? Should they be separate counters/machines on the left side?~~
   **✅ RESOLVED**: Food stations will show stacks of 3 plates/mugs for each food type (salmon plates, shrimp plates, mango cake plates, milk mugs)

2. ~~**Plate Carrying Visual**: How should we show the girl carrying plates? Stack them in her hands? Show a number indicator?~~
   **✅ RESOLVED**: Girl will visually carry a stack of plates in her hands while moving around

3. ~~**Serving Range**: What's the exact serving range? Should we highlight valid drop zones when the girl is carrying food?~~
   **✅ RESOLVED**: Each cat has a serving area extending 33% of the cat's width to the left and right. When girl is in range while carrying food, show visual indication (glow behind cat or on table) to indicate which cat will be served.

4. ~~**Grid System**: Do you want a visible grid for plate placement, or should it be invisible but still snap to positions?~~
   **✅ RESOLVED**: Grid system for plate placement will be invisible but plates will snap to valid positions.

5. ~~**Multiple Cats**: How many cats can sit at the table simultaneously? Should they have assigned seats?~~  
   **✅ RESOLVED**: As many as fit while still following grid system rules (no two cats can sit closer than their respective serving zones).

### Timer System

6. ~~**Timer Visual**: Should the countdown timer be a progress bar above each cat? What color scheme?~~  
   **✅ RESOLVED**: The countdown timer is a white rectangle (progress bar) above each cat, about as wide as the speech bubble. It starts full and shrinks (from full to empty) as time runs out. When the bar completely disappears, you lose.

7. ~~**Timer Duration**: What should be the initial timer duration? How much should it decrease as difficulty increases?~~
   **✅ RESOLVED**: Initial timer duration should be 12 seconds per cat. As difficulty increases, reduce the timer by 1 second for every 3 cats successfully served, to a minimum of 5 seconds per cat.

### Cat Behavior

8. ~~**Cat Entry**: How do cats enter the scene? Do they walk in from the sides or just appear?~~  
   **✅ RESOLVED**: Cats will animate walking in from the right side of the restaurant to their assigned seats. Even though only a forward-facing sprite is available, the cat will slide/move from off-screen right to its seat position.

9. ~~**Cat Departure**: How do cats leave after being served? Animation or instant?~~  
   **✅ RESOLVED**: Cats will animate walking out to the right side of the restaurant after being served, mirroring their entry animation (slide/move from seat to off-screen right).

10. ~~**Order Complexity**: Will cats ever order multiple items, or always just one at a time?~~  
    **✅ RESOLVED**: For now, cats will order one item at a time.

### Food Stations

11. ~~**Station Capacity**: Do food stations have unlimited food, or should there be a restocking mechanic?~~  
    **✅ RESOLVED**: For now, food stations have unlimited food.

12. ~~**Station Positioning**: Should the four food stations be equally spaced on the left side? Any specific vertical positioning?~~  
    **✅ RESOLVED**: Food stations should be equally spaced vertically on the left side of the screen. The topmost station's top edge should be no higher than the top edge of the table graphic, for convenience.

### UI/Scoring

13. **Score Display**: Should we show current score, cats served, time played, etc.?

14. **Game States**: Do you want a start screen, game over screen, or just jump straight into gameplay?

15. **Difficulty Progression**: Should difficulty increase over time, by score, or by number of cats served?
