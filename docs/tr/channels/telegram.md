---
read_when:
    - Telegram özellikleri veya Webhook'lar üzerinde çalışıyorsunuz
summary: Telegram bot destek durumu, yetenekleri ve yapılandırması
title: Telegram
x-i18n:
    generated_at: "2026-04-22T04:20:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1575c4e5e932a4a6330d57fa0d1639336aecdb8fa70d37d92dccd0d466d2fccb
    source_path: channels/telegram.md
    workflow: 15
---

# Telegram (Bot API)

Durum: grammY aracılığıyla bot DM'leri + gruplar için production-ready. Uzun yoklama varsayılan moddur; Webhook modu isteğe bağlıdır.

<CardGroup cols={3}>
  <Card title="Eşleştirme" icon="link" href="/tr/channels/pairing">
    Telegram için varsayılan DM politikası eşleştirmedir.
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

  <Step title="Token'ı ve DM politikasını yapılandırın">

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
    Botu grubunuza ekleyin, ardından `channels.telegram.groups` ve `groupPolicy` ayarlarını erişim modelinize uyacak şekilde yapın.
  </Step>
</Steps>

<Note>
Token çözümleme sırası hesap farkındalıklıdır. Pratikte config değerleri ortam geri dönüşüne üstün gelir ve `TELEGRAM_BOT_TOKEN` yalnızca varsayılan hesap için geçerlidir.
</Note>

## Telegram tarafı ayarları

<AccordionGroup>
  <Accordion title="Gizlilik modu ve grup görünürlüğü">
    Telegram botları varsayılan olarak **Privacy Mode** ile gelir; bu, alacakları grup mesajlarını sınırlar.

    Botun tüm grup mesajlarını görmesi gerekiyorsa şunlardan birini yapın:

    - `/setprivacy` aracılığıyla gizlilik modunu devre dışı bırakın veya
    - botu grup yöneticisi yapın.

    Gizlilik modunu değiştirirken, Telegram'ın değişikliği uygulaması için botu her gruptan kaldırıp yeniden ekleyin.

  </Accordion>

  <Accordion title="Grup izinleri">
    Yönetici durumu Telegram grup ayarlarında denetlenir.

    Yönetici botlar tüm grup mesajlarını alır; bu, her zaman etkin grup davranışı için kullanışlıdır.

  </Accordion>

  <Accordion title="Yararlı BotFather anahtarları">

    - grup eklemelerine izin vermek/engellemek için `/setjoingroups`
    - grup görünürlüğü davranışı için `/setprivacy`

  </Accordion>
</AccordionGroup>

## Erişim denetimi ve etkinleştirme

<Tabs>
  <Tab title="DM politikası">
    `channels.telegram.dmPolicy`, doğrudan mesaj erişimini denetler:

    - `pairing` (varsayılan)
    - `allowlist` (`allowFrom` içinde en az bir gönderici kimliği gerektirir)
    - `open` (`allowFrom` içinde `"*"` bulunmasını gerektirir)
    - `disabled`

    `channels.telegram.allowFrom`, sayısal Telegram kullanıcı kimliklerini kabul eder. `telegram:` / `tg:` önekleri kabul edilir ve normalize edilir.
    `allowFrom` boşken `dmPolicy: "allowlist"` tüm DM'leri engeller ve yapılandırma doğrulaması tarafından reddedilir.
    Kurulum yalnızca sayısal kullanıcı kimliklerini ister.
    Yükseltme yaptıysanız ve config'inizde `@username` allowlist girdileri varsa, bunları çözümlemek için `openclaw doctor --fix` çalıştırın (best-effort; bir Telegram bot token'ı gerektirir).
    Daha önce eşleştirme deposu allowlist dosyalarına güveniyorsanız, `openclaw doctor --fix`, allowlist akışlarında girdileri `channels.telegram.allowFrom` içine geri kazanabilir (örneğin `dmPolicy: "allowlist"` için henüz açık kimlikler yoksa).

    Tek sahipli botlar için, erişim politikasını yapılandırmada kalıcı tutmak amacıyla açık sayısal `allowFrom` kimlikleriyle `dmPolicy: "allowlist"` tercih edin (önceki eşleştirme onaylarına bağlı olmak yerine).

    Yaygın karışıklık: DM eşleştirme onayı, "bu gönderici her yerde yetkili" anlamına gelmez.
    Eşleştirme yalnızca DM erişimi verir. Grup göndericisi yetkilendirmesi yine açık config allowlist'lerinden gelir.
    "Bir kez yetkilendirileyim ve hem DM'ler hem de grup komutları çalışsın" istiyorsanız, sayısal Telegram kullanıcı kimliğinizi `channels.telegram.allowFrom` içine koyun.

    ### Telegram kullanıcı kimliğinizi bulma

    Daha güvenli (üçüncü taraf bot olmadan):

    1. Botunuza DM gönderin.
    2. `openclaw logs --follow` komutunu çalıştırın.
    3. `from.id` değerini okuyun.

    Resmi Bot API yöntemi:

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    Üçüncü taraf yöntemi (daha az gizli): `@userinfobot` veya `@getidsbot`.

  </Tab>

  <Tab title="Grup politikası ve allowlist'ler">
    Birlikte iki denetim uygulanır:

    1. **Hangi gruplara izin verildiği** (`channels.telegram.groups`)
       - `groups` config'i yok:
         - `groupPolicy: "open"` ile: herhangi bir grup, grup kimliği denetimlerini geçebilir
         - `groupPolicy: "allowlist"` (varsayılan) ile: `groups` girdileri (veya `"*"`) eklenene kadar gruplar engellenir
       - `groups` yapılandırılmış: allowlist görevi görür (açık kimlikler veya `"*"`)

    2. **Gruplarda hangi göndericilere izin verildiği** (`channels.telegram.groupPolicy`)
       - `open`
       - `allowlist` (varsayılan)
       - `disabled`

    `groupAllowFrom`, grup göndericisi filtrelemesi için kullanılır. Ayarlı değilse Telegram `allowFrom` değerine geri döner.
    `groupAllowFrom` girdileri sayısal Telegram kullanıcı kimlikleri olmalıdır (`telegram:` / `tg:` önekleri normalize edilir).
    Telegram grup veya süper grup sohbet kimliklerini `groupAllowFrom` içine koymayın. Negatif sohbet kimlikleri `channels.telegram.groups` altında yer almalıdır.
    Sayısal olmayan girdiler gönderici yetkilendirmesi için yok sayılır.
    Güvenlik sınırı (`2026.2.25+`): grup göndericisi kimlik doğrulaması, DM eşleştirme deposu onaylarını **devralmaz**.
    Eşleştirme yalnızca DM için kalır. Gruplar için `groupAllowFrom` veya grup/grup konusu başına `allowFrom` ayarlayın.
    `groupAllowFrom` ayarlı değilse Telegram, eşleştirme deposuna değil config `allowFrom` değerine geri döner.
    Tek sahipli botlar için pratik kalıp: kullanıcı kimliğinizi `channels.telegram.allowFrom` içine koyun, `groupAllowFrom` değerini ayarlamayın ve hedef gruplara `channels.telegram.groups` altında izin verin.
    Çalışma zamanı notu: `channels.telegram` tamamen eksikse, çalışma zamanı `channels.defaults.groupPolicy` açıkça ayarlanmadıkça varsayılan olarak fail-closed `groupPolicy="allowlist"` kullanır.

    Örnek: belirli bir grupta herhangi bir üyeye izin verin:

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
      Yaygın hata: `groupAllowFrom`, Telegram grup allowlist'i değildir.

      - `-1001234567890` gibi negatif Telegram grup veya süper grup sohbet kimliklerini `channels.telegram.groups` altına koyun.
      - İzin verilmiş bir grup içindeki hangi kişilerin botu tetikleyebileceğini sınırlamak istediğinizde `8734062810` gibi Telegram kullanıcı kimliklerini `groupAllowFrom` altına koyun.
      - `groupAllowFrom: ["*"]` değerini yalnızca izin verilmiş bir grubun herhangi bir üyesinin botla konuşabilmesini istediğinizde kullanın.
    </Warning>

  </Tab>

  <Tab title="Bahsetme davranışı">
    Grup yanıtları varsayılan olarak bahsetme gerektirir.

    Bahsetme şuradan gelebilir:

    - yerel `@botusername` bahsetmesi veya
    - şu alanlardaki bahsetme kalıpları:
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

    Grup sohbet kimliğini alma:

    - bir grup mesajını `@userinfobot` / `@getidsbot` botuna iletin
    - veya `openclaw logs --follow` içinden `chat.id` değerini okuyun
    - veya Bot API `getUpdates` çıktısını inceleyin

  </Tab>
