---
read_when:
    - OpenClaw.app paketlenirken
    - macOS Gateway launchd hizmetinde hata ayıklarken
    - macOS için Gateway CLI yüklenirken
summary: macOS'ta Gateway çalışma zamanı (harici launchd hizmeti)
title: macOS'ta Gateway
x-i18n:
    generated_at: "2026-04-05T13:59:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 69e41528b35d69c13608cb9a34b39a7f02e1134204d1b496cbdd191798f39607
    source_path: platforms/mac/bundled-gateway.md
    workflow: 15
---

# macOS'ta Gateway (harici launchd)

OpenClaw.app artık Node/Bun veya Gateway çalışma zamanını paketlemiyor. macOS uygulaması **harici** bir `openclaw` CLI kurulumunu bekler, Gateway'i bir alt süreç olarak başlatmaz ve Gateway'in çalışmaya devam etmesini sağlamak için kullanıcı başına bir launchd hizmeti yönetir (veya zaten çalışıyorsa mevcut bir yerel Gateway'e bağlanır).

## CLI'yi yükleyin (yerel mod için gereklidir)

Node 24, Mac'teki varsayılan çalışma zamanıdır. Uyumluluk için Node 22 LTS, şu anda `22.14+`, hâlâ çalışır. Ardından `openclaw` aracını global olarak yükleyin:

```bash
npm install -g openclaw@<version>
```

macOS uygulamasındaki **CLI Yükle** düğmesi, uygulamanın kendi içinde kullandığı aynı global yükleme akışını çalıştırır: önce npm'yi, ardından pnpm'yi, yalnızca tespit edilen paket yöneticisi buysa bun'ı tercih eder. Önerilen Gateway çalışma zamanı Node olmaya devam eder.

## Launchd (LaunchAgent olarak Gateway)

Etiket:

- `ai.openclaw.gateway` (veya `ai.openclaw.<profile>`; eski `com.openclaw.*` kalabilir)

Plist konumu (kullanıcı başına):

- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  (veya `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`)

Yönetici:

- macOS uygulaması, Yerel modda LaunchAgent yükleme/güncelleme işleminin sahibidir.
- CLI de bunu yükleyebilir: `openclaw gateway install`.

Davranış:

- “OpenClaw Active”, LaunchAgent'ı etkinleştirir/devre dışı bırakır.
- Uygulamadan çıkmak gateway'i durdurmaz (launchd onu çalışır durumda tutar).
- Yapılandırılan portta zaten bir Gateway çalışıyorsa uygulama yeni bir tane başlatmak yerine ona bağlanır.

Günlükleme:

- launchd stdout/err: `/tmp/openclaw/openclaw-gateway.log`

## Sürüm uyumluluğu

macOS uygulaması, gateway sürümünü kendi sürümüyle karşılaştırır. Uyumsuzlarsa uygulama sürümüyle eşleşecek şekilde global CLI'yi güncelleyin.

## Hızlı kontrol

```bash
openclaw --version

OPENCLAW_SKIP_CHANNELS=1 \
OPENCLAW_SKIP_CANVAS_HOST=1 \
openclaw gateway --port 18999 --bind loopback
```

Ardından:

```bash
openclaw gateway call health --url ws://127.0.0.1:18999 --timeout 3000
```
