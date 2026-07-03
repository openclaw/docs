---
read_when:
    - DM erişim denetimini ayarlama
    - Yeni bir iOS/Android düğümünü eşleştirme
    - OpenClaw güvenlik duruşunu gözden geçirme
summary: 'Eşleştirme genel bakışı: Size kimlerin DM gönderebileceğini + hangi node''ların katılabileceğini onaylayın'
title: Eşleştirme
x-i18n:
    generated_at: "2026-07-03T17:38:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c62f42116b71467576b2c1e005fa2e606a3d0f40cbf7b92fc4a7dd47c8f0568e
    source_path: channels/pairing.md
    workflow: 16
---

"Eşleme", OpenClaw'ın açık erişim onayı adımıdır.
İki yerde kullanılır:

1. **DM eşleme** (botla kimin konuşmasına izin verildiği)
2. **Node eşleme** (hangi cihazların/node'ların Gateway ağına katılmasına izin verildiği)

Güvenlik bağlamı: [Güvenlik](/tr/gateway/security)

## 1) DM eşleme (gelen sohbet erişimi)

Bir kanal DM ilkesi `pairing` ile yapılandırıldığında, bilinmeyen gönderenler kısa bir kod alır ve siz onaylayana kadar iletileri **işlenmez**.

Varsayılan DM ilkeleri şurada belgelenmiştir: [Güvenlik](/tr/gateway/security)

`dmPolicy: "open"` yalnızca etkili DM izin listesi `"*"` içerdiğinde herkese açıktır.
Kurulum ve doğrulama, herkese açık yapılandırmalar için bu joker karakteri gerektirir. Mevcut
durum, somut `allowFrom` girdileriyle `open` içeriyorsa, çalışma zamanı yine de
yalnızca bu gönderenleri kabul eder ve eşleme deposu onayları `open` erişimini genişletmez.

Eşleme kodları:

- 8 karakter, büyük harf, belirsiz karakter yok (`0O1I`).
- **1 saat sonra sona erer**. Bot eşleme iletisini yalnızca yeni bir istek oluşturulduğunda gönderir (gönderen başına yaklaşık saatte bir).
- Bekleyen DM eşleme istekleri varsayılan olarak **kanal başına 3** ile sınırlıdır; ek istekler biri sona erene veya onaylanana kadar yok sayılır.

### Göndereni onaylama

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Henüz hiçbir komut sahibi yapılandırılmamışsa, bir DM eşleme kodunu onaylamak
`commands.ownerAllowFrom` değerini de onaylanan gönderenle başlatır; örneğin `telegram:123456789`.
Bu, ilk kurulumlara ayrıcalıklı komutlar ve exec onay istemleri için açık bir sahip verir.
Bir sahip mevcut olduktan sonra sonraki eşleme onayları yalnızca DM erişimi verir;
daha fazla sahip eklemez.

Desteklenen kanallar: `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Yeniden kullanılabilir gönderen grupları

Aynı güvenilir gönderen kümesi birden çok ileti kanalına veya hem DM hem de grup
izin listelerine uygulanacaksa üst düzey `accessGroups` kullanın.

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

### Durumun bulunduğu yer

`~/.openclaw/credentials/` altında depolanır:

- Bekleyen istekler: `<channel>-pairing.json`
- Onaylanmış izin listesi deposu:
  - Varsayılan hesap: `<channel>-allowFrom.json`
  - Varsayılan olmayan hesap: `<channel>-<accountId>-allowFrom.json`

Hesap kapsamı davranışı:

- Varsayılan olmayan hesaplar yalnızca kendi kapsamlı izin listesi dosyasını okur/yazar.
- Varsayılan hesap, kanal kapsamlı kapsamsız izin listesi dosyasını kullanır.

Bunları hassas kabul edin (asistanınıza erişimi denetlerler).

<Note>
Eşleme izin listesi deposu DM erişimi içindir. Grup yetkilendirmesi ayrıdır.
Bir DM eşleme kodunu onaylamak, bu gönderenin otomatik olarak grup komutlarını
çalıştırmasına veya gruplarda botu denetlemesine izin vermez. İlk sahip başlatması
`commands.ownerAllowFrom` içinde ayrı bir yapılandırma durumudur ve grup sohbet teslimi yine de
kanalın grup izin listelerini izler (örneğin kanala bağlı olarak `groupAllowFrom`,
`groups` ya da grup veya konu başına geçersiz kılmalar).
</Note>

## 2) Node cihaz eşleme (iOS/Android/macOS/headless node'lar)

Node'lar Gateway'e `role: node` değerine sahip **cihazlar** olarak bağlanır. Gateway,
onaylanması gereken bir cihaz eşleme isteği oluşturur.

### Telegram üzerinden eşleme (iOS için önerilir)

`device-pair` Plugin'ini kullanıyorsanız, ilk cihaz eşlemesini tamamen Telegram üzerinden yapabilirsiniz:

1. Telegram'da botunuza ileti gönderin: `/pair`
2. Bot iki iletiyle yanıt verir: bir yönerge iletisi ve ayrı bir **kurulum kodu** iletisi (Telegram'da kopyalayıp yapıştırması kolaydır).
3. Telefonunuzda OpenClaw iOS uygulamasını açın → Settings → Gateway.
4. QR kodunu tarayın veya kurulum kodunu yapıştırıp bağlanın.
5. Tekrar Telegram'da: `/pair pending` (istek kimliklerini, rolü ve kapsamları gözden geçirin), ardından onaylayın.

Kurulum kodu, şunları içeren base64 kodlu bir JSON yüküdür:

- `url`: Gateway WebSocket URL'si (`ws://...` veya `wss://...`)
- `bootstrapToken`: ilk eşleme el sıkışması için kullanılan kısa ömürlü tek cihazlık başlatma belirteci

Bu başlatma belirteci yerleşik eşleme başlatma profilini taşır:

- yerleşik kurulum profili yalnızca yeni QR/kurulum kodu temelini sağlar:
  `node` artı sınırlı bir `operator` devri
- devredilen `node` belirteci `scopes: []` olarak kalır
- devredilen `operator` belirteci `operator.approvals`,
  `operator.read`, `operator.talk.secrets` ve `operator.write` ile sınırlıdır
- `operator.admin`, QR/kurulum kodu başlatmasıyla verilmez; ayrı bir
  onaylanmış operatör eşleme veya belirteç akışı gerektirir
- sonraki belirteç döndürme/iptal işlemleri hem cihazın onaylanmış rol
  sözleşmesi hem de çağıran oturumun operatör kapsamlarıyla sınırlı kalır

Kurulum kodunu geçerli olduğu sürece parola gibi ele alın.

Tailscale, herkese açık veya diğer uzaktan mobil eşleme için Tailscale Serve/Funnel
ya da başka bir `wss://` Gateway URL'si kullanın. Düz metin `ws://` kurulum kodları yalnızca
loopback, özel LAN adresleri, `.local` Bonjour ana makineleri ve Android
emülatör ana makinesi için kabul edilir. Tailnet CGNAT adresleri, `.ts.net` adları ve herkese açık ana makineler
QR/kurulum kodu oluşturulmadan önce kapalı kalır.

### Bir node cihazını onaylama

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Eşleme yalnız kapsamıyla açılmış onaylayan eşlenmiş cihaz oturumu nedeniyle
açık bir onay reddedildiğinde, CLI aynı isteği `operator.admin` ile yeniden dener.
Bu, mevcut admin yetkinliğine sahip eşlenmiş bir cihazın yeni bir Control UI/tarayıcı
eşlemesini `devices/paired.json` dosyasını elle düzenlemeden kurtarmasını sağlar.
Gateway yeniden denenen bağlantıyı yine de doğrular; `operator.admin` ile kimlik doğrulaması
yapamayan belirteçler engelli kalır.

Aynı cihaz farklı kimlik doğrulama ayrıntılarıyla yeniden denerse (örneğin farklı
rol/kapsamlar/açık anahtar), önceki bekleyen istek geçersiz kılınır ve yeni bir
`requestId` oluşturulur.

<Note>
Zaten eşlenmiş bir cihaz sessizce daha geniş erişim elde etmez. Daha fazla kapsam veya daha geniş bir rol isteyerek yeniden bağlanırsa, OpenClaw mevcut onayı olduğu gibi tutar ve yeni bir bekleyen yükseltme isteği oluşturur. Onaylamadan önce mevcut onaylı erişimi yeni istenen erişimle karşılaştırmak için `openclaw devices list` kullanın.
</Note>

### İsteğe bağlı güvenilir CIDR node otomatik onayı

Cihaz eşleme varsayılan olarak manuel kalır. Sıkı denetlenen node ağları için,
açık CIDR'ler veya tam IP'lerle ilk node otomatik onayına dahil olabilirsiniz:

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

Bu yalnızca istenen kapsamı olmayan yeni `role: node` eşleme istekleri için geçerlidir.
Operator, tarayıcı, Control UI ve WebChat istemcileri yine de manuel onay gerektirir.
Rol, kapsam, meta veri ve açık anahtar değişiklikleri de manuel onay gerektirir.

### Node eşleme durumu depolama

`~/.openclaw/devices/` altında depolanır:

- `pending.json` (kısa ömürlü; bekleyen istekler sona erer)
- `paired.json` (eşlenmiş cihazlar + belirteçler)

### Notlar

- Eski `node.pair.*` API'si (CLI: `openclaw nodes pending|approve|reject|remove|rename`)
  ayrı, gateway sahipliğinde bir eşleme deposudur. WS node'ları yine de cihaz eşleme gerektirir.
- Eşleme kaydı, onaylanmış roller için kalıcı doğruluk kaynağıdır. Etkin
  cihaz belirteçleri bu onaylanmış rol kümesiyle sınırlı kalır; onaylanmış rollerin dışındaki
  başıboş bir belirteç girdisi yeni erişim oluşturmaz.

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
