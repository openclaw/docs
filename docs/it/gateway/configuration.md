---
read_when:
    - Configurare OpenClaw per la prima volta
    - Cerchi pattern di configurazione comuni
    - Passare a sezioni specifiche della configurazione
summary: 'Panoramica della configurazione: attività comuni, configurazione rapida e link al riferimento completo'
title: Configurazione
x-i18n:
    generated_at: "2026-04-23T08:28:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: a674bbc73f3a501ffd47ef9396d55d6087806921cfb24ef576398022dd0248c3
    source_path: gateway/configuration.md
    workflow: 15
---

# Configurazione

OpenClaw legge una configurazione <Tooltip tip="JSON5 supports comments and trailing commas">**JSON5**</Tooltip> opzionale da `~/.openclaw/openclaw.json`.
Il percorso della configurazione attiva deve essere un file regolare. Layout
`openclaw.json` con symlink non sono supportati per le scritture gestite da OpenClaw; una scrittura atomica può sostituire
il percorso invece di preservare il symlink. Se mantieni la configurazione fuori dalla
directory di stato predefinita, punta `OPENCLAW_CONFIG_PATH` direttamente al file reale.

Se il file manca, OpenClaw usa impostazioni predefinite sicure. Motivi comuni per aggiungere una configurazione:

- Connettere i canali e controllare chi può inviare messaggi al bot
- Impostare modelli, strumenti, sandboxing o automazione (Cron, hook)
- Regolare sessioni, contenuti multimediali, rete o UI

Vedi il [riferimento completo](/it/gateway/configuration-reference) per ogni campo disponibile.

<Tip>
**Nuovo alla configurazione?** Inizia con `openclaw onboard` per la configurazione interattiva, oppure consulta la guida [Esempi di configurazione](/it/gateway/configuration-examples) per configurazioni complete da copiare e incollare.
</Tip>

## Configurazione minima

