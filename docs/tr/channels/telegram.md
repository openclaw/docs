---
read_when:
    - Telegram özellikleri veya webhooks üzerinde çalışma
summary: Telegram bot desteğinin durumu, yetenekleri ve yapılandırması
title: Telegram
x-i18n:
    generated_at: "2026-05-12T12:49:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 185ac6051d3da2037b2727a6afca98bef946bc62c3f2b22cc9afe9831669297b
    source_path: channels/telegram.md
    workflow: 16
---

Üretime hazır; grammY aracılığıyla bot DM'leri ve grupları destekler. Varsayılan mod uzun yoklamadır; Webhook modu isteğe bağlıdır.

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
  <Step title="Bot token'ını BotFather'da oluşturun">
    Telegram'ı açın ve **@BotFather** ile sohbet edin (kullanıcı adının tam olarak `@BotFather` olduğunu doğrulayın).

    `/newbot` komutunu çalıştırın, yönergeleri izleyin ve token'ı kaydedin.

  </Step>

  <Step title="Token'ı ve DM ilkesini yapılandırın">

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

    Ortam değişkeni yedeği: `TELEGRAM_BOT_TOKEN=...` (yalnızca varsayılan hesap).
    Telegram, `openclaw channels login telegram` kullanmaz; token'ı yapılandırmada/ortamda ayarlayın, ardından Gateway'i başlatın.

  </Step>

  <Step title="Gateway'i başlatın ve ilk DM'yi onaylayın">

