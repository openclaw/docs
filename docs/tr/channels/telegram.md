---
read_when:
    - Telegram özellikleri veya Webhook'lar üzerinde çalışma
summary: Telegram bot desteği durumu, yetenekleri ve yapılandırması
title: Telegram
x-i18n:
    generated_at: "2026-05-04T07:02:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6ef1b019a6a0e261b33972b5edffaedd29310b1333d112bade2e79e9d56887c6
    source_path: channels/telegram.md
    workflow: 16
---

Üretime hazır bot DM'leri ve grupları için grammY ile çalışır. Varsayılan mod long polling'dir; Webhook modu isteğe bağlıdır.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/tr/channels/pairing">
    Telegram için varsayılan DM ilkesi eşleştirmedir.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/tr/channels/troubleshooting">
    Kanallar arası tanılama ve onarım playbook'ları.
  </Card>
  <Card title="Gateway configuration" icon="settings" href="/tr/gateway/configuration">
    Tam kanal yapılandırma kalıpları ve örnekleri.
  </Card>
</CardGroup>

## Hızlı kurulum

<Steps>
  <Step title="Create the bot token in BotFather">
    Telegram'ı açın ve **@BotFather** ile sohbet edin (kullanıcı adının tam olarak `@BotFather` olduğunu doğrulayın).

    `/newbot` komutunu çalıştırın, istemleri izleyin ve token'ı kaydedin.

  </Step>

  <Step title="Configure token and DM policy">

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
    Telegram **`openclaw channels login telegram` kullanmaz**; token'ı config/env içinde yapılandırın, ardından gateway'i başlatın.

  </Step>

  <Step title="Start gateway and approve first DM">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    Eşleştirme kodları 1 saat sonra sona erer.

  </Step>

  <Step title="Add the bot to a group">
    Botu grubunuza ekleyin, ardından erişim modelinizle eşleşecek şekilde `channels.telegram.groups` ve `groupPolicy` ayarlarını belirleyin.
  </Step>
</Steps>

<Note>
Token çözümleme sırası hesap duyarlıdır. Pratikte, config değerleri env geri dönüşüne göre önceliklidir ve `TELEGRAM_BOT_TOKEN` yalnızca varsayılan hesaba uygulanır.
</Note>

## Telegram tarafı ayarları

<AccordionGroup>
  <Accordion title="Privacy mode and group visibility">
    Telegram botları varsayılan olarak **Privacy Mode** kullanır; bu, gruplarda aldıkları mesajları sınırlar.

    Botun tüm grup mesajlarını görmesi gerekiyorsa şunlardan birini yapın:

    - `/setprivacy` ile gizlilik modunu devre dışı bırakın veya
    - botu grup yöneticisi yapın.

    Gizlilik modunu değiştirirken, Telegram'ın değişikliği uygulaması için botu her gruptan kaldırıp yeniden ekleyin.

  </Accordion>

  <Accordion title="Group permissions">
    Yönetici durumu Telegram grup ayarlarından kontrol edilir.

    Yönetici botlar tüm grup mesajlarını alır; bu, her zaman açık grup davranışı için kullanışlıdır.

  </Accordion>

  <Accordion title="Helpful BotFather toggles">

    - Grup eklemelerine izin vermek/reddetmek için `/setjoingroups`
    - Grup görünürlük davranışı için `/setprivacy`

  </Accordion>
</AccordionGroup>

## Erişim kontrolü ve etkinleştirme

