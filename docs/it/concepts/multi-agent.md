---
read_when: You want multiple isolated agents (workspaces + auth) in one gateway process.
sidebarTitle: Multi-agent routing
status: active
summary: 'Instradamento multi-agente: agenti isolati, account di canale e associazioni'
title: Instradamento multi-agente
x-i18n:
    generated_at: "2026-06-27T17:26:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4c1c55188cd27ea786cf65dcabd356a602e1e6da5f842532b189df59195274db
    source_path: concepts/multi-agent.md
    workflow: 16
---

Esegui più agenti _isolati_, ciascuno con il proprio workspace, la propria directory di stato (`agentDir`) e la propria cronologia di sessione, più più account di canale (ad es. due WhatsApp) in un unico Gateway in esecuzione. I messaggi in ingresso vengono instradati all’agente corretto tramite binding.

Un **agente** qui è l’intero ambito per-persona: file del workspace, profili di autenticazione, registro dei modelli e archivio delle sessioni. `agentDir` è la directory di stato su disco che contiene questa configurazione per agente in `~/.openclaw/agents/<agentId>/`. Un **binding** mappa un account di canale (ad es. un workspace Slack o un numero WhatsApp) a uno di quegli agenti.

## Cos’è “un agente”?

Un **agente** è un cervello con ambito completo, con il proprio:

- **Workspace** (file, AGENTS.md/SOUL.md/USER.md, note locali, regole della persona).
- **Directory di stato** (`agentDir`) per profili di autenticazione, registro dei modelli e configurazione per agente.
- **Archivio delle sessioni** (cronologia chat + stato di routing) in `~/.openclaw/agents/<agentId>/sessions`.

I profili di autenticazione sono **per agente**. Ogni agente legge dal proprio:

