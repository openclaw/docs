---
read_when:
    - Kanal Plugin'ini yapılandırma (kimlik doğrulama, erişim denetimi, çoklu hesap)
    - Kanala özgü yapılandırma anahtarlarında sorun giderme
    - DM politikasını, grup politikasını veya bahsetme geçitlemesini denetleme
summary: 'Kanal yapılandırması: Slack, Discord, Telegram, WhatsApp, Matrix, iMessage ve daha fazlasında erişim denetimi, eşleştirme ve kanal başına anahtarlar'
title: Yapılandırma — kanallar
x-i18n:
    generated_at: "2026-05-03T21:31:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 366bcee632c649219bbf6cf44d64cc13d966ec813abc74d54088d89de640b47c
    source_path: gateway/config-channels.md
    workflow: 16
---

`channels.*` altındaki kanal başına yapılandırma anahtarları. DM ve grup erişimini,
çok hesaplı kurulumları, bahsetme kapılamasını ve Slack, Discord,
Telegram, WhatsApp, Matrix, iMessage ve diğer paketlenmiş kanal Plugin'leri için kanal başına anahtarları kapsar.

Ajanlar, araçlar, Gateway çalışma zamanı ve diğer üst düzey anahtarlar için bkz.
[Yapılandırma başvurusu](/tr/gateway/configuration-reference).

## Kanallar

Her kanal, yapılandırma bölümü mevcut olduğunda otomatik olarak başlar (`enabled: false` olmadığı sürece).

### DM ve grup erişimi

Tüm kanallar DM ilkelerini ve grup ilkelerini destekler:

| DM ilkesi           | Davranış                                                        |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (varsayılan) | Bilinmeyen gönderenler tek kullanımlık bir eşleştirme kodu alır; sahibin onaylaması gerekir |
| `allowlist`         | Yalnızca `allowFrom` içindeki gönderenler (veya eşleştirilmiş izin deposu) |
| `open`              | Tüm gelen DM'lere izin ver (`allowFrom: ["*"]` gerektirir)             |
| `disabled`          | Tüm gelen DM'leri yok say                                          |

| Grup ilkesi          | Davranış                                               |
| --------------------- | ------------------------------------------------------ |
| `allowlist` (varsayılan) | Yalnızca yapılandırılmış izin listesiyle eşleşen gruplar          |
| `open`                | Grup izin listelerini atla (bahsetme kapılaması yine de geçerlidir) |
| `disabled`            | Tüm grup/oda mesajlarını engelle                          |

<Note>
`channels.defaults.groupPolicy`, bir sağlayıcının `groupPolicy` değeri ayarlanmamışsa varsayılanı belirler.
Eşleştirme kodlarının süresi 1 saat sonra dolar. Bekleyen DM eşleştirme istekleri **kanal başına 3** ile sınırlandırılır.
Bir sağlayıcı bloğu tamamen eksikse (`channels.<provider>` yoksa), çalışma zamanı grup ilkesi başlangıç uyarısıyla birlikte `allowlist` değerine (güvenli kapalı) geri döner.
</Note>

### Kanal modeli geçersiz kılmaları

Belirli kanal ID'lerini bir modele sabitlemek için `channels.modelByChannel` kullanın. Değerler `provider/model` veya yapılandırılmış model takma adlarını kabul eder. Kanal eşlemesi, bir oturumun zaten model geçersiz kılması olmadığında uygulanır (örneğin, `/model` ile ayarlanmışsa uygulanmaz).

```json5
{
  channels: {
    modelByChannel: {
      discord: {
        "123456789012345678": "anthropic/claude-opus-4-6",
      },
      slack: {
        C1234567890: "openai/gpt-4.1",
      },
      telegram: {
        "-1001234567890": "openai/gpt-4.1-mini",
        "-1001234567890:topic:99": "anthropic/claude-sonnet-4-6",
      },
    },
  },
}
```

### Kanal varsayılanları ve Heartbeat

Sağlayıcılar arasında paylaşılan grup ilkesi ve Heartbeat davranışı için `channels.defaults` kullanın:

```json5
{
  channels: {
    defaults: {
      groupPolicy: "allowlist", // open | allowlist | disabled
      contextVisibility: "all", // all | allowlist | allowlist_quote
      heartbeat: {
        showOk: false,
        showAlerts: true,
        useIndicator: true,
      },
    },
  },
}
```

- `channels.defaults.groupPolicy`: Sağlayıcı düzeyinde `groupPolicy` ayarlanmamışsa geri dönüş grup ilkesi.
- `channels.defaults.contextVisibility`: Tüm kanallar için varsayılan ek bağlam görünürlüğü modu. Değerler: `all` (varsayılan, alıntılanan/iş parçacığı/geçmiş bağlamının tümünü dahil et), `allowlist` (yalnızca izin listesindeki gönderenlerden gelen bağlamı dahil et), `allowlist_quote` (allowlist ile aynı, ancak açık alıntı/yanıt bağlamını koru). Kanal başına geçersiz kılma: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: Heartbeat çıktısına sağlıklı kanal durumlarını dahil et.
- `channels.defaults.heartbeat.showAlerts`: Heartbeat çıktısına bozulmuş/hatalı durumları dahil et.
- `channels.defaults.heartbeat.useIndicator`: Kompakt gösterge stili Heartbeat çıktısı oluştur.

### WhatsApp

WhatsApp, Gateway'in web kanalı (Baileys Web) üzerinden çalışır. Bağlı bir oturum mevcut olduğunda otomatik olarak başlar.

```json5
{
  web: {
    enabled: true,
    heartbeatSeconds: 60,
    whatsapp: {
      keepAliveIntervalMs: 25000,
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000,
    },
    reconnect: {
      initialMs: 2000,
      maxMs: 120000,
      factor: 1.4,
      jitter: 0.2,
      maxAttempts: 0,
    },
  },
  channels: {
    whatsapp: {
      dmPolicy: "pairing", // pairing | allowlist | open | disabled
      allowFrom: ["+15555550123", "+447700900123"],
      textChunkLimit: 4000,
      chunkMode: "length", // length | newline
      mediaMaxMb: 50,
      sendReadReceipts: true, // blue ticks (false in self-chat mode)
      groups: {
        "*": { requireMention: true },
      },
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
    },
  },
}
```

