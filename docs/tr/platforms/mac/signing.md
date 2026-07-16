---
read_when:
    - Mac hata ayıklama derlemelerini oluşturma veya imzalama
summary: Paketleme betikleri tarafından oluşturulan macOS hata ayıklama derlemeleri için imzalama adımları
title: macOS imzalama
x-i18n:
    generated_at: "2026-07-16T17:22:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 406211dadc9293cf7983e75ae7dd98234f9088351234cf06c33df2f63d1b9b97
    source_path: platforms/mac/signing.md
    workflow: 16
---

# mac imzalama (hata ayıklama derlemeleri)

[`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh), uygulamayı sabit bir yolda (`dist/OpenClaw.app`) derleyip paketler, ardından imzalamak için [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh) betiğini çağırır. TCC izinleri paket kimliğine ve kod imzasına bağlıdır; yeniden derlemeler arasında her ikisinin de kararlı tutulması (ve uygulamanın sabit bir yolda bulunması), macOS'in TCC izinlerini (bildirimler, erişilebilirlik, ekran kaydı, mikrofon, konuşma) unutmasını önler.

- Hata ayıklama paket tanımlayıcısının varsayılan değeri `ai.openclaw.mac.debug` şeklindedir (`BUNDLE_ID=...` ile geçersiz kılın).
- Node: `>=22.22.3 <23`, `>=24.15.0 <25` veya `>=25.9.0` (depo `package.json` `engines`). Paketleyici, Control UI'ı da derler (`pnpm ui:build`).
- Varsayılan olarak gerçek bir imzalama kimliği gerektirir; hiçbir kimlik bulunamazsa ve `ALLOW_ADHOC_SIGNING` ayarlanmamışsa codesign betiği bir hatayla çıkar. Geçici imzalama (`SIGN_IDENTITY="-"`) açıkça etkinleştirilmelidir ve yeniden derlemeler arasında TCC izinlerini korumaz. Bkz. [macOS izinleri](/tr/platforms/mac/permissions).
- Ortamdan `SIGN_IDENTITY` değerini okur (ör. `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"` veya bir Developer ID Application sertifikası). Bu değer olmadan `codesign-mac-app.sh`, şu sırayla otomatik olarak bir kimlik seçer: Developer ID Application, Apple Distribution, Apple Development ve ardından bulunan ilk geçerli kod imzalama kimliği.
- `CODESIGN_TIMESTAMP=auto` (varsayılan), güvenilir zaman damgalarını yalnızca Developer ID Application imzaları için etkinleştirir. Her iki yönde de zorlamak için `on`/`off` ayarlayın.
- About sekmesinin derleme, git ve hata ayıklama/sürüm kanalını gösterebilmesi için Info.plist dosyasına `OpenClawBuildTimestamp` (ISO8601 UTC) ve `OpenClawGitCommit` (kısa karma, kullanılamıyorsa `unknown`) değerlerini işler.
- İmzalamadan sonra bir Team ID denetimi çalıştırır ve paket içindeki herhangi bir Mach-O farklı bir Team ID'ye sahipse başarısız olur. Atlamak için `SKIP_TEAM_ID_CHECK=1` ayarlayın.

## Kullanım

```bash
# depo kökünden
scripts/package-mac-app.sh                                                      # kimliği otomatik seçer; kimlik bulunamazsa hata verir
SIGN_IDENTITY="Developer ID Application: Your Name" scripts/package-mac-app.sh   # gerçek sertifika
ALLOW_ADHOC_SIGNING=1 scripts/package-mac-app.sh                                 # geçici (izinler korunmaz)
SIGN_IDENTITY="-" scripts/package-mac-app.sh                                     # açıkça geçici (aynı uyarı geçerlidir)
DISABLE_LIBRARY_VALIDATION=1 scripts/package-mac-app.sh                          # yalnızca geliştirme için Sparkle Team ID uyuşmazlığı geçici çözümü
```

### Geçici imzalama notu

`SIGN_IDENTITY="-"`, uygulama aynı Team ID'yi paylaşmayan gömülü framework'leri (Sparkle gibi) yüklediğinde oluşabilecek çökmeleri önlemek için Hardened Runtime'ı (`--options runtime`) devre dışı bırakır. Geçici imzalar, TCC izinlerinin kalıcılığını da bozar; kurtarma adımları için [macOS izinleri](/tr/platforms/mac/permissions) bölümüne bakın.

## About için derleme meta verileri

About sekmesi; sürümü, derleme tarihini, git commit'ini ve derlemenin DEBUG olup olmadığını (`#if DEBUG` aracılığıyla) göstermek için Info.plist dosyasından `OpenClawBuildTimestamp` ve `OpenClawGitCommit` değerlerini okur. Bu değerleri yenilemek için kod değişikliklerinden sonra paketleyiciyi yeniden çalıştırın.

## İlgili

- [macOS uygulaması](/tr/platforms/macos)
- [macOS izinleri](/tr/platforms/mac/permissions)
