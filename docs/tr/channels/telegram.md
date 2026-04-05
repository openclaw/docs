---
read_when:
    - Telegram özellikleri veya webhook'lar üzerinde çalışıyorsanız
summary: Telegram bot desteği durumu, yetenekleri ve yapılandırması
title: Telegram
x-i18n:
    generated_at: "2026-04-05T13:47:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 39fbf328375fbc5d08ec2e3eed58b19ee0afa102010ecbc02e074a310ced157e
    source_path: channels/telegram.md
    workflow: 15
---

# Telegram (Bot API)

Durum: grammY aracılığıyla bot DM'leri ve gruplar için üretime hazır. Uzun yoklama varsayılan moddur; webhook modu isteğe bağlıdır.

<CardGroup cols={3}>
  <Card title="Eşleştirme" icon="link" href="/tr/channels/pairing">
    Telegram için varsayılan DM ilkesi eşleştirmedir.
  </Card>
  <Card title="Kanal sorun giderme" icon="wrench" href="/channels/troubleshooting">
    Kanallar arası tanılama ve onarım çalışma kitapları.
  </Card>
  <Card title="Gateway yapılandırması" icon="settings" href="/gateway/configuration">
    Tam kanal yapılandırma kalıpları ve örnekleri.
  </Card>
</CardGroup>

## Hızlı kurulum

<Steps>
  <Step title="Bot token'ını BotFather içinde oluşturun">
    Telegram'ı açın ve **@BotFather** ile sohbet edin (kullanıcı adının tam olarak `@BotFather` olduğunu doğrulayın).

    `/newbot` komutunu çalıştırın, yönergeleri izleyin ve token'ı kaydedin.

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

    Ortam değişkeni geri dönüşü: `TELEGRAM_BOT_TOKEN=...` (yalnızca varsayılan hesap).
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
    Botu grubunuza ekleyin, ardından erişim modelinize uyacak şekilde `channels.telegram.groups` ve `groupPolicy` ayarlarını yapın.
  </Step>
</Steps>

<Note>
Token çözümleme sırası hesap farkındalığına sahiptir. Uygulamada, config değerleri ortam değişkeni geri dönüşüne üstün gelir ve `TELEGRAM_BOT_TOKEN` yalnızca varsayılan hesap için geçerlidir.
</Note>

## Telegram tarafı ayarları

<AccordionGroup>
  <Accordion title="Gizlilik modu ve grup görünürlüğü">
    Telegram botları varsayılan olarak grup mesajlarının alabileceklerini sınırlayan **Gizlilik Modu** ile gelir.

    Botun tüm grup mesajlarını görmesi gerekiyorsa, şunlardan birini yapın:

    - `/setprivacy` aracılığıyla gizlilik modunu devre dışı bırakın veya
    - botu grup yöneticisi yapın.

    Gizlilik modunu değiştirirken, Telegram'ın değişikliği uygulaması için botu her gruptan kaldırıp yeniden ekleyin.

  </Accordion>

  <Accordion title="Grup izinleri">
    Yönetici durumu Telegram grup ayarlarında kontrol edilir.

    Yönetici botlar tüm grup mesajlarını alır; bu da her zaman etkin grup davranışı için kullanışlıdır.

  </Accordion>

  <Accordion title="Yararlı BotFather anahtarları">

    - grup eklemelerine izin vermek/engellemek için `/setjoingroups`
    - grup görünürlük davranışı için `/setprivacy`

  </Accordion>
</AccordionGroup>

## Erişim denetimi ve etkinleştirme

