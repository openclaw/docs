---
read_when:
    - Telegram özellikleri veya Webhook'lar üzerinde çalışma
summary: Telegram bot desteğinin durumu, yetenekleri ve yapılandırması
title: Telegram
x-i18n:
    generated_at: "2026-05-10T19:24:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 87fc2994ced5e3c845b35f8c134ca04de317e83c3c2414de2dea4779a763f17e
    source_path: channels/telegram.md
    workflow: 16
---

Üretimde kullanıma hazır; grammY üzerinden bot DM'leri ve gruplar için. Varsayılan mod long polling'dir; Webhook modu isteğe bağlıdır.

<CardGroup cols={3}>
  <Card title="Eşleştirme" icon="link" href="/tr/channels/pairing">
    Telegram için varsayılan DM politikası eşleştirmedir.
  </Card>
  <Card title="Kanal sorun giderme" icon="wrench" href="/tr/channels/troubleshooting">
    Kanallar arası tanılama ve onarım çalışma planları.
  </Card>
  <Card title="Gateway yapılandırması" icon="settings" href="/tr/gateway/configuration">
    Tüm kanal yapılandırma desenleri ve örnekleri.
  </Card>
</CardGroup>

## Hızlı kurulum

<Steps>
  <Step title="BotFather'da bot token'ını oluşturun">
    Telegram'ı açın ve **@BotFather** ile sohbet edin (kullanıcı adının tam olarak `@BotFather` olduğunu doğrulayın).

    `/newbot` komutunu çalıştırın, istemleri izleyin ve token'ı kaydedin.

  </Step>

  <Step title="Token'ı ve DM politikasını yapılandırın">

```json5
{
  channels: {
    telegram: {
      enabled: true,
      botToken: "123:abc",
      dmPolicy: "pairing",
      groups: { "*": { requireMention: true } },
    },
  },
}
```

    Env geri dönüşü: `TELEGRAM_BOT_TOKEN=...` (yalnızca varsayılan hesap).
    Telegram, `openclaw channels login telegram` kullanmaz; token'ı config/env içinde yapılandırın, ardından gateway'i başlatın.

  </Step>

  <Step title="Gateway'i başlatın ve ilk DM'yi onaylayın">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    Eşleştirme kodlarının süresi 1 saat sonra dolar.

  </Step>

  <Step title="Botu bir gruba ekleyin">
    Botu grubunuza ekleyin, ardından erişim modelinize uyması için `channels.telegram.groups` ve `groupPolicy` ayarlarını belirleyin.
  </Step>
</Steps>

<Note>
Token çözümleme sırası hesap farkındadır. Pratikte config değerleri env geri dönüşüne üstün gelir ve `TELEGRAM_BOT_TOKEN` yalnızca varsayılan hesap için geçerlidir.
</Note>

## Telegram tarafı ayarları

<AccordionGroup>
  <Accordion title="Gizlilik modu ve grup görünürlüğü">
    Telegram botları varsayılan olarak **Gizlilik Modu** kullanır; bu, aldıkları grup mesajlarını sınırlar.

    Botun tüm grup mesajlarını görmesi gerekiyorsa şunlardan birini yapın:

    - `/setprivacy` üzerinden gizlilik modunu devre dışı bırakın, veya
    - botu grup yöneticisi yapın.

    Gizlilik modunu değiştirirken, Telegram'ın değişikliği uygulaması için her grupta botu kaldırıp yeniden ekleyin.

  </Accordion>

  <Accordion title="Grup izinleri">
    Yönetici durumu Telegram grup ayarlarında kontrol edilir.

    Yönetici botlar tüm grup mesajlarını alır; bu, her zaman açık grup davranışı için kullanışlıdır.

  </Accordion>

  <Accordion title="Yararlı BotFather anahtarları">

    - Grup eklemelerine izin vermek/reddetmek için `/setjoingroups`
    - Grup görünürlüğü davranışı için `/setprivacy`

  </Accordion>
</AccordionGroup>

## Erişim denetimi ve etkinleştirme