<Accordion title="Çok hesaplı WhatsApp">

```json5
{
  channels: {
    whatsapp: {
      accounts: {
        default: {},
        personal: {},
        biz: {
          // authDir: "~/.openclaw/credentials/whatsapp/biz",
        },
      },
    },
  },
}
```

- Giden komutlar, mevcutsa varsayılan olarak `default` hesabını kullanır; yoksa ilk yapılandırılmış hesap id'sini (sıralanmış) kullanır.
- İsteğe bağlı `channels.whatsapp.defaultAccount`, yapılandırılmış bir hesap id'siyle eşleştiğinde bu geri dönüş varsayılan hesap seçimini geçersiz kılar.
- Eski tek hesaplı Baileys kimlik doğrulama dizini, `openclaw doctor` tarafından `whatsapp/default` içine taşınır.
- Hesap başına geçersiz kılmalar: `channels.whatsapp.accounts.<id>.sendReadReceipts`, `channels.whatsapp.accounts.<id>.dmPolicy`, `channels.whatsapp.accounts.<id>.allowFrom`.

</Accordion>

### Telegram

```json5
{
  channels: {
    telegram: {
      enabled: true,
      botToken: "your-bot-token",
      dmPolicy: "pairing",
      allowFrom: ["tg:123456789"],
      groups: {
        "*": { requireMention: true },
        "-1001234567890": {
          allowFrom: ["@admin"],
          systemPrompt: "Keep answers brief.",
          topics: {
            "99": {
              requireMention: false,
              skills: ["search"],
              systemPrompt: "Stay on topic.",
            },
          },
        },
      },
      customCommands: [
        { command: "backup", description: "Git backup" },
        { command: "generate", description: "Create an image" },
      ],
      historyLimit: 50,
      replyToMode: "first", // off | first | all | batched
      linkPreview: true,
      streaming: "partial", // off | partial | block | progress (default: off; opt in explicitly to avoid preview-edit rate limits)
      actions: { reactions: true, sendMessage: true },
      reactionNotifications: "own", // off | own | all
      mediaMaxMb: 100,
      retry: {
        attempts: 3,
        minDelayMs: 400,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
      network: {
        autoSelectFamily: true,
        dnsResultOrder: "ipv4first",
      },
      apiRoot: "https://api.telegram.org",
      proxy: "socks5://localhost:9050",
      webhookUrl: "https://example.com/telegram-webhook",
      webhookSecret: "secret",
      webhookPath: "/telegram-webhook",
    },
  },
}
```

