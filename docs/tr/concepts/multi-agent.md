---
read_when: You want multiple isolated agents (workspaces + auth) in one gateway process.
status: active
summary: 'Çok ajanlı yönlendirme: yalıtılmış ajanlar, kanal hesapları ve bağlamalar'
title: Multi-Agent Routing
x-i18n:
    generated_at: "2026-04-05T13:51:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7e8bc48f229d01aa793ca4137e5a59f2a5ceb0ba65841710aaf69f53a672be60
    source_path: concepts/multi-agent.md
    workflow: 15
---

# Multi-Agent Routing

Amaç: tek bir çalışan Gateway içinde birden fazla _yalıtılmış_ ajan (ayrı çalışma alanı + `agentDir` + oturumlar) ve birden fazla kanal hesabı (ör. iki WhatsApp). Gelen mesajlar bağlamalar aracılığıyla bir ajana yönlendirilir.

## "Bir ajan" nedir?

Bir **ajan**, kendine ait şu bileşenlere sahip, tam kapsamlı bir beyindir:

- **Çalışma alanı** (dosyalar, AGENTS.md/SOUL.md/USER.md, yerel notlar, persona kuralları).
- Kimlik doğrulama profilleri, model kaydı ve ajan başına yapılandırma için **durum dizini** (`agentDir`).
- `~/.openclaw/agents/<agentId>/sessions` altında **oturum deposu** (sohbet geçmişi + yönlendirme durumu).

Kimlik doğrulama profilleri **ajan başınadır**. Her ajan kendi şu dosyasından okur:

```text
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

`sessions_history` burada da daha güvenli oturumlar arası geri çağırma yoludur: ham bir transkript dökümü değil, sınırlı ve temizlenmiş bir görünüm döndürür. Asistan geri çağırması;
düşünme etiketlerini, `<relevant-memories>` iskeletini, düz metin tool-call XML
yüklerini (`<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` ve kısaltılmış tool-call blokları dahil),
seviyesi düşürülmüş tool-call iskeletini, sızdırılmış ASCII/tam genişlikli model kontrol
belirteçlerini ve hatalı MiniMax tool-call XML'ini redaksiyon/kısaltma öncesinde ayıklar.

Ana ajanın kimlik bilgileri **otomatik olarak** paylaşılmaz. `agentDir` dizinini
ajanlar arasında asla yeniden kullanmayın (kimlik doğrulama/oturum çakışmalarına neden olur). Kimlik bilgilerini paylaşmak istiyorsanız,
`auth-profiles.json` dosyasını diğer ajanın `agentDir` dizinine kopyalayın.

Skills, her ajanın çalışma alanından ve `~/.openclaw/skills` gibi paylaşılan köklerden yüklenir;
ardından yapılandırılmışsa etkin ajanın skill izin listesine göre süzülür. Paylaşılan bir temel için
`agents.defaults.skills`, ajan başına değiştirme için
`agents.list[].skills` kullanın. Bkz.
[Skills: per-agent vs shared](/tools/skills#per-agent-vs-shared-skills) ve
[Skills: agent skill allowlists](/tools/skills#agent-skill-allowlists).

Gateway **bir ajanı** (varsayılan) veya **birden fazla ajanı** yan yana barındırabilir.

**Çalışma alanı notu:** her ajanın çalışma alanı varsayılan **cwd**'dir, katı bir
sandbox değildir. Göreli yollar çalışma alanı içinde çözülür, ancak mutlak yollar
sandbox etkinleştirilmedikçe ana bilgisayardaki diğer konumlara erişebilir. Bkz.
[Sandboxing](/gateway/sandboxing).

## Yollar (hızlı harita)

- Yapılandırma: `~/.openclaw/openclaw.json` (veya `OPENCLAW_CONFIG_PATH`)
- Durum dizini: `~/.openclaw` (veya `OPENCLAW_STATE_DIR`)
- Çalışma alanı: `~/.openclaw/workspace` (veya `~/.openclaw/workspace-<agentId>`)
- Ajan dizini: `~/.openclaw/agents/<agentId>/agent` (veya `agents.list[].agentDir`)
- Oturumlar: `~/.openclaw/agents/<agentId>/sessions`

### Tek ajan modu (varsayılan)

Hiçbir şey yapmazsanız, OpenClaw tek bir ajan çalıştırır:

- `agentId` varsayılan olarak **`main`** olur.
- Oturumlar `agent:main:<mainKey>` olarak anahtarlanır.
- Çalışma alanı varsayılan olarak `~/.openclaw/workspace` olur (`OPENCLAW_PROFILE` ayarlıysa `~/.openclaw/workspace-<profile>`).
- Durum varsayılan olarak `~/.openclaw/agents/main/agent` olur.

## Ajan yardımcısı

Yeni bir yalıtılmış ajan eklemek için ajan sihirbazını kullanın:

```bash
openclaw agents add work
```

Ardından gelen mesajları yönlendirmek için `bindings` ekleyin (veya sihirbazın yapmasına izin verin).

Şununla doğrulayın:

```bash
openclaw agents list --bindings
```

## Hızlı başlangıç

<Steps>
  <Step title="Her ajan çalışma alanını oluşturun">

Sihirbazı kullanın veya çalışma alanlarını elle oluşturun:

```bash
openclaw agents add coding
openclaw agents add social
```

Her ajan kendi `SOUL.md`, `AGENTS.md` ve isteğe bağlı `USER.md` dosyalarını alır; ayrıca `~/.openclaw/agents/<agentId>` altında özel bir `agentDir` ve oturum deposu da oluşturulur.

  </Step>

  <Step title="Kanal hesaplarını oluşturun">

Tercih ettiğiniz kanallarda ajan başına bir hesap oluşturun:

- Discord: ajan başına bir bot, Message Content Intent'i etkinleştirin, her belirteci kopyalayın.
- Telegram: BotFather üzerinden ajan başına bir bot, her belirteci kopyalayın.
- WhatsApp: her hesabı kendi telefon numarasına bağlayın.

```bash
openclaw channels login --channel whatsapp --account work
```

Kanal kılavuzlarına bakın: [Discord](/tr/channels/discord), [Telegram](/tr/channels/telegram), [WhatsApp](/tr/channels/whatsapp).

  </Step>

  <Step title="Ajanları, hesapları ve bağlamaları ekleyin">

`agents.list` altına ajanları, `channels.<channel>.accounts` altına kanal hesaplarını ekleyin ve bunları `bindings` ile bağlayın (örnekler aşağıda).

  </Step>

  <Step title="Yeniden başlatın ve doğrulayın">

```bash
openclaw gateway restart
openclaw agents list --bindings
openclaw channels status --probe
```

  </Step>
</Steps>

## Birden fazla ajan = birden fazla kişi, birden fazla kişilik

**Birden fazla ajan** ile her `agentId`, **tamamen yalıtılmış bir persona** haline gelir:

- **Farklı telefon numaraları/hesaplar** (kanal başına `accountId`).
- **Farklı kişilikler** (ajan başına `AGENTS.md` ve `SOUL.md` gibi çalışma alanı dosyaları).
- **Ayrı kimlik doğrulama + oturumlar** (açıkça etkinleştirilmedikçe çapraz konuşma yoktur).

Bu, AI “beyinlerini” ve verilerini yalıtılmış tutarken **birden fazla kişinin**
tek bir Gateway sunucusunu paylaşmasına olanak tanır.

## Ajanlar arası QMD bellek araması

Bir ajanın başka bir ajanın QMD oturum transkriptlerinde arama yapması gerekiyorsa,
`agents.list[].memorySearch.qmd.extraCollections` altında
ek koleksiyonlar ekleyin.
Aynı paylaşılan transkript koleksiyonlarını her ajanın devralması gerekiyorsa yalnızca
`agents.defaults.memorySearch.qmd.extraCollections` kullanın.

```json5
{
  agents: {
    defaults: {
      workspace: "~/workspaces/main",
      memorySearch: {
        qmd: {
          extraCollections: [{ path: "~/agents/family/sessions", name: "family-sessions" }],
        },
      },
    },
    list: [
      {
        id: "main",
        workspace: "~/workspaces/main",
        memorySearch: {
          qmd: {
            extraCollections: [{ path: "notes" }], // çalışma alanı içinde çözülür -> "notes-main" adlı koleksiyon
          },
        },
      },
      { id: "family", workspace: "~/workspaces/family" },
    ],
  },
  memory: {
    backend: "qmd",
    qmd: { includeDefaultMemory: false },
  },
}
```

Ek koleksiyon yolu ajanlar arasında paylaşılabilir, ancak yol ajan çalışma alanının dışındaysa
koleksiyon adı açık kalır. Çalışma alanı içindeki yollar
ajan kapsamlı kalır; böylece her ajan kendi transkript arama kümesini korur.

## Tek WhatsApp numarası, birden fazla kişi (DM bölme)

**Tek bir WhatsApp hesabında** kalırken farklı WhatsApp DM'lerini
**farklı ajanlara** yönlendirebilirsiniz. `peer.kind: "direct"` ile
gönderen E.164'e (ör. `+15551234567`) göre eşleştirin. Yanıtlar yine aynı WhatsApp numarasından gelir
(ajan başına gönderici kimliği yoktur).

Önemli ayrıntı: doğrudan sohbetler ajanın **ana oturum anahtarına** daralır, bu nedenle gerçek yalıtım için
**kişi başına bir ajan** gerekir.

Örnek:

```json5
{
  agents: {
    list: [
      { id: "alex", workspace: "~/.openclaw/workspace-alex" },
      { id: "mia", workspace: "~/.openclaw/workspace-mia" },
    ],
  },
  bindings: [
    {
      agentId: "alex",
      match: { channel: "whatsapp", peer: { kind: "direct", id: "+15551230001" } },
    },
    {
      agentId: "mia",
      match: { channel: "whatsapp", peer: { kind: "direct", id: "+15551230002" } },
    },
  ],
  channels: {
    whatsapp: {
      dmPolicy: "allowlist",
      allowFrom: ["+15551230001", "+15551230002"],
    },
  },
}
```

Notlar:

- DM erişim denetimi ajan başına değil, **WhatsApp hesabı başına küreseldir** (eşleme/izin listesi).
- Paylaşılan gruplar için grubu tek bir ajana bağlayın veya [Broadcast groups](/tr/channels/broadcast-groups) kullanın.

## Yönlendirme kuralları (mesajlar ajanı nasıl seçer)

Bağlamalar **deterministiktir** ve **en spesifik olan kazanır**:

1. `peer` eşleşmesi (tam DM/grup/kanal kimliği)
2. `parentPeer` eşleşmesi (iş parçacığı mirası)
3. `guildId + roles` (Discord rol yönlendirmesi)
4. `guildId` (Discord)
5. `teamId` (Slack)
6. Bir kanal için `accountId` eşleşmesi
7. Kanal düzeyinde eşleşme (`accountId: "*"`)
8. Varsayılan ajana geri dönüş (`agents.list[].default`, aksi halde listedeki ilk giriş, varsayılan: `main`)

Aynı katmanda birden fazla bağlama eşleşirse, yapılandırma sırasındaki ilk olan kazanır.
Bir bağlama birden fazla eşleşme alanı ayarlarsa (ör. `peer` + `guildId`), belirtilen tüm alanlar gerekir (`AND` semantiği).

Önemli hesap kapsamı ayrıntısı:

- `accountId` içermeyen bir bağlama yalnızca varsayılan hesapla eşleşir.
- Bir kanaldaki tüm hesaplar için geri dönüş amacıyla `accountId: "*"` kullanın.
- Aynı ajan için aynı bağlamayı daha sonra açık bir hesap kimliğiyle eklerseniz, OpenClaw mevcut yalnızca kanal düzeyindeki bağlamayı kopyalamak yerine hesap kapsamlı hale yükseltir.

## Birden fazla hesap / telefon numarası

**Birden fazla hesabı** destekleyen kanallar (ör. WhatsApp), her oturumu tanımlamak için
`accountId` kullanır. Her `accountId` farklı bir ajana yönlendirilebilir; böylece tek bir sunucu
oturumları karıştırmadan birden fazla telefon numarasını barındırabilir.

`accountId` atlandığında kanal düzeyinde varsayılan bir hesap istiyorsanız,
`channels.<channel>.defaultAccount` ayarlayın (isteğe bağlı). Ayarlanmazsa, OpenClaw önce varsa
`default` hesabına, aksi halde yapılandırılmış ilk hesap kimliğine (sıralı) geri döner.

Bu düzeni destekleyen yaygın kanallar şunlardır:

- `whatsapp`, `telegram`, `discord`, `slack`, `signal`, `imessage`
- `irc`, `line`, `googlechat`, `mattermost`, `matrix`, `nextcloud-talk`
- `bluebubbles`, `zalo`, `zalouser`, `nostr`, `feishu`

## Kavramlar

- `agentId`: tek bir “beyin” (çalışma alanı, ajan başına kimlik doğrulama, ajan başına oturum deposu).
- `accountId`: tek bir kanal hesabı örneği (ör. WhatsApp hesabı `"personal"` ile `"biz"`).
- `binding`: gelen mesajları `(channel, accountId, peer)` ve isteğe bağlı guild/team kimliklerine göre bir `agentId`'ye yönlendirir.
- Doğrudan sohbetler `agent:<agentId>:<mainKey>` anahtarına daralır (ajan başına “main”; `session.mainKey`).

## Platform örnekleri

### Ajan başına Discord botları

Her Discord bot hesabı benzersiz bir `accountId` ile eşleşir. Her hesabı bir ajana bağlayın ve bot başına izin listelerini koruyun.

```json5
{
  agents: {
    list: [
      { id: "main", workspace: "~/.openclaw/workspace-main" },
      { id: "coding", workspace: "~/.openclaw/workspace-coding" },
    ],
  },
  bindings: [
    { agentId: "main", match: { channel: "discord", accountId: "default" } },
    { agentId: "coding", match: { channel: "discord", accountId: "coding" } },
  ],
  channels: {
    discord: {
      groupPolicy: "allowlist",
      accounts: {
        default: {
          token: "DISCORD_BOT_TOKEN_MAIN",
          guilds: {
            "123456789012345678": {
              channels: {
                "222222222222222222": { allow: true, requireMention: false },
              },
            },
          },
        },
        coding: {
          token: "DISCORD_BOT_TOKEN_CODING",
          guilds: {
            "123456789012345678": {
              channels: {
                "333333333333333333": { allow: true, requireMention: false },
              },
            },
          },
        },
      },
    },
  },
}
```

Notlar:

- Her botu guild'e davet edin ve Message Content Intent'i etkinleştirin.
- Belirteçler `channels.discord.accounts.<id>.token` içinde tutulur (varsayılan hesap `DISCORD_BOT_TOKEN` kullanabilir).

### Ajan başına Telegram botları

```json5
{
  agents: {
    list: [
      { id: "main", workspace: "~/.openclaw/workspace-main" },
      { id: "alerts", workspace: "~/.openclaw/workspace-alerts" },
    ],
  },
  bindings: [
    { agentId: "main", match: { channel: "telegram", accountId: "default" } },
    { agentId: "alerts", match: { channel: "telegram", accountId: "alerts" } },
  ],
  channels: {
    telegram: {
      accounts: {
        default: {
          botToken: "123456:ABC...",
          dmPolicy: "pairing",
        },
        alerts: {
          botToken: "987654:XYZ...",
          dmPolicy: "allowlist",
          allowFrom: ["tg:123456789"],
        },
      },
    },
  },
}
```

Notlar:

- BotFather ile ajan başına bir bot oluşturun ve her belirteci kopyalayın.
- Belirteçler `channels.telegram.accounts.<id>.botToken` içinde tutulur (varsayılan hesap `TELEGRAM_BOT_TOKEN` kullanabilir).

### Ajan başına WhatsApp numaraları

Gateway'i başlatmadan önce her hesabı bağlayın:

```bash
openclaw channels login --channel whatsapp --account personal
openclaw channels login --channel whatsapp --account biz
```

`~/.openclaw/openclaw.json` (JSON5):

```js
{
  agents: {
    list: [
      {
        id: "home",
        default: true,
        name: "Home",
        workspace: "~/.openclaw/workspace-home",
        agentDir: "~/.openclaw/agents/home/agent",
      },
      {
        id: "work",
        name: "Work",
        workspace: "~/.openclaw/workspace-work",
        agentDir: "~/.openclaw/agents/work/agent",
      },
    ],
  },

  // Deterministik yönlendirme: ilk eşleşme kazanır (en spesifik olanlar önce).
  bindings: [
    { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },

    // İsteğe bağlı eş başına geçersiz kılma (örnek: belirli bir grubu work ajanına gönder).
    {
      agentId: "work",
      match: {
        channel: "whatsapp",
        accountId: "personal",
        peer: { kind: "group", id: "1203630...@g.us" },
      },
    },
  ],

  // Varsayılan olarak kapalıdır: ajanlar arası mesajlaşma açıkça etkinleştirilmeli + izin listesine alınmalıdır.
  tools: {
    agentToAgent: {
      enabled: false,
      allow: ["home", "work"],
    },
  },

  channels: {
    whatsapp: {
      accounts: {
        personal: {
          // İsteğe bağlı geçersiz kılma. Varsayılan: ~/.openclaw/credentials/whatsapp/personal
          // authDir: "~/.openclaw/credentials/whatsapp/personal",
        },
        biz: {
          // İsteğe bağlı geçersiz kılma. Varsayılan: ~/.openclaw/credentials/whatsapp/biz
          // authDir: "~/.openclaw/credentials/whatsapp/biz",
        },
      },
    },
  },
}
```

## Örnek: WhatsApp günlük sohbet + Telegram derin çalışma

Kanala göre bölün: WhatsApp'ı hızlı günlük bir ajana, Telegram'ı bir Opus ajanına yönlendirin.

```json5
{
  agents: {
    list: [
      {
        id: "chat",
        name: "Everyday",
        workspace: "~/.openclaw/workspace-chat",
        model: "anthropic/claude-sonnet-4-6",
      },
      {
        id: "opus",
        name: "Deep Work",
        workspace: "~/.openclaw/workspace-opus",
        model: "anthropic/claude-opus-4-6",
      },
    ],
  },
  bindings: [
    { agentId: "chat", match: { channel: "whatsapp" } },
    { agentId: "opus", match: { channel: "telegram" } },
  ],
}
```

Notlar:

- Bir kanal için birden fazla hesabınız varsa, bağlamaya `accountId` ekleyin (örneğin `{ channel: "whatsapp", accountId: "personal" }`).
- Geri kalanları chat üzerinde bırakırken tek bir DM/grubu Opus'a yönlendirmek için o eş için bir `match.peer` bağlaması ekleyin; eş eşleşmeleri her zaman kanal geneli kurallardan daha önceliklidir.

## Örnek: aynı kanal, bir eş Opus'a

WhatsApp'ı hızlı ajan üzerinde tutun, ancak bir DM'yi Opus'a yönlendirin:

```json5
{
  agents: {
    list: [
      {
        id: "chat",
        name: "Everyday",
        workspace: "~/.openclaw/workspace-chat",
        model: "anthropic/claude-sonnet-4-6",
      },
      {
        id: "opus",
        name: "Deep Work",
        workspace: "~/.openclaw/workspace-opus",
        model: "anthropic/claude-opus-4-6",
      },
    ],
  },
  bindings: [
    {
      agentId: "opus",
      match: { channel: "whatsapp", peer: { kind: "direct", id: "+15551234567" } },
    },
    { agentId: "chat", match: { channel: "whatsapp" } },
  ],
}
```

Eş bağlamaları her zaman kazanır, bu yüzden onları kanal geneli kuralın üstünde tutun.

## Bir WhatsApp grubuna bağlanmış aile ajanı

Belirli bir WhatsApp grubuna özel bir aile ajanı bağlayın; mention geçitlemesi
ve daha sıkı bir araç ilkesi kullanın:

```json5
{
  agents: {
    list: [
      {
        id: "family",
        name: "Family",
        workspace: "~/.openclaw/workspace-family",
        identity: { name: "Family Bot" },
        groupChat: {
          mentionPatterns: ["@family", "@familybot", "@Family Bot"],
        },
        sandbox: {
          mode: "all",
          scope: "agent",
        },
        tools: {
          allow: [
            "exec",
            "read",
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
          ],
          deny: ["write", "edit", "apply_patch", "browser", "canvas", "nodes", "cron"],
        },
      },
    ],
  },
  bindings: [
    {
      agentId: "family",
      match: {
        channel: "whatsapp",
        peer: { kind: "group", id: "120363999999999999@g.us" },
      },
    },
  ],
}
```

Notlar:

- Araç allow/deny listeleri **araçlar** içindir, skill'ler için değil. Bir skill'in bir
  ikili dosya çalıştırması gerekiyorsa, `exec` izninin verildiğinden ve ikili dosyanın sandbox içinde bulunduğundan emin olun.
- Daha sıkı geçitleme için `agents.list[].groupChat.mentionPatterns` ayarlayın ve
  kanal için grup izin listelerini etkin tutun.

## Ajan Başına Sandbox ve Araç Yapılandırması

Her ajanın kendi sandbox ve araç kısıtlamaları olabilir:

```js
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: {
          mode: "off",  // Kişisel ajan için sandbox yok
        },
        // Araç kısıtlaması yok - tüm araçlar kullanılabilir
      },
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: {
          mode: "all",     // Her zaman sandbox içinde
          scope: "agent",  // Ajan başına bir kapsayıcı
          docker: {
            // Kapsayıcı oluşturulduktan sonra isteğe bağlı tek seferlik kurulum
            setupCommand: "apt-get update && apt-get install -y git curl",
          },
        },
        tools: {
          allow: ["read"],                    // Yalnızca read aracı
          deny: ["exec", "write", "edit", "apply_patch"],    // Diğerlerini reddet
        },
      },
    ],
  },
}
```

Not: `setupCommand`, `sandbox.docker` altında bulunur ve kapsayıcı oluşturulurken bir kez çalıştırılır.
Çözümlenen kapsam `"shared"` olduğunda ajan başına `sandbox.docker.*` geçersiz kılmaları yok sayılır.

**Faydalar:**

- **Güvenlik yalıtımı**: Güvenilmeyen ajanlar için araçları kısıtlayın
- **Kaynak kontrolü**: Belirli ajanları sandbox içine alın, diğerlerini ana bilgisayarda tutun
- **Esnek ilkeler**: Ajan başına farklı izinler

Not: `tools.elevated` **küreseldir** ve gönderici tabanlıdır; ajan başına yapılandırılamaz.
Ajan başına sınırlar gerekiyorsa `exec`'i reddetmek için `agents.list[].tools` kullanın.
Grup hedefleme için, @mention'ların doğru ajana temiz şekilde eşlenmesi amacıyla `agents.list[].groupChat.mentionPatterns` kullanın.

Ayrıntılı örnekler için [Multi-Agent Sandbox & Tools](/tools/multi-agent-sandbox-tools) bölümüne bakın.

## İlgili

- [Channel Routing](/tr/channels/channel-routing) — mesajların ajanlara nasıl yönlendirildiği
- [Sub-Agents](/tools/subagents) — arka planda ajan çalıştırmaları başlatma
- [ACP Agents](/tools/acp-agents) — harici kodlama düzeneklerini çalıştırma
- [Presence](/concepts/presence) — ajan varlığı ve kullanılabilirliği
- [Session](/concepts/session) — oturum yalıtımı ve yönlendirme
