---
read_when:
    - डिवाइस मॉडल आइडेंटिफ़ायर मैपिंग या NOTICE/लाइसेंस फ़ाइलें अपडेट करना
    - Instances UI में डिवाइस के नाम प्रदर्शित होने का तरीका बदलना
summary: OpenClaw, macOS ऐप में उपयोगकर्ता-अनुकूल नामों के लिए Apple डिवाइस मॉडल पहचानकर्ताओं को किस प्रकार विक्रेता के रूप में शामिल करता है।
title: डिवाइस मॉडल डेटाबेस
x-i18n:
    generated_at: "2026-07-16T17:05:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 930cd330594072d9c986b8c85c5a68e02dd096e5f0c015e3ee86b767073b93e6
    source_path: reference/device-models.md
    workflow: 16
---

macOS सहयोगी ऐप का **इंस्टेंस** UI Apple मॉडल पहचानकर्ताओं को सरल नामों से मैप करता है (`iPad16,6` -> "iPad Pro 13-inch (M4)", `Mac16,6` -> "MacBook Pro (14-inch, 2024)")। `DeviceModelCatalog` प्रत्येक डिवाइस के लिए SF Symbol चुनने हेतु पहचानकर्ता के प्रीफ़िक्स (और उपलब्ध न होने पर डिवाइस फ़ैमिली) का भी उपयोग करता है।

`apps/macos/Sources/OpenClaw/Resources/DeviceModels/` में फ़ाइलें:

| फ़ाइल                                   | उद्देश्य                               |
| -------------------------------------- | ------------------------------------- |
| `ios-device-identifiers.json`          | iOS/iPadOS पहचानकर्ता -> नाम मैपिंग |
| `mac-device-identifiers.json`          | Mac पहचानकर्ता -> नाम मैपिंग        |
| `NOTICE.md`                            | पिन किए गए अपस्ट्रीम कमिट SHA           |
| `LICENSE.apple-device-identifiers.txt` | अपस्ट्रीम MIT लाइसेंस                  |

## डेटा स्रोत

MIT-लाइसेंस प्राप्त `kyle-seongwoo-jun/apple-device-identifiers` GitHub रिपॉज़िटरी से वेंडर किया गया है। बिल्ड को निर्धारक बनाए रखने के लिए JSON फ़ाइलों को `NOTICE.md` में दर्ज कमिट SHA पर पिन किया गया है।

## डेटाबेस अपडेट करना

1. पिन करने के लिए अपस्ट्रीम कमिट SHA चुनें (एक iOS के लिए, एक macOS के लिए)।
2. नए SHA के साथ `apps/macos/Sources/OpenClaw/Resources/DeviceModels/NOTICE.md` को अपडेट करें।
3. उन कमिट पर पिन की गई JSON फ़ाइलें दोबारा डाउनलोड करें:

```bash
IOS_COMMIT="<commit sha for ios-device-identifiers.json>"
MAC_COMMIT="<commit sha for mac-device-identifiers.json>"

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${IOS_COMMIT}/ios-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/ios-device-identifiers.json

curl -fsSL "https://raw.githubusercontent.com/kyle-seongwoo-jun/apple-device-identifiers/${MAC_COMMIT}/mac-device-identifiers.json" \
  -o apps/macos/Sources/OpenClaw/Resources/DeviceModels/mac-device-identifiers.json
```

4. पुष्टि करें कि `LICENSE.apple-device-identifiers.txt` अब भी अपस्ट्रीम से मेल खाता है; यदि अपस्ट्रीम लाइसेंस बदल गया है, तो इसे बदलें।
5. सत्यापित करें कि macOS ऐप बिना किसी त्रुटि के बिल्ड होता है:

```bash
swift build --package-path apps/macos
```

## संबंधित

- [Nodes](/hi/nodes)
- [Node समस्या निवारण](/hi/nodes/troubleshooting)
