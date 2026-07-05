# Circuit-Overdrive
*TLDR:* Circuit Overdrive is a tower defense game where players build custom PC towers from individual components to defend the Kernel Node from waves of malware while managing power, heat, and resources.

*Full version:*
Game Design Summary: Circuit Overdrive
Circuit Overdrive is a custom-building Tower Defense game set inside a computer circuit board. Players construct high-tech server pillars from individual hardware components to defend the central Kernel Node from waves of malware, worms, and Trojans.

🎮 Core Game Mechanics
1. The Building Sequence
Instead of placing pre-built towers, players construct defenses block-by-block directly on the grid (excluding path tiles):

Socket (20QB): Flat PCB contact pad. Must be placed first.
Case: Establishes the tower's base HP, airflow cooling, and motherboard size limits.
ITX Mini Case (40QB): 100 HP. Fits Mini-ITX motherboard.
ATX Server Case (80QB): 250 HP. Fits ATX motherboard.
Motherboard: Houses slot connections for components and defines targeting range.
Mini-ITX Board (45QB): 2.75 Tiles range. Slots: 1 CPU, 2 RAM, 1 GPU, 1 PSU, 1 Cooler.
ATX Board (100QB): 3.75 Tiles range. Slots: 1 CPU, 4 RAM, 3 GPU, 2 PSUs, 2 Coolers. Allows ATX towers to double up on power supplies for complex extreme setups.
Hardware Components:
CPU (I5) (30QB): Core i5 Processor. Fires lasers at malware. Adds 40 Damage per unit.
CPU (I9) (65QB): Core i9 Extreme. Beast processor. Adds 100 Damage, draws 40W power, and outputs 14 heat per attack. Displays with magenta core glows.
RAM (25QB): Memory speed. Increases clock frequency, reducing shot cooldown by 35% per stick.
GPU (50QB): Crypto Miner. Mines 1 QB/sec in 1-second ticks, plus a 10 QB bonus on any malware defeated inside its range (1.5 Tiles). Disabled during Wave 0 to prevent start-game idle farming.
PSU (40QB): Power Supply. Provides 110W wattage ceiling and reduces total heat generation by 35%.
Cooler (35QB): Liquid AIO. Active liquid loops that dissipate 40 units of heat per second to prevent overheating.
⚡ System Constraints & Rules
🔋 Wattage Caps & Overload State
Every active component draws wattage (CPU i5: 20W, CPU i9: 40W, RAM: 5W, GPU: 35W, Cooler: 10W).
Motherboards have a default regulator capacity of 40W.
Overloaded State: If total component wattage exceeds supply (e.g., placing a GPU and a CPU i9 on a motherboard with no PSU), the tower transitions to the OVERLOADED state.
Shutdown: Overloaded towers shut down instantly: they draw wattage but cannot shoot lasers or mine currency.
Resolution: Installing a PSU (supplying 110W) resolves the overload, immediately returning the tower to ACTIVE status.
Double PSU: Full ATX motherboards now have 2 PSU slots, allowing a combined wattage limit of 220W for heavy computing cores.
🔥 Thermal Overload & Recovery
Heat starts building up only when active chips (CPUs/GPUs) are installed.
CPU shots cause immediate heat spikes; GPUs run warm constantly.
If a tower reaches 100°C, it thermal-throttles (shuts down) and takes damage over time.
Throttling Recovery: Throttled towers immediately run full cooling cycles. Once heat falls below 75°C, they automatically boot back to active status (or overloaded status if they lack power) and resume firing.
If HP hits 0, the tower becomes Corrupted (shuts down, destroys one random component inside, and requires a 40QB Repair reboot).
🎯 Smart Path Targeting & Paths
Towers focus their lasers on the first enemy on the track (the one furthest along the path checkpoints, closest to the Kernel Node).
Both map paths end precisely at the center of the Kernel Node (15, 4), removing any extra path sections going past the central node.
🕹️ Controls & HUD Guide
BUY Mode (Green Indicator): Click hotbar slots at the bottom to purchase parts. Hovering or tapping a slot displays specs in the tooltip bar above the hotbar.
BUILD Mode (Purple Indicator):
Tap any cell on the grid (draws a purple selection box).
Tap highlighted hotbar items in sequence to install them instantly.
Status Indicators & Warning Symbols: Whenever a tower is in a non-active state (OVERLOADED, THROTTLED, CORRUPTED) and is not selected, a glowing floating badge appears directly above the tower top plate:
⚡ (Amber Lightning): Tower is Overloaded (power deficit).
🔥 (Orange Fire): Tower is Throttled (overheated).
✖ (Red Cross): Tower is Corrupted (broken/needs repair).
Note: Selecting the tower or fixing the problem immediately hides the badge.
Floating Contextual System Monitor: Enlarged by an additional 20% (width 350px). Positioned dynamically to float directly above or below the selected tower on the board.
Collapsible Accordion Header: When a motherboard is present, the hardware slots list is collapsed inside #hardware-list-container by default. Clicking the header toggles visibility (collapsing/expanding list entries).
Raised Vertical Offset (+85px): Pushed up to float 85px above the tower center, leaving a clean, clear gap so the unexpanded panel never covers the tower.
Auto-Flipping bounds: Checks real-time bounds (using dynamic offsetHeight and offsetWidth reads) and flips below the tower if it sits too close to the top edge.
Circular Stock Badges: Replaced textual quantities with glowing top-right circles on each hotbar button. Badges turn neon green when components are available.
Drifting Texts & Wave Notifications: Earned Qubits drift up visually from GPU towers (+QB green text) and defeated malware (+QB cyan text). Completed waves display a sliding top reward banner.
Rest Timer & Overclocking:
Before Wave 1: The game waits indefinitely for the player to click INITIALIZE PROTOCOL.
Between waves: A 120-second Rest Timer counts down. Clicking the wave button early triggers an Overclock bonus, rewarding +1 QB per remaining second immediately.
Layout Scaling Adjustments:
The bottom hotbar and toggles are scaled up by 40% to allow comfortable mobile landscape tapping.
The game motherboard grid map is scaled down by 20% and centered horizontally on the canvas to prevent overlap with the enlarged HUD.
