---
read_when:
    - Grup sohbeti davranışını veya bahsetme geçitlemesini değiştirme
    - mentionPatterns kapsamını belirli grup konuşmalarıyla sınırlandırma
sidebarTitle: Groups
summary: Yüzeyler genelinde grup sohbeti davranışı (Discord/iMessage/Matrix/Microsoft Teams/QQBot/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Gruplar
x-i18n:
    generated_at: "2026-06-28T00:12:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 48660e36ac642956842d453fd4caf2cbd7f4193efee9ac864fd7cf700c3c43b6
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw, grup sohbetlerini yüzeyler arasında tutarlı şekilde ele alır: Discord, iMessage, Matrix, Microsoft Teams, QQBot, Signal, Slack, Telegram, WhatsApp, Zalo.

Aracı açıkça görünür bir mesaj göndermedikçe sessiz bağlam sağlaması gereken her zaman açık odalar için bkz. [Ortam oda olayları](/tr/channels/ambient-room-events).

## Başlangıç tanıtımı (2 dakika)

OpenClaw kendi mesajlaşma hesaplarınızda "yaşar". Ayrı bir WhatsApp bot kullanıcısı yoktur. Bir grupta **siz** varsınız, OpenClaw o grubu görebilir ve orada yanıt verebilir.

Varsayılan davranış:

- Gruplar kısıtlıdır (`groupPolicy: "allowlist"`).
- Bahsetme geçidini açıkça devre dışı bırakmadığınız sürece yanıtlar bir bahsetme gerektirir.
- Gruplarda/kanallarda görünür yanıtlar varsayılan olarak `message` aracını kullanır.

Anlamı: izin listesine alınmış gönderenler OpenClaw'dan bahsederek onu tetikleyebilir.

<Note>
**Özet**

- **DM erişimi** `*.allowFrom` ile denetlenir.
- **Grup erişimi** `*.groupPolicy` + izin listeleri (`*.groups`, `*.groupAllowFrom`) ile denetlenir.
- **Yanıt tetikleme** bahsetme geçidi (`requireMention`, `/activation`) ile denetlenir.

</Note>

Hızlı akış (bir grup mesajına ne olur):

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
mention/reply/command/DM -> user request
always-on group chatter -> user request, or room event when configured
```

## Görünür yanıtlar

Normal grup/kanal istekleri için OpenClaw varsayılan olarak `messages.groupChat.visibleReplies: "automatic"` kullanır. Odayı yalnızca mesaj aracı çıktısına açıkça ayarlamadığınız sürece son asistan metni eski görünür yanıt yolu üzerinden gönderilir.

Paylaşılan bir odada aracının ne zaman konuşacağına `message(action=send)` çağırarak karar vermesini istiyorsanız `messages.groupChat.visibleReplies: "message_tool"` kullanın. Bu, GPT 5.5 gibi en yeni nesil, araçlarda güvenilir modellerle desteklenen grup odalarında en iyi şekilde çalışır. Model bu aracı kaçırır ve anlamlı son metin döndürürse OpenClaw bu son metni odaya göndermek yerine özel tutar.

Daha zayıf modeller veya yalnızca araçla teslimatı güvenilir şekilde anlamayan çalışma zamanları için `"automatic"` kullanın. Otomatik modda aracının son asistan metni görünür kaynak yanıt yoludur; bu yüzden `message(action=send)` çağrısını tutarlı şekilde yapamayan bir model yine de normal şekilde yanıt verebilir.

Otomatik modda normal metin son yanıtları doğrudan odaya gönderilir. Görünür yanıt dosya, resim veya başka ekler gerektiriyorsa aracı, bunu son metin yanıtından zorla geçirmek yerine ilgili ek için yine `message(action=send)` kullanabilir.

Etkin araç ilkesi altında mesaj aracı kullanılamıyorsa OpenClaw yanıtı sessizce bastırmak yerine otomatik görünür yanıtlara geri döner. `openclaw doctor` bu uyumsuzluk hakkında uyarır.

Doğrudan sohbetler ve diğer tüm kaynak olayları için aynı yalnızca araçla görünür yanıt davranışını genel olarak uygulamak üzere `messages.visibleReplies: "message_tool"` kullanın. Dahili WebChat doğrudan turları, Pi ve Codex aynı görünür yanıt sözleşmesini alsın diye varsayılan olarak otomatik son yanıt teslimatını kullanır. Görünür çıktı için bilinçli olarak `message(action=send)` gerektirmek istiyorsanız `messages.visibleReplies: "message_tool"` ayarlayın. `messages.groupChat.visibleReplies` grup/kanal odaları için daha özel geçersiz kılma olarak kalır.

Bu, modeli çoğu gizlenme modu turu için `NO_REPLY` yanıtlamaya zorlayan eski kalıbın yerini alır. Yalnızca araç modunda istem bir `NO_REPLY` sözleşmesi tanımlamaz. Görünür hiçbir şey yapmamak yalnızca mesaj aracını çağırmamak anlamına gelir.

Plugin'in sahip olduğu konuşma bağlamaları istisnadır. Bir Plugin bir iş parçacığını bağlayıp gelen turu üstlendiğinde, Plugin'in döndürdüğü yanıt görünür bağlama yanıtıdır; `message(action=send)` gerektirmez. Bu yanıt özel model son metni değil, Plugin çalışma zamanı çıktısıdır.

Yazıyor göstergeleri doğrudan grup istekleri için hâlâ gönderilir. Ortam her zaman açık oda olayları etkinleştirildiğinde, aracı mesaj aracını çağırmadıkça katı ve sessiz kalır.

Oturumlar varsayılan olarak ayrıntılı araç/ilerleme özetlerini bastırır. Hata ayıklarken geçerli oturum için bu özetleri göstermek üzere `/verbose on`, yalnızca son yanıt davranışına dönmek için `/verbose off` kullanın. Aynı ayrıntılı durum doğrudan sohbetler, gruplar, kanallar ve forum konuları genelinde geçerlidir.

Bahsedilmemiş her zaman açık grup sohbetini kullanıcı isteği yerine sessiz oda bağlamı olarak göndermek için [Ortam oda olayları](/tr/channels/ambient-room-events) kullanın:

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
    },
  },
}
```

Varsayılan `unmentionedInbound: "user_request"` değeridir.

Bahsedilen mesajlar, komutlar, iptal istekleri ve DM'ler kullanıcı isteği olarak kalır.

Grup/kanal isteklerinde görünür çıktının mesaj aracı üzerinden gitmesini zorunlu kılmak için:

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "message_tool",
    },
  },
}
```

Gateway, dosya kaydedildikten sonra `messages` yapılandırmasını sıcak yeniden yükler. Yalnızca dağıtımda dosya izleme veya yapılandırma yeniden yükleme devre dışıysa yeniden başlatın.

Her kaynak sohbetinde görünür çıktının mesaj aracı üzerinden gitmesini zorunlu kılmak için:

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

Yerel eğik çizgi komutları (Discord, Telegram ve yerel komut desteği olan diğer yüzeyler) `visibleReplies: "message_tool"` ayarını atlar ve kanalın yerel komut arayüzü beklediği yanıtı alsın diye her zaman görünür şekilde yanıtlar. Bu yalnızca doğrulanmış yerel komut turları için geçerlidir; metin olarak yazılan `/...` komutları ve sıradan sohbet turları yapılandırılmış grup varsayılanını izlemeye devam eder.

## Bağlam görünürlüğü ve izin listeleri

Grup güvenliğinde iki farklı denetim vardır:

- **Tetikleme yetkilendirmesi**: aracıyı kim tetikleyebilir (`groupPolicy`, `groups`, `groupAllowFrom`, kanala özgü izin listeleri).
- **Bağlam görünürlüğü**: modele hangi ek bağlam enjekte edilir (yanıt metni, alıntılar, iş parçacığı geçmişi, iletilmiş üst veriler).

Varsayılan olarak OpenClaw normal sohbet davranışına öncelik verir ve bağlamı büyük ölçüde alındığı gibi tutar. Bu, izin listelerinin öncelikle eylemleri kimin tetikleyebileceğine karar verdiği, her alıntılanmış veya geçmiş parçacığı için evrensel bir redaksiyon sınırı olmadığı anlamına gelir.

<AccordionGroup>
  <Accordion title="Geçerli davranış kanala özgüdür">
    - Bazı kanallar belirli yollarda ek bağlam için zaten gönderen tabanlı filtreleme uygular (örneğin Slack iş parçacığı tohumlama, Matrix yanıt/iş parçacığı aramaları).
    - Diğer kanallar alıntı/yanıt/iletme bağlamını hâlâ alındığı gibi geçirir.

  </Accordion>
  <Accordion title="Güçlendirme yönü (planlandı)">
    - `contextVisibility: "all"` (varsayılan) geçerli alındığı gibi davranışı korur.
    - `contextVisibility: "allowlist"` ek bağlamı izin listesine alınmış gönderenlerle filtreler.
    - `contextVisibility: "allowlist_quote"` `allowlist` değerine ek olarak açık bir alıntı/yanıt istisnasıdır.

    Bu güçlendirme modeli kanallar genelinde tutarlı şekilde uygulanana kadar yüzeye göre farklılıklar bekleyin.

  </Accordion>
</AccordionGroup>

![Grup mesaj akışı](/images/groups-flow.svg)

İstiyorsanız...

| Hedef                                        | Ayarlanacak değer                                           |
| -------------------------------------------- | ----------------------------------------------------------- |
| Tüm gruplara izin ver ama yalnızca @bahsetmelerde yanıtla | `groups: { "*": { requireMention: true } }`                 |
| Tüm grup yanıtlarını devre dışı bırak        | `groupPolicy: "disabled"`                                   |
| Yalnızca belirli gruplar                     | `groups: { "<group-id>": { ... } }` (`"*"` anahtarı yok)    |
| Gruplarda yalnızca siz tetikleyebilirsiniz   | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]`  |
| Kanallar arasında tek bir güvenilir gönderen kümesini yeniden kullan | `groupAllowFrom: ["accessGroup:operators"]`                 |

