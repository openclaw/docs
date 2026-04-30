---
read_when:
    - Grup sohbeti davranışını veya etiketleme koşulunu değiştirme
sidebarTitle: Groups
summary: Yüzeyler genelinde grup sohbeti davranışı (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Gruplar
x-i18n:
    generated_at: "2026-04-30T09:06:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 743dc1ce1a0e5dc5c6d66091854cdcbb8d2b8f7e06b5c1d13c272142265fc998
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw grup sohbetlerini yüzeyler arasında tutarlı şekilde ele alır: Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo.

## Başlangıç tanıtımı (2 dakika)

OpenClaw kendi mesajlaşma hesaplarınızda "yaşar". Ayrı bir WhatsApp bot kullanıcısı yoktur. Bir grupta **siz** varsınız, OpenClaw o grubu görebilir ve orada yanıt verebilir.

Varsayılan davranış:

- Gruplar kısıtlıdır (`groupPolicy: "allowlist"`).
- Yanıtlar, mention gating'i açıkça devre dışı bırakmadığınız sürece bir bahsetme gerektirir.
- Gruplardaki/kanallardaki normal final yanıtları varsayılan olarak gizlidir. Görünür oda çıktısı `message` aracını kullanır.

Çevirisi: allowlist'e alınmış gönderenler OpenClaw'u ondan bahsederek tetikleyebilir.

<Note>
**Özet**

- **DM erişimi** `*.allowFrom` ile denetlenir.
- **Grup erişimi** `*.groupPolicy` + allowlist'ler (`*.groups`, `*.groupAllowFrom`) ile denetlenir.
- **Yanıt tetikleme** mention gating (`requireMention`, `/activation`) ile denetlenir.

</Note>

Hızlı akış (bir grup mesajına ne olur):

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
otherwise -> reply
```

## Görünür yanıtlar

Grup/kanal odaları için OpenClaw varsayılan olarak `messages.groupChat.visibleReplies: "message_tool"` kullanır.
Bu, agent'ın yine de turn'ü işlediği ve bellek/oturum durumunu güncelleyebildiği, ancak normal final yanıtının otomatik olarak odaya geri gönderilmediği anlamına gelir. Görünür şekilde konuşmak için agent `message(action=send)` kullanır.

Doğrudan sohbetler ve diğer tüm kaynak turn'leri için aynı yalnızca araçla görünür yanıt davranışını genel olarak uygulamak üzere `messages.visibleReplies: "message_tool"` kullanın. `messages.groupChat.visibleReplies`, grup/kanal odaları için daha spesifik override olarak kalır.

Bu, çoğu lurk-mode turn için modeli `NO_REPLY` yanıtı vermeye zorlayan eski kalıbın yerini alır. Yalnızca araç modunda görünür hiçbir şey yapmamak, basitçe message aracını çağırmamak anlamına gelir.

Agent yalnızca araç modunda çalışırken yazıyor göstergeleri yine de gönderilir. Bu turn'ler için varsayılan grup yazıyor modu "message"dan "instant"a yükseltilir, çünkü agent message aracını çağırıp çağırmayacağına karar vermeden önce normal assistant mesaj metni hiç olmayabilir. Açık yazıyor modu yapılandırması yine de önceliklidir.

Grup/kanal odaları için eski otomatik final yanıtlarını geri yüklemek üzere:

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "automatic",
    },
  },
}
```

Her kaynak sohbet için görünür çıktının message aracı üzerinden geçmesini zorunlu kılmak üzere:

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

Yerel slash komutları (Discord, Telegram ve yerel komut desteği olan diğer yüzeyler) `visibleReplies: "message_tool"` ayarını atlar ve kanalın yerel komut arayüzünün beklediği yanıtı alması için her zaman görünür şekilde yanıt verir. Bu yalnızca doğrulanmış yerel komut turn'leri için geçerlidir; metin olarak yazılan `/...` komutları ve sıradan sohbet turn'leri yapılandırılmış grup varsayılanını izlemeye devam eder.

## Bağlam görünürlüğü ve allowlist'ler

Grup güvenliğinde iki farklı denetim yer alır:

- **Tetikleme yetkilendirmesi**: agent'ı kimlerin tetikleyebileceği (`groupPolicy`, `groups`, `groupAllowFrom`, kanala özgü allowlist'ler).
- **Bağlam görünürlüğü**: modele hangi ek bağlamın enjekte edildiği (yanıt metni, alıntılar, thread geçmişi, iletilmiş metadata).

