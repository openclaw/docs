---
read_when:
    - DM erişim denetimini ayarlama
    - Yeni bir iOS/Android Node eşleştirme
    - OpenClaw güvenlik duruşunu gözden geçirme
summary: 'Eşleştirmeye genel bakış: size kimlerin doğrudan mesaj gönderebileceğini + hangi düğümlerin katılabileceğini onaylayın'
title: Eşleştirme
x-i18n:
    generated_at: "2026-05-04T09:07:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: f2bce4cfba7708b0003f2ffeacada8bc1849cc301f28178b499a9a67bddcf36d
    source_path: channels/pairing.md
    workflow: 16
---

“Eşleştirme”, OpenClaw’ın açık erişim onayı adımıdır.
İki yerde kullanılır:

1. **DM eşleştirme** (botla kimlerin konuşmasına izin verildiği)
2. **Node eşleştirme** (hangi cihazların/Node’ların Gateway ağına katılmasına izin verildiği)

Güvenlik bağlamı: [Güvenlik](/tr/gateway/security)

## 1) DM eşleştirme (gelen sohbet erişimi)

Bir kanal `pairing` DM ilkesiyle yapılandırıldığında, bilinmeyen gönderenler kısa bir kod alır ve siz onaylayana kadar mesajları **işlenmez**.

Varsayılan DM ilkeleri şurada belgelenmiştir: [Güvenlik](/tr/gateway/security)

`dmPolicy: "open"` yalnızca etkili DM izin listesi `"*"` içerdiğinde herkese açıktır.
Kurulum ve doğrulama, herkese açık yapılandırmalar için bu joker karakteri gerektirir. Mevcut
durum somut `allowFrom` girdileriyle `open` içeriyorsa, çalışma zamanı yine de
yalnızca bu gönderenleri kabul eder ve eşleştirme deposu onayları `open` erişimini genişletmez.

Eşleştirme kodları:

- 8 karakter, büyük harf, belirsiz karakter yok (`0O1I`).
- **1 saat sonra sona erer**. Bot eşleştirme mesajını yalnızca yeni bir istek oluşturulduğunda gönderir (gönderen başına kabaca saatte bir).
- Bekleyen DM eşleştirme istekleri varsayılan olarak **kanal başına 3** ile sınırlıdır; ek istekler biri sona erene veya onaylanana kadar yok sayılır.

### Bir göndereni onaylama

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Henüz hiçbir komut sahibi yapılandırılmadıysa, bir DM eşleştirme kodunu onaylamak
`commands.ownerAllowFrom` değerini de `telegram:123456789` gibi onaylanan gönderene başlatır.
Bu, ilk kurulumlara ayrıcalıklı komutlar ve exec onayı istemleri için açık bir sahip sağlar.
Bir sahip mevcut olduktan sonra, sonraki eşleştirme onayları yalnızca DM
erişimi verir; daha fazla sahip eklemez.

Desteklenen kanallar: `bluebubbles`, `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Yeniden kullanılabilir gönderen grupları

Aynı güvenilir gönderen kümesinin birden fazla mesaj kanalına veya hem DM hem de grup izin listelerine uygulanması gerektiğinde üst düzey `accessGroups` kullanın.

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
Bir DM eşleştirme kodunu onaylamak, o gönderene grup komutları çalıştırma veya gruplarda botu
kontrol etme iznini otomatik olarak vermez. İlk sahip başlatması, `commands.ownerAllowFrom`
içinde ayrı bir yapılandırma durumudur ve grup sohbeti teslimi hâlâ kanalın grup izin listelerini
izler (örneğin kanala bağlı olarak `groupAllowFrom`, `groups` veya grup başına
ya da konu başına geçersiz kılmalar).
</Note>

## 2) Node cihaz eşleştirme (iOS/Android/macOS/başsız Node’lar)

Node’lar Gateway’e `role: node` ile **cihazlar** olarak bağlanır. Gateway,
onaylanması gereken bir cihaz eşleştirme isteği oluşturur.

### Telegram üzerinden eşleştirme (iOS için önerilir)

`device-pair` Plugin’ini kullanıyorsanız, ilk cihaz eşleştirmesini tamamen Telegram’dan yapabilirsiniz:

1. Telegram’da botunuza şu mesajı gönderin: `/pair`
2. Bot iki mesajla yanıt verir: bir yönerge mesajı ve ayrı bir **kurulum kodu** mesajı (Telegram’da kopyalayıp yapıştırması kolaydır).
3. Telefonunuzda OpenClaw iOS uygulamasını açın → Ayarlar → Gateway.
4. QR kodunu tarayın veya kurulum kodunu yapıştırıp bağlanın.
5. Telegram’a geri dönün: `/pair pending` (istek kimliklerini, rolü ve kapsamları inceleyin), ardından onaylayın.

Kurulum kodu, şunları içeren base64 kodlu bir JSON yüküdür:

- `url`: Gateway WebSocket URL’si (`ws://...` veya `wss://...`)
- `bootstrapToken`: ilk eşleştirme el sıkışması için kullanılan kısa ömürlü, tek cihazlık bootstrap belirteci

