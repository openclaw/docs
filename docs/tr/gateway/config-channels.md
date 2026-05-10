---
read_when:
    - Bir kanal Plugin'ini yapılandırma (kimlik doğrulama, erişim denetimi, çoklu hesap)
    - Kanal bazlı yapılandırma anahtarlarında sorun giderme
    - DM politikasını, grup politikasını veya bahsetme kısıtlamasını denetleme
summary: 'Kanal yapılandırması: Slack, Discord, Telegram, WhatsApp, Matrix, iMessage ve daha fazlası genelinde erişim denetimi, eşleme, kanal başına anahtarlar'
title: Yapılandırma — kanallar
x-i18n:
    generated_at: "2026-05-10T19:35:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 841f3cf73b561f2cf171152a323463f6570f3638c4049ec4a174b0cd69faf14d
    source_path: gateway/config-channels.md
    workflow: 16
---

Kanal başına yapılandırma anahtarları `channels.*` altında bulunur. DM ve grup erişimini, çok hesaplı kurulumları, bahsetme şartını ve Slack, Discord, Telegram, WhatsApp, Matrix, iMessage ile diğer paketli kanal Plugin'leri için kanal başına anahtarları kapsar.

Agent'lar, araçlar, gateway çalışma zamanı ve diğer üst düzey anahtarlar için bkz.
[Yapılandırma başvurusu](/tr/gateway/configuration-reference).

## Kanallar

Her kanal, yapılandırma bölümü mevcut olduğunda otomatik olarak başlar (`enabled: false` değilse).

### DM ve grup erişimi

Tüm kanallar DM ilkelerini ve grup ilkelerini destekler:

| DM ilkesi            | Davranış                                                        |
| -------------------- | --------------------------------------------------------------- |
| `pairing` (varsayılan) | Bilinmeyen gönderenler tek kullanımlık eşleştirme kodu alır; sahibin onaylaması gerekir |
| `allowlist`          | Yalnızca `allowFrom` içindeki gönderenler (veya eşleştirilmiş izin deposu) |
| `open`               | Tüm gelen DM'lere izin ver (`allowFrom: ["*"]` gerektirir)      |
| `disabled`           | Tüm gelen DM'leri yok say                                      |

| Grup ilkesi            | Davranış                                               |
| ---------------------- | ------------------------------------------------------ |
| `allowlist` (varsayılan) | Yalnızca yapılandırılmış izin listesiyle eşleşen gruplar |
| `open`                 | Grup izin listelerini atla (bahsetme şartı yine uygulanır) |
| `disabled`             | Tüm grup/oda mesajlarını engelle                       |

<Note>
`channels.defaults.groupPolicy`, bir sağlayıcının `groupPolicy` değeri ayarlanmadığında varsayılanı belirler.
Eşleştirme kodlarının süresi 1 saat sonra dolar. Bekleyen DM eşleştirme istekleri **kanal başına 3** ile sınırlıdır.
Bir sağlayıcı bloğu tamamen eksikse (`channels.<provider>` yoksa), çalışma zamanı grup ilkesi başlangıç uyarısıyla birlikte `allowlist` değerine geri döner (kapalı hata davranışı).
</Note>

### Kanal model geçersiz kılmaları

Belirli kanal ID'lerini bir modele sabitlemek için `channels.modelByChannel` kullanın. Değerler `provider/model` veya yapılandırılmış model takma adlarını kabul eder. Kanal eşlemesi, bir oturumda zaten bir model geçersiz kılması yoksa uygulanır (örneğin `/model` ile ayarlanmışsa uygulanmaz).

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

Sağlayıcılar genelinde paylaşılan grup ilkesi ve Heartbeat davranışı için `channels.defaults` kullanın:

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

- `channels.defaults.groupPolicy`: sağlayıcı düzeyinde `groupPolicy` ayarlanmadığında geri dönüş grup ilkesi.
- `channels.defaults.contextVisibility`: tüm kanallar için varsayılan ek bağlam görünürlük modu. Değerler: `all` (varsayılan, alıntılanan/iş parçacığı/geçmiş bağlamının tümünü dahil et), `allowlist` (yalnızca izin listesindeki gönderenlerden gelen bağlamı dahil et), `allowlist_quote` (izin listesiyle aynı, ancak açık alıntı/yanıt bağlamını korur). Kanal başına geçersiz kılma: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: sağlıklı kanal durumlarını Heartbeat çıktısına dahil et.
- `channels.defaults.heartbeat.showAlerts`: bozulmuş/hata durumlarını Heartbeat çıktısına dahil et.
- `channels.defaults.heartbeat.useIndicator`: kompakt gösterge tarzı Heartbeat çıktısı oluştur.

### WhatsApp

