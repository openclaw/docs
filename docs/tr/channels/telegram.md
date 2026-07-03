---
read_when:
    - Telegram özellikleri veya Webhook'lar üzerinde çalışma
summary: Telegram bot destek durumu, yetenekleri ve yapılandırması
title: Telegram
x-i18n:
    generated_at: "2026-07-03T17:35:09Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 202d6eaaf9348203855659d30616368995bce9269082e60dfed67c8d444abf18
    source_path: channels/telegram.md
    workflow: 16
---

Bot DM'leri ve grupları için grammY ile üretime hazır. Varsayılan mod uzun yoklamadır; Webhook modu isteğe bağlıdır.

<CardGroup cols={3}>
  <Card title="Eşleştirme" icon="link" href="/tr/channels/pairing">
    Telegram için varsayılan DM politikası eşleştirmedir.
  </Card>
  <Card title="Kanal sorun giderme" icon="wrench" href="/tr/channels/troubleshooting">
    Kanallar arası tanılama ve onarım çalışma planları.
  </Card>
  <Card title="Gateway yapılandırması" icon="settings" href="/tr/gateway/configuration">
    Tüm kanal yapılandırma kalıpları ve örnekleri.
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
    Telegram **`openclaw channels login telegram`** kullanmaz; token'ı config/env içinde yapılandırın, ardından gateway'i başlatın.

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
    Botu grubunuza ekleyin, ardından grup erişiminin ihtiyaç duyduğu iki kimliği de alın:

    - `allowFrom` / `groupAllowFrom` içinde kullanılan Telegram kullanıcı kimliğiniz
    - `channels.telegram.groups` altında anahtar olarak kullanılan Telegram grup sohbet kimliği

    İlk kurulum için grup sohbet kimliğini `openclaw logs --follow`, iletilmiş kimlik botu veya Bot API `getUpdates` üzerinden alın. Grup izinli hale geldikten sonra `/whoami@<bot_username>` kullanıcı ve grup kimliklerini doğrulayabilir.

    `-100` ile başlayan negatif Telegram süper grup kimlikleri grup sohbet kimlikleridir. Bunları `groupAllowFrom` altına değil, `channels.telegram.groups` altına koyun.

  </Step>
</Steps>

<Note>
Token çözümleme sırası hesap farkındadır. Pratikte config değerleri env yedeğine üstün gelir ve `TELEGRAM_BOT_TOKEN` yalnızca varsayılan hesaba uygulanır.
Başarılı bir başlangıçtan sonra OpenClaw, yeniden başlatmaların ek bir Telegram `getMe` çağrısından kaçınabilmesi için bot kimliğini state dizininde 24 saate kadar önbelleğe alır; token'ı değiştirmek veya kaldırmak bu önbelleği temizler.
</Note>

## Telegram tarafı ayarları

<AccordionGroup>
  <Accordion title="Gizlilik modu ve grup görünürlüğü">
    Telegram botları varsayılan olarak aldıkları grup mesajlarını sınırlayan **Gizlilik Modu** ile gelir.

    Botun tüm grup mesajlarını görmesi gerekiyorsa şunlardan birini yapın:

    - `/setprivacy` ile gizlilik modunu devre dışı bırakın veya
    - botu grup yöneticisi yapın.

    Gizlilik modunu değiştirirken Telegram'ın değişikliği uygulaması için botu her gruptan kaldırıp yeniden ekleyin.

  </Accordion>

  <Accordion title="Grup izinleri">
    Yönetici durumu Telegram grup ayarlarında denetlenir.

    Yönetici botlar tüm grup mesajlarını alır; bu, her zaman açık grup davranışı için kullanışlıdır.

  </Accordion>

  <Accordion title="Yararlı BotFather geçişleri">

    - grup eklemelerine izin vermek/reddetmek için `/setjoingroups`
    - grup görünürlüğü davranışı için `/setprivacy`

  </Accordion>
</AccordionGroup>

## Erişim denetimi ve etkinleştirme

### Grup bot kimliği

Telegram gruplarında ve forum konularında, yapılandırılmış bot kullanıcı adının açıkça anılması (örneğin `@my_bot`), agent persona adı Telegram kullanıcı adından farklı olsa bile seçili OpenClaw agent'ına hitap etmek olarak değerlendirilir. Grup sessizlik politikası ilgisiz grup trafiği için hâlâ geçerlidir, ancak bot kullanıcı adının kendisi "başka biri" olarak kabul edilmez.

