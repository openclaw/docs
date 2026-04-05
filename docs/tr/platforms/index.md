---
read_when:
    - İşletim sistemi desteği veya kurulum yollarını ararken
    - Gateway'i nerede çalıştıracağınıza karar verirken
summary: Platform desteği genel bakışı (Gateway + yardımcı uygulamalar)
title: Platformlar
x-i18n:
    generated_at: "2026-04-05T13:59:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: d5be4743fd39eca426d65db940f04f3a8fc3ff2c5e10b0e82bc55fc35a7d1399
    source_path: platforms/index.md
    workflow: 15
---

# Platformlar

OpenClaw çekirdeği TypeScript ile yazılmıştır. **Önerilen çalışma zamanı Node'dur**.
Gateway için bun önerilmez (WhatsApp/Telegram hataları).

macOS (menü çubuğu uygulaması) ve mobil düğümler (iOS/Android) için yardımcı uygulamalar vardır. Windows ve
Linux yardımcı uygulamaları planlanmaktadır, ancak Gateway bugün tam olarak desteklenmektedir.
Windows için yerel yardımcı uygulamalar da planlanmaktadır; Gateway için WSL2 önerilir.

## İşletim sisteminizi seçin

- macOS: [macOS](/platforms/macos)
- iOS: [iOS](/platforms/ios)
- Android: [Android](/platforms/android)
- Windows: [Windows](/platforms/windows)
- Linux: [Linux](/platforms/linux)

## VPS ve barındırma

- VPS merkezi: [VPS hosting](/vps)
- Fly.io: [Fly.io](/install/fly)
- Hetzner (Docker): [Hetzner](/install/hetzner)
- GCP (Compute Engine): [GCP](/install/gcp)
- Azure (Linux VM): [Azure](/install/azure)
- exe.dev (VM + HTTPS proxy): [exe.dev](/install/exe-dev)

## Yaygın bağlantılar

- Kurulum kılavuzu: [Getting Started](/start/getting-started)
- Gateway çalışma kitabı: [Gateway](/gateway)
- Gateway config'i: [Configuration](/gateway/configuration)
- Hizmet durumu: `openclaw gateway status`

## Gateway hizmet kurulumu (CLI)

Bunlardan birini kullanın (hepsi desteklenir):

- Sihirbaz (önerilen): `openclaw onboard --install-daemon`
- Doğrudan: `openclaw gateway install`
- Yapılandırma akışı: `openclaw configure` → **Gateway service** seçin
- Onarma/geçiş: `openclaw doctor` (hizmeti kurmayı veya düzeltmeyi önerir)

Hizmet hedefi işletim sistemine bağlıdır:

- macOS: LaunchAgent (`ai.openclaw.gateway` veya `ai.openclaw.<profile>`; eski `com.openclaw.*`)
- Linux/WSL2: systemd kullanıcı hizmeti (`openclaw-gateway[-<profile>].service`)
- Yerel Windows: Scheduled Task (`OpenClaw Gateway` veya `OpenClaw Gateway (<profile>)`), görev oluşturma reddedilirse kullanıcı başına Startup-folder oturum açma öğesi geri dönüşü ile