WhatsApp, gateway'in web kanalı (Baileys Web) üzerinden çalışır. Bağlı bir oturum mevcut olduğunda otomatik olarak başlar.

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
      sendReadReceipts: true, // mavi tikler (self-chat modunda false)
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

- Giden komutlar, varsa varsayılan olarak `default` hesabını kullanır; aksi durumda ilk yapılandırılmış hesap ID'sini (sıralanmış) kullanır.
- İsteğe bağlı `channels.whatsapp.defaultAccount`, yapılandırılmış bir hesap ID'siyle eşleştiğinde bu geri dönüş varsayılan hesap seçimini geçersiz kılar.
- Eski tek hesaplı Baileys auth dizini, `openclaw doctor` tarafından `whatsapp/default` içine taşınır.
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
          systemPrompt: "Yanıtları kısa tut.",
          topics: {
            "99": {
              requireMention: false,
              skills: ["search"],
              systemPrompt: "Konu dışına çıkma.",
            },
          },
        },
      },
      customCommands: [
        { command: "backup", description: "Git yedeği" },
        { command: "generate", description: "Bir görsel oluştur" },
      ],
      historyLimit: 50,
      replyToMode: "first", // off | first | all | batched
      linkPreview: true,
      streaming: "partial", // off | partial | block | progress (varsayılan: off; önizleme-düzenleme hız sınırlarından kaçınmak için açıkça seçin)
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

- Bot token'ı: varsayılan hesap için geri dönüş olarak `TELEGRAM_BOT_TOKEN` ile `channels.telegram.botToken` veya `channels.telegram.tokenFile` (yalnızca normal dosya; symlink'ler reddedilir).
- `apiRoot` yalnızca Telegram Bot API köküdür. `https://api.telegram.org/bot<TOKEN>` değil, `https://api.telegram.org` veya kendi barındırdığınız/proxy kökünüzü kullanın; `openclaw doctor --fix`, yanlışlıkla eklenmiş sondaki `/bot<TOKEN>` sonekini kaldırır.
- İsteğe bağlı `channels.telegram.defaultAccount`, yapılandırılmış bir hesap ID'siyle eşleştiğinde varsayılan hesap seçimini geçersiz kılar.
- Çok hesaplı kurulumlarda (2+ hesap ID'si), geri dönüş yönlendirmesinden kaçınmak için açık bir varsayılan (`channels.telegram.defaultAccount` veya `channels.telegram.accounts.default`) ayarlayın; bu eksik veya geçersiz olduğunda `openclaw doctor` uyarır.
- `configWrites: false`, Telegram tarafından başlatılan yapılandırma yazmalarını (supergroup ID geçişleri, `/config set|unset`) engeller.
- `type: "acp"` içeren üst düzey `bindings[]` girdileri, forum konuları için kalıcı ACP bağlamalarını yapılandırır (`match.peer.id` içinde kanonik `chatId:topic:topicId` kullanın). Alan semantikleri [ACP Agent'ları](/tr/tools/acp-agents#persistent-channel-bindings) içinde paylaşılır.
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
              systemPrompt: "Yalnızca kısa yanıtlar.",
            },
          },
        },
      },
      historyLimit: 20,
      textChunkLimit: 2000,
      chunkMode: "length", // length | newline
      streaming: {
        mode: "progress", // off | partial | block | progress (Discord varsayılanı: progress)
        progress: {
          label: "auto",
          maxLines: 8,
          toolProgress: true,
        },
      },
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

