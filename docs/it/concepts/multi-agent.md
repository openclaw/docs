---
read_when: You want multiple isolated agents (workspaces + auth) in one gateway process.
sidebarTitle: Multi-agent routing
status: active
summary: 'Instradamento multi-agente: agenti isolati, account di canale e binding'
title: Instradamento multi-agente
x-i18n:
    generated_at: "2026-04-26T11:27:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 845149ac1076d4746cc5038bd4444c2fc6117710f724b8cabdc31dc9ef6abbe8
    source_path: concepts/multi-agent.md
    workflow: 15
---

Esegui più agenti _isolati_ — ciascuno con la propria area di lavoro, directory di stato (`agentDir`) e cronologia di sessione — più più account di canale (ad esempio due WhatsApp) in un unico Gateway in esecuzione. I messaggi in ingresso vengono instradati all'agente corretto tramite binding.

Un **agente** qui è l'intero ambito per-persona: file dell'area di lavoro, profili di autenticazione, registro dei modelli e archivio delle sessioni. `agentDir` è la directory di stato su disco che contiene questa configurazione per agente in `~/.openclaw/agents/<agentId>/`. Un **binding** mappa un account di canale (ad esempio un workspace Slack o un numero WhatsApp) a uno di questi agenti.

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
Anche qui `sessions_history` è il percorso più sicuro per il richiamo tra sessioni: restituisce una vista delimitata e sanificata, non un dump grezzo della trascrizione. Il richiamo dell'assistente rimuove i tag di pensiero, l'impalcatura `<relevant-memories>`, i payload XML delle chiamate agli strumenti in testo semplice (inclusi `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` e i blocchi di chiamata agli strumenti troncati), l'impalcatura degradata delle chiamate agli strumenti, i token di controllo del modello ASCII/a larghezza piena trapelati e l'XML malformato delle chiamate agli strumenti MiniMax prima della redazione/troncatura.
</Note>

<Warning>
Le credenziali dell'agente principale **non** vengono condivise automaticamente. Non riutilizzare mai `agentDir` tra agenti (causa collisioni di autenticazione/sessione). Se vuoi condividere le credenziali, copia `auth-profiles.json` nell'`agentDir` dell'altro agente.
</Warning>

