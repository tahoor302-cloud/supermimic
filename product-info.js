// Product detail content built from catalog.js: labelled specifications, sourcing details,
// "ideal for" lists and FAQ. Everything here describes how SikandarTech sources products;
// nothing claims a specific brand, price, rating or certification.

// ---------- Specification labels ----------
// Each catalogue spec is a short phrase ("4K OLED", "Bluetooth 5.3"). A label is inferred from
// its wording so the detail page can show a proper two-column specifications table.
const SPEC_RULES = [
  ["Connectivity", /hdmi|\b\d+k (output|hdmi)|usb outputs/i],
  ["Display", /oled|amoled|lcd|e-ink|display|screen|(?<!solar )panel|nits|dolby vision|\d+\s?hz|\d+(\.\d+)?["”]|touchscreen|hdr\d*\b|mini-led|microled|dimming/i],
  ["Camera & imaging", /\bmp\b|camera|lens|sensor size|gimbal|fps|\bvideo\b|\b\d(\.\d)?k\b|zoom|thermal|lidar|night vision|optic/i],
  ["Audio", /\banc\b|noise|speaker|driver|dolby|spatial audio|hi-res|\bmic|sound|audio|dac|aptx|ldac/i],
  ["Connectivity", /bluetooth|\bble\b|wi-?fi|\blte\b|\b[45]g\b|usb|thunderbolt|hdmi|nfc|\bgps\b|gnss|ant\+|ethernet|rj45|sfp|matter|zigbee|thread|lora|esim|wireless|poe|\bsdi\b|\bndi\b|satellite|uwb|mesh/i],
  ["Performance", /cpu|gpu|\bnpu\b|tops|\bram\b|\bcores?\b|chip|processor|ryzen|intel|(?<!-)\barm\b|\bsoc\b|ddr|xeon|rtx|fpga|\bmcu\b/i],
  ["Storage", /\b\d+\s?(tb|gb)\b|ssd|nvme|mb\/s|storage|memory card|\braid\b|bays?\b/i],
  ["Power & charging", /\b\d+(\.\d+)?\s?w\b|\bpd\b|charging|charger|solar|\bac\b|watt|lifepo4|\bwh\b|kwh|ups|inverter|volt|\bv\b/i],
  ["Battery", /battery|mah|runtime|\d+\s?h\b|hours?|days?\b|weeks?|rechargeable/i],
  ["Durability", /\bip\d{2}\b|ipx\d|mil-std|waterproof|water resistant|rugged|shock|drop|dustproof|\d+m depth|atm\b/i],
  ["Sensors & health", /heart|\bhr\b|spo2|ecg|hrv|sleep|temperature|pm2\.5|co2|voc|detection|tracking|sensor|biometric|fingerprint|face/i],
  ["Capacity & range", /\b\d+\s?(l|kg|km|m)\b|payload|tank|range|coverage|capacity|suction|\bpa\b/i],
  ["Design", /aluminium|aluminum|titanium|steel|carbon|foldable|weight|\bunder \d+g\b|lightweight|compact|slim|body|frame|\bcases?\b|design|portable|desktop/i],
  ["Controls & software", /app|voice|touch|remote|button|software|sdk|ai\b|assistant|control|programmable|automation|cloud|os\b/i]
];

function specLabel(spec) {
  const hit = SPEC_RULES.find(([, re]) => re.test(spec));
  return hit ? hit[0] : "Features";
}

// [[label, value], ...] with values that share a label merged into one row
function specRows(p) {
  const rows = [];
  p.specs.forEach((s) => {
    const label = specLabel(s);
    const row = rows.find((r) => r[0] === label);
    if (row) row[1] += " · " + s;
    else rows.push([label, s]);
  });
  return rows;
}

// ---------- Sourcing details (how SikandarTech supplies every product) ----------
function sourcingRows(p) {
  const c = catById[p.cat];
  return [
    ["Product code", productCode(p)],
    ["Category", c.name],
    ["Availability", STATUS_LABEL[p.status]],
    ["Sourced from", "Verified manufacturers in China (Guangzhou / Shenzhen region)"],
    ["Brand & model", "Choice of factory brands and models, confirmed in your quotation"],
    ["Price & MOQ", "Factory price and minimum order quantity confirmed in your quotation"],
    ["Samples", "Available on request before bulk orders"],
    ["OEM / private label", "Your logo and packaging on request (depending on order quantity)"],
    ["Quality control", "Pre-shipment inspection with photo and video report"],
    ["Compliance documents", "Requested from the factory for your market (for example CE, FCC, RoHS)"],
    ["Warranty", "Manufacturer warranty, terms confirmed in your quotation"],
    ["Shipping", "Sea, air or express to any country, door to door"]
  ];
}

// ---------- Who the product suits ----------
const IDEAL_FOR = {
  "ai-gadgets": ["Electronics retailers", "Online sellers", "Corporate gifting", "Language & travel stores"],
  computers: ["IT distributors", "Offices & schools", "Gaming stores", "System integrators"],
  tablets: ["Education suppliers", "Bookstores", "Online sellers", "Corporate buyers"],
  xr: ["Gaming & entertainment stores", "Training providers", "Arcades & VR centres", "Developers"],
  wearables: ["Fitness & sports retail", "Online sellers", "Corporate wellness gifts", "Electronics stores"],
  audio: ["Electronics retailers", "Online sellers", "Music & studio shops", "Corporate gifting"],
  cameras: ["Camera & creator shops", "Security installers", "Online sellers", "Production studios"],
  "drones-robotics": ["Drone & hobby stores", "Agriculture & survey firms", "Schools & universities", "Industrial buyers"],
  gaming: ["Gaming stores", "Online sellers", "Esports venues", "Electronics retailers"],
  "smart-home": ["Smart-home installers", "Property developers", "Online sellers", "Security companies"],
  "kitchen-appliances": ["Home appliance stores", "Online sellers", "Hotels & serviced apartments", "Distributors"],
  power: ["Outdoor & camping stores", "Solar installers", "Online sellers", "Emergency suppliers"],
  networking: ["ISPs & IT installers", "Offices", "System integrators", "Online sellers"],
  storage: ["IT distributors", "Creators & studios", "Offices", "Online sellers"],
  displays: ["Electronics retailers", "Hotels & offices", "Signage companies", "Home-cinema installers"],
  automotive: ["Car accessory shops", "E-mobility stores", "Fleet operators", "Online sellers"],
  "health-fitness": ["Gyms & fitness stores", "Wellness retailers", "Online sellers", "Corporate wellness"],
  maker: ["Maker & hobby stores", "Schools & labs", "Small manufacturers", "Engineering firms"],
  "future-tech": ["Research labs", "Universities", "Innovation teams", "Tech showrooms"],
  security: ["Security installers", "IT departments", "Property managers", "Online sellers"],
  "travel-outdoor": ["Outdoor & adventure stores", "Travel retail", "Expedition outfitters", "Online sellers"],
  "office-education": ["Office suppliers", "Schools & training centres", "IT resellers", "Corporate buyers"],
  "care-beauty": ["Beauty & salon suppliers", "Pharmacies & wellness stores", "Online sellers", "Gift retailers"],
  accessories: ["Electronics retailers", "Online sellers", "Corporate gifting", "Travel retail"]
};
const idealFor = (p) => IDEAL_FOR[p.cat] || ["Retailers", "Online sellers", "Distributors", "Corporate buyers"];

// ---------- Overview copy ----------
function overview(p) {
  const c = catById[p.cat];
  const lead = p.desc;
  const range = `It belongs to our ${c.name.toLowerCase()} range: ${c.tagline.charAt(0).toLowerCase() + c.tagline.slice(1)}`;
  const how =
    p.status === "available"
      ? "We source it directly from verified factories in China, compare options for you and inspect every order before it ships."
      : p.status === "coming"
      ? "This is a newly announced product type. Tell us what you need and we will confirm factory availability, samples and launch timing."
      : "This is emerging technology: many models are prototypes, research hardware or limited releases. We confirm what can actually be supplied before any order.";
  return [lead, range, how];
}

function productNotes(p) {
  const notes = [];
  if (p.cat === "health-fitness" || /medical|ultrasound|ecg|blood-pressure|hearing aids|oximeter/i.test(p.name))
    notes.push("Wellness product. Devices used for medical diagnosis need the appropriate local regulatory approval; we request the relevant documents from the factory.");
  if (p.status === "emerging") notes.push("Emerging technology: may be a prototype or limited release. Availability is confirmed on enquiry.");
  if (/drone|uav|fpv|ev charging|e-bike|electric (scooter|bicycle|motorcycle)|battery|power station/i.test(p.name))
    notes.push("Batteries and drones have special shipping and import rules in some countries. We advise on the right shipping method for your destination.");
  return notes;
}

// ---------- FAQ ----------
function productFaq(p) {
  return [
    ["What is the price and minimum order?", `Prices depend on the brand, model, quantity and your destination. Send us your target quantity for ${p.name.toLowerCase()} and we reply with factory options, price and MOQ.`],
    ["Can I order a sample first?", "Yes. Samples are available for most products so you can check quality before a bulk order."],
    ["Can you add my logo or packaging?", "Yes, OEM and private-label options are available on many products, usually from a minimum quantity agreed with the factory."],
    ["How do you check quality?", "We inspect orders before shipment and send you photos and videos of the goods, packaging and testing."],
    ["How is it shipped to my country?", "By sea, air or express courier, door to door. We recommend the best option for your budget, timeline and the product type."]
  ];
}
