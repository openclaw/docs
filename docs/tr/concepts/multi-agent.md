---
read_when: You want multiple isolated agents (workspaces + auth) in one gateway process.
sidebarTitle: Multi-agent routing
status: active
summary: 'Çok ajanlı yönlendirme: yalıtılmış ajanlar, kanal hesapları ve bağlamalar'
title: Çok ajanlı yönlendirme
x-i18n:
    generated_at: "2026-04-26T11:27:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 845149ac1076d4746cc5038bd4444c2fc6117710f724b8cabdc31dc9ef6abbe8
    source_path: concepts/multi-agent.md
    workflow: 15
---

Bir çalışan Gateway içinde, her biri kendi çalışma alanına, durum dizinine (`agentDir`) ve oturum geçmişine sahip birden fazla _yalıtılmış_ ajanı; ayrıca birden fazla kanal hesabını (ör. iki WhatsApp) çalıştırın. Gelen mesajlar bağlamalar aracılığıyla doğru ajana yönlendirilir.

Buradaki bir **ajan**, kişi başına/persona başına tam kapsamdır: çalışma alanı dosyaları, auth profilleri, model kayıt defteri ve oturum deposu. `agentDir`, bu ajan başına yapılandırmayı `~/.openclaw/agents/<agentId>/` altında tutan disk üzerindeki durum dizinidir. Bir **bağlama**, bir kanal hesabını (ör. bir Slack çalışma alanı veya bir WhatsApp numarası) bu ajanlardan birine eşler.

## "Tek ajan" nedir?

Bir **ajan**, kendine ait şu bileşenlere sahip tam kapsamlı bir beyindir:

- **Çalışma alanı** (dosyalar, AGENTS.md/SOUL.md/USER.md, yerel notlar, persona kuralları).
- Auth profilleri, model kayıt defteri ve ajan başına yapılandırma için **durum dizini** (`agentDir`).
- `~/.openclaw/agents/<agentId>/sessions` altındaki **oturum deposu** (sohbet geçmişi + yönlendirme durumu).

Auth profilleri **ajan başınadır**. Her ajan kendi şu dosyasından okur:

```text
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

<Note>
Burada da `sessions_history`, oturumlar arası geri çağırma için daha güvenli yoldur: ham transkript dökümü değil, sınırlı ve arındırılmış bir görünüm döndürür. Asistan geri çağırması; düşünme etiketlerini, `<relevant-memories>` iskeletini, düz metin araç çağrısı XML payload'larını (`<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` ve kırpılmış araç çağrısı blokları dâhil), düşürülmüş araç çağrısı iskeletini, sızmış ASCII/tam genişlikli model kontrol token'larını ve hatalı MiniMax araç çağrısı XML'ini redaksiyon/kırpmadan önce temizler.
</Note>

<Warning>
Ana ajan kimlik bilgileri otomatik olarak **paylaşılmaz**. `agentDir` değerini ajanlar arasında asla yeniden kullanmayın (auth/oturum çakışmalarına neden olur). Kimlik bilgilerini paylaşmak istiyorsanız `auth-profiles.json` dosyasını diğer ajanın `agentDir` dizinine kopyalayın.
</Warning>

Skills, her ajanın çalışma alanından ve `~/.openclaw/skills` gibi paylaşılan köklerden yüklenir, ardından yapılandırılmışsa etkin ajan Skill allowlist'i ile filtrelenir. Paylaşılan bir temel için `agents.defaults.skills`, ajan başına değiştirme için `agents.list[].skills` kullanın. Bkz. [Skills: per-agent vs shared](/tr/tools/skills#per-agent-vs-shared-skills) ve [Skills: agent skill allowlists](/tr/tools/skills#agent-skill-allowlists).

Gateway, yan yana **tek ajan** (varsayılan) veya **çok sayıda ajan** barındırabilir.

<Note>
**Çalışma alanı notu:** her ajanın çalışma alanı, katı bir sandbox değil, **varsayılan cwd**'dir. Göreli yollar çalışma alanı içinde çözülür, ancak sandbox etkin değilse mutlak yollar diğer ana makine konumlarına erişebilir. Bkz. [Sandboxing](/tr/gateway/sandboxing).
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
- Çalışma alanı varsayılan olarak `~/.openclaw/workspace` olur (`OPENCLAW_PROFILE` ayarlıysa `~/.openclaw/workspace-<profile>`).
- Durum varsayılan olarak `~/.openclaw/agents/main/agent` olur.

## Ajan yardımcısı

Yeni bir yalıtılmış ajan eklemek için ajan sihirbazını kullanın:

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
  <Step title="Her ajan çalışma alanını oluşturun">
    Sihirbazı kullanın veya çalışma alanlarını elle oluşturun:

    ```bash
    openclaw agents add coding
    openclaw agents add social
    ```

    Her ajan, `SOUL.md`, `AGENTS.md` ve isteğe bağlı `USER.md` içeren kendi çalışma alanını; ayrıca `~/.openclaw/agents/<agentId>` altında ayrılmış bir `agentDir` ve oturum deposunu alır.

  </Step>
  <Step title="Kanal hesapları oluşturun">
    Tercih ettiğiniz kanallarda ajan başına bir hesap oluşturun:

    - Discord: ajan başına bir bot, Message Content Intent'i etkinleştirin, her token'ı kopyalayın.
    - Telegram: ajan başına BotFather üzerinden bir bot, her token'ı kopyalayın.
    - WhatsApp: her hesap için her telefon numarasını bağlayın.

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

## Birden fazla ajan = birden fazla kişi, birden fazla kişilik

**Birden fazla ajan** ile her `agentId`, **tam yalıtılmış bir persona** olur:

- **Farklı telefon numaraları/hesaplar** (kanal başına `accountId`).
- **Farklı kişilikler** (ajan başına `AGENTS.md` ve `SOUL.md` gibi çalışma alanı dosyaları).
- **Ayrı auth + oturumlar** (açıkça etkinleştirilmedikçe çapraz konuşma yok).

Bu, birden fazla kişinin yapay zekâ "beyinlerini" ve verilerini yalıtılmış tutarken tek bir Gateway sunucusunu paylaşmasını sağlar.

## Ajanlar arası QMD bellek araması

Bir ajanın başka bir ajanın QMD oturum transkriptlerini araması gerekiyorsa `agents.list[].memorySearch.qmd.extraCollections` altına ek koleksiyonlar ekleyin. Yalnızca her ajanın aynı paylaşılan transkript koleksiyonlarını devralması gerekiyorsa `agents.defaults.memorySearch.qmd.extraCollections` kullanın.

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

Ek koleksiyon yolu ajanlar arasında paylaşılabilir, ancak yol ajan çalışma alanının dışındaysa koleksiyon adı açık kalır. Çalışma alanı içindeki yollar ajan kapsamlı kalır; böylece her ajan kendi transkript arama kümesini korur.

## Tek WhatsApp numarası, birden fazla kişi (DM bölme)

**Tek bir WhatsApp hesabında** kalırken farklı WhatsApp DM'lerini **farklı ajanlara** yönlendirebilirsiniz. `peer.kind: "direct"` ile gönderen E.164'e göre (ör. `+15551234567`) eşleştirin. Yanıtlar yine aynı WhatsApp numarasından gelir (ajan başına gönderen kimliği yoktur).

<Note>
Doğrudan sohbetler ajanın **ana oturum anahtarına** çöker, bu nedenle gerçek yalıtım için **kişi başına bir ajan** gerekir.
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

- DM erişim denetimi ajan başına değil, **WhatsApp hesabı başına küreseldir** (eşleştirme/allowlist).
- Paylaşılan gruplar için grubu tek bir ajana bağlayın veya [Broadcast groups](/tr/channels/broadcast-groups) kullanın.

## Yönlendirme kuralları (mesajlar nasıl ajan seçer)

Bağlamalar **deterministiktir** ve **en spesifik olan kazanır**:

<Steps>
  <Step title="peer eşleşmesi">
    Tam DM/grup/kanal kimliği.
  </Step>
  <Step title="parentPeer eşleşmesi">
    İş parçacığı devralımı.
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
  <Step title="Varsayılan ajan">
    `agents.list[].default` değerine fallback, yoksa ilk liste girdisi, varsayılan: `main`.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Eşitlik bozma ve AND semantiği">
    - Aynı katmanda birden çok bağlama eşleşirse yapılandırma sırasındaki ilki kazanır.
    - Bir bağlama birden çok eşleşme alanı ayarlarsa (ör. `peer` + `guildId`), belirtilen tüm alanlar gerekir (`AND` semantiği).
  </Accordion>
  <Accordion title="Hesap kapsamı ayrıntısı">
    - `accountId` atlayan bir bağlama yalnızca varsayılan hesapla eşleşir.
    - Tüm hesaplar için kanal genelinde fallback olarak `accountId: "*"` kullanın.
    - Daha sonra aynı ajan için aynı bağlamayı açık bir hesap kimliğiyle eklerseniz OpenClaw, onu çoğaltmak yerine mevcut yalnızca kanal kapsamlı bağlamayı hesap kapsamlıya yükseltir.
  </Accordion>
</AccordionGroup>

## Birden fazla hesap / telefon numarası

**Birden fazla hesabı** destekleyen kanallar (ör. WhatsApp), her oturumu tanımlamak için `accountId` kullanır. Her `accountId` farklı bir ajana yönlendirilebilir; böylece tek bir sunucu, oturumları karıştırmadan birden fazla telefon numarasını barındırabilir.

`accountId` atlandığında kanal genelinde bir varsayılan hesap istiyorsanız `channels.<channel>.defaultAccount` ayarlayın (isteğe bağlı). Ayarlı değilse OpenClaw varsa `default` hesabına, yoksa yapılandırılmış ilk hesap kimliğine (sıralı) geri düşer.

Bu deseni destekleyen yaygın kanallar şunları içerir:

- `whatsapp`, `telegram`, `discord`, `slack`, `signal`, `imessage`
- `irc`, `line`, `googlechat`, `mattermost`, `matrix`, `nextcloud-talk`
- `bluebubbles`, `zalo`, `zalouser`, `nostr`, `feishu`

## Kavramlar

- `agentId`: tek bir "beyin" (çalışma alanı, ajan başına auth, ajan başına oturum deposu).
- `accountId`: tek bir kanal hesap örneği (ör. WhatsApp hesabı `"personal"` ile `"biz"`).
- `binding`: gelen mesajları `(channel, accountId, peer)` ve isteğe bağlı guild/team kimliklerine göre bir `agentId`'ye yönlendirir.
- Doğrudan sohbetler `agent:<agentId>:<mainKey>` biçimine çöker (ajan başına "main"; `session.mainKey`).

## Platform örnekleri

<AccordionGroup>
  <Accordion title="Ajan başına Discord botları">
    Her Discord bot hesabı benzersiz bir `accountId` ile eşlenir. Her hesabı bir ajana bağlayın ve bot başına allowlist'leri koruyun.

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

      // Deterministik yönlendirme: ilk eşleşme kazanır (en spesifik olan önce gelir).
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

      // Varsayılan olarak kapalıdır: ajandan ajana mesajlaşma açıkça etkinleştirilmeli + allowlist'e alınmalıdır.
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

  </Accordion>
</AccordionGroup>

## Yaygın desenler

<Tabs>
  <Tab title="WhatsApp günlük + Telegram derin çalışma">
    Kanala göre ayırın: WhatsApp'ı hızlı günlük bir ajana, Telegram'ı bir Opus ajanına yönlendirin.

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

    - Bir kanal için birden fazla hesabınız varsa bağlamaya `accountId` ekleyin (örneğin `{ channel: "whatsapp", accountId: "personal" }`).
    - Tek bir DM/grubu Opus'a yönlendirirken geri kalanını chat üzerinde tutmak için o eşe bir `match.peer` bağlaması ekleyin; eş eşleşmeleri her zaman kanal genelindeki kurallardan üstündür.

  </Tab>
  <Tab title="Aynı kanal, bir eş Opus'a">
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

    Eş bağlamaları her zaman kazanır; bu yüzden onları kanal genelindeki kuralın üzerinde tutun.

  </Tab>
  <Tab title="Bir WhatsApp grubuna bağlı aile ajanı">
    Özel bir aile ajanını tek bir WhatsApp grubuna bağlayın; mention geçitleme ve daha sıkı bir araç politikasıyla:

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

    - Araç allow/deny listeleri **araçlardır**, Skill değildir. Bir Skill'in bir binary çalıştırması gerekiyorsa `exec` izninin açık olduğundan ve binary'nin sandbox içinde var olduğundan emin olun.
    - Daha sıkı geçitleme için `agents.list[].groupChat.mentionPatterns` ayarlayın ve kanal için grup allowlist'lerini etkin tutun.

  </Tab>
</Tabs>

## Ajan başına sandbox ve araç yapılandırması

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
          scope: "agent",  // Ajan başına bir konteyner
          docker: {
            // Konteyner oluşturulduktan sonra isteğe bağlı tek seferlik kurulum
            setupCommand: "apt-get update && apt-get install -y git curl",
          },
        },
        tools: {
          allow: ["read"],                    // Yalnızca read aracı
          deny: ["exec", "write", "edit", "apply_patch"],    // Diğerlerini engelle
        },
      },
    ],
  },
}
```

