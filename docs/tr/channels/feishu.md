---
read_when:
    - Bir Feishu/Lark botu bağlamak istiyorsunuz
    - Feishu kanalını yapılandırıyorsunuz
summary: Feishu bot genel bakışı, özellikleri ve yapılandırması
title: Feishu
x-i18n:
    generated_at: "2026-04-05T13:43:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4e39b6dfe3a3aa4ebbdb992975e570e4f1b5e79f3b400a555fc373a0d1889952
    source_path: channels/feishu.md
    workflow: 15
---

# Feishu botu

Feishu (Lark), şirketlerin mesajlaşma ve iş birliği için kullandığı bir ekip sohbet platformudur. Bu plugin, platformun WebSocket olay aboneliğini kullanarak OpenClaw'ı bir Feishu/Lark botuna bağlar; böylece genel kullanıma açık bir webhook URL'si göstermeden mesajlar alınabilir.

---

## Pakete dahil plugin

Feishu, mevcut OpenClaw sürümleriyle birlikte gelir; bu nedenle ayrı bir plugin kurulumu gerekmez.

Dahil edilmiş Feishu içermeyen eski bir sürüm veya özel bir kurulum kullanıyorsanız, manuel olarak yükleyin:

```bash
openclaw plugins install @openclaw/feishu
```

---

## Hızlı başlangıç

Feishu kanalını eklemenin iki yolu vardır:

### Yöntem 1: onboarding (önerilir)

OpenClaw'ı yeni yüklediyseniz onboarding çalıştırın:

```bash
openclaw onboard
```

Sihirbaz size şu konularda rehberlik eder:

1. Bir Feishu uygulaması oluşturma ve kimlik bilgilerini toplama
2. Uygulama kimlik bilgilerini OpenClaw içinde yapılandırma
3. Gateway'i başlatma

✅ **Yapılandırmadan sonra**, gateway durumunu kontrol edin:

- `openclaw gateway status`
- `openclaw logs --follow`

### Yöntem 2: CLI kurulumu

İlk kurulumu zaten tamamladıysanız, kanalı CLI üzerinden ekleyin:

```bash
openclaw channels add
```

**Feishu** seçeneğini belirleyin, ardından App ID ve App Secret değerlerini girin.

✅ **Yapılandırmadan sonra**, gateway'i yönetin:

- `openclaw gateway status`
- `openclaw gateway restart`
- `openclaw logs --follow`

---

## 1. Adım: Bir Feishu uygulaması oluşturun

### 1. Feishu Open Platform'u açın

