---
read_when:
    - Bir Feishu/Lark botu bağlamak istiyorsunuz
    - Feishu kanalını yapılandırıyorsunuz
summary: Feishu botuna genel bakış, özellikler ve yapılandırma
title: Feishu
x-i18n:
    generated_at: "2026-04-30T09:05:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 37de7cbb12821f119ca1a06fcdb8e80a07752e1cbfc462344d24750fbf13147a
    source_path: channels/feishu.md
    workflow: 16
---

# Feishu / Lark

Feishu/Lark, ekiplerin sohbet ettiği, belgeleri paylaştığı, takvimleri yönettiği ve birlikte iş yaptığı hepsi bir arada bir iş birliği platformudur.

**Durum:** bot DM'leri ve grup sohbetleri için üretime hazır. WebSocket varsayılan moddur; webhook modu isteğe bağlıdır.

---

## Hızlı başlangıç

<Note>
OpenClaw 2026.4.25 veya üzeri gerekir. Kontrol etmek için `openclaw --version` çalıştırın. `openclaw update` ile yükseltin.
</Note>

<Steps>
  <Step title="Kanal kurulum sihirbazını çalıştırın">
  ```bash
  openclaw channels login --channel feishu
  ```
  Otomatik olarak bir Feishu/Lark botu oluşturmak için QR kodunu Feishu/Lark mobil uygulamanızla tarayın.
  </Step>
  
  <Step title="Kurulum tamamlandıktan sonra değişiklikleri uygulamak için Gateway'i yeniden başlatın">
  ```bash
  openclaw gateway restart
  ```
  </Step>
</Steps>

---

## Erişim denetimi

### Doğrudan mesajlar

Bota kimlerin DM gönderebileceğini denetlemek için `dmPolicy` yapılandırın:

- `"pairing"` — bilinmeyen kullanıcılar bir eşleştirme kodu alır; CLI üzerinden onaylayın
- `"allowlist"` — yalnızca `allowFrom` içinde listelenen kullanıcılar sohbet edebilir (varsayılan: yalnızca bot sahibi)
- `"open"` — yalnızca `allowFrom` `"*"` içerdiğinde herkese açık DM'lere izin ver; kısıtlayıcı girdilerle yalnızca eşleşen kullanıcılar sohbet edebilir
- `"disabled"` — tüm DM'leri devre dışı bırak

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

- `true` — @bahsetme gerektir (varsayılan)
- `false` — @bahsetme olmadan yanıt ver
- Grup bazında geçersiz kılma: `channels.feishu.groups.<chat_id>.requireMention`
- Yalnızca yayın amaçlı `@all` ve `@_all`, bot bahsetmeleri olarak değerlendirilmez. Hem `@all` hem de doğrudan bottan bahseden bir mesaj yine de bot bahsetmesi sayılır.

---

## Grup yapılandırma örnekleri

