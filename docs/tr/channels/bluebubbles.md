---
read_when:
    - BlueBubbles kanalını ayarlama
    - Webhook eşleştirmesinde sorun giderme
    - macOS'ta iMessage'ı yapılandırma
sidebarTitle: BlueBubbles
summary: BlueBubbles macOS sunucusu üzerinden iMessage (REST gönderme/alma, yazıyor göstergesi, tepkiler, eşleştirme, gelişmiş eylemler).
title: BlueBubbles
x-i18n:
    generated_at: "2026-05-01T08:58:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 499cc2a46db6e0eddfb897e96ec4b3e4a39ba9f2f6da8e7485c1c46562de4145
    source_path: channels/bluebubbles.md
    workflow: 16
---

Durum: HTTP üzerinden BlueBubbles macOS sunucusuyla konuşan paketli plugin. Eski imsg kanalına kıyasla daha zengin API'si ve daha kolay kurulumu nedeniyle **iMessage entegrasyonu için önerilir**.

<Note>
Geçerli OpenClaw sürümleri BlueBubbles'ı paketle birlikte sunar, bu yüzden normal paketlenmiş derlemeler ayrı bir `openclaw plugins install` adımına ihtiyaç duymaz.
</Note>

## Genel Bakış

- macOS üzerinde BlueBubbles yardımcı uygulamasıyla çalışır ([bluebubbles.app](https://bluebubbles.app)).
- Önerilen/test edilen: macOS Sequoia (15). macOS Tahoe (26) çalışır; düzenleme şu anda Tahoe'da bozuktur ve grup simgesi güncellemeleri başarılı bildirilebilir ancak eşitlenmeyebilir.
- OpenClaw onunla REST API'si üzerinden konuşur (`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`).
- Gelen mesajlar webhooks aracılığıyla gelir; giden yanıtlar, yazıyor göstergeleri, okundu bilgileri ve tapback'ler REST çağrılarıdır.
- Ekler ve çıkartmalar gelen medya olarak alınır (ve mümkün olduğunda aracıya gösterilir).
- MP3 veya CAF ses sentezleyen otomatik TTS yanıtları, düz dosya ekleri yerine iMessage sesli not balonları olarak teslim edilir.
- Eşleştirme/izin listesi diğer kanallarla aynı şekilde çalışır (`/channels/pairing` vb.) ve `channels.bluebubbles.allowFrom` + eşleştirme kodlarını kullanır.
- Tepkiler, tıpkı Slack/Telegram'da olduğu gibi sistem olayları olarak gösterilir, böylece aracılar yanıtlamadan önce bunlardan "bahsedebilir".
- Gelişmiş özellikler: düzenleme, göndermeyi geri alma, yanıt zincirleme, mesaj efektleri, grup yönetimi.

## Hızlı başlangıç

<Steps>
  <Step title="Install BlueBubbles">
    BlueBubbles sunucusunu Mac'inize kurun ([bluebubbles.app/install](https://bluebubbles.app/install) adresindeki yönergeleri izleyin).
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
    BlueBubbles webhooks hedefini Gateway'inize yönlendirin (örnek: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`).
  </Step>
  <Step title="Start the gateway">
    Gateway'i başlatın; webhook işleyicisini kaydeder ve eşleştirmeyi başlatır.
  </Step>
</Steps>

<Warning>
**Güvenlik**

- Her zaman bir webhook parolası ayarlayın.
- Webhook kimlik doğrulaması her zaman gereklidir. OpenClaw, local loopback/proxy topolojisinden bağımsız olarak `channels.bluebubbles.password` ile eşleşen bir parola/guid içermedikçe BlueBubbles webhook isteklerini reddeder (örneğin `?password=<password>` veya `x-password`).
- Parola kimlik doğrulaması, tam webhook gövdeleri okunmadan/ayrıştırılmadan önce denetlenir.

</Warning>

## Messages.app'i canlı tutma (VM / başsız kurulumlar)

Bazı macOS VM / her zaman açık kurulumlarda Messages.app "boşta" kalabilir (uygulama açılana/ön plana getirilene kadar gelen olaylar durur). Basit bir geçici çözüm, AppleScript + LaunchAgent kullanarak **Messages'ı her 5 dakikada bir dürtmektir**.

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

    Bu **her 300 saniyede bir** ve **oturum açıldığında** çalışır. İlk çalıştırma macOS **Automation** istemlerini tetikleyebilir (`osascript` → Messages). Bunları LaunchAgent'ı çalıştıran aynı kullanıcı oturumunda onaylayın.

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
  BlueBubbles sunucu adresi (ör. `http://192.168.1.100:1234`).
</ParamField>
<ParamField path="Password" type="string" required>
  BlueBubbles Server ayarlarından API parolası.
</ParamField>
<ParamField path="Webhook path" type="string" default="/bluebubbles-webhook">
  Webhook uç nokta yolu.
</ParamField>
<ParamField path="DM policy" type="string">
  `pairing`, `allowlist`, `open` veya `disabled`.
</ParamField>
<ParamField path="Allow list" type="string[]">
  Telefon numaraları, e-postalar veya sohbet hedefleri.
</ParamField>

BlueBubbles'ı CLI üzerinden de ekleyebilirsiniz:

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
    - Eşleştirme varsayılan token alışverişidir. Ayrıntılar: [Eşleştirme](/tr/channels/pairing)

  </Tab>
  <Tab title="Groups">
    - `channels.bluebubbles.groupPolicy = open | allowlist | disabled` (varsayılan: `allowlist`).
    - `channels.bluebubbles.groupAllowFrom`, `allowlist` ayarlandığında gruplarda kimin tetikleyebileceğini denetler.

  </Tab>
</Tabs>

### Kişi adı zenginleştirme (macOS, isteğe bağlı)

BlueBubbles grup webhooks çoğu zaman yalnızca ham katılımcı adreslerini içerir. `GroupMembers` bağlamının bunun yerine yerel kişi adlarını göstermesini istiyorsanız macOS'ta yerel Kişiler zenginleştirmesine katılabilirsiniz:

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` aramayı etkinleştirir. Varsayılan: `false`.
- Aramalar yalnızca grup erişimi, komut yetkilendirmesi ve bahsetme kapısı mesajın geçmesine izin verdikten sonra çalışır.
- Yalnızca adı olmayan telefon katılımcıları zenginleştirilir.
- Yerel eşleşme bulunmadığında ham telefon numaraları geri dönüş olarak kalır.

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
- Bir grup için `requireMention` etkinleştirildiğinde aracı yalnızca kendisinden bahsedildiğinde yanıt verir.
- Yetkili gönderenlerden gelen kontrol komutları bahsetme kapısını atlar.

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

- Kontrol komutları (ör. `/config`, `/model`) yetkilendirme gerektirir.
- Komut yetkilendirmesini belirlemek için `allowFrom` ve `groupAllowFrom` kullanır.
- Yetkili gönderenler gruplarda bahsetmeden bile kontrol komutlarını çalıştırabilir.

### Grup başına sistem istemi

`channels.bluebubbles.groups.*` altındaki her giriş isteğe bağlı bir `systemPrompt` dizesi kabul eder. Değer, o gruptaki bir mesajı işleyen her turda aracının sistem istemine eklenir, böylece aracı istemlerini düzenlemeden grup başına persona veya davranış kuralları ayarlayabilirsiniz:

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

Anahtar, BlueBubbles'ın grup için bildirdiği `chatGuid` / `chatIdentifier` / sayısal `chatId` değerlerinden hangisiyse onunla eşleşir ve `"*"` joker girişi, tam eşleşmesi olmayan her grup için varsayılan sağlar (`requireMention` ve grup başına araç ilkeleri tarafından kullanılan aynı desen). Tam eşleşmeler her zaman jokerden üstün gelir. DM'ler bu alanı yok sayar; bunun yerine aracı düzeyinde veya hesap düzeyinde istem özelleştirmesi kullanın.

#### Çalışılmış örnek: zincirlenmiş yanıtlar ve tapback tepkileri (Private API)

BlueBubbles Private API etkinleştirildiğinde gelen mesajlar kısa mesaj kimlikleriyle gelir (örneğin `[[reply_to:5]]`) ve aracı belirli bir mesaja zincirleme yanıt vermek için `action=reply` veya tapback bırakmak için `action=react` çağırabilir. Grup başına bir `systemPrompt`, aracının doğru aracı seçmesini sağlamanın güvenilir bir yoludur:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;+;chat-family": {
          systemPrompt: [
            "When replying in this group, always call action=reply with the",
            "[[reply_to:N]] messageId from context so your response threads",
            "under the triggering message. Never send a new unlinked message.",
            "",
            "For short acknowledgements ('ok', 'got it', 'on it'), use",
            "action=react with an appropriate tapback emoji (❤️, 👍, 😂, ‼️, ❓)",
            "instead of sending a text reply.",
          ].join(" "),
        },
      },
    },
  },
}
```

Tapback tepkileri ve zincirlenmiş yanıtların ikisi de BlueBubbles Private API gerektirir; temel mekanikler için [Gelişmiş eylemler](#advanced-actions) ve [Mesaj kimlikleri](#message-ids-short-vs-full) bölümlerine bakın.

## ACP konuşma bağlamaları

BlueBubbles sohbetleri, aktarım katmanını değiştirmeden dayanıklı ACP çalışma alanlarına dönüştürülebilir.

Hızlı operatör akışı:

- DM veya izin verilen grup sohbeti içinde `/acp spawn codex --bind here` çalıştırın.
- Aynı BlueBubbles konuşmasındaki gelecekteki mesajlar oluşturulan ACP oturumuna yönlendirilir.
- `/new` ve `/reset` aynı bağlı ACP oturumunu yerinde sıfırlar.
- `/acp close` ACP oturumunu kapatır ve bağlamayı kaldırır.

Yapılandırılmış kalıcı bağlamalar, `type: "acp"` ve `match.channel: "bluebubbles"` içeren üst düzey `bindings[]` girişleri üzerinden de desteklenir.

`match.peer.id` desteklenen herhangi bir BlueBubbles hedef biçimini kullanabilir:

- `+15555550123` veya `user@example.com` gibi normalize edilmiş DM tanıtıcısı
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

Paylaşılan ACP bağlama davranışı için [ACP Agents](/tr/tools/acp-agents) bölümüne bakın.

## Yazıyor göstergeleri + okundu bilgileri

- **Yazma göstergeleri**: Yanıt oluşturulmadan önce ve yanıt oluşturma sırasında otomatik olarak gönderilir.
- **Okundu bilgileri**: `channels.bluebubbles.sendReadReceipts` tarafından kontrol edilir (varsayılan: `true`).
- **Yazma göstergeleri**: OpenClaw yazma başlangıç olayları gönderir; BlueBubbles gönderimde veya zaman aşımında yazmayı otomatik olarak temizler (DELETE ile elle durdurma güvenilir değildir).

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

BlueBubbles, yapılandırmada etkinleştirildiğinde gelişmiş ileti eylemlerini destekler:

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
  <Accordion title="Kullanılabilir eylemler">
    - **react**: Tapback tepkileri ekler/kaldırır (`messageId`, `emoji`, `remove`). iMessage'ın yerel tapback kümesi `love`, `like`, `dislike`, `laugh`, `emphasize` ve `question` değerlerinden oluşur. Bir aracı bu kümenin dışında bir emoji seçtiğinde (örneğin `👀`), tepki aracı tüm isteği başarısız kılmak yerine tapback'in yine de işlenmesi için `love` değerine geri döner. Yapılandırılmış ack tepkileri yine de katı biçimde doğrulanır ve bilinmeyen değerlerde hata verir.
    - **edit**: Gönderilmiş bir iletiyi düzenler (`messageId`, `text`).
    - **unsend**: Bir iletiyi göndermeyi geri alır (`messageId`).
    - **reply**: Belirli bir iletiyi yanıtlar (`messageId`, `text`, `to`).
    - **sendWithEffect**: iMessage efektiyle gönderir (`text`, `to`, `effectId`).
    - **renameGroup**: Bir grup sohbetini yeniden adlandırır (`chatGuid`, `displayName`).
    - **setGroupIcon**: Bir grup sohbetinin simgesini/fotoğrafını ayarlar (`chatGuid`, `media`) — macOS 26 Tahoe'da kararsızdır (API başarı döndürebilir ama simge eşitlenmez).
    - **addParticipant**: Bir gruba birini ekler (`chatGuid`, `address`).
    - **removeParticipant**: Bir gruptan birini kaldırır (`chatGuid`, `address`).
    - **leaveGroup**: Bir grup sohbetinden ayrılır (`chatGuid`).
    - **upload-file**: Medya/dosya gönderir (`to`, `buffer`, `filename`, `asVoice`).
      - Sesli notlar: iMessage sesli iletisi olarak göndermek için **MP3** veya **CAF** sesle `asVoice: true` ayarlayın. BlueBubbles, sesli not gönderirken MP3 → CAF dönüştürür.
    - Eski takma ad: `sendAttachment` hâlâ çalışır, ancak kanonik eylem adı `upload-file` değeridir.

  </Accordion>
</AccordionGroup>

### İleti kimlikleri (kısa ve tam)

OpenClaw, token tasarrufu için _kısa_ ileti kimliklerini (örn. `1`, `2`) gösterebilir.

- `MessageSid` / `ReplyToId` kısa kimlikler olabilir.
- `MessageSidFull` / `ReplyToIdFull` sağlayıcının tam kimliklerini içerir.
- Kısa kimlikler bellekte tutulur; yeniden başlatmada veya önbellek temizliğinde süresi dolabilir.
- Eylemler kısa veya tam `messageId` kabul eder, ancak kısa kimlikler artık kullanılabilir değilse hata verir.

Kalıcı otomasyonlar ve depolama için tam kimlikleri kullanın:

- Şablonlar: `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- Bağlam: gelen yüklerde `MessageSidFull` / `ReplyToIdFull`

Şablon değişkenleri için [Yapılandırma](/tr/gateway/configuration) bölümüne bakın.

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## Bölünmüş gönderimli DM'leri birleştirme (tek kompozisyonda komut + URL)

Bir kullanıcı iMessage'da bir komutu ve bir URL'yi birlikte yazdığında — örn. `Dump https://example.com/article` — Apple gönderimi **iki ayrı webhook teslimatına** böler:

1. Bir metin iletisi (`"Dump"`).
2. Ek olarak OG önizleme görselleriyle bir URL önizleme balonu (`"https://..."`).

İki Webhook, çoğu kurulumda OpenClaw'a yaklaşık 0,8-2,0 sn arayla ulaşır. Birleştirme olmadan aracı 1. turda yalnızca komutu alır, yanıtlar (çoğunlukla "URL'yi gönder") ve URL'yi yalnızca 2. turda görür — bu noktada komut bağlamı zaten kaybolmuştur.

`channels.bluebubbles.coalesceSameSenderDms`, bir DM'yi aynı göndericiden gelen ardışık webhook'ları tek bir aracı turunda birleştirmeye dahil eder. Grup sohbetleri, çok kullanıcılı tur yapısının korunması için ileti başına anahtarlanmaya devam eder.

<Tabs>
  <Tab title="Ne zaman etkinleştirilmeli">
    Şu durumlarda etkinleştirin:

    - Tek iletide `command + payload` bekleyen Skills gönderiyorsanız (dump, paste, save, queue vb.).
    - Kullanıcılarınız komutlarla birlikte URL, görsel veya uzun içerik yapıştırıyorsa.
    - Eklenen DM tur gecikmesini kabul edebiliyorsanız (aşağıya bakın).

    Şu durumlarda devre dışı bırakın:

    - Tek sözcüklü DM tetikleyicileri için en düşük komut gecikmesine ihtiyacınız varsa.
    - Tüm akışlarınız, yük devamı olmayan tek seferlik komutlarsa.

  </Tab>
  <Tab title="Etkinleştirme">
    ```json5
    {
      channels: {
        bluebubbles: {
          coalesceSameSenderDms: true, // opt in (default: false)
        },
      },
    }
    ```

    Bayrak açıkken ve açık bir `messages.inbound.byChannel.bluebubbles` yokken debounce penceresi **2500 ms** değerine genişler (birleştirme olmayan varsayılan 500 ms'dir). Daha geniş pencere gereklidir — Apple'ın 0,8-2,0 sn'lik bölünmüş gönderim temposu daha dar varsayılana sığmaz.

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
  <Tab title="Ödünleşimler">
    - **DM denetim komutları için ek gecikme.** Bayrak açıkken, DM denetim komutu iletileri (`Dump`, `Save` vb.) artık olası bir yük webhook'u için gönderimden önce debounce penceresine kadar bekler. Grup sohbeti komutları anında gönderimi korur.
    - **Birleştirilmiş çıktı sınırlıdır** — birleştirilmiş metin, açık bir `…[truncated]` işaretiyle 4000 karakterde sınırlandırılır; ekler 20 ile sınırlandırılır; kaynak girdileri 10 ile sınırlandırılır (bunun ötesinde ilk-artı-en-son korunur). Her kaynak `messageId` yine de gelen-dedupe katmanına ulaşır; böylece herhangi bir tekil olayın daha sonraki MessagePoller yeniden oynatımı kopya olarak tanınır.
    - **İsteğe bağlı, kanal başına.** Diğer kanallar (Telegram, WhatsApp, Slack, …) etkilenmez.

  </Tab>
</Tabs>

### Senaryolar ve aracının gördükleri

| Kullanıcının oluşturduğu                                           | Apple'ın teslim ettiği     | Bayrak kapalı (varsayılan)               | Bayrak açık + 2500 ms pencere                                           |
| ------------------------------------------------------------------ | -------------------------- | ---------------------------------------- | ----------------------------------------------------------------------- |
| `Dump https://example.com` (tek gönderim)                          | ~1 sn arayla 2 webhook     | İki aracı turu: yalnız "Dump", sonra URL | Tek tur: birleştirilmiş metin `Dump https://example.com`                |
| `Save this 📎image.jpg caption` (ek + metin)                       | 2 webhook                  | İki tur                                  | Tek tur: metin + görsel                                                 |
| `/status` (bağımsız komut)                                         | 1 webhook                  | Anında gönderim                          | **Pencereye kadar bekle, sonra gönder**                                 |
| Tek başına yapıştırılan URL                                        | 1 webhook                  | Anında gönderim                          | Anında gönderim (kovada yalnızca bir girdi)                             |
| Dakikalar arayla kasıtlı iki ayrı ileti olarak gönderilen metin + URL | Pencere dışında 2 webhook | İki tur                                  | İki tur (pencere aralarında sona erer)                                  |
| Hızlı taşma (pencere içinde >10 küçük DM)                          | N webhook                  | N tur                                    | Tek tur, sınırlı çıktı (ilk + son, metin/ek sınırları uygulanır)        |

### Bölünmüş gönderim birleştirme sorun giderme

Bayrak açıksa ve bölünmüş gönderimler hâlâ iki tur olarak geliyorsa, her katmanı kontrol edin:

<AccordionGroup>
  <Accordion title="Yapılandırma gerçekten yüklendi">
    ```
    grep coalesceSameSenderDms ~/.openclaw/openclaw.json
    ```

    Ardından `openclaw gateway restart` — bayrak, debouncer-registry oluşturulurken okunur.

  </Accordion>
  <Accordion title="Debounce penceresi kurulumunuz için yeterince geniş">
    BlueBubbles sunucu günlüğüne `~/Library/Logs/bluebubbles-server/main.log` altında bakın:

    ```
    grep -E "Dispatching event to webhook" main.log | tail -20
    ```

    `"Dump"` tarzı metin gönderimi ile onu izleyen `"https://..."; Attachments:` gönderimi arasındaki boşluğu ölçün. `messages.inbound.byChannel.bluebubbles` değerini bu boşluğu rahatça kapsayacak şekilde artırın.

  </Accordion>
  <Accordion title="Oturum JSONL zaman damgaları ≠ webhook varışı">
    Oturum olay zaman damgaları (`~/.openclaw/agents/<id>/sessions/*.jsonl`), webhook'un ne zaman geldiğini değil, Gateway'in bir iletiyi aracıya ne zaman teslim ettiğini yansıtır. `[Queued messages while agent was busy]` etiketli kuyruğa alınmış ikinci ileti, ikinci webhook geldiğinde ilk turun hâlâ çalıştığı anlamına gelir — birleştirme kovası zaten boşaltılmıştı. Pencereyi oturum günlüğüne değil, BB sunucu günlüğüne göre ayarlayın.
  </Accordion>
  <Accordion title="Bellek baskısı yanıt gönderimini yavaşlatıyor">
    Daha küçük makinelerde (8 GB), aracı turları yeterince uzun sürebilir; bu durumda birleştirme kovası yanıt tamamlanmadan önce boşalır ve URL kuyruğa alınmış ikinci tur olarak düşer. `memory_pressure` ve `ps -o rss -p $(pgrep openclaw-gateway)` değerlerini kontrol edin; Gateway ~500 MB RSS üstündeyse ve sıkıştırıcı etkinse diğer ağır süreçleri kapatın veya daha büyük bir ana makineye geçin.
  </Accordion>
  <Accordion title="Yanıt-alıntı gönderimleri farklı bir yoldur">
    Kullanıcı `Dump` öğesine var olan bir URL balonuna **yanıt** olarak dokunduysa (iMessage, Dump balonunda "1 Reply" rozeti gösterir), URL ikinci bir webhook'ta değil `replyToBody` içinde yaşar. Birleştirme uygulanmaz — bu bir debouncer konusu değil, skill/prompt konusudur.
  </Accordion>
</AccordionGroup>

## Blok akışı

Yanıtların tek ileti olarak mı yoksa bloklar halinde akışla mı gönderileceğini kontrol edin:

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
- Gelen ve giden medya için medya sınırı `channels.bluebubbles.mediaMaxMb` üzerinden ayarlanır (varsayılan: 8 MB).
- Giden metin `channels.bluebubbles.textChunkLimit` değerine göre parçalara ayrılır (varsayılan: 4000 karakter).

## Yapılandırma referansı

Tam yapılandırma: [Yapılandırma](/tr/gateway/configuration)

<AccordionGroup>
  <Accordion title="Bağlantı ve webhook">
    - `channels.bluebubbles.enabled`: Kanalı etkinleştirir/devre dışı bırakır.
    - `channels.bluebubbles.serverUrl`: BlueBubbles REST API temel URL'si.
    - `channels.bluebubbles.password`: API parolası.
    - `channels.bluebubbles.webhookPath`: Webhook uç noktası yolu (varsayılan: `/bluebubbles-webhook`).

  </Accordion>
  <Accordion title="Erişim ilkesi">
    - `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled` (varsayılan: `pairing`).
    - `channels.bluebubbles.allowFrom`: DM izin listesi (kullanıcı adları, e-postalar, E.164 numaraları, `chat_id:*`, `chat_guid:*`).
    - `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled` (varsayılan: `allowlist`).
    - `channels.bluebubbles.groupAllowFrom`: Grup gönderen izin listesi.
    - `channels.bluebubbles.enrichGroupParticipantsFromContacts`: macOS'ta, geçit denetimleri geçtikten sonra adsız grup katılımcılarını yerel Kişiler'den isteğe bağlı olarak zenginleştirir. Varsayılan: `false`.
    - `channels.bluebubbles.groups`: Grup başına yapılandırma (`requireMention` vb.).

  </Accordion>
  <Accordion title="Teslim ve parçalara ayırma">
    - `channels.bluebubbles.sendReadReceipts`: Okundu bilgileri gönder (varsayılan: `true`).
    - `channels.bluebubbles.blockStreaming`: Blok akışını etkinleştir (varsayılan: `false`; akışlı yanıtlar için gereklidir).
    - `channels.bluebubbles.textChunkLimit`: Giden parça boyutu karakter cinsinden (varsayılan: 4000).
    - `channels.bluebubbles.sendTimeoutMs`: `/api/v1/message/text` üzerinden yapılan giden metin gönderimleri için istek başına zaman aşımı, ms cinsinden (varsayılan: 30000). Private API iMessage gönderimlerinin iMessage framework içinde 60+ saniye takılabildiği macOS 26 kurulumlarında artırın; örneğin `45000` veya `60000`. Problar, sohbet aramaları, tepkiler, düzenlemeler ve sağlık kontrolleri şu anda daha kısa olan 10 sn varsayılanını korur; kapsamın tepkilere ve düzenlemelere genişletilmesi takip işi olarak planlanmıştır. Hesap başına geçersiz kılma: `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`.
    - `channels.bluebubbles.chunkMode`: `length` (varsayılan) yalnızca `textChunkLimit` aşıldığında böler; `newline`, uzunluğa göre parçalara ayırmadan önce boş satırlardan (paragraf sınırları) böler.

  </Accordion>
  <Accordion title="Medya ve geçmiş">
    - `channels.bluebubbles.mediaMaxMb`: Gelen/giden medya sınırı, MB cinsinden (varsayılan: 8).
    - `channels.bluebubbles.mediaLocalRoots`: Giden yerel medya yolları için izin verilen mutlak yerel dizinlerin açık izin listesi. Bu yapılandırılmadıkça yerel yol gönderimleri varsayılan olarak reddedilir. Hesap başına geçersiz kılma: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`.
    - `channels.bluebubbles.coalesceSameSenderDms`: Apple'ın metin+URL ayrı gönderimi tek bir mesaj olarak gelsin diye aynı gönderenden gelen ardışık DM Webhook'larını tek bir ajan turunda birleştirir (varsayılan: `false`). Senaryolar, pencere ayarı ve ödünleşimler için [bölünmüş gönderim DM'lerini birleştirme](#coalescing-split-send-dms-command--url-in-one-composition) bölümüne bakın. Açık bir `messages.inbound.byChannel.bluebubbles` olmadan etkinleştirildiğinde varsayılan gelen debounce penceresini 500 ms'den 2500 ms'ye genişletir.
    - `channels.bluebubbles.historyLimit`: Bağlam için en fazla grup mesajı (0 devre dışı bırakır).
    - `channels.bluebubbles.dmHistoryLimit`: DM geçmiş sınırı.
    - `channels.bluebubbles.replyContextApiFallback`: Gelen bir yanıt `replyToBody`/`replyToSender` olmadan geldiğinde ve bellek içi yanıt bağlamı önbelleğinde isabet olmadığında, en iyi çaba yedek yolu olarak özgün mesajı BlueBubbles HTTP API'den alır (varsayılan: `false`). Tek bir BlueBubbles hesabını paylaşan çok örnekli dağıtımlar, süreç yeniden başlatmaları veya uzun ömürlü TTL/LRU önbellek tahliyeleri sonrasında kullanışlıdır. Alma işlemi, diğer tüm BlueBubbles istemci istekleriyle aynı ilke tarafından SSRF'ye karşı korunur, asla hata fırlatmaz ve sonraki yanıtların maliyetini yaymak için önbelleği doldurur. Hesap başına geçersiz kılma: `channels.bluebubbles.accounts.<accountId>.replyContextApiFallback`. Kanal düzeyi ayar, bayrağı atlayan hesaplara yayılır.

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
  - Bir doğrudan tanıtıcının mevcut bir DM sohbeti yoksa OpenClaw, `POST /api/v1/chat/new` üzerinden bir tane oluşturur. Bunun için BlueBubbles Private API'nin etkinleştirilmiş olması gerekir.

### iMessage ve SMS yönlendirmesi

Aynı tanıtıcının Mac üzerinde hem iMessage hem de SMS sohbeti olduğunda (örneğin iMessage'a kayıtlı ancak yeşil balon yedekleri de almış bir telefon numarası), OpenClaw iMessage sohbetini tercih eder ve hiçbir zaman sessizce SMS'e düşürmez. SMS sohbetini zorlamak için açık bir `sms:` hedef öneki kullanın (örneğin `sms:+15555550123`). Eşleşen bir iMessage sohbeti olmayan tanıtıcılar, BlueBubbles'ın bildirdiği sohbet üzerinden gönderilmeye devam eder.

## Güvenlik

- Webhook istekleri, `guid`/`password` sorgu parametreleri veya üstbilgileri `channels.bluebubbles.password` ile karşılaştırılarak doğrulanır.
- API parolasını ve Webhook uç noktasını gizli tutun (bunlara kimlik bilgileri gibi davranın).
- BlueBubbles Webhook kimlik doğrulaması için localhost atlaması yoktur. Webhook trafiğine proxy uyguluyorsanız BlueBubbles parolasını isteğin uçtan uca üzerinde tutun. `gateway.trustedProxies` burada `channels.bluebubbles.password` yerine geçmez. Bkz. [Gateway güvenliği](/tr/gateway/security#reverse-proxy-configuration).
- LAN dışına açıyorsanız BlueBubbles sunucusunda HTTPS + güvenlik duvarı kurallarını etkinleştirin.

## Sorun giderme

- Yazma/okundu olayları çalışmayı durdurursa BlueBubbles Webhook günlüklerini kontrol edin ve Gateway yolunun `channels.bluebubbles.webhookPath` ile eşleştiğini doğrulayın.
- Eşleme kodları bir saat sonra sona erer; `openclaw pairing list bluebubbles` ve `openclaw pairing approve bluebubbles <code>` kullanın.
- Tepkiler BlueBubbles private API'sini gerektirir (`POST /api/v1/message/react`); sunucu sürümünün bunu sunduğundan emin olun.
- Düzenleme/göndermeyi geri alma için macOS 13+ ve uyumlu bir BlueBubbles sunucu sürümü gerekir. macOS 26'da (Tahoe), private API değişiklikleri nedeniyle düzenleme şu anda bozuktur.
- Grup simgesi güncellemeleri macOS 26'da (Tahoe) kararsız olabilir: API başarı döndürebilir ancak yeni simge eşitlenmez.
- OpenClaw, BlueBubbles sunucusunun macOS sürümüne göre bozuk olduğu bilinen eylemleri otomatik olarak gizler. Düzenleme macOS 26'da (Tahoe) hâlâ görünüyorsa `channels.bluebubbles.actions.edit=false` ile elle devre dışı bırakın.
- `coalesceSameSenderDms` etkin ama bölünmüş gönderimler (örn. `Dump` + URL) hâlâ iki tur olarak geliyorsa: [bölünmüş gönderim birleştirme sorun giderme](#split-send-coalescing-troubleshooting) kontrol listesine bakın — yaygın nedenler çok dar debounce penceresi, oturum günlüğü zaman damgalarının Webhook varış zamanı sanılması veya yanıt alıntısı gönderimidir (bu, ikinci bir Webhook değil `replyToBody` kullanır).
- Durum/sağlık bilgisi için: `openclaw status --all` veya `openclaw status --deep`.

Genel kanal iş akışı başvurusu için [Kanallar](/tr/channels) ve [Plugins](/tr/tools/plugin) kılavuzuna bakın.

## İlgili

- [Kanal Yönlendirme](/tr/channels/channel-routing) — mesajlar için oturum yönlendirmesi
- [Kanallara Genel Bakış](/tr/channels) — desteklenen tüm kanallar
- [Gruplar](/tr/channels/groups) — grup sohbeti davranışı ve bahsetme kapısı
- [Eşleme](/tr/channels/pairing) — DM kimlik doğrulaması ve eşleme akışı
- [Güvenlik](/tr/gateway/security) — erişim modeli ve sıkılaştırma
