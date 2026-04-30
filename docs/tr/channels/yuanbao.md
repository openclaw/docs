---
read_when:
    - Bir Yuanbao botu bağlamak istiyorsunuz
    - Yuanbao kanalını yapılandırıyorsunuz
summary: Yuanbao botuna genel bakış, özellikler ve yapılandırma
title: Yuanbao
x-i18n:
    generated_at: "2026-04-30T09:09:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: d82b6d275ae8aa4cc5e62321772c5ba2b5044c6058be0d2e5215cdb1488118e9
    source_path: channels/yuanbao.md
    workflow: 16
---

# Yuanbao

Tencent Yuanbao, Tencent'in AI asistan platformudur. OpenClaw kanal Plugin'i,
Yuanbao botlarını WebSocket üzerinden OpenClaw'a bağlayarak kullanıcılarla
doğrudan mesajlar ve grup sohbetleri aracılığıyla etkileşim kurmalarını sağlar.

**Durum:** bot DM'leri + grup sohbetleri için üretime hazır. WebSocket desteklenen tek bağlantı modudur.

---

## Hızlı başlangıç

> **OpenClaw 2026.4.10 veya üzeri gerekir.** Kontrol etmek için `openclaw --version` çalıştırın. `openclaw update` ile yükseltin.

<Steps>
  <Step title="Kimlik bilgilerinizle Yuanbao kanalını ekleyin">
  ```bash
  openclaw channels add --channel yuanbao --token "appKey:appSecret"
  ```
  `--token` değeri iki nokta üst üste ile ayrılmış `appKey:appSecret` biçimini kullanır. Bunları, uygulama ayarlarınızda bir robot oluşturarak Yuanbao uygulamasından alabilirsiniz.
  </Step>

  <Step title="Kurulum tamamlandıktan sonra değişiklikleri uygulamak için gateway'i yeniden başlatın">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

### Etkileşimli kurulum (alternatif)

Etkileşimli sihirbazı da kullanabilirsiniz:

```bash
openclaw channels login --channel yuanbao
```

App ID ve App Secret değerlerinizi girmek için istemleri izleyin.

---

## Erişim denetimi

### Doğrudan mesajlar

Bota kimlerin DM gönderebileceğini denetlemek için `dmPolicy` yapılandırın:

- `"pairing"` — bilinmeyen kullanıcılar bir eşleştirme kodu alır; CLI üzerinden onaylayın
- `"allowlist"` — yalnızca `allowFrom` içinde listelenen kullanıcılar sohbet edebilir
- `"open"` — tüm kullanıcılara izin ver (varsayılan)
- `"disabled"` — tüm DM'leri devre dışı bırak

**Bir eşleştirme isteğini onaylayın:**

```bash
openclaw pairing list yuanbao
openclaw pairing approve yuanbao <CODE>
```

### Grup sohbetleri

**Bahsetme gereksinimi** (`channels.yuanbao.requireMention`):

- `true` — @bahsetme gerektir (varsayılan)
- `false` — @bahsetme olmadan yanıt ver

Bir grup sohbetinde botun mesajını yanıtlamak örtük bir bahsetme olarak değerlendirilir.

---

## Yapılandırma örnekleri

### Açık DM ilkesiyle temel kurulum

```json5
{
  channels: {
    yuanbao: {
      appKey: "your_app_key",
      appSecret: "your_app_secret",
      dm: {
        policy: "open",
      },
    },
  },
}
```

### DM'leri belirli kullanıcılarla sınırlandırma

```json5
{
  channels: {
    yuanbao: {
      appKey: "your_app_key",
      appSecret: "your_app_secret",
      dm: {
        policy: "allowlist",
        allowFrom: ["user_id_1", "user_id_2"],
      },
    },
  },
}
```

### Gruplarda @bahsetme gereksinimini devre dışı bırakma

```json5
{
  channels: {
    yuanbao: {
      requireMention: false,
    },
  },
}
```

### Giden mesaj teslimini optimize etme

```json5
{
  channels: {
    yuanbao: {
      // Send each chunk immediately without buffering
      outboundQueueStrategy: "immediate",
    },
  },
}
```

### Metin birleştirme stratejisini ayarlama

```json5
{
  channels: {
    yuanbao: {
      outboundQueueStrategy: "merge-text",
      minChars: 2800, // buffer until this many chars
      maxChars: 3000, // force split above this limit
      idleMs: 5000, // auto-flush after idle timeout (ms)
    },
  },
}
```

---

## Yaygın komutlar

| Komut      | Açıklama                         |
| ---------- | -------------------------------- |
| `/help`    | Kullanılabilir komutları göster  |
| `/status`  | Bot durumunu göster              |
| `/new`     | Yeni bir oturum başlat           |
| `/stop`    | Geçerli çalıştırmayı durdur      |
| `/restart` | OpenClaw'ı yeniden başlat        |
| `/compact` | Oturum bağlamını sıkıştır        |

