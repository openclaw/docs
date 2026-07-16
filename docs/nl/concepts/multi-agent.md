---
read_when: You want multiple agents with separate workspaces, auth, and sessions in one Gateway process.
sidebarTitle: Multi-agent routing
status: active
summary: 'Multi-agentroutering: agentgrenzen, kanaalaccounts en koppelingen'
title: Multi-agentroutering
x-i18n:
    generated_at: "2026-07-16T15:31:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 265a1f3d9d9b4957c99c71f391ce4f5abba6b70561570f8bbe8cb9964ece1cfc
    source_path: concepts/multi-agent.md
    workflow: 16
---

Voer meerdere _geïsoleerde_ agents uit in één Gateway-proces, elk met een eigen werkruimte, statusmap (`agentDir`) en door SQLite ondersteunde sessiegeschiedenis, plus meerdere kanaalaccounts (bijvoorbeeld twee WhatsApp-nummers). Inkomende berichten worden via **bindingen** naar de juiste agent gerouteerd.

Een **agent** omvat de volledige context per persona: werkruimtebestanden, authenticatieprofielen, modelregister en sessieopslag. Een **binding** koppelt een kanaalaccount (een Slack-werkruimte, een WhatsApp-nummer enzovoort) aan een van deze agents.

## Wat is één agent

Elke agent heeft een eigen:

- **Werkruimte**: bestanden, `AGENTS.md`/`SOUL.md`/`USER.md`, lokale notities, personaregels.
- **Statusmap** (`agentDir`): authenticatieprofielen, modelregister, configuratie per agent.
- **Sessieopslag**: chatgeschiedenis en routeringsstatus in `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`.

Authenticatieprofielen zijn per agent en worden gelezen uit:

