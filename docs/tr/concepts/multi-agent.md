---
read_when: You want multiple isolated agents (workspaces + auth) in one gateway process.
sidebarTitle: Multi-agent routing
status: active
summary: 'Çok aracılı yönlendirme: yalıtılmış aracılar, kanal hesapları ve bağlamalar'
title: Çoklu ajan yönlendirmesi
x-i18n:
    generated_at: "2026-05-10T19:33:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7fd194cbe0938cc6ef6dd9b9803d2b1fe6f3e0777f4df7c407c692fd9f743c59
    source_path: concepts/multi-agent.md
    workflow: 16
---

Bir çalışan Gateway içinde birden çok _yalıtılmış_ ajan çalıştırın — her biri kendi çalışma alanı, durum dizini (`agentDir`) ve oturum geçmişiyle — ayrıca birden çok kanal hesabı (ör. iki WhatsApp) kullanın. Gelen iletiler bağlamalar üzerinden doğru ajana yönlendirilir.

Buradaki **ajan**, kişi başına tam kapsamdır: çalışma alanı dosyaları, kimlik doğrulama profilleri, model kayıt defteri ve oturum deposu. `agentDir`, bu ajan başına yapılandırmayı `~/.openclaw/agents/<agentId>/` konumunda tutan disk üzerindeki durum dizinidir. **Bağlama**, bir kanal hesabını (ör. bir Slack çalışma alanı veya bir WhatsApp numarası) bu ajanlardan birine eşler.

## "Tek ajan" nedir?

Bir **ajan**, kendine ait tam kapsamlı bir beyindir:

- **Çalışma alanı** (dosyalar, AGENTS.md/SOUL.md/USER.md, yerel notlar, persona kuralları).
- Kimlik doğrulama profilleri, model kayıt defteri ve ajan başına yapılandırma için **durum dizini** (`agentDir`).
- `~/.openclaw/agents/<agentId>/sessions` altında **oturum deposu** (sohbet geçmişi + yönlendirme durumu).

Kimlik doğrulama profilleri **ajan başınadır**. Her ajan kendi şuradan okur:

```text
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

<Note>
`sessions_history` burada da daha güvenli oturumlar arası hatırlama yoludur: ham döküm dökümü değil, sınırlı ve temizlenmiş bir görünüm döndürür. Asistan hatırlaması, redaksiyon/kısaltma öncesinde düşünme etiketlerini, `<relevant-memories>` iskeletini, düz metin araç çağrısı XML yüklerini (`<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` ve kısaltılmış araç çağrısı blokları dahil), düşürülmüş araç çağrısı iskeletini, sızmış ASCII/tam genişlikli model kontrol tokenlarını ve hatalı biçimlendirilmiş MiniMax araç çağrısı XML'ini çıkarır.
</Note>

<Warning>
`agentDir` değerini ajanlar arasında asla yeniden kullanmayın (kimlik doğrulama/oturum çakışmalarına neden olur). Ajanlar yerel profilleri olmadığında varsayılan/ana ajanın kimlik doğrulama profillerine okuyarak erişebilir, ancak OpenClaw OAuth yenileme tokenlarını ikincil ajan deposuna klonlamaz. Bağımsız bir OAuth hesabı istiyorsanız o ajandan oturum açın; kimlik bilgilerini elle kopyalıyorsanız yalnızca taşınabilir statik `api_key` veya `token` profillerini kopyalayın.
</Warning>

Skills, her ajan çalışma alanından ve `~/.openclaw/skills` gibi paylaşılan köklerden yüklenir, ardından yapılandırıldığında etkin ajan Skills izin listesine göre filtrelenir. Paylaşılan bir temel için `agents.defaults.skills`, ajan başına değiştirme için `agents.list[].skills` kullanın. Bkz. [Skills: ajan başına ve paylaşılan](/tr/tools/skills#per-agent-vs-shared-skills) ve [Skills: ajan Skills izin listeleri](/tr/tools/skills#agent-skill-allowlists).

Gateway **tek ajanı** (varsayılan) veya **birçok ajanı** yan yana barındırabilir.

<Note>
**Çalışma alanı notu:** her ajanın çalışma alanı **varsayılan cwd**'dir, sert bir sandbox değildir. Göreli yollar çalışma alanının içinde çözümlenir, ancak sandboxing etkinleştirilmedikçe mutlak yollar ana makinedeki diğer konumlara erişebilir. Bkz. [Sandboxing](/tr/gateway/sandboxing).
</Note>

## Yollar (hızlı harita)

- Yapılandırma: `~/.openclaw/openclaw.json` (veya `OPENCLAW_CONFIG_PATH`)
- Durum dizini: `~/.openclaw` (veya `OPENCLAW_STATE_DIR`)
- Çalışma alanı: `~/.openclaw/workspace` (veya `~/.openclaw/workspace-<agentId>`)
- Ajan dizini: `~/.openclaw/agents/<agentId>/agent` (veya `agents.list[].agentDir`)
- Oturumlar: `~/.openclaw/agents/<agentId>/sessions`

### Tek ajan modu (varsayılan)

Hiçbir şey yapmazsanız OpenClaw tek bir ajan çalıştırır:

- `agentId` varsayılan olarak **`main`** olur.
- Oturumlar `agent:main:<mainKey>` olarak anahtarlanır.
- Çalışma alanı varsayılan olarak `~/.openclaw/workspace` olur (veya `OPENCLAW_PROFILE` ayarlandığında `~/.openclaw/workspace-<profile>`).
- Durum varsayılan olarak `~/.openclaw/agents/main/agent` olur.

## Ajan yardımcısı

Yeni bir yalıtılmış ajan eklemek için ajan sihirbazını kullanın:

```bash
openclaw agents add work
```

Ardından gelen iletileri yönlendirmek için `bindings` ekleyin (veya sihirbazın yapmasına izin verin).

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

    Her ajan, `SOUL.md`, `AGENTS.md` ve isteğe bağlı `USER.md` içeren kendi çalışma alanını, ayrıca ayrılmış bir `agentDir` ve `~/.openclaw/agents/<agentId>` altında oturum deposunu alır.

  </Step>
  <Step title="Kanal hesapları oluşturun">
    Tercih ettiğiniz kanallarda ajan başına bir hesap oluşturun:

    - Discord: ajan başına bir bot, Message Content Intent'i etkinleştirin, her tokenı kopyalayın.
    - Telegram: BotFather üzerinden ajan başına bir bot, her tokenı kopyalayın.
    - WhatsApp: hesap başına her telefon numarasını bağlayın.

    ```bash
    openclaw channels login --channel whatsapp --account work
    ```

    Kanal kılavuzlarına bakın: [Discord](/tr/channels/discord), [Telegram](/tr/channels/telegram), [WhatsApp](/tr/channels/whatsapp).

  </Step>
  <Step title="Ajanları, hesapları ve bağlamaları ekleyin">
    Ajanları `agents.list` altına, kanal hesaplarını `channels.<channel>.accounts` altına ekleyin ve bunları `bindings` ile bağlayın (örnekler aşağıda).
  </Step>
  <Step title="Yeniden başlatın ve doğrulayın">
    ```bash
    openclaw gateway restart
    openclaw agents list --bindings
    openclaw channels status --probe
    ```
  </Step>
</Steps>

## Birden çok ajan = birden çok kişi, birden çok kişilik

**Birden çok ajan** ile her `agentId` **tamamen yalıtılmış bir persona** olur:

- **Farklı telefon numaraları/hesaplar** (kanal başına `accountId`).
- **Farklı kişilikler** (`AGENTS.md` ve `SOUL.md` gibi ajan başına çalışma alanı dosyaları).
- **Ayrı kimlik doğrulama + oturumlar** (açıkça etkinleştirilmedikçe çapraz konuşma yok).

Bu, **birden çok kişinin** tek bir Gateway sunucusunu paylaşmasına, AI "beyinlerini" ve verilerini yalıtılmış tutmasına olanak tanır.

## Ajanlar arası QMD bellek araması

Bir ajanın başka bir ajanın QMD oturum dökümlerini araması gerekiyorsa `agents.list[].memorySearch.qmd.extraCollections` altına ek koleksiyonlar ekleyin. `agents.defaults.memorySearch.qmd.extraCollections` değerini yalnızca her ajanın aynı paylaşılan döküm koleksiyonlarını devralması gerektiğinde kullanın.

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
            extraCollections: [{ path: "notes" }], // resolves inside workspace -> collection named "notes-main"
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

Ek koleksiyon yolu ajanlar arasında paylaşılabilir, ancak yol ajan çalışma alanının dışındaysa koleksiyon adı açık kalır. Çalışma alanının içindeki yollar ajan kapsamlı kalır, böylece her ajan kendi döküm arama kümesini korur.

## Tek WhatsApp numarası, birden çok kişi (DM bölme)

**Tek bir WhatsApp hesabında** kalırken **farklı WhatsApp DM'lerini** farklı ajanlara yönlendirebilirsiniz. Gönderen E.164 (ör. `+15551234567`) üzerinde `peer.kind: "direct"` ile eşleştirin. Yanıtlar yine aynı WhatsApp numarasından gelir (ajan başına gönderen kimliği yoktur).

<Note>
Doğrudan sohbetler ajanın **ana oturum anahtarına** daraltılır, bu nedenle gerçek yalıtım **kişi başına bir ajan** gerektirir.
</Note>

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

- DM erişim denetimi, ajan başına değil **WhatsApp hesabı başına geneldir** (eşleştirme/izin listesi).
- Paylaşılan gruplar için grubu bir ajana bağlayın veya [Yayın grupları](/tr/channels/broadcast-groups) kullanın.

## Yönlendirme kuralları (iletiler ajanı nasıl seçer)

Bağlamalar **deterministiktir** ve **en özgül olan kazanır**:

<Steps>
  <Step title="peer eşleşmesi">
    Tam DM/grup/kanal kimliği.
  </Step>
  <Step title="parentPeer eşleşmesi">
    Thread devralma.
  </Step>
  <Step title="guildId + roller">
    Discord rol yönlendirmesi.
  </Step>
  <Step title="guildId">
    Discord.
  </Step>
  <Step title="teamId">
    Slack.
  </Step>
  <Step title="Bir kanal için accountId eşleşmesi">
    Hesap başına geri dönüş.
  </Step>
  <Step title="Kanal düzeyi eşleşme">
    `accountId: "*"`.
  </Step>
  <Step title="Varsayılan ajan">
    `agents.list[].default` değerine, yoksa ilk liste girdisine geri dönüş; varsayılan: `main`.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Eşitlik bozma ve AND semantiği">
    - Aynı katmanda birden çok bağlama eşleşirse yapılandırma sırasındaki ilk bağlama kazanır.
    - Bir bağlama birden çok eşleşme alanı ayarlarsa (örneğin `peer` + `guildId`), belirtilen tüm alanlar zorunludur (`AND` semantiği).

  </Accordion>
  <Accordion title="Hesap kapsamı ayrıntısı">
    - `accountId` atlayan bir bağlama yalnızca varsayılan hesapla eşleşir.
    - Tüm hesaplar genelinde kanal çapında geri dönüş için `accountId: "*"` kullanın.
    - Daha sonra aynı ajan için aynı bağlamayı açık bir hesap kimliğiyle eklerseniz OpenClaw mevcut yalnızca kanal bağlamasını çoğaltmak yerine hesap kapsamlı hale yükseltir.

  </Accordion>
</AccordionGroup>

## Birden çok hesap / telefon numarası

**Birden çok hesabı** destekleyen kanallar (ör. WhatsApp), her oturumu tanımlamak için `accountId` kullanır. Her `accountId` farklı bir ajana yönlendirilebilir, böylece tek bir sunucu oturumları karıştırmadan birden çok telefon numarasını barındırabilir.

`accountId` atlandığında kanal çapında varsayılan bir hesap istiyorsanız `channels.<channel>.defaultAccount` ayarlayın (isteğe bağlı). Ayarlanmadığında OpenClaw varsa `default` değerine, yoksa ilk yapılandırılmış hesap kimliğine (sıralanmış) geri döner.

Bu deseni destekleyen yaygın kanallar şunları içerir:

- `whatsapp`, `telegram`, `discord`, `slack`, `signal`, `imessage`
- `irc`, `line`, `googlechat`, `mattermost`, `matrix`, `nextcloud-talk`
- `zalo`, `zalouser`, `nostr`, `feishu`

## Kavramlar

- `agentId`: tek bir "beyin" (çalışma alanı, ajan başına kimlik doğrulama, ajan başına oturum deposu).
- `accountId`: tek bir kanal hesabı örneği (ör. WhatsApp hesabı `"personal"` ile `"biz"`).
- `binding`: gelen iletileri `(channel, accountId, peer)` ve isteğe bağlı guild/takım kimlikleriyle bir `agentId` değerine yönlendirir.
- Doğrudan sohbetler `agent:<agentId>:<mainKey>` değerine daraltılır (ajan başına "main"; `session.mainKey`).

## Platform örnekleri

<AccordionGroup>
  <Accordion title="Ajan başına Discord botları">
    Her Discord bot hesabı benzersiz bir `accountId` değerine eşlenir. Her hesabı bir ajana bağlayın ve izin listelerini bot başına tutun.

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

    - Her botu guild'e davet edin ve Message Content Intent'i etkinleştirin.
    - Token'lar `channels.discord.accounts.<id>.token` içinde bulunur (varsayılan hesap `DISCORD_BOT_TOKEN` kullanabilir).

  </Accordion>
  <Accordion title="Ajan başına Telegram botları">
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

    - BotFather ile ajan başına bir bot oluşturun ve her token'ı kopyalayın.
    - Token'lar `channels.telegram.accounts.<id>.botToken` içinde bulunur (varsayılan hesap `TELEGRAM_BOT_TOKEN` kullanabilir).

  </Accordion>
  <Accordion title="Ajan başına WhatsApp numaraları">
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

      // Deterministic routing: first match wins (most-specific first).
      bindings: [
        { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
        { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },

        // Optional per-peer override (example: send a specific group to work agent).
        {
          agentId: "work",
          match: {
            channel: "whatsapp",
            accountId: "personal",
            peer: { kind: "group", id: "1203630...@g.us" },
          },
        },
      ],

      // Off by default: agent-to-agent messaging must be explicitly enabled + allowlisted.
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
              // Optional override. Default: ~/.openclaw/credentials/whatsapp/personal
              // authDir: "~/.openclaw/credentials/whatsapp/personal",
            },
            biz: {
              // Optional override. Default: ~/.openclaw/credentials/whatsapp/biz
              // authDir: "~/.openclaw/credentials/whatsapp/biz",
            },
          },
        },
      },
    }
    ```

  </Accordion>
