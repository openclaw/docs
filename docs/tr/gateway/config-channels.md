---
read_when:
    - Bir kanal Plugin'ini yapılandırma (kimlik doğrulama, erişim denetimi, çoklu hesap)
    - Kanal başına yapılandırma anahtarlarında sorun giderme
    - DM politikasını, grup politikasını veya bahsetme denetimini denetleme
summary: 'Kanal yapılandırması: Slack, Discord, Telegram, WhatsApp, Matrix, iMessage ve daha fazlasında erişim denetimi, eşleştirme, kanal başına anahtarlar'
title: Yapılandırma — kanallar
x-i18n:
    generated_at: "2026-06-28T00:33:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9bdc9c0b3c55f2ad6a7d6874022cdac6abbe8d0219feda3c8c9710c08e4d8fb7
    source_path: gateway/config-channels.md
    workflow: 16
---

`channels.*` altındaki kanal başına yapılandırma anahtarları. DM ve grup erişimini, çok hesaplı kurulumları, bahsetme denetimini ve Slack, Discord, Telegram, WhatsApp, Matrix, iMessage ve diğer paketli kanal Plugin’leri için kanal başına anahtarları kapsar.

Aracılar, araçlar, Gateway çalışma zamanı ve diğer üst düzey anahtarlar için bkz.
[Yapılandırma başvurusu](/tr/gateway/configuration-reference).

## Kanallar

Her kanal, yapılandırma bölümü mevcut olduğunda otomatik olarak başlar (`enabled: false` olmadığı sürece).

### DM ve grup erişimi

Tüm kanallar DM ilkelerini ve grup ilkelerini destekler:

| DM ilkesi           | Davranış                                                        |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (varsayılan) | Bilinmeyen gönderenler tek kullanımlık eşleştirme kodu alır; sahibin onaylaması gerekir |
| `allowlist`         | Yalnızca `allowFrom` içindeki gönderenler (veya eşleştirilmiş izin deposu) |
| `open`              | Tüm gelen DM’lere izin ver (`allowFrom: ["*"]` gerektirir)      |
| `disabled`          | Tüm gelen DM’leri yok say                                      |

| Grup ilkesi          | Davranış                                               |
| --------------------- | ------------------------------------------------------ |
| `allowlist` (varsayılan) | Yalnızca yapılandırılmış izin listesiyle eşleşen gruplar |
| `open`                | Grup izin listelerini atla (bahsetme denetimi yine uygulanır) |
| `disabled`            | Tüm grup/oda mesajlarını engelle                       |

<Note>
`channels.defaults.groupPolicy`, sağlayıcının `groupPolicy` değeri ayarlanmamışsa varsayılanı belirler.
Eşleştirme kodlarının süresi 1 saat sonra dolar. Bekleyen DM eşleştirme istekleri **kanal başına 3** ile sınırlıdır.
Bir sağlayıcı bloğu tamamen eksikse (`channels.<provider>` yoksa), çalışma zamanı grup ilkesi başlangıç uyarısıyla `allowlist` değerine geri döner (kapalı hata davranışı).
</Note>

### Kanal model geçersiz kılmaları

Belirli kanal kimliklerini veya doğrudan mesaj eşlerini bir modele sabitlemek için `channels.modelByChannel` kullanın. Değerler `provider/model` veya yapılandırılmış model takma adlarını kabul eder. Kanal eşlemesi, bir oturumda zaten model geçersiz kılması yoksa uygulanır (örneğin, `/model` ile ayarlanmışsa uygulanmaz).

Grup/iş parçacığı konuşmaları için anahtarlar kanala özgü grup kimlikleri, konu kimlikleri veya kanal adlarıdır. Doğrudan mesaj (DM) konuşmaları için anahtarlar, kanalın gönderen kimliğinden türetilen eş tanımlayıcılarıdır (`nativeDirectUserId`, `origin.from`, `origin.to`, `OriginatingTo`, `From` veya `SenderId`). Tam anahtar biçimi kanala bağlıdır:

| Kanal  | DM anahtar biçimi         | Örnek                                      |
| -------- | ------------------- | -------------------------------------------- |
| Slack    | `user:U...`         | `user:U12345`                                |
| Telegram | ham kullanıcı kimliği | `123456789`                                  |
| Discord  | ham kullanıcı kimliği | `987654321`                                  |
| WhatsApp | telefon numarası veya JID | `15551234567`                                |
| Matrix   | Matrix kullanıcı kimliği | `@user:matrix.org`                           |
| Feishu   | `feishu:ou_...`     | `feishu:ou_a8b6cab7e945387de5f253775d9b4d85` |

```json5
{
  channels: {
    modelByChannel: {
      discord: {
        "123456789012345678": "anthropic/claude-opus-4-6",
      },
      slack: {
        C1234567890: "openai/gpt-5.5",
        "user:U12345": "openai/gpt-5.4-mini",
      },
      telegram: {
        "-1001234567890": "openai/gpt-5.4-mini",
        "-1001234567890:topic:99": "anthropic/claude-sonnet-4-6",
        "123456789": "openai/gpt-4.1",
      },
    },
  },
}
```

DM’ye özgü anahtarlar yalnızca doğrudan mesaj konuşmalarında eşleşir; grup/iş parçacığı yönlendirmesini etkilemez.

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

