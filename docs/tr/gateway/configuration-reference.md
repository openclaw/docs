---
read_when:
    - Tam alan düzeyinde yapılandırma anlamlarına veya varsayılanlara ihtiyacınız var
    - Kanal, model, Gateway veya araç yapılandırma bloklarını doğruluyorsunuz
summary: Çekirdek OpenClaw anahtarları, varsayılanlar ve özel alt sistem başvurularına bağlantılar için Gateway yapılandırma başvurusu
title: Yapılandırma Başvurusu
x-i18n:
    generated_at: "2026-04-18T08:32:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4b504c9c6b47d7a327a0acf6934561c9b2606c01cc8ebe5526ccde73033d759f
    source_path: gateway/configuration-reference.md
    workflow: 15
---

# Yapılandırma Başvurusu

`~/.openclaw/openclaw.json` için çekirdek yapılandırma başvurusu. Görev odaklı bir genel bakış için bkz. [Yapılandırma](/tr/gateway/configuration).

Bu sayfa, ana OpenClaw yapılandırma yüzeylerini kapsar ve bir alt sistemin kendine ait daha derin bir başvurusu olduğunda buna bağlantı verir. Her kanal/plugin’e ait komut kataloğunu veya her derin bellek/QMD ayarını tek bir sayfada satır içine almaya **çalışmaz**.

Kodun gerçek kaynağı:

- `openclaw config schema`, doğrulama ve Control UI için kullanılan canlı JSON Schema’yı yazdırır; mevcut olduğunda bundled/plugin/channel meta verileri birleştirilir
- `config.schema.lookup`, ayrıntılı inceleme araçları için yol kapsamlı tek bir şema düğümü döndürür
- `pnpm config:docs:check` / `pnpm config:docs:gen`, config-doc temel karma değerini mevcut şema yüzeyine karşı doğrular

Özel derin başvurular:

- `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` ve `plugins.entries.memory-core.config.dreaming` altındaki dreaming yapılandırması için [Bellek yapılandırma başvurusu](/tr/reference/memory-config)
- Güncel yerleşik + bundled komut kataloğu için [Slash Commands](/tr/tools/slash-commands)
- Kanala özgü komut yüzeyleri için ilgili kanal/plugin sayfaları

Yapılandırma biçimi **JSON5**’tir (yorumlar + sondaki virgüllere izin verilir). Tüm alanlar isteğe bağlıdır — OpenClaw, belirtilmediğinde güvenli varsayılanlar kullanır.

---

## Kanallar

Her kanal, yapılandırma bölümü mevcut olduğunda otomatik olarak başlar (`enabled: false` değilse).

### DM ve grup erişimi

Tüm kanallar DM ilkelerini ve grup ilkelerini destekler:

| DM ilkesi            | Davranış                                                      |
| -------------------- | ------------------------------------------------------------- |
| `pairing` (varsayılan) | Bilinmeyen göndericiler tek kullanımlık bir eşleştirme kodu alır; sahibin onaylaması gerekir |
| `allowlist`          | Yalnızca `allowFrom` içindeki göndericiler (veya eşleştirilmiş izin deposu) |
| `open`               | Tüm gelen DM’lere izin ver ( `allowFrom: ["*"]` gerektirir ) |
| `disabled`           | Tüm gelen DM’leri yok say                                     |

| Grup ilkesi            | Davranış                                             |
| ---------------------- | ---------------------------------------------------- |
| `allowlist` (varsayılan) | Yalnızca yapılandırılmış izin listesiyle eşleşen gruplar |
| `open`                 | Grup izin listelerini atlar (mention-gating yine de uygulanır) |
| `disabled`             | Tüm grup/oda mesajlarını engeller                    |

<Note>
`channels.defaults.groupPolicy`, bir sağlayıcının `groupPolicy` değeri ayarlanmamışsa varsayılanı belirler.
Eşleştirme kodlarının süresi 1 saat sonra dolar. Bekleyen DM eşleştirme istekleri **kanal başına 3** ile sınırlandırılmıştır.
Bir sağlayıcı bloğu tamamen eksikse (`channels.<provider>` yoksa), çalışma zamanındaki grup ilkesi başlangıç uyarısıyla birlikte `allowlist` (fail-closed) olarak geri düşer.
</Note>

### Kanal model geçersiz kılmaları

Belirli kanal kimliklerini bir modele sabitlemek için `channels.modelByChannel` kullanın. Değerler `provider/model` veya yapılandırılmış model takma adlarını kabul eder. Kanal eşlemesi, bir oturumda zaten bir model geçersiz kılması yoksa uygulanır (örneğin `/model` ile ayarlanmışsa).

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

- `channels.defaults.groupPolicy`: sağlayıcı düzeyindeki `groupPolicy` ayarlanmamışsa geri dönüş grup ilkesi.
- `channels.defaults.contextVisibility`: tüm kanallar için varsayılan ek bağlam görünürlüğü modu. Değerler: `all` (varsayılan, alıntılanan/iş parçacığı/geçmiş bağlamının tamamını dahil et), `allowlist` (yalnızca izin listesindeki göndericilerden gelen bağlamı dahil et), `allowlist_quote` (allowlist ile aynı, ancak açık alıntı/yanıt bağlamını koru). Kanal başına geçersiz kılma: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: sağlıklı kanal durumlarını Heartbeat çıktısına dahil et.
- `channels.defaults.heartbeat.showAlerts`: bozulmuş/hatalı durumları Heartbeat çıktısına dahil et.
- `channels.defaults.heartbeat.useIndicator`: kompakt gösterge tarzı Heartbeat çıktısı oluştur.

### WhatsApp

WhatsApp, Gateway’in web kanalı (Baileys Web) üzerinden çalışır. Bağlı bir oturum mevcutsa otomatik olarak başlar.

```json5
{
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

- Giden komutlar, varsa varsayılan olarak `default` hesabını kullanır; aksi halde ilk yapılandırılmış hesap kimliği kullanılır (sıralanmış).
- İsteğe bağlı `channels.whatsapp.defaultAccount`, yapılandırılmış bir hesap kimliğiyle eşleştiğinde bu geri dönüş varsayılan hesap seçimini geçersiz kılar.
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
      proxy: "socks5://localhost:9050",
      webhookUrl: "https://example.com/telegram-webhook",
      webhookSecret: "secret",
      webhookPath: "/telegram-webhook",
    },
  },
}
```

- Bot token: `channels.telegram.botToken` veya `channels.telegram.tokenFile` (yalnızca normal dosya; symlink’ler reddedilir), varsayılan hesap için geri dönüş olarak `TELEGRAM_BOT_TOKEN`.
- İsteğe bağlı `channels.telegram.defaultAccount`, yapılandırılmış bir hesap kimliğiyle eşleştiğinde varsayılan hesap seçimini geçersiz kılar.
- Çok hesaplı kurulumlarda (2+ hesap kimliği), geri dönüş yönlendirmesini önlemek için açık bir varsayılan ayarlayın (`channels.telegram.defaultAccount` veya `channels.telegram.accounts.default`); bu eksik veya geçersiz olduğunda `openclaw doctor` uyarı verir.
- `configWrites: false`, Telegram tarafından başlatılan yapılandırma yazımlarını engeller (supergroup ID taşımaları, `/config set|unset`).
- `type: "acp"` olan üst düzey `bindings[]` girdileri, forum konuları için kalıcı ACP bağlarını yapılandırır (`match.peer.id` içinde standart `chatId:topic:topicId` kullanın). Alan anlamları [ACP Agents](/tr/tools/acp-agents#channel-specific-settings) içinde ortaktır.
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
      streaming: "off", // off | partial | block | progress (progress Discord'ta partial eşlemesine gider)
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
        spawnSubagentSessions: false, // sessions_spawn({ thread: true }) için isteğe bağlı etkinleştirme
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
- Açık bir Discord `token` sağlayan doğrudan giden çağrılar, çağrı için o token’ı kullanır; hesap yeniden deneme/ilke ayarları yine etkin çalışma zamanı anlık görüntüsünde seçilen hesaptan gelir.
- İsteğe bağlı `channels.discord.defaultAccount`, yapılandırılmış bir hesap kimliğiyle eşleştiğinde varsayılan hesap seçimini geçersiz kılar.
- Teslim hedefleri için `user:<id>` (DM) veya `channel:<id>` (sunucu kanalı) kullanın; tek başına sayısal kimlikler reddedilir.
- Sunucu slug’ları küçük harflidir ve boşluklar `-` ile değiştirilir; kanal anahtarları slug’lanmış adı kullanır (`#` olmadan). Sunucu kimliklerini tercih edin.
- Bot tarafından yazılmış mesajlar varsayılan olarak yok sayılır. `allowBots: true` bunları etkinleştirir; yalnızca botu mention eden bot mesajlarını kabul etmek için `allowBots: "mentions"` kullanın (botun kendi mesajları yine filtrelenir).
- `channels.discord.guilds.<id>.ignoreOtherMentions` (ve kanal geçersiz kılmaları), başka bir kullanıcıyı veya rolü mention edip botu mention etmeyen mesajları düşürür (`@everyone`/`@here` hariç).
- `maxLinesPerMessage` (varsayılan 17), mesajlar 2000 karakterin altında olsa bile uzun mesajları böler.
- `channels.discord.threadBindings`, Discord iş parçacığına bağlı yönlendirmeyi kontrol eder:
  - `enabled`: iş parçacığına bağlı oturum özellikleri için Discord geçersiz kılması (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` ve bağlı teslim/yönlendirme)
  - `idleHours`: saat cinsinden hareketsizlik sonrası otomatik odak kaldırma için Discord geçersiz kılması (`0` devre dışı bırakır)
  - `maxAgeHours`: saat cinsinden kesin azami yaş için Discord geçersiz kılması (`0` devre dışı bırakır)
  - `spawnSubagentSessions`: `sessions_spawn({ thread: true })` otomatik iş parçacığı oluşturma/bağlama için isteğe bağlı anahtar
- `type: "acp"` olan üst düzey `bindings[]` girdileri, kanallar ve iş parçacıkları için kalıcı ACP bağlarını yapılandırır (`match.peer.id` içinde kanal/iş parçacığı kimliğini kullanın). Alan anlamları [ACP Agents](/tr/tools/acp-agents#channel-specific-settings) içinde ortaktır.
- `channels.discord.ui.components.accentColor`, Discord components v2 kapsayıcıları için vurgu rengini ayarlar.
- `channels.discord.voice`, Discord ses kanalı konuşmalarını ve isteğe bağlı otomatik katılma + TTS geçersiz kılmalarını etkinleştirir.
- `channels.discord.voice.daveEncryption` ve `channels.discord.voice.decryptionFailureTolerance`, `@discordjs/voice` DAVE seçeneklerine doğrudan aktarılır (varsayılan olarak `true` ve `24`).
- OpenClaw ayrıca, art arda gelen şifre çözme hatalarından sonra bir ses oturumundan ayrılıp yeniden katılarak ses alımını kurtarmayı dener.
- `channels.discord.streaming`, standart akış modu anahtarıdır. Eski `streamMode` ve boolean `streaming` değerleri otomatik olarak taşınır.
- `channels.discord.autoPresence`, çalışma zamanı kullanılabilirliğini bot varlığına eşler (sağlıklı => online, bozulmuş => idle, tükenmiş => dnd) ve isteğe bağlı durum metni geçersiz kılmalarına izin verir.
- `channels.discord.dangerouslyAllowNameMatching`, değiştirilebilir ad/etiket eşleştirmesini yeniden etkinleştirir (cam kırma uyumluluk modu).
- `channels.discord.execApprovals`: Discord yerel exec onay teslimi ve onaylayıcı yetkilendirmesi.
  - `enabled`: `true`, `false` veya `"auto"` (varsayılan). Otomatik modda exec onayları, onaylayıcılar `approvers` veya `commands.ownerAllowFrom` içinden çözümlenebildiğinde etkinleşir.
  - `approvers`: exec isteklerini onaylamasına izin verilen Discord kullanıcı kimlikleri. Belirtilmediğinde `commands.ownerAllowFrom` değerine geri düşer.
  - `agentFilter`: isteğe bağlı ajan kimliği izin listesi. Tüm ajanlar için onayları iletmek üzere boş bırakın.
  - `sessionFilter`: isteğe bağlı oturum anahtarı desenleri (alt dize veya regex).
  - `target`: onay istemlerinin nereye gönderileceği. `"dm"` (varsayılan) onaylayıcı DM’lerine gönderir, `"channel"` kaynak kanala gönderir, `"both"` her ikisine de gönderir. Hedef `"channel"` içerdiğinde düğmeler yalnızca çözümlenmiş onaylayıcılar tarafından kullanılabilir.
  - `cleanupAfterResolve`: `true` olduğunda, onay, ret veya zaman aşımından sonra onay DM’lerini siler.

**Tepki bildirimi modları:** `off` (yok), `own` (botun mesajları, varsayılan), `all` (tüm mesajlar), `allowlist` (`guilds.<id>.users` içinden, tüm mesajlarda).

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
- Hizmet hesabı SecretRef de desteklenir (`serviceAccountRef`).
- Ortam geri dönüşleri: `GOOGLE_CHAT_SERVICE_ACCOUNT` veya `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- Teslim hedefleri için `spaces/<spaceId>` veya `users/<userId>` kullanın.
- `channels.googlechat.dangerouslyAllowNameMatching`, değiştirilebilir e-posta principal eşleştirmesini yeniden etkinleştirir (cam kırma uyumluluk modu).

### Slack

```json5
{
  channels: {
    slack: {
      enabled: true,
      botToken: "xoxb-...",
      appToken: "xapp-...",
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
        nativeTransport: true, // mode=partial olduğunda Slack yerel akış API'sini kullan
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

- **Socket modu** hem `botToken` hem `appToken` gerektirir (varsayılan hesap ortam geri dönüşü için `SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN`).
- **HTTP modu** `botToken` artı `signingSecret` gerektirir (kök düzeyde veya hesap başına).
- `botToken`, `appToken`, `signingSecret` ve `userToken`, düz metin
  dizelerini veya SecretRef nesnelerini kabul eder.
- Slack hesap anlık görüntüleri, `botTokenSource`, `botTokenStatus`, `appTokenStatus` ve HTTP modunda `signingSecretStatus` gibi kimlik bilgisi kaynağı/durumu alanlarını ortaya çıkarır. `configured_unavailable`, hesabın SecretRef üzerinden yapılandırıldığı ancak mevcut komut/çalışma zamanı yolunun gizli değerini çözemediği anlamına gelir.
- `configWrites: false`, Slack tarafından başlatılan yapılandırma yazımlarını engeller.
- İsteğe bağlı `channels.slack.defaultAccount`, yapılandırılmış bir hesap kimliğiyle eşleştiğinde varsayılan hesap seçimini geçersiz kılar.
- `channels.slack.streaming.mode`, standart Slack akış modu anahtarıdır. `channels.slack.streaming.nativeTransport`, Slack’in yerel akış taşımasını kontrol eder. Eski `streamMode`, boolean `streaming` ve `nativeStreaming` değerleri otomatik olarak taşınır.
- Teslim hedefleri için `user:<id>` (DM) veya `channel:<id>` kullanın.

**Tepki bildirimi modları:** `off`, `own` (varsayılan), `all`, `allowlist` (`reactionAllowlist` içinden).

**İş parçacığı oturum yalıtımı:** `thread.historyScope` iş parçacığı başına (varsayılan) veya kanal genelinde paylaşılır. `thread.inheritParent`, üst kanal dökümünü yeni iş parçacıklarına kopyalar.

- Slack yerel akışı ve Slack yardımcı tarzı "yazıyor..." iş parçacığı durumu bir yanıt iş parçacığı hedefi gerektirir. Üst düzey DM’ler varsayılan olarak iş parçacığı dışında kalır, bu yüzden iş parçacığı tarzı önizleme yerine `typingReaction` veya normal teslim kullanırlar.
- `typingReaction`, bir yanıt çalışırken gelen Slack mesajına geçici bir tepki ekler, ardından tamamlandığında bunu kaldırır. `"hourglass_flowing_sand"` gibi bir Slack emoji kısa kodu kullanın.
- `channels.slack.execApprovals`: Slack yerel exec onay teslimi ve onaylayıcı yetkilendirmesi. Discord ile aynı şema: `enabled` (`true`/`false`/`"auto"`), `approvers` (Slack kullanıcı kimlikleri), `agentFilter`, `sessionFilter` ve `target` (`"dm"`, `"channel"` veya `"both"`).

| Eylem grubu | Varsayılan | Notlar                 |
| ----------- | ---------- | ---------------------- |
| reactions   | etkin      | Tepki ver + tepkileri listele |
| messages    | etkin      | Oku/gönder/düzenle/sil |
| pins        | etkin      | Sabitle/sabitlemeyi kaldır/listele |
| memberInfo  | etkin      | Üye bilgisi            |
| emojiList   | etkin      | Özel emoji listesi     |

### Mattermost

Mattermost bir Plugin olarak sunulur: `openclaw plugins install @openclaw/mattermost`.

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
        native: true, // isteğe bağlı etkinleştirme
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Ters proxy/genel dağıtımlar için isteğe bağlı açık URL
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
      textChunkLimit: 4000,
      chunkMode: "length",
    },
  },
}
```

Sohbet modları: `oncall` (@-mention ile yanıt ver, varsayılan), `onmessage` (her mesaj), `onchar` (tetikleyici önekle başlayan mesajlar).

Mattermost yerel komutları etkinleştirildiğinde:

- `commands.callbackPath` tam URL değil, bir yol olmalıdır (örneğin `/api/channels/mattermost/command`).
- `commands.callbackUrl`, OpenClaw Gateway uç noktasına çözülmeli ve Mattermost sunucusundan erişilebilir olmalıdır.
- Yerel slash callback’leri, Mattermost tarafından slash komut kaydı sırasında döndürülen komut başına token’larla kimlik doğrulanır. Kayıt başarısız olursa veya hiçbir komut etkinleştirilmezse OpenClaw callback’leri şu hatayla reddeder:
  `Unauthorized: invalid command token.`
- Özel/tailnet/dahili callback ana makineleri için Mattermost, `ServiceSettings.AllowedUntrustedInternalConnections` içinde callback ana makinesinin/alan adının bulunmasını isteyebilir.
  Tam URL değil, ana makine/alan adı değerleri kullanın.
- `channels.mattermost.configWrites`: Mattermost tarafından başlatılan yapılandırma yazımlarına izin ver veya bunları engelle.
- `channels.mattermost.requireMention`: kanallarda yanıt vermeden önce `@mention` gerektir.
- `channels.mattermost.groups.<channelId>.requireMention`: kanal başına mention-gating geçersiz kılması (varsayılan için `"*"`).
- İsteğe bağlı `channels.mattermost.defaultAccount`, yapılandırılmış bir hesap kimliğiyle eşleştiğinde varsayılan hesap seçimini geçersiz kılar.

### Signal

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15555550123", // isteğe bağlı hesap bağlama
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

- `channels.signal.account`: kanal başlangıcını belirli bir Signal hesap kimliğine sabitle.
- `channels.signal.configWrites`: Signal tarafından başlatılan yapılandırma yazımlarına izin ver veya bunları engelle.
- İsteğe bağlı `channels.signal.defaultAccount`, yapılandırılmış bir hesap kimliğiyle eşleştiğinde varsayılan hesap seçimini geçersiz kılar.

### BlueBubbles

BlueBubbles, önerilen iMessage yoludur (Plugin desteklidir, `channels.bluebubbles` altında yapılandırılır).

```json5
{
  channels: {
    bluebubbles: {
      enabled: true,
      dmPolicy: "pairing",
      // serverUrl, password, webhookPath, group controls ve gelişmiş actions:
      // bkz. /channels/bluebubbles
    },
  },
}
```

- Burada kapsanan çekirdek anahtar yolları: `channels.bluebubbles`, `channels.bluebubbles.dmPolicy`.
- İsteğe bağlı `channels.bluebubbles.defaultAccount`, yapılandırılmış bir hesap kimliğiyle eşleştiğinde varsayılan hesap seçimini geçersiz kılar.
- `type: "acp"` olan üst düzey `bindings[]` girdileri, BlueBubbles konuşmalarını kalıcı ACP oturumlarına bağlayabilir. `match.peer.id` içinde bir BlueBubbles handle veya hedef dizesi (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) kullanın. Paylaşılan alan anlamları: [ACP Agents](/tr/tools/acp-agents#channel-specific-settings).
- Tam BlueBubbles kanal yapılandırması [BlueBubbles](/tr/channels/bluebubbles) içinde belgelenmiştir.

### iMessage

OpenClaw, `imsg rpc` başlatır (stdio üzerinden JSON-RPC). Daemon veya port gerekmez.

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

- Messages DB için Full Disk Access gerekir.
- `chat_id:<id>` hedeflerini tercih edin. Sohbetleri listelemek için `imsg chats --limit 20` kullanın.
- `cliPath`, bir SSH sarmalayıcısına işaret edebilir; SCP ile ek getirme için `remoteHost` (`host` veya `user@host`) ayarlayın.
- `attachmentRoots` ve `remoteAttachmentRoots`, gelen ek yollarını sınırlar (varsayılan: `/Users/*/Library/Messages/Attachments`).
- SCP katı ana makine anahtarı denetimi kullanır, bu yüzden aktarıcı ana makine anahtarının zaten `~/.ssh/known_hosts` içinde bulunduğundan emin olun.
- `channels.imessage.configWrites`: iMessage tarafından başlatılan yapılandırma yazımlarına izin ver veya bunları engelle.
- `type: "acp"` olan üst düzey `bindings[]` girdileri, iMessage konuşmalarını kalıcı ACP oturumlarına bağlayabilir. `match.peer.id` içinde normalize edilmiş bir handle veya açık sohbet hedefi (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) kullanın. Paylaşılan alan anlamları: [ACP Agents](/tr/tools/acp-agents#channel-specific-settings).

<Accordion title="iMessage SSH sarmalayıcı örneği">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix, uzantı desteklidir ve `channels.matrix` altında yapılandırılır.

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
- `channels.matrix.network.dangerouslyAllowPrivateNetwork`, özel/dahili homeserver’lara izin verir. `proxy` ile bu ağ etkinleştirmesi birbirinden bağımsız denetimlerdir.
- `channels.matrix.defaultAccount`, çok hesaplı kurulumlarda tercih edilen hesabı seçer.
- `channels.matrix.autoJoin` varsayılan olarak `off` durumundadır, bu nedenle davet edilen odalar ve yeni DM tarzı davetler, `autoJoinAllowlist` ile `autoJoin: "allowlist"` veya `autoJoin: "always"` ayarlanana kadar yok sayılır.
- `channels.matrix.execApprovals`: Matrix yerel exec onay teslimi ve onaylayıcı yetkilendirmesi.
  - `enabled`: `true`, `false` veya `"auto"` (varsayılan). Otomatik modda exec onayları, onaylayıcılar `approvers` veya `commands.ownerAllowFrom` içinden çözümlenebildiğinde etkinleşir.
  - `approvers`: exec isteklerini onaylamasına izin verilen Matrix kullanıcı kimlikleri (ör. `@owner:example.org`).
  - `agentFilter`: isteğe bağlı ajan kimliği izin listesi. Tüm ajanlar için onayları iletmek üzere boş bırakın.
  - `sessionFilter`: isteğe bağlı oturum anahtarı desenleri (alt dize veya regex).
  - `target`: onay istemlerinin nereye gönderileceği. `"dm"` (varsayılan), `"channel"` (kaynak oda) veya `"both"`.
  - Hesap başına geçersiz kılmalar: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope`, Matrix DM’lerinin oturumlar içinde nasıl gruplanacağını kontrol eder: `per-user` (varsayılan) yönlendirilen eşe göre paylaşır, `per-room` ise her DM odasını yalıtır.
- Matrix durum yoklamaları ve canlı dizin aramaları, çalışma zamanı trafiğiyle aynı proxy ilkesini kullanır.
- Tam Matrix yapılandırması, hedefleme kuralları ve kurulum örnekleri [Matrix](/tr/channels/matrix) içinde belgelenmiştir.

### Microsoft Teams

Microsoft Teams, uzantı desteklidir ve `channels.msteams` altında yapılandırılır.

```json5
{
  channels: {
    msteams: {
      enabled: true,
      configWrites: true,
      // appId, appPassword, tenantId, webhook, team/channel policies:
      // bkz. /channels/msteams
    },
  },
}
```

- Burada kapsanan çekirdek anahtar yolları: `channels.msteams`, `channels.msteams.configWrites`.
- Tam Teams yapılandırması (kimlik bilgileri, Webhook, DM/grup ilkesi, takım başına/kanal başına geçersiz kılmalar) [Microsoft Teams](/tr/channels/msteams) içinde belgelenmiştir.

### IRC

IRC, uzantı desteklidir ve `channels.irc` altında yapılandırılır.

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
- Tam IRC kanal yapılandırması (host/port/TLS/channels/allowlists/mention gating) [IRC](/tr/channels/irc) içinde belgelenmiştir.

### Çok hesaplı (tüm kanallar)

Kanal başına birden çok hesap çalıştırın (her birinin kendi `accountId` değeri vardır):

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

- `accountId` belirtilmediğinde `default` kullanılır (CLI + yönlendirme).
- Ortam token’ları yalnızca **default** hesaba uygulanır.
- Temel kanal ayarları, hesap başına geçersiz kılınmadıkça tüm hesaplara uygulanır.
- Her hesabı farklı bir ajana yönlendirmek için `bindings[].match.accountId` kullanın.
- `openclaw channels add` (veya kanal onboarding) ile varsayılan olmayan bir hesap eklediğinizde, hala tek hesaplı üst düzey kanal yapılandırmasındaysanız, OpenClaw önce hesap kapsamlı üst düzey tek hesap değerlerini kanal hesap haritasına taşır; böylece özgün hesap çalışmaya devam eder. Çoğu kanal bunları `channels.<channel>.accounts.default` içine taşır; Matrix bunun yerine mevcut eşleşen adlı/varsayılan hedefi koruyabilir.
- Mevcut yalnızca kanal düzeyindeki bağlar (`accountId` olmadan) varsayılan hesapla eşleşmeye devam eder; hesap kapsamlı bağlar isteğe bağlı olmaya devam eder.
- `openclaw doctor --fix` da karışık şekilleri, o kanal için seçilen yükseltilmiş hesaba hesap kapsamlı üst düzey tek hesap değerlerini taşıyarak onarır. Çoğu kanal `accounts.default` kullanır; Matrix bunun yerine mevcut eşleşen adlı/varsayılan hedefi koruyabilir.

### Diğer uzantı kanalları

Birçok uzantı kanalı `channels.<id>` olarak yapılandırılır ve kendilerine özel kanal sayfalarında belgelenir (örneğin Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat ve Twitch).
Tam kanal dizini için bkz.: [Channels](/tr/channels).

### Grup sohbeti mention gating

Grup mesajları varsayılan olarak **mention gerektirir** (meta veri mention’ı veya güvenli regex desenleri). WhatsApp, Telegram, Discord, Google Chat ve iMessage grup sohbetleri için geçerlidir.

**Mention türleri:**

- **Meta veri mention’ları**: Yerel platform @-mention’ları. WhatsApp self-chat modunda yok sayılır.
- **Metin desenleri**: `agents.list[].groupChat.mentionPatterns` içindeki güvenli regex desenleri. Geçersiz desenler ve güvenli olmayan iç içe tekrarlar yok sayılır.
- Mention gating yalnızca algılama mümkün olduğunda uygulanır (yerel mention’lar veya en az bir desen).

```json5
{
  messages: {
    groupChat: { historyLimit: 50 },
  },
  agents: {
    list: [{ id: "main", groupChat: { mentionPatterns: ["@openclaw", "openclaw"] } }],
  },
}
```

`messages.groupChat.historyLimit` genel varsayılanı ayarlar. Kanallar bunu `channels.<channel>.historyLimit` ile (veya hesap başına) geçersiz kılabilir. Devre dışı bırakmak için `0` ayarlayın.

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

Çözümleme sırası: DM başına geçersiz kılma → sağlayıcı varsayılanı → sınır yok (hepsi tutulur).

Desteklenenler: `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `msteams`.

#### Self-chat modu

Kendi numaranızı `allowFrom` içine ekleyerek self-chat modunu etkinleştirin (yerel @-mention’ları yok sayar, yalnızca metin desenlerine yanıt verir):

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
    nativeSkills: "auto", // desteklendiğinde yerel Skills komutlarını kaydet
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

- Bu blok, komut yüzeylerini yapılandırır. Güncel yerleşik + bundled komut kataloğu için bkz. [Slash Commands](/tr/tools/slash-commands).
- Bu sayfa tam komut kataloğu değil, bir **yapılandırma anahtarı başvurusu**dur. QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, device-pair `/pair`, memory `/dreaming`, phone-control `/phone` ve Talk `/voice` gibi kanal/plugin sahipli komutlar, kanal/plugin sayfalarında ve [Slash Commands](/tr/tools/slash-commands) içinde belgelenmiştir.
- Metin komutları, başında `/` bulunan **bağımsız** mesajlar olmalıdır.
- `native: "auto"`, Discord/Telegram için yerel komutları açar, Slack’i kapalı bırakır.
- `nativeSkills: "auto"`, Discord/Telegram için yerel Skills komutlarını açar, Slack’i kapalı bırakır.
- Kanal başına geçersiz kılma: `channels.discord.commands.native` (bool veya `"auto"`). `false`, daha önce kaydedilmiş komutları temizler.
- Yerel skill kaydını kanal başına `channels.<provider>.commands.nativeSkills` ile geçersiz kılın.
- `channels.telegram.customCommands`, ek Telegram bot menü girdileri ekler.
- `bash: true`, ana makine kabuğu için `! <cmd>` kullanımını etkinleştirir. `tools.elevated.enabled` ve göndericinin `tools.elevated.allowFrom.<channel>` içinde olması gerekir.
- `config: true`, `/config` komutunu etkinleştirir (`openclaw.json` okur/yazar). Gateway `chat.send` istemcileri için kalıcı `/config set|unset` yazımları ayrıca `operator.admin` gerektirir; salt okunur `/config show`, normal yazma kapsamlı operator istemcileri için kullanılabilir olmaya devam eder.
- `mcp: true`, `mcp.servers` altındaki OpenClaw yönetimli MCP sunucu yapılandırması için `/mcp` komutunu etkinleştirir.
- `plugins: true`, Plugin keşfi, kurulum ve etkinleştirme/devre dışı bırakma denetimleri için `/plugins` komutunu etkinleştirir.
- `channels.<provider>.configWrites`, kanal başına yapılandırma değişikliklerini sınırlar (varsayılan: true).
- Çok hesaplı kanallar için `channels.<provider>.accounts.<id>.configWrites` da o hesabı hedefleyen yazımları sınırlar (örneğin `/allowlist --config --account <id>` veya `/config set channels.<provider>.accounts.<id>...`).
- `restart: false`, `/restart` ve Gateway yeniden başlatma aracı eylemlerini devre dışı bırakır. Varsayılan: `true`.
- `ownerAllowFrom`, yalnızca sahibine açık komutlar/araçlar için açık sahip izin listesidir. `allowFrom` listesinden ayrıdır.
- `ownerDisplay: "hash"`, sistem isteminde sahip kimliklerini hash’ler. Hash’lemeyi denetlemek için `ownerDisplaySecret` ayarlayın.
- `allowFrom`, sağlayıcı başınadır. Ayarlandığında **tek** yetkilendirme kaynağıdır (kanal izin listeleri/eşleştirme ve `useAccessGroups` yok sayılır).
- `useAccessGroups: false`, `allowFrom` ayarlanmadığında komutların erişim grubu ilkelerini atlamasına izin verir.
- Komut belgeleri eşlemesi:
  - yerleşik + bundled katalog: [Slash Commands](/tr/tools/slash-commands)
  - kanala özgü komut yüzeyleri: [Channels](/tr/channels)
  - QQ Bot komutları: [QQ Bot](/tr/channels/qqbot)
  - eşleştirme komutları: [Pairing](/tr/channels/pairing)
  - LINE kart komutu: [LINE](/tr/channels/line)
  - memory dreaming: [Dreaming](/tr/concepts/dreaming)

</Accordion>

---

## Ajan varsayılanları

### `agents.defaults.workspace`

Varsayılan: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

Sistem isteminin Runtime satırında gösterilen isteğe bağlı depo kökü. Ayarlanmazsa OpenClaw, çalışma alanından yukarı doğru yürüyerek otomatik algılar.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

`agents.list[].skills` ayarlamayan ajanlar için isteğe bağlı varsayılan skill izin listesi.

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // github, weather devralır
      { id: "docs", skills: ["docs-search"] }, // varsayılanların yerine geçer
      { id: "locked-down", skills: [] }, // skill yok
    ],
  },
}
```

- Varsayılan olarak kısıtlanmamış Skills için `agents.defaults.skills` alanını atlayın.
- Varsayılanları devralmak için `agents.list[].skills` alanını atlayın.
- Hiç skill olmaması için `agents.list[].skills: []` ayarlayın.
- Boş olmayan bir `agents.list[].skills` listesi, o ajan için son kümedir; varsayılanlarla birleştirilmez.

### `agents.defaults.skipBootstrap`

Çalışma alanı bootstrap dosyalarının (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`) otomatik oluşturulmasını devre dışı bırakır.

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.contextInjection`

Çalışma alanı bootstrap dosyalarının sistem istemine ne zaman ekleneceğini kontrol eder. Varsayılan: `"always"`.

- `"continuation-skip"`: güvenli devam turlarında (tamamlanmış bir asistan yanıtından sonra), çalışma alanı bootstrap yeniden eklenmesi atlanır; bu da istem boyutunu azaltır. Heartbeat çalıştırmaları ve Compaction sonrası yeniden denemeler yine de bağlamı yeniden oluşturur.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

Kesmeden önce çalışma alanı bootstrap dosyası başına azami karakter sayısı. Varsayılan: `12000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

