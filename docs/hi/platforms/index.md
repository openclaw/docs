---
read_when:
    - OS समर्थन या इंस्टॉल पाथ खोज रहे हैं
    - Gateway को कहाँ चलाना है, यह तय करना
summary: प्लेटफ़ॉर्म समर्थन का अवलोकन (Gateway + सहायक ऐप्स)
title: प्लेटफ़ॉर्म
x-i18n:
    generated_at: "2026-07-19T09:00:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 40494f8567c0159d9b6024c174cf0f316a45b46c633a578efaf2388f679a88f2
    source_path: platforms/index.md
    workflow: 16
---

OpenClaw कोर TypeScript में लिखा गया है। **Node आवश्यक रनटाइम है** क्योंकि
कैनोनिकल स्टेट स्टोर `node:sqlite` का उपयोग करता है। Bun निर्भरता
इंस्टॉलेशन और पैकेज स्क्रिप्ट के लिए उपलब्ध है; [Bun](/hi/install/bun) देखें।

Windows Hub, macOS (मेनू बार ऐप), और मोबाइल नोड्स
(iOS/Android) के लिए सहयोगी ऐप उपलब्ध हैं। Linux सहयोगी ऐप की योजना है, लेकिन Gateway आज
पूरी तरह समर्थित है। Windows पर, डेस्कटॉप ऐप के लिए Windows Hub, मुख्यतः
टर्मिनल उपयोग के लिए नेटिव PowerShell इंस्टॉलेशन, या सर्वाधिक
Linux-संगत Gateway रनटाइम के लिए WSL2 चुनें।

## अपना OS चुनें

- macOS: [macOS](/hi/platforms/macos)
- iOS: [iOS](/hi/platforms/ios)
- Android: [Android](/hi/platforms/android)
- Windows: [Windows](/hi/platforms/windows)
- Linux: [Linux](/hi/platforms/linux)

## VPS और होस्टिंग

- VPS हब: [VPS होस्टिंग](/hi/vps)
- Fly.io: [Fly.io](/hi/install/fly)
- Hetzner (Docker): [Hetzner](/hi/install/hetzner)
- GCP (Compute Engine): [GCP](/hi/install/gcp)
- Azure (Linux VM): [Azure](/hi/install/azure)
- exe.dev (VM + HTTPS प्रॉक्सी): [exe.dev](/hi/install/exe-dev)
- EasyRunner (Podman + Caddy): [EasyRunner](/hi/platforms/easyrunner)

## सामान्य लिंक

- इंस्टॉलेशन गाइड: [शुरू करना](/hi/start/getting-started)
- Windows Hub: [Windows](/hi/platforms/windows)
- Gateway रनबुक: [Gateway](/hi/gateway)
- Gateway कॉन्फ़िगरेशन: [कॉन्फ़िगरेशन](/hi/gateway/configuration)
- सेवा की स्थिति: `openclaw gateway status`

## Gateway सेवा इंस्टॉलेशन (CLI)

इनमें से किसी एक का उपयोग करें (सभी समर्थित हैं):

- विज़ार्ड (अनुशंसित): `openclaw onboard --install-daemon`
- प्रत्यक्ष: `openclaw gateway install`
- कॉन्फ़िगरेशन प्रवाह: `openclaw configure` → **Gateway service** चुनें
- मरम्मत/माइग्रेशन: `openclaw doctor` (सेवा इंस्टॉल या ठीक करने का विकल्प देता है)

सेवा का लक्ष्य OS पर निर्भर करता है:

- macOS: LaunchAgent (`ai.openclaw.gateway`, या नामित प्रोफ़ाइल के लिए `ai.openclaw.<profile>`)
- Linux/WSL2: systemd उपयोगकर्ता सेवा (`openclaw-gateway[-<profile>].service`)
- नेटिव Windows: Scheduled Task (`OpenClaw Gateway` या `OpenClaw Gateway (<profile>)`), यदि टास्क बनाने की अनुमति न मिले तो प्रति-उपयोगकर्ता Startup फ़ोल्डर लॉगिन आइटम फ़ॉलबैक के साथ

## संबंधित

- [इंस्टॉलेशन का अवलोकन](/hi/install)
- [Windows Hub](/hi/platforms/windows)
- [macOS ऐप](/hi/platforms/macos)
- [iOS ऐप](/hi/platforms/ios)
