---
read_when:
    - Configurare OpenClaw per la prima volta
    - Ricerca di schemi di configurazione comuni
    - Navigare verso sezioni specifiche della configurazione
summary: 'Panoramica della configurazione: attività comuni, configurazione rapida e link al riferimento completo'
title: Configurazione
x-i18n:
    generated_at: "2026-05-10T19:34:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 023ce17d31ed16e061516a2026ac6c31fd8716548e230d27a7965b9a2d8c59c1
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw legge una configurazione opzionale <Tooltip tip="JSON5 supporta commenti e virgole finali">**JSON5**</Tooltip> da `~/.openclaw/openclaw.json`.
Il percorso della configurazione attiva deve essere un file regolare. I layout
`openclaw.json` con symlink non sono supportati per le scritture gestite da OpenClaw;
una scrittura atomica può sostituire il percorso invece di preservare il symlink.
Se mantieni la configurazione fuori dalla directory di stato predefinita, punta
`OPENCLAW_CONFIG_PATH` direttamente al file reale.

Se il file manca, OpenClaw usa valori predefiniti sicuri. Motivi comuni per aggiungere una configurazione:

- Collegare canali e controllare chi può inviare messaggi al bot
- Impostare modelli, strumenti, sandboxing o automazione (cron, hook)
- Regolare sessioni, media, networking o UI

Vedi il [riferimento completo](/it/gateway/configuration-reference) per ogni campo disponibile.

