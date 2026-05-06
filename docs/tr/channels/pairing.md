---
read_when:
    - DM erişim denetimini ayarlama
    - Yeni bir iOS/Android Node'u eşleştirme
    - OpenClaw güvenlik duruşunu gözden geçirme
summary: 'Eşleştirme genel bakışı: size kimlerin DM gönderebileceğini + hangi Node''ların katılabileceğini onaylayın'
title: Eşleştirme
x-i18n:
    generated_at: "2026-05-06T17:52:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: dcee04ae47bf28caa76c5f6e7218e8b1b24f9ee70bc1b7b65d3f8859797a4645
    source_path: channels/pairing.md
    workflow: 16
---

"Eşleştirme", OpenClaw'ın açık erişim onayı adımıdır.
İki yerde kullanılır:

1. **DM eşleştirme** (botla kimin konuşmasına izin verilir)
2. **Node eşleştirme** (hangi cihazların/Node'ların Gateway ağına katılmasına izin verilir)

Güvenlik bağlamı: [Güvenlik](/tr/gateway/security)

## 1) DM eşleştirme (gelen sohbet erişimi)

Bir kanal `pairing` DM ilkesiyle yapılandırıldığında, bilinmeyen göndericiler kısa bir kod alır ve siz onaylayana kadar mesajları **işlenmez**.

Varsayılan DM ilkeleri burada belgelenmiştir: [Güvenlik](/tr/gateway/security)

`dmPolicy: "open"`, yalnızca etkin DM izin listesi `"*"` içerdiğinde herkese açıktır.
Kurulum ve doğrulama, herkese açık `open` yapılandırmaları için bu joker karakteri gerektirir. Mevcut
durum, somut `allowFrom` girdileriyle birlikte `open` içeriyorsa, çalışma zamanı yine de
yalnızca bu göndericileri kabul eder ve eşleştirme deposu onayları `open` erişimini genişletmez.

Eşleştirme kodları:

- 8 karakter, büyük harf, belirsiz karakter yok (`0O1I`).
- **1 saat sonra süresi dolar**. Bot, eşleştirme mesajını yalnızca yeni bir istek oluşturulduğunda gönderir (gönderici başına yaklaşık saatte bir).
- Bekleyen DM eşleştirme istekleri varsayılan olarak **kanal başına 3** ile sınırlıdır; ek istekler, biri sona erene veya onaylanana kadar yok sayılır.

### Bir göndericiyi onaylama

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Henüz hiçbir komut sahibi yapılandırılmamışsa, bir DM eşleştirme kodunu onaylamak
`commands.ownerAllowFrom` değerini de onaylanan göndericiyle, örneğin `telegram:123456789`
olarak başlatır. Bu, ilk kez yapılan kurulumlara ayrıcalıklı komutlar ve exec
onay istemleri için açık bir sahip verir. Bir sahip var olduktan sonra, sonraki eşleştirme onayları yalnızca DM
erişimi verir; daha fazla sahip eklemez.

Desteklenen kanallar: `bluebubbles`, `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Yeniden kullanılabilir gönderici grupları

Aynı güvenilir gönderici kümesinin birden fazla mesaj kanalına veya hem DM hem de grup izin listelerine
uygulanması gerektiğinde üst düzey `accessGroups` kullanın.

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

`~/.openclaw/credentials/` altında saklanır:

- Bekleyen istekler: `<channel>-pairing.json`
- Onaylanmış izin listesi deposu:
  - Varsayılan hesap: `<channel>-allowFrom.json`
  - Varsayılan olmayan hesap: `<channel>-<accountId>-allowFrom.json`

Hesap kapsamı davranışı:

- Varsayılan olmayan hesaplar yalnızca kendi kapsamlı izin listesi dosyasını okur/yazar.
- Varsayılan hesap, kanal kapsamlı kapsamsız izin listesi dosyasını kullanır.

Bunları hassas kabul edin (asistanınıza erişimi denetlerler).

<Note>
Eşleştirme izin listesi deposu DM erişimi içindir. Grup yetkilendirmesi ayrıdır.
Bir DM eşleştirme kodunu onaylamak, bu göndericinin otomatik olarak grup
komutları çalıştırmasına veya botu gruplarda kontrol etmesine izin vermez. İlk sahip başlatması, `commands.ownerAllowFrom` içinde ayrı bir yapılandırma
durumudur ve grup sohbeti teslimi yine de kanalın grup izin listelerini
(örneğin kanala bağlı olarak `groupAllowFrom`, `groups` veya grup başına
ya da konu başına geçersiz kılmaları) izler.
</Note>

## 2) Node cihaz eşleştirme (iOS/Android/macOS/headless Node'lar)

Node'lar Gateway'e `role: node` ile **cihazlar** olarak bağlanır. Gateway,
onaylanması gereken bir cihaz eşleştirme isteği oluşturur.

### Telegram üzerinden eşleştirme (iOS için önerilir)

`device-pair` Plugin'ini kullanırsanız, ilk kez cihaz eşleştirmesini tamamen Telegram üzerinden yapabilirsiniz:

1. Telegram'da botunuza mesaj gönderin: `/pair`
2. Bot iki mesajla yanıt verir: bir yönerge mesajı ve ayrı bir **kurulum kodu** mesajı (Telegram'da kopyalayıp yapıştırması kolaydır).
3. Telefonunuzda OpenClaw iOS uygulamasını açın → Settings → Gateway.
4. QR kodunu tarayın veya kurulum kodunu yapıştırın ve bağlanın.
5. Telegram'a dönün: `/pair pending` (istek kimliklerini, rolü ve kapsamları gözden geçirin), ardından onaylayın.

Kurulum kodu, şunları içeren base64 kodlu bir JSON yüküdür:

- `url`: Gateway WebSocket URL'si (`ws://...` veya `wss://...`)
- `bootstrapToken`: ilk eşleştirme el sıkışması için kullanılan kısa ömürlü, tek cihazlık başlatma belirteci

Bu başlatma belirteci yerleşik eşleştirme başlatma profilini taşır:

- birincil devredilen `node` belirteci `scopes: []` olarak kalır
- devredilen herhangi bir `operator` belirteci başlatma izin listesiyle sınırlı kalır:
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- başlatma kapsamı denetimleri rol öneklidir, tek bir düz kapsam havuzu değildir:
  operator kapsam girdileri yalnızca operator isteklerini karşılar ve operator olmayan roller
  yine de kendi rol önekleri altında kapsam istemelidir
- sonraki belirteç rotasyonu/iptali hem cihazın onaylanmış
  rol sözleşmesi hem de çağıran oturumun operator kapsamlarıyla sınırlı kalır

Kurulum kodunu geçerli olduğu süre boyunca parola gibi değerlendirin.

Tailscale, herkese açık veya başka uzak mobil eşleştirme için Tailscale Serve/Funnel
veya başka bir `wss://` Gateway URL'si kullanın. Düz metin `ws://` kurulum kodları yalnızca
local loopback, özel LAN adresleri, `.local` Bonjour ana bilgisayarları ve Android
emülatör ana bilgisayarı için kabul edilir. Tailnet CGNAT adresleri, `.ts.net` adları ve herkese açık ana bilgisayarlar, QR/kurulum kodu verilmeden önce yine de güvenli biçimde kapalı kalır.

### Bir Node cihazını onaylama

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Açık bir onay, onaylayan eşleştirilmiş cihaz oturumu yalnızca eşleştirme kapsamıyla
açıldığı için reddedildiğinde CLI aynı isteği `operator.admin` ile yeniden dener.
Bu, mevcut admin yetenekli eşleştirilmiş bir cihazın, `devices/paired.json` dosyasını elle düzenlemeden yeni bir
Control UI/tarayıcı eşleştirmesini kurtarmasını sağlar. Gateway yeniden denenen bağlantıyı yine de doğrular;
`operator.admin` ile kimlik doğrulaması yapamayan belirteçler engelli kalır.

Aynı cihaz farklı kimlik doğrulama ayrıntılarıyla yeniden denerse (örneğin farklı
rol/kapsamlar/açık anahtar), önceki bekleyen istek geçersiz kılınır ve yeni bir
`requestId` oluşturulur.

<Note>
Zaten eşleştirilmiş bir cihaz sessizce daha geniş erişim elde etmez. Daha fazla kapsam veya daha geniş bir rol isteyerek yeniden bağlanırsa, OpenClaw mevcut onayı olduğu gibi tutar ve yeni bir bekleyen yükseltme isteği oluşturur. Onaylamadan önce geçerli onaylanmış erişimi yeni istenen erişimle karşılaştırmak için `openclaw devices list` kullanın.
</Note>

### İsteğe bağlı güvenilir CIDR Node otomatik onayı

Cihaz eşleştirme varsayılan olarak elle yapılır. Sıkı denetlenen Node ağları için,
açık CIDR'ler veya tam IP'lerle ilk kez Node otomatik onayına katılabilirsiniz:

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
Operator, tarayıcı, Control UI ve WebChat istemcileri yine de elle onay gerektirir.
Rol, kapsam, metadata ve açık anahtar değişiklikleri yine de elle onay gerektirir.

### Node eşleştirme durumu saklama

`~/.openclaw/devices/` altında saklanır:

- `pending.json` (kısa ömürlü; bekleyen isteklerin süresi dolar)
- `paired.json` (eşleştirilmiş cihazlar + belirteçler)

### Notlar

- Eski `node.pair.*` API'si (CLI: `openclaw nodes pending|approve|reject|remove|rename`)
  ayrı bir gateway'e ait eşleştirme deposudur. WS Node'ları yine de cihaz eşleştirme gerektirir.
- Eşleştirme kaydı, onaylanmış roller için kalıcı doğruluk kaynağıdır. Etkin
  cihaz belirteçleri bu onaylanmış rol kümesiyle sınırlı kalır; onaylanmış rollerin
  dışındaki başıboş bir belirteç girdisi yeni erişim oluşturmaz.

## İlgili belgeler

- Güvenlik modeli + prompt injection: [Güvenlik](/tr/gateway/security)
- Güvenli güncelleme (doctor çalıştırın): [Güncelleme](/tr/install/updating)
- Kanal yapılandırmaları:
  - Telegram: [Telegram](/tr/channels/telegram)
  - WhatsApp: [WhatsApp](/tr/channels/whatsapp)
  - Signal: [Signal](/tr/channels/signal)
  - BlueBubbles (iMessage): [BlueBubbles](/tr/channels/bluebubbles)
  - iMessage (eski): [iMessage](/tr/channels/imessage)
  - Discord: [Discord](/tr/channels/discord)
  - Slack: [Slack](/tr/channels/slack)
