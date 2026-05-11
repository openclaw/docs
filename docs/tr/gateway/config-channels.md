---
read_when:
    - Kanal Plugin'ini yapılandırma (kimlik doğrulama, erişim denetimi, çoklu hesap)
    - Kanala özgü yapılandırma anahtarlarında sorun giderme
    - DM politikasını, grup politikasını veya bahsetme erişim denetimini denetleme
summary: 'Kanal yapılandırması: Slack, Discord, Telegram, WhatsApp, Matrix, iMessage ve daha fazlasında erişim denetimi, eşleştirme, kanal başına anahtarlar'
title: Yapılandırma — kanallar
x-i18n:
    generated_at: "2026-05-11T20:29:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4199725cdf1216f639ee1c02d5f510e1373edfecacf56977ac3a15d63f207f41
    source_path: gateway/config-channels.md
    workflow: 16
---

Kanal başına yapılandırma anahtarları `channels.*` altında bulunur. DM ve grup erişimini,
çok hesaplı kurulumları, mention gating'i ve Slack, Discord,
Telegram, WhatsApp, Matrix, iMessage ile diğer paketle gelen kanal Plugin'leri için kanal başına anahtarları kapsar.

Ajanlar, araçlar, Gateway çalışma zamanı ve diğer üst düzey anahtarlar için
[Yapılandırma başvurusu](/tr/gateway/configuration-reference) bölümüne bakın.

## Kanallar

Her kanal, yapılandırma bölümü mevcut olduğunda otomatik olarak başlar (`enabled: false` olmadığı sürece).

### DM ve grup erişimi

Tüm kanallar DM ilkelerini ve grup ilkelerini destekler:

| DM ilkesi           | Davranış                                                        |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (varsayılan) | Bilinmeyen gönderenler tek kullanımlık bir eşleştirme kodu alır; sahibin onaylaması gerekir |
| `allowlist`         | Yalnızca `allowFrom` içindeki gönderenler (veya eşleştirilmiş izin deposu) |
| `open`              | Tüm gelen DM'lere izin ver (`allowFrom: ["*"]` gerektirir)             |
| `disabled`          | Tüm gelen DM'leri yoksay                                          |

| Grup ilkesi          | Davranış                                               |
| --------------------- | ------------------------------------------------------ |
| `allowlist` (varsayılan) | Yalnızca yapılandırılmış izin listesiyle eşleşen gruplar          |
| `open`                | Grup izin listelerini atla (mention gating yine uygulanır) |
| `disabled`            | Tüm grup/oda mesajlarını engelle                          |

<Note>
`channels.defaults.groupPolicy`, bir sağlayıcının `groupPolicy` değeri ayarlanmamışsa varsayılanı belirler.
Eşleştirme kodlarının süresi 1 saat sonra dolar. Bekleyen DM eşleştirme istekleri **kanal başına 3** ile sınırlıdır.
Bir sağlayıcı bloğu tamamen eksikse (`channels.<provider>` yoksa), çalışma zamanı grup ilkesi başlangıç uyarısıyla `allowlist` değerine (güvenli kapalı) geri döner.
</Note>

### Kanal modeli geçersiz kılmaları

Belirli kanal kimliklerini bir modele sabitlemek için `channels.modelByChannel` kullanın. Değerler `provider/model` veya yapılandırılmış model takma adlarını kabul eder. Kanal eşlemesi, bir oturumda zaten model geçersiz kılma yoksa uygulanır (örneğin `/model` ile ayarlanmışsa uygulanmaz).

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

- `channels.defaults.groupPolicy`: sağlayıcı düzeyindeki `groupPolicy` ayarlanmamışsa yedek grup ilkesi.
- `channels.defaults.contextVisibility`: tüm kanallar için varsayılan ek bağlam görünürlüğü modu. Değerler: `all` (varsayılan, tüm alıntı/konu/geçmiş bağlamını dahil eder), `allowlist` (yalnızca izin listesindeki gönderenlerden gelen bağlamı dahil eder), `allowlist_quote` (izin listesiyle aynı, ancak açık alıntı/yanıt bağlamını korur). Kanal başına geçersiz kılma: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: sağlıklı kanal durumlarını Heartbeat çıktısına dahil et.
- `channels.defaults.heartbeat.showAlerts`: düşürülmüş/hata durumlarını Heartbeat çıktısına dahil et.
- `channels.defaults.heartbeat.useIndicator`: kompakt gösterge tarzı Heartbeat çıktısı oluştur.

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

