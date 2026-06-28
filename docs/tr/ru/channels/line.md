---
read_when:
    - OpenClaw'ı LINE'a bağlamak istiyorsunuz
    - LINE Webhook ve kimlik bilgilerini yapılandırmanız gerekir
    - LINE'e özgü mesaj parametrelerine ihtiyacınız var
summary: Plugin LINE Messaging API kurulumu, yapılandırması ve kullanımı
title: LINE
x-i18n:
    generated_at: "2026-06-28T20:45:38Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9a6c76ea64b92b76dd2f6ab0d9fff7eb316e1940ba660d65262307796b5a6abc
    source_path: ru/channels/line.md
    workflow: 16
---

LINE, OpenClaw’a LINE Messaging API üzerinden bağlanır. Plugin, Gateway üzerinde bir Webhook alıcısı olarak çalışır
ve kimlik doğrulama için kanal erişim belirtecinizi + kanal sırrınızı kullanır.

Durum: yüklenebilir Plugin. Kişisel mesajlar, grup sohbetleri, medya, konumlar, Flex
messages, template messages ve hızlı yanıtlar desteklenir. Tepkiler ve iş parçacıkları
desteklenmez.

## Kurulum

Kanalı yapılandırmadan önce LINE’ı kurun:

```bash
openclaw plugins install @openclaw/line
```

Yerel çalışma kopyası (git deposundan çalıştırırken):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## Yapılandırma

1. Bir LINE Developers hesabı oluşturun ve konsolu açın:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Bir Provider oluşturun (veya seçin) ve **Messaging API** kanalı ekleyin.
3. Kanal ayarlarından **Kanal erişim belirteci** ve **Kanal sırrı** değerlerini kopyalayın.
4. Messaging API ayarlarında **Webhook kullan** seçeneğini etkinleştirin.
5. Gateway uç noktanız için Webhook URL’sini ayarlayın (HTTPS gerekir):

```
https://gateway-host/line/webhook
```

Gateway, LINE’ın Webhook doğrulamasına (GET) yanıt verir ve imza ile yük doğrulamasından hemen sonra imzalı
gelen olayları (POST) onaylar; ajan tarafından işleme
eşzamansız olarak devam eder.
Özel bir yol gerekiyorsa `channels.line.webhookPath` veya
`channels.line.accounts.<id>.webhookPath` ayarlayın ve URL’yi buna göre güncelleyin.

Güvenlik notu:

- LINE imza doğrulaması istek gövdesine bağlıdır (işlenmemiş gövde üzerinde HMAC), bu nedenle OpenClaw doğrulamadan önce katı gövde boyutu sınırları ve zaman aşımı uygular.
- OpenClaw, doğrulanmış işlenmemiş istek baytlarından gelen Webhook olaylarını işler. İmza bütünlüğünü korumak için üst zincirdeki ara katman tarafından dönüştürülen `req.body` değerleri yok sayılır.

## Konfigürasyon

En düşük konfigürasyon:

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

Açık kişisel mesaj konfigürasyonu:

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

`tokenFile` ve `secretFile` normal dosyalara işaret etmelidir. Sembolik bağlantılar reddedilir.

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

## Erişim Denetimi

Kişisel mesajlar varsayılan olarak eşleştirme gerektirir. Bilinmeyen gönderenler bir eşleştirme kodu alır ve
onaylanana kadar mesajları yok sayılır.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

İzin listeleri ve ilkeler:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: kişisel mesajlar için izin verilen LINE kullanıcı kimlikleri; `dmPolicy: "open"` için `["*"]` gerekir
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: gruplar için izin verilen LINE kullanıcı kimlikleri
- Grup başına geçersiz kılmalar: `channels.line.groups.<groupId>.allowFrom`
- Statik gönderen erişim gruplarına `allowFrom`, `groupAllowFrom` ve grup `allowFrom` içinden `accessGroup:<name>` ile başvurulabilir.
- Runtime notu: `channels.line` tamamen yoksa runtime, grup denetimleri için `groupPolicy="allowlist"` değerine geri döner (`channels.defaults.groupPolicy` ayarlanmış olsa bile).

