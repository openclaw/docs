---
read_when:
    - Telegram özellikleri veya Webhook'lar üzerinde çalışma
summary: Telegram bot desteği durumu, yetenekleri ve yapılandırması
title: Telegram
x-i18n:
    generated_at: "2026-05-11T20:21:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8f14e59b18e3727b13598d2a5f83ba3ca4267c27c1bd295d36ad20c64707791a
    source_path: channels/telegram.md
    workflow: 16
---

Bot DM'leri ve gruplar için grammY ile üretime hazır. Varsayılan mod uzun yoklamadır; Webhook modu isteğe bağlıdır.

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
  <Step title="BotFather'da bot token'ını oluşturun">
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

    Env yedeği: `TELEGRAM_BOT_TOKEN=...` (yalnızca varsayılan hesap).
    Telegram, `openclaw channels login telegram` kullanmaz; token'ı config/env içinde yapılandırın, ardından Gateway'i başlatın.

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
    Botu grubunuza ekleyin, ardından grup erişiminin ihtiyaç duyduğu iki ID'yi de alın:

    - `allowFrom` / `groupAllowFrom` içinde kullanılan Telegram kullanıcı ID'niz
    - `channels.telegram.groups` altında anahtar olarak kullanılan Telegram grup sohbet ID'si

    İlk kurulum için grup sohbet ID'sini `openclaw logs --follow`, iletilmiş ID botu veya Bot API `getUpdates` üzerinden alın. Gruba izin verildikten sonra `/whoami@<bot_username>` kullanıcı ve grup ID'lerini doğrulayabilir.

    `-100` ile başlayan negatif Telegram süper grup ID'leri grup sohbet ID'leridir. Bunları `groupAllowFrom` altına değil, `channels.telegram.groups` altına koyun.

  </Step>
</Steps>

<Note>
Token çözümleme sırası hesaba duyarlıdır. Pratikte config değerleri env yedeğine göre önceliklidir ve `TELEGRAM_BOT_TOKEN` yalnızca varsayılan hesaba uygulanır.
</Note>

## Telegram tarafı ayarları

<AccordionGroup>
  <Accordion title="Gizlilik modu ve grup görünürlüğü">
    Telegram botları varsayılan olarak **Gizlilik Modu** kullanır; bu, grupta hangi mesajları alabileceklerini sınırlar.

    Botun tüm grup mesajlarını görmesi gerekiyorsa şunlardan birini yapın:

    - `/setprivacy` ile gizlilik modunu devre dışı bırakın veya
    - botu grup yöneticisi yapın.

    Gizlilik modunu değiştirirken, Telegram'ın değişikliği uygulaması için botu her gruptan kaldırıp yeniden ekleyin.

  </Accordion>

  <Accordion title="Grup izinleri">
    Yönetici durumu Telegram grup ayarlarından kontrol edilir.

    Yönetici botlar tüm grup mesajlarını alır; bu, her zaman açık grup davranışı için kullanışlıdır.

  </Accordion>

  <Accordion title="Yararlı BotFather anahtarları">

    - grup eklemelerine izin vermek/reddetmek için `/setjoingroups`
    - grup görünürlüğü davranışı için `/setprivacy`

  </Accordion>
</AccordionGroup>

## Erişim kontrolü ve etkinleştirme

