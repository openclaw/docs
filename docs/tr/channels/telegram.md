---
read_when:
    - Telegram özellikleri veya Webhook'lar üzerinde çalışma
summary: Telegram bot desteği durumu, yetenekleri ve yapılandırması
title: Telegram
x-i18n:
    generated_at: "2026-05-03T21:27:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 528ace9dae29eda22f98cc1436ec16146eb9d83edc73aa6db1ab8283f4f873c0
    source_path: channels/telegram.md
    workflow: 16
---

Bot DM'leri ve grupları için grammY aracılığıyla üretime hazır. Varsayılan mod long polling'dir; Webhook modu isteğe bağlıdır.

<CardGroup cols={3}>
  <Card title="Eşleştirme" icon="link" href="/tr/channels/pairing">
    Telegram için varsayılan DM politikası eşleştirmedir.
  </Card>
  <Card title="Kanal sorun giderme" icon="wrench" href="/tr/channels/troubleshooting">
    Kanallar arası tanılama ve onarım çalışma kitapları.
  </Card>
  <Card title="Gateway yapılandırması" icon="settings" href="/tr/gateway/configuration">
    Tam kanal yapılandırma kalıpları ve örnekleri.
  </Card>
</CardGroup>

## Hızlı kurulum

<Steps>
  <Step title="BotFather'da bot token'ını oluşturun">
    Telegram'ı açın ve **@BotFather** ile sohbet edin (kullanıcı adının tam olarak `@BotFather` olduğunu doğrulayın).

    `/newbot` komutunu çalıştırın, istemleri izleyin ve token'ı kaydedin.

  </Step>

  <Step title="Token ve DM politikasını yapılandırın">

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

    Env yedeği: `TELEGRAM_BOT_TOKEN=...` (yalnızca varsayılan hesap).
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
    Botu grubunuza ekleyin, ardından erişim modelinize uyması için `channels.telegram.groups` ve `groupPolicy` ayarlarını yapın.
  </Step>
</Steps>

<Note>
Token çözümleme sırası hesaba duyarlıdır. Pratikte config değerleri env yedeğine göre önceliklidir ve `TELEGRAM_BOT_TOKEN` yalnızca varsayılan hesaba uygulanır.
</Note>

## Telegram tarafı ayarları

<AccordionGroup>
  <Accordion title="Gizlilik modu ve grup görünürlüğü">
    Telegram botları varsayılan olarak **Privacy Mode** kullanır; bu, aldıkları grup mesajlarını sınırlar.

    Botun tüm grup mesajlarını görmesi gerekiyorsa şunlardan birini yapın:

    - `/setprivacy` ile gizlilik modunu devre dışı bırakın veya
    - botu grup yöneticisi yapın.

    Gizlilik modunu değiştirirken, Telegram'ın değişikliği uygulaması için botu her gruptan kaldırıp yeniden ekleyin.

  </Accordion>

  <Accordion title="Grup izinleri">
    Yönetici durumu Telegram grup ayarlarından kontrol edilir.

    Yönetici botlar tüm grup mesajlarını alır; bu, her zaman açık grup davranışı için yararlıdır.

  </Accordion>

  <Accordion title="Yararlı BotFather anahtarları">

    - grup eklemelerine izin vermek/reddetmek için `/setjoingroups`
    - grup görünürlüğü davranışı için `/setprivacy`

  </Accordion>
</AccordionGroup>

## Erişim denetimi ve etkinleştirme

