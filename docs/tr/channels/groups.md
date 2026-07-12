---
read_when:
    - Grup sohbeti davranışını veya bahsetme denetimini değiştirme
    - mentionPatterns’ı belirli grup konuşmalarıyla sınırlama
sidebarTitle: Groups
summary: Farklı platformlarda grup sohbeti davranışı (Discord/iMessage/Matrix/Microsoft Teams/QQBot/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Gruplar
x-i18n:
    generated_at: "2026-07-12T12:03:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b19356e801e0b44c8409b1eef59a32357977104d46a138934757c4e8a00ed44c
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw; Discord, iMessage, Matrix, Microsoft Teams, QQBot, Signal, Slack, Telegram, WhatsApp ve Zalo dahil olmak üzere grup özellikli kanalların tümünde aynı grup kurallarını uygular.

Temsilci açıkça görünür bir mesaj göndermediği sürece sessiz bağlam sağlaması gereken sürekli etkin odalar için [Ortam oda etkinlikleri](/tr/channels/ambient-room-events) bölümüne bakın.

## Başlangıç tanıtımı (2 dakika)

OpenClaw, kendi mesajlaşma hesaplarınızda "yaşar". Ayrı bir WhatsApp bot kullanıcısı yoktur: **siz** bir gruptaysanız OpenClaw bu grubu görebilir ve orada yanıt verebilir.

Varsayılan davranış:

- Gruplar kısıtlıdır (`groupPolicy: "allowlist"`); grup göndericileri izin verilenler listesine eklenene kadar engellenir.
- Bir grup için bahsetme denetimini devre dışı bırakmadığınız sürece yanıtlar bahsetme gerektirir.
- Son yanıt metni odaya otomatik olarak gönderilir (`visibleReplies: "automatic"`).

Başka bir deyişle, izin verilenler listesindeki göndericiler OpenClaw'dan bahsederek onu tetikleyebilir.

<Note>
**Kısaca**

- **DM erişimi** `*.allowFrom` tarafından denetlenir.
- **Grup erişimi** `*.groupPolicy` ve izin verilenler listeleri (`*.groups`, `*.groupAllowFrom`) tarafından denetlenir.
- **Yanıt tetikleme** bahsetme denetimi (`requireMention`, `/activation`) tarafından yönetilir.

</Note>

Hızlı akış (bir grup mesajına ne olur):

```text
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
mention/reply/command/DM -> user request
always-on group chatter -> user request, or room event when configured
```

## Görünür yanıtlar

Normal grup/kanal isteklerinde OpenClaw varsayılan olarak `messages.groupChat.visibleReplies: "automatic"` kullanır: son asistan metni görünür yanıt olarak odaya gönderilir.

Paylaşılan bir odada temsilcinin ne zaman konuşacağına `message(action=send)` çağrısı yaparak karar vermesi gerekiyorsa `messages.groupChat.visibleReplies: "message_tool"` kullanın. Bu, araçları güvenilir biçimde kullanan modellerle (örneğin GPT-5.6 Sol) en iyi şekilde çalışır. Model aracı kullanmaz ve içerikli bir son metin döndürürse OpenClaw bu metni odaya göndermek yerine gizli tutar.

Yalnızca araçla teslim talimatını güvenilir biçimde izlemeyen modeller veya çalışma zamanları için `"automatic"` kullanın: normal son metinler doğrudan odaya gönderilir; temsilci, son metinle birlikte gönderilemeyen dosyalar, görseller veya diğer ekler için yine de `message(action=send)` çağrısı yapabilir.

Etkin araç politikası kapsamında mesaj aracı kullanılamıyorsa OpenClaw yanıtı sessizce bastırmak yerine otomatik görünür yanıtlara geri döner. `openclaw doctor` bu uyumsuzluk hakkında uyarır.

Doğrudan sohbetler ve diğer tüm kaynak etkinlikleri için `messages.visibleReplies: "message_tool"` aynı yalnızca araç davranışını genel olarak uygular; grup/kanal odaları için `messages.groupChat.visibleReplies` daha özel geçersiz kılma olarak kalır. Dahili WebChat doğrudan turları, Pi ve Codex'in aynı görünür yanıt sözleşmesini alması için varsayılan olarak son yanıtı otomatik teslim eder.

Yalnızca araç modu, çoğu sessiz izleme modu turunda modeli `NO_REPLY` yanıtı vermeye zorlama şeklindeki eski kalıbın yerini alır. Yalnızca araç modunda istem bir `NO_REPLY` sözleşmesi tanımlamaz; görünür hiçbir şey yapmamak, yalnızca mesaj aracını çağırmamak anlamına gelir.

Plugin tarafından yönetilen konuşma bağlamaları istisnadır. Bir Plugin bir ileti dizisini bağlayıp gelen turu üstlendiğinde, Plugin tarafından döndürülen yanıt görünür bağlama yanıtıdır; `message(action=send)` kullanması gerekmez. Bu yanıt, gizli model son metni değil, Plugin çalışma zamanı çıktısıdır.

Doğrudan grup istekleri için yazıyor göstergeleri yine gönderilir. Etkinleştirildiklerinde ortamdaki sürekli etkin oda etkinlikleri, temsilci mesaj aracını çağırmadığı sürece katı ve sessiz kalır.

Oturumlar, ayrıntılı araç/ilerleme özetlerini varsayılan olarak bastırır. Hata ayıklarken mevcut oturumda bunları göstermek için `/verbose on` (veya `/verbose full`), yalnızca son yanıt davranışına dönmek için `/verbose off` kullanın. Ayrıntılılık durumu oturum başınadır ve doğrudan sohbetlerde, gruplarda, kanallarda ve forum konularında aynı şekilde çalışır.

Bahsedilmemiş sürekli etkin grup yazışmalarını kullanıcı istekleri yerine sessiz oda bağlamı olarak göndermek için [Ortam oda etkinlikleri](/tr/channels/ambient-room-events) bölümünü kullanın:

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
    },
  },
}
```

Varsayılan değer `unmentionedInbound: "user_request"` şeklindedir. Bahsetme içeren mesajlar, komutlar, durdurma istekleri ve DM'ler kullanıcı isteği olarak kalır.

Grup/kanal isteklerinde görünür çıktının mesaj aracı üzerinden gönderilmesini zorunlu kılmak için:

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "message_tool",
    },
  },
}
```