<Tabs>
  <Tab title="DM ilkesi">
    `channels.telegram.dmPolicy`, doğrudan mesaj erişimini kontrol eder:

    - `pairing` (varsayılan)
    - `allowlist` (`allowFrom` içinde en az bir gönderen kimliği gerektirir)
    - `open` (`allowFrom` içine `"*"` eklenmesini gerektirir)
    - `disabled`

    `channels.telegram.allowFrom`, sayısal Telegram kullanıcı kimliklerini kabul eder. `telegram:` / `tg:` önekleri kabul edilir ve normalize edilir.
    Boş `allowFrom` ile `dmPolicy: "allowlist"` tüm DM'leri engeller ve config doğrulaması tarafından reddedilir.
    Onboarding, `@username` girdisini kabul eder ve bunu sayısal kimliklere çözümler.
    Yükseltme yaptıysanız ve config'iniz `@username` allowlist girdileri içeriyorsa, bunları çözümlemek için `openclaw doctor --fix` çalıştırın (en iyi çabayla; bir Telegram bot token'ı gerektirir).
    Daha önce pairing-store allowlist dosyalarına güveniyorduysanız, `openclaw doctor --fix` allowlist akışlarında girdileri `channels.telegram.allowFrom` içine geri alabilir (örneğin `dmPolicy: "allowlist"` henüz açık kimlikler içermiyorsa).

    Tek sahipli botlar için, erişim ilkesini config içinde kalıcı tutmak amacıyla açık sayısal `allowFrom` kimlikleriyle `dmPolicy: "allowlist"` tercih edin (önceki eşleştirme onaylarına bağlı kalmak yerine).

    Sık görülen bir karışıklık: DM eşleştirme onayı, "bu gönderen her yerde yetkilidir" anlamına gelmez.
    Eşleştirme yalnızca DM erişimi verir. Grup gönderen yetkilendirmesi yine açık config allowlist'lerinden gelir.
    "Bir kez yetkileneyim ve hem DM'ler hem de grup komutları çalışsın" istiyorsanız, sayısal Telegram kullanıcı kimliğinizi `channels.telegram.allowFrom` içine koyun.

    ### Telegram kullanıcı kimliğinizi bulma

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

  <Tab title="Grup ilkesi ve allowlist'ler">
    İki denetim birlikte uygulanır:

    1. **Hangi gruplara izin verilir** (`channels.telegram.groups`)
       - `groups` config'i yok:
         - `groupPolicy: "open"` ile: herhangi bir grup grup kimliği denetimlerinden geçebilir
         - `groupPolicy: "allowlist"` (varsayılan) ile: `groups` girdileri (veya `"*"`) ekleyene kadar gruplar engellenir
       - `groups` yapılandırılmışsa: allowlist olarak davranır (açık kimlikler veya `"*"`)

    2. **Gruplarda hangi göndericilere izin verilir** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (varsayılan)
       - `disabled`

    `groupAllowFrom`, grup gönderen filtrelemesi için kullanılır. Ayarlanmazsa, Telegram `allowFrom` değerine geri döner.
    `groupAllowFrom` girdileri sayısal Telegram kullanıcı kimlikleri olmalıdır (`telegram:` / `tg:` önekleri normalize edilir).
    `groupAllowFrom` içine Telegram grup veya süper grup sohbet kimlikleri koymayın. Negatif sohbet kimlikleri `channels.telegram.groups` altında yer almalıdır.
    Sayısal olmayan girdiler gönderen yetkilendirmesinde yok sayılır.
    Güvenlik sınırı (`2026.2.25+`): grup gönderen yetkilendirmesi DM pairing-store onaylarını **devralmaz**.
    Eşleştirme yalnızca DM içindir. Gruplar için `groupAllowFrom` veya grup/grup konusu başına `allowFrom` ayarlayın.
    `groupAllowFrom` ayarlanmazsa, Telegram pairing store yerine config `allowFrom` değerine geri döner.
    Tek sahipli botlar için pratik kalıp: kullanıcı kimliğinizi `channels.telegram.allowFrom` içine koyun, `groupAllowFrom` ayarını boş bırakın ve hedef gruplara `channels.telegram.groups` altında izin verin.
    Çalışma zamanı notu: `channels.telegram` tamamen eksikse, `channels.defaults.groupPolicy` açıkça ayarlanmadıkça çalışma zamanı varsayılan olarak fail-closed `groupPolicy="allowlist"` kullanır.

    Örnek: belirli bir grupta herhangi bir üyeye izin ver:

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

    Örnek: belirli bir grubun içinde yalnızca belirli kullanıcılara izin ver:

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
      Sık yapılan hata: `groupAllowFrom`, Telegram grup allowlist'i değildir.

      - `-1001234567890` gibi negatif Telegram grup veya süper grup sohbet kimliklerini `channels.telegram.groups` altında tutun.
      - İzin verilen bir grubun içindeki hangi kişilerin botu tetikleyebileceğini sınırlamak istediğinizde `8734062810` gibi Telegram kullanıcı kimliklerini `groupAllowFrom` altına koyun.
      - Yalnızca izin verilen bir grubun herhangi bir üyesinin botla konuşabilmesini istediğinizde `groupAllowFrom: ["*"]` kullanın.
    </Warning>

  </Tab>

  <Tab title="Bahsetme davranışı">
    Grup yanıtları varsayılan olarak bahsetme gerektirir.

    Bahsetme şu yollardan biriyle olabilir:

    - yerel `@botusername` bahsetmesi veya
    - şu alanlardaki bahsetme kalıpları:
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

    Grup sohbet kimliğini alma:

    - bir grup mesajını `@userinfobot` / `@getidsbot`'a yönlendirin
    - veya `openclaw logs --follow` içinden `chat.id` değerini okuyun
    - veya Bot API `getUpdates` çıktısını inceleyin

  </Tab>
</Tabs>

## Çalışma zamanı davranışı

- Telegram, gateway işlemi tarafından sahiplenilir.
- Yönlendirme deterministiktir: Telegram'dan gelen yanıtlar tekrar Telegram'a döner (model kanalları seçmez).
- Gelen mesajlar, yanıt meta verileri ve medya yer tutucuları ile paylaşılan kanal zarfına normalize edilir.
- Grup oturumları grup kimliğine göre yalıtılır. Forum konuları, konuları yalıtılmış tutmak için `:topic:<threadId>` ekler.
- DM mesajları `message_thread_id` taşıyabilir; OpenClaw bunları iş parçacığı farkındalıklı oturum anahtarlarıyla yönlendirir ve yanıtlarda iş parçacığı kimliğini korur.
- Uzun yoklama, sohbet başına/iş parçacığı başına sıralama ile grammY runner kullanır. Genel runner sink eşzamanlılığı `agents.defaults.maxConcurrent` kullanır.
- Telegram Bot API'de okundu bilgisi desteği yoktur (`sendReadReceipts` uygulanmaz).

## Özellik başvurusu

<AccordionGroup>
  <Accordion title="Canlı akış önizlemesi (mesaj düzenlemeleri)">
    OpenClaw kısmi yanıtları gerçek zamanlı olarak akıtabilir:

    - doğrudan sohbetler: önizleme mesajı + `editMessageText`
    - gruplar/konular: önizleme mesajı + `editMessageText`

    Gereksinim:

    - `channels.telegram.streaming` değeri `off | partial | block | progress` olmalıdır (varsayılan: `partial`)
    - `progress`, Telegram'da `partial` olarak eşlenir (kanallar arası adlandırma uyumluluğu)
    - eski `channels.telegram.streamMode` ve boolean `streaming` değerleri otomatik olarak eşlenir

    Yalnızca metin yanıtları için:

    - DM: OpenClaw aynı önizleme mesajını korur ve yerinde son düzenlemeyi yapar (ikinci mesaj yok)
    - grup/konu: OpenClaw aynı önizleme mesajını korur ve yerinde son düzenlemeyi yapar (ikinci mesaj yok)

    Karmaşık yanıtlar için (örneğin medya yükleri), OpenClaw normal son teslimata geri döner ve ardından önizleme mesajını temizler.

    Önizleme akışı, blok akışından ayrıdır. Telegram için blok akışı açıkça etkinleştirildiğinde, çift akışı önlemek için OpenClaw önizleme akışını atlar.

    Yerel taslak aktarımı kullanılamıyorsa/reddedilirse, OpenClaw otomatik olarak `sendMessage` + `editMessageText` yöntemine geri döner.

    Yalnızca Telegram için akıl yürütme akışı:

    - `/reasoning stream`, oluşturma sırasında akıl yürütmeyi canlı önizlemeye gönderir
    - son yanıt akıl yürütme metni olmadan gönderilir

  </Accordion>

  <Accordion title="Biçimlendirme ve HTML geri dönüşü">
    Giden metin, Telegram `parse_mode: "HTML"` kullanır.

    - Markdown benzeri metin Telegram için güvenli HTML'ye dönüştürülür.
    - Ham model HTML'si, Telegram ayrıştırma hatalarını azaltmak için escape edilir.
    - Telegram ayrıştırılmış HTML'yi reddederse, OpenClaw düz metin olarak yeniden dener.

    Link önizlemeleri varsayılan olarak etkindir ve `channels.telegram.linkPreview: false` ile devre dışı bırakılabilir.

  </Accordion>

  <Accordion title="Yerel komutlar ve özel komutlar">
    Telegram komut menüsü kaydı, başlangıçta `setMyCommands` ile yapılır.

    Yerel komut varsayılanları:

    - `commands.native: "auto"`, Telegram için yerel komutları etkinleştirir

    Özel komut menüsü girdileri ekleyin:

```json5
{
  channels: {
    telegram: {
      customCommands: [
        { command: "backup", description: "Git yedeği" },
        { command: "generate", description: "Bir görsel oluştur" },
      ],
    },
  },
}
```

    Kurallar:

    - adlar normalize edilir (baştaki `/` kaldırılır, küçük harfe çevrilir)
    - geçerli desen: `a-z`, `0-9`, `_`, uzunluk `1..32`
    - özel komutlar yerel komutların üzerine yazamaz
    - çakışmalar/tekrarlar atlanır ve günlüğe kaydedilir

    Notlar:

    - özel komutlar yalnızca menü girdileridir; davranışı otomatik olarak uygulamazlar
    - plugin/skill komutları, Telegram menüsünde gösterilmese bile yazıldığında yine çalışabilir

    Yerel komutlar devre dışı bırakılırsa, yerleşik komutlar kaldırılır. Özel/plugin komutları yapılandırılmışsa yine kaydedilebilir.

    Yaygın kurulum hataları:

    - `BOT_COMMANDS_TOO_MUCH` ile `setMyCommands failed`, Telegram menüsünün kırpmadan sonra hâlâ taştığı anlamına gelir; plugin/skill/özel komutları azaltın veya `channels.telegram.commands.native` değerini devre dışı bırakın.
    - ağ/fetch hatalarıyla `setMyCommands failed`, genellikle `api.telegram.org` adresine giden DNS/HTTPS çıkışının engellendiği anlamına gelir.

    ### Cihaz eşleştirme komutları (`device-pair` plugin)

    `device-pair` plugin'i kurulduğunda:

    1. `/pair` kurulum kodu oluşturur
    2. kodu iOS uygulamasına yapıştırın
    3. `/pair pending`, bekleyen istekleri listeler (rol/kapsamlar dahil)
    4. isteği onaylayın:
       - açık onay için `/pair approve <requestId>`
       - yalnızca bir bekleyen istek olduğunda `/pair approve`
       - en son istek için `/pair approve latest`

    Kurulum kodu kısa ömürlü bir bootstrap token taşır. Yerleşik bootstrap devri, birincil düğüm token'ını `scopes: []` olarak tutar; devredilen her operatör token'ı ise `operator.approvals`, `operator.read`, `operator.talk.secrets` ve `operator.write` ile sınırlı kalır. Bootstrap kapsam denetimleri rol öneklidir; bu nedenle operatör allowlist'i yalnızca operatör isteklerini karşılar; operatör olmayan roller kendi rol önekleri altında yine kapsamlara ihtiyaç duyar.

    Bir cihaz değişmiş kimlik doğrulama ayrıntılarıyla (örneğin rol/kapsamlar/açık anahtar) yeniden denerse, önceki bekleyen istek geçersiz kılınır ve yeni istek farklı bir `requestId` kullanır. Onaylamadan önce `/pair pending` komutunu yeniden çalıştırın.

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
  message: "Bir seçenek seçin:",
  buttons: [
    [
      { text: "Evet", callback_data: "yes" },
      { text: "Hayır", callback_data: "no" },
    ],
    [{ text: "İptal", callback_data: "cancel" }],
  ],
}
```

    Callback tıklamaları ajana metin olarak iletilir:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="Ajanlar ve otomasyon için Telegram mesaj eylemleri">
    Telegram araç eylemleri şunları içerir:

    - `sendMessage` (`to`, `content`, isteğe bağlı `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, isteğe bağlı `iconColor`, `iconCustomEmojiId`)

    Kanal mesaj eylemleri ergonomik takma adlar sunar (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Geçitleme denetimleri:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (varsayılan: devre dışı)

    Not: `edit` ve `topic-create` şu anda varsayılan olarak etkindir ve ayrı `channels.telegram.actions.*` anahtarlarına sahip değildir.
    Çalışma zamanı gönderimleri etkin config/secrets anlık görüntüsünü kullanır (başlangıç/yeniden yükleme), bu nedenle eylem yolları gönderim başına geçici SecretRef yeniden çözümlemesi yapmaz.

    Tepki kaldırma semantiği: [/tools/reactions](/tools/reactions)

  </Accordion>

  <Accordion title="Yanıt iş parçacığı etiketleri">
    Telegram, oluşturulan çıktıda açık yanıt iş parçacığı etiketlerini destekler:

    - `[[reply_to_current]]`, tetikleyen mesaja yanıt verir
    - `[[reply_to:<id>]]`, belirli bir Telegram mesaj kimliğine yanıt verir

    `channels.telegram.replyToMode`, işleme davranışını kontrol eder:

    - `off` (varsayılan)
    - `first`
    - `all`

    Not: `off`, örtük yanıt iş parçacığını devre dışı bırakır. Açık `[[reply_to_*]]` etiketleri yine dikkate alınır.

  </Accordion>

  <Accordion title="Forum konuları ve iş parçacığı davranışı">
    Forum süper grupları:

    - konu oturum anahtarlarına `:topic:<threadId>` eklenir
    - yanıtlar ve yazıyor durumu konu iş parçacığını hedefler
    - konu config yolu:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Genel konu (`threadId=1`) özel durumu:

    - mesaj gönderimleri `message_thread_id` içermez (Telegram `sendMessage(...thread_id=1)` çağrısını reddeder)
    - yazıyor eylemleri yine `message_thread_id` içerir

    Konu kalıtımı: konu girdileri, üzerine yazılmadıkça grup ayarlarını devralır (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` yalnızca konuya özgüdür ve grup varsayılanlarından devralınmaz.

    **Konu başına ajan yönlendirmesi**: Her konu, konu config'inde `agentId` ayarlanarak farklı bir ajana yönlendirilebilir. Bu, her konuya kendi yalıtılmış çalışma alanını, belleğini ve oturumunu verir. Örnek:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // Genel konu → main ajanı
                "3": { agentId: "zu" },        // Geliştirme konusu → zu ajanı
                "5": { agentId: "coder" }      // Kod inceleme → coder ajanı
              }
            }
          }
        }
      }
    }
    ```

    Her konunun ardından kendi oturum anahtarı olur: `agent:zu:telegram:group:-1001234567890:topic:3`

    **Kalıcı ACP konu bağlama**: Forum konuları, üst düzey türlendirilmiş ACP bağlamaları aracılığıyla ACP harness oturumlarını sabitleyebilir:

    - `type: "acp"` ve `match.channel: "telegram"` içeren `bindings[]`

    Örnek:

    ```json5
    {
      agents: {
        list: [
          {
            id: "codex",
            runtime: {
              type: "acp",
              acp: {
                agent: "codex",
                backend: "acpx",
                mode: "persistent",
                cwd: "/workspace/openclaw",
              },
            },
          },
        ],
      },
      bindings: [
        {
          type: "acp",
          agentId: "codex",
          match: {
            channel: "telegram",
            accountId: "default",
            peer: { kind: "group", id: "-1001234567890:topic:42" },
          },
        },
      ],
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "42": {
                  requireMention: false,
                },
              },
            },
          },
        },
      },
    }
    ```

    Bu şu anda gruplar ve süper gruplardaki forum konularıyla sınırlıdır.

    **Sohbetten iş parçacığına bağlı ACP başlatma**:

    - `/acp spawn <agent> --thread here|auto`, mevcut Telegram konusunu yeni bir ACP oturumuna bağlayabilir.
    - Sonraki konu mesajları doğrudan bağlı ACP oturumuna yönlendirilir (`/acp steer` gerekmez).
    - OpenClaw, başarılı bir bağlamadan sonra oluşturma onay mesajını konu içinde sabitler.
    - `channels.telegram.threadBindings.spawnAcpSessions=true` gerektirir.

    Şablon bağlamı şunları içerir:

    - `MessageThreadId`
    - `IsForum`

    DM iş parçacığı davranışı:

    - `message_thread_id` içeren özel sohbetler DM yönlendirmesini korur ancak iş parçacığı farkındalıklı oturum anahtarları/yanıt hedefleri kullanır.

  </Accordion>

  <Accordion title="Ses, video ve sticker'lar">
    ### Sesli mesajlar

    Telegram sesli notlar ile ses dosyalarını ayırt eder.

    - varsayılan: ses dosyası davranışı
    - ajan yanıtına `[[audio_as_voice]]` etiketi eklenirse sesli not olarak gönderimi zorlar

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

    Video notları başlıkları desteklemez; sağlanan mesaj metni ayrı gönderilir.

    ### Sticker'lar

    Gelen sticker işleme:

    - statik WEBP: indirilir ve işlenir (yer tutucu `<media:sticker>`)
    - animasyonlu TGS: atlanır
    - video WEBM: atlanır

    Sticker bağlam alanları:

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    Sticker önbellek dosyası:

    - `~/.openclaw/telegram/sticker-cache.json`

    Sticker'lar, tekrarlanan görsel çağrılarını azaltmak için mümkün olduğunda bir kez açıklanır ve önbelleğe alınır.

    Sticker eylemlerini etkinleştirin:

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

    Sticker gönderme eylemi:

```json5
{
  action: "sticker",
  channel: "telegram",
  to: "123456789",
  fileId: "CAACAgIAAxkBAAI...",
}
```

    Önbelleğe alınmış sticker'ları arayın:

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
    Telegram tepkileri `message_reaction` güncellemeleri olarak gelir (mesaj yüklerinden ayrıdır).

    Etkinleştirildiğinde, OpenClaw şu tür sistem olaylarını kuyruğa alır:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Config:

    - `channels.telegram.reactionNotifications`: `off | own | all` (varsayılan: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (varsayılan: `minimal`)

    Notlar:

    - `own`, yalnızca bot tarafından gönderilmiş mesajlara kullanıcı tepkileri anlamına gelir (gönderilmiş mesaj önbelleği aracılığıyla en iyi çabayla).
    - Tepki olayları yine Telegram erişim denetimlerine (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`) uyar; yetkisiz gönderenler düşürülür.
    - Telegram tepki güncellemelerinde iş parçacığı kimlikleri sağlamaz.
      - forum olmayan gruplar grup sohbeti oturumuna yönlendirilir
      - forum grupları tam kaynak konuya değil, grubun genel konu oturumuna (`:topic:1`) yönlendirilir

    Yoklama/webhook için `allowed_updates`, `message_reaction` öğesini otomatik olarak içerir.

  </Accordion>

  <Accordion title="Onay tepkileri">
    `ackReaction`, OpenClaw gelen bir mesajı işlerken bir onay emojisi gönderir.

    Çözümleme sırası:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - ajan kimliği emoji geri dönüşü (`agents.list[].identity.emoji`, aksi halde "👀")

    Notlar:

    - Telegram unicode emoji bekler (örneğin "👀").
    - Kanal veya hesap için tepkiyi devre dışı bırakmak üzere `""` kullanın.

  </Accordion>

  <Accordion title="Telegram olayları ve komutlarından config yazımları">
    Kanal config yazımları varsayılan olarak etkindir (`configWrites !== false`).

    Telegram tarafından tetiklenen yazımlar şunları içerir:

    - `channels.telegram.groups` değerini güncellemek için grup taşıma olayları (`migrate_to_chat_id`)
    - `/config set` ve `/config unset` (komut etkinleştirmesi gerekir)

    Devre dışı bırakmak için:

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
    Varsayılan: uzun yoklama.

    Webhook modu:

    - `channels.telegram.webhookUrl` ayarlayın
    - `channels.telegram.webhookSecret` ayarlayın (`webhookUrl` ayarlandığında gereklidir)
    - isteğe bağlı `channels.telegram.webhookPath` (varsayılan `/telegram-webhook`)
    - isteğe bağlı `channels.telegram.webhookHost` (varsayılan `127.0.0.1`)
    - isteğe bağlı `channels.telegram.webhookPort` (varsayılan `8787`)

    Webhook modu için varsayılan yerel dinleyici `127.0.0.1:8787` adresine bağlanır.

    Genel uç noktanız farklıysa, önüne bir ters proxy koyun ve `webhookUrl` değerini genel URL'ye yönlendirin.
    Dış girişe kasıtlı olarak ihtiyaç duyduğunuzda `webhookHost` değerini ayarlayın (örneğin `0.0.0.0`).

  </Accordion>

  <Accordion title="Sınırlar, yeniden deneme ve CLI hedefleri">
    - `channels.telegram.textChunkLimit` varsayılanı 4000'dir.
    - `channels.telegram.chunkMode="newline"`, uzunluğa göre bölmeden önce paragraf sınırlarını (boş satırlar) tercih eder.
    - `channels.telegram.mediaMaxMb` (varsayılan 100), gelen ve giden Telegram medya boyutunu sınırlar.
    - `channels.telegram.timeoutSeconds`, Telegram API istemci zaman aşımını geçersiz kılar (ayarlanmazsa grammY varsayılanı uygulanır).
    - grup bağlam geçmişi `channels.telegram.historyLimit` veya `messages.groupChat.historyLimit` kullanır (varsayılan 50); `0` devre dışı bırakır.
    - yanıt/alıntı/yönlendirme ek bağlamı şu anda alındığı gibi geçirilir.
    - Telegram allowlist'leri öncelikle tam bir ek bağlam sansürleme sınırı değil, ajanın kim tarafından tetiklenebileceğini geçitler.
    - DM geçmişi denetimleri:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - `channels.telegram.retry` config'i, kurtarılabilir giden API hataları için Telegram gönderim yardımcılarına (CLI/tools/actions) uygulanır.

    CLI gönderim hedefi sayısal sohbet kimliği veya kullanıcı adı olabilir:

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
```

    Telegram anketleri `openclaw message poll` kullanır ve forum konularını destekler:

```bash
openclaw message poll --channel telegram --target 123456789 \
  --poll-question "Ship it?" --poll-option "Yes" --poll-option "No"
openclaw message poll --channel telegram --target -1001234567890:topic:42 \
  --poll-question "Pick a time" --poll-option "10am" --poll-option "2pm" \
  --poll-duration-seconds 300 --poll-public
```

    Yalnızca Telegram'a özgü anket bayrakları:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - forum konuları için `--thread-id` (veya bir `:topic:` hedefi kullanın)

    Telegram gönderimi ayrıca şunları destekler:

    - `channels.telegram.capabilities.inlineButtons` izin verdiğinde satır içi klavyeler için `--buttons`
    - giden görselleri ve GIF'leri sıkıştırılmış fotoğraf veya animasyonlu medya yüklemeleri yerine belge olarak göndermek için `--force-document`

    Eylem geçitlemesi:

    - `channels.telegram.actions.sendMessage=false`, anketler dahil giden Telegram mesajlarını devre dışı bırakır
    - `channels.telegram.actions.poll=false`, normal gönderimleri etkin bırakırken Telegram anket oluşturmayı devre dışı bırakır

  </Accordion>

  <Accordion title="Telegram'da exec onayları">
    Telegram, onaylayıcı DM'lerinde exec onaylarını destekler ve isteğe bağlı olarak onay istemlerini kaynak sohbet veya konuda da yayınlayabilir.

    Config yolu:

    - `channels.telegram.execApprovals.enabled`
    - `channels.telegram.execApprovals.approvers` (isteğe bağlıdır; mümkün olduğunda `allowFrom` ve doğrudan `defaultTo` değerlerinden çıkarılan sayısal sahip kimliklerine geri döner)
    - `channels.telegram.execApprovals.target` (`dm` | `channel` | `both`, varsayılan: `dm`)
    - `agentFilter`, `sessionFilter`

    Onaylayıcılar sayısal Telegram kullanıcı kimlikleri olmalıdır. Telegram, `enabled` ayarlanmadığında veya `"auto"` olduğunda ve en az bir onaylayıcı çözümlenebildiğinde yerel exec onaylarını otomatik etkinleştirir; bu çözümleme `execApprovals.approvers` üzerinden veya hesabın sayısal sahip config'inden (`allowFrom` ve doğrudan mesaj `defaultTo`) yapılabilir. Telegram'ı yerel bir onay istemcisi olarak açıkça devre dışı bırakmak için `enabled: false` ayarlayın. Aksi halde onay istekleri diğer yapılandırılmış onay yollarına veya exec onay geri dönüş ilkesine geri döner.

    Telegram ayrıca diğer sohbet kanallarının kullandığı paylaşılan onay düğmelerini de işler. Yerel Telegram bağdaştırıcısı esas olarak teslimattan önce onaylayıcı DM yönlendirmesi, kanal/konu fanout'u ve yazıyor ipuçları ekler.
    Bu düğmeler mevcut olduğunda, bunlar birincil onay UX'idir; OpenClaw
    yalnızca araç sonucu sohbet onaylarının kullanılamadığını veya tek yolun
    manuel onay olduğunu söylediğinde manuel `/approve` komutunu eklemelidir.

    Teslim kuralları:

    - `target: "dm"`, onay istemlerini yalnızca çözümlenen onaylayıcı DM'lerine gönderir
    - `target: "channel"`, istemi kaynak Telegram sohbetine/konusuna geri gönderir
    - `target: "both"`, istemleri onaylayıcı DM'lerine ve kaynak sohbet/konuya gönderir

    Yalnızca çözümlenmiş onaylayıcılar onaylayabilir veya reddedebilir. Onaylayıcı olmayanlar `/approve` kullanamaz ve Telegram onay düğmelerini de kullanamaz.

    Onay çözümleme davranışı:

    - `plugin:` öneki taşıyan kimlikler her zaman plugin onayları üzerinden çözümlenir.
    - Diğer onay kimlikleri önce `exec.approval.resolve` dener.
    - Telegram aynı zamanda plugin onayları için yetkiliyse ve gateway
      exec onayının bilinmediğini/süresinin dolduğunu söylerse, Telegram bir kez
      `plugin.approval.resolve` üzerinden yeniden dener.
    - Gerçek exec onay reddi/hataları sessizce plugin
      onay çözümlemesine düşmez.

    Kanal teslimi komut metnini sohbette gösterir; bu nedenle `channel` veya `both` yalnızca güvenilir gruplarda/konularda etkinleştirilmelidir. İstem bir forum konusuna ulaştığında, OpenClaw hem onay istemi hem de onay sonrası takip için konuyu korur. Exec onaylarının varsayılan süresi 30 dakikadır.

    Satır içi onay düğmeleri ayrıca `channels.telegram.capabilities.inlineButtons` değerinin hedef yüzeye (`dm`, `group` veya `all`) izin vermesine bağlıdır.

    İlgili belgeler: [Exec onayları](/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## Hata yanıtı denetimleri

Ajan bir teslimat veya sağlayıcı hatasıyla karşılaştığında, Telegram ya hata metniyle yanıt verebilir ya da bunu bastırabilir. Bu davranışı iki config anahtarı kontrol eder:

| Anahtar                             | Değerler          | Varsayılan | Açıklama                                                                                         |
| ----------------------------------- | ----------------- | ---------- | ------------------------------------------------------------------------------------------------ |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply`    | `reply`, sohbete kullanıcı dostu bir hata mesajı gönderir. `silent`, hata yanıtlarını tamamen bastırır. |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000`    | Aynı sohbete hata yanıtları arasındaki minimum süre. Kesintiler sırasında hata spam'ini önler.  |

Hesap başına, grup başına ve konu başına geçersiz kılmalar desteklenir (diğer Telegram config anahtarlarıyla aynı kalıtım).

```json5
{
  channels: {
    telegram: {
      errorPolicy: "reply",
      errorCooldownMs: 120000,
      groups: {
        "-1001234567890": {
          errorPolicy: "silent", // bu grupta hataları bastır
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
      - BotFather: `/setprivacy` -> Devre dışı bırak
      - ardından botu gruptan kaldırıp yeniden ekleyin
    - `openclaw channels status`, config bahsedilmeyen grup mesajları beklediğinde uyarı verir.
    - `openclaw channels status --probe`, açık sayısal grup kimliklerini denetleyebilir; joker `"*"` için üyelik denetimi yapılamaz.
    - hızlı oturum testi: `/activation always`.

  </Accordion>

  <Accordion title="Bot grup mesajlarını hiç görmüyor">

    - `channels.telegram.groups` varsa grup listelenmiş olmalıdır (veya `"*"` içermelidir)
    - botun gruba üyeliğini doğrulayın
    - atlama nedenleri için günlükleri gözden geçirin: `openclaw logs --follow`

  </Accordion>

  <Accordion title="Komutlar kısmen çalışıyor veya hiç çalışmıyor">

    - gönderen kimliğinizi yetkilendirin (eşleştirme ve/veya sayısal `allowFrom`)
    - grup ilkesi `open` olsa bile komut yetkilendirmesi yine geçerlidir
    - `BOT_COMMANDS_TOO_MUCH` ile `setMyCommands failed`, yerel menüde çok fazla giriş olduğu anlamına gelir; plugin/skill/özel komutları azaltın veya yerel menüleri devre dışı bırakın
    - ağ/fetch hatalarıyla `setMyCommands failed`, genellikle `api.telegram.org` adresine DNS/HTTPS erişilebilirliği sorunlarını gösterir

  </Accordion>

  <Accordion title="Yoklama veya ağ kararsızlığı">

    - Node 22+ + özel fetch/proxy, AbortSignal türleri uyuşmazsa anında iptal davranışını tetikleyebilir.
    - Bazı ana bilgisayarlar `api.telegram.org` adresini önce IPv6'ya çözümler; bozuk IPv6 çıkışı aralıklı Telegram API hatalarına yol açabilir.
    - Günlüklerde `TypeError: fetch failed` veya `Network request for 'getUpdates' failed!` varsa, OpenClaw artık bunları kurtarılabilir ağ hataları olarak yeniden dener.
    - Doğrudan çıkışı/TLS'si kararsız VPS ana bilgisayarlarında, Telegram API çağrılarını `channels.telegram.proxy` üzerinden yönlendirin:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+, varsayılan olarak `autoSelectFamily=true` (WSL2 hariç) ve `dnsResultOrder=ipv4first` kullanır.
    - Ana bilgisayarınız WSL2 ise veya açıkça yalnızca IPv4 davranışıyla daha iyi çalışıyorsa, aile seçimini zorlayın:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - RFC 2544 benchmark aralığı yanıtlarına (`198.18.0.0/15`) Telegram medya indirmeleri için zaten varsayılan olarak izin verilir. Güvenilir bir fake-IP veya
      saydam proxy medya indirmeleri sırasında `api.telegram.org` adresini başka bir
      özel/dahili/özel kullanımlı adrese yeniden yazıyorsa, Telegram'a özel bu
      baypası etkinleştirebilirsiniz:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - Aynı isteğe bağlı etkinleştirme hesap başına da
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`
      üzerinden kullanılabilir.
    - Proxy'niz Telegram medya ana bilgisayarlarını `198.18.x.x` içine çözümlüyorsa,
      önce tehlikeli bayrağı kapalı bırakın. Telegram medyası zaten RFC 2544
      benchmark aralığına varsayılan olarak izin verir.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork`, Telegram
      medya SSRF korumalarını zayıflatır. Bunu yalnızca Clash, Mihomo veya Surge fake-IP yönlendirmesi gibi, RFC 2544 benchmark
      aralığı dışındaki özel veya özel kullanımlı yanıtlar sentezleyen güvenilir,
      operatör denetimli proxy ortamlarında kullanın. Normal herkese açık internet Telegram erişimi için kapalı bırakın.
    </Warning>

    - Ortam değişkeni geçersiz kılmaları (geçici):
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

Daha fazla yardım: [Kanal sorun giderme](/channels/troubleshooting).

## Telegram config başvuru işaretçileri

Birincil başvuru:

- `channels.telegram.enabled`: kanal başlatmayı etkinleştirir/devre dışı bırakır.
- `channels.telegram.botToken`: bot token'ı (BotFather).
- `channels.telegram.tokenFile`: token'ı normal bir dosya yolundan okur. Sembolik bağlantılar reddedilir.
- `channels.telegram.dmPolicy`: `pairing | allowlist | open | disabled` (varsayılan: pairing).
- `channels.telegram.allowFrom`: DM allowlist'i (sayısal Telegram kullanıcı kimlikleri). `allowlist`, en az bir gönderen kimliği gerektirir. `open`, `"*"` gerektirir. `openclaw doctor --fix`, eski `@username` girdilerini kimliklere çözümleyebilir ve allowlist geçiş akışlarında pairing-store dosyalarından allowlist girdilerini geri alabilir.
- `channels.telegram.actions.poll`: Telegram anket oluşturmayı etkinleştirir veya devre dışı bırakır (varsayılan: etkin; yine de `sendMessage` gerektirir).
- `channels.telegram.defaultTo`: açık bir `--reply-to` verilmediğinde CLI `--deliver` için kullanılan varsayılan Telegram hedefi.
- `channels.telegram.groupPolicy`: `open | allowlist | disabled` (varsayılan: allowlist).
- `channels.telegram.groupAllowFrom`: grup gönderen allowlist'i (sayısal Telegram kullanıcı kimlikleri). `openclaw doctor --fix`, eski `@username` girdilerini kimliklere çözümleyebilir. Sayısal olmayan girdiler kimlik doğrulama sırasında yok sayılır. Grup kimlik doğrulaması DM pairing-store geri dönüşü kullanmaz (`2026.2.25+`).
- Çoklu hesap önceliği:
  - İki veya daha fazla hesap kimliği yapılandırıldığında, varsayılan yönlendirmeyi açık hale getirmek için `channels.telegram.defaultAccount` ayarlayın (veya `channels.telegram.accounts.default` ekleyin).
  - İkisi de ayarlanmamışsa, OpenClaw ilk normalize edilmiş hesap kimliğine geri döner ve `openclaw doctor` uyarı verir.
  - `channels.telegram.accounts.default.allowFrom` ve `channels.telegram.accounts.default.groupAllowFrom` yalnızca `default` hesabı için geçerlidir.
  - Adlandırılmış hesaplar, hesap düzeyi değerler ayarlanmadığında `channels.telegram.allowFrom` ve `channels.telegram.groupAllowFrom` değerlerini devralır.
  - Adlandırılmış hesaplar, `channels.telegram.accounts.default.allowFrom` / `groupAllowFrom` değerlerini devralmaz.
- `channels.telegram.groups`: grup başına varsayılanlar + allowlist (`"*"` ile genel varsayılanlar kullanılır).
  - `channels.telegram.groups.<id>.groupPolicy`: groupPolicy için grup başına geçersiz kılma (`open | allowlist | disabled`).
  - `channels.telegram.groups.<id>.requireMention`: bahsetme geçitlemesi varsayılanı.
  - `channels.telegram.groups.<id>.skills`: skill filtresi (atlanırsa = tüm Skills, boşsa = hiçbiri).
  - `channels.telegram.groups.<id>.allowFrom`: grup başına gönderen allowlist'i geçersiz kılması.
  - `channels.telegram.groups.<id>.systemPrompt`: grup için ek sistem istemi.
  - `channels.telegram.groups.<id>.enabled`: `false` olduğunda grubu devre dışı bırakır.
  - `channels.telegram.groups.<id>.topics.<threadId>.*`: konu başına geçersiz kılmalar (grup alanları + konuya özel `agentId`).
  - `channels.telegram.groups.<id>.topics.<threadId>.agentId`: bu konuyu belirli bir ajana yönlendirir (grup düzeyi ve bağlama yönlendirmesini geçersiz kılar).
- `channels.telegram.groups.<id>.topics.<threadId>.groupPolicy`: groupPolicy için konu başına geçersiz kılma (`open | allowlist | disabled`).
- `channels.telegram.groups.<id>.topics.<threadId>.requireMention`: konu başına bahsetme geçitlemesi geçersiz kılması.
- `type: "acp"` ve `match.peer.id` içinde kurallı konu kimliği `chatId:topic:topicId` bulunan üst düzey `bindings[]`: kalıcı ACP konu bağlama alanları (bkz. [ACP Ajanları](/tools/acp-agents#channel-specific-settings)).
- `channels.telegram.direct.<id>.topics.<threadId>.agentId`: DM konularını belirli bir ajana yönlendirir (forum konularıyla aynı davranış).
- `channels.telegram.execApprovals.enabled`: Telegram'ı bu hesap için sohbet tabanlı exec onay istemcisi olarak etkinleştirir.
- `channels.telegram.execApprovals.approvers`: exec isteklerini onaylamasına veya reddetmesine izin verilen Telegram kullanıcı kimlikleri. `channels.telegram.allowFrom` veya doğrudan `channels.telegram.defaultTo` zaten sahibini tanımlıyorsa isteğe bağlıdır.
- `channels.telegram.execApprovals.target`: `dm | channel | both` (varsayılan: `dm`). `channel` ve `both`, mevcut olduğunda kaynak Telegram konusunu korur.
- `channels.telegram.execApprovals.agentFilter`: iletilen onay istemleri için isteğe bağlı ajan kimliği filtresi.
- `channels.telegram.execApprovals.sessionFilter`: iletilen onay istemleri için isteğe bağlı oturum anahtarı filtresi (alt dize veya regex).
- `channels.telegram.accounts.<account>.execApprovals`: Telegram exec onay yönlendirmesi ve onaylayıcı yetkilendirmesi için hesap başına geçersiz kılma.
- `channels.telegram.capabilities.inlineButtons`: `off | dm | group | all | allowlist` (varsayılan: allowlist).
- `channels.telegram.accounts.<account>.capabilities.inlineButtons`: hesap başına geçersiz kılma.
- `channels.telegram.commands.nativeSkills`: Telegram yerel skills komutlarını etkinleştirir/devre dışı bırakır.
- `channels.telegram.replyToMode`: `off | first | all` (varsayılan: `off`).
- `channels.telegram.textChunkLimit`: giden parça boyutu (karakter).
- `channels.telegram.chunkMode`: uzunluk parçalamadan önce boş satırlarda (paragraf sınırlarında) bölmek için `length` (varsayılan) veya `newline`.
- `channels.telegram.linkPreview`: giden mesajlar için link önizlemelerini açıp kapatır (varsayılan: true).
- `channels.telegram.streaming`: `off | partial | block | progress` (canlı akış önizlemesi; varsayılan: `partial`; `progress`, `partial` olarak eşlenir; `block`, eski önizleme modu uyumluluğudur). Telegram önizleme akışı, yerinde düzenlenen tek bir önizleme mesajı kullanır.
- `channels.telegram.mediaMaxMb`: gelen/giden Telegram medya üst sınırı (MB, varsayılan: 100).
- `channels.telegram.retry`: kurtarılabilir giden API hatalarında Telegram gönderim yardımcıları (CLI/tools/actions) için yeniden deneme ilkesi (deneme sayısı, minDelayMs, maxDelayMs, jitter).
- `channels.telegram.network.autoSelectFamily`: Node autoSelectFamily'yi geçersiz kılar (true=etkin, false=devre dışı). Varsayılan olarak Node 22+ üzerinde etkindir, WSL2'de varsayılan olarak devre dışıdır.
- `channels.telegram.network.dnsResultOrder`: DNS sonuç sırasını geçersiz kılar (`ipv4first` veya `verbatim`). Varsayılan olarak Node 22+ üzerinde `ipv4first` kullanılır.
- `channels.telegram.network.dangerouslyAllowPrivateNetwork`: Telegram medya indirmelerinin `api.telegram.org` adresini varsayılan RFC 2544 benchmark aralığı izni dışındaki özel/dahili/özel kullanımlı adreslere çözümlediği güvenilir fake-IP veya saydam proxy ortamları için tehlikeli isteğe bağlı etkinleştirme.
- `channels.telegram.proxy`: Bot API çağrıları için proxy URL'si (SOCKS/HTTP).
- `channels.telegram.webhookUrl`: webhook modunu etkinleştirir (`channels.telegram.webhookSecret` gerektirir).
- `channels.telegram.webhookSecret`: webhook gizli anahtarı (`webhookUrl` ayarlandığında gereklidir).
- `channels.telegram.webhookPath`: yerel webhook yolu (varsayılan `/telegram-webhook`).
- `channels.telegram.webhookHost`: yerel webhook bağlama ana bilgisayarı (varsayılan `127.0.0.1`).
- `channels.telegram.webhookPort`: yerel webhook bağlama bağlantı noktası (varsayılan `8787`).
- `channels.telegram.actions.reactions`: Telegram araç tepkilerini geçitler.
- `channels.telegram.actions.sendMessage`: Telegram araç mesaj gönderimlerini geçitler.
- `channels.telegram.actions.deleteMessage`: Telegram araç mesaj silmelerini geçitler.
- `channels.telegram.actions.sticker`: Telegram sticker eylemlerini — gönderme ve arama — geçitler (varsayılan: false).
- `channels.telegram.reactionNotifications`: `off | own | all` — hangi tepkilerin sistem olaylarını tetiklediğini kontrol eder (ayarlanmadığında varsayılan: `own`).
- `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` — ajanın tepki yeteneğini kontrol eder (ayarlanmadığında varsayılan: `minimal`).
- `channels.telegram.errorPolicy`: `reply | silent` — hata yanıtı davranışını kontrol eder (varsayılan: `reply`). Hesap/grup/konu başına geçersiz kılmalar desteklenir.
- `channels.telegram.errorCooldownMs`: aynı sohbete hata yanıtları arasındaki minimum ms (varsayılan: `60000`). Kesintiler sırasında hata spam'ini önler.

- [Yapılandırma başvurusu - Telegram](/gateway/configuration-reference#telegram)

Telegram'a özgü yüksek sinyalli alanlar:

- başlangıç/kimlik doğrulama: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` normal bir dosyayı işaret etmelidir; sembolik bağlantılar reddedilir)
- erişim denetimi: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, üst düzey `bindings[]` (`type: "acp"`)
- exec onayları: `execApprovals`, `accounts.*.execApprovals`
- komut/menü: `commands.native`, `commands.nativeSkills`, `customCommands`
- iş parçacığı/yanıtlar: `replyToMode`
- akış: `streaming` (önizleme), `blockStreaming`
- biçimlendirme/teslimat: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- medya/ağ: `mediaMaxMb`, `timeoutSeconds`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- eylemler/yetenekler: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- tepkiler: `reactionNotifications`, `reactionLevel`
- hatalar: `errorPolicy`, `errorCooldownMs`
- yazımlar/geçmiş: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

## İlgili

- [Eşleştirme](/tr/channels/pairing)
- [Gruplar](/tr/channels/groups)
- [Güvenlik](/gateway/security)
- [Kanal yönlendirmesi](/tr/channels/channel-routing)
- [Çok ajanlı yönlendirme](/concepts/multi-agent)
- [Sorun giderme](/channels/troubleshooting)
