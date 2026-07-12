---
read_when:
    - Bir Yuanbao botu bağlamak istiyorsunuz
    - Yuanbao kanalını yapılandırıyorsunuz
summary: Yuanbao botuna genel bakış, özellikler ve yapılandırma
title: Yuanbao
x-i18n:
    generated_at: "2026-07-12T12:07:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 43488834f588530206b290cb0fb185fd1fe2e1f214ab4a4ccccc49b9b549b6ac
    source_path: channels/yuanbao.md
    workflow: 16
---

Tencent Yuanbao, Tencent'in yapay zekâ asistanı platformudur. Topluluk tarafından sürdürülen `openclaw-plugin-yuanbao` Plugin'i, Yuanbao botlarını doğrudan mesajlar ve grup sohbetleri için WebSocket üzerinden OpenClaw'a bağlar.

**Durum:** Bot doğrudan mesajları ve grup sohbetleri için üretime hazırdır. Desteklenen tek bağlantı modu WebSocket'tir. Bu Plugin, çekirdek OpenClaw tarafından değil, harici bir katalog girdisi olarak Tencent Yuanbao ekibi tarafından sürdürülür; aşağıdaki yapılandırma/davranış ayrıntıları (kurulum ve genel CLI yüzeyi dışındakiler) Plugin'in kendi belgelerinden alınmıştır ve OpenClaw çekirdek kaynak koduyla doğrulanmamıştır.

## Hızlı başlangıç

OpenClaw 2026.4.10 veya üzerini gerektirir. `openclaw --version` ile denetleyin; `openclaw update` ile yükseltin.

<Steps>
  <Step title="Kimlik bilgilerinizle Yuanbao kanalını ekleyin">
  ```bash
  openclaw channels add --channel yuanbao --token "appKey:appSecret"
  ```
  `--token`, iki nokta üst üste ile ayrılmış `appKey:appSecret` biçimini kullanır. Bunları, uygulama ayarlarınızda bir bot oluşturarak Yuanbao uygulamasından edinin.
  </Step>

  <Step title="Değişikliği uygulamak için Gateway'i yeniden başlatın">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

### Etkileşimli kurulum (alternatif)

```bash
openclaw channels login --channel yuanbao
```

App ID ve App Secret bilgilerinizi girmek için istemleri izleyin.

## Erişim denetimi

### Doğrudan mesajlar

`channels.yuanbao.dm.policy`:

| Değer            | Davranış                                                               |
| ---------------- | ---------------------------------------------------------------------- |
| `open` (varsayılan) | Tüm kullanıcılara izin ver                                          |
| `pairing`        | Bilinmeyen kullanıcılar bir eşleştirme kodu alır; CLI üzerinden onaylayın |
| `allowlist`      | Yalnızca `allowFrom` içindeki kullanıcılar sohbet edebilir              |
| `disabled`       | Tüm doğrudan mesajları devre dışı bırak                                 |

Bir eşleştirme isteğini onaylayın:

```bash
openclaw pairing list yuanbao
openclaw pairing approve yuanbao <CODE>
```

### Grup sohbetleri

`channels.yuanbao.requireMention` (varsayılan `true`): Botun bir grupta yanıt vermesinden önce bir @bahsetme gerektirir. Botun kendi mesajına yanıt vermek, örtük bir bahsetme olarak kabul edilir.

## Yapılandırma örnekleri

Temel kurulum, açık doğrudan mesaj politikası:

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

Doğrudan mesajları belirli kullanıcılarla sınırlayın:

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

Gruplarda @bahsetme gereksinimini devre dışı bırakın:

```json5
{
  channels: {
    yuanbao: {
      requireMention: false,
    },
  },
}
```

Giden teslimatı ayarlama:

```json5
{
  channels: {
    yuanbao: {
      outboundQueueStrategy: "merge-text",
      minChars: 2800, // bu kadar karaktere ulaşana kadar arabelleğe al
      maxChars: 3000, // bu sınırın üzerinde zorunlu olarak böl
      idleMs: 5000, // boşta kalma zaman aşımından sonra otomatik olarak gönder (ms)
    },
  },
}
```

Her parçayı arabelleğe almadan göndermek için `outboundQueueStrategy: "immediate"` ayarlayın.

## Yaygın komutlar

