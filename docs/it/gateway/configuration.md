---
read_when:
    - Configurare OpenClaw per la prima volta
    - Ricerca dei pattern di configurazione comuni
    - Navigare verso sezioni specifiche della configurazione
summary: 'Panoramica della configurazione: attività comuni, configurazione rapida e collegamenti al riferimento completo'
title: Configurazione
x-i18n:
    generated_at: "2026-06-27T17:30:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 53ab0299aca69dafd240550bac1407356b0b3f5f35ef0171ea961c36346d3cab
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw legge una configurazione facoltativa <Tooltip tip="JSON5 supports comments and trailing commas">**JSON5**</Tooltip> da `~/.openclaw/openclaw.json`.
Il percorso della configurazione attiva deve essere un file regolare. I layout
`openclaw.json` con symlink non sono supportati per le scritture gestite da
OpenClaw; una scrittura atomica può sostituire il percorso invece di preservare
il symlink. Se mantieni la configurazione fuori dalla directory di stato
predefinita, punta `OPENCLAW_CONFIG_PATH` direttamente al file reale.

Se il file manca, OpenClaw usa impostazioni predefinite sicure. Motivi comuni per aggiungere una configurazione:

- Collegare canali e controllare chi può inviare messaggi al bot
- Impostare modelli, strumenti, sandboxing o automazione (cron, hook)
- Regolare sessioni, media, rete o interfaccia utente

Consulta il [riferimento completo](/it/gateway/configuration-reference) per ogni campo disponibile.