- Token: `channels.discord.token`; varsayılan hesap için geri dönüş olarak `DISCORD_BOT_TOKEN`.
- Açık bir Discord `token` sağlayan doğrudan dış aramalar, arama için bu token'ı kullanır; hesap yeniden deneme/ilke ayarları yine etkin çalışma zamanı anlık görüntüsündeki seçili hesaptan gelir.
- İsteğe bağlı `channels.discord.defaultAccount`, yapılandırılmış bir hesap kimliğiyle eşleştiğinde varsayılan hesap seçimini geçersiz kılar.
- Teslim hedefleri için `user:<id>` (DM) veya `channel:<id>` (sunucu kanalı) kullanın; yalın sayısal ID'ler reddedilir.
- Sunucu slug'ları küçük harflidir ve boşluklar `-` ile değiştirilir; kanal anahtarları slug'lanmış adı kullanır (`#` yok). Sunucu ID'lerini tercih edin.
- Bot tarafından yazılan iletiler varsayılan olarak yok sayılır. `allowBots: true` bunları etkinleştirir; yalnızca botu mention eden bot iletilerini kabul etmek için `allowBots: "mentions"` kullanın (kendi iletileri yine filtrelenir).
- `channels.discord.guilds.<id>.ignoreOtherMentions` (ve kanal geçersiz kılmaları), botu değil başka bir kullanıcıyı veya rolü mention eden iletileri düşürür (@everyone/@here hariç).
- `channels.discord.mentionAliases`, göndermeden önce kararlı dışa giden `@handle` metnini Discord kullanıcı ID'lerine eşler; böylece bilinen ekip arkadaşları, geçici dizin önbelleği boş olsa bile deterministik olarak mention edilebilir. Hesap bazlı geçersiz kılmalar `channels.discord.accounts.<accountId>.mentionAliases` altında bulunur.
- `maxLinesPerMessage` (varsayılan 17), 2000 karakterin altında olsa bile uzun iletileri böler.
- `channels.discord.threadBindings`, Discord thread bağlı yönlendirmeyi denetler:
  - `enabled`: thread bağlı oturum özellikleri için Discord geçersiz kılması (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` ve bağlı teslim/yönlendirme)
  - `idleHours`: etkinlik yokluğunda saat cinsinden otomatik unfocus için Discord geçersiz kılması (`0` devre dışı bırakır)
  - `maxAgeHours`: saat cinsinden katı maksimum yaş için Discord geçersiz kılması (`0` devre dışı bırakır)
  - `spawnSessions`: `sessions_spawn({ thread: true })` ve ACP thread-spawn otomatik thread oluşturma/bağlama için anahtar (varsayılan: `true`)
  - `defaultSpawnContext`: thread bağlı spawn'lar için yerel alt ajan bağlamı (varsayılan olarak `"fork"`)
- `type: "acp"` içeren üst düzey `bindings[]` girdileri, kanallar ve thread'ler için kalıcı ACP bağlamalarını yapılandırır (`match.peer.id` içinde kanal/thread ID'si kullanın). Alan anlamları [ACP Ajanları](/tr/tools/acp-agents#persistent-channel-bindings) içinde paylaşılır.
- `channels.discord.ui.components.accentColor`, Discord components v2 kapsayıcıları için vurgu rengini ayarlar.
- `channels.discord.voice`, Discord ses kanalı konuşmalarını ve isteğe bağlı otomatik katılma + LLM + TTS geçersiz kılmalarını etkinleştirir. Yalnızca metin kullanan Discord yapılandırmaları varsayılan olarak sesi kapalı bırakır; katılmak için `channels.discord.voice.enabled=true` ayarlayın.
- `channels.discord.voice.model`, Discord ses kanalı yanıtları için kullanılan LLM modelini isteğe bağlı olarak geçersiz kılar.
- `channels.discord.voice.daveEncryption` ve `channels.discord.voice.decryptionFailureTolerance`, `@discordjs/voice` DAVE seçeneklerine aktarılır (varsayılan olarak `true` ve `24`).
- `channels.discord.voice.connectTimeoutMs`, `/vc join` ve otomatik katılma denemeleri için ilk `@discordjs/voice` Ready beklemesini denetler (varsayılan olarak `30000`).
- `channels.discord.voice.reconnectGraceMs`, bağlantısı kesilmiş bir ses oturumunun OpenClaw onu yok etmeden önce yeniden bağlanma sinyaline girmek için ne kadar süre alabileceğini denetler (varsayılan olarak `15000`).
- Discord ses oynatımı, başka bir kullanıcının konuşmaya başlama olayı tarafından kesilmez. Geri besleme döngülerini önlemek için OpenClaw, TTS oynatılırken yeni ses yakalamayı yok sayar.
- OpenClaw ayrıca tekrarlanan şifre çözme hatalarından sonra bir ses oturumundan ayrılıp yeniden katılarak ses alma kurtarması denemesi yapar.
- `channels.discord.streaming`, kanonik akış modu anahtarıdır. Discord varsayılan olarak `streaming.mode: "progress"` kullanır; böylece araç/iş ilerlemesi düzenlenen tek bir önizleme iletisinde görünür. Devre dışı bırakmak için `streaming.mode: "off"` ayarlayın. Eski `streamMode` ve boolean `streaming` değerleri çalışma zamanı diğer adları olarak kalır; kalıcı yapılandırmayı yeniden yazmak için `openclaw doctor --fix` çalıştırın.
- `channels.discord.autoPresence`, çalışma zamanı kullanılabilirliğini bot presence durumuna eşler (healthy => online, degraded => idle, exhausted => dnd) ve isteğe bağlı durum metni geçersiz kılmalarına izin verir.
- `channels.discord.dangerouslyAllowNameMatching`, değişebilir ad/etiket eşleştirmeyi yeniden etkinleştirir (break-glass uyumluluk modu).
- `channels.discord.execApprovals`: Discord yerel exec onay teslimi ve onaylayıcı yetkilendirmesi.
  - `enabled`: `true`, `false` veya `"auto"` (varsayılan). Otomatik modda, onaylayıcılar `approvers` veya `commands.ownerAllowFrom` içinden çözümlenebildiğinde exec onayları etkinleşir.
  - `approvers`: exec isteklerini onaylamasına izin verilen Discord kullanıcı ID'leri. Atlanırsa `commands.ownerAllowFrom` değerine geri döner.
  - `agentFilter`: isteğe bağlı ajan ID izin listesi. Tüm ajanlar için onayları iletmek üzere atlayın.
  - `sessionFilter`: isteğe bağlı oturum anahtarı desenleri (alt dize veya regex).
  - `target`: onay istemlerinin nereye gönderileceği. `"dm"` (varsayılan) onaylayıcı DM'lerine gönderir, `"channel"` kaynak kanala gönderir, `"both"` ikisine de gönderir. Hedef `"channel"` içerdiğinde düğmeler yalnızca çözümlenmiş onaylayıcılar tarafından kullanılabilir.
  - `cleanupAfterResolve`: `true` olduğunda, onay, ret veya zaman aşımından sonra onay DM'lerini siler.

**Tepki bildirim modları:** `off` (yok), `own` (botun iletileri, varsayılan), `all` (tüm iletiler), `allowlist` (tüm iletilerde `guilds.<id>.users` içinden).

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
- Ortam geri dönüşleri: `GOOGLE_CHAT_SERVICE_ACCOUNT` veya `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- Teslim hedefleri için `spaces/<spaceId>` veya `users/<userId>` kullanın.
- `channels.googlechat.dangerouslyAllowNameMatching`, değişebilir e-posta sorumlusu eşleştirmeyi yeniden etkinleştirir (break-glass uyumluluk modu).

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
      unfurlLinks: false,
      unfurlMedia: false,
      textChunkLimit: 4000,
      chunkMode: "length",
      streaming: {
        mode: "partial", // off | partial | block | progress
        nativeTransport: true, // mode=partial olduğunda Slack yerel streaming API'sini kullan
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

- **Socket mode**, hem `botToken` hem de `appToken` gerektirir (varsayılan hesap ortam geri dönüşü için `SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN`).
- **HTTP modu**, `botToken` ve ayrıca `signingSecret` gerektirir (kökte veya hesap bazında).
- `socketMode`, Slack SDK Socket Mode taşıma ayarını herkese açık Bolt receiver API'sine aktarır. Yalnızca ping/pong zaman aşımı veya eski websocket davranışını araştırırken kullanın.
- `botToken`, `appToken`, `signingSecret` ve `userToken` düz metin
  dizelerini veya SecretRef nesnelerini kabul eder.
- Slack hesap anlık görüntüleri, kimlik bilgisi bazlı kaynak/durum alanlarını açığa çıkarır; örneğin
  `botTokenSource`, `botTokenStatus`, `appTokenStatus` ve HTTP modunda
  `signingSecretStatus`. `configured_unavailable`, hesabın
  SecretRef üzerinden yapılandırıldığı ancak geçerli komut/çalışma zamanı yolunun
  gizli değeri çözemediği anlamına gelir.
- `configWrites: false`, Slack başlatımlı yapılandırma yazmalarını engeller.
- İsteğe bağlı `channels.slack.defaultAccount`, yapılandırılmış bir hesap kimliğiyle eşleştiğinde varsayılan hesap seçimini geçersiz kılar.
- `channels.slack.streaming.mode`, kanonik Slack akış modu anahtarıdır. `channels.slack.streaming.nativeTransport`, Slack'in yerel streaming taşımasını denetler. Eski `streamMode`, boolean `streaming` ve `nativeStreaming` değerleri çalışma zamanı diğer adları olarak kalır; kalıcı yapılandırmayı yeniden yazmak için `openclaw doctor --fix` çalıştırın.
- `unfurlLinks` ve `unfurlMedia`, bot yanıtları için Slack'in `chat.postMessage` bağlantı ve medya unfurl boolean değerlerini aktarır. Slack'in varsayılan davranışını korumak için bunları atlayın; tek bir hesap için üst düzey varsayılanı geçersiz kılmak üzere `channels.slack.accounts.<accountId>` içinde ayarlayın.
- Teslim hedefleri için `user:<id>` (DM) veya `channel:<id>` kullanın.

**Tepki bildirim modları:** `off`, `own` (varsayılan), `all`, `allowlist` (`reactionAllowlist` içinden).

**Thread oturumu yalıtımı:** `thread.historyScope` thread bazlıdır (varsayılan) veya kanal genelinde paylaşılır. `thread.inheritParent`, üst kanal transkriptini yeni thread'lere kopyalar.

- Slack yerel streaming ve Slack assistant tarzı "is typing..." thread durumu, bir yanıt thread hedefi gerektirir. Üst düzey DM'ler varsayılan olarak thread dışında kalır; bu nedenle thread tarzı yerel stream/durum önizlemesini göstermek yerine Slack taslak gönderme ve düzenleme önizlemeleriyle yine stream yapabilir.
- `typingReaction`, bir yanıt çalışırken gelen Slack iletisine geçici bir tepki ekler, ardından tamamlandığında kaldırır. `"hourglass_flowing_sand"` gibi bir Slack emoji kısa kodu kullanın.
- `channels.slack.execApprovals`: Slack yerel exec onay teslimi ve onaylayıcı yetkilendirmesi. Discord ile aynı şema: `enabled` (`true`/`false`/`"auto"`), `approvers` (Slack kullanıcı ID'leri), `agentFilter`, `sessionFilter` ve `target` (`"dm"`, `"channel"` veya `"both"`).

| Eylem grubu | Varsayılan | Notlar                   |
| ------------ | ------- | ---------------------- |
| reactions    | etkin | Tepki ver + tepkileri listele |
| messages     | etkin | Oku/gönder/düzenle/sil  |
| pins         | etkin | Sabitle/sabitlemeyi kaldır/listele |
| memberInfo   | etkin | Üye bilgisi            |
| emojiList    | etkin | Özel emoji listesi      |

### Mattermost

Mattermost, mevcut OpenClaw sürümlerinde paketlenmiş bir plugin olarak gelir. Daha eski veya
özel derlemeler, güncel bir npm paketini
`openclaw plugins install @openclaw/mattermost` ile kurabilir. Bir sürümü sabitlemeden önce geçerli dist-tag'ler için
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

Sohbet modları: `oncall` (@-bahsetme durumunda yanıt verir, varsayılan), `onmessage` (her mesaj), `onchar` (tetikleme ön ekiyle başlayan mesajlar).

Mattermost yerel komutları etkinleştirildiğinde:

- `commands.callbackPath` tam URL değil, bir yol olmalıdır (örneğin `/api/channels/mattermost/command`).
- `commands.callbackUrl` OpenClaw gateway uç noktasına çözümlenmeli ve Mattermost sunucusundan erişilebilir olmalıdır.
- Yerel eğik çizgi geri çağrıları, eğik çizgi komutu kaydı sırasında Mattermost tarafından döndürülen komut başına token’larla doğrulanır. Kayıt başarısız olursa veya hiçbir komut etkinleştirilmezse OpenClaw geri çağrıları `Unauthorized: invalid command token.` ile reddeder.
- Özel/tailnet/dahili geri çağrı ana makineleri için Mattermost, `ServiceSettings.AllowedUntrustedInternalConnections` değerinin geri çağrı ana makinesini/alan adını içermesini gerektirebilir. Tam URL’ler yerine ana makine/alan adı değerlerini kullanın.
- `channels.mattermost.configWrites`: Mattermost tarafından başlatılan yapılandırma yazmalarına izin verin veya bunları reddedin.
- `channels.mattermost.requireMention`: kanallarda yanıtlamadan önce `@mention` gerektirir.
- `channels.mattermost.groups.<channelId>.requireMention`: kanal başına bahsetme kapısı geçersiz kılma ayarı (varsayılan için `"*"`).
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

- `channels.signal.account`: kanal başlangıcını belirli bir Signal hesap kimliğine sabitleyin.
- `channels.signal.configWrites`: Signal tarafından başlatılan yapılandırma yazmalarına izin verin veya bunları reddedin.
- İsteğe bağlı `channels.signal.defaultAccount`, yapılandırılmış bir hesap kimliğiyle eşleştiğinde varsayılan hesap seçimini geçersiz kılar.

### iMessage

OpenClaw, `imsg rpc` sürecini başlatır (stdio üzerinden JSON-RPC). Daemon veya bağlantı noktası gerekmez. Bu, ana makinenin Mesajlar veritabanı ve Otomasyon izinleri verebildiği yeni OpenClaw iMessage kurulumları için tercih edilen yoldur.

BlueBubbles desteği kaldırıldı. `channels.bluebubbles` yapılandırmalarını `channels.imessage` konumuna taşıyın; OpenClaw iMessage’ı yalnızca `imsg` üzerinden destekler.

Gateway, oturum açılmış Mesajlar Mac’inde çalışmıyorsa `channels.imessage.enabled=true` değerini koruyun ve `channels.imessage.cliPath` değerini o Mac’te `imsg "$@"` çalıştıran bir SSH sarmalayıcısına ayarlayın. Varsayılan yerel `imsg` yolu yalnızca macOS içindir.

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

- Mesajlar veritabanı için Tam Disk Erişimi gerektirir.
- `chat_id:<id>` hedeflerini tercih edin. Sohbetleri listelemek için `imsg chats --limit 20` kullanın.
- `cliPath` bir SSH sarmalayıcısına işaret edebilir; SCP ek alma işlemi için `remoteHost` (`host` veya `user@host`) ayarlayın.
- `attachmentRoots` ve `remoteAttachmentRoots` gelen ek yollarını kısıtlar (varsayılan: `/Users/*/Library/Messages/Attachments`).
- SCP sıkı ana makine anahtarı denetimi kullanır, bu nedenle aktarma ana makinesi anahtarının `~/.ssh/known_hosts` içinde zaten bulunduğundan emin olun.
- `channels.imessage.configWrites`: iMessage tarafından başlatılan yapılandırma yazmalarına izin verin veya bunları reddedin.
- `type: "acp"` içeren üst düzey `bindings[]` girdileri, iMessage konuşmalarını kalıcı ACP oturumlarına bağlayabilir. `match.peer.id` içinde normalleştirilmiş bir tanıtıcı veya açık sohbet hedefi (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) kullanın. Paylaşılan alan semantiği: [ACP Agents](/tr/tools/acp-agents#persistent-channel-bindings).

<Accordion title="iMessage SSH sarmalayıcı örneği">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix, Plugin desteklidir ve `channels.matrix` altında yapılandırılır.

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
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` özel/dahili ana sunuculara izin verir. `proxy` ve bu ağ kabulü bağımsız denetimlerdir.
- `channels.matrix.defaultAccount`, çok hesaplı kurulumlarda tercih edilen hesabı seçer.
- `channels.matrix.autoJoin` varsayılan olarak `off` olur; bu nedenle davet edilen odalar ve yeni DM tarzı davetler, `autoJoin: "allowlist"` ile `autoJoinAllowlist` ayarlanana veya `autoJoin: "always"` kullanılana kadar yok sayılır.
- `channels.matrix.execApprovals`: Matrix yerel yürütme onayı teslimi ve onaylayıcı yetkilendirmesi.
  - `enabled`: `true`, `false` veya `"auto"` (varsayılan). Otomatik modda, onaylayıcılar `approvers` veya `commands.ownerAllowFrom` üzerinden çözümlenebildiğinde yürütme onayları etkinleşir.
  - `approvers`: yürütme isteklerini onaylamasına izin verilen Matrix kullanıcı kimlikleri (ör. `@owner:example.org`).
  - `agentFilter`: isteğe bağlı aracı kimliği izin listesi. Tüm aracılar için onayları iletmek üzere atlayın.
  - `sessionFilter`: isteğe bağlı oturum anahtarı kalıpları (alt dize veya regex).
  - `target`: onay istemlerinin gönderileceği yer. `"dm"` (varsayılan), `"channel"` (kaynak oda) veya `"both"`.
  - Hesap başına geçersiz kılmalar: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope`, Matrix DM’lerinin oturumlarda nasıl gruplandırılacağını denetler: `per-user` (varsayılan) yönlendirilmiş eşe göre paylaşırken, `per-room` her DM odasını yalıtır.
- Matrix durum yoklamaları ve canlı dizin aramaları, çalışma zamanı trafiğiyle aynı proxy ilkesini kullanır.
- Tam Matrix yapılandırması, hedefleme kuralları ve kurulum örnekleri [Matrix](/tr/channels/matrix) içinde belgelenmiştir.

### Microsoft Teams

Microsoft Teams, Plugin desteklidir ve `channels.msteams` altında yapılandırılır.

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

- Burada kapsanan temel anahtar yolları: `channels.msteams`, `channels.msteams.configWrites`.
- Tam Teams yapılandırması (kimlik bilgileri, Webhook, DM/grup ilkesi, ekip başına/kanal başına geçersiz kılmalar) [Microsoft Teams](/tr/channels/msteams) içinde belgelenmiştir.

### IRC

IRC, Plugin desteklidir ve `channels.irc` altında yapılandırılır.

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

- Burada kapsanan temel anahtar yolları: `channels.irc`, `channels.irc.dmPolicy`, `channels.irc.configWrites`, `channels.irc.nickserv.*`.
- İsteğe bağlı `channels.irc.defaultAccount`, yapılandırılmış bir hesap kimliğiyle eşleştiğinde varsayılan hesap seçimini geçersiz kılar.
- Tam IRC kanal yapılandırması (ana makine/bağlantı noktası/TLS/kanallar/izin listeleri/bahsetme kapısı) [IRC](/tr/channels/irc) içinde belgelenmiştir.

### Çok hesaplı (tüm kanallar)

Kanal başına birden çok hesap çalıştırın (her birinin kendi `accountId` değeriyle):

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
- Ortam token’ları yalnızca **varsayılan** hesap için geçerlidir.
- Temel kanal ayarları, hesap başına geçersiz kılınmadıkça tüm hesaplara uygulanır.
- Her hesabı farklı bir aracıya yönlendirmek için `bindings[].match.accountId` kullanın.
- Hâlâ tek hesaplı üst düzey kanal yapılandırmasındayken `openclaw channels add` (veya kanal ilk katılımı) aracılığıyla varsayılan olmayan bir hesap eklerseniz OpenClaw, özgün hesabın çalışmayı sürdürmesi için önce hesap kapsamlı üst düzey tek hesap değerlerini kanal hesap eşlemesine yükseltir. Çoğu kanal bunları `channels.<channel>.accounts.default` içine taşır; Matrix bunun yerine mevcut eşleşen adlandırılmış/varsayılan hedefi koruyabilir.
- Mevcut yalnızca kanal bağlamaları (`accountId` yok) varsayılan hesapla eşleşmeye devam eder; hesap kapsamlı bağlamalar isteğe bağlı kalır.
- `openclaw doctor --fix` ayrıca hesap kapsamlı üst düzey tek hesap değerlerini o kanal için seçilen yükseltilmiş hesaba taşıyarak karışık şekilleri onarır. Çoğu kanal `accounts.default` kullanır; Matrix bunun yerine mevcut eşleşen adlandırılmış/varsayılan hedefi koruyabilir.

### Diğer Plugin kanalları

Birçok Plugin kanalı `channels.<id>` olarak yapılandırılır ve kendi özel kanal sayfalarında belgelenir (örneğin Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat ve Twitch).
Tam kanal dizinine bakın: [Kanallar](/tr/channels).

### Grup sohbeti bahsetme kapısı

Grup mesajları varsayılan olarak **bahsetme gerektirir** (meta veri bahsetmesi veya güvenli regex kalıpları). WhatsApp, Telegram, Discord, Google Chat ve iMessage grup sohbetlerine uygulanır.

Görünür yanıtlar ayrı olarak denetlenir. Grup/kanal odaları varsayılan olarak `messages.groupChat.visibleReplies: "message_tool"` kullanır: OpenClaw yine de turu işler, ancak normal son yanıtlar özel kalır ve görünür oda çıktısı `message(action=send)` gerektirir. Normal yanıtların odaya geri gönderildiği eski davranışı istediğinizde yalnızca `"automatic"` ayarlayın. Aynı yalnızca araçlı görünür yanıt davranışını doğrudan sohbetlere de uygulamak için `messages.visibleReplies: "message_tool"` ayarlayın; Codex harness de ayarlanmamış doğrudan sohbet varsayılanı olarak bu yalnızca araçlı davranışı kullanır.

Yalnızca araçlı görünür yanıtlar, araçları güvenilir şekilde çağıran bir model/çalışma zamanı gerektirir. Oturum günlüğü `didSendViaMessagingTool: false` ile asistan metni gösteriyorsa model, mesaj aracını çağırmak yerine özel bir son yanıt üretmiştir. O kanal için daha güçlü araç çağırma özellikli bir modele geçin veya eski görünür son yanıtları geri yüklemek için `messages.groupChat.visibleReplies: "automatic"` ayarlayın.

Mesaj aracı etkin araç ilkesi altında kullanılamıyorsa OpenClaw, yanıtı sessizce bastırmak yerine otomatik görünür yanıtlara geri döner. `openclaw doctor` bu uyumsuzluk hakkında uyarır.

Gateway, dosya kaydedildikten sonra `messages` yapılandırmasını hot-reload eder. Yalnızca dağıtımda dosya izleme veya yapılandırma yeniden yükleme devre dışıysa yeniden başlatın.

**Bahsetme türleri:**

- **Meta veri bahsetmeleri**: Yerel platform @-bahsetmeleri. WhatsApp self-chat modunda yok sayılır.
- **Metin desenleri**: `agents.list[].groupChat.mentionPatterns` içinde güvenli regex desenleri. Geçersiz desenler ve güvenli olmayan iç içe tekrarlar yok sayılır.
- Bahsetme geçidi yalnızca algılama mümkün olduğunda uygulanır (yerel bahsetmeler veya en az bir desen).

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

`messages.groupChat.historyLimit` genel varsayılanı ayarlar. Kanallar `channels.<channel>.historyLimit` ile (veya hesap başına) bunu geçersiz kılabilir. Devre dışı bırakmak için `0` olarak ayarlayın.

`messages.visibleReplies` genel kaynak-tur varsayılanıdır; `messages.groupChat.visibleReplies` grup/kanal kaynak turları için bunu geçersiz kılar. `messages.visibleReplies` ayarlanmamışsa, bir harness kendi doğrudan/kaynak varsayılanını sağlayabilir; Codex harness varsayılan olarak `message_tool` kullanır. Kanal izin listeleri ve bahsetme geçidi yine de bir turun işlenip işlenmeyeceğine karar verir.

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

#### Self-chat modu

Self-chat modunu etkinleştirmek için kendi numaranızı `allowFrom` içine ekleyin (yerel @-bahsetmeleri yok sayar, yalnızca metin desenlerine yanıt verir):

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

- Bu blok komut yüzeylerini yapılandırır. Geçerli yerleşik + paketli komut kataloğu için bkz. [Slash Commands](/tr/tools/slash-commands).
- Bu sayfa tam komut kataloğu değil, bir **yapılandırma anahtarı başvurusudur**. QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, cihaz eşleme `/pair`, bellek `/dreaming`, telefon denetimi `/phone` ve Talk `/voice` gibi kanal/Plugin sahipli komutlar, kendi kanal/Plugin sayfalarında ve [Slash Commands](/tr/tools/slash-commands) içinde belgelenmiştir.
- Metin komutları başında `/` bulunan **bağımsız** mesajlar olmalıdır.
- `native: "auto"` Discord/Telegram için yerel komutları açar, Slack kapalı kalır.
- `nativeSkills: "auto"` Discord/Telegram için yerel skill komutlarını açar, Slack kapalı kalır.
- Kanal başına geçersiz kılma: `channels.discord.commands.native` (bool veya `"auto"`). Discord için `false`, başlatma sırasında yerel komut kaydını ve temizliğini atlar.
- Kanal başına yerel skill kaydını `channels.<provider>.commands.nativeSkills` ile geçersiz kılın.
- `channels.telegram.customCommands` ek Telegram bot menüsü girdileri ekler.
- `bash: true`, ana makine kabuğu için `! <cmd>` özelliğini etkinleştirir. `tools.elevated.enabled` ve gönderenin `tools.elevated.allowFrom.<channel>` içinde olmasını gerektirir.
- `config: true`, `/config` komutunu etkinleştirir (`openclaw.json` okur/yazar). Gateway `chat.send` istemcileri için kalıcı `/config set|unset` yazmaları ayrıca `operator.admin` gerektirir; salt okunur `/config show`, normal yazma kapsamlı operator istemcileri için kullanılabilir kalır.
- `mcp: true`, `mcp.servers` altındaki OpenClaw yönetimli MCP sunucu yapılandırması için `/mcp` komutunu etkinleştirir.
- `plugins: true`, Plugin keşfi, kurulum ve etkinleştirme/devre dışı bırakma denetimleri için `/plugins` komutunu etkinleştirir.
- `channels.<provider>.configWrites`, kanal başına yapılandırma değişikliklerini sınırlar (varsayılan: true).
- Çok hesaplı kanallar için `channels.<provider>.accounts.<id>.configWrites`, o hesabı hedefleyen yazmaları da sınırlar (örneğin `/allowlist --config --account <id>` veya `/config set channels.<provider>.accounts.<id>...`).
- `restart: false`, `/restart` ve Gateway yeniden başlatma aracı eylemlerini devre dışı bırakır. Varsayılan: `true`.
- `ownerAllowFrom`, yalnızca sahip komutları/araçları için açık sahip izin listesidir. `allowFrom` ile ayrıdır.
- `ownerDisplay: "hash"`, sistem isteminde sahip kimliklerini hash'ler. Hashlemeyi denetlemek için `ownerDisplaySecret` ayarlayın.
- `allowFrom` sağlayıcı başınadır. Ayarlandığında **tek** yetkilendirme kaynağıdır (kanal izin listeleri/eşleme ve `useAccessGroups` yok sayılır).
- `useAccessGroups: false`, `allowFrom` ayarlanmamışsa komutların erişim grubu ilkelerini atlamasına izin verir.
- Komut belgeleri haritası:
  - yerleşik + paketli katalog: [Slash Commands](/tr/tools/slash-commands)
  - kanala özgü komut yüzeyleri: [Kanallar](/tr/channels)
  - QQ Bot komutları: [QQ Bot](/tr/channels/qqbot)
  - eşleme komutları: [Eşleme](/tr/channels/pairing)
  - LINE kart komutu: [LINE](/tr/channels/line)
  - bellek Dreaming: [Dreaming](/tr/concepts/dreaming)

</Accordion>

---

## İlgili

- [Yapılandırma başvurusu](/tr/gateway/configuration-reference) — üst düzey anahtarlar
- [Yapılandırma — agents](/tr/gateway/config-agents)
- [Kanallara genel bakış](/tr/channels)
