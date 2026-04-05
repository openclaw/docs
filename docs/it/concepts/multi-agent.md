---
read_when: You want multiple isolated agents (workspaces + auth) in one gateway process.
status: active
summary: 'Instradamento multi-agente: agenti isolati, account dei canali e binding'
title: Instradamento multi-agente
x-i18n:
    generated_at: "2026-04-05T13:50:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7e8bc48f229d01aa793ca4137e5a59f2a5ceb0ba65841710aaf69f53a672be60
    source_path: concepts/multi-agent.md
    workflow: 15
---

# Instradamento multi-agente

Obiettivo: più agenti _isolati_ (workspace + `agentDir` + sessioni separati), oltre a più account di canale (ad esempio due account WhatsApp) in un unico Gateway in esecuzione. Il traffico in ingresso viene instradato a un agente tramite i binding.

## Che cos'è "un agente"?

Un **agente** è un cervello completamente definito con i propri:

- **Workspace** (file, AGENTS.md/SOUL.md/USER.md, note locali, regole della persona).
- **Directory di stato** (`agentDir`) per profili di autenticazione, registro dei modelli e configurazione per agente.
- **Archivio delle sessioni** (cronologia chat + stato di instradamento) in `~/.openclaw/agents/<agentId>/sessions`.

I profili di autenticazione sono **per agente**. Ogni agente legge dal proprio:

