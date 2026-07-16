---
read_when: You want multiple agents with separate workspaces, auth, and sessions in one Gateway process.
sidebarTitle: Multi-agent routing
status: active
summary: 'Routing multi-agente: confini degli agenti, account dei canali e associazioni'
title: Instradamento multi-agente
x-i18n:
    generated_at: "2026-07-16T14:15:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 265a1f3d9d9b4957c99c71f391ce4f5abba6b70561570f8bbe8cb9964ece1cfc
    source_path: concepts/multi-agent.md
    workflow: 16
---

Esegui più agenti _isolati_ in un unico processo Gateway, ciascuno con il proprio workspace, la propria directory di stato (`agentDir`) e la cronologia delle sessioni basata su SQLite, oltre a più account di canale (ad esempio, due numeri WhatsApp). I messaggi in entrata vengono instradati all'agente corretto tramite **binding**.

Un **agente** rappresenta l'intero ambito di ciascuna persona: file del workspace, profili di autenticazione, registro dei modelli e archivio delle sessioni. Un **binding** associa un account di canale (un workspace Slack, un numero WhatsApp e così via) a uno di questi agenti.

## Che cos'è un agente

Ogni agente dispone dei propri:

- **Workspace**: file, `AGENTS.md`/`SOUL.md`/`USER.md`, note locali, regole della persona.
- **Directory di stato** (`agentDir`): profili di autenticazione, registro dei modelli, configurazione specifica dell'agente.
- **Archivio delle sessioni**: cronologia delle chat e stato di instradamento in `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`.

I profili di autenticazione sono specifici dell'agente e vengono letti da:

```text
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

<Note>
`sessions_history` è il percorso più sicuro per recuperare informazioni tra sessioni: restituisce una vista limitata e oscurata, non un dump grezzo della trascrizione. Rimuove le firme dei blocchi di ragionamento, i dettagli dei payload dei risultati degli strumenti, la struttura `<relevant-memories>`, i tag XML delle chiamate agli strumenti (`<tool_call>`, `<function_call>` e le relative forme plurali o degradate) e l'XML delle chiamate agli strumenti di MiniMax, quindi tronca e limita l'output in base alla dimensione in byte.
</Note>

<Warning>
Non riutilizzare mai `agentDir` tra agenti: causa collisioni nello stato di autenticazione e delle sessioni. Quando la credenziale OAuth locale di un agente secondario è scaduta o il suo aggiornamento non riesce, OpenClaw consulta la credenziale dell'agente predefinito/principale per lo stesso ID profilo e adotta il token più recente, senza copiare il token di aggiornamento nell'archivio dell'agente secondario. Per usare un account OAuth completamente indipendente, effettuare l'accesso da tale agente. Se le credenziali vengono copiate manualmente, copiare solo profili statici portabili `api_key` o `token`: il materiale di aggiornamento OAuth non è portabile per impostazione predefinita (`copyToAgents` può abilitarlo esplicitamente per un profilo).
</Warning>

Le Skills vengono caricate dal workspace di ciascun agente e da radici condivise come `~/.openclaw/skills`, quindi filtrate in base all'elenco di Skills consentite effettivo dell'agente. Usare `agents.defaults.skills` per una base condivisa e `agents.list[].skills` per una sostituzione specifica dell'agente (le voci esplicite sostituiscono quelle predefinite, non vengono unite). Consultare [Skills: specifiche dell'agente e condivise](/it/tools/skills#per-agent-vs-shared-skills) e [Skills: elenchi consentiti degli agenti](/it/tools/skills#agent-allowlists).

L'archiviazione gestita da un Plugin segue la configurazione di tale Plugin; l'aggiunta di un secondo agente
non suddivide automaticamente ogni archivio globale dei Plugin. Ad esempio, configurare
[i vault di Memory Wiki specifici dell'agente](/it/concepts/multi-agent#per-agent-memory-wiki-vaults)
quando le persone non devono condividere le conoscenze wiki compilate.

<Note>
**Nota sul workspace:** il workspace di ciascun agente è la **cwd predefinita**, non una sandbox rigida. I percorsi relativi vengono risolti all'interno del workspace, ma quelli assoluti possono accedere ad altre posizioni dell'host, a meno che la sandbox non sia abilitata. Consultare [Sandboxing](/it/gateway/sandboxing).
</Note>

## Percorsi

| Elemento                         | Valore predefinito                                                                    | Sostituzione                                                                             |
| -------------------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Configurazione                   | `~/.openclaw/openclaw.json`                                                            | `OPENCLAW_CONFIG_PATH`                                                                   |
| Directory di stato              | `~/.openclaw`                                                                          | `OPENCLAW_STATE_DIR`                                                                     |
| Workspace dell'agente predefinito | `~/.openclaw/workspace` (o `workspace-<profile>` quando `OPENCLAW_PROFILE` è impostato)      | `agents.list[].workspace`, quindi `agents.defaults.workspace`, oppure `OPENCLAW_WORKSPACE_DIR` |
| Workspace degli altri agenti    | `<stateDir>/workspace-<agentId>` (o `<agents.defaults.workspace>/<agentId>` quando è impostato) | `agents.list[].workspace`                                                                |
| Directory dell'agente           | `~/.openclaw/agents/<agentId>/agent`                                                   | `agents.list[].agentDir`                                                                 |
| Sessioni e trascrizioni          | `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`                             | —                                                                                        |
| Artefatti di sessione legacy/archiviati | `~/.openclaw/agents/<agentId>/sessions`                                                | —                                                                                        |

### Modalità con agente singolo (predefinita)

Se non viene configurato nulla, OpenClaw esegue un solo agente:

- `agentId` usa come valore predefinito `main`.
- Le sessioni usano la chiave `agent:main:<mainKey>` (il valore predefinito `mainKey` è `main`).
- Il workspace usa come valore predefinito `~/.openclaw/workspace` (o `workspace-<profile>` quando `OPENCLAW_PROFILE` è impostato su un valore diverso da `default`).
- Lo stato usa come valore predefinito `~/.openclaw/agents/main/agent`.

## Assistente per gli agenti

Aggiungere un nuovo agente isolato:

```bash
openclaw agents add work
```

Opzioni: `--workspace <dir>`, `--model <id>`, `--agent-dir <dir>`, `--bind <channel[:accountId]>` (ripetibile), `--non-interactive` (richiede `--workspace`).

Aggiungere `bindings` per instradare i messaggi in entrata (la procedura guidata propone di farlo automaticamente), quindi verificare:

```bash
openclaw agents list --bindings
```

## Avvio rapido

<Steps>
  <Step title="Creare il workspace di ciascun agente">
    ```bash
    openclaw agents add coding
    openclaw agents add social
    ```

    Ogni agente riceve il proprio workspace con `SOUL.md`, `AGENTS.md` e, facoltativamente, `USER.md`, oltre a un `agentDir` dedicato e a un archivio delle sessioni in `~/.openclaw/agents/<agentId>`.

  </Step>
  <Step title="Creare gli account dei canali">
    Creare un account per ciascun agente sui canali preferiti:

    - Discord: un bot per agente; abilitare Message Content Intent e copiare ciascun token.
    - Telegram: un bot per agente tramite BotFather; copiare ciascun token.
    - WhatsApp: collegare ciascun numero di telefono al relativo account.

    ```bash
    openclaw channels login --channel whatsapp --account work
    ```

    Consultare le guide dei canali: [Discord](/it/channels/discord), [Telegram](/it/channels/telegram), [WhatsApp](/it/channels/whatsapp).

  </Step>
  <Step title="Aggiungere agenti, account e binding">
    Aggiungere gli agenti in `agents.list`, gli account dei canali in `channels.<channel>.accounts` e collegarli tramite `bindings` (vedere gli esempi seguenti).
  </Step>
  <Step title="Riavviare e verificare">
    ```bash
    openclaw gateway restart
    openclaw agents list --bindings
    openclaw channels status --probe
    ```
  </Step>
</Steps>

## Più agenti, più persone

Ogni `agentId` configurato costituisce un confine distinto della persona per lo stato principale dell'agente:

- Account diversi per canale (per `accountId`).
- Personalità diverse (tramite `AGENTS.md`/`SOUL.md` specifici dell'agente).
- Autenticazione e sessioni separate, con accesso tra agenti abilitato solo tramite funzionalità esplicite o la configurazione dei Plugin.

Ciò consente a più persone di condividere un unico Gateway mantenendo separato lo stato principale degli agenti.

## Vault di Memory Wiki specifici dell'agente

Per impostazione predefinita, Memory Wiki utilizza un unico vault globale. Per mantenere
le conoscenze compilate di un agente di supporto separate da quelle di un agente di marketing, impostare
`plugins.entries.memory-wiki.config.vault.scope` su `agent`:

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

Il percorso configurato è la directory principale. OpenClaw aggiunge l'ID
normalizzato dell'agente, producendo percorsi come `~/.openclaw/wiki/support` e
`~/.openclaw/wiki/marketing`. Le operazioni CLI e Gateway con ambito agente richiedono
un agente esplicito quando sono configurati più agenti. Consultare
[i vault di Memory Wiki specifici dell'agente](/it/plugins/memory-wiki#per-agent-vaults) per i dettagli
su filtraggio del bridge, migrazione e confini di attendibilità.

## Ricerca QMD nella memoria tra agenti

Per consentire a un agente di cercare nelle trascrizioni delle sessioni QMD di un altro agente, aggiungere raccolte supplementari in `agents.list[].memorySearch.qmd.extraCollections`. Usare `agents.defaults.memorySearch.qmd.extraCollections` quando tutti gli agenti devono condividere le stesse raccolte.

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
            extraCollections: [{ path: "notes" }], // viene risolto nel workspace -> raccolta denominata "notes-main"
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

Un percorso di una raccolta supplementare può essere condiviso tra gli agenti, ma il relativo `name` rimane esplicito quando il percorso si trova all'esterno del workspace dell'agente. I percorsi all'interno del workspace rimangono specifici dell'agente, in modo che ciascun agente mantenga il proprio insieme di ricerca delle trascrizioni.

## Un numero WhatsApp, più persone (suddivisione dei messaggi diretti)

Instradare messaggi diretti WhatsApp diversi ad agenti diversi su **un solo** account WhatsApp associando il mittente E.164 (`+15551234567`) con `peer.kind: "direct"`. Le risposte continuano a provenire dallo stesso numero WhatsApp: non esiste un'identità del mittente specifica dell'agente.

<Note>
Per impostazione predefinita, le chat dirette confluiscono nella chiave della sessione principale dell'agente, quindi un isolamento effettivo richiede un agente per persona.
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

Il controllo dell'accesso ai messaggi diretti (associazione/elenco consentito) è globale per ciascun account WhatsApp, non specifico dell'agente. Per i gruppi condivisi, associare il gruppo a un agente oppure usare i [gruppi di trasmissione](/it/channels/broadcast-groups).

## Regole di instradamento

I binding sono deterministici e prevale quello più specifico. Consultare [Instradamento dei canali](/it/channels/channel-routing#routing-rules-how-an-agent-is-chosen) per l'ordine completo dei livelli (peer esatto, peer principale, carattere jolly del peer, gilda+ruoli, gilda, team, account, canale, agente predefinito). Alcune regole da evidenziare:

- Se più binding corrispondono nello stesso livello, prevale il primo nell'ordine di configurazione.
- Se un binding imposta più campi di corrispondenza (ad esempio `peer` + `guildId`), tutti i campi specificati devono corrispondere (semantica `AND`).
- Un binding che omette `accountId` corrisponde solo all'account predefinito, non a tutti gli account. Usare `accountId: "*"` come fallback per l'intero canale oppure `accountId: "<name>"` per un singolo account. Se si aggiunge nuovamente lo stesso binding con un ID account esplicito, il binding esistente relativo al solo canale viene aggiornato anziché duplicato.

## Più account/numeri di telefono

I canali che supportano più account (ad esempio WhatsApp) usano `accountId` per identificare ciascun accesso. Ogni `accountId` viene instradato al proprio agente, consentendo a un unico server di ospitare più numeri di telefono senza mescolare le sessioni.

Impostare `channels.<channel>.defaultAccount` per scegliere l'account utilizzato quando `accountId` viene omesso. Se non è impostato, OpenClaw usa `default` se presente, altrimenti il primo ID account configurato (in ordine alfabetico).

Canali che supportano più account: `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `mattermost`, `matrix`, `nextcloud-talk`, `nostr`, `signal`, `slack`, `telegram`, `whatsapp`, `zalo`, `zalouser`.

