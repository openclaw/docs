---
read_when:
    - Bir Feishu/Lark botu bağlamak istiyorsunuz
    - Feishu kanalını yapılandırıyorsunuz
summary: Feishu bot genel bakışı, özellikleri ve yapılandırması
title: Feishu
x-i18n:
    generated_at: "2026-04-26T11:22:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 95a50a7cd7b290afe0a0db3a1b39c7305f6a0e7d0702597fb9a50b5a45afa855
    source_path: channels/feishu.md
    workflow: 15
---

# Feishu / Lark

Feishu/Lark, ekiplerin sohbet ettiği, belge paylaştığı, takvimleri yönettiği ve işleri birlikte yürüttüğü hepsi bir arada bir iş birliği platformudur.

**Durum:** bot DM'leri ve grup sohbetleri için üretime hazır. Varsayılan mod WebSocket'tir; Webhook modu isteğe bağlıdır.

---

## Hızlı başlangıç

> **OpenClaw 2026.4.25 veya üzerini gerektirir.** Kontrol etmek için `openclaw --version` komutunu çalıştırın. `openclaw update` ile yükseltin.

<Steps>
  <Step title="Kanal kurulum sihirbazını çalıştırın">
  ```bash
  openclaw channels login --channel feishu
  ```
  Feishu/Lark mobil uygulamanızla QR kodunu tarayarak otomatik olarak bir Feishu/Lark botu oluşturun.
  </Step>
  
  <Step title="Kurulum tamamlandıktan sonra, değişiklikleri uygulamak için Gateway’i yeniden başlatın">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

---

## Erişim denetimi

### Doğrudan mesajlar

Bot’a kimlerin DM gönderebileceğini denetlemek için `dmPolicy` ayarını yapılandırın:

- `"pairing"` — bilinmeyen kullanıcılar bir eşleştirme kodu alır; CLI üzerinden onaylayın
- `"allowlist"` — yalnızca `allowFrom` içinde listelenen kullanıcılar sohbet edebilir (varsayılan: yalnızca bot sahibi)
- `"open"` — tüm kullanıcılara izin ver
- `"disabled"` — tüm DM’leri devre dışı bırak

**Bir eşleştirme isteğini onaylayın:**

```bash
openclaw pairing list feishu
openclaw pairing approve feishu <CODE>
```

### Grup sohbetleri

**Grup ilkesi** (`channels.feishu.groupPolicy`):

| Value         | Behavior                                |
| ------------- | --------------------------------------- |
| `"open"`      | Gruplardaki tüm mesajlara yanıt ver     |
| `"allowlist"` | Yalnızca `groupAllowFrom` içindeki gruplara yanıt ver |
| `"disabled"`  | Tüm grup mesajlarını devre dışı bırak   |

Varsayılan: `allowlist`

**Bahsetme gereksinimi** (`channels.feishu.requireMention`):

- `true` — @mention zorunlu (varsayılan)
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

### Tüm gruplara izin ver, yine de @mention zorunlu olsun

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
      // Grup ID'leri şu şekilde görünür: oc_xxx
      groupAllowFrom: ["oc_xxx", "oc_yyy"],
    },
  },
}
```

### Bir grup içindeki gönderenleri kısıtla

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["oc_xxx"],
      groups: {
        oc_xxx: {
          // Kullanıcı open_id'leri şu şekilde görünür: ou_xxx
          allowFrom: ["ou_user1", "ou_user2"],
        },
      },
    },
  },
}
```

---

<a id="get-groupuser-ids"></a>

## Grup/kullanıcı ID'lerini alın

### Grup ID'leri (`chat_id`, biçim: `oc_xxx`)

Feishu/Lark içinde grubu açın, sağ üst köşedeki menü simgesine tıklayın ve **Settings** bölümüne gidin. Grup ID’si (`chat_id`) ayarlar sayfasında listelenir.

![Grup ID’sini Al](/images/feishu-get-group-id.png)

### Kullanıcı ID'leri (`open_id`, biçim: `ou_xxx`)

Gateway’i başlatın, bot’a bir DM gönderin, ardından günlükleri kontrol edin:

```bash
openclaw logs --follow
```

Günlük çıktısında `open_id` değerini arayın. Bekleyen eşleştirme isteklerini de kontrol edebilirsiniz:

```bash
openclaw pairing list feishu
```

---

## Yaygın komutlar

| Command   | Description                    |
| --------- | ------------------------------ |
| `/status` | Bot durumunu göster            |
| `/reset`  | Geçerli oturumu sıfırla        |
| `/model`  | AI modelini göster veya değiştir |

> Feishu/Lark yerel slash-command menülerini desteklemez, bu nedenle bunları düz metin mesajları olarak gönderin.

---

## Sorun giderme

### Bot grup sohbetlerinde yanıt vermiyor

