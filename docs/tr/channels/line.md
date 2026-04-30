---
read_when:
    - OpenClaw'u LINE'a bağlamak istiyorsunuz
    - LINE Webhook + kimlik bilgisi kurulumu gerekir
    - LINE'a özgü mesaj seçenekleri istiyorsunuz
summary: LINE Messaging API Plugin kurulumu, yapılandırması ve kullanımı
title: SATIR
x-i18n:
    generated_at: "2026-04-30T09:07:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: e9f06d882f1e8d2a758e50459fadefd77796a68c28f63bef5790eb1b540c17d1
    source_path: channels/line.md
    workflow: 16
---

LINE, LINE Messaging API aracılığıyla OpenClaw'a bağlanır. Plugin, Gateway üzerinde bir webhook
alıcısı olarak çalışır ve kimlik doğrulama için channel access token + channel secret
bilgilerinizi kullanır.

Durum: paketle gelen Plugin. Doğrudan mesajlar, grup sohbetleri, medya, konumlar, Flex
mesajları, şablon mesajları ve hızlı yanıtlar desteklenir. Tepkiler ve ileti dizileri
desteklenmez.

## Paketle gelen Plugin

LINE, mevcut OpenClaw sürümlerinde paketle gelen bir Plugin olarak sunulur, bu nedenle normal
paketlenmiş derlemeler ayrı bir kurulum gerektirmez.

Daha eski bir derlemedeyseniz veya LINE'ı hariç tutan özel bir kurulum kullanıyorsanız,
yayınlandığında güncel bir npm paketini yükleyin:

```bash
openclaw plugins install @openclaw/line
```

npm, OpenClaw'a ait paketi kullanımdan kaldırılmış veya eksik olarak bildirirse, npm paket hattı
yetişene kadar güncel paketlenmiş bir OpenClaw derlemesi veya yerel bir checkout kullanın.

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
5. Webhook URL'sini Gateway uç noktanız olarak ayarlayın (HTTPS gereklidir):

```
https://gateway-host/line/webhook
```

Gateway, LINE'ın webhook doğrulamasına (GET) ve gelen etkinliklerine (POST) yanıt verir.
Özel bir yol gerekiyorsa `channels.line.webhookPath` veya
`channels.line.accounts.<id>.webhookPath` ayarlayın ve URL'yi buna göre güncelleyin.

Güvenlik notu:

- LINE imza doğrulaması gövdeye bağlıdır (ham gövde üzerinde HMAC), bu nedenle OpenClaw doğrulama öncesinde katı gövde sınırları ve zaman aşımı uygular.
- OpenClaw, webhook etkinliklerini doğrulanmış ham istek baytlarından işler. İmza bütünlüğü güvenliği için yukarı akış ara katman yazılımı tarafından dönüştürülmüş `req.body` değerleri yok sayılır.

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

Env vars (yalnızca varsayılan hesap):

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

## Erişim denetimi

Doğrudan mesajlar varsayılan olarak eşleştirmeyi kullanır. Bilinmeyen gönderenler bir eşleştirme kodu alır ve
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
- Grup başına geçersiz kılmalar: `channels.line.groups.<groupId>.allowFrom`
- Çalışma zamanı notu: `channels.line` tamamen eksikse, çalışma zamanı grup denetimleri için `groupPolicy="allowlist"` değerine geri döner (`channels.defaults.groupPolicy` ayarlanmış olsa bile).

LINE kimlikleri büyük/küçük harfe duyarlıdır. Geçerli kimlikler şuna benzer:

- Kullanıcı: `U` + 32 onaltılık karakter
- Grup: `C` + 32 onaltılık karakter
- Oda: `R` + 32 onaltılık karakter

## Mesaj davranışı

- Metin 5000 karakterde parçalara ayrılır.
- Markdown biçimlendirmesi kaldırılır; kod blokları ve tablolar mümkün olduğunda Flex
  kartlarına dönüştürülür.
- Akış yanıtları arabelleğe alınır; ajan çalışırken LINE, yükleme
  animasyonuyla birlikte tam parçalar alır.
- Medya indirmeleri `channels.line.mediaMaxMb` ile sınırlandırılır (varsayılan 10).
- Gelen medya, ajana geçirilmeden önce `~/.openclaw/media/inbound/` altında kaydedilir;
  bu, diğer paketle gelen kanal Plugin'leri tarafından kullanılan ortak medya deposuyla
  eşleşir.

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

LINE Plugin'i ayrıca Flex mesaj ön ayarları için bir `/card` komutuyla gelir:

```
/card info "Welcome" "Thanks for joining!"
```

## ACP desteği

LINE, ACP (Agent Communication Protocol) konuşma bağlamalarını destekler:

- `/acp spawn <agent> --bind here`, mevcut LINE sohbetini bir alt ileti dizisi oluşturmadan bir ACP oturumuna bağlar.
- Yapılandırılmış ACP bağlamaları ve etkin konuşmaya bağlı ACP oturumları, diğer konuşma kanallarında olduğu gibi LINE üzerinde çalışır.

Ayrıntılar için [ACP ajanları](/tr/tools/acp-agents) bölümüne bakın.

## Giden medya

LINE Plugin'i, ajan mesaj aracı üzerinden görüntü, video ve ses dosyaları göndermeyi destekler. Medya, uygun önizleme ve izleme işleme ile LINE'a özgü teslim yolu üzerinden gönderilir:

- **Görüntüler**: otomatik önizleme oluşturma ile LINE görüntü mesajları olarak gönderilir.
- **Videolar**: açık önizleme ve içerik türü işleme ile gönderilir.
- **Ses**: LINE ses mesajları olarak gönderilir.

Giden medya URL'leri herkese açık HTTPS URL'leri olmalıdır. OpenClaw, URL'yi LINE'a teslim etmeden önce hedef ana makine adını doğrular ve loopback, link-local ve özel ağ hedeflerini reddeder.

Genel medya gönderimleri, LINE'a özgü bir yol mevcut olmadığında var olan yalnızca görüntü rotasına geri döner.

## Sorun giderme

- **Webhook doğrulaması başarısız oluyor:** webhook URL'sinin HTTPS olduğundan ve
  `channelSecret` değerinin LINE Console ile eşleştiğinden emin olun.
- **Gelen etkinlik yok:** webhook yolunun `channels.line.webhookPath` ile eşleştiğini
  ve Gateway'in LINE tarafından erişilebilir olduğunu doğrulayın.
- **Medya indirme hataları:** medya varsayılan sınırı aşıyorsa `channels.line.mediaMaxMb` değerini yükseltin.

## İlgili

- [Kanallara Genel Bakış](/tr/channels) — desteklenen tüm kanallar
- [Eşleştirme](/tr/channels/pairing) — DM kimlik doğrulaması ve eşleştirme akışı
- [Gruplar](/tr/channels/groups) — grup sohbeti davranışı ve bahsetme kapısı
- [Kanal Yönlendirme](/tr/channels/channel-routing) — mesajlar için oturum yönlendirme
- [Güvenlik](/tr/gateway/security) — erişim modeli ve güçlendirme
