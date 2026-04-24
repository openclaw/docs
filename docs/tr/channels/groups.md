---
read_when:
    - Grup sohbeti davranışını veya bahsetme geçidini değiştirme
summary: Yüzeyler genelinde grup sohbeti davranışı (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Gruplar
x-i18n:
    generated_at: "2026-04-24T08:58:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: c014d6e08649c8dfd221640435b1d5cf93758bf10b4b6c1a536532e07f622d7b
    source_path: channels/groups.md
    workflow: 15
---

OpenClaw, grup sohbetlerini yüzeyler arasında tutarlı şekilde ele alır: Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo.

## Başlangıç düzeyi giriş (2 dakika)

OpenClaw, kendi mesajlaşma hesaplarınız üzerinde “yaşar”. Ayrı bir WhatsApp bot kullanıcısı yoktur.
**Siz** bir gruptaysanız, OpenClaw o grubu görebilir ve orada yanıt verebilir.

Varsayılan davranış:

- Gruplar kısıtlıdır (`groupPolicy: "allowlist"`).
- Siz açıkça bahsetme geçidini devre dışı bırakmadıkça, yanıtlar için bahsetme gerekir.

Çeviri: izin verilen gönderenler, OpenClaw'ı ondan bahsederek tetikleyebilir.

> Kısaca
>
> - **DM erişimi** `*.allowFrom` ile kontrol edilir.
> - **Grup erişimi** `*.groupPolicy` + izin listeleri (`*.groups`, `*.groupAllowFrom`) ile kontrol edilir.
> - **Yanıt tetikleme** bahsetme geçidi (`requireMention`, `/activation`) ile kontrol edilir.

Hızlı akış (bir grup mesajına ne olur):

```
groupPolicy? disabled -> bırak
groupPolicy? allowlist -> gruba izin var mı? hayır -> bırak
requireMention? evet -> bahsedildi mi? hayır -> yalnızca bağlam için sakla
aksi halde -> yanıt ver
```

## Bağlam görünürlüğü ve izin listeleri

Grup güvenliğinde iki farklı kontrol yer alır:

- **Tetikleme yetkilendirmesi**: ajanı kimin tetikleyebileceği (`groupPolicy`, `groups`, `groupAllowFrom`, kanala özgü izin listeleri).
- **Bağlam görünürlüğü**: modele hangi ek bağlamın enjekte edildiği (yanıt metni, alıntılar, iş parçacığı geçmişi, iletilen meta veriler).

Varsayılan olarak OpenClaw, normal sohbet davranışına öncelik verir ve bağlamı çoğunlukla alındığı gibi tutar. Bu, izin listelerinin esas olarak eylemleri kimin tetikleyebileceğini belirlediği, alıntılanmış veya geçmişe ait her parçacık için evrensel bir redaksiyon sınırı olmadığı anlamına gelir.

Geçerli davranış kanala özeldir:

- Bazı kanallar, belirli yollarda ek bağlam için zaten gönderici tabanlı filtreleme uygular (örneğin Slack iş parçacığı başlangıç bağlamı, Matrix yanıt/iş parçacığı aramaları).
- Diğer kanallar ise alıntı/yanıt/iletme bağlamını alındığı gibi geçirmeye devam eder.

Sıkılaştırma yönü (planlanan):

- `contextVisibility: "all"` (varsayılan) mevcut alındığı gibi davranışı korur.
- `contextVisibility: "allowlist"` ek bağlamı izin verilen gönderenlerle sınırlar.
- `contextVisibility: "allowlist_quote"` ise `allowlist` davranışına ek olarak tek bir açık alıntı/yanıt istisnası sunar.

Bu sıkılaştırma modeli kanallar arasında tutarlı şekilde uygulanana kadar, yüzeyler arasında farklılıklar bekleyin.

![Grup mesajı akışı](/images/groups-flow.svg)

İstiyorsanız...

| Hedef                                        | Ayarlanacak değer                                           |
| -------------------------------------------- | ----------------------------------------------------------- |
| Tüm gruplara izin ver ama yalnızca @bahsetmelerde yanıt ver | `groups: { "*": { requireMention: true } }`     |
| Tüm grup yanıtlarını devre dışı bırak        | `groupPolicy: "disabled"`                                   |
| Yalnızca belirli gruplar                     | `groups: { "<group-id>": { ... } }` (`"*"` anahtarı olmadan) |
| Gruplarda yalnızca siz tetikleyebilin        | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]`  |

## Oturum anahtarları

- Grup oturumları `agent:<agentId>:<channel>:group:<id>` oturum anahtarlarını kullanır (oda/kanal için `agent:<agentId>:<channel>:channel:<id>` kullanılır).
- Telegram forum konuları grup kimliğine `:topic:<threadId>` ekler; böylece her konunun kendi oturumu olur.
- Doğrudan sohbetler ana oturumu kullanır (veya yapılandırılmışsa gönderici başına oturum kullanır).
- Grup oturumları için Heartbeat atlanır.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Düzen: kişisel DM'ler + herkese açık gruplar (tek ajan)

Evet — “kişisel” trafiğiniz **DM'ler**, “herkese açık” trafiğiniz ise **gruplar** ise bu iyi çalışır.

Neden: tek ajan modunda, DM'ler genellikle **ana** oturum anahtarına (`agent:main:main`) giderken gruplar her zaman **ana olmayan** oturum anahtarlarını kullanır (`agent:main:<channel>:group:<id>`). `mode: "non-main"` ile sandbox etkinleştirirseniz, bu grup oturumları yapılandırılmış sandbox arka ucunda çalışırken ana DM oturumunuz ana makinede kalır. Bir arka uç seçmezseniz varsayılan arka uç Docker olur.

Bu, size tek bir ajan “beyni” (paylaşılan çalışma alanı + bellek) ama iki ayrı yürütme duruşu verir:

- **DM'ler**: tam araçlar (ana makine)
- **Gruplar**: sandbox + kısıtlı araçlar

> Gerçekten ayrı çalışma alanları/kişilikler gerekiyorsa (“kişisel” ve “herkese açık” asla karışmamalıysa), ikinci bir ajan + bindings kullanın. Bkz. [Çok Ajanlı Yönlendirme](/tr/concepts/multi-agent).

Örnek (DM'ler ana makinede, gruplar sandbox içinde + yalnızca mesajlaşma araçları):

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // gruplar/kanallar ana değil -> sandbox içinde
        scope: "session", // en güçlü yalıtım (grup/kanal başına bir konteyner)
        workspaceAccess: "none",
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        // allow boş değilse, diğer her şey engellenir (deny yine de önceliklidir).
        allow: ["group:messaging", "group:sessions"],
        deny: ["group:runtime", "group:fs", "group:ui", "nodes", "cron", "gateway"],
      },
    },
  },
}
```

