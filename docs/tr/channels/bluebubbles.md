---
read_when:
    - BlueBubbles kanalını ayarlama
    - Webhook eşleştirmede sorun giderme
    - macOS'te iMessage'ı yapılandırma
summary: BlueBubbles macOS sunucusu üzerinden iMessage (REST gönderme/alma, yazma göstergesi, tepkiler, eşleştirme, gelişmiş eylemler).
title: BlueBubbles
x-i18n:
    generated_at: "2026-04-22T04:20:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: db2e193db3fbcea22748187c21d0493037f59d4f1af163725530d5572b06e8b4
    source_path: channels/bluebubbles.md
    workflow: 15
---

# BlueBubbles (macOS REST)

Durum: BlueBubbles macOS sunucusuyla HTTP üzerinden konuşan paketlenmiş plugin. Eski imsg kanalına kıyasla daha zengin API'si ve daha kolay kurulumu nedeniyle **iMessage entegrasyonu için önerilir**.

## Paketlenmiş plugin

Geçerli OpenClaw sürümleri BlueBubbles'ı paketlenmiş olarak içerir, bu nedenle normal paketlenmiş derlemelerde ayrıca `openclaw plugins install` adımı gerekmez.

## Genel bakış

- BlueBubbles yardımcı uygulaması ([bluebubbles.app](https://bluebubbles.app)) üzerinden macOS'te çalışır.
- Önerilen/test edilen: macOS Sequoia (15). macOS Tahoe (26) çalışır; düzenleme şu anda Tahoe'da bozuktur ve grup simgesi güncellemeleri başarılı raporlanabilir ancak senkronize olmayabilir.
- OpenClaw onunla REST API'si üzerinden konuşur (`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`).
- Gelen mesajlar Webhook'ler üzerinden gelir; giden yanıtlar, yazma göstergeleri, okundu bilgileri ve tapback'ler REST çağrılarıdır.
- Ekler ve sticker'lar gelen medya olarak alınır (ve mümkün olduğunda agente gösterilir).
- Eşleştirme/izin listesi diğer kanallarla aynı şekilde çalışır (`/channels/pairing` vb.) ve `channels.bluebubbles.allowFrom` + eşleştirme kodlarını kullanır.
- Tepkiler, tıpkı Slack/Telegram'da olduğu gibi sistem olayları olarak gösterilir; böylece agent'lar yanıt vermeden önce onlardan "bahsedebilir".
- Gelişmiş özellikler: düzenleme, geri alma, yanıt dizileme, mesaj efektleri, grup yönetimi.

## Hızlı başlangıç

1. Mac'inize BlueBubbles sunucusunu kurun ([bluebubbles.app/install](https://bluebubbles.app/install) adresindeki yönergeleri izleyin).
2. BlueBubbles yapılandırmasında web API'sini etkinleştirin ve bir parola belirleyin.
3. `openclaw onboard` komutunu çalıştırın ve BlueBubbles'ı seçin veya elle yapılandırın:

   ```json5
   {
     channels: {
       bluebubbles: {
         enabled: true,
         serverUrl: "http://192.168.1.100:1234",
         password: "example-password",
         webhookPath: "/bluebubbles-webhook",
       },
     },
   }
   ```

4. BlueBubbles Webhook'lerini Gateway'nize yönlendirin (örnek: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`).
5. Gateway'yi başlatın; Webhook işleyicisini kaydedecek ve eşleştirmeyi başlatacaktır.

Güvenlik notu:

- Her zaman bir Webhook parolası ayarlayın.
- Webhook kimlik doğrulaması her zaman zorunludur. OpenClaw, BlueBubbles Webhook isteklerini `channels.bluebubbles.password` ile eşleşen bir parola/guid içermedikçe reddeder (örneğin `?password=<password>` veya `x-password`), loopback/proxy topolojisinden bağımsız olarak.
- Parola doğrulaması, tam Webhook gövdeleri okunup ayrıştırılmadan önce kontrol edilir.

## Messages.app uygulamasını etkin tutma (VM / başsız kurulumlar)

Bazı macOS VM / her zaman açık kurulumlarda Messages.app “boşta” kalabilir (uygulama açılana/öne getirilene kadar gelen olaylar durur). Basit bir geçici çözüm, bir AppleScript + LaunchAgent kullanarak **Messages'ı her 5 dakikada bir dürtmektir**.

### 1) AppleScript'i kaydedin

Bunu şu şekilde kaydedin:

- `~/Scripts/poke-messages.scpt`

Örnek komut dosyası (etkileşimsizdir; odağı çalmaz):

```applescript
try
  tell application "Messages"
    if not running then
      launch
    end if

    -- İşlemin yanıt vermeye devam etmesi için betik arayüzüne dokun.
    set _chatCount to (count of chats)
  end tell
on error
  -- Geçici hataları yoksay (ilk çalıştırma istemleri, kilitli oturum vb.).
end try
```

### 2) Bir LaunchAgent kurun

Bunu şu şekilde kaydedin:

- `~/Library/LaunchAgents/com.user.poke-messages.plist`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>Label</key>
    <string>com.user.poke-messages</string>

    <key>ProgramArguments</key>
    <array>
      <string>/bin/bash</string>
      <string>-lc</string>
      <string>/usr/bin/osascript &quot;$HOME/Scripts/poke-messages.scpt&quot;</string>
    </array>

    <key>RunAtLoad</key>
    <true/>

    <key>StartInterval</key>
    <integer>300</integer>

    <key>StandardOutPath</key>
    <string>/tmp/poke-messages.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/poke-messages.err</string>
  </dict>
</plist>
```

Notlar:

- Bu, **her 300 saniyede bir** ve **oturum açıldığında** çalışır.
- İlk çalıştırma, macOS **Automation** istemlerini tetikleyebilir (`osascript` → Messages). Bunları, LaunchAgent'ı çalıştıran aynı kullanıcı oturumunda onaylayın.

Yüklemek için:

```bash
launchctl unload ~/Library/LaunchAgents/com.user.poke-messages.plist 2>/dev/null || true
launchctl load ~/Library/LaunchAgents/com.user.poke-messages.plist
```

## Onboarding

BlueBubbles, etkileşimli onboarding içinde kullanılabilir:

```
openclaw onboard
```

Sihirbaz şunları ister:

- **Sunucu URL'si** (zorunlu): BlueBubbles sunucu adresi (ör. `http://192.168.1.100:1234`)
- **Parola** (zorunlu): BlueBubbles Server ayarlarından API parolası
- **Webhook yolu** (isteğe bağlı): Varsayılan olarak `/bluebubbles-webhook`
- **DM ilkesi**: eşleştirme, izin listesi, açık veya devre dışı
- **İzin listesi**: Telefon numaraları, e-posta adresleri veya sohbet hedefleri

BlueBubbles'ı CLI üzerinden de ekleyebilirsiniz:

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## Erişim kontrolü (DM'ler + gruplar)

DM'ler:

- Varsayılan: `channels.bluebubbles.dmPolicy = "pairing"`.
- Bilinmeyen göndericiler bir eşleştirme kodu alır; onaylanana kadar mesajlar yok sayılır (kodlar 1 saat sonra sona erer).
- Onaylamak için:
  - `openclaw pairing list bluebubbles`
  - `openclaw pairing approve bluebubbles <CODE>`
- Eşleştirme varsayılan belirteç değişimidir. Ayrıntılar: [Eşleştirme](/tr/channels/pairing)

Gruplar:

- `channels.bluebubbles.groupPolicy = open | allowlist | disabled` (varsayılan: `allowlist`).
- `channels.bluebubbles.groupAllowFrom`, `allowlist` ayarlandığında gruplarda kimin tetikleyebileceğini kontrol eder.

### Kişi adı zenginleştirme (macOS, isteğe bağlı)

BlueBubbles grup Webhook'leri genellikle yalnızca ham katılımcı adreslerini içerir. Bunun yerine `GroupMembers` bağlamında yerel kişi adlarının görünmesini istiyorsanız, macOS'te yerel Contacts zenginleştirmesini etkinleştirebilirsiniz:

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` aramayı etkinleştirir. Varsayılan: `false`.
- Aramalar yalnızca grup erişimi, komut yetkilendirmesi ve mention geçitlemesi mesajın geçmesine izin verdikten sonra çalışır.
- Yalnızca adı olmayan telefon katılımcıları zenginleştirilir.
- Yerel eşleşme bulunamazsa ham telefon numaraları yedek olarak kalır.

```json5
{
  channels: {
    bluebubbles: {
      enrichGroupParticipantsFromContacts: true,
    },
  },
}
```

### Mention geçitlemesi (gruplar)

BlueBubbles, iMessage/WhatsApp davranışıyla eşleşen grup sohbetleri için mention geçitlemesini destekler:

- Mention'ları algılamak için `agents.list[].groupChat.mentionPatterns` (veya `messages.groupChat.mentionPatterns`) kullanır.
- Bir grup için `requireMention` etkin olduğunda agent yalnızca kendisinden bahsedildiğinde yanıt verir.
- Yetkili göndericilerden gelen kontrol komutları mention geçitlemesini atlar.

Grup başına yapılandırma:

```json5
{
  channels: {
    bluebubbles: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123"],
      groups: {
        "*": { requireMention: true }, // tüm gruplar için varsayılan
        "iMessage;-;chat123": { requireMention: false }, // belirli grup için geçersiz kıl
      },
    },
  },
}
```

### Komut geçitlemesi

- Kontrol komutları (örn. `/config`, `/model`) yetkilendirme gerektirir.
- Komut yetkilendirmesini belirlemek için `allowFrom` ve `groupAllowFrom` kullanılır.
- Yetkili göndericiler, gruplarda mention olmadan da kontrol komutlarını çalıştırabilir.

### Grup başına sistem prompt'u

`channels.bluebubbles.groups.*` altındaki her giriş isteğe bağlı bir `systemPrompt` dizgesini kabul eder. Bu değer, o gruptaki bir mesajı işleyen her turda agent'ın sistem prompt'una eklenir; böylece agent prompt'larını düzenlemeden grup başına persona veya davranış kuralları belirleyebilirsiniz:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;-;chat123": {
          systemPrompt: "Yanıtları 3 cümle altında tut. Grubun gündelik tonunu yansıt.",
        },
      },
    },
  },
}
```

Anahtar, BlueBubbles'ın grup için `chatGuid` / `chatIdentifier` / sayısal `chatId` olarak raporladığı her neyse onunla eşleşir ve `"*"` joker karakter girdisi, tam eşleşmesi olmayan her grup için varsayılan sağlar (`requireMention` ve grup başına araç ilkeleriyle aynı desen kullanılır). Tam eşleşmeler her zaman joker karaktere üstün gelir. DM'ler bu alanı yok sayar; bunun yerine agent düzeyinde veya hesap düzeyinde prompt özelleştirmesini kullanın.

#### Uygulamalı örnek: dizili yanıtlar ve tapback tepkileri (Private API)

BlueBubbles Private API etkinleştirildiğinde, gelen mesajlar kısa mesaj kimlikleriyle gelir (örneğin `[[reply_to:5]]`) ve agent belirli bir mesaja dizili yanıt vermek için `action=reply` veya bir tapback bırakmak için `action=react` çağırabilir. Grup başına bir `systemPrompt`, agent'ın doğru aracı seçmesini sağlamak için güvenilir bir yöntemdir:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;+;chat-family": {
          systemPrompt: [
            "Bu grupta yanıt verirken, yanıtınızın tetikleyen mesajın",
            "altında dizilenmesi için bağlamdaki [[reply_to:N]] messageId ile",
            "her zaman action=reply çağrısı yapın. Asla bağlantısız yeni bir mesaj göndermeyin.",
            "",
            "Kısa onaylar için ('tamam', 'aldım', 'ilgileniyorum'),",
            "metin yanıtı göndermek yerine uygun bir tapback emojisiyle (❤️, 👍, 😂, ‼️, ❓)",
            "action=react kullanın.",
          ].join(" "),
        },
      },
    },
  },
}
```

Tapback tepkileri ve dizili yanıtlar için BlueBubbles Private API gereklidir; alttaki işleyiş için bkz. [Gelişmiş eylemler](#advanced-actions) ve [Mesaj kimlikleri](#message-ids-short-vs-full).

## ACP konuşma bağları

BlueBubbles sohbetleri, taşıma katmanı değiştirilmeden kalıcı ACP çalışma alanlarına dönüştürülebilir.

Hızlı operatör akışı:

- DM veya izin verilen grup sohbeti içinde `/acp spawn codex --bind here` komutunu çalıştırın.
- Aynı BlueBubbles konuşmasındaki sonraki mesajlar, oluşturulan ACP oturumuna yönlendirilir.
- `/new` ve `/reset`, aynı bağlı ACP oturumunu yerinde sıfırlar.
- `/acp close`, ACP oturumunu kapatır ve bağı kaldırır.

Yapılandırılmış kalıcı bağlar da üst düzey `bindings[]` girişleri üzerinden `type: "acp"` ve `match.channel: "bluebubbles"` ile desteklenir.

`match.peer.id`, desteklenen herhangi bir BlueBubbles hedef biçimini kullanabilir:

- `+15555550123` veya `user@example.com` gibi normalize edilmiş DM tanıtıcısı
- `chat_id:<id>`
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

Kararlı grup bağları için `chat_id:*` veya `chat_identifier:*` tercih edin.

Örnek:

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: { agent: "codex", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "bluebubbles",
        accountId: "default",
        peer: { kind: "dm", id: "+15555550123" },
      },
      acp: { label: "codex-imessage" },
    },
  ],
}
```

