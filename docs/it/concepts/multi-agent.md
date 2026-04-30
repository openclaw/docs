---
read_when: You want multiple isolated agents (workspaces + auth) in one gateway process.
sidebarTitle: Multi-agent routing
status: active
summary: 'Routing multi-agente: agenti isolati, account di canale e associazioni'
title: Instradamento multi-agente
x-i18n:
    generated_at: "2026-04-30T08:47:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 67adea74d5f97feff3f816cc4c34c9429e7659289013e5a7c7623bd185a50a31
    source_path: concepts/multi-agent.md
    workflow: 16
---

Esegui più agenti _isolati_, ciascuno con la propria area di lavoro, directory di stato (`agentDir`) e cronologia di sessione, più account multipli di canale (ad esempio due WhatsApp) in un unico Gateway in esecuzione. I messaggi in ingresso vengono instradati all'agente corretto tramite associazioni.

Un **agente** qui è l'intero ambito per persona: file dell'area di lavoro, profili di autenticazione, registro dei modelli e archivio delle sessioni. `agentDir` è la directory di stato su disco che contiene questa configurazione per agente in `~/.openclaw/agents/<agentId>/`. Una **associazione** mappa un account di canale (ad esempio un'area di lavoro Slack o un numero WhatsApp) a uno di questi agenti.

## Che cos'è "un agente"?

Un **agente** è un cervello completamente delimitato con i propri:

- **Area di lavoro** (file, AGENTS.md/SOUL.md/USER.md, note locali, regole della persona).
- **Directory di stato** (`agentDir`) per profili di autenticazione, registro dei modelli e configurazione per agente.
- **Archivio delle sessioni** (cronologia chat + stato di instradamento) sotto `~/.openclaw/agents/<agentId>/sessions`.

I profili di autenticazione sono **per agente**. Ogni agente legge dal proprio:

```text
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

<Note>
`sessions_history` è anche qui il percorso più sicuro per il richiamo tra sessioni: restituisce una vista limitata e sanificata, non un dump grezzo della trascrizione. Il richiamo dell'assistente rimuove i tag di ragionamento, l'impalcatura `<relevant-memories>`, i payload XML in testo semplice delle chiamate agli strumenti (inclusi `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` e blocchi troncati di chiamate agli strumenti), l'impalcatura declassata delle chiamate agli strumenti, i token di controllo del modello ASCII/a larghezza piena trapelati e XML MiniMax malformato per chiamate agli strumenti prima di redazione/troncamento.
</Note>

<Warning>
Non riutilizzare mai `agentDir` tra agenti (causa collisioni di autenticazione/sessione). Gli agenti possono leggere i profili di autenticazione dell'agente predefinito/principale quando non hanno un profilo locale, ma OpenClaw non clona i token di aggiornamento OAuth nell'archivio dell'agente secondario. Se vuoi un account OAuth indipendente, accedi da quell'agente; se copi credenziali manualmente, copia solo profili statici portabili `api_key` o `token`.
</Warning>

Le Skills vengono caricate dall'area di lavoro di ogni agente più radici condivise come `~/.openclaw/skills`, poi filtrate dalla allowlist effettiva delle Skills dell'agente quando configurata. Usa `agents.defaults.skills` per una base condivisa e `agents.list[].skills` per la sostituzione per agente. Vedi [Skills: per agente vs condivise](/it/tools/skills#per-agent-vs-shared-skills) e [Skills: allowlist delle Skills degli agenti](/it/tools/skills#agent-skill-allowlists).

Il Gateway può ospitare **un agente** (predefinito) o **molti agenti** affiancati.

<Note>
**Nota sull'area di lavoro:** l'area di lavoro di ogni agente è la **cwd predefinita**, non una sandbox rigida. I percorsi relativi vengono risolti all'interno dell'area di lavoro, ma i percorsi assoluti possono raggiungere altre posizioni dell'host a meno che il sandboxing non sia abilitato. Vedi [Sandboxing](/it/gateway/sandboxing).
</Note>

## Percorsi (mappa rapida)

- Configurazione: `~/.openclaw/openclaw.json` (o `OPENCLAW_CONFIG_PATH`)
- Directory di stato: `~/.openclaw` (o `OPENCLAW_STATE_DIR`)
- Area di lavoro: `~/.openclaw/workspace` (o `~/.openclaw/workspace-<agentId>`)
- Directory agente: `~/.openclaw/agents/<agentId>/agent` (o `agents.list[].agentDir`)
- Sessioni: `~/.openclaw/agents/<agentId>/sessions`

### Modalità agente singolo (predefinita)

Se non fai nulla, OpenClaw esegue un singolo agente:

- `agentId` è predefinito su **`main`**.
- Le sessioni sono indicizzate come `agent:main:<mainKey>`.
- L'area di lavoro è predefinita su `~/.openclaw/workspace` (o `~/.openclaw/workspace-<profile>` quando `OPENCLAW_PROFILE` è impostato).
- Lo stato è predefinito su `~/.openclaw/agents/main/agent`.

## Helper agente

Usa la procedura guidata dell'agente per aggiungere un nuovo agente isolato:

```bash
openclaw agents add work
```

Poi aggiungi `bindings` (o lascia che lo faccia la procedura guidata) per instradare i messaggi in ingresso.

Verifica con:

```bash
openclaw agents list --bindings
```

## Avvio rapido

<Steps>
  <Step title="Crea l'area di lavoro di ogni agente">
    Usa la procedura guidata o crea le aree di lavoro manualmente:

    ```bash
    openclaw agents add coding
    openclaw agents add social
    ```

    Ogni agente ottiene la propria area di lavoro con `SOUL.md`, `AGENTS.md` e `USER.md` opzionale, più un `agentDir` dedicato e un archivio delle sessioni sotto `~/.openclaw/agents/<agentId>`.

  </Step>
  <Step title="Crea account di canale">
    Crea un account per agente sui tuoi canali preferiti:

    - Discord: un bot per agente, abilita Message Content Intent, copia ogni token.
    - Telegram: un bot per agente tramite BotFather, copia ogni token.
    - WhatsApp: collega ogni numero di telefono per account.

    ```bash
    openclaw channels login --channel whatsapp --account work
    ```

    Vedi le guide dei canali: [Discord](/it/channels/discord), [Telegram](/it/channels/telegram), [WhatsApp](/it/channels/whatsapp).

  </Step>
  <Step title="Aggiungi agenti, account e associazioni">
    Aggiungi gli agenti sotto `agents.list`, gli account di canale sotto `channels.<channel>.accounts` e collegali con `bindings` (esempi sotto).
  </Step>
  <Step title="Riavvia e verifica">
    ```bash
    openclaw gateway restart
    openclaw agents list --bindings
    openclaw channels status --probe
    ```
  </Step>
</Steps>

## Più agenti = più persone, più personalità

Con **più agenti**, ogni `agentId` diventa una **persona completamente isolata**:

- **Numeri di telefono/account diversi** (per canale `accountId`).
- **Personalità diverse** (file dell'area di lavoro per agente come `AGENTS.md` e `SOUL.md`).
- **Autenticazione + sessioni separate** (nessuna comunicazione incrociata a meno che non sia abilitata esplicitamente).

Questo consente a **più persone** di condividere un server Gateway mantenendo isolati i propri "cervelli" IA e dati.

## Ricerca memoria QMD tra agenti

Se un agente deve cercare nelle trascrizioni di sessione QMD di un altro agente, aggiungi raccolte extra sotto `agents.list[].memorySearch.qmd.extraCollections`. Usa `agents.defaults.memorySearch.qmd.extraCollections` solo quando ogni agente deve ereditare le stesse raccolte di trascrizioni condivise.

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

Il percorso della raccolta extra può essere condiviso tra agenti, ma il nome della raccolta resta esplicito quando il percorso è fuori dall'area di lavoro dell'agente. I percorsi dentro l'area di lavoro restano limitati all'agente, così ogni agente conserva il proprio set di ricerca delle trascrizioni.

## Un numero WhatsApp, più persone (divisione dei DM)

Puoi instradare **DM WhatsApp diversi** ad agenti diversi restando su **un solo account WhatsApp**. Abbina in base al mittente E.164 (come `+15551234567`) con `peer.kind: "direct"`. Le risposte provengono comunque dallo stesso numero WhatsApp (nessuna identità mittente per agente).

<Note>
Le chat dirette collassano sulla **chiave di sessione principale** dell'agente, quindi il vero isolamento richiede **un agente per persona**.
</Note>

Esempio:

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

Note:

- Il controllo di accesso ai DM è **globale per account WhatsApp** (abbinamento/allowlist), non per agente.
- Per i gruppi condivisi, associa il gruppo a un agente o usa [Gruppi broadcast](/it/channels/broadcast-groups).

## Regole di instradamento (come i messaggi scelgono un agente)

Le associazioni sono **deterministiche** e **vince la più specifica**:

<Steps>
  <Step title="corrispondenza peer">
    ID esatto di DM/gruppo/canale.
  </Step>
  <Step title="corrispondenza parentPeer">
    Ereditarietà del thread.
  </Step>
  <Step title="guildId + ruoli">
    Instradamento per ruolo Discord.
  </Step>
  <Step title="guildId">
    Discord.
  </Step>
  <Step title="teamId">
    Slack.
  </Step>
  <Step title="corrispondenza accountId per un canale">
    Fallback per account.
  </Step>
  <Step title="Corrispondenza a livello di canale">
    `accountId: "*"`.
  </Step>
  <Step title="Agente predefinito">
    Fallback a `agents.list[].default`, altrimenti prima voce della lista, predefinito: `main`.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Risoluzione dei pari merito e semantica AND">
    - Se più associazioni corrispondono nello stesso livello, vince la prima nell'ordine di configurazione.
    - Se un'associazione imposta più campi di corrispondenza (ad esempio `peer` + `guildId`), tutti i campi specificati sono obbligatori (semantica `AND`).

  </Accordion>
  <Accordion title="Dettaglio sull'ambito account">
    - Un'associazione che omette `accountId` corrisponde solo all'account predefinito.
    - Usa `accountId: "*"` per un fallback a livello di canale su tutti gli account.
    - Se in seguito aggiungi la stessa associazione per lo stesso agente con un id account esplicito, OpenClaw aggiorna l'associazione solo canale esistente rendendola limitata all'account invece di duplicarla.

  </Accordion>
</AccordionGroup>

## Più account / numeri di telefono

I canali che supportano **più account** (ad esempio WhatsApp) usano `accountId` per identificare ogni accesso. Ogni `accountId` può essere instradato a un agente diverso, quindi un server può ospitare più numeri di telefono senza mescolare le sessioni.

Se vuoi un account predefinito a livello di canale quando `accountId` è omesso, imposta `channels.<channel>.defaultAccount` (opzionale). Quando non è impostato, OpenClaw ripiega su `default` se presente, altrimenti sul primo id account configurato (ordinato).

I canali comuni che supportano questo modello includono:

- `whatsapp`, `telegram`, `discord`, `slack`, `signal`, `imessage`
- `irc`, `line`, `googlechat`, `mattermost`, `matrix`, `nextcloud-talk`
- `bluebubbles`, `zalo`, `zalouser`, `nostr`, `feishu`

## Concetti

- `agentId`: un "cervello" (area di lavoro, autenticazione per agente, archivio delle sessioni per agente).
- `accountId`: un'istanza di account di canale (ad esempio account WhatsApp `"personal"` vs `"biz"`).
- `binding`: instrada i messaggi in ingresso a un `agentId` tramite `(channel, accountId, peer)` e, facoltativamente, id guild/team.
- Le chat dirette collassano su `agent:<agentId>:<mainKey>` ("main" per agente; `session.mainKey`).

## Esempi di piattaforma

<AccordionGroup>
  <Accordion title="Bot Discord per agente">
    Ogni account bot Discord viene mappato a un `accountId` univoco. Associa ogni account a un agente e mantieni allowlist per bot.

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

    - Invita ciascun bot alla guild e abilita Message Content Intent.
    - I token risiedono in `channels.discord.accounts.<id>.token` (l'account predefinito può usare `DISCORD_BOT_TOKEN`).

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

    - Crea un bot per agente con BotFather e copia ciascun token.
    - I token risiedono in `channels.telegram.accounts.<id>.botToken` (l'account predefinito può usare `TELEGRAM_BOT_TOKEN`).

  </Accordion>
  <Accordion title="WhatsApp numbers per agent">
    Collega ciascun account prima di avviare il gateway:

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

## Schemi comuni

<Tabs>
  <Tab title="WhatsApp daily + Telegram deep work">
    Dividi per canale: instrada WhatsApp a un agente quotidiano veloce e Telegram a un agente Opus.

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

    Note:

    - Se hai più account per un canale, aggiungi `accountId` al binding (per esempio `{ channel: "whatsapp", accountId: "personal" }`).
    - Per instradare un singolo DM/gruppo a Opus mantenendo il resto sulla chat, aggiungi un binding `match.peer` per quel peer; le corrispondenze peer hanno sempre la precedenza sulle regole estese all'intero canale.

  </Tab>
  <Tab title="Same channel, one peer to Opus">
    Mantieni WhatsApp sull'agente veloce, ma instrada un DM a Opus:

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

    I binding peer hanno sempre la precedenza, quindi tienili sopra la regola estesa all'intero canale.

  </Tab>
  <Tab title="Family agent bound to a WhatsApp group">
    Associa un agente familiare dedicato a un singolo gruppo WhatsApp, con gating sulle menzioni e una policy degli strumenti più restrittiva:

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

    Note:

    - Gli elenchi allow/deny degli strumenti sono **strumenti**, non Skills. Se una skill deve eseguire un binario, assicurati che `exec` sia consentito e che il binario esista nella sandbox.
    - Per un gating più rigoroso, imposta `agents.list[].groupChat.mentionPatterns` e mantieni abilitate le allowlist di gruppo per il canale.

  </Tab>
</Tabs>

## Configurazione sandbox e strumenti per agente

Ogni agente può avere la propria sandbox e le proprie restrizioni sugli strumenti:

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
`setupCommand` risiede sotto `sandbox.docker` e viene eseguito una volta alla creazione del container. Gli override per agente `sandbox.docker.*` vengono ignorati quando lo scope risolto è `"shared"`.
</Note>

**Vantaggi:**

- **Isolamento di sicurezza**: limita gli strumenti per agenti non attendibili.
- **Controllo delle risorse**: esegui nella sandbox agenti specifici mantenendo gli altri sull'host.
- **Policy flessibili**: autorizzazioni diverse per agente.

<Note>
`tools.elevated` è **globale** e basato sul mittente; non è configurabile per agente. Se hai bisogno di confini per agente, usa `agents.list[].tools` per negare `exec`. Per il targeting nei gruppi, usa `agents.list[].groupChat.mentionPatterns` in modo che le @menzioni vengano mappate chiaramente all'agente previsto.
</Note>

Vedi [Sandbox e strumenti multi-agente](/it/tools/multi-agent-sandbox-tools) per esempi dettagliati.

## Correlati

- [Agenti ACP](/it/tools/acp-agents) — esecuzione di harness di codifica esterni
- [Instradamento dei canali](/it/channels/channel-routing) — come i messaggi vengono instradati agli agenti
- [Presence](/it/concepts/presence) — presenza e disponibilità degli agenti
- [Sessione](/it/concepts/session) — isolamento e instradamento delle sessioni
- [Sotto-agenti](/it/tools/subagents) — avvio di esecuzioni di agenti in background