```text
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

<Note>
`sessions_history` is de veiligere manier om informatie tussen sessies op te halen: deze retourneert een begrensde, geredigeerde weergave en geen onbewerkte transcriptdump. De functie verwijdert handtekeningen van denkblokken, details van toolresultaatpayloads, `<relevant-memories>`-structuren, XML-tags voor toolaanroepen (`<tool_call>`, `<function_call>` en hun meervoudige/gedowngradede vormen) en XML voor MiniMax-toolaanroepen. Vervolgens wordt de uitvoer afgekapt en op bytegrootte begrensd.
</Note>

<Warning>
Gebruik `agentDir` nooit opnieuw voor verschillende agents — dit veroorzaakt botsingen tussen authenticatie- en sessiestatussen. Wanneer de lokale OAuth-referentie van een secundaire agent is verlopen of het vernieuwen ervan mislukt, leest OpenClaw de referentie van de standaard-/hoofdagent voor dezelfde profiel-id en neemt het de nieuwste token over, zonder de vernieuwingstoken naar de opslag van de secundaire agent te kopiëren. Meld je vanuit die agent aan als je een volledig onafhankelijk OAuth-account wilt. Als je referenties handmatig kopieert, kopieer dan alleen overdraagbare statische `api_key`- of `token`-profielen — OAuth-vernieuwingsmateriaal is standaard niet overdraagbaar (`copyToAgents` kan een profiel expliciet hiervoor inschakelen).
</Warning>

Skills worden geladen vanuit de werkruimte van elke agent en vanuit gedeelde hoofdmappen zoals `~/.openclaw/skills`, waarna ze worden gefilterd op basis van de effectieve allowlist voor agent-Skills. Gebruik `agents.defaults.skills` voor een gedeelde basis en `agents.list[].skills` voor een vervanging per agent (expliciete vermeldingen vervangen de standaard; ze worden niet samengevoegd). Zie [Skills: per agent versus gedeeld](/nl/tools/skills#per-agent-vs-shared-skills) en [Skills: allowlists voor agents](/nl/tools/skills#agent-allowlists).

Door een Plugin beheerde opslag volgt de configuratie van die Plugin; het toevoegen van een tweede agent
splitst niet automatisch elke globale Plugin-opslag. Configureer bijvoorbeeld
[Memory Wiki-kluizen per agent](/nl/concepts/multi-agent#per-agent-memory-wiki-vaults)
wanneer persona's geen gecompileerde wikikennis mogen delen.

<Note>
**Opmerking over de werkruimte:** de werkruimte van elke agent is de **standaard-cwd**, geen harde sandbox. Relatieve paden worden binnen de werkruimte opgelost, maar absolute paden kunnen andere locaties op de host bereiken, tenzij sandboxing is ingeschakeld. Zie [Sandboxing](/nl/gateway/sandboxing).
</Note>

## Paden

| Wat                              | Standaard                                                                              | Overschrijving                                                                            |
| -------------------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Configuratie                     | `~/.openclaw/openclaw.json`                                                            | `OPENCLAW_CONFIG_PATH`                                                                   |
| Statusmap                        | `~/.openclaw`                                                                          | `OPENCLAW_STATE_DIR`                                                                     |
| Werkruimte van standaardagent    | `~/.openclaw/workspace` (of `workspace-<profile>` wanneer `OPENCLAW_PROFILE` is ingesteld)      | `agents.list[].workspace`, daarna `agents.defaults.workspace`, of `OPENCLAW_WORKSPACE_DIR` |
| Werkruimte van andere agents     | `<stateDir>/workspace-<agentId>` (of `<agents.defaults.workspace>/<agentId>` wanneer ingesteld) | `agents.list[].workspace`                                                                |
| Agentmap                         | `~/.openclaw/agents/<agentId>/agent`                                                   | `agents.list[].agentDir`                                                                 |
| Sessies en transcripten          | `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`                             | —                                                                                        |
| Verouderde/gearchiveerde sessieartefacten | `~/.openclaw/agents/<agentId>/sessions`                                                | —                                                                                        |

### Modus met één agent (standaard)

Als je niets configureert, voert OpenClaw één agent uit:

- `agentId` is standaard `main`.
- Sessies gebruiken `agent:main:<mainKey>` als sleutel (standaard is `mainKey` gelijk aan `main`).
- De werkruimte is standaard `~/.openclaw/workspace` (of `workspace-<profile>` wanneer `OPENCLAW_PROFILE` is ingesteld op iets anders dan `default`).
- De status is standaard `~/.openclaw/agents/main/agent`.

## Agenthelper

Voeg een nieuwe geïsoleerde agent toe:

```bash
openclaw agents add work
```

Vlaggen: `--workspace <dir>`, `--model <id>`, `--agent-dir <dir>`, `--bind <channel[:accountId]>` (herhaalbaar), `--non-interactive` (vereist `--workspace`).

Voeg `bindings` toe om inkomende berichten te routeren (de wizard biedt aan dit voor je te doen) en verifieer vervolgens:

```bash
openclaw agents list --bindings
```

## Snel aan de slag

<Steps>
  <Step title="Maak de werkruimte van elke agent">
    ```bash
    openclaw agents add coding
    openclaw agents add social
    ```

    Elke agent krijgt een eigen werkruimte met `SOUL.md`, `AGENTS.md` en optioneel `USER.md`, plus een toegewezen `agentDir` en sessieopslag onder `~/.openclaw/agents/<agentId>`.

  </Step>
  <Step title="Maak kanaalaccounts">
    Maak één account per agent op de kanalen van je voorkeur:

    - Discord: één bot per agent, schakel Message Content Intent in en kopieer elke token.
    - Telegram: één bot per agent via BotFather; kopieer elke token.
    - WhatsApp: koppel elk telefoonnummer per account.

    ```bash
    openclaw channels login --channel whatsapp --account work
    ```

    Zie de kanaalhandleidingen: [Discord](/nl/channels/discord), [Telegram](/nl/channels/telegram), [WhatsApp](/nl/channels/whatsapp).

  </Step>
  <Step title="Voeg agents, accounts en bindingen toe">
    Voeg agents toe onder `agents.list`, kanaalaccounts onder `channels.<channel>.accounts` en verbind ze met `bindings` (zie de voorbeelden hieronder).
  </Step>
  <Step title="Herstart en verifieer">
    ```bash
    openclaw gateway restart
    openclaw agents list --bindings
    openclaw channels status --probe
    ```
  </Step>
</Steps>

## Meerdere agents, meerdere persona's

Elke geconfigureerde `agentId` vormt een afzonderlijke personagrens voor de kernstatus van de agent:

- Verschillende accounts per kanaal (per `accountId`).
- Verschillende persoonlijkheden (`AGENTS.md`/`SOUL.md` per agent).
- Afzonderlijke authenticatie en sessies, waarbij toegang tussen agents alleen via expliciete functies of Plugin-configuratie wordt ingeschakeld.

Zo kunnen meerdere personen één Gateway delen terwijl de kernstatus van elke agent gescheiden blijft.

## Memory Wiki-kluizen per agent

Memory Wiki gebruikt standaard één globale kluis. Om de
gecompileerde kennis van een supportagent gescheiden te houden van die van een marketingagent, stel je
`plugins.entries.memory-wiki.config.vault.scope` in op `agent`:

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

Het geconfigureerde pad is de bovenliggende map. OpenClaw voegt de genormaliseerde
agent-id toe, wat paden oplevert zoals `~/.openclaw/wiki/support` en
`~/.openclaw/wiki/marketing`. CLI- en Gateway-bewerkingen met agentbereik vereisen
een expliciete agent wanneer meerdere agents zijn geconfigureerd. Zie
[Memory Wiki-kluizen per agent](/nl/plugins/memory-wiki#per-agent-vaults) voor details over bridge-
filtering, migratie en vertrouwensgrenzen.

## QMD-geheugenzoekopdrachten tussen agents

Voeg extra verzamelingen toe onder `agents.list[].memorySearch.qmd.extraCollections` om één agent in de QMD-sessietranscripten van een andere agent te laten zoeken. Gebruik `agents.defaults.memorySearch.qmd.extraCollections` wanneer elke agent dezelfde verzamelingen moet delen.

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
            extraCollections: [{ path: "notes" }], // wordt binnen de werkruimte opgelost -> verzameling met de naam "notes-main"
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

Een pad van een extra verzameling kan tussen agents worden gedeeld, maar de `name` ervan blijft expliciet wanneer het pad buiten de werkruimte van de agent ligt. Paden binnen de werkruimte blijven agentgebonden, zodat elke agent een eigen set voor het doorzoeken van transcripten behoudt.

## Eén WhatsApp-nummer, meerdere personen (DM-splitsing)

Routeer verschillende WhatsApp-DM's naar verschillende agents op **één** WhatsApp-account door de E.164 van de afzender (`+15551234567`) te vergelijken met `peer.kind: "direct"`. Antwoorden worden nog steeds vanaf hetzelfde WhatsApp-nummer verzonden — er is geen afzonderlijke afzenderidentiteit per agent.

<Note>
Directe chats worden standaard samengevoegd onder de hoofdsessiesleutel van de agent, dus echte isolatie vereist één agent per persoon.
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

Toegangsbeheer voor DM's (koppeling/allowlist) is globaal per WhatsApp-account, niet per agent. Koppel gedeelde groepen aan één agent of gebruik [Broadcastgroepen](/nl/channels/broadcast-groups).

## Routeringsregels

Bindingen zijn deterministisch en de meest specifieke wint. Zie [Kanaalroutering](/nl/channels/channel-routing#routing-rules-how-an-agent-is-chosen) voor de volledige niveauvolgorde (exacte peer, bovenliggende peer, peer-wildcard, guild+rollen, guild, team, account, kanaal, standaardagent). Enkele regels die hier het vermelden waard zijn:

- Als meerdere bindingen binnen hetzelfde niveau overeenkomen, wint de eerste in de configuratievolgorde.
- Als een binding meerdere overeenkomende velden instelt (bijvoorbeeld `peer` + `guildId`), moeten alle opgegeven velden overeenkomen (`AND`-semantiek).
- Een binding zonder `accountId` komt alleen overeen met het standaardaccount, niet met elk account. Gebruik `accountId: "*"` voor een kanaalbrede terugvaloptie of `accountId: "<name>"` voor één account. Als dezelfde binding opnieuw wordt toegevoegd met een expliciete account-id, wordt de bestaande binding met alleen een kanaal bijgewerkt in plaats van gedupliceerd.

## Meerdere accounts/telefoonnummers

Kanalen die meerdere accounts ondersteunen (bijvoorbeeld WhatsApp), gebruiken `accountId` om elke aanmelding te identificeren. Elke `accountId` wordt naar een eigen agent gerouteerd, zodat één server meerdere telefoonnummers kan hosten zonder sessies te vermengen.

Stel `channels.<channel>.defaultAccount` in om het account te kiezen dat wordt gebruikt wanneer `accountId` is weggelaten. Wanneer dit niet is ingesteld, valt OpenClaw terug op `default` indien aanwezig, en anders op de eerste geconfigureerde account-id (gesorteerd).

Kanalen die meerdere accounts ondersteunen: `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `mattermost`, `matrix`, `nextcloud-talk`, `nostr`, `signal`, `slack`, `telegram`, `whatsapp`, `zalo`, `zalouser`.