Paylaşılan ACP bağlama davranışı için bkz. [ACP Agents](/tr/tools/acp-agents).

## Yazma + okundu bilgileri

- **Yazma göstergeleri**: Yanıt üretiminden önce ve üretim sırasında otomatik olarak gönderilir.
- **Okundu bilgileri**: `channels.bluebubbles.sendReadReceipts` ile kontrol edilir (varsayılan: `true`).
- **Yazma göstergeleri**: OpenClaw yazma başlangıç olayları gönderir; BlueBubbles gönderimden sonra veya zaman aşımında yazma durumunu otomatik temizler (DELETE ile elle durdurma güvenilir değildir).

```json5
{
  channels: {
    bluebubbles: {
      sendReadReceipts: false, // okundu bilgilerini devre dışı bırak
    },
  },
}
```

## Gelişmiş eylemler

BlueBubbles, yapılandırmada etkinleştirildiğinde gelişmiş mesaj eylemlerini destekler:

```json5
{
  channels: {
    bluebubbles: {
      actions: {
        reactions: true, // tapback'ler (varsayılan: true)
        edit: true, // gönderilmiş mesajları düzenle (macOS 13+, macOS 26 Tahoe'da bozuk)
        unsend: true, // mesajları geri al (macOS 13+)
        reply: true, // mesaj GUID'sine göre yanıt dizileme
        sendWithEffect: true, // mesaj efektleri (slam, loud vb.)
        renameGroup: true, // grup sohbetlerini yeniden adlandır
        setGroupIcon: true, // grup sohbeti simgesi/fotoğrafı ayarla (macOS 26 Tahoe'da kararsız)
        addParticipant: true, // gruplara katılımcı ekle
        removeParticipant: true, // gruplardan katılımcı kaldır
        leaveGroup: true, // grup sohbetlerinden ayrıl
        sendAttachment: true, // ekler/medya gönder
      },
    },
  },
}
```

