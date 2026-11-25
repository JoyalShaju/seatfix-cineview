# CineView 3D — Coordinate System, Camera & Viewing-Angle Mathematics

## 1. Three-Dimensional Coordinate System

CineView 3D uses a **right-handed, Y-up Cartesian coordinate system** where **1.0 unit = 1.0 meter (m)**, matching Three.js and WebGL world space directly so zero unit-conversion errors occur between calculations and rendering.

```text
          +Y (Up / Elevation, meters)
           |
           |      -Z (Toward Screen)
           |     /
           |    /
   -X -----+----- +X (Audience Right / Stage Left)
   (Left) /|
         / |
       +Z  (Toward Rear / Audience Back)
```

### Origin & Reference Planes
- **$X = 0.0\text{ m}$**: Horizontal centerline of the auditorium (plane of lateral symmetry).
  - Negative $X$: Audience Left (screen left).
  - Positive $X$: Audience Right (screen right).
- **$Y = 0.0\text{ m}$**: Auditorium datum floor elevation at the front pit immediately in front of the screen wall.
  - Positive $Y$: Upward elevation (stepped seating risers, balcony decks, screen elevation, eye height).
- **$Z = 0.0\text{ m}$**: Inner face of the front screen wall.
  - Screen surface sits slightly forward into the auditorium at $Z = \text{screen.center.z} > 0$ (e.g., $Z = 0.35\text{ m}$).
  - All seating rows reside at $Z > \text{screen.center.z}$ (e.g., Row A at $Z = 4.20\text{ m}$ through Row J at $Z = 14.85\text{ m}$).

### Orientation Convention (`yaw` in radians)
- A seat with `yaw = 0` faces straight toward the front wall along **`-Z`**: $(0, 0, -1)$.
- Positive `yaw` rotates **counter-clockwise around `+Y`** (looking inward from the right wing toward the screen center at $X = 0$):
  $$\vec{f}_{\text{seat}}(\text{yaw}) = \big(-\sin(\text{yaw}),\; 0,\; -\cos(\text{yaw})\big)$$
- Check:
  - Seat on the right wing ($x_s > 0$): `yaw > 0` $\implies f_x = -\sin(\text{yaw}) < 0$ (points left toward $X=0$).
  - Seat on the left wing ($x_s < 0$): `yaw < 0` $\implies f_x = -\sin(\text{yaw}) > 0$ (points right toward $X=0$).
- This matches Three.js `Object3D.rotation.y = yaw` for both seat meshes (built facing local `-Z`) and `THREE.PerspectiveCamera` (which natively looks down local `-Z`).

---

## 2. Seat-Camera Positioning Algorithm

Each seat $S$ stores its physical floor anchor $\mathbf{P}_{\text{floor}} = (x_s,\; y_{\text{floor}},\; z_s)$, orientation $\psi = \text{seat.yawRad}$, and category eye offsets $(\Delta y_{\text{cat}},\; \Delta z_{\text{back}})$.

Given the user's configured seated eye height above the seat floor riser $h_{\text{eye}}$ (default `1.15 m`, adjustable in `[0.95, 1.35] m`):

1. **Backrest Eye Offset**: A seated viewer's eyes sit slightly behind the seat's geometric floor center (toward local `+Z`, i.e., $\Delta z_{\text{back}} \approx +0.06\text{ m}$ for standard cinema seats, $+0.14\text{ m}$ for reclined seats). Rotating local offset $(0,\; 0,\; \Delta z_{\text{back}})$ around $+Y$ by $\psi$:
   $$\Delta x_w = \Delta z_{\text{back}} \cdot \sin(\psi)$$
   $$\Delta z_w = \Delta z_{\text{back}} \cdot \cos(\psi)$$
2. **World Eye Position $\mathbf{E}$**:
   $$\mathbf{E} = \Big(x_s + \Delta x_w,\;\; y_{\text{floor}} + h_{\text{eye}} + \Delta y_{\text{cat}},\;\; z_s + \Delta z_w\Big)$$