Yeniden kullanılabilir gönderen izin listeleri için bkz. [Erişim grupları](/tr/channels/access-groups).

## Oturum anahtarları

- Grup oturumları `agent:<agentId>:<channel>:group:<id>` oturum anahtarlarını kullanır (odalar/kanallar `agent:<agentId>:<channel>:channel:<id>` kullanır).
- Telegram forum konuları, her konunun kendi oturumu olsun diye grup kimliğine `:topic:<threadId>` ekler.
- Doğrudan sohbetler ana oturumu kullanır (veya yapılandırılmışsa gönderen başına).
- Grup oturumları için Heartbeat'ler atlanır.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Kalıp: kişisel DM'ler + herkese açık gruplar (tek aracı)

Evet — "kişisel" trafiğiniz **DM'ler** ve "herkese açık" trafiğiniz **gruplar** ise bu iyi çalışır.

Neden: tek aracı modunda DM'ler genellikle **ana** oturum anahtarına (`agent:main:main`) düşerken gruplar her zaman **ana olmayan** oturum anahtarlarını (`agent:main:<channel>:group:<id>`) kullanır. `mode: "non-main"` ile korumalı alanı etkinleştirirseniz bu grup oturumları yapılandırılmış korumalı alan arka ucunda çalışır, ana DM oturumunuz ise ana makinede kalır. Birini seçmezseniz varsayılan arka uç Docker'dır.

