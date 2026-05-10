---
read_when: You want multiple isolated agents (workspaces + auth) in one gateway process.
sidebarTitle: Multi-agent routing
status: active
summary: 'Routering voor meerdere agents: geïsoleerde agents, kanaalaccounts en bindingen'
title: Routering voor meerdere agents
x-i18n:
    generated_at: "2026-05-10T19:32:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7fd194cbe0938cc6ef6dd9b9803d2b1fe6f3e0777f4df7c407c692fd9f743c59
    source_path: concepts/multi-agent.md
    workflow: 16
---

Voer meerdere _geïsoleerde_ agents uit — elk met een eigen werkruimte, statusmap (`agentDir`) en sessiegeschiedenis — plus meerdere kanaalaccounts (bijv. twee WhatsApps) in één draaiende Gateway. Inkomende berichten worden via bindings naar de juiste agent gerouteerd.

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
`sessions_history` is hier ook het veiligere pad voor herinnering tussen sessies: het retourneert een begrensde, opgeschoonde weergave, geen ruwe transcriptdump. Assistant-herinnering verwijdert denktags, `<relevant-memories>`-scaffolding, plattetekst-XML-payloads voor tool-aanroepen (inclusief `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` en afgekorte tool-aanroepblokken), gedegradeerde tool-aanroep-scaffolding, gelekte ASCII-/full-width-modelbesturingstokens en misvormde MiniMax-tool-aanroep-XML vóór redactie/afkapping.
</Note>

<Warning>
Hergebruik `agentDir` nooit tussen agents (dat veroorzaakt botsingen tussen auth en sessies). Agents
kunnen doorlezen naar de auth-profielen van de standaard-/hoofdagent wanneer ze geen
lokaal profiel hebben, maar OpenClaw kloont OAuth-vernieuwingstokens niet naar de
opslag van de secundaire agent. Als je een onafhankelijk OAuth-account wilt, meld je dan aan vanuit
die agent; als je referenties handmatig kopieert, kopieer dan alleen draagbare statische
`api_key`- of `token`-profielen.
</Warning>

