---
read_when:
    - Configurazione iniziale di OpenClaw
    - Cerchi pattern di configurazione comuni
    - Passare a sezioni specifiche della configurazione
summary: 'Panoramica della configurazione: attività comuni, configurazione rapida e collegamenti al riferimento completo'
title: Configurazione
x-i18n:
    generated_at: "2026-04-24T08:39:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7a47a2c02c37b012a8d8222d3f160634343090b633be722393bac2ebd6adc91c
    source_path: gateway/configuration.md
    workflow: 15
---

OpenClaw legge una configurazione facoltativa in <Tooltip tip="JSON5 supports comments and trailing commas">**JSON5**</Tooltip> da `~/.openclaw/openclaw.json`.
Il percorso della configurazione attiva deve essere un file regolare. I layout
di `openclaw.json` collegati tramite symlink non sono supportati per le scritture gestite da OpenClaw; una scrittura atomica può sostituire
il percorso invece di preservare il symlink. Se tieni la configurazione fuori dalla
directory di stato predefinita, punta `OPENCLAW_CONFIG_PATH` direttamente al file reale.

Se il file manca, OpenClaw usa valori predefiniti sicuri. Motivi comuni per aggiungere una configurazione:

- Collegare i canali e controllare chi può inviare messaggi al bot
- Impostare modelli, strumenti, sandboxing o automazione (Cron, hook)
- Regolare sessioni, media, rete o UI

Vedi il [riferimento completo](/it/gateway/configuration-reference) per ogni campo disponibile.

