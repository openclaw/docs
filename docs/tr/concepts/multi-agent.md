---
read_when: You want multiple isolated agents (workspaces + auth) in one gateway process.
sidebarTitle: Multi-agent routing
status: active
summary: 'Çoklu ajan yönlendirmesi: yalıtılmış ajanlar, kanal hesapları ve bağlamalar'
title: Çok ajanlı yönlendirme
x-i18n:
    generated_at: "2026-04-30T09:17:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 67adea74d5f97feff3f816cc4c34c9429e7659289013e5a7c7623bd185a50a31
    source_path: concepts/multi-agent.md
    workflow: 16
---

Bir çalışan Gateway içinde, her biri kendi çalışma alanına, durum dizinine (`agentDir`) ve oturum geçmişine sahip birden çok _yalıtılmış_ ajanı ve ayrıca birden çok kanal hesabını (örn. iki WhatsApp) çalıştırın. Gelen iletiler, bağlamalar aracılığıyla doğru ajana yönlendirilir.

Buradaki **ajan**, kişi başına tam kapsamdır: çalışma alanı dosyaları, kimlik doğrulama profilleri, model kayıt defteri ve oturum deposu. `agentDir`, bu ajan başına yapılandırmayı `~/.openclaw/agents/<agentId>/` konumunda tutan diskteki durum dizinidir. Bir **bağlama**, bir kanal hesabını (örn. bir Slack çalışma alanı veya WhatsApp numarası) bu ajanlardan biriyle eşler.

## "Tek ajan" nedir?

Bir **ajan**, kendi kapsamı tamamen ayrılmış bir beyindir ve şunlara sahiptir:

- **Çalışma alanı** (dosyalar, AGENTS.md/SOUL.md/USER.md, yerel notlar, persona kuralları).
- Kimlik doğrulama profilleri, model kayıt defteri ve ajan başına yapılandırma için **durum dizini** (`agentDir`).
- `~/.openclaw/agents/<agentId>/sessions` altında **oturum deposu** (sohbet geçmişi + yönlendirme durumu).

Kimlik doğrulama profilleri **ajan başınadır**. Her ajan kendi şuradan okur:

```text
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

<Note>
`sessions_history` burada da daha güvenli oturumlar arası hatırlama yoludur: ham döküm dökümü değil, sınırlandırılmış ve temizlenmiş bir görünüm döndürür. Asistan hatırlaması; düşünme etiketlerini, `<relevant-memories>` iskeletini, düz metin araç çağrısı XML yüklerini (`<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` ve kırpılmış araç çağrısı blokları dahil), düşürülmüş araç çağrısı iskeletini, sızmış ASCII/tam genişlikli model kontrol belirteçlerini ve hatalı biçimlendirilmiş MiniMax araç çağrısı XML'ini redaksiyon/kırpma öncesinde çıkarır.
</Note>

<Warning>
`agentDir` değerini ajanlar arasında asla yeniden kullanmayın (kimlik doğrulama/oturum çakışmalarına neden olur). Ajanların yerel profili olmadığında varsayılan/ana ajanın kimlik doğrulama profillerini okuyabilirler, ancak OpenClaw OAuth yenileme belirteçlerini ikincil ajan deposuna klonlamaz. Bağımsız bir OAuth hesabı istiyorsanız, o ajandan oturum açın; kimlik bilgilerini elle kopyalıyorsanız yalnızca taşınabilir statik `api_key` veya `token` profillerini kopyalayın.
</Warning>

Skills her ajan çalışma alanından ve `~/.openclaw/skills` gibi paylaşılan köklerden yüklenir, ardından yapılandırıldığında etkili ajan Skills izin listesine göre filtrelenir. Paylaşılan temel için `agents.defaults.skills`, ajan başına değiştirme için `agents.list[].skills` kullanın. Bkz. [Skills: ajan başına ve paylaşılan](/tr/tools/skills#per-agent-vs-shared-skills) ve [Skills: ajan Skills izin listeleri](/tr/tools/skills#agent-skill-allowlists).

Gateway, yan yana **tek ajan** (varsayılan) veya **çok sayıda ajan** barındırabilir.

<Note>
**Çalışma alanı notu:** her ajanın çalışma alanı, sert bir sandbox değil, **varsayılan cwd** değeridir. Göreli yollar çalışma alanı içinde çözümlenir, ancak sandboxing etkinleştirilmedikçe mutlak yollar ana makinedeki diğer konumlara erişebilir. Bkz. [Sandboxing](/tr/gateway/sandboxing).
</Note>

## Yollar (hızlı harita)

- Yapılandırma: `~/.openclaw/openclaw.json` (veya `OPENCLAW_CONFIG_PATH`)
- Durum dizini: `~/.openclaw` (veya `OPENCLAW_STATE_DIR`)
- Çalışma alanı: `~/.openclaw/workspace` (veya `~/.openclaw/workspace-<agentId>`)
- Ajan dizini: `~/.openclaw/agents/<agentId>/agent` (veya `agents.list[].agentDir`)
- Oturumlar: `~/.openclaw/agents/<agentId>/sessions`

### Tek ajan modu (varsayılan)

Hiçbir şey yapmazsanız OpenClaw tek ajan çalıştırır:

- `agentId` varsayılan olarak **`main`** olur.
- Oturumlar `agent:main:<mainKey>` olarak anahtarlanır.
- Çalışma alanı varsayılan olarak `~/.openclaw/workspace` olur (veya `OPENCLAW_PROFILE` ayarlandığında `~/.openclaw/workspace-<profile>`).
- Durum varsayılan olarak `~/.openclaw/agents/main/agent` olur.

## Ajan yardımcısı

Yeni bir yalıtılmış ajan eklemek için ajan sihirbazını kullanın:

```bash
openclaw agents add work
```

Ardından gelen iletileri yönlendirmek için `bindings` ekleyin (veya bunu sihirbazın yapmasına izin verin).

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

    Her ajan, `SOUL.md`, `AGENTS.md` ve isteğe bağlı `USER.md` içeren kendi çalışma alanını, ayrıca özel bir `agentDir` değerini ve `~/.openclaw/agents/<agentId>` altında oturum deposunu alır.

  </Step>
  <Step title="Kanal hesapları oluşturun">
    Tercih ettiğiniz kanallarda ajan başına bir hesap oluşturun:

    - Discord: ajan başına bir bot, Message Content Intent'i etkinleştirin, her belirteci kopyalayın.
    - Telegram: BotFather üzerinden ajan başına bir bot, her belirteci kopyalayın.
    - WhatsApp: hesap başına her telefon numarasını bağlayın.

    ```bash
    openclaw channels login --channel whatsapp --account work
    ```

    Kanal kılavuzlarına bakın: [Discord](/tr/channels/discord), [Telegram](/tr/channels/telegram), [WhatsApp](/tr/channels/whatsapp).

  </Step>
  <Step title="Ajanları, hesapları ve bağlamaları ekleyin">
    Ajanları `agents.list` altına, kanal hesaplarını `channels.<channel>.accounts` altına ekleyin ve bunları `bindings` ile bağlayın (aşağıdaki örnekler).
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

**Birden çok ajan** ile her `agentId`, **tamamen yalıtılmış bir persona** haline gelir:

- **Farklı telefon numaraları/hesaplar** (kanal başına `accountId`).
- **Farklı kişilikler** (`AGENTS.md` ve `SOUL.md` gibi ajan başına çalışma alanı dosyaları).
- **Ayrı kimlik doğrulama + oturumlar** (açıkça etkinleştirilmedikçe çapraz konuşma yok).

Bu, **birden çok kişinin** tek bir Gateway sunucusunu paylaşırken AI "beyinlerini" ve verilerini yalıtılmış tutmasını sağlar.

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

Ek koleksiyon yolu ajanlar arasında paylaşılabilir, ancak yol ajan çalışma alanının dışındaysa koleksiyon adı açık kalır. Çalışma alanı içindeki yollar ajan kapsamlı kalır, böylece her ajan kendi döküm arama kümesini korur.

## Tek WhatsApp numarası, birden çok kişi (DM ayrımı)

**Tek WhatsApp hesabında** kalırken **farklı WhatsApp DM'lerini** farklı ajanlara yönlendirebilirsiniz. `peer.kind: "direct"` ile gönderen E.164 üzerinde (ör. `+15551234567`) eşleştirin. Yanıtlar yine aynı WhatsApp numarasından gelir (ajan başına gönderen kimliği yoktur).

<Note>
Doğrudan sohbetler ajanın **ana oturum anahtarına** daralır, bu yüzden gerçek yalıtım için **kişi başına bir ajan** gerekir.
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

- DM erişim denetimi ajan başına değil, **WhatsApp hesabı başına geneldir** (eşleştirme/izin listesi).
- Paylaşılan gruplar için grubu bir ajana bağlayın veya [Yayın grupları](/tr/channels/broadcast-groups) kullanın.

## Yönlendirme kuralları (iletiler ajanı nasıl seçer)

Bağlamalar **deterministiktir** ve **en özel olan kazanır**:

<Steps>
  <Step title="peer eşleşmesi">
    Tam DM/grup/kanal kimliği.
  </Step>
  <Step title="parentPeer eşleşmesi">
    Konu devralımı.
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
    Hesap başına yedek.
  </Step>
  <Step title="Kanal düzeyi eşleşme">
    `accountId: "*"`.
  </Step>
  <Step title="Varsayılan ajan">
    `agents.list[].default` değerine, yoksa ilk liste girdisine geri düşer; varsayılan: `main`.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Beraberlik bozma ve AND semantiği">
    - Aynı kademede birden çok bağlama eşleşirse yapılandırma sırasındaki ilk bağlama kazanır.
    - Bir bağlama birden çok eşleşme alanı ayarlarsa (örneğin `peer` + `guildId`), belirtilen tüm alanlar zorunludur (`AND` semantiği).

  </Accordion>
  <Accordion title="Hesap kapsamı ayrıntısı">
    - `accountId` değerini atlayan bir bağlama yalnızca varsayılan hesapla eşleşir.
    - Tüm hesaplar genelinde kanal çapında yedek için `accountId: "*"` kullanın.
    - Daha sonra aynı ajan için açık bir hesap kimliğiyle aynı bağlamayı eklerseniz OpenClaw mevcut yalnızca kanal bağlamasını çoğaltmak yerine hesap kapsamlı hale yükseltir.

  </Accordion>
</AccordionGroup>

## Birden çok hesap / telefon numarası

**Birden çok hesabı** destekleyen kanallar (örn. WhatsApp), her oturum açmayı tanımlamak için `accountId` kullanır. Her `accountId` farklı bir ajana yönlendirilebilir; böylece tek sunucu, oturumları karıştırmadan birden çok telefon numarası barındırabilir.

`accountId` atlandığında kanal çapında varsayılan hesap istiyorsanız `channels.<channel>.defaultAccount` değerini ayarlayın (isteğe bağlı). Ayarlanmadığında OpenClaw varsa `default` değerine, yoksa ilk yapılandırılmış hesap kimliğine (sıralı) geri düşer.

Bu deseni destekleyen yaygın kanallar şunları içerir:

- `whatsapp`, `telegram`, `discord`, `slack`, `signal`, `imessage`
- `irc`, `line`, `googlechat`, `mattermost`, `matrix`, `nextcloud-talk`
- `bluebubbles`, `zalo`, `zalouser`, `nostr`, `feishu`

## Kavramlar

- `agentId`: tek "beyin" (çalışma alanı, ajan başına kimlik doğrulama, ajan başına oturum deposu).
- `accountId`: tek kanal hesabı örneği (örn. WhatsApp hesabı `"personal"` ile `"biz"`).
- `binding`: gelen iletileri `(channel, accountId, peer)` ve isteğe bağlı guild/team kimlikleriyle bir `agentId` değerine yönlendirir.
- Doğrudan sohbetler `agent:<agentId>:<mainKey>` değerine daralır (ajan başına "ana"; `session.mainKey`).

## Platform örnekleri

<AccordionGroup>
  <Accordion title="Ajan başına Discord botları">
    Her Discord bot hesabı benzersiz bir `accountId` ile eşlenir. Her hesabı bir ajana bağlayın ve izin listelerini bot başına tutun.

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

    - Her botu guild'e davet edin ve Message Content Intent'i etkinlestirin.
    - Token'lar `channels.discord.accounts.<id>.token` icinde bulunur (varsayilan hesap `DISCORD_BOT_TOKEN` kullanabilir).

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

    - BotFather ile ajan basina bir bot olusturun ve her token'i kopyalayin.
    - Token'lar `channels.telegram.accounts.<id>.botToken` icinde bulunur (varsayilan hesap `TELEGRAM_BOT_TOKEN` kullanabilir).

  </Accordion>
  <Accordion title="WhatsApp numbers per agent">
    Gateway'i baslatmadan once her hesabi baglayin:

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

## Yaygin kaliplar

<Tabs>
  <Tab title="WhatsApp daily + Telegram deep work">
    Kanala gore ayirin: WhatsApp'i hizli bir gunluk ajana, Telegram'i ise bir Opus ajanina yonlendirin.

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

    - Bir kanal icin birden fazla hesabiniz varsa, baglamaya `accountId` ekleyin (ornegin `{ channel: "whatsapp", accountId: "personal" }`).
    - Geri kalanini sohbette tutarken tek bir DM/grubu Opus'a yonlendirmek icin, o es icin bir `match.peer` baglamasi ekleyin; es eslesmeleri her zaman kanal geneli kurallara gore onceliklidir.

  </Tab>
  <Tab title="Same channel, one peer to Opus">
    WhatsApp'i hizli ajanda tutun, ancak bir DM'yi Opus'a yonlendirin:

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

    Es baglamalari her zaman kazanir, bu nedenle bunlari kanal geneli kuralin uzerinde tutun.

  </Tab>
  <Tab title="Family agent bound to a WhatsApp group">
    Ozel bir aile ajanini tek bir WhatsApp grubuna, bahsetme kapisi ve daha siki bir arac ilkesiyle baglayin:

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

    - Arac izin/engelleme listeleri **araclardir**, Skills degildir. Bir skill'in bir ikiliyi calistirmasi gerekiyorsa, `exec` icin izin verildiginden ve ikilinin sandbox icinde mevcut oldugundan emin olun.
    - Daha siki gecis kontrolu icin `agents.list[].groupChat.mentionPatterns` ayarini yapin ve kanal icin grup izin listelerini etkin tutun.

  </Tab>
</Tabs>

## Ajan basina sandbox ve arac yapilandirmasi

Her ajanin kendi sandbox'i ve arac kisitlamalari olabilir:

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
`setupCommand`, `sandbox.docker` altinda bulunur ve kapsayici olusturuldugunda bir kez calisir. Cozumlenen kapsam `"shared"` oldugunda ajan basina `sandbox.docker.*` gecersiz kilmalari yok sayilir.
</Note>

**Avantajlar:**

- **Guvenlik yalitimi**: guvenilmeyen ajanlar icin araclari kisitlayin.
- **Kaynak kontrolu**: belirli ajanlari sandbox'a alirken digerlerini host uzerinde tutun.
- **Esnek ilkeler**: ajan basina farkli izinler.

<Note>
`tools.elevated` **globaldir** ve gonderene dayalidir; ajan basina yapilandirilamaz. Ajan basina sinirlara ihtiyaciniz varsa, `exec` aracini reddetmek icin `agents.list[].tools` kullanin. Grup hedefleme icin, @bahsetmelerin amaclanan ajanla temiz sekilde eslesmesi icin `agents.list[].groupChat.mentionPatterns` kullanin.
</Note>

Ayrintili ornekler icin [Cok ajanli sandbox ve araclar](/tr/tools/multi-agent-sandbox-tools) sayfasina bakin.

## Ilgili

- [ACP ajanlari](/tr/tools/acp-agents) — harici kodlama kosum takimlarini calistirma
- [Kanal yonlendirme](/tr/channels/channel-routing) — mesajlarin ajanlara nasil yonlendirildigi
- [Varlik](/tr/concepts/presence) — ajan varligi ve kullanilabilirligi
- [Oturum](/tr/concepts/session) — oturum yalitimi ve yonlendirme
- [Alt ajanlar](/tr/tools/subagents) — arka plan ajan calismalari baslatma
