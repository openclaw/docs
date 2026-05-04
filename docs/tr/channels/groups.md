---
read_when:
    - Grup sohbeti davranışını veya bahsetme kapılamasını değiştirme
sidebarTitle: Groups
summary: Yüzeyler genelinde grup sohbeti davranışı (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Gruplar
x-i18n:
    generated_at: "2026-05-04T02:21:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: dea506c011a5d8f6155b2f56aacb236482cb8c5b7457001cb2171fd45932443d
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw grup sohbetlerini yüzeyler genelinde tutarlı şekilde ele alır: Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo.

## Başlangıç tanıtımı (2 dakika)

OpenClaw kendi mesajlaşma hesaplarınızda "yaşar". Ayrı bir WhatsApp bot kullanıcısı yoktur. Bir grupta **siz** varsa, OpenClaw o grubu görebilir ve orada yanıt verebilir.

Varsayılan davranış:

- Gruplar kısıtlanır (`groupPolicy: "allowlist"`).
- Açıkça bahsetme kapısını devre dışı bırakmadığınız sürece yanıtlar bahsetme gerektirir.
- Gruplarda/kanallarda normal nihai yanıtlar varsayılan olarak özeldir. Görünür oda çıktısı `message` aracını kullanır.

Çeviri: izin listesindeki gönderenler, OpenClaw’dan bahsederek onu tetikleyebilir.

<Note>
**Kısaca**

- **DM erişimi** `*.allowFrom` ile kontrol edilir.
- **Grup erişimi** `*.groupPolicy` + izin listeleri (`*.groups`, `*.groupAllowFrom`) ile kontrol edilir.
- **Yanıt tetikleme** bahsetme kapısı (`requireMention`, `/activation`) ile kontrol edilir.

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
`openclaw doctor --fix`, bunu eksik bırakan yapılandırılmış kanal yapılandırmalarına bu varsayılanı yazar.
Bu, aracının turu hâlâ işlediği ve bellek/oturum durumunu güncelleyebildiği, ancak normal nihai yanıtının odaya otomatik olarak geri gönderilmediği anlamına gelir. Görünür şekilde konuşmak için aracı `message(action=send)` kullanır.

Bu varsayılan, araçları güvenilir şekilde çağıran bir modele/çalışma zamanına bağlıdır. Günlükler asistan metni gösteriyor ama `didSendViaMessagingTool: false` ise model, mesaj aracını çağırmak yerine özel olarak yanıtlamıştır. Bu bir Discord/Slack/Telegram gönderme hatası değildir. Grup/kanal oturumları için araç çağrısında güvenilir bir model kullanın veya eski görünür nihai yanıtları geri getirmek için `messages.groupChat.visibleReplies: "automatic"` ayarlayın.

Mesaj aracı etkin araç ilkesi altında kullanılamıyorsa OpenClaw, yanıtı sessizce bastırmak yerine otomatik görünür yanıtlara geri döner.
`openclaw doctor` bu uyumsuzluk hakkında uyarır.

Doğrudan sohbetler ve diğer tüm kaynak turları için aynı yalnızca-araç görünür yanıt davranışını genel olarak uygulamak üzere `messages.visibleReplies: "message_tool"` kullanın. Test düzenekleri bunu ayarlanmamış varsayılanları olarak da seçebilir; Codex düzeneği Codex modu doğrudan sohbetleri için bunu yapar. `messages.groupChat.visibleReplies`, grup/kanal odaları için daha özel geçersiz kılma olarak kalır.

Bu, çoğu bekleme modu turunda modeli `NO_REPLY` yanıtını vermeye zorlayan eski kalıbın yerini alır. Yalnızca araç modunda görünür hiçbir şey yapmamak, basitçe mesaj aracını çağırmamak anlamına gelir.

Aracı yalnızca araç modunda çalışırken yazıyor göstergeleri hâlâ gönderilir. Bu turlar için varsayılan grup yazıyor modu "message" değerinden "instant" değerine yükseltilir, çünkü aracı mesaj aracını çağırıp çağırmayacağına karar vermeden önce normal asistan mesaj metni hiç oluşmayabilir. Açık yazıyor modu yapılandırması yine önceliklidir.

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

Gateway, dosya kaydedildikten sonra `messages` yapılandırmasını sıcak yeniden yükler. Yalnızca dağıtımda dosya izleme veya yapılandırma yeniden yükleme devre dışıysa yeniden başlatın.

Her kaynak sohbet için görünür çıktının mesaj aracı üzerinden gitmesini zorunlu kılmak için:

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

Yerel eğik çizgi komutları (Discord, Telegram ve yerel komut desteği olan diğer yüzeyler) `visibleReplies: "message_tool"` ayarını atlar ve kanalın yerel komut kullanıcı arayüzünün beklediği yanıtı alması için her zaman görünür şekilde yanıt verir. Bu yalnızca doğrulanmış yerel komut turları için geçerlidir; metin olarak yazılan `/...` komutları ve sıradan sohbet turları yapılandırılmış grup varsayılanını izlemeye devam eder.

## Bağlam görünürlüğü ve izin listeleri

Grup güvenliğinde iki farklı kontrol yer alır:

- **Tetikleme yetkilendirmesi**: aracıyı kimlerin tetikleyebileceği (`groupPolicy`, `groups`, `groupAllowFrom`, kanala özgü izin listeleri).
- **Bağlam görünürlüğü**: modele hangi ek bağlamın enjekte edildiği (yanıt metni, alıntılar, iş parçacığı geçmişi, iletilmiş üst veriler).

OpenClaw varsayılan olarak normal sohbet davranışına öncelik verir ve bağlamı çoğunlukla alındığı gibi tutar. Bu, izin listelerinin öncelikle eylemleri kimin tetikleyebileceğine karar verdiği, her alıntılanmış veya geçmiş parçacık için evrensel bir redaksiyon sınırı olmadığı anlamına gelir.

<AccordionGroup>
  <Accordion title="Geçerli davranış kanala özgüdür">
    - Bazı kanallar belirli yollarda ek bağlam için zaten gönderene dayalı filtreleme uygular (örneğin Slack iş parçacığı tohumlama, Matrix yanıt/iş parçacığı aramaları).
    - Diğer kanallar alıntı/yanıt/iletme bağlamını hâlâ alındığı gibi geçirir.

  </Accordion>
  <Accordion title="Güçlendirme yönü (planlandı)">
    - `contextVisibility: "all"` (varsayılan) geçerli alındığı-gibi davranışı korur.
    - `contextVisibility: "allowlist"` ek bağlamı izin listesindeki gönderenlere göre filtreler.
    - `contextVisibility: "allowlist_quote"`, `allowlist` değerine ek olarak açık bir alıntı/yanıt istisnasıdır.

    Bu güçlendirme modeli kanallar genelinde tutarlı şekilde uygulanana kadar yüzeylere göre farklılıklar bekleyin.

  </Accordion>
</AccordionGroup>

![Grup mesajı akışı](/images/groups-flow.svg)

İstiyorsanız...

| Amaç                                         | Ayarlanacak değer                                          |
| -------------------------------------------- | ---------------------------------------------------------- |
| Tüm gruplara izin ver ama yalnızca @bahsetmelerde yanıtla | `groups: { "*": { requireMention: true } }`                |
| Tüm grup yanıtlarını devre dışı bırak        | `groupPolicy: "disabled"`                                  |
| Yalnızca belirli gruplar                     | `groups: { "<group-id>": { ... } }` (`"*"` anahtarı yok)   |
| Gruplarda yalnızca siz tetikleyebilirsiniz   | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |
| Kanallar genelinde tek bir güvenilir gönderen kümesini yeniden kullan | `groupAllowFrom: ["accessGroup:operators"]`                |

Yeniden kullanılabilir gönderen izin listeleri için bkz. [Erişim grupları](/tr/channels/access-groups).

## Oturum anahtarları

- Grup oturumları `agent:<agentId>:<channel>:group:<id>` oturum anahtarlarını kullanır (odalar/kanallar `agent:<agentId>:<channel>:channel:<id>` kullanır).
- Telegram forum konuları grup kimliğine `:topic:<threadId>` ekler, böylece her konunun kendi oturumu olur.
- Doğrudan sohbetler ana oturumu kullanır (veya yapılandırılmışsa gönderen başına).
- Heartbeat grup oturumları için atlanır.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Kalıp: kişisel DM’ler + herkese açık gruplar (tek aracı)

Evet — "kişisel" trafiğiniz **DM’ler** ve "herkese açık" trafiğiniz **gruplar** ise bu iyi çalışır.

Neden: tek aracılı modda DM’ler genellikle **main** oturum anahtarına (`agent:main:main`) düşerken, gruplar her zaman **main olmayan** oturum anahtarlarını (`agent:main:<channel>:group:<id>`) kullanır. `mode: "non-main"` ile korumalı alanı etkinleştirirseniz bu grup oturumları yapılandırılmış korumalı alan arka ucunda çalışırken ana DM oturumunuz ana makinede kalır. Bir arka uç seçmezseniz varsayılan arka uç Docker’dır.

Bu size tek bir aracı "beyni" (paylaşılan çalışma alanı + bellek) ama iki yürütme duruşu verir:

- **DM’ler**: tam araçlar (ana makine)
- **Gruplar**: korumalı alan + kısıtlı araçlar

<Note>
Gerçekten ayrı çalışma alanlarına/personalarına ihtiyacınız varsa ("kişisel" ve "herkese açık" asla karışmamalıysa), ikinci bir aracı + bağlamalar kullanın. Bkz. [Çok Aracılı Yönlendirme](/tr/concepts/multi-agent).
</Note>

<Tabs>
  <Tab title="DM’ler ana makinede, gruplar korumalı alanda">
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
    "Ana makine erişimi yok" yerine "gruplar yalnızca X klasörünü görebilir" mi istiyorsunuz? `workspaceAccess: "none"` değerini koruyun ve yalnızca izin listesindeki yolları korumalı alana bağlayın:

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
- Bağlama ayrıntıları: [Korumalı alana alma](/tr/gateway/sandboxing#custom-bind-mounts)

## Görüntü etiketleri

- Kullanıcı arayüzü etiketleri mevcut olduğunda `displayName` kullanır ve `<channel>:<token>` olarak biçimlendirilir.
- `#room` odalar/kanallar için ayrılmıştır; grup sohbetleri `g-<slug>` kullanır (küçük harf, boşluklar -> `-`, `#@+._-` koru).

## Grup ilkesi

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

| İlke          | Davranış                                                    |
| ------------- | ----------------------------------------------------------- |
| `"open"`      | Gruplar izin listelerini atlar; bahsetme kapısı yine uygulanır. |
| `"disabled"`  | Tüm grup mesajlarını tamamen engeller.                      |
| `"allowlist"` | Yalnızca yapılandırılmış izin listesiyle eşleşen gruplara/odalara izin verir. |

<AccordionGroup>
  <Accordion title="Kanal başına notlar">
    - `groupPolicy`, mention-gating'den ayrıdır (bu @mentions gerektirir).
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: `groupAllowFrom` kullanın (geri dönüş: açık `allowFrom`).
    - Signal: `groupAllowFrom`, gelen Signal grup kimliğiyle veya gönderenin telefon/UUID değeriyle eşleşebilir.
    - DM eşleştirme onayları (`*-allowFrom` depo girdileri) yalnızca DM erişimine uygulanır; grup gönderen yetkilendirmesi grup izin listelerinde açık kalır.
    - Discord: izin listesi `channels.discord.guilds.<id>.channels` kullanır.
    - Slack: izin listesi `channels.slack.channels` kullanır.
    - Matrix: izin listesi `channels.matrix.groups` kullanır. Oda kimliklerini veya takma adları tercih edin; katılınmış oda adı araması en iyi çaba esaslıdır ve çözülemeyen adlar çalışma zamanında yok sayılır. Gönderenleri kısıtlamak için `channels.matrix.groupAllowFrom` kullanın; oda başına `users` izin listeleri de desteklenir.
    - Grup DM'leri ayrı denetlenir (`channels.discord.dm.*`, `channels.slack.dm.*`).
    - Telegram izin listesi kullanıcı kimlikleriyle (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) veya kullanıcı adlarıyla (`"@alice"` ya da `"alice"`) eşleşebilir; önekler büyük/küçük harfe duyarsızdır.
    - Varsayılan değer `groupPolicy: "allowlist"` olur; grup izin listeniz boşsa grup mesajları engellenir.
    - Çalışma zamanı güvenliği: bir sağlayıcı bloğu tamamen eksik olduğunda (`channels.<provider>` yoksa), grup ilkesi `channels.defaults.groupPolicy` değerini devralmak yerine kapalı kalacak şekilde hata veren bir moda (genellikle `allowlist`) geri döner.

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
  <Step title="Mention gating">
    Mention gating (`requireMention`, `/activation`).
  </Step>
</Steps>

## Mention gating (varsayılan)

Grup mesajları, grup başına aksi geçersiz kılınmadıkça mention gerektirir. Varsayılanlar her alt sistemde `*.groups."*"` altında bulunur.

Kanal yanıt meta verilerini desteklediğinde bir bot mesajını yanıtlamak örtük mention sayılır. Bir bot mesajından alıntı yapmak da alıntı meta verilerini açığa çıkaran kanallarda örtük mention sayılabilir. Geçerli yerleşik durumlar Telegram, WhatsApp, Slack, Discord, Microsoft Teams ve ZaloUser içerir.

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
  <Accordion title="Mention gating notları">
    - `mentionPatterns`, büyük/küçük harfe duyarsız güvenli regex kalıplarıdır; geçersiz kalıplar ve güvenli olmayan iç içe tekrar biçimleri yok sayılır.
    - Açık mention sağlayan yüzeyler yine geçer; kalıplar bir geri dönüş yoludur.
    - Ajan başına geçersiz kılma: `agents.list[].groupChat.mentionPatterns` (birden fazla ajan aynı grubu paylaştığında kullanışlıdır).
    - Mention gating yalnızca mention algılama mümkün olduğunda zorlanır (yerel mention'lar veya `mentionPatterns` yapılandırılmıştır).
    - Bir grubu veya göndereni izin listesine almak mention gating'i devre dışı bırakmaz; tüm mesajların tetiklemesi gerektiğinde o grubun `requireMention` değerini `false` yapın.
    - Grup sohbeti istem bağlamı çözümlenen sessiz yanıt talimatını her turda taşır; çalışma alanı dosyaları `NO_REPLY` mekaniklerini yinelememelidir.
    - Sessiz yanıtlara izin verilen gruplar, temiz boş veya yalnızca akıl yürütme içeren model turlarını `NO_REPLY` ile eşdeğer şekilde sessiz kabul eder. Doğrudan sohbetler bunu yalnızca doğrudan sessiz yanıtlara açıkça izin verildiğinde yapar; aksi halde boş yanıtlar başarısız ajan turları olarak kalır.
    - Discord varsayılanları `channels.discord.guilds."*"` içinde bulunur (guild/kanal başına geçersiz kılınabilir).
    - Grup geçmişi bağlamı kanallar arasında tek biçimde sarmalanır ve **yalnızca bekleyen** iletilerden oluşur (mention gating nedeniyle atlanan mesajlar); genel varsayılan için `messages.groupChat.historyLimit`, geçersiz kılmalar için `channels.<channel>.historyLimit` (veya `channels.<channel>.accounts.*.historyLimit`) kullanın. Devre dışı bırakmak için `0` ayarlayın.

  </Accordion>
</AccordionGroup>

## Grup/kanal araç kısıtlamaları (isteğe bağlı)

Bazı kanal yapılandırmaları, hangi araçların **belirli bir grup/oda/kanal içinde** kullanılabileceğini kısıtlamayı destekler.

- `tools`: tüm grup için araçlara izin verin/reddedin.
- `toolsBySender`: grup içinde gönderen başına geçersiz kılmalar. Açık anahtar önekleri kullanın: `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` ve `"*"` joker karakteri. Eski öneksiz anahtarlar hâlâ kabul edilir ve yalnızca `id:` olarak eşleştirilir.

Çözümleme sırası (en özel olan kazanır):

<Steps>
  <Step title="Grup toolsBySender">
    Grup/kanal `toolsBySender` eşleşmesi.
  </Step>
  <Step title="Grup tools">
    Grup/kanal `tools`.
  </Step>
  <Step title="Varsayılan toolsBySender">
    Varsayılan (`"*"` ) `toolsBySender` eşleşmesi.
  </Step>
  <Step title="Varsayılan tools">
    Varsayılan (`"*"` ) `tools`.
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
Grup/kanal araç kısıtlamaları global/ajan araç ilkesine ek olarak uygulanır (reddetme yine kazanır). Bazı kanallar odalar/kanallar için farklı iç içe yerleşimler kullanır (ör. Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).
</Note>

## Grup izin listeleri

`channels.whatsapp.groups`, `channels.telegram.groups` veya `channels.imessage.groups` yapılandırıldığında, anahtarlar grup izin listesi olarak davranır. Varsayılan mention davranışını ayarlamaya devam ederken tüm gruplara izin vermek için `"*"` kullanın.

<Warning>
Yaygın karışıklık: DM eşleştirme onayı grup yetkilendirmesiyle aynı değildir. DM eşleştirmeyi destekleyen kanallarda eşleştirme deposu yalnızca DM'lerin kilidini açar. Grup komutları yine de `groupAllowFrom` gibi yapılandırma izin listelerinden veya o kanal için belgelenmiş yapılandırma geri dönüşünden açık grup gönderen yetkilendirmesi gerektirir.
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
  <Tab title="Tüm gruplara izin ver ancak mention gerektir">
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

Sahip, `channels.whatsapp.allowFrom` tarafından belirlenir (ayarlanmamışsa botun kendi E.164 değeri). Komutu bağımsız bir mesaj olarak gönderin. Diğer yüzeyler şu anda `/activation` öğesini yok sayar.

## Bağlam alanları

Grup gelen yükleri şunları ayarlar:

- `ChatType=group`
- `GroupSubject` (biliniyorsa)
- `GroupMembers` (biliniyorsa)
- `WasMentioned` (mention gating sonucu)
- Telegram forum konuları ayrıca `MessageThreadId` ve `IsForum` içerir.

Kanala özgü notlar:

- BlueBubbles, `GroupMembers` doldurulmadan önce adsız macOS grup katılımcılarını yerel Contacts veritabanından isteğe bağlı olarak zenginleştirebilir. Bu varsayılan olarak kapalıdır ve yalnızca normal grup geçitlemesi geçtikten sonra çalışır.

Ajan sistem istemi, yeni bir grup oturumunun ilk turunda bir grup girişi içerir. Modele insan gibi yanıt vermesini, Markdown tablolarından kaçınmasını, boş satırları en aza indirip normal sohbet aralığını izlemesini ve değişmez `\n` dizilerini yazmaktan kaçınmasını hatırlatır. Kanal kaynaklı grup adları ve katılımcı etiketleri satır içi sistem talimatları olarak değil, çitlenmiş güvenilmeyen meta veri olarak işlenir.

## iMessage ayrıntıları

- Yönlendirme veya izin listesine alma sırasında `chat_id:<id>` tercih edin.
- Sohbetleri listele: `imsg chats --limit 20`.
- Grup yanıtları her zaman aynı `chat_id` değerine geri gider.

## WhatsApp sistem istemleri

Grup ve doğrudan istem çözümlemesi, joker karakter davranışı ve hesap geçersiz kılma semantiklerini içeren kanonik WhatsApp sistem istemi kuralları için [WhatsApp](/tr/channels/whatsapp#system-prompts) bölümüne bakın.

## WhatsApp ayrıntıları

Yalnızca WhatsApp davranışı (geçmiş enjeksiyonu, mention işleme ayrıntıları) için [Grup mesajları](/tr/channels/group-messages) bölümüne bakın.

## İlgili

- [Yayın grupları](/tr/channels/broadcast-groups)
- [Kanal yönlendirme](/tr/channels/channel-routing)
- [Grup mesajları](/tr/channels/group-messages)
- [Eşleştirme](/tr/channels/pairing)
