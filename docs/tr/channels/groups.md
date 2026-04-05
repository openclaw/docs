---
read_when:
    - Grup sohbeti davranışını veya mention geçitlemesini değiştirirken
summary: Yüzeyler genelinde grup sohbeti davranışı (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Gruplar
x-i18n:
    generated_at: "2026-04-05T13:43:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 39d066e0542b468c6f8b384b463e2316590ea09a00ecb2065053e1e2ce55bd5f
    source_path: channels/groups.md
    workflow: 15
---

# Gruplar

OpenClaw, Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp ve Zalo genelinde grup sohbetlerini tutarlı şekilde ele alır.

## Başlangıç düzeyi giriş (2 dakika)

OpenClaw, kendi mesajlaşma hesaplarınızda “yaşar”. Ayrı bir WhatsApp bot kullanıcısı yoktur.
**Siz** bir gruptaysanız, OpenClaw o grubu görebilir ve orada yanıt verebilir.

Varsayılan davranış:

- Gruplar kısıtlıdır (`groupPolicy: "allowlist"`).
- Yanıtlar, mention geçitlemesini açıkça devre dışı bırakmadığınız sürece bir mention gerektirir.

Çeviri: allowlist'e alınmış gönderenler OpenClaw'ı mention ederek tetikleyebilir.

> Özet
>
> - **DM erişimi** `*.allowFrom` ile kontrol edilir.
> - **Grup erişimi** `*.groupPolicy` + allowlist'ler (`*.groups`, `*.groupAllowFrom`) ile kontrol edilir.
> - **Yanıt tetikleme** mention geçitlemesi (`requireMention`, `/activation`) ile kontrol edilir.

Hızlı akış (bir grup mesajına ne olur):

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> yalnızca bağlam için sakla
aksi halde -> yanıt ver
```

## Bağlam görünürlüğü ve allowlist'ler

Grup güvenliğinde iki farklı kontrol yer alır:

- **Tetikleme yetkilendirmesi**: ajanı kimin tetikleyebileceği (`groupPolicy`, `groups`, `groupAllowFrom`, kanala özel allowlist'ler).
- **Bağlam görünürlüğü**: modele hangi ek bağlamın enjekte edildiği (yanıt metni, alıntılar, iş parçacığı geçmişi, iletilen meta veriler).

Varsayılan olarak OpenClaw, normal sohbet davranışına öncelik verir ve bağlamı çoğunlukla alındığı haliyle tutar. Bu, allowlist'lerin öncelikle kimin eylemleri tetikleyebileceğini belirlediği, alıntılanan veya geçmişten gelen her parçacık için evrensel bir redaksiyon sınırı olmadığı anlamına gelir.

Geçerli davranış kanala özeldir:

- Bazı kanallar belirli yollarda ek bağlam için zaten gönderici tabanlı filtreleme uygular (örneğin Slack iş parçacığı tohumlama, Matrix yanıt/iş parçacığı aramaları).
- Diğer kanallar ise alıntı/yanıt/iletme bağlamını alındığı haliyle geçirmeye devam eder.

Sağlamlaştırma yönü (planlandı):

- `contextVisibility: "all"` (varsayılan) mevcut alındığı haliyle davranışı korur.
- `contextVisibility: "allowlist"` ek bağlamı allowlist'teki göndericilerle sınırlar.
- `contextVisibility: "allowlist_quote"` ise `allowlist` davranışına ek olarak tek bir açık alıntı/yanıt istisnası sunar.

Bu sağlamlaştırma modeli tüm kanallarda tutarlı şekilde uygulanana kadar, yüzeyler arasında farklılıklar bekleyin.

![Grup mesajı akışı](/images/groups-flow.svg)

İstediğiniz şey...

| Hedef                                        | Ayarlanacak değer                                         |
| -------------------------------------------- | --------------------------------------------------------- |
| Tüm gruplara izin ver ama yalnızca @mention ile yanıtla | `groups: { "*": { requireMention: true } }`               |
| Tüm grup yanıtlarını devre dışı bırak        | `groupPolicy: "disabled"`                                 |
| Yalnızca belirli gruplar                     | `groups: { "<group-id>": { ... } }` (`"*"` anahtarı olmadan) |
| Gruplarda yalnızca siz tetikleyebilin        | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |

## Oturum anahtarları

- Grup oturumları `agent:<agentId>:<channel>:group:<id>` oturum anahtarlarını kullanır (oda/kanallar `agent:<agentId>:<channel>:channel:<id>` kullanır).
- Telegram forum konuları, her konunun kendi oturumu olması için grup kimliğine `:topic:<threadId>` ekler.
- Doğrudan sohbetler ana oturumu kullanır (veya yapılandırıldıysa gönderen başına bir oturum kullanır).
- Heartbeat, grup oturumları için atlanır.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Desen: kişisel DM'ler + herkese açık gruplar (tek ajan)

Evet — “kişisel” trafiğiniz **DM'ler**, “herkese açık” trafiğiniz ise **gruplar** ise bu iyi çalışır.

Neden: tek ajan modunda, DM'ler genellikle **ana** oturum anahtarına (`agent:main:main`) giderken gruplar her zaman **ana olmayan** oturum anahtarlarını kullanır (`agent:main:<channel>:group:<id>`). `mode: "non-main"` ile sandboxing'i etkinleştirirseniz, bu grup oturumları Docker içinde çalışırken ana DM oturumunuz ana makinede kalır.

Bu size tek bir ajan “beyni” (paylaşılan çalışma alanı + bellek) verir, ancak iki yürütme duruşu sağlar:

- **DM'ler**: tam araçlar (ana makine)
- **Gruplar**: sandbox + kısıtlı araçlar (Docker)

> Gerçekten ayrı çalışma alanlarına/kişiliklere ihtiyacınız varsa (“kişisel” ve “herkese açık” asla karışmamalıysa), ikinci bir ajan + bindings kullanın. Bkz. [Çoklu Ajan Yönlendirme](/concepts/multi-agent).

Örnek (DM'ler ana makinede, gruplar sandbox içinde + yalnızca mesajlaşma araçları):

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

“Gruplar yalnızca X klasörünü görebilsin” istiyorsanız, “ana makine erişimi olmasın” yerine `workspaceAccess: "none"` değerini koruyun ve yalnızca allowlist'teki yolları sandbox içine bağlayın:

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

İlgili:

- Yapılandırma anahtarları ve varsayılanlar: [Gateway yapılandırması](/gateway/configuration-reference#agentsdefaultssandbox)
- Bir aracın neden engellendiğini ayıklama: [Sandbox vs Tool Policy vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated)
- Bind mount ayrıntıları: [Sandboxing](/gateway/sandboxing#custom-bind-mounts)

## Görünen etiketler

- UI etiketleri, mevcutsa `displayName` kullanır ve `<channel>:<token>` biçiminde gösterilir.
- `#room` odalar/kanallar için ayrılmıştır; grup sohbetleri `g-<slug>` kullanır (küçük harf, boşluklar -> `-`, `#@+._-` korunur).

## Grup ilkesi

Grup/oda mesajlarının kanal başına nasıl işleneceğini kontrol edin:

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
        "!roomId:example.org": { allow: true },
        "#alias:example.org": { allow: true },
      },
    },
  },
}
```

| İlke           | Davranış                                                     |
| -------------- | ------------------------------------------------------------ |
| `"open"`       | Gruplar allowlist'leri atlar; mention geçitlemesi yine de uygulanır. |
| `"disabled"`   | Tüm grup mesajlarını tamamen engeller.                       |
| `"allowlist"`  | Yalnızca yapılandırılmış allowlist ile eşleşen gruplara/odalara izin verir. |

Notlar:

- `groupPolicy`, mention geçitlemesinden ayrıdır (bu, @mention gerektirir).
- WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: `groupAllowFrom` kullanır (yedek: açık `allowFrom`).
- DM eşleştirme onayları (`*-allowFrom` store girdileri) yalnızca DM erişimi için geçerlidir; grup gönderen yetkilendirmesi açık grup allowlist'lerinde kalır.
- Discord: allowlist `channels.discord.guilds.<id>.channels` kullanır.
- Slack: allowlist `channels.slack.channels` kullanır.
- Matrix: allowlist `channels.matrix.groups` kullanır. Oda kimliklerini veya takma adları tercih edin; katılınmış oda adı araması en iyi çabadır ve çözümlenemeyen adlar çalışma zamanında yok sayılır. Gönderenleri kısıtlamak için `channels.matrix.groupAllowFrom` kullanın; oda başına `users` allowlist'leri de desteklenir.
- Grup DM'leri ayrı olarak kontrol edilir (`channels.discord.dm.*`, `channels.slack.dm.*`).
- Telegram allowlist, kullanıcı kimlikleriyle (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) veya kullanıcı adlarıyla (`"@alice"` ya da `"alice"`) eşleşebilir; önekler büyük/küçük harfe duyarlı değildir.
- Varsayılan `groupPolicy: "allowlist"` değeridir; grup allowlist'iniz boşsa grup mesajları engellenir.
- Çalışma zamanı güvenliği: bir sağlayıcı bloğu tamamen eksik olduğunda (`channels.<provider>` yoksa), grup ilkesi `channels.defaults.groupPolicy` değerini devralmak yerine fail-closed bir moda (genellikle `allowlist`) geri döner.

Hızlı zihinsel model (grup mesajları için değerlendirme sırası):

1. `groupPolicy` (open/disabled/allowlist)
2. grup allowlist'leri (`*.groups`, `*.groupAllowFrom`, kanala özel allowlist)
3. mention geçitlemesi (`requireMention`, `/activation`)

## Mention geçitlemesi (varsayılan)

Grup mesajları, grup başına geçersiz kılınmadıkça bir mention gerektirir. Varsayılanlar alt sistem başına `*.groups."*"` altında bulunur.

Bir bot mesajına yanıt vermek, örtük bir mention sayılır (kanal yanıt meta verilerini destekliyorsa). Bu Telegram, WhatsApp, Slack, Discord ve Microsoft Teams için geçerlidir.

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

Notlar:

- `mentionPatterns`, büyük/küçük harfe duyarsız güvenli regex kalıplarıdır; geçersiz kalıplar ve güvensiz iç içe tekrar biçimleri yok sayılır.
- Açık mention sağlayan yüzeyler yine geçer; kalıplar bir yedektir.
- Ajan başına geçersiz kılma: `agents.list[].groupChat.mentionPatterns` (birden fazla ajan aynı grubu paylaştığında yararlıdır).
- Mention geçitlemesi yalnızca mention algılaması mümkün olduğunda uygulanır (yerel mention'lar veya `mentionPatterns` yapılandırılmışsa).
- Discord varsayılanları `channels.discord.guilds."*"` altında bulunur (sunucu/kanal başına geçersiz kılınabilir).
- Grup geçmişi bağlamı kanallar arasında tek tip sarılır ve **yalnızca bekleyen** mesajları içerir (mention geçitlemesi nedeniyle atlanan mesajlar); genel varsayılan için `messages.groupChat.historyLimit`, geçersiz kılmalar için `channels.<channel>.historyLimit` (veya `channels.<channel>.accounts.*.historyLimit`) kullanın. Devre dışı bırakmak için `0` ayarlayın.

## Grup/kanal araç kısıtlamaları (isteğe bağlı)

Bazı kanal yapılandırmaları, **belirli bir grup/oda/kanal içinde** hangi araçların kullanılabildiğini kısıtlamayı destekler.

- `tools`: tüm grup için araçlara izin ver veya reddet.
- `toolsBySender`: grup içindeki gönderen bazlı geçersiz kılmalar.
  Açık anahtar önekleri kullanın:
  `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` ve `"*"` jokeri.
  Eski öneksiz anahtarlar da hâlâ kabul edilir ve yalnızca `id:` olarak eşleştirilir.

Çözümleme sırası (en spesifik olan kazanır):

1. grup/kanal `toolsBySender` eşleşmesi
2. grup/kanal `tools`
3. varsayılan (`"*"` ) `toolsBySender` eşleşmesi
4. varsayılan (`"*"` ) `tools`

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

Notlar:

- Grup/kanal araç kısıtlamaları, genel/ajan araç ilkesine ek olarak uygulanır (deny yine kazanır).
- Bazı kanallar oda/kanallar için farklı iç içe yapı kullanır (ör. Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).

## Grup allowlist'leri

`channels.whatsapp.groups`, `channels.telegram.groups` veya `channels.imessage.groups` yapılandırıldığında, anahtarlar grup allowlist'i işlevi görür. Varsayılan mention davranışını yine de ayarlarken tüm gruplara izin vermek için `"*"` kullanın.

Yaygın karışıklık: DM eşleştirme onayı, grup yetkilendirmesi ile aynı şey değildir.
DM eşleştirmeyi destekleyen kanallarda, eşleştirme deposu yalnızca DM'lerin kilidini açar. Grup komutları ise hâlâ `groupAllowFrom` gibi yapılandırma allowlist'lerinden veya o kanal için belgelenmiş yapılandırma yedeğinden açık grup gönderen yetkilendirmesi gerektirir.

Yaygın amaçlar (kopyala/yapıştır):

1. Tüm grup yanıtlarını devre dışı bırak

```json5
{
  channels: { whatsapp: { groupPolicy: "disabled" } },
}
```

2. Yalnızca belirli gruplara izin ver (WhatsApp)

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

3. Tüm gruplara izin ver ama mention gerektir (açık)

```json5
{
  channels: {
    whatsapp: {
      groups: { "*": { requireMention: true } },
    },
  },
}
```

4. Gruplarda yalnızca sahip tetikleyebilsin (WhatsApp)

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

## Activation (yalnızca sahip)

Grup sahipleri, grup başına activation durumunu değiştirebilir:

- `/activation mention`
- `/activation always`

Sahip, `channels.whatsapp.allowFrom` ile belirlenir (ayarlanmamışsa botun kendi E.164 değeri kullanılır). Komutu bağımsız bir mesaj olarak gönderin. Diğer yüzeyler şu anda `/activation` komutunu yok sayar.

## Bağlam alanları

Grup gelen yükleri şunları ayarlar:

- `ChatType=group`
- `GroupSubject` (biliniyorsa)
- `GroupMembers` (biliniyorsa)
- `WasMentioned` (mention geçitlemesi sonucu)
- Telegram forum konuları ayrıca `MessageThreadId` ve `IsForum` içerir.

Kanala özel notlar:

- BlueBubbles, adsız macOS grup katılımcılarını `GroupMembers` alanını doldurmadan önce isteğe bağlı olarak yerel Contacts veritabanından zenginleştirebilir. Bu varsayılan olarak kapalıdır ve yalnızca normal grup geçitlemesi başarıyla geçildikten sonra çalışır.

Ajan sistem istemi, yeni bir grup oturumunun ilk turunda grup girişi içerir. Modele bir insan gibi yanıt vermesini, Markdown tablolarından kaçınmasını ve doğrudan `\n` dizilerini yazmamasını hatırlatır.

## iMessage ayrıntıları

- Yönlendirme veya allowlist için `chat_id:<id>` tercih edin.
- Sohbetleri listeleyin: `imsg chats --limit 20`.
- Grup yanıtları her zaman aynı `chat_id` değerine geri gider.

## WhatsApp ayrıntıları

Yalnızca WhatsApp davranışı için [Grup mesajları](/channels/group-messages) bölümüne bakın (geçmiş enjeksiyonu, mention işleme ayrıntıları).
