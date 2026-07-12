---
read_when:
    - OpenClaw'u LINE'a bağlamak istiyorsunuz
    - LINE Webhook + kimlik bilgileri kurulumu gereklidir
    - LINE'a özgü mesaj seçenekleri istiyorsunuz
summary: LINE Messaging API Plugin kurulumu, yapılandırması ve kullanımı
title: LINE
x-i18n:
    generated_at: "2026-07-12T12:03:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ee5931c2bfca4a67a8b390f300907cd31a074988b10c6c0540444cff0bfde334
    source_path: channels/line.md
    workflow: 16
---

LINE, LINE Messaging API aracılığıyla OpenClaw'a bağlanır. Plugin, Gateway üzerinde bir Webhook
alıcısı olarak çalışır ve kimlik doğrulama için kanal erişim belirtecinizi + kanal gizli anahtarınızı
kullanır.

Durum: Ayrı olarak kurulan resmî Plugin. Doğrudan mesajlar, grup sohbetleri, medya,
konumlar, Flex mesajları, şablon mesajları ve hızlı yanıtlar desteklenir.
Tepkiler ve ileti dizileri desteklenmez.

## Kurulum

Kanalı yapılandırmadan önce LINE'ı kurun:

```bash
openclaw plugins install @openclaw/line
```

Yerel çalışma kopyası (bir git deposundan çalıştırırken):

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## Ayarlama

1. Bir LINE Developers hesabı oluşturun ve Console'u açın:
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. Bir Provider oluşturun (veya seçin) ve bir **Messaging API** kanalı ekleyin.
3. Kanal ayarlarından **Channel access token** ve **Channel secret** değerlerini kopyalayın.
4. Messaging API ayarlarında **Use webhook** seçeneğini etkinleştirin.
5. Webhook URL'sini Gateway uç noktanız olarak ayarlayın (HTTPS gereklidir):

```text
https://gateway-host/line/webhook
```

Gateway, LINE'ın Webhook doğrulamasını (GET) yanıtlar ve imza ile veri yükü
doğrulamasının hemen ardından imzalı gelen olayları (POST) kabul eder; agent
işlemesi eşzamansız olarak devam eder.
Özel bir yola ihtiyacınız varsa `channels.line.webhookPath` veya
`channels.line.accounts.<id>.webhookPath` değerini ayarlayın ve URL'yi buna göre güncelleyin.

Güvenlik notları:

- LINE imza doğrulaması gövdeye bağlıdır (ham gövde üzerinden HMAC), bu nedenle OpenClaw doğrulamadan önce katı bir kimlik doğrulama öncesi gövde sınırı (64 KB) ve okuma zaman aşımı uygular.
- OpenClaw, Webhook olaylarını doğrulanmış ham istek baytlarından işler. Üst katman ara yazılımı tarafından dönüştürülen `req.body` değerleri, imza bütünlüğü güvenliği için yok sayılır.

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

Belirteç/gizli anahtar dosyaları:

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
Satır içi yapılandırma değerleri dosyalara göre önceliklidir; ortam değişkenleri varsayılan hesap için son geri dönüş seçeneğidir.

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

Doğrudan mesajlar varsayılan olarak eşleştirmeyi kullanır. Bilinmeyen gönderenler bir eşleştirme
kodu alır ve onaylanana kadar mesajları yok sayılır:

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

