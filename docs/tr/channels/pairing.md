---
read_when:
    - DM erişim denetimini ayarlama
    - Yeni bir iOS/Android Node'u eşleştirme
    - OpenClaw güvenlik duruşunu gözden geçirme
summary: 'Eşleştirme genel bakışı: size kimlerin DM gönderebileceğini + hangi düğümlerin katılabileceğini onaylayın'
title: Eşleştirme
x-i18n:
    generated_at: "2026-07-04T18:17:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e9c6508b8fd991f3a61ce026d1d453364de566a5b1373a6311ad24f43dcdb267
    source_path: channels/pairing.md
    workflow: 16
---

"Eşleştirme", OpenClaw'ın açık erişim onayı adımıdır.
İki yerde kullanılır:

1. **DM eşleştirme** (botla kimin konuşmasına izin verilir)
2. **Node eşleştirme** (hangi cihazların/node'ların Gateway ağına katılmasına izin verilir)

Güvenlik bağlamı: [Güvenlik](/tr/gateway/security)

## 1) DM eşleştirme (gelen sohbet erişimi)

Bir kanal DM ilkesi `pairing` ile yapılandırıldığında, bilinmeyen gönderenlere kısa bir kod verilir ve siz onaylayana kadar iletileri **işlenmez**.

Varsayılan DM ilkeleri şurada belgelenmiştir: [Güvenlik](/tr/gateway/security)

`dmPolicy: "open"` yalnızca etkin DM izin listesi `"*"` içerdiğinde herkese açıktır.
Kurulum ve doğrulama, herkese açık-open yapılandırmalar için bu joker karakteri gerektirir. Mevcut
durum `open` ile somut `allowFrom` girdileri içeriyorsa, çalışma zamanı yine de
yalnızca bu gönderenleri kabul eder ve eşleştirme deposu onayları `open` erişimini genişletmez.

Eşleştirme kodları:

- 8 karakter, büyük harf, belirsiz karakter yok (`0O1I`).
- **1 saat sonra süresi dolar**. Bot, eşleştirme iletisini yalnızca yeni bir istek oluşturulduğunda gönderir (gönderen başına yaklaşık saatte bir).
- Bekleyen DM eşleştirme istekleri varsayılan olarak **kanal başına 3** ile sınırlıdır; ek istekler biri sona erene veya onaylanana kadar yok sayılır.

### Bir göndereni onaylama

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Henüz komut sahibi yapılandırılmadıysa, bir DM eşleştirme kodunu onaylamak
`commands.ownerAllowFrom` değerini de onaylanan gönderenle başlatır; örneğin `telegram:123456789`.
Bu, ilk kurulumlara ayrıcalıklı komutlar ve exec onay istemleri için açık bir sahip verir.
Bir sahip var olduktan sonra, sonraki eşleştirme onayları yalnızca DM
erişimi verir; daha fazla sahip eklemez.

Desteklenen kanallar: `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Yeniden kullanılabilir gönderen grupları

Aynı güvenilen gönderen kümesinin birden fazla ileti kanalına veya hem DM hem de grup izin listelerine
uygulanması gerektiğinde üst düzey `accessGroups` kullanın.

Statik gruplar `type: "message.senders"` kullanır ve kanal izin listelerinden
`accessGroup:<name>` ile başvurulur:

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

### Durumun yaşadığı yer

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
Bir DM eşleştirme kodunu onaylamak, o gönderenin grup komutları çalıştırmasına
veya gruplarda botu denetlemesine otomatik olarak izin vermez. İlk sahip başlatması,
`commands.ownerAllowFrom` içinde ayrı bir yapılandırma durumudur ve grup sohbeti teslimi yine de
kanalın grup izin listelerini izler (örneğin kanala bağlı olarak `groupAllowFrom`, `groups` veya grup başına
ya da konu başına geçersiz kılmalar).
</Note>

## 2) Node cihaz eşleştirme (iOS/Android/macOS/headless node'lar)

Node'lar Gateway'e `role: node` ile **cihazlar** olarak bağlanır. Gateway,
onaylanması gereken bir cihaz eşleştirme isteği oluşturur.

### Control UI'dan eşleştirme (önerilir)

`operator.admin` erişimi olan zaten bağlı bir Control UI oturumu kullanın:

1. Control UI'ı açın ve **Node'lar** öğesini seçin.
2. **Cihazlar** içinde **Mobil cihazı eşleştir** öğesine tıklayın.
3. Telefonunuzda OpenClaw uygulamasını açın → **Ayarlar** → **Gateway**.
4. QR kodunu tarayın veya kurulum kodunu yapıştırın, ardından bağlanın.

Resmi OpenClaw iOS ve Android uygulamaları, kurulum kodu meta verileri eşleştiğinde
otomatik olarak onaylanır. **Cihazlar** bekleyen bir istek gösteriyorsa (örneğin
resmi olmayan bir istemci veya eşleşmeyen meta veriler için), onaylamadan önce rolünü ve
kapsamlarını gözden geçirin.

Geçerli Control UI oturumunda yönetici erişimi olmadığında düğme devre dışı bırakılır.
Bu durumda Gateway ana makinesinden aşağıdaki CLI onay akışını kullanın.

### Telegram üzerinden eşleştirme

`device-pair` Plugin'ini kullanıyorsanız, ilk cihaz eşleştirmesini tamamen Telegram'dan yapabilirsiniz:

1. Telegram'da botunuza şu iletiyi gönderin: `/pair`
2. Bot iki iletiyle yanıt verir: bir yönerge iletisi ve ayrı bir **kurulum kodu** iletisi (Telegram'da kopyalayıp yapıştırması kolaydır).
3. Telefonunuzda OpenClaw iOS uygulamasını açın → Ayarlar → Gateway.
4. QR kodunu tarayın veya kurulum kodunu yapıştırın ve bağlanın.
5. Resmi mobil uygulama otomatik olarak bağlanır. `/pair pending` bir
   istek gösteriyorsa, onaylamadan önce rolünü ve kapsamlarını gözden geçirin.

Kurulum kodu, şunları içeren base64 kodlu bir JSON yüküdür:

- `url`: Gateway WebSocket URL'si (`ws://...` veya `wss://...`)
- `bootstrapToken`: ilk eşleştirme el sıkışması için kullanılan kısa ömürlü, tek cihazlık bootstrap token'ı

Bu bootstrap token'ı yerleşik eşleştirme bootstrap profilini taşır:

- yerleşik kurulum profili yalnızca yeni QR/kurulum kodu temelini izin verir:
  `node` ve sınırlı bir `operator` devri
- devredilen `node` token'ı `scopes: []` olarak kalır
- devredilen `operator` token'ı `operator.approvals`,
  `operator.read`, `operator.talk.secrets` ve `operator.write` ile sınırlıdır
- `operator.admin`, QR/kurulum kodu bootstrap'i tarafından verilmez; ayrı bir
  onaylanmış operator eşleştirmesi veya token akışı gerektirir
- sonraki token döndürme/iptal etme işlemleri hem cihazın onaylanmış
  rol sözleşmesi hem de çağıran oturumun operator kapsamları ile sınırlı kalır

Kurulum kodunu geçerli olduğu süre boyunca parola gibi değerlendirin.

Tailscale, herkese açık veya diğer uzaktan mobil eşleştirme için Tailscale Serve/Funnel
veya başka bir `wss://` Gateway URL'si kullanın. Düz metin `ws://` kurulum kodları yalnızca
loopback, özel LAN adresleri, `.local` Bonjour ana makineleri ve Android
emülatör ana makinesi için kabul edilir. Tailnet CGNAT adresleri, `.ts.net` adları ve herkese açık ana makineler QR/kurulum kodu verilmeden önce
kapalı şekilde başarısız olur.

### Bir node cihazını onaylama

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Açık bir onay, onaylayan eşleştirilmiş cihaz oturumu yalnızca eşleştirme kapsamıyla
açıldığı için reddedildiğinde, CLI aynı isteği
`operator.admin` ile yeniden dener. Bu, mevcut yönetici yetenekli eşleştirilmiş bir cihazın
`devices/paired.json` dosyasını elle düzenlemeden yeni bir Control UI/tarayıcı eşleştirmesini kurtarmasını sağlar.
Gateway yine de yeniden denenen bağlantıyı doğrular; `operator.admin` ile kimlik doğrulaması yapamayan
token'lar engelli kalır.

Aynı cihaz farklı kimlik doğrulama ayrıntılarıyla yeniden denerse (örneğin farklı
rol/kapsamlar/genel anahtar), önceki bekleyen istek geçersiz kılınır ve yeni bir
`requestId` oluşturulur.

<Note>
Zaten eşleştirilmiş bir cihaz sessizce daha geniş erişim almaz. Daha fazla kapsam veya daha geniş bir rol isteyerek yeniden bağlanırsa, OpenClaw mevcut onayı olduğu gibi korur ve yeni bir bekleyen yükseltme isteği oluşturur. Onaylamadan önce şu anda onaylanmış erişimi yeni istenen erişimle karşılaştırmak için `openclaw devices list` kullanın.
</Note>

### İsteğe bağlı güvenilen-CIDR node otomatik onayı

Cihaz eşleştirme varsayılan olarak elle yapılır. Sıkı denetimli node ağları için,
açık CIDR'ler veya tam IP'lerle ilk node otomatik onayına katılabilirsiniz:

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
Operator, tarayıcı, Control UI ve WebChat istemcileri hâlâ elle
onay gerektirir. Rol, kapsam, meta veri ve genel anahtar değişiklikleri de hâlâ elle
onay gerektirir.

### Node eşleştirme durum depolaması

`~/.openclaw/devices/` altında saklanır:

- `pending.json` (kısa ömürlü; bekleyen isteklerin süresi dolar)
- `paired.json` (eşleştirilmiş cihazlar + token'lar)

### Notlar

- Eski `node.pair.*` API'si (CLI: `openclaw nodes pending|approve|reject|remove|rename`)
  ayrı, gateway sahipli bir eşleştirme deposudur. WS node'ları yine de cihaz eşleştirmesi gerektirir.
- Eşleştirme kaydı, onaylanmış roller için kalıcı doğruluk kaynağıdır. Etkin
  cihaz token'ları o onaylanmış rol kümesiyle sınırlı kalır; onaylanmış rollerin dışındaki başıboş bir token girdisi
  yeni erişim oluşturmaz.

## İlgili belgeler

- Güvenlik modeli + prompt injection: [Güvenlik](/tr/gateway/security)
- Güvenli güncelleme (doctor çalıştırın): [Güncelleme](/tr/install/updating)
- Kanal yapılandırmaları:
  - Telegram: [Telegram](/tr/channels/telegram)
  - WhatsApp: [WhatsApp](/tr/channels/whatsapp)
  - Signal: [Signal](/tr/channels/signal)
  - iMessage: [iMessage](/tr/channels/imessage)
  - Discord: [Discord](/tr/channels/discord)
  - Slack: [Slack](/tr/channels/slack)
