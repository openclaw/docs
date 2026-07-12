---
read_when:
    - OpenClaw ile Synology Chat'i ayarlama
    - Synology Chat Webhook yönlendirmesinde hata ayıklama
summary: Synology Chat Webhook kurulumu ve OpenClaw yapılandırması
title: Synology Chat
x-i18n:
    generated_at: "2026-07-12T11:30:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7829bb1464c4f5546adf086a96b7f3478e6f03e35ed2443bd92c160fa3d2bb8b
    source_path: channels/synology-chat.md
    workflow: 16
---

Synology Chat, OpenClaw'a bir Webhook çifti üzerinden bağlanır: Synology Chat giden Webhook'u, gelen doğrudan mesajları Gateway'e gönderir; yanıtlar ise Synology Chat gelen Webhook'u üzerinden geri iletilir.

Durum: Resmî Plugin, ayrı olarak kurulur. Yalnızca doğrudan mesajlar desteklenir; metin ve URL tabanlı dosya gönderimleri desteklenir.

## Kurulum

```bash
openclaw plugins install @openclaw/synology-chat
```

Yerel çalışma kopyası (bir git deposundan çalıştırırken):

```bash
openclaw plugins install ./path/to/local/synology-chat-plugin
```

Ayrıntılar: [Plugin'ler](/tr/tools/plugin)

## Hızlı yapılandırma

1. Plugin'i kurun (yukarıda).
2. Synology Chat entegrasyonlarında:
   - Bir gelen Webhook oluşturun ve URL'sini kopyalayın.
   - Gizli token'ınızla bir giden Webhook oluşturun.
3. Giden Webhook URL'sini OpenClaw Gateway'inize yönlendirin:
   - Varsayılan olarak `https://gateway-host/webhook/synology`.
   - Veya özel `channels.synology-chat.webhookPath` değeriniz.
4. OpenClaw'daki yapılandırmayı tamamlayın. Synology Chat, her iki akışta da aynı kanal yapılandırma listesinde görünür:
   - Rehberli: `openclaw onboard` veya `openclaw channels add`
   - Doğrudan: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
5. Gateway'i yeniden başlatın ve Synology Chat botuna bir doğrudan mesaj gönderin.

Webhook kimlik doğrulama ayrıntıları:

- OpenClaw, giden Webhook token'ını sırasıyla `body.token`, ardından
  `?token=...`, ardından başlıklardan kabul eder.
- Kabul edilen başlık biçimleri:
  - `x-synology-token`
  - `x-webhook-token`
  - `x-openclaw-token`
  - `Authorization: Bearer <token>`
- Boş veya eksik token'lar güvenli biçimde reddedilir.
- Yükler `application/x-www-form-urlencoded` veya `application/json` olabilir; `token`, `user_id` ve `text` zorunludur.

En küçük yapılandırma:

```json5
{
  channels: {
    "synology-chat": {
      enabled: true,
      token: "synology-outgoing-token",
      incomingUrl: "https://nas.example.com/webapi/entry.cgi?api=SYNO.Chat.External&method=incoming&version=2&token=...",
      webhookPath: "/webhook/synology",
      dmPolicy: "allowlist",
      allowedUserIds: ["123456"],
      rateLimitPerMinute: 30,
      allowInsecureSsl: false,
    },
  },
}
```

## Ortam değişkenleri

Varsayılan hesap için ortam değişkenlerini kullanabilirsiniz:

- `SYNOLOGY_CHAT_TOKEN`
- `SYNOLOGY_CHAT_INCOMING_URL`
- `SYNOLOGY_NAS_HOST`
- `SYNOLOGY_ALLOWED_USER_IDS` (virgülle ayrılmış)
- `SYNOLOGY_RATE_LIMIT`
- `OPENCLAW_BOT_NAME`

Yapılandırma değerleri ortam değişkenlerini geçersiz kılar.

`SYNOLOGY_CHAT_INCOMING_URL` ve `SYNOLOGY_NAS_HOST`, çalışma alanındaki bir `.env` dosyasından ayarlanamaz; bkz. [Çalışma alanı `.env` dosyaları](/tr/gateway/security#workspace-env-files).

## Doğrudan mesaj politikası ve erişim denetimi

- Desteklenen `dmPolicy` değerleri: `allowlist` (varsayılan), `open` ve `disabled`. Synology Chat'te eşleştirme akışı yoktur; göndericileri, sayısal Synology kullanıcı kimliklerini `allowedUserIds` alanına ekleyerek onaylayın.
- `allowedUserIds`, Synology kullanıcı kimliklerinin bir listesini (veya virgülle ayrılmış dizesini) kabul eder.
- `allowlist` modunda boş bir `allowedUserIds` listesi hatalı yapılandırma olarak değerlendirilir ve Webhook rotası başlatılmaz.
- `dmPolicy: "open"`, yalnızca `allowedUserIds` içinde `"*"` bulunduğunda herkese açık doğrudan mesajlara izin verir; kısıtlayıcı girdiler kullanıldığında yalnızca eşleşen kullanıcılar sohbet edebilir. Boş bir `allowedUserIds` listesiyle kullanılan `open` da rotayı başlatmayı reddeder.
- `dmPolicy: "disabled"` doğrudan mesajları engeller.
- Yanıt alıcısı bağlama işlemi varsayılan olarak kararlı sayısal `user_id` üzerinde kalır. `channels.synology-chat.dangerouslyAllowNameMatching: true`, yanıt teslimatı için değiştirilebilir kullanıcı adı/takma ad aramasını yeniden etkinleştiren acil durum uyumluluk modudur.

## Giden teslimat

Hedef olarak sayısal Synology Chat kullanıcı kimliklerini kullanın. `synology-chat:`, `synology_chat:` ve `synology:` önekleri kabul edilir.

Örnekler:

```bash
openclaw message send --channel synology-chat --target 123456 --message "Hello from OpenClaw"
openclaw message send --channel synology-chat --target synology-chat:123456 --message "Hello again"
openclaw message send --channel synology-chat --target synology:123456 --message "Short prefix"
```

Giden metin 2000 karakterlik parçalara bölünür. Medya gönderimleri, URL tabanlı dosya teslimatıyla desteklenir: NAS dosyayı indirip ekler (en fazla 32 MB). Giden dosya URL'leri `http` veya `https` kullanmalıdır; özel veya başka bir nedenle engellenmiş ağ hedefleri, OpenClaw URL'yi NAS Webhook'una iletmeden önce reddedilir.

## Çoklu hesap

`channels.synology-chat.accounts` altında birden fazla Synology Chat hesabı desteklenir.
Her hesap token'ı, gelen URL'yi, Webhook yolunu, doğrudan mesaj politikasını ve sınırları geçersiz kılabilir.
Doğrudan mesaj oturumları hesap ve kullanıcı başına yalıtılır; dolayısıyla iki farklı Synology hesabındaki aynı sayısal `user_id`,
konuşma dökümü durumunu paylaşmaz.
Etkinleştirilen her hesaba farklı bir `webhookPath` verin. OpenClaw, tam olarak aynı olan yinelenen yolları reddeder
ve çoklu hesap yapılandırmalarında yalnızca paylaşılan bir Webhook yolunu devralan adlandırılmış hesapları başlatmayı reddeder.
Adlandırılmış bir hesap için eski devralma davranışına özellikle ihtiyacınız varsa o hesapta veya
`channels.synology-chat` altında `dangerouslyAllowInheritedWebhookPath: true` ayarını kullanın;
ancak tam olarak aynı olan yinelenen yollar yine güvenli biçimde reddedilir. Hesap başına açıkça belirtilmiş yolları tercih edin.

```json5
{
  channels: {
    "synology-chat": {
      enabled: true,
      accounts: {
        default: {
          token: "token-a",
          incomingUrl: "https://nas-a.example.com/...token=...",
        },
        alerts: {
          token: "token-b",
          incomingUrl: "https://nas-b.example.com/...token=...",
          webhookPath: "/webhook/synology-alerts",
          dmPolicy: "allowlist",
          allowedUserIds: ["987654"],
        },
      },
    },
  },
}
```

## Güvenlik notları

- `token` değerini gizli tutun ve sızarsa değiştirin.
- Kendinden imzalı yerel bir NAS sertifikasına açıkça güvenmediğiniz sürece `allowInsecureSsl: false` olarak bırakın.
- Gelen Webhook isteklerinin token'ı doğrulanır ve gönderici başına hız sınırı uygulanır (`rateLimitPerMinute`, varsayılan 30).
- Geçersiz token denetimleri sabit süreli gizli değer karşılaştırması kullanır ve güvenli biçimde reddedilir; tekrarlanan geçersiz token denemeleri kaynak IP'yi geçici olarak kilitler.
- Gelen mesaj metni, bilinen istem enjeksiyonu kalıplarına karşı temizlenir ve 4000 karakterde kesilir.
- Üretim ortamı için `dmPolicy: "allowlist"` tercih edin.
- Eski kullanıcı adı tabanlı yanıt teslimatına açıkça ihtiyacınız yoksa `dangerouslyAllowNameMatching` ayarını kapalı tutun.
- Çoklu hesap yapılandırmasında paylaşılan yol yönlendirme riskini açıkça kabul etmediğiniz sürece `dangerouslyAllowInheritedWebhookPath` ayarını kapalı tutun.

## Sorun giderme

- `Missing required fields (token, user_id, text)`:
  - giden Webhook yükünde zorunlu alanlardan biri eksiktir
  - Synology token'ı başlıklarda gönderiyorsa Gateway'in/proxy'nin bu başlıkları koruduğundan emin olun
- `Invalid token`:
  - giden Webhook gizli değeri `channels.synology-chat.token` ile eşleşmiyordur
  - istek yanlış hesaba/Webhook yoluna ulaşıyordur
  - ters proxy, istek OpenClaw'a ulaşmadan önce token başlığını kaldırmıştır
- `Rate limit exceeded`:
  - aynı kaynaktan gelen çok sayıda geçersiz token denemesi, bu kaynağı geçici olarak kilitleyebilir
  - kimliği doğrulanmış göndericiler için ayrıca kullanıcı başına mesaj hız sınırı vardır
- `Allowlist is empty. Configure allowedUserIds or use dmPolicy=open with allowedUserIds=["*"].`:
  - `dmPolicy="allowlist"` etkindir ancak hiçbir kullanıcı yapılandırılmamıştır
- `User not authorized`:
  - göndericinin sayısal `user_id` değeri `allowedUserIds` içinde değildir

## İlgili konular

- [Kanallara genel bakış](/tr/channels) — desteklenen tüm kanallar
- [Gruplar](/tr/channels/groups) — grup sohbeti davranışı ve bahsetme denetimi
- [Kanal yönlendirme](/tr/channels/channel-routing) — mesajlar için oturum yönlendirmesi
- [Güvenlik](/tr/gateway/security) — erişim modeli ve sağlamlaştırma
