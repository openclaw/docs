---
read_when:
    - BlueBubbles kanalını ayarlama
    - Webhook eşleştirme sorunlarını giderme
    - macOS'ta iMessage'ı yapılandırma
sidebarTitle: BlueBubbles
summary: BlueBubbles macOS sunucusu üzerinden eski iMessage desteği (REST gönderme/alma, yazıyor göstergesi, tepkiler, eşleştirme, gelişmiş eylemler).
title: BlueBubbles
x-i18n:
    generated_at: "2026-05-07T01:51:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: e32b35242c7e751b49dcd8d839bc291c80cb4d88c0b4ce6f65635b7ef2ed97c3
    source_path: channels/bluebubbles.md
    workflow: 16
---

Durum: HTTP üzerinden BlueBubbles macOS sunucusuyla konuşan paketli eski Plugin. Mevcut BlueBubbles kurulumları çalışmaya devam eder, ancak yeni OpenClaw iMessage dağıtımları, gereksinimleri ana makinenize uyduğunda yerel [iMessage](/tr/channels/imessage) Plugin'ini tercih etmelidir.

<Warning>
BlueBubbles, yeni OpenClaw kurulumları için kullanımdan kaldırılmıştır.

Yukarı akış BlueBubbles ekosistemi hâlâ aktiftir, ancak OpenClaw, BlueBubbles macOS sunucu API'sine bağlıdır. 6 Mayıs 2026 itibarıyla, resmi [`bluebubbles-server`](https://github.com/BlueBubblesApp/bluebubbles-server) geliştirme dalı en son [22 Ocak 2026](https://github.com/BlueBubblesApp/bluebubbles-server/commit/88a4921bbd5a8111f1e9582b83715cf877171037) tarihinde değişti ve en son sunucu sürümü ([`v1.9.9`](https://github.com/BlueBubblesApp/bluebubbles-server/releases/tag/v1.9.9)) 16 Mayıs 2025'te yayımlandı. İstemci uygulaması ve yardımcı depolarda daha yeni etkinlik vardır; bu nedenle bu bir terk edilme iddiası değildir. Kullanımdan kaldırma, yerel `imsg` yolu entegrasyonu yerel bir stdio sözleşmesinde tuttuğunda OpenClaw'ın harici bir HTTP sunucusuna, webhooks'a ve özel API uyumluluk yüzeyine bağımlılığını azaltmakla ilgilidir.
</Warning>

<Note>
Geçerli OpenClaw sürümleri BlueBubbles'ı paketler, bu yüzden normal paketli derlemeler ayrı bir `openclaw plugins install` adımı gerektirmez.
</Note>

## Genel bakış