3. **Natural Forward Look vs. Look-at-Screen-Center**:
   - **Natural Forward Pose**: Camera yaw matches $\psi$ with a slight resting pitch (e.g. `0°` horizontal or gentle ergonomic pitch), showing exactly where the seat physically points.
   - **Look-at-Screen-Center Pose**: Camera orientation aims directly along vector $\mathbf{C} - \mathbf{E}$ toward screen center $\mathbf{C}$:
     $$\text{yaw}_{\text{screen}} = \operatorname{atan2}(-(C_x - E_x),\; -(C_z - E_z))$$
     $$\text{pitch}_{\text{screen}} = \operatorname{atan2}(C_y - E_y,\; \sqrt{(C_x - E_x)^2 + (C_z - E_z)^2})$$
4. **360° Head Look & Collision Safety**:
   - Mouse/touch look offsets $(\Delta\text{yaw}, \Delta\text{pitch})$ allow full $360^\circ$ horizontal turn-around (so front-row viewers can look behind at the stepped auditorium rows and projection booth) while clamping vertical pitch to $[-65^\circ,\; +65^\circ]$ to prevent upside-down camera inversion.
   - Camera position remains anchored at $\mathbf{E}$ inside auditorium interior bounds $[ -W_{\text{aud}}/2 + 0.4,\; +W_{\text{aud}}/2 - 0.4 ]$, preventing clipping through walls or floors. In first-person view, the viewer's own seat backrest is hidden locally so looking $180^\circ$ behind remains unobstructed.
5. **Reduced-Motion Support**:
   - When `prefers-reduced-motion: reduce` is active (or toggled by user), seat-to-seat camera interpolation switches from damped ease-out (`~650 ms`) to an immediate clean cut (`0 ms` / subtle fade) to avoid motion sickness.

---

## 3. Screen Geometry & Viewing-Angle Calculation Methodology

Let the rectangular flat screen have width $W$, height $H$, center $\mathbf{C} = (C_x, C_y, C_z)$, and optional vertical tilt $\tau$ (radians, tilting top slightly downward into the auditorium when $> 0$).

Screen orthonormal basis vectors:
- Right vector $\hat{u} = (1, 0, 0)$
- Up vector $\hat{v} = (0, \cos\tau, \sin\tau)$
- Normal vector (pointing toward audience) $\hat{n} = (0, -\sin\tau, \cos\tau)$

Screen edge midpoints & corners:
- Left $\mathbf{L} = \mathbf{C} - \frac{W}{2}\hat{u}$, Right $\mathbf{R} = \mathbf{C} + \frac{W}{2}\hat{u}$
- Bottom $\mathbf{B} = \mathbf{C} - \frac{H}{2}\hat{v}$, Top $\mathbf{T} = \mathbf{C} + \frac{H}{2}\hat{v}$
- Four corners: $\mathbf{TL}, \mathbf{TR}, \mathbf{BL}, \mathbf{BR} = \mathbf{C} \pm \frac{W}{2}\hat{u} \pm \frac{H}{2}\hat{v}$.

### Calculated Metrics per Seat

1. **Direct Distance to Screen Center ($d$):**
   $$d = \|\mathbf{C} - \mathbf{E}\|_2 = \sqrt{(C_x - E_x)^2 + (C_y - E_y)^2 + (C_z - E_z)^2}$$
2. **Perpendicular Distance to Screen Plane ($d_\perp$):**
   $$d_\perp = (\mathbf{E} - \mathbf{C}) \cdot \hat{n}$$
3. **Horizontal & Vertical Offsets:**
   $$\Delta x = (\mathbf{E} - \mathbf{C}) \cdot \hat{u}, \qquad \Delta y = (\mathbf{E} - \mathbf{C}) \cdot \hat{v}$$
4. **Horizontal Viewing Angle ($\theta_H$, off-axis azimuth from screen normal):**
   $$\theta_H = \operatorname{atan2}\big((\mathbf{E} - \mathbf{C}) \cdot \hat{u},\; (\mathbf{E} - \mathbf{C}) \cdot \hat{n}\big)$$
   - `0°` = directly on centerline; positive = right of center; negative = left of center.
   - Symmetry invariant: Two seats at $(-x, y, z)$ and $(+x, y, z)$ satisfy $\theta_H(-x) = -\theta_H(+x)$ and identical $|\theta_H|$.
