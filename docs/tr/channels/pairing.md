---
read_when:
    - DM erişim denetimini ayarlama
    - Yeni bir iOS/Android Node'unu eşleştirme
    - OpenClaw güvenlik duruşunu gözden geçirme
summary: 'Eşleştirmeye genel bakış: sana kimlerin DM gönderebileceğini + hangi Node''ların katılabileceğini onayla'
title: Eşleştirme
x-i18n:
    generated_at: "2026-05-06T09:03:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5543c10868418234714b175cd4bd373818be8dd40327121ac6c44819ed7519b2
    source_path: channels/pairing.md
    workflow: 16
---

“Eşleştirme”, OpenClaw’un açık erişim onayı adımıdır.
İki yerde kullanılır:

1. **DM eşleştirmesi** (bot ile kimin konuşmasına izin verildiği)
2. **Node eşleştirmesi** (hangi cihazların/Node’ların Gateway ağına katılmasına izin verildiği)

Güvenlik bağlamı: [Güvenlik](/tr/gateway/security)

## 1) DM eşleştirmesi (gelen sohbet erişimi)

Bir kanal DM ilkesi `pairing` ile yapılandırıldığında, bilinmeyen gönderenler kısa bir kod alır ve siz onaylayana kadar mesajları **işlenmez**.

Varsayılan DM ilkeleri şurada belgelenmiştir: [Güvenlik](/tr/gateway/security)

`dmPolicy: "open"` yalnızca etkin DM izin listesi `"*"` içerdiğinde herkese açıktır.
Kurulum ve doğrulama, herkese açık yapılandırmalar için bu joker karakteri gerektirir. Mevcut
durum somut `allowFrom` girdileriyle birlikte `open` içeriyorsa, çalışma zamanı yine de
yalnızca bu gönderenleri kabul eder ve eşleştirme deposu onayları `open` erişimini genişletmez.

Eşleştirme kodları:

- 8 karakter, büyük harf, belirsiz karakter yok (`0O1I`).
- **1 saat sonra süresi dolar**. Bot, eşleştirme mesajını yalnızca yeni bir istek oluşturulduğunda gönderir (gönderen başına yaklaşık saatte bir).
- Bekleyen DM eşleştirme istekleri varsayılan olarak **kanal başına 3** ile sınırlıdır; ek istekler biri sona erene veya onaylanana kadar yok sayılır.

### Bir göndereni onaylama

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Henüz komut sahibi yapılandırılmamışsa, bir DM eşleştirme kodunu onaylamak
`commands.ownerAllowFrom` değerini de onaylanan gönderene, örneğin `telegram:123456789`,
önyükler. Bu, ilk kurulumlara ayrıcalıklı komutlar ve exec onayı istemleri için açık
bir sahip verir. Bir sahip oluşturulduktan sonra, sonraki eşleştirme onayları yalnızca DM
erişimi verir; daha fazla sahip eklemez.

Desteklenen kanallar: `bluebubbles`, `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Yeniden kullanılabilir gönderen grupları

Aynı güvenilir gönderen kümesi birden fazla mesaj kanalına veya hem DM hem de grup izin listelerine
uygulanacaksa üst düzey `accessGroups` kullanın.

Statik gruplar `type: "message.senders"` kullanır ve kanal izin listelerinden
`accessGroup:<name>` ile referans verilir:

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

- Varsayılan olmayan hesaplar yalnızca kendi kapsamlı izin listesi dosyalarını okur/yazar.
- Varsayılan hesap, kanal kapsamlı kapsamsız izin listesi dosyasını kullanır.

Bunları hassas olarak ele alın (asistanınıza erişimi kontrol ederler).

<Note>
Eşleştirme izin listesi deposu DM erişimi içindir. Grup yetkilendirmesi ayrıdır.
Bir DM eşleştirme kodunu onaylamak, o gönderene grup komutlarını çalıştırma veya gruplarda
botu kontrol etme iznini otomatik olarak vermez. İlk sahip önyüklemesi, `commands.ownerAllowFrom`
içinde ayrı yapılandırma durumudur ve grup sohbeti teslimi yine de kanalın grup izin listelerini
(örneğin kanala bağlı olarak `groupAllowFrom`, `groups` veya grup başına ya da konu başına
geçersiz kılmaları) izler.
</Note>

## 2) Node cihaz eşleştirmesi (iOS/Android/macOS/başsız Node’lar)

Node’lar Gateway’e `role: node` ile **cihazlar** olarak bağlanır. Gateway
onaylanması gereken bir cihaz eşleştirme isteği oluşturur.

### Telegram üzerinden eşleştirme (iOS için önerilir)

`device-pair` Plugin kullanıyorsanız, ilk cihaz eşleştirmesini tamamen Telegram’dan yapabilirsiniz:

1. Telegram’da botunuza mesaj gönderin: `/pair`
2. Bot iki mesajla yanıt verir: bir yönerge mesajı ve ayrı bir **kurulum kodu** mesajı (Telegram’da kopyalayıp yapıştırması kolaydır).
3. Telefonunuzda OpenClaw iOS uygulamasını açın → Ayarlar → Gateway.
4. QR kodunu tarayın veya kurulum kodunu yapıştırıp bağlanın.
5. Telegram’a geri dönün: `/pair pending` (istek kimliklerini, rolü ve kapsamları gözden geçirin), ardından onaylayın.

Kurulum kodu, şunları içeren base64 kodlu bir JSON yüküdür:

- `url`: Gateway WebSocket URL’si (`ws://...` veya `wss://...`)
- `bootstrapToken`: ilk eşleştirme el sıkışması için kullanılan kısa ömürlü tek cihaz önyükleme belirteci