Kullanılabilir eylemler:

- **react**: Tapback tepkileri ekle/kaldır (`messageId`, `emoji`, `remove`). iMessage'ın yerel tapback kümesi `love`, `like`, `dislike`, `laugh`, `emphasize` ve `question` değerlerinden oluşur. Bir agent bu kümenin dışında bir emoji seçtiğinde (örneğin `👀`), tepki aracı tüm isteğin başarısız olması yerine tapback'in yine de görüntülenmesi için `love` değerine geri döner. Yapılandırılmış onay tepkileri ise yine katı olarak doğrulanır ve bilinmeyen değerlerde hata verir.
- **edit**: Gönderilmiş bir mesajı düzenle (`messageId`, `text`)
- **unsend**: Bir mesajı geri al (`messageId`)
- **reply**: Belirli bir mesaja yanıt ver (`messageId`, `text`, `to`)
- **sendWithEffect**: iMessage efektiyle gönder (`text`, `to`, `effectId`)
- **renameGroup**: Bir grup sohbetini yeniden adlandır (`chatGuid`, `displayName`)
- **setGroupIcon**: Bir grup sohbetinin simgesini/fotoğrafını ayarla (`chatGuid`, `media`) — macOS 26 Tahoe'da kararsızdır (API başarılı dönebilir ancak simge senkronize olmaz).
- **addParticipant**: Bir gruba birini ekle (`chatGuid`, `address`)
- **removeParticipant**: Bir gruptan birini kaldır (`chatGuid`, `address`)
- **leaveGroup**: Bir grup sohbetinden ayrıl (`chatGuid`)
- **upload-file**: Medya/dosya gönder (`to`, `buffer`, `filename`, `asVoice`)
  - Sesli notlar: iMessage sesli mesajı olarak göndermek için **MP3** veya **CAF** ses ile `asVoice: true` ayarlayın. BlueBubbles, sesli not gönderirken MP3 → CAF dönüştürmesi yapar.
