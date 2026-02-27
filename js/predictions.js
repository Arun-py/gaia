/* ================================================================
   GAIA — Rule-Based Prediction Engine
   Reads all stored data and returns predictions, suggestions, scores
   ================================================================ */

function runPredictions() {
  const d = getAllProjectData();
  const { site, client, materials, structural, cost } = d;

  const predictions  = [];
  const suggestions  = [];

  const scores = { energy: 100, cost: 100, structural: 100, isCode: 100 };

  /* Helper */
  const addP = (type, cat, title, desc, page) =>
    predictions.push({ type, cat, title, desc, page });
  const addS = (icon, title, desc) =>
    suggestions.push({ icon, title, desc });

  /* ── THERMAL / CLIMATE ── */
  if (site.climate === 'hot' && site.westWindows === 'large') {
    addP('danger', 'Thermal', 'High Heat Gain Risk',
      'Large west-facing windows in a hot climate will cause severe indoor heat gain, increasing cooling load by 30–40%.',
      'Site Analysis');
    addS('🪟', 'Reduce west glass area', 'Limit west-facing glazing to ≤10% of wall area or use deep overhangs.');
    addS('🌿', 'Add external sunshades', 'Horizontal louvers or chajjas on west windows reduce solar gain by 60%.');
    scores.energy -= 22;
  }

  if (site.climate === 'cold' && materials.wallType !== 'insulated') {
    addP('warning', 'Thermal', 'Thermal Discomfort — Cold Climate',
      'Non-insulated walls in a cold climate lead to high heating costs and occupant discomfort.',
      'Material Selection');
    addS('🧱', 'Use insulated wall panels', 'Double brick with 50 mm insulation core, or AAC blocks with plaster.');
    scores.energy -= 15;
  }

  if (site.climate === 'hot' && materials.roofInsulation !== 'yes') {
    addP('warning', 'Thermal', 'Roof Heat Transmission Risk',
      'Uninsulated flat roof in hot climate becomes a major heat absorber causing high AC load.',
      'Material Selection');
    addS('🏠', 'Add roof insulation', 'Use 75 mm EPS/XPS insulation under roof slab, or heat-reflective cool-roof paint.');
    scores.energy -= 12;
  }

  /* ── WATER / DRAINAGE ── */
  if (site.rainfall === 'heavy' && materials.roofType === 'flat') {
    addP('danger', 'Water', 'Water Stagnation Risk',
      'Flat roof in heavy rainfall zone will cause standing water, roof leaks, and structural seepage.',
      'Material Selection');
    addS('🏠', 'Switch to sloped roof', 'Provide minimum 1:12 pitch with ridge cap and proper eaves drainage.');
    addS('💧', 'Rainwater harvesting', 'Capture roof runoff in underground sump — reduces urban flooding risk.');
    scores.structural -= 15;
  }

  if (site.rainfall === 'heavy' && site.drainageSlope !== 'adequate') {
    addP('warning', 'Water', 'Site Waterlogging Risk',
      'Heavy rainfall combined with inadequate site drainage slope leads to foundation soaking.',
      'Site Analysis');
    addS('🌊', 'Improve site drainage slope', 'Maintain ≥1.5% slope away from building plinth as per NBC guidelines.');
    scores.structural -= 8;
  }

  /* ── COASTAL ── */
  if (site.climate === 'coastal' && materials.steelType !== 'corrosion_resistant') {
    addP('danger', 'Material', 'Corrosion Risk — Coastal Zone',
      'Standard mild steel in coastal salt-laden air corrodes 5–8× faster, compromising structural integrity.',
      'Material Selection');
    addS('🛡', 'Use HYSD / corrosion-resistant steel', 'Epoxy-coated rebar or TMT Fe 500 with anti-corrosion coating as per IS 800.');
    addS('🎨', 'Apply weather-resistant coating', 'Use two-coat epoxy primer + polyurethane topcoat on all exposed steel.');
    scores.structural -= 18;
    scores.isCode -= 10;
  }

  /* ── WIND ── */
  if (site.windSpeed === 'high' && structural.floors > 4) {
    addP('warning', 'Wind', 'Wind Pressure Risk',
      `${structural.floors}-storey building in high wind zone needs wind analysis per IS 875 Part 3.`,
      'Structural Safety');
    addS('🏗', 'Provide lateral bracing / shear walls', 'Design shear walls at building core for wind load resistance per IS 875:3.');
    scores.structural -= 10;
    scores.isCode -= 8;
  }

  /* ── BUDGET ── */
  const budgetAmt = parseFloat(client.budget) || 0;
  const estimateAmt = parseFloat(cost.estimated) || 0;
  if (budgetAmt > 0 && estimateAmt > budgetAmt * 1.04) {
    const overrunPct = (((estimateAmt - budgetAmt) / budgetAmt) * 100).toFixed(1);
    const overrunAmt = Math.round(estimateAmt - budgetAmt).toLocaleString('en-IN');
    addP('danger', 'Cost', `Budget Overrun: +${overrunPct}%`,
      `Estimated cost (₹${Math.round(estimateAmt).toLocaleString('en-IN')}) exceeds budget by ₹${overrunAmt}.`,
      'Cost Planning');
    addS('💰', 'Reduce non-essential spaces', 'Remove utility/store rooms >10 m² or merge living + dining area.');
    addS('🧱', 'Use cost-effective local materials', 'Switch from imported tiles to vitrified / local stone; saves 8–12%.');
    scores.cost -= 30;
  } else if (budgetAmt > 0 && estimateAmt > budgetAmt * 0.9) {
    addP('warning', 'Cost', 'Budget Margin Tight',
      'Estimate is close to budget — cost escalation during construction may cause overrun.',
      'Cost Planning');
    addS('📊', 'Keep 10% contingency buffer', 'Allocate minimum 10% of budget as contingency for price escalations.');
    scores.cost -= 12;
  }

  /* ── SPACE ── */
  const rooms = parseInt(client.rooms) || 0;
  if (rooms > 5 && client.budgetRange === 'low') {
    addP('warning', 'Space', 'Space Shortage Risk',
      'High room count with low budget typically leads to cramped room sizes below NBC minimum standards.',
      'Client Requirements');
    addS('📐', 'Use open-plan design', 'Combine kitchen + dining, or use foldable partitions to save area.');
    scores.cost -= 10;
  }

  if (client.futureExpansion === 'yes' && !structural.expansionColumns) {
    addP('warning', 'Structural', 'Future Expansion Not Planned',
      'No expansion columns provided — future vertical addition will require costly retrofitting.',
      'Structural Safety');
    addS('🏗', 'Provide provision columns now', 'Extend columns to top slab level with projecting rebars for future floors.');
    scores.structural -= 8;
    scores.isCode -= 5;
  }

  /* ── STRUCTURAL ── */
  const floors = parseInt(structural.floors) || 1;
  const zone   = parseInt(structural.seismicZone) || 2;

  // Settlement risk
  if (['loose_sand', 'filled', 'soft_clay'].includes(structural.soilType) && floors >= 2) {
    addP('danger', 'Structural', 'Differential Settlement Risk',
      `${getLabel('soilType', structural.soilType)} with ${floors} floors risks uneven settlement causing cracks and tilt.`,
      'Structural Safety');
    addS('🏗', 'Use raft / pile foundation', 'Raft foundation distributes load on weak soil. Design per IS 6403.');
    addS('🔍', 'Conduct soil investigation', 'Bore holes at each column location before finalising foundation type.');
    scores.structural -= 22;
    scores.isCode -= 15;
  }

  // Seismic risk
  if (zone >= 4) {
    addP('danger', 'Seismic', `Seismic Zone ${zone} — High Risk`,
      'Zone IV/V demands ductile detailing for all RC members per IS 13920 to prevent collapse.',
      'Structural Safety');
    addS('🔩', 'Follow ductile detailing (IS 13920)', 'Use 135° stirrup hooks, closer spacing at column/beam junctions.');
    addS('🏛', 'Provide RC shear walls', 'Core shear walls at building centre reduce lateral drift by 60%.');
    scores.structural -= 12;
    scores.isCode -= 12;
  } else if (zone === 3) {
    addP('warning', 'Seismic', 'Seismic Zone III — Moderate Risk',
      'Zone III requires IS 1893 seismic load checks and proper ductile design.',
      'Structural Safety');
    addS('📐', 'Check IS 1893 Part 1 compliance', 'Calculate design base shear and distribute to frames/shear walls.');
    scores.structural -= 6;
    scores.isCode -= 6;
  }

  // Torsional irregularity
  if (['L', 'T', 'U', 'Plus'].includes(structural.planShape) && zone >= 3) {
    addP('warning', 'Structural', 'Torsional Irregularity Risk',
      `${structural.planShape}-shaped plan in Zone ${zone} will experience torsional forces during earthquakes.`,
      'Structural Safety');
    addS('⚖', 'Add seismic / expansion joints', 'Break irregular plan into regular units with 50 mm seismic joints.');
    addS('🏗', 'Place shear walls symmetrically', 'Symmetric shear wall layout reduces torsion by matching stiffness centres.');
    scores.structural -= 14;
    scores.isCode -= 10;
  }

  // Soft storey
  if (structural.openGroundFloor && floors > 2) {
    addP('danger', 'Structural', 'Soft Storey Risk',
      'Open ground floor (stilt) with load-bearing floors above is most vulnerable failure mode in earthquakes.',
      'Structural Safety');
    addS('🏗', 'Add infill masonry or bracing', 'Brick infill or RC bracing at ground floor stiffens the soft storey.');
    scores.structural -= 18;
    scores.isCode -= 14;
  }

  // Punching shear (flat slab)
  if (structural.slabType === 'flat' && floors > 3) {
    addP('warning', 'Structural', 'Punching Shear Risk',
      'Flat slab without shear caps in tall building is susceptible to punching failure at column heads.',
      'Structural Safety');
    addS('🔩', 'Provide drop panels / shear studs', 'Column drop panels (min 300 mm thick) or headed shear studs per IS 456.');
    scores.structural -= 8;
    scores.isCode -= 6;
  }

  /* ── VENTILATION ── */
  if (!site.crossVentilation && (client.buildingType === 'office' || client.buildingType === 'house')) {
    addP('warning', 'Ventilation', 'Poor Natural Ventilation Risk',
      'No cross-ventilation provision leads to full AC dependence — high energy costs and poor air quality.',
      'Smart Design');
    addS('💨', 'Design cross-ventilation corridors', 'Align openings on opposite walls perpendicular to prevailing wind direction.');
    addS('☀', 'Add skylights / clerestory windows', 'Stack ventilation via skylights improves air changes by 3–4 ACH naturally.');
    scores.energy -= 18;
  }

  /* ── IS CODE COMPLIANCE CHECK ── */
  if (floors > 4 && !structural.fireEgress) {
    addP('warning', 'Safety', 'Fire Safety Compliance Gap',
      'Buildings >15 m height require fire escape staircases and hydrant provisions per NBC Part 4.',
      'Structural Safety');
    addS('🚒', 'Provide fire egress per NBC Part 4', 'Min 1.2 m wide fire staircase, fire doors, and fire hydrant on each floor.');
    scores.isCode -= 12;
  }

  /* Clamp scores */
  Object.keys(scores).forEach(k => {
    scores[k] = Math.max(0, Math.min(100, Math.round(scores[k])));
  });

  return { predictions, suggestions, scores };
}