## Concepten

- `agentId`: één ‘brein’ (werkruimte, authenticatie per agent, sessieopslag per agent).
- `accountId`: één instantie van een kanaalaccount (bijv. WhatsApp-account `personal` tegenover `biz`).
- `binding`: routeert inkomende berichten naar een `agentId` op basis van `(channel, accountId, peer)`, en optioneel guild-/team-id's.
- Directe chats worden samengevoegd tot `agent:<agentId>:<mainKey>` (‘main’ per agent; zie `session.mainKey`).

## Platformvoorbeelden

<AccordionGroup>
  <Accordion title="Discord-bots per agent">
    Elk Discord-botaccount wordt gekoppeld aan een unieke `accountId`. Koppel elk account aan een agent en houd per bot een toelatingslijst bij.

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

    - Maak met BotFather één bot per agent en kopieer elk token.
    - Tokens staan in `channels.telegram.accounts.<id>.botToken` (het standaardaccount kan `TELEGRAM_BOT_TOKEN` gebruiken).
    - Nodig voor meerdere bots in dezelfde Telegram-groep elke bot uit en vermeld de bot die moet antwoorden.
    - Schakel voor elke groepsbot de Privacy Mode van BotFather uit (`/setprivacy` -> Disable) en verwijder de bot en voeg deze opnieuw toe, zodat Telegram de instelling toepast.
    - Sta groepen toe met `channels.telegram.groups`, of gebruik `groupPolicy: "open"` alleen voor vertrouwde groepsimplementaties.
    - Plaats gebruikers-id's van afzenders in `groupAllowFrom`. Groeps- en supergroep-id's horen in `channels.telegram.groups`, niet in `groupAllowFrom`.
    - Koppel op basis van `accountId`, zodat elke bot naar zijn eigen agent routeert.

  </Accordion>
  <Accordion title="WhatsApp-nummers per agent">
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

      // Deterministische routering: de eerste overeenkomst wint (meest specifieke eerst).
      bindings: [
        { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
        { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },

        // Optionele overschrijving per peer (voorbeeld: stuur een specifieke groep naar de werkagent).
        {
          agentId: "work",
          match: {
            channel: "whatsapp",
            accountId: "personal",
            peer: { kind: "group", id: "1203630...@g.us" },
          },
        },
      ],

      // Standaard uitgeschakeld: berichten tussen agents moeten expliciet worden ingeschakeld en op de toelatingslijst staan.
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
              // Optionele overschrijving. Standaard: ~/.openclaw/credentials/whatsapp/personal
              // authDir: "~/.openclaw/credentials/whatsapp/personal",
            },
            biz: {
              // Optionele overschrijving. Standaard: ~/.openclaw/credentials/whatsapp/biz
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
  <Tab title="WhatsApp voor dagelijks gebruik + Telegram voor diepgaand werk">
    Splits per kanaal: routeer WhatsApp naar een snelle agent voor dagelijks gebruik en Telegram naar een Opus-agent.

    ```json5
    {
      agents: {
        list: [
          {
            id: "chat",
            name: "Dagelijks",
            workspace: "~/.openclaw/workspace-chat",
            model: "anthropic/claude-sonnet-4-6",
          },
          {
            id: "opus",
            name: "Diepgaand werk",
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

    Deze voorbeelden gebruiken `accountId: "*"`, zodat de bindingen blijven werken als je later accounts toevoegt. Om één privébericht/groep naar Opus te routeren en de rest op chat te houden, voeg je een `match.peer`-binding voor die peer toe — overeenkomsten met peers hebben altijd voorrang op kanaalbrede regels.

  </Tab>
  <Tab title="Hetzelfde kanaal, één peer naar Opus">
    Houd WhatsApp op de snelle agent, maar routeer één privébericht naar Opus:

    ```json5
    {
      agents: {
        list: [
          {
            id: "chat",
            name: "Dagelijks",
            workspace: "~/.openclaw/workspace-chat",
            model: "anthropic/claude-sonnet-4-6",
          },
          {
            id: "opus",
            name: "Diepgaand werk",
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

    Peerbindingen hebben altijd voorrang, dus plaats ze boven de kanaalbrede regel.

  </Tab>
  <Tab title="Gezinsagent gekoppeld aan een WhatsApp-groep">
    Koppel een speciale gezinsagent aan één WhatsApp-groep, met vermelding als voorwaarde en een strenger toolbeleid:

    ```json5
    {
      agents: {
        list: [
          {
            id: "family",
            name: "Gezin",
            workspace: "~/.openclaw/workspace-family",
            identity: { name: "Gezinsbot" },
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

    Lijsten met toegestane/geweigerde tools bevatten **tools**, geen Skills. Als een skill een binair bestand moet uitvoeren, zorg je ervoor dat `exec` is toegestaan en dat het binaire bestand in de sandbox aanwezig is. Voor strengere toegangscontrole stel je `agents.list[].groupChat.mentionPatterns` in en houd je de groepslijsten met toegestane afzenders ingeschakeld voor het kanaal.

  </Tab>
</Tabs>

## Sandbox- en toolconfiguratie per agent

Elke agent kan eigen sandbox- en toolbeperkingen hebben:

```js
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: {
          mode: "off",  // Geen sandbox voor persoonlijke agent
        },
        // Geen toolbeperkingen - alle tools beschikbaar
      },
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: {
          mode: "all",     // Altijd in een sandbox
          scope: "agent",  // Eén container per agent
          docker: {
            // Optionele eenmalige installatie na het maken van de container
            setupCommand: "apt-get update && apt-get install -y git curl",
          },
        },
        tools: {
          allow: ["read"],                    // Alleen de tool read
          deny: ["exec", "write", "edit", "apply_patch"],    // Andere weigeren
        },
      },
    ],
  },
}
```

<Note>
`setupCommand` bevindt zich onder `sandbox.docker` en wordt eenmaal uitgevoerd wanneer de container wordt gemaakt. `sandbox.docker.*`-overschrijvingen per agent worden genegeerd wanneer het vastgestelde bereik `"shared"` is.
</Note>

Dit biedt:

- **Beveiligingsisolatie**: beperk tools voor niet-vertrouwde agents.
- **Resourcebeheer**: plaats specifieke agents in een sandbox terwijl andere op de host blijven.
- **Flexibel beleid**: verschillende machtigingen per agent.

<Note>
`tools.elevated` heeft zowel een globale toegangspoort (`tools.elevated.enabled`/`allowFrom`) als een toegangspoort per agent (`agents.list[].tools.elevated.enabled`/`allowFrom`). De toegangspoort per agent kan de globale toegangspoort alleen verder beperken — beide moeten een afzender toestaan om opdrachten met verhoogde bevoegdheden uit te voeren. Gebruik voor groepstargeting `agents.list[].groupChat.mentionPatterns`, zodat @vermeldingen correct aan de bedoelde agent worden gekoppeld.
</Note>

Zie [Sandbox en tools voor meerdere agents](/nl/tools/multi-agent-sandbox-tools) voor gedetailleerde voorbeelden.

## Gerelateerd

- [ACP-agents](/nl/tools/acp-agents) — externe codeharnassen uitvoeren
- [Kanaalroutering](/nl/channels/channel-routing) — hoe berichten naar agents worden gerouteerd
- [Aanwezigheid](/nl/concepts/presence) — aanwezigheid en beschikbaarheid van agents
- [Sessie](/nl/concepts/session) — sessie-isolatie en routering
- [Subagents](/nl/tools/subagents) — agentruns op de achtergrond starten
