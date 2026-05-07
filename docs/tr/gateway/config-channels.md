---
read_when:
    - Kanal Plugin'ini yapılandırma (kimlik doğrulama, erişim denetimi, çoklu hesap)
    - Kanal bazında yapılandırma anahtarlarında sorun giderme
    - DM politikasını, grup politikasını veya bahsetme geçitlemesini denetleme
summary: 'Kanal yapılandırması: Slack, Discord, Telegram, WhatsApp, Matrix, iMessage ve daha fazlasında erişim denetimi, eşleştirme ve kanal başına anahtarlar'
title: Yapılandırma — kanallar
x-i18n:
    generated_at: "2026-05-07T13:17:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 10ff37f804fe3a2443372c4b195c00a4ee427ebd4c602bfb13e5040bddfaab93
    source_path: gateway/config-channels.md
    workflow: 16
---

Kanal başına yapılandırma anahtarları `channels.*` altında yer alır. DM ve grup erişimini,
çok hesaplı kurulumları, bahsetme denetimini ve Slack, Discord,
Telegram, WhatsApp, Matrix, iMessage ve birlikte gelen diğer kanal Plugin'leri için kanal başına anahtarları kapsar.

Ajanlar, araçlar, gateway çalışma zamanı ve diğer üst düzey anahtarlar için bkz.
[Yapılandırma başvurusu](/tr/gateway/configuration-reference).

## Kanallar

Her kanal, yapılandırma bölümü mevcut olduğunda otomatik olarak başlar (`enabled: false` olmadıkça).

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
| `open`                | Grup izin listelerini atla (bahsetme denetimi yine de uygulanır) |
| `disabled`            | Tüm grup/oda mesajlarını engelle                          |

<Note>
`channels.defaults.groupPolicy`, bir sağlayıcının `groupPolicy` değeri ayarlanmadığında varsayılanı belirler.
Eşleştirme kodları 1 saat sonra sona erer. Bekleyen DM eşleştirme istekleri **kanal başına 3** ile sınırlıdır.
Bir sağlayıcı bloğu tamamen eksikse (`channels.<provider>` yoksa), çalışma zamanı grup ilkesi başlangıç uyarısıyla `allowlist` değerine (güvenli kapalı) geri döner.
</Note>

### Kanal model geçersiz kılmaları

Belirli kanal kimliklerini bir modele sabitlemek için `channels.modelByChannel` kullanın. Değerler `provider/model` veya yapılandırılmış model diğer adlarını kabul eder. Kanal eşlemesi, bir oturumda zaten bir model geçersiz kılması yoksa uygulanır (örneğin, `/model` aracılığıyla ayarlanmışsa uygulanmaz).

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
- `channels.defaults.contextVisibility`: tüm kanallar için varsayılan ek bağlam görünürlük modu. Değerler: `all` (varsayılan, alıntılanan/konu/geçmiş bağlamının tamamını dahil et), `allowlist` (yalnızca izin listesindeki gönderenlerden gelen bağlamı dahil et), `allowlist_quote` (izin listesiyle aynı, ancak açık alıntı/yanıt bağlamını koru). Kanal başına geçersiz kılma: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: sağlıklı kanal durumlarını Heartbeat çıktısına dahil et.
- `channels.defaults.heartbeat.showAlerts`: bozulmuş/hata durumlarını Heartbeat çıktısına dahil et.
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
      sendReadReceipts: true, // mavi tikler (kendiyle sohbet modunda false)
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

- Giden komutlar, varsa varsayılan olarak `default` hesabını kullanır; aksi takdirde ilk yapılandırılmış hesap kimliğini kullanır (sıralanmış).
- İsteğe bağlı `channels.whatsapp.defaultAccount`, yapılandırılmış bir hesap kimliğiyle eşleştiğinde bu geri dönüş varsayılan hesap seçimini geçersiz kılar.
- Eski tek hesaplı Baileys kimlik doğrulama dizini, `openclaw doctor` tarafından `whatsapp/default` içine geçirilir.
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
      streaming: "partial", // off | partial | block | progress (varsayılan: off; önizleme düzenleme hız sınırlarından kaçınmak için açıkça etkinleştirin)
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

