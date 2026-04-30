---
read_when:
    - DM erişim denetimini ayarlama
    - Yeni bir iOS/Android Node eşleştirme
    - OpenClaw güvenlik duruşunu gözden geçirme
summary: 'Eşleştirme genel bakışı: sana kimlerin DM gönderebileceğini + hangi Node''ların katılabileceğini onayla'
title: Eşleştirme
x-i18n:
    generated_at: "2026-04-30T09:08:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: cfdcaf831aedb122ea85200518b8dc1c6f42eff365444dee6c4b740050b1ce26
    source_path: channels/pairing.md
    workflow: 16
---

“Eşleştirme”, OpenClaw’ın açık erişim onayı adımıdır.
İki yerde kullanılır:

1. **DM eşleştirme** (bot ile kimlerin konuşmasına izin verildiği)
2. **Node eşleştirme** (hangi cihazların/Node’ların Gateway ağına katılmasına izin verildiği)

Güvenlik bağlamı: [Güvenlik](/tr/gateway/security)

## 1) DM eşleştirme (gelen sohbet erişimi)

Bir kanal DM ilkesi `pairing` ile yapılandırıldığında, bilinmeyen gönderenler kısa bir kod alır ve siz onaylayana kadar mesajları **işlenmez**.

Varsayılan DM ilkeleri burada belgelenmiştir: [Güvenlik](/tr/gateway/security)

`dmPolicy: "open"` yalnızca etkin DM izin verilenler listesi `"*"` içerdiğinde herkese açıktır.
Kurulum ve doğrulama, herkese açık `open` yapılandırmaları için bu joker karakteri gerektirir. Mevcut
durum somut `allowFrom` girdileriyle `open` içeriyorsa, çalışma zamanı yine de
yalnızca bu gönderenleri kabul eder ve eşleştirme deposu onayları `open` erişimini genişletmez.

Eşleştirme kodları:

- 8 karakter, büyük harf, belirsiz karakter yok (`0O1I`).
- **1 saat sonra süresi dolar**. Bot eşleştirme mesajını yalnızca yeni bir istek oluşturulduğunda gönderir (gönderen başına yaklaşık saatte bir).
- Bekleyen DM eşleştirme istekleri varsayılan olarak **kanal başına 3** ile sınırlıdır; ek istekler biri sona erene veya onaylanana kadar yok sayılır.

### Bir göndereni onaylama

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Henüz hiçbir komut sahibi yapılandırılmadıysa, bir DM eşleştirme kodunu onaylamak
`commands.ownerAllowFrom` değerini de onaylanan gönderenle başlatır; örneğin `telegram:123456789`.
Bu, ilk kurulumlara ayrıcalıklı komutlar ve exec onayı istemleri için açık bir sahip verir.
Bir sahip var olduktan sonra, sonraki eşleştirme onayları yalnızca DM erişimi verir;
daha fazla sahip eklemez.

Desteklenen kanallar: `bluebubbles`, `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Durumun bulunduğu yer

`~/.openclaw/credentials/` altında saklanır:

- Bekleyen istekler: `<channel>-pairing.json`
- Onaylanan izin verilenler listesi deposu:
  - Varsayılan hesap: `<channel>-allowFrom.json`
  - Varsayılan olmayan hesap: `<channel>-<accountId>-allowFrom.json`

Hesap kapsamı davranışı:

- Varsayılan olmayan hesaplar yalnızca kendi kapsamlı izin verilenler listesi dosyalarını okur/yazar.
- Varsayılan hesap, kanal kapsamlı kapsamlandırılmamış izin verilenler listesi dosyasını kullanır.

Bunları hassas kabul edin (asistanınıza erişimi kontrol ederler).

<Note>
Eşleştirme izin verilenler listesi deposu DM erişimi içindir. Grup yetkilendirmesi ayrıdır.
Bir DM eşleştirme kodunu onaylamak, o gönderenin grup
komutlarını çalıştırmasına veya botu gruplarda kontrol etmesine otomatik olarak izin vermez. İlk sahip başlatması ayrı bir yapılandırma
durumudur ve `commands.ownerAllowFrom` içindedir; grup sohbeti teslimi ise yine kanalın
grup izin verilenler listelerini izler (örneğin kanala bağlı olarak `groupAllowFrom`, `groups` ya da grup başına
veya konu başına geçersiz kılmalar).
</Note>

## 2) Node cihaz eşleştirme (iOS/Android/macOS/headless Node’lar)

Node’lar Gateway’e `role: node` olan **cihazlar** olarak bağlanır. Gateway,
onaylanması gereken bir cihaz eşleştirme isteği oluşturur.

### Telegram üzerinden eşleştirme (iOS için önerilir)

`device-pair` Plugin’ini kullanıyorsanız, ilk cihaz eşleştirmesini tamamen Telegram üzerinden yapabilirsiniz:

1. Telegram’da botunuza şu mesajı gönderin: `/pair`
2. Bot iki mesajla yanıt verir: bir yönerge mesajı ve ayrı bir **kurulum kodu** mesajı (Telegram’da kopyalayıp yapıştırması kolaydır).
3. Telefonunuzda OpenClaw iOS uygulamasını açın → Ayarlar → Gateway.
4. Kurulum kodunu yapıştırın ve bağlanın.
5. Telegram’a geri dönün: `/pair pending` (istek kimliklerini, rolü ve kapsamları gözden geçirin), ardından onaylayın.

Kurulum kodu, şunları içeren base64 kodlu bir JSON yüküdür:

- `url`: Gateway WebSocket URL’si (`ws://...` veya `wss://...`)
- `bootstrapToken`: ilk eşleştirme el sıkışması için kullanılan kısa ömürlü, tek cihazlık bootstrap token’ı

