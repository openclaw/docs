---
read_when:
    - OpenClaw.app’i Paketleme
    - macOS Gateway launchd hizmetinde hata ayıklama
    - macOS için Gateway CLI'yi yükleme
summary: macOS üzerinde Gateway çalışma zamanı (harici launchd hizmeti)
title: macOS üzerinde Gateway
x-i18n:
    generated_at: "2026-06-28T00:48:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5317e82435ecf179407116339507a666957a8e23a07a49665233b22f22f5b155
    source_path: platforms/mac/bundled-gateway.md
    workflow: 16
---

OpenClaw.app artık Node/Bun veya Gateway çalışma zamanını birlikte paketlemez. macOS uygulaması
**harici** bir `openclaw` CLI kurulumunu bekler, Gateway'i bir alt süreç olarak
başlatmaz ve Gateway'in çalışır kalmasını sağlamak için kullanıcı başına bir launchd servisini yönetir
(veya zaten çalışıyorsa mevcut bir yerel Gateway'e bağlanır).

## CLI'ı yükleyin (yerel mod için gereklidir)

Mac'te varsayılan çalışma zamanı Node 24'tür. Şu anda `22.19+` olan Node 22 LTS uyumluluk için hâlâ çalışır. Ardından `openclaw` aracını global olarak yükleyin:

```bash
npm install -g openclaw@<version>
```

macOS uygulamasının **CLI'ı Yükle** düğmesi, uygulamanın dahili olarak
kullandığı aynı global yükleme akışını çalıştırır: önce npm'i, sonra pnpm'i,
yalnızca algılanan paket yöneticisi buysa bun'ı tercih eder. Node önerilen Gateway çalışma zamanı olmaya devam eder.

## Launchd (LaunchAgent olarak Gateway)

Etiket:

- `ai.openclaw.gateway` (veya `ai.openclaw.<profile>`; eski `com.openclaw.*` kalabilir)

Plist konumu (kullanıcı başına):

- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  (veya `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`)

Yönetici:

- macOS uygulaması Yerel modda LaunchAgent yükleme/güncelleme işleminin sahibidir.
- CLI da bunu yükleyebilir: `openclaw gateway install`.

Davranış:

- "OpenClaw Etkin" LaunchAgent'ı etkinleştirir/devre dışı bırakır.
- Uygulamadan çıkmak gateway'i durdurmaz (launchd onu canlı tutar).
- Yapılandırılan bağlantı noktasında zaten bir Gateway çalışıyorsa uygulama
  yeni bir tane başlatmak yerine ona bağlanır.

Günlükleme:

- launchd stdout: `~/Library/Logs/openclaw/gateway.log` (profiller `gateway-<profile>.log` kullanır)
- launchd stderr: bastırılır

## Sürüm uyumluluğu

macOS uygulaması gateway sürümünü kendi sürümüne göre kontrol eder. Uyumsuzlarsa
global CLI'ı uygulama sürümüyle eşleşecek şekilde güncelleyin.

## macOS'te durum dizini

OpenClaw durumunu yerel, eşitlenmeyen bir diskte tutun. iCloud Drive ve diğer
bulutla eşitlenen klasörlerden kaçının; çünkü eşitleme gecikmesi ve dosya kilitleri oturumları,
kimlik bilgilerini ve Gateway durumunu etkileyebilir.

`OPENCLAW_STATE_DIR` değerini yalnızca geçersiz kılmanız gerektiğinde yerel bir yola ayarlayın.
`openclaw doctor`, yaygın bulutla eşitlenen durum yolları hakkında uyarır ve
yerel depolamaya geri taşımayı önerir. Bkz.
[ortam değişkenleri](/tr/help/environment#path-related-env-vars) ve
[Doctor](/tr/gateway/doctor).

## Uygulama bağlantısını hata ayıklama

Uygulamanın kullandığı aynı Gateway WebSocket el sıkışmasını ve keşif mantığını
denemek için bir kaynak checkout'undan macOS hata ayıklama CLI'ını kullanın:

```bash
cd apps/macos
swift run openclaw-mac connect --json
swift run openclaw-mac discover --timeout 3000 --json
```

`connect`, `--url`, `--token`, `--timeout` ve `--json` kabul eder. `discover`,
`--timeout`, `--json` ve `--include-local` kabul eder. CLI keşfini
uygulama tarafı bağlantı sorunlarından ayırmanız gerektiğinde keşif çıktısını
`openclaw gateway discover --json` ile karşılaştırın.

## Smoke kontrolü

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
