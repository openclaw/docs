---
read_when:
    - OpenClaw ile Synology Chat kurma
    - Synology Chat Webhook yönlendirmesinde hata ayıklama
summary: Synology Chat Webhook kurulumu ve OpenClaw yapılandırması
title: Synology Chat
x-i18n:
    generated_at: "2026-04-24T08:59:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5135e9aa1fd86437a635378dfbbde321bbd2e5f6fef7a3cc740ea54ebf4b76d5
    source_path: channels/synology-chat.md
    workflow: 15
---

Durum: Synology Chat Webhook'larını kullanan paketlenmiş Plugin doğrudan mesaj kanalı.
Plugin, Synology Chat giden Webhook'larından gelen mesajları kabul eder ve yanıtları
Synology Chat gelen Webhook'u üzerinden gönderir.

## Paketlenmiş Plugin

Synology Chat, güncel OpenClaw sürümlerinde paketlenmiş bir Plugin olarak gelir; bu nedenle normal
paketlenmiş derlemelerde ayrı bir kurulum gerekmez.

Daha eski bir derlemedeyseniz veya Synology Chat'i dışlayan özel bir kurulum kullanıyorsanız,
elle kurun:

Yerel bir checkout'tan kurulum:

```bash
openclaw plugins install ./path/to/local/synology-chat-plugin
```

