---
read_when:
    - Telegram özellikleri veya Webhook'lar üzerinde çalışma
summary: Telegram bot destek durumu, özellikleri ve yapılandırması
title: Telegram
x-i18n:
    generated_at: "2026-05-02T20:41:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4b5a733970f21e6b5a145b9ebb13134fb8e18b81fa0c723607019837c60f5497
    source_path: channels/telegram.md
    workflow: 16
---

Bot DM'leri ve grupları için grammY ile üretime hazır. Varsayılan mod long polling'dir; Webhook modu isteğe bağlıdır.

<CardGroup cols={3}>
  <Card title="Eşleştirme" icon="link" href="/tr/channels/pairing">
    Telegram için varsayılan DM ilkesi eşleştirmedir.
  </Card>
  <Card title="Kanal sorun giderme" icon="wrench" href="/tr/channels/troubleshooting">
    Kanallar arası tanılama ve onarım çalışma planları.
  </Card>
  <Card title="Gateway yapılandırması" icon="settings" href="/tr/gateway/configuration">
    Tam kanal yapılandırma kalıpları ve örnekleri.
  </Card>
</CardGroup>

## Hızlı kurulum

<Steps>
  <Step title="BotFather'da bot belirtecini oluşturun">
    Telegram'ı açın ve **@BotFather** ile sohbet edin (kullanıcı adının tam olarak `@BotFather` olduğunu doğrulayın).

    `/newbot` komutunu çalıştırın, istemleri izleyin ve belirteci kaydedin.

  </Step>

  <Step title="Belirteci ve DM ilkesini yapılandırın">

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
    Telegram **`openclaw channels login telegram`** kullanmaz; belirteci config/env içinde yapılandırın, ardından Gateway'i başlatın.

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
    Botu grubunuza ekleyin, ardından erişim modelinize uyacak şekilde `channels.telegram.groups` ve `groupPolicy` ayarlarını yapın.
  </Step>
</Steps>

<Note>
Belirteç çözümleme sırası hesaba duyarlıdır. Pratikte config değerleri env geri dönüşüne göre önceliklidir ve `TELEGRAM_BOT_TOKEN` yalnızca varsayılan hesaba uygulanır.
</Note>

## Telegram tarafı ayarları

<AccordionGroup>
  <Accordion title="Gizlilik modu ve grup görünürlüğü">
    Telegram botları varsayılan olarak **Privacy Mode** kullanır; bu, gruplarda hangi iletileri alabileceklerini sınırlar.

    Botun tüm grup iletilerini görmesi gerekiyorsa şunlardan birini yapın:

    - `/setprivacy` ile gizlilik modunu devre dışı bırakın, veya
    - botu grup yöneticisi yapın.

    Gizlilik modunu değiştirirken Telegram'ın değişikliği uygulaması için botu her gruptan kaldırıp yeniden ekleyin.

  </Accordion>

  <Accordion title="Grup izinleri">
    Yönetici durumu Telegram grup ayarlarında denetlenir.

    Yönetici botlar tüm grup iletilerini alır; bu, her zaman açık grup davranışı için kullanışlıdır.

  </Accordion>

  <Accordion title="Yararlı BotFather anahtarları">

    - Grup eklemelerine izin vermek/reddetmek için `/setjoingroups`
    - Grup görünürlüğü davranışı için `/setprivacy`

  </Accordion>
</AccordionGroup>

## Erişim denetimi ve etkinleştirme