LINE kimlikleri büyük/küçük harfe duyarlıdır. Geçerli kimlikler şu biçimdedir:

- Kullanıcı: `U` + 32 onaltılık karakter
- Grup: `C` + 32 onaltılık karakter
- Oda: `R` + 32 onaltılık karakter

## Mesaj Davranışı

- Metin 5000 karakterlik parçalara bölünür.
- Markdown biçimlendirmesi kaldırılır; kod blokları ve tablolar mümkün olduğunda Flex
  kartlarına dönüştürülür.
- Akış yanıtları ara belleğe alınır; ajan çalışırken LINE, yükleme animasyonuyla birlikte tam parçaları
  alır.
- Medya indirme `channels.line.mediaMaxMb` ile sınırlıdır (varsayılan 10).
- Gelen medya, ajana aktarılmadan önce `~/.openclaw/media/inbound/` içine kaydedilir;
  bu, diğer yerleşik kanal Plugin tarafından kullanılan ortak medya depolamasıyla uyumludur.

## Kanal Verileri (Gelişmiş Mesajlar)

Hızlı yanıtlar, konumlar, Flex kartları veya template
messages göndermek için `channelData.line` kullanın.

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

LINE Plugin ayrıca Flex messages ön ayarları için `/card` komutuyla birlikte gelir:

```
/card info "Welcome" "Thanks for joining!"
```

## ACP Desteği

LINE, ACP (Agent Communication Protocol) konuşma bağlamalarını destekler:

- `/acp spawn <agent> --bind here` geçerli LINE sohbetini, alt iş parçacığı oluşturmadan bir ACP oturumuna bağlar.
- Yapılandırılmış ACP bağlamaları ve konuşmaya bağlı etkin ACP oturumları, LINE’da diğer konuşma kanallarında olduğu gibi çalışır.

Ayrıntılar için [ACP ajanları](/tr/tools/acp-agents) bölümüne bakın.

## Giden Medya

LINE Plugin, ajan mesaj aracı üzerinden görsel, video ve ses dosyaları göndermeyi destekler. Medya, uygun önizleme işleme ve izleme ile LINE’a özgü teslim yolundan gönderilir:

- **Görseller**: otomatik önizleme oluşturma ile LINE görsel mesajları olarak gönderilir.
- **Videolar**: açık önizleme ve içerik türü işleme ile gönderilir.
- **Ses**: LINE ses mesajları olarak gönderilir.

Giden medya URL’leri herkese açık HTTPS URL’leri olmalıdır. OpenClaw, URL’yi LINE’a aktarmadan önce hedef ana makine adını denetler ve local loopback, link-local ve özel ağ hedeflerini reddeder.

Genel medya gönderimleri, LINE’a özgü yol kullanılamadığında yalnızca görseller için mevcut rotaya geri döner.

## Sorun Giderme

- **Webhook doğrulaması başarısız oluyor:** Webhook URL’sinin HTTPS kullandığından ve
  `channelSecret` değerinin LINE konsoluyla eşleştiğinden emin olun.
- **Gelen olay yok:** Webhook yolunun `channels.line.webhookPath` ile eşleştiğini
  ve Gateway’in LINE’dan erişilebilir olduğunu doğrulayın.
- **Medya indirme hataları:** Medya varsayılan sınırı aşıyorsa `channels.line.mediaMaxMb` değerini artırın.

## Ayrıca Bakınız

- [Kanallara genel bakış](/tr/channels) — desteklenen tüm kanallar
- [Eşleştirme](/tr/channels/pairing) — kişisel mesaj kimlik doğrulaması ve eşleştirme akışı
- [Gruplar](/tr/channels/groups) — grup sohbeti davranışı ve bahsetme kısıtlaması
- [Kanal yönlendirme](/tr/channels/channel-routing) — mesajlar için oturum yönlendirme
- [Güvenlik](/tr/gateway/security) — erişim modeli ve koruma güçlendirme