- Giden komutlar, varsa varsayılan olarak `default` hesabını kullanır; aksi halde ilk yapılandırılmış hesap kimliğini (sıralanmış) kullanır.
- İsteğe bağlı `channels.whatsapp.defaultAccount`, yapılandırılmış bir hesap kimliğiyle eşleştiğinde bu yedek varsayılan hesap seçimini geçersiz kılar.
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

- Bot belirteci: varsayılan hesap için yedek olarak `TELEGRAM_BOT_TOKEN` ile birlikte `channels.telegram.botToken` veya `channels.telegram.tokenFile` (yalnızca normal dosya; sembolik bağlantılar reddedilir).
- `apiRoot` yalnızca Telegram Bot API köküdür. `https://api.telegram.org/bot<TOKEN>` değil, `https://api.telegram.org` veya kendi barındırdığınız/proxy kökünüzü kullanın; `openclaw doctor --fix` yanlışlıkla eklenmiş sondaki `/bot<TOKEN>` son ekini kaldırır.
- İsteğe bağlı `channels.telegram.defaultAccount`, yapılandırılmış bir hesap kimliğiyle eşleştiğinde varsayılan hesap seçimini geçersiz kılar.
- Çok hesaplı kurulumlarda (2+ hesap kimliği), yedek yönlendirmeden kaçınmak için açık bir varsayılan (`channels.telegram.defaultAccount` veya `channels.telegram.accounts.default`) ayarlayın; bu eksik veya geçersiz olduğunda `openclaw doctor` uyarır.
- `configWrites: false`, Telegram tarafından başlatılan yapılandırma yazmalarını engeller (süper grup kimliği geçişleri, `/config set|unset`).
- `type: "acp"` içeren üst düzey `bindings[]` girdileri, forum konuları için kalıcı ACP bağlamalarını yapılandırır (`match.peer.id` içinde kanonik `chatId:topic:topicId` kullanın). Alan anlamları [ACP Ajanları](/tr/tools/acp-agents#persistent-channel-bindings) bölümünde paylaşılır.
- Telegram akış önizlemeleri `sendMessage` + `editMessageText` kullanır (doğrudan ve grup sohbetlerinde çalışır).
- Yeniden deneme ilkesi: [Yeniden deneme ilkesi](/tr/concepts/retry) bölümüne bakın.

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
      streaming: {
        mode: "progress", // off | partial | block | progress (Discord default: progress)
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

- Belirteç: `channels.discord.token`; varsayılan hesap için geri dönüş olarak `DISCORD_BOT_TOKEN`.
- Açık bir Discord `token` sağlayan doğrudan dış çağrılar, çağrı için o belirteci kullanır; hesap yeniden deneme/ilke ayarları yine etkin çalışma zamanı anlık görüntüsündeki seçili hesaptan gelir.
- İsteğe bağlı `channels.discord.defaultAccount`, yapılandırılmış bir hesap kimliğiyle eşleştiğinde varsayılan hesap seçimini geçersiz kılar.
- Teslim hedefleri için `user:<id>` (DM) veya `channel:<id>` (sunucu kanalı) kullanın; yalın sayısal kimlikler reddedilir.
- Sunucu slug’ları küçük harflidir ve boşluklar `-` ile değiştirilir; kanal anahtarları slug’lanmış adı kullanır (`#` yok). Sunucu kimliklerini tercih edin.
- Bot tarafından yazılan iletiler varsayılan olarak yok sayılır. `allowBots: true` bunları etkinleştirir; yalnızca bottan bahseden bot iletilerini kabul etmek için `allowBots: "mentions"` kullanın (kendi iletileri yine filtrelenir).
- `channels.discord.guilds.<id>.ignoreOtherMentions` (ve kanal geçersiz kılmaları), bottan bahsetmeyip başka bir kullanıcıdan veya rolden bahseden iletileri düşürür (@everyone/@here hariç).
- `channels.discord.mentionAliases`, kararlı giden `@handle` metnini göndermeden önce Discord kullanıcı kimliklerine eşler; böylece geçici dizin önbelleği boş olsa bile bilinen ekip arkadaşlarından deterministik biçimde bahsedilebilir. Hesap başına geçersiz kılmalar `channels.discord.accounts.<accountId>.mentionAliases` altında yer alır.
- `maxLinesPerMessage` (varsayılan 17), 2000 karakterin altında olsa bile uzun iletileri böler.
- `channels.discord.threadBindings`, Discord iş parçacığına bağlı yönlendirmeyi denetler:
  - `enabled`: iş parçacığına bağlı oturum özellikleri için Discord geçersiz kılması (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` ve bağlı teslim/yönlendirme)
  - `idleHours`: etkinliksizlikte otomatik odaktan çıkarma için saat cinsinden Discord geçersiz kılması (`0` devre dışı bırakır)
  - `maxAgeHours`: kesin azami yaş için saat cinsinden Discord geçersiz kılması (`0` devre dışı bırakır)
  - `spawnSessions`: `sessions_spawn({ thread: true })` ve ACP iş parçacığı oluşturma otomatik iş parçacığı oluşturma/bağlama için anahtar (varsayılan: `true`)
  - `defaultSpawnContext`: iş parçacığına bağlı oluşturmalarda yerel alt ajan bağlamı (varsayılan olarak `"fork"`)
- `type: "acp"` içeren üst düzey `bindings[]` girdileri, kanallar ve iş parçacıkları için kalıcı ACP bağlamaları yapılandırır (`match.peer.id` içinde kanal/iş parçacığı kimliği kullanın). Alan semantiği [ACP Ajanları](/tr/tools/acp-agents#persistent-channel-bindings) içinde paylaşılır.
- `channels.discord.ui.components.accentColor`, Discord bileşenleri v2 kapsayıcıları için vurgu rengini ayarlar.
- `channels.discord.voice`, Discord ses kanalı konuşmalarını ve isteğe bağlı otomatik katılma + LLM + TTS geçersiz kılmalarını etkinleştirir. Yalnızca metin içeren Discord yapılandırmaları sesi varsayılan olarak kapalı bırakır; dahil olmak için `channels.discord.voice.enabled=true` ayarlayın.
- `channels.discord.voice.model`, Discord ses kanalı yanıtları için kullanılan LLM modelini isteğe bağlı olarak geçersiz kılar.
- `channels.discord.voice.daveEncryption` ve `channels.discord.voice.decryptionFailureTolerance`, `@discordjs/voice` DAVE seçeneklerine aktarılır (varsayılan olarak `true` ve `24`).
- `channels.discord.voice.connectTimeoutMs`, `/vc join` ve otomatik katılma denemeleri için ilk `@discordjs/voice` Hazır beklemesini denetler (varsayılan olarak `30000`).
- `channels.discord.voice.reconnectGraceMs`, bağlantısı kesilen bir ses oturumunun OpenClaw tarafından yok edilmeden önce yeniden bağlanma sinyallemesine girmek için ne kadar süre alabileceğini denetler (varsayılan olarak `15000`).
- Discord ses çalma, başka bir kullanıcının konuşmaya başlama olayıyla kesintiye uğratılmaz. Geri besleme döngülerinden kaçınmak için OpenClaw, TTS çalarken yeni ses yakalamayı yok sayar.
- OpenClaw ayrıca yinelenen şifre çözme hatalarından sonra bir ses oturumundan ayrılıp yeniden katılarak ses alma kurtarması dener.
- `channels.discord.streaming`, kanonik akış modu anahtarıdır. Discord varsayılan olarak `streaming.mode: "progress"` kullanır; böylece araç/iş ilerlemesi düzenlenen tek bir önizleme iletisinde görünür. Devre dışı bırakmak için `streaming.mode: "off"` ayarlayın. Eski `streamMode` ve boolean `streaming` değerleri çalışma zamanı takma adları olarak kalır; kalıcı yapılandırmayı yeniden yazmak için `openclaw doctor --fix` çalıştırın.
- `channels.discord.autoPresence`, çalışma zamanı kullanılabilirliğini bot durumuna eşler (sağlıklı => çevrimiçi, bozulmuş => boşta, tükenmiş => dnd) ve isteğe bağlı durum metni geçersiz kılmalarına izin verir.
- `channels.discord.dangerouslyAllowNameMatching`, değiştirilebilir ad/etiket eşleştirmeyi yeniden etkinleştirir (acil uyumluluk modu).
- `channels.discord.execApprovals`: Discord'a özgü exec onayı teslimi ve onaylayıcı yetkilendirmesi.
  - `enabled`: `true`, `false` veya `"auto"` (varsayılan). Otomatik modda, onaylayıcılar `approvers` veya `commands.ownerAllowFrom` üzerinden çözümlenebildiğinde exec onayları etkinleşir.
  - `approvers`: exec isteklerini onaylamasına izin verilen Discord kullanıcı kimlikleri. Atlandığında `commands.ownerAllowFrom` değerine geri döner.
  - `agentFilter`: isteğe bağlı ajan kimliği izin listesi. Tüm ajanlar için onayları iletmek üzere atlayın.
  - `sessionFilter`: isteğe bağlı oturum anahtarı desenleri (alt dize veya regex).
  - `target`: onay istemlerinin nereye gönderileceği. `"dm"` (varsayılan) onaylayıcı DM’lerine gönderir, `"channel"` kaynak kanala gönderir, `"both"` ikisine de gönderir. Hedef `"channel"` içerdiğinde, düğmeler yalnızca çözümlenen onaylayıcılar tarafından kullanılabilir.
  - `cleanupAfterResolve`: `true` olduğunda onay, ret veya zaman aşımından sonra onay DM’lerini siler.

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

- Hizmet hesabı JSON’u: satır içi (`serviceAccount`) veya dosya tabanlı (`serviceAccountFile`).
- Hizmet hesabı SecretRef’i de desteklenir (`serviceAccountRef`).
- Ortam geri dönüşleri: `GOOGLE_CHAT_SERVICE_ACCOUNT` veya `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- Teslim hedefleri için `spaces/<spaceId>` veya `users/<userId>` kullanın.
- `channels.googlechat.dangerouslyAllowNameMatching`, değiştirilebilir e-posta sorumlusu eşleştirmeyi yeniden etkinleştirir (acil uyumluluk modu).

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

- **Soket modu** hem `botToken` hem de `appToken` gerektirir (varsayılan hesap ortam geri dönüşü için `SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN`).
- **HTTP modu** `botToken` ve ayrıca `signingSecret` gerektirir (kökte veya hesap başına).
- `socketMode`, Slack SDK Soket Modu aktarım ayarlarını genel Bolt alıcı API’sine geçirir. Bunu yalnızca ping/pong zaman aşımı veya bayat websocket davranışını araştırırken kullanın.
- `botToken`, `appToken`, `signingSecret` ve `userToken`, düz metin
  dizeleri veya SecretRef nesneleri kabul eder.
- Slack hesap anlık görüntüleri, kimlik bilgisi başına kaynak/durum alanlarını açığa çıkarır; örneğin
  `botTokenSource`, `botTokenStatus`, `appTokenStatus` ve HTTP modunda
  `signingSecretStatus`. `configured_unavailable`, hesabın
  SecretRef üzerinden yapılandırıldığını ancak geçerli komut/çalışma zamanı yolunun
  gizli değeri çözemediğini belirtir.
- `configWrites: false`, Slack kaynaklı yapılandırma yazmalarını engeller.
- İsteğe bağlı `channels.slack.defaultAccount`, yapılandırılmış bir hesap kimliğiyle eşleştiğinde varsayılan hesap seçimini geçersiz kılar.
- `channels.slack.streaming.mode`, kanonik Slack akış modu anahtarıdır. `channels.slack.streaming.nativeTransport`, Slack’in yerel akış aktarımını denetler. Eski `streamMode`, boolean `streaming` ve `nativeStreaming` değerleri çalışma zamanı takma adları olarak kalır; kalıcı yapılandırmayı yeniden yazmak için `openclaw doctor --fix` çalıştırın.
- `unfurlLinks` ve `unfurlMedia`, bot yanıtları için Slack’in `chat.postMessage` bağlantı ve medya önizleme boolean değerlerini geçirir. Slack’in varsayılan davranışını korumak için bunları atlayın; tek bir hesap için üst düzey varsayılanı geçersiz kılmak üzere `channels.slack.accounts.<accountId>` altında ayarlayın.
- Teslim hedefleri için `user:<id>` (DM) veya `channel:<id>` kullanın.

**Tepki bildirim modları:** `off`, `own` (varsayılan), `all`, `allowlist` (`reactionAllowlist` içinden).

**İş parçacığı oturum yalıtımı:** `thread.historyScope`, iş parçacığı başınadır (varsayılan) veya kanal genelinde paylaşılır. `thread.inheritParent`, üst kanal konuşma dökümünü yeni iş parçacıklarına kopyalar.

- Slack yerel akışı ve Slack asistan tarzı "yazıyor..." iş parçacığı durumu, bir yanıt iş parçacığı hedefi gerektirir. Üst düzey DM’ler varsayılan olarak iş parçacığı dışında kalır; böylece iş parçacığı tarzı yerel akış/durum önizlemesini göstermek yerine Slack taslak gönder-ve-düzenle önizlemeleri üzerinden akış yapabilirler.
- `typingReaction`, yanıt çalışırken gelen Slack iletisine geçici bir tepki ekler, ardından tamamlandığında bunu kaldırır. `"hourglass_flowing_sand"` gibi bir Slack emoji kısa kodu kullanın.
- `channels.slack.execApprovals`: Slack'e özgü exec onayı teslimi ve onaylayıcı yetkilendirmesi. Discord ile aynı şema: `enabled` (`true`/`false`/`"auto"`), `approvers` (Slack kullanıcı kimlikleri), `agentFilter`, `sessionFilter` ve `target` (`"dm"`, `"channel"` veya `"both"`).

| Eylem grubu | Varsayılan | Notlar                      |
| ------------ | ------- | ---------------------- |
| reactions    | etkin | Tepki ver + tepkileri listele |
| messages     | etkin | Oku/gönder/düzenle/sil  |
| pins         | etkin | Sabitle/sabitlemeyi kaldır/listele |
| memberInfo   | etkin | Üye bilgisi            |
| emojiList    | etkin | Özel emoji listesi      |

### Mattermost

Mattermost, güncel OpenClaw sürümlerinde pakete dahil bir Plugin olarak gelir. Daha eski veya
özel derlemeler güncel bir npm paketini
`openclaw plugins install @openclaw/mattermost` ile kurabilir. Bir sürümü sabitlemeden önce
güncel dist-tag’ler için
[npmjs.com/package/@openclaw/mattermost](https://www.npmjs.com/package/@openclaw/mattermost)
adresini kontrol edin.

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

Sohbet modları: `oncall` (@-bahsinde yanıt ver, varsayılan), `onmessage` (her mesaj), `onchar` (tetikleyici ön ekle başlayan mesajlar).

Mattermost yerel komutları etkinleştirildiğinde:

- `commands.callbackPath` tam URL değil, bir yol olmalıdır (örneğin `/api/channels/mattermost/command`).
- `commands.callbackUrl` OpenClaw gateway uç noktasına çözümlenmeli ve Mattermost sunucusundan erişilebilir olmalıdır.
- Yerel eğik çizgi callback'leri, eğik çizgi komutu kaydı sırasında Mattermost tarafından döndürülen komut başına token'larla kimlik doğrular. Kayıt başarısız olursa veya hiçbir komut etkinleştirilmezse OpenClaw callback'leri `Unauthorized: invalid command token.` ile reddeder.
- Özel/tailnet/dahili callback ana makineleri için Mattermost, `ServiceSettings.AllowedUntrustedInternalConnections` değerinin callback ana makinesini/alan adını içermesini gerektirebilir. Tam URL'ler değil, ana makine/alan adı değerleri kullanın.
- `channels.mattermost.configWrites`: Mattermost tarafından başlatılan yapılandırma yazmalarına izin ver veya bunları reddet.
- `channels.mattermost.requireMention`: kanallarda yanıtlamadan önce `@mention` gerektir.
- `channels.mattermost.groups.<channelId>.requireMention`: kanal başına bahsetme kapısı geçersiz kılma (`"*"` varsayılan için).
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

- `channels.signal.account`: kanal başlatmayı belirli bir Signal hesap kimliğine sabitle.
- `channels.signal.configWrites`: Signal tarafından başlatılan yapılandırma yazmalarına izin ver veya bunları reddet.
- İsteğe bağlı `channels.signal.defaultAccount`, yapılandırılmış bir hesap kimliğiyle eşleştiğinde varsayılan hesap seçimini geçersiz kılar.

### iMessage

OpenClaw `imsg rpc` başlatır (stdio üzerinden JSON-RPC). Daemon veya bağlantı noktası gerekmez. Ana makine Messages veritabanı ve Automation izinlerini verebildiğinde, yeni OpenClaw iMessage kurulumları için tercih edilen yol budur.

BlueBubbles desteği kaldırıldı. `channels.bluebubbles`, mevcut OpenClaw'da desteklenen bir çalışma zamanı yapılandırma yüzeyi değildir. Eski yapılandırmaları `channels.imessage` öğesine taşıyın; kısa sürüm için [BlueBubbles kaldırması ve imsg iMessage yolu](/tr/announcements/bluebubbles-imessage), tam çeviri tablosu için [BlueBubbles'tan gelenler](/tr/channels/imessage-from-bluebubbles) bölümünü kullanın.

Gateway oturum açılmış Messages Mac üzerinde çalışmıyorsa `channels.imessage.enabled=true` değerini koruyun ve `channels.imessage.cliPath` değerini o Mac üzerinde `imsg "$@"` çalıştıran bir SSH sarmalayıcısına ayarlayın. Varsayılan yerel `imsg` yolu yalnızca macOS içindir.

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
      actions: {
        reactions: true,
        edit: true,
        unsend: true,
        reply: true,
        sendWithEffect: true,
        sendAttachment: true,
      },
      catchup: {
        enabled: false,
      },
    },
  },
}
```

- İsteğe bağlı `channels.imessage.defaultAccount`, yapılandırılmış bir hesap kimliğiyle eşleştiğinde varsayılan hesap seçimini geçersiz kılar.

- Messages DB için Full Disk Access gerektirir.
- `chat_id:<id>` hedeflerini tercih edin. Sohbetleri listelemek için `imsg chats --limit 20` kullanın.
- `cliPath` bir SSH sarmalayıcısına işaret edebilir; SCP ek getirme için `remoteHost` (`host` veya `user@host`) ayarlayın.
- `attachmentRoots` ve `remoteAttachmentRoots` gelen ek yollarını kısıtlar (varsayılan: `/Users/*/Library/Messages/Attachments`).
- SCP sıkı ana makine anahtarı denetimi kullanır, bu nedenle röle ana makine anahtarının `~/.ssh/known_hosts` içinde zaten bulunduğundan emin olun.
- `channels.imessage.configWrites`: iMessage tarafından başlatılan yapılandırma yazmalarına izin ver veya bunları reddet.
- `channels.imessage.actions.*`: `imsg status` / `openclaw channels status --probe` tarafından da kapılan özel API eylemlerini etkinleştir.
- `channels.imessage.includeAttachments` varsayılan olarak kapalıdır; ajan dönüşlerinde gelen medya beklemeden önce bunu `true` olarak ayarlayın.
- `channels.imessage.catchup.enabled`: Gateway kapalıyken gelen mesajları yeniden oynatmayı seç.
- `channels.imessage.groups`: grup kayıt defteri ve grup başına ayarlar. `groupPolicy: "allowlist"` ile, grup mesajlarının kayıt defteri kapısından geçebilmesi için açık `chat_id` anahtarlarını veya bir `"*"` joker girişini yapılandırın.
- `type: "acp"` içeren üst düzey `bindings[]` girişleri, iMessage konuşmalarını kalıcı ACP oturumlarına bağlayabilir. `match.peer.id` içinde normalleştirilmiş bir tanıtıcı veya açık sohbet hedefi (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) kullanın. Paylaşılan alan semantiği: [ACP Ajanları](/tr/tools/acp-agents#persistent-channel-bindings).

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
- `channels.matrix.network.dangerouslyAllowPrivateNetwork`, özel/dahili homeserver'lara izin verir. `proxy` ve bu ağ katılımı bağımsız denetimlerdir.
- `channels.matrix.defaultAccount`, çok hesaplı kurulumlarda tercih edilen hesabı seçer.
- `channels.matrix.autoJoin` varsayılan olarak `off` değerindedir, bu nedenle davet edilen odalar ve yeni DM tarzı davetler, `autoJoinAllowlist` ile `autoJoin: "allowlist"` veya `autoJoin: "always"` ayarlayana kadar yok sayılır.
- `channels.matrix.execApprovals`: Matrix yerel exec onayı teslimi ve onaylayan yetkilendirmesi.
  - `enabled`: `true`, `false` veya `"auto"` (varsayılan). Otomatik modda, onaylayanlar `approvers` veya `commands.ownerAllowFrom` içinden çözümlenebildiğinde exec onayları etkinleşir.
  - `approvers`: exec isteklerini onaylamasına izin verilen Matrix kullanıcı kimlikleri (ör. `@owner:example.org`).
  - `agentFilter`: isteğe bağlı ajan kimliği izin listesi. Tüm ajanlar için onayları iletmek üzere atlayın.
  - `sessionFilter`: isteğe bağlı oturum anahtarı kalıpları (alt dize veya regex).
  - `target`: onay istemlerinin gönderileceği yer. `"dm"` (varsayılan), `"channel"` (kaynak oda) veya `"both"`.
  - Hesap başına geçersiz kılmalar: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope`, Matrix DM'lerinin oturumlar halinde nasıl gruplanacağını denetler: `per-user` (varsayılan) yönlendirilen eşe göre paylaşır, `per-room` ise her DM odasını yalıtır.
- Matrix durum yoklamaları ve canlı dizin aramaları, çalışma zamanı trafiğiyle aynı proxy ilkesini kullanır.
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
- Tam Teams yapılandırması (kimlik bilgileri, webhook, DM/grup ilkesi, ekip başına/kanal başına geçersiz kılmalar) [Microsoft Teams](/tr/channels/msteams) bölümünde belgelenmiştir.

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
- Tam IRC kanal yapılandırması (ana makine/bağlantı noktası/TLS/kanallar/izin listeleri/bahsetme kapısı) [IRC](/tr/channels/irc) bölümünde belgelenmiştir.

### Çoklu hesap (tüm kanallar)

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

- `default`, `accountId` atlandığında kullanılır (CLI + yönlendirme).
- Env token'ları yalnızca **varsayılan** hesaba uygulanır.
- Temel kanal ayarları, hesap başına geçersiz kılınmadıkça tüm hesaplara uygulanır.
- Her hesabı farklı bir ajana yönlendirmek için `bindings[].match.accountId` kullanın.
- Tek hesaplı üst düzey kanal yapılandırmasındayken `openclaw channels add` (veya kanal onboarding'i) aracılığıyla varsayılan olmayan bir hesap eklerseniz OpenClaw, özgün hesabın çalışmaya devam etmesi için önce hesap kapsamlı üst düzey tek hesap değerlerini kanal hesap haritasına yükseltir. Çoğu kanal bunları `channels.<channel>.accounts.default` içine taşır; Matrix bunun yerine mevcut eşleşen adlandırılmış/varsayılan hedefi koruyabilir.
- Mevcut yalnızca kanal bağlamaları (`accountId` yok) varsayılan hesapla eşleşmeyi sürdürür; hesap kapsamlı bağlamalar isteğe bağlı kalır.
- `openclaw doctor --fix`, hesap kapsamlı üst düzey tek hesap değerlerini o kanal için seçilen yükseltilmiş hesaba taşıyarak karışık şekilleri de onarır. Çoğu kanal `accounts.default` kullanır; Matrix bunun yerine mevcut eşleşen adlandırılmış/varsayılan hedefi koruyabilir.

### Diğer Plugin kanalları

Birçok Plugin kanalı `channels.<id>` olarak yapılandırılır ve kendilerine ayrılmış kanal sayfalarında belgelenir (örneğin Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat ve Twitch).
Tam kanal dizinine bakın: [Kanallar](/tr/channels).

### Grup sohbeti bahsetme kapısı

Grup mesajları varsayılan olarak **bahsetme gerektirir** (metadata bahsetmesi veya güvenli regex kalıpları). WhatsApp, Telegram, Discord, Google Chat ve iMessage grup sohbetleri için geçerlidir.

Görünür yanıtlar ayrı olarak kontrol edilir. Grup/kanal odaları varsayılan olarak `messages.groupChat.visibleReplies: "message_tool"` kullanır: OpenClaw turu yine işler, ancak normal son yanıtlar gizli kalır ve görünür oda çıktısı `message(action=send)` gerektirir. Normal yanıtların odaya geri gönderildiği eski davranışı yalnızca istediğinizde `"automatic"` olarak ayarlayın. Aynı yalnızca araçla görünür yanıt davranışını doğrudan sohbetlere de uygulamak için `messages.visibleReplies: "message_tool"` ayarlayın; Codex harness da ayarlanmamış doğrudan sohbet varsayılanı olarak bu yalnızca araç davranışını kullanır.

Yalnızca araçla görünür yanıtlar, araçları güvenilir şekilde çağıran bir model/runtime gerektirir. Oturum günlüğü `didSendViaMessagingTool: false` ile asistan metni gösteriyorsa, model mesaj aracını çağırmak yerine gizli bir son yanıt üretmiştir. Bu kanal için daha güçlü araç çağırma modeline geçin veya eski görünür son yanıtları geri yüklemek için `messages.groupChat.visibleReplies: "automatic"` ayarlayın.

Mesaj aracı etkin araç politikası altında kullanılamıyorsa, OpenClaw yanıtı sessizce bastırmak yerine otomatik görünür yanıtlara geri döner. `openclaw doctor` bu uyumsuzluk hakkında uyarır.

Gateway, dosya kaydedildikten sonra `messages` yapılandırmasını sıcak yeniden yükler. Yalnızca dağıtımda dosya izleme veya yapılandırma yeniden yükleme devre dışıysa yeniden başlatın.

**Bahsetme türleri:**

- **Meta veri bahsetmeleri**: Yerel platform @-bahsetmeleri. WhatsApp kendiyle sohbet modunda yok sayılır.
- **Metin desenleri**: `agents.list[].groupChat.mentionPatterns` içindeki güvenli regex desenleri. Geçersiz desenler ve güvenli olmayan iç içe tekrarlar yok sayılır.
- Bahsetme kapısı yalnızca algılama mümkün olduğunda (yerel bahsetmeler veya en az bir desen) uygulanır.

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

`messages.groupChat.historyLimit` küresel varsayılanı ayarlar. Kanallar `channels.<channel>.historyLimit` (veya hesap başına) ile geçersiz kılabilir. Devre dışı bırakmak için `0` ayarlayın.

`messages.visibleReplies` küresel kaynak-tur varsayılanıdır; `messages.groupChat.visibleReplies` grup/kanal kaynak turları için bunu geçersiz kılar. `messages.visibleReplies` ayarlanmamış olduğunda, bir harness kendi doğrudan/kaynak varsayılanını sağlayabilir; Codex harness varsayılan olarak `message_tool` kullanır. Kanal izin listeleri ve bahsetme kapısı yine de bir turun işlenip işlenmeyeceğine karar verir.

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

#### Kendiyle sohbet modu

Kendiyle sohbet modunu etkinleştirmek için kendi numaranızı `allowFrom` içine ekleyin (yerel @-bahsetmeleri yok sayar, yalnızca metin desenlerine yanıt verir):

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

- Bu blok komut yüzeylerini yapılandırır. Geçerli yerleşik + paketlenmiş komut kataloğu için bkz. [Slash Commands](/tr/tools/slash-commands).
- Bu sayfa tam komut kataloğu değil, bir **yapılandırma anahtarı referansıdır**. QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, cihaz eşleme `/pair`, bellek `/dreaming`, telefon denetimi `/phone` ve Talk `/voice` gibi kanal/Plugin sahipli komutlar kendi kanal/Plugin sayfalarında ve [Slash Commands](/tr/tools/slash-commands) içinde belgelenmiştir.
- Metin komutları başında `/` olan **bağımsız** mesajlar olmalıdır.
- `native: "auto"` Discord/Telegram için yerel komutları açar, Slack’i kapalı bırakır.
- `nativeSkills: "auto"` Discord/Telegram için yerel skill komutlarını açar, Slack’i kapalı bırakır.
- Kanal başına geçersiz kılma: `channels.discord.commands.native` (bool veya `"auto"`). Discord için `false`, başlangıç sırasında yerel komut kaydını ve temizlemeyi atlar.
- Kanal başına yerel skill kaydını `channels.<provider>.commands.nativeSkills` ile geçersiz kılın.
- `channels.telegram.customCommands` ek Telegram bot menü girdileri ekler.
- `bash: true`, ana makine kabuğu için `! <cmd>` etkinleştirir. `tools.elevated.enabled` ve gönderenin `tools.elevated.allowFrom.<channel>` içinde olmasını gerektirir.
- `config: true`, `/config` komutunu etkinleştirir (`openclaw.json` okur/yazar). Gateway `chat.send` istemcileri için kalıcı `/config set|unset` yazmaları ayrıca `operator.admin` gerektirir; salt okunur `/config show`, normal yazma kapsamlı operator istemcileri için kullanılabilir kalır.
- `mcp: true`, `mcp.servers` altındaki OpenClaw tarafından yönetilen MCP sunucu yapılandırması için `/mcp` etkinleştirir.
- `plugins: true`, Plugin keşfi, kurulum ve etkinleştirme/devre dışı bırakma denetimleri için `/plugins` etkinleştirir.
- `channels.<provider>.configWrites`, kanal başına yapılandırma mutasyonlarını kapılar (varsayılan: true).
- Çok hesaplı kanallar için `channels.<provider>.accounts.<id>.configWrites`, o hesabı hedefleyen yazmaları da kapılar (örneğin `/allowlist --config --account <id>` veya `/config set channels.<provider>.accounts.<id>...`).
- `restart: false`, `/restart` ve Gateway yeniden başlatma aracı eylemlerini devre dışı bırakır. Varsayılan: `true`.
- `ownerAllowFrom`, yalnızca sahip komutları/araçları için açık sahip izin listesidir. `allowFrom` değerinden ayrıdır.
- `ownerDisplay: "hash"`, sistem isteminde sahip kimliklerini hash’ler. Hashlemeyi denetlemek için `ownerDisplaySecret` ayarlayın.
- `allowFrom` sağlayıcı başınadır. Ayarlandığında **tek** yetkilendirme kaynağıdır (kanal izin listeleri/eşleme ve `useAccessGroups` yok sayılır).
- `useAccessGroups: false`, `allowFrom` ayarlanmadığında komutların erişim grubu politikalarını atlamasına izin verir.
- Komut dokümanları haritası:
  - yerleşik + paketlenmiş katalog: [Slash Commands](/tr/tools/slash-commands)
  - kanala özgü komut yüzeyleri: [Kanallar](/tr/channels)
  - QQ Bot komutları: [QQ Bot](/tr/channels/qqbot)
  - eşleme komutları: [Eşleme](/tr/channels/pairing)
  - LINE kart komutu: [LINE](/tr/channels/line)
  - bellek Dreaming: [Dreaming](/tr/concepts/dreaming)

</Accordion>

---

## İlgili

- [Yapılandırma referansı](/tr/gateway/configuration-reference) — üst düzey anahtarlar
- [Yapılandırma — agents](/tr/gateway/config-agents)
- [Kanallar genel bakışı](/tr/channels)
