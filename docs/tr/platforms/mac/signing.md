---
read_when:
    - Mac debug derlemelerini oluşturma veya imzalama
summary: Paketleme betikleri tarafından üretilen macOS debug derlemeleri için imzalama adımları
title: macOS imzalama
x-i18n:
    generated_at: "2026-04-24T09:20:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: cdd432c1f87ea14f4e19b1e5db967a62b42e2e4118fbd2a44d358b4eedea799f
    source_path: platforms/mac/signing.md
    workflow: 15
---

# mac imzalama (debug derlemeler)

Bu uygulama genellikle artık şunları yapan [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) üzerinden derlenir:

- kararlı bir debug bundle kimliği ayarlar: `ai.openclaw.mac.debug`
- Info.plist dosyasını bu bundle kimliğiyle yazar (`BUNDLE_ID=...` ile geçersiz kılınabilir)
- ana ikiliyi ve uygulama paketini imzalamak için [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh) çağırır; böylece macOS her yeniden derlemeyi aynı imzalanmış paket olarak görür ve TCC izinlerini (bildirimler, erişilebilirlik, ekran kaydı, mikrofon, konuşma) korur. Kararlı izinler için gerçek bir imzalama kimliği kullanın; ad-hoc isteğe bağlıdır ve kırılgandır (bkz. [macOS permissions](/tr/platforms/mac/permissions)).
- varsayılan olarak `CODESIGN_TIMESTAMP=auto` kullanır; Developer ID imzaları için güvenilir zaman damgalarını etkinleştirir. Zaman damgalamayı atlamak için `CODESIGN_TIMESTAMP=off` ayarlayın (çevrimdışı debug derlemeleri).
- Info.plist içine derleme üst verisi enjekte eder: `OpenClawBuildTimestamp` (UTC) ve `OpenClawGitCommit` (kısa hash); böylece Hakkında bölmesi derlemeyi, git'i ve debug/release kanalını gösterebilir.
- **Paketleme varsayılan olarak Node 24 kullanır**: betik TS derlemelerini ve Control UI derlemesini çalıştırır. Uyumluluk için Node 22 LTS, şu anda `22.14+`, desteklenmeye devam etmektedir.
- ortamdan `SIGN_IDENTITY` okur. Sertifikanızla her zaman imzalamak için kabuk rc dosyanıza `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"` (veya Developer ID Application sertifikanızı) ekleyin. Ad-hoc imzalama, yalnızca `ALLOW_ADHOC_SIGNING=1` veya `SIGN_IDENTITY="-"` ile açıkça dahil olunursa kullanılır (izin testi için önerilmez).
- imzalamadan sonra bir Team ID denetimi çalıştırır ve uygulama paketi içindeki herhangi bir Mach-O farklı bir Team ID ile imzalanmışsa başarısız olur. Atlamak için `SKIP_TEAM_ID_CHECK=1` ayarlayın.

## Kullanım

```bash
# depo kökünden
scripts/package-mac-app.sh               # kimliği otomatik seçer; hiçbiri bulunmazsa hata verir
SIGN_IDENTITY="Developer ID Application: Your Name" scripts/package-mac-app.sh   # gerçek sertifika
ALLOW_ADHOC_SIGNING=1 scripts/package-mac-app.sh    # ad-hoc (izinler kalıcı olmayacaktır)
SIGN_IDENTITY="-" scripts/package-mac-app.sh        # açık ad-hoc (aynı uyarı geçerli)
DISABLE_LIBRARY_VALIDATION=1 scripts/package-mac-app.sh   # yalnızca geliştirme için Sparkle Team ID uyuşmazlığı geçici çözümü
```

### Ad-hoc İmzalama Notu

`SIGN_IDENTITY="-"` (ad-hoc) ile imzalarken, betik **Hardened Runtime** özelliğini (`--options runtime`) otomatik olarak devre dışı bırakır. Bu, uygulama aynı Team ID'yi paylaşmayan gömülü framework'leri (örneğin Sparkle) yüklemeye çalıştığında çökmeleri önlemek için gereklidir. Ad-hoc imzalar ayrıca TCC izin kalıcılığını bozar; kurtarma adımları için [macOS permissions](/tr/platforms/mac/permissions) sayfasına bakın.

## Hakkında için derleme üst verisi

`package-mac-app.sh`, pakete şunları damgalar:

- `OpenClawBuildTimestamp`: paketleme anındaki ISO8601 UTC
- `OpenClawGitCommit`: kısa git hash'i (yoksa `unknown`)

Hakkında sekmesi bu anahtarları okuyarak sürümü, derleme tarihini, git commit'ini ve debug derlemesi olup olmadığını (`#if DEBUG` ile) gösterir. Kod değişikliklerinden sonra bu değerleri yenilemek için paketleyiciyi çalıştırın.

## Neden

TCC izinleri bundle kimliğine _ve_ kod imzasına bağlıdır. UUID'leri değişen imzasız debug derlemeleri, macOS'un her yeniden derlemeden sonra verilen izinleri unutmasına neden oluyordu. İkilileri imzalamak (varsayılan olarak ad‑hoc) ve sabit bir bundle kimliği/yolu (`dist/OpenClaw.app`) korumak, VibeTunnel yaklaşımıyla uyumlu biçimde izinleri derlemeler arasında korur.

## İlgili

- [macOS uygulaması](/tr/platforms/macos)
- [macOS permissions](/tr/platforms/mac/permissions)
