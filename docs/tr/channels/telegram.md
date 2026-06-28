---
read_when:
    - Telegram özellikleri veya webhook'lar üzerinde çalışma
summary: Telegram bot destek durumu, yetenekleri ve yapılandırması
title: Telegram
x-i18n:
    generated_at: "2026-06-28T00:16:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f05ee57f06fe3b1c42ca19204bf74685ca3f05b1f02b9a6e36a7986e298b7edc
    source_path: channels/telegram.md
    workflow: 16
---

Bot DM'leri ve gruplar için grammY üzerinden production-ready. Varsayılan mod uzun yoklamadır; Webhook modu isteğe bağlıdır.

<CardGroup cols={3}>
  <Card title="Eşleştirme" icon="link" href="/tr/channels/pairing">
    Telegram için varsayılan DM politikası eşleştirmedir.
  </Card>
  <Card title="Kanal sorun giderme" icon="wrench" href="/tr/channels/troubleshooting">
    Kanallar arası tanılama ve onarım playbook'ları.
  </Card>
  <Card title="Gateway yapılandırması" icon="settings" href="/tr/gateway/configuration">
    Tam kanal yapılandırma desenleri ve örnekleri.
  </Card>
</CardGroup>

## Hızlı kurulum

<Steps>
  <Step title="BotFather'da bot token'ını oluşturun">
    Telegram'ı açın ve **@BotFather** ile sohbet edin (kullanıcı adının tam olarak `@BotFather` olduğunu doğrulayın).

    `/newbot` komutunu çalıştırın, yönergeleri izleyin ve token'ı kaydedin.

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
    Telegram, `openclaw channels login telegram` kullanmaz; token'ı yapılandırmada/env içinde ayarlayın, ardından gateway'i başlatın.

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
    - `channels.telegram.groups` altında anahtar olarak kullanılan Telegram grup sohbeti ID'si

    İlk kurulum için grup sohbeti ID'sini `openclaw logs --follow` çıktısından, yönlendirilmiş ID botundan veya Bot API `getUpdates` üzerinden alın. Grup izin verildikten sonra `/whoami@<bot_username>` kullanıcı ve grup ID'lerini doğrulayabilir.

    `-100` ile başlayan negatif Telegram süper grup ID'leri grup sohbeti ID'leridir. Bunları `groupAllowFrom` altına değil, `channels.telegram.groups` altına koyun.

  </Step>
</Steps>

<Note>
Token çözümleme sırası hesaba duyarlıdır. Pratikte yapılandırma değerleri env yedeğine göre önceliklidir ve `TELEGRAM_BOT_TOKEN` yalnızca varsayılan hesap için geçerlidir.
Başarılı bir başlatmadan sonra OpenClaw, yeniden başlatmaların fazladan bir Telegram `getMe` çağrısından kaçınabilmesi için bot kimliğini state dizininde 24 saate kadar önbelleğe alır; token'ın değiştirilmesi veya kaldırılması bu önbelleği temizler.
</Note>

## Telegram tarafı ayarları

<AccordionGroup>
  <Accordion title="Gizlilik modu ve grup görünürlüğü">
    Telegram botlarında varsayılan olarak **Privacy Mode** açıktır; bu, botların hangi grup mesajlarını alacağını sınırlar.

    Botun tüm grup mesajlarını görmesi gerekiyorsa şunlardan birini yapın:

    - `/setprivacy` üzerinden gizlilik modunu devre dışı bırakın veya
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

## Erişim denetimi ve etkinleştirme

### Grup bot kimliği

Telegram gruplarında ve forum konularında, yapılandırılmış bot kullanıcı adının açıkça anılması (örneğin `@my_bot`), agent persona adı Telegram kullanıcı adından farklı olsa bile seçili OpenClaw agent'ına hitap etmek olarak değerlendirilir. Grup sessizlik politikası ilgisiz grup trafiği için hâlâ geçerlidir, ancak bot kullanıcı adının kendisi "başka biri" sayılmaz.