</AccordionGroup>

## Yaygın desenler

<Tabs>
  <Tab title="WhatsApp günlük + Telegram derin çalışma">
    Kanala göre ayırın: WhatsApp'ı hızlı bir gündelik ajana, Telegram'ı ise bir Opus ajanına yönlendirin.

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

    - Bir kanal için birden fazla hesabınız varsa binding'e `accountId` ekleyin (örneğin `{ channel: "whatsapp", accountId: "personal" }`).
    - Geri kalanını chat üzerinde tutarken tek bir DM/grubu Opus'a yönlendirmek için o peer için bir `match.peer` binding'i ekleyin; peer eşleşmeleri her zaman kanal geneli kurallara göre önceliklidir.

  </Tab>
  <Tab title="Aynı kanal, bir peer Opus'a">
    WhatsApp'ı hızlı ajanda tutun, ancak bir DM'yi Opus'a yönlendirin:

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

    Peer binding'leri her zaman önceliklidir, bu yüzden bunları kanal geneli kuralın üzerinde tutun.

  </Tab>
  <Tab title="Bir WhatsApp grubuna bağlı aile ajanı">
    Özel bir aile ajanını tek bir WhatsApp grubuna bağlayın; mention gating ve daha sıkı bir araç ilkesiyle:

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

    - Araç allow/deny listeleri **araçlardır**, skills değildir. Bir skill'in ikili dosya çalıştırması gerekiyorsa `exec`'in izinli olduğundan ve ikili dosyanın sandbox içinde mevcut olduğundan emin olun.
    - Daha sıkı gating için `agents.list[].groupChat.mentionPatterns` ayarlayın ve kanal için grup allowlist'lerini etkin tutun.

  </Tab>