### Tüm gruplara izin ver, @bahsetme gerektirme

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
    },
  },
}
```

### Tüm gruplara izin ver, yine de @bahsetme gerektir

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

`allowlist` modunda, açık bir `groups.<chat_id>` girdisi ekleyerek bir grubu da kabul edebilirsiniz. Açık girdiler `groupPolicy: "disabled"` ayarını geçersiz kılmaz. `groups.*` altındaki joker varsayılanlar eşleşen grupları yapılandırır, ancak grupları tek başına kabul etmez.

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

### Bir grup içindeki gönderenleri kısıtla

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

| Komut     | Açıklama                    |
| --------- | --------------------------- |
| `/status` | Bot durumunu göster         |
| `/reset`  | Geçerli oturumu sıfırla     |
| `/model`  | AI modelini göster veya değiştir |

<Note>
Feishu/Lark yerel eğik çizgi komut menülerini desteklemez, bu nedenle bunları düz metin mesajları olarak gönderin.
</Note>

---

## Sorun giderme

### Bot grup sohbetlerinde yanıt vermiyor

1. Botun gruba eklendiğinden emin olun
2. Bottan @bahsettiğinizden emin olun (varsayılan olarak gereklidir)
3. `groupPolicy` değerinin `"disabled"` olmadığını doğrulayın
4. Günlükleri kontrol edin: `openclaw logs --follow`

### Bot mesajları almıyor

1. Botun Feishu Open Platform / Lark Developer içinde yayımlandığından ve onaylandığından emin olun
2. Olay aboneliğinin `im.message.receive_v1` içerdiğinden emin olun
3. **Kalıcı bağlantı** (WebSocket) seçildiğinden emin olun
4. Gerekli tüm izin kapsamlarının verildiğinden emin olun
5. Gateway'in çalıştığından emin olun: `openclaw gateway status`
6. Günlükleri kontrol edin: `openclaw logs --follow`

### App Secret sızdırıldı

1. App Secret'ı Feishu Open Platform / Lark Developer içinde sıfırlayın
2. Yapılandırmanızdaki değeri güncelleyin
3. Gateway'i yeniden başlatın: `openclaw gateway restart`

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
`accounts.<id>.tts`, `messages.tts` ile aynı yapıyı kullanır ve global TTS yapılandırmasının üzerine derinlemesine birleştirilir; böylece çok botlu Feishu kurulumları, yalnızca ses, model, persona veya otomatik modu hesap bazında geçersiz kılarken paylaşılan sağlayıcı kimlik bilgilerini global olarak tutabilir.

### Mesaj sınırları

- `textChunkLimit` — giden metin parçası boyutu (varsayılan: `2000` karakter)
- `mediaMaxMb` — medya yükleme/indirme sınırı (varsayılan: `30` MB)

### Akış

Feishu/Lark, etkileşimli kartlar üzerinden akış yanıtlarını destekler. Etkinleştirildiğinde bot, metin üretirken kartı gerçek zamanlı olarak günceller.

```json5
{
  channels: {
    feishu: {
      streaming: true, // enable streaming card output (default: true)
      blockStreaming: true, // enable block-level streaming (default: true)
    },
  },
}
```

Tam yanıtı tek mesajda göndermek için `streaming: false` ayarlayın.

### Kota iyileştirme

İki isteğe bağlı bayrakla Feishu/Lark API çağrılarının sayısını azaltın:

- `typingIndicator` (varsayılan `true`): yazıyor tepkisi çağrılarını atlamak için `false` ayarlayın
- `resolveSenderNames` (varsayılan `true`): gönderen profil aramalarını atlamak için `false` ayarlayın

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

Feishu/Lark, DM'ler ve grup iş parçacığı mesajları için ACP'yi destekler. Feishu/Lark ACP metin komutlarıyla çalışır; yerel eğik çizgi komut menüleri yoktur, bu nedenle `/acp ...` mesajlarını doğrudan konuşmada kullanın.

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

#### Sohbetten ACP oluşturma

Bir Feishu/Lark DM'sinde veya iş parçacığında:

```text
/acp spawn codex --thread here
```

`--thread here`, DM'ler ve Feishu/Lark iş parçacığı mesajları için çalışır. Bağlı konuşmadaki takip mesajları doğrudan o ACP oturumuna yönlendirilir.

### Çok aracılı yönlendirme

Feishu/Lark DM'lerini veya gruplarını farklı aracılara yönlendirmek için `bindings` kullanın.

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

## Yapılandırma başvurusu

Tam yapılandırma: [Gateway yapılandırması](/tr/gateway/configuration)

| Ayar                                              | Açıklama                                                                                       | Varsayılan       |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ---------------- |
| `channels.feishu.enabled`                         | Kanalı etkinleştir/devre dışı bırak                                                            | `true`           |
| `channels.feishu.domain`                          | API etki alanı (`feishu` veya `lark`)                                                          | `feishu`         |
| `channels.feishu.connectionMode`                  | Olay aktarımı (`websocket` veya `webhook`)                                                     | `websocket`      |
| `channels.feishu.defaultAccount`                  | Giden yönlendirme için varsayılan hesap                                                        | `default`        |
| `channels.feishu.verificationToken`               | Webhook modu için gereklidir                                                                   | —                |
| `channels.feishu.encryptKey`                      | Webhook modu için gereklidir                                                                   | —                |
| `channels.feishu.webhookPath`                     | Webhook rota yolu                                                                               | `/feishu/events` |
| `channels.feishu.webhookHost`                     | Webhook bağlama ana makinesi                                                                   | `127.0.0.1`      |
| `channels.feishu.webhookPort`                     | Webhook bağlama bağlantı noktası                                                               | `3000`           |
| `channels.feishu.accounts.<id>.appId`             | Uygulama kimliği                                                                                | —                |
| `channels.feishu.accounts.<id>.appSecret`         | Uygulama gizli anahtarı                                                                         | —                |
| `channels.feishu.accounts.<id>.domain`            | Hesap başına etki alanı geçersiz kılma                                                         | `feishu`         |
| `channels.feishu.accounts.<id>.tts`               | Hesap başına TTS geçersiz kılma                                                                | `messages.tts`   |
| `channels.feishu.dmPolicy`                        | DM ilkesi                                                                                      | `allowlist`      |
| `channels.feishu.allowFrom`                       | DM izin listesi (open_id listesi)                                                              | [BotOwnerId]     |
| `channels.feishu.groupPolicy`                     | Grup ilkesi                                                                                    | `allowlist`      |
| `channels.feishu.groupAllowFrom`                  | Grup izin listesi                                                                              | —                |
| `channels.feishu.requireMention`                  | Gruplarda @bahsetme gerektir                                                                   | `true`           |
| `channels.feishu.groups.<chat_id>.requireMention` | Grup başına @bahsetme geçersiz kılma; açık kimlikler grubu izin listesi modunda da kabul eder | devralınan       |
| `channels.feishu.groups.<chat_id>.enabled`        | Belirli bir grubu etkinleştir/devre dışı bırak                                                 | `true`           |
| `channels.feishu.textChunkLimit`                  | İleti parçası boyutu                                                                           | `2000`           |
| `channels.feishu.mediaMaxMb`                      | Medya boyutu sınırı                                                                            | `30`             |
| `channels.feishu.streaming`                       | Akış kartı çıktısı                                                                             | `true`           |
| `channels.feishu.blockStreaming`                  | Blok düzeyinde akış                                                                            | `true`           |
| `channels.feishu.typingIndicator`                 | Yazıyor tepkileri gönder                                                                       | `true`           |
| `channels.feishu.resolveSenderNames`              | Gönderen görünen adlarını çözümle                                                              | `true`           |

---

## Desteklenen ileti türleri

### Alma

- ✅ Metin
- ✅ Zengin metin (gönderi)
- ✅ Görseller
- ✅ Dosyalar
- ✅ Ses
- ✅ Video/medya
- ✅ Çıkartmalar

Gelen Feishu/Lark ses iletileri, ham `file_key` JSON yerine medya yer tutucuları
olarak normalleştirilir. `tools.media.audio` yapılandırıldığında OpenClaw,
sesli not kaynağını indirir ve agent turundan önce paylaşılan ses yazıya dökümünü
çalıştırır; böylece agent konuşulan dökümü alır. Feishu, ses yükünde döküm metnini
doğrudan içeriyorsa, bu metin başka bir ASR çağrısı olmadan kullanılır. Ses yazıya
döküm sağlayıcısı olmadan da agent, ham Feishu kaynak yükünü değil, bir
`<media:audio>` yer tutucusu ve kaydedilmiş eki alır.

### Gönderme

- ✅ Metin
- ✅ Görseller
- ✅ Dosyalar
- ✅ Ses
- ✅ Video/medya
- ✅ Etkileşimli kartlar (akış güncellemeleri dahil)
- ⚠️ Zengin metin (gönderi tarzı biçimlendirme; tam Feishu/Lark yazarlık yeteneklerini desteklemez)

Yerel Feishu/Lark ses balonları Feishu `audio` ileti türünü kullanır ve
Ogg/Opus yükleme medyası (`file_type: "opus"`) gerektirir. Mevcut `.opus` ve `.ogg` medyası
doğrudan yerel ses olarak gönderilir. MP3/WAV/M4A ve diğer olası ses biçimleri,
yalnızca yanıt sesli teslimat istediğinde (`audioAsVoice` / ileti aracı `asVoice`,
TTS sesli not yanıtları dahil) `ffmpeg` ile 48kHz Ogg/Opus'a dönüştürülür.
Sıradan MP3 ekleri normal dosya olarak kalır. `ffmpeg` eksikse veya dönüştürme
başarısız olursa OpenClaw dosya ekine geri döner ve nedeni günlüğe kaydeder.

### Konular ve yanıtlar

- ✅ Satır içi yanıtlar
- ✅ Konu yanıtları
- ✅ Bir konu iletisine yanıt verirken medya yanıtları konu farkındalığını korur

`groupSessionScope: "group_topic"` ve `"group_topic_sender"` için yerel
Feishu/Lark konu grupları, olay `thread_id` değerini (`omt_*`) standart
konu oturumu anahtarı olarak kullanır. OpenClaw'ın konulara dönüştürdüğü normal
grup yanıtları, ilk turun ve takip turunun aynı oturumda kalması için
yanıt kök ileti kimliğini (`om_*`) kullanmaya devam eder.

---

## İlgili

- [Kanallara Genel Bakış](/tr/channels) — desteklenen tüm kanallar
- [Eşleştirme](/tr/channels/pairing) — DM kimlik doğrulaması ve eşleştirme akışı
- [Gruplar](/tr/channels/groups) — grup sohbeti davranışı ve bahsetme kapısı
- [Kanal Yönlendirme](/tr/channels/channel-routing) — iletiler için oturum yönlendirmesi
- [Güvenlik](/tr/gateway/security) — erişim modeli ve sağlamlaştırma
