---
read_when:
    - Grup sohbeti davranışını veya bahsetme denetimini değiştirme
    - mentionPatterns’ı belirli grup konuşmalarıyla sınırlandırma
sidebarTitle: Groups
summary: Farklı yüzeylerde grup sohbeti davranışı (Discord/iMessage/Matrix/Microsoft Teams/QQBot/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Gruplar
x-i18n:
    generated_at: "2026-07-16T17:01:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2a708915ca9383d59b1bd2204b59a4df1de4caf677e68c9b7279f773275d67ee
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw, Discord, iMessage, Matrix, Microsoft Teams, QQBot, Signal, Slack, Telegram, WhatsApp ve Zalo dahil olmak üzere grup destekli kanalların tamamında aynı grup kurallarını uygular.

Agent açıkça görünür bir mesaj göndermediği sürece sessiz bağlam sağlaması gereken sürekli etkin odalar için [Ortam oda olayları](/tr/channels/ambient-room-events) bölümüne bakın.

## Başlangıç tanıtımı (2 dakika)

OpenClaw kendi mesajlaşma hesaplarınızda "yaşar". Ayrı bir WhatsApp bot kullanıcısı yoktur: bir grupta **siz** bulunuyorsanız OpenClaw bu grubu görebilir ve orada yanıt verebilir.

Varsayılan davranış:

- Gruplar kısıtlıdır (`groupPolicy: "allowlist"`); grup göndericileri izin listesine alınana kadar engellenir.
- Bir grup için bahsetme geçidini devre dışı bırakmadığınız sürece yanıtlar bahsetme gerektirir.
- Nihai yanıt metni odaya otomatik olarak gönderilir (`visibleReplies: "automatic"`).

Başka bir deyişle: izin listesindeki göndericiler OpenClaw'dan bahsederek onu tetikleyebilir.

<Note>
**Özet**

- `*.allowFrom`, **DM erişimini** denetler.
- `*.groupPolicy` + izin listeleri (`*.groups`, `*.groupAllowFrom`), **grup erişimini** denetler.
- Bahsetme geçidi (`requireMention`, `/activation`), **yanıt tetiklemeyi** denetler.

</Note>

Hızlı akış (bir grup mesajına ne olur):

```text
groupPolicy? disabled -> bırak
groupPolicy? allowlist -> gruba izin veriliyor mu? hayır -> bırak
requireMention? evet -> bahsedildi mi? hayır -> yalnızca bağlam için sakla
bahsetme/yanıt/komut/DM -> kullanıcı isteği
sürekli etkin grup sohbeti -> kullanıcı isteği veya yapılandırıldığında oda olayı
```

## Görünür yanıtlar

Normal grup/kanal isteklerinde OpenClaw varsayılan olarak `messages.groupChat.visibleReplies: "automatic"` kullanır: asistanın nihai metni görünür yanıt olarak odaya gönderilir.

Paylaşılan bir odada agent'ın ne zaman konuşacağına `message(action=send)` çağrısı yaparak karar vermesi gerekiyorsa `messages.groupChat.visibleReplies: "message_tool"` kullanın. Bu, araçları güvenilir biçimde kullanan modellerle (örneğin GPT-5.6 Sol) en iyi şekilde çalışır. Model aracı kullanmayı atlar ve anlamlı bir nihai metin döndürürse OpenClaw bu metni odaya göndermek yerine gizli tutar.

Yalnızca araçla teslim kuralını güvenilir biçimde izlemeyen modeller veya çalışma zamanları için `"automatic"` kullanın: normal nihai metinler doğrudan odaya gönderilir ve agent, nihai metinle birlikte gönderilemeyen dosyalar, görseller veya diğer ekler için yine de `message(action=send)` çağrısı yapabilir.

Mesaj aracı etkin araç politikası kapsamında kullanılamıyorsa OpenClaw yanıtı sessizce engellemek yerine otomatik görünür yanıtlara geri döner. `openclaw doctor` bu uyumsuzluk konusunda uyarır.

Doğrudan sohbetler ve diğer tüm kaynak olayları için `messages.visibleReplies: "message_tool"` aynı yalnızca araç davranışını genel olarak uygular; `messages.groupChat.visibleReplies`, grup/kanal odaları için daha özel geçersiz kılma olarak kalır. Dahili WebChat doğrudan turları varsayılan olarak nihai yanıtı otomatik teslim eder; böylece Pi ve Codex aynı görünür yanıt sözleşmesine sahip olur.

Yalnızca araç modu, çoğu sessiz izleme modu turunda modeli `NO_REPLY` yanıtını vermeye zorlama şeklindeki eski kalıbın yerini alır. Yalnızca araç modunda istem bir `NO_REPLY` sözleşmesi tanımlamaz; görünür hiçbir şey yapmamak, yalnızca mesaj aracını çağırmamak anlamına gelir.

Plugin'ın sahip olduğu konuşma bağlamaları istisnadır. Bir Plugin, iş parçacığını bağlayıp gelen turun sahipliğini aldıktan sonra Plugin'ın döndürdüğü yanıt görünür bağlama yanıtıdır; `message(action=send)` gerektirmez. Bu yanıt gizli model nihai metni değil, Plugin çalışma zamanı çıktısıdır.

Doğrudan grup istekleri için yazıyor göstergeleri gönderilmeye devam eder. Etkinleştirildiğinde ortam niteliğindeki sürekli etkin oda olayları, agent mesaj aracını çağırmadığı sürece katı ve sessiz kalır.

Oturumlar ayrıntılı araç/ilerleme özetlerini varsayılan olarak bastırır. Hata ayıklarken mevcut oturumda bunları göstermek için `/verbose on` (veya `/verbose full`), yalnızca nihai yanıt davranışına dönmek için `/verbose off` kullanın. Ayrıntılı durum oturuma özeldir ve doğrudan sohbetlerde, gruplarda, kanallarda ve forum konularında aynı şekilde çalışır.

Bahsedilmemiş sürekli etkin grup sohbetini kullanıcı istekleri yerine sessiz oda bağlamı olarak göndermek için [Ortam oda olayları](/tr/channels/ambient-room-events) özelliğini kullanın:

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
    },
  },
}
```

Varsayılan değer `unmentionedInbound: "user_request"` şeklindedir. Bahsetmeler içeren mesajlar, komutlar, iptal istekleri ve DM'ler kullanıcı isteği olarak kalır.

Grup/kanal isteklerinde görünür çıktının mesaj aracından geçmesini zorunlu kılmak için:

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "message_tool",
    },
  },
}
```

