---
read_when:
    - Kanal Plugin yapılandırması (kimlik doğrulama, erişim denetimi, çoklu hesap)
    - Kanal başına yapılandırma anahtarlarında sorun giderme
    - DM ilkesini, grup ilkesini veya etiketleme kısıtlamasını denetleme
summary: 'Kanal yapılandırması: Slack, Discord, Telegram, WhatsApp, Matrix, iMessage ve daha fazlası genelinde erişim denetimi, eşleştirme ve kanal başına anahtarlar'
title: Yapılandırma — kanallar
x-i18n:
    generated_at: "2026-05-03T08:55:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5ec4aad94a844f6e2f936b2e0d208343ea264c9a4c74f7fc610c516e0353b53b
    source_path: gateway/config-channels.md
    workflow: 16
---

Kanal başına yapılandırma anahtarları `channels.*` altında yer alır. Slack, Discord,
Telegram, WhatsApp, Matrix, iMessage ve diğer paketlenmiş kanal plugin'leri için DM ve grup erişimini,
çoklu hesap kurulumlarını, bahsetme koşulunu ve kanal başına anahtarları kapsar.

Aracılar, araçlar, gateway çalışma zamanı ve diğer üst düzey anahtarlar için bkz.
[Yapılandırma referansı](/tr/gateway/configuration-reference).

## Kanallar

Her kanal, yapılandırma bölümü mevcut olduğunda otomatik olarak başlar (`enabled: false` olmadığı sürece).

### DM ve grup erişimi

Tüm kanallar DM ilkelerini ve grup ilkelerini destekler:

| DM ilkesi           | Davranış                                                        |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (varsayılan) | Bilinmeyen gönderenler tek kullanımlık eşleştirme kodu alır; sahibin onaylaması gerekir |
| `allowlist`         | Yalnızca `allowFrom` içindeki gönderenler (veya eşleştirilmiş izin deposu) |
| `open`              | Tüm gelen DM'lere izin ver (`allowFrom: ["*"]` gerektirir)             |
| `disabled`          | Tüm gelen DM'leri yok say                                          |

| Grup ilkesi          | Davranış                                               |
| --------------------- | ------------------------------------------------------ |
| `allowlist` (varsayılan) | Yalnızca yapılandırılmış izin listesiyle eşleşen gruplar          |
| `open`                | Grup izin listelerini atla (bahsetme koşulu yine de uygulanır) |
| `disabled`            | Tüm grup/oda mesajlarını engelle                          |

<Note>
`channels.defaults.groupPolicy`, bir sağlayıcının `groupPolicy` değeri ayarlanmadığında varsayılanı belirler.
Eşleştirme kodları 1 saat sonra sona erer. Bekleyen DM eşleştirme istekleri **kanal başına 3** ile sınırlıdır.
Bir sağlayıcı bloğu tamamen eksikse (`channels.<provider>` yoksa), çalışma zamanı grup ilkesi başlangıç uyarısıyla `allowlist` değerine (kapalı hata) geri döner.
</Note>

### Kanal model geçersiz kılmaları

Belirli kanal kimliklerini bir modele sabitlemek için `channels.modelByChannel` kullanın. Değerler `provider/model` veya yapılandırılmış model takma adlarını kabul eder. Kanal eşlemesi, bir oturumda zaten model geçersiz kılması yoksa uygulanır (örneğin, `/model` ile ayarlanmışsa uygulanmaz).

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
- `channels.defaults.contextVisibility`: tüm kanallar için varsayılan ek bağlam görünürlüğü modu. Değerler: `all` (varsayılan, alıntılanan/konu/geçmiş bağlamının tamamını dahil eder), `allowlist` (yalnızca izin listesindeki gönderenlerden gelen bağlamı dahil eder), `allowlist_quote` (izin listesiyle aynı, ancak açık alıntı/yanıt bağlamını korur). Kanal başına geçersiz kılma: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: Heartbeat çıktısına sağlıklı kanal durumlarını dahil et.
- `channels.defaults.heartbeat.showAlerts`: Heartbeat çıktısına bozulmuş/hatalı durumları dahil et.
- `channels.defaults.heartbeat.useIndicator`: kompakt gösterge stili Heartbeat çıktısı oluştur.

