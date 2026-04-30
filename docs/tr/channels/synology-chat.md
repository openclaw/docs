---
read_when:
    - OpenClaw ile Synology Chat kurulumu
    - Synology Chat Webhook yönlendirmesinde hata ayıklama
summary: Synology Chat Webhook kurulumu ve OpenClaw yapılandırması
title: Synology Chat
x-i18n:
    generated_at: "2026-04-30T09:09:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: c3d6d7a56bd15d29de38c6ae29ae496b491c2e75df5e0a0a15410b0fbdc55a00
    source_path: channels/synology-chat.md
    workflow: 16
---

Durum: Synology Chat webhooks kullanan paketli Plugin doğrudan mesaj kanalı.
Plugin, Synology Chat outgoing webhook'larından gelen iletileri kabul eder ve yanıtları
bir Synology Chat incoming webhook'u üzerinden gönderir.

## Paketli Plugin

Synology Chat, güncel OpenClaw sürümlerinde paketli bir Plugin olarak gelir; bu nedenle normal
paketlenmiş derlemeler ayrı bir kurulum gerektirmez.

Daha eski bir derlemedeyseniz veya Synology Chat'i hariç tutan özel bir kurulum kullanıyorsanız,
manuel olarak kurun:

Yerel bir checkout'tan kurun:

```bash
openclaw plugins install ./path/to/local/synology-chat-plugin
```

Ayrıntılar: [Pluginler](/tr/tools/plugin)

## Hızlı kurulum

1. Synology Chat Plugin'inin kullanılabilir olduğundan emin olun.
   - Güncel paketlenmiş OpenClaw sürümleri bunu zaten içerir.
   - Daha eski/özel kurulumlar, yukarıdaki komutla bir kaynak checkout'undan bunu manuel olarak ekleyebilir.
   - `openclaw onboard` artık Synology Chat'i `openclaw channels add` ile aynı kanal kurulum listesinde gösterir.
   - Etkileşimsiz kurulum: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
2. Synology Chat entegrasyonlarında:
   - Bir incoming webhook oluşturun ve URL'sini kopyalayın.
   - Gizli token'ınızla bir outgoing webhook oluşturun.
3. Outgoing webhook URL'sini OpenClaw gateway'inize yönlendirin:
   - Varsayılan olarak `https://gateway-host/webhook/synology`.
   - Veya özel `channels.synology-chat.webhookPath` değeriniz.
4. Kurulumu OpenClaw'da tamamlayın.
   - Rehberli: `openclaw onboard`
   - Doğrudan: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
5. Gateway'i yeniden başlatın ve Synology Chat bot'una bir DM gönderin.

Webhook kimlik doğrulama ayrıntıları:

- OpenClaw, outgoing webhook token'ını önce `body.token`, sonra
  `?token=...`, ardından header'lardan kabul eder.
- Kabul edilen header biçimleri:
  - `x-synology-token`
  - `x-webhook-token`
  - `x-openclaw-token`
  - `Authorization: Bearer <token>`
- Boş veya eksik token'lar güvenli biçimde reddedilir.

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

Varsayılan hesap için env vars kullanabilirsiniz:

- `SYNOLOGY_CHAT_TOKEN`
- `SYNOLOGY_CHAT_INCOMING_URL`
- `SYNOLOGY_NAS_HOST`
- `SYNOLOGY_ALLOWED_USER_IDS` (virgülle ayrılmış)
- `SYNOLOGY_RATE_LIMIT`
- `OPENCLAW_BOT_NAME`

Yapılandırma değerleri env vars değerlerini geçersiz kılar.

`SYNOLOGY_CHAT_INCOMING_URL`, bir çalışma alanı `.env` dosyasından ayarlanamaz; bkz. [Çalışma alanı `.env` dosyaları](/tr/gateway/security).

## DM ilkesi ve erişim denetimi

- `dmPolicy: "allowlist"` önerilen varsayılandır.
- `allowedUserIds`, Synology kullanıcı kimliklerinin bir listesini (veya virgülle ayrılmış string) kabul eder.
- `allowlist` modunda, boş bir `allowedUserIds` listesi yanlış yapılandırma olarak değerlendirilir ve webhook route'u başlatılmaz (`allowedUserIds: ["*"]` ile tümüne izin vermek için `dmPolicy: "open"` kullanın).
- `dmPolicy: "open"`, herkese açık DM'lere yalnızca `allowedUserIds` içinde `"*"` varsa izin verir; kısıtlayıcı girdilerle yalnızca eşleşen kullanıcılar sohbet edebilir.
- `dmPolicy: "disabled"` DM'leri engeller.
- Yanıt alıcısı bağlama, varsayılan olarak kararlı sayısal `user_id` üzerinde kalır. `channels.synology-chat.dangerouslyAllowNameMatching: true`, yanıt teslimi için değiştirilebilir kullanıcı adı/takma ad aramasını yeniden etkinleştiren break-glass uyumluluk modudur.
- Eşleştirme onayları şunlarla çalışır:
  - `openclaw pairing list synology-chat`
  - `openclaw pairing approve synology-chat <CODE>`

