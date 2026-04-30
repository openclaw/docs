---
read_when:
    - Bir etkin oturuma ait yanıtların Telegram’dan Discord’a, Slack’e, Mattermost’a veya başka bir bağlı kanala taşınmasını istiyorsunuz
    - Kanallar arası doğrudan mesajlar için session.identityLinks değerini yapılandırıyorsunuz
    - Bir /dock komutu, gönderenin bağlı olmadığını veya etkin oturum bulunmadığını belirtiyor
summary: Bir OpenClaw oturumunun yanıt rotasını bağlantılı sohbet kanalları arasında taşıyın
title: Kanal bağlama
x-i18n:
    generated_at: "2026-04-30T09:15:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: b981cd177ed76194cf18667620a1f9b2f2ba50df42fe203f6f68916971ed6a61
    source_path: concepts/channel-docking.md
    workflow: 16
---

Kanal bağlama, bir OpenClaw oturumu için çağrı yönlendirmedir.

Aynı konuşma bağlamını korur, ancak o oturum için gelecekteki yanıtların
teslim edileceği yeri değiştirir.

## Örnek

Alice, OpenClaw'a Telegram ve Discord üzerinden mesaj gönderebilir:

```json5
{
  session: {
    identityLinks: {
      alice: ["telegram:123", "discord:456"],
    },
  },
}
```

Alice bunu Telegram'dan gönderirse:

```text
/dock_discord
```

OpenClaw mevcut oturum bağlamını korur ve yanıt rotasını değiştirir:

| Bağlama öncesi               | `/dock_discord` sonrası      |
| ---------------------------- | ---------------------------- |
| Yanıtlar Telegram `123`'e gider | Yanıtlar Discord `456`'ya gider |

Oturum yeniden oluşturulmaz. Döküm geçmişi aynı oturuma bağlı kalır.

## Neden kullanılır

Bir görev bir sohbet uygulamasında başladığında, ancak sonraki yanıtların
başka bir yere ulaşması gerektiğinde bağlamayı kullanın.

Yaygın akış:

1. Telegram'dan bir aracı görevi başlatın.
2. Çalışmayı koordine ettiğiniz Discord'a geçin.
3. Telegram oturumundan `/dock_discord` gönderin.
4. Aynı OpenClaw oturumunu koruyun, ancak gelecekteki yanıtları Discord'da alın.

## Gerekli yapılandırma

Bağlama için `session.identityLinks` gerekir. Kaynak gönderen ve hedef eş
aynı kimlik grubunda olmalıdır:

```json5
{
  session: {
    identityLinks: {
      alice: ["telegram:123", "discord:456", "slack:U123"],
    },
  },
}
```

Değerler kanal önekli eş kimlikleridir:

| Değer          | Anlam                        |
| -------------- | ---------------------------- |
| `telegram:123` | Telegram gönderen kimliği `123` |
| `discord:456`  | Discord doğrudan eş kimliği `456` |
| `slack:U123`   | Slack kullanıcı kimliği `U123` |

Kanonik anahtar (yukarıdaki `alice`) yalnızca paylaşılan kimlik grubu adıdır. Bağlama
komutları, kaynak gönderenin ve hedef eşin aynı kişi olduğunu kanıtlamak için
kanal önekli değerleri kullanır.

## Komutlar

Bağlama komutları, yerel komutları destekleyen yüklü kanal pluginlerinden
oluşturulur. Mevcut paketli komutlar:

| Hedef kanal | Komut              | Takma ad           |
| ----------- | ------------------ | ------------------ |
| Discord     | `/dock-discord`    | `/dock_discord`    |
| Mattermost  | `/dock-mattermost` | `/dock_mattermost` |
| Slack       | `/dock-slack`      | `/dock_slack`      |
| Telegram    | `/dock-telegram`   | `/dock_telegram`   |

Alt çizgili takma adlar, Telegram gibi yerel komut yüzeylerinde kullanışlıdır.

## Ne değişir

Bağlama, etkin oturum teslim alanlarını günceller:

| Oturum alanı   | `/dock_discord` sonrası örnek           |
| -------------- | --------------------------------------- |
| `lastChannel`  | `discord`                               |
| `lastTo`       | `456`                                   |
| `lastAccountId` | hedef kanal hesabı veya `default`      |

Bu alanlar oturum deposunda kalıcı hale getirilir ve o oturum için sonraki yanıt
tesliminde kullanılır.

## Ne değişmez

Bağlama şunları yapmaz:

- kanal hesapları oluşturmaz
- yeni bir Discord, Telegram, Slack veya Mattermost botu bağlamaz
- bir kullanıcıya erişim vermez
- kanal izin listelerini veya DM politikalarını atlamaz
- döküm geçmişini başka bir oturuma taşımaz
- ilişkisiz kullanıcıların bir oturumu paylaşmasını sağlamaz

Yalnızca mevcut oturum için teslim rotasını değiştirir.

## Sorun giderme

**Komut, gönderenin bağlantılı olmadığını söylüyor.**

Hem mevcut göndereni hem de hedef eşi aynı `session.identityLinks` grubuna
ekleyin. Örneğin, Telegram göndereni `123` Discord eşi `456`'ya bağlanmalıysa,
hem `telegram:123` hem de `discord:456` ekleyin.

**Komut, etkin oturum olmadığını söylüyor.**

Mevcut bir doğrudan sohbet oturumundan bağlayın. Komutun yeni rotayı kalıcı hale
getirebilmesi için etkin bir oturum girdisine ihtiyacı vardır.

**Yanıtlar hâlâ eski kanala gidiyor.**

Komutun bir başarı mesajıyla yanıt verdiğini kontrol edin ve hedef eş kimliğinin
o kanal tarafından kullanılan kimlikle eşleştiğini doğrulayın. Bağlama yalnızca
etkin oturum rotasını değiştirir; başka bir oturum hâlâ başka bir yere
yönleniyor olabilir.

**Geri dönmem gerekiyor.**

Bağlı bir gönderenden, özgün kanal için eşleşen komutu gönderin; örneğin
`/dock_telegram` veya `/dock-telegram`.