Bu bootstrap token’ı yerleşik eşleştirme bootstrap profilini taşır:

- birincil devredilen `node` token’ı `scopes: []` olarak kalır
- devredilen tüm `operator` token’ları bootstrap izin verilenler listesiyle sınırlı kalır:
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- bootstrap kapsam kontrolleri rol öneklidir, tek düz bir kapsam havuzu değildir:
  operator kapsam girdileri yalnızca operator isteklerini karşılar ve operator olmayan roller
  yine de kapsamları kendi rol önekleri altında istemelidir
- sonraki token döndürme/iptal işlemleri hem cihazın onaylanmış
  rol sözleşmesiyle hem de çağıran oturumun operator kapsamlarıyla sınırlı kalır

Kurulum kodunu geçerli olduğu süre boyunca parola gibi ele alın.

### Bir Node cihazını onaylama

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Aynı cihaz farklı kimlik doğrulama ayrıntılarıyla yeniden denerse (örneğin farklı
rol/kapsamlar/açık anahtar), önceki bekleyen isteğin yerini yenisi alır ve yeni bir
`requestId` oluşturulur.

<Note>
Zaten eşleştirilmiş bir cihaz sessizce daha geniş erişim almaz. Daha fazla kapsam veya daha geniş bir rol isteyerek yeniden bağlanırsa, OpenClaw mevcut onayı olduğu gibi korur ve yeni bir bekleyen yükseltme isteği oluşturur. Onaylamadan önce mevcut onaylı erişimi yeni istenen erişimle karşılaştırmak için `openclaw devices list` kullanın.
</Note>

### İsteğe bağlı güvenilir CIDR Node otomatik onayı

Cihaz eşleştirme varsayılan olarak manuel kalır. Sıkı denetlenen Node ağları için,
açık CIDR’ler veya kesin IP’lerle ilk kez Node otomatik onayına katılabilirsiniz:

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
Operator, tarayıcı, Control UI ve WebChat istemcileri yine de manuel
onay gerektirir. Rol, kapsam, metadata ve açık anahtar değişiklikleri yine de manuel
onay gerektirir.

### Node eşleştirme durumu depolama

`~/.openclaw/devices/` altında saklanır:

- `pending.json` (kısa ömürlü; bekleyen isteklerin süresi dolar)
- `paired.json` (eşleştirilmiş cihazlar + token’lar)

### Notlar

- Eski `node.pair.*` API’si (CLI: `openclaw nodes pending|approve|reject|remove|rename`)
  ayrı bir Gateway sahipli eşleştirme deposudur. WS Node’ları yine de cihaz eşleştirmesi gerektirir.
- Eşleştirme kaydı, onaylanmış roller için kalıcı doğruluk kaynağıdır. Etkin
  cihaz token’ları bu onaylanmış rol kümesiyle sınırlı kalır; onaylanmış rollerin
  dışındaki başıboş bir token girdisi yeni erişim oluşturmaz.

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
