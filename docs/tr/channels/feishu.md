---
read_when:
    - Bir Feishu/Lark botuna bağlanmak istiyorsunuz
    - Feishu kanalını yapılandırıyorsunuz
summary: Feishu botuna genel bakış, özellikler ve yapılandırma
title: Feishu
x-i18n:
    generated_at: "2026-06-30T14:20:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 262dda9739de284e32b7e87edc336bdb5d16651dbf37148bad7593f3a6a6b951
    source_path: channels/feishu.md
    workflow: 16
---

Feishu/Lark, ekiplerin sohbet ettiği, belge paylaştığı, takvimleri yönettiği ve birlikte iş yaptığı hepsi bir arada bir iş birliği platformudur.

**Durum:** bot DM'leri + grup sohbetleri için üretime hazır. WebSocket varsayılan moddur; Webhook modu isteğe bağlıdır.

---

## Hızlı başlangıç

<Note>
OpenClaw 2026.5.29 veya üzerini gerektirir. Kontrol etmek için `openclaw --version` çalıştırın. `openclaw update` ile yükseltin.
</Note>

<Steps>
  <Step title="Kanal kurulum sihirbazını çalıştırın">
  ```bash
  openclaw channels login --channel feishu
  ```
  Feishu Open Platform'dan bir App ID ve App Secret yapıştırmak için manuel kurulumu seçin veya otomatik olarak bot oluşturmak için QR kurulumunu seçin. Çin içi Feishu mobil uygulaması QR koduna tepki vermiyorsa kurulumu yeniden çalıştırın ve manuel kurulumu seçin.
  </Step>
  
  <Step title="Kurulum tamamlandıktan sonra değişiklikleri uygulamak için gateway'i yeniden başlatın">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

---

## Erişim kontrolü

### Doğrudan mesajlar

Bota kimin DM gönderebileceğini denetlemek için `dmPolicy` yapılandırın:

- `"pairing"` - bilinmeyen kullanıcılar bir eşleştirme kodu alır; CLI üzerinden onaylayın
- `"allowlist"` - yalnızca `allowFrom` içinde listelenen kullanıcılar sohbet edebilir
- `"open"` - yalnızca `allowFrom` `"*"` içerdiğinde herkese açık DM'lere izin verilir; kısıtlayıcı girdilerle yalnızca eşleşen kullanıcılar sohbet edebilir

**Bir eşleştirme isteğini onaylayın:**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### Grup sohbetleri

**Grup ilkesi** (`channels.feishu.groupPolicy`):

| Değer         | Davranış                                                                                     |
| ------------- | -------------------------------------------------------------------------------------------- |
| `"open"`      | Gruplardaki tüm mesajlara yanıt ver                                                          |
| `"allowlist"` | Yalnızca `groupAllowFrom` içindeki veya `groups.<chat_id>` altında açıkça yapılandırılmış gruplara yanıt ver |
| `"disabled"`  | Tüm grup mesajlarını devre dışı bırak; açık `groups.<chat_id>` girdileri bunu geçersiz kılmaz |

Varsayılan: `allowlist`

**Bahsetme gereksinimi** (`channels.feishu.requireMention`):

- `true` - @mention gerektir (varsayılan)
- `false` - @mention olmadan yanıt ver
- Grup başına geçersiz kılma: `channels.feishu.groups.<chat_id>.requireMention`
- Yalnızca yayın amaçlı `@all` ve `@_all`, bot bahsetmeleri olarak değerlendirilmez. Hem `@all` hem de doğrudan bottan bahseden bir mesaj yine bot bahsetmesi sayılır.

---

## Grup yapılandırma örnekleri

### Tüm gruplara izin ver, @mention gerekmez

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
    },
  },
}
```

### Tüm gruplara izin ver, yine de @mention gerektir

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
      // Group IDs look like: oc_xxx
      groupAllowFrom: ["oc_xxx", "oc_yyy"],
    },
  },
}
```

`allowlist` modunda, açık bir `groups.<chat_id>` girdisi ekleyerek bir grubu da kabul edebilirsiniz. Açık girdiler `groupPolicy: "disabled"` değerini geçersiz kılmaz. `groups.*` altındaki joker karakterli varsayılanlar eşleşen grupları yapılandırır, ancak tek başlarına grupları kabul etmezler.

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