```text
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

<Note>
`sessions_history` è anche qui il percorso più sicuro per il richiamo tra sessioni: restituisce una vista limitata e sanificata, non un dump grezzo della trascrizione. Il richiamo dell’assistente rimuove tag di ragionamento, scaffolding `<relevant-memories>`, payload XML di tool-call in testo semplice (inclusi `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` e blocchi di tool-call troncati), scaffolding di tool-call declassato, token di controllo modello ASCII/full-width trapelati e XML di tool-call MiniMax malformato prima della redazione/troncamento.
</Note>

<Warning>
Non riutilizzare mai `agentDir` tra agenti (causa collisioni di autenticazione/sessione). Gli agenti
possono leggere i profili di autenticazione dell’agente predefinito/principale quando non hanno
un profilo locale, ma OpenClaw non clona i token di aggiornamento OAuth nello
store dell’agente secondario. Se vuoi un account OAuth indipendente, accedi da
quell’agente; se copi manualmente le credenziali, copia solo profili statici portabili
`api_key` o `token`.
</Warning>

Le Skills vengono caricate da ogni workspace dell’agente più radici condivise come `~/.openclaw/skills`, quindi filtrate dall’allowlist efficace delle Skills dell’agente quando configurata. Usa `agents.defaults.skills` per una baseline condivisa e `agents.list[].skills` per la sostituzione per agente. Vedi [Skills: per-agent vs shared](/it/tools/skills#per-agent-vs-shared-skills) e [Skills: agent skill allowlists](/it/tools/skills#agent-allowlists).

Il Gateway può ospitare **un agente** (predefinito) o **molti agenti** affiancati.

<Note>
**Nota sul workspace:** il workspace di ogni agente è la **cwd predefinita**, non una sandbox rigida. I percorsi relativi si risolvono dentro il workspace, ma i percorsi assoluti possono raggiungere altre posizioni dell’host a meno che la sandbox non sia abilitata. Vedi [Sandboxing](/it/gateway/sandboxing).
</Note>

## Percorsi (mappa rapida)

- Configurazione: `~/.openclaw/openclaw.json` (o `OPENCLAW_CONFIG_PATH`)
- Directory di stato: `~/.openclaw` (o `OPENCLAW_STATE_DIR`)
- Workspace: `~/.openclaw/workspace` (o `~/.openclaw/workspace-<agentId>`)
- Directory dell’agente: `~/.openclaw/agents/<agentId>/agent` (o `agents.list[].agentDir`)
- Sessioni: `~/.openclaw/agents/<agentId>/sessions`

### Modalità agente singolo (predefinita)

Se non fai nulla, OpenClaw esegue un singolo agente:

- `agentId` assume come valore predefinito **`main`**.
- Le sessioni hanno chiavi del tipo `agent:main:<mainKey>`.
- Il workspace assume come valore predefinito `~/.openclaw/workspace` (o `~/.openclaw/workspace-<profile>` quando `OPENCLAW_PROFILE` è impostato).
- Lo stato assume come valore predefinito `~/.openclaw/agents/main/agent`.

## Helper per agenti

Usa la procedura guidata degli agenti per aggiungere un nuovo agente isolato:

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
  <Step title="Crea il workspace di ogni agente">
    Usa la procedura guidata o crea i workspace manualmente:

    ```bash
    openclaw agents add coding
    openclaw agents add social
    ```

    Ogni agente ottiene il proprio workspace con `SOUL.md`, `AGENTS.md` e `USER.md` opzionale, più un `agentDir` dedicato e un archivio delle sessioni in `~/.openclaw/agents/<agentId>`.

  </Step>
  <Step title="Crea account di canale">
    Crea un account per agente sui canali preferiti:

    - Discord: un bot per agente, abilita Message Content Intent, copia ogni token.
    - Telegram: un bot per agente tramite BotFather, copia ogni token.
    - WhatsApp: collega ogni numero di telefono per account.

    ```bash
    openclaw channels login --channel whatsapp --account work
    ```

    Vedi le guide dei canali: [Discord](/it/channels/discord), [Telegram](/it/channels/telegram), [WhatsApp](/it/channels/whatsapp).

  </Step>
  <Step title="Aggiungi agenti, account e binding">
    Aggiungi gli agenti in `agents.list`, gli account di canale in `channels.<channel>.accounts` e collegali con `bindings` (esempi sotto).
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
- **Personalità diverse** (file del workspace per agente come `AGENTS.md` e `SOUL.md`).
- **Autenticazione + sessioni separate** (nessuna interferenza a meno che non sia esplicitamente abilitata).

Questo consente a **più persone** di condividere un server Gateway mantenendo isolati i loro “cervelli” AI e i loro dati.

## Ricerca nella memoria QMD tra agenti

Se un agente deve cercare nelle trascrizioni di sessione QMD di un altro agente, aggiungi raccolte extra in `agents.list[].memorySearch.qmd.extraCollections`. Usa `agents.defaults.memorySearch.qmd.extraCollections` solo quando ogni agente deve ereditare le stesse raccolte di trascrizioni condivise.

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

Il percorso della raccolta extra può essere condiviso tra agenti, ma il nome della raccolta resta esplicito quando il percorso è fuori dal workspace dell’agente. I percorsi dentro il workspace rimangono con ambito dell’agente, così ogni agente mantiene il proprio insieme di ricerca nelle trascrizioni.

## Un numero WhatsApp, più persone (divisione DM)

Puoi instradare **DM WhatsApp diversi** ad agenti diversi restando su **un solo account WhatsApp**. Abbina sul mittente E.164 (come `+15551234567`) con `peer.kind: "direct"`. Le risposte arrivano comunque dallo stesso numero WhatsApp (nessuna identità mittente per agente).

<Note>
Le chat dirette collassano nella **chiave di sessione principale** dell’agente, quindi il vero isolamento richiede **un agente per persona**.
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

- Il controllo di accesso ai DM è **globale per account WhatsApp** (pairing/allowlist), non per agente.
- Per i gruppi condivisi, associa il gruppo a un agente o usa [gruppi Broadcast](/it/channels/broadcast-groups).

## Regole di routing (come i messaggi scelgono un agente)

I binding sono **deterministici** e **vince il più specifico**:

<Steps>
  <Step title="corrispondenza peer">
    ID esatto di DM/gruppo/canale.
  </Step>
  <Step title="corrispondenza parentPeer">
    Ereditarietà del thread.
  </Step>
  <Step title="guildId + roles">
    Routing per ruolo Discord.
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
    Fallback a `agents.list[].default`, altrimenti prima voce dell’elenco, predefinito: `main`.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Risoluzione dei pareggi e semantica AND">
    - Se più binding corrispondono nello stesso livello, vince il primo nell’ordine della configurazione.
    - Se un binding imposta più campi di corrispondenza (per esempio `peer` + `guildId`), tutti i campi specificati sono obbligatori (semantica `AND`).

  </Accordion>
  <Accordion title="Dettaglio dell’ambito account">
    - Un binding che omette `accountId` corrisponde solo all’account predefinito. Non corrisponde a tutti gli account.
    - Usa `accountId: "*"` per un fallback a livello di canale su tutti gli account.
    - Usa `accountId: "<name>"` per corrispondere a un account.
    - Se in seguito aggiungi lo stesso binding per lo stesso agente con un ID account esplicito, OpenClaw aggiorna il binding esistente solo canale ad ambito account invece di duplicarlo.

  </Accordion>
</AccordionGroup>

## Più account / numeri di telefono

I canali che supportano **più account** (ad es. WhatsApp) usano `accountId` per identificare ogni accesso. Ogni `accountId` può essere instradato a un agente diverso, quindi un server può ospitare più numeri di telefono senza mischiare le sessioni.

Se vuoi un account predefinito a livello di canale quando `accountId` è omesso, imposta `channels.<channel>.defaultAccount` (opzionale). Quando non è impostato, OpenClaw ricade su `default` se presente, altrimenti sul primo ID account configurato (ordinato).

I canali comuni che supportano questo schema includono:

- `whatsapp`, `telegram`, `discord`, `slack`, `signal`, `imessage`
- `irc`, `line`, `googlechat`, `mattermost`, `matrix`, `nextcloud-talk`
- `zalo`, `zalouser`, `nostr`, `feishu`

## Concetti

- `agentId`: un “cervello” (workspace, autenticazione per agente, archivio sessioni per agente).
- `accountId`: un’istanza di account di canale (ad es. account WhatsApp `"personal"` rispetto a `"biz"`).
- `binding`: instrada i messaggi in ingresso a un `agentId` tramite `(channel, accountId, peer)` e facoltativamente ID guild/team.
- Le chat dirette collassano in `agent:<agentId>:<mainKey>` (“main” per agente; `session.mainKey`).

## Esempi di piattaforme

<AccordionGroup>
  <Accordion title="Bot Discord per agente">
    Ogni account bot Discord mappa a un `accountId` univoco. Associa ogni account a un agente e mantieni allowlist per bot.

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

    - Invita ciascun bot nella gilda e abilita Message Content Intent.
    - I token si trovano in `channels.discord.accounts.<id>.token` (l'account predefinito può usare `DISCORD_BOT_TOKEN`).

  </Accordion>
  <Accordion title="Bot Telegram per agente">
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
    - I token si trovano in `channels.telegram.accounts.<id>.botToken` (l'account predefinito può usare `TELEGRAM_BOT_TOKEN`).
    - Per più bot nello stesso gruppo Telegram, invita ciascun bot e menziona il bot che deve rispondere.
    - Disabilita la Privacy Mode di BotFather per ciascun bot di gruppo, quindi aggiungi di nuovo il bot in modo che Telegram applichi l'impostazione.
    - Consenti i gruppi con `channels.telegram.groups`, oppure usa `groupPolicy: "open"` solo per distribuzioni di gruppo attendibili.
    - Inserisci gli ID utente dei mittenti in `groupAllowFrom`. Gli ID di gruppi e supergruppi vanno in `channels.telegram.groups`, non in `groupAllowFrom`.
    - Associa tramite `accountId` in modo che ciascun bot venga instradato al proprio agente.

  </Accordion>
  <Accordion title="Numeri WhatsApp per agente">
    Collega ciascun account prima di avviare il Gateway:

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

## Pattern comuni

<Tabs>
  <Tab title="WhatsApp quotidiano + lavoro approfondito su Telegram">
    Dividi per canale: instrada WhatsApp a un agente veloce per l'uso quotidiano e Telegram a un agente Opus.

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

    Note:

    - Questi esempi usano `accountId: "*"` così le associazioni continuano a funzionare se aggiungi account in seguito.
    - Per instradare un singolo DM/gruppo a Opus mantenendo il resto su chat, aggiungi un'associazione `match.peer` per quel peer; le corrispondenze peer hanno sempre la precedenza sulle regole a livello di canale.

  </Tab>
  <Tab title="Stesso canale, un peer a Opus">
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
          match: { channel: "whatsapp", accountId: "*", peer: { kind: "direct", id: "+15551234567" } },
        },
        { agentId: "chat", match: { channel: "whatsapp", accountId: "*" } },
      ],
    }
    ```

    Le associazioni peer hanno sempre la precedenza, quindi tienile sopra la regola a livello di canale.

  </Tab>
  <Tab title="Agente familiare associato a un gruppo WhatsApp">
    Associa un agente familiare dedicato a un singolo gruppo WhatsApp, con filtro sulle menzioni e una policy degli strumenti più restrittiva:

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

    - Gli elenchi allow/deny degli strumenti sono **strumenti**, non Skills. Se una skill deve eseguire un binario, assicurati che `exec` sia consentito e che il binario esista nel sandbox.
    - Per un filtro più rigoroso, imposta `agents.list[].groupChat.mentionPatterns` e mantieni abilitate le allowlist dei gruppi per il canale.

  </Tab>
