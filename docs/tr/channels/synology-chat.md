---
read_when:
    - OpenClaw ile Synology Chat Kurulumu
    - Synology Chat Webhook yönlendirmesinde hata ayıklama
summary: Synology Chat Webhook kurulumu ve OpenClaw yapılandırması
title: Synology Chat
x-i18n:
    generated_at: "2026-05-02T08:48:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1f1946425fa6e7a071b03d212854476dc2c0af98097f38da93d3711e5a5c7e96
    source_path: channels/synology-chat.md
    workflow: 16
---

Durum: Synology Chat webhooks kullanan paketlenmiş Plugin doğrudan mesaj kanalı.
Plugin, Synology Chat giden webhooks üzerinden gelen iletileri kabul eder ve yanıtları
bir Synology Chat gelen webhook üzerinden gönderir.

## Paketlenmiş Plugin

Synology Chat mevcut OpenClaw sürümlerinde paketlenmiş bir Plugin olarak gelir, bu nedenle normal
paketlenmiş derlemeler ayrı bir kurulum gerektirmez.

Daha eski bir derlemedeyseniz veya Synology Chat'i hariç tutan özel bir kurulum kullanıyorsanız,
manuel olarak kurun:

Yerel bir checkout'tan kurun:

```bash
openclaw plugins install ./path/to/local/synology-chat-plugin
```

Ayrıntılar: [Plugin'ler](/tr/tools/plugin)

## Hızlı kurulum

1. Synology Chat Plugin'inin kullanılabilir olduğundan emin olun.
   - Mevcut paketlenmiş OpenClaw sürümleri onu zaten içerir.
   - Daha eski/özel kurulumlar, yukarıdaki komutla bir kaynak checkout'undan manuel olarak ekleyebilir.
   - `openclaw onboard` artık Synology Chat'i `openclaw channels add` ile aynı kanal kurulum listesinde gösterir.
   - Etkileşimsiz kurulum: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
2. Synology Chat entegrasyonlarında:
   - Bir gelen webhook oluşturun ve URL'sini kopyalayın.
   - Gizli token'ınızla bir giden webhook oluşturun.
3. Giden webhook URL'sini OpenClaw Gateway'inize yönlendirin:
   - Varsayılan olarak `https://gateway-host/webhook/synology`.
   - Veya özel `channels.synology-chat.webhookPath` değeriniz.
4. Kurulumu OpenClaw içinde tamamlayın.
   - Rehberli: `openclaw onboard`
   - Doğrudan: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
5. Gateway'i yeniden başlatın ve Synology Chat botuna bir DM gönderin.

Webhook kimlik doğrulama ayrıntıları:

- OpenClaw giden webhook token'ını önce `body.token`, ardından
  `?token=...`, ardından başlıklardan kabul eder.
- Kabul edilen başlık biçimleri:
  - `x-synology-token`
  - `x-webhook-token`
  - `x-openclaw-token`
  - `Authorization: Bearer <token>`
- Boş veya eksik token'lar kapalı kalacak şekilde başarısız olur.

Minimal config:

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

Varsayılan hesap için env vars kullanabilirsiniz:

- `SYNOLOGY_CHAT_TOKEN`
- `SYNOLOGY_CHAT_INCOMING_URL`
- `SYNOLOGY_NAS_HOST`
- `SYNOLOGY_ALLOWED_USER_IDS` (virgülle ayrılmış)
- `SYNOLOGY_RATE_LIMIT`
- `OPENCLAW_BOT_NAME`

Config değerleri env vars değerlerini geçersiz kılar.

`SYNOLOGY_CHAT_INCOMING_URL` bir workspace `.env` dosyasından ayarlanamaz; bkz. [Workspace `.env` dosyaları](/tr/gateway/security).

## DM ilkesi ve erişim denetimi

- `dmPolicy: "allowlist"` önerilen varsayılandır.
- `allowedUserIds`, Synology kullanıcı ID'lerinden oluşan bir listeyi (veya virgülle ayrılmış string'i) kabul eder.
- `allowlist` modunda, boş bir `allowedUserIds` listesi yanlış yapılandırma olarak değerlendirilir ve webhook rotası başlatılmaz (herkese izin vermek için `allowedUserIds: ["*"]` ile `dmPolicy: "open"` kullanın).
- `dmPolicy: "open"` yalnızca `allowedUserIds` `"*"` içerdiğinde herkese açık DM'lere izin verir; kısıtlayıcı girişlerle yalnızca eşleşen kullanıcılar sohbet edebilir.
- `dmPolicy: "disabled"` DM'leri engeller.
- Yanıt alıcısı bağlaması varsayılan olarak kararlı sayısal `user_id` üzerinde kalır. `channels.synology-chat.dangerouslyAllowNameMatching: true`, yanıt teslimi için değiştirilebilir kullanıcı adı/takma ad aramasını yeniden etkinleştiren acil uyumluluk modudur.
- Eşleştirme onayları şunlarla çalışır:
  - `openclaw pairing list synology-chat`
  - `openclaw pairing approve synology-chat <CODE>`

