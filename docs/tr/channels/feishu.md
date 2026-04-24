---
read_when:
    - Bir Feishu/Lark botu bağlamak istiyorsunuz
    - Feishu kanalını yapılandırıyorsunuz
summary: Feishu bot genel bakışı, özellikleri ve yapılandırması
title: Feishu
x-i18n:
    generated_at: "2026-04-24T08:57:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: f68a03c457fb2be7654f298fbad759705983d9e673b7b7b950609694894bdcbc
    source_path: channels/feishu.md
    workflow: 15
---

# Feishu / Lark

Feishu/Lark, ekiplerin sohbet ettiği, belge paylaştığı, takvimleri yönettiği ve birlikte iş yaptığı hepsi bir arada bir iş birliği platformudur.

**Durum:** bot DM'leri ve grup sohbetleri için üretime hazır. Varsayılan mod WebSocket'tir; Webhook modu isteğe bağlıdır.

---

## Hızlı başlangıç

> **OpenClaw 2026.4.24 veya üzerini gerektirir.** Kontrol etmek için `openclaw --version` komutunu çalıştırın. Yükseltmek için `openclaw update` kullanın.

<Steps>
  <Step title="Kanal kurulum sihirbazını çalıştırın">
  ```bash
  openclaw channels login --channel feishu
  ```
  Otomatik olarak bir Feishu/Lark botu oluşturmak için QR kodunu Feishu/Lark mobil uygulamanızla tarayın.
  </Step>
  
  <Step title="Kurulum tamamlandıktan sonra değişiklikleri uygulamak için gateway'i yeniden başlatın">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

---

## Erişim denetimi

### Doğrudan mesajlar

Bot'a kimin DM gönderebileceğini denetlemek için `dmPolicy` yapılandırın:

- `"pairing"` — bilinmeyen kullanıcılar bir eşleştirme kodu alır; CLI üzerinden onaylayın
- `"allowlist"` — yalnızca `allowFrom` içinde listelenen kullanıcılar sohbet edebilir (varsayılan: yalnızca bot sahibi)
- `"open"` — tüm kullanıcılara izin ver
- `"disabled"` — tüm DM'leri devre dışı bırak

**Bir eşleştirme isteğini onaylayın:**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### Grup sohbetleri

**Grup politikası** (`channels.feishu.groupPolicy`):

| Değer        | Davranış                                  |
| ------------ | ----------------------------------------- |
| `"open"`     | Gruplardaki tüm mesajlara yanıt verir     |
| `"allowlist"`| Yalnızca `groupAllowFrom` içindeki gruplara yanıt verir |
| `"disabled"` | Tüm grup mesajlarını devre dışı bırakır   |

Varsayılan: `allowlist`

**Bahsetme gerekliliği** (`channels.feishu.requireMention`):

- `true` — @mention gerekli (varsayılan)
- `false` — @mention olmadan yanıt ver
- Grup başına geçersiz kılma: `channels.feishu.groups.<chat_id>.requireMention`

---

## Grup yapılandırma örnekleri

### Tüm gruplara izin ver, @mention gerekmesin

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
    },
  },
}
```

### Tüm gruplara izin ver, ama yine de @mention iste

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
      // Grup kimlikleri şu şekilde görünür: oc_xxx
      groupAllowFrom: ["oc_xxx", "oc_yyy"],
    },
  },
}
```

