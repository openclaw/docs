---
read_when:
    - Telegram özellikleri veya Webhook'lar üzerinde çalışma
summary: Telegram bot desteğinin durumu, yetenekleri ve yapılandırması
title: Telegram
x-i18n:
    generated_at: "2026-04-30T09:08:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1ffc0c1a6bb94fbab81ede0f08b0e3a165f06c599d4d06d4b9e70c8ba41121f7
    source_path: channels/telegram.md
    workflow: 16
---

grammY aracılığıyla bot DM'leri ve grupları için üretime hazırdır. Varsayılan mod uzun yoklamadır; Webhook modu isteğe bağlıdır.

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
  <Step title="Bot token'ını BotFather içinde oluşturun">
    Telegram'ı açın ve **@BotFather** ile sohbet edin (kullanıcı adının tam olarak `@BotFather` olduğunu doğrulayın).

    `/newbot` komutunu çalıştırın, istemleri izleyin ve token'ı kaydedin.

  </Step>

  <Step title="Token ve DM ilkesini yapılandırın">

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
    Telegram, `openclaw channels login telegram` kullanmaz; token'ı config/env içinde yapılandırın, sonra Gateway'i başlatın.

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
    Botu grubunuza ekleyin, sonra erişim modelinize uyacak şekilde `channels.telegram.groups` ve `groupPolicy` ayarlarını yapın.
  </Step>
</Steps>

<Note>
Token çözümleme sırası hesap farkındalıklıdır. Pratikte config değerleri env yedeğine göre önceliklidir ve `TELEGRAM_BOT_TOKEN` yalnızca varsayılan hesap için geçerlidir.
</Note>

## Telegram tarafı ayarları

<AccordionGroup>
  <Accordion title="Gizlilik modu ve grup görünürlüğü">
    Telegram botları varsayılan olarak, hangi grup mesajlarını alabileceklerini sınırlayan **Gizlilik Modu** ile gelir.

    Botun tüm grup mesajlarını görmesi gerekiyorsa şunlardan birini yapın:

    - `/setprivacy` aracılığıyla gizlilik modunu devre dışı bırakın, veya
    - botu grup yöneticisi yapın.

    Gizlilik modunu açıp kapatırken, Telegram'ın değişikliği uygulaması için botu her gruptan kaldırıp yeniden ekleyin.

  </Accordion>

  <Accordion title="Grup izinleri">
    Yönetici durumu Telegram grup ayarlarından denetlenir.

    Yönetici botlar tüm grup mesajlarını alır; bu, her zaman açık grup davranışı için kullanışlıdır.

  </Accordion>

  <Accordion title="Yararlı BotFather geçişleri">

    - Grup eklemelerine izin vermek/reddetmek için `/setjoingroups`
    - Grup görünürlüğü davranışı için `/setprivacy`

  </Accordion>
</AccordionGroup>

## Erişim denetimi ve etkinleştirme