1. Botun gruba eklendiğinden emin olun
2. Bota @mention yaptığınızdan emin olun (varsayılan olarak gereklidir)
3. `groupPolicy` ayarının `"disabled"` olmadığını doğrulayın
4. Günlükleri kontrol edin: `openclaw logs --follow`

### Bot mesaj almıyor

1. Botun Feishu Open Platform / Lark Developer içinde yayımlandığından ve onaylandığından emin olun
2. Etkinlik aboneliğinin `im.message.receive_v1` içerdiğinden emin olun
3. **Kalıcı bağlantı**nın (WebSocket) seçili olduğundan emin olun
4. Gerekli tüm izin kapsamlarının verildiğinden emin olun
5. Gateway’in çalıştığından emin olun: `openclaw gateway status`
6. Günlükleri kontrol edin: `openclaw logs --follow`

### App Secret sızdırıldı

1. App Secret’i Feishu Open Platform / Lark Developer içinde sıfırlayın
2. Yapılandırmanızdaki değeri güncelleyin
3. Gateway’i yeniden başlatın: `openclaw gateway restart`

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
`accounts.<id>.tts`, `messages.tts` ile aynı yapıyı kullanır ve genel TTS yapılandırmasının üzerine derinlemesine birleştirilir; böylece çok botlu Feishu kurulumları paylaşılan sağlayıcı kimlik bilgilerini genel olarak korurken yalnızca ses, model, persona veya otomatik modu hesap başına geçersiz kılabilir.

### Mesaj sınırları

- `textChunkLimit` — giden metin parça boyutu (varsayılan: `2000` karakter)
- `mediaMaxMb` — medya yükleme/indirme sınırı (varsayılan: `30` MB)

### Akış

Feishu/Lark, etkileşimli kartlar aracılığıyla akış yanıtlarını destekler. Etkinleştirildiğinde bot, metin üretirken kartı gerçek zamanlı olarak günceller.

```json5
{
  channels: {
    feishu: {
      streaming: true, // akış kartı çıktısını etkinleştir (varsayılan: true)
      blockStreaming: true, // blok düzeyinde akışı etkinleştir (varsayılan: true)
    },
  },
}
```

Tam yanıtı tek bir mesajda göndermek için `streaming: false` ayarlayın.

### Kota optimizasyonu

İki isteğe bağlı bayrakla Feishu/Lark API çağrılarının sayısını azaltın:

- `typingIndicator` (varsayılan `true`): yazıyor tepkisi çağrılarını atlamak için `false` olarak ayarlayın
- `resolveSenderNames` (varsayılan `true`): gönderen profil aramalarını atlamak için `false` olarak ayarlayın

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

Feishu/Lark, DM'ler ve grup konu mesajları için ACP'yi destekler. Feishu/Lark ACP metin komutlarıyla çalışır — yerel slash-command menüleri yoktur, bu yüzden doğrudan konuşma içinde `/acp ...` mesajlarını kullanın.

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

Bir Feishu/Lark DM'sinde veya başlığında:

```text
/acp spawn codex --thread here
```

`--thread here`, DM'ler ve Feishu/Lark başlık mesajları için çalışır. Bağlı konuşmadaki sonraki mesajlar doğrudan ilgili ACP oturumuna yönlendirilir.

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
- `match.peer.id`: kullanıcı Open ID'si (`ou_xxx`) veya grup ID'si (`oc_xxx`)

