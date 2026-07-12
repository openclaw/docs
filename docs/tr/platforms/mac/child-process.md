---
read_when:
    - Mac uygulamasını Gateway yaşam döngüsüyle bütünleştirme
summary: macOS’te Gateway yaşam döngüsü (launchd)
title: macOS’ta Gateway yaşam döngüsü
x-i18n:
    generated_at: "2026-07-12T12:26:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 89a27334afcecb322feb2732cf6282b4c286ef27828a1b57157f9d4fc161aed6
    source_path: platforms/mac/child-process.md
    workflow: 16
---

macOS uygulaması varsayılan olarak Gateway'i **launchd** aracılığıyla yönetir ve
Gateway'i bir alt süreç olarak başlatmaz. Önce yapılandırılmış bağlantı noktasında
hâlihazırda çalışan bir Gateway'e bağlanmayı dener; erişilebilen bir Gateway yoksa
harici `openclaw` CLI aracılığıyla launchd hizmetini etkinleştirir (yerleşik çalışma
zamanı yoktur). Bu, oturum açıldığında güvenilir otomatik başlatma ve çökmelerden
sonra yeniden başlatma sağlar.

Alt süreç modu (Gateway'in doğrudan uygulama tarafından başlatılması) günümüzde
**kullanılmamaktadır**. Kullanıcı arayüzüyle daha sıkı bir bağlantıya ihtiyacınız
varsa Gateway'i bir terminalde manuel olarak çalıştırın.

## Varsayılan davranış (launchd)

- Uygulama, `ai.openclaw.gateway` etiketli kullanıcı başına bir LaunchAgent yükler
  (`--profile`/`OPENCLAW_PROFILE` kullanılırken `ai.openclaw.<profile>`).
- Yerel mod etkinleştirildiğinde uygulama, LaunchAgent'ın yüklendiğinden emin olur
  ve gerekirse Gateway'i başlatır.
- Günlükler launchd Gateway günlük yoluna yazılır (Hata Ayıklama Ayarları'nda
  görülebilir).

Yaygın komutlar:

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

Adlandırılmış bir profil çalıştırırken etiketi `ai.openclaw.<profile>` ile
değiştirin.

## İmzasız geliştirme derlemeleri

`scripts/restart-mac.sh --no-sign`, imzalama anahtarları olmadan hızlı yerel
derlemeler içindir. launchd'nin imzasız bir aktarma ikili dosyasını göstermesini
önlemek için `~/.openclaw/disable-launchagent` dosyasını oluşturur.

`scripts/restart-mac.sh` komutunun imzalı çalıştırmaları, işaretçi mevcutsa bu
geçersiz kılmayı temizler. Manuel olarak sıfırlamak için:

```bash
rm ~/.openclaw/disable-launchagent
```

## Yalnızca bağlanma modu

macOS uygulamasının launchd'yi hiçbir zaman yüklememesini veya yönetmemesini
sağlamak için uygulamayı `--attach-only` (veya `--no-launchd`) ile başlatın. Bu,
`~/.openclaw/disable-launchagent` dosyasını oluşturur; böylece uygulama yalnızca
hâlihazırda çalışan bir Gateway'e bağlanır. Aynı davranışı Hata Ayıklama
Ayarları'ndan açıp kapatabilirsiniz.

## Uzak mod

Uzak mod hiçbir zaman yerel bir Gateway başlatmaz. Uygulama, uzak ana makineye
bir SSH tüneli kullanır ve bu tünel üzerinden bağlanır.

## Neden launchd'yi tercih ediyoruz?

- Oturum açıldığında otomatik başlatma.
- Yerleşik yeniden başlatma/KeepAlive semantiği.
- Öngörülebilir günlükler ve gözetim.

Gerçek bir alt süreç moduna yeniden ihtiyaç duyulursa bu mod, yalnızca geliştirme
amaçlı ayrı ve açık bir mod olarak belgelenmelidir.

## İlgili

- [macOS uygulaması](/tr/platforms/macos)
- [Gateway işletim kılavuzu](/tr/gateway)
