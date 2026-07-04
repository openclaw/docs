---
read_when:
    - macOS ऐप इंस्टॉल करना
    - macOS पर स्थानीय और रिमोट Gateway मोड के बीच चयन करना
    - macOS ऐप रिलीज़ डाउनलोड खोज रहा है
summary: OpenClaw macOS मेनू बार ऐप इंस्टॉल करें और उपयोग करें
title: macOS ऐप
x-i18n:
    generated_at: "2026-07-04T06:32:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0b693bb8ebced46bac173f47cdd90d1b69948ccf2388fda449c77a47ae2a4fb4
    source_path: platforms/macos.md
    workflow: 16
---

macOS ऐप OpenClaw **मेनू बार साथी** है। इसका उपयोग तब करें जब आपको
नेटिव ट्रे UI, macOS अनुमति प्रॉम्प्ट, सूचनाएं, WebChat, वॉइस इनपुट,
Canvas, या Mac-होस्टेड Node टूल जैसे `system.run` चाहिए हों।

अगर आपको केवल CLI और Gateway चाहिए, तो [शुरू करना](/hi/start/getting-started) से शुरू करें।

## डाउनलोड

macOS ऐप बिल्ड
[OpenClaw GitHub रिलीज़](https://github.com/openclaw/openclaw/releases) से डाउनलोड करें।
जब किसी रिलीज़ में macOS ऐप एसेट शामिल हों, तो इन्हें देखें:

- `OpenClaw-<version>.dmg` (पसंदीदा)
- `OpenClaw-<version>.zip`

कुछ रिलीज़ में केवल CLI, एविडेंस, या Windows एसेट शामिल होते हैं। अगर नवीनतम
रिलीज़ में macOS ऐप एसेट नहीं है, तो वह नवीनतम रिलीज़ उपयोग करें जिसमें यह हो, या
[macOS देव सेटअप](/hi/platforms/mac/dev-setup) के साथ सोर्स से ऐप बिल्ड करें।

## पहला रन

1. **OpenClaw.app** इंस्टॉल और लॉन्च करें।
2. स्थानीय Gateway के लिए **यह Mac** चुनें, या किसी रिमोट Gateway से कनेक्ट करें।
3. स्थानीय मोड के लिए, ऐप के अपना यूज़र-स्पेस runtime और Gateway इंस्टॉल करने तक प्रतीक्षा करें।
4. प्रोवाइडर सेटअप और macOS अनुमति चेकलिस्ट पूरी करें।
5. ऑनबोर्डिंग टेस्ट संदेश भेजें।

CLI/Gateway सेटअप पथ के लिए, [शुरू करना](/hi/start/getting-started) का उपयोग करें।
अनुमति रिकवरी के लिए, [macOS अनुमतियां](/hi/platforms/mac/permissions) का उपयोग करें।

## Gateway मोड चुनें

| मोड   | इसका उपयोग कब करें                                                                       | विवरण पृष्ठ                                        |
| ------ | --------------------------------------------------------------------------------------- | -------------------------------------------------- |
| स्थानीय  | यह Mac Gateway चलाए और उसे launchd के साथ चालू रखे।                         | [macOS पर Gateway](/hi/platforms/mac/bundled-gateway) |
| रिमोट | कोई दूसरा होस्ट Gateway चलाता है और यह Mac उसे SSH, LAN, या Tailnet पर नियंत्रित करे। | [रिमोट नियंत्रण](/hi/platforms/mac/remote)            |

स्थानीय मोड के लिए इंस्टॉल किया हुआ `openclaw` CLI आवश्यक है। नए Mac पर, ऐप
Gateway विज़ार्ड शुरू करने से पहले मिलान वाला CLI और runtime अपने-आप इंस्टॉल करता है।
मैनुअल रिकवरी के लिए [macOS पर Gateway](/hi/platforms/mac/bundled-gateway) देखें।

## ऐप किन चीज़ों का स्वामी है

- मेनू बार स्थिति, सूचनाएं, हेल्थ, और WebChat।
- स्क्रीन, माइक्रोफोन, स्पीच, ऑटोमेशन, और एक्सेसिबिलिटी के लिए macOS अनुमति प्रॉम्प्ट।
- Canvas, कैमरा/स्क्रीन कैप्चर, सूचनाएं, और `system.run` जैसे स्थानीय Node टूल।
- Mac-होस्टेड कमांड के लिए Exec अनुमोदन प्रॉम्प्ट।
- रिमोट-मोड SSH टनल या सीधे Gateway कनेक्शन।

ऐप OpenClaw Gateway या सामान्य CLI डॉक्स को **प्रतिस्थापित नहीं** करता। मुख्य
Gateway कॉन्फ़िगरेशन, प्रोवाइडर, Plugin, चैनल, टूल, और सुरक्षा अपने-अपने
डॉक्स में हैं।

## macOS विवरण पृष्ठ

| कार्य                                     | पढ़ें                                                                                        |
| ---------------------------------------- | ------------------------------------------------------------------------------------------- |
| CLI/Gateway सेवा इंस्टॉल या डीबग करें | [macOS पर Gateway](/hi/platforms/mac/bundled-gateway)                                          |
| स्टेट को क्लाउड-सिंक किए गए फ़ोल्डर से बाहर रखें   | [macOS पर Gateway](/hi/platforms/mac/bundled-gateway#state-directory-on-macos)                 |
| ऐप डिस्कवरी और कनेक्टिविटी डीबग करें     | [macOS पर Gateway](/hi/platforms/mac/bundled-gateway#debug-app-connectivity)                   |
| launchd व्यवहार समझें              | [Gateway लाइफ़साइकल](/hi/platforms/mac/child-process)                                           |
| अनुमतियां या साइनिंग/TCC समस्याएं ठीक करें    | [macOS अनुमतियां](/hi/platforms/mac/permissions)                                             |
| रिमोट Gateway से कनेक्ट करें              | [रिमोट नियंत्रण](/hi/platforms/mac/remote)                                                     |
| मेनू बार स्थिति और हेल्थ जांच पढ़ें   | [मेनू बार](/hi/platforms/mac/menu-bar), [हेल्थ जांच](/hi/platforms/mac/health)                 |
| एम्बेडेड चैट UI का उपयोग करें                 | [WebChat](/hi/platforms/mac/webchat)                                                           |
| वॉइस वेक या पुश-टू-टॉक का उपयोग करें           | [वॉइस वेक](/hi/platforms/mac/voicewake)                                                      |
| Canvas और Canvas डीप लिंक का उपयोग करें         | [Canvas](/hi/platforms/mac/canvas)                                                             |
| UI ऑटोमेशन के लिए PeekabooBridge होस्ट करें    | [Peekaboo ब्रिज](/hi/platforms/mac/peekaboo)                                                  |
| कमांड अनुमोदन कॉन्फ़िगर करें              | [Exec अनुमोदन](/hi/tools/exec-approvals), [उन्नत विवरण](/hi/tools/exec-approvals-advanced) |
| Mac Node कमांड और ऐप IPC निरीक्षण करें    | [macOS IPC](/hi/platforms/mac/xpc)                                                             |
| लॉग कैप्चर करें                             | [macOS लॉगिंग](/hi/platforms/mac/logging)                                                     |
| सोर्स से बिल्ड करें                        | [macOS देव सेटअप](/hi/platforms/mac/dev-setup)                                                 |

## संबंधित

- [प्लैटफ़ॉर्म](/hi/platforms)
- [शुरू करना](/hi/start/getting-started)
- [Gateway](/hi/gateway)
- [Exec अनुमोदन](/hi/tools/exec-approvals)
