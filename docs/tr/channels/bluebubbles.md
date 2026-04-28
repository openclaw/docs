---
read_when:
    - BlueBubbles kanalını ayarlama
    - Webhook eşleştirme sorunlarını giderme
    - macOS'te iMessage'ı yapılandırma
sidebarTitle: BlueBubbles
summary: BlueBubbles macOS sunucusu üzerinden iMessage (REST gönderme/alma, yazma göstergesi, tepkiler, eşleştirme, gelişmiş eylemler).
title: BlueBubbles
x-i18n:
    generated_at: "2026-04-26T11:22:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: d9a9eef02110f9e40f60c0bbd413c7ad7e33c377a7cf9ca2ae43aa170100ff77
    source_path: channels/bluebubbles.md
    workflow: 15
---

Durum: BlueBubbles macOS sunucusuyla HTTP üzerinden konuşan paketlenmiş Plugin. Eski imsg kanalına kıyasla daha zengin API'si ve daha kolay kurulumu nedeniyle **iMessage entegrasyonu için önerilir**.

<Note>
Mevcut OpenClaw sürümleri BlueBubbles'ı paketli olarak içerir, bu nedenle normal paketli derlemelerde ayrı bir `openclaw plugins install` adımına gerek yoktur.
</Note>

## Genel bakış