Bunu her kaynak sohbet için zorunlu kılmak üzere:

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

Gateway, dosya kaydedildikten sonra `messages` yapılandırma değişikliklerini yeniden başlatma gerektirmeden algılar. Yalnızca yapılandırmanın yeniden yüklenmesi devre dışıysa (`gateway.reload.mode: "off"`) yeniden başlatın.

Komut turları `visibleReplies: "message_tool"` ayarını atlar ve her zaman görünür biçimde yanıt verir: hem yerel eğik çizgi komutları (Discord, Telegram ve yerel komut desteğine sahip diğer yüzeyler) hem de yetkilendirilmiş metin `/...` komutları yanıtlarını kaynak sohbete gönderir. Gruplardaki yetkilendirilmemiş metin `/...` turları yalnızca mesaj aracı modunda kalır; sıradan sohbet turları yapılandırılmış varsayılanı izler.

## Bağlam görünürlüğü ve izin verilenler listeleri

Grup güvenliği için iki farklı denetim kullanılır:

- **Tetikleme yetkilendirmesi**: temsilciyi kimlerin tetikleyebileceği (`groupPolicy`, `groups`, `groupAllowFrom`, kanala özgü izin verilenler listeleri).
- **Bağlam görünürlüğü**: modele hangi ek bağlamın ekleneceği (yanıt/alıntı metni, ileti dizisi geçmişi, iletilmiş meta veriler).

OpenClaw varsayılan olarak bağlamı alındığı biçimde korur: izin verilenler listeleri, modelin hangi alıntılanmış veya geçmiş parçaları göreceğini değil, kimlerin eylemleri tetikleyebileceğini belirler. Ek bağlamı da filtrelemek için `contextVisibility` ayarını belirleyin:

| Mod                 | Davranış                                                                                     |
| ------------------- | -------------------------------------------------------------------------------------------- |
| `"all"` (varsayılan) | Ek bağlamı alındığı biçimde korur.                                                           |
| `"allowlist"`       | Yalnızca izin verilenler listesindeki göndericilerin geçmiş/ileti dizisi/alıntı/iletilmiş bağlamını ekler. |
| `"allowlist_quote"` | `allowlist` ile aynıdır; ayrıca herhangi bir göndericiden açıkça alıntılanan/yanıtlanan mesajı korur. |

Bunu kanal başına (`channels.<channel>.contextVisibility`), hesap başına (`channels.<channel>.accounts.<accountId>.contextVisibility`) veya genel olarak (`channels.defaults.contextVisibility`) ayarlayın. Ek bağlamı alan kanallar (Discord, Feishu, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp), gelen bağlamı oluştururken politikayı uygular; bilinmeyen politika birleşimleri güvenli biçimde reddedilir ve bağlam dışarıda bırakılır.

![Grup mesajı akışı](/images/groups-flow.svg)

Şunları istiyorsanız...

| Amaç                                                        | Ayarlanacak değer                                           |
| ----------------------------------------------------------- | ----------------------------------------------------------- |
| Tüm gruplara izin verip yalnızca @bahsetmelerde yanıt vermek | `groups: { "*": { requireMention: true } }`                 |
| Tüm grup yanıtlarını devre dışı bırakmak                     | `groupPolicy: "disabled"`                                   |
| Yalnızca belirli gruplar                                     | `groups: { "<group-id>": { ... } }` (`"*"` anahtarı olmadan) |
| Gruplarda yalnızca sizin tetikleyebilmeniz                   | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]`  |
| Kanallar arasında tek bir güvenilir gönderici kümesini yeniden kullanmak | `groupAllowFrom: ["accessGroup:operators"]`                 |

Yeniden kullanılabilir gönderici izin listeleri için [Erişim grupları](/tr/channels/access-groups) bölümüne bakın.

## Oturum anahtarları

- Grup oturumları `agent:<agentId>:<channel>:group:<id>` oturum anahtarlarını kullanır (odalar/kanallar `agent:<agentId>:<channel>:channel:<id>` kullanır).
- Telegram forum konuları, her konunun kendi oturumuna sahip olması için grup kimliğine `:topic:<threadId>` ekler.
- Doğrudan sohbetler ana oturumu kullanır (veya `session.dmScope` yapılandırılmışsa gönderici başına oturumları).
- Heartbeat'ler yapılandırılmış Heartbeat oturumunda çalışır (varsayılan: temsilcinin ana oturumu); grup oturumları kendi Heartbeat'lerini çalıştırmaz.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Kalıp: kişisel DM'ler + herkese açık gruplar (tek temsilci)

Evet — "kişisel" trafiğiniz **DM'ler**, "herkese açık" trafiğiniz ise **gruplar** olduğunda bu iyi çalışır.

Nedeni: tek temsilci modunda DM'ler genellikle **ana** oturum anahtarına (`agent:main:main`) ulaşırken gruplar her zaman **ana olmayan** oturum anahtarlarını (`agent:main:<channel>:group:<id>`) kullanır. `mode: "non-main"` ile korumalı alanı etkinleştirirseniz bu grup oturumları yapılandırılmış korumalı alan arka ucunda çalışırken ana DM oturumunuz ana makinede kalır. Bir arka uç seçmezseniz varsayılan arka uç Docker'dır.

Bu, size tek bir temsilci "beyni" (paylaşılan çalışma alanı + bellek), ancak iki yürütme biçimi sağlar:

- **DM'ler**: tüm araçlar (ana makine)
- **Gruplar**: korumalı alan + kısıtlı araçlar

<Note>
Gerçekten ayrı çalışma alanlarına/kişiliklere ihtiyacınız varsa ("kişisel" ve "herkese açık" hiçbir zaman karışmamalıysa), ikinci bir temsilci ve bağlamalar kullanın. [Çok Temsilcili Yönlendirme](/tr/concepts/multi-agent) bölümüne bakın.
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
            // İzin listesi boş değilse diğer her şey engellenir (reddetme yine önceliklidir).
            allow: ["group:messaging", "group:sessions"],
            deny: ["group:runtime", "group:fs", "group:ui", "nodes", "cron", "gateway"],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Gruplar yalnızca izin verilenler listesindeki bir klasörü görür">
    "Ana makineye erişim yok" yerine "gruplar yalnızca X klasörünü görebilir" mi istiyorsunuz? `workspaceAccess: "none"` ayarını koruyun ve yalnızca izin verilenler listesindeki yolları korumalı alana bağlayın:

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

İlgili konular:

- Yapılandırma anahtarları ve varsayılanlar: [Gateway yapılandırması](/tr/gateway/config-agents#agentsdefaultssandbox)
- Bir aracın neden engellendiğinde hata ayıklama: [Korumalı Alan, Araç Politikası ve Yükseltilmiş Yetki](/tr/gateway/sandbox-vs-tool-policy-vs-elevated)
- Bağlama ayrıntıları: [Korumalı alan kullanımı](/tr/gateway/sandboxing#custom-bind-mounts)

## Görünen etiketler

- Kullanıcı arayüzü etiketleri, mevcut olduğunda `<channel>:<token>` biçiminde formatlanan `displayName` değerini kullanır.
- `#room`, odalar/kanallar için ayrılmıştır; grup sohbetleri `g-<slug>` kullanır (küçük harf, boşluklar -> `-`, `#@+._-` karakterlerini koru). Çok uzun, anlamı belirsiz kimlikler; tam rota kimliklerini kullanıcı arayüzüne sızdırmak yerine kararlı bir belirtece kısaltılır.

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
      groupAllowFrom: ["123456789"], // numeric Telegram user id (setup resolves @username)
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