Bu size tek bir aracı "beyni" (paylaşılan çalışma alanı + bellek), ama iki yürütme duruşu verir:

- **DM'ler**: tam araçlar (ana makine)
- **Gruplar**: korumalı alan + kısıtlı araçlar

<Note>
Gerçekten ayrı çalışma alanlarına/persona'lara ihtiyacınız varsa ("kişisel" ve "herkese açık" asla karışmamalıysa), ikinci bir aracı + bağlamalar kullanın. Bkz. [Çoklu Aracı Yönlendirme](/tr/concepts/multi-agent).
</Note>

<Tabs>
  <Tab title="DM'ler ana makinede, gruplar korumalı alanda">
    ```json5
    {
      agents: {
        defaults: {
          sandbox: {
            mode: "non-main", // groups/channels are non-main -> sandboxed
            scope: "session", // strongest isolation (one container per group/channel)
            workspaceAccess: "none",
          },
        },
      },
      tools: {
        sandbox: {
          tools: {
            // If allow is non-empty, everything else is blocked (deny still wins).
            allow: ["group:messaging", "group:sessions"],
            deny: ["group:runtime", "group:fs", "group:ui", "nodes", "cron", "gateway"],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Gruplar yalnızca izin listesine alınmış bir klasörü görür">
    "Ana makine erişimi yok" yerine "gruplar yalnızca X klasörünü görebilir" mi istiyorsunuz? `workspaceAccess: "none"` değerini koruyun ve yalnızca izin listesine alınmış yolları korumalı alana bağlayın:

    ```json5
    {
      agents: {
        defaults: {
          sandbox: {
            mode: "non-main",
            scope: "session",
            workspaceAccess: "none",
            docker: {
              binds: [
                // hostPath:containerPath:mode
                "/home/user/FriendsShared:/data:ro",
              ],
            },
          },
        },
      },
    }
    ```

  </Tab>
</Tabs>

İlgili:

- Yapılandırma anahtarları ve varsayılanlar: [Gateway yapılandırması](/tr/gateway/config-agents#agentsdefaultssandbox)
- Bir aracın neden engellendiğini hata ayıklama: [Korumalı Alan ve Araç İlkesi ve Yükseltilmiş](/tr/gateway/sandbox-vs-tool-policy-vs-elevated)
- Bağlama ayrıntıları: [Korumalı alan](/tr/gateway/sandboxing#custom-bind-mounts)

## Görüntüleme etiketleri

- Arayüz etiketleri kullanılabiliyorsa `displayName` kullanır ve `<channel>:<token>` olarak biçimlendirilir.
- `#room` odalar/kanallar için ayrılmıştır; grup sohbetleri `g-<slug>` kullanır (küçük harf, boşluklar -> `-`, `#@+._-` koru).

