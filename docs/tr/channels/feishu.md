---
read_when:
    - Bir Feishu/Lark botuna bağlanmak istiyorsunuz
    - Feishu kanalını yapılandırıyorsunuz
summary: Feishu botuna genel bakış, özellikler ve yapılandırma
title: Feishu
x-i18n:
    generated_at: "2026-07-16T16:36:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 007f3db63fe70b9e7f0267043e47555af7dd55e73c8fd78156b1c9190360b858
    source_path: channels/feishu.md
    workflow: 16
---

OpenClaw, resmi `@openclaw/feishu` plugin'i aracılığıyla Feishu/Lark'a (hepsi bir arada iş birliği platformu) bağlanır: bot doğrudan mesajları, grup sohbetleri, akışlı kart yanıtları ve Feishu belge/wiki/drive/Bitable araçları.

**Durum:** bot doğrudan mesajları ve grup sohbetleri için üretime hazırdır. WebSocket varsayılan olay aktarımıdır (genel URL gerekmez); webhook modu isteğe bağlıdır.

## Hızlı başlangıç

<Note>
OpenClaw 2026.5.29 veya üzerini gerektirir. Kontrol etmek için `openclaw --version` komutunu çalıştırın. `openclaw update` ile yükseltin.
</Note>

<Steps>
  <Step title="Kanal kurulum sihirbazını çalıştırın">
  ```bash
  openclaw channels login --channel feishu
  ```
  Bu işlem, eksikse `@openclaw/feishu` plugin'ini yükler ve ardından kurulum adımlarında size rehberlik eder:

- **Manuel kurulum**: Feishu Open Platform'dan (`https://open.feishu.cn`) veya Lark Developer'dan (`https://open.larksuite.com`) bir App ID ve App Secret yapıştırın.
- **QR kurulumu**: Otomatik olarak bot oluşturmak için Feishu uygulamasında bir QR kodu tarayın. Bu akış, doğrudan mesajları kendi hesabınızla sınırlar (`open_id` değerinizle `dmPolicy: "allowlist"`).

Sihirbaz ayrıca API etki alanını (Feishu veya Lark) ve grup politikasını sorar. Çin içi Feishu mobil uygulaması QR koduna tepki vermezse kurulumu yeniden çalıştırıp manuel kurulumu seçin.
</Step>

  <Step title="Kurulum tamamlandıktan sonra değişiklikleri uygulamak için Gateway'i yeniden başlatın">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

## Erişim denetimi

### Doğrudan mesajlar

Bota kimlerin doğrudan mesaj gönderebileceğini denetlemek için `channels.feishu.dmPolicy` değerini (varsayılan: `pairing`) yapılandırın:

| Değer         | Davranış                                                                                                      |
| ------------- | ------------------------------------------------------------------------------------------------------------- |
| `"pairing"`   | Bilinmeyen kullanıcılar bir eşleştirme kodu alır; CLI üzerinden onaylayın                                                         |
| `"allowlist"` | Yalnızca `allowFrom` içinde listelenen kullanıcılar sohbet edebilir                                                                     |
| `"open"`      | Herkese açık doğrudan mesajlar; yapılandırma doğrulaması, `allowFrom` değerinin `"*"` içermesini gerektirir. Joker karakter olmayan girdiler erişimi yine de daraltır |

**Bir eşleştirme isteğini onaylayın:**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### Grup sohbetleri

**Grup politikası** (`channels.feishu.groupPolicy`, varsayılan: `allowlist`):

| Değer         | Davranış                                                                                     |
| ------------- | -------------------------------------------------------------------------------------------- |
| `"open"`      | Gruplardaki tüm mesajları yanıtla                                                            |
| `"allowlist"` | Yalnızca `groupAllowFrom` içindeki veya `groups.<chat_id>` altında açıkça yapılandırılmış grupları yanıtla |
| `"disabled"`  | Tüm grup mesajlarını devre dışı bırak; açık `groups.<chat_id>` girdileri bunu geçersiz kılmaz         |

**Bahsetme gereksinimi** (`channels.feishu.requireMention`):

- Varsayılan: Etkin grup politikası `"open"` olmadıkça @bahsetme gerekir; bu politikada varsayılan değer `false` olur, böylece bahsetme içeremeyen mesajlar (örneğin görseller) yine de ajana ulaşır.
- Geçersiz kılmak için `true` veya `false` değerini açıkça ayarlayın; grup başına geçersiz kılma: `channels.feishu.groups.<chat_id>.requireMention`.
- Yalnızca yayın amaçlı `@all` ve `@_all`, bottan bahsetme olarak değerlendirilmez. Hem `@all` hem de doğrudan bottan bahseden bir mesaj yine de bottan bahsetme sayılır.