<Tabs>
  <Tab title="DM politikası">
    `channels.telegram.dmPolicy`, doğrudan mesaj erişimini kontrol eder:

    - `pairing` (varsayılan)
    - `allowlist` (`allowFrom` içinde en az bir gönderen ID'si gerektirir)
    - `open` (`allowFrom` içinde `"*"` bulunmasını gerektirir)
    - `disabled`

    `allowFrom: ["*"]` ile `dmPolicy: "open"`, bot kullanıcı adını bulan veya tahmin eden herhangi bir Telegram hesabının bota komut vermesine izin verir. Bunu yalnızca araçları sıkı şekilde sınırlandırılmış, bilinçli olarak herkese açık botlar için kullanın; tek sahipli botlar, sayısal kullanıcı ID'leriyle `allowlist` kullanmalıdır.

    `channels.telegram.allowFrom`, sayısal Telegram kullanıcı ID'lerini kabul eder. `telegram:` / `tg:` önekleri kabul edilir ve normalleştirilir.
    Çok hesaplı config'lerde, kısıtlayıcı üst düzey bir `channels.telegram.allowFrom` güvenlik sınırı olarak ele alınır: hesap düzeyindeki `allowFrom: ["*"]` girdileri, birleştirmeden sonra etkin hesap izin listesi hâlâ açık bir joker karakter içermedikçe o hesabı herkese açık yapmaz.
    Boş `allowFrom` ile `dmPolicy: "allowlist"` tüm DM'leri engeller ve config doğrulaması tarafından reddedilir.
    Kurulum yalnızca sayısal kullanıcı ID'leri ister.
    Yükseltme yaptıysanız ve config'iniz `@username` allowlist girdileri içeriyorsa, bunları çözümlemek için `openclaw doctor --fix` çalıştırın (en iyi çaba; Telegram bot token'ı gerektirir).
    Daha önce eşleştirme deposu allowlist dosyalarına güveniyorsanız, `openclaw doctor --fix` allowlist akışlarında girdileri `channels.telegram.allowFrom` içine kurtarabilir (örneğin `dmPolicy: "allowlist"` henüz açık ID içermediğinde).

    Tek sahipli botlar için, erişim politikasının config içinde kalıcı olmasını sağlamak üzere önceki eşleştirme onaylarına bağlı kalmak yerine açık sayısal `allowFrom` ID'leriyle `dmPolicy: "allowlist"` tercih edin.

    Yaygın kafa karışıklığı: DM eşleştirme onayı, "bu gönderen her yerde yetkilidir" anlamına gelmez.
    Eşleştirme DM erişimi verir. Henüz komut sahibi yoksa, ilk onaylanan eşleştirme `commands.ownerAllowFrom` değerini de ayarlar; böylece yalnızca sahibin kullanabildiği komutlar ve exec onayları için açık bir operatör hesabı olur.
    Grup gönderen yetkilendirmesi hâlâ açık config allowlist'lerinden gelir.
    "Bir kez yetkilendirildim ve hem DM'ler hem de grup komutları çalışsın" istiyorsanız, sayısal Telegram kullanıcı ID'nizi `channels.telegram.allowFrom` içine koyun; yalnızca sahip komutları için `commands.ownerAllowFrom` değerinin `telegram:<your user id>` içerdiğinden emin olun.

    ### Telegram kullanıcı ID'nizi bulma

    Daha güvenli (üçüncü taraf bot yok):

    1. Botunuza DM gönderin.
    2. `openclaw logs --follow` çalıştırın.
    3. `from.id` değerini okuyun.

    Resmi Bot API yöntemi:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    Üçüncü taraf yöntem (daha az özel): `@userinfobot` veya `@getidsbot`.

  </Tab>

  <Tab title="Grup politikası ve allowlist'ler">
    İki denetim birlikte uygulanır:

    1. **Hangi gruplara izin verilir** (`channels.telegram.groups`)
       - `groups` config'i yoksa:
         - `groupPolicy: "open"` ile: herhangi bir grup grup ID denetimlerinden geçebilir
         - `groupPolicy: "allowlist"` (varsayılan) ile: `groups` girdileri (veya `"*"`) eklenene kadar gruplar engellenir
       - `groups` yapılandırılmışsa: allowlist gibi davranır (açık ID'ler veya `"*"`)

    2. **Gruplarda hangi gönderenlere izin verilir** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (varsayılan)
       - `disabled`

    `groupAllowFrom`, grup gönderen filtrelemesi için kullanılır. Ayarlanmamışsa Telegram `allowFrom` değerine geri döner.
    `groupAllowFrom` girdileri sayısal Telegram kullanıcı ID'leri olmalıdır (`telegram:` / `tg:` önekleri normalleştirilir).
    Telegram grup veya süper grup sohbet ID'lerini `groupAllowFrom` içine koymayın. Negatif sohbet ID'leri `channels.telegram.groups` altında yer alır.
    Sayısal olmayan girdiler gönderen yetkilendirmesi için yok sayılır.
    Güvenlik sınırı (`2026.2.25+`): grup gönderen kimlik doğrulaması DM eşleştirme deposu onaylarını **devralmaz**.
    Eşleştirme yalnızca DM için kalır. Gruplar için `groupAllowFrom` ya da grup/konu başına `allowFrom` ayarlayın.
    `groupAllowFrom` ayarlanmamışsa Telegram eşleştirme deposuna değil, config `allowFrom` değerine geri döner.
    Tek sahipli botlar için pratik desen: kullanıcı ID'nizi `channels.telegram.allowFrom` içine ayarlayın, `groupAllowFrom` değerini ayarlamayın ve hedef gruplara `channels.telegram.groups` altında izin verin.
    Çalışma zamanı notu: `channels.telegram` tamamen eksikse, `channels.defaults.groupPolicy` açıkça ayarlanmadığı sürece çalışma zamanı güvenli kapalı `groupPolicy="allowlist"` varsayılanına döner.

    Örnek: belirli bir gruptaki herhangi bir üyeye izin verin:

```json5
{
  channels: {
    telegram: {
      groups: {
        "-1001234567890": {
          groupPolicy: "open",
          requireMention: false,
        },
      },
    },
  },
}
```

    Örnek: belirli bir grup içinde yalnızca belirli kullanıcılara izin verin:

```json5
{
  channels: {
    telegram: {
      groups: {
        "-1001234567890": {
          requireMention: true,
          allowFrom: ["8734062810", "745123456"],
        },
      },
    },
  },
}
```

    <Warning>
      Yaygın hata: `groupAllowFrom` bir Telegram grup allowlist'i değildir.

      - `-1001234567890` gibi negatif Telegram grup veya süper grup sohbet ID'lerini `channels.telegram.groups` altına koyun.
      - İzin verilen bir grup içinde hangi kişilerin botu tetikleyebileceğini sınırlamak istediğinizde `8734062810` gibi Telegram kullanıcı ID'lerini `groupAllowFrom` altına koyun.
      - `groupAllowFrom: ["*"]` değerini yalnızca izin verilen bir grubun herhangi bir üyesinin botla konuşabilmesini istediğinizde kullanın.

    </Warning>

  </Tab>

  <Tab title="Bahsetme davranışı">
    Grup yanıtları varsayılan olarak bahsetme gerektirir.

    Bahsetme şuradan gelebilir:

    - yerel `@botusername` bahsetmesi, veya
    - şunlardaki bahsetme desenleri:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Oturum düzeyinde komut anahtarları:

    - `/activation always`
    - `/activation mention`

    Bunlar yalnızca oturum durumunu günceller. Kalıcılık için config kullanın.

    Kalıcı config örneği:

```json5
{
  channels: {
    telegram: {
      groups: {
        "*": { requireMention: false },
      },
    },
  },
}
```

    Grup sohbet ID'sini alma:

    - bir grup mesajını `@userinfobot` / `@getidsbot` adresine iletin
    - veya `openclaw logs --follow` çıktısından `chat.id` değerini okuyun
    - veya Bot API `getUpdates` çıktısını inceleyin

  </Tab>
</Tabs>

## Çalışma zamanı davranışı

- Telegram, gateway sürecine aittir.
- Yönlendirme deterministiktir: Telegram'dan gelenler Telegram'a yanıt verir (model kanalları seçmez).
- Gelen mesajlar, yanıt meta verileri, medya yer tutucuları ve gateway'in gözlemlediği Telegram yanıtları için kalıcı yanıt zinciri bağlamıyla paylaşılan kanal zarfına normalleştirilir.
- Grup oturumları grup ID'sine göre yalıtılır. Forum konuları, konuları yalıtılmış tutmak için `:topic:<threadId>` ekler.
- DM mesajları `message_thread_id` taşıyabilir; OpenClaw yanıtlar için iş parçacığı ID'sini korur, ancak varsayılan olarak DM'leri düz oturumda tutar. Bilinçli olarak DM konu oturumu yalıtımı istediğinizde `channels.telegram.dm.threadReplies: "inbound"`, `channels.telegram.direct.<chatId>.threadReplies: "inbound"`, `requireTopic: true` veya eşleşen bir konu config'i yapılandırın.
- Long polling, sohbet başına/iş parçacığı başına sıralama ile grammY runner kullanır. Genel runner sink eşzamanlılığı `agents.defaults.maxConcurrent` kullanır.
- Long polling, her gateway süreci içinde korunur; böylece aynı anda yalnızca bir etkin poller bir bot token'ını kullanabilir. Hâlâ `getUpdates` 409 çakışmaları görüyorsanız, muhtemelen başka bir OpenClaw gateway'i, betiği veya harici poller aynı token'ı kullanıyordur.
- Long-polling watchdog yeniden başlatmaları, varsayılan olarak tamamlanmış `getUpdates` canlılığı olmadan 120 saniye sonra tetiklenir. Dağıtımınız uzun süren işler sırasında hâlâ yanlış polling-stall yeniden başlatmaları görüyorsa `channels.telegram.pollingStallThresholdMs` değerini artırın. Değer milisaniye cinsindedir ve `30000` ile `600000` arasında olabilir; hesap başına geçersiz kılmalar desteklenir.
- Telegram Bot API okundu bilgisi desteğine sahip değildir (`sendReadReceipts` geçerli değildir).

## Özellik başvurusu

<AccordionGroup>
  <Accordion title="Canlı akış önizlemesi (mesaj düzenlemeleri)">
    OpenClaw, kısmi yanıtları gerçek zamanlı olarak akışla gönderebilir:

    - doğrudan sohbetler: önizleme mesajı + `editMessageText`
    - gruplar/konular: önizleme mesajı + `editMessageText`

    Gereksinim:

    - `channels.telegram.streaming`, `off | partial | block | progress` değerlerinden biridir (varsayılan: `partial`)
    - `progress`, araç ilerlemesi için düzenlenebilir tek bir durum taslağı tutar, tamamlandığında bunu temizler ve son yanıtı normal mesaj olarak gönderir
    - `streaming.preview.toolProgress`, araç/ilerleme güncellemelerinin aynı düzenlenen önizleme mesajını yeniden kullanıp kullanmayacağını kontrol eder (varsayılan: önizleme akışı etkinken `true`)
    - `streaming.preview.commandText`, bu araç ilerlemesi satırlarının içindeki komut/exec ayrıntısını kontrol eder: `raw` (varsayılan, yayımlanmış davranışı korur) veya `status` (yalnızca araç etiketi)
    - eski `channels.telegram.streamMode` ve boolean `streaming` değerleri algılanır; bunları `channels.telegram.streaming.mode` değerine taşımak için `openclaw doctor --fix` çalıştırın

    Araç ilerlemesi önizleme güncellemeleri, araçlar çalışırken gösterilen kısa durum satırlarıdır; örneğin komut yürütme, dosya okumaları, planlama güncellemeleri veya yama özetleri. Telegram, `v2026.4.22` ve sonrasından yayımlanmış OpenClaw davranışıyla eşleşmesi için bunları varsayılan olarak etkin tutar. Yanıt metni için düzenlenen önizlemeyi koruyup araç ilerlemesi satırlarını gizlemek için şunu ayarlayın:

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "partial",
            "preview": {
              "toolProgress": false
            }
          }
        }
      }
    }
    ```

    Araç ilerlemesini görünür tutup komut/exec metnini gizlemek için şunu ayarlayın:

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "partial",
            "preview": {
              "commandText": "status"
            }
          }
        }
      }
    }
    ```

    Son yanıtı aynı iletiye düzenlemeden görünür araç ilerlemesi istediğinizde `progress` modunu kullanın. Komut metni politikasını `streaming.progress` altına koyun:

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "progress",
            "progress": {
              "toolProgress": true,
              "commandText": "status"
            }
          }
        }
      }
    }
    ```

    `streaming.mode: "off"` ayarını yalnızca sadece son yanıt teslimi istediğinizde kullanın: Telegram önizleme düzenlemeleri devre dışı bırakılır ve genel araç/ilerleme konuşmaları bağımsız durum iletileri olarak gönderilmek yerine bastırılır. Onay istemleri, medya yükleri ve hatalar yine normal son teslim yolundan geçer. Yalnızca araç ilerlemesi durum satırlarını gizlerken yanıt önizleme düzenlemelerini korumak istediğinizde `streaming.preview.toolProgress: false` kullanın.

    <Note>
      Telegram seçili alıntı yanıtları istisnadır. `replyToMode` `"first"`, `"all"` veya `"batched"` olduğunda ve gelen ileti seçili alıntı metni içerdiğinde OpenClaw, son yanıtı yanıt önizlemesini düzenlemek yerine Telegram'ın yerel alıntı-yanıt yolu üzerinden gönderir; bu nedenle `streaming.preview.toolProgress` o tur için kısa durum satırlarını gösteremez. Seçili alıntı metni olmayan mevcut ileti yanıtları önizleme akışını korumaya devam eder. Araç ilerlemesi görünürlüğü yerel alıntı yanıtlarından daha önemli olduğunda `replyToMode: "off"` ayarlayın veya bu ödünleşimi kabul etmek için `streaming.preview.toolProgress: false` ayarlayın.
    </Note>

    Yalnızca metin yanıtları için:

    - kısa DM/grup/konu önizlemelerinde OpenClaw aynı önizleme iletisini korur ve son düzenlemeyi yerinde yapar
    - birden fazla Telegram iletisine bölünen uzun metin son yanıtları, mümkün olduğunda mevcut önizlemeyi ilk son parça olarak yeniden kullanır, ardından yalnızca kalan parçaları gönderir
    - ilerleme modu son yanıtları durum taslağını temizler ve taslağı yanıta düzenlemek yerine normal son teslimi kullanır
    - tamamlanan metin onaylanmadan önce son düzenleme başarısız olursa OpenClaw normal son teslimi kullanır ve eski önizlemeyi temizler

    Karmaşık yanıtlar için (örneğin medya yükleri) OpenClaw normal son teslime geri döner ve ardından önizleme iletisini temizler.

    Önizleme akışı, blok akışından ayrıdır. Telegram için blok akışı açıkça etkinleştirildiğinde OpenClaw çift akışı önlemek için önizleme akışını atlar.

    Yalnızca Telegram'a özgü akıl yürütme akışı:

    - `/reasoning stream`, üretim sırasında akıl yürütmeyi canlı önizlemeye gönderir
    - akıl yürütme önizlemesi son teslimden sonra silinir; akıl yürütmenin görünür kalması gerektiğinde `/reasoning on` kullanın
    - son yanıt akıl yürütme metni olmadan gönderilir

  </Accordion>

  <Accordion title="Biçimlendirme ve HTML yedeği">
    Giden metin Telegram `parse_mode: "HTML"` kullanır.

    - Markdown benzeri metin Telegram açısından güvenli HTML'ye dönüştürülür.
    - Ham model HTML'si, Telegram ayrıştırma hatalarını azaltmak için escape edilir.
    - Telegram ayrıştırılmış HTML'yi reddederse OpenClaw düz metin olarak yeniden dener.

    Bağlantı önizlemeleri varsayılan olarak etkindir ve `channels.telegram.linkPreview: false` ile devre dışı bırakılabilir.

  </Accordion>

  <Accordion title="Yerel komutlar ve özel komutlar">
    Telegram komut menüsü kaydı başlangıçta `setMyCommands` ile işlenir.

    Yerel komut varsayılanları:

    - `commands.native: "auto"` Telegram için yerel komutları etkinleştirir

    Özel komut menüsü girdileri ekleyin:

```json5
{
  channels: {
    telegram: {
      customCommands: [
        { command: "backup", description: "Git backup" },
        { command: "generate", description: "Create an image" },
      ],
    },
  },
}
```

    Kurallar:

    - adlar normalleştirilir (baştaki `/` kaldırılır, küçük harfe çevrilir)
    - geçerli desen: `a-z`, `0-9`, `_`, uzunluk `1..32`
    - özel komutlar yerel komutları geçersiz kılamaz
    - çakışmalar/yinelenenler atlanır ve günlüğe yazılır

    Notlar:

    - özel komutlar yalnızca menü girdileridir; davranışı otomatik olarak uygulamazlar
    - plugin/skill komutları Telegram menüsünde gösterilmese bile yazıldığında yine çalışabilir

    Yerel komutlar devre dışı bırakılırsa yerleşikler kaldırılır. Özel/Plugin komutları yapılandırılmışsa yine kaydolabilir.

    Yaygın kurulum hataları:

    - `BOT_COMMANDS_TOO_MUCH` ile `setMyCommands failed`, Telegram menüsünün kırpıldıktan sonra bile taşmaya devam ettiği anlamına gelir; plugin/skill/özel komutları azaltın veya `channels.telegram.commands.native` ayarını devre dışı bırakın.
    - Doğrudan Bot API curl komutları çalışırken `deleteWebhook`, `deleteMyCommands` veya `setMyCommands` işleminin `404: Not Found` ile başarısız olması, `channels.telegram.apiRoot` değerinin tam `/bot<TOKEN>` uç noktasına ayarlandığı anlamına gelebilir. `apiRoot` yalnızca Bot API kökü olmalıdır ve `openclaw doctor --fix` yanlışlıkla eklenen sondaki `/bot<TOKEN>` kısmını kaldırır.
    - `getMe returned 401`, Telegram'ın yapılandırılmış bot token'ını reddettiği anlamına gelir. `botToken`, `tokenFile` veya `TELEGRAM_BOT_TOKEN` değerini güncel BotFather token'ı ile güncelleyin; OpenClaw yoklamadan önce durur, bu nedenle bu bir Webhook temizleme hatası olarak bildirilmez.
    - Ağ/fetch hatalarıyla `setMyCommands failed` genellikle `api.telegram.org` adresine giden DNS/HTTPS trafiğinin engellendiği anlamına gelir.

    ### Cihaz eşleştirme komutları (`device-pair` plugin)

    `device-pair` plugin kurulu olduğunda:

    1. `/pair` kurulum kodu üretir
    2. kodu iOS uygulamasına yapıştırın
    3. `/pair pending` bekleyen istekleri listeler (rol/kapsamlar dahil)
    4. isteği onaylayın:
       - açık onay için `/pair approve <requestId>`
       - yalnızca bir bekleyen istek olduğunda `/pair approve`
       - en sonuncu için `/pair approve latest`

    Kurulum kodu kısa ömürlü bir bootstrap token'ı taşır. Yerleşik bootstrap devri, birincil node token'ını `scopes: []` düzeyinde tutar; devredilen operatör token'ı `operator.approvals`, `operator.read`, `operator.talk.secrets` ve `operator.write` ile sınırlı kalır. Bootstrap kapsam denetimleri rol öneklidir; bu nedenle söz konusu operatör allowlist'i yalnızca operatör isteklerini karşılar, operatör olmayan rollerin yine kendi rol önekleri altında kapsamlara ihtiyacı vardır.

    Bir cihaz değişmiş kimlik doğrulama ayrıntılarıyla (örneğin rol/kapsamlar/açık anahtar) yeniden denerse önceki bekleyen istek yerine yenisi geçer ve yeni istek farklı bir `requestId` kullanır. Onaylamadan önce `/pair pending` komutunu yeniden çalıştırın.

    Daha fazla ayrıntı: [Eşleştirme](/tr/channels/pairing#pair-via-telegram-recommended-for-ios).

  </Accordion>

  <Accordion title="Satır içi düğmeler">
    Satır içi klavye kapsamını yapılandırın:

```json5
{
  channels: {
    telegram: {
      capabilities: {
        inlineButtons: "allowlist",
      },
    },
  },
}
```

    Hesap başına geçersiz kılma:

```json5
{
  channels: {
    telegram: {
      accounts: {
        main: {
          capabilities: {
            inlineButtons: "allowlist",
          },
        },
      },
    },
  },
}
```

    Kapsamlar:

    - `off`
    - `dm`
    - `group`
    - `all`
    - `allowlist` (varsayılan)

    Eski `capabilities: ["inlineButtons"]`, `inlineButtons: "all"` ayarına eşlenir.

    İleti eylemi örneği:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "Choose an option:",
  buttons: [
    [
      { text: "Yes", callback_data: "yes" },
      { text: "No", callback_data: "no" },
    ],
    [{ text: "Cancel", callback_data: "cancel" }],
  ],
}
```

    Geri çağırma tıklamaları ajana metin olarak iletilir:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="Ajanlar ve otomasyon için Telegram ileti eylemleri">
    Telegram araç eylemleri şunları içerir:

    - `sendMessage` (`to`, `content`, isteğe bağlı `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, isteğe bağlı `iconColor`, `iconCustomEmojiId`)

    Kanal ileti eylemleri ergonomik takma adlar sunar (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Geçit denetimleri:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (varsayılan: devre dışı)

    Not: `edit` ve `topic-create` şu anda varsayılan olarak etkindir ve ayrı `channels.telegram.actions.*` açma kapama ayarlarına sahip değildir.
    Çalışma zamanı gönderimleri etkin yapılandırma/gizli bilgiler anlık görüntüsünü (başlangıç/yeniden yükleme) kullanır; bu nedenle eylem yolları gönderim başına geçici SecretRef yeniden çözümlemesi yapmaz.

    Tepki kaldırma semantiği: [/tools/reactions](/tr/tools/reactions)

  </Accordion>

  <Accordion title="Yanıt iş parçacığı etiketleri">
    Telegram, üretilen çıktıda açık yanıt iş parçacığı etiketlerini destekler:

    - `[[reply_to_current]]` tetikleyen iletiye yanıt verir
    - `[[reply_to:<id>]]` belirli bir Telegram ileti kimliğine yanıt verir

    `channels.telegram.replyToMode` işlemeyi kontrol eder:

    - `off` (varsayılan)
    - `first`
    - `all`

    Yanıt iş parçacığı etkinleştirildiğinde ve özgün Telegram metni veya açıklaması mevcut olduğunda OpenClaw otomatik olarak yerel bir Telegram alıntı kesiti ekler. Telegram yerel alıntı metnini 1024 UTF-16 kod birimiyle sınırlar; bu nedenle daha uzun iletiler baştan alıntılanır ve Telegram alıntıyı reddederse düz yanıta geri döner.

    Not: `off` örtük yanıt iş parçacığını devre dışı bırakır. Açık `[[reply_to_*]]` etiketleri yine de dikkate alınır.

  </Accordion>

  <Accordion title="Forum konuları ve iş parçacığı davranışı">
    Forum süper grupları:

    - konu oturum anahtarları `:topic:<threadId>` ekler
    - yanıtlar ve yazıyor eylemleri konu iş parçacığını hedefler
    - konu yapılandırma yolu:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Genel konu (`threadId=1`) özel durumu:

    - ileti gönderimleri `message_thread_id` değerini atlar (Telegram `sendMessage(...thread_id=1)` işlemini reddeder)
    - yazıyor eylemleri yine `message_thread_id` içerir

    Konu kalıtımı: konu girdileri, geçersiz kılınmadıkça grup ayarlarını devralır (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` yalnızca konuya özgüdür ve grup varsayılanlarından devralınmaz.

    **Konu başına ajan yönlendirme**: Her konu, konu yapılandırmasında `agentId` ayarlanarak farklı bir ajana yönlendirilebilir. Bu, her konuya kendi yalıtılmış çalışma alanını, belleğini ve oturumunu verir. Örnek:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // General topic → main agent
                "3": { agentId: "zu" },        // Dev topic → zu agent
                "5": { agentId: "coder" }      // Code review → coder agent
              }
            }
          }
        }
      }
    }
    ```

    Sonra her konunun kendi oturum anahtarı olur: `agent:zu:telegram:group:-1001234567890:topic:3`

    **Kalıcı ACP konu bağlama**: Forum konuları, üst düzey tipli ACP bağlamaları üzerinden ACP harness oturumlarını sabitleyebilir (`type: "acp"` ve `match.channel: "telegram"`, `peer.kind: "group"` içeren `bindings[]` ve `-1001234567890:topic:42` gibi konu nitelemeli bir kimlik). Şu anda gruplar/süper gruplardaki forum konularıyla sınırlıdır. Bkz. [ACP Ajanları](/tr/tools/acp-agents).

    **Sohbetten iş parçacığına bağlı ACP spawn**: `/acp spawn <agent> --thread here|auto` mevcut konuyu yeni bir ACP oturumuna bağlar; takip iletileri doğrudan oraya yönlendirilir. OpenClaw spawn onayını konu içinde sabitler. `channels.telegram.threadBindings.spawnSessions` ayarının etkin kalmasını gerektirir (varsayılan: `true`).

    Şablon bağlamı `MessageThreadId` ve `IsForum` öğelerini sunar. `message_thread_id` içeren DM sohbetleri varsayılan olarak düz oturumlarda DM yönlendirmesini ve yanıt meta verilerini korur; ileti dizisine duyarlı oturum anahtarlarını yalnızca `threadReplies: "inbound"`, `threadReplies: "always"`, `requireTopic: true` veya eşleşen bir konu yapılandırmasıyla yapılandırıldıklarında kullanırlar. Hesap varsayılanı için üst düzey `channels.telegram.dm.threadReplies`, tek bir DM için `direct.<chatId>.threadReplies` kullanın.

  </Accordion>

  <Accordion title="Ses, video ve çıkartmalar">
    ### Ses mesajları

    Telegram, sesli notları ses dosyalarından ayırır.

    - varsayılan: ses dosyası davranışı
    - sesli not gönderimini zorlamak için ajan yanıtında `[[audio_as_voice]]` etiketi
    - gelen sesli not dökümleri, ajan bağlamında makine tarafından üretilmiş,
      güvenilmeyen metin olarak çerçevelenir; bahsetme algılama yine ham
      dökümü kullanır, böylece bahsetme kapılı sesli mesajlar çalışmaya devam eder.

    Mesaj eylemi örneği:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/voice.ogg",
  asVoice: true,
}
```

    ### Video mesajları

    Telegram, video dosyalarını video notlarından ayırır.

    Mesaj eylemi örneği:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/video.mp4",
  asVideoNote: true,
}
```

    Video notları altyazıları desteklemez; sağlanan mesaj metni ayrı olarak gönderilir.

    ### Çıkartmalar

    Gelen çıkartma işleme:

    - statik WEBP: indirilir ve işlenir (yer tutucu `<media:sticker>`)
    - animasyonlu TGS: atlanır
    - video WEBM: atlanır

    Çıkartma bağlam alanları:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    Çıkartma önbellek dosyası:

    - `~/.openclaw/telegram/sticker-cache.json`

    Çıkartmalar bir kez açıklanır (mümkün olduğunda) ve yinelenen görüntü çağrılarını azaltmak için önbelleğe alınır.

    Çıkartma eylemlerini etkinleştirme:

```json5
{
  channels: {
    telegram: {
      actions: {
        sticker: true,
      },
    },
  },
}
```

    Çıkartma gönderme eylemi:

```json5
{
  action: "sticker",
  channel: "telegram",
  to: "123456789",
  fileId: "CAACAgIAAxkBAAI...",
}
```

    Önbelleğe alınmış çıkartmaları arama:

```json5
{
  action: "sticker-search",
  channel: "telegram",
  query: "cat waving",
  limit: 5,
}
```

  </Accordion>

  <Accordion title="Tepki bildirimleri">
    Telegram tepkileri, mesaj yüklerinden ayrı olarak `message_reaction` güncellemeleri şeklinde gelir.

    Etkinleştirildiğinde OpenClaw şu tür sistem olaylarını kuyruğa alır:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Yapılandırma:

    - `channels.telegram.reactionNotifications`: `off | own | all` (varsayılan: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (varsayılan: `minimal`)

    Notlar:

    - `own`, yalnızca bot tarafından gönderilen mesajlara kullanıcı tepkileri anlamına gelir (gönderilen mesaj önbelleği üzerinden en iyi çabayla).
    - Tepki olayları yine Telegram erişim denetimlerine (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`) uyar; yetkisiz gönderenler atılır.
    - Telegram, tepki güncellemelerinde ileti dizisi kimlikleri sağlamaz.
      - forum dışı gruplar grup sohbeti oturumuna yönlendirilir
      - forum grupları, tam kaynak konuya değil grup genel konu oturumuna (`:topic:1`) yönlendirilir

    Yoklama/Webhook için `allowed_updates`, `message_reaction` öğesini otomatik olarak içerir.

  </Accordion>

  <Accordion title="Onay tepkileri">
    `ackReaction`, OpenClaw gelen bir mesajı işlerken bir onay emojisi gönderir.

    Çözümleme sırası:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - ajan kimliği emoji yedeği (`agents.list[].identity.emoji`, yoksa "👀")

    Notlar:

    - Telegram unicode emoji bekler (örneğin "👀").
    - Bir kanal veya hesap için tepkiyi devre dışı bırakmak üzere `""` kullanın.

  </Accordion>

  <Accordion title="Telegram olaylarından ve komutlarından yapılandırma yazımları">
    Kanal yapılandırması yazımları varsayılan olarak etkindir (`configWrites !== false`).

    Telegram tarafından tetiklenen yazımlar şunları içerir:

    - `channels.telegram.groups` öğesini güncellemek için grup taşıma olayları (`migrate_to_chat_id`)
    - `/config set` ve `/config unset` (komutun etkinleştirilmesini gerektirir)

    Devre dışı bırakma:

```json5
{
  channels: {
    telegram: {
      configWrites: false,
    },
  },
}
```

  </Accordion>

  <Accordion title="Uzun yoklama ve Webhook">
    Varsayılan uzun yoklamadır. Webhook modu için `channels.telegram.webhookUrl` ve `channels.telegram.webhookSecret` ayarlayın; isteğe bağlı `webhookPath`, `webhookHost`, `webhookPort` (varsayılanlar `/telegram-webhook`, `127.0.0.1`, `8787`).

    Uzun yoklama modunda OpenClaw, yeniden başlatma filigranını yalnızca bir güncelleme başarıyla dağıtıldıktan sonra kalıcı hale getirir. Bir işleyici başarısız olursa, bu güncelleme aynı süreçte yeniden denenebilir kalır ve yeniden başlatma tekilleştirmesi için tamamlanmış olarak yazılmaz.

    Yerel dinleyici `127.0.0.1:8787` adresine bağlanır. Genel giriş için yerel bağlantı noktasının önüne bir ters proxy koyun veya bilinçli olarak `webhookHost: "0.0.0.0"` ayarlayın.

    Webhook modu, Telegram'a `200` döndürmeden önce istek korumalarını, Telegram gizli belirtecini ve JSON gövdesini doğrular.
    OpenClaw daha sonra güncellemeyi, uzun yoklamada kullanılan aynı sohbet başına/konu başına bot şeritleri üzerinden eşzamansız olarak işler; böylece yavaş ajan dönüşleri Telegram'ın teslim ACK yanıtını bekletmez.

  </Accordion>

  <Accordion title="Sınırlar, yeniden deneme ve CLI hedefleri">
    - `channels.telegram.textChunkLimit` varsayılanı 4000'dir.
    - `channels.telegram.chunkMode="newline"`, uzunluğa göre bölmeden önce paragraf sınırlarını (boş satırlar) tercih eder.
    - `channels.telegram.mediaMaxMb` (varsayılan 100), gelen ve giden Telegram medya boyutunu sınırlar.
    - `channels.telegram.mediaGroupFlushMs` (varsayılan 500), Telegram albümlerinin/medya gruplarının OpenClaw bunları tek bir gelen mesaj olarak dağıtmadan önce ne kadar süre arabelleğe alınacağını denetler. Albüm parçaları geç geliyorsa artırın; albüm yanıt gecikmesini azaltmak için düşürün.
    - `channels.telegram.timeoutSeconds`, Telegram API istemcisi zaman aşımını geçersiz kılar (ayarlanmamışsa grammY varsayılanı uygulanır). Bot istemcileri, yapılandırılmış değerleri 60 saniyelik giden metin/yazıyor isteği korumasının altında sınırlar; böylece grammY, OpenClaw'ın taşıma koruması ve yedeği çalışmadan önce görünür yanıt teslimini iptal etmez. Uzun yoklama, boşta kalan yoklamaların süresiz terk edilmemesi için yine 45 saniyelik bir `getUpdates` isteği koruması kullanır.
    - `channels.telegram.pollingStallThresholdMs` varsayılan olarak `120000` değerindedir; yalnızca yanlış pozitif yoklama-takılması yeniden başlatmaları için `30000` ile `600000` arasında ayarlayın.
    - grup bağlam geçmişi `channels.telegram.historyLimit` veya `messages.groupChat.historyLimit` kullanır (varsayılan 50); `0` devre dışı bırakır.
    - yanıt/alıntı/iletme ek bağlamı, Gateway üst mesajları gözlemlediğinde seçilen tek bir konuşma bağlam penceresine normalleştirilir; gözlemlenen mesaj önbelleği oturum deposunun yanında kalıcı hale getirilir. Telegram güncellemelerde yalnızca sığ bir `reply_to_message` içerir, bu yüzden önbellekten daha eski zincirler Telegram'ın mevcut güncelleme yüküyle sınırlıdır.
    - Telegram izin listeleri esas olarak ajanı kimin tetikleyebileceğini kapılar; tam bir ek bağlam redaksiyon sınırı değildir.
    - DM geçmişi denetimleri:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - `channels.telegram.retry` yapılandırması, kurtarılabilir giden API hataları için Telegram gönderme yardımcılarına (CLI/araçlar/eylemler) uygulanır. Gelen son yanıt teslimi de Telegram ön bağlantı hataları için sınırlı bir güvenli gönderme yeniden denemesi kullanır, ancak görünür mesajları çoğaltabilecek belirsiz gönderim sonrası ağ zarflarını yeniden denemez.

    CLI ve mesaj aracı gönderme hedefleri sayısal sohbet kimliği, kullanıcı adı veya bir forum konusu hedefi olabilir:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
