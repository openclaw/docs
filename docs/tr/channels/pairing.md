---
read_when:
    - DM erişim denetimini ayarlama
    - Yeni bir iOS/Android Node’u eşleştirme
    - OpenClaw güvenlik duruşunu inceleme
summary: 'Eşleştirmeye genel bakış: size kimlerin DM gönderebileceğini ve hangi Node’ların katılabileceğini onaylayın'
title: Eşleştirme
x-i18n:
    generated_at: "2026-04-26T11:24:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: f9d28547baacce638347ce0062e3bc4f194704eb369b4ca45f7158d5e16cee93
    source_path: channels/pairing.md
    workflow: 15
---

“Pairing”, OpenClaw’ın açık **sahip onayı** adımıdır.  
İki yerde kullanılır:

1. **DM eşleştirmesi** (bot ile konuşmasına kimlerin izinli olduğu)
2. **Node eşleştirmesi** (hangi cihazların/Node’ların Gateway ağına katılmasına izin verildiği)

Güvenlik bağlamı: [Security](/tr/gateway/security)

## 1) DM eşleştirmesi (gelen sohbet erişimi)

Bir kanal `pairing` DM ilkesiyle yapılandırıldığında, bilinmeyen göndericiler kısa bir kod alır ve siz onaylayana kadar mesajları **işlenmez**.

Varsayılan DM ilkeleri burada belgelenmiştir: [Security](/tr/gateway/security)

Eşleştirme kodları:

- 8 karakterlidir, büyük harftir, belirsiz karakter içermez (`0O1I`).
- **1 saat sonra sona erer**. Bot eşleştirme mesajını yalnızca yeni bir istek oluşturulduğunda gönderir (kabaca gönderici başına saatte bir kez).
- Bekleyen DM eşleştirme istekleri varsayılan olarak **kanal başına 3** ile sınırlıdır; biri sona erene veya onaylanana kadar ek istekler yok sayılır.

### Bir göndericiyi onaylama

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Desteklenen kanallar: `bluebubbles`, `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Durumun saklandığı yer

`~/.openclaw/credentials/` altında saklanır:

- Bekleyen istekler: `<channel>-pairing.json`
- Onaylı izin listesi deposu:
  - Varsayılan hesap: `<channel>-allowFrom.json`
  - Varsayılan olmayan hesap: `<channel>-<accountId>-allowFrom.json`

Hesap kapsamı davranışı:

- Varsayılan olmayan hesaplar yalnızca kendi kapsamlı izin listesi dosyalarını okur/yazar.
- Varsayılan hesap, kanal kapsamlı ve kapsam belirtilmemiş izin listesi dosyasını kullanır.

Bunları hassas kabul edin (yardımcınıza erişimi bunlar denetler).

Önemli: bu depo DM erişimi içindir. Grup yetkilendirmesi ayrıdır.  
Bir DM eşleştirme kodunu onaylamak, o göndericinin grup komutlarını çalıştırmasına veya botu gruplarda denetlemesine otomatik olarak izin vermez. Grup erişimi için kanalın açık grup izin listelerini yapılandırın (`groupAllowFrom`, `groups` veya kanala göre grup başına/konu başına geçersiz kılmalar gibi).

## 2) Node cihaz eşleştirmesi (iOS/Android/macOS/başsız Node’lar)

Node’lar, Gateway’e `role: node` ile **cihaz** olarak bağlanır. Gateway, onaylanması gereken bir cihaz eşleştirme isteği oluşturur.

### Telegram üzerinden eşleştirme (iOS için önerilir)

`device-pair` Plugin’ini kullanıyorsanız, ilk cihaz eşleştirmesini tamamen Telegram üzerinden yapabilirsiniz:

1. Telegram’da botunuza `/pair` gönderin
2. Bot iki mesajla yanıt verir: bir yönerge mesajı ve ayrı bir **kurulum kodu** mesajı (Telegram’da kopyalayıp yapıştırması kolaydır).
3. Telefonunuzda OpenClaw iOS uygulamasını açın → Settings → Gateway.
4. Kurulum kodunu yapıştırın ve bağlanın.
5. Telegram’a dönün: `/pair pending` (istek kimliklerini, rolü ve kapsamları inceleyin), ardından onaylayın.

Kurulum kodu, şunları içeren base64 kodlu bir JSON yüküdür:

- `url`: Gateway WebSocket URL’si (`ws://...` veya `wss://...`)
- `bootstrapToken`: ilk eşleştirme el sıkışması için kullanılan, kısa ömürlü tek cihazlık bootstrap token