## Grup yapılandırma örnekleri

### Tüm gruplara izin ver, @bahsetme gerekmesin

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open", // "open" altında requireMention varsayılan olarak false olur
    },
  },
}
```

### Tüm gruplara izin ver, @bahsetme yine de gereksin

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
      requireMention: true,
    },
  },
}
```

### Yalnızca belirli gruplara izin ver

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      // Grup kimlikleri şöyle görünür: oc_xxx
      groupAllowFrom: ["oc_xxx", "oc_yyy"],
    },
  },
}
```

`allowlist` modunda açık bir `groups.<chat_id>` girdisi ekleyerek de bir gruba izin verebilirsiniz. Açık girdiler `groupPolicy: "disabled"` değerini geçersiz kılmaz. `groups.*` altındaki joker karakter varsayılanları eşleşen grupları yapılandırır, ancak gruplara tek başına izin vermez.

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      groups: {
        oc_xxx: {
          requireMention: false,
        },
      },
    },
  },
}
```

### Bir grup içindeki gönderenleri sınırla

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["oc_xxx"],
      groups: {
        oc_xxx: {
          // Kullanıcı open_id değerleri şöyle görünür: ou_xxx
          allowFrom: ["ou_user1", "ou_user2"],
        },
      },
    },
  },
}
```

`channels.feishu.groupSenderAllowFrom`, tüm gruplar için aynı gönderen izin listesini ayarlar; grup başına `allowFrom` önceliklidir.

<a id="get-groupuser-ids"></a>

## Grup/kullanıcı kimliklerini alma

### Grup kimlikleri (`chat_id`, biçim: `oc_xxx`)

Grubu Feishu/Lark'ta açın, sağ üst köşedeki menü simgesine tıklayın ve **Settings** bölümüne gidin. Grup kimliği (`chat_id`) ayarlar sayfasında listelenir.

![Grup Kimliğini Alma](/images/feishu-get-group-id.png)

### Kullanıcı kimlikleri (`open_id`, biçim: `ou_xxx`)

Gateway'i başlatın, bota bir doğrudan mesaj gönderin ve ardından günlükleri kontrol edin:

```bash
openclaw logs --follow
```

Günlük çıktısında `open_id` değerini arayın. Bekleyen eşleştirme isteklerini de kontrol edebilirsiniz:

```bash
openclaw pairing list feishu
```

## Yaygın komutlar

| Komut   | Açıklama                 |
| --------- | --------------------------- |
| `/status` | Bot durumunu göster             |
| `/reset`  | Geçerli oturumu sıfırla   |
| `/model`  | Yapay zekâ modelini göster veya değiştir |

<Note>
Feishu/Lark yerel eğik çizgi komutu menülerini desteklemez; bu nedenle bunları düz metin mesajları olarak gönderin.
</Note>

## Sorun giderme

### Bot grup sohbetlerinde yanıt vermiyor

1. Botun gruba eklendiğinden emin olun
2. Bottan @bahsettiğinizden emin olun (varsayılan olarak gereklidir)
3. `groupPolicy` değerinin `"disabled"` olmadığını doğrulayın
4. Günlükleri kontrol edin: `openclaw logs --follow`

### Bot mesajları almıyor

1. Botun Feishu Open Platform / Lark Developer'da yayımlandığından ve onaylandığından emin olun
2. Olay aboneliğinin `im.message.receive_v1` içerdiğinden emin olun
3. **persistent connection** (WebSocket) seçeneğinin seçildiğinden emin olun
4. Gerekli tüm izin kapsamlarının verildiğinden emin olun
5. Gateway'in çalıştığından emin olun: `openclaw gateway status`
6. Günlükleri kontrol edin: `openclaw logs --follow`

### QR kurulumu Feishu mobil uygulamasında tepki vermiyor

1. Kurulumu yeniden çalıştırın: `openclaw channels login --channel feishu`
2. Manuel kurulumu seçin
3. Feishu Open Platform'da özel geliştirilmiş bir uygulama oluşturup App ID ve App Secret değerlerini kopyalayın
4. Bu kimlik bilgilerini kurulum sihirbazına yapıştırın

### App Secret sızdırıldı

1. Feishu Open Platform / Lark Developer'da App Secret değerini sıfırlayın
2. Yapılandırmanızdaki değeri güncelleyin
3. Gateway'i yeniden başlatın: `openclaw gateway restart`

## Gelişmiş yapılandırma

### Birden fazla hesap

```json5
{
  channels: {
    feishu: {
      defaultAccount: "main",
      accounts: {
        main: {
          appId: "cli_xxx",
          appSecret: "xxx",
          name: "Birincil bot",
          tts: {
            providers: {
              openai: { voice: "shimmer" },
            },
          },
        },
        backup: {
          appId: "cli_yyy",
          appSecret: "yyy",
          name: "Yedek bot",
          enabled: false,
        },
      },
    },
  },
}
```

`defaultAccount`, giden API'ler bir `accountId` belirtmediğinde hangi hesabın kullanılacağını denetler. Hesap girdileri üst düzey ayarları devralır; üst düzey anahtarların çoğu hesap başına geçersiz kılınabilir.
`accounts.<id>.tts`, `messages.tts` ile aynı yapıyı kullanır ve genel TTS yapılandırmasının üzerine derin birleştirme uygular; böylece çok botlu Feishu kurulumları, yalnızca sesi, modeli, kişiliği veya otomatik modu hesap başına geçersiz kılarken paylaşılan sağlayıcı kimlik bilgilerini genel düzeyde tutabilir.

### Mesaj sınırları

- `textChunkLimit` - giden metin parçası boyutu (varsayılan: `4000` karakter)
- `streaming.chunkMode` - `"length"` (varsayılan) sınırda böler; `"newline"` yeni satır sınırlarını tercih eder
- `mediaMaxMb` - medya yükleme/indirme sınırı (varsayılan: `30` MB)

### Akış

Feishu/Lark, etkileşimli kartlar (Card Kit streaming API) aracılığıyla akışlı yanıtları destekler. Etkinleştirildiğinde bot, metni oluştururken kartı gerçek zamanlı olarak günceller.

```json5
{
  channels: {
    feishu: {
      streaming: {
        mode: "partial", // akışlı kart çıktısı (varsayılan: "partial")
        block: { enabled: true }, // tamamlanan blok akışını etkinleştir
      },
    },
  },
}
```

Yanıtın tamamını tek mesajda göndermek için `streaming.mode: "off"` değerini ayarlayın; `renderMode: "raw"` (kartlar yerine düz metin) de akışlı kartları devre dışı bırakır. `streaming.block.enabled` varsayılan olarak kapalıdır; yalnızca tamamlanan asistan bloklarının son yanıttan önce gönderilmesini istediğinizde etkinleştirin. Eski mantıksal `streaming` ile düz `blockStreaming` / `blockStreamingCoalesce` / `chunkMode` anahtarları, `openclaw doctor --fix` aracılığıyla bu iç içe yapıya taşınır.

### Kota optimizasyonu

İki isteğe bağlı bayrakla Feishu/Lark API çağrılarının sayısını azaltın:

- `typingIndicator` (varsayılan `true`): yazıyor tepkisi çağrılarını atlamak için `false` olarak ayarlayın
- `resolveSenderNames` (varsayılan `true`): gönderen profili aramalarını atlamak için `false` olarak ayarlayın

```json5
{
  channels: {
    feishu: {
      typingIndicator: false,
      resolveSenderNames: false,
    },
  },
}
```

### Grup oturumu kapsamı ve konu dizileri

`channels.feishu.groupSessionScope` (üst düzeyde, hesap başına veya grup başına), grup mesajlarının ajan oturumlarına nasıl eşleneceğini denetler:

| Değer                  | Oturum                                                          |
| ---------------------- | ---------------------------------------------------------------- |
| `"group"` (varsayılan)    | Grup sohbeti başına bir oturum                                       |
| `"group_sender"`       | Her (grup + gönderen) için bir oturum                                 |
| `"group_topic"`        | Konu dizisi başına bir oturum; grup oturumuna geri döner    |
| `"group_topic_sender"` | Her (konu + gönderen) için bir oturum; (grup + gönderen) oturumuna geri döner |

Konu kapsamlarında yerel Feishu/Lark konu grupları, standart konu oturumu anahtarı olarak `thread_id` olayını (`omt_*`) kullanır. Yerel bir konu başlatıcı olayı `thread_id` değerini içermiyorsa OpenClaw, etkileşimi yönlendirmeden önce bu değeri Feishu'dan alır. OpenClaw'ın dizilere dönüştürdüğü normal grup yanıtları, ilk etkileşim ile sonraki etkileşimlerin aynı oturumda kalması için yanıt kök mesajı kimliğini (`om_*`) kullanmaya devam eder.

Bot yanıtlarının satır içinde yanıtlamak yerine bir Feishu konu dizisi oluşturmasını veya sürdürmesini sağlamak için `replyInThread: "enabled"` değerini (üst düzeyde veya grup başına) ayarlayın. `topicSessionMode`, `groupSessionScope` değerinin kullanımdan kaldırılmış öncülüdür; `groupSessionScope` değerini tercih edin.

### Feishu çalışma alanı araçları

Plugin; Feishu belgeleri, sohbetleri, bilgi tabanı, bulut depolama, izinler ve Bitable için ajan araçlarının yanı sıra bunlarla eşleşen Skills'i (`feishu-doc`, `feishu-drive`, `feishu-perm`, `feishu-wiki`) içerir. Araç aileleri `channels.feishu.tools` tarafından denetlenir:

| Anahtar             | Araçlar                                         | Varsayılan             |
| --------------- | --------------------------------------------- | ------------------- |
| `tools.doc`     | `feishu_doc` belge işlemleri              | `true`              |
| `tools.chat`    | `feishu_chat` sohbet bilgileri + üye sorguları      | `true`              |
| `tools.wiki`    | `feishu_wiki` bilgi tabanı (`doc` gerektirir) | `true`              |
| `tools.drive`   | `feishu_drive` bulut depolama                  | `true`              |
| `tools.perm`    | `feishu_perm` izin yönetimi           | `false` (hassas) |
| `tools.scopes`  | `feishu_app_scopes` uygulama kapsamı tanılaması     | `true`              |
| `tools.bitable` | `feishu_bitable_*` Bitable/Base işlemleri    | `true`              |

`tools.base`, `tools.bitable` için bir diğer addır; ikisi de ayarlandığında açıkça belirtilen `bitable` değeri önceliklidir. Hesap başına geçitler `accounts.<id>.tools` altında bulunur.

Uygulama tam `drive:drive` kapsamına zaten sahip değilse kök dizin
dışındaki doğrudan `feishu_drive info` aramaları için `drive:drive.metadata:readonly` iznini verin. Her iki kapsam da olmadan `info`,
eski kök dizin aramasını `drive:drive:readonly` üzerinden kullanılabilir tutar.

### ACP oturumları

Feishu/Lark, DM'ler ve grup ileti dizisi mesajları için ACP'yi destekler. Feishu/Lark ACP metin komutlarıyla çalışır; yerel eğik çizgi komutu menüleri yoktur, bu nedenle `/acp ...` mesajlarını doğrudan konuşmada kullanın.

#### Kalıcı ACP bağlama

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "feishu",
        accountId: "default",
        peer: { kind: "direct", id: "ou_1234567890" },
      },
    },
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "feishu",
        accountId: "default",
        peer: { kind: "group", id: "oc_group_chat:topic:om_topic_root" },
      },
      acp: { label: "codex-feishu-topic" },
    },
  ],
}
```

