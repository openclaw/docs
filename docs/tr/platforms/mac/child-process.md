---
read_when:
    - Mac uygulamasını Gateway yaşam döngüsüyle entegre etme
summary: macOS’ta Gateway yaşam döngüsü (launchd)
title: macOS’te Gateway yaşam döngüsü
x-i18n:
    generated_at: "2026-05-06T09:21:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: 543327024f8c635d74ac656923e8e745dc47ca9df0aba5ec51215bd186db2b35
    source_path: platforms/mac/child-process.md
    workflow: 16
---

macOS uygulaması varsayılan olarak **Gateway'i launchd üzerinden yönetir** ve Gateway'i bir alt süreç olarak başlatmaz. Önce yapılandırılmış bağlantı noktasında hâlihazırda çalışan bir Gateway'e bağlanmayı dener; erişilebilir bir tane yoksa, harici `openclaw` CLI üzerinden launchd hizmetini etkinleştirir (gömülü runtime yoktur). Bu, oturum açıldığında güvenilir otomatik başlatma ve çökmelerde yeniden başlatma sağlar.

Alt süreç modu (Gateway'in doğrudan uygulama tarafından başlatılması) bugün **kullanımda değildir**. UI ile daha sıkı bağlantı kurmanız gerekiyorsa Gateway'i bir terminalde elle çalıştırın.

## Varsayılan davranış (launchd)

- Uygulama, `ai.openclaw.gateway` etiketli kullanıcı başına bir LaunchAgent yükler
  (veya `--profile`/`OPENCLAW_PROFILE` kullanılırken `ai.openclaw.<profile>`; eski `com.openclaw.*` desteklenir).
- Yerel mod etkinleştirildiğinde, uygulama LaunchAgent'ın yüklü olduğundan emin olur ve
  gerekirse Gateway'i başlatır.
- Günlükler launchd gateway günlük yoluna yazılır (Hata Ayıklama Ayarları'nda görünür).

Yaygın komutlar:

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

Adlandırılmış bir profil çalıştırırken etiketi `ai.openclaw.<profile>` ile değiştirin.

## İmzasız geliştirme derlemeleri

`scripts/restart-mac.sh --no-sign`, imzalama anahtarlarınız olmadığında hızlı yerel derlemeler içindir. launchd'nin imzasız bir relay ikilisine işaret etmesini önlemek için şunu yapar:

- `~/.openclaw/disable-launchagent` dosyasını yazar.

`scripts/restart-mac.sh` komutunun imzalı çalıştırmaları, işaretleyici mevcutsa bu geçersiz kılmayı temizler. Elle sıfırlamak için:

```bash
rm ~/.openclaw/disable-launchagent
```

## Yalnızca bağlanma modu

macOS uygulamasını **launchd'yi asla yüklemeyecek veya yönetmeyecek** şekilde zorlamak için
`--attach-only` (veya `--no-launchd`) ile başlatın. Bu, `~/.openclaw/disable-launchagent` değerini ayarlar; böylece uygulama yalnızca hâlihazırda çalışan bir Gateway'e bağlanır. Aynı davranışı Hata Ayıklama Ayarları'nda açıp kapatabilirsiniz.

## Uzak mod

Uzak mod hiçbir zaman yerel bir Gateway başlatmaz. Uygulama uzak ana makineye bir SSH tüneli kullanır ve bu tünel üzerinden bağlanır.

## Neden launchd'yi tercih ediyoruz

- Oturum açıldığında otomatik başlatma.
- Yerleşik yeniden başlatma/KeepAlive semantiği.
- Öngörülebilir günlükler ve gözetim.

Gerçek bir alt süreç moduna yeniden ihtiyaç duyulursa, ayrı ve açıkça yalnızca geliştirmeye yönelik bir mod olarak belgelenmelidir.

## İlgili

- [macOS uygulaması](/tr/platforms/macos)
- [Gateway runbook](/tr/gateway)
