---
read_when:
    - OS desteği veya kurulum yollarını arıyorsunuz
    - Gateway'i nerede çalıştıracağınıza karar verme
summary: Platform desteği genel bakışı (Gateway + yardımcı uygulamalar)
title: Platformlar
x-i18n:
    generated_at: "2026-04-24T09:18:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3ebed9f219f3072ef760006eef47ca78f87169c40a6098c3585dfaf6169fc594
    source_path: platforms/index.md
    workflow: 15
---

OpenClaw çekirdeği TypeScript ile yazılmıştır. **Node önerilen çalışma zamanıdır**.
Gateway için Bun önerilmez — WhatsApp ve
Telegram kanallarında bilinen sorunlar vardır; ayrıntılar için bkz. [Bun (experimental)](/tr/install/bun).

Yardımcı uygulamalar macOS (menü çubuğu uygulaması) ve mobil Node'lar (iOS/Android) için vardır. Windows ve
Linux yardımcı uygulamaları planlanmaktadır, ancak Gateway bugün tamamen desteklenmektedir.
Windows için yerel yardımcı uygulamalar da planlanmaktadır; Gateway için WSL2 önerilir.

## OS seçin

- macOS: [macOS](/tr/platforms/macos)
- iOS: [iOS](/tr/platforms/ios)
- Android: [Android](/tr/platforms/android)
- Windows: [Windows](/tr/platforms/windows)
- Linux: [Linux](/tr/platforms/linux)

## VPS ve barındırma

- VPS merkezi: [VPS hosting](/tr/vps)
- Fly.io: [Fly.io](/tr/install/fly)
- Hetzner (Docker): [Hetzner](/tr/install/hetzner)
- GCP (Compute Engine): [GCP](/tr/install/gcp)
- Azure (Linux VM): [Azure](/tr/install/azure)
- exe.dev (VM + HTTPS proxy): [exe.dev](/tr/install/exe-dev)

## Yaygın bağlantılar

- Kurulum kılavuzu: [Getting Started](/tr/start/getting-started)
- Gateway runbook: [Gateway](/tr/gateway)
- Gateway yapılandırması: [Configuration](/tr/gateway/configuration)
- Servis durumu: `openclaw gateway status`

## Gateway servis kurulumu (CLI)

Şunlardan birini kullanın (hepsi desteklenir):

- Sihirbaz (önerilen): `openclaw onboard --install-daemon`
- Doğrudan: `openclaw gateway install`
- Yapılandırma akışı: `openclaw configure` → **Gateway service** seçin
- Onarım/geçiş: `openclaw doctor` (servisi kurmayı veya düzeltmeyi önerir)

Servis hedefi OS'e bağlıdır:

- macOS: LaunchAgent (`ai.openclaw.gateway` veya `ai.openclaw.<profile>`; eski `com.openclaw.*`)
- Linux/WSL2: systemd kullanıcı servisi (`openclaw-gateway[-<profile>].service`)
- Yerel Windows: Scheduled Task (`OpenClaw Gateway` veya `OpenClaw Gateway (<profile>)`), görev oluşturma reddedilirse kullanıcı başına Startup klasörü oturum açma öğesi fallback'i ile

## İlgili

- [Install overview](/tr/install)
- [macOS app](/tr/platforms/macos)
- [iOS app](/tr/platforms/ios)
