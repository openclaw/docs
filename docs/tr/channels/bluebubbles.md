---
read_when:
    - BlueBubbles kanalını ayarlama
    - Webhook eşleştirme sorunlarını giderme
    - macOS’te iMessage’i yapılandırma
sidebarTitle: BlueBubbles
summary: BlueBubbles macOS sunucusu üzerinden iMessage (REST gönderme/alma, yazma durumu, tepkiler, eşleştirme, gelişmiş eylemler).
title: BlueBubbles
x-i18n:
    generated_at: "2026-05-06T09:02:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7f2308a016826addc1098937d764b753ee08f3e86f39b0657c930a12b486793f
    source_path: channels/bluebubbles.md
    workflow: 16
---

Status: HTTP üzerinden BlueBubbles macOS sunucusuyla konuşan birlikte gelen Plugin. Eski imsg kanalına kıyasla daha zengin API'si ve daha kolay kurulumu nedeniyle **iMessage entegrasyonu için önerilir**.

<Note>
Mevcut OpenClaw sürümleri BlueBubbles'ı birlikte sunar; bu nedenle normal paketlenmiş derlemeler ayrı bir `openclaw plugins install` adımı gerektirmez.
</Note>

## Genel Bakış

- macOS üzerinde BlueBubbles yardımcı uygulaması aracılığıyla çalışır ([bluebubbles.app](https://bluebubbles.app)).
- Önerilen/test edilen: macOS Sequoia (15). macOS Tahoe (26) çalışır; düzenleme şu anda Tahoe'da bozuktur ve grup simgesi güncellemeleri başarılı bildirebilir ama eşitlenmeyebilir.
- OpenClaw onunla REST API'si üzerinden konuşur (`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`).
- Gelen mesajlar Webhook'lar aracılığıyla ulaşır; giden yanıtlar, yazıyor göstergeleri, okundu bilgileri ve tapback'ler REST çağrılarıdır.
- Ekler ve çıkartmalar gelen medya olarak alınır (ve mümkün olduğunda agente sunulur).
- MP3 veya CAF sesi sentezleyen Otomatik TTS yanıtları, düz dosya eki yerine iMessage sesli not balonları olarak iletilir.
- Eşleştirme/izin listesi diğer kanallarla aynı şekilde çalışır (`/channels/pairing` vb.) ve `channels.bluebubbles.allowFrom` + eşleştirme kodlarını kullanır.
- Tepkiler, Slack/Telegram'da olduğu gibi sistem olayları olarak sunulur; böylece agentler yanıtlamadan önce onlardan "bahsedebilir".
- Gelişmiş özellikler: düzenleme, göndermeyi geri alma, yanıt iş parçacığı, mesaj efektleri, grup yönetimi.

## Hızlı başlangıç

<Steps>
  <Step title="Install BlueBubbles">
    BlueBubbles sunucusunu Mac'inize kurun ([bluebubbles.app/install](https://bluebubbles.app/install) adresindeki talimatları izleyin).
  </Step>
  <Step title="Enable the web API">
    BlueBubbles yapılandırmasında web API'sini etkinleştirin ve bir parola ayarlayın.
  </Step>
  <Step title="Configure OpenClaw">
    `openclaw onboard` komutunu çalıştırıp BlueBubbles'ı seçin veya elle yapılandırın:

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

  </Step>
  <Step title="Point webhooks at the gateway">
    BlueBubbles Webhook'larını gateway'inize yönlendirin (örnek: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`).
  </Step>
  <Step title="Start the gateway">
    Gateway'i başlatın; Webhook işleyicisini kaydeder ve eşleştirmeyi başlatır.
  </Step>
</Steps>

<Warning>
**Güvenlik**

- Her zaman bir Webhook parolası ayarlayın.
- Webhook kimlik doğrulaması her zaman gereklidir. OpenClaw, local loopback/proxy topolojisinden bağımsız olarak, `channels.bluebubbles.password` ile eşleşen bir parola/guid içermeyen BlueBubbles Webhook isteklerini reddeder (örneğin `?password=<password>` veya `x-password`).
- Parola kimlik doğrulaması, tam Webhook gövdeleri okunmadan/ayrıştırılmadan önce denetlenir.

</Warning>

## Messages.app'i canlı tutma (VM / başsız kurulumlar)

Bazı macOS VM / sürekli açık kurulumlarda Messages.app "boşta" kalabilir (uygulama açılana/ön plana getirilene kadar gelen olaylar durur). Basit bir geçici çözüm, AppleScript + LaunchAgent kullanarak **Messages'ı her 5 dakikada bir dürtmektir**.

<Steps>
  <Step title="Save the AppleScript">
    Bunu `~/Scripts/poke-messages.scpt` olarak kaydedin:

    ```applescript
    try
      tell application "Messages"
        if not running then
          launch
        end if

        -- Touch the scripting interface to keep the process responsive.
        set _chatCount to (count of chats)
      end tell
    on error
      -- Ignore transient failures (first-run prompts, locked session, etc).
    end try
    ```

  </Step>
  <Step title="Install a LaunchAgent">
    Bunu `~/Library/LaunchAgents/com.user.poke-messages.plist` olarak kaydedin:

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

    Bu, **her 300 saniyede bir** ve **oturum açıldığında** çalışır. İlk çalıştırma macOS **Automation** istemlerini tetikleyebilir (`osascript` → Messages). Bunları LaunchAgent'ı çalıştıran aynı kullanıcı oturumunda onaylayın.

  </Step>
  <Step title="Load it">
    ```bash
    launchctl unload ~/Library/LaunchAgents/com.user.poke-messages.plist 2>/dev/null || true
    launchctl load ~/Library/LaunchAgents/com.user.poke-messages.plist
    ```
  </Step>
</Steps>

## İlk kurulum

BlueBubbles etkileşimli ilk kurulumda kullanılabilir:

```
openclaw onboard
```

Sihirbaz şunları ister:

<ParamField path="Server URL" type="string" required>
  BlueBubbles sunucu adresi (örn. `http://192.168.1.100:1234`).
</ParamField>
<ParamField path="Password" type="string" required>
  BlueBubbles Server ayarlarından API parolası.
</ParamField>
<ParamField path="Webhook path" type="string" default="/bluebubbles-webhook">
  Webhook uç noktası yolu.
</ParamField>
<ParamField path="DM policy" type="string">
  `pairing`, `allowlist`, `open` veya `disabled`.
</ParamField>
<ParamField path="Allow list" type="string[]">
  Telefon numaraları, e-postalar veya sohbet hedefleri.
</ParamField>

BlueBubbles'ı CLI aracılığıyla da ekleyebilirsiniz:

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## Erişim denetimi (DM'ler + gruplar)

<Tabs>
  <Tab title="DMs">
    - Varsayılan: `channels.bluebubbles.dmPolicy = "pairing"`.
    - Bilinmeyen gönderenler bir eşleştirme kodu alır; onaylanana kadar mesajlar yok sayılır (kodlar 1 saat sonra sona erer).
    - Şununla onaylayın:
      - `openclaw pairing list bluebubbles`
      - `openclaw pairing approve bluebubbles <CODE>`
    - Eşleştirme varsayılan token değişimidir. Ayrıntılar: [Eşleştirme](/tr/channels/pairing)

  </Tab>
  <Tab title="Groups">
    - `channels.bluebubbles.groupPolicy = open | allowlist | disabled` (varsayılan: `allowlist`).
    - `channels.bluebubbles.groupAllowFrom`, `allowlist` ayarlandığında gruplarda kimin tetikleyebileceğini denetler.

  </Tab>
</Tabs>

### Kişi adı zenginleştirme (macOS, isteğe bağlı)

BlueBubbles grup Webhook'ları çoğu zaman yalnızca ham katılımcı adreslerini içerir. `GroupMembers` bağlamının bunun yerine yerel kişi adlarını göstermesini istiyorsanız, macOS'ta yerel Kişiler zenginleştirmesine kaydolabilirsiniz:

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` aramayı etkinleştirir. Varsayılan: `false`.
- Aramalar yalnızca grup erişimi, komut yetkilendirmesi ve bahsetme kapısı mesajın geçmesine izin verdikten sonra çalışır.
- Yalnızca adı olmayan telefon katılımcıları zenginleştirilir.
- Yerel eşleşme bulunmadığında ham telefon numaraları yedek değer olarak kalır.

```json5
{
  channels: {
    bluebubbles: {
      enrichGroupParticipantsFromContacts: true,
    },
  },
}
```

### Bahsetme kapısı (gruplar)

BlueBubbles, iMessage/WhatsApp davranışıyla eşleşen grup sohbetleri için bahsetme kapısını destekler:

- Bahsetmeleri algılamak için `agents.list[].groupChat.mentionPatterns` (veya `messages.groupChat.mentionPatterns`) kullanır.
- Bir grup için `requireMention` etkinleştirildiğinde agent yalnızca kendisinden bahsedildiğinde yanıt verir.
- Yetkili gönderenlerden gelen denetim komutları bahsetme kapısını atlar.

Grup başına yapılandırma:

```json5
{
  channels: {
    bluebubbles: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123"],
      groups: {
        "*": { requireMention: true }, // default for all groups
        "iMessage;-;chat123": { requireMention: false }, // override for specific group
      },
    },
  },
}
```

### Komut kapısı

- Denetim komutları (örn. `/config`, `/model`) yetkilendirme gerektirir.
- Komut yetkilendirmesini belirlemek için `allowFrom` ve `groupAllowFrom` kullanır.
- Yetkili gönderenler, gruplarda bahsetmeden bile denetim komutlarını çalıştırabilir.

### Grup başına sistem istemi

`channels.bluebubbles.groups.*` altındaki her giriş isteğe bağlı bir `systemPrompt` dizesi kabul eder. Değer, o gruptaki bir mesajı işleyen her turda agentın sistem istemine enjekte edilir; böylece agent istemlerini düzenlemeden grup başına persona veya davranış kuralları ayarlayabilirsiniz:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;-;chat123": {
          systemPrompt: "Keep responses under 3 sentences. Mirror the group's casual tone.",
        },
      },
    },
  },
}
```

Anahtar, BlueBubbles'ın grup için `chatGuid` / `chatIdentifier` / sayısal `chatId` olarak bildirdiği değerle eşleşir ve `"*"` joker karakter girişi, tam eşleşmesi olmayan her grup için bir varsayılan sağlar (`requireMention` ve grup başına araç ilkeleri tarafından kullanılan aynı örüntü). Tam eşleşmeler her zaman joker karaktere üstün gelir. DM'ler bu alanı yok sayar; bunun yerine agent düzeyinde veya hesap düzeyinde istem özelleştirmesi kullanın.

#### Çalışılmış örnek: iş parçacıklı yanıtlar ve tapback tepkileri (Private API)

BlueBubbles Private API etkinleştirildiğinde, gelen mesajlar kısa mesaj kimlikleriyle gelir (örneğin `[[reply_to:5]]`) ve agent belirli bir mesaja iş parçacığı olarak yanıt vermek için `action=reply` çağırabilir veya tapback bırakmak için `action=react` çağırabilir. Grup başına `systemPrompt`, agentın doğru aracı seçmesini sağlamak için güvenilir bir yoldur:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;+;chat-family": {
          systemPrompt: "When replying in this group, always call action=reply with the [[reply_to:N]] messageId from context so your response threads under the triggering message. Never send a new unlinked message. For short acknowledgements ('ok', 'got it', 'on it'), use action=react with an appropriate tapback emoji (❤️, 👍, 😂, ‼️, ❓) instead of sending a text reply.",
        },
      },
    },
  },
}
```

Tapback tepkileri ve iş parçacıklı yanıtların ikisi de BlueBubbles Private API gerektirir; temel mekanikler için [Gelişmiş eylemler](#advanced-actions) ve [Mesaj kimlikleri](#message-ids-short-vs-full) bölümlerine bakın.

## ACP konuşma bağlamaları

BlueBubbles sohbetleri, taşıma katmanını değiştirmeden kalıcı ACP çalışma alanlarına dönüştürülebilir.

Hızlı operatör akışı:

- DM veya izin verilen grup sohbeti içinde `/acp spawn codex --bind here` çalıştırın.
- Aynı BlueBubbles konuşmasındaki gelecekteki mesajlar, oluşturulan ACP oturumuna yönlendirilir.
- `/new` ve `/reset`, aynı bağlı ACP oturumunu yerinde sıfırlar.
- `/acp close`, ACP oturumunu kapatır ve bağlamayı kaldırır.

Yapılandırılmış kalıcı bağlamalar, `type: "acp"` ve `match.channel: "bluebubbles"` içeren üst düzey `bindings[]` girişleri aracılığıyla da desteklenir.

`match.peer.id` desteklenen herhangi bir BlueBubbles hedef biçimini kullanabilir:

- `+15555550123` veya `user@example.com` gibi normalleştirilmiş DM tanıtıcısı
- `chat_id:<id>`
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

Kararlı grup bağlamaları için `chat_id:*` veya `chat_identifier:*` tercih edin.

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

Paylaşılan ACP bağlama davranışı için [ACP Agentleri](/tr/tools/acp-agents) bölümüne bakın.

## Yazıyor + okundu bilgileri

- **Yazıyor göstergeleri**: Yanıt üretiminden önce ve yanıt üretimi sırasında otomatik olarak gönderilir.
- **Okundu bilgileri**: `channels.bluebubbles.sendReadReceipts` tarafından denetlenir (varsayılan: `true`).
- **Yazıyor göstergeleri**: OpenClaw yazıyor başlangıç olayları gönderir; BlueBubbles yazıyor durumunu gönderim veya zaman aşımında otomatik olarak temizler (DELETE ile elle durdurma güvenilir değildir).

```json5
{
  channels: {
    bluebubbles: {
      sendReadReceipts: false, // disable read receipts
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
        reactions: true, // tapbacks (default: true)
        edit: true, // edit sent messages (macOS 13+, broken on macOS 26 Tahoe)
        unsend: true, // unsend messages (macOS 13+)
        reply: true, // reply threading by message GUID
        sendWithEffect: true, // message effects (slam, loud, etc.)
        renameGroup: true, // rename group chats
        setGroupIcon: true, // set group chat icon/photo (flaky on macOS 26 Tahoe)
        addParticipant: true, // add participants to groups
        removeParticipant: true, // remove participants from groups
        leaveGroup: true, // leave group chats
        sendAttachment: true, // send attachments/media
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Available actions">
    - **react**: Tapback tepkileri ekleyin/kaldırın (`messageId`, `emoji`, `remove`). iMessage'ın yerel tapback kümesi `love`, `like`, `dislike`, `laugh`, `emphasize` ve `question` değerlerinden oluşur. Bir ajan bu kümenin dışında bir emoji seçtiğinde (örneğin `👀`), tepki aracı `love` değerine geri döner; böylece tapback, tüm isteği başarısız yapmak yerine yine de görüntülenir. Yapılandırılmış onay tepkileri yine de katı biçimde doğrulanır ve bilinmeyen değerlerde hata verir.
    - **edit**: Gönderilmiş bir mesajı düzenleyin (`messageId`, `text`).
    - **unsend**: Bir mesajı geri alın (`messageId`).
    - **reply**: Belirli bir mesaja yanıt verin (`messageId`, `text`, `to`).
    - **sendWithEffect**: iMessage efektiyle gönderin (`text`, `to`, `effectId`).
    - **renameGroup**: Bir grup sohbetini yeniden adlandırın (`chatGuid`, `displayName`).
    - **setGroupIcon**: Bir grup sohbetinin simgesini/fotoğrafını ayarlayın (`chatGuid`, `media`) - macOS 26 Tahoe'da kararsızdır (API başarı döndürebilir ancak simge eşitlenmeyebilir).
    - **addParticipant**: Bir gruba birini ekleyin (`chatGuid`, `address`).
    - **removeParticipant**: Bir gruptan birini kaldırın (`chatGuid`, `address`).
    - **leaveGroup**: Bir grup sohbetinden ayrılın (`chatGuid`).
    - **upload-file**: Medya/dosya gönderin (`to`, `buffer`, `filename`, `asVoice`).
      - Sesli notlar: Bir iMessage sesli mesajı olarak göndermek için **MP3** veya **CAF** sesle `asVoice: true` ayarlayın. BlueBubbles, sesli not gönderirken MP3 → CAF dönüştürür.
    - Eski takma ad: `sendAttachment` hâlâ çalışır, ancak kanonik eylem adı `upload-file` değeridir.

  </Accordion>
</AccordionGroup>

### Mesaj kimlikleri (kısa ve tam)

OpenClaw token tasarrufu için _kısa_ mesaj kimlikleri (ör. `1`, `2`) gösterebilir.

- `MessageSid` / `ReplyToId` kısa kimlikler olabilir.
- `MessageSidFull` / `ReplyToIdFull` sağlayıcının tam kimliklerini içerir.
- Kısa kimlikler bellektedir; yeniden başlatmada veya önbellek temizliğinde süresi dolabilir.
- Eylemler kısa veya tam `messageId` kabul eder, ancak kısa kimlikler artık kullanılabilir değilse hata verir.

Dayanıklı otomasyonlar ve depolama için tam kimlikleri kullanın:

- Şablonlar: `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- Bağlam: Gelen yüklerde `MessageSidFull` / `ReplyToIdFull`

Şablon değişkenleri için [Yapılandırma](/tr/gateway/configuration) bölümüne bakın.

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## Bölünmüş gönderimli DM'leri birleştirme (tek kompozisyonda komut + URL)

Bir kullanıcı iMessage içinde bir komut ve URL'yi birlikte yazdığında - ör. `Dump https://example.com/article` - Apple gönderimi **iki ayrı Webhook teslimatına** böler:

1. Bir metin mesajı (`"Dump"`).
2. Ek olarak OG önizleme görselleriyle birlikte bir URL önizleme balonu (`"https://..."`).

Çoğu kurulumda iki Webhook OpenClaw'a yaklaşık 0,8-2,0 sn arayla ulaşır. Birleştirme olmadan ajan 1. turda yalnızca komutu alır, yanıt verir (çoğunlukla "bana URL'yi gönder") ve URL'yi ancak 2. turda görür; bu noktada komut bağlamı zaten kaybolmuştur.

`channels.bluebubbles.coalesceSameSenderDms`, bir DM'i aynı gönderenin art arda gelen Webhook'larını tek bir ajan turunda birleştirmeye dahil eder. Grup sohbetleri, çok kullanıcılı tur yapısı korunsun diye mesaj başına anahtarlamaya devam eder.

<Tabs>
  <Tab title="When to enable">
    Şu durumlarda etkinleştirin:

    - Tek mesajda `command + payload` bekleyen Skills gönderiyorsunuz (dump, paste, save, queue vb.).
    - Kullanıcılarınız komutların yanında URL'ler, görseller veya uzun içerikler yapıştırıyor.
    - Eklenen DM tur gecikmesini kabul edebilirsiniz (aşağıya bakın).

    Şu durumlarda devre dışı bırakın:

    - Tek sözcüklü DM tetikleyicileri için en düşük komut gecikmesine ihtiyacınız var.
    - Tüm akışlarınız, yük devamı olmayan tek seferlik komutlardan oluşuyor.

  </Tab>
  <Tab title="Enabling">
    ```json5
    {
      channels: {
        bluebubbles: {
          coalesceSameSenderDms: true, // opt in (default: false)
        },
      },
    }
    ```

    Bayrak açıkken ve açıkça `messages.inbound.byChannel.bluebubbles` yokken, debounce penceresi **2500 ms** değerine genişler (birleştirme dışı varsayılan 500 ms'dir). Daha geniş pencere gereklidir; Apple'ın 0,8-2,0 sn'lik bölünmüş gönderim temposu daha dar varsayılana sığmaz.

    Pencereyi kendiniz ayarlamak için:

    ```json5
    {
      messages: {
        inbound: {
          byChannel: {
            // 2500 ms works for most setups; raise to 4000 ms if your Mac is slow
            // or under memory pressure (observed gap can stretch past 2 s then).
            bluebubbles: 2500,
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="Trade-offs">
    - **DM denetim komutları için ek gecikme.** Bayrak açıkken DM denetim-komutu mesajları (`Dump`, `Save` vb.) artık bir yük Webhook'u gelebilir diye gönderilmeden önce debounce penceresine kadar bekler. Grup sohbeti komutları anında gönderimi korur.
    - **Birleştirilmiş çıktı sınırlıdır** - birleştirilmiş metin, açık bir `…[truncated]` işaretiyle 4000 karakterde sınırlandırılır; ekler 20 ile sınırlandırılır; kaynak girdileri 10 ile sınırlandırılır (bunun ötesinde ilk-artı-en-yeni tutulur). Her kaynak `messageId`, gelen tekilleştirmeye yine ulaşır; böylece herhangi bir tekil olayın daha sonra MessagePoller tarafından yeniden oynatılması yinelenen olarak tanınır.
    - **Kanal başına dahil etme.** Diğer kanallar (Telegram, WhatsApp, Slack, …) etkilenmez.

  </Tab>
</Tabs>

### Senaryolar ve ajanın gördüğü

| Kullanıcı kompozisyonu                                             | Apple teslimatı          | Bayrak kapalı (varsayılan)              | Bayrak açık + 2500 ms pencere                                           |
| ------------------------------------------------------------------ | ------------------------ | --------------------------------------- | ----------------------------------------------------------------------- |
| `Dump https://example.com` (tek gönderim)                          | ~1 sn arayla 2 Webhook   | İki ajan turu: yalnızca "Dump", sonra URL | Tek tur: birleştirilmiş metin `Dump https://example.com`                |
| `Save this 📎image.jpg caption` (ek + metin)                       | 2 Webhook                | İki tur                                 | Tek tur: metin + görsel                                                 |
| `/status` (bağımsız komut)                                         | 1 Webhook                | Anında gönderim                         | **Pencereye kadar bekle, sonra gönder**                                 |
| Yalnız yapıştırılan URL                                            | 1 Webhook                | Anında gönderim                         | Anında gönderim (kovada yalnızca bir girdi)                             |
| Dakikalar arayla kasıtlı olarak iki ayrı mesaj halinde gönderilen metin + URL | Pencere dışında 2 Webhook | İki tur                                 | İki tur (pencere aralarında sona erer)                                  |
| Hızlı akın (pencere içinde >10 küçük DM)                           | N Webhook                | N tur                                   | Tek tur, sınırlı çıktı (ilk + en yeni, metin/ek sınırları uygulanır)    |

### Bölünmüş gönderim birleştirme sorun giderme

Bayrak açıksa ve bölünmüş gönderimler hâlâ iki tur olarak geliyorsa, her katmanı kontrol edin:

<AccordionGroup>
  <Accordion title="Config actually loaded">
    ```
    grep coalesceSameSenderDms ~/.openclaw/openclaw.json
    ```

    Sonra `openclaw gateway restart` çalıştırın; bayrak, debouncer-registry oluşturulurken okunur.

  </Accordion>
  <Accordion title="Debounce window wide enough for your setup">
    `~/Library/Logs/bluebubbles-server/main.log` altındaki BlueBubbles sunucu günlüğüne bakın:

    ```
    grep -E "Dispatching event to webhook" main.log | tail -20
    ```

    `"Dump"` tarzı metin gönderimi ile ardından gelen `"https://..."; Attachments:` gönderimi arasındaki boşluğu ölçün. Bu boşluğu rahatça kapsayacak şekilde `messages.inbound.byChannel.bluebubbles` değerini yükseltin.

  </Accordion>
  <Accordion title="Session JSONL timestamps ≠ webhook arrival">
    Oturum olay zaman damgaları (`~/.openclaw/agents/<id>/sessions/*.jsonl`), Webhook'un geldiği zamanı **değil**, Gateway'in bir mesajı ajana verdiği zamanı yansıtır. `[Queued messages while agent was busy]` etiketli kuyruğa alınmış ikinci mesaj, ikinci Webhook geldiğinde ilk turun hâlâ çalıştığı anlamına gelir; birleştirme kovası zaten boşaltılmıştır. Pencereyi oturum günlüğüne göre değil, BB sunucu günlüğüne göre ayarlayın.
  </Accordion>
  <Accordion title="Memory pressure slowing reply dispatch">
    Daha küçük makinelerde (8 GB), ajan turları yeterince uzun sürebilir; bu yüzden birleştirme kovası yanıt tamamlanmadan önce boşalır ve URL kuyruğa alınmış ikinci tur olarak gelir. `memory_pressure` ve `ps -o rss -p $(pgrep openclaw-gateway)` çıktısını kontrol edin; Gateway ~500 MB RSS üzerindeyse ve sıkıştırıcı etkinse, diğer ağır süreçleri kapatın veya daha büyük bir ana makineye geçin.
  </Accordion>
  <Accordion title="Reply-quote sends are a different path">
    Kullanıcı `Dump` öğesine mevcut bir URL balonuna **yanıt** olarak dokunduysa (iMessage, Dump balonunda "1 Reply" rozeti gösterir), URL ikinci bir Webhook'ta değil `replyToBody` içinde yaşar. Birleştirme uygulanmaz; bu bir debouncer konusu değil, Skills/istem konusudur.
  </Accordion>
</AccordionGroup>

## Blok akışı

Yanıtların tek mesaj olarak mı yoksa bloklar halinde akışla mı gönderileceğini denetleyin:

```json5
{
  channels: {
    bluebubbles: {
      blockStreaming: true, // enable block streaming (off by default)
    },
  },
}
```

## Medya + sınırlar

- Gelen ekler indirilir ve medya önbelleğinde saklanır.
- Gelen ve giden medya için `channels.bluebubbles.mediaMaxMb` üzerinden medya sınırı (varsayılan: 8 MB).
- Giden metin `channels.bluebubbles.textChunkLimit` değerine göre parçalanır (varsayılan: 4000 karakter).

## Yapılandırma başvurusu

Tam yapılandırma: [Yapılandırma](/tr/gateway/configuration)

<AccordionGroup>
  <Accordion title="Connection and webhook">
    - `channels.bluebubbles.enabled`: Kanalı etkinleştirin/devre dışı bırakın.
    - `channels.bluebubbles.serverUrl`: BlueBubbles REST API taban URL'si.
    - `channels.bluebubbles.password`: API parolası.
    - `channels.bluebubbles.webhookPath`: Webhook uç noktası yolu (varsayılan: `/bluebubbles-webhook`).

  </Accordion>
  <Accordion title="Access policy">
    - `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled` (varsayılan: `pairing`).
    - `channels.bluebubbles.allowFrom`: DM izin listesi (tanıtıcılar, e-postalar, E.164 numaraları, `chat_id:*`, `chat_guid:*`).
    - `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled` (varsayılan: `allowlist`).
    - `channels.bluebubbles.groupAllowFrom`: Grup gönderen izin listesi.
    - `channels.bluebubbles.enrichGroupParticipantsFromContacts`: macOS'ta, geçit denetimleri geçtikten sonra adsız grup katılımcılarını isteğe bağlı olarak yerel Kişiler'den zenginleştirin. Varsayılan: `false`.
    - `channels.bluebubbles.groups`: Grup başına yapılandırma (`requireMention` vb.).

  </Accordion>
  <Accordion title="Teslim ve parçalama">
    - `channels.bluebubbles.sendReadReceipts`: Okundu bilgisi gönder (varsayılan: `true`).
    - `channels.bluebubbles.blockStreaming`: Blok akışını etkinleştir (varsayılan: `false`; akışlı yanıtlar için gereklidir).
    - `channels.bluebubbles.textChunkLimit`: Giden parça boyutu, karakter cinsinden (varsayılan: 4000).
    - `channels.bluebubbles.sendTimeoutMs`: `/api/v1/message/text` üzerinden giden metin gönderimleri için istek başına zaman aşımı, ms cinsinden (varsayılan: 30000). Private API iMessage gönderimlerinin iMessage framework içinde 60+ saniye takılabildiği macOS 26 kurulumlarında artırın; örneğin `45000` veya `60000`. Yoklamalar, sohbet aramaları, tepkiler, düzenlemeler ve sağlık kontrolleri şu anda daha kısa 10 sn varsayılanını korur; kapsamın tepkilere ve düzenlemelere genişletilmesi devam işi olarak planlanmıştır. Hesap başına geçersiz kılma: `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`.
    - `channels.bluebubbles.chunkMode`: `length` (varsayılan), yalnızca `textChunkLimit` aşıldığında böler; `newline`, uzunluğa göre parçalamadan önce boş satırlarda (paragraf sınırlarında) böler.

  </Accordion>
  <Accordion title="Medya ve geçmiş">
    - `channels.bluebubbles.mediaMaxMb`: Gelen/giden medya sınırı, MB cinsinden (varsayılan: 8).
    - `channels.bluebubbles.mediaLocalRoots`: Giden yerel medya yolları için izin verilen mutlak yerel dizinlerin açık izin listesi. Bu yapılandırılmadıkça yerel yol gönderimleri varsayılan olarak reddedilir. Hesap başına geçersiz kılma: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`.
    - `channels.bluebubbles.coalesceSameSenderDms`: Apple'ın metin+URL ayrık gönderimi tek mesaj olarak gelsin diye, aynı gönderenden gelen ardışık DM webhook'larını tek bir agent turunda birleştirir (varsayılan: `false`). Senaryolar, pencere ayarı ve ödünleşimler için [Ayrık gönderilen DM'leri birleştirme](#coalescing-split-send-dms-command--url-in-one-composition) bölümüne bakın. Açık bir `messages.inbound.byChannel.bluebubbles` olmadan etkinleştirildiğinde varsayılan gelen debounce penceresini 500 ms'den 2500 ms'ye genişletir.
    - `channels.bluebubbles.historyLimit`: Bağlam için en fazla grup mesajı (0 devre dışı bırakır).
    - `channels.bluebubbles.dmHistoryLimit`: DM geçmiş sınırı.
    - `channels.bluebubbles.replyContextApiFallback`: Gelen bir yanıt `replyToBody`/`replyToSender` olmadan ulaştığında ve bellek içi yanıt bağlamı önbelleğinde kaçırma olduğunda, özgün mesajı BlueBubbles HTTP API'sinden en iyi çaba yedek yolu olarak getirir (varsayılan: `false`). Tek BlueBubbles hesabını paylaşan çok örnekli dağıtımlar, işlem yeniden başlatmaları sonrası veya uzun ömürlü TTL/LRU önbellek tahliyesinden sonra yararlıdır. Getirme, diğer tüm BlueBubbles istemci istekleriyle aynı ilke tarafından SSRF'ye karşı korunur, asla hata fırlatmaz ve önbelleği doldurarak sonraki yanıtların maliyetini yayar. Hesap başına geçersiz kılma: `channels.bluebubbles.accounts.<accountId>.replyContextApiFallback`. Kanal düzeyindeki ayar, bayrağı atlayan hesaplara yayılır.

  </Accordion>
  <Accordion title="Eylemler ve hesaplar">
    - `channels.bluebubbles.actions`: Belirli eylemleri etkinleştir/devre dışı bırak.
    - `channels.bluebubbles.accounts`: Çok hesaplı yapılandırma.

  </Accordion>
</AccordionGroup>

İlgili genel seçenekler:

- `agents.list[].groupChat.mentionPatterns` (veya `messages.groupChat.mentionPatterns`).
- `messages.responsePrefix`.

## Adresleme / teslim hedefleri

Kararlı yönlendirme için `chat_guid` tercih edin:

- `chat_guid:iMessage;-;+15555550123` (gruplar için tercih edilir)
- `chat_id:123`
- `chat_identifier:...`
- Doğrudan tanıtıcılar: `+15555550123`, `user@example.com`
  - Doğrudan tanıtıcının mevcut bir DM sohbeti yoksa OpenClaw, `POST /api/v1/chat/new` aracılığıyla bir tane oluşturur. Bu, BlueBubbles Private API'nin etkinleştirilmesini gerektirir.

### iMessage ve SMS yönlendirmesi

Aynı tanıtıcının Mac üzerinde hem iMessage hem de SMS sohbeti olduğunda (örneğin iMessage'a kayıtlı ama yeşil baloncuk yedekleri de almış bir telefon numarası), OpenClaw iMessage sohbetini tercih eder ve sessizce SMS'e düşürmez. SMS sohbetini zorlamak için açık bir `sms:` hedef öneki kullanın (örneğin `sms:+15555550123`). Eşleşen bir iMessage sohbeti olmayan tanıtıcılar, yine BlueBubbles'ın bildirdiği sohbet üzerinden gönderilir.

## Güvenlik

- Webhook istekleri, `guid`/`password` sorgu parametreleri veya başlıkları `channels.bluebubbles.password` ile karşılaştırılarak doğrulanır.
- API parolasını ve webhook uç noktasını gizli tutun (bunları kimlik bilgileri gibi ele alın).
- BlueBubbles webhook kimlik doğrulaması için localhost atlatması yoktur. Webhook trafiğini proxy'liyorsanız BlueBubbles parolasını istekte uçtan uca koruyun. `gateway.trustedProxies` burada `channels.bluebubbles.password` yerine geçmez. [Gateway güvenliği](/tr/gateway/security#reverse-proxy-configuration) bölümüne bakın.
- LAN dışına açıyorsanız BlueBubbles sunucusunda HTTPS + güvenlik duvarı kurallarını etkinleştirin.

## Sorun giderme

- Yazıyor/okundu olayları çalışmayı durdurursa BlueBubbles webhook günlüklerini kontrol edin ve gateway yolunun `channels.bluebubbles.webhookPath` ile eşleştiğini doğrulayın.
- Eşleştirme kodlarının süresi bir saat sonra dolar; `openclaw pairing list bluebubbles` ve `openclaw pairing approve bluebubbles <code>` kullanın.
- Tepkiler BlueBubbles private API'sini (`POST /api/v1/message/react`) gerektirir; sunucu sürümünün bunu sunduğundan emin olun.
- Düzenleme/göndermeyi geri alma macOS 13+ ve uyumlu bir BlueBubbles sunucu sürümü gerektirir. macOS 26 (Tahoe) üzerinde düzenleme, private API değişiklikleri nedeniyle şu anda bozuktur.
- Grup simgesi güncellemeleri macOS 26 (Tahoe) üzerinde kararsız olabilir: API başarı döndürebilir ama yeni simge eşitlenmeyebilir.
- OpenClaw, BlueBubbles sunucusunun macOS sürümüne göre bozuk olduğu bilinen eylemleri otomatik olarak gizler. Düzenleme macOS 26 (Tahoe) üzerinde hâlâ görünüyorsa `channels.bluebubbles.actions.edit=false` ile elle devre dışı bırakın.
- `coalesceSameSenderDms` etkin ama ayrık gönderimler (örn. `Dump` + URL) hâlâ iki tur olarak geliyorsa: [ayrık gönderim birleştirme sorun giderme](#split-send-coalescing-troubleshooting) kontrol listesine bakın - yaygın nedenler çok dar debounce penceresi, oturum günlüğü zaman damgalarının webhook varışı olarak yanlış okunması veya yanıt alıntısı gönderimidir (bu `replyToBody` kullanır, ikinci bir webhook değil).
- Durum/sağlık bilgisi için: `openclaw status --all` veya `openclaw status --deep`.

Genel kanal iş akışı başvurusu için [Kanallar](/tr/channels) ve [Plugins](/tr/tools/plugin) kılavuzuna bakın.

## İlgili

- [Kanal Yönlendirme](/tr/channels/channel-routing) - mesajlar için oturum yönlendirmesi
- [Kanallara Genel Bakış](/tr/channels) - desteklenen tüm kanallar
- [Gruplar](/tr/channels/groups) - grup sohbeti davranışı ve bahsetme kapısı
- [Eşleştirme](/tr/channels/pairing) - DM kimlik doğrulaması ve eşleştirme akışı
- [Güvenlik](/tr/gateway/security) - erişim modeli ve sağlamlaştırma
