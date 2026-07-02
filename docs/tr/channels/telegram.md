---
read_when:
    - Telegram özellikleri veya Webhook'lar üzerinde çalışma
summary: Telegram bot destek durumu, yetenekleri ve yapılandırması
title: Telegram
x-i18n:
    generated_at: "2026-07-02T17:44:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3b9fc8030adf0525b8b0680fc9ca344cd2c1ba2164b2a4acdb805c7076603bea
    source_path: channels/telegram.md
    workflow: 16
---

Üretime hazır bot DM'leri ve grupları için grammY ile çalışır. Uzun yoklama varsayılan moddur; webhook modu isteğe bağlıdır.

<CardGroup cols={3}>
  <Card title="Eşleştirme" icon="link" href="/tr/channels/pairing">
    Telegram için varsayılan DM ilkesi eşleştirmedir.
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
  <Step title="BotFather içinde bot token'ını oluşturun">
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

    Ortam yedeği: `TELEGRAM_BOT_TOKEN=...` (yalnızca varsayılan hesap).
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
    Botu grubunuza ekleyin, ardından grup erişimi için gereken iki kimliği de alın:

    - `allowFrom` / `groupAllowFrom` içinde kullanılan Telegram kullanıcı kimliğiniz
    - `channels.telegram.groups` altında anahtar olarak kullanılan Telegram grup sohbet kimliği

    İlk kurulum için grup sohbet kimliğini `openclaw logs --follow`, iletilmiş kimlik botu veya Bot API `getUpdates` üzerinden alın. Gruba izin verildikten sonra `/whoami@<bot_username>` kullanıcı ve grup kimliklerini doğrulayabilir.

    `-100` ile başlayan negatif Telegram süper grup kimlikleri grup sohbet kimlikleridir. Bunları `groupAllowFrom` altına değil, `channels.telegram.groups` altına koyun.

  </Step>
</Steps>

<Note>
Token çözümleme sırası hesap farkındadır. Pratikte config değerleri env yedeğine göre önceliklidir ve `TELEGRAM_BOT_TOKEN` yalnızca varsayılan hesap için geçerlidir.
Başarılı bir başlangıçtan sonra OpenClaw, yeniden başlatmaların fazladan Telegram `getMe` çağrısından kaçınabilmesi için bot kimliğini durum dizininde 24 saate kadar önbelleğe alır; token'ı değiştirmek veya kaldırmak bu önbelleği temizler.
</Note>

## Telegram tarafı ayarları

<AccordionGroup>
  <Accordion title="Gizlilik modu ve grup görünürlüğü">
    Telegram botları varsayılan olarak **Gizlilik Modu** kullanır; bu, gruplarda hangi mesajları alacaklarını sınırlar.

    Botun tüm grup mesajlarını görmesi gerekiyorsa şunlardan birini yapın:

    - `/setprivacy` ile gizlilik modunu devre dışı bırakın veya
    - botu grup yöneticisi yapın.

    Gizlilik modunu değiştirirken Telegram'ın değişikliği uygulaması için botu her gruptan kaldırıp yeniden ekleyin.

  </Accordion>

  <Accordion title="Grup izinleri">
    Yönetici durumu Telegram grup ayarlarında denetlenir.

    Yönetici botlar tüm grup mesajlarını alır; bu, sürekli açık grup davranışı için kullanışlıdır.

  </Accordion>

  <Accordion title="Yararlı BotFather anahtarları">

    - grup eklemelerine izin vermek/vermeymek için `/setjoingroups`
    - grup görünürlüğü davranışı için `/setprivacy`

  </Accordion>
</AccordionGroup>

## Erişim denetimi ve etkinleştirme

### Grup bot kimliği

Telegram gruplarında ve forum konularında, yapılandırılmış bot kullanıcı adının açıkça anılması (örneğin `@my_bot`), ajan persona adı Telegram kullanıcı adından farklı olsa bile seçili OpenClaw ajanına hitap etmek olarak değerlendirilir. Grup sessizlik ilkesi ilgisiz grup trafiği için hâlâ geçerlidir, ancak bot kullanıcı adının kendisi "başka biri" olarak kabul edilmez.

