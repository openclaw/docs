---
read_when:
    - Grup sohbeti davranışını veya bahsetme denetimini değiştirme
sidebarTitle: Groups
summary: Yüzeyler genelinde grup sohbeti davranışı (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Gruplar
x-i18n:
    generated_at: "2026-05-10T19:21:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3a040df975829cd35f45577522ea2813fd98fd8babbb42663e502cedde088d89
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw grup sohbetlerini yüzeyler arasında tutarlı şekilde ele alır: Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo.

## Yeni başlayanlar için giriş (2 dakika)

OpenClaw kendi mesajlaşma hesaplarınızda "yaşar". Ayrı bir WhatsApp bot kullanıcısı yoktur. Bir grupta **siz** varsınız, OpenClaw o grubu görebilir ve orada yanıt verebilir.

Varsayılan davranış:

- Gruplar kısıtlanır (`groupPolicy: "allowlist"`).
- Yanıtlar, bahsetme denetimini açıkça devre dışı bırakmadığınız sürece bir bahsetme gerektirir.
- Gruplarda/kanallarda normal nihai yanıtlar varsayılan olarak özeldir. Görünür oda çıktısı `message` aracını kullanır.

Çeviri: izin listesine alınmış gönderenler OpenClaw’ı ondan bahsederek tetikleyebilir.

<Note>
**Özet**

- **DM erişimi** `*.allowFrom` ile denetlenir.
- **Grup erişimi** `*.groupPolicy` + izin listeleri (`*.groups`, `*.groupAllowFrom`) ile denetlenir.
- **Yanıt tetikleme** bahsetme denetimi (`requireMention`, `/activation`) ile denetlenir.

</Note>

Hızlı akış (bir grup iletisine ne olur):

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
otherwise -> reply
```

## Görünür yanıtlar

Grup/kanal odaları için OpenClaw varsayılan olarak `messages.groupChat.visibleReplies: "message_tool"` kullanır.
`openclaw doctor --fix`, bunu atlayan yapılandırılmış kanal konfigürasyonlarına bu varsayılanı yazar.
Bu, ajanın turu hâlâ işlediği ve bellek/oturum durumunu güncelleyebildiği, ancak normal nihai yanıtının odaya otomatik olarak geri gönderilmediği anlamına gelir. Görünür şekilde konuşmak için ajan `message(action=send)` kullanır.

Bu varsayılan, araçları güvenilir şekilde çağıran bir model/runtime’a bağlıdır. Günlükler
asistan metnini gösteriyor ancak `didSendViaMessagingTool: false` ise model
mesaj aracını çağırmak yerine özel olarak yanıtlamıştır. Bu bir
Discord/Slack/Telegram gönderim hatası değildir. Grup/kanal oturumları için
araç çağırma konusunda güvenilir bir model kullanın veya eski görünür nihai
yanıtları geri yüklemek için `messages.groupChat.visibleReplies: "automatic"`
ayarlayın.

Mesaj aracı etkin araç politikası altında kullanılamıyorsa OpenClaw yanıtı sessizce bastırmak yerine otomatik görünür yanıtlara geri döner.
`openclaw doctor` bu uyumsuzluk hakkında uyarır.

Doğrudan sohbetler ve diğer tüm kaynak turları için aynı yalnızca araçla görünür yanıt davranışını genel olarak uygulamak üzere `messages.visibleReplies: "message_tool"` kullanın. Harness’lar bunu ayarlanmamış varsayılanları olarak da seçebilir; Codex harness, Codex modu doğrudan sohbetler için bunu yapar. `messages.groupChat.visibleReplies`, grup/kanal odaları için daha özel geçersiz kılma olarak kalır.

Bu, çoğu dinleme modu turunda modeli `NO_REPLY` yanıtı vermeye zorlayan eski kalıbın yerini alır. Yalnızca araç modunda görünür hiçbir şey yapmamak, basitçe mesaj aracını çağırmamak anlamına gelir.

Yalnızca araç modunda ajan çalışırken yazıyor göstergeleri hâlâ gönderilir. Bu turlar için varsayılan grup yazıyor modu "message" yerine "instant" olarak yükseltilir, çünkü ajan mesaj aracını çağırıp çağırmamaya karar vermeden önce normal asistan ileti metni hiç olmayabilir. Açık yazıyor modu konfigürasyonu yine önceliklidir.

Grup/kanal odaları için eski otomatik nihai yanıtları geri yüklemek üzere:

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "automatic",
    },
  },
}
```

Gateway, dosya kaydedildikten sonra `messages` konfigürasyonunu sıcak yeniden yükler. Yalnızca
dağıtımda dosya izleme veya konfigürasyon yeniden yükleme devre dışıysa yeniden başlatın.

Her kaynak sohbet için görünür çıktının mesaj aracı üzerinden gitmesini zorunlu kılmak üzere:

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

Yerel eğik çizgi komutları (Discord, Telegram ve yerel komut desteği olan diğer yüzeyler) `visibleReplies: "message_tool"` ayarını atlar ve kanalın yerel komut kullanıcı arayüzünün beklediği yanıtı alması için her zaman görünür yanıt verir. Bu yalnızca doğrulanmış yerel komut turları için geçerlidir; metin olarak yazılan `/...` komutları ve sıradan sohbet turları yapılandırılmış grup varsayılanını izlemeye devam eder.

## Bağlam görünürlüğü ve izin listeleri

Grup güvenliğinde iki farklı denetim söz konusudur:

- **Tetikleme yetkilendirmesi**: ajanı kimlerin tetikleyebileceği (`groupPolicy`, `groups`, `groupAllowFrom`, kanala özgü izin listeleri).
- **Bağlam görünürlüğü**: modele hangi ek bağlamın ekleneceği (yanıt metni, alıntılar, konu geçmişi, iletilmiş meta veriler).

Varsayılan olarak OpenClaw normal sohbet davranışına öncelik verir ve bağlamı çoğunlukla alındığı gibi korur. Bu, izin listelerinin öncelikle eylemleri kimin tetikleyebileceğine karar verdiği, alıntılanan veya geçmişteki her parçacık için evrensel bir sansür sınırı olmadığı anlamına gelir.

<AccordionGroup>
  <Accordion title="Geçerli davranış kanala özeldir">
    - Bazı kanallar belirli yollarda ek bağlam için gönderen tabanlı filtrelemeyi zaten uygular (örneğin Slack konu başlatma, Matrix yanıt/konu aramaları).
    - Diğer kanallar alıntı/yanıt/iletme bağlamını hâlâ alındığı gibi geçirir.

  </Accordion>
  <Accordion title="Sağlamlaştırma yönü (planlanıyor)">
    - `contextVisibility: "all"` (varsayılan) mevcut alındığı gibi davranışı korur.
    - `contextVisibility: "allowlist"` ek bağlamı izin listesine alınmış gönderenlerle filtreler.
    - `contextVisibility: "allowlist_quote"` `allowlist` artı bir açık alıntı/yanıt istisnasıdır.

    Bu sağlamlaştırma modeli kanallar arasında tutarlı şekilde uygulanana kadar, yüzeye göre farklılıklar bekleyin.

  </Accordion>
</AccordionGroup>

![Grup ileti akışı](/images/groups-flow.svg)

İstediğiniz şey...

| Amaç                                         | Ayarlanacak şey                                            |
| -------------------------------------------- | ---------------------------------------------------------- |
| Tüm gruplara izin ver ama yalnızca @bahsetmelerde yanıtla | `groups: { "*": { requireMention: true } }`                |
| Tüm grup yanıtlarını devre dışı bırak        | `groupPolicy: "disabled"`                                  |
| Yalnızca belirli gruplar                     | `groups: { "<group-id>": { ... } }` (`"*"` anahtarı yok)   |
| Gruplarda yalnızca siz tetikleyebilirsiniz   | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |
| Kanallar arasında tek bir güvenilir gönderen kümesini yeniden kullan | `groupAllowFrom: ["accessGroup:operators"]`                |

Yeniden kullanılabilir gönderen izin listeleri için bkz. [Erişim grupları](/tr/channels/access-groups).

## Oturum anahtarları

- Grup oturumları `agent:<agentId>:<channel>:group:<id>` oturum anahtarlarını kullanır (odalar/kanallar `agent:<agentId>:<channel>:channel:<id>` kullanır).
- Telegram forum konuları grup kimliğine `:topic:<threadId>` ekler, böylece her konunun kendi oturumu olur.
- Doğrudan sohbetler ana oturumu kullanır (veya yapılandırılmışsa gönderen başına).
- Heartbeat’ler grup oturumları için atlanır.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Kalıp: kişisel DM’ler + herkese açık gruplar (tek ajan)

Evet — "kişisel" trafiğiniz **DM’ler** ve "herkese açık" trafiğiniz **gruplar** ise bu iyi çalışır.

Nedeni: tek ajan modunda DM’ler genellikle **ana** oturum anahtarına (`agent:main:main`) düşerken, gruplar her zaman **ana olmayan** oturum anahtarlarını (`agent:main:<channel>:group:<id>`) kullanır. `mode: "non-main"` ile sandboxing’i etkinleştirirseniz bu grup oturumları yapılandırılmış sandbox arka ucunda çalışır, ana DM oturumunuz ise ana makinede kalır. Birini seçmezseniz Docker varsayılan arka uçtur.

Bu size tek bir ajan "beyni" (paylaşılan çalışma alanı + bellek), ancak iki yürütme duruşu verir:

- **DM’ler**: tam araçlar (ana makine)
- **Gruplar**: sandbox + kısıtlı araçlar

<Note>
Gerçekten ayrı çalışma alanlarına/persona’lara ihtiyacınız varsa ("kişisel" ve "herkese açık" hiçbir zaman karışmamalıysa), ikinci bir ajan + bağlamalar kullanın. Bkz. [Çok Ajanlı Yönlendirme](/tr/concepts/multi-agent).
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
  <Tab title="Gruplar yalnızca izin listesine alınmış bir klasörü görür">
    "Ana makine erişimi yok" yerine "gruplar yalnızca X klasörünü görebilir" mi istiyorsunuz? `workspaceAccess: "none"` değerini koruyun ve yalnızca izin listesine alınmış yolları sandbox içine bağlayın:

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

- Konfigürasyon anahtarları ve varsayılanlar: [Gateway konfigürasyonu](/tr/gateway/config-agents#agentsdefaultssandbox)
- Bir aracın neden engellendiğinde hata ayıklama: [Sandbox vs Araç Politikası vs Elevated](/tr/gateway/sandbox-vs-tool-policy-vs-elevated)
- Bağlama mount ayrıntıları: [Sandboxing](/tr/gateway/sandboxing#custom-bind-mounts)

## Görüntü etiketleri

- Kullanıcı arayüzü etiketleri, mevcut olduğunda `<channel>:<token>` biçiminde `displayName` kullanır.
- `#room` odalar/kanallar için ayrılmıştır; grup sohbetleri `g-<slug>` kullanır (küçük harf, boşluklar -> `-`, `#@+._-` koru).

## Grup politikası

Grup/oda iletilerinin kanal başına nasıl işleneceğini denetleyin:

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
| `"open"`      | Gruplar izin listelerini atlar; bahsetme denetimi hâlâ uygulanır. |
| `"disabled"`  | Tüm grup iletilerini tamamen engeller.                       |
| `"allowlist"` | Yalnızca yapılandırılmış izin listesiyle eşleşen gruplara/odalara izin verir. |

<AccordionGroup>
  <Accordion title="Kanal başına notlar">
    - `groupPolicy`, bahsetme denetiminden ayrıdır (bu, @bahsetmeler gerektirir).
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: `groupAllowFrom` kullanın (yedek: açık `allowFrom`).
    - Signal: `groupAllowFrom`, gelen Signal grup kimliğiyle veya gönderenin telefon/UUID değeriyle eşleşebilir.
    - DM eşleştirme onayları (`*-allowFrom` depo girdileri) yalnızca DM erişimi için geçerlidir; grup gönderen yetkilendirmesi grup izin listelerine açık biçimde bağlı kalır.
    - Discord: izin listesi `channels.discord.guilds.<id>.channels` kullanır.
    - Slack: izin listesi `channels.slack.channels` kullanır.
    - Matrix: izin listesi `channels.matrix.groups` kullanır. Oda kimliklerini veya takma adlarını tercih edin; katılınmış oda adı araması en iyi çabayla yapılır ve çözümlenemeyen adlar çalışma zamanında yok sayılır. Gönderenleri kısıtlamak için `channels.matrix.groupAllowFrom` kullanın; oda başına `users` izin listeleri de desteklenir.
    - Grup DM'leri ayrı olarak denetlenir (`channels.discord.dm.*`, `channels.slack.dm.*`).
    - Telegram izin listesi kullanıcı kimlikleriyle (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) veya kullanıcı adlarıyla (`"@alice"` ya da `"alice"`) eşleşebilir; önekler büyük/küçük harfe duyarsızdır.
    - Varsayılan `groupPolicy: "allowlist"` şeklindedir; grup izin listeniz boşsa grup mesajları engellenir.
    - Çalışma zamanı güvenliği: bir sağlayıcı bloğu tamamen eksik olduğunda (`channels.<provider>` yoksa), grup ilkesi `channels.defaults.groupPolicy` değerini devralmak yerine hatada kapalı moda (genellikle `allowlist`) geri döner.

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
  <Step title="Bahsetme denetimi">
    Bahsetme denetimi (`requireMention`, `/activation`).
  </Step>
</Steps>

## Bahsetme denetimi (varsayılan)

Grup mesajları, grup başına geçersiz kılınmadıkça bir bahsetme gerektirir. Varsayılanlar her alt sistem için `*.groups."*"` altında bulunur.

Kanal yanıt meta verilerini desteklediğinde bir bot mesajını yanıtlamak örtük bir bahsetme sayılır. Bir bot mesajını alıntılamak da alıntı meta verilerini açığa çıkaran kanallarda örtük bir bahsetme sayılabilir. Geçerli yerleşik örnekler Telegram, WhatsApp, Slack, Discord, Microsoft Teams ve ZaloUser içerir.

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
  <Accordion title="Bahsetme denetimi notları">
    - `mentionPatterns`, büyük/küçük harfe duyarsız güvenli düzenli ifade kalıplarıdır; geçersiz kalıplar ve güvenli olmayan iç içe tekrar biçimleri yok sayılır.
    - Açık bahsetmeler sağlayan yüzeyler yine de geçer; kalıplar bir yedektir.
    - Ajan başına geçersiz kılma: `agents.list[].groupChat.mentionPatterns` (birden çok ajan aynı grubu paylaştığında kullanışlıdır).
    - Bahsetme denetimi yalnızca bahsetme algılama mümkün olduğunda uygulanır (yerel bahsetmeler ya da `mentionPatterns` yapılandırılmıştır).
    - Bir grubu veya göndereni izin listesine almak bahsetme denetimini devre dışı bırakmaz; tüm mesajların tetiklemesi gerektiğinde o grubun `requireMention` değerini `false` yapın.
    - Grup sohbeti istem bağlamı, her turda çözümlenen sessiz yanıt talimatını taşır; çalışma alanı dosyaları `NO_REPLY` mekaniklerini yinelememelidir.
    - Sessiz yanıtlara izin verilen gruplar, temiz boş veya yalnızca akıl yürütme içeren model turlarını `NO_REPLY` ile eşdeğer şekilde sessiz kabul eder. Doğrudan sohbetler bunu yalnızca doğrudan sessiz yanıtlara açıkça izin verildiğinde yapar; aksi halde boş yanıtlar başarısız ajan turları olarak kalır.
    - Discord varsayılanları `channels.discord.guilds."*"` içinde bulunur (guild/kanal başına geçersiz kılınabilir).
    - Grup geçmişi bağlamı kanallar arasında tek biçimde sarmalanır. Bahsetme denetimli gruplar bekleyen atlanmış mesajları tutar; her zaman açık gruplar da kanal desteklediğinde yakın zamanda işlenmiş oda mesajlarını saklayabilir. Genel varsayılan için `messages.groupChat.historyLimit`, geçersiz kılmalar için `channels.<channel>.historyLimit` (veya `channels.<channel>.accounts.*.historyLimit`) kullanın. Devre dışı bırakmak için `0` ayarlayın.

  </Accordion>
</AccordionGroup>

## Grup/kanal araç kısıtlamaları (isteğe bağlı)

Bazı kanal yapılandırmaları, **belirli bir grup/oda/kanal içinde** hangi araçların kullanılabilir olduğunu kısıtlamayı destekler.

- `tools`: tüm grup için araçlara izin verin/reddedin.
- `toolsBySender`: grup içinde gönderen başına geçersiz kılmalar. Açık anahtar önekleri kullanın: `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` ve `"*"` joker karakteri. Eski öneksiz anahtarlar hâlâ kabul edilir ve yalnızca `id:` olarak eşleştirilir.

Çözümleme sırası (en özgül olan kazanır):

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
Grup/kanal araç kısıtlamaları, genel/ajan araç ilkesine ek olarak uygulanır (reddetme yine de kazanır). Bazı kanallar odalar/kanallar için farklı iç içe yerleşim kullanır (ör. Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).
</Note>

## Grup izin listeleri

`channels.whatsapp.groups`, `channels.telegram.groups` veya `channels.imessage.groups` yapılandırıldığında anahtarlar grup izin listesi işlevi görür. Varsayılan bahsetme davranışını ayarlamaya devam ederken tüm gruplara izin vermek için `"*"` kullanın.

<Warning>
Yaygın karışıklık: DM eşleştirme onayı grup yetkilendirmesiyle aynı şey değildir. DM eşleştirmesini destekleyen kanallarda eşleştirme deposu yalnızca DM'lerin kilidini açar. Grup komutları yine de `groupAllowFrom` gibi yapılandırma izin listelerinden veya o kanal için belgelenmiş yapılandırma yedeğinden açık grup gönderen yetkilendirmesi gerektirir.
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
  <Tab title="Yalnızca sahip tetiklemeleri (WhatsApp)">
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

Sahip, `channels.whatsapp.allowFrom` tarafından belirlenir (ayarlanmamışsa botun kendi E.164 değeri kullanılır). Komutu tek başına bir mesaj olarak gönderin. Diğer yüzeyler şu anda `/activation` değerini yok sayar.

## Bağlam alanları

Gelen grup yükleri şunları ayarlar:

- `ChatType=group`
- `GroupSubject` (biliniyorsa)
- `GroupMembers` (biliniyorsa)
- `WasMentioned` (bahsetme denetimi sonucu)
- Telegram forum konuları ayrıca `MessageThreadId` ve `IsForum` içerir.

Ajan sistem istemi, yeni bir grup oturumunun ilk turunda bir grup girişi içerir. Bu giriş modele insan gibi yanıt vermesini, Markdown tablolarından kaçınmasını, boş satırları en aza indirmesini ve normal sohbet aralığını izlemesini, ayrıca düz `\n` dizileri yazmaktan kaçınmasını hatırlatır. Kanal kaynaklı grup adları ve katılımcı etiketleri satır içi sistem talimatları olarak değil, çitlenmiş güvenilmeyen meta veriler olarak işlenir.

## iMessage ayrıntıları

- Yönlendirme veya izin listesine alma sırasında `chat_id:<id>` tercih edin.
- Sohbetleri listeleyin: `imsg chats --limit 20`.
- Grup yanıtları her zaman aynı `chat_id` değerine geri gider.

## WhatsApp sistem istemleri

Grup ve doğrudan istem çözümleme, joker karakter davranışı ve hesap geçersiz kılma semantiği dahil olmak üzere kanonik WhatsApp sistem istemi kuralları için [WhatsApp](/tr/channels/whatsapp#system-prompts) bölümüne bakın.

## WhatsApp ayrıntıları

Yalnızca WhatsApp davranışı (geçmiş ekleme, bahsetme işleme ayrıntıları) için [Grup mesajları](/tr/channels/group-messages) bölümüne bakın.

## İlgili

- [Yayın grupları](/tr/channels/broadcast-groups)
- [Kanal yönlendirme](/tr/channels/channel-routing)
- [Grup mesajları](/tr/channels/group-messages)
- [Eşleştirme](/tr/channels/pairing)
