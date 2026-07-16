---
read_when:
    - Bir kanal Plugin'ini yapılandırma (kimlik doğrulama, erişim denetimi, çoklu hesap)
    - Kanal bazında yapılandırma anahtarlarında sorun giderme
    - DM politikasını, grup politikasını veya bahsetme kısıtlamasını denetleme
summary: 'Kanal yapılandırması: Slack, Discord, Telegram, WhatsApp, Matrix, iMessage ve daha fazlasında erişim denetimi, eşleştirme ve kanal başına anahtarlar'
title: Yapılandırma — kanallar
x-i18n:
    generated_at: "2026-07-16T17:08:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8d2363844e203e0c44ad9fe5d7a6a994fc654517e0488cffb836ddc9d1cdcb29
    source_path: gateway/config-channels.md
    workflow: 16
---

`channels.*` altındaki kanal bazlı yapılandırma anahtarları: DM ve grup erişimi, çok hesaplı kurulumlar, bahsetme zorunluluğu ve Slack, Discord, Telegram, WhatsApp, Matrix, iMessage ile diğer kanal pluginleri için kanal bazlı anahtarlar.

Aracılar, araçlar, gateway çalışma zamanı ve diğer üst düzey anahtarlar için [Yapılandırma başvurusu](/tr/gateway/configuration-reference) bölümüne bakın.

## Kanallar

Her kanal, yapılandırma bölümü mevcut olduğunda otomatik olarak başlar (`enabled: false` olmadığı sürece). Telegram ve iMessage, çekirdek `openclaw` paketinin içinde sunulur. Diğer resmî kanallar (Discord, Slack, WhatsApp, Matrix, Microsoft Teams, IRC, Google Chat, Signal, Mattermost ve daha fazlası), `openclaw plugins install <spec>` ile ayrı pluginler olarak kurulur; tam liste ve kurulum özellikleri için [Kanallar](/tr/channels) bölümüne bakın.

### DM ve grup erişimi

Tüm kanallar DM ilkelerini ve grup ilkelerini destekler:

| DM ilkesi           | Davranış                                                        |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (varsayılan) | Bilinmeyen gönderenlere tek kullanımlık bir eşleştirme kodu verilir; sahibin onaylaması gerekir |
| `allowlist`         | Yalnızca `allowFrom` içindeki (veya eşleştirilmiş izin deposundaki) gönderenler             |
| `open`              | Gelen tüm DM'lere izin ver (`allowFrom: ["*"]` gerektirir)             |
| `disabled`          | Gelen tüm DM'leri yok say                                          |

| Grup ilkesi          | Davranış                                               |
| --------------------- | ------------------------------------------------------ |
| `allowlist` (varsayılan) | Yalnızca yapılandırılmış izin listesiyle eşleşen gruplar          |
| `open`                | Grup izin listelerini atla (bahsetme zorunluluğu uygulanmaya devam eder) |
| `disabled`            | Tüm grup/oda iletilerini engelle                          |

<Note>
`channels.defaults.groupPolicy`, bir sağlayıcının `groupPolicy` değeri ayarlanmadığında varsayılanı belirler.
Eşleştirme kodlarının süresi 1 saat sonra dolar. Bekleyen eşleştirme istekleri **hesap başına 3** ile sınırlıdır (kanal ve hesap kimliğine göre kapsamlandırılır).
Bir sağlayıcı bloğu tamamen eksikse (`channels.<provider>` yoksa), çalışma zamanı grup ilkesi başlangıç uyarısıyla birlikte `allowlist` değerine geri döner (kapalı kalarak güvenli davranır).
</Note>

### Kanal modeli geçersiz kılmaları

Belirli kanal kimliklerini veya doğrudan ileti eşlerini bir modele sabitlemek için `channels.modelByChannel` kullanın. Değerler `provider/model` veya yapılandırılmış model takma adlarını kabul eder. Kanal eşlemesi yalnızca bir oturumda zaten etkin bir model geçersiz kılması bulunmadığında uygulanır (örneğin, `/model` aracılığıyla ayarlanan bir değer).

Grup/iş parçacığı konuşmalarında anahtarlar kanala özgü grup kimlikleri, konu kimlikleri veya kanal adlarıdır. Doğrudan ileti (DM) konuşmalarında anahtarlar, kanalın gönderen kimliğinden türetilen eş tanımlayıcılarıdır (`nativeDirectUserId`, `origin.from`, `origin.to`, `OriginatingTo`, `From` veya `SenderId`). Anahtarın tam biçimi kanala bağlıdır:

| Kanal  | DM anahtarı biçimi         | Örnek                                      |
| -------- | ------------------- | -------------------------------------------- |
| Discord  | ham kullanıcı kimliği         | `987654321`                                  |
| Feishu   | `feishu:ou_...`     | `feishu:ou_a8b6cab7e945387de5f253775d9b4d85` |
| Matrix   | Matrix kullanıcı kimliği      | `@user:matrix.org`                           |
| Slack    | `user:U...`         | `user:U12345`                                |
| Telegram | ham kullanıcı kimliği         | `123456789`                                  |
| WhatsApp | telefon numarası veya JID | `15551234567`                                |

```json5
{
  channels: {
    modelByChannel: {
      discord: {
        "123456789012345678": "anthropic/claude-opus-4-6",
      },
      slack: {
        C1234567890: "openai/gpt-5.6-sol",
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

DM'ye özgü anahtarlar yalnızca doğrudan ileti konuşmalarında eşleşir; grup/iş parçacığı yönlendirmesini etkilemez.

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

- `channels.defaults.groupPolicy`: sağlayıcı düzeyindeki `groupPolicy` ayarlanmadığında kullanılan yedek grup ilkesi.
- `channels.defaults.contextVisibility`: tüm kanallar için varsayılan ek bağlam görünürlüğü modu. Değerler: `all` (varsayılan, alıntılanan/iş parçacığındaki/geçmişteki tüm bağlamı dahil eder), `allowlist` (yalnızca izin listesindeki gönderenlerin bağlamını dahil eder), `allowlist_quote` (izin listesiyle aynıdır ancak açık alıntı/yanıt bağlamını korur). Kanal bazlı geçersiz kılma: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: sağlıklı kanal durumlarını Heartbeat çıktısına dahil eder (varsayılan `false`).
- `channels.defaults.heartbeat.showAlerts`: bozulmuş/hatalı durumları Heartbeat çıktısına dahil eder (varsayılan `true`).
- `channels.defaults.heartbeat.useIndicator`: kompakt, gösterge tarzı Heartbeat çıktısı oluşturur (varsayılan `true`).

### WhatsApp

WhatsApp, gateway'in web kanalı (Baileys Web) üzerinden çalışır. Bağlı bir oturum bulunduğunda otomatik olarak başlar.

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
      maxMs: 30000,
      factor: 1.8,
      jitter: 0.25,
      maxAttempts: 12, // 0 = sonsuza kadar yeniden dene
    },
  },
  channels: {
    whatsapp: {
      dmPolicy: "pairing", // pairing | allowlist | open | disabled
      allowFrom: ["+15555550123", "+447700900123"],
      textChunkLimit: 4000,
      streaming: { chunkMode: "length" }, // length | newline
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

- `web.whatsapp.keepAliveIntervalMs` (varsayılan `25000`), `connectTimeoutMs` (varsayılan `60000`) ve `defaultQueryTimeoutMs` (varsayılan `60000`) Baileys soketini ayarlar.
- `web.reconnect` varsayılanları: `initialMs: 2000`, `maxMs: 30000`, `factor: 1.8`, `jitter: 0.25`, `maxAttempts: 12`. `maxAttempts: 0`, vazgeçmek yerine sonsuza kadar yeniden dener.
- `type: "acp"` içeren üst düzey `bindings[]` girdileri, WhatsApp DM'leri ve grupları için kalıcı ACP bağlamalarını yapılandırır. `match.peer.id` içinde doğrudan bir E.164 numarası veya WhatsApp grup JID'si kullanın. Alan anlamları [ACP Aracıları](/tr/tools/acp-agents#persistent-channel-bindings) bölümünde ortak olarak açıklanır.

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

- Giden komutlar, mevcutsa varsayılan olarak `default` hesabını; aksi takdirde yapılandırılmış ilk hesap kimliğini (sıralanmış) kullanır.
- İsteğe bağlı `channels.whatsapp.defaultAccount`, yapılandırılmış bir hesap kimliğiyle eşleştiğinde bu yedek varsayılan hesap seçimini geçersiz kılar.
- Eski tek hesaplı Baileys kimlik doğrulama dizini, `openclaw doctor` tarafından `whatsapp/default` konumuna taşınır.
- Hesap bazlı geçersiz kılmalar: `channels.whatsapp.accounts.<id>.sendReadReceipts`, `channels.whatsapp.accounts.<id>.dmPolicy`, `channels.whatsapp.accounts.<id>.allowFrom`.

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
              systemPrompt: "Konudan ayrılma.",
            },
          },
        },
      },
      customCommands: [
        { command: "backup", description: "Git yedeklemesi" },
        { command: "generate", description: "Bir görsel oluştur" },
      ],
      historyLimit: 50,
      replyToMode: "first", // off | first | all | batched
      linkPreview: true,
      streaming: { mode: "partial" }, // off | partial | block | progress (varsayılan: partial)
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
      trustedLocalFileRoots: ["/srv/telegram-bot-api-data"],
      proxy: "socks5://localhost:9050",
      webhookUrl: "https://example.com/telegram-webhook",
      webhookSecret: "secret",
      webhookPath: "/telegram-webhook",
    },
  },
}
```