```bash
openclaw gateway
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    Eşleştirme kodları 1 saat sonra sona erer.

  </Step>

  <Step title="Botu bir gruba ekleyin">
    Botu grubunuza ekleyin, ardından grup erişimi için gereken iki kimliği de alın:

    - `allowFrom` / `groupAllowFrom` içinde kullanılan Telegram kullanıcı kimliğiniz
    - `channels.telegram.groups` altında anahtar olarak kullanılan Telegram grup sohbet kimliği

    İlk kurulum için grup sohbet kimliğini `openclaw logs --follow`, iletilmiş kimlik botu veya Bot API `getUpdates` ile alın. Grup izin verildikten sonra `/whoami@<bot_username>` kullanıcı ve grup kimliklerini doğrulayabilir.

    `-100` ile başlayan negatif Telegram süper grup kimlikleri grup sohbet kimlikleridir. Bunları `groupAllowFrom` altına değil, `channels.telegram.groups` altına koyun.

  </Step>
</Steps>

<Note>
Token çözümleme sırası hesaba duyarlıdır. Pratikte, yapılandırma değerleri ortam değişkeni yedeğine göre önceliklidir ve `TELEGRAM_BOT_TOKEN` yalnızca varsayılan hesaba uygulanır.
</Note>

## Telegram tarafı ayarları

<AccordionGroup>
  <Accordion title="Gizlilik modu ve grup görünürlüğü">
    Telegram botları varsayılan olarak **Gizlilik Modu** kullanır; bu, gruplarda hangi mesajları alabileceklerini sınırlar.

    Botun tüm grup mesajlarını görmesi gerekiyorsa:

    - `/setprivacy` ile gizlilik modunu devre dışı bırakın veya
    - botu grup yöneticisi yapın.

    Gizlilik modunu değiştirirken, Telegram'ın değişikliği uygulaması için botu her gruptan kaldırıp yeniden ekleyin.

  </Accordion>

  <Accordion title="Grup izinleri">
    Yönetici durumu Telegram grup ayarlarında denetlenir.

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
    - `allowlist` (`allowFrom` içinde en az bir gönderen kimliği gerektirir)
    - `open` (`allowFrom` öğesinin `"*"` içermesini gerektirir)
    - `disabled`

    `allowFrom: ["*"]` ile `dmPolicy: "open"`, bot kullanıcı adını bulan veya tahmin eden herhangi bir Telegram hesabının bota komut vermesine izin verir. Bunu yalnızca araçları sıkı biçimde kısıtlanmış, bilinçli olarak herkese açık botlar için kullanın; tek sahipli botlar sayısal kullanıcı kimlikleriyle `allowlist` kullanmalıdır.

    `channels.telegram.allowFrom` sayısal Telegram kullanıcı kimliklerini kabul eder. `telegram:` / `tg:` önekleri kabul edilir ve normalleştirilir.
    Çok hesaplı yapılandırmalarda, kısıtlayıcı üst düzey bir `channels.telegram.allowFrom` güvenlik sınırı olarak ele alınır: hesap düzeyindeki `allowFrom: ["*"]` girdileri, birleştirmeden sonra etkin hesap izin listesi hâlâ açık bir joker karakter içermedikçe o hesabı herkese açık yapmaz.
    Boş `allowFrom` ile `dmPolicy: "allowlist"` tüm DM'leri engeller ve yapılandırma doğrulaması tarafından reddedilir.
    Kurulum yalnızca sayısal kullanıcı kimliklerini ister.
    Yükseltme yaptıysanız ve yapılandırmanız `@username` izin listesi girdileri içeriyorsa, bunları çözümlemek için `openclaw doctor --fix` çalıştırın (en iyi çaba; Telegram bot token'ı gerektirir).
    Daha önce eşleştirme deposu izin listesi dosyalarına güveniyorsanız, `openclaw doctor --fix` izin listesi akışlarında girdileri `channels.telegram.allowFrom` içine kurtarabilir (örneğin `dmPolicy: "allowlist"` henüz açık kimlik içermediğinde).

    Tek sahipli botlar için, erişim ilkesini önceki eşleştirme onaylarına bağlı kalmak yerine yapılandırmada kalıcı tutmak amacıyla açık sayısal `allowFrom` kimlikleriyle `dmPolicy: "allowlist"` tercih edin.

    Yaygın karışıklık: DM eşleştirme onayı, "bu gönderen her yerde yetkilidir" anlamına gelmez.
    Eşleştirme DM erişimi verir. Henüz komut sahibi yoksa, ilk onaylanan eşleştirme ayrıca `commands.ownerAllowFrom` ayarlayarak yalnızca sahip komutları ve yürütme onayları için açık bir operatör hesabı belirler.
    Grup gönderen yetkilendirmesi yine açık yapılandırma izin listelerinden gelir.
    "Bir kez yetkilendirilmiş olayım ve hem DM'ler hem de grup komutları çalışsın" istiyorsanız, sayısal Telegram kullanıcı kimliğinizi `channels.telegram.allowFrom` içine koyun; yalnızca sahip komutları için `commands.ownerAllowFrom` öğesinin `telegram:<your user id>` içerdiğinden emin olun.

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

  <Tab title="Grup ilkesi ve izin listeleri">
    İki denetim birlikte uygulanır:

    1. **Hangi gruplara izin verilir** (`channels.telegram.groups`)
       - `groups` yapılandırması yok:
         - `groupPolicy: "open"` ile: herhangi bir grup, grup kimliği denetimlerinden geçebilir
         - `groupPolicy: "allowlist"` (varsayılan) ile: `groups` girdileri (veya `"*"`) ekleyene kadar gruplar engellenir
       - `groups` yapılandırılmış: izin listesi gibi davranır (açık kimlikler veya `"*"`)

    2. **Gruplarda hangi gönderenlere izin verilir** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (varsayılan)
       - `disabled`

    `groupAllowFrom`, grup gönderen filtrelemesi için kullanılır. Ayarlanmazsa Telegram `allowFrom` değerine geri döner.
    `groupAllowFrom` girdileri sayısal Telegram kullanıcı kimlikleri olmalıdır (`telegram:` / `tg:` önekleri normalleştirilir).
    Telegram grup veya süper grup sohbet kimliklerini `groupAllowFrom` içine koymayın. Negatif sohbet kimlikleri `channels.telegram.groups` altına aittir.
    Sayısal olmayan girdiler gönderen yetkilendirmesinde yok sayılır.
    Güvenlik sınırı (`2026.2.25+`): grup gönderen kimlik doğrulaması DM eşleştirme deposu onaylarını **devralmaz**.
    Eşleştirme yalnızca DM için kalır. Gruplar için `groupAllowFrom` veya grup başına/konu başına `allowFrom` ayarlayın.
    `groupAllowFrom` ayarlı değilse Telegram, eşleştirme deposuna değil yapılandırmadaki `allowFrom` değerine geri döner.
    Tek sahipli botlar için pratik kalıp: kullanıcı kimliğinizi `channels.telegram.allowFrom` içine ayarlayın, `groupAllowFrom` değerini ayarsız bırakın ve hedef gruplara `channels.telegram.groups` altında izin verin.
    Çalışma zamanı notu: `channels.telegram` tamamen yoksa, `channels.defaults.groupPolicy` açıkça ayarlanmadığı sürece çalışma zamanı hata kapalı `groupPolicy="allowlist"` varsayılanını kullanır.

    Yalnızca sahip grup kurulumu:

```json5
{
  channels: {
    telegram: {
      enabled: true,
      dmPolicy: "pairing",
      allowFrom: ["<YOUR_TELEGRAM_USER_ID>"],
      groupPolicy: "allowlist",
      groups: {
        "<GROUP_CHAT_ID>": {
          requireMention: true,
        },
      },
    },
  },
}
```

    Gruptan `@<bot_username> ping` ile test edin. `requireMention: true` olduğu sürece düz grup mesajları botu tetiklemez.

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
      Yaygın hata: `groupAllowFrom` bir Telegram grup izin listesi değildir.

      - `-1001234567890` gibi negatif Telegram grup veya süper grup sohbet kimliklerini `channels.telegram.groups` altına koyun.
      - İzin verilen bir grup içinde hangi kişilerin botu tetikleyebileceğini sınırlamak istediğinizde `8734062810` gibi Telegram kullanıcı kimliklerini `groupAllowFrom` altına koyun.
      - `groupAllowFrom: ["*"]` değerini yalnızca izin verilen bir grubun herhangi bir üyesinin botla konuşabilmesini istediğinizde kullanın.

    </Warning>

  </Tab>

  <Tab title="Bahsetme davranışı">
    Grup yanıtları varsayılan olarak bahsetme gerektirir.

    Bahsetme şuradan gelebilir:

    - yerel `@botusername` bahsetmesi veya
    - şunlardaki bahsetme kalıpları:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Oturum düzeyi komut geçişleri:

    - `/activation always`
    - `/activation mention`

    Bunlar yalnızca oturum durumunu günceller. Kalıcılık için yapılandırmayı kullanın.

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
    - veya `openclaw logs --follow` içinden `chat.id` değerini okuyun
    - veya Bot API `getUpdates` çıktısını inceleyin
    - grup izin verildikten sonra, yerel komutlar etkinse `/whoami@<bot_username>` çalıştırın

  </Tab>
</Tabs>

## Çalışma zamanı davranışı

- Telegram, Gateway süreci tarafından sahiplenilir.
- Yönlendirme deterministiktir: Telegram gelenleri Telegram'a yanıtlar (model kanal seçmez).
- Gelen mesajlar, yanıt meta verileri, medya yer tutucuları ve Gateway'in gözlemlediği Telegram yanıtları için kalıcı yanıt zinciri bağlamıyla paylaşılan kanal zarfına normalleştirilir.
- Grup oturumları grup kimliğine göre yalıtılır. Forum konuları, konuları yalıtılmış tutmak için `:topic:<threadId>` ekler.
- DM mesajları `message_thread_id` taşıyabilir; OpenClaw yanıtlar için iş parçacığı kimliğini korur, ancak varsayılan olarak DM'leri düz oturumda tutar. DM konu oturumu yalıtımını bilinçli olarak istediğinizde `channels.telegram.dm.threadReplies: "inbound"`, `channels.telegram.direct.<chatId>.threadReplies: "inbound"`, `requireTopic: true` veya eşleşen bir konu yapılandırması ayarlayın.
- Uzun yoklama, sohbet başına/iş parçacığı başına sıralama ile grammY runner kullanır. Genel runner sink eşzamanlılığı `agents.defaults.maxConcurrent` kullanır.
- Uzun yoklama, her Gateway süreci içinde korunur; böylece aynı anda yalnızca bir etkin yoklayıcı bir bot token'ını kullanabilir. Hâlâ `getUpdates` 409 çakışmaları görüyorsanız, aynı token'ı büyük olasılıkla başka bir OpenClaw Gateway'i, betik veya harici yoklayıcı kullanıyordur.
- Uzun yoklama izleyicisi yeniden başlatmaları varsayılan olarak 120 saniye boyunca tamamlanmış `getUpdates` canlılığı olmadığında tetiklenir. `channels.telegram.pollingStallThresholdMs` değerini yalnızca dağıtımınız uzun süren işler sırasında hâlâ yanlış yoklama durması yeniden başlatmaları görüyorsa artırın. Değer milisaniye cinsindendir ve `30000` ile `600000` arasında izin verilir; hesap başına geçersiz kılmalar desteklenir.
- Telegram Bot API okundu bilgisi desteği sunmaz (`sendReadReceipts` uygulanmaz).

## Özellik başvurusu

<AccordionGroup>
  <Accordion title="Canlı akış önizlemesi (mesaj düzenlemeleri)">
    OpenClaw kısmi yanıtları gerçek zamanlı olarak akışa verebilir:

    - doğrudan sohbetler: önizleme mesajı + `editMessageText`
    - gruplar/konular: önizleme mesajı + `editMessageText`

    Gereksinim:

    - `channels.telegram.streaming`, `off | partial | block | progress` olur (varsayılan: `partial`)
    - `progress`, araç ilerlemesi için düzenlenebilir tek bir durum taslağı tutar, tamamlandığında bunu temizler ve son yanıtı normal bir mesaj olarak gönderir
    - `streaming.preview.toolProgress`, araç/ilerleme güncellemelerinin aynı düzenlenmiş önizleme mesajını yeniden kullanıp kullanmayacağını denetler (varsayılan: önizleme akışı etkinken `true`)
    - `streaming.preview.commandText`, bu araç ilerleme satırlarının içindeki komut/çalıştırma ayrıntısını denetler: `raw` (varsayılan, yayımlanmış davranışı korur) veya `status` (yalnızca araç etiketi)
    - eski `channels.telegram.streamMode` ve boolean `streaming` değerleri algılanır; bunları `channels.telegram.streaming.mode` değerine taşımak için `openclaw doctor --fix` çalıştırın

    Araç ilerleme önizleme güncellemeleri, araçlar çalışırken gösterilen kısa durum satırlarıdır; örneğin komut yürütme, dosya okumaları, planlama güncellemeleri veya yama özetleri. Telegram, `v2026.4.22` ve sonrasındaki yayımlanmış OpenClaw davranışıyla eşleşmesi için bunları varsayılan olarak etkin tutar. Yanıt metni için düzenlenen önizlemeyi koruyup araç ilerleme satırlarını gizlemek için şunu ayarlayın:

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

    Araç ilerlemesini görünür tutup komut/çalıştırma metnini gizlemek için şunu ayarlayın:

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

    Son yanıtı aynı mesaja düzenlemeden görünür araç ilerlemesi istediğinizde `progress` modunu kullanın. Komut metni politikasını `streaming.progress` altına koyun:

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

    `streaming.mode: "off"` değerini yalnızca sadece son yanıt teslimi istediğinizde kullanın: Telegram önizleme düzenlemeleri devre dışı bırakılır ve genel araç/ilerleme konuşmaları bağımsız durum mesajları olarak gönderilmek yerine bastırılır. Onay istemleri, medya yükleri ve hatalar yine de normal son teslim yolundan yönlendirilir. Yalnızca araç ilerleme durum satırlarını gizlerken yanıt önizleme düzenlemelerini korumak istediğinizde `streaming.preview.toolProgress: false` kullanın.

    <Note>
      Telegram seçili alıntı yanıtları istisnadır. `replyToMode`, `"first"`, `"all"` veya `"batched"` olduğunda ve gelen mesaj seçili alıntı metni içerdiğinde, OpenClaw son yanıtı yanıt önizlemesini düzenlemek yerine Telegram'ın yerel alıntı yanıt yolundan gönderir; bu nedenle `streaming.preview.toolProgress` o tur için kısa durum satırlarını gösteremez. Seçili alıntı metni olmayan geçerli mesaj yanıtları önizleme akışını korur. Araç ilerleme görünürlüğü yerel alıntı yanıtlarından daha önemli olduğunda `replyToMode: "off"` ayarlayın veya bu ödünleşimi kabul etmek için `streaming.preview.toolProgress: false` ayarlayın.
    </Note>

    Yalnızca metin yanıtları için:

    - kısa DM/grup/konu önizlemeleri: OpenClaw aynı önizleme mesajını tutar ve son düzenlemeyi yerinde yapar
    - birden çok Telegram mesajına bölünen uzun metin son yanıtları, mümkün olduğunda mevcut önizlemeyi ilk son parça olarak yeniden kullanır, sonra yalnızca kalan parçaları gönderir
    - ilerleme modu son yanıtları durum taslağını temizler ve taslağı yanıta düzenlemek yerine normal son teslimi kullanır
    - tamamlanan metin doğrulanmadan önce son düzenleme başarısız olursa OpenClaw normal son teslimi kullanır ve bayat önizlemeyi temizler

    Karmaşık yanıtlar için (örneğin medya yükleri), OpenClaw normal son teslime geri döner ve ardından önizleme mesajını temizler.

    Önizleme akışı, blok akışından ayrıdır. Telegram için blok akışı açıkça etkinleştirildiğinde OpenClaw çift akışı önlemek için önizleme akışını atlar.

    Yalnızca Telegram akıl yürütme akışı:

    - `/reasoning stream`, oluşturma sırasında akıl yürütmeyi canlı önizlemeye gönderir
    - akıl yürütme önizlemesi son teslimden sonra silinir; akıl yürütmenin görünür kalması gerektiğinde `/reasoning on` kullanın
    - son yanıt, akıl yürütme metni olmadan gönderilir

  </Accordion>

  <Accordion title="Biçimlendirme ve HTML geri dönüşü">
    Giden metin Telegram `parse_mode: "HTML"` kullanır.

    - Markdown benzeri metin, Telegram açısından güvenli HTML'ye işlenir.
    - Desteklenen Telegram HTML etiketleri korunur; desteklenmeyen HTML kaçışlanır.
    - Telegram ayrıştırılmış HTML'yi reddederse OpenClaw düz metin olarak yeniden dener.

    Bağlantı önizlemeleri varsayılan olarak etkindir ve `channels.telegram.linkPreview: false` ile devre dışı bırakılabilir.

  </Accordion>

  <Accordion title="Yerel komutlar ve özel komutlar">
    Telegram komut menüsü kaydı, başlangıçta `setMyCommands` ile işlenir.

    Yerel komut varsayılanları:

    - `commands.native: "auto"`, Telegram için yerel komutları etkinleştirir

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

    - adlar normalleştirilir (başındaki `/` kaldırılır, küçük harfe çevrilir)
    - geçerli kalıp: `a-z`, `0-9`, `_`, uzunluk `1..32`
    - özel komutlar yerel komutları geçersiz kılamaz
    - çakışmalar/çoğaltmalar atlanır ve günlüğe kaydedilir

    Notlar:

    - özel komutlar yalnızca menü girdileridir; davranışı otomatik olarak uygulamazlar
    - Plugin/skill komutları, Telegram menüsünde gösterilmese bile yazıldığında çalışmaya devam edebilir

    Yerel komutlar devre dışı bırakılırsa yerleşikler kaldırılır. Özel/Plugin komutları, yapılandırılmışsa yine de kaydolabilir.

    Yaygın kurulum hataları:

    - `BOT_COMMANDS_TOO_MUCH` ile `setMyCommands failed`, Telegram menüsünün kırpmadan sonra hâlâ taştığı anlamına gelir; Plugin/skill/özel komutları azaltın veya `channels.telegram.commands.native` ayarını devre dışı bırakın.
    - Doğrudan Bot API curl komutları çalışırken `deleteWebhook`, `deleteMyCommands` veya `setMyCommands` işlemlerinin `404: Not Found` ile başarısız olması, `channels.telegram.apiRoot` değerinin tam `/bot<TOKEN>` uç noktasına ayarlandığı anlamına gelebilir. `apiRoot` yalnızca Bot API kökü olmalıdır ve `openclaw doctor --fix` yanlışlıkla eklenmiş sondaki `/bot<TOKEN>` bölümünü kaldırır.
    - `getMe returned 401`, Telegram'ın yapılandırılmış bot token'ını reddettiği anlamına gelir. `botToken`, `tokenFile` veya `TELEGRAM_BOT_TOKEN` değerini güncel BotFather token'ı ile güncelleyin; OpenClaw yoklamadan önce durur, bu nedenle bu bir Webhook temizleme hatası olarak bildirilmez.
    - Ağ/fetch hatalarıyla `setMyCommands failed` genellikle `api.telegram.org` adresine giden DNS/HTTPS'in engellendiği anlamına gelir.

    ### Cihaz eşleştirme komutları (`device-pair` Plugin'i)

    `device-pair` Plugin'i yüklü olduğunda:

    1. `/pair` kurulum kodu üretir
    2. kodu iOS uygulamasına yapıştırın
    3. `/pair pending` bekleyen istekleri listeler (rol/kapsamlar dahil)
    4. isteği onaylayın:
       - açık onay için `/pair approve <requestId>`
       - yalnızca bir bekleyen istek olduğunda `/pair approve`
       - en yenisi için `/pair approve latest`

    Kurulum kodu kısa ömürlü bir bootstrap token taşır. Yerleşik bootstrap devri, birincil node token'ını `scopes: []` konumunda tutar; devredilen herhangi bir operatör token'ı `operator.approvals`, `operator.read`, `operator.talk.secrets` ve `operator.write` ile sınırlı kalır. Bootstrap kapsam denetimleri rol öneklidir; bu yüzden bu operatör izin listesi yalnızca operatör isteklerini karşılar; operatör olmayan rollerin hâlâ kendi rol önekleri altında kapsamlara ihtiyacı vardır.

    Bir cihaz değişmiş kimlik doğrulama ayrıntılarıyla yeniden denerse (örneğin rol/kapsamlar/açık anahtar), önceki bekleyen istek geçersiz kılınır ve yeni istek farklı bir `requestId` kullanır. Onaylamadan önce `/pair pending` komutunu yeniden çalıştırın.

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

    Geri çağırma tıklamaları aracıya metin olarak geçirilir:
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

    Kapılama denetimleri:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (varsayılan: devre dışı)

    Not: `edit` ve `topic-create` şu anda varsayılan olarak etkindir ve ayrı `channels.telegram.actions.*` anahtarları yoktur.
    Çalışma zamanı gönderimleri etkin yapılandırma/gizli bilgiler anlık görüntüsünü kullanır (başlangıç/yeniden yükleme), bu yüzden eylem yolları gönderim başına anlık SecretRef yeniden çözümlemesi yapmaz.

    Tepki kaldırma semantiği: [/tools/reactions](/tr/tools/reactions)

  </Accordion>

  <Accordion title="Yanıt dizilimi etiketleri">
    Telegram, oluşturulan çıktıda açık yanıt dizilimi etiketlerini destekler:

    - `[[reply_to_current]]` tetikleyen mesaja yanıt verir
    - `[[reply_to:<id>]]` belirli bir Telegram mesaj kimliğine yanıt verir

    `channels.telegram.replyToMode` işlemeyi denetler:

    - `off` (varsayılan)
    - `first`
    - `all`

    Yanıt dizilimi etkinleştirildiğinde ve özgün Telegram metni veya açıklaması kullanılabilir olduğunda, OpenClaw otomatik olarak yerel bir Telegram alıntı parçası ekler. Telegram yerel alıntı metnini 1024 UTF-16 kod birimiyle sınırlar; bu nedenle daha uzun mesajlar baştan alıntılanır ve Telegram alıntıyı reddederse düz yanıta geri döner.

    Not: `off`, örtük yanıt dizilimini devre dışı bırakır. Açık `[[reply_to_*]]` etiketleri yine de dikkate alınır.

  </Accordion>

  <Accordion title="Forum konuları ve ileti dizisi davranışı">
    Forum süper grupları:

    - konu oturumu anahtarları `:topic:<threadId>` ekler
    - yanıtlar ve yazıyor eylemi konu ileti dizisini hedefler
    - konu yapılandırma yolu:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Genel konu (`threadId=1`) özel durumu:

    - mesaj gönderimleri `message_thread_id` öğesini çıkarır (Telegram `sendMessage(...thread_id=1)` çağrısını reddeder)
    - yazıyor eylemleri yine de `message_thread_id` içerir

    Konu mirası: konu girdileri, geçersiz kılınmadıkça grup ayarlarını devralır (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
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

    Ardından her konu kendi oturum anahtarına sahip olur: `agent:zu:telegram:group:-1001234567890:topic:3`

    **Kalıcı ACP konu bağlama**: Forum konuları, üst düzey türlendirilmiş ACP bağlamaları aracılığıyla ACP harness oturumlarını sabitleyebilir (`type: "acp"` ve `match.channel: "telegram"`, `peer.kind: "group"` içeren `bindings[]` ve `-1001234567890:topic:42` gibi konu nitelemeli bir kimlik). Şu anda gruplardaki/süper gruplardaki forum konularıyla sınırlıdır. Bkz. [ACP Aracıları](/tr/tools/acp-agents).

    **Sohbetten iş parçacığına bağlı ACP başlatma**: `/acp spawn <agent> --thread here|auto` mevcut konuyu yeni bir ACP oturumuna bağlar; devam iletileri doğrudan oraya yönlendirilir. OpenClaw başlatma onayını konu içinde sabitler. `channels.telegram.threadBindings.spawnSessions` etkin kalmalıdır (varsayılan: `true`).

    Şablon bağlamı `MessageThreadId` ve `IsForum` değerlerini açığa çıkarır. `message_thread_id` içeren DM sohbetleri varsayılan olarak DM yönlendirmesini ve yanıt meta verilerini düz oturumlarda tutar; iş parçacığına duyarlı oturum anahtarlarını yalnızca `threadReplies: "inbound"`, `threadReplies: "always"`, `requireTopic: true` veya eşleşen bir konu yapılandırmasıyla yapılandırıldıklarında kullanırlar. Hesap varsayılanı için üst düzey `channels.telegram.dm.threadReplies` değerini veya tek bir DM için `direct.<chatId>.threadReplies` değerini kullanın.

  </Accordion>

  <Accordion title="Ses, video ve çıkartmalar">
    ### Ses mesajları

    Telegram, sesli notlar ile ses dosyalarını ayırt eder.

    - varsayılan: ses dosyası davranışı
    - sesli not gönderimini zorlamak için aracı yanıtında `[[audio_as_voice]]` etiketi
    - gelen sesli not dökümleri, aracı bağlamında makine tarafından üretilmiş,
      güvenilmeyen metin olarak çerçevelenir; bahsetme algılama yine de ham
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

    Çıkartmalar bir kez açıklanır (mümkün olduğunda) ve yinelenen görsel çağrılarını azaltmak için önbelleğe alınır.

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

    Etkinleştirildiğinde OpenClaw şu tür sistem olaylarını kuyruğa alır:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Yapılandırma:

    - `channels.telegram.reactionNotifications`: `off | own | all` (varsayılan: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (varsayılan: `minimal`)

    Notlar:

    - `own`, yalnızca bot tarafından gönderilen mesajlara kullanıcı tepkileri anlamına gelir (gönderilen mesaj önbelleği üzerinden en iyi çaba).
    - Tepki olayları yine de Telegram erişim kontrollerine uyar (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); yetkisiz gönderenler düşürülür.
    - Telegram, tepki güncellemelerinde iş parçacığı kimlikleri sağlamaz.
      - forum olmayan gruplar grup sohbeti oturumuna yönlendirilir
      - forum grupları, tam kaynak konuya değil, grubun genel konu oturumuna (`:topic:1`) yönlendirilir

    Yoklama/Webhook için `allowed_updates` otomatik olarak `message_reaction` içerir.

  </Accordion>

  <Accordion title="Ack tepkileri">
    `ackReaction`, OpenClaw gelen bir mesajı işlerken bir onay emojisi gönderir.

    Çözümleme sırası:

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

    - `channels.telegram.groups` değerini güncellemek için grup taşıma olayları (`migrate_to_chat_id`)
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
    Varsayılan uzun yoklamadır. Webhook modu için `channels.telegram.webhookUrl` ve `channels.telegram.webhookSecret` değerlerini ayarlayın; isteğe bağlı olarak `webhookPath`, `webhookHost`, `webhookPort` (varsayılanlar `/telegram-webhook`, `127.0.0.1`, `8787`).

    Uzun yoklama modunda OpenClaw, yeniden başlatma filigranını yalnızca bir güncelleme başarıyla dağıtıldıktan sonra kalıcı hale getirir. Bir işleyici başarısız olursa bu güncelleme aynı süreçte yeniden denenebilir durumda kalır ve yeniden başlatma tekilleştirmesi için tamamlanmış olarak yazılmaz.

    Yerel dinleyici `127.0.0.1:8787` adresine bağlanır. Genel giriş için yerel bağlantı noktasının önüne bir ters proxy koyun veya bilinçli olarak `webhookHost: "0.0.0.0"` ayarlayın.

    Webhook modu, Telegram'a `200` döndürmeden önce istek korumalarını, Telegram gizli belirtecini ve JSON gövdesini doğrular.
    OpenClaw ardından güncellemeyi uzun yoklamanın kullandığı aynı sohbet başına/konu başına bot hatları üzerinden eşzamansız olarak işler; böylece yavaş aracı dönüşleri Telegram'ın teslim ACK değerini bekletmez.

  </Accordion>

  <Accordion title="Sınırlar, yeniden deneme ve CLI hedefleri">
    - `channels.telegram.textChunkLimit` varsayılanı 4000'dir.
    - `channels.telegram.chunkMode="newline"`, uzunluğa göre bölmeden önce paragraf sınırlarını (boş satırlar) tercih eder.
    - `channels.telegram.mediaMaxMb` (varsayılan 100), gelen ve giden Telegram medya boyutunu sınırlar.
    - `channels.telegram.mediaGroupFlushMs` (varsayılan 500), OpenClaw bunları tek bir gelen mesaj olarak dağıtmadan önce Telegram albümlerinin/medya gruplarının ne kadar süre arabelleğe alınacağını denetler. Albüm parçaları geç geliyorsa artırın; albüm yanıt gecikmesini azaltmak için düşürün.
    - `channels.telegram.timeoutSeconds`, Telegram API istemcisi zaman aşımını geçersiz kılar (ayarlanmazsa grammY varsayılanı geçerlidir). Bot istemcileri, yapılandırılan değerleri 60 saniyelik giden metin/yazıyor isteği korumasının altına sıkıştırır; böylece grammY, OpenClaw'ın aktarım koruması ve yedeği çalışmadan önce görünür yanıt teslimini iptal etmez. Uzun yoklama yine de 45 saniyelik `getUpdates` isteği koruması kullanır, böylece boşta yoklamalar süresiz olarak terk edilmez.
    - `channels.telegram.pollingStallThresholdMs` varsayılan olarak `120000` değerindedir; yalnızca yanlış pozitif yoklama-durması yeniden başlatmaları için `30000` ile `600000` arasında ayarlayın.
    - grup bağlam geçmişi `channels.telegram.historyLimit` veya `messages.groupChat.historyLimit` kullanır (varsayılan 50); `0` devre dışı bırakır.
    - yanıt/alıntı/iletme ek bağlamı, Gateway üst mesajları gözlemlediğinde seçili tek bir konuşma bağlam penceresine normalleştirilir; gözlemlenen mesaj önbelleği oturum deposunun yanında kalıcı hale getirilir. Telegram güncellemelerde yalnızca tek bir sığ `reply_to_message` içerir; bu nedenle önbellekten daha eski zincirler Telegram'ın mevcut güncelleme yüküyle sınırlıdır.
    - Telegram izin listeleri öncelikle aracıyı kimin tetikleyebileceğini kapılar; tam bir ek bağlam redaksiyon sınırı değildir.
    - DM geçmiş denetimleri:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - `channels.telegram.retry` yapılandırması, kurtarılabilir giden API hataları için Telegram gönderme yardımcılarına (CLI/araçlar/eylemler) uygulanır. Gelen son-yanıt teslimi de Telegram ön bağlantı hataları için sınırlı bir güvenli-gönder yeniden denemesi kullanır, ancak görünür mesajları çoğaltabilecek belirsiz gönderim sonrası ağ zarflarını yeniden denemez.

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
    - giden görüntüleri, GIF'leri ve videoları sıkıştırılmış fotoğraf, animasyonlu medya veya video yüklemeleri yerine belge olarak göndermek için `--force-document`

    Eylem kapılama:

    - `channels.telegram.actions.sendMessage=false`, yoklamalar dahil giden Telegram mesajlarını devre dışı bırakır
    - `channels.telegram.actions.poll=false`, normal gönderimleri etkin bırakarak Telegram yoklaması oluşturmayı devre dışı bırakır

  </Accordion>

  <Accordion title="Telegram'da exec onayları">
    Telegram, onaylayıcı DM'lerinde exec onaylarını destekler ve isteğe bağlı olarak istemleri kaynak sohbet veya konuya gönderebilir. Onaylayıcılar sayısal Telegram kullanıcı kimlikleri olmalıdır.

    Yapılandırma yolu:

    - `channels.telegram.execApprovals.enabled` (en az bir onaylayıcı çözümlenebilir olduğunda otomatik etkinleşir)
    - `channels.telegram.execApprovals.approvers` (`commands.ownerAllowFrom` içindeki sayısal sahip kimliklerine geri döner)
    - `channels.telegram.execApprovals.target`: `dm` (varsayılan) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` ve `defaultTo`, botla kimin konuşabileceğini ve normal yanıtları nereye göndereceğini denetler. Birini exec onaylayıcısı yapmazlar. Henüz komut sahibi yoksa ilk onaylanmış DM eşleştirmesi `commands.ownerAllowFrom` değerini önyükler; böylece tek sahipli kurulum, `execApprovals.approvers` altında kimlikleri çoğaltmadan çalışmaya devam eder.

    Kanal teslimi komut metnini sohbette gösterir; `channel` veya `both` değerlerini yalnızca güvenilen gruplarda/konularda etkinleştirin. İstem bir forum konusuna ulaştığında OpenClaw, onay istemi ve devam iletisi için konuyu korur. Exec onayları varsayılan olarak 30 dakika sonra sona erer.

    Satır içi onay düğmeleri ayrıca hedef yüzeye (`dm`, `group` veya `all`) izin vermesi için `channels.telegram.capabilities.inlineButtons` gerektirir. `plugin:` önekli onay kimlikleri Plugin onayları üzerinden çözümlenir; diğerleri önce exec onayları üzerinden çözümlenir.

    Bkz. [Exec onayları](/tr/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Hata yanıtı denetimleri

Aracı bir teslim veya sağlayıcı hatasıyla karşılaştığında, Telegram hata metniyle yanıt verebilir ya da bunu bastırabilir. Bu davranışı iki yapılandırma anahtarı denetler:

| Anahtar                             | Değerler          | Varsayılan | Açıklama                                                                                              |
| ----------------------------------- | ----------------- | ---------- | ----------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply`    | `reply` sohbete kullanıcı dostu bir hata mesajı gönderir. `silent` hata yanıtlarını tamamen bastırır. |
| `channels.telegram.errorCooldownMs` | sayı (ms)         | `60000`    | Aynı sohbete hata yanıtları arasındaki minimum süre. Kesintiler sırasında hata spam'ini önler.        |

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
  <Accordion title="Bot, etiketlenmeyen grup mesajlarına yanıt vermiyor">

    - `requireMention=false` ise Telegram gizlilik modu tam görünürlüğe izin vermelidir.
      - BotFather: `/setprivacy` -> Devre dışı bırak
      - ardından botu gruptan kaldırıp yeniden ekleyin
    - Yapılandırma etiketsiz grup mesajları beklediğinde `openclaw channels status` uyarır.
    - `openclaw channels status --probe` açık sayısal grup kimliklerini denetleyebilir; joker karakter `"*"` için üyelik yoklaması yapılamaz.
    - hızlı oturum testi: `/activation always`.

  </Accordion>

  <Accordion title="Bot grup mesajlarını hiç görmüyor">

    - `channels.telegram.groups` varsa grup listelenmelidir (veya `"*"` dahil edilmelidir)
    - botun gruptaki üyeliğini doğrulayın
    - atlama nedenleri için günlükleri inceleyin: `openclaw logs --follow`

  </Accordion>

  <Accordion title="Komutlar kısmen çalışıyor veya hiç çalışmıyor">

    - gönderen kimliğinizi yetkilendirin (eşleştirme ve/veya sayısal `allowFrom`)
    - grup ilkesi `open` olsa bile komut yetkilendirmesi yine de geçerlidir
    - `BOT_COMMANDS_TOO_MUCH` ile `setMyCommands failed`, yerel menüde çok fazla giriş olduğu anlamına gelir; Plugin/skill/özel komutlarını azaltın veya yerel menüleri devre dışı bırakın
    - Başlangıçtaki `deleteMyCommands` / `setMyCommands` çağrıları ve `sendChatAction` yazıyor çağrıları sınırlandırılır ve istek zaman aşımında Telegram'ın aktarım yedeği üzerinden bir kez yeniden denenir. Kalıcı ağ/fetch hataları genellikle `api.telegram.org` için DNS/HTTPS erişilebilirliği sorunlarını gösterir

  </Accordion>

  <Accordion title="Başlangıç yetkisiz token bildiriyor">

    - `getMe returned 401`, yapılandırılmış bot token'ı için bir Telegram kimlik doğrulama hatasıdır.
    - BotFather içinde bot token'ını yeniden kopyalayın veya yeniden oluşturun, ardından varsayılan hesap için `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken` veya `TELEGRAM_BOT_TOKEN` değerini güncelleyin.
    - Başlangıç sırasında `deleteWebhook 401 Unauthorized` da bir kimlik doğrulama hatasıdır; bunu "webhook yok" olarak ele almak, aynı hatalı token hatasını yalnızca sonraki API çağrılarına ertelemiş olur.

  </Accordion>

  <Accordion title="Polling veya ağ kararsızlığı">

    - Node 22+ + özel fetch/proxy, AbortSignal türleri uyuşmuyorsa anında abort davranışını tetikleyebilir.
    - Bazı host'lar `api.telegram.org` adresini önce IPv6'ya çözer; bozuk IPv6 çıkışı aralıklı Telegram API hatalarına neden olabilir.
    - Günlüklerde `TypeError: fetch failed` veya `Network request for 'getUpdates' failed!` varsa OpenClaw artık bunları kurtarılabilir ağ hataları olarak yeniden dener.
    - Polling başlangıcı sırasında OpenClaw, başarılı başlangıç `getMe` yoklamasını grammY için yeniden kullanır; böylece runner ilk `getUpdates` öncesinde ikinci bir `getMe` çağrısına ihtiyaç duymaz.
    - Polling başlangıcı sırasında `deleteWebhook` geçici bir ağ hatasıyla başarısız olursa OpenClaw başka bir polling öncesi kontrol düzlemi çağrısı yapmak yerine long polling'e devam eder. Hâlâ etkin olan bir webhook, `getUpdates` çakışması olarak görünür; OpenClaw ardından Telegram aktarımını yeniden oluşturur ve webhook temizliğini yeniden dener.
    - Telegram soketleri kısa ve sabit bir aralıkla yenileniyorsa düşük bir `channels.telegram.timeoutSeconds` değeri olup olmadığını kontrol edin; bot istemcileri, yapılandırılmış değerleri giden istek ve `getUpdates` istek korumalarının altına düşmeyecek şekilde sınırlar, ancak eski sürümler bu değerler bu korumaların altındayken her polling veya yanıtı abort edebiliyordu.
    - Günlüklerde `Polling stall detected` varsa OpenClaw varsayılan olarak 120 saniye boyunca tamamlanmış long-poll canlılığı olmadan polling'i yeniden başlatır ve Telegram aktarımını yeniden oluşturur.
    - `openclaw channels status --probe` ve `openclaw doctor`, çalışan bir polling hesabı başlangıç toleransından sonra `getUpdates` tamamlamadığında, çalışan bir webhook hesabı başlangıç toleransından sonra `setWebhook` tamamlamadığında veya son başarılı polling aktarım etkinliği bayatladığında uyarır.
    - `channels.telegram.pollingStallThresholdMs` değerini yalnızca uzun süren `getUpdates` çağrıları sağlıklıyken ancak host'unuz hâlâ yanlış polling-stall yeniden başlatmaları bildiriyorsa artırın. Kalıcı takılmalar genellikle host ile `api.telegram.org` arasındaki proxy, DNS, IPv6 veya TLS çıkış sorunlarına işaret eder.
    - Telegram ayrıca Bot API aktarımı için `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` ve bunların küçük harfli varyantları dahil işlem proxy env değerlerini dikkate alır. `NO_PROXY` / `no_proxy` yine de `api.telegram.org` adresini atlayabilir.
    - OpenClaw yönetimli proxy bir hizmet ortamı için `OPENCLAW_PROXY_URL` üzerinden yapılandırılmışsa ve standart proxy env yoksa Telegram da Bot API aktarımı için bu URL'yi kullanır.
    - Kararsız doğrudan çıkış/TLS bulunan VPS host'larında Telegram API çağrılarını `channels.telegram.proxy` üzerinden yönlendirin:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ varsayılan olarak `autoSelectFamily=true` kullanır (WSL2 hariç). Telegram DNS sonuç sırası önce `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`, sonra `channels.telegram.network.dnsResultOrder`, sonra `NODE_OPTIONS=--dns-result-order=ipv4first` gibi işlem varsayılanını izler; hiçbiri geçerli değilse Node 22+ `ipv4first` değerine geri döner.
    - Host'unuz WSL2 ise veya açıkça yalnızca IPv4 davranışıyla daha iyi çalışıyorsa aile seçimini zorlayın:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - RFC 2544 kıyaslama aralığı yanıtlarına (`198.18.0.0/15`) Telegram medya indirmeleri için varsayılan olarak zaten izin verilir. Güvenilir bir fake-IP veya saydam proxy, medya indirmeleri sırasında `api.telegram.org` adresini başka bir private/internal/special-use adrese yeniden yazıyorsa yalnızca Telegram için geçerli bypass'a katılabilirsiniz:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - Aynı katılım hesap başına
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork` altında da kullanılabilir.
    - Proxy'niz Telegram medya host'larını `198.18.x.x` içine çözüyorsa önce tehlikeli bayrağı kapalı bırakın. Telegram medyası zaten varsayılan olarak RFC 2544 kıyaslama aralığına izin verir.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork`, Telegram
      medya SSRF korumalarını zayıflatır. Bunu yalnızca Clash, Mihomo veya Surge fake-IP yönlendirmesi gibi, RFC 2544 kıyaslama aralığı dışında private veya special-use yanıtlar üreten güvenilir, operatör kontrollü proxy ortamları için kullanın. Normal herkese açık internet Telegram erişimi için kapalı bırakın.
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

- başlangıç/kimlik doğrulama: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` normal bir dosyaya işaret etmelidir; symlink'ler reddedilir)
- erişim denetimi: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, üst düzey `bindings[]` (`type: "acp"`)
- exec onayları: `execApprovals`, `accounts.*.execApprovals`
- komut/menü: `commands.native`, `commands.nativeSkills`, `customCommands`
- iş parçacığı/yanıtlar: `replyToMode`, `dm.threadReplies`, `direct.*.threadReplies`
- streaming: `streaming` (önizleme), `streaming.preview.toolProgress`, `blockStreaming`
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
Çok hesaplı öncelik: iki veya daha fazla hesap kimliği yapılandırıldığında, varsayılan yönlendirmeyi açık hale getirmek için `channels.telegram.defaultAccount` ayarlayın (veya `channels.telegram.accounts.default` dahil edin). Aksi halde OpenClaw ilk normalize edilmiş hesap kimliğine geri döner ve `openclaw doctor` uyarır. Adlandırılmış hesaplar `channels.telegram.allowFrom` / `groupAllowFrom` değerlerini devralır, ancak `accounts.default.*` değerlerini devralmaz.
</Note>

## İlgili

<CardGroup cols={2}>
  <Card title="Eşleştirme" icon="link" href="/tr/channels/pairing">
    Bir Telegram kullanıcısını Gateway ile eşleştirin.
  </Card>
  <Card title="Gruplar" icon="users" href="/tr/channels/groups">
    Grup ve konu allowlist davranışı.
  </Card>
  <Card title="Kanal yönlendirme" icon="route" href="/tr/channels/channel-routing">
    Gelen mesajları aracılara yönlendirin.
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
