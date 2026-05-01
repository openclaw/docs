---
read_when:
    - Grup sohbeti davranışını veya bahsetme denetimini değiştirme
sidebarTitle: Groups
summary: Yüzeyler genelinde grup sohbeti davranışı (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Gruplar
x-i18n:
    generated_at: "2026-05-01T08:58:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: a8580f98ab03c89770688102da776627d8ce18b7bd34c4a687009fd4aabb6213
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw grup sohbetlerini yüzeyler genelinde tutarlı biçimde ele alır: Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo.

## Başlangıç tanıtımı (2 dakika)

OpenClaw kendi mesajlaşma hesaplarınızda "yaşar". Ayrı bir WhatsApp bot kullanıcısı yoktur. Bir grupta **siz** varsa, OpenClaw o grubu görebilir ve orada yanıt verebilir.

Varsayılan davranış:

- Gruplar kısıtlıdır (`groupPolicy: "allowlist"`).
- Yanıtlar, bahsetme kapısını açıkça devre dışı bırakmadığınız sürece bir bahsetme gerektirir.
- Gruplarda/kanallarda normal son yanıtlar varsayılan olarak özeldir. Görünür oda çıktısı `message` aracını kullanır.

Çeviri: izin listesine alınmış gönderenler, OpenClaw’dan bahsederek onu tetikleyebilir.

<Note>
**Kısa özet**

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
Bu, ajanın yine de turu işlediği ve bellek/oturum durumunu güncelleyebildiği, ancak normal son yanıtının odaya otomatik olarak geri gönderilmediği anlamına gelir. Görünür biçimde konuşmak için ajan `message(action=send)` kullanır.

Aktif araç ilkesi altında mesaj aracı kullanılamıyorsa OpenClaw, yanıtı sessizce bastırmak yerine otomatik görünür yanıtlara geri döner.
`openclaw doctor` bu uyumsuzluk hakkında uyarır.

Doğrudan sohbetler ve diğer tüm kaynak turları için, aynı yalnızca araçla görünür yanıt davranışını genel olarak uygulamak üzere `messages.visibleReplies: "message_tool"` kullanın. `messages.groupChat.visibleReplies`, grup/kanal odaları için daha özel geçersiz kılma olarak kalır.

Bu, çoğu dinleme modu turunda modeli `NO_REPLY` yanıtı vermeye zorlayan eski kalıbın yerini alır. Yalnızca araç modunda görünür hiçbir şey yapmamak, yalnızca mesaj aracını çağırmamak anlamına gelir.

Ajan yalnızca araç modunda çalışırken yazıyor göstergeleri yine de gönderilir. Bu turlarda varsayılan grup yazıyor modu "message" değerinden "instant" değerine yükseltilir, çünkü ajan mesaj aracını çağırıp çağırmamaya karar vermeden önce normal asistan mesaj metni hiç olmayabilir. Açık yazıyor modu yapılandırması yine de önceliklidir.

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

Gateway, dosya kaydedildikten sonra `messages` yapılandırmasını sıcak yeniden yükler. Yalnızca dağıtımda dosya izleme veya yapılandırma yeniden yükleme devre dışıysa yeniden başlatın.

Her kaynak sohbet için görünür çıktının mesaj aracı üzerinden gitmesini zorunlu kılmak için:

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

Yerel eğik çizgi komutları (Discord, Telegram ve yerel komut desteği olan diğer yüzeyler) `visibleReplies: "message_tool"` ayarını atlar ve kanalın yerel komut kullanıcı arayüzünün beklediği yanıtı alması için her zaman görünür biçimde yanıt verir. Bu yalnızca doğrulanmış yerel komut turları için geçerlidir; metin olarak yazılan `/...` komutları ve sıradan sohbet turları yine de yapılandırılmış grup varsayılanını izler.

## Bağlam görünürlüğü ve izin listeleri

Grup güvenliğinde iki farklı denetim rol oynar:

- **Tetikleme yetkilendirmesi**: ajanı kimlerin tetikleyebileceği (`groupPolicy`, `groups`, `groupAllowFrom`, kanala özgü izin listeleri).
- **Bağlam görünürlüğü**: modele hangi ek bağlamın enjekte edildiği (yanıt metni, alıntılar, iş parçacığı geçmişi, iletilmiş meta veriler).

Varsayılan olarak OpenClaw normal sohbet davranışına öncelik verir ve bağlamı çoğunlukla alındığı gibi tutar. Bu, izin listelerinin öncelikle kimin eylemleri tetikleyebileceğine karar verdiği, her alıntılanan veya geçmiş parçacık için evrensel bir redaksiyon sınırı olmadığı anlamına gelir.

<AccordionGroup>
  <Accordion title="Geçerli davranış kanala özeldir">
    - Bazı kanallar, belirli yollarda ek bağlam için gönderici tabanlı filtrelemeyi zaten uygular (örneğin Slack iş parçacığı başlatma, Matrix yanıt/iş parçacığı aramaları).
    - Diğer kanallar alıntı/yanıt/iletme bağlamını hâlâ alındığı gibi geçirir.

  </Accordion>
  <Accordion title="Sertleştirme yönü (planlandı)">
    - `contextVisibility: "all"` (varsayılan) mevcut alındığı gibi davranışı korur.
    - `contextVisibility: "allowlist"` ek bağlamı izin listesine alınmış gönderenlerle sınırlar.
    - `contextVisibility: "allowlist_quote"`, `allowlist` artı bir açık alıntı/yanıt istisnasıdır.

    Bu sertleştirme modeli kanallar genelinde tutarlı biçimde uygulanana kadar yüzeye göre farklılıklar bekleyin.

  </Accordion>
</AccordionGroup>

![Grup mesaj akışı](/images/groups-flow.svg)

İstediğiniz şey...

| Hedef                                         | Ayarlanacak değer                                           |
| -------------------------------------------- | ---------------------------------------------------------- |
| Tüm gruplara izin ver ama yalnızca @bahsetmelerde yanıtla | `groups: { "*": { requireMention: true } }`                |
| Tüm grup yanıtlarını devre dışı bırak                    | `groupPolicy: "disabled"`                                  |
| Yalnızca belirli gruplar                                  | `groups: { "<group-id>": { ... } }` (no `"*"` key)         |
| Gruplarda yalnızca siz tetikleyebilirsiniz                | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |

## Oturum anahtarları

- Grup oturumları `agent:<agentId>:<channel>:group:<id>` oturum anahtarlarını kullanır (odalar/kanallar `agent:<agentId>:<channel>:channel:<id>` kullanır).
- Telegram forum konuları, her konunun kendi oturumu olması için grup kimliğine `:topic:<threadId>` ekler.
- Doğrudan sohbetler ana oturumu kullanır (veya yapılandırılmışsa gönderen başına oturum).
- Heartbeat’ler grup oturumları için atlanır.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Kalıp: kişisel DM’ler + herkese açık gruplar (tek ajan)

Evet — "kişisel" trafiğiniz **DM’ler**, "herkese açık" trafiğiniz ise **gruplar** ise bu iyi çalışır.

Neden: tek ajan modunda DM’ler genellikle **ana** oturum anahtarına (`agent:main:main`) düşer, gruplar ise her zaman **ana olmayan** oturum anahtarlarını (`agent:main:<channel>:group:<id>`) kullanır. `mode: "non-main"` ile sandboxing etkinleştirirseniz, bu grup oturumları yapılandırılmış sandbox arka ucunda çalışırken ana DM oturumunuz ana makinede kalır. Birini seçmezseniz varsayılan arka uç Docker’dır.

Bu size tek bir ajan "beyni" (paylaşılan çalışma alanı + bellek), ancak iki yürütme duruşu verir:

- **DM’ler**: tam araçlar (ana makine)
- **Gruplar**: sandbox + kısıtlı araçlar

<Note>
Gerçekten ayrı çalışma alanlarına/persona’lara ihtiyacınız varsa ("kişisel" ve "herkese açık" hiçbir zaman karışmamalıysa), ikinci bir ajan + bağlamalar kullanın. Bkz. [Çoklu Ajan Yönlendirme](/tr/concepts/multi-agent).
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
    "Gruplar ana makine erişimi olmadan" yerine "gruplar yalnızca X klasörünü görebilir" istiyorsanız `workspaceAccess: "none"` değerini koruyun ve yalnızca izin listesine alınmış yolları sandbox içine bağlayın:

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
- Bir aracın neden engellendiğini hata ayıklama: [Sandbox ve Araç İlkesi ve Yükseltilmiş](/tr/gateway/sandbox-vs-tool-policy-vs-elevated)
- Bağlama bağları ayrıntıları: [Sandboxing](/tr/gateway/sandboxing#custom-bind-mounts)

## Görünen etiketler

- UI etiketleri, varsa `displayName` kullanır ve `<channel>:<token>` olarak biçimlendirilir.
- `#room` odalar/kanallar için ayrılmıştır; grup sohbetleri `g-<slug>` kullanır (küçük harf, boşluklar -> `-`, `#@+._-` koru).

## Grup ilkesi

Grup/oda mesajlarının kanal başına nasıl işleneceğini denetleyin:

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
| ------------- | ------------------------------------------------------------ |
| `"open"`      | Gruplar izin listelerini atlar; bahsetme kapısı yine de uygulanır. |
| `"disabled"`  | Tüm grup mesajlarını tamamen engeller.                       |
| `"allowlist"` | Yalnızca yapılandırılmış izin listesiyle eşleşen gruplara/odalara izin verir. |

<AccordionGroup>
  <Accordion title="Kanal başına notlar">
    - `groupPolicy`, bahsetme kapısından ayrıdır (bu @bahsetmeler gerektirir).
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: `groupAllowFrom` kullanın (yedek: açık `allowFrom`).
    - Signal: `groupAllowFrom`, gelen Signal grup kimliğiyle veya gönderen telefon/UUID değeriyle eşleşebilir.
    - DM eşleştirme onayları (`*-allowFrom` depo girdileri) yalnızca DM erişimi için geçerlidir; grup gönderen yetkilendirmesi grup izin listelerinde açık kalır.
    - Discord: izin listesi `channels.discord.guilds.<id>.channels` kullanır.
    - Slack: izin listesi `channels.slack.channels` kullanır.
    - Matrix: izin listesi `channels.matrix.groups` kullanır. Oda kimliklerini veya takma adları tercih edin; katılınmış oda adı araması en iyi çaba düzeyindedir ve çözümlenemeyen adlar çalışma zamanında yok sayılır. Gönderenleri kısıtlamak için `channels.matrix.groupAllowFrom` kullanın; oda başına `users` izin listeleri de desteklenir.
    - Grup DM’leri ayrı olarak kontrol edilir (`channels.discord.dm.*`, `channels.slack.dm.*`).
    - Telegram izin listesi kullanıcı kimlikleriyle (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) veya kullanıcı adlarıyla (`"@alice"` ya da `"alice"`) eşleşebilir; önekler büyük/küçük harfe duyarsızdır.
    - Varsayılan `groupPolicy: "allowlist"` değeridir; grup izin listeniz boşsa grup mesajları engellenir.
    - Çalışma zamanı güvenliği: bir sağlayıcı bloğu tamamen eksik olduğunda (`channels.<provider>` yoksa), grup ilkesi `channels.defaults.groupPolicy` değerini devralmak yerine kapalı kalma moduna (genellikle `allowlist`) geri döner.

  </Accordion>
</AccordionGroup>

Grup mesajları için hızlı zihinsel model (değerlendirme sırası):

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

Grup mesajları, grup bazında üzerine yazılmadıkça bahsetme gerektirir. Varsayılanlar her alt sistem için `*.groups."*"` altında bulunur.

Kanal yanıt üst verilerini desteklediğinde, bir bot mesajına yanıt vermek örtük bir bahsetme sayılır. Bot mesajını alıntılamak da alıntı üst verilerini açığa çıkaran kanallarda örtük bahsetme sayılabilir. Mevcut yerleşik durumlar Telegram, WhatsApp, Slack, Discord, Microsoft Teams ve ZaloUser içerir.

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
    - `mentionPatterns` büyük/küçük harfe duyarsız güvenli regex kalıplarıdır; geçersiz kalıplar ve güvenli olmayan iç içe tekrar biçimleri yok sayılır.
    - Açık bahsetmeler sağlayan yüzeyler yine de geçer; kalıplar bir geri dönüş yoludur.
    - Ajan bazında geçersiz kılma: `agents.list[].groupChat.mentionPatterns` (birden fazla ajan aynı grubu paylaştığında kullanışlıdır).
    - Bahsetme denetimi yalnızca bahsetme algılaması mümkün olduğunda uygulanır (yerel bahsetmeler veya `mentionPatterns` yapılandırılmıştır).
    - Bir grubu veya göndereni izin listesine almak bahsetme denetimini devre dışı bırakmaz; tüm mesajların tetiklemesi gerektiğinde o grubun `requireMention` değerini `false` olarak ayarlayın.
    - Grup sohbeti istem bağlamı her turda çözümlenmiş sessiz yanıt talimatını taşır; çalışma alanı dosyaları `NO_REPLY` mekaniklerini çoğaltmamalıdır.
    - Sessiz yanıtlara izin verilen gruplar, temiz boş veya yalnızca akıl yürütme içeren model turlarını `NO_REPLY` ile eşdeğer şekilde sessiz sayar. Doğrudan sohbetler bunu yalnızca doğrudan sessiz yanıtlara açıkça izin verildiğinde yapar; aksi halde boş yanıtlar başarısız ajan turları olarak kalır.
    - Discord varsayılanları `channels.discord.guilds."*"` içinde bulunur (guild/kanal bazında geçersiz kılınabilir).
    - Grup geçmişi bağlamı kanallar genelinde tek biçimde sarılır ve **yalnızca bekleyen** niteliktedir (bahsetme denetimi nedeniyle atlanan mesajlar); genel varsayılan için `messages.groupChat.historyLimit`, geçersiz kılmalar için `channels.<channel>.historyLimit` (veya `channels.<channel>.accounts.*.historyLimit`) kullanın. Devre dışı bırakmak için `0` olarak ayarlayın.

  </Accordion>
</AccordionGroup>

## Grup/kanal araç kısıtlamaları (isteğe bağlı)

Bazı kanal yapılandırmaları, **belirli bir grup/oda/kanal içinde** hangi araçların kullanılabilir olduğunu kısıtlamayı destekler.

- `tools`: tüm grup için araçlara izin ver/reddet.
- `toolsBySender`: grup içinde gönderen bazında geçersiz kılmalar. Açık anahtar önekleri kullanın: `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` ve `"*"` joker karakteri. Eski öneksiz anahtarlar hâlâ kabul edilir ve yalnızca `id:` olarak eşleştirilir.

Çözümleme sırası (en özgül olan kazanır):

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
Grup/kanal araç kısıtlamaları global/ajan araç politikasına ek olarak uygulanır (reddetme yine kazanır). Bazı kanallar odalar/kanallar için farklı iç içe yerleşim kullanır (ör. Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).
</Note>

## Grup izin listeleri

`channels.whatsapp.groups`, `channels.telegram.groups` veya `channels.imessage.groups` yapılandırıldığında, anahtarlar grup izin listesi gibi davranır. Varsayılan bahsetme davranışını ayarlamaya devam ederken tüm gruplara izin vermek için `"*"` kullanın.

<Warning>
Yaygın karışıklık: DM eşleştirme onayı, grup yetkilendirmesiyle aynı şey değildir. DM eşleştirmesini destekleyen kanallarda eşleştirme deposu yalnızca DM'lerin kilidini açar. Grup komutları yine de `groupAllowFrom` gibi yapılandırma izin listelerinden veya o kanal için belgelenmiş yapılandırma geri dönüşünden açık grup gönderen yetkilendirmesi gerektirir.
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

Grup sahipleri grup bazında etkinleştirmeyi açıp kapatabilir:

- `/activation mention`
- `/activation always`

Sahip, `channels.whatsapp.allowFrom` ile belirlenir (veya ayarlanmamışsa botun kendi E.164 değeriyle). Komutu tek başına bir mesaj olarak gönderin. Diğer yüzeyler şu anda `/activation` değerini yok sayar.

## Bağlam alanları

Grup gelen yükleri şunları ayarlar:

- `ChatType=group`
- `GroupSubject` (biliniyorsa)
- `GroupMembers` (biliniyorsa)
- `WasMentioned` (bahsetme denetimi sonucu)
- Telegram forum konuları ayrıca `MessageThreadId` ve `IsForum` içerir.

Kanala özgü notlar:

- BlueBubbles, `GroupMembers` doldurulmadan önce adlandırılmamış macOS grup katılımcılarını isteğe bağlı olarak yerel Kişiler veritabanından zenginleştirebilir. Bu varsayılan olarak kapalıdır ve yalnızca normal grup denetimi geçtikten sonra çalışır.

Ajan sistem istemi, yeni bir grup oturumunun ilk turunda bir grup tanıtımı içerir. Modele bir insan gibi yanıt vermesini, Markdown tablolarından kaçınmasını, boş satırları en aza indirmesini ve normal sohbet aralığını izlemesini, ayrıca değişmez `\n` dizileri yazmaktan kaçınmasını hatırlatır. Kanaldan gelen grup adları ve katılımcı etiketleri, satır içi sistem talimatları olarak değil, fenced güvenilmeyen üst veri olarak işlenir.

## iMessage ayrıntıları

- Yönlendirme veya izin listesine alma sırasında `chat_id:<id>` tercih edin.
- Sohbetleri listele: `imsg chats --limit 20`.
- Grup yanıtları her zaman aynı `chat_id` değerine geri gider.

## WhatsApp sistem istemleri

Grup ve doğrudan istem çözümlemesi, joker karakter davranışı ve hesap geçersiz kılma semantiği dahil olmak üzere kanonik WhatsApp sistem istemi kuralları için [WhatsApp](/tr/channels/whatsapp#system-prompts) bölümüne bakın.

## WhatsApp ayrıntıları

Yalnızca WhatsApp davranışı (geçmiş ekleme, bahsetme işleme ayrıntıları) için [Grup mesajları](/tr/channels/group-messages) bölümüne bakın.

## İlgili

- [Yayın grupları](/tr/channels/broadcast-groups)
- [Kanal yönlendirme](/tr/channels/channel-routing)
- [Grup mesajları](/tr/channels/group-messages)
- [Eşleştirme](/tr/channels/pairing)