Bu bootstrap token, yerleşik eşleştirme bootstrap profilini taşır:

- birincil olarak devredilen `node` token’ı `scopes: []` olarak kalır
- devredilen herhangi bir `operator` token’ı bootstrap izin listesiyle sınırlı kalır:
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- bootstrap kapsam denetimleri düz tek bir kapsam havuzu değil, rol önekli yapılır:
  operator kapsam girdileri yalnızca operator isteklerini karşılar ve operator olmayan roller yine de kendi rol önekleri altında kapsam istemelidir
- daha sonraki token döndürme/iptal işlemleri hem cihazın onaylı rol sözleşmesiyle hem de çağıran oturumun operator kapsamlarıyla sınırlı kalır

Geçerli olduğu sürece kurulum kodunu parola gibi değerlendirin.

### Bir Node cihazını onaylama

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Aynı cihaz farklı kimlik doğrulama ayrıntılarıyla yeniden denerse (örneğin farklı rol/kapsamlar/açık anahtar), önceki bekleyen istek geçersiz kılınır ve yeni bir `requestId` oluşturulur.

Önemli: zaten eşleştirilmiş bir cihaz sessizce daha geniş erişim almaz. Daha fazla kapsam veya daha geniş bir rol isteyerek yeniden bağlanırsa, OpenClaw mevcut onayı olduğu gibi korur ve yeni bir bekleyen yükseltme isteği oluşturur. Onaylamadan önce şu anda onaylı erişimi yeni istenen erişimle karşılaştırmak için `openclaw devices list` kullanın.

### İsteğe bağlı güvenilir CIDR ile Node otomatik onayı

Cihaz eşleştirmesi varsayılan olarak manuel kalır. Sıkı denetlenen Node ağları için, açık CIDR’ler veya tam IP’lerle ilk Node otomatik onayını etkinleştirebilirsiniz:

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

Bu yalnızca istenen kapsamı olmayan yeni `role: node` eşleştirme istekleri için geçerlidir. Operator, browser, Control UI ve WebChat istemcileri yine de manuel onay gerektirir. Rol, kapsam, meta veri ve açık anahtar değişiklikleri yine de manuel onay gerektirir.

### Node eşleştirme durumu depolama

`~/.openclaw/devices/` altında saklanır:

- `pending.json` (kısa ömürlüdür; bekleyen isteklerin süresi dolar)
- `paired.json` (eşleştirilmiş cihazlar + token’lar)

### Notlar

- Eski `node.pair.*` API’si (CLI: `openclaw nodes pending|approve|reject|rename`) ayrı, Gateway sahipliğinde bir eşleştirme deposudur. WS Node’lar yine de cihaz eşleştirmesi gerektirir.
- Eşleştirme kaydı, onaylı roller için kalıcı doğruluk kaynağıdır. Etkin cihaz token’ları bu onaylı rol kümesiyle sınırlı kalır; onaylı roller dışında kalan başıboş bir token girdisi yeni erişim oluşturmaz.

## İlgili belgeler

- Güvenlik modeli + prompt injection: [Security](/tr/gateway/security)
- Güvenli güncelleme (doctor çalıştırın): [Updating](/tr/install/updating)
- Kanal yapılandırmaları:
  - Telegram: [Telegram](/tr/channels/telegram)
  - WhatsApp: [WhatsApp](/tr/channels/whatsapp)
  - Signal: [Signal](/tr/channels/signal)
  - BlueBubbles (iMessage): [BlueBubbles](/tr/channels/bluebubbles)
  - iMessage (eski): [iMessage](/tr/channels/imessage)
  - Discord: [Discord](/tr/channels/discord)
  - Slack: [Slack](/tr/channels/slack)