<Tabs>
  <Tab title="DM politikası">
    `channels.telegram.dmPolicy` doğrudan mesaj erişimini kontrol eder:

    - `pairing` (varsayılan)
    - `allowlist` (`allowFrom` içinde en az bir gönderici kimliği gerektirir)
    - `open` (`allowFrom` içinde `"*"` bulunmasını gerektirir)
    - `disabled`

    `allowFrom: ["*"]` ile `dmPolicy: "open"`, bot kullanıcı adını bulan veya tahmin eden herhangi bir Telegram hesabının bota komut vermesine izin verir. Bunu yalnızca araçları sıkı biçimde kısıtlanmış, kasıtlı olarak herkese açık botlar için kullanın; tek sahipli botlar sayısal kullanıcı kimlikleriyle `allowlist` kullanmalıdır.

    `channels.telegram.allowFrom` sayısal Telegram kullanıcı kimliklerini kabul eder. `telegram:` / `tg:` önekleri kabul edilir ve normalleştirilir.
    Çok hesaplı yapılandırmalarda, kısıtlayıcı bir üst düzey `channels.telegram.allowFrom` güvenlik sınırı olarak değerlendirilir: hesap düzeyi `allowFrom: ["*"]` girdileri, birleştirme sonrasında etkili hesap allowlist'i hâlâ açık bir wildcard içermedikçe o hesabı herkese açık yapmaz.
    Boş `allowFrom` ile `dmPolicy: "allowlist"` tüm DM'leri engeller ve config doğrulaması tarafından reddedilir.
    Kurulum yalnızca sayısal kullanıcı kimlikleri ister.
    Yükseltme yaptıysanız ve config'iniz `@username` allowlist girdileri içeriyorsa, bunları çözümlemek için `openclaw doctor --fix` çalıştırın (en iyi çaba; Telegram bot token'ı gerektirir).
    Daha önce eşleştirme deposu allowlist dosyalarına güveniyorsanız, `openclaw doctor --fix` allowlist akışlarında girdileri `channels.telegram.allowFrom` içine kurtarabilir (örneğin `dmPolicy: "allowlist"` henüz açık kimlik içermediğinde).

    Tek sahipli botlar için, erişim politikasını config içinde kalıcı tutmak adına açık sayısal `allowFrom` kimlikleriyle `dmPolicy: "allowlist"` tercih edin (önceki eşleştirme onaylarına bağlı kalmak yerine).

    Yaygın karışıklık: DM eşleştirme onayı, "bu gönderici her yerde yetkilidir" anlamına gelmez.
    Eşleştirme DM erişimi verir. Henüz komut sahibi yoksa, ilk onaylanan eşleştirme ayrıca `commands.ownerAllowFrom` değerini ayarlar; böylece yalnızca sahibi ilgilendiren komutlar ve exec onayları açık bir operatör hesabına sahip olur.
    Grup gönderici yetkilendirmesi yine açık config allowlist'lerinden gelir.
    "Bir kez yetkilendirileyim ve hem DM'ler hem grup komutları çalışsın" istiyorsanız, sayısal Telegram kullanıcı kimliğinizi `channels.telegram.allowFrom` içine koyun; yalnızca sahip komutları için `commands.ownerAllowFrom` içinde `telegram:<your user id>` bulunduğundan emin olun.

    ### Telegram kullanıcı kimliğinizi bulma

    Daha güvenli (üçüncü taraf bot yok):

    1. Botunuza DM gönderin.
    2. `openclaw logs --follow` çalıştırın.
    3. `from.id` değerini okuyun.

    Resmi Bot API yöntemi:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    Üçüncü taraf yöntem (daha az gizli): `@userinfobot` veya `@getidsbot`.

  </Tab>

  <Tab title="Group policy and allowlists">
    İki denetim birlikte uygulanır:

    1. **Hangi gruplara izin verilir** (`channels.telegram.groups`)
       - `groups` yapılandırması yok:
         - `groupPolicy: "open"` ile: herhangi bir grup, grup kimliği kontrollerinden geçebilir
         - `groupPolicy: "allowlist"` (varsayılan) ile: `groups` girdileri (veya `"*"`) ekleyene kadar gruplar engellenir
       - `groups` yapılandırılmış: izin listesi olarak davranır (açık kimlikler veya `"*"`)

    2. **Gruplarda hangi göndericilere izin verilir** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (varsayılan)
       - `disabled`

    `groupAllowFrom`, grup gönderici filtreleme için kullanılır. Ayarlanmamışsa Telegram `allowFrom` değerine geri döner.
    `groupAllowFrom` girdileri sayısal Telegram kullanıcı kimlikleri olmalıdır (`telegram:` / `tg:` önekleri normalleştirilir).
    `groupAllowFrom` içine Telegram grup veya süper grup sohbet kimlikleri koymayın. Negatif sohbet kimlikleri `channels.telegram.groups` altında yer alır.
    Sayısal olmayan girdiler, gönderici yetkilendirmesi için yok sayılır.
    Güvenlik sınırı (`2026.2.25+`): grup gönderici kimlik doğrulaması, DM eşleştirme deposu onaylarını **devralmaz**.
    Eşleştirme yalnızca DM olarak kalır. Gruplar için `groupAllowFrom` veya grup başına/konu başına `allowFrom` ayarlayın.
    `groupAllowFrom` ayarlanmamışsa Telegram, eşleştirme deposuna değil yapılandırmadaki `allowFrom` değerine geri döner.
    Tek sahipli botlar için pratik desen: kullanıcı kimliğinizi `channels.telegram.allowFrom` içinde ayarlayın, `groupAllowFrom` değerini ayarlamadan bırakın ve hedef gruplara `channels.telegram.groups` altında izin verin.
    Çalışma zamanı notu: `channels.telegram` tamamen eksikse, `channels.defaults.groupPolicy` açıkça ayarlanmadığı sürece çalışma zamanı varsayılan olarak kapalı kalan `groupPolicy="allowlist"` kullanır.

    Örnek: belirli bir gruptaki herhangi bir üyeye izin ver:

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

    Örnek: belirli bir grup içinde yalnızca belirli kullanıcılara izin ver:

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
      Yaygın hata: `groupAllowFrom`, bir Telegram grup izin listesi değildir.

      - `-1001234567890` gibi negatif Telegram grup veya süper grup sohbet kimliklerini `channels.telegram.groups` altına koyun.
      - İzin verilen bir grup içinde hangi kişilerin botu tetikleyebileceğini sınırlamak istediğinizde `8734062810` gibi Telegram kullanıcı kimliklerini `groupAllowFrom` altına koyun.
      - `groupAllowFrom: ["*"]` değerini yalnızca izin verilen bir grubun herhangi bir üyesinin botla konuşabilmesini istediğinizde kullanın.

    </Warning>

  </Tab>

  <Tab title="Mention behavior">
    Grup yanıtları varsayılan olarak bahsetme gerektirir.

    Bahsetme şunlardan gelebilir:

    - yerel `@botusername` bahsetmesi veya
    - şu alanlardaki bahsetme desenleri:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Oturum düzeyi komut geçişleri:

    - `/activation always`
    - `/activation mention`

    Bunlar yalnızca oturum durumunu günceller. Kalıcılık için yapılandırma kullanın.

    Kalıcı yapılandırma örneği:

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

    - bir grup mesajını `@userinfobot` / `@getidsbot` adresine iletin
    - veya `openclaw logs --follow` çıktısından `chat.id` değerini okuyun
    - veya Bot API `getUpdates` çıktısını inceleyin

  </Tab>
</Tabs>

## Çalışma zamanı davranışı