<Tabs>
  <Tab title="DM ilkesi">
    `channels.telegram.dmPolicy` doğrudan mesaj erişimini denetler:

    - `pairing` (varsayılan)
    - `allowlist` (`allowFrom` içinde en az bir gönderen ID'si gerektirir)
    - `open` (`allowFrom` değerinin `"*"` içermesini gerektirir)
    - `disabled`

    `allowFrom: ["*"]` ile `dmPolicy: "open"`, bot kullanıcı adını bulan veya tahmin eden herhangi bir Telegram hesabının bota komut vermesine izin verir. Bunu yalnızca araçları sıkı biçimde kısıtlanmış, bilerek herkese açık yapılmış botlar için kullanın; tek sahipli botlar sayısal kullanıcı ID'leriyle `allowlist` kullanmalıdır.

    `channels.telegram.allowFrom` sayısal Telegram kullanıcı ID'lerini kabul eder. `telegram:` / `tg:` önekleri kabul edilir ve normalleştirilir.
    Çok hesaplı config'lerde, kısıtlayıcı üst düzey `channels.telegram.allowFrom` bir güvenlik sınırı olarak ele alınır: hesap düzeyi `allowFrom: ["*"]` girdileri, birleştirme sonrasında etkin hesap izin listesi hâlâ açık bir joker karakter içermediği sürece o hesabı herkese açık yapmaz.
    Boş `allowFrom` ile `dmPolicy: "allowlist"` tüm DM'leri engeller ve config doğrulaması tarafından reddedilir.
    Kurulum yalnızca sayısal kullanıcı ID'lerini ister.
    Yükseltme yaptıysanız ve config'iniz `@username` izin listesi girdileri içeriyorsa, bunları çözümlemek için `openclaw doctor --fix` çalıştırın (en iyi çaba; Telegram bot token'ı gerektirir).
    Daha önce eşleştirme deposu izin listesi dosyalarına güveniyorsanız, `openclaw doctor --fix` izin listesi akışlarında girdileri `channels.telegram.allowFrom` içine kurtarabilir (örneğin `dmPolicy: "allowlist"` henüz açık ID'lere sahip olmadığında).

    Tek sahipli botlar için, erişim ilkesini önceki eşleştirme onaylarına bağlı kalmak yerine config içinde kalıcı tutmak üzere açık sayısal `allowFrom` ID'leriyle `dmPolicy: "allowlist"` tercih edin.

    Yaygın kafa karışıklığı: DM eşleştirme onayı, "bu gönderen her yerde yetkilidir" anlamına gelmez.
    Eşleştirme DM erişimi verir. Henüz bir komut sahibi yoksa, ilk onaylanan eşleştirme ayrıca `commands.ownerAllowFrom` ayarını yapar; böylece yalnızca sahibin kullanabildiği komutlar ve exec onayları açık bir operatör hesabına sahip olur.
    Grup gönderen yetkilendirmesi hâlâ açık config izin listelerinden gelir.
    "Bir kez yetkilendirildim, hem DM'ler hem grup komutları çalışsın" istiyorsanız, sayısal Telegram kullanıcı ID'nizi `channels.telegram.allowFrom` içine koyun; yalnızca sahibi ilgilendiren komutlar için `commands.ownerAllowFrom` değerinin `telegram:<your user id>` içerdiğinden emin olun.

    ### Telegram kullanıcı ID'nizi bulma

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
       - `groups` config'i yoksa:
         - `groupPolicy: "open"` ile: herhangi bir grup, grup ID denetimlerinden geçebilir
         - `groupPolicy: "allowlist"` (varsayılan) ile: `groups` girdileri (veya `"*"`) ekleyene kadar gruplar engellenir
       - `groups` yapılandırılmışsa: izin listesi gibi davranır (açık ID'ler veya `"*"`)

    2. **Gruplarda hangi gönderenlere izin verilir** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (varsayılan)
       - `disabled`

    `groupAllowFrom`, grup gönderen filtrelemesi için kullanılır. Ayarlanmamışsa Telegram `allowFrom` değerine geri döner.
    `groupAllowFrom` girdileri sayısal Telegram kullanıcı ID'leri olmalıdır (`telegram:` / `tg:` önekleri normalleştirilir).
    Telegram grup veya süper grup sohbet ID'lerini `groupAllowFrom` içine koymayın. Negatif sohbet ID'leri `channels.telegram.groups` altında yer alır.
    Sayısal olmayan girdiler gönderen yetkilendirmesinde yok sayılır.
    Güvenlik sınırı (`2026.2.25+`): grup gönderen yetkilendirmesi DM eşleştirme deposu onaylarını **devralmaz**.
    Eşleştirme yalnızca DM için kalır. Gruplar için `groupAllowFrom` veya grup başına/konu başına `allowFrom` ayarlayın.
    `groupAllowFrom` ayarlanmamışsa Telegram, eşleştirme deposuna değil config `allowFrom` değerine geri döner.
    Tek sahipli botlar için pratik kalıp: kullanıcı ID'nizi `channels.telegram.allowFrom` içine ayarlayın, `groupAllowFrom` değerini ayarlamadan bırakın ve hedef gruplara `channels.telegram.groups` altında izin verin.
    Çalışma zamanı notu: `channels.telegram` tamamen eksikse, `channels.defaults.groupPolicy` açıkça ayarlanmadığı sürece çalışma zamanı varsayılan olarak kapalı güvenli `groupPolicy="allowlist"` davranışına geçer.

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

      - `-1001234567890` gibi negatif Telegram grup veya süper grup sohbet ID'lerini `channels.telegram.groups` altına koyun.
      - İzin verilen bir grup içindeki hangi kişilerin botu tetikleyebileceğini sınırlamak istediğinizde `8734062810` gibi Telegram kullanıcı ID'lerini `groupAllowFrom` altına koyun.
      - `groupAllowFrom: ["*"]` yalnızca izin verilen bir grubun herhangi bir üyesinin botla konuşabilmesini istediğinizde kullanın.

    </Warning>

  </Tab>

  <Tab title="Bahsetme davranışı">
    Grup yanıtları varsayılan olarak bahsetme gerektirir.

    Bahsetme şuradan gelebilir:

    - yerel `@botusername` bahsetmesi, veya
    - şunlardaki bahsetme kalıpları:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Oturum düzeyi komut geçişleri:

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
    - veya `openclaw logs --follow` içinden `chat.id` değerini okuyun
    - veya Bot API `getUpdates` çıktısını inceleyin

  </Tab>
</Tabs>

## Çalışma zamanı davranışı

- Telegram, Gateway işlemi tarafından sahiplenilir.
- Yönlendirme deterministiktir: Telegram'dan gelenler Telegram'a yanıt verir (model kanalları seçmez).
- Gelen mesajlar, yanıt meta verileri ve medya yer tutucularıyla birlikte paylaşılan kanal zarfına normalleştirilir.
- Grup oturumları grup ID'sine göre yalıtılır. Forum konuları, konuları yalıtılmış tutmak için `:topic:<threadId>` ekler.
- DM mesajları `message_thread_id` taşıyabilir; OpenClaw bunları iş parçacığı farkındalıklı oturum anahtarlarıyla yönlendirir ve yanıtlar için iş parçacığı ID'sini korur.
- Uzun yoklama, sohbet başına/iş parçacığı başına sıralamayla grammY runner kullanır. Genel runner sink eşzamanlılığı `agents.defaults.maxConcurrent` kullanır.
- Uzun yoklama, her Gateway işleminin içinde korunur; böylece bir bot token'ını aynı anda yalnızca bir etkin yoklayıcı kullanabilir. Hâlâ `getUpdates` 409 çakışmaları görüyorsanız, başka bir OpenClaw Gateway, script veya harici yoklayıcı muhtemelen aynı token'ı kullanıyordur.
- Uzun yoklama watchdog yeniden başlatmaları, varsayılan olarak 120 saniye boyunca tamamlanmış `getUpdates` canlılığı olmadığında tetiklenir. Dağıtımınız uzun süren işler sırasında hâlâ hatalı yoklama durması yeniden başlatmaları görüyorsa `channels.telegram.pollingStallThresholdMs` değerini artırın. Değer milisaniye cinsindedir ve `30000` ile `600000` arasında olabilir; hesap başına geçersiz kılmalar desteklenir.
- Telegram Bot API okundu bilgisi desteğine sahip değildir (`sendReadReceipts` geçerli değildir).

## Özellik referansı

<AccordionGroup>
  <Accordion title="Canlı akış önizlemesi (mesaj düzenlemeleri)">
    OpenClaw kısmi yanıtları gerçek zamanlı olarak akışa aktarabilir:

    - doğrudan sohbetler: önizleme mesajı + `editMessageText`
    - gruplar/konular: önizleme mesajı + `editMessageText`

    Gereksinim:

    - `channels.telegram.streaming` değeri `off | partial | block | progress` olmalıdır (varsayılan: `partial`)
    - `progress`, Telegram'da `partial` değerine eşlenir (kanallar arası adlandırmayla uyumluluk)
    - `streaming.preview.toolProgress`, araç/ilerleme güncellemelerinin aynı düzenlenen önizleme mesajını yeniden kullanıp kullanmayacağını denetler (varsayılan: önizleme akışı etkin olduğunda `true`)
    - eski `channels.telegram.streamMode` ve boolean `streaming` değerleri algılanır; bunları `channels.telegram.streaming.mode` değerine taşımak için `openclaw doctor --fix` çalıştırın

    Araç ilerleme önizleme güncellemeleri, araçlar çalışırken gösterilen kısa "Çalışıyor..." satırlarıdır; örneğin komut yürütme, dosya okumaları, planlama güncellemeleri veya yama özetleri. Telegram bunları, `v2026.4.22` ve sonrasındaki yayımlanmış OpenClaw davranışıyla eşleşmesi için varsayılan olarak etkin tutar. Yanıt metni için düzenlenen önizlemeyi koruyup araç ilerleme satırlarını gizlemek için şunu ayarlayın:

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

    `streaming.mode: "off"` yalnızca yalnızca final teslimatı istediğinizde kullanın: Telegram önizleme düzenlemeleri devre dışı bırakılır ve genel araç/ilerleme konuşmaları bağımsız "Çalışıyor..." mesajları olarak gönderilmek yerine bastırılır. Onay istemleri, medya yükleri ve hatalar hâlâ normal final teslimatı üzerinden yönlendirilir. Yalnızca araç ilerleme durum satırlarını gizlerken yanıt önizleme düzenlemelerini korumak istediğinizde `streaming.preview.toolProgress: false` kullanın.

    Yalnızca metin yanıtları için:

    - kısa DM/grup/konu önizlemeleri: OpenClaw aynı önizleme mesajını korur ve son düzenlemeyi yerinde yapar
    - yaklaşık bir dakikadan eski önizlemeler: OpenClaw tamamlanan yanıtı yeni bir nihai mesaj olarak gönderir ve ardından önizlemeyi temizler; böylece Telegram'ın görünen zaman damgası, önizleme oluşturma zamanı yerine tamamlanma zamanını yansıtır

    Karmaşık yanıtlar için (örneğin medya yükleri), OpenClaw normal nihai teslimata geri döner ve ardından önizleme mesajını temizler.

    Önizleme akışı, blok akışından ayrıdır. Telegram için blok akışı açıkça etkinleştirildiğinde, OpenClaw çift akışı önlemek için önizleme akışını atlar.

    Yerel taslak aktarımı kullanılamazsa/reddedilirse, OpenClaw otomatik olarak `sendMessage` + `editMessageText` geri dönüşünü kullanır.

    Yalnızca Telegram'a özel akıl yürütme akışı:

    - `/reasoning stream`, üretim sırasında akıl yürütmeyi canlı önizlemeye gönderir
    - nihai yanıt akıl yürütme metni olmadan gönderilir

  </Accordion>

  <Accordion title="Biçimlendirme ve HTML geri dönüşü">
    Giden metin Telegram `parse_mode: "HTML"` kullanır.

    - Markdown benzeri metin, Telegram açısından güvenli HTML'e dönüştürülür.
    - Ham model HTML'i, Telegram ayrıştırma hatalarını azaltmak için kaçışlanır.
    - Telegram ayrıştırılmış HTML'i reddederse, OpenClaw düz metin olarak yeniden dener.

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
    - geçerli kalıp: `a-z`, `0-9`, `_`, uzunluk `1..32`
    - özel komutlar yerel komutların üzerine yazamaz
    - çakışmalar/yinelenenler atlanır ve günlüğe yazılır

    Notlar:

    - özel komutlar yalnızca menü girdileridir; davranışı otomatik olarak uygulamazlar
    - Plugin/skill komutları Telegram menüsünde gösterilmese bile yazıldığında çalışmaya devam edebilir

    Yerel komutlar devre dışıysa, yerleşik komutlar kaldırılır. Özel/Plugin komutları yapılandırılmışsa yine de kaydedilebilir.

    Yaygın kurulum hataları:

    - `BOT_COMMANDS_TOO_MUCH` ile `setMyCommands failed`, kırpmadan sonra Telegram menüsünün hâlâ taştığı anlamına gelir; Plugin/skill/özel komutları azaltın veya `channels.telegram.commands.native` ayarını devre dışı bırakın.
    - Doğrudan Bot API curl komutları çalışırken `deleteWebhook`, `deleteMyCommands` veya `setMyCommands` işlemlerinin `404: Not Found` ile başarısız olması, `channels.telegram.apiRoot` değerinin tam `/bot<TOKEN>` uç noktasına ayarlandığı anlamına gelebilir. `apiRoot` yalnızca Bot API kökü olmalıdır ve `openclaw doctor --fix` yanlışlıkla eklenmiş sondaki `/bot<TOKEN>` kısmını kaldırır.
    - `getMe returned 401`, Telegram'ın yapılandırılmış bot token'ını reddettiği anlamına gelir. `botToken`, `tokenFile` veya `TELEGRAM_BOT_TOKEN` değerini güncel BotFather token'ı ile güncelleyin; OpenClaw yoklama başlamadan önce durur, bu yüzden bu bir Webhook temizleme hatası olarak raporlanmaz.
    - Ağ/fetch hatalarıyla `setMyCommands failed` genellikle `api.telegram.org` için giden DNS/HTTPS erişiminin engellendiği anlamına gelir.

    ### Cihaz eşleştirme komutları (`device-pair` Plugin)

    `device-pair` Plugin yüklü olduğunda:

    1. `/pair` kurulum kodu üretir
    2. kodu iOS uygulamasına yapıştırın
    3. `/pair pending` bekleyen istekleri listeler (rol/kapsamlar dahil)
    4. isteği onaylayın:
       - açık onay için `/pair approve <requestId>`
       - yalnızca bir bekleyen istek olduğunda `/pair approve`
       - en yeni istek için `/pair approve latest`

    Kurulum kodu kısa ömürlü bir bootstrap token'ı taşır. Yerleşik bootstrap devri, birincil düğüm token'ını `scopes: []` değerinde tutar; devredilen herhangi bir operatör token'ı `operator.approvals`, `operator.read`, `operator.talk.secrets` ve `operator.write` ile sınırlı kalır. Bootstrap kapsam kontrolleri rol öneklidir; bu yüzden söz konusu operatör izin listesi yalnızca operatör isteklerini karşılar; operatör olmayan roller hâlâ kendi rol önekleri altında kapsamlara ihtiyaç duyar.

    Bir cihaz değişen kimlik doğrulama ayrıntılarıyla yeniden denerse (örneğin rol/kapsamlar/genel anahtar), önceki bekleyen istek geçersiz kılınır ve yeni istek farklı bir `requestId` kullanır. Onaylamadan önce `/pair pending` komutunu yeniden çalıştırın.

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

    Eski `capabilities: ["inlineButtons"]`, `inlineButtons: "all"` değerine eşlenir.

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

    Callback tıklamaları aracıya metin olarak iletilir:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="Aracılar ve otomasyon için Telegram mesaj eylemleri">
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

    Not: `edit` ve `topic-create` şu anda varsayılan olarak etkindir ve ayrı `channels.telegram.actions.*` anahtarları yoktur.
    Çalışma zamanı gönderimleri etkin yapılandırma/gizli değerler anlık görüntüsünü (başlangıç/yeniden yükleme) kullanır; bu yüzden eylem yolları gönderim başına geçici SecretRef yeniden çözümlemesi yapmaz.

    Tepki kaldırma semantiği: [/tools/reactions](/tr/tools/reactions)

  </Accordion>

  <Accordion title="Yanıt iş parçacığı etiketleri">
    Telegram üretilen çıktıda açık yanıt iş parçacığı etiketlerini destekler:

    - `[[reply_to_current]]` tetikleyen mesaja yanıt verir
    - `[[reply_to:<id>]]` belirli bir Telegram mesaj kimliğine yanıt verir

    `channels.telegram.replyToMode` işlemeyi denetler:

    - `off` (varsayılan)
    - `first`
    - `all`

    Yanıt iş parçacığı etkinleştirildiğinde ve özgün Telegram metni veya açıklaması kullanılabilir olduğunda, OpenClaw otomatik olarak yerel bir Telegram alıntı parçası ekler. Telegram yerel alıntı metnini 1024 UTF-16 kod birimiyle sınırlar; bu yüzden daha uzun mesajlar baştan alıntılanır ve Telegram alıntıyı reddederse düz yanıta geri döner.

    Not: `off` örtük yanıt iş parçacığını devre dışı bırakır. Açık `[[reply_to_*]]` etiketleri yine de dikkate alınır.

  </Accordion>

  <Accordion title="Forum konuları ve iş parçacığı davranışı">
    Forum süper grupları:

    - konu oturumu anahtarları `:topic:<threadId>` ekler
    - yanıtlar ve yazıyor göstergesi konu iş parçacığını hedefler
    - konu yapılandırma yolu:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Genel konu (`threadId=1`) özel durumu:

    - mesaj gönderimleri `message_thread_id` değerini atlar (Telegram `sendMessage(...thread_id=1)` çağrısını reddeder)
    - yazıyor eylemleri yine de `message_thread_id` içerir

    Konu devralma: konu girdileri geçersiz kılınmadıkça grup ayarlarını devralır (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
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

    **Kalıcı ACP konu bağlama**: Forum konuları, üst düzey tipli ACP bağlamaları aracılığıyla ACP harness oturumlarını sabitleyebilir (`type: "acp"` ve `match.channel: "telegram"`, `peer.kind: "group"` içeren `bindings[]` ve `-1001234567890:topic:42` gibi konu nitelikli bir kimlik). Şu anda gruplar/süper gruplardaki forum konularıyla sınırlıdır. Bkz. [ACP Aracıları](/tr/tools/acp-agents).

    **Sohbetten iş parçacığına bağlı ACP başlatma**: `/acp spawn <agent> --thread here|auto` geçerli konuyu yeni bir ACP oturumuna bağlar; sonraki iletiler doğrudan oraya yönlendirilir. OpenClaw başlatma onayını konu içinde sabitler. `channels.telegram.threadBindings.spawnAcpSessions=true` gerektirir.

    Şablon bağlamı `MessageThreadId` ve `IsForum` değerlerini sunar. `message_thread_id` içeren DM sohbetleri DM yönlendirmesini korur ancak iş parçacığına duyarlı oturum anahtarları kullanır.

  </Accordion>

  <Accordion title="Ses, video ve çıkartmalar">
    ### Ses mesajları

    Telegram sesli notlar ile ses dosyalarını ayırt eder.

    - varsayılan: ses dosyası davranışı
    - aracı yanıtında `[[audio_as_voice]]` etiketi sesli not gönderimini zorlar
    - gelen sesli not dökümleri aracı bağlamında makine tarafından oluşturulmuş,
      güvenilmeyen metin olarak çerçevelenir; bahsetme algılama hâlâ ham
      dökümü kullanır, böylece bahsetme geçitli sesli mesajlar çalışmaya devam eder.

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

    Telegram video dosyaları ile video notlarını ayırt eder.

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

    Video notları açıklamaları desteklemez; sağlanan mesaj metni ayrı gönderilir.

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

    - `own`, yalnızca bot tarafından gönderilen mesajlara kullanıcı tepkileri anlamına gelir (gönderilen mesaj önbelleği üzerinden en iyi çaba).
    - Tepki olayları yine de Telegram erişim denetimlerine (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`) uyar; yetkisiz gönderenler atılır.
    - Telegram, tepki güncellemelerinde konu kimlikleri sağlamaz.
      - forum olmayan gruplar grup sohbeti oturumuna yönlendirilir
      - forum grupları, tam kaynak konuya değil, grubun genel konu oturumuna (`:topic:1`) yönlendirilir

    Yoklama/webhook için `allowed_updates` otomatik olarak `message_reaction` içerir.

  </Accordion>

  <Accordion title="Onay tepkileri">
    `ackReaction`, OpenClaw gelen bir mesajı işlerken bir onay emojisi gönderir.

    Çözümleme sırası:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - aracı kimliği emoji yedeği (`agents.list[].identity.emoji`, yoksa "👀")

    Notlar:

    - Telegram unicode emoji bekler (örneğin "👀").
    - Bir kanal veya hesap için tepkiyi devre dışı bırakmak üzere `""` kullanın.

  </Accordion>

  <Accordion title="Telegram olayları ve komutlarından yapılandırma yazımları">
    Kanal yapılandırma yazımları varsayılan olarak etkindir (`configWrites !== false`).

    Telegram tarafından tetiklenen yazımlar şunları içerir:

    - `channels.telegram.groups` değerini güncellemek için grup taşıma olayları (`migrate_to_chat_id`)
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

  <Accordion title="Uzun yoklama ve webhook">
    Varsayılan uzun yoklamadır. Webhook modu için `channels.telegram.webhookUrl` ve `channels.telegram.webhookSecret` ayarlayın; isteğe bağlı `webhookPath`, `webhookHost`, `webhookPort` (varsayılanlar `/telegram-webhook`, `127.0.0.1`, `8787`).

    Yerel dinleyici `127.0.0.1:8787` adresine bağlanır. Genel giriş için yerel bağlantı noktasının önüne bir ters proxy koyun veya bilinçli olarak `webhookHost: "0.0.0.0"` ayarlayın.

    Webhook modu, Telegram'a `200` döndürmeden önce istek korumalarını, Telegram gizli belirtecini ve JSON gövdesini doğrular.
    OpenClaw daha sonra güncellemeyi, uzun yoklamada kullanılan aynı sohbet başına/konu başına bot hatları üzerinden eşzamansız olarak işler; böylece yavaş aracı dönüşleri Telegram'ın teslimat ACK'sini bekletmez.

  </Accordion>

  <Accordion title="Sınırlar, yeniden deneme ve CLI hedefleri">
    - `channels.telegram.textChunkLimit` varsayılanı 4000'dir.
    - `channels.telegram.chunkMode="newline"`, uzunluğa göre bölmeden önce paragraf sınırlarını (boş satırlar) tercih eder.
    - `channels.telegram.mediaMaxMb` (varsayılan 100), gelen ve giden Telegram medya boyutunu sınırlar.
    - `channels.telegram.timeoutSeconds`, Telegram API istemcisi zaman aşımını geçersiz kılar (ayarlanmazsa grammY varsayılanı uygulanır).
    - `channels.telegram.pollingStallThresholdMs` varsayılan olarak `120000` değerindedir; yalnızca hatalı pozitif yoklama takılması yeniden başlatmaları için `30000` ile `600000` arasında ayarlayın.
    - grup bağlam geçmişi `channels.telegram.historyLimit` veya `messages.groupChat.historyLimit` kullanır (varsayılan 50); `0` devre dışı bırakır.
    - yanıt/alıntı/iletme ek bağlamı şu anda alındığı gibi iletilir.
    - Telegram izin listeleri öncelikle aracıyı kimin tetikleyebileceğini denetler; tam bir ek bağlam redaksiyon sınırı değildir.
    - DM geçmişi denetimleri:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - `channels.telegram.retry` yapılandırması, kurtarılabilir giden API hataları için Telegram gönderme yardımcılarına (CLI/araçlar/eylemler) uygulanır. Gelen son yanıt teslimatı da Telegram ön bağlantı hataları için sınırlı güvenli gönderme yeniden denemesi kullanır, ancak görünür mesajları çoğaltabilecek belirsiz gönderim sonrası ağ zarflarını yeniden denemez.

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

    Yalnızca Telegram yoklama bayrakları:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - forum konuları için `--thread-id` (veya bir `:topic:` hedefi kullanın)

    Telegram gönderimi ayrıca şunları destekler:

    - `channels.telegram.capabilities.inlineButtons` izin verdiğinde satır içi klavyeler için `buttons` bloklarıyla `--presentation`
    - bot ilgili sohbette sabitleyebildiğinde sabitlenmiş teslimat istemek için `--pin` veya `--delivery '{"pin":true}'`
    - giden görüntüleri ve GIF'leri sıkıştırılmış fotoğraf veya animasyonlu medya yüklemeleri yerine belge olarak göndermek için `--force-document`

    Eylem kapılama:

    - `channels.telegram.actions.sendMessage=false`, yoklamalar dahil giden Telegram mesajlarını devre dışı bırakır
    - `channels.telegram.actions.poll=false`, normal gönderimleri etkin bırakarak Telegram yoklaması oluşturmayı devre dışı bırakır

  </Accordion>

  <Accordion title="Telegram'da exec onayları">
    Telegram, onaylayan DM'lerinde exec onaylarını destekler ve isteğe bağlı olarak istemleri kaynak sohbette veya konuda yayımlayabilir. Onaylayanlar sayısal Telegram kullanıcı kimlikleri olmalıdır.

    Yapılandırma yolu:

    - `channels.telegram.execApprovals.enabled` (en az bir onaylayan çözümlenebilir olduğunda otomatik etkinleşir)
    - `channels.telegram.execApprovals.approvers` (`commands.ownerAllowFrom` içindeki sayısal sahip kimliklerine geri döner)
    - `channels.telegram.execApprovals.target`: `dm` (varsayılan) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` ve `defaultTo`, botla kimin konuşabileceğini ve normal yanıtları nereye göndereceğini denetler. Bunlar birini exec onaylayanı yapmaz. İlk onaylanan DM eşleştirmesi, henüz komut sahibi yokken `commands.ownerAllowFrom` değerini başlatır; böylece tek sahipli kurulum, `execApprovals.approvers` altında kimlikleri çoğaltmadan da çalışır.

    Kanal teslimatı komut metnini sohbette gösterir; `channel` veya `both` değerlerini yalnızca güvenilen gruplarda/konularda etkinleştirin. İstem bir forum konusuna ulaştığında OpenClaw, onay istemi ve takip için konuyu korur. Exec onaylarının süresi varsayılan olarak 30 dakika sonra dolar.

    Satır içi onay düğmeleri ayrıca hedef yüzeye (`dm`, `group` veya `all`) izin vermek için `channels.telegram.capabilities.inlineButtons` gerektirir. `plugin:` ile öneklenmiş onay kimlikleri Plugin onayları üzerinden çözümlenir; diğerleri önce exec onayları üzerinden çözümlenir.

    Bkz. [Exec onayları](/tr/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Hata yanıtı denetimleri

Aracı bir teslimat veya sağlayıcı hatasıyla karşılaştığında, Telegram hata metniyle yanıt verebilir ya da bunu bastırabilir. Bu davranışı iki yapılandırma anahtarı denetler:

| Anahtar                             | Değerler          | Varsayılan | Açıklama                                                                                       |
| ----------------------------------- | ----------------- | ---------- | ---------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply`    | `reply`, sohbete kullanıcı dostu bir hata mesajı gönderir. `silent`, hata yanıtlarını tamamen bastırır. |
| `channels.telegram.errorCooldownMs` | sayı (ms)         | `60000`    | Aynı sohbete hata yanıtları arasındaki en kısa süre. Kesintiler sırasında hata spam'ini önler. |

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
      - BotFather: `/setprivacy` -> Devre Dışı Bırak
      - ardından botu gruptan kaldırıp yeniden ekleyin
    - `openclaw channels status`, yapılandırma bahsedilmeyen grup mesajları beklediğinde uyarır.
    - `openclaw channels status --probe` açık sayısal grup kimliklerini denetleyebilir; joker karakter `"*"` için üyelik yoklaması yapılamaz.
    - hızlı oturum testi: `/activation always`.

  </Accordion>

  <Accordion title="Bot grup mesajlarını hiç görmüyor">

    - `channels.telegram.groups` varsa grup listelenmelidir (veya `"*"` içermelidir)
    - gruptaki bot üyeliğini doğrulayın
    - atlama nedenleri için günlükleri inceleyin: `openclaw logs --follow`

  </Accordion>

  <Accordion title="Komutlar kısmen çalışıyor veya hiç çalışmıyor">

    - gönderen kimliğinizi yetkilendirin (eşleştirme ve/veya sayısal `allowFrom`)
    - grup ilkesi `open` olsa bile komut yetkilendirmesi yine uygulanır
    - `BOT_COMMANDS_TOO_MUCH` ile `setMyCommands failed`, yerel menüde çok fazla giriş olduğu anlamına gelir; Plugin/skill/özel komutları azaltın veya yerel menüleri devre dışı bırakın
    - `deleteMyCommands` / `setMyCommands` başlangıç çağrıları sınırlıdır ve istek zaman aşımında Telegram'ın taşıma yedeği üzerinden bir kez yeniden denenir. Kalıcı ağ/fetch hataları genellikle `api.telegram.org` adresine DNS/HTTPS erişilebilirliği sorunlarını gösterir

  </Accordion>

  <Accordion title="Başlangıç yetkisiz belirteç bildiriyor">

    - `getMe returned 401`, yapılandırılan bot belirteci için bir Telegram kimlik doğrulama hatasıdır.
    - BotFather'da bot belirtecini yeniden kopyalayın veya yeniden oluşturun, ardından varsayılan hesap için `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken` veya `TELEGRAM_BOT_TOKEN` değerini güncelleyin.
    - Başlangıç sırasında `deleteWebhook 401 Unauthorized` da bir kimlik doğrulama hatasıdır; bunu "webhook yok" olarak ele almak, aynı hatalı belirteç hatasını yalnızca sonraki API çağrılarına ertelemiş olur.
    - Yoklama başlangıcı sırasında `deleteWebhook` geçici bir ağ hatasıyla başarısız olursa OpenClaw `getWebhookInfo` değerini denetler; Telegram boş bir webhook URL'si bildirdiğinde, temizlik zaten sağlandığı için yoklama devam eder.

  </Accordion>

  <Accordion title="Yoklama veya ağ kararsızlığı">

    - Node 22+ + özel fetch/proxy, AbortSignal türleri uyuşmazsa anında iptal davranışını tetikleyebilir.
    - Bazı sunucular `api.telegram.org` adresini önce IPv6'ya çözümler; bozuk IPv6 çıkışı aralıklı Telegram API hatalarına neden olabilir.
    - Günlüklerde `TypeError: fetch failed` veya `Network request for 'getUpdates' failed!` varsa, OpenClaw artık bunları kurtarılabilir ağ hataları olarak yeniden dener.
    - Günlüklerde `Polling stall detected` varsa, OpenClaw varsayılan olarak tamamlanmış long-poll canlılığı olmadan 120 saniye geçtikten sonra yoklamayı yeniden başlatır ve Telegram aktarımını yeniden oluşturur.
    - `openclaw channels status --probe` ve `openclaw doctor`, çalışan bir polling hesabı başlangıç tolerans süresinden sonra `getUpdates` işlemini tamamlamadıysa, çalışan bir webhook hesabı başlangıç tolerans süresinden sonra `setWebhook` işlemini tamamlamadıysa veya son başarılı polling aktarım etkinliği bayatladıysa uyarır.
    - `channels.telegram.pollingStallThresholdMs` değerini yalnızca uzun süren `getUpdates` çağrıları sağlıklıysa ancak sunucunuz yine de hatalı polling-stall yeniden başlatmaları bildiriyorsa artırın. Kalıcı takılmalar genellikle sunucu ile `api.telegram.org` arasındaki proxy, DNS, IPv6 veya TLS çıkışı sorunlarına işaret eder.
    - Telegram ayrıca Bot API aktarımı için `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` ve bunların küçük harfli varyantları dahil olmak üzere işlem proxy env değerlerini dikkate alır. `NO_PROXY` / `no_proxy`, `api.telegram.org` için yine de proxy kullanımını atlayabilir.
    - OpenClaw tarafından yönetilen proxy bir hizmet ortamı için `OPENCLAW_PROXY_URL` üzerinden yapılandırılmışsa ve standart proxy env yoksa, Telegram Bot API aktarımı için de bu URL'yi kullanır.
    - Kararsız doğrudan çıkış/TLS olan VPS sunucularında, Telegram API çağrılarını `channels.telegram.proxy` üzerinden yönlendirin:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ varsayılan olarak `autoSelectFamily=true` (WSL2 hariç) ve `dnsResultOrder=ipv4first` kullanır.
    - Sunucunuz WSL2 ise veya açıkça yalnızca IPv4 davranışıyla daha iyi çalışıyorsa, aile seçimini zorlayın:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - RFC 2544 kıyaslama aralığı yanıtlarına (`198.18.0.0/15`) Telegram medya indirmeleri için varsayılan olarak zaten izin verilir. Güvenilir bir fake-IP veya şeffaf proxy, medya indirmeleri sırasında `api.telegram.org` adresini başka bir özel/dahili/özel-kullanım adresine yeniden yazıyorsa, yalnızca Telegram'a özel atlamayı etkinleştirebilirsiniz:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - Aynı etkinleştirme, hesap başına
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork` konumunda kullanılabilir.
    - Proxy'niz Telegram medya host'larını `198.18.x.x` adreslerine çözümlüyorsa, önce
      tehlikeli bayrağı kapalı bırakın. Telegram medyası RFC 2544
      kıyaslama aralığına varsayılan olarak zaten izin verir.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork`, Telegram
      medya SSRF korumalarını zayıflatır. Bunu yalnızca Clash, Mihomo veya Surge fake-IP yönlendirmesi gibi, RFC 2544 kıyaslama aralığı dışında özel ya da özel-kullanım yanıtları ürettikleri güvenilir, operatör kontrollü proxy ortamları için kullanın. Normal herkese açık internet Telegram erişimi için kapalı bırakın.
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

- başlatma/kimlik doğrulama: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` normal bir dosyayı göstermelidir; sembolik bağlantılar reddedilir)
- erişim denetimi: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, üst düzey `bindings[]` (`type: "acp"`)
- exec onayları: `execApprovals`, `accounts.*.execApprovals`
- komut/menü: `commands.native`, `commands.nativeSkills`, `customCommands`
- iş parçacıkları/yanıtlar: `replyToMode`
- streaming: `streaming` (önizleme), `streaming.preview.toolProgress`, `blockStreaming`
- biçimlendirme/teslim: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- medya/ağ: `mediaMaxMb`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- özel API kökü: `apiRoot` (yalnızca Bot API kökü; `/bot<TOKEN>` eklemeyin)
- webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- eylemler/yetenekler: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- tepkiler: `reactionNotifications`, `reactionLevel`
- hatalar: `errorPolicy`, `errorCooldownMs`
- yazmalar/geçmiş: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
Çoklu hesap önceliği: iki veya daha fazla hesap kimliği yapılandırıldığında, varsayılan yönlendirmeyi açık hale getirmek için `channels.telegram.defaultAccount` ayarlayın (veya `channels.telegram.accounts.default` ekleyin). Aksi halde OpenClaw ilk normalize edilmiş hesap kimliğine geri döner ve `openclaw doctor` uyarır. Adlandırılmış hesaplar `channels.telegram.allowFrom` / `groupAllowFrom` değerlerini devralır, ancak `accounts.default.*` değerlerini devralmaz.
</Note>

## İlgili

<CardGroup cols={2}>
  <Card title="Eşleştirme" icon="link" href="/tr/channels/pairing">
    Bir Telegram kullanıcısını gateway ile eşleştirin.
  </Card>
  <Card title="Gruplar" icon="users" href="/tr/channels/groups">
    Grup ve konu izin listesi davranışı.
  </Card>
  <Card title="Kanal yönlendirme" icon="route" href="/tr/channels/channel-routing">
    Gelen mesajları ajanlara yönlendirin.
  </Card>
  <Card title="Güvenlik" icon="shield" href="/tr/gateway/security">
    Tehdit modeli ve sertleştirme.
  </Card>
  <Card title="Çoklu ajan yönlendirme" icon="sitemap" href="/tr/concepts/multi-agent">
    Grupları ve konuları ajanlarla eşleyin.
  </Card>
  <Card title="Sorun giderme" icon="wrench" href="/tr/channels/troubleshooting">
    Kanallar arası tanılama.
  </Card>
</CardGroup>