Le Skills vengono caricate dall'area di lavoro di ciascun agente più radici condivise come `~/.openclaw/skills`, poi filtrate dalla allowlist effettiva delle skill dell'agente quando configurata. Usa `agents.defaults.skills` per una baseline condivisa e `agents.list[].skills` per la sostituzione per agente. Vedi [Skills: per-agent vs shared](/it/tools/skills#per-agent-vs-shared-skills) e [Skills: agent skill allowlists](/it/tools/skills#agent-skill-allowlists).

Il Gateway può ospitare **un agente** (predefinito) o **molti agenti** affiancati.

<Note>
**Nota sull'area di lavoro:** l'area di lavoro di ciascun agente è la **cwd predefinita**, non una sandbox rigida. I percorsi relativi vengono risolti all'interno dell'area di lavoro, ma i percorsi assoluti possono raggiungere altre posizioni dell'host a meno che il sandboxing non sia abilitato. Vedi [Sandboxing](/it/gateway/sandboxing).
</Note>

## Percorsi (mappa rapida)

- Configurazione: `~/.openclaw/openclaw.json` (o `OPENCLAW_CONFIG_PATH`)
- Directory di stato: `~/.openclaw` (o `OPENCLAW_STATE_DIR`)
- Area di lavoro: `~/.openclaw/workspace` (o `~/.openclaw/workspace-<agentId>`)
- Directory agente: `~/.openclaw/agents/<agentId>/agent` (o `agents.list[].agentDir`)
- Sessioni: `~/.openclaw/agents/<agentId>/sessions`

### Modalità agente singolo (predefinita)

Se non fai nulla, OpenClaw esegue un singolo agente:

- `agentId` assume come valore predefinito **`main`**.
- Le sessioni sono indicate come `agent:main:<mainKey>`.
- L'area di lavoro ha come valore predefinito `~/.openclaw/workspace` (o `~/.openclaw/workspace-<profile>` quando è impostato `OPENCLAW_PROFILE`).
- Lo stato ha come valore predefinito `~/.openclaw/agents/main/agent`.

## Helper dell'agente

Usa la procedura guidata degli agenti per aggiungere un nuovo agente isolato:

```bash
openclaw agents add work
```

Quindi aggiungi `bindings` (o lascia che la procedura guidata lo faccia) per instradare i messaggi in ingresso.

Verifica con:

```bash
openclaw agents list --bindings
```

## Avvio rapido

<Steps>
  <Step title="Crea l'area di lavoro di ciascun agente">
    Usa la procedura guidata o crea manualmente le aree di lavoro:

    ```bash
    openclaw agents add coding
    openclaw agents add social
    ```

    Ogni agente ottiene la propria area di lavoro con `SOUL.md`, `AGENTS.md` e `USER.md` facoltativo, più un `agentDir` dedicato e un archivio di sessione sotto `~/.openclaw/agents/<agentId>`.

  </Step>
  <Step title="Crea gli account di canale">
    Crea un account per agente sui canali che preferisci:

    - Discord: un bot per agente, abilita Message Content Intent, copia ciascun token.
    - Telegram: un bot per agente tramite BotFather, copia ciascun token.
    - WhatsApp: collega ogni numero di telefono per account.

    ```bash
    openclaw channels login --channel whatsapp --account work
    ```

    Vedi le guide dei canali: [Discord](/it/channels/discord), [Telegram](/it/channels/telegram), [WhatsApp](/it/channels/whatsapp).

  </Step>
  <Step title="Aggiungi agenti, account e binding">
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
- **Personalità diverse** (file per agente dell'area di lavoro come `AGENTS.md` e `SOUL.md`).
- **Autenticazione + sessioni separate** (nessuna interferenza reciproca salvo abilitazione esplicita).

Questo consente a **più persone** di condividere un unico server Gateway mantenendo isolati i propri "cervelli" IA e i propri dati.

## Ricerca QMD in memoria tra agenti

Se un agente deve cercare nelle trascrizioni di sessione QMD di un altro agente, aggiungi raccolte extra sotto `agents.list[].memorySearch.qmd.extraCollections`. Usa `agents.defaults.memorySearch.qmd.extraCollections` solo quando ogni agente deve ereditare le stesse raccolte condivise di trascrizioni.

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
            extraCollections: [{ path: "notes" }], // risolto dentro l'area di lavoro -> raccolta chiamata "notes-main"
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

Il percorso della raccolta extra può essere condiviso tra agenti, ma il nome della raccolta resta esplicito quando il percorso è esterno all'area di lavoro dell'agente. I percorsi dentro l'area di lavoro restano delimitati all'agente, così ciascun agente mantiene il proprio insieme di ricerca nelle trascrizioni.

## Un numero WhatsApp, più persone (suddivisione DM)

Puoi instradare **diversi DM WhatsApp** a agenti diversi pur restando su **un unico account WhatsApp**. La corrispondenza avviene sul mittente E.164 (come `+15551234567`) con `peer.kind: "direct"`. Le risposte continuano a provenire dallo stesso numero WhatsApp (nessuna identità mittente per agente).

<Note>
Le chat dirette collassano nella **chiave di sessione principale** dell'agente, quindi un vero isolamento richiede **un agente per persona**.
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

- Il controllo di accesso DM è **globale per account WhatsApp** (abbinamento/allowlist), non per agente.
- Per gruppi condivisi, collega il gruppo a un agente oppure usa [Broadcast groups](/it/channels/broadcast-groups).

## Regole di instradamento (come i messaggi scelgono un agente)

I binding sono **deterministici** e vale il **più specifico**:

<Steps>
  <Step title="Corrispondenza peer">
    ID esatto di DM/gruppo/canale.
  </Step>
  <Step title="Corrispondenza parentPeer">
    Ereditarietà del thread.
  </Step>
  <Step title="guildId + ruoli">
    Instradamento ruoli Discord.
  </Step>
  <Step title="guildId">
    Discord.
  </Step>
  <Step title="teamId">
    Slack.
  </Step>
  <Step title="Corrispondenza accountId per un canale">
    Fallback per account.
  </Step>
  <Step title="Corrispondenza a livello di canale">
    `accountId: "*"`.
  </Step>
  <Step title="Agente predefinito">
    Fallback a `agents.list[].default`, altrimenti la prima voce della lista, predefinito: `main`.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Spareggio e semantica AND">
    - Se più binding corrispondono nello stesso livello, vince il primo nell'ordine di configurazione.
    - Se un binding imposta più campi di corrispondenza (ad esempio `peer` + `guildId`), tutti i campi specificati sono richiesti (semantica `AND`).

  </Accordion>
  <Accordion title="Dettaglio dell'ambito account">
    - Un binding che omette `accountId` corrisponde solo all'account predefinito.
    - Usa `accountId: "*"` per un fallback a livello di canale su tutti gli account.
    - Se in seguito aggiungi lo stesso binding per lo stesso agente con un ID account esplicito, OpenClaw aggiorna il binding esistente solo-canale all'ambito account invece di duplicarlo.

  </Accordion>
</AccordionGroup>

## Più account / più numeri di telefono

I canali che supportano **più account** (ad esempio WhatsApp) usano `accountId` per identificare ogni login. Ogni `accountId` può essere instradato a un agente diverso, così un server può ospitare più numeri di telefono senza mescolare le sessioni.

Se vuoi un account predefinito a livello di canale quando `accountId` viene omesso, imposta `channels.<channel>.defaultAccount` (facoltativo). Se non impostato, OpenClaw usa come fallback `default` se presente, altrimenti il primo ID account configurato (ordinato).

I canali comuni che supportano questo schema includono:

- `whatsapp`, `telegram`, `discord`, `slack`, `signal`, `imessage`
- `irc`, `line`, `googlechat`, `mattermost`, `matrix`, `nextcloud-talk`
- `bluebubbles`, `zalo`, `zalouser`, `nostr`, `feishu`

## Concetti

- `agentId`: un "cervello" (area di lavoro, autenticazione per agente, archivio di sessione per agente).
- `accountId`: un'istanza di account del canale (ad esempio account WhatsApp `"personal"` vs `"biz"`).
- `binding`: instrada i messaggi in ingresso a un `agentId` tramite `(channel, accountId, peer)` e facoltativamente ID guild/team.
- Le chat dirette collassano in `agent:<agentId>:<mainKey>` ("main" per agente; `session.mainKey`).

## Esempi di piattaforma

<AccordionGroup>
  <Accordion title="Bot Discord per agente">
    Ogni account bot Discord è associato a un `accountId` univoco. Collega ciascun account a un agente e mantieni allowlist per bot.

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

    - Invita ogni bot nella guild e abilita Message Content Intent.
    - I token risiedono in `channels.discord.accounts.<id>.token` (l'account predefinito può usare `DISCORD_BOT_TOKEN`).

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
    - I token risiedono in `channels.telegram.accounts.<id>.botToken` (l'account predefinito può usare `TELEGRAM_BOT_TOKEN`).

  </Accordion>
  <Accordion title="Numeri WhatsApp per agente">
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

      // Instradamento deterministico: vince la prima corrispondenza (prima le più specifiche).
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

      // Disattivato per impostazione predefinita: la messaggistica agente-agente deve essere abilitata esplicitamente + inserita in allowlist.
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

  </Accordion>
</AccordionGroup>

## Pattern comuni

<Tabs>
  <Tab title="WhatsApp quotidiano + Telegram lavoro profondo">
    Suddividi per canale: instrada WhatsApp a un agente veloce per l'uso quotidiano e Telegram a un agente Opus.

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
            name: "Lavoro profondo",
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
    - Per instradare un singolo DM/gruppo a Opus mantenendo il resto su chat, aggiungi un binding `match.peer` per quel peer; le corrispondenze peer vincono sempre sulle regole estese all'intero canale.

  </Tab>
  <Tab title="Stesso canale, un peer su Opus">
    Mantieni WhatsApp sull'agente veloce, ma instrada un DM a Opus:

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
            name: "Lavoro profondo",
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

    I binding peer vincono sempre, quindi tienili sopra la regola estesa all'intero canale.

  </Tab>
  <Tab title="Agente famiglia collegato a un gruppo WhatsApp">
    Collega un agente famiglia dedicato a un singolo gruppo WhatsApp, con filtro delle menzioni e un criterio strumenti più restrittivo:

    ```json5
    {
      agents: {
        list: [
          {
            id: "family",
            name: "Famiglia",
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

    - Le liste allow/deny degli strumenti sono **strumenti**, non skill. Se una skill deve eseguire un binario, assicurati che `exec` sia consentito e che il binario esista nel sandbox.
    - Per un filtro più rigido, imposta `agents.list[].groupChat.mentionPatterns` e mantieni abilitate le allowlist dei gruppi per il canale.

  </Tab>
</Tabs>

## Configurazione sandbox e strumenti per agente

Ogni agente può avere il proprio sandbox e le proprie restrizioni sugli strumenti:

```js
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: {
          mode: "off",  // Nessun sandbox per l'agente personale
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
            // Configurazione facoltativa una tantum dopo la creazione del container
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

<Note>
`setupCommand` si trova sotto `sandbox.docker` e viene eseguito una sola volta alla creazione del container. Gli override per agente `sandbox.docker.*` vengono ignorati quando l'ambito risolto è `"shared"`.
</Note>

**Vantaggi:**

- **Isolamento di sicurezza**: limita gli strumenti per agenti non affidabili.
- **Controllo delle risorse**: usa il sandbox per agenti specifici mantenendo gli altri sull'host.
- **Criteri flessibili**: permessi diversi per agente.

<Note>
`tools.elevated` è **globale** e basato sul mittente; non è configurabile per agente. Se ti servono confini per agente, usa `agents.list[].tools` per negare `exec`. Per il targeting dei gruppi, usa `agents.list[].groupChat.mentionPatterns` così le @mention si associano in modo pulito all'agente previsto.
</Note>

Vedi [Sandbox e strumenti multi-agente](/it/tools/multi-agent-sandbox-tools) per esempi dettagliati.

## Correlati

- [Agenti ACP](/it/tools/acp-agents) — esecuzione di harness di coding esterni
- [Instradamento dei canali](/it/channels/channel-routing) — come i messaggi vengono instradati agli agenti
- [Presenza](/it/concepts/presence) — presenza e disponibilità dell'agente
- [Sessione](/it/concepts/session) — isolamento e instradamento delle sessioni
- [Subagenti](/it/tools/subagents) — avvio di esecuzioni di agenti in background