Bu önyükleme belirteci yerleşik eşleştirme önyükleme profilini taşır:

- devredilen birincil `node` belirteci `scopes: []` olarak kalır
- devredilen herhangi bir `operator` belirteci önyükleme izin listesiyle sınırlı kalır:
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- önyükleme kapsam denetimleri tek bir düz kapsam havuzu değil, rol ön ekli denetimlerdir:
  operator kapsam girdileri yalnızca operator isteklerini karşılar ve operator olmayan roller
  yine de kendi rol ön ekleri altında kapsam istemelidir
- sonraki belirteç döndürme/iptal işlemleri hem cihazın onaylanmış rol sözleşmesiyle
  hem de çağıran oturumun operator kapsamlarıyla sınırlı kalır

Kurulum kodunu geçerli olduğu sürece bir parola gibi ele alın.

Tailscale, herkese açık veya başka bir uzak mobil eşleştirme için Tailscale Serve/Funnel
ya da başka bir `wss://` Gateway URL’si kullanın. Düz metin `ws://` kurulum kodları yalnızca
local loopback, özel LAN adresleri, `.local` Bonjour ana bilgisayarları ve Android
emülatör ana bilgisayarı için kabul edilir. Tailnet CGNAT adresleri, `.ts.net` adları ve herkese açık ana bilgisayarlar,
QR/kurulum kodu verilmeden önce yine kapalı olarak başarısız olur.

### Bir Node cihazını onaylama

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Eşleştirilmiş cihaz oturumu yalnızca eşleştirme kapsamıyla açıldığı için açık bir onay
reddedildiğinde, CLI aynı isteği `operator.admin` ile yeniden dener. Bu, mevcut yönetici yetkili
eşleştirilmiş bir cihazın, `devices/paired.json` dosyasını elle düzenlemeden yeni bir
Control UI/tarayıcı eşleştirmesini kurtarmasını sağlar. Gateway yeniden denenen bağlantıyı
yine doğrular; `operator.admin` ile kimlik doğrulaması yapamayan belirteçler engelli kalır.

Aynı cihaz farklı kimlik doğrulama ayrıntılarıyla (örneğin farklı
rol/kapsamlar/genel anahtar) yeniden denerse, önceki bekleyen istek geçersiz kılınır ve yeni
bir `requestId` oluşturulur.

<Note>
Zaten eşleştirilmiş bir cihaz sessizce daha geniş erişim almaz. Daha fazla kapsam veya daha geniş bir rol isteyerek yeniden bağlanırsa OpenClaw mevcut onayı olduğu gibi tutar ve yeni bir bekleyen yükseltme isteği oluşturur. Onaylamadan önce mevcut onaylanmış erişimi yeni istenen erişimle karşılaştırmak için `openclaw devices list` kullanın.
</Note>

### İsteğe bağlı güvenilir-CIDR Node otomatik onayı

Cihaz eşleştirmesi varsayılan olarak elle yapılır. Sıkı kontrol edilen Node ağları için,
açık CIDR’ler veya kesin IP’lerle ilk kez Node otomatik onayına dahil olabilirsiniz:

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
Operator, tarayıcı, Control UI ve WebChat istemcileri yine de manuel onay gerektirir.
Rol, kapsam, meta veri ve genel anahtar değişiklikleri yine de manuel onay gerektirir.

### Node eşleştirme durumu depolama

`~/.openclaw/devices/` altında saklanır:

- `pending.json` (kısa ömürlü; bekleyen isteklerin süresi dolar)
- `paired.json` (eşleştirilmiş cihazlar + belirteçler)

### Notlar

- Eski `node.pair.*` API’si (CLI: `openclaw nodes pending|approve|reject|remove|rename`)
  ayrı bir Gateway sahipli eşleştirme deposudur. WS Node’ları yine de cihaz eşleştirmesi gerektirir.
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