Bunu her kaynak sohbeti için zorunlu kılmak üzere:

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

Dosya kaydedildikten sonra Gateway, `messages` yapılandırma değişikliklerini yeniden başlatma olmadan algılar. Yalnızca yapılandırmanın yeniden yüklenmesi devre dışı bırakıldığında (`gateway.reload.mode: "off"`) yeniden başlatın.

Komut turları `visibleReplies: "message_tool"` davranışını atlar ve her zaman görünür biçimde yanıt verir: yerel eğik çizgi komutları (Discord, Telegram ve yerel komut desteği sunan diğer yüzeyler) ile yetkili metin `/...` komutlarının ikisi de yanıtlarını kaynak sohbete gönderir. Gruplardaki yetkisiz metin `/...` turları yalnızca mesaj aracı modunda kalır; sıradan sohbet turları yapılandırılan varsayılanı izler.

## Bağlam görünürlüğü ve izin listeleri

Grup güvenliğinde iki farklı denetim rol oynar:

- **Tetikleme yetkilendirmesi**: agent'ı kimlerin tetikleyebileceği (`groupPolicy`, `groups`, `groupAllowFrom`, kanala özgü izin listeleri).
- **Bağlam görünürlüğü**: modele hangi tamamlayıcı bağlamın ekleneceği (yanıt/alıntı metni, iş parçacığı geçmişi, iletilmiş meta veriler).

OpenClaw varsayılan olarak bağlamı alındığı biçimde korur: izin listeleri modelin hangi alıntılanmış veya geçmiş parçaları göreceğine değil, eylemleri kimlerin tetikleyebileceğine karar verir. Tamamlayıcı bağlamı da filtrelemek için `contextVisibility` ayarını belirleyin:

| Mod                | Davranış                                                                         |
| ------------------- | -------------------------------------------------------------------------------- |
| `"all"` (varsayılan)   | Tamamlayıcı bağlamı alındığı biçimde korur.                                           |
| `"allowlist"`       | Yalnızca izin listesindeki göndericilerden gelen geçmiş/iş parçacığı/alıntı/iletilmiş bağlamı ekler.     |
| `"allowlist_quote"` | `allowlist`; ayrıca herhangi bir göndericiden açıkça alıntılanan/yanıtlanan mesajı korur. |

