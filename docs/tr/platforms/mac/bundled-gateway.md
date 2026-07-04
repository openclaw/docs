---
read_when:
    - OpenClaw.app paketleniyor
    - macOS Gateway launchd hizmetinde hata ayıklama
    - macOS için Gateway CLI'yı yükleme
summary: macOS’ta Gateway çalışma zamanı (harici launchd hizmeti)
title: macOS üzerinde Gateway
x-i18n:
    generated_at: "2026-07-04T06:48:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7a8b646f4cae43cb66acbf3527ef2af9ccaf4b6f2678a464586a110e5e9b3662
    source_path: platforms/mac/bundled-gateway.md
    workflow: 16
---

OpenClaw.app artık Node/Bun veya Gateway çalışma zamanını paket halinde sunmaz. macOS uygulaması **harici** bir `openclaw` CLI kurulumunu bekler, Gateway'i alt süreç olarak başlatmaz ve Gateway'in çalışır durumda kalması için kullanıcı başına bir launchd servisini yönetir (veya zaten çalışan mevcut bir yerel Gateway varsa ona bağlanır).

## Otomatik kurulum

Yeni bir Mac'te, ilk kurulum sırasında **Bu Mac** seçeneğini seçin. Uygulama, Gateway sihirbazından önce imzalı, paketlenmiş yükleyicisini çalıştırır; `~/.openclaw` altına kullanıcı alanı Node çalışma zamanını ve eşleşen `openclaw` CLI'ı kurar, ardından kullanıcı başına launchd servisini kurup başlatır. Bu yol Terminal, Homebrew veya yönetici erişimi gerektirmez.

Uygulama, Node veya Gateway yükünü değil, yükleyici betiğini paket halinde sunar. Bu nedenle kurulum, çalışma zamanını ve eşleşen OpenClaw paketini indirmek için internet bağlantısı gerektirir.

## Elle kurtarma

Elle kurulum için Node 24 önerilir. Şu anda `22.19+` olan Node 22 LTS de çalışır. Ardından `openclaw` paketini küresel olarak kurun:

```bash
npm install -g openclaw@<version>
```

Başarısız bir otomatik kurulumdan sonra **Kurulumu yeniden dene** seçeneğini kullanın. Bu da başarısız olursa, yukarıdaki komutla CLI'ı elle kurun, ardından ilk kurulumda **Yeniden kontrol et** seçeneğini seçin. Node, önerilen Gateway çalışma zamanı olmaya devam eder.

## Launchd (LaunchAgent olarak Gateway)

Etiket:

- `ai.openclaw.gateway` (veya `ai.openclaw.<profile>`; eski `com.openclaw.*` kalabilir)

Plist konumu (kullanıcı başına):

- `~/Library/LaunchAgents/ai.openclaw.gateway.plist`
  (veya `~/Library/LaunchAgents/ai.openclaw.<profile>.plist`)

Yönetici:

- macOS uygulaması, Yerel modda LaunchAgent kurulumunu/güncellemesini üstlenir.
- CLI da bunu kurabilir: `openclaw gateway install`.

Davranış:

- "OpenClaw Etkin", LaunchAgent'ı etkinleştirir/devre dışı bırakır.
- Uygulamadan çıkmak gateway'i **durdurmaz** (launchd onu canlı tutar).
- Yapılandırılmış bağlantı noktasında zaten bir Gateway çalışıyorsa, uygulama yeni bir tane başlatmak yerine ona bağlanır.

Günlükleme:

- launchd stdout: `~/Library/Logs/openclaw/gateway.log` (profiller `gateway-<profile>.log` kullanır)
- launchd stderr: bastırılır

## Sürüm uyumluluğu

macOS uygulaması, Gateway sürümünü kendi sürümüyle karşılaştırarak kontrol eder. Mevcut bir CLI eksik veya uyumsuz olduğunda, ilk kurulum otomatik olarak yönetilen kurulumu çalıştırır. Kurulumu tekrarlamak için **Kurulumu yeniden dene** seçeneğini veya harici bir CLI'ı onardıktan sonra **Yeniden kontrol et** seçeneğini kullanın.

## macOS'ta durum dizini

OpenClaw durumunu yerel, eşitlenmeyen bir diskte tutun. iCloud Drive ve diğer bulutla eşitlenen klasörlerden kaçının; çünkü eşitleme gecikmesi ve dosya kilitleri oturumları, kimlik bilgilerini ve Gateway durumunu etkileyebilir.

Yalnızca geçersiz kılma gerektiğinde `OPENCLAW_STATE_DIR` değerini yerel bir yola ayarlayın. `openclaw doctor`, yaygın bulutla eşitlenen durum yolları hakkında uyarır ve yerel depolamaya geri taşımayı önerir. Bkz.
[ortam değişkenleri](/tr/help/environment#path-related-env-vars) ve
[Doctor](/tr/gateway/doctor).

## Uygulama bağlantısını hata ayıklama

Uygulamanın kullandığı aynı Gateway WebSocket el sıkışmasını ve keşif mantığını çalıştırmak için bir kaynak checkout'undan macOS hata ayıklama CLI'ını kullanın:

```bash
cd apps/macos
swift run openclaw-mac connect --json
swift run openclaw-mac discover --timeout 3000 --json
```

`connect`, `--url`, `--token`, `--timeout` ve `--json` kabul eder. `discover`, `--timeout`, `--json` ve `--include-local` kabul eder. CLI keşfini uygulama tarafındaki bağlantı sorunlarından ayırmanız gerektiğinde keşif çıktısını `openclaw gateway discover --json` ile karşılaştırın.

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
