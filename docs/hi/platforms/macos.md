---
read_when:
    - macOS ऐप इंस्टॉल करना
    - macOS पर स्थानीय और दूरस्थ Gateway मोड के बीच निर्णय लेना
    - macOS ऐप रिलीज़ डाउनलोड खोज रहे हैं
summary: OpenClaw macOS मेनू बार ऐप इंस्टॉल करें और उपयोग करें
title: macOS ऐप
x-i18n:
    generated_at: "2026-06-28T23:30:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 42cd610465f2e60736da4681e028bca3ed3ed00b424028554ea098acc8ea980c
    source_path: platforms/macos.md
    workflow: 16
---

macOS ऐप OpenClaw **मेनू बार साथी** है। इसका उपयोग तब करें जब आपको
नेटिव ट्रे UI, macOS अनुमति प्रॉम्प्ट, सूचनाएं, WebChat, वॉइस इनपुट,
Canvas, या Mac-होस्टेड Node टूल जैसे `system.run` चाहिए हों।

यदि आपको केवल CLI और Gateway की आवश्यकता है, तो [शुरू करना](/hi/start/getting-started) से शुरू करें।

## डाउनलोड करें

macOS ऐप बिल्ड
[OpenClaw GitHub रिलीज़](https://github.com/openclaw/openclaw/releases) से डाउनलोड करें।
जब किसी रिलीज़ में macOS ऐप एसेट शामिल हों, तो इन्हें देखें:

- `OpenClaw-<version>.dmg` (प्राथमिक)
- `OpenClaw-<version>.zip`

कुछ रिलीज़ में केवल CLI, प्रमाण, या Windows एसेट शामिल होते हैं। यदि नवीनतम
रिलीज़ में कोई macOS ऐप एसेट नहीं है, तो उस नवीनतम रिलीज़ का उपयोग करें जिसमें यह हो, या
[macOS डेवलपमेंट सेटअप](/hi/platforms/mac/dev-setup) के साथ स्रोत से ऐप बिल्ड करें।

## पहली बार चलाना

1. **OpenClaw.app** इंस्टॉल और लॉन्च करें।
2. macOS अनुमति चेकलिस्ट पूरी करें।
3. **स्थानीय** या **दूरस्थ** मोड चुनें।
4. यदि ऐप मांगे, तो `openclaw` CLI इंस्टॉल करें।
5. मेनू बार से WebChat खोलें और एक परीक्षण संदेश भेजें।

CLI/Gateway सेटअप पथ के लिए, [शुरू करना](/hi/start/getting-started) का उपयोग करें।
अनुमति पुनर्प्राप्ति के लिए, [macOS अनुमतियां](/hi/platforms/mac/permissions) का उपयोग करें।

## Gateway मोड चुनें

| मोड   | इसका उपयोग तब करें जब                                                                             | विवरण पृष्ठ                                        |
| ------ | --------------------------------------------------------------------------------------- | -------------------------------------------------- |
| स्थानीय  | इस Mac को Gateway चलाना चाहिए और launchd के साथ उसे सक्रिय रखना चाहिए।                         | [macOS पर Gateway](/hi/platforms/mac/bundled-gateway) |
| दूरस्थ | कोई दूसरा होस्ट Gateway चलाता है और इस Mac को उसे SSH, LAN, या Tailnet पर नियंत्रित करना चाहिए। | [दूरस्थ नियंत्रण](/hi/platforms/mac/remote)            |

स्थानीय मोड के लिए इंस्टॉल किया हुआ `openclaw` CLI आवश्यक है। ऐप इसे इंस्टॉल कर सकता है, या आप
[macOS पर Gateway](/hi/platforms/mac/bundled-gateway) का पालन कर सकते हैं।

## ऐप किन चीज़ों का स्वामी है

- मेनू बार स्थिति, सूचनाएं, स्वास्थ्य, और WebChat।
- स्क्रीन, माइक्रोफ़ोन, स्पीच, ऑटोमेशन, और एक्सेसिबिलिटी के लिए macOS अनुमति प्रॉम्प्ट।
- स्थानीय Node टूल जैसे Canvas, कैमरा/स्क्रीन कैप्चर, सूचनाएं, और `system.run`।
- Mac-होस्टेड कमांड के लिए exec स्वीकृति प्रॉम्प्ट।
- दूरस्थ-मोड SSH टनल या सीधे Gateway कनेक्शन।

ऐप OpenClaw Gateway या सामान्य CLI दस्तावेज़ों को प्रतिस्थापित **नहीं** करता। मुख्य
Gateway कॉन्फ़िगरेशन, प्रदाता, Plugin, चैनल, टूल, और सुरक्षा
अपने अलग दस्तावेज़ों में रहते हैं।

## macOS विवरण पृष्ठ

| कार्य                                     | पढ़ें                                                                                        |
| ---------------------------------------- | ------------------------------------------------------------------------------------------- |
| CLI/Gateway सेवा इंस्टॉल या डीबग करें | [macOS पर Gateway](/hi/platforms/mac/bundled-gateway)                                          |
| स्थिति को क्लाउड-सिंक फ़ोल्डरों से बाहर रखें   | [macOS पर Gateway](/hi/platforms/mac/bundled-gateway#state-directory-on-macos)                 |
| ऐप डिस्कवरी और कनेक्टिविटी डीबग करें     | [macOS पर Gateway](/hi/platforms/mac/bundled-gateway#debug-app-connectivity)                   |
| launchd व्यवहार समझें              | [Gateway जीवनचक्र](/hi/platforms/mac/child-process)                                           |
| अनुमतियां या signing/TCC समस्याएं ठीक करें    | [macOS अनुमतियां](/hi/platforms/mac/permissions)                                             |
| दूरस्थ Gateway से कनेक्ट करें              | [दूरस्थ नियंत्रण](/hi/platforms/mac/remote)                                                     |
| मेनू बार स्थिति और स्वास्थ्य जांच पढ़ें   | [मेनू बार](/hi/platforms/mac/menu-bar), [स्वास्थ्य जांच](/hi/platforms/mac/health)                 |
| एम्बेडेड चैट UI का उपयोग करें                 | [WebChat](/hi/platforms/mac/webchat)                                                           |
| वॉइस वेक या push-to-talk का उपयोग करें           | [वॉइस वेक](/hi/platforms/mac/voicewake)                                                      |
| Canvas और Canvas डीप लिंक का उपयोग करें         | [Canvas](/hi/platforms/mac/canvas)                                                             |
| UI ऑटोमेशन के लिए PeekabooBridge होस्ट करें    | [Peekaboo ब्रिज](/hi/platforms/mac/peekaboo)                                                  |
| कमांड स्वीकृतियां कॉन्फ़िगर करें              | [Exec स्वीकृतियां](/hi/tools/exec-approvals), [उन्नत विवरण](/hi/tools/exec-approvals-advanced) |
| Mac Node कमांड और ऐप IPC निरीक्षण करें    | [macOS IPC](/hi/platforms/mac/xpc)                                                             |
| लॉग कैप्चर करें                             | [macOS लॉगिंग](/hi/platforms/mac/logging)                                                     |
| स्रोत से बिल्ड करें                        | [macOS डेवलपमेंट सेटअप](/hi/platforms/mac/dev-setup)                                                 |

## संबंधित

- [प्लेटफ़ॉर्म](/hi/platforms)
- [शुरू करना](/hi/start/getting-started)
- [Gateway](/hi/gateway)
- [Exec स्वीकृतियां](/hi/tools/exec-approvals)