<Tabs>
  <Tab title="DM politikası">
    `channels.telegram.dmPolicy` doğrudan mesaj erişimini denetler:

    - `pairing` (varsayılan)
    - `allowlist` (`allowFrom` içinde en az bir gönderen kimliği gerektirir)
    - `open` (`allowFrom` içinde `"*"` bulunmasını gerektirir)
    - `disabled`

    `dmPolicy: "open"` ve `allowFrom: ["*"]`, bot kullanıcı adını bulan veya tahmin eden herhangi bir Telegram hesabının botu komutlandırmasına izin verir. Bunu yalnızca araçları sıkı biçimde kısıtlanmış, kasıtlı olarak herkese açık botlar için kullanın; tek sahipli botlar sayısal kullanıcı kimlikleriyle `allowlist` kullanmalıdır.

    `channels.telegram.allowFrom` sayısal Telegram kullanıcı kimliklerini kabul eder. `telegram:` / `tg:` önekleri kabul edilir ve normalleştirilir.
    Çok hesaplı config'lerde, kısıtlayıcı bir üst düzey `channels.telegram.allowFrom` güvenlik sınırı olarak değerlendirilir: hesap düzeyi `allowFrom: ["*"]` girdileri, birleştirmeden sonra etkin hesap izin listesi hâlâ açık bir joker karakter içermedikçe o hesabı herkese açık yapmaz.
    Boş `allowFrom` ile `dmPolicy: "allowlist"` tüm DM'leri engeller ve config doğrulaması tarafından reddedilir.
    Kurulum yalnızca sayısal kullanıcı kimliklerini ister.
    Yükseltme yaptıysanız ve config'inizde `@username` izin listesi girdileri varsa, bunları çözümlemek için `openclaw doctor --fix` çalıştırın (en iyi çaba; Telegram bot token'ı gerektirir).
    Daha önce eşleştirme deposu izin listesi dosyalarına güveniyorsanız, `openclaw doctor --fix` izin listesi akışlarında girdileri `channels.telegram.allowFrom` içine kurtarabilir (örneğin `dmPolicy: "allowlist"` henüz açık kimlik içermediğinde).

    Tek sahipli botlarda, erişim politikasını önceki eşleştirme onaylarına bağlı kalmak yerine config içinde kalıcı tutmak için açık sayısal `allowFrom` kimlikleriyle `dmPolicy: "allowlist"` tercih edin.

    Yaygın kafa karışıklığı: DM eşleştirme onayı "bu gönderen her yerde yetkilidir" anlamına gelmez.
    Eşleştirme DM erişimi verir. Henüz komut sahibi yoksa, ilk onaylanan eşleştirme ayrıca `commands.ownerAllowFrom` değerini ayarlayarak yalnızca sahip komutları ve exec onayları için açık bir operatör hesabı sağlar.
    Grup gönderen yetkilendirmesi hâlâ açık config izin listelerinden gelir.
    "Bir kez yetkili olayım ve hem DM'ler hem de grup komutları çalışsın" istiyorsanız, sayısal Telegram kullanıcı kimliğinizi `channels.telegram.allowFrom` içine koyun; yalnızca sahip komutları için `commands.ownerAllowFrom` değerinin `telegram:<your user id>` içerdiğinden emin olun.

    ### Telegram kullanıcı kimliğinizi bulma

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

  <Tab title="Grup politikası ve izin listeleri">
    İki denetim birlikte uygulanır:

    1. **Hangi gruplara izin verilir** (`channels.telegram.groups`)
       - `groups` config'i yok:
         - `groupPolicy: "open"` ile: herhangi bir grup grup kimliği denetimlerinden geçebilir
         - `groupPolicy: "allowlist"` (varsayılan) ile: `groups` girdileri (veya `"*"`) ekleyene kadar gruplar engellenir
       - `groups` yapılandırılmış: izin listesi gibi davranır (açık kimlikler veya `"*"`)

    2. **Gruplarda hangi gönderenlere izin verilir** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (varsayılan)
       - `disabled`

    `groupAllowFrom`, grup gönderen filtrelemesi için kullanılır. Ayarlanmadıysa Telegram `allowFrom` değerine geri döner.
    `groupAllowFrom` girdileri sayısal Telegram kullanıcı kimlikleri olmalıdır (`telegram:` / `tg:` önekleri normalleştirilir).
    Telegram grup veya süper grup sohbet kimliklerini `groupAllowFrom` içine koymayın. Negatif sohbet kimlikleri `channels.telegram.groups` altında yer alır.
    Sayısal olmayan girdiler gönderen yetkilendirmesi için yok sayılır.
    Güvenlik sınırı (`2026.2.25+`): grup gönderen kimlik doğrulaması DM eşleştirme deposu onaylarını **devralmaz**.
    Eşleştirme yalnızca DM olarak kalır. Gruplar için `groupAllowFrom` veya grup başına/konu başına `allowFrom` ayarlayın.
    `groupAllowFrom` ayarlanmamışsa Telegram eşleştirme deposuna değil, config `allowFrom` değerine geri döner.
    Tek sahipli botlar için pratik kalıp: kullanıcı kimliğinizi `channels.telegram.allowFrom` içine ayarlayın, `groupAllowFrom` değerini ayarlamayın ve hedef gruplara `channels.telegram.groups` altında izin verin.
    Çalışma zamanı notu: `channels.telegram` tamamen eksikse, `channels.defaults.groupPolicy` açıkça ayarlanmadığı sürece çalışma zamanı varsayılan olarak hata kapalı `groupPolicy="allowlist"` kullanır.

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
      Yaygın hata: `groupAllowFrom` bir Telegram grup izin listesi değildir.

      - `-1001234567890` gibi negatif Telegram grup veya süper grup sohbet kimliklerini `channels.telegram.groups` altına koyun.
      - İzin verilen bir grup içindeki hangi kişilerin botu tetikleyebileceğini sınırlamak istediğinizde `8734062810` gibi Telegram kullanıcı kimliklerini `groupAllowFrom` altına koyun.
      - `groupAllowFrom: ["*"]` değerini yalnızca izin verilen bir grubun herhangi bir üyesinin botla konuşabilmesini istediğinizde kullanın.

    </Warning>

  </Tab>

  <Tab title="Anma davranışı">
    Grup yanıtları varsayılan olarak anma gerektirir.

    Anma şunlardan gelebilir:

    - yerel `@botusername` anması veya
    - şunlardaki anma kalıpları:
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

    Grup geçmişi bağlamı gruplar için her zaman açıktır ve
    `historyLimit` ile sınırlıdır. Telegram grup geçmişi penceresini devre dışı bırakmak için `channels.telegram.historyLimit: 0` ayarlayın. Kullanımdan kaldırılmış `includeGroupHistoryContext`
    anahtarı `openclaw doctor --fix` tarafından kaldırılır.

    Grup sohbet kimliğini alma:

    - bir grup mesajını `@userinfobot` / `@getidsbot` adresine iletin
    - veya `openclaw logs --follow` üzerinden `chat.id` değerini okuyun
    - veya Bot API `getUpdates` çıktısını inceleyin
    - grup izinli hale geldikten sonra yerel komutlar etkinse `/whoami@<bot_username>` çalıştırın

  </Tab>
</Tabs>

## Çalışma zamanı davranışı