Bunu kanal başına (`channels.<channel>.contextVisibility`), hesap başına (`channels.<channel>.accounts.<accountId>.contextVisibility`) veya genel olarak (`channels.defaults.contextVisibility`) ayarlayın. Tamamlayıcı bağlamı getiren kanallar (Discord, Feishu, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp), gelen bağlamı oluştururken politikayı uygular; bilinmeyen politika birleşimleri güvenli biçimde kapalı kalır ve bağlamı dahil etmez.

![Grup mesajı akışı](/images/groups-flow.svg)

Şunları istiyorsanız...

| Amaç                                         | Ayarlanacak değer                                                |
| -------------------------------------------- | ---------------------------------------------------------- |
| Tüm gruplara izin ver, ancak yalnızca @bahsetmelerde yanıtla | `groups: { "*": { requireMention: true } }`                |
| Tüm grup yanıtlarını devre dışı bırak                    | `groupPolicy: "disabled"`                                  |
| Yalnızca belirli gruplar                         | `groups: { "<group-id>": { ... } }` (`"*"` anahtarı olmadan)         |
| Gruplarda yalnızca siz tetikleyebilirsiniz               | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |
| Güvenilir bir gönderici kümesini kanallar genelinde yeniden kullan | `groupAllowFrom: ["accessGroup:operators"]`                |

Yeniden kullanılabilir gönderici izin listeleri için [Erişim grupları](/tr/channels/access-groups) bölümüne bakın.

## Oturum anahtarları

- Grup oturumları `agent:<agentId>:<channel>:group:<id>` oturum anahtarlarını kullanır (odalar/kanallar `agent:<agentId>:<channel>:channel:<id>` kullanır).
- Telegram forum konuları, her konunun kendi oturumuna sahip olması için grup kimliğine `:topic:<threadId>` ekler.
- Doğrudan sohbetler ana oturumu kullanır (veya `session.dmScope` yapılandırılmışsa gönderici başına oturumları).
- Heartbeat'ler yapılandırılmış Heartbeat oturumunda çalışır (varsayılan: agent'ın ana oturumu); grup oturumları kendi Heartbeat'lerini çalıştırmaz.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Kalıp: kişisel DM'ler + herkese açık gruplar (tek agent)

Evet — "kişisel" trafiğiniz **DM'ler**, "herkese açık" trafiğiniz ise **gruplar** ise bu yöntem iyi çalışır.

Nedeni: tek agent modunda DM'ler genellikle **ana** oturum anahtarına (`agent:main:main`) ulaşırken gruplar her zaman **ana olmayan** oturum anahtarlarını (`agent:main:<channel>:group:<id>`) kullanır. Korumalı alanı `mode: "non-main"` ile etkinleştirirseniz bu grup oturumları yapılandırılmış korumalı alan arka ucunda çalışırken ana DM oturumunuz ana makinede kalır. Bir arka uç seçmezseniz varsayılan arka uç Docker'dır.

Böylece tek bir agent "beynine" (paylaşılan çalışma alanı + bellek), ancak iki yürütme duruşuna sahip olursunuz:

- **DM'ler**: tüm araçlar (ana makine)
- **Gruplar**: korumalı alan + kısıtlı araçlar