```text
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

Anche qui `sessions_history` è il percorso più sicuro per il richiamo tra sessioni: restituisce
una vista limitata e sanificata, non un dump grezzo della trascrizione. Il richiamo dell'assistente rimuove
i tag di pensiero, l'impalcatura `<relevant-memories>`, i payload XML delle chiamate agli strumenti in testo semplice
(inclusi `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` e i blocchi di chiamata agli strumenti troncati),
l'impalcatura degradata delle chiamate agli strumenti, i token di controllo del modello trapelati in ASCII/a larghezza piena
e l'XML malformato delle chiamate agli strumenti di MiniMax prima della redazione/troncatura.

Le credenziali dell'agente principale **non** vengono condivise automaticamente. Non riutilizzare mai `agentDir`
tra agenti diversi (provoca collisioni di autenticazione/sessione). Se vuoi condividere credenziali,
copia `auth-profiles.json` nell'`agentDir` dell'altro agente.

Le Skills vengono caricate dal workspace di ciascun agente e da radici condivise come
`~/.openclaw/skills`, quindi filtrate in base alla allowlist effettiva delle skill dell'agente quando
configurata. Usa `agents.defaults.skills` per una base condivisa e
`agents.list[].skills` per una sostituzione per agente. Vedi
[Skills: per agente vs condivise](/tools/skills#per-agent-vs-shared-skills) e
[Skills: allowlist delle skill dell'agente](/tools/skills#agent-skill-allowlists).

Il Gateway può ospitare **un agente** (predefinito) o **molti agenti** affiancati.

**Nota sul workspace:** il workspace di ciascun agente è la **cwd predefinita**, non una sandbox
rigida. I percorsi relativi vengono risolti all'interno del workspace, ma i percorsi assoluti possono
raggiungere altre posizioni dell'host a meno che la sandbox non sia abilitata. Vedi
[Sandboxing](/gateway/sandboxing).

## Percorsi (mappa rapida)

- Configurazione: `~/.openclaw/openclaw.json` (o `OPENCLAW_CONFIG_PATH`)
- Directory di stato: `~/.openclaw` (o `OPENCLAW_STATE_DIR`)
- Workspace: `~/.openclaw/workspace` (o `~/.openclaw/workspace-<agentId>`)
- Directory agente: `~/.openclaw/agents/<agentId>/agent` (o `agents.list[].agentDir`)
- Sessioni: `~/.openclaw/agents/<agentId>/sessions`

### Modalità agente singolo (predefinita)

Se non fai nulla, OpenClaw esegue un singolo agente:

- `agentId` è predefinito su **`main`**.
- Le sessioni sono indicate come `agent:main:<mainKey>`.
- Il workspace è predefinito su `~/.openclaw/workspace` (o `~/.openclaw/workspace-<profile>` quando è impostato `OPENCLAW_PROFILE`).
- Lo stato è predefinito su `~/.openclaw/agents/main/agent`.

## Helper degli agenti

Usa la procedura guidata degli agenti per aggiungere un nuovo agente isolato:

```bash
openclaw agents add work
```

Quindi aggiungi i `bindings` (oppure lascia che lo faccia la procedura guidata) per instradare i messaggi in ingresso.

Verifica con:

```bash
openclaw agents list --bindings
```

## Guida rapida

<Steps>
  <Step title="Crea il workspace di ciascun agente">

Usa la procedura guidata o crea i workspace manualmente:

```bash
openclaw agents add coding
openclaw agents add social
```

Ogni agente ottiene il proprio workspace con `SOUL.md`, `AGENTS.md` e facoltativamente `USER.md`, oltre a un `agentDir` dedicato e a un archivio delle sessioni in `~/.openclaw/agents/<agentId>`.

  </Step>

  <Step title="Crea gli account di canale">

Crea un account per agente nei canali che preferisci:

- Discord: un bot per agente, abilita Message Content Intent, copia ogni token.
- Telegram: un bot per agente tramite BotFather, copia ogni token.
- WhatsApp: collega ogni numero di telefono per account.

```bash
openclaw channels login --channel whatsapp --account work
```

Vedi le guide dei canali: [Discord](/it/channels/discord), [Telegram](/it/channels/telegram), [WhatsApp](/it/channels/whatsapp).

  </Step>

  <Step title="Aggiungi agenti, account e binding">

Aggiungi gli agenti in `agents.list`, gli account di canale in `channels.<channel>.accounts` e collegali con i `bindings` (esempi sotto).

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

- **Numeri di telefono/account diversi** (per `accountId` del canale).
- **Personalità diverse** (tramite file del workspace per agente come `AGENTS.md` e `SOUL.md`).
- **Autenticazione + sessioni separate** (nessuna interferenza reciproca salvo abilitazione esplicita).

Questo consente a **più persone** di condividere un server Gateway mantenendo isolati i propri “cervelli” AI e i dati.

## Ricerca nella memoria QMD tra agenti

Se un agente deve poter cercare nelle trascrizioni delle sessioni QMD di un altro agente, aggiungi
raccolte aggiuntive in `agents.list[].memorySearch.qmd.extraCollections`.
Usa `agents.defaults.memorySearch.qmd.extraCollections` solo quando tutti gli agenti
devono ereditare le stesse raccolte di trascrizioni condivise.

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
            extraCollections: [{ path: "notes" }], // risolto nel workspace -> raccolta chiamata "notes-main"
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

Il percorso della raccolta aggiuntiva può essere condiviso tra agenti, ma il nome della raccolta
rimane esplicito quando il percorso è esterno al workspace dell'agente. I percorsi all'interno del
workspace rimangono definiti per agente, così ogni agente mantiene il proprio insieme di ricerca delle trascrizioni.

## Un numero WhatsApp, più persone (divisione DM)

Puoi instradare **DM WhatsApp diversi** a agenti diversi rimanendo su **un solo account WhatsApp**. Abbina in base al mittente E.164 (come `+15551234567`) con `peer.kind: "direct"`. Le risposte continueranno comunque a provenire dallo stesso numero WhatsApp (nessuna identità mittente per agente).

Dettaglio importante: le chat dirette confluiscono nella **chiave di sessione principale** dell'agente, quindi il vero isolamento richiede **un agente per persona**.

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
- Per i gruppi condivisi, associa il gruppo a un agente oppure usa i [Gruppi broadcast](/it/channels/broadcast-groups).

## Regole di instradamento (come i messaggi scelgono un agente)

I binding sono **deterministici** e **vince il più specifico**:

1. corrispondenza `peer` (id esatto di DM/gruppo/canale)
2. corrispondenza `parentPeer` (ereditarietà del thread)
3. `guildId + roles` (instradamento per ruoli di Discord)
4. `guildId` (Discord)
5. `teamId` (Slack)
6. corrispondenza `accountId` per un canale
7. corrispondenza a livello di canale (`accountId: "*"`)
8. fallback all'agente predefinito (`agents.list[].default`, altrimenti la prima voce dell'elenco, predefinito: `main`)

Se più binding corrispondono nello stesso livello, vince il primo in ordine di configurazione.
Se un binding imposta più campi di corrispondenza (per esempio `peer` + `guildId`), tutti i campi specificati sono richiesti (semantica `AND`).

Dettaglio importante sull'ambito degli account:

- Un binding che omette `accountId` corrisponde solo all'account predefinito.
- Usa `accountId: "*"` per un fallback a livello di canale su tutti gli account.
- Se in seguito aggiungi lo stesso binding per lo stesso agente con un id account esplicito, OpenClaw aggiorna il binding esistente solo-canale all'ambito dell'account invece di duplicarlo.

## Più account / numeri di telefono

I canali che supportano **più account** (ad esempio WhatsApp) usano `accountId` per identificare
ogni accesso. Ogni `accountId` può essere instradato a un agente diverso, così un solo server può ospitare
più numeri di telefono senza mescolare le sessioni.

Se vuoi un account predefinito a livello di canale quando `accountId` viene omesso, imposta
`channels.<channel>.defaultAccount` (facoltativo). Se non è impostato, OpenClaw usa come fallback
`default` se presente, altrimenti il primo id account configurato (ordinato).

I canali comuni che supportano questo modello includono:

- `whatsapp`, `telegram`, `discord`, `slack`, `signal`, `imessage`
- `irc`, `line`, `googlechat`, `mattermost`, `matrix`, `nextcloud-talk`
- `bluebubbles`, `zalo`, `zalouser`, `nostr`, `feishu`

## Concetti

- `agentId`: un “cervello” (workspace, autenticazione per agente, archivio sessioni per agente).
- `accountId`: un'istanza di account di canale (ad esempio account WhatsApp `"personal"` rispetto a `"biz"`).
- `binding`: instrada i messaggi in ingresso a un `agentId` tramite `(channel, accountId, peer)` e facoltativamente id di guild/team.
- Le chat dirette confluiscono in `agent:<agentId>:<mainKey>` (“main” per agente; `session.mainKey`).

## Esempi di piattaforma

### Bot Discord per agente

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

Note:

- Invita ogni bot nella guild e abilita Message Content Intent.
- I token sono in `channels.discord.accounts.<id>.token` (l'account predefinito può usare `DISCORD_BOT_TOKEN`).

### Bot Telegram per agente

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

Note:

- Crea un bot per agente con BotFather e copia ogni token.
- I token sono in `channels.telegram.accounts.<id>.botToken` (l'account predefinito può usare `TELEGRAM_BOT_TOKEN`).

### Numeri WhatsApp per agente

Collega ogni account prima di avviare il gateway:

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

  // Instradamento deterministico: la prima corrispondenza vince (prima le più specifiche).
  bindings: [
    { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },

    // Override facoltativo per peer (esempio: invia un gruppo specifico all'agente work).
    {
      agentId: "work",
      match: {
        channel: "whatsapp",
        accountId: "personal",
        peer: { kind: "group", id: "1203630...@g.us" },
      },
    },
  ],

  // Disattivato per impostazione predefinita: la messaggistica tra agenti deve essere abilitata esplicitamente + inserita in allowlist.
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
          // Override facoltativo. Predefinito: ~/.openclaw/credentials/whatsapp/personal
          // authDir: "~/.openclaw/credentials/whatsapp/personal",
        },
        biz: {
          // Override facoltativo. Predefinito: ~/.openclaw/credentials/whatsapp/biz
          // authDir: "~/.openclaw/credentials/whatsapp/biz",
        },
      },
    },
  },
}
```

