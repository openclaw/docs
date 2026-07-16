---
read_when:
    - Telegram özellikleri veya webhook'lar üzerinde çalışma
summary: Telegram bot desteği durumu, özellikleri ve yapılandırması
title: Telegram
x-i18n:
    generated_at: "2026-07-16T17:07:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 51c155afeb147b92a55f181be269ce13c4fd6b609a94d680cd7e091cd4a7c236
    source_path: channels/telegram.md
    workflow: 16
---

Üretimde bot DM'leri ve gruplar için grammY üzerinden kullanıma hazırdır. Varsayılan aktarım yöntemi uzun yoklamadır; webhook modu isteğe bağlıdır.

<CardGroup cols={3}>
  <Card title="Eşleştirme" icon="link" href="/tr/channels/pairing">
    Telegram için varsayılan DM ilkesi eşleştirmedir.
  </Card>
  <Card title="Kanal sorunlarını giderme" icon="wrench" href="/tr/channels/troubleshooting">
    Kanallar arası tanılama ve onarım yönergeleri.
  </Card>
  <Card title="Gateway yapılandırması" icon="settings" href="/tr/gateway/configuration">
    Eksiksiz kanal yapılandırma kalıpları ve örnekleri.
  </Card>
</CardGroup>

## Hızlı kurulum