### Grup içindeki göndericileri kısıtla

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["oc_xxx"],
      groups: {
        oc_xxx: {
          // User open_ids look like: ou_xxx
          allowFrom: ["ou_user1", "ou_user2"],
        },
      },
    },
  },
}
```

---

<a id="get-groupuser-ids"></a>

## Grup/kullanıcı kimliklerini alma

### Grup kimlikleri (`chat_id`, biçim: `oc_xxx`)

Grubu Feishu/Lark içinde açın, sağ üst köşedeki menü simgesine tıklayın ve **Ayarlar** bölümüne gidin. Grup kimliği (`chat_id`) ayarlar sayfasında listelenir.

![Grup Kimliğini Al](/images/feishu-get-group-id.png)

### Kullanıcı kimlikleri (`open_id`, biçim: `ou_xxx`)

Gateway'i başlatın, bota bir DM gönderin, ardından günlükleri kontrol edin:

```bash
openclaw logs --follow
```

Günlük çıktısında `open_id` arayın. Bekleyen eşleştirme isteklerini de kontrol edebilirsiniz:

```bash
openclaw pairing list feishu
```

---

## Yaygın komutlar

| Komut     | Açıklama                 |
| --------- | ------------------------ |
| `/status` | Bot durumunu göster      |
| `/reset`  | Geçerli oturumu sıfırla  |
| `/model`  | AI modelini göster veya değiştir |

<Note>
Feishu/Lark yerel eğik çizgi komutu menülerini desteklemez, bu nedenle bunları düz metin mesajları olarak gönderin.
</Note>

---

## Sorun giderme

### Bot grup sohbetlerinde yanıt vermiyor

1. Botun gruba eklendiğinden emin olun
2. Bottan @mention ile bahsettiğinizden emin olun (varsayılan olarak gerekir)
3. `groupPolicy` değerinin `"disabled"` olmadığını doğrulayın
4. Günlükleri kontrol edin: `openclaw logs --follow`

### Bot mesaj almıyor

1. Botun Feishu Open Platform / Lark Developer içinde yayınlandığından ve onaylandığından emin olun
2. Etkinlik aboneliğinin `im.message.receive_v1` içerdiğinden emin olun
3. **Kalıcı bağlantı** (WebSocket) seçildiğinden emin olun
4. Gerekli tüm izin kapsamlarının verildiğinden emin olun
5. Gateway'in çalıştığından emin olun: `openclaw gateway status`
6. Günlükleri kontrol edin: `openclaw logs --follow`

### QR kurulumu Feishu mobil uygulamasında tepki vermiyor

1. Kurulumu yeniden çalıştırın: `openclaw channels login --channel feishu`
2. Manuel kurulumu seçin
3. Feishu Open Platform içinde kendi oluşturduğunuz bir uygulama oluşturun ve App ID ile App Secret değerlerini kopyalayın
4. Bu kimlik bilgilerini kurulum sihirbazına yapıştırın

### App Secret sızdı

1. Feishu Open Platform / Lark Developer içinde App Secret değerini sıfırlayın
2. Yapılandırmanızdaki değeri güncelleyin
3. Gateway'i yeniden başlatın: `openclaw gateway restart`

---

## Gelişmiş yapılandırma

### Birden çok hesap

```json5
{
  channels: {
    feishu: {
      defaultAccount: "main",
      accounts: {
        main: {
          appId: "cli_xxx",
          appSecret: "xxx",
          name: "Primary bot",
          tts: {
            providers: {
              openai: { voice: "shimmer" },
            },
          },
        },
        backup: {
          appId: "cli_yyy",
          appSecret: "yyy",
          name: "Backup bot",
          enabled: false,
        },
      },
    },
  },
}
```

`defaultAccount`, giden API'ler bir `accountId` belirtmediğinde hangi hesabın kullanılacağını denetler.
`accounts.<id>.tts`, `messages.tts` ile aynı şekli kullanır ve genel TTS yapılandırmasının üzerine derin birleştirme uygular; böylece çok botlu Feishu kurulumları, hesap başına yalnızca ses, model, persona veya otomatik modu geçersiz kılarken paylaşılan sağlayıcı kimlik bilgilerini genel olarak tutabilir.

### Mesaj sınırları

- `textChunkLimit` - giden metin parçası boyutu (varsayılan: `2000` karakter)
- `mediaMaxMb` - medya yükleme/indirme sınırı (varsayılan: `30` MB)

### Akış

Feishu/Lark, etkileşimli kartlar üzerinden akışlı yanıtları destekler. Etkinleştirildiğinde bot, metin üretirken kartı gerçek zamanlı olarak günceller.

```json5
{
  channels: {
    feishu: {
      streaming: true, // enable streaming card output (default: true)
      blockStreaming: true, // opt into completed-block streaming
    },
  },
}
```

Tam yanıtı tek mesajda göndermek için `streaming: false` ayarlayın. `blockStreaming` varsayılan olarak kapalıdır; yalnızca tamamlanmış assistant bloklarının son yanıttan önce gönderilmesini istediğinizde etkinleştirin.

### Kota optimizasyonu

İki isteğe bağlı bayrakla Feishu/Lark API çağrılarının sayısını azaltın:

- `typingIndicator` (varsayılan `true`): yazıyor tepkisi çağrılarını atlamak için `false` ayarlayın
- `resolveSenderNames` (varsayılan `true`): gönderici profili aramalarını atlamak için `false` ayarlayın

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

### ACP oturumları

Feishu/Lark, DM'ler ve grup konu mesajları için ACP'yi destekler. Feishu/Lark ACP metin komutuyla çalışır; yerel eğik çizgi komutu menüleri yoktur, bu nedenle `/acp ...` mesajlarını doğrudan konuşmada kullanın.

#### Kalıcı ACP bağlaması

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

Bir Feishu/Lark DM'sinde veya konu dizisinde:

```text
/acp spawn codex --thread here
```

`--thread here`, DM'ler ve Feishu/Lark konu mesajları için çalışır. Bağlı konuşmadaki takip mesajları doğrudan bu ACP oturumuna yönlendirilir.

### Çok ajanlı yönlendirme

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

---

## Kullanıcı başına ajan yalıtımı (Dinamik Ajan Oluşturma)

Her DM kullanıcısı için otomatik olarak **yalıtılmış ajan örnekleri** oluşturmak üzere `dynamicAgentCreation` etkinleştirin. Her kullanıcı şunlara sahip olur:

- Bağımsız çalışma alanı dizini
- Ayrı `USER.md` / `SOUL.md` / `MEMORY.md`
- Özel konuşma geçmişi
- Yalıtılmış Skills ve durum

Bu, her kullanıcının kendi özel AI asistanı deneyimine sahip olmasını istediğiniz herkese açık botlar için gereklidir.

<Note>
Dinamik bağlamalar normalleştirilmiş Feishu `accountId` değerini içerir; böylece varsayılan ve adlandırılmış hesaplar her göndericiyi doğru dinamik ajana yönlendirir.

Adlandırılmış bir hesap eski bir sürümde kapsamsız dinamik ajan oluşturduysa, bu eski ajan yine de `maxAgents` sınırına dahil edilir. Kaldırmadan önce varsayılan hesap tarafından kullanılmadığını doğrulayın veya `maxAgents` değerini geçici olarak artırın; OpenClaw belirsiz eski durumun hangi hesaba ait olduğunu güvenli şekilde çıkaramaz.
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
    // Critical: makes each user's DM their "main session"
    // Automatically loads USER.md / SOUL.md / MEMORY.md
    // For stronger isolation, use "per-channel-peer" instead
    dmScope: "main",
  },
}
```