```json5
// ~/.openclaw/openclaw.json
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

## Modifica della configurazione

<Tabs>
  <Tab title="Procedura guidata interattiva">
    ```bash
    openclaw onboard       # flusso completo di onboarding
    openclaw configure     # procedura guidata di configurazione
    ```
  </Tab>
  <Tab title="CLI (one-liner)">
    ```bash
    openclaw config get agents.defaults.workspace
    openclaw config set agents.defaults.heartbeat.every "2h"
    openclaw config unset plugins.entries.brave.config.webSearch.apiKey
    ```
  </Tab>
  <Tab title="Control UI">
    Apri [http://127.0.0.1:18789](http://127.0.0.1:18789) e usa la scheda **Config**.
    La Control UI renderizza un modulo a partire dallo schema di configurazione live, includendo i metadati documentali
    dei campi `title` / `description` oltre agli schemi di plugin e canali quando
    disponibili, con un editor **Raw JSON** come via di fuga. Per
    UI di drill-down e altri strumenti, il gateway espone anche `config.schema.lookup` per
    recuperare un nodo dello schema limitato a un percorso più riepiloghi immediati dei figli.
  </Tab>
  <Tab title="Modifica diretta">
    Modifica direttamente `~/.openclaw/openclaw.json`. Il Gateway osserva il file e applica automaticamente le modifiche (vedi [hot reload](#config-hot-reload)).
  </Tab>
</Tabs>

## Validazione rigorosa

<Warning>
OpenClaw accetta solo configurazioni che corrispondono completamente allo schema. Chiavi sconosciute, tipi non validi o valori non validi fanno sì che il Gateway **si rifiuti di avviarsi**. L'unica eccezione a livello root è `$schema` (stringa), così gli editor possono collegare metadati JSON Schema.
</Warning>

`openclaw config schema` stampa il JSON Schema canonico usato da Control UI
e dalla validazione. `config.schema.lookup` recupera un singolo nodo limitato a un percorso più
riepiloghi dei figli per strumenti drill-down. I metadati documentali `title`/`description`
dei campi vengono mantenuti in oggetti annidati, wildcard (`*`), elementi di array (`[]`) e rami `anyOf`/
`oneOf`/`allOf`. Gli schemi runtime di plugin e canali vengono uniti quando il
registro dei manifest viene caricato.

Quando la validazione fallisce:

- Il Gateway non si avvia
- Funzionano solo i comandi diagnostici (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Esegui `openclaw doctor` per vedere i problemi esatti
- Esegui `openclaw doctor --fix` (o `--yes`) per applicare le riparazioni

Il Gateway mantiene una copia trusted last-known-good dopo ogni avvio riuscito.
Se successivamente `openclaw.json` fallisce la validazione (o perde `gateway.mode`, si riduce
bruscamente o ha una riga di log estranea anteposta), OpenClaw preserva il file danneggiato
come `.clobbered.*`, ripristina la copia last-known-good e registra la ragione del
ripristino. Anche il turno successivo dell'agente riceve un avviso di evento di sistema, così l'agente principale
non riscrive ciecamente la configurazione ripristinata. La promozione a last-known-good
viene saltata quando un candidato contiene segnaposto di segreti redatti come `***`.

## Attività comuni

<AccordionGroup>
  <Accordion title="Configurare un canale (WhatsApp, Telegram, Discord, ecc.)">
    Ogni canale ha la propria sezione di configurazione sotto `channels.<provider>`. Vedi la pagina dedicata del canale per i passaggi di configurazione:

    - [WhatsApp](/it/channels/whatsapp) — `channels.whatsapp`
    - [Telegram](/it/channels/telegram) — `channels.telegram`
    - [Discord](/it/channels/discord) — `channels.discord`
    - [Feishu](/it/channels/feishu) — `channels.feishu`
    - [Google Chat](/it/channels/googlechat) — `channels.googlechat`
    - [Microsoft Teams](/it/channels/msteams) — `channels.msteams`
    - [Slack](/it/channels/slack) — `channels.slack`
    - [Signal](/it/channels/signal) — `channels.signal`
    - [iMessage](/it/channels/imessage) — `channels.imessage`
    - [Mattermost](/it/channels/mattermost) — `channels.mattermost`

    Tutti i canali condividono lo stesso pattern di policy DM:

    ```json5
    {
      channels: {
        telegram: {
          enabled: true,
          botToken: "123:abc",
          dmPolicy: "pairing",   // pairing | allowlist | open | disabled
          allowFrom: ["tg:123"], // only for allowlist/open
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Scegliere e configurare i modelli">
    Imposta il modello principale e gli eventuali fallback:

    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "anthropic/claude-sonnet-4-6",
            fallbacks: ["openai/gpt-5.4"],
          },
          models: {
            "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
            "openai/gpt-5.4": { alias: "GPT" },
          },
        },
      },
    }
    ```

    - `agents.defaults.models` definisce il catalogo dei modelli e agisce come allowlist per `/model`.
    - Usa `openclaw config set agents.defaults.models '<json>' --strict-json --merge` per aggiungere voci alla allowlist senza rimuovere i modelli esistenti. Le sostituzioni semplici che rimuoverebbero voci vengono rifiutate a meno che tu non passi `--replace`.
    - I riferimenti ai modelli usano il formato `provider/model` (ad esempio `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` controlla il downscaling delle immagini di trascrizione/strumenti (predefinito `1200`); valori più bassi di solito riducono l'uso di vision token nelle esecuzioni ricche di screenshot.
    - Vedi [Models CLI](/it/concepts/models) per cambiare modello in chat e [Model Failover](/it/concepts/model-failover) per il comportamento di rotazione auth e fallback.
    - Per provider personalizzati/self-hosted, vedi [provider personalizzati](/it/gateway/configuration-reference#custom-providers-and-base-urls) nel riferimento.

  </Accordion>

  <Accordion title="Controllare chi può inviare messaggi al bot">
    L'accesso DM è controllato per canale tramite `dmPolicy`:

    - `"pairing"` (predefinito): i mittenti sconosciuti ricevono un codice di pairing monouso da approvare
    - `"allowlist"`: solo i mittenti in `allowFrom` (o nell'archivio paired allow)
    - `"open"`: consente tutti i DM in ingresso (richiede `allowFrom: ["*"]`)
    - `"disabled"`: ignora tutti i DM

    Per i gruppi, usa `groupPolicy` + `groupAllowFrom` o allowlist specifiche del canale.

    Vedi il [riferimento completo](/it/gateway/configuration-reference#dm-and-group-access) per i dettagli per canale.

  </Accordion>

  <Accordion title="Configurare il gating delle menzioni nella chat di gruppo">
    I messaggi di gruppo richiedono per impostazione predefinita una **menzione**. Configura i pattern per agente:

    ```json5
    {
      agents: {
        list: [
          {
            id: "main",
            groupChat: {
              mentionPatterns: ["@openclaw", "openclaw"],
            },
          },
        ],
      },
      channels: {
        whatsapp: {
          groups: { "*": { requireMention: true } },
        },
      },
    }
    ```

    - **Menzioni dei metadati**: @-mention native (@ di WhatsApp tap-to-mention, @bot di Telegram, ecc.)
    - **Pattern di testo**: pattern regex sicuri in `mentionPatterns`
    - Vedi il [riferimento completo](/it/gateway/configuration-reference#group-chat-mention-gating) per override per canale e modalità self-chat.

  </Accordion>

  <Accordion title="Limitare le Skills per agente">
    Usa `agents.defaults.skills` per una base condivisa, poi sovrascrivi gli agenti specifici con `agents.list[].skills`:

    ```json5
    {
      agents: {
        defaults: {
          skills: ["github", "weather"],
        },
        list: [
          { id: "writer" }, // inherits github, weather
          { id: "docs", skills: ["docs-search"] }, // replaces defaults
          { id: "locked-down", skills: [] }, // no skills
        ],
      },
    }
    ```

    - Ometti `agents.defaults.skills` per Skills senza restrizioni per impostazione predefinita.
    - Ometti `agents.list[].skills` per ereditare i valori predefiniti.
    - Imposta `agents.list[].skills: []` per nessuna Skills.
    - Vedi [Skills](/it/tools/skills), [Configurazione Skills](/it/tools/skills-config) e
      il [Riferimento configurazione](/it/gateway/configuration-reference#agents-defaults-skills).

  </Accordion>

  <Accordion title="Regolare il monitoraggio dello stato di salute dei canali del gateway">
    Controlla quanto aggressivamente il gateway riavvia i canali che sembrano obsoleti:

    ```json5
    {
      gateway: {
        channelHealthCheckMinutes: 5,
        channelStaleEventThresholdMinutes: 30,
        channelMaxRestartsPerHour: 10,
      },
      channels: {
        telegram: {
          healthMonitor: { enabled: false },
          accounts: {
            alerts: {
              healthMonitor: { enabled: true },
            },
          },
        },
      },
    }
    ```

    - Imposta `gateway.channelHealthCheckMinutes: 0` per disabilitare globalmente i riavvii del monitoraggio dello stato di salute.
    - `channelStaleEventThresholdMinutes` deve essere maggiore o uguale all'intervallo di controllo.
    - Usa `channels.<provider>.healthMonitor.enabled` o `channels.<provider>.accounts.<id>.healthMonitor.enabled` per disabilitare i riavvii automatici per un canale o account senza disabilitare il monitor globale.
    - Vedi [Controlli di salute](/it/gateway/health) per il debug operativo e il [riferimento completo](/it/gateway/configuration-reference#gateway) per tutti i campi.

  </Accordion>

  <Accordion title="Configurare sessioni e reset">
    Le sessioni controllano la continuità e l'isolamento della conversazione:

    ```json5
    {
      session: {
        dmScope: "per-channel-peer",  // recommended for multi-user
        threadBindings: {
          enabled: true,
          idleHours: 24,
          maxAgeHours: 0,
        },
        reset: {
          mode: "daily",
          atHour: 4,
          idleMinutes: 120,
        },
      },
    }
    ```

    - `dmScope`: `main` (condiviso) | `per-peer` | `per-channel-peer` | `per-account-channel-peer`
    - `threadBindings`: valori predefiniti globali per l'instradamento delle sessioni associate ai thread (Discord supporta `/focus`, `/unfocus`, `/agents`, `/session idle` e `/session max-age`).
    - Vedi [Gestione delle sessioni](/it/concepts/session) per ambito, collegamenti di identità e policy di invio.
    - Vedi il [riferimento completo](/it/gateway/configuration-reference#session) per tutti i campi.

  </Accordion>

  <Accordion title="Abilitare il sandboxing">
    Esegui le sessioni agente in runtime sandbox isolati:

    ```json5
    {
      agents: {
        defaults: {
          sandbox: {
            mode: "non-main",  // off | non-main | all
            scope: "agent",    // session | agent | shared
          },
        },
      },
    }
    ```

    Costruisci prima l'immagine: `scripts/sandbox-setup.sh`

    Vedi [Sandboxing](/it/gateway/sandboxing) per la guida completa e il [riferimento completo](/it/gateway/configuration-reference#agentsdefaultssandbox) per tutte le opzioni.

  </Accordion>

  <Accordion title="Abilitare il push basato su relay per le build iOS ufficiali">
    Il push basato su relay viene configurato in `openclaw.json`.

    Imposta questo nella configurazione del gateway:

    ```json5
    {
      gateway: {
        push: {
          apns: {
            relay: {
              baseUrl: "https://relay.example.com",
              // Optional. Default: 10000
              timeoutMs: 10000,
            },
          },
        },
      },
    }
    ```

    Equivalente CLI:

    ```bash
    openclaw config set gateway.push.apns.relay.baseUrl https://relay.example.com
    ```

    Cosa fa:

    - Consente al gateway di inviare `push.test`, wake nudges e reconnect wakes tramite il relay esterno.
    - Usa un send grant con ambito registrazione inoltrato dall'app iOS associata. Il gateway non ha bisogno di un token relay valido per l'intero deployment.
    - Associa ogni registrazione supportata da relay all'identità gateway con cui l'app iOS è stata associata, così un altro gateway non può riutilizzare la registrazione archiviata.
    - Mantiene le build iOS locali/manuali su APNs diretto. Gli invii supportati da relay si applicano solo alle build ufficiali distribuite che si sono registrate tramite il relay.
    - Deve corrispondere all'URL base del relay incorporato nella build iOS ufficiale/TestFlight, così traffico di registrazione e di invio raggiungono lo stesso deployment relay.

    Flusso end-to-end:

    1. Installa una build iOS ufficiale/TestFlight compilata con lo stesso URL base del relay.
    2. Configura `gateway.push.apns.relay.baseUrl` sul gateway.
    3. Associa l'app iOS al gateway e lascia connettere sia le sessioni node sia quelle operatore.
    4. L'app iOS recupera l'identità del gateway, si registra presso il relay usando App Attest più la ricevuta dell'app, quindi pubblica il payload `push.apns.register` supportato da relay sul gateway associato.
    5. Il gateway memorizza l'handle relay e il send grant, poi li usa per `push.test`, wake nudges e reconnect wakes.

    Note operative:

    - Se passi l'app iOS a un gateway diverso, ricollega l'app così può pubblicare una nuova registrazione relay associata a quel gateway.
    - Se distribuisci una nuova build iOS che punta a un deployment relay differente, l'app aggiorna la registrazione relay in cache invece di riutilizzare la vecchia origine relay.

    Nota di compatibilità:

    - `OPENCLAW_APNS_RELAY_BASE_URL` e `OPENCLAW_APNS_RELAY_TIMEOUT_MS` funzionano ancora come override env temporanei.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` resta una via di fuga di sviluppo solo loopback; non rendere persistenti URL relay HTTP nella configurazione.

    Vedi [App iOS](/it/platforms/ios#relay-backed-push-for-official-builds) per il flusso end-to-end e [Flusso di autenticazione e trust](/it/platforms/ios#authentication-and-trust-flow) per il modello di sicurezza del relay.

  </Accordion>

  <Accordion title="Configurare Heartbeat (check-in periodici)">
    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "30m",
            target: "last",
          },
        },
      },
    }
    ```

    - `every`: stringa durata (`30m`, `2h`). Imposta `0m` per disabilitare.
    - `target`: `last` | `none` | `<channel-id>` (per esempio `discord`, `matrix`, `telegram` o `whatsapp`)
    - `directPolicy`: `allow` (predefinito) oppure `block` per destinazioni Heartbeat in stile DM
    - Vedi [Heartbeat](/it/gateway/heartbeat) per la guida completa.

  </Accordion>

  <Accordion title="Configurare job Cron">
    ```json5
    {
      cron: {
        enabled: true,
        maxConcurrentRuns: 2,
        sessionRetention: "24h",
        runLog: {
          maxBytes: "2mb",
          keepLines: 2000,
        },
      },
    }
    ```

    - `sessionRetention`: elimina da `sessions.json` le sessioni di esecuzione isolate completate (predefinito `24h`; imposta `false` per disabilitare).
    - `runLog`: pota `cron/runs/<jobId>.jsonl` per dimensione e righe mantenute.
    - Vedi [Job Cron](/it/automation/cron-jobs) per la panoramica delle funzionalità e gli esempi CLI.

  </Accordion>

  <Accordion title="Configurare Webhook (hook)">
    Abilita endpoint HTTP Webhook sul Gateway:

    ```json5
    {
      hooks: {
        enabled: true,
        token: "shared-secret",
        path: "/hooks",
        defaultSessionKey: "hook:ingress",
        allowRequestSessionKey: false,
        allowedSessionKeyPrefixes: ["hook:"],
        mappings: [
          {
            match: { path: "gmail" },
            action: "agent",
            agentId: "main",
            deliver: true,
          },
        ],
      },
    }
    ```

    Nota di sicurezza:
    - Tratta tutto il contenuto dei payload hook/Webhook come input non fidato.
    - Usa un `hooks.token` dedicato; non riutilizzare il token condiviso del Gateway.
    - L'autenticazione hook è solo header (`Authorization: Bearer ...` oppure `x-openclaw-token`); i token nella query string vengono rifiutati.
    - `hooks.path` non può essere `/`; mantieni l'ingresso Webhook su un sottopercorso dedicato come `/hooks`.
    - Mantieni disabilitati i flag di bypass del contenuto non sicuro (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`) a meno che tu non stia facendo debug strettamente limitato.
    - Se abiliti `hooks.allowRequestSessionKey`, imposta anche `hooks.allowedSessionKeyPrefixes` per limitare le chiavi di sessione selezionabili dal chiamante.
    - Per agenti guidati da hook, preferisci tier di modello moderni e robusti e una policy strumenti rigorosa (per esempio solo messaggistica più sandboxing quando possibile).

    Vedi il [riferimento completo](/it/gateway/configuration-reference#hooks) per tutte le opzioni di mapping e l'integrazione Gmail.

  </Accordion>

  <Accordion title="Configurare instradamento multi-agent">
    Esegui più agenti isolati con workspace e sessioni separate:

    ```json5
    {
      agents: {
        list: [
          { id: "home", default: true, workspace: "~/.openclaw/workspace-home" },
          { id: "work", workspace: "~/.openclaw/workspace-work" },
        ],
      },
      bindings: [
        { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
        { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
      ],
    }
    ```

    Vedi [Multi-Agent](/it/concepts/multi-agent) e il [riferimento completo](/it/gateway/configuration-reference#multi-agent-routing) per le regole di binding e i profili di accesso per agente.

  </Accordion>

  <Accordion title="Suddividere la configurazione in più file ($include)">
    Usa `$include` per organizzare configurazioni grandi:

    ```json5
    // ~/.openclaw/openclaw.json
    {
      gateway: { port: 18789 },
      agents: { $include: "./agents.json5" },
      broadcast: {
        $include: ["./clients/a.json5", "./clients/b.json5"],
      },
    }
    ```

    - **File singolo**: sostituisce l'oggetto contenitore
    - **Array di file**: deep-merge in ordine (vince l'ultimo)
    - **Chiavi sibling**: unite dopo gli include (sovrascrivono i valori inclusi)
    - **Include annidati**: supportati fino a 10 livelli di profondità
    - **Percorsi relativi**: risolti relativamente al file includente
    - **Scritture gestite da OpenClaw**: quando una scrittura modifica solo una sezione di primo livello
      supportata da un include a file singolo come `plugins: { $include: "./plugins.json5" }`,
      OpenClaw aggiorna quel file incluso e lascia intatto `openclaw.json`
    - **Write-through non supportato**: include root, array di include e include
      con override sibling falliscono in modo chiuso per le scritture gestite da OpenClaw invece
      di appiattire la configurazione
    - **Gestione errori**: errori chiari per file mancanti, errori di parsing e include circolari

  </Accordion>
</AccordionGroup>

## Hot reload della configurazione

Il Gateway osserva `~/.openclaw/openclaw.json` e applica automaticamente le modifiche — nella maggior parte dei casi non serve un riavvio manuale.

Le modifiche dirette al file vengono trattate come non fidate finché non vengono validate. Il watcher attende
che il churn di scrittura/rinomina temporanea dell'editor si stabilizzi, legge il file finale e rifiuta
le modifiche esterne non valide ripristinando la configurazione last-known-good. Le scritture di configurazione
gestite da OpenClaw usano lo stesso gate di schema prima di scrivere; clobber distruttivi come
la rimozione di `gateway.mode` o la riduzione del file a meno della metà vengono rifiutati
e salvati come `.rejected.*` per l'ispezione.

Se nei log vedi `Config auto-restored from last-known-good` oppure
`config reload restored last-known-good config`, ispeziona il file
`.clobbered.*` corrispondente accanto a `openclaw.json`, correggi il payload rifiutato, poi esegui
`openclaw config validate`. Vedi [Risoluzione dei problemi del Gateway](/it/gateway/troubleshooting#gateway-restored-last-known-good-config)
per la checklist di ripristino.

### Modalità di reload

| Modalità               | Comportamento                                                                          |
| ---------------------- | -------------------------------------------------------------------------------------- |
| **`hybrid`** (predefinita) | Applica a caldo subito le modifiche sicure. Riavvia automaticamente per quelle critiche. |
| **`hot`**              | Applica a caldo solo le modifiche sicure. Registra un avviso quando serve un riavvio — lo gestisci tu. |
| **`restart`**          | Riavvia il Gateway a ogni modifica della configurazione, sicura o meno.                |
| **`off`**              | Disabilita l'osservazione del file. Le modifiche hanno effetto al successivo riavvio manuale. |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Cosa viene applicato a caldo e cosa richiede un riavvio

La maggior parte dei campi viene applicata a caldo senza downtime. In modalità `hybrid`, le modifiche che richiedono riavvio vengono gestite automaticamente.

| Categoria            | Campi                                                             | Riavvio necessario? |
| ------------------- | ----------------------------------------------------------------- | --------------- |
| Canali            | `channels.*`, `web` (WhatsApp) — tutti i canali integrati e plugin | No              |
| Agente e modelli      | `agent`, `agents`, `models`, `routing`                            | No              |
| Automazione          | `hooks`, `cron`, `agent.heartbeat`                                | No              |
| Sessioni e messaggi | `session`, `messages`                                             | No              |
| Strumenti e contenuti multimediali       | `tools`, `browser`, `skills`, `audio`, `talk`                     | No              |
| UI e varie           | `ui`, `logging`, `identity`, `bindings`                           | No              |
| Server Gateway      | `gateway.*` (porta, bind, auth, tailscale, TLS, HTTP)              | **Sì**         |
| Infrastruttura      | `discovery`, `canvasHost`, `plugins`                              | **Sì**         |

<Note>
`gateway.reload` e `gateway.remote` sono eccezioni — modificarli **non** attiva un riavvio.
</Note>

### Pianificazione del reload

Quando modifichi un file sorgente referenziato tramite `$include`, OpenClaw pianifica
il reload a partire dal layout scritto nei sorgenti, non dalla vista appiattita in memoria.
Questo mantiene prevedibili le decisioni di hot reload (applicazione a caldo vs riavvio) anche quando una
singola sezione di primo livello vive nel proprio file incluso, come
`plugins: { $include: "./plugins.json5" }`. La pianificazione del reload fallisce in modo chiuso se il
layout sorgente è ambiguo.

## RPC di configurazione (aggiornamenti programmatici)

Per gli strumenti che scrivono la configurazione tramite l'API gateway, preferisci questo flusso:

- `config.schema.lookup` per ispezionare un sottoalbero (nodo di schema shallow + riepiloghi
  dei figli)
- `config.get` per recuperare lo snapshot corrente più `hash`
- `config.patch` per aggiornamenti parziali (JSON merge patch: gli oggetti si uniscono, `null`
  elimina, gli array sostituiscono)
- `config.apply` solo quando intendi sostituire l'intera configurazione
- `update.run` per self-update esplicito più riavvio

<Note>
Le scritture del control plane (`config.apply`, `config.patch`, `update.run`) sono
rate-limited a 3 richieste per 60 secondi per `deviceId+clientIp`. Le richieste di riavvio
vengono accorpate e poi applicano un cooldown di 30 secondi tra i cicli di riavvio.
</Note>

Esempio di patch parziale:

```bash
openclaw gateway call config.get --params '{}'  # capture payload.hash
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

Sia `config.apply` sia `config.patch` accettano `raw`, `baseHash`, `sessionKey`,
`note` e `restartDelayMs`. `baseHash` è obbligatorio per `config.patch` e
consigliato per `config.apply` quando una configurazione esiste già.

## Variabili d'ambiente

OpenClaw legge le variabili d'ambiente dal processo padre più:

- `.env` dalla directory di lavoro corrente (se presente)
- `~/.openclaw/.env` (fallback globale)

Nessuno dei due file sovrascrive variabili d'ambiente esistenti. Puoi anche impostare variabili d'ambiente inline nella configurazione:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Importazione env della shell (opzionale)">
  Se abilitato e le chiavi attese non sono impostate, OpenClaw esegue la tua login shell e importa solo le chiavi mancanti:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

Equivalente come variabile d'ambiente: `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="Sostituzione delle variabili d'ambiente nei valori di configurazione">
  Fai riferimento alle variabili d'ambiente in qualsiasi valore stringa della configurazione con `${VAR_NAME}`:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

Regole:

- Vengono abbinati solo nomi in maiuscolo: `[A-Z_][A-Z0-9_]*`
- Variabili mancanti/vuote generano un errore al caricamento
- Esegui l'escape con `$${VAR}` per output letterale
- Funziona dentro i file `$include`
- Sostituzione inline: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="SecretRef (env, file, exec)">
  Per i campi che supportano oggetti SecretRef, puoi usare:

```json5
{
  models: {
    providers: {
      openai: { apiKey: { source: "env", provider: "default", id: "OPENAI_API_KEY" } },
    },
  },
  skills: {
    entries: {
      "image-lab": {
        apiKey: {
          source: "file",
          provider: "filemain",
          id: "/skills/entries/image-lab/apiKey",
        },
      },
    },
  },
  channels: {
    googlechat: {
      serviceAccountRef: {
        source: "exec",
        provider: "vault",
        id: "channels/googlechat/serviceAccount",
      },
    },
  },
}
```

I dettagli di SecretRef (incluso `secrets.providers` per `env`/`file`/`exec`) sono in [Gestione dei segreti](/it/gateway/secrets).
I percorsi delle credenziali supportati sono elencati in [Superficie credenziali SecretRef](/it/reference/secretref-credential-surface).
</Accordion>

Vedi [Ambiente](/it/help/environment) per la precedenza completa e le sorgenti.

## Riferimento completo

Per il riferimento completo campo per campo, vedi **[Riferimento configurazione](/it/gateway/configuration-reference)**.

---

_Correlati: [Esempi di configurazione](/it/gateway/configuration-examples) · [Riferimento configurazione](/it/gateway/configuration-reference) · [Doctor](/it/gateway/doctor)_