| Politika      | Davranış                                                          |
| ------------- | ----------------------------------------------------------------- |
| `"open"`      | Gruplar izin listelerini atlar; bahsetme denetimi uygulanmaya devam eder. |
| `"disabled"`  | Tüm grup mesajlarını tamamen engeller.                            |
| `"allowlist"` | Yalnızca yapılandırılmış izin listesiyle eşleşen gruplara/odalara izin verir. |

<AccordionGroup>
  <Accordion title="Kanal bazında notlar">
    - `groupPolicy`, bahsetme denetiminden (@bahsetmelerini gerektirir) ayrıdır.
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: `groupAllowFrom` kullanın (geri dönüş: açıkça belirtilmiş `allowFrom`).
    - Signal: `groupAllowFrom`, gelen Signal grup kimliğiyle veya gönderenin telefon numarası/UUID'siyle eşleşebilir.
    - DM eşleştirme onayları (`*-allowFrom` depo girdileri) yalnızca DM erişimine uygulanır; grup göndereni yetkilendirmesi grup izin listelerinde açıkça belirtilmeye devam eder.
    - Discord: izin listesi `channels.discord.guilds.<id>.channels` kullanır.
    - Slack: izin listesi `channels.slack.channels` kullanır.
    - Matrix: izin listesi `channels.matrix.groups` kullanır. Oda kimliklerini (`!room:server`) veya takma adları (`#alias:server`) kullanın; oda adı anahtarları yalnızca `channels.matrix.dangerouslyAllowNameMatching: true` olduğunda eşleşir ve çözümlenemeyen girdiler çalışma zamanında yok sayılır. Gönderenleri kısıtlamak için `channels.matrix.groupAllowFrom` kullanın; oda bazında `users` izin listeleri de desteklenir.
    - Grup DM'leri ayrı olarak denetlenir (`channels.discord.dm.*`, `channels.slack.dm.*`: `groupEnabled`, `groupChannels`).
    - Telegram: gönderen izin listeleri yalnızca sayısal kullanıcı kimliklerini kabul eder (`"123456789"`; `telegram:`/`tg:` önekleri büyük/küçük harfe duyarsız biçimde kaldırılır). `@username` girdileri çalışma zamanında eşleşmez ve bir uyarı kaydeder; kurulum `@username` değerlerini kimliklere çözümler. Negatif sohbet kimlikleri gönderen izin listelerine değil, `channels.telegram.groups` altına yazılmalıdır.
    - Varsayılan değer `groupPolicy: "allowlist"` şeklindedir; grup izin listeniz boşsa grup mesajları engellenir.
    - Çalışma zamanı güvenliği: bir sağlayıcı bloğu tamamen eksik olduğunda (`channels.<provider>` yoksa), grup politikası `channels.defaults.groupPolicy` değerini devralmak yerine güvenli biçimde `allowlist` olarak kapanır ve Gateway bu geri dönüşü hesap başına bir kez günlüğe kaydeder.

  </Accordion>