- Bot token: `channels.telegram.botToken` veya `channels.telegram.tokenFile` (yalnızca normal dosya; sembolik bağlantılar reddedilir), varsayılan hesap için geri dönüş olarak `TELEGRAM_BOT_TOKEN`.
- `apiRoot` yalnızca Telegram Bot API köküdür. `https://api.telegram.org/bot<TOKEN>` değil, `https://api.telegram.org` veya kendi barındırdığınız/proxy kökünüzü kullanın; `openclaw doctor --fix` yanlışlıkla eklenmiş sondaki `/bot<TOKEN>` sonekini kaldırır.
- İsteğe bağlı `channels.telegram.defaultAccount`, yapılandırılmış bir hesap kimliğiyle eşleştiğinde varsayılan hesap seçimini geçersiz kılar.
- Çok hesaplı kurulumlarda (2+ hesap kimliği), geri dönüş yönlendirmesinden kaçınmak için açık bir varsayılan (`channels.telegram.defaultAccount` veya `channels.telegram.accounts.default`) ayarlayın; bu eksik veya geçersiz olduğunda `openclaw doctor` uyarır.
- `configWrites: false`, Telegram tarafından başlatılan yapılandırma yazmalarını engeller (süper grup kimliği geçişleri, `/config set|unset`).
- `type: "acp"` içeren üst düzey `bindings[]` girişleri, forum konuları için kalıcı ACP bağlamalarını yapılandırır (`match.peer.id` içinde kanonik `chatId:topic:topicId` kullanın). Alan semantiği [ACP Ajanları](/tr/tools/acp-agents#persistent-channel-bindings) içinde paylaşılır.
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

- Token: `channels.discord.token`; varsayılan hesap için yedek olarak `DISCORD_BOT_TOKEN` kullanılır.
- Açık bir Discord `token` sağlayan doğrudan giden çağrılar, çağrı için o token'ı kullanır; hesap yeniden deneme/politika ayarları yine etkin çalışma zamanı anlık görüntüsündeki seçili hesaptan gelir.
- İsteğe bağlı `channels.discord.defaultAccount`, yapılandırılmış bir hesap kimliğiyle eşleştiğinde varsayılan hesap seçimini geçersiz kılar.
- Teslimat hedefleri için `user:<id>` (DM) veya `channel:<id>` (sunucu kanalı) kullanın; çıplak sayısal kimlikler reddedilir.
- Sunucu slug'ları küçük harflidir ve boşluklar `-` ile değiştirilir; kanal anahtarları slug yapılmış adı kullanır (`#` olmadan). Sunucu kimliklerini tercih edin.
- Bot tarafından yazılmış mesajlar varsayılan olarak yok sayılır. `allowBots: true` bunları etkinleştirir; yalnızca bottan bahseden bot mesajlarını kabul etmek için `allowBots: "mentions"` kullanın (kendi mesajları yine filtrelenir).
- `channels.discord.guilds.<id>.ignoreOtherMentions` (ve kanal geçersiz kılmaları), başka bir kullanıcıdan veya rolden bahsedip bottan bahsetmeyen mesajları düşürür (@everyone/@here hariç).
- `channels.discord.mentionAliases`, geçici dizin önbelleği boş olsa bile bilinen ekip arkadaşlarından deterministik olarak bahsedilebilmesi için kararlı giden `@handle` metnini göndermeden önce Discord kullanıcı kimliklerine eşler. Hesap başına geçersiz kılmalar `channels.discord.accounts.<accountId>.mentionAliases` altında bulunur.
- `maxLinesPerMessage` (varsayılan 17), 2000 karakterin altında olsa bile uzun mesajları böler.
- `channels.discord.threadBindings`, Discord iş parçacığına bağlı yönlendirmeyi denetler:
  - `enabled`: iş parçacığına bağlı oturum özellikleri için Discord geçersiz kılması (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` ve bağlı teslimat/yönlendirme)
  - `idleHours`: saat cinsinden hareketsizlikte otomatik odak kaldırma için Discord geçersiz kılması (`0` devre dışı bırakır)
  - `maxAgeHours`: saat cinsinden katı azami yaş için Discord geçersiz kılması (`0` devre dışı bırakır)
  - `spawnSessions`: `sessions_spawn({ thread: true })` ve ACP iş parçacığı oluşturma otomatik iş parçacığı oluşturma/bağlama için anahtar (varsayılan: `true`)
  - `defaultSpawnContext`: iş parçacığına bağlı oluşturmalarda yerel alt ajan bağlamı (varsayılan olarak `"fork"`)
- `type: "acp"` içeren üst düzey `bindings[]` girişleri, kanallar ve iş parçacıkları için kalıcı ACP bağlamaları yapılandırır (`match.peer.id` içinde kanal/iş parçacığı kimliğini kullanın). Alan semantiği [ACP Ajanları](/tr/tools/acp-agents#persistent-channel-bindings) içinde paylaşılır.
- `channels.discord.ui.components.accentColor`, Discord bileşenleri v2 kapsayıcıları için vurgu rengini ayarlar.
- `channels.discord.voice`, Discord ses kanalı konuşmalarını ve isteğe bağlı otomatik katılma + LLM + TTS geçersiz kılmalarını etkinleştirir. Yalnızca metinli Discord yapılandırmaları sesi varsayılan olarak kapalı bırakır; katılmak için `channels.discord.voice.enabled=true` ayarlayın.
- `channels.discord.voice.model`, Discord ses kanalı yanıtları için kullanılan LLM modelini isteğe bağlı olarak geçersiz kılar.
- `channels.discord.voice.daveEncryption` ve `channels.discord.voice.decryptionFailureTolerance`, `@discordjs/voice` DAVE seçeneklerine aktarılır (varsayılan olarak `true` ve `24`).
- `channels.discord.voice.connectTimeoutMs`, `/vc join` ve otomatik katılma denemeleri için başlangıç `@discordjs/voice` Ready beklemesini denetler (varsayılan olarak `30000`).
- `channels.discord.voice.reconnectGraceMs`, bağlantısı kesilmiş bir ses oturumunun OpenClaw onu yok etmeden önce yeniden bağlanma sinyaline girmesinin ne kadar sürebileceğini denetler (varsayılan olarak `15000`).
- Discord ses oynatımı, başka bir kullanıcının konuşmaya başlama olayıyla kesintiye uğratılmaz. Geri besleme döngülerinden kaçınmak için OpenClaw, TTS oynatılırken yeni ses yakalamayı yok sayar.
- OpenClaw ayrıca yinelenen şifre çözme hatalarından sonra bir ses oturumundan ayrılıp yeniden katılarak ses alma kurtarması denemesi yapar.
- `channels.discord.streaming`, kanonik akış modu anahtarıdır. Discord varsayılan olarak `streaming.mode: "progress"` kullanır; böylece araç/iş ilerlemesi düzenlenen tek bir önizleme mesajında görünür; devre dışı bırakmak için `streaming.mode: "off"` ayarlayın. Eski `streamMode` ve boolean `streaming` değerleri çalışma zamanı takma adları olarak kalır; kalıcı yapılandırmayı yeniden yazmak için `openclaw doctor --fix` çalıştırın.
- `channels.discord.autoPresence`, çalışma zamanı kullanılabilirliğini bot varlığına eşler (healthy => online, degraded => idle, exhausted => dnd) ve isteğe bağlı durum metni geçersiz kılmalarına izin verir.
- `channels.discord.dangerouslyAllowNameMatching`, değişebilir ad/etiket eşleştirmesini yeniden etkinleştirir (acil durum uyumluluk modu).
- `channels.discord.execApprovals`: Discord yerel exec onayı teslimatı ve onaylayan yetkilendirmesi.
  - `enabled`: `true`, `false` veya `"auto"` (varsayılan). Otomatik modda exec onayları, onaylayanlar `approvers` veya `commands.ownerAllowFrom` üzerinden çözümlenebildiğinde etkinleşir.
  - `approvers`: exec isteklerini onaylamasına izin verilen Discord kullanıcı kimlikleri. Atlandığında `commands.ownerAllowFrom` değerine geri döner.
  - `agentFilter`: isteğe bağlı ajan kimliği izin listesi. Tüm ajanlar için onayları iletmek üzere atlayın.
  - `sessionFilter`: isteğe bağlı oturum anahtarı desenleri (alt dize veya regex).
  - `target`: onay istemlerinin nereye gönderileceği. `"dm"` (varsayılan) onaylayan DM'lerine gönderir, `"channel"` kaynak kanala gönderir, `"both"` ikisine de gönderir. Hedef `"channel"` içerdiğinde düğmeler yalnızca çözümlenmiş onaylayanlar tarafından kullanılabilir.
  - `cleanupAfterResolve`: `true` olduğunda onay, ret veya zaman aşımından sonra onay DM'lerini siler.

**Tepki bildirim modları:** `off` (yok), `own` (botun mesajları, varsayılan), `all` (tüm mesajlar), `allowlist` (tüm mesajlarda `guilds.<id>.users` içinden).

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
- `channels.googlechat.dangerouslyAllowNameMatching`, değişebilir e-posta principal eşleştirmesini yeniden etkinleştirir (acil durum uyumluluk modu).

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

- **Socket modu** hem `botToken` hem de `appToken` gerektirir (varsayılan hesap ortam yedeği için `SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN`).
- **HTTP modu**, `botToken` ile birlikte `signingSecret` gerektirir (kök düzeyde veya hesap başına).
- `socketMode`, Slack SDK Socket Mode taşıma ayarlarını genel Bolt receiver API'ye aktarır. Bunu yalnızca ping/pong zaman aşımı veya bayat websocket davranışını araştırırken kullanın.
- `botToken`, `appToken`, `signingSecret` ve `userToken`, düz metin
  dizelerini veya SecretRef nesnelerini kabul eder.
- Slack hesap anlık görüntüleri, her kimlik bilgisi için
  `botTokenSource`, `botTokenStatus`, `appTokenStatus` ve HTTP modunda
  `signingSecretStatus` gibi kaynak/durum alanlarını açığa çıkarır. `configured_unavailable`, hesabın
  SecretRef üzerinden yapılandırıldığı ancak geçerli komut/çalışma zamanı yolunun
  gizli değeri çözemediği anlamına gelir.
- `configWrites: false`, Slack tarafından başlatılan yapılandırma yazmalarını engeller.
- İsteğe bağlı `channels.slack.defaultAccount`, yapılandırılmış bir hesap kimliğiyle eşleştiğinde varsayılan hesap seçimini geçersiz kılar.
- `channels.slack.streaming.mode`, kanonik Slack akış modu anahtarıdır. `channels.slack.streaming.nativeTransport`, Slack'in yerel akış taşımasını denetler. Eski `streamMode`, boolean `streaming` ve `nativeStreaming` değerleri çalışma zamanı takma adları olarak kalır; kalıcı yapılandırmayı yeniden yazmak için `openclaw doctor --fix` çalıştırın.
- Teslimat hedefleri için `user:<id>` (DM) veya `channel:<id>` kullanın.

**Tepki bildirim modları:** `off`, `own` (varsayılan), `all`, `allowlist` (`reactionAllowlist` içinden).

**İş parçacığı oturumu yalıtımı:** `thread.historyScope`, iş parçacığı başına (varsayılan) veya kanal genelinde paylaşımlıdır. `thread.inheritParent`, üst kanal transkriptini yeni iş parçacıklarına kopyalar.

- Slack yerel akışı ile Slack asistan tarzı "is typing..." iş parçacığı durumu bir yanıt iş parçacığı hedefi gerektirir. Üst düzey DM'ler varsayılan olarak iş parçacığı dışında kalır; bu nedenle iş parçacığı tarzı yerel akış/durum önizlemesini göstermek yerine Slack taslak gönder-ve-düzenle önizlemeleri üzerinden akış yapmaya devam edebilirler.
- `typingReaction`, bir yanıt çalışırken gelen Slack mesajına geçici bir tepki ekler, ardından tamamlandığında kaldırır. `"hourglass_flowing_sand"` gibi bir Slack emoji kısa kodu kullanın.
- `channels.slack.execApprovals`: Slack yerel exec onayı teslimatı ve onaylayan yetkilendirmesi. Discord ile aynı şema: `enabled` (`true`/`false`/`"auto"`), `approvers` (Slack kullanıcı kimlikleri), `agentFilter`, `sessionFilter` ve `target` (`"dm"`, `"channel"` veya `"both"`).

| Eylem grubu | Varsayılan | Notlar                      |
| ------------ | ------- | ---------------------- |
| reactions    | etkin | Tepki ekle + tepkileri listele |
| messages     | etkin | Oku/gönder/düzenle/sil  |
| pins         | etkin | Sabitle/sabitlemeyi kaldır/listele         |
| memberInfo   | etkin | Üye bilgisi            |
| emojiList    | etkin | Özel emoji listesi      |

### Mattermost

Mattermost, geçerli OpenClaw sürümlerinde birlikte gelen bir Plugin olarak sunulur. Daha eski veya
özel derlemeler geçerli bir npm paketini
`openclaw plugins install @openclaw/mattermost` ile kurabilir. Bir sürüm sabitlemeden önce geçerli dist-tag'ler için
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

Sohbet modları: `oncall` (@bahsetme olduğunda yanıt ver, varsayılan), `onmessage` (her mesaj), `onchar` (tetikleyici önekle başlayan mesajlar).

Mattermost yerel komutları etkinleştirildiğinde:

- `commands.callbackPath` tam URL değil, bir yol olmalıdır (örneğin `/api/channels/mattermost/command`).
- `commands.callbackUrl`, OpenClaw Gateway uç noktasına çözümlenmeli ve Mattermost sunucusundan erişilebilir olmalıdır.
- Yerel eğik çizgi geri çağrıları, eğik çizgi komutu kaydı sırasında Mattermost tarafından döndürülen komut başına token’larla kimlik doğrulaması yapar. Kayıt başarısız olursa veya hiçbir komut etkinleştirilmezse OpenClaw geri çağrıları `Unauthorized: invalid command token.` ile reddeder.
- Özel/tailnet/dahili geri çağrı konakları için Mattermost, `ServiceSettings.AllowedUntrustedInternalConnections` değerinin geri çağrı konağını/alan adını içermesini gerektirebilir. Tam URL’ler değil, konak/alan adı değerleri kullanın.
- `channels.mattermost.configWrites`: Mattermost tarafından başlatılan yapılandırma yazmalarına izin ver veya bunları reddet.
- `channels.mattermost.requireMention`: kanallarda yanıt vermeden önce `@mention` gerektir.
- `channels.mattermost.groups.<channelId>.requireMention`: kanal başına bahsetme geçidi geçersiz kılma (`"*"` varsayılan için).
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

**Tepki bildirimi modları:** `off`, `own` (varsayılan), `all`, `allowlist` (`reactionAllowlist` üzerinden).

- `channels.signal.account`: kanal başlangıcını belirli bir Signal hesap kimliğine sabitle.
- `channels.signal.configWrites`: Signal tarafından başlatılan yapılandırma yazmalarına izin ver veya bunları reddet.
- İsteğe bağlı `channels.signal.defaultAccount`, yapılandırılmış bir hesap kimliğiyle eşleştiğinde varsayılan hesap seçimini geçersiz kılar.

### BlueBubbles

BlueBubbles, eski iMessage köprüsüdür (Plugin destekli, `channels.bluebubbles` altında yapılandırılır). Mevcut kurulumlar desteklenmeye devam eder, ancak yeni OpenClaw iMessage dağıtımları, `imsg` Mesajlar konağında çalışabiliyorsa `channels.imessage` seçeneğini tercih etmelidir.

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
- `type: "acp"` içeren üst düzey `bindings[]` girdileri, BlueBubbles konuşmalarını kalıcı ACP oturumlarına bağlayabilir. `match.peer.id` içinde bir BlueBubbles tanıtıcısı veya hedef dizesi (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) kullanın. Paylaşılan alan semantiği: [ACP Agents](/tr/tools/acp-agents#persistent-channel-bindings).
- Tam BlueBubbles kanal yapılandırması ve kullanımdan kaldırma gerekçesi [BlueBubbles](/tr/channels/bluebubbles) içinde belgelenmiştir.

### iMessage

OpenClaw, `imsg rpc` çalıştırır (stdio üzerinden JSON-RPC). Daemon veya bağlantı noktası gerekmez. Bu, konak Mesajlar veritabanı ve Otomasyon izinlerini verebildiğinde yeni OpenClaw iMessage kurulumları için tercih edilen yoldur.

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

- Mesajlar DB’sine Tam Disk Erişimi gerektirir.
- `chat_id:<id>` hedeflerini tercih edin. Sohbetleri listelemek için `imsg chats --limit 20` kullanın.
- `cliPath` bir SSH sarmalayıcısına işaret edebilir; SCP ek getirme için `remoteHost` (`host` veya `user@host`) ayarlayın.
- `attachmentRoots` ve `remoteAttachmentRoots`, gelen ek yollarını sınırlar (varsayılan: `/Users/*/Library/Messages/Attachments`).
- SCP sıkı konak anahtarı denetimi kullanır, bu nedenle aktarma konağı anahtarının `~/.ssh/known_hosts` içinde zaten bulunduğundan emin olun.
- `channels.imessage.configWrites`: iMessage tarafından başlatılan yapılandırma yazmalarına izin ver veya bunları reddet.
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
- `channels.matrix.network.dangerouslyAllowPrivateNetwork`, özel/dahili homeserver’lara izin verir. `proxy` ve bu ağ katılım tercihi bağımsız denetimlerdir.
- `channels.matrix.defaultAccount`, çok hesaplı kurulumlarda tercih edilen hesabı seçer.
- `channels.matrix.autoJoin` varsayılan olarak `off` değerindedir; bu nedenle davet edilen odalar ve yeni DM tarzı davetler, `autoJoinAllowlist` ile `autoJoin: "allowlist"` ya da `autoJoin: "always"` ayarlanana kadar yok sayılır.
- `channels.matrix.execApprovals`: Matrix’e özgü exec onayı teslimi ve onaylayıcı yetkilendirmesi.
  - `enabled`: `true`, `false` veya `"auto"` (varsayılan). Otomatik modda exec onayları, onaylayıcılar `approvers` veya `commands.ownerAllowFrom` üzerinden çözümlenebildiğinde etkinleşir.
  - `approvers`: exec isteklerini onaylamasına izin verilen Matrix kullanıcı kimlikleri (örn. `@owner:example.org`).
  - `agentFilter`: isteğe bağlı agent kimliği izin listesi. Tüm agent’lar için onayları iletmek üzere atlayın.
  - `sessionFilter`: isteğe bağlı oturum anahtarı desenleri (alt dize veya regex).
  - `target`: onay istemlerinin nereye gönderileceği. `"dm"` (varsayılan), `"channel"` (kaynak oda) veya `"both"`.
  - Hesap başına geçersiz kılmalar: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope`, Matrix DM’lerinin oturumlar halinde nasıl gruplandığını denetler: `per-user` (varsayılan) yönlendirilen eşe göre paylaşırken, `per-room` her DM odasını yalıtır.
- Matrix durum sondaları ve canlı dizin aramaları, çalışma zamanı trafiğiyle aynı proxy politikasını kullanır.
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
- Tam Teams yapılandırması (kimlik bilgileri, webhook, DM/grup politikası, ekip/kanal başına geçersiz kılmalar) [Microsoft Teams](/tr/channels/msteams) içinde belgelenmiştir.

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
- Tam IRC kanal yapılandırması (host/port/TLS/kanallar/izin listeleri/bahsetme denetimi) [IRC](/tr/channels/irc) içinde belgelenmiştir.

### Çok hesaplı (tüm kanallar)

Kanal başına birden çok hesabı çalıştırın (her birinin kendi `accountId` değeriyle):

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
- Env token’ları yalnızca **varsayılan** hesaba uygulanır.
- Temel kanal ayarları, hesap başına geçersiz kılınmadığı sürece tüm hesaplara uygulanır.
- Her hesabı farklı bir agent’a yönlendirmek için `bindings[].match.accountId` kullanın.
- Tek hesaplı üst düzey kanal yapılandırmasındayken `openclaw channels add` (veya kanal onboarding’i) üzerinden varsayılan olmayan bir hesap eklerseniz, OpenClaw önce hesap kapsamlı üst düzey tek hesap değerlerini kanal hesabı haritasına yükseltir; böylece özgün hesap çalışmaya devam eder. Çoğu kanal bunları `channels.<channel>.accounts.default` içine taşır; Matrix bunun yerine mevcut eşleşen adlandırılmış/varsayılan hedefi koruyabilir.
- Mevcut yalnızca kanal bağlamaları (`accountId` yok) varsayılan hesapla eşleşmeye devam eder; hesap kapsamlı bağlamalar isteğe bağlı kalır.
- `openclaw doctor --fix`, hesap kapsamlı üst düzey tek hesap değerlerini o kanal için seçilen yükseltilmiş hesaba taşıyarak karışık şekilleri de onarır. Çoğu kanal `accounts.default` kullanır; Matrix bunun yerine mevcut eşleşen adlandırılmış/varsayılan hedefi koruyabilir.

### Diğer Plugin kanalları

Birçok Plugin kanalı `channels.<id>` olarak yapılandırılır ve kendilerine ayrılmış kanal sayfalarında belgelenir (örneğin Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat ve Twitch).
Tam kanal dizinine bakın: [Kanallar](/tr/channels).

### Grup sohbeti bahsetme denetimi

Grup iletileri varsayılan olarak **bahsetme gerektirir** (metadata bahsetmesi veya güvenli regex desenleri). WhatsApp, Telegram, Discord, Google Chat ve iMessage grup sohbetleri için geçerlidir.

Görünür yanıtlar ayrı olarak denetlenir. Grup/kanal odaları varsayılan olarak `messages.groupChat.visibleReplies: "message_tool"` kullanır: OpenClaw yine de turu işler, ancak normal final yanıtları özel kalır ve görünür oda çıktısı için `message(action=send)` gerekir. Normal yanıtların odaya geri gönderildiği eski davranışı istediğinizde yalnızca `"automatic"` olarak ayarlayın. Aynı yalnızca araçla görünür-yanıt davranışını doğrudan sohbetlere de uygulamak için `messages.visibleReplies: "message_tool"` olarak ayarlayın; Codex harness da bu yalnızca araç davranışını ayarlanmamış doğrudan sohbet varsayılanı olarak kullanır.

Yalnızca araçla görünür yanıtlar, araçları güvenilir biçimde çağıran bir model/runtime gerektirir. Oturum günlüğü `didSendViaMessagingTool: false` ile asistan metni gösteriyorsa, model mesaj aracını çağırmak yerine özel bir final yanıtı üretmiştir. O kanal için daha güçlü bir araç çağırma modeline geçin veya eski görünür final yanıtlarını geri getirmek için `messages.groupChat.visibleReplies: "automatic"` olarak ayarlayın.

Mesaj aracı etkin araç ilkesi altında kullanılamıyorsa, OpenClaw yanıtı sessizce bastırmak yerine otomatik görünür yanıtlara geri döner. `openclaw doctor` bu uyumsuzluk konusunda uyarır.

Gateway, dosya kaydedildikten sonra `messages` yapılandırmasını hot-reload ile yeniden yükler. Yalnızca dağıtımda dosya izleme veya yapılandırma yeniden yükleme devre dışıysa yeniden başlatın.

**Bahsetme türleri:**

- **Metadata bahsetmeleri**: Yerel platform @-bahsetmeleri. WhatsApp kendiyle sohbet modunda yok sayılır.
- **Metin desenleri**: `agents.list[].groupChat.mentionPatterns` içinde güvenli regex desenleri. Geçersiz desenler ve güvenli olmayan iç içe yinelemeler yok sayılır.
- Bahsetme kapısı yalnızca algılama mümkün olduğunda uygulanır (yerel bahsetmeler veya en az bir desen).

```json5
{
  messages: {
    visibleReplies: "automatic", // direct/source sohbetler için küresel varsayılan; Codex harness, ayarlanmamış doğrudan sohbetleri varsayılan olarak message_tool yapar
    groupChat: {
      historyLimit: 50,
      visibleReplies: "message_tool", // varsayılan; eski final yanıtları için "automatic" kullanın
    },
  },
  agents: {
    list: [{ id: "main", groupChat: { mentionPatterns: ["@openclaw", "openclaw"] } }],
  },
}
```

`messages.groupChat.historyLimit` küresel varsayılanı ayarlar. Kanallar `channels.<channel>.historyLimit` (veya hesap başına) ile geçersiz kılabilir. Devre dışı bırakmak için `0` olarak ayarlayın.

`messages.visibleReplies` küresel source-turn varsayılanıdır; `messages.groupChat.visibleReplies` grup/kanal source turn'leri için bunu geçersiz kılar. `messages.visibleReplies` ayarlanmamışsa, bir harness kendi direct/source varsayılanını sağlayabilir; Codex harness varsayılan olarak `message_tool` kullanır. Kanal izin listeleri ve bahsetme kapısı yine de bir turun işlenip işlenmeyeceğine karar verir.

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

Çözümleme: DM başına geçersiz kılma → sağlayıcı varsayılanı → sınır yok (tümü saklanır).

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
    native: "auto", // desteklendiğinde yerel komutları kaydet
    nativeSkills: "auto", // desteklendiğinde yerel skill komutlarını kaydet
    text: true, // sohbet mesajlarında /commands ayrıştır
    bash: false, // ! kullanımına izin ver (takma ad: /bash)
    bashForegroundMs: 2000,
    config: false, // /config kullanımına izin ver
    mcp: false, // /mcp kullanımına izin ver
    plugins: false, // /plugins kullanımına izin ver
    debug: false, // /debug kullanımına izin ver
    restart: true, // /restart + gateway restart aracına izin ver
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
- Bu sayfa tam komut kataloğu değil, bir **config-key referansıdır**. QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, cihaz eşleme `/pair`, bellek `/dreaming`, telefon denetimi `/phone` ve Talk `/voice` gibi kanal/Plugin sahipli komutlar kendi kanal/Plugin sayfalarında ve ayrıca [Slash Commands](/tr/tools/slash-commands) içinde belgelenmiştir.
- Metin komutları başında `/` bulunan **bağımsız** mesajlar olmalıdır.
- `native: "auto"` Discord/Telegram için yerel komutları açar, Slack kapalı kalır.
- `nativeSkills: "auto"` Discord/Telegram için yerel skill komutlarını açar, Slack kapalı kalır.
- Kanal başına geçersiz kılma: `channels.discord.commands.native` (bool veya `"auto"`). Discord için `false`, başlangıç sırasında yerel komut kaydını ve temizliği atlar.
- Yerel skill kaydını kanal başına `channels.<provider>.commands.nativeSkills` ile geçersiz kılın.
- `channels.telegram.customCommands` ek Telegram bot menüsü girdileri ekler.
- `bash: true`, host shell için `! <cmd>` etkinleştirir. `tools.elevated.enabled` ve gönderenin `tools.elevated.allowFrom.<channel>` içinde olmasını gerektirir.
- `config: true`, `/config` etkinleştirir (`openclaw.json` okur/yazar). Gateway `chat.send` istemcileri için kalıcı `/config set|unset` yazmaları ayrıca `operator.admin` gerektirir; salt okunur `/config show`, normal yazma kapsamlı operator istemcileri için kullanılabilir kalır.
- `mcp: true`, `mcp.servers` altında OpenClaw tarafından yönetilen MCP sunucu yapılandırması için `/mcp` etkinleştirir.
- `plugins: true`, Plugin keşfi, kurulum ve etkinleştirme/devre dışı bırakma denetimleri için `/plugins` etkinleştirir.
- `channels.<provider>.configWrites`, kanal başına yapılandırma değişikliklerini kapılar (varsayılan: true).
- Çok hesaplı kanallar için `channels.<provider>.accounts.<id>.configWrites`, o hesabı hedefleyen yazmaları da kapılar (örneğin `/allowlist --config --account <id>` veya `/config set channels.<provider>.accounts.<id>...`).
- `restart: false`, `/restart` ve Gateway yeniden başlatma aracı eylemlerini devre dışı bırakır. Varsayılan: `true`.
- `ownerAllowFrom`, yalnızca sahibin kullanabildiği komutlar/araçlar için açık sahip izin listesidir. `allowFrom` öğesinden ayrıdır.
- `ownerDisplay: "hash"`, sistem isteminde sahip kimliklerini hash'ler. Hashlemeyi denetlemek için `ownerDisplaySecret` ayarlayın.
- `allowFrom`, sağlayıcı başınadır. Ayarlandığında **tek** yetkilendirme kaynağıdır (kanal izin listeleri/eşleme ve `useAccessGroups` yok sayılır).
- `useAccessGroups: false`, `allowFrom` ayarlanmamışken komutların erişim grubu ilkelerini atlamasına izin verir.
- Komut dokümanları haritası:
  - yerleşik + paketlenmiş katalog: [Slash Commands](/tr/tools/slash-commands)
  - kanala özgü komut yüzeyleri: [Kanallar](/tr/channels)
  - QQ Bot komutları: [QQ Bot](/tr/channels/qqbot)
  - eşleme komutları: [Eşleme](/tr/channels/pairing)
  - LINE kart komutu: [LINE](/tr/channels/line)
  - bellek dreaming: [Dreaming](/tr/concepts/dreaming)

</Accordion>

---

## İlgili

- [Yapılandırma referansı](/tr/gateway/configuration-reference) — üst düzey anahtarlar
- [Yapılandırma — agents](/tr/gateway/config-agents)
- [Kanallara genel bakış](/tr/channels)