## Esempio: chat quotidiana su WhatsApp + lavoro approfondito su Telegram

Suddividi per canale: instrada WhatsApp a un agente rapido per tutti i giorni e Telegram a un agente Opus.

```json5
{
  agents: {
    list: [
      {
        id: "chat",
        name: "Quotidiano",
        workspace: "~/.openclaw/workspace-chat",
        model: "anthropic/claude-sonnet-4-6",
      },
      {
        id: "opus",
        name: "Lavoro approfondito",
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
- Per instradare un singolo DM/gruppo a Opus mantenendo il resto su chat, aggiungi un binding `match.peer` per quel peer; le corrispondenze peer vincono sempre sulle regole a livello di canale.

## Esempio: stesso canale, un peer a Opus

Mantieni WhatsApp sull'agente rapido, ma instrada un DM a Opus:

```json5
{
  agents: {
    list: [
      {
        id: "chat",
        name: "Quotidiano",
        workspace: "~/.openclaw/workspace-chat",
        model: "anthropic/claude-sonnet-4-6",
      },
      {
        id: "opus",
        name: "Lavoro approfondito",
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

I binding peer vincono sempre, quindi tienili sopra la regola a livello di canale.

## Agente family associato a un gruppo WhatsApp

Associa un agente family dedicato a un singolo gruppo WhatsApp, con controllo tramite mention
e una policy degli strumenti più restrittiva:

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

- Le allowlist/denylist degli strumenti riguardano gli **strumenti**, non le Skills. Se una skill deve eseguire un
  binario, assicurati che `exec` sia consentito e che il binario esista nella sandbox.
- Per un controllo più rigoroso, imposta `agents.list[].groupChat.mentionPatterns` e mantieni
  abilitate le allowlist di gruppo per il canale.

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
          mode: "off",  // Nessuna sandbox per l'agente personale
        },
        // Nessuna restrizione sugli strumenti - tutti gli strumenti disponibili
      },
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: {
          mode: "all",     // Sempre in sandbox
          scope: "agent",  // Un contenitore per agente
          docker: {
            // Configurazione facoltativa una sola volta dopo la creazione del contenitore
            setupCommand: "apt-get update && apt-get install -y git curl",
          },
        },
        tools: {
          allow: ["read"],                    // Solo strumento read
          deny: ["exec", "write", "edit", "apply_patch"],    // Nega gli altri
        },
      },
    ],
  },
}
```

Nota: `setupCommand` si trova in `sandbox.docker` e viene eseguito una sola volta alla creazione del contenitore.
Gli override per agente `sandbox.docker.*` vengono ignorati quando l'ambito risolto è `"shared"`.

**Vantaggi:**

- **Isolamento di sicurezza**: limita gli strumenti per agenti non attendibili
- **Controllo delle risorse**: usa la sandbox per agenti specifici mantenendo gli altri sull'host
- **Policy flessibili**: permessi diversi per agente

Nota: `tools.elevated` è **globale** e basato sul mittente; non è configurabile per agente.
Se hai bisogno di confini per agente, usa `agents.list[].tools` per negare `exec`.
Per il targeting nei gruppi, usa `agents.list[].groupChat.mentionPatterns` in modo che le @mention vengano mappate in modo pulito all'agente previsto.

Vedi [Sandbox e strumenti multi-agente](/tools/multi-agent-sandbox-tools) per esempi dettagliati.

## Correlati

- [Instradamento dei canali](/it/channels/channel-routing) — come i messaggi vengono instradati agli agenti
- [Sottoagenti](/tools/subagents) — avvio di esecuzioni di agenti in background
- [Agenti ACP](/tools/acp-agents) — esecuzione di harness di coding esterni
- [Presenza](/concepts/presence) — presenza e disponibilità degli agenti
- [Sessione](/concepts/session) — isolamento e instradamento delle sessioni