/* Helper label lookup */
function getLabel(field, val) {
  const labels = {
    soilType: {
      rock: 'Hard Rock', hard_clay: 'Hard Clay', medium_clay: 'Medium Clay',
      soft_clay: 'Soft Clay', loose_sand: 'Loose Sand', filled: 'Filled / Made-up Ground'
    }
  };
  return (labels[field] && labels[field][val]) || val;
}

/* Quick site output calculator */
function calcSiteOutputs(data) {
  const out = {};
  // Orientation
  if (data.climate === 'hot')     out.orientation = 'Elongate N–S axis; minimise E–W exposure';
  else if (data.climate === 'cold') out.orientation = 'Compact form; main facade facing South for passive solar gain';
  else if (data.climate === 'coastal') out.orientation = 'Open to prevailing sea breeze; sheltered from saline wind';
  else                            out.orientation = 'Orient for best cross-ventilation and natural daylight';

  // Windows
  if (data.climate === 'hot')     out.windows = 'Large windows on North only; minimal West; South with shading';
  else if (data.climate === 'cold') out.windows = 'Max South-facing glazing for passive solar heat; small North openings';
  else if (data.climate === 'coastal') out.windows = 'Screened openings toward sea breeze; storm shutters on windward side';
  else                            out.windows = 'Balanced openings for cross-ventilation on wind-facing walls';

  // Roof
  if (data.rainfall === 'heavy')  out.roof = 'Sloped roof (1:12+ pitch), metal/RCC, with gutters and downpipes';
  else if (data.climate === 'hot') out.roof = 'Flat RCC with cool-roof coating + 75 mm EPS insulation';
  else if (data.climate === 'cold') out.roof = 'Insulated pitched roof with sarking membrane and ventilated cavity';
  else                             out.roof = 'RCC flat roof with proper waterproofing and drainage';

  // Foundation
  const fndMap = {
    rock:        'Shallow strip/pad on rock; nominal blinding — IS 1904',
    hard_clay:   'Isolated footings or strip foundation — IS 1904',
    medium_clay: 'Isolated footings with tie beams — IS 1904',
    soft_clay:   'Raft foundation recommended — IS 6403',
    loose_sand:  'Raft or bored pile foundation — IS 6403',
    filled:      'Deep pile foundation essential — IS 6403',
  };
  out.foundation = fndMap[data.soilType] || 'Verify SBC; design per IS 1904 / IS 6403';

  return out;
}

