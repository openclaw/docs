---
read_when:
    - BlueBubbles kanalını kuruyorsunuz
    - Webhook eşleştirmede sorun gideriyorsunuz
    - macOS üzerinde iMessage yapılandırıyorsunuz
summary: BlueBubbles macOS sunucusu üzerinden iMessage (REST gönderme/alma, yazıyor göstergeleri, tepkiler, eşleştirme, gelişmiş eylemler).
title: BlueBubbles
x-i18n:
    generated_at: "2026-04-05T13:43:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: ed8e59a165bdfb8fd794ee2ad6e4dacd44aa02d512312c5f2fd7d15f863380bb
    source_path: channels/bluebubbles.md
    workflow: 15
---

# BlueBubbles (macOS REST)

Durum: HTTP üzerinden BlueBubbles macOS sunucusuyla konuşan paketlenmiş plugin. Eski imsg kanalına kıyasla daha zengin API'si ve daha kolay kurulumu nedeniyle **iMessage entegrasyonu için önerilir**.

## Paketlenmiş plugin

Güncel OpenClaw sürümleri BlueBubbles'ı paketli olarak içerir; bu nedenle normal paketlenmiş derlemelerde ayrı bir `openclaw plugins install` adımı gerekmez.

## Genel bakış

- BlueBubbles yardımcı uygulaması ([bluebubbles.app](https://bluebubbles.app)) üzerinden macOS'ta çalışır.
- Önerilen/test edilen: macOS Sequoia (15). macOS Tahoe (26) çalışır; düzenleme şu anda Tahoe'da bozuktur ve grup simgesi güncellemeleri başarılı görünebilir ancak senkronize olmayabilir.
- OpenClaw, bununla REST API'si üzerinden konuşur (`GET /api/v1/ping`, `POST /message/text`, `POST /chat/:id/*`).
- Gelen mesajlar webhook'lar üzerinden gelir; giden yanıtlar, yazıyor göstergeleri, okundu bilgileri ve tapback'ler REST çağrılarıdır.
- Ekler ve sticker'lar gelen medya olarak alınır ve mümkün olduğunda agente gösterilir.
- Eşleştirme/izin listesi diğer kanallarla aynı şekilde çalışır (`/channels/pairing` vb.) ve `channels.bluebubbles.allowFrom` + eşleştirme kodlarını kullanır.
- Tepkiler, Slack/Telegram'da olduğu gibi sistem olayları olarak gösterilir; böylece agent'lar yanıtlamadan önce bunlara "atıfta bulunabilir".
- Gelişmiş özellikler: düzenleme, geri alma, yanıt dizileme, mesaj efektleri, grup yönetimi.

## Hızlı başlangıç

1. Mac'inize BlueBubbles sunucusunu kurun ([bluebubbles.app/install](https://bluebubbles.app/install) adresindeki talimatları izleyin).
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

4. BlueBubbles webhook'larını gateway'inize yönlendirin (örnek: `https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`).
5. Gateway'i başlatın; webhook işleyicisini kaydedecek ve eşleştirmeyi başlatacaktır.

Güvenlik notu:

- Her zaman bir webhook parolası ayarlayın.
- Webhook kimlik doğrulaması her zaman zorunludur. OpenClaw, `channels.bluebubbles.password` ile eşleşen bir parola/guid içermedikçe BlueBubbles webhook isteklerini reddeder (örneğin `?password=<password>` veya `x-password`), loopback/proxy topolojisinden bağımsız olarak.
- Parola kimlik doğrulaması, tam webhook gövdeleri okunmadan/ayrıştırılmadan önce denetlenir.

## Messages.app etkin tutma (VM / başsız kurulumlar)

Bazı macOS VM / sürekli açık kurulumlarda Messages.app "boşta" duruma geçebilir (uygulama açılana/öne getirilene kadar gelen olaylar durur). Basit bir geçici çözüm, AppleScript + LaunchAgent kullanarak **Messages'ı her 5 dakikada bir dürtmektir**.

### 1) AppleScript'i kaydedin

Bunu şu konuma kaydedin:

- `~/Scripts/poke-messages.scpt`

Örnek betik (etkileşimsizdir; odağı çalmaz):

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

### 2) Bir LaunchAgent kurun

Bunu şu konuma kaydedin:

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
- İlk çalıştırma, macOS **Automation** istemlerini (`osascript` → Messages) tetikleyebilir. Bunları, LaunchAgent'i çalıştıran aynı kullanıcı oturumunda onaylayın.

Yükleyin:

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

- **Server URL** (zorunlu): BlueBubbles sunucu adresi (ör. `http://192.168.1.100:1234`)
- **Password** (zorunlu): BlueBubbles Server ayarlarından API parolası
- **Webhook path** (isteğe bağlı): Varsayılan `/bluebubbles-webhook`
- **DM policy**: pairing, allowlist, open veya disabled
- **Allow list**: Telefon numaraları, e-posta adresleri veya sohbet hedefleri

BlueBubbles'ı CLI üzerinden de ekleyebilirsiniz:

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

## Erişim denetimi (DM'ler + gruplar)

DM'ler:

- Varsayılan: `channels.bluebubbles.dmPolicy = "pairing"`.
- Bilinmeyen gönderenler bir eşleştirme kodu alır; onaylanana kadar mesajlar yok sayılır (kodların süresi 1 saat sonra dolar).
- Onaylamak için:
  - `openclaw pairing list bluebubbles`
  - `openclaw pairing approve bluebubbles <CODE>`
- Eşleştirme varsayılan token değişimidir. Ayrıntılar: [Eşleştirme](/channels/pairing)

Gruplar:

- `channels.bluebubbles.groupPolicy = open | allowlist | disabled` (varsayılan: `allowlist`).
- `channels.bluebubbles.groupAllowFrom`, `allowlist` ayarlı olduğunda gruplarda kimin tetikleyebileceğini denetler.

### Kişi adı zenginleştirmesi (macOS, isteğe bağlı)

BlueBubbles grup webhook'ları genellikle yalnızca ham katılımcı adreslerini içerir. Bunun yerine `GroupMembers` bağlamında yerel kişi adlarının görünmesini istiyorsanız, macOS'ta yerel Contacts zenginleştirmesini etkinleştirebilirsiniz:

- `channels.bluebubbles.enrichGroupParticipantsFromContacts = true` aramayı etkinleştirir. Varsayılan: `false`.
- Aramalar yalnızca grup erişimi, komut yetkilendirmesi ve bahsetme geçidi mesajın geçmesine izin verdikten sonra çalışır.
- Yalnızca adı olmayan telefon katılımcıları zenginleştirilir.
- Yerelde eşleşme bulunmazsa ham telefon numaraları geri dönüş olarak kalır.

```json5
{
  channels: {
    bluebubbles: {
      enrichGroupParticipantsFromContacts: true,
    },
  },
}
```

### Bahsetme geçidi (gruplar)

BlueBubbles, iMessage/WhatsApp davranışıyla eşleşen grup sohbetleri için bahsetme geçidini destekler:

- Bahsetmeleri algılamak için `agents.list[].groupChat.mentionPatterns` (veya `messages.groupChat.mentionPatterns`) kullanır.
- Bir grup için `requireMention` etkinse agent yalnızca kendisinden bahsedildiğinde yanıt verir.
- Yetkili gönderenlerden gelen kontrol komutları bahsetme geçidini atlar.

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

### Komut geçidi

- Kontrol komutları (ör. `/config`, `/model`) yetkilendirme gerektirir.
- Komut yetkilendirmesini belirlemek için `allowFrom` ve `groupAllowFrom` kullanılır.
- Yetkili gönderenler, gruplarda bahsetmeden bile kontrol komutlarını çalıştırabilir.

## ACP konuşma bağları

BlueBubbles sohbetleri, taşıma katmanı değiştirilmeden dayanıklı ACP çalışma alanlarına dönüştürülebilir.

Hızlı operatör akışı:

- DM içinde veya izin verilen grup sohbetinde `/acp spawn codex --bind here` komutunu çalıştırın.
- Aynı BlueBubbles konuşmasındaki gelecekteki mesajlar oluşturulan ACP oturumuna yönlendirilir.
- `/new` ve `/reset`, aynı bağlı ACP oturumunu yerinde sıfırlar.
- `/acp close`, ACP oturumunu kapatır ve bağı kaldırır.

Yapılandırılmış kalıcı bağlar da `type: "acp"` ve `match.channel: "bluebubbles"` içeren üst düzey `bindings[]` girdileriyle desteklenir.

`match.peer.id`, desteklenen herhangi bir BlueBubbles hedef biçimini kullanabilir:

- `+15555550123` veya `user@example.com` gibi normalize edilmiş DM handle'ı
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

Paylaşılan ACP bağlama davranışı için [ACP Agents](/tools/acp-agents) sayfasına bakın.

## Yazıyor göstergeleri + okundu bilgileri

- **Yazıyor göstergeleri**: Yanıt üretilmeden önce ve üretim sırasında otomatik olarak gönderilir.
- **Okundu bilgileri**: `channels.bluebubbles.sendReadReceipts` tarafından denetlenir (varsayılan: `true`).
- **Yazıyor göstergeleri**: OpenClaw yazıyor başlatma olayları gönderir; BlueBubbles gönderim veya zaman aşımıyla yazıyor durumunu otomatik olarak temizler (DELETE ile elle durdurma güvenilir değildir).

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

Kullanılabilir eylemler:

- **react**: Tapback tepkileri ekle/kaldır (`messageId`, `emoji`, `remove`)
- **edit**: Gönderilmiş bir mesajı düzenle (`messageId`, `text`)
- **unsend**: Bir mesajı geri al (`messageId`)
- **reply**: Belirli bir mesaja yanıt ver (`messageId`, `text`, `to`)
- **sendWithEffect**: iMessage efektiyle gönder (`text`, `to`, `effectId`)
- **renameGroup**: Bir grup sohbetini yeniden adlandır (`chatGuid`, `displayName`)
- **setGroupIcon**: Bir grup sohbetinin simgesini/fotoğrafını ayarla (`chatGuid`, `media`) — macOS 26 Tahoe'da güvenilir değildir (API başarılı dönebilir ama simge senkronize olmaz).
- **addParticipant**: Bir gruba birini ekle (`chatGuid`, `address`)
- **removeParticipant**: Bir gruptan birini çıkar (`chatGuid`, `address`)
- **leaveGroup**: Bir grup sohbetinden ayrıl (`chatGuid`)
- **upload-file**: Medya/dosya gönder (`to`, `buffer`, `filename`, `asVoice`)
  - Sesli notlar: iMessage sesli mesajı olarak göndermek için **MP3** veya **CAF** ses ile `asVoice: true` ayarlayın. BlueBubbles, sesli not gönderirken MP3 → CAF dönüştürmesi yapar.
- Eski takma ad: `sendAttachment` hâlâ çalışır, ancak kanonik eylem adı `upload-file`'dır.

### Mesaj kimlikleri (kısa ve tam)

OpenClaw, token tasarrufu sağlamak için _kısa_ mesaj kimlikleri (ör. `1`, `2`) gösterebilir.

- `MessageSid` / `ReplyToId` kısa kimlikler olabilir.
- `MessageSidFull` / `ReplyToIdFull`, sağlayıcının tam kimliklerini içerir.
- Kısa kimlikler bellek içindedir; yeniden başlatmada veya önbellek boşaltımında geçersiz olabilirler.
- Eylemler kısa veya tam `messageId` kabul eder, ancak kısa kimlikler artık mevcut değilse hata verir.

Dayanıklı otomasyonlar ve depolama için tam kimlikleri kullanın:

- Şablonlar: `{{MessageSidFull}}`, `{{ReplyToIdFull}}`
- Bağlam: gelen yüklerde `MessageSidFull` / `ReplyToIdFull`

Şablon değişkenleri için [Yapılandırma](/gateway/configuration) sayfasına bakın.

## Blok akışı

Yanıtların tek bir mesaj olarak mı gönderileceğini yoksa bloklar hâlinde mi akıtılacağını denetleyin:

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
- Gelen ve giden medya için medya sınırı `channels.bluebubbles.mediaMaxMb` ile belirlenir (varsayılan: 8 MB).
- Giden metin `channels.bluebubbles.textChunkLimit` değerine göre bölünür (varsayılan: 4000 karakter).

## Yapılandırma başvurusu

Tam yapılandırma: [Yapılandırma](/gateway/configuration)

Sağlayıcı seçenekleri:

- `channels.bluebubbles.enabled`: Kanalı etkinleştir/devre dışı bırak.
- `channels.bluebubbles.serverUrl`: BlueBubbles REST API temel URL'si.
- `channels.bluebubbles.password`: API parolası.
- `channels.bluebubbles.webhookPath`: Webhook uç nokta yolu (varsayılan: `/bluebubbles-webhook`).
- `channels.bluebubbles.dmPolicy`: `pairing | allowlist | open | disabled` (varsayılan: `pairing`).
- `channels.bluebubbles.allowFrom`: DM izin listesi (handle'lar, e-postalar, E.164 numaraları, `chat_id:*`, `chat_guid:*`).
- `channels.bluebubbles.groupPolicy`: `open | allowlist | disabled` (varsayılan: `allowlist`).
- `channels.bluebubbles.groupAllowFrom`: Grup gönderen izin listesi.
- `channels.bluebubbles.enrichGroupParticipantsFromContacts`: macOS'ta, geçit kontrolleri geçtikten sonra adı olmayan grup katılımcılarını yerel Contacts'tan isteğe bağlı olarak zenginleştirir. Varsayılan: `false`.
- `channels.bluebubbles.groups`: Grup başına yapılandırma (`requireMention` vb.).
- `channels.bluebubbles.sendReadReceipts`: Okundu bilgileri gönder (varsayılan: `true`).
- `channels.bluebubbles.blockStreaming`: Blok akışını etkinleştir (varsayılan: `false`; akış yanıtları için gereklidir).
- `channels.bluebubbles.textChunkLimit`: Karakter cinsinden giden parça boyutu (varsayılan: 4000).
- `channels.bluebubbles.chunkMode`: `length` (varsayılan) yalnızca `textChunkLimit` aşıldığında böler; `newline`, uzunluğa göre bölmeden önce boş satırlarda (paragraf sınırları) böler.
- `channels.bluebubbles.mediaMaxMb`: MB cinsinden gelen/giden medya sınırı (varsayılan: 8).
- `channels.bluebubbles.mediaLocalRoots`: Giden yerel medya yolları için izin verilen mutlak yerel dizinlerin açık izin listesi. Bu yapılandırılmadıkça yerel yol gönderimleri varsayılan olarak reddedilir. Hesap başına geçersiz kılma: `channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`.
- `channels.bluebubbles.historyLimit`: Bağlam için en fazla grup mesajı sayısı (0 devre dışı bırakır).
- `channels.bluebubbles.dmHistoryLimit`: DM geçmiş sınırı.
- `channels.bluebubbles.actions`: Belirli eylemleri etkinleştir/devre dışı bırak.
- `channels.bluebubbles.accounts`: Çok hesaplı yapılandırma.

İlgili genel seçenekler:

- `agents.list[].groupChat.mentionPatterns` (veya `messages.groupChat.mentionPatterns`).
- `messages.responsePrefix`.

## Adresleme / teslim hedefleri

Kararlı yönlendirme için `chat_guid` tercih edin:

- `chat_guid:iMessage;-;+15555550123` (gruplar için tercih edilir)
- `chat_id:123`
- `chat_identifier:...`
- Doğrudan handle'lar: `+15555550123`, `user@example.com`
  - Doğrudan bir handle için mevcut bir DM sohbeti yoksa OpenClaw bunu `POST /api/v1/chat/new` üzerinden oluşturur. Bunun için BlueBubbles Private API'nin etkinleştirilmiş olması gerekir.

## Güvenlik

- Webhook istekleri, `guid`/`password` sorgu parametreleri veya üstbilgileri `channels.bluebubbles.password` ile karşılaştırılarak kimlik doğrulanır.
- API parolasını ve webhook uç noktasını gizli tutun (bunlara kimlik bilgisi gibi davranın).
- BlueBubbles webhook kimlik doğrulaması için localhost atlaması yoktur. Webhook trafiğini proxy'liyorsanız BlueBubbles parolasını isteğin uçtan uca üzerinde tutun. Burada `gateway.trustedProxies`, `channels.bluebubbles.password` yerine geçmez. Bkz. [Gateway security](/gateway/security#reverse-proxy-configuration).
- BlueBubbles sunucusunu LAN dışına açıyorsanız HTTPS + güvenlik duvarı kurallarını etkinleştirin.

## Sorun giderme

- Yazıyor/okundu olayları çalışmayı bırakırsa BlueBubbles webhook günlüklerini kontrol edin ve gateway yolunun `channels.bluebubbles.webhookPath` ile eşleştiğini doğrulayın.
- Eşleştirme kodlarının süresi bir saat sonra dolar; `openclaw pairing list bluebubbles` ve `openclaw pairing approve bluebubbles <code>` kullanın.
- Tepkiler BlueBubbles private API'sini (`POST /api/v1/message/react`) gerektirir; sunucu sürümünün bunu sunduğundan emin olun.
- Düzenleme/geri alma, macOS 13+ ve uyumlu bir BlueBubbles sunucu sürümü gerektirir. macOS 26 (Tahoe) üzerinde, private API değişiklikleri nedeniyle düzenleme şu anda bozuktur.
- Grup simgesi güncellemeleri macOS 26 (Tahoe) üzerinde güvenilir olmayabilir: API başarılı dönebilir ancak yeni simge senkronize olmaz.
- OpenClaw, BlueBubbles sunucusunun macOS sürümüne göre bilinen bozuk eylemleri otomatik olarak gizler. macOS 26 (Tahoe) üzerinde düzenleme hâlâ görünüyorsa `channels.bluebubbles.actions.edit=false` ile elle devre dışı bırakın.
- Durum/sağlık bilgileri için: `openclaw status --all` veya `openclaw status --deep`.

Genel kanal iş akışı başvurusu için [Channels](/channels) ve [Plugins](/tools/plugin) kılavuzuna bakın.

## İlgili

- [Kanallara Genel Bakış](/channels) — desteklenen tüm kanallar
- [Eşleştirme](/channels/pairing) — DM kimlik doğrulaması ve eşleştirme akışı
- [Gruplar](/channels/groups) — grup sohbeti davranışı ve bahsetme geçidi
- [Kanal Yönlendirme](/channels/channel-routing) — mesajlar için oturum yönlendirme
- [Güvenlik](/gateway/security) — erişim modeli ve sağlamlaştırma