</Tabs>

## Çalışma zamanı davranışı

- Telegram, gateway sürecine aittir.
- Yönlendirme deterministiktir: Telegram'dan gelen yanıtlar Telegram'a geri gider (kanalları model seçmez).
- Gelen mesajlar, yanıt meta verileri ve medya yer tutucuları ile paylaşılan kanal zarfına normalize edilir.
- Grup oturumları grup kimliğiyle yalıtılır. Forum konuları, konuları yalıtılmış tutmak için `:topic:<threadId>` ekler.
- DM mesajları `message_thread_id` taşıyabilir; OpenClaw bunları thread farkındalıklı oturum anahtarlarıyla yönlendirir ve yanıtlar için thread kimliğini korur.
- Uzun yoklama, sohbet başına/thread başına sıralama ile grammY runner kullanır. Genel runner sink eşzamanlılığı `agents.defaults.maxConcurrent` kullanır.
- Uzun yoklama watchdog yeniden başlatmaları varsayılan olarak 120 saniye boyunca tamamlanmış `getUpdates` canlılığı olmazsa tetiklenir. Dağıtımınız uzun süreli işler sırasında hâlâ yanlış polling-stall yeniden başlatmaları görüyorsa yalnızca `channels.telegram.pollingStallThresholdMs` değerini artırın. Değer milisaniye cinsindendir ve `30000` ile `600000` arasında olabilir; hesap başına geçersiz kılmalar desteklenir.
- Telegram Bot API, okundu bilgisi desteğine sahip değildir (`sendReadReceipts` uygulanmaz).

## Özellik başvurusu