<Tabs>
  <Tab title="DM ilkesi">
    `channels.telegram.dmPolicy` doğrudan ileti erişimini denetler:

    - `pairing` (varsayılan)
    - `allowlist` (`allowFrom` içinde en az bir gönderici kimliği gerektirir)
    - `open` (`allowFrom` değerinin `"*"` içermesini gerektirir)
    - `disabled`

    `allowFrom: ["*"]` ile `dmPolicy: "open"`, bot kullanıcı adını bulan veya tahmin eden herhangi bir Telegram hesabının bota komut vermesine izin verir. Bunu yalnızca araçları sıkı biçimde kısıtlanmış, kasıtlı olarak herkese açık botlar için kullanın; tek sahipli botlar sayısal kullanıcı kimlikleriyle `allowlist` kullanmalıdır.

    `channels.telegram.allowFrom` sayısal Telegram kullanıcı kimliklerini kabul eder. `telegram:` / `tg:` önekleri kabul edilir ve normalleştirilir.
    Çok hesaplı yapılandırmalarda, kısıtlayıcı üst düzey `channels.telegram.allowFrom` bir güvenlik sınırı olarak ele alınır: hesap düzeyindeki `allowFrom: ["*"]` girdileri, birleştirmeden sonra etkin hesap izin listesinde hâlâ açık bir joker karakter bulunmadıkça o hesabı herkese açık yapmaz.
    Boş `allowFrom` ile `dmPolicy: "allowlist"` tüm DM'leri engeller ve config doğrulaması tarafından reddedilir.
    Kurulum yalnızca sayısal kullanıcı kimliklerini ister.
    Yükseltme yaptıysanız ve config dosyanızda `@username` izin listesi girdileri varsa bunları çözümlemek için `openclaw doctor --fix` çalıştırın (en iyi çaba; bir Telegram bot belirteci gerektirir).
    Daha önce eşleştirme deposu izin listesi dosyalarına güveniyorsanız `openclaw doctor --fix`, izin listesi akışlarında girdileri `channels.telegram.allowFrom` içine kurtarabilir (örneğin `dmPolicy: "allowlist"` henüz açık kimlikler içermiyorsa).

    Tek sahipli botlar için, erişim ilkesini önceki eşleştirme onaylarına bağlı kalmak yerine config içinde kalıcı tutmak amacıyla açık sayısal `allowFrom` kimlikleriyle `dmPolicy: "allowlist"` tercih edin.

    Yaygın karışıklık: DM eşleştirme onayı, "bu gönderici her yerde yetkilidir" anlamına gelmez.
    Eşleştirme DM erişimi verir. Henüz komut sahibi yoksa ilk onaylanan eşleştirme, yalnızca sahip komutları ve exec onayları için açık bir operatör hesabı olacak şekilde `commands.ownerAllowFrom` değerini de ayarlar.
    Grup gönderici yetkilendirmesi yine açık config izin listelerinden gelir.
    "Bir kez yetkili olayım, hem DM'ler hem de grup komutları çalışsın" istiyorsanız sayısal Telegram kullanıcı kimliğinizi `channels.telegram.allowFrom` içine koyun; yalnızca sahip komutları için `commands.ownerAllowFrom` değerinin `telegram:<your user id>` içerdiğinden emin olun.

    ### Telegram kullanıcı kimliğinizi bulma

    Daha güvenli (üçüncü taraf bot yok):

    1. Botunuza DM gönderin.
    2. `openclaw logs --follow` komutunu çalıştırın.
    3. `from.id` değerini okuyun.

    Resmi Bot API yöntemi:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    Üçüncü taraf yöntem (daha az özel): `@userinfobot` veya `@getidsbot`.

  </Tab>

  <Tab title="Grup ilkesi ve izin listeleri">
    İki denetim birlikte uygulanır:

    1. **Hangi gruplara izin verilir** (`channels.telegram.groups`)
       - `groups` config yok:
         - `groupPolicy: "open"` ile: herhangi bir grup, grup kimliği denetimlerinden geçebilir
         - `groupPolicy: "allowlist"` (varsayılan) ile: `groups` girdileri (veya `"*"`) ekleyene kadar gruplar engellenir
       - `groups` yapılandırılmış: izin listesi gibi davranır (açık kimlikler veya `"*"`)

    2. **Gruplarda hangi göndericilere izin verilir** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (varsayılan)
       - `disabled`

    `groupAllowFrom`, grup gönderici filtreleme için kullanılır. Ayarlanmamışsa Telegram `allowFrom` değerine geri döner.
    `groupAllowFrom` girdileri sayısal Telegram kullanıcı kimlikleri olmalıdır (`telegram:` / `tg:` önekleri normalleştirilir).
    Telegram grup veya süper grup sohbet kimliklerini `groupAllowFrom` içine koymayın. Negatif sohbet kimlikleri `channels.telegram.groups` altında yer alır.
    Sayısal olmayan girdiler gönderici yetkilendirmesi için yok sayılır.
    Güvenlik sınırı (`2026.2.25+`): grup gönderici kimlik doğrulaması DM eşleştirme deposu onaylarını **devralmaz**.
    Eşleştirme yalnızca DM olarak kalır. Gruplar için `groupAllowFrom` veya grup/konu başına `allowFrom` ayarlayın.
    `groupAllowFrom` ayarlanmamışsa Telegram eşleştirme deposuna değil, config `allowFrom` değerine geri döner.
    Tek sahipli botlar için pratik kalıp: kullanıcı kimliğinizi `channels.telegram.allowFrom` içine ayarlayın, `groupAllowFrom` değerini ayarsız bırakın ve hedef gruplara `channels.telegram.groups` altında izin verin.
    Çalışma zamanı notu: `channels.telegram` tamamen eksikse çalışma zamanı, `channels.defaults.groupPolicy` açıkça ayarlanmadıkça varsayılan olarak kapalı güvenli `groupPolicy="allowlist"` kullanır.

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

    Örnek: belirli bir grupta yalnızca belirli kullanıcılara izin verin:

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
      Yaygın hata: `groupAllowFrom` bir Telegram grup izin listesi değildir.

      - `-1001234567890` gibi negatif Telegram grup veya süper grup sohbet kimliklerini `channels.telegram.groups` altına koyun.
      - İzin verilen bir grup içinde hangi kişilerin botu tetikleyebileceğini sınırlamak istediğinizde `8734062810` gibi Telegram kullanıcı kimliklerini `groupAllowFrom` altına koyun.
      - `groupAllowFrom: ["*"]` değerini yalnızca izin verilen bir grubun herhangi bir üyesinin botla konuşabilmesini istediğinizde kullanın.

    </Warning>

  </Tab>

  <Tab title="Bahsetme davranışı">
    Grup yanıtları varsayılan olarak bahsetme gerektirir.

    Bahsetme şu kaynaklardan gelebilir:

    - yerel `@botusername` bahsetmesi, veya
    - şu konumlardaki bahsetme kalıpları:
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

    Grup sohbet kimliğini alma:

    - bir grup iletisini `@userinfobot` / `@getidsbot` adresine iletin
    - veya `openclaw logs --follow` çıktısından `chat.id` değerini okuyun
    - veya Bot API `getUpdates` çıktısını inceleyin

  </Tab>
</Tabs>

## Çalışma zamanı davranışı

