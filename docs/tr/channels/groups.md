---
read_when:
    - Grup sohbeti davranışını veya bahsetme geçitlemesini değiştirme
summary: Yüzeyler genelinde grup sohbeti davranışı (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Gruplar
x-i18n:
    generated_at: "2026-04-22T04:19:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: a86e202c7e990e040eb092aaef46bc856ee8d39b2e5fe1c733e24f1b35faa824
    source_path: channels/groups.md
    workflow: 15
---

# Gruplar

OpenClaw, grup sohbetlerini yüzeyler arasında tutarlı şekilde ele alır: Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo.

## Başlangıç düzeyi giriş (2 dakika)

OpenClaw, kendi mesajlaşma hesaplarınız üzerinde “yaşar”. Ayrı bir WhatsApp bot kullanıcısı yoktur.
Eğer **siz** bir gruptaysanız, OpenClaw bu grubu görebilir ve orada yanıt verebilir.

Varsayılan davranış:

- Gruplar kısıtlıdır (`groupPolicy: "allowlist"`).
- Siz açıkça bahsetme geçitlemesini devre dışı bırakmadıkça yanıtlar bir bahsetme gerektirir.

Çevirisi: izin listesine alınmış göndericiler, OpenClaw’dan bahsederek onu tetikleyebilir.

> Özetle
>
> - **DM erişimi** `*.allowFrom` ile kontrol edilir.
> - **Grup erişimi** `*.groupPolicy` + izin listeleri (`*.groups`, `*.groupAllowFrom`) ile kontrol edilir.
> - **Yanıt tetikleme** bahsetme geçitlemesi (`requireMention`, `/activation`) ile kontrol edilir.

Hızlı akış (bir grup mesajına ne olur):

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> grup izinli mi? hayır -> drop
requireMention? yes -> bahsedildi mi? hayır -> yalnızca bağlam için depola
aksi halde -> yanıt ver
```

## Bağlam görünürlüğü ve izin listeleri

Grup güvenliğinde iki farklı denetim yer alır:

- **Tetikleme yetkilendirmesi**: aracı kimin tetikleyebileceği (`groupPolicy`, `groups`, `groupAllowFrom`, kanala özgü izin listeleri).
- **Bağlam görünürlüğü**: modele hangi ek bağlamın enjekte edildiği (yanıt metni, alıntılar, konu geçmişi, iletilen meta veriler).

Varsayılan olarak OpenClaw, normal sohbet davranışına öncelik verir ve bağlamı çoğunlukla alındığı gibi tutar. Bu, izin listelerinin esas olarak eylemleri kimin tetikleyebileceğini belirlediği, alıntılanmış veya geçmişten gelen her parçacık için evrensel bir sansür sınırı olmadığı anlamına gelir.

Geçerli davranış kanala özgüdür:

- Bazı kanallar, belirli yollarda ek bağlam için zaten gönderici tabanlı filtreleme uygular (örneğin Slack konu başlangıç bağlamı, Matrix yanıt/konu aramaları).
- Diğer kanallar ise alıntı/yanıt/iletme bağlamını alındığı gibi geçirmeye devam eder.

Sıkılaştırma yönü (planlanan):

- `contextVisibility: "all"` (varsayılan) mevcut alındığı gibi davranışını korur.
- `contextVisibility: "allowlist"` ek bağlamı izin listesine alınmış göndericilerle sınırlar.
- `contextVisibility: "allowlist_quote"` `allowlist` davranışına ek olarak tek bir açık alıntı/yanıt istisnası içerir.

Bu sıkılaştırma modeli kanallar arasında tutarlı şekilde uygulanana kadar, yüzeye göre farklılıklar bekleyin.

![Grup mesajı akışı](/images/groups-flow.svg)

Eğer istiyorsanız...

| Hedef                                        | Ayarlanacak değer                                          |
| -------------------------------------------- | ---------------------------------------------------------- |
| Tüm gruplara izin ver ama yalnızca @bahsetmelerde yanıt ver | `groups: { "*": { requireMention: true } }`                |
| Tüm grup yanıtlarını devre dışı bırak        | `groupPolicy: "disabled"`                                  |
| Yalnızca belirli gruplar                     | `groups: { "<group-id>": { ... } }` (`"*"` anahtarı olmadan) |
| Gruplarda yalnızca siz tetikleyebilin        | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |

## Oturum anahtarları

- Grup oturumları `agent:<agentId>:<channel>:group:<id>` oturum anahtarlarını kullanır (oda/kanallar `agent:<agentId>:<channel>:channel:<id>` kullanır).
- Telegram forum başlıkları, her başlığın kendi oturumu olması için grup kimliğine `:topic:<threadId>` ekler.
- Doğrudan sohbetler ana oturumu kullanır (veya yapılandırılmışsa gönderici başına oturumu).
- Heartbeat, grup oturumları için atlanır.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Desen: kişisel DM’ler + herkese açık gruplar (tek aracı)

Evet — eğer “kişisel” trafiğiniz **DM’ler**, “genel” trafiğiniz ise **gruplar** ise bu iyi çalışır.

Neden: tek aracı modunda DM’ler genellikle **ana** oturum anahtarına (`agent:main:main`) düşer, gruplar ise her zaman **ana olmayan** oturum anahtarlarını (`agent:main:<channel>:group:<id>`) kullanır. Korumalı alanı `mode: "non-main"` ile etkinleştirirseniz, bu grup oturumları yapılandırılmış korumalı alan arka ucunda çalışırken ana DM oturumunuz host üzerinde kalır. Siz bir tane seçmezseniz varsayılan arka uç Docker’dır.

Bu size tek bir aracı “beyni” (paylaşılan çalışma alanı + bellek), ama iki yürütme duruşu verir:

- **DM’ler**: tam araçlar (host)
- **Gruplar**: korumalı alan + kısıtlı araçlar

> Gerçekten ayrı çalışma alanları/kişilikler gerekiyorsa (“kişisel” ve “genel” asla karışmamalıysa), ikinci bir aracı + bağlamalar kullanın. Bkz. [Çoklu Aracı Yönlendirme](/tr/concepts/multi-agent).

Örnek (DM’ler host üzerinde, gruplar korumalı alanda + yalnızca mesajlaşma araçları):

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // gruplar/kanallar ana olmayanlardır -> korumalı alanda
        scope: "session", // en güçlü yalıtım (grup/kanal başına bir kapsayıcı)
        workspaceAccess: "none",
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        // allow boş değilse diğer her şey engellenir (deny yine önceliklidir).
        allow: ["group:messaging", "group:sessions"],
        deny: ["group:runtime", "group:fs", "group:ui", "nodes", "cron", "gateway"],
      },
    },
  },
}
```

“Gruplar host erişimi almasın” yerine “yalnızca X klasörünü görebilsin” mi istiyorsunuz? `workspaceAccess: "none"` değerini koruyun ve yalnızca izin listesine alınmış yolları korumalı alana bağlayın:

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

- Yapılandırma anahtarları ve varsayılanlar: [Gateway yapılandırması](/tr/gateway/configuration-reference#agentsdefaultssandbox)
- Bir aracın neden engellendiğini ayıklama: [Sandbox vs Tool Policy vs Elevated](/tr/gateway/sandbox-vs-tool-policy-vs-elevated)
- Bağlama bağları ayrıntıları: [Sandboxing](/tr/gateway/sandboxing#custom-bind-mounts)

## Görüntüleme etiketleri

- UI etiketleri, varsa `displayName` kullanır ve `<channel>:<token>` biçiminde gösterilir.
- `#room` oda/kanallar için ayrılmıştır; grup sohbetleri `g-<slug>` kullanır (küçük harf, boşluklar -> `-`, `#@+._-` korunur).

## Grup ilkesi

Grup/oda mesajlarının kanal başına nasıl işlendiğini kontrol edin:

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

| İlke          | Davranış                                                     |
| ------------- | ------------------------------------------------------------ |
| `"open"`      | Gruplar izin listelerini atlar; bahsetme geçitlemesi yine de uygulanır. |
| `"disabled"`  | Tüm grup mesajlarını tamamen engeller.                       |
| `"allowlist"` | Yalnızca yapılandırılmış izin listesiyle eşleşen grup/odalara izin verir. |

Notlar:

- `groupPolicy`, bahsetme geçitlemesinden ayrıdır (bu, @bahsetmeleri gerektirir).
- WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: `groupAllowFrom` kullanın (yedek: açık `allowFrom`).
- DM eşleştirme onayları (`*-allowFrom` depo girdileri) yalnızca DM erişimi için geçerlidir; grup gönderici yetkilendirmesi grup izin listelerinde açık kalır.
- Discord: izin listesi `channels.discord.guilds.<id>.channels` kullanır.
- Slack: izin listesi `channels.slack.channels` kullanır.
- Matrix: izin listesi `channels.matrix.groups` kullanır. Oda kimliklerini veya takma adları tercih edin; katılınmış oda adı araması en iyi çabadır ve çözümlenmemiş adlar çalışma zamanında yok sayılır. Göndericileri kısıtlamak için `channels.matrix.groupAllowFrom` kullanın; oda başına `users` izin listeleri de desteklenir.
- Grup DM’leri ayrı olarak kontrol edilir (`channels.discord.dm.*`, `channels.slack.dm.*`).
- Telegram izin listesi kullanıcı kimlikleriyle (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) veya kullanıcı adlarıyla (`"@alice"` ya da `"alice"`) eşleşebilir; önekler büyük/küçük harfe duyarsızdır.
- Varsayılan `groupPolicy: "allowlist"` değeridir; grup izin listeniz boşsa grup mesajları engellenir.
- Çalışma zamanı güvenliği: bir sağlayıcı bloğu tamamen eksik olduğunda (`channels.<provider>` yoksa), grup ilkesi `channels.defaults.groupPolicy` değerini devralmak yerine başarısızlıkta kapalı moda (genellikle `allowlist`) döner.

Hızlı zihinsel model (grup mesajları için değerlendirme sırası):

1. `groupPolicy` (open/disabled/allowlist)
2. grup izin listeleri (`*.groups`, `*.groupAllowFrom`, kanala özgü izin listesi)
3. bahsetme geçitlemesi (`requireMention`, `/activation`)

## Bahsetme geçitlemesi (varsayılan)

Aksi grup başına geçersiz kılınmadıkça grup mesajları bir bahsetme gerektirir. Varsayılanlar her alt sistem için `*.groups."*"` altında bulunur.

Bir bot mesajına yanıt vermek, kanal yanıt meta verilerini destekliyorsa örtük bir bahsetme sayılır. Bir bot mesajını alıntılamak da alıntı meta verilerini sunan kanallarda örtük bir bahsetme sayılabilir. Geçerli yerleşik örnekler arasında Telegram, WhatsApp, Slack, Discord, Microsoft Teams ve ZaloUser bulunur.

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
- Açık bahsetme sağlayan yüzeyler yine geçer; kalıplar bir yedektir.
- Aracı başına geçersiz kılma: `agents.list[].groupChat.mentionPatterns` (birden fazla aracı bir grubu paylaşıyorsa kullanışlıdır).
- Bahsetme geçitlemesi yalnızca bahsetme algılaması mümkün olduğunda uygulanır (yerel bahsetmeler veya `mentionPatterns` yapılandırılmışsa).
- Discord varsayılanları `channels.discord.guilds."*"` altında bulunur (sunucu/kanal başına geçersiz kılınabilir).
- Grup geçmişi bağlamı kanallar arasında tutarlı şekilde sarılır ve **yalnızca beklemede olan** durumlar içindir (bahsetme geçitlemesi nedeniyle atlanan mesajlar); genel varsayılan için `messages.groupChat.historyLimit`, geçersiz kılmalar için `channels.<channel>.historyLimit` (veya `channels.<channel>.accounts.*.historyLimit`) kullanın. Devre dışı bırakmak için `0` ayarlayın.

## Grup/kanal araç kısıtlamaları (isteğe bağlı)

Bazı kanal yapılandırmaları, belirli bir grup/oda/kanal **içinde** hangi araçların kullanılabildiğini kısıtlamayı destekler.

- `tools`: tüm grup için araçlara izin verin/engelleyin.
- `toolsBySender`: grup içindeki gönderici başına geçersiz kılmalar.
  Açık anahtar önekleri kullanın:
  `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` ve `"*"` joker karakteri.
  Eski öneksiz anahtarlar hâlâ kabul edilir ve yalnızca `id:` olarak eşleştirilir.

Çözümleme sırası (en özel olan kazanır):

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

- Grup/kanal araç kısıtlamaları, genel/aracı araç ilkesine ek olarak uygulanır (deny yine önceliklidir).
- Bazı kanallar oda/kanallar için farklı iç içe yapılar kullanır (ör. Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).

## Grup izin listeleri

`channels.whatsapp.groups`, `channels.telegram.groups` veya `channels.imessage.groups` yapılandırıldığında, anahtarlar bir grup izin listesi işlevi görür. Varsayılan bahsetme davranışını ayarlamaya devam ederken tüm gruplara izin vermek için `"*"` kullanın.

Yaygın karışıklık: DM eşleştirme onayı, grup yetkilendirmesiyle aynı şey değildir.
DM eşleştirmesini destekleyen kanallarda eşleştirme deposu yalnızca DM’lerin kilidini açar. Grup komutları yine de `groupAllowFrom` gibi yapılandırma izin listelerinden veya o kanal için belgelenmiş yapılandırma yedeğinden açık grup gönderici yetkilendirmesi gerektirir.

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

## Aktivasyon (yalnızca sahip)

Grup sahipleri grup başına aktivasyonu değiştirebilir:

- `/activation mention`
- `/activation always`

Sahip, `channels.whatsapp.allowFrom` ile belirlenir (ayarlanmamışsa botun kendi E.164 değeri kullanılır). Komutu tek başına bir mesaj olarak gönderin. Diğer yüzeyler şu anda `/activation` komutunu yok sayar.

## Bağlam alanları

Grup gelen yükleri şunları ayarlar:

- `ChatType=group`
- `GroupSubject` (biliniyorsa)
- `GroupMembers` (biliniyorsa)
- `WasMentioned` (bahsetme geçitlemesi sonucu)
- Telegram forum başlıkları ayrıca `MessageThreadId` ve `IsForum` içerir.

Kanala özgü notlar:

- BlueBubbles, adsız macOS grup katılımcılarını `GroupMembers` alanını doldurmadan önce yerel Contacts veritabanından isteğe bağlı olarak zenginleştirebilir. Bu varsayılan olarak kapalıdır ve yalnızca normal grup geçitlemesi geçtikten sonra çalışır.

Aracı sistem istemi, yeni bir grup oturumunun ilk turunda bir grup tanıtımı içerir. Bu, modele bir insan gibi yanıt vermesini, Markdown tablolarından kaçınmasını, boş satırları en aza indirmesini, normal sohbet aralığını izlemesini ve gerçek `\n` dizilerini yazmaktan kaçınmasını hatırlatır.

## iMessage ayrıntıları

- Yönlendirme veya izin listesi için `chat_id:<id>` tercih edin.
- Sohbetleri listeleyin: `imsg chats --limit 20`.
- Grup yanıtları her zaman aynı `chat_id` değerine geri gider.

## WhatsApp sistem istemleri

Kanonik WhatsApp sistem istemi kuralları için [WhatsApp](/tr/channels/whatsapp#system-prompts) bölümüne bakın; buna grup ve doğrudan istem çözümlemesi, joker davranışı ve hesap geçersiz kılma semantiği dahildir.

## WhatsApp ayrıntıları

WhatsApp’a özgü davranışlar için [Grup mesajları](/tr/channels/group-messages) bölümüne bakın (geçmiş ekleme, bahsetme işleme ayrıntıları).