- Eski takma ad: `sendAttachment` hâlâ çalışır, ancak kanonik eylem adı `upload-file`'dır.

### Mesaj kimlikleri (kısa ve tam)

OpenClaw, token tasarrufu için _kısa_ mesaj kimliklerini (örn. `1`, `2`) gösterebilir.

- `MessageSid` / `ReplyToId` kısa kimlikler olabilir.
- `MessageSidFull` / `ReplyToIdFull` sağlayıcının tam kimliklerini içerir.
- Kısa kimlikler bellekte tutulur; yeniden başlatma veya önbellek temizleme sonrasında geçersiz olabilir.
- Eylemler kısa veya tam `messageId` kabul eder, ancak kısa kimlikler artık mevcut değilse hata verir.

Kalıcı otomasyonlar ve depolama için tam kimlikleri kullanın:

- Şablonlar: `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- Bağlam: gelen payload'larda `MessageSidFull` / `ReplyToIdFull`

Şablon değişkenleri için bkz. [Configuration](/tr/gateway/configuration).

## Bölünmüş gönderilen DM'leri birleştirme (tek bileşimde komut + URL)

Bir kullanıcı iMessage'ta bir komutla birlikte URL yazdığında — örneğin `Dump https://example.com/article` — Apple gönderimi **iki ayrı Webhook teslimatına** böler:

1. Bir metin mesajı (`"Dump"`).
2. Ek olarak OG önizleme görselleri içeren bir URL önizleme balonu (`"https://..."`).

İki Webhook çoğu kurulumda OpenClaw'a yaklaşık 0.8-2.0 saniye arayla ulaşır. Birleştirme olmadan agent ilk turda komutu tek başına alır, yanıt verir (çoğu zaman "URL'yi gönder"), ardından URL'yi ancak ikinci turda görür — o noktada da komut bağlamı zaten kaybolmuştur.

`channels.bluebubbles.coalesceSameSenderDms`, bir DM'de art arda gelen aynı göndericiye ait Webhook'lerin tek bir agent turunda birleştirilmesini etkinleştirir. Grup sohbetleri çok kullanıcılı tur yapısını korumak için mesaj başına anahtarlanmaya devam eder.

### Ne zaman etkinleştirilmeli

Şunlarda etkinleştirin:

- Tek mesajda `komut + payload` bekleyen Skills sunuyorsanız (dump, paste, save, queue vb.).
- Kullanıcılarınız komutlarla birlikte URL, görsel veya uzun içerik yapıştırıyorsa.
- DM tur gecikmesindeki artışı kabul edebiliyorsanız (aşağıya bakın).

Şunlarda devre dışı bırakın:

- Tek kelimelik DM tetikleyicileri için en düşük komut gecikmesine ihtiyacınız varsa.
- Tüm akışlarınız payload takibi olmayan tek atımlık komutlarsa.

### Etkinleştirme

```json5
{
  channels: {
    bluebubbles: {
      coalesceSameSenderDms: true, // etkinleştir (varsayılan: false)
    },
  },
}
```

Bu bayrak açıkken ve açıkça `messages.inbound.byChannel.bluebubbles` tanımlanmamışsa, debounce penceresi **2500 ms**'ye genişler (birleştirme olmayan durumda varsayılan 500 ms'dir). Bu daha geniş pencere gereklidir — Apple'ın 0.8-2.0 saniyelik bölünmüş gönderim temposu daha dar varsayılan pencereye sığmaz.

Pencereyi kendiniz ayarlamak için:

```json5
{
  messages: {
    inbound: {
      byChannel: {
        // 2500 ms çoğu kurulum için işe yarar; Mac'iniz yavaşsa
        // veya bellek baskısı altındaysa 4000 ms'ye çıkarın
        // (gözlemlenen aralık bu durumda 2 saniyenin üzerine uzayabilir).
        bluebubbles: 2500,
      },
    },
  },
}
```

### Ödünleşimler

- **DM kontrol komutları için ek gecikme.** Bayrak açıkken DM kontrol komutları (`Dump`, `Save` vb.) artık bir payload Webhook'i geliyor olabilir diye gönderilmeden önce debounce penceresi kadar bekler. Grup sohbeti komutları anında gönderilmeye devam eder.
- **Birleştirilmiş çıktı sınırlıdır** — birleştirilmiş metin 4000 karakter ile sınırlanır ve açık bir `…[truncated]` işaretçisi eklenir; ekler 20 ile sınırlandırılır; kaynak girişler 10 ile sınırlandırılır (bunun ötesinde ilk + en son korunur). Her kaynak `messageId` yine de gelen tekrar engellemesine ulaşır, böylece herhangi bir tekil olayın daha sonra MessagePoller tarafından yeniden oynatılması yinelenen olarak tanınır.
- **Kanal başına isteğe bağlıdır.** Diğer kanallar (Telegram, WhatsApp, Slack, …) etkilenmez.

### Senaryolar ve agent'ın gördükleri