| Komut      | Açıklama                           |
| ---------- | ---------------------------------- |
| `/help`    | Kullanılabilir komutları göster    |
| `/status`  | Bot durumunu göster                |
| `/new`     | Yeni bir oturum başlat             |
| `/stop`    | Geçerli çalıştırmayı durdur        |
| `/restart` | OpenClaw'ı yeniden başlat          |
| `/compact` | Oturum bağlamını sıkıştır          |

Yuanbao, yerel eğik çizgi komutu menülerini destekler; Gateway başlatıldığında komutlar platformla otomatik olarak eşitlenir.

## Sorun giderme

**Bot grup sohbetlerinde yanıt vermiyor:**

1. Botun gruba eklendiğini doğrulayın
2. Bottan @bahsettiğinizi doğrulayın (varsayılan olarak gereklidir)
3. Günlükleri denetleyin: `openclaw logs --follow`

**Bot mesajları almıyor:**

1. Botun Yuanbao uygulamasında oluşturulduğunu ve onaylandığını doğrulayın
2. `appKey` ve `appSecret` değerlerinin doğru yapılandırıldığını doğrulayın
3. Gateway'in çalıştığını doğrulayın: `openclaw gateway status`
4. Günlükleri denetleyin: `openclaw logs --follow`

**Bot boş veya yedek yanıtlar gönderiyor:**

1. Yapay zekâ modelinin geçerli içerik döndürüp döndürmediğini denetleyin
2. Varsayılan yedek yanıt: "暫時無法解答，你可以換個問題問問我哦"
3. `channels.yuanbao.fallbackReply` ile özelleştirin

**App Secret sızdırıldı:**

1. Yuanbao uygulamasındaki App Secret değerini sıfırlayın
2. Yapılandırmanızdaki değeri güncelleyin
3. Gateway'i yeniden başlatın: `openclaw gateway restart`

## Gelişmiş yapılandırma

### Birden çok hesap

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

- `maxChars`: tek bir mesajın azami karakter sayısı (varsayılan `3000`)
- `mediaMaxMb`: medya yükleme/indirme sınırı (varsayılan `20` MB)
- `overflowPolicy`: bir mesaj sınırı aştığındaki davranış; `"split"` (varsayılan) veya `"stop"`

### Akış

Yuanbao, blok düzeyinde akış çıktısını destekler; bot, metni oluşturdukça parçalar hâlinde gönderir.

```json5
{
  channels: {
    yuanbao: {
      disableBlockStreaming: false, // blok akışı etkin (varsayılan)
    },
  },
}
```

Yanıtın tamamını tek mesajda göndermek için `disableBlockStreaming: true` ayarlayın.

### Grup sohbeti geçmişi bağlamı

```json5
{
  channels: {
    yuanbao: {
      historyLimit: 100, // varsayılan: 100, devre dışı bırakmak için 0 ayarlayın
    },
  },
}
```

Grup sohbetleri için yapay zekâ bağlamına kaç geçmiş mesajın dahil edileceğini denetler.

### Yanıtlama modu

```json5
{
  channels: {
    yuanbao: {
      replyToMode: "first", // "off" | "first" | "all" (varsayılan: "first")
    },
  },
}
```

| Değer   | Davranış                                                         |
| ------- | ---------------------------------------------------------------- |
| `off`   | Alıntılı yanıt yok                                                |
| `first` | Gelen her mesaj için yalnızca ilk yanıtı alıntıla (varsayılan)    |
| `all`   | Her yanıtı alıntıla                                               |

### Markdown ipucu ekleme

Bot, varsayılan olarak modelin yanıtın tamamını bir markdown kod bloğuna sarmasını önlemek için sistem istemine bir talimat ekler.

```json5
{
  channels: {
    yuanbao: {
      markdownHintEnabled: true, // varsayılan: true
    },
  },
}
```

### Hata ayıklama modu

```json5
{
  channels: {
    yuanbao: {
      debugBotIds: ["bot_user_id_1", "bot_user_id_2"],
    },
  },
}
```

Listelenen bot kimlikleri için temizlenmemiş günlük çıktısını etkinleştirir.

### Çoklu ajan yönlendirmesi

Yuanbao doğrudan mesajlarını veya gruplarını farklı ajanlara yönlendirmek için `bindings` kullanın:

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

- `match.channel`: `"yuanbao"`
- `match.peer.kind`: `"direct"` (doğrudan mesaj) veya `"group"` (grup sohbeti)
- `match.peer.id`: kullanıcı kimliği veya grup kodu