- Telegram, Gateway süreci tarafından sahiplenilir.
- Yönlendirme deterministiktir: Telegram gelen iletileri Telegram'a yanıtlanır (model kanalları seçmez).
- Gelen iletiler, yanıt meta verileri ve medya yer tutucularıyla paylaşılan kanal zarfına normalleştirilir.
- Grup oturumları grup kimliğine göre yalıtılır. Forum konuları, konuları yalıtılmış tutmak için `:topic:<threadId>` ekler.
- DM iletileri `message_thread_id` taşıyabilir; OpenClaw, yanıtlar için iş parçacığı kimliğini korur ancak DM'leri varsayılan olarak düz oturumda tutar. Bilerek DM konu oturumu yalıtımı istediğinizde `channels.telegram.dm.threadReplies: "inbound"`, `channels.telegram.direct.<chatId>.threadReplies: "inbound"`, `requireTopic: true` veya eşleşen bir konu yapılandırması ayarlayın.
- Uzun yoklama, sohbet başına/iş parçacığı başına sıralama ile grammY runner kullanır. Genel runner sink eşzamanlılığı `agents.defaults.maxConcurrent` kullanır.
- Uzun yoklama, her Gateway süreci içinde korunur; böylece bir bot token'ını aynı anda yalnızca bir etkin yoklayıcı kullanabilir. Hâlâ `getUpdates` 409 çakışmaları görüyorsanız başka bir OpenClaw Gateway, betik veya harici yoklayıcı büyük olasılıkla aynı token'ı kullanıyordur.
- Uzun yoklama watchdog yeniden başlatmaları, varsayılan olarak tamamlanmış `getUpdates` canlılığı olmadan 120 saniye sonra tetiklenir. `channels.telegram.pollingStallThresholdMs` değerini yalnızca dağıtımınız uzun süren işler sırasında hâlâ hatalı yoklama duraklaması yeniden başlatmaları görüyorsa artırın. Değer milisaniye cinsindendir ve `30000` ile `600000` arasında olabilir; hesap başına geçersiz kılmalar desteklenir.
- Telegram Bot API okundu bilgisi desteğine sahip değildir (`sendReadReceipts` uygulanmaz).

## Özellik referansı