- `channels.defaults.groupPolicy`: sağlayıcı düzeyindeki `groupPolicy` ayarlanmamışsa yedek grup ilkesi.
- `channels.defaults.contextVisibility`: tüm kanallar için varsayılan ek bağlam görünürlüğü modu. Değerler: `all` (varsayılan, tüm alıntılanan/iş parçacığı/geçmiş bağlamını dahil et), `allowlist` (yalnızca izin listesindeki gönderenlerden gelen bağlamı dahil et), `allowlist_quote` (`allowlist` ile aynı, ancak açık alıntı/yanıt bağlamını korur). Kanal başına geçersiz kılma: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: sağlıklı kanal durumlarını Heartbeat çıktısına dahil et.
- `channels.defaults.heartbeat.showAlerts`: bozulmuş/hata durumlarını Heartbeat çıktısına dahil et.
- `channels.defaults.heartbeat.useIndicator`: kompakt gösterge tarzı Heartbeat çıktısı oluştur.

### WhatsApp

WhatsApp, Gateway’in web kanalı (Baileys Web) üzerinden çalışır. Bağlı bir oturum mevcut olduğunda otomatik olarak başlar.

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

- `type: "acp"` içeren üst düzey `bindings[]` girdileri, WhatsApp DM’leri ve grupları için kalıcı ACP bağlarını yapılandırır. `match.peer.id` içinde E.164 doğrudan numara veya WhatsApp grup JID kullanın. Alan anlamları [ACP Aracıları](/tr/tools/acp-agents#persistent-channel-bindings) içinde ortaktır.

<Accordion title="Multi-account WhatsApp">

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

- Giden komutlar, varsa varsayılan olarak `default` hesabını kullanır; yoksa ilk yapılandırılmış hesap kimliğini (sıralanmış) kullanır.
- İsteğe bağlı `channels.whatsapp.defaultAccount`, yapılandırılmış bir hesap kimliğiyle eşleştiğinde bu yedek varsayılan hesap seçimini geçersiz kılar.
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

- Bot tokeni: `channels.telegram.botToken` veya `channels.telegram.tokenFile` (yalnızca normal dosya; sembolik bağlantılar reddedilir), varsayılan hesap için yedek olarak `TELEGRAM_BOT_TOKEN`.
- `apiRoot` yalnızca Telegram Bot API köküdür. `https://api.telegram.org` veya kendi barındırdığınız/proxy kökünüzü kullanın; `https://api.telegram.org/bot<TOKEN>` kullanmayın; `openclaw doctor --fix` yanlışlıkla eklenmiş sondaki `/bot<TOKEN>` sonekini kaldırır.
- İsteğe bağlı `channels.telegram.defaultAccount`, yapılandırılmış bir hesap kimliğiyle eşleştiğinde varsayılan hesap seçimini geçersiz kılar.
- Çok hesaplı kurulumlarda (2+ hesap kimliği), yedek yönlendirmeyi önlemek için açık bir varsayılan ayarlayın (`channels.telegram.defaultAccount` veya `channels.telegram.accounts.default`); bu eksik veya geçersiz olduğunda `openclaw doctor` uyarır.
- `configWrites: false`, Telegram tarafından başlatılan yapılandırma yazmalarını engeller (süper grup kimliği geçişleri, `/config set|unset`).
- `type: "acp"` içeren üst düzey `bindings[]` girdileri, forum konuları için kalıcı ACP bağlarını yapılandırır (`match.peer.id` içinde kurallı `chatId:topic:topicId` kullanın). Alan anlamları [ACP Aracıları](/tr/tools/acp-agents#persistent-channel-bindings) içinde ortaktır.
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
      suppressEmbeds: true,
      chunkMode: "length", // length | newline
      streaming: {
        mode: "progress", // off | partial | block | progress (Discord default: progress)
        progress: {
          label: "auto",
          maxLines: 8,
          maxLineChars: 120,
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

- Token: varsayılan hesap için yedek olarak `DISCORD_BOT_TOKEN` ile `channels.discord.token`.
- Açık bir Discord `token` sağlayan doğrudan giden çağrılar, çağrı için bu token'ı kullanır; hesap yeniden deneme/ilke ayarları yine etkin çalışma zamanı anlık görüntüsündeki seçili hesaptan gelir.
- İsteğe bağlı `channels.discord.defaultAccount`, yapılandırılmış bir hesap kimliğiyle eşleştiğinde varsayılan hesap seçimini geçersiz kılar.
- Teslim hedefleri için `user:<id>` (DM) veya `channel:<id>` (sunucu kanalı) kullanın; yalın sayısal kimlikler reddedilir.
- Sunucu slug'ları küçük harflidir ve boşluklar `-` ile değiştirilir; kanal anahtarları slug'a dönüştürülmüş adı kullanır (`#` yok). Sunucu kimliklerini tercih edin.
- Bot tarafından yazılan mesajlar varsayılan olarak yok sayılır. `allowBots: true` bunları etkinleştirir; yalnızca bottan bahseden bot mesajlarını kabul etmek için `allowBots: "mentions"` kullanın (kendi mesajları yine filtrelenir).
- Bot tarafından yazılmış gelen mesajları destekleyen kanallar, paylaşılan [bot döngüsü korumasını](/tr/channels/bot-loop-protection) kullanabilir. Temel eş bütçeleri için `channels.defaults.botLoopProtection` ayarlayın, ardından yalnızca bir yüzey farklı sınırlar gerektiriyorsa kanalı veya hesabı geçersiz kılın.
- `channels.discord.guilds.<id>.ignoreOtherMentions` (ve kanal geçersiz kılmaları), başka bir kullanıcıdan veya rolden bahseden ancak bottan bahsetmeyen mesajları düşürür (@everyone/@here hariç).
- `channels.discord.mentionAliases`, göndermeden önce kararlı giden `@handle` metnini Discord kullanıcı kimlikleriyle eşler; böylece geçici dizin önbelleği boş olduğunda bile bilinen ekip arkadaşlarından deterministik olarak bahsedilebilir. Hesap başına geçersiz kılmalar `channels.discord.accounts.<accountId>.mentionAliases` altında bulunur.
- `maxLinesPerMessage` (varsayılan 17), 2000 karakterin altında olsa bile uzun mesajları böler.
- `channels.discord.suppressEmbeds` varsayılan olarak `true` değerindedir; bu nedenle giden URL'ler devre dışı bırakılmadıkça Discord bağlantı önizlemelerine genişlemez. Açık `embeds` yükleri yine normal şekilde gönderilir; mesaj başına araç çağrıları `suppressEmbeds` ile geçersiz kılabilir.
- `channels.discord.threadBindings`, Discord iş parçacığına bağlı yönlendirmeyi denetler:
  - `enabled`: iş parçacığına bağlı oturum özellikleri için Discord geçersiz kılması (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` ve bağlı teslim/yönlendirme)
  - `idleHours`: saat cinsinden etkin olmama durumunda otomatik odaktan çıkarma için Discord geçersiz kılması (`0` devre dışı bırakır)
  - `maxAgeHours`: saat cinsinden katı en yüksek yaş için Discord geçersiz kılması (`0` devre dışı bırakır)
  - `spawnSessions`: `sessions_spawn({ thread: true })` ve ACP iş parçacığı oluşturma ile otomatik iş parçacığı oluşturma/bağlama anahtarı (varsayılan: `true`)
  - `defaultSpawnContext`: iş parçacığına bağlı oluşturulanlar için yerel alt ajan bağlamı (varsayılan olarak `"fork"`)
- `type: "acp"` değerine sahip üst düzey `bindings[]` girdileri, kanallar ve iş parçacıkları için kalıcı ACP bağlamaları yapılandırır (`match.peer.id` içinde kanal/iş parçacığı kimliği kullanın). Alan semantikleri [ACP Agents](/tr/tools/acp-agents#persistent-channel-bindings) içinde paylaşılır.
- `channels.discord.ui.components.accentColor`, Discord components v2 kapsayıcıları için vurgu rengini ayarlar.
- `channels.discord.agentComponents.ttlMs`, gönderilmiş Discord bileşen geri çağrılarının ne kadar süre kayıtlı kalacağını denetler. Varsayılan `1800000` (30 dakika), en yüksek değer `86400000` (24 saat) ve hesap başına geçersiz kılmalar `channels.discord.accounts.<accountId>.agentComponents.ttlMs` altında bulunur. Daha uzun değerler eski düğmeleri/seçimleri/formları daha uzun süre kullanılabilir tutar; bu nedenle iş akışına uyan en kısa TTL'yi tercih edin.
- `channels.discord.voice`, Discord ses kanalı konuşmalarını ve isteğe bağlı otomatik katılma + LLM + TTS geçersiz kılmalarını etkinleştirir. Yalnızca metin Discord yapılandırmaları sesi varsayılan olarak kapalı bırakır; katılmak için `channels.discord.voice.enabled=true` ayarlayın.
- `channels.discord.voice.model`, Discord ses kanalı yanıtları için kullanılan LLM modelini isteğe bağlı olarak geçersiz kılar.
- `channels.discord.voice.daveEncryption` ve `channels.discord.voice.decryptionFailureTolerance`, `@discordjs/voice` DAVE seçeneklerine aynen iletilir (varsayılan olarak `true` ve `24`).
- `channels.discord.voice.connectTimeoutMs`, `/vc join` ve otomatik katılma denemeleri için ilk `@discordjs/voice` Ready beklemesini denetler (varsayılan olarak `30000`).
- `channels.discord.voice.reconnectGraceMs`, OpenClaw oturumu yok etmeden önce bağlantısı kesilmiş bir ses oturumunun yeniden bağlanma sinyaline girmesi için ne kadar süre alabileceğini denetler (varsayılan olarak `15000`).
- Discord ses oynatımı başka bir kullanıcının konuşmaya başlama olayı tarafından kesilmez. Geri bildirim döngülerini önlemek için OpenClaw, TTS oynarken yeni ses yakalamayı yok sayar.
- OpenClaw ayrıca tekrarlanan şifre çözme hatalarından sonra ses oturumundan ayrılıp yeniden katılarak ses alma kurtarması dener.
- `channels.discord.streaming` kanonik akış modu anahtarıdır. Discord varsayılan olarak `streaming.mode: "progress"` kullanır; böylece araç/iş ilerlemesi düzenlenen tek bir önizleme mesajında görünür. Devre dışı bırakmak için `streaming.mode: "off"` ayarlayın. Eski `streamMode` ve boolean `streaming` değerleri çalışma zamanı takma adları olarak kalır; kalıcı yapılandırmayı yeniden yazmak için `openclaw doctor --fix` çalıştırın.
- `channels.discord.autoPresence`, çalışma zamanı kullanılabilirliğini bot varlığına eşler (sağlıklı => çevrimiçi, düşmüş => boşta, tükenmiş => dnd) ve isteğe bağlı durum metni geçersiz kılmalarına izin verir.
- `channels.discord.dangerouslyAllowNameMatching`, değişebilir ad/etiket eşleştirmesini yeniden etkinleştirir (acil durum uyumluluk modu).
- `channels.discord.execApprovals`: Discord'a özgü exec onayı teslimi ve onaylayan yetkilendirmesi.
  - `enabled`: `true`, `false` veya `"auto"` (varsayılan). Otomatik modda, onaylayanlar `approvers` veya `commands.ownerAllowFrom` üzerinden çözümlenebildiğinde exec onayları etkinleşir.
  - `approvers`: exec isteklerini onaylamasına izin verilen Discord kullanıcı kimlikleri. Atlandığında `commands.ownerAllowFrom` değerine geri döner.
  - `agentFilter`: isteğe bağlı ajan kimliği izin listesi. Tüm ajanlar için onayları iletmek üzere atlayın.
  - `sessionFilter`: isteğe bağlı oturum anahtarı desenleri (alt dize veya regex).
  - `target`: onay istemlerinin nereye gönderileceği. `"dm"` (varsayılan) onaylayan DM'lerine gönderir, `"channel"` kaynak kanala gönderir, `"both"` ikisine de gönderir. Hedef `"channel"` içerdiğinde, düğmeler yalnızca çözümlenmiş onaylayanlar tarafından kullanılabilir.
  - `cleanupAfterResolve`: `true` olduğunda, onay, ret veya zaman aşımından sonra onay DM'lerini siler.

**Tepki bildirimi modları:** `off` (yok), `own` (botun mesajları, varsayılan), `all` (tüm mesajlar), `allowlist` (tüm mesajlarda `guilds.<id>.users` üzerinden).

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
- Teslim hedefleri için `spaces/<spaceId>` veya `users/<userId>` kullanın.
- `channels.googlechat.dangerouslyAllowNameMatching`, değişebilir e-posta sorumlusu eşleştirmesini yeniden etkinleştirir (acil durum uyumluluk modu).

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

- **Soket modu**, hem `botToken` hem de `appToken` gerektirir (varsayılan hesap ortam yedeği için `SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN`).
- **HTTP modu**, `botToken` ile birlikte `signingSecret` gerektirir (kök düzeyde veya hesap başına).
- `socketMode`, Slack SDK Socket Mode taşıma ayarlamasını herkese açık Bolt alıcı API'sine geçirir. Bunu yalnızca ping/pong zaman aşımı veya bayat websocket davranışını araştırırken kullanın. `clientPingTimeout` varsayılan olarak `15000` değerindedir; `serverPingTimeout` ve `pingPongLoggingEnabled` yalnızca yapılandırıldığında geçirilir.
- `botToken`, `appToken`, `signingSecret` ve `userToken` düz metin
  dizelerini veya SecretRef nesnelerini kabul eder.
- Slack hesap anlık görüntüleri, kimlik bilgisi başına kaynak/durum alanlarını açığa çıkarır; örneğin
  `botTokenSource`, `botTokenStatus`, `appTokenStatus` ve HTTP modunda
  `signingSecretStatus`. `configured_unavailable`, hesabın
  SecretRef üzerinden yapılandırıldığı ancak mevcut komut/çalışma zamanı yolunun
  gizli değeri çözemediği anlamına gelir.
- `configWrites: false`, Slack tarafından başlatılan yapılandırma yazmalarını engeller.
- İsteğe bağlı `channels.slack.defaultAccount`, yapılandırılmış bir hesap kimliğiyle eşleştiğinde varsayılan hesap seçimini geçersiz kılar.
- `channels.slack.streaming.mode`, kanonik Slack akış modu anahtarıdır. `channels.slack.streaming.nativeTransport`, Slack'in yerel akış taşımasını denetler. Eski `streamMode`, boolean `streaming` ve `nativeStreaming` değerleri çalışma zamanı takma adları olarak kalır; kalıcı yapılandırmayı yeniden yazmak için `openclaw doctor --fix` çalıştırın.
- `unfurlLinks` ve `unfurlMedia`, bot yanıtları için Slack'in `chat.postMessage` bağlantı ve medya açma boolean değerlerini geçirir. `unfurlLinks` varsayılan olarak `false` değerindedir; böylece giden bot bağlantıları etkinleştirilmedikçe satır içinde genişletilmez. `unfurlMedia`, yapılandırılmadıkça atlanır. Bir hesap için üst düzey değeri geçersiz kılmak üzere herhangi bir değeri `channels.slack.accounts.<accountId>` düzeyinde ayarlayın.
- Teslimat hedefleri için `user:<id>` (DM) veya `channel:<id>` kullanın.

**Tepki bildirim modları:** `off`, `own` (varsayılan), `all`, `allowlist` (`reactionAllowlist` değerinden).

**İş parçacığı oturum yalıtımı:** `thread.historyScope`, iş parçacığı başınadır (varsayılan) veya kanal genelinde paylaşılır. `thread.inheritParent`, üst kanal dökümünü yeni iş parçacıklarına kopyalar.

- Slack yerel akışı ve Slack asistan tarzı "yazıyor..." iş parçacığı durumu, bir yanıt iş parçacığı hedefi gerektirir. Üst düzey DM'ler varsayılan olarak iş parçacığı dışında kalır; bu yüzden iş parçacığı tarzı yerel akış/durum önizlemesini göstermek yerine Slack taslak gönder-ve-düzenle önizlemeleri üzerinden akış yapmaya devam edebilirler.
- `typingReaction`, bir yanıt çalışırken gelen Slack iletisine geçici bir tepki ekler, ardından tamamlandığında kaldırır. `"hourglass_flowing_sand"` gibi bir Slack emoji kısa kodu kullanın.
- `channels.slack.execApprovals`: Slack yerel onay istemcisi teslimatı ve exec onaylayıcı yetkilendirmesi. Discord ile aynı şema: `enabled` (`true`/`false`/`"auto"`), `approvers` (Slack kullanıcı kimlikleri), `agentFilter`, `sessionFilter` ve `target` (`"dm"`, `"channel"` veya `"both"`). Plugin onayları, Slack Plugin onaylayıcıları çözümlendiğinde Slack kaynaklı istekler için bu yerel istemci yolunu kullanabilir; Slack yerel Plugin onay teslimatı, Slack kaynaklı oturumlar veya Slack hedefleri için `approvals.plugin` üzerinden de etkinleştirilebilir. Plugin onayları, exec onaylayıcıları değil, `allowFrom` ve varsayılan yönlendirmeden gelen Slack Plugin onaylayıcılarını kullanır.

| Eylem grubu | Varsayılan | Notlar                  |
| ------------ | ------- | ---------------------- |
| reactions    | etkin | Tepki ekle + tepkileri listele |
| messages     | etkin | Oku/gönder/düzenle/sil  |
| pins         | etkin | Sabitle/sabitlemeyi kaldır/listele         |
| memberInfo   | etkin | Üye bilgisi            |
| emojiList    | etkin | Özel emoji listesi      |

### Mattermost

Mattermost, mevcut OpenClaw sürümlerinde paketli bir Plugin olarak gelir. Daha eski veya
özel derlemeler, mevcut bir npm paketini
`openclaw plugins install @openclaw/mattermost` ile kurabilir. Bir sürümü sabitlemeden önce mevcut dist-tag'ler için
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

Sohbet modları: `oncall` (@-bahsetmede yanıt ver, varsayılan), `onmessage` (her ileti), `onchar` (tetikleyici önekle başlayan iletiler).

Mattermost yerel komutları etkinleştirildiğinde:

- `commands.callbackPath` tam URL değil, bir yol olmalıdır (örneğin `/api/channels/mattermost/command`).
- `commands.callbackUrl`, OpenClaw Gateway uç noktasına çözümlenmeli ve Mattermost sunucusundan erişilebilir olmalıdır.
- Yerel slash geri çağrıları, slash komut kaydı sırasında Mattermost tarafından döndürülen
  komut başına token'larla kimlik doğrulamasından geçirilir. Kayıt başarısız olursa veya
  hiçbir komut etkinleştirilmezse OpenClaw geri çağrıları
  `Unauthorized: invalid command token.` ile reddeder.
- Özel/tailnet/dahili geri çağrı ana makineleri için Mattermost,
  `ServiceSettings.AllowedUntrustedInternalConnections` değerinin geri çağrı ana makinesini/alan adını içermesini gerektirebilir.
  Tam URL'ler değil, ana makine/alan adı değerlerini kullanın.
- `channels.mattermost.configWrites`: Mattermost tarafından başlatılan yapılandırma yazmalarına izin verin veya bunları reddedin.
- `channels.mattermost.requireMention`: kanallarda yanıtlamadan önce `@mention` gerektir.
- `channels.mattermost.groups.<channelId>.requireMention`: kanal başına bahsetme geçidi geçersiz kılması (varsayılan için `"*"`).
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

**Tepki bildirim modları:** `off`, `own` (varsayılan), `all`, `allowlist` (`reactionAllowlist` değerinden).

- `channels.signal.account`: kanal başlangıcını belirli bir Signal hesap kimliğine sabitleyin.
- `channels.signal.configWrites`: Signal tarafından başlatılan yapılandırma yazmalarına izin verin veya bunları reddedin.
- İsteğe bağlı `channels.signal.defaultAccount`, yapılandırılmış bir hesap kimliğiyle eşleştiğinde varsayılan hesap seçimini geçersiz kılar.

### iMessage

OpenClaw, `imsg rpc` oluşturur (stdio üzerinden JSON-RPC). Daemon veya port gerekmez. Bu, ana makine Messages veritabanı ve Automation izinlerini verebildiğinde yeni OpenClaw iMessage kurulumları için tercih edilen yoldur.

BlueBubbles desteği kaldırıldı. `channels.bluebubbles`, mevcut OpenClaw üzerinde desteklenen bir çalışma zamanı yapılandırma yüzeyi değildir. Eski yapılandırmaları `channels.imessage` konumuna taşıyın; kısa sürüm için [BlueBubbles kaldırma ve imsg iMessage yolu](/tr/announcements/bluebubbles-imessage), tam çeviri tablosu için [BlueBubbles'tan geçiş](/tr/channels/imessage-from-bluebubbles) sayfasını kullanın.

Gateway, oturum açılmış Messages Mac üzerinde çalışmıyorsa `channels.imessage.enabled=true` değerini koruyun ve `channels.imessage.cliPath` değerini o Mac üzerinde `imsg "$@"` çalıştıran bir SSH sarmalayıcısına ayarlayın. Varsayılan yerel `imsg` yolu yalnızca macOS içindir.

Üretim gönderimleri için bir SSH sarmalayıcısına güvenmeden önce, tam olarak o sarmalayıcı üzerinden giden bir `imsg send` işlemini doğrulayın. Bazı macOS TCC durumları Messages Automation iznini `/usr/libexec/sshd-keygen-wrapper` öğesine atar; bu, okumaların ve probların çalışmasına karşın gönderimlerin AppleEvents `-1743` ile başarısız olmasına neden olabilir; bkz. [SSH sarmalayıcı gönderimleri AppleEvents -1743 ile başarısız oluyor](/tr/channels/imessage#ssh-wrapper-sends-fail-with-appleevents-1743).

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
      sendTransport: "auto",
      region: "US",
      actions: {
        reactions: true,
        edit: true,
        unsend: true,
        reply: true,
        sendWithEffect: true,
        sendAttachment: true,
      },
    },
  },
}
```

- İsteğe bağlı `channels.imessage.defaultAccount`, yapılandırılmış bir hesap kimliğiyle eşleştiğinde varsayılan hesap seçimini geçersiz kılar.

- Messages DB için Tam Disk Erişimi gerektirir.
- `chat_id:<id>` hedeflerini tercih edin. Sohbetleri listelemek için `imsg chats --limit 20` kullanın.
- `cliPath`, bir SSH sarmalayıcısını gösterebilir; SCP ek getirme için `remoteHost` (`host` veya `user@host`) ayarlayın.
- `attachmentRoots` ve `remoteAttachmentRoots`, gelen ek yollarını kısıtlar (varsayılan: `/Users/*/Library/Messages/Attachments`).
- SCP, katı ana makine anahtarı denetimi kullanır; bu yüzden aktarma ana makinesi anahtarının `~/.ssh/known_hosts` içinde zaten bulunduğundan emin olun.
- `channels.imessage.configWrites`: iMessage tarafından başlatılan yapılandırma yazmalarına izin verin veya bunları reddedin.
- `channels.imessage.sendTransport`: normal giden yanıtlar için tercih edilen `imsg` RPC gönderme taşıması. `auto` (varsayılan), çalışıyorsa mevcut sohbetler için IMCore köprüsünü kullanır, ardından AppleScript'e geri döner; `bridge` özel API teslimatı gerektirir; `applescript` herkese açık Messages otomasyon yolunu zorlar.
- `channels.imessage.actions.*`: `imsg status` / `openclaw channels status --probe` tarafından da geçitlenen özel API eylemlerini etkinleştirin.
- `channels.imessage.includeAttachments` varsayılan olarak kapalıdır; aracı turlarında gelen medya beklemeden önce bunu `true` olarak ayarlayın.
- Köprü/Gateway yeniden başlatmasından sonra gelen kurtarma otomatiktir (GUID tekilleştirme artı bayat birikim yaş sınırı). Mevcut `channels.imessage.catchup.enabled: true` yapılandırmaları, kullanımdan kaldırılmış bir uyumluluk profili olarak hâlâ desteklenir.
- `channels.imessage.groups`: grup kayıt defteri ve grup başına ayarlar. `groupPolicy: "allowlist"` ile, grup iletilerinin kayıt defteri geçidinden geçebilmesi için açık `chat_id` anahtarları veya bir `"*"` joker karakter girdisi yapılandırın.
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

- Belirteç kimlik doğrulaması `accessToken` kullanır; parola kimlik doğrulaması `userId` + `password` kullanır.
- `channels.matrix.proxy`, Matrix HTTP trafiğini açık bir HTTP(S) proxy üzerinden yönlendirir. Adlandırılmış hesaplar bunu `channels.matrix.accounts.<id>.proxy` ile geçersiz kılabilir.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork`, özel/dahili homeserver'lara izin verir. `proxy` ve bu ağ katılım tercihi bağımsız denetimlerdir.
- `channels.matrix.defaultAccount`, çok hesaplı kurulumlarda tercih edilen hesabı seçer.
- `channels.matrix.autoJoin` varsayılan olarak `off` değerindedir; bu nedenle davet edilen odalar ve yeni DM tarzı davetler, `autoJoinAllowlist` ile `autoJoin: "allowlist"` veya `autoJoin: "always"` ayarlanana kadar yok sayılır.
- `channels.matrix.execApprovals`: Matrix'e özgü exec onayı teslimi ve onaylayan yetkilendirmesi.
  - `enabled`: `true`, `false` veya `"auto"` (varsayılan). Otomatik modda, onaylayanlar `approvers` veya `commands.ownerAllowFrom` üzerinden çözümlenebildiğinde exec onayları etkinleşir.
  - `approvers`: Exec isteklerini onaylamasına izin verilen Matrix kullanıcı kimlikleri (ör. `@owner:example.org`).
  - `agentFilter`: isteğe bağlı ajan kimliği izin listesi. Tüm ajanlar için onayları iletmek üzere atlayın.
  - `sessionFilter`: isteğe bağlı oturum anahtarı desenleri (alt dize veya regex).
  - `target`: onay istemlerinin nereye gönderileceği. `"dm"` (varsayılan), `"channel"` (kaynak oda) veya `"both"`.
  - Hesap başına geçersiz kılmalar: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope`, Matrix DM'lerinin oturumlarda nasıl gruplanacağını denetler: `per-user` (varsayılan) yönlendirilen eşe göre paylaşırken, `per-room` her DM odasını yalıtır.
- Matrix durum sondaları ve canlı dizin aramaları, çalışma zamanı trafiğiyle aynı proxy ilkesini kullanır.
- Tam Matrix yapılandırması, hedefleme kuralları ve kurulum örnekleri [Matrix](/tr/channels/matrix) içinde belgelenmiştir.

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

- Burada kapsanan temel anahtar yolları: `channels.msteams`, `channels.msteams.configWrites`.
- Tam Teams yapılandırması (kimlik bilgileri, Webhook, DM/grup ilkesi, takım başına/kanal başına geçersiz kılmalar) [Microsoft Teams](/tr/channels/msteams) içinde belgelenmiştir.

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

- Burada kapsanan temel anahtar yolları: `channels.irc`, `channels.irc.dmPolicy`, `channels.irc.configWrites`, `channels.irc.nickserv.*`.
- İsteğe bağlı `channels.irc.defaultAccount`, yapılandırılmış bir hesap kimliğiyle eşleştiğinde varsayılan hesap seçimini geçersiz kılar.
- Tam IRC kanal yapılandırması (host/port/TLS/kanallar/izin listeleri/bahsetme geçidi) [IRC](/tr/channels/irc) içinde belgelenmiştir.

### Çoklu hesap (tüm kanallar)

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
- Ortam belirteçleri yalnızca **varsayılan** hesaba uygulanır.
- Temel kanal ayarları, hesap başına geçersiz kılınmadıkça tüm hesaplara uygulanır.
- Her hesabı farklı bir ajana yönlendirmek için `bindings[].match.accountId` kullanın.
- Hâlâ tek hesaplı üst düzey kanal yapılandırmasındayken `openclaw channels add` (veya kanal ilk katılımı) ile varsayılan olmayan bir hesap eklerseniz, OpenClaw önce hesap kapsamlı üst düzey tek hesap değerlerini kanal hesap haritasına yükseltir; böylece özgün hesap çalışmaya devam eder. Çoğu kanal bunları `channels.<channel>.accounts.default` içine taşır; Matrix bunun yerine mevcut eşleşen adlandırılmış/varsayılan hedefi koruyabilir.
- Mevcut yalnızca kanal bağlamaları (`accountId` yok) varsayılan hesapla eşleşmeye devam eder; hesap kapsamlı bağlamalar isteğe bağlı kalır.
- `openclaw doctor --fix` ayrıca hesap kapsamlı üst düzey tek hesap değerlerini o kanal için seçilen yükseltilmiş hesaba taşıyarak karışık şekilleri onarır. Çoğu kanal `accounts.default` kullanır; Matrix bunun yerine mevcut eşleşen adlandırılmış/varsayılan hedefi koruyabilir.

### Diğer Plugin kanalları

Birçok Plugin kanalı `channels.<id>` olarak yapılandırılır ve kendi özel kanal sayfalarında belgelenir (örneğin Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat ve Twitch).
Tam kanal dizinine bakın: [Kanallar](/tr/channels).

### Grup sohbeti bahsetme geçidi

Grup mesajları varsayılan olarak **bahsetme gerektirir** (metadata bahsetmesi veya güvenli regex desenleri). WhatsApp, Telegram, Discord, Google Chat ve iMessage grup sohbetleri için geçerlidir.

Görünür yanıtlar ayrı olarak denetlenir. Normal grup, kanal ve dahili WebChat doğrudan istekleri varsayılan olarak otomatik nihai teslim kullanır: nihai asistan metni eski görünür yanıt yolu üzerinden gönderilir. Görünür çıktının yalnızca ajan `message(action=send)` çağırdıktan sonra gönderilmesi gerekiyorsa `messages.visibleReplies: "message_tool"` veya `messages.groupChat.visibleReplies: "message_tool"` seçeneğini etkinleştirin. Model, yalnızca araç moduna alınmış bir modda ileti aracını çağırmadan nihai metin döndürürse, bu nihai metin özel kalır ve gateway ayrıntılı günlüğü bastırılmış yük metadata'sını kaydeder.

Yalnızca araç görünür yanıtları, araçları güvenilir biçimde çağıran bir model/çalışma zamanı gerektirir ve GPT 5.5 gibi en yeni nesil modellerde paylaşılan ortam odaları için önerilir. Bazı daha zayıf modeller nihai metinle yanıt verebilir ancak kaynakta görünür çıktının `message(action=send)` ile gönderilmesi gerektiğini anlayamayabilir. Bu modeller için nihai asistan turunun görünür yanıt yolu olması için `"automatic"` kullanın. Oturum günlüğü `didSendViaMessagingTool: false` ile asistan metni gösteriyorsa model ileti aracını çağırmak yerine özel nihai metin üretmiştir. Bu kanal için daha güçlü bir araç çağırma modeline geçin, bastırılmış yük özeti için gateway ayrıntılı günlüğünü inceleyin veya her grup/kanal isteğinde görünür nihai yanıtları kullanmak için `messages.groupChat.visibleReplies: "automatic"` ayarlayın.

İleti aracı etkin araç ilkesi altında kullanılamıyorsa OpenClaw yanıtı sessizce bastırmak yerine otomatik görünür yanıtlara geri döner. `openclaw doctor` bu uyumsuzluk konusunda uyarır.

Bu kural normal ajan nihai metni için geçerlidir. Plugin sahipli konuşma bağlamaları, sahip Plugin'in döndürdüğü yanıtı talep edilmiş bağlı iş parçacığı turları için görünür yanıt olarak kullanır; Plugin'in bu bağlama yanıtları için `message(action=send)` çağırması gerekmez.

**Sorun giderme: grup @bahsetmesi yazıyor göstergesini tetikliyor, sonra sessizlik (hata yok)**

Belirti: bir grup/kanal @bahsetmesi yazıyor göstergesini gösterir ve gateway günlüğü `dispatch complete (queuedFinal=false, replies=0)` bildirir, ancak odaya mesaj düşmez. Aynı ajana DM'ler normal yanıt verir.

Neden: grup/kanal görünür yanıt modu `"message_tool"` olarak çözümlenir; bu nedenle OpenClaw turu çalıştırır ancak ajan `message(action=send)` çağırmadıkça nihai asistan metnini bastırır. Bu modda `NO_REPLY` sözleşmesi yoktur; ileti aracı çağrısı olmaması kaynak yanıtı olmaması anlamına gelir. Hata yoktur çünkü bastırma yapılandırılmış davranıştır. Normal grup ve kanal turları varsayılan olarak `"automatic"` değerindedir; bu yüzden bu belirti yalnızca `messages.groupChat.visibleReplies` (veya global `messages.visibleReplies`) açıkça `"message_tool"` olarak ayarlandığında görünür. Harness `defaultVisibleReplies` burada geçerli değildir — grup/kanal çözümleyici bunu yok sayar; yalnızca doğrudan/kaynak sohbetlerini etkiler (Codex harness doğrudan sohbet finallerini bu şekilde bastırır).

Düzeltme: daha güçlü bir araç çağırma modeli seçin, `"automatic"` varsayılana geri dönmek için açık `"message_tool"` geçersiz kılmasını kaldırın veya her grup/kanal isteği için görünür yanıtları zorlamak üzere `messages.groupChat.visibleReplies: "automatic"` ayarlayın. Gateway, dosya kaydedildikten sonra `messages` yapılandırmasını sıcak yeniden yükler; gateway'i yalnızca dağıtımda dosya izleme veya yapılandırma yeniden yükleme devre dışıysa yeniden başlatın.

**Bahsetme türleri:**

- **Metadata bahsetmeleri**: Yerel platform @-bahsetmeleri. WhatsApp self-chat modunda yok sayılır.
- **Metin desenleri**: `agents.list[].groupChat.mentionPatterns` içindeki güvenli regex desenleri. Geçersiz desenler ve güvenli olmayan iç içe tekrar yok sayılır.
- Bahsetme geçidi yalnızca algılama mümkün olduğunda uygulanır (yerel bahsetmeler veya en az bir desen).

```json5
{
  messages: {
    visibleReplies: "automatic", // force old automatic final replies for direct/source chats
    groupChat: {
      historyLimit: 50,
      unmentionedInbound: "room_event", // always-on unmentioned room chatter becomes quiet context
      visibleReplies: "message_tool", // opt-in; require message(action=send) for visible room replies
    },
  },
  agents: {
    list: [{ id: "main", groupChat: { mentionPatterns: ["@openclaw", "openclaw"] } }],
  },
}
```

`messages.groupChat.historyLimit` global varsayılanı ayarlar. Kanallar bunu `channels.<channel>.historyLimit` (veya hesap başına) ile geçersiz kılabilir. Devre dışı bırakmak için `0` ayarlayın.

`messages.groupChat.unmentionedInbound: "room_event"`, desteklenen kanallarda bahsedilmeyen her zaman açık grup/kanal mesajlarını sessiz oda bağlamı olarak gönderir. Bahsedilen mesajlar, komutlar ve doğrudan mesajlar kullanıcı isteği olarak kalır. Eksiksiz Discord, Slack ve Telegram örnekleri için [Ortam oda etkinlikleri](/tr/channels/ambient-room-events) bölümüne bakın.

`messages.visibleReplies` global kaynak etkinliği varsayılanıdır; `messages.groupChat.visibleReplies` grup/kanal kaynak etkinlikleri için bunu geçersiz kılar. `messages.visibleReplies` ayarlanmadığında, doğrudan/kaynak sohbetleri seçilen çalışma zamanı veya harness varsayılanını kullanır, ancak dahili WebChat doğrudan turları Pi/Codex istem eşliği için otomatik nihai teslim kullanır. Görünür çıktı için `message(action=send)` öğesini bilerek gerekli kılmak üzere `messages.visibleReplies: "message_tool"` ayarlayın. Kanal izin listeleri ve bahsetme geçidi yine de bir etkinliğin işlenip işlenmeyeceğine karar verir.

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

Self-chat modunu etkinleştirmek için `allowFrom` içine kendi numaranızı ekleyin (yerel @-bahsetmeleri yok sayar, yalnızca metin desenlerine yanıt verir):

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
- Bu sayfa tam komut kataloğu değil, bir **config-key başvurusu**dur. QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, cihaz eşleme `/pair`, bellek `/dreaming`, telefon kontrolü `/phone` ve Talk `/voice` gibi kanal/Plugin sahipli komutlar, kendi kanal/Plugin sayfalarında ve [Eğik Çizgi Komutları](/tr/tools/slash-commands) içinde belgelenmiştir.
- Metin komutları, başında `/` bulunan **bağımsız** mesajlar olmalıdır.
- `native: "auto"` Discord/Telegram için yerel komutları açar, Slack'i kapalı bırakır.
- `nativeSkills: "auto"` Discord/Telegram için yerel Skills komutlarını açar, Slack'i kapalı bırakır.
- Kanal başına geçersiz kılın: `channels.discord.commands.native` (bool veya `"auto"`). Discord için `false`, başlangıç sırasında yerel komut kaydını ve temizliğini atlar.
- Kanal başına yerel Skills kaydını `channels.<provider>.commands.nativeSkills` ile geçersiz kılın.
- `channels.telegram.customCommands` fazladan Telegram bot menüsü girdileri ekler.
- `bash: true`, ana makine kabuğu için `! <cmd>` kullanımını etkinleştirir. `tools.elevated.enabled` ve gönderenin `tools.elevated.allowFrom.<channel>` içinde olmasını gerektirir.
- `config: true`, `/config` komutunu etkinleştirir (`openclaw.json` dosyasını okur/yazar). Gateway `chat.send` istemcileri için kalıcı `/config set|unset` yazmaları ayrıca `operator.admin` gerektirir; salt okunur `/config show`, normal yazma kapsamlı operatör istemcileri için kullanılabilir kalır.
- `mcp: true`, `mcp.servers` altındaki OpenClaw tarafından yönetilen MCP sunucu yapılandırması için `/mcp` komutunu etkinleştirir.
- `plugins: true`, Plugin keşfi, kurulumu ve etkinleştirme/devre dışı bırakma kontrolleri için `/plugins` komutunu etkinleştirir.
- `channels.<provider>.configWrites`, kanal başına yapılandırma değişikliklerini kapılar (varsayılan: true).
- Çok hesaplı kanallar için `channels.<provider>.accounts.<id>.configWrites`, o hesabı hedefleyen yazmaları da kapılar (örneğin `/allowlist --config --account <id>` veya `/config set channels.<provider>.accounts.<id>...`).
- `restart: false`, `/restart` ve gateway yeniden başlatma araç eylemlerini devre dışı bırakır. Varsayılan: `true`.
- `ownerAllowFrom`, yalnızca sahip komutları ve sahip kapılı kanal eylemleri için açık sahip izin listesidir. `allowFrom` öğesinden ayrıdır.
- `ownerDisplay: "hash"`, sistem isteminde sahip kimliklerini karmalar. Karmalamayı denetlemek için `ownerDisplaySecret` ayarlayın.
- `allowFrom`, sağlayıcı başınadır. Ayarlandığında **tek** yetkilendirme kaynağıdır (kanal izin listeleri/eşleme ve `useAccessGroups` yok sayılır).
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

- [Yapılandırma başvurusu](/tr/gateway/configuration-reference) — üst düzey anahtarlar
- [Yapılandırma — ajanlar](/tr/gateway/config-agents)
- [Kanallara genel bakış](/tr/channels)
