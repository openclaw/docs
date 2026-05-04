---
read_when:
    - DM erişim kontrolünü ayarlama
    - Yeni bir iOS/Android Node'u eşleştirme
    - OpenClaw'un güvenlik duruşunu gözden geçirme
summary: 'Eşleştirme genel bakışı: size kimlerin doğrudan mesaj gönderebileceğini + hangi düğümlerin katılabileceğini onaylayın'
title: Eşleştirme
x-i18n:
    generated_at: "2026-05-04T02:21:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4fb27840f7c9ef55e7270cc29f813e6db90b240aa2180f30952eb9485f0f8874
    source_path: channels/pairing.md
    workflow: 16
---

“Eşleştirme”, OpenClaw’ın açık erişim onayı adımıdır.
İki yerde kullanılır:

1. **DM eşleştirmesi** (botla kimin konuşmasına izin verildiği)
2. **Node eşleştirmesi** (hangi cihazların/Node’ların Gateway ağına katılmasına izin verildiği)

Güvenlik bağlamı: [Güvenlik](/tr/gateway/security)

## 1) DM eşleştirmesi (gelen sohbet erişimi)

Bir kanal `pairing` DM politikasıyla yapılandırıldığında, bilinmeyen gönderenler kısa bir kod alır ve siz onaylayana kadar mesajları **işlenmez**.

Varsayılan DM politikaları burada belgelenmiştir: [Güvenlik](/tr/gateway/security)

`dmPolicy: "open"` yalnızca etkin DM izin listesi `"*"` içerdiğinde herkese açıktır.
Kurulum ve doğrulama, herkese açık `open` yapılandırmaları için bu joker karakteri gerektirir. Mevcut
durum somut `allowFrom` girdileriyle `open` içeriyorsa, çalışma zamanı yine
yalnızca bu gönderenleri kabul eder ve eşleştirme deposu onayları `open` erişimini genişletmez.

Eşleştirme kodları:

- 8 karakter, büyük harf, belirsiz karakter yok (`0O1I`).
- **1 saat sonra süresi dolar**. Bot, eşleştirme mesajını yalnızca yeni bir istek oluşturulduğunda gönderir (gönderen başına yaklaşık saatte bir).
- Bekleyen DM eşleştirme istekleri varsayılan olarak **kanal başına 3** ile sınırlandırılır; ek istekler biri sona erene veya onaylanana kadar yok sayılır.

### Bir göndereni onaylama

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Henüz komut sahibi yapılandırılmamışsa, bir DM eşleştirme kodunu onaylamak
`commands.ownerAllowFrom` değerini de `telegram:123456789` gibi onaylanan gönderene başlatır.
Bu, ilk kurulumlara ayrıcalıklı komutlar ve exec onay istemleri için açık bir sahip verir.
Bir sahip mevcut olduktan sonra, sonraki eşleştirme onayları yalnızca DM
erişimi verir; daha fazla sahip eklemez.

Desteklenen kanallar: `bluebubbles`, `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Yeniden kullanılabilir gönderen grupları

Aynı güvenilir gönderen kümesinin birden fazla mesaj kanalına veya hem DM hem
grup izin listelerine uygulanması gerektiğinde üst düzey `accessGroups` kullanın.

Statik gruplar `type: "message.senders"` kullanır ve kanal izin listelerinden
`accessGroup:<name>` ile referanslanır:

```json5
{
  accessGroups: {
    operators: {
      type: "message.senders",
      members: {
        discord: ["discord:123456789012345678"],
        telegram: ["987654321"],
        whatsapp: ["+15551234567"],
      },
    },
  },
  channels: {
    telegram: { dmPolicy: "allowlist", allowFrom: ["accessGroup:operators"] },
    whatsapp: { groupPolicy: "allowlist", groupAllowFrom: ["accessGroup:operators"] },
  },
}
```

Erişim grupları burada ayrıntılı olarak belgelenmiştir: [Erişim grupları](/tr/channels/access-groups)

### Durumun bulunduğu yer

`~/.openclaw/credentials/` altında depolanır:

- Bekleyen istekler: `<channel>-pairing.json`
- Onaylı izin listesi deposu:
  - Varsayılan hesap: `<channel>-allowFrom.json`
  - Varsayılan olmayan hesap: `<channel>-<accountId>-allowFrom.json`

Hesap kapsamı davranışı:

- Varsayılan olmayan hesaplar yalnızca kendi kapsamlı izin listesi dosyalarını okur/yazar.
- Varsayılan hesap, kanal kapsamlı kapsamlandırılmamış izin listesi dosyasını kullanır.

Bunları hassas kabul edin (asistanınıza erişimi denetlerler).

<Note>
Eşleştirme izin listesi deposu DM erişimi içindir. Grup yetkilendirmesi ayrıdır.
Bir DM eşleştirme kodunu onaylamak, o gönderenin grup komutlarını çalıştırmasına
veya botu gruplarda denetlemesine otomatik olarak izin vermez. İlk sahip başlatması
`commands.ownerAllowFrom` içinde ayrı bir yapılandırma durumudur ve grup sohbeti teslimi yine
kanalın grup izin listelerini izler (örneğin kanala bağlı olarak `groupAllowFrom`, `groups` ya da grup başına
veya konu başına geçersiz kılmalar).
</Note>

## 2) Node cihaz eşleştirmesi (iOS/Android/macOS/başsız Node’lar)

Node’lar Gateway’e `role: node` ile **cihaz** olarak bağlanır. Gateway
onaylanması gereken bir cihaz eşleştirme isteği oluşturur.

### Telegram üzerinden eşleştirme (iOS için önerilir)

`device-pair` Plugin’ini kullanıyorsanız, ilk cihaz eşleştirmesini tamamen Telegram’dan yapabilirsiniz:

1. Telegram’da botunuza mesaj gönderin: `/pair`
2. Bot iki mesajla yanıt verir: bir yönerge mesajı ve ayrı bir **kurulum kodu** mesajı (Telegram’da kopyalaması/yapıştırması kolaydır).
3. Telefonunuzda OpenClaw iOS uygulamasını açın → Ayarlar → Gateway.
4. Kurulum kodunu yapıştırın ve bağlanın.
5. Telegram’a geri dönün: `/pair pending` (istek kimliklerini, rolü ve kapsamları inceleyin), ardından onaylayın.

Kurulum kodu, şunları içeren base64 kodlu bir JSON yüküdür:

- `url`: Gateway WebSocket URL’si (`ws://...` veya `wss://...`)
- `bootstrapToken`: ilk eşleştirme el sıkışması için kullanılan kısa ömürlü tek cihazlık başlangıç token’ı