İzin listeleri ve ilkeler:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled` (varsayılan `pairing`)
- `channels.line.allowFrom`: DM'ler için izin listesindeki LINE kullanıcı kimlikleri; `dmPolicy: "open"` için `["*"]` gereklidir
- `channels.line.groupPolicy`: `allowlist | open | disabled` (varsayılan `allowlist`)
- `channels.line.groupAllowFrom`: gruplar için izin listesindeki LINE kullanıcı kimlikleri
- Grup başına geçersiz kılmalar: `channels.line.groups.<groupId>.allowFrom` (ayrıca `enabled`, `requireMention`, `systemPrompt`, `skills`)
- Statik gönderen erişim gruplarına `allowFrom`, `groupAllowFrom` ve grup başına `allowFrom` içinden `accessGroup:<name>` ile başvurulabilir; bkz. [Erişim grupları](/tr/channels/access-groups).
- Çalışma zamanı notu: `channels.line` tamamen eksikse çalışma zamanı, grup denetimleri için (`channels.defaults.groupPolicy` ayarlanmış olsa bile) `groupPolicy="allowlist"` değerine geri döner.

LINE kimlikleri büyük/küçük harfe duyarlıdır. Geçerli kimlikler şu biçimdedir:

- Kullanıcı: `U` + 32 onaltılık karakter
- Grup: `C` + 32 onaltılık karakter
- Oda: `R` + 32 onaltılık karakter

## Mesaj davranışı

- Metin, 5000 karakterlik parçalara bölünür.
- Markdown biçimlendirmesi kaldırılır; kod blokları ve tablolar mümkün olduğunda Flex
  kartlarına dönüştürülür.
- Akış yanıtları arabelleğe alınır; agent çalışırken LINE, bir yükleme
  animasyonuyla tam parçaları alır.
- Medya indirmeleri `channels.line.mediaMaxMb` ile sınırlandırılır (varsayılan 10).
- Gelen medya, diğer kanal Plugin'lerinin kullandığı ortak medya deposuyla uyumlu şekilde
  agent'a iletilmeden önce `~/.openclaw/media/inbound/` altına kaydedilir.

## Kanal verileri (zengin mesajlar)

Hızlı yanıtlar, konumlar, Flex kartları veya şablon mesajları göndermek için
`channelData.line` kullanın.

```json5
{
  text: "İşte burada",
  channelData: {
    line: {
      quickReplies: ["Durum", "Yardım"],
      location: {
        title: "Ofis",
        address: "123 Ana Cadde",
        latitude: 35.681236,
        longitude: 139.767125,
      },
      flexMessage: {
        altText: "Durum kartı",
        contents: {/* Flex veri yükü */},
      },
      templateMessage: {
        type: "confirm",
        text: "Devam edilsin mi?",
        confirmLabel: "Evet",
        confirmData: "yes",
        cancelLabel: "Hayır",
        cancelData: "no",
      },
    },
  },
}
```

LINE Plugin'i ayrıca Flex mesajı ön ayarları için bir `/card` komutuyla gelir:

```text
/card info "Hoş geldiniz" "Katıldığınız için teşekkürler!"
```

## ACP desteği

LINE, ACP (Agent İletişim Protokolü) konuşma bağlamalarını destekler:

- `/acp spawn <agent> --bind here`, bir alt ileti dizisi oluşturmadan mevcut LINE sohbetini bir ACP oturumuna bağlar.
- Yapılandırılmış ACP bağlamaları ve konuşmaya bağlı etkin ACP oturumları, diğer konuşma kanallarında olduğu gibi LINE'da da çalışır.

Ayrıntılar için [ACP agent'ları](/tr/tools/acp-agents) bölümüne bakın.

## Giden medya

LINE Plugin'i, agent mesaj aracı üzerinden görüntü, video ve ses gönderir:

- **Görüntüler**: LINE görüntü mesajları olarak gönderilir; önizleme görüntüsü varsayılan olarak medya URL'sini kullanır.
- **Videolar**: Bir önizleme görüntüsü gerektirir; `channelData.line.previewImageUrl` değerini bir görüntü URL'si olarak ayarlayın.
- **Ses**: LINE ses mesajları olarak gönderilir; `channelData.line.durationMs` ayarlanmadığı sürece süre varsayılan olarak 60 saniyedir.

Medya türü, ayarlanmışsa `channelData.line.mediaKind` değerinden alınır; aksi takdirde
diğer LINE seçeneklerinden veya URL dosya uzantısından çıkarılır ve geri dönüş olarak görüntü kullanılır.

Giden medya URL'leri, en fazla 2000 karakter uzunluğunda, herkese açık HTTPS URL'leri olmalıdır. OpenClaw,
URL'yi LINE'a vermeden önce hedef ana bilgisayar adını doğrular ve local loopback,
bağlantı-yerel ve özel ağ hedeflerini reddeder.

LINE'a özgü seçenekler olmadan yapılan genel medya gönderimleri görüntü yolunu kullanır.

## Sorun giderme

- **Webhook doğrulaması başarısız oluyor:** Webhook URL'sinin HTTPS kullandığından ve
  `channelSecret` değerinin LINE Console ile eşleştiğinden emin olun.
- **Gelen olay yok:** Webhook yolunun `channels.line.webhookPath` ile eşleştiğini
  ve Gateway'e LINE'dan erişilebildiğini doğrulayın.
- **Medya indirme hataları:** Medya varsayılan sınırı aşıyorsa
  `channels.line.mediaMaxMb` değerini yükseltin.

## İlgili

- [Kanallara genel bakış](/tr/channels) — desteklenen tüm kanallar
- [Eşleştirme](/tr/channels/pairing) — DM kimlik doğrulaması ve eşleştirme akışı
- [Gruplar](/tr/channels/groups) — grup sohbeti davranışı ve bahsetme koşulu
- [Kanal yönlendirme](/tr/channels/channel-routing) — mesajlar için oturum yönlendirmesi
- [Güvenlik](/tr/gateway/security) — erişim modeli ve güçlendirme