Ayrıntılar: [Plugin'ler](/tr/tools/plugin)

## Hızlı kurulum

1. Synology Chat Plugin'inin kullanılabilir olduğundan emin olun.
   - Güncel paketlenmiş OpenClaw sürümleri bunu zaten paketlenmiş olarak içerir.
   - Eski/özel kurulumlar, yukarıdaki komutla bir kaynak checkout'tan bunu elle ekleyebilir.
   - `openclaw onboard` artık Synology Chat'i, `openclaw channels add` ile aynı kanal kurulum listesinde gösterir.
   - Etkileşimsiz kurulum: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
2. Synology Chat entegrasyonlarında:
   - Bir gelen Webhook oluşturun ve URL'sini kopyalayın.
   - Gizli token'ınızla bir giden Webhook oluşturun.
3. Giden Webhook URL'sini OpenClaw Gateway'inize yönlendirin:
   - Varsayılan olarak `https://gateway-host/webhook/synology`.
   - Veya özel `channels.synology-chat.webhookPath` yolunuza.
4. OpenClaw'da kurulumu tamamlayın.
   - Kılavuzlu: `openclaw onboard`
   - Doğrudan: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
5. Gateway'i yeniden başlatın ve Synology Chat botuna bir DM gönderin.

Webhook kimlik doğrulama ayrıntıları:

- OpenClaw, giden Webhook token'ını önce `body.token`, sonra
  `?token=...`, ardından üst bilgilerden kabul eder.
- Kabul edilen üst bilgi biçimleri:
  - `x-synology-token`
  - `x-webhook-token`
  - `x-openclaw-token`
  - `Authorization: Bearer <token>`
- Boş veya eksik token'lar güvenli kapanışla başarısız olur.

Asgari yapılandırma:

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

`SYNOLOGY_CHAT_INCOMING_URL`, çalışma alanı `.env` dosyasından ayarlanamaz; bkz. [Çalışma alanı `.env` dosyaları](/tr/gateway/security).

## DM politikası ve erişim denetimi

- `dmPolicy: "allowlist"` önerilen varsayılandır.
- `allowedUserIds`, Synology kullanıcı kimliklerinin listesini (veya virgülle ayrılmış dizgesini) kabul eder.
- `allowlist` modunda, boş `allowedUserIds` listesi yanlış yapılandırma olarak değerlendirilir ve Webhook yolu başlatılmaz (herkese izin vermek için `dmPolicy: "open"` kullanın).
- `dmPolicy: "open"` herhangi bir gönderene izin verir.
- `dmPolicy: "disabled"` DM'leri engeller.
- Yanıt alıcısı bağlama varsayılan olarak kararlı sayısal `user_id` üzerinde kalır. `channels.synology-chat.dangerouslyAllowNameMatching: true`, yanıt teslimi için değişebilir kullanıcı adı/takma ad aramasını yeniden etkinleştiren acil durum uyumluluk modudur.
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
Giden dosya URL'leri `http` veya `https` kullanmalıdır ve özel ya da başka şekilde engellenmiş ağ hedefleri, OpenClaw URL'yi NAS Webhook'una iletmeden önce reddedilir.

## Çok hesap

`channels.synology-chat.accounts` altında birden fazla Synology Chat hesabı desteklenir.
Her hesap token'ı, gelen URL'yi, Webhook yolunu, DM politikasını ve limitleri geçersiz kılabilir.
Doğrudan mesaj oturumları hesap ve kullanıcı başına yalıtılır; bu nedenle iki farklı Synology hesabındaki aynı sayısal `user_id`
transkript durumunu paylaşmaz.
Etkin her hesaba farklı bir `webhookPath` verin. OpenClaw artık aynı tam yolları reddeder
ve çok hesaplı kurulumlarda yalnızca paylaşılan bir Webhook yolunu devralan adlandırılmış hesapları başlatmayı reddeder.
Adlandırılmış bir hesap için bilerek eski devralma davranışına ihtiyacınız varsa,
o hesapta veya `channels.synology-chat` altında `dangerouslyAllowInheritedWebhookPath: true`
ayarlayın; ancak aynı tam yollar yine de güvenli kapanışla reddedilir. Açık hesap başına yollar tercih edilir.

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
- Kendinden imzalı yerel bir NAS sertifikasına açıkça güvenmiyorsanız `allowInsecureSsl: false` değerini koruyun.
- Gelen Webhook istekleri, token doğrulamasıyla denetlenir ve gönderici başına hız sınırına tabidir.
- Geçersiz token kontrolleri sabit süreli gizli karşılaştırma kullanır ve güvenli kapanışla başarısız olur.
- Üretim için `dmPolicy: "allowlist"` tercih edin.
- Eski kullanıcı adı tabanlı yanıt teslimine açıkça ihtiyacınız yoksa `dangerouslyAllowNameMatching` kapalı kalsın.
- Çok hesaplı kurulumda paylaşılan yol yönlendirme riskini açıkça kabul etmiyorsanız `dangerouslyAllowInheritedWebhookPath` kapalı kalsın.

## Sorun giderme

- `Missing required fields (token, user_id, text)`:
  - giden Webhook yükünde gerekli alanlardan biri eksik
  - Synology token'ı üst bilgilerde gönderiyorsa, Gateway/proxy'nin bu üst bilgileri koruduğundan emin olun
- `Invalid token`:
  - giden Webhook gizli anahtarı `channels.synology-chat.token` ile eşleşmiyor
  - istek yanlış hesap/Webhook yoluna gidiyor
  - ters proxy, istek OpenClaw'a ulaşmadan önce token üst bilgisini kaldırdı
- `Rate limit exceeded`:
  - aynı kaynaktan çok fazla geçersiz token denemesi, o kaynağı geçici olarak kilitleyebilir
  - kimliği doğrulanmış göndericiler için de ayrıca kullanıcı başına mesaj hız sınırı vardır
- `Allowlist is empty. Configure allowedUserIds or use dmPolicy=open.`:
  - `dmPolicy="allowlist"` etkin ama hiç kullanıcı yapılandırılmamış
- `User not authorized`:
  - gönderenin sayısal `user_id` değeri `allowedUserIds` içinde değil

## İlgili

- [Kanallara Genel Bakış](/tr/channels) — desteklenen tüm kanallar
- [Eşleştirme](/tr/channels/pairing) — DM kimlik doğrulaması ve eşleştirme akışı
- [Gruplar](/tr/channels/groups) — grup sohbeti davranışı ve bahsetme geçidi
- [Kanal Yönlendirme](/tr/channels/channel-routing) — mesajlar için oturum yönlendirme
- [Güvenlik](/tr/gateway/security) — erişim modeli ve sıkılaştırma