## Grup ilkesi

Grup/oda mesajlarının kanal başına nasıl ele alınacağını denetleyin:

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "disabled", // "open" | "disabled" | "allowlist"
      groupAllowFrom: ["+15551234567"],
    },
    telegram: {
      groupPolicy: "disabled",
      groupAllowFrom: ["123456789"], // numeric Telegram user id (wizard can resolve @username)
    },
    signal: {
      groupPolicy: "disabled",
      groupAllowFrom: ["+15551234567"],
    },
    imessage: {
      groupPolicy: "disabled",
      groupAllowFrom: ["chat_id:123"],
    },
    msteams: {
      groupPolicy: "disabled",
      groupAllowFrom: ["user@org.com"],
    },
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        GUILD_ID: { channels: { help: { allow: true } } },
      },
    },
    slack: {
      groupPolicy: "allowlist",
      channels: { "#general": { allow: true } },
    },
    matrix: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["@owner:example.org"],
      groups: {
        "!roomId:example.org": { enabled: true },
        "#alias:example.org": { enabled: true },
      },
    },
  },
}
```

| İlke          | Davranış                                                     |
| ------------- | ------------------------------------------------------------ |
| `"open"`      | Gruplar izin listelerini atlar; bahsetme denetimi yine uygulanır. |
| `"disabled"`  | Tüm grup mesajlarını tamamen engeller.                       |
| `"allowlist"` | Yalnızca yapılandırılmış izin listesiyle eşleşen gruplara/odalara izin verir. |

<AccordionGroup>
  <Accordion title="Per-channel notes">
    - `groupPolicy`, bahsetme denetiminden ayrıdır (@bahsetmeler gerektirir).
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: `groupAllowFrom` kullanın (yedek: açık `allowFrom`).
    - Signal: `groupAllowFrom`, gelen Signal grup kimliğiyle veya gönderen telefon/UUID değeriyle eşleşebilir.
    - DM eşleştirme onayları (`*-allowFrom` depo girdileri) yalnızca DM erişimine uygulanır; grup gönderen yetkilendirmesi açıkça grup izin listelerinde kalır.
    - Discord: izin listesi `channels.discord.guilds.<id>.channels` kullanır.
    - Slack: izin listesi `channels.slack.channels` kullanır.
    - Matrix: izin listesi `channels.matrix.groups` kullanır. Oda kimliklerini veya diğer adları tercih edin; katılınan oda adı araması en iyi çaba esaslıdır ve çözümlenemeyen adlar çalışma zamanında yok sayılır. Gönderenleri kısıtlamak için `channels.matrix.groupAllowFrom` kullanın; oda başına `users` izin listeleri de desteklenir.
    - Grup DM'leri ayrı denetlenir (`channels.discord.dm.*`, `channels.slack.dm.*`).
    - Telegram izin listesi kullanıcı kimlikleriyle (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) veya kullanıcı adlarıyla (`"@alice"` ya da `"alice"`) eşleşebilir; önekler büyük/küçük harfe duyarsızdır.
    - Varsayılan `groupPolicy: "allowlist"` değeridir; grup izin listeniz boşsa grup mesajları engellenir.
    - Çalışma zamanı güvenliği: bir sağlayıcı bloğu tamamen eksik olduğunda (`channels.<provider>` yoksa), grup ilkesi `channels.defaults.groupPolicy` değerini devralmak yerine kapalı kalma moduna (genellikle `allowlist`) geri döner.

  </Accordion>
</AccordionGroup>

Hızlı zihinsel model (grup mesajları için değerlendirme sırası):

<Steps>
  <Step title="groupPolicy">
    `groupPolicy` (open/disabled/allowlist).
  </Step>
  <Step title="Group allowlists">
    Grup izin listeleri (`*.groups`, `*.groupAllowFrom`, kanala özgü izin listesi).
  </Step>
  <Step title="Mention gating">
    Bahsetme denetimi (`requireMention`, `/activation`).
  </Step>
</Steps>

## Bahsetme denetimi (varsayılan)

Grup mesajları, grup başına geçersiz kılınmadıkça bir bahsetme gerektirir. Varsayılanlar, her alt sistemde `*.groups."*"` altında bulunur.

Bir bot mesajına yanıt vermek, kanal yanıt meta verilerini desteklediğinde örtük bir bahsetme sayılır. Bir bot mesajını alıntılamak da alıntı meta verilerini açığa çıkaran kanallarda örtük bir bahsetme sayılabilir. Geçerli yerleşik durumlar Telegram, WhatsApp, Slack, Discord, Microsoft Teams ve ZaloUser içerir.

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "*": { requireMention: true },
        "123@g.us": { requireMention: false },
      },
    },
    telegram: {
      groups: {
        "*": { requireMention: true },
        "123456789": { requireMention: false },
      },
    },
    imessage: {
      groups: {
        "*": { requireMention: true },
        "123": { requireMention: false },
      },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          mentionPatterns: ["@openclaw", "openclaw", "\\+15555550123"],
          historyLimit: 50,
        },
      },
    ],
  },
}
```