#### Sohbetten ACP başlatma

Bir Feishu/Lark DM'sinde veya ileti dizisinde:

```text
/acp spawn codex --thread here
```

`--thread here`, DM'ler ve Feishu/Lark ileti dizisi mesajları için çalışır. Bağlı konuşmadaki sonraki mesajlar doğrudan bu ACP oturumuna yönlendirilir.

### Çoklu ajan yönlendirmesi

Feishu/Lark DM'lerini veya gruplarını farklı ajanlara yönlendirmek için `bindings` kullanın.

```json5
{
  agents: {
    list: [
      { id: "main" },
      { id: "agent-a", workspace: "/home/user/agent-a" },
      { id: "agent-b", workspace: "/home/user/agent-b" },
    ],
  },
  bindings: [
    {
      agentId: "agent-a",
      match: {
        channel: "feishu",
        peer: { kind: "direct", id: "ou_xxx" },
      },
    },
    {
      agentId: "agent-b",
      match: {
        channel: "feishu",
        peer: { kind: "group", id: "oc_zzz" },
      },
    },
  ],
}
```

Yönlendirme alanları:

- `match.channel`: `"feishu"`
- `match.peer.kind`: `"direct"` (DM) veya `"group"` (grup sohbeti)
- `match.peer.id`: kullanıcı Open ID'si (`ou_xxx`) veya grup kimliği (`oc_xxx`)

