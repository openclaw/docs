---
read_when:
    - İşletim sistemi desteği veya kurulum yolları aranıyor
    - Gateway'in nerede çalıştırılacağına karar verme
summary: Platform desteğine genel bakış (Gateway + yardımcı uygulamalar)
title: Platformlar
x-i18n:
    generated_at: "2026-07-16T17:21:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 40494f8567c0159d9b6024c174cf0f316a45b46c633a578efaf2388f679a88f2
    source_path: platforms/index.md
    workflow: 16
---

OpenClaw çekirdeği TypeScript ile yazılmıştır. **Node gerekli çalışma zamanıdır**, çünkü
standart durum deposu `node:sqlite` kullanır. Bun, bağımlılıkların kurulumu
ve paket betikleri için kullanılabilir olmaya devam eder; bkz. [Bun](/tr/install/bun).

Windows Hub, macOS (menü çubuğu uygulaması) ve mobil Node'lar
(iOS/Android) için yardımcı uygulamalar mevcuttur. Linux yardımcı uygulamaları planlanmaktadır, ancak Gateway
bugün tam olarak desteklenmektedir. Windows'ta masaüstü uygulaması için Windows Hub'ı, öncelikle
terminal kullanımına yönelik yerel PowerShell kurulumunu veya Linux ile en uyumlu
Gateway çalışma zamanı için WSL2'yi seçin.

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
- Gateway çalıştırma kılavuzu: [Gateway](/tr/gateway)
- Gateway yapılandırması: [Yapılandırma](/tr/gateway/configuration)
- Hizmet durumu: `openclaw gateway status`

## Gateway hizmeti kurulumu (CLI)

Bunlardan birini kullanın (tümü desteklenir):

- Sihirbaz (önerilen): `openclaw onboard --install-daemon`
- Doğrudan: `openclaw gateway install`
- Yapılandırma akışı: `openclaw configure` → **Gateway service** seçeneğini belirleyin
- Onarma/geçiş: `openclaw doctor` (hizmeti kurmayı veya düzeltmeyi önerir)

Hizmet hedefi işletim sistemine bağlıdır:

- macOS: LaunchAgent (`ai.openclaw.gateway` veya adlandırılmış bir profil için `ai.openclaw.<profile>`)
- Linux/WSL2: systemd kullanıcı hizmeti (`openclaw-gateway[-<profile>].service`)
- Yerel Windows: Scheduled Task (`OpenClaw Gateway` veya `OpenClaw Gateway (<profile>)`); görev oluşturma reddedilirse kullanıcı başına Startup klasörü oturum açma öğesi yedeği kullanılır

## İlgili

- [Kuruluma genel bakış](/tr/install)
- [Windows Hub](/tr/platforms/windows)
- [macOS uygulaması](/tr/platforms/macos)
- [iOS uygulaması](/tr/platforms/ios)
