---
read_when:
    - Telegram özellikleri veya webhook’lar üzerinde çalışma
summary: Telegram bot destek durumu, yetenekleri ve yapılandırması
title: Telegram
x-i18n:
    generated_at: "2026-07-01T20:32:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 541ce276cf045b19461167513d86e2dd9a5bb8ff95bcb9e55f10440e2e66a165
    source_path: channels/telegram.md
    workflow: 16
---

Bot DM'leri ve grupları için grammY üzerinden üretime hazırdır. Varsayılan mod uzun yoklamadır; webhook modu isteğe bağlıdır.

<CardGroup cols={3}>
  <Card title="Eşleştirme" icon="link" href="/tr/channels/pairing">
    Telegram için varsayılan DM ilkesi eşleştirmedir.
  </Card>
  <Card title="Kanal sorun giderme" icon="wrench" href="/tr/channels/troubleshooting">
    Kanallar arası tanılama ve onarım oyun kitapları.
  </Card>
  <Card title="Gateway yapılandırması" icon="settings" href="/tr/gateway/configuration">
    Tam kanal yapılandırma kalıpları ve örnekleri.
  </Card>
</CardGroup>

## Hızlı kurulum

<Steps>
  <Step title="BotFather içinde bot token'ını oluşturun">
    Telegram'ı açın ve **@BotFather** ile sohbet edin (tanıtıcının tam olarak `@BotFather` olduğunu doğrulayın).

    `/newbot` çalıştırın, istemleri izleyin ve token'ı kaydedin.

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

    Ortam geri dönüşü: `TELEGRAM_BOT_TOKEN=...` (yalnızca varsayılan hesap).
    Telegram `openclaw channels login telegram` kullanmaz; token'ı config/env içinde yapılandırın, ardından gateway'i başlatın.

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
    Botu grubunuza ekleyin, ardından grup erişimi için gereken iki ID'yi de alın:

    - `allowFrom` / `groupAllowFrom` içinde kullanılan Telegram kullanıcı ID'niz
    - `channels.telegram.groups` altında anahtar olarak kullanılan Telegram grup sohbet ID'si

    İlk kurulum için grup sohbet ID'sini `openclaw logs --follow`, iletilmiş ID botu veya Bot API `getUpdates` üzerinden alın. Grup izin verildikten sonra `/whoami@<bot_username>` kullanıcı ve grup ID'lerini doğrulayabilir.

    `-100` ile başlayan negatif Telegram süper grup ID'leri grup sohbet ID'leridir. Bunları `groupAllowFrom` altına değil, `channels.telegram.groups` altına koyun.

  </Step>
</Steps>

<Note>
Token çözümleme sırası hesap farkındadır. Pratikte config değerleri ortam geri dönüşüne göre önceliklidir ve `TELEGRAM_BOT_TOKEN` yalnızca varsayılan hesap için geçerlidir.
Başarılı bir başlangıçtan sonra OpenClaw, yeniden başlatmaların ek bir Telegram `getMe` çağrısından kaçınabilmesi için bot kimliğini state dizininde en fazla 24 saat önbelleğe alır; token'ın değiştirilmesi veya kaldırılması bu önbelleği temizler.
</Note>

## Telegram tarafı ayarları

<AccordionGroup>
  <Accordion title="Gizlilik modu ve grup görünürlüğü">
    Telegram botları varsayılan olarak **Privacy Mode** kullanır; bu, gruplarda hangi mesajları alabileceklerini sınırlar.

    Botun tüm grup mesajlarını görmesi gerekiyorsa şunlardan birini yapın:

    - `/setprivacy` ile gizlilik modunu devre dışı bırakın veya
    - botu grup yöneticisi yapın.

    Gizlilik modunu değiştirirken, Telegram'ın değişikliği uygulaması için botu her gruptan kaldırıp yeniden ekleyin.

  </Accordion>

  <Accordion title="Grup izinleri">
    Yönetici durumu Telegram grup ayarlarında denetlenir.

    Yönetici botlar tüm grup mesajlarını alır; bu, her zaman açık grup davranışı için kullanışlıdır.

  </Accordion>

  <Accordion title="Yararlı BotFather anahtarları">

    - grup eklemelerine izin vermek/reddetmek için `/setjoingroups`
    - grup görünürlüğü davranışı için `/setprivacy`

  </Accordion>
</AccordionGroup>

## Erişim denetimi ve etkinleştirme

### Grup bot kimliği

Telegram gruplarında ve forum konularında, yapılandırılmış bot tanıtıcısının açıkça anılması (örneğin `@my_bot`), ajan persona adı Telegram kullanıcı adından farklı olsa bile seçili OpenClaw ajanına hitap etmek olarak değerlendirilir. Grup sessizlik ilkesi ilgisiz grup trafiği için yine geçerlidir, ancak bot tanıtıcısının kendisi "başka biri" sayılmaz.