- Telegram, Gateway sürecine aittir.
- Yönlendirme deterministiktir: Telegram'dan gelen iletiler yine Telegram'a yanıtlanır (model kanalları seçmez).
- Gelen iletiler; yanıt meta verileri, medya yer tutucuları ve Gateway'in gözlemlediği Telegram yanıtları için kalıcı yanıt zinciri bağlamıyla paylaşılan kanal zarfına normalize edilir.
- Grup oturumları grup kimliğine göre yalıtılır. Forum konuları, konuları yalıtılmış tutmak için `:topic:<threadId>` ekler.
- DM iletileri `message_thread_id` taşıyabilir; OpenClaw bunu yanıtlar için korur. DM konu oturumları yalnızca Telegram `getMe` bot için `has_topics_enabled: true` bildirdiğinde ayrılır; aksi halde DM'ler düz oturumda kalır.
- Uzun yoklama, sohbet başına/konu başına sıralamayla grammY runner kullanır. Genel runner sink eşzamanlılığı `agents.defaults.maxConcurrent` kullanır.
- Çok hesaplı başlatma, büyük bot filolarının her hesap yoklamasını aynı anda yaymaması için eşzamanlı Telegram `getMe` yoklamalarını sınırlar.
- Uzun yoklama her Gateway süreci içinde korunur, böylece bir bot token'ını aynı anda yalnızca bir etkin poller kullanabilir. Hala `getUpdates` 409 çakışmaları görüyorsanız, muhtemelen başka bir OpenClaw Gateway, betik veya harici poller aynı token'ı kullanıyordur.
- Uzun yoklama watchdog yeniden başlatmaları, varsayılan olarak tamamlanmış `getUpdates` canlılığı olmadan 120 saniye sonra tetiklenir. `channels.telegram.pollingStallThresholdMs` değerini yalnızca dağıtımınız uzun süren işler sırasında hala hatalı yoklama takılması yeniden başlatmaları görüyorsa artırın. Değer milisaniye cinsindedir ve `30000` ile `600000` arasında olabilir; hesap başına geçersiz kılmalar desteklenir.
- Telegram Bot API okundu bilgisi desteğine sahip değildir (`sendReadReceipts` geçerli değildir).

<Note>
  `channels.telegram.dm.threadReplies` ve `channels.telegram.direct.<chatId>.threadReplies` kaldırıldı. Yapılandırmanızda hala bu anahtarlar varsa yükseltmeden sonra `openclaw doctor --fix` çalıştırın. DM konu yönlendirmesi artık Telegram `getMe.has_topics_enabled` üzerinden gelen bot yeteneğini izler; bu yetenek BotFather iş parçacıklı mod tarafından kontrol edilir: konuları etkin botlar, Telegram `message_thread_id` gönderdiğinde iş parçacığı kapsamlı DM oturumları kullanır; diğer DM'ler düz oturumda kalır.
</Note>

## Özellik başvurusu

