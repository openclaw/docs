---
read_when:
    - Mac hata ayıklama derlemelerini oluşturma veya imzalama
summary: Paketleme betikleri tarafından oluşturulan macOS hata ayıklama derlemeleri için imzalama adımları
title: macOS imzalama
x-i18n:
    generated_at: "2026-06-28T00:49:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: df4ee44b6bdf09a24e0d05ed4354e2cb573372d12a667b4fcdfd7d6f88291082
    source_path: platforms/mac/signing.md
    workflow: 16
---

# mac imzalama (hata ayıklama derlemeleri)

Bu uygulama genellikle [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) üzerinden derlenir; bu betik artık:

- kararlı bir hata ayıklama bundle tanımlayıcısı ayarlar: `ai.openclaw.mac.debug`
- Info.plist dosyasını bu bundle kimliğiyle yazar (`BUNDLE_ID=...` ile geçersiz kılınabilir)
- ana ikiliyi ve uygulama bundle'ını imzalamak için [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh) çağırır; böylece macOS her yeniden derlemeyi aynı imzalı bundle olarak değerlendirir ve TCC izinlerini (bildirimler, erişilebilirlik, ekran kaydı, mikrofon, konuşma) korur. Kararlı izinler için gerçek bir imzalama kimliği kullanın; ad-hoc isteğe bağlıdır ve kırılgandır (bkz. [macOS izinleri](/tr/platforms/mac/permissions)).
- varsayılan olarak `CODESIGN_TIMESTAMP=auto` kullanır; Developer ID imzaları için güvenilir zaman damgalarını etkinleştirir. Zaman damgalamayı atlamak için `CODESIGN_TIMESTAMP=off` ayarlayın (çevrimdışı hata ayıklama derlemeleri).
- Info.plist içine derleme meta verileri ekler: About bölmesinin derlemeyi, git bilgisini ve debug/release kanalını gösterebilmesi için `OpenClawBuildTimestamp` (UTC) ve `OpenClawGitCommit` (kısa hash).
- **Paketleme varsayılan olarak Node 24 kullanır**: betik TS derlemelerini ve Control UI derlemesini çalıştırır. Şu anda `22.19+` olan Node 22 LTS, uyumluluk için desteklenmeye devam eder.
- ortamdan `SIGN_IDENTITY` okur. Her zaman sertifikanızla imzalamak için shell rc dosyanıza `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"` (veya Developer ID Application sertifikanızı) ekleyin. Ad-hoc imzalama, `ALLOW_ADHOC_SIGNING=1` veya `SIGN_IDENTITY="-"` üzerinden açıkça etkinleştirme gerektirir (izin testleri için önerilmez).
- imzalamadan sonra bir Team ID denetimi çalıştırır ve uygulama bundle'ı içindeki herhangi bir Mach-O farklı bir Team ID tarafından imzalanmışsa başarısız olur. Atlamak için `SKIP_TEAM_ID_CHECK=1` ayarlayın.

## Kullanım

```bash
# from repo root
scripts/package-mac-app.sh               # auto-selects identity; errors if none found
SIGN_IDENTITY="Developer ID Application: Your Name" scripts/package-mac-app.sh   # real cert
ALLOW_ADHOC_SIGNING=1 scripts/package-mac-app.sh    # ad-hoc (permissions will not stick)
SIGN_IDENTITY="-" scripts/package-mac-app.sh        # explicit ad-hoc (same caveat)
DISABLE_LIBRARY_VALIDATION=1 scripts/package-mac-app.sh   # dev-only Sparkle Team ID mismatch workaround
```

### Ad-hoc İmzalama Notu

`SIGN_IDENTITY="-"` (ad-hoc) ile imzalama yaparken betik **Hardened Runtime**'ı (`--options runtime`) otomatik olarak devre dışı bırakır. Bu, uygulama aynı Team ID'yi paylaşmayan gömülü framework'leri (Sparkle gibi) yüklemeye çalıştığında çökmeleri önlemek için gereklidir. Ad-hoc imzalar TCC izin kalıcılığını da bozar; kurtarma adımları için [macOS izinleri](/tr/platforms/mac/permissions) bölümüne bakın.

## About için derleme meta verileri

`package-mac-app.sh` bundle'ı şunlarla damgalar:

- `OpenClawBuildTimestamp`: paketleme zamanında ISO8601 UTC
- `OpenClawGitCommit`: kısa git hash'i (veya kullanılamıyorsa `unknown`)

About sekmesi bu anahtarları okuyarak sürümü, derleme tarihini, git commit'ini ve bunun bir hata ayıklama derlemesi olup olmadığını (`#if DEBUG` üzerinden) gösterir. Kod değişikliklerinden sonra bu değerleri yenilemek için paketleyiciyi çalıştırın.

## Neden

TCC izinleri bundle tanımlayıcısına _ve_ kod imzasına bağlıdır. Değişen UUID'lere sahip imzasız hata ayıklama derlemeleri, macOS'in her yeniden derlemeden sonra izinleri unutmasına neden oluyordu. İkilileri imzalamak (varsayılan olarak ad-hoc) ve sabit bir bundle kimliği/yolu (`dist/OpenClaw.app`) tutmak, VibeTunnel yaklaşımıyla eşleşerek derlemeler arasında izinleri korur.

## İlgili

- [macOS uygulaması](/tr/platforms/macos)
- [macOS izinleri](/tr/platforms/mac/permissions)