- Bot belirteci: `channels.telegram.botToken` veya `channels.telegram.tokenFile` (yalnızca normal dosya; sembolik bağlantılar reddedilir); varsayılan hesap için yedek olarak `TELEGRAM_BOT_TOKEN` kullanılır.
- `apiRoot` yalnızca Telegram Bot API köküdür. `https://api.telegram.org/bot<TOKEN>` yerine `https://api.telegram.org` veya kendi barındırdığınız/proxy kökünüzü kullanın; `openclaw doctor --fix`, yanlışlıkla eklenmiş sondaki `/bot<TOKEN>` son ekini kaldırır.
- `--local` modundaki kendi barındırdığınız bir Bot API sunucusu için `trustedLocalFileRoots`, OpenClaw'ın okuyabileceği ana makine yollarını listeler. Sunucu veri birimini OpenClaw ana makinesine bağlayın ve veri kökünü veya belirteç bazlı dizini yapılandırın; `/var/lib/telegram-bot-api` altındaki konteyner yolları bu köklere eşlenir. Diğer mutlak yollar reddedilmeye devam eder.
- İsteğe bağlı `channels.telegram.defaultAccount`, yapılandırılmış bir hesap kimliğiyle eşleştiğinde varsayılan hesap seçimini geçersiz kılar.
- Çok hesaplı kurulumlarda (2+ hesap kimliği), yedek yönlendirmeyi önlemek için açık bir varsayılan (`channels.telegram.defaultAccount` veya `channels.telegram.accounts.default`) ayarlayın; bu değer eksik veya geçersiz olduğunda `openclaw doctor` uyarı verir.
- `configWrites: false`, Telegram tarafından başlatılan yapılandırma yazma işlemlerini engeller (süper grup kimliği taşımaları, `/config set|unset`).
- `type: "acp"` içeren üst düzey `bindings[]` girdileri, forum konuları için kalıcı ACP bağlamalarını yapılandırır (`match.peer.id` içinde standart `chatId:topic:topicId` kullanın). Alan anlamları [ACP Aracıları](/tr/tools/acp-agents#persistent-channel-bindings) bölümünde ortak olarak açıklanır.
- Telegram akış önizlemeleri `sendMessage` + `editMessageText` kullanır (doğrudan ve grup sohbetlerinde çalışır).
- `network.dnsResultOrder`, yaygın IPv6 getirme hatalarını önlemek için varsayılan olarak `"ipv4first"` değerini kullanır.
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
      suppressEmbeds: true,
      streaming: {
        mode: "progress", // off | partial | block | progress (Discord default: progress)
        chunkMode: "length", // length | newline
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

- Token: Varsayılan hesap için yedek olarak `DISCORD_BOT_TOKEN` kullanılmak üzere `channels.discord.token`.
- Açık bir Discord `token` sağlayan doğrudan giden çağrılar, çağrı için bu tokenı kullanır; hesap yeniden deneme/ilke ayarları yine etkin çalışma zamanı anlık görüntüsünde seçilen hesaptan gelir.
- İsteğe bağlı `channels.discord.defaultAccount`, yapılandırılmış bir hesap kimliğiyle eşleştiğinde varsayılan hesap seçimini geçersiz kılar.
- Teslimat hedefleri için `user:<id>` (DM) veya `channel:<id>` (sunucu kanalı) kullanın; yalın sayısal kimlikler reddedilir.
- Sunucu slug'ları küçük harflidir ve boşluklar `-` ile değiştirilir; kanal anahtarları slug biçimine dönüştürülmüş adı kullanır (`#` yoktur). Sunucu kimliklerini tercih edin.
- Bot tarafından yazılan mesajlar varsayılan olarak yok sayılır. `allowBots: true` bunları etkinleştirir; yalnızca bottan bahseden bot mesajlarını kabul etmek için `allowBots: "mentions"` kullanın (kendi mesajları yine filtrelenir).
- Bot tarafından yazılmış gelen mesajları destekleyen kanallar, paylaşılan [bot döngüsü korumasını](/tr/channels/bot-loop-protection) kullanabilir. Temel çift bütçeleri için `channels.defaults.botLoopProtection` ayarlayın, ardından yalnızca bir yüzey farklı sınırlara ihtiyaç duyduğunda kanalı veya hesabı geçersiz kılın.
- `channels.discord.guilds.<id>.ignoreOtherMentions` (ve kanal geçersiz kılmaları), başka bir kullanıcıdan veya rolden bahseden ancak bottan bahsetmeyen mesajları bırakır (@everyone/@here hariç).
- `channels.discord.mentionAliases`, kararlı giden `@handle` metnini göndermeden önce Discord kullanıcı kimlikleriyle eşler; böylece geçici dizin önbelleği boşken bile bilinen ekip arkadaşlarından deterministik olarak bahsedilebilir. Hesap başına geçersiz kılmalar `channels.discord.accounts.<accountId>.mentionAliases` altında bulunur.
- `maxLinesPerMessage` (varsayılan `17`), 2000 karakterin altında olsalar bile uzun mesajları böler.
- `channels.discord.suppressEmbeds` varsayılan olarak `true` değerini alır; böylece devre dışı bırakılmadığı sürece giden URL'ler Discord bağlantı önizlemelerine genişlemez. Açık `embeds` yükleri yine normal şekilde gönderilir; mesaj başına araç çağrıları `suppressEmbeds` ile bunu geçersiz kılabilir.
- `channels.discord.threadBindings`, Discord iş parçacığına bağlı yönlendirmeyi denetler:
  - `enabled`: İş parçacığına bağlı oturum özellikleri için Discord geçersiz kılması (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` ve bağlı teslimat/yönlendirme)
  - `idleHours`: Saat cinsinden hareketsizlikte otomatik odaktan çıkarma için Discord geçersiz kılması (`0` devre dışı bırakır)
  - `maxAgeHours`: Saat cinsinden kesin azami yaş için Discord geçersiz kılması (`0` devre dışı bırakır)
  - `spawnSessions`: `sessions_spawn({ thread: true })` ve ACP iş parçacığı oluşturma sırasında otomatik iş parçacığı oluşturma/bağlama anahtarı (varsayılan: `true`)
  - `defaultSpawnContext`: İş parçacığına bağlı oluşturmalar için yerel alt ajan bağlamı (varsayılan olarak `"fork"`)
- `type: "acp"` içeren üst düzey `bindings[]` girdileri, kanallar ve iş parçacıkları için kalıcı ACP bağlamalarını yapılandırır (`match.peer.id` içinde kanal/iş parçacığı kimliğini kullanın). Alan anlamları [ACP Ajanları](/tr/tools/acp-agents#persistent-channel-bindings) bölümünde paylaşılır.
- `channels.discord.ui.components.accentColor`, Discord bileşenleri v2 kapsayıcılarının vurgu rengini ayarlar.
- `channels.discord.agentComponents.ttlMs`, gönderilen Discord bileşen geri çağırmalarının ne kadar süre kayıtlı kalacağını denetler. Varsayılan `1800000` (30 dakika), azami `86400000` (24 saat). Hesap başına geçersiz kılmalar `channels.discord.accounts.<accountId>.agentComponents.ttlMs` altında bulunur. İş akışına uyan en kısa TTL'yi tercih edin.
- `channels.discord.voice`, Discord ses kanalı görüşmelerini ve isteğe bağlı otomatik katılma + LLM + TTS geçersiz kılmalarını etkinleştirir. Yalnızca metin içeren Discord yapılandırmalarında ses varsayılan olarak kapalıdır; etkinleştirmek için `channels.discord.voice.enabled=true` ayarlayın.
- `channels.discord.voice.model`, Discord ses kanalı yanıtları için kullanılan LLM modelini isteğe bağlı olarak geçersiz kılar.
- `channels.discord.voice.daveEncryption` (varsayılan `true`) ve `channels.discord.voice.decryptionFailureTolerance` (varsayılan `24`), `@discordjs/voice` DAVE seçeneklerine aktarılır.
- `channels.discord.voice.connectTimeoutMs`, `/vc join` ve otomatik katılma denemeleri için başlangıçtaki `@discordjs/voice` Ready beklemesini denetler (varsayılan `30000`).
- `channels.discord.voice.reconnectGraceMs`, bağlantısı kesilmiş bir sesli oturumun OpenClaw tarafından yok edilmeden önce yeniden bağlanma sinyallemesine girmek için ne kadar süre kullanabileceğini denetler (varsayılan `15000`).
- Discord ses oynatımı, başka bir kullanıcının konuşmaya başlama olayıyla kesilmez. Geri besleme döngülerini önlemek için OpenClaw, TTS oynatılırken yeni ses yakalamayı yok sayar.
- OpenClaw ayrıca tekrarlanan şifre çözme hatalarından sonra sesli oturumdan ayrılıp yeniden katılarak ses alımını kurtarmayı dener.
- `channels.discord.streaming`, standart akış modu anahtarıdır. Discord varsayılan olarak `streaming.mode: "progress"` kullanır; böylece araç/iş ilerlemesi, düzenlenen tek bir önizleme mesajında görünür. Devre dışı bırakmak için `streaming.mode: "off"` ayarlayın. Eski düz anahtarlar (`streamMode`, `chunkMode`, `blockStreaming`, `draftChunk`, `blockStreamingCoalesce`) artık çalışma zamanında okunmaz; kalıcı yapılandırmayı taşımak için `openclaw doctor --fix` çalıştırın.
- `channels.discord.autoPresence`, çalışma zamanı kullanılabilirliğini bot durumuna eşler (sağlıklı => çevrimiçi, bozulmuş => boşta, tükenmiş => rahatsız etmeyin) ve isteğe bağlı durum metni geçersiz kılmalarına izin verir.
- `channels.discord.guilds.<id>.presenceEvents`, insanların kullanılabilir hâle gelmesini ajan sistem olayları olarak yapılandırılmış tek bir Discord kanalına yönlendirir. Uygun üyeler `channelId` öğesini görebilmelidir; herkese açık iş parçacıkları üst öğenin görünürlüğünü devralırken özel iş parçacıkları ayrıca üyelik veya Manage Threads gerektirir. `users` bu kitleyi daha da daraltabilir. Mevcut çevrimiçi üyeleri eksiksiz `GUILD_CREATE` anlık görüntülerinden başlangıç durumuna alır, gözlemlenen çevrimdışından çevrimiçine geçişleri yönlendirir ve daha önce görülmemiş bir üye için daha sonra gelen ilk çevrimiçi sinyalini, anlık görüntüden sonra çevrimiçi mi olduğu yoksa katıldığı mı konusunda iddiada bulunmadan yeni kullanılabilirlik olarak değerlendirir. Discord'un 75.000 üyelik anlık görüntü sınırını aşan sunucular önce açık bir çevrimdışı güncelleme gerektirir. Kısıtlama ayarları: `reconnectSuppressSeconds` (sunucu iletişim durumu yeniden oluşturulurken yeni bir Gateway oturumundan sonraki sessiz pencere; varsayılan 300, `0` devre dışı bırakır) ve `burstLimit`/`burstWindowSeconds` (sunucu başına başarıyla kuyruğa alınan olay hız sınırı; varsayılan, 60 saniyelik kayan pencere başına 8 olay). Sürdürülen oturumlar yeniden bağlanma engelleme penceresini başlatmaz. Kullanıcı başına mevcut yeniden karşılama bekleme süresi sekiz saat olarak kalır. `channels.discord.intents.presence=true`, Discord Developer Portal'daki ayrıcalıklı Presence Intent ve etkin bir ajan Heartbeat'i gerektirir.
- `channels.discord.dangerouslyAllowNameMatching`, değiştirilebilir ad/etiket eşleştirmesini yeniden etkinleştirir (acil durum uyumluluk modu).
- `channels.discord.execApprovals`: Discord'a özgü yürütme onayı teslimatı ve onaylayan yetkilendirmesi.
  - `enabled`: `true`, `false` veya `"auto"` (varsayılan). Otomatik modda yürütme onayları, onaylayanlar `approvers` veya `commands.ownerAllowFrom` üzerinden çözümlenebildiğinde etkinleşir.
  - `approvers`: Yürütme isteklerini onaylamasına izin verilen Discord kullanıcı kimlikleri. Belirtilmediğinde `commands.ownerAllowFrom` değerine geri döner.
  - `agentFilter`: İsteğe bağlı ajan kimliği izin listesi. Tüm ajanların onaylarını iletmek için belirtmeyin.
  - `sessionFilter`: İsteğe bağlı oturum anahtarı kalıpları (alt dize veya düzenli ifade).
  - `target`: Onay istemlerinin gönderileceği yer. `"dm"` (varsayılan), onaylayanların DM'lerine gönderir; `"channel"`, kaynak kanala gönderir; `"both"`, ikisine de gönderir. Hedef `"channel"` içerdiğinde düğmeler yalnızca çözümlenen onaylayanlar tarafından kullanılabilir.
  - `cleanupAfterResolve`: `true` olduğunda onay, ret veya zaman aşımından sonra onay DM'lerini siler.

**Tepki bildirim modları:** `off` (hiçbiri), `own` (botun mesajları, varsayılan), `all` (tüm mesajlar), `allowlist` (tüm mesajlarda `guilds.<id>.users` kaynağından).

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
- Hizmet hesabı SecretRef'i de desteklenir (`serviceAccountRef`).
- Ortam değişkeni yedekleri: `GOOGLE_CHAT_SERVICE_ACCOUNT` veya `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE` (yalnızca varsayılan hesap).
- Teslimat hedefleri için `spaces/<spaceId>` veya `users/<userId>` kullanın.
- `channels.googlechat.dangerouslyAllowNameMatching`, değiştirilebilir e-posta sorumlusu eşleştirmesini yeniden etkinleştirir (acil durum uyumluluk modu).

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
        C123: { enabled: true, requireMention: true, allowBots: false },
        "#general": {
          enabled: true,
          requireMention: true,
          allowBots: false,
          users: ["U123"],
          skills: ["docs"],
          systemPrompt: "Yalnızca kısa yanıtlar ver.",
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
        initialHistoryLimit: 20,
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
      streaming: {
        mode: "partial", // off | partial | block | progress
        chunkMode: "length", // length | newline
        nativeTransport: true, // mode=partial olduğunda Slack'in yerel akış API'sini kullan
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

- **Socket modu** hem `botToken` hem de `appToken` gerektirir (varsayılan hesap ortam değişkeni geri dönüşü için `SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN`).
- **HTTP modu**, `botToken` ile birlikte `signingSecret` gerektirir (kök düzeyinde veya hesap başına).
- `enterpriseOrgInstall: true`, bir hesabı Slack Enterprise Grid
  kuruluş geneli olay yoluna dahil eder. Başlangıç sırasında bot token'ı `auth.test` ile doğrulanır ve
  yapılandırılan mod Slack'in kurulum kimliğiyle eşleşmediğinde
  başlangıç başarısız olur. Enterprise DM'leri devre dışı bırakılmalı veya geçerli bir
  `allowFrom: ["*"]` ile `dmPolicy: "open"` kullanılmalıdır. Kanal ve kullanıcı politikaları kararlı Slack kimliklerini kullanmalıdır;
  değiştirilebilir adlar ve desteklenmeyen kanal önekleri başlangıcın başarısız olmasına neden olur. V1 yalnızca
  doğrudan Socket Mode veya HTTP `message` ve `app_mention` olaylarını anında
  yanıtlarla işler; aktarma, komutlar, etkileşimler, App Home, tepki olayı dinleyicileri,
  sabitlemeler, eylem araçları, yerel onaylar, bağlamalar, ertelenmiş teslimat ve
  proaktif gönderimler kullanılamaz. Dinleyiciye ait alındı bildirimi, yazma göstergesi ve
  durum tepkileri `reactions:write` ile kullanılabilir olmaya devam eder; gelen tepki
  bildirimleri ve tepki eylemi araçları kullanılamaz. En az ayrıcalıklı manifest, kurulum iş akışı ve tüm kısıtlamalar için
  [Enterprise Grid kuruluş geneli kurulumları](/tr/channels/slack#enterprise-grid-org-wide-installs)
  bölümüne bakın.
- `socketMode`, Slack SDK Socket Mode aktarım ayarlarını herkese açık Bolt alıcı API'sine iletir. Bunu yalnızca ping/pong zaman aşımı veya eski websocket davranışını araştırırken kullanın. `clientPingTimeout` varsayılan olarak `15000` değerini kullanır; `serverPingTimeout` ve `pingPongLoggingEnabled` yalnızca yapılandırıldığında iletilir.
- `botToken`, `appToken`, `signingSecret` ve `userToken`, düz metin
  dizelerini veya SecretRef nesnelerini kabul eder.
- Slack hesap anlık görüntüleri, `botTokenSource`, `botTokenStatus`, `appTokenStatus` ve HTTP modunda
  `signingSecretStatus` gibi kimlik bilgisi başına kaynak/durum alanlarını sunar.
  `configured_unavailable`, hesabın SecretRef aracılığıyla
  yapılandırıldığı ancak geçerli komut/çalışma zamanı yolunun gizli değeri
  çözemediği anlamına gelir.
- `configWrites: false`, Slack tarafından başlatılan yapılandırma yazma işlemlerini engeller.
- İsteğe bağlı `channels.slack.defaultAccount`, yapılandırılmış bir hesap kimliğiyle eşleştiğinde varsayılan hesap seçimini geçersiz kılar.
- `channels.slack.streaming.mode`, standart Slack akış modu anahtarıdır (varsayılan `"partial"`). `channels.slack.streaming.nativeTransport`, Slack'in yerel akış aktarımını denetler (varsayılan `true`). Eski `streamMode`, boolean `streaming`, `chunkMode`, `blockStreaming`, `blockStreamingCoalesce` ve `nativeStreaming` değerleri artık çalışma zamanında okunmaz; kalıcı yapılandırmayı `streaming.{mode,chunkMode,block.enabled,block.coalesce,nativeTransport}` biçimine taşımak için `openclaw doctor --fix` komutunu çalıştırın.
- `unfurlLinks` ve `unfurlMedia`, bot yanıtları için Slack'in `chat.postMessage` bağlantı ve medya önizleme boolean değerlerini iletir. `unfurlLinks` varsayılan olarak `false` değerini kullanır; böylece etkinleştirilmedikçe giden bot bağlantıları satır içinde genişletilmez. `unfurlMedia` yapılandırılmadıkça dahil edilmez. Tek bir hesap için üst düzey değeri geçersiz kılmak üzere değerlerden birini `channels.slack.accounts.<accountId>` konumunda ayarlayın.
- Teslimat hedefleri için `user:<id>` (DM) veya `channel:<id>` kullanın.

**Tepki bildirimi modları:** `off`, `own` (varsayılan), `all`, `allowlist` (`reactionAllowlist` kaynağından).

**İleti dizisi oturumu yalıtımı:** `thread.historyScope`, ileti dizisi başınadır (varsayılan) veya kanal genelinde paylaşılır. `thread.inheritParent`, üst kanal dökümünü yeni ileti dizilerine kopyalar. `thread.initialHistoryLimit` (varsayılan `20`), yeni bir ileti dizisi oturumu başladığında getirilecek mevcut ileti dizisi iletilerinin sayısını sınırlar; `0`, ileti dizisi geçmişinin getirilmesini devre dışı bırakır.

- Slack yerel akışı ile Slack'in asistan tarzı "yazıyor..." ileti dizisi durumu, bir yanıt ileti dizisi hedefi gerektirir. Üst düzey DM'ler varsayılan olarak ileti dizisi dışında kalır; böylece ileti dizisi tarzı yerel akış/durum önizlemesini göstermek yerine Slack'in taslak gönderi ve düzenleme önizlemeleri üzerinden akış yapmaya devam edebilirler.
- `typingReaction`, yanıt çalışırken gelen Slack iletisine geçici bir tepki ekler ve tamamlandığında bunu kaldırır. `"hourglass_flowing_sand"` gibi bir Slack emoji kısa kodu kullanın.
- `channels.slack.execApprovals`: Slack'e özgü onay istemcisi teslimatı ve yürütme onaylayıcısı yetkilendirmesi. Discord ile aynı şema: `enabled` (`true`/`false`/`"auto"`), `approvers` (Slack kullanıcı kimlikleri), `agentFilter`, `sessionFilter` ve `target` (`"dm"`, `"channel"` veya `"both"`). Plugin onayları, Slack Plugin onaylayıcıları çözümlendiğinde Slack kaynaklı istekler için bu yerel istemci yolunu kullanabilir; Slack'e özgü Plugin onayı teslimatı, Slack kaynaklı oturumlar veya Slack hedefleri için `approvals.plugin` aracılığıyla da etkinleştirilebilir. Plugin onayları yürütme onaylayıcılarını değil, `allowFrom` içindeki Slack Plugin onaylayıcılarını ve varsayılan yönlendirmeyi kullanır.

| Eylem grubu | Varsayılan | Notlar                         |
| ------------ | ---------- | ------------------------------ |
| reactions    | etkin      | Tepki ekle + tepkileri listele |
| messages     | etkin      | Oku/gönder/düzenle/sil         |
| pins         | etkin      | Sabitle/sabitlemeyi kaldır/listele |
| memberInfo   | etkin      | Üye bilgileri                  |
| emojiList    | etkin      | Özel emoji listesi             |

### Mattermost

Mattermost; Discord, Slack ve WhatsApp ile aynı şekilde ayrı bir Plugin olarak kurulur:

```bash
openclaw plugins install @openclaw/mattermost
```

Bir sürümü sabitlemeden önce güncel dist-tag'ler için [npmjs.com/package/@openclaw/mattermost](https://www.npmjs.com/package/@openclaw/mattermost) adresini kontrol edin.

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
        native: true, // isteğe bağlı
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Ters proxy/herkese açık dağıtımlar için isteğe bağlı açık URL
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
      textChunkLimit: 4000,
      streaming: { chunkMode: "length" },
    },
  },
}
```

Sohbet modları: `oncall` (@-bahsetmede yanıt ver, varsayılan), `onmessage` (her ileti), `onchar` (tetikleyici önekle başlayan iletiler).

Mattermost yerel komutları etkinleştirildiğinde:

- `commands.callbackPath` tam bir URL değil, bir yol olmalıdır (örneğin `/api/channels/mattermost/command`).
- `commands.callbackUrl`, OpenClaw Gateway uç noktasına çözümlenmeli ve Mattermost sunucusundan erişilebilir olmalıdır.
- Yerel eğik çizgi geri çağrılarının kimliği, eğik çizgi komutu kaydı sırasında
  Mattermost tarafından döndürülen komut başına token'larla doğrulanır. Kayıt başarısız olursa veya hiçbir
  komut etkinleştirilmezse OpenClaw geri çağrıları
  `Unauthorized: invalid command token.` ile reddeder
- Özel/tailnet/dahili geri çağrı ana makineleri için Mattermost,
  `ServiceSettings.AllowedUntrustedInternalConnections` değerinin geri çağrı ana makinesini/alan adını içermesini gerektirebilir.
  Tam URL'ler değil, ana makine/alan adı değerleri kullanın.
- `channels.mattermost.configWrites`: Mattermost tarafından başlatılan yapılandırma yazma işlemlerine izin verin veya bunları reddedin.
- `channels.mattermost.requireMention`: kanallarda yanıt vermeden önce `@mention` gerektirin.
- `channels.mattermost.groups.<channelId>.requireMention`: kanal başına bahsetme zorunluluğu geçersiz kılma ayarı (varsayılan için `"*"`).
- İsteğe bağlı `channels.mattermost.defaultAccount`, yapılandırılmış bir hesap kimliğiyle eşleştiğinde varsayılan hesap seçimini geçersiz kılar.

### Signal

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15555550123", // isteğe bağlı hesap bağlaması
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

**Tepki bildirimi modları:** `off`, `own` (varsayılan), `all`, `allowlist` (`reactionAllowlist` kaynağından).

- `channels.signal.account`: kanal başlangıcını belirli bir Signal hesap kimliğine sabitleyin.
- `channels.signal.configWrites`: Signal tarafından başlatılan yapılandırma yazma işlemlerine izin verin veya bunları reddedin.
- İsteğe bağlı `channels.signal.defaultAccount`, yapılandırılmış bir hesap kimliğiyle eşleştiğinde varsayılan hesap seçimini geçersiz kılar.

### iMessage

OpenClaw, `imsg rpc` sürecini başlatır (stdio üzerinden JSON-RPC). Herhangi bir daemon veya bağlantı noktası gerekmez. Ana makine Mesajlar veritabanı ve Otomasyon izinlerini verebiliyorsa yeni OpenClaw iMessage kurulumları için tercih edilen yol budur.

BlueBubbles desteği kaldırıldı. `channels.bluebubbles`, güncel OpenClaw sürümünde desteklenen bir çalışma zamanı yapılandırma yüzeyi değildir. Eski yapılandırmaları `channels.imessage` biçimine taşıyın; kısa sürüm için [BlueBubbles'ın kaldırılması ve imsg iMessage yolu](/tr/announcements/bluebubbles-imessage), tam çeviri tablosu için [BlueBubbles'dan geçiş](/tr/channels/imessage-from-bluebubbles) sayfasını kullanın.

Gateway, Mesajlar oturumu açık olan Mac'te çalışmıyorsa `channels.imessage.enabled=true` değerini koruyun ve `channels.imessage.cliPath` değerini, söz konusu Mac'te `imsg "$@"` çalıştıran bir SSH sarmalayıcısına ayarlayın. Varsayılan yerel `imsg` yolu yalnızca macOS'ta kullanılabilir.

Üretim gönderimleri için bir SSH sarmalayıcısına güvenmeden önce, tam olarak bu sarmalayıcı üzerinden giden bir `imsg send` işlemini doğrulayın. Bazı macOS TCC durumları Mesajlar Otomasyonu'nu `/usr/libexec/sshd-keygen-wrapper` sürecine atar; bu durum, okumaların ve yoklamaların çalışmasına karşın gönderimlerin AppleEvents `-1743` hatasıyla başarısız olmasına neden olabilir. [iMessage](/tr/channels/imessage) içindeki SSH sarmalayıcısı sorun giderme bölümüne bakın.

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
- Mesajlar veritabanı için Tam Disk Erişimi gerektirir.
- `chat_id:<id>` hedeflerini tercih edin. Sohbetleri listelemek için `imsg chats --limit 20` kullanın.
- `cliPath` bir SSH sarmalayıcısına işaret edebilir; SCP ile ekleri almak için `remoteHost` (`host` veya `user@host`) ayarlayın.
- `attachmentRoots` ve `remoteAttachmentRoots`, gelen eklerin yollarını sınırlar (varsayılan: `/Users/*/Library/Messages/Attachments`).
- SCP katı ana makine anahtarı denetimi kullanır; bu nedenle aktarma ana makinesinin anahtarının `~/.ssh/known_hosts` içinde zaten bulunduğundan emin olun.
- `channels.imessage.configWrites`: iMessage tarafından başlatılan yapılandırma yazımlarına izin verin veya bunları reddedin.
- `channels.imessage.sendTransport`: normal giden yanıtlar için tercih edilen `imsg` RPC gönderim aktarımı. `auto` (varsayılan), çalışır durumdayken mevcut sohbetler için IMCore köprüsünü kullanır, ardından AppleScript'e geri döner; `bridge` özel API üzerinden teslimat gerektirir; `applescript` herkese açık Mesajlar otomasyon yolunu zorunlu kılar.
- `channels.imessage.actions.*`: ayrıca `imsg status` / `openclaw channels status --probe` tarafından denetlenen özel API eylemlerini etkinleştirin.
- `channels.imessage.includeAttachments` varsayılan olarak kapalıdır; agent turlarında gelen medya beklemeden önce bunu `true` olarak ayarlayın.
- Bir köprü/Gateway yeniden başlatmasından sonra gelen iletilerin kurtarılması otomatiktir (GUID tekilleştirmesi ve eski birikim için yaş sınırı). Mevcut `channels.imessage.catchup.enabled: true` yapılandırmaları, kullanımdan kaldırılmış bir uyumluluk profili olarak hâlâ dikkate alınır; `catchup` varsayılan olarak devre dışıdır.
- `channels.imessage.groups`: grup kayıt defteri ve grup başına ayarlar. `groupPolicy: "allowlist"` ile grup iletilerinin kayıt defteri kapısından geçebilmesi için açık `chat_id` anahtarlarını veya bir `"*"` joker karakter girdisini yapılandırın.
- `type: "acp"` içeren üst düzey `bindings[]` girdileri, iMessage konuşmalarını kalıcı ACP oturumlarına bağlayabilir. `match.peer.id` içinde normalleştirilmiş bir tanıtıcı veya açık bir sohbet hedefi (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) kullanın. Paylaşılan alan anlamları: [ACP Agent'ları](/tr/tools/acp-agents#persistent-channel-bindings).

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

- Token kimlik doğrulaması `accessToken`; parola kimlik doğrulaması ise `userId` + `password` kullanır.
- `channels.matrix.proxy`, Matrix HTTP trafiğini açıkça belirtilmiş bir HTTP(S) proxy üzerinden yönlendirir. Adlandırılmış hesaplar bunu `channels.matrix.accounts.<id>.proxy` ile geçersiz kılabilir.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork`, özel/dahili ana sunuculara izin verir. `proxy` ile bu ağ katılım tercihi birbirinden bağımsız denetimlerdir.
- `channels.matrix.defaultAccount`, çok hesaplı kurulumlarda tercih edilen hesabı seçer.
- `channels.matrix.autoJoin` varsayılan olarak `"off"` değerini kullanır; dolayısıyla `autoJoin: "allowlist"` öğesini `autoJoinAllowlist` veya `autoJoin: "always"` ile ayarlayana kadar davet edilen odalar ve yeni DM türündeki davetler yok sayılır.
- `channels.matrix.execApprovals`: Matrix'e özgü yürütme onayı teslimatı ve onaylayan yetkilendirmesi.
  - `enabled`: `true`, `false` veya `"auto"` (varsayılan). Otomatik modda onaylayanlar `approvers` veya `commands.ownerAllowFrom` üzerinden çözümlenebildiğinde yürütme onayları etkinleşir.
  - `approvers`: yürütme isteklerini onaylamasına izin verilen Matrix kullanıcı kimlikleri (ör. `@owner:example.org`).
  - `agentFilter`: isteğe bağlı agent kimliği izin listesi. Onayları tüm agent'lar için iletmek üzere bu alanı atlayın.
  - `sessionFilter`: isteğe bağlı oturum anahtarı kalıpları (alt dize veya düzenli ifade).
  - `target`: onay istemlerinin gönderileceği yer. `"dm"` (varsayılan), `"channel"` (kaynak oda) veya `"both"`.
  - Hesap başına geçersiz kılmalar: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope`, Matrix DM'lerinin oturumlar hâlinde nasıl gruplandırılacağını denetler: `per-user` (varsayılan), yönlendirilen eşe göre paylaşırken `per-room` her DM odasını yalıtır.
- Matrix durum yoklamaları ve canlı dizin aramaları, çalışma zamanı trafiğiyle aynı proxy politikasını kullanır.
- Matrix yapılandırmasının tamamı, hedefleme kuralları ve kurulum örnekleri [Matrix](/tr/channels/matrix) içinde belgelenmiştir.

### Microsoft Teams

Microsoft Teams, Plugin desteklidir ve `channels.msteams` altında yapılandırılır.

```json5
{
  channels: {
    msteams: {
      enabled: true,
      configWrites: true,
      // appId, appPassword, tenantId, webhook, ekip/kanal politikaları:
      // bkz. /channels/msteams
    },
  },
}
```

- Burada ele alınan temel anahtar yolları: `channels.msteams`, `channels.msteams.configWrites`.
- Teams yapılandırmasının tamamı (kimlik bilgileri, Webhook, DM/grup politikası, ekip/kanal başına geçersiz kılmalar) [Microsoft Teams](/tr/channels/msteams) içinde belgelenmiştir.

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

- Burada ele alınan temel anahtar yolları: `channels.irc`, `channels.irc.dmPolicy`, `channels.irc.configWrites`, `channels.irc.nickserv.*`.
- İsteğe bağlı `channels.irc.defaultAccount`, yapılandırılmış bir hesap kimliğiyle eşleştiğinde varsayılan hesap seçimini geçersiz kılar.
- IRC kanal yapılandırmasının tamamı (ana makine/bağlantı noktası/TLS/kanallar/izin listeleri/bahsetme denetimi) [IRC](/tr/channels/irc) içinde belgelenmiştir.

### Çoklu hesap (tüm kanallar)

Kanal başına birden fazla hesap çalıştırın (her birinin kendi `accountId` değeri vardır):

```json5
{
  channels: {
    telegram: {
      accounts: {
        default: {
          name: "Birincil bot",
          botToken: "123456:ABC...",
        },
        alerts: {
          name: "Uyarı botu",
          botToken: "987654:XYZ...",
        },
      },
    },
  },
}
```

- `accountId` atlandığında `default` kullanılır (CLI + yönlendirme).
- Ortam token'ları yalnızca **varsayılan** hesaba uygulanır.
- Temel kanal ayarları, hesap başına geçersiz kılınmadıkça tüm hesaplara uygulanır.
- Her hesabı farklı bir agent'a yönlendirmek için `bindings[].match.accountId` kullanın.
- Hâlâ tek hesaplı üst düzey kanal yapılandırmasını kullanırken `openclaw channels add` (veya kanal ilk katılımı) aracılığıyla varsayılan olmayan bir hesap eklerseniz OpenClaw, özgün hesabın çalışmaya devam etmesi için önce hesap kapsamlı üst düzey tek hesap değerlerini kanal hesap eşlemesine yükseltir. Çoğu kanal bunları `channels.<channel>.accounts.default` içine taşır; Matrix ise bunun yerine eşleşen mevcut bir adlandırılmış/varsayılan hedefi koruyabilir.
- Mevcut yalnızca kanal kapsamlı bağlamalar (`accountId` içermeyenler) varsayılan hesapla eşleşmeye devam eder; hesap kapsamlı bağlamalar isteğe bağlı kalır.
- `openclaw doctor --fix`, hesap kapsamlı üst düzey tek hesap değerlerini ilgili kanal için seçilen yükseltilmiş hesaba taşıyarak karma biçimleri de onarır. Çoğu kanal `accounts.default` kullanır; Matrix ise bunun yerine eşleşen mevcut bir adlandırılmış/varsayılan hedefi koruyabilir.

### Diğer Plugin kanalları

Birçok Plugin kanalı `channels.<id>` olarak yapılandırılır ve kendi kanal sayfalarında belgelenir (örneğin Feishu, LINE, Nextcloud Talk, Nostr, QQ Bot, Synology Chat, Twitch ve Zalo).
Kanal dizininin tamamına bakın: [Kanallar](/tr/channels).

### Grup sohbetinde bahsetme denetimi

Grup iletileri varsayılan olarak **bahsetme gerektirir** (meta veri bahsetmesi veya güvenli düzenli ifade kalıpları). WhatsApp, Telegram, Discord, Google Chat ve iMessage grup sohbetleri için geçerlidir.

Görünür yanıtlar ayrı olarak denetlenir. Normal grup, kanal ve dahili WebChat doğrudan istekleri varsayılan olarak otomatik son teslimatı kullanır: son asistan metni eski görünür yanıt yolu üzerinden gönderilir. Görünür çıktının yalnızca agent `message(action=send)` çağrısı yaptıktan sonra gönderilmesi gerekiyorsa `messages.visibleReplies: "message_tool"` veya `messages.groupChat.visibleReplies: "message_tool"` seçeneğini etkinleştirin. Model, yalnızca araç modunun etkinleştirildiği bir durumda ileti aracını çağırmadan anlamlı bir son yanıt döndürürse bu son metin gizli kalır, Gateway ayrıntılı günlüğü engellenen yükün meta verilerini kaydeder ve OpenClaw modelden aynı yanıtı `message(action=send)` aracılığıyla teslim etmesini isteyen tek bir kurtarma yeniden denemesi kuyruğa alır.

Yalnızca araç üzerinden görünür yanıtlar, araçları güvenilir biçimde çağıran bir model/çalışma zamanı gerektirir ve GPT-5.6 Sol gibi en yeni nesil modellerdeki paylaşılan ortam odaları için önerilir. Bazı daha zayıf modeller son metinle yanıt verebilir ancak kaynakta görünür çıktının `message(action=send)` ile gönderilmesi gerektiğini anlayamayabilir. OpenClaw, yalnızca son yanıt anlamlıysa, kaynak tur bir oda olayı değilse, gönderim politikası teslimatı reddetmediyse ve henüz bir kaynak yanıtı gönderilmediyse yaygın takılı kalan son yanıt durumunu varsayılan olarak kurtarır. Kurtarma tek bir yeniden denemeyle sınırlıdır; sentetik yeniden deneme isteminin kalıcılaştırılmasını engeller ve ilgisiz kuyruk istemleriyle birleşememesi için bu yeniden denemeyi toplu işlem dışında tutar. Yeniden deneme de takılırsa veya kuyruğa alınamazsa OpenClaw yalnızca "Bir yanıt oluşturdum ancak bu sohbete teslim edemedim. Lütfen tekrar deneyin." gibi arındırılmış bir tanılama iletisi teslim eder. Özgün gizli son metin hiçbir zaman otomatik kaynak teslimatı için işaretlenmez. Yanıtları tekrar tekrar takılı bırakan modellerde son asistan turunun görünür yanıt yolu olması için `"automatic"` kullanın, araç çağırmada daha güçlü bir modele geçin, engellenen yük özetini görmek için Gateway ayrıntılı günlüğünü inceleyin veya her grup/kanal isteğinde görünür son yanıtları kullanmak için `messages.groupChat.visibleReplies: "automatic"` ayarlayın.

Etkin araç politikası kapsamında ileti aracı kullanılamıyorsa OpenClaw yanıtı sessizce engellemek yerine otomatik görünür yanıtlara geri döner. `openclaw doctor` bu uyumsuzluk hakkında uyarır.

Bu kural normal agent son metni için geçerlidir. Plugin'e ait konuşma bağlamaları, sahip Plugin'in döndürdüğü yanıtı sahiplenilmiş bağlı iş parçacığı turlarında görünür yanıt olarak kullanır; Plugin'in bu bağlama yanıtları için `message(action=send)` çağrısı yapması gerekmez.

**Sorun giderme: grupta @bahsetme yazma göstergesini tetikliyor, ardından sessizlik oluyor (hata yok)**

Belirti: bir grup/kanal @bahsetmesi yazma göstergesini gösterir ve Gateway günlüğü `dispatch complete (queuedFinal=false, replies=0)` bildirir, ancak odaya hiçbir ileti ulaşmaz. Aynı agent'a gönderilen DM'ler normal biçimde yanıtlanır.

Neden: grup/kanal görünür yanıt modu `"message_tool"` olarak çözümlenir; bu nedenle OpenClaw turu çalıştırır ancak agent `message(action=send)` çağrısı yapmadığı sürece son asistan metnini bastırır. Bu modda `NO_REPLY` sözleşmesi yoktur; mesaj aracı çağrısı yapılmaması, özgün son metnin özel kalması anlamına gelir. OpenClaw artık önemli kaynak turları için korumalı tek bir kurtarma yeniden denemesi yapar; kısa notlar, açıkça sessiz kalma, oda olayları, gönderim ilkesi tarafından reddedilen turlar ve zaten teslim edilmiş turlar yeniden denenmez. Normal grup ve kanal turları varsayılan olarak `"automatic"` kullanır; dolayısıyla bu belirti yalnızca `messages.groupChat.visibleReplies` (veya genel `messages.visibleReplies`) açıkça `"message_tool"` olarak ayarlandığında görülür. Harness `defaultVisibleReplies` burada geçerli değildir — grup/kanal çözümleyicisi bunu yok sayar; yalnızca doğrudan/kaynak sohbetlerini etkiler (Codex harness, doğrudan sohbet sonlarını bu şekilde bastırır).

Düzeltme: daha güçlü bir araç çağırma modeli seçin, `"automatic"` varsayılanına geri dönmek için açık `"message_tool"` geçersiz kılmasını kaldırın veya her grup/kanal isteğinde görünür yanıtları zorunlu kılmak için `messages.groupChat.visibleReplies: "automatic"` ayarını yapın. Önemli bir takılı kalmış son yanıt artık sessiz başarıyla sonuçlanmamalıdır; ya tek bir `message(action=send)` yeniden denemesiyle kurtarılmalı ya da temizlenmiş teslimat hatası tanılamasını göstermelidir. Gateway, dosya kaydedildikten sonra `messages` yapılandırmasını çalışırken yeniden yükler; Gateway'i yalnızca dağıtımda dosya izleme veya yapılandırmayı yeniden yükleme devre dışıysa yeniden başlatın.

**Bahsetme türleri:**

- **Meta veri bahsetmeleri**: Yerel platform @-bahsetmeleri. WhatsApp kendi kendine sohbet modunda yok sayılır.
- **Metin kalıpları**: `agents.list[].groupChat.mentionPatterns` içindeki güvenli regex kalıpları. Geçersiz kalıplar ve güvenli olmayan iç içe yinelemeler yok sayılır.
- Bahsetme geçidi yalnızca algılama mümkün olduğunda (yerel bahsetmeler veya en az bir kalıp) uygulanır.

```json5
{
  messages: {
    visibleReplies: "automatic", // doğrudan/kaynak sohbetleri için eski otomatik son yanıtları zorunlu kıl
    groupChat: {
      historyLimit: 50,
      unmentionedInbound: "room_event", // her zaman açık, bahsetme içermeyen oda sohbeti sessiz bağlama dönüşür
      visibleReplies: "message_tool", // isteğe bağlı; görünür oda yanıtları için message(action=send) gerektir
    },
  },
  agents: {
    list: [{ id: "main", groupChat: { mentionPatterns: ["@openclaw", "openclaw"] } }],
  },
}
```

`messages.groupChat.historyLimit` genel varsayılanı ayarlar. Kanallar `channels.<channel>.historyLimit` (veya hesap başına ayar) ile bunu geçersiz kılabilir. Devre dışı bırakmak için `0` ayarını yapın.

`messages.groupChat.unmentionedInbound: "room_event"`, desteklenen kanallarda bahsetme içermeyen, her zaman açık grup/kanal mesajlarını sessiz oda bağlamı olarak gönderir. Bahsetme içeren mesajlar, komutlar ve doğrudan mesajlar kullanıcı isteği olarak kalır. Eksiksiz Discord, Slack ve Telegram örnekleri için [Ortam oda olayları](/tr/channels/ambient-room-events) bölümüne bakın.

`messages.visibleReplies` genel kaynak olayı varsayılanıdır; `messages.groupChat.visibleReplies` grup/kanal kaynak olayları için bunu geçersiz kılar. `messages.visibleReplies` ayarlanmadığında doğrudan/kaynak sohbetleri, seçilen çalışma zamanı veya harness varsayılanını kullanır; ancak dahili WebChat doğrudan turları, Pi/Codex istem eşdeğerliği için otomatik son teslimatı kullanır. Görünür çıktı için kasıtlı olarak `message(action=send)` gerektirmek üzere `messages.visibleReplies: "message_tool"` ayarını yapın. Kanal izin listeleri ve bahsetme geçidi, bir olayın işlenip işlenmeyeceğini belirlemeye devam eder.

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

Çözümleme: DM başına geçersiz kılma → sağlayıcı varsayılanı → sınır yok (tümü tutulur).

Bu çözümleyici, oturum anahtarı standart `provider:direct:<id>` (veya eski `provider:dm:<id>`) biçimini izleyen tüm kanallar için `channels.<provider>.dmHistoryLimit` ve `channels.<provider>.dms.<id>.historyLimit` değerlerini okur; dolayısıyla yalnızca sabit bir listede değil, hem paketlenmiş hem de Plugin kanallarında çalışır.

#### Kendi kendine sohbet modu

Kendi kendine sohbet modunu etkinleştirmek için kendi numaranızı `allowFrom` içine ekleyin (yerel @-bahsetmelerini yok sayar, yalnızca metin kalıplarına yanıt verir):

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

### Komutlar (sohbet komutlarının işlenmesi)

```json5
{
  commands: {
    native: "auto", // desteklendiğinde yerel komutları kaydet
    nativeSkills: "auto", // desteklendiğinde yerel beceri komutlarını kaydet
    text: true, // sohbet mesajlarındaki /commands ifadelerini ayrıştır
    bash: false, // ! kullanımına izin ver (takma ad: /bash)
    bashForegroundMs: 2000,
    config: false, // /config kullanımına izin ver
    mcp: false, // /mcp kullanımına izin ver
    plugins: false, // /plugins kullanımına izin ver
    debug: false, // /debug kullanımına izin ver
    restart: true, // /restart + harici SIGUSR1 yeniden başlatma isteklerine izin ver
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

- Bu blok, komut yüzeylerini yapılandırır. Güncel yerleşik + paketlenmiş komut kataloğu için [Eğik Çizgi Komutları](/tr/tools/slash-commands) bölümüne bakın.
- Bu sayfa tam komut kataloğu değil, bir **yapılandırma anahtarı referansıdır**. QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, cihaz eşleştirme `/pair`, bellek `/dreaming`, telefon denetimi `/phone` ve Talk `/voice` gibi kanal/Plugin tarafından yönetilen komutlar, ilgili kanal/Plugin sayfalarında ve [Eğik Çizgi Komutları](/tr/tools/slash-commands) bölümünde belgelenmiştir.
- Metin komutları, başında `/` bulunan **bağımsız** mesajlar olmalıdır.
- `native: "auto"`, Discord/Telegram için yerel komutları etkinleştirir, Slack için devre dışı bırakır.
- `nativeSkills: "auto"`, Discord/Telegram için yerel Skills komutlarını etkinleştirir, Slack için devre dışı bırakır.
- Kanal başına geçersiz kılma: `channels.discord.commands.native` (bool veya `"auto"`). Discord için `false`, başlangıç sırasında yerel komut kaydını ve temizliğini atlar.
- Yerel Skills kaydını kanal başına `channels.<provider>.commands.nativeSkills` ile geçersiz kılın.
- `channels.telegram.customCommands`, ek Telegram bot menüsü girdileri ekler.
- `bash: true`, ana makine kabuğu için `! <cmd>` özelliğini etkinleştirir. `tools.elevated.enabled` ayarını ve gönderenin `tools.elevated.allowFrom.<channel>` içinde olmasını gerektirir.
- `config: true`, `/config` özelliğini etkinleştirir (`openclaw.json` öğesini okur/yazar). Gateway `chat.send` istemcileri için kalıcı `/config set|unset` yazma işlemleri ayrıca `operator.admin` gerektirir; salt okunur `/config show`, normal yazma kapsamlı operatör istemcileri tarafından kullanılabilir durumda kalır.
- `mcp: true`, `mcp.servers` altındaki OpenClaw tarafından yönetilen MCP sunucusu yapılandırması için `/mcp` özelliğini etkinleştirir.
- `plugins: true`, Plugin keşfi, kurulumu ve etkinleştirme/devre dışı bırakma denetimleri için `/plugins` özelliğini etkinleştirir.
- `channels.<provider>.configWrites`, kanal başına yapılandırma değişikliklerini denetler (varsayılan: true).
- Çok hesaplı kanallarda `channels.<provider>.accounts.<id>.configWrites`, söz konusu hesabı hedefleyen yazma işlemlerini de denetler (örneğin `/allowlist --config --account <id>` veya `/config set channels.<provider>.accounts.<id>...`).
- `restart: false`, `/restart` ve harici `SIGUSR1` yeniden başlatma isteklerini devre dışı bırakır. Varsayılan: `true`.
- `ownerAllowFrom`, yalnızca sahibe özel komutlar ve sahip geçitli kanal eylemleri için açık sahip izin listesidir. `allowFrom` öğesinden ayrıdır.
- `ownerDisplay: "hash"`, sistem istemindeki sahip kimliklerini karma değerine dönüştürür. Karma oluşturmayı denetlemek için `ownerDisplaySecret` ayarını yapın.
- `allowFrom`, sağlayıcı başına ayarlanır. Ayarlandığında **tek** yetkilendirme kaynağıdır (kanal izin listeleri/eşleştirme ve `useAccessGroups` yok sayılır).
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

- [Yapılandırma referansı](/tr/gateway/configuration-reference) — üst düzey anahtarlar
- [Yapılandırma — agent'lar](/tr/gateway/config-agents)
- [Kanallara genel bakış](/tr/channels)