<AccordionGroup>
  <Accordion title="Canlı akış önizlemesi (ileti düzenlemeleri)">
    OpenClaw kısmi yanıtları gerçek zamanlı olarak akıtabilir:

    - doğrudan sohbetler: önizleme iletisi + `editMessageText`
    - gruplar/konular: önizleme iletisi + `editMessageText`

    Gereksinim:

    - `channels.telegram.streaming`, `off | partial | block | progress` olur (varsayılan: `partial`)
    - kısa ilk yanıt önizlemeleri debounce edilir, ardından çalıştırma hala etkinse sınırlı bir gecikmeden sonra somutlaştırılır
    - `progress`, araç ilerlemesi için düzenlenebilir tek bir durum taslağını tutar, araç ilerlemesinden önce yanıt etkinliği geldiğinde kararlı durum etiketini gösterir, tamamlandığında temizler ve son yanıtı normal ileti olarak gönderir
    - `streaming.preview.toolProgress`, araç/ilerleme güncellemelerinin aynı düzenlenen önizleme iletisini yeniden kullanıp kullanmayacağını denetler (varsayılan: önizleme akışı etkinken `true`)
    - `streaming.preview.commandText`, bu araç ilerleme satırlarının içindeki komut/exec ayrıntısını denetler: `raw` (varsayılan, yayımlanmış davranışı korur) veya `status` (yalnızca araç etiketi)
    - `streaming.progress.commentary` (varsayılan: `false`), geçici ilerleme taslağında assistant yorum/preamble metnini etkinleştirir
    - eski `channels.telegram.streamMode`, boolean `streaming` değerleri ve emekli edilmiş yerel taslak önizleme anahtarları algılanır; bunları güncel akış yapılandırmasına taşımak için `openclaw doctor --fix` çalıştırın

    Araç ilerleme önizleme güncellemeleri, araçlar çalışırken gösterilen kısa durum satırlarıdır; örneğin komut yürütme, dosya okumaları, planlama güncellemeleri, patch özetleri veya Codex app-server modunda Codex preamble/yorum metni. Telegram, `v2026.4.22` ve sonrası yayımlanmış OpenClaw davranışıyla eşleşmesi için bunları varsayılan olarak etkin tutar.

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

    `streaming.mode: "off"` seçeneğini yalnızca yalnızca-son teslimat istediğinizde kullanın: Telegram önizleme düzenlemeleri devre dışı bırakılır ve genel araç/ilerleme sohbeti bağımsız durum iletileri olarak gönderilmek yerine bastırılır. Onay istemleri, medya yükleri ve hatalar normal son teslimat üzerinden yönlendirilmeye devam eder. Yalnızca araç ilerleme durum satırlarını gizlerken yanıt önizleme düzenlemelerini korumak istediğinizde `streaming.preview.toolProgress: false` kullanın.

    <Note>
      Telegram seçili alıntı yanıtları istisnadır. `replyToMode`, `"first"`, `"all"` veya `"batched"` olduğunda ve gelen ileti seçili alıntı metni içerdiğinde OpenClaw, son yanıtı yanıt önizlemesini düzenlemek yerine Telegram'ın yerel alıntı-yanıt yolu üzerinden gönderir; bu nedenle `streaming.preview.toolProgress` o tur için kısa durum satırlarını gösteremez. Seçili alıntı metni olmayan geçerli ileti yanıtları yine önizleme akışını korur. Araç ilerleme görünürlüğü yerel alıntı yanıtlarından daha önemli olduğunda `replyToMode: "off"` ayarlayın veya bu ödünleşimi kabul etmek için `streaming.preview.toolProgress: false` ayarlayın.
    </Note>

    Yalnızca metin yanıtları için:

    - kısa DM/grup/konu önizlemeleri: OpenClaw aynı önizleme iletisini korur ve son düzenlemeyi yerinde yapar
    - birden fazla Telegram iletisine bölünen uzun son metinler, mümkün olduğunda mevcut önizlemeyi ilk son parça olarak yeniden kullanır, sonra yalnızca kalan parçaları gönderir
    - ilerleme modu son yanıtları durum taslağını temizler ve taslağı yanıta düzenlemek yerine normal son teslimatı kullanır
    - tamamlanan metin onaylanmadan önce son düzenleme başarısız olursa OpenClaw normal son teslimatı kullanır ve eski önizlemeyi temizler

    Karmaşık yanıtlar için (örneğin medya yükleri), OpenClaw normal son teslimata geri döner ve ardından önizleme iletisini temizler.

    Önizleme akışı, blok akışından ayrıdır. Blok akışı Telegram için açıkça etkinleştirildiğinde OpenClaw çift akışı önlemek için önizleme akışını atlar.

    Akıl yürütme akışı davranışı:

    - `/reasoning stream`, desteklenen bir kanalın akıl yürütme önizleme yolunu kullanır; Telegram'da üretim sırasında akıl yürütmeyi canlı önizlemeye akıtır
    - akıl yürütme önizlemesi son teslimattan sonra silinir; akıl yürütmenin görünür kalması gerektiğinde `/reasoning on` kullanın
    - son yanıt akıl yürütme metni olmadan gönderilir

  </Accordion>

  <Accordion title="Zengin ileti biçimlendirmesi">
    Giden metin, yanıtların güncel Telegram istemcilerinde okunabilir kalması için varsayılan olarak standart Telegram HTML iletileri kullanır. Bu uyumluluk modu normal kalın, italik, bağlantı, kod, spoiler ve alıntıları destekler; ancak yerel tablolar, ayrıntılar, zengin medya ve formüller gibi Bot API 10.1'e özgü zengin blokları desteklemez.

    Bot API 10.1 zengin iletilerini etkinleştirmek için `channels.telegram.richMessages: true` ayarlayın:

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

    - Aracıya, bu bot/hesap için Telegram zengin iletilerinin kullanılabilir olduğu söylenir.
    - Markdown metni OpenClaw'ın Markdown IR'ı üzerinden işlenir ve Telegram zengin HTML olarak gönderilir.
    - Açık zengin HTML yükleri başlıklar, tablolar, ayrıntılar, zengin medya ve formüller gibi desteklenen Bot API 10.1 etiketlerini korur.
    - Medya açıklamaları yine Telegram HTML açıklamaları kullanır, çünkü zengin iletiler açıklamaların yerini almaz.

    Bu, model metnini Telegram Rich Markdown işaretlerinden uzak tutar; böylece `$400-600K` gibi para birimleri matematik olarak ayrıştırılmaz. Uzun zengin metin, Telegram'ın zengin metin ve zengin blok sınırları boyunca otomatik olarak bölünür. Telegram'ın sütun sınırını aşan tablolar kod blokları olarak gönderilir.

    Varsayılan: istemci uyumluluğu için kapalı. Zengin iletiler uyumlu Telegram istemcileri gerektirir; bazı güncel Desktop, Web, Android ve üçüncü taraf istemciler kabul edilen zengin iletileri desteklenmiyor olarak gösterir. Botla kullanılan her istemci bunları işleyemediği sürece bu seçeneği devre dışı bırakın. `/status`, geçerli Telegram oturumunda zengin iletilerin açık mı kapalı mı olduğunu gösterir.

    Bağlantı önizlemeleri varsayılan olarak etkindir. `channels.telegram.linkPreview: false`, zengin metin için otomatik varlık algılamasını atlar.

  </Accordion>

  <Accordion title="Yerel komutlar ve özel komutlar">
    Telegram komut menüsü kaydı başlangıçta `setMyCommands` ile ele alınır.

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

    - adlar normalize edilir (baştaki `/` kaldırılır, küçük harfe çevrilir)
    - geçerli desen: `a-z`, `0-9`, `_`, uzunluk `1..32`
    - özel komutlar yerel komutları geçersiz kılamaz
    - çakışmalar/yinelenenler atlanır ve günlüğe yazılır

    Notlar:

    - özel komutlar yalnızca menü girişleridir; davranışı otomatik olarak uygulamazlar
    - plugin/skill komutları, Telegram menüsünde gösterilmese bile yazıldığında çalışabilir

    Yerel komutlar devre dışıysa yerleşikler kaldırılır. Özel/plugin komutları yapılandırıldıysa yine de kaydolabilir.

    Yaygın kurulum hataları:

    - `BOT_COMMANDS_TOO_MUCH` ile `setMyCommands failed`, Telegram menüsünün kırpmadan sonra hala taştığı anlamına gelir; plugin/skill/özel komutları azaltın veya `channels.telegram.commands.native` seçeneğini devre dışı bırakın.
    - Doğrudan Bot API curl komutları çalışırken `deleteWebhook`, `deleteMyCommands` veya `setMyCommands` işleminin `404: Not Found` ile başarısız olması, `channels.telegram.apiRoot` değerinin tam `/bot<TOKEN>` uç noktasına ayarlandığı anlamına gelebilir. `apiRoot` yalnızca Bot API kökü olmalıdır ve `openclaw doctor --fix` yanlışlıkla eklenen sonda `/bot<TOKEN>` kısmını kaldırır.
    - `getMe returned 401`, Telegram'ın yapılandırılan bot token'ını reddettiği anlamına gelir. `botToken`, `tokenFile` veya `TELEGRAM_BOT_TOKEN` değerini güncel BotFather token'ıyla güncelleyin; OpenClaw yoklamadan önce durur, bu nedenle bu bir Webhook temizleme hatası olarak raporlanmaz.
    - Ağ/fetch hatalarıyla `setMyCommands failed` genellikle `api.telegram.org` için giden DNS/HTTPS'nin engellendiği anlamına gelir.

    ### Cihaz eşleştirme komutları (`device-pair` plugin)

    `device-pair` plugin'i yüklendiğinde:

    1. `/pair` kurulum kodu üretir
    2. kodu iOS uygulamasına yapıştırın
    3. `/pair pending` bekleyen istekleri listeler (rol/kapsamlar dahil)
    4. isteği onaylayın:
       - açık onay için `/pair approve <requestId>`
       - yalnızca bir bekleyen istek olduğunda `/pair approve`
       - en yeni için `/pair approve latest`

    Kurulum kodu kısa ömürlü bir bootstrap token'ı taşır. Yerleşik kurulum kodu bootstrap'i, `scopes: []` ile dayanıklı bir node token'ı ve güvenilir mobil onboarding için sınırlı bir operatör devretme token'ı döndürür. Bu operatör token'ı kurulum zamanı yerel yapılandırmasını okuyabilir, ancak eşleştirme mutasyon kapsamları veya `operator.admin` vermez.

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

    Telegram `web_app` düğmeleri yalnızca bir kullanıcı ile bot arasındaki özel
    sohbetlerde çalışır.

    Kayıtlı bir Plugin etkileşimli işleyicisi tarafından üstlenilmeyen geri çağırma
    tıklamaları ajana metin olarak iletilir:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="Ajanlar ve otomasyon için Telegram mesaj eylemleri">
    Telegram araç eylemleri şunları içerir:

    - `sendMessage` (`to`, `content`, isteğe bağlı `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content` veya `caption`, isteğe bağlı `presentation` satır içi düğmeleri; yalnızca düğme düzenlemeleri yanıt işaretlemesini günceller)
    - `createForumTopic` (`chatId`, `name`, isteğe bağlı `iconColor`, `iconCustomEmojiId`)

    Kanal mesaj eylemleri ergonomik takma adlar sunar (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Geçit denetimleri:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (varsayılan: devre dışı)

    Not: `edit` ve `topic-create` şu anda varsayılan olarak etkindir ve ayrı `channels.telegram.actions.*` anahtarları yoktur.
    Çalışma zamanı gönderimleri etkin yapılandırma/gizli bilgiler anlık görüntüsünü (başlatma/yeniden yükleme) kullanır, bu nedenle eylem yolları her gönderim için geçici SecretRef yeniden çözümlemesi yapmaz.

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

    Yanıt iş parçacığı etkinleştirildiğinde ve özgün Telegram metni veya başlığı kullanılabilir olduğunda, OpenClaw otomatik olarak yerel bir Telegram alıntı kesiti ekler. Telegram yerel alıntı metnini 1024 UTF-16 kod birimiyle sınırlar; bu nedenle daha uzun mesajlar baştan alıntılanır ve Telegram alıntıyı reddederse düz yanıta geri döner.

    Not: `off`, örtük yanıt iş parçacığını devre dışı bırakır. Açık `[[reply_to_*]]` etiketleri yine de uygulanır.

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

    Konu kalıtımı: konu girdileri geçersiz kılınmadıkça grup ayarlarını devralır (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` yalnızca konuya özeldir ve grup varsayılanlarından devralınmaz.
    `topics."*"` o gruptaki her konu için varsayılanları ayarlar; kesin konu kimlikleri yine de `"*"` üzerinde önceliklidir.

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

    **Kalıcı ACP konu bağlama**: Forum konuları, üst düzey türlenmiş ACP bağlamaları (`type: "acp"` ve `match.channel: "telegram"`, `peer.kind: "group"` içeren `bindings[]` ve `-1001234567890:topic:42` gibi konu nitelemeli bir kimlik) üzerinden ACP harness oturumlarını sabitleyebilir. Şu anda gruplardaki/süper gruplardaki forum konularıyla sınırlıdır. Bkz. [ACP Ajanları](/tr/tools/acp-agents).

    **Sohbetten iş parçacığına bağlı ACP başlatma**: `/acp spawn <agent> --thread here|auto` geçerli konuyu yeni bir ACP oturumuna bağlar; takip mesajları doğrudan oraya yönlendirilir. OpenClaw başlatma onayını konu içinde sabitler. `channels.telegram.threadBindings.spawnSessions` etkin kalmalıdır (varsayılan: `true`).

    Şablon bağlamı `MessageThreadId` ve `IsForum` değerlerini sunar. `message_thread_id` içeren DM sohbetleri yanıt meta verilerini korur; yalnızca Telegram `getMe` bot için `has_topics_enabled: true` bildirdiğinde iş parçacığı farkındalığı olan oturum anahtarlarını kullanırlar.
    Önceki `dm.threadReplies` ve `direct.*.threadReplies` geçersiz kılmaları bilinçli olarak emekliye ayrıldı; tek doğruluk kaynağı olarak BotFather iş parçacıklı modunu kullanın ve eski yapılandırma anahtarlarını kaldırmak için `openclaw doctor --fix` çalıştırın.

  </Accordion>

  <Accordion title="Ses, video ve çıkartmalar">
    ### Sesli mesajlar

    Telegram, ses notlarını ses dosyalarından ayırır.

    - varsayılan: ses dosyası davranışı
    - ses notu gönderimini zorlamak için ajan yanıtında `[[audio_as_voice]]` etiketi
    - gelen ses notu transkriptleri ajan bağlamında makine tarafından oluşturulmuş,
      güvenilmeyen metin olarak çerçevelenir; bahsetme algılama yine de ham
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

    Çıkartma açıklamaları, tekrarlanan görüntü çağrılarını azaltmak için OpenClaw SQLite plugin durumunda önbelleğe alınır.

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
    Telegram tepkileri, ileti yüklerinden ayrı olarak `message_reaction` güncellemeleri şeklinde gelir.

    Etkinleştirildiğinde OpenClaw şu tür sistem olaylarını kuyruğa alır:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Yapılandırma:

    - `channels.telegram.reactionNotifications`: `off | own | all` (varsayılan: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (varsayılan: `minimal`)

    Notlar:

    - `own`, yalnızca bot tarafından gönderilen mesajlara verilen kullanıcı tepkileri anlamına gelir (gönderilmiş mesaj önbelleği üzerinden en iyi çaba).
    - Tepki olayları yine de Telegram erişim kontrollerine (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`) uyar; yetkisiz gönderenler bırakılır.
    - Telegram, tepki güncellemelerinde konu kimlikleri sağlamaz.
      - forum olmayan gruplar grup sohbeti oturumuna yönlendirilir
      - forum grupları, tam kaynak konuya değil, grubun genel konu oturumuna (`:topic:1`) yönlendirilir

    Yoklama/webhook için `allowed_updates`, `message_reaction` değerini otomatik olarak içerir.

  </Accordion>

  <Accordion title="Ack tepkileri">
    `ackReaction`, OpenClaw gelen bir mesajı işlerken bir onay emojisi gönderir. `ackReactionScope`, bu emojinin gerçekte *ne zaman* gönderileceğine karar verir.

    **Emoji (`ackReaction`) çözümleme sırası:**

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - aracı kimliği emoji yedeği (`agents.list[].identity.emoji`, aksi halde "👀")

    Notlar:

    - Telegram unicode emoji bekler (örneğin "👀").
    - Bir kanal veya hesap için tepkiyi devre dışı bırakmak üzere `""` kullanın.

    **Kapsam (`messages.ackReactionScope`):**

    Telegram sağlayıcısı kapsamı `messages.ackReactionScope` değerinden okur (varsayılan `"group-mentions"`). Bugün Telegram hesabı veya Telegram kanalı düzeyinde geçersiz kılma yoktur.

    Değerler: `"all"` (DM'ler + gruplar), `"direct"` (yalnızca DM'ler), `"group-all"` (her grup mesajı, DM yok), `"group-mentions"` (bot belirtildiğinde gruplar; **DM yok** — varsayılan budur), `"off"` / `"none"` (devre dışı).

    <Note>
    Varsayılan kapsam (`"group-mentions"`), doğrudan mesajlarda ack tepkilerini tetiklemez. Gelen Telegram DM'lerinde ack tepkisi almak için `messages.ackReactionScope` değerini `"direct"` veya `"all"` olarak ayarlayın. Değer, Telegram sağlayıcısı başlangıcında okunur; bu nedenle değişikliğin etkili olması için Gateway yeniden başlatması gerekir.
    </Note>

  </Accordion>

  <Accordion title="Telegram olaylarından ve komutlarından yapılandırma yazımları">
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

  <Accordion title="Uzun yoklama ile webhook karşılaştırması">
    Varsayılan uzun yoklamadır. Webhook modu için `channels.telegram.webhookUrl` ve `channels.telegram.webhookSecret` değerlerini ayarlayın; isteğe bağlı `webhookPath`, `webhookHost`, `webhookPort` (varsayılanlar `/telegram-webhook`, `127.0.0.1`, `8787`).

    Uzun yoklama modunda OpenClaw, yeniden başlatma filigranını yalnızca bir güncelleme başarıyla dağıtıldıktan sonra kalıcı hale getirir. Bir işleyici başarısız olursa, bu güncelleme aynı süreçte yeniden denenebilir durumda kalır ve yeniden başlatma tekilleştirmesi için tamamlandı olarak yazılmaz.

    Yerel dinleyici `127.0.0.1:8787` adresine bağlanır. Herkese açık giriş için yerel bağlantı noktasının önüne bir ters proxy koyun ya da bilinçli olarak `webhookHost: "0.0.0.0"` ayarlayın.

    Webhook modu, Telegram'a `200` döndürmeden önce istek korumalarını, Telegram gizli belirtecini ve JSON gövdesini doğrular.
    Ardından OpenClaw güncellemeyi, uzun yoklamanın kullandığı aynı sohbet başına/konu başına bot hatları üzerinden eşzamansız olarak işler; böylece yavaş aracı turları Telegram'ın teslim ACK'sini bekletmez.

  </Accordion>

  <Accordion title="Sınırlar, yeniden deneme ve CLI hedefleri">
    - `channels.telegram.textChunkLimit` varsayılanı 4000'dir.
    - `channels.telegram.chunkMode="newline"`, uzunluğa göre bölmeden önce paragraf sınırlarını (boş satırlar) tercih eder.
    - `channels.telegram.mediaMaxMb` (varsayılan 100), gelen ve giden Telegram medya boyutunu sınırlar.
    - `channels.telegram.mediaGroupFlushMs` (varsayılan 500), Telegram albümlerinin/medya gruplarının OpenClaw tarafından tek bir gelen mesaj olarak gönderilmeden önce ne kadar süre arabelleğe alınacağını kontrol eder. Albüm parçaları geç geliyorsa artırın; albüm yanıt gecikmesini azaltmak için düşürün.
    - `channels.telegram.timeoutSeconds`, Telegram API istemcisi zaman aşımını geçersiz kılar (ayarlanmamışsa grammY varsayılanı uygulanır). Bot istemcileri, yapılandırılan değerleri 60 saniyelik giden metin/yazıyor isteği korumasının altında sınırlayarak grammY'nin OpenClaw'ın taşıma koruması ve geri dönüşü çalışmadan önce görünür yanıt teslimini iptal etmesini önler. Uzun yoklama hâlâ 45 saniyelik bir `getUpdates` isteği koruması kullanır, böylece boşta kalan yoklamalar süresiz olarak terk edilmez.
    - `channels.telegram.pollingStallThresholdMs` varsayılan olarak `120000` değerindedir; yalnızca yanlış pozitif yoklama takılması yeniden başlatmaları için `30000` ile `600000` arasında ayarlayın.
    - grup bağlam geçmişi `channels.telegram.historyLimit` veya `messages.groupChat.historyLimit` (varsayılan 50) kullanır; `0` devre dışı bırakır.
    - yanıt/alıntı/iletme ek bağlamı, Gateway üst mesajları gözlemlediğinde seçili tek bir konuşma bağlamı penceresine normalleştirilir; gözlemlenen mesaj önbelleği OpenClaw SQLite Plugin durumunda bulunur ve `openclaw doctor --fix` eski yan dosyaları içe aktarır. Telegram güncellemelerde yalnızca tek bir sığ `reply_to_message` içerir, bu yüzden önbellekten daha eski zincirler Telegram'ın mevcut güncelleme yüküyle sınırlıdır.
    - Telegram izin listeleri öncelikli olarak agent'ı kimin tetikleyebileceğini denetler; tam bir ek bağlam redaksiyon sınırı değildir.
    - DM geçmişi denetimleri:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - `channels.telegram.retry` yapılandırması, kurtarılabilir giden API hataları için Telegram gönderme yardımcılarına (CLI/araçlar/eylemler) uygulanır. Gelen son yanıt teslimi de Telegram bağlantı öncesi hataları için sınırlı güvenli gönderme yeniden denemesi kullanır, ancak görünür mesajları çoğaltabilecek belirsiz gönderim sonrası ağ zarflarını yeniden denemez.

    CLI ve mesaj aracı gönderme hedefleri sayısal sohbet kimliği, kullanıcı adı veya forum konusu hedefi olabilir:

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

    Yalnızca Telegram yoklama bayrakları:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - forum konuları için `--thread-id` (veya bir `:topic:` hedefi kullanın)

    Telegram gönderimi ayrıca şunları destekler:

    - `channels.telegram.capabilities.inlineButtons` izin verdiğinde satır içi klavyeler için `buttons` bloklarıyla `--presentation`
    - bot o sohbette sabitleyebildiğinde sabitlenmiş teslim istemek için `--pin` veya `--delivery '{"pin":true}'`
    - giden görselleri, GIF'leri ve videoları sıkıştırılmış fotoğraf, animasyonlu medya veya video yüklemeleri yerine belge olarak göndermek için `--force-document`

    Eylem denetimi:

    - `channels.telegram.actions.sendMessage=false`, yoklamalar dahil giden Telegram mesajlarını devre dışı bırakır
    - `channels.telegram.actions.poll=false`, normal gönderimleri etkin bırakırken Telegram yoklaması oluşturmayı devre dışı bırakır

  </Accordion>

  <Accordion title="Telegram'da exec onayları">
    Telegram, onaylayıcı DM'lerinde exec onaylarını destekler ve isteğe bağlı olarak istemleri kaynak sohbete veya konuya gönderebilir. Onaylayıcılar sayısal Telegram kullanıcı kimlikleri olmalıdır.

    Yapılandırma yolu:

    - `channels.telegram.execApprovals.enabled` (en az bir onaylayıcı çözümlenebildiğinde otomatik etkinleşir)
    - `channels.telegram.execApprovals.approvers` (`commands.ownerAllowFrom` içindeki sayısal sahip kimliklerine geri döner)
    - `channels.telegram.execApprovals.target`: `dm` (varsayılan) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` ve `defaultTo`, botla kimin konuşabileceğini ve normal yanıtları nereye göndereceğini kontrol eder. Birini exec onaylayıcısı yapmazlar. İlk onaylanmış DM eşleştirmesi, henüz komut sahibi yoksa `commands.ownerAllowFrom` öğesini başlatır; böylece tek sahipli kurulum, kimlikleri `execApprovals.approvers` altında çoğaltmadan çalışmaya devam eder.

    Kanal teslimi komut metnini sohbette gösterir; `channel` veya `both` seçeneklerini yalnızca güvenilir gruplarda/konularda etkinleştirin. İstem bir forum konusuna düştüğünde OpenClaw onay istemi ve devamı için konuyu korur. Exec onayları varsayılan olarak 30 dakika sonra sona erer.

    Satır içi onay düğmeleri ayrıca `channels.telegram.capabilities.inlineButtons` öğesinin hedef yüzeye (`dm`, `group` veya `all`) izin vermesini gerektirir. `plugin:` ön ekiyle başlayan onay kimlikleri Plugin onayları üzerinden çözümlenir; diğerleri önce exec onayları üzerinden çözümlenir.

    Bkz. [Exec onayları](/tr/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Hata yanıtı denetimleri

Agent bir teslim veya sağlayıcı hatasıyla karşılaştığında, hata politikası hata mesajlarının Telegram sohbetine gönderilip gönderilmeyeceğini kontrol eder:

| Anahtar                             | Değerler                   | Varsayılan      | Açıklama                                                                                                                                                                                                 |
| ----------------------------------- | -------------------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `always`, `once`, `silent` | `always`        | `always` — her hata mesajını sohbete gönder. `once` — her benzersiz hata mesajını bekleme penceresi başına bir kez gönder (tekrarlanan aynı hataları bastır). `silent` — hata mesajlarını sohbete asla gönderme. |
| `channels.telegram.errorCooldownMs` | sayı (ms)                  | `14400000` (4s) | `once` politikası için bekleme penceresi. Bir hata gönderildikten sonra aynı hata mesajı bu aralık dolana kadar bastırılır. Kesintiler sırasında hata spam'ini önler.                                      |

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
  <Accordion title="Bot, bahsedilmeyen grup mesajlarına yanıt vermiyor">

    - `requireMention=false` ise Telegram gizlilik modu tam görünürlüğe izin vermelidir.
      - BotFather: `/setprivacy` -> Devre dışı bırak
      - ardından botu gruptan çıkarıp yeniden ekleyin
    - `openclaw channels status`, yapılandırma bahsedilmeyen grup mesajları beklediğinde uyarır.
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
    - grup politikası `open` olsa bile komut yetkilendirmesi hâlâ uygulanır
    - `BOT_COMMANDS_TOO_MUCH` ile `setMyCommands failed`, yerel menüde çok fazla giriş olduğu anlamına gelir; Plugin/skill/özel komutları azaltın veya yerel menüleri devre dışı bırakın
    - `deleteMyCommands` / `setMyCommands` başlangıç çağrıları ve `sendChatAction` yazıyor çağrıları sınırlıdır ve istek zaman aşımında Telegram'ın taşıma geri dönüşü üzerinden bir kez yeniden denenir. Kalıcı ağ/fetch hataları genellikle `api.telegram.org` için DNS/HTTPS erişilebilirliği sorunlarını gösterir

  </Accordion>

  <Accordion title="Başlangıç yetkisiz token bildiriyor">

    - `getMe returned 401`, yapılandırılan bot token'ı için bir Telegram kimlik doğrulama hatasıdır.
    - BotFather'da bot token'ını yeniden kopyalayın veya yeniden oluşturun, ardından varsayılan hesap için `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken` veya `TELEGRAM_BOT_TOKEN` öğesini güncelleyin.
    - Başlangıç sırasında `deleteWebhook 401 Unauthorized` da bir kimlik doğrulama hatasıdır; bunu "webhook yok" olarak ele almak, aynı hatalı token sorununu yalnızca sonraki API çağrılarına ertelemiş olur.

  </Accordion>

  <Accordion title="Yoklama veya ağ kararsızlığı">

    - Node 22+ ve özel fetch/proxy, AbortSignal türleri uyuşmazsa anında iptal davranışını tetikleyebilir.
    - Bazı ana makineler `api.telegram.org` adresini önce IPv6'ya çözümler; bozuk IPv6 çıkışı aralıklı Telegram API hatalarına neden olabilir.
    - Günlükler `TypeError: fetch failed` veya `Network request for 'getUpdates' failed!` içeriyorsa, OpenClaw artık bunları kurtarılabilir ağ hataları olarak yeniden dener.
    - Yoklama başlangıcı sırasında OpenClaw, grammY için başarılı başlangıç `getMe` yoklamasını yeniden kullanır, böylece çalıştırıcının ilk `getUpdates` öncesinde ikinci bir `getMe` çağrısına ihtiyacı olmaz.
    - Yoklama başlangıcı sırasında `deleteWebhook` geçici bir ağ hatasıyla başarısız olursa OpenClaw başka bir yoklama öncesi denetim düzlemi çağrısı yapmak yerine uzun yoklamaya devam eder. Hâlâ etkin olan bir webhook `getUpdates` çakışması olarak görünür; ardından OpenClaw Telegram taşımasını yeniden oluşturur ve webhook temizliğini yeniden dener.
    - Telegram soketleri kısa ve sabit bir ritimde yeniden oluşturuluyorsa düşük bir `channels.telegram.timeoutSeconds` olup olmadığını denetleyin; bot istemcileri yapılandırılmış değerleri giden ve `getUpdates` isteği korumalarının altında sınırlar, ancak eski sürümler bu değer korumaların altına ayarlandığında her yoklamayı veya yanıtı iptal edebiliyordu.
    - Günlükler `Polling stall detected` içeriyorsa OpenClaw, varsayılan olarak tamamlanmış uzun yoklama canlılığı olmadan geçen 120 saniyeden sonra yoklamayı yeniden başlatır ve Telegram taşımasını yeniden oluşturur.
    - `openclaw channels status --probe` ve `openclaw doctor`, çalışan bir yoklama hesabı başlangıç toleransından sonra `getUpdates` tamamlamadığında, çalışan bir webhook hesabı başlangıç toleransından sonra `setWebhook` tamamlamadığında veya son başarılı yoklama taşıma etkinliği bayatladığında uyarır.
    - `channels.telegram.pollingStallThresholdMs` değerini yalnızca uzun süre çalışan `getUpdates` çağrıları sağlıklı olduğu halde ana makineniz hâlâ yanlış yoklama takılması yeniden başlatmaları bildiriyorsa artırın. Kalıcı takılmalar genellikle ana makine ile `api.telegram.org` arasındaki proxy, DNS, IPv6 veya TLS çıkış sorunlarına işaret eder.
    - Telegram ayrıca Bot API taşıması için `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` ve bunların küçük harfli varyantları dahil süreç proxy ortam değişkenlerini dikkate alır. `NO_PROXY` / `no_proxy` yine de `api.telegram.org` için proxy'yi atlayabilir.
    - OpenClaw yönetimli proxy bir hizmet ortamı için `OPENCLAW_PROXY_URL` üzerinden yapılandırılmışsa ve standart proxy ortam değişkeni yoksa Telegram da Bot API taşıması için bu URL'yi kullanır.
    - Kararsız doğrudan çıkış/TLS olan VPS ana makinelerinde Telegram API çağrılarını `channels.telegram.proxy` üzerinden yönlendirin:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ varsayılan olarak `autoSelectFamily=true` kullanır (WSL2 hariç). Telegram DNS sonuç sırası önce `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`, ardından `channels.telegram.network.dnsResultOrder`, ardından `NODE_OPTIONS=--dns-result-order=ipv4first` gibi süreç varsayılanını izler; hiçbiri geçerli değilse Node 22+ `ipv4first` değerine geri döner.
    - Ana makineniz WSL2 ise veya açıkça yalnızca IPv4 davranışıyla daha iyi çalışıyorsa, aile seçimini zorlayın:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - RFC 2544 kıyaslama aralığı yanıtlarına (`198.18.0.0/15`) Telegram medya indirmeleri için varsayılan olarak zaten izin verilir. Güvenilir bir fake-IP veya saydam proxy, medya indirmeleri sırasında `api.telegram.org` adresini başka bir özel/dahili/özel kullanımlı adrese yeniden yazıyorsa, yalnızca Telegram'a özgü bypass'ı etkinleştirebilirsiniz:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - Aynı etkinleştirme, hesap başına
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`
      konumunda da kullanılabilir.
    - Proxy'niz Telegram medya ana makinelerini `198.18.x.x` adreslerine çözümlüyorsa, önce
      tehlikeli bayrağı kapalı bırakın. Telegram medyası RFC 2544
      kıyaslama aralığına varsayılan olarak zaten izin verir.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork`, Telegram
      medya SSRF korumalarını zayıflatır. Bunu yalnızca RFC 2544 kıyaslama
      aralığının dışında özel veya özel kullanımlı yanıtlar sentezlediklerinde
      Clash, Mihomo veya Surge fake-IP yönlendirmesi gibi güvenilir, operatör
      denetimli proxy ortamları için kullanın. Normal genel internet Telegram
      erişimi için kapalı bırakın.
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

- başlangıç/kimlik doğrulama: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` normal bir dosyaya işaret etmelidir; sembolik bağlantılar reddedilir)
- erişim denetimi: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, üst düzey `bindings[]` (`type: "acp"`)
- konu varsayılanları: `groups.<chatId>.topics."*"` eşleşmeyen forum konularına uygulanır; tam konu kimlikleri bunu geçersiz kılar
- exec onayları: `execApprovals`, `accounts.*.execApprovals`
- komut/menü: `commands.native`, `commands.nativeSkills`, `customCommands`
- iş parçacıkları/yanıtlar: `replyToMode`
- akış: `streaming` (önizleme), `streaming.preview.toolProgress`, `blockStreaming`
- biçimlendirme/teslim: `textChunkLimit`, `chunkMode`, `richMessages`, `linkPreview`, `responsePrefix`
- medya/ağ: `mediaMaxMb`, `mediaGroupFlushMs`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- özel API kökü: `apiRoot` (yalnızca Bot API kökü; `/bot<TOKEN>` eklemeyin)
- webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- eylemler/yetenekler: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- tepkiler: `reactionNotifications`, `reactionLevel`
- hatalar: `errorPolicy`, `errorCooldownMs`
- yazımlar/geçmiş: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
Çok hesaplı öncelik: iki veya daha fazla hesap kimliği yapılandırıldığında, varsayılan yönlendirmeyi açık hale getirmek için `channels.telegram.defaultAccount` değerini ayarlayın (veya `channels.telegram.accounts.default` ekleyin). Aksi halde OpenClaw ilk normalize edilmiş hesap kimliğine geri döner ve `openclaw doctor` uyarı verir. Adlandırılmış hesaplar `channels.telegram.allowFrom` / `groupAllowFrom` değerlerini devralır, ancak `accounts.default.*` değerlerini devralmaz.
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