## Yapılandırılmış bahsetme kalıplarını kapsamlandırma

Yapılandırılmış `mentionPatterns`, regex yedek tetikleyicileridir. Platform yerel bir bot bahsetmesini açığa çıkarmadığında veya `openclaw:` gibi düz metnin bahsetme sayılmasını istediğinizde bunları kullanın. Yerel platform bahsetmeleri ayrıdır: Discord, Slack, Telegram, Matrix veya başka bir kanal mesajın botu açıkça bahsettiğini kanıtlayabildiğinde, yapılandırılmış regex kalıpları reddedilmiş olsa bile bu yerel bahsetme yine tetikler.

Varsayılan olarak, yapılandırılmış bahsetme kalıpları, kanalın sağlayıcı ve konuşma bilgilerini bahsetme algılamasına ilettiği her yerde uygulanır. Geniş kalıpların her grupta ajanı uyandırmasını önlemek için bunları kanal başına `channels.<channel>.mentionPatterns` ile kapsamlandırın.

Regex bahsetme kalıplarının bir kanal için varsayılan olarak kapalı olması gerektiğinde `mode: "deny"` kullanın, ardından belirli odaları `allowIn` ile dahil edin:

```json5
{
  messages: {
    groupChat: {
      mentionPatterns: ["\\bopenclaw\\b", "\\bops bot\\b"],
    },
  },
  channels: {
    slack: {
      mentionPatterns: {
        mode: "deny",
        allowIn: ["C0123OPS"],
      },
    },
  },
}
```

