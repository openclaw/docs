---
read_when:
    - OpenClaw'u LINE'a bağlamak istiyorsunuz
    - LINE Webhook ve kimlik bilgileri kurulumu gerekiyor
    - LINE'e özgü mesaj seçenekleri istiyorsunuz
summary: LINE Messaging API Plugin kurulumu, yapılandırması ve kullanımı
title: SATIR
x-i18n:
    generated_at: "2026-05-02T08:47:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7a42afc437140185415347f66a8c0b8eaf7d623a6cc08aedf274121e89cdc3b7
    source_path: channels/line.md
    workflow: 16
---

LINE, LINE Messaging API aracılığıyla OpenClaw'a bağlanır. Plugin, Gateway üzerinde bir Webhook
alıcısı olarak çalışır ve kimlik doğrulama için kanal erişim belirtecinizi + kanal sırrınızı
kullanır.

Durum: indirilebilir Plugin. Doğrudan mesajlar, grup sohbetleri, medya, konumlar, Flex
mesajları, şablon mesajları ve hızlı yanıtlar desteklenir. Tepkiler ve iş parçacıkları
desteklenmez.

## Kurulum

Kanalı yapılandırmadan önce LINE'ı yükleyin:

```bash
openclaw plugins install @openclaw/line
```

Yerel checkout (bir git deposundan çalıştırırken):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## Ayarlama

1. Bir LINE Developers hesabı oluşturun ve Console'u açın:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Bir Provider oluşturun (veya seçin) ve bir **Messaging API** kanalı ekleyin.
3. Kanal ayarlarından **Channel access token** ve **Channel secret** değerlerini kopyalayın.
4. Messaging API ayarlarında **Use webhook** seçeneğini etkinleştirin.
5. Webhook URL'sini Gateway uç noktanız olarak ayarlayın (HTTPS gerekir):

```
https://gateway-host/line/webhook
```

Gateway, LINE'ın Webhook doğrulamasına (GET) ve gelen olaylara (POST) yanıt verir.
Özel bir yola ihtiyacınız varsa `channels.line.webhookPath` veya
`channels.line.accounts.<id>.webhookPath` değerini ayarlayın ve URL'yi buna göre güncelleyin.

Güvenlik notu:

- LINE imza doğrulaması gövdeye bağlıdır (ham gövde üzerinde HMAC), bu nedenle OpenClaw doğrulamadan önce katı kimlik doğrulama öncesi gövde sınırları ve zaman aşımı uygular.
- OpenClaw, Webhook olaylarını doğrulanmış ham istek baytlarından işler. Upstream ara katman tarafından dönüştürülmüş `req.body` değerleri, imza bütünlüğü güvenliği için yok sayılır.

## Yapılandırma

En küçük yapılandırma:

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

Belirteç/sır dosyaları:

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

Doğrudan mesajlar varsayılan olarak eşleştirmeye ayarlıdır. Bilinmeyen gönderenler bir eşleştirme kodu alır ve
onaylanana kadar mesajları yok sayılır.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

İzin listeleri ve ilkeler:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: DM'ler için izin verilen LINE kullanıcı kimlikleri
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: gruplar için izin verilen LINE kullanıcı kimlikleri
- Grup bazında geçersiz kılmalar: `channels.line.groups.<groupId>.allowFrom`
- Çalışma zamanı notu: `channels.line` tamamen eksikse çalışma zamanı, grup denetimleri için `groupPolicy="allowlist"` değerine geri döner (`channels.defaults.groupPolicy` ayarlanmış olsa bile).

LINE kimlikleri büyük/küçük harfe duyarlıdır. Geçerli kimlikler şöyle görünür:

- Kullanıcı: `U` + 32 onaltılık karakter
- Grup: `C` + 32 onaltılık karakter
- Oda: `R` + 32 onaltılık karakter

## Mesaj davranışı

- Metin 5000 karakterde parçalara ayrılır.
- Markdown biçimlendirmesi kaldırılır; kod blokları ve tablolar mümkün olduğunda Flex
  kartlarına dönüştürülür.
- Streaming yanıtlar ara belleğe alınır; agent çalışırken LINE, yükleme
  animasyonuyla birlikte tam parçalar alır.
- Medya indirmeleri `channels.line.mediaMaxMb` ile sınırlandırılır (varsayılan 10).
- Gelen medya, agent'a geçirilmeden önce `~/.openclaw/media/inbound/` altına kaydedilir;
  bu, diğer paketli kanal Plugin'leri tarafından kullanılan paylaşılan medya deposuyla eşleşir.

## Kanal verileri (zengin mesajlar)

Hızlı yanıtlar, konumlar, Flex kartları veya şablon
mesajları göndermek için `channelData.line` kullanın.

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

LINE Plugin ayrıca Flex mesaj ön ayarları için bir `/card` komutuyla birlikte gelir:

```
/card info "Welcome" "Thanks for joining!"
```

## ACP desteği

LINE, ACP (Agent Communication Protocol) konuşma bağlamalarını destekler:

- `/acp spawn <agent> --bind here`, alt iş parçacığı oluşturmadan mevcut LINE sohbetini bir ACP oturumuna bağlar.
- Yapılandırılmış ACP bağlamaları ve etkin konuşmaya bağlı ACP oturumları, diğer konuşma kanallarında olduğu gibi LINE üzerinde çalışır.

Ayrıntılar için [ACP agent'ları](/tr/tools/acp-agents) bölümüne bakın.

## Giden medya

LINE Plugin, agent mesaj aracı üzerinden resim, video ve ses dosyaları göndermeyi destekler. Medya, uygun önizleme ve izleme işleme mantığıyla LINE'a özgü teslim yolu üzerinden gönderilir:

- **Resimler**: otomatik önizleme oluşturmayla LINE resim mesajları olarak gönderilir.
- **Videolar**: açık önizleme ve içerik türü işleme ile gönderilir.
- **Ses**: LINE ses mesajları olarak gönderilir.

Giden medya URL'leri genel HTTPS URL'leri olmalıdır. OpenClaw, URL'yi LINE'a teslim etmeden önce hedef ana makine adını doğrular ve loopback, link-local ve özel ağ hedeflerini reddeder.

Genel medya gönderimleri, LINE'a özgü bir yol kullanılamadığında mevcut yalnızca resim rotasına geri döner.

## Sorun giderme

- **Webhook doğrulaması başarısız oluyor:** Webhook URL'sinin HTTPS olduğundan ve
  `channelSecret` değerinin LINE Console ile eşleştiğinden emin olun.
- **Gelen olay yok:** Webhook yolunun `channels.line.webhookPath` ile eşleştiğini
  ve Gateway'in LINE'dan erişilebilir olduğunu doğrulayın.
- **Medya indirme hataları:** medya varsayılan sınırı aşıyorsa `channels.line.mediaMaxMb`
  değerini yükseltin.

## İlgili

- [Kanallara Genel Bakış](/tr/channels) — desteklenen tüm kanallar
- [Eşleştirme](/tr/channels/pairing) — DM kimlik doğrulaması ve eşleştirme akışı
- [Gruplar](/tr/channels/groups) — grup sohbeti davranışı ve bahsetme kapısı
- [Kanal Yönlendirme](/tr/channels/channel-routing) — mesajlar için oturum yönlendirme
- [Güvenlik](/tr/gateway/security) — erişim modeli ve güçlendirme