Bu bootstrap belirteci yerleşik eşleştirme bootstrap profilini taşır:

- birincil devredilen `node` belirteci `scopes: []` olarak kalır
- devredilen herhangi bir `operator` belirteci bootstrap izin listesiyle sınırlı kalır:
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- bootstrap kapsam denetimleri rol öneklidir, tek bir düz kapsam havuzu değildir:
  operator kapsam girdileri yalnızca operator isteklerini karşılar ve operator olmayan roller
  yine de kendi rol önekleri altında kapsam istemelidir
- sonraki belirteç döndürme/iptal işlemleri hem cihazın onaylanmış rol sözleşmesiyle
  hem de çağıran oturumun operator kapsamlarıyla sınırlı kalır

Kurulum kodunu geçerli olduğu süre boyunca parola gibi değerlendirin.

Tailscale, herkese açık veya diğer non-loopback mobil eşleştirme için Tailscale
Serve/Funnel ya da başka bir `wss://` Gateway URL’si kullanın. Doğrudan non-loopback `ws://` kurulum
URL’leri QR/kurulum kodu verilmeden önce reddedilir. Düz metin `ws://` kurulum kodları
loopback URL’lerle sınırlıdır; özel ağ `ws://` istemcileri yine de uzak
Gateway kılavuzunda açıklanan açık
`OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` acil durum istisnasını gerektirir.

### Bir Node cihazını onaylama

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Açık bir onay, onaylayan eşleştirilmiş cihaz oturumu yalnızca eşleştirme kapsamıyla
açıldığı için reddedildiğinde, CLI aynı isteği `operator.admin` ile yeniden dener.
Bu, mevcut admin yetenekli eşleştirilmiş bir cihazın `devices/paired.json` dosyasını elle düzenlemeden yeni bir
Control UI/tarayıcı eşleştirmesini kurtarmasını sağlar. Gateway yeniden denenen bağlantıyı yine de doğrular;
`operator.admin` ile kimlik doğrulayamayan belirteçler engellenmiş kalır.

Aynı cihaz farklı kimlik doğrulama ayrıntılarıyla yeniden denerse (örneğin farklı
rol/kapsamlar/açık anahtar), önceki bekleyen istek geçersiz kılınır ve yeni bir
`requestId` oluşturulur.

<Note>
Zaten eşleştirilmiş bir cihaz sessizce daha geniş erişim elde etmez. Daha fazla kapsam veya daha geniş bir rol isteyerek yeniden bağlanırsa, OpenClaw mevcut onayı olduğu gibi tutar ve yeni bir bekleyen yükseltme isteği oluşturur. Onaylamadan önce şu anda onaylanmış erişimi yeni istenen erişimle karşılaştırmak için `openclaw devices list` kullanın.
</Note>

### İsteğe bağlı güvenilir CIDR Node otomatik onayı

Cihaz eşleştirme varsayılan olarak elle yapılır. Sıkı denetlenen Node ağları için,
açık CIDR’ler veya kesin IP’lerle ilk Node otomatik onayına dahil olabilirsiniz:

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
Operator, tarayıcı, Control UI ve WebChat istemcileri hâlâ elle onay gerektirir.
Rol, kapsam, meta veri ve açık anahtar değişiklikleri hâlâ elle onay gerektirir.

### Node eşleştirme durumu depolaması

`~/.openclaw/devices/` altında saklanır:

- `pending.json` (kısa ömürlü; bekleyen istekler sona erer)
- `paired.json` (eşleştirilmiş cihazlar + belirteçler)

### Notlar

- Eski `node.pair.*` API’si (CLI: `openclaw nodes pending|approve|reject|remove|rename`)
  ayrı bir Gateway sahipli eşleştirme deposudur. WS Node’ları hâlâ cihaz eşleştirmesi gerektirir.
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
