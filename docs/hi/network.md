---
read_when:
    - आपको नेटवर्क आर्किटेक्चर + सुरक्षा अवलोकन की आवश्यकता है
    - आप स्थानीय बनाम tailnet पहुँच या पेयरिंग को डीबग कर रहे हैं
    - आप नेटवर्किंग दस्तावेज़ों की प्रामाणिक सूची चाहते हैं
summary: 'नेटवर्क हब: Gateway इंटरफ़ेस, पेयरिंग, खोज और सुरक्षा'
title: नेटवर्क
x-i18n:
    generated_at: "2026-07-16T15:36:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9751bb0fe71009455b243b109ef7ef4eda08d58f940f7dcef305800a5ed89586
    source_path: network.md
    workflow: 16
---

यह हब localhost, LAN और tailnet पर OpenClaw द्वारा डिवाइसों को कनेक्ट, पेयर और सुरक्षित करने के तरीके से संबंधित मुख्य दस्तावेज़ों के लिंक प्रदान करता है।

## मुख्य मॉडल

अधिकांश संचालन Gateway (`openclaw gateway`) से होकर गुजरते हैं, जो एकल दीर्घकालिक प्रक्रिया है और चैनल कनेक्शन तथा WebSocket नियंत्रण प्लेन का स्वामित्व रखती है।

- **पहले लूपबैक**: Gateway WS डिफ़ॉल्ट रूप से `ws://127.0.0.1:18789` पर सेट होता है।
  वैध Gateway प्रमाणीकरण पथ के बिना गैर-लूपबैक बाइंड प्रारंभ होने से इनकार करते हैं:
  साझा-गुप्त टोकन/पासवर्ड प्रमाणीकरण या सही ढंग से कॉन्फ़िगर किया गया गैर-लूपबैक
  `trusted-proxy` परिनियोजन।
- **प्रति होस्ट एक Gateway** की अनुशंसा की जाती है। पृथक्करण के लिए, अलग-अलग प्रोफ़ाइल और पोर्ट के साथ कई Gateway चलाएँ ([एकाधिक Gateway](/hi/gateway/multiple-gateways))।
- **Canvas होस्ट** को Gateway के समान पोर्ट (`/__openclaw__/canvas/`, `/__openclaw__/a2ui/`) पर सर्व किया जाता है और लूपबैक से परे बाइंड किए जाने पर यह Gateway प्रमाणीकरण से सुरक्षित रहता है।
- **दूरस्थ पहुँच** आमतौर पर SSH टनल या Tailscale VPN होती है ([दूरस्थ पहुँच](/hi/gateway/remote))।

मुख्य संदर्भ:

- [Gateway आर्किटेक्चर](/hi/concepts/architecture)
- [Gateway प्रोटोकॉल](/hi/gateway/protocol)
- [Gateway रनबुक](/hi/gateway)
- [वेब सतहें + बाइंड मोड](/hi/web)

## पेयरिंग + पहचान

- [पेयरिंग का अवलोकन (DM + नोड)](/hi/channels/pairing)
- [Gateway के स्वामित्व वाली नोड पेयरिंग](/hi/gateway/pairing)
- [डिवाइस CLI (पेयरिंग + टोकन रोटेशन)](/hi/cli/devices)
- [पेयरिंग CLI (DM अनुमोदन)](/hi/cli/pairing)

स्थानीय विश्वास:

- सीधे स्थानीय लूपबैक कनेक्शन (बिना फ़ॉरवर्ड किए गए/प्रॉक्सी हेडर के) को
  समान-होस्ट उपयोगकर्ता अनुभव सुचारु रखने के लिए पेयरिंग हेतु स्वतः अनुमोदित किया जा सकता है।
- OpenClaw में विश्वसनीय साझा-गुप्त सहायक प्रवाहों के लिए एक सीमित
  बैकएंड/कंटेनर-स्थानीय स्व-कनेक्शन पथ भी है।
- समान-होस्ट tailnet बाइंड सहित tailnet और LAN क्लाइंट को अब भी
  स्पष्ट पेयरिंग अनुमोदन की आवश्यकता होती है।

## खोज + ट्रांसपोर्ट

- [खोज और ट्रांसपोर्ट](/hi/gateway/discovery)
- [Bonjour / mDNS](/hi/gateway/bonjour)
- [दूरस्थ पहुँच (SSH)](/hi/gateway/remote)
- [Tailscale](/hi/gateway/tailscale)

## नोड + ट्रांसपोर्ट

- [नोड का अवलोकन](/hi/nodes)
- [ब्रिज प्रोटोकॉल (लीगेसी नोड, ऐतिहासिक)](/hi/gateway/bridge-protocol)
- [नोड रनबुक: iOS](/hi/platforms/ios)
- [नोड रनबुक: Android](/hi/platforms/android)

## सुरक्षा

- [सुरक्षा का अवलोकन](/hi/gateway/security)
- [Gateway कॉन्फ़िगरेशन संदर्भ](/hi/gateway/configuration)
- [समस्या निवारण](/hi/gateway/troubleshooting)
- [Doctor](/hi/gateway/doctor)

## संबंधित

- [Gateway रनबुक](/hi/gateway)
- [दूरस्थ पहुँच](/hi/gateway/remote)