| Kullanıcının yazdığı                                                  | Apple'ın teslim ettiği       | Bayrak kapalı (varsayılan)              | Bayrak açık + 2500 ms pencere                                             |
| --------------------------------------------------------------------- | ---------------------------- | --------------------------------------- | -------------------------------------------------------------------------- |
| `Dump https://example.com` (tek gönderim)                             | ~1 saniye arayla 2 Webhook   | İki agent turu: yalnızca "Dump", sonra URL | Tek tur: birleştirilmiş metin `Dump https://example.com`                |
| `Save this 📎image.jpg caption` (ek + metin)                          | 2 Webhook                    | İki tur                                 | Tek tur: metin + görsel                                                    |
| `/status` (tek başına komut)                                          | 1 Webhook                    | Anında gönderim                         | **Pencere sonuna kadar bekle, sonra gönder**                               |
| Tek başına yapıştırılmış URL                                          | 1 Webhook                    | Anında gönderim                         | Anında gönderim (kovada yalnızca bir giriş var)                            |
| Metin + URL'nin dakikalar arayla bilinçli olarak iki ayrı mesaj gönderilmesi | Pencere dışında 2 Webhook | İki tur                                 | İki tur (aralarında pencerenin süresi dolar)                              |
| Hızlı akış (> pencere içinde 10 küçük DM)                             | N Webhook                    | N tur                                   | Tek tur, sınırlı çıktı (ilk + en son, metin/ek sınırları uygulanır)        |

### Bölünmüş gönderim birleştirme için sorun giderme

Bayrak açık olduğu hâlde bölünmüş gönderimler yine iki tur olarak geliyorsa her katmanı kontrol edin:

1. **Yapılandırma gerçekten yüklendi mi?**

   ```
   grep coalesceSameSenderDms ~/.openclaw/openclaw.json
   ```

   Ardından `openclaw gateway restart` — bu bayrak debouncer kayıt defteri oluşturulurken okunur.

2. **Debounce penceresi kurulumunuz için yeterince geniş mi?** BlueBubbles sunucu günlüğüne `~/Library/Logs/bluebubbles-server/main.log` altında bakın:

   ```
   grep -E "Dispatching event to webhook" main.log | tail -20
   ```

   Ardışık `"Dump"` tarzı metin gönderimi ile onu izleyen `"https://..."; Attachments:` gönderimi arasındaki farkı ölçün. `messages.inbound.byChannel.bluebubbles` değerini bu aralığı rahatça kapsayacak şekilde artırın.

3. **Oturum JSONL zaman damgaları ≠ Webhook varış zamanı.** Oturum olay zaman damgaları (`~/.openclaw/agents/<id>/sessions/*.jsonl`), Webhook'in varış zamanını değil, Gateway'nin mesajı agent'a verdiği zamanı yansıtır. `[Queued messages while agent was busy]` etiketli sıraya alınmış ikinci mesaj, ikinci Webhook geldiğinde ilk turun hâlâ çalıştığı anlamına gelir — birleştirme kovası zaten boşaltılmıştır. Pencereyi oturum günlüğüne göre değil, BB sunucu günlüğüne göre ayarlayın.

4. **Bellek baskısı yanıt gönderimini yavaşlatıyor olabilir.** Daha küçük makinelerde (8 GB), agent turları o kadar uzun sürebilir ki birleştirme kovası yanıt tamamlanmadan boşalır ve URL sıraya alınmış ikinci tur olarak gelir. `memory_pressure` ve `ps -o rss -p $(pgrep openclaw-gateway)` çıktısını kontrol edin; Gateway yaklaşık 500 MB RSS üzerindeyse ve sıkıştırıcı etkinse, diğer ağır süreçleri kapatın veya daha büyük bir ana bilgisayara geçin.

5. **Yanıt-alıntı gönderimleri farklı bir yoldur.** Kullanıcı `Dump` mesajını mevcut bir URL balonuna **yanıt** olarak gönderdiyse (iMessage, Dump balonunda "1 Reply" rozeti gösterir), URL ikinci bir Webhook içinde değil `replyToBody` içinde bulunur. Birleştirme burada uygulanmaz — bu, debouncer değil skill/prompt meselesidir.

## Blok akışı

Yanıtların tek bir mesaj olarak mı gönderileceğini yoksa bloklar hâlinde mi akıtılacağını kontrol edin:

```json5
{
  channels: {
    bluebubbles: {
      blockStreaming: true, // blok akışını etkinleştir (varsayılan olarak kapalı)
    },
  },
}
```

## Medya + sınırlar

- Gelen ekler indirilir ve medya önbelleğinde saklanır.
- Gelen ve giden medya için medya üst sınırı `channels.bluebubbles.mediaMaxMb` üzerinden ayarlanır (varsayılan: 8 MB).
- Giden metin `channels.bluebubbles.textChunkLimit` değerine göre parçalara ayrılır (varsayılan: 4000 karakter).