- Telegram Gateway sürecine aittir.
- Yönlendirme deterministiktir: Telegram'dan gelenler Telegram'a yanıtlanır (model kanal seçmez).
- Gelen iletiler, yanıt meta verileri ve medya yer tutucularıyla paylaşılan kanal zarfına normalleştirilir.
- Grup oturumları grup kimliğine göre yalıtılır. Forum konuları, konuları yalıtılmış tutmak için `:topic:<threadId>` ekler.
- DM iletileri `message_thread_id` taşıyabilir; OpenClaw yanıtlar için iş parçacığı kimliğini korur ancak DM'leri varsayılan olarak düz oturumda tutar. Bilerek DM konu oturumu yalıtımı istediğinizde `channels.telegram.dm.threadReplies: "inbound"`, `channels.telegram.direct.<chatId>.threadReplies: "inbound"`, `requireTopic: true` veya eşleşen bir konu config'i yapılandırın.
- Long polling, sohbet/iş parçacığı başına sıralama ile grammY runner kullanır. Genel runner sink eşzamanlılığı `agents.defaults.maxConcurrent` kullanır.
- Long polling, her Gateway süreci içinde korunur; böylece bir bot belirtecini aynı anda yalnızca bir etkin poller kullanabilir. Hâlâ `getUpdates` 409 çakışmaları görüyorsanız başka bir OpenClaw Gateway, betik veya dış poller büyük olasılıkla aynı belirteci kullanıyordur.
- Long-polling watchdog yeniden başlatmaları varsayılan olarak tamamlanmış `getUpdates` canlılığı olmadan 120 saniye sonra tetiklenir. `channels.telegram.pollingStallThresholdMs` değerini yalnızca dağıtımınız uzun süren işler sırasında hâlâ yanlış polling-stall yeniden başlatmaları görüyorsa artırın. Değer milisaniye cinsindendir ve `30000` ile `600000` arasında olabilir; hesap başına geçersiz kılmalar desteklenir.
- Telegram Bot API okundu bilgisi desteğine sahip değildir (`sendReadReceipts` uygulanmaz).

## Özellik başvurusu

