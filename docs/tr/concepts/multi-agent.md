---
read_when: You want multiple agents with separate workspaces, auth, and sessions in one Gateway process.
sidebarTitle: Multi-agent routing
status: active
summary: 'Çoklu ajan yönlendirmesi: ajan sınırları, kanal hesapları ve bağlamalar'
title: Çoklu ajan yönlendirme
x-i18n:
    generated_at: "2026-07-16T17:05:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 265a1f3d9d9b4957c99c71f391ce4f5abba6b70561570f8bbe8cb9964ece1cfc
    source_path: concepts/multi-agent.md
    workflow: 16
---

Tek bir Gateway işleminde, her biri kendi çalışma alanına, durum dizinine (`agentDir`) ve SQLite destekli oturum geçmişine sahip birden fazla _yalıtılmış_ agent ile birden fazla kanal hesabını (ör. iki WhatsApp numarası) çalıştırın. Gelen mesajlar **bağlamalar** aracılığıyla doğru agent'a yönlendirilir.

Bir **agent**, persona başına tam kapsamdır: çalışma alanı dosyaları, kimlik doğrulama profilleri, model kayıt defteri ve oturum deposu. Bir **bağlama**, bir kanal hesabını (bir Slack çalışma alanı, bir WhatsApp numarası vb.) bu agent'lardan biriyle eşler.

## Bir agent nedir

Her agent'ın kendine ait şunları vardır:

- **Çalışma alanı**: dosyalar, `AGENTS.md`/`SOUL.md`/`USER.md`, yerel notlar, persona kuralları.
- **Durum dizini** (`agentDir`): kimlik doğrulama profilleri, model kayıt defteri, agent başına yapılandırma.
- **Oturum deposu**: `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite` içindeki sohbet geçmişi ve yönlendirme durumu.

Kimlik doğrulama profilleri agent başınadır ve şuradan okunur:

```text
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

<Note>
`sessions_history`, oturumlar arası hatırlama için daha güvenli yoldur: ham bir transkript dökümü değil, sınırlandırılmış ve sansürlenmiş bir görünüm döndürür. Düşünme bloğu imzalarını, araç sonucu yükü ayrıntılarını, `<relevant-memories>` iskeletini, araç çağrısı XML etiketlerini (`<tool_call>`, `<function_call>` ve bunların çoğul/indirgenmiş biçimleri) ve MiniMax araç çağrısı XML'ini kaldırır; ardından çıktıyı bayt boyutuna göre kısaltır ve sınırlar.
</Note>

<Warning>
`agentDir` değerini agent'lar arasında asla yeniden kullanmayın — bu, kimlik doğrulama/oturum durumu çakışmalarına neden olur. İkincil bir agent'ın yerel OAuth kimlik bilgisi sona erdiğinde veya yenileme işlemi başarısız olduğunda OpenClaw, aynı profil kimliği için varsayılan/ana agent'ın kimlik bilgisine başvurur ve yenileme belirtecini ikincil agent'ın deposuna kopyalamadan en güncel belirteci benimser. Tamamen bağımsız bir OAuth hesabı istiyorsanız o agent üzerinden oturum açın. Kimlik bilgilerini elle kopyalarsanız yalnızca taşınabilir statik `api_key` veya `token` profillerini kopyalayın — OAuth yenileme malzemesi varsayılan olarak taşınabilir değildir (`copyToAgents` ile bir profil açıkça buna dahil edilebilir).
</Warning>

Skills, her agent çalışma alanından ve `~/.openclaw/skills` gibi paylaşılan köklerden yüklenir, ardından etkin agent Skills izin listesine göre filtrelenir. Paylaşılan bir temel için `agents.defaults.skills`, agent başına değiştirme için `agents.list[].skills` kullanın (açık girdiler varsayılanın yerini alır, onunla birleştirilmez). Bkz. [Skills: agent başına ve paylaşılan](/tr/tools/skills#per-agent-vs-shared-skills) ve [Skills: agent izin listeleri](/tr/tools/skills#agent-allowlists).

Plugin'e ait depolama, ilgili Plugin'in yapılandırmasını izler; ikinci bir agent eklemek her genel Plugin deposunu otomatik olarak ayırmaz. Örneğin, personaların derlenmiş wiki bilgisini paylaşmaması gerektiğinde [agent başına Memory Wiki kasalarını](/tr/concepts/multi-agent#per-agent-memory-wiki-vaults) yapılandırın.

<Note>
**Çalışma alanı notu:** Her agent'ın çalışma alanı, katı bir korumalı alan değil, **varsayılan cwd**'dir. Göreli yollar çalışma alanı içinde çözümlenir ancak korumalı alan etkinleştirilmemişse mutlak yollar ana makinedeki diğer konumlara erişebilir. Bkz. [Korumalı alan](/tr/gateway/sandboxing).
</Note>

## Yollar

| Öğe                              | Varsayılan                                                                             | Geçersiz kılma                                                                           |
| -------------------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Yapılandırma                     | `~/.openclaw/openclaw.json`                                                            | `OPENCLAW_CONFIG_PATH`                                                                   |
| Durum dizini                     | `~/.openclaw`                                                                          | `OPENCLAW_STATE_DIR`                                                                     |
| Varsayılan agent'ın çalışma alanı | `~/.openclaw/workspace` (`OPENCLAW_PROFILE` ayarlandığında `workspace-<profile>`)      | `agents.list[].workspace`, ardından `agents.defaults.workspace` veya `OPENCLAW_WORKSPACE_DIR` |
| Diğer agent'ların çalışma alanı  | `<stateDir>/workspace-<agentId>` (ayarlandığında `<agents.defaults.workspace>/<agentId>`) | `agents.list[].workspace`                                                                |
| Agent dizini                     | `~/.openclaw/agents/<agentId>/agent`                                                   | `agents.list[].agentDir`                                                                 |
| Oturumlar ve transkriptler       | `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`                             | —                                                                                        |
| Eski/arşiv oturum yapıtları      | `~/.openclaw/agents/<agentId>/sessions`                                                | —                                                                                        |

### Tek agent modu (varsayılan)

Hiçbir şey yapılandırmazsanız OpenClaw tek bir agent çalıştırır:

- `agentId` varsayılan olarak `main` değerini alır.
- Oturumların anahtarı `agent:main:<mainKey>` şeklindedir (varsayılan `mainKey`, `main` değeridir).
- Çalışma alanı varsayılan olarak `~/.openclaw/workspace` değerini alır (veya `OPENCLAW_PROFILE`, `default` dışında bir değere ayarlandığında `workspace-<profile>`).
- Durum varsayılan olarak `~/.openclaw/agents/main/agent` değerini alır.

## Agent yardımcısı

Yeni bir yalıtılmış agent ekleyin:

```bash
openclaw agents add work
```

Bayraklar: `--workspace <dir>`, `--model <id>`, `--agent-dir <dir>`, `--bind <channel[:accountId]>` (yinelenebilir), `--non-interactive` (`--workspace` gerektirir).

Gelen mesajları yönlendirmek için `bindings` ekleyin (sihirbaz bunu sizin için yapmayı önerir), ardından doğrulayın:

```bash
openclaw agents list --bindings
```

## Hızlı başlangıç

<Steps>
  <Step title="Her agent çalışma alanını oluşturun">
    ```bash
    openclaw agents add coding
    openclaw agents add social
    ```

    Her agent, `SOUL.md`, `AGENTS.md` ve isteğe bağlı `USER.md` içeren kendi çalışma alanının yanı sıra özel bir `agentDir` ve `~/.openclaw/agents/<agentId>` altında bir oturum deposu edinir.

  </Step>
  <Step title="Kanal hesapları oluşturun">
    Tercih ettiğiniz kanallarda her agent için bir hesap oluşturun:

    - Discord: agent başına bir bot oluşturun, Message Content Intent seçeneğini etkinleştirin ve her belirteci kopyalayın.
    - Telegram: BotFather aracılığıyla agent başına bir bot oluşturun ve her belirteci kopyalayın.
    - WhatsApp: hesap başına her telefon numarasını bağlayın.

    ```bash
    openclaw channels login --channel whatsapp --account work
    ```

    Kanal kılavuzlarına bakın: [Discord](/tr/channels/discord), [Telegram](/tr/channels/telegram), [WhatsApp](/tr/channels/whatsapp).

  </Step>
  <Step title="Agent'ları, hesapları ve bağlamaları ekleyin">
    Agent'ları `agents.list` altına, kanal hesaplarını `channels.<channel>.accounts` altına ekleyin ve bunları `bindings` ile bağlayın (örnekler aşağıdadır).
  </Step>
  <Step title="Yeniden başlatın ve doğrulayın">
    ```bash
    openclaw gateway restart
    openclaw agents list --bindings
    openclaw channels status --probe
    ```
  </Step>
</Steps>

## Birden fazla agent, birden fazla persona

Yapılandırılan her `agentId`, temel agent durumu için ayrı bir persona sınırıdır:

- Kanal başına farklı hesaplar (`accountId` başına).
- Farklı kişilikler (agent başına `AGENTS.md`/`SOUL.md`).
- Agent'lar arası erişimin yalnızca açık özellikler veya Plugin yapılandırması üzerinden etkinleştirildiği ayrı kimlik doğrulama ve oturumlar.

Bu, temel agent durumunu ayrı tutarken birden fazla kişinin tek bir Gateway'i paylaşmasına olanak tanır.

## Agent başına Memory Wiki kasaları

Memory Wiki varsayılan olarak tek bir genel kasa kullanır. Bir destek agent'ının derlenmiş bilgisini bir pazarlama agent'ınınkinden ayrı tutmak için `plugins.entries.memory-wiki.config.vault.scope` değerini `agent` olarak ayarlayın:

```json5
{
  plugins: {
    entries: {
      "memory-wiki": {
        enabled: true,
        config: {
          vault: {
            scope: "agent",
            path: "~/.openclaw/wiki",
          },
        },
      },
    },
  },
}
```

Yapılandırılan yol üst dizindir. OpenClaw normalleştirilmiş agent kimliğini sona ekleyerek `~/.openclaw/wiki/support` ve `~/.openclaw/wiki/marketing` gibi yollar oluşturur. Birden fazla agent yapılandırıldığında agent kapsamlı CLI ve Gateway işlemleri açıkça bir agent belirtilmesini gerektirir. Köprü filtreleme, geçiş ve güven sınırı ayrıntıları için [agent başına Memory Wiki kasalarına](/tr/plugins/memory-wiki#per-agent-vaults) bakın.

## Agent'lar arası QMD bellek araması

Bir agent'ın başka bir agent'ın QMD oturum transkriptlerinde arama yapmasına izin vermek için `agents.list[].memorySearch.qmd.extraCollections` altına ek koleksiyonlar ekleyin. Her agent'ın aynı koleksiyonları paylaşması gerektiğinde `agents.defaults.memorySearch.qmd.extraCollections` kullanın.

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
            extraCollections: [{ path: "notes" }], // çalışma alanı içinde çözümlenir -> "notes-main" adlı koleksiyon
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

Ek koleksiyon yolu agent'lar arasında paylaşılabilir ancak yol agent çalışma alanının dışındaysa `name` açıkça belirtilmiş olarak kalır. Çalışma alanı içindeki yollar agent kapsamında kalır; böylece her agent kendi transkript arama kümesini korur.

## Tek WhatsApp numarası, birden fazla kişi (DM ayrımı)

Gönderen E.164 (`+15551234567`) değerini `peer.kind: "direct"` ile eşleştirerek **tek** bir WhatsApp hesabındaki farklı WhatsApp DM'lerini farklı agent'lara yönlendirin. Yanıtlar yine aynı WhatsApp numarasından gelir — agent başına ayrı bir gönderen kimliği yoktur.

<Note>
Doğrudan sohbetler varsayılan olarak agent'ın ana oturum anahtarında birleştirilir; bu nedenle gerçek yalıtım için kişi başına bir agent gerekir.
</Note>

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

DM erişim denetimi (eşleştirme/izin listesi) agent başına değil, WhatsApp hesabı başına geneldir. Paylaşılan gruplar için grubu tek bir agent'a bağlayın veya [Yayın gruplarını](/tr/channels/broadcast-groups) kullanın.

## Yönlendirme kuralları

Bağlamalar deterministiktir ve en belirgin eşleşme kazanır. Tam katman sırası (tam eş, üst eş, eş joker karakteri, sunucu+roller, sunucu, ekip, hesap, kanal, varsayılan agent) için [Kanal yönlendirmesine](/tr/channels/channel-routing#routing-rules-how-an-agent-is-chosen) bakın. Burada özellikle belirtilmesi gereken birkaç kural:

- Aynı katmanda birden fazla bağlama eşleşirse yapılandırma sırasındaki ilk bağlama kazanır.
- Bir bağlama birden fazla eşleşme alanı ayarlarsa (örneğin `peer` + `guildId`), belirtilen tüm alanların eşleşmesi gerekir (`AND` semantiği).
- `accountId` değerini içermeyen bir bağlama her hesapla değil, yalnızca varsayılan hesapla eşleşir. Kanal genelinde geri dönüş için `accountId: "*"`, tek bir hesap için `accountId: "<name>"` kullanın. Aynı bağlamayı açık bir hesap kimliğiyle yeniden eklemek, mevcut yalnızca kanal bağlamasını çoğaltmak yerine yükseltir.

## Birden fazla hesap / telefon numarası

Birden fazla hesabı destekleyen kanallar (ör. WhatsApp), her oturum açma işlemini tanımlamak için `accountId` kullanır. Her `accountId` kendi agent'ına yönlendirilir; böylece tek bir sunucu, oturumları karıştırmadan birden fazla telefon numarasını barındırabilir.

`accountId` belirtilmediğinde kullanılacak hesabı seçmek için `channels.<channel>.defaultAccount` değerini ayarlayın. Ayarlanmadığında OpenClaw, varsa `default` değerine; aksi takdirde yapılandırılmış ilk hesap kimliğine (sıralanmış olarak) geri döner.

Birden fazla hesabı destekleyen kanallar: `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `mattermost`, `matrix`, `nextcloud-talk`, `nostr`, `signal`, `slack`, `telegram`, `whatsapp`, `zalo`, `zalouser`.

