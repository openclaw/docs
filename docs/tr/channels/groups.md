---
read_when:
    - Grup sohbeti davranışını veya bahsetme sınırlamasını değiştirme
sidebarTitle: Groups
summary: Yüzeyler arasında grup sohbeti davranışı (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Gruplar
x-i18n:
    generated_at: "2026-04-26T11:23:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 837055b3cd044ebe3ef9aefe29e36f6471f48025d32169c43b9c5b04a8ac639c
    source_path: channels/groups.md
    workflow: 15
---

OpenClaw, grup sohbetlerini yüzeyler arasında tutarlı şekilde ele alır: Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo.

## Başlangıç düzeyi giriş (2 dakika)

OpenClaw, kendi mesajlaşma hesaplarınızda "yaşar". Ayrı bir WhatsApp bot kullanıcısı yoktur. **Siz** bir gruptaysanız, OpenClaw o grubu görebilir ve orada yanıt verebilir.

Varsayılan davranış:

- Gruplar kısıtlıdır (`groupPolicy: "allowlist"`).
- Bahsetme sınırlamasını açıkça devre dışı bırakmadığınız sürece yanıtlar bir bahsetme gerektirir.

Çevirisi: izin verilen gönderenler, OpenClaw'u ondan bahsederek tetikleyebilir.

<Note>
**Kısaca**

- **DM erişimi** `*.allowFrom` tarafından kontrol edilir.
- **Grup erişimi** `*.groupPolicy` + izin listeleri (`*.groups`, `*.groupAllowFrom`) tarafından kontrol edilir.
- **Yanıt tetikleme** bahsetme sınırlaması (`requireMention`, `/activation`) tarafından kontrol edilir.

</Note>

Hızlı akış (bir grup mesajına ne olur):

```
groupPolicy? disabled -> bırak
groupPolicy? allowlist -> group allowed? no -> bırak
requireMention? yes -> mentioned? no -> yalnızca bağlam için sakla
otherwise -> yanıt ver
```

## Bağlam görünürlüğü ve izin listeleri

Grup güvenliğinde iki farklı kontrol söz konusudur:

- **Tetikleme yetkilendirmesi**: ajanı kimin tetikleyebileceği (`groupPolicy`, `groups`, `groupAllowFrom`, kanala özgü izin listeleri).
- **Bağlam görünürlüğü**: modele hangi ek bağlamın enjekte edildiği (yanıt metni, alıntılar, konu geçmişi, iletilen meta veriler).

Varsayılan olarak OpenClaw, normal sohbet davranışına öncelik verir ve bağlamı çoğunlukla alındığı şekilde tutar. Bu, izin listelerinin öncelikle eylemleri kimin tetikleyebileceğine karar verdiği, ancak alıntılanmış veya geçmişe ait her parçacık için evrensel bir sansür sınırı olmadığı anlamına gelir.

<AccordionGroup>
  <Accordion title="Mevcut davranış kanala özeldir">
    - Bazı kanallar, belirli yollarda ek bağlam için zaten gönderici tabanlı filtreleme uygular (örneğin Slack konu başlangıcı, Matrix yanıt/konu aramaları).
    - Diğer kanallar ise alıntı/yanıt/iletme bağlamını alındığı gibi aktarmaya devam eder.

  </Accordion>
  <Accordion title="Sıkılaştırma yönü (planlandı)">
    - `contextVisibility: "all"` (varsayılan), mevcut alındığı gibi davranışı korur.
    - `contextVisibility: "allowlist"` ek bağlamı izin verilen gönderenlerle sınırlar.
    - `contextVisibility: "allowlist_quote"` ise `allowlist` artı tek bir açık alıntı/yanıt istisnasıdır.

    Bu sıkılaştırma modeli kanallar arasında tutarlı şekilde uygulanana kadar, yüzeye göre farklılıklar bekleyin.

  </Accordion>
</AccordionGroup>

![Grup mesajı akışı](/images/groups-flow.svg)

İstediğiniz şey...

| Hedef                                        | Ayarlanacak değer                                        |
| -------------------------------------------- | -------------------------------------------------------- |
| Tüm gruplara izin ver ama yalnızca @mention ile yanıt ver | `groups: { "*": { requireMention: true } }`     |
| Tüm grup yanıtlarını devre dışı bırak        | `groupPolicy: "disabled"`                                |
| Yalnızca belirli gruplar                     | `groups: { "<group-id>": { ... } }` (`"*"` anahtarı olmadan) |
| Gruplarda yalnızca siz tetikleyebilin        | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |

## Oturum anahtarları

- Grup oturumları `agent:<agentId>:<channel>:group:<id>` oturum anahtarlarını kullanır (oda/kanallar `agent:<agentId>:<channel>:channel:<id>` kullanır).
- Telegram forum başlıkları, her başlığın kendi oturumu olması için grup kimliğine `:topic:<threadId>` ekler.
- Doğrudan sohbetler ana oturumu kullanır (veya yapılandırılmışsa gönderici başına oturum).
- Heartbeat, grup oturumları için atlanır.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Kalıp: kişisel DM'ler + herkese açık gruplar (tek ajan)

Evet — "kişisel" trafiğiniz **DM'ler**, "herkese açık" trafiğiniz ise **gruplar** ise bu iyi çalışır.

Nedeni: tek ajan modunda, DM'ler genellikle **ana** oturum anahtarına (`agent:main:main`) düşerken, gruplar her zaman **ana olmayan** oturum anahtarlarını kullanır (`agent:main:<channel>:group:<id>`). `mode: "non-main"` ile sandbox etkinleştirirseniz, bu grup oturumları yapılandırılan sandbox arka ucunda çalışırken ana DM oturumunuz host üzerinde kalır. Bir arka uç seçmezseniz varsayılan Docker kullanılır.

Bu size tek bir ajan "beyni" (paylaşılan çalışma alanı + bellek) verir, ancak iki yürütme duruşu sağlar:

- **DM'ler**: tam araçlar (host)
- **Gruplar**: sandbox + kısıtlı araçlar

<Note>
Gerçekten ayrı çalışma alanlarına/kişiliklere ihtiyacınız varsa ("kişisel" ve "herkese açık" trafik asla karışmamalıysa), ikinci bir ajan + bindings kullanın. Bkz. [Çoklu Ajan Yönlendirme](/tr/concepts/multi-agent).
</Note>

<Tabs>
  <Tab title="DM'ler host üzerinde, gruplar sandbox içinde">
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
  <Tab title="Gruplar yalnızca izin verilen bir klasörü görsün">
    "Host erişimi olmasın" yerine "gruplar yalnızca X klasörünü görebilsin" mi istiyorsunuz? `workspaceAccess: "none"` değerini koruyun ve yalnızca izin verilen yolları sandbox içine bağlayın:

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
- Bir aracın neden engellendiğini hata ayıklama: [Sandbox vs Tool Policy vs Elevated](/tr/gateway/sandbox-vs-tool-policy-vs-elevated)
- Bind mount ayrıntıları: [Sandboxing](/tr/gateway/sandboxing#custom-bind-mounts)

## Görünen etiketler

- Kullanıcı arayüzü etiketleri, mevcutsa `displayName` kullanır ve `<channel>:<token>` biçiminde gösterilir.
- `#room`, odalar/kanallar için ayrılmıştır; grup sohbetleri `g-<slug>` kullanır (küçük harf, boşluklar `-` olur, `#@+._-` korunur).

## Grup politikası

Grup/oda mesajlarının kanal başına nasıl ele alınacağını kontrol edin:

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

| Politika      | Davranış                                                     |
| ------------- | ------------------------------------------------------------ |
| `"open"`      | Gruplar izin listelerini atlar; bahsetme sınırlaması yine de geçerlidir. |
| `"disabled"`  | Tüm grup mesajlarını tamamen engeller.                       |
| `"allowlist"` | Yalnızca yapılandırılmış izin listesiyle eşleşen gruplara/odalara izin verir. |

<AccordionGroup>
  <Accordion title="Kanala özgü notlar">
    - `groupPolicy`, bahsetme sınırlamasından ayrıdır (bu özellik @mention gerektirir).
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: `groupAllowFrom` kullanın (yedek: açık `allowFrom`).
    - DM eşleştirme onayları (`*-allowFrom` mağaza girdileri) yalnızca DM erişimi için geçerlidir; grup gönderici yetkilendirmesi açık grup izin listelerine bağlı kalır.
    - Discord: izin listesi `channels.discord.guilds.<id>.channels` kullanır.
    - Slack: izin listesi `channels.slack.channels` kullanır.
    - Matrix: izin listesi `channels.matrix.groups` kullanır. Oda kimliklerini veya takma adları tercih edin; katılınan oda adı araması en iyi çaba esasına dayanır ve çözülemeyen adlar çalışma zamanında yok sayılır. Gönderenleri kısıtlamak için `channels.matrix.groupAllowFrom` kullanın; oda başına `users` izin listeleri de desteklenir.
    - Grup DM'leri ayrı olarak kontrol edilir (`channels.discord.dm.*`, `channels.slack.dm.*`).
    - Telegram izin listesi kullanıcı kimlikleriyle (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) veya kullanıcı adlarıyla (`"@alice"` ya da `"alice"`) eşleşebilir; önekler büyük/küçük harfe duyarsızdır.
    - Varsayılan `groupPolicy: "allowlist"` değeridir; grup izin listeniz boşsa grup mesajları engellenir.
    - Çalışma zamanı güvenliği: bir sağlayıcı bloğu tamamen yoksa (`channels.<provider>` yoksa), grup politikası `channels.defaults.groupPolicy` değerini devralmak yerine başarısız olduğunda kapalı moda (genellikle `allowlist`) geri döner.

  </Accordion>
</AccordionGroup>

Hızlı zihinsel model (grup mesajları için değerlendirme sırası):

<Steps>
  <Step title="groupPolicy">
    `groupPolicy` (open/disabled/allowlist).
  </Step>
  <Step title="Grup izin listeleri">
    Grup izin listeleri (`*.groups`, `*.groupAllowFrom`, kanala özgü izin listesi).
  </Step>
  <Step title="Bahsetme sınırlaması">
    Bahsetme sınırlaması (`requireMention`, `/activation`).
  </Step>
</Steps>

## Bahsetme sınırlaması (varsayılan)

Aksi grup başına geçersiz kılınmadıkça grup mesajları bir bahsetme gerektirir. Varsayılanlar, her alt sistem altında `*.groups."*"` içinde yer alır.

Bir bot mesajına yanıt vermek, kanal yanıt meta verilerini destekliyorsa örtük bir bahsetme sayılır. Bir bot mesajını alıntılamak da, alıntı meta verilerini sunan kanallarda örtük bir bahsetme sayılabilir. Mevcut yerleşik örnekler arasında Telegram, WhatsApp, Slack, Discord, Microsoft Teams ve ZaloUser bulunur.

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

<AccordionGroup>
  <Accordion title="Bahsetme sınırlaması notları">
    - `mentionPatterns`, büyük/küçük harfe duyarsız güvenli regex kalıplarıdır; geçersiz kalıplar ve güvenli olmayan iç içe tekrar biçimleri yok sayılır.
    - Açık bahsetme sağlayan yüzeyler yine de geçer; kalıplar yedektir.
    - Ajan başına geçersiz kılma: `agents.list[].groupChat.mentionPatterns` (birden fazla ajan aynı grubu paylaştığında yararlıdır).
    - Bahsetme sınırlaması yalnızca bahsetme algılaması mümkün olduğunda uygulanır (yerel bahsetmeler veya `mentionPatterns` yapılandırılmışsa).
    - Sessiz yanıta izin verilen gruplar, temiz boş veya yalnızca akıl yürütme içeren model dönüşlerini `NO_REPLY` ile eşdeğer şekilde sessiz kabul eder. Doğrudan sohbetler ise boş yanıtları yine başarısız bir ajan dönüşü olarak ele alır.
    - Discord varsayılanları `channels.discord.guilds."*"` içinde bulunur (guild/kanal başına geçersiz kılınabilir).
    - Grup geçmişi bağlamı kanallar arasında tutarlı şekilde sarmalanır ve **yalnızca beklemedeki** durumlar içindir (bahsetme sınırlaması nedeniyle atlanan mesajlar); genel varsayılan için `messages.groupChat.historyLimit`, geçersiz kılmalar için `channels.<channel>.historyLimit` (veya `channels.<channel>.accounts.*.historyLimit`) kullanın. Devre dışı bırakmak için `0` ayarlayın.

  </Accordion>
</AccordionGroup>

## Grup/kanal araç kısıtlamaları (isteğe bağlı)

Bazı kanal yapılandırmaları, **belirli bir grup/oda/kanal içinde** hangi araçların kullanılabildiğini kısıtlamayı destekler.

- `tools`: tüm grup için araçlara izin verin/engelleyin.
- `toolsBySender`: grup içindeki gönderici başına geçersiz kılmalar. Açık anahtar önekleri kullanın: `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` ve `"*"` joker karakteri. Eski öneksiz anahtarlar hâlâ kabul edilir ve yalnızca `id:` olarak eşleştirilir.

Çözümleme sırası (en spesifik olan kazanır):

<Steps>
  <Step title="Grup toolsBySender">
    Grup/kanal `toolsBySender` eşleşmesi.
  </Step>
  <Step title="Grup tools">
    Grup/kanal `tools`.
  </Step>
  <Step title="Varsayılan toolsBySender">
    Varsayılan (`"*"`) `toolsBySender` eşleşmesi.
  </Step>
  <Step title="Varsayılan tools">
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
Grup/kanal araç kısıtlamaları, genel/ajan araç politikasına ek olarak uygulanır (engel yine kazanır). Bazı kanallar odalar/kanallar için farklı iç içe yerleşimler kullanır (ör. Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).
</Note>

## Grup izin listeleri

`channels.whatsapp.groups`, `channels.telegram.groups` veya `channels.imessage.groups` yapılandırıldığında, anahtarlar grup izin listesi işlevi görür. Tüm gruplara izin verirken varsayılan bahsetme davranışını ayarlamaya devam etmek için `"*"` kullanın.

<Warning>
Yaygın karışıklık: DM eşleştirme onayı, grup yetkilendirmesi ile aynı şey değildir. DM eşleştirmesini destekleyen kanallarda eşleştirme deposu yalnızca DM'lerin kilidini açar. Grup komutları için yine de `groupAllowFrom` gibi yapılandırma izin listelerinden veya o kanal için belgelenmiş yapılandırma yedeğinden açık grup gönderici yetkilendirmesi gerekir.
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
  <Tab title="Tüm gruplara izin ver ama bahsetme zorunlu olsun">
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
  <Tab title="Yalnızca sahip tetikleyebilsin (WhatsApp)">
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

## Activation (yalnızca sahip)

Grup sahipleri, grup başına etkinleştirmeyi değiştirebilir:

- `/activation mention`
- `/activation always`

Sahip, `channels.whatsapp.allowFrom` ile belirlenir (ayarlanmamışsa botun kendi E.164 değeri kullanılır). Komutu bağımsız bir mesaj olarak gönderin. Diğer yüzeyler şu anda `/activation` komutunu yok sayar.

## Bağlam alanları

Grup gelen yükleri şunları ayarlar:

- `ChatType=group`
- `GroupSubject` (biliniyorsa)
- `GroupMembers` (biliniyorsa)
- `WasMentioned` (bahsetme sınırlaması sonucu)
- Telegram forum başlıkları ayrıca `MessageThreadId` ve `IsForum` içerir.

Kanala özgü notlar:

- BlueBubbles, adsız macOS grup katılımcılarını `GroupMembers` doldurulmadan önce isteğe bağlı olarak yerel Contacts veritabanından zenginleştirebilir. Bu varsayılan olarak kapalıdır ve yalnızca normal grup sınırlaması geçildikten sonra çalışır.

Ajan sistem istemi, yeni bir grup oturumunun ilk dönüşünde bir grup girişi içerir. Bu giriş, modele bir insan gibi yanıt vermesini, Markdown tablolarından kaçınmasını, boş satırları en aza indirmesini, normal sohbet aralığını takip etmesini ve düz `\n` dizilerini yazmaktan kaçınmasını hatırlatır. Kanal kaynaklı grup adları ve katılımcı etiketleri, satır içi sistem talimatları olarak değil, çitlenmiş güvenilmeyen meta veriler olarak işlenir.

## iMessage ayrıntıları

- Yönlendirme veya izin listesi için `chat_id:<id>` tercih edin.
- Sohbetleri listeleyin: `imsg chats --limit 20`.
- Grup yanıtları her zaman aynı `chat_id` değerine geri gider.

## WhatsApp sistem istemleri

Grup ve doğrudan istem çözümleme, joker karakter davranışı ve hesap geçersiz kılma semantiği dahil olmak üzere kurallı WhatsApp sistem istemi kuralları için bkz. [WhatsApp](/tr/channels/whatsapp#system-prompts).

## WhatsApp ayrıntıları

Yalnızca WhatsApp davranışı için (geçmiş ekleme, bahsetme işleme ayrıntıları) bkz. [Grup mesajları](/tr/channels/group-messages).

## İlgili

- [Yayın grupları](/tr/channels/broadcast-groups)
- [Kanal yönlendirme](/tr/channels/channel-routing)
- [Grup mesajları](/tr/channels/group-messages)
- [Eşleştirme](/tr/channels/pairing)