### Nasıl çalışır

Yeni bir kullanıcı ilk DM'sini gönderdiğinde:

1. Kanal benzersiz bir `agentId` üretir: varsayılan hesap için `feishu-{user_open_id}` veya adlandırılmış bir hesap için sınırlandırılmış, hesap önekli kimlik özeti
2. `workspaceTemplate` yolunda yeni bir çalışma alanı oluşturur
3. Ajanı kaydeder ve bu kullanıcı için bir bağlama oluşturur
4. Çalışma alanı yardımcısı ilk erişimde önyükleme dosyalarını (`AGENTS.md`, `SOUL.md`, `USER.md` vb.) sağlar
5. Bu kullanıcıdan gelen tüm gelecekteki mesajları ayrılmış ajanına yönlendirir

### Yapılandırma seçenekleri

| Ayar                                                     | Açıklama                                      | Varsayılan                          |
| -------------------------------------------------------- | --------------------------------------------- | ----------------------------------- |
| `channels.feishu.dynamicAgentCreation.enabled`           | Otomatik kullanıcı başına ajan oluşturmayı etkinleştir | `false`                             |
| `channels.feishu.dynamicAgentCreation.workspaceTemplate` | Dinamik ajan çalışma alanları için yol şablonu | `~/.openclaw/workspace-{agentId}`   |
| `channels.feishu.dynamicAgentCreation.agentDirTemplate`  | Ajan dizini adı şablonu                       | `~/.openclaw/agents/{agentId}/agent` |
| `channels.feishu.dynamicAgentCreation.maxAgents`         | Oluşturulacak dinamik ajanların azami sayısı  | sınırsız                            |