<Steps>
  <Step title="BotFather'da bot belirtecini oluşturun">
    Her iki akışın sonunda da OpenClaw'a yapıştıracağınız bir belirteç elde edilir — birini seçin:

    - **Sohbet akışı**: Telegram'ı açın, **@BotFather** ile sohbet edin (kullanıcı adının tam olarak `@BotFather` olduğunu doğrulayın), `/newbot` komutunu çalıştırın, istemleri izleyin ve belirteci kaydedin.
    - **Web akışı**: [BotFather'ın web uygulamasını](https://t.me/BotFather?startapp) açın — [web.telegram.org](https://web.telegram.org) dahil her Telegram istemcisinde çalışır — kullanıcı arayüzünde botu oluşturun ve belirtecini kopyalayın.

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

    Ortam değişkeni geri dönüşü: `TELEGRAM_BOT_TOKEN` (yalnızca varsayılan hesap; adlandırılmış hesaplar `botToken` veya `tokenFile` kullanmalıdır).
    Telegram, `openclaw channels login telegram` kullanmaz; belirteci yapılandırmada/ortam değişkeninde ayarlayın, ardından Gateway'i başlatın.

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
    Botu grubunuza ekleyin, ardından grup erişimi için gereken iki kimliği alın:

    - `allowFrom` / `groupAllowFrom` için Telegram kullanıcı kimliğiniz
    - `channels.telegram.groups` altındaki anahtar olarak Telegram grup sohbeti kimliği

    Grup sohbeti kimliğini `openclaw logs --follow`, iletilen kimlikleri gösteren bir bot veya Bot API `getUpdates` üzerinden alın. Gruba izin verildikten sonra `/whoami@<bot_username>`, kullanıcı ve grup kimliklerini doğrular.

    `-100` ile başlayan negatif süper grup kimlikleri, grup sohbeti kimlikleridir. Bunlar `groupAllowFrom` altına değil, `channels.telegram.groups` altına yazılır.

  </Step>
</Steps>

<Note>
Belirteç çözümleme hesap duyarlıdır: `tokenFile`, `botToken` değerinden; o da ortam değişkeninden önceliklidir ve yapılandırma her zaman `TELEGRAM_BOT_TOKEN` değerinden önceliklidir (bu yalnızca varsayılan hesap için çözümlenir). Başarılı bir başlangıçtan sonra OpenClaw, yeniden başlatmalarda ek bir `getMe` çağrısını atlamak için bot kimliğini 24 saate kadar önbelleğe alır; belirtecin değiştirilmesi veya kaldırılması bu önbelleği temizler.
</Note>

## Telegram tarafındaki ayarlar

<AccordionGroup>
  <Accordion title="Gizlilik modu ve grup görünürlüğü">
    Telegram botlarında varsayılan olarak **Privacy Mode** etkindir ve bu, botların hangi grup mesajlarını alacağını sınırlar.

    Tüm grup mesajlarını görmek için şunlardan birini yapın:

    - `/setprivacy` aracılığıyla gizlilik modunu devre dışı bırakın veya
    - botu grup yöneticisi yapın.

    Gizlilik modunu değiştirdikten sonra Telegram'ın değişikliği uygulaması için botu her gruptan kaldırıp yeniden ekleyin.

  </Accordion>

  <Accordion title="Grup izinleri">
    Yönetici durumu Telegram grup ayarlarından denetlenir. Yönetici botlar tüm grup mesajlarını alır; bu, sürekli etkin grup davranışı için kullanışlıdır.
  </Accordion>

  <Accordion title="Yararlı BotFather seçenekleri">

    - `/setjoingroups` — gruplara eklemeye izin ver/reddet
    - `/setprivacy` — grup görünürlüğü davranışı

    Sohbet komutları yerine kullanıcı arayüzünü tercih ediyorsanız aynı ayarlara [BotFather'ın web uygulamasından](https://t.me/BotFather?startapp) da erişebilirsiniz.

  </Accordion>
</AccordionGroup>

## Pano Mini Uygulaması

OpenClaw panosunu Telegram içinde açmak için botla olan bir DM'de `/dashboard` komutunu çalıştırın.

Gereksinimler:

- Yayımlanan HTTPS Mini App URL'si için `gateway.tailscale.mode: "serve"` veya `"funnel"`.
- Sayısal Telegram kullanıcı kimliğiniz, seçili hesabın etkin `allowFrom` değerinde veya `commands.ownerAllowFrom` içinde bulunmalıdır.
- Bir DM kullanın. Gruplarda `/dashboard`, `open this in a DM with the bot` ile yanıt verir ve düğme göndermez.
- Docker kurulumları: Serve/Funnel modları, Gateway'in `tailscaled` yanında geri döngü arabirimine bağlanmasını gerektirir; yayımlanmış bağlantı noktalarına sahip köprü ağı bunu karşılayamaz. Gateway konteynerini `network_mode: host` ile çalıştırın ve ana makinenin `tailscaled` soketini (`/var/run/tailscale`) ve `tailscale` CLI'sini konteynere bağlayın.

Mini App, yalnızca Tailscale'e özel bir v1 yoludur ve Telegram Web iframe'ini desteklemez.

## Erişim denetimi ve etkinleştirme

### Grup bot kimliği

Gruplarda ve forum konularında, yapılandırılmış bot kullanıcı adının açıkça anılması (örneğin `@my_bot`), temsilci kişilik adı Telegram kullanıcı adından farklı olsa bile seçili OpenClaw temsilcisine hitap eder. Grup sessizlik ilkesi ilgisiz trafik için geçerliliğini korur, ancak bot kullanıcı adı hiçbir zaman "başka biri" değildir.

<Tabs>
  <Tab title="DM ilkesi">
    `channels.telegram.dmPolicy`, doğrudan mesaj erişimini denetler:

    - `pairing` (varsayılan)
    - `allowlist` (`allowFrom` içinde en az bir gönderen kimliği gerektirir)
    - `open` (`allowFrom` değerinin `"*"` içermesini gerektirir)
    - `disabled`

    `allowFrom: ["*"]` ile birlikte `dmPolicy: "open"`, botun kullanıcı adını bulan veya tahmin eden herhangi bir Telegram hesabının bota komut vermesine olanak tanır. Bunu yalnızca araçları sıkı şekilde kısıtlanmış, bilinçli olarak herkese açık botlar için kullanın; tek sahipli botlar, sayısal kullanıcı kimlikleriyle `allowlist` kullanmalıdır.

    `channels.telegram.allowFrom`, sayısal Telegram kullanıcı kimliklerini kabul eder. `telegram:` / `tg:` önekleri kabul edilir ve normalleştirilir.
    Çok hesaplı yapılandırmalarda, kısıtlayıcı üst düzey `channels.telegram.allowFrom` bir güvenlik sınırıdır: hesap düzeyindeki `allowFrom: ["*"]`, birleştirilmiş etkin izin verilenler listesinde hâlâ açık bir joker karakter bulunmadıkça bu hesabı herkese açık yapmaz.
    Boş `allowFrom` ile `dmPolicy: "allowlist"`, tüm DM'leri engeller ve yapılandırma doğrulaması tarafından reddedilir.
    Kurulum yalnızca sayısal kullanıcı kimliklerini ister. Yapılandırmanızda eski bir kurulumdan kalan `@username` izin verilenler listesi girdileri varsa bunları sayısal kimliklere çözümlemek için `openclaw doctor --fix` komutunu çalıştırın (mümkün olan en iyi şekilde; bir Telegram bot belirteci gerektirir).
    Daha önce eşleştirme deposundaki izin verilenler listesi dosyalarına güveniyorsanız `openclaw doctor --fix`, izin verilenler listesi akışları için girdileri `channels.telegram.allowFrom` içine kurtarabilir (örneğin `dmPolicy: "allowlist"` henüz açık kimlik içermiyorsa).

    Tek sahipli botlarda, önceki eşleştirme onaylarına güvenmek yerine açık sayısal `allowFrom` kimlikleriyle `dmPolicy: "allowlist"` kullanmayı tercih edin.

    Yaygın karışıklık: DM eşleştirme onayı, "bu gönderen her yerde yetkilidir" anlamına gelmez. Eşleştirme yalnızca DM erişimi verir. Henüz bir komut sahibi yoksa ilk onaylanan eşleştirme ayrıca `commands.ownerAllowFrom` değerini ayarlayarak yalnızca sahibe açık komutlara ve exec onaylarına açık bir operatör hesabı atar. Grup gönderen yetkilendirmesi yine açık yapılandırma izin listelerinden gelir.
    Tek bir kimlikle hem DM'ler hem de grup komutları için yetkili olmak üzere: sayısal Telegram kullanıcı kimliğinizi `channels.telegram.allowFrom` içine ekleyin ve yalnızca sahibe açık komutlar için `commands.ownerAllowFrom` değerinin `telegram:<your user id>` içerdiğinden emin olun.

    ### Telegram kullanıcı kimliğinizi bulma

    Daha güvenli (üçüncü taraf bot yok): Botunuza DM gönderin, `openclaw logs --follow` komutunu çalıştırın ve `from.id` değerini okuyun.

    Resmî Bot API yöntemi:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    Üçüncü taraf (daha az özel): `@userinfobot` veya `@getidsbot`.

  </Tab>

  <Tab title="Grup ilkesi ve izin verilenler listeleri">
    İki denetim birlikte uygulanır:

    1. **Hangi gruplara izin verilir** (`channels.telegram.groups`)
       - `groups` yapılandırması yok, `groupPolicy: "open"`: herhangi bir grup, grup kimliği denetimlerini geçer
       - `groups` yapılandırması yok, `groupPolicy: "allowlist"` (varsayılan): `groups` girdileri (veya `"*"`) eklenene kadar tüm gruplar engellenir
       - `groups` yapılandırılmış: izin verilenler listesi görevi görür (açık kimlikler veya `"*"`)

    2. **Gruplarda hangi gönderenlere izin verilir** (`channels.telegram.groupPolicy`)
       - `open` / `allowlist` (varsayılan) / `disabled`

    `groupAllowFrom`, grup gönderenlerini filtreler; ayarlanmamışsa Telegram `allowFrom` değerine geri döner (eşleştirme deposuna değil — grup göndereni yetkilendirmesi hiçbir zaman DM eşleştirme deposu onaylarını devralmaz; bu, `2026.2.25` sürümünden beri geçerli bir güvenlik sınırıdır).
    `groupAllowFrom` girdileri sayısal Telegram kullanıcı kimlikleri olmalıdır (`telegram:` / `tg:` önekleri normalleştirilir); sayısal olmayan girdiler yok sayılır. Grup veya süper grup sohbeti kimliklerini buraya yazmayın — negatif sohbet kimlikleri `channels.telegram.groups` altına yazılır.
    Tek sahipli botlar için pratik kalıp: kullanıcı kimliğinizi `channels.telegram.allowFrom` içine ayarlayın, `groupAllowFrom` değerini ayarlamadan bırakın ve hedef gruplara `channels.telegram.groups` altında izin verin.
    `channels.telegram` yapılandırmada tamamen eksikse `channels.defaults.groupPolicy` açıkça ayarlanmadığı sürece çalışma zamanı varsayılan olarak güvenli biçimde kapalı `groupPolicy="allowlist"` değerini kullanır.

    Yalnızca sahip için grup kurulumu:

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

    Gruptan `@<bot_username> ping` ile test edin. `requireMention: true` olduğu sürece normal grup mesajları botu tetiklemez.

    Belirli bir gruptaki tüm üyelere izin verin:

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

    Belirli bir grupta yalnızca belirli kullanıcılara izin verin:

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
      Yaygın hata: `groupAllowFrom` bir grup izin verilenler listesi değildir.

      - Negatif Telegram grup/süper grup sohbeti kimlikleri (`-1001234567890`) `channels.telegram.groups` altına yazılır.
      - Telegram kullanıcı kimlikleri (`8734062810`), izin verilen bir grup içinde hangi kişilerin botu tetikleyebileceğini sınırlamak için `groupAllowFrom` altına yazılır.
      - Yalnızca izin verilen bir grubun herhangi bir üyesinin botla konuşmasına izin vermek için `groupAllowFrom: ["*"]` kullanın.

    </Warning>

  </Tab>

  <Tab title="Bahsetme davranışı">
    Grup yanıtları varsayılan olarak bahsetme gerektirir. Bahsetme şunlardan biriyle yapılabilir:

    - yerel bir `@botusername` bahsetmesi veya
    - `agents.list[].groupChat.mentionPatterns` ya da `messages.groupChat.mentionPatterns` içindeki bir bahsetme kalıbı

    Oturum düzeyindeki seçenekler (yalnızca durum, kalıcı değildir): `/activation always`, `/activation mention`. Kalıcılık için yapılandırmayı kullanın:

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

    Grup geçmişi bağlamı her zaman açıktır ve `historyLimit` ile sınırlandırılır. Grup geçmişi penceresini devre dışı bırakmak için `channels.telegram.historyLimit: 0` değerini ayarlayın. `openclaw doctor --fix`, kullanımdan kaldırılmış `includeGroupHistoryContext` anahtarını kaldırır.

    Grup sohbeti kimliğini alma: bir grup mesajını `@userinfobot` / `@getidsbot` adresine iletin, `openclaw logs --follow` içindeki `chat.id` değerini okuyun, Bot API `getUpdates` çıktısını inceleyin veya (gruba izin verildikten sonra) `/whoami@<bot_username>` komutunu çalıştırın.

  </Tab>
</Tabs>

## Çalışma zamanı davranışı

- Telegram, gateway işlemi içinde çalışır.
- Yönlendirme deterministiktir: Telegram'dan gelen iletilerin yanıtları Telegram'a geri gönderilir (kanalları model seçmez).
- Gelen iletiler; yanıt meta verileri, medya yer tutucuları ve gateway'in gözlemlediği yanıtlar için kalıcı yanıt zinciri bağlamıyla ortak kanal zarfına normalleştirilir.
- Grup oturumları grup kimliğine göre yalıtılır. Forum konularının sonuna `:topic:<threadId>` eklenir.
- DM iletileri `message_thread_id` taşıyabilir; OpenClaw bunu yanıtlarda korur. DM konu oturumları yalnızca Telegram `getMe` bot için `has_topics_enabled: true` bildirdiğinde ayrılır; aksi takdirde DM'ler düz oturumda kalır.
- Uzun yoklama, sohbet ve iş parçacığı başına sıralamayla grammY çalıştırıcısını kullanır. Çalıştırıcı havuzu eşzamanlılığı `agents.defaults.maxConcurrent` kullanır.
- Çok hesaplı başlatma, büyük bot filolarının tüm hesap yoklamalarını aynı anda yaymaması için eşzamanlı `getMe` yoklamalarını sınırlar.
- Her gateway işlemi, aynı anda yalnızca bir etkin yoklayıcının bir bot belirtecini kullanabilmesini sağlamak için uzun yoklamayı korur. Kalıcı `getUpdates` 409 çakışmaları, aynı belirteci kullanan başka bir OpenClaw gateway'ine, betiğine veya harici yoklayıcıya işaret eder.
- Yoklama izleme mekanizması, varsayılan olarak tamamlanmış `getUpdates` canlılık sinyali olmadan 120 saniye geçtikten sonra yeniden başlatılır. `channels.telegram.pollingStallThresholdMs` değerini (30000-600000, hesap başına geçersiz kılmalar desteklenir) yalnızca dağıtımınız uzun süren işler sırasında hatalı yoklama-duraklaması yeniden başlatmaları görüyorsa yükseltin.
- Telegram Bot API, okundu bilgisi desteğine sahip değildir (`sendReadReceipts` geçerli değildir).

<Note>
  `channels.telegram.dm.threadReplies` ve `channels.telegram.direct.<chatId>.threadReplies` kaldırıldı. Yapılandırmanızda bu anahtarlar hâlâ varsa yükseltmeden sonra `openclaw doctor --fix` komutunu çalıştırın. DM konu yönlendirmesi artık Telegram `getMe.has_topics_enabled` değerini izler (BotFather iş parçacıklı modu tarafından denetlenir): konuları etkin botlar, Telegram `message_thread_id` gönderdiğinde iş parçacığı kapsamlı DM oturumlarını kullanır; diğer DM'ler düz oturumda kalır.
</Note>

## Özellik başvurusu

<AccordionGroup>
  <Accordion title="Canlı akış önizlemesi (ileti düzenlemeleri)">
    OpenClaw, doğrudan sohbetlerde, gruplarda ve konularda kısmi yanıtları gerçek zamanlı olarak yayınlar: bir önizleme iletisi gönderir, ardından `editMessageText` işlemini tekrar tekrar gerçekleştirip aynı yerde son hâline getirir.

    - `channels.telegram.streaming`, `off | partial | block | progress` değeridir (varsayılan: `partial`)
    - kısa ilk yanıt önizlemelerine gecikme azaltma uygulanır, ardından çalıştırma hâlâ etkinse sınırlı bir gecikmeden sonra oluşturulur
    - `progress`, araç ilerlemesi için düzenlenebilir tek bir durum taslağı tutar, yanıt etkinliği araç ilerlemesinden önce geldiğinde kararlı durum etiketini gösterir, tamamlandığında taslağı temizler ve nihai yanıtı normal bir ileti olarak gönderir
    - `streaming.preview.toolProgress`, araç/ilerleme güncellemelerinin aynı düzenlenmiş önizleme iletisini yeniden kullanıp kullanmayacağını denetler (varsayılan: önizleme akışı etkinken `true`)
    - `streaming.preview.commandText`, bu satırlardaki komut/çalıştırma ayrıntısını denetler: `raw` (varsayılan) veya `status` (yalnızca araç etiketi)
    - `streaming.progress.commentary` (varsayılan: `false`), geçici ilerleme taslağında asistan açıklaması/önsöz metnini etkinleştirir
    - eski `channels.telegram.streamMode`, Boole `streaming` değerleri ve kullanımdan kaldırılmış yerel taslak önizleme anahtarları algılanır; bunları taşımak için `openclaw doctor --fix` komutunu çalıştırın

    Araç ilerleme satırları, araçlar çalışırken gösterilen kısa durum güncellemeleridir (komut yürütme, dosya okumaları, planlama güncellemeleri, yama özetleri, uygulama sunucusu modunda Codex önsözü/açıklaması). Telegram bunları varsayılan olarak açık tutar (`v2026.4.22`+ sürümünden yayımlanmış davranışla eşleşir).

    Yanıt önizleme düzenlemelerini koruyup araç ilerleme satırlarını gizleyin:

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "partial",
            "preview": { "toolProgress": false }
          }
        }
      }
    }
    ```

    Araç ilerlemesini görünür tutup komut/çalıştırma metnini gizleyin:

    ```json
    {
      "channels": {
        "telegram": {
          "streaming": {
            "mode": "partial",
            "preview": { "commandText": "status" }
          }
        }
      }
    }
    ```

    `progress` modu, nihai yanıtı o iletinin içine düzenlemeden araç ilerlemesini gösterir. Komut metni ilkesini `streaming.progress` altına yerleştirin:

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

    `streaming.mode: "off"`, önizleme düzenlemelerini devre dışı bırakır ve genel araç/ilerleme bildirimlerini bağımsız durum iletileri olarak göndermek yerine bastırır; onay istemleri, medya ve hatalar normal nihai teslim yoluyla yönlendirilmeye devam eder. `streaming.preview.toolProgress: false` yalnızca yanıt önizleme düzenlemelerini korur.

    <Note>
      Seçili alıntı yanıtları istisnadır. `replyToMode`; `first`, `all` veya `batched` olduğunda ve gelen iletide seçili alıntı metni bulunduğunda OpenClaw, yanıt önizlemesini düzenlemek yerine nihai yanıtı Telegram'ın yerel alıntı yanıtlama yolu üzerinden gönderir; bu nedenle `streaming.preview.toolProgress` o turda durum satırlarını gösteremez. Seçili alıntı metni olmayan geçerli ileti yanıtları yayınlanmaya devam eder. Araç ilerlemesinin görünürlüğü yerel alıntı yanıtlarından daha önemliyse `replyToMode: "off"`, bu ödünleşimi kabul etmek içinse `streaming.preview.toolProgress: false` değerini ayarlayın.
    </Note>

    Yalnızca metin içeren yanıtlar için: kısa önizlemeler aynı yerde nihai düzenlemeyi alır; birden çok iletiye bölünen uzun nihai yanıtlar önizlemeyi ilk parça olarak yeniden kullanır, ardından yalnızca kalanı gönderir; ilerleme modu nihai yanıtları durum taslağını temizler ve normal nihai teslimi kullanır; tamamlanma onaylanmadan önce nihai düzenleme başarısız olursa OpenClaw normal nihai teslime geri döner ve eski önizlemeyi temizler. Karmaşık yanıtlar (medya yükleri) için OpenClaw her zaman normal nihai teslime geri döner ve önizlemeyi temizler.

    Önizleme akışı ve blok akışı birbirini dışlar — blok akışı açıkça etkinleştirildiğinde OpenClaw çift akışı önlemek için önizleme akışını atlar.

    Akıl yürütme: `/reasoning stream`, üretim sırasında akıl yürütmeyi canlı önizlemeye aktarır, ardından nihai teslimden sonra akıl yürütme önizlemesini siler (görünür tutmak için `/reasoning on` kullanın). Nihai yanıt, akıl yürütme metni olmadan gönderilir.

  </Accordion>

  <Accordion title="Zengin ileti biçimlendirmesi">
    Giden metin varsayılan olarak güncel istemcilerde okunabilen standart Telegram HTML iletilerini kullanır: kalın, italik, bağlantılar, kod, spoiler'lar, alıntılar — Bot API 10.2'ye özgü zengin blokları (yerel tablolar, ayrıntılar, zengin medya, formüller) değil.

    Bot API 10.2 zengin iletilerini etkinleştirin:

```json5
{
  channels: {
    telegram: {
      richMessages: true,
    },
  },
}
```

    Etkinleştirildiğinde: aracıya bu bot/hesap için zengin iletilerin kullanılabilir olduğu bildirilir (desteklenen Markdown + HTML adacığı yazım sözleşmesiyle); Markdown metni, OpenClaw'ın Markdown IR'si üzerinden türü belirlenmiş Bot API 10.2 zengin blokları (başlıklar, tablolar, ayrıntılar, kontrol listeleri, zengin medya, formüller, haritalar, kolajlar) olarak işlenir; medya açıklamaları Telegram HTML açıklamalarını kullanmaya devam eder (zengin iletiler açıklamaların yerini almaz ve açıklamalar en fazla 1024 karakter olabilir).

    Bu, model metnini Telegram'ın zengin Markdown işaretlerinden uzak tutar; böylece `$400-600K` gibi para birimleri matematik olarak ayrıştırılmaz. Uzun zengin metin, Telegram sınırlarına göre otomatik olarak bölünür. 20 sütun sınırını aşan tablolar kod bloğuna geri döner.

    Varsayılan: istemci uyumluluğu için kapalıdır — bazı güncel Masaüstü, Web, Android ve üçüncü taraf istemciler kabul edilen zengin iletileri desteklenmiyor olarak işler. Botla kullanılan her istemci bunları işleyemiyorsa bunu kapalı tutun. `/status`, geçerli oturumda zengin iletilerin açık mı kapalı mı olduğunu gösterir.

    Bağlantı önizlemeleri varsayılan olarak açıktır. `channels.telegram.linkPreview: false`, zengin metin için otomatik varlık algılamayı devre dışı bırakır.

  </Accordion>

  <Accordion title="Yerel komutlar ve özel komutlar">
    Telegram'ın komut menüsü başlangıçta `setMyCommands` ile kaydedilir. `commands.native: "auto"`, Telegram için yerel komutları etkinleştirir.

    Özel komut menüsü girdileri ekleyin:

```json5
{
  channels: {
    telegram: {
      customCommands: [
        { command: "backup", description: "Git yedeklemesi" },
        { command: "generate", description: "Bir görüntü oluştur" },
      ],
    },
  },
}
```

    Kurallar: adlar normalleştirilir (baştaki `/` kaldırılır, küçük harfe çevrilir); geçerli desen `a-z`, `0-9`, `_`, uzunluk 1-32; özel komutlar yerel komutları geçersiz kılamaz; çakışmalar/yinelenenler atlanır ve günlüğe kaydedilir.

    Özel komutlar yalnızca menü girdileridir — davranışı otomatik olarak uygulamazlar. Plugin/skill komutları Telegram menüsünde gösterilmese bile yazıldığında çalışmaya devam edebilir. Yerel komutlar devre dışı bırakılırsa yerleşik komutlar kaldırılır; yapılandırılmışsa özel/Plugin komutları yine de kaydedilebilir.

    Yaygın kurulum hataları:

    - Kırpma yeniden denemesinden sonra `BOT_COMMANDS_TOO_MUCH` ile birlikte `setMyCommands failed`, menünün hâlâ sınırı aştığı anlamına gelir; Plugin/skill/özel komutları azaltın veya `channels.telegram.commands.native` değerini devre dışı bırakın.
    - Doğrudan Bot API curl komutları çalışırken `deleteWebhook`, `deleteMyCommands` veya `setMyCommands` işlemlerinin `404: Not Found` ile başarısız olması genellikle `channels.telegram.apiRoot` değerinin tam `/bot<TOKEN>` uç noktasına ayarlandığı anlamına gelir. `apiRoot` yalnızca Bot API kökü olmalıdır; `openclaw doctor --fix`, yanlışlıkla eklenen sondaki `/bot<TOKEN>` bölümünü kaldırır.
    - `getMe returned 401`, Telegram'ın yapılandırılmış bot belirtecini reddettiği anlamına gelir. `botToken`, `tokenFile` veya `TELEGRAM_BOT_TOKEN` (varsayılan hesap) değerini güncel BotFather belirteciyle güncelleyin; OpenClaw yoklamadan önce durduğu için bu durum Webhook temizleme hatası olarak bildirilmez.
    - Ağ/getirme hatalarıyla birlikte `setMyCommands failed`, genellikle `api.telegram.org` adresine giden DNS/HTTPS trafiğinin engellendiği anlamına gelir.

    ### Cihaz eşleştirme komutları (`device-pair` Plugin'i)

    Yüklendiğinde:

    1. `/pair` bir kurulum kodu oluşturur
    2. kodu iOS uygulamasına yapıştırın
    3. `/pair pending`, bekleyen istekleri listeler (rol/kapsamlar dâhil)
    4. onaylama: `/pair approve <requestId>`, `/pair approve` (yalnızca bekleyen istek) veya `/pair approve latest`

    Bir cihaz değiştirilmiş kimlik doğrulama ayrıntılarıyla (rol, kapsamlar, ortak anahtar) yeniden denerse önceki bekleyen isteğin yerini yeni bir `requestId` alır; onaylamadan önce `/pair pending` komutunu yeniden çalıştırın.

    Daha fazla ayrıntı: [Eşleştirme](/tr/channels/pairing#pair-via-telegram).

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

    Kapsamlar: `off`, `dm`, `group`, `all`, `allowlist` (varsayılan). Eski `capabilities: ["inlineButtons"]`, `"all"` değerine eşlenir.

    İleti eylemi örneği:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "Bir seçenek belirleyin:",
  buttons: [
    [
      { text: "Evet", callback_data: "yes" },
      { text: "Hayır", callback_data: "no" },
    ],
    [{ text: "İptal", callback_data: "cancel" }],
  ],
}
```

    Mini App düğmesi örneği:

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "Uygulamayı açın:",
  presentation: {
    blocks: [
      {
        type: "buttons",
        buttons: [{ label: "Başlat", web_app: { url: "https://example.com/app" } }],
      },
    ],
  },
}
```

    `web_app` düğmeleri yalnızca bir kullanıcı ile bot arasındaki özel sohbetlerde çalışır.

    Kayıtlı bir plugin etkileşimli işleyicisi tarafından üstlenilmeyen geri çağırma tıklamaları, metin olarak aracıya iletilir: `callback_data: <value>`.

  </Accordion>

  <Accordion title="Aracılar ve otomasyon için Telegram mesaj eylemleri">
    Eylemler:

    - `sendMessage` (`to`, `content`, isteğe bağlı `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content` veya `caption`, isteğe bağlı `presentation` satır içi düğmeleri; yalnızca düğme düzenlemeleri yanıt işaretlemesini günceller)
    - `createForumTopic` (`chatId`, `name`, isteğe bağlı `iconColor`, `iconCustomEmojiId`)

    Kullanışlı takma adlar: `send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`.

    Etkinleştirme koşulları: `channels.telegram.actions.sendMessage`, `deleteMessage`, `reactions`, `sticker` (varsayılan: devre dışı). `edit`, `createForumTopic` ve `editForumTopic`, özel bir açma/kapama ayarı olmadan varsayılan olarak etkindir.
    Çalışma zamanı gönderimleri, başlatma/yeniden yükleme sırasındaki etkin yapılandırma/gizli bilgiler anlık görüntüsünü kullanır; bu nedenle eylem yolları her gönderimde `SecretRef` değerlerini yeniden çözümlemez.

    Tepki kaldırma semantiği: [/tools/reactions](/tr/tools/reactions).

  </Accordion>

  <Accordion title="Yanıt ileti dizisi etiketleri">
    Oluşturulan çıktıdaki açık yanıt ileti dizisi etiketleri:

    - `[[reply_to_current]]` — tetikleyici mesaja yanıt verir
    - `[[reply_to:<id>]]` — belirli bir mesaj kimliğine yanıt verir

    `channels.telegram.replyToMode`: `off` (varsayılan), `first`, `all`.

    Yanıt ileti dizisi etkinleştirildiğinde ve özgün metin/açıklama mevcut olduğunda OpenClaw, yerel bir alıntı kesitini otomatik olarak ekler. Telegram, yerel alıntı metnini 1024 UTF-16 kod birimiyle sınırlar; daha uzun mesajlar baştan itibaren alıntılanır ve Telegram alıntıyı reddederse düz yanıta geri dönülür.

    `off` yalnızca örtük yanıt ileti dizisini devre dışı bırakır; açık `[[reply_to_*]]` etiketleri yine uygulanır.

  </Accordion>

  <Accordion title="Forum konuları ve ileti dizisi davranışı">
    Forum süper grupları: konu oturumu anahtarlarının sonuna `:topic:<threadId>` eklenir; yanıtlar ve yazıyor göstergesi konu ileti dizisini hedefler; konu yapılandırma yolu `channels.telegram.groups.<chatId>.topics.<threadId>` şeklindedir.

    Genel konu (`threadId=1`) özel bir durumdur: mesaj gönderimleri `message_thread_id` değerini içermez (Telegram, `sendMessage(...thread_id=1)` değerini "thread not found" hatasıyla reddeder), ancak yazıyor eylemleri yine `message_thread_id` değerini içerir (yazıyor göstergesinin görünmesi için deneysel olarak gerekli olduğu belirlenmiştir).

    Konu girdileri, geçersiz kılınmadığı sürece grup ayarlarını devralır (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`). `agentId` yalnızca konuya özeldir ve grup varsayılanlarından devralınmaz. `topics."*"`, o gruptaki her konu için varsayılanları belirler; tam konu kimlikleri yine `"*"` değerine göre önceliklidir.

    **Konu başına aracı yönlendirmesi**: her konu, konu yapılandırmasındaki `agentId` aracılığıyla farklı bir aracıya yönlendirilerek kendine ait çalışma alanına, belleğe ve oturuma sahip olabilir:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // Genel konu -> ana aracı
                "3": { agentId: "zu" },        // Geliştirme konusu -> zu aracısı
                "5": { agentId: "coder" }      // Kod incelemesi -> coder aracısı
              }
            }
          }
        }
      }
    }
    ```

    Ardından her konu, örneğin `agent:zu:telegram:group:-1001234567890:topic:3` gibi kendine ait bir oturum anahtarına sahip olur.

    **Kalıcı ACP konu bağlama**: forum konuları, üst düzey tür belirtilmiş bağlamalar aracılığıyla ACP çalıştırma düzeneği oturumlarını sabitleyebilir (`bindings[]`; `type: "acp"`, `match.channel: "telegram"`, `peer.kind: "group"` ve `-1001234567890:topic:42` gibi konu nitelemeli bir kimlikle). Şu anda gruplardaki/süper gruplardaki forum konularıyla sınırlıdır. Bkz. [ACP Aracıları](/tr/tools/acp-agents).

    **Sohbetten ileti dizisine bağlı ACP başlatma**: `/acp spawn <agent> --thread here|auto`, geçerli konuyu yeni bir ACP oturumuna bağlar; sonraki iletiler doğrudan buraya yönlendirilir ve OpenClaw, başlatma onayını konu içinde sabitler. `channels.telegram.threadBindings.spawnSessions` gerektirir (varsayılan: `true`).

    Şablon bağlamı, `MessageThreadId` ve `IsForum` değerlerini kullanıma sunar. `message_thread_id` içeren DM sohbetleri yanıt meta verilerini korur ancak ileti dizisine duyarlı oturum anahtarlarını yalnızca Telegram `getMe`, `has_topics_enabled: true` bildirdiğinde kullanır.
    Kullanımdan kaldırılmış `dm.threadReplies` ve `direct.*.threadReplies` geçersiz kılmaları kaldırılmıştır; BotFather ileti dizili modu tek doğruluk kaynağıdır. Eski yapılandırma anahtarlarını kaldırmak için `openclaw doctor --fix` komutunu çalıştırın.

  </Accordion>

  <Accordion title="Ses, video ve çıkartmalar">
    ### Sesli mesajlar

    Telegram, sesli notları ses dosyalarından ayırır. Varsayılan: ses dosyası davranışı; sesli not olarak göndermeyi zorlamak için aracı yanıtında `[[audio_as_voice]]` etiketini kullanın. Gelen sesli not dökümleri, aracı bağlamında makine tarafından oluşturulmuş ve güvenilmeyen metin olarak çerçevelenir; ancak bahsetme algılama yine ham dökümü kullandığından bahsetme koşullu sesli mesajlar çalışmaya devam eder.

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

    Telegram, video dosyalarını video notlarından ayırır. Video notları açıklamaları desteklemez; sağlanan mesaj metni ayrı olarak gönderilir.

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/video.mp4",
  asVideoNote: true,
}
```

    ### Konumlar ve mekânlar

    Tek başına bir `location` nesnesiyle mevcut `send` eylemini kullanın. Koordinatlar yerel bir konum işareti gönderir; hem `name` hem de `address` eklendiğinde yerel bir mekân kartı gönderilir. Konum gönderimleri, mesaj metni veya medyayla birleştirilemez.

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  location: {
    latitude: 48.858844,
    longitude: 2.294351,
    accuracy: 12,
    name: "Eiffel Kulesi",
    address: "Champ de Mars, Paris",
  },
}
```

    ### Çıkartmalar

    Gelen: statik WEBP indirilir ve işlenir (yer tutucu `<media:sticker>`); animasyonlu TGS ve video WEBM atlanır.

    Çıkartma bağlamı alanları: `Sticker.emoji`, `Sticker.setName`, `Sticker.fileId`, `Sticker.fileUniqueId`, `Sticker.cachedDescription`. Yinelenen görsel çağrılarını azaltmak için açıklamalar OpenClaw SQLite plugin durumunda önbelleğe alınır.

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

    Gönderin:

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
  query: "el sallayan kedi",
  limit: 5,
}
```

  </Accordion>

  <Accordion title="Tepki bildirimleri">
    Telegram tepkileri, mesaj yüklerinden ayrı olarak `message_reaction` güncellemeleri biçiminde gelir. Etkinleştirildiğinde OpenClaw, `Telegram reaction added: 👍 by Alice (@alice) on msg 42` gibi sistem olaylarını kuyruğa alır.

    - `channels.telegram.reactionNotifications`: `off | own | all` (varsayılan: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (varsayılan: `minimal`)

    `own`, yalnızca bot tarafından gönderilen mesajlara kullanıcı tepkileri anlamına gelir (gönderilmiş mesaj önbelleği aracılığıyla en iyi çaba yaklaşımı). Tepki olayları yine Telegram erişim denetimlerine (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`) uyar; yetkisiz gönderenler elenir.

    Telegram, tepki güncellemelerinde ileti dizisi kimliklerini sağlamaz: forum olmayan gruplar grup sohbeti oturumuna; forum grupları ise tam kaynak konuya değil genel konu oturumuna (`:topic:1`) yönlendirilir.

    Yoklama/webhook için `allowed_updates`, `message_reaction` değerini otomatik olarak içerir.

  </Accordion>

  <Accordion title="Alındı tepkileri">
    `ackReaction`, OpenClaw gelen bir mesajı işlerken bir alındı emojisi gönderir. `messages.ackReactionScope`, bunun *ne zaman* gönderileceğini belirler.

    **Emoji çözümleme sırası:**

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - aracı kimliği emojisi yedeği (`agents.list[].identity.emoji`, aksi takdirde "👀")

    Telegram bir Unicode emojisi (örneğin "👀") bekler; tepkiyi bir kanal veya hesap için devre dışı bırakmak üzere `""` kullanın.

    **Kapsam (`messages.ackReactionScope`, varsayılan `"group-mentions"`; şu anda Telegram hesabı veya Telegram kanalı geçersiz kılması yoktur):**

    `all` (DM'ler + ortam oda olayları dâhil gruplar), `direct` (yalnızca DM'ler), `group-all` (ortam oda olayları hariç her grup mesajı, DM yok), `group-mentions` (bottan bahsedildiğinde gruplar; **DM yok** — varsayılan), `off` / `none` (devre dışı).

    <Note>
    Varsayılan kapsam (`group-mentions`), DM'lerde veya ortam oda olaylarında alındı tepkilerini tetiklemez. DM'ler için `direct` veya `all` kullanın; ortam oda olaylarını yalnızca `all` onaylar. Bu değer Telegram sağlayıcısı başlatılırken okunur; dolayısıyla değişikliğin etkili olması için Gateway'in yeniden başlatılması gerekir.
    </Note>

  </Accordion>

  <Accordion title="Telegram olayları ve komutlarından yapılandırma yazma">
    Kanal yapılandırması yazma işlemleri varsayılan olarak etkindir (`configWrites !== false`). Telegram tarafından tetiklenen yazma işlemleri; grup taşıma olaylarını (`migrate_to_chat_id`, `channels.telegram.groups` değerini günceller) ve `/config set` / `/config unset` işlemlerini içerir (komutun etkinleştirilmesi gerekir).

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

  <Accordion title="Uzun yoklama ve webhook karşılaştırması">
    Varsayılan uzun yoklamadır. Webhook modu için `channels.telegram.webhookUrl` ve `channels.telegram.webhookSecret` değerlerini ayarlayın; isteğe bağlı olarak `webhookPath` (varsayılan `/telegram-webhook`), `webhookHost` (varsayılan `127.0.0.1`), `webhookPort` (varsayılan `8787`), `webhookCertPath` (doğrudan IP veya alan adı olmayan kurulumlar için kendinden imzalı sertifika PEM'i) kullanılabilir.

    Uzun yoklama modunda OpenClaw, yeniden başlatma filigranını yalnızca bir güncelleme başarıyla gönderildikten sonra kalıcı hâle getirir; başarısız bir işleyici, güncellemeyi tamamlandı olarak işaretlemek yerine aynı süreçte yeniden denenebilir durumda bırakır.

    Yerel dinleyici varsayılan olarak `127.0.0.1:8787` adresine bağlanır. Genel ağdan gelen trafik için yerel bağlantı noktasının önüne bir ters proxy yerleştirin veya `webhookHost: "0.0.0.0"` değerini bilinçli olarak ayarlayın.

    Webhook modu; istek korumalarını, Telegram gizli belirtecini ve JSON gövdesini doğrular, ardından boş bir `200` döndürmeden önce güncellemeyi dayanıklı giriş kuyruğuna işler. Başarılı dayanıklı kabul, `x-openclaw-delivery-accepted: durable` içerir; sağlık, yönlendirme, kimlik doğrulama, doğrulama ve depolama hatası yanıtları bu üstbilgiyi içermez. Ters proxy'ler ve ana makine denetleyicileri, yanıt zamanlamasından kabul sonucunu çıkarsamadan OpenClaw kabulünü genel bir boş `200` yanıtından ayırmak için bu üstbilgiyi zorunlu kılabilir.

    Ardından OpenClaw, güncellemeyi uzun yoklamada kullanılan aynı sohbet/konu başına bot hatları üzerinden eşzamansız olarak işler; böylece yavaş aracı turları Telegram'ın teslimat ACK'sini bekletmez.

  </Accordion>

  <Accordion title="Sınırlar, yeniden deneme ve CLI hedefleri">
    - `channels.telegram.textChunkLimit` varsayılan olarak 4000'dir; `streaming.chunkMode="newline"`, uzunluğa göre bölmeden önce paragraf sınırlarını (boş satırları) tercih eder.
    - `channels.telegram.mediaMaxMb` (varsayılan 100), gelen ve giden medya boyutunu sınırlar.
    - `channels.telegram.mediaGroupFlushMs` (varsayılan 500, aralık 10-60000), albümlerin/medya gruplarının OpenClaw tarafından tek bir gelen mesaj olarak iletilmeden önce ne kadar süre arabelleğe alınacağını denetler. Albüm parçaları geç geliyorsa artırın; albüm yanıt gecikmesini azaltmak için düşürün.
    - `channels.telegram.timeoutSeconds`, API istemcisi zaman aşımını geçersiz kılar (ayarlanmamışsa grammY varsayılanı uygulanır). Bot istemcileri, yapılandırılmış değerleri 60 saniyelik giden metin/yazıyor isteği korumasının altında sınırlar; böylece grammY, OpenClaw'ın aktarım koruması ve geri dönüş mekanizması çalışamadan görünür yanıt teslimini iptal etmez. Uzun yoklama, boşta kalan yoklamaların süresiz olarak terk edilmemesi için yine 45 saniyelik bir `getUpdates` istek koruması kullanır.
    - `channels.telegram.pollingStallThresholdMs` varsayılan olarak 120000'dir; yalnızca yanlış pozitif yoklama takılması yeniden başlatmaları için 30000 ile 600000 arasında ayarlayın.
    - grup bağlamı geçmişi `channels.telegram.historyLimit` veya `messages.groupChat.historyLimit` (varsayılan 50) kullanır; `0` devre dışı bırakır.
    - yanıt/alıntı/iletme ek bağlamı, gateway üst mesajları gözlemlediğinde seçilen tek bir konuşma bağlamı penceresine normalleştirilir; gözlemlenen mesaj önbelleği OpenClaw SQLite plugin durumunda bulunur ve `openclaw doctor --fix` eski yan dosyaları içe aktarır. Telegram, güncelleme başına yalnızca bir yüzeysel `reply_to_message` içerdiğinden, önbellekten daha eski zincirler bu yükle sınırlıdır.
    - Telegram izin listeleri, tam bir ek bağlam redaksiyon sınırı olmaktan ziyade öncelikle aracıyı kimin tetikleyebileceğini denetler.
    - DM geçmişi: `channels.telegram.dmHistoryLimit`, `channels.telegram.dms["<user_id>"].historyLimit`.
    - `channels.telegram.retry`, kurtarılabilir giden API hataları için Telegram gönderme yardımcılarına (CLI/araçlar/eylemler) uygulanır. Gelen nihai yanıt teslimi, bağlantı öncesi hatalar için sınırlı bir güvenli gönderim yeniden denemesi kullanır; ancak görünür mesajları çoğaltabilecek belirsiz gönderim sonrası ağ zarflarını yeniden denemez.

    CLI ve mesaj aracı gönderim hedefleri; sayısal sohbet kimliği, kullanıcı adı veya forum konusu hedefi kabul eder:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
openclaw message send --channel telegram --target -1001234567890:topic:42 --message "hi topic"
```

    Anketler `openclaw message poll` kullanır ve forum konularını destekler:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    Yalnızca Telegram'a özgü anket bayrakları: `--poll-duration-seconds` (5-600), `--poll-anonymous`, `--poll-public`, `--thread-id` (veya bir `:topic:` hedefi). `--poll-option`, 2-12 kez tekrarlar (Telegram'ın seçenek sınırı).

    Telegram gönderimi ayrıca satır içi klavyeler için `buttons` bloklarıyla `--presentation` özelliğini (`channels.telegram.capabilities.inlineButtons` izin verdiğinde), botun söz konusu sohbette sabitleme yetkisi olduğunda sabitlenmiş teslimat istemek için `--pin` veya `--delivery '{"pin":true}'` seçeneğini ve giden görselleri, GIF'leri ve videoları sıkıştırılmış/animasyonlu/video yüklemeleri yerine belge olarak göndermek için `--force-document` seçeneğini destekler.

    Eylem kısıtlaması: `channels.telegram.actions.sendMessage=false`, anketler dâhil tüm giden mesajları devre dışı bırakır; `channels.telegram.actions.poll=false`, normal gönderimleri etkin bırakırken anket oluşturmayı devre dışı bırakır.

  </Accordion>

  <Accordion title="Telegram'da yürütme onayları">
    Telegram, onaylayan kişilerin DM'lerinde yürütme onaylarını destekler ve istemleri isteğe bağlı olarak kaynak sohbette veya konuda yayımlayabilir. Onaylayanlar sayısal Telegram kullanıcı kimlikleri olmalıdır.

    - `channels.telegram.execApprovals.enabled` (en az bir onaylayan çözümlenebiliyorsa `"auto"` etkinleştirir)
    - `channels.telegram.execApprovals.approvers` (`commands.ownerAllowFrom` içindeki sayısal sahip kimliklerine geri döner)
    - `channels.telegram.execApprovals.target`: `dm` (varsayılan) | `channel` | `both`
    - `agentFilter`, `sessionFilter`

    `channels.telegram.allowFrom`, `groupAllowFrom` ve `defaultTo`, botla kimin konuşabileceğini ve normal yanıtları nereye göndereceğini denetler; bir kişiyi yürütme onaylayanı yapmaz. Henüz bir komut sahibi yoksa ilk onaylanan DM eşleştirmesi `commands.ownerAllowFrom` değerini başlatır; böylece tek sahipli kurulumlar, `execApprovals.approvers` altında kimlikleri çoğaltmadan çalışır.

    Kanal teslimi, komut metnini sohbette gösterir; `channel` veya `both` seçeneğini yalnızca güvenilir gruplarda/konularda etkinleştirin. İstem bir forum konusuna ulaştığında OpenClaw, onay istemi ve devam iletileri için konuyu korur. Yürütme onayları varsayılan olarak 30 dakika sonra sona erer.

    Satır içi onay düğmelerinin hedef yüzeye (`dm`, `group` veya `all`) izin vermesi için ayrıca `channels.telegram.capabilities.inlineButtons` gerekir. Ön eki `plugin:` olan onay kimlikleri plugin onayları aracılığıyla; diğerleri ise önce yürütme onayları aracılığıyla çözümlenir.

    Bkz. [Yürütme onayları](/tr/tools/exec-approvals).

  </Accordion>
</AccordionGroup>

## Hata yanıtı denetimleri

Aracı bir teslimat veya sağlayıcı hatasıyla karşılaştığında hata politikası, hata mesajlarının Telegram sohbetine ulaşıp ulaşmayacağını denetler:

| Anahtar                             | Değerler                   | Varsayılan      | Açıklama                                                                                                                                                                                                |
| ----------------------------------- | -------------------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `always`, `once`, `silent` | `always`        | `always` her hata mesajını sohbete gönderir. `once` her benzersiz hata mesajını bekleme süresi penceresi başına bir kez gönderir (yinelenen aynı hataları engeller). `silent` hata mesajlarını asla sohbete göndermez. |
| `channels.telegram.errorCooldownMs` | sayı (ms)                  | `14400000` (4 sa.) | `once` politikası için bekleme süresi penceresi. Bir hata gönderildikten sonra aynı mesaj, bu aralık geçene kadar engellenir. Kesintiler sırasında hata mesajı yağmurunu önler.                     |

Hesap, grup ve konu bazında geçersiz kılmalar desteklenir (diğer Telegram yapılandırma anahtarlarıyla aynı devralma).

```json5
{
  channels: {
    telegram: {
      errorPolicy: "always",
      errorCooldownMs: 120000,
      groups: {
        "-1001234567890": {
          errorPolicy: "silent", // bu gruptaki hataları engelle
        },
      },
    },
  },
}
```

## Sorun giderme

<AccordionGroup>
  <Accordion title="Bot, kendisinden bahsedilmeyen grup mesajlarına yanıt vermiyor">

    - `requireMention=false` ise Telegram gizlilik modu tam görünürlüğe izin vermelidir: BotFather `/setprivacy` -> Disable, ardından botu gruptan kaldırıp yeniden ekleyin.
    - Yapılandırma, botun belirtilmediği grup mesajlarını beklediğinde `openclaw channels status` uyarı verir.
    - `openclaw channels status --probe` açık sayısal grup kimliklerini denetler; joker karakter `"*"` için üyelik sorgulanamaz.
    - Hızlı oturum testi: `/activation always`.

  </Accordion>

  <Accordion title="Bot grup mesajlarını hiç görmüyor">

    - `channels.telegram.groups` mevcutsa grup listelenmelidir (veya `"*"` eklenmelidir).
    - Botun gruba üye olduğunu doğrulayın.
    - Atlama nedenleri için `openclaw logs --follow` kaydını inceleyin.

  </Accordion>

  <Accordion title="Komutlar kısmen çalışıyor veya hiç çalışmıyor">

    - Gönderen kimliğinizi yetkilendirin (eşleştirme ve/veya sayısal `allowFrom`); grup politikası `open` olsa bile komut yetkilendirmesi uygulanmaya devam eder.
    - `BOT_COMMANDS_TOO_MUCH` ile birlikte `setMyCommands failed`, yerel menüde çok fazla girdi bulunduğu anlamına gelir; plugin/skill/özel komutların sayısını azaltın veya yerel menüleri devre dışı bırakın.
    - `deleteMyCommands` / `setMyCommands` başlangıç çağrıları ve `sendChatAction` yazıyor çağrıları sınırlandırılır ve istek zaman aşımında Telegram'ın aktarım geri dönüşü üzerinden bir kez yeniden denenir. Kalıcı ağ/fetch hataları genellikle `api.telegram.org` adresine DNS/HTTPS üzerinden erişilemediği anlamına gelir.

  </Accordion>

  <Accordion title="Başlangıç, yetkisiz token bildiriyor">

    - `getMe returned 401`, yapılandırılmış bot token'ı için bir Telegram kimlik doğrulama hatasıdır. Token'ı BotFather'dan yeniden kopyalayın veya oluşturun, ardından `channels.telegram.botToken`, `tokenFile`, `accounts.<id>.botToken` ya da `TELEGRAM_BOT_TOKEN` (varsayılan hesap) değerini güncelleyin.
    - Başlangıç sırasında `deleteWebhook 401 Unauthorized` da bir kimlik doğrulama hatasıdır; bunu "webhook mevcut değil" şeklinde değerlendirmek, aynı hatalı token sorununu yalnızca daha sonraki bir API çağrısına erteler.

  </Accordion>

  <Accordion title="Yoklama veya ağ kararsızlığı">

    - Özel bir fetch/proxy ile Node 22+, `AbortSignal` türleri eşleşmiyorsa anında iptal davranışını tetikleyebilir.
    - Bazı sunucular `api.telegram.org` adresini önce IPv6'ya çözümler; bozuk IPv6 çıkışı aralıklı API hatalarına neden olur.
    - `TypeError: fetch failed` veya `Network request for 'getUpdates' failed!` içeren günlükler, kurtarılabilir ağ hataları olarak yeniden denenir.
    - Yoklama başlangıcında OpenClaw, çalıştırıcının ilk `getUpdates` öncesinde ikinci bir `getMe` çağrısına ihtiyaç duymaması için başarılı başlangıç `getMe` yoklamasını grammY'de yeniden kullanır.
    - Yoklama başlangıcı sırasında `deleteWebhook` geçici bir ağ hatasıyla başarısız olursa OpenClaw, yoklama öncesinde başka bir kontrol düzlemi çağrısı yapmak yerine uzun yoklamaya devam eder. Hâlâ etkin olan bir webhook daha sonra `getUpdates` çakışması olarak ortaya çıkar; OpenClaw aktarımı yeniden oluşturur ve webhook temizliğini yeniden dener.
    - Telegram soketleri kısa ve sabit aralıklarla yenileniyorsa düşük bir `channels.telegram.timeoutSeconds` değeri olup olmadığını kontrol edin — bot istemcileri yapılandırılmış değerleri giden istek ve `getUpdates` istek korumalarının altındaysa sınırlar; ancak eski sürümler, bu değer korumaların altında ayarlandığında her yoklamayı veya yanıtı iptal edebiliyordu.
    - Günlüklerdeki `Polling stall detected`, varsayılan olarak tamamlanmış bir uzun yoklama canlılığı olmadan 120 saniye geçtikten sonra OpenClaw'ın yoklamayı yeniden başlatıp aktarımı yeniden oluşturduğu anlamına gelir.
    - `openclaw channels status --probe` ve `openclaw doctor`; çalışan bir yoklama hesabı başlangıç ek süresinden sonra `getUpdates` işlemini tamamlamadığında, çalışan bir webhook hesabı başlangıç ek süresinden sonra `setWebhook` işlemini tamamlamadığında veya son başarılı yoklama aktarımı etkinliği eskidiğinde uyarı verir.
    - `getUpdates` çağrıları sağlıklı olduğu hâlde sunucunuz hâlâ yanlış yoklama durması yeniden başlatmaları bildiriyorsa yalnızca `channels.telegram.pollingStallThresholdMs` değerini yükseltin. Kalıcı durmalar genellikle `api.telegram.org` adresine yönelik proxy, DNS, IPv6 veya TLS çıkışı sorunlarına işaret eder.
    - Telegram, Bot API aktarımı için işlem proxy ortam değişkenlerini dikkate alır: `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` ve küçük harfli çeşitleri. `NO_PROXY` / `no_proxy` yine de `api.telegram.org` değerini geçersiz kılabilir.
    - Bir hizmet ortamı için `OPENCLAW_PROXY_URL` ayarlanmışsa ve standart bir proxy ortam değişkeni yoksa Telegram bu URL'yi Bot API aktarımı için de kullanır.
    - Doğrudan çıkışı/TLS bağlantısı kararsız VPS sunucularında Telegram API çağrılarını bir proxy üzerinden yönlendirin:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+, varsayılan olarak `autoSelectFamily=true` kullanır (WSL2 hariç). Telegram DNS sonuç sırası önce `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER`, ardından `channels.telegram.network.dnsResultOrder`, sonra süreç varsayılanını (örneğin `NODE_OPTIONS=--dns-result-order=ipv4first`) izler; hiçbiri geçerli değilse Node 22+ üzerinde `ipv4first` değerine geri döner.
    - WSL2 üzerinde veya yalnızca IPv4 davranışı daha iyi çalıştığında, aile seçimini zorunlu kılın:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - RFC 2544 kıyaslama aralığı yanıtlarına (`198.18.0.0/15`) Telegram medya indirmeleri için varsayılan olarak zaten izin verilir. Güvenilir bir sahte IP veya şeffaf proxy, medya indirmeleri sırasında `api.telegram.org` adresini başka bir özel/dahili/özel amaçlı adrese yeniden yazıyorsa yalnızca Telegram için geçerli atlamayı etkinleştirin:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - Aynı etkinleştirme seçeneği, `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork` konumunda hesap başına kullanılabilir.
    - Proxy'niz Telegram medya ana makinelerini `198.18.x.x` aralığına çözümlüyorsa önce tehlikeli bayrağı kapalı bırakın — bu aralığa varsayılan olarak zaten izin verilir.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork`, Telegram medya SSRF korumalarını zayıflatır. Bunu yalnızca RFC 2544 kıyaslama aralığının dışında özel veya özel amaçlı yanıtlar üreten, güvenilir ve operatör denetimindeki proxy ortamlarında (Clash, Mihomo, Surge sahte IP yönlendirmesi) kullanın. Normal genel internet üzerinden Telegram erişiminde kapalı bırakın.
    </Warning>

    - Geçici ortam geçersiz kılmaları: `OPENCLAW_TELEGRAM_DISABLE_AUTO_SELECT_FAMILY=1`, `OPENCLAW_TELEGRAM_ENABLE_AUTO_SELECT_FAMILY=1`, `OPENCLAW_TELEGRAM_DNS_RESULT_ORDER=ipv4first`.
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

<Accordion title="Yüksek öneme sahip Telegram alanları">

- başlatma/kimlik doğrulama: `enabled`, `botToken`, `tokenFile` (normal bir dosya olmalıdır; sembolik bağlantılar reddedilir), `accounts.*`
- erişim denetimi: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, üst düzey `bindings[]` (`type: "acp"`)
- konu varsayılanları: `groups.<chatId>.topics."*"`, eşleşmeyen forum konularına uygulanır; tam konu kimlikleri bunu geçersiz kılar
- çalıştırma onayları: `execApprovals`, `accounts.*.execApprovals`
- komut/menü: `commands.native`, `commands.nativeSkills`, `customCommands`
- iş parçacıkları/yanıtlar: `replyToMode`, `threadBindings`
- akış: `streaming` (`off | partial | block | progress` modları), `streaming.preview.toolProgress`
- biçimlendirme/teslimat: `textChunkLimit`, `streaming.chunkMode`, `richMessages`, `markdown.tables` (`off | bullets | code | block`), `linkPreview`, `responsePrefix`
- medya/ağ: `mediaMaxMb`, `mediaGroupFlushMs`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- özel API kökü: `apiRoot` (yalnızca Bot API kökü; `/bot<TOKEN>` eklemeyin), `trustedLocalFileRoots` (kendi barındırdığınız Bot API'nin mutlak `file_path` kökleri)
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`, `webhookPort`, `webhookCertPath`
- eylemler/yetenekler: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker|createForumTopic|editForumTopic`
- tepkiler: `reactionNotifications`, `reactionLevel`
- hatalar: `errorPolicy`, `errorCooldownMs`, `silentErrorReplies`
- yazmalar/geçmiş: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

</Accordion>

<Note>
Çoklu hesap önceliği: İki veya daha fazla hesap kimliği yapılandırıldığında, varsayılan yönlendirmeyi açıkça belirtmek için `channels.telegram.defaultAccount` değerini ayarlayın (veya `channels.telegram.accounts.default` öğesini ekleyin). Aksi takdirde OpenClaw, normalleştirilmiş ilk hesap kimliğine geri döner ve `openclaw doctor` uyarı verir. Adlandırılmış hesaplar `channels.telegram.allowFrom` / `groupAllowFrom` değerlerini devralır, ancak `accounts.default.*` değerlerini devralmaz.
</Note>

## İlgili

<CardGroup cols={2}>
  <Card title="Eşleştirme" icon="link" href="/tr/channels/pairing">
    Bir Telegram kullanıcısını Gateway ile eşleştirin.
  </Card>
  <Card title="Gruplar" icon="users" href="/tr/channels/groups">
    Grup ve konu izin listesi davranışı.
  </Card>
  <Card title="Kanal yönlendirmesi" icon="route" href="/tr/channels/channel-routing">
    Gelen mesajları aracılara yönlendirin.
  </Card>
  <Card title="Güvenlik" icon="shield" href="/tr/gateway/security">
    Tehdit modeli ve güvenlik sıkılaştırması.
  </Card>
  <Card title="Çok aracılı yönlendirme" icon="sitemap" href="/tr/concepts/multi-agent">
    Grupları ve konuları aracılarla eşleyin.
  </Card>
  <Card title="Sorun giderme" icon="wrench" href="/tr/channels/troubleshooting">
    Kanallar arası tanılama.
  </Card>
</CardGroup>