<Tabs>
  <Tab title="DM ilkesi">
    `channels.telegram.dmPolicy` doğrudan mesaj erişimini denetler:

    - `pairing` (varsayılan)
    - `allowlist` (`allowFrom` içinde en az bir gönderen kimliği gerektirir)
    - `open` (`allowFrom` içinde `"*"` bulunmasını gerektirir)
    - `disabled`

    `allowFrom: ["*"]` ile `dmPolicy: "open"`, bot kullanıcı adını bulan veya tahmin eden herhangi bir Telegram hesabının bota komut vermesine izin verir. Bunu yalnızca araçları sıkı biçimde kısıtlanmış, kasıtlı olarak herkese açık botlar için kullanın; tek sahipli botlar sayısal kullanıcı kimlikleriyle `allowlist` kullanmalıdır.

    `channels.telegram.allowFrom` sayısal Telegram kullanıcı kimliklerini kabul eder. `telegram:` / `tg:` önekleri kabul edilir ve normalleştirilir.
    Çok hesaplı config'lerde, kısıtlayıcı üst düzey `channels.telegram.allowFrom` bir güvenlik sınırı olarak ele alınır: hesap düzeyi `allowFrom: ["*"]` girdileri, birleştirme sonrasında etkin hesap izin listesi hâlâ açık bir joker karakter içermedikçe o hesabı herkese açık yapmaz.
    Boş `allowFrom` ile `dmPolicy: "allowlist"` tüm DM'leri engeller ve config doğrulaması tarafından reddedilir.
    Kurulum yalnızca sayısal kullanıcı kimlikleri ister.
    Yükseltme yaptıysanız ve config'iniz `@username` izin listesi girdileri içeriyorsa bunları çözümlemek için `openclaw doctor --fix` çalıştırın (en iyi çaba; Telegram bot token'ı gerektirir).
    Daha önce eşleştirme deposu izin listesi dosyalarına güveniyorsanız, `openclaw doctor --fix` izin listesi akışlarında girdileri `channels.telegram.allowFrom` içine kurtarabilir (örneğin `dmPolicy: "allowlist"` henüz açık kimlik içermediğinde).

    Tek sahipli botlarda, erişim ilkesini önceki eşleştirme onaylarına bağlı kalmak yerine config içinde kalıcı tutmak için açık sayısal `allowFrom` kimlikleriyle `dmPolicy: "allowlist"` tercih edin.

    Yaygın karışıklık: DM eşleştirme onayı "bu gönderen her yerde yetkilidir" anlamına gelmez.
    Eşleştirme DM erişimi verir. Henüz komut sahibi yoksa ilk onaylanmış eşleştirme, yalnızca sahip komutları ve exec onayları için açık bir operatör hesabı olması adına `commands.ownerAllowFrom` değerini de ayarlar.
    Grup gönderen yetkilendirmesi hâlâ açık config izin listelerinden gelir.
    "Bir kez yetkilendirileyim, hem DM'ler hem grup komutları çalışsın" istiyorsanız sayısal Telegram kullanıcı kimliğinizi `channels.telegram.allowFrom` içine koyun; yalnızca sahip komutları için `commands.ownerAllowFrom` öğesinin `telegram:<your user id>` içerdiğinden emin olun.

    ### Telegram kullanıcı kimliğinizi bulma

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

  <Tab title="Grup ilkesi ve izin listeleri">
    İki denetim birlikte uygulanır:

    1. **Hangi gruplara izin verildiği** (`channels.telegram.groups`)
       - `groups` config'i yok:
         - `groupPolicy: "open"` ile: herhangi bir grup grup kimliği denetimlerinden geçebilir
         - `groupPolicy: "allowlist"` (varsayılan) ile: `groups` girdileri (veya `"*"`) ekleyene kadar gruplar engellenir
       - `groups` yapılandırılmış: izin listesi gibi davranır (açık kimlikler veya `"*"`)

    2. **Gruplarda hangi gönderenlere izin verildiği** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (varsayılan)
       - `disabled`

    `groupAllowFrom` grup gönderen filtrelemesi için kullanılır. Ayarlanmazsa Telegram `allowFrom` değerine geri döner.
    `groupAllowFrom` girdileri sayısal Telegram kullanıcı kimlikleri olmalıdır (`telegram:` / `tg:` önekleri normalleştirilir).
    Telegram grup veya süper grup sohbet kimliklerini `groupAllowFrom` içine koymayın. Negatif sohbet kimlikleri `channels.telegram.groups` altında yer alır.
    Sayısal olmayan girdiler gönderen yetkilendirmesi için yok sayılır.
    Güvenlik sınırı (`2026.2.25+`): grup gönderen kimlik doğrulaması DM eşleştirme deposu onaylarını **devralmaz**.
    Eşleştirme yalnızca DM için kalır. Gruplar için `groupAllowFrom` veya grup/konu başına `allowFrom` ayarlayın.
    `groupAllowFrom` ayarlanmamışsa Telegram, eşleştirme deposuna değil config `allowFrom` değerine geri döner.
    Tek sahipli botlar için pratik kalıp: kullanıcı kimliğinizi `channels.telegram.allowFrom` içine ayarlayın, `groupAllowFrom` değerini ayarlamadan bırakın ve hedef gruplara `channels.telegram.groups` altında izin verin.
    Çalışma zamanı notu: `channels.telegram` tamamen eksikse, `channels.defaults.groupPolicy` açıkça ayarlanmadığı sürece çalışma zamanı varsayılan olarak kapalı başarısız olan `groupPolicy="allowlist"` değerine döner.

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

    Grup geçmişi bağlamı gruplar için her zaman açıktır ve
    `historyLimit` ile sınırlandırılır. Telegram grup geçmişi penceresini devre dışı
    bırakmak için `channels.telegram.historyLimit: 0` ayarlayın. Kullanımdan kaldırılmış `includeGroupHistoryContext`
    anahtarı `openclaw doctor --fix` tarafından kaldırılır.

    Grup sohbet kimliğini alma:

    - bir grup mesajını `@userinfobot` / `@getidsbot` adresine iletin
    - veya `openclaw logs --follow` içinden `chat.id` değerini okuyun
    - veya Bot API `getUpdates` çıktısını inceleyin
    - gruba izin verildikten sonra yerel komutlar etkinse `/whoami@<bot_username>` çalıştırın

  </Tab>
</Tabs>

## Çalışma zamanı davranışı

- Telegram, Gateway sürecinin sahibidir.
- Yönlendirme deterministiktir: Telegram’dan gelenler Telegram’a yanıtlanır (model kanalları seçmez).
- Gelen mesajlar; yanıt meta verileri, medya yer tutucuları ve Gateway’in gözlemlediği Telegram yanıtları için kalıcı yanıt zinciri bağlamıyla paylaşılan kanal zarfına normalize edilir.
- Grup oturumları grup kimliğine göre yalıtılır. Forum konuları, konuları yalıtılmış tutmak için `:topic:<threadId>` ekler.
- DM mesajları `message_thread_id` taşıyabilir; OpenClaw bunu yanıtlar için korur. DM konu oturumları yalnızca Telegram `getMe`, bot için `has_topics_enabled: true` bildirdiğinde ayrılır; aksi halde DM’ler düz oturumda kalır.
- Uzun yoklama, sohbet başına/iş parçacığı başına sıralama ile grammY runner kullanır. Genel runner sink eşzamanlılığı `agents.defaults.maxConcurrent` kullanır.
- Çok hesaplı başlangıç, büyük bot filolarının tüm hesap yoklamalarını aynı anda yaymaması için eşzamanlı Telegram `getMe` yoklamalarını sınırlar.
- Uzun yoklama, her Gateway süreci içinde korunur; böylece bir bot token’ını aynı anda yalnızca bir etkin yoklayıcı kullanabilir. Hâlâ `getUpdates` 409 çakışmaları görüyorsanız, muhtemelen başka bir OpenClaw Gateway’i, betiği veya harici yoklayıcısı aynı token’ı kullanıyordur.
- Uzun yoklama watchdog yeniden başlatmaları, varsayılan olarak tamamlanmış `getUpdates` canlılığı olmadan 120 saniye sonra tetiklenir. Dağıtımınız uzun süren işler sırasında hâlâ yanlış yoklama durması yeniden başlatmaları görüyorsa `channels.telegram.pollingStallThresholdMs` değerini artırın. Değer milisaniye cinsindedir ve `30000` ile `600000` arasında izin verilir; hesap başına geçersiz kılmalar desteklenir.
- Telegram Bot API okundu bilgisi desteğine sahip değildir (`sendReadReceipts` geçerli değildir).