<AccordionGroup>
  <Accordion title="Live stream preview (message edits)">
    OpenClaw, kısmi yanıtları gerçek zamanlı olarak akışa verebilir:

    - doğrudan sohbetler: önizleme iletisi + `editMessageText`
    - gruplar/konular: önizleme iletisi + `editMessageText`

    Gereksinim:

    - `channels.telegram.streaming`, `off | partial | block | progress` değerlerinden biridir (varsayılan: `partial`)
    - `progress`, düzenlenebilir tek bir durum taslağını korur ve son teslimata kadar bunu araç ilerlemesiyle günceller
    - `streaming.preview.toolProgress`, araç/ilerleme güncellemelerinin aynı düzenlenen önizleme iletisini yeniden kullanıp kullanmayacağını denetler (varsayılan: önizleme akışı etkin olduğunda `true`)
    - eski `channels.telegram.streamMode` ve boolean `streaming` değerleri algılanır; bunları `channels.telegram.streaming.mode` değerine taşımak için `openclaw doctor --fix` çalıştırın

    Araç ilerlemesi önizleme güncellemeleri, araçlar çalışırken gösterilen kısa durum satırlarıdır; örneğin komut yürütme, dosya okumaları, planlama güncellemeleri veya yama özetleri. Telegram, `v2026.4.22` ve sonraki sürümlerde yayımlanan OpenClaw davranışıyla eşleşmesi için bunları varsayılan olarak etkin tutar. Yanıt metni için düzenlenen önizlemeyi koruyup araç ilerleme satırlarını gizlemek için şunu ayarlayın:

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

    `streaming.mode: "off"` ayarını yalnızca sadece final teslimi istediğinizde kullanın: Telegram önizleme düzenlemeleri devre dışı bırakılır ve genel araç/ilerleme sohbeti bağımsız durum mesajları olarak gönderilmek yerine bastırılır. Onay istemleri, medya yükleri ve hatalar normal final teslimi üzerinden yönlendirilmeye devam eder. Yalnızca araç ilerleme durumu satırlarını gizlerken yanıt önizleme düzenlemelerini korumak istediğinizde `streaming.preview.toolProgress: false` kullanın.

    <Note>
      Telegram seçili alıntı yanıtları istisnadır. `replyToMode` `"first"`, `"all"` veya `"batched"` olduğunda ve gelen mesaj seçili alıntı metni içerdiğinde, OpenClaw final yanıtını yanıt önizlemesini düzenlemek yerine Telegram'ın yerel alıntı-yanıt yolu üzerinden gönderir; bu nedenle `streaming.preview.toolProgress` o tur için kısa durum satırlarını gösteremez. Seçili alıntı metni olmayan mevcut mesaj yanıtları önizleme akışını korumaya devam eder. Araç ilerleme görünürlüğü yerel alıntı yanıtlarından daha önemli olduğunda `replyToMode: "off"` ayarını yapın veya bu ödünleşimi kabul etmek için `streaming.preview.toolProgress: false` ayarını yapın.
    </Note>

    Yalnızca metin yanıtları için:

    - kısa DM/grup/konu önizlemeleri: OpenClaw aynı önizleme mesajını korur ve önizleme göründükten sonra görünür, önizleme olmayan bir mesaj gönderilmediyse final düzenlemesini yerinde yapar
    - görünür önizleme olmayan çıktıyla izlenen önizlemeler: OpenClaw tamamlanan yanıtı yeni bir final mesajı olarak gönderir ve eski önizlemeyi temizler; böylece final yanıt ara çıktının ardından görünür
    - yaklaşık bir dakikadan eski önizlemeler: OpenClaw tamamlanan yanıtı yeni bir final mesajı olarak gönderir ve ardından önizlemeyi temizler; böylece Telegram'ın görünür zaman damgası önizlemenin oluşturulma zamanı yerine tamamlanma zamanını yansıtır

    Karmaşık yanıtlar için (örneğin medya yükleri), OpenClaw normal final teslimine geri döner ve ardından önizleme mesajını temizler.

    Önizleme akışı, blok akışından ayrıdır. Telegram için blok akışı açıkça etkinleştirildiğinde, OpenClaw çift akışı önlemek için önizleme akışını atlar.

    Yalnızca Telegram'a özel muhakeme akışı:

    - `/reasoning stream` üretim sırasında muhakemeyi canlı önizlemeye gönderir
    - final yanıt muhakeme metni olmadan gönderilir

  </Accordion>

  <Accordion title="Biçimlendirme ve HTML geri dönüşü">
    Giden metin Telegram `parse_mode: "HTML"` kullanır.

    - Markdown benzeri metin Telegram açısından güvenli HTML'ye dönüştürülür.
    - Ham model HTML'si Telegram ayrıştırma hatalarını azaltmak için kaçışlanır.
    - Telegram ayrıştırılmış HTML'yi reddederse OpenClaw düz metin olarak yeniden dener.

    Bağlantı önizlemeleri varsayılan olarak etkindir ve `channels.telegram.linkPreview: false` ile devre dışı bırakılabilir.

  </Accordion>

  <Accordion title="Yerel komutlar ve özel komutlar">
    Telegram komut menüsü kaydı başlangıçta `setMyCommands` ile yönetilir.

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
    - özel komutlar yerel komutların üzerine yazamaz
    - çakışmalar/yinelemeler atlanır ve günlüğe kaydedilir

    Notlar:

    - özel komutlar yalnızca menü girdileridir; davranışı otomatik olarak uygulamazlar
    - plugin/skill komutları Telegram menüsünde gösterilmese bile yazıldığında yine de çalışabilir

    Yerel komutlar devre dışıysa yerleşikler kaldırılır. Yapılandırıldıysa özel/plugin komutları yine de kaydolabilir.

    Yaygın kurulum hataları:

    - `setMyCommands failed` ile `BOT_COMMANDS_TOO_MUCH`, Telegram menüsünün kırpmadan sonra hâlâ taştığı anlamına gelir; plugin/skill/özel komutları azaltın veya `channels.telegram.commands.native` ayarını devre dışı bırakın.
    - Doğrudan Bot API curl komutları çalışırken `deleteWebhook`, `deleteMyCommands` veya `setMyCommands` işlemlerinin `404: Not Found` ile başarısız olması, `channels.telegram.apiRoot` değerinin tam `/bot<TOKEN>` uç noktasına ayarlandığı anlamına gelebilir. `apiRoot` yalnızca Bot API kökü olmalıdır ve `openclaw doctor --fix` yanlışlıkla eklenmiş sondaki `/bot<TOKEN>` kısmını kaldırır.
    - `getMe returned 401`, Telegram'ın yapılandırılmış bot token'ını reddettiği anlamına gelir. `botToken`, `tokenFile` veya `TELEGRAM_BOT_TOKEN` değerini geçerli BotFather token'ı ile güncelleyin; OpenClaw polling başlamadan durduğu için bu bir Webhook temizleme hatası olarak bildirilmez.
    - `setMyCommands failed` ve ağ/fetch hataları genellikle `api.telegram.org` adresine giden DNS/HTTPS trafiğinin engellendiği anlamına gelir.

    ### Cihaz eşleştirme komutları (`device-pair` plugin'i)

    `device-pair` plugin'i yüklendiğinde:

    1. `/pair` kurulum kodu üretir
    2. kodu iOS uygulamasına yapıştırın
    3. `/pair pending` bekleyen istekleri listeler (rol/kapsamlar dahil)
    4. isteği onaylayın:
       - açık onay için `/pair approve <requestId>`
       - yalnızca bir bekleyen istek olduğunda `/pair approve`
       - en güncel olan için `/pair approve latest`

    Kurulum kodu kısa ömürlü bir bootstrap token taşır. Yerleşik bootstrap devri, birincil node token'ını `scopes: []` konumunda tutar; devredilen tüm operatör token'ları `operator.approvals`, `operator.read`, `operator.talk.secrets` ve `operator.write` ile sınırlı kalır. Bootstrap kapsam denetimleri rol ön eklidir, bu nedenle bu operatör izin listesi yalnızca operatör isteklerini karşılar; operatör olmayan rollerin hâlâ kendi rol ön ekleri altında kapsamlara ihtiyacı vardır.

    Bir cihaz değişen kimlik doğrulama ayrıntılarıyla (örneğin rol/kapsamlar/açık anahtar) yeniden denerse, önceki bekleyen isteğin yerini yenisi alır ve yeni istek farklı bir `requestId` kullanır. Onaylamadan önce `/pair pending` komutunu yeniden çalıştırın.

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

    Eski `capabilities: ["inlineButtons"]`, `inlineButtons: "all"` ile eşlenir.

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

    Geri arama tıklamaları agente metin olarak aktarılır:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="Agentler ve otomasyon için Telegram mesaj eylemleri">
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
    Çalışma zamanı gönderimleri etkin yapılandırma/gizli değerler anlık görüntüsünü (başlangıç/yeniden yükleme) kullanır; bu nedenle eylem yolları gönderim başına geçici SecretRef yeniden çözümlemesi yapmaz.

    Tepki kaldırma semantiği: [/tools/reactions](/tr/tools/reactions)

  </Accordion>

  <Accordion title="Yanıt iş parçacığı etiketleri">
    Telegram, üretilen çıktıda açık yanıt iş parçacığı etiketlerini destekler:

    - `[[reply_to_current]]` tetikleyen mesaja yanıt verir
    - `[[reply_to:<id>]]` belirli bir Telegram mesaj kimliğine yanıt verir

    `channels.telegram.replyToMode` işleyişi denetler:

    - `off` (varsayılan)
    - `first`
    - `all`

    Yanıt iş parçacığı etkinleştirildiğinde ve özgün Telegram metni veya başlığı kullanılabilir olduğunda, OpenClaw otomatik olarak yerel Telegram alıntı parçası ekler. Telegram yerel alıntı metnini 1024 UTF-16 kod birimiyle sınırlar; bu nedenle daha uzun mesajlar baştan alıntılanır ve Telegram alıntıyı reddederse düz yanıta geri döner.

    Not: `off` örtük yanıt iş parçacığını devre dışı bırakır. Açık `[[reply_to_*]]` etiketleri yine de dikkate alınır.

  </Accordion>

  <Accordion title="Forum konuları ve iş parçacığı davranışı">
    Forum süper grupları:

    - konu oturum anahtarları `:topic:<threadId>` ekler
    - yanıtlar ve yazıyor eylemleri konu iş parçacığını hedefler
    - konu yapılandırma yolu:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Genel konu (`threadId=1`) özel durumu:

    - mesaj gönderimleri `message_thread_id` değerini atlar (Telegram `sendMessage(...thread_id=1)` çağrısını reddeder)
    - yazıyor eylemleri yine de `message_thread_id` içerir

    Konu kalıtımı: konu girdileri, geçersiz kılınmadıkça grup ayarlarını devralır (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` yalnızca konuya özeldir ve grup varsayılanlarından devralınmaz.

    **Konu başına agent yönlendirmesi**: Her konu, konu yapılandırmasında `agentId` ayarlanarak farklı bir agente yönlendirilebilir. Bu, her konuya kendi yalıtılmış çalışma alanını, belleğini ve oturumunu verir. Örnek:

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

    Her konunun ardından kendi oturum anahtarı olur: `agent:zu:telegram:group:-1001234567890:topic:3`

    **Kalıcı ACP konu bağlaması**: Forum konuları, üst düzey tipli ACP bağlamaları (`type: "acp"` ve `match.channel: "telegram"`, `peer.kind: "group"` içeren `bindings[]` ve `-1001234567890:topic:42` gibi konu nitelikli bir kimlik) aracılığıyla ACP harness oturumlarını sabitleyebilir. Şu anda gruplarda/süper gruplarda forum konularıyla sınırlıdır. Bkz. [ACP Agentleri](/tr/tools/acp-agents).

    **Sohbetten iş parçacığına bağlı ACP spawn**: `/acp spawn <agent> --thread here|auto` mevcut konuyu yeni bir ACP oturumuna bağlar; takip mesajları doğrudan oraya yönlendirilir. OpenClaw spawn onayını konu içinde sabitler. `channels.telegram.threadBindings.spawnSessions` etkin kalmalıdır (varsayılan: `true`).

    Şablon bağlamı `MessageThreadId` ve `IsForum` sunar. `message_thread_id` içeren DM sohbetleri varsayılan olarak DM yönlendirmesini ve yanıt meta verilerini düz oturumlarda tutar; iş parçacığı farkındalıklı oturum anahtarlarını yalnızca `threadReplies: "inbound"`, `threadReplies: "always"`, `requireTopic: true` veya eşleşen bir konu yapılandırmasıyla yapılandırıldıklarında kullanırlar. Hesap varsayılanı için üst düzey `channels.telegram.dm.threadReplies`, tek bir DM için `direct.<chatId>.threadReplies` kullanın.

  </Accordion>

  <Accordion title="Ses, video ve çıkartmalar">
    ### Ses mesajları

    Telegram sesli notları ve ses dosyalarını ayırt eder.

    - varsayılan: ses dosyası davranışı
    - sesli not gönderimini zorlamak için agent yanıtında `[[audio_as_voice]]` etiketi
    - gelen sesli not transkriptleri agent bağlamında makine tarafından üretilmiş,
      güvenilmeyen metin olarak çerçevelenir; bahsetme algılama yine de ham
      transkripti kullanır, bu nedenle bahsetme geçitli sesli mesajlar çalışmaya devam eder.

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

    Telegram, video dosyaları ile video notlarını ayırt eder.

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

    Video notları açıklamaları desteklemez; sağlanan mesaj metni ayrı olarak gönderilir.

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

    Çıkartmalar bir kez tanımlanır (mümkün olduğunda) ve yinelenen görsel algı çağrılarını azaltmak için önbelleğe alınır.

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

    Çıkartma gönderme eylemi:

```json5
{
  action: "sticker",
  channel: "telegram",
  to: "123456789",
  fileId: "CAACAgIAAxkBAAI...",
}
```

    Önbelleğe alınmış çıkartmaları arayın:

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
    Telegram tepkileri `message_reaction` güncellemeleri olarak gelir (mesaj yüklerinden ayrıdır).

    Etkinleştirildiğinde, OpenClaw şu tür sistem olaylarını kuyruğa alır:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Yapılandırma:

    - `channels.telegram.reactionNotifications`: `off | own | all` (varsayılan: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (varsayılan: `minimal`)

    Notlar:

    - `own`, yalnızca bot tarafından gönderilen mesajlara verilen kullanıcı tepkileri anlamına gelir (gönderilmiş mesaj önbelleği üzerinden en iyi çabayla).
    - Tepki olayları yine de Telegram erişim denetimlerine (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`) uyar; yetkisiz gönderenler düşürülür.
    - Telegram, tepki güncellemelerinde ileti dizisi kimlikleri sağlamaz.
      - forum olmayan gruplar grup sohbeti oturumuna yönlendirilir
      - forum grupları, tam kaynak konuya değil, grubun genel konu oturumuna (`:topic:1`) yönlendirilir

    Yoklama/Webhook için `allowed_updates` otomatik olarak `message_reaction` içerir.

  </Accordion>

  <Accordion title="Ack tepkileri">
    OpenClaw gelen bir mesajı işlerken `ackReaction` bir onay emojisi gönderir.

    Çözüm sırası:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - aracı kimliği emoji yedeği (`agents.list[].identity.emoji`, aksi halde "👀")

    Notlar:

    - Telegram unicode emoji bekler (örneğin "👀").
    - Bir kanal veya hesap için tepkiyi devre dışı bırakmak üzere `""` kullanın.

  </Accordion>

  <Accordion title="Telegram olayları ve komutlarından yapılandırma yazımları">
    Kanal yapılandırma yazımları varsayılan olarak etkindir (`configWrites !== false`).

    Telegram tarafından tetiklenen yazımlar şunları içerir:

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
    Varsayılan uzun yoklamadır. Webhook modu için `channels.telegram.webhookUrl` ve `channels.telegram.webhookSecret` ayarlayın; isteğe bağlı `webhookPath`, `webhookHost`, `webhookPort` (varsayılanlar `/telegram-webhook`, `127.0.0.1`, `8787`).

    Yerel dinleyici `127.0.0.1:8787` adresine bağlanır. Genel giriş için yerel bağlantı noktasının önüne bir ters proxy koyun veya bilinçli olarak `webhookHost: "0.0.0.0"` ayarlayın.

    Webhook modu, Telegram'a `200` döndürmeden önce istek korumalarını, Telegram gizli belirtecini ve JSON gövdesini doğrular.
    OpenClaw daha sonra güncellemeyi uzun yoklamada kullanılan aynı sohbet başına/konu başına bot hatları üzerinden zaman uyumsuz olarak işler; böylece yavaş aracı turları Telegram'ın teslim ACK'sini bekletmez.

  </Accordion>

  <Accordion title="Sınırlar, yeniden deneme ve CLI hedefleri">
    - `channels.telegram.textChunkLimit` varsayılanı 4000'dir.
    - `channels.telegram.chunkMode="newline"` uzunluğa göre bölmeden önce paragraf sınırlarını (boş satırları) tercih eder.
    - `channels.telegram.mediaMaxMb` (varsayılan 100), gelen ve giden Telegram medya boyutunu sınırlar.
    - `channels.telegram.mediaGroupFlushMs` (varsayılan 500), Telegram albümlerinin/medya gruplarının OpenClaw tarafından tek bir gelen mesaj olarak gönderilmeden önce ne kadar süre arabelleğe alınacağını denetler. Albüm parçaları geç gelirse artırın; albüm yanıt gecikmesini azaltmak için düşürün.
    - `channels.telegram.timeoutSeconds`, Telegram API istemci zaman aşımını geçersiz kılar (ayarlanmamışsa grammY varsayılanı geçerlidir). Bot istemcileri, yapılandırılmış değerleri 60 saniyelik giden metin/yazıyor isteği korumasının altında sınırlar; böylece grammY, OpenClaw'ın taşıma koruması ve yedeği çalışmadan önce görünür yanıt teslimini iptal etmez. Uzun yoklama, boşta kalan yoklamaların süresiz terk edilmemesi için yine de 45 saniyelik `getUpdates` isteği koruması kullanır.
    - `channels.telegram.pollingStallThresholdMs` varsayılan olarak `120000` olur; yalnızca yanlış pozitif yoklama takılması yeniden başlatmaları için `30000` ile `600000` arasında ayarlayın.
    - grup bağlam geçmişi `channels.telegram.historyLimit` veya `messages.groupChat.historyLimit` kullanır (varsayılan 50); `0` devre dışı bırakır.
    - yanıt/alıntı/iletme ek bağlamı şu anda alındığı gibi geçirilir.
    - Telegram izin listeleri öncelikle aracıyı kimin tetikleyebileceğini sınırlar; tam bir ek bağlam sansürleme sınırı değildir.
    - DM geçmiş denetimleri:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - `channels.telegram.retry` yapılandırması, kurtarılabilir giden API hataları için Telegram gönderme yardımcılarına (CLI/araçlar/eylemler) uygulanır. Gelen son yanıt teslimi de Telegram ön bağlantı hataları için sınırlı güvenli gönderme yeniden denemesi kullanır, ancak görünür mesajları çoğaltabilecek belirsiz gönderim sonrası ağ zarflarını yeniden denemez.

    CLI gönderme hedefi sayısal sohbet kimliği veya kullanıcı adı olabilir:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