Şablon değişkenleri:

- `{agentId}` - oluşturulan ajan kimliği (ör. `feishu-ou_xxxxxx` veya `feishu-support-<identity_digest>`)
- `{userId}` - gönderenin Feishu open_id değeri (ör. `ou_xxxxxx`)

### Oturum kapsamı

`session.dmScope`, doğrudan mesajların ajan oturumlarına nasıl eşlendiğini denetler. Bu, tüm kanalları etkileyen **genel bir ayardır**.

| Değer                        | Davranış                                                            | En uygun kullanım                                                   |
| ---------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `"main"`                     | Her kullanıcının DM'i, ajanının ana oturumuna eşlenir               | `USER.md` / `SOUL.md` dosyalarının otomatik yüklenmesini istediğiniz tek kullanıcılı botlar |
| `"per-channel-peer"`         | Her (kanal + kullanıcı) birleşimi ayrı bir oturum alır              | Daha güçlü yalıtım gerektiren herkese açık çok kullanıcılı botlar  |
| `"per-account-channel-peer"` | Her (hesap + kanal + kullanıcı) birleşimi ayrı bir oturum alır      | Hesap düzeyinde oturum yalıtımı gerektiren çok hesaplı botlar      |

**Ödünleşim**: `"main"` kullanmak otomatik önyükleme dosyası yüklemesini (`USER.md`, `SOUL.md`, `MEMORY.md`) etkinleştirir, ancak tüm kanallardaki tüm DM'lerin aynı oturum anahtarı desenini paylaşması anlamına gelir. Yalıtımın önyükleme otomatik yüklemesinden daha önemli olduğu herkese açık çok kullanıcılı botlar için `"per-channel-peer"` kullanmayı ve önyükleme dosyalarını elle yönetmeyi değerlendirin.

<Note>
Adlandırılmış Feishu hesaplarının aynı gönderen için ayrı oturumlar tutması gerektiğinde `"per-account-channel-peer"` kullanın. Dinamik bağlamalar hesap kapsamını korur.
</Note>

