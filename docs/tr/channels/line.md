---
read_when:
    - OpenClaw'ı LINE'a bağlamak istiyorsunuz
    - LINE Webhook + kimlik bilgisi kurulumu gerekiyor
    - LINE'e özgü mesaj seçenekleri istiyorsunuz
summary: LINE Messaging API Plugin kurulumu, yapılandırması ve kullanımı
title: LINE
x-i18n:
    generated_at: "2026-06-28T00:13:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c27572d1db71d1f46b4e6ee68aa03bdbec8f90ed7fb0884f0185ea4aa877468a
    source_path: channels/line.md
    workflow: 16
---

LINE, OpenClaw'a LINE Messaging API üzerinden bağlanır. Plugin, gateway üzerinde bir webhook
alıcısı olarak çalışır ve kimlik doğrulama için kanal erişim token'ınızı + kanal gizlinizi kullanır.

Durum: indirilebilir Plugin. Doğrudan mesajlar, grup sohbetleri, medya, konumlar, Flex
mesajları, şablon mesajları ve hızlı yanıtlar desteklenir. Tepkiler ve iş parçacıkları
desteklenmez.

## Kurulum

Kanalı yapılandırmadan önce LINE'ı kurun:

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
5. Webhook URL'sini gateway uç noktanıza ayarlayın (HTTPS gerekir):

```
https://gateway-host/line/webhook
```

Gateway, LINE'ın webhook doğrulamasına (GET) yanıt verir ve imza ile yük doğrulamasından
hemen sonra imzalı gelen olayları (POST) onaylar; agent işleme eşzamansız olarak devam eder.
Özel bir yola ihtiyacınız varsa `channels.line.webhookPath` veya
`channels.line.accounts.<id>.webhookPath` ayarlayın ve URL'yi buna göre güncelleyin.

Güvenlik notu:

- LINE imza doğrulaması gövdeye bağlıdır (ham gövde üzerinden HMAC), bu nedenle OpenClaw doğrulamadan önce sıkı ön kimlik doğrulama gövde sınırları ve zaman aşımı uygular.
- OpenClaw, webhook olaylarını doğrulanmış ham istek baytlarından işler. Üst katman ara yazılımları tarafından dönüştürülmüş `req.body` değerleri, imza bütünlüğü güvenliği için yok sayılır.

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

Token/gizli dosyaları:

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

Doğrudan mesajlar varsayılan olarak eşleştirmeye ayarlanır. Bilinmeyen gönderenler bir eşleştirme kodu alır ve
onaylanana kadar mesajları yok sayılır.

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

İzin listeleri ve ilkeler:

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: DM'ler için izin listesindeki LINE kullanıcı kimlikleri; `dmPolicy: "open"` için `["*"]` gerekir
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: gruplar için izin listesindeki LINE kullanıcı kimlikleri
- Grup başına geçersiz kılmalar: `channels.line.groups.<groupId>.allowFrom`
- Statik gönderen erişim gruplarına `allowFrom`, `groupAllowFrom` ve grup başına `allowFrom` içinden `accessGroup:<name>` ile başvurulabilir.
- Çalışma zamanı notu: `channels.line` tamamen eksikse, çalışma zamanı grup denetimleri için `groupPolicy="allowlist"` değerine geri döner (`channels.defaults.groupPolicy` ayarlanmış olsa bile).

LINE kimlikleri büyük/küçük harfe duyarlıdır. Geçerli kimlikler şöyle görünür:

- Kullanıcı: `U` + 32 onaltılık karakter
- Grup: `C` + 32 onaltılık karakter
- Oda: `R` + 32 onaltılık karakter

## Mesaj davranışı

- Metin 5000 karakterde parçalara bölünür.
- Markdown biçimlendirmesi kaldırılır; kod blokları ve tablolar mümkün olduğunda Flex
  kartlarına dönüştürülür.
- Akış yanıtları arabelleğe alınır; agent çalışırken LINE tam parçaları bir yükleme
  animasyonuyla alır.
- Medya indirmeleri `channels.line.mediaMaxMb` ile sınırlıdır (varsayılan 10).
- Gelen medya, diğer paketli kanal Plugin'leri tarafından kullanılan paylaşılan medya deposuyla
  eşleşecek şekilde agent'a aktarılmadan önce `~/.openclaw/media/inbound/` altında kaydedilir.

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

LINE, ACP (Agent Communication Protocol) konuşma bağlarını destekler:

- `/acp spawn <agent> --bind here`, mevcut LINE sohbetini bir alt iş parçacığı oluşturmadan bir ACP oturumuna bağlar.
- Yapılandırılmış ACP bağları ve etkin konuşmaya bağlı ACP oturumları, diğer konuşma kanallarında olduğu gibi LINE üzerinde çalışır.

Ayrıntılar için [ACP agent'ları](/tr/tools/acp-agents) bölümüne bakın.

## Giden medya

LINE Plugin'i, agent mesaj aracı üzerinden resim, video ve ses dosyaları göndermeyi destekler. Medya, uygun önizleme ve izleme işleme ile LINE'a özgü teslim yolundan gönderilir:

- **Resimler**: otomatik önizleme oluşturmayla LINE resim mesajları olarak gönderilir.
- **Videolar**: açık önizleme ve içerik türü işleme ile gönderilir.
- **Ses**: LINE ses mesajları olarak gönderilir.

Giden medya URL'leri herkese açık HTTPS URL'leri olmalıdır. OpenClaw, URL'yi LINE'a vermeden önce hedef ana makine adını doğrular ve geri döngü, bağlantı-yerel ve özel ağ hedeflerini reddeder.

Genel medya gönderimleri, LINE'a özgü bir yol mevcut olmadığında mevcut yalnızca resim yoluna geri döner.

## Sorun giderme

- **Webhook doğrulaması başarısız oluyor:** webhook URL'sinin HTTPS olduğundan ve
  `channelSecret` değerinin LINE console ile eşleştiğinden emin olun.
- **Gelen olay yok:** webhook yolunun `channels.line.webhookPath` ile eşleştiğini
  ve gateway'in LINE'dan erişilebilir olduğunu doğrulayın.
- **Medya indirme hataları:** medya varsayılan sınırı aşıyorsa `channels.line.mediaMaxMb` değerini artırın.

## İlgili

- [Kanallara Genel Bakış](/tr/channels) — desteklenen tüm kanallar
- [Eşleştirme](/tr/channels/pairing) — DM kimlik doğrulaması ve eşleştirme akışı
- [Gruplar](/tr/channels/groups) — grup sohbeti davranışı ve bahsetme kapısı
- [Kanal Yönlendirme](/tr/channels/channel-routing) — mesajlar için oturum yönlendirme
- [Güvenlik](/tr/gateway/security) — erişim modeli ve sağlamlaştırma