/* Material suggestions by climate */
function getMaterialSuggestions(climate, rainfall) {
  const s = [];
  if (climate === 'hot') {
    s.push({ cat:'Wall',       item:'AAC Blocks (600×200×200)',      reason:'Lightweight, insulating, low heat storage — IS 2185' });
    s.push({ cat:'Roof',       item:'RCC flat roof + cool-roof paint', reason:'Reflects 80% solar radiation, lowers indoor temp 4–6°C' });
    s.push({ cat:'Flooring',   item:'Kota stone / vitrified tiles',  reason:'Low thermal mass, cool to touch' });
    s.push({ cat:'Paint',      item:'Exterior weathershield paint',   reason:'UV-resistant, 10–15 yr durability' });
  } else if (climate === 'cold') {
    s.push({ cat:'Wall',       item:'Double brick with 50mm EPS insulation', reason:'R-value ≥ 2.5, reduces heating load 40%' });
    s.push({ cat:'Roof',       item:'Insulated pitched roof (Mangalore tiles)', reason:'Ventilated cavity + insulation board' });
    s.push({ cat:'Flooring',   item:'Wooden / bamboo flooring',      reason:'Natural insulator, warm feel' });
    s.push({ cat:'Glazing',    item:'Double-glazed uPVC windows',    reason:'U-value ≤ 1.8 W/m²K reduces heat loss' });
  } else if (climate === 'coastal') {
    s.push({ cat:'Structure',  item:'Corrosion-resistant TMT Fe 500', reason:'5× longer life in salt air — IS 1786' });
    s.push({ cat:'Concrete',   item:'M30 concrete + 400 kg/m³ cement', reason:'Low permeability protects rebar from chlorides — IS 456' });
    s.push({ cat:'Roof',       item:'Colour-coated GI roofing sheet', reason:'Galvanised + painted; resists salt corrosion' });
    s.push({ cat:'Finish',     item:'Epoxy paint on all RCC surfaces', reason:'Forms moisture barrier against salt penetration' });
  } else if (rainfall === 'heavy') {
    s.push({ cat:'Roof',       item:'Sloped clay/clay-Mangalore tiles', reason:'Gravity drainage; zero standing water' });
    s.push({ cat:'Wall',       item:'Fly-ash brick (weatherproof)',    reason:'Less water absorption than conventional brick' });
    s.push({ cat:'Flooring',   item:'Anti-skid ceramic tiles',        reason:'Safe in wet indoor/outdoor conditions' });
    s.push({ cat:'Waterproof', item:'2-coat cementitious waterproofing', reason:'Applied to all wet areas, basement, plinth' });
  } else {
    s.push({ cat:'Wall',       item:'Clay brick (230 mm)',            reason:'Good thermal mass, widely available' });
    s.push({ cat:'Roof',       item:'RCC flat roof M25',              reason:'Standard construction per IS 456' });
    s.push({ cat:'Flooring',   item:'Vitrified tiles 600×600',       reason:'Durable, low maintenance' });
    s.push({ cat:'Paint',      item:'Acrylic exterior paint',         reason:'Cost-effective, 5–7 yr protection' });
  }
  return s;
}

