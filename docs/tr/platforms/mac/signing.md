---
read_when:
    - Mac hata ayıklama derlemelerini oluşturma veya imzalama
summary: Paketleme betikleri tarafından oluşturulan macOS hata ayıklama derlemeleri için imzalama adımları
title: macOS imzalama
x-i18n:
    generated_at: "2026-05-06T09:22:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 08a2f18f0f813c0bb7352b393531ad69d24da55de2e6ec6446febe0661eb4598
    source_path: platforms/mac/signing.md
    workflow: 16
---

# mac imzalama (hata ayıklama derlemeleri)

Bu uygulama genellikle [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) üzerinden derlenir; bu betik artık:

- kararlı bir hata ayıklama paket tanımlayıcısı ayarlar: `ai.openclaw.mac.debug`
- Info.plist dosyasını bu paket kimliğiyle yazar (`BUNDLE_ID=...` ile geçersiz kılınabilir)
- ana ikiliyi ve uygulama paketini imzalamak için [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh) betiğini çağırır; böylece macOS her yeniden derlemeyi aynı imzalı paket olarak ele alır ve TCC izinlerini (bildirimler, erişilebilirlik, ekran kaydı, mikrofon, konuşma) korur. Kararlı izinler için gerçek bir imzalama kimliği kullanın; ad-hoc isteğe bağlıdır ve kırılgandır (bkz. [macOS izinleri](/tr/platforms/mac/permissions)).
- varsayılan olarak `CODESIGN_TIMESTAMP=auto` kullanır; Developer ID imzaları için güvenilir zaman damgalarını etkinleştirir. Zaman damgalamayı atlamak için `CODESIGN_TIMESTAMP=off` ayarlayın (çevrimdışı hata ayıklama derlemeleri).
- derleme meta verilerini Info.plist içine ekler: `OpenClawBuildTimestamp` (UTC) ve `OpenClawGitCommit` (kısa hash); böylece Hakkında bölmesi derleme, git ve hata ayıklama/sürüm kanalını gösterebilir.
- **Paketleme varsayılan olarak Node 24 kullanır**: betik TS derlemelerini ve Control UI derlemesini çalıştırır. Şu anda `22.14+` olan Node 22 LTS, uyumluluk için desteklenmeye devam eder.
- `SIGN_IDENTITY` değerini ortamdan okur. Her zaman sertifikanızla imzalamak için shell rc dosyanıza `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"` (veya Developer ID Application sertifikanızı) ekleyin. Ad-hoc imzalama, `ALLOW_ADHOC_SIGNING=1` veya `SIGN_IDENTITY="-"` üzerinden açıkça kabul gerektirir (izin testi için önerilmez).
- imzalamadan sonra bir Team ID denetimi çalıştırır ve uygulama paketinin içindeki herhangi bir Mach-O farklı bir Team ID ile imzalanmışsa başarısız olur. Atlamak için `SKIP_TEAM_ID_CHECK=1` ayarlayın.

## Kullanım

```bash
# repo kökünden
scripts/package-mac-app.sh               # kimliği otomatik seçer; hiçbiri bulunamazsa hata verir
SIGN_IDENTITY="Developer ID Application: Your Name" scripts/package-mac-app.sh   # gerçek sertifika
ALLOW_ADHOC_SIGNING=1 scripts/package-mac-app.sh    # ad-hoc (izinler kalıcı olmaz)
SIGN_IDENTITY="-" scripts/package-mac-app.sh        # açık ad-hoc (aynı uyarı geçerli)
DISABLE_LIBRARY_VALIDATION=1 scripts/package-mac-app.sh   # yalnızca geliştirme için Sparkle Team ID uyuşmazlığı geçici çözümü
```

### Ad-hoc İmzalama Notu

`SIGN_IDENTITY="-"` (ad-hoc) ile imzalama yapıldığında betik **Hardened Runtime** (`--options runtime`) ayarını otomatik olarak devre dışı bırakır. Bu, uygulama aynı Team ID'yi paylaşmayan gömülü framework'leri (Sparkle gibi) yüklemeye çalıştığında çökmeleri önlemek için gereklidir. Ad-hoc imzalar ayrıca TCC izin kalıcılığını bozar; kurtarma adımları için bkz. [macOS izinleri](/tr/platforms/mac/permissions).

## Hakkında için derleme meta verileri

`package-mac-app.sh` paketi şu değerlerle damgalar:

- `OpenClawBuildTimestamp`: paketleme zamanında ISO8601 UTC
- `OpenClawGitCommit`: kısa git hash'i (veya kullanılamıyorsa `unknown`)

Hakkında sekmesi, sürümü, derleme tarihini, git commit'ini ve bunun bir hata ayıklama derlemesi olup olmadığını (`#if DEBUG` aracılığıyla) göstermek için bu anahtarları okur. Kod değişikliklerinden sonra bu değerleri yenilemek için paketleyiciyi çalıştırın.

## Neden

TCC izinleri paket tanımlayıcısına _ve_ kod imzasına bağlıdır. Değişen UUID'lere sahip imzasız hata ayıklama derlemeleri, macOS'in her yeniden derlemeden sonra izinleri unutmasına neden oluyordu. İkilileri imzalamak (varsayılan olarak ad-hoc) ve sabit bir paket kimliği/yolu (`dist/OpenClaw.app`) tutmak, derlemeler arasında izinleri korur ve VibeTunnel yaklaşımıyla eşleşir.

## İlgili

- [macOS uygulaması](/tr/platforms/macos)
- [macOS izinleri](/tr/platforms/mac/permissions)