### WhatsApp

WhatsApp, gateway'in web kanalı (Baileys Web) üzerinden çalışır. Bağlı bir oturum mevcut olduğunda otomatik olarak başlar.

```json5
{
  web: {
    whatsapp: {
      keepAliveIntervalMs: 25000,
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000,
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
  web: {
    enabled: true,
    heartbeatSeconds: 60,
    reconnect: {
      initialMs: 2000,
      maxMs: 120000,
      factor: 1.4,
      jitter: 0.2,
      maxAttempts: 0,
    },
  },
}
```

<Accordion title="Çoklu hesap WhatsApp">

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

- Giden komutlar, varsa varsayılan olarak `default` hesabını kullanır; yoksa ilk yapılandırılmış hesap kimliğini (sıralı) kullanır.
- İsteğe bağlı `channels.whatsapp.defaultAccount`, yapılandırılmış bir hesap kimliğiyle eşleştiğinde bu geri dönüş varsayılan hesap seçimini geçersiz kılar.
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

- Bot belirteci: `channels.telegram.botToken` veya `channels.telegram.tokenFile` (yalnızca normal dosya; sembolik bağlantılar reddedilir), varsayılan hesap için geri dönüş olarak `TELEGRAM_BOT_TOKEN`.
- `apiRoot` yalnızca Telegram Bot API köküdür. `https://api.telegram.org/bot<TOKEN>` değil, `https://api.telegram.org` veya kendi barındırdığınız/proxy kökünüzü kullanın; `openclaw doctor --fix`, yanlışlıkla eklenmiş sondaki `/bot<TOKEN>` sonekini kaldırır.
- İsteğe bağlı `channels.telegram.defaultAccount`, yapılandırılmış bir hesap kimliğiyle eşleştiğinde varsayılan hesap seçimini geçersiz kılar.
- Çoklu hesap kurulumlarında (2+ hesap kimliği), geri dönüş yönlendirmesinden kaçınmak için açık bir varsayılan (`channels.telegram.defaultAccount` veya `channels.telegram.accounts.default`) ayarlayın; bu eksik veya geçersiz olduğunda `openclaw doctor` uyarır.
- `configWrites: false`, Telegram tarafından başlatılan yapılandırma yazmalarını (süper grup kimliği geçişleri, `/config set|unset`) engeller.
- `type: "acp"` değerine sahip üst düzey `bindings[]` girdileri, forum konuları için kalıcı ACP bağlamalarını yapılandırır (`match.peer.id` içinde kanonik `chatId:topic:topicId` kullanın). Alan semantiği [ACP Aracıları](/tr/tools/acp-agents#persistent-channel-bindings) içinde paylaşılır.
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
      streaming: "off", // off | partial | block | progress (progress maps to partial on Discord)
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

- Belirteç: `channels.discord.token`; varsayılan hesap için geri dönüş olarak `DISCORD_BOT_TOKEN` kullanılır.
- Açık bir Discord `token` sağlayan doğrudan giden çağrılar, çağrı için bu belirteci kullanır; hesap yeniden deneme/ilke ayarları yine de etkin çalışma zamanı anlık görüntüsündeki seçili hesaptan gelir.
- İsteğe bağlı `channels.discord.defaultAccount`, yapılandırılmış bir hesap kimliğiyle eşleştiğinde varsayılan hesap seçimini geçersiz kılar.
- Teslim hedefleri için `user:<id>` (doğrudan mesaj) veya `channel:<id>` (sunucu kanalı) kullanın; yalın sayısal kimlikler reddedilir.
- Sunucu slug'ları küçük harflidir ve boşluklar `-` ile değiştirilir; kanal anahtarları slug biçimine getirilmiş adı kullanır (`#` yok). Sunucu kimliklerini tercih edin.
- Bot tarafından yazılan iletiler varsayılan olarak yok sayılır. `allowBots: true` bunları etkinleştirir; yalnızca bottan bahseden bot iletilerini kabul etmek için `allowBots: "mentions"` kullanın (kendi iletileri yine filtrelenir).
- `channels.discord.guilds.<id>.ignoreOtherMentions` (ve kanal geçersiz kılmaları), başka bir kullanıcıdan veya rolden bahseden ama bottan bahsetmeyen iletileri düşürür (@everyone/@here hariç).
- `channels.discord.mentionAliases`, gönderimden önce kararlı giden `@handle` metnini Discord kullanıcı kimlikleriyle eşler; böylece geçici dizin önbelleği boş olsa bile bilinen takım arkadaşlarından deterministik olarak bahsedilebilir. Hesap başına geçersiz kılmalar `channels.discord.accounts.<accountId>.mentionAliases` altında bulunur.
- `maxLinesPerMessage` (varsayılan 17), 2000 karakterin altında olsa bile uzun iletileri böler.
- `channels.discord.threadBindings`, Discord iş parçacığına bağlı yönlendirmeyi denetler:
  - `enabled`: iş parçacığına bağlı oturum özellikleri için Discord geçersiz kılması (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` ve bağlı teslim/yönlendirme)
  - `idleHours`: saat cinsinden etkin olmama durumunda otomatik odaktan çıkarma için Discord geçersiz kılması (`0` devre dışı bırakır)
  - `maxAgeHours`: saat cinsinden katı azami yaş için Discord geçersiz kılması (`0` devre dışı bırakır)
  - `spawnSessions`: `sessions_spawn({ thread: true })` ve ACP iş parçacığı oluşturma otomatik iş parçacığı oluşturma/bağlama için anahtar (varsayılan: `true`)
  - `defaultSpawnContext`: iş parçacığına bağlı oluşturulanlar için yerel alt ajan bağlamı (varsayılan olarak `"fork"`)
- `type: "acp"` içeren üst düzey `bindings[]` girdileri, kanallar ve iş parçacıkları için kalıcı ACP bağlamalarını yapılandırır (`match.peer.id` içinde kanal/iş parçacığı kimliği kullanın). Alan semantiği [ACP Ajanları](/tr/tools/acp-agents#persistent-channel-bindings) içinde paylaşılır.
- `channels.discord.ui.components.accentColor`, Discord bileşenleri v2 kapsayıcıları için vurgu rengini ayarlar.
- `channels.discord.voice`, Discord ses kanalı konuşmalarını ve isteğe bağlı otomatik katılma + LLM + TTS geçersiz kılmalarını etkinleştirir. Yalnızca metin Discord yapılandırmaları sesi varsayılan olarak kapalı bırakır; etkinleştirmek için `channels.discord.voice.enabled=true` ayarlayın.
- `channels.discord.voice.model`, isteğe bağlı olarak Discord ses kanalı yanıtları için kullanılan LLM modelini geçersiz kılar.
- `channels.discord.voice.daveEncryption` ve `channels.discord.voice.decryptionFailureTolerance`, `@discordjs/voice` DAVE seçeneklerine aktarılır (varsayılan olarak `true` ve `24`).
- `channels.discord.voice.connectTimeoutMs`, `/vc join` ve otomatik katılma denemeleri için ilk `@discordjs/voice` Ready beklemesini denetler (varsayılan olarak `30000`).
- `channels.discord.voice.reconnectGraceMs`, bağlantısı kesilmiş bir ses oturumunun OpenClaw tarafından yok edilmeden önce yeniden bağlanma sinyallemesine girmesi için ne kadar süresi olabileceğini denetler (varsayılan olarak `15000`).
- OpenClaw ayrıca yinelenen şifre çözme hatalarından sonra bir ses oturumundan ayrılıp yeniden katılarak ses alma kurtarması dener.
- `channels.discord.streaming`, kanonik akış modu anahtarıdır. Eski `streamMode` ve boole `streaming` değerleri otomatik taşınır.
- `channels.discord.autoPresence`, çalışma zamanı kullanılabilirliğini bot durumuna eşler (sağlıklı => çevrimiçi, bozulmuş => boşta, tükenmiş => dnd) ve isteğe bağlı durum metni geçersiz kılmalarına izin verir.
- `channels.discord.dangerouslyAllowNameMatching`, değişebilir ad/etiket eşleştirmesini yeniden etkinleştirir (acil uyumluluk modu).
- `channels.discord.execApprovals`: Discord yerel yürütme onayı teslimi ve onaylayan yetkilendirmesi.
  - `enabled`: `true`, `false` veya `"auto"` (varsayılan). Otomatik modda, onaylayanlar `approvers` veya `commands.ownerAllowFrom` üzerinden çözümlenebildiğinde yürütme onayları etkinleşir.
  - `approvers`: yürütme isteklerini onaylamasına izin verilen Discord kullanıcı kimlikleri. Atlandığında `commands.ownerAllowFrom` değerine geri döner.
  - `agentFilter`: isteğe bağlı ajan kimliği izin listesi. Tüm ajanlar için onayları iletmek üzere atlayın.
  - `sessionFilter`: isteğe bağlı oturum anahtarı desenleri (alt dize veya regex).
  - `target`: onay istemlerinin nereye gönderileceği. `"dm"` (varsayılan) onaylayanların doğrudan mesajlarına gönderir, `"channel"` kaynak kanala gönderir, `"both"` ikisine de gönderir. Hedef `"channel"` içerdiğinde, düğmeler yalnızca çözümlenmiş onaylayanlar tarafından kullanılabilir.
  - `cleanupAfterResolve`: `true` olduğunda, onay, ret veya zaman aşımı sonrasında onay doğrudan mesajlarını siler.

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
- `channels.googlechat.dangerouslyAllowNameMatching`, değişebilir e-posta sorumlusu eşleştirmesini yeniden etkinleştirir (acil uyumluluk modu).

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

- **Soket modu**, hem `botToken` hem de `appToken` gerektirir (varsayılan hesap ortam geri dönüşü için `SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN`).
- **HTTP modu**, `botToken` ile birlikte `signingSecret` gerektirir (kök düzeyde veya hesap başına).
- `socketMode`, Slack SDK Soket Modu aktarım ayarlarını genel Bolt alıcı API'sine aktarır. Bunu yalnızca ping/pong zaman aşımı veya eski websocket davranışını incelerken kullanın.
- `botToken`, `appToken`, `signingSecret` ve `userToken`, düz metin
  dizelerini veya SecretRef nesnelerini kabul eder.
- Slack hesap anlık görüntüleri, `botTokenSource`, `botTokenStatus`, `appTokenStatus` gibi kimlik bilgisi başına kaynak/durum alanlarını ve HTTP modunda
  `signingSecretStatus` alanını gösterir. `configured_unavailable`, hesabın
  SecretRef üzerinden yapılandırıldığı ancak geçerli komut/çalışma zamanı yolunun
  gizli değeri çözemediği anlamına gelir.
- `configWrites: false`, Slack tarafından başlatılan yapılandırma yazmalarını engeller.
- İsteğe bağlı `channels.slack.defaultAccount`, yapılandırılmış bir hesap kimliğiyle eşleştiğinde varsayılan hesap seçimini geçersiz kılar.
- `channels.slack.streaming.mode`, kanonik Slack akış modu anahtarıdır. `channels.slack.streaming.nativeTransport`, Slack'in yerel akış aktarımını denetler. Eski `streamMode`, boole `streaming` ve `nativeStreaming` değerleri otomatik taşınır.
- Teslim hedefleri için `user:<id>` (doğrudan mesaj) veya `channel:<id>` kullanın.

**Tepki bildirim modları:** `off`, `own` (varsayılan), `all`, `allowlist` (`reactionAllowlist` içinden).

**İş parçacığı oturumu yalıtımı:** `thread.historyScope` iş parçacığı başına (varsayılan) veya kanal genelinde paylaşımlıdır. `thread.inheritParent`, üst kanal dökümünü yeni iş parçacıklarına kopyalar.

- Slack yerel akışı ve Slack asistan tarzı "yazıyor..." iş parçacığı durumu, bir yanıt iş parçacığı hedefi gerektirir. Üst düzey doğrudan mesajlar varsayılan olarak iş parçacığı dışında kalır; bu nedenle iş parçacığı tarzı yerel akış/durum önizlemesini göstermek yerine Slack taslak gönder-ve-düzenle önizlemeleri üzerinden akış yapmaya devam edebilirler.
- `typingReaction`, bir yanıt çalışırken gelen Slack iletisine geçici bir tepki ekler, ardından tamamlandığında kaldırır. `"hourglass_flowing_sand"` gibi bir Slack emoji kısa kodu kullanın.
- `channels.slack.execApprovals`: Slack yerel yürütme onayı teslimi ve onaylayan yetkilendirmesi. Discord ile aynı şema: `enabled` (`true`/`false`/`"auto"`), `approvers` (Slack kullanıcı kimlikleri), `agentFilter`, `sessionFilter` ve `target` (`"dm"`, `"channel"` veya `"both"`).

| Eylem grubu | Varsayılan | Notlar                  |
| ------------ | ------- | ---------------------- |
| reactions    | etkin | Tepki ekle + tepkileri listele |
| messages     | etkin | Oku/gönder/düzenle/sil  |
| pins         | etkin | Sabitle/sabitlemeyi kaldır/listele         |
| memberInfo   | etkin | Üye bilgisi            |
| emojiList    | etkin | Özel emoji listesi      |

### Mattermost

Mattermost, mevcut OpenClaw sürümlerinde paketlenmiş bir Plugin olarak gelir. Daha eski veya
özel derlemeler, geçerli bir npm paketini
`openclaw plugins install @openclaw/mattermost` ile kurabilir. Bir sürümü sabitlemeden önce
geçerli dağıtım etiketleri için
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

Sohbet modları: `oncall` (@bahsetme durumunda yanıt verir, varsayılan), `onmessage` (her ileti), `onchar` (tetikleyici önekle başlayan iletiler).

Mattermost yerel komutları etkinleştirildiğinde:

- `commands.callbackPath` tam URL değil, bir yol olmalıdır (örneğin `/api/channels/mattermost/command`).
- `commands.callbackUrl`, OpenClaw gateway uç noktasına çözümlenmeli ve Mattermost sunucusundan erişilebilir olmalıdır.
- Yerel eğik çizgi geri çağrıları, eğik çizgi komutu kaydı sırasında
  Mattermost tarafından döndürülen komut başına token’larla kimlik doğrulamasından geçirilir. Kayıt başarısız olursa veya hiçbir
  komut etkinleştirilmezse OpenClaw, geri çağrıları
  `Unauthorized: invalid command token.` ile reddeder.
- Özel/tailnet/dahili geri çağrı ana makineleri için Mattermost,
  `ServiceSettings.AllowedUntrustedInternalConnections` ayarının geri çağrı ana makinesini/alanını içermesini gerektirebilir.
  Tam URL’ler değil, ana makine/alan değerleri kullanın.
- `channels.mattermost.configWrites`: Mattermost tarafından başlatılan yapılandırma yazmalarına izin verin veya bunları reddedin.
- `channels.mattermost.requireMention`: kanallarda yanıtlamadan önce `@mention` gerektir.
- `channels.mattermost.groups.<channelId>.requireMention`: kanal başına bahsetme kapısı geçersiz kılması (varsayılan için `"*"`).
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

### BlueBubbles

BlueBubbles, önerilen iMessage yoludur (Plugin destekli, `channels.bluebubbles` altında yapılandırılır).

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
- Tam BlueBubbles kanal yapılandırması [BlueBubbles](/tr/channels/bluebubbles) içinde belgelenmiştir.

### iMessage

OpenClaw, `imsg rpc` işlemini başlatır (stdio üzerinden JSON-RPC). Daemon veya port gerekmez.

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

- Messages veritabanı için Full Disk Access gerektirir.
- `chat_id:<id>` hedeflerini tercih edin. Sohbetleri listelemek için `imsg chats --limit 20` kullanın.
- `cliPath` bir SSH sarmalayıcısına işaret edebilir; SCP ek alma için `remoteHost` (`host` veya `user@host`) ayarlayın.
- `attachmentRoots` ve `remoteAttachmentRoots`, gelen ek yollarını sınırlar (varsayılan: `/Users/*/Library/Messages/Attachments`).
- SCP katı ana makine anahtarı denetimi kullanır, bu nedenle aktarma ana makinesi anahtarının `~/.ssh/known_hosts` içinde zaten bulunduğundan emin olun.
- `channels.imessage.configWrites`: iMessage tarafından başlatılan yapılandırma yazmalarına izin verin veya bunları reddedin.
- `type: "acp"` içeren üst düzey `bindings[]` girdileri, iMessage konuşmalarını kalıcı ACP oturumlarına bağlayabilir. `match.peer.id` içinde normalleştirilmiş bir tanıtıcı veya açık sohbet hedefi (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) kullanın. Paylaşılan alan semantiği: [ACP Aracıları](/tr/tools/acp-agents#persistent-channel-bindings).

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
- `channels.matrix.network.dangerouslyAllowPrivateNetwork`, özel/dahili homeserver’lara izin verir. `proxy` ve bu ağ katılımı bağımsız denetimlerdir.
- `channels.matrix.defaultAccount`, çok hesaplı kurulumlarda tercih edilen hesabı seçer.
- `channels.matrix.autoJoin` varsayılan olarak `off` değerindedir; bu nedenle davet edilen odalar ve yeni DM tarzı davetler, `autoJoinAllowlist` ile `autoJoin: "allowlist"` veya `autoJoin: "always"` ayarlanana kadar yok sayılır.
- `channels.matrix.execApprovals`: Matrix’e özgü exec onayı teslimi ve onaylayan yetkilendirmesi.
  - `enabled`: `true`, `false` veya `"auto"` (varsayılan). Otomatik modda, onaylayanlar `approvers` veya `commands.ownerAllowFrom` içinden çözümlenebildiğinde exec onayları etkinleşir.
  - `approvers`: exec isteklerini onaylamasına izin verilen Matrix kullanıcı kimlikleri (örn. `@owner:example.org`).
  - `agentFilter`: isteğe bağlı aracı kimliği izin listesi. Tüm aracılar için onayları iletmek üzere atlayın.
  - `sessionFilter`: isteğe bağlı oturum anahtarı desenleri (alt dize veya regex).
  - `target`: onay istemlerinin nereye gönderileceği. `"dm"` (varsayılan), `"channel"` (kaynak oda) veya `"both"`.
  - Hesap başına geçersiz kılmalar: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope`, Matrix DM’lerinin oturumlar halinde nasıl gruplanacağını denetler: `per-user` (varsayılan) yönlendirilen eşe göre paylaşır, `per-room` ise her DM odasını yalıtır.
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

- Burada kapsanan çekirdek anahtar yolları: `channels.msteams`, `channels.msteams.configWrites`.
- Tam Teams yapılandırması (kimlik bilgileri, Webhook, DM/grup ilkesi, takım başına/kanal başına geçersiz kılmalar) [Microsoft Teams](/tr/channels/msteams) içinde belgelenmiştir.

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

- Burada kapsanan çekirdek anahtar yolları: `channels.irc`, `channels.irc.dmPolicy`, `channels.irc.configWrites`, `channels.irc.nickserv.*`.
- İsteğe bağlı `channels.irc.defaultAccount`, yapılandırılmış bir hesap kimliğiyle eşleştiğinde varsayılan hesap seçimini geçersiz kılar.
- Tam IRC kanal yapılandırması (ana makine/port/TLS/kanallar/izin listeleri/bahsetme kapısı) [IRC](/tr/channels/irc) içinde belgelenmiştir.

### Çoklu hesap (tüm kanallar)

Kanal başına birden çok hesap çalıştırın (her biri kendi `accountId` değeriyle):

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
- Ortam token’ları yalnızca **varsayılan** hesaba uygulanır.
- Temel kanal ayarları, hesap başına geçersiz kılınmadıkça tüm hesaplara uygulanır.
- Her hesabı farklı bir aracıya yönlendirmek için `bindings[].match.accountId` kullanın.
- Tek hesaplı üst düzey kanal yapılandırmasındayken `openclaw channels add` (veya kanal katılımı) aracılığıyla varsayılan olmayan bir hesap eklerseniz OpenClaw, özgün hesabın çalışmaya devam etmesi için önce hesap kapsamlı üst düzey tek hesap değerlerini kanal hesap eşlemesine yükseltir. Çoğu kanal bunları `channels.<channel>.accounts.default` içine taşır; Matrix ise bunun yerine mevcut eşleşen adlandırılmış/varsayılan hedefi koruyabilir.
- Mevcut yalnızca kanal bağlamaları (`accountId` yok) varsayılan hesapla eşleşmeye devam eder; hesap kapsamlı bağlamalar isteğe bağlı kalır.
- `openclaw doctor --fix` de hesap kapsamlı üst düzey tek hesap değerlerini o kanal için seçilen yükseltilmiş hesaba taşıyarak karışık biçimleri onarır. Çoğu kanal `accounts.default` kullanır; Matrix ise bunun yerine mevcut eşleşen adlandırılmış/varsayılan hedefi koruyabilir.

### Diğer Plugin kanalları

Birçok Plugin kanalı `channels.<id>` olarak yapılandırılır ve kendi ayrılmış kanal sayfalarında belgelenir (örneğin Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat ve Twitch).
Tam kanal dizinine bakın: [Kanallar](/tr/channels).

### Grup sohbeti bahsetme kapısı

Grup iletileri varsayılan olarak **bahsetme gerektirir** (metadata bahsetmeleri veya güvenli regex desenleri). WhatsApp, Telegram, Discord, Google Chat ve iMessage grup sohbetleri için geçerlidir.

Görünür yanıtlar ayrı olarak denetlenir. Grup/kanal odaları varsayılan olarak `messages.groupChat.visibleReplies: "message_tool"` kullanır: OpenClaw yine de dönüşü işler, ancak normal nihai yanıtlar özel kalır ve görünür oda çıktısı `message(action=send)` gerektirir. Normal yanıtların odaya geri gönderildiği eski davranışı istediğinizde yalnızca `"automatic"` ayarlayın. Aynı yalnızca araçla görünür yanıt davranışını doğrudan sohbetlere de uygulamak için `messages.visibleReplies: "message_tool"` ayarlayın; Codex koşumu da ayarlanmamış doğrudan sohbet varsayılanı olarak bu yalnızca araç davranışını kullanır.

İleti aracı etkin araç ilkesi altında kullanılamıyorsa OpenClaw, yanıtı sessizce bastırmak yerine otomatik görünür yanıtlara geri döner. `openclaw doctor` bu uyumsuzluk hakkında uyarır.

Gateway, dosya kaydedildikten sonra `messages` yapılandırmasını sıcak yeniden yükler. Yalnızca dağıtımda dosya izleme veya yapılandırma yeniden yükleme devre dışıysa yeniden başlatın.

**Bahsetme türleri:**

- **Metadata bahsetmeleri**: Yerel platform @-bahsetmeleri. WhatsApp kendi kendine sohbet modunda yok sayılır.
- **Metin desenleri**: `agents.list[].groupChat.mentionPatterns` içindeki güvenli regex desenleri. Geçersiz desenler ve güvenli olmayan iç içe yineleme yok sayılır.
- Bahsetme kapısı yalnızca algılama mümkün olduğunda uygulanır (yerel bahsetmeler veya en az bir desen).

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

`messages.groupChat.historyLimit` genel varsayılanı ayarlar. Kanallar bunu `channels.<channel>.historyLimit` ile (veya hesap bazında) geçersiz kılabilir. Devre dışı bırakmak için `0` olarak ayarlayın.

`messages.visibleReplies` genel kaynak-tur varsayılanıdır; `messages.groupChat.visibleReplies` bunu grup/kanal kaynak turları için geçersiz kılar. `messages.visibleReplies` ayarlanmamışsa, bir harness kendi doğrudan/kaynak varsayılanını sağlayabilir; Codex harness varsayılan olarak `message_tool` kullanır. Kanal izin listeleri ve bahsetme kapıları yine de bir turun işlenip işlenmeyeceğine karar verir.

#### DM geçmişi sınırları

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

Çözümleme: DM bazında geçersiz kılma → sağlayıcı varsayılanı → sınır yok (tümü korunur).

Desteklenenler: `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `msteams`.

#### Kendi kendine sohbet modu

Kendi kendine sohbet modunu etkinleştirmek için kendi numaranızı `allowFrom` içine ekleyin (yerel @-bahsetmeleri yok sayar, yalnızca metin kalıplarına yanıt verir):

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

- Bu blok, komut yüzeylerini yapılandırır. Geçerli yerleşik + paketlenmiş komut kataloğu için bkz. [Eğik Çizgi Komutları](/tr/tools/slash-commands).
- Bu sayfa, tam komut kataloğu değil, bir **yapılandırma anahtarı referansıdır**. QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, cihaz eşleme `/pair`, bellek `/dreaming`, telefon kontrolü `/phone` ve Talk `/voice` gibi kanal/Plugin sahibi komutlar, kendi kanal/Plugin sayfalarında ve [Eğik Çizgi Komutları](/tr/tools/slash-commands) içinde belgelenmiştir.
- Metin komutları, başında `/` bulunan **bağımsız** iletiler olmalıdır.
- `native: "auto"` Discord/Telegram için yerel komutları açar, Slack kapalı kalır.
- `nativeSkills: "auto"` Discord/Telegram için yerel Skills komutlarını açar, Slack kapalı kalır.
- Kanal bazında geçersiz kılın: `channels.discord.commands.native` (boolean veya `"auto"`). `false`, önceden kaydedilmiş komutları temizler.
- Yerel Skills kaydını kanal bazında `channels.<provider>.commands.nativeSkills` ile geçersiz kılın.
- `channels.telegram.customCommands` ek Telegram bot menüsü girdileri ekler.
- `bash: true`, ana makine kabuğu için `! <cmd>` değerini etkinleştirir. `tools.elevated.enabled` ve gönderenin `tools.elevated.allowFrom.<channel>` içinde olmasını gerektirir.
- `config: true`, `/config` değerini etkinleştirir (`openclaw.json` okur/yazar). Gateway `chat.send` istemcileri için kalıcı `/config set|unset` yazmaları ayrıca `operator.admin` gerektirir; salt okunur `/config show`, normal yazma kapsamlı operatör istemcileri için kullanılabilir kalır.
- `mcp: true`, `mcp.servers` altındaki OpenClaw tarafından yönetilen MCP sunucu yapılandırması için `/mcp` değerini etkinleştirir.
- `plugins: true`, Plugin keşfi, yükleme ve etkinleştirme/devre dışı bırakma denetimleri için `/plugins` değerini etkinleştirir.
- `channels.<provider>.configWrites`, kanal bazında yapılandırma değişikliklerini denetler (varsayılan: true).
- Çok hesaplı kanallar için `channels.<provider>.accounts.<id>.configWrites`, o hesabı hedefleyen yazmaları da denetler (örneğin `/allowlist --config --account <id>` veya `/config set channels.<provider>.accounts.<id>...`).
- `restart: false`, `/restart` ve Gateway yeniden başlatma aracı eylemlerini devre dışı bırakır. Varsayılan: `true`.
- `ownerAllowFrom`, yalnızca sahibin kullanabileceği komutlar/araçlar için açık sahip izin listesidir. `allowFrom` değerinden ayrıdır.
- `ownerDisplay: "hash"`, sistem isteminde sahip kimliklerini hash'ler. Hashlemeyi denetlemek için `ownerDisplaySecret` değerini ayarlayın.
- `allowFrom`, sağlayıcı bazındadır. Ayarlandığında **tek** yetkilendirme kaynağıdır (kanal izin listeleri/eşleme ve `useAccessGroups` yok sayılır).
- `useAccessGroups: false`, `allowFrom` ayarlanmadığında komutların erişim grubu ilkelerini atlamasına izin verir.
- Komut belgeleri haritası:
  - yerleşik + paketlenmiş katalog: [Eğik Çizgi Komutları](/tr/tools/slash-commands)
  - kanala özgü komut yüzeyleri: [Kanallar](/tr/channels)
  - QQ Bot komutları: [QQ Bot](/tr/channels/qqbot)
  - eşleme komutları: [Eşleme](/tr/channels/pairing)
  - LINE kart komutu: [LINE](/tr/channels/line)
  - bellek Dreaming: [Dreaming](/tr/concepts/dreaming)

</Accordion>

---

## İlgili

- [Yapılandırma referansı](/tr/gateway/configuration-reference) — üst düzey anahtarlar
- [Yapılandırma — aracılar](/tr/gateway/config-agents)
- [Kanallara genel bakış](/tr/channels)
