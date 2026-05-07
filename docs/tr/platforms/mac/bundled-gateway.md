---
read_when:
    - OpenClaw.app’i paketleme
    - macOS Gateway launchd hizmetinde hata ayıklama
    - macOS için Gateway CLI'yi yükleme
summary: macOS’ta Gateway çalışma zamanı (harici launchd hizmeti)
title: macOS'te Gateway
x-i18n:
    generated_at: "2026-05-07T13:22:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: caf129918c46f8f54026e9db04e8ad5a033148899d3029fe1a362bb14c7f25f8
    source_path: platforms/mac/bundled-gateway.md
    workflow: 16
---

OpenClaw.app artık Node/Bun veya Gateway runtime'ını paketlemez. macOS uygulaması
**harici** bir `openclaw` CLI kurulumu bekler, Gateway'i bir alt süreç olarak
başlatmaz ve Gateway'in çalışır durumda kalması için kullanıcı başına bir launchd
hizmeti yönetir (veya zaten çalışan mevcut bir yerel Gateway varsa ona bağlanır).

## CLI'yi kurun (yerel mod için gerekli)

Mac'te varsayılan runtime Node 24'tür. Şu anda `22.16+` olan Node 22 LTS, uyumluluk için hâlâ çalışır. Ardından `openclaw` paketini global olarak kurun:

```bash
npm install -g openclaw@<version>
```

macOS uygulamasının **CLI'yi Kur** düğmesi, uygulamanın dahili olarak kullandığı
aynı global kurulum akışını çalıştırır: önce npm'yi, sonra pnpm'yi, yalnızca
tespit edilen paket yöneticisi buysa bun'ı tercih eder. Node, önerilen Gateway
runtime'ı olmaya devam eder.

## Launchd (LaunchAgent olarak Gateway)

Etiket:

- `ai.openclaw.gateway` (veya `ai.openclaw.<profile>`; eski `com.openclaw.*` kalabilir)

Plist konumu (kullanıcı başına):

- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  (veya `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`)

Yönetici:

- macOS uygulaması, Yerel modda LaunchAgent kurulumunu/güncellemesini yönetir.
- CLI de bunu kurabilir: `openclaw gateway install`.

Davranış:

- "OpenClaw Etkin" LaunchAgent'ı etkinleştirir/devre dışı bırakır.
- Uygulamadan çıkmak gateway'i durdurmaz (launchd onu canlı tutar).
- Yapılandırılmış bağlantı noktasında zaten bir Gateway çalışıyorsa uygulama,
  yeni bir tane başlatmak yerine ona bağlanır.

Günlükleme:

- launchd stdout/err: `/tmp/openclaw/openclaw-gateway.log`

## Sürüm uyumluluğu

macOS uygulaması, gateway sürümünü kendi sürümüyle karşılaştırır. Uyumsuzlarsa
global CLI'yi uygulama sürümüyle eşleşecek şekilde güncelleyin.

## Temel doğrulama

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

- [macOS uygulaması](/tr/platforms/macos)
- [Gateway runbook](/tr/gateway)
