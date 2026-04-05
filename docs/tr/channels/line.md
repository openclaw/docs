---
read_when:
    - OpenClaw'ı LINE'a bağlamak istiyorsunuz
    - LINE webhook + kimlik bilgisi kurulumuna ihtiyacınız var
    - LINE'a özgü mesaj seçeneklerini istiyorsunuz
summary: LINE Messaging API plugin kurulumu, yapılandırması ve kullanımı
title: LINE
x-i18n:
    generated_at: "2026-04-05T13:43:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: b4782b2aa3e8654505d7f1fd6fc112adf125b5010fc84d655d033688ded37414
    source_path: channels/line.md
    workflow: 15
---

# LINE

LINE, LINE Messaging API üzerinden OpenClaw'a bağlanır. Plugin, gateway üzerinde bir webhook alıcısı olarak çalışır ve kimlik doğrulama için kanal erişim token'ınız ile kanal secret'ınızı kullanır.

Durum: paketlenmiş plugin. Doğrudan mesajlar, grup sohbetleri, medya, konumlar, Flex mesajları, şablon mesajlar ve hızlı yanıtlar desteklenir. Tepkiler ve diziler desteklenmez.

## Paketlenmiş plugin

LINE, güncel OpenClaw sürümlerinde paketlenmiş bir plugin olarak gelir; bu nedenle normal paketlenmiş derlemelerde ayrı bir kurulum gerekmez.

Eski bir derleme veya LINE'ı dışlayan özel bir kurulum kullanıyorsanız, bunu elle kurun:

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
2. Bir Provider oluşturun (veya var olanı seçin) ve bir **Messaging API** kanalı ekleyin.
3. Kanal ayarlarından **Channel access token** ve **Channel secret** değerlerini kopyalayın.
4. Messaging API ayarlarında **Use webhook** seçeneğini etkinleştirin.
5. Webhook URL'sini gateway uç noktanıza ayarlayın (HTTPS gereklidir):

```
https://gateway-host/line/webhook
```

Gateway, LINE'ın webhook doğrulamasına (GET) ve gelen olaylara (POST) yanıt verir. Özel bir yol gerekiyorsa `channels.line.webhookPath` veya `channels.line.accounts.<id>.webhookPath` ayarlayın ve URL'yi buna göre güncelleyin.

Güvenlik notu:

- LINE imza doğrulaması gövdeye bağlıdır (ham gövde üzerinde HMAC), bu nedenle OpenClaw doğrulamadan önce katı ön kimlik doğrulama gövde sınırları ve zaman aşımı uygular.
- OpenClaw, webhook olaylarını doğrulanmış ham istek baytlarından işler. İmza bütünlüğü güvenliği için yukarı akış ara katmanlarının dönüştürdüğü `req.body` değerleri yok sayılır.

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

`tokenFile` ve `secretFile` normal dosyalara işaret etmelidir. Symlink'ler reddedilir.

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

Doğrudan mesajlar varsayılan olarak eşleştirmeyi kullanır. Bilinmeyen gönderenler bir eşleştirme kodu alır ve onaylanana kadar mesajları yok sayılır.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

İzin listeleri ve politikalar:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: DM'ler için izin verilen LINE kullanıcı kimlikleri
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: Gruplar için izin verilen LINE kullanıcı kimlikleri
- Grup başına geçersiz kılmalar: `channels.line.groups.<groupId>.allowFrom`
- Çalışma zamanı notu: `channels.line` tamamen yoksa, çalışma zamanı grup denetimleri için `groupPolicy="allowlist"` değerine geri döner (`channels.defaults.groupPolicy` ayarlanmış olsa bile).

LINE kimlikleri büyük/küçük harfe duyarlıdır. Geçerli kimlikler şuna benzer:

- Kullanıcı: `U` + 32 onaltılık karakter
- Grup: `C` + 32 onaltılık karakter
- Oda: `R` + 32 onaltılık karakter

## Mesaj davranışı

- Metin 5000 karakterde parçalara bölünür.
- Markdown biçimlendirmesi kaldırılır; kod blokları ve tablolar mümkün olduğunda Flex kartlarına dönüştürülür.
- Akış yanıtları arabelleğe alınır; agent çalışırken LINE tam parçaları bir yükleme animasyonuyla alır.
- Medya indirmeleri `channels.line.mediaMaxMb` ile sınırlandırılır (varsayılan 10).

## Kanal verileri (zengin mesajlar)

Hızlı yanıtlar, konumlar, Flex kartları veya şablon mesajlar göndermek için `channelData.line` kullanın.

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

LINE plugin ayrıca Flex mesaj önayarları için bir `/card` komutuyla gelir:

```
/card info "Welcome" "Thanks for joining!"
```

## ACP desteği

LINE, ACP (Agent Communication Protocol) konuşma bağlarını destekler:

- `/acp spawn <agent> --bind here`, alt dizi oluşturmadan mevcut LINE sohbetini bir ACP oturumuna bağlar.
- Yapılandırılmış ACP bağları ve etkin konuşmaya bağlı ACP oturumları LINE'da diğer konuşma kanallarındaki gibi çalışır.

Ayrıntılar için [ACP agents](/tools/acp-agents) sayfasına bakın.

## Giden medya

LINE plugin, agent mesaj aracı üzerinden görsel, video ve ses dosyaları göndermeyi destekler. Medya, uygun önizleme ve izleme işleme ile LINE'a özgü teslim yolu üzerinden gönderilir:

- **Görseller**: otomatik önizleme oluşturmayla LINE görsel mesajları olarak gönderilir.
- **Videolar**: açık önizleme ve içerik türü işleme ile gönderilir.
- **Ses**: LINE ses mesajları olarak gönderilir.

Genel medya gönderimleri, LINE'a özgü bir yol mevcut olmadığında mevcut yalnızca görsel yoluna geri döner.

## Sorun giderme

- **Webhook doğrulaması başarısız oluyor:** webhook URL'sinin HTTPS olduğundan ve `channelSecret` değerinin LINE console ile eşleştiğinden emin olun.
- **Gelen olay yok:** webhook yolunun `channels.line.webhookPath` ile eşleştiğini ve gateway'in LINE tarafından erişilebilir olduğunu doğrulayın.
- **Medya indirme hataları:** medya varsayılan sınırı aşıyorsa `channels.line.mediaMaxMb` değerini artırın.

## İlgili

- [Kanallara Genel Bakış](/channels) — desteklenen tüm kanallar
- [Eşleştirme](/channels/pairing) — DM kimlik doğrulaması ve eşleştirme akışı
- [Gruplar](/channels/groups) — grup sohbeti davranışı ve bahsetme geçidi
- [Kanal Yönlendirme](/channels/channel-routing) — mesajlar için oturum yönlendirme
- [Güvenlik](/gateway/security) — erişim modeli ve sağlamlaştırma
