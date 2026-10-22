const fs = require("fs");
const path = require("path");

const p = path.join(__dirname, "src", "data", "products.ts");
let content = fs.readFileSync(p, "utf8");

// 1. Roborock S8 Pro Ultra
content = content.replace(
  /slug:\s*"roborock-s8-pro-ultra",([\s\S]*?)image:\s*images\.roborockS8,/,
  'slug: "roborock-s8-pro-ultra",$1image: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",',
);

// 2. Google Nest
content = content.replace(
  /slug:\s*"google-nest-learning-thermostat-3rd-gen",([\s\S]*?)image:\s*images\.nestLearning,/,
  'slug: "google-nest-learning-thermostat-3rd-gen",$1image: pThermostat,',
);

// 3. Yandex Station Duo Max
content = content.replace(
  /slug:\s*"yandex-station-duo-max",([\s\S]*?)image:\s*images\.yandexAlice,/,
  'slug: "yandex-station-duo-max",$1image: pSpeaker,',
);

// 4. Danfoss Icon 2
content = content.replace(
  /slug:\s*"danfoss-icon2-main-controller",([\s\S]*?)image:\s*images\.danfossIcon,/,
  'slug: "danfoss-icon2-main-controller",$1image: pHub,',
);

// 5. Neptun Bugatti
content = content.replace(
  /slug:\s*"neptun-bugatti-prow-plus-12",([\s\S]*?)image:\s*images\.neptunBugatti,/,
  'slug: "neptun-bugatti-prow-plus-12",$1image: pSensor,',
);

// 6. Yandex Smart Remote
content = content.replace(
  /slug:\s*"yandex-smart-remote",([\s\S]*?)image:\s*images\.yandexAlice,/,
  'slug: "yandex-smart-remote",$1image: pSensor,',
);

fs.writeFileSync(p, content, "utf8");
console.log("SUCCESS!");
