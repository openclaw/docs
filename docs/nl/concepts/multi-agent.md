---
read_when: You want multiple isolated agents (workspaces + auth) in one gateway process.
sidebarTitle: Multi-agent routing
status: active
summary: 'Multi-agent-routering: geïsoleerde agenten, kanaalaccounts en bindingen'
title: Routering voor meerdere agenten
x-i18n:
    generated_at: "2026-04-29T22:39:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 67adea74d5f97feff3f816cc4c34c9429e7659289013e5a7c7623bd185a50a31
    source_path: concepts/multi-agent.md
    workflow: 16
---

Voer meerdere _geïsoleerde_ agents uit — elk met een eigen werkruimte, statusmap (`agentDir`) en sessiegeschiedenis — plus meerdere kanaalaccounts (bijv. twee WhatsApps) in één draaiende Gateway. Binnenkomende berichten worden via bindingen naar de juiste agent gerouteerd.

Een **agent** is hier de volledige scope per persona: werkruimtebestanden, auth-profielen, modelregister en sessieopslag. `agentDir` is de statusmap op schijf die deze configuratie per agent bevat op `~/.openclaw/agents/<agentId>/`. Een **binding** koppelt een kanaalaccount (bijv. een Slack-werkruimte of een WhatsApp-nummer) aan een van die agents.

## Wat is "één agent"?

Een **agent** is een volledig afgebakend brein met een eigen:

- **Werkruimte** (bestanden, AGENTS.md/SOUL.md/USER.md, lokale notities, persona-regels).
- **Statusmap** (`agentDir`) voor auth-profielen, modelregister en configuratie per agent.
- **Sessieopslag** (chatgeschiedenis + routeringsstatus) onder `~/.openclaw/agents/<agentId>/sessions`.

Auth-profielen zijn **per agent**. Elke agent leest uit zijn eigen:

```text
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

<Note>
`sessions_history` is hier ook het veiligere pad voor herinnering over sessies heen: het retourneert een begrensde, opgeschoonde weergave, geen ruwe transcriptdump. Assistant-herinnering verwijdert denktags, `<relevant-memories>`-scaffolding, platte-tekst XML-payloads voor tool-calls (waaronder `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` en afgekorte tool-call-blokken), gedegradeerde tool-call-scaffolding, gelekte ASCII-/full-width modelbesturingstokens en ongeldige MiniMax tool-call-XML vóór redactie/afkapping.
</Note>

<Warning>
Hergebruik `agentDir` nooit tussen agents (dat veroorzaakt auth-/sessieconflicten). Agents
kunnen teruglezen naar de auth-profielen van de standaard-/hoofdagent wanneer ze
geen lokaal profiel hebben, maar OpenClaw kloont geen OAuth-verversingstokens naar de
secundaire agentopslag. Als je een onafhankelijk OAuth-account wilt, meld je dan aan vanuit
die agent; als je credentials handmatig kopieert, kopieer dan alleen draagbare statische
`api_key`- of `token`-profielen.
</Warning>

Skills worden geladen vanuit elke agentwerkruimte plus gedeelde roots zoals `~/.openclaw/skills`, en daarna gefilterd op basis van de effectieve allowlist voor agent-Skills wanneer die is geconfigureerd. Gebruik `agents.defaults.skills` voor een gedeelde basis en `agents.list[].skills` voor vervanging per agent. Zie [Skills: per-agent versus gedeeld](/nl/tools/skills#per-agent-vs-shared-skills) en [Skills: allowlists voor agent-Skills](/nl/tools/skills#agent-skill-allowlists).

De Gateway kan **één agent** hosten (standaard) of **veel agents** naast elkaar.

<Note>
**Werkruimtenotitie:** de werkruimte van elke agent is de **standaard cwd**, geen harde sandbox. Relatieve paden worden binnen de werkruimte opgelost, maar absolute paden kunnen andere hostlocaties bereiken tenzij sandboxing is ingeschakeld. Zie [Sandboxing](/nl/gateway/sandboxing).
</Note>

## Paden (snelle kaart)

- Configuratie: `~/.openclaw/openclaw.json` (of `OPENCLAW_CONFIG_PATH`)
- Statusmap: `~/.openclaw` (of `OPENCLAW_STATE_DIR`)
- Werkruimte: `~/.openclaw/workspace` (of `~/.openclaw/workspace-<agentId>`)
- Agentmap: `~/.openclaw/agents/<agentId>/agent` (of `agents.list[].agentDir`)
- Sessies: `~/.openclaw/agents/<agentId>/sessions`

### Modus met één agent (standaard)

Als je niets doet, draait OpenClaw één agent:

- `agentId` wordt standaard **`main`**.
- Sessies worden gesleuteld als `agent:main:<mainKey>`.
- De werkruimte is standaard `~/.openclaw/workspace` (of `~/.openclaw/workspace-<profile>` wanneer `OPENCLAW_PROFILE` is ingesteld).
- De status is standaard `~/.openclaw/agents/main/agent`.

## Agenthulp

Gebruik de agentwizard om een nieuwe geïsoleerde agent toe te voegen:

```bash
openclaw agents add work
```

Voeg daarna `bindings` toe (of laat de wizard dat doen) om binnenkomende berichten te routeren.

Controleer met:

```bash
openclaw agents list --bindings
```

## Snel aan de slag

<Steps>
  <Step title="Maak elke agentwerkruimte">
    Gebruik de wizard of maak werkruimten handmatig:

    ```bash
    openclaw agents add coding
    openclaw agents add social
    ```

    Elke agent krijgt zijn eigen werkruimte met `SOUL.md`, `AGENTS.md` en optioneel `USER.md`, plus een eigen `agentDir` en sessieopslag onder `~/.openclaw/agents/<agentId>`.

  </Step>
  <Step title="Maak kanaalaccounts">
    Maak één account per agent aan op je voorkeurskanalen:

    - Discord: één bot per agent, schakel Message Content Intent in, kopieer elke token.
    - Telegram: één bot per agent via BotFather, kopieer elke token.
    - WhatsApp: koppel elk telefoonnummer per account.

    ```bash
    openclaw channels login --channel whatsapp --account work
    ```

    Zie kanaalgidsen: [Discord](/nl/channels/discord), [Telegram](/nl/channels/telegram), [WhatsApp](/nl/channels/whatsapp).

  </Step>
  <Step title="Voeg agents, accounts en bindingen toe">
    Voeg agents toe onder `agents.list`, kanaalaccounts onder `channels.<channel>.accounts`, en verbind ze met `bindings` (voorbeelden hieronder).
  </Step>
  <Step title="Herstart en controleer">
    ```bash
    openclaw gateway restart
    openclaw agents list --bindings
    openclaw channels status --probe
    ```
  </Step>
</Steps>

## Meerdere agents = meerdere mensen, meerdere persoonlijkheden

Met **meerdere agents** wordt elke `agentId` een **volledig geïsoleerde persona**:

- **Verschillende telefoonnummers/accounts** (per kanaal `accountId`).
- **Verschillende persoonlijkheden** (werkruimtebestanden per agent zoals `AGENTS.md` en `SOUL.md`).
- **Gescheiden auth + sessies** (geen kruisgesprekken tenzij expliciet ingeschakeld).

Zo kunnen **meerdere mensen** één Gateway-server delen terwijl hun AI-"breinen" en gegevens geïsoleerd blijven.

## QMD-geheugenzoekopdracht tussen agents

Als één agent de QMD-sessietranscripten van een andere agent moet doorzoeken, voeg dan extra collecties toe onder `agents.list[].memorySearch.qmd.extraCollections`. Gebruik `agents.defaults.memorySearch.qmd.extraCollections` alleen wanneer elke agent dezelfde gedeelde transcriptcollecties moet erven.

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

Het extra collectiepad kan tussen agents worden gedeeld, maar de collectienaam blijft expliciet wanneer het pad buiten de agentwerkruimte ligt. Paden binnen de werkruimte blijven agentgebonden, zodat elke agent zijn eigen set voor transcriptzoekopdrachten behoudt.

## Eén WhatsApp-nummer, meerdere mensen (DM-splitsing)

Je kunt **verschillende WhatsApp-DM's** naar verschillende agents routeren terwijl je op **één WhatsApp-account** blijft. Match op afzender in E.164-indeling (zoals `+15551234567`) met `peer.kind: "direct"`. Antwoorden komen nog steeds vanaf hetzelfde WhatsApp-nummer (geen afzenderidentiteit per agent).

<Note>
Directe chats vallen samen tot de **hoofdsessiesleutel** van de agent, dus echte isolatie vereist **één agent per persoon**.
</Note>

Voorbeeld:

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

Notities:

- Toegangscontrole voor DM's is **globaal per WhatsApp-account** (koppeling/allowlist), niet per agent.
- Voor gedeelde groepen bind je de groep aan één agent of gebruik je [Uitzendgroepen](/nl/channels/broadcast-groups).

## Routeringsregels (hoe berichten een agent kiezen)

Bindingen zijn **deterministisch** en **meest specifiek wint**:

<Steps>
  <Step title="peer-match">
    Exacte DM-/groep-/kanaal-id.
  </Step>
  <Step title="parentPeer-match">
    Thread-overerving.
  </Step>
  <Step title="guildId + rollen">
    Discord-rolroutering.
  </Step>
  <Step title="guildId">
    Discord.
  </Step>
  <Step title="teamId">
    Slack.
  </Step>
  <Step title="accountId-match voor een kanaal">
    Fallback per account.
  </Step>
  <Step title="Match op kanaalniveau">
    `accountId: "*"`.
  </Step>
  <Step title="Standaardagent">
    Fallback naar `agents.list[].default`, anders de eerste lijstvermelding, standaard: `main`.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Tie-breaking en AND-semantiek">
    - Als meerdere bindingen in dezelfde laag matchen, wint de eerste in configuratievolgorde.
    - Als een binding meerdere matchvelden instelt (bijvoorbeeld `peer` + `guildId`), zijn alle opgegeven velden vereist (`AND`-semantiek).

  </Accordion>
  <Accordion title="Details over accountscope">
    - Een binding die `accountId` weglaat, matcht alleen het standaardaccount.
    - Gebruik `accountId: "*"` voor een kanaalbrede fallback over alle accounts.
    - Als je later dezelfde binding voor dezelfde agent toevoegt met een expliciete account-id, upgradet OpenClaw de bestaande kanaal-only binding naar accountgebonden in plaats van deze te dupliceren.

  </Accordion>
</AccordionGroup>

## Meerdere accounts / telefoonnummers

Kanalen die **meerdere accounts** ondersteunen (bijv. WhatsApp) gebruiken `accountId` om elke login te identificeren. Elke `accountId` kan naar een andere agent worden gerouteerd, zodat één server meerdere telefoonnummers kan hosten zonder sessies te mengen.

Als je een kanaalbreed standaardaccount wilt wanneer `accountId` wordt weggelaten, stel dan `channels.<channel>.defaultAccount` in (optioneel). Wanneer dit niet is ingesteld, valt OpenClaw terug op `default` als die aanwezig is, anders op de eerste geconfigureerde account-id (gesorteerd).

Veelgebruikte kanalen die dit patroon ondersteunen zijn onder andere:

- `whatsapp`, `telegram`, `discord`, `slack`, `signal`, `imessage`
- `irc`, `line`, `googlechat`, `mattermost`, `matrix`, `nextcloud-talk`
- `bluebubbles`, `zalo`, `zalouser`, `nostr`, `feishu`

## Concepten

- `agentId`: één "brein" (werkruimte, auth per agent, sessieopslag per agent).
- `accountId`: één kanaalaccountinstantie (bijv. WhatsApp-account `"personal"` versus `"biz"`).
- `binding`: routeert binnenkomende berichten naar een `agentId` op basis van `(channel, accountId, peer)` en optioneel guild-/team-id's.
- Directe chats vallen samen tot `agent:<agentId>:<mainKey>` ("main" per agent; `session.mainKey`).

## Platformvoorbeelden

<AccordionGroup>
  <Accordion title="Discord-bots per agent">
    Elk Discord-botaccount wordt gekoppeld aan een unieke `accountId`. Bind elk account aan een agent en houd allowlists per bot bij.

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

    - Nodig elke bot uit voor de guild en schakel Message Content Intent in.
    - Tokens staan in `channels.discord.accounts.<id>.token` (het standaardaccount kan `DISCORD_BOT_TOKEN` gebruiken).

  </Accordion>
  <Accordion title="Telegram-bots per agent">
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

    - Maak één bot per agent met BotFather en kopieer elk token.
    - Tokens staan in `channels.telegram.accounts.<id>.botToken` (het standaardaccount kan `TELEGRAM_BOT_TOKEN` gebruiken).

  </Accordion>
  <Accordion title="WhatsApp-nummers per agent">
    Koppel elk account voordat je de gateway start:

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

## Veelvoorkomende patronen

<Tabs>
  <Tab title="WhatsApp dagelijks + Telegram diep werk">
    Splits op kanaal: routeer WhatsApp naar een snelle alledaagse agent en Telegram naar een Opus-agent.

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

    Notities:

    - Als je meerdere accounts voor een kanaal hebt, voeg dan `accountId` toe aan de binding (bijvoorbeeld `{ channel: "whatsapp", accountId: "personal" }`).
    - Om één DM/groep naar Opus te routeren terwijl de rest op chat blijft, voeg je een `match.peer`-binding toe voor die peer; peer-matches winnen altijd van kanaalbrede regels.

  </Tab>
  <Tab title="Zelfde kanaal, één peer naar Opus">
    Houd WhatsApp op de snelle agent, maar routeer één DM naar Opus:

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

    Peer-bindingen winnen altijd, dus zet ze boven de kanaalbrede regel.

  </Tab>
  <Tab title="Familie-agent gebonden aan een WhatsApp-groep">
    Bind een speciale familie-agent aan één WhatsApp-groep, met vermeldingstoegang en een strikter toolsbeleid:

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

    Notities:

    - Toestaan/weigeren-lijsten voor tools zijn **tools**, geen skills. Als een skill een binary moet uitvoeren, zorg er dan voor dat `exec` is toegestaan en dat de binary in de sandbox bestaat.
    - Stel voor strengere toegang `agents.list[].groupChat.mentionPatterns` in en houd groepsallowlists ingeschakeld voor het kanaal.

  </Tab>
</Tabs>

## Sandbox- en toolconfiguratie per agent

Elke agent kan zijn eigen sandbox en toolbeperkingen hebben:

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
`setupCommand` staat onder `sandbox.docker` en wordt één keer uitgevoerd bij het maken van de container. Per-agent-overschrijvingen voor `sandbox.docker.*` worden genegeerd wanneer de opgeloste scope `"shared"` is.
</Note>

**Voordelen:**

- **Beveiligingsisolatie**: beperk tools voor niet-vertrouwde agents.
- **Resourcebeheer**: plaats specifieke agents in een sandbox terwijl andere op de host blijven.
- **Flexibele beleidsregels**: verschillende machtigingen per agent.

<Note>
`tools.elevated` is **globaal** en gebaseerd op de afzender; het is niet per agent configureerbaar. Als je grenzen per agent nodig hebt, gebruik dan `agents.list[].tools` om `exec` te weigeren. Gebruik voor groepstargeting `agents.list[].groupChat.mentionPatterns` zodat @mentions netjes aan de bedoelde agent worden gekoppeld.
</Note>

Zie [Sandbox en tools voor meerdere agents](/nl/tools/multi-agent-sandbox-tools) voor gedetailleerde voorbeelden.

## Gerelateerd

- [ACP-agents](/nl/tools/acp-agents) — externe codeharnassen uitvoeren
- [Kanaalroutering](/nl/channels/channel-routing) — hoe berichten naar agents worden gerouteerd
- [Aanwezigheid](/nl/concepts/presence) — aanwezigheid en beschikbaarheid van agents
- [Sessie](/nl/concepts/session) — sessie-isolatie en routering
- [Sub-agents](/nl/tools/subagents) — achtergrondruns van agents starten