- BlueBubbles yardımcı uygulaması ([bluebubbles.app](https://bluebubbles.app)) aracılığıyla macOS üzerinde çalışır.
- Önerilen/test edilen: macOS Sequoia (15). macOS Tahoe (26) çalışır; düzenleme şu anda Tahoe'da bozuktur ve grup simgesi güncellemeleri başarılı görünebilir ancak senkronize olmayabilir.
- OpenClaw bununla REST API'si üzerinden iletişim kurar (`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`).
- Gelen mesajlar Webhook'lar aracılığıyla gelir; giden yanıtlar, yazma göstergeleri, okundu bilgileri ve tapback'ler REST çağrılarıdır.
- Ekler ve sticker'lar gelen medya olarak alınır (ve mümkün olduğunda aracıya gösterilir).
- MP3 veya CAF ses üreten otomatik TTS yanıtları, düz dosya eki yerine iMessage sesli not baloncukları olarak teslim edilir.
- Eşleştirme/izin listesi diğer kanallarla aynı şekilde çalışır (`/channels/pairing` vb.) ve `channels.bluebubbles.allowFrom` + eşleştirme kodlarını kullanır.
- Tepkiler, ajanların yanıtlamadan önce bunlara "değinebilmesi" için Slack/Telegram'da olduğu gibi sistem olayları olarak gösterilir.
- Gelişmiş özellikler: düzenleme, geri alma, yanıt iş parçacığı oluşturma, mesaj efektleri, grup yönetimi.

## Hızlı başlangıç

<Steps>
  <Step title="BlueBubbles'ı yükleyin">
    BlueBubbles sunucusunu Mac'inize yükleyin ([bluebubbles.app/install](https://bluebubbles.app/install) adresindeki talimatları izleyin).
  </Step>
  <Step title="Web API'yi etkinleştirin">
    BlueBubbles yapılandırmasında web API'yi etkinleştirin ve bir parola belirleyin.
  </Step>
  <Step title="OpenClaw'ı yapılandırın">
    `openclaw onboard` komutunu çalıştırıp BlueBubbles'ı seçin veya manuel olarak yapılandırın:

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
  <Step title="Webhook'ları gateway'e yönlendirin">
    BlueBubbles Webhook'larını gateway'inize yönlendirin (örnek: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`).
  </Step>
  <Step title="Gateway'i başlatın">
    Gateway'i başlatın; Webhook işleyicisini kaydeder ve eşleştirmeyi başlatır.
  </Step>
</Steps>

<Warning>
**Güvenlik**

- Her zaman bir Webhook parolası belirleyin.
- Webhook kimlik doğrulaması her zaman gereklidir. OpenClaw, `channels.bluebubbles.password` ile eşleşen bir parola/guid içermediği sürece BlueBubbles Webhook isteklerini reddeder (örneğin `?password=<password>` veya `x-password`), local loopback/proxy topolojisinden bağımsız olarak.
- Parola kimlik doğrulaması, tam Webhook gövdeleri okunup ayrıştırılmadan önce denetlenir.

</Warning>

## Messages.app'i çalışır durumda tutma (VM / başsız kurulumlar)

Bazı macOS VM / her zaman açık kurulumlarda Messages.app "boşta" durumuna geçebilir (uygulama açılıp öne getirilene kadar gelen olaylar durur). Basit bir geçici çözüm olarak, bir AppleScript + LaunchAgent kullanarak **Messages'ı her 5 dakikada bir dürtebilirsiniz**.

<Steps>
  <Step title="AppleScript'i kaydedin">
    Bunu `~/Scripts/poke-messages.scpt` olarak kaydedin:

    ```applescript
    try
      tell application "Messages"
        if not running then
          launch
        end if

        -- Süreci duyarlı tutmak için betik arayüzüne dokun.
        set _chatCount to (count of chats)
      end tell
    on error
      -- Geçici hataları yoksay (ilk çalıştırma istemleri, kilitli oturum vb.).
    end try
    ```

  </Step>
  <Step title="Bir LaunchAgent yükleyin">
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

    Bu işlem **her 300 saniyede bir** ve **oturum açıldığında** çalışır. İlk çalıştırma macOS **Automation** istemlerini tetikleyebilir (`osascript` → Messages). Bunları, LaunchAgent'i çalıştıran aynı kullanıcı oturumunda onaylayın.

  </Step>
  <Step title="Yükleyin">
    ```bash
    launchctl unload ~/Library/LaunchAgents/com.user.poke-messages.plist 2>/dev/null || true
    launchctl load ~/Library/LaunchAgents/com.user.poke-messages.plist
    ```
  </Step>
</Steps>

## İlk kurulum

BlueBubbles, etkileşimli ilk kurulumda kullanılabilir:

```
openclaw onboard
```

Sihirbaz şunları ister:

<ParamField path="Sunucu URL'si" type="string" required>
  BlueBubbles sunucu adresi (ör. `http://192.168.1.100:1234`).
</ParamField>
<ParamField path="Parola" type="string" required>
  BlueBubbles Sunucu ayarlarındaki API parolası.
</ParamField>
<ParamField path="Webhook yolu" type="string" default="/bluebubbles-webhook">
  Webhook uç nokta yolu.
</ParamField>
<ParamField path="DM ilkesi" type="string">
  `pairing`, `allowlist`, `open` veya `disabled`.
</ParamField>
<ParamField path="İzin listesi" type="string[]">
  Telefon numaraları, e-postalar veya sohbet hedefleri.
</ParamField>

BlueBubbles'ı CLI aracılığıyla da ekleyebilirsiniz:

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## Erişim denetimi (DM'ler + gruplar)

<Tabs>
  <Tab title="DM'ler">
    - Varsayılan: `channels.bluebubbles.dmPolicy = "pairing"`.
    - Bilinmeyen gönderenler bir eşleştirme kodu alır; onaylanana kadar mesajlar yok sayılır (kodların süresi 1 saat sonra dolar).
    - Şununla onaylayın:
      - `openclaw pairing list bluebubbles`
      - `openclaw pairing approve bluebubbles <CODE>`
    - Eşleştirme, varsayılan belirteç değişimidir. Ayrıntılar: [Eşleştirme](/tr/channels/pairing)

  </Tab>
  <Tab title="Gruplar">
    - `channels.bluebubbles.groupPolicy = open | allowlist | disabled` (varsayılan: `allowlist`).
    - `channels.bluebubbles.groupAllowFrom`, `allowlist` ayarlı olduğunda gruplarda kimin tetikleme yapabileceğini denetler.

  </Tab>
</Tabs>

### Kişi adı zenginleştirme (macOS, isteğe bağlı)

BlueBubbles grup Webhook'ları çoğu zaman yalnızca ham katılımcı adreslerini içerir. Bunun yerine `GroupMembers` bağlamının yerel kişi adlarını göstermesini istiyorsanız, macOS'te yerel Kişiler zenginleştirmesini etkinleştirebilirsiniz:

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` aramayı etkinleştirir. Varsayılan: `false`.
- Aramalar yalnızca grup erişimi, komut yetkilendirmesi ve mention geçitlemesi mesajın geçmesine izin verdikten sonra çalışır.
- Yalnızca adı olmayan telefon katılımcıları zenginleştirilir.
- Yerel eşleşme bulunamadığında yedek olarak ham telefon numaraları kalır.

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

BlueBubbles, iMessage/WhatsApp davranışıyla uyumlu olarak grup sohbetleri için mention geçitlemesini destekler:

- Mention'ları algılamak için `agents.list[].groupChat.mentionPatterns` (veya `messages.groupChat.mentionPatterns`) kullanır.
- Bir grup için `requireMention` etkinleştirildiğinde, ajan yalnızca kendisinden bahsedildiğinde yanıt verir.
- Yetkili gönderenlerden gelen kontrol komutları mention geçitlemesini atlar.

Grup başına yapılandırma:

```json5
{
  channels: {
    bluebubbles: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123"],
      groups: {
        "*": { requireMention: true }, // tüm gruplar için varsayılan
        "iMessage;-;chat123": { requireMention: false }, // belirli grup için geçersiz kılma
      },
    },
  },
}
```

### Komut geçitlemesi

- Kontrol komutları (örn. `/config`, `/model`) yetkilendirme gerektirir.
- Komut yetkilendirmesini belirlemek için `allowFrom` ve `groupAllowFrom` kullanılır.
- Yetkili gönderenler, gruplarda mention olmasa bile kontrol komutlarını çalıştırabilir.

### Grup başına sistem istemi

`channels.bluebubbles.groups.*` altındaki her giriş isteğe bağlı bir `systemPrompt` dizgesini kabul eder. Değer, o gruptaki bir mesajı işleyen her turda ajanın sistem istemine eklenir; böylece ajan istemlerini düzenlemeden grup başına persona veya davranış kuralları belirleyebilirsiniz:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;-;chat123": {
          systemPrompt: "Yanıtları 3 cümlenin altında tut. Grubun gündelik tonunu yansıt.",
        },
      },
    },
  },
}
```

Anahtar, BlueBubbles'ın grup için `chatGuid` / `chatIdentifier` / sayısal `chatId` olarak bildirdiği şeyle eşleşir ve `"*"` joker karakter girişi, tam eşleşmesi olmayan her grup için varsayılan sağlar (`requireMention` ve grup başına araç ilkelerinde kullanılan aynı desen). Tam eşleşmeler her zaman joker karaktere üstün gelir. DM'ler bu alanı yok sayar; bunun yerine ajan düzeyinde veya hesap düzeyinde istem özelleştirmesi kullanın.

#### Uygulamalı örnek: iş parçacıklı yanıtlar ve tapback tepkileri (Private API)

BlueBubbles Private API etkinleştirildiğinde, gelen mesajlar kısa mesaj kimlikleriyle gelir (örneğin `[[reply_to:5]]`) ve ajan belirli bir mesaja iş parçacığıyla yanıt vermek için `action=reply` ya da bir tapback bırakmak için `action=react` çağırabilir. Grup başına `systemPrompt`, ajanın doğru aracı seçmesini sağlamanın güvenilir bir yoludur:

```json5
{
  channels: {
    bluebubbles: {
      groups: {
        "iMessage;+;chat-family": {
          systemPrompt: [
            "Bu grupta yanıt verirken her zaman bağlamdaki",
            "[[reply_to:N]] messageId ile action=reply çağır ki yanıtın",
            "tetikleyen mesajın altında iş parçacığına bağlansın.",
            "Asla yeni ve bağlantısız bir mesaj gönderme.",
            "",
            "Kısa onaylar için ('ok', 'aldım', 'hallederim'),",
            "metin yanıtı göndermek yerine uygun bir tapback emojisiyle",
            "action=react kullan (❤️, 👍, 😂, ‼️, ❓).",
          ].join(" "),
        },
      },
    },
  },
}
```

Tapback tepkileri ve iş parçacıklı yanıtların ikisi de BlueBubbles Private API gerektirir; altta yatan mekanikler için [Gelişmiş eylemler](#advanced-actions) ve [Mesaj kimlikleri](#message-ids-short-vs-full) bölümlerine bakın.

## ACP konuşma bağlamaları

BlueBubbles sohbetleri, taşıma katmanını değiştirmeden kalıcı ACP çalışma alanlarına dönüştürülebilir.

Hızlı operatör akışı:

- DM veya izin verilen grup sohbeti içinde `/acp spawn codex --bind here` çalıştırın.
- Aynı BlueBubbles konuşmasındaki sonraki mesajlar, oluşturulan ACP oturumuna yönlendirilir.
- `/new` ve `/reset`, aynı bağlı ACP oturumunu yerinde sıfırlar.
- `/acp close`, ACP oturumunu kapatır ve bağlamayı kaldırır.

Yapılandırılmış kalıcı bağlamalar da `type: "acp"` ve `match.channel: "bluebubbles"` içeren üst düzey `bindings[]` girdileriyle desteklenir.

`match.peer.id`, desteklenen herhangi bir BlueBubbles hedef biçimini kullanabilir:

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

Paylaşılan ACP bağlama davranışı için bkz. [ACP Agents](/tr/tools/acp-agents).

## Yazma + okundu bilgileri

- **Yazma göstergeleri**: Yanıt üretimi öncesinde ve sırasında otomatik olarak gönderilir.
- **Okundu bilgileri**: `channels.bluebubbles.sendReadReceipts` ile denetlenir (varsayılan: `true`).
- **Yazma göstergeleri**: OpenClaw yazma başlangıç olayları gönderir; BlueBubbles gönderim veya zaman aşımında yazma durumunu otomatik olarak temizler (DELETE ile manuel durdurma güvenilir değildir).

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
        edit: true, // gönderilen mesajları düzenle (macOS 13+, macOS 26 Tahoe'da bozuk)
        unsend: true, // mesajları geri al (macOS 13+)
        reply: true, // mesaj GUID'sine göre yanıt iş parçacığı oluşturma
        sendWithEffect: true, // mesaj efektleri (slam, loud vb.)
        renameGroup: true, // grup sohbetlerini yeniden adlandır
        setGroupIcon: true, // grup sohbeti simgesini/fotoğrafını ayarla (macOS 26 Tahoe'da kararsız)
        addParticipant: true, // gruplara katılımcı ekle
        removeParticipant: true, // gruplardan katılımcı kaldır
        leaveGroup: true, // grup sohbetlerinden ayrıl
        sendAttachment: true, // ek/medya gönder
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Kullanılabilir eylemler">
    - **react**: Tapback tepkileri ekle/kaldır (`messageId`, `emoji`, `remove`). iMessage'ın yerel tapback kümesi `love`, `like`, `dislike`, `laugh`, `emphasize` ve `question` değerlerinden oluşur. Bir ajan bu kümenin dışında bir emoji seçtiğinde (örneğin `👀`), tepki aracı tüm isteğin başarısız olması yerine tapback'in yine de işlenmesi için `love` değerine geri döner. Yapılandırılmış ack tepkileri ise sıkı şekilde doğrulanır ve bilinmeyen değerlerde hata verir.
    - **edit**: Gönderilmiş bir mesajı düzenle (`messageId`, `text`).
    - **unsend**: Bir mesajı geri al (`messageId`).
    - **reply**: Belirli bir mesaja yanıt ver (`messageId`, `text`, `to`).
    - **sendWithEffect**: iMessage efektiyle gönder (`text`, `to`, `effectId`).
    - **renameGroup**: Bir grup sohbetini yeniden adlandır (`chatGuid`, `displayName`).
    - **setGroupIcon**: Bir grup sohbetinin simgesini/fotoğrafını ayarla (`chatGuid`, `media`) — macOS 26 Tahoe'da kararsızdır (API başarılı dönebilir ancak simge senkronize olmaz).
    - **addParticipant**: Bir gruba kişi ekle (`chatGuid`, `address`).
    - **removeParticipant**: Bir kişiyi gruptan kaldır (`chatGuid`, `address`).
    - **leaveGroup**: Bir grup sohbetinden ayrıl (`chatGuid`).
    - **upload-file**: Medya/dosya gönder (`to`, `buffer`, `filename`, `asVoice`).
      - Sesli notlar: iMessage sesli mesajı olarak göndermek için **MP3** veya **CAF** ses ile `asVoice: true` ayarlayın. BlueBubbles, sesli not gönderirken MP3 → CAF dönüştürmesi yapar.
    - Eski takma ad: `sendAttachment` hâlâ çalışır, ancak kanonik eylem adı `upload-file`'dır.

  </Accordion>
</AccordionGroup>

### Mesaj kimlikleri (kısa ve tam)

OpenClaw, belirteç tasarrufu için _kısa_ mesaj kimliklerini (ör. `1`, `2`) gösterebilir.

- `MessageSid` / `ReplyToId` kısa kimlikler olabilir.
- `MessageSidFull` / `ReplyToIdFull` sağlayıcının tam kimliklerini içerir.
- Kısa kimlikler bellektedir; yeniden başlatma veya önbellek silme sonrası geçersiz olabilirler.
- Eylemler kısa veya tam `messageId` kabul eder, ancak kısa kimlikler artık mevcut değilse hata verir.

Kalıcı otomasyonlar ve depolama için tam kimlikleri kullanın:

- Şablonlar: `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- Bağlam: gelen yüklerde `MessageSidFull` / `ReplyToIdFull`

Şablon değişkenleri için bkz. [Yapılandırma](/tr/gateway/configuration).

<a id="coalescing-split-send-dms-command--url-in-one-composition"></a>

## Bölünmüş gönderilen DM'leri birleştirme (tek iletide komut + URL)

Bir kullanıcı iMessage'ta bir komut ve bir URL'yi birlikte yazdığında — örneğin `Dump https://example.com/article` — Apple gönderimi **iki ayrı Webhook teslimatına** böler:

1. Bir metin mesajı (`"Dump"`).
2. Ek olarak OG önizleme görselleri içeren bir URL önizleme balonu (`"https://..."`).

İki Webhook çoğu kurulumda OpenClaw'a yaklaşık 0,8-2,0 sn arayla ulaşır. Birleştirme olmadan ajan 1. turda komutu tek başına alır, yanıt verir (çoğu zaman "URL'yi gönder"), sonra ancak 2. turda URL'yi görür — bu noktada komut bağlamı zaten kaybolmuştur.

`channels.bluebubbles.coalesceSameSenderDms`, bir DM'yi aynı gönderenden gelen ardışık Webhook'ları tek bir ajan turunda birleştirecek şekilde etkinleştirir. Çok kullanıcılı tur yapısı korunsun diye grup sohbetleri mesaj başına anahtarlanmaya devam eder.

<Tabs>
  <Tab title="Ne zaman etkinleştirilmeli">
    Şu durumlarda etkinleştirin:

    - Tek mesajda `komut + yük` bekleyen Skills yayınlıyorsanız (dump, paste, save, queue vb.).
    - Kullanıcılarınız komutlarla birlikte URL'ler, görseller veya uzun içerikler yapıştırıyorsa.
    - DM tur gecikmesindeki artışı kabul edebiliyorsanız (aşağıya bakın).

    Şu durumlarda devre dışı bırakın:

    - Tek kelimelik DM tetikleyicileri için minimum komut gecikmesine ihtiyacınız varsa.
    - Tüm akışlarınız yük takibi olmayan tek seferlik komutlarsa.

  </Tab>
  <Tab title="Etkinleştirme">
    ```json5
    {
      channels: {
        bluebubbles: {
          coalesceSameSenderDms: true, // etkinleştir (varsayılan: false)
        },
      },
    }
    ```

    Bayrak açıkken ve açık bir `messages.inbound.byChannel.bluebubbles` yokken, debounce penceresi **2500 ms**'ye genişler (birleştirme yapılmayan durumda varsayılan 500 ms'dir). Daha geniş pencere gereklidir — Apple'ın 0,8-2,0 sn'lik bölünmüş gönderim temposu daha dar varsayılan aralığa sığmaz.

    Pencereyi kendiniz ayarlamak için:

    ```json5
    {
      messages: {
        inbound: {
          byChannel: {
            // 2500 ms çoğu kurulumda işe yarar; Mac'iniz yavaşsa
            // veya bellek baskısı altındaysa 4000 ms'ye yükseltin
            // (gözlenen aralık o zaman 2 sn'nin üzerine uzayabilir).
            bluebubbles: 2500,
          },
        },
      },
    }
    ```

  </Tab>
  <Tab title="Ödünleşimler">
    - **DM kontrol komutları için ek gecikme.** Bayrak açıkken DM kontrol komutu mesajları (`Dump`, `Save` vb.) artık bir yük Webhook'u gelip gelmeyeceğini görmek için debounce penceresi kadar bekler. Grup sohbeti komutları anında gönderilmeye devam eder.
    - **Birleştirilmiş çıktı sınırlıdır** — birleştirilmiş metin 4000 karakter ile sınırlandırılır ve açık bir `…[truncated]` işaretine sahiptir; ekler 20 ile sınırlıdır; kaynak girdileri 10 ile sınırlıdır (ilk + en son, bunun ötesinde korunur). Her kaynak `messageId`, gelen tekilleştirme sürecine yine de ulaşır; böylece herhangi bir olayın daha sonra MessagePoller tarafından yeniden oynatılması yinelenen olarak tanınır.
    - **İsteğe bağlı, kanal başına.** Diğer kanallar (Telegram, WhatsApp, Slack, …) etkilenmez.

  </Tab>
</Tabs>

### Senaryolar ve ajanın gördüğü şey

| Kullanıcının oluşturduğu içerik                                      | Apple'ın teslim ettiği    | Bayrak kapalı (varsayılan)              | Bayrak açık + 2500 ms pencere                                          |
| -------------------------------------------------------------------- | ------------------------- | --------------------------------------- | ---------------------------------------------------------------------- |
| `Dump https://example.com` (tek gönderim)                            | ~1 sn arayla 2 Webhook    | İki ajan turu: tek başına "Dump", sonra URL | Tek tur: birleştirilmiş metin `Dump https://example.com`           |
| `Save this 📎image.jpg caption` (ek + metin)                         | 2 Webhook                 | İki tur                                 | Tek tur: metin + görsel                                                |
| `/status` (tek başına komut)                                         | 1 Webhook                 | Anında gönderim                         | **Pencere süresine kadar bekler, sonra gönderir**                      |
| Tek başına yapıştırılmış URL                                         | 1 Webhook                 | Anında gönderim                         | Anında gönderim (kovada yalnızca bir giriş vardır)                     |
| Metin + URL'nin bilinçli olarak dakikalar arayla iki ayrı mesaj gönderilmesi | Pencere dışında 2 Webhook | İki tur                                 | İki tur (aralarında pencerenin süresi dolar)                           |
| Hızlı akış (pencere içinde >10 küçük DM)                             | N Webhook                 | N tur                                   | Tek tur, sınırlı çıktı (ilk + en son, metin/ek sınırları uygulanır)   |

### Bölünmüş gönderim birleştirme için sorun giderme

Bayrak açıksa ve bölünmüş gönderimler hâlâ iki tur olarak geliyorsa, her katmanı denetleyin:

<AccordionGroup>
  <Accordion title="Yapılandırma gerçekten yüklendi">
    ```
    grep coalesceSameSenderDms ~/.openclaw/openclaw.json
    ```

    Ardından `openclaw gateway restart` — bayrak, debouncer kayıt defteri oluşturulurken okunur.

  </Accordion>
  <Accordion title="Debounce penceresi kurulumunuz için yeterince geniş">
    BlueBubbles sunucu günlüğüne `~/Library/Logs/bluebubbles-server/main.log` altında bakın:

    ```
    grep -E "Dispatching event to webhook" main.log | tail -20
    ```

    `"Dump"` tarzı metin gönderimi ile onu izleyen `"https://..."; Attachments:` gönderimi arasındaki boşluğu ölçün. `messages.inbound.byChannel.bluebubbles` değerini bu boşluğu rahatça kapsayacak şekilde yükseltin.

  </Accordion>
  <Accordion title="Oturum JSONL zaman damgaları ≠ Webhook varış zamanı">
    Oturum olay zaman damgaları (`~/.openclaw/agents/<id>/sessions/*.jsonl`), Webhook'un ne zaman ulaştığını değil, gateway'in mesajı ajana ne zaman verdiğini yansıtır. `[Queued messages while agent was busy]` etiketiyle kuyruğa alınmış ikinci mesaj, ikinci Webhook geldiğinde ilk turun hâlâ çalıştığı anlamına gelir — birleştirme kovası zaten boşaltılmıştır. Pencereyi oturum günlüğüne göre değil, BB sunucu günlüğüne göre ayarlayın.
  </Accordion>
  <Accordion title="Yanıt gönderimini yavaşlatan bellek baskısı">
    Daha küçük makinelerde (8 GB), ajan turları birleştirme kovasının yanıt tamamlanmadan boşalmasına yetecek kadar uzun sürebilir ve URL sıradaki ikinci tur olarak gelir. `memory_pressure` ve `ps -o rss -p $(pgrep openclaw-gateway)` çıktısını denetleyin; gateway ~500 MB RSS'nin üzerindeyse ve sıkıştırıcı etkinse, diğer ağır işlemleri kapatın veya daha büyük bir ana bilgisayara geçin.
  </Accordion>
  <Accordion title="Alıntılı yanıt gönderimleri farklı bir yoldur">
    Kullanıcı `Dump` ifadesine var olan bir URL balonuna **yanıt** olarak dokunduysa (iMessage, Dump balonunda "1 Reply" rozeti gösterir), URL ikinci bir Webhook'ta değil `replyToBody` içinde bulunur. Birleştirme uygulanmaz — bu bir debouncer meselesi değil, bir skill/istem meselesidir.
  </Accordion>
</AccordionGroup>

## Blok akışı

Yanıtların tek bir mesaj olarak mı gönderileceğini yoksa bloklar halinde mi akıtılacağını denetleyin:

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
- Gelen ve giden medya için `channels.bluebubbles.mediaMaxMb` üzerinden medya sınırı uygulanır (varsayılan: 8 MB).
- Giden metin `channels.bluebubbles.textChunkLimit` değerine göre parçalara ayrılır (varsayılan: 4000 karakter).

## Yapılandırma başvurusu

Tam yapılandırma: [Yapılandırma](/tr/gateway/configuration)

<AccordionGroup>
  <Accordion title="Bağlantı ve Webhook">
    - `channels.bluebubbles.enabled`: Kanalı etkinleştir/devre dışı bırak.
    - `channels.bluebubbles.serverUrl`: BlueBubbles REST API temel URL'si.
    - `channels.bluebubbles.password`: API parolası.
    - `channels.bluebubbles.webhookPath`: Webhook uç nokta yolu (varsayılan: `/bluebubbles-webhook`).

  </Accordion>
  <Accordion title="Erişim ilkesi">
    - `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled` (varsayılan: `pairing`).
    - `channels.bluebubbles.allowFrom`: DM izin listesi (tanıtıcılar, e-postalar, E.164 numaraları, `chat_id:*`, `chat_guid:*`).
    - `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled` (varsayılan: `allowlist`).
    - `channels.bluebubbles.groupAllowFrom`: Grup gönderen izin listesi.
    - `channels.bluebubbles.enrichGroupParticipantsFromContacts`: macOS'te, geçitleme geçildikten sonra adı olmayan grup katılımcılarını isteğe bağlı olarak yerel Kişiler'den zenginleştirir. Varsayılan: `false`.
    - `channels.bluebubbles.groups`: Grup başına yapılandırma (`requireMention` vb.).

  </Accordion>
  <Accordion title="Teslimat ve parçalama">
    - `channels.bluebubbles.sendReadReceipts`: Okundu bilgileri gönder (varsayılan: `true`).
    - `channels.bluebubbles.blockStreaming`: Blok akışını etkinleştir (varsayılan: `false`; akış yanıtları için gereklidir).
    - `channels.bluebubbles.textChunkLimit`: Karakter cinsinden giden parça boyutu (varsayılan: 4000).
    - `channels.bluebubbles.sendTimeoutMs`: `/api/v1/message/text` üzerinden giden metin gönderimleri için istek başına ms cinsinden zaman aşımı (varsayılan: 30000). Private API iMessage gönderimlerinin iMessage altyapısı içinde 60+ saniye takılabildiği macOS 26 kurulumlarında yükseltin; örneğin `45000` veya `60000`. Problar, sohbet aramaları, tepkiler, düzenlemeler ve sağlık kontrolleri şu anda daha kısa olan 10 sn varsayılanını korur; kapsamın tepkiler ve düzenlemelere de genişletilmesi sonraki bir adım olarak planlanmaktadır. Hesap başına geçersiz kılma: `channels.bluebubbles.accounts.<accountId>.sendTimeoutMs`.
    - `channels.bluebubbles.chunkMode`: `length` (varsayılan) yalnızca `textChunkLimit` aşıldığında böler; `newline` uzunluk bazlı parçalamadan önce boş satırlardan (paragraf sınırları) böler.

  </Accordion>
  <Accordion title="Medya ve geçmiş">
    - `channels.bluebubbles.mediaMaxMb`: MB cinsinden gelen/giden medya sınırı (varsayılan: 8).
    - `channels.bluebubbles.mediaLocalRoots`: Giden yerel medya yolları için izin verilen mutlak yerel dizinlerin açık izin listesi. Bu yapılandırılmadıkça yerel yol gönderimleri varsayılan olarak reddedilir. Hesap başına geçersiz kılma: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`.
    - `channels.bluebubbles.coalesceSameSenderDms`: Apple'ın metin+URL bölünmüş gönderiminin tek bir mesaj olarak gelmesi için aynı gönderenden gelen ardışık DM Webhook'larını tek bir ajan turunda birleştirir (varsayılan: `false`). Senaryolar, pencere ayarlama ve ödünleşimler için bkz. [Bölünmüş gönderilen DM'leri birleştirme](#coalescing-split-send-dms-command--url-in-one-composition). Açık bir `messages.inbound.byChannel.bluebubbles` olmadan etkinleştirildiğinde varsayılan gelen debounce penceresini 500 ms'den 2500 ms'ye genişletir.
    - `channels.bluebubbles.historyLimit`: Bağlam için en fazla grup mesajı sayısı (0 devre dışı bırakır).
    - `channels.bluebubbles.dmHistoryLimit`: DM geçmiş sınırı.

  </Accordion>
  <Accordion title="Eylemler ve hesaplar">
    - `channels.bluebubbles.actions`: Belirli eylemleri etkinleştir/devre dışı bırak.
    - `channels.bluebubbles.accounts`: Çoklu hesap yapılandırması.

  </Accordion>
</AccordionGroup>

İlgili genel seçenekler:

- `agents.list[].groupChat.mentionPatterns` (veya `messages.groupChat.mentionPatterns`).
- `messages.responsePrefix`.

## Adresleme / teslimat hedefleri

Kararlı yönlendirme için `chat_guid` tercih edin:

- `chat_guid:iMessage;-;+15555550123` (gruplar için tercih edilir)
- `chat_id:123`
- `chat_identifier:...`
- Doğrudan tanıtıcılar: `+15555550123`, `user@example.com`
  - Doğrudan bir tanıtıcının mevcut bir DM sohbeti yoksa, OpenClaw `POST /api/v1/chat/new` aracılığıyla bir tane oluşturur. Bunun için BlueBubbles Private API'nin etkinleştirilmiş olması gerekir.

### iMessage ve SMS yönlendirmesi

Aynı tanıtıcının Mac üzerinde hem bir iMessage hem de bir SMS sohbeti olduğunda (örneğin iMessage'a kayıtlı bir telefon numarası ama aynı zamanda yeşil balon geri dönüşleri de almışsa), OpenClaw iMessage sohbetini tercih eder ve sessizce SMS'e düşürmez. SMS sohbetini zorlamak için açık bir `sms:` hedef öneki kullanın (örneğin `sms:+15555550123`). Eşleşen bir iMessage sohbeti olmayan tanıtıcılar, BlueBubbles'ın bildirdiği hangi sohbet varsa onun üzerinden gönderilir.

## Güvenlik

- Webhook istekleri, `guid`/`password` sorgu parametrelerinin veya üstbilgilerinin `channels.bluebubbles.password` ile karşılaştırılmasıyla kimlik doğrulamasından geçirilir.
- API parolasını ve Webhook uç noktasını gizli tutun (kimlik bilgileri gibi değerlendirin).
- BlueBubbles Webhook kimlik doğrulaması için localhost atlaması yoktur. Webhook trafiğini proxy'liyorsanız, BlueBubbles parolasını istek üzerinde uçtan uca koruyun. Burada `gateway.trustedProxies`, `channels.bluebubbles.password` yerine geçmez. Bkz. [Gateway güvenliği](/tr/gateway/security#reverse-proxy-configuration).
- LAN dışına açıyorsanız BlueBubbles sunucusunda HTTPS + güvenlik duvarı kurallarını etkinleştirin.

## Sorun giderme

- Yazma/okuma olayları çalışmayı durdurursa BlueBubbles Webhook günlüklerini denetleyin ve gateway yolunun `channels.bluebubbles.webhookPath` ile eşleştiğini doğrulayın.
- Eşleştirme kodlarının süresi bir saat sonra dolar; `openclaw pairing list bluebubbles` ve `openclaw pairing approve bluebubbles <code>` kullanın.
- Tepkiler BlueBubbles private API'sini gerektirir (`POST /api/v1/message/react`); sunucu sürümünün bunu sunduğundan emin olun.
- Düzenleme/geri alma için macOS 13+ ve uyumlu bir BlueBubbles sunucu sürümü gerekir. macOS 26'da (Tahoe), düzenleme şu anda private API değişiklikleri nedeniyle bozuktur.
- Grup simgesi güncellemeleri macOS 26'da (Tahoe) kararsız olabilir: API başarılı dönebilir ama yeni simge senkronize olmaz.
- OpenClaw, BlueBubbles sunucusunun macOS sürümüne göre bilinen bozuk eylemleri otomatik olarak gizler. Düzenleme macOS 26'da (Tahoe) hâlâ görünüyorsa `channels.bluebubbles.actions.edit=false` ile elle devre dışı bırakın.
- `coalesceSameSenderDms` etkin olduğu halde bölünmüş gönderimler (örn. `Dump` + URL) hâlâ iki tur olarak geliyorsa [bölünmüş gönderim birleştirme için sorun giderme](#split-send-coalescing-troubleshooting) denetim listesini inceleyin — yaygın nedenler çok dar debounce penceresi, oturum günlüğü zaman damgalarının Webhook varışı sanılması veya alıntılı yanıt gönderimidir (`replyToBody` kullanır, ikinci bir Webhook değil).
- Durum/sağlık bilgileri için: `openclaw status --all` veya `openclaw status --deep`.

Genel kanal iş akışı başvurusu için [Channels](/tr/channels) ve [Plugins](/tr/tools/plugin) kılavuzuna bakın.

## İlgili

- [Kanal yönlendirme](/tr/channels/channel-routing) — mesajlar için oturum yönlendirmesi
- [Kanal genel bakışı](/tr/channels) — desteklenen tüm kanallar
- [Gruplar](/tr/channels/groups) — grup sohbeti davranışı ve mention geçitlemesi
- [Eşleştirme](/tr/channels/pairing) — DM kimlik doğrulaması ve eşleştirme akışı
- [Güvenlik](/tr/gateway/security) — erişim modeli ve sağlamlaştırma