</Tabs>

## Configurazione del sandbox e degli strumenti per agente

Ciascun agente può avere il proprio sandbox e le proprie restrizioni sugli strumenti:

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
`setupCommand` si trova sotto `sandbox.docker` e viene eseguito una volta alla creazione del container. Gli override per agente `sandbox.docker.*` vengono ignorati quando lo scope risolto è `"shared"`.
</Note>

**Vantaggi:**

- **Isolamento di sicurezza**: limita gli strumenti per agenti non attendibili.
- **Controllo delle risorse**: esegui agenti specifici in sandbox mantenendo gli altri sull'host.
- **Policy flessibili**: autorizzazioni diverse per agente.

<Note>
`tools.elevated` è **globale** e basato sul mittente; non è configurabile per agente. Se ti servono confini per agente, usa `agents.list[].tools` per negare `exec`. Per il targeting dei gruppi, usa `agents.list[].groupChat.mentionPatterns` in modo che le @menzioni vengano mappate chiaramente all'agente previsto.
</Note>

Consulta [Sandbox multi-agente e strumenti](/it/tools/multi-agent-sandbox-tools) per esempi dettagliati.

## Correlati

- [Agenti ACP](/it/tools/acp-agents) — esecuzione di harness di coding esterni
- [Instradamento dei canali](/it/channels/channel-routing) — come i messaggi vengono instradati agli agenti
- [Presenza](/it/concepts/presence) — presenza e disponibilità degli agenti
- [Sessione](/it/concepts/session) — isolamento e instradamento delle sessioni
- [Sub-agenti](/it/tools/subagents) — avvio di esecuzioni di agenti in background