Varsayılan olarak OpenClaw normal sohbet davranışına öncelik verir ve bağlamı çoğunlukla alındığı gibi tutar. Bu, allowlist'lerin esas olarak eylemleri kimin tetikleyebileceğine karar verdiği, alıntılanan veya geçmişe ait her snippet için evrensel bir redaction sınırı olmadığı anlamına gelir.

<AccordionGroup>
  <Accordion title="Geçerli davranış kanala özgüdür">
    - Bazı kanallar belirli yollarda ek bağlam için gönderen tabanlı filtreleme zaten uygular (örneğin Slack thread seeding, Matrix yanıt/thread aramaları).
    - Diğer kanallar ise alıntı/yanıt/iletme bağlamını alındığı gibi geçirmeye devam eder.

  </Accordion>
  <Accordion title="Sağlamlaştırma yönü (planlandı)">
    - `contextVisibility: "all"` (varsayılan) mevcut alındığı gibi davranışı korur.
    - `contextVisibility: "allowlist"` ek bağlamı allowlist'e alınmış gönderenlerle filtreler.
    - `contextVisibility: "allowlist_quote"`, `allowlist` artı açık bir alıntı/yanıt istisnasıdır.

    Bu sağlamlaştırma modeli kanallar arasında tutarlı şekilde uygulanana kadar yüzeye göre farklılıklar bekleyin.

  </Accordion>
</AccordionGroup>

![Grup mesajı akışı](/images/groups-flow.svg)

İstediğiniz şey...

| Hedef                                        | Ayarlanacak değer                                           |
| -------------------------------------------- | ---------------------------------------------------------- |
| Tüm gruplara izin ver ama yalnızca @bahsetmelerde yanıtla | `groups: { "*": { requireMention: true } }`                |
| Tüm grup yanıtlarını devre dışı bırak        | `groupPolicy: "disabled"`                                  |
| Yalnızca belirli gruplar                     | `groups: { "<group-id>": { ... } }` (`"*"` anahtarı yok)   |
| Gruplarda yalnızca siz tetikleyebilirsiniz   | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |

## Oturum anahtarları

- Grup oturumları `agent:<agentId>:<channel>:group:<id>` oturum anahtarlarını kullanır (odalar/kanallar `agent:<agentId>:<channel>:channel:<id>` kullanır).
- Telegram forum konuları, her konunun kendi oturumu olması için grup id'sine `:topic:<threadId>` ekler.
- Doğrudan sohbetler ana oturumu kullanır (veya yapılandırıldıysa gönderen başına).
- Grup oturumları için Heartbeat'ler atlanır.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Kalıp: kişisel DM'ler + herkese açık gruplar (tek agent)

Evet — "kişisel" trafiğiniz **DM'ler** ve "herkese açık" trafiğiniz **gruplar** ise bu iyi çalışır.

Neden: tek agent modunda DM'ler genellikle **ana** oturum anahtarına (`agent:main:main`) düşerken gruplar her zaman **ana olmayan** oturum anahtarları (`agent:main:<channel>:group:<id>`) kullanır. Sandboxing'i `mode: "non-main"` ile etkinleştirirseniz, bu grup oturumları yapılandırılmış sandbox backend'inde çalışır, ana DM oturumunuz ise host üzerinde kalır. Birini seçmezseniz Docker varsayılan backend'dir.

