---
read_when:
    - OpenClaw ile Synology Chat kurulumu
    - Synology Chat webhook yönlendirmesinde hata ayıklama
summary: Synology Chat webhook kurulumu ve OpenClaw yapılandırması
title: Synology Chat
x-i18n:
    generated_at: "2026-04-05T13:45:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: ddb25fc6b53f896f15f43b4936d69ea071a29a91838a5b662819377271e89d81
    source_path: channels/synology-chat.md
    workflow: 15
---

# Synology Chat

Durum: Synology Chat webhook'larını kullanan paketlenmiş eklenti doğrudan mesaj kanalı.
Eklenti, Synology Chat giden webhook'larından gelen iletileri kabul eder ve yanıtları
bir Synology Chat gelen webhook'u üzerinden gönderir.

## Paketlenmiş eklenti

Synology Chat, mevcut OpenClaw sürümlerinde paketlenmiş bir eklenti olarak gelir, bu nedenle normal
paketlenmiş derlemelerde ayrı bir kurulum gerekmez.

Daha eski bir derlemeyi veya Synology Chat'i içermeyen özel bir kurulumu kullanıyorsanız,
bunu manuel olarak yükleyin:

Yerel bir checkout'tan yükleyin:

```bash
openclaw plugins install ./path/to/local/synology-chat-plugin
```

Ayrıntılar: [Plugins](/tools/plugin)

## Hızlı kurulum

1. Synology Chat eklentisinin kullanılabilir olduğundan emin olun.
   - Mevcut paketlenmiş OpenClaw sürümleri bunu zaten içerir.
   - Eski/özel kurulumlar bunu yukarıdaki komutla bir kaynak checkout'tan manuel olarak ekleyebilir.
   - `openclaw onboard` artık `openclaw channels add` ile aynı kanal kurulum listesinde Synology Chat'i gösterir.
   - Etkileşimsiz kurulum: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
2. Synology Chat entegrasyonlarında:
   - Gelen bir webhook oluşturun ve URL'sini kopyalayın.
   - Gizli token'ınızla giden bir webhook oluşturun.
3. Giden webhook URL'sini OpenClaw gateway'inize yönlendirin:
   - Varsayılan olarak `https://gateway-host/webhook/synology`.
   - Veya özel `channels.synology-chat.webhookPath` yolunuz.
4. Kurulumu OpenClaw içinde tamamlayın.
   - Rehberli: `openclaw onboard`
   - Doğrudan: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
5. Gateway'i yeniden başlatın ve Synology Chat botuna bir DM gönderin.

Webhook kimlik doğrulama ayrıntıları:

- OpenClaw, giden webhook token'ını önce `body.token`, ardından
  `?token=...`, sonra da başlıklardan kabul eder.
- Kabul edilen başlık biçimleri:
  - `x-synology-token`
  - `x-webhook-token`
  - `x-openclaw-token`
  - `Authorization: Bearer <token>`
- Boş veya eksik token'lar kapalı varsayılanla başarısız olur.

Minimum yapılandırma:

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

## DM ilkesi ve erişim denetimi

- `dmPolicy: "allowlist"` önerilen varsayılandır.
- `allowedUserIds`, bir Synology kullanıcı kimliği listesi (veya virgülle ayrılmış dize) kabul eder.
- `allowlist` modunda boş bir `allowedUserIds` listesi yanlış yapılandırma olarak değerlendirilir ve webhook rotası başlatılmaz (herkese izin vermek için `dmPolicy: "open"` kullanın).
- `dmPolicy: "open"` herhangi bir göndericiye izin verir.
- `dmPolicy: "disabled"` DM'leri engeller.
- Yanıt alıcısı bağlama varsayılan olarak sabit sayısal `user_id` üzerinde kalır. `channels.synology-chat.dangerouslyAllowNameMatching: true`, yanıt teslimi için değiştirilebilir kullanıcı adı/takma ad aramasını yeniden etkinleştiren acil durum uyumluluk modudur.
- Eşleştirme onayları şu komutlarla çalışır:
  - `openclaw pairing list synology-chat`
  - `openclaw pairing approve synology-chat <CODE>`