Regex bahsetme kalıplarının geniş biçimde uygulanması gerektiğinde varsayılan `mode: "allow"` değerini kullanın (veya `mode` değerini atlayın), ardından gürültülü odalarda `denyIn` ile kapatın:

```json5
{
  messages: {
    groupChat: {
      mentionPatterns: ["\\bopenclaw\\b"],
    },
  },
  channels: {
    telegram: {
      mentionPatterns: {
        denyIn: ["-1001234567890", "-1001234567890:topic:42"],
      },
    },
  },
}
```

İlke çözümleme:

| Alan            | Etki                                                                                                                  |
| --------------- | --------------------------------------------------------------------------------------------------------------------- |
| `mode: "allow"` | Konuşma kimliği `denyIn` içinde değilse regex bahsetme kalıpları etkinleştirilir. Varsayılan budur.                   |
| `mode: "deny"`  | Konuşma kimliği `allowIn` içinde değilse regex bahsetme kalıpları devre dışı bırakılır.                               |
| `allowIn`       | Reddetme modunda regex bahsetme kalıplarının etkinleştirildiği konuşma kimlikleri.                                    |
| `denyIn`        | Regex bahsetme kalıplarının devre dışı bırakıldığı konuşma kimlikleri. Aynı kimlik ikisinde de varsa `denyIn`, `allowIn` üzerinde üstün gelir. |

Bugün desteklenen kapsamlı regex ilkesi:

| Kanal    | `allowIn` / `denyIn` içinde kullanılan kimlikler                 |
| -------- | ---------------------------------------------------------------- |
| Discord  | Discord kanal kimlikleri.                                        |
| Matrix   | Matrix oda kimlikleri.                                           |
| Slack    | Slack kanal kimlikleri.                                          |
| Telegram | Grup sohbet kimlikleri veya forum konuları için `chatId:topic:threadId`. |
| WhatsApp | `123@g.us` gibi WhatsApp konuşma kimlikleri.                     |

Hesap düzeyi kanal yapılandırmaları, kanal birden fazla hesabı desteklediğinde aynı ilkeyi `channels.<channel>.accounts.<accountId>.mentionPatterns` altında ayarlayabilir. Hesap ilkesi, o hesap için üst düzey kanal ilkesine göre önceliklidir.