<Tabs>
  <Tab title="DM politikası">
    `channels.telegram.dmPolicy` doğrudan mesaj erişimini denetler:

    - `pairing` (varsayılan)
    - `allowlist` (`allowFrom` içinde en az bir gönderen ID'si gerektirir)
    - `open` (`allowFrom` içinde `"*"` olmasını gerektirir)
    - `disabled`

    `allowFrom: ["*"]` ile `dmPolicy: "open"`, bot kullanıcı adını bulan veya tahmin eden herhangi bir Telegram hesabının bota komut vermesine izin verir. Bunu yalnızca araçları sıkı biçimde kısıtlanmış, özellikle herkese açık olması amaçlanan botlar için kullanın; tek sahipli botlar sayısal kullanıcı ID'leriyle `allowlist` kullanmalıdır.

    `channels.telegram.allowFrom` sayısal Telegram kullanıcı ID'lerini kabul eder. `telegram:` / `tg:` önekleri kabul edilir ve normalize edilir.
    Çok hesaplı yapılandırmalarda, kısıtlayıcı bir üst düzey `channels.telegram.allowFrom` güvenlik sınırı olarak değerlendirilir: hesap düzeyi `allowFrom: ["*"]` girdileri, birleştirme sonrasında etkin hesap izin listesi hâlâ açık bir joker karakter içermedikçe o hesabı herkese açık yapmaz.
    Boş `allowFrom` ile `dmPolicy: "allowlist"` tüm DM'leri engeller ve yapılandırma doğrulaması tarafından reddedilir.
    Kurulum yalnızca sayısal kullanıcı ID'leri ister.
    Yükseltme yaptıysanız ve yapılandırmanız `@username` izin listesi girdileri içeriyorsa, bunları çözmek için `openclaw doctor --fix` çalıştırın (best-effort; bir Telegram bot token'ı gerektirir).
    Daha önce eşleştirme deposu izin listesi dosyalarına güveniyorsanız, `openclaw doctor --fix` izin listesi akışlarında girdileri `channels.telegram.allowFrom` içine kurtarabilir (örneğin `dmPolicy: "allowlist"` henüz açık ID içermediğinde).

    Tek sahipli botlar için, erişim politikasını önceki eşleştirme onaylarına bağlı kalmak yerine yapılandırmada kalıcı tutmak amacıyla açık sayısal `allowFrom` ID'leriyle `dmPolicy: "allowlist"` tercih edin.

    Yaygın karışıklık: DM eşleştirme onayı, "bu gönderen her yerde yetkilidir" anlamına gelmez.
    Eşleştirme DM erişimi verir. Henüz komut sahibi yoksa, ilk onaylanan eşleştirme ayrıca `commands.ownerAllowFrom` değerini ayarlar; böylece yalnızca sahibin kullanabildiği komutlar ve exec onayları açık bir operatör hesabına sahip olur.
    Grup gönderen yetkilendirmesi hâlâ açık yapılandırma izin listelerinden gelir.
    "Bir kez yetkili olayım ve hem DM'ler hem de grup komutları çalışsın" istiyorsanız, sayısal Telegram kullanıcı ID'nizi `channels.telegram.allowFrom` içine koyun; yalnızca sahibin kullanabildiği komutlar için `commands.ownerAllowFrom` değerinin `telegram:<your user id>` içerdiğinden emin olun.

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

  <Tab title="Grup politikası ve izin listeleri">
    İki denetim birlikte uygulanır:

    1. **Hangi gruplara izin verilir** (`channels.telegram.groups`)
       - `groups` yapılandırması yok:
         - `groupPolicy: "open"` ile: herhangi bir grup grup ID'si denetimlerinden geçebilir
         - `groupPolicy: "allowlist"` (varsayılan) ile: `groups` girdileri (veya `"*"`) ekleyene kadar gruplar engellenir
       - `groups` yapılandırılmış: izin listesi gibi davranır (açık ID'ler veya `"*"`)

    2. **Gruplarda hangi gönderenlere izin verilir** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (varsayılan)
       - `disabled`

    `groupAllowFrom`, grup gönderen filtrelemesi için kullanılır. Ayarlanmamışsa Telegram `allowFrom` değerine geri döner.
    `groupAllowFrom` girdileri sayısal Telegram kullanıcı ID'leri olmalıdır (`telegram:` / `tg:` önekleri normalize edilir).
    Telegram grup veya süper grup sohbeti ID'lerini `groupAllowFrom` içine koymayın. Negatif sohbet ID'leri `channels.telegram.groups` altına aittir.
    Sayısal olmayan girdiler gönderen yetkilendirmesi için yok sayılır.
    Güvenlik sınırı (`2026.2.25+`): grup gönderen kimlik doğrulaması DM eşleştirme deposu onaylarını **devralmaz**.
    Eşleştirme yalnızca DM için kalır. Gruplar için `groupAllowFrom` veya grup başına/konu başına `allowFrom` ayarlayın.
    `groupAllowFrom` ayarlanmamışsa Telegram, eşleştirme deposuna değil yapılandırmadaki `allowFrom` değerine geri döner.
    Tek sahipli botlar için pratik desen: kullanıcı ID'nizi `channels.telegram.allowFrom` içinde ayarlayın, `groupAllowFrom` değerini boş bırakın ve hedef gruplara `channels.telegram.groups` altında izin verin.
    Çalışma zamanı notu: `channels.telegram` tamamen eksikse, `channels.defaults.groupPolicy` açıkça ayarlanmadığı sürece çalışma zamanı fail-closed `groupPolicy="allowlist"` varsayılanına döner.

    Yalnızca sahipli grup kurulumu:

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

    Bunu gruptan `@<bot_username> ping` ile test edin. `requireMention: true` iken düz grup mesajları botu tetiklemez.

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

      - `-1001234567890` gibi negatif Telegram grup veya süper grup sohbeti ID'lerini `channels.telegram.groups` altına koyun.
      - İzin verilen bir grup içindeki hangi kişilerin botu tetikleyebileceğini sınırlamak istediğinizde `8734062810` gibi Telegram kullanıcı ID'lerini `groupAllowFrom` altına koyun.
      - `groupAllowFrom: ["*"]` değerini yalnızca izin verilen bir grubun herhangi bir üyesinin botla konuşabilmesini istediğinizde kullanın.

    </Warning>

  </Tab>

  <Tab title="Mention davranışı">
    Grup yanıtları varsayılan olarak mention gerektirir.

    Mention şunlardan gelebilir:

    - yerel `@botusername` mention'ı veya
    - şuralardaki mention desenleri:
      - `agents.list[].groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    Oturum düzeyi komut anahtarları:

    - `/activation always`
    - `/activation mention`

    Bunlar yalnızca oturum state'ini günceller. Kalıcılık için yapılandırma kullanın.

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

    Grup geçmişi bağlamı varsayılan olarak `mention-only` olur: önceki grup mesajları
    yalnızca bota hitap ettiklerinde, bota verilen yanıtlar olduklarında
    veya botun kendi mesajları olduklarında dahil edilir. Güvenilen gruplar için
    yakın oda geçmişini dahil etmek üzere `includeGroupHistoryContext: "recent"` ayarlayın.
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

    Grup sohbeti ID'sini alma:

    - bir grup mesajını `@userinfobot` / `@getidsbot` adresine yönlendirin
    - veya `openclaw logs --follow` çıktısından `chat.id` değerini okuyun
    - veya Bot API `getUpdates` çıktısını inceleyin
    - grup izin verildikten sonra, yerel komutlar etkinse `/whoami@<bot_username>` çalıştırın

  </Tab>
</Tabs>

## Çalışma zamanı davranışı

- Telegram, Gateway sürecinin sorumluluğundadır.
- Yönlendirme deterministiktir: Telegram üzerinden gelen iletiler Telegram'a yanıtlanır (model kanal seçmez).
- Gelen iletiler, yanıt meta verileri, medya yer tutucuları ve Gateway'in gözlemlediği Telegram yanıtları için kalıcı yanıt zinciri bağlamıyla paylaşılan kanal zarfına normalize edilir.
- Grup oturumları grup kimliğine göre yalıtılır. Forum konuları, konuları yalıtılmış tutmak için `:topic:<threadId>` ekler.
- DM iletileri `message_thread_id` taşıyabilir; OpenClaw bunu yanıtlar için korur. DM konu oturumları yalnızca Telegram `getMe` bot için `has_topics_enabled: true` bildirdiğinde ayrılır; aksi halde DM'ler düz oturumda kalır.
- Uzun yoklama, sohbet başına/iş parçacığı başına sıralamayla grammY runner kullanır. Genel runner sink eşzamanlılığı `agents.defaults.maxConcurrent` kullanır.
- Çok hesaplı başlatma, büyük bot filolarının her hesap yoklamasını aynı anda yaymaması için eşzamanlı Telegram `getMe` yoklamalarını sınırlar.
- Uzun yoklama, her Gateway süreci içinde korunur; böylece aynı anda yalnızca bir aktif yoklayıcı bir bot token'ını kullanabilir. Hâlâ `getUpdates` 409 çakışmaları görüyorsanız, başka bir OpenClaw Gateway, betik veya harici yoklayıcı büyük olasılıkla aynı token'ı kullanıyordur.
- Uzun yoklama watchdog yeniden başlatmaları, varsayılan olarak 120 saniye boyunca tamamlanmış `getUpdates` canlılığı olmadığında tetiklenir. Dağıtımınız uzun süren işler sırasında hâlâ yanlış yoklama takılması yeniden başlatmaları görüyorsa `channels.telegram.pollingStallThresholdMs` değerini artırın. Değer milisaniye cinsindedir ve `30000` ile `600000` arasında izin verilir; hesap başına geçersiz kılmalar desteklenir.
- Telegram Bot API okundu bilgisi desteğine sahip değildir (`sendReadReceipts` geçerli değildir).

<Note>
  `channels.telegram.dm.threadReplies` ve `channels.telegram.direct.<chatId>.threadReplies` kaldırıldı. Yapılandırmanızda bu anahtarlar hâlâ varsa yükseltmeden sonra `openclaw doctor --fix` çalıştırın. DM konu yönlendirmesi artık Telegram `getMe.has_topics_enabled` üzerinden gelen bot yeteneğini izler; bu, BotFather iş parçacıklı modu tarafından kontrol edilir: konuları etkin botlar, Telegram `message_thread_id` gönderdiğinde iş parçacığı kapsamlı DM oturumları kullanır; diğer DM'ler düz oturumda kalır.
</Note>

## Özellik başvurusu

<AccordionGroup>
  <Accordion title="Canlı akış önizlemesi (ileti düzenlemeleri)">
    OpenClaw kısmi yanıtları gerçek zamanlı olarak akışa alabilir:

    - doğrudan sohbetler: önizleme iletisi + `editMessageText`
    - gruplar/konular: önizleme iletisi + `editMessageText`

    Gereksinim:

    - `channels.telegram.streaming`, `off | partial | block | progress` değerlerinden biridir (varsayılan: `partial`)
    - kısa ilk yanıt önizlemeleri debounce edilir, ardından çalışma hâlâ aktifse sınırlı bir gecikmeden sonra somutlaştırılır
    - `progress`, araç ilerlemesi için düzenlenebilir tek bir durum taslağı tutar, araç ilerlemesinden önce yanıt etkinliği gelirse kararlı durum etiketini gösterir, tamamlandığında temizler ve son yanıtı normal ileti olarak gönderir
    - `streaming.preview.toolProgress`, araç/ilerleme güncellemelerinin aynı düzenlenen önizleme iletisini yeniden kullanıp kullanmayacağını kontrol eder (varsayılan: önizleme akışı aktifken `true`)
    - `streaming.preview.commandText`, bu araç ilerleme satırlarındaki komut/exec ayrıntısını kontrol eder: `raw` (varsayılan, yayımlanmış davranışı korur) veya `status` (yalnızca araç etiketi)
    - `streaming.progress.commentary` (varsayılan: `false`), geçici ilerleme taslağında asistan yorum/preamble metnini etkinleştirir
    - eski `channels.telegram.streamMode`, boolean `streaming` değerleri ve kullanımdan kaldırılmış yerel taslak önizleme anahtarları algılanır; bunları güncel akış yapılandırmasına geçirmek için `openclaw doctor --fix` çalıştırın

    Araç ilerleme önizleme güncellemeleri, araçlar çalışırken gösterilen kısa durum satırlarıdır; örneğin komut yürütme, dosya okuma, planlama güncellemeleri, patch özetleri veya Codex app-server modunda Codex preamble/yorum metni. Telegram, `v2026.4.22` ve sonrasındaki yayımlanmış OpenClaw davranışıyla eşleşmesi için bunları varsayılan olarak etkin tutar.

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

    `streaming.mode: "off"` değerini yalnızca sadece son yanıt teslimi istediğinizde kullanın: Telegram önizleme düzenlemeleri devre dışı bırakılır ve genel araç/ilerleme sohbeti bağımsız durum iletileri olarak gönderilmek yerine bastırılır. Onay istemleri, medya payload'ları ve hatalar normal son teslim üzerinden yönlendirilmeye devam eder. Yalnızca araç ilerleme durum satırlarını gizlerken yanıt önizleme düzenlemelerini korumak istediğinizde `streaming.preview.toolProgress: false` kullanın.

    <Note>
      Telegram seçili alıntı yanıtları istisnadır. `replyToMode`, `"first"`, `"all"` veya `"batched"` olduğunda ve gelen ileti seçili alıntı metni içerdiğinde, OpenClaw son yanıtı yanıt önizlemesini düzenlemek yerine Telegram'ın yerel alıntı yanıt yolu üzerinden gönderir; bu yüzden `streaming.preview.toolProgress` o tur için kısa durum satırlarını gösteremez. Seçili alıntı metni olmayan geçerli ileti yanıtları önizleme akışını korumaya devam eder. Araç ilerlemesi görünürlüğü yerel alıntı yanıtlarından daha önemliyse `replyToMode: "off"` ayarlayın veya bu ödünleşimi kabul etmek için `streaming.preview.toolProgress: false` ayarlayın.
    </Note>

    Yalnızca metin yanıtları için:

    - kısa DM/grup/konu önizlemeleri: OpenClaw aynı önizleme iletisini korur ve son düzenlemeyi yerinde yapar
    - birden çok Telegram iletisine bölünen uzun metin sonları, mümkün olduğunda mevcut önizlemeyi ilk son parça olarak yeniden kullanır, ardından yalnızca kalan parçaları gönderir
    - ilerleme modu sonları, durum taslağını temizler ve taslağı yanıta düzenlemek yerine normal son teslimi kullanır
    - son düzenleme, tamamlanan metin onaylanmadan önce başarısız olursa OpenClaw normal son teslimi kullanır ve eski önizlemeyi temizler

    Karmaşık yanıtlar için (örneğin medya payload'ları), OpenClaw normal son teslime geri döner ve ardından önizleme iletisini temizler.

    Önizleme akışı, blok akışından ayrıdır. Blok akışı Telegram için açıkça etkinleştirildiğinde OpenClaw çift akışı önlemek için önizleme akışını atlar.

    Akıl yürütme akışı davranışı:

    - `/reasoning stream`, desteklenen bir kanalın akıl yürütme önizleme yolunu kullanır; Telegram'da, üretim sırasında akıl yürütmeyi canlı önizlemeye akışa alır
    - akıl yürütme önizlemesi son teslimden sonra silinir; akıl yürütmenin görünür kalması gerektiğinde `/reasoning on` kullanın
    - son yanıt akıl yürütme metni olmadan gönderilir

  </Accordion>

  <Accordion title="Zengin ileti biçimlendirmesi">
    Giden metin varsayılan olarak standart Telegram HTML iletilerini kullanır; böylece yanıtlar güncel Telegram istemcilerinde okunabilir kalır. Bu uyumluluk modu normal kalın, italik, bağlantı, kod, spoiler ve alıntıları destekler; ancak yerel tablolar, ayrıntılar, zengin medya ve formüller gibi Bot API 10.1'e özgü zengin blokları desteklemez.

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

    - Ajana, bu bot/hesap için Telegram zengin iletilerinin kullanılabilir olduğu söylenir.
    - Markdown metni OpenClaw'ın Markdown IR'ı üzerinden işlenir ve Telegram zengin HTML'i olarak gönderilir.
    - Açık zengin HTML payload'ları; başlıklar, tablolar, ayrıntılar, zengin medya ve formüller gibi desteklenen Bot API 10.1 etiketlerini korur.
    - Medya altyazıları zengin iletiler altyazıların yerini almadığı için hâlâ Telegram HTML altyazılarını kullanır.

    Bu, model metnini Telegram Rich Markdown işaretlerinden uzak tutar; böylece `$400-600K` gibi para birimleri matematik olarak ayrıştırılmaz. Uzun zengin metin, Telegram'ın zengin metin ve zengin blok sınırları boyunca otomatik olarak bölünür. Telegram'ın sütun sınırını aşan tablolar kod blokları olarak gönderilir.

    Varsayılan: istemci uyumluluğu için kapalı. Zengin iletiler uyumlu Telegram istemcileri gerektirir; bazı güncel Desktop, Web, Android ve üçüncü taraf istemciler kabul edilen zengin iletileri desteklenmiyor olarak gösterir. Botla kullanılan her istemci bunları işleyemiyorsa bu seçeneği devre dışı tutun. `/status`, geçerli Telegram oturumunda zengin iletilerin açık mı kapalı mı olduğunu gösterir.

    Bağlantı önizlemeleri varsayılan olarak etkindir. `channels.telegram.linkPreview: false`, zengin metin için otomatik varlık algılamasını atlar.

  </Accordion>

  <Accordion title="Yerel komutlar ve özel komutlar">
    Telegram komut menüsü kaydı başlatma sırasında `setMyCommands` ile işlenir.

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

    - adlar normalize edilir (baştaki `/` kaldırılır, küçük harfe çevrilir)
    - geçerli örüntü: `a-z`, `0-9`, `_`, uzunluk `1..32`
    - özel komutlar yerel komutları geçersiz kılamaz
    - çakışmalar/yinelenenler atlanır ve günlüğe yazılır

    Notlar:

    - özel komutlar yalnızca menü girdileridir; davranışı otomatik olarak uygulamazlar
    - Plugin/Skills komutları Telegram menüsünde gösterilmese bile yazıldığında çalışabilir

    Yerel komutlar devre dışıysa yerleşikler kaldırılır. Özel/Plugin komutları yapılandırıldıysa yine de kaydedilebilir.

    Yaygın kurulum hataları:

    - `BOT_COMMANDS_TOO_MUCH` ile `setMyCommands failed`, kırpma sonrasında Telegram menüsünün hâlâ taştığı anlamına gelir; Plugin/Skills/özel komutları azaltın veya `channels.telegram.commands.native` devre dışı bırakın.
    - Doğrudan Bot API curl komutları çalışırken `deleteWebhook`, `deleteMyCommands` veya `setMyCommands` işlemlerinin `404: Not Found` ile başarısız olması, `channels.telegram.apiRoot` değerinin tam `/bot<TOKEN>` endpoint'ine ayarlandığı anlamına gelebilir. `apiRoot` yalnızca Bot API kökü olmalıdır ve `openclaw doctor --fix` yanlışlıkla eklenmiş sondaki `/bot<TOKEN>` kısmını kaldırır.
    - `getMe returned 401`, Telegram'ın yapılandırılmış bot token'ını reddettiği anlamına gelir. `botToken`, `tokenFile` veya `TELEGRAM_BOT_TOKEN` değerini güncel BotFather token'ıyla güncelleyin; OpenClaw yoklamadan önce durur, bu nedenle bu bir Webhook temizleme hatası olarak bildirilmez.
    - Ağ/fetch hatalarıyla `setMyCommands failed`, genellikle `api.telegram.org` adresine giden DNS/HTTPS erişiminin engellendiği anlamına gelir.

    ### Cihaz eşleme komutları (`device-pair` Plugin)

    `device-pair` Plugin yüklendiğinde:

    1. `/pair` kurulum kodu üretir
    2. kodu iOS uygulamasına yapıştırın
    3. `/pair pending` bekleyen istekleri listeler (rol/kapsamlar dahil)
    4. isteği onaylayın:
       - açık onay için `/pair approve <requestId>`
       - yalnızca bir bekleyen istek olduğunda `/pair approve`
       - en son istek için `/pair approve latest`

    Kurulum kodu kısa ömürlü bir bootstrap token taşır. Yerleşik kurulum kodu bootstrap yalnızca node içindir: ilk bağlantı bekleyen bir node isteği oluşturur ve onaydan sonra Gateway `scopes: []` ile kalıcı bir node token'ı döndürür. Devredilmiş bir operatör token'ı döndürmez; operatör erişimi ayrı bir onaylanmış operatör eşlemesi veya token akışı gerektirir.

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

    Eski `capabilities: ["inlineButtons"]`, `inlineButtons: "all"` ile eşleşir.

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

    Callback tıklamaları ajana metin olarak aktarılır:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="Ajanlar ve otomasyon için Telegram mesaj eylemleri">
    Telegram araç eylemleri şunları içerir:

    - `sendMessage` (`to`, `content`, isteğe bağlı `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content` veya `caption`, isteğe bağlı `presentation` satır içi düğmeleri; yalnızca düğme düzenlemeleri yanıt işaretlemesini günceller)
    - `createForumTopic` (`chatId`, `name`, isteğe bağlı `iconColor`, `iconCustomEmojiId`)

    Kanal mesaj eylemleri kullanışlı takma adlar sunar (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Kapı denetimleri:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (varsayılan: devre dışı)

    Not: `edit` ve `topic-create` şu anda varsayılan olarak etkindir ve ayrı `channels.telegram.actions.*` anahtarları yoktur.
    Çalışma zamanı gönderimleri etkin yapılandırma/gizli bilgiler anlık görüntüsünü (başlatma/yeniden yükleme) kullanır; bu nedenle eylem yolları gönderim başına geçici SecretRef yeniden çözümlemesi yapmaz.

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

    Yanıt iş parçacığı etkin olduğunda ve özgün Telegram metni ya da açıklaması kullanılabilir olduğunda, OpenClaw otomatik olarak yerel bir Telegram alıntı parçası ekler. Telegram yerel alıntı metnini 1024 UTF-16 kod birimiyle sınırlar; bu nedenle daha uzun mesajlar baştan alıntılanır ve Telegram alıntıyı reddederse düz yanıta geri döner.

    Not: `off`, örtük yanıt iş parçacığını devre dışı bırakır. Açık `[[reply_to_*]]` etiketleri yine de dikkate alınır.

  </Accordion>

  <Accordion title="Forum konuları ve iş parçacığı davranışı">
    Forum süper grupları:

    - konu oturum anahtarları `:topic:<threadId>` ekler
    - yanıtlar ve yazma durumu konu iş parçacığını hedefler
    - konu yapılandırma yolu:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Genel konu (`threadId=1`) özel durumu:

    - mesaj gönderimleri `message_thread_id` içermez (Telegram `sendMessage(...thread_id=1)` değerini reddeder)
    - yazma eylemleri yine de `message_thread_id` içerir

    Konu devralma: konu girdileri, geçersiz kılınmadıkça grup ayarlarını devralır (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` yalnızca konuya özeldir ve grup varsayılanlarından devralınmaz.
    `topics."*"`, o gruptaki her konu için varsayılanları ayarlar; kesin konu kimlikleri yine de `"*"` değerine göre önceliklidir.

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

    Her konunun daha sonra kendi oturum anahtarı olur: `agent:zu:telegram:group:-1001234567890:topic:3`

    **Kalıcı ACP konu bağlama**: Forum konuları, üst düzey yazılı ACP bağlamaları aracılığıyla ACP harness oturumlarını sabitleyebilir (`type: "acp"` ve `match.channel: "telegram"`, `peer.kind: "group"` içeren `bindings[]` ve `-1001234567890:topic:42` gibi konu nitelikli bir kimlik). Şu anda gruplardaki/süper gruplardaki forum konularıyla sınırlıdır. Bkz. [ACP Ajanları](/tr/tools/acp-agents).

    **Sohbetten iş parçacığına bağlı ACP başlatma**: `/acp spawn <agent> --thread here|auto`, geçerli konuyu yeni bir ACP oturumuna bağlar; sonraki iletiler doğrudan oraya yönlendirilir. OpenClaw başlatma onayını konu içinde sabitler. `channels.telegram.threadBindings.spawnSessions` etkin kalmasını gerektirir (varsayılan: `true`).

    Şablon bağlamı `MessageThreadId` ve `IsForum` değerlerini sunar. `message_thread_id` içeren DM sohbetleri yanıt meta verilerini korur; iş parçacığına duyarlı oturum anahtarlarını yalnızca Telegram `getMe`, bot için `has_topics_enabled: true` bildirdiğinde kullanırlar.
    Önceki `dm.threadReplies` ve `direct.*.threadReplies` geçersiz kılmaları kasıtlı olarak kullanımdan kaldırılmıştır; tek doğruluk kaynağı olarak BotFather iş parçacıklı modunu kullanın ve eski yapılandırma anahtarlarını kaldırmak için `openclaw doctor --fix` çalıştırın.

  </Accordion>

  <Accordion title="Ses, video ve çıkartmalar">
    ### Ses mesajları

    Telegram, sesli notları ve ses dosyalarını ayırt eder.

    - varsayılan: ses dosyası davranışı
    - sesli not gönderimini zorlamak için ajan yanıtında `[[audio_as_voice]]` etiketi
    - gelen sesli not dökümleri, ajan bağlamında makine tarafından oluşturulmuş,
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

    Telegram video dosyalarını video notlarından ayırır.

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

    Video notları açıklama metinlerini desteklemez; sağlanan mesaj metni ayrı gönderilir.

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

    Yinelenen görüntü çağrılarını azaltmak için çıkartma açıklamaları OpenClaw SQLite plugin durumunda önbelleğe alınır.

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
    Telegram tepkileri `message_reaction` güncellemeleri olarak gelir (mesaj yüklerinden ayrıdır).

    Etkinleştirildiğinde OpenClaw aşağıdaki gibi sistem olaylarını kuyruğa alır:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Yapılandırma:

    - `channels.telegram.reactionNotifications`: `off | own | all` (varsayılan: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (varsayılan: `minimal`)

    Notlar:

    - `own`, yalnızca bot tarafından gönderilen mesajlara kullanıcı tepkileri anlamına gelir (gönderilen mesaj önbelleği üzerinden en iyi çabayla).
    - Tepki olayları yine de Telegram erişim denetimlerine uyar (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); yetkisiz gönderenler düşürülür.
    - Telegram, tepki güncellemelerinde konu kimlikleri sağlamaz.
      - forum dışı gruplar grup sohbeti oturumuna yönlendirilir
      - forum grupları, tam kaynak konuya değil grubun genel konu oturumuna (`:topic:1`) yönlendirilir

    Polling/webhook için `allowed_updates`, `message_reaction` değerini otomatik olarak içerir.

  </Accordion>

  <Accordion title="Onay tepkileri">
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

    Telegram provider kapsamı `messages.ackReactionScope` değerinden okur (varsayılan `"group-mentions"`). Bugün Telegram hesabı veya Telegram kanalı düzeyinde geçersiz kılma yoktur.

    Değerler: `"all"` (DM'ler + gruplar), `"direct"` (yalnızca DM'ler), `"group-all"` (her grup mesajı, DM yok), `"group-mentions"` (botun bahsedildiği gruplar; **DM yok** — varsayılan budur), `"off"` / `"none"` (devre dışı).

    <Note>
    Varsayılan kapsam (`"group-mentions"`) doğrudan mesajlarda onay tepkilerini tetiklemez. Gelen Telegram DM'lerinde onay tepkisi almak için `messages.ackReactionScope` değerini `"direct"` veya `"all"` olarak ayarlayın. Değer Telegram provider başlangıcında okunur, bu nedenle değişikliğin etkili olması için gateway yeniden başlatması gerekir.
    </Note>

  </Accordion>

  <Accordion title="Telegram olaylarından ve komutlarından yapılandırma yazımları">
    Kanal yapılandırması yazımları varsayılan olarak etkindir (`configWrites !== false`).

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

  <Accordion title="Uzun polling ve Webhook">
    Varsayılan uzun polling kullanımıdır. Webhook modu için `channels.telegram.webhookUrl` ve `channels.telegram.webhookSecret` ayarlayın; isteğe bağlı olarak `webhookPath`, `webhookHost`, `webhookPort` (varsayılanlar `/telegram-webhook`, `127.0.0.1`, `8787`).

    Uzun polling modunda OpenClaw yeniden başlatma filigranını yalnızca bir güncelleme başarıyla dağıtıldıktan sonra kalıcı hale getirir. Bir işleyici başarısız olursa bu güncelleme aynı süreçte yeniden denenebilir kalır ve yeniden başlatma tekilleştirmesi için tamamlanmış olarak yazılmaz.

    Yerel dinleyici `127.0.0.1:8787` adresine bağlanır. Genel giriş için yerel bağlantı noktasının önüne bir ters proxy koyun veya bilinçli olarak `webhookHost: "0.0.0.0"` ayarlayın.

    Webhook modu, Telegram'a `200` döndürmeden önce istek korumalarını, Telegram gizli belirtecini ve JSON gövdesini doğrular.
    Ardından OpenClaw güncellemeyi, uzun polling tarafından kullanılan aynı sohbet başına/konu başına bot hatları üzerinden asenkron olarak işler; böylece yavaş aracı turları Telegram'ın teslimat ACK'sini bekletmez.

  </Accordion>

  <Accordion title="Sınırlar, yeniden deneme ve CLI hedefleri">
    - `channels.telegram.textChunkLimit` varsayılanı 4000'dir.
    - `channels.telegram.chunkMode="newline"` uzunluğa göre bölmeden önce paragraf sınırlarını (boş satırlar) tercih eder.
    - `channels.telegram.mediaMaxMb` (varsayılan 100), gelen ve giden Telegram medya boyutunu sınırlar.
    - `channels.telegram.mediaGroupFlushMs` (varsayılan 500), Telegram albümlerinin/medya gruplarının OpenClaw bunları tek bir gelen mesaj olarak göndermeden önce ne kadar süre arabelleğe alınacağını kontrol eder. Albüm parçaları geç geliyorsa artırın; albüm yanıt gecikmesini azaltmak için düşürün.
    - `channels.telegram.timeoutSeconds`, Telegram API istemcisi zaman aşımını geçersiz kılar (ayarlanmazsa grammY varsayılanı uygulanır). Bot istemcileri, yapılandırılan değerleri 60 saniyelik giden metin/yazıyor isteği korumasının altında sınırlar; böylece grammY, OpenClaw'ın taşıma koruması ve fallback'i çalışmadan önce görünür yanıt teslimini iptal etmez. Uzun yoklama, boşta kalan yoklamaların süresiz terk edilmemesi için yine 45 saniyelik bir `getUpdates` isteği koruması kullanır.
    - `channels.telegram.pollingStallThresholdMs` varsayılan olarak `120000` değerini kullanır; yalnızca yanlış pozitif yoklama-takılması yeniden başlatmaları için `30000` ile `600000` arasında ayarlayın.
    - grup bağlam geçmişi `channels.telegram.historyLimit` veya `messages.groupChat.historyLimit` kullanır (varsayılan 50); `0` devre dışı bırakır.
    - yanıt/alıntı/iletme ek bağlamı, Gateway üst mesajları gözlemlemişse tek bir seçili konuşma bağlam penceresine normalleştirilir; gözlemlenen mesaj önbelleği OpenClaw SQLite Plugin durumunda yaşar ve `openclaw doctor --fix` eski sidecar'ları içe aktarır. Telegram güncellemelerde yalnızca tek bir sığ `reply_to_message` içerir; bu nedenle önbellekten daha eski zincirler Telegram'ın mevcut güncelleme yüküyle sınırlıdır.
    - Telegram izin listeleri esas olarak ajanı kimin tetikleyebileceğini denetler; tam bir ek bağlam redaksiyon sınırı değildir.
    - DM geçmişi kontrolleri:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - `channels.telegram.retry` yapılandırması, kurtarılabilir giden API hataları için Telegram gönderme yardımcılarına (CLI/araçlar/eylemler) uygulanır. Gelen son yanıt teslimi de Telegram bağlantı öncesi hataları için sınırlı bir güvenli-gönder yeniden denemesi kullanır, ancak görünür mesajları çoğaltabilecek belirsiz gönderim sonrası ağ zarflarını yeniden denemez.

    CLI ve mesaj aracı gönderme hedefleri sayısal sohbet ID'si, kullanıcı adı veya forum konu hedefi olabilir:

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
    - bot o sohbette sabitleyebiliyorsa sabitlenmiş teslim istemek için `--pin` veya `--delivery '{"pin":true}'`
    - giden görselleri, GIF'leri ve videoları sıkıştırılmış fotoğraf, animasyonlu-medya veya video yüklemeleri yerine belge olarak göndermek için `--force-document`

    Eylem denetimi:

    - `channels.telegram.actions.sendMessage=false`, yoklamalar dahil giden Telegram mesajlarını devre dışı bırakır
    - `channels.telegram.actions.poll=false`, normal gönderimleri etkin bırakırken Telegram yoklaması oluşturmayı devre dışı bırakır

  </Accordion>

  <Accordion title="Telegram'da exec onayları">
    Telegram, onaylayıcı DM'lerinde exec onaylarını destekler ve isteğe bağlı olarak kaynak sohbete veya konuya istemler gönderebilir. Onaylayıcılar sayısal Telegram kullanıcı ID'leri olmalıdır.

    Yapılandırma yolu:

    - `channels.telegram.execApprovals.enabled` (en az bir onaylayıcı çözümlenebildiğinde otomatik etkinleşir)
    - `channels.telegram.execApprovals.approvers` (`commands.ownerAllowFrom` içindeki sayısal sahip ID'lerine fallback yapar)
    - `channels.telegram.execApprovals.target`: `dm` (varsayılan) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` ve `defaultTo`, botla kimin konuşabileceğini ve normal yanıtları nereye göndereceğini kontrol eder. Bunlar birini exec onaylayıcısı yapmaz. İlk onaylı DM eşleştirmesi, henüz komut sahibi yoksa `commands.ownerAllowFrom` değerini başlatır; böylece tek sahipli kurulum, ID'leri `execApprovals.approvers` altında çoğaltmadan çalışmaya devam eder.

    Kanal teslimi komut metnini sohbette gösterir; `channel` veya `both` değerini yalnızca güvenilir gruplarda/konularda etkinleştirin. İstem bir forum konusuna düştüğünde OpenClaw, onay istemi ve takip mesajı için konuyu korur. Exec onayları varsayılan olarak 30 dakika sonra sona erer.

    Satır içi onay düğmeleri ayrıca `channels.telegram.capabilities.inlineButtons` değerinin hedef yüzeye (`dm`, `group` veya `all`) izin vermesini gerektirir. `plugin:` ön ekli onay ID'leri Plugin onayları üzerinden çözümlenir; diğerleri önce exec onayları üzerinden çözümlenir.

    Bkz. [Exec onayları](/tr/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Hata yanıtı kontrolleri

Ajan bir teslim veya sağlayıcı hatasıyla karşılaştığında Telegram hata metniyle yanıt verebilir ya da bunu bastırabilir. Bu davranışı iki yapılandırma anahtarı kontrol eder:

| Anahtar                            | Değerler          | Varsayılan | Açıklama                                                                                      |
| ---------------------------------- | ----------------- | ---------- | --------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply`    | `reply`, sohbete dostça bir hata mesajı gönderir. `silent`, hata yanıtlarını tamamen bastırır. |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000`    | Aynı sohbete hata yanıtları arasındaki en kısa süre. Kesintiler sırasında hata spam'ini önler. |

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
  <Accordion title="Bot, bahsedilmeden gönderilen grup mesajlarına yanıt vermiyor">

    - `requireMention=false` ise Telegram gizlilik modu tam görünürlüğe izin vermelidir.
      - BotFather: `/setprivacy` -> Devre Dışı Bırak
      - ardından botu gruptan kaldırıp yeniden ekleyin
    - Yapılandırma, bahsedilmemiş grup mesajları beklediğinde `openclaw channels status` uyarır.
    - `openclaw channels status --probe` açık sayısal grup ID'lerini kontrol edebilir; joker karakter `"*"` için üyelik yoklaması yapılamaz.
    - hızlı oturum testi: `/activation always`.

  </Accordion>

  <Accordion title="Bot grup mesajlarını hiç görmüyor">

    - `channels.telegram.groups` varsa grup listelenmiş olmalıdır (veya `"*"` içermelidir)
    - botun gruptaki üyeliğini doğrulayın
    - atlama nedenleri için günlükleri inceleyin: `openclaw logs --follow`

  </Accordion>

  <Accordion title="Komutlar kısmen çalışıyor veya hiç çalışmıyor">

    - gönderici kimliğinizi yetkilendirin (eşleştirme ve/veya sayısal `allowFrom`)
    - grup ilkesi `open` olsa bile komut yetkilendirmesi yine uygulanır
    - `setMyCommands failed` ile `BOT_COMMANDS_TOO_MUCH` hatası, yerel menüde çok fazla giriş olduğu anlamına gelir; Plugin/skill/özel komutları azaltın veya yerel menüleri devre dışı bırakın
    - `deleteMyCommands` / `setMyCommands` başlangıç çağrıları ve `sendChatAction` yazıyor çağrıları sınırlıdır ve istek zaman aşımında Telegram'ın taşıma fallback'i üzerinden bir kez yeniden denenir. Kalıcı ağ/fetch hataları genellikle `api.telegram.org` için DNS/HTTPS erişilebilirlik sorunlarını gösterir

  </Accordion>

  <Accordion title="Başlangıç yetkisiz token bildiriyor">

    - `getMe returned 401`, yapılandırılan bot token'ı için bir Telegram kimlik doğrulama hatasıdır.
    - BotFather'da bot token'ını yeniden kopyalayın veya yeniden oluşturun, ardından varsayılan hesap için `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken` veya `TELEGRAM_BOT_TOKEN` değerini güncelleyin.
    - Başlangıç sırasında `deleteWebhook 401 Unauthorized` da bir kimlik doğrulama hatasıdır; bunu "webhook yok" olarak ele almak, aynı hatalı-token arızasını yalnızca daha sonraki API çağrılarına ertelemiş olur.

  </Accordion>

  <Accordion title="Yoklama veya ağ kararsızlığı">

    - Node 22+ ve özel fetch/proxy, AbortSignal türleri uyuşmazsa anında iptal davranışını tetikleyebilir.
    - Bazı host'lar `api.telegram.org` adresini önce IPv6'ya çözümler; bozuk IPv6 çıkışı aralıklı Telegram API hatalarına neden olabilir.
    - Günlüklerde `TypeError: fetch failed` veya `Network request for 'getUpdates' failed!` varsa OpenClaw artık bunları kurtarılabilir ağ hataları olarak yeniden dener.
    - Yoklama başlangıcı sırasında OpenClaw, grammY için başarılı başlangıç `getMe` yoklamasını yeniden kullanır; böylece çalıştırıcının ilk `getUpdates` öncesinde ikinci bir `getMe` çağrısına ihtiyacı olmaz.
    - Yoklama başlangıcı sırasında `deleteWebhook` geçici bir ağ hatasıyla başarısız olursa OpenClaw başka bir yoklama öncesi kontrol düzlemi çağrısı yapmak yerine uzun yoklamaya devam eder. Hâlâ etkin olan webhook bir `getUpdates` çakışması olarak yüzeye çıkar; ardından OpenClaw Telegram taşımasını yeniden oluşturur ve webhook temizliğini yeniden dener.
    - Telegram soketleri kısa ve sabit bir aralıkla yeniden döngüye giriyorsa düşük bir `channels.telegram.timeoutSeconds` değeri olup olmadığını kontrol edin; bot istemcileri yapılandırılan değerleri giden ve `getUpdates` istek korumalarının altında sınırlar, ancak eski sürümler bu değer bu korumaların altında ayarlandığında her yoklamayı veya yanıtı iptal edebiliyordu.
    - Günlüklerde `Polling stall detected` varsa OpenClaw, varsayılan olarak tamamlanmış uzun yoklama canlılığı olmadan geçen 120 saniyeden sonra yoklamayı yeniden başlatır ve Telegram taşımasını yeniden oluşturur.
    - `openclaw channels status --probe` ve `openclaw doctor`, çalışan bir yoklama hesabı başlangıç toleransından sonra `getUpdates` tamamlamadıysa, çalışan bir webhook hesabı başlangıç toleransından sonra `setWebhook` tamamlamadıysa veya son başarılı yoklama taşıma etkinliği eskidiyse uyarır.
    - `channels.telegram.pollingStallThresholdMs` değerini yalnızca uzun süren `getUpdates` çağrıları sağlıklı olduğu halde host'unuz yanlış yoklama-takılması yeniden başlatmaları bildiriyorsa artırın. Kalıcı takılmalar genellikle host ile `api.telegram.org` arasındaki proxy, DNS, IPv6 veya TLS çıkışı sorunlarına işaret eder.
    - Telegram ayrıca Bot API taşıması için `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` ve bunların küçük harfli varyantları dahil süreç proxy ortam değişkenlerine uyar. `NO_PROXY` / `no_proxy` yine de `api.telegram.org` adresini atlatabilir.
    - OpenClaw yönetimli proxy bir hizmet ortamı için `OPENCLAW_PROXY_URL` üzerinden yapılandırılmışsa ve standart proxy ortam değişkeni yoksa Telegram da Bot API taşıması için bu URL'yi kullanır.
    - Kararsız doğrudan çıkış/TLS olan VPS host'larında Telegram API çağrılarını `channels.telegram.proxy` üzerinden yönlendirin:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ varsayılan olarak `autoSelectFamily=true` kullanır (WSL2 hariç). Telegram DNS sonuç sırası önce `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`, sonra `channels.telegram.network.dnsResultOrder`, ardından `NODE_OPTIONS=--dns-result-order=ipv4first` gibi süreç varsayılanına uyar; hiçbiri uygulanmazsa Node 22+ `ipv4first` değerine fallback yapar.
    - Host'unuz WSL2 ise veya açıkça yalnızca IPv4 davranışıyla daha iyi çalışıyorsa aile seçimini zorlayın:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - RFC 2544 kıyaslama aralığı yanıtlarına (`198.18.0.0/15`) Telegram medya indirmeleri için varsayılan olarak zaten izin verilir. Güvenilir bir sahte IP veya saydam proxy, medya indirmeleri sırasında `api.telegram.org` adresini başka bir özel/dahili/özel kullanımlı adrese yeniden yazıyorsa, yalnızca Telegram için geçerli atlamayı etkinleştirebilirsiniz:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - Aynı etkinleştirme, hesap başına
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork` konumunda da kullanılabilir.
    - Proxy'niz Telegram medya ana bilgisayarlarını `198.18.x.x` olarak çözümlüyorsa, önce
      tehlikeli bayrağı kapalı bırakın. Telegram medyası, RFC 2544
      kıyaslama aralığına varsayılan olarak zaten izin verir.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork`, Telegram
      medya SSRF korumalarını zayıflatır. Bunu yalnızca Clash, Mihomo veya Surge
      sahte IP yönlendirmesi gibi, RFC 2544 kıyaslama aralığı dışında özel veya
      özel kullanımlı yanıtlar sentezleyen güvenilir operatör denetimli proxy
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

<Accordion title="High-signal Telegram fields">

- başlatma/kimlik doğrulama: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` normal bir dosyayı göstermelidir; sembolik bağlantılar reddedilir)
- erişim denetimi: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, üst düzey `bindings[]` (`type: "acp"`)
- konu varsayılanları: `groups.<chatId>.topics."*"` eşleşmeyen forum konularına uygulanır; kesin konu kimlikleri bunu geçersiz kılar
- exec onayları: `execApprovals`, `accounts.*.execApprovals`
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
Çoklu hesap önceliği: iki veya daha fazla hesap kimliği yapılandırıldığında, varsayılan yönlendirmeyi açık hale getirmek için `channels.telegram.defaultAccount` değerini ayarlayın (veya `channels.telegram.accounts.default` ekleyin). Aksi halde OpenClaw ilk normalleştirilmiş hesap kimliğine geri döner ve `openclaw doctor` uyarır. Adlandırılmış hesaplar `channels.telegram.allowFrom` / `groupAllowFrom` değerlerini devralır, ancak `accounts.default.*` değerlerini devralmaz.
</Note>

## İlgili

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/tr/channels/pairing">
    Bir Telegram kullanıcısını Gateway ile eşleştirin.
  </Card>
  <Card title="Groups" icon="users" href="/tr/channels/groups">
    Grup ve konu izin listesi davranışı.
  </Card>
  <Card title="Channel routing" icon="route" href="/tr/channels/channel-routing">
    Gelen iletileri aracılara yönlendirin.
  </Card>
  <Card title="Security" icon="shield" href="/tr/gateway/security">
    Tehdit modeli ve sağlamlaştırma.
  </Card>
  <Card title="Multi-agent routing" icon="sitemap" href="/tr/concepts/multi-agent">
    Grupları ve konuları aracılara eşleyin.
  </Card>
  <Card title="Troubleshooting" icon="wrench" href="/tr/channels/troubleshooting">
    Kanallar arası tanılama.
  </Card>
</CardGroup>