## Yapılandırma başvurusu

Tam yapılandırma: [Gateway yapılandırması](/tr/gateway/configuration)

| Ayar                                       | Açıklama                                                  | Varsayılan                             |
| ------------------------------------------ | --------------------------------------------------------- | -------------------------------------- |
| `channels.yuanbao.enabled`                 | Kanalı etkinleştir/devre dışı bırak                       | `true`                                 |
| `channels.yuanbao.defaultAccount`          | Giden yönlendirme için varsayılan hesap                   | `default`                              |
| `channels.yuanbao.accounts.<id>.appKey`    | App Key (imzalama + bilet oluşturma)                      | -                                      |
| `channels.yuanbao.accounts.<id>.appSecret` | App Secret (imzalama)                                     | -                                      |
| `channels.yuanbao.accounts.<id>.token`     | Önceden imzalanmış belirteç (otomatik bilet imzalamayı atlar) | -                                   |
| `channels.yuanbao.accounts.<id>.name`      | Hesabın görünen adı                                       | -                                      |
| `channels.yuanbao.accounts.<id>.enabled`   | Belirli bir hesabı etkinleştir/devre dışı bırak           | `true`                                 |
| `channels.yuanbao.dm.policy`               | Doğrudan mesaj politikası                                 | `open`                                 |
| `channels.yuanbao.dm.allowFrom`            | Doğrudan mesaj izin listesi (kullanıcı kimliği listesi)   | -                                      |
| `channels.yuanbao.requireMention`          | Gruplarda @bahsetme gerektir                              | `true`                                 |
| `channels.yuanbao.overflowPolicy`          | Uzun mesaj işleme (`split` veya `stop`)                   | `split`                                |
| `channels.yuanbao.replyToMode`             | Grup yanıt stratejisi (`off`, `first`, `all`)             | `first`                                |
| `channels.yuanbao.outboundQueueStrategy`   | Giden stratejisi (`merge-text` veya `immediate`)          | `merge-text`                           |
| `channels.yuanbao.minChars`                | Metin birleştirme: göndermeyi tetikleyen asgari karakter sayısı | `2800`                          |
| `channels.yuanbao.maxChars`                | Metin birleştirme: mesaj başına azami karakter sayısı     | `3000`                                 |
| `channels.yuanbao.idleMs`                  | Metin birleştirme: otomatik göndermeden önce boşta kalma zaman aşımı (ms) | `5000`                 |
| `channels.yuanbao.mediaMaxMb`              | Medya boyutu sınırı (MB)                                  | `20`                                   |
| `channels.yuanbao.historyLimit`            | Grup sohbeti geçmiş bağlamı girdileri                     | `100`                                  |
| `channels.yuanbao.disableBlockStreaming`   | Blok düzeyinde akış çıktısını devre dışı bırak            | `false`                                |
| `channels.yuanbao.fallbackReply`           | Model içerik döndürmediğinde kullanılacak yedek yanıt     | `暂时无法解答，你可以换个问题问问我哦` |
| `channels.yuanbao.markdownHintEnabled`     | Markdown sarmalamayı önleyen talimatlar ekle              | `true`                                 |
| `channels.yuanbao.debugBotIds`             | Hata ayıklama izin listesindeki bot kimlikleri (temizlenmemiş günlükler) | `[]`                    |

## Desteklenen mesaj türleri

**Alma:** metin, görseller, dosyalar, ses/sesli mesaj, video, çıkartmalar/özel emojiler, özel öğeler (bağlantı kartları).

**Gönderme:** metin (markdown), görseller, dosyalar, ses, video, çıkartmalar.

**İleti dizileri ve yanıtlar:** alıntılı yanıtlar (`replyToMode` aracılığıyla yapılandırılabilir); ileti dizisi yanıtları platform tarafından desteklenmez.

## İlgili konular

- [Kanallara genel bakış](/tr/channels) - desteklenen tüm kanallar
- [Eşleştirme](/tr/channels/pairing) - doğrudan mesaj kimlik doğrulaması ve eşleştirme akışı
- [Gruplar](/tr/channels/groups) - grup sohbeti davranışı ve bahsetme denetimi
- [Kanal yönlendirmesi](/tr/channels/channel-routing) - mesajlar için oturum yönlendirmesi
- [Güvenlik](/tr/gateway/security) - erişim modeli ve sağlamlaştırma