```json5
{
  session: {
    // For single-user personal bots: enables auto bootstrap loading
    dmScope: "main",

    // For public multi-user bots: stronger isolation
    // dmScope: "per-channel-peer",
  },
}
```

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
    // Choose dmScope based on your isolation needs:
    // "main" for bootstrap auto-loading, "per-channel-peer" for stronger isolation
    dmScope: "main",
  },
  bindings: [], // Empty - dynamic agents auto-bind
}
```

### Doğrulama

Dinamik oluşturmanın çalıştığını doğrulamak için Gateway günlüklerini kontrol edin:

```
feishu: creating dynamic agent "feishu-ou_xxxxxx" for user ou_xxxxxx
workspace: /Users/you/.openclaw/workspace-feishu-ou_xxxxxx
feishu: dynamic agent created, new route: agent:feishu-ou_xxxxxx:main
```

Oluşturulan tüm çalışma alanlarını listeleyin:

```bash
ls -la ~/.openclaw/workspace-*
```

### Notlar

- **Çalışma alanı yalıtımı**: Her kullanıcı kendi çalışma alanı dizinini ve ajan örneğini alır. Kullanıcılar normal mesajlaşma akışı içinde birbirlerinin konuşma geçmişini veya dosyalarını göremez.
- **Güvenlik sınırı**: Bu, düşmanca bir ortak kiracı güvenlik sınırı değil, mesajlaşma bağlamı yalıtım mekanizmasıdır. Ajan süreci ve ana makine ortamı paylaşılır.
- **`bindings` boş olmalıdır**: Dinamik ajanlar kendi bağlamalarını otomatik kaydeder
- **Yükseltme yolu**: Mevcut elle yapılan bağlamalar dinamik ajanlarla birlikte çalışmaya devam eder
- **`session.dmScope` geneldir**: Bu yalnızca Feishu'yu değil, tüm kanalları etkiler

---

## Yapılandırma başvurusu

Tam yapılandırma: [Gateway yapılandırması](/tr/gateway/configuration)

| Ayar                                                     | Açıklama                                                                      | Varsayılan                          |
| -------------------------------------------------------- | -------------------------------------------------------------------------------- | ----------------------------------- |
| `channels.feishu.enabled`                                | Kanalı etkinleştir/devre dışı bırak                                                       | `true`                              |
| `channels.feishu.domain`                                 | API etki alanı (`feishu` veya `lark`)                                                  | `feishu`                            |
| `channels.feishu.connectionMode`                         | Olay aktarımı (`websocket` veya `webhook`)                                       | `websocket`                         |
| `channels.feishu.defaultAccount`                         | Giden yönlendirme için varsayılan hesap                                             | `default`                           |
| `channels.feishu.verificationToken`                      | Webhook modu için gerekli                                                        | -                                   |
| `channels.feishu.encryptKey`                             | Webhook modu için gerekli                                                        | -                                   |
| `channels.feishu.webhookPath`                            | Webhook rota yolu                                                               | `/feishu/events`                    |
| `channels.feishu.webhookHost`                            | Webhook bağlama ana makinesi                                                                | `127.0.0.1`                         |
| `channels.feishu.webhookPort`                            | Webhook bağlama bağlantı noktası                                                                | `3000`                              |
| `channels.feishu.accounts.<id>.appId`                    | Uygulama kimliği                                                                           | -                                   |
| `channels.feishu.accounts.<id>.appSecret`                | Uygulama gizli anahtarı                                                                       | -                                   |
| `channels.feishu.accounts.<id>.domain`                   | Hesap başına etki alanı geçersiz kılma                                                      | `feishu`                            |
| `channels.feishu.accounts.<id>.tts`                      | Hesap başına TTS geçersiz kılma                                                         | `messages.tts`                      |
| `channels.feishu.dmPolicy`                               | DM ilkesi                                                                        | `pairing`                           |
| `channels.feishu.allowFrom`                              | DM izin listesi (open_id listesi)                                                      | -                                   |
| `channels.feishu.groupPolicy`                            | Grup ilkesi                                                                     | `allowlist`                         |
| `channels.feishu.groupAllowFrom`                         | Grup izin listesi                                                                  | -                                   |
| `channels.feishu.requireMention`                         | Gruplarda @bahsetme gerektir                                                       | `true`                              |
| `channels.feishu.groups.<chat_id>.requireMention`        | Grup başına @bahsetme geçersiz kılma; açık kimlikler grubu izin listesi modunda da kabul eder | devralınan                          |
| `channels.feishu.groups.<chat_id>.enabled`               | Belirli bir grubu etkinleştir/devre dışı bırak                                                  | `true`                              |
| `channels.feishu.dynamicAgentCreation.enabled`           | Otomatik kullanıcı başına ajan oluşturmayı etkinleştir                                         | `false`                             |
| `channels.feishu.dynamicAgentCreation.workspaceTemplate` | Dinamik ajan çalışma alanları için yol şablonu                                       | `~/.openclaw/workspace-{agentId}`   |
| `channels.feishu.dynamicAgentCreation.agentDirTemplate`  | Ajan dizini adı şablonu                                                    | `~/.openclaw/agents/{agentId}/agent` |
| `channels.feishu.dynamicAgentCreation.maxAgents`         | Oluşturulacak dinamik ajanların azami sayısı                                       | sınırsız                            |
| `channels.feishu.textChunkLimit`                         | Mesaj parçası boyutu                                                               | `2000`                              |
| `channels.feishu.mediaMaxMb`                             | Medya boyutu sınırı                                                                 | `30`                                |
| `channels.feishu.streaming`                              | Akışlı kart çıktısı                                                            | `true`                              |
| `channels.feishu.blockStreaming`                         | Tamamlanmış blok yanıtı akışı                                                  | `false`                             |
| `channels.feishu.typingIndicator`                        | Yazıyor tepkileri gönder                                                            | `true`                              |
| `channels.feishu.resolveSenderNames`                     | Gönderen görünen adlarını çözümle                                                     | `true`                              |
| `channels.feishu.tools.bitable`                          | Bitable/Base araçlarını etkinleştir                                                        | `true`                              |
| `channels.feishu.tools.base`                             | `channels.feishu.tools.bitable` için takma ad; ikisi de ayarlandığında açık `bitable` kazanır | `true`                              |
| `channels.feishu.accounts.<id>.tools.bitable`            | Hesap başına Bitable/Base araç kapısı                                               | devralınan                          |
| `channels.feishu.accounts.<id>.tools.base`               | `tools.bitable` için hesap başına takma ad                                            | devralınan                          |

---

## Desteklenen mesaj türleri

### Alma

- ✅ Metin
- ✅ Zengin metin (gönderi)
- ✅ Görseller
- ✅ Dosyalar
- ✅ Ses
- ✅ Video/medya
- ✅ Çıkartmalar

Gelen Feishu/Lark ses mesajları, ham `file_key` JSON yerine medya yer tutucuları olarak normalleştirilir. `tools.media.audio` yapılandırıldığında OpenClaw sesli not kaynağını indirir ve ajan turundan önce paylaşılan ses yazıya dökme işlemini çalıştırır; böylece ajan konuşulan dökümü alır. Feishu ses yükünde döküm metnini doğrudan içeriyorsa, bu metin başka bir ASR çağrısı yapılmadan kullanılır. Bir ses yazıya dökme sağlayıcısı olmadığında ajan yine de ham Feishu kaynak yükü yerine bir `<media:audio>` yer tutucusu ve kaydedilmiş eki alır.

### Gönderme

- ✅ Metin
- ✅ Görseller
- ✅ Dosyalar
- ✅ Ses
- ✅ Video/medya
- ✅ Etkileşimli kartlar (akış güncellemeleri dahil)
- ⚠️ Zengin metin (gönderi tarzı biçimlendirme; tam Feishu/Lark yazarlık özelliklerini desteklemez)

Yerel Feishu/Lark ses balonları, Feishu `audio` ileti türünü kullanır ve
Ogg/Opus yükleme medyası (`file_type: "opus"`) gerektirir. Mevcut `.opus` ve `.ogg` medyası
doğrudan yerel ses olarak gönderilir. MP3/WAV/M4A ve diğer olası ses formatları,
yalnızca yanıt sesli teslimat istediğinde (`audioAsVoice` / ileti aracı `asVoice`, TTS sesli not
yanıtları dahil) `ffmpeg` ile 48kHz Ogg/Opus biçimine dönüştürülür. Sıradan MP3 ekleri normal dosyalar olarak kalır. `ffmpeg` eksikse veya
dönüştürme başarısız olursa, OpenClaw dosya ekine geri döner ve nedeni günlüğe kaydeder.

### Konular ve yanıtlar

- ✅ Satır içi yanıtlar
- ✅ Konu yanıtları
- ✅ Medya yanıtları, bir konu iletisine yanıt verirken konu farkındalığını korur

`groupSessionScope: "group_topic"` ve `"group_topic_sender"` için yerel
Feishu/Lark konu grupları, olay `thread_id` değerini (`omt_*`) kanonik
konu oturumu anahtarı olarak kullanır. Yerel bir konu başlatıcı olayı `thread_id` değerini atlarsa, OpenClaw
tur yönlendirilmeden önce bunu Feishu'dan doldurur. OpenClaw'ın konuya dönüştürdüğü normal grup yanıtları,
ilk tur ve takip turu aynı oturumda kalsın diye yanıt kök ileti kimliğini (`om_*`) kullanmaya devam eder.

---

## İlgili

- [Kanallara Genel Bakış](/tr/channels) - desteklenen tüm kanallar
- [Eşleştirme](/tr/channels/pairing) - DM kimlik doğrulaması ve eşleştirme akışı
- [Gruplar](/tr/channels/groups) - grup sohbeti davranışı ve bahsetme kapısı
- [Kanal Yönlendirme](/tr/channels/channel-routing) - iletiler için oturum yönlendirmesi
- [Güvenlik](/tr/gateway/security) - erişim modeli ve güçlendirme
