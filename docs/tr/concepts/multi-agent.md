---
read_when: You want multiple isolated agents (workspaces + auth) in one gateway process.
status: active
summary: 'Çoklu aracı yönlendirme: yalıtılmış aracılar, kanal hesapları ve binding''ler'
title: Çoklu aracı yönlendirme
x-i18n:
    generated_at: "2026-04-24T09:05:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: ef6f91c53a14bf92427f08243930e4aab50ac7853c9b22b0dbdbb853ea1a93d2
    source_path: concepts/multi-agent.md
    workflow: 15
---

Bir çalışan Gateway içinde birden çok _yalıtılmış_ aracı çalıştırın — her birinin kendi çalışma alanı, durum dizini (`agentDir`) ve oturum geçmişi olsun — ayrıca birden çok kanal hesabı (ör. iki WhatsApp) kullanın. Gelen mesajlar binding'ler aracılığıyla doğru aracıya yönlendirilir.

Buradaki bir **aracı**, kişi başına tam persona kapsamıdır: çalışma alanı dosyaları, kimlik doğrulama profilleri, model kaydı ve oturum deposu. `agentDir`, `~/.openclaw/agents/<agentId>/` altında bu aracıya özgü config'i tutan disk üzerindeki durum dizinidir. Bir **binding**, bir kanal hesabını (ör. bir Slack çalışma alanı veya bir WhatsApp numarası) bu aracılardan birine eşler.

## "Bir aracı" nedir?

Bir **aracı**, kendine ait şunları barındıran tam kapsamlı bir beyindir:

- **Çalışma alanı** (dosyalar, AGENTS.md/SOUL.md/USER.md, yerel notlar, persona kuralları).
- Kimlik doğrulama profilleri, model kaydı ve aracı başına config için **durum dizini** (`agentDir`).
- `~/.openclaw/agents/<agentId>/sessions` altında **oturum deposu** (sohbet geçmişi + yönlendirme durumu).

Kimlik doğrulama profilleri **aracı başınadır**. Her aracı, kendi dosyasından okur:

```text
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

`sessions_history`, burada da oturumlar arası geri çağırma için daha güvenli yoldur: ham transcript dökümü değil,
sınırlı ve sanitize edilmiş bir görünüm döndürür. Asistan geri çağırması;
thinking etiketlerini, `<relevant-memories>` iskelesini, düz metin araç çağrısı XML
payload'larını (`<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` ve kesilmiş araç çağrısı blokları dahil),
düşürülmüş araç çağrısı iskelesini, sızan ASCII/tam genişlikte model kontrol
token'larını ve redaksiyon/kırpmadan önce bozuk MiniMax araç çağrısı XML'ini çıkarır.

Ana aracı kimlik bilgileri **otomatik olarak paylaşılmaz**. `agentDir` öğesini
aracılar arasında asla yeniden kullanmayın (kimlik doğrulama/oturum çakışmalarına yol açar). Kimlik bilgilerini paylaşmak istiyorsanız,
`auth-profiles.json` dosyasını diğer aracının `agentDir` dizinine kopyalayın.

Skills, her aracı çalışma alanından ve `~/.openclaw/skills` gibi paylaşılan köklerden yüklenir,
ardından yapılandırılmışsa etkin aracı Skill izin listesine göre filtrelenir. Paylaşılan bir temel için
`agents.defaults.skills`, aracı başına değiştirme için
`agents.list[].skills` kullanın. Bkz.
[Skills: per-agent vs shared](/tr/tools/skills#per-agent-vs-shared-skills) ve
[Skills: agent skill allowlists](/tr/tools/skills#agent-skill-allowlists).

Gateway, yan yana **bir aracı** (varsayılan) veya **birçok aracı** barındırabilir.

**Çalışma alanı notu:** her aracının çalışma alanı varsayılan **cwd**'dir, katı
bir sandbox değildir. Göreli yollar çalışma alanı içinde çözülür, ancak mutlak yollar
sandboxing etkin değilse ana bilgisayardaki başka konumlara erişebilir. Bkz.
[Sandboxing](/tr/gateway/sandboxing).

## Yollar (hızlı harita)

- Config: `~/.openclaw/openclaw.json` (veya `OPENCLAW_CONFIG_PATH`)
- Durum dizini: `~/.openclaw` (veya `OPENCLAW_STATE_DIR`)
- Çalışma alanı: `~/.openclaw/workspace` (veya `~/.openclaw/workspace-<agentId>`)
- Aracı dizini: `~/.openclaw/agents/<agentId>/agent` (veya `agents.list[].agentDir`)
- Oturumlar: `~/.openclaw/agents/<agentId>/sessions`

### Tek aracı modu (varsayılan)

Hiçbir şey yapmazsanız, OpenClaw tek bir aracı çalıştırır:

- `agentId`, varsayılan olarak **`main`** olur.
- Oturum anahtarları `agent:main:<mainKey>` olarak oluşturulur.
- Çalışma alanı varsayılan olarak `~/.openclaw/workspace` olur (`OPENCLAW_PROFILE` ayarlıysa `~/.openclaw/workspace-<profile>`).
- Durum varsayılan olarak `~/.openclaw/agents/main/agent` olur.

## Aracı yardımcısı

Yeni yalıtılmış bir aracı eklemek için aracı sihirbazını kullanın:

```bash
openclaw agents add work
```

Ardından gelen mesajları yönlendirmek için `bindings` ekleyin (veya sihirbazın bunu yapmasına izin verin).

Şununla doğrulayın:

```bash
openclaw agents list --bindings
```

## Hızlı başlangıç

<Steps>
  <Step title="Her aracı çalışma alanını oluşturun">

Sihirbazı kullanın veya çalışma alanlarını manuel olarak oluşturun:

```bash
openclaw agents add coding
openclaw agents add social
```

Her aracı, `SOUL.md`, `AGENTS.md` ve isteğe bağlı `USER.md` içeren kendi çalışma alanını, ayrıca `~/.openclaw/agents/<agentId>` altında ayrılmış bir `agentDir` ve oturum deposunu alır.

  </Step>

  <Step title="Kanal hesapları oluşturun">

Tercih ettiğiniz kanallarda aracı başına bir hesap oluşturun:

- Discord: aracı başına bir bot, Message Content Intent'i etkinleştirin, her token'ı kopyalayın.
- Telegram: BotFather üzerinden aracı başına bir bot, her token'ı kopyalayın.
- WhatsApp: hesap başına her telefon numarasını bağlayın.

```bash
openclaw channels login --channel whatsapp --account work
```

Kanal kılavuzlarına bakın: [Discord](/tr/channels/discord), [Telegram](/tr/channels/telegram), [WhatsApp](/tr/channels/whatsapp).

  </Step>

  <Step title="Aracıları, hesapları ve binding'leri ekleyin">

`agents.list` altına aracıları, `channels.<channel>.accounts` altına kanal hesaplarını ekleyin ve bunları `bindings` ile bağlayın (örnekler aşağıda).

  </Step>

  <Step title="Yeniden başlatın ve doğrulayın">

```bash
openclaw gateway restart
openclaw agents list --bindings
openclaw channels status --probe
```

  </Step>
</Steps>

## Birden çok aracı = birden çok kişi, birden çok kişilik

**Birden çok aracı** ile, her `agentId` **tamamen yalıtılmış bir persona** olur:

- **Farklı telefon numaraları/hesaplar** (kanal `accountId` başına).
- **Farklı kişilikler** (`AGENTS.md` ve `SOUL.md` gibi aracı başına çalışma alanı dosyalarıyla).
- **Ayrı kimlik doğrulama + oturumlar** (açıkça etkinleştirilmedikçe çapraz konuşma yok).

Bu, **birden çok kişinin** tek bir Gateway sunucusunu paylaşmasına ve AI “beyinlerini” ve verilerini yalıtılmış tutmasına olanak tanır.

## Aracılar arası QMD bellek araması

Bir aracı başka bir aracının QMD oturum transcript'lerini aramalıysa,
`agents.list[].memorySearch.qmd.extraCollections` altına
ek koleksiyonlar ekleyin.
Aynı paylaşılan transcript koleksiyonlarını her aracının devralması gerektiğinde yalnızca
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

Ek koleksiyon yolu aracılar arasında paylaşılabilir, ancak yol aracı çalışma alanının dışındaysa
koleksiyon adı açık kalır. Çalışma alanı içindeki yollar aracı kapsamlı kalır, böylece her aracı kendi transcript arama kümesini korur.

## Bir WhatsApp numarası, birden çok kişi (DM bölme)

**Tek bir WhatsApp hesabında** kalarak **farklı WhatsApp DM'lerini** farklı aracılara yönlendirebilirsiniz. `peer.kind: "direct"` ile gönderen E.164'e (ör. `+15551234567`) göre eşleştirin. Yanıtlar yine aynı WhatsApp numarasından gelir (aracı başına gönderen kimliği yoktur).

Önemli ayrıntı: doğrudan sohbetler aracının **ana oturum anahtarında** toplanır, bu nedenle gerçek yalıtım için **kişi başına bir aracı** gerekir.

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

- DM erişim denetimi aracı başına değil, **WhatsApp hesabı başına globaldir** (pairing/allowlist).
- Paylaşılan gruplar için grubu bir aracıya bağlayın veya [Broadcast groups](/tr/channels/broadcast-groups) kullanın.

## Yönlendirme kuralları (mesajlar nasıl aracı seçer)

Binding'ler **deterministik**tir ve **en spesifik olan kazanır**:

1. `peer` eşleşmesi (tam DM/grup/kanal kimliği)
2. `parentPeer` eşleşmesi (thread mirası)
3. `guildId + roles` (Discord rol yönlendirmesi)
4. `guildId` (Discord)
5. `teamId` (Slack)
6. Bir kanal için `accountId` eşleşmesi
7. kanal düzeyi eşleşme (`accountId: "*"`)
8. varsayılan aracıya fallback (`agents.list[].default`, aksi halde listedeki ilk giriş, varsayılan: `main`)

Aynı katmanda birden çok binding eşleşirse, config sırasındaki ilk kazanır.
Bir binding birden çok eşleşme alanı ayarlıyorsa (örneğin `peer` + `guildId`), belirtilen tüm alanlar zorunludur (`AND` semantiği).

Önemli hesap kapsamı ayrıntısı:

- `accountId` atlayan bir binding yalnızca varsayılan hesapla eşleşir.
- Tüm hesaplar için kanal genelinde fallback amacıyla `accountId: "*"` kullanın.
- Daha sonra aynı aracı için aynı binding'i açık bir hesap kimliğiyle eklerseniz, OpenClaw mevcut yalnızca kanal binding'ini yinelemek yerine hesap kapsamlı hâle yükseltir.

## Birden çok hesap / telefon numarası

**Birden çok hesabı** destekleyen kanallar (ör. WhatsApp), her
girişi tanımlamak için `accountId` kullanır. Her `accountId` farklı bir aracıya yönlendirilebilir, böylece tek bir sunucu
oturumları karıştırmadan birden çok telefon numarasını barındırabilir.

`accountId` atlandığında kanal genelinde varsayılan bir hesap istiyorsanız,
`channels.<channel>.defaultAccount` ayarlayın (isteğe bağlı). Ayarlanmadığında OpenClaw,
mevcutsa `default` değerine, aksi halde yapılandırılmış ilk hesap kimliğine (sıralı) fallback yapar.

Bu deseni destekleyen yaygın kanallar şunlardır:

- `whatsapp`, `telegram`, `discord`, `slack`, `signal`, `imessage`
- `irc`, `line`, `googlechat`, `mattermost`, `matrix`, `nextcloud-talk`
- `bluebubbles`, `zalo`, `zalouser`, `nostr`, `feishu`

## Kavramlar

- `agentId`: bir “beyin” (çalışma alanı, aracı başına kimlik doğrulama, aracı başına oturum deposu).
- `accountId`: bir kanal hesap örneği (ör. WhatsApp hesabı `"personal"` ile `"biz"`).
- `binding`: gelen mesajları `(channel, accountId, peer)` ve isteğe bağlı guild/team kimliklerine göre bir `agentId`'ye yönlendirir.
- Doğrudan sohbetler `agent:<agentId>:<mainKey>` içinde toplanır (aracı başına “main”; `session.mainKey`).

## Platform örnekleri

### Aracı başına Discord botları

Her Discord bot hesabı benzersiz bir `accountId` ile eşleşir. Her hesabı bir aracıya bağlayın ve bot başına allowlist'leri koruyun.

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

- Her botu sunucuya davet edin ve Message Content Intent'i etkinleştirin.
- Token'lar `channels.discord.accounts.<id>.token` içinde bulunur (varsayılan hesap `DISCORD_BOT_TOKEN` kullanabilir).

### Aracı başına Telegram botları

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

- BotFather ile aracı başına bir bot oluşturun ve her token'ı kopyalayın.
- Token'lar `channels.telegram.accounts.<id>.botToken` içinde bulunur (varsayılan hesap `TELEGRAM_BOT_TOKEN` kullanabilir).

### Aracı başına WhatsApp numaraları

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
        name: "Ev",
        workspace: "~/.openclaw/workspace-home",
        agentDir: "~/.openclaw/agents/home/agent",
      },
      {
        id: "work",
        name: "İş",
        workspace: "~/.openclaw/workspace-work",
        agentDir: "~/.openclaw/agents/work/agent",
      },
    ],
  },

  // Deterministik yönlendirme: ilk eşleşme kazanır (en spesifik önce).
  bindings: [
    { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },

    // İsteğe bağlı eş başına geçersiz kılma (örnek: belirli bir grubu iş aracısına gönder).
    {
      agentId: "work",
      match: {
        channel: "whatsapp",
        accountId: "personal",
        peer: { kind: "group", id: "1203630...@g.us" },
      },
    },
  ],

  // Varsayılan olarak kapalı: aracılar arası mesajlaşma açıkça etkinleştirilmeli + allowlist'e alınmalıdır.
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

Kanala göre bölün: WhatsApp'ı hızlı günlük bir aracıya, Telegram'ı bir Opus aracısına yönlendirin.

```json5
{
  agents: {
    list: [
      {
        id: "chat",
        name: "Günlük",
        workspace: "~/.openclaw/workspace-chat",
        model: "anthropic/claude-sonnet-4-6",
      },
      {
        id: "opus",
        name: "Derin Çalışma",
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

- Bir kanal için birden çok hesabınız varsa binding'e `accountId` ekleyin (örneğin `{ channel: "whatsapp", accountId: "personal" }`).
- Geri kalanı chat üzerinde tutarken tek bir DM/grubu Opus'a yönlendirmek için o eş için bir `match.peer` binding'i ekleyin; eş eşleşmeleri her zaman kanal genelindeki kurallara üstün gelir.

## Örnek: aynı kanal, bir eş Opus'a

WhatsApp'ı hızlı aracı üzerinde tutun, ancak bir DM'yi Opus'a yönlendirin:

```json5
{
  agents: {
    list: [
      {
        id: "chat",
        name: "Günlük",
        workspace: "~/.openclaw/workspace-chat",
        model: "anthropic/claude-sonnet-4-6",
      },
      {
        id: "opus",
        name: "Derin Çalışma",
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

Eş binding'leri her zaman kazanır, bu yüzden bunları kanal genelindeki kuralın üstünde tutun.

## Bir WhatsApp grubuna bağlanmış aile aracısı

Mention sınırlaması
ve daha sıkı bir araç ilkesi ile ayrılmış bir aile aracısını tek bir WhatsApp grubuna bağlayın:

```json5
{
  agents: {
    list: [
      {
        id: "family",
        name: "Aile",
        workspace: "~/.openclaw/workspace-family",
        identity: { name: "Aile Botu" },
        groupChat: {
          mentionPatterns: ["@family", "@familybot", "@Aile Botu"],
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

- Araç allow/deny listeleri **araçlar** içindir, Skill'ler değil. Bir Skill bir
  ikili dosya çalıştırmak zorundaysa `exec` izni verildiğinden ve ikili dosyanın sandbox içinde bulunduğundan emin olun.
- Daha sıkı sınırlama için `agents.list[].groupChat.mentionPatterns` ayarlayın ve
  kanal için grup allowlist'lerini etkin tutun.

## Aracı Başına Sandbox ve Araç Yapılandırması

Her aracının kendi sandbox'ı ve araç kısıtlamaları olabilir:

```js
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: {
          mode: "off",  // kişisel aracı için sandbox yok
        },
        // Araç kısıtlaması yok - tüm araçlar kullanılabilir
      },
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: {
          mode: "all",     // her zaman sandbox içinde
          scope: "agent",  // aracı başına bir container
          docker: {
            // Container oluşturulduktan sonra isteğe bağlı tek seferlik kurulum
            setupCommand: "apt-get update && apt-get install -y git curl",
          },
        },
        tools: {
          allow: ["read"],                    // yalnızca read aracı
          deny: ["exec", "write", "edit", "apply_patch"],    // diğerlerini reddet
        },
      },
    ],
  },
}
```

Not: `setupCommand`, `sandbox.docker` altında bulunur ve container oluşturulurken bir kez çalışır.
Çözümlenen kapsam `"shared"` olduğunda aracı başına `sandbox.docker.*` geçersiz kılmaları yok sayılır.

**Avantajlar:**

- **Güvenlik yalıtımı**: Güvenilmeyen aracılar için araçları kısıtlayın
- **Kaynak denetimi**: Belirli aracıları sandbox içine alırken diğerlerini ana makinede tutun
- **Esnek ilkeler**: Aracı başına farklı izinler

Not: `tools.elevated` **globaldir** ve gönderen tabanlıdır; aracı başına yapılandırılamaz.
Aracı başına sınırlar istiyorsanız `exec` aracını reddetmek için `agents.list[].tools` kullanın.
Grup hedefleme için @mention'ların amaçlanan aracıya temiz şekilde eşlenmesi amacıyla `agents.list[].groupChat.mentionPatterns` kullanın.

Ayrıntılı örnekler için bkz. [Multi-Agent Sandbox & Tools](/tr/tools/multi-agent-sandbox-tools).

## İlgili

- [Channel Routing](/tr/channels/channel-routing) — mesajların aracılara nasıl yönlendirildiği
- [Sub-Agents](/tr/tools/subagents) — arka plan aracı çalıştırmaları oluşturma
- [ACP Agents](/tr/tools/acp-agents) — harici kodlama harness'lerini çalıştırma
- [Presence](/tr/concepts/presence) — aracı varlığı ve kullanılabilirliği
- [Session](/tr/concepts/session) — oturum yalıtımı ve yönlendirme