## Giden teslimat

Hedef olarak sayısal Synology Chat kullanıcı kimliklerini kullanın.

Örnekler:

```bash
openclaw message send --channel synology-chat --target 123456 --text "Hello from OpenClaw"
openclaw message send --channel synology-chat --target synology-chat:123456 --text "Hello again"
```

Medya gönderimleri URL tabanlı dosya teslimi ile desteklenir.

## Çoklu hesap

`channels.synology-chat.accounts` altında birden fazla Synology Chat hesabı desteklenir.
Her hesap token, gelen URL, webhook yolu, DM ilkesi ve sınırları geçersiz kılabilir.
Doğrudan mesaj oturumları hesap ve kullanıcı başına yalıtılır; bu nedenle aynı sayısal `user_id`
iki farklı Synology hesabında aynı konuşma durumunu paylaşmaz.
Etkin olan her hesaba farklı bir `webhookPath` verin. OpenClaw artık yinelenen tam yolları reddeder
ve çoklu hesap kurulumlarında yalnızca paylaşılan bir webhook yolunu devralan adlandırılmış hesapları başlatmayı reddeder.
Bir adlandırılmış hesap için kasıtlı olarak eski devralma davranışına ihtiyacınız varsa,
o hesapta veya `channels.synology-chat` altında
`dangerouslyAllowInheritedWebhookPath: true` ayarlayın,
ancak yinelenen tam yollar yine de kapalı varsayılanla reddedilir. Hesap başına açık yolları tercih edin.

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

- `token` değerini gizli tutun ve sızarsa yenileyin.
- Kendinden imzalı yerel bir NAS sertifikasına açıkça güvenmiyorsanız `allowInsecureSsl: false` olarak bırakın.
- Gelen webhook istekleri token ile doğrulanır ve gönderici başına hız sınırına tabidir.
- Geçersiz token denetimleri sabit süreli gizli karşılaştırma kullanır ve kapalı varsayılanla başarısız olur.
- Üretim için `dmPolicy: "allowlist"` tercih edin.
- Eski kullanıcı adı tabanlı yanıt teslimine açıkça ihtiyacınız yoksa `dangerouslyAllowNameMatching` seçeneğini kapalı tutun.
- Çoklu hesap kurulumunda paylaşılan yol yönlendirme riskini açıkça kabul etmiyorsanız `dangerouslyAllowInheritedWebhookPath` seçeneğini kapalı tutun.

## Sorun giderme

- `Missing required fields (token, user_id, text)`:
  - giden webhook yükünde gerekli alanlardan biri eksik
  - Synology token'ı başlıklarda gönderiyorsa gateway/proxy'nin bu başlıkları koruduğundan emin olun
- `Invalid token`:
  - giden webhook gizli değeri `channels.synology-chat.token` ile eşleşmiyor
  - istek yanlış hesaba/webhook yoluna gidiyor
  - ters proxy, istek OpenClaw'a ulaşmadan önce token başlığını kaldırdı
- `Rate limit exceeded`:
  - aynı kaynaktan çok fazla geçersiz token denemesi o kaynağı geçici olarak kilitleyebilir
  - kimliği doğrulanmış göndericiler için de kullanıcı başına ayrı bir ileti hız sınırı vardır
- `Allowlist is empty. Configure allowedUserIds or use dmPolicy=open.`:
  - `dmPolicy="allowlist"` etkin ancak yapılandırılmış kullanıcı yok
- `User not authorized`:
  - göndericinin sayısal `user_id` değeri `allowedUserIds` içinde değil

## İlgili

- [Channels Overview](/tr/channels) — desteklenen tüm kanallar
- [Pairing](/tr/channels/pairing) — DM kimlik doğrulaması ve eşleştirme akışı
- [Groups](/tr/channels/groups) — grup sohbeti davranışı ve bahsetme geçidi
- [Channel Routing](/tr/channels/channel-routing) — iletiler için oturum yönlendirmesi
- [Security](/gateway/security) — erişim modeli ve sağlamlaştırma