## Kavramlar

- `agentId`: tek bir "beyin" (çalışma alanı, aracı başına kimlik doğrulama, aracı başına oturum deposu).
- `accountId`: tek bir kanal hesabı örneği (ör. WhatsApp hesabı `personal` ile `biz`).
- `binding`: gelen mesajları `(channel, accountId, peer)` ve isteğe bağlı olarak guild/ekip kimliklerine göre bir `agentId` hedefine yönlendirir.
- Doğrudan sohbetler `agent:<agentId>:<mainKey>` altında birleştirilir (aracı başına "ana"; bkz. `session.mainKey`).

## Platform örnekleri

<AccordionGroup>
  <Accordion title="Aracı başına Discord botları">
    Her Discord bot hesabı benzersiz bir `accountId` ile eşleşir. Her hesabı bir aracıya bağlayın ve izin listelerini bot başına ayrı tutun.

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
    - Token'lar `channels.discord.accounts.<id>.token` içinde tutulur (varsayılan hesap `DISCORD_BOT_TOKEN` kullanabilir).

  </Accordion>
  <Accordion title="Aracı başına Telegram botları">
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

    - BotFather ile her aracı için bir bot oluşturun ve her token'ı kopyalayın.
    - Token'lar `channels.telegram.accounts.<id>.botToken` içinde tutulur (varsayılan hesap `TELEGRAM_BOT_TOKEN` kullanabilir).
    - Aynı Telegram grubundaki birden fazla bot için her botu davet edin ve yanıt vermesi gereken bottan bahsedin.
    - Her grup botu için BotFather Privacy Mode'u devre dışı bırakın (`/setprivacy` -> Disable), ardından Telegram'ın ayarı uygulaması için botu kaldırıp yeniden ekleyin.
    - Gruplara `channels.telegram.groups` ile izin verin veya yalnızca güvenilir grup dağıtımları için `groupPolicy: "open"` kullanın.
    - Gönderen kullanıcı kimliklerini `groupAllowFrom` içine yerleştirin. Grup ve süper grup kimlikleri `groupAllowFrom` içine değil, `channels.telegram.groups` içine aittir.
    - Her botun kendi aracısına yönlendirilmesi için `accountId` ile bağlayın.

  </Accordion>
  <Accordion title="Aracı başına WhatsApp numaraları">
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

      // Belirlenimci yönlendirme: ilk eşleşme kazanır (en özel olan önce).
      bindings: [
        { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
        { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },

        // İsteğe bağlı eş düzeyi geçersiz kılma (örnek: belirli bir grubu iş aracısına gönderin).
        {
          agentId: "work",
          match: {
            channel: "whatsapp",
            accountId: "personal",
            peer: { kind: "group", id: "1203630...@g.us" },
          },
        },
      ],

      // Varsayılan olarak kapalıdır: aracılar arası mesajlaşma açıkça etkinleştirilmeli ve izin listesine alınmalıdır.
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

## Yaygın kalıplar

<Tabs>
  <Tab title="Günlük WhatsApp + Telegram'da derin çalışma">
    Kanala göre ayırın: WhatsApp'ı hızlı bir günlük aracıya, Telegram'ı ise bir Opus aracısına yönlendirin.

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

    Bu örnekler `accountId: "*"` kullanır; böylece daha sonra hesap ekleseniz bile bağlamalar çalışmaya devam eder. Geri kalanları sohbet aracısında tutarken tek bir DM'yi/grubu Opus'a yönlendirmek için ilgili eş düzey adına bir `match.peer` bağlaması ekleyin — eş düzey eşleşmeleri her zaman kanal genelindeki kurallara üstün gelir.

  </Tab>
  <Tab title="Aynı kanal, bir eş düzey Opus'a">
    WhatsApp'ı hızlı aracıda tutun, ancak bir DM'yi Opus'a yönlendirin:

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

    Eş düzey bağlamaları her zaman üstün gelir; bu nedenle bunları kanal genelindeki kuralın üzerinde tutun.

  </Tab>
  <Tab title="Bir WhatsApp grubuna bağlı aile aracısı">
    Bahsetme denetimi ve daha sıkı bir araç politikasıyla özel bir aile aracısını tek bir WhatsApp grubuna bağlayın:

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

    Araç izin/ret listeleri skill'ler değil, **araçlardır**. Bir skill'in bir ikili dosya çalıştırması gerekiyorsa `exec` için izin verildiğinden ve ikili dosyanın sandbox'ta bulunduğundan emin olun. Daha sıkı denetim için `agents.list[].groupChat.mentionPatterns` değerini ayarlayın ve kanalın grup izin listelerini etkin tutun.

  </Tab>
</Tabs>

## Aracı başına sandbox ve araç yapılandırması

Her aracının kendi sandbox ve araç kısıtlamaları olabilir:

```js
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: {
          mode: "off",  // Kişisel aracı için sandbox yok
        },
        // Araç kısıtlaması yok - tüm araçlar kullanılabilir
      },
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: {
          mode: "all",     // Her zaman sandbox içinde
          scope: "agent",  // Aracı başına bir konteyner
          docker: {
            // Konteyner oluşturulduktan sonra isteğe bağlı tek seferlik kurulum
            setupCommand: "apt-get update && apt-get install -y git curl",
          },
        },
        tools: {
          allow: ["read"],                    // Yalnızca okuma aracı
          deny: ["exec", "write", "edit", "apply_patch"],    // Diğerlerini reddet
        },
      },
    ],
  },
}
```

<Note>
`setupCommand`, `sandbox.docker` altında bulunur ve konteyner oluşturulurken bir kez çalışır. Çözümlenen kapsam `"shared"` olduğunda, aracı başına `sandbox.docker.*` geçersiz kılmaları yok sayılır.
</Note>

Bu size şunları sağlar:

- **Güvenlik yalıtımı**: güvenilmeyen aracılar için araçları kısıtlayın.
- **Kaynak denetimi**: diğerlerini ana sistemde tutarken belirli aracıları sandbox içine alın.
- **Esnek politikalar**: aracı başına farklı izinler.

<Note>
`tools.elevated` hem genel bir denetime (`tools.elevated.enabled`/`allowFrom`) hem de aracı başına bir denetime (`agents.list[].tools.elevated.enabled`/`allowFrom`) sahiptir. Aracı başına denetim, genel denetimi yalnızca daha fazla kısıtlayabilir — yükseltilmiş komutların çalışması için her ikisinin de bir gönderene izin vermesi gerekir. Grup hedeflemesi için @bahsetmelerin amaçlanan aracıyla düzgün biçimde eşleşmesi amacıyla `agents.list[].groupChat.mentionPatterns` kullanın.
</Note>

Ayrıntılı örnekler için [Çok aracılı sandbox ve araçlar](/tr/tools/multi-agent-sandbox-tools) bölümüne bakın.

## İlgili

- [ACP ajanları](/tr/tools/acp-agents) — harici kodlama düzeneklerini çalıştırma
- [Kanal yönlendirme](/tr/channels/channel-routing) — iletilerin ajanlara nasıl yönlendirildiği
- [Mevcudiyet](/tr/concepts/presence) — ajan mevcudiyeti ve kullanılabilirliği
- [Oturum](/tr/concepts/session) — oturum yalıtımı ve yönlendirme
- [Alt ajanlar](/tr/tools/subagents) — arka planda ajan çalıştırmaları başlatma