## Giden teslimat

Hedef olarak sayısal Synology Chat kullanıcı kimliklerini kullanın.

Örnekler:

```bash
openclaw message send --channel synology-chat --target 123456 --text "Hello from OpenClaw"
openclaw message send --channel synology-chat --target synology-chat:123456 --text "Hello again"
```

Medya gönderimleri URL tabanlı dosya teslimiyle desteklenir.
Giden dosya URL'leri `http` veya `https` kullanmalıdır ve özel ya da başka şekilde engellenmiş ağ hedefleri, OpenClaw URL'yi NAS webhook'una iletmeden önce reddedilir.

## Çoklu hesap

`channels.synology-chat.accounts` altında birden fazla Synology Chat hesabı desteklenir.
Her hesap token, incoming URL, webhook path, DM ilkesi ve limitleri geçersiz kılabilir.
Doğrudan mesaj oturumları hesap ve kullanıcı başına yalıtılır; bu nedenle iki farklı Synology hesabındaki aynı sayısal `user_id`
transcript durumunu paylaşmaz.
Etkinleştirilen her hesaba farklı bir `webhookPath` verin. OpenClaw artık yinelenen tam path'leri reddeder
ve çoklu hesap kurulumlarında yalnızca paylaşılan bir webhook path'i devralan adlandırılmış hesapları başlatmayı reddeder.
Adlandırılmış bir hesap için kasıtlı olarak eski devralmaya ihtiyacınız varsa, o hesapta veya `channels.synology-chat` düzeyinde
`dangerouslyAllowInheritedWebhookPath: true` ayarlayın; ancak yinelenen tam path'ler yine de güvenli biçimde reddedilir. Hesap başına açık path'leri tercih edin.

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
- Gelen webhook istekleri token ile doğrulanır ve gönderici başına rate limit uygulanır.
- Geçersiz token kontrolleri sabit zamanlı gizli değer karşılaştırması kullanır ve güvenli biçimde reddedilir.
- Üretim için `dmPolicy: "allowlist"` tercih edin.
- Eski kullanıcı adı tabanlı yanıt teslimine açıkça ihtiyacınız yoksa `dangerouslyAllowNameMatching` kapalı kalsın.
- Çoklu hesap kurulumunda paylaşılan path routing riskini açıkça kabul etmiyorsanız `dangerouslyAllowInheritedWebhookPath` kapalı kalsın.

## Sorun giderme

- `Missing required fields (token, user_id, text)`:
  - outgoing webhook payload'unda gerekli alanlardan biri eksik
  - Synology token'ı header'larda gönderiyorsa gateway/proxy'nin bu header'ları koruduğundan emin olun
- `Invalid token`:
  - outgoing webhook gizli değeri `channels.synology-chat.token` ile eşleşmiyor
  - istek yanlış hesaba/webhook path'ine gidiyor
  - istek OpenClaw'a ulaşmadan önce bir reverse proxy token header'ını kaldırdı
- `Rate limit exceeded`:
  - aynı kaynaktan çok fazla geçersiz token denemesi, o kaynağı geçici olarak kilitleyebilir
  - kimliği doğrulanmış göndericilerin ayrıca kullanıcı başına ayrı bir mesaj rate limit'i vardır
- `Allowlist is empty. Configure allowedUserIds or use dmPolicy=open with allowedUserIds=["*"].`:
  - `dmPolicy="allowlist"` etkin, ancak hiçbir kullanıcı yapılandırılmamış
- `User not authorized`:
  - göndericinin sayısal `user_id` değeri `allowedUserIds` içinde değil

## İlgili

- [Kanallara Genel Bakış](/tr/channels) — desteklenen tüm kanallar
- [Eşleştirme](/tr/channels/pairing) — DM kimlik doğrulaması ve eşleştirme akışı
- [Gruplar](/tr/channels/groups) — grup sohbeti davranışı ve mention gating
- [Kanal Routing](/tr/channels/channel-routing) — mesajlar için oturum routing'i
- [Güvenlik](/tr/gateway/security) — erişim modeli ve sağlamlaştırma
