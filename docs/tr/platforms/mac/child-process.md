---
read_when:
    - Mac uygulamasını Gateway yaşam döngüsüyle entegre ediyorsanız
summary: macOS'ta Gateway yaşam döngüsü (launchd)
title: Gateway Yaşam Döngüsü
x-i18n:
    generated_at: "2026-04-05T14:00:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 73e7eb64ef432c3bfc81b949a5cc2a344c64f2310b794228609aae1da817ec41
    source_path: platforms/mac/child-process.md
    workflow: 15
---

# macOS'ta Gateway yaşam döngüsü

macOS uygulaması varsayılan olarak **Gateway'i launchd aracılığıyla yönetir** ve
Gateway'i bir alt süreç olarak başlatmaz. Önce yapılandırılan bağlantı noktasında
zaten çalışan bir Gateway'e bağlanmayı dener; erişilebilir bir tane yoksa,
harici `openclaw` CLI aracılığıyla launchd hizmetini etkinleştirir (gömülü çalışma zamanı yoktur). Bu size
oturum açıldığında güvenilir otomatik başlatma ve çökme durumunda yeniden başlatma sağlar.

Alt süreç modu (Gateway'in doğrudan uygulama tarafından başlatılması) bugün **kullanılmamaktadır**.
Kullanıcı arayüzüyle daha sıkı bir bağlantıya ihtiyacınız varsa, Gateway'i bir terminalde manuel olarak çalıştırın.

## Varsayılan davranış (launchd)

- Uygulama, `ai.openclaw.gateway` etiketli kullanıcı başına bir LaunchAgent kurar
  (`--profile`/`OPENCLAW_PROFILE` kullanıldığında `ai.openclaw.<profile>`; eski `com.openclaw.*` desteklenir).
- Yerel mod etkin olduğunda, uygulama LaunchAgent'ın yüklü olduğundan emin olur ve
  gerekirse Gateway'i başlatır.
- Günlükler launchd gateway günlük yoluna yazılır (Hata Ayıklama Ayarları'nda görülebilir).

Yaygın komutlar:

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

Adlandırılmış bir profil çalıştırırken etiketi `ai.openclaw.<profile>` ile değiştirin.

## İmzasız geliştirme derlemeleri

`scripts/restart-mac.sh --no-sign`, imzalama anahtarlarınız olmadığında hızlı yerel derlemeler içindir.
launchd'nin imzasız bir relay ikili dosyasına işaret etmesini önlemek için şunu yapar:

- `~/.openclaw/disable-launchagent` dosyasını yazar.

`scripts/restart-mac.sh` komutunun imzalı çalıştırmaları, işaretçi mevcutsa bu geçersiz kılmayı temizler.
Manuel olarak sıfırlamak için:

```bash
rm ~/.openclaw/disable-launchagent
```

## Yalnızca bağlanma modu

macOS uygulamasının launchd'yi **asla kurmamasını veya yönetmemesini** zorlamak için,
uygulamayı `--attach-only` (veya `--no-launchd`) ile başlatın. Bu, `~/.openclaw/disable-launchagent`
ayarını belirler; böylece uygulama yalnızca zaten çalışan bir Gateway'e bağlanır. Aynı
davranışı Hata Ayıklama Ayarları'nda da değiştirebilirsiniz.

## Uzak mod

Uzak mod hiçbir zaman yerel bir Gateway başlatmaz. Uygulama uzak ana makineye bir SSH tüneli kullanır
ve bu tünel üzerinden bağlanır.

## Neden launchd'yi tercih ediyoruz

- Oturum açıldığında otomatik başlatma.
- Yerleşik yeniden başlatma/KeepAlive anlam bilgisi.
- Öngörülebilir günlükler ve gözetim.

Gerçek bir alt süreç moduna yeniden ihtiyaç duyulursa, bunun ayrı, açık bir yalnızca geliştirme modu olarak
belgelenmesi gerekir.
