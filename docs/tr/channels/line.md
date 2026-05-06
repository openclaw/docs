---
read_when:
    - OpenClaw'ı LINE'a bağlamak istiyorsunuz
    - LINE Webhook + kimlik bilgisi kurulumu gerekiyor
    - LINE'a özgü mesaj seçenekleri istiyorsunuz
summary: LINE Messaging API Plugin kurulumu, yapılandırması ve kullanımı
title: SATIR
x-i18n:
    generated_at: "2026-05-06T09:03:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: d9d2880bd27e11b72b51ad8a1e8c9e9d41adb51622edf890554594b90d24cd8d
    source_path: channels/line.md
    workflow: 16
---

LINE, LINE Messaging API aracılığıyla OpenClaw'a bağlanır. Plugin, Gateway üzerinde Webhook alıcısı olarak çalışır ve kimlik doğrulama için kanal erişim token'ınızı + kanal secret'ınızı kullanır.

Durum: indirilebilir Plugin. Doğrudan mesajlar, grup sohbetleri, medya, konumlar, Flex mesajları, şablon mesajları ve hızlı yanıtlar desteklenir. Tepkiler ve thread'ler desteklenmez.

## Yükleme

Kanalı yapılandırmadan önce LINE'ı yükleyin:

```bash
openclaw plugins install @openclaw/line
```

Yerel checkout (bir git deposundan çalıştırırken):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## Kurulum

1. Bir LINE Developers hesabı oluşturun ve Console'u açın:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Bir Provider oluşturun (veya seçin) ve bir **Messaging API** kanalı ekleyin.
3. Kanal ayarlarından **Channel access token** ve **Channel secret** değerlerini kopyalayın.
4. Messaging API ayarlarında **Use webhook** seçeneğini etkinleştirin.
5. Webhook URL'sini Gateway endpoint'inize ayarlayın (HTTPS gerekir):

```
https://gateway-host/line/webhook
```

Gateway, LINE'ın Webhook doğrulamasına (GET) ve gelen olaylara (POST) yanıt verir.
Özel bir path gerekiyorsa `channels.line.webhookPath` veya
`channels.line.accounts.<id>.webhookPath` değerini ayarlayın ve URL'yi buna göre güncelleyin.

Güvenlik notu:

- LINE imza doğrulaması gövdeye bağlıdır (ham gövde üzerinde HMAC), bu nedenle OpenClaw doğrulamadan önce sıkı ön kimlik doğrulama gövde limitleri ve zaman aşımı uygular.
- OpenClaw, Webhook olaylarını doğrulanmış ham istek baytlarından işler. İmza bütünlüğü güvenliği için upstream middleware tarafından dönüştürülmüş `req.body` değerleri yok sayılır.

## Yapılandırma

Minimal yapılandırma:

```json5
{
  channels: {
    line: {
      enabled: true,
      channelAccessToken: "LINE_CHANNEL_ACCESS_TOKEN",
      channelSecret: "LINE_CHANNEL_SECRET",
      dmPolicy: "pairing",
    },
  },
}
```

Herkese açık DM yapılandırması:

```json5
{
  channels: {
    line: {
      enabled: true,
      channelAccessToken: "LINE_CHANNEL_ACCESS_TOKEN",
      channelSecret: "LINE_CHANNEL_SECRET",
      dmPolicy: "open",
      allowFrom: ["*"],
    },
  },
}
```

Ortam değişkenleri (yalnızca varsayılan hesap):

- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_CHANNEL_SECRET`

Token/secret dosyaları:

```json5
{
  channels: {
    line: {
      tokenFile: "/path/to/line-token.txt",
      secretFile: "/path/to/line-secret.txt",
    },
  },
}
```

`tokenFile` ve `secretFile` normal dosyaları göstermelidir. Symlink'ler reddedilir.

Birden çok hesap:

```json5
{
  channels: {
    line: {
      accounts: {
        marketing: {
          channelAccessToken: "...",
          channelSecret: "...",
          webhookPath: "/line/marketing",
        },
      },
    },
  },
}
```

## Erişim denetimi

Doğrudan mesajlar varsayılan olarak eşleştirme kullanır. Bilinmeyen gönderenler bir eşleştirme kodu alır ve onaylanana kadar mesajları yok sayılır.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

İzin listeleri ve ilkeler:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: DM'ler için izin verilen LINE kullanıcı kimlikleri; `dmPolicy: "open"` için `["*"]` gerekir
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: gruplar için izin verilen LINE kullanıcı kimlikleri
- Grup başına geçersiz kılmalar: `channels.line.groups.<groupId>.allowFrom`
- Çalışma zamanı notu: `channels.line` tamamen eksikse çalışma zamanı, grup kontrolleri için `groupPolicy="allowlist"` değerine geri döner (`channels.defaults.groupPolicy` ayarlanmış olsa bile).

LINE kimlikleri büyük/küçük harfe duyarlıdır. Geçerli kimlikler şöyle görünür:

- Kullanıcı: `U` + 32 hex karakter
- Grup: `C` + 32 hex karakter
- Oda: `R` + 32 hex karakter

## Mesaj davranışı

- Metin 5000 karakterde parçalara ayrılır.
- Markdown biçimlendirmesi kaldırılır; kod blokları ve tablolar mümkün olduğunda Flex kartlarına dönüştürülür.
- Streaming yanıtlar arabelleğe alınır; agent çalışırken LINE, yükleme animasyonuyla birlikte tam parçaları alır.
- Medya indirmeleri `channels.line.mediaMaxMb` ile sınırlandırılır (varsayılan 10).
- Gelen medya, agent'a iletilmeden önce `~/.openclaw/media/inbound/` altında kaydedilir; bu, diğer paketli kanal Plugin'leri tarafından kullanılan paylaşılan medya deposuyla eşleşir.

## Kanal verileri (zengin mesajlar)

Hızlı yanıtlar, konumlar, Flex kartları veya şablon mesajları göndermek için `channelData.line` kullanın.

```json5
{
  text: "Here you go",
  channelData: {
    line: {
      quickReplies: ["Status", "Help"],
      location: {
        title: "Office",
        address: "123 Main St",
        latitude: 35.681236,
        longitude: 139.767125,
      },
      flexMessage: {
        altText: "Status card",
        contents: {
          /* Flex payload */
        },
      },
      templateMessage: {
        type: "confirm",
        text: "Proceed?",
        confirmLabel: "Yes",
        confirmData: "yes",
        cancelLabel: "No",
        cancelData: "no",
      },
    },
  },
}
```

LINE Plugin'i ayrıca Flex mesaj hazır ayarları için bir `/card` komutuyla gelir:

```
/card info "Welcome" "Thanks for joining!"
```

## ACP desteği

LINE, ACP (Agent Communication Protocol) konuşma bağlamalarını destekler:

- `/acp spawn <agent> --bind here`, bir child thread oluşturmadan mevcut LINE sohbetini bir ACP oturumuna bağlar.
- Yapılandırılmış ACP bağlamaları ve etkin konuşmaya bağlı ACP oturumları, diğer konuşma kanallarında olduğu gibi LINE'da çalışır.

Ayrıntılar için [ACP agent'ları](/tr/tools/acp-agents) bölümüne bakın.

## Giden medya

LINE Plugin'i, agent mesaj aracı üzerinden görüntü, video ve ses dosyaları göndermeyi destekler. Medya, uygun önizleme ve izleme işleme özellikleriyle LINE'a özgü teslimat path'i üzerinden gönderilir:

- **Görüntüler**: otomatik önizleme üretimiyle LINE görüntü mesajları olarak gönderilir.
- **Videolar**: açık önizleme ve içerik türü işleme ile gönderilir.
- **Ses**: LINE ses mesajları olarak gönderilir.

Giden medya URL'leri herkese açık HTTPS URL'leri olmalıdır. OpenClaw, URL'yi LINE'a teslim etmeden önce hedef hostname'i doğrular ve loopback, link-local ve özel ağ hedeflerini reddeder.

Genel medya gönderimleri, LINE'a özgü bir path kullanılamadığında mevcut yalnızca görüntü rotasına geri döner.

## Sorun giderme

- **Webhook doğrulaması başarısız oluyor:** Webhook URL'sinin HTTPS olduğundan ve `channelSecret` değerinin LINE Console ile eşleştiğinden emin olun.
- **Gelen olay yok:** Webhook path'inin `channels.line.webhookPath` ile eşleştiğini ve Gateway'in LINE tarafından erişilebilir olduğunu doğrulayın.
- **Medya indirme hataları:** Medya varsayılan limiti aşıyorsa `channels.line.mediaMaxMb` değerini artırın.

## İlgili

- [Kanallara Genel Bakış](/tr/channels) — desteklenen tüm kanallar
- [Eşleştirme](/tr/channels/pairing) — DM kimlik doğrulaması ve eşleştirme akışı
- [Gruplar](/tr/channels/groups) — grup sohbeti davranışı ve bahsetme geçidi
- [Kanal Yönlendirme](/tr/channels/channel-routing) — mesajlar için oturum yönlendirmesi
- [Güvenlik](/tr/gateway/security) — erişim modeli ve sağlamlaştırma