[Feishu Open Platform](https://open.feishu.cn/app) adresini ziyaret edin ve oturum açın.

Lark (global) tenant'ları [https://open.larksuite.com/app](https://open.larksuite.com/app) adresini kullanmalı ve Feishu config içinde `domain: "lark"` ayarlamalıdır.

### 2. Bir uygulama oluşturun

1. **Create enterprise app** öğesine tıklayın
2. Uygulama adı + açıklamasını doldurun
3. Bir uygulama simgesi seçin

![Create enterprise app](/images/feishu-step2-create-app.png)

### 3. Kimlik bilgilerini kopyalayın

**Credentials & Basic Info** bölümünden şunları kopyalayın:

- **App ID** (biçim: `cli_xxx`)
- **App Secret**

❗ **Önemli:** App Secret değerini gizli tutun.

![Get credentials](/images/feishu-step3-credentials.png)

### 4. İzinleri yapılandırın

**Permissions** bölümünde **Batch import** seçeneğine tıklayın ve şunu yapıştırın:

```json
{
  "scopes": {
    "tenant": [
      "aily:file:read",
      "aily:file:write",
      "application:application.app_message_stats.overview:readonly",
      "application:application:self_manage",
      "application:bot.menu:write",
      "cardkit:card:read",
      "cardkit:card:write",
      "contact:user.employee_id:readonly",
      "corehr:file:download",
      "event:ip_list",
      "im:chat.access_event.bot_p2p_chat:read",
      "im:chat.members:bot_access",
      "im:message",
      "im:message.group_at_msg:readonly",
      "im:message.p2p_msg:readonly",
      "im:message:readonly",
      "im:message:send_as_bot",
      "im:resource"
    ],
    "user": ["aily:file:read", "aily:file:write", "im:chat.access_event.bot_p2p_chat:read"]
  }
}
```

![Configure permissions](/images/feishu-step4-permissions.png)

### 5. Bot yeteneğini etkinleştirin

**App Capability** > **Bot** içinde:

1. Bot yeteneğini etkinleştirin
2. Bot adını ayarlayın

![Enable bot capability](/images/feishu-step5-bot-capability.png)

### 6. Olay aboneliğini yapılandırın

⚠️ **Önemli:** olay aboneliğini ayarlamadan önce şunlardan emin olun:

1. Feishu için zaten `openclaw channels add` çalıştırdınız
2. Gateway çalışıyor (`openclaw gateway status`)

**Event Subscription** içinde:

1. **Use long connection to receive events** (WebSocket) seçeneğini belirleyin
2. Şu olayı ekleyin: `im.message.receive_v1`
3. (İsteğe bağlı) Drive yorum iş akışları için şunu da ekleyin: `drive.notice.comment_add_v1`

⚠️ Gateway çalışmıyorsa, uzun bağlantı kurulumu kaydedilemeyebilir.

![Configure event subscription](/images/feishu-step6-event-subscription.png)

### 7. Uygulamayı yayımlayın

1. **Version Management & Release** içinde bir sürüm oluşturun
2. İnceleme için gönderin ve yayımlayın
3. Yönetici onayını bekleyin (kurumsal uygulamalar genellikle otomatik onaylanır)

---

## 2. Adım: OpenClaw'ı yapılandırın

### Sihirbaz ile yapılandırın (önerilir)

```bash
openclaw channels add
```

**Feishu** seçeneğini belirleyin ve App ID + App Secret değerlerinizi yapıştırın.

### Config dosyasıyla yapılandırın

`~/.openclaw/openclaw.json` dosyasını düzenleyin:

```json5
{
  channels: {
    feishu: {
      enabled: true,
      dmPolicy: "pairing",
      accounts: {
        main: {
          appId: "cli_xxx",
          appSecret: "xxx",
          name: "My AI assistant",
        },
      },
    },
  },
}
```

`connectionMode: "webhook"` kullanıyorsanız, hem `verificationToken` hem de `encryptKey` ayarlayın. Feishu webhook sunucusu varsayılan olarak `127.0.0.1` adresine bağlanır; farklı bir bağlama adresine özellikle ihtiyacınız varsa yalnızca o zaman `webhookHost` ayarlayın.

#### Verification Token ve Encrypt Key (webhook modu)

Webhook modu kullanırken, config dosyanızda hem `channels.feishu.verificationToken` hem de `channels.feishu.encryptKey` ayarlayın. Değerleri almak için:

1. Feishu Open Platform içinde uygulamanızı açın
2. **Development** → **Events & Callbacks** bölümüne gidin (开发配置 → 事件与回调)
3. **Encryption** sekmesini açın (加密策略)
4. **Verification Token** ve **Encrypt Key** değerlerini kopyalayın

Aşağıdaki ekran görüntüsünde **Verification Token** konumunun nerede olduğu gösterilir. **Encrypt Key** aynı **Encryption** bölümünde listelenir.

![Verification Token location](/images/feishu-verification-token.png)

### Ortam değişkenleriyle yapılandırın

```bash
export FEISHU_APP_ID="cli_xxx"
export FEISHU_APP_SECRET="xxx"
```

### Lark (global) domain

Tenant'ınız Lark (uluslararası) üzerindeyse, domain'i `lark` olarak ayarlayın (veya tam bir domain dizesi kullanın). Bunu `channels.feishu.domain` içinde veya hesap bazında (`channels.feishu.accounts.<id>.domain`) ayarlayabilirsiniz.

```json5
{
  channels: {
    feishu: {
      domain: "lark",
      accounts: {
        main: {
          appId: "cli_xxx",
          appSecret: "xxx",
        },
      },
    },
  },
}
```

### Kota optimizasyon bayrakları

İki isteğe bağlı bayrak ile Feishu API kullanımını azaltabilirsiniz:

- `typingIndicator` (varsayılan `true`): `false` olduğunda yazıyor tepkisi çağrılarını atlar.
- `resolveSenderNames` (varsayılan `true`): `false` olduğunda gönderen profil arama çağrılarını atlar.

Bunları üst düzeyde veya hesap bazında ayarlayın:

```json5
{
  channels: {
    feishu: {
      typingIndicator: false,
      resolveSenderNames: false,
      accounts: {
        main: {
          appId: "cli_xxx",
          appSecret: "xxx",
          typingIndicator: true,
          resolveSenderNames: false,
        },
      },
    },
  },
}
```

---

## 3. Adım: Başlatın + test edin

### 1. Gateway'i başlatın

```bash
openclaw gateway
```

### 2. Bir test mesajı gönderin

Feishu içinde botunuzu bulun ve bir mesaj gönderin.

### 3. Eşleştirmeyi onaylayın

Varsayılan olarak bot bir eşleştirme koduyla yanıt verir. Bunu onaylayın:

```bash
openclaw pairing approve feishu <CODE>
```

Onaydan sonra normal şekilde sohbet edebilirsiniz.

---

## Genel bakış

- **Feishu bot kanalı**: gateway tarafından yönetilen Feishu botu
- **Deterministik yönlendirme**: yanıtlar her zaman Feishu'ya geri döner
- **Oturum yalıtımı**: DM'ler bir ana oturumu paylaşır; gruplar yalıtılmıştır
- **WebSocket bağlantısı**: Feishu SDK üzerinden uzun bağlantı, genel URL gerekmez

---

## Erişim denetimi

### Doğrudan mesajlar

- **Varsayılan**: `dmPolicy: "pairing"` (bilinmeyen kullanıcılar eşleştirme kodu alır)
- **Eşleştirmeyi onaylayın**:

  ```bash
  openclaw pairing list feishu
  openclaw pairing approve feishu <CODE>
  ```

- **İzin listesi modu**: izin verilen Open ID'lerle `channels.feishu.allowFrom` ayarlayın

### Grup sohbetleri

**1. Grup ilkesi** (`channels.feishu.groupPolicy`):

- `"open"` = gruplarda herkese izin ver
- `"allowlist"` = yalnızca `groupAllowFrom` içindekilere izin ver
- `"disabled"` = grup mesajlarını devre dışı bırak

Varsayılan: `allowlist`

**2. Mention gereksinimi** (`channels.feishu.requireMention`, `channels.feishu.groups.<chat_id>.requireMention` ile geçersiz kılınabilir):

- açık `true` = @mention zorunlu
- açık `false` = mention olmadan yanıt ver
- ayarlanmamışsa ve `groupPolicy: "open"` ise = varsayılan `false`
- ayarlanmamışsa ve `groupPolicy` `"open"` değilse = varsayılan `true`

---

## Grup yapılandırma örnekleri

### Tüm gruplara izin ver, @mention gerekmesin (açık gruplar için varsayılan)

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
    },
  },
}
```

### Tüm gruplara izin ver, ancak yine de @mention gerektir

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
      // Feishu grup kimlikleri (chat_id) şöyle görünür: oc_xxx
      groupAllowFrom: ["oc_xxx", "oc_yyy"],
    },
  },
}
```