Bu size tek bir agent "beyni" (paylaşılan çalışma alanı + bellek), ama iki yürütme duruşu verir:

- **DM'ler**: tam araçlar (host)
- **Gruplar**: sandbox + kısıtlı araçlar

<Note>
Gerçekten ayrı çalışma alanlarına/persona'lara ihtiyacınız varsa ("kişisel" ve "herkese açık" asla karışmamalı), ikinci bir agent + binding'ler kullanın. Bkz. [Çoklu Agent Yönlendirme](/tr/concepts/multi-agent).
</Note>

<Tabs>
  <Tab title="DM'ler host üzerinde, gruplar sandbox'ta">
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
  <Tab title="Gruplar yalnızca allowlist'e alınmış bir klasörü görür">
    "Gruplar host erişimi yok yerine yalnızca X klasörünü görebilsin" mi istiyorsunuz? `workspaceAccess: "none"` değerini koruyun ve yalnızca allowlist'e alınmış yolları sandbox içine mount edin:

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
- Bir aracın neden engellendiğini debug etme: [Sandbox ve Araç Politikası ve Elevated](/tr/gateway/sandbox-vs-tool-policy-vs-elevated)
- Bind mount ayrıntıları: [Sandboxing](/tr/gateway/sandboxing#custom-bind-mounts)

## Görünen etiketler

- UI etiketleri mevcut olduğunda `<channel>:<token>` biçiminde formatlanan `displayName` kullanır.
- `#room` odalar/kanallar için ayrılmıştır; grup sohbetleri `g-<slug>` kullanır (küçük harf, boşluklar -> `-`, `#@+._-` koru).

## Grup politikası

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

| Politika      | Davranış                                                     |
| ------------- | ------------------------------------------------------------ |
| `"open"`      | Gruplar allowlist'leri atlar; mention-gating yine de uygulanır. |
| `"disabled"`  | Tüm grup mesajlarını tamamen engeller.                       |
| `"allowlist"` | Yalnızca yapılandırılmış allowlist ile eşleşen gruplara/odalara izin verir. |

<AccordionGroup>
  <Accordion title="Kanal başına notlar">
    - `groupPolicy`, mention-gating'den ayrıdır (@bahsetmeleri gerektiren).
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: `groupAllowFrom` kullanın (fallback: açık `allowFrom`).
    - DM eşleştirme onayları (`*-allowFrom` store girdileri) yalnızca DM erişimine uygulanır; grup gönderen yetkilendirmesi grup allowlist'lerine açık şekilde bağlı kalır.
    - Discord: allowlist `channels.discord.guilds.<id>.channels` kullanır.
    - Slack: allowlist `channels.slack.channels` kullanır.
    - Matrix: allowlist `channels.matrix.groups` kullanır. Oda ID'lerini veya alias'ları tercih edin; katılınan oda adı araması best-effort'tur ve çözümlenemeyen adlar runtime'da yok sayılır. Gönderenleri kısıtlamak için `channels.matrix.groupAllowFrom` kullanın; oda başına `users` allowlist'leri de desteklenir.
    - Grup DM'leri ayrı denetlenir (`channels.discord.dm.*`, `channels.slack.dm.*`).
    - Telegram allowlist kullanıcı ID'leriyle (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) veya kullanıcı adlarıyla (`"@alice"` veya `"alice"`) eşleşebilir; prefix'ler büyük/küçük harfe duyarsızdır.
    - Varsayılan `groupPolicy: "allowlist"` değeridir; grup allowlist'iniz boşsa grup mesajları engellenir.
    - Runtime güvenliği: bir provider bloğu tamamen eksik olduğunda (`channels.<provider>` yok), grup politikası `channels.defaults.groupPolicy` değerini devralmak yerine fail-closed moda (tipik olarak `allowlist`) döner.

  </Accordion>
</AccordionGroup>

Hızlı zihinsel model (grup mesajları için değerlendirme sırası):

<Steps>
  <Step title="groupPolicy">
    `groupPolicy` (open/disabled/allowlist).
  </Step>
  <Step title="Grup allowlist'leri">
    Grup allowlist'leri (`*.groups`, `*.groupAllowFrom`, kanala özgü allowlist).
  </Step>
  <Step title="Mention gating">
    Mention gating (`requireMention`, `/activation`).
  </Step>
</Steps>

## Mention gating (varsayılan)

Grup mesajları, grup başına override edilmedikçe bir bahsetme gerektirir. Varsayılanlar alt sistem başına `*.groups."*"` altında bulunur.

Bir bot mesajına yanıt vermek, kanal yanıt meta verilerini desteklediğinde örtük bir bahsetme sayılır. Bir bot mesajını alıntılamak da alıntı meta verilerini açığa çıkaran kanallarda örtük bir bahsetme sayılabilir. Mevcut yerleşik durumlar arasında Telegram, WhatsApp, Slack, Discord, Microsoft Teams ve ZaloUser bulunur.

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
  <Accordion title="Mention gating notes">
    - `mentionPatterns` büyük/küçük harfe duyarsız güvenli regex desenleridir; geçersiz desenler ve güvenli olmayan iç içe yineleme biçimleri yoksayılır.
    - Açık bahsetmeler sağlayan yüzeyler yine de geçer; desenler bir geri dönüştür.
    - Ajan başına geçersiz kılma: `agents.list[].groupChat.mentionPatterns` (birden çok ajan bir grubu paylaştığında kullanışlıdır).
    - Bahsetme geçidi yalnızca bahsetme algılaması mümkün olduğunda uygulanır (yerel bahsetmeler veya `mentionPatterns` yapılandırılmıştır).
    - Grup sohbeti istem bağlamı, çözümlenmiş sessiz yanıt talimatını her turda taşır; çalışma alanı dosyaları `NO_REPLY` mekaniklerini yinelememelidir.
    - Sessiz yanıtlara izin verilen gruplar, temiz boş veya yalnızca akıl yürütme içeren model turlarını `NO_REPLY` ile eşdeğer şekilde sessiz sayar. Doğrudan sohbetler bunu yalnızca doğrudan sessiz yanıtlara açıkça izin verildiğinde yapar; aksi halde boş yanıtlar başarısız ajan turları olarak kalır.
    - Discord varsayılanları `channels.discord.guilds."*"` içinde bulunur (guild/kanal başına geçersiz kılınabilir).
    - Grup geçmişi bağlamı kanallar arasında tek biçimde sarmalanır ve **yalnızca beklemede olan** iletileri içerir (bahsetme geçidi nedeniyle atlanan mesajlar); genel varsayılan için `messages.groupChat.historyLimit`, geçersiz kılmalar için `channels.<channel>.historyLimit` (veya `channels.<channel>.accounts.*.historyLimit`) kullanın. Devre dışı bırakmak için `0` ayarlayın.

  </Accordion>
</AccordionGroup>

## Grup/kanal araç kısıtlamaları (isteğe bağlı)

Bazı kanal yapılandırmaları, hangi araçların **belirli bir grup/oda/kanal içinde** kullanılabilir olduğunu kısıtlamayı destekler.

- `tools`: tüm grup için araçlara izin verin/reddedin.
- `toolsBySender`: grup içinde gönderen başına geçersiz kılmalar. Açık anahtar önekleri kullanın: `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` ve `"*"` joker karakteri. Eski öneksiz anahtarlar hâlâ kabul edilir ve yalnızca `id:` olarak eşleştirilir.

Çözümleme sırası (en spesifik olan kazanır):

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
Grup/kanal araç kısıtlamaları, global/ajan araç ilkesine ek olarak uygulanır (ret yine de kazanır). Bazı kanallar odalar/kanallar için farklı iç içe yapı kullanır (ör. Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).
</Note>

## Grup izin listeleri

`channels.whatsapp.groups`, `channels.telegram.groups` veya `channels.imessage.groups` yapılandırıldığında, anahtarlar grup izin listesi olarak davranır. Varsayılan bahsetme davranışını ayarlarken tüm gruplara izin vermek için `"*"` kullanın.

<Warning>
Yaygın karışıklık: DM eşleştirme onayı, grup yetkilendirmesiyle aynı değildir. DM eşleştirmeyi destekleyen kanallarda, eşleştirme deposu yalnızca DM'lerin kilidini açar. Grup komutları yine de `groupAllowFrom` gibi yapılandırma izin listelerinden veya o kanal için belgelenmiş yapılandırma geri dönüşünden açık grup gönderen yetkilendirmesi gerektirir.
</Warning>

Yaygın amaçlar (kopyala/yapıştır):

<Tabs>
  <Tab title="Disable all group replies">
    ```json5
    {
      channels: { whatsapp: { groupPolicy: "disabled" } },
    }
    ```
  </Tab>
  <Tab title="Allow only specific groups (WhatsApp)">
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
  <Tab title="Allow all groups but require mention">
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
  <Tab title="Owner-only triggers (WhatsApp)">
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

Sahip `channels.whatsapp.allowFrom` ile belirlenir (veya ayarlanmamışsa botun kendi E.164 değeriyle). Komutu bağımsız bir mesaj olarak gönderin. Diğer yüzeyler şu anda `/activation` komutunu yoksayar.

## Bağlam alanları

Grup gelen yükleri şunları ayarlar:

- `ChatType=group`
- `GroupSubject` (biliniyorsa)
- `GroupMembers` (biliniyorsa)
- `WasMentioned` (bahsetme geçidi sonucu)
- Telegram forum konuları ayrıca `MessageThreadId` ve `IsForum` içerir.

Kanala özgü notlar:

- BlueBubbles, `GroupMembers` doldurulmadan önce adlandırılmamış macOS grup katılımcılarını yerel Kişiler veritabanından isteğe bağlı olarak zenginleştirebilir. Bu varsayılan olarak kapalıdır ve yalnızca normal grup geçidi geçtikten sonra çalışır.

Ajan sistem istemi, yeni bir grup oturumunun ilk turunda bir grup girişi içerir. Modele insan gibi yanıt vermesini, Markdown tablolarından kaçınmasını, boş satırları en aza indirmesini ve normal sohbet aralığını izlemesini, ayrıca düz `\n` dizileri yazmaktan kaçınmasını hatırlatır. Kanaldan kaynaklanan grup adları ve katılımcı etiketleri, satır içi sistem talimatları olarak değil, çitli güvenilmeyen meta veri olarak işlenir.

## iMessage ayrıntıları

- Yönlendirirken veya izin listesine alırken `chat_id:<id>` tercih edin.
- Sohbetleri listeleyin: `imsg chats --limit 20`.
- Grup yanıtları her zaman aynı `chat_id` değerine geri gider.

## WhatsApp sistem istemleri

Grup ve doğrudan istem çözümlemesi, joker karakter davranışı ve hesap geçersiz kılma semantiği dahil olmak üzere kanonik WhatsApp sistem istemi kuralları için [WhatsApp](/tr/channels/whatsapp#system-prompts) bölümüne bakın.

## WhatsApp ayrıntıları

Yalnızca WhatsApp davranışı (geçmiş enjeksiyonu, bahsetme işleme ayrıntıları) için [Grup mesajları](/tr/channels/group-messages) bölümüne bakın.

## İlgili

- [Yayın grupları](/tr/channels/broadcast-groups)
- [Kanal yönlendirme](/tr/channels/channel-routing)
- [Grup mesajları](/tr/channels/group-messages)
- [Eşleştirme](/tr/channels/pairing)