Agenti e automazione devono usare `config.schema.lookup` per la documentazione
esatta a livello di campo prima di modificare la configurazione. Usa questa
pagina per indicazioni orientate alle attività e il [Riferimento alla configurazione](/it/gateway/configuration-reference)
per la mappa dei campi e i valori predefiniti più ampi.

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
  <Tab title="Interactive wizard">
    ```bash
    openclaw onboard       # full onboarding flow
    openclaw configure     # config wizard
    ```
  </Tab>
  <Tab title="CLI (one-liners)">
    ```bash
    openclaw config get agents.defaults.workspace
    openclaw config set agents.defaults.heartbeat.every "2h"
    openclaw config unset plugins.entries.brave.config.webSearch.apiKey
    ```
  </Tab>
  <Tab title="Control UI">
    Apri [http://127.0.0.1:18789](http://127.0.0.1:18789) e usa la scheda **Config**.
    Control UI renderizza un modulo dallo schema di configurazione live, inclusi
    i metadati di documentazione dei campi `title` / `description`, più gli
    schemi di Plugin e canali quando disponibili, con un editor **Raw JSON** come
    via di fuga. Per interfacce con approfondimento e altri strumenti, il gateway
    espone anche `config.schema.lookup` per recuperare un nodo di schema limitato
    al percorso più i riepiloghi dei figli immediati.
  </Tab>
  <Tab title="Direct edit">
    Modifica direttamente `~/.openclaw/openclaw.json`. Il Gateway osserva il file e applica automaticamente le modifiche (vedi [ricaricamento a caldo](#config-hot-reload)).
  </Tab>
</Tabs>

## Validazione rigorosa

<Warning>
OpenClaw accetta solo configurazioni che corrispondono completamente allo schema. Chiavi sconosciute, tipi malformati o valori non validi fanno sì che il Gateway **si rifiuti di avviarsi**. L'unica eccezione a livello radice è `$schema` (stringa), così gli editor possono allegare metadati JSON Schema.
</Warning>

`openclaw config schema` stampa il JSON Schema canonico usato da Control UI
e dalla validazione. `config.schema.lookup` recupera un singolo nodo limitato
al percorso più i riepiloghi dei figli per strumenti con approfondimento. I
metadati di documentazione dei campi `title`/`description` attraversano oggetti
annidati, wildcard (`*`), elementi di array (`[]`) e rami `anyOf`/
`oneOf`/`allOf`. Gli schemi runtime di Plugin e canali vengono uniti quando il
registro dei manifest viene caricato.

Quando la validazione non riesce:

- Il Gateway non si avvia
- Funzionano solo i comandi diagnostici (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Esegui `openclaw doctor` per vedere i problemi esatti
- Esegui `openclaw doctor --fix` (o `--yes`) per applicare le riparazioni

Il Gateway conserva una copia attendibile dell'ultima configurazione valida dopo
ogni avvio riuscito, ma l'avvio e il ricaricamento a caldo non la ripristinano
automaticamente. Se `openclaw.json` non supera la validazione (inclusa la
validazione locale del Plugin), l'avvio del Gateway fallisce oppure il
ricaricamento viene saltato e il runtime corrente mantiene l'ultima
configurazione accettata. Esegui `openclaw doctor --fix` (o `--yes`) per
riparare configurazioni con prefissi/sovrascritte o ripristinare l'ultima copia
valida. La promozione a ultima configurazione valida viene saltata quando un
candidato contiene segnaposto di segreti redatti come `***`.

## Attività comuni

<AccordionGroup>
  <Accordion title="Set up a channel (WhatsApp, Telegram, Discord, etc.)">
    Ogni canale ha la propria sezione di configurazione sotto `channels.<provider>`. Consulta la pagina dedicata al canale per i passaggi di configurazione:

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

    Tutti i canali condividono lo stesso pattern di policy per i DM:

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

  <Accordion title="Choose and configure models">
    Imposta il modello principale e i fallback facoltativi:

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

    - `agents.defaults.models` definisce il catalogo dei modelli e funge da allowlist per `/model`; le voci `provider/*` filtrano `/model`, `/models` e i selettori di modelli ai provider selezionati, continuando a usare la scoperta dinamica dei modelli.
    - Usa `openclaw config set agents.defaults.models '<json>' --strict-json --merge` per aggiungere voci alla allowlist senza rimuovere i modelli esistenti. Le sostituzioni semplici che rimuoverebbero voci vengono rifiutate a meno che tu non passi `--replace`.
    - I riferimenti ai modelli usano il formato `provider/model` (per esempio `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` controlla il ridimensionamento di immagini di trascrizione/strumenti (predefinito `1200`); valori più bassi di solito riducono l'uso di token visivi nelle esecuzioni ricche di screenshot.
    - Consulta [CLI modelli](/it/concepts/models) per cambiare modello in chat e [Failover dei modelli](/it/concepts/model-failover) per la rotazione dell'autenticazione e il comportamento di fallback.
    - Per provider personalizzati/self-hosted, consulta [Provider personalizzati](/it/gateway/config-tools#custom-providers-and-base-urls) nel riferimento.

  </Accordion>

  <Accordion title="Control who can message the bot">
    L'accesso ai DM è controllato per canale tramite `dmPolicy`:

    - `"pairing"` (predefinito): i mittenti sconosciuti ricevono un codice di pairing monouso da approvare
    - `"allowlist"`: solo i mittenti in `allowFrom` (o nello store allow associato)
    - `"open"`: consenti tutti i DM in ingresso (richiede `allowFrom: ["*"]`)
    - `"disabled"`: ignora tutti i DM

    Per i gruppi, usa `groupPolicy` + `groupAllowFrom` o allowlist specifiche del canale.

    Consulta il [riferimento completo](/it/gateway/config-channels#dm-and-group-access) per i dettagli per canale.

  </Accordion>

  <Accordion title="Set up group chat mention gating">
    I messaggi di gruppo richiedono per impostazione predefinita una **menzione obbligatoria**. Configura i pattern di attivazione per agente. Le risposte normali di gruppo/canale vengono pubblicate automaticamente; abilita esplicitamente il percorso message-tool per stanze condivise in cui l'agente deve decidere quando parlare:

    ```json5
    {
      messages: {
        visibleReplies: "automatic", // set "message_tool" to require message-tool sends everywhere
        groupChat: {
          visibleReplies: "message_tool", // opt-in; visible output requires message(action=send)
          unmentionedInbound: "room_event", // unmentioned always-on group chatter is quiet context
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
    - **Risposte visibili**: `messages.visibleReplies` può richiedere globalmente invii tramite message-tool; `messages.groupChat.visibleReplies` lo sovrascrive per gruppi/canali.
    - Consulta il [riferimento completo](/it/gateway/config-channels#group-chat-mention-gating) per le modalità di risposta visibile, le sovrascritture per canale e la modalità self-chat.

  </Accordion>

  <Accordion title="Restrict skills per agent">
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

    - Ometti `agents.defaults.skills` per skills senza restrizioni per impostazione predefinita.
    - Ometti `agents.list[].skills` per ereditare i valori predefiniti.
    - Imposta `agents.list[].skills: []` per nessuna skill.
    - Consulta [Skills](/it/tools/skills), [Configurazione Skills](/it/tools/skills-config) e
      il [Riferimento alla configurazione](/it/gateway/config-agents#agents-defaults-skills).

  </Accordion>

  <Accordion title="Tune gateway channel health monitoring">
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

    - Imposta `gateway.channelHealthCheckMinutes: 0` per disabilitare globalmente i riavvii del monitor di integrità.
    - `channelStaleEventThresholdMinutes` deve essere maggiore o uguale all'intervallo di controllo.
    - Usa `channels.<provider>.healthMonitor.enabled` o `channels.<provider>.accounts.<id>.healthMonitor.enabled` per disabilitare i riavvii automatici per un canale o account senza disabilitare il monitor globale.
    - Consulta [Controlli di integrità](/it/gateway/health) per il debug operativo e il [riferimento completo](/it/gateway/configuration-reference#gateway) per tutti i campi.

  </Accordion>

  <Accordion title="Tune gateway WebSocket handshake timeout">
    Concedi ai client locali più tempo per completare l'handshake WebSocket
    pre-autenticazione su host carichi o a bassa potenza:

    ```json5
    {
      gateway: {
        handshakeTimeoutMs: 30000,
      },
    }
    ```

    - Il valore predefinito è `15000` millisecondi.
    - `OPENCLAW_HANDSHAKE_TIMEOUT_MS` ha comunque precedenza per sovrascritture una tantum di servizio o shell.
    - Preferisci prima correggere blocchi di avvio/event loop; questa manopola è per host sani ma lenti durante il riscaldamento.

  </Accordion>

  <Accordion title="Configure sessions and resets">
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
    - `threadBindings`: valori predefiniti globali per il routing delle sessioni vincolate ai thread (Discord supporta `/focus`, `/unfocus`, `/agents`, `/session idle` e `/session max-age`).
    - Consulta [Gestione delle sessioni](/it/concepts/session) per ambiti, collegamenti di identità e criteri di invio.
    - Consulta il [riferimento completo](/it/gateway/config-agents#session) per tutti i campi.

  </Accordion>

  <Accordion title="Abilita il sandboxing">
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

    Crea prima l'immagine: da un checkout dei sorgenti esegui `scripts/sandbox-setup.sh`, oppure da un'installazione npm consulta il comando `docker build` inline in [Sandboxing § Immagini e configurazione](/it/gateway/sandboxing#images-and-setup).

    Consulta [Sandboxing](/it/gateway/sandboxing) per la guida completa e il [riferimento completo](/it/gateway/config-agents#agentsdefaultssandbox) per tutte le opzioni.

  </Accordion>

  <Accordion title="Abilita il push basato su relay per le build iOS ufficiali">
    Il push basato su relay per le build pubbliche App Store/TestFlight usa il relay OpenClaw ospitato: `https://ios-push-relay.openclaw.ai`.

    Le distribuzioni relay personalizzate richiedono un percorso di build/distribuzione iOS deliberatamente separato il cui URL relay corrisponda all'URL relay del gateway. Se usi una build relay personalizzata, impostalo nella configurazione del gateway:

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

    - Consente al gateway di inviare `push.test`, solleciti di wake e wake di riconnessione tramite il relay esterno.
    - Usa una concessione di invio con ambito di registrazione inoltrata dall'app iOS abbinata. Il gateway non ha bisogno di un token relay valido per tutta la distribuzione.
    - Vincola ogni registrazione basata su relay all'identità del gateway con cui l'app iOS è stata abbinata, così un altro gateway non può riutilizzare la registrazione archiviata.
    - Mantiene le build iOS locali/manuali su APNs diretto. Gli invii basati su relay si applicano solo alle build ufficiali distribuite che si sono registrate tramite il relay.
    - Deve corrispondere all'URL base del relay incorporato nella build iOS, così il traffico di registrazione e di invio raggiunge la stessa distribuzione relay.

    Flusso end-to-end:

    1. Installa una build iOS ufficiale/TestFlight.
    2. Facoltativo: configura `gateway.push.apns.relay.baseUrl` sul gateway solo quando usi una build relay personalizzata deliberatamente separata.
    3. Abbina l'app iOS al gateway e lascia che sia la sessione nodo sia le sessioni operatore si connettano.
    4. L'app iOS recupera l'identità del gateway, si registra con il relay usando App Attest più la ricevuta dell'app, quindi pubblica il payload `push.apns.register` basato su relay sul gateway abbinato.
    5. Il gateway archivia l'handle relay e la concessione di invio, quindi li usa per `push.test`, solleciti di wake e wake di riconnessione.

    Note operative:

    - Se sposti l'app iOS su un gateway diverso, riconnetti l'app affinché possa pubblicare una nuova registrazione relay vincolata a quel gateway.
    - Se distribuisci una nuova build iOS che punta a una distribuzione relay diversa, l'app aggiorna la registrazione relay memorizzata nella cache invece di riutilizzare la vecchia origine relay.

    Nota di compatibilità:

    - `OPENCLAW_APNS_RELAY_BASE_URL` e `OPENCLAW_APNS_RELAY_TIMEOUT_MS` funzionano ancora come override env temporanei.
    - Gli URL relay del gateway personalizzati devono corrispondere all'URL base del relay incorporato nella build iOS. Il canale di rilascio pubblico App Store rifiuta gli override personalizzati dell'URL relay iOS.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` resta una via d'uscita di sviluppo solo loopback; non rendere persistenti URL relay HTTP nella configurazione.

    Consulta [App iOS](/it/platforms/ios#relay-backed-push-for-official-builds) per il flusso end-to-end e [Flusso di autenticazione e fiducia](/it/platforms/ios#authentication-and-trust-flow) per il modello di sicurezza del relay.

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
    - `target`: `last` | `none` | `<channel-id>` (per esempio `discord`, `matrix`, `telegram` o `whatsapp`)
    - `directPolicy`: `allow` (predefinito) o `block` per destinazioni Heartbeat in stile DM
    - Consulta [Heartbeat](/it/gateway/heartbeat) per la guida completa.

  </Accordion>

  <Accordion title="Configura job Cron">
    ```json5
    {
      cron: {
        enabled: true,
        maxConcurrentRuns: 8, // default; cron dispatch + isolated cron agent-turn execution
        sessionRetention: "24h",
        runLog: {
          maxBytes: "2mb",
          keepLines: 2000,
        },
      },
    }
    ```

    - `sessionRetention`: elimina da `sessions.json` le sessioni di esecuzione isolate completate (predefinito `24h`; imposta `false` per disabilitare).
    - `runLog`: elimina le righe conservate della cronologia esecuzioni Cron per job. `maxBytes` resta accettato per i log di esecuzione precedenti basati su file.
    - Consulta [Job Cron](/it/automation/cron-jobs) per una panoramica della funzionalità ed esempi CLI.

  </Accordion>

  <Accordion title="Configura i Webhook (hook)">
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
    - Considera tutto il contenuto dei payload hook/Webhook come input non attendibile.
    - Usa un `hooks.token` dedicato; non riutilizzare segreti di autenticazione Gateway attivi (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` o `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`).
    - L'autenticazione hook avviene solo tramite header (`Authorization: Bearer ...` o `x-openclaw-token`); i token nella stringa di query vengono rifiutati.
    - `hooks.path` non può essere `/`; mantieni l'ingresso Webhook su un sottopercorso dedicato come `/hooks`.
    - Mantieni disabilitati i flag di bypass per contenuti non sicuri (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`) salvo debug strettamente circoscritto.
    - Se abiliti `hooks.allowRequestSessionKey`, imposta anche `hooks.allowedSessionKeyPrefixes` per limitare le chiavi sessione scelte dal chiamante.
    - Per agenti guidati da hook, preferisci livelli di modello moderni e solidi e una policy degli strumenti rigorosa (per esempio solo messaggistica più sandboxing ove possibile).

    Consulta il [riferimento completo](/it/gateway/configuration-reference#hooks) per tutte le opzioni di mapping e l'integrazione Gmail.

  </Accordion>

  <Accordion title="Configura il routing multi-agente">
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

    Consulta [Multi-Agent](/it/concepts/multi-agent) e il [riferimento completo](/it/gateway/config-agents#multi-agent-routing) per le regole di binding e i profili di accesso per agente.

  </Accordion>

  <Accordion title="Dividi la configurazione in più file ($include)">
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
    - **Array di file**: uniti in profondità in ordine (vince l'ultimo)
    - **Chiavi sorelle**: unite dopo gli include (sovrascrivono i valori inclusi)
    - **Include annidati**: supportati fino a 10 livelli di profondità
    - **Percorsi relativi**: risolti rispetto al file che include
    - **Formato percorso**: i percorsi di include non devono contenere byte nulli e devono essere strettamente più brevi di 4096 caratteri prima e dopo la risoluzione
    - **Scritture di proprietà di OpenClaw**: quando una scrittura modifica solo una sezione di primo livello
      supportata da un include di file singolo come `plugins: { $include: "./plugins.json5" }`,
      OpenClaw aggiorna quel file incluso e lascia intatto `openclaw.json`
    - **Write-through non supportato**: gli include root, gli array di include e gli include
      con override di chiavi sorelle falliscono in modo chiuso per le scritture di proprietà di OpenClaw invece di
      appiattire la configurazione
    - **Confinamento**: i percorsi `$include` devono risolversi sotto la directory che contiene
      `openclaw.json`. Per condividere un albero tra macchine o utenti, imposta
      `OPENCLAW_INCLUDE_ROOTS` su un elenco di percorsi (`:` su POSIX, `;` su Windows) di
      directory aggiuntive a cui gli include possono fare riferimento. I symlink vengono risolti
      e ricontrollati, quindi un percorso che lessicalmente si trova in una directory di configurazione ma il cui
      target reale esce da ogni root consentita viene comunque rifiutato.
    - **Gestione degli errori**: errori chiari per file mancanti, errori di parsing, include circolari, formato percorso non valido e lunghezza eccessiva

  </Accordion>
</AccordionGroup>

## Ricaricamento a caldo della configurazione

Il Gateway osserva `~/.openclaw/openclaw.json` e applica automaticamente le modifiche: per la maggior parte delle impostazioni non serve alcun riavvio manuale.

Le modifiche dirette ai file vengono considerate non attendibili finché non vengono validate. Il watcher attende
che il ciclo di scrittura temporanea/rinomina dell'editor si stabilizzi, legge il file finale e rifiuta
le modifiche esterne non valide senza riscrivere `openclaw.json`. Le scritture di configurazione di proprietà di OpenClaw
usano lo stesso gate di schema prima della scrittura; sovrascritture distruttive come
la rimozione di `gateway.mode` o la riduzione del file di oltre la metà vengono rifiutate e
salvate come `.rejected.*` per l'ispezione.

Se vedi `config reload skipped (invalid config)` o l'avvio segnala `Invalid
config`, ispeziona la configurazione, esegui `openclaw config validate`, quindi esegui `openclaw
doctor --fix` per la riparazione. Consulta [Risoluzione dei problemi del Gateway](/it/gateway/troubleshooting#gateway-rejected-invalid-config)
per la checklist.

### Modalità di ricaricamento

| Modalità               | Comportamento                                                                           |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (predefinita) | Applica a caldo istantaneamente le modifiche sicure. Riavvia automaticamente per quelle critiche. |
| **`hot`**              | Applica a caldo solo le modifiche sicure. Registra un avviso quando serve un riavvio: lo gestisci tu. |
| **`restart`**          | Riavvia il Gateway a ogni modifica della configurazione, sicura o meno.                 |
| **`off`**              | Disabilita l'osservazione dei file. Le modifiche hanno effetto al successivo riavvio manuale. |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Cosa si applica a caldo e cosa richiede un riavvio

La maggior parte dei campi si applica a caldo senza downtime. In modalità `hybrid`, le modifiche che richiedono un riavvio vengono gestite automaticamente.

| Categoria           | Campi                                                             | Riavvio necessario? |
| ------------------- | ----------------------------------------------------------------- | ------------------- |
| Canali              | `channels.*`, `web` (WhatsApp) - tutti i canali integrati e Plugin | No                  |
| Agente e modelli    | `agent`, `agents`, `models`, `routing`                            | No                  |
| Automazione         | `hooks`, `cron`, `agent.heartbeat`                                | No                  |
| Sessioni e messaggi | `session`, `messages`                                             | No                  |
| Strumenti e media   | `tools`, `browser`, `skills`, `mcp`, `audio`, `talk`              | No                  |
| UI e varie          | `ui`, `logging`, `identity`, `bindings`                           | No                  |
| Server Gateway      | `gateway.*` (porta, bind, auth, tailscale, TLS, HTTP)             | **Sì**              |
| Infrastruttura      | `discovery`, `plugins`                                            | **Sì**              |

<Note>
`gateway.reload` e `gateway.remote` sono eccezioni: modificarli **non** attiva un riavvio.
</Note>

### Pianificazione del ricaricamento

Quando modifichi un file sorgente referenziato tramite `$include`, OpenClaw pianifica
il ricaricamento dal layout creato nel sorgente, non dalla vista in memoria appiattita.
Questo mantiene prevedibili le decisioni di ricaricamento a caldo (applicazione a caldo rispetto a riavvio) anche quando una
singola sezione di primo livello vive nel proprio file incluso, ad esempio
`plugins: { $include: "./plugins.json5" }`. La pianificazione del ricaricamento fallisce in modo chiuso se il
layout sorgente è ambiguo.

## RPC di configurazione (aggiornamenti programmatici)

Per gli strumenti che scrivono la configurazione tramite l'API del Gateway, preferisci questo flusso:

- `config.schema.lookup` per ispezionare un sottoalbero (nodo di schema superficiale + riepiloghi
  dei figli)
- `config.get` per recuperare lo snapshot corrente più `hash`
- `config.patch` per aggiornamenti parziali (patch di merge JSON: gli oggetti si uniscono, `null`
  elimina, gli array vengono sostituiti quando confermato esplicitamente con `replacePaths` se
  le voci verrebbero rimosse)
- `config.apply` solo quando intendi sostituire l'intera configurazione
- `update.run` per autoaggiornamento esplicito più riavvio; includi `continuationMessage` quando la sessione post-riavvio deve eseguire un turno di follow-up
- `update.status` per ispezionare l'ultimo sentinella di riavvio dell'aggiornamento e verificare la versione in esecuzione dopo un riavvio

Gli agenti dovrebbero trattare `config.schema.lookup` come il primo punto di riferimento per la documentazione esatta
a livello di campo e i vincoli. Usa [Riferimento di configurazione](/it/gateway/configuration-reference)
quando hanno bisogno della mappa di configurazione più ampia, dei valori predefiniti o dei link ai riferimenti
dedicati dei sottosistemi.

<Note>
Le scritture del piano di controllo (`config.apply`, `config.patch`, `update.run`) sono
limitate a 3 richieste ogni 60 secondi per `deviceId+clientIp`. Le richieste di riavvio
vengono raggruppate e poi applicano un cooldown di 30 secondi tra i cicli di riavvio.
`update.status` è di sola lettura ma limitato agli amministratori perché il sentinella di riavvio può
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
`note` e `restartDelayMs`. `baseHash` è obbligatorio per entrambi i metodi quando una
configurazione esiste già.

`config.patch` accetta anche `replacePaths`, un array di percorsi di configurazione la cui sostituzione
dell'array è intenzionale. Se una patch sostituirebbe o eliminerebbe un array esistente
con meno voci, il Gateway rifiuta la scrittura a meno che quel percorso esatto non appaia
in `replacePaths`; gli array annidati sotto voci di array usano `[]`, ad esempio
`agents.list[].skills`. Questo impedisce agli snapshot `config.get` troncati di
sovrascrivere silenziosamente gli array di routing o allowlist. Usa `config.apply` quando
intendi sostituire l'intera configurazione.

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

<Accordion title="Shell env import (optional)">
  Se abilitato e le chiavi attese non sono impostate, OpenClaw esegue la tua shell di login e importa solo le chiavi mancanti:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

Equivalente della variabile d'ambiente: `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="Env var substitution in config values">
  Referenzia le variabili d'ambiente in qualsiasi valore stringa di configurazione con `${VAR_NAME}`:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

Regole:

- Solo nomi maiuscoli corrispondenti: `[A-Z_][A-Z0-9_]*`
- Variabili mancanti/vuote generano un errore in fase di caricamento
- Esegui l'escape con `$${VAR}` per l'output letterale
- Funziona dentro i file `$include`
- Sostituzione inline: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="Secret refs (env, file, exec)">
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
- [Runbook Gateway](/it/gateway)