### Bir grupta hangi göndericilerin mesaj gönderebileceğini kısıtlayın (gönderici izin listesi)

Grubun kendisine izin vermeye ek olarak, bu gruptaki **tüm mesajlar** gönderen `open_id` ile kapılanır: yalnızca `groups.<chat_id>.allowFrom` içinde listelenen kullanıcıların mesajları işlenir; diğer üyelerden gelen mesajlar yok sayılır (bu, yalnızca /reset veya /new gibi denetim komutları için değil, tam gönderici düzeyinde kapılamadır).

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["oc_xxx"],
      groups: {
        oc_xxx: {
          // Feishu kullanıcı kimlikleri (open_id) şöyle görünür: ou_xxx
          allowFrom: ["ou_user1", "ou_user2"],
        },
      },
    },
  },
}
```

---

<a id="get-groupuser-ids"></a>

## Grup/kullanıcı kimliklerini alın

### Grup kimlikleri (chat_id)

Grup kimlikleri `oc_xxx` gibi görünür.

**Yöntem 1 (önerilir)**

1. Gateway'i başlatın ve grupta botu @mention ile etiketleyin
2. `openclaw logs --follow` çalıştırın ve `chat_id` değerini arayın

**Yöntem 2**

Grup sohbetlerini listelemek için Feishu API hata ayıklayıcısını kullanın.

### Kullanıcı kimlikleri (open_id)

Kullanıcı kimlikleri `ou_xxx` gibi görünür.

**Yöntem 1 (önerilir)**

1. Gateway'i başlatın ve bota DM gönderin
2. `openclaw logs --follow` çalıştırın ve `open_id` değerini arayın

**Yöntem 2**

Kullanıcı Open ID'leri için eşleştirme isteklerini kontrol edin:

```bash
openclaw pairing list feishu
```

---

## Yaygın komutlar

| Komut    | Açıklama             |
| -------- | -------------------- |
| `/status` | Bot durumunu göster |
| `/reset`  | Oturumu sıfırla     |
| `/model`  | Modeli göster/değiştir |

> Not: Feishu henüz yerel komut menülerini desteklemez, bu nedenle komutlar metin olarak gönderilmelidir.

## Gateway yönetim komutları

| Komut                      | Açıklama                     |
| -------------------------- | ---------------------------- |
| `openclaw gateway status`  | Gateway durumunu göster      |
| `openclaw gateway install` | Gateway hizmetini kur/başlat |
| `openclaw gateway stop`    | Gateway hizmetini durdur     |
| `openclaw gateway restart` | Gateway hizmetini yeniden başlat |
| `openclaw logs --follow`   | Gateway günlüklerini izle    |

---

## Sorun giderme

### Bot grup sohbetlerinde yanıt vermiyor

1. Botun gruba eklendiğinden emin olun
2. Botu @mention ile etiketlediğinizden emin olun (varsayılan davranış)
3. `groupPolicy` değerinin `"disabled"` olarak ayarlanmadığını kontrol edin
4. Günlükleri kontrol edin: `openclaw logs --follow`

### Bot mesaj almıyor

1. Uygulamanın yayımlandığından ve onaylandığından emin olun
2. Olay aboneliğinin `im.message.receive_v1` içerdiğinden emin olun
3. **Uzun bağlantının** etkin olduğundan emin olun
4. Uygulama izinlerinin tam olduğundan emin olun
5. Gateway'in çalıştığından emin olun: `openclaw gateway status`
6. Günlükleri kontrol edin: `openclaw logs --follow`

### App Secret sızıntısı

1. Feishu Open Platform içinde App Secret'ı sıfırlayın
2. Config dosyanızdaki App Secret'ı güncelleyin
3. Gateway'i yeniden başlatın

### Mesaj gönderme hataları

1. Uygulamanın `im:message:send_as_bot` iznine sahip olduğundan emin olun
2. Uygulamanın yayımlandığından emin olun
3. Ayrıntılı hatalar için günlükleri kontrol edin

---

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
          name: "Primary bot",
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

`defaultAccount`, giden API'ler açıkça bir `accountId` belirtmediğinde hangi Feishu hesabının kullanılacağını kontrol eder.

### Mesaj sınırları

- `textChunkLimit`: giden metin parça boyutu (varsayılan: 2000 karakter)
- `mediaMaxMb`: medya yükleme/indirme sınırı (varsayılan: 30MB)

### Streaming

Feishu, etkileşimli kartlar aracılığıyla streaming yanıtları destekler. Etkinleştirildiğinde bot, metin üretirken kartı günceller.

```json5
{
  channels: {
    feishu: {
      streaming: true, // kart üzerinden streaming çıktıyı etkinleştirir (varsayılan true)
      blockStreaming: true, // blok düzeyinde streaming'i etkinleştirir (varsayılan true)
    },
  },
}
```

Göndermeden önce tam yanıtı beklemek için `streaming: false` ayarlayın.

### ACP oturumları

Feishu, şu durumlar için ACP destekler:

- DM'ler
- grup konu konuşmaları

Feishu ACP metin komutlarıyla çalışır. Yerel slash komut menüleri yoktur, bu nedenle `/acp ...` mesajlarını doğrudan konuşma içinde kullanın.

#### Kalıcı ACP bağlamaları

Bir Feishu DM'ini veya konu konuşmasını kalıcı bir ACP oturumuna sabitlemek için üst düzey typed ACP bağlamalarını kullanın.

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

#### Sohbetten iş parçacığına bağlı ACP başlatma

Bir Feishu DM'inde veya konu konuşmasında ACP oturumunu yerinde başlatıp bağlayabilirsiniz:

```text
/acp spawn codex --thread here
```

Notlar:

- `--thread here`, DM'ler ve Feishu konuları için çalışır.
- Bağlı DM/konudaki takip mesajları doğrudan o ACP oturumuna yönlendirilir.
- v1, genel konu dışı grup sohbetlerini hedeflemez.

### Çoklu ajan yönlendirme

Feishu DM'lerini veya gruplarını farklı ajanlara yönlendirmek için `bindings` kullanın.

```json5
{
  agents: {
    list: [
      { id: "main" },
      {
        id: "clawd-fan",
        workspace: "/home/user/clawd-fan",
        agentDir: "/home/user/.openclaw/agents/clawd-fan/agent",
      },
      {
        id: "clawd-xi",
        workspace: "/home/user/clawd-xi",
        agentDir: "/home/user/.openclaw/agents/clawd-xi/agent",
      },
    ],
  },
  bindings: [
    {
      agentId: "main",
      match: {
        channel: "feishu",
        peer: { kind: "direct", id: "ou_xxx" },
      },
    },
    {
      agentId: "clawd-fan",
      match: {
        channel: "feishu",
        peer: { kind: "direct", id: "ou_yyy" },
      },
    },
    {
      agentId: "clawd-xi",
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
- `match.peer.kind`: `"direct"` veya `"group"`
- `match.peer.id`: kullanıcı Open ID'si (`ou_xxx`) veya grup kimliği (`oc_xxx`)

Arama ipuçları için [Grup/kullanıcı kimliklerini alın](#get-groupuser-ids) bölümüne bakın.

---

## Yapılandırma başvurusu

Tam yapılandırma: [Gateway yapılandırması](/gateway/configuration)

Temel seçenekler:

| Ayar                                              | Açıklama                              | Varsayılan       |
| ------------------------------------------------- | ------------------------------------- | ---------------- |
| `channels.feishu.enabled`                         | Kanalı etkinleştir/devre dışı bırak   | `true`           |
| `channels.feishu.domain`                          | API domain'i (`feishu` veya `lark`)   | `feishu`         |
| `channels.feishu.connectionMode`                  | Olay taşıma modu                      | `websocket`      |
| `channels.feishu.defaultAccount`                  | Giden yönlendirme için varsayılan hesap kimliği | `default` |
| `channels.feishu.verificationToken`               | Webhook modu için gereklidir          | -                |
| `channels.feishu.encryptKey`                      | Webhook modu için gereklidir          | -                |
| `channels.feishu.webhookPath`                     | Webhook rota yolu                     | `/feishu/events` |
| `channels.feishu.webhookHost`                     | Webhook bind host                     | `127.0.0.1`      |
| `channels.feishu.webhookPort`                     | Webhook bind port                     | `3000`           |
| `channels.feishu.accounts.<id>.appId`             | App ID                                | -                |
| `channels.feishu.accounts.<id>.appSecret`         | App Secret                            | -                |
| `channels.feishu.accounts.<id>.domain`            | Hesap bazında API domain geçersiz kılması | `feishu`    |
| `channels.feishu.dmPolicy`                        | DM ilkesi                             | `pairing`        |
| `channels.feishu.allowFrom`                       | DM izin listesi (`open_id` listesi)   | -                |
| `channels.feishu.groupPolicy`                     | Grup ilkesi                           | `allowlist`      |
| `channels.feishu.groupAllowFrom`                  | Grup izin listesi                     | -                |
| `channels.feishu.requireMention`                  | Varsayılan @mention gereksinimi       | koşullu          |
| `channels.feishu.groups.<chat_id>.requireMention` | Grup bazında @mention geçersiz kılması | devralınır      |
| `channels.feishu.groups.<chat_id>.enabled`        | Grubu etkinleştir                     | `true`           |
| `channels.feishu.textChunkLimit`                  | Mesaj parça boyutu                    | `2000`           |
| `channels.feishu.mediaMaxMb`                      | Medya boyutu sınırı                   | `30`             |
| `channels.feishu.streaming`                       | Streaming kart çıktısını etkinleştir  | `true`           |
| `channels.feishu.blockStreaming`                  | Blok streaming'i etkinleştir          | `true`           |

---

## dmPolicy başvurusu

| Değer         | Davranış                                                      |
| ------------- | ------------------------------------------------------------- |
| `"pairing"`   | **Varsayılan.** Bilinmeyen kullanıcılar eşleştirme kodu alır; onaylanmaları gerekir |
| `"allowlist"` | Yalnızca `allowFrom` içindeki kullanıcılar sohbet edebilir    |
| `"open"`      | Tüm kullanıcılara izin ver (`allowFrom` içinde `"*"` gerekir) |
| `"disabled"`  | DM'leri devre dışı bırak                                      |

---

## Desteklenen mesaj türleri

### Alma

- ✅ Metin
- ✅ Zengin metin (post)
- ✅ Görseller
- ✅ Dosyalar
- ✅ Ses
- ✅ Video/medya
- ✅ Sticker'lar

### Gönderme

- ✅ Metin
- ✅ Görseller
- ✅ Dosyalar
- ✅ Ses
- ✅ Video/medya
- ✅ Etkileşimli kartlar
- ⚠️ Zengin metin (post tarzı biçimlendirme ve kartlar, ancak rastgele Feishu yazım özellikleri değil)

### İş parçacıkları ve yanıtlar

- ✅ Satır içi yanıtlar
- ✅ Feishu'nun `reply_in_thread` sunduğu konu iş parçacığı yanıtları
- ✅ Medya yanıtları, bir iş parçacığına/konu mesajına yanıt verirken iş parçacığı farkındalığını korur

## Drive yorumları

Feishu, biri bir Feishu Drive belgesine (Docs, Sheets vb.) yorum eklediğinde ajanı tetikleyebilir. Ajan; iş parçacığı içinde yanıt verebilmesi veya belge düzenlemeleri yapabilmesi için yorum metnini, belge bağlamını ve yorum iş parçacığını alır.

Gereksinimler:

- Feishu uygulamanızın olay aboneliği ayarlarında `drive.notice.comment_add_v1` olayına abone olun
  (`im.message.receive_v1` ile birlikte)
- Drive aracı varsayılan olarak etkindir; devre dışı bırakmak için `channels.feishu.tools.drive: false` kullanın

`feishu_drive` aracı şu yorum eylemlerini sunar:

| Eylem                 | Açıklama                           |
| --------------------- | ---------------------------------- |
| `list_comments`        | Bir belge üzerindeki yorumları listele |
| `list_comment_replies` | Bir yorum iş parçacığındaki yanıtları listele |
| `add_comment`          | Yeni bir üst düzey yorum ekle      |
| `reply_comment`        | Var olan bir yorum iş parçacığına yanıt ver |

Ajan bir Drive yorum olayını işlediğinde şunları alır:

- yorum metni ve gönderen
- belge meta verileri (başlık, tür, URL)
- iş parçacığı içi yanıtlar için yorum iş parçacığı bağlamı

Belge düzenlemeleri yaptıktan sonra, ajana yorum sahibini bilgilendirmek için `feishu_drive.reply_comment` kullanması ve ardından yinelenen gönderimleri önlemek için tam sessiz belirteç `NO_REPLY` / `no_reply` çıktısını vermesi yönlendirilir.

## Çalışma zamanı eylem yüzeyi

Feishu şu anda şu çalışma zamanı eylemlerini sunar:

- `send`
- `read`
- `edit`
- `thread-reply`
- `pin`
- `list-pins`
- `unpin`
- `member-info`
- `channel-info`
- `channel-list`
- tepkiler config içinde etkinleştirildiğinde `react` ve `reactions`
- `feishu_drive` yorum eylemleri: `list_comments`, `list_comment_replies`, `add_comment`, `reply_comment`

## İlgili

- [Kanal Genel Bakışı](/channels) — desteklenen tüm kanallar
- [Eşleştirme](/channels/pairing) — DM kimlik doğrulaması ve eşleştirme akışı
- [Gruplar](/channels/groups) — grup sohbeti davranışı ve mention kapılaması
- [Kanal Yönlendirme](/channels/channel-routing) — mesajlar için oturum yönlendirmesi
- [Güvenlik](/gateway/security) — erişim modeli ve sağlamlaştırma
