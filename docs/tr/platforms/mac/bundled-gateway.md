---
read_when:
    - OpenClaw.app paketleme
    - macOS Gateway launchd servisinde hata ayıklama
    - macOS için Gateway CLI kurma
summary: macOS üzerinde Gateway çalışma zamanı (harici launchd servisi)
title: macOS'ta Gateway
x-i18n:
    generated_at: "2026-04-24T09:19:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: fb98905712504fdf5085ec1c00c9e3f911e4005cd14b1472efdb7a5ec7189b5c
    source_path: platforms/mac/bundled-gateway.md
    workflow: 15
---

OpenClaw.app artık Node/Bun veya Gateway çalışma zamanını paketlemiyor. macOS uygulaması
**harici** bir `openclaw` CLI kurulumu bekler, Gateway'i bir
alt süreç olarak başlatmaz ve Gateway'i çalışır tutmak için kullanıcı başına bir launchd servisini yönetir
(veya zaten çalışan mevcut bir yerel Gateway varsa ona bağlanır).

## CLI'yi kurun (yerel mod için gerekli)

Mac üzerinde varsayılan çalışma zamanı Node 24'tür. Uyumluluk için Node 22 LTS, şu anda `22.14+`, hâlâ çalışır. Ardından `openclaw`'ı global olarak kurun:

```bash
npm install -g openclaw@<version>
```

macOS uygulamasındaki **Install CLI** düğmesi, uygulamanın içeride kullandığı aynı global kurulum akışını çalıştırır:
önce npm'yi, sonra pnpm'yi, sonra da yalnızca o algılanmış paket yöneticisiyse bun'ı tercih eder.
Gateway için önerilen çalışma zamanı yine Node'dur.

## Launchd (Gateway LaunchAgent olarak)

Etiket:

- `ai.openclaw.gateway` (veya `ai.openclaw.<profile>`; eski `com.openclaw.*` girişleri kalabilir)

Plist konumu (kullanıcı başına):

- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  (veya `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`)

Yönetici:

- Yerel modda LaunchAgent kurma/güncelleme işlemlerinin sahibi macOS uygulamasıdır.
- CLI de bunu kurabilir: `openclaw gateway install`.

Davranış:

- “OpenClaw Active”, LaunchAgent'i etkinleştirir/devre dışı bırakır.
- Uygulamadan çıkmak Gateway'i durdurmaz (launchd onu canlı tutar).
- Yapılandırılmış portta zaten bir Gateway çalışıyorsa uygulama
  yeni bir tane başlatmak yerine ona bağlanır.

Günlükleme:

- launchd stdout/err: `/tmp/openclaw/openclaw-gateway.log`

## Sürüm uyumluluğu

macOS uygulaması, Gateway sürümünü kendi sürümüne göre kontrol eder. Uyumsuzlarsa uygulama sürümüne eşleşecek şekilde global CLI'yi güncelleyin.

## Smoke denetimi

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

## İlgili

- [macOS app](/tr/platforms/macos)
- [Gateway runbook](/tr/gateway)
