---
read_when:
    - Grup sohbeti davranışını veya etiketleme kısıtlamasını değiştirme
sidebarTitle: Groups
summary: Yüzeyler genelinde grup sohbeti davranışı (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Gruplar
x-i18n:
    generated_at: "2026-04-30T16:27:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: ed9cba03cf4546a20d473e8095a54858530869b27f8934f2680e8dbe987dbf5e
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw grup sohbetlerini yüzeyler genelinde tutarlı şekilde ele alır: Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo.

## Yeni başlayanlar için giriş (2 dakika)

OpenClaw kendi mesajlaşma hesaplarınızda "yaşar". Ayrı bir WhatsApp bot kullanıcısı yoktur. Bir grupta **siz** varsa, OpenClaw o grubu görebilir ve orada yanıt verebilir.

Varsayılan davranış:

- Gruplar kısıtlıdır (`groupPolicy: "allowlist"`).
- Açıkça mention geçidini devre dışı bırakmadığınız sürece yanıtlar bir mention gerektirir.
- Gruplarda/kanallarda normal son yanıtlar varsayılan olarak özeldir. Görünür oda çıktısı `message` aracını kullanır.

Çevirisi: allowlist'e alınmış gönderenler, OpenClaw'dan bahsederek onu tetikleyebilir.

<Note>
**Özet**

- **DM erişimi** `*.allowFrom` ile denetlenir.
- **Grup erişimi** `*.groupPolicy` + allowlist'ler (`*.groups`, `*.groupAllowFrom`) ile denetlenir.
- **Yanıt tetikleme** mention geçidi (`requireMention`, `/activation`) ile denetlenir.

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
Bu, aracının yine de dönüşü işlediği ve bellek/oturum durumunu güncelleyebildiği, ancak normal son yanıtının otomatik olarak odaya geri gönderilmediği anlamına gelir. Görünür şekilde konuşmak için aracı `message(action=send)` kullanır.

Doğrudan sohbetler ve diğer tüm kaynak dönüşleri için aynı yalnızca araçla görünür yanıt davranışını genel olarak uygulamak üzere `messages.visibleReplies: "message_tool"` kullanın. `messages.groupChat.visibleReplies`, grup/kanal odaları için daha özel geçersiz kılma olarak kalır.

Bu, çoğu dinleme modu dönüşünde modeli `NO_REPLY` yanıtı vermeye zorlama şeklindeki eski kalıbın yerini alır. Yalnızca araç modunda görünür hiçbir şey yapmamak, yalnızca message aracını çağırmamak anlamına gelir.

Aracı yalnızca araç modunda çalışırken yazıyor göstergeleri yine gönderilir. Bu dönüşler için varsayılan grup yazıyor modu "message"tan "instant"a yükseltilir, çünkü aracı message aracını çağırıp çağırmayacağına karar vermeden önce normal asistan mesaj metni hiç olmayabilir. Açık yazıyor modu yapılandırması yine önceliklidir.

Grup/kanal odaları için eski otomatik son yanıtları geri yüklemek üzere:

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "automatic",
    },
  },
}
```

Gateway, dosya kaydedildikten sonra `messages` yapılandırmasını sıcak yeniden yükler. Yalnızca dağıtımda dosya izleme veya yapılandırma yeniden yükleme devre dışıysa yeniden başlatın.

Her kaynak sohbet için görünür çıktının message aracından geçmesini zorunlu kılmak üzere:

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

Yerel slash komutları (Discord, Telegram ve yerel komut desteği olan diğer yüzeyler) `visibleReplies: "message_tool"` ayarını atlar ve kanalın yerel komut arayüzünün beklediği yanıtı alması için her zaman görünür şekilde yanıt verir. Bu yalnızca doğrulanmış yerel komut dönüşleri için geçerlidir; metin olarak yazılmış `/...` komutları ve sıradan sohbet dönüşleri yapılandırılmış grup varsayılanını izlemeye devam eder.

## Bağlam görünürlüğü ve allowlist'ler

Grup güvenliğinde iki farklı denetim yer alır:

- **Tetikleme yetkilendirmesi**: aracıyı kim tetikleyebilir (`groupPolicy`, `groups`, `groupAllowFrom`, kanala özgü allowlist'ler).
- **Bağlam görünürlüğü**: modele hangi ek bağlamın enjekte edildiği (yanıt metni, alıntılar, thread geçmişi, yönlendirilmiş metadata).

OpenClaw varsayılan olarak normal sohbet davranışını önceliklendirir ve bağlamı çoğunlukla alındığı şekilde tutar. Bu, allowlist'lerin esas olarak eylemleri kimin tetikleyebileceğine karar verdiği, her alıntılanmış veya geçmiş parçacık için evrensel bir redaksiyon sınırı olmadığı anlamına gelir.

<AccordionGroup>
  <Accordion title="Geçerli davranış kanala özgüdür">
    - Bazı kanallar belirli yollarda ek bağlam için zaten gönderen tabanlı filtreleme uygular (örneğin Slack thread başlatma, Matrix yanıt/thread aramaları).
    - Diğer kanallar alıntı/yanıt/yönlendirme bağlamını hâlâ alındığı şekilde geçirir.

  </Accordion>
  <Accordion title="Sertleştirme yönü (planlanan)">
    - `contextVisibility: "all"` (varsayılan) geçerli alındığı gibi davranışı korur.
    - `contextVisibility: "allowlist"` ek bağlamı allowlist'e alınmış gönderenlerle sınırlar.
    - `contextVisibility: "allowlist_quote"`, `allowlist` davranışına ek olarak açık bir alıntı/yanıt istisnasıdır.

    Bu sertleştirme modeli kanallar genelinde tutarlı şekilde uygulanana kadar yüzeye göre farklılıklar bekleyin.

  </Accordion>
</AccordionGroup>

![Grup mesajı akışı](/images/groups-flow.svg)

İstediğiniz şey...

| Hedef                                         | Ayarlanacak değer                                           |
| -------------------------------------------- | ---------------------------------------------------------- |
| Tüm gruplara izin ver ama yalnızca @mention'larda yanıtla | `groups: { "*": { requireMention: true } }`                |
| Tüm grup yanıtlarını devre dışı bırak                    | `groupPolicy: "disabled"`                                  |
| Yalnızca belirli gruplar                                 | `groups: { "<group-id>": { ... } }` (`"*"` anahtarı yok)   |
| Gruplarda yalnızca siz tetikleyebilirsiniz               | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |

## Oturum anahtarları

- Grup oturumları `agent:<agentId>:<channel>:group:<id>` oturum anahtarlarını kullanır (odalar/kanallar `agent:<agentId>:<channel>:channel:<id>` kullanır).
- Telegram forum konuları, her konunun kendi oturumu olması için grup kimliğine `:topic:<threadId>` ekler.
- Doğrudan sohbetler ana oturumu kullanır (veya yapılandırılmışsa gönderen başına).
- Heartbeat'ler grup oturumları için atlanır.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Kalıp: kişisel DM'ler + herkese açık gruplar (tek aracı)

Evet — "kişisel" trafiğiniz **DM'ler** ve "herkese açık" trafiğiniz **gruplar** ise bu iyi çalışır.

Neden: tek aracı modunda DM'ler genellikle **ana** oturum anahtarına (`agent:main:main`) düşerken, gruplar her zaman **ana olmayan** oturum anahtarlarını (`agent:main:<channel>:group:<id>`) kullanır. `mode: "non-main"` ile sandboxing'i etkinleştirirseniz, bu grup oturumları yapılandırılmış sandbox backend'inde çalışırken ana DM oturumunuz host üzerinde kalır. Bir tane seçmezseniz varsayılan backend Docker'dır.

Bu size tek bir aracı "beyni" (paylaşılan çalışma alanı + bellek), ancak iki yürütme duruşu verir:

- **DM'ler**: tüm araçlar (host)
- **Gruplar**: sandbox + kısıtlı araçlar

<Note>
Gerçekten ayrı çalışma alanlarına/persona'lara ihtiyacınız varsa ("kişisel" ve "herkese açık" asla karışmamalıysa), ikinci bir aracı + bindings kullanın. Bkz. [Çok Aracılı Yönlendirme](/tr/concepts/multi-agent).
</Note>

<Tabs>
  <Tab title="Host üzerinde DM'ler, sandbox'a alınmış gruplar">
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
    "Host erişimi yok" yerine "gruplar yalnızca X klasörünü görebilir" istiyor musunuz? `workspaceAccess: "none"` değerini koruyun ve sandbox'a yalnızca allowlist'e alınmış yolları bağlayın:

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
- Bir aracın neden engellendiğini hata ayıklama: [Sandbox vs Araç İlkesi vs Yükseltilmiş](/tr/gateway/sandbox-vs-tool-policy-vs-elevated)
- Bağlama mount ayrıntıları: [Sandboxing](/tr/gateway/sandboxing#custom-bind-mounts)

## Görüntüleme etiketleri

- UI etiketleri kullanılabilir olduğunda `<channel>:<token>` biçiminde biçimlendirilmiş `displayName` kullanır.
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
| `"open"`      | Gruplar allowlist'leri atlar; mention geçidi yine geçerlidir. |
| `"disabled"`  | Tüm grup mesajlarını tamamen engeller.                       |
| `"allowlist"` | Yalnızca yapılandırılmış allowlist ile eşleşen gruplara/odalara izin verir. |

<AccordionGroup>
  <Accordion title="Kanal başına notlar">
    - `groupPolicy`, mention geçidinden ( @mention gerektirir) ayrıdır.
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: `groupAllowFrom` kullanın (geri dönüş: açık `allowFrom`).
    - Signal: `groupAllowFrom`, gelen Signal grup kimliğiyle veya gönderen telefon/UUID değeriyle eşleşebilir.
    - DM eşleştirme onayları (`*-allowFrom` store entries) yalnızca DM erişimi için geçerlidir; grup gönderen yetkilendirmesi grup allowlist'lerine açık kalır.
    - Discord: allowlist `channels.discord.guilds.<id>.channels` kullanır.
    - Slack: allowlist `channels.slack.channels` kullanır.
    - Matrix: allowlist `channels.matrix.groups` kullanır. Oda kimliklerini veya alias'ları tercih edin; katılınmış oda adı araması en iyi çaba yaklaşımıdır ve çözümlenemeyen adlar runtime'da yok sayılır. Gönderenleri kısıtlamak için `channels.matrix.groupAllowFrom` kullanın; oda başına `users` allowlist'leri de desteklenir.
    - Grup DM'leri ayrı denetlenir (`channels.discord.dm.*`, `channels.slack.dm.*`).
    - Telegram allowlist kullanıcı kimlikleriyle (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) veya kullanıcı adlarıyla (`"@alice"` ya da `"alice"`) eşleşebilir; ön ekler büyük/küçük harfe duyarsızdır.
    - Varsayılan `groupPolicy: "allowlist"` değeridir; grup allowlist'iniz boşsa grup mesajları engellenir.
    - Runtime güvenliği: bir provider bloğu tamamen eksik olduğunda (`channels.<provider>` yoksa), grup ilkesi `channels.defaults.groupPolicy` değerini devralmak yerine kapalı kalma moduna (genellikle `allowlist`) geri döner.

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
  <Step title="Mention geçidi">
    Mention geçidi (`requireMention`, `/activation`).
  </Step>
</Steps>

## Mention geçidi (varsayılan)

Aksi grup başına geçersiz kılınmadığı sürece grup mesajları bir mention gerektirir. Varsayılanlar `*.groups."*"` altında alt sistem başına bulunur.

İletişim kanalı yanıt meta verilerini desteklediğinde, bir bot mesajını yanıtlamak örtük bahsetme sayılır. Bir bot mesajından alıntı yapmak da alıntı meta verilerini açığa çıkaran kanallarda örtük bahsetme sayılabilir. Mevcut yerleşik örnekler arasında Telegram, WhatsApp, Slack, Discord, Microsoft Teams ve ZaloUser bulunur.

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
  <Accordion title="Bahsetme geçidi notları">
    - `mentionPatterns` büyük/küçük harfe duyarsız güvenli regex desenleridir; geçersiz desenler ve güvenli olmayan iç içe tekrar biçimleri yok sayılır.
    - Açık bahsetmeler sağlayan yüzeyler yine de geçer; desenler bir yedektir.
    - Agent başına geçersiz kılma: `agents.list[].groupChat.mentionPatterns` (birden çok agent aynı grubu paylaştığında kullanışlıdır).
    - Bahsetme geçidi yalnızca bahsetme algılama mümkün olduğunda uygulanır (yerel bahsetmeler veya `mentionPatterns` yapılandırılmışsa).
    - Bir grubu veya göndereni izin listesine almak bahsetme geçidini devre dışı bırakmaz; tüm mesajların tetiklemesi gerektiğinde o grubun `requireMention` değerini `false` olarak ayarlayın.
    - Grup sohbeti istem bağlamı, çözümlenen sessiz yanıt talimatını her turda taşır; çalışma alanı dosyaları `NO_REPLY` mekaniklerini çoğaltmamalıdır.
    - Sessiz yanıtlara izin verilen gruplar, temiz boş veya yalnızca akıl yürütme içeren model turlarını `NO_REPLY` ile eşdeğer şekilde sessiz kabul eder. Doğrudan sohbetler bunu yalnızca doğrudan sessiz yanıtlara açıkça izin verildiğinde yapar; aksi halde boş yanıtlar başarısız agent turları olarak kalır.
    - Discord varsayılanları `channels.discord.guilds."*"` içinde bulunur (guild/kanal başına geçersiz kılınabilir).
    - Grup geçmişi bağlamı kanallar genelinde tek biçimde sarılır ve **yalnızca bekleyen** kapsamdadır (bahsetme geçidi nedeniyle atlanan mesajlar); küresel varsayılan için `messages.groupChat.historyLimit`, geçersiz kılmalar için `channels.<channel>.historyLimit` (veya `channels.<channel>.accounts.*.historyLimit`) kullanın. Devre dışı bırakmak için `0` ayarlayın.

  </Accordion>
</AccordionGroup>

## Grup/kanal araç kısıtlamaları (isteğe bağlı)

Bazı kanal yapılandırmaları, **belirli bir grup/oda/kanal içinde** hangi araçların kullanılabileceğini kısıtlamayı destekler.

- `tools`: tüm grup için araçlara izin verin/reddedin.
- `toolsBySender`: grup içinde gönderen başına geçersiz kılmalar. Açık anahtar önekleri kullanın: `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` ve `"*"` jokeri. Eski öneksiz anahtarlar hâlâ kabul edilir ve yalnızca `id:` olarak eşleştirilir.

Çözümleme sırası (en spesifik olan kazanır):

<Steps>
  <Step title="Grup toolsBySender">
    Grup/kanal `toolsBySender` eşleşmesi.
  </Step>
  <Step title="Grup araçları">
    Grup/kanal `tools`.
  </Step>
  <Step title="Varsayılan toolsBySender">
    Varsayılan (`"*"`) `toolsBySender` eşleşmesi.
  </Step>
  <Step title="Varsayılan araçlar">
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
Grup/kanal araç kısıtlamaları, küresel/agent araç ilkesine ek olarak uygulanır (reddetme yine de kazanır). Bazı kanallar odalar/kanallar için farklı iç içe yapılar kullanır (ör. Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).
</Note>

## Grup izin listeleri

`channels.whatsapp.groups`, `channels.telegram.groups` veya `channels.imessage.groups` yapılandırıldığında anahtarlar grup izin listesi olarak davranır. Varsayılan bahsetme davranışını ayarlamaya devam ederken tüm gruplara izin vermek için `"*"` kullanın.

<Warning>
Yaygın karışıklık: DM eşleştirme onayı, grup yetkilendirmesiyle aynı değildir. DM eşleştirmeyi destekleyen kanallarda eşleştirme deposu yalnızca DM'lerin kilidini açar. Grup komutları yine de `groupAllowFrom` gibi yapılandırma izin listelerinden veya ilgili kanal için belgelenmiş yapılandırma yedeğinden açık grup gönderen yetkilendirmesi gerektirir.
</Warning>

Yaygın niyetler (kopyala/yapıştır):

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
  <Tab title="Tüm gruplara izin ver ama bahsetme gerektir">
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

Sahip, `channels.whatsapp.allowFrom` ile belirlenir (veya ayarlanmamışsa botun kendi E.164 değeriyle). Komutu tek başına bir mesaj olarak gönderin. Diğer yüzeyler şu anda `/activation` komutunu yok sayar.

## Bağlam alanları

Gelen grup yükleri şunları ayarlar:

- `ChatType=group`
- `GroupSubject` (biliniyorsa)
- `GroupMembers` (biliniyorsa)
- `WasMentioned` (bahsetme geçidi sonucu)
- Telegram forum konuları ayrıca `MessageThreadId` ve `IsForum` içerir.

Kanala özgü notlar:

- BlueBubbles, `GroupMembers` alanını doldurmadan önce adsız macOS grup katılımcılarını yerel Kişiler veritabanından isteğe bağlı olarak zenginleştirebilir. Bu varsayılan olarak kapalıdır ve yalnızca normal grup geçidi geçtikten sonra çalışır.

Agent sistem istemi, yeni bir grup oturumunun ilk turunda bir grup girişi içerir. Modele insan gibi yanıt vermesini, Markdown tablolarından kaçınmasını, boş satırları en aza indirmesini ve normal sohbet aralığını izlemesini, ayrıca düz `\n` dizileri yazmaktan kaçınmasını hatırlatır. Kanal kaynaklı grup adları ve katılımcı etiketleri satır içi sistem talimatları olarak değil, çitle çevrilmiş güvenilmeyen meta veriler olarak işlenir.

## iMessage ayrıntıları

- Yönlendirme veya izin listesine alma sırasında `chat_id:<id>` tercih edin.
- Sohbetleri listele: `imsg chats --limit 20`.
- Grup yanıtları her zaman aynı `chat_id` değerine geri gider.

## WhatsApp sistem istemleri

Grup ve doğrudan istem çözümlemesi, joker davranışı ve hesap geçersiz kılma semantiği dahil olmak üzere kurallı WhatsApp sistem istemi kuralları için [WhatsApp](/tr/channels/whatsapp#system-prompts) bölümüne bakın.

## WhatsApp ayrıntıları

Yalnızca WhatsApp'a özgü davranışlar (geçmiş enjeksiyonu, bahsetme işleme ayrıntıları) için [Grup mesajları](/tr/channels/group-messages) bölümüne bakın.

## İlgili

- [Yayın grupları](/tr/channels/broadcast-groups)
- [Kanal yönlendirme](/tr/channels/channel-routing)
- [Grup mesajları](/tr/channels/group-messages)
- [Eşleştirme](/tr/channels/pairing)
