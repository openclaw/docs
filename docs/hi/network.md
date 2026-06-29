---
read_when:
    - आपको नेटवर्क आर्किटेक्चर + सुरक्षा अवलोकन की आवश्यकता है
    - आप स्थानीय बनाम tailnet पहुंच या पेयरिंग डिबग कर रहे हैं
    - आपको नेटवर्किंग दस्तावेज़ों की आधिकारिक सूची चाहिए
summary: 'नेटवर्क हब: Gateway सतहें, पेयरिंग, खोज, और सुरक्षा'
title: नेटवर्क
x-i18n:
    generated_at: "2026-06-28T23:24:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7b0ff6c4ee46005aeac1612ea40f1ce3d5824aa507d0842788dbf4bffbaccfcc
    source_path: network.md
    workflow: 16
---

यह हब localhost, LAN, और tailnet में OpenClaw कैसे कनेक्ट, पेयर, और डिवाइस सुरक्षित करता है, इसके मुख्य दस्तावेज़ों से लिंक करता है।

## मुख्य मॉडल

अधिकांश ऑपरेशन Gateway (`openclaw gateway`) से होकर गुजरते हैं, जो एक अकेली लंबे समय तक चलने वाली प्रक्रिया है और चैनल कनेक्शन तथा WebSocket कंट्रोल प्लेन का स्वामी होता है।

- **पहले loopback**: Gateway WS डिफ़ॉल्ट रूप से `ws://127.0.0.1:18789` पर होता है।
  गैर-loopback बाइंड के लिए मान्य Gateway auth पथ चाहिए: shared-secret
  token/password auth, या सही तरह से कॉन्फ़िगर किया गया गैर-loopback
  `trusted-proxy` deployment।
- **प्रति होस्ट एक Gateway** अनुशंसित है। अलगाव के लिए, अलग-थलग प्रोफ़ाइलों और पोर्ट्स के साथ कई Gateway चलाएँ ([कई Gateway](/hi/gateway/multiple-gateways)).
- **Canvas होस्ट** Gateway वाले ही पोर्ट पर परोसा जाता है (`/__openclaw__/canvas/`, `/__openclaw__/a2ui/`), और loopback से आगे बाइंड होने पर Gateway auth से सुरक्षित रहता है।
- **रिमोट एक्सेस** आम तौर पर SSH tunnel या Tailscale VPN होता है ([रिमोट एक्सेस](/hi/gateway/remote))।

मुख्य संदर्भ:

- [Gateway आर्किटेक्चर](/hi/concepts/architecture)
- [Gateway प्रोटोकॉल](/hi/gateway/protocol)
- [Gateway रनबुक](/hi/gateway)
- [वेब सतहें + बाइंड मोड](/hi/web)

## पेयरिंग + पहचान

- [पेयरिंग अवलोकन (DM + नोड्स)](/hi/channels/pairing)
- [Gateway-स्वामित्व वाली नोड पेयरिंग](/hi/gateway/pairing)
- [डिवाइस CLI (पेयरिंग + टोकन रोटेशन)](/hi/cli/devices)
- [पेयरिंग CLI (DM अनुमोदन)](/hi/cli/pairing)

स्थानीय भरोसा:

- सीधे local loopback कनेक्ट्स पेयरिंग के लिए स्वतः-अनुमोदित हो सकते हैं ताकि
  same-host UX सहज रहे।
- OpenClaw के पास trusted shared-secret helper flows के लिए एक संकीर्ण backend/container-local self-connect पथ भी है।
- Tailnet और LAN क्लाइंट्स, जिनमें same-host tailnet binds भी शामिल हैं, को फिर भी
  स्पष्ट पेयरिंग अनुमोदन चाहिए।

## Discovery + ट्रांसपोर्ट

- [Discovery और ट्रांसपोर्ट](/hi/gateway/discovery)
- [Bonjour / mDNS](/hi/gateway/bonjour)
- [रिमोट एक्सेस (SSH)](/hi/gateway/remote)
- [Tailscale](/hi/gateway/tailscale)

## नोड्स + ट्रांसपोर्ट

- [नोड्स अवलोकन](/hi/nodes)
- [Bridge प्रोटोकॉल (legacy नोड्स, ऐतिहासिक)](/hi/gateway/bridge-protocol)
- [नोड रनबुक: iOS](/hi/platforms/ios)
- [नोड रनबुक: Android](/hi/platforms/android)

## सुरक्षा

- [सुरक्षा अवलोकन](/hi/gateway/security)
- [Gateway कॉन्फ़िग संदर्भ](/hi/gateway/configuration)
- [समस्या निवारण](/hi/gateway/troubleshooting)
- [Doctor](/hi/gateway/doctor)

## संबंधित

- [Gateway रनबुक](/hi/gateway)
- [रिमोट एक्सेस](/hi/gateway/remote)