5. **Vertical Viewing Angle to Screen Center ($\theta_V$) & Top Edge ($\theta_{V,\text{top}}$):**
   Let $d_{xz} = \sqrt{(C_x - E_x)^2 + (C_z - E_z)^2}$:
   $$\theta_V = \operatorname{atan2}(C_y - E_y,\; d_{xz})$$
   $$\theta_{V,\text{top}} = \operatorname{atan2}(T_y - E_y,\; \sqrt{(T_x - E_x)^2 + (T_z - E_z)^2})$$
   - Positive $\theta_V$ = looking upward; negative $\theta_V$ = looking downward.
6. **Horizontal Angular Screen Coverage ($\alpha_H$):**
   Using true 3D vectors $\vec{p}_L = \mathbf{L} - \mathbf{E}$ and $\vec{p}_R = \mathbf{R} - \mathbf{E}$:
   $$\alpha_H = \arccos\!\left(\operatorname{clamp}\!\left(\frac{\vec{p}_L \cdot \vec{p}_R}{\|\vec{p}_L\|\|\vec{p}_R\|},\; -1,\; 1\right)\right)$$
   - Why this matters: An off-center corner seat experiences horizontal foreshortening ($\alpha_H$ shrinks proportionally to $\cos\theta_H$ and slant distance). Oversimplified $2\arctan(W / 2d)$ fails for off-axis seats and is explicitly NOT used.
7. **Vertical Angular Screen Coverage ($\alpha_V$):**
   Using true 3D vectors $\vec{p}_T = \mathbf{T} - \mathbf{E}$ and $\vec{p}_B = \mathbf{B} - \mathbf{E}$:
   $$\alpha_V = \arccos\!\left(\operatorname{clamp}\!\left(\frac{\vec{p}_T \cdot \vec{p}_B}{\|\vec{p}_T\|\|\vec{p}_B\|},\; -1,\; 1\right)\right)$$
8. **Camera FOV vs. Angular Screen Size:**
   - The 3D `PerspectiveCamera` maintains a **constant vertical FOV** (default `55°` vertical) across all seat selections and seat comparisons.
   - Because `vFOV` is fixed, moving from Row J (`d ≈ 14.5 m`) to Row A (`d ≈ 3.9 m`) naturally expands the screen from filling a modest portion of the frame (`~39° H`) to dominating the user's peripheral field (`~107° H`) without artificial zoom tricks.

---

## 4. Visual Obstruction Estimation Methodology

Screen visibility is estimated by casting rays from $\mathbf{E}$ to a uniform $5 \times 3$ (15-point) sample grid distributed across the screen rectangle (inset by 6% from edges):
- **Static Occluders**: Row riser ledges, seatback bounding volumes of rows strictly closer to the screen ($z_{\text{occ}} < E_z$), aisle handrails, structural pillars, and balcony overhangs.
- **Configurable Audience Simulation**: Optional toggle modeling seated audience heads in front-row seats as spheres of radius `0.11 m` centered at `(E_front.x, E_front.y + 0.08, E_front.z)` (configurable stature assumption).
- **Performance Guard**: Computed purely mathematically on demand when a seat is selected or audience toggle changes (under `~0.1 ms` for 15 rays × ~140 boxes), **never inside `useFrame`**.
- **Reporting**: Always labeled as an *estimated visibility percentage* under modeled assumptions, never as an optical guarantee.

---

## 5. Assumptions, Standards & Limitations

- **No False Certification Claims**: While cinema design guidelines (e.g., SMPTE EG 18-1994 / THX viewing-angle references commonly cite ~36°–45° horizontal subtended angle and $\le 35^\circ$ upward tilt to screen top as general design heuristics), CineView 3D **does not claim certified compliance** unless an auditorium undergoes real physical measurement and audit.
- **Flat Screen Approximation**: Initial release models flat rectangular screens; curved screens (IMAX / PLF arcs) are planned as a clean extension via segmented screen chord geometry.
- **Simulated vs. Calibrated**: The initial prototype auditorium (`Grand Lumina — Screen 1`, 136 seats) is explicitly flagged as a `SIMULATED` demonstration digital twin.