## Concetti

- `agentId`: un "cervello" (spazio di lavoro, autenticazione per agente, archivio delle sessioni per agente).
- `accountId`: un'istanza di account del canale (ad esempio, account WhatsApp `personal` rispetto a `biz`).
- `binding`: instrada i messaggi in entrata a un `agentId` in base a `(channel, accountId, peer)` e, facoltativamente, agli ID di gilda/team.
- Le chat dirette vengono ricondotte a `agent:<agentId>:<mainKey>` (il valore "main" per agente; vedere `session.mainKey`).

## Esempi per piattaforma

<AccordionGroup>
  <Accordion title="Bot Discord per agente">
    Ogni account bot Discord è associato a un `accountId` univoco. Associare ogni account a un agente e mantenere elenchi di elementi consentiti distinti per ciascun bot.

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

    - Invitare ogni bot nella gilda e abilitare Message Content Intent.
    - I token si trovano in `channels.discord.accounts.<id>.token` (l'account predefinito può utilizzare `DISCORD_BOT_TOKEN`).

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

    - Creare un bot per agente con BotFather e copiare ogni token.
    - I token si trovano in `channels.telegram.accounts.<id>.botToken` (l'account predefinito può utilizzare `TELEGRAM_BOT_TOKEN`).
    - Per utilizzare più bot nello stesso gruppo Telegram, invitare ogni bot e menzionare quello che deve rispondere.
    - Disabilitare la modalità Privacy di BotFather per ogni bot del gruppo (`/setprivacy` -> Disable), quindi rimuovere e aggiungere nuovamente il bot affinché Telegram applichi l'impostazione.
    - Consentire i gruppi con `channels.telegram.groups` oppure utilizzare `groupPolicy: "open"` solo per distribuzioni in gruppi attendibili.
    - Inserire gli ID utente dei mittenti in `groupAllowFrom`. Gli ID di gruppi e supergruppi devono essere inseriti in `channels.telegram.groups`, non in `groupAllowFrom`.
    - Eseguire l'associazione tramite `accountId` affinché ogni bot instradi i messaggi al proprio agente.

  </Accordion>
  <Accordion title="Numeri WhatsApp per agente">
    Collegare ogni account prima di avviare il Gateway:

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

      // Instradamento deterministico: prevale la prima corrispondenza (prima la più specifica).
      bindings: [
        { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
        { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },

        // Sostituzione facoltativa per interlocutore (esempio: inviare un gruppo specifico all'agente di lavoro).
        {
          agentId: "work",
          match: {
            channel: "whatsapp",
            accountId: "personal",
            peer: { kind: "group", id: "1203630...@g.us" },
          },
        },
      ],

      // Disattivata per impostazione predefinita: la messaggistica tra agenti deve essere abilitata esplicitamente e inserita nell'elenco degli elementi consentiti.
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
              // Sostituzione facoltativa. Valore predefinito: ~/.openclaw/credentials/whatsapp/personal
              // authDir: "~/.openclaw/credentials/whatsapp/personal",
            },
            biz: {
              // Sostituzione facoltativa. Valore predefinito: ~/.openclaw/credentials/whatsapp/biz
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
  <Tab title="WhatsApp quotidiano + lavoro approfondito su Telegram">
    Suddividere per canale: instradare WhatsApp a un agente rapido per l'uso quotidiano e Telegram a un agente Opus.

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

    Questi esempi utilizzano `accountId: "*"`, così le associazioni continuano a funzionare se vengono aggiunti altri account in seguito. Per instradare un singolo messaggio diretto/gruppo a Opus mantenendo il resto sulla chat, aggiungere un'associazione `match.peer` per tale interlocutore: le corrispondenze per interlocutore prevalgono sempre sulle regole a livello di canale.

  </Tab>
  <Tab title="Stesso canale, un interlocutore su Opus">
    Mantenere WhatsApp sull'agente rapido, ma instradare un messaggio diretto a Opus:

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

    Le associazioni per interlocutore prevalgono sempre, quindi mantenerle sopra la regola a livello di canale.

  </Tab>
  <Tab title="Agente familiare associato a un gruppo WhatsApp">
    Associare un agente dedicato alla famiglia a un singolo gruppo WhatsApp, con obbligo di menzione e criteri più restrittivi per gli strumenti:

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

    Gli elenchi di strumenti consentiti/negati riguardano gli **strumenti**, non le Skills. Se una skill deve eseguire un file binario, assicurarsi che `exec` sia consentito e che il file binario esista nella sandbox. Per un controllo più rigoroso, impostare `agents.list[].groupChat.mentionPatterns` e mantenere abilitati gli elenchi di gruppi consentiti per il canale.

  </Tab>
</Tabs>

## Configurazione della sandbox e degli strumenti per agente

Ogni agente può avere restrizioni proprie per la sandbox e gli strumenti:

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
        // Nessuna restrizione degli strumenti: tutti gli strumenti sono disponibili
      },
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: {
          mode: "all",     // Sempre in sandbox
          scope: "agent",  // Un container per agente
          docker: {
            // Configurazione iniziale facoltativa eseguita una sola volta dopo la creazione del container
            setupCommand: "apt-get update && apt-get install -y git curl",
          },
        },
        tools: {
          allow: ["read"],                    // Solo lo strumento di lettura
          deny: ["exec", "write", "edit", "apply_patch"],    // Nega gli altri
        },
      },
    ],
  },
}
```

<Note>
`setupCommand` si trova sotto `sandbox.docker` e viene eseguito una sola volta alla creazione del container. Le sostituzioni `sandbox.docker.*` per agente vengono ignorate quando l'ambito risolto è `"shared"`.
</Note>

Ciò offre:

- **Isolamento di sicurezza**: limita gli strumenti per gli agenti non attendibili.
- **Controllo delle risorse**: esegue in sandbox agenti specifici mantenendo gli altri sull'host.
- **Criteri flessibili**: autorizzazioni diverse per ciascun agente.

<Note>
`tools.elevated` dispone sia di un controllo globale (`tools.elevated.enabled`/`allowFrom`) sia di un controllo per agente (`agents.list[].tools.elevated.enabled`/`allowFrom`). Il controllo per agente può soltanto limitare ulteriormente quello globale: entrambi devono autorizzare un mittente affinché possano essere eseguiti comandi con privilegi elevati. Per indirizzare i gruppi, utilizzare `agents.list[].groupChat.mentionPatterns` affinché le @menzioni vengano associate chiaramente all'agente previsto.
</Note>

Per esempi dettagliati, vedere [Sandbox e strumenti multi-agente](/it/tools/multi-agent-sandbox-tools).

## Contenuti correlati

- [Agenti ACP](/it/tools/acp-agents) — esecuzione di harness di programmazione esterni
- [Instradamento dei canali](/it/channels/channel-routing) — modalità di instradamento dei messaggi agli agenti
- [Presenza](/it/concepts/presence) — presenza e disponibilità degli agenti
- [Sessione](/it/concepts/session) — isolamento e instradamento delle sessioni
- [Sottoagenti](/it/tools/subagents) — avvio di esecuzioni di agenti in background