Arama ipuçları için [Grup/kullanıcı kimliklerini alma](#get-groupuser-ids) bölümüne bakın.

## Kullanıcı başına ajan yalıtımı (Dinamik Ajan Oluşturma)

Her DM kullanıcısı için otomatik olarak **yalıtılmış ajan örnekleri** oluşturmak üzere `dynamicAgentCreation` özelliğini etkinleştirin. Her kullanıcı şunlara sahip olur:

- Bağımsız çalışma alanı dizini
- Ayrı `USER.md` / `SOUL.md` / `MEMORY.md`
- Özel konuşma geçmişi
- Yalıtılmış beceriler ve durum

Bu, her kullanıcının kendine ait özel bir yapay zekâ asistanı deneyimine sahip olmasını istediğiniz herkese açık botlar için gereklidir.

<Note>
Dinamik bağlamalar, normalleştirilmiş Feishu `accountId` değerini içerir; böylece varsayılan ve adlandırılmış hesaplar her göndericiyi doğru dinamik ajana yönlendirir.

Adlandırılmış bir hesap eski bir sürümde kapsamlandırılmamış bir dinamik ajan oluşturduysa bu eski ajan yine de `maxAgents` sınırına dâhil edilir. Kaldırmadan önce varsayılan hesap tarafından kullanılmadığını doğrulayın veya `maxAgents` değerini geçici olarak artırın; OpenClaw, belirsiz eski durumun hangi hesaba ait olduğunu güvenli biçimde çıkaramaz.
</Note>

### Hızlı kurulum

```json5
{
  channels: {
    feishu: {
      dmPolicy: "open",
      allowFrom: ["*"],
      dynamicAgentCreation: {
        enabled: true,
        workspaceTemplate: "~/.openclaw/workspace-{agentId}",
        agentDirTemplate: "~/.openclaw/agents/{agentId}/agent",
      },
    },
  },
  session: {
    // Kritik: her kullanıcının DM'sini kendi "ana oturumu" yapar
    // USER.md / SOUL.md / MEMORY.md dosyalarını otomatik olarak yükler
    // Daha güçlü yalıtım için bunun yerine "per-channel-peer" kullanın
    dmScope: "main",
  },
}
```

### Nasıl çalışır?

Yeni bir kullanıcı ilk DM'sini gönderdiğinde:

1. Kanal benzersiz bir `agentId` oluşturur: varsayılan hesap için `feishu-{user_open_id}` veya adlandırılmış bir hesap için hesap önekli, sınırlandırılmış bir kimlik özeti
2. `workspaceTemplate` yolunda yeni bir çalışma alanı oluşturur
3. Ajanı kaydeder ve bu kullanıcı için bir bağlama oluşturur
4. Çalışma alanı yardımcısı ilk erişimde başlangıç dosyalarının (`AGENTS.md`, `SOUL.md`, `USER.md` vb.) bulunmasını sağlar
5. Bu kullanıcının gelecekteki tüm mesajlarını kendisine ayrılmış ajana yönlendirir

### Yapılandırma seçenekleri

| Ayar                                                  | Açıklama                                | Varsayılan                              |
| -------------------------------------------------------- | ------------------------------------------ | ------------------------------------ |
| `channels.feishu.dynamicAgentCreation.enabled`           | Kullanıcı başına otomatik ajan oluşturmayı etkinleştirir   | `false`                              |
| `channels.feishu.dynamicAgentCreation.workspaceTemplate` | Dinamik ajan çalışma alanları için yol şablonu | `~/.openclaw/workspace-{agentId}`    |
| `channels.feishu.dynamicAgentCreation.agentDirTemplate`  | Ajan dizini adı şablonu              | `~/.openclaw/agents/{agentId}/agent` |
| `channels.feishu.dynamicAgentCreation.maxAgents`         | Oluşturulacak en fazla dinamik ajan sayısı | sınırsız                            |

Şablon değişkenleri:

- `{agentId}` - oluşturulan ajan kimliği (ör. `feishu-ou_xxxxxx` veya `feishu-support-<identity_digest>`)
- `{userId}` - göndericinin Feishu open_id değeri (ör. `ou_xxxxxx`)

### Oturum kapsamı

`session.dmScope`, doğrudan mesajların ajan oturumlarına nasıl eşlendiğini denetler. Bu, tüm kanalları etkileyen **genel bir ayardır**.

| Değer                        | Davranış                                                            | En uygun kullanım                                                           |
| ---------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `"main"`                     | Her kullanıcının DM'si, kendi ajanının ana oturumuna eşlenir                   | `USER.md` / `SOUL.md` dosyalarının otomatik yüklenmesini istediğiniz tek kullanıcılı botlar |
| `"per-peer"`                 | Her eş ayrı bir oturum alır (kanaldan bağımsız olarak)           | Yalnızca gönderici kimliğine göre anahtarlanan yalıtım                            |
| `"per-channel-peer"`         | Her (kanal + kullanıcı) birleşimi ayrı bir oturum alır           | Daha güçlü yalıtım gerektiren herkese açık çok kullanıcılı botlar                  |
| `"per-account-channel-peer"` | Her (hesap + kanal + kullanıcı) birleşimi ayrı bir oturum alır | Hesap düzeyinde oturum yalıtımı gerektiren çok hesaplı botlar         |

**Ödünleşim**: `"main"` kullanımı, başlangıç dosyalarının (`USER.md`, `SOUL.md`, `MEMORY.md`) otomatik yüklenmesini etkinleştirir ancak tüm kanallardaki tüm DM'lerin aynı oturum anahtarı kalıbını paylaşması anlamına gelir. Yalıtımın başlangıç dosyalarının otomatik yüklenmesinden daha önemli olduğu herkese açık çok kullanıcılı botlarda `"per-channel-peer"` kullanmayı ve başlangıç dosyalarını elle yönetmeyi değerlendirin.

<Note>
Adlandırılmış Feishu hesaplarının aynı gönderici için ayrı oturumlar tutması gerektiğinde `"per-account-channel-peer"` kullanın. Dinamik bağlamalar hesap kapsamını korur.
</Note>

### Tipik çok kullanıcılı dağıtım

```json5
{
  channels: {
    feishu: {
      appId: "cli_xxx",
      appSecret: "xxx",
      dmPolicy: "open",
      allowFrom: ["*"],
      groupPolicy: "open",
      requireMention: true,
      dynamicAgentCreation: {
        enabled: true,
        workspaceTemplate: "~/.openclaw/workspace-{agentId}",
        agentDirTemplate: "~/.openclaw/agents/{agentId}/agent",
      },
    },
  },
  session: {
    // Yalıtım gereksinimlerinize göre dmScope seçin:
    // Başlangıç dosyalarının otomatik yüklenmesi için "main", daha güçlü yalıtım için "per-channel-peer"
    dmScope: "main",
  },
  bindings: [], // Boş - dinamik ajanlar otomatik olarak bağlanır
}
```

### Doğrulama

Dinamik oluşturmanın çalıştığını doğrulamak için Gateway günlüklerini kontrol edin:

```text
feishu: ou_xxxxxx kullanıcısı için "feishu-ou_xxxxxx" dinamik ajanı oluşturuluyor
  çalışma alanı: /home/user/.openclaw/workspace-feishu-ou_xxxxxx
  ajan dizini: /home/user/.openclaw/agents/feishu-ou_xxxxxx/agent
```

Oluşturulan tüm çalışma alanlarını listeleyin:

```bash
ls -la ~/.openclaw/workspace-*
```

### Notlar

- **Çalışma alanı yalıtımı**: Her kullanıcı kendi çalışma alanı dizinine ve ajan örneğine sahip olur. Kullanıcılar normal mesajlaşma akışında birbirlerinin konuşma geçmişini veya dosyalarını göremez.
- **Güvenlik sınırı**: Bu, düşmanca ortak kiracı güvenlik sınırı değil, mesajlaşma bağlamı yalıtım mekanizmasıdır. Ajan süreci ve ana makine ortamı paylaşılır.
- **Yapılandırma yazmaları etkin kalmalıdır**: Dinamik ajan oluşturma, ajanları ve bağlamaları yapılandırmaya yazar; `channels.feishu.configWrites` değeri `false` olduğunda atlanır (varsayılan: etkin).
- **`bindings` boş olmalıdır**: Dinamik ajanlar kendi bağlamalarını otomatik olarak kaydeder
- **Yükseltme yolu**: Mevcut elle oluşturulan bağlamalar dinamik ajanlarla birlikte çalışmaya devam eder
- **`session.dmScope` geneldir**: Bu yalnızca Feishu'yu değil, tüm kanalları etkiler

## Yapılandırma başvurusu

Tam yapılandırma: [Gateway yapılandırması](/tr/gateway/configuration)

| Ayar                                                    | Açıklama                                                                             | Varsayılan                           |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------ |
| `channels.feishu.enabled`                                | Kanalı etkinleştir/devre dışı bırak                                                   | `true`                               |
| `channels.feishu.domain`                                 | API alan adı (`feishu`, `lark` veya bir `https://` temel URL'si)                       | `feishu`                             |
| `channels.feishu.connectionMode`                         | Olay aktarımı (`websocket` veya `webhook`)                                          | `websocket`                          |
| `channels.feishu.defaultAccount`                         | Giden yönlendirme için varsayılan hesap                                               | `default`                            |
| `channels.feishu.verificationToken`                      | Webhook modu için gereklidir                                                          | -                                    |
| `channels.feishu.encryptKey`                             | Webhook modu için gereklidir                                                          | -                                    |
| `channels.feishu.webhookPath`                            | Webhook rota yolu                                                                     | `/feishu/events`                     |
| `channels.feishu.webhookHost`                            | Webhook bağlama ana makinesi                                                          | `127.0.0.1`                          |
| `channels.feishu.webhookPort`                            | Webhook bağlama bağlantı noktası                                                      | `3000`                               |
| `channels.feishu.accounts.<id>.appId`                    | Uygulama kimliği                                                                      | -                                    |
| `channels.feishu.accounts.<id>.appSecret`                | Uygulama gizli anahtarı                                                               | -                                    |
| `channels.feishu.accounts.<id>.domain`                   | Hesap başına alan adı geçersiz kılma                                                  | `feishu`                             |
| `channels.feishu.accounts.<id>.tts`                      | Hesap başına TTS geçersiz kılma                                                       | `messages.tts`                       |
| `channels.feishu.dmPolicy`                               | DM ilkesi (`pairing`, `allowlist`, `open`)                                          | `pairing`                            |
| `channels.feishu.allowFrom`                              | DM izin listesi (open_id listesi)                                                     | -                                    |
| `channels.feishu.groupPolicy`                            | Grup ilkesi (`open`, `allowlist`, `disabled`)                                      | `allowlist`                          |
| `channels.feishu.groupAllowFrom`                         | Grup izin listesi                                                                     | -                                    |
| `channels.feishu.groupSenderAllowFrom`                   | Tüm gruplara uygulanan gönderen izin listesi                                          | -                                    |
| `channels.feishu.requireMention`                         | Gruplarda @bahsetme gerektir                                                          | `true` (ilke `open` olduğunda `false`) |
| `channels.feishu.groups.<chat_id>.requireMention`        | Grup başına @bahsetme geçersiz kılma; açık kimlikler ayrıca izin listesi modunda gruba izin verir | devralınan                           |
| `channels.feishu.groups.<chat_id>.enabled`               | Belirli bir grubu etkinleştir/devre dışı bırak                                        | `true`                               |
| `channels.feishu.groups.<chat_id>.allowFrom`             | Grup başına gönderen izin listesi (`groupSenderAllowFrom` ayarını geçersiz kılar)    | -                                    |
| `channels.feishu.groupSessionScope`                      | Grup oturumu eşlemesi (`group`, `group_sender`, `group_topic`, `group_topic_sender`) | `group`                              |
| `channels.feishu.replyInThread`                          | Bot yanıtları konu ileti dizileri oluşturur/sürdürür (`disabled`, `enabled`)       | `disabled`                           |
| `channels.feishu.reactionNotifications`                  | Gelen tepki olayları (`off`, `own`, `all`)                                       | `own`                                |
| `channels.feishu.dynamicAgentCreation.enabled`           | Kullanıcı başına otomatik ajan oluşturmayı etkinleştir                                | `false`                              |
| `channels.feishu.dynamicAgentCreation.workspaceTemplate` | Dinamik ajan çalışma alanları için yol şablonu                                        | `~/.openclaw/workspace-{agentId}`    |
| `channels.feishu.dynamicAgentCreation.agentDirTemplate`  | Ajan dizini adı şablonu                                                               | `~/.openclaw/agents/{agentId}/agent` |
| `channels.feishu.dynamicAgentCreation.maxAgents`         | Oluşturulacak en fazla dinamik ajan sayısı                                            | sınırsız                             |
| `channels.feishu.textChunkLimit`                         | Mesaj parçası boyutu                                                                  | `4000`                               |
| `channels.feishu.streaming.chunkMode`                    | Parça bölme (`length` veya `newline`)                                             | `length`                             |
| `channels.feishu.mediaMaxMb`                             | Medya boyutu sınırı                                                                   | `30`                                 |
| `channels.feishu.renderMode`                             | Yanıt işleme (`auto`, `raw`, `card`)                                            | `auto`                               |
| `channels.feishu.streaming.mode`                         | Akışlı kart çıktısı (`partial` veya `off`)                                         | `partial`                            |
| `channels.feishu.streaming.block.enabled`                | Tamamlanan blokların yanıt akışı                                                     | `false`                              |
| `channels.feishu.typingIndicator`                        | Yazıyor tepkileri gönder                                                              | `true`                               |
| `channels.feishu.resolveSenderNames`                     | Gönderen görünen adlarını çözümle                                                     | `true`                               |
| `channels.feishu.configWrites`                           | Kanal tarafından başlatılan yapılandırma yazımlarına izin ver (dinamik ajanlar için gereklidir) | `true`                               |
| `channels.feishu.tools.doc`                              | Belge araçlarını etkinleştir                                                          | `true`                               |
| `channels.feishu.tools.chat`                             | Sohbet bilgisi araçlarını etkinleştir                                                 | `true`                               |
| `channels.feishu.tools.wiki`                             | Bilgi tabanı araçlarını etkinleştir (`doc` gerektirir)                              | `true`                               |
| `channels.feishu.tools.drive`                            | Bulut depolama araçlarını etkinleştir                                                 | `true`                               |
| `channels.feishu.tools.perm`                             | İzin yönetimi araçlarını etkinleştir                                                  | `false`                              |
| `channels.feishu.tools.scopes`                           | Uygulama kapsamları tanılama aracını etkinleştir                                      | `true`                               |
| `channels.feishu.tools.bitable`                          | Bitable/Base araçlarını etkinleştir                                                   | `true`                               |
| `channels.feishu.tools.base`                             | `channels.feishu.tools.bitable` için diğer ad; ikisi de ayarlandığında açık `bitable` geçerli olur | `true`                               |
| `channels.feishu.accounts.<id>.tools.bitable`            | Hesap başına Bitable/Base araç geçidi                                                 | devralınan                           |
| `channels.feishu.accounts.<id>.tools.base`               | `tools.bitable` için hesap başına diğer ad                                           | devralınan                           |

## Desteklenen mesaj türleri

### Alma

- ✅ Metin
- ✅ Zengin metin (gönderi)
- ✅ Görseller
- ✅ Dosyalar
- ✅ Ses
- ✅ Video/medya
- ✅ Çıkartmalar

Gelen Feishu/Lark sesli mesajları, ham `file_key` JSON yerine
medya yer tutucuları olarak normalleştirilir. `tools.media.audio` yapılandırıldığında OpenClaw,
sesli not kaynağını indirir ve ajan çalışmasından önce paylaşılan ses transkripsiyonunu
çalıştırır; böylece ajan konuşmanın transkriptini alır. Feishu, transkript metnini
doğrudan ses yüküne eklerse bu metin başka bir ASR çağrısı yapılmadan kullanılır.
Bir ses transkripsiyonu sağlayıcısı olmadan da ajan, ham Feishu kaynak yükü yerine
bir `<media:audio>` yer tutucusu ile kaydedilmiş eki alır.

### Gönderme

- ✅ Metin
- ✅ Görseller
- ✅ Dosyalar
- ✅ Ses
- ✅ Video/medya
- ✅ Etkileşimli kartlar (akış güncellemeleri dâhil)
- ⚠️ Zengin metin (gönderi tarzı biçimlendirme; Feishu/Lark'ın tüm içerik oluşturma yeteneklerini desteklemez)

Yerel Feishu/Lark ses balonları, Feishu `audio` mesaj türünü kullanır ve
Ogg/Opus yükleme medyası (`file_type: "opus"`) gerektirir. Mevcut `.opus` ve `.ogg` medya
doğrudan yerel ses olarak gönderilir. MP3/WAV/M4A ve diğer muhtemel ses biçimleri,
yalnızca yanıt sesli teslimat istediğinde (`audioAsVoice` / TTS sesli not
yanıtları dâhil mesaj aracı `asVoice`) `ffmpeg` ile 48kHz Ogg/Opus biçimine
dönüştürülür. Sıradan MP3 ekleri normal dosya olarak kalır. `ffmpeg` eksikse veya
dönüştürme başarısız olursa OpenClaw bir dosya ekine geri döner ve nedenini günlüğe kaydeder.

### İleti dizileri ve yanıtlar

- ✅ Satır içi yanıtlar
- ✅ İleti dizisi yanıtları
- ✅ Bir ileti dizisi mesajına yanıt verirken medya yanıtları ileti dizisi farkındalığını korur

Konu grubu oturumu yönlendirmesi,
[Grup oturumu kapsamı ve konu ileti dizileri](#group-session-scope-and-topic-threads) bölümünde ele alınır.

## İlgili

- [Kanallara genel bakış](/tr/channels) - desteklenen tüm kanallar
- [Eşleştirme](/tr/channels/pairing) - DM kimlik doğrulaması ve eşleştirme akışı
- [Gruplar](/tr/channels/groups) - grup sohbeti davranışı ve bahsetme geçidi
- [Kanal yönlendirmesi](/tr/channels/channel-routing) - mesajlar için oturum yönlendirmesi
- [Güvenlik](/tr/gateway/security) - erişim modeli ve sağlamlaştırma