> Yuanbao yerel eğik çizgi komut menülerini destekler. Komutlar, gateway başlatıldığında platformla otomatik olarak eşitlenir.

---

## Sorun giderme

### Bot grup sohbetlerinde yanıt vermiyor

1. Botun gruba eklendiğinden emin olun
2. Bota @bahsettiğinizden emin olun (varsayılan olarak gereklidir)
3. Günlükleri kontrol edin: `openclaw logs --follow`

### Bot mesaj almıyor

1. Botun Yuanbao uygulamasında oluşturulduğundan ve onaylandığından emin olun
2. `appKey` ve `appSecret` değerlerinin doğru yapılandırıldığından emin olun
3. Gateway'in çalıştığından emin olun: `openclaw gateway status`
4. Günlükleri kontrol edin: `openclaw logs --follow`

### Bot boş veya yedek yanıtlar gönderiyor

1. AI modelinin geçerli içerik döndürüp döndürmediğini kontrol edin
2. Varsayılan yedek yanıt şudur: "暂时无法解答，你可以换个问题问问我哦"
3. Bunu `channels.yuanbao.fallbackReply` aracılığıyla özelleştirin

### App Secret sızdırıldı

1. YuanBao APP içinde App Secret değerini sıfırlayın
2. Yapılandırmanızdaki değeri güncelleyin
3. Gateway'i yeniden başlatın: `openclaw gateway restart`

---

## Gelişmiş yapılandırma

### Birden fazla hesap

```json5
{
  channels: {
    yuanbao: {
      defaultAccount: "main",
      accounts: {
        main: {
          appKey: "key_xxx",
          appSecret: "secret_xxx",
          name: "Primary bot",
        },
        backup: {
          appKey: "key_yyy",
          appSecret: "secret_yyy",
          name: "Backup bot",
          enabled: false,
        },
      },
    },
  },
}
```

`defaultAccount`, giden API'ler bir `accountId` belirtmediğinde hangi hesabın kullanılacağını denetler.

### Mesaj sınırları

- `maxChars` — tek mesaj için en fazla karakter sayısı (varsayılan: `3000` karakter)
- `mediaMaxMb` — medya yükleme/indirme sınırı (varsayılan: `20` MB)
- `overflowPolicy` — mesaj sınırı aştığında davranış: `"split"` (varsayılan) veya `"stop"`

### Akış

Yuanbao blok düzeyinde akış çıktısını destekler. Etkinleştirildiğinde bot, metni oluşturdukça parçalar halinde gönderir.

```json5
{
  channels: {
    yuanbao: {
      disableBlockStreaming: false, // block streaming enabled (default)
    },
  },
}
```

Tam yanıtı tek mesajda göndermek için `disableBlockStreaming: true` ayarlayın.

### Grup sohbeti geçmişi bağlamı

Grup sohbetleri için AI bağlamına kaç geçmiş mesajın dahil edileceğini denetleyin:

```json5
{
  channels: {
    yuanbao: {
      historyLimit: 100, // default: 100, set 0 to disable
    },
  },
}
```

### Yanıtla modu

Botun grup sohbetlerinde yanıt verirken mesajlardan nasıl alıntı yapacağını denetleyin:

```json5
{
  channels: {
    yuanbao: {
      replyToMode: "first", // "off" | "first" | "all" (default: "first")
    },
  },
}
```

| Değer     | Davranış                                                      |
| --------- | ------------------------------------------------------------- |
| `"off"`   | Alıntılı yanıt yok                                            |
| `"first"` | Gelen mesaj başına yalnızca ilk yanıtı alıntıla (varsayılan)  |
| `"all"`   | Her yanıtı alıntıla                                           |

### Markdown ipucu ekleme

Varsayılan olarak bot, AI modelinin yanıtın tamamını markdown kod bloklarına sarmasını önlemek için sistem istemine yönergeler ekler.

```json5
{
  channels: {
    yuanbao: {
      markdownHintEnabled: true, // default: true
    },
  },
}
```

### Hata ayıklama modu

Belirli bot ID'leri için temizlenmemiş günlük çıktısını etkinleştirin:

```json5
{
  channels: {
    yuanbao: {
      debugBotIds: ["bot_user_id_1", "bot_user_id_2"],
    },
  },
}
```

### Çok ajanlı yönlendirme