<Tip>
**Sei nuovo alla configurazione?** Inizia con `openclaw onboard` per una configurazione interattiva, oppure consulta la guida [Esempi di configurazione](/it/gateway/configuration-examples) per configurazioni complete da copiare e incollare.
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
    La Control UI esegue il rendering di un modulo a partire dallo schema di configurazione live, inclusi i metadati documentali dei campi
    `title` / `description` più gli schemi di plugin e canale quando
    disponibili, con un editor **Raw JSON** come via di fuga. Per le UI
    di drill-down e altri strumenti, il Gateway espone anche `config.schema.lookup` per
    recuperare un singolo nodo di schema con ambito di percorso più i riepiloghi dei figli immediati.
  </Tab>
  <Tab title="Modifica diretta">
    Modifica direttamente `~/.openclaw/openclaw.json`. Il Gateway osserva il file e applica automaticamente le modifiche (vedi [hot reload](#config-hot-reload)).
  </Tab>
</Tabs>

## Validazione rigorosa

<Warning>
OpenClaw accetta solo configurazioni che corrispondono completamente allo schema. Chiavi sconosciute, tipi malformati o valori non validi fanno sì che il Gateway **si rifiuti di avviarsi**. L'unica eccezione a livello root è `$schema` (stringa), così gli editor possono collegare metadati JSON Schema.
</Warning>

`openclaw config schema` stampa il JSON Schema canonico usato da Control UI
e dalla validazione. `config.schema.lookup` recupera un singolo nodo con ambito di percorso più
i riepiloghi dei figli per strumenti di drill-down. I metadati documentali dei campi `title`/`description`
si propagano attraverso oggetti annidati, wildcard (`*`), elementi di array (`[]`) e rami `anyOf`/
`oneOf`/`allOf`. Gli schemi runtime di plugin e canale vengono uniti quando il
registro dei manifest è caricato.

Quando la validazione fallisce:

- Il Gateway non si avvia
- Funzionano solo i comandi diagnostici (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Esegui `openclaw doctor` per vedere i problemi esatti
- Esegui `openclaw doctor --fix` (o `--yes`) per applicare le riparazioni

Il Gateway mantiene una copia attendibile dell'ultima configurazione valida dopo ogni avvio riuscito.
Se `openclaw.json` in seguito non supera la validazione (oppure perde `gateway.mode`, si riduce
bruscamente o ha una riga di log estranea anteposta), OpenClaw preserva il file
rotto come `.clobbered.*`, ripristina l'ultima copia valida e registra il motivo
del ripristino. Anche il turno successivo dell'agente riceve un avviso system-event così l'agente principale non riscrive ciecamente la configurazione ripristinata. La promozione a ultima configurazione valida
viene saltata quando una candidata contiene placeholder di segreti redatti come `***`.

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
          allowFrom: ["tg:123"], // solo per allowlist/open
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Scegliere e configurare i modelli">
    Imposta il modello primario e i fallback facoltativi:

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
    - I riferimenti ai modelli usano il formato `provider/model` (es. `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` controlla il ridimensionamento delle immagini per trascrizioni/strumenti (predefinito `1200`); valori più bassi di solito riducono l'uso di vision-token nelle esecuzioni ricche di screenshot.
    - Vedi [CLI Models](/it/concepts/models) per cambiare modello in chat e [Failover del modello](/it/concepts/model-failover) per la rotazione dell'auth e il comportamento dei fallback.
    - Per provider personalizzati/self-hosted, vedi [Provider personalizzati](/it/gateway/config-tools#custom-providers-and-base-urls) nel riferimento.

  </Accordion>

  <Accordion title="Controllare chi può inviare messaggi al bot">
    L'accesso DM è controllato per canale tramite `dmPolicy`:

    - `"pairing"` (predefinito): i mittenti sconosciuti ricevono un codice di associazione monouso da approvare
    - `"allowlist"`: solo i mittenti in `allowFrom` (o nell'archivio delle allowlist associate)
    - `"open"`: consente tutti i DM in ingresso (richiede `allowFrom: ["*"]`)
    - `"disabled"`: ignora tutti i DM

    Per i gruppi, usa `groupPolicy` + `groupAllowFrom` o allowlist specifiche del canale.

    Vedi il [riferimento completo](/it/gateway/config-channels#dm-and-group-access) per i dettagli per canale.

  </Accordion>

  <Accordion title="Impostare il vincolo delle menzioni nella chat di gruppo">
    I messaggi di gruppo per impostazione predefinita **richiedono una menzione**. Configura i pattern per agente:

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

    - **Menzioni nei metadati**: menzioni @ native (tap-to-mention in WhatsApp, @bot in Telegram, ecc.)
    - **Pattern di testo**: pattern regex sicuri in `mentionPatterns`
    - Vedi il [riferimento completo](/it/gateway/config-channels#group-chat-mention-gating) per gli override per canale e la modalità self-chat.

  </Accordion>

  <Accordion title="Limitare gli Skills per agente">
    Usa `agents.defaults.skills` per una baseline condivisa, poi sovrascrivi gli
    agenti specifici con `agents.list[].skills`:

    ```json5
    {
      agents: {
        defaults: {
          skills: ["github", "weather"],
        },
        list: [
          { id: "writer" }, // eredita github, weather
          { id: "docs", skills: ["docs-search"] }, // sostituisce i predefiniti
          { id: "locked-down", skills: [] }, // nessuno Skills
        ],
      },
    }
    ```

    - Ometti `agents.defaults.skills` per avere Skills senza restrizioni per impostazione predefinita.
    - Ometti `agents.list[].skills` per ereditare i predefiniti.
    - Imposta `agents.list[].skills: []` per non avere Skills.
    - Vedi [Skills](/it/tools/skills), [Configurazione Skills](/it/tools/skills-config) e
      il [Riferimento della configurazione](/it/gateway/config-agents#agents-defaults-skills).

  </Accordion>

  <Accordion title="Regolare il monitoraggio dello stato dei canali del Gateway">
    Controlla quanto aggressivamente il Gateway riavvia i canali che sembrano non aggiornati:

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

    - Imposta `gateway.channelHealthCheckMinutes: 0` per disabilitare globalmente i riavvii del monitoraggio dello stato.
    - `channelStaleEventThresholdMinutes` dovrebbe essere maggiore o uguale all'intervallo di controllo.
    - Usa `channels.<provider>.healthMonitor.enabled` o `channels.<provider>.accounts.<id>.healthMonitor.enabled` per disabilitare i riavvii automatici per un canale o account senza disabilitare il monitor globale.
    - Vedi [Controlli dello stato](/it/gateway/health) per il debug operativo e il [riferimento completo](/it/gateway/configuration-reference#gateway) per tutti i campi.

  </Accordion>

  <Accordion title="Configurare sessioni e reset">
    Le sessioni controllano continuità e isolamento della conversazione:

    ```json5
    {
      session: {
        dmScope: "per-channel-peer",  // consigliato per multiutente
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
    - `threadBindings`: valori predefiniti globali per l'instradamento delle sessioni vincolate ai thread (Discord supporta `/focus`, `/unfocus`, `/agents`, `/session idle` e `/session max-age`).
    - Vedi [Gestione delle sessioni](/it/concepts/session) per ambito, collegamenti di identità e policy di invio.
    - Vedi il [riferimento completo](/it/gateway/config-agents#session) per tutti i campi.

  </Accordion>

  <Accordion title="Abilitare il sandboxing">
    Esegui le sessioni dell'agente in runtime sandbox isolati:

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

    Vedi [Sandboxing](/it/gateway/sandboxing) per la guida completa e il [riferimento completo](/it/gateway/config-agents#agentsdefaultssandbox) per tutte le opzioni.

  </Accordion>

  <Accordion title="Abilitare il push basato su relay per build iOS ufficiali">
    Il push basato su relay si configura in `openclaw.json`.

    Imposta questo nella configurazione del Gateway:

    ```json5
    {
      gateway: {
        push: {
          apns: {
            relay: {
              baseUrl: "https://relay.example.com",
              // Facoltativo. Predefinito: 10000
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

    Cosa fa questo:

    - Consente al Gateway di inviare `push.test`, wake nudges e reconnect wakes tramite il relay esterno.
    - Usa un permesso di invio con ambito di registrazione inoltrato dall'app iOS associata. Il Gateway non ha bisogno di un token relay valido per l'intero deployment.
    - Associa ogni registrazione supportata da relay all'identità del Gateway con cui l'app iOS è stata associata, così un altro Gateway non può riutilizzare la registrazione memorizzata.
    - Mantiene le build iOS locali/manuali su APNs diretto. Gli invii supportati da relay si applicano solo alle build ufficiali distribuite che si sono registrate tramite il relay.
    - Deve corrispondere al base URL del relay incorporato nella build iOS ufficiale/TestFlight, così traffico di registrazione e invio raggiungono lo stesso deployment relay.

    Flusso end-to-end:

    1. Installa una build iOS ufficiale/TestFlight compilata con lo stesso base URL del relay.
    2. Configura `gateway.push.apns.relay.baseUrl` sul Gateway.
    3. Associa l'app iOS al Gateway e consenti sia alla sessione Node sia a quella operator di connettersi.
    4. L'app iOS recupera l'identità del Gateway, si registra presso il relay usando App Attest più la ricevuta dell'app, quindi pubblica il payload `push.apns.register` supportato da relay al Gateway associato.
    5. Il Gateway memorizza l'handle relay e il permesso di invio, poi li usa per `push.test`, wake nudges e reconnect wakes.

    Note operative:

    - Se passi l'app iOS a un altro Gateway, riconnetti l'app così può pubblicare una nuova registrazione relay associata a quel Gateway.
    - Se distribuisci una nuova build iOS che punta a un deployment relay diverso, l'app aggiorna la registrazione relay memorizzata invece di riutilizzare il vecchio relay origin.

    Nota sulla compatibilità:

    - `OPENCLAW_APNS_RELAY_BASE_URL` e `OPENCLAW_APNS_RELAY_TIMEOUT_MS` funzionano ancora come override env temporanei.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` resta una via di fuga di sviluppo solo loopback; non mantenere URL relay HTTP nella configurazione.

    Vedi [App iOS](/it/platforms/ios#relay-backed-push-for-official-builds) per il flusso end-to-end e [Flusso di autenticazione e trust](/it/platforms/ios#authentication-and-trust-flow) per il modello di sicurezza del relay.

  </Accordion>

  <Accordion title="Impostare Heartbeat (check-in periodici)">
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
    - `directPolicy`: `allow` (predefinito) o `block` per target Heartbeat in stile DM
    - Vedi [Heartbeat](/it/gateway/heartbeat) per la guida completa.

  </Accordion>

  <Accordion title="Configurare processi Cron">
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
    - `runLog`: elimina `cron/runs/<jobId>.jsonl` in base a dimensione e righe mantenute.
    - Vedi [Processi Cron](/it/automation/cron-jobs) per la panoramica delle funzionalità e gli esempi CLI.

  </Accordion>

  <Accordion title="Impostare Webhook (hook)">
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
    - Tratta tutto il contenuto del payload hook/Webhook come input non attendibile.
    - Usa un `hooks.token` dedicato; non riutilizzare il token condiviso del Gateway.
    - L'autenticazione hook è solo via header (`Authorization: Bearer ...` o `x-openclaw-token`); i token nella query string vengono rifiutati.
    - `hooks.path` non può essere `/`; mantieni l'ingresso Webhook su un sottopercorso dedicato come `/hooks`.
    - Tieni disabilitati i flag di bypass dei contenuti non sicuri (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`) a meno che tu non stia facendo debug con ambito molto limitato.
    - Se abiliti `hooks.allowRequestSessionKey`, imposta anche `hooks.allowedSessionKeyPrefixes` per delimitare le chiavi di sessione selezionate dal chiamante.
    - Per agenti guidati da hook, preferisci livelli di modello moderni e robusti e una policy degli strumenti rigorosa (per esempio solo messaggistica più sandboxing dove possibile).

    Vedi il [riferimento completo](/it/gateway/configuration-reference#hooks) per tutte le opzioni di mapping e l'integrazione Gmail.

  </Accordion>

  <Accordion title="Configurare l'instradamento multi-agente">
    Esegui più agenti isolati con workspace e sessioni separati:

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

    Vedi [Multi-Agent](/it/concepts/multi-agent) e il [riferimento completo](/it/gateway/config-agents#multi-agent-routing) per le regole di binding e i profili di accesso per agente.

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
    - **Array di file**: deep-merge in ordine (l'ultimo vince)
    - **Chiavi sibling**: unite dopo gli include (sovrascrivono i valori inclusi)
    - **Include annidati**: supportati fino a 10 livelli di profondità
    - **Percorsi relativi**: risolti rispetto al file che include
    - **Scritture gestite da OpenClaw**: quando una scrittura modifica solo una sezione di primo livello
      supportata da un include a file singolo come `plugins: { $include: "./plugins.json5" }`,
      OpenClaw aggiorna quel file incluso e lascia intatto `openclaw.json`
    - **Write-through non supportato**: include di root, array di include e include
      con override sibling falliscono in modo chiuso per le scritture gestite da OpenClaw invece
      di appiattire la configurazione
    - **Gestione degli errori**: errori chiari per file mancanti, errori di parsing e include circolari

  </Accordion>
</AccordionGroup>

## Hot reload della configurazione

Il Gateway osserva `~/.openclaw/openclaw.json` e applica automaticamente le modifiche — nella maggior parte dei casi non serve alcun riavvio manuale.

Le modifiche dirette al file vengono trattate come non attendibili finché non superano la validazione. Il watcher attende
che il churn di scrittura temporanea/rinomina dell'editor si stabilizzi, legge il file finale e rifiuta
le modifiche esterne non valide ripristinando l'ultima configurazione valida. Le
scritture di configurazione gestite da OpenClaw usano lo stesso controllo di schema prima della scrittura; clobber distruttivi come
la rimozione di `gateway.mode` o la riduzione del file di oltre la metà vengono rifiutati
e salvati come `.rejected.*` per l'ispezione.

Se nei log vedi `Config auto-restored from last-known-good` oppure
`config reload restored last-known-good config`, ispeziona il file
`.clobbered.*` corrispondente accanto a `openclaw.json`, correggi il payload rifiutato, poi esegui
`openclaw config validate`. Vedi [Risoluzione dei problemi del Gateway](/it/gateway/troubleshooting#gateway-restored-last-known-good-config)
per la checklist di recupero.

### Modalità di reload

| Modalità               | Comportamento                                                                          |
| ---------------------- | -------------------------------------------------------------------------------------- |
| **`hybrid`** (predefinita) | Applica a caldo immediatamente le modifiche sicure. Riavvia automaticamente per quelle critiche. |
| **`hot`**              | Applica a caldo solo le modifiche sicure. Registra un avviso quando serve un riavvio — lo gestisci tu. |
| **`restart`**          | Riavvia il Gateway a ogni modifica della configurazione, sicura o meno.                |
| **`off`**              | Disabilita l'osservazione del file. Le modifiche entrano in vigore al successivo riavvio manuale. |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Cosa si applica a caldo e cosa richiede un riavvio

La maggior parte dei campi si applica a caldo senza downtime. In modalità `hybrid`, le modifiche che richiedono il riavvio vengono gestite automaticamente.

| Categoria            | Campi                                                             | Riavvio necessario? |
| -------------------- | ----------------------------------------------------------------- | ------------------- |
| Canali               | `channels.*`, `web` (WhatsApp) — tutti i canali integrati e dei plugin | No                  |
| Agente e modelli     | `agent`, `agents`, `models`, `routing`                            | No                  |
| Automazione          | `hooks`, `cron`, `agent.heartbeat`                                | No                  |
| Sessioni e messaggi  | `session`, `messages`                                             | No                  |
| Strumenti e media    | `tools`, `browser`, `skills`, `audio`, `talk`                     | No                  |
| UI e varie           | `ui`, `logging`, `identity`, `bindings`                           | No                  |
| Server Gateway       | `gateway.*` (porta, bind, auth, Tailscale, TLS, HTTP)             | **Sì**              |
| Infrastruttura       | `discovery`, `canvasHost`, `plugins`                              | **Sì**              |

<Note>
`gateway.reload` e `gateway.remote` sono eccezioni: modificarli **non** attiva un riavvio.
</Note>

### Pianificazione del reload

Quando modifichi un file sorgente referenziato tramite `$include`, OpenClaw pianifica
il reload dal layout scritto nella sorgente, non dalla vista in-memory appiattita.
Questo mantiene prevedibili le decisioni di hot-reload (applicazione a caldo vs riavvio) anche quando una
singola sezione di primo livello vive nel proprio file incluso come
`plugins: { $include: "./plugins.json5" }`. La pianificazione del reload fallisce in modo chiuso se il
layout della sorgente è ambiguo.

## RPC di configurazione (aggiornamenti programmatici)

Per gli strumenti che scrivono la configurazione tramite l'API Gateway, preferisci questo flusso:

- `config.schema.lookup` per ispezionare un sottoalbero (nodo di schema shallow + riepiloghi
  dei figli)
- `config.get` per recuperare lo snapshot corrente più `hash`
- `config.patch` per aggiornamenti parziali (JSON merge patch: gli oggetti si uniscono, `null`
  elimina, gli array sostituiscono)
- `config.apply` solo quando intendi sostituire l'intera configurazione
- `update.run` per self-update esplicito più riavvio

<Note>
Le scritture del control plane (`config.apply`, `config.patch`, `update.run`) sono
rate-limited a 3 richieste ogni 60 secondi per `deviceId+clientIp`. Le richieste di
riavvio vengono aggregate e poi viene applicato un cooldown di 30 secondi tra i cicli di riavvio.
</Note>

Esempio di patch parziale:

```bash
openclaw gateway call config.get --params '{}'  # cattura payload.hash
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

Sia `config.apply` sia `config.patch` accettano `raw`, `baseHash`, `sessionKey`,
`note` e `restartDelayMs`. `baseHash` è obbligatorio per entrambi i metodi quando una
configurazione esiste già.

## Variabili d'ambiente

OpenClaw legge le variabili env dal processo padre più:

- `.env` dalla directory di lavoro corrente (se presente)
- `~/.openclaw/.env` (fallback globale)

Nessuno dei due file sovrascrive le variabili env esistenti. Puoi anche impostare variabili env inline nella configurazione:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Importazione env della shell (facoltativa)">
  Se abilitato e le chiavi attese non sono impostate, OpenClaw esegue la tua shell di login e importa solo le chiavi mancanti:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

Equivalente variabile env: `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="Sostituzione di variabili env nei valori di configurazione">
  Fai riferimento alle variabili env in qualsiasi valore stringa della configurazione con `${VAR_NAME}`:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

Regole:

- Vengono riconosciuti solo nomi maiuscoli che corrispondono a: `[A-Z_][A-Z0-9_]*`
- Variabili mancanti/vuote generano un errore al caricamento
- Usa l'escape `$${VAR}` per output letterale
- Funziona dentro i file `$include`
- Sostituzione inline: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="Riferimenti ai segreti (env, file, exec)">
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

I dettagli di SecretRef (inclusi `secrets.providers` per `env`/`file`/`exec`) sono in [Gestione dei segreti](/it/gateway/secrets).
I percorsi delle credenziali supportati sono elencati in [Superficie delle credenziali SecretRef](/it/reference/secretref-credential-surface).
</Accordion>

Vedi [Ambiente](/it/help/environment) per la precedenza completa e le sorgenti.

## Riferimento completo

Per il riferimento completo campo per campo, vedi **[Riferimento della configurazione](/it/gateway/configuration-reference)**.

---

_Correlati: [Esempi di configurazione](/it/gateway/configuration-examples) · [Riferimento della configurazione](/it/gateway/configuration-reference) · [Doctor](/it/gateway/doctor)_

## Correlati

- [Riferimento della configurazione](/it/gateway/configuration-reference)
- [Esempi di configurazione](/it/gateway/configuration-examples)
- [Runbook del Gateway](/it/gateway)