Bu başlangıç token’ı yerleşik eşleştirme başlangıç profilini taşır:

- birincil devredilen `node` token’ı `scopes: []` olarak kalır
- devredilen herhangi bir `operator` token’ı başlangıç izin listesiyle sınırlı kalır:
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- başlangıç kapsamı denetimleri rol öneklidir, tek düz bir kapsam havuzu değildir:
  operator kapsam girdileri yalnızca operator isteklerini karşılar ve operator olmayan roller
  yine kendi rol önekleri altında kapsam istemelidir
- sonraki token döndürme/iptal işlemleri hem cihazın onaylı rol sözleşmesiyle
  hem de çağıran oturumun operator kapsamlarıyla sınırlı kalır

Kurulum kodunu geçerli olduğu süre boyunca parola gibi değerlendirin.

### Bir Node cihazını onaylama

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Açık bir onay, onaylayan eşleştirilmiş cihaz oturumu yalnızca eşleştirme kapsamıyla
açıldığı için reddedildiğinde, CLI aynı isteği
`operator.admin` ile yeniden dener. Bu, mevcut admin yetkinliğine sahip eşleştirilmiş bir cihazın yeni
Denetim UI’si/tarayıcı eşleştirmesini `devices/paired.json` dosyasını elle düzenlemeden kurtarmasını sağlar.
Gateway yeniden denenen bağlantıyı yine doğrular; `operator.admin` ile kimlik doğrulaması
yapamayan token’lar engelli kalır.

Aynı cihaz farklı kimlik doğrulama ayrıntılarıyla yeniden denerse (örneğin farklı
rol/kapsamlar/açık anahtar), önceki bekleyen istek geçersiz kılınır ve yeni bir
`requestId` oluşturulur.

<Note>
Zaten eşleştirilmiş bir cihaz sessizce daha geniş erişim almaz. Daha fazla kapsam veya daha geniş bir rol isteyerek yeniden bağlanırsa, OpenClaw mevcut onayı olduğu gibi tutar ve yeni bir bekleyen yükseltme isteği oluşturur. Onaylamadan önce şu anda onaylı erişimi yeni istenen erişimle karşılaştırmak için `openclaw devices list` kullanın.
</Note>

### İsteğe bağlı güvenilir CIDR Node otomatik onayı

Cihaz eşleştirmesi varsayılan olarak elle yapılır. Sıkı denetimli Node ağları için,
açık CIDR’ler veya tam IP’lerle ilk Node otomatik onayına dahil olabilirsiniz:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

Bu yalnızca istenen kapsamı olmayan yeni `role: node` eşleştirme istekleri için geçerlidir.
Operator, tarayıcı, Denetim UI’si ve WebChat istemcileri yine elle
onay gerektirir. Rol, kapsam, meta veri ve açık anahtar değişiklikleri yine elle
onay gerektirir.

### Node eşleştirme durumunun depolanması

`~/.openclaw/devices/` altında depolanır:

- `pending.json` (kısa ömürlü; bekleyen isteklerin süresi dolar)
- `paired.json` (eşleştirilmiş cihazlar + token’lar)

### Notlar

- Eski `node.pair.*` API’si (CLI: `openclaw nodes pending|approve|reject|remove|rename`)
  ayrı bir Gateway sahipli eşleştirme deposudur. WS Node’ları yine cihaz eşleştirmesi gerektirir.
- Eşleştirme kaydı, onaylı roller için kalıcı doğruluk kaynağıdır. Etkin
  cihaz token’ları bu onaylı rol kümesiyle sınırlı kalır; onaylı rollerin
  dışındaki başıboş bir token girdisi yeni erişim oluşturmaz.

## İlgili dokümanlar

- Güvenlik modeli + istem enjeksiyonu: [Güvenlik](/tr/gateway/security)
- Güvenli güncelleme (doctor çalıştırın): [Güncelleme](/tr/install/updating)
- Kanal yapılandırmaları:
  - Telegram: [Telegram](/tr/channels/telegram)
  - WhatsApp: [WhatsApp](/tr/channels/whatsapp)
  - Signal: [Signal](/tr/channels/signal)
  - BlueBubbles (iMessage): [BlueBubbles](/tr/channels/bluebubbles)
  - iMessage (eski): [iMessage](/tr/channels/imessage)
  - Discord: [Discord](/tr/channels/discord)
  - Slack: [Slack](/tr/channels/slack)
