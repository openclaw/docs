---
read_when: You want multiple isolated agents (workspaces + auth) in one gateway process.
status: active
summary: 'Instradamento multi-agente: agenti isolati, account canale e bindings'
title: Instradamento multi-agente
x-i18n:
    generated_at: "2026-04-24T08:37:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: ef6f91c53a14bf92427f08243930e4aab50ac7853c9b22b0dbdbb853ea1a93d2
    source_path: concepts/multi-agent.md
    workflow: 15
---

Esegui più agenti _isolati_ — ciascuno con il proprio workspace, directory di stato (`agentDir`) e cronologia delle sessioni — più più account di canale (ad esempio due WhatsApp) in un unico Gateway in esecuzione. I messaggi in ingresso vengono instradati all'agente corretto tramite i binding.

Un **agente** qui è l'intero ambito per-persona: file del workspace, profili auth, registro dei modelli e archivio delle sessioni. `agentDir` è la directory di stato su disco che contiene questa configurazione per agente in `~/.openclaw/agents/<agentId>/`. Un **binding** mappa un account di canale (ad esempio un workspace Slack o un numero WhatsApp) a uno di questi agenti.

## Che cos'è "un agente"?

Un **agente** è un cervello completamente delimitato con il proprio:

- **Workspace** (file, AGENTS.md/SOUL.md/USER.md, note locali, regole della persona).
- **Directory di stato** (`agentDir`) per profili auth, registro dei modelli e configurazione per agente.
- **Archivio delle sessioni** (cronologia chat + stato di instradamento) sotto `~/.openclaw/agents/<agentId>/sessions`.

I profili auth sono **per agente**. Ogni agente legge dal proprio:

```text
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

Anche qui `sessions_history` è il percorso più sicuro per il richiamo tra sessioni: restituisce
una vista delimitata e sanificata, non un dump grezzo della trascrizione. Il richiamo dell'assistente rimuove
tag di ragionamento, impalcature `<relevant-memories>`, payload XML di chiamata strumenti in testo normale
(inclusi `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` e blocchi di chiamata strumenti troncati),
impalcature di chiamata strumenti declassate, token di controllo del modello ASCII/a larghezza piena fuoriusciti
e XML malformato di chiamata strumenti MiniMax prima di redazione/troncamento.

Le credenziali dell'agente principale **non** vengono condivise automaticamente. Non riutilizzare mai `agentDir`
tra agenti (causa collisioni di auth/sessione). Se vuoi condividere le credenziali,
copia `auth-profiles.json` nell'`agentDir` dell'altro agente.

Le Skills vengono caricate dal workspace di ciascun agente più root condivise come
`~/.openclaw/skills`, poi filtrate dalla allowlist effettiva delle skill dell'agente quando
configurata. Usa `agents.defaults.skills` per una baseline condivisa e
`agents.list[].skills` per una sostituzione per agente. Vedi
[Skills: per-agent vs shared](/it/tools/skills#per-agent-vs-shared-skills) e
[Skills: agent skill allowlists](/it/tools/skills#agent-skill-allowlists).

Il Gateway può ospitare **un agente** (predefinito) oppure **molti agenti** affiancati.

**Nota sul workspace:** il workspace di ciascun agente è la **cwd predefinita**, non una
sandbox rigida. I percorsi relativi vengono risolti all'interno del workspace, ma i percorsi assoluti possono
raggiungere altre posizioni dell'host a meno che il sandboxing non sia abilitato. Vedi
[Sandboxing](/it/gateway/sandboxing).

## Percorsi (mappa rapida)

- Configurazione: `~/.openclaw/openclaw.json` (oppure `OPENCLAW_CONFIG_PATH`)
- Directory di stato: `~/.openclaw` (oppure `OPENCLAW_STATE_DIR`)
- Workspace: `~/.openclaw/workspace` (oppure `~/.openclaw/workspace-<agentId>`)
- Directory agente: `~/.openclaw/agents/<agentId>/agent` (oppure `agents.list[].agentDir`)
- Sessioni: `~/.openclaw/agents/<agentId>/sessions`

### Modalità a singolo agente (predefinita)

Se non fai nulla, OpenClaw esegue un singolo agente:

- `agentId` assume il valore predefinito **`main`**.
- Le sessioni sono indicizzate come `agent:main:<mainKey>`.
- Il workspace assume il valore predefinito `~/.openclaw/workspace` (oppure `~/.openclaw/workspace-<profile>` quando `OPENCLAW_PROFILE` è impostato).
- Lo stato assume il valore predefinito `~/.openclaw/agents/main/agent`.

## Helper agente

Usa la procedura guidata agente per aggiungere un nuovo agente isolato:

```bash
openclaw agents add work
```

Poi aggiungi `bindings` (oppure lascia che lo faccia la procedura guidata) per instradare i messaggi in ingresso.

Verifica con:

```bash
openclaw agents list --bindings
```

## Avvio rapido

<Steps>
  <Step title="Crea il workspace di ciascun agente">

Usa la procedura guidata oppure crea manualmente i workspace:

```bash
openclaw agents add coding
openclaw agents add social
```

Ogni agente riceve il proprio workspace con `SOUL.md`, `AGENTS.md` e `USER.md` facoltativo, più un `agentDir` dedicato e un archivio sessioni sotto `~/.openclaw/agents/<agentId>`.

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

  <Step title="Aggiungi agenti, account e binding">

Aggiungi agenti sotto `agents.list`, account canale sotto `channels.<channel>.accounts` e collegali con `bindings` (esempi sotto).

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
- **Auth + sessioni separate** (nessuna interferenza tra loro a meno che non sia esplicitamente abilitata).

Questo consente a **più persone** di condividere un server Gateway mantenendo i propri “cervelli” AI e dati isolati.

## Ricerca nella memoria QMD tra agenti

Se un agente deve cercare nelle trascrizioni di sessione QMD di un altro agente, aggiungi
raccolte extra sotto `agents.list[].memorySearch.qmd.extraCollections`.
Usa `agents.defaults.memorySearch.qmd.extraCollections` solo quando ogni agente
deve ereditare le stesse raccolte di trascrizioni condivise.

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

Il percorso della raccolta extra può essere condiviso tra agenti, ma il nome della raccolta
resta esplicito quando il percorso è esterno al workspace dell'agente. I percorsi all'interno del
workspace restano delimitati per agente, così ogni agente mantiene il proprio insieme di ricerca trascrizioni.

## Un numero WhatsApp, più persone (suddivisione DM)

Puoi instradare **DM WhatsApp diverse** a agenti diversi restando su **un solo account WhatsApp**. Abbina sul mittente E.164 (come `+15551234567`) con `peer.kind: "direct"`. Le risposte continuano comunque a provenire dallo stesso numero WhatsApp (nessuna identità del mittente per agente).

Dettaglio importante: le chat dirette collassano nella **chiave di sessione principale** dell'agente, quindi il vero isolamento richiede **un agente per persona**.

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

- Il controllo di accesso DM è **globale per account WhatsApp** (pairing/allowlist), non per agente.
- Per gruppi condivisi, associa il gruppo a un agente oppure usa [Gruppi di diffusione](/it/channels/broadcast-groups).

## Regole di instradamento (come i messaggi scelgono un agente)

I binding sono **deterministici** e **vince quello più specifico**:

1. corrispondenza `peer` (id esatto DM/gruppo/canale)
2. corrispondenza `parentPeer` (ereditarietà del thread)
3. `guildId + roles` (instradamento ruoli Discord)
4. `guildId` (Discord)
5. `teamId` (Slack)
6. corrispondenza `accountId` per un canale
7. corrispondenza a livello canale (`accountId: "*"`)
8. fallback all'agente predefinito (`agents.list[].default`, altrimenti la prima voce dell'elenco, predefinito: `main`)

Se più binding corrispondono nello stesso livello, vince il primo nell'ordine della configurazione.
Se un binding imposta più campi di corrispondenza (ad esempio `peer` + `guildId`), tutti i campi specificati sono richiesti (semantica `AND`).

Dettaglio importante sull'ambito dell'account:

- Un binding che omette `accountId` corrisponde solo all'account predefinito.
- Usa `accountId: "*"` per un fallback a livello canale su tutti gli account.
- Se in seguito aggiungi lo stesso binding per lo stesso agente con un id account esplicito, OpenClaw aggiorna il binding esistente solo-canale portandolo all'ambito account invece di duplicarlo.

## Più account / numeri di telefono

I canali che supportano **più account** (ad esempio WhatsApp) usano `accountId` per identificare
ogni accesso. Ogni `accountId` può essere instradato verso un agente diverso, così un solo server può ospitare
più numeri di telefono senza mescolare le sessioni.

Se vuoi un account predefinito a livello canale quando `accountId` è omesso, imposta
`channels.<channel>.defaultAccount` (facoltativo). Se non impostato, OpenClaw ripiega
su `default` se presente, altrimenti sul primo id account configurato (ordinato).

I canali comuni che supportano questo pattern includono:

- `whatsapp`, `telegram`, `discord`, `slack`, `signal`, `imessage`
- `irc`, `line`, `googlechat`, `mattermost`, `matrix`, `nextcloud-talk`
- `bluebubbles`, `zalo`, `zalouser`, `nostr`, `feishu`

## Concetti

- `agentId`: un “cervello” (workspace, auth per agente, archivio sessioni per agente).
- `accountId`: un'istanza di account canale (ad esempio account WhatsApp `"personal"` vs `"biz"`).
- `binding`: instrada i messaggi in ingresso verso un `agentId` tramite `(channel, accountId, peer)` e facoltativamente id guild/team.
- Le chat dirette collassano in `agent:<agentId>:<mainKey>` (sessione “main” per agente; `session.mainKey`).

## Esempi di piattaforma

### Bot Discord per agente

Ogni account bot Discord è mappato a un `accountId` univoco. Associa ogni account a un agente e mantieni allowlist per bot.

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
- I token si trovano in `channels.discord.accounts.<id>.token` (l'account predefinito può usare `DISCORD_BOT_TOKEN`).

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
- I token si trovano in `channels.telegram.accounts.<id>.botToken` (l'account predefinito può usare `TELEGRAM_BOT_TOKEN`).

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

  // Instradamento deterministico: vince la prima corrispondenza (prima la più specifica).
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

  // Disattivato per impostazione predefinita: la messaggistica agente-a-agente deve essere abilitata esplicitamente + inserita in allowlist.
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

## Esempio: chat quotidiana su WhatsApp + deep work su Telegram

Suddividi per canale: instrada WhatsApp a un agente rapido per l'uso quotidiano e Telegram a un agente Opus.

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

- Se hai più account per un canale, aggiungi `accountId` al binding (ad esempio `{ channel: "whatsapp", accountId: "personal" }`).
- Per instradare una singola DM/un gruppo a Opus mantenendo il resto su chat, aggiungi un binding `match.peer` per quel peer; le corrispondenze peer vincono sempre sulle regole estese a tutto il canale.

## Esempio: stesso canale, un peer verso Opus

Mantieni WhatsApp sull'agente rapido, ma instrada una DM a Opus:

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

I binding peer vincono sempre, quindi tienili sopra la regola estesa a tutto il canale.

## Agente family associato a un gruppo WhatsApp

Associa un agente family dedicato a un singolo gruppo WhatsApp, con blocco per menzione
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

- Le allowlist/denylist degli strumenti riguardano gli **strumenti**, non le skill. Se una skill deve eseguire un
  binario, assicurati che `exec` sia consentito e che il binario esista nella sandbox.
- Per un blocco più rigoroso, imposta `agents.list[].groupChat.mentionPatterns` e mantieni
  abilitate le allowlist di gruppo per il canale.

## Configurazione Sandbox e strumenti per agente

Ogni agente può avere le proprie restrizioni di sandbox e strumenti:

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
          scope: "agent",  // Un container per agente
          docker: {
            // Configurazione una tantum facoltativa dopo la creazione del container
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

Nota: `setupCommand` si trova sotto `sandbox.docker` e viene eseguito una volta alla creazione del container.
Gli override per agente `sandbox.docker.*` vengono ignorati quando l'ambito risolto è `"shared"`.

**Vantaggi:**

- **Isolamento di sicurezza**: limita gli strumenti per agenti non attendibili
- **Controllo delle risorse**: metti in sandbox agenti specifici mantenendo gli altri sull'host
- **Policy flessibili**: autorizzazioni diverse per agente

Nota: `tools.elevated` è **globale** e basato sul mittente; non è configurabile per agente.
Se hai bisogno di boundary per agente, usa `agents.list[].tools` per negare `exec`.
Per il targeting nei gruppi, usa `agents.list[].groupChat.mentionPatterns` così le @menzioni vengono mappate in modo pulito all'agente previsto.

Vedi [Sandbox e strumenti multi-agente](/it/tools/multi-agent-sandbox-tools) per esempi dettagliati.

## Correlati

- [Instradamento del canale](/it/channels/channel-routing) — come i messaggi vengono instradati agli agenti
- [Sub-agenti](/it/tools/subagents) — generazione di esecuzioni agente in background
- [Agenti ACP](/it/tools/acp-agents) — esecuzione di harness di coding esterni
- [Presenza](/it/concepts/presence) — presenza e disponibilità dell'agente
- [Sessione](/it/concepts/session) — isolamento e instradamento della sessione