</AccordionGroup>

Hızlı zihinsel model (grup mesajlarının değerlendirme sırası):

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

Grup bazında geçersiz kılınmadığı sürece grup mesajları bahsetme gerektirir. Varsayılanlar her alt sistem için `*.groups."*"` altında bulunur.

Kanal yanıt meta verilerini sunuyorsa bir bot mesajına yanıt vermek örtük bahsetme sayılır; alıntı meta verilerini sunan kanallarda bir bot mesajını alıntılamak da bahsetme sayılabilir. Mevcut yerleşik durumlar: Discord, Microsoft Teams, QQBot, Slack, Telegram, WhatsApp ve Zalo kişisel.

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

## Yapılandırılmış bahsetme kalıplarını kapsamlandırma

Yapılandırılmış `mentionPatterns` değerleri, düzenli ifade tabanlı geri dönüş tetikleyicileridir. Platform yerel bot bahsetmesi sunmadığında veya `openclaw:` gibi düz metinlerin bahsetme sayılması gerektiğinde bunları kullanın. Yerel platform bahsetmeleri ayrıdır: Discord, Slack, Telegram, Matrix veya başka bir kanal mesajın bottan açıkça bahsettiğini kanıtlayabiliyorsa yapılandırılmış düzenli ifade kalıplarının reddedildiği yerlerde bile bu yerel bahsetme tetikleme yapar.

Varsayılan olarak yapılandırılmış bahsetme kalıpları, kanalın sağlayıcı ve konuşma bilgilerini bahsetme algılamasına ilettiği her yerde uygulanır. Geniş kalıpların aracıyı her grupta uyandırmasını önlemek için bunları `channels.<channel>.mentionPatterns` ile kanal bazında kapsamlandırın.

Düzenli ifade bahsetme kalıplarının bir kanalda varsayılan olarak kapalı olması gerektiğinde `mode: "deny"` kullanın, ardından belirli odaları `allowIn` ile etkinleştirin:

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

Düzenli ifade bahsetme kalıplarının geniş ölçekte uygulanması gerektiğinde varsayılan `mode: "allow"` değerini kullanın (veya `mode` değerini belirtmeyin), ardından gürültülü odalarda `denyIn` ile bunları kapatın:

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

Politika çözümleme:

| Alan            | Etki                                                                                                                  |
| --------------- | --------------------------------------------------------------------------------------------------------------------- |
| `mode: "allow"` | Konuşma kimliği `denyIn` içinde olmadığı sürece düzenli ifade bahsetme kalıpları etkindir. Bu varsayılan davranıştır. |
| `mode: "deny"`  | Konuşma kimliği `allowIn` içinde olmadığı sürece düzenli ifade bahsetme kalıpları devre dışıdır.                     |
| `allowIn`       | Reddetme modunda düzenli ifade bahsetme kalıplarının etkin olduğu konuşma kimlikleri.                                 |
| `denyIn`        | Düzenli ifade bahsetme kalıplarının devre dışı olduğu konuşma kimlikleri. Aynı kimlik ikisinde de bulunuyorsa `denyIn`, `allowIn` değerine üstün gelir. |

Şu anda desteklenen kapsamlandırılmış düzenli ifade politikası:

| Kanal    | `allowIn` / `denyIn` içinde kullanılan kimlikler                |
| -------- | --------------------------------------------------------------- |
| Discord  | Discord kanal kimlikleri.                                       |
| Matrix   | Matrix oda kimlikleri.                                          |
| Slack    | Slack kanal kimlikleri.                                         |
| Telegram | Grup sohbeti kimlikleri veya forum konuları için `chatId:topic:threadId`. |
| WhatsApp | `123@g.us` gibi WhatsApp konuşma kimlikleri.                    |