Yuanbao DM'lerini veya gruplarını farklı ajanlara yönlendirmek için `bindings` kullanın.

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
        channel: "yuanbao",
        peer: { kind: "direct", id: "user_xxx" },
      },
    },
    {
      agentId: "agent-b",
      match: {
        channel: "yuanbao",
        peer: { kind: "group", id: "group_zzz" },
      },
    },
  ],
}
```

Yönlendirme alanları:

- `match.channel`: `"yuanbao"`
- `match.peer.kind`: `"direct"` (DM) veya `"group"` (grup sohbeti)
- `match.peer.id`: kullanıcı ID'si veya grup kodu

---

## Yapılandırma referansı

Tam yapılandırma: [Gateway yapılandırması](/tr/gateway/configuration)

| Ayar                                       | Açıklama                                                   | Varsayılan                             |
| ------------------------------------------ | ---------------------------------------------------------- | -------------------------------------- |
| `channels.yuanbao.enabled`                 | Kanalı etkinleştir/devre dışı bırak                        | `true`                                 |
| `channels.yuanbao.defaultAccount`          | Giden yönlendirme için varsayılan hesap                    | `default`                              |
| `channels.yuanbao.accounts.<id>.appKey`    | App Key (imzalama ve bilet oluşturma için kullanılır)      | —                                      |
| `channels.yuanbao.accounts.<id>.appSecret` | App Secret (imzalama için kullanılır)                      | —                                      |
| `channels.yuanbao.accounts.<id>.token`     | Önceden imzalanmış token (otomatik bilet imzalamayı atlar) | —                                      |
| `channels.yuanbao.accounts.<id>.name`      | Hesap görünen adı                                          | —                                      |
| `channels.yuanbao.accounts.<id>.enabled`   | Belirli bir hesabı etkinleştir/devre dışı bırak            | `true`                                 |
| `channels.yuanbao.dm.policy`               | DM ilkesi                                                  | `open`                                 |
| `channels.yuanbao.dm.allowFrom`            | DM izin listesi (kullanıcı ID listesi)                     | —                                      |
| `channels.yuanbao.requireMention`          | Gruplarda @bahsetme gerektir                              | `true`                                 |
| `channels.yuanbao.overflowPolicy`          | Uzun mesaj işleme (`split` veya `stop`)                    | `split`                                |
| `channels.yuanbao.replyToMode`             | Grup yanıtla stratejisi (`off`, `first`, `all`)            | `first`                                |
| `channels.yuanbao.outboundQueueStrategy`   | Giden strateji (`merge-text` veya `immediate`)             | `merge-text`                           |
| `channels.yuanbao.minChars`                | Metin birleştirme: göndermeyi tetikleyen min karakter      | `2800`                                 |
| `channels.yuanbao.maxChars`                | Metin birleştirme: mesaj başına max karakter               | `3000`                                 |
| `channels.yuanbao.idleMs`                  | Metin birleştirme: otomatik boşaltmadan önce boşta kalma zaman aşımı (ms) | `5000`                                 |
| `channels.yuanbao.mediaMaxMb`              | Medya boyutu sınırı (MB)                                   | `20`                                   |
| `channels.yuanbao.historyLimit`            | Grup sohbeti geçmişi bağlam girdileri                      | `100`                                  |
| `channels.yuanbao.disableBlockStreaming`   | Blok düzeyinde akış çıktısını devre dışı bırak             | `false`                                |
| `channels.yuanbao.fallbackReply`           | AI içerik döndürmediğinde yedek yanıt                      | `暂时无法解答，你可以换个问题问问我哦` |
| `channels.yuanbao.markdownHintEnabled`     | Markdown sarmayı önleme yönergeleri ekle                   | `true`                                 |
| `channels.yuanbao.debugBotIds`             | Hata ayıklama izin listesindeki bot ID'leri (temizlenmemiş günlükler) | `[]`                                   |

---

## Desteklenen mesaj türleri

### Alma

- ✅ Metin
- ✅ Görseller
- ✅ Dosyalar
- ✅ Ses / Sesli mesaj
- ✅ Video
- ✅ Çıkartmalar / Özel emoji
- ✅ Özel öğeler (bağlantı kartları vb.)

### Gönderme

- ✅ Metin (markdown desteğiyle)
- ✅ Görseller
- ✅ Dosyalar
- ✅ Ses
- ✅ Video
- ✅ Çıkartmalar

### Konu dizileri ve yanıtlar

- ✅ Alıntılı yanıtlar (`replyToMode` aracılığıyla yapılandırılabilir)
- ❌ Konu dizisi yanıtları (platform tarafından desteklenmez)

---

## İlgili

- [Kanallara Genel Bakış](/tr/channels) — desteklenen tüm kanallar
- [Eşleştirme](/tr/channels/pairing) — DM kimlik doğrulaması ve eşleştirme akışı
- [Gruplar](/tr/channels/groups) — grup sohbeti davranışı ve bahsetme geçidi
- [Kanal Yönlendirme](/tr/channels/channel-routing) — mesajlar için oturum yönlendirme
- [Güvenlik](/tr/gateway/security) — erişim modeli ve sıkılaştırma
