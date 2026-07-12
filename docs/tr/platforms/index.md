---
read_when:
    - İşletim sistemi desteği veya kurulum yollarını arama
    - Gateway'in nerede çalıştırılacağına karar verme
summary: Platform desteğine genel bakış (Gateway + yardımcı uygulamalar)
title: Platformlar
x-i18n:
    generated_at: "2026-07-12T11:55:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6c91bf7fd41bf5433b9f1efb768a44dcf5fa55917cfc45f463688d00f23e725d
    source_path: platforms/index.md
    workflow: 16
---

OpenClaw çekirdeği TypeScript ile yazılmıştır. **Önerilen çalışma zamanı Node'dur**.
WhatsApp ve Telegram kanallarında bilinen sorunlar nedeniyle Bun, Gateway için
önerilmez; ayrıntılar için [Bun (deneysel)](/tr/install/bun) sayfasına bakın.

Windows Hub, macOS (menü çubuğu uygulaması) ve mobil Node'lar
(iOS/Android) için yardımcı uygulamalar mevcuttur. Linux yardımcı uygulamaları planlanmaktadır, ancak Gateway
şu anda tamamen desteklenmektedir. Windows'ta masaüstü uygulaması için Windows Hub'ı, öncelikle terminal
kullanımı için yerel PowerShell kurulumunu veya Linux ile en
uyumlu Gateway çalışma zamanı için WSL2'yi seçin.

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
- Azure (Linux sanal makinesi): [Azure](/tr/install/azure)
- exe.dev (sanal makine + HTTPS proxy): [exe.dev](/tr/install/exe-dev)
- EasyRunner (Podman + Caddy): [EasyRunner](/tr/platforms/easyrunner)

## Yaygın bağlantılar

- Kurulum kılavuzu: [Başlarken](/tr/start/getting-started)
- Windows Hub: [Windows](/tr/platforms/windows)
- Gateway işletim kılavuzu: [Gateway](/tr/gateway)
- Gateway yapılandırması: [Yapılandırma](/tr/gateway/configuration)
- Hizmet durumu: `openclaw gateway status`

## Gateway hizmeti kurulumu (CLI)

Şunlardan birini kullanın (tümü desteklenir):

- Sihirbaz (önerilen): `openclaw onboard --install-daemon`
- Doğrudan: `openclaw gateway install`
- Yapılandırma akışı: `openclaw configure` → **Gateway hizmeti** seçeneğini belirleyin
- Onarım/geçiş: `openclaw doctor` (hizmeti kurmayı veya düzeltmeyi önerir)

Hizmet hedefi işletim sistemine bağlıdır:

- macOS: LaunchAgent (`ai.openclaw.gateway` veya adlandırılmış bir profil için `ai.openclaw.<profile>`)
- Linux/WSL2: systemd kullanıcı hizmeti (`openclaw-gateway[-<profile>].service`)
- Yerel Windows: Zamanlanmış Görev (`OpenClaw Gateway` veya `OpenClaw Gateway (<profile>)`); görev oluşturma reddedilirse kullanıcı başına Başlangıç klasörü oturum açma öğesi yedeği kullanılır

## İlgili

- [Kuruluma genel bakış](/tr/install)
- [Windows Hub](/tr/platforms/windows)
- [macOS uygulaması](/tr/platforms/macos)
- [iOS uygulaması](/tr/platforms/ios)