- Bot token'ı: `channels.telegram.botToken` veya `channels.telegram.tokenFile` (yalnızca normal dosya; sembolik bağlantılar reddedilir), varsayılan hesap için geri dönüş olarak `TELEGRAM_BOT_TOKEN`.
- `apiRoot` yalnızca Telegram Bot API köküdür. `https://api.telegram.org/bot<TOKEN>` değil, `https://api.telegram.org` veya kendi barındırdığınız/proxy kökünüzü kullanın; `openclaw doctor --fix`, yanlışlıkla eklenmiş sondaki `/bot<TOKEN>` sonekini kaldırır.
- İsteğe bağlı `channels.telegram.defaultAccount`, yapılandırılmış bir hesap id'siyle eşleştiğinde varsayılan hesap seçimini geçersiz kılar.
- Çok hesaplı kurulumlarda (2+ hesap id'si), geri dönüş yönlendirmesinden kaçınmak için açık bir varsayılan ayarlayın (`channels.telegram.defaultAccount` veya `channels.telegram.accounts.default`); bu eksik ya da geçersiz olduğunda `openclaw doctor` uyarır.
- `configWrites: false`, Telegram tarafından başlatılan yapılandırma yazmalarını engeller (üst grup ID taşımaları, `/config set|unset`).
- `type: "acp"` içeren üst düzey `bindings[]` girdileri, forum konuları için kalıcı ACP bağlamalarını yapılandırır (`match.peer.id` içinde kanonik `chatId:topic:topicId` kullanın). Alan semantikleri [ACP Ajanları](/tr/tools/acp-agents#persistent-channel-bindings) içinde paylaşılır.
- Telegram akış önizlemeleri `sendMessage` + `editMessageText` kullanır (doğrudan ve grup sohbetlerinde çalışır).
- Yeniden deneme ilkesi: bkz. [Yeniden deneme ilkesi](/tr/concepts/retry).

### Discord

```json5
{
  channels: {
    discord: {
      enabled: true,
      token: "your-bot-token",
      mediaMaxMb: 100,
      allowBots: false,
      actions: {
        reactions: true,
        stickers: true,
        polls: true,
        permissions: true,
        messages: true,
        threads: true,
        pins: true,
        search: true,
        memberInfo: true,
        roleInfo: true,
        roles: false,
        channelInfo: true,
        voiceStatus: true,
        events: true,
        moderation: false,
      },
      replyToMode: "off", // off | first | all | batched
      dmPolicy: "pairing",
      allowFrom: ["1234567890", "123456789012345678"],
      dm: { enabled: true, groupEnabled: false, groupChannels: ["openclaw-dm"] },
      guilds: {
        "123456789012345678": {
          slug: "friends-of-openclaw",
          requireMention: false,
          ignoreOtherMentions: true,
          reactionNotifications: "own",
          users: ["987654321098765432"],
          channels: {
            general: { allow: true },
            help: {
              allow: true,
              requireMention: true,
              users: ["987654321098765432"],
              skills: ["docs"],
              systemPrompt: "Short answers only.",
            },
          },
        },
      },
      historyLimit: 20,
      textChunkLimit: 2000,
      chunkMode: "length", // length | newline
      streaming: "off", // off | partial | block | progress
      maxLinesPerMessage: 17,
      ui: {
        components: {
          accentColor: "#5865F2",
        },
      },
      threadBindings: {
        enabled: true,
        idleHours: 24,
        maxAgeHours: 0,
        spawnSessions: true,
        defaultSpawnContext: "fork",
      },
      voice: {
        enabled: true,
        autoJoin: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
        daveEncryption: true,
        decryptionFailureTolerance: 24,
        connectTimeoutMs: 30000,
        reconnectGraceMs: 15000,
        tts: {
          provider: "openai",
          openai: { voice: "alloy" },
        },
      },
      execApprovals: {
        enabled: "auto", // true | false | "auto"
        approvers: ["987654321098765432"],
        agentFilter: ["default"],
        sessionFilter: ["discord:"],
        target: "dm", // dm | channel | both
        cleanupAfterResolve: false,
      },
      retry: {
        attempts: 3,
        minDelayMs: 500,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
    },
  },
}
```

- Token: `channels.discord.token`; varsayılan hesap için yedek olarak `DISCORD_BOT_TOKEN` kullanılır.
- Açık bir Discord `token` sağlayan doğrudan giden çağrılar, çağrı için o tokenı kullanır; hesap yeniden deneme/ilke ayarları yine etkin çalışma zamanı anlık görüntüsündeki seçili hesaptan gelir.
- İsteğe bağlı `channels.discord.defaultAccount`, yapılandırılmış bir hesap kimliğiyle eşleştiğinde varsayılan hesap seçimini geçersiz kılar.
- Teslimat hedefleri için `user:<id>` (DM) veya `channel:<id>` (sunucu kanalı) kullanın; yalın sayısal kimlikler reddedilir.
- Sunucu slug'ları küçük harflidir ve boşluklar `-` ile değiştirilir; kanal anahtarları slug'lanmış adı kullanır (`#` olmadan). Sunucu kimliklerini tercih edin.
- Bot tarafından yazılan mesajlar varsayılan olarak yok sayılır. `allowBots: true` bunları etkinleştirir; yalnızca botu etiketleyen bot mesajlarını kabul etmek için `allowBots: "mentions"` kullanın (kendi mesajları yine filtrelenir).
- `channels.discord.guilds.<id>.ignoreOtherMentions` (ve kanal geçersiz kılmaları), botu değil başka bir kullanıcıyı veya rolü etiketleyen mesajları düşürür (@everyone/@here hariç).
- `channels.discord.mentionAliases`, bilinen ekip arkadaşlarının geçici dizin önbelleği boş olsa bile deterministik olarak etiketlenebilmesi için kararlı giden `@handle` metnini gönderimden önce Discord kullanıcı kimliklerine eşler. Hesap başına geçersiz kılmalar `channels.discord.accounts.<accountId>.mentionAliases` altında bulunur.
- `maxLinesPerMessage` (varsayılan 17), 2000 karakterin altında olsa bile uzun mesajları böler.
- `channels.discord.threadBindings`, Discord iş parçacığına bağlı yönlendirmeyi denetler:
  - `enabled`: iş parçacığına bağlı oturum özellikleri için Discord geçersiz kılması (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` ve bağlı teslimat/yönlendirme)
  - `idleHours`: etkin olmama durumunda saat cinsinden otomatik odak kaldırma için Discord geçersiz kılması (`0` devre dışı bırakır)
  - `maxAgeHours`: saat cinsinden katı azami yaş için Discord geçersiz kılması (`0` devre dışı bırakır)
  - `spawnSessions`: `sessions_spawn({ thread: true })` ve ACP iş parçacığı oluşturma otomatik iş parçacığı oluşturma/bağlama için anahtar (varsayılan: `true`)
  - `defaultSpawnContext`: iş parçacığına bağlı oluşturulanlar için yerel alt ajan bağlamı (varsayılan olarak `"fork"`)
- `type: "acp"` içeren üst düzey `bindings[]` girdileri, kanallar ve iş parçacıkları için kalıcı ACP bağlamalarını yapılandırır (`match.peer.id` içinde kanal/iş parçacığı kimliği kullanın). Alan semantiği [ACP Agents](/tr/tools/acp-agents#persistent-channel-bindings) içinde paylaşılır.
- `channels.discord.ui.components.accentColor`, Discord bileşenleri v2 kapsayıcıları için vurgu rengini ayarlar.
- `channels.discord.voice`, Discord ses kanalı konuşmalarını ve isteğe bağlı otomatik katılma + LLM + TTS geçersiz kılmalarını etkinleştirir. Yalnızca metin Discord yapılandırmaları sesi varsayılan olarak kapalı bırakır; katılmak için `channels.discord.voice.enabled=true` ayarlayın.
- `channels.discord.voice.model`, Discord ses kanalı yanıtları için kullanılan LLM modelini isteğe bağlı olarak geçersiz kılar.
- `channels.discord.voice.daveEncryption` ve `channels.discord.voice.decryptionFailureTolerance`, `@discordjs/voice` DAVE seçeneklerine geçirilir (varsayılan olarak `true` ve `24`).
- `channels.discord.voice.connectTimeoutMs`, `/vc join` ve otomatik katılma denemeleri için ilk `@discordjs/voice` Ready beklemesini denetler (varsayılan olarak `30000`).
- `channels.discord.voice.reconnectGraceMs`, bağlantısı kesilmiş bir ses oturumunun OpenClaw onu yok etmeden önce yeniden bağlanma sinyaline girmek için ne kadar süre alabileceğini denetler (varsayılan olarak `15000`).
- OpenClaw ayrıca tekrarlanan şifre çözme hatalarından sonra bir ses oturumundan ayrılıp yeniden katılarak ses alma kurtarmasını dener.
- `channels.discord.streaming`, kanonik akış modu anahtarıdır. Eski `streamMode` ve boolean `streaming` değerleri otomatik olarak geçirilir.
- `channels.discord.autoPresence`, çalışma zamanı kullanılabilirliğini bot varlığına eşler (healthy => online, degraded => idle, exhausted => dnd) ve isteğe bağlı durum metni geçersiz kılmalarına izin verir.
- `channels.discord.dangerouslyAllowNameMatching`, değiştirilebilir ad/etiket eşleştirmesini yeniden etkinleştirir (acil uyumluluk modu).
- `channels.discord.execApprovals`: Discord'a özgü exec onayı teslimatı ve onaylayıcı yetkilendirmesi.
  - `enabled`: `true`, `false` veya `"auto"` (varsayılan). Otomatik modda, onaylayıcılar `approvers` veya `commands.ownerAllowFrom` üzerinden çözümlenebildiğinde exec onayları etkinleşir.
  - `approvers`: exec isteklerini onaylamasına izin verilen Discord kullanıcı kimlikleri. Atlandığında `commands.ownerAllowFrom` değerine geri döner.
  - `agentFilter`: isteğe bağlı ajan kimliği izin listesi. Tüm ajanlar için onayları iletmek üzere atlayın.
  - `sessionFilter`: isteğe bağlı oturum anahtarı desenleri (alt dize veya regex).
  - `target`: onay istemlerinin gönderileceği yer. `"dm"` (varsayılan) onaylayıcı DM'lerine gönderir, `"channel"` kaynak kanala gönderir, `"both"` ikisine de gönderir. Hedef `"channel"` içerdiğinde, düğmeler yalnızca çözümlenen onaylayıcılar tarafından kullanılabilir.
  - `cleanupAfterResolve`: `true` olduğunda onay, ret veya zaman aşımından sonra onay DM'lerini siler.

**Tepki bildirimi modları:** `off` (yok), `own` (botun mesajları, varsayılan), `all` (tüm mesajlar), `allowlist` (tüm mesajlarda `guilds.<id>.users` içinden).

### Google Chat

```json5
{
  channels: {
    googlechat: {
      enabled: true,
      serviceAccountFile: "/path/to/service-account.json",
      audienceType: "app-url", // app-url | project-number
      audience: "https://gateway.example.com/googlechat",
      webhookPath: "/googlechat",
      botUser: "users/1234567890",
      dm: {
        enabled: true,
        policy: "pairing",
        allowFrom: ["users/1234567890"],
      },
      groupPolicy: "allowlist",
      groups: {
        "spaces/AAAA": { allow: true, requireMention: true },
      },
      actions: { reactions: true },
      typingIndicator: "message",
      mediaMaxMb: 20,
    },
  },
}
```

- Hizmet hesabı JSON'u: satır içi (`serviceAccount`) veya dosya tabanlı (`serviceAccountFile`).
- Hizmet hesabı SecretRef de desteklenir (`serviceAccountRef`).
- Ortam yedekleri: `GOOGLE_CHAT_SERVICE_ACCOUNT` veya `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- Teslimat hedefleri için `spaces/<spaceId>` veya `users/<userId>` kullanın.
- `channels.googlechat.dangerouslyAllowNameMatching`, değiştirilebilir e-posta sorumlusu eşleştirmesini yeniden etkinleştirir (acil uyumluluk modu).

### Slack

```json5
{
  channels: {
    slack: {
      enabled: true,
      botToken: "xoxb-...",
      appToken: "xapp-...",
      socketMode: {
        clientPingTimeout: 15000,
        serverPingTimeout: 30000,
        pingPongLoggingEnabled: false,
      },
      dmPolicy: "pairing",
      allowFrom: ["U123", "U456", "*"],
      dm: { enabled: true, groupEnabled: false, groupChannels: ["G123"] },
      channels: {
        C123: { allow: true, requireMention: true, allowBots: false },
        "#general": {
          allow: true,
          requireMention: true,
          allowBots: false,
          users: ["U123"],
          skills: ["docs"],
          systemPrompt: "Short answers only.",
        },
      },
      historyLimit: 50,
      allowBots: false,
      reactionNotifications: "own",
      reactionAllowlist: ["U123"],
      replyToMode: "off", // off | first | all | batched
      thread: {
        historyScope: "thread", // thread | channel
        inheritParent: false,
      },
      actions: {
        reactions: true,
        messages: true,
        pins: true,
        memberInfo: true,
        emojiList: true,
      },
      slashCommand: {
        enabled: true,
        name: "openclaw",
        sessionPrefix: "slack:slash",
        ephemeral: true,
      },
      typingReaction: "hourglass_flowing_sand",
      textChunkLimit: 4000,
      chunkMode: "length",
      streaming: {
        mode: "partial", // off | partial | block | progress
        nativeTransport: true, // use Slack native streaming API when mode=partial
      },
      mediaMaxMb: 20,
      execApprovals: {
        enabled: "auto", // true | false | "auto"
        approvers: ["U123"],
        agentFilter: ["default"],
        sessionFilter: ["slack:"],
        target: "dm", // dm | channel | both
      },
    },
  },
}
```

- **Soket modu** hem `botToken` hem de `appToken` gerektirir (varsayılan hesap ortam yedeği için `SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN`).
- **HTTP modu**, `botToken` ve ayrıca `signingSecret` gerektirir (kök düzeyde veya hesap başına).
- `socketMode`, Slack SDK Socket Mode taşıma ayarlarını genel Bolt alıcı API'sine geçirir. Yalnızca ping/pong zaman aşımı veya eski websocket davranışını incelerken kullanın.
- `botToken`, `appToken`, `signingSecret` ve `userToken` düz metin
  dizelerini veya SecretRef nesnelerini kabul eder.
- Slack hesap anlık görüntüleri, `botTokenSource`, `botTokenStatus`,
  `appTokenStatus` ve HTTP modunda `signingSecretStatus` gibi kimlik bilgisi
  başına kaynak/durum alanlarını gösterir. `configured_unavailable`, hesabın
  SecretRef üzerinden yapılandırıldığı ancak geçerli komut/çalışma zamanı
  yolunun gizli değeri çözümleyemediği anlamına gelir.
- `configWrites: false`, Slack tarafından başlatılan yapılandırma yazmalarını engeller.
- İsteğe bağlı `channels.slack.defaultAccount`, yapılandırılmış bir hesap kimliğiyle eşleştiğinde varsayılan hesap seçimini geçersiz kılar.
- `channels.slack.streaming.mode`, kanonik Slack akış modu anahtarıdır. `channels.slack.streaming.nativeTransport`, Slack'in yerel akış taşımasını denetler. Eski `streamMode`, boolean `streaming` ve `nativeStreaming` değerleri otomatik olarak geçirilir.
- Teslimat hedefleri için `user:<id>` (DM) veya `channel:<id>` kullanın.

**Tepki bildirimi modları:** `off`, `own` (varsayılan), `all`, `allowlist` (`reactionAllowlist` içinden).

**İş parçacığı oturum yalıtımı:** `thread.historyScope` iş parçacığı başınadır (varsayılan) veya kanal genelinde paylaşılır. `thread.inheritParent`, üst kanal dökümünü yeni iş parçacıklarına kopyalar.

- Slack yerel akışı ve Slack asistan tarzı "is typing..." iş parçacığı durumu bir yanıt iş parçacığı hedefi gerektirir. Üst düzey DM'ler varsayılan olarak iş parçacığı dışında kalır; bu nedenle iş parçacığı tarzı yerel akış/durum önizlemesini göstermek yerine Slack taslak gönder-ve-düzenle önizlemeleri üzerinden akış yapabilirler.
- `typingReaction`, yanıt çalışırken gelen Slack mesajına geçici bir tepki ekler, ardından tamamlandığında kaldırır. `"hourglass_flowing_sand"` gibi bir Slack emoji kısa kodu kullanın.
- `channels.slack.execApprovals`: Slack'e özgü exec onayı teslimatı ve onaylayıcı yetkilendirmesi. Discord ile aynı şema: `enabled` (`true`/`false`/`"auto"`), `approvers` (Slack kullanıcı kimlikleri), `agentFilter`, `sessionFilter` ve `target` (`"dm"`, `"channel"` veya `"both"`).

| Eylem grubu | Varsayılan | Notlar                   |
| ------------ | ------- | ---------------------- |
| reactions    | etkin | Tepki ekleme + tepkileri listeleme |
| messages     | etkin | Okuma/gönderme/düzenleme/silme |
| pins         | etkin | Sabitleme/sabiti kaldırma/listeleme |
| memberInfo   | etkin | Üye bilgisi             |
| emojiList    | etkin | Özel emoji listesi      |

### Mattermost

Mattermost, güncel OpenClaw sürümlerinde paketlenmiş bir Plugin olarak gelir. Daha eski veya
özel derlemeler, güncel bir npm paketini
`openclaw plugins install @openclaw/mattermost` ile yükleyebilir. Bir sürümü sabitlemeden önce
geçerli dist-tag'ler için
[npmjs.com/package/@openclaw/mattermost](https://www.npmjs.com/package/@openclaw/mattermost)
sayfasını kontrol edin.

```json5
{
  channels: {
    mattermost: {
      enabled: true,
      botToken: "mm-token",
      baseUrl: "https://chat.example.com",
      dmPolicy: "pairing",
      chatmode: "oncall", // oncall | onmessage | onchar
      oncharPrefixes: [">", "!"],
      groups: {
        "*": { requireMention: true },
        "team-channel-id": { requireMention: false },
      },
      commands: {
        native: true, // opt-in
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Optional explicit URL for reverse-proxy/public deployments
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
      textChunkLimit: 4000,
      chunkMode: "length",
    },
  },
}
```

Sohbet modları: `oncall` (@-etiketlemede yanıt verir, varsayılan), `onmessage` (her mesaj), `onchar` (tetikleyici ön ekle başlayan mesajlar).

Mattermost yerel komutları etkinleştirildiğinde:

- `commands.callbackPath` bir yol olmalıdır (örneğin `/api/channels/mattermost/command`), tam URL olmamalıdır.
- `commands.callbackUrl` OpenClaw Gateway uç noktasına çözümlenmeli ve Mattermost sunucusundan erişilebilir olmalıdır.
- Yerel slash geri çağrıları, slash komutu kaydı sırasında Mattermost tarafından döndürülen
  komut başına token'larla kimlik doğrulamasından geçirilir. Kayıt başarısız olursa veya hiçbir
  komut etkinleştirilmezse OpenClaw geri çağrıları
  `Unauthorized: invalid command token.`
  ile reddeder.
- Özel/tailnet/dahili geri çağrı host'ları için Mattermost,
  `ServiceSettings.AllowedUntrustedInternalConnections` içine geri çağrı host'unun/alan adının eklenmesini gerektirebilir.
  Tam URL'ler değil, host/alan adı değerleri kullanın.
- `channels.mattermost.configWrites`: Mattermost tarafından başlatılan yapılandırma yazmalarına izin verin veya reddedin.
- `channels.mattermost.requireMention`: kanallarda yanıtlamadan önce `@mention` gerektirir.
- `channels.mattermost.groups.<channelId>.requireMention`: kanal başına mention-gating geçersiz kılma (`"*"` varsayılan için).
- İsteğe bağlı `channels.mattermost.defaultAccount`, yapılandırılmış bir hesap kimliğiyle eşleştiğinde varsayılan hesap seçimini geçersiz kılar.

### Signal

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15555550123", // optional account binding
      dmPolicy: "pairing",
      allowFrom: ["+15551234567", "uuid:123e4567-e89b-12d3-a456-426614174000"],
      configWrites: true,
      reactionNotifications: "own", // off | own | all | allowlist
      reactionAllowlist: ["+15551234567", "uuid:123e4567-e89b-12d3-a456-426614174000"],
      historyLimit: 50,
    },
  },
}
```

**Tepki bildirimi modları:** `off`, `own` (varsayılan), `all`, `allowlist` (`reactionAllowlist` içinden).

- `channels.signal.account`: kanal başlangıcını belirli bir Signal hesap kimliğine sabitler.
- `channels.signal.configWrites`: Signal tarafından başlatılan yapılandırma yazmalarına izin verin veya reddedin.
- İsteğe bağlı `channels.signal.defaultAccount`, yapılandırılmış bir hesap kimliğiyle eşleştiğinde varsayılan hesap seçimini geçersiz kılar.

### BlueBubbles

BlueBubbles önerilen iMessage yoludur (Plugin destekli, `channels.bluebubbles` altında yapılandırılır).

```json5
{
  channels: {
    bluebubbles: {
      enabled: true,
      dmPolicy: "pairing",
      // serverUrl, password, webhookPath, group controls, and advanced actions:
      // see /channels/bluebubbles
    },
  },
}
```

- Burada kapsanan çekirdek anahtar yolları: `channels.bluebubbles`, `channels.bluebubbles.dmPolicy`.
- İsteğe bağlı `channels.bluebubbles.defaultAccount`, yapılandırılmış bir hesap kimliğiyle eşleştiğinde varsayılan hesap seçimini geçersiz kılar.
- `type: "acp"` içeren üst düzey `bindings[]` girdileri, BlueBubbles konuşmalarını kalıcı ACP oturumlarına bağlayabilir. `match.peer.id` içinde bir BlueBubbles tanıtıcısı veya hedef dizesi (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) kullanın. Paylaşılan alan semantiği: [ACP Aracıları](/tr/tools/acp-agents#persistent-channel-bindings).
- Tam BlueBubbles kanal yapılandırması [BlueBubbles](/tr/channels/bluebubbles) bölümünde belgelenmiştir.

### iMessage

OpenClaw `imsg rpc` işlemini başlatır (stdio üzerinden JSON-RPC). Daemon veya port gerekmez.

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "imsg",
      dbPath: "~/Library/Messages/chat.db",
      remoteHost: "user@gateway-host",
      dmPolicy: "pairing",
      allowFrom: ["+15555550123", "user@example.com", "chat_id:123"],
      historyLimit: 50,
      includeAttachments: false,
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      mediaMaxMb: 16,
      service: "auto",
      region: "US",
    },
  },
}
```

- İsteğe bağlı `channels.imessage.defaultAccount`, yapılandırılmış bir hesap kimliğiyle eşleştiğinde varsayılan hesap seçimini geçersiz kılar.

- Messages DB için Full Disk Access gerektirir.
- `chat_id:<id>` hedeflerini tercih edin. Sohbetleri listelemek için `imsg chats --limit 20` kullanın.
- `cliPath` bir SSH sarmalayıcısına işaret edebilir; SCP ek getirme için `remoteHost` (`host` veya `user@host`) ayarlayın.
- `attachmentRoots` ve `remoteAttachmentRoots` gelen ek yollarını sınırlar (varsayılan: `/Users/*/Library/Messages/Attachments`).
- SCP katı host anahtarı denetimi kullanır, bu nedenle relay host anahtarının `~/.ssh/known_hosts` içinde zaten bulunduğundan emin olun.
- `channels.imessage.configWrites`: iMessage tarafından başlatılan yapılandırma yazmalarına izin verin veya reddedin.
- `type: "acp"` içeren üst düzey `bindings[]` girdileri, iMessage konuşmalarını kalıcı ACP oturumlarına bağlayabilir. `match.peer.id` içinde normalize edilmiş bir tanıtıcı veya açık sohbet hedefi (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) kullanın. Paylaşılan alan semantiği: [ACP Aracıları](/tr/tools/acp-agents#persistent-channel-bindings).

<Accordion title="iMessage SSH sarmalayıcı örneği">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix Plugin desteklidir ve `channels.matrix` altında yapılandırılır.

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_bot_xxx",
      proxy: "http://127.0.0.1:7890",
      encryption: true,
      initialSyncLimit: 20,
      defaultAccount: "ops",
      accounts: {
        ops: {
          name: "Ops",
          userId: "@ops:example.org",
          accessToken: "syt_ops_xxx",
        },
        alerts: {
          userId: "@alerts:example.org",
          password: "secret",
          proxy: "http://127.0.0.1:7891",
        },
      },
    },
  },
}
```

- Token kimlik doğrulaması `accessToken` kullanır; parola kimlik doğrulaması `userId` + `password` kullanır.
- `channels.matrix.proxy`, Matrix HTTP trafiğini açık bir HTTP(S) proxy üzerinden yönlendirir. Adlandırılmış hesaplar bunu `channels.matrix.accounts.<id>.proxy` ile geçersiz kılabilir.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` özel/dahili homeserver'lara izin verir. `proxy` ve bu ağ opt-in'i bağımsız denetimlerdir.
- `channels.matrix.defaultAccount`, çok hesaplı kurulumlarda tercih edilen hesabı seçer.
- `channels.matrix.autoJoin` varsayılan olarak `off` değerindedir; bu nedenle davet edilen odalar ve yeni DM tarzı davetler, `autoJoinAllowlist` ile `autoJoin: "allowlist"` veya `autoJoin: "always"` ayarlanana kadar yok sayılır.
- `channels.matrix.execApprovals`: Matrix'e özgü exec onayı teslimi ve onaylayıcı yetkilendirmesi.
  - `enabled`: `true`, `false` veya `"auto"` (varsayılan). Otomatik modda, onaylayıcılar `approvers` veya `commands.ownerAllowFrom` içinden çözümlenebildiğinde exec onayları etkinleşir.
  - `approvers`: exec isteklerini onaylamasına izin verilen Matrix kullanıcı kimlikleri (örn. `@owner:example.org`).
  - `agentFilter`: isteğe bağlı aracı kimliği izin listesi. Tüm aracılar için onayları iletmek üzere atlayın.
  - `sessionFilter`: isteğe bağlı oturum anahtarı kalıpları (alt dize veya regex).
  - `target`: onay istemlerinin nereye gönderileceği. `"dm"` (varsayılan), `"channel"` (kaynak oda) veya `"both"`.
  - Hesap başına geçersiz kılmalar: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope`, Matrix DM'lerinin oturumlarda nasıl gruplandığını denetler: `per-user` (varsayılan) yönlendirilen eşe göre paylaşır, `per-room` ise her DM odasını izole eder.
- Matrix durum yoklamaları ve canlı dizin aramaları, çalışma zamanı trafiğiyle aynı proxy politikasını kullanır.
- Tam Matrix yapılandırması, hedefleme kuralları ve kurulum örnekleri [Matrix](/tr/channels/matrix) bölümünde belgelenmiştir.

### Microsoft Teams

Microsoft Teams Plugin desteklidir ve `channels.msteams` altında yapılandırılır.

```json5
{
  channels: {
    msteams: {
      enabled: true,
      configWrites: true,
      // appId, appPassword, tenantId, webhook, team/channel policies:
      // see /channels/msteams
    },
  },
}
```

- Burada kapsanan çekirdek anahtar yolları: `channels.msteams`, `channels.msteams.configWrites`.
- Tam Teams yapılandırması (kimlik bilgileri, Webhook, DM/grup politikası, ekip başına/kanal başına geçersiz kılmalar) [Microsoft Teams](/tr/channels/msteams) bölümünde belgelenmiştir.

### IRC

IRC Plugin desteklidir ve `channels.irc` altında yapılandırılır.

```json5
{
  channels: {
    irc: {
      enabled: true,
      dmPolicy: "pairing",
      configWrites: true,
      nickserv: {
        enabled: true,
        service: "NickServ",
        password: "${IRC_NICKSERV_PASSWORD}",
        register: false,
        registerEmail: "bot@example.com",
      },
    },
  },
}
```

- Burada kapsanan çekirdek anahtar yolları: `channels.irc`, `channels.irc.dmPolicy`, `channels.irc.configWrites`, `channels.irc.nickserv.*`.
- İsteğe bağlı `channels.irc.defaultAccount`, yapılandırılmış bir hesap kimliğiyle eşleştiğinde varsayılan hesap seçimini geçersiz kılar.
- Tam IRC kanal yapılandırması (host/port/TLS/kanallar/izin listeleri/mention gating) [IRC](/tr/channels/irc) bölümünde belgelenmiştir.

### Çok hesaplı (tüm kanallar)

Kanal başına birden çok hesap çalıştırın (her biri kendi `accountId` değerine sahip):

```json5
{
  channels: {
    telegram: {
      accounts: {
        default: {
          name: "Primary bot",
          botToken: "123456:ABC...",
        },
        alerts: {
          name: "Alerts bot",
          botToken: "987654:XYZ...",
        },
      },
    },
  },
}
```

- `accountId` atlandığında `default` kullanılır (CLI + yönlendirme).
- Env token'ları yalnızca **varsayılan** hesaba uygulanır.
- Temel kanal ayarları, hesap başına geçersiz kılınmadığı sürece tüm hesaplara uygulanır.
- Her hesabı farklı bir aracıya yönlendirmek için `bindings[].match.accountId` kullanın.
- Tek hesaplı üst düzey kanal yapılandırmasındayken `openclaw channels add` (veya kanal onboarding'i) aracılığıyla varsayılan olmayan bir hesap eklerseniz, OpenClaw önce hesap kapsamlı üst düzey tek hesap değerlerini kanal hesap haritasına yükseltir, böylece özgün hesap çalışmaya devam eder. Çoğu kanal bunları `channels.<channel>.accounts.default` içine taşır; Matrix bunun yerine mevcut eşleşen adlandırılmış/varsayılan hedefi koruyabilir.
- Mevcut yalnızca kanal bağlamaları (`accountId` yok) varsayılan hesapla eşleşmeye devam eder; hesap kapsamlı bağlamalar isteğe bağlı kalır.
- `openclaw doctor --fix`, hesap kapsamlı üst düzey tek hesap değerlerini ilgili kanal için seçilen yükseltilmiş hesaba taşıyarak karışık şekilleri de onarır. Çoğu kanal `accounts.default` kullanır; Matrix bunun yerine mevcut eşleşen adlandırılmış/varsayılan hedefi koruyabilir.

### Diğer Plugin kanalları

Birçok Plugin kanalı `channels.<id>` olarak yapılandırılır ve kendi özel kanal sayfalarında belgelenir (örneğin Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat ve Twitch).
Tam kanal dizinine bakın: [Kanallar](/tr/channels).

### Grup sohbeti mention gating

Grup mesajları varsayılan olarak **mention gerektirir** (metadata mention veya güvenli regex kalıpları). WhatsApp, Telegram, Discord, Google Chat ve iMessage grup sohbetlerine uygulanır.

Görünür yanıtlar ayrıca denetlenir. Grup/kanal odaları varsayılan olarak `messages.groupChat.visibleReplies: "message_tool"` kullanır: OpenClaw yine de turu işler, ancak normal son yanıtlar özel kalır ve görünür oda çıktısı `message(action=send)` gerektirir. Normal yanıtların odaya geri gönderildiği eski davranışı yalnızca istediğinizde `"automatic"` ayarlayın. Aynı yalnızca araçla görünür yanıt davranışını doğrudan sohbetlere de uygulamak için `messages.visibleReplies: "message_tool"` ayarlayın; Codex harness da ayarlanmamış doğrudan sohbet varsayılanı olarak bu yalnızca araç davranışını kullanır.

Mesaj aracı etkin araç politikası altında kullanılamıyorsa OpenClaw yanıtı sessizce bastırmak yerine otomatik görünür yanıtlara geri döner. `openclaw doctor` bu uyumsuzluk hakkında uyarır.

Gateway, dosya kaydedildikten sonra `messages` yapılandırmasını hot-reload eder. Yalnızca dağıtımda dosya izleme veya yapılandırma yeniden yükleme devre dışıysa yeniden başlatın.

**Mention türleri:**

- **Metadata mention'ları**: Yerel platform @-mention'ları. WhatsApp self-chat modunda yok sayılır.
- **Metin kalıpları**: `agents.list[].groupChat.mentionPatterns` içindeki güvenli regex kalıpları. Geçersiz kalıplar ve güvenli olmayan iç içe tekrarlama yok sayılır.
- Mention gating yalnızca algılama mümkün olduğunda uygulanır (yerel mention'lar veya en az bir kalıp).

```json5
{
  messages: {
    visibleReplies: "automatic", // global default for direct/source chats; Codex harness defaults unset direct chats to message_tool
    groupChat: {
      historyLimit: 50,
      visibleReplies: "message_tool", // default; use "automatic" for legacy final replies
    },
  },
  agents: {
    list: [{ id: "main", groupChat: { mentionPatterns: ["@openclaw", "openclaw"] } }],
  },
}
```

`messages.groupChat.historyLimit` genel varsayılanı ayarlar. Kanallar `channels.<channel>.historyLimit` ile (veya hesap başına) geçersiz kılabilir. Devre dışı bırakmak için `0` olarak ayarlayın.

`messages.visibleReplies` global kaynak dönüşü varsayılanıdır; `messages.groupChat.visibleReplies` grup/kanal kaynak dönüşleri için bunu geçersiz kılar. `messages.visibleReplies` ayarlanmamışsa, bir harness kendi doğrudan/kaynak varsayılanını sağlayabilir; Codex harness varsayılan olarak `message_tool` kullanır. Kanal izin listeleri ve bahsetme geçitleri, bir dönüşün işlenip işlenmeyeceğine yine karar verir.

#### DM geçmiş sınırları

```json5
{
  channels: {
    telegram: {
      dmHistoryLimit: 30,
      dms: {
        "123456789": { historyLimit: 50 },
      },
    },
  },
}
```

Çözümleme: DM başına geçersiz kılma → sağlayıcı varsayılanı → sınır yok (tümü tutulur).

Desteklenenler: `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `msteams`.

