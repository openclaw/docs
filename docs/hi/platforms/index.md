---
read_when:
    - OS समर्थन या इंस्टॉल पथ खोज रहे हैं
    - Gateway कहाँ चलाना है यह तय करना
summary: प्लैटफ़ॉर्म समर्थन अवलोकन (Gateway + सहायक ऐप्स)
title: प्लेटफ़ॉर्म
x-i18n:
    generated_at: "2026-06-28T23:27:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4d6edfaf9c4b1f1bc824d4bddf8263244902676dd5df98da556a8a5f35afe566
    source_path: platforms/index.md
    workflow: 16
---

OpenClaw कोर TypeScript में लिखा गया है। **Node अनुशंसित runtime है**।
Gateway के लिए Bun की अनुशंसा नहीं की जाती — WhatsApp और
Telegram channels के साथ ज्ञात समस्याएँ हैं; विवरण के लिए [Bun (प्रायोगिक)](/hi/install/bun) देखें।

Windows Hub, macOS (मेनू बार ऐप), और mobile nodes
(iOS/Android) के लिए companion apps उपलब्ध हैं। Linux companion apps की योजना है, लेकिन Gateway आज पूरी तरह
समर्थित है। Windows पर, desktop app के लिए Windows Hub, terminal-first उपयोग के लिए native
PowerShell install, या सबसे अधिक Linux-संगत Gateway runtime के लिए WSL2 चुनें।

## अपना OS चुनें

- macOS: [macOS](/hi/platforms/macos)
- iOS: [iOS](/hi/platforms/ios)
- Android: [Android](/hi/platforms/android)
- Windows: [Windows](/hi/platforms/windows)
- Linux: [Linux](/hi/platforms/linux)

## VPS और hosting

- VPS hub: [VPS hosting](/hi/vps)
- Fly.io: [Fly.io](/hi/install/fly)
- Hetzner (Docker): [Hetzner](/hi/install/hetzner)
- GCP (Compute Engine): [GCP](/hi/install/gcp)
- Azure (Linux VM): [Azure](/hi/install/azure)
- exe.dev (VM + HTTPS proxy): [exe.dev](/hi/install/exe-dev)
- EasyRunner (Podman + Caddy): [EasyRunner](/hi/platforms/easyrunner)

## सामान्य links

- Install guide: [शुरू करें](/hi/start/getting-started)
- Windows Hub: [Windows](/hi/platforms/windows)
- Gateway runbook: [Gateway](/hi/gateway)
- Gateway configuration: [Configuration](/hi/gateway/configuration)
- Service status: `openclaw gateway status`

## Gateway service install (CLI)

इनमें से किसी एक का उपयोग करें (सभी समर्थित हैं):

- Wizard (अनुशंसित): `openclaw onboard --install-daemon`
- Direct: `openclaw gateway install`
- Configure flow: `openclaw configure` → **Gateway service** चुनें
- Repair/migrate: `openclaw doctor` (service install या fix करने का प्रस्ताव देता है)

service target OS पर निर्भर करता है:

- macOS: LaunchAgent (`ai.openclaw.gateway` या `ai.openclaw.<profile>`; legacy `com.openclaw.*`)
- Linux/WSL2: systemd user service (`openclaw-gateway[-<profile>].service`)
- Native Windows: Scheduled Task (`OpenClaw Gateway` या `OpenClaw Gateway (<profile>)`), task creation अस्वीकृत होने पर प्रति-user Startup-folder login item fallback के साथ

## संबंधित

- [Install overview](/hi/install)
- [Windows Hub](/hi/platforms/windows)
- [macOS app](/hi/platforms/macos)
- [iOS app](/hi/platforms/ios)