<Note>
Gerçekten ayrı çalışma alanlarına/personalarına ihtiyacınız varsa ("kişisel" ve "herkese açık" hiçbir zaman karışmamalıysa), ikinci bir agent + bağlamalar kullanın. [Çok Agent'lı Yönlendirme](/tr/concepts/multi-agent) bölümüne bakın.
</Note>

<Tabs>
  <Tab title="DM'ler ana makinede, gruplar korumalı alanda">
    ```json5
    {
      agents: {
        defaults: {
          sandbox: {
            mode: "non-main", // gruplar/kanallar ana değildir -> korumalı alanda
            scope: "session", // en güçlü yalıtım (grup/kanal başına bir kapsayıcı)
            workspaceAccess: "none",
          },
        },
      },
      tools: {
        sandbox: {
          tools: {
            // allow boş değilse diğer her şey engellenir (deny yine de önceliklidir).
            allow: ["group:messaging", "group:sessions"],
            deny: ["group:runtime", "group:fs", "group:ui", "nodes", "cron", "gateway"],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Gruplar yalnızca izin listesindeki bir klasörü görür">
    "Ana makine erişimi yok" yerine "gruplar yalnızca X klasörünü görebilir" mi istiyorsunuz? `workspaceAccess: "none"` ayarını koruyun ve korumalı alana yalnızca izin listesindeki yolları bağlayın:

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

İlgili bölümler:

- Yapılandırma anahtarları ve varsayılanlar: [Gateway yapılandırması](/tr/gateway/config-agents#agentsdefaultssandbox)
- Bir aracın neden engellendiğini hata ayıklama: [Korumalı Alan ile Araç Politikası ile Yükseltilmiş Yetki Karşılaştırması](/tr/gateway/sandbox-vs-tool-policy-vs-elevated)
- Bağlama ayrıntıları: [Korumalı Alan](/tr/gateway/sandboxing#custom-bind-mounts)

## Görüntüleme etiketleri

- Kullanılabildiğinde UI etiketleri `displayName` kullanır ve `<channel>:<token>` biçiminde düzenlenir.
- `#room`, odalar/kanallar için ayrılmıştır; grup sohbetleri `g-<slug>` kullanır (küçük harf, boşluklar -> `-`, `#@+._-` korunur). Çok uzun, anlaşılmaz kimlikler, tam yönlendirme kimliklerinin UI'a sızdırılması yerine kararlı bir belirteç hâlinde kısaltılır.

## Grup politikası

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
      groupAllowFrom: ["123456789"], // sayısal Telegram kullanıcı kimliği (kurulum @username değerini çözümler)
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
        GUILD_ID: { channels: { help: { enabled: true } } },
      },
    },
    slack: {
      groupPolicy: "allowlist",
      channels: { "#general": { enabled: true } },
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

| İlke          | Davranış                                                       |
| ------------- | -------------------------------------------------------------- |
| `"open"`      | Gruplar izin listelerini atlar; bahsetme geçidi uygulanmaya devam eder. |
| `"disabled"`  | Tüm grup mesajlarını tamamen engeller.                         |
| `"allowlist"` | Yalnızca yapılandırılmış izin listesiyle eşleşen gruplara/odalara izin verir. |

<AccordionGroup>
  <Accordion title="Kanal bazında notlar">
    - `groupPolicy`, bahsetme geçidinden (@bahsetmeler gerektirir) ayrıdır.
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: `groupAllowFrom` kullanın (geri dönüş: açıkça belirtilen `allowFrom`).
    - Signal: `groupAllowFrom`, gelen Signal grup kimliğiyle veya gönderenin telefon numarası/UUID değeriyle eşleşebilir.
    - DM eşleştirme onayları (`*-allowFrom` deposu girdileri) yalnızca DM erişimine uygulanır; grup göndereni yetkilendirmesi açıkça grup izin listeleriyle belirlenmeye devam eder.
    - Discord: izin listesi `channels.discord.guilds.<id>.channels` kullanır.
    - Slack: izin listesi `channels.slack.channels` kullanır.
    - Matrix: izin listesi `channels.matrix.groups` kullanır. Oda kimliklerini (`!room:server`) veya takma adları (`#alias:server`) kullanın; oda adı anahtarları yalnızca `channels.matrix.dangerouslyAllowNameMatching: true` ile eşleşir ve çözümlenemeyen girdiler çalışma zamanında yok sayılır. Gönderenleri kısıtlamak için `channels.matrix.groupAllowFrom` kullanın; oda bazında `users` izin listeleri de desteklenir.
    - Grup DM'leri ayrı olarak denetlenir (`channels.discord.dm.*`, `channels.slack.dm.*`: `groupEnabled`, `groupChannels`).
    - Telegram: gönderen izin listeleri yalnızca sayısal kullanıcı kimliklerini kabul eder (`"123456789"`; `telegram:`/`tg:` önekleri büyük/küçük harfe duyarsız biçimde kaldırılır). `@username` girdileri çalışma zamanında eşleşmez ve bir uyarı kaydeder; kurulum `@username` değerlerini kimliklere çözümler. Negatif sohbet kimlikleri gönderen izin listelerine değil, `channels.telegram.groups` altına aittir.
    - Varsayılan değer `groupPolicy: "allowlist"`; grup izin listeniz boşsa grup mesajları engellenir.
    - Çalışma zamanı güvenliği: bir sağlayıcı bloğu tamamen eksik olduğunda (`channels.<provider>` yoksa), grup ilkesi `channels.defaults.groupPolicy` değerini devralmak yerine güvenli biçimde `allowlist` durumuna geçer ve Gateway geri dönüşü hesap başına bir kez günlüğe kaydeder.

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
  <Step title="Bahsetme geçidi">
    Bahsetme geçidi (`requireMention`, `/activation`).
  </Step>
</Steps>

## Bahsetme geçidi (varsayılan)

Grup bazında geçersiz kılınmadığı sürece grup mesajları bir bahsetme gerektirir. Varsayılanlar her alt sistemde `*.groups."*"` altında bulunur.

Kanal yanıt meta verilerini sağladığında bir bot mesajını yanıtlamak örtük bir bahsetme sayılır; alıntı meta verilerini sağlayan kanallarda bir bot mesajından alıntı yapmak da bahsetme sayılabilir. Mevcut yerleşik durumlar: Discord, Microsoft Teams, QQBot, Slack, Telegram, WhatsApp ve Zalo kişisel.

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

## Yapılandırılmış bahsetme kalıplarının kapsamı

Yapılandırılmış `mentionPatterns`, yedek regex tetikleyicileridir. Platform
yerel bir bot bahsetmesi sağlamadığında veya `openclaw:` gibi düz metnin
bahsetme sayılmasını istediğinizde bunları kullanın. Yerel platform bahsetmeleri ayrıdır:
Discord, Slack, Telegram, Matrix, Signal veya başka bir kanal mesajın
botu açıkça belirttiğini kanıtlayabildiğinde, yapılandırılmış regex kalıpları
reddedilmiş olsa bile bu yerel bahsetme tetiklemeye devam eder.

Varsayılan olarak yapılandırılmış bahsetme kalıpları, kanalın sağlayıcı ve konuşma bilgilerini bahsetme algılamasına ilettiği her yerde uygulanır. Geniş kalıpların her grupta agent'ı uyandırmasını önlemek için `channels.<channel>.mentionPatterns` ile bunları kanal bazında kapsamlandırın.

Regex bahsetme kalıplarının bir kanal için varsayılan olarak kapalı olması gerektiğinde `mode: "deny"` kullanın, ardından belirli odaları `allowIn` ile etkinleştirin:

```json5
{
  messages: {
    groupChat: {
      mentionPatterns: ["\\bopenclaw\\b", "\\bops bot\\b"],
    },
  },
  channels: {
    slack: {
      mentionPatterns: {
        mode: "deny",
        allowIn: ["C0123OPS"],
      },
    },
  },
}
```

Regex bahsetme kalıplarının geniş kapsamda uygulanması gerektiğinde varsayılan `mode: "allow"` değerini kullanın (veya `mode` değerini atlayın), ardından gürültülü odalarda `denyIn` ile bunları kapatın:

```json5
{
  messages: {
    groupChat: {
      mentionPatterns: ["\\bopenclaw\\b"],
    },
  },
  channels: {
    telegram: {
      mentionPatterns: {
        denyIn: ["-1001234567890", "-1001234567890:topic:42"],
      },
    },
  },
}
```

İlke çözümleme:

| Alan            | Etki                                                                                                                  |
| --------------- | --------------------------------------------------------------------------------------------------------------------- |
| `mode: "allow"` | Konuşma kimliği `denyIn` içinde olmadığı sürece regex bahsetme kalıpları etkindir. Bu varsayılandır.        |
| `mode: "deny"`  | Konuşma kimliği `allowIn` içinde olmadığı sürece regex bahsetme kalıpları devre dışıdır.                    |
| `allowIn`       | Reddetme modunda regex bahsetme kalıplarının etkin olduğu konuşma kimlikleri.                                    |
| `denyIn`        | Regex bahsetme kalıplarının devre dışı olduğu konuşma kimlikleri. Her ikisi de aynı kimliği içeriyorsa `denyIn`, `allowIn` değerine üstün gelir. |

Bugün desteklenen kapsamlandırılmış regex ilkesi:

| Kanal    | `allowIn` / `denyIn` içinde kullanılan kimlikler |
| -------- | ------------------------------------------------------------ |
| Discord  | Discord kanal kimlikleri.                                    |
| Matrix   | Matrix oda kimlikleri.                                       |
| Slack    | Slack kanal kimlikleri.                                      |
| Telegram | Grup sohbeti kimlikleri veya forum konuları için `chatId:topic:threadId`. |
| WhatsApp | `123@g.us` gibi WhatsApp konuşma kimlikleri.         |

Hesap düzeyindeki kanal yapılandırmaları, ilgili kanal birden fazla hesabı desteklediğinde aynı ilkeyi `channels.<channel>.accounts.<accountId>.mentionPatterns` altında ayarlayabilir. Hesap ilkesi, ilgili hesap için üst düzey kanal ilkesine üstün gelir.

<AccordionGroup>
  <Accordion title="Bahsetme geçidi notları">
    - `mentionPatterns`, büyük/küçük harfe duyarsız güvenli regex kalıplarıdır; geçersiz kalıplar ve güvenli olmayan iç içe yineleme biçimleri yok sayılır (bir uyarıyla).
    - Kalıp önceliği: `agents.list[].groupChat.mentionPatterns` (birden fazla agent aynı grubu paylaştığında kullanışlıdır), `messages.groupChat.mentionPatterns` değerini geçersiz kılar; ikisi de ayarlanmamışsa kalıplar agent kimliğinin adından/emojisinden türetilir.
    - Bahsetme geçidi yalnızca bahsetme algılaması mümkün olduğunda (yerel bahsetmeler veya `mentionPatterns` yapılandırıldığında) uygulanır.
    - Bir grubu veya göndereni izin listesine eklemek bahsetme geçidini devre dışı bırakmaz; tüm mesajların tetiklemesi gerektiğinde ilgili grubun `requireMention` değerini `false` olarak ayarlayın.
    - Otomatik grup sohbeti istem bağlamı, çözümlenmiş sessiz yanıt talimatını her turda taşır; çalışma alanı dosyaları `NO_REPLY` işleyişini yinelememelidir.
    - Otomatik sessiz yanıtlara izin verilen gruplar, temiz boş veya yalnızca akıl yürütme içeren model turlarını `NO_REPLY` ile eşdeğer şekilde sessiz kabul eder. Doğrudan sohbetler hiçbir zaman `NO_REPLY` yönlendirmesi almaz ve yalnızca mesaj aracı kullanan grup yanıtları `message(action=send)` çağrısı yapmayarak sessiz kalır.
    - Ortamda sürekli etkin grup konuşmaları varsayılan olarak kullanıcı isteği semantiğini kullanır. Bunun yerine sessiz bağlam olarak göndermek için `messages.groupChat.unmentionedInbound: "room_event"` ayarlayın. Kurulum örnekleri için [Ortam oda olayları](/tr/channels/ambient-room-events) bölümüne bakın.
    - Oda olayları sahte kullanıcı istekleri olarak depolanmaz ve mesaj aracı kullanılmayan oda olaylarındaki özel asistan metni sohbet geçmişi olarak yeniden oynatılmaz.
    - Discord varsayılanları `channels.discord.guilds."*"` içinde bulunur (sunucu/kanal bazında geçersiz kılınabilir).
    - Grup geçmişi bağlamı kanallar genelinde tek biçimde sarmalanır. Bahsetme geçitli gruplar bekleyen atlanmış mesajları tutar; sürekli etkin gruplar da kanal desteklediğinde yakın zamanda işlenmiş oda mesajlarını tutabilir. Genel varsayılan için `messages.groupChat.historyLimit`, geçersiz kılmalar için `channels.<channel>.historyLimit` (veya `channels.<channel>.accounts.*.historyLimit`) kullanın. Devre dışı bırakmak için `0` ayarlayın.

  </Accordion>
</AccordionGroup>

## Grup/kanal aracı kısıtlamaları (isteğe bağlı)

Bazı kanal yapılandırmaları, **belirli bir grup/oda/kanal içinde** hangi araçların kullanılabileceğinin kısıtlanmasını destekler.

- `tools`: grubun tamamı için araçlara izin verin/reddedin (`allow`, `alsoAllow`, `deny`; reddetme üstün gelir).
- `toolsBySender`: grup içinde gönderen bazında geçersiz kılmalar. Açık anahtar öneklerini kullanın: `channel:<channelId>:<senderId>`, `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` ve `"*"` joker karakteri. Kanal kimlikleri standart OpenClaw kanal kimliklerini kullanır; `teams` gibi takma adlar `msteams` değerine normalleştirilir. Öneksiz eski anahtarlar hâlâ kabul edilir, yalnızca `id:` olarak eşleştirilir ve kullanımdan kaldırma uyarısı kaydeder.

Çözümleme sırası (en belirgin olan üstün gelir):

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
Grup/kanal araç kısıtlamaları, genel/ajan araç politikasına ek olarak uygulanır (reddetme yine önceliklidir). Bazı kanallar odalar/kanallar için farklı iç içe yerleştirme kullanır (ör. Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).
</Note>

## Grup izin listeleri

`channels.whatsapp.groups`, `channels.telegram.groups` veya `channels.imessage.groups` yapılandırıldığında anahtarlar grup izin listesi işlevi görür. Varsayılan bahsetme davranışını ayarlamaya devam ederken tüm gruplara izin vermek için `"*"` kullanın.

<Warning>
Yaygın karışıklık: DM eşleştirme onayı, grup yetkilendirmesiyle aynı değildir. DM eşleştirmesini destekleyen kanallarda eşleştirme deposu yalnızca DM'lerin kilidini açar. Grup komutları yine de `groupAllowFrom` gibi yapılandırma izin listelerinden veya ilgili kanal için belgelenmiş yapılandırma geri dönüşünden açık grup gönderen yetkilendirmesi gerektirir.
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
  <Tab title="Tüm gruplara izin ver ancak bahsetmeyi zorunlu kıl">
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

Grup sahipleri, bağımsız bir mesajla grup başına etkinleştirmeyi açıp kapatabilir:

- `/activation mention`
- `/activation always`

`/activation`, sahip denetimli bir çekirdek komuttur ve yalnızca grup sohbetlerinde geçerlidir. Sahip, gönderenin `commands.ownerAllowFrom` ile eşleşmesi anlamına gelir; kanal `allowFrom` listeleri yalnızca olağan kanal ve komut erişimini denetler. Depolanan mod, bu ayarı dikkate alan kanallarda (Google Chat, QQBot, Telegram, WhatsApp) ilgili grubun `requireMention` değerini geçersiz kılar ve grup sistem istemi girişi her yerde etkin modu yansıtır.

## Bağlam alanları

Gelen grup yükleri şunları ayarlar:

- `ChatType=group`
- `GroupSubject` (biliniyorsa)
- `GroupMembers` (biliniyorsa)
- `WasMentioned` (bahsetme geçidi sonucu)
- Telegram forum konuları ayrıca `MessageThreadId` ve `IsForum` içerir.

Ajan sistem istemi, yeni bir grup oturumunun ilk turunda (ve `/activation` değiştikten sonra) bir grup girişi içerir. Bu giriş modele insan gibi yanıt vermesini, boş satırları en aza indirip normal sohbet aralıklarına uymasını ve değişmez `\n` dizilerini yazmaktan kaçınmasını hatırlatır. Bildirilen tablo modu yerel veya ham tabloları korumayan kanallarda Markdown tablolarının kullanımı da önerilmez. Kanal kaynaklı grup adları ve katılımcı etiketleri, satır içi sistem talimatları olarak değil, çitle çevrili güvenilmeyen meta veriler olarak oluşturulur.

## iMessage ayrıntıları

- Yönlendirme veya izin listesine ekleme sırasında `chat_id:<id>` kullanmayı tercih edin.
- Sohbetleri listeleme: `imsg chats --limit 20`.
- Grup yanıtları her zaman aynı `chat_id` öğesine geri gönderilir.

## WhatsApp sistem istemleri

Grup ve doğrudan istem çözümlemesi, joker karakter davranışı ve hesap geçersiz kılma semantiği dahil olmak üzere standart WhatsApp sistem istemi kuralları için [WhatsApp](/tr/channels/whatsapp#system-prompts) bölümüne bakın.

## WhatsApp ayrıntıları

Yalnızca WhatsApp'a özgü davranışlar (geçmiş ekleme, bahsetme işleme ayrıntıları) için [Grup mesajları](/tr/channels/group-messages) bölümüne bakın.

## İlgili

- [Yayın grupları](/tr/channels/broadcast-groups)
- [Kanal yönlendirme](/tr/channels/channel-routing)
- [Grup mesajları](/tr/channels/group-messages)
- [Eşleştirme](/tr/channels/pairing)