#### Kendinle sohbet modu

Kendinle sohbet modunu etkinleştirmek için kendi numaranızı `allowFrom` içine ekleyin (yerel @-bahsetmeleri yok sayar, yalnızca metin kalıplarına yanıt verir):

```json5
{
  channels: {
    whatsapp: {
      allowFrom: ["+15555550123"],
      groups: { "*": { requireMention: true } },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: { mentionPatterns: ["reisponde", "@openclaw"] },
      },
    ],
  },
}
```

### Komutlar (sohbet komutu işleme)

```json5
{
  commands: {
    native: "auto", // register native commands when supported
    nativeSkills: "auto", // register native skill commands when supported
    text: true, // parse /commands in chat messages
    bash: false, // allow ! (alias: /bash)
    bashForegroundMs: 2000,
    config: false, // allow /config
    mcp: false, // allow /mcp
    plugins: false, // allow /plugins
    debug: false, // allow /debug
    restart: true, // allow /restart + gateway restart tool
    ownerAllowFrom: ["discord:123456789012345678"],
    ownerDisplay: "raw", // raw | hash
    ownerDisplaySecret: "${OWNER_ID_HASH_SECRET}",
    allowFrom: {
      "*": ["user1"],
      discord: ["user:123"],
    },
    useAccessGroups: true,
  },
}
```