## Giden teslimat

Hedef olarak sayısal Synology Chat kullanıcı ID'lerini kullanın.

Örnekler:

```bash
openclaw message send --channel synology-chat --target 123456 --text "Hello from OpenClaw"
openclaw message send --channel synology-chat --target synology-chat:123456 --text "Hello again"
openclaw message send --channel synology-chat --target synology:123456 --text "Short prefix"
```

Medya gönderimleri URL tabanlı dosya teslimiyle desteklenir.
Giden dosya URL'leri `http` veya `https` kullanmalıdır; özel veya başka şekilde engellenmiş ağ hedefleri, OpenClaw URL'yi NAS webhook'una iletmeden önce reddedilir.

## Çoklu hesap

`channels.synology-chat.accounts` altında birden fazla Synology Chat hesabı desteklenir.
Her hesap token, gelen URL, webhook yolu, DM ilkesi ve limitleri geçersiz kılabilir.
Doğrudan mesaj oturumları hesap ve kullanıcı başına izole edilir; bu nedenle aynı sayısal `user_id`
iki farklı Synology hesabında transcript durumunu paylaşmaz.
Etkinleştirilen her hesaba ayrı bir `webhookPath` verin. OpenClaw artık yinelenen birebir yolları reddeder
ve çoklu hesap kurulumlarında yalnızca paylaşılan bir webhook yolunu devralan adlandırılmış hesapları başlatmayı reddeder.
Adlandırılmış bir hesap için kasıtlı olarak eski devralmaya ihtiyacınız varsa, o hesapta veya `channels.synology-chat`
düzeyinde `dangerouslyAllowInheritedWebhookPath: true` ayarlayın,
ancak yinelenen birebir yollar yine de kapalı kalacak şekilde reddedilir. Hesap başına açık yolları tercih edin.

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

- `token` değerini gizli tutun ve sızarsa döndürün.
- Kendinden imzalı yerel bir NAS sertifikasına açıkça güvenmiyorsanız `allowInsecureSsl: false` olarak bırakın.
- Gelen webhook istekleri token ile doğrulanır ve gönderen başına rate-limited uygulanır.
- Geçersiz token kontrolleri sabit zamanlı gizli karşılaştırması kullanır ve kapalı kalacak şekilde başarısız olur.
- Üretim için `dmPolicy: "allowlist"` tercih edin.
- Eski kullanıcı adı tabanlı yanıt teslimine açıkça ihtiyacınız yoksa `dangerouslyAllowNameMatching` kapalı kalsın.
- Çoklu hesap kurulumunda paylaşılan yol yönlendirme riskini açıkça kabul etmiyorsanız `dangerouslyAllowInheritedWebhookPath` kapalı kalsın.

## Sorun giderme

- `Missing required fields (token, user_id, text)`:
  - giden webhook payload'unda gerekli alanlardan biri eksik
  - Synology token'ı başlıklarda gönderiyorsa, Gateway/proxy'nin bu başlıkları koruduğundan emin olun
- `Invalid token`:
  - giden webhook secret'ı `channels.synology-chat.token` ile eşleşmiyor
  - istek yanlış hesaba/webhook yoluna gidiyor
  - ters proxy, istek OpenClaw'a ulaşmadan önce token başlığını kaldırdı
- `Rate limit exceeded`:
  - aynı kaynaktan çok fazla geçersiz token denemesi, o kaynağı geçici olarak dışarıda bırakabilir
  - kimliği doğrulanmış gönderenlerin de kullanıcı başına ayrı bir ileti rate limit'i vardır
- `Allowlist is empty. Configure allowedUserIds or use dmPolicy=open with allowedUserIds=["*"].`:
  - `dmPolicy="allowlist"` etkin ancak hiçbir kullanıcı yapılandırılmamış
- `User not authorized`:
  - gönderenin sayısal `user_id` değeri `allowedUserIds` içinde değil

## İlgili

- [Kanallara Genel Bakış](/tr/channels) — desteklenen tüm kanallar
- [Eşleştirme](/tr/channels/pairing) — DM kimlik doğrulaması ve eşleştirme akışı
- [Gruplar](/tr/channels/groups) — grup sohbeti davranışı ve mention gating
- [Kanal Yönlendirme](/tr/channels/channel-routing) — iletiler için oturum yönlendirmesi
- [Güvenlik](/tr/gateway/security) — erişim modeli ve sağlamlaştırma