<AccordionGroup>
  <Accordion title="Canlı akış önizlemesi (mesaj düzenlemeleri)">
    OpenClaw, kısmi yanıtları gerçek zamanlı olarak akıtabilir:

    - doğrudan sohbetler: önizleme mesajı + `editMessageText`
    - gruplar/konular: önizleme mesajı + `editMessageText`

    Gereksinim:

    - `channels.telegram.streaming`, `off | partial | block | progress` değerlerinden biridir (varsayılan: `partial`)
    - `progress`, Telegram'da `partial` olarak eşlenir (kanallar arası adlandırma uyumluluğu)
    - `streaming.preview.toolProgress`, araç/ilerleme güncellemelerinin aynı düzenlenmiş önizleme mesajını yeniden kullanıp kullanmayacağını denetler (varsayılan: `true`). Ayrı araç/ilerleme mesajları tutmak için `false` ayarlayın.
    - eski `channels.telegram.streamMode` ve boolean `streaming` değerleri otomatik eşlenir

    Yalnızca metin içeren yanıtlar için:

    - DM: OpenClaw aynı önizleme mesajını korur ve yerinde son düzenleme yapar (ikinci mesaj yoktur)
    - grup/konu: OpenClaw aynı önizleme mesajını korur ve yerinde son düzenleme yapar (ikinci mesaj yoktur)

    Karmaşık yanıtlar için (örneğin medya payload'ları), OpenClaw normal son teslimata geri döner ve ardından önizleme mesajını temizler.

    Önizleme akışı, blok akışından ayrıdır. Telegram için blok akışı açıkça etkinleştirildiğinde OpenClaw, çift akışı önlemek için önizleme akışını atlar.

    Yerel taslak taşıma mevcut değilse/reddedilirse OpenClaw otomatik olarak `sendMessage` + `editMessageText` kullanımına geri döner.

    Yalnızca Telegram reasoning akışı:

    - `/reasoning stream`, oluşturma sırasında reasoning'i canlı önizlemeye gönderir
    - son yanıt, reasoning metni olmadan gönderilir

  </Accordion>

  <Accordion title="Biçimlendirme ve HTML geri dönüşü">
    Giden metin Telegram `parse_mode: "HTML"` kullanır.

    - Markdown benzeri metin Telegram için güvenli HTML'ye dönüştürülür.
    - Ham model HTML'si, Telegram ayrıştırma hatalarını azaltmak için escape edilir.
    - Telegram ayrıştırılmış HTML'yi reddederse OpenClaw düz metin olarak yeniden dener.

    Bağlantı önizlemeleri varsayılan olarak etkindir ve `channels.telegram.linkPreview: false` ile devre dışı bırakılabilir.

  </Accordion>

  <Accordion title="Yerel komutlar ve özel komutlar">
    Telegram komut menüsü kaydı başlangıçta `setMyCommands` ile yönetilir.

    Yerel komut varsayılanları:

    - `commands.native: "auto"`, Telegram için yerel komutları etkinleştirir

    Özel komut menüsü girdileri ekleyin:

```json5
{
  channels: {
    telegram: {
      customCommands: [
        { command: "backup", description: "Git yedeği" },
        { command: "generate", description: "Görsel oluştur" },
      ],
    },
  },
}
```

    Kurallar:

    - adlar normalize edilir (baştaki `/` kaldırılır, küçük harfe çevrilir)
    - geçerli kalıp: `a-z`, `0-9`, `_`, uzunluk `1..32`
    - özel komutlar yerel komutların üzerine yazamaz
    - çakışmalar/çoğaltmalar atlanır ve günlüğe kaydedilir

    Notlar:

    - özel komutlar yalnızca menü girdileridir; davranışı otomatik olarak uygulamazlar
    - plugin/Skills komutları Telegram menüsünde gösterilmese bile yazıldığında yine de çalışabilir

    Yerel komutlar devre dışı bırakılırsa yerleşik komutlar kaldırılır. Yapılandırılmışsa özel/plugin komutları yine de kaydedilebilir.

    Yaygın kurulum hataları:

    - `BOT_COMMANDS_TOO_MUCH` ile `setMyCommands failed`, kırpma sonrasında bile Telegram menüsünün taşmış olduğu anlamına gelir; plugin/Skills/özel komut sayısını azaltın veya `channels.telegram.commands.native` değerini devre dışı bırakın.
    - Ağ/fetch hatalarıyla `setMyCommands failed` genellikle `api.telegram.org` adresine giden DNS/HTTPS erişiminin engellendiği anlamına gelir.

    ### Cihaz eşleştirme komutları (`device-pair` plugin)

    `device-pair` plugin kurulu olduğunda:

    1. `/pair` kurulum kodu üretir
    2. kodu iOS uygulamasına yapıştırın
    3. `/pair pending` bekleyen istekleri listeler (rol/scope dahil)
    4. isteği onaylayın:
       - açık onay için `/pair approve <requestId>`
       - yalnızca bir bekleyen istek varsa `/pair approve`
       - en son istek için `/pair approve latest`

    Kurulum kodu kısa ömürlü bir bootstrap token taşır. Yerleşik bootstrap devri, birincil node token'ını `scopes: []` olarak tutar; devredilen herhangi bir operator token ise `operator.approvals`, `operator.read`, `operator.talk.secrets` ve `operator.write` ile sınırlı kalır. Bootstrap scope denetimleri rol önekli olduğundan bu operator allowlist'i yalnızca operator isteklerini karşılar; operator olmayan roller yine kendi rol önekleri altında scope gerektirir.

    Bir cihaz değişmiş kimlik doğrulama ayrıntılarıyla yeniden denerse (örneğin rol/scope/public key), önceki bekleyen istek geçersiz kılınır ve yeni istek farklı bir `requestId` kullanır. Onaylamadan önce `/pair pending` komutunu yeniden çalıştırın.

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

    Geri çağrı tıklamaları agente metin olarak iletilir:
    `callback_data: <value>`

  </Accordion>

  <Accordion title="Agent'ler ve otomasyon için Telegram mesaj eylemleri">
    Telegram araç eylemleri şunları içerir:

    - `sendMessage` (`to`, `content`, isteğe bağlı `mediaUrl`, `replyToMessageId`, `messageThreadId`)
    - `react` (`chatId`, `messageId`, `emoji`)
    - `deleteMessage` (`chatId`, `messageId`)
    - `editMessage` (`chatId`, `messageId`, `content`)
    - `createForumTopic` (`chatId`, `name`, isteğe bağlı `iconColor`, `iconCustomEmojiId`)

    Kanal mesaj eylemleri ergonomik diğer adları gösterir (`send`, `react`, `delete`, `edit`, `sticker`, `sticker-search`, `topic-create`).

    Geçit denetimleri:

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker` (varsayılan: devre dışı)

    Not: `edit` ve `topic-create` şu anda varsayılan olarak etkindir ve ayrı `channels.telegram.actions.*` anahtarlarına sahip değildir.
    Çalışma zamanı gönderimleri etkin config/secrets anlık görüntüsünü kullanır (başlatma/yeniden yükleme), bu nedenle eylem yolları gönderim başına ad hoc SecretRef yeniden çözümlemesi yapmaz.

    Tepki kaldırma semantiği: [/tools/reactions](/tr/tools/reactions)

  </Accordion>

  <Accordion title="Yanıt thread etiketleri">
    Telegram, üretilen çıktıda açık yanıt thread etiketlerini destekler:

    - `[[reply_to_current]]` tetikleyen mesaja yanıt verir
    - `[[reply_to:<id>]]` belirli bir Telegram mesaj kimliğine yanıt verir

    `channels.telegram.replyToMode`, işlenişi denetler:

    - `off` (varsayılan)
    - `first`
    - `all`

    Not: `off`, örtük yanıt thread'ini devre dışı bırakır. Açık `[[reply_to_*]]` etiketleri yine de dikkate alınır.

  </Accordion>

  <Accordion title="Forum konuları ve thread davranışı">
    Forum süper grupları:

    - konu oturum anahtarları `:topic:<threadId>` ekler
    - yanıtlar ve yazıyor durumu konu thread'ini hedefler
    - konu config yolu:
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    Genel konu (`threadId=1`) özel durumu:

    - mesaj gönderimleri `message_thread_id` içermez (Telegram `sendMessage(...thread_id=1)` çağrısını reddeder)
    - yazıyor eylemleri yine de `message_thread_id` içerir

    Konu devralma: konu girdileri, geçersiz kılınmadıkça grup ayarlarını devralır (`requireMention`, `allowFrom`, `skills`, `systemPrompt`, `enabled`, `groupPolicy`).
    `agentId` yalnızca konuya özeldir ve grup varsayılanlarından devralınmaz.

    **Konu başına agent yönlendirmesi**: Her konu, konu config'inde `agentId` ayarlayarak farklı bir agente yönlenebilir. Bu, her konuya kendi yalıtılmış çalışma alanını, belleğini ve oturumunu verir. Örnek:

    ```json5
    {
      channels: {
        telegram: {
          groups: {
            "-1001234567890": {
              topics: {
                "1": { agentId: "main" },      // Genel konu → main agent
                "3": { agentId: "zu" },        // Geliştirme konusu → zu agent
                "5": { agentId: "coder" }      // Kod inceleme → coder agent
              }
            }
          }
        }
      }
    }
    ```

    Her konunun ardından kendi oturum anahtarı olur: `agent:zu:telegram:group:-1001234567890:topic:3`

    **Kalıcı ACP konu bağlama**: Forum konuları, üst düzey tipli ACP bağlamaları aracılığıyla ACP harness oturumlarını sabitleyebilir:

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

    **Sohbetten thread'e bağlı ACP spawn**:

    - `/acp spawn <agent> --thread here|auto`, mevcut Telegram konusunu yeni bir ACP oturumuna bağlayabilir.
    - Sonraki konu mesajları doğrudan bağlı ACP oturumuna yönlenir (`/acp steer` gerekmez).
    - OpenClaw, başarılı bir bağlamadan sonra spawn onay mesajını konu içinde sabitler.
    - `channels.telegram.threadBindings.spawnAcpSessions=true` gerektirir.

    Şablon bağlamı şunları içerir:

    - `MessageThreadId`
    - `IsForum`

    DM thread davranışı:

    - `message_thread_id` içeren özel sohbetler DM yönlendirmesini korur ancak thread farkındalıklı oturum anahtarlarını/yanıt hedeflerini kullanır.

  </Accordion>

  <Accordion title="Ses, video ve sticker'lar">
    ### Ses mesajları

    Telegram sesli notlar ile ses dosyalarını ayırır.

    - varsayılan: ses dosyası davranışı
    - agent yanıtında `[[audio_as_voice]]` etiketi, sesli not gönderimini zorunlu kılar

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

    Telegram video dosyaları ile video notlarını ayırır.

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

    Video notları açıklama metnini desteklemez; sağlanan mesaj metni ayrı olarak gönderilir.

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

    Sticker'lar tekrar eden vision çağrılarını azaltmak için bir kez açıklanır (mümkün olduğunda) ve önbelleğe alınır.

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
  query: "cat waving",
  limit: 5,
}
```

  </Accordion>

  <Accordion title="Tepki bildirimleri">
    Telegram tepkileri `message_reaction` güncellemeleri olarak gelir (mesaj payload'larından ayrıdır).

    Etkinleştirildiğinde OpenClaw şu gibi sistem olaylarını kuyruğa alır:

    - `Telegram reaction added: 👍 by Alice (@alice) on msg 42`

    Yapılandırma:

    - `channels.telegram.reactionNotifications`: `off | own | all` (varsayılan: `own`)
    - `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` (varsayılan: `minimal`)

    Notlar:

    - `own`, yalnızca bot tarafından gönderilen mesajlara verilen kullanıcı tepkileri anlamına gelir (gönderilen mesaj önbelleği üzerinden best-effort).
    - Tepki olayları yine de Telegram erişim denetimlerine uyar (`dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`); yetkisiz göndericiler düşürülür.
    - Telegram, tepki güncellemelerinde thread kimlikleri sağlamaz.
      - forum olmayan gruplar grup sohbeti oturumuna yönlenir
      - forum grupları tam kaynak konuya değil, grubun genel konu oturumuna (`:topic:1`) yönlenir

    Yoklama/Webhook için `allowed_updates`, `message_reaction` öğesini otomatik olarak içerir.

  </Accordion>

  <Accordion title="Ack tepkileri">
    `ackReaction`, OpenClaw gelen bir mesajı işlerken bir onay emojisi gönderir.

    Çözümleme sırası:

    - `channels.telegram.accounts.<accountId>.ackReaction`
    - `channels.telegram.ackReaction`
    - `messages.ackReaction`
    - agent kimliği emoji geri dönüşü (`agents.list[].identity.emoji`, aksi halde "👀")

    Notlar:

    - Telegram unicode emoji bekler (örneğin "👀").
    - Bir kanal veya hesap için tepkiyi devre dışı bırakmak üzere `""` kullanın.

  </Accordion>

  <Accordion title="Telegram olayları ve komutlarından config yazımları">
    Kanal config yazımları varsayılan olarak etkindir (`configWrites !== false`).

    Telegram tarafından tetiklenen yazımlar şunları içerir:

    - `channels.telegram.groups` güncellemek için grup geçiş olayları (`migrate_to_chat_id`)
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

  <Accordion title="Uzun yoklama ve Webhook karşılaştırması">
    Varsayılan: uzun yoklama.

    Webhook modu:

    - `channels.telegram.webhookUrl` ayarlayın
    - `channels.telegram.webhookSecret` ayarlayın (Webhook URL ayarlandığında gereklidir)
    - isteğe bağlı `channels.telegram.webhookPath` (varsayılan `/telegram-webhook`)
    - isteğe bağlı `channels.telegram.webhookHost` (varsayılan `127.0.0.1`)
    - isteğe bağlı `channels.telegram.webhookPort` (varsayılan `8787`)

    Webhook modu için varsayılan yerel dinleyici `127.0.0.1:8787` adresine bağlanır.

    Genel uç noktanız farklıysa önüne bir reverse proxy yerleştirin ve `webhookUrl` değerini genel URL'ye yönlendirin.
    Bilerek dış erişim almanız gerekiyorsa `webhookHost` ayarlayın (örneğin `0.0.0.0`).

  </Accordion>

  <Accordion title="Sınırlar, yeniden deneme ve CLI hedefleri">
    - `channels.telegram.textChunkLimit` varsayılanı 4000'dir.
    - `channels.telegram.chunkMode="newline"`, uzunluğa göre bölmeden önce paragraf sınırlarını (boş satırları) tercih eder.
    - `channels.telegram.mediaMaxMb` (varsayılan 100), gelen ve giden Telegram medya boyutunu sınırlar.
    - `channels.telegram.timeoutSeconds`, Telegram API istemcisi zaman aşımını geçersiz kılar (ayarlanmazsa grammY varsayılanı uygulanır).
    - `channels.telegram.pollingStallThresholdMs` varsayılan olarak `120000`'dir; bunu yalnızca yanlış pozitif polling-stall yeniden başlatmaları için `30000` ile `600000` arasında ayarlayın.
    - grup bağlam geçmişi `channels.telegram.historyLimit` veya `messages.groupChat.historyLimit` kullanır (varsayılan 50); `0` devre dışı bırakır.
    - yanıt/alinti/iletme ek bağlamı şu anda alındığı gibi geçirilir.
    - Telegram allowlist'leri öncelikle tam bir ek bağlam sansürleme sınırı değil, agent'i kimin tetikleyebileceğini kontrol eder.
    - DM geçmişi denetimleri:
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - `channels.telegram.retry` yapılandırması, kurtarılabilir giden API hataları için Telegram gönderim yardımcılarına (CLI/araçlar/eylemler) uygulanır.

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

    Yalnızca Telegram anket bayrakları:

    - `--poll-duration-seconds` (5-600)
    - `--poll-anonymous`
    - `--poll-public`
    - forum konuları için `--thread-id` (veya `:topic:` hedefi kullanın)

    Telegram gönderimi ayrıca şunları destekler:

    - `channels.telegram.capabilities.inlineButtons` izin veriyorsa satır içi klavyeler için `buttons` bloklarıyla `--presentation`
    - bot o sohbette sabitleyebiliyorsa sabitlenmiş teslimat istemek için `--pin` veya `--delivery '{"pin":true}'`
    - giden görselleri ve GIF'leri sıkıştırılmış fotoğraf veya animasyonlu medya yüklemeleri yerine belge olarak göndermek için `--force-document`

    Eylem geçitlemesi:

    - `channels.telegram.actions.sendMessage=false`, anketler dahil giden Telegram mesajlarını devre dışı bırakır
    - `channels.telegram.actions.poll=false`, normal gönderimleri etkin bırakarak Telegram anket oluşturmayı devre dışı bırakır

  </Accordion>

  <Accordion title="Telegram'da exec onayları">
    Telegram, onaylayıcı DM'lerinde exec onaylarını destekler ve isteğe bağlı olarak onay istemlerini kaynak sohbet veya konuda paylaşabilir.

    Yapılandırma yolu:

    - `channels.telegram.execApprovals.enabled`
    - `channels.telegram.execApprovals.approvers` (isteğe bağlı; mümkün olduğunda `allowFrom` ve doğrudan `defaultTo` üzerinden çıkarılan sayısal sahip kimliklerine geri döner)
    - `channels.telegram.execApprovals.target` (`dm` | `channel` | `both`, varsayılan: `dm`)
    - `agentFilter`, `sessionFilter`

    Onaylayıcılar sayısal Telegram kullanıcı kimlikleri olmalıdır. Telegram, `enabled` ayarlanmamışsa veya `"auto"` ise ve en az bir onaylayıcı çözümlenebiliyorsa, yerel exec onaylarını otomatik etkinleştirir; bu onaylayıcılar `execApprovals.approvers` üzerinden ya da hesabın sayısal sahip yapılandırmasından (`allowFrom` ve doğrudan mesaj `defaultTo`) gelebilir. Telegram'ı yerel onay istemcisi olarak açıkça devre dışı bırakmak için `enabled: false` ayarlayın. Aksi halde onay istekleri diğer yapılandırılmış onay yollarına veya exec onayı geri dönüş politikasına düşer.

    Telegram ayrıca diğer sohbet kanalları tarafından kullanılan paylaşılan onay düğmelerini de işler. Yerel Telegram bağdaştırıcısı esas olarak teslimattan önce onaylayıcı DM yönlendirmesi, kanal/konu fanout'u ve yazıyor ipuçları ekler.
    Bu düğmeler mevcut olduğunda birincil onay UX'i bunlardır; OpenClaw
    yalnızca araç sonucu sohbet onaylarının kullanılamadığını veya tek yolun
    manuel onay olduğunu söylüyorsa manuel `/approve` komutu eklemelidir.

    Teslim kuralları:

    - `target: "dm"` onay istemlerini yalnızca çözümlenen onaylayıcı DM'lerine gönderir
    - `target: "channel"` istemi kaynak Telegram sohbetine/konusuna geri gönderir
    - `target: "both"` onaylayıcı DM'lerine ve kaynak sohbet/konuya gönderir

    Yalnızca çözümlenen onaylayıcılar onaylayabilir veya reddedebilir. Onaylayıcı olmayanlar `/approve` kullanamaz ve Telegram onay düğmelerini kullanamaz.

    Onay çözümleme davranışı:

    - `plugin:` önekli kimlikler her zaman plugin onayları üzerinden çözülür.
    - Diğer onay kimlikleri önce `exec.approval.resolve` dener.
    - Telegram plugin onayları için de yetkiliyse ve gateway
      exec onayının bilinmediğini/süresinin dolduğunu söylüyorsa Telegram bir kez
      `plugin.approval.resolve` üzerinden yeniden dener.
    - Gerçek exec onay reddi/hataları sessizce plugin
      onay çözümlemesine düşmez.

    Kanal teslimatı komut metnini sohbette gösterir, bu nedenle `channel` veya `both` seçeneklerini yalnızca güvenilir gruplarda/konularda etkinleştirin. İstem bir forum konusuna düşerse OpenClaw hem onay istemi hem de onay sonrası takip için konuyu korur. Exec onaylarının varsayılan olarak 30 dakika sonra süresi dolar.

    Satır içi onay düğmeleri ayrıca `channels.telegram.capabilities.inlineButtons` değerinin hedef yüzeye (`dm`, `group` veya `all`) izin vermesine bağlıdır.

    İlgili belgeler: [Exec approvals](/tr/tools/exec-approvals)

  </Accordion>
</AccordionGroup>

## Hata yanıtı denetimleri

Agent bir teslimat veya sağlayıcı hatasıyla karşılaştığında, Telegram hata metniyle yanıt verebilir veya bunu bastırabilir. Bu davranışı iki config anahtarı denetler:

| Anahtar                            | Değerler          | Varsayılan | Açıklama                                                                                         |
| ----------------------------------- | ----------------- | ------- | ----------------------------------------------------------------------------------------------- |
| `channels.telegram.errorPolicy`     | `reply`, `silent` | `reply` | `reply`, sohbete kullanıcı dostu bir hata mesajı gönderir. `silent`, hata yanıtlarını tamamen bastırır. |
| `channels.telegram.errorCooldownMs` | number (ms)       | `60000` | Aynı sohbete hata yanıtları arasında gereken minimum süre. Kesintiler sırasında hata spam'ini önler.        |

Hesap başına, grup başına ve konu başına geçersiz kılmalar desteklenir (diğer Telegram config anahtarlarıyla aynı devralma).

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
    - `openclaw channels status`, config bahsetmesiz grup mesajları beklediğinde uyarı verir.
    - `openclaw channels status --probe`, açık sayısal grup kimliklerini denetleyebilir; joker `"*"` için üyelik probe yapılamaz.
    - hızlı oturum testi: `/activation always`.

  </Accordion>

  <Accordion title="Bot grup mesajlarını hiç görmüyor">

    - `channels.telegram.groups` mevcutsa grup listelenmiş olmalıdır (veya `"*"` içermelidir)
    - botun gruptaki üyeliğini doğrulayın
    - atlama nedenleri için günlükleri inceleyin: `openclaw logs --follow`

  </Accordion>

  <Accordion title="Komutlar kısmen çalışıyor veya hiç çalışmıyor">

    - gönderici kimliğinize yetki verin (eşleştirme ve/veya sayısal `allowFrom`)
    - grup politikası `open` olsa bile komut yetkilendirmesi yine uygulanır
    - `BOT_COMMANDS_TOO_MUCH` ile `setMyCommands failed`, yerel menüde çok fazla giriş olduğu anlamına gelir; plugin/Skills/özel komutları azaltın veya yerel menüleri devre dışı bırakın
    - ağ/fetch hatalarıyla `setMyCommands failed`, genellikle `api.telegram.org` erişimine ilişkin DNS/HTTPS sorunlarını gösterir

  </Accordion>

  <Accordion title="Yoklama veya ağ kararsızlığı">

    - Node 22+ + özel fetch/proxy, `AbortSignal` türleri uyuşmazsa anında iptal davranışını tetikleyebilir.
    - Bazı ana bilgisayarlar `api.telegram.org` adresini önce IPv6'ya çözer; bozuk IPv6 çıkışı aralıklı Telegram API hatalarına neden olabilir.
    - Günlüklerde `TypeError: fetch failed` veya `Network request for 'getUpdates' failed!` varsa OpenClaw artık bunları kurtarılabilir ağ hataları olarak yeniden dener.
    - Günlüklerde `Polling stall detected` varsa OpenClaw varsayılan olarak 120 saniye boyunca tamamlanmış uzun yoklama canlılığı olmadan yoklamayı yeniden başlatır ve Telegram taşımasını yeniden kurar.
    - `channels.telegram.pollingStallThresholdMs` değerini yalnızca uzun süreli `getUpdates` çağrıları sağlıklı olduğu halde ana bilgisayarınız hâlâ yanlış polling-stall yeniden başlatmaları bildiriyorsa artırın. Kalıcı duraksamalar genellikle ana bilgisayar ile `api.telegram.org` arasındaki proxy, DNS, IPv6 veya TLS çıkış sorunlarına işaret eder.
    - Doğrudan çıkış/TLS kararsız olan VPS barındırıcılarında Telegram API çağrılarını `channels.telegram.proxy` üzerinden yönlendirin:

```yaml
channels:
  telegram:
    proxy: socks5://<user>:<password>@proxy-host:1080
```

    - Node 22+ varsayılan olarak `autoSelectFamily=true` (WSL2 hariç) ve `dnsResultOrder=ipv4first` kullanır.
    - Ana bilgisayarınız WSL2 ise veya açıkça yalnızca IPv4 davranışıyla daha iyi çalışıyorsa, adres ailesi seçimini zorlayın:

```yaml
channels:
  telegram:
    network:
      autoSelectFamily: false
```

    - RFC 2544 benchmark aralığı yanıtlarına (`198.18.0.0/15`) Telegram medya indirmeleri
      için zaten varsayılan olarak izin verilir. Güvenilir bir sahte IP veya
      şeffaf proxy, medya indirmeleri sırasında `api.telegram.org` adresini başka bir
      özel/dahili/özel kullanım adresine yeniden yazıyorsa Telegram'a özgü bu atlamayı
      etkinleştirebilirsiniz:

```yaml
channels:
  telegram:
    network:
      dangerouslyAllowPrivateNetwork: true
```

    - Aynı katılım hesap başına da şu yolda kullanılabilir:
      `channels.telegram.accounts.<accountId>.network.dangerouslyAllowPrivateNetwork`.
    - Proxy'niz Telegram medya ana bilgisayarlarını `198.18.x.x` içine çözümlüyorsa
      önce tehlikeli bayrağı kapalı bırakın. Telegram medyası RFC 2544
      benchmark aralığına zaten varsayılan olarak izin verir.

    <Warning>
      `channels.telegram.network.dangerouslyAllowPrivateNetwork`, Telegram
      medya SSRF korumalarını zayıflatır. Bunu yalnızca Clash, Mihomo veya Surge sahte IP yönlendirmesi gibi,
      RFC 2544 benchmark aralığı dışında özel veya özel kullanımlı yanıtlar
      sentezleyen, operatör tarafından denetlenen güvenilir proxy ortamlarında kullanın.
      Normal genel internet Telegram erişimi için kapalı bırakın.
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

## Telegram config referansı işaretçileri

Birincil referans:

- `channels.telegram.enabled`: kanal başlatmayı etkinleştirir/devre dışı bırakır.
- `channels.telegram.botToken`: bot token'ı (BotFather).
- `channels.telegram.tokenFile`: token'ı normal bir dosya yolundan okur. Sembolik bağlantılar reddedilir.
- `channels.telegram.dmPolicy`: `pairing | allowlist | open | disabled` (varsayılan: pairing).
- `channels.telegram.allowFrom`: DM allowlist'i (sayısal Telegram kullanıcı kimlikleri). `allowlist` en az bir gönderici kimliği gerektirir. `open`, `"*"` gerektirir. `openclaw doctor --fix`, eski `@username` girdilerini kimliklere çözümleyebilir ve allowlist geçiş akışlarında allowlist girdilerini pairing-store dosyalarından geri yükleyebilir.
- `channels.telegram.actions.poll`: Telegram anket oluşturmayı etkinleştirir veya devre dışı bırakır (varsayılan: etkin; yine de `sendMessage` gerektirir).
- `channels.telegram.defaultTo`: açık bir `--reply-to` sağlanmadığında CLI `--deliver` tarafından kullanılan varsayılan Telegram hedefi.
- `channels.telegram.groupPolicy`: `open | allowlist | disabled` (varsayılan: allowlist).
- `channels.telegram.groupAllowFrom`: grup gönderici allowlist'i (sayısal Telegram kullanıcı kimlikleri). `openclaw doctor --fix`, eski `@username` girdilerini kimliklere çözümleyebilir. Sayısal olmayan girdiler kimlik doğrulama sırasında yok sayılır. Grup kimlik doğrulaması DM pairing-store geri dönüşünü kullanmaz (`2026.2.25+`).
- Çoklu hesap önceliği:
  - İki veya daha fazla hesap kimliği yapılandırıldığında, varsayılan yönlendirmeyi açık hale getirmek için `channels.telegram.defaultAccount` ayarlayın (veya `channels.telegram.accounts.default` ekleyin).
  - Hiçbiri ayarlanmazsa OpenClaw, ilk normalize edilmiş hesap kimliğine geri döner ve `openclaw doctor` uyarı verir.
  - `channels.telegram.accounts.default.allowFrom` ve `channels.telegram.accounts.default.groupAllowFrom` yalnızca `default` hesabına uygulanır.
  - Adlandırılmış hesaplar, hesap düzeyi değerler ayarlı değilse `channels.telegram.allowFrom` ve `channels.telegram.groupAllowFrom` değerlerini devralır.
  - Adlandırılmış hesaplar `channels.telegram.accounts.default.allowFrom` / `groupAllowFrom` değerlerini devralmaz.
- `channels.telegram.groups`: grup başına varsayılanlar + allowlist (`"*"` genel varsayılanlar için kullanılır).
  - `channels.telegram.groups.<id>.groupPolicy`: groupPolicy için grup başına geçersiz kılma (`open | allowlist | disabled`).
  - `channels.telegram.groups.<id>.requireMention`: varsayılan bahsetme geçitlemesi.
  - `channels.telegram.groups.<id>.skills`: Skills filtresi (atlanırsa = tüm Skills, boşsa = hiçbiri).
  - `channels.telegram.groups.<id>.allowFrom`: grup başına gönderici allowlist'i geçersiz kılması.
  - `channels.telegram.groups.<id>.systemPrompt`: grup için ek sistem istemi.
  - `channels.telegram.groups.<id>.enabled`: `false` olduğunda grubu devre dışı bırakır.
  - `channels.telegram.groups.<id>.topics.<threadId>.*`: konu başına geçersiz kılmalar (grup alanları + yalnızca konuya özgü `agentId`).
  - `channels.telegram.groups.<id>.topics.<threadId>.agentId`: bu konuyu belirli bir agente yönlendirir (grup düzeyi ve binding yönlendirmesini geçersiz kılar).
- `channels.telegram.groups.<id>.topics.<threadId>.groupPolicy`: groupPolicy için konu başına geçersiz kılma (`open | allowlist | disabled`).
- `channels.telegram.groups.<id>.topics.<threadId>.requireMention`: konu başına bahsetme geçitlemesi geçersiz kılması.
- `type: "acp"` ve `match.peer.id` içinde standart konu kimliği `chatId:topic:topicId` olan üst düzey `bindings[]`: kalıcı ACP konu bağlama alanları (bkz. [ACP Agents](/tr/tools/acp-agents#channel-specific-settings)).
- `channels.telegram.direct.<id>.topics.<threadId>.agentId`: DM konularını belirli bir agente yönlendirir (forum konularıyla aynı davranış).
- `channels.telegram.execApprovals.enabled`: bu hesap için Telegram'ı sohbet tabanlı bir exec onay istemcisi olarak etkinleştirir.
- `channels.telegram.execApprovals.approvers`: exec isteklerini onaylamasına veya reddetmesine izin verilen Telegram kullanıcı kimlikleri. `channels.telegram.allowFrom` veya doğrudan bir `channels.telegram.defaultTo` zaten sahibi tanımlıyorsa isteğe bağlıdır.
- `channels.telegram.execApprovals.target`: `dm | channel | both` (varsayılan: `dm`). `channel` ve `both`, mevcut olduğunda kaynak Telegram konusunu korur.
- `channels.telegram.execApprovals.agentFilter`: iletilen onay istemleri için isteğe bağlı agent kimliği filtresi.
- `channels.telegram.execApprovals.sessionFilter`: iletilen onay istemleri için isteğe bağlı oturum anahtarı filtresi (alt dize veya regex).
- `channels.telegram.accounts.<account>.execApprovals`: Telegram exec onay yönlendirmesi ve onaylayıcı yetkilendirmesi için hesap başına geçersiz kılma.
- `channels.telegram.capabilities.inlineButtons`: `off | dm | group | all | allowlist` (varsayılan: allowlist).
- `channels.telegram.accounts.<account>.capabilities.inlineButtons`: hesap başına geçersiz kılma.
- `channels.telegram.commands.nativeSkills`: Telegram yerel Skills komutlarını etkinleştirir/devre dışı bırakır.
- `channels.telegram.replyToMode`: `off | first | all` (varsayılan: `off`).
- `channels.telegram.textChunkLimit`: giden parça boyutu (karakter).
- `channels.telegram.chunkMode`: uzunluk parçalamadan önce boş satırlarda (paragraf sınırları) bölmek için `length` (varsayılan) veya `newline`.
- `channels.telegram.linkPreview`: giden mesajlar için bağlantı önizlemelerini açar/kapatır (varsayılan: true).
- `channels.telegram.streaming`: `off | partial | block | progress` (canlı akış önizlemesi; varsayılan: `partial`; `progress`, `partial` olarak eşlenir; `block`, eski önizleme modu uyumluluğudur). Telegram önizleme akışı, yerinde düzenlenen tek bir önizleme mesajı kullanır.
- `channels.telegram.streaming.preview.toolProgress`: önizleme akışı etkin olduğunda araç/ilerleme güncellemeleri için canlı önizleme mesajını yeniden kullanır (varsayılan: `true`). Ayrı araç/ilerleme mesajları tutmak için `false` ayarlayın.
- `channels.telegram.mediaMaxMb`: gelen/giden Telegram medya üst sınırı (MB, varsayılan: 100).
- `channels.telegram.retry`: kurtarılabilir giden API hatalarında Telegram gönderim yardımcıları (CLI/araçlar/eylemler) için yeniden deneme politikası (deneme sayısı, `minDelayMs`, `maxDelayMs`, jitter).
- `channels.telegram.network.autoSelectFamily`: Node `autoSelectFamily` değerini geçersiz kılar (true=etkin, false=devre dışı). Varsayılan olarak Node 22+ üzerinde etkindir; WSL2'de varsayılan olarak devre dışıdır.
- `channels.telegram.network.dnsResultOrder`: DNS sonuç sırasını geçersiz kılar (`ipv4first` veya `verbatim`). Varsayılan olarak Node 22+ üzerinde `ipv4first` kullanılır.
- `channels.telegram.network.dangerouslyAllowPrivateNetwork`: Telegram medya indirmeleri `api.telegram.org` adresini varsayılan RFC 2544 benchmark aralığı izni dışındaki özel/dahili/özel kullanımlı adreslere çözdüğünde, güvenilir sahte IP veya şeffaf proxy ortamları için tehlikeli katılım.
- `channels.telegram.proxy`: Bot API çağrıları için proxy URL'si (SOCKS/HTTP).
- `channels.telegram.webhookUrl`: Webhook modunu etkinleştirir (`channels.telegram.webhookSecret` gerektirir).
- `channels.telegram.webhookSecret`: Webhook gizlisi (`webhookUrl` ayarlandığında gereklidir).
- `channels.telegram.webhookPath`: yerel Webhook yolu (varsayılan `/telegram-webhook`).
- `channels.telegram.webhookHost`: yerel Webhook bağlama ana bilgisayarı (varsayılan `127.0.0.1`).
- `channels.telegram.webhookPort`: yerel Webhook bağlama bağlantı noktası (varsayılan `8787`).
- `channels.telegram.actions.reactions`: Telegram araç tepkilerini geçitler.
- `channels.telegram.actions.sendMessage`: Telegram araç mesaj gönderimlerini geçitler.
- `channels.telegram.actions.deleteMessage`: Telegram araç mesaj silmelerini geçitler.
- `channels.telegram.actions.sticker`: Telegram sticker eylemlerini — gönderme ve arama — geçitler (varsayılan: false).
- `channels.telegram.reactionNotifications`: `off | own | all` — hangi tepkilerin sistem olaylarını tetikleyeceğini denetler (ayarlanmadığında varsayılan: `own`).
- `channels.telegram.reactionLevel`: `off | ack | minimal | extensive` — agent'in tepki yeteneğini denetler (ayarlanmadığında varsayılan: `minimal`).
- `channels.telegram.errorPolicy`: `reply | silent` — hata yanıtı davranışını denetler (varsayılan: `reply`). Hesap/grup/konu başına geçersiz kılmalar desteklenir.
- `channels.telegram.errorCooldownMs`: aynı sohbete hata yanıtları arasında gereken minimum ms (varsayılan: `60000`). Kesintiler sırasında hata spam'ini önler.

- [Yapılandırma referansı - Telegram](/tr/gateway/configuration-reference#telegram)

Telegram'a özgü yüksek sinyalli alanlar:

- başlatma/kimlik doğrulama: `enabled`, `botToken`, `tokenFile`, `accounts.*` (`tokenFile` normal bir dosyaya işaret etmelidir; sembolik bağlantılar reddedilir)
- erişim denetimi: `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`, `groups.*.topics.*`, üst düzey `bindings[]` (`type: "acp"`)
- exec onayları: `execApprovals`, `accounts.*.execApprovals`
- komut/menü: `commands.native`, `commands.nativeSkills`, `customCommands`
- thread'ler/yanıtlar: `replyToMode`
- akış: `streaming` (önizleme), `streaming.preview.toolProgress`, `blockStreaming`
- biçimlendirme/teslimat: `textChunkLimit`, `chunkMode`, `linkPreview`, `responsePrefix`
- medya/ağ: `mediaMaxMb`, `timeoutSeconds`, `pollingStallThresholdMs`, `retry`, `network.autoSelectFamily`, `network.dangerouslyAllowPrivateNetwork`, `proxy`
- Webhook: `webhookUrl`, `webhookSecret`, `webhookPath`, `webhookHost`
- eylemler/yetenekler: `capabilities.inlineButtons`, `actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- tepkiler: `reactionNotifications`, `reactionLevel`
- hatalar: `errorPolicy`, `errorCooldownMs`
- yazımlar/geçmiş: `configWrites`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`

## İlgili

- [Eşleştirme](/tr/channels/pairing)
- [Gruplar](/tr/channels/groups)
- [Güvenlik](/tr/gateway/security)
- [Kanal yönlendirme](/tr/channels/channel-routing)
- [Çok agent'li yönlendirme](/tr/concepts/multi-agent)
- [Sorun giderme](/tr/channels/troubleshooting)