Tüm çalışma alanı bootstrap dosyaları genelinde eklenen toplam azami karakter sayısı. Varsayılan: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

Bootstrap bağlamı kesildiğinde ajana görünür uyarı metnini kontrol eder.
Varsayılan: `"once"`.

- `"off"`: sistem istemine asla uyarı metni ekleme.
- `"once"`: benzersiz her kesme imzası için uyarıyı bir kez ekle (önerilir).
- `"always"`: kesme mevcut olduğunda her çalıştırmada uyarıyı ekle.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### Bağlam bütçesi sahiplik haritası

OpenClaw birden fazla yüksek hacimli istem/bağlam bütçesine sahiptir ve bunlar,
tek bir genel ayardan akmak yerine alt sistemlere göre bilinçli olarak
ayrılmıştır.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  normal çalışma alanı bootstrap ekleme işlemi.
- `agents.defaults.startupContext.*`:
  son günlük `memory/*.md` dosyaları dahil, tek seferlik `/new` ve `/reset`
  başlangıç girişi.
- `skills.limits.*`:
  sistem istemine eklenen kompakt Skills listesi.
- `agents.defaults.contextLimits.*`:
  sınırlı çalışma zamanı alıntıları ve çalışma zamanı sahipli eklenmiş bloklar.
- `memory.qmd.limits.*`:
  dizinlenmiş bellek arama parçacığı ve ekleme boyutlandırması.

Yalnızca bir ajanın farklı bir
bütçeye ihtiyaç duyduğu durumlarda eşleşen ajan başına geçersiz kılmayı kullanın:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Salt `/new` ve `/reset` çalıştırmalarında eklenen ilk tur başlangıç girişini kontrol eder.

```json5
{
  agents: {
    defaults: {
      startupContext: {
        enabled: true,
        applyOn: ["new", "reset"],
        dailyMemoryDays: 2,
        maxFileBytes: 16384,
        maxFileChars: 1200,
        maxTotalChars: 2800,
      },
    },
  },
}
```

#### `agents.defaults.contextLimits`

Sınırlı çalışma zamanı bağlam yüzeyleri için paylaşılan varsayılanlar.

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
        memoryGetDefaultLines: 120,
        toolResultMaxChars: 16000,
        postCompactionMaxChars: 1800,
      },
    },
  },
}
```

- `memoryGetMaxChars`: kesme meta verileri ve devam bildirimi eklenmeden önce varsayılan `memory_get` alıntı üst sınırı.
- `memoryGetDefaultLines`: `lines` belirtilmediğinde varsayılan `memory_get` satır penceresi.
- `toolResultMaxChars`: kalıcı sonuçlar ve taşma kurtarması için kullanılan canlı araç sonucu üst sınırı.
- `postCompactionMaxChars`: Compaction sonrası yenileme eklemesi sırasında kullanılan AGENTS.md alıntı üst sınırı.

#### `agents.list[].contextLimits`

Paylaşılan `contextLimits` ayarları için ajan başına geçersiz kılma. Atlanan alanlar
`agents.defaults.contextLimits` içinden devralınır.

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
        toolResultMaxChars: 16000,
      },
    },
    list: [
      {
        id: "tiny-local",
        contextLimits: {
          memoryGetMaxChars: 6000,
          toolResultMaxChars: 8000,
        },
      },
    ],
  },
}
```

#### `skills.limits.maxSkillsPromptChars`

Sistem istemine eklenen kompakt Skills listesi için genel üst sınır. Bu, isteğe göre `SKILL.md` dosyalarının okunmasını etkilemez.

```json5
{
  skills: {
    limits: {
      maxSkillsPromptChars: 18000,
    },
  },
}
```

#### `agents.list[].skillsLimits.maxSkillsPromptChars`

Skills istem bütçesi için ajan başına geçersiz kılma.

```json5
{
  agents: {
    list: [
      {
        id: "tiny-local",
        skillsLimits: {
          maxSkillsPromptChars: 6000,
        },
      },
    ],
  },
}
```

### `agents.defaults.imageMaxDimensionPx`

Sağlayıcı çağrılarından önce döküm/araç görüntü bloklarında görüntünün en uzun kenarı için azami piksel boyutu.
Varsayılan: `1200`.

Daha düşük değerler genellikle ekran görüntüsü ağırlıklı çalıştırmalarda vision token kullanımını ve istek yük boyutunu azaltır.
Daha yüksek değerler daha fazla görsel ayrıntıyı korur.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

Sistem istemi bağlamı için saat dilimi (mesaj zaman damgaları değil). Ana makine saat dilimine geri düşer.

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

Sistem istemindeki zaman biçimi. Varsayılan: `auto` (OS tercihi).

```json5
{
  agents: { defaults: { timeFormat: "auto" } }, // auto | 12 | 24
}
```

