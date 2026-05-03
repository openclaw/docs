---
read_when:
    - Grup sohbeti davranışını veya etiketleme koşulunu değiştirme
sidebarTitle: Groups
summary: Yüzeyler genelinde grup sohbeti davranışı (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Gruplar
x-i18n:
    generated_at: "2026-05-03T21:27:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6fd4fcaa8335f1dc4b4b1a719d6654ab0c10530f74284269ed6205dd5f87c116
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw, grup sohbetlerini yüzeyler arasında tutarlı biçimde ele alır: Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo.

## Başlangıç tanıtımı (2 dakika)

OpenClaw kendi mesajlaşma hesaplarınızda "yaşar". Ayrı bir WhatsApp bot kullanıcısı yoktur. **Siz** bir gruptaysanız, OpenClaw o grubu görebilir ve orada yanıt verebilir.

Varsayılan davranış:

- Gruplar kısıtlıdır (`groupPolicy: "allowlist"`).
- Bahsetme geçidini açıkça devre dışı bırakmadığınız sürece yanıtlar bir bahsetme gerektirir.
- Gruplarda/kanallarda normal son yanıtlar varsayılan olarak özeldir. Görünür oda çıktısı `message` aracını kullanır.

Çeviri: izin listesindeki gönderenler, OpenClaw’dan bahsederek onu tetikleyebilir.

<Note>
**TL;DR**

- **DM erişimi** `*.allowFrom` ile denetlenir.
- **Grup erişimi** `*.groupPolicy` + izin listeleri (`*.groups`, `*.groupAllowFrom`) ile denetlenir.
- **Yanıt tetikleme** bahsetme geçidi (`requireMention`, `/activation`) ile denetlenir.

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
`openclaw doctor --fix`, bunu atlayan yapılandırılmış kanal yapılandırmalarına bu varsayılanı yazar.
Bu, agent’ın turu yine işlediği ve bellek/oturum durumunu güncelleyebildiği, ancak normal son yanıtının odaya otomatik olarak geri gönderilmediği anlamına gelir. Görünür biçimde konuşmak için agent `message(action=send)` kullanır.

Etkin araç ilkesi altında mesaj aracı kullanılamıyorsa, OpenClaw yanıtı sessizce bastırmak yerine otomatik görünür yanıtlara geri döner.
`openclaw doctor` bu uyumsuzluk hakkında uyarır.

Doğrudan sohbetler ve diğer tüm kaynak turları için aynı yalnızca araçla görünür yanıt davranışını genel olarak uygulamak üzere `messages.visibleReplies: "message_tool"` kullanın. Harness’lar bunu ayarlanmamış varsayılanları olarak da seçebilir; Codex harness bunu Codex modu doğrudan sohbetleri için yapar. `messages.groupChat.visibleReplies`, grup/kanal odaları için daha özel geçersiz kılma olarak kalır.

Bu, çoğu izleme modu turunda modeli `NO_REPLY` yanıtı vermeye zorlayan eski kalıbın yerini alır. Yalnızca araç modunda görünür hiçbir şey yapmamak, basitçe mesaj aracını çağırmamak anlamına gelir.

Agent yalnızca araç modunda çalışırken yazıyor göstergeleri yine gönderilir. Varsayılan grup yazıyor modu bu turlar için "message" yerine "instant" olarak yükseltilir, çünkü agent mesaj aracını çağırıp çağırmayacağına karar vermeden önce normal assistant mesaj metni hiç olmayabilir. Açık yazıyor modu yapılandırması yine önceliklidir.

Grup/kanal odaları için eski otomatik son yanıtları geri yüklemek için:

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "automatic",
    },
  },
}
```

Gateway, dosya kaydedildikten sonra `messages` yapılandırmasını hot-reload eder. Yalnızca dağıtımda dosya izleme veya yapılandırma yeniden yükleme devre dışıysa yeniden başlatın.

Her kaynak sohbet için görünür çıktının mesaj aracı üzerinden geçmesini zorunlu kılmak için:

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

Yerel slash komutları (Discord, Telegram ve yerel komut desteği olan diğer yüzeyler) `visibleReplies: "message_tool"` ayarını atlar ve kanalın yerel komut arayüzünün beklediği yanıtı alması için her zaman görünür biçimde yanıt verir. Bu yalnızca doğrulanmış yerel komut turları için geçerlidir; metin olarak yazılmış `/...` komutları ve sıradan sohbet turları yapılandırılmış grup varsayılanını izlemeye devam eder.

## Bağlam görünürlüğü ve izin listeleri

Grup güvenliğinde iki farklı denetim yer alır:

- **Tetikleme yetkilendirmesi**: agent’ı kim tetikleyebilir (`groupPolicy`, `groups`, `groupAllowFrom`, kanala özel izin listeleri).
- **Bağlam görünürlüğü**: modele hangi ek bağlamın enjekte edildiği (yanıt metni, alıntılar, iş parçacığı geçmişi, iletilmiş metadata).

Varsayılan olarak OpenClaw normal sohbet davranışına öncelik verir ve bağlamı çoğunlukla alındığı gibi tutar. Bu, izin listelerinin öncelikle kimin eylemleri tetikleyebileceğine karar verdiği, her alıntılanmış veya geçmiş snippet için evrensel bir redaksiyon sınırı olmadığı anlamına gelir.

<AccordionGroup>
  <Accordion title="Geçerli davranış kanala özeldir">
    - Bazı kanallar belirli yollarda ek bağlam için zaten gönderene dayalı filtreleme uygular (örneğin Slack iş parçacığı tohumlama, Matrix yanıt/iş parçacığı aramaları).
    - Diğer kanallar alıntı/yanıt/iletme bağlamını hâlâ alındığı gibi geçirir.

  </Accordion>
  <Accordion title="Güçlendirme yönü (planlanıyor)">
    - `contextVisibility: "all"` (varsayılan) mevcut alındığı gibi davranışı korur.
    - `contextVisibility: "allowlist"` ek bağlamı izin listesindeki gönderenlerle filtreler.
    - `contextVisibility: "allowlist_quote"`, bir açık alıntı/yanıt istisnası eklenmiş `allowlist`tir.

    Bu güçlendirme modeli kanallar arasında tutarlı biçimde uygulanana kadar yüzeye göre farklılıklar bekleyin.

  </Accordion>
</AccordionGroup>

![Grup mesajı akışı](/images/groups-flow.svg)

İstediğiniz...

| Hedef                                         | Ayarlanacak değer                                           |
| -------------------------------------------- | ---------------------------------------------------------- |
| Tüm gruplara izin ver ama yalnızca @bahsetmelerde yanıtla | `groups: { "*": { requireMention: true } }`                |
| Tüm grup yanıtlarını devre dışı bırak                    | `groupPolicy: "disabled"`                                  |
| Yalnızca belirli gruplar                                  | `groups: { "<group-id>": { ... } }` (`"*"` anahtarı yok)   |
| Gruplarda yalnızca siz tetikleyebilirsiniz                | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |
| Kanallar arasında tek bir güvenilir gönderen kümesini yeniden kullan | `groupAllowFrom: ["accessGroup:operators"]`                |

Yeniden kullanılabilir gönderen izin listeleri için bkz. [Erişim grupları](/tr/channels/access-groups).

## Oturum anahtarları

- Grup oturumları `agent:<agentId>:<channel>:group:<id>` oturum anahtarlarını kullanır (odalar/kanallar `agent:<agentId>:<channel>:channel:<id>` kullanır).
- Telegram forum konuları grup kimliğine `:topic:<threadId>` ekler, böylece her konunun kendi oturumu olur.
- Doğrudan sohbetler ana oturumu kullanır (veya yapılandırılmışsa gönderen başına).
- Heartbeat’ler grup oturumları için atlanır.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Kalıp: kişisel DM’ler + herkese açık gruplar (tek agent)

Evet — "kişisel" trafiğiniz **DM’ler**, "herkese açık" trafiğiniz ise **gruplar** ise bu iyi çalışır.

Neden: tek agent modunda DM’ler genellikle **ana** oturum anahtarına (`agent:main:main`) düşerken, gruplar her zaman **ana olmayan** oturum anahtarlarını (`agent:main:<channel>:group:<id>`) kullanır. `mode: "non-main"` ile sandboxing’i etkinleştirirseniz, bu grup oturumları yapılandırılmış sandbox backend’inde çalışırken ana DM oturumunuz host üzerinde kalır. Birini seçmezseniz Docker varsayılan backend’dir.

Bu size tek bir agent "beyni" (paylaşılan çalışma alanı + bellek), ancak iki yürütme duruşu verir:

- **DM’ler**: tam araçlar (host)
- **Gruplar**: sandbox + kısıtlı araçlar

<Note>
Gerçekten ayrı çalışma alanlarına/persona’lara ihtiyacınız varsa ("kişisel" ve "herkese açık" asla karışmamalıysa), ikinci bir agent + bağlamalar kullanın. Bkz. [Multi-Agent Routing](/tr/concepts/multi-agent).
</Note>

<Tabs>
  <Tab title="DM’ler host üzerinde, gruplar sandbox içinde">
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
  <Tab title="Gruplar yalnızca izin listesindeki bir klasörü görür">
    "Host erişimi yok" yerine "gruplar yalnızca X klasörünü görebilir" mi istiyorsunuz? `workspaceAccess: "none"` değerini koruyun ve yalnızca izin listesindeki yolları sandbox içine bağlayın:

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
- Bir aracın neden engellendiğini debug etme: [Sandbox vs Araç İlkesi vs Elevated](/tr/gateway/sandbox-vs-tool-policy-vs-elevated)
- Bind mount ayrıntıları: [Sandboxing](/tr/gateway/sandboxing#custom-bind-mounts)

## Görünen etiketler

- UI etiketleri, varsa `displayName` kullanır ve `<channel>:<token>` olarak biçimlendirilir.
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

| İlke         | Davranış                                                     |
| ------------- | ------------------------------------------------------------ |
| `"open"`      | Gruplar izin listelerini atlar; bahsetme geçidi yine uygulanır. |
| `"disabled"`  | Tüm grup mesajlarını tamamen engeller.                       |
| `"allowlist"` | Yalnızca yapılandırılmış izin listesiyle eşleşen gruplara/odalara izin verir. |

<AccordionGroup>
  <Accordion title="Kanal başına notlar">
    - `groupPolicy`, bahsetme geçidinden ayrıdır (bu @bahsetmeleri gerektirir).
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: `groupAllowFrom` kullanın (fallback: açık `allowFrom`).
    - Signal: `groupAllowFrom`, gelen Signal grup kimliğiyle veya gönderen telefon/UUID ile eşleşebilir.
    - DM eşleştirme onayları (`*-allowFrom` store girdileri) yalnızca DM erişimine uygulanır; grup gönderen yetkilendirmesi grup izin listelerine açık kalır.
    - Discord: izin listesi `channels.discord.guilds.<id>.channels` kullanır.
    - Slack: izin listesi `channels.slack.channels` kullanır.
    - Matrix: izin listesi `channels.matrix.groups` kullanır. Oda kimliklerini veya alias’ları tercih edin; katılınmış oda adı araması best-effort’tır ve çözümlenmeyen adlar runtime’da yok sayılır. Gönderenleri kısıtlamak için `channels.matrix.groupAllowFrom` kullanın; oda başına `users` izin listeleri de desteklenir.
    - Grup DM’leri ayrı denetlenir (`channels.discord.dm.*`, `channels.slack.dm.*`).
    - Telegram izin listesi kullanıcı kimlikleriyle (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) veya kullanıcı adlarıyla (`"@alice"` ya da `"alice"`) eşleşebilir; önekler büyük/küçük harfe duyarsızdır.
    - Varsayılan `groupPolicy: "allowlist"`tir; grup izin listeniz boşsa grup mesajları engellenir.
    - Runtime güvenliği: bir sağlayıcı bloğu tamamen eksik olduğunda (`channels.<provider>` yoksa), grup ilkesi `channels.defaults.groupPolicy` değerini devralmak yerine fail-closed moduna (genellikle `allowlist`) geri döner.

  </Accordion>
</AccordionGroup>

Hızlı zihinsel model (grup iletileri için değerlendirme sırası):

<Steps>
  <Step title="groupPolicy">
    `groupPolicy` (açık/devre dışı/izin listesi).
  </Step>
  <Step title="Group allowlists">
    Grup izin listeleri (`*.groups`, `*.groupAllowFrom`, kanala özgü izin listesi).
  </Step>
  <Step title="Mention gating">
    Bahsetme denetimi (`requireMention`, `/activation`).
  </Step>
</Steps>

## Bahsetme denetimi (varsayılan)

Grup iletileri, grup başına geçersiz kılınmadıkça bir bahsetme gerektirir. Varsayılanlar her alt sistem için `*.groups."*"` altında bulunur.

Kanal yanıt meta verilerini desteklediğinde, bir bot iletisine yanıt vermek örtük bir bahsetme sayılır. Bir bot iletisini alıntılamak da alıntı meta verilerini sunan kanallarda örtük bir bahsetme sayılabilir. Geçerli yerleşik durumlar Telegram, WhatsApp, Slack, Discord, Microsoft Teams ve ZaloUser içerir.

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
    - `mentionPatterns` büyük/küçük harfe duyarsız güvenli regex desenleridir; geçersiz desenler ve güvenli olmayan iç içe tekrar biçimleri yok sayılır.
    - Açık bahsetmeler sağlayan yüzeyler yine de geçer; desenler bir yedektir.
    - Ajan başına geçersiz kılma: `agents.list[].groupChat.mentionPatterns` (birden fazla ajan aynı grubu paylaştığında kullanışlıdır).
    - Bahsetme denetimi yalnızca bahsetme algılama mümkün olduğunda uygulanır (yerel bahsetmeler veya `mentionPatterns` yapılandırılmıştır).
    - Bir grubu veya göndereni izin listesine almak bahsetme denetimini devre dışı bırakmaz; tüm iletiler tetiklemeliyse o grubun `requireMention` değerini `false` olarak ayarlayın.
    - Grup sohbeti istem bağlamı her turda çözümlenmiş sessiz yanıt talimatını taşır; çalışma alanı dosyaları `NO_REPLY` mekaniklerini yinelememelidir.
    - Sessiz yanıtlara izin verilen gruplar, temiz boş veya yalnızca akıl yürütme içeren model turlarını `NO_REPLY` ile eşdeğer sessiz yanıt olarak ele alır. Doğrudan sohbetler bunu yalnızca doğrudan sessiz yanıtlara açıkça izin verildiğinde aynı şekilde yapar; aksi takdirde boş yanıtlar başarısız ajan turları olarak kalır.
    - Discord varsayılanları `channels.discord.guilds."*"` içinde bulunur (sunucu/kanal başına geçersiz kılınabilir).
    - Grup geçmişi bağlamı kanallar arasında tek tip sarılır ve **yalnızca beklemede olanları** içerir (bahsetme denetimi nedeniyle atlanan iletiler); genel varsayılan için `messages.groupChat.historyLimit`, geçersiz kılmalar için `channels.<channel>.historyLimit` (veya `channels.<channel>.accounts.*.historyLimit`) kullanın. Devre dışı bırakmak için `0` ayarlayın.

  </Accordion>
</AccordionGroup>

## Grup/kanal araç kısıtlamaları (isteğe bağlı)

Bazı kanal yapılandırmaları, **belirli bir grup/oda/kanal içinde** hangi araçların kullanılabileceğini kısıtlamayı destekler.

- `tools`: tüm grup için araçlara izin ver/reddet.
- `toolsBySender`: grup içindeki gönderen başına geçersiz kılmalar. Açık anahtar önekleri kullanın: `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` ve `"*"` joker karakteri. Eski öneksiz anahtarlar hâlâ kabul edilir ve yalnızca `id:` olarak eşleştirilir.

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
Grup/kanal araç kısıtlamaları, genel/ajan araç politikasına ek olarak uygulanır (reddetme yine kazanır). Bazı kanallar odalar/kanallar için farklı iç içe yerleşim kullanır (ör. Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).
</Note>

## Grup izin listeleri

`channels.whatsapp.groups`, `channels.telegram.groups` veya `channels.imessage.groups` yapılandırıldığında, anahtarlar bir grup izin listesi gibi davranır. Varsayılan bahsetme davranışını ayarlamaya devam ederken tüm gruplara izin vermek için `"*"` kullanın.

<Warning>
Yaygın karışıklık: DM eşleştirme onayı grup yetkilendirmesiyle aynı değildir. DM eşleştirmesini destekleyen kanallarda eşleştirme deposu yalnızca DM'lerin kilidini açar. Grup komutları yine de `groupAllowFrom` veya o kanal için belgelenmiş yapılandırma yedeği gibi yapılandırma izin listelerinden açık grup gönderen yetkilendirmesi gerektirir.
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

Sahip, `channels.whatsapp.allowFrom` tarafından belirlenir (ayarlanmamışsa botun kendi E.164 numarası kullanılır). Komutu bağımsız bir ileti olarak gönderin. Diğer yüzeyler şu anda `/activation` komutunu yok sayar.

## Bağlam alanları

Grup gelen yükleri şunları ayarlar:

- `ChatType=group`
- `GroupSubject` (biliniyorsa)
- `GroupMembers` (biliniyorsa)
- `WasMentioned` (bahsetme denetimi sonucu)
- Telegram forum konuları ayrıca `MessageThreadId` ve `IsForum` içerir.

Kanala özgü notlar:

- BlueBubbles, `GroupMembers` doldurulmadan önce adlandırılmamış macOS grup katılımcılarını isteğe bağlı olarak yerel Kişiler veritabanından zenginleştirebilir. Bu varsayılan olarak kapalıdır ve yalnızca normal grup denetimi geçtikten sonra çalışır.

Ajan sistem istemi, yeni bir grup oturumunun ilk turunda bir grup girişi içerir. Modele insan gibi yanıt vermesini, Markdown tablolarından kaçınmasını, boş satırları en aza indirmesini ve normal sohbet aralığını izlemesini, ayrıca literal `\n` dizileri yazmaktan kaçınmasını hatırlatır. Kanaldan gelen grup adları ve katılımcı etiketleri satır içi sistem talimatları olarak değil, çitle çevrilmiş güvenilmeyen meta veriler olarak işlenir.

## iMessage ayrıntıları

- Yönlendirme veya izin listesine alma sırasında `chat_id:<id>` tercih edin.
- Sohbetleri listele: `imsg chats --limit 20`.
- Grup yanıtları her zaman aynı `chat_id` değerine geri döner.

## WhatsApp sistem istemleri

Grup ve doğrudan istem çözümlemesi, joker karakter davranışı ve hesap geçersiz kılma semantiği dahil olmak üzere kanonik WhatsApp sistem istemi kuralları için [WhatsApp](/tr/channels/whatsapp#system-prompts) bölümüne bakın.

## WhatsApp ayrıntıları

Yalnızca WhatsApp davranışı (geçmiş ekleme, bahsetme işleme ayrıntıları) için [Grup iletileri](/tr/channels/group-messages) bölümüne bakın.

## İlgili

- [Yayın grupları](/tr/channels/broadcast-groups)
- [Kanal yönlendirme](/tr/channels/channel-routing)
- [Grup iletileri](/tr/channels/group-messages)
- [Eşleştirme](/tr/channels/pairing)