<Note>
`setupCommand`, `sandbox.docker` altında bulunur ve konteyner oluşturulurken bir kez çalışır. Çözümlenen kapsam `"shared"` olduğunda ajan başına `sandbox.docker.*` geçersiz kılmaları yok sayılır.
</Note>

**Faydalar:**

- **Güvenlik yalıtımı**: güvenilmeyen ajanlar için araçları kısıtlayın.
- **Kaynak denetimi**: bazı ajanları sandbox içine alırken diğerlerini ana makinede tutun.
- **Esnek politikalar**: ajan başına farklı izinler.

<Note>
`tools.elevated` **küreseldir** ve gönderici tabanlıdır; ajan başına yapılandırılamaz. Ajan başına sınırlar gerekiyorsa `exec`'i engellemek için `agents.list[].tools` kullanın. Grup hedefleme için @mention'ların amaçlanan ajana temiz biçimde eşlenmesi adına `agents.list[].groupChat.mentionPatterns` kullanın.
</Note>

Ayrıntılı örnekler için bkz. [Multi-agent sandbox and tools](/tr/tools/multi-agent-sandbox-tools).

## İlgili

- [ACP agents](/tr/tools/acp-agents) — harici kodlama harness'lerini çalıştırma
- [Channel routing](/tr/channels/channel-routing) — mesajların ajanlara nasıl yönlendirildiği
- [Presence](/tr/concepts/presence) — ajan varlığı ve kullanılabilirliği
- [Session](/tr/concepts/session) — oturum yalıtımı ve yönlendirme
- [Sub-agents](/tr/tools/subagents) — arka planda ajan çalıştırmaları başlatma