<AccordionGroup>
  <Accordion title="Mention gating notes">
    - `mentionPatterns` büyük/küçük harfe duyarsız güvenli regex kalıplarıdır; geçersiz kalıplar ve güvenli olmayan iç içe tekrar biçimleri yok sayılır.
    - Açık bahsetmeler sağlayan yüzeyler yine geçer; yapılandırılmış regex kalıpları bir yedektir.
    - `channels.<channel>.mentionPatterns.mode: "deny"`, o kanal için yapılandırılmış bahsetme kalıplarını varsayılan olarak devre dışı bırakır; seçili konuşmaları `allowIn` ile yeniden dahil edin.
    - `channels.<channel>.mentionPatterns.denyIn`, belirli konuşma kimlikleri için yapılandırılmış bahsetme kalıplarını devre dışı bırakır; yerel platform @bahsetmeleri yine geçer.
    - Ajan başına geçersiz kılma: `agents.list[].groupChat.mentionPatterns` (birden fazla ajan aynı grubu paylaştığında yararlıdır).
    - Bahsetme denetimi yalnızca bahsetme algılama mümkün olduğunda uygulanır (yerel bahsetmeler veya `mentionPatterns` yapılandırılmıştır).
    - Bir grubu veya göndereni izin listesine almak bahsetme denetimini devre dışı bırakmaz; tüm mesajların tetiklemesi gerektiğinde o grubun `requireMention` değerini `false` olarak ayarlayın.
    - Otomatik grup sohbeti istem bağlamı, çözümlenen sessiz yanıt talimatını her tur taşır; çalışma alanı dosyaları `NO_REPLY` mekaniklerini çoğaltmamalıdır.
    - Otomatik sessiz yanıtlara izin verilen gruplar, temiz boş veya yalnızca akıl yürütme içeren model turlarını `NO_REPLY` ile eşdeğer biçimde sessiz kabul eder. Doğrudan sohbetler hiçbir zaman `NO_REPLY` yönergesi almaz ve yalnızca mesaj aracı kullanan grup yanıtları `message(action=send)` çağırmayarak sessiz kalır.
    - Ortamda her zaman açık grup sohbeti varsayılan olarak kullanıcı isteği semantiğini kullanır. Bunun yerine sessiz bağlam olarak göndermek için `messages.groupChat.unmentionedInbound: "room_event"` ayarlayın. Kurulum örnekleri için [Ortam oda olayları](/tr/channels/ambient-room-events) bölümüne bakın.
    - Oda olayları sahte kullanıcı istekleri olarak depolanmaz ve mesaj aracı olmayan oda olaylarından gelen özel asistan metni sohbet geçmişi olarak yeniden oynatılmaz.
    - Discord varsayılanları `channels.discord.guilds."*"` altında bulunur (lonca/kanal başına geçersiz kılınabilir).
    - Grup geçmişi bağlamı kanallar arasında tek tip sarmalanır. Bahsetme denetimli gruplar bekleyen atlanmış mesajları tutar; her zaman açık gruplar, kanal desteklediğinde yakın zamanda işlenmiş oda mesajlarını da saklayabilir. Genel varsayılan için `messages.groupChat.historyLimit`, geçersiz kılmalar için `channels.<channel>.historyLimit` (veya `channels.<channel>.accounts.*.historyLimit`) kullanın. Devre dışı bırakmak için `0` ayarlayın.

  </Accordion>
</AccordionGroup>

## Grup/kanal araç kısıtlamaları (isteğe bağlı)

Bazı kanal yapılandırmaları, **belirli bir grup/oda/kanal içinde** hangi araçların kullanılabileceğini kısıtlamayı destekler.

- `tools`: tüm grup için araçlara izin verin/reddedin.
- `toolsBySender`: grup içinde gönderen başına geçersiz kılmalar. Açık anahtar önekleri kullanın: `channel:<channelId>:<senderId>`, `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` ve `"*"` joker karakteri. Kanal kimlikleri kanonik OpenClaw kanal kimliklerini kullanır; `teams` gibi diğer adlar `msteams` değerine normalleştirilir. Eski öneksiz anahtarlar hâlâ kabul edilir ve yalnızca `id:` olarak eşleştirilir.

Çözümleme sırası (en özel olan kazanır):

<Steps>
  <Step title="Group toolsBySender">
    Grup/kanal `toolsBySender` eşleşmesi.
  </Step>
  <Step title="Group tools">
    Grup/kanal `tools`.
  </Step>
  <Step title="Default toolsBySender">
    Varsayılan (`"*"`) `toolsBySender` eşleşmesi.
  </Step>
  <Step title="Default tools">
    Varsayılan (`"*"`) `tools`.
  </Step>
</Steps>

Örnek (Telegram):

```json5
{
  channels: {
    telegram: {
      groups: {
        "*": { tools: { deny: ["exec"] } },
        "-1001234567890": {
          tools: { deny: ["exec", "read", "write"] },
          toolsBySender: {
            "id:123456789": { alsoAllow: ["exec"] },
          },
        },
      },
    },
  },
}
```

<Note>
Grup/kanal araç kısıtlamaları, küresel/ajan araç ilkesine ek olarak uygulanır (reddetme yine kazanır). Bazı kanallar odalar/kanallar için farklı iç içe yerleşim kullanır (ör. Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).
</Note>

## Grup izin listeleri

`channels.whatsapp.groups`, `channels.telegram.groups` veya `channels.imessage.groups` yapılandırıldığında, anahtarlar grup izin listesi işlevi görür. Varsayılan bahsetme davranışını yine ayarlarken tüm gruplara izin vermek için `"*"` kullanın.

