---
read_when:
    - DM erişim denetimini ayarlama
    - Yeni bir iOS/Android düğümünü eşleştirme
    - OpenClaw güvenlik duruşunu inceleme
summary: 'Eşleştirmeye genel bakış: size kimin DM gönderebileceğini ve hangi düğümlerin katılabileceğini onaylayın'
title: Eşleştirme
x-i18n:
    generated_at: "2026-04-24T08:59:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 373eaa02865995ada0c906df9bad4e8328f085a8bb3679b0a5820dc397130137
    source_path: channels/pairing.md
    workflow: 15
---

“Eşleştirme”, OpenClaw’ın açık **sahip onayı** adımıdır.
İki yerde kullanılır:

1. **DM eşleştirmesi** (botla kimin konuşmasına izin verildiği)
2. **Düğüm eşleştirmesi** (hangi cihazların/düğümlerin Gateway ağına katılmasına izin verildiği)

Güvenlik bağlamı: [Güvenlik](/tr/gateway/security)

## 1) DM eşleştirmesi (gelen sohbet erişimi)

Bir kanal `pairing` DM ilkesiyle yapılandırıldığında, bilinmeyen gönderenler kısa bir kod alır ve siz onaylayana kadar mesajları **işlenmez**.

Varsayılan DM ilkeleri şu sayfada belgelenmiştir: [Güvenlik](/tr/gateway/security)

Eşleştirme kodları:

- 8 karakter, büyük harf, belirsiz karakter yok (`0O1I`).
- **1 saat sonra sona erer**. Bot eşleştirme mesajını yalnızca yeni bir istek oluşturulduğunda gönderir (gönderen başına yaklaşık saatte bir kez).
- Bekleyen DM eşleştirme istekleri varsayılan olarak **kanal başına 3** ile sınırlıdır; biri sona erene veya onaylanana kadar ek istekler yok sayılır.

### Göndereni onaylama

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Desteklenen kanallar: `bluebubbles`, `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Durumun bulunduğu yer

`~/.openclaw/credentials/` altında saklanır:

- Bekleyen istekler: `<channel>-pairing.json`
- Onaylanmış izin listesi deposu:
  - Varsayılan hesap: `<channel>-allowFrom.json`
  - Varsayılan olmayan hesap: `<channel>-<accountId>-allowFrom.json`

Hesap kapsamı davranışı:

- Varsayılan olmayan hesaplar yalnızca kendi kapsamlı izin listesi dosyalarını okur/yazar.
- Varsayılan hesap, kanal kapsamlı ve kapsam belirtilmemiş izin listesi dosyasını kullanır.

Bunları hassas kabul edin (yardımcınıza erişimi denetlerler).

Önemli: bu depo DM erişimi içindir. Grup yetkilendirmesi ayrıdır.
Bir DM eşleştirme kodunu onaylamak, o gönderenin grup komutlarını çalıştırmasına veya gruplarda botu denetlemesine otomatik olarak izin vermez. Grup erişimi için kanalın açık grup izin listelerini yapılandırın (örneğin `groupAllowFrom`, `groups` veya kanala göre grup/konu başına geçersiz kılmalar).

## 2) Düğüm cihaz eşleştirmesi (iOS/Android/macOS/başsız düğümler)

Düğümler, Gateway’e `role: node` ile **cihazlar** olarak bağlanır. Gateway, onaylanması gereken bir cihaz eşleştirme isteği oluşturur.

### Telegram üzerinden eşleştirme (iOS için önerilir)

`device-pair` Plugin'ini kullanıyorsanız, ilk cihaz eşleştirmesini tamamen Telegram üzerinden yapabilirsiniz:

1. Telegram’da botunuza şu mesajı gönderin: `/pair`
2. Bot iki mesajla yanıt verir: bir yönerge mesajı ve ayrı bir **kurulum kodu** mesajı (Telegram’da kopyalayıp yapıştırması kolaydır).
3. Telefonunuzda OpenClaw iOS uygulamasını açın → Settings → Gateway.
4. Kurulum kodunu yapıştırın ve bağlanın.
5. Telegram’a geri dönün: `/pair pending` (istek kimliklerini, rolü ve kapsamları gözden geçirin), ardından onaylayın.

Kurulum kodu, şunları içeren base64 kodlu bir JSON yüküdür:

- `url`: Gateway WebSocket URL’si (`ws://...` veya `wss://...`)
- `bootstrapToken`: ilk eşleştirme el sıkışması için kullanılan, kısa ömürlü tek cihazlık bootstrap belirteci

Bu bootstrap belirteci, yerleşik eşleştirme bootstrap profilini taşır:

- birincil olarak devredilen `node` belirteci `scopes: []` olarak kalır
- devredilen herhangi bir `operator` belirteci bootstrap izin listesiyle sınırlı kalır:
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- bootstrap kapsam denetimleri tek bir düz kapsam havuzu değil, rol önekli yapıdadır:
  operator kapsam girdileri yalnızca operator isteklerini karşılar ve operator olmayan roller
  yine de kapsamları kendi rol önekleri altında istemelidir

Kurulum kodu geçerliyken ona parola gibi davranın.

### Düğüm cihazını onaylama

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Aynı cihaz farklı kimlik doğrulama ayrıntılarıyla yeniden denerse (örneğin farklı
rol/kapsamlar/açık anahtar), önceki bekleyen istek geçersiz kılınır ve yeni bir
`requestId` oluşturulur.

Önemli: zaten eşleştirilmiş bir cihaz sessizce daha geniş erişim kazanmaz. Daha
fazla kapsam veya daha geniş bir rol isteyerek yeniden bağlanırsa OpenClaw mevcut
onayı olduğu gibi korur ve yeni bir bekleyen yükseltme isteği oluşturur. Onaylamadan
önce hâlihazırda onaylanmış erişim ile yeni istenen erişimi karşılaştırmak için
`openclaw devices list` kullanın.

### Düğüm eşleştirme durumu depolaması

`~/.openclaw/devices/` altında saklanır:

- `pending.json` (kısa ömürlü; bekleyen isteklerin süresi dolar)
- `paired.json` (eşleştirilmiş cihazlar + belirteçler)

### Notlar

- Eski `node.pair.*` API’si (CLI: `openclaw nodes pending|approve|reject|rename`) ayrı bir
  Gateway sahipli eşleştirme deposudur. WS düğümleri yine de cihaz eşleştirmesi gerektirir.
- Eşleştirme kaydı, onaylanmış roller için kalıcı doğruluk kaynağıdır. Etkin
  cihaz belirteçleri bu onaylanmış rol kümesiyle sınırlı kalır; onaylanmış rollerin
  dışında kalan rastgele bir belirteç girdisi yeni erişim oluşturmaz.

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