</Tabs>

## Ajan başına sandbox ve araç yapılandırması

Her ajanın kendi sandbox'ı ve araç kısıtlamaları olabilir:

```js
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: {
          mode: "off",  // No sandbox for personal agent
        },
        // No tool restrictions - all tools available
      },
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: {
          mode: "all",     // Always sandboxed
          scope: "agent",  // One container per agent
          docker: {
            // Optional one-time setup after container creation
            setupCommand: "apt-get update && apt-get install -y git curl",
          },
        },
        tools: {
          allow: ["read"],                    // Only read tool
          deny: ["exec", "write", "edit", "apply_patch"],    // Deny others
        },
      },
    ],
  },
}
```

<Note>
`setupCommand`, `sandbox.docker` altında bulunur ve konteyner oluşturulduğunda bir kez çalışır. Çözümlenen scope `"shared"` olduğunda ajan başına `sandbox.docker.*` geçersiz kılmaları yok sayılır.
</Note>

**Avantajlar:**

- **Güvenlik izolasyonu**: güvenilmeyen ajanlar için araçları kısıtlayın.
- **Kaynak denetimi**: belirli ajanları sandbox'a alırken diğerlerini host üzerinde tutun.
- **Esnek ilkeler**: ajan başına farklı izinler.

<Note>
`tools.elevated` **globaldir** ve gönderen tabanlıdır; ajan başına yapılandırılamaz. Ajan başına sınırlar gerekiyorsa `exec`'i reddetmek için `agents.list[].tools` kullanın. Grup hedefleme için @mention'ların amaçlanan ajana temiz şekilde eşlenmesi amacıyla `agents.list[].groupChat.mentionPatterns` kullanın.
</Note>

Ayrıntılı örnekler için [Çok ajanlı sandbox ve araçlar](/tr/tools/multi-agent-sandbox-tools) bölümüne bakın.

## İlgili

- [ACP ajanları](/tr/tools/acp-agents) — harici kodlama harness'larını çalıştırma
- [Kanal yönlendirme](/tr/channels/channel-routing) — mesajların ajanlara nasıl yönlendirildiği
- [Presence](/tr/concepts/presence) — ajan presence'ı ve kullanılabilirliği
- [Session](/tr/concepts/session) — session izolasyonu ve yönlendirme
- [Alt ajanlar](/tr/tools/subagents) — arka plan ajan çalıştırmaları başlatma