<Warning>
Yaygın karışıklık: DM eşleştirme onayı, grup yetkilendirmesiyle aynı değildir. DM eşleştirmesini destekleyen kanallarda eşleştirme deposu yalnızca DM'lerin kilidini açar. Grup komutları yine de `groupAllowFrom` gibi yapılandırma izin listelerinden veya o kanal için belgelenmiş yapılandırma yedeğinden açık grup göndericisi yetkilendirmesi gerektirir.
</Warning>

Yaygın amaçlar (kopyala/yapıştır):

<Tabs>
  <Tab title="Tüm grup yanıtlarını devre dışı bırak">
    ```json5
    {
      channels: { whatsapp: { groupPolicy: "disabled" } },
    }
    ```
  </Tab>
  <Tab title="Yalnızca belirli gruplara izin ver (WhatsApp)">
    ```json5
    {
      channels: {
        whatsapp: {
          groups: {
            "123@g.us": { requireMention: true },
            "456@g.us": { requireMention: false },
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Tüm gruplara izin ver ancak bahsetmeyi zorunlu kıl">
    ```json5
    {
      channels: {
        whatsapp: {
          groups: { "*": { requireMention: true } },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Yalnızca sahip tetikleyicileri (WhatsApp)">
    ```json5
    {
      channels: {
        whatsapp: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15551234567"],
          groups: { "*": { requireMention: true } },
        },
      },
    }
    ```
  </Tab>
</Tabs>

## Etkinleştirme (yalnızca sahip)

Grup sahipleri grup başına etkinleştirmeyi açıp kapatabilir:

- `/activation mention`
- `/activation always`

Sahip, `channels.whatsapp.allowFrom` tarafından belirlenir (ayarlanmamışsa botun kendi E.164 numarası kullanılır). Komutu tek başına bir mesaj olarak gönderin. Diğer yüzeyler şu anda `/activation` öğesini yok sayar.

## Bağlam alanları

Gelen grup yükleri şunları ayarlar:

- `ChatType=group`
- `GroupSubject` (biliniyorsa)
- `GroupMembers` (biliniyorsa)
- `WasMentioned` (bahsetme kapısı sonucu)
- Telegram forum konuları ayrıca `MessageThreadId` ve `IsForum` içerir.

Agent sistem istemi, yeni bir grup oturumunun ilk turunda bir grup girişi içerir. Modele bir insan gibi yanıt vermesini, boş satırları en aza indirmesini ve normal sohbet aralığını izlemesini, ayrıca değişmez `\n` dizileri yazmaktan kaçınmasını hatırlatır. Telegram dışı gruplarda Markdown tabloları da önerilmez; Telegram zengin metin yönergeleri Telegram kanal isteminden gelir. Kanal kaynaklı grup adları ve katılımcı etiketleri, satır içi sistem talimatları olarak değil, kod çiti içindeki güvenilmeyen meta veri olarak işlenir.

## iMessage ayrıntıları

- Yönlendirme veya izin listesine alma sırasında `chat_id:<id>` tercih edin.
- Sohbetleri listele: `imsg chats --limit 20`.
- Grup yanıtları her zaman aynı `chat_id` öğesine geri gider.

## WhatsApp sistem istemleri

Grup ve doğrudan istem çözümlemesi, joker karakter davranışı ve hesap geçersiz kılma semantiği dahil olmak üzere kanonik WhatsApp sistem istemi kuralları için [WhatsApp](/tr/channels/whatsapp#system-prompts) bölümüne bakın.

## WhatsApp ayrıntıları

WhatsApp'a özgü davranış (geçmiş ekleme, bahsetme işleme ayrıntıları) için [Grup mesajları](/tr/channels/group-messages) bölümüne bakın.

## İlgili

- [Yayın grupları](/tr/channels/broadcast-groups)
- [Kanal yönlendirme](/tr/channels/channel-routing)
- [Grup mesajları](/tr/channels/group-messages)
- [Eşleştirme](/tr/channels/pairing)