Agenti e automazione dovrebbero usare `config.schema.lookup` per la documentazione
esatta a livello di campo prima di modificare la configurazione. Usa questa pagina
per indicazioni orientate alle attività e [Riferimento configurazione](/it/gateway/configuration-reference)
per la mappa più ampia dei campi e dei valori predefiniti.

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
    openclaw onboard       # full onboarding flow
    openclaw configure     # config wizard
    ```
  </Tab>
  <Tab title="CLI (comandi rapidi)">
    ```bash
    openclaw config get agents.defaults.workspace
    openclaw config set agents.defaults.heartbeat.every "2h"
    openclaw config unset plugins.entries.brave.config.webSearch.apiKey
    ```
  </Tab>
  <Tab title="UI di controllo">
    Apri [http://127.0.0.1:18789](http://127.0.0.1:18789) e usa la scheda **Config**.
    La UI di controllo genera un modulo dallo schema della configurazione live,
    inclusi i metadati di documentazione dei campi `title` / `description` più
    gli schemi di plugin e canali quando disponibili, con un editor **Raw JSON**
    come via di uscita. Per UI di approfondimento e altri strumenti, il gateway
    espone anche `config.schema.lookup` per recuperare un nodo schema circoscritto
    a un percorso più i riepiloghi dei figli immediati.
  </Tab>
  <Tab title="Modifica diretta">
    Modifica direttamente `~/.openclaw/openclaw.json`. Il Gateway osserva il file e applica automaticamente le modifiche (vedi [ricaricamento a caldo](#config-hot-reload)).
  </Tab>
</Tabs>

## Validazione rigorosa

<Warning>
OpenClaw accetta solo configurazioni che corrispondono completamente allo schema. Chiavi sconosciute, tipi malformati o valori non validi fanno sì che il Gateway **rifiuti di avviarsi**. L'unica eccezione a livello radice è `$schema` (stringa), così gli editor possono allegare metadati JSON Schema.
</Warning>

`openclaw config schema` stampa lo JSON Schema canonico usato dalla UI di controllo
e dalla validazione. `config.schema.lookup` recupera un singolo nodo circoscritto
a un percorso più i riepiloghi dei figli per strumenti di approfondimento. I metadati
di documentazione dei campi `title`/`description` vengono propagati attraverso
oggetti annidati, wildcard (`*`), elementi di array (`[]`) e rami `anyOf`/
`oneOf`/`allOf`. Gli schemi runtime di plugin e canali vengono uniti quando il
registro dei manifest viene caricato.

Quando la validazione fallisce:

- Il Gateway non si avvia
- Funzionano solo i comandi diagnostici (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Esegui `openclaw doctor` per vedere i problemi esatti
- Esegui `openclaw doctor --fix` (o `--yes`) per applicare le riparazioni

Il Gateway mantiene una copia attendibile dell'ultima configurazione valida dopo
ogni avvio riuscito, ma l'avvio e il ricaricamento a caldo non la ripristinano
automaticamente. Se `openclaw.json` non supera la validazione (inclusa la validazione
locale del plugin), l'avvio del Gateway fallisce oppure il ricaricamento viene
saltato e il runtime corrente mantiene l'ultima configurazione accettata.
Esegui `openclaw doctor --fix` (o `--yes`) per riparare una configurazione con
prefissi/sovrascritta o ripristinare la copia dell'ultima configurazione valida.
La promozione a ultima configurazione valida viene saltata quando un candidato
contiene segnaposto di segreti redatti come `***`.

## Attività comuni

<AccordionGroup>
  <Accordion title="Configurare un canale (WhatsApp, Telegram, Discord, ecc.)">
    Ogni canale ha la propria sezione di configurazione sotto `channels.<provider>`. Vedi la pagina dedicata del canale per i passaggi di configurazione:

    - [WhatsApp](/it/channels/whatsapp) - `channels.whatsapp`
    - [Telegram](/it/channels/telegram) - `channels.telegram`
    - [Discord](/it/channels/discord) - `channels.discord`
    - [Feishu](/it/channels/feishu) - `channels.feishu`
    - [Google Chat](/it/channels/googlechat) - `channels.googlechat`
    - [Microsoft Teams](/it/channels/msteams) - `channels.msteams`
    - [Slack](/it/channels/slack) - `channels.slack`
    - [Signal](/it/channels/signal) - `channels.signal`
    - [iMessage](/it/channels/imessage) - `channels.imessage`
    - [Mattermost](/it/channels/mattermost) - `channels.mattermost`

    Tutti i canali condividono lo stesso schema di criterio DM:

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
    Imposta il modello principale e i fallback opzionali:

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

    - `agents.defaults.models` definisce il catalogo dei modelli e funge da allowlist per `/model`; le voci `provider/*` filtrano `/model`, `/models` e i selettori di modello ai provider selezionati pur continuando a usare la scoperta dinamica dei modelli.
    - Usa `openclaw config set agents.defaults.models '<json>' --strict-json --merge` per aggiungere voci alla allowlist senza rimuovere i modelli esistenti. Le sostituzioni semplici che rimuoverebbero voci vengono rifiutate a meno che tu non passi `--replace`.
    - I riferimenti ai modelli usano il formato `provider/model` (ad es. `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` controlla il ridimensionamento delle immagini di transcript/strumenti (predefinito `1200`); valori più bassi di solito riducono l'uso di token vision nelle esecuzioni ricche di screenshot.
    - Vedi [CLI modelli](/it/concepts/models) per cambiare modello nella chat e [Failover modello](/it/concepts/model-failover) per la rotazione dell'autenticazione e il comportamento di fallback.
    - Per provider personalizzati/self-hosted, vedi [Provider personalizzati](/it/gateway/config-tools#custom-providers-and-base-urls) nel riferimento.

  </Accordion>

  <Accordion title="Controllare chi può inviare messaggi al bot">
    L'accesso DM è controllato per canale tramite `dmPolicy`:

    - `"pairing"` (predefinito): i mittenti sconosciuti ricevono un codice di pairing monouso da approvare
    - `"allowlist"`: solo mittenti in `allowFrom` (o nello store degli abbinamenti consentiti)
    - `"open"`: consente tutti i DM in ingresso (richiede `allowFrom: ["*"]`)
    - `"disabled"`: ignora tutti i DM

    Per i gruppi, usa `groupPolicy` + `groupAllowFrom` oppure allowlist specifiche del canale.

    Vedi il [riferimento completo](/it/gateway/config-channels#dm-and-group-access) per i dettagli per canale.

  </Accordion>

  <Accordion title="Configurare il gating delle menzioni nelle chat di gruppo">
    I messaggi di gruppo richiedono per impostazione predefinita una **menzione obbligatoria**. Configura i pattern di attivazione per agente e mantieni le risposte visibili nelle stanze sul percorso predefinito dello strumento messaggi, a meno che tu non voglia intenzionalmente le risposte finali automatiche legacy:

    ```json5
    {
      messages: {
        visibleReplies: "automatic", // set "message_tool" to require message-tool sends everywhere
        groupChat: {
          visibleReplies: "message_tool", // default; use "automatic" for legacy room replies
        },
      },
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

    - **Menzioni nei metadati**: @-menzioni native (WhatsApp tap-to-mention, Telegram @bot, ecc.)
    - **Pattern di testo**: pattern regex sicuri in `mentionPatterns`
    - **Risposte visibili**: `messages.visibleReplies` può richiedere globalmente gli invii tramite strumento messaggi; `messages.groupChat.visibleReplies` lo sovrascrive per gruppi/canali.
    - Vedi il [riferimento completo](/it/gateway/config-channels#group-chat-mention-gating) per le modalità di risposta visibile, le sovrascritture per canale e la modalità self-chat.

  </Accordion>

  <Accordion title="Limitare le Skills per agente">
    Usa `agents.defaults.skills` per una baseline condivisa, quindi sovrascrivi
    agenti specifici con `agents.list[].skills`:

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
      il [Riferimento configurazione](/it/gateway/config-agents#agents-defaults-skills).

  </Accordion>

  <Accordion title="Regolare il monitoraggio dello stato dei canali del gateway">
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

    - Imposta `gateway.channelHealthCheckMinutes: 0` per disabilitare globalmente i riavvii del monitoraggio dello stato.
    - `channelStaleEventThresholdMinutes` dovrebbe essere maggiore o uguale all'intervallo di controllo.
    - Usa `channels.<provider>.healthMonitor.enabled` o `channels.<provider>.accounts.<id>.healthMonitor.enabled` per disabilitare i riavvii automatici per un canale o un account senza disabilitare il monitor globale.
    - Vedi [Controlli di stato](/it/gateway/health) per il debug operativo e il [riferimento completo](/it/gateway/configuration-reference#gateway) per tutti i campi.

  </Accordion>

  <Accordion title="Regolare il timeout dell'handshake WebSocket del gateway">
    Dai ai client locali più tempo per completare l'handshake WebSocket pre-auth
    su host sotto carico o a bassa potenza:

    ```json5
    {
      gateway: {
        handshakeTimeoutMs: 30000,
      },
    }
    ```

    - Il valore predefinito è `15000` millisecondi.
    - `OPENCLAW_HANDSHAKE_TIMEOUT_MS` continua ad avere la precedenza per sovrascritture una tantum di servizio o shell.
    - Preferisci prima correggere stalli di avvio/event loop; questa manopola è per host sani ma lenti durante il warmup.

  </Accordion>

  <Accordion title="Configurare sessioni e reset">
    Le sessioni controllano continuità e isolamento della conversazione:

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
    - `threadBindings`: valori predefiniti globali per l'instradamento delle sessioni vincolate al thread (Discord supporta `/focus`, `/unfocus`, `/agents`, `/session idle` e `/session max-age`).
    - Vedi [Gestione delle sessioni](/it/concepts/session) per ambito, collegamenti di identità e criterio di invio.
    - Vedi [riferimento completo](/it/gateway/config-agents#session) per tutti i campi.

  </Accordion>

  <Accordion title="Abilita il sandboxing">
    Esegui le sessioni degli agenti in runtime sandbox isolati:

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

    Costruisci prima l'immagine: da un checkout del sorgente esegui `scripts/sandbox-setup.sh`, oppure da un'installazione npm vedi il comando inline `docker build` in [Sandboxing § Immagini e configurazione](/it/gateway/sandboxing#images-and-setup).

    Vedi [Sandboxing](/it/gateway/sandboxing) per la guida completa e [riferimento completo](/it/gateway/config-agents#agentsdefaultssandbox) per tutte le opzioni.

  </Accordion>

  <Accordion title="Abilita le push supportate da relay per le build iOS ufficiali">
    Le push supportate da relay sono configurate in `openclaw.json`.

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

    - Consente al gateway di inviare `push.test`, solleciti di riattivazione e riattivazioni di riconnessione tramite il relay esterno.
    - Usa una concessione di invio con ambito di registrazione inoltrata dall'app iOS associata. Il gateway non ha bisogno di un token relay valido per tutta la distribuzione.
    - Vincola ogni registrazione supportata da relay all'identità del gateway con cui l'app iOS è stata associata, così un altro gateway non può riutilizzare la registrazione archiviata.
    - Mantiene le build iOS locali/manuali su APNs diretto. Gli invii supportati da relay si applicano solo alle build distribuite ufficiali registrate tramite il relay.
    - Deve corrispondere all'URL di base del relay incorporato nella build iOS ufficiale/TestFlight, così il traffico di registrazione e invio raggiunge la stessa distribuzione relay.

    Flusso end-to-end:

    1. Installa una build iOS ufficiale/TestFlight compilata con lo stesso URL di base del relay.
    2. Configura `gateway.push.apns.relay.baseUrl` sul gateway.
    3. Associa l'app iOS al gateway e lascia che sia le sessioni node sia quelle operatore si connettano.
    4. L'app iOS recupera l'identità del gateway, si registra con il relay usando App Attest più la ricevuta dell'app, quindi pubblica il payload `push.apns.register` supportato da relay sul gateway associato.
    5. Il gateway archivia l'handle relay e la concessione di invio, quindi li usa per `push.test`, solleciti di riattivazione e riattivazioni di riconnessione.

    Note operative:

    - Se passi l'app iOS a un gateway diverso, riconnetti l'app così può pubblicare una nuova registrazione relay vincolata a quel gateway.
    - Se distribuisci una nuova build iOS che punta a una distribuzione relay diversa, l'app aggiorna la propria registrazione relay memorizzata nella cache invece di riutilizzare la vecchia origine relay.

    Nota di compatibilità:

    - `OPENCLAW_APNS_RELAY_BASE_URL` e `OPENCLAW_APNS_RELAY_TIMEOUT_MS` funzionano ancora come override temporanei tramite env.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` rimane una via di fuga di sviluppo solo per local loopback; non rendere persistenti URL relay HTTP nella configurazione.

    Vedi [App iOS](/it/platforms/ios#relay-backed-push-for-official-builds) per il flusso end-to-end e [Flusso di autenticazione e fiducia](/it/platforms/ios#authentication-and-trust-flow) per il modello di sicurezza del relay.

  </Accordion>

  <Accordion title="Configura Heartbeat (check-in periodici)">
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

    - `every`: stringa di durata (`30m`, `2h`). Imposta `0m` per disabilitare.
    - `target`: `last` | `none` | `<channel-id>` (ad esempio `discord`, `matrix`, `telegram` o `whatsapp`)
    - `directPolicy`: `allow` (predefinito) o `block` per destinazioni Heartbeat in stile DM
    - Vedi [Heartbeat](/it/gateway/heartbeat) per la guida completa.

  </Accordion>

  <Accordion title="Configura processi cron">
    ```json5
    {
      cron: {
        enabled: true,
        maxConcurrentRuns: 2, // cron dispatch + isolated cron agent-turn execution
        sessionRetention: "24h",
        runLog: {
          maxBytes: "2mb",
          keepLines: 2000,
        },
      },
    }
    ```

    - `sessionRetention`: elimina le sessioni di esecuzione isolate completate da `sessions.json` (predefinito `24h`; imposta `false` per disabilitare).
    - `runLog`: elimina `cron/runs/<jobId>.jsonl` in base a dimensione e righe conservate.
    - Vedi [Processi Cron](/it/automation/cron-jobs) per una panoramica della funzionalità ed esempi CLI.

  </Accordion>

  <Accordion title="Configura webhook (hook)">
    Abilita endpoint Webhook HTTP sul Gateway:

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
    - Tratta tutto il contenuto dei payload hook/webhook come input non attendibile.
    - Usa un `hooks.token` dedicato; non riutilizzare il token Gateway condiviso.
    - L'autenticazione degli hook è solo tramite header (`Authorization: Bearer ...` o `x-openclaw-token`); i token nella query string vengono rifiutati.
    - `hooks.path` non può essere `/`; mantieni l'ingresso webhook su un sottopercorso dedicato come `/hooks`.
    - Mantieni disabilitati i flag di bypass per contenuti non sicuri (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`) salvo per debug strettamente delimitato.
    - Se abiliti `hooks.allowRequestSessionKey`, imposta anche `hooks.allowedSessionKeyPrefixes` per limitare le chiavi di sessione selezionate dal chiamante.
    - Per agenti guidati da hook, preferisci tier di modelli moderni e robusti e un criterio strumenti rigoroso (ad esempio solo messaggistica più sandboxing dove possibile).

    Vedi [riferimento completo](/it/gateway/configuration-reference#hooks) per tutte le opzioni di mapping e l'integrazione Gmail.

  </Accordion>

  <Accordion title="Configura l'instradamento multi-agente">
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

    Vedi [Multi-Agent](/it/concepts/multi-agent) e [riferimento completo](/it/gateway/config-agents#multi-agent-routing) per le regole di associazione e i profili di accesso per agente.

  </Accordion>

  <Accordion title="Dividi la configurazione in più file ($include)">
    Usa `$include` per organizzare configurazioni di grandi dimensioni:

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
    - **Array di file**: merge profondo in ordine (l'ultimo prevale)
    - **Chiavi sorelle**: unite dopo gli include (sovrascrivono i valori inclusi)
    - **Include annidati**: supportati fino a 10 livelli di profondità
    - **Percorsi relativi**: risolti rispetto al file che include
    - **Scritture di proprietà di OpenClaw**: quando una scrittura modifica solo una sezione di primo livello
      supportata da un include a file singolo come `plugins: { $include: "./plugins.json5" }`,
      OpenClaw aggiorna quel file incluso e lascia intatto `openclaw.json`
    - **Write-through non supportato**: include root, array di include e include
      con override di chiavi sorelle falliscono in modo chiuso per le scritture di proprietà di OpenClaw invece di
      appiattire la configurazione
    - **Confinamento**: i percorsi `$include` devono risolversi sotto la directory che contiene
      `openclaw.json`. Per condividere un albero tra macchine o utenti, imposta
      `OPENCLAW_INCLUDE_ROOTS` su un elenco di percorsi (`:` su POSIX, `;` su Windows) di
      directory aggiuntive a cui gli include possono fare riferimento. I symlink vengono risolti
      e ricontrollati, quindi un percorso che lessicalmente si trova in una directory di configurazione ma il cui
      target reale esce da ogni root consentita viene comunque rifiutato.
    - **Gestione degli errori**: errori chiari per file mancanti, errori di parsing e include circolari

  </Accordion>
</AccordionGroup>

## Ricaricamento a caldo della configurazione

Il Gateway monitora `~/.openclaw/openclaw.json` e applica le modifiche automaticamente: per la maggior parte delle impostazioni non è necessario alcun riavvio manuale.

Le modifiche dirette ai file sono trattate come non attendibili finché non vengono validate. Il watcher attende
che il churn di scrittura temporanea/rinomina dell'editor si stabilizzi, legge il file finale e rifiuta
modifiche esterne non valide senza riscrivere `openclaw.json`. Le scritture di configurazione di proprietà di OpenClaw
usano lo stesso gate di schema prima della scrittura; sovrascritture distruttive come
la rimozione di `gateway.mode` o la riduzione del file di oltre la metà vengono rifiutate e
salvate come `.rejected.*` per l'ispezione.

Se vedi `config reload skipped (invalid config)` o l'avvio segnala `Invalid
config`, ispeziona la configurazione, esegui `openclaw config validate`, quindi esegui `openclaw
doctor --fix` per la riparazione. Vedi [Risoluzione dei problemi del Gateway](/it/gateway/troubleshooting#gateway-rejected-invalid-config)
per la checklist.

### Modalità di ricaricamento

| Modalità               | Comportamento                                                                          |
| ---------------------- | -------------------------------------------------------------------------------------- |
| **`hybrid`** (predefinita) | Applica a caldo istantaneamente le modifiche sicure. Riavvia automaticamente per quelle critiche. |
| **`hot`**              | Applica a caldo solo le modifiche sicure. Registra un avviso quando è necessario un riavvio: lo gestisci tu. |
| **`restart`**          | Riavvia il Gateway a ogni modifica della configurazione, sicura o meno.                |
| **`off`**              | Disabilita il monitoraggio dei file. Le modifiche hanno effetto al successivo riavvio manuale. |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Cosa si applica a caldo e cosa richiede un riavvio

La maggior parte dei campi si applica a caldo senza downtime. In modalità `hybrid`, le modifiche che richiedono riavvio vengono gestite automaticamente.

| Categoria           | Campi                                                            | Riavvio necessario? |
| ------------------- | ----------------------------------------------------------------- | ------------------- |
| Canali              | `channels.*`, `web` (WhatsApp) - tutti i canali integrati e Plugin | No                  |
| Agente e modelli    | `agent`, `agents`, `models`, `routing`                            | No                  |
| Automazione         | `hooks`, `cron`, `agent.heartbeat`                                | No                  |
| Sessioni e messaggi | `session`, `messages`                                             | No                  |
| Strumenti e media   | `tools`, `browser`, `skills`, `mcp`, `audio`, `talk`              | No                  |
| UI e varie          | `ui`, `logging`, `identity`, `bindings`                           | No                  |
| Server Gateway      | `gateway.*` (port, bind, auth, tailscale, TLS, HTTP)              | **Sì**              |
| Infrastruttura      | `discovery`, `plugins`                                            | **Sì**              |

<Note>
`gateway.reload` e `gateway.remote` sono eccezioni: modificarli **non** attiva un riavvio.
</Note>

### Pianificazione del ricaricamento

Quando modifichi un file sorgente a cui si fa riferimento tramite `$include`, OpenClaw pianifica
il ricaricamento dal layout scritto nel sorgente, non dalla vista in memoria appiattita.
Questo mantiene prevedibili le decisioni di hot-reload (applicazione a caldo vs riavvio) anche quando una
singola sezione di primo livello vive nel proprio file incluso, come
`plugins: { $include: "./plugins.json5" }`. La pianificazione del ricaricamento fallisce in modo chiuso se il
layout sorgente è ambiguo.

## Config RPC (aggiornamenti programmatici)

Per gli strumenti che scrivono la configurazione tramite l'API Gateway, preferisci questo flusso:

- `config.schema.lookup` per ispezionare un sottoalbero (nodo schema superficiale + riepiloghi dei figli)
- `config.get` per recuperare lo snapshot corrente più `hash`
- `config.patch` per aggiornamenti parziali (patch di unione JSON: gli oggetti si uniscono, `null`
  elimina, gli array sostituiscono)
- `config.apply` solo quando intendi sostituire l'intera configurazione
- `update.run` per self-update esplicito più riavvio; includi `continuationMessage` quando la sessione post-riavvio deve eseguire un turno di follow-up
- `update.status` per ispezionare l'ultimo sentinel di riavvio dell'aggiornamento e verificare la versione in esecuzione dopo un riavvio

Gli agenti dovrebbero trattare `config.schema.lookup` come il primo punto di riferimento per la documentazione e i vincoli esatti
a livello di campo. Usa [Riferimento di configurazione](/it/gateway/configuration-reference)
quando serve la mappa di configurazione più ampia, i valori predefiniti o i link ai riferimenti dedicati
dei sottosistemi.

<Note>
Le scritture del piano di controllo (`config.apply`, `config.patch`, `update.run`) sono
limitate a 3 richieste ogni 60 secondi per `deviceId+clientIp`. Le richieste di riavvio
si aggregano e poi applicano un cooldown di 30 secondi tra i cicli di riavvio.
`update.status` è di sola lettura ma con ambito amministratore perché il sentinel di riavvio può
includere riepiloghi dei passaggi di aggiornamento e code dell'output dei comandi.
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
`note` e `restartDelayMs`. `baseHash` è richiesto per entrambi i metodi quando una
configurazione esiste già.

## Variabili d'ambiente

OpenClaw legge le variabili d'ambiente dal processo padre più:

- `.env` dalla directory di lavoro corrente (se presente)
- `~/.openclaw/.env` (fallback globale)

Nessuno dei due file sovrascrive le variabili d'ambiente esistenti. Puoi anche impostare variabili d'ambiente inline nella configurazione:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Importazione dell'ambiente shell (facoltativa)">
  Se abilitato e le chiavi attese non sono impostate, OpenClaw esegue la tua shell di login e importa solo le chiavi mancanti:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

Equivalente come variabile d'ambiente: `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="Sostituzione di variabili d'ambiente nei valori di configurazione">
  Fai riferimento alle variabili d'ambiente in qualsiasi valore stringa della configurazione con `${VAR_NAME}`:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

Regole:

- Solo nomi maiuscoli corrispondenti: `[A-Z_][A-Z0-9_]*`
- Le variabili mancanti/vuote generano un errore al momento del caricamento
- Esegui l'escape con `$${VAR}` per l'output letterale
- Funziona dentro i file `$include`
- Sostituzione inline: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="Riferimenti segreti (env, file, exec)">
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

Vedi [Ambiente](/it/help/environment) per precedenza e sorgenti complete.

## Riferimento completo

Per il riferimento completo campo per campo, vedi **[Riferimento di configurazione](/it/gateway/configuration-reference)**.

---

_Correlati: [Esempi di configurazione](/it/gateway/configuration-examples) · [Riferimento di configurazione](/it/gateway/configuration-reference) · [Doctor](/it/gateway/doctor)_

## Correlati

- [Riferimento di configurazione](/it/gateway/configuration-reference)
- [Esempi di configurazione](/it/gateway/configuration-examples)
- [Runbook del Gateway](/it/gateway)