/* Foundation recommendation */
function getFoundationRec(soilType, floors, seismicZone) {
  const z = parseInt(seismicZone) || 2;
  const f = parseInt(floors)      || 1;

  if (soilType === 'rock')   return { type: 'Shallow Strip / Pad',  minDepth: '0.6 m',  code: 'IS 1904' };
  if (soilType === 'hard_clay') {
    if (f <= 3) return { type: 'Isolated Footings + Tie Beams', minDepth: '1.2 m', code: 'IS 1904' };
    return        { type: 'Raft Foundation',                    minDepth: '1.5 m', code: 'IS 6403' };
  }
  if (soilType === 'medium_clay') {
    if (f <= 2) return { type: 'Strip / Isolated Footings', minDepth: '1.5 m', code: 'IS 1904' };
    return        { type: 'Raft Foundation',               minDepth: '1.8 m', code: 'IS 6403' };
  }
  if (soilType === 'soft_clay' || soilType === 'loose_sand') {
    return { type: 'Raft Foundation (preferred) / Bored Pile', minDepth: '2.0 m', code: 'IS 6403 / IS 2911' };
  }
  if (soilType === 'filled') {
    return { type: 'Bored Pile Foundation (mandatory)', minDepth: '6–12 m', code: 'IS 2911 Part 1' };
  }
  return { type: 'Isolated Footings', minDepth: '1.2 m', code: 'IS 1904' };
}

/* Column size recommendation */
function getColumnRec(floors, spacingM) {
  const f = parseInt(floors)   || 1;
  const s = parseFloat(spacingM) || 4;
  if (f <= 2) return { size: '230×230 mm', grade: 'M20', steel: 'Fe 415', minRatio: '1.2%' };
  if (f <= 4) return { size: '300×300 mm', grade: 'M25', steel: 'Fe 500', minRatio: '1.4%' };
  if (f <= 6) return { size: '350×350 mm', grade: 'M25', steel: 'Fe 500', minRatio: '1.6%' };
  return             { size: '450×450 mm', grade: 'M30', steel: 'Fe 500D', minRatio: '1.8%' };
}
