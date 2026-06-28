---
read_when: You want multiple isolated agents (workspaces + auth) in one gateway process.
sidebarTitle: Multi-agent routing
status: active
summary: 'Çoklu ajan yönlendirmesi: yalıtılmış ajanlar, kanal hesapları ve bağlamalar'
title: Çok aracılı yönlendirme
x-i18n:
    generated_at: "2026-06-28T00:29:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4c1c55188cd27ea786cf65dcabd356a602e1e6da5f842532b189df59195274db
    source_path: concepts/multi-agent.md
    workflow: 16
---

Bir çalışan Gateway içinde, her biri kendi çalışma alanı, durum dizini (`agentDir`) ve oturum geçmişine sahip birden çok _yalıtılmış_ agent çalıştırın; ayrıca birden çok kanal hesabını (ör. iki WhatsApp) kullanın. Gelen mesajlar binding'ler üzerinden doğru agent'a yönlendirilir.

Buradaki **agent**, persona başına tam kapsamdır: çalışma alanı dosyaları, kimlik doğrulama profilleri, model kayıt defteri ve oturum deposu. `agentDir`, agent başına bu yapılandırmayı `~/.openclaw/agents/<agentId>/` konumunda tutan disk üzerindeki durum dizinidir. Bir **binding**, bir kanal hesabını (ör. bir Slack çalışma alanı veya bir WhatsApp numarası) bu agent'lardan biriyle eşler.

## "Tek agent" nedir?

Bir **agent**, kendine ait aşağıdakileri olan tam kapsamlı bir beyindir:

- **Çalışma alanı** (dosyalar, AGENTS.md/SOUL.md/USER.md, yerel notlar, persona kuralları).
- Kimlik doğrulama profilleri, model kayıt defteri ve agent başına yapılandırma için **durum dizini** (`agentDir`).
- `~/.openclaw/agents/<agentId>/sessions` altında **oturum deposu** (sohbet geçmişi + yönlendirme durumu).

Kimlik doğrulama profilleri **agent başınadır**. Her agent kendi şu konumundan okur:

```text
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

<Note>
`sessions_history` burada da daha güvenli oturumlar arası hatırlama yoludur: ham transkript dökümü değil, sınırlı ve arındırılmış bir görünüm döndürür. Asistan hatırlaması; düşünme etiketlerini, `<relevant-memories>` iskeletini, düz metin araç çağrısı XML payload'larını (`<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` ve kesilmiş araç çağrısı blokları dahil), düşürülmüş araç çağrısı iskeletini, sızmış ASCII/tam genişlikli model kontrol token'larını ve hatalı biçimlendirilmiş MiniMax araç çağrısı XML'ini redaksiyon/kesme öncesinde çıkarır.
</Note>

<Warning>
`agentDir` değerini agent'lar arasında asla yeniden kullanmayın (kimlik doğrulama/oturum çakışmalarına neden olur). Agent'lar, yerel bir profilleri olmadığında varsayılan/ana agent'ın kimlik doğrulama profillerine okuyarak erişebilir, ancak OpenClaw OAuth yenileme token'larını ikincil agent deposuna klonlamaz. Bağımsız bir OAuth hesabı istiyorsanız o agent üzerinden oturum açın; kimlik bilgilerini elle kopyalıyorsanız yalnızca taşınabilir statik `api_key` veya `token` profillerini kopyalayın.
</Warning>

Skills, her agent çalışma alanından ve `~/.openclaw/skills` gibi paylaşılan köklerden yüklenir, ardından yapılandırıldığında etkin agent skill izin listesine göre filtrelenir. Paylaşılan bir temel için `agents.defaults.skills`, agent başına değiştirme için `agents.list[].skills` kullanın. Bkz. [Skills: agent başına ve paylaşılan](/tr/tools/skills#per-agent-vs-shared-skills) ve [Skills: agent skill izin listeleri](/tr/tools/skills#agent-allowlists).

Gateway **tek agent** (varsayılan) veya yan yana **birçok agent** barındırabilir.

<Note>
**Çalışma alanı notu:** her agent'ın çalışma alanı, katı bir sandbox değil, **varsayılan cwd**'dir. Göreli yollar çalışma alanı içinde çözümlenir, ancak sandboxing etkin değilse mutlak yollar ana makinedeki diğer konumlara ulaşabilir. Bkz. [Sandboxing](/tr/gateway/sandboxing).
</Note>

## Yollar (hızlı harita)

- Yapılandırma: `~/.openclaw/openclaw.json` (veya `OPENCLAW_CONFIG_PATH`)
- Durum dizini: `~/.openclaw` (veya `OPENCLAW_STATE_DIR`)
- Çalışma alanı: `~/.openclaw/workspace` (veya `~/.openclaw/workspace-<agentId>`)
- Agent dizini: `~/.openclaw/agents/<agentId>/agent` (veya `agents.list[].agentDir`)
- Oturumlar: `~/.openclaw/agents/<agentId>/sessions`

### Tek agent modu (varsayılan)

Hiçbir şey yapmazsanız OpenClaw tek bir agent çalıştırır:

- `agentId` varsayılan olarak **`main`** olur.
- Oturumlar `agent:main:<mainKey>` olarak anahtarlanır.
- Çalışma alanı varsayılan olarak `~/.openclaw/workspace` olur (veya `OPENCLAW_PROFILE` ayarlandığında `~/.openclaw/workspace-<profile>`).
- Durum varsayılan olarak `~/.openclaw/agents/main/agent` olur.

## Agent yardımcısı

Yeni bir yalıtılmış agent eklemek için agent sihirbazını kullanın:

```bash
openclaw agents add work
```

Ardından gelen mesajları yönlendirmek için `bindings` ekleyin (veya bunu sihirbazın yapmasına izin verin).

Şununla doğrulayın:

```bash
openclaw agents list --bindings
```

## Hızlı başlangıç

<Steps>
  <Step title="Her agent çalışma alanını oluşturun">
    Sihirbazı kullanın veya çalışma alanlarını elle oluşturun:

    ```bash
    openclaw agents add coding
    openclaw agents add social
    ```

    Her agent; `SOUL.md`, `AGENTS.md` ve isteğe bağlı `USER.md` içeren kendi çalışma alanını, ayrıca `~/.openclaw/agents/<agentId>` altında ayrılmış bir `agentDir` ve oturum deposunu alır.

  </Step>
  <Step title="Kanal hesapları oluşturun">
    Tercih ettiğiniz kanallarda agent başına bir hesap oluşturun:

    - Discord: agent başına bir bot, Message Content Intent'i etkinleştirin, her token'ı kopyalayın.
    - Telegram: BotFather üzerinden agent başına bir bot, her token'ı kopyalayın.
    - WhatsApp: hesap başına her telefon numarasını bağlayın.

    ```bash
    openclaw channels login --channel whatsapp --account work
    ```

    Kanal kılavuzlarına bakın: [Discord](/tr/channels/discord), [Telegram](/tr/channels/telegram), [WhatsApp](/tr/channels/whatsapp).

  </Step>
  <Step title="Agent'ları, hesapları ve binding'leri ekleyin">
    Agent'ları `agents.list` altına, kanal hesaplarını `channels.<channel>.accounts` altına ekleyin ve bunları `bindings` ile bağlayın (aşağıdaki örnekler).
  </Step>
  <Step title="Yeniden başlatın ve doğrulayın">
    ```bash
    openclaw gateway restart
    openclaw agents list --bindings
    openclaw channels status --probe
    ```
  </Step>
</Steps>

## Birden çok agent = birden çok kişi, birden çok kişilik

**Birden çok agent** ile her `agentId`, **tamamen yalıtılmış bir persona** haline gelir:

- **Farklı telefon numaraları/hesaplar** (kanal başına `accountId`).
- **Farklı kişilikler** (`AGENTS.md` ve `SOUL.md` gibi agent başına çalışma alanı dosyaları).
- **Ayrı kimlik doğrulama + oturumlar** (açıkça etkinleştirilmedikçe çapraz konuşma yok).

Bu, **birden çok kişinin** AI "beyinlerini" ve verilerini yalıtılmış tutarken tek bir Gateway sunucusunu paylaşmasını sağlar.

## Agent'lar arası QMD bellek araması

Bir agent'ın başka bir agent'ın QMD oturum transkriptlerinde arama yapması gerekiyorsa `agents.list[].memorySearch.qmd.extraCollections` altına ek koleksiyonlar ekleyin. `agents.defaults.memorySearch.qmd.extraCollections` değerini yalnızca her agent aynı paylaşılan transkript koleksiyonlarını devralmalıysa kullanın.

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

Ek koleksiyon yolu agent'lar arasında paylaşılabilir, ancak yol agent çalışma alanının dışındaysa koleksiyon adı açık kalır. Çalışma alanı içindeki yollar agent kapsamlı kalır, böylece her agent kendi transkript arama kümesini korur.

## Tek WhatsApp numarası, birden çok kişi (DM ayrımı)

**Tek WhatsApp hesabında** kalırken **farklı WhatsApp DM'lerini** farklı agent'lara yönlendirebilirsiniz. `peer.kind: "direct"` ile gönderen E.164 üzerinde (`+15551234567` gibi) eşleştirin. Yanıtlar yine aynı WhatsApp numarasından gelir (agent başına gönderen kimliği yoktur).

<Note>
Doğrudan sohbetler agent'ın **ana oturum anahtarına** indirgenir, bu yüzden gerçek yalıtım **kişi başına bir agent** gerektirir.
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

- DM erişim denetimi agent başına değil, **WhatsApp hesabı başına geneldir** (eşleme/izin listesi).
- Paylaşılan gruplar için grubu bir agent'a bağlayın veya [Yayın grupları](/tr/channels/broadcast-groups) kullanın.

## Yönlendirme kuralları (mesajlar bir agent'ı nasıl seçer)

Binding'ler **deterministiktir** ve **en spesifik olan kazanır**:

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
    Hesap başına fallback.
  </Step>
  <Step title="Kanal düzeyi eşleşme">
    `accountId: "*"`.
  </Step>
  <Step title="Varsayılan agent">
    `agents.list[].default` değerine, yoksa ilk liste girdisine fallback, varsayılan: `main`.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Eşitlik bozma ve AND semantiği">
    - Aynı kademede birden çok binding eşleşirse yapılandırma sırasındaki ilk binding kazanır.
    - Bir binding birden çok match alanı ayarlarsa (örneğin `peer` + `guildId`), belirtilen tüm alanlar zorunludur (`AND` semantiği).

  </Accordion>
  <Accordion title="Hesap kapsamı ayrıntısı">
    - `accountId` atlayan bir binding yalnızca varsayılan hesapla eşleşir. Tüm hesaplarla eşleşmez.
    - Tüm hesaplar genelinde kanal çapında fallback için `accountId: "*"` kullanın.
    - Tek bir hesabı eşleştirmek için `accountId: "<name>"` kullanın.
    - Daha sonra aynı agent için aynı binding'i açık bir hesap kimliğiyle eklerseniz OpenClaw mevcut yalnızca kanal binding'ini çoğaltmak yerine hesap kapsamlı olacak şekilde yükseltir.

  </Accordion>
</AccordionGroup>

## Birden çok hesap / telefon numarası

**Birden çok hesabı** destekleyen kanallar (ör. WhatsApp), her oturum açmayı tanımlamak için `accountId` kullanır. Her `accountId` farklı bir agent'a yönlendirilebilir, böylece tek bir sunucu oturumları karıştırmadan birden çok telefon numarası barındırabilir.

`accountId` atlandığında kanal çapında varsayılan bir hesap istiyorsanız `channels.<channel>.defaultAccount` değerini ayarlayın (isteğe bağlı). Ayarlanmadığında OpenClaw, varsa `default` değerine, aksi halde ilk yapılandırılmış hesap kimliğine (sıralı) fallback yapar.

Bu deseni destekleyen yaygın kanallar şunlardır:

- `whatsapp`, `telegram`, `discord`, `slack`, `signal`, `imessage`
- `irc`, `line`, `googlechat`, `mattermost`, `matrix`, `nextcloud-talk`
- `zalo`, `zalouser`, `nostr`, `feishu`

## Kavramlar

- `agentId`: tek bir "beyin" (çalışma alanı, agent başına kimlik doğrulama, agent başına oturum deposu).
- `accountId`: tek bir kanal hesabı örneği (ör. WhatsApp hesabı `"personal"` ve `"biz"`).
- `binding`: gelen mesajları `(channel, accountId, peer)` ve isteğe bağlı olarak guild/team kimlikleriyle bir `agentId` değerine yönlendirir.
- Doğrudan sohbetler `agent:<agentId>:<mainKey>` değerine indirgenir (agent başına "main"; `session.mainKey`).

## Platform örnekleri

<AccordionGroup>
  <Accordion title="Agent başına Discord botları">
    Her Discord bot hesabı benzersiz bir `accountId` ile eşleşir. Her hesabı bir agent'a bağlayın ve izin listelerini bot başına tutun.

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

    - Her botu sunucuya davet edin ve Message Content Intent ayarını etkinleştirin.
    - Tokenlar `channels.discord.accounts.<id>.token` içinde bulunur (varsayılan hesap `DISCORD_BOT_TOKEN` kullanabilir).

  </Accordion>
  <Accordion title="Telegram bots per agent">
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

    - BotFather ile her ajan için bir bot oluşturun ve her tokenı kopyalayın.
    - Tokenlar `channels.telegram.accounts.<id>.botToken` içinde bulunur (varsayılan hesap `TELEGRAM_BOT_TOKEN` kullanabilir).
    - Aynı Telegram grubunda birden fazla bot için her botu davet edin ve yanıtlaması gereken bottan bahsedin.
    - Her grup botu için BotFather Privacy Mode ayarını devre dışı bırakın, ardından Telegram ayarı uygulayabilsin diye botu yeniden ekleyin.
    - Gruplara `channels.telegram.groups` ile izin verin veya `groupPolicy: "open"` değerini yalnızca güvenilir grup dağıtımları için kullanın.
    - Gönderen kullanıcı kimliklerini `groupAllowFrom` içine koyun. Grup ve süper grup kimlikleri `groupAllowFrom` içinde değil, `channels.telegram.groups` içinde yer alır.
    - Her botun kendi ajanına yönlenmesi için `accountId` ile bağlayın.

  </Accordion>
  <Accordion title="WhatsApp numbers per agent">
    Gateway başlatmadan önce her hesabı bağlayın:

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

## Yaygın kalıplar

<Tabs>
  <Tab title="WhatsApp daily + Telegram deep work">
    Kanala göre ayırın: WhatsApp'ı hızlı bir günlük ajana, Telegram'ı ise bir Opus ajanına yönlendirin.

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
        { agentId: "chat", match: { channel: "whatsapp", accountId: "*" } },
        { agentId: "opus", match: { channel: "telegram", accountId: "*" } },
      ],
    }
    ```

    Notlar:

    - Bu örnekler `accountId: "*"` kullanır; böylece daha sonra hesap ekleseniz bile bağlamalar çalışmaya devam eder.
    - Geri kalanını sohbet ajanında tutarken tek bir DM/grubu Opus'a yönlendirmek için o eş için bir `match.peer` bağlaması ekleyin; eş eşleşmeleri her zaman kanal geneli kurallara üstün gelir.

  </Tab>
  <Tab title="Same channel, one peer to Opus">
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
          match: { channel: "whatsapp", accountId: "*", peer: { kind: "direct", id: "+15551234567" } },
        },
        { agentId: "chat", match: { channel: "whatsapp", accountId: "*" } },
      ],
    }
    ```

    Eş bağlamaları her zaman üstün gelir; bu yüzden onları kanal geneli kuralın üstünde tutun.

  </Tab>
  <Tab title="Family agent bound to a WhatsApp group">
    Özel bir aile ajanını tek bir WhatsApp grubuna, bahsetme kapısı ve daha sıkı bir araç ilkesiyle bağlayın:

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

    - Araç izin/ret listeleri **araçlardır**, Skills değildir. Bir Skills ikili dosya çalıştırmak zorundaysa `exec` izni olduğundan ve ikili dosyanın sandbox içinde bulunduğundan emin olun.
    - Daha sıkı kapılama için `agents.list[].groupChat.mentionPatterns` değerini ayarlayın ve kanal için grup izin listelerini etkin tutun.

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
`setupCommand`, `sandbox.docker` altında bulunur ve konteyner oluşturulduğunda bir kez çalışır. Çözümlenen kapsam `"shared"` olduğunda ajan başına `sandbox.docker.*` geçersiz kılmaları yok sayılır.
</Note>

**Faydalar:**

- **Güvenlik yalıtımı**: güvenilmeyen ajanlar için araçları kısıtlayın.
- **Kaynak denetimi**: belirli ajanları sandbox'a alırken diğerlerini ana makinede tutun.
- **Esnek ilkeler**: ajan başına farklı izinler.

<Note>
`tools.elevated` **geneldir** ve gönderene dayalıdır; ajan başına yapılandırılamaz. Ajan başına sınırlar gerekiyorsa `exec` kullanımını reddetmek için `agents.list[].tools` kullanın. Grup hedefleme için `agents.list[].groupChat.mentionPatterns` kullanın; böylece @bahsetmeler amaçlanan ajanla düzgün eşleşir.
</Note>

Ayrıntılı örnekler için [Çok ajanlı sandbox ve araçlar](/tr/tools/multi-agent-sandbox-tools) bölümüne bakın.

## İlgili

- [ACP ajanları](/tr/tools/acp-agents) — harici kodlama harness'ları çalıştırma
- [Kanal yönlendirme](/tr/channels/channel-routing) — iletilerin ajanlara nasıl yönlendirildiği
- [Presence](/tr/concepts/presence) — ajan varlığı ve kullanılabilirliği
- [Oturum](/tr/concepts/session) — oturum yalıtımı ve yönlendirme
- [Alt ajanlar](/tr/tools/subagents) — arka plan ajan çalıştırmaları başlatma
