---
read_when:
    - Mac hata ayıklama derlemeleri oluşturuyor veya imzalıyorsanız
summary: Paketleme betikleri tarafından oluşturulan macOS hata ayıklama derlemeleri için imzalama adımları
title: macOS İmzalama
x-i18n:
    generated_at: "2026-04-05T14:00:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7b16d726549cf6dc34dc9c60e14d8041426ebc0699ab59628aca1d094380334a
    source_path: platforms/mac/signing.md
    workflow: 15
---

# mac imzalama (hata ayıklama derlemeleri)

Bu uygulama genellikle [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) üzerinden derlenir; bu betik artık şunları yapar:

- kararlı bir hata ayıklama bundle tanımlayıcısı ayarlar: `ai.openclaw.mac.debug`
- Info.plist dosyasını bu bundle kimliğiyle yazar (`BUNDLE_ID=...` ile geçersiz kılınabilir)
- ana ikili dosyayı ve uygulama bundle'ını imzalamak için [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh) çağırır; böylece macOS her yeniden derlemeyi aynı imzalı bundle olarak görür ve TCC izinlerini korur (bildirimler, erişilebilirlik, ekran kaydı, mikrofon, konuşma). Kararlı izinler için gerçek bir imzalama kimliği kullanın; ad-hoc isteğe bağlıdır ve kırılgandır ([macOS permissions](/platforms/mac/permissions) bölümüne bakın).
- varsayılan olarak `CODESIGN_TIMESTAMP=auto` kullanır; bu, Developer ID imzaları için güvenilir zaman damgalarını etkinleştirir. Zaman damgalamayı atlamak için `CODESIGN_TIMESTAMP=off` ayarlayın (çevrimdışı hata ayıklama derlemeleri).
- Info.plist içine derleme meta verileri ekler: Hakkında bölmesinin derlemeyi, git bilgisini ve hata ayıklama/sürüm kanalını gösterebilmesi için `OpenClawBuildTimestamp` (UTC) ve `OpenClawGitCommit` (kısa hash).
- **Paketleme varsayılan olarak Node 24 kullanır**: betik TS derlemelerini ve Control UI derlemesini çalıştırır. Node 22 LTS, şu anda `22.14+`, uyumluluk için desteklenmeye devam eder.
- ortam değişkenlerinden `SIGN_IDENTITY` değerini okur. Her zaman sertifikanızla imzalamak için bunu kabuk rc dosyanıza ekleyin: `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"` (veya Developer ID Application sertifikanız). Ad-hoc imzalama için `ALLOW_ADHOC_SIGNING=1` ya da `SIGN_IDENTITY="-"` ile açıkça izin verilmelidir (izin testi için önerilmez).
- imzalamadan sonra bir Team ID denetimi çalıştırır ve uygulama bundle'ı içindeki herhangi bir Mach-O farklı bir Team ID ile imzalanmışsa başarısız olur. Bunu atlamak için `SKIP_TEAM_ID_CHECK=1` ayarlayın.

## Kullanım

```bash
# repo kökünden
scripts/package-mac-app.sh               # kimliği otomatik seçer; hiçbiri bulunmazsa hata verir
SIGN_IDENTITY="Developer ID Application: Your Name" scripts/package-mac-app.sh   # gerçek sertifika
ALLOW_ADHOC_SIGNING=1 scripts/package-mac-app.sh    # ad-hoc (izinler kalıcı olmayacaktır)
SIGN_IDENTITY="-" scripts/package-mac-app.sh        # açık ad-hoc (aynı uyarı geçerlidir)
DISABLE_LIBRARY_VALIDATION=1 scripts/package-mac-app.sh   # yalnızca geliştirme için Sparkle Team ID uyuşmazlığı geçici çözümü
```

### Ad-hoc İmzalama Notu

`SIGN_IDENTITY="-"` ile imzalama yapıldığında (ad-hoc), betik **Hardened Runtime** özelliğini (`--options runtime`) otomatik olarak devre dışı bırakır. Bu, uygulama aynı Team ID'yi paylaşmayan gömülü framework'leri (Sparkle gibi) yüklemeye çalıştığında çökmeleri önlemek için gereklidir. Ad-hoc imzalar ayrıca TCC izinlerinin kalıcılığını da bozar; kurtarma adımları için [macOS permissions](/platforms/mac/permissions) bölümüne bakın.

## Hakkında için derleme meta verileri

`package-mac-app.sh`, bundle'a şu bilgileri damgalar:

- `OpenClawBuildTimestamp`: paketleme anındaki ISO8601 UTC
- `OpenClawGitCommit`: kısa git hash'i (veya mevcut değilse `unknown`)

Hakkında sekmesi bu anahtarları kullanarak sürümü, derleme tarihini, git commit'ini ve bunun bir hata ayıklama derlemesi olup olmadığını (`#if DEBUG` aracılığıyla) gösterir. Kod değişikliklerinden sonra bu değerleri yenilemek için paketleyiciyi çalıştırın.

## Neden

TCC izinleri bundle tanımlayıcısına _ve_ kod imzasına bağlıdır. UUID'leri değişen imzasız hata ayıklama derlemeleri, macOS'un her yeniden derlemeden sonra verilen izinleri unutmasına neden oluyordu. İkili dosyaları imzalamak (varsayılan olarak ad-hoc) ve sabit bir bundle kimliği/yolu (`dist/OpenClaw.app`) korumak, VibeTunnel yaklaşımına benzer şekilde izinlerin derlemeler arasında korunmasını sağlar.