- BlueBubbles yardımcı uygulaması ([bluebubbles.app](https://bluebubbles.app)) üzerinden macOS'ta çalışır.
- Zaten BlueBubbles kanal kimliklerine, webhook durumuna, grup hedeflerine, cron teslimine veya çalışma alanı yönlendirmesine dayanan kurulumlar için eski yedek.
- Önerilen/test edilen: macOS Sequoia (15). macOS Tahoe (26) çalışır; düzenleme şu anda Tahoe'da bozuk ve grup simgesi güncellemeleri başarılı görünebilir ancak eşitlenmeyebilir.
- OpenClaw onunla REST API'si üzerinden konuşur (`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`).
- Gelen mesajlar webhooks üzerinden gelir; giden yanıtlar, yazıyor göstergeleri, okundu bilgileri ve tapback'ler REST çağrılarıdır.
- Ekler ve çıkartmalar gelen medya olarak alınır (ve mümkün olduğunda ajana gösterilir).
- MP3 veya CAF ses sentezleyen otomatik TTS yanıtları, düz dosya ekleri yerine iMessage sesli not baloncukları olarak teslim edilir.
- Eşleştirme/izin listesi diğer kanallarla aynı şekilde çalışır (`/channels/pairing` vb.) ve `channels.bluebubbles.allowFrom` + eşleştirme kodlarını kullanır.
- Tepkiler Slack/Telegram'da olduğu gibi sistem olayları olarak gösterilir, böylece ajanlar yanıtlamadan önce bunlardan "bahsedebilir".
- Gelişmiş özellikler: düzenleme, göndermeyi geri alma, yanıt iş parçacıkları, mesaj efektleri, grup yönetimi.

## Hızlı başlangıç

<Steps>
  <Step title="Install BlueBubbles">
    BlueBubbles sunucusunu Mac'inize kurun ([bluebubbles.app/install](https://bluebubbles.app/install) adresindeki yönergeleri izleyin).
  </Step>
  <Step title="Enable the web API">
    BlueBubbles yapılandırmasında web API'sini etkinleştirin ve bir parola belirleyin.
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
    BlueBubbles webhooks'unu gateway'inize yönlendirin (örnek: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`).
  </Step>
  <Step title="Start the gateway">
    Gateway'i başlatın; webhook işleyicisini kaydeder ve eşleştirmeyi başlatır.
  </Step>
</Steps>

<Warning>
**Güvenlik**

- Her zaman bir webhook parolası belirleyin.
- Webhook kimlik doğrulaması her zaman gereklidir. OpenClaw, local loopback/proxy topolojisinden bağımsız olarak, `channels.bluebubbles.password` ile eşleşen bir password/guid içermedikçe BlueBubbles webhook isteklerini reddeder (örneğin `?password=<password>` veya `x-password`).
- Parola kimlik doğrulaması, tam webhook gövdeleri okunmadan/ayrıştırılmadan önce denetlenir.

</Warning>

## Messages.app'i canlı tutma (VM / başsız kurulumlar)

Bazı macOS VM / her zaman açık kurulumlarda Messages.app "boşta" kalabilir (uygulama açılana/ön plana alınana kadar gelen olaylar durur). Basit bir geçici çözüm, AppleScript + LaunchAgent kullanarak **her 5 dakikada bir Messages'ı dürtmektir**.

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
  BlueBubbles sunucu adresi (örn. `http://192.168.1.100:1234`).
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

BlueBubbles'ı CLI ile de ekleyebilirsiniz:

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## Erişim denetimi (DM'ler + gruplar)

<Tabs>
  <Tab title="DMs">
    - Varsayılan: `channels.bluebubbles.dmPolicy = "pairing"`.
    - Bilinmeyen gönderenler bir eşleştirme kodu alır; onaylanana kadar mesajlar yok sayılır (kodların süresi 1 saat sonra dolar).
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

BlueBubbles grup webhooks'u genellikle yalnızca ham katılımcı adreslerini içerir. `GroupMembers` bağlamının bunun yerine yerel kişi adlarını göstermesini istiyorsanız macOS'ta yerel Kişiler zenginleştirmesine katılabilirsiniz:

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` aramayı etkinleştirir. Varsayılan: `false`.
- Aramalar yalnızca grup erişimi, komut yetkilendirmesi ve bahsetme kapısı mesajın geçmesine izin verdikten sonra çalışır.
- Yalnızca adı olmayan telefon katılımcıları zenginleştirilir.
- Yerel eşleşme bulunmadığında ham telefon numaraları yedek olarak kalır.

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
- Bir grup için `requireMention` etkinleştirildiğinde, ajan yalnızca kendisinden bahsedildiğinde yanıt verir.
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

`channels.bluebubbles.groups.*` altındaki her giriş isteğe bağlı bir `systemPrompt` dizesi kabul eder. Değer, o gruptaki bir mesajı işleyen her turda ajanın sistem istemine enjekte edilir; böylece ajan istemlerini düzenlemeden grup başına persona veya davranış kuralları ayarlayabilirsiniz:

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

Anahtar, BlueBubbles'ın grup için `chatGuid` / `chatIdentifier` / sayısal `chatId` olarak bildirdiği değerle eşleşir ve `"*"` joker karakter girişi, tam eşleşmesi olmayan her grup için varsayılan sağlar (`requireMention` ve grup başına araç politikaları tarafından kullanılan aynı kalıp). Tam eşleşmeler her zaman joker karaktere üstün gelir. DM'ler bu alanı yok sayar; bunun yerine ajan düzeyinde veya hesap düzeyinde istem özelleştirmesi kullanın.

#### Çalışılmış örnek: iş parçacıklı yanıtlar ve tapback tepkileri (Private API)

BlueBubbles Private API etkinleştirildiğinde, gelen mesajlar kısa mesaj kimlikleriyle gelir (örneğin `[[reply_to:5]]`) ve ajan belirli bir mesaja iş parçacığı oluşturmak için `action=reply` veya bir tapback bırakmak için `action=react` çağırabilir. Grup başına bir `systemPrompt`, ajanın doğru aracı seçmesini sağlamanın güvenilir bir yoludur:

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

BlueBubbles sohbetleri, taşıma katmanı değiştirilmeden dayanıklı ACP çalışma alanlarına dönüştürülebilir.

Hızlı operatör akışı:

- DM veya izin verilen grup sohbetinin içinde `/acp spawn codex --bind here` çalıştırın.
- Aynı BlueBubbles konuşmasındaki gelecekteki mesajlar, oluşturulan ACP oturumuna yönlendirilir.
- `/new` ve `/reset`, aynı bağlı ACP oturumunu yerinde sıfırlar.
- `/acp close`, ACP oturumunu kapatır ve bağlamayı kaldırır.

Yapılandırılmış kalıcı bağlamalar da `type: "acp"` ve `match.channel: "bluebubbles"` ile üst düzey `bindings[]` girişleri üzerinden desteklenir.

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

Paylaşılan ACP bağlama davranışı için [ACP aracıları](/tr/tools/acp-agents) bölümüne bakın.

## Yazıyor göstergeleri + okundu bilgileri

- **Yazıyor göstergeleri**: Yanıt üretiminden önce ve üretim sırasında otomatik olarak gönderilir.
- **Okundu bilgileri**: `channels.bluebubbles.sendReadReceipts` tarafından denetlenir (varsayılan: `true`).
- **Yazıyor göstergeleri**: OpenClaw yazıyor başlangıç olayları gönderir; BlueBubbles gönderimde veya zaman aşımında yazıyor durumunu otomatik olarak temizler (DELETE ile elle durdurma güvenilir değildir).

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
    - **react**: Tapback tepkileri ekleyin/kaldırın (`messageId`, `emoji`, `remove`). iMessage'ın yerel tapback kümesi `love`, `like`, `dislike`, `laugh`, `emphasize` ve `question` değerleridir. Bir aracı bu kümenin dışında bir emoji seçtiğinde (örneğin `👀`), tepki aracı `love` değerine geri döner; böylece tüm istek başarısız olmak yerine tapback yine işlenir. Yapılandırılmış onay tepkileri yine de katı biçimde doğrulanır ve bilinmeyen değerlerde hata verir.
    - **edit**: Gönderilmiş bir iletiyi düzenleyin (`messageId`, `text`).
    - **unsend**: Bir iletiyi geri alın (`messageId`).
    - **reply**: Belirli bir iletiye yanıt verin (`messageId`, `text`, `to`).
    - **sendWithEffect**: iMessage efektiyle gönderin (`text`, `to`, `effectId`).
    - **renameGroup**: Bir grup sohbetini yeniden adlandırın (`chatGuid`, `displayName`).
    - **setGroupIcon**: Bir grup sohbetinin simgesini/fotoğrafını ayarlayın (`chatGuid`, `media`) - macOS 26 Tahoe'da kararsızdır (API başarı döndürebilir ancak simge eşitlenmez).
    - **addParticipant**: Bir gruba birini ekleyin (`chatGuid`, `address`).
    - **removeParticipant**: Bir gruptan birini kaldırın (`chatGuid`, `address`).
    - **leaveGroup**: Bir grup sohbetinden ayrılın (`chatGuid`).
    - **upload-file**: Medya/dosya gönderin (`to`, `buffer`, `filename`, `asVoice`).
      - Sesli notlar: iMessage sesli iletisi olarak göndermek için **MP3** veya **CAF** sesle `asVoice: true` ayarlayın. BlueBubbles sesli not gönderirken MP3 → CAF dönüştürür.
    - Eski takma ad: `sendAttachment` çalışmaya devam eder, ancak kanonik eylem adı `upload-file` değeridir.

  </Accordion>
</AccordionGroup>

### İleti kimlikleri (kısa ve tam)

OpenClaw, token tasarrufu için _kısa_ ileti kimlikleri (ör. `1`, `2`) gösterebilir.

- `MessageSid` / `ReplyToId` kısa kimlikler olabilir.
- `MessageSidFull` / `ReplyToIdFull` sağlayıcı tam kimliklerini içerir.
- Kısa kimlikler bellek içindedir; yeniden başlatmada veya önbellek çıkarımında süreleri dolabilir.
- Eylemler kısa veya tam `messageId` kabul eder, ancak kısa kimlikler artık kullanılamıyorsa hata verir.

Kalıcı otomasyonlar ve depolama için tam kimlikleri kullanın:

- Şablonlar: `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- Bağlam: gelen yüklerde `MessageSidFull` / `ReplyToIdFull`

Şablon değişkenleri için [Yapılandırma](/tr/gateway/configuration) bölümüne bakın.

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## Bölünmüş gönderimli DM'leri birleştirme (tek kompozisyonda komut + URL)

Bir kullanıcı iMessage içinde bir komutu ve URL'yi birlikte yazdığında - ör. `Dump https://example.com/article` - Apple gönderimi **iki ayrı Webhook teslimatına** böler:

1. Bir metin iletisi (`"Dump"`).
2. Ek olarak OG önizleme görselleriyle bir URL önizleme balonu (`"https://..."`).

İki Webhook çoğu kurulumda OpenClaw'a yaklaşık 0,8-2,0 sn arayla ulaşır. Birleştirme olmadan aracı 1. turda yalnızca komutu alır, yanıt verir (çoğunlukla "bana URL'yi gönder") ve URL'yi yalnızca 2. turda görür; o noktada komut bağlamı zaten kaybolmuştur.

`channels.bluebubbles.coalesceSameSenderDms`, bir DM'yi aynı gönderenin ardışık Webhook'larını tek bir aracı turunda birleştirecek şekilde etkinleştirir. Grup sohbetleri, çok kullanıcılı tur yapısı korunsun diye ileti başına anahtarlanmaya devam eder.

<Tabs>
  <Tab title="Ne zaman etkinleştirilmeli">
    Şu durumlarda etkinleştirin:

    - Tek iletide `command + payload` bekleyen Skills gönderiyorsanız (dump, paste, save, queue vb.).
    - Kullanıcılarınız komutların yanına URL'ler, görseller veya uzun içerikler yapıştırıyorsa.
    - Eklenen DM tur gecikmesini kabul edebiliyorsanız (aşağıya bakın).

    Şu durumlarda devre dışı bırakın:

    - Tek sözcüklü DM tetikleyicileri için minimum komut gecikmesine ihtiyacınız varsa.
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

    Bayrak açıkken ve açık bir `messages.inbound.byChannel.bluebubbles` yokken, debounce penceresi **2500 ms** değerine genişler (birleştirme olmayan varsayılan 500 ms'dir). Daha geniş pencere gereklidir; Apple'ın 0,8-2,0 sn'lik bölünmüş gönderim temposu daha dar varsayılana sığmaz.

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
    - **DM denetim komutları için ek gecikme.** Bayrak açıkken DM denetim komutu iletileri (`Dump`, `Save` vb.) artık bir yük Webhook'u geliyor olma olasılığına karşı gönderilmeden önce debounce penceresine kadar bekler. Grup sohbeti komutları anında gönderilmeyi korur.
    - **Birleştirilmiş çıktı sınırlandırılır** - birleştirilmiş metin, açık bir `…[truncated]` işaretiyle 4000 karakterde sınırlanır; ekler 20 ile sınırlanır; kaynak girdileri 10 ile sınırlanır (bunun ötesinde ilk ve en son korunur). Her kaynak `messageId` yine de gelen tekilleştirmeye ulaşır; bu nedenle daha sonra herhangi bir tekil olayın MessagePoller yeniden oynatımı yinelenen olarak tanınır.
    - **Kanala göre isteğe bağlı.** Diğer kanallar (Telegram, WhatsApp, Slack, …) etkilenmez.

  </Tab>
</Tabs>

### Senaryolar ve aracının gördükleri

| Kullanıcının oluşturduğu                                             | Apple'ın teslim ettiği      | Bayrak kapalı (varsayılan)                 | Bayrak açık + 2500 ms pencere                                            |
| ------------------------------------------------------------------ | ------------------------- | --------------------------------------- | ----------------------------------------------------------------------- |
| `Dump https://example.com` (tek gönderim)                          | Yaklaşık 1 sn arayla 2 Webhook | İki aracı turu: yalnızca "Dump", sonra URL | Tek tur: birleştirilmiş metin `Dump https://example.com`                 |
| `Save this 📎image.jpg caption` (ek + metin)                       | 2 Webhook                 | İki tur                                  | Tek tur: metin + görsel                                                  |
| `/status` (bağımsız komut)                                         | 1 Webhook                 | Anında gönderim                          | **Pencereye kadar bekle, sonra gönder**                                  |
| Tek başına yapıştırılan URL                                        | 1 Webhook                 | Anında gönderim                          | Anında gönderim (kovada yalnızca bir girdi)                              |
| Metin + URL dakika arayla kasıtlı iki ayrı ileti olarak gönderildi | Pencere dışında 2 Webhook | İki tur                                  | İki tur (pencere aralarında dolar)                                       |
| Hızlı taşma (pencere içinde >10 küçük DM)                          | N Webhook                 | N tur                                    | Tek tur, sınırlandırılmış çıktı (ilk + en son, metin/ek sınırları uygulanır) |

### Bölünmüş gönderim birleştirme sorun giderme

Bayrak açıksa ve bölünmüş gönderimler yine de iki tur olarak geliyorsa her katmanı denetleyin:

<AccordionGroup>
  <Accordion title="Yapılandırma gerçekten yüklendi">
    ```
    grep coalesceSameSenderDms ~/.openclaw/openclaw.json
    ```

    Ardından `openclaw gateway restart` çalıştırın; bayrak debouncer kayıt defteri oluşturulurken okunur.

  </Accordion>
  <Accordion title="Debounce penceresi kurulumunuz için yeterince geniş">
    BlueBubbles sunucu günlüğüne `~/Library/Logs/bluebubbles-server/main.log` altında bakın:

    ```
    grep -E "Dispatching event to webhook" main.log | tail -20
    ```

    `"Dump"` tarzı metin gönderimi ile onu izleyen `"https://..."; Attachments:` gönderimi arasındaki boşluğu ölçün. `messages.inbound.byChannel.bluebubbles` değerini bu boşluğu rahatça kapsayacak şekilde artırın.

  </Accordion>
  <Accordion title="Oturum JSONL zaman damgaları ≠ Webhook varışı">
    Oturum olayı zaman damgaları (`~/.openclaw/agents/<id>/sessions/*.jsonl`), Webhook'un ne zaman geldiğini **değil**, Gateway'in bir iletiyi aracıya ne zaman verdiğini yansıtır. `[Queued messages while agent was busy]` etiketi taşıyan kuyruğa alınmış ikinci ileti, ikinci Webhook geldiğinde ilk turun hâlâ çalıştığı anlamına gelir; birleştirme kovası zaten boşaltılmıştı. Pencereyi oturum günlüğüne göre değil, BB sunucu günlüğüne göre ayarlayın.
  </Accordion>
  <Accordion title="Bellek baskısı yanıt gönderimini yavaşlatıyor">
    Daha küçük makinelerde (8 GB), aracı turları yanıt tamamlanmadan önce birleştirme kovasının boşalmasına yetecek kadar uzun sürebilir ve URL kuyruğa alınmış ikinci tur olarak düşer. `memory_pressure` ve `ps -o rss -p $(pgrep openclaw-gateway)` değerlerini denetleyin; Gateway ~500 MB RSS üzerindeyse ve sıkıştırıcı etkinse diğer ağır süreçleri kapatın veya daha büyük bir ana makineye geçin.
  </Accordion>
  <Accordion title="Yanıt alıntısı gönderimleri farklı bir yoldur">
    Kullanıcı mevcut bir URL balonuna **yanıt** olarak `Dump` öğesine dokunduysa (iMessage, Dump balonunda "1 Reply" rozeti gösterir), URL ikinci bir Webhook'ta değil `replyToBody` içinde yaşar. Birleştirme uygulanmaz; bu bir debouncer konusu değil, Skills/istem konusudur.
  </Accordion>
</AccordionGroup>

## Blok akışı

Yanıtların tek bir ileti olarak mı yoksa bloklar halinde akışla mı gönderileceğini denetleyin:

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
- Giden metin `channels.bluebubbles.textChunkLimit` değerine göre parçalara ayrılır (varsayılan: 4000 karakter).

## Yapılandırma referansı

Tam yapılandırma: [Yapılandırma](/tr/gateway/configuration)

<AccordionGroup>
  <Accordion title="Bağlantı ve webhook">
    - `channels.bluebubbles.enabled`: Kanalı etkinleştir/devre dışı bırak.
    - `channels.bluebubbles.serverUrl`: BlueBubbles REST API temel URL'si.
    - `channels.bluebubbles.password`: API parolası.
    - `channels.bluebubbles.webhookPath`: Webhook uç nokta yolu (varsayılan: `/bluebubbles-webhook`).

  </Accordion>
  <Accordion title="Erişim politikası">
    - `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled` (varsayılan: `pairing`).
    - `channels.bluebubbles.allowFrom`: DM izin listesi (tanıtıcılar, e-postalar, E.164 numaraları, `chat_id:*`, `chat_guid:*`).
    - `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled` (varsayılan: `allowlist`).
    - `channels.bluebubbles.groupAllowFrom`: Grup gönderen izin listesi.
    - `channels.bluebubbles.enrichGroupParticipantsFromContacts`: macOS'te, kapı denetiminden geçildikten sonra adsız grup katılımcılarını isteğe bağlı olarak yerel Kişiler'den zenginleştirir. Varsayılan: `false`.
    - `channels.bluebubbles.groups`: Grup başına yapılandırma (`requireMention` vb.).

  </Accordion>
  <Accordion title="Teslim ve parçalama">
    - `channels.bluebubbles.sendReadReceipts`: Okundu bilgisi gönder (varsayılan: `true`).
    - `channels.bluebubbles.blockStreaming`: Blok akışını etkinleştir (varsayılan: `false`; akış yanıtları için gereklidir).
    - `channels.bluebubbles.textChunkLimit`: Karakter cinsinden giden parça boyutu (varsayılan: 4000).
    - `channels.bluebubbles.sendTimeoutMs`: `/api/v1/message/text` üzerinden giden metin gönderimleri için istek başına ms cinsinden zaman aşımı (varsayılan: 30000). Private API iMessage gönderimlerinin iMessage framework'ü içinde 60+ saniye takılabildiği macOS 26 kurulumlarında artırın; örneğin `45000` veya `60000`. Yoklamalar, sohbet aramaları, tepkiler, düzenlemeler ve sağlık denetimleri şu anda daha kısa 10 sn varsayılanını korur; kapsamın tepkiler ve düzenlemelere genişletilmesi takip işi olarak planlanmıştır. Hesap başına geçersiz kılma: `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`.
    - `channels.bluebubbles.chunkMode`: `length` (varsayılan), yalnızca `textChunkLimit` aşıldığında böler; `newline`, uzunluğa göre parçalamadan önce boş satırlardan (paragraf sınırları) böler.

  </Accordion>
  <Accordion title="Medya ve geçmiş">
    - `channels.bluebubbles.mediaMaxMb`: MB cinsinden gelen/giden medya sınırı (varsayılan: 8).
    - `channels.bluebubbles.mediaLocalRoots`: Giden yerel medya yolları için izin verilen mutlak yerel dizinlerin açık izin listesi. Bu yapılandırılmadıkça yerel yol gönderimleri varsayılan olarak reddedilir. Hesap başına geçersiz kılma: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`.
    - `channels.bluebubbles.coalesceSameSenderDms`: Apple's metin+URL bölünmüş gönderimi tek ileti olarak gelsin diye art arda gelen aynı gönderenli DM webhook'larını tek bir ajan turunda birleştir (varsayılan: `false`). Senaryolar, pencere ayarı ve ödünleşimler için [Bölünmüş gönderimli DM'leri birleştirme](#coalescing-split-send-dms-command--url-in-one-composition) bölümüne bakın. Açık bir `messages.inbound.byChannel.bluebubbles` olmadan etkinleştirildiğinde varsayılan gelen debounce penceresini 500 ms'den 2500 ms'ye genişletir.
    - `channels.bluebubbles.historyLimit`: Bağlam için en fazla grup iletisi (0 devre dışı bırakır).
    - `channels.bluebubbles.dmHistoryLimit`: DM geçmiş sınırı.
    - `channels.bluebubbles.replyContextApiFallback`: Gelen bir yanıt `replyToBody`/`replyToSender` olmadan geldiğinde ve bellek içi yanıt bağlamı önbelleğinde eşleşme bulunmadığında, en iyi çaba yedeği olarak özgün iletiyi BlueBubbles HTTP API'sinden getir (varsayılan: `false`). Tek BlueBubbles hesabını paylaşan çok örnekli dağıtımlar, işlem yeniden başlatmaları veya uzun ömürlü TTL/LRU önbellek tahliyesinden sonra kullanışlıdır. Getirme işlemi, diğer tüm BlueBubbles istemci istekleriyle aynı politika tarafından SSRF'ye karşı korunur, asla hata fırlatmaz ve sonraki yanıtların maliyetini yaymak için önbelleği doldurur. Hesap başına geçersiz kılma: `channels.bluebubbles.accounts.<accountId>.replyContextApiFallback`. Kanal düzeyindeki bir ayar, bayrağı atlayan hesaplara yayılır.

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
  - Doğrudan bir tanıtıcının mevcut bir DM sohbeti yoksa OpenClaw, `POST /api/v1/chat/new` aracılığıyla bir tane oluşturur. Bu, BlueBubbles Private API'nin etkin olmasını gerektirir.

### iMessage ve SMS yönlendirmesi

Aynı tanıtıcının Mac'te hem iMessage hem de SMS sohbeti olduğunda (örneğin iMessage'a kayıtlı olan ancak yeşil balonlu yedekleri de almış bir telefon numarası), OpenClaw iMessage sohbetini tercih eder ve asla sessizce SMS'e düşmez. SMS sohbetini zorlamak için açık bir `sms:` hedef öneki kullanın (örneğin `sms:+15555550123`). Eşleşen iMessage sohbeti olmayan tanıtıcılar yine BlueBubbles'ın bildirdiği sohbet üzerinden gönderilir.

## Güvenlik

- Webhook isteklerinin kimliği, `guid`/`password` sorgu parametreleri veya başlıkları `channels.bluebubbles.password` ile karşılaştırılarak doğrulanır.
- API parolasını ve webhook uç noktasını gizli tutun (bunları kimlik bilgileri gibi ele alın).
- BlueBubbles webhook kimlik doğrulaması için localhost atlaması yoktur. Webhook trafiğini proxy'liyorsanız BlueBubbles parolasını istekte uçtan uca koruyun. `gateway.trustedProxies` burada `channels.bluebubbles.password` yerine geçmez. Bkz. [Gateway güvenliği](/tr/gateway/security#reverse-proxy-configuration).
- BlueBubbles sunucusunu LAN dışına açıyorsanız HTTPS + güvenlik duvarı kurallarını etkinleştirin.

## Sorun giderme

- Yazma/okundu olayları çalışmayı durdurursa BlueBubbles webhook günlüklerini kontrol edin ve Gateway yolunun `channels.bluebubbles.webhookPath` ile eşleştiğini doğrulayın.
- Eşleştirme kodlarının süresi bir saat sonra dolar; `openclaw pairing list bluebubbles` ve `openclaw pairing approve bluebubbles <code>` kullanın.
- Tepkiler BlueBubbles private API'sini gerektirir (`POST /api/v1/message/react`); sunucu sürümünün bunu sunduğundan emin olun.
- Düzenleme/göndermeyi geri alma için macOS 13+ ve uyumlu bir BlueBubbles sunucu sürümü gerekir. macOS 26'da (Tahoe), private API değişiklikleri nedeniyle düzenleme şu anda bozuk.
- Grup simgesi güncellemeleri macOS 26'da (Tahoe) güvenilmez olabilir: API başarı döndürebilir ancak yeni simge eşitlenmeyebilir.
- OpenClaw, BlueBubbles sunucusunun macOS sürümüne göre bozuk olduğu bilinen eylemleri otomatik olarak gizler. Düzenleme macOS 26'da (Tahoe) hâlâ görünüyorsa `channels.bluebubbles.actions.edit=false` ile el ile devre dışı bırakın.
- `coalesceSameSenderDms` etkin ama bölünmüş gönderimler (örn. `Dump` + URL) hâlâ iki tur olarak geliyorsa: [bölünmüş gönderim birleştirme sorun giderme](#split-send-coalescing-troubleshooting) kontrol listesine bakın - yaygın nedenler çok dar debounce penceresi, oturum günlüğü zaman damgalarının webhook geliş zamanı olarak yanlış okunması veya bir yanıt alıntısı gönderimidir (`replyToBody` kullanır, ikinci bir webhook değil).
- Durum/sağlık bilgisi için: `openclaw status --all` veya `openclaw status --deep`.

Genel kanal iş akışı başvurusu için [Kanallar](/tr/channels) ve [Plugins](/tr/tools/plugin) kılavuzuna bakın.

## İlgili

- [Kanal Yönlendirme](/tr/channels/channel-routing) - iletiler için oturum yönlendirmesi
- [Kanallara Genel Bakış](/tr/channels) - desteklenen tüm kanallar
- [Gruplar](/tr/channels/groups) - grup sohbeti davranışı ve bahsetme kapı denetimi
- [Eşleştirme](/tr/channels/pairing) - DM kimlik doğrulaması ve eşleştirme akışı
- [Güvenlik](/tr/gateway/security) - erişim modeli ve sıkılaştırma
