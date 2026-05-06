---
read_when:
    - OpenClaw.app’i Paketleme
    - macOS Gateway launchd hizmetinde hata ayıklama
    - macOS için Gateway CLI'ını yükleme
summary: macOS üzerinde Gateway çalışma zamanı (harici launchd hizmeti)
title: macOS'ta Gateway
x-i18n:
    generated_at: "2026-05-06T09:21:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3f5dcc73671140d7599ffefceeb98ac7ce34da1f944c1e7c70bc9e5810e6ca66
    source_path: platforms/mac/bundled-gateway.md
    workflow: 16
---

OpenClaw.app artık Node/Bun veya Gateway çalışma zamanını paketlemez. macOS uygulaması
**harici** bir `openclaw` CLI kurulumu bekler, Gateway'i alt süreç olarak
başlatmaz ve Gateway'i çalışır durumda tutmak için kullanıcı başına bir launchd
hizmeti yönetir (veya zaten çalışan mevcut bir yerel Gateway varsa ona bağlanır).

## CLI'yi kurun (yerel mod için gerekli)

Mac'te varsayılan çalışma zamanı Node 24'tür. Şu anda `22.14+` olan Node 22 LTS, uyumluluk için hâlâ çalışır. Ardından `openclaw` paketini genel olarak kurun:

```bash
npm install -g openclaw@<version>
```

macOS uygulamasının **CLI'yi Kur** düğmesi, uygulamanın dahili olarak kullandığı
aynı genel kurulum akışını çalıştırır: önce npm'yi, sonra pnpm'yi, yalnızca
algılanan paket yöneticisi buysa bun'ı tercih eder. Node, önerilen Gateway
çalışma zamanı olmaya devam eder.

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

- "OpenClaw Etkin", LaunchAgent'ı etkinleştirir/devre dışı bırakır.
- Uygulamadan çıkmak gateway'i durdurmaz (launchd onu canlı tutar).
- Yapılandırılan bağlantı noktasında zaten bir Gateway çalışıyorsa uygulama,
  yeni bir tane başlatmak yerine ona bağlanır.

Günlük kaydı:

- launchd stdout/err: `/tmp/openclaw/openclaw-gateway.log`

## Sürüm uyumluluğu

macOS uygulaması, gateway sürümünü kendi sürümüyle karşılaştırır. Uyumsuzlarsa
genel CLI'yi uygulama sürümüyle eşleşecek şekilde güncelleyin.

## Duman testi

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
- [Gateway çalışma kılavuzu](/tr/gateway)
