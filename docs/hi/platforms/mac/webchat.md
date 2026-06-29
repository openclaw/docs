---
read_when:
    - mac WebChat दृश्य या loopback पोर्ट डीबग करना
summary: Mac ऐप Gateway WebChat को कैसे एम्बेड करता है और इसे कैसे डिबग करें
title: वेबचैट (macOS)
x-i18n:
    generated_at: "2026-06-28T23:29:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 50680e099181421505e25cecab2ba331fdaf9839d07fef482ff04976b0fc583e
    source_path: platforms/mac/webchat.md
    workflow: 16
---

macOS मेनू बार ऐप WebChat UI को मूल SwiftUI व्यू के रूप में एम्बेड करता है। यह
Gateway से कनेक्ट होता है और चुने गए एजेंट के लिए डिफ़ॉल्ट रूप से **मुख्य सत्र**
का उपयोग करता है (अन्य सत्रों के लिए सत्र स्विचर के साथ)।

- **स्थानीय मोड**: सीधे स्थानीय Gateway WebSocket से कनेक्ट होता है।
- **दूरस्थ मोड**: Gateway नियंत्रण पोर्ट को SSH पर फ़ॉरवर्ड करता है और उस
  टनल को डेटा प्लेन के रूप में उपयोग करता है।

## लॉन्च और डीबगिंग

- मैनुअल: Lobster मेनू → "चैट खोलें"।
- परीक्षण के लिए अपने आप खोलना:

  ```bash
  dist/OpenClaw.app/Contents/MacOS/OpenClaw --webchat
  ```

- लॉग: `./scripts/clawlog.sh` (सब-सिस्टम `ai.openclaw`, श्रेणी `WebChatSwiftUI`)।

## यह कैसे जुड़ा है

- डेटा प्लेन: Gateway WS मेथड `chat.history`, `chat.send`, `chat.abort`,
  `chat.inject` और इवेंट `chat`, `agent`, `presence`, `tick`, `health`।
- `chat.history` डिस्प्ले-सामान्यीकृत ट्रांसक्रिप्ट पंक्तियाँ लौटाता है: इनलाइन निर्देश
  टैग दृश्य टेक्स्ट से हटा दिए जाते हैं, सादा-टेक्स्ट टूल-कॉल XML पेलोड
  (जिसमें `<tool_call>...</tool_call>`,
  `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
  `<function_calls>...</function_calls>`, और काटे गए टूल-कॉल ब्लॉक शामिल हैं) और
  लीक हुए ASCII/पूर्ण-चौड़ाई मॉडल नियंत्रण टोकन हटा दिए जाते हैं, ठीक
  `NO_REPLY` / `no_reply` जैसी केवल साइलेंट-टोकन वाली असिस्टेंट पंक्तियाँ
  छोड़ दी जाती हैं, और बहुत बड़ी पंक्तियों को प्लेसहोल्डर से बदला जा सकता है।
- सत्र: डिफ़ॉल्ट रूप से प्राथमिक सत्र (`main`, या स्कोप वैश्विक होने पर `global`)।
  UI सत्रों के बीच स्विच कर सकता है।
- ऑनबोर्डिंग पहली बार के सेटअप को अलग रखने के लिए एक समर्पित सत्र का उपयोग करती है।

## सुरक्षा सतह

- दूरस्थ मोड केवल Gateway WebSocket नियंत्रण पोर्ट को SSH पर फ़ॉरवर्ड करता है।

## ज्ञात सीमाएँ

- UI चैट सत्रों के लिए अनुकूलित है (पूर्ण ब्राउज़र सैंडबॉक्स नहीं)।

## संबंधित

- [WebChat](/hi/web/webchat)
- [macOS ऐप](/hi/platforms/macos)