## Yapılandırma başvurusu

Tam yapılandırma: [Configuration](/tr/gateway/configuration)

Sağlayıcı seçenekleri:

- `channels.bluebubbles.enabled`: Kanalı etkinleştirir/devre dışı bırakır.
- `channels.bluebubbles.serverUrl`: BlueBubbles REST API temel URL'si.
- `channels.bluebubbles.password`: API parolası.
- `channels.bluebubbles.webhookPath`: Webhook uç nokta yolu (varsayılan: `/bluebubbles-webhook`).
- `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled` (varsayılan: `pairing`).
- `channels.bluebubbles.allowFrom`: DM izin listesi (handle'lar, e-postalar, E.164 numaraları, `chat_id:*`, `chat_guid:*`).
- `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled` (varsayılan: `allowlist`).
- `channels.bluebubbles.groupAllowFrom`: Grup gönderici izin listesi.
- `channels.bluebubbles.enrichGroupParticipantsFromContacts`: macOS'te, geçitleme geçtikten sonra adsız grup katılımcılarını isteğe bağlı olarak yerel Contacts verileriyle zenginleştirir. Varsayılan: `false`.
- `channels.bluebubbles.groups`: Grup başına yapılandırma (`requireMention` vb.).
- `channels.bluebubbles.sendReadReceipts`: Okundu bilgileri gönderir (varsayılan: `true`).
- `channels.bluebubbles.blockStreaming`: Blok akışını etkinleştirir (varsayılan: `false`; yanıt akışı için gereklidir).
- `channels.bluebubbles.textChunkLimit`: Karakter cinsinden giden parça boyutu (varsayılan: 4000).
- `channels.bluebubbles.sendTimeoutMs`: `/api/v1/message/text` üzerinden yapılan giden metin gönderimleri için istek başına ms cinsinden zaman aşımı (varsayılan: 30000). Private API iMessage gönderimlerinin iMessage framework içinde 60+ saniye takılabildiği macOS 26 kurulumlarında bu değeri yükseltin; örneğin `45000` veya `60000`. Yoklamalar, sohbet aramaları, tepkiler, düzenlemeler ve sağlık kontrolleri şu anda daha kısa olan 10 saniyelik varsayılanı kullanmaya devam eder; kapsamın tepkiler ve düzenlemeleri de içerecek şekilde genişletilmesi takip eden bir çalışma olarak planlanmıştır. Hesap başına geçersiz kılma: `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`.
- `channels.bluebubbles.chunkMode`: `length` (varsayılan), yalnızca `textChunkLimit` aşıldığında böler; `newline`, uzunluğa göre bölmeden önce boş satırlarda (paragraf sınırları) böler.
- `channels.bluebubbles.mediaMaxMb`: MB cinsinden gelen/giden medya üst sınırı (varsayılan: 8).
- `channels.bluebubbles.mediaLocalRoots`: Giden yerel medya yolları için izin verilen mutlak yerel dizinlerin açık izin listesi. Bu ayar yapılandırılmadıkça yerel yol gönderimleri varsayılan olarak reddedilir. Hesap başına geçersiz kılma: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`.
- `channels.bluebubbles.coalesceSameSenderDms`: Apple'ın metin+URL bölünmüş gönderimlerinin tek mesaj olarak ulaşması için art arda gelen aynı göndericiye ait DM Webhook'lerini tek bir agent turunda birleştirir (varsayılan: `false`). Senaryolar, pencere ayarı ve ödünleşimler için bkz. [Bölünmüş gönderilen DM'leri birleştirme](#coalescing-split-send-dms-command--url-in-one-composition). Açık bir `messages.inbound.byChannel.bluebubbles` tanımlanmadan etkinleştirildiğinde varsayılan gelen debounce penceresini 500 ms'den 2500 ms'ye genişletir.
- `channels.bluebubbles.historyLimit`: Bağlam için en fazla grup mesajı sayısı (0 devre dışı bırakır).
- `channels.bluebubbles.dmHistoryLimit`: DM geçmiş sınırı.
- `channels.bluebubbles.actions`: Belirli eylemleri etkinleştirir/devre dışı bırakır.
- `channels.bluebubbles.accounts`: Çoklu hesap yapılandırması.

İlgili genel seçenekler:

- `agents.list[].groupChat.mentionPatterns` (veya `messages.groupChat.mentionPatterns`).
- `messages.responsePrefix`.

## Adresleme / teslim hedefleri

Kararlı yönlendirme için `chat_guid` tercih edin:

- `chat_guid:iMessage;-;+15555550123` (gruplar için tercih edilir)
- `chat_id:123`
- `chat_identifier:...`
- Doğrudan handle'lar: `+15555550123`, `user@example.com`
  - Doğrudan bir handle için mevcut bir DM sohbeti yoksa OpenClaw bunu `POST /api/v1/chat/new` ile oluşturur. Bunun için BlueBubbles Private API'nin etkin olması gerekir.

### iMessage ve SMS yönlendirmesi

Aynı handle'ın Mac'te hem iMessage hem de SMS sohbeti olduğunda (örneğin iMessage'a kayıtlı bir telefon numarası aynı zamanda yeşil baloncuk geri dönüşleri de aldıysa), OpenClaw iMessage sohbetini tercih eder ve sessizce SMS'e düşürmez. SMS sohbetini zorlamak için açık bir `sms:` hedef öneki kullanın (örneğin `sms:+15555550123`). Eşleşen bir iMessage sohbeti olmayan handle'lar yine de BlueBubbles'ın bildirdiği sohbet üzerinden gönderilir.

## Güvenlik

- Webhook istekleri, `guid`/`password` sorgu parametreleri veya üstbilgileri `channels.bluebubbles.password` ile karşılaştırılarak kimlik doğrulanır.
- API parolasını ve Webhook uç noktasını gizli tutun (kimlik bilgileri gibi değerlendirin).
- BlueBubbles Webhook kimlik doğrulaması için localhost baypası yoktur. Webhook trafiğini proxy'liyorsanız BlueBubbles parolasını isteğin baştan sona içinde tutun. Burada `gateway.trustedProxies`, `channels.bluebubbles.password` yerine geçmez. Bkz. [Gateway security](/tr/gateway/security#reverse-proxy-configuration).
- BlueBubbles sunucusunu LAN dışına açıyorsanız HTTPS + güvenlik duvarı kurallarını etkinleştirin.

## Sorun giderme

- Yazma/okundu olayları çalışmayı durdurursa BlueBubbles Webhook günlüklerini kontrol edin ve Gateway yolunun `channels.bluebubbles.webhookPath` ile eşleştiğini doğrulayın.
- Eşleştirme kodları bir saat sonra sona erer; `openclaw pairing list bluebubbles` ve `openclaw pairing approve bluebubbles <code>` komutlarını kullanın.
- Tepkiler için BlueBubbles Private API (`POST /api/v1/message/react`) gerekir; sunucu sürümünün bunu sunduğundan emin olun.
- Düzenleme/geri alma için macOS 13+ ve uyumlu bir BlueBubbles sunucu sürümü gerekir. macOS 26'da (Tahoe), private API değişiklikleri nedeniyle düzenleme şu anda bozuktur.
- Grup simgesi güncellemeleri macOS 26'da (Tahoe) kararsız olabilir: API başarılı dönebilir ancak yeni simge senkronize olmayabilir.
- OpenClaw, BlueBubbles sunucusunun macOS sürümüne göre bilinen bozuk eylemleri otomatik olarak gizler. Düzenleme macOS 26'da (Tahoe) hâlâ görünüyorsa `channels.bluebubbles.actions.edit=false` ile elle devre dışı bırakın.
- `coalesceSameSenderDms` etkin olduğu hâlde bölünmüş gönderimler (örn. `Dump` + URL) yine iki tur olarak geliyorsa [bölünmüş gönderim birleştirme için sorun giderme](#split-send-coalescing-troubleshooting) kontrol listesini inceleyin — yaygın nedenler arasında çok dar debounce penceresi, oturum günlüğü zaman damgalarının Webhook varışı sanılması veya bir yanıt-alıntı gönderimi (`replyToBody` kullanır, ikinci bir Webhook kullanmaz) bulunur.
- Durum/sağlık bilgileri için: `openclaw status --all` veya `openclaw status --deep`.

Genel kanal iş akışı başvurusu için bkz. [Channels](/tr/channels) ve [Plugins](/tr/tools/plugin) kılavuzu.

## İlgili

- [Kanallara Genel Bakış](/tr/channels) — desteklenen tüm kanallar
- [Eşleştirme](/tr/channels/pairing) — DM kimlik doğrulaması ve eşleştirme akışı
- [Gruplar](/tr/channels/groups) — grup sohbeti davranışı ve mention geçitlemesi
- [Kanal Yönlendirme](/tr/channels/channel-routing) — mesajlar için oturum yönlendirmesi
- [Güvenlik](/tr/gateway/security) — erişim modeli ve sağlamlaştırma