Kanal birden fazla hesabı destekliyorsa hesap düzeyindeki kanal yapılandırmaları aynı politikayı `channels.<channel>.accounts.<accountId>.mentionPatterns` altında ayarlayabilir. Hesap politikası, ilgili hesap için üst düzey kanal politikasına üstün gelir.

<AccordionGroup>
  <Accordion title="Bahsetme denetimi notları">
    - `mentionPatterns`, büyük/küçük harfe duyarsız güvenli düzenli ifade kalıplarıdır; geçersiz kalıplar ve güvenli olmayan iç içe yineleme biçimleri yok sayılır (bir uyarıyla).
    - Kalıp önceliği: `agents.list[].groupChat.mentionPatterns` (birden fazla aracı aynı grubu paylaştığında kullanışlıdır), `messages.groupChat.mentionPatterns` değerini geçersiz kılar; hiçbiri ayarlanmamışsa kalıplar aracı kimliğinin adından/emojisinden türetilir.
    - Bahsetme denetimi yalnızca bahsetme algılaması mümkün olduğunda uygulanır (yerel bahsetmeler veya yapılandırılmış `mentionPatterns`).
    - Bir grubu veya göndereni izin listesine almak bahsetme denetimini devre dışı bırakmaz; tüm mesajların tetikleme yapması gerektiğinde ilgili grubun `requireMention` değerini `false` olarak ayarlayın.
    - Otomatik grup sohbeti istem bağlamı, çözümlenmiş sessiz yanıt talimatını her turda taşır; çalışma alanı dosyaları `NO_REPLY` mekaniklerini yinelememelidir.
    - Otomatik sessiz yanıtlara izin verilen gruplar, temiz boş veya yalnızca akıl yürütme içeren model turlarını `NO_REPLY` ile eşdeğer biçimde sessiz kabul eder. Doğrudan sohbetler hiçbir zaman `NO_REPLY` yönlendirmesi almaz ve yalnızca mesaj aracını kullanan grup yanıtları `message(action=send)` çağrısı yapmayarak sessiz kalır.
    - Ortamdaki sürekli grup konuşmaları varsayılan olarak kullanıcı isteği semantiğini kullanır. Bunun yerine sessiz bağlam olarak göndermek için `messages.groupChat.unmentionedInbound: "room_event"` ayarını kullanın. Kurulum örnekleri için [Ortam oda olayları](/tr/channels/ambient-room-events) bölümüne bakın.
    - Oda olayları sahte kullanıcı istekleri olarak depolanmaz ve mesaj aracı içermeyen oda olaylarından gelen özel yardımcı metni sohbet geçmişi olarak yeniden oynatılmaz.
    - Discord varsayılanları `channels.discord.guilds."*"` altında bulunur (sunucu/kanal bazında geçersiz kılınabilir).
    - Grup geçmişi bağlamı kanallar genelinde tek tip biçimde sarmalanır. Bahsetme denetimli gruplar bekleyen atlanmış mesajları tutar; sürekli etkin gruplar da kanal destekliyorsa yakın zamanda işlenmiş oda mesajlarını saklayabilir. Genel varsayılan için `messages.groupChat.historyLimit`, geçersiz kılmalar içinse `channels.<channel>.historyLimit` (veya `channels.<channel>.accounts.*.historyLimit`) kullanın. Devre dışı bırakmak için `0` olarak ayarlayın.

  </Accordion>
</AccordionGroup>

## Grup/kanal aracı kısıtlamaları (isteğe bağlı)

Bazı kanal yapılandırmaları, **belirli bir grup/oda/kanal içinde** hangi araçların kullanılabileceğini kısıtlamayı destekler.

- `tools`: tüm grup için araçlara izin verir veya araçları reddeder (`allow`, `alsoAllow`, `deny`; reddetme üstün gelir).
- `toolsBySender`: grup içinde gönderen bazında geçersiz kılmalar. Açık anahtar önekleri kullanın: `channel:<channelId>:<senderId>`, `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` ve `"*"` joker karakteri. Kanal kimlikleri, standart OpenClaw kanal kimliklerini kullanır; `teams` gibi takma adlar `msteams` olarak normalleştirilir. Eski öneksiz anahtarlar hâlâ kabul edilir, yalnızca `id:` olarak eşleştirilir ve kullanımdan kaldırma uyarısı günlüğe kaydedilir.