openclaw message send --channel telegram --target -1001234567890:topic:42 --message "hi topic"
```

    Telegram yoklamaları `openclaw message poll` kullanır ve forum konularını destekler:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    Yalnızca Telegram'a özgü yoklama bayrakları:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - forum konuları için `--thread-id` (veya bir `:topic:` hedefi kullanın)

    Telegram gönderimi ayrıca şunları destekler:

    - `channels.telegram.capabilities.inlineButtons` izin verdiğinde satır içi klavyeler için `buttons` bloklarıyla `--presentation`
    - bot o sohbette sabitleyebildiğinde sabitlenmiş teslim istemek için `--pin` veya `--delivery '{"pin":true}'`
    - giden görselleri ve GIF'leri sıkıştırılmış fotoğraf veya animasyonlu medya yüklemeleri yerine belge olarak göndermek için `--force-document`

    Eylem kapılama:

    - `channels.telegram.actions.sendMessage=false`, yoklamalar dahil giden Telegram mesajlarını devre dışı bırakır
    - `channels.telegram.actions.poll=false`, düzenli gönderimleri etkin bırakırken Telegram yoklaması oluşturmayı devre dışı bırakır

  </Accordion>

  <Accordion title="Telegram'da exec onayları">
    Telegram, onaylayıcı DM'lerinde exec onaylarını destekler ve isteğe bağlı olarak istemleri kaynak sohbette veya konuda yayımlayabilir. Onaylayıcılar sayısal Telegram kullanıcı kimlikleri olmalıdır.

    Yapılandırma yolu:

    - `channels.telegram.execApprovals.enabled` (en az bir onaylayıcı çözümlenebilir olduğunda otomatik etkinleşir)
    - `channels.telegram.execApprovals.approvers` (`commands.ownerAllowFrom` içindeki sayısal sahip kimliklerine geri döner)
    - `channels.telegram.execApprovals.target`: `dm` (varsayılan) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` ve `defaultTo`, botla kimin konuşabileceğini ve normal yanıtları nereye göndereceğini denetler. Birini exec onaylayıcısı yapmazlar. İlk onaylanmış DM eşleştirmesi, henüz komut sahibi yoksa `commands.ownerAllowFrom` öğesini başlatır; böylece tek sahipli kurulum, `execApprovals.approvers` altında kimlikleri yinelemeden çalışmaya devam eder.

    Kanal teslimi komut metnini sohbette gösterir; `channel` veya `both` öğesini yalnızca güvenilir gruplarda/konularda etkinleştirin. İstem bir forum konusuna ulaştığında OpenClaw, onay istemi ve takip için konuyu korur. Exec onayları varsayılan olarak 30 dakika sonra sona erer.

    Satır içi onay düğmeleri ayrıca hedef yüzeye (`dm`, `group` veya `all`) izin vermek için `channels.telegram.capabilities.inlineButtons` gerektirir. `plugin:` ile öneklenen onay kimlikleri Plugin onayları üzerinden çözümlenir; diğerleri önce exec onayları üzerinden çözümlenir.

    Bkz. [Exec onayları](/tr/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Hata yanıtı denetimleri

Ajan bir teslim veya sağlayıcı hatasıyla karşılaştığında Telegram, hata metniyle yanıt verebilir veya bunu bastırabilir. Bu davranışı iki yapılandırma anahtarı denetler:

| Anahtar                             | Değerler          | Varsayılan | Açıklama                                                                                       |
| ----------------------------------- | ----------------- | ---------- | ---------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply`    | `reply`, sohbete dostça bir hata mesajı gönderir. `silent`, hata yanıtlarını tamamen bastırır. |
| `channels.telegram.errorCooldownMs` | sayı (ms)         | `60000`    | Aynı sohbete hata yanıtları arasındaki minimum süre. Kesintiler sırasında hata spam'ini önler. |

Hesap başına, grup başına ve konu başına geçersiz kılmalar desteklenir (diğer Telegram yapılandırma anahtarlarıyla aynı kalıtım).

```json5
{
  channels: {
    telegram: {
      errorPolicy: "reply",
      errorCooldownMs: 120000,
      groups: {
        "-1001234567890": {
          errorPolicy: "silent", // suppress errors in this group
        },
      },
    },
  },
}
```

## Sorun giderme

<AccordionGroup>
  <Accordion title="Bot does not respond to non mention group messages">

    - `requireMention=false` ise Telegram gizlilik modu tam görünürlüğe izin vermelidir.
      - BotFather: `/setprivacy` -> Devre dışı bırak
      - ardından botu gruptan kaldırıp yeniden ekleyin
    - Yapılandırma bahsedilmeyen grup iletileri beklediğinde `openclaw channels status` uyarır.
    - `openclaw channels status --probe` açık sayısal grup kimliklerini denetleyebilir; joker karakter `"*"` için üyelik yoklaması yapılamaz.
    - hızlı oturum testi: `/activation always`.

  </Accordion>

  <Accordion title="Bot not seeing group messages at all">

    - `channels.telegram.groups` varsa grup listelenmiş olmalıdır (veya `"*"` içermelidir)
    - botun gruptaki üyeliğini doğrulayın
    - atlama nedenleri için günlükleri inceleyin: `openclaw logs --follow`

  </Accordion>

  <Accordion title="Commands work partially or not at all">

    - gönderen kimliğinizi yetkilendirin (eşleme ve/veya sayısal `allowFrom`)
    - grup ilkesi `open` olsa bile komut yetkilendirmesi yine de geçerlidir
    - `BOT_COMMANDS_TOO_MUCH` ile `setMyCommands failed`, yerel menüde çok fazla giriş olduğu anlamına gelir; plugin/skill/özel komutları azaltın veya yerel menüleri devre dışı bırakın
    - Başlatma sırasında yapılan `deleteMyCommands` / `setMyCommands` çağrıları ve `sendChatAction` yazıyor çağrıları sınırlıdır ve istek zaman aşımında Telegram'ın aktarım yedeği üzerinden bir kez yeniden denenir. Kalıcı ağ/fetch hataları genellikle `api.telegram.org` için DNS/HTTPS erişilebilirlik sorunlarına işaret eder

  </Accordion>

  <Accordion title="Startup reports unauthorized token">

    - `getMe returned 401`, yapılandırılmış bot belirteci için bir Telegram kimlik doğrulama hatasıdır.
    - BotFather içinde bot belirtecini yeniden kopyalayın veya yeniden oluşturun, ardından varsayılan hesap için `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken` veya `TELEGRAM_BOT_TOKEN` değerini güncelleyin.
    - Başlatma sırasında `deleteWebhook 401 Unauthorized` da bir kimlik doğrulama hatasıdır; bunu "webhook yok" gibi ele almak aynı hatalı belirteç hatasını yalnızca sonraki API çağrılarına ertelemiş olur.

  </Accordion>

  <Accordion title="Polling or network instability">

    - Node 22+ ve özel fetch/proxy, AbortSignal türleri uyuşmazsa anında iptal davranışını tetikleyebilir.
    - Bazı barındırıcılar `api.telegram.org` adresini önce IPv6 olarak çözer; bozuk IPv6 çıkışı aralıklı Telegram API hatalarına neden olabilir.
    - Günlüklerde `TypeError: fetch failed` veya `Network request for 'getUpdates' failed!` varsa OpenClaw artık bunları kurtarılabilir ağ hataları olarak yeniden dener.
    - Polling başlangıcı sırasında OpenClaw, grammY için başarılı başlatma `getMe` yoklamasını yeniden kullanır; böylece çalıştırıcının ilk `getUpdates` öncesinde ikinci bir `getMe` çağrısına ihtiyacı olmaz.
    - Polling başlangıcı sırasında `deleteWebhook` geçici bir ağ hatasıyla başarısız olursa OpenClaw, başka bir ön-poll denetim düzlemi çağrısı yapmak yerine long polling'e devam eder. Hâlâ etkin olan bir webhook, `getUpdates` çakışması olarak görünür; OpenClaw daha sonra Telegram aktarımını yeniden oluşturur ve webhook temizliğini yeniden dener.
    - Telegram soketleri kısa ve sabit bir aralıkla yeniden döngüye giriyorsa düşük bir `channels.telegram.timeoutSeconds` değeri olup olmadığını kontrol edin; bot istemcileri yapılandırılmış değerleri giden ve `getUpdates` istek korumalarının altındaysa sınırlar, ancak eski sürümler bu değer bu korumaların altına ayarlandığında her poll veya yanıtı iptal edebilirdi.
    - Günlüklerde `Polling stall detected` varsa OpenClaw, varsayılan olarak tamamlanmış long-poll canlılığı olmadan 120 saniye geçtikten sonra polling'i yeniden başlatır ve Telegram aktarımını yeniden oluşturur.
    - `openclaw channels status --probe` ve `openclaw doctor`, çalışan bir polling hesabı başlatma toleransından sonra `getUpdates` tamamlamadığında, çalışan bir webhook hesabı başlatma toleransından sonra `setWebhook` tamamlamadığında veya son başarılı polling aktarım etkinliği eskidiğinde uyarır.
    - `channels.telegram.pollingStallThresholdMs` değerini yalnızca uzun süren `getUpdates` çağrıları sağlıklı olduğu halde barındırıcınız yanlış polling-stall yeniden başlatmaları bildiriyorsa artırın. Kalıcı duraklamalar genellikle barındırıcı ile `api.telegram.org` arasındaki proxy, DNS, IPv6 veya TLS çıkış sorunlarına işaret eder.
    - Telegram ayrıca Bot API aktarımı için `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` ve bunların küçük harfli varyantları dahil olmak üzere süreç proxy ortam değişkenlerini de dikkate alır. `NO_PROXY` / `no_proxy` yine de `api.telegram.org` adresini atlayabilir.
    - OpenClaw yönetimli proxy bir hizmet ortamı için `OPENCLAW_PROXY_URL` üzerinden yapılandırılmışsa ve standart proxy ortam değişkeni yoksa Telegram da Bot API aktarımı için bu URL'yi kullanır.
    - Kararsız doğrudan çıkış/TLS olan VPS barındırıcılarında Telegram API çağrılarını `channels.telegram.proxy` üzerinden yönlendirin:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ varsayılan olarak `autoSelectFamily=true` kullanır (WSL2 hariç). Telegram DNS sonuç sırası önce `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`, sonra `channels.telegram.network.dnsResultOrder`, sonra da `NODE_OPTIONS=--dns-result-order=ipv4first` gibi süreç varsayılanını izler; hiçbiri geçerli değilse Node 22+ `ipv4first` değerine geri döner.
    - Barındırıcınız WSL2 ise veya açıkça yalnızca IPv4 davranışıyla daha iyi çalışıyorsa aile seçimini zorlayın:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - RFC 2544 karşılaştırma aralığı yanıtlarına (`198.18.0.0/15`) Telegram medya indirmeleri için varsayılan olarak zaten izin verilir. Güvenilir bir fake-IP veya şeffaf proxy, medya indirmeleri sırasında `api.telegram.org` adresini başka bir özel/dahili/özel kullanımlı adrese yeniden yazıyorsa yalnızca Telegram için geçerli baypasa katılabilirsiniz:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - Aynı katılım hesap başına
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork` konumunda kullanılabilir.
    - Proxy'niz Telegram medya barındırıcılarını `198.18.x.x` adreslerine çözüyorsa önce tehlikeli bayrağı kapalı bırakın. Telegram medyası RFC 2544 karşılaştırma aralığına varsayılan olarak zaten izin verir.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork`, Telegram medya SSRF korumalarını zayıflatır. Bunu yalnızca Clash, Mihomo veya Surge fake-IP yönlendirmesi gibi güvenilir operatör denetimli proxy ortamlarında, RFC 2544 karşılaştırma aralığı dışındaki özel veya özel kullanımlı yanıtlar ürettiklerinde kullanın. Normal genel internet Telegram erişimi için kapalı bırakın.
    </Warning>

    - Ortam geçersiz kılmaları (geçici):
      - `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`
      - `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`
    - DNS yanıtlarını doğrulayın:

```bash
dig +short api.telegram.org A
dig +short api.telegram.org AAAA
```

  </Accordion>
</AccordionGroup>

Daha fazla yardım: [Kanal sorun giderme](/tr/channels/troubleshooting).

## Yapılandırma başvurusu

Birincil başvuru: [Yapılandırma başvurusu - Telegram](/tr/gateway/config-channels#telegram).

<Accordion title="High-signal Telegram fields">

- başlatma/kimlik doğrulama: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` normal bir dosyayı göstermelidir; sembolik bağlantılar reddedilir)
- erişim denetimi: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, üst düzey `bindings[]` (`type: "acp"`)
- yürütme onayları: `execApprovals`, `accounts.*.execApprovals`
- komut/menü: `commands.native`, `commands.nativeSkills`, `customCommands`
- iş parçacığı/yanıtlar: `replyToMode`, `dm.threadReplies`, `direct.*.threadReplies`
- akış: `streaming` (önizleme), `streaming.preview.toolProgress`, `blockStreaming`
- biçimlendirme/teslim: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- medya/ağ: `mediaMaxMb`, `mediaGroupFlushMs`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- özel API kökü: `apiRoot` (yalnızca Bot API kökü; `/bot<TOKEN>` eklemeyin)
- webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- eylemler/yetenekler: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- tepkiler: `reactionNotifications`, `reactionLevel`
- hatalar: `errorPolicy`, `errorCooldownMs`
- yazmalar/geçmiş: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
Çok hesaplı öncelik: iki veya daha fazla hesap kimliği yapılandırıldığında varsayılan yönlendirmeyi açık hale getirmek için `channels.telegram.defaultAccount` ayarlayın (veya `channels.telegram.accounts.default` ekleyin). Aksi halde OpenClaw ilk normalleştirilmiş hesap kimliğine geri döner ve `openclaw doctor` uyarır. Adlandırılmış hesaplar `channels.telegram.allowFrom` / `groupAllowFrom` değerlerini devralır, ancak `accounts.default.*` değerlerini devralmaz.
</Note>

## İlgili

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/tr/channels/pairing">
    Bir Telegram kullanıcısını gateway ile eşleyin.
  </Card>
  <Card title="Groups" icon="users" href="/tr/channels/groups">
    Grup ve konu izin listesi davranışı.
  </Card>
  <Card title="Channel routing" icon="route" href="/tr/channels/channel-routing">
    Gelen iletileri aracılara yönlendirin.
  </Card>
  <Card title="Security" icon="shield" href="/tr/gateway/security">
    Tehdit modeli ve sıkılaştırma.
  </Card>
  <Card title="Multi-agent routing" icon="sitemap" href="/tr/concepts/multi-agent">
    Grupları ve konuları aracılarla eşleyin.
  </Card>
  <Card title="Troubleshooting" icon="wrench" href="/tr/channels/troubleshooting">
    Kanallar arası tanılama.
  </Card>
</CardGroup>