<AccordionGroup>
  <Accordion title="Canlı akış önizlemesi (ileti düzenlemeleri)">
    OpenClaw kısmi yanıtları gerçek zamanlı olarak akışla gönderebilir:

    - doğrudan sohbetler: önizleme iletisi + `editMessageText`
    - gruplar/konular: önizleme iletisi + `editMessageText`

    Gereksinim:

    - `channels.telegram.streaming`, `off | partial | block | progress` değerlerinden biridir (varsayılan: `partial`)
    - Telegram'da `progress`, `partial` değerine eşlenir (kanallar arası adlandırma ile uyumluluk)
    - `streaming.preview.toolProgress`, araç/ilerleme güncellemelerinin aynı düzenlenen önizleme iletisini yeniden kullanıp kullanmayacağını denetler (önizleme akışı etkinken varsayılan: `true`)
    - eski `channels.telegram.streamMode` ve boolean `streaming` değerleri algılanır; bunları `channels.telegram.streaming.mode` değerine taşımak için `openclaw doctor --fix` çalıştırın

    Araç ilerleme önizleme güncellemeleri, araçlar çalışırken gösterilen kısa "Çalışıyor..." satırlarıdır; örneğin komut yürütme, dosya okumaları, planlama güncellemeleri veya yama özetleri. Telegram, `v2026.4.22` ve sonraki sürümlerde yayımlanan OpenClaw davranışıyla eşleşmek için bunları varsayılan olarak etkin tutar. Yanıt metni için düzenlenen önizlemeyi koruyup araç ilerleme satırlarını gizlemek için şunu ayarlayın:

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

    `streaming.mode: "off"` değerini yalnızca sadece final teslimi istediğinizde kullanın: Telegram önizleme düzenlemeleri devre dışı bırakılır ve genel araç/ilerleme sohbeti bağımsız "Çalışılıyor..." mesajları olarak gönderilmek yerine bastırılır. Onay istemleri, medya yükleri ve hatalar yine normal final teslimi üzerinden yönlendirilir. Yalnızca araç-ilerleme durum satırlarını gizlerken yanıt önizleme düzenlemelerini korumak istediğinizde `streaming.preview.toolProgress: false` kullanın.

    Yalnızca metin yanıtları için:

    - kısa DM/grup/konu önizlemeleri: OpenClaw aynı önizleme mesajını korur ve yerinde final düzenlemesi yapar
    - yaklaşık bir dakikadan eski önizlemeler: OpenClaw tamamlanmış yanıtı yeni bir final mesajı olarak gönderir ve ardından önizlemeyi temizler; böylece Telegram'ın görünen zaman damgası, önizleme oluşturma zamanı yerine tamamlanma zamanını yansıtır

    Karmaşık yanıtlar için (örneğin medya yükleri), OpenClaw normal final teslimine geri döner ve ardından önizleme mesajını temizler.

    Önizleme akışı, blok akışından ayrıdır. Blok akışı Telegram için açıkça etkinleştirildiğinde, OpenClaw çift akışı önlemek için önizleme akışını atlar.

    Yalnızca Telegram akıl yürütme akışı:

    - `/reasoning stream` üretim sırasında akıl yürütmeyi canlı önizlemeye gönderir
    - final yanıtı akıl yürütme metni olmadan gönderilir

  </Accordion>

  <Accordion title="Biçimlendirme ve HTML geri dönüşü">
    Giden metin Telegram `parse_mode: "HTML"` kullanır.

    - Markdown benzeri metin, Telegram açısından güvenli HTML'ye işlenir.
    - Ham model HTML'si, Telegram ayrıştırma hatalarını azaltmak için kaçışlanır.
    - Telegram ayrıştırılmış HTML'yi reddederse, OpenClaw düz metin olarak yeniden dener.

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
    - Plugin/skill komutları, Telegram menüsünde gösterilmeseler bile yazıldığında çalışmaya devam edebilir

    Yerel komutlar devre dışıysa, yerleşik olanlar kaldırılır. Özel/Plugin komutları yapılandırılmışsa yine de kaydolabilir.

    Yaygın kurulum hataları:

    - `BOT_COMMANDS_TOO_MUCH` ile `setMyCommands failed`, Telegram menüsünün kırpma sonrasında hâlâ taştığı anlamına gelir; Plugin/skill/özel komutları azaltın veya `channels.telegram.commands.native` seçeneğini devre dışı bırakın.
    - Doğrudan Bot API curl komutları çalışırken `deleteWebhook`, `deleteMyCommands` veya `setMyCommands` `404: Not Found` ile başarısız oluyorsa, bu `channels.telegram.apiRoot` değerinin tam `/bot<TOKEN>` uç noktasına ayarlanmış olabileceği anlamına gelebilir. `apiRoot` yalnızca Bot API kökü olmalıdır ve `openclaw doctor --fix` yanlışlıkla eklenmiş sondaki `/bot<TOKEN>` bölümünü kaldırır.
    - `getMe returned 401`, Telegram'ın yapılandırılmış bot token'ını reddettiği anlamına gelir. `botToken`, `tokenFile` veya `TELEGRAM_BOT_TOKEN` değerini mevcut BotFather token'ıyla güncelleyin; OpenClaw yoklamadan önce durur, bu nedenle bu bir Webhook temizleme hatası olarak bildirilmez.
    - Ağ/fetch hatalarıyla `setMyCommands failed` genellikle `api.telegram.org` adresine giden DNS/HTTPS erişiminin engellendiği anlamına gelir.

    ### Cihaz eşleme komutları (`device-pair` Plugin)

    `device-pair` Plugin yüklendiğinde:

    1. `/pair` kurulum kodu üretir
    2. kodu iOS uygulamasına yapıştırın
    3. `/pair pending` bekleyen istekleri listeler (rol/kapsamlar dahil)
    4. isteği onaylayın:
       - açık onay için `/pair approve <requestId>`
       - yalnızca bir bekleyen istek olduğunda `/pair approve`
       - en yeni istek için `/pair approve latest`

    Kurulum kodu kısa ömürlü bir önyükleme token'ı taşır. Yerleşik önyükleme devri, birincil düğüm token'ını `scopes: []` düzeyinde tutar; devredilen herhangi bir operatör token'ı `operator.approvals`, `operator.read`, `operator.talk.secrets` ve `operator.write` ile sınırlı kalır. Önyükleme kapsam denetimleri rol önekli olduğundan, bu operatör izin listesi yalnızca operatör isteklerini karşılar; operatör olmayan rollerin yine kendi rol önekleri altında kapsamlara ihtiyacı vardır.

    Bir cihaz değiştirilmiş kimlik doğrulama ayrıntılarıyla yeniden denerse (örneğin rol/kapsamlar/açık anahtar), önceki bekleyen istek geçersiz kılınır ve yeni istek farklı bir `requestId` kullanır. Onaylamadan önce `/pair pending` komutunu yeniden çalıştırın.

    Daha fazla ayrıntı: [Eşleme](/tr/channels/pairing#pair-via-telegram-recommended-for-ios).

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

    Eski `capabilities: ["inlineButtons"]`, `inlineButtons: "all"` olarak eşlenir.

    Mesaj eylemi örneği:

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

  <Accordion title="Ajanlar ve otomasyon için Telegram mesaj eylemleri">
    Telegram araç eylemleri şunları içerir:

    - `sendMessage` (`to`, `content`, isteğe bağlı `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, isteğe bağlı `iconColor`, `iconCustomEmojiId`)

    Kanal mesaj eylemleri ergonomik takma adlar sunar (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Geçit denetimleri:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (varsayılan: devre dışı)

    Not: `edit` ve `topic-create` şu anda varsayılan olarak etkindir ve ayrı `channels.telegram.actions.*` anahtarlarına sahip değildir.
    Çalışma zamanı gönderimleri etkin yapılandırma/gizli bilgiler anlık görüntüsünü (başlangıç/yeniden yükleme) kullanır, bu nedenle eylem yolları gönderim başına anlık SecretRef yeniden çözümlemesi yapmaz.

    Tepki kaldırma semantiği: [/tools/reactions](/tr/tools/reactions)

  </Accordion>

  <Accordion title="Yanıt dizileme etiketleri">
    Telegram, üretilen çıktıda açık yanıt dizileme etiketlerini destekler:

    - `[[reply_to_current]]` tetikleyen mesaja yanıt verir
    - `[[reply_to:<id>]]` belirli bir Telegram mesaj kimliğine yanıt verir

    `channels.telegram.replyToMode` işlemeyi denetler:

    - `off` (varsayılan)
    - `first`
    - `all`

    Yanıt dizileme etkinleştirildiğinde ve özgün Telegram metni veya açıklaması kullanılabilir olduğunda, OpenClaw otomatik olarak yerel bir Telegram alıntı parçası ekler. Telegram yerel alıntı metnini 1024 UTF-16 kod birimiyle sınırlar; bu nedenle daha uzun mesajlar baştan alıntılanır ve Telegram alıntıyı reddederse düz yanıta geri döner.

    Not: `off` örtük yanıt dizilemeyi devre dışı bırakır. Açık `[[reply_to_*]]` etiketleri yine de dikkate alınır.

  </Accordion>

  <Accordion title="Forum konuları ve ileti dizisi davranışı">
    Forum süper grupları:

    - konu oturum anahtarları `:topic:<threadId>` ekler
    - yanıtlar ve yazıyor eylemleri konu ileti dizisini hedefler
    - konu yapılandırma yolu:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Genel konu (`threadId=1`) özel durumu:

    - mesaj gönderimleri `message_thread_id` değerini atlar (Telegram `sendMessage(...thread_id=1)` çağrısını reddeder)
    - yazıyor eylemleri yine de `message_thread_id` içerir

    Konu kalıtımı: konu girdileri, geçersiz kılınmadıkça grup ayarlarını devralır (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` yalnızca konuya özeldir ve grup varsayılanlarından devralınmaz.

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

    Ardından her konunun kendi oturum anahtarı olur: `agent:zu:telegram:group:-1001234567890:topic:3`

    **Kalıcı ACP konu bağlama**: Forum konuları, üst düzey türlenmiş ACP bağlamaları (`type: "acp"` ve `match.channel: "telegram"`, `peer.kind: "group"` ile `bindings[]` ve `-1001234567890:topic:42` gibi konu nitelemeli bir kimlik) aracılığıyla ACP harness oturumlarını sabitleyebilir. Şu anda gruplardaki/süper gruplardaki forum konularıyla sınırlıdır. Bkz. [ACP Ajanları](/tr/tools/acp-agents).

    **Sohbetten ileti dizisine bağlı ACP spawn**: `/acp spawn <agent> --thread here|auto` mevcut konuyu yeni bir ACP oturumuna bağlar; devam mesajları doğrudan oraya yönlendirilir. OpenClaw spawn onayını konu içinde sabitler. `channels.telegram.threadBindings.spawnSessions` seçeneğinin etkin kalmasını gerektirir (varsayılan: `true`).

    Şablon bağlamı `MessageThreadId` ve `IsForum` değerlerini sunar. `message_thread_id` içeren DM sohbetleri varsayılan olarak düz oturumlarda DM yönlendirmesini ve yanıt meta verilerini korur; ileti dizisi duyarlı oturum anahtarlarını yalnızca `threadReplies: "inbound"`, `threadReplies: "always"`, `requireTopic: true` veya eşleşen bir konu yapılandırmasıyla yapılandırıldıklarında kullanırlar. Hesap varsayılanı için üst düzey `channels.telegram.dm.threadReplies` değerini veya tek bir DM için `direct.<chatId>.threadReplies` değerini kullanın.

  </Accordion>

  <Accordion title="Ses, video ve çıkartmalar">
    ### Sesli mesajlar

    Telegram ses notları ile ses dosyalarını ayırt eder.

    - varsayılan: ses dosyası davranışı
    - ses notu gönderimini zorlamak için ajan yanıtında `[[audio_as_voice]]` etiketi
    - gelen ses notu transkriptleri, ajan bağlamında makine tarafından üretilmiş,
      güvenilmeyen metin olarak çerçevelenir; bahsetme algılaması yine ham
      transkripti kullanır, böylece bahsetme geçitli sesli mesajlar çalışmaya devam eder.

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

    Telegram video dosyalarını ve video notlarını ayırt eder.

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

    Video notları açıklamaları desteklemez; sağlanan mesaj metni ayrıca gönderilir.

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

    Çıkartmalar bir kez açıklanır (mümkün olduğunda) ve yinelenen vision çağrılarını azaltmak için önbelleğe alınır.

    Çıkartma eylemlerini etkinleştirin:

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

    Sticker eylemi gönder:

```json5
{
  action: "sticker",
  channel: "telegram",
  to: "123456789",
  fileId: "CAACAgIAAxkBAAI...",
}
```

    Önbelleğe alınmış sticker'ları ara:

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
    Telegram tepkileri, `message_reaction` güncellemeleri olarak gelir (mesaj yüklerinden ayrıdır).

    Etkinleştirildiğinde, OpenClaw şu tür sistem olaylarını kuyruğa alır:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Yapılandırma:

    - `channels.telegram.reactionNotifications`: `off | own | all` (varsayılan: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (varsayılan: `minimal`)

    Notlar:

    - `own`, yalnızca bot tarafından gönderilen mesajlara kullanıcı tepkileri anlamına gelir (gönderilen mesaj önbelleği üzerinden en iyi çaba).
    - Tepki olayları yine Telegram erişim denetimlerine uyar (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); yetkisiz gönderenler atılır.
    - Telegram, tepki güncellemelerinde ileti dizisi kimlikleri sağlamaz.
      - forum olmayan gruplar, grup sohbeti oturumuna yönlendirilir
      - forum grupları, tam kaynak konuya değil, grubun genel konu oturumuna (`:topic:1`) yönlendirilir

    Yoklama/Webhook için `allowed_updates` otomatik olarak `message_reaction` içerir.

  </Accordion>

  <Accordion title="Ack tepkileri">
    `ackReaction`, OpenClaw gelen bir mesajı işlerken bir onay emojisi gönderir.

    Çözüm sırası:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - aracı kimliği emoji yedeği (`agents.list[].identity.emoji`, aksi halde "👀")

    Notlar:

    - Telegram unicode emoji bekler (örneğin "👀").
    - Bir kanal veya hesap için tepkiyi devre dışı bırakmak üzere `""` kullanın.

  </Accordion>

  <Accordion title="Telegram olayları ve komutlarından yapılandırma yazmaları">
    Kanal yapılandırma yazmaları varsayılan olarak etkindir (`configWrites !== false`).

    Telegram tarafından tetiklenen yazmalar şunları içerir:

    - `channels.telegram.groups` öğesini güncellemek için grup taşıma olayları (`migrate_to_chat_id`)
    - `/config set` ve `/config unset` (komut etkinleştirmesi gerektirir)

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
    Varsayılan yöntem uzun yoklamadır. Webhook modu için `channels.telegram.webhookUrl` ve `channels.telegram.webhookSecret` ayarlayın; isteğe bağlı `webhookPath`, `webhookHost`, `webhookPort` (varsayılanlar `/telegram-webhook`, `127.0.0.1`, `8787`).

    Yerel dinleyici `127.0.0.1:8787` adresine bağlanır. Genel giriş için yerel portun önüne bir ters proxy koyun veya bilinçli olarak `webhookHost: "0.0.0.0"` ayarlayın.

    Webhook modu, Telegram'a `200` döndürmeden önce istek korumalarını, Telegram gizli token'ını ve JSON gövdesini doğrular.
    OpenClaw daha sonra güncellemeyi uzun yoklamada kullanılan aynı sohbet başına/konu başına bot hatları üzerinden eşzamansız olarak işler; böylece yavaş aracı turları Telegram'ın teslim ACK'sini bekletmez.

  </Accordion>

  <Accordion title="Sınırlar, yeniden deneme ve CLI hedefleri">
    - `channels.telegram.textChunkLimit` varsayılanı 4000'dir.
    - `channels.telegram.chunkMode="newline"`, uzunluğa göre bölmeden önce paragraf sınırlarını (boş satırlar) tercih eder.
    - `channels.telegram.mediaMaxMb` (varsayılan 100), gelen ve giden Telegram medya boyutunu sınırlar.
    - `channels.telegram.timeoutSeconds`, Telegram API istemci zaman aşımını geçersiz kılar (ayarlanmamışsa grammY varsayılanı uygulanır). Bot istemcileri, grammY'nin görünür yanıt teslimini OpenClaw'ın aktarım koruması ve yedeği çalışmadan önce iptal etmemesi için yapılandırılan değerleri 60 saniyelik giden metin/yazıyor isteği korumasının altında sınırlar. Uzun yoklama yine 45 saniyelik bir `getUpdates` isteği koruması kullanır; böylece boşta kalan yoklamalar süresiz olarak terk edilmez.
    - `channels.telegram.pollingStallThresholdMs` varsayılanı `120000`'dir; yalnızca yanlış pozitif yoklama takılması yeniden başlatmaları için `30000` ile `600000` arasında ayarlayın.
    - grup bağlam geçmişi `channels.telegram.historyLimit` veya `messages.groupChat.historyLimit` kullanır (varsayılan 50); `0` devre dışı bırakır.
    - yanıt/alıntı/iletim ek bağlamı şu anda alındığı gibi geçirilir.
    - Telegram izin listeleri, tam bir ek bağlam redaksiyon sınırı olmaktan çok, öncelikli olarak aracıyı kimin tetikleyebileceğini denetler.
    - DM geçmişi denetimleri:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - `channels.telegram.retry` yapılandırması, kurtarılabilir giden API hataları için Telegram gönderme yardımcılarına (CLI/araçlar/eylemler) uygulanır. Gelen son yanıt teslimi de Telegram ön bağlantı hataları için sınırlı bir güvenli gönderim yeniden denemesi kullanır, ancak görünür mesajları çoğaltabilecek belirsiz gönderim sonrası ağ zarflarını yeniden denemez.

    CLI gönderim hedefi sayısal sohbet kimliği veya kullanıcı adı olabilir:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
```

    Telegram anketleri `openclaw message poll` kullanır ve forum konularını destekler:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    Yalnızca Telegram'a özgü anket bayrakları:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - forum konuları için `--thread-id` (veya bir `:topic:` hedefi kullanın)

    Telegram gönderimi ayrıca şunları destekler:

    - `channels.telegram.capabilities.inlineButtons` izin verdiğinde satır içi klavyeler için `buttons` bloklarıyla `--presentation`
    - bot o sohbette sabitleyebiliyorsa sabitlenmiş teslim istemek için `--pin` veya `--delivery '{"pin":true}'`
    - giden görselleri ve GIF'leri sıkıştırılmış fotoğraf ya da animasyonlu medya yüklemeleri yerine belge olarak göndermek için `--force-document`

    Eylem denetimi:

    - `channels.telegram.actions.sendMessage=false`, anketler dahil giden Telegram mesajlarını devre dışı bırakır
    - `channels.telegram.actions.poll=false`, normal gönderimler etkin kalırken Telegram anket oluşturmayı devre dışı bırakır

  </Accordion>

  <Accordion title="Telegram'da exec onayları">
    Telegram, onaylayan DM'lerinde exec onaylarını destekler ve isteğe bağlı olarak istemleri kaynak sohbete veya konuya gönderebilir. Onaylayanlar sayısal Telegram kullanıcı kimlikleri olmalıdır.

    Yapılandırma yolu:

    - `channels.telegram.execApprovals.enabled` (en az bir onaylayan çözümlenebildiğinde otomatik etkinleşir)
    - `channels.telegram.execApprovals.approvers` (`commands.ownerAllowFrom` içindeki sayısal sahip kimliklerine geri döner)
    - `channels.telegram.execApprovals.target`: `dm` (varsayılan) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` ve `defaultTo`, botla kimin konuşabileceğini ve normal yanıtları nereye göndereceğini denetler. Bunlar birini exec onaylayanı yapmaz. Henüz komut sahibi yoksa, ilk onaylanmış DM eşleştirmesi `commands.ownerAllowFrom` öğesini başlatır; böylece tek sahipli kurulum, `execApprovals.approvers` altında kimlikleri yinelemeden çalışmaya devam eder.

    Kanal teslimi komut metnini sohbette gösterir; `channel` veya `both` seçeneklerini yalnızca güvenilen gruplarda/konularda etkinleştirin. İstem bir forum konusuna düştüğünde OpenClaw, onay istemi ve takip için konuyu korur. Exec onayları varsayılan olarak 30 dakika sonra sona erer.

    Satır içi onay düğmeleri de hedef yüzeye (`dm`, `group` veya `all`) izin vermek için `channels.telegram.capabilities.inlineButtons` gerektirir. `plugin:` ile başlayan onay kimlikleri Plugin onayları üzerinden çözümlenir; diğerleri önce exec onayları üzerinden çözümlenir.

    Bkz. [Exec onayları](/tr/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Hata yanıtı denetimleri

Aracı bir teslim veya sağlayıcı hatasıyla karşılaştığında, Telegram hata metniyle yanıt verebilir ya da bunu bastırabilir. Bu davranışı iki yapılandırma anahtarı denetler:

| Anahtar                             | Değerler          | Varsayılan | Açıklama                                                                                              |
| ----------------------------------- | ----------------- | ---------- | ----------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply`    | `reply`, sohbete dostça bir hata mesajı gönderir. `silent`, hata yanıtlarını tamamen bastırır.        |
| `channels.telegram.errorCooldownMs` | sayı (ms)         | `60000`    | Aynı sohbete hata yanıtları arasındaki en kısa süre. Kesintiler sırasında hata spam'ini önler.        |

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
  <Accordion title="Bot, bahsetme içermeyen grup mesajlarına yanıt vermiyor">

    - `requireMention=false` ise Telegram gizlilik modu tam görünürlüğe izin vermelidir.
      - BotFather: `/setprivacy` -> Disable
      - ardından botu gruptan kaldırıp yeniden ekleyin
    - `openclaw channels status`, yapılandırma bahsedilmeyen grup mesajları beklediğinde uyarır.
    - `openclaw channels status --probe` açık sayısal grup kimliklerini denetleyebilir; joker karakter `"*"` üyelik açısından yoklanamaz.
    - hızlı oturum testi: `/activation always`.

  </Accordion>

  <Accordion title="Bot grup mesajlarını hiç görmüyor">

    - `channels.telegram.groups` varsa grup listelenmiş olmalıdır (veya `"*"` içermelidir)
    - botun gruptaki üyeliğini doğrulayın
    - atlama nedenleri için günlükleri inceleyin: `openclaw logs --follow`

  </Accordion>

  <Accordion title="Komutlar kısmen çalışıyor veya hiç çalışmıyor">

    - gönderen kimliğinizi yetkilendirin (eşleştirme ve/veya sayısal `allowFrom`)
    - grup ilkesi `open` olsa bile komut yetkilendirmesi yine uygulanır
    - `setMyCommands failed` ile `BOT_COMMANDS_TOO_MUCH`, yerel menüde çok fazla giriş olduğu anlamına gelir; Plugin/skill/özel komutları azaltın veya yerel menüleri devre dışı bırakın
    - `deleteMyCommands` / `setMyCommands` başlangıç çağrıları ve `sendChatAction` yazıyor çağrıları sınırlıdır ve istek zaman aşımında Telegram'ın aktarım yedeği üzerinden bir kez yeniden denenir. Kalıcı ağ/fetch hataları genellikle `api.telegram.org` için DNS/HTTPS erişilebilirlik sorunlarını gösterir

  </Accordion>

  <Accordion title="Başlangıç yetkisiz token bildiriyor">

    - `getMe returned 401`, yapılandırılan bot token'ı için bir Telegram kimlik doğrulama hatasıdır.
    - BotFather'da bot token'ını yeniden kopyalayın veya yeniden oluşturun, ardından varsayılan hesap için `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken` veya `TELEGRAM_BOT_TOKEN` değerini güncelleyin.
    - Başlangıç sırasında `deleteWebhook 401 Unauthorized` da bir kimlik doğrulama hatasıdır; bunu "Webhook yok" olarak ele almak aynı hatalı token hatasını yalnızca daha sonraki API çağrılarına ertelemiş olur.
    - Yoklama başlangıcı sırasında `deleteWebhook` geçici bir ağ hatasıyla başarısız olursa OpenClaw `getWebhookInfo` denetler; Telegram boş bir Webhook URL'si bildirdiğinde, temizlik zaten sağlandığı için yoklama devam eder.

  </Accordion>

  <Accordion title="Yoklama veya ağ kararsızlığı">

    - Node 22+ + özel fetch/proxy, AbortSignal türleri uyuşmazsa anında iptal davranışını tetikleyebilir.
    - Bazı ana makineler `api.telegram.org` adresini önce IPv6 olarak çözümler; bozuk IPv6 çıkışı aralıklı Telegram API hatalarına neden olabilir.
    - Günlüklerde `TypeError: fetch failed` veya `Network request for 'getUpdates' failed!` varsa OpenClaw artık bunları kurtarılabilir ağ hataları olarak yeniden dener.
    - Telegram soketleri kısa ve sabit bir aralıkla yeniden oluşturuluyorsa düşük bir `channels.telegram.timeoutSeconds` değeri olup olmadığını kontrol edin; bot istemcileri yapılandırılmış değerleri giden istek ve `getUpdates` istek korumalarının altına düşmeyecek şekilde sınırlar, ancak eski sürümler bu değer korumaların altında ayarlandığında her yoklamayı veya yanıtı iptal edebiliyordu.
    - Günlüklerde `Polling stall detected` varsa OpenClaw, varsayılan olarak tamamlanmış uzun yoklama canlılığı olmadan 120 saniye geçtikten sonra yoklamayı yeniden başlatır ve Telegram aktarımını yeniden oluşturur.
    - `openclaw channels status --probe` ve `openclaw doctor`, çalışan bir yoklama hesabı başlangıç ek süresinden sonra `getUpdates` tamamlamadığında, çalışan bir Webhook hesabı başlangıç ek süresinden sonra `setWebhook` tamamlamadığında veya son başarılı yoklama aktarımı etkinliği bayatladığında uyarır.
    - `channels.telegram.pollingStallThresholdMs` değerini yalnızca uzun süren `getUpdates` çağrıları sağlıklıysa ancak ana makineniz yine de yanlış yoklama-takılması yeniden başlatmaları bildiriyorsa artırın. Kalıcı takılmalar genellikle ana makine ile `api.telegram.org` arasındaki proxy, DNS, IPv6 veya TLS çıkış sorunlarına işaret eder.
    - Telegram ayrıca Bot API aktarımı için `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` ve bunların küçük harfli varyantları dahil olmak üzere süreç proxy env değerlerini de dikkate alır. `NO_PROXY` / `no_proxy` yine de `api.telegram.org` için proxy kullanımını atlayabilir.
    - OpenClaw yönetimli proxy bir hizmet ortamı için `OPENCLAW_PROXY_URL` üzerinden yapılandırılmışsa ve standart proxy env yoksa Telegram, Bot API aktarımı için bu URL'yi de kullanır.
    - Kararsız doğrudan çıkış/TLS bulunan VPS ana makinelerinde Telegram API çağrılarını `channels.telegram.proxy` üzerinden yönlendirin:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ varsayılan olarak `autoSelectFamily=true` kullanır (WSL2 hariç). Telegram DNS sonuç sırası önce `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`, sonra `channels.telegram.network.dnsResultOrder`, sonra `NODE_OPTIONS=--dns-result-order=ipv4first` gibi süreç varsayılanını izler; hiçbiri geçerli değilse Node 22+ `ipv4first` değerine geri döner.
    - Ana makineniz WSL2 ise veya açıkça yalnızca IPv4 davranışıyla daha iyi çalışıyorsa aile seçimini zorlayın:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - RFC 2544 kıyaslama aralığı yanıtlarına (`198.18.0.0/15`) Telegram medya indirmeleri için varsayılan olarak zaten izin verilir. Güvenilir bir fake-IP veya şeffaf proxy, medya indirmeleri sırasında `api.telegram.org` adresini başka bir özel/dahili/özel-kullanım adresine yeniden yazıyorsa yalnızca Telegram'a özel atlamayı etkinleştirebilirsiniz:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - Aynı etkinleştirme hesap başına
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork` konumunda kullanılabilir.
    - Proxy'niz Telegram medya ana makinelerini `198.18.x.x` adreslerine çözümlüyorsa önce tehlikeli bayrağı kapalı bırakın. Telegram medyası RFC 2544 kıyaslama aralığına varsayılan olarak zaten izin verir.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork`, Telegram
      medya SSRF korumalarını zayıflatır. Bunu yalnızca Clash, Mihomo veya Surge fake-IP yönlendirmesi gibi, RFC 2544 kıyaslama aralığı dışında özel veya özel-kullanım yanıtları üreten güvenilir, operatör denetimli proxy
      ortamları için kullanın. Normal herkese açık internet Telegram erişimi için kapalı bırakın.
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

Daha fazla yardım: [Kanal sorunlarını giderme](/tr/channels/troubleshooting).

## Yapılandırma başvurusu

Birincil başvuru: [Yapılandırma başvurusu - Telegram](/tr/gateway/config-channels#telegram).

<Accordion title="Yüksek sinyalli Telegram alanları">

- başlangıç/auth: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` normal bir dosyaya işaret etmelidir; sembolik bağlantılar reddedilir)
- erişim denetimi: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, üst düzey `bindings[]` (`type: "acp"`)
- exec onayları: `execApprovals`, `accounts.*.execApprovals`
- komut/menü: `commands.native`, `commands.nativeSkills`, `customCommands`
- iş parçacıkları/yanıtlar: `replyToMode`, `dm.threadReplies`, `direct.*.threadReplies`
- akış: `streaming` (önizleme), `streaming.preview.toolProgress`, `blockStreaming`
- biçimlendirme/teslim: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- medya/ağ: `mediaMaxMb`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- özel API kökü: `apiRoot` (yalnızca Bot API kökü; `/bot<TOKEN>` eklemeyin)
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- eylemler/yetenekler: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- tepkiler: `reactionNotifications`, `reactionLevel`
- hatalar: `errorPolicy`, `errorCooldownMs`
- yazmalar/geçmiş: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
Çoklu hesap önceliği: iki veya daha fazla hesap kimliği yapılandırıldığında varsayılan yönlendirmeyi açık hale getirmek için `channels.telegram.defaultAccount` değerini ayarlayın (veya `channels.telegram.accounts.default` ekleyin). Aksi halde OpenClaw ilk normalize edilmiş hesap kimliğine geri döner ve `openclaw doctor` uyarır. Adlandırılmış hesaplar `channels.telegram.allowFrom` / `groupAllowFrom` değerlerini devralır, ancak `accounts.default.*` değerlerini devralmaz.
</Note>

## İlgili

<CardGroup cols={2}>
  <Card title="Eşleştirme" icon="link" href="/tr/channels/pairing">
    Bir Telegram kullanıcısını Gateway ile eşleştirin.
  </Card>
  <Card title="Gruplar" icon="users" href="/tr/channels/groups">
    Grup ve konu izin listesi davranışı.
  </Card>
  <Card title="Kanal yönlendirme" icon="route" href="/tr/channels/channel-routing">
    Gelen iletileri ajanlara yönlendirin.
  </Card>
  <Card title="Güvenlik" icon="shield" href="/tr/gateway/security">
    Tehdit modeli ve sıkılaştırma.
  </Card>
  <Card title="Çoklu ajan yönlendirme" icon="sitemap" href="/tr/concepts/multi-agent">
    Grupları ve konuları ajanlarla eşleyin.
  </Card>
  <Card title="Sorun giderme" icon="wrench" href="/tr/channels/troubleshooting">
    Kanallar arası tanılama.
  </Card>
</CardGroup>
