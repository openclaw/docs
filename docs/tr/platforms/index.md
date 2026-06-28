---
read_when:
    - İşletim sistemi desteği veya kurulum yolları aranıyor
    - Gateway'in nerede çalıştırılacağına karar verme
summary: Platform desteğine genel bakış (Gateway + yardımcı uygulamalar)
title: Platformlar
x-i18n:
    generated_at: "2026-06-28T00:48:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4d6edfaf9c4b1f1bc824d4bddf8263244902676dd5df98da556a8a5f35afe566
    source_path: platforms/index.md
    workflow: 16
---

OpenClaw çekirdeği TypeScript ile yazılmıştır. **Önerilen çalışma zamanı Node'dur**.
Bun, Gateway için önerilmez — WhatsApp ve Telegram kanallarında bilinen
sorunlar vardır; ayrıntılar için [Bun (deneysel)](/tr/install/bun) bölümüne bakın.

Windows Hub, macOS (menü çubuğu uygulaması) ve mobil düğümler
(iOS/Android) için yardımcı uygulamalar mevcuttur. Linux yardımcı uygulamaları
planlanmaktadır, ancak Gateway bugün tamamen desteklenmektedir. Windows'ta
masaüstü uygulaması için Windows Hub'ı, terminal öncelikli kullanım için yerel
PowerShell kurulumunu veya Linux ile en uyumlu Gateway çalışma zamanı için
WSL2'yi seçin.

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
- EasyRunner (Podman + Caddy): [EasyRunner](/tr/platforms/easyrunner)

## Yaygın bağlantılar

- Kurulum kılavuzu: [Başlarken](/tr/start/getting-started)
- Windows Hub: [Windows](/tr/platforms/windows)
- Gateway operasyon rehberi: [Gateway](/tr/gateway)
- Gateway yapılandırması: [Yapılandırma](/tr/gateway/configuration)
- Hizmet durumu: `openclaw gateway status`

## Gateway hizmet kurulumu (CLI)

Bunlardan birini kullanın (tümü desteklenir):

- Sihirbaz (önerilen): `openclaw onboard --install-daemon`
- Doğrudan: `openclaw gateway install`
- Yapılandırma akışı: `openclaw configure` → **Gateway hizmeti** seçeneğini seçin
- Onar/geçir: `openclaw doctor` (hizmeti kurmayı veya düzeltmeyi teklif eder)

Hizmet hedefi işletim sistemine bağlıdır:

- macOS: LaunchAgent (`ai.openclaw.gateway` veya `ai.openclaw.<profile>`; eski `com.openclaw.*`)
- Linux/WSL2: systemd kullanıcı hizmeti (`openclaw-gateway[-<profile>].service`)
- Yerel Windows: Scheduled Task (`OpenClaw Gateway` veya `OpenClaw Gateway (<profile>)`), görev oluşturma reddedilirse kullanıcı başına Startup klasörü oturum açma öğesi yedeğiyle

## İlgili

- [Kurulum genel bakışı](/tr/install)
- [Windows Hub](/tr/platforms/windows)
- [macOS uygulaması](/tr/platforms/macos)
- [iOS uygulaması](/tr/platforms/ios)
