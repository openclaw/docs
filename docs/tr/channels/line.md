---
read_when:
    - OpenClaw'ı LINE'a bağlamak istiyorsunuz
    - LINE Webhook + kimlik bilgisi kurulumuna ihtiyacınız var
    - LINE'e özgü mesaj seçenekleri istiyorsunuz
summary: LINE Messaging API Plugin kurulumu, yapılandırması ve kullanımı
title: LINE
x-i18n:
    generated_at: "2026-04-24T08:58:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: a8c3187486033ab01c243f1d44518cad2b28f744a9d0cde1de9117bd26452ed4
    source_path: channels/line.md
    workflow: 15
---

LINE, OpenClaw'a LINE Messaging API üzerinden bağlanır. Plugin, gateway üzerinde bir Webhook
alıcı olarak çalışır ve kimlik doğrulama için kanal erişim belirtecinizi + kanal sırrınızı kullanır.

Durum: paketlenmiş Plugin. Doğrudan mesajlar, grup sohbetleri, medya, konumlar, Flex
mesajları, şablon mesajlar ve hızlı yanıtlar desteklenir. Tepkiler ve ileti dizileri
desteklenmez.

## Paketlenmiş Plugin

LINE, güncel OpenClaw sürümlerinde paketlenmiş bir Plugin olarak gelir; bu nedenle normal
paketlenmiş derlemelerde ayrı bir kurulum gerekmez.

Eski bir derlemeyi veya LINE'ı içermeyen özel bir kurulumu kullanıyorsanız, onu
elle yükleyin:

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
5. Webhook URL'sini gateway uç noktanıza ayarlayın (HTTPS gereklidir):

```
https://gateway-host/line/webhook
```

Gateway, LINE'ın Webhook doğrulamasına (GET) ve gelen olaylarına (POST) yanıt verir.
Özel bir yol gerekiyorsa, `channels.line.webhookPath` veya
`channels.line.accounts.<id>.webhookPath` ayarlayın ve URL'yi buna göre güncelleyin.

Güvenlik notu:

- LINE imza doğrulaması gövdeye bağlıdır (ham gövde üzerinde HMAC), bu nedenle OpenClaw doğrulamadan önce katı ön kimlik doğrulama gövde sınırları ve zaman aşımı uygular.
- OpenClaw, Webhook olaylarını doğrulanmış ham istek baytlarından işler. İmza bütünlüğü güvenliği için üst akış middleware tarafından dönüştürülmüş `req.body` değerleri yok sayılır.

## Yapılandırma

Minimum yapılandırma:

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

Ortam değişkenleri (yalnızca varsayılan hesap):

- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_CHANNEL_SECRET`

Belirteç/gizli dosyaları:

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

`tokenFile` ve `secretFile`, normal dosyalara işaret etmelidir. Sembolik bağlantılar reddedilir.

Birden fazla hesap:

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

Doğrudan mesajlar varsayılan olarak eşleştirmeyi kullanır. Bilinmeyen göndericiler bir
eşleştirme kodu alır ve onaylanana kadar mesajları yok sayılır.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

İzin listeleri ve ilkeler:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: DM'ler için izin verilen LINE kullanıcı kimlikleri
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: gruplar için izin verilen LINE kullanıcı kimlikleri
- Grup başına geçersiz kılmalar: `channels.line.groups.<groupId>.allowFrom`
- Çalışma zamanı notu: `channels.line` tamamen eksikse, çalışma zamanı grup denetimleri için `groupPolicy="allowlist"` değerine geri döner (`channels.defaults.groupPolicy` ayarlı olsa bile).

LINE kimlikleri büyük/küçük harfe duyarlıdır. Geçerli kimlikler şuna benzer:

- Kullanıcı: `U` + 32 hex karakter
- Grup: `C` + 32 hex karakter
- Oda: `R` + 32 hex karakter

## Mesaj davranışı

- Metin 5000 karakterde parçalara ayrılır.
- Markdown biçimlendirmesi kaldırılır; kod blokları ve tablolar mümkün olduğunda Flex
  kartlarına dönüştürülür.
- Akış yanıtları tamponlanır; aracı çalışırken LINE tam parçaları bir yükleme
  animasyonuyla alır.
- Medya indirmeleri `channels.line.mediaMaxMb` ile sınırlandırılır (varsayılan 10).

## Kanal verisi (zengin mesajlar)

Hızlı yanıtlar, konumlar, Flex kartları veya şablon
mesajlar göndermek için `channelData.line` kullanın.

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

LINE Plugin'i ayrıca Flex mesajı önayarları için bir `/card` komutuyla gelir:

```
/card info "Welcome" "Thanks for joining!"
```

## ACP desteği

LINE, ACP (Agent Communication Protocol) konuşma bağlamalarını destekler:

- `/acp spawn <agent> --bind here`, bir alt ileti dizisi oluşturmadan mevcut LINE sohbetini bir ACP oturumuna bağlar.
- Yapılandırılmış ACP bağlamaları ve etkin konuşmaya bağlı ACP oturumları, diğer konuşma kanallarında olduğu gibi LINE üzerinde çalışır.

Ayrıntılar için bkz. [ACP aracıları](/tr/tools/acp-agents).

## Giden medya

LINE Plugin'i, aracı mesaj aracı üzerinden görseller, videolar ve ses dosyaları göndermeyi destekler. Medya, uygun önizleme ve izleme işlemleriyle LINE'a özgü teslimat yolu üzerinden gönderilir:

- **Görseller**: otomatik önizleme üretimiyle LINE görsel mesajları olarak gönderilir.
- **Videolar**: açık önizleme ve içerik türü işleme ile gönderilir.
- **Ses**: LINE ses mesajları olarak gönderilir.

Giden medya URL'leri herkese açık HTTPS URL'leri olmalıdır. OpenClaw, URL'yi LINE'a vermeden önce hedef ana makine adını doğrular ve loopback, link-local ve özel ağ hedeflerini reddeder.

Genel medya gönderimleri, LINE'a özgü bir yol mevcut olmadığında mevcut yalnızca görsel rotasına geri döner.

## Sorun giderme

- **Webhook doğrulaması başarısız oluyor:** Webhook URL'sinin HTTPS olduğundan ve
  `channelSecret` değerinin LINE konsoluyla eşleştiğinden emin olun.
- **Gelen olay yok:** Webhook yolunun `channels.line.webhookPath`
  ile eşleştiğini ve gateway'in LINE tarafından erişilebilir olduğunu doğrulayın.
- **Medya indirme hataları:** medya varsayılan sınırı aşıyorsa `channels.line.mediaMaxMb` değerini
  yükseltin.

## İlgili

- [Kanallara Genel Bakış](/tr/channels) — desteklenen tüm kanallar
- [Eşleştirme](/tr/channels/pairing) — DM kimlik doğrulaması ve eşleştirme akışı
- [Gruplar](/tr/channels/groups) — grup sohbeti davranışı ve bahsetme geçitlemesi
- [Kanal Yönlendirme](/tr/channels/channel-routing) — mesajlar için oturum yönlendirmesi
- [Güvenlik](/tr/gateway/security) — erişim modeli ve sağlamlaştırma
