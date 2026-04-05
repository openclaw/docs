---
read_when:
    - DM erişim denetimini ayarlıyorsunuz
    - Yeni bir iOS/Android düğümünü eşleştiriyorsunuz
    - OpenClaw güvenlik duruşunu inceliyorsunuz
summary: 'Eşleştirmeye genel bakış: size kimlerin DM atabileceğini ve hangi düğümlerin katılabileceğini onaylayın'
title: Eşleştirme
x-i18n:
    generated_at: "2026-04-05T13:44:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2bd99240b3530def23c05a26915d07cf8b730565c2822c6338437f8fb3f285c9
    source_path: channels/pairing.md
    workflow: 15
---

# Eşleştirme

“Eşleştirme”, OpenClaw'ın açık **sahip onayı** adımıdır.
İki yerde kullanılır:

1. **DM eşleştirmesi** (botla kimlerin konuşmasına izin verilir)
2. **Düğüm eşleştirmesi** (hangi cihazların/düğümlerin gateway ağına katılmasına izin verilir)

Güvenlik bağlamı: [Güvenlik](/gateway/security)

## 1) DM eşleştirmesi (gelen sohbet erişimi)

Bir kanal `pairing` DM politikasıyla yapılandırıldığında, bilinmeyen gönderenler kısa bir kod alır ve siz onaylayana kadar mesajları **işlenmez**.

Varsayılan DM politikaları şu belgede açıklanmıştır: [Güvenlik](/gateway/security)

Eşleştirme kodları:

- 8 karakter, büyük harf, belirsiz karakter yok (`0O1I`).
- **1 saat sonra sona erer**. Bot, eşleştirme mesajını yalnızca yeni bir istek oluşturulduğunda gönderir (gönderen başına kabaca saatte bir kez).
- Bekleyen DM eşleştirme istekleri varsayılan olarak **kanal başına 3** ile sınırlıdır; biri sona erene veya onaylanana kadar ek istekler yok sayılır.

### Bir göndereni onaylama

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
- Varsayılan hesap, kanal kapsamlı kapsamlandırılmamış izin listesi dosyasını kullanır.

Bunları hassas olarak değerlendirin (asistanınıza erişimi denetlerler).

Önemli: bu depo DM erişimi içindir. Grup yetkilendirmesi ayrıdır.
Bir DM eşleştirme kodunu onaylamak, o gönderenin grup komutlarını çalıştırmasına veya gruplarda botu kontrol etmesine otomatik olarak izin vermez. Grup erişimi için kanalın açık grup izin listelerini yapılandırın (örneğin kanala bağlı olarak `groupAllowFrom`, `groups` veya grup/konu başına geçersiz kılmalar).

## 2) Düğüm cihaz eşleştirmesi (iOS/Android/macOS/başsız düğümler)

Düğümler Gateway'e `role: node` ile **cihaz** olarak bağlanır. Gateway, onaylanması gereken bir cihaz eşleştirme isteği oluşturur.

### Telegram üzerinden eşleştirme (iOS için önerilir)

`device-pair` plugin'ini kullanıyorsanız, ilk cihaz eşleştirmesini tamamen Telegram üzerinden yapabilirsiniz:

1. Telegram'da botunuza mesaj gönderin: `/pair`
2. Bot iki mesajla yanıt verir: bir yönerge mesajı ve ayrı bir **kurulum kodu** mesajı (Telegram'da kolay kopyala/yapıştır için).
3. Telefonunuzda OpenClaw iOS uygulamasını açın → Settings → Gateway.
4. Kurulum kodunu yapıştırın ve bağlanın.
5. Telegram'a dönün: `/pair pending` (istek kimliklerini, rolü ve kapsamları inceleyin), ardından onaylayın.

Kurulum kodu, şu bilgileri içeren base64 ile kodlanmış bir JSON yüküdür:

- `url`: Gateway WebSocket URL'si (`ws://...` veya `wss://...`)
- `bootstrapToken`: ilk eşleştirme el sıkışması için kullanılan, kısa ömürlü tek cihazlık bootstrap token'ı

Bu bootstrap token'ı yerleşik eşleştirme bootstrap profilini taşır:

- devredilen birincil `node` token'ı `scopes: []` olarak kalır
- devredilen herhangi bir `operator` token'ı bootstrap izin listesiyle sınırlı kalır:
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- bootstrap kapsam denetimleri tek bir düz kapsam havuzu değil, rol önekli yapılır:
  operator kapsam girdileri yalnızca operator isteklerini karşılar ve operator olmayan roller yine de kendi rol önekleri altında kapsam istemelidir

Kurulum kodu geçerli olduğu sürece ona parola gibi davranın.

### Bir düğüm cihazını onaylama

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Aynı cihaz farklı kimlik doğrulama ayrıntılarıyla yeniden denerse (örneğin farklı rol/kapsamlar/public key), önceki bekleyen istek geçersiz kılınır ve yeni bir `requestId` oluşturulur.

### Düğüm eşleştirme durumu depolaması

`~/.openclaw/devices/` altında saklanır:

- `pending.json` (kısa ömürlüdür; bekleyen isteklerin süresi dolar)
- `paired.json` (eşleştirilmiş cihazlar + token'lar)

### Notlar

- Eski `node.pair.*` API'si (CLI: `openclaw nodes pending|approve|reject|rename`) gateway'e ait ayrı bir eşleştirme deposudur. WS düğümleri yine de cihaz eşleştirmesi gerektirir.
- Eşleştirme kaydı, onaylanmış roller için dayanıklı doğruluk kaynağıdır. Etkin cihaz token'ları bu onaylanmış rol kümesiyle sınırlı kalır; onaylanmış roller dışında kalan başıboş bir token girdisi yeni erişim oluşturmaz.

## İlgili belgeler

- Güvenlik modeli + prompt injection: [Güvenlik](/gateway/security)
- Güvenli güncelleme (doctor çalıştırın): [Güncelleme](/install/updating)
- Kanal yapılandırmaları:
  - Telegram: [Telegram](/channels/telegram)
  - WhatsApp: [WhatsApp](/channels/whatsapp)
  - Signal: [Signal](/channels/signal)
  - BlueBubbles (iMessage): [BlueBubbles](/channels/bluebubbles)
  - iMessage (eski): [iMessage](/channels/imessage)
  - Discord: [Discord](/channels/discord)
  - Slack: [Slack](/channels/slack)