### Bir grup içindeki göndericileri kısıtla

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["oc_xxx"],
      groups: {
        oc_xxx: {
          // Kullanıcı open_id değerleri şu şekilde görünür: ou_xxx
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

### Grup kimlikleri (`chat_id`, biçim: `oc_xxx`)

Feishu/Lark içinde grubu açın, sağ üst köşedeki menü simgesine tıklayın ve **Settings** bölümüne gidin. Grup kimliği (`chat_id`) ayarlar sayfasında listelenir.

![Get Group ID](/images/feishu-get-group-id.png)

### Kullanıcı kimlikleri (`open_id`, biçim: `ou_xxx`)

Gateway'i başlatın, bot'a bir DM gönderin, ardından günlükleri kontrol edin:

```bash
openclaw logs --follow
```

Günlük çıktısında `open_id` değerini arayın. Bekleyen eşleştirme isteklerini de kontrol edebilirsiniz:

```bash
openclaw pairing list feishu
```

---

## Yaygın komutlar

| Komut    | Açıklama                         |
| -------- | -------------------------------- |
| `/status` | Bot durumunu gösterir           |
| `/reset`  | Geçerli oturumu sıfırlar        |
| `/model`  | AI modelini gösterir veya değiştirir |

> Feishu/Lark yerel slash-command menülerini desteklemez; bu nedenle bunları düz metin mesajları olarak gönderin.

---

## Sorun giderme

### Bot grup sohbetlerinde yanıt vermiyor

1. Botun gruba eklendiğinden emin olun
2. Botu @mention ile etiketlediğinizden emin olun (varsayılan olarak gereklidir)
3. `groupPolicy` değerinin `"disabled"` olmadığını doğrulayın
4. Günlükleri kontrol edin: `openclaw logs --follow`

### Bot mesaj almıyor

1. Botun Feishu Open Platform / Lark Developer içinde yayımlandığından ve onaylandığından emin olun
2. Olay aboneliğinin `im.message.receive_v1` içerdiğinden emin olun
3. **Kalıcı bağlantı** (WebSocket) seçildiğinden emin olun
4. Gerekli tüm izin kapsamlarının verildiğinden emin olun
5. Gateway'in çalıştığından emin olun: `openclaw gateway status`
6. Günlükleri kontrol edin: `openclaw logs --follow`

### App Secret sızdırıldı

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
          name: "Birincil bot",
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

`defaultAccount`, giden API'ler bir `accountId` belirtmediğinde hangi hesabın kullanılacağını denetler.

### Mesaj sınırları

- `textChunkLimit` — giden metin parça boyutu (varsayılan: `2000` karakter)
- `mediaMaxMb` — medya yükleme/indirme sınırı (varsayılan: `30` MB)

### Akış

Feishu/Lark, etkileşimli kartlar aracılığıyla akış halinde yanıtları destekler. Etkinleştirildiğinde bot, metin üretirken kartı gerçek zamanlı olarak günceller.

```json5
{
  channels: {
    feishu: {
      streaming: true, // akış halinde kart çıktısını etkinleştir (varsayılan: true)
      blockStreaming: true, // blok düzeyinde akışı etkinleştir (varsayılan: true)
    },
  },
}
```

Tam yanıtı tek bir mesajda göndermek için `streaming: false` ayarlayın.

### Kota optimizasyonu

İki isteğe bağlı bayrakla Feishu/Lark API çağrılarının sayısını azaltın:

- `typingIndicator` (varsayılan `true`): yazıyor tepkisi çağrılarını atlamak için `false` ayarlayın
- `resolveSenderNames` (varsayılan `true`): gönderici profil aramalarını atlamak için `false` ayarlayın

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

Feishu/Lark, DM'ler ve grup konu mesajları için ACP destekler. Feishu/Lark ACP metin komutlarıyla çalışır — yerel slash-command menüleri yoktur, bu nedenle `/acp ...` mesajlarını doğrudan konuşmada kullanın.

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

Bir Feishu/Lark DM veya konu içinde:

```text
/acp spawn codex --thread here
```

`--thread here`, DM'ler ve Feishu/Lark konu mesajları için çalışır. Sonraki mesajlar, bağlı konuşmada doğrudan o ACP oturumuna yönlendirilir.

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

Arama ipuçları için [Grup/kullanıcı kimliklerini alın](#get-groupuser-ids) bölümüne bakın.

---

## Yapılandırma başvurusu

Tam yapılandırma: [Gateway yapılandırması](/tr/gateway/configuration)

| Ayar                                              | Açıklama                                   | Varsayılan       |
| ------------------------------------------------- | ------------------------------------------ | ---------------- |
| `channels.feishu.enabled`                         | Kanalı etkinleştirir/devre dışı bırakır    | `true`           |
| `channels.feishu.domain`                          | API alanı (`feishu` veya `lark`)           | `feishu`         |
| `channels.feishu.connectionMode`                  | Olay taşıma yöntemi (`websocket` veya `webhook`) | `websocket`      |
| `channels.feishu.defaultAccount`                  | Giden yönlendirme için varsayılan hesap    | `default`        |
| `channels.feishu.verificationToken`               | Webhook modu için gereklidir               | —                |
| `channels.feishu.encryptKey`                      | Webhook modu için gereklidir               | —                |
| `channels.feishu.webhookPath`                     | Webhook rota yolu                          | `/feishu/events` |
| `channels.feishu.webhookHost`                     | Webhook bağlama ana makinesi               | `127.0.0.1`      |
| `channels.feishu.webhookPort`                     | Webhook bağlama portu                      | `3000`           |
| `channels.feishu.accounts.<id>.appId`             | App ID                                     | —                |
| `channels.feishu.accounts.<id>.appSecret`         | App Secret                                 | —                |
| `channels.feishu.accounts.<id>.domain`            | Hesap başına alan geçersiz kılması         | `feishu`         |
| `channels.feishu.dmPolicy`                        | DM politikası                              | `allowlist`      |
| `channels.feishu.allowFrom`                       | DM izin listesi (`open_id` listesi)        | [BotOwnerId]     |
| `channels.feishu.groupPolicy`                     | Grup politikası                            | `allowlist`      |
| `channels.feishu.groupAllowFrom`                  | Grup izin listesi                          | —                |
| `channels.feishu.requireMention`                  | Gruplarda @mention gerektirir              | `true`           |
| `channels.feishu.groups.<chat_id>.requireMention` | Grup başına @mention geçersiz kılması      | devralınır       |
| `channels.feishu.groups.<chat_id>.enabled`        | Belirli bir grubu etkinleştirir/devre dışı bırakır | `true`           |
| `channels.feishu.textChunkLimit`                  | Mesaj parça boyutu                         | `2000`           |
| `channels.feishu.mediaMaxMb`                      | Medya boyutu sınırı                        | `30`             |
| `channels.feishu.streaming`                       | Akış halinde kart çıktısı                  | `true`           |
| `channels.feishu.blockStreaming`                  | Blok düzeyinde akış                        | `true`           |
| `channels.feishu.typingIndicator`                 | Yazıyor tepkileri gönderir                 | `true`           |
| `channels.feishu.resolveSenderNames`              | Gönderen görünen adlarını çözümler         | `true`           |

---

## Desteklenen mesaj türleri

### Alma

- ✅ Metin
- ✅ Zengin metin (post)
- ✅ Görseller
- ✅ Dosyalar
- ✅ Ses
- ✅ Video/medya
- ✅ Çıkartmalar

### Gönderme

- ✅ Metin
- ✅ Görseller
- ✅ Dosyalar
- ✅ Ses
- ✅ Video/medya
- ✅ Etkileşimli kartlar (akış güncellemeleri dahil)
- ⚠️ Zengin metin (post tarzı biçimlendirme; tam Feishu/Lark yazım yeteneklerini desteklemez)

### Konular ve yanıtlar

- ✅ Satır içi yanıtlar
- ✅ Konu yanıtları
- ✅ Medya yanıtları, bir konu mesajına yanıt verirken konu farkındalığını korur

---

## İlgili

- [Kanallara Genel Bakış](/tr/channels) — desteklenen tüm kanallar
- [Eşleştirme](/tr/channels/pairing) — DM kimlik doğrulaması ve eşleştirme akışı
- [Gruplar](/tr/channels/groups) — grup sohbeti davranışı ve mention geçitlemesi
- [Kanal Yönlendirmesi](/tr/channels/channel-routing) — mesajlar için oturum yönlendirmesi
- [Güvenlik](/tr/gateway/security) — erişim modeli ve sağlamlaştırma
