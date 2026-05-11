---
read_when:
    - Grup sohbeti davranışını veya bahsetme denetimini değiştirme
sidebarTitle: Groups
summary: Yüzeyler genelinde grup sohbeti davranışı (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Gruplar
x-i18n:
    generated_at: "2026-05-11T20:20:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 19297ef9c3043b00c4785567a7c02266bd08fe5228c8275c3233e87e917dd09f
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw grup sohbetlerini yüzeyler arasında tutarlı şekilde ele alır: Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo.

## Başlangıç tanıtımı (2 dakika)

OpenClaw kendi mesajlaşma hesaplarınızda "yaşar". Ayrı bir WhatsApp bot kullanıcısı yoktur. Bir grupta **siz** varsa, OpenClaw o grubu görebilir ve orada yanıt verebilir.

Varsayılan davranış:

- Gruplar kısıtlanır (`groupPolicy: "allowlist"`).
- Bahsetme kısıtlamasını açıkça devre dışı bırakmadığınız sürece yanıtlar bahsetme gerektirir.
- Gruplarda/kanallarda normal nihai yanıtlar varsayılan olarak özeldir. Görünür oda çıktısı `message` aracını kullanır.

Çeviri: izin verilenler listesindeki gönderenler, ondan bahsederek OpenClaw’ı tetikleyebilir.

<Note>
**Özet**

- **DM erişimi** `*.allowFrom` ile denetlenir.
- **Grup erişimi** `*.groupPolicy` + izin listeleri (`*.groups`, `*.groupAllowFrom`) ile denetlenir.
- **Yanıt tetikleme** bahsetme kısıtlaması (`requireMention`, `/activation`) ile denetlenir.

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
Bu, aracının yine de sırayı işlediği ve bellek/oturum durumunu güncelleyebildiği, ancak normal nihai yanıtının otomatik olarak odaya geri gönderilmediği anlamına gelir. Görünür şekilde konuşmak için aracı `message(action=send)` kullanır.

Bu varsayılan, araçları güvenilir şekilde çağıran bir model/çalışma zamanına bağlıdır. Günlükler
asistan metni gösteriyor ama `didSendViaMessagingTool: false` ise model, mesaj aracını
çağırmak yerine özel olarak yanıtlamıştır. Bu bir Discord/Slack/Telegram gönderme hatası
değildir. Grup/kanal oturumları için araç çağrısında güvenilir bir model kullanın veya eski görünür
nihai yanıtları geri getirmek için
`messages.groupChat.visibleReplies: "automatic"` ayarlayın.

Mesaj aracı etkin araç ilkesi altında kullanılamıyorsa OpenClaw yanıtı sessizce bastırmak yerine
otomatik görünür yanıtlara geri döner.
`openclaw doctor` bu uyumsuzluk hakkında uyarır.

Doğrudan sohbetler ve diğer tüm kaynak sıraları için aynı yalnızca araçla görünür yanıt davranışını genel olarak uygulamak üzere `messages.visibleReplies: "message_tool"` kullanın. Harness’ler bunu ayarlanmamış varsayılanları olarak da seçebilir; Codex harness bunu Codex modu doğrudan sohbetler için yapar. `messages.groupChat.visibleReplies`, grup/kanal odaları için daha özel geçersiz kılma olarak kalır.

Bu, çoğu gözlem modu sırası için modeli `NO_REPLY` yanıtı vermeye zorlamaya dayalı eski kalıbın yerini alır. Yalnızca araç modunda görünür hiçbir şey yapmamak, basitçe mesaj aracını çağırmamak anlamına gelir.

Aracı yalnızca araç modunda çalışırken yazıyor göstergeleri yine de gönderilir. Bu sıralar için varsayılan grup yazıyor modu "message" yerine "instant" olarak yükseltilir, çünkü aracı mesaj aracını çağırıp çağırmayacağına karar vermeden önce normal asistan mesaj metni hiç olmayabilir. Açık yazıyor modu yapılandırması yine de önceliklidir.

Grup/kanal odaları için eski otomatik nihai yanıtları geri getirmek için:

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "automatic",
    },
  },
}
```

Gateway, dosya kaydedildikten sonra `messages` yapılandırmasını canlı yeniden yükler. Yalnızca
dağıtımda dosya izleme veya yapılandırma yeniden yükleme devre dışıysa yeniden başlatın.

Her kaynak sohbet için görünür çıktının mesaj aracından geçmesini zorunlu kılmak üzere:

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

Yerel eğik çizgi komutları (Discord, Telegram ve yerel komut desteği olan diğer yüzeyler) `visibleReplies: "message_tool"` ayarını atlar ve kanalın yerel komut kullanıcı arayüzünün beklediği yanıtı alması için her zaman görünür şekilde yanıt verir. Bu yalnızca doğrulanmış yerel komut sıraları için geçerlidir; metin olarak yazılan `/...` komutları ve sıradan sohbet sıraları yapılandırılmış grup varsayılanını izlemeye devam eder.

## Bağlam görünürlüğü ve izin listeleri

Grup güvenliği için iki farklı denetim söz konusudur:

- **Tetikleme yetkilendirmesi**: aracı kim tetikleyebilir (`groupPolicy`, `groups`, `groupAllowFrom`, kanala özgü izin listeleri).
- **Bağlam görünürlüğü**: modele hangi ek bağlam enjekte edilir (yanıt metni, alıntılar, konu geçmişi, iletilmiş üst veriler).

OpenClaw varsayılan olarak normal sohbet davranışına öncelik verir ve bağlamı çoğunlukla alındığı gibi tutar. Bu, izin listelerinin öncelikle eylemleri kimin tetikleyebileceğine karar verdiği, her alıntılanmış veya geçmiş parçacık için evrensel bir redaksiyon sınırı olmadığı anlamına gelir.

<AccordionGroup>
  <Accordion title="Geçerli davranış kanala özgüdür">
    - Bazı kanallar, belirli yollarda ek bağlam için zaten gönderen tabanlı filtreleme uygular (örneğin Slack konu başlatma, Matrix yanıt/konu aramaları).
    - Diğer kanallar alıntı/yanıt/iletme bağlamını alındığı gibi geçirmeye devam eder.

  </Accordion>
  <Accordion title="Sertleştirme yönü (planlanan)">
    - `contextVisibility: "all"` (varsayılan) geçerli alındığı gibi davranışı korur.
    - `contextVisibility: "allowlist"` ek bağlamı izin listesindeki gönderenlere filtreler.
    - `contextVisibility: "allowlist_quote"`, `allowlist` artı bir açık alıntı/yanıt istisnasıdır.

    Bu sertleştirme modeli kanallar arasında tutarlı şekilde uygulanana kadar yüzeye göre farklılıklar bekleyin.

  </Accordion>
</AccordionGroup>

![Grup mesajı akışı](/images/groups-flow.svg)

İstediğiniz...

| Hedef                                        | Ayarlanacak şey                                             |
| -------------------------------------------- | ---------------------------------------------------------- |
| Tüm gruplara izin ver ama yalnızca @bahsetmelerde yanıtla | `groups: { "*": { requireMention: true } }`                |
| Tüm grup yanıtlarını devre dışı bırak        | `groupPolicy: "disabled"`                                  |
| Yalnızca belirli gruplar                     | `groups: { "<group-id>": { ... } }` (`"*"` anahtarı yok)   |
| Gruplarda yalnızca siz tetikleyebilirsiniz   | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |
| Kanallar arasında tek bir güvenilen gönderen kümesini yeniden kullan | `groupAllowFrom: ["accessGroup:operators"]`                |

Yeniden kullanılabilir gönderen izin listeleri için bkz. [Erişim grupları](/tr/channels/access-groups).

## Oturum anahtarları

- Grup oturumları `agent:<agentId>:<channel>:group:<id>` oturum anahtarlarını kullanır (odalar/kanallar `agent:<agentId>:<channel>:channel:<id>` kullanır).
- Telegram forum konuları grup kimliğine `:topic:<threadId>` ekler, böylece her konunun kendi oturumu olur.
- Doğrudan sohbetler ana oturumu kullanır (veya yapılandırılmışsa gönderen başına).
- Heartbeat’ler grup oturumları için atlanır.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Kalıp: kişisel DM’ler + genel gruplar (tek aracı)

Evet, "kişisel" trafiğiniz **DM’ler** ve "genel" trafiğiniz **gruplar** ise bu iyi çalışır.

Nedeni: tek aracı modunda DM’ler genellikle **ana** oturum anahtarına (`agent:main:main`) düşerken, gruplar her zaman **ana olmayan** oturum anahtarlarını (`agent:main:<channel>:group:<id>`) kullanır. `mode: "non-main"` ile sandbox kullanımını etkinleştirirseniz bu grup oturumları yapılandırılmış sandbox arka ucunda çalışır, ana DM oturumunuz ise ana makinede kalır. Birini seçmezseniz varsayılan arka uç Docker’dır.

Bu size tek bir aracı "beyni" (paylaşılan çalışma alanı + bellek), ancak iki yürütme duruşu verir:

- **DM’ler**: tam araçlar (ana makine)
- **Gruplar**: sandbox + kısıtlı araçlar

<Note>
Gerçekten ayrı çalışma alanlarına/kişiliklere ihtiyacınız varsa ("kişisel" ve "genel" asla karışmamalıysa), ikinci bir aracı + bağlamalar kullanın. Bkz. [Çok Aracılı Yönlendirme](/tr/concepts/multi-agent).
</Note>

<Tabs>
  <Tab title="DM’ler ana makinede, gruplar sandbox’ta">
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
  <Tab title="Gruplar yalnızca izin verilenler listesindeki bir klasörü görür">
    "ana makine erişimi yok" yerine "gruplar yalnızca X klasörünü görebilir" mi istiyorsunuz? `workspaceAccess: "none"` ayarını koruyun ve yalnızca izin verilenler listesindeki yolları sandbox içine bağlayın:

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
- Bir aracın neden engellendiğini hata ayıklama: [Sandbox ve Araç İlkesi ve Elevated](/tr/gateway/sandbox-vs-tool-policy-vs-elevated)
- Bağlama noktası ayrıntıları: [Sandbox kullanımı](/tr/gateway/sandboxing#custom-bind-mounts)

## Görünen etiketler

- Kullanıcı arayüzü etiketleri varsa `displayName` kullanır ve `<channel>:<token>` olarak biçimlendirilir.
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
| `"open"`      | Gruplar izin listelerini atlar; bahsetme kısıtlaması yine de uygulanır. |
| `"disabled"`  | Tüm grup mesajlarını tamamen engeller.                       |
| `"allowlist"` | Yalnızca yapılandırılmış izin listesiyle eşleşen gruplara/odalara izin verir. |

<AccordionGroup>
  <Accordion title="Per-channel notes">
    - `groupPolicy`, bahsetme kapısından ayrıdır (@bahsetmeleri gerektirir).
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: `groupAllowFrom` kullanın (geri dönüş: açık `allowFrom`).
    - Signal: `groupAllowFrom`, gelen Signal grup kimliğiyle veya gönderen telefon/UUID değeriyle eşleşebilir.
    - DM eşleştirme onayları (`*-allowFrom` depo girdileri) yalnızca DM erişimi için geçerlidir; grup gönderen yetkilendirmesi grup izin listelerinde açık kalır.
    - Discord: izin listesi `channels.discord.guilds.<id>.channels` kullanır.
    - Slack: izin listesi `channels.slack.channels` kullanır.
    - Matrix: izin listesi `channels.matrix.groups` kullanır. Oda kimliklerini veya takma adları tercih edin; katılınmış oda adı araması en iyi çaba temelindedir ve çözümlenmeyen adlar çalışma zamanında yok sayılır. Gönderenleri kısıtlamak için `channels.matrix.groupAllowFrom` kullanın; oda başına `users` izin listeleri de desteklenir.
    - Grup DM'leri ayrı denetlenir (`channels.discord.dm.*`, `channels.slack.dm.*`).
    - Telegram izin listesi kullanıcı kimlikleriyle (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) veya kullanıcı adlarıyla (`"@alice"` ya da `"alice"`) eşleşebilir; önekler büyük/küçük harfe duyarsızdır.
    - Varsayılan `groupPolicy: "allowlist"` değeridir; grup izin listeniz boşsa grup mesajları engellenir.
    - Çalışma zamanı güvenliği: bir sağlayıcı bloğu tamamen eksik olduğunda (`channels.<provider>` yoksa), grup politikası `channels.defaults.groupPolicy` değerini devralmak yerine kapalı hata moduna (genellikle `allowlist`) geri döner.

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
    Bahsetme kapısı (`requireMention`, `/activation`).
  </Step>
</Steps>

## Bahsetme kapısı (varsayılan)

Grup mesajları, grup bazında geçersiz kılınmadıkça bir bahsetme gerektirir. Varsayılanlar her alt sistemde `*.groups."*"` altında bulunur.

Kanal yanıt meta verilerini desteklediğinde bir bot mesajına yanıt vermek örtük bir bahsetme sayılır. Bir bot mesajını alıntılamak da alıntı meta verilerini açığa çıkaran kanallarda örtük bir bahsetme sayılabilir. Mevcut yerleşik durumlar Telegram, WhatsApp, Slack, Discord, Microsoft Teams ve ZaloUser içerir.

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
    - `mentionPatterns`, büyük/küçük harfe duyarsız güvenli regex desenleridir; geçersiz desenler ve güvenli olmayan iç içe yineleme biçimleri yok sayılır.
    - Açık bahsetmeler sağlayan yüzeyler yine de geçer; desenler bir geri dönüştür.
    - Ajan başına geçersiz kılma: `agents.list[].groupChat.mentionPatterns` (birden fazla ajan bir grubu paylaştığında kullanışlıdır).
    - Bahsetme kapısı yalnızca bahsetme algılaması mümkün olduğunda (yerel bahsetmeler veya `mentionPatterns` yapılandırıldığında) uygulanır.
    - Bir grubu veya göndereni izin listesine almak bahsetme kapısını devre dışı bırakmaz; tüm mesajların tetiklemesi gerektiğinde o grubun `requireMention` değerini `false` olarak ayarlayın.
    - Grup sohbeti istem bağlamı, çözümlenmiş sessiz yanıt talimatını her turda taşır; çalışma alanı dosyaları `NO_REPLY` mekaniklerini çoğaltmamalıdır.
    - Sessiz yanıtlara izin verilen gruplar, temiz boş veya yalnızca akıl yürütme içeren model turlarını `NO_REPLY` ile eşdeğer biçimde sessiz kabul eder. Doğrudan sohbetler bunu yalnızca doğrudan sessiz yanıtlara açıkça izin verildiğinde yapar; aksi halde boş yanıtlar başarısız ajan turları olarak kalır.
    - Discord varsayılanları `channels.discord.guilds."*"` içinde bulunur (lonca/kanal bazında geçersiz kılınabilir).
    - Grup geçmişi bağlamı kanallar arasında tek biçimde sarmalanır. Bahsetme kapılı gruplar bekleyen atlanmış mesajları tutar; her zaman açık gruplar, kanal desteklediğinde yakın zamanda işlenmiş oda mesajlarını da saklayabilir. Genel varsayılan için `messages.groupChat.historyLimit`, geçersiz kılmalar için `channels.<channel>.historyLimit` (veya `channels.<channel>.accounts.*.historyLimit`) kullanın. Devre dışı bırakmak için `0` ayarlayın.

  </Accordion>
</AccordionGroup>

## Grup/kanal araç kısıtlamaları (isteğe bağlı)

Bazı kanal yapılandırmaları, **belirli bir grup/oda/kanal içinde** hangi araçların kullanılabilir olduğunu kısıtlamayı destekler.

- `tools`: tüm grup için araçlara izin ver/araçları reddet.
- `toolsBySender`: grup içinde gönderen başına geçersiz kılmalar. Açık anahtar önekleri kullanın: `channel:<channelId>:<senderId>`, `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` ve `"*"` joker karakteri. Kanal kimlikleri kanonik OpenClaw kanal kimliklerini kullanır; `teams` gibi takma adlar `msteams` olarak normalize edilir. Eski öneksiz anahtarlar hâlâ kabul edilir ve yalnızca `id:` olarak eşleştirilir.

Çözüm sırası (en özgül olan kazanır):

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
Grup/kanal araç kısıtlamaları global/ajan araç politikasına ek olarak uygulanır (reddetme yine de kazanır). Bazı kanallar odalar/kanallar için farklı iç içe yapılar kullanır (ör. Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).
</Note>

## Grup izin listeleri

`channels.whatsapp.groups`, `channels.telegram.groups` veya `channels.imessage.groups` yapılandırıldığında, anahtarlar bir grup izin listesi görevi görür. Varsayılan bahsetme davranışını ayarlamaya devam ederken tüm gruplara izin vermek için `"*"` kullanın.

<Warning>
Yaygın karışıklık: DM eşleştirme onayı grup yetkilendirmesiyle aynı değildir. DM eşleştirmeyi destekleyen kanallarda eşleştirme deposu yalnızca DM'lerin kilidini açar. Grup komutları yine de `groupAllowFrom` gibi yapılandırma izin listelerinden veya o kanal için belgelenmiş yapılandırma geri dönüşünden açık grup gönderen yetkilendirmesi gerektirir.
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

Grup sahipleri, grup başına etkinleştirmeyi değiştirebilir:

- `/activation mention`
- `/activation always`

Sahip, `channels.whatsapp.allowFrom` tarafından (veya ayarlanmamışsa botun kendi E.164 değeriyle) belirlenir. Komutu bağımsız bir mesaj olarak gönderin. Diğer yüzeyler şu anda `/activation` değerini yok sayar.

## Bağlam alanları

Gelen grup yükleri şunları ayarlar:

- `ChatType=group`
- `GroupSubject` (biliniyorsa)
- `GroupMembers` (biliniyorsa)
- `WasMentioned` (bahsetme kapısı sonucu)
- Telegram forum konuları ayrıca `MessageThreadId` ve `IsForum` içerir.

Ajan sistem istemi, yeni bir grup oturumunun ilk turunda bir grup girişi içerir. Modele insan gibi yanıt vermesini, Markdown tablolarından kaçınmasını, boş satırları en aza indirip normal sohbet aralığını izlemesini ve düz `\n` dizileri yazmaktan kaçınmasını hatırlatır. Kanal kaynaklı grup adları ve katılımcı etiketleri satır içi sistem talimatları olarak değil, çitlenmiş güvenilmeyen meta veriler olarak işlenir.

## iMessage ayrıntıları

- Yönlendirme veya izin listesine alma sırasında `chat_id:<id>` tercih edin.
- Sohbetleri listele: `imsg chats --limit 20`.
- Grup yanıtları her zaman aynı `chat_id` değerine geri gider.

## WhatsApp sistem istemleri

Grup ve doğrudan istem çözümlemesi, joker davranışı ve hesap geçersiz kılma semantiği dahil kanonik WhatsApp sistem istemi kuralları için [WhatsApp](/tr/channels/whatsapp#system-prompts) bölümüne bakın.

## WhatsApp ayrıntıları

Yalnızca WhatsApp davranışı (geçmiş ekleme, bahsetme işleme ayrıntıları) için [Grup mesajları](/tr/channels/group-messages) bölümüne bakın.

## İlgili

- [Yayın grupları](/tr/channels/broadcast-groups)
- [Kanal yönlendirme](/tr/channels/channel-routing)
- [Grup mesajları](/tr/channels/group-messages)
- [Eşleştirme](/tr/channels/pairing)
