---
read_when:
    - İşletim sistemi desteği veya kurulum yolları aranıyor
    - Gateway’in nerede çalıştırılacağına karar verme
summary: Platform desteğine genel bakış (Gateway + eşlik eden uygulamalar)
title: Platformlar
x-i18n:
    generated_at: "2026-05-06T09:21:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: dd1fbd1af8b03a12014d91b2f300fb8ec65b9c42c38ada2b9ca089181140a75c
    source_path: platforms/index.md
    workflow: 16
---

OpenClaw çekirdeği TypeScript ile yazılmıştır. **Node önerilen çalışma zamanıdır**.
Bun, Gateway için önerilmez; WhatsApp ve Telegram kanallarında bilinen
sorunlar vardır. Ayrıntılar için [Bun (deneysel)](/tr/install/bun) bölümüne bakın.

macOS (menü çubuğu uygulaması) ve mobil düğümler (iOS/Android) için eşlikçi uygulamalar vardır. Windows ve
Linux eşlikçi uygulamaları planlanmaktadır, ancak Gateway bugün tam olarak desteklenmektedir.
Windows için yerel eşlikçi uygulamalar da planlanmaktadır; Gateway'in WSL2 üzerinden kullanılması önerilir.

## İşletim sisteminizi seçin

- macOS: [macOS](/tr/platforms/macos)
- iOS: [iOS](/tr/platforms/ios)
- Android: [Android](/tr/platforms/android)
- Windows: [Windows](/tr/platforms/windows)
- Linux: [Linux](/tr/platforms/linux)

## VPS ve barındırma

- VPS merkezi: [VPS barındırma](/tr/vps)
- Fly.io: [Fly.io](/tr/install/fly)
- Hetzner (Docker): [Hetzner](/tr/install/hetzner)
- GCP (Compute Engine): [GCP](/tr/install/gcp)
- Azure (Linux VM): [Azure](/tr/install/azure)
- exe.dev (VM + HTTPS proxy): [exe.dev](/tr/install/exe-dev)

## Yaygın bağlantılar

- Kurulum kılavuzu: [Başlarken](/tr/start/getting-started)
- Gateway runbook'u: [Gateway](/tr/gateway)
- Gateway yapılandırması: [Yapılandırma](/tr/gateway/configuration)
- Hizmet durumu: `openclaw gateway status`

## Gateway hizmet kurulumu (CLI)

Bunlardan birini kullanın (tümü desteklenir):

- Sihirbaz (önerilir): `openclaw onboard --install-daemon`
- Doğrudan: `openclaw gateway install`
- Yapılandırma akışı: `openclaw configure` → **Gateway hizmeti** seçeneğini belirleyin
- Onar/taşı: `openclaw doctor` (hizmeti kurmayı veya düzeltmeyi teklif eder)

Hizmet hedefi işletim sistemine bağlıdır:

- macOS: LaunchAgent (`ai.openclaw.gateway` veya `ai.openclaw.<profile>`; eski `com.openclaw.*`)
- Linux/WSL2: systemd kullanıcı hizmeti (`openclaw-gateway[-<profile>].service`)
- Yerel Windows: Scheduled Task (`OpenClaw Gateway` veya `OpenClaw Gateway (<profile>)`), görev oluşturma reddedilirse kullanıcı başına Startup klasörü oturum açma öğesi yedeğiyle

## İlgili

- [Kurulum genel bakışı](/tr/install)
- [macOS uygulaması](/tr/platforms/macos)
- [iOS uygulaması](/tr/platforms/ios)
