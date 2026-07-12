---
read_when:
    - Mac hata ayıklama derlemelerini oluşturma veya imzalama
summary: Paketleme betikleri tarafından oluşturulan macOS hata ayıklama derlemeleri için imzalama adımları
title: macOS imzalama
x-i18n:
    generated_at: "2026-07-12T12:26:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 663c08c031417d5a9f048581421e4fe9f69480917582f74746af675bcca5cf95
    source_path: platforms/mac/signing.md
    workflow: 16
---

# Mac imzalama (hata ayıklama derlemeleri)

[`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh), uygulamayı sabit bir yolda (`dist/OpenClaw.app`) derleyip paketler ve ardından imzalamak için [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh) betiğini çağırır. TCC izinleri paket kimliğine ve kod imzasına bağlıdır; yeniden derlemeler arasında ikisini de kararlı tutmak (ve uygulamayı sabit bir yolda bulundurmak), macOS'in TCC izinlerini (bildirimler, erişilebilirlik, ekran kaydı, mikrofon, konuşma) unutmasını önler.

- Hata ayıklama paket tanımlayıcısı varsayılan olarak `ai.openclaw.mac.debug` değeridir (`BUNDLE_ID=...` ile geçersiz kılınabilir).
- Node: `>=22.19.0 <23` veya `>=23.11.0` (depo `package.json` dosyasındaki `engines`). Paketleyici ayrıca Denetim Arayüzü'nü derler (`pnpm ui:build`).
- Varsayılan olarak gerçek bir imzalama kimliği gerektirir; hiçbiri bulunmazsa ve `ALLOW_ADHOC_SIGNING` ayarlanmamışsa kod imzalama betiği hatayla sonlanır. Geçici imzalama (`SIGN_IDENTITY="-"`) açıkça etkinleştirilmelidir ve yeniden derlemeler arasında TCC izinlerini korumaz. Bkz. [macOS izinleri](/tr/platforms/mac/permissions).
- Ortamdan `SIGN_IDENTITY` değerini okur (ör. `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"` veya bir Developer ID Application sertifikası). Bu değer olmadan `codesign-mac-app.sh`, kimliği şu sırayla otomatik olarak seçer: Developer ID Application, Apple Distribution, Apple Development ve ardından bulunan ilk geçerli kod imzalama kimliği.
- `CODESIGN_TIMESTAMP=auto` (varsayılan), güvenilir zaman damgalarını yalnızca Developer ID Application imzaları için etkinleştirir. Her iki yönde zorlamak için `on`/`off` olarak ayarlayın.
- Hakkında sekmesinin derlemeyi, git bilgisini ve hata ayıklama/sürüm kanalını gösterebilmesi için Info.plist dosyasına `OpenClawBuildTimestamp` (ISO8601 UTC) ve `OpenClawGitCommit` (kısa karma; kullanılamıyorsa `unknown`) değerlerini ekler.
- İmzalamadan sonra bir Ekip Kimliği denetimi çalıştırır ve paket içindeki herhangi bir Mach-O farklı bir Ekip Kimliğine sahipse başarısız olur. Atlamak için `SKIP_TEAM_ID_CHECK=1` ayarlayın.

## Kullanım

```bash
# depo kökünden
scripts/package-mac-app.sh                                                      # kimliği otomatik seçer; kimlik bulunamazsa hata verir
SIGN_IDENTITY="Developer ID Application: Your Name" scripts/package-mac-app.sh   # gerçek sertifika
ALLOW_ADHOC_SIGNING=1 scripts/package-mac-app.sh                                 # geçici (izinler korunmaz)
SIGN_IDENTITY="-" scripts/package-mac-app.sh                                     # açıkça belirtilen geçici imzalama (aynı uyarı geçerlidir)
DISABLE_LIBRARY_VALIDATION=1 scripts/package-mac-app.sh                          # yalnızca geliştirme için Sparkle Ekip Kimliği uyuşmazlığı geçici çözümü
```

### Geçici imzalama notu

`SIGN_IDENTITY="-"`, uygulama aynı Ekip Kimliğini paylaşmayan gömülü çerçeveleri (Sparkle gibi) yüklediğinde çökmeleri önlemek için Güçlendirilmiş Çalışma Zamanı'nı (`--options runtime`) devre dışı bırakır. Geçici imzalar ayrıca TCC izinlerinin kalıcılığını da bozar; kurtarma adımları için [macOS izinleri](/tr/platforms/mac/permissions) sayfasına bakın.

## Hakkında için derleme meta verileri

Hakkında sekmesi; sürümü, derleme tarihini, git işlemesini ve derlemenin DEBUG olup olmadığını (`#if DEBUG` aracılığıyla) göstermek için Info.plist dosyasından `OpenClawBuildTimestamp` ve `OpenClawGitCommit` değerlerini okur. Bu değerleri yenilemek için kod değişikliklerinden sonra paketleyiciyi yeniden çalıştırın.

## İlgili

- [macOS uygulaması](/tr/platforms/macos)
- [macOS izinleri](/tr/platforms/mac/permissions)
