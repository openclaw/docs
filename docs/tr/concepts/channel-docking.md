---
read_when:
    - Etkin bir oturuma ait yanıtların Telegram'dan Discord, Slack, Mattermost veya bağlı başka bir kanala taşınmasını istiyorsunuz
    - Kanallar arası doğrudan mesajlar için session.identityLinks yapılandırıyorsunuz
    - Bir /dock komutu, gönderenin bağlantılı olmadığını veya etkin bir oturum bulunmadığını söylüyor
summary: Bir OpenClaw oturumunun yanıt rotasını bağlı sohbet kanalları arasında taşıyın
title: Kanal bağlama
x-i18n:
    generated_at: "2026-07-12T12:13:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6d7af3a59b95b2c73cb74a9529584e51caed055719db2df8aad2ba8e8c9b0593
    source_path: concepts/channel-docking.md
    workflow: 16
---

Kanal yönlendirme, tek bir OpenClaw oturumu için çağrı yönlendirme işlevi görür. Aynı
konuşma bağlamını korur ancak bu oturumun gelecekteki yanıtlarının teslim
edileceği yeri değiştirir. Yönlendirme yalnızca doğrudan sohbetten çalışır; grup
sohbetinden çalışmaz.

## Örnek

Alice, Telegram ve Discord üzerinden OpenClaw'a mesaj gönderebilir:

```json5
{
  session: {
    identityLinks: {
      alice: ["telegram:123", "discord:456"],
    },
  },
}
```

Alice bunu bir Telegram doğrudan sohbetinden gönderirse:

```text
/dock_discord
```

OpenClaw mevcut oturum bağlamını korur ve yanıt rotasını değiştirir:

| Yönlendirmeden önce              | `/dock_discord` sonrasında      |
| -------------------------------- | ------------------------------- |
| Yanıtlar Telegram `123`'e gider  | Yanıtlar Discord `456`'ya gider |

Oturum yeniden oluşturulmaz. Transkript geçmişi aynı oturuma bağlı kalır.

## Neden kullanılır?

Bir görev bir sohbet uygulamasında başladığı hâlde sonraki yanıtların başka bir
yere ulaşması gerektiğinde yönlendirmeyi kullanın.

Yaygın akış:

1. Telegram'dan bir aracı görevi başlatın.
2. Çalışmayı koordine ettiğiniz Discord'a geçin.
3. Telegram doğrudan sohbetinden `/dock_discord` gönderin.
4. Aynı OpenClaw oturumunu koruyun ancak gelecekteki yanıtları Discord'da alın.

## Gerekli yapılandırma

Yönlendirme için `session.identityLinks` gereklidir. Kaynak gönderen ile hedef eş
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

Değerler, kanal öneki içeren eş kimlikleridir:

| Değer          | Anlamı                            |
| -------------- | --------------------------------- |
| `telegram:123` | Telegram gönderen kimliği `123`   |
| `discord:456`  | Discord doğrudan eş kimliği `456` |
| `slack:U123`   | Slack kullanıcı kimliği `U123`    |

Kanonik anahtar (yukarıdaki `alice`) yalnızca paylaşılan kimlik grubunun adıdır.
Yönlendirme komutları, kaynak gönderen ile hedef eşin aynı kişi olduğunu kanıtlamak
için kanal öneki içeren değerleri kullanır.

## Komutlar

OpenClaw, yerel komutları destekleyen yüklü her kanal Plugin'i için bir
`/dock-<channel>` komutu oluşturur; dolayısıyla Plugin'ler eklendikçe liste
genişler. Şu anda bunu destekleyen paketlenmiş Plugin'ler:

| Hedef kanal | Komut              | Takma ad            |
| ----------- | ------------------- | ------------------- |
| Discord     | `/dock-discord`     | `/dock_discord`     |
| Mattermost  | `/dock-mattermost`  | `/dock_mattermost`  |
| Slack       | `/dock-slack`       | `/dock_slack`       |
| Telegram    | `/dock-telegram`    | `/dock_telegram`    |

Alt çizgili biçim, eğik çizgi komutlarını doğrudan sunan Telegram gibi
yüzeylerdeki yerel komut adıdır.

## Neler değişir?

Yönlendirme, etkin oturumun teslimat alanlarını günceller:

| Oturum alanı    | `/dock_discord` sonrasındaki örnek       |
| --------------- | ---------------------------------------- |
| `lastChannel`   | `discord`                                |
| `lastTo`        | `456`                                    |
| `lastAccountId` | hedef kanal hesabı veya `default`        |

Bu alanlar oturum deposunda kalıcı olarak saklanır ve söz konusu oturumun sonraki
yanıt teslimatlarında kullanılır.

## Neler değişmez?

Yönlendirme şunları yapmaz:

- kanal hesapları oluşturmaz
- yeni bir Discord, Telegram, Slack veya Mattermost botu bağlamaz
- bir kullanıcıya erişim izni vermez
- kanal izin listelerini veya doğrudan mesaj politikalarını atlamaz
- transkript geçmişini başka bir oturuma taşımaz
- ilgisiz kullanıcıların bir oturumu paylaşmasını sağlamaz

Yalnızca mevcut oturumun teslimat rotasını değiştirir.

## Sorun giderme

**Komut, gönderenin bağlantılı olmadığını söylüyor.**

Hem mevcut göndereni hem de hedef eşi aynı `session.identityLinks` grubuna
ekleyin. Örneğin, Telegram göndereni `123` Discord eşi `456`'ya yönlendirilecekse
hem `telegram:123` hem de `discord:456` değerlerini ekleyin.

**Komut, yönlendirmenin yalnızca doğrudan sohbetlerden kullanılabildiğini söylüyor.**

Yönlendirme komutunu grup sohbetinden değil, OpenClaw ile doğrudan sohbetten
gönderin.

**Komut, etkin bir oturum bulunmadığını söylüyor.**

Mevcut bir doğrudan sohbet oturumundan yönlendirme yapın. Komutun yeni rotayı
kalıcı olarak saklayabilmesi için etkin bir oturum kaydı gerekir.

**Yanıtlar hâlâ eski kanala gidiyor.**

Komutun bir başarı mesajıyla yanıt verdiğini kontrol edin ve hedef eş kimliğinin
ilgili kanalın kullandığı kimlikle eşleştiğini doğrulayın. Yönlendirme yalnızca
etkin oturum rotasını değiştirir; başka bir oturum hâlâ farklı bir yere
yönlendiriliyor olabilir.

**Geri dönmem gerekiyor.**

Bağlantılı bir gönderenden, özgün kanal için `/dock_telegram` veya
`/dock-telegram` gibi eşleşen komutu gönderin.