Çözümleme sırası (en özel olan üstün gelir):

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
Grup/kanal aracı kısıtlamaları, genel/aracı aracı politikasına ek olarak uygulanır (reddetme yine üstün gelir). Bazı kanallar odalar/kanallar için farklı iç içe yerleşim kullanır (ör. Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).
</Note>

## Grup izin listeleri

`channels.whatsapp.groups`, `channels.telegram.groups` veya `channels.imessage.groups` yapılandırıldığında anahtarlar grup izin listesi işlevi görür. Varsayılan bahsetme davranışını ayarlamaya devam ederken tüm gruplara izin vermek için `"*"` kullanın.

<Warning>
Yaygın karışıklık: DM eşleştirme onayı, grup yetkilendirmesiyle aynı değildir. DM eşleştirmesini destekleyen kanallarda eşleştirme deposu yalnızca DM'lerin kilidini açar. Grup komutları için yine de `groupAllowFrom` gibi yapılandırma izin listelerinden veya ilgili kanal için belgelenmiş yapılandırma geri dönüşünden açık grup gönderen yetkilendirmesi gerekir.
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

Grup sahipleri, tek başına gönderilen bir mesajla grup bazında etkinleştirmeyi değiştirebilir:

- `/activation mention`
- `/activation always`

`/activation`, yalnızca sahiplerin kullanabildiği temel bir komuttur ve yalnızca grup sohbetlerinde geçerlidir. Sahip, gönderenin kanalın `allowFrom` / `commands.ownerAllowFrom` değeriyle eşleşmesi anlamına gelir (hiçbir izin listesi yapılandırılmamışsa hesabın kendi kimliği sahip sayılır). Saklanan mod, bunu dikkate alan kanallarda (Google Chat, QQBot, Telegram, WhatsApp) ilgili grubun `requireMention` ayarını geçersiz kılar ve grup sistem istemi girişi her yerde etkin modu yansıtır.

## Bağlam alanları

Gelen grup yükleri şunları ayarlar:

- `ChatType=group`
- `GroupSubject` (biliniyorsa)
- `GroupMembers` (biliniyorsa)
- `WasMentioned` (bahsetme geçidi sonucu)
- Telegram forum konuları ayrıca `MessageThreadId` ve `IsForum` alanlarını içerir.

Aracı sistem istemi, yeni bir grup oturumunun ilk turunda (ve `/activation` değişikliklerinden sonra) bir grup girişi içerir. Bu giriş modele bir insan gibi yanıt vermesini, boş satırları en aza indirmesini, normal sohbet aralığına uymasını ve değişmez `\n` dizileri yazmaktan kaçınmasını hatırlatır. Telegram dışındaki gruplarda Markdown tablolarının kullanımı da önerilmez; Telegram zengin metin yönergeleri Telegram kanal isteminden gelir. Kanaldan alınan grup adları ve katılımcı etiketleri, satır içi sistem talimatları olarak değil, çitli ve güvenilmeyen meta veriler olarak işlenir.

## iMessage ayrıntıları

- Yönlendirme veya izin listesine ekleme sırasında `chat_id:<id>` biçimini tercih edin.
- Sohbetleri listeleme: `imsg chats --limit 20`.
- Grup yanıtları her zaman aynı `chat_id` değerine geri gönderilir.

## WhatsApp sistem istemleri

Grup ve doğrudan istem çözümlemesi, joker karakter davranışı ve hesap geçersiz kılma semantiği dâhil olmak üzere standart WhatsApp sistem istemi kuralları için [WhatsApp](/tr/channels/whatsapp#system-prompts) sayfasına bakın.

## WhatsApp ayrıntıları

Yalnızca WhatsApp'a özgü davranışlar (geçmiş ekleme ve bahsetme işleme ayrıntıları) için [Grup mesajları](/tr/channels/group-messages) sayfasına bakın.

## İlgili

- [Yayın grupları](/tr/channels/broadcast-groups)
- [Kanal yönlendirme](/tr/channels/channel-routing)
- [Grup mesajları](/tr/channels/group-messages)
- [Eşleştirme](/tr/channels/pairing)