```

    Telegram yoklamaları `openclaw message poll` kullanır ve forum konularını destekler:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    Yalnızca Telegram yoklama bayrakları:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - forum konuları için `--thread-id` (veya bir `:topic:` hedefi kullanın)

    Telegram gönderimi ayrıca şunları destekler:

    - `channels.telegram.capabilities.inlineButtons` izin verdiğinde satır içi klavyeler için `buttons` bloklarıyla `--presentation`
    - bot o sohbette sabitleyebildiğinde sabitlenmiş teslim istemek için `--pin` veya `--delivery '{"pin":true}'`
    - giden görüntüleri ve GIF'leri sıkıştırılmış fotoğraf veya animasyonlu medya yüklemeleri yerine belge olarak göndermek için `--force-document`

    Eylem kapılama:

    - `channels.telegram.actions.sendMessage=false`, yoklamalar dahil giden Telegram mesajlarını devre dışı bırakır
    - `channels.telegram.actions.poll=false`, normal gönderimleri etkin bırakırken Telegram yoklaması oluşturmayı devre dışı bırakır

  </Accordion>

  <Accordion title="Telegram'da exec onayları">
    Telegram, onaylayan DM'lerinde exec onaylarını destekler ve isteğe bağlı olarak istemleri kaynak sohbet veya konuda gönderebilir. Onaylayanlar sayısal Telegram kullanıcı kimlikleri olmalıdır.

    Yapılandırma yolu:

    - `channels.telegram.execApprovals.enabled` (en az bir onaylayan çözümlenebilir olduğunda otomatik etkinleşir)
    - `channels.telegram.execApprovals.approvers` (`commands.ownerAllowFrom` içindeki sayısal sahip kimliklerine geri döner)
    - `channels.telegram.execApprovals.target`: `dm` (varsayılan) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` ve `defaultTo`, botla kimin konuşabileceğini ve normal yanıtları nereye göndereceğini denetler. Bunlar birini exec onaylayanı yapmaz. Henüz komut sahibi yoksa ilk onaylanmış DM eşleştirmesi `commands.ownerAllowFrom` öğesini başlatır; böylece tek sahipli kurulum, `execApprovals.approvers` altında kimlikleri çoğaltmadan çalışmaya devam eder.

    Kanal teslimi komut metnini sohbette gösterir; `channel` veya `both` değerlerini yalnızca güvenilen gruplarda/konularda etkinleştirin. İstem bir forum konusuna düştüğünde, OpenClaw onay istemi ve devamı için konuyu korur. Exec onaylarının süresi varsayılan olarak 30 dakika sonra dolar.

    Satır içi onay düğmeleri de `channels.telegram.capabilities.inlineButtons` öğesinin hedef yüzeye (`dm`, `group` veya `all`) izin vermesini gerektirir. `plugin:` önekli onay kimlikleri Plugin onayları üzerinden çözümlenir; diğerleri önce exec onayları üzerinden çözümlenir.

    Bkz. [Exec onayları](/tr/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Hata yanıtı denetimleri

Aracı bir teslim veya sağlayıcı hatasıyla karşılaştığında, Telegram hata metniyle yanıt verebilir ya da bunu bastırabilir. Bu davranışı iki yapılandırma anahtarı denetler:

| Anahtar                             | Değerler          | Varsayılan | Açıklama                                                                                       |
| ----------------------------------- | ----------------- | ---------- | ---------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply`    | `reply` sohbete dostça bir hata mesajı gönderir. `silent` hata yanıtlarını tamamen bastırır.   |
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
  <Accordion title="Bot, bahsedilmeyen grup mesajlarına yanıt vermiyor">

    - `requireMention=false` ise Telegram gizlilik modu tam görünürlüğe izin vermelidir.
      - BotFather: `/setprivacy` -> Devre dışı bırak
      - ardından botu gruptan kaldırın ve tekrar ekleyin
    - Yapılandırma bahsedilmeyen grup mesajları beklediğinde `openclaw channels status` uyarır.
    - `openclaw channels status --probe` açık sayısal grup kimliklerini denetleyebilir; joker karakter `"*"` üyelik açısından yoklanamaz.
    - hızlı oturum testi: `/activation always`.

  </Accordion>

  <Accordion title="Bot grup mesajlarını hiç görmüyor">

    - `channels.telegram.groups` varsa grup listelenmelidir (veya `"*"` içermelidir)
    - botun gruptaki üyeliğini doğrulayın
    - atlama nedenleri için günlükleri inceleyin: `openclaw logs --follow`

  </Accordion>

  <Accordion title="Komutlar kısmen çalışıyor veya hiç çalışmıyor">

    - gönderen kimliğinizi yetkilendirin (eşleştirme ve/veya sayısal `allowFrom`)
    - grup ilkesi `open` olsa bile komut yetkilendirmesi yine de uygulanır
    - `BOT_COMMANDS_TOO_MUCH` ile `setMyCommands failed`, yerel menüde çok fazla giriş olduğu anlamına gelir; Plugin/Skills/özel komutları azaltın veya yerel menüleri devre dışı bırakın
    - `deleteMyCommands` / `setMyCommands` başlangıç çağrıları ve `sendChatAction` yazıyor çağrıları sınırlıdır ve istek zaman aşımında Telegram'ın taşıma yedeği üzerinden bir kez yeniden denenir. Kalıcı ağ/fetch hataları genellikle `api.telegram.org` için DNS/HTTPS erişilebilirlik sorunlarını gösterir

  </Accordion>

  <Accordion title="Başlangıç yetkisiz belirteç bildiriyor">

    - `getMe returned 401`, yapılandırılmış bot belirteci için bir Telegram kimlik doğrulama hatasıdır.
    - Bot belirtecini BotFather içinde yeniden kopyalayın veya yeniden oluşturun, ardından varsayılan hesap için `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken` ya da `TELEGRAM_BOT_TOKEN` değerini güncelleyin.
    - Başlatma sırasında `deleteWebhook 401 Unauthorized` da bir kimlik doğrulama hatasıdır; bunu "webhook yok" olarak ele almak, aynı hatalı belirteç arızasını yalnızca sonraki API çağrılarına ertelemiş olur.

  </Accordion>

  <Accordion title="Yoklama veya ağ kararsızlığı">

    - Node 22+ ve özel fetch/proxy, AbortSignal türleri uyuşmazsa anında iptal davranışını tetikleyebilir.
    - Bazı ana makineler `api.telegram.org` adresini önce IPv6 olarak çözümler; bozuk IPv6 çıkışı aralıklı Telegram API arızalarına neden olabilir.
    - Günlükler `TypeError: fetch failed` veya `Network request for 'getUpdates' failed!` içeriyorsa OpenClaw artık bunları kurtarılabilir ağ hataları olarak yeniden dener.
    - Yoklama başlatılırken OpenClaw, başarılı başlangıç `getMe` probunu grammY için yeniden kullanır; böylece çalıştırıcının ilk `getUpdates` öncesinde ikinci bir `getMe` çağrısına ihtiyacı olmaz.
    - Yoklama başlatılırken `deleteWebhook` geçici bir ağ hatasıyla başarısız olursa OpenClaw başka bir yoklama öncesi kontrol düzlemi çağrısı yapmak yerine uzun yoklamaya devam eder. Hala etkin olan bir webhook, `getUpdates` çakışması olarak görünür; OpenClaw daha sonra Telegram aktarımını yeniden oluşturur ve webhook temizliğini yeniden dener.
    - Telegram soketleri kısa ve sabit bir aralıkla yeniden oluşturuluyorsa düşük bir `channels.telegram.timeoutSeconds` değeri olup olmadığını kontrol edin; bot istemcileri yapılandırılmış değerleri giden ve `getUpdates` istek korumalarının altında sınırlar, ancak eski sürümler bu değerler söz konusu korumaların altına ayarlandığında her yoklamayı veya yanıtı iptal edebiliyordu.
    - Günlükler `Polling stall detected` içeriyorsa OpenClaw varsayılan olarak tamamlanmış uzun yoklama canlılığı olmadan 120 saniye geçtikten sonra yoklamayı yeniden başlatır ve Telegram aktarımını yeniden oluşturur.
    - `openclaw channels status --probe` ve `openclaw doctor`, çalışan bir yoklama hesabı başlangıç ek süresinden sonra `getUpdates` işlemini tamamlamadığında, çalışan bir webhook hesabı başlangıç ek süresinden sonra `setWebhook` işlemini tamamlamadığında veya son başarılı yoklama aktarımı etkinliği bayatladığında uyarır.
    - `channels.telegram.pollingStallThresholdMs` değerini yalnızca uzun süre çalışan `getUpdates` çağrıları sağlıklıysa ancak ana makineniz yine de hatalı yoklama-durması yeniden başlatmaları bildiriyorsa artırın. Kalıcı durmalar genellikle ana makine ile `api.telegram.org` arasındaki proxy, DNS, IPv6 veya TLS çıkışı sorunlarına işaret eder.
    - Telegram ayrıca Bot API aktarımı için süreç proxy ortam değişkenlerini dikkate alır; bunlara `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` ve bunların küçük harfli varyantları dahildir. `NO_PROXY` / `no_proxy` yine de `api.telegram.org` adresini atlayabilir.
    - OpenClaw yönetimli proxy bir hizmet ortamı için `OPENCLAW_PROXY_URL` üzerinden yapılandırılmışsa ve standart proxy ortam değişkeni yoksa Telegram bu URL'yi Bot API aktarımı için de kullanır.
    - Kararsız doğrudan çıkış/TLS bulunan VPS ana makinelerinde, Telegram API çağrılarını `channels.telegram.proxy` üzerinden yönlendirin:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ varsayılan olarak `autoSelectFamily=true` kullanır (WSL2 hariç). Telegram DNS sonuç sırası önce `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`, sonra `channels.telegram.network.dnsResultOrder`, ardından `NODE_OPTIONS=--dns-result-order=ipv4first` gibi süreç varsayılanını dikkate alır; hiçbiri uygulanmazsa Node 22+ `ipv4first` değerine geri döner.
    - Ana makineniz WSL2 ise veya açıkça yalnızca IPv4 davranışıyla daha iyi çalışıyorsa aile seçimini zorlayın:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - RFC 2544 kıyaslama aralığı yanıtlarına (`198.18.0.0/15`) Telegram medya indirmeleri için varsayılan olarak zaten izin verilir. Güvenilir bir sahte-IP veya şeffaf proxy, medya indirmeleri sırasında `api.telegram.org` adresini başka bir özel/dahili/özel-kullanım adresine yeniden yazıyorsa yalnızca Telegram için geçerli atlamayı etkinleştirebilirsiniz:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - Aynı etkinleştirme her hesap için
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork` konumunda kullanılabilir.
    - Proxy'niz Telegram medya ana makinelerini `198.18.x.x` adreslerine çözümlüyorsa önce
      tehlikeli bayrağı kapalı bırakın. Telegram medyası varsayılan olarak RFC 2544
      kıyaslama aralığına zaten izin verir.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork`, Telegram
      medya SSRF korumalarını zayıflatır. Bunu yalnızca Clash, Mihomo veya Surge
      sahte-IP yönlendirmesi gibi, RFC 2544 kıyaslama aralığı dışındaki özel
      ya da özel-kullanım yanıtları üreten güvenilir ve operatör denetimli proxy
      ortamlarında kullanın. Normal genel internet Telegram erişimi için kapalı bırakın.
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

<Accordion title="Yüksek sinyalli Telegram alanları">

- başlangıç/kimlik doğrulama: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` normal bir dosyaya işaret etmelidir; sembolik bağlantılar reddedilir)
- erişim denetimi: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, üst düzey `bindings[]` (`type: "acp"`)
- yürütme onayları: `execApprovals`, `accounts.*.execApprovals`
- komut/menü: `commands.native`, `commands.nativeSkills`, `customCommands`
- iş parçacıkları/yanıtlar: `replyToMode`, `dm.threadReplies`, `direct.*.threadReplies`
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
Çok hesaplı öncelik: iki veya daha fazla hesap kimliği yapılandırıldığında, varsayılan yönlendirmeyi açık hale getirmek için `channels.telegram.defaultAccount` ayarlayın (veya `channels.telegram.accounts.default` ekleyin). Aksi halde OpenClaw ilk normalleştirilmiş hesap kimliğine geri döner ve `openclaw doctor` uyarır. Adlandırılmış hesaplar `channels.telegram.allowFrom` / `groupAllowFrom` değerlerini devralır, ancak `accounts.default.*` değerlerini devralmaz.
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
    Gelen iletileri aracılara yönlendirin.
  </Card>
  <Card title="Güvenlik" icon="shield" href="/tr/gateway/security">
    Tehdit modeli ve sağlamlaştırma.
  </Card>
  <Card title="Çok aracılı yönlendirme" icon="sitemap" href="/tr/concepts/multi-agent">
    Grupları ve konuları aracılarla eşleyin.
  </Card>
  <Card title="Sorun giderme" icon="wrench" href="/tr/channels/troubleshooting">
    Kanallar arası tanılama.
  </Card>
</CardGroup>