<Tabs>
  <Tab title="DM policy">
    `channels.telegram.dmPolicy` doğrudan mesaj erişimini kontrol eder:

    - `pairing` (varsayılan)
    - `allowlist` (`allowFrom` içinde en az bir gönderici ID'si gerektirir)
    - `open` (`allowFrom` içinde `"*"` olmasını gerektirir)
    - `disabled`

    `allowFrom: ["*"]` ile `dmPolicy: "open"`, bot kullanıcı adını bulan veya tahmin eden herhangi bir Telegram hesabının bota komut vermesine izin verir. Bunu yalnızca araçları sıkı biçimde kısıtlanmış, bilerek herkese açık yapılan botlar için kullanın; tek sahipli botlar sayısal kullanıcı ID'leriyle `allowlist` kullanmalıdır.

    `channels.telegram.allowFrom` sayısal Telegram kullanıcı ID'lerini kabul eder. `telegram:` / `tg:` önekleri kabul edilir ve normalize edilir.
    Çok hesaplı yapılandırmalarda, kısıtlayıcı üst düzey `channels.telegram.allowFrom` bir güvenlik sınırı olarak ele alınır: hesap düzeyi `allowFrom: ["*"]` girdileri, birleştirme sonrası etkin hesap izin listesinin hâlâ açık bir joker karakter içermediği sürece o hesabı herkese açık yapmaz.
    Boş `allowFrom` ile `dmPolicy: "allowlist"` tüm DM'leri engeller ve config doğrulaması tarafından reddedilir.
    Kurulum yalnızca sayısal kullanıcı ID'leri ister.
    Yükseltme yaptıysanız ve config'iniz `@username` allowlist girdileri içeriyorsa, bunları çözümlemek için `openclaw doctor --fix` çalıştırın (en iyi çaba; Telegram bot token'ı gerektirir).
    Daha önce pairing-store allowlist dosyalarına güveniyorsanız, `openclaw doctor --fix` allowlist akışlarında girdileri `channels.telegram.allowFrom` içine kurtarabilir (örneğin `dmPolicy: "allowlist"` henüz açık ID içermiyorsa).

    Tek sahipli botlar için erişim ilkesini config içinde kalıcı tutmak adına, önceki eşleştirme onaylarına bağlı kalmak yerine açık sayısal `allowFrom` ID'leriyle `dmPolicy: "allowlist"` tercih edin.

    Yaygın karışıklık: DM eşleştirme onayı, "bu gönderici her yerde yetkilidir" anlamına gelmez.
    Eşleştirme DM erişimi verir. Henüz komut sahibi yoksa, ilk onaylanan eşleştirme ayrıca `commands.ownerAllowFrom` değerini ayarlar; böylece yalnızca sahip komutları ve exec onayları için açık bir operatör hesabı olur.
    Grup gönderici yetkilendirmesi yine açık config allowlist'lerinden gelir.
    "Bir kez yetkilendirileyim, hem DM'ler hem de grup komutları çalışsın" istiyorsanız, sayısal Telegram kullanıcı ID'nizi `channels.telegram.allowFrom` içine koyun; yalnızca sahip komutları için `commands.ownerAllowFrom` değerinin `telegram:<your user id>` içerdiğinden emin olun.

    ### Telegram kullanıcı ID'nizi bulma

    Daha güvenli (üçüncü taraf bot yok):

    1. Botunuza DM gönderin.
    2. `openclaw logs --follow` çalıştırın.
    3. `from.id` değerini okuyun.

    Resmi Bot API yöntemi:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    Üçüncü taraf yöntemi (daha az gizli): `@userinfobot` veya `@getidsbot`.

  </Tab>

  <Tab title="Group policy and allowlists">
    İki kontrol birlikte uygulanır:

    1. **Hangi gruplara izin verilir** (`channels.telegram.groups`)
       - `groups` config yoksa:
         - `groupPolicy: "open"` ile: herhangi bir grup grup ID kontrollerinden geçebilir
         - `groupPolicy: "allowlist"` (varsayılan) ile: `groups` girdileri (veya `"*"`) eklenene kadar gruplar engellenir
       - `groups` yapılandırılmışsa: allowlist olarak davranır (açık ID'ler veya `"*"`)

    2. **Gruplarda hangi göndericilere izin verilir** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (varsayılan)
       - `disabled`

    `groupAllowFrom` grup gönderici filtrelemesi için kullanılır. Ayarlanmamışsa Telegram `allowFrom` değerine geri döner.
    `groupAllowFrom` girdileri sayısal Telegram kullanıcı ID'leri olmalıdır (`telegram:` / `tg:` önekleri normalize edilir).
    Telegram grup veya süper grup sohbet ID'lerini `groupAllowFrom` içine koymayın. Negatif sohbet ID'leri `channels.telegram.groups` altına aittir.
    Sayısal olmayan girdiler gönderici yetkilendirmesi için yok sayılır.
    Güvenlik sınırı (`2026.2.25+`): grup gönderici kimlik doğrulaması DM pairing-store onaylarını **devralmaz**.
    Eşleştirme yalnızca DM olarak kalır. Gruplar için `groupAllowFrom` veya grup/konu başına `allowFrom` ayarlayın.
    `groupAllowFrom` ayarlanmamışsa, Telegram pairing store'a değil config `allowFrom` değerine geri döner.
    Tek sahipli botlar için pratik kalıp: kullanıcı ID'nizi `channels.telegram.allowFrom` içine koyun, `groupAllowFrom` değerini ayarlamayın ve hedef gruplara `channels.telegram.groups` altında izin verin.
    Çalışma zamanı notu: `channels.telegram` tamamen eksikse, `channels.defaults.groupPolicy` açıkça ayarlanmadığı sürece çalışma zamanı fail-closed `groupPolicy="allowlist"` varsayılanını kullanır.

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
      Yaygın hata: `groupAllowFrom` bir Telegram grup allowlist'i değildir.

      - `-1001234567890` gibi negatif Telegram grup veya süper grup sohbet ID'lerini `channels.telegram.groups` altına koyun.
      - İzin verilen bir grup içindeki hangi kişilerin botu tetikleyebileceğini sınırlamak istediğinizde `8734062810` gibi Telegram kullanıcı ID'lerini `groupAllowFrom` altına koyun.
      - `groupAllowFrom: ["*"]` değerini yalnızca izin verilen bir grubun herhangi bir üyesinin botla konuşabilmesini istediğinizde kullanın.

    </Warning>

  </Tab>

  <Tab title="Mention behavior">
    Grup yanıtları varsayılan olarak mention gerektirir.

    Mention şu kaynaklardan gelebilir:

    - yerel `@botusername` mention'ı veya
    - şunlardaki mention kalıpları:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Oturum düzeyi komut anahtarları:

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
    - veya `openclaw logs --follow` çıktısından `chat.id` okuyun
    - veya Bot API `getUpdates` çıktısını inceleyin

  </Tab>
</Tabs>

## Çalışma zamanı davranışı

- Telegram, gateway sürecine aittir.
- Yönlendirme deterministiktir: Telegram'dan gelenler Telegram'a yanıtlanır (model kanal seçmez).
- Gelen mesajlar, yanıt meta verileri ve medya yer tutucularıyla paylaşılan kanal zarfına normalize edilir.
- Grup oturumları grup ID'sine göre yalıtılır. Forum konuları, konuları yalıtılmış tutmak için `:topic:<threadId>` ekler.
- DM mesajları `message_thread_id` taşıyabilir; OpenClaw yanıtlar için iş parçacığı ID'sini korur ancak varsayılan olarak DM'leri düz oturumda tutar. DM konu oturumu yalıtımını özellikle istediğinizde `channels.telegram.dm.threadReplies: "inbound"`, `channels.telegram.direct.<chatId>.threadReplies: "inbound"`, `requireTopic: true` veya eşleşen bir konu config'i yapılandırın.
- Long polling, sohbet/iş parçacığı başına sıralamayla grammY runner kullanır. Genel runner sink eşzamanlılığı `agents.defaults.maxConcurrent` kullanır.
- Long polling her gateway süreci içinde korunur; böylece aynı anda yalnızca bir etkin poller bir bot token'ını kullanabilir. Hâlâ `getUpdates` 409 çakışmaları görüyorsanız, aynı token'ı muhtemelen başka bir OpenClaw gateway'i, script veya harici poller kullanıyordur.
- Long-polling watchdog yeniden başlatmaları, varsayılan olarak 120 saniye boyunca tamamlanmış `getUpdates` canlılığı olmadığında tetiklenir. Dağıtımınız uzun süren işler sırasında hâlâ yanlış polling-stall yeniden başlatmaları görüyorsa yalnızca o zaman `channels.telegram.pollingStallThresholdMs` değerini artırın. Değer milisaniye cinsindendir ve `30000` ile `600000` arasında olabilir; hesap başına geçersiz kılmalar desteklenir.
- Telegram Bot API'nin okundu bilgisi desteği yoktur (`sendReadReceipts` uygulanmaz).

## Özellik referansı

<AccordionGroup>
  <Accordion title="Live stream preview (message edits)">
    OpenClaw kısmi yanıtları gerçek zamanlı olarak yayınlayabilir:

    - doğrudan sohbetler: önizleme mesajı + `editMessageText`
    - gruplar/konular: önizleme mesajı + `editMessageText`

    Gereksinim:

    - `channels.telegram.streaming`, `off | partial | block | progress` olmalıdır (varsayılan: `partial`)
    - `progress`, tek bir düzenlenebilir durum taslağını korur ve son teslimata kadar araç ilerlemesiyle günceller
    - `streaming.preview.toolProgress`, araç/ilerleme güncellemelerinin aynı düzenlenmiş önizleme mesajını yeniden kullanıp kullanmayacağını kontrol eder (önizleme streaming etkin olduğunda varsayılan: `true`)
    - `streaming.preview.commandText`, bu araç ilerlemesi satırlarının içindeki komut/exec ayrıntısını kontrol eder: `raw` (varsayılan, yayımlanmış davranışı korur) veya `status` (yalnızca araç etiketi)
    - eski `channels.telegram.streamMode` ve boolean `streaming` değerleri algılanır; bunları `channels.telegram.streaming.mode` değerine taşımak için `openclaw doctor --fix` çalıştırın

    Araç ilerlemesi önizleme güncellemeleri, araçlar çalışırken gösterilen kısa durum satırlarıdır; örneğin komut yürütme, dosya okumaları, planlama güncellemeleri veya yama özetleri. Telegram, `v2026.4.22` ve sonrası yayımlanmış OpenClaw davranışıyla eşleşmesi için bunları varsayılan olarak etkin tutar. Yanıt metni için düzenlenmiş önizlemeyi koruyup araç ilerlemesi satırlarını gizlemek için şunu ayarlayın:

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

    İlerleme taslağı modu için aynı komut metni ilkesini `streaming.progress` altına koyun:

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

    `streaming.mode: "off"` ayarını yalnızca sadece final teslim istediğinizde kullanın: Telegram önizleme düzenlemeleri devre dışı bırakılır ve genel araç/ilerleme sohbeti bağımsız durum iletileri olarak gönderilmek yerine bastırılır. Onay istemleri, medya yükleri ve hatalar yine normal final teslim üzerinden yönlendirilir. Yalnızca araç ilerleme durum satırlarını gizlerken yanıt önizleme düzenlemelerini korumak istediğinizde `streaming.preview.toolProgress: false` kullanın.

    <Note>
      Telegram seçili alıntı yanıtları istisnadır. `replyToMode` `"first"`, `"all"` veya `"batched"` olduğunda ve gelen ileti seçili alıntı metni içerdiğinde, OpenClaw final yanıtı yanıt önizlemesini düzenlemek yerine Telegram'ın yerel alıntı yanıt yolu üzerinden gönderir; bu nedenle `streaming.preview.toolProgress` o tur için kısa durum satırlarını gösteremez. Seçili alıntı metni olmayan geçerli ileti yanıtları önizleme akışını korumaya devam eder. Araç ilerleme görünürlüğü yerel alıntı yanıtlardan daha önemli olduğunda `replyToMode: "off"` ayarını yapın veya bu ödünleşimi kabul etmek için `streaming.preview.toolProgress: false` ayarını yapın.
    </Note>

    Yalnızca metin yanıtları için:

    - kısa DM/grup/konu önizlemeleri: OpenClaw, önizleme göründükten sonra görünür bir önizleme dışı ileti gönderilmediği sürece aynı önizleme iletisini korur ve final düzenlemeyi yerinde yapar
    - ardından görünür önizleme dışı çıktı gelen önizlemeler: OpenClaw tamamlanan yanıtı yeni bir final iletisi olarak gönderir ve eski önizlemeyi temizler; böylece final yanıt ara çıktıdan sonra görünür
    - yaklaşık bir dakikadan eski önizlemeler: OpenClaw tamamlanan yanıtı yeni bir final iletisi olarak gönderir ve sonra önizlemeyi temizler; böylece Telegram'ın görünür zaman damgası önizleme oluşturma zamanı yerine tamamlanma zamanını yansıtır

    Karmaşık yanıtlar için (örneğin medya yükleri), OpenClaw normal final teslime geri döner ve ardından önizleme iletisini temizler.

    Önizleme akışı, blok akışından ayrıdır. Telegram için blok akışı açıkça etkinleştirildiğinde, OpenClaw çift akışı önlemek için önizleme akışını atlar.

    Yalnızca Telegram akıl yürütme akışı:

    - `/reasoning stream` üretim sırasında akıl yürütmeyi canlı önizlemeye gönderir
    - akıl yürütme önizlemesi final teslimden sonra silinir; akıl yürütmenin görünür kalması gerektiğinde `/reasoning on` kullanın
    - final yanıt akıl yürütme metni olmadan gönderilir

  </Accordion>

  <Accordion title="Biçimlendirme ve HTML geri dönüşü">
    Giden metin Telegram `parse_mode: "HTML"` kullanır.

    - Markdown benzeri metin Telegram güvenli HTML'ye dönüştürülür.
    - Ham model HTML'si, Telegram ayrıştırma hatalarını azaltmak için kaçışlanır.
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
    - çakışmalar/kopyalar atlanır ve günlüğe yazılır

    Notlar:

    - özel komutlar yalnızca menü girdileridir; davranışı otomatik olarak uygulamazlar
    - Plugin/Skills komutları Telegram menüsünde gösterilmese bile yazıldığında çalışmaya devam edebilir

    Yerel komutlar devre dışı bırakılırsa yerleşik komutlar kaldırılır. Özel/Plugin komutları yapılandırılmışsa yine de kaydedilebilir.

    Yaygın kurulum hataları:

    - `BOT_COMMANDS_TOO_MUCH` ile `setMyCommands failed`, kırpmadan sonra Telegram menüsünün hâlâ taştığı anlamına gelir; Plugin/Skills/özel komutları azaltın veya `channels.telegram.commands.native` ayarını devre dışı bırakın.
    - Doğrudan Bot API curl komutları çalışırken `deleteWebhook`, `deleteMyCommands` veya `setMyCommands` işleminin `404: Not Found` ile başarısız olması, `channels.telegram.apiRoot` ayarının tam `/bot<TOKEN>` uç noktasına ayarlanmış olabileceği anlamına gelebilir. `apiRoot` yalnızca Bot API kökü olmalıdır ve `openclaw doctor --fix` yanlışlıkla eklenmiş sondaki `/bot<TOKEN>` bölümünü kaldırır.
    - `getMe returned 401`, Telegram'ın yapılandırılmış bot token'ını reddettiği anlamına gelir. `botToken`, `tokenFile` veya `TELEGRAM_BOT_TOKEN` değerini geçerli BotFather token'ı ile güncelleyin; OpenClaw yoklamadan önce durur, bu yüzden bu durum Webhook temizleme hatası olarak bildirilmez.
    - Ağ/fetch hataları ile `setMyCommands failed` genellikle `api.telegram.org` adresine giden DNS/HTTPS trafiğinin engellendiği anlamına gelir.

    ### Cihaz eşleme komutları (`device-pair` Plugin)

    `device-pair` Plugin yüklü olduğunda:

    1. `/pair` kurulum kodu üretir
    2. kodu iOS uygulamasına yapıştırın
    3. `/pair pending` bekleyen istekleri listeler (rol/kapsamlar dahil)
    4. isteği onaylayın:
       - açık onay için `/pair approve <requestId>`
       - yalnızca bir bekleyen istek olduğunda `/pair approve`
       - en yeni için `/pair approve latest`

    Kurulum kodu kısa ömürlü bir önyükleme token'ı taşır. Yerleşik önyükleme aktarımı birincil düğüm token'ını `scopes: []` değerinde tutar; aktarılan operatör token'ları `operator.approvals`, `operator.read`, `operator.talk.secrets` ve `operator.write` ile sınırlı kalır. Önyükleme kapsam kontrolleri rol öneklidir, bu nedenle bu operatör izin listesi yalnızca operatör isteklerini karşılar; operatör olmayan rollerin yine de kendi rol önekleri altında kapsamlara ihtiyacı vardır.

    Bir cihaz değişen kimlik doğrulama ayrıntılarıyla yeniden denerse (örneğin rol/kapsamlar/açık anahtar), önceki bekleyen istek geçersiz kılınır ve yeni istek farklı bir `requestId` kullanır. Onaylamadan önce `/pair pending` komutunu yeniden çalıştırın.

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

    Eski `capabilities: ["inlineButtons"]`, `inlineButtons: "all"` değerine eşlenir.

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

    Callback tıklamaları aracıya metin olarak iletilir:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="Aracılar ve otomasyon için Telegram ileti eylemleri">
    Telegram araç eylemleri şunları içerir:

    - `sendMessage` (`to`, `content`, isteğe bağlı `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, isteğe bağlı `iconColor`, `iconCustomEmojiId`)

    Kanal ileti eylemleri ergonomik takma adlar sunar (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Geçit kontrolleri:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (varsayılan: devre dışı)

    Not: `edit` ve `topic-create` şu anda varsayılan olarak etkindir ve ayrı `channels.telegram.actions.*` anahtarlarına sahip değildir.
    Çalışma zamanı gönderimleri etkin yapılandırma/gizli bilgiler anlık görüntüsünü (başlangıç/yeniden yükleme) kullanır; bu nedenle eylem yolları gönderim başına geçici SecretRef yeniden çözümlemesi yapmaz.

    Tepki kaldırma semantiği: [/tools/reactions](/tr/tools/reactions)

  </Accordion>

  <Accordion title="Yanıt iş parçacığı etiketleri">
    Telegram üretilen çıktıda açık yanıt iş parçacığı etiketlerini destekler:

    - `[[reply_to_current]]` tetikleyen iletiye yanıt verir
    - `[[reply_to:<id>]]` belirli bir Telegram ileti kimliğine yanıt verir

    `channels.telegram.replyToMode` işlemeyi denetler:

    - `off` (varsayılan)
    - `first`
    - `all`

    Yanıt iş parçacığı etkin olduğunda ve özgün Telegram metni veya açıklaması kullanılabilir olduğunda, OpenClaw otomatik olarak yerel bir Telegram alıntı parçası ekler. Telegram yerel alıntı metnini 1024 UTF-16 kod birimiyle sınırlar; bu nedenle daha uzun iletiler baştan alıntılanır ve Telegram alıntıyı reddederse düz yanıta geri döner.

    Not: `off` örtük yanıt iş parçacığını devre dışı bırakır. Açık `[[reply_to_*]]` etiketleri yine de dikkate alınır.

  </Accordion>

  <Accordion title="Forum konuları ve iş parçacığı davranışı">
    Forum süper grupları:

    - konu oturumu anahtarları `:topic:<threadId>` ekler
    - yanıtlar ve yazıyor eylemleri konu iş parçacığını hedefler
    - konu yapılandırma yolu:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Genel konu (`threadId=1`) özel durumu:

    - ileti gönderimleri `message_thread_id` değerini atlar (Telegram `sendMessage(...thread_id=1)` çağrısını reddeder)
    - yazıyor eylemleri yine de `message_thread_id` içerir

    Konu kalıtımı: konu girdileri geçersiz kılınmadıkça grup ayarlarını devralır (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` yalnızca konuya özeldir ve grup varsayılanlarından devralınmaz.

    **Konu başına aracı yönlendirme**: Her konu, konu yapılandırmasında `agentId` ayarlanarak farklı bir aracıya yönlendirilebilir. Bu, her konuya kendi yalıtılmış çalışma alanını, belleğini ve oturumunu verir. Örnek:

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

    **Kalıcı ACP konu bağlaması**: Forum konuları, üst düzey tipli ACP bağlamaları üzerinden ACP harness oturumlarını sabitleyebilir (`type: "acp"` ve `match.channel: "telegram"`, `peer.kind: "group"` içeren `bindings[]` ve `-1001234567890:topic:42` gibi konu nitelemeli bir kimlik). Şu anda gruplardaki/süper gruplardaki forum konularıyla sınırlıdır. Bkz. [ACP Aracıları](/tr/tools/acp-agents).

    **Sohbetten iş parçacığına bağlı ACP spawn**: `/acp spawn <agent> --thread here|auto` geçerli konuyu yeni bir ACP oturumuna bağlar; takip iletileri doğrudan oraya yönlendirilir. OpenClaw spawn onayını konu içinde sabitler. `channels.telegram.threadBindings.spawnSessions` ayarının etkin kalmasını gerektirir (varsayılan: `true`).

    Şablon bağlamı `MessageThreadId` ve `IsForum` değerlerini sunar. `message_thread_id` içeren DM sohbetleri varsayılan olarak düz oturumlarda DM yönlendirmesini ve yanıt metaverilerini korur; yalnızca `threadReplies: "inbound"`, `threadReplies: "always"`, `requireTopic: true` ya da eşleşen bir konu yapılandırması ile yapılandırıldıklarında iş parçacığı uyumlu oturum anahtarlarını kullanırlar. Hesap varsayılanı için üst düzey `channels.telegram.dm.threadReplies`, tek bir DM için `direct.<chatId>.threadReplies` kullanın.

  </Accordion>

  <Accordion title="Ses, video ve çıkartmalar">
    ### Ses mesajları

    Telegram sesli notları ve ses dosyalarını birbirinden ayırır.

    - varsayılan: ses dosyası davranışı
    - sesli not göndermeyi zorlamak için agent yanıtında `[[audio_as_voice]]` etiketi
    - gelen sesli not dökümleri agent bağlamında makine tarafından oluşturulmuş,
      güvenilmeyen metin olarak çerçevelenir; bahsetme algılama yine ham
      dökümü kullanır, bu yüzden bahsetme koşullu sesli mesajlar çalışmaya devam eder.

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

    Telegram video dosyalarını ve video notlarını birbirinden ayırır.

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

    Video notları altyazıları desteklemez; sağlanan mesaj metni ayrı gönderilir.

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

    Çıkartmalar bir kez açıklanır (mümkün olduğunda) ve tekrarlanan görsel çağrılarını azaltmak için önbelleğe alınır.

    Çıkartma eylemlerini etkinleştir:

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

    Çıkartma eylemi gönder:

```json5
{
  action: "sticker",
  channel: "telegram",
  to: "123456789",
  fileId: "CAACAgIAAxkBAAI...",
}
```

    Önbelleğe alınmış çıkartmaları ara:

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

    - `own`, yalnızca bot tarafından gönderilen mesajlara kullanıcı tepkileri anlamına gelir (gönderilen mesaj önbelleği üzerinden en iyi çaba).
    - Tepki olayları yine Telegram erişim denetimlerine uyar (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); yetkisiz gönderenler bırakılır.
    - Telegram tepki güncellemelerinde iş parçacığı kimlikleri sağlamaz.
      - forum olmayan gruplar grup sohbeti oturumuna yönlendirilir
      - forum grupları tam kaynak konuya değil, grup genel konu oturumuna (`:topic:1`) yönlendirilir

    Yoklama/Webhook için `allowed_updates` otomatik olarak `message_reaction` içerir.

  </Accordion>

  <Accordion title="Onay tepkileri">
    `ackReaction`, OpenClaw gelen bir mesajı işlerken bir onay emojisi gönderir.

    Çözümleme sırası:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - agent kimliği emoji yedeği (`agents.list[].identity.emoji`, yoksa "👀")

    Notlar:

    - Telegram unicode emoji bekler (örneğin "👀").
    - Bir kanal veya hesap için tepkiyi devre dışı bırakmak üzere `""` kullanın.

  </Accordion>

  <Accordion title="Telegram olayları ve komutlarından yapılandırma yazımları">
    Kanal yapılandırma yazımları varsayılan olarak etkindir (`configWrites !== false`).

    Telegram tetiklemeli yazımlar şunları içerir:

    - `channels.telegram.groups` değerini güncellemek için grup taşıma olayları (`migrate_to_chat_id`)
    - `/config set` ve `/config unset` (komut etkinleştirme gerektirir)

    Devre dışı bırak:

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
    Varsayılan uzun yoklamadır. Webhook modu için `channels.telegram.webhookUrl` ve `channels.telegram.webhookSecret`; isteğe bağlı `webhookPath`, `webhookHost`, `webhookPort` ayarlayın (varsayılanlar `/telegram-webhook`, `127.0.0.1`, `8787`).

    Yerel dinleyici `127.0.0.1:8787` adresine bağlanır. Herkese açık giriş için yerel portun önüne bir ters proxy koyun ya da bilinçli olarak `webhookHost: "0.0.0.0"` ayarlayın.

    Webhook modu Telegram'a `200` döndürmeden önce istek korumalarını, Telegram gizli token'ını ve JSON gövdesini doğrular.
    OpenClaw ardından güncellemeyi uzun yoklamada kullanılan aynı sohbet başına/konu başına bot hatları üzerinden eşzamansız olarak işler; bu yüzden yavaş agent dönüşleri Telegram'ın teslim ACK'sini bekletmez.

  </Accordion>

  <Accordion title="Sınırlar, yeniden deneme ve CLI hedefleri">
    - `channels.telegram.textChunkLimit` varsayılanı 4000'dir.
    - `channels.telegram.chunkMode="newline"` uzunluğa göre bölmeden önce paragraf sınırlarını (boş satırlar) tercih eder.
    - `channels.telegram.mediaMaxMb` (varsayılan 100), gelen ve giden Telegram medya boyutunu sınırlar.
    - `channels.telegram.mediaGroupFlushMs` (varsayılan 500), Telegram albümlerinin/medya gruplarının OpenClaw tarafından tek bir gelen mesaj olarak dağıtılmadan önce ne kadar süre arabelleğe alınacağını denetler. Albüm parçaları geç gelirse artırın; albüm yanıt gecikmesini azaltmak için düşürün.
    - `channels.telegram.timeoutSeconds`, Telegram API istemci zaman aşımını geçersiz kılar (ayarlanmazsa grammY varsayılanı uygulanır). Bot istemcileri, grammY'nin OpenClaw aktarım koruması ve yedeği çalışmadan önce görünür yanıt teslimini iptal etmemesi için yapılandırılmış değerleri 60 saniyelik giden metin/yazıyor isteği korumasının altında sınırlar. Uzun yoklama yine de 45 saniyelik bir `getUpdates` istek koruması kullanır, böylece boştaki yoklamalar süresiz olarak terk edilmez.
    - `channels.telegram.pollingStallThresholdMs` varsayılan olarak `120000` değerindedir; yalnızca hatalı pozitif yoklama takılması yeniden başlatmaları için `30000` ile `600000` arasında ayarlayın.
    - grup bağlam geçmişi `channels.telegram.historyLimit` veya `messages.groupChat.historyLimit` kullanır (varsayılan 50); `0` devre dışı bırakır.
    - yanıt/alıntı/iletme ek bağlamı şu anda alındığı gibi geçirilir.
    - Telegram izin listeleri öncelikli olarak agent'ı kimin tetikleyebileceğini denetler, tam bir ek bağlam redaksiyon sınırı değildir.
    - DM geçmiş denetimleri:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - `channels.telegram.retry` yapılandırması, kurtarılabilir giden API hataları için Telegram gönderme yardımcılarına (CLI/araçlar/eylemler) uygulanır. Gelen son yanıt teslimi de Telegram ön bağlantı hataları için sınırlı bir güvenli gönderme yeniden denemesi kullanır, ancak görünür mesajları çoğaltabilecek belirsiz gönderim sonrası ağ zarflarını yeniden denemez.

    CLI gönderim hedefi sayısal sohbet kimliği veya kullanıcı adı olabilir:

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

    Yalnızca Telegram'a özgü yoklama bayrakları:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - forum konuları için `--thread-id` (veya bir `:topic:` hedefi kullanın)

    Telegram gönderimi ayrıca şunları destekler:

    - `channels.telegram.capabilities.inlineButtons` izin verdiğinde satır içi klavyeler için `buttons` bloklarıyla `--presentation`
    - botun o sohbette sabitleyebildiği durumlarda sabitlenmiş teslim istemek için `--pin` veya `--delivery '{"pin":true}'`
    - giden görselleri ve GIF'leri sıkıştırılmış fotoğraf veya animasyonlu medya yüklemeleri yerine belge olarak göndermek için `--force-document`

    Eylem denetimi:

    - `channels.telegram.actions.sendMessage=false`, yoklamalar dahil giden Telegram mesajlarını devre dışı bırakır
    - `channels.telegram.actions.poll=false`, normal gönderimleri etkin bırakırken Telegram yoklaması oluşturmayı devre dışı bırakır

  </Accordion>

  <Accordion title="Telegram'da exec onayları">
    Telegram, onaylayan DM'lerinde exec onaylarını destekler ve isteğe bağlı olarak kaynak sohbet veya konu içinde istemler yayımlayabilir. Onaylayanlar sayısal Telegram kullanıcı kimlikleri olmalıdır.

    Yapılandırma yolu:

    - `channels.telegram.execApprovals.enabled` (en az bir onaylayan çözümlenebildiğinde otomatik etkinleşir)
    - `channels.telegram.execApprovals.approvers` (`commands.ownerAllowFrom` içindeki sayısal sahip kimliklerine geri döner)
    - `channels.telegram.execApprovals.target`: `dm` (varsayılan) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` ve `defaultTo`, botla kimin konuşabileceğini ve normal yanıtları nereye göndereceğini denetler. Birini exec onaylayanı yapmazlar. Henüz komut sahibi yokken ilk onaylanmış DM eşleştirmesi `commands.ownerAllowFrom` değerini başlatır; böylece tek sahipli kurulum, `execApprovals.approvers` altında kimlikleri çoğaltmadan çalışmaya devam eder.

    Kanal teslimi komut metnini sohbette gösterir; `channel` veya `both` seçeneklerini yalnızca güvenilen gruplarda/konularda etkinleştirin. İstem bir forum konusuna düştüğünde OpenClaw, onay istemi ve takip için konuyu korur. Exec onayları varsayılan olarak 30 dakika sonra sona erer.

    Satır içi onay düğmeleri ayrıca `channels.telegram.capabilities.inlineButtons` değerinin hedef yüzeye (`dm`, `group` veya `all`) izin vermesini gerektirir. `plugin:` ile öneklenmiş onay kimlikleri Plugin onayları üzerinden çözümlenir; diğerleri önce exec onayları üzerinden çözümlenir.

    Bkz. [Exec onayları](/tr/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Hata yanıtı denetimleri

Agent bir teslim veya sağlayıcı hatasıyla karşılaştığında, Telegram hata metniyle yanıt verebilir ya da bunu bastırabilir. Bu davranışı iki yapılandırma anahtarı denetler:

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
  <Accordion title="Bot, bahsetme içermeyen grup mesajlarına yanıt vermiyor">

    - `requireMention=false` ise Telegram gizlilik modu tam görünürlüğe izin vermelidir.
      - BotFather: `/setprivacy` -> Disable
      - ardından botu gruptan kaldırıp yeniden ekleyin
    - Yapılandırma bahsedilmeyen grup mesajları beklediğinde `openclaw channels status` uyarır.
    - `openclaw channels status --probe` açık sayısal grup kimliklerini denetleyebilir; joker karakter `"*"` için üyelik yoklaması yapılamaz.
    - hızlı oturum testi: `/activation always`.

  </Accordion>

  <Accordion title="Bot grup mesajlarını hiç görmüyor">

    - `channels.telegram.groups` varsa grup listelenmelidir (veya `"*"` içermelidir)
    - botun gruptaki üyeliğini doğrulayın
    - atlama nedenleri için günlükleri inceleyin: `openclaw logs --follow`

  </Accordion>

  <Accordion title="Komutlar kısmen çalışıyor veya hiç çalışmıyor">

    - gönderen kimliğinizi yetkilendirin (eşleştirme ve/veya sayısal `allowFrom`)
    - grup ilkesi `open` olsa bile komut yetkilendirmesi uygulanmaya devam eder
    - `BOT_COMMANDS_TOO_MUCH` ile `setMyCommands failed`, yerel menüde çok fazla giriş olduğu anlamına gelir; Plugin/skill/özel komutları azaltın veya yerel menüleri devre dışı bırakın
    - `deleteMyCommands` / `setMyCommands` başlangıç çağrıları ve `sendChatAction` yazıyor çağrıları sınırlandırılmıştır ve istek zaman aşımında Telegram'ın taşıma yedek yolu üzerinden bir kez yeniden denenir. Kalıcı ağ/fetch hataları genellikle `api.telegram.org` için DNS/HTTPS erişilebilirlik sorunlarına işaret eder

  </Accordion>

  <Accordion title="Başlangıç yetkisiz token bildiriyor">

    - `getMe returned 401`, yapılandırılan bot tokenı için bir Telegram kimlik doğrulama hatasıdır.
    - BotFather içinde bot tokenını yeniden kopyalayın veya yeniden oluşturun, ardından varsayılan hesap için `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken` veya `TELEGRAM_BOT_TOKEN` değerini güncelleyin.
    - Başlangıç sırasında `deleteWebhook 401 Unauthorized` da bir kimlik doğrulama hatasıdır; bunu "Webhook yok" olarak ele almak, aynı bozuk-token hatasını yalnızca sonraki API çağrılarına ertelemiş olur.

  </Accordion>

  <Accordion title="Yoklama veya ağ kararsızlığı">

    - Node 22+ + özel fetch/proxy, AbortSignal türleri uyuşmazsa anında iptal davranışını tetikleyebilir.
    - Bazı hostlar `api.telegram.org` adresini önce IPv6'ya çözümler; bozuk IPv6 çıkışı aralıklı Telegram API hatalarına neden olabilir.
    - Günlüklerde `TypeError: fetch failed` veya `Network request for 'getUpdates' failed!` varsa OpenClaw artık bunları kurtarılabilir ağ hataları olarak yeniden dener.
    - Yoklama başlangıcı sırasında OpenClaw, başarılı başlangıç `getMe` yoklamasını grammY için yeniden kullanır; böylece runner, ilk `getUpdates` öncesinde ikinci bir `getMe` çağrısına ihtiyaç duymaz.
    - Yoklama başlangıcı sırasında `deleteWebhook` geçici bir ağ hatasıyla başarısız olursa OpenClaw başka bir yoklama öncesi kontrol düzlemi çağrısı yapmak yerine long polling'e devam eder. Hâlâ etkin olan bir Webhook, `getUpdates` çakışması olarak görünür; OpenClaw ardından Telegram taşımasını yeniden oluşturur ve Webhook temizliğini yeniden dener.
    - Telegram soketleri kısa ve sabit bir aralıkta yenileniyorsa düşük bir `channels.telegram.timeoutSeconds` değeri olup olmadığını kontrol edin; bot istemcileri yapılandırılan değerleri çıkış ve `getUpdates` istek korumalarının altındaysa sınırlar, ancak eski sürümler bu değer bu korumaların altına ayarlandığında her yoklamayı veya yanıtı iptal edebiliyordu.
    - Günlüklerde `Polling stall detected` varsa OpenClaw, varsayılan olarak tamamlanmış long-poll canlılığı olmadan 120 saniye geçtikten sonra yoklamayı yeniden başlatır ve Telegram taşımasını yeniden oluşturur.
    - `openclaw channels status --probe` ve `openclaw doctor`, çalışan bir yoklama hesabı başlangıç toleransından sonra `getUpdates` tamamlamamışsa, çalışan bir Webhook hesabı başlangıç toleransından sonra `setWebhook` tamamlamamışsa veya son başarılı yoklama taşıma etkinliği bayatsa uyarır.
    - `channels.telegram.pollingStallThresholdMs` değerini yalnızca uzun süren `getUpdates` çağrıları sağlıklıyken ama hostunuz hâlâ yanlış yoklama durması yeniden başlatmaları bildiriyorsa artırın. Kalıcı durmalar genellikle host ile `api.telegram.org` arasındaki proxy, DNS, IPv6 veya TLS çıkışı sorunlarına işaret eder.
    - Telegram ayrıca Bot API taşıması için `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` ve bunların küçük harfli varyantları dahil süreç proxy env değerlerini dikkate alır. `NO_PROXY` / `no_proxy` yine de `api.telegram.org` adresini atlayabilir.
    - OpenClaw yönetimli proxy bir hizmet ortamı için `OPENCLAW_PROXY_URL` üzerinden yapılandırılmışsa ve standart proxy env yoksa Telegram bu URL'yi Bot API taşıması için de kullanır.
    - Kararsız doğrudan çıkış/TLS olan VPS hostlarında Telegram API çağrılarını `channels.telegram.proxy` üzerinden yönlendirin:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ varsayılan olarak `autoSelectFamily=true` kullanır (WSL2 hariç). Telegram DNS sonuç sırası önce `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`, ardından `channels.telegram.network.dnsResultOrder`, ardından `NODE_OPTIONS=--dns-result-order=ipv4first` gibi süreç varsayılanını dikkate alır; hiçbiri uygulanmıyorsa Node 22+ `ipv4first` değerine geri döner.
    - Hostunuz WSL2 ise veya açıkça yalnızca IPv4 davranışıyla daha iyi çalışıyorsa aile seçimini zorlayın:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - RFC 2544 kıyaslama aralığı yanıtlarına (`198.18.0.0/15`) Telegram medya indirmeleri için varsayılan olarak zaten izin verilir. Güvenilir bir fake-IP veya şeffaf proxy, medya indirmeleri sırasında `api.telegram.org` adresini başka bir özel/dahili/özel kullanımlı adrese yeniden yazıyorsa yalnızca Telegram'a özgü atlamayı seçebilirsiniz:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - Aynı seçim hesap başına
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork` altında kullanılabilir.
    - Proxy'niz Telegram medya hostlarını `198.18.x.x` adreslerine çözümlüyorsa önce tehlikeli bayrağı kapalı bırakın. Telegram medya varsayılan olarak RFC 2544 kıyaslama aralığına zaten izin verir.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork`, Telegram
      medya SSRF korumalarını zayıflatır. Yalnızca Clash, Mihomo veya Surge fake-IP yönlendirmesi gibi güvenilir operatör kontrollü proxy ortamlarında, RFC 2544 kıyaslama aralığı dışında özel veya özel kullanımlı yanıtlar ürettiklerinde kullanın. Normal genel internet Telegram erişimi için kapalı bırakın.
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

- başlangıç/kimlik doğrulama: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` normal bir dosyaya işaret etmelidir; symlinkler reddedilir)
- erişim denetimi: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, üst düzey `bindings[]` (`type: "acp"`)
- exec onayları: `execApprovals`, `accounts.*.execApprovals`
- komut/menü: `commands.native`, `commands.nativeSkills`, `customCommands`
- iş parçacığı/yanıtlar: `replyToMode`, `dm.threadReplies`, `direct.*.threadReplies`
- akış: `streaming` (önizleme), `streaming.preview.toolProgress`, `blockStreaming`
- biçimlendirme/teslim: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- medya/ağ: `mediaMaxMb`, `mediaGroupFlushMs`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- özel API kökü: `apiRoot` (yalnızca Bot API kökü; `/bot<TOKEN>` eklemeyin)
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- eylemler/yetenekler: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- tepkiler: `reactionNotifications`, `reactionLevel`
- hatalar: `errorPolicy`, `errorCooldownMs`
- yazmalar/geçmiş: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
Çok hesaplı öncelik: iki veya daha fazla hesap kimliği yapılandırıldığında varsayılan yönlendirmeyi açık hâle getirmek için `channels.telegram.defaultAccount` ayarını yapın (veya `channels.telegram.accounts.default` ekleyin). Aksi takdirde OpenClaw ilk normalleştirilmiş hesap kimliğine geri döner ve `openclaw doctor` uyarır. Adlandırılmış hesaplar `channels.telegram.allowFrom` / `groupAllowFrom` değerlerini devralır, ancak `accounts.default.*` değerlerini devralmaz.
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
    Gelen mesajları agentlara yönlendirin.
  </Card>
  <Card title="Güvenlik" icon="shield" href="/tr/gateway/security">
    Tehdit modeli ve sağlamlaştırma.
  </Card>
  <Card title="Çok agentlı yönlendirme" icon="sitemap" href="/tr/concepts/multi-agent">
    Grupları ve konuları agentlarla eşleyin.
  </Card>
  <Card title="Sorun giderme" icon="wrench" href="/tr/channels/troubleshooting">
    Kanallar arası tanılama.
  </Card>
</CardGroup>