<Accordion title="Komut ayrıntıları">

- Bu blok komut yüzeylerini yapılandırır. Geçerli yerleşik + paketlenmiş komut kataloğu için bkz. [Eğik Çizgi Komutları](/tr/tools/slash-commands).
- Bu sayfa tam komut kataloğu değil, bir **yapılandırma anahtarı başvurusudur**. QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, cihaz eşleştirme `/pair`, bellek `/dreaming`, telefon denetimi `/phone` ve Talk `/voice` gibi kanal/Plugin sahipli komutlar, kendi kanal/Plugin sayfalarında ve [Eğik Çizgi Komutları](/tr/tools/slash-commands) içinde belgelenmiştir.
- Metin komutları, başında `/` bulunan **bağımsız** iletiler olmalıdır.
- `native: "auto"` Discord/Telegram için yerel komutları açar, Slack'i kapalı bırakır.
- `nativeSkills: "auto"` Discord/Telegram için yerel Skills komutlarını açar, Slack'i kapalı bırakır.
- Kanal başına geçersiz kılma: `channels.discord.commands.native` (bool veya `"auto"`). Discord için `false`, başlangıç sırasında yerel komut kaydını ve temizliğini atlar.
- Yerel Skills kaydını kanal başına `channels.<provider>.commands.nativeSkills` ile geçersiz kılın.
- `channels.telegram.customCommands` ek Telegram bot menüsü girişleri ekler.
- `bash: true`, ana makine kabuğu için `! <cmd>` kullanımını etkinleştirir. `tools.elevated.enabled` ve gönderenin `tools.elevated.allowFrom.<channel>` içinde olmasını gerektirir.
- `config: true`, `/config` komutunu etkinleştirir (`openclaw.json` okur/yazar). Gateway `chat.send` istemcileri için kalıcı `/config set|unset` yazmaları ayrıca `operator.admin` gerektirir; salt okunur `/config show`, normal yazma kapsamlı operatör istemcileri için kullanılabilir kalır.
- `mcp: true`, `mcp.servers` altındaki OpenClaw tarafından yönetilen MCP sunucu yapılandırması için `/mcp` komutunu etkinleştirir.
- `plugins: true`, Plugin keşfi, kurulumu ve etkinleştirme/devre dışı bırakma denetimleri için `/plugins` komutunu etkinleştirir.
- `channels.<provider>.configWrites`, kanal başına yapılandırma değişikliklerini sınırlar (varsayılan: true).
- Çok hesaplı kanallar için `channels.<provider>.accounts.<id>.configWrites`, o hesabı hedefleyen yazmaları da sınırlar (örneğin `/allowlist --config --account <id>` veya `/config set channels.<provider>.accounts.<id>...`).
- `restart: false`, `/restart` ve Gateway yeniden başlatma aracı eylemlerini devre dışı bırakır. Varsayılan: `true`.
- `ownerAllowFrom`, yalnızca sahip komutları/araçları için açık sahip izin listesidir. `allowFrom` ile ayrıdır.
- `ownerDisplay: "hash"`, sistem isteminde sahip kimliklerini hash'ler. Hashlemeyi denetlemek için `ownerDisplaySecret` ayarlayın.
- `allowFrom`, sağlayıcı başınadır. Ayarlandığında **tek** yetkilendirme kaynağıdır (kanal izin listeleri/eşleştirme ve `useAccessGroups` yok sayılır).
- `useAccessGroups: false`, `allowFrom` ayarlanmadığında komutların erişim grubu ilkelerini atlamasına izin verir.
- Komut belgeleri haritası:
  - yerleşik + paketlenmiş katalog: [Eğik Çizgi Komutları](/tr/tools/slash-commands)
  - kanala özgü komut yüzeyleri: [Kanallar](/tr/channels)
  - QQ Bot komutları: [QQ Bot](/tr/channels/qqbot)
  - eşleştirme komutları: [Eşleştirme](/tr/channels/pairing)
  - LINE kart komutu: [LINE](/tr/channels/line)
  - bellek Dreaming: [Dreaming](/tr/concepts/dreaming)

</Accordion>

---

## İlgili

- [Yapılandırma başvurusu](/tr/gateway/configuration-reference) — üst düzey anahtarlar
- [Yapılandırma — aracılar](/tr/gateway/config-agents)
- [Kanallara genel bakış](/tr/channels)