Arama ipuçları için [Grup/kullanıcı ID'lerini alın](#get-groupuser-ids) bölümüne bakın.

---

## Yapılandırma başvurusu

Tam yapılandırma: [Gateway yapılandırması](/tr/gateway/configuration)

| Setting                                           | Description                                | Default          |
| ------------------------------------------------- | ------------------------------------------ | ---------------- |
| `channels.feishu.enabled`                         | Kanalı etkinleştir/devre dışı bırak        | `true`           |
| `channels.feishu.domain`                          | API etki alanı (`feishu` veya `lark`)      | `feishu`         |
| `channels.feishu.connectionMode`                  | Etkinlik taşıma yöntemi (`websocket` veya `webhook`) | `websocket`      |
| `channels.feishu.defaultAccount`                  | Giden yönlendirme için varsayılan hesap    | `default`        |
| `channels.feishu.verificationToken`               | Webhook modu için gereklidir               | —                |
| `channels.feishu.encryptKey`                      | Webhook modu için gereklidir               | —                |
| `channels.feishu.webhookPath`                     | Webhook rota yolu                          | `/feishu/events` |
| `channels.feishu.webhookHost`                     | Webhook bağlama ana bilgisayarı            | `127.0.0.1`      |
| `channels.feishu.webhookPort`                     | Webhook bağlama portu                      | `3000`           |
| `channels.feishu.accounts.<id>.appId`             | App ID                                     | —                |
| `channels.feishu.accounts.<id>.appSecret`         | App Secret                                 | —                |
| `channels.feishu.accounts.<id>.domain`            | Hesap başına etki alanı geçersiz kılması   | `feishu`         |
| `channels.feishu.accounts.<id>.tts`               | Hesap başına TTS geçersiz kılması          | `messages.tts`   |
| `channels.feishu.dmPolicy`                        | DM ilkesi                                  | `allowlist`      |
| `channels.feishu.allowFrom`                       | DM izin listesi (`open_id` listesi)        | [BotOwnerId]     |
| `channels.feishu.groupPolicy`                     | Grup ilkesi                                | `allowlist`      |
| `channels.feishu.groupAllowFrom`                  | Grup izin listesi                          | —                |
| `channels.feishu.requireMention`                  | Gruplarda @mention zorunlu                 | `true`           |
| `channels.feishu.groups.<chat_id>.requireMention` | Grup başına @mention geçersiz kılması      | inherited        |
| `channels.feishu.groups.<chat_id>.enabled`        | Belirli bir grubu etkinleştir/devre dışı bırak | `true`       |
| `channels.feishu.textChunkLimit`                  | Mesaj parça boyutu                         | `2000`           |
| `channels.feishu.mediaMaxMb`                      | Medya boyutu sınırı                        | `30`             |
| `channels.feishu.streaming`                       | Akış kartı çıktısı                         | `true`           |
| `channels.feishu.blockStreaming`                  | Blok düzeyinde akış                        | `true`           |
| `channels.feishu.typingIndicator`                 | Yazıyor tepkileri gönder                   | `true`           |
| `channels.feishu.resolveSenderNames`              | Gönderen görünen adlarını çözümle          | `true`           |

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

Gelen Feishu/Lark sesli mesajları, ham `file_key` JSON'u yerine medya yer tutucuları olarak normalize edilir. `tools.media.audio` yapılandırıldığında OpenClaw, sesli not kaynağını indirir ve ajan sırasından önce paylaşılan ses transkripsiyonunu çalıştırır; böylece ajan konuşma dökümünü alır. Feishu, ses yükünde transkript metnini doğrudan içeriyorsa, başka bir ASR çağrısı yapılmadan bu metin kullanılır. Bir ses transkripsiyon sağlayıcısı olmadan ajan yine de ham Feishu kaynak yükünü değil, bir `<media:audio>` yer tutucusu ve kaydedilmiş eki alır.

### Gönderme

- ✅ Metin
- ✅ Görseller
- ✅ Dosyalar
- ✅ Ses
- ✅ Video/medya
- ✅ Etkileşimli kartlar (akış güncellemeleri dahil)
- ⚠️ Zengin metin (post tarzı biçimlendirme; Feishu/Lark'ın tüm yazma yeteneklerini desteklemez)

Yerel Feishu/Lark ses baloncukları, Feishu `audio` mesaj türünü kullanır ve Ogg/Opus medya yüklemesi gerektirir (`file_type: "opus"`). Mevcut `.opus` ve `.ogg` medya doğrudan yerel ses olarak gönderilir. MP3/WAV/M4A ve diğer olası ses biçimleri, yalnızca yanıt sesli teslim istiyorsa (`audioAsVoice` / mesaj aracı `asVoice`, TTS sesli not yanıtları dahil) `ffmpeg` ile 48kHz Ogg/Opus biçimine dönüştürülür. Normal MP3 ekleri normal dosya olarak kalır. `ffmpeg` yoksa veya dönüştürme başarısız olursa OpenClaw bir dosya ekine geri döner ve nedeni günlüğe kaydeder.

### Başlıklar ve yanıtlar

- ✅ Satır içi yanıtlar
- ✅ Başlık yanıtları
- ✅ Medya yanıtları, bir başlık mesajına yanıt verirken başlık farkındalığını korur

`groupSessionScope: "group_topic"` ve `"group_topic_sender"` için yerel Feishu/Lark konu grupları, standart konu oturumu anahtarı olarak `thread_id` (`omt_*`) olayını kullanır. OpenClaw'ın başlıklara dönüştürdüğü normal grup yanıtları, ilk tur ile takip turunun aynı oturumda kalması için yanıt kök mesaj kimliğini (`om_*`) kullanmaya devam eder.

---

## İlgili

- [Kanallara Genel Bakış](/tr/channels) — desteklenen tüm kanallar
- [Eşleştirme](/tr/channels/pairing) — DM kimlik doğrulaması ve eşleştirme akışı
- [Gruplar](/tr/channels/groups) — grup sohbeti davranışı ve mention geçitlemesi
- [Kanal Yönlendirmesi](/tr/channels/channel-routing) — mesajlar için oturum yönlendirmesi
- [Güvenlik](/tr/gateway/security) — erişim modeli ve sağlamlaştırma