### `agents.defaults.model`

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": { alias: "opus" },
        "minimax/MiniMax-M2.7": { alias: "minimax" },
      },
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["minimax/MiniMax-M2.7"],
      },
      imageModel: {
        primary: "openrouter/qwen/qwen-2.5-vl-72b-instruct:free",
        fallbacks: ["openrouter/google/gemini-2.0-flash-vision:free"],
      },
      imageGenerationModel: {
        primary: "openai/gpt-image-1",
        fallbacks: ["google/gemini-3.1-flash-image-preview"],
      },
      videoGenerationModel: {
        primary: "qwen/wan2.6-t2v",
        fallbacks: ["qwen/wan2.6-i2v"],
      },
      pdfModel: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["openai/gpt-5.4-mini"],
      },
      params: { cacheRetention: "long" }, // genel varsayılan sağlayıcı parametreleri
      embeddedHarness: {
        runtime: "auto", // auto | pi | kayıtlı harness kimliği, ör. codex
        fallback: "pi", // pi | none
      },
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
      thinkingDefault: "low",
      verboseDefault: "off",
      elevatedDefault: "on",
      timeoutSeconds: 600,
      mediaMaxMb: 5,
      contextTokens: 200000,
      maxConcurrent: 3,
    },
  },
}
```

- `model`: ya bir dize (`"provider/model"`) ya da bir nesne (`{ primary, fallbacks }`) kabul eder.
  - Dize biçimi yalnızca birincil modeli ayarlar.
  - Nesne biçimi, birincil modeli ve sıralı yük devretme modellerini ayarlar.
- `imageModel`: ya bir dize (`"provider/model"`) ya da bir nesne (`{ primary, fallbacks }`) kabul eder.
  - Görüntü aracı yolunda vision-model yapılandırması olarak kullanılır.
  - Ayrıca seçilen/varsayılan model görüntü girdisini kabul edemediğinde geri dönüş yönlendirmesi için kullanılır.
- `imageGenerationModel`: ya bir dize (`"provider/model"`) ya da bir nesne (`{ primary, fallbacks }`) kabul eder.
  - Paylaşılan görüntü üretim yeteneği ve görüntü üreten gelecekteki tüm araç/plugin yüzeyleri tarafından kullanılır.
  - Tipik değerler: yerel Gemini görüntü üretimi için `google/gemini-3.1-flash-image-preview`, fal için `fal/fal-ai/flux/dev` veya OpenAI Images için `openai/gpt-image-1`.
  - Doğrudan bir sağlayıcı/model seçerseniz, eşleşen sağlayıcı kimlik doğrulamasını/API anahtarını da yapılandırın (örneğin `google/*` için `GEMINI_API_KEY` veya `GOOGLE_API_KEY`, `openai/*` için `OPENAI_API_KEY`, `fal/*` için `FAL_KEY`).
  - Atlanırsa `image_generate` yine de kimlik doğrulama destekli bir sağlayıcı varsayılanı çıkarabilir. Önce geçerli varsayılan sağlayıcıyı, ardından provider-id sırasındaki kalan kayıtlı görüntü üretim sağlayıcılarını dener.
- `musicGenerationModel`: ya bir dize (`"provider/model"`) ya da bir nesne (`{ primary, fallbacks }`) kabul eder.
  - Paylaşılan müzik üretim yeteneği ve yerleşik `music_generate` aracı tarafından kullanılır.
  - Tipik değerler: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` veya `minimax/music-2.5+`.
  - Atlanırsa `music_generate` yine de kimlik doğrulama destekli bir sağlayıcı varsayılanı çıkarabilir. Önce geçerli varsayılan sağlayıcıyı, ardından provider-id sırasındaki kalan kayıtlı müzik üretim sağlayıcılarını dener.
  - Doğrudan bir sağlayıcı/model seçerseniz, eşleşen sağlayıcı kimlik doğrulamasını/API anahtarını da yapılandırın.
- `videoGenerationModel`: ya bir dize (`"provider/model"`) ya da bir nesne (`{ primary, fallbacks }`) kabul eder.
  - Paylaşılan video üretim yeteneği ve yerleşik `video_generate` aracı tarafından kullanılır.
  - Tipik değerler: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` veya `qwen/wan2.7-r2v`.
  - Atlanırsa `video_generate` yine de kimlik doğrulama destekli bir sağlayıcı varsayılanı çıkarabilir. Önce geçerli varsayılan sağlayıcıyı, ardından provider-id sırasındaki kalan kayıtlı video üretim sağlayıcılarını dener.
  - Doğrudan bir sağlayıcı/model seçerseniz, eşleşen sağlayıcı kimlik doğrulamasını/API anahtarını da yapılandırın.
  - Bundled Qwen video üretim sağlayıcısı en fazla 1 çıktı videosu, 1 girdi görüntüsü, 4 girdi videosu, 10 saniye süre ve sağlayıcı düzeyinde `size`, `aspectRatio`, `resolution`, `audio` ve `watermark` seçeneklerini destekler.
- `pdfModel`: ya bir dize (`"provider/model"`) ya da bir nesne (`{ primary, fallbacks }`) kabul eder.
  - `pdf` aracı tarafından model yönlendirmesi için kullanılır.
  - Atlanırsa PDF aracı önce `imageModel` değerine, ardından çözümlenmiş oturum/varsayılan modele geri düşer.
- `pdfMaxBytesMb`: çağrı zamanında `maxBytesMb` geçirilmediğinde `pdf` aracı için varsayılan PDF boyut sınırı.
- `pdfMaxPages`: `pdf` aracında çıkarım geri dönüş modu tarafından dikkate alınan varsayılan azami sayfa sayısı.
- `verboseDefault`: ajanlar için varsayılan ayrıntı düzeyi. Değerler: `"off"`, `"on"`, `"full"`. Varsayılan: `"off"`.
- `elevatedDefault`: ajanlar için varsayılan elevated-output düzeyi. Değerler: `"off"`, `"on"`, `"ask"`, `"full"`. Varsayılan: `"on"`.
- `model.primary`: `provider/model` biçimindedir (ör. `openai/gpt-5.4`). Sağlayıcıyı atlarsanız OpenClaw önce bir takma adı, sonra tam bu model kimliği için benzersiz yapılandırılmış sağlayıcı eşleşmesini dener ve ancak ardından yapılandırılmış varsayılan sağlayıcıya geri düşer (bu artık kullanım dışı uyumluluk davranışıdır, bu yüzden açık `provider/model` tercih edin). Bu sağlayıcı artık yapılandırılmış varsayılan modeli sunmuyorsa, OpenClaw eski kaldırılmış sağlayıcı varsayılanını göstermeye devam etmek yerine ilk yapılandırılmış sağlayıcı/modele geri düşer.
- `models`: `/model` için yapılandırılmış model kataloğu ve izin listesi. Her girdi `alias` (kısayol) ve `params` (sağlayıcıya özgü; örneğin `temperature`, `maxTokens`, `cacheRetention`, `context1m`) içerebilir.
- `params`: tüm modellere uygulanan genel varsayılan sağlayıcı parametreleri. `agents.defaults.params` altında ayarlanır (ör. `{ cacheRetention: "long" }`).
- `params` birleştirme önceliği (yapılandırma): `agents.defaults.params` (genel temel), `agents.defaults.models["provider/model"].params` (model başına) tarafından geçersiz kılınır; ardından `agents.list[].params` (eşleşen ajan kimliği) anahtar başına geçersiz kılar. Ayrıntılar için bkz. [Prompt Caching](/tr/reference/prompt-caching).
- `embeddedHarness`: varsayılan düşük düzey gömülü ajan çalışma zamanı ilkesi. Kayıtlı plugin harness’lerinin desteklenen modelleri sahiplenmesine izin vermek için `runtime: "auto"` kullanın, yerleşik PI harness’ini zorlamak için `runtime: "pi"` kullanın veya `runtime: "codex"` gibi kayıtlı bir harness kimliği kullanın. Otomatik PI geri dönüşünü devre dışı bırakmak için `fallback: "none"` ayarlayın.
- Bu alanları değiştiren yapılandırma yazarları (örneğin `/models set`, `/models set-image` ve fallback ekleme/kaldırma komutları), standart nesne biçimini kaydeder ve mümkün olduğunda mevcut fallback listelerini korur.
- `maxConcurrent`: oturumlar arasında azami paralel ajan çalıştırma sayısıdır (her oturum yine serileştirilir). Varsayılan: 4.

### `agents.defaults.embeddedHarness`

`embeddedHarness`, gömülü ajan turlarını hangi düşük düzey yürütücünün çalıştıracağını kontrol eder.
Çoğu dağıtım varsayılan `{ runtime: "auto", fallback: "pi" }` değerini korumalıdır.
Bundled Codex app-server harness gibi güvenilir bir plugin yerel bir harness sağladığında bunu kullanın.

```json5
{
  agents: {
    defaults: {
      model: "codex/gpt-5.4",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

- `runtime`: `"auto"`, `"pi"` veya kayıtlı bir plugin harness kimliği. Bundled Codex plugin’i `codex` kimliğini kaydeder.
- `fallback`: `"pi"` veya `"none"`. `"pi"`, yerleşik PI harness’ini uyumluluk geri dönüşü olarak korur. `"none"`, eksik veya desteklenmeyen plugin harness seçiminin sessizce PI kullanması yerine başarısız olmasına neden olur.
- Ortam geçersiz kılmaları: `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>`, `runtime` değerini geçersiz kılar; `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, o süreç için PI geri dönüşünü devre dışı bırakır.
- Yalnızca Codex dağıtımları için `model: "codex/gpt-5.4"`, `embeddedHarness.runtime: "codex"` ve `embeddedHarness.fallback: "none"` ayarlayın.
- Bu yalnızca gömülü sohbet harness’ini kontrol eder. Medya üretimi, vision, PDF, müzik, video ve TTS yine kendi sağlayıcı/model ayarlarını kullanır.

**Yerleşik takma ad kısayolları** (yalnızca model `agents.defaults.models` içinde olduğunda uygulanır):

| Takma ad            | Model                                  |
| ------------------- | -------------------------------------- |
| `opus`              | `anthropic/claude-opus-4-6`            |
| `sonnet`            | `anthropic/claude-sonnet-4-6`          |
| `gpt`               | `openai/gpt-5.4`                       |
| `gpt-mini`          | `openai/gpt-5.4-mini`                  |
| `gpt-nano`          | `openai/gpt-5.4-nano`                  |
| `gemini`            | `google/gemini-3.1-pro-preview`        |
| `gemini-flash`      | `google/gemini-3-flash-preview`        |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview` |

Yapılandırdığınız takma adlar her zaman varsayılanlara üstün gelir.

Z.AI GLM-4.x modelleri, `--thinking off` ayarlamazsanız veya `agents.defaults.models["zai/<model>"].params.thinking` değerini kendiniz tanımlamazsanız thinking modunu otomatik olarak etkinleştirir.
Z.AI modelleri, araç çağrısı akışı için varsayılan olarak `tool_stream` etkinleştirir. Devre dışı bırakmak için `agents.defaults.models["zai/<model>"].params.tool_stream` değerini `false` yapın.
Anthropic Claude 4.6 modelleri, açık bir thinking düzeyi ayarlanmadığında varsayılan olarak `adaptive` thinking kullanır.

### `agents.defaults.cliBackends`

Yalnızca metin tabanlı geri dönüş çalıştırmaları için isteğe bağlı CLI arka uçları (araç çağrısı yok). API sağlayıcıları başarısız olduğunda yedek olarak kullanışlıdır.

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
        },
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          modelArg: "--model",
          sessionArg: "--session",
          sessionMode: "existing",
          systemPromptArg: "--system",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
        },
      },
    },
  },
}
```

- CLI arka uçları öncelikle metin içindir; araçlar her zaman devre dışıdır.
- `sessionArg` ayarlandığında oturumlar desteklenir.
- `imageArg` dosya yollarını kabul ettiğinde görüntü geçişi desteklenir.

### `agents.defaults.systemPromptOverride`

OpenClaw tarafından oluşturulan sistem isteminin tamamını sabit bir dizeyle değiştirin. Varsayılan düzeyde (`agents.defaults.systemPromptOverride`) veya ajan başına (`agents.list[].systemPromptOverride`) ayarlayın. Ajan başına değerler önceliklidir; boş veya yalnızca boşluk içeren değerler yok sayılır. Denetimli istem deneyleri için kullanışlıdır.

```json5
{
  agents: {
    defaults: {
      systemPromptOverride: "You are a helpful assistant.",
    },
  },
}
```

### `agents.defaults.heartbeat`

Düzenli Heartbeat çalıştırmaları.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m devre dışı bırakır
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        includeSystemPromptSection: true, // varsayılan: true; false, Heartbeat bölümünü sistem isteminden çıkarır
        lightContext: false, // varsayılan: false; true, çalışma alanı bootstrap dosyalarından yalnızca HEARTBEAT.md dosyasını tutar
        isolatedSession: false, // varsayılan: false; true, her Heartbeat çalıştırmasını yeni bir oturumda yürütür (konuşma geçmişi yok)
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (varsayılan) | block
        target: "none", // varsayılan: none | seçenekler: last | whatsapp | telegram | discord | ...
        prompt: "Read HEARTBEAT.md if it exists...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
        timeoutSeconds: 45,
      },
    },
  },
}
```

- `every`: süre dizesi (ms/s/m/h). Varsayılan: `30m` (API anahtarı kimlik doğrulaması) veya `1h` (OAuth kimlik doğrulaması). Devre dışı bırakmak için `0m` ayarlayın.
- `includeSystemPromptSection`: false olduğunda Heartbeat bölümünü sistem isteminden çıkarır ve `HEARTBEAT.md` dosyasının bootstrap bağlamına eklenmesini atlar. Varsayılan: `true`.
- `suppressToolErrorWarnings`: true olduğunda Heartbeat çalıştırmaları sırasında araç hata uyarısı yüklerini bastırır.
- `timeoutSeconds`: iptal edilmeden önce bir Heartbeat ajan turuna izin verilen azami saniye sayısı. Ayarlanmazsa `agents.defaults.timeoutSeconds` kullanılır.
- `directPolicy`: doğrudan/DM teslim ilkesi. `allow` (varsayılan) doğrudan hedef teslimine izin verir. `block`, doğrudan hedef teslimini bastırır ve `reason=dm-blocked` üretir.
- `lightContext`: true olduğunda Heartbeat çalıştırmaları hafif bootstrap bağlamı kullanır ve çalışma alanı bootstrap dosyalarından yalnızca `HEARTBEAT.md` dosyasını tutar.
- `isolatedSession`: true olduğunda her Heartbeat çalıştırması önceki konuşma geçmişi olmadan yeni bir oturumda yürütülür. Cron `sessionTarget: "isolated"` ile aynı yalıtım düzeni. Heartbeat başına token maliyetini yaklaşık ~100K’den ~2-5K token’a düşürür.
- Ajan başına: `agents.list[].heartbeat` ayarlayın. Herhangi bir ajan `heartbeat` tanımlarsa Heartbeat yalnızca **o ajanlar** için çalışır.
- Heartbeat’ler tam ajan turları çalıştırır — daha kısa aralıklar daha fazla token tüketir.

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // kayıtlı bir Compaction sağlayıcı plugin’inin kimliği (isteğe bağlı)
        timeoutSeconds: 900,
        reserveTokensFloor: 24000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // identifierPolicy=custom olduğunda kullanılır
        postCompactionSections: ["Session Startup", "Red Lines"], // [] yeniden eklemeyi devre dışı bırakır
        model: "openrouter/anthropic/claude-sonnet-4-6", // yalnızca Compaction için isteğe bağlı model geçersiz kılması
        notifyUser: true, // Compaction başladığında kullanıcıya kısa bir bildirim gönder (varsayılan: false)
        memoryFlush: {
          enabled: true,
          softThresholdTokens: 6000,
          systemPrompt: "Session nearing compaction. Store durable memories now.",
          prompt: "Write any lasting notes to memory/YYYY-MM-DD.md; reply with the exact silent token NO_REPLY if nothing to store.",
        },
      },
    },
  },
}
```

- `mode`: `default` veya `safeguard` (uzun geçmişler için parçalı özetleme). Bkz. [Compaction](/tr/concepts/compaction).
- `provider`: kayıtlı bir Compaction sağlayıcı plugin’inin kimliği. Ayarlandığında, yerleşik LLM özetlemesi yerine sağlayıcının `summarize()` işlevi çağrılır. Başarısızlıkta yerleşik olana geri düşer. Bir sağlayıcı ayarlamak `mode: "safeguard"` değerini zorunlu kılar. Bkz. [Compaction](/tr/concepts/compaction).
- `timeoutSeconds`: OpenClaw’ın tek bir Compaction işlemini iptal etmeden önce izin verdiği azami saniye sayısı. Varsayılan: `900`.
- `identifierPolicy`: `strict` (varsayılan), `off` veya `custom`. `strict`, Compaction özetlemesi sırasında yerleşik opak tanımlayıcı koruma yönergelerini başa ekler.
- `identifierInstructions`: `identifierPolicy=custom` olduğunda kullanılan isteğe bağlı özel tanımlayıcı koruma metni.
- `postCompactionSections`: Compaction sonrasında yeniden eklenecek isteğe bağlı AGENTS.md H2/H3 bölüm adları. Varsayılan olarak `["Session Startup", "Red Lines"]`; yeniden eklemeyi devre dışı bırakmak için `[]` ayarlayın. Ayarlanmadığında veya açıkça bu varsayılan çift olarak ayarlandığında, eski `Every Session`/`Safety` başlıkları da eski uyumluluk geri dönüşü olarak kabul edilir.
- `model`: yalnızca Compaction özetlemesi için isteğe bağlı `provider/model-id` geçersiz kılması. Ana oturumun bir modeli kullanmaya devam etmesi ancak Compaction özetlerinin başka bir modelde çalışması gerektiğinde bunu kullanın; ayarlanmadığında Compaction oturumun birincil modelini kullanır.
- `notifyUser`: `true` olduğunda, Compaction başladığında kullanıcıya kısa bir bildirim gönderir (örneğin, "Compacting context..."). Compaction’ı sessiz tutmak için varsayılan olarak devre dışıdır.
- `memoryFlush`: dayanıklı anıları saklamak için otomatik Compaction öncesinde sessiz ajan turu. Çalışma alanı salt okunursa atlanır.

### `agents.defaults.contextPruning`

LLM’ye göndermeden önce bellek içi bağlamdan **eski araç sonuçlarını** budar. Diskteki oturum geçmişini **değiştirmez**.

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // süre (ms/s/m/h), varsayılan birim: dakika
        keepLastAssistants: 3,
        softTrimRatio: 0.3,
        hardClearRatio: 0.5,
        minPrunableToolChars: 50000,
        softTrim: { maxChars: 4000, headChars: 1500, tailChars: 1500 },
        hardClear: { enabled: true, placeholder: "[Old tool result content cleared]" },
        tools: { deny: ["browser", "canvas"] },
      },
    },
  },
}
```

<Accordion title="cache-ttl modu davranışı">

- `mode: "cache-ttl"` budama geçişlerini etkinleştirir.
- `ttl`, budamanın yeniden ne sıklıkta çalışabileceğini kontrol eder (son önbellek dokunuşundan sonra).
- Budama önce büyük araç sonuçlarını yumuşak biçimde keser, gerekirse daha eski araç sonuçlarını tamamen temizler.

**Yumuşak kesme**, başı + sonu korur ve ortaya `...` ekler.

**Tam temizleme**, tüm araç sonucunu yer tutucuyla değiştirir.

Notlar:

- Görüntü blokları asla kesilmez/temizlenmez.
- Oranlar karakter tabanlıdır (yaklaşık), tam token sayıları değildir.
- `keepLastAssistants` sayısından daha az asistan mesajı varsa budama atlanır.

</Accordion>

Davranış ayrıntıları için bkz. [Session Pruning](/tr/concepts/session-pruning).

### Blok akışı

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200 },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off | natural | custom (minMs/maxMs kullanın)
    },
  },
}
```

- Telegram dışındaki kanallar, blok yanıtlarını etkinleştirmek için açık `*.blockStreaming: true` gerektirir.
- Kanal geçersiz kılmaları: `channels.<channel>.blockStreamingCoalesce` (ve hesap başına varyantlar). Signal/Slack/Discord/Google Chat varsayılanı `minChars: 1500`.
- `humanDelay`: blok yanıtlar arasında rastgele duraklama. `natural` = 800–2500 ms. Ajan başına geçersiz kılma: `agents.list[].humanDelay`.

Davranış + parçalama ayrıntıları için bkz. [Streaming](/tr/concepts/streaming).

### Yazıyor göstergeleri

```json5
{
  agents: {
    defaults: {
      typingMode: "instant", // never | instant | thinking | message
      typingIntervalSeconds: 6,
    },
  },
}
```

- Varsayılanlar: doğrudan sohbetler/mention’lar için `instant`, mention içermeyen grup sohbetleri için `message`.
- Oturum başına geçersiz kılmalar: `session.typingMode`, `session.typingIntervalSeconds`.

Bkz. [Typing Indicators](/tr/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Gömülü ajan için isteğe bağlı sandbox kullanımı. Tam kılavuz için bkz. [Sandboxing](/tr/gateway/sandboxing).

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off | non-main | all
        backend: "docker", // docker | ssh | openshell
        scope: "agent", // session | agent | shared
        workspaceAccess: "none", // none | ro | rw
        workspaceRoot: "~/.openclaw/sandboxes",
        docker: {
          image: "openclaw-sandbox:bookworm-slim",
          containerPrefix: "openclaw-sbx-",
          workdir: "/workspace",
          readOnlyRoot: true,
          tmpfs: ["/tmp", "/var/tmp", "/run"],
          network: "none",
          user: "1000:1000",
          capDrop: ["ALL"],
          env: { LANG: "C.UTF-8" },
          setupCommand: "apt-get update && apt-get install -y git curl jq",
          pidsLimit: 256,
          memory: "1g",
          memorySwap: "2g",
          cpus: 1,
          ulimits: {
            nofile: { soft: 1024, hard: 2048 },
            nproc: 256,
          },
          seccompProfile: "/path/to/seccomp.json",
          apparmorProfile: "openclaw-sandbox",
          dns: ["1.1.1.1", "8.8.8.8"],
          extraHosts: ["internal.service:10.0.0.5"],
          binds: ["/home/user/source:/source:rw"],
        },
        ssh: {
          target: "user@gateway-host:22",
          command: "ssh",
          workspaceRoot: "/tmp/openclaw-sandboxes",
          strictHostKeyChecking: true,
          updateHostKeys: true,
          identityFile: "~/.ssh/id_ed25519",
          certificateFile: "~/.ssh/id_ed25519-cert.pub",
          knownHostsFile: "~/.ssh/known_hosts",
          // SecretRef / satır içi içerik de desteklenir:
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
        browser: {
          enabled: false,
          image: "openclaw-sandbox-browser:bookworm-slim",
          network: "openclaw-sandbox-browser",
          cdpPort: 9222,
          cdpSourceRange: "172.21.0.1/32",
          vncPort: 5900,
          noVncPort: 6080,
          headless: false,
          enableNoVnc: true,
          allowHostControl: false,
          autoStart: true,
          autoStartTimeoutMs: 12000,
        },
        prune: {
          idleHours: 24,
          maxAgeDays: 7,
        },
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        allow: [
          "exec",
          "process",
          "read",
          "write",
          "edit",
          "apply_patch",
          "sessions_list",
          "sessions_history",
          "sessions_send",
          "sessions_spawn",
          "session_status",
        ],
        deny: ["browser", "canvas", "nodes", "cron", "discord", "gateway"],
      },
    },
  },
}
```

<Accordion title="Sandbox ayrıntıları">

**Arka uç:**

- `docker`: yerel Docker çalışma zamanı (varsayılan)
- `ssh`: genel SSH tabanlı uzak çalışma zamanı
- `openshell`: OpenShell çalışma zamanı

`backend: "openshell"` seçildiğinde, çalışma zamanına özgü ayarlar
`plugins.entries.openshell.config` altına taşınır.

**SSH arka uç yapılandırması:**

- `target`: `user@host[:port]` biçiminde SSH hedefi
- `command`: SSH istemci komutu (varsayılan: `ssh`)
- `workspaceRoot`: kapsam başına çalışma alanları için kullanılan mutlak uzak kök
- `identityFile` / `certificateFile` / `knownHostsFile`: OpenSSH’ye geçirilen mevcut yerel dosyalar
- `identityData` / `certificateData` / `knownHostsData`: çalışma zamanında OpenClaw’ın geçici dosyalara dönüştürdüğü satır içi içerikler veya SecretRef’ler
- `strictHostKeyChecking` / `updateHostKeys`: OpenSSH ana makine anahtarı ilkesi ayarları

**SSH kimlik doğrulama önceliği:**

- `identityData`, `identityFile` üzerinde önceliklidir
- `certificateData`, `certificateFile` üzerinde önceliklidir
- `knownHostsData`, `knownHostsFile` üzerinde önceliklidir
- SecretRef destekli `*Data` değerleri, sandbox oturumu başlamadan önce etkin gizli bilgiler çalışma zamanı anlık görüntüsünden çözümlenir

**SSH arka uç davranışı:**

- oluşturma veya yeniden oluşturmadan sonra uzak çalışma alanını bir kez hazırlar
- sonra uzak SSH çalışma alanını standart kaynak olarak korur
- `exec`, dosya araçları ve medya yollarını SSH üzerinden yönlendirir
- uzak değişiklikleri otomatik olarak ana makineye geri eşitlemez
- sandbox tarayıcı kapsayıcılarını desteklemez

**Çalışma alanı erişimi:**

- `none`: `~/.openclaw/sandboxes` altında kapsam başına sandbox çalışma alanı
- `ro`: `/workspace` altında sandbox çalışma alanı, `/agent` altında ajanın çalışma alanı salt okunur bağlanır
- `rw`: ajanın çalışma alanı `/workspace` altında okuma/yazma bağlanır

**Kapsam:**

- `session`: oturum başına kapsayıcı + çalışma alanı
- `agent`: ajan başına tek kapsayıcı + çalışma alanı (varsayılan)
- `shared`: paylaşılan kapsayıcı ve çalışma alanı (oturumlar arası yalıtım yok)

**OpenShell Plugin yapılandırması:**

```json5
{
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          mode: "mirror", // mirror | remote
          from: "openclaw",
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
          gateway: "lab", // isteğe bağlı
          gatewayEndpoint: "https://lab.example", // isteğe bağlı
          policy: "strict", // isteğe bağlı OpenShell ilke kimliği
          providers: ["openai"], // isteğe bağlı
          autoProviders: true,
          timeoutSeconds: 120,
        },
      },
    },
  },
}
```

**OpenShell modu:**

- `mirror`: yürütmeden önce uzağı yerelden hazırlar, yürütmeden sonra geri eşitler; yerel çalışma alanı standart kaynak olarak kalır
- `remote`: sandbox oluşturulduğunda uzağı bir kez hazırlar, sonra uzak çalışma alanını standart kaynak olarak korur

`remote` modunda, OpenClaw dışında yapılan ana makine yerel düzenlemeleri hazırlama adımından sonra sandbox içine otomatik olarak eşitlenmez.
Taşıma SSH ile OpenShell sandbox’una yapılır, ancak sandbox yaşam döngüsü ve isteğe bağlı mirror eşitlemesi plugin’e aittir.

**`setupCommand`**, kapsayıcı oluşturulduktan sonra bir kez çalışır (`sh -lc` ile). Ağ çıkışı, yazılabilir kök ve root kullanıcı gerektirir.

**Kapsayıcılar varsayılan olarak `network: "none"` kullanır** — ajan dış erişime ihtiyaç duyuyorsa `"bridge"` (veya özel bir bridge ağı) olarak ayarlayın.
`"host"` engellenir. `"container:<id>"` varsayılan olarak engellenir; yalnızca
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` ayarını açıkça etkinleştirirseniz izin verilir (cam kırma).

**Gelen ekler**, etkin çalışma alanındaki `media/inbound/*` içine hazırlanır.

**`docker.binds`**, ek ana makine dizinlerini bağlar; genel ve ajan başına bağlar birleştirilir.

**Sandbox tarayıcısı** (`sandbox.browser.enabled`): kapsayıcı içinde Chromium + CDP. noVNC URL’si sistem istemine eklenir. `openclaw.json` içinde `browser.enabled` gerektirmez.
noVNC gözlemci erişimi varsayılan olarak VNC kimlik doğrulaması kullanır ve OpenClaw paylaşılan URL’de parolayı göstermek yerine kısa ömürlü bir token URL üretir.

- `allowHostControl: false` (varsayılan), sandbox’lı oturumların ana makine tarayıcısını hedeflemesini engeller.
- `network` varsayılan olarak `openclaw-sandbox-browser` kullanır (ayrılmış bridge ağı). Genel bridge bağlantısını açıkça istemediğiniz sürece yalnızca `bridge` ayarlayın.
- `cdpSourceRange`, isteğe bağlı olarak CDP girişini kapsayıcı kenarında bir CIDR aralığıyla sınırlar (örneğin `172.21.0.1/32`).
- `sandbox.browser.binds`, ek ana makine dizinlerini yalnızca sandbox tarayıcı kapsayıcısına bağlar. Ayarlandığında (`[]` dahil), tarayıcı kapsayıcısı için `docker.binds` değerinin yerini alır.
- Başlatma varsayılanları `scripts/sandbox-browser-entrypoint.sh` içinde tanımlanmıştır ve kapsayıcı ana makineleri için ayarlanmıştır:
  - `--remote-debugging-address=127.0.0.1`
  - `--remote-debugging-port=<OPENCLAW_BROWSER_CDP_PORT değerinden türetilir>`
  - `--user-data-dir=${HOME}/.chrome`
  - `--no-first-run`
  - `--no-default-browser-check`
  - `--disable-3d-apis`
  - `--disable-gpu`
  - `--disable-software-rasterizer`
  - `--disable-dev-shm-usage`
  - `--disable-background-networking`
  - `--disable-features=TranslateUI`
  - `--disable-breakpad`
  - `--disable-crash-reporter`
  - `--renderer-process-limit=2`
  - `--no-zygote`
  - `--metrics-recording-only`
  - `--disable-extensions` (varsayılan olarak etkin)
  - `--disable-3d-apis`, `--disable-software-rasterizer` ve `--disable-gpu`
    varsayılan olarak etkindir; WebGL/3D kullanımı gerektiriyorsa
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` ile devre dışı bırakılabilir.
  - İş akışınız
    bunlara bağlıysa `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0`, uzantıları yeniden etkinleştirir.
  - `--renderer-process-limit=2`,
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` ile değiştirilebilir; Chromium’un
    varsayılan süreç sınırını kullanmak için `0` ayarlayın.
  - ayrıca `noSandbox` etkin olduğunda `--no-sandbox` ve `--disable-setuid-sandbox`.
  - Varsayılanlar kapsayıcı görüntüsü temel değerleridir; kapsayıcı varsayılanlarını değiştirmek için özel giriş noktasına sahip özel bir tarayıcı görüntüsü kullanın.

</Accordion>

Tarayıcı sandbox kullanımı ve `sandbox.docker.binds` yalnızca Docker içindir.

Görüntüleri oluşturun:

```bash
scripts/sandbox-setup.sh           # ana sandbox görüntüsü
scripts/sandbox-browser-setup.sh   # isteğe bağlı tarayıcı görüntüsü
```

### `agents.list` (ajan başına geçersiz kılmalar)

```json5
{
  agents: {
    list: [
      {
        id: "main",
        default: true,
        name: "Main Agent",
        workspace: "~/.openclaw/workspace",
        agentDir: "~/.openclaw/agents/main/agent",
        model: "anthropic/claude-opus-4-6", // veya { primary, fallbacks }
        thinkingDefault: "high", // ajan başına thinking düzeyi geçersiz kılması
        reasoningDefault: "on", // ajan başına reasoning görünürlüğü geçersiz kılması
        fastModeDefault: false, // ajan başına hızlı mod geçersiz kılması
        embeddedHarness: { runtime: "auto", fallback: "pi" },
        params: { cacheRetention: "none" }, // eşleşen defaults.models params değerlerini anahtar bazında geçersiz kılar
        skills: ["docs-search"], // ayarlandığında agents.defaults.skills yerine geçer
        identity: {
          name: "Samantha",
          theme: "helpful sloth",
          emoji: "🦥",
          avatar: "avatars/samantha.png",
        },
        groupChat: { mentionPatterns: ["@openclaw"] },
        sandbox: { mode: "off" },
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
        subagents: { allowAgents: ["*"] },
        tools: {
          profile: "coding",
          allow: ["browser"],
          deny: ["canvas"],
          elevated: { enabled: true },
        },
      },
    ],
  },
}
```

- `id`: kararlı ajan kimliği (zorunlu).
- `default`: birden fazlası ayarlanırsa ilki kazanır (uyarı günlüğe yazılır). Hiçbiri ayarlanmazsa ilk liste girdisi varsayılandır.
- `model`: dize biçimi yalnızca `primary` değerini geçersiz kılar; nesne biçimi `{ primary, fallbacks }` her ikisini de geçersiz kılar (`[]` genel fallback’leri devre dışı bırakır). Yalnızca `primary` değerini geçersiz kılan Cron işleri, `fallbacks: []` ayarlamazsanız yine varsayılan fallback’leri devralır.
- `params`: `agents.defaults.models` içindeki seçili model girdisinin üstüne birleştirilen ajan başına akış parametreleri. Tüm model kataloğunu yinelemeden `cacheRetention`, `temperature` veya `maxTokens` gibi ajana özgü geçersiz kılmalar için bunu kullanın.
- `skills`: isteğe bağlı ajan başına skill izin listesi. Atlanırsa ajan, ayarlanmışsa `agents.defaults.skills` değerini devralır; açık bir liste varsayılanlarla birleşmek yerine onların yerini alır ve `[]` hiç skill olmadığı anlamına gelir.
- `thinkingDefault`: isteğe bağlı ajan başına varsayılan thinking düzeyi (`off | minimal | low | medium | high | xhigh | adaptive`). Mesaj başına veya oturum düzeyinde geçersiz kılma ayarlanmadığında bu ajan için `agents.defaults.thinkingDefault` değerini geçersiz kılar.
- `reasoningDefault`: isteğe bağlı ajan başına varsayılan reasoning görünürlüğü (`on | off | stream`). Mesaj başına veya oturum düzeyinde reasoning geçersiz kılması ayarlanmadığında uygulanır.
- `fastModeDefault`: isteğe bağlı ajan başına hızlı mod varsayılanı (`true | false`). Mesaj başına veya oturum düzeyinde hızlı mod geçersiz kılması ayarlanmadığında uygulanır.
- `embeddedHarness`: isteğe bağlı ajan başına düşük düzey harness ilkesi geçersiz kılması. Bir ajanı yalnızca Codex yaparken diğer ajanların varsayılan PI fallback’ini koruması için `{ runtime: "codex", fallback: "none" }` kullanın.
- `runtime`: isteğe bağlı ajan başına çalışma zamanı tanımlayıcısı. Ajanın varsayılan olarak ACP harness oturumlarını kullanması gerektiğinde `runtime.acp` varsayılanlarıyla (`agent`, `backend`, `mode`, `cwd`) birlikte `type: "acp"` kullanın.
- `identity.avatar`: çalışma alanına göreli yol, `http(s)` URL’si veya `data:` URI.
- `identity`, varsayılanları türetir: `ackReaction` değeri `emoji` içinden, `mentionPatterns` değeri `name`/`emoji` içinden.
- `subagents.allowAgents`: `sessions_spawn` için ajan kimliği izin listesi (`["*"]` = herhangi biri; varsayılan: yalnızca aynı ajan).
- Sandbox devralma koruması: istekte bulunan oturum sandbox içindeyse `sessions_spawn`, sandbox dışında çalışacak hedefleri reddeder.
- `subagents.requireAgentId`: true olduğunda `agentId` belirtilmeyen `sessions_spawn` çağrılarını engeller (açık profil seçimini zorunlu kılar; varsayılan: false).

---

## Çok ajanlı yönlendirme

Tek bir Gateway içinde birden çok yalıtılmış ajan çalıştırın. Bkz. [Multi-Agent](/tr/concepts/multi-agent).

```json5
{
  agents: {
    list: [
      { id: "home", default: true, workspace: "~/.openclaw/workspace-home" },
      { id: "work", workspace: "~/.openclaw/workspace-work" },
    ],
  },
  bindings: [
    { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
  ],
}
```

### Bağlama eşleşme alanları

- `type` (isteğe bağlı): normal yönlendirme için `route` (eksik `type` değeri varsayılan olarak route olur), kalıcı ACP konuşma bağları için `acp`.
- `match.channel` (zorunlu)
- `match.accountId` (isteğe bağlı; `*` = herhangi bir hesap; atlanırsa = varsayılan hesap)
- `match.peer` (isteğe bağlı; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (isteğe bağlı; kanala özgü)
- `acp` (isteğe bağlı; yalnızca `type: "acp"` için): `{ mode, label, cwd, backend }`

**Deterministik eşleşme sırası:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (tam eşleşme, peer/guild/team olmadan)
5. `match.accountId: "*"` (kanal genelinde)
6. Varsayılan ajan

Her katmanda ilk eşleşen `bindings` girdisi kazanır.

`type: "acp"` girdileri için OpenClaw, tam konuşma kimliğine göre çözümler (`match.channel` + hesap + `match.peer.id`) ve yukarıdaki route bağlama katman sırasını kullanmaz.

### Ajan başına erişim profilleri

<Accordion title="Tam erişim (sandbox yok)">

```json5
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: { mode: "off" },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="Salt okunur araçlar + çalışma alanı">

```json5
{
  agents: {
    list: [
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "ro" },
        tools: {
          allow: [
            "read",
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
          ],
          deny: ["write", "edit", "apply_patch", "exec", "process", "browser"],
        },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="Dosya sistemi erişimi yok (yalnızca mesajlaşma)">

```json5
{
  agents: {
    list: [
      {
        id: "public",
        workspace: "~/.openclaw/workspace-public",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "none" },
        tools: {
          allow: [
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
            "whatsapp",
            "telegram",
            "slack",
            "discord",
            "gateway",
          ],
          deny: [
            "read",
            "write",
            "edit",
            "apply_patch",
            "exec",
            "process",
            "browser",
            "canvas",
            "nodes",
            "cron",
            "gateway",
            "image",
          ],
        },
      },
    ],
  },
}
```

</Accordion>

Öncelik ayrıntıları için bkz. [Multi-Agent Sandbox & Tools](/tr/tools/multi-agent-sandbox-tools).

---

## Oturum

```json5
{
  session: {
    scope: "per-sender",
    dmScope: "main", // main | per-peer | per-channel-peer | per-account-channel-peer
    identityLinks: {
      alice: ["telegram:123456789", "discord:987654321012345678"],
    },
    reset: {
      mode: "daily", // daily | idle
      atHour: 4,
      idleMinutes: 60,
    },
    resetByType: {
      thread: { mode: "daily", atHour: 4 },
      direct: { mode: "idle", idleMinutes: 240 },
      group: { mode: "idle", idleMinutes: 120 },
    },
    resetTriggers: ["/new", "/reset"],
    store: "~/.openclaw/agents/{agentId}/sessions/sessions.json",
    parentForkMaxTokens: 100000, // bu token sayısının üstünde üst iş parçacığı fork’unu atla (0 devre dışı bırakır)
    maintenance: {
      mode: "warn", // warn | enforce
      pruneAfter: "30d",
      maxEntries: 500,
      rotateBytes: "10mb",
      resetArchiveRetention: "30d", // süre veya false
      maxDiskBytes: "500mb", // isteğe bağlı kesin bütçe
      highWaterBytes: "400mb", // isteğe bağlı temizleme hedefi
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // saat cinsinden varsayılan hareketsizlik otomatik odak kaldırma (`0` devre dışı bırakır)
      maxAgeHours: 0, // saat cinsinden varsayılan kesin azami yaş (`0` devre dışı bırakır)
    },
    mainKey: "main", // eski (çalışma zamanı her zaman "main" kullanır)
    agentToAgent: { maxPingPongTurns: 5 },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="Oturum alanı ayrıntıları">

- **`scope`**: grup sohbeti bağlamları için temel oturum gruplama stratejisi.
  - `per-sender` (varsayılan): her gönderici, kanal bağlamı içinde yalıtılmış bir oturum alır.
  - `global`: bir kanal bağlamındaki tüm katılımcılar tek bir oturumu paylaşır (yalnızca paylaşılan bağlam istendiğinde kullanın).
- **`dmScope`**: DM’lerin nasıl gruplanacağını belirler.
  - `main`: tüm DM’ler ana oturumu paylaşır.
  - `per-peer`: kanallar arasında gönderici kimliğine göre yalıtır.
  - `per-channel-peer`: kanal + gönderici başına yalıtır (çok kullanıcılı gelen kutuları için önerilir).
  - `per-account-channel-peer`: hesap + kanal + gönderici başına yalıtır (çok hesaplı kullanım için önerilir).
- **`identityLinks`**: kanallar arası oturum paylaşımı için standart kimlikleri sağlayıcı önekli eşlere eşler.
- **`reset`**: birincil sıfırlama ilkesi. `daily`, yerel saatte `atHour` zamanında sıfırlar; `idle`, `idleMinutes` sonrasında sıfırlar. Her ikisi de yapılandırılmışsa önce süresi dolan kazanır.
- **`resetByType`**: tür başına geçersiz kılmalar (`direct`, `group`, `thread`). Eski `dm`, `direct` için takma ad olarak kabul edilir.
- **`parentForkMaxTokens`**: çatallanmış iş parçacığı oturumu oluşturulurken izin verilen üst oturum `totalTokens` üst sınırı (varsayılan `100000`).
  - Üst `totalTokens` bu değerin üzerindeyse, OpenClaw üst oturum döküm geçmişini devralmak yerine yeni bir iş parçacığı oturumu başlatır.
  - Bu korumayı devre dışı bırakmak ve her zaman üst çatallanmasına izin vermek için `0` ayarlayın.
- **`mainKey`**: eski alan. Çalışma zamanı ana doğrudan sohbet kovası için her zaman `"main"` kullanır.
- **`agentToAgent.maxPingPongTurns`**: ajandan ajana değişimlerde ajanlar arasındaki azami geri yanıt turu sayısı (tam sayı, aralık: `0`–`5`). `0`, ping-pong zincirlemesini devre dışı bırakır.
- **`sendPolicy`**: `channel`, `chatType` (`direct|group|channel`, eski `dm` takma adıyla), `keyPrefix` veya `rawKeyPrefix` ile eşleştirme yapar. İlk deny kazanır.
- **`maintenance`**: oturum deposu temizleme + saklama denetimleri.
  - `mode`: `warn` yalnızca uyarı üretir; `enforce` temizlemeyi uygular.
  - `pruneAfter`: eski girdiler için yaş kesme sınırı (varsayılan `30d`).
  - `maxEntries`: `sessions.json` içindeki azami girdi sayısı (varsayılan `500`).
  - `rotateBytes`: `sessions.json` bu boyutu aştığında döndürülür (varsayılan `10mb`).
  - `resetArchiveRetention`: `*.reset.<timestamp>` döküm arşivleri için saklama süresi. Varsayılan olarak `pruneAfter`; devre dışı bırakmak için `false` ayarlayın.
  - `maxDiskBytes`: oturumlar dizini için isteğe bağlı disk bütçesi. `warn` modunda uyarı kaydeder; `enforce` modunda önce en eski yapıları/oturumları kaldırır.
  - `highWaterBytes`: bütçe temizliğinden sonraki isteğe bağlı hedef. Varsayılan olarak `maxDiskBytes` değerinin `%80`’idir.
- **`threadBindings`**: iş parçacığına bağlı oturum özellikleri için genel varsayılanlar.
  - `enabled`: ana varsayılan anahtar (sağlayıcılar geçersiz kılabilir; Discord `channels.discord.threadBindings.enabled` kullanır)
  - `idleHours`: saat cinsinden varsayılan hareketsizlik sonrası otomatik odak kaldırma (`0` devre dışı bırakır; sağlayıcılar geçersiz kılabilir)
  - `maxAgeHours`: saat cinsinden varsayılan kesin azami yaş (`0` devre dışı bırakır; sağlayıcılar geçersiz kılabilir)

</Accordion>

---

## Mesajlar

```json5
{
  messages: {
    responsePrefix: "🦞", // veya "auto"
    ackReaction: "👀",
    ackReactionScope: "group-mentions", // group-mentions | group-all | direct | all
    removeAckAfterReply: false,
    queue: {
      mode: "collect", // steer | followup | collect | steer-backlog | steer+backlog | queue | interrupt
      debounceMs: 1000,
      cap: 20,
      drop: "summarize", // old | new | summarize
      byChannel: {
        whatsapp: "collect",
        telegram: "collect",
      },
    },
    inbound: {
      debounceMs: 2000, // 0 devre dışı bırakır
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
      },
    },
  },
}
```

### Yanıt öneki

Kanal/hesap başına geçersiz kılmalar: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`.

Çözümleme (en özel olan kazanır): hesap → kanal → genel. `""` devre dışı bırakır ve zinciri durdurur. `"auto"`, `[{identity.name}]` türetir.

**Şablon değişkenleri:**

| Değişken         | Açıklama                | Örnek                       |
| ---------------- | ----------------------- | --------------------------- |
| `{model}`        | Kısa model adı          | `claude-opus-4-6`           |
| `{modelFull}`    | Tam model tanımlayıcısı | `anthropic/claude-opus-4-6` |
| `{provider}`     | Sağlayıcı adı           | `anthropic`                 |
| `{thinkingLevel}`| Geçerli thinking düzeyi | `high`, `low`, `off`        |
| `{identity.name}`| Ajan kimlik adı         | (`"auto"` ile aynı)         |

Değişkenler büyük/küçük harfe duyarsızdır. `{think}`, `{thinkingLevel}` için takma addır.

### Onay tepkisi

- Varsayılan olarak etkin ajanın `identity.emoji` değeri kullanılır, aksi halde `"👀"`. Devre dışı bırakmak için `""` ayarlayın.
- Kanal başına geçersiz kılmalar: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Çözümleme sırası: hesap → kanal → `messages.ackReaction` → kimlik geri dönüşü.
- Kapsam: `group-mentions` (varsayılan), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: Slack, Discord ve Telegram’da yanıttan sonra onayı kaldırır.
- `messages.statusReactions.enabled`: Slack, Discord ve Telegram’da yaşam döngüsü durum tepkilerini etkinleştirir.
  Slack ve Discord’da ayarlanmazsa, onay tepkileri etkin olduğunda durum tepkileri etkin kalır.
  Telegram’da yaşam döngüsü durum tepkilerini etkinleştirmek için bunu açıkça `true` olarak ayarlayın.

### Gelen debounce

Aynı göndericiden gelen hızlı yalnızca metin mesajlarını tek bir ajan turunda toplar. Medya/ekler hemen boşaltılır. Kontrol komutları debounce işlemini atlar.

### TTS (metinden konuşmaya)

```json5
{
  messages: {
    tts: {
      auto: "always", // off | always | inbound | tagged
      mode: "final", // final | all
      provider: "elevenlabs",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: { enabled: true },
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
      elevenlabs: {
        apiKey: "elevenlabs_api_key",
        baseUrl: "https://api.elevenlabs.io",
        voiceId: "voice_id",
        modelId: "eleven_multilingual_v2",
        seed: 42,
        applyTextNormalization: "auto",
        languageCode: "en",
        voiceSettings: {
          stability: 0.5,
          similarityBoost: 0.75,
          style: 0.0,
          useSpeakerBoost: true,
          speed: 1.0,
        },
      },
      openai: {
        apiKey: "openai_api_key",
        baseUrl: "https://api.openai.com/v1",
        model: "gpt-4o-mini-tts",
        voice: "alloy",
      },
    },
  },
}
```

- `auto`, varsayılan otomatik TTS modunu kontrol eder: `off`, `always`, `inbound` veya `tagged`. `/tts on|off` yerel tercihleri geçersiz kılabilir ve `/tts status` etkin durumu gösterir.
- `summaryModel`, otomatik özet için `agents.defaults.model.primary` değerini geçersiz kılar.
- `modelOverrides` varsayılan olarak etkindir; `modelOverrides.allowProvider` varsayılan olarak `false` değerindedir (isteğe bağlı etkinleştirme gerekir).
- API anahtarları, geri dönüş olarak `ELEVENLABS_API_KEY`/`XI_API_KEY` ve `OPENAI_API_KEY` kullanır.
- `openai.baseUrl`, OpenAI TTS uç noktasını geçersiz kılar. Çözümleme sırası yapılandırma, sonra `OPENAI_TTS_BASE_URL`, sonra `https://api.openai.com/v1`.
- `openai.baseUrl`, OpenAI dışı bir uç noktayı işaret ettiğinde OpenClaw bunu OpenAI uyumlu bir TTS sunucusu olarak değerlendirir ve model/ses doğrulamasını gevşetir.

---

## Talk

Talk modu için varsayılanlar (macOS/iOS/Android).

```json5
{
  talk: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "elevenlabs_voice_id",
        voiceAliases: {
          Clawd: "EXAVITQu4vr4xnSDxMaL",
          Roger: "CwhRBWXzGAHq8TQ4Fs17",
        },
        modelId: "eleven_v3",
        outputFormat: "mp3_44100_128",
        apiKey: "elevenlabs_api_key",
      },
    },
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

- Birden fazla Talk sağlayıcısı yapılandırıldığında `talk.provider`, `talk.providers` içindeki bir anahtarla eşleşmelidir.
- Eski düz Talk anahtarları (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) yalnızca uyumluluk içindir ve otomatik olarak `talk.providers.<provider>` içine taşınır.
- Voice ID’ler geri dönüş olarak `ELEVENLABS_VOICE_ID` veya `SAG_VOICE_ID` kullanır.
- `providers.*.apiKey`, düz metin dizelerini veya SecretRef nesnelerini kabul eder.
- `ELEVENLABS_API_KEY` geri dönüşü yalnızca hiçbir Talk API anahtarı yapılandırılmadığında uygulanır.
- `providers.*.voiceAliases`, Talk yönergelerinin kolay adlar kullanmasına izin verir.
- `silenceTimeoutMs`, Talk modunun dökümü göndermeden önce kullanıcı sessizliğinden sonra ne kadar bekleyeceğini kontrol eder. Ayarlanmamışsa platformun varsayılan duraklama penceresi korunur (`macOS ve Android’de 700 ms, iOS’ta 900 ms`).

---

## Araçlar

### Araç profilleri

`tools.profile`, `tools.allow`/`tools.deny` öncesinde temel bir izin listesi ayarlar:

Yerel onboarding, ayarlanmamış yeni yerel yapılandırmaları varsayılan olarak `tools.profile: "coding"` yapar (mevcut açık profiller korunur).

| Profil      | İçerir                                                                                                                          |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | yalnızca `session_status`                                                                                                       |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                      |
| `full`      | Kısıtlama yok (ayarlanmamış ile aynı)                                                                                            |

### Araç grupları

| Grup               | Araçlar                                                                                                                |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash`, `exec` için takma ad olarak kabul edilir)                                |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                 |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status` |
| `group:memory`     | `memory_search`, `memory_get`                                                                                          |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                  |
| `group:ui`         | `browser`, `canvas`                                                                                                    |
| `group:automation` | `cron`, `gateway`                                                                                                      |
| `group:messaging`  | `message`                                                                                                              |
| `group:nodes`      | `nodes`                                                                                                                |
| `group:agents`     | `agents_list`                                                                                                          |
| `group:media`      | `image`, `image_generate`, `video_generate`, `tts`                                                                     |
| `group:openclaw`   | Tüm yerleşik araçlar (sağlayıcı plugin’leri hariç)                                                                     |

### `tools.allow` / `tools.deny`

Genel araç izin/verme-denetleme ilkesi (deny kazanır). Büyük/küçük harfe duyarsızdır, `*` joker karakterlerini destekler. Docker sandbox kapalıyken bile uygulanır.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

### `tools.byProvider`

Belirli sağlayıcılar veya modeller için araçları daha da kısıtlar. Sıra: temel profil → sağlayıcı profili → allow/deny.

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
      "openai/gpt-5.4": { allow: ["group:fs", "sessions_list"] },
    },
  },
}
```

### `tools.elevated`

Sandbox dışındaki elevated exec erişimini kontrol eder:

```json5
{
  tools: {
    elevated: {
      enabled: true,
      allowFrom: {
        whatsapp: ["+15555550123"],
        discord: ["1234567890123", "987654321098765432"],
      },
    },
  },
}
```

- Ajan başına geçersiz kılma (`agents.list[].tools.elevated`) yalnızca daha fazla kısıtlayabilir.
- `/elevated on|off|ask|full`, durumu oturum başına saklar; satır içi yönergeler yalnızca tek bir mesaja uygulanır.
- Elevated `exec`, sandbox kullanımını atlar ve yapılandırılmış kaçış yolunu kullanır (varsayılan olarak `gateway`, exec hedefi `node` olduğunda `node`).

### `tools.exec`

```json5
{
  tools: {
    exec: {
      backgroundMs: 10000,
      timeoutSec: 1800,
      cleanupMs: 1800000,
      notifyOnExit: true,
      notifyOnExitEmptySuccess: false,
      applyPatch: {
        enabled: false,
        allowModels: ["gpt-5.4"],
      },
    },
  },
}
```

### `tools.loopDetection`

Araç döngüsü güvenlik denetimleri varsayılan olarak **devre dışıdır**. Algılamayı etkinleştirmek için `enabled: true` ayarlayın.
Ayarlar genel olarak `tools.loopDetection` altında tanımlanabilir ve ajan başına `agents.list[].tools.loopDetection` altında geçersiz kılınabilir.

```json5
{
  tools: {
    loopDetection: {
      enabled: true,
      historySize: 30,
      warningThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
    },
  },
}
```

- `historySize`: döngü analizi için tutulan azami araç çağrısı geçmişi.
- `warningThreshold`: uyarılar için tekrarlayan ilerleme yok desen eşiği.
- `criticalThreshold`: kritik döngüleri engellemek için daha yüksek tekrar eşiği.
- `globalCircuitBreakerThreshold`: herhangi bir ilerleme olmayan çalıştırma için kesin durdurma eşiği.
- `detectors.genericRepeat`: aynı araç/aynı argüman çağrıları tekrarlandığında uyarır.
- `detectors.knownPollNoProgress`: bilinen yoklama araçlarında (`process.poll`, `command_status` vb.) ilerleme olmadığında uyarır/engeller.
- `detectors.pingPong`: dönüşümlü ilerleme olmayan çift desenlerinde uyarır/engeller.
- `warningThreshold >= criticalThreshold` veya `criticalThreshold >= globalCircuitBreakerThreshold` ise doğrulama başarısız olur.

### `tools.web`

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "brave_api_key", // veya BRAVE_API_KEY ortam değişkeni
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        provider: "firecrawl", // isteğe bağlı; otomatik algılama için atlayın
        maxChars: 50000,
        maxCharsCap: 50000,
        maxResponseBytes: 2000000,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        readability: true,
        userAgent: "custom-ua",
      },
    },
  },
}
```

### `tools.media`

Gelen medya anlamlandırmasını yapılandırır (görüntü/ses/video):

```json5
{
  tools: {
    media: {
      concurrency: 2,
      asyncCompletion: {
        directSend: false, // isteğe bağlı etkinleştirme: tamamlanan async müzik/videoyu doğrudan kanala gönder
      },
      audio: {
        enabled: true,
        maxBytes: 20971520,
        scope: {
          default: "deny",
          rules: [{ action: "allow", match: { chatType: "direct" } }],
        },
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          { type: "cli", command: "whisper", args: ["--model", "base", "{{MediaPath}}"] },
        ],
      },
      video: {
        enabled: true,
        maxBytes: 52428800,
        models: [{ provider: "google", model: "gemini-3-flash-preview" }],
      },
    },
  },
}
```

<Accordion title="Medya model girdisi alanları">

**Sağlayıcı girdisi** (`type: "provider"` veya atlanmış):

- `provider`: API sağlayıcı kimliği (`openai`, `anthropic`, `google`/`gemini`, `groq` vb.)
- `model`: model kimliği geçersiz kılması
- `profile` / `preferredProfile`: `auth-profiles.json` profil seçimi

**CLI girdisi** (`type: "cli"`):

- `command`: çalıştırılacak yürütülebilir dosya
- `args`: şablonlu argümanlar (`{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}` vb. destekler)

**Ortak alanlar:**

- `capabilities`: isteğe bağlı liste (`image`, `audio`, `video`). Varsayılanlar: `openai`/`anthropic`/`minimax` → image, `google` → image+audio+video, `groq` → audio.
- `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: girdi başına geçersiz kılmalar.
- Hatalarda bir sonraki girdiye geri düşülür.

Sağlayıcı kimlik doğrulaması standart sırayı izler: `auth-profiles.json` → ortam değişkenleri → `models.providers.*.apiKey`.

**Async tamamlama alanları:**

- `asyncCompletion.directSend`: `true` olduğunda tamamlanan async `music_generate`
  ve `video_generate` görevleri önce doğrudan kanal teslimini dener. Varsayılan: `false`
  (eski istekte bulunan oturum uyandırma/model teslim yolu).

</Accordion>

### `tools.agentToAgent`

```json5
{
  tools: {
    agentToAgent: {
      enabled: false,
      allow: ["home", "work"],
    },
  },
}
```

### `tools.sessions`

Oturum araçları (`sessions_list`, `sessions_history`, `sessions_send`) tarafından hangi oturumların hedeflenebileceğini kontrol eder.

Varsayılan: `tree` (geçerli oturum + onun tarafından başlatılmış oturumlar, örneğin alt ajanlar).

```json5
{
  tools: {
    sessions: {
      // "self" | "tree" | "agent" | "all"
      visibility: "tree",
    },
  },
}
```

Notlar:

- `self`: yalnızca geçerli oturum anahtarı.
- `tree`: geçerli oturum + geçerli oturum tarafından başlatılmış oturumlar (alt ajanlar).
- `agent`: geçerli ajan kimliğine ait herhangi bir oturum (aynı ajan kimliği altında gönderici başına oturumlar çalıştırıyorsanız diğer kullanıcıları da içerebilir).
- `all`: herhangi bir oturum. Ajanlar arası hedefleme yine de `tools.agentToAgent` gerektirir.
- Sandbox kelepçesi: geçerli oturum sandbox içindeyse ve `agents.defaults.sandbox.sessionToolsVisibility="spawned"` ise, `tools.sessions.visibility="all"` olsa bile görünürlük `tree` olarak zorlanır.

### `tools.sessions_spawn`

`sessions_spawn` için satır içi ek desteğini kontrol eder.

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // isteğe bağlı etkinleştirme: satır içi dosya eklerine izin vermek için true ayarlayın
        maxTotalBytes: 5242880, // tüm dosyalar genelinde toplam 5 MB
        maxFiles: 50,
        maxFileBytes: 1048576, // dosya başına 1 MB
        retainOnSessionKeep: false, // cleanup="keep" olduğunda ekleri koru
      },
    },
  },
}
```

Notlar:

- Ekler yalnızca `runtime: "subagent"` için desteklenir. ACP çalışma zamanı bunları reddeder.
- Dosyalar alt çalışma alanında `.openclaw/attachments/<uuid>/` içine `.manifest.json` ile birlikte materyalize edilir.
- Ek içeriği döküm kalıcılığından otomatik olarak redakte edilir.
- Base64 girdileri katı alfabe/dolgu denetimleri ve kod çözme öncesi boyut korumasıyla doğrulanır.
- Dosya izinleri dizinler için `0700`, dosyalar için `0600` değerindedir.
- Temizleme `cleanup` ilkesini izler: `delete` ekleri her zaman kaldırır; `keep`, yalnızca `retainOnSessionKeep: true` ise bunları korur.

### `tools.experimental`

Deneysel yerleşik araç bayrakları. Sıkı ajan davranışlı GPT-5 otomatik etkinleştirme kuralı uygulanmadıkça varsayılan olarak kapalıdır.

```json5
{
  tools: {
    experimental: {
      planTool: true, // deneysel update_plan aracını etkinleştir
    },
  },
}
```

Notlar:

- `planTool`: önemsiz olmayan çok adımlı iş takibi için yapılandırılmış `update_plan` aracını etkinleştirir.
- Varsayılan: `false`; ancak `agents.defaults.embeddedPi.executionContract` (veya ajan başına bir geçersiz kılma) bir OpenAI veya OpenAI Codex GPT-5 ailesi çalıştırması için `"strict-agentic"` olarak ayarlanmışsa istisna vardır. Bu kapsam dışında aracı zorla açmak için `true`, sıkı ajan davranışlı GPT-5 çalıştırmalarında bile kapalı tutmak için `false` ayarlayın.
- Etkinleştirildiğinde sistem istemi ayrıca kullanım yönergeleri ekler; böylece model bunu yalnızca önemli işler için kullanır ve en fazla bir adımı `in_progress` olarak tutar.

### `agents.defaults.subagents`

```json5
{
  agents: {
    defaults: {
      subagents: {
        allowAgents: ["research"],
        model: "minimax/MiniMax-M2.7",
        maxConcurrent: 8,
        runTimeoutSeconds: 900,
        archiveAfterMinutes: 60,
      },
    },
  },
}
```

- `model`: başlatılan alt ajanlar için varsayılan model. Atlanırsa alt ajanlar çağıranın modelini devralır.
- `allowAgents`: istekte bulunan ajan kendi `subagents.allowAgents` değerini ayarlamıyorsa `sessions_spawn` için hedef ajan kimliklerinin varsayılan izin listesi (`["*"]` = herhangi biri; varsayılan: yalnızca aynı ajan).
- `runTimeoutSeconds`: araç çağrısı `runTimeoutSeconds` alanını atladığında `sessions_spawn` için varsayılan zaman aşımı (saniye). `0`, zaman aşımı olmadığı anlamına gelir.
- Alt ajan başına araç ilkesi: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## Özel sağlayıcılar ve temel URL’ler

OpenClaw yerleşik model kataloğunu kullanır. Özel sağlayıcıları yapılandırmada `models.providers` üzerinden veya `~/.openclaw/agents/<agentId>/agent/models.json` içinde ekleyin.

```json5
{
  models: {
    mode: "merge", // merge (varsayılan) | replace
    providers: {
      "custom-proxy": {
        baseUrl: "http://localhost:4000/v1",
        apiKey: "LITELLM_KEY",
        api: "openai-completions", // openai-completions | openai-responses | anthropic-messages | google-generative-ai
        models: [
          {
            id: "llama-3.1-8b",
            name: "Llama 3.1 8B",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            contextTokens: 96000,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

- Özel kimlik doğrulama ihtiyaçları için `authHeader: true` + `headers` kullanın.
- Ajan yapılandırma kökünü `OPENCLAW_AGENT_DIR` ile geçersiz kılın (veya eski ortam değişkeni takma adı olan `PI_CODING_AGENT_DIR`).
- Eşleşen sağlayıcı kimlikleri için birleştirme önceliği:
  - Boş olmayan ajan `models.json` `baseUrl` değerleri kazanır.
  - Boş olmayan ajan `apiKey` değerleri yalnızca o sağlayıcı geçerli yapılandırma/auth-profile bağlamında SecretRef tarafından yönetilmiyorsa kazanır.
  - SecretRef tarafından yönetilen sağlayıcı `apiKey` değerleri, çözümlenmiş gizli değerleri kalıcılaştırmak yerine kaynak işaretleyicilerinden (`ENV_VAR_NAME` ortam ref’leri için, dosya/exec ref’leri için `secretref-managed`) yenilenir.
  - SecretRef tarafından yönetilen sağlayıcı başlık değerleri, kaynak işaretleyicilerinden (`secretref-env:ENV_VAR_NAME` ortam ref’leri için, dosya/exec ref’leri için `secretref-managed`) yenilenir.
  - Boş veya eksik ajan `apiKey`/`baseUrl` değerleri, yapılandırmadaki `models.providers` değerlerine geri düşer.
  - Eşleşen model `contextWindow`/`maxTokens` değerleri, açık yapılandırma ile örtük katalog değerleri arasından daha yüksek olanı kullanır.
  - Eşleşen model `contextTokens`, mevcutsa açık çalışma zamanı sınırını korur; yerel model meta verisini değiştirmeden etkili bağlamı sınırlamak için bunu kullanın.
  - Yapılandırmanın `models.json` dosyasını tamamen yeniden yazmasını istediğinizde `models.mode: "replace"` kullanın.
  - İşaretleyici kalıcılığı kaynak bakımından yetkilidir: işaretleyiciler çözümlenmiş çalışma zamanı gizli değerlerinden değil, etkin kaynak yapılandırma anlık görüntüsünden (çözümleme öncesi) yazılır.

### Sağlayıcı alanı ayrıntıları

- `models.mode`: sağlayıcı katalog davranışı (`merge` veya `replace`).
- `models.providers`: sağlayıcı kimliğine göre anahtarlanan özel sağlayıcı haritası.
- `models.providers.*.api`: istek bağdaştırıcısı (`openai-completions`, `openai-responses`, `anthropic-messages`, `google-generative-ai` vb.).
- `models.providers.*.apiKey`: sağlayıcı kimlik bilgisi (SecretRef/ortam değişkeni yerleştirmesi tercih edilir).
- `models.providers.*.auth`: kimlik doğrulama stratejisi (`api-key`, `token`, `oauth`, `aws-sdk`).
- `models.providers.*.injectNumCtxForOpenAICompat`: Ollama + `openai-completions` için isteklere `options.num_ctx` ekler (varsayılan: `true`).
- `models.providers.*.authHeader`: gerektiğinde kimlik bilgisinin `Authorization` başlığında taşınmasını zorunlu kılar.
- `models.providers.*.baseUrl`: yukarı akış API temel URL’si.
- `models.providers.*.headers`: proxy/kiracı yönlendirmesi için ek statik başlıklar.
- `models.providers.*.request`: model-sağlayıcı HTTP istekleri için taşıma geçersiz kılmaları.
  - `request.headers`: ek başlıklar (sağlayıcı varsayılanlarıyla birleştirilir). Değerler SecretRef kabul eder.
  - `request.auth`: kimlik doğrulama stratejisi geçersiz kılması. Modlar: `"provider-default"` (sağlayıcının yerleşik kimlik doğrulamasını kullan), `"authorization-bearer"` (`token` ile), `"header"` (`headerName`, `value`, isteğe bağlı `prefix` ile).
  - `request.proxy`: HTTP proxy geçersiz kılması. Modlar: `"env-proxy"` (`HTTP_PROXY`/`HTTPS_PROXY` ortam değişkenlerini kullan), `"explicit-proxy"` (`url` ile). Her iki mod da isteğe bağlı `tls` alt nesnesini kabul eder.
  - `request.tls`: doğrudan bağlantılar için TLS geçersiz kılması. Alanlar: `ca`, `cert`, `key`, `passphrase` (hepsi SecretRef kabul eder), `serverName`, `insecureSkipVerify`.
  - `request.allowPrivateNetwork`: `true` olduğunda, DNS özel, CGNAT veya benzer aralıklara çözümlendiğinde sağlayıcı HTTP fetch koruması üzerinden `baseUrl` için HTTPS’e izin verir (güvenilen self-hosted OpenAI uyumlu uç noktalar için operatör isteğe bağlı etkinleştirmesi). WebSocket, başlıklar/TLS için aynı `request` değerini kullanır ancak bu fetch SSRF korumasını kullanmaz. Varsayılan `false`.
- `models.providers.*.models`: açık sağlayıcı model katalog girdileri.
- `models.providers.*.models.*.contextWindow`: yerel model bağlam penceresi meta verisi.
- `models.providers.*.models.*.contextTokens`: isteğe bağlı çalışma zamanı bağlam sınırı. Modelin yerel `contextWindow` değerinden daha küçük etkili bir bağlam bütçesi istediğinizde bunu kullanın.
- `models.providers.*.models.*.compat.supportsDeveloperRole`: isteğe bağlı uyumluluk ipucu. `api: "openai-completions"` ile boş olmayan yerel olmayan bir `baseUrl` için (ana makine `api.openai.com` değilse), OpenClaw bunu çalışma zamanında `false` yapar. Boş/atlanmış `baseUrl`, varsayılan OpenAI davranışını korur.
- `models.providers.*.models.*.compat.requiresStringContent`: yalnızca dize kabul eden OpenAI uyumlu sohbet uç noktaları için isteğe bağlı uyumluluk ipucu. `true` olduğunda OpenClaw, isteği göndermeden önce yalnızca metin içeren `messages[].content` dizilerini düz dizelere indirger.
- `plugins.entries.amazon-bedrock.config.discovery`: Bedrock otomatik keşif ayarları kökü.
- `plugins.entries.amazon-bedrock.config.discovery.enabled`: örtük keşfi aç/kapat.
- `plugins.entries.amazon-bedrock.config.discovery.region`: keşif için AWS bölgesi.
- `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: hedefli keşif için isteğe bağlı sağlayıcı kimliği filtresi.
- `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: keşif yenileme yoklama aralığı.
- `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: keşfedilen modeller için geri dönüş bağlam penceresi.
- `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: keşfedilen modeller için geri dönüş azami çıktı token sayısı.

### Sağlayıcı örnekleri

<Accordion title="Cerebras (GLM 4.6 / 4.7)">

```json5
{
  env: { CEREBRAS_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: {
        primary: "cerebras/zai-glm-4.7",
        fallbacks: ["cerebras/zai-glm-4.6"],
      },
      models: {
        "cerebras/zai-glm-4.7": { alias: "GLM 4.7 (Cerebras)" },
        "cerebras/zai-glm-4.6": { alias: "GLM 4.6 (Cerebras)" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      cerebras: {
        baseUrl: "https://api.cerebras.ai/v1",
        apiKey: "${CEREBRAS_API_KEY}",
        api: "openai-completions",
        models: [
          { id: "zai-glm-4.7", name: "GLM 4.7 (Cerebras)" },
          { id: "zai-glm-4.6", name: "GLM 4.6 (Cerebras)" },
        ],
      },
    },
  },
}
```

Cerebras için `cerebras/zai-glm-4.7`; doğrudan Z.AI için `zai/glm-4.7` kullanın.

</Accordion>

<Accordion title="OpenCode">

```json5
{
  agents: {
    defaults: {
      model: { primary: "opencode/claude-opus-4-6" },
      models: { "opencode/claude-opus-4-6": { alias: "Opus" } },
    },
  },
}
```

`OPENCODE_API_KEY` (veya `OPENCODE_ZEN_API_KEY`) ayarlayın. Zen kataloğu için `opencode/...`, Go kataloğu için `opencode-go/...` başvurularını kullanın. Kısayol: `openclaw onboard --auth-choice opencode-zen` veya `openclaw onboard --auth-choice opencode-go`.

</Accordion>

<Accordion title="Z.AI (GLM-4.7)">

```json5
{
  agents: {
    defaults: {
      model: { primary: "zai/glm-4.7" },
      models: { "zai/glm-4.7": {} },
    },
  },
}
```

`ZAI_API_KEY` ayarlayın. `z.ai/*` ve `z-ai/*` kabul edilen takma adlardır. Kısayol: `openclaw onboard --auth-choice zai-api-key`.

- Genel uç nokta: `https://api.z.ai/api/paas/v4`
- Kodlama uç noktası (varsayılan): `https://api.z.ai/api/coding/paas/v4`
- Genel uç nokta için temel URL geçersiz kılmasına sahip özel bir sağlayıcı tanımlayın.

</Accordion>

<Accordion title="Moonshot AI (Kimi)">

```json5
{
  env: { MOONSHOT_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "moonshot/kimi-k2.5" },
      models: { "moonshot/kimi-k2.5": { alias: "Kimi K2.5" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "kimi-k2.5",
            name: "Kimi K2.5",
            reasoning: false,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 262144,
          },
        ],
      },
    },
  },
}
```

Çin uç noktası için: `baseUrl: "https://api.moonshot.cn/v1"` veya `openclaw onboard --auth-choice moonshot-api-key-cn`.

Yerel Moonshot uç noktaları, paylaşılan
`openai-completions` taşıması üzerinde akış kullanımı uyumluluğu tanıtır ve OpenClaw bunu yalnızca yerleşik sağlayıcı kimliğine değil, uç nokta yeteneklerine göre anahtarlır.

</Accordion>

<Accordion title="Kimi Coding">

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "kimi/kimi-code" },
      models: { "kimi/kimi-code": { alias: "Kimi Code" } },
    },
  },
}
```

Anthropic uyumlu, yerleşik sağlayıcı. Kısayol: `openclaw onboard --auth-choice kimi-code-api-key`.

</Accordion>

<Accordion title="Synthetic (Anthropic-compatible)">

```json5
{
  env: { SYNTHETIC_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" },
      models: { "synthetic/hf:MiniMaxAI/MiniMax-M2.5": { alias: "MiniMax M2.5" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "hf:MiniMaxAI/MiniMax-M2.5",
            name: "MiniMax M2.5",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 192000,
            maxTokens: 65536,
          },
        ],
      },
    },
  },
}
```

Temel URL `/v1` içermemelidir (Anthropic istemcisi bunu ekler). Kısayol: `openclaw onboard --auth-choice synthetic-api-key`.

</Accordion>

<Accordion title="MiniMax M2.7 (direct)">

```json5
{
  agents: {
    defaults: {
      model: { primary: "minimax/MiniMax-M2.7" },
      models: {
        "minimax/MiniMax-M2.7": { alias: "Minimax" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      minimax: {
        baseUrl: "https://api.minimax.io/anthropic",
        apiKey: "${MINIMAX_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "MiniMax-M2.7",
            name: "MiniMax M2.7",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0.375 },
            contextWindow: 204800,
            maxTokens: 131072,
          },
        ],
      },
    },
  },
}
```

`MINIMAX_API_KEY` ayarlayın. Kısayollar:
`openclaw onboard --auth-choice minimax-global-api` veya
`openclaw onboard --auth-choice minimax-cn-api`.
Model kataloğu varsayılan olarak yalnızca M2.7’dir.
Anthropic uyumlu akış yolunda OpenClaw, siz açıkça `thinking` ayarlamadıkça MiniMax thinking özelliğini varsayılan olarak devre dışı bırakır. `/fast on` veya `params.fastMode: true`, `MiniMax-M2.7` değerini `MiniMax-M2.7-highspeed` olarak yeniden yazar.

</Accordion>

<Accordion title="Yerel modeller (LM Studio)">

Bkz. [Local Models](/tr/gateway/local-models). Kısaca: ciddi donanımda LM Studio Responses API üzerinden büyük bir yerel model çalıştırın; geri dönüş için hosted modelleri birleştirilmiş halde tutun.

</Accordion>

---

## Skills

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun
    },
    entries: {
      "image-lab": {
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // veya düz metin dize
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`: yalnızca bundled Skills için isteğe bağlı izin listesi (yönetilen/çalışma alanı Skills etkilenmez).
- `load.extraDirs`: ek paylaşılan skill kökleri (en düşük öncelik).
- `install.preferBrew`: `true` olduğunda ve `brew` kullanılabiliyorsa, diğer yükleyici türlerine geri düşmeden önce Homebrew yükleyicilerini tercih eder.
- `install.nodeManager`: `metadata.openclaw.install`
  belirtimleri için node yükleyici tercihi (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false`, skill bundled/yüklü olsa bile devre dışı bırakır.
- `entries.<skillKey>.apiKey`: birincil ortam değişkeni tanımlayan Skills için kolaylık alanı (düz metin dize veya SecretRef nesnesi).

---

## Plugins

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: [],
    load: {
      paths: ["~/Projects/oss/voice-call-extension"],
    },
    entries: {
      "voice-call": {
        enabled: true,
        hooks: {
          allowPromptInjection: false,
        },
        config: { provider: "twilio" },
      },
    },
  },
}
```

- `~/.openclaw/extensions`, `<workspace>/.openclaw/extensions` ve `plugins.load.paths` içinden yüklenir.
- Keşif, yerel OpenClaw plugin’lerini ve uyumlu Codex bundle’larını ile Claude bundle’larını kabul eder; buna manifest içermeyen Claude varsayılan düzen bundle’ları da dahildir.
- **Yapılandırma değişiklikleri Gateway yeniden başlatması gerektirir.**
- `allow`: isteğe bağlı izin listesi (yalnızca listelenen plugin’ler yüklenir). `deny` kazanır.
- `plugins.entries.<id>.apiKey`: plugin düzeyinde API anahtarı kolaylık alanı (plugin destekliyorsa).
- `plugins.entries.<id>.env`: plugin kapsamlı ortam değişkeni haritası.
- `plugins.entries.<id>.hooks.allowPromptInjection`: `false` olduğunda çekirdek `before_prompt_build` işlemini engeller ve eski `before_agent_start` içindeki istem değiştirici alanları yok sayar; ancak eski `modelOverride` ve `providerOverride` korunur. Yerel plugin hook’larına ve desteklenen bundle tarafından sağlanan hook dizinlerine uygulanır.
- `plugins.entries.<id>.subagent.allowModelOverride`: bu plugin’e arka plan alt ajan çalıştırmaları için çalışma başına `provider` ve `model` geçersiz kılmaları isteme konusunda açıkça güven.
- `plugins.entries.<id>.subagent.allowedModels`: güvenilen alt ajan geçersiz kılmaları için isteğe bağlı standart `provider/model` hedef izin listesi. Yalnızca bilinçli olarak herhangi bir modele izin vermek istediğinizde `"*"` kullanın.
- `plugins.entries.<id>.config`: plugin tarafından tanımlanan yapılandırma nesnesi (mevcutsa yerel OpenClaw plugin şeması ile doğrulanır).
- `plugins.entries.firecrawl.config.webFetch`: Firecrawl web-fetch sağlayıcı ayarları.
  - `apiKey`: Firecrawl API anahtarı (SecretRef kabul eder). `plugins.entries.firecrawl.config.webSearch.apiKey`, eski `tools.web.fetch.firecrawl.apiKey` veya `FIRECRAWL_API_KEY` ortam değişkenine geri düşer.
  - `baseUrl`: Firecrawl API temel URL’si (varsayılan: `https://api.firecrawl.dev`).
  - `onlyMainContent`: sayfalardan yalnızca ana içeriği çıkar (varsayılan: `true`).
  - `maxAgeMs`: azami önbellek yaşı milisaniye cinsinden (varsayılan: `172800000` / 2 gün).
  - `timeoutSeconds`: scrape isteği zaman aşımı saniye cinsinden (varsayılan: `60`).
- `plugins.entries.xai.config.xSearch`: xAI X Search (Grok web araması) ayarları.
  - `enabled`: X Search sağlayıcısını etkinleştir.
  - `model`: arama için kullanılacak Grok modeli (ör. `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: memory dreaming ayarları. Aşamalar ve eşikler için bkz. [Dreaming](/tr/concepts/dreaming).
  - `enabled`: ana dreaming anahtarı (varsayılan `false`).
  - `frequency`: her tam dreaming taraması için Cron sıklığı (varsayılan olarak `"0 3 * * *"`).
  - aşama ilkesi ve eşikler uygulama ayrıntılarıdır (kullanıcıya dönük yapılandırma anahtarları değildir).
- Tam bellek yapılandırması [Bellek yapılandırma başvurusu](/tr/reference/memory-config) içindedir:
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Etkin Claude bundle plugin’leri ayrıca `settings.json` içinden gömülü Pi varsayılanları da ekleyebilir; OpenClaw bunları ham OpenClaw yapılandırma yamaları olarak değil, temizlenmiş ajan ayarları olarak uygular.
- `plugins.slots.memory`: etkin bellek plugin kimliğini seçin veya bellek plugin’lerini devre dışı bırakmak için `"none"` kullanın.
- `plugins.slots.contextEngine`: etkin bağlam motoru plugin kimliğini seçin; başka bir motor kurup seçmediğiniz sürece varsayılan `"legacy"` olur.
- `plugins.installs`: `openclaw plugins update` tarafından kullanılan CLI yönetimli kurulum meta verisi.
  - Şunları içerir: `source`, `spec`, `sourcePath`, `installPath`, `version`, `resolvedName`, `resolvedVersion`, `resolvedSpec`, `integrity`, `shasum`, `resolvedAt`, `installedAt`.
  - `plugins.installs.*` alanlarını yönetilen durum olarak ele alın; el ile düzenlemek yerine CLI komutlarını tercih edin.

Bkz. [Plugins](/tr/tools/plugin).

---

## Tarayıcı

```json5
{
  browser: {
    enabled: true,
    evaluateEnabled: true,
    defaultProfile: "user",
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // yalnızca güvenilen özel ağ erişimi için isteğe bağlı etkinleştirin
      // allowPrivateNetwork: true, // eski takma ad
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: { cdpPort: 18801, color: "#0066CC" },
      user: { driver: "existing-session", attachOnly: true, color: "#00AA00" },
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
    color: "#FF4500",
    // headless: false,
    // noSandbox: false,
    // extraArgs: [],
    // executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    // attachOnly: false,
  },
}
```

- `evaluateEnabled: false`, `act:evaluate` ve `wait --fn` özelliklerini devre dışı bırakır.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` ayarlanmamışsa devre dışıdır; bu nedenle tarayıcı gezinmesi varsayılan olarak sıkıdır.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` ayarını yalnızca özel ağ tarayıcı gezinmesine bilinçli olarak güvendiğinizde yapın.
- Sıkı modda uzak CDP profil uç noktaları (`profiles.*.cdpUrl`), erişilebilirlik/keşif denetimleri sırasında aynı özel ağ engellemesine tabidir.
- `ssrfPolicy.allowPrivateNetwork`, eski takma ad olarak desteklenmeye devam eder.
- Sıkı modda açık istisnalar için `ssrfPolicy.hostnameAllowlist` ve `ssrfPolicy.allowedHostnames` kullanın.
- Uzak profiller yalnızca attach modundadır (başlat/durdur/sıfırla devre dışıdır).
- `profiles.*.cdpUrl`, `http://`, `https://`, `ws://` ve `wss://` kabul eder.
  Sağlayıcının `/json/version` keşfini yapmasını istediğinizde HTTP(S) kullanın;
  doğrudan bir DevTools WebSocket URL’si verdiğinde WS(S) kullanın.
- `existing-session` profilleri yalnızca ana makinede çalışır ve CDP yerine Chrome MCP kullanır.
- `existing-session` profilleri, Brave veya Edge gibi belirli
  bir Chromium tabanlı tarayıcı profilini hedeflemek için `userDataDir` ayarlayabilir.
- `existing-session` profilleri, geçerli Chrome MCP yol sınırlarını korur:
  CSS seçici hedefleme yerine snapshot/ref odaklı eylemler, tek dosya yükleme
  hook’ları, iletişim kutusu zaman aşımı geçersiz kılmaları yok, `wait --load networkidle` yok ve
  `responsebody`, PDF dışa aktarma, indirme yakalama veya toplu eylemler yok.
- Yerel yönetilen `openclaw` profilleri `cdpPort` ve `cdpUrl` değerlerini otomatik atar; yalnızca uzak CDP için `cdpUrl` değerini açıkça ayarlayın.
- Otomatik algılama sırası: varsayılan tarayıcı Chromium tabanlıysa → Chrome → Brave → Edge → Chromium → Chrome Canary.
- Denetim hizmeti: yalnızca loopback (port, `gateway.port` değerinden türetilir; varsayılan `18791`).
- `extraArgs`, ek başlatma bayraklarını yerel Chromium başlangıcına ekler (örneğin
  `--disable-gpu`, pencere boyutlandırma veya hata ayıklama bayrakları).

---

## UI

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // emoji, kısa metin, görüntü URL’si veya data URI
    },
  },
}
```

- `seamColor`: yerel uygulama UI chrome’u için vurgu rengi (Talk Mode baloncuk tonu vb.).
- `assistant`: Control UI kimlik geçersiz kılması. Etkin ajan kimliğine geri düşer.

---

## Gateway

```json5
{
  gateway: {
    mode: "local", // local | remote
    port: 18789,
    bind: "loopback",
    auth: {
      mode: "token", // none | token | password | trusted-proxy
      token: "your-token",
      // password: "your-password", // veya OPENCLAW_GATEWAY_PASSWORD
      // trustedProxy: { userHeader: "x-forwarded-user" }, // mode=trusted-proxy için; bkz. /gateway/trusted-proxy-auth
      allowTailscale: true,
      rateLimit: {
        maxAttempts: 10,
        windowMs: 60000,
        lockoutMs: 300000,
        exemptLoopback: true,
      },
    },
    tailscale: {
      mode: "off", // off | serve | funnel
      resetOnExit: false,
    },
    controlUi: {
      enabled: true,
      basePath: "/openclaw",
      // root: "dist/control-ui",
      // embedSandbox: "scripts", // strict | scripts | trusted
      // allowExternalEmbedUrls: false, // tehlikeli: mutlak harici http(s) embed URL’lerine izin ver
      // allowedOrigins: ["https://control.example.com"], // loopback olmayan Control UI için zorunlu
      // dangerouslyAllowHostHeaderOriginFallback: false, // tehlikeli Host-header origin fallback modu
      // allowInsecureAuth: false,
      // dangerouslyDisableDeviceAuth: false,
    },
    remote: {
      url: "ws://gateway.tailnet:18789",
      transport: "ssh", // ssh | direct
      token: "your-token",
      // password: "your-password",
    },
    trustedProxies: ["10.0.0.1"],
    // İsteğe bağlı. Varsayılan false.
    allowRealIpFallback: false,
    tools: {
      // Ek /tools/invoke HTTP deny’leri
      deny: ["browser"],
      // Varsayılan HTTP deny listesinden araçları kaldır
      allow: ["gateway"],
    },
    push: {
      apns: {
        relay: {
          baseUrl: "https://relay.example.com",
          timeoutMs: 10000,
        },
      },
    },
  },
}
```

<Accordion title="Gateway alanı ayrıntıları">

- `mode`: `local` (Gateway’i çalıştır) veya `remote` (uzak Gateway’e bağlan). `local` olmadıkça Gateway başlatmayı reddeder.
- `port`: WS + HTTP için tek, çoklanmış port. Öncelik: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (varsayılan), `lan` (`0.0.0.0`), `tailnet` (yalnızca Tailscale IP’si) veya `custom`.
- **Eski bind takma adları**: `gateway.bind` içinde ana makine takma adlarını (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`) değil, bind modu değerlerini (`auto`, `loopback`, `lan`, `tailnet`, `custom`) kullanın.
- **Docker notu**: varsayılan `loopback` bind’i kapsayıcı içinde `127.0.0.1` üzerinde dinler. Docker bridge ağıyla (`-p 18789:18789`) trafik `eth0` üzerinden gelir, bu yüzden Gateway’e ulaşılamaz. `--network host` kullanın veya tüm arayüzlerde dinlemek için `bind: "lan"` (ya da `customBindHost: "0.0.0.0"` ile `bind: "custom"`) ayarlayın.
- **Kimlik doğrulama**: varsayılan olarak gereklidir. Loopback olmayan bind’ler Gateway kimlik doğrulaması gerektirir. Pratikte bu, paylaşılan bir token/parola veya `gateway.auth.mode: "trusted-proxy"` kullanan kimlik farkındalıklı bir ters proxy anlamına gelir. Onboarding sihirbazı varsayılan olarak bir token üretir.
- Hem `gateway.auth.token` hem de `gateway.auth.password` yapılandırılmışsa (SecretRef’ler dahil), `gateway.auth.mode` değerini açıkça `token` veya `password` olarak ayarlayın. İkisi de yapılandırılmış ve mod ayarlanmamışsa başlangıç ve hizmet kurulum/onarma akışları başarısız olur.
- `gateway.auth.mode: "none"`: açık kimlik doğrulamasız mod. Yalnızca güvenilen yerel loopback kurulumlarında kullanın; bu seçenek bilinçli olarak onboarding istemlerinde sunulmaz.
- `gateway.auth.mode: "trusted-proxy"`: kimlik doğrulamayı kimlik farkındalıklı bir ters proxy’ye devredin ve `gateway.trustedProxies` içinden kimlik başlıklarına güvenin (bkz. [Trusted Proxy Auth](/tr/gateway/trusted-proxy-auth)). Bu mod **loopback olmayan** bir proxy kaynağı bekler; aynı ana makinedeki loopback ters proxy’leri trusted-proxy kimlik doğrulamasını karşılamaz.
- `gateway.auth.allowTailscale`: `true` olduğunda, Tailscale Serve kimlik başlıkları Control UI/WebSocket kimlik doğrulamasını karşılayabilir (`tailscale whois` ile doğrulanır). HTTP API uç noktaları bu Tailscale başlık kimlik doğrulamasını kullanmaz; bunun yerine Gateway’in normal HTTP kimlik doğrulama modunu izler. Bu tokensız akış, Gateway ana makinesine güvenildiğini varsayar. `tailscale.mode = "serve"` olduğunda varsayılan olarak `true` olur.
- `gateway.auth.rateLimit`: isteğe bağlı başarısız kimlik doğrulama sınırlayıcısı. İstemci IP’si ve kimlik doğrulama kapsamı başına uygulanır (paylaşılan gizli anahtar ve cihaz token’ı bağımsız izlenir). Engellenen denemeler `429` + `Retry-After` döndürür.
  - Zaman uyumsuz Tailscale Serve Control UI yolunda, aynı `{scope, clientIp}` için başarısız denemeler başarısızlık yazımından önce serileştirilir. Bu nedenle aynı istemciden eşzamanlı hatalı denemeler, ikisinin de normal uyumsuzluk olarak geçmesi yerine ikinci istekte sınırlayıcıyı tetikleyebilir.
  - `gateway.auth.rateLimit.exemptLoopback` varsayılan olarak `true` değerindedir; localhost trafiğinin de oran sınırlamasına tabi olmasını bilinçli olarak istiyorsanız (`test` kurulumları veya sıkı proxy dağıtımları için) `false` yapın.
- Tarayıcı kaynaklı WS kimlik doğrulama denemeleri, loopback muafiyeti devre dışı bırakılmış şekilde her zaman yavaşlatılır (tarayıcı tabanlı localhost brute force’a karşı defense-in-depth).
- Loopback üzerinde bu tarayıcı kaynaklı kilitlemeler, normalize edilmiş `Origin`
  değeri başına yalıtılır; bu nedenle bir localhost origin’inden gelen tekrarlı başarısızlıklar başka bir origin’i otomatik olarak kilitlemez.
- `tailscale.mode`: `serve` (yalnızca tailnet, loopback bind) veya `funnel` (genel, kimlik doğrulama gerektirir).
- `controlUi.allowedOrigins`: Gateway WebSocket bağlantıları için açık tarayıcı origin izin listesi. Tarayıcı istemcileri loopback olmayan origin’lerden bekleniyorsa gereklidir.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: bilinçli olarak Host-header origin ilkesine dayanan dağıtımlar için Host-header origin geri dönüşünü etkinleştiren tehlikeli mod.
- `remote.transport`: `ssh` (varsayılan) veya `direct` (ws/wss). `direct` için `remote.url`, `ws://` veya `wss://` olmalıdır.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: güvenilen özel ağ IP’lerine düz metin `ws://` bağlantısına izin veren istemci tarafı cam kırma geçersiz kılması; düz metin için varsayılan hâlâ yalnızca loopback’tir.
- `gateway.remote.token` / `.password`, uzak istemci kimlik bilgisi alanlarıdır. Kendi başlarına Gateway kimlik doğrulamasını yapılandırmazlar.
- `gateway.push.apns.relay.baseUrl`: resmi/TestFlight iOS derlemeleri relay destekli kayıtları Gateway’e yayımladıktan sonra kullandıkları harici APNs relay için temel HTTPS URL’si. Bu URL, iOS derlemesine derlenmiş relay URL’si ile eşleşmelidir.
- `gateway.push.apns.relay.timeoutMs`: Gateway’den relay’e gönderim zaman aşımı milisaniye cinsinden. Varsayılan `10000`.
- Relay destekli kayıtlar belirli bir Gateway kimliğine devredilir. Eşlenmiş iOS uygulaması `gateway.identity.get` getirir, bu kimliği relay kaydına dahil eder ve kayıt kapsamlı bir gönderim yetkisini Gateway’e iletir. Başka bir Gateway, saklanan bu kaydı yeniden kullanamaz.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: yukarıdaki relay yapılandırması için geçici ortam geçersiz kılmaları.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: loopback HTTP relay URL’leri için yalnızca geliştirme amaçlı kaçış noktası. Üretim relay URL’leri HTTPS üzerinde kalmalıdır.
- `gateway.channelHealthCheckMinutes`: kanal sağlık izleyici aralığı dakika cinsinden. Sağlık izleyici yeniden başlatmalarını genel olarak devre dışı bırakmak için `0` ayarlayın. Varsayılan: `5`.
- `gateway.channelStaleEventThresholdMinutes`: eski soket eşiği dakika cinsinden. Bu değeri `gateway.channelHealthCheckMinutes` değerine eşit veya daha büyük tutun. Varsayılan: `30`.
- `gateway.channelMaxRestartsPerHour`: kayan bir saat içinde kanal/hesap başına azami sağlık izleyici yeniden başlatması. Varsayılan: `10`.
- `channels.<provider>.healthMonitor.enabled`: genel izleyiciyi etkin tutarken sağlık izleyici yeniden başlatmaları için kanal başına isteğe bağlı devre dışı bırakma.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: çok hesaplı kanallar için hesap başına geçersiz kılma. Ayarlandığında kanal düzeyi geçersiz kılmadan önceliklidir.
- Yerel Gateway çağrı yolları, yalnızca `gateway.auth.*` ayarlanmamışsa geri dönüş olarak `gateway.remote.*` kullanabilir.
- `gateway.auth.token` / `gateway.auth.password`, SecretRef ile açıkça yapılandırılmış ancak çözümlenmemişse çözümleme fail-closed olur (uzak geri dönüşün bunu maskelemesine izin verilmez).
- `trustedProxies`: TLS sonlandıran veya yönlendirilmiş istemci başlıkları ekleyen ters proxy IP’leri. Yalnızca denetiminizdeki proxy’leri listeleyin. Loopback girdileri, aynı ana makinedeki proxy/yerel algılama kurulumları için yine geçerlidir (örneğin Tailscale Serve veya yerel bir ters proxy), ancak loopback isteklerini `gateway.auth.mode: "trusted-proxy"` için uygun hale getirmezler.
- `allowRealIpFallback`: `true` olduğunda Gateway, `X-Forwarded-For` eksikse `X-Real-IP` başlığını kabul eder. Fail-closed davranışı için varsayılan `false`.
- `gateway.tools.deny`: HTTP `POST /tools/invoke` için ek engellenen araç adları (varsayılan deny listesini genişletir).
- `gateway.tools.allow`: araç adlarını varsayılan HTTP deny listesinden kaldırır.

</Accordion>

### OpenAI uyumlu uç noktalar

- Chat Completions: varsayılan olarak devre dışı. `gateway.http.endpoints.chatCompletions.enabled: true` ile etkinleştirin.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Responses URL girdi güçlendirmesi:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Boş izin listeleri ayarlanmamış kabul edilir; URL getirmeyi devre dışı bırakmak için `gateway.http.endpoints.responses.files.allowUrl=false`
    ve/veya `gateway.http.endpoints.responses.images.allowUrl=false` kullanın.
- İsteğe bağlı yanıt güçlendirme başlığı:
  - `gateway.http.securityHeaders.strictTransportSecurity` (yalnızca denetiminizdeki HTTPS origin’leri için ayarlayın; bkz. [Trusted Proxy Auth](/tr/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Çok örnekli yalıtım

Tek bir ana makinede birden çok Gateway’i benzersiz portlar ve durum dizinleriyle çalıştırın:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

Kolaylık bayrakları: `--dev` (`~/.openclaw-dev` + `19001` portunu kullanır), `--profile <name>` (`~/.openclaw-<name>` kullanır).

Bkz. [Multiple Gateways](/tr/gateway/multiple-gateways).

### `gateway.tls`

```json5
{
  gateway: {
    tls: {
      enabled: false,
      autoGenerate: false,
      certPath: "/etc/openclaw/tls/server.crt",
      keyPath: "/etc/openclaw/tls/server.key",
      caPath: "/etc/openclaw/tls/ca-bundle.crt",
    },
  },
}
```

- `enabled`: Gateway dinleyicisinde TLS sonlandırmasını (HTTPS/WSS) etkinleştirir (varsayılan: `false`).
- `autoGenerate`: açık dosyalar yapılandırılmadığında yerel self-signed sertifika/anahtar çifti otomatik üretir; yalnızca yerel/geliştirme kullanımı içindir.
- `certPath`: TLS sertifika dosyasının dosya sistemi yolu.
- `keyPath`: TLS özel anahtar dosyasının dosya sistemi yolu; izinleri sınırlı tutulmalıdır.
- `caPath`: istemci doğrulaması veya özel güven zincirleri için isteğe bağlı CA bundle yolu.

### `gateway.reload`

```json5
{
  gateway: {
    reload: {
      mode: "hybrid", // off | restart | hot | hybrid
      debounceMs: 500,
      deferralTimeoutMs: 300000,
    },
  },
}
```

- `mode`: yapılandırma düzenlemelerinin çalışma zamanında nasıl uygulanacağını kontrol eder.
  - `"off"`: canlı düzenlemeleri yok say; değişiklikler açık yeniden başlatma gerektirir.
  - `"restart"`: yapılandırma değiştiğinde her zaman Gateway sürecini yeniden başlat.
  - `"hot"`: yeniden başlatmadan süreç içinde değişiklikleri uygula.
  - `"hybrid"` (varsayılan): önce hot reload dene; gerekirse yeniden başlatmaya geri düş.
- `debounceMs`: yapılandırma değişiklikleri uygulanmadan önce ms cinsinden debounce penceresi (negatif olmayan tam sayı).
- `deferralTimeoutMs`: yeniden başlatmayı zorlamadan önce devam eden işlemler için beklenecek azami süre ms cinsinden (varsayılan: `300000` = 5 dakika).

---

## Hook’lar

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
    maxBodyBytes: 262144,
    defaultSessionKey: "hook:ingress",
    allowRequestSessionKey: false,
    allowedSessionKeyPrefixes: ["hook:"],
    allowedAgentIds: ["hooks", "main"],
    presets: ["gmail"],
    transformsDir: "~/.openclaw/hooks/transforms",
    mappings: [
      {
        match: { path: "gmail" },
        action: "agent",
        agentId: "hooks",
        wakeMode: "now",
        name: "Gmail",
        sessionKey: "hook:gmail:{{messages[0].id}}",
        messageTemplate: "From: {{messages[0].from}}\nSubject: {{messages[0].subject}}\n{{messages[0].snippet}}",
        deliver: true,
        channel: "last",
        model: "openai/gpt-5.4-mini",
      },
    ],
  },
}
```

Kimlik doğrulama: `Authorization: Bearer <token>` veya `x-openclaw-token: <token>`.
Sorgu dizesi hook token’ları reddedilir.

Doğrulama ve güvenlik notları:

- `hooks.enabled=true`, boş olmayan bir `hooks.token` gerektirir.
- `hooks.token`, `gateway.auth.token` ile **farklı** olmalıdır; Gateway token’ını yeniden kullanmak reddedilir.
- `hooks.path`, `/` olamaz; `/hooks` gibi ayrılmış bir alt yol kullanın.
- `hooks.allowRequestSessionKey=true` ise `hooks.allowedSessionKeyPrefixes` değerini kısıtlayın (örneğin `["hook:"]`).

**Uç noktalar:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - İstek yükünden gelen `sessionKey`, yalnızca `hooks.allowRequestSessionKey=true` ise kabul edilir (varsayılan: `false`).
- `POST /hooks/<name>` → `hooks.mappings` ile çözümlenir

<Accordion title="Eşleme ayrıntıları">

- `match.path`, `/hooks` sonrasındaki alt yolu eşleştirir (ör. `/hooks/gmail` → `gmail`).
- `match.source`, genel yollar için bir yük alanını eşleştirir.
- `{{messages[0].subject}}` gibi şablonlar yükten okunur.
- `transform`, bir hook eylemi döndüren JS/TS modülünü işaret edebilir.
  - `transform.module`, göreli bir yol olmalıdır ve `hooks.transformsDir` içinde kalır (mutlak yollar ve dizin dolaşımı reddedilir).
- `agentId`, belirli bir ajana yönlendirir; bilinmeyen kimlikler varsayılana geri düşer.
- `allowedAgentIds`: açık yönlendirmeyi kısıtlar (`*` veya atlanmış = tümüne izin ver, `[]` = tümünü reddet).
- `defaultSessionKey`: açık `sessionKey` olmadan çalışan hook ajanı çalıştırmaları için isteğe bağlı sabit oturum anahtarı.
- `allowRequestSessionKey`: `/hooks/agent` çağıranlarının `sessionKey` ayarlamasına izin ver (varsayılan: `false`).
- `allowedSessionKeyPrefixes`: açık `sessionKey` değerleri için isteğe bağlı önek izin listesi (istek + eşleme), ör. `["hook:"]`.
- `deliver: true`, son yanıtı bir kanala gönderir; `channel` varsayılan olarak `last` olur.
- `model`, bu hook çalıştırması için LLM’yi geçersiz kılar (model kataloğu ayarlıysa izin verilmiş olmalıdır).

</Accordion>

### Gmail entegrasyonu

```json5
{
  hooks: {
    gmail: {
      account: "openclaw@gmail.com",
      topic: "projects/<project-id>/topics/gog-gmail-watch",
      subscription: "gog-gmail-watch-push",
      pushToken: "shared-push-token",
      hookUrl: "http://127.0.0.1:18789/hooks/gmail",
      includeBody: true,
      maxBytes: 20000,
      renewEveryMinutes: 720,
      serve: { bind: "127.0.0.1", port: 8788, path: "/" },
      tailscale: { mode: "funnel", path: "/gmail-pubsub" },
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

- Gateway, yapılandırıldığında önyüklemede `gog gmail watch serve` işlemini otomatik başlatır. Devre dışı bırakmak için `OPENCLAW_SKIP_GMAIL_WATCHER=1` ayarlayın.
- Gateway ile birlikte ayrı bir `gog gmail watch serve` çalıştırmayın.

---

## Canvas host

```json5
{
  canvasHost: {
    root: "~/.openclaw/workspace/canvas",
    liveReload: true,
    // enabled: false, // veya OPENCLAW_SKIP_CANVAS_HOST=1
  },
}
```

- Ajan tarafından düzenlenebilen HTML/CSS/JS ve A2UI’yi Gateway portu altında HTTP üzerinden sunar:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Yalnızca yerel: `gateway.bind: "loopback"` değerini koruyun (varsayılan).
- Loopback olmayan bind’lerde: canvas yolları, diğer Gateway HTTP yüzeyleri gibi Gateway kimlik doğrulaması gerektirir (token/password/trusted-proxy).
- Node WebView’ler genellikle kimlik doğrulama başlıkları göndermez; bir node eşleştirilip bağlandıktan sonra Gateway, canvas/A2UI erişimi için node kapsamlı yetenek URL’leri duyurur.
- Yetenek URL’leri etkin node WS oturumuna bağlıdır ve kısa sürede sona erer. IP tabanlı geri dönüş kullanılmaz.
- Sunulan HTML içine canlı yeniden yükleme istemcisi ekler.
- Boş olduğunda başlangıç `index.html` dosyasını otomatik oluşturur.
- A2UI’yi ayrıca `/__openclaw__/a2ui/` altında sunar.
- Değişiklikler Gateway yeniden başlatması gerektirir.
- Büyük dizinlerde veya `EMFILE` hatalarında canlı yeniden yüklemeyi devre dışı bırakın.

---

## Keşif

### mDNS (Bonjour)

```json5
{
  discovery: {
    mdns: {
      mode: "minimal", // minimal | full | off
    },
  },
}
```

- `minimal` (varsayılan): TXT kayıtlarından `cliPath` + `sshPort` çıkarılır.
- `full`: `cliPath` + `sshPort` dahil edilir.
- Ana makine adı varsayılan olarak `openclaw` olur. `OPENCLAW_MDNS_HOSTNAME` ile geçersiz kılın.

### Geniş alan (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

`~/.openclaw/dns/` altında bir unicast DNS-SD bölgesi yazar. Ağlar arası keşif için bunu bir DNS sunucusuyla (önerilen: CoreDNS) + Tailscale split DNS ile eşleştirin.

Kurulum: `openclaw dns setup --apply`.

---

## Ortam

### `env` (satır içi ortam değişkenleri)

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: {
      GROQ_API_KEY: "gsk-...",
    },
    shellEnv: {
      enabled: true,
      timeoutMs: 15000,
    },
  },
}
```

- Satır içi ortam değişkenleri yalnızca süreç ortamında anahtar eksikse uygulanır.
- `.env` dosyaları: CWD `.env` + `~/.openclaw/.env` (hiçbiri mevcut değişkenleri geçersiz kılmaz).
- `shellEnv`: eksik beklenen anahtarları giriş kabuğu profilinizden içe aktarır.
- Tam öncelik için bkz. [Environment](/tr/help/environment).

### Ortam değişkeni yerleştirme

Herhangi bir yapılandırma dizesinde ortam değişkenlerine `${VAR_NAME}` ile başvurun:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- Yalnızca büyük harfli adlar eşleştirilir: `[A-Z_][A-Z0-9_]*`.
- Eksik/boş değişkenler yapılandırma yüklenirken hata verir.
- Düz `${VAR}` için `$${VAR}` ile kaçış yapın.
- `$include` ile çalışır.

---

## Secrets

SecretRef’ler eklemelidir: düz metin değerler yine çalışır.

### `SecretRef`

Tek bir nesne biçimi kullanın:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

Doğrulama:

- `provider` deseni: `^[a-z][a-z0-9_-]{0,63}$`
- `source: "env"` id deseni: `^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"` id: mutlak JSON pointer (örneğin `"/providers/openai/apiKey"`)
- `source: "exec"` id deseni: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- `source: "exec"` kimlikleri `.` veya `..` eğik çizgiyle ayrılmış yol segmentleri içermemelidir (örneğin `a/../b` reddedilir)

### Desteklenen kimlik bilgisi yüzeyi

- Standart matris: [SecretRef Credential Surface](/tr/reference/secretref-credential-surface)
- `secrets apply`, desteklenen `openclaw.json` kimlik bilgisi yollarını hedefler.
- `auth-profiles.json` başvuruları çalışma zamanı çözümlemesine ve denetim kapsamına dahildir.

### Secret sağlayıcıları yapılandırması

```json5
{
  secrets: {
    providers: {
      default: { source: "env" }, // isteğe bağlı açık ortam sağlayıcısı
      filemain: {
        source: "file",
        path: "~/.openclaw/secrets.json",
        mode: "json",
        timeoutMs: 5000,
      },
      vault: {
        source: "exec",
        command: "/usr/local/bin/openclaw-vault-resolver",
        passEnv: ["PATH", "VAULT_ADDR"],
      },
    },
    defaults: {
      env: "default",
      file: "filemain",
      exec: "vault",
    },
  },
}
```

Notlar:

- `file` sağlayıcısı `mode: "json"` ve `mode: "singleValue"` destekler (`singleValue` modunda `id` değeri `"value"` olmalıdır).
- `exec` sağlayıcısı mutlak bir `command` yolu gerektirir ve stdin/stdout üzerinden protokol yükleri kullanır.
- Varsayılan olarak symlink komut yolları reddedilir. Çözümlenmiş hedef yolu doğrularken symlink yollarına izin vermek için `allowSymlinkCommand: true` ayarlayın.
- `trustedDirs` yapılandırılmışsa, güvenilen dizin denetimi çözümlenmiş hedef yola uygulanır.
- `exec` alt süreç ortamı varsayılan olarak minimaldir; gerekli değişkenleri `passEnv` ile açıkça iletin.
- Secret başvuruları etkinleştirme anında bellek içi bir anlık görüntüye çözülür; ardından istek yolları yalnızca bu anlık görüntüyü okur.
- Etkin yüzey filtrelemesi etkinleştirme sırasında uygulanır: etkin yüzeylerdeki çözümlenmemiş başvurular başlangıç/yeniden yüklemeyi başarısız kılar, etkin olmayan yüzeyler ise tanı bilgileriyle atlanır.

---

## Auth depolama

```json5
{
  auth: {
    profiles: {
      "anthropic:default": { provider: "anthropic", mode: "api_key" },
      "anthropic:work": { provider: "anthropic", mode: "api_key" },
      "openai-codex:personal": { provider: "openai-codex", mode: "oauth" },
    },
    order: {
      anthropic: ["anthropic:default", "anthropic:work"],
      "openai-codex": ["openai-codex:personal"],
    },
  },
}
```

- Ajan başına profiller `<agentDir>/auth-profiles.json` içinde saklanır.
- `auth-profiles.json`, statik kimlik bilgisi modları için değer düzeyinde başvuruları (`api_key` için `keyRef`, `token` için `tokenRef`) destekler.
- OAuth modundaki profiller (`auth.profiles.<id>.mode = "oauth"`), SecretRef destekli auth-profile kimlik bilgilerini desteklemez.
- Statik çalışma zamanı kimlik bilgileri bellek içi çözülmüş anlık görüntülerden gelir; eski statik `auth.json` girdileri bulunduğunda temizlenir.
- Eski OAuth içe aktarmaları `~/.openclaw/credentials/oauth.json` içinden yapılır.
- Bkz. [OAuth](/tr/concepts/oauth).
- Secrets çalışma zamanı davranışı ve `audit/configure/apply` araçları: [Secrets Management](/tr/gateway/secrets).

### `auth.cooldowns`

```json5
{
  auth: {
    cooldowns: {
      billingBackoffHours: 5,
      billingBackoffHoursByProvider: { anthropic: 3, openai: 8 },
      billingMaxHours: 24,
      authPermanentBackoffMinutes: 10,
      authPermanentMaxMinutes: 60,
      failureWindowHours: 24,
      overloadedProfileRotations: 1,
      overloadedBackoffMs: 0,
      rateLimitedProfileRotations: 1,
    },
  },
}
```

- `billingBackoffHours`: bir profil gerçek
  faturalama/yetersiz kredi hataları nedeniyle başarısız olduğunda temel backoff süresi saat cinsinden (varsayılan: `5`). Açık faturalama metni
  `401`/`403` yanıtlarında bile yine bu yola düşebilir, ancak sağlayıcıya özgü metin
  eşleştiricileri onları sahiplenen sağlayıcıyla sınırlı kalır (örneğin OpenRouter
  `Key limit exceeded`). Yeniden denenebilir HTTP `402` kullanım penceresi veya
  organization/workspace harcama sınırı mesajları bunun yerine `rate_limit` yolunda kalır.
- `billingBackoffHoursByProvider`: faturalama backoff saatleri için isteğe bağlı sağlayıcı başına geçersiz kılmalar.
- `billingMaxHours`: faturalama backoff üstel büyümesi için üst sınır saat cinsinden (varsayılan: `24`).
- `authPermanentBackoffMinutes`: yüksek güvenli `auth_permanent` hataları için temel backoff süresi dakika cinsinden (varsayılan: `10`).
- `authPermanentMaxMinutes`: `auth_permanent` backoff büyümesi için üst sınır dakika cinsinden (varsayılan: `60`).
- `failureWindowHours`: backoff sayaçları için kullanılan kayan pencere saat cinsinden (varsayılan: `24`).
- `overloadedProfileRotations`: model fallback’ine geçmeden önce aşırı yüklü hatalarda aynı sağlayıcı auth-profile döndürmelerinin azami sayısı (varsayılan: `1`). `ModelNotReadyException` gibi sağlayıcı meşgul şekilleri bu yola düşer.
- `overloadedBackoffMs`: aşırı yüklü sağlayıcı/profil döndürmesini yeniden denemeden önce sabit gecikme (varsayılan: `0`).
- `rateLimitedProfileRotations`: model fallback’ine geçmeden önce rate-limit hatalarında aynı sağlayıcı auth-profile döndürmelerinin azami sayısı (varsayılan: `1`). Bu rate-limit kovası `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` ve `resource exhausted` gibi sağlayıcı biçimli metinleri içerir.

---

## Günlükleme

```json5
{
  logging: {
    level: "info",
    file: "/tmp/openclaw/openclaw.log",
    consoleLevel: "info",
    consoleStyle: "pretty", // pretty | compact | json
    redactSensitive: "tools", // off | tools
    redactPatterns: ["\\bTOKEN\\b\\s*[=:]\\s*([\"']?)([^\\s\"']+)\\1"],
  },
}
```

- Varsayılan günlük dosyası: `/tmp/openclaw/openclaw-YYYY-MM-DD.log`.
- Kararlı bir yol için `logging.file` ayarlayın.
- `consoleLevel`, `--verbose` ile `debug` seviyesine çıkar.
- `maxFileBytes`: yazımlar bastırılmadan önce azami günlük dosyası boyutu bayt cinsinden (pozitif tam sayı; varsayılan: `524288000` = 500 MB). Üretim dağıtımları için harici günlük döndürme kullanın.

---

## Tanılama

```json5
{
  diagnostics: {
    enabled: true,
    flags: ["telegram.*"],
    stuckSessionWarnMs: 30000,

    otel: {
      enabled: false,
      endpoint: "https://otel-collector.example.com:4318",
      protocol: "http/protobuf", // http/protobuf | grpc
      headers: { "x-tenant-id": "my-org" },
      serviceName: "openclaw-gateway",
      traces: true,
      metrics: true,
      logs: false,
      sampleRate: 1.0,
      flushIntervalMs: 5000,
    },

    cacheTrace: {
      enabled: false,
      filePath: "~/.openclaw/logs/cache-trace.jsonl",
      includeMessages: true,
      includePrompt: true,
      includeSystem: true,
    },
  },
}
```

- `enabled`: araçsal çıktı için ana anahtar (varsayılan: `true`).
- `flags`: hedefli günlük çıktısını etkinleştiren bayrak dizeleri dizisi (`"telegram.*"` veya `"*"` gibi joker karakterleri destekler).
- `stuckSessionWarnMs`: bir oturum işleniyor durumunda kalırken takılmış oturum uyarıları üretmek için ms cinsinden yaş eşiği.
- `otel.enabled`: OpenTelemetry dışa aktarma hattını etkinleştirir (varsayılan: `false`).
- `otel.endpoint`: OTel dışa aktarımı için toplayıcı URL’si.
- `otel.protocol`: `"http/protobuf"` (varsayılan) veya `"grpc"`.
- `otel.headers`: OTel dışa aktarma istekleriyle gönderilen ek HTTP/gRPC meta veri başlıkları.
- `otel.serviceName`: kaynak öznitelikleri için hizmet adı.
- `otel.traces` / `otel.metrics` / `otel.logs`: iz, metrik veya günlük dışa aktarımını etkinleştirir.
- `otel.sampleRate`: `0`–`1` arasında iz örnekleme oranı.
- `otel.flushIntervalMs`: ms cinsinden düzenli telemetri boşaltma aralığı.
- `cacheTrace.enabled`: gömülü çalıştırmalar için önbellek iz anlık görüntülerini günlüğe kaydet (varsayılan: `false`).
- `cacheTrace.filePath`: önbellek izi JSONL çıktısı için yol (varsayılan: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: önbellek izi çıktısına nelerin dahil edileceğini kontrol eder (hepsi varsayılan olarak `true`).

---

## Güncelleme

```json5
{
  update: {
    channel: "stable", // stable | beta | dev
    checkOnStart: true,

    auto: {
      enabled: false,
      stableDelayHours: 6,
      stableJitterHours: 12,
      betaCheckIntervalHours: 1,
    },
  },
}
```

- `channel`: npm/git kurulumları için yayın kanalı — `"stable"`, `"beta"` veya `"dev"`.
- `checkOnStart`: Gateway başladığında npm güncellemelerini denetle (varsayılan: `true`).
- `auto.enabled`: paket kurulumları için arka plan otomatik güncellemeyi etkinleştir (varsayılan: `false`).
- `auto.stableDelayHours`: kararlı kanal için otomatik uygulama öncesi asgari gecikme saat cinsinden (varsayılan: `6`; azami: `168`).
- `auto.stableJitterHours`: kararlı kanal yayılımı için ek dağıtım penceresi saat cinsinden (varsayılan: `12`; azami: `168`).
- `auto.betaCheckIntervalHours`: beta kanal denetimlerinin saat cinsinden ne sıklıkla çalışacağı (varsayılan: `1`; azami: `24`).

---

## ACP

```json5
{
  acp: {
    enabled: false,
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "main",
    allowedAgents: ["main", "ops"],
    maxConcurrentSessions: 10,

    stream: {
      coalesceIdleMs: 50,
      maxChunkChars: 1000,
      repeatSuppression: true,
      deliveryMode: "live", // live | final_only
      hiddenBoundarySeparator: "paragraph", // none | space | newline | paragraph
      maxOutputChars: 50000,
      maxSessionUpdateChars: 500,
    },

    runtime: {
      ttlMinutes: 30,
    },
  },
}
```

- `enabled`: genel ACP özellik anahtarı (varsayılan: `false`).
- `dispatch.enabled`: ACP oturum turu dispatch işlemi için bağımsız anahtar (varsayılan: `true`). ACP komutlarını kullanılabilir tutarken yürütmeyi engellemek için `false` ayarlayın.
- `backend`: varsayılan ACP çalışma zamanı arka uç kimliği (kayıtlı bir ACP çalışma zamanı plugin’iyle eşleşmelidir).
- `defaultAgent`: başlatmalarda açık hedef belirtilmediğinde geri dönüş ACP hedef ajan kimliği.
- `allowedAgents`: ACP çalışma zamanı oturumları için izin verilen ajan kimlikleri izin listesi; boş olması ek kısıtlama olmadığı anlamına gelir.
- `maxConcurrentSessions`: eşzamanlı etkin ACP oturumlarının azami sayısı.
- `stream.coalesceIdleMs`: akışla gönderilen metin için ms cinsinden boşta birleştirme penceresi.
- `stream.maxChunkChars`: akışlı blok yansıtması bölünmeden önce azami parça boyutu.
- `stream.repeatSuppression`: tur başına yinelenen durum/araç satırlarını bastırır (varsayılan: `true`).
- `stream.deliveryMode`: `"live"` artımlı akış yapar; `"final_only"` terminal olaylarına kadar arabelleğe alır.
- `stream.hiddenBoundarySeparator`: gizli araç olaylarından sonra görünür metinden önce gelen ayırıcı (varsayılan: `"paragraph"`).
- `stream.maxOutputChars`: ACP turu başına yansıtılan azami asistan çıktı karakteri.
- `stream.maxSessionUpdateChars`: yansıtılan ACP durum/güncelleme satırları için azami karakter sayısı.
- `stream.tagVisibility`: akışlı olaylar için etiket adlarının boolean görünürlük geçersiz kılmalarına kaydı.
- `runtime.ttlMinutes`: ACP oturum çalışanlarının temizlenmeye uygun hale gelmeden önceki boşta TTL süresi dakika cinsinden.
- `runtime.installCommand`: ACP çalışma zamanı ortamı önyüklenirken çalıştırılacak isteğe bağlı kurulum komutu.

---

## CLI

```json5
{
  cli: {
    banner: {
      taglineMode: "off", // random | default | off
    },
  },
}
```

- `cli.banner.taglineMode`, banner slogan stilini kontrol eder:
  - `"random"` (varsayılan): dönen komik/mevsimsel sloganlar.
  - `"default"`: sabit nötr slogan (`All your chats, one OpenClaw.`).
  - `"off"`: slogan metni yok (banner başlığı/sürüm yine gösterilir).
- Tüm banner’ı gizlemek için (yalnızca sloganları değil) `OPENCLAW_HIDE_BANNER=1` ortam değişkenini ayarlayın.

---

## Wizard

CLI yönlendirmeli kurulum akışları (`onboard`, `configure`, `doctor`) tarafından yazılan meta veriler:

```json5
{
  wizard: {
    lastRunAt: "2026-01-01T00:00:00.000Z",
    lastRunVersion: "2026.1.4",
    lastRunCommit: "abc1234",
    lastRunCommand: "configure",
    lastRunMode: "local",
  },
}
```

---

## Kimlik

[Agent defaults](#agent-defaults) altındaki `agents.list` kimlik alanlarına bakın.

---

## Bridge (eski, kaldırıldı)

Güncel derlemeler artık TCP bridge içermez. Node’lar Gateway WebSocket üzerinden bağlanır. `bridge.*` anahtarları artık yapılandırma şemasının parçası değildir (kaldırılana kadar doğrulama başarısız olur; `openclaw doctor --fix` bilinmeyen anahtarları temizleyebilir).

<Accordion title="Eski bridge yapılandırması (tarihsel başvuru)">

```json
{
  "bridge": {
    "enabled": true,
    "port": 18790,
    "bind": "tailnet",
    "tls": {
      "enabled": true,
      "autoGenerate": true
    }
  }
}
```

</Accordion>

---

## Cron

```json5
{
  cron: {
    enabled: true,
    maxConcurrentRuns: 2,
    webhook: "https://example.invalid/legacy", // deperecated fallback, saklanan notify:true işler için
    webhookToken: "replace-with-dedicated-token", // giden Webhook kimlik doğrulaması için isteğe bağlı bearer token
    sessionRetention: "24h", // süre dizesi veya false
    runLog: {
      maxBytes: "2mb", // varsayılan 2_000_000 bayt
      keepLines: 2000, // varsayılan 2000
    },
  },
}
```

- `sessionRetention`: tamamlanan yalıtılmış Cron çalıştırma oturumlarının `sessions.json` içinden budanmadan önce ne kadar süre tutulacağını belirler. Ayrıca arşivlenmiş silinmiş Cron dökümlerinin temizliğini de kontrol eder. Varsayılan: `24h`; devre dışı bırakmak için `false` ayarlayın.
- `runLog.maxBytes`: budamadan önce çalıştırma günlüğü dosyası başına azami boyut (`cron/runs/<jobId>.jsonl`). Varsayılan: `2_000_000` bayt.
- `runLog.keepLines`: çalıştırma günlüğü budaması tetiklendiğinde tutulacak en yeni satırlar. Varsayılan: `2000`.
- `webhookToken`: Cron Webhook POST teslimi için kullanılan bearer token (`delivery.mode = "webhook"`); atlanırsa kimlik doğrulama başlığı gönderilmez.
- `webhook`: yalnızca hâlâ `notify: true` içeren saklanan işler için kullanılan, kullanımdan kalkmış eski geri dönüş Webhook URL’si (http/https).

### `cron.retry`

```json5
{
  cron: {
    retry: {
      maxAttempts: 3,
      backoffMs: [30000, 60000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "timeout", "server_error"],
    },
  },
}
```

- `maxAttempts`: geçici hatalarda tek seferlik işler için azami yeniden deneme sayısı (varsayılan: `3`; aralık: `0`–`10`).
- `backoffMs`: her yeniden deneme girişimi için ms cinsinden backoff gecikmeleri dizisi (varsayılan: `[30000, 60000, 300000]`; 1–10 girdi).
- `retryOn`: yeniden denemeyi tetikleyen hata türleri — `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Tüm geçici türlerde yeniden denemek için atlayın.

Yalnızca tek seferlik Cron işleri için geçerlidir. Yinelenen işler ayrı hata işleme kullanır.

### `cron.failureAlert`

```json5
{
  cron: {
    failureAlert: {
      enabled: false,
      after: 3,
      cooldownMs: 3600000,
      mode: "announce",
      accountId: "main",
    },
  },
}
```

- `enabled`: Cron işleri için hata uyarılarını etkinleştirir (varsayılan: `false`).
- `after`: bir uyarı tetiklenmeden önceki ardışık hata sayısı (pozitif tam sayı, min: `1`).
- `cooldownMs`: aynı iş için yinelenen uyarılar arasındaki asgari milisaniye sayısı (negatif olmayan tam sayı).
- `mode`: teslim modu — `"announce"` bir kanal mesajı ile gönderir; `"webhook"` yapılandırılmış Webhook’a POST eder.
- `accountId`: uyarı teslimini kapsamlandırmak için isteğe bağlı hesap veya kanal kimliği.

### `cron.failureDestination`

```json5
{
  cron: {
    failureDestination: {
      mode: "announce",
      channel: "last",
      to: "channel:C1234567890",
      accountId: "main",
    },
  },
}
```

- Tüm işler genelinde Cron hata bildirimleri için varsayılan hedef.
- `mode`: `"announce"` veya `"webhook"`; yeterli hedef verisi mevcut olduğunda varsayılan olarak `"announce"`.
- `channel`: announce teslimi için kanal geçersiz kılması. `"last"`, bilinen son teslim kanalını yeniden kullanır.
- `to`: açık announce hedefi veya Webhook URL’si. Webhook modu için zorunludur.
- `accountId`: teslim için isteğe bağlı hesap geçersiz kılması.
- İş başına `delivery.failureDestination`, bu genel varsayılanı geçersiz kılar.
- Genel veya iş başına hata hedefi ayarlanmadığında, zaten `announce` üzerinden teslim yapan işler hata durumunda bu birincil announce hedefine geri düşer.
- `delivery.failureDestination`, işin birincil `delivery.mode` değeri `"webhook"` olmadıkça yalnızca `sessionTarget="isolated"` işleri için desteklenir.

Bkz. [Cron Jobs](/tr/automation/cron-jobs). Yalıtılmış Cron yürütmeleri [background tasks](/tr/automation/tasks) olarak izlenir.

---

## Medya model şablon değişkenleri

`tools.media.models[].args` içinde genişletilen şablon yer tutucuları:

| Değişken           | Açıklama                                       |
| ------------------ | ---------------------------------------------- |
| `{{Body}}`         | Tam gelen mesaj gövdesi                        |
| `{{RawBody}}`      | Ham gövde (geçmiş/gönderici sarmalayıcıları olmadan) |
| `{{BodyStripped}}` | Grup mention’ları çıkarılmış gövde             |
| `{{From}}`         | Gönderen tanımlayıcısı                         |
| `{{To}}`           | Hedef tanımlayıcısı                            |
| `{{MessageSid}}`   | Kanal mesaj kimliği                            |
| `{{SessionId}}`    | Geçerli oturum UUID’si                         |
| `{{IsNewSession}}` | Yeni oturum oluşturulduğunda `"true"`          |
| `{{MediaUrl}}`     | Gelen medya pseudo-URL’si                      |
| `{{MediaPath}}`    | Yerel medya yolu                               |
| `{{MediaType}}`    | Medya türü (image/audio/document/…)            |
| `{{Transcript}}`   | Ses dökümü                                     |
| `{{Prompt}}`       | CLI girdileri için çözümlenmiş medya istemi    |
| `{{MaxChars}}`     | CLI girdileri için çözümlenmiş azami çıktı karakteri |
| `{{ChatType}}`     | `"direct"` veya `"group"`                      |
| `{{GroupSubject}}` | Grup konusu (best effort)                      |
| `{{GroupMembers}}` | Grup üyeleri önizlemesi (best effort)          |
| `{{SenderName}}`   | Gönderen görünen adı (best effort)             |
| `{{SenderE164}}`   | Gönderen telefon numarası (best effort)        |
| `{{Provider}}`     | Sağlayıcı ipucu (whatsapp, telegram, discord vb.) |

---

## Config include’ları (`$include`)

Yapılandırmayı birden çok dosyaya bölün:

```json5
// ~/.openclaw/openclaw.json
{
  gateway: { port: 18789 },
  agents: { $include: "./agents.json5" },
  broadcast: {
    $include: ["./clients/mueller.json5", "./clients/schmidt.json5"],
  },
}
```

**Birleştirme davranışı:**

- Tek dosya: kapsayan nesnenin yerini alır.
- Dosya dizisi: sırayla derinlemesine birleştirilir (sonraki öncekini geçersiz kılar).
- Kardeş anahtarlar: include’lardan sonra birleştirilir (include edilen değerleri geçersiz kılar).
- İç içe include’lar: en fazla 10 düzey derinlik.
- Yollar: include eden dosyaya göre çözülür, ancak üst düzey yapılandırma dizini (`openclaw.json` dosyasının `dirname` değeri) içinde kalmalıdır. Mutlak/`../` biçimlerine yalnızca hâlâ bu sınır içinde çözülüyorlarsa izin verilir.
- Hatalar: eksik dosyalar, parse hataları ve döngüsel include’lar için açık mesajlar.

---

_İlgili: [Yapılandırma](/tr/gateway/configuration) · [Yapılandırma Örnekleri](/tr/gateway/configuration-examples) · [Doctor](/tr/gateway/doctor)_