<Tabs>
  <Tab title="DM ilkesi">
    `channels.telegram.dmPolicy` doğrudan mesaj erişimini kontrol eder:

    - `pairing` (varsayılan)
    - `allowlist` (`allowFrom` içinde en az bir gönderen ID'si gerektirir)
    - `open` (`allowFrom` değerinin `"*"` içermesini gerektirir)
    - `disabled`

    `dmPolicy: "open"` ile `allowFrom: ["*"]`, bot kullanıcı adını bulan veya tahmin eden herhangi bir Telegram hesabının bota komut vermesine izin verir. Bunu yalnızca araçları sıkı şekilde kısıtlanmış, bilerek herkese açık yapılan botlar için kullanın; tek sahipli botlar sayısal kullanıcı ID'leriyle `allowlist` kullanmalıdır.

    `channels.telegram.allowFrom` sayısal Telegram kullanıcı ID'lerini kabul eder. `telegram:` / `tg:` önekleri kabul edilir ve normalleştirilir.
    Çok hesaplı config'lerde, kısıtlayıcı üst düzey `channels.telegram.allowFrom` bir güvenlik sınırı olarak değerlendirilir: hesap düzeyindeki `allowFrom: ["*"]` girdileri, birleştirmeden sonra etkili hesap izin listesi hâlâ açık bir joker karakter içermedikçe o hesabı herkese açık yapmaz.
    Boş `allowFrom` ile `dmPolicy: "allowlist"` tüm DM'leri engeller ve config doğrulaması tarafından reddedilir.
    Kurulum yalnızca sayısal kullanıcı ID'leri ister.
    Yükseltme yaptıysanız ve config'inizde `@username` izin listesi girdileri varsa bunları çözümlemek için `openclaw doctor --fix` çalıştırın (en iyi çaba; Telegram bot token'ı gerektirir).
    Daha önce eşleştirme deposu izin listesi dosyalarına güveniyorsanız `openclaw doctor --fix`, allowlist akışlarında girdileri `channels.telegram.allowFrom` içine kurtarabilir (örneğin `dmPolicy: "allowlist"` henüz açık ID içermediğinde).

    Tek sahipli botlarda, erişim ilkesini önceki eşleştirme onaylarına bağlı kalmak yerine config içinde kalıcı tutmak için açık sayısal `allowFrom` ID'leriyle `dmPolicy: "allowlist"` tercih edin.

    Yaygın karışıklık: DM eşleştirme onayı "bu gönderen her yerde yetkilidir" anlamına gelmez.
    Eşleştirme DM erişimi verir. Henüz komut sahibi yoksa ilk onaylanan eşleştirme, sahipli komutlar ve exec onayları için açık bir operatör hesabı olacak şekilde `commands.ownerAllowFrom` değerini de ayarlar.
    Grup gönderen yetkilendirmesi hâlâ açık config izin listelerinden gelir.
    "Bir kez yetkilendirildim ve hem DM'ler hem grup komutları çalışsın" istiyorsanız sayısal Telegram kullanıcı ID'nizi `channels.telegram.allowFrom` içine koyun; sahipli komutlar için `commands.ownerAllowFrom` değerinin `telegram:<your user id>` içerdiğinden emin olun.

    ### Telegram kullanıcı ID'nizi bulma

    Daha güvenli (üçüncü taraf bot yok):

    1. Botunuza DM gönderin.
    2. `openclaw logs --follow` çalıştırın.
    3. `from.id` değerini okuyun.

    Resmi Bot API yöntemi:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    Üçüncü taraf yöntemi (daha az özel): `@userinfobot` veya `@getidsbot`.

  </Tab>

  <Tab title="Grup ilkesi ve izin listeleri">
    İki kontrol birlikte uygulanır:

    1. **Hangi gruplara izin verilir** (`channels.telegram.groups`)
       - `groups` config'i yok:
         - `groupPolicy: "open"` ile: herhangi bir grup, grup ID denetimlerinden geçebilir
         - `groupPolicy: "allowlist"` (varsayılan) ile: `groups` girdileri (veya `"*"`) ekleyene kadar gruplar engellenir
       - `groups` yapılandırılmış: izin listesi gibi davranır (açık ID'ler veya `"*"`)

    2. **Gruplarda hangi gönderenlere izin verilir** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (varsayılan)
       - `disabled`

    `groupAllowFrom`, grup gönderen filtrelemesi için kullanılır. Ayarlanmamışsa Telegram `allowFrom` değerine geri döner.
    `groupAllowFrom` girdileri sayısal Telegram kullanıcı ID'leri olmalıdır (`telegram:` / `tg:` önekleri normalleştirilir).
    Telegram grup veya süper grup sohbet ID'lerini `groupAllowFrom` içine koymayın. Negatif sohbet ID'leri `channels.telegram.groups` altına aittir.
    Sayısal olmayan girdiler gönderen yetkilendirmesi için yok sayılır.
    Güvenlik sınırı (`2026.2.25+`): grup gönderen kimlik doğrulaması DM eşleştirme deposu onaylarını **devralmaz**.
    Eşleştirme yalnızca DM olarak kalır. Gruplar için `groupAllowFrom` veya grup/konu başına `allowFrom` ayarlayın.
    `groupAllowFrom` ayarlanmamışsa Telegram eşleştirme deposuna değil, config `allowFrom` değerine geri döner.
    Tek sahipli botlar için pratik kalıp: kullanıcı ID'nizi `channels.telegram.allowFrom` içinde ayarlayın, `groupAllowFrom` değerini ayarlamadan bırakın ve hedef gruplara `channels.telegram.groups` altında izin verin.
    Çalışma zamanı notu: `channels.telegram` tamamen eksikse, `channels.defaults.groupPolicy` açıkça ayarlanmadığı sürece çalışma zamanı hata-kapalı `groupPolicy="allowlist"` varsayılanına döner.

    Sahipli grup kurulumu:

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

    Gruptan `@<bot_username> ping` ile test edin. `requireMention: true` iken düz grup mesajları botu tetiklemez.

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

    Örnek: belirli bir grupta yalnızca belirli kullanıcılara izin ver:

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

      - `-1001234567890` gibi negatif Telegram grup veya süper grup sohbet ID'lerini `channels.telegram.groups` altına koyun.
      - İzin verilen bir grup içinde hangi kişilerin botu tetikleyebileceğini sınırlamak istediğinizde `8734062810` gibi Telegram kullanıcı ID'lerini `groupAllowFrom` altına koyun.
      - `groupAllowFrom: ["*"]` değerini yalnızca izin verilen bir grubun herhangi bir üyesinin botla konuşabilmesini istediğinizde kullanın.

    </Warning>

  </Tab>

  <Tab title="Bahsetme davranışı">
    Grup yanıtları varsayılan olarak bahsetme gerektirir.

    Bahsetme şunlardan gelebilir:

    - yerel `@botusername` bahsetmesi veya
    - şunlardaki bahsetme kalıpları:
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

    - bir grup mesajını `@userinfobot` / `@getidsbot`'a iletin
    - veya `openclaw logs --follow` üzerinden `chat.id` değerini okuyun
    - veya Bot API `getUpdates` çıktısını inceleyin
    - gruba izin verildikten sonra, yerel komutlar etkinse `/whoami@<bot_username>` çalıştırın

  </Tab>
</Tabs>

## Çalışma zamanı davranışı

- Telegram, Gateway işlemi tarafından sahiplenilir.
- Yönlendirme deterministiktir: Telegram gelenleri Telegram'a yanıt verir (model kanalları seçmez).
- Gelen mesajlar yanıt meta verileri, medya yer tutucuları ve Gateway'in gözlemlediği Telegram yanıtları için kalıcı yanıt zinciri bağlamıyla paylaşılan kanal zarfına normalleştirilir.
- Grup oturumları grup ID'sine göre izole edilir. Forum konuları, konuları izole tutmak için `:topic:<threadId>` ekler.
- DM mesajları `message_thread_id` taşıyabilir; OpenClaw yanıtlar için iş parçacığı ID'sini korur ancak varsayılan olarak DM'leri düz oturumda tutar. Bilerek DM konu oturumu izolasyonu istediğinizde `channels.telegram.dm.threadReplies: "inbound"`, `channels.telegram.direct.<chatId>.threadReplies: "inbound"`, `requireTopic: true` veya eşleşen bir konu config'i yapılandırın.
- Uzun yoklama, sohbet başına/iş parçacığı başına sıralama ile grammY runner kullanır. Genel runner sink eşzamanlılığı `agents.defaults.maxConcurrent` kullanır.
- Uzun yoklama, her Gateway işleminin içinde korunur; böylece aynı anda yalnızca bir aktif poller bir bot token'ı kullanabilir. Hâlâ `getUpdates` 409 çakışmaları görüyorsanız aynı token'ı başka bir OpenClaw Gateway, betik veya harici poller kullanıyor olabilir.
- Uzun yoklama watchdog yeniden başlatmaları, varsayılan olarak tamamlanmış `getUpdates` canlılığı olmadan 120 saniye sonra tetiklenir. Dağıtımınız uzun süren işler sırasında hâlâ yanlış yoklama durması yeniden başlatmaları görüyorsa `channels.telegram.pollingStallThresholdMs` değerini artırın. Değer milisaniye cinsindendir ve `30000` ile `600000` arasında olabilir; hesap başına geçersiz kılmalar desteklenir.
- Telegram Bot API okundu bilgisi desteğine sahip değildir (`sendReadReceipts` uygulanmaz).

## Özellik başvurusu

<AccordionGroup>
  <Accordion title="Canlı akış önizlemesi (mesaj düzenlemeleri)">
    OpenClaw kısmi yanıtları gerçek zamanlı olarak yayınlayabilir:

    - doğrudan sohbetler: önizleme mesajı + `editMessageText`
    - gruplar/konular: önizleme mesajı + `editMessageText`

    Gereksinim:

    - `channels.telegram.streaming`, `off | partial | block | progress` değerlerinden biridir (varsayılan: `partial`)
    - `progress`, araç ilerlemesi için düzenlenebilir tek bir durum taslağını tutar, tamamlandığında bunu temizler ve nihai yanıtı normal bir mesaj olarak gönderir
    - `streaming.preview.toolProgress`, araç/ilerleme güncellemelerinin aynı düzenlenen önizleme mesajını yeniden kullanıp kullanmayacağını denetler (varsayılan: önizleme akışı etkin olduğunda `true`)
    - `streaming.preview.commandText`, bu araç ilerleme satırlarının içindeki komut/çalıştırma ayrıntısını denetler: `raw` (varsayılan, yayımlanmış davranışı korur) veya `status` (yalnızca araç etiketi)
    - eski `channels.telegram.streamMode` ve boolean `streaming` değerleri algılanır; bunları `channels.telegram.streaming.mode` konumuna taşımak için `openclaw doctor --fix` çalıştırın

    Araç ilerlemesi önizleme güncellemeleri, araçlar çalışırken gösterilen kısa durum satırlarıdır; örneğin komut çalıştırma, dosya okumaları, planlama güncellemeleri veya yama özetleri. Telegram, `v2026.4.22` ve sonrasındaki yayımlanmış OpenClaw davranışıyla eşleşmesi için bunları varsayılan olarak etkin tutar. Yanıt metni için düzenlenen önizlemeyi koruyup araç ilerleme satırlarını gizlemek için şunu ayarlayın:

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

    Nihai yanıtı aynı mesaja düzenlemeden görünür araç ilerlemesi istediğinizde `progress` modunu kullanın. Komut metni politikasını `streaming.progress` altına koyun:

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

    `streaming.mode: "off"` değerini yalnızca sadece nihai teslimat istediğinizde kullanın: Telegram önizleme düzenlemeleri devre dışı bırakılır ve genel araç/ilerleme konuşmaları bağımsız durum mesajları olarak gönderilmek yerine bastırılır. Onay istemleri, medya yükleri ve hatalar yine normal nihai teslimat üzerinden yönlendirilir. Yalnızca araç ilerleme durum satırlarını gizlerken yanıt önizleme düzenlemelerini korumak istediğinizde `streaming.preview.toolProgress: false` kullanın.

    <Note>
      Telegram seçili alıntı yanıtları istisnadır. `replyToMode`, `"first"`, `"all"` veya `"batched"` olduğunda ve gelen mesaj seçili alıntı metni içerdiğinde OpenClaw, yanıt önizlemesini düzenlemek yerine nihai yanıtı Telegram'ın yerel alıntı yanıtlama yolu üzerinden gönderir; bu nedenle `streaming.preview.toolProgress` o tur için kısa durum satırlarını gösteremez. Seçili alıntı metni içermeyen geçerli mesaj yanıtları önizleme akışını korumaya devam eder. Araç ilerlemesi görünürlüğü yerel alıntı yanıtlardan daha önemli olduğunda `replyToMode: "off"` ayarlayın veya bu ödünleşimi kabul etmek için `streaming.preview.toolProgress: false` ayarlayın.
    </Note>

    Yalnızca metin yanıtları için:

    - kısa DM/grup/konu önizlemelerinde: OpenClaw aynı önizleme mesajını korur ve nihai düzenlemeyi yerinde yapar
    - birden fazla Telegram mesajına bölünen uzun nihai metinler, mümkün olduğunda mevcut önizlemeyi ilk nihai parça olarak yeniden kullanır, sonra yalnızca kalan parçaları gönderir
    - ilerleme modu nihai yanıtları, durum taslağını temizler ve taslağı yanıta düzenlemek yerine normal nihai teslimatı kullanır
    - tamamlanan metin doğrulanmadan önce nihai düzenleme başarısız olursa OpenClaw normal nihai teslimatı kullanır ve eski önizlemeyi temizler

    Karmaşık yanıtlar için (örneğin medya yükleri), OpenClaw normal nihai teslimata geri döner ve ardından önizleme mesajını temizler.

    Önizleme akışı, blok akışından ayrıdır. Blok akışı Telegram için açıkça etkinleştirildiğinde OpenClaw çift akışı önlemek için önizleme akışını atlar.

    Yalnızca Telegram'a özel akıl yürütme akışı:

    - `/reasoning stream`, üretim sırasında akıl yürütmeyi canlı önizlemeye gönderir
    - akıl yürütme önizlemesi nihai teslimattan sonra silinir; akıl yürütmenin görünür kalması gerektiğinde `/reasoning on` kullanın
    - nihai yanıt akıl yürütme metni olmadan gönderilir

  </Accordion>

  <Accordion title="Biçimlendirme ve HTML geri dönüşü">
    Giden metin Telegram `parse_mode: "HTML"` kullanır.

    - Markdown benzeri metin, Telegram için güvenli HTML'ye dönüştürülür.
    - Ham model HTML'si, Telegram ayrıştırma hatalarını azaltmak için kaçışlanır.
    - Telegram ayrıştırılmış HTML'yi reddederse OpenClaw düz metin olarak yeniden dener.

    Bağlantı önizlemeleri varsayılan olarak etkindir ve `channels.telegram.linkPreview: false` ile devre dışı bırakılabilir.

  </Accordion>

  <Accordion title="Yerel komutlar ve özel komutlar">
    Telegram komut menüsü kaydı başlangıçta `setMyCommands` ile işlenir.

    Yerel komut varsayılanları:

    - `commands.native: "auto"`, Telegram için yerel komutları etkinleştirir

    Özel komut menüsü girişleri ekleyin:

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

    - özel komutlar yalnızca menü girişleridir; davranışı otomatik olarak uygulamazlar
    - Plugin/skill komutları Telegram menüsünde gösterilmese bile yazıldığında çalışabilir

    Yerel komutlar devre dışı bırakılırsa yerleşik komutlar kaldırılır. Özel/Plugin komutları yapılandırılmışsa yine kaydedilebilir.

    Yaygın kurulum hataları:

    - `BOT_COMMANDS_TOO_MUCH` ile `setMyCommands failed`, kırpmadan sonra Telegram menüsünün hâlâ taştığı anlamına gelir; Plugin/skill/özel komutları azaltın veya `channels.telegram.commands.native` değerini devre dışı bırakın.
    - Doğrudan Bot API curl komutları çalışırken `deleteWebhook`, `deleteMyCommands` veya `setMyCommands` işlemlerinin `404: Not Found` ile başarısız olması, `channels.telegram.apiRoot` değerinin tam `/bot<TOKEN>` uç noktasına ayarlandığı anlamına gelebilir. `apiRoot` yalnızca Bot API kökü olmalıdır ve `openclaw doctor --fix` yanlışlıkla eklenmiş sondaki `/bot<TOKEN>` bölümünü kaldırır.
    - `getMe returned 401`, Telegram'ın yapılandırılmış bot tokenını reddettiği anlamına gelir. `botToken`, `tokenFile` veya `TELEGRAM_BOT_TOKEN` değerini geçerli BotFather tokenıyla güncelleyin; OpenClaw yoklamadan önce durur, bu nedenle bu bir Webhook temizleme hatası olarak raporlanmaz.
    - Ağ/fetch hatalarıyla `setMyCommands failed` genellikle `api.telegram.org` adresine giden DNS/HTTPS trafiğinin engellendiği anlamına gelir.

    ### Cihaz eşleştirme komutları (`device-pair` plugin)

    `device-pair` plugin yüklü olduğunda:

    1. `/pair` kurulum kodu üretir
    2. kodu iOS uygulamasına yapıştırın
    3. `/pair pending` bekleyen istekleri listeler (rol/kapsamlar dahil)
    4. isteği onaylayın:
       - açık onay için `/pair approve <requestId>`
       - yalnızca bir bekleyen istek olduğunda `/pair approve`
       - en yeni istek için `/pair approve latest`

    Kurulum kodu kısa ömürlü bir bootstrap token taşır. Yerleşik bootstrap devir teslimi, birincil Node tokenını `scopes: []` konumunda tutar; devredilen herhangi bir operatör tokenı `operator.approvals`, `operator.read`, `operator.talk.secrets` ve `operator.write` ile sınırlı kalır. Bootstrap kapsam denetimleri rol öneklidir, bu nedenle bu operatör izin listesi yalnızca operatör isteklerini karşılar; operatör olmayan rollerin yine kendi rol önekleri altında kapsamları olması gerekir.

    Bir cihaz değişen kimlik doğrulama ayrıntılarıyla (örneğin rol/kapsamlar/açık anahtar) yeniden denerse önceki bekleyen istek geçersiz kılınır ve yeni istek farklı bir `requestId` kullanır. Onaylamadan önce `/pair pending` komutunu yeniden çalıştırın.

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

    Geri çağrı tıklamaları aracıya metin olarak iletilir:
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

    Not: `edit` ve `topic-create` şu anda varsayılan olarak etkindir ve ayrı `channels.telegram.actions.*` anahtarlarına sahip değildir.
    Çalışma zamanı gönderimleri etkin yapılandırma/gizli bilgiler anlık görüntüsünü (başlangıç/yeniden yükleme) kullanır, bu nedenle eylem yolları her gönderim için geçici SecretRef yeniden çözümlemesi yapmaz.

    Tepki kaldırma semantiği: [/tools/reactions](/tr/tools/reactions)

  </Accordion>

  <Accordion title="Yanıt iş parçacığı etiketleri">
    Telegram, oluşturulan çıktıda açık yanıt iş parçacığı etiketlerini destekler:

    - `[[reply_to_current]]` tetikleyen mesaja yanıt verir
    - `[[reply_to:<id>]]` belirli bir Telegram mesaj kimliğine yanıt verir

    `channels.telegram.replyToMode` işlemeyi denetler:

    - `off` (varsayılan)
    - `first`
    - `all`

    Yanıt iş parçacığı etkinleştirildiğinde ve özgün Telegram metni veya açıklaması kullanılabilir olduğunda OpenClaw otomatik olarak yerel bir Telegram alıntı bölümü ekler. Telegram, yerel alıntı metnini 1024 UTF-16 kod birimiyle sınırlar; bu nedenle daha uzun mesajlar baştan alıntılanır ve Telegram alıntıyı reddederse düz yanıta geri döner.

    Not: `off`, örtük yanıt iş parçacığını devre dışı bırakır. Açık `[[reply_to_*]]` etiketleri yine de uygulanır.

  </Accordion>

  <Accordion title="Forum konuları ve iş parçacığı davranışı">
    Forum süper grupları:

    - konu oturumu anahtarları `:topic:<threadId>` ekler
    - yanıtlar ve yazıyor eylemi konu iş parçacığını hedefler
    - konu yapılandırma yolu:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Genel konu (`threadId=1`) özel durumu:

    - mesaj gönderimleri `message_thread_id` değerini atlar (Telegram `sendMessage(...thread_id=1)` çağrısını reddeder)
    - yazıyor eylemleri yine `message_thread_id` içerir

    Konu kalıtımı: konu girişleri, geçersiz kılınmadıkça grup ayarlarını devralır (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
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

    **Kalıcı ACP konu bağlaması**: Forum konuları, üst düzey tipli ACP bağlamaları aracılığıyla ACP harness oturumlarını sabitleyebilir (`type: "acp"` ve `match.channel: "telegram"`, `peer.kind: "group"` içeren `bindings[]` ve `-1001234567890:topic:42` gibi konu nitelikli bir id). Şu anda grup/süpergruplardaki forum konularıyla sınırlıdır. Bkz. [ACP Agents](/tr/tools/acp-agents).

    **Sohbetten iş parçacığına bağlı ACP başlatma**: `/acp spawn <agent> --thread here|auto`, geçerli konuyu yeni bir ACP oturumuna bağlar; takip mesajları doğrudan oraya yönlendirilir. OpenClaw başlatma onayını konu içinde sabitler. `channels.telegram.threadBindings.spawnSessions` ayarının etkin kalmasını gerektirir (varsayılan: `true`).

    Şablon bağlamı `MessageThreadId` ve `IsForum` değerlerini sunar. `message_thread_id` içeren DM sohbetleri varsayılan olarak düz oturumlarda DM yönlendirmesini ve yanıt meta verilerini korur; iş parçacığı duyarlı oturum anahtarlarını yalnızca `threadReplies: "inbound"`, `threadReplies: "always"`, `requireTopic: true` ya da eşleşen bir konu yapılandırmasıyla ayarlandığında kullanırlar. Hesap varsayılanı için üst düzey `channels.telegram.dm.threadReplies` ayarını veya tek bir DM için `direct.<chatId>.threadReplies` ayarını kullanın.

  </Accordion>

  <Accordion title="Ses, video ve çıkartmalar">
    ### Sesli mesajlar

    Telegram, ses notlarını ses dosyalarından ayırır.

    - varsayılan: ses dosyası davranışı
    - ses notu gönderimini zorlamak için aracı yanıtında `[[audio_as_voice]]` etiketi
    - gelen ses notu dökümleri aracı bağlamında makine tarafından oluşturulmuş,
      güvenilmeyen metin olarak çerçevelenir; bahsetme algılama yine de ham
      dökümü kullanır, bu nedenle bahsetme kapılı sesli mesajlar çalışmaya devam eder.

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

    Tekrarlanan görüntü çağrılarını azaltmak için çıkartmalar bir kez (mümkün olduğunda) açıklanır ve önbelleğe alınır.

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

    Etkinleştirildiğinde OpenClaw şuna benzer sistem olaylarını kuyruğa alır:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Yapılandırma:

    - `channels.telegram.reactionNotifications`: `off | own | all` (varsayılan: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (varsayılan: `minimal`)

    Notlar:

    - `own`, yalnızca bot tarafından gönderilen mesajlara kullanıcı tepkileri anlamına gelir (gönderilen mesaj önbelleği üzerinden en iyi çabayla).
    - Tepki olayları Telegram erişim denetimlerine (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`) uymaya devam eder; yetkisiz gönderenler düşürülür.
    - Telegram, tepki güncellemelerinde iş parçacığı kimlikleri sağlamaz.
      - forum dışı gruplar grup sohbeti oturumuna yönlendirilir
      - forum grupları, tam kaynak konuya değil grup genel konu oturumuna (`:topic:1`) yönlendirilir

    Yoklama/webhook için `allowed_updates`, `message_reaction` değerini otomatik olarak içerir.

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

  <Accordion title="Telegram olayları ve komutlarından yapılandırma yazmaları">
    Kanal yapılandırma yazmaları varsayılan olarak etkindir (`configWrites !== false`).

    Telegram tarafından tetiklenen yazmalar şunları içerir:

    - `channels.telegram.groups` güncellemesi için grup taşıma olayları (`migrate_to_chat_id`)
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

  <Accordion title="Uzun yoklama ve webhook karşılaştırması">
    Varsayılan uzun yoklamadır. Webhook modu için `channels.telegram.webhookUrl` ve `channels.telegram.webhookSecret` ayarlarını belirleyin; isteğe bağlı `webhookPath`, `webhookHost`, `webhookPort` (varsayılanlar `/telegram-webhook`, `127.0.0.1`, `8787`).

    Uzun yoklama modunda OpenClaw, yeniden başlatma watermark değerini yalnızca bir güncelleme başarıyla dağıtıldıktan sonra kalıcı hale getirir. Bir işleyici başarısız olursa bu güncelleme aynı süreçte yeniden denenebilir kalır ve yeniden başlatma tekilleştirmesi için tamamlandı olarak yazılmaz.

    Yerel dinleyici `127.0.0.1:8787` adresine bağlanır. Genel giriş için yerel bağlantı noktasının önüne bir ters proxy koyun veya bilinçli olarak `webhookHost: "0.0.0.0"` ayarını belirleyin.

    Webhook modu, Telegram’a `200` döndürmeden önce istek korumalarını, Telegram gizli belirtecini ve JSON gövdesini doğrular.
    OpenClaw ardından güncellemeyi uzun yoklamada kullanılan aynı sohbet başına/konu başına bot yolları üzerinden eşzamansız olarak işler; böylece yavaş aracı dönüşleri Telegram’ın teslim ACK değerini bekletmez.

  </Accordion>

  <Accordion title="Sınırlar, yeniden deneme ve CLI hedefleri">
    - `channels.telegram.textChunkLimit` varsayılan olarak 4000’dir.
    - `channels.telegram.chunkMode="newline"`, uzunluğa göre bölmeden önce paragraf sınırlarını (boş satırlar) tercih eder.
    - `channels.telegram.mediaMaxMb` (varsayılan 100), gelen ve giden Telegram medya boyutunu sınırlar.
    - `channels.telegram.mediaGroupFlushMs` (varsayılan 500), Telegram albümlerinin/medya gruplarının OpenClaw bunları tek bir gelen mesaj olarak dağıtmadan önce ne kadar süre tamponlanacağını denetler. Albüm parçaları geç geliyorsa artırın; albüm yanıt gecikmesini azaltmak için düşürün.
    - `channels.telegram.timeoutSeconds`, Telegram API istemcisi zaman aşımını geçersiz kılar (ayarlanmazsa grammY varsayılanı uygulanır). Bot istemcileri, yapılandırılan değerleri 60 saniyelik giden metin/yazıyor isteği korumasının altına sınırlar; böylece grammY, OpenClaw’ın taşıma koruması ve yedeği çalışmadan önce görünür yanıt teslimini sonlandırmaz. Uzun yoklama yine de 45 saniyelik `getUpdates` isteği korumasını kullanır; böylece boşta kalan yoklamalar süresiz olarak terk edilmez.
    - `channels.telegram.pollingStallThresholdMs` varsayılan olarak `120000` değerindedir; yalnızca yanlış pozitif yoklama takılması yeniden başlatmaları için `30000` ile `600000` arasında ayarlayın.
    - grup bağlam geçmişi `channels.telegram.historyLimit` veya `messages.groupChat.historyLimit` kullanır (varsayılan 50); `0` devre dışı bırakır.
    - gateway üst mesajları gözlemlediğinde yanıt/alıntı/iletme ek bağlamı seçili tek bir konuşma bağlam penceresine normalleştirilir; gözlemlenen mesaj önbelleği oturum deposunun yanında kalıcı hale getirilir. Telegram güncellemelerde yalnızca sığ bir `reply_to_message` içerir, bu nedenle önbellekten daha eski zincirler Telegram’ın geçerli güncelleme yüküyle sınırlıdır.
    - Telegram izin listeleri öncelikle tam bir ek bağlam redaksiyon sınırı değil, aracıyı kimin tetikleyebileceğini denetler.
    - DM geçmişi denetimleri:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - `channels.telegram.retry` yapılandırması, kurtarılabilir giden API hataları için Telegram gönderme yardımcılarına (CLI/araçlar/eylemler) uygulanır. Gelen son yanıt teslimi de Telegram ön bağlantı hataları için sınırlı bir güvenli gönderim yeniden denemesi kullanır, ancak görünür mesajları çoğaltabilecek belirsiz gönderim sonrası ağ zarflarını yeniden denemez.

    CLI ve mesaj aracı gönderim hedefleri sayısal sohbet kimliği, kullanıcı adı veya bir forum konu hedefi olabilir:

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

    Yalnızca Telegram’a özgü yoklama bayrakları:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - forum konuları için `--thread-id` (veya bir `:topic:` hedefi kullanın)

    Telegram gönderimi ayrıca şunları destekler:

    - `channels.telegram.capabilities.inlineButtons` izin verdiğinde satır içi klavyeler için `buttons` bloklarıyla `--presentation`
    - botun ilgili sohbette sabitleyebilmesi durumunda sabitlenmiş teslim istemek için `--pin` veya `--delivery '{"pin":true}'`
    - giden görselleri, GIF’leri ve videoları sıkıştırılmış fotoğraf, animasyonlu medya veya video yüklemeleri yerine belge olarak göndermek için `--force-document`

    Eylem kapılama:

    - `channels.telegram.actions.sendMessage=false`, yoklamalar dahil giden Telegram mesajlarını devre dışı bırakır
    - `channels.telegram.actions.poll=false`, düzenli gönderimleri etkin bırakırken Telegram yoklaması oluşturmayı devre dışı bırakır

  </Accordion>

  <Accordion title="Telegram’da exec onayları">
    Telegram, onaylayıcı DM’lerinde exec onaylarını destekler ve isteğe bağlı olarak kaynak sohbete veya konuya istem gönderebilir. Onaylayıcılar sayısal Telegram kullanıcı kimlikleri olmalıdır.

    Yapılandırma yolu:

    - `channels.telegram.execApprovals.enabled` (en az bir onaylayıcı çözümlenebilir olduğunda otomatik etkinleşir)
    - `channels.telegram.execApprovals.approvers` (`commands.ownerAllowFrom` içindeki sayısal sahip kimliklerine geri döner)
    - `channels.telegram.execApprovals.target`: `dm` (varsayılan) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` ve `defaultTo`, botla kimin konuşabileceğini ve normal yanıtları nereye göndereceğini denetler. Birini exec onaylayıcısı yapmazlar. Henüz komut sahibi yoksa ilk onaylanan DM eşleşmesi `commands.ownerAllowFrom` değerini başlatır; böylece tek sahipli kurulum, `execApprovals.approvers` altında kimlikleri yinelemeden çalışmaya devam eder.

    Kanal teslimi komut metnini sohbette gösterir; `channel` veya `both` ayarını yalnızca güvenilir gruplarda/konularda etkinleştirin. İstem bir forum konusuna geldiğinde OpenClaw, onay istemi ve takip mesajı için konuyu korur. Exec onayları varsayılan olarak 30 dakika sonra sona erer.

    Satır içi onay düğmeleri ayrıca `channels.telegram.capabilities.inlineButtons` ayarının hedef yüzeye (`dm`, `group` veya `all`) izin vermesini gerektirir. `plugin:` önekiyle başlayan onay kimlikleri Plugin onayları üzerinden çözümlenir; diğerleri önce exec onayları üzerinden çözümlenir.

    Bkz. [Exec approvals](/tr/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Hata yanıtı kontrolleri

Aracı bir teslim veya sağlayıcı hatasıyla karşılaştığında, Telegram hata metniyle yanıt verebilir ya da bunu bastırabilir. Bu davranışı iki yapılandırma anahtarı denetler:

| Anahtar                             | Değerler          | Varsayılan | Açıklama                                                                                                      |
| ----------------------------------- | ----------------- | ---------- | ------------------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply`    | `reply` sohbete kullanıcı dostu bir hata iletisi gönderir. `silent` hata yanıtlarını tamamen bastırır.        |
| `channels.telegram.errorCooldownMs` | sayı (ms)         | `60000`    | Aynı sohbete gönderilen hata yanıtları arasındaki minimum süre. Kesintiler sırasında hata spam'ini önler.     |

Hesap, grup ve konu bazında geçersiz kılmalar desteklenir (diğer Telegram yapılandırma anahtarlarıyla aynı kalıtım).

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
      - BotFather: `/setprivacy` -> Disable
      - ardından botu gruptan kaldırıp yeniden ekleyin
    - `openclaw channels status`, yapılandırma bahsedilmeyen grup iletileri beklediğinde uyarır.
    - `openclaw channels status --probe` açık sayısal grup kimliklerini denetleyebilir; joker karakter `"*"` için üyelik yoklaması yapılamaz.
    - hızlı oturum testi: `/activation always`.

  </Accordion>

  <Accordion title="Bot not seeing group messages at all">

    - `channels.telegram.groups` mevcut olduğunda, grup listelenmiş olmalıdır (veya `"*"` içermelidir)
    - botun gruptaki üyeliğini doğrulayın
    - atlama nedenleri için günlükleri inceleyin: `openclaw logs --follow`

  </Accordion>

  <Accordion title="Commands work partially or not at all">

    - gönderici kimliğinizi yetkilendirin (eşleme ve/veya sayısal `allowFrom`)
    - grup ilkesi `open` olsa bile komut yetkilendirmesi hâlâ uygulanır
    - `BOT_COMMANDS_TOO_MUCH` ile `setMyCommands failed`, yerel menüde çok fazla girdi olduğu anlamına gelir; plugin/skill/özel komutları azaltın veya yerel menüleri devre dışı bırakın
    - `deleteMyCommands` / `setMyCommands` başlangıç çağrıları ve `sendChatAction` yazıyor çağrıları sınırlandırılmıştır ve istek zaman aşımında Telegram'ın taşıma yedeği üzerinden bir kez yeniden denenir. Kalıcı ağ/fetch hataları genellikle `api.telegram.org` için DNS/HTTPS erişilebilirliği sorunlarını gösterir

  </Accordion>

  <Accordion title="Startup reports unauthorized token">

    - `getMe returned 401`, yapılandırılmış bot belirteci için bir Telegram kimlik doğrulama hatasıdır.
    - Bot belirtecini BotFather'da yeniden kopyalayın veya yeniden oluşturun, ardından varsayılan hesap için `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken` veya `TELEGRAM_BOT_TOKEN` değerini güncelleyin.
    - Başlangıç sırasında `deleteWebhook 401 Unauthorized` da bir kimlik doğrulama hatasıdır; bunu "webhook yok" olarak ele almak, aynı hatalı belirteç hatasını yalnızca sonraki API çağrılarına ertelemiş olur.

  </Accordion>

  <Accordion title="Polling or network instability">

    - Node 22+ + özel fetch/proxy, AbortSignal türleri uyuşmazsa anında iptal davranışını tetikleyebilir.
    - Bazı ana makineler `api.telegram.org` adresini önce IPv6'ya çözer; bozuk IPv6 çıkışı aralıklı Telegram API hatalarına neden olabilir.
    - Günlüklerde `TypeError: fetch failed` veya `Network request for 'getUpdates' failed!` varsa, OpenClaw artık bunları kurtarılabilir ağ hataları olarak yeniden dener.
    - Yoklama başlangıcı sırasında OpenClaw, çalıştırıcının ilk `getUpdates` öncesinde ikinci bir `getMe` çağrısına ihtiyaç duymaması için başarılı başlangıç `getMe` yoklamasını grammY için yeniden kullanır.
    - Yoklama başlangıcı sırasında `deleteWebhook` geçici bir ağ hatasıyla başarısız olursa, OpenClaw başka bir yoklama öncesi kontrol düzlemi çağrısı yapmak yerine long polling'e devam eder. Hâlâ etkin olan webhook, `getUpdates` çakışması olarak görünür; OpenClaw ardından Telegram taşımasını yeniden oluşturur ve webhook temizliğini yeniden dener.
    - Telegram soketleri kısa ve sabit bir aralıkla geri dönüştürülüyorsa, düşük bir `channels.telegram.timeoutSeconds` değeri olup olmadığını denetleyin; bot istemcileri, giden ve `getUpdates` istek korumalarının altındaki yapılandırılmış değerleri sınırlar, ancak eski sürümler bu değer bu korumaların altında ayarlandığında her yoklamayı veya yanıtı iptal edebilirdi.
    - Günlüklerde `Polling stall detected` varsa, OpenClaw varsayılan olarak tamamlanmış long-poll canlılığı olmadan 120 saniye geçtikten sonra yoklamayı yeniden başlatır ve Telegram taşımasını yeniden oluşturur.
    - `openclaw channels status --probe` ve `openclaw doctor`, çalışan bir yoklama hesabı başlangıç ödemesinden sonra `getUpdates` tamamlamadığında, çalışan bir webhook hesabı başlangıç ödemesinden sonra `setWebhook` tamamlamadığında veya son başarılı yoklama taşıma etkinliği bayatladığında uyarır.
    - `channels.telegram.pollingStallThresholdMs` değerini yalnızca uzun süren `getUpdates` çağrıları sağlıklı olduğu hâlde ana makineniz yanlış yoklama-duraklama yeniden başlatmaları bildiriyorsa artırın. Kalıcı duraklamalar genellikle ana makine ile `api.telegram.org` arasındaki proxy, DNS, IPv6 veya TLS çıkış sorunlarına işaret eder.
    - Telegram ayrıca Bot API taşıması için süreç proxy ortam değişkenlerini de dikkate alır; buna `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` ve bunların küçük harfli varyantları dahildir. `NO_PROXY` / `no_proxy` yine de `api.telegram.org` için atlama sağlayabilir.
    - OpenClaw yönetimli proxy bir hizmet ortamı için `OPENCLAW_PROXY_URL` üzerinden yapılandırılmışsa ve standart proxy ortam değişkeni yoksa, Telegram bu URL'yi Bot API taşıması için de kullanır.
    - Kararsız doğrudan çıkış/TLS olan VPS ana makinelerinde, Telegram API çağrılarını `channels.telegram.proxy` üzerinden yönlendirin:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ varsayılan olarak `autoSelectFamily=true` kullanır (WSL2 hariç). Telegram DNS sonuç sırası önce `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`, sonra `channels.telegram.network.dnsResultOrder`, ardından `NODE_OPTIONS=--dns-result-order=ipv4first` gibi süreç varsayılanını dikkate alır; hiçbiri geçerli değilse Node 22+ `ipv4first` değerine geri döner.
    - Ana makineniz WSL2 ise veya açıkça yalnızca IPv4 davranışıyla daha iyi çalışıyorsa, aile seçimini zorlayın:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - RFC 2544 kıyaslama aralığı yanıtlarına (`198.18.0.0/15`) Telegram medya indirmeleri için varsayılan olarak zaten izin verilir. Güvenilir bir fake-IP veya şeffaf proxy, medya indirmeleri sırasında `api.telegram.org` adresini başka bir özel/dahili/özel-kullanım adresine yeniden yazıyorsa, yalnızca Telegram için geçerli atlamayı etkinleştirebilirsiniz:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - Aynı etkinleştirme hesap bazında
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork` altında da kullanılabilir.
    - Proxy'niz Telegram medya ana makinelerini `198.18.x.x` içine çözüyorsa, önce tehlikeli bayrağı kapalı bırakın. Telegram medyası RFC 2544 kıyaslama aralığına varsayılan olarak zaten izin verir.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork`, Telegram
      medya SSRF korumalarını zayıflatır. Bunu yalnızca Clash, Mihomo veya Surge fake-IP yönlendirmesi gibi, RFC 2544 kıyaslama aralığı dışında özel ya da özel-kullanım yanıtları ürettikleri güvenilir operatör denetimli proxy ortamları için kullanın. Normal herkese açık internet Telegram erişimi için kapalı bırakın.
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

- başlangıç/kimlik doğrulama: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` normal bir dosyaya işaret etmelidir; sembolik bağlantılar reddedilir)
- erişim denetimi: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, üst düzey `bindings[]` (`type: "acp"`)
- yürütme onayları: `execApprovals`, `accounts.*.execApprovals`
- komut/menü: `commands.native`, `commands.nativeSkills`, `customCommands`
- ileti dizileri/yanıtlar: `replyToMode`, `dm.threadReplies`, `direct.*.threadReplies`
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
Çok hesaplı öncelik: iki veya daha fazla hesap kimliği yapılandırıldığında, varsayılan yönlendirmeyi açık hâle getirmek için `channels.telegram.defaultAccount` ayarlayın (veya `channels.telegram.accounts.default` ekleyin). Aksi takdirde OpenClaw ilk normalize edilmiş hesap kimliğine geri döner ve `openclaw doctor` uyarır. Adlandırılmış hesaplar `channels.telegram.allowFrom` / `groupAllowFrom` değerlerini devralır, ancak `accounts.default.*` değerlerini devralmaz.
</Note>

## İlgili

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/tr/channels/pairing">
    Bir Telegram kullanıcısını Gateway ile eşleyin.
  </Card>
  <Card title="Groups" icon="users" href="/tr/channels/groups">
    Grup ve konu izin listesi davranışı.
  </Card>
  <Card title="Channel routing" icon="route" href="/tr/channels/channel-routing">
    Gelen iletileri aracılara yönlendirin.
  </Card>
  <Card title="Security" icon="shield" href="/tr/gateway/security">
    Tehdit modeli ve sertleştirme.
  </Card>
  <Card title="Multi-agent routing" icon="sitemap" href="/tr/concepts/multi-agent">
    Grupları ve konuları aracılarla eşleyin.
  </Card>
  <Card title="Troubleshooting" icon="wrench" href="/tr/channels/troubleshooting">
    Kanallar arası tanılama.
  </Card>
</CardGroup>
