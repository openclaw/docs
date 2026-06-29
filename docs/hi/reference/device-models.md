---
read_when:
    - डिवाइस मॉडल पहचानकर्ता मैपिंग या NOTICE/license फ़ाइलें अपडेट करना
    - इंस्टैंस यूआई डिवाइस नाम कैसे दिखाता है, इसे बदलना
summary: macOS ऐप में उपयोगकर्ता-अनुकूल नामों के लिए OpenClaw Apple डिवाइस मॉडल पहचानकर्ताओं को कैसे शामिल करता है।
title: डिवाइस मॉडल डेटाबेस
x-i18n:
    generated_at: "2026-06-29T00:07:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f20e035f787ba7d9bb48d2a18263679d20b295e12ffb263a63c3a0ef72312d34
    source_path: reference/device-models.md
    workflow: 16
---

macOS साथी ऐप **इंस्टेंसेस** UI में Apple मॉडल पहचानकर्ताओं (जैसे `iPad16,6`, `Mac16,6`) को मनुष्यों द्वारा पढ़े जा सकने वाले नामों से मैप करके अनुकूल Apple डिवाइस मॉडल नाम दिखाता है।

मैपिंग JSON के रूप में यहां वेंडर की गई है:

- `apps/macos/Sources/OpenClaw/Resources/DeviceModels/`

## डेटा स्रोत

हम वर्तमान में MIT-लाइसेंस वाले रिपॉज़िटरी से मैपिंग वेंडर करते हैं:

- `kyle-seongwoo-jun/apple-device-identifiers`

बिल्ड को निर्धारक बनाए रखने के लिए, JSON फ़ाइलों को विशिष्ट upstream कमिट्स पर पिन किया गया है (जो `apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md` में दर्ज हैं)।

## डेटाबेस अपडेट करना

1. वे upstream कमिट्स चुनें जिन्हें आप पिन करना चाहते हैं (एक iOS के लिए, एक macOS के लिए)।
2. `apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md` में कमिट हैश अपडेट करें।
3. उन कमिट्स पर पिन की गई JSON फ़ाइलें फिर से डाउनलोड करें:

```bash
IOS_COMMIT="<commit sha for ios-device-identifiers.json>"
MAC_COMMIT="<commit sha for mac-device-identifiers.json>"

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${IOS_COMMIT}/ios-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/ios-device-identifiers.json

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${MAC_COMMIT}/mac-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/mac-device-identifiers.json
```

4. सुनिश्चित करें कि `apps/macos/Sources/OpenClaw/Resources/DeviceModels/LICENSE.apple-device-identifiers.txt` अब भी upstream से मेल खाता है (यदि upstream लाइसेंस बदलता है तो इसे बदल दें)।
5. सत्यापित करें कि macOS ऐप साफ़ तौर पर बिल्ड होता है (कोई चेतावनी नहीं):

```bash
swift build --package-path apps/macos
```

## संबंधित

- [Node](/hi/nodes)
- [Node समस्या निवारण](/hi/nodes/troubleshooting)