Skills worden geladen vanuit elke agentwerkruimte plus gedeelde roots zoals `~/.openclaw/skills`, en daarna gefilterd op de effectieve allowlist voor agentskills wanneer die is geconfigureerd. Gebruik `agents.defaults.skills` voor een gedeelde basislijn en `agents.list[].skills` voor vervanging per agent. Zie [Skills: per-agent vs gedeeld](/nl/tools/skills#per-agent-vs-shared-skills) en [Skills: allowlists voor agentskills](/nl/tools/skills#agent-skill-allowlists).

De Gateway kan **één agent** (standaard) of **veel agents** naast elkaar hosten.

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

Als je niets doet, voert OpenClaw één agent uit:

- `agentId` staat standaard op **`main`**.
- Sessies worden gesleuteld als `agent:main:<mainKey>`.
- Werkruimte staat standaard op `~/.openclaw/workspace` (of `~/.openclaw/workspace-<profile>` wanneer `OPENCLAW_PROFILE` is ingesteld).
- Status staat standaard op `~/.openclaw/agents/main/agent`.

## Agent-helper

Gebruik de agent-wizard om een nieuwe geïsoleerde agent toe te voegen:

```bash
openclaw agents add work
```

Voeg daarna `bindings` toe (of laat de wizard dat doen) om inkomende berichten te routeren.

Verifieer met:

```bash
openclaw agents list --bindings
```

## Snelle start

<Steps>
  <Step title="Maak elke agentwerkruimte aan">
    Gebruik de wizard of maak werkruimten handmatig aan:

    ```bash
    openclaw agents add coding
    openclaw agents add social
    ```

    Elke agent krijgt een eigen werkruimte met `SOUL.md`, `AGENTS.md` en optioneel `USER.md`, plus een toegewezen `agentDir` en sessieopslag onder `~/.openclaw/agents/<agentId>`.

  </Step>
  <Step title="Maak kanaalaccounts aan">
    Maak één account per agent aan op je voorkeurskanalen:

    - Discord: één bot per agent, schakel Message Content Intent in, kopieer elk token.
    - Telegram: één bot per agent via BotFather, kopieer elk token.
    - WhatsApp: koppel elk telefoonnummer per account.

    ```bash
    openclaw channels login --channel whatsapp --account work
    ```

    Zie kanaalgidsen: [Discord](/nl/channels/discord), [Telegram](/nl/channels/telegram), [WhatsApp](/nl/channels/whatsapp).

  </Step>
  <Step title="Voeg agents, accounts en bindings toe">
    Voeg agents toe onder `agents.list`, kanaalaccounts onder `channels.<channel>.accounts`, en verbind ze met `bindings` (voorbeelden hieronder).
  </Step>
  <Step title="Herstart en verifieer">
    ```bash
    openclaw gateway restart
    openclaw agents list --bindings
    openclaw channels status --probe
    ```
  </Step>
</Steps>

## Meerdere agents = meerdere mensen, meerdere persoonlijkheden

Met **meerdere agents** wordt elke `agentId` een **volledig geïsoleerde persona**:

- **Andere telefoonnummers/accounts** (per kanaal `accountId`).
- **Andere persoonlijkheden** (werkruimtebestanden per agent zoals `AGENTS.md` en `SOUL.md`).
- **Gescheiden auth + sessies** (geen kruisverkeer tenzij expliciet ingeschakeld).

Hiermee kunnen **meerdere mensen** één Gateway-server delen terwijl hun AI-"breinen" en gegevens geïsoleerd blijven.

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

Het pad naar de extra collectie kan tussen agents worden gedeeld, maar de collectienaam blijft expliciet wanneer het pad buiten de agentwerkruimte ligt. Paden binnen de werkruimte blijven agent-scoped, zodat elke agent zijn eigen set voor transcriptzoekopdrachten behoudt.

## Eén WhatsApp-nummer, meerdere mensen (DM-splitsing)

Je kunt **verschillende WhatsApp-DM's** naar verschillende agents routeren terwijl je op **één WhatsApp-account** blijft. Match op E.164 van de afzender (zoals `+15551234567`) met `peer.kind: "direct"`. Antwoorden komen nog steeds vanaf hetzelfde WhatsApp-nummer (geen afzenderidentiteit per agent).

<Note>
Directe chats vallen terug op de **hoofdsessiesleutel** van de agent, dus echte isolatie vereist **één agent per persoon**.
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

- DM-toegangscontrole is **globaal per WhatsApp-account** (koppeling/allowlist), niet per agent.
- Voor gedeelde groepen bind je de groep aan één agent of gebruik je [Broadcast-groepen](/nl/channels/broadcast-groups).

## Routeringsregels (hoe berichten een agent kiezen)

Bindings zijn **deterministisch** en **meest specifiek wint**:

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
    Fallback naar `agents.list[].default`, anders het eerste lijstitem, standaard: `main`.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Tie-breaking en AND-semantiek">
    - Als meerdere bindings in dezelfde laag matchen, wint de eerste in configuratievolgorde.
    - Als een binding meerdere matchvelden instelt (bijvoorbeeld `peer` + `guildId`), zijn alle opgegeven velden vereist (`AND`-semantiek).

  </Accordion>
  <Accordion title="Detail van accountscope">
    - Een binding die `accountId` weglaat, matcht alleen het standaardaccount.
    - Gebruik `accountId: "*"` voor een kanaalbrede fallback over alle accounts.
    - Als je later dezelfde binding voor dezelfde agent toevoegt met een expliciete account-id, werkt OpenClaw de bestaande kanaal-only binding bij naar account-scoped in plaats van deze te dupliceren.

  </Accordion>
</AccordionGroup>

## Meerdere accounts / telefoonnummers

Kanalen die **meerdere accounts** ondersteunen (bijv. WhatsApp) gebruiken `accountId` om elke login te identificeren. Elke `accountId` kan naar een andere agent worden gerouteerd, zodat één server meerdere telefoonnummers kan hosten zonder sessies te mengen.

Als je een kanaalbreed standaardaccount wilt wanneer `accountId` wordt weggelaten, stel dan `channels.<channel>.defaultAccount` in (optioneel). Wanneer dit niet is ingesteld, valt OpenClaw terug op `default` als dat aanwezig is, anders op de eerste geconfigureerde account-id (gesorteerd).

Veelvoorkomende kanalen die dit patroon ondersteunen zijn:

- `whatsapp`, `telegram`, `discord`, `slack`, `signal`, `imessage`
- `irc`, `line`, `googlechat`, `mattermost`, `matrix`, `nextcloud-talk`
- `zalo`, `zalouser`, `nostr`, `feishu`

## Concepten

- `agentId`: één "brein" (werkruimte, auth per agent, sessieopslag per agent).
- `accountId`: één kanaalaccountinstantie (bijv. WhatsApp-account `"personal"` versus `"biz"`).
- `binding`: routeert inkomende berichten naar een `agentId` via `(channel, accountId, peer)` en optioneel guild-/team-id's.
- Directe chats vallen terug op `agent:<agentId>:<mainKey>` ("main" per agent; `session.mainKey`).

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
    - Tokens staan in `channels.discord.accounts.<id>.token` (standaardaccount kan `DISCORD_BOT_TOKEN` gebruiken).

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

    - Maak één bot per agent met BotFather en kopieer elke token.
    - Tokens staan in `channels.telegram.accounts.<id>.botToken` (standaardaccount kan `TELEGRAM_BOT_TOKEN` gebruiken).

  </Accordion>
  <Accordion title="WhatsApp numbers per agent">
    Koppel elk account voordat je de Gateway start:

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
  <Tab title="WhatsApp daily + Telegram deep work">
    Splits op kanaal: routeer WhatsApp naar een snelle dagelijkse agent en Telegram naar een Opus-agent.

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

    Opmerkingen:

    - Als je meerdere accounts voor een kanaal hebt, voeg dan `accountId` toe aan de binding (bijvoorbeeld `{ channel: "whatsapp", accountId: "personal" }`).
    - Om één DM/groep naar Opus te routeren terwijl de rest op chat blijft, voeg je een `match.peer`-binding toe voor die peer; peer-matches winnen altijd van kanaalbrede regels.

  </Tab>
  <Tab title="Same channel, one peer to Opus">
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

    Peer-bindingen winnen altijd, dus houd ze boven de kanaalbrede regel.

  </Tab>
  <Tab title="Family agent bound to a WhatsApp group">
    Bind een speciale familie-agent aan één WhatsApp-groep, met vermeldingsgating en een strikter toolbeleid:

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

    Opmerkingen:

    - Tool-allow/deny-lijsten zijn **tools**, geen skills. Als een skill een binary moet uitvoeren, zorg er dan voor dat `exec` is toegestaan en dat de binary in de sandbox bestaat.
    - Stel voor strengere gating `agents.list[].groupChat.mentionPatterns` in en houd groeps-allowlists ingeschakeld voor het kanaal.

  </Tab>
</Tabs>

## Sandbox- en toolconfiguratie per agent

Elke agent kan zijn eigen sandbox- en toolbeperkingen hebben:

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
`setupCommand` staat onder `sandbox.docker` en wordt één keer uitgevoerd wanneer de container wordt aangemaakt. Overrides voor `sandbox.docker.*` per agent worden genegeerd wanneer de opgeloste scope `"shared"` is.
</Note>

**Voordelen:**

- **Beveiligingsisolatie**: beperk tools voor niet-vertrouwde agents.
- **Resourcebeheer**: plaats specifieke agents in een sandbox terwijl andere op de host blijven.
- **Flexibel beleid**: verschillende rechten per agent.

<Note>
`tools.elevated` is **globaal** en gebaseerd op afzender; het is niet per agent configureerbaar. Als je grenzen per agent nodig hebt, gebruik dan `agents.list[].tools` om `exec` te weigeren. Gebruik voor groepstargeting `agents.list[].groupChat.mentionPatterns` zodat @vermeldingen netjes aan de bedoelde agent worden gekoppeld.
</Note>

Zie [Multi-agent sandbox and tools](/nl/tools/multi-agent-sandbox-tools) voor gedetailleerde voorbeelden.

## Gerelateerd

- [ACP-agents](/nl/tools/acp-agents) — externe coding-harnassen uitvoeren
- [Kanaalroutering](/nl/channels/channel-routing) — hoe berichten naar agents worden gerouteerd
- [Aanwezigheid](/nl/concepts/presence) — aanwezigheid en beschikbaarheid van agents
- [Sessie](/nl/concepts/session) — sessie-isolatie en routering
- [Sub-agents](/nl/tools/subagents) — agent-runs op de achtergrond starten