“Gruplar yalnızca X klasörünü görebilsin” istiyorsanız, “ana makine erişimi olmasın” yerine `workspaceAccess: "none"` değerini koruyun ve yalnızca izin verilen yolları sandbox içine bağlayın:

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

- Yapılandırma anahtarları ve varsayılanlar: [Gateway yapılandırması](/tr/gateway/config-agents#agentsdefaultssandbox)
- Bir aracın neden engellendiğini ayıklama: [Sandbox ve Araç Politikası ve Yükseltilmiş](/tr/gateway/sandbox-vs-tool-policy-vs-elevated)
- Bind mount ayrıntıları: [Sandboxing](/tr/gateway/sandboxing#custom-bind-mounts)

## Görünen etiketler

- UI etiketleri, varsa `displayName` kullanır ve `<channel>:<token>` olarak biçimlendirilir.
- `#room`, oda/kanallar için ayrılmıştır; grup sohbetleri `g-<slug>` kullanır (küçük harf, boşluklar -> `-`, `#@+._-` korunur).

## Grup politikası

Grup/oda mesajlarının kanal bazında nasıl işlendiğini kontrol edin:

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "disabled", // "open" | "disabled" | "allowlist"
      groupAllowFrom: ["+15551234567"],
    },
    telegram: {
      groupPolicy: "disabled",
      groupAllowFrom: ["123456789"], // sayısal Telegram kullanıcı kimliği (sihirbaz @username çözebilir)
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
| `"open"`      | Gruplar izin listelerini atlar; bahsetme geçidi yine uygulanır. |
| `"disabled"`  | Tüm grup mesajlarını tamamen engeller.                       |
| `"allowlist"` | Yalnızca yapılandırılmış izin listesiyle eşleşen grup/odalara izin verir. |

Notlar:

- `groupPolicy`, bahsetme geçidinden ayrıdır (bu geçit @bahsetme gerektirir).
- WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: `groupAllowFrom` kullanır (yedek olarak açık `allowFrom` kullanılır).
- DM eşleştirme onayları (`*-allowFrom` depo girişleri) yalnızca DM erişimi için geçerlidir; grup gönderici yetkilendirmesi grup izin listelerinde açık şekilde kalır.
- Discord: izin listesi `channels.discord.guilds.<id>.channels` kullanır.
- Slack: izin listesi `channels.slack.channels` kullanır.
- Matrix: izin listesi `channels.matrix.groups` kullanır. Oda kimliklerini veya takma adları tercih edin; katılınan oda adı araması en iyi çabayla yapılır ve çözümlenemeyen adlar çalışma zamanında yok sayılır. Gönderenleri sınırlamak için `channels.matrix.groupAllowFrom` kullanın; oda başına `users` izin listeleri de desteklenir.
- Grup DM'leri ayrı olarak kontrol edilir (`channels.discord.dm.*`, `channels.slack.dm.*`).
- Telegram izin listesi kullanıcı kimlikleriyle (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) veya kullanıcı adlarıyla (`"@alice"` ya da `"alice"`) eşleşebilir; öneklerde büyük/küçük harf duyarlılığı yoktur.
- Varsayılan değer `groupPolicy: "allowlist"` şeklindedir; grup izin listeniz boşsa grup mesajları engellenir.
- Çalışma zamanı güvenliği: sağlayıcı bloğu tamamen eksikse (`channels.<provider>` yoksa), grup politikası `channels.defaults.groupPolicy` değerini devralmak yerine güvenli kapanış moduna (genellikle `allowlist`) döner.

Hızlı zihinsel model (grup mesajları için değerlendirme sırası):

1. `groupPolicy` (open/disabled/allowlist)
2. grup izin listeleri (`*.groups`, `*.groupAllowFrom`, kanala özgü izin listesi)
3. bahsetme geçidi (`requireMention`, `/activation`)

## Bahsetme geçidi (varsayılan)

Grup mesajları, grup başına geçersiz kılınmadıkça bir bahsetme gerektirir. Varsayılanlar alt sistem başına `*.groups."*"` altında bulunur.

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

Notlar:

- `mentionPatterns`, büyük/küçük harfe duyarsız güvenli regex kalıplarıdır; geçersiz kalıplar ve güvenli olmayan iç içe tekrar biçimleri yok sayılır.
- Açık bahsetme sağlayan yüzeyler yine geçer; kalıplar yedek olarak kullanılır.
- Ajan başına geçersiz kılma: `agents.list[].groupChat.mentionPatterns` (birden çok ajan aynı grubu paylaştığında kullanışlıdır).
- Bahsetme geçidi yalnızca bahsetme tespiti mümkün olduğunda uygulanır (yerel bahsetmeler varsa veya `mentionPatterns` yapılandırılmışsa).
- Discord varsayılanları `channels.discord.guilds."*"` içinde bulunur (sunucu/kanal başına geçersiz kılınabilir).
- Grup geçmişi bağlamı kanallar arasında tutarlı şekilde sarılır ve **yalnızca bekleyen** durumlar içindir (bahsetme geçidi nedeniyle atlanan mesajlar); genel varsayılan için `messages.groupChat.historyLimit`, geçersiz kılmalar için `channels.<channel>.historyLimit` (veya `channels.<channel>.accounts.*.historyLimit`) kullanın. Devre dışı bırakmak için `0` ayarlayın.

## Grup/kanal araç kısıtlamaları (isteğe bağlı)

Bazı kanal yapılandırmaları, **belirli bir grup/oda/kanal içinde** hangi araçların kullanılabildiğini kısıtlamayı destekler.

- `tools`: tüm grup için araçlara izin ver/engelle.
- `toolsBySender`: grup içindeki gönderici başına geçersiz kılmalar.
  Açık anahtar önekleri kullanın:
  `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` ve `"*"` joker karakteri.
  Eski öneksiz anahtarlar hâlâ kabul edilir ve yalnızca `id:` olarak eşleştirilir.

Çözümleme sırası (en özeli kazanır):

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

- Grup/kanal araç kısıtlamaları, genel/ajana ait araç politikasına ek olarak uygulanır (deny yine önceliklidir).
- Bazı kanallar, odalar/kanallar için farklı iç içe geçme yapıları kullanır (ör. Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).

## Grup izin listeleri

`channels.whatsapp.groups`, `channels.telegram.groups` veya `channels.imessage.groups` yapılandırıldığında, anahtarlar bir grup izin listesi görevi görür. Varsayılan bahsetme davranışını ayarlamaya devam ederken tüm gruplara izin vermek için `"*"` kullanın.

Yaygın bir karışıklık: DM eşleştirme onayı, grup yetkilendirmesi ile aynı şey değildir.
DM eşleştirmeyi destekleyen kanallarda, eşleştirme deposu yalnızca DM'lerin kilidini açar. Grup komutları yine de `groupAllowFrom` gibi yapılandırma izin listelerinden veya o kanal için belgelenmiş yapılandırma yedeğinden açık grup gönderici yetkilendirmesi gerektirir.

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

3. Tüm gruplara izin ver ama bahsetme gerektir (açık)

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

## Etkinleştirme (yalnızca sahip)

Grup sahipleri, grup başına etkinleştirmeyi açıp kapatabilir:

- `/activation mention`
- `/activation always`

Sahip, `channels.whatsapp.allowFrom` ile belirlenir (ayarlanmamışsa botun kendi E.164 değeri kullanılır). Komutu bağımsız bir mesaj olarak gönderin. Diğer yüzeyler şu anda `/activation` komutunu yok sayar.

## Bağlam alanları

Grup gelen yükleri şunları ayarlar:

- `ChatType=group`
- `GroupSubject` (biliniyorsa)
- `GroupMembers` (biliniyorsa)
- `WasMentioned` (bahsetme geçidi sonucu)
- Telegram forum konuları ayrıca `MessageThreadId` ve `IsForum` içerir.

Kanala özgü notlar:

- BlueBubbles, `GroupMembers` alanını doldurmadan önce adsız macOS grup katılımcılarını yerel Kişiler veritabanından isteğe bağlı olarak zenginleştirebilir. Bu varsayılan olarak kapalıdır ve yalnızca normal grup geçidi denetimleri geçildikten sonra çalışır.

Ajan sistem istemi, yeni bir grup oturumunun ilk dönüşünde grup tanıtımı içerir. Bu tanıtım, modele bir insan gibi yanıt vermesini, Markdown tablolarından kaçınmasını, boş satırları en aza indirmesini, normal sohbet aralığını takip etmesini ve doğrudan `\n` dizileri yazmaktan kaçınmasını hatırlatır. Kanaldan gelen grup adları ve katılımcı etiketleri, satır içi sistem talimatları olarak değil, çitle çevrili güvenilmeyen meta veriler olarak işlenir.

## iMessage ayrıntıları

- Yönlendirme veya izin listesi için `chat_id:<id>` tercih edin.
- Sohbetleri listeleyin: `imsg chats --limit 20`.
- Grup yanıtları her zaman aynı `chat_id` değerine geri gider.

## WhatsApp sistem istemleri

Kanonik WhatsApp sistem istemi kuralları için [WhatsApp](/tr/channels/whatsapp#system-prompts) bölümüne bakın; buna grup ve doğrudan istem çözümlemesi, joker karakter davranışı ve hesap geçersiz kılma anlamları dahildir.

## WhatsApp ayrıntıları

Yalnızca WhatsApp'a özgü davranışlar için [Grup mesajları](/tr/channels/group-messages) bölümüne bakın (geçmiş enjeksiyonu, bahsetme işleme ayrıntıları).

## İlgili

- [Grup mesajları](/tr/channels/group-messages)
- [Yayın grupları](/tr/channels/broadcast-groups)
- [Kanal yönlendirme](/tr/channels/channel-routing)
- [Eşleştirme](/tr/channels/pairing)
