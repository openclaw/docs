---
read_when:
    - DM erişim denetimini ayarlama
    - Yeni bir iOS/Android Node'unu eşleştirme
    - OpenClaw güvenlik duruşunun incelenmesi
summary: 'Eşleştirmeye genel bakış: Size kimlerin DM gönderebileceğini ve hangi Node''ların katılabileceğini onaylayın'
title: Eşleştirme
x-i18n:
    generated_at: "2026-07-16T16:51:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ef58100d222604ab2f0e073c268750eb0996b598dc37b3d4ca20a444d2c69f1e
    source_path: channels/pairing.md
    workflow: 16
---

"Eşleştirme", OpenClaw'ın açık erişim onayı adımıdır.
İki yerde kullanılır:

1. **DM eşleştirmesi** (botla kimlerin konuşmasına izin verildiği)
2. **Node eşleştirmesi** (hangi cihazların/Node'ların Gateway ağına katılmasına izin verildiği)

Güvenlik bağlamı: [Güvenlik](/tr/gateway/security)

## 1) DM eşleştirmesi (gelen sohbet erişimi)

Bir kanal, DM ilkesi `pairing` olarak yapılandırıldığında, bilinmeyen göndericiler kısa bir kod alır ve siz onaylayana kadar iletileri **işlenmez**.

Varsayılan DM ilkeleri şurada belgelenmiştir: [Güvenlik](/tr/gateway/security)

`dmPolicy: "open"`, yalnızca etkin DM izin listesi `"*"` içerdiğinde herkese açıktır.
Kurulum ve doğrulama, herkese açık yapılandırmalar için bu joker karakteri gerektirir. Mevcut
durum, somut `allowFrom` girdileriyle `open` içeriyorsa çalışma zamanı yine
yalnızca bu göndericileri kabul eder ve eşleştirme deposu onayları `open` erişimini genişletmez.

Eşleştirme kodları:

- 8 karakterdir, büyük harflidir ve belirsiz karakterler içermez (`0O1I`).
- **1 saat sonra geçerliliğini yitirir**. Bot, eşleştirme iletisini yalnızca yeni bir istek oluşturulduğunda gönderir (gönderici başına yaklaşık saatte bir).
- Bekleyen DM eşleştirme istekleri **kanal hesabı başına 3** ile sınırlıdır; ek istekler, birinin süresi dolana veya biri onaylanana kadar yok sayılır.

### Bir göndericiyi onaylama

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Aynı kanaldaki istek sahibini bilgilendirmek için onay komutuna `--notify` ekleyin. Birden fazla hesabı olan kanallar `--account <id>` kabul eder.

Henüz bir komut sahibi yapılandırılmamışsa bir DM eşleştirme kodunu onaylamak,
`commands.ownerAllowFrom` için onaylanan göndericiyi de başlangıç sahibi olarak ayarlar; örneğin `telegram:123456789`.
Bu, ilk kez yapılan kurulumlara ayrıcalıklı komutlar ve yürütme onayı
istemleri için açıkça belirlenmiş bir sahip kazandırır. Bir sahip mevcut olduktan sonra sonraki eşleştirme onayları yalnızca DM
erişimi verir; daha fazla sahip eklemez.

Desteklenen kanallar (eşleştirme bildiren, kurulu herhangi bir kanal plugini; `openclaw-weixin` gibi harici pluginler daha fazlasını ekleyebilir): `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `signal`, `slack`, `sms`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Yeniden kullanılabilir gönderici grupları

Aynı güvenilir gönderici kümesinin birden fazla ileti kanalına veya hem DM hem de
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

### Durumun saklandığı yer

Paylaşılan SQLite durum veritabanında
`~/.openclaw/state/openclaw.sqlite` konumunda saklanır:

- `channel_pairing_requests` içindeki bekleyen istekler
- `channel_pairing_allow_entries` içindeki onaylanmış göndericiler

Hesap kapsamı davranışı:

- her istek ve onaylanmış gönderici, kanal ve hesaba göre anahtarlanır
- çalışma zamanı yalnızca kurallı SQLite satırlarını okur; eski dosyaları birleştirmez

Eski Gateway'ler `~/.openclaw/credentials/` altında `<channel>-pairing.json` ve
`<channel>-<accountId>-allowFrom.json` yazıyordu.
Başlangıç geçişi ve `openclaw doctor --fix`, bu dosyaları SQLite'a aktarır ve
başarılı bir aktarımdan sonra her kaynak dosyayı kaldırır. Bu satırlar asistanınıza erişimi
denetlediğinden SQLite veritabanını hassas veri olarak değerlendirin.

<Note>
Eşleştirme izin listesi deposu DM erişimi içindir. Grup yetkilendirmesi ayrıdır.
Bir DM eşleştirme kodunun onaylanması, söz konusu göndericinin grup
komutlarını çalıştırmasına veya gruplarda botu denetlemesine otomatik olarak izin vermez. İlk sahip başlangıç ayarı, `commands.ownerAllowFrom` içindeki ayrı bir yapılandırma
durumudur ve grup sohbeti teslimi yine kanalın
grup izin listelerine uyar (örneğin kanala bağlı olarak `groupAllowFrom`, `groups` veya grup
ya da konu başına geçersiz kılmalar).
</Note>

## 2) Node cihaz eşleştirmesi (iOS/Android/macOS/başsız Node'lar)

Node'lar Gateway'e `role: node` ile **cihazlar** olarak bağlanır. Gateway,
onaylanması gereken bir cihaz eşleştirme isteği oluşturur.

### Control UI'dan eşleştirme (önerilen)

`operator.admin` erişimine sahip, hâlihazırda bağlı bir Control UI oturumu kullanın:

1. Control UI'ı açın ve **Settings → Devices** bölümüne gidin.
2. **Devices** sayfasında **Pair mobile device** düğmesine tıklayın.
3. **Full access (recommended)** seçeneğini koruyun veya yönetsel Gateway denetimlerini
   hariç tutmak için **Limited access** seçeneğini belirleyin.
4. **Create setup code** düğmesine tıklayın.
5. Telefonunuzda OpenClaw uygulamasını açın → **Settings** → **Gateway**.
6. QR kodunu tarayın veya kurulum kodunu yapıştırın, ardından bağlanın.

Resmî OpenClaw iOS ve Android uygulamalarının kurulum kodu meta verileri eşleştiğinde
bunlar otomatik olarak onaylanır. **Pending approval** altında bir istek görünürse (örneğin
resmî olmayan bir istemci veya eşleşmeyen meta veriler nedeniyle), onaylamadan önce rolünü ve
kapsamlarını inceleyin.

Geçerli Control UI oturumu yönetici erişimine sahip olmadığında düğme devre dışı bırakılır.
Bu durumda Gateway ana makinesinden aşağıdaki CLI onay akışını kullanın.

### Telegram üzerinden eşleştirme

`device-pair` pluginini kullanıyorsanız ilk cihaz eşleştirmesini tamamen Telegram üzerinden yapabilirsiniz:

1. Telegram'da botunuza şu iletiyi gönderin: `/pair`
2. Bot iki iletiyle yanıt verir: bir yönerge iletisi ve ayrı bir **kurulum kodu** iletisi (Telegram'da kolayca kopyalanıp yapıştırılabilir).
3. Telefonunuzda OpenClaw iOS uygulamasını açın → Settings → Gateway.
4. QR kodunu (`/pair qr`) tarayın veya kurulum kodunu yapıştırıp bağlanın.
5. Resmî mobil uygulama otomatik olarak bağlanır. `/pair pending` altında bir
   istek görünürse onaylamadan önce rolünü ve kapsamlarını inceleyin.

Kurulum kodu, şunları içeren base64 kodlu bir JSON yüküdür:

- `url`: Gateway WebSocket URL'si (`ws://...` veya `wss://...`)
- `urls`: mevcut olduğunda mobil uygulamanın deneyebileceği sıralı LAN/Tailnet rotaları
- `bootstrapToken`: ilk eşleştirme el sıkışması için tek kullanımlık başlangıç tokeni; Gateway bunun süresini 10 dakika sonra doldurur

Eşleştirme tamamlandıktan sonra kullanılmamış kurulum kodlarını geçersiz kılmak için `/pair cleanup` çalıştırın.

Bu başlangıç tokeni, yerleşik eşleştirme başlangıç profilini taşır:

- güvenli bir `wss://` kurulumu (veya aynı ana makine geri döngüsü), varsayılan olarak `node` ve tam
  yerel mobil `operator` erişimini kullanır
- devredilen `node` tokeni `scopes: []` olarak kalır
- varsayılan olarak devredilen `operator` tokeni `operator.admin`,
  `operator.approvals`, `operator.read`, `operator.talk.secrets` ve
  `operator.write` içerir
- Control UI **Limited access** ve `openclaw qr --limited`,
  diğer operatör kapsamlarını korurken `operator.admin` kapsamını hariç tutar
- düz metin LAN `ws://` kurulumu otomatik olarak aynı sınırlı profili kullanır;
  tam erişim için `wss://` veya Tailscale Serve yapılandırın ve yeni bir kod oluşturun
- sonraki token döndürme/iptal işlemleri hem cihazın onaylanmış
  rol sözleşmesiyle hem de çağıran oturumun operatör kapsamlarıyla sınırlı kalır

Kurulum kodu geçerli olduğu sürece ona parola gibi davranın.

iOS ve Android **Settings → Gateway** sayfaları **Full** veya **Limited**
erişimi gösterir. Sınırlı bir telefonun erişimini yükseltmek için önce güvenli bir `wss://` veya
Tailscale Serve rotası yapılandırın, ardından tam erişimli yeni bir kurulum kodu oluşturun, bu ayarlar sayfasında
tarayın veya yapıştırın ve yeniden bağlanın.

Tailscale, herkese açık veya diğer uzaktan mobil eşleştirmeler için Tailscale Serve/Funnel
ya da başka bir `wss://` Gateway URL'si kullanın. Düz metin `ws://` kurulum kodları yalnızca
geri döngü, özel LAN adresleri, `.local` Bonjour ana makineleri ve Android
emülatör ana makinesi için kabul edilir. Geri döngü dışındaki düz metin rotalar sınırlı erişim alır. Tailnet
CGNAT adresleri, `.ts.net` adları ve herkese açık ana makineler, QR/kurulum kodu
verilmeden önce yine güvenli biçimde reddedilir.

`gateway.bind=lan` kurulum URL'leri için OpenClaw, etkin Gateway'in geri döngü portuna
proxy uygulayan kalıcı Tailscale Serve HTTPS köklerini algılar ve bunları
LAN rotasıyla birlikte duyurur. Kurulum komutu bu yedek rotayı yalnızca
`lan` için ekler; `custom` ve `tailnet`, açıkça duyurulan rotalarını korur.
iOS uygulaması duyurulan rotaları sırayla yoklar ve erişilebilen ilk
uç noktayı kaydeder.

### Bir Node cihazını onaylama

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Onaylayan eşleştirilmiş cihaz oturumu yalnızca eşleştirme kapsamıyla açıldığı için
açık bir onay reddedilirse CLI, aynı isteği
`operator.admin` ile yeniden dener. Bu, yönetici yeteneğine sahip mevcut bir eşleştirilmiş cihazın eşleştirme deposunu elle düzenlemeden yeni bir
Control UI/tarayıcı eşleştirmesini kurtarmasını sağlar.
Gateway yeniden denenen bağlantıyı yine doğrular; `operator.admin` ile kimlik doğrulayamayan
tokenler engellenmeye devam eder.

Aynı cihaz farklı kimlik doğrulama ayrıntılarıyla (örneğin farklı
rol/kapsamlar/genel anahtar) yeniden denerse önceki bekleyen isteğin yerini yeni bir
`requestId` alır.

<Note>
Zaten eşleştirilmiş bir cihazın erişimi sessizce genişletilmez. Daha fazla kapsam veya daha geniş bir rol isteyerek yeniden bağlanırsa OpenClaw mevcut onayı olduğu gibi tutar ve yeni bir bekleyen yükseltme isteği oluşturur. Onaylamadan önce hâlihazırda onaylanmış erişim ile yeni istenen erişimi karşılaştırmak için `openclaw devices list` kullanın.
</Note>

### İsteğe bağlı güvenilir CIDR Node otomatik onayı

Cihaz eşleştirmesi varsayılan olarak elle yapılır. Sıkı biçimde denetlenen Node ağlarında,
açık CIDR'ler veya tam IP'lerle ilk Node eşleştirmesi için otomatik onayı etkinleştirebilirsiniz:

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

Bu yalnızca istenen kapsamı olmayan yeni `role: node` eşleştirme isteklerine
uygulanır. Operatör, tarayıcı, Control UI ve WebChat istemcileri yine elle
onay gerektirir. Rol, kapsam, meta veri ve genel anahtar değişiklikleri yine elle
onay gerektirir.

### Node eşleştirme durumu depolaması

Paylaşılan SQLite durum veritabanında `~/.openclaw/state/openclaw.sqlite` konumunda saklanır:

- bekleyen cihaz eşleştirme istekleri (kısa ömürlüdür; 5 dakika sonra geçerliliklerini yitirir)
- eşleştirilmiş cihazlar + tokenler

Eski Gateway'ler bu durumu `~/.openclaw/devices/*.json` içinde tutuyordu; bu dosyalar
Gateway başlangıcında SQLite'a aktarılır ve `.migrated` son ekiyle arşivlenir.

### Notlar

- `node.pair.*` API'si (CLI: `openclaw nodes pending|approve|reject|remove|rename`), aynı eşleştirilmiş cihaz kayıtlarında depolanan
  Node yetenek onaylarını yönetir. WS Node'ları
  yine cihaz eşleştirmesi gerektirir; bkz. [Node eşleştirmesi](/tr/gateway/pairing).
- Eşleştirme kaydı, onaylanmış roller için kalıcı doğruluk kaynağıdır. Etkin
  cihaz tokenleri bu onaylanmış rol kümesiyle sınırlı kalır; onaylanmış roller
  dışındaki başıboş bir token girdisi yeni erişim oluşturmaz.

## İlgili belgeler

- Güvenlik modeli + istem enjeksiyonu: [Güvenlik](/tr/gateway/security)
- Güvenli güncelleme (doctor komutunu çalıştırın): [Güncelleme](/tr/install/updating)
- Kanal yapılandırmaları:
  - Telegram: [Telegram](/tr/channels/telegram)
  - WhatsApp: [WhatsApp](/tr/channels/whatsapp)
  - Signal: [Signal](/tr/channels/signal)
  - iMessage: [iMessage](/tr/channels/imessage)
  - Discord: [Discord](/tr/channels/discord)
  - Slack: [Slack](/tr/channels/slack)