<Tabs>
  <Tab title="DM ilkesi">
    `channels.telegram.dmPolicy` doğrudan mesaj erişimini denetler:

    - `pairing` (varsayılan)
    - `allowlist` (`allowFrom` içinde en az bir gönderici ID'si gerektirir)
    - `open` (`allowFrom` değerinin `"*"` içermesini gerektirir)
    - `disabled`

    `allowFrom: ["*"]` ile `dmPolicy: "open"`, bot kullanıcı adını bulan veya tahmin eden herhangi bir Telegram hesabının bota komut vermesine izin verir. Bunu yalnızca araçları sıkı biçimde kısıtlanmış, kasıtlı olarak herkese açık botlar için kullanın; tek sahipli botlar sayısal kullanıcı ID'leriyle `allowlist` kullanmalıdır.

    `channels.telegram.allowFrom` sayısal Telegram kullanıcı ID'lerini kabul eder. `telegram:` / `tg:` önekleri kabul edilir ve normalleştirilir.
    Çok hesaplı config'lerde, kısıtlayıcı üst düzey `channels.telegram.allowFrom` bir güvenlik sınırı olarak ele alınır: hesap düzeyindeki `allowFrom: ["*"]` girdileri, etkili hesap allowlist'i birleştirmeden sonra hâlâ açık bir joker karakter içermediği sürece o hesabı herkese açık yapmaz.
    Boş `allowFrom` ile `dmPolicy: "allowlist"` tüm DM'leri engeller ve config doğrulaması tarafından reddedilir.
    Kurulum yalnızca sayısal kullanıcı ID'leri ister.
    Yükseltme yaptıysanız ve config'iniz `@username` allowlist girdileri içeriyorsa, bunları çözümlemek için `openclaw doctor --fix` çalıştırın (en iyi çaba; Telegram bot token'ı gerektirir).
    Daha önce eşleştirme deposu allowlist dosyalarına güveniyorsanız, `openclaw doctor --fix` allowlist akışlarında girdileri `channels.telegram.allowFrom` içine kurtarabilir (örneğin `dmPolicy: "allowlist"` henüz açık ID içermiyorsa).

    Tek sahipli botlarda, erişim ilkesini önceki eşleştirme onaylarına bağlı kalmak yerine config içinde kalıcı tutmak için açık sayısal `allowFrom` ID'leriyle `dmPolicy: "allowlist"` tercih edin.

    Yaygın karışıklık: DM eşleştirme onayı "bu gönderici her yerde yetkilidir" anlamına gelmez.
    Eşleştirme DM erişimi verir. Henüz komut sahibi yoksa, ilk onaylanan eşleştirme ayrıca `commands.ownerAllowFrom` ayarını yapar; böylece yalnızca sahip komutları ve exec onayları için açık bir operatör hesabı olur.
    Grup gönderici yetkilendirmesi yine açık config allowlist'lerinden gelir.
    "Bir kez yetkiliyim ve hem DM'ler hem de grup komutları çalışsın" istiyorsanız, sayısal Telegram kullanıcı ID'nizi `channels.telegram.allowFrom` içine koyun; yalnızca sahip komutları için `commands.ownerAllowFrom` değerinin `telegram:<your user id>` içerdiğinden emin olun.

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

  <Tab title="Grup ilkesi ve allowlist'ler">
    İki denetim birlikte uygulanır:

    1. **Hangi gruplara izin verilir** (`channels.telegram.groups`)
       - `groups` config'i yok:
         - `groupPolicy: "open"` ile: herhangi bir grup grup ID denetimlerinden geçebilir
         - `groupPolicy: "allowlist"` (varsayılan) ile: `groups` girdileri (veya `"*"`) eklenene kadar gruplar engellenir
       - `groups` yapılandırılmış: allowlist gibi davranır (açık ID'ler veya `"*"`)

    2. **Gruplarda hangi göndericilere izin verilir** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (varsayılan)
       - `disabled`

    `groupAllowFrom` grup gönderici filtrelemesi için kullanılır. Ayarlanmazsa Telegram `allowFrom` değerine geri döner.
    `groupAllowFrom` girdileri sayısal Telegram kullanıcı ID'leri olmalıdır (`telegram:` / `tg:` önekleri normalleştirilir).
    Telegram grup veya süper grup sohbet ID'lerini `groupAllowFrom` içine koymayın. Negatif sohbet ID'leri `channels.telegram.groups` altına aittir.
    Sayısal olmayan girdiler gönderici yetkilendirmesi için yok sayılır.
    Güvenlik sınırı (`2026.2.25+`): grup gönderici kimlik doğrulaması DM eşleştirme deposu onaylarını **devralmaz**.
    Eşleştirme yalnızca DM için kalır. Gruplar için `groupAllowFrom` veya grup/konu başına `allowFrom` ayarlayın.
    `groupAllowFrom` ayarlanmamışsa, Telegram eşleştirme deposuna değil config `allowFrom` değerine geri döner.
    Tek sahipli botlar için pratik kalıp: kullanıcı ID'nizi `channels.telegram.allowFrom` içine ayarlayın, `groupAllowFrom` değerini ayarlanmamış bırakın ve hedef gruplara `channels.telegram.groups` altında izin verin.
    Çalışma zamanı notu: `channels.telegram` tamamen eksikse, `channels.defaults.groupPolicy` açıkça ayarlanmadığı sürece çalışma zamanı fail-closed `groupPolicy="allowlist"` varsayılanına döner.

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

    Gruptan `@<bot_username> ping` ile test edin. `requireMention: true` iken düz grup mesajları botu tetiklemez.

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

  <Tab title="Anma davranışı">
    Grup yanıtları varsayılan olarak anma gerektirir.

    Anma şunlardan gelebilir:

    - yerel `@botusername` anması veya
    - şuradaki anma kalıpları:
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

    Grup geçmişi bağlamı varsayılan olarak `mention-only` olur: önceki grup mesajları
    yalnızca bota hitap etmişse, bota yanıtsa
    veya botun kendi mesajlarıysa dahil edilir. Güvenilen gruplar için yakın oda geçmişini
    dahil etmek üzere `includeGroupHistoryContext: "recent"` ayarlayın.
    Sonraki turla birlikte önceki Telegram grup geçmişi göndermemek için
    `includeGroupHistoryContext: "none"` ayarlayın.

```json5
{
  channels: {
    telegram: {
      includeGroupHistoryContext: "recent",
    },
  },
}
```

    Grup sohbet ID'sini alma:

    - bir grup mesajını `@userinfobot` / `@getidsbot` adresine iletin
    - veya `openclaw logs --follow` içinden `chat.id` değerini okuyun
    - veya Bot API `getUpdates` çıktısını inceleyin
    - grup izin verildikten sonra, yerel komutlar etkinse `/whoami@<bot_username>` çalıştırın

  </Tab>
</Tabs>

## Çalışma zamanı davranışı

- Telegram, Gateway işleminin sahipliğindedir.
- Yönlendirme deterministiktir: Telegram gelen iletileri Telegram'a yanıtlanır (model kanalları seçmez).
- Gelen iletiler, yanıt meta verileri, medya yer tutucuları ve Gateway'in gözlemlediği Telegram yanıtları için kalıcı yanıt zinciri bağlamıyla paylaşılan kanal zarfına normalleştirilir.
- Grup oturumları grup kimliğine göre yalıtılır. Forum konuları, konuları yalıtılmış tutmak için `:topic:<threadId>` ekler.
- DM iletileri `message_thread_id` taşıyabilir; OpenClaw bunu yanıtlar için korur. DM konu oturumları yalnızca Telegram `getMe` bot için `has_topics_enabled: true` bildirdiğinde ayrılır; aksi halde DM'ler düz oturumda kalır.
- Uzun yoklama, sohbet başına/iş parçacığı başına sıralamayla grammY runner kullanır. Genel runner alıcı eşzamanlılığı `agents.defaults.maxConcurrent` kullanır.
- Çok hesaplı başlangıç, büyük bot filolarının her hesap yoklamasını aynı anda yaymaması için eşzamanlı Telegram `getMe` yoklamalarını sınırlar.
- Uzun yoklama her Gateway işlemi içinde korunur; böylece bir bot token'ını aynı anda yalnızca bir etkin yoklayıcı kullanabilir. Hâlâ `getUpdates` 409 çakışmaları görüyorsanız, aynı token'ı büyük olasılıkla başka bir OpenClaw Gateway'i, betiği veya harici yoklayıcı kullanıyordur.
- Uzun yoklama bekçi yeniden başlatmaları, varsayılan olarak tamamlanmış `getUpdates` canlılığı olmadan 120 saniye sonra tetiklenir. `channels.telegram.pollingStallThresholdMs` değerini yalnızca dağıtımınız uzun süren işler sırasında hâlâ hatalı yoklama takılması yeniden başlatmaları görüyorsa artırın. Değer milisaniye cinsindendir ve `30000` ile `600000` arasında izin verilir; hesap başına geçersiz kılmalar desteklenir.
- Telegram Bot API okundu bilgisi desteğine sahip değildir (`sendReadReceipts` geçerli değildir).

<Note>
  `channels.telegram.dm.threadReplies` ve `channels.telegram.direct.<chatId>.threadReplies` kaldırıldı. Yapılandırmanızda hâlâ bu anahtarlar varsa yükseltmeden sonra `openclaw doctor --fix` çalıştırın. DM konu yönlendirmesi artık Telegram `getMe.has_topics_enabled` üzerinden bot yeteneğini izler; bu BotFather iş parçacıklı mod tarafından denetlenir: konuları etkin botlar, Telegram `message_thread_id` gönderdiğinde iş parçacığı kapsamlı DM oturumları kullanır; diğer DM'ler düz oturumda kalır.
</Note>

## Özellik başvurusu

<AccordionGroup>
  <Accordion title="Canlı akış önizlemesi (ileti düzenlemeleri)">
    OpenClaw kısmi yanıtları gerçek zamanlı olarak akıtabilir:

    - doğrudan sohbetler: önizleme iletisi + `editMessageText`
    - gruplar/konular: önizleme iletisi + `editMessageText`

    Gereksinim:

    - `channels.telegram.streaming`, `off | partial | block | progress` değerlerinden biridir (varsayılan: `partial`)
    - kısa ilk yanıt önizlemeleri debounce edilir, ardından çalışma hâlâ etkinse sınırlı bir gecikmeden sonra somutlaştırılır
    - `progress`, araç ilerlemesi için düzenlenebilir tek bir durum taslağı tutar, yanıt etkinliği araç ilerlemesinden önce geldiğinde kararlı durum etiketini gösterir, tamamlandığında temizler ve nihai yanıtı normal ileti olarak gönderir
    - `streaming.preview.toolProgress`, araç/ilerleme güncellemelerinin aynı düzenlenen önizleme iletisini yeniden kullanıp kullanmayacağını denetler (varsayılan: önizleme akışı etkinken `true`)
    - `streaming.preview.commandText`, bu araç ilerleme satırlarının içindeki komut/çalıştırma ayrıntısını denetler: `raw` (varsayılan, yayımlanmış davranışı korur) veya `status` (yalnızca araç etiketi)
    - `streaming.progress.commentary` (varsayılan: `false`), geçici ilerleme taslağında asistan yorum/preambül metnine katılmayı sağlar
    - eski `channels.telegram.streamMode`, boolean `streaming` değerleri ve kullanımdan kaldırılmış yerel taslak önizleme anahtarları algılanır; bunları güncel akış yapılandırmasına taşımak için `openclaw doctor --fix` çalıştırın

    Araç ilerleme önizleme güncellemeleri, araçlar çalışırken gösterilen kısa durum satırlarıdır; örneğin komut yürütme, dosya okumaları, planlama güncellemeleri, yama özetleri veya Codex app-server modunda Codex preambül/yorum metni. Telegram, `v2026.4.22` ve sonrasından yayımlanmış OpenClaw davranışıyla eşleşmesi için bunları varsayılan olarak etkin tutar.

    Yanıt metni için düzenlenen önizlemeyi koruyup araç ilerleme satırlarını gizlemek için şunu ayarlayın:

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

    Nihai yanıtı aynı iletiye düzenlemeden görünür araç ilerlemesi istediğinizde `progress` modunu kullanın. Komut metni politikasını `streaming.progress` altına koyun:

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

    `streaming.mode: "off"` değerini yalnızca yalnızca nihai teslimat istediğinizde kullanın: Telegram önizleme düzenlemeleri devre dışı bırakılır ve genel araç/ilerleme sohbeti, bağımsız durum iletileri olarak gönderilmek yerine bastırılır. Onay istemleri, medya yükleri ve hatalar yine de normal nihai teslimat üzerinden yönlendirilir. Araç ilerleme durum satırlarını gizlerken yalnızca yanıt önizleme düzenlemelerini korumak istediğinizde `streaming.preview.toolProgress: false` kullanın.

    <Note>
      Telegram seçili alıntı yanıtları istisnadır. `replyToMode` `"first"`, `"all"` veya `"batched"` olduğunda ve gelen ileti seçili alıntı metni içerdiğinde OpenClaw, yanıt önizlemesini düzenlemek yerine nihai yanıtı Telegram'ın yerel alıntı-yanıt yolu üzerinden gönderir; bu nedenle `streaming.preview.toolProgress` o tur için kısa durum satırlarını gösteremez. Seçili alıntı metni olmayan geçerli ileti yanıtları önizleme akışını yine korur. Araç ilerlemesi görünürlüğü yerel alıntı yanıtlarından daha önemliyse `replyToMode: "off"` ayarlayın veya bu ödünleşimi kabul etmek için `streaming.preview.toolProgress: false` ayarlayın.
    </Note>

    Yalnızca metin yanıtları için:

    - kısa DM/grup/konu önizlemeleri: OpenClaw aynı önizleme iletisini korur ve nihai düzenlemeyi yerinde gerçekleştirir
    - birden çok Telegram iletisine bölünen uzun metin nihai yanıtları, mümkün olduğunda mevcut önizlemeyi ilk nihai parça olarak yeniden kullanır, ardından yalnızca kalan parçaları gönderir
    - ilerleme modu nihai yanıtları durum taslağını temizler ve taslağı yanıta düzenlemek yerine normal nihai teslimatı kullanır
    - tamamlanan metin doğrulanmadan önce nihai düzenleme başarısız olursa OpenClaw normal nihai teslimatı kullanır ve eski önizlemeyi temizler

    Karmaşık yanıtlar için (örneğin medya yükleri), OpenClaw normal nihai teslimata geri döner ve ardından önizleme iletisini temizler.

    Önizleme akışı, blok akışından ayrıdır. Telegram için blok akışı açıkça etkinleştirildiğinde OpenClaw çift akışı önlemek için önizleme akışını atlar.

    Akıl yürütme akışı davranışı:

    - `/reasoning stream`, desteklenen bir kanalın akıl yürütme önizleme yolunu kullanır; Telegram'da üretim sırasında akıl yürütmeyi canlı önizlemeye akıtır
    - akıl yürütme önizlemesi nihai teslimattan sonra silinir; akıl yürütmenin görünür kalması gerektiğinde `/reasoning on` kullanın
    - nihai yanıt akıl yürütme metni olmadan gönderilir

  </Accordion>

  <Accordion title="Zengin ileti biçimlendirme">
    Giden metin varsayılan olarak standart Telegram HTML iletileri kullanır; böylece yanıtlar güncel Telegram istemcilerinde okunabilir kalır. Bu uyumluluk modu normal kalın, italik, bağlantılar, kod, spoiler'lar ve alıntıları destekler; ancak yerel tablolar, ayrıntılar, zengin medya ve formüller gibi Bot API 10.1'e özgü zengin blokları desteklemez.

    Bot API 10.1 zengin iletilerine katılmak için `channels.telegram.richMessages: true` ayarlayın:

```json5
{
  channels: {
    telegram: {
      richMessages: true,
    },
  },
}
```

    Etkinleştirildiğinde:

    - Ajana bu bot/hesap için Telegram zengin iletilerinin kullanılabilir olduğu söylenir.
    - Markdown metni OpenClaw'ın Markdown IR'si üzerinden işlenir ve Telegram zengin HTML olarak gönderilir.
    - Açık zengin HTML yükleri başlıklar, tablolar, ayrıntılar, zengin medya ve formüller gibi desteklenen Bot API 10.1 etiketlerini korur.
    - Medya açıklamaları yine Telegram HTML açıklamalarını kullanır çünkü zengin iletiler açıklamaların yerini almaz.

    Bu, model metnini Telegram Rich Markdown işaretlerinden uzak tutar; böylece `$400-600K` gibi para değerleri matematik olarak ayrıştırılmaz. Uzun zengin metin, Telegram'ın zengin metin ve zengin blok sınırları boyunca otomatik olarak bölünür. Telegram'ın sütun sınırını aşan tablolar kod blokları olarak gönderilir.

    Varsayılan: istemci uyumluluğu için kapalı. Zengin iletiler uyumlu Telegram istemcileri gerektirir; bazı güncel Desktop, Web, Android ve üçüncü taraf istemciler kabul edilen zengin iletileri desteklenmiyor olarak görüntüler. Bot ile kullanılan her istemci bunları işleyemiyorsa bu seçeneği devre dışı tutun. `/status`, geçerli Telegram oturumunda zengin iletilerin açık mı kapalı mı olduğunu gösterir.

    Bağlantı önizlemeleri varsayılan olarak etkindir. `channels.telegram.linkPreview: false`, zengin metin için otomatik varlık algılamayı atlar.

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
    - Plugin/skill komutları Telegram menüsünde gösterilmese bile yazıldığında çalışabilir

    Yerel komutlar devre dışıysa yerleşikler kaldırılır. Yapılandırılmışsa özel/Plugin komutları yine de kaydolabilir.

    Yaygın kurulum hataları:

    - `BOT_COMMANDS_TOO_MUCH` ile `setMyCommands failed`, kırpmadan sonra Telegram menüsünün hâlâ taştığı anlamına gelir; Plugin/skill/özel komutları azaltın veya `channels.telegram.commands.native` öğesini devre dışı bırakın.
    - Doğrudan Bot API curl komutları çalışırken `deleteWebhook`, `deleteMyCommands` veya `setMyCommands` işleminin `404: Not Found` ile başarısız olması, `channels.telegram.apiRoot` değerinin tam `/bot<TOKEN>` uç noktasına ayarlandığı anlamına gelebilir. `apiRoot` yalnızca Bot API kökü olmalıdır ve `openclaw doctor --fix` yanlışlıkla eklenmiş sondaki `/bot<TOKEN>` kısmını kaldırır.
    - `getMe returned 401`, Telegram'ın yapılandırılmış bot token'ını reddettiği anlamına gelir. `botToken`, `tokenFile` veya `TELEGRAM_BOT_TOKEN` değerini güncel BotFather token'ı ile güncelleyin; OpenClaw yoklamadan önce durur, bu nedenle bu bir Webhook temizleme hatası olarak bildirilmez.
    - Ağ/fetch hatalarıyla `setMyCommands failed`, genellikle `api.telegram.org` adresine giden DNS/HTTPS bağlantısının engellendiği anlamına gelir.

    ### Cihaz eşleme komutları (`device-pair` Plugin'i)

    `device-pair` Plugin'i yüklendiğinde:

    1. `/pair` kurulum kodu oluşturur
    2. kodu iOS uygulamasına yapıştırın
    3. `/pair pending` bekleyen istekleri listeler (rol/kapsamlar dahil)
    4. isteği onaylayın:
       - açık onay için `/pair approve <requestId>`
       - yalnızca bir bekleyen istek olduğunda `/pair approve`
       - en sonuncu için `/pair approve latest`

    Kurulum kodu kısa ömürlü bir başlangıç token'ı taşır. Yerleşik kurulum kodu başlangıcı yalnızca node içindir: ilk bağlantı bekleyen bir node isteği oluşturur ve onaydan sonra Gateway, `scopes: []` ile kalıcı bir node token'ı döndürür. Devredilmiş bir operatör token'ı döndürmez; operatör erişimi ayrı bir onaylanmış operatör eşlemesi veya token akışı gerektirir.

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

    Mini App düğmesi örneği:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "Open app:",
  presentation: {
    blocks: [
      {
        type: "buttons",
        buttons: [{ label: "Launch", web_app: { url: "https://example.com/app" } }],
      },
    ],
  },
}
```

    Telegram `web_app` düğmeleri yalnızca bir kullanıcı ile bot arasındaki özel sohbetlerde çalışır.

    Kayıtlı bir plugin etkileşimli işleyicisi tarafından sahiplenilmeyen geri çağırma tıklamaları, metin olarak agente geçirilir:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="Agentler ve otomasyon için Telegram mesaj eylemleri">
    Telegram araç eylemleri şunları içerir:

    - `sendMessage` (`to`, `content`, isteğe bağlı `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content` veya `caption`, isteğe bağlı `presentation` satır içi düğmeleri; yalnızca düğme düzenlemeleri yanıt işaretlemesini günceller)
    - `createForumTopic` (`chatId`, `name`, isteğe bağlı `iconColor`, `iconCustomEmojiId`)

    Kanal mesaj eylemleri ergonomik takma adlar sunar (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Geçitleme denetimleri:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (varsayılan: devre dışı)

    Not: `edit` ve `topic-create` şu anda varsayılan olarak etkindir ve ayrı `channels.telegram.actions.*` anahtarlarına sahip değildir.
    Çalışma zamanı gönderimleri etkin yapılandırma/sır anlık görüntüsünü (başlatma/yeniden yükleme) kullanır; bu nedenle eylem yolları her gönderimde geçici SecretRef yeniden çözümlemesi yapmaz.

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

    Yanıt iş parçacığı etkinleştirildiğinde ve özgün Telegram metni veya açıklaması kullanılabilir olduğunda, OpenClaw otomatik olarak yerel bir Telegram alıntı parçası ekler. Telegram yerel alıntı metnini 1024 UTF-16 kod birimiyle sınırlar; bu nedenle daha uzun mesajlar baştan alıntılanır ve Telegram alıntıyı reddederse düz yanıta geri döner.

    Not: `off` örtük yanıt iş parçacığını devre dışı bırakır. Açık `[[reply_to_*]]` etiketleri yine de uygulanır.

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

    Konu kalıtımı: konu girdileri, geçersiz kılınmadıkça grup ayarlarını devralır (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` yalnızca konuya özeldir ve grup varsayılanlarından devralınmaz.
    `topics."*"`, o gruptaki her konu için varsayılanları ayarlar; kesin konu kimlikleri yine de `"*"` üzerinde önceliklidir.

    **Konu başına agent yönlendirme**: Her konu, konu yapılandırmasında `agentId` ayarlanarak farklı bir agente yönlendirilebilir. Bu, her konuya kendi yalıtılmış çalışma alanını, belleğini ve oturumunu verir. Örnek:

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

    **Kalıcı ACP konu bağlama**: Forum konuları, üst düzey yazımlı ACP bağlamaları üzerinden ACP harness oturumlarını sabitleyebilir (`type: "acp"` ve `match.channel: "telegram"`, `peer.kind: "group"` içeren `bindings[]` ve `-1001234567890:topic:42` gibi konu nitelemeli bir kimlik). Şu anda gruplar/süper gruplardaki forum konularıyla sınırlıdır. Bkz. [ACP Agentleri](/tr/tools/acp-agents).

    **Sohbetten iş parçacığına bağlı ACP başlatma**: `/acp spawn <agent> --thread here|auto` mevcut konuyu yeni bir ACP oturumuna bağlar; takip mesajları doğrudan oraya yönlendirilir. OpenClaw başlatma onayını konu içinde sabitler. `channels.telegram.threadBindings.spawnSessions` ayarının etkin kalmasını gerektirir (varsayılan: `true`).

    Şablon bağlamı `MessageThreadId` ve `IsForum` değerlerini sunar. `message_thread_id` içeren DM sohbetleri yanıt meta verilerini korur; iş parçacığına duyarlı oturum anahtarlarını yalnızca Telegram `getMe` bot için `has_topics_enabled: true` bildirdiğinde kullanırlar.
    Önceki `dm.threadReplies` ve `direct.*.threadReplies` geçersiz kılmaları bilinçli olarak kullanımdan kaldırılmıştır; tek doğruluk kaynağı olarak BotFather iş parçacığı modunu kullanın ve eski yapılandırma anahtarlarını kaldırmak için `openclaw doctor --fix` çalıştırın.

  </Accordion>

  <Accordion title="Ses, video ve çıkartmalar">
    ### Sesli mesajlar

    Telegram sesli notları ve ses dosyalarını ayırt eder.

    - varsayılan: ses dosyası davranışı
    - sesli not gönderimini zorlamak için agent yanıtında `[[audio_as_voice]]` etiketi
    - gelen sesli not dökümleri agent bağlamında makine tarafından oluşturulmuş,
      güvenilmeyen metin olarak çerçevelenir; bahsetme algılama yine de ham
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

    Yinelenen görüntü çağrılarını azaltmak için çıkartma açıklamaları OpenClaw SQLite Plugin durumunda önbelleğe alınır.

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

    Çıkartma gönderme eylemi:

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

    Etkinleştirildiğinde OpenClaw şu tür sistem olaylarını kuyruğa alır:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Yapılandırma:

    - `channels.telegram.reactionNotifications`: `off | own | all` (varsayılan: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (varsayılan: `minimal`)

    Notlar:

    - `own`, yalnızca bot tarafından gönderilen mesajlara kullanıcı tepkileri anlamına gelir (gönderilen mesaj önbelleği üzerinden en iyi çaba).
    - Tepki olayları yine de Telegram erişim denetimlerine (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`) uyar; yetkisiz gönderenler bırakılır.
    - Telegram, tepki güncellemelerinde konu kimlikleri sağlamaz.
      - forum olmayan gruplar grup sohbet oturumuna yönlendirilir
      - forum grupları, tam kaynak konuya değil grup genel konu oturumuna (`:topic:1`) yönlendirilir

    Yoklama/Webhook için `allowed_updates`, `message_reaction` değerini otomatik olarak içerir.

  </Accordion>

  <Accordion title="Ack tepkileri">
    `ackReaction`, OpenClaw gelen bir mesajı işlerken bir onay emojisi gönderir. `ackReactionScope`, bu emojinin gerçekte *ne zaman* gönderileceğine karar verir.

    **Emoji (`ackReaction`) çözümleme sırası:**

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - ajan kimliği emoji geri dönüşü (`agents.list[].identity.emoji`, yoksa "👀")

    Notlar:

    - Telegram unicode emoji bekler (örneğin "👀").
    - Bir kanal veya hesap için tepkiyi devre dışı bırakmak üzere `""` kullanın.

    **Kapsam (`messages.ackReactionScope`):**

    Telegram sağlayıcısı kapsamı `messages.ackReactionScope` değerinden okur (varsayılan `"group-mentions"`). Bugün Telegram hesabı veya Telegram kanalı düzeyinde geçersiz kılma yoktur.

    Değerler: `"all"` (DM'ler + gruplar), `"direct"` (yalnızca DM'ler), `"group-all"` (her grup mesajı, DM yok), `"group-mentions"` (bot anıldığında gruplar; **DM yok** — varsayılan budur), `"off"` / `"none"` (devre dışı).

    <Note>
    Varsayılan kapsam (`"group-mentions"`), doğrudan mesajlarda ack tepkilerini tetiklemez. Gelen Telegram DM'lerinde ack tepkisi almak için `messages.ackReactionScope` değerini `"direct"` veya `"all"` olarak ayarlayın. Değer Telegram sağlayıcısı başlatılırken okunur, bu nedenle değişikliğin etkili olması için Gateway yeniden başlatması gerekir.
    </Note>

  </Accordion>

  <Accordion title="Telegram olaylarından ve komutlarından yapılandırma yazmaları">
    Kanal yapılandırması yazmaları varsayılan olarak etkindir (`configWrites !== false`).

    Telegram tarafından tetiklenen yazmalar şunları içerir:

    - `channels.telegram.groups` değerini güncellemek için grup taşıma olayları (`migrate_to_chat_id`)
    - `/config set` ve `/config unset` (komut etkinleştirmesi gerektirir)

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
    Varsayılan uzun yoklamadır. Webhook modu için `channels.telegram.webhookUrl` ve `channels.telegram.webhookSecret` ayarlayın; isteğe bağlı `webhookPath`, `webhookHost`, `webhookPort` (varsayılanlar `/telegram-webhook`, `127.0.0.1`, `8787`).

    Uzun yoklama modunda OpenClaw, yeniden başlatma filigranını yalnızca bir güncelleme başarıyla dağıtıldıktan sonra kalıcı hale getirir. Bir işleyici başarısız olursa bu güncelleme aynı süreçte yeniden denenebilir kalır ve yeniden başlatma tekilleştirmesi için tamamlanmış olarak yazılmaz.

    Yerel dinleyici `127.0.0.1:8787` adresine bağlanır. Genel giriş için yerel bağlantı noktasının önüne bir ters proxy koyun veya bilinçli olarak `webhookHost: "0.0.0.0"` ayarlayın.

    Webhook modu, Telegram'a `200` döndürmeden önce istek korumalarını, Telegram gizli belirtecini ve JSON gövdesini doğrular.
    OpenClaw ardından güncellemeyi uzun yoklamanın kullandığı aynı sohbet başına/konu başına bot hatları üzerinden eşzamansız olarak işler; böylece yavaş ajan dönüşleri Telegram'ın teslimat ACK'sini bekletmez.

  </Accordion>

  <Accordion title="Sınırlar, yeniden deneme ve CLI hedefleri">
    - `channels.telegram.textChunkLimit` varsayılanı 4000'dir.
    - `channels.telegram.chunkMode="newline"`, uzunluğa göre bölmeden önce paragraf sınırlarını (boş satırlar) tercih eder.
    - `channels.telegram.mediaMaxMb` (varsayılan 100), gelen ve giden Telegram medya boyutunu sınırlar.
    - `channels.telegram.mediaGroupFlushMs` (varsayılan 500), OpenClaw bunları tek bir gelen ileti olarak göndermeden önce Telegram albümlerinin/medya gruplarının ne kadar süre arabelleğe alınacağını denetler. Albüm parçaları geç geliyorsa artırın; albüm yanıt gecikmesini azaltmak için düşürün.
    - `channels.telegram.timeoutSeconds`, Telegram API istemcisi zaman aşımını geçersiz kılar (ayarlanmazsa grammY varsayılanı uygulanır). Bot istemcileri, yapılandırılan değerleri 60 saniyelik giden metin/yazıyor isteği korumasının altında sınırlar; böylece grammY, OpenClaw'ın taşıma koruması ve geri dönüşü çalışmadan önce görünür yanıt teslimini kesmez. Uzun yoklama hâlâ 45 saniyelik `getUpdates` isteği koruması kullanır; böylece boşta kalan yoklamalar süresiz olarak terk edilmez.
    - `channels.telegram.pollingStallThresholdMs` varsayılan olarak `120000` değerindedir; yalnızca yanlış pozitif yoklama-takılması yeniden başlatmaları için `30000` ile `600000` arasında ayarlayın.
    - grup bağlam geçmişi `channels.telegram.historyLimit` veya `messages.groupChat.historyLimit` kullanır (varsayılan 50); `0` devre dışı bırakır.
    - yanıt/alinti/iletme ek bağlamı, Gateway üst iletileri gözlemlediğinde seçili tek bir konuşma bağlam penceresine normalize edilir; gözlemlenen ileti önbelleği OpenClaw SQLite Plugin durumunda yaşar ve `openclaw doctor --fix` eski yan dosyaları içe aktarır. Telegram güncellemelerde yalnızca tek, sığ bir `reply_to_message` içerir; bu nedenle önbellekten daha eski zincirler Telegram'ın mevcut güncelleme yüküyle sınırlıdır.
    - Telegram izin listeleri öncelikle ajanı kimin tetikleyebileceğini sınırlar; tam bir ek bağlam redaksiyon sınırı değildir.
    - DM geçmiş denetimleri:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - `channels.telegram.retry` yapılandırması, kurtarılabilir giden API hataları için Telegram gönderme yardımcılarına (CLI/araçlar/eylemler) uygulanır. Gelen nihai yanıt teslimi de Telegram bağlantı öncesi hataları için sınırlı bir güvenli gönderme yeniden denemesi kullanır, ancak görünür iletileri çoğaltabilecek belirsiz gönderim sonrası ağ zarflarını yeniden denemez.

    CLI ve ileti aracı gönderme hedefleri sayısal sohbet kimliği, kullanıcı adı veya forum konusu hedefi olabilir:

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

    Telegram gönderimi şunları da destekler:

    - `channels.telegram.capabilities.inlineButtons` izin verdiğinde satır içi klavyeler için `buttons` bloklarıyla `--presentation`
    - botun o sohbette sabitleyebildiği durumlarda sabitlenmiş teslim istemek için `--pin` veya `--delivery '{"pin":true}'`
    - giden görselleri, GIF'leri ve videoları sıkıştırılmış fotoğraf, animasyonlu medya veya video yüklemeleri yerine belge olarak göndermek için `--force-document`

    Eylem kapılama:

    - `channels.telegram.actions.sendMessage=false`, yoklamalar dahil giden Telegram iletilerini devre dışı bırakır
    - `channels.telegram.actions.poll=false`, normal gönderimleri etkin bırakırken Telegram yoklaması oluşturmayı devre dışı bırakır

  </Accordion>

  <Accordion title="Telegram'da exec onayları">
    Telegram, onaylayan DM'lerinde exec onaylarını destekler ve isteğe bağlı olarak istemleri kaynak sohbete veya konuya gönderebilir. Onaylayanlar sayısal Telegram kullanıcı kimlikleri olmalıdır.

    Yapılandırma yolu:

    - `channels.telegram.execApprovals.enabled` (en az bir onaylayan çözümlenebilir olduğunda otomatik etkinleşir)
    - `channels.telegram.execApprovals.approvers` (`commands.ownerAllowFrom` içindeki sayısal sahip kimliklerine geri döner)
    - `channels.telegram.execApprovals.target`: `dm` (varsayılan) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` ve `defaultTo`, botla kimin konuşabileceğini ve normal yanıtları nereye göndereceğini denetler. Birini exec onaylayanı yapmazlar. Henüz komut sahibi yoksa ilk onaylanmış DM eşleştirmesi `commands.ownerAllowFrom` değerini başlatır; böylece tek sahipli kurulum, `execApprovals.approvers` altında kimlikleri çoğaltmadan çalışmaya devam eder.

    Kanal teslimi komut metnini sohbette gösterir; `channel` veya `both` değerini yalnızca güvenilir gruplarda/konularda etkinleştirin. İstem bir forum konusuna düştüğünde OpenClaw onay istemi ve takip için konuyu korur. Exec onaylarının süresi varsayılan olarak 30 dakika sonra dolar.

    Satır içi onay düğmeleri ayrıca `channels.telegram.capabilities.inlineButtons` değerinin hedef yüzeye (`dm`, `group` veya `all`) izin vermesini gerektirir. `plugin:` önekiyle başlayan onay kimlikleri Plugin onayları üzerinden çözümlenir; diğerleri önce exec onayları üzerinden çözümlenir.

    Bkz. [Exec onayları](/tr/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Hata yanıtı denetimleri

Ajan bir teslim veya sağlayıcı hatasıyla karşılaştığında, hata ilkesi hata iletilerinin Telegram sohbetine gönderilip gönderilmeyeceğini denetler:

| Anahtar                             | Değerler                   | Varsayılan      | Açıklama                                                                                                                                                                                                        |
| ----------------------------------- | -------------------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `always`, `once`, `silent` | `always`        | `always` — her hata iletisini sohbete gönder. `once` — her benzersiz hata iletisini bekleme penceresi başına bir kez gönder (tekrarlanan aynı hataları bastır). `silent` — hata iletilerini sohbete asla gönderme. |
| `channels.telegram.errorCooldownMs` | sayı (ms)                  | `14400000` (4s) | `once` ilkesi için bekleme penceresi. Bir hata gönderildikten sonra aynı hata iletisi bu aralık dolana kadar bastırılır. Kesintiler sırasında hata spam'ini önler.                                               |

Hesap başına, grup başına ve konu başına geçersiz kılmalar desteklenir (diğer Telegram yapılandırma anahtarlarıyla aynı kalıtım).

```json5
{
  channels: {
    telegram: {
      errorPolicy: "always",
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
  <Accordion title="Bot, bahsetme içermeyen grup iletilerine yanıt vermiyor">

    - `requireMention=false` ise Telegram gizlilik modu tam görünürlüğe izin vermelidir.
      - BotFather: `/setprivacy` -> Disable
      - ardından botu gruptan kaldırıp yeniden ekleyin
    - `openclaw channels status`, yapılandırma bahsedilmemiş grup iletileri beklediğinde uyarır.
    - `openclaw channels status --probe` açık sayısal grup kimliklerini denetleyebilir; joker karakter `"*"` üyelik açısından yoklanamaz.
    - hızlı oturum testi: `/activation always`.

  </Accordion>

  <Accordion title="Bot grup iletilerini hiç görmüyor">

    - `channels.telegram.groups` varsa grup listelenmelidir (veya `"*"` içermelidir)
    - botun gruptaki üyeliğini doğrulayın
    - atlama nedenleri için günlükleri inceleyin: `openclaw logs --follow`

  </Accordion>

  <Accordion title="Komutlar kısmen çalışıyor veya hiç çalışmıyor">

    - gönderici kimliğinizi yetkilendirin (eşleştirme ve/veya sayısal `allowFrom`)
    - grup ilkesi `open` olsa bile komut yetkilendirmesi uygulanmaya devam eder
    - `BOT_COMMANDS_TOO_MUCH` ile `setMyCommands failed`, yerel menüde çok fazla giriş olduğu anlamına gelir; Plugin/Skills/özel komutları azaltın veya yerel menüleri devre dışı bırakın
    - `deleteMyCommands` / `setMyCommands` başlangıç çağrıları ve `sendChatAction` yazıyor çağrıları sınırlıdır ve istek zaman aşımında Telegram'ın taşıma geri dönüşü üzerinden bir kez yeniden denenir. Kalıcı ağ/fetch hataları genellikle `api.telegram.org` için DNS/HTTPS erişilebilirlik sorunlarını gösterir

  </Accordion>

  <Accordion title="Başlangıç yetkisiz token bildiriyor">

    - `getMe returned 401`, yapılandırılmış bot token'ı için Telegram kimlik doğrulama hatasıdır.
    - BotFather'da bot token'ını yeniden kopyalayın veya yeniden oluşturun, ardından varsayılan hesap için `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken` veya `TELEGRAM_BOT_TOKEN` değerini güncelleyin.
    - Başlangıç sırasında `deleteWebhook 401 Unauthorized` da bir kimlik doğrulama hatasıdır; bunu "webhook yok" olarak ele almak, aynı hatalı-token hatasını yalnızca sonraki API çağrılarına ertelemiş olur.

  </Accordion>

  <Accordion title="Yoklama veya ağ kararsızlığı">

    - Node 22+ ve özel fetch/proxy, AbortSignal türleri uyuşmazsa anında iptal davranışını tetikleyebilir.
    - Bazı host'lar `api.telegram.org` adresini önce IPv6 olarak çözümler; bozuk IPv6 çıkışı aralıklı Telegram API hatalarına neden olabilir.
    - Günlükler `TypeError: fetch failed` veya `Network request for 'getUpdates' failed!` içeriyorsa OpenClaw artık bunları kurtarılabilir ağ hataları olarak yeniden dener.
    - Yoklama başlangıcında OpenClaw, grammY için başarılı başlangıç `getMe` yoklamasını yeniden kullanır; böylece runner'ın ilk `getUpdates` öncesinde ikinci bir `getMe` çağrısına ihtiyacı olmaz.
    - Yoklama başlangıcında `deleteWebhook` geçici bir ağ hatasıyla başarısız olursa OpenClaw başka bir yoklama öncesi denetim düzlemi çağrısı yapmak yerine uzun yoklamaya devam eder. Hâlâ etkin olan bir webhook, `getUpdates` çakışması olarak görünür; OpenClaw ardından Telegram taşımasını yeniden oluşturur ve webhook temizliğini yeniden dener.
    - Telegram soketleri kısa ve sabit bir aralıkla yeniden dönüştürülüyorsa düşük bir `channels.telegram.timeoutSeconds` olup olmadığını denetleyin; bot istemcileri yapılandırılan değerleri giden ve `getUpdates` isteği korumalarının altında sınırlar, ancak eski sürümler bu değer bu korumaların altında ayarlandığında her yoklamayı veya yanıtı iptal edebilirdi.
    - Günlükler `Polling stall detected` içeriyorsa OpenClaw varsayılan olarak tamamlanmış uzun yoklama canlılığı olmadan 120 saniye sonra yoklamayı yeniden başlatır ve Telegram taşımasını yeniden oluşturur.
    - `openclaw channels status --probe` ve `openclaw doctor`, çalışan bir yoklama hesabı başlangıç ek süresinden sonra `getUpdates` tamamlamadığında, çalışan bir webhook hesabı başlangıç ek süresinden sonra `setWebhook` tamamlamadığında veya son başarılı yoklama taşıma etkinliği bayatladığında uyarır.
    - `channels.telegram.pollingStallThresholdMs` değerini yalnızca uzun süre çalışan `getUpdates` çağrıları sağlıklı olduğu hâlde host'unuz yanlış yoklama-takılması yeniden başlatmaları bildiriyorsa artırın. Kalıcı takılmalar genellikle host ile `api.telegram.org` arasındaki proxy, DNS, IPv6 veya TLS çıkış sorunlarına işaret eder.
    - Telegram ayrıca Bot API taşıması için `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` ve bunların küçük harfli varyantları dahil süreç proxy ortam değişkenlerine uyar. `NO_PROXY` / `no_proxy` yine de `api.telegram.org` için baypas sağlayabilir.
    - OpenClaw yönetimli proxy bir hizmet ortamı için `OPENCLAW_PROXY_URL` üzerinden yapılandırılmışsa ve standart proxy ortam değişkeni yoksa Telegram bu URL'yi Bot API taşıması için de kullanır.
    - Kararsız doğrudan çıkış/TLS olan VPS host'larında Telegram API çağrılarını `channels.telegram.proxy` üzerinden yönlendirin:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ varsayılan olarak `autoSelectFamily=true` kullanır (WSL2 hariç). Telegram DNS sonuç sırası önce `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`, sonra `channels.telegram.network.dnsResultOrder`, ardından `NODE_OPTIONS=--dns-result-order=ipv4first` gibi süreç varsayılanını dikkate alır; hiçbiri uygulanmazsa, Node 22+ `ipv4first` değerine geri döner.
    - Ana makineniz WSL2 ise veya açıkça yalnızca IPv4 davranışıyla daha iyi çalışıyorsa, adres ailesi seçimini zorlayın:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - RFC 2544 kıyaslama aralığı yanıtlarına (`198.18.0.0/15`) Telegram medya
      indirmeleri için varsayılan olarak zaten izin verilir. Güvenilir bir sahte IP veya
      saydam proxy, medya indirmeleri sırasında `api.telegram.org` adresini başka bir
      özel/dahili/özel kullanımlı adrese yeniden yazıyorsa, yalnızca Telegram için geçerli
      atlamayı etkinleştirebilirsiniz:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - Aynı etkinleştirme hesap başına
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork` konumunda kullanılabilir.
    - Proxy'niz Telegram medya ana makinelerini `198.18.x.x` adreslerine çözümlüyorsa,
      önce tehlikeli bayrağı kapalı bırakın. Telegram medya zaten varsayılan olarak
      RFC 2544 kıyaslama aralığına izin verir.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork`, Telegram
      medya SSRF korumalarını zayıflatır. Bunu yalnızca Clash, Mihomo veya Surge
      sahte IP yönlendirmesi gibi, RFC 2544 kıyaslama aralığı dışında özel ya da
      özel kullanımlı yanıtlar üreten güvenilir, operatör denetimli proxy
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

Daha fazla yardım: [Kanal sorunlarını giderme](/tr/channels/troubleshooting).

## Yapılandırma başvurusu

Birincil başvuru: [Yapılandırma başvurusu - Telegram](/tr/gateway/config-channels#telegram).

<Accordion title="High-signal Telegram fields">

- başlatma/kimlik doğrulama: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` normal bir dosyayı göstermelidir; sembolik bağlantılar reddedilir)
- erişim denetimi: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, üst düzey `bindings[]` (`type: "acp"`)
- konu varsayılanları: `groups.<chatId>.topics."*"` eşleşmeyen forum konularına uygulanır; tam konu ID'leri bunu geçersiz kılar
- yürütme onayları: `execApprovals`, `accounts.*.execApprovals`
- komut/menü: `commands.native`, `commands.nativeSkills`, `customCommands`
- ileti dizileri/yanıtlar: `replyToMode`
- akış: `streaming` (önizleme), `streaming.preview.toolProgress`, `blockStreaming`
- biçimlendirme/teslim: `textChunkLimit`, `chunkMode`, `richMessages`, `linkPreview`, `responsePrefix`
- medya/ağ: `mediaMaxMb`, `mediaGroupFlushMs`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- özel API kökü: `apiRoot` (yalnızca Bot API kökü; `/bot<TOKEN>` eklemeyin)
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- eylemler/yetenekler: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- tepkiler: `reactionNotifications`, `reactionLevel`
- hatalar: `errorPolicy`, `errorCooldownMs`
- yazmalar/geçmiş: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
Çoklu hesap önceliği: iki veya daha fazla hesap ID'si yapılandırıldığında, varsayılan yönlendirmeyi açık hale getirmek için `channels.telegram.defaultAccount` değerini ayarlayın (veya `channels.telegram.accounts.default` ekleyin). Aksi halde OpenClaw ilk normalize edilmiş hesap ID'sine geri döner ve `openclaw doctor` uyarır. Adlandırılmış hesaplar `channels.telegram.allowFrom` / `groupAllowFrom` değerlerini devralır, ancak `accounts.default.*` değerlerini devralmaz.
</Note>

## İlgili

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/tr/channels/pairing">
    Bir Telegram kullanıcısını gateway ile eşleştirin.
  </Card>
  <Card title="Groups" icon="users" href="/tr/channels/groups">
    Grup ve konu izin listesi davranışı.
  </Card>
  <Card title="Channel routing" icon="route" href="/tr/channels/channel-routing">
    Gelen iletileri ajanlara yönlendirin.
  </Card>
  <Card title="Security" icon="shield" href="/tr/gateway/security">
    Tehdit modeli ve sağlamlaştırma.
  </Card>
  <Card title="Multi-agent routing" icon="sitemap" href="/tr/concepts/multi-agent">
    Grupları ve konuları ajanlarla eşleyin.
  </Card>
  <Card title="Troubleshooting" icon="wrench" href="/tr/channels/troubleshooting">
    Kanallar arası tanılama.
  </Card>
</CardGroup>
