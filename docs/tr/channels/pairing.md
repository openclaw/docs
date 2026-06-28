---
read_when:
    - DM erişim denetimini ayarlama
    - Yeni bir iOS/Android düğümünü eşleştirme
    - OpenClaw güvenlik duruşunu inceleme
summary: 'Eşleştirme genel bakışı: Size kimlerin DM gönderebileceğini + hangi düğümlerin katılabileceğini onaylayın'
title: Eşleştirme
x-i18n:
    generated_at: "2026-06-28T00:14:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 92870489b62aeec710f49ec92908f4b83c7d9ee2ce34174b42e283839748e549
    source_path: channels/pairing.md
    workflow: 16
---

"Eşleştirme", OpenClaw'ın açık erişim onayı adımıdır.
İki yerde kullanılır:

1. **DM eşleştirmesi** (bot ile kimin konuşmasına izin verildiği)
2. **Node eşleştirmesi** (hangi cihazların/Node'ların Gateway ağına katılmasına izin verildiği)

Güvenlik bağlamı: [Güvenlik](/tr/gateway/security)

## 1) DM eşleştirmesi (gelen sohbet erişimi)

Bir kanal `pairing` DM ilkesiyle yapılandırıldığında, bilinmeyen göndericiler kısa bir kod alır ve siz onaylayana kadar mesajları **işlenmez**.

Varsayılan DM ilkeleri şurada belgelenmiştir: [Güvenlik](/tr/gateway/security)

`dmPolicy: "open"`, yalnızca etkili DM izin listesi `"*"` içerdiğinde herkese açıktır.
Kurulum ve doğrulama, herkese açık yapılandırmalar için bu joker karakteri gerektirir. Mevcut
durum, somut `allowFrom` girdileriyle `open` içeriyorsa, çalışma zamanı yine de
yalnızca bu göndericileri kabul eder ve eşleştirme deposu onayları `open` erişimini genişletmez.

Eşleştirme kodları:

- 8 karakter, büyük harf, belirsiz karakter yok (`0O1I`).
- **1 saat sonra sona erer**. Bot, eşleştirme mesajını yalnızca yeni bir istek oluşturulduğunda gönderir (gönderici başına yaklaşık saatte bir).
- Bekleyen DM eşleştirme istekleri varsayılan olarak **kanal başına 3** ile sınırlıdır; ek istekler, biri sona erene veya onaylanana kadar yok sayılır.

### Bir göndericiyi onaylama

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Henüz hiçbir komut sahibi yapılandırılmamışsa, bir DM eşleştirme kodunu onaylamak
`commands.ownerAllowFrom` değerini de `telegram:123456789` gibi onaylanan göndericiye
başlatır. Bu, ilk kurulumlara ayrıcalıklı komutlar ve exec onay istemleri için
açık bir sahip verir. Bir sahip mevcut olduktan sonra, sonraki eşleştirme onayları
yalnızca DM erişimi verir; daha fazla sahip eklemez.

Desteklenen kanallar: `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Yeniden kullanılabilir gönderici grupları

Aynı güvenilir gönderici kümesinin birden çok mesaj kanalına ya da hem DM hem de
grup izin listelerine uygulanması gerektiğinde üst düzey `accessGroups` kullanın.

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
- Onaylı izin listesi deposu:
  - Varsayılan hesap: `<channel>-allowFrom.json`
  - Varsayılan olmayan hesap: `<channel>-<accountId>-allowFrom.json`

Hesap kapsamı davranışı:

- Varsayılan olmayan hesaplar yalnızca kendi kapsamlı izin listesi dosyasını okur/yazar.
- Varsayılan hesap, kanal kapsamlı ve kapsamsız izin listesi dosyasını kullanır.

Bunları hassas olarak değerlendirin (asistanınıza erişimi sınırlarlar).

<Note>
Eşleştirme izin listesi deposu DM erişimi içindir. Grup yetkilendirmesi ayrıdır.
Bir DM eşleştirme kodunu onaylamak, o göndericinin grup komutlarını çalıştırmasına
veya gruplarda botu denetlemesine otomatik olarak izin vermez. İlk sahip başlatması,
`commands.ownerAllowFrom` içinde ayrı bir yapılandırma durumudur ve grup sohbeti
teslimi yine kanalın grup izin listelerini izler (örneğin kanala bağlı olarak
`groupAllowFrom`, `groups` ya da grup başına veya konu başına geçersiz kılmalar).
</Note>

## 2) Node cihaz eşleştirmesi (iOS/Android/macOS/başsız Node'lar)

Node'lar Gateway'e `role: node` ile **cihazlar** olarak bağlanır. Gateway,
onaylanması gereken bir cihaz eşleştirme isteği oluşturur.

### Telegram üzerinden eşleştirme (iOS için önerilir)

`device-pair` Plugin'ini kullanıyorsanız, ilk cihaz eşleştirmesini tamamen Telegram üzerinden yapabilirsiniz:

1. Telegram'da botunuza şu mesajı gönderin: `/pair`
2. Bot iki mesajla yanıt verir: bir yönerge mesajı ve ayrı bir **kurulum kodu** mesajı (Telegram'da kopyalayıp yapıştırması kolaydır).
3. Telefonunuzda OpenClaw iOS uygulamasını açın → Ayarlar → Gateway.
4. QR kodunu tarayın veya kurulum kodunu yapıştırın ve bağlanın.
5. Telegram'a geri dönün: `/pair pending` (istek kimliklerini, rolü ve kapsamları gözden geçirin), ardından onaylayın.

Kurulum kodu, şunları içeren base64 ile kodlanmış bir JSON yüküdür:

- `url`: Gateway WebSocket URL'si (`ws://...` veya `wss://...`)
- `bootstrapToken`: ilk eşleştirme el sıkışması için kullanılan kısa ömürlü, tek cihazlık başlatma token'ı

Bu başlatma token'ı yerleşik eşleştirme başlatma profilini taşır:

- yerleşik kurulum profili yalnızca yeni QR/kurulum kodu temelini sağlar:
  `node` artı sınırlı bir `operator` devri
- devredilen `node` token'ı `scopes: []` olarak kalır
- devredilen `operator` token'ı `operator.approvals`,
  `operator.read` ve `operator.write` ile sınırlıdır
- `operator.admin` ve `operator.pairing`, QR/kurulum kodu başlatmasıyla
  verilmez; ayrı bir onaylı operatör eşleştirmesi veya token akışı gerektirir
- sonraki token döndürme/iptal işlemleri hem cihazın onaylı
  rol sözleşmesi hem de çağıran oturumun operatör kapsamlarıyla sınırlı kalır

Kurulum kodu geçerliyken ona parola gibi davranın.

Tailscale, herkese açık veya başka bir uzak mobil eşleştirme için Tailscale Serve/Funnel
ya da başka bir `wss://` Gateway URL'si kullanın. Düz metin `ws://` kurulum kodları yalnızca
loopback, özel LAN adresleri, `.local` Bonjour host'ları ve Android emülatör host'u için kabul edilir.
Tailnet CGNAT adresleri, `.ts.net` adları ve herkese açık host'lar yine QR/kurulum kodu
çıkarılmadan önce kapalı başarısız olur.

### Bir Node cihazını onaylama

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Açık bir onay, onaylayan eşleştirilmiş cihaz oturumu yalnızca eşleştirme kapsamıyla
açıldığı için reddedilirse, CLI aynı isteği `operator.admin` ile yeniden dener.
Bu, mevcut yönetici yetenekli bir eşleştirilmiş cihazın, `devices/paired.json` dosyasını
elle düzenlemeden yeni bir Control UI/tarayıcı eşleştirmesini kurtarmasına olanak tanır.
Gateway yeniden denenen bağlantıyı yine doğrular; `operator.admin` ile kimlik doğrulaması
yapamayan token'lar engelli kalır.

Aynı cihaz farklı kimlik doğrulama ayrıntılarıyla yeniden denerse (örneğin farklı
rol/kapsamlar/açık anahtar), önceki bekleyen istek geçersiz kılınır ve yeni bir
`requestId` oluşturulur.

<Note>
Zaten eşleştirilmiş bir cihaz sessizce daha geniş erişim almaz. Daha fazla kapsam veya daha geniş bir rol isteyerek yeniden bağlanırsa, OpenClaw mevcut onayı olduğu gibi tutar ve yeni bir bekleyen yükseltme isteği oluşturur. Onaylamadan önce şu anda onaylı erişimi yeni istenen erişimle karşılaştırmak için `openclaw devices list` kullanın.
</Note>

### İsteğe bağlı güvenilir CIDR Node otomatik onayı

Cihaz eşleştirmesi varsayılan olarak manuel kalır. Sıkı denetlenen Node ağları için,
açık CIDR'ler veya tam IP'ler ile ilk Node otomatik onayını etkinleştirebilirsiniz:

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

Bu yalnızca istenen kapsamı olmayan yeni `role: node` eşleştirme isteklerine uygulanır.
Operatör, tarayıcı, Control UI ve WebChat istemcileri yine manuel onay gerektirir.
Rol, kapsam, metadata ve açık anahtar değişiklikleri yine manuel onay gerektirir.

### Node eşleştirme durum depolaması

`~/.openclaw/devices/` altında saklanır:

- `pending.json` (kısa ömürlü; bekleyen istekler sona erer)
- `paired.json` (eşleştirilmiş cihazlar + token'lar)

### Notlar

- Eski `node.pair.*` API'si (CLI: `openclaw nodes pending|approve|reject|remove|rename`)
  ayrı ve Gateway'e ait bir eşleştirme deposudur. WS Node'ları yine cihaz eşleştirmesi gerektirir.
- Eşleştirme kaydı, onaylı roller için kalıcı doğruluk kaynağıdır. Etkin
  cihaz token'ları o onaylı rol kümesiyle sınırlı kalır; onaylı rollerin dışındaki
  başıboş bir token girdisi yeni erişim oluşturmaz.

## İlgili dokümanlar

- Güvenlik modeli + prompt injection: [Güvenlik](/tr/gateway/security)
- Güvenli güncelleme (doctor çalıştırın): [Güncelleme](/tr/install/updating)
- Kanal yapılandırmaları:
  - Telegram: [Telegram](/tr/channels/telegram)
  - WhatsApp: [WhatsApp](/tr/channels/whatsapp)
  - Signal: [Signal](/tr/channels/signal)
  - iMessage: [iMessage](/tr/channels/imessage)
  - Discord: [Discord](/tr/channels/discord)
  - Slack: [Slack](/tr/channels/slack)
