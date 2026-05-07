---
read_when:
    - DM erişim denetimini ayarlama
    - Yeni bir iOS/Android Node'u eşleme
    - OpenClaw güvenlik duruşunun gözden geçirilmesi
summary: 'Eşleştirme genel bakışı: size kimlerin doğrudan mesaj gönderebileceğini + hangi düğümlerin katılabileceğini onaylayın'
title: Eşleştirme
x-i18n:
    generated_at: "2026-05-07T01:51:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6e1b9082342209b7d37a790ecc61330f74131b070d0560cb71fb533379d9016a
    source_path: channels/pairing.md
    workflow: 16
---

"Eşleştirme", OpenClaw'ın açık erişim onayı adımıdır.
İki yerde kullanılır:

1. **DM eşleştirmesi** (botla kimin konuşmasına izin verildiği)
2. **Node eşleştirmesi** (Gateway ağına hangi cihazların/node'ların katılmasına izin verildiği)

Güvenlik bağlamı: [Güvenlik](/tr/gateway/security)

## 1) DM eşleştirmesi (gelen sohbet erişimi)

Bir kanal DM ilkesi `pairing` ile yapılandırıldığında, bilinmeyen gönderenler kısa bir kod alır ve siz onaylayana kadar mesajları **işlenmez**.

Varsayılan DM ilkeleri şurada belgelenmiştir: [Güvenlik](/tr/gateway/security)

`dmPolicy: "open"` yalnızca etkin DM izin listesi `"*"` içerdiğinde herkese açıktır.
Kurulum ve doğrulama, herkese açık yapılandırmalar için bu joker karakteri gerektirir. Mevcut
durum somut `allowFrom` girdileriyle `open` içeriyorsa, çalışma zamanı yine de
yalnızca bu gönderenleri kabul eder ve eşleştirme deposu onayları `open` erişimini genişletmez.

Eşleştirme kodları:

- 8 karakter, büyük harf, belirsiz karakter yok (`0O1I`).
- **1 saat sonra süresi dolar**. Bot, eşleştirme mesajını yalnızca yeni bir istek oluşturulduğunda gönderir (gönderen başına yaklaşık saatte bir).
- Bekleyen DM eşleştirme istekleri varsayılan olarak **kanal başına 3** ile sınırlıdır; ek istekler, biri sona erene veya onaylanana kadar yok sayılır.

### Bir göndereni onaylama

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Henüz hiçbir komut sahibi yapılandırılmamışsa, bir DM eşleştirme kodunu onaylamak
`commands.ownerAllowFrom` değerini de onaylanan gönderene önyükler; örneğin `telegram:123456789`.
Bu, ilk kurulumlara ayrıcalıklı komutlar ve exec onayı istemleri için açık bir
sahip verir. Bir sahip var olduktan sonra sonraki eşleştirme onayları yalnızca DM
erişimi verir; daha fazla sahip eklemez.

Desteklenen kanallar: `bluebubbles`, `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Yeniden kullanılabilir gönderen grupları

Aynı güvenilir gönderen kümesinin birden fazla mesaj kanalına veya hem DM hem de
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

`~/.openclaw/credentials/` altında saklanır:

- Bekleyen istekler: `<channel>-pairing.json`
- Onaylanmış izin listesi deposu:
  - Varsayılan hesap: `<channel>-allowFrom.json`
  - Varsayılan olmayan hesap: `<channel>-<accountId>-allowFrom.json`

Hesap kapsamı davranışı:

- Varsayılan olmayan hesaplar yalnızca kendi kapsamlı izin listesi dosyalarını okur/yazar.
- Varsayılan hesap, kanal kapsamlı kapsamsız izin listesi dosyasını kullanır.

Bunları hassas kabul edin (asistanınıza erişimi denetlerler).

<Note>
Eşleştirme izin listesi deposu DM erişimi içindir. Grup yetkilendirmesi ayrıdır.
Bir DM eşleştirme kodunu onaylamak, o gönderene grup komutlarını çalıştırma veya
gruplarda botu denetleme iznini otomatik olarak vermez. İlk sahip önyüklemesi
`commands.ownerAllowFrom` içinde ayrı bir yapılandırma durumudur ve grup sohbeti
teslimi hâlâ kanalın grup izin listelerini izler (örneğin `groupAllowFrom`,
`groups` ya da kanala bağlı olarak grup başına veya konu başına geçersiz kılmalar).
</Note>

## 2) Node cihaz eşleştirmesi (iOS/Android/macOS/headless node'lar)

Node'lar Gateway'e `role: node` ile **cihazlar** olarak bağlanır. Gateway,
onaylanması gereken bir cihaz eşleştirme isteği oluşturur.

### Telegram üzerinden eşleştirme (iOS için önerilir)

`device-pair` plugin'ini kullanıyorsanız, ilk cihaz eşleştirmesini tamamen Telegram üzerinden yapabilirsiniz:

1. Telegram'da botunuza mesaj gönderin: `/pair`
2. Bot iki mesajla yanıt verir: bir yönerge mesajı ve ayrı bir **kurulum kodu** mesajı (Telegram'da kopyalayıp yapıştırması kolaydır).
3. Telefonunuzda OpenClaw iOS uygulamasını açın → Ayarlar → Gateway.
4. QR kodunu tarayın veya kurulum kodunu yapıştırıp bağlanın.
5. Telegram'a geri dönün: `/pair pending` (istek kimliklerini, rolü ve kapsamları inceleyin), ardından onaylayın.

Kurulum kodu, şunları içeren base64 ile kodlanmış bir JSON yüküdür:

- `url`: Gateway WebSocket URL'si (`ws://...` veya `wss://...`)
- `bootstrapToken`: ilk eşleştirme el sıkışması için kullanılan kısa ömürlü, tek cihazlık önyükleme belirteci

Bu önyükleme belirteci yerleşik eşleştirme önyükleme profilini taşır:

- devredilen birincil `node` belirteci `scopes: []` olarak kalır
- devredilen herhangi bir `operator` belirteci önyükleme izin listesiyle sınırlı kalır:
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- önyükleme kapsam denetimleri rol öneklidir, tek düz bir kapsam havuzu değildir:
  operator kapsam girdileri yalnızca operator isteklerini karşılar ve operator olmayan roller
  yine de kapsamları kendi rol önekleri altında istemelidir
- sonraki belirteç döndürme/iptal işlemleri hem cihazın onaylanmış rol sözleşmesi
  hem de çağıran oturumun operator kapsamlarıyla sınırlı kalır

Kurulum kodunu geçerli olduğu sürece parola gibi ele alın.

Tailscale, herkese açık veya diğer uzak mobil eşleştirme için Tailscale Serve/Funnel
ya da başka bir `wss://` Gateway URL'si kullanın. Düz metin `ws://` kurulum kodları
yalnızca loopback, özel LAN adresleri, `.local` Bonjour ana makineleri ve Android
emülatör ana makinesi için kabul edilir. Tailnet CGNAT adresleri, `.ts.net` adları
ve herkese açık ana makineler QR/kurulum kodu verilmeden önce yine kapalı olarak başarısız olur.

### Bir Node cihazını onaylama

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Açık bir onay, onaylayan eşleştirilmiş cihaz oturumu yalnızca eşleştirme kapsamıyla
açıldığı için reddedilirse, CLI aynı isteği `operator.admin` ile yeniden dener.
Bu, mevcut admin yetenekli eşleştirilmiş bir cihazın yeni bir Control UI/tarayıcı
eşleştirmesini `devices/paired.json` dosyasını elle düzenlemeden kurtarmasını sağlar.
Gateway yeniden denenen bağlantıyı yine doğrular; `operator.admin` ile kimlik
doğrulaması yapamayan belirteçler engelli kalır.

Aynı cihaz farklı kimlik doğrulama ayrıntılarıyla yeniden denerse (örneğin farklı
rol/kapsamlar/açık anahtar), önceki bekleyen istek geçersiz kılınır ve yeni bir
`requestId` oluşturulur.

<Note>
Zaten eşleştirilmiş bir cihaz sessizce daha geniş erişim almaz. Daha fazla kapsam veya daha geniş bir rol isteyerek yeniden bağlanırsa, OpenClaw mevcut onayı olduğu gibi tutar ve yeni bir bekleyen yükseltme isteği oluşturur. Onaylamadan önce şu anda onaylanmış erişimi yeni istenen erişimle karşılaştırmak için `openclaw devices list` kullanın.
</Note>

### İsteğe bağlı güvenilir CIDR Node otomatik onayı

Cihaz eşleştirmesi varsayılan olarak elle yapılır. Sıkı denetlenen Node ağları için
açık CIDR'ler veya tam IP'lerle ilk Node otomatik onayını etkinleştirebilirsiniz:

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

Bu yalnızca istenen kapsamı olmayan yeni `role: node` eşleştirme istekleri için
geçerlidir. Operator, tarayıcı, Control UI ve WebChat istemcileri hâlâ elle onay
gerektirir. Rol, kapsam, metadata ve açık anahtar değişiklikleri de hâlâ elle
onay gerektirir.

### Node eşleştirme durumu depolaması

`~/.openclaw/devices/` altında saklanır:

- `pending.json` (kısa ömürlü; bekleyen isteklerin süresi dolar)
- `paired.json` (eşleştirilmiş cihazlar + belirteçler)

### Notlar

- Eski `node.pair.*` API'si (CLI: `openclaw nodes pending|approve|reject|remove|rename`)
  ayrı, gateway sahipli bir eşleştirme deposudur. WS node'ları yine de cihaz eşleştirmesi gerektirir.
- Eşleştirme kaydı, onaylanmış roller için kalıcı doğruluk kaynağıdır. Etkin
  cihaz belirteçleri bu onaylanmış rol kümesiyle sınırlı kalır; onaylanmış rollerin
  dışındaki başıboş bir belirteç girdisi yeni erişim oluşturmaz.

## İlgili dokümanlar

- Güvenlik modeli + prompt injection: [Güvenlik](/tr/gateway/security)
- Güvenli güncelleme (doctor çalıştırın): [Güncelleme](/tr/install/updating)
- Kanal yapılandırmaları:
  - Telegram: [Telegram](/tr/channels/telegram)
  - WhatsApp: [WhatsApp](/tr/channels/whatsapp)
  - Signal: [Signal](/tr/channels/signal)
  - iMessage: [iMessage](/tr/channels/imessage)
  - BlueBubbles (eski iMessage köprüsü): [BlueBubbles](/tr/channels/bluebubbles)
  - Discord: [Discord](/tr/channels/discord)
  - Slack: [Slack](/tr/channels/slack)