<Note>
  `channels.telegram.dm.threadReplies` ve `channels.telegram.direct.<chatId>.threadReplies` kaldırıldı. Yapılandırmanızda bu anahtarlar hâlâ varsa yükseltmeden sonra `openclaw doctor --fix` çalıştırın. DM konu yönlendirmesi artık Telegram `getMe.has_topics_enabled` üzerinden gelen bot yeteneğini izler; bu yetenek BotFather iş parçacıklı mod tarafından kontrol edilir: konuları etkin botlar, Telegram `message_thread_id` gönderdiğinde iş parçacığı kapsamlı DM oturumları kullanır; diğer DM’ler düz oturumda kalır.
</Note>

## Özellik başvurusu

<AccordionGroup>
  <Accordion title="Live stream preview (message edits)">
    OpenClaw kısmi yanıtları gerçek zamanlı olarak akışa verebilir:

    - doğrudan sohbetler: önizleme mesajı + `editMessageText`
    - gruplar/konular: önizleme mesajı + `editMessageText`

    Gereksinim:

    - `channels.telegram.streaming`, `off | partial | block | progress` değerlerinden biridir (varsayılan: `partial`)
    - kısa ilk yanıt önizlemeleri debounce edilir, ardından çalışma hâlâ etkinse sınırlı bir gecikmeden sonra somutlaştırılır
    - `progress`, araç ilerlemesi için düzenlenebilir tek bir durum taslağı tutar, araç ilerlemesinden önce yanıt etkinliği geldiğinde kararlı durum etiketini gösterir, tamamlanınca temizler ve son yanıtı normal mesaj olarak gönderir
    - `streaming.preview.toolProgress`, araç/ilerleme güncellemelerinin aynı düzenlenen önizleme mesajını yeniden kullanıp kullanmayacağını kontrol eder (varsayılan: önizleme akışı etkinken `true`)
    - `streaming.preview.commandText`, bu araç ilerleme satırlarının içindeki komut/exec ayrıntısını kontrol eder: `raw` (varsayılan, yayımlanmış davranışı korur) veya `status` (yalnızca araç etiketi)
    - `streaming.progress.commentary` (varsayılan: `false`), geçici ilerleme taslağında asistan yorum/preamble metnine katılır
    - eski `channels.telegram.streamMode`, boolean `streaming` değerleri ve kullanımdan kaldırılmış yerel taslak önizleme anahtarları algılanır; bunları geçerli akış yapılandırmasına geçirmek için `openclaw doctor --fix` çalıştırın

    Araç ilerlemesi önizleme güncellemeleri, araçlar çalışırken gösterilen kısa durum satırlarıdır; örneğin komut yürütme, dosya okumaları, planlama güncellemeleri, patch özetleri veya Codex app-server modunda Codex preamble/yorum metni. Telegram, `v2026.4.22` ve sonrasındaki yayımlanmış OpenClaw davranışıyla eşleşmesi için bunları varsayılan olarak etkin tutar.

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

    Yalnızca son teslimat istediğinizde `streaming.mode: "off"` kullanın: Telegram önizleme düzenlemeleri devre dışı bırakılır ve genel araç/ilerleme gevezeliği bağımsız durum mesajları olarak gönderilmek yerine bastırılır. Onay istemleri, medya payload’ları ve hatalar normal son teslimat üzerinden yönlendirilmeye devam eder. Yalnızca araç ilerleme durum satırlarını gizlerken yanıt önizleme düzenlemelerini korumak istediğinizde `streaming.preview.toolProgress: false` kullanın.

    <Note>
      Telegram seçili alıntı yanıtları istisnadır. `replyToMode`, `"first"`, `"all"` veya `"batched"` olduğunda ve gelen mesaj seçili alıntı metni içerdiğinde OpenClaw son yanıtı yanıt önizlemesini düzenlemek yerine Telegram’ın yerel alıntı-yanıt yolu üzerinden gönderir; bu nedenle `streaming.preview.toolProgress` o tur için kısa durum satırlarını gösteremez. Seçili alıntı metni olmayan geçerli mesaj yanıtları hâlâ önizleme akışını korur. Araç ilerlemesi görünürlüğü yerel alıntı yanıtlarından daha önemliyse `replyToMode: "off"` ayarlayın veya bu ödünü kabul etmek için `streaming.preview.toolProgress: false` ayarlayın.
    </Note>

    Yalnızca metin yanıtları için:

    - kısa DM/grup/konu önizlemeleri: OpenClaw aynı önizleme mesajını korur ve son düzenlemeyi yerinde yapar
    - birden fazla Telegram mesajına bölünen uzun metin finalleri, mümkün olduğunda mevcut önizlemeyi ilk son parça olarak yeniden kullanır, ardından yalnızca kalan parçaları gönderir
    - progress modu finalleri durum taslağını temizler ve taslağı yanıta düzenlemek yerine normal son teslimatı kullanır
    - tamamlanan metin doğrulanmadan önce son düzenleme başarısız olursa OpenClaw normal son teslimatı kullanır ve bayat önizlemeyi temizler

    Karmaşık yanıtlar için (örneğin medya payload’ları), OpenClaw normal son teslimata geri döner ve ardından önizleme mesajını temizler.

    Önizleme akışı, blok akışından ayrıdır. Blok akışı Telegram için açıkça etkinleştirildiğinde OpenClaw çift akıştan kaçınmak için önizleme akışını atlar.

    Akıl yürütme akışı davranışı:

    - `/reasoning stream`, desteklenen bir kanalın akıl yürütme önizleme yolunu kullanır; Telegram’da üretim sırasında akıl yürütmeyi canlı önizlemeye akıtır
    - akıl yürütme önizlemesi son teslimattan sonra silinir; akıl yürütmenin görünür kalması gerektiğinde `/reasoning on` kullanın
    - son yanıt akıl yürütme metni olmadan gönderilir

  </Accordion>

  <Accordion title="Rich message formatting">
    Giden metin, yanıtların güncel Telegram istemcileri arasında okunabilir kalması için varsayılan olarak standart Telegram HTML mesajlarını kullanır. Bu uyumluluk modu normal kalın, italik, bağlantılar, kod, spoiler’lar ve alıntıları destekler; ancak yerel tablolar, details, zengin medya ve formüller gibi Bot API 10.1’e özgü rich-only blokları desteklemez.

    Bot API 10.1 zengin mesajlarına katılmak için `channels.telegram.richMessages: true` ayarlayın:

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

    - Aracıya bu bot/hesap için Telegram zengin mesajlarının kullanılabilir olduğu bildirilir.
    - Markdown metni OpenClaw’ın Markdown IR’si üzerinden işlenir ve Telegram zengin HTML’i olarak gönderilir.
    - Açık zengin HTML payload’ları başlıklar, tablolar, details, zengin medya ve formüller gibi desteklenen Bot API 10.1 etiketlerini korur.
    - Medya altyazıları hâlâ Telegram HTML altyazılarını kullanır çünkü zengin mesajlar altyazıların yerini almaz.

    Bu, model metnini Telegram Rich Markdown işaretlerinden uzak tutar; böylece `$400-600K` gibi para birimleri matematik olarak ayrıştırılmaz. Uzun zengin metin, Telegram’ın zengin metin ve zengin blok sınırları arasında otomatik olarak bölünür. Telegram’ın sütun sınırını aşan tablolar kod blokları olarak gönderilir.

    Varsayılan: istemci uyumluluğu için kapalı. Zengin mesajlar uyumlu Telegram istemcileri gerektirir; bazı güncel Desktop, Web, Android ve üçüncü taraf istemciler kabul edilen zengin mesajları desteklenmiyor olarak görüntüler. Botla kullanılan her istemci bunları işleyemediği sürece bu seçeneği devre dışı tutun. `/status`, geçerli Telegram oturumunda zengin mesajların açık mı kapalı mı olduğunu gösterir.

    Bağlantı önizlemeleri varsayılan olarak etkindir. `channels.telegram.linkPreview: false`, zengin metin için otomatik varlık algılamasını atlar.

  </Accordion>

  <Accordion title="Native commands and custom commands">
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

    - adlar normalize edilir (başındaki `/` kaldırılır, küçük harfe çevrilir)
    - geçerli desen: `a-z`, `0-9`, `_`, uzunluk `1..32`
    - özel komutlar yerel komutları geçersiz kılamaz
    - çakışmalar/yinelenenler atlanır ve günlüğe yazılır

    Notlar:

    - özel komutlar yalnızca menü girdileridir; davranışı otomatik olarak uygulamazlar
    - Plugin/Skills komutları Telegram menüsünde gösterilmese bile yazıldığında çalışmaya devam edebilir

    Yerel komutlar devre dışıysa yerleşikler kaldırılır. Özel/Plugin komutları yapılandırılmışsa hâlâ kaydedilebilir.

    Yaygın kurulum hataları:

    - `BOT_COMMANDS_TOO_MUCH` ile `setMyCommands failed`, kırpmadan sonra Telegram menüsünün hâlâ taştığı anlamına gelir; Plugin/Skills/özel komutları azaltın veya `channels.telegram.commands.native` değerini devre dışı bırakın.
    - Doğrudan Bot API curl komutları çalışırken `deleteWebhook`, `deleteMyCommands` veya `setMyCommands` işlemlerinin `404: Not Found` ile başarısız olması, `channels.telegram.apiRoot` değerinin tam `/bot<TOKEN>` uç noktasına ayarlandığı anlamına gelebilir. `apiRoot` yalnızca Bot API kökü olmalıdır ve `openclaw doctor --fix` yanlışlıkla eklenen sonda `/bot<TOKEN>` bölümünü kaldırır.
    - `getMe returned 401`, Telegram’ın yapılandırılmış bot token’ını reddettiği anlamına gelir. `botToken`, `tokenFile` veya `TELEGRAM_BOT_TOKEN` değerini güncel BotFather token’ıyla güncelleyin; OpenClaw yoklamadan önce durur, bu nedenle bu Webhook temizleme hatası olarak bildirilmez.
    - Ağ/fetch hatalarıyla `setMyCommands failed`, genellikle `api.telegram.org` için giden DNS/HTTPS erişiminin engellendiği anlamına gelir.

    ### Cihaz eşleme komutları (`device-pair` Plugin’i)

    `device-pair` Plugin’i yüklü olduğunda:

    1. `/pair` kurulum kodu üretir
    2. kodu iOS uygulamasına yapıştırın
    3. `/pair pending` bekleyen istekleri listeler (rol/kapsamlar dahil)
    4. isteği onaylayın:
       - açık onay için `/pair approve <requestId>`
       - yalnızca bir bekleyen istek olduğunda `/pair approve`
       - en yeni istek için `/pair approve latest`

    Kurulum kodu kısa ömürlü bir bootstrap token taşır. Yerleşik kurulum kodu bootstrap’i yalnızca Node içindir: ilk bağlantı bekleyen bir node isteği oluşturur ve onaydan sonra Gateway, `scopes: []` ile kalıcı bir node token’ı döndürür. Devredilmiş bir operatör token’ı döndürmez; operatör erişimi ayrı bir onaylı operatör eşlemesi veya token akışı gerektirir.

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

    Kayıtlı bir Plugin etkileşimli işleyicisi tarafından üstlenilmeyen callback tıklamaları aracıya metin olarak iletilir:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="Aracılar ve otomasyon için Telegram ileti eylemleri">
    Telegram araç eylemleri şunları içerir:

    - `sendMessage` (`to`, `content`, isteğe bağlı `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content` veya `caption`, isteğe bağlı `presentation` satır içi düğmeleri; yalnızca düğme düzenlemeleri yanıt işaretlemesini günceller)
    - `createForumTopic` (`chatId`, `name`, isteğe bağlı `iconColor`, `iconCustomEmojiId`)

    Kanal ileti eylemleri ergonomik takma adlar sunar (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Kapı denetimleri:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (varsayılan: devre dışı)

    Not: `edit` ve `topic-create` şu anda varsayılan olarak etkindir ve ayrı `channels.telegram.actions.*` geçişlerine sahip değildir.
    Çalışma zamanı gönderimleri etkin yapılandırma/gizli bilgiler anlık görüntüsünü (başlatma/yeniden yükleme) kullanır, bu yüzden eylem yolları gönderim başına geçici SecretRef yeniden çözümlemesi yapmaz.

    Tepki kaldırma semantiği: [/tools/reactions](/tr/tools/reactions)

  </Accordion>

  <Accordion title="Yanıt konu dizisi etiketleri">
    Telegram, oluşturulan çıktıda açık yanıt konu dizisi etiketlerini destekler:

    - `[[reply_to_current]]` tetikleyen iletiye yanıt verir
    - `[[reply_to:<id>]]` belirli bir Telegram ileti kimliğine yanıt verir

    `channels.telegram.replyToMode` işlemeyi denetler:

    - `off` (varsayılan)
    - `first`
    - `all`

    Yanıt konu dizisi etkinleştirildiğinde ve özgün Telegram metni veya açıklaması kullanılabilir olduğunda, OpenClaw otomatik olarak yerel bir Telegram alıntı parçası ekler. Telegram yerel alıntı metnini 1024 UTF-16 kod birimiyle sınırlar; bu nedenle daha uzun iletiler baştan alıntılanır ve Telegram alıntıyı reddederse düz yanıta geri döner.

    Not: `off`, örtük yanıt konu dizisini devre dışı bırakır. Açık `[[reply_to_*]]` etiketleri yine de dikkate alınır.

  </Accordion>

  <Accordion title="Forum konuları ve konu dizisi davranışı">
    Forum süper grupları:

    - konu oturumu anahtarları `:topic:<threadId>` ekler
    - yanıtlar ve yazıyor eylemleri konu dizisini hedefler
    - konu yapılandırma yolu:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Genel konu (`threadId=1`) özel durumu:

    - ileti gönderimleri `message_thread_id` değerini atlar (Telegram `sendMessage(...thread_id=1)` çağrısını reddeder)
    - yazıyor eylemleri yine de `message_thread_id` içerir

    Konu kalıtımı: konu girdileri, geçersiz kılınmadıkça grup ayarlarını devralır (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` yalnızca konuya özeldir ve grup varsayılanlarından devralınmaz.
    `topics."*"`, o gruptaki her konu için varsayılanları ayarlar; tam konu kimlikleri yine de `"*"` üzerinde önceliklidir.

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

    Her konu daha sonra kendi oturum anahtarına sahip olur: `agent:zu:telegram:group:-1001234567890:topic:3`

    **Kalıcı ACP konu bağlama**: Forum konuları, üst düzey türlendirilmiş ACP bağlamaları (`type: "acp"` ve `match.channel: "telegram"`, `peer.kind: "group"` içeren `bindings[]` ve `-1001234567890:topic:42` gibi konu nitelikli bir kimlik) aracılığıyla ACP harness oturumlarını sabitleyebilir. Şu anda gruplar/süper gruplardaki forum konularıyla sınırlıdır. Bkz. [ACP Aracıları](/tr/tools/acp-agents).

    **Sohbetten konu dizisine bağlı ACP oluşturma**: `/acp spawn <agent> --thread here|auto` geçerli konuyu yeni bir ACP oturumuna bağlar; takip iletileri doğrudan oraya yönlendirilir. OpenClaw oluşturma onayını konu içinde sabitler. `channels.telegram.threadBindings.spawnSessions` değerinin etkin kalmasını gerektirir (varsayılan: `true`).

    Şablon bağlamı `MessageThreadId` ve `IsForum` değerlerini sunar. `message_thread_id` içeren DM sohbetleri yanıt meta verilerini korur; konu dizisine duyarlı oturum anahtarlarını yalnızca Telegram `getMe`, bot için `has_topics_enabled: true` bildirdiğinde kullanırlar.
    Eski `dm.threadReplies` ve `direct.*.threadReplies` geçersiz kılmaları bilerek kullanımdan kaldırılmıştır; tek doğruluk kaynağı olarak BotFather konu dizisi modunu kullanın ve eski yapılandırma anahtarlarını kaldırmak için `openclaw doctor --fix` çalıştırın.

  </Accordion>

  <Accordion title="Ses, video ve çıkartmalar">
    ### Sesli iletiler

    Telegram, sesli notları ses dosyalarından ayırır.

    - varsayılan: ses dosyası davranışı
    - sesli not gönderimini zorlamak için aracı yanıtında `[[audio_as_voice]]` etiketi
    - gelen sesli not transkriptleri, aracı bağlamında makine tarafından oluşturulmuş,
      güvenilmeyen metin olarak çerçevelenir; bahsetme algılama yine de ham
      transkripti kullanır, böylece bahsetme kapılı sesli iletiler çalışmaya devam eder.

    İleti eylemi örneği:

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

    Video notları açıklama yazılarını desteklemez; sağlanan mesaj metni ayrı olarak gönderilir.

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

    Tekrarlanan görüntü çağrılarını azaltmak için çıkartma açıklamaları OpenClaw SQLite Plugin durumunda önbelleğe alınır.

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
    Telegram tepkileri, `message_reaction` güncellemeleri olarak gelir (mesaj yüklerinden ayrıdır).

    Etkinleştirildiğinde OpenClaw şu tür sistem olaylarını kuyruğa alır:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Yapılandırma:

    - `channels.telegram.reactionNotifications`: `off | own | all` (varsayılan: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (varsayılan: `minimal`)

    Notlar:

    - `own`, yalnızca bot tarafından gönderilen mesajlara verilen kullanıcı tepkileri anlamına gelir (gönderilen mesaj önbelleği üzerinden en iyi çabayla).
    - Tepki olayları yine de Telegram erişim denetimlerine (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`) uyar; yetkisiz gönderenler düşürülür.
    - Telegram, tepki güncellemelerinde iş parçacığı kimlikleri sağlamaz.
      - forum olmayan gruplar, grup sohbet oturumuna yönlendirilir
      - forum grupları, tam kaynak konuya değil grubun genel konu oturumuna (`:topic:1`) yönlendirilir

    Yoklama/Webhook için `allowed_updates`, `message_reaction` öğesini otomatik olarak içerir.

  </Accordion>

  <Accordion title="Onay tepkileri">
    `ackReaction`, OpenClaw gelen bir mesajı işlerken bir onay emojisi gönderir. `ackReactionScope`, bu emojinin gerçekte *ne zaman* gönderileceğine karar verir.

    **Emoji (`ackReaction`) çözümleme sırası:**

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - ajan kimliği emoji yedeği (`agents.list[].identity.emoji`, aksi halde "👀")

    Notlar:

    - Telegram Unicode emoji bekler (örneğin "👀").
    - Bir kanal veya hesap için tepkiyi devre dışı bırakmak üzere `""` kullanın.

    **Kapsam (`messages.ackReactionScope`):**

    Telegram sağlayıcısı kapsamı `messages.ackReactionScope` içinden okur (varsayılan `"group-mentions"`). Bugün Telegram hesabı veya Telegram kanalı düzeyinde bir geçersiz kılma yoktur.

    Değerler: `"all"` (DM’ler + gruplar), `"direct"` (yalnızca DM’ler), `"group-all"` (her grup mesajı, DM yok), `"group-mentions"` (botun anıldığı gruplar; **DM yok** — varsayılan budur), `"off"` / `"none"` (devre dışı).

    <Note>
    Varsayılan kapsam (`"group-mentions"`), doğrudan mesajlarda onay tepkilerini tetiklemez. Gelen Telegram DM’lerinde onay tepkisi almak için `messages.ackReactionScope` değerini `"direct"` veya `"all"` olarak ayarlayın. Değer Telegram sağlayıcısı başlangıcında okunur, bu yüzden değişikliğin etkili olması için Gateway yeniden başlatması gerekir.
    </Note>

  </Accordion>

  <Accordion title="Telegram olaylarından ve komutlarından yapılandırma yazmaları">
    Kanal yapılandırma yazmaları varsayılan olarak etkindir (`configWrites !== false`).

    Telegram tarafından tetiklenen yazmalar şunları içerir:

    - `channels.telegram.groups` öğesini güncellemek için grup taşıma olayları (`migrate_to_chat_id`)
    - `/config set` ve `/config unset` (komut etkinleştirme gerektirir)

    Devre dışı bırakın:

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

  <Accordion title="Uzun yoklama ile Webhook">
    Varsayılan uzun yoklamadır. Webhook modu için `channels.telegram.webhookUrl` ve `channels.telegram.webhookSecret` ayarlayın; isteğe bağlı `webhookPath`, `webhookHost`, `webhookPort` (varsayılanlar `/telegram-webhook`, `127.0.0.1`, `8787`).

    Uzun yoklama modunda OpenClaw, yeniden başlatma filigranını yalnızca bir güncelleme başarıyla dağıtıldıktan sonra kalıcı hale getirir. Bir işleyici başarısız olursa bu güncelleme aynı süreçte yeniden denenebilir kalır ve yeniden başlatma tekilleştirmesi için tamamlandı olarak yazılmaz.

    Yerel dinleyici `127.0.0.1:8787` adresine bağlanır. Genel giriş için yerel bağlantı noktasının önüne bir ters proxy koyun ya da bilinçli olarak `webhookHost: "0.0.0.0"` ayarlayın.

    Webhook modu, Telegram’a `200` döndürmeden önce istek korumalarını, Telegram gizli belirtecini ve JSON gövdesini doğrular.
    OpenClaw daha sonra güncellemeyi uzun yoklamada kullanılan aynı sohbet başına/konu başına bot hatları üzerinden eşzamansız olarak işler, böylece yavaş ajan turları Telegram’ın teslim ACK’sini bekletmez.

  </Accordion>

  <Accordion title="Sınırlar, yeniden deneme ve CLI hedefleri">
    - `channels.telegram.textChunkLimit` varsayılanı 4000'dir.
    - `channels.telegram.chunkMode="newline"`, uzunluğa göre bölmeden önce paragraf sınırlarını (boş satırlar) tercih eder.
    - `channels.telegram.mediaMaxMb` (varsayılan 100), gelen ve giden Telegram medya boyutunu sınırlar.
    - `channels.telegram.mediaGroupFlushMs` (varsayılan 500), Telegram albümlerinin/medya gruplarının OpenClaw tarafından tek bir gelen mesaj olarak gönderilmeden önce ne kadar süre arabelleğe alınacağını kontrol eder. Albüm parçaları geç geliyorsa artırın; albüm yanıt gecikmesini azaltmak için düşürün.
    - `channels.telegram.timeoutSeconds`, Telegram API istemcisi zaman aşımını geçersiz kılar (ayarlanmamışsa grammY varsayılanı geçerli olur). Bot istemcileri, yapılandırılmış değerleri 60 saniyelik giden metin/yazıyor isteği korumasının altında sınırlar; böylece OpenClaw'ın taşıma koruması ve geri dönüşü çalışmadan önce grammY görünür yanıt teslimini iptal etmez. Uzun yoklama yine de 45 saniyelik `getUpdates` isteği koruması kullanır; böylece boşta yoklamalar süresiz olarak terk edilmez.
    - `channels.telegram.pollingStallThresholdMs` varsayılan olarak `120000` olur; yalnızca hatalı pozitif yoklama-takılması yeniden başlatmaları için `30000` ile `600000` arasında ayarlayın.
    - grup bağlam geçmişi `channels.telegram.historyLimit` veya `messages.groupChat.historyLimit` (varsayılan 50) kullanır; `0` devre dışı bırakır.
    - yanıt/alinti/iletme ek bağlamı, Gateway üst mesajları gözlemlediğinde seçili tek bir konuşma bağlam penceresine normalize edilir; gözlemlenen-mesaj önbelleği OpenClaw SQLite Plugin durumunda yaşar ve `openclaw doctor --fix` eski yan dosyaları içe aktarır. Telegram güncellemelerde yalnızca tek bir sığ `reply_to_message` içerir, bu nedenle önbellekten eski zincirler Telegram'ın mevcut güncelleme yüküyle sınırlıdır.
    - Telegram izin listeleri öncelikle aracıyı kimin tetikleyebileceğini sınırlar; tam bir ek-bağlam redaksiyon sınırı değildir.
    - DM geçmişi denetimleri:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - `channels.telegram.retry` yapılandırması, kurtarılabilir giden API hataları için Telegram gönderme yardımcılarına (CLI/araçlar/eylemler) uygulanır. Gelen son-yanıt teslimi de Telegram bağlantı öncesi hataları için sınırlı güvenli-gönderme yeniden denemesi kullanır, ancak görünür mesajları çoğaltabilecek belirsiz gönderim sonrası ağ zarflarını yeniden denemez.

    CLI ve mesaj-aracı gönderme hedefleri sayısal sohbet kimliği, kullanıcı adı veya forum konusu hedefi olabilir:

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

    Telegram gönderimi şunları da destekler:

    - `channels.telegram.capabilities.inlineButtons` izin verdiğinde satır içi klavyeler için `buttons` bloklarıyla `--presentation`
    - bot o sohbette sabitleyebildiğinde sabitlenmiş teslim istemek için `--pin` veya `--delivery '{"pin":true}'`
    - giden görselleri, GIF'leri ve videoları sıkıştırılmış fotoğraf, animasyonlu-medya veya video yüklemeleri yerine belge olarak göndermek için `--force-document`

    Eylem kapılama:

    - `channels.telegram.actions.sendMessage=false`, yoklamalar dahil giden Telegram mesajlarını devre dışı bırakır
    - `channels.telegram.actions.poll=false`, normal gönderimleri etkin bırakırken Telegram yoklama oluşturmayı devre dışı bırakır

  </Accordion>

  <Accordion title="Telegram'da exec onayları">
    Telegram, onaylayıcı DM'lerinde exec onaylarını destekler ve isteğe bağlı olarak istemleri kaynak sohbette veya konuda yayınlayabilir. Onaylayıcılar sayısal Telegram kullanıcı kimlikleri olmalıdır.

    Yapılandırma yolu:

    - `channels.telegram.execApprovals.enabled` (en az bir onaylayıcı çözümlenebilir olduğunda otomatik etkinleşir)
    - `channels.telegram.execApprovals.approvers` (`commands.ownerAllowFrom` içindeki sayısal sahip kimliklerine geri döner)
    - `channels.telegram.execApprovals.target`: `dm` (varsayılan) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` ve `defaultTo`, botla kimin konuşabileceğini ve normal yanıtları nereye göndereceğini denetler. Birini exec onaylayıcısı yapmazlar. İlk onaylanmış DM eşleştirmesi, henüz komut sahibi yoksa `commands.ownerAllowFrom` değerini başlatır; böylece tek sahipli kurulum, `execApprovals.approvers` altında kimlikleri yinelemeden çalışır.

    Kanal teslimi komut metnini sohbette gösterir; `channel` veya `both` seçeneklerini yalnızca güvenilir gruplarda/konularda etkinleştirin. İstem bir forum konusuna düştüğünde OpenClaw, onay istemi ve takip için konuyu korur. Exec onaylarının süresi varsayılan olarak 30 dakika sonra dolar.

    Satır içi onay düğmeleri ayrıca `channels.telegram.capabilities.inlineButtons` ayarının hedef yüzeye (`dm`, `group` veya `all`) izin vermesini gerektirir. `plugin:` ön ekli onay kimlikleri Plugin onayları üzerinden çözülür; diğerleri önce exec onayları üzerinden çözülür.

    Bkz. [Exec onayları](/tr/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Hata yanıtı denetimleri

Aracı bir teslim veya sağlayıcı hatasıyla karşılaştığında, hata ilkesi hata mesajlarının Telegram sohbetine gönderilip gönderilmeyeceğini denetler:

| Anahtar                             | Değerler                   | Varsayılan      | Açıklama                                                                                                                                                                                                      |
| ----------------------------------- | -------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `always`, `once`, `silent` | `always`        | `always` — her hata mesajını sohbete gönder. `once` — her benzersiz hata mesajını bekleme penceresi başına bir kez gönder (yinelenen aynı hataları bastır). `silent` — hata mesajlarını sohbete asla gönderme. |
| `channels.telegram.errorCooldownMs` | sayı (ms)                  | `14400000` (4h) | `once` ilkesi için bekleme penceresi. Bir hata gönderildikten sonra aynı hata mesajı bu aralık geçene kadar bastırılır. Kesintiler sırasında hata spam'ini önler.                                                |

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
      - BotFather: `/setprivacy` -> Disable
      - ardından botu gruptan kaldırıp yeniden ekleyin
    - `openclaw channels status`, yapılandırma bahsedilmeyen grup mesajları beklediğinde uyarır.
    - `openclaw channels status --probe` açık sayısal grup kimliklerini denetleyebilir; `"*"` jokeri üyelik açısından yoklanamaz.
    - hızlı oturum testi: `/activation always`.

  </Accordion>

  <Accordion title="Bot grup mesajlarını hiç görmüyor">

    - `channels.telegram.groups` varsa grup listelenmelidir (veya `"*"` içermelidir)
    - botun gruptaki üyeliğini doğrulayın
    - günlükleri inceleyin: atlama nedenleri için `openclaw logs --follow`

  </Accordion>

  <Accordion title="Komutlar kısmen çalışıyor veya hiç çalışmıyor">

    - gönderen kimliğinizi yetkilendirin (eşleştirme ve/veya sayısal `allowFrom`)
    - grup ilkesi `open` olsa bile komut yetkilendirmesi yine de geçerlidir
    - `BOT_COMMANDS_TOO_MUCH` ile `setMyCommands failed`, yerel menüde çok fazla giriş olduğu anlamına gelir; Plugin/skill/özel komutları azaltın veya yerel menüleri devre dışı bırakın
    - `deleteMyCommands` / `setMyCommands` başlangıç çağrıları ve `sendChatAction` yazıyor çağrıları sınırlıdır ve istek zaman aşımında Telegram'ın taşıma geri dönüşü üzerinden bir kez yeniden denenir. Kalıcı ağ/fetch hataları genellikle `api.telegram.org` için DNS/HTTPS erişilebilirlik sorunlarını gösterir

  </Accordion>

  <Accordion title="Başlangıç yetkisiz token bildiriyor">

    - `getMe returned 401`, yapılandırılmış bot token'ı için bir Telegram kimlik doğrulama hatasıdır.
    - BotFather'da bot token'ını yeniden kopyalayın veya yeniden oluşturun, ardından varsayılan hesap için `channels.telegram.botToken`, `channels.telegram.tokenFile`, `channels.telegram.accounts.<id>.botToken` veya `TELEGRAM_BOT_TOKEN` değerini güncelleyin.
    - Başlangıç sırasında `deleteWebhook 401 Unauthorized` da bir kimlik doğrulama hatasıdır; bunu "Webhook yok" olarak ele almak yalnızca aynı hatalı-token arızasını daha sonraki API çağrılarına ertelemiş olur.

  </Accordion>

  <Accordion title="Yoklama veya ağ kararsızlığı">

    - Node 22+ + özel fetch/proxy, AbortSignal türleri eşleşmezse anında iptal davranışını tetikleyebilir.
    - Bazı barındırıcılar `api.telegram.org` adresini önce IPv6 olarak çözer; bozuk IPv6 çıkışı aralıklı Telegram API hatalarına neden olabilir.
    - Günlükler `TypeError: fetch failed` veya `Network request for 'getUpdates' failed!` içeriyorsa OpenClaw artık bunları kurtarılabilir ağ hataları olarak yeniden dener.
    - Yoklama başlangıcı sırasında OpenClaw, grammY için başarılı başlangıç `getMe` yoklamasını yeniden kullanır; böylece çalıştırıcının ilk `getUpdates` öncesinde ikinci bir `getMe` çağrısına ihtiyacı olmaz.
    - Yoklama başlangıcı sırasında `deleteWebhook` geçici bir ağ hatasıyla başarısız olursa OpenClaw, başka bir yoklama öncesi denetim-düzlemi çağrısı yapmak yerine uzun yoklamaya devam eder. Hâlâ etkin olan Webhook bir `getUpdates` çakışması olarak yüzeye çıkar; OpenClaw ardından Telegram taşımasını yeniden oluşturur ve Webhook temizliğini yeniden dener.
    - Telegram soketleri kısa ve sabit bir aralıkta yeniden çevrime giriyorsa düşük bir `channels.telegram.timeoutSeconds` olup olmadığını denetleyin; bot istemcileri yapılandırılmış değerleri giden ve `getUpdates` isteği korumalarının altında sınırlar, ancak eski sürümler bu değer bu korumaların altında ayarlandığında her yoklamayı veya yanıtı iptal edebiliyordu.
    - Günlükler `Polling stall detected` içeriyorsa OpenClaw varsayılan olarak tamamlanmış uzun-yoklama canlılığı olmadan 120 saniye geçtikten sonra yoklamayı yeniden başlatır ve Telegram taşımasını yeniden oluşturur.
    - `openclaw channels status --probe` ve `openclaw doctor`, çalışan bir yoklama hesabı başlangıç toleransından sonra `getUpdates` tamamlamadığında, çalışan bir Webhook hesabı başlangıç toleransından sonra `setWebhook` tamamlamadığında veya son başarılı yoklama taşıma etkinliği bayat olduğunda uyarır.
    - `channels.telegram.pollingStallThresholdMs` değerini yalnızca uzun süre çalışan `getUpdates` çağrıları sağlıklıyken ama barındırıcınız yine de hatalı yoklama-takılması yeniden başlatmaları bildiriyorsa artırın. Kalıcı takılmalar genellikle barındırıcı ile `api.telegram.org` arasındaki proxy, DNS, IPv6 veya TLS çıkış sorunlarına işaret eder.
    - Telegram ayrıca Bot API taşıması için `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` ve bunların küçük harfli varyantları dahil süreç proxy ortam değişkenlerini de dikkate alır. `NO_PROXY` / `no_proxy` yine de `api.telegram.org` adresini baypas edebilir.
    - OpenClaw tarafından yönetilen proxy bir hizmet ortamı için `OPENCLAW_PROXY_URL` üzerinden yapılandırılmışsa ve standart proxy ortam değişkeni yoksa Telegram bu URL'yi Bot API taşıması için de kullanır.
    - Kararsız doğrudan çıkış/TLS olan VPS barındırıcılarında, Telegram API çağrılarını `channels.telegram.proxy` üzerinden yönlendirin:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ varsayılan olarak `autoSelectFamily=true` kullanır (WSL2 hariç). Telegram DNS sonuç sırası önce `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`, sonra `channels.telegram.network.dnsResultOrder`, sonra `NODE_OPTIONS=--dns-result-order=ipv4first` gibi süreç varsayılanını dikkate alır; hiçbiri geçerli değilse Node 22+ `ipv4first` değerine geri döner.
    - Ana makineniz WSL2 ise veya açıkça yalnızca IPv4 davranışıyla daha iyi çalışıyorsa, aile seçimini zorlayın:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - RFC 2544 kıyaslama aralığı yanıtlarına (`198.18.0.0/15`) varsayılan olarak
      Telegram medya indirmeleri için zaten izin verilir. Güvenilir bir sahte IP veya
      şeffaf proxy, medya indirmeleri sırasında `api.telegram.org` adresini başka bir
      özel/dahili/özel kullanım adresine yeniden yazıyorsa, yalnızca Telegram için
      atlamayı etkinleştirebilirsiniz:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - Aynı etkinleştirme, hesap başına
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork` konumunda kullanılabilir.
    - Proxy'niz Telegram medya ana makinelerini `198.18.x.x` olarak çözümlüyorsa, önce
      tehlikeli bayrağı kapalı bırakın. Telegram medyası varsayılan olarak RFC 2544
      kıyaslama aralığına zaten izin verir.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork`, Telegram
      medya SSRF korumalarını zayıflatır. Bunu yalnızca Clash, Mihomo veya Surge
      sahte IP yönlendirmesi gibi, RFC 2544 kıyaslama aralığı dışındaki özel veya
      özel kullanım yanıtlarını sentezleyen güvenilir operatör kontrollü proxy
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

Daha fazla yardım: [Kanal sorun giderme](/tr/channels/troubleshooting).

## Yapılandırma referansı

Birincil referans: [Yapılandırma referansı - Telegram](/tr/gateway/config-channels#telegram).

<Accordion title="Yüksek sinyalli Telegram alanları">

- başlatma/kimlik doğrulama: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` normal bir dosyaya işaret etmelidir; sembolik bağlantılar reddedilir)
- erişim denetimi: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, üst düzey `bindings[]` (`type: "acp"`)
- konu varsayılanları: `groups.<chatId>.topics."*"` eşleşmeyen forum konularına uygulanır; kesin konu kimlikleri bunu geçersiz kılar
- exec onayları: `execApprovals`, `accounts.*.execApprovals`
- komut/menü: `commands.native`, `commands.nativeSkills`, `customCommands`
- iş parçacıkları/yanıtlar: `replyToMode`
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
Çok hesaplı öncelik: iki veya daha fazla hesap kimliği yapılandırıldığında, varsayılan yönlendirmeyi açık hale getirmek için `channels.telegram.defaultAccount` ayarını yapın (veya `channels.telegram.accounts.default` ekleyin). Aksi halde OpenClaw ilk normalleştirilmiş hesap kimliğine geri döner ve `openclaw doctor` uyarır. Adlandırılmış hesaplar `channels.telegram.allowFrom` / `groupAllowFrom` değerlerini devralır, ancak `accounts.default.*` değerlerini devralmaz.
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
