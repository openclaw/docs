---
read_when:
    - Configurare OpenClaw per la prima volta
    - Cerchi schemi di configurazione comuni
    - Passare a sezioni di configurazione specifiche
summary: 'Panoramica della configurazione: attività comuni, configurazione rapida e collegamenti al riferimento completo'
title: Configurazione
x-i18n:
    generated_at: "2026-04-21T08:22:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 479e59fb8b57c5228ef1c6076cf80a4ce6064d3f6fad5f38ea9d75eeb92811dc
    source_path: gateway/configuration.md
    workflow: 15
---

# Configurazione

OpenClaw legge una configurazione facoltativa in <Tooltip tip="JSON5 supports comments and trailing commas">**JSON5**</Tooltip> da `~/.openclaw/openclaw.json`.

Se il file manca, OpenClaw usa valori predefiniti sicuri. Motivi comuni per aggiungere una configurazione:

- Collegare canali e controllare chi può inviare messaggi al bot
- Impostare modelli, strumenti, sandboxing o automazione (Cron, hook)
- Regolare sessioni, contenuti multimediali, rete o interfaccia

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
    openclaw onboard       # flusso di onboarding completo
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
  <Tab title="Interfaccia Control">
    Apri [http://127.0.0.1:18789](http://127.0.0.1:18789) e usa la scheda **Config**.
    L'interfaccia Control visualizza un modulo dal live schema di configurazione, inclusi i metadati di documentazione dei campi
    `title` / `description` più gli schemi di plugin e canale quando
    disponibili, con un editor **Raw JSON** come via di fuga. Per interfacce
    con drill-down e altri strumenti, il gateway espone anche `config.schema.lookup` per
    recuperare un nodo di schema relativo a un singolo percorso più i riepiloghi immediati degli elementi figli.
  </Tab>
  <Tab title="Modifica diretta">
    Modifica direttamente `~/.openclaw/openclaw.json`. Il Gateway osserva il file e applica automaticamente le modifiche (vedi [hot reload](#config-hot-reload)).
  </Tab>
</Tabs>

## Validazione rigorosa

<Warning>
OpenClaw accetta solo configurazioni che corrispondono completamente allo schema. Chiavi sconosciute, tipi malformati o valori non validi fanno sì che il Gateway **rifiuti di avviarsi**. L'unica eccezione a livello root è `$schema` (stringa), così gli editor possono allegare metadati JSON Schema.
</Warning>

Note sugli strumenti dello schema:

- `openclaw config schema` stampa la stessa famiglia di JSON Schema usata da Control UI
  e dalla validazione della configurazione.
- Tratta l'output dello schema come il contratto canonico leggibile da macchina per
  `openclaw.json`; questa panoramica e il riferimento della configurazione lo riassumono.
- I valori `title` e `description` dei campi vengono riportati nell'output dello schema per
  strumenti di editor e moduli.
- Gli oggetti nidificati, le voci wildcard (`*`) e le voci degli elementi array (`[]`) ereditano gli stessi
  metadati di documentazione dove esiste una documentazione corrispondente del campo.
- Anche i rami di composizione `anyOf` / `oneOf` / `allOf` ereditano gli stessi metadati di documentazione,
  così le varianti union/intersection mantengono lo stesso aiuto per i campi.
- `config.schema.lookup` restituisce un percorso di configurazione normalizzato con un nodo di schema superficiale
  (`title`, `description`, `type`, `enum`, `const`, limiti comuni
  e campi di validazione simili), metadati corrispondenti dei suggerimenti UI e riepiloghi immediati degli elementi figli
  per strumenti con drill-down.
- Gli schemi runtime di plugin/canale vengono uniti quando il gateway può caricare
  il registro dei manifest correnti.
- `pnpm config:docs:check` rileva divergenze tra gli artifact baseline della configurazione visibili nella documentazione
  e la superficie corrente dello schema.

Quando la validazione fallisce:

- Il Gateway non si avvia
- Funzionano solo i comandi diagnostici (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Esegui `openclaw doctor` per vedere i problemi esatti
- Esegui `openclaw doctor --fix` (o `--yes`) per applicare le riparazioni

Il Gateway conserva anche una copia attendibile dell'ultima configurazione valida dopo un avvio riuscito. Se
`openclaw.json` viene successivamente modificato fuori da OpenClaw e non è più valido, l'avvio
e l'hot reload conservano il file non valido come snapshot `.clobbered.*` con timestamp,
ripristinano l'ultima copia valida e registrano un avviso evidente con il motivo del recupero.
Anche il turno successivo dell'agente principale riceve un avviso di evento di sistema che indica che la
configurazione è stata ripristinata e non deve essere riscritta alla cieca. La promozione dell'ultima configurazione valida
viene aggiornata dopo un avvio validato e dopo hot reload accettati, compresi
le scritture di configurazione possedute da OpenClaw il cui hash del file persistito corrisponde ancora alla
scrittura accettata. La promozione viene saltata quando il candidato contiene segnaposto segreti
redatti come `***` o valori token abbreviati.

## Attività comuni

<AccordionGroup>
  <Accordion title="Configurare un canale (WhatsApp, Telegram, Discord, ecc.)">
    Ogni canale ha una propria sezione di configurazione sotto `channels.<provider>`. Vedi la pagina dedicata del canale per i passaggi di configurazione:

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

    Tutti i canali condividono lo stesso modello di criterio DM:

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
    - I riferimenti ai modelli usano il formato `provider/model` (ad esempio `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` controlla il downscaling delle immagini di trascrizione/strumento (predefinito `1200`); valori più bassi di solito riducono l'uso di token visivi nelle esecuzioni ricche di screenshot.
    - Vedi [CLI dei modelli](/it/concepts/models) per cambiare modello in chat e [Model Failover](/it/concepts/model-failover) per il comportamento di rotazione dell'autenticazione e fallback.
    - Per provider personalizzati/self-hosted, vedi [Provider personalizzati](/it/gateway/configuration-reference#custom-providers-and-base-urls) nel riferimento.

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

  <Accordion title="Configurare il controllo delle menzioni nelle chat di gruppo">
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

    - **Menzioni nei metadati**: @-menzioni native (tap-to-mention di WhatsApp, @bot di Telegram, ecc.)
    - **Pattern di testo**: pattern regex sicuri in `mentionPatterns`
    - Vedi il [riferimento completo](/it/gateway/configuration-reference#group-chat-mention-gating) per override per canale e modalità self-chat.

  </Accordion>

  <Accordion title="Limitare Skills per agente">
    Usa `agents.defaults.skills` per una base condivisa, poi fai override degli agenti specifici
    con `agents.list[].skills`:

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

    - Ometti `agents.defaults.skills` per avere Skills senza restrizioni per impostazione predefinita.
    - Ometti `agents.list[].skills` per ereditare i valori predefiniti.
    - Imposta `agents.list[].skills: []` per non avere Skills.
    - Vedi [Skills](/it/tools/skills), [Configurazione di Skills](/it/tools/skills-config) e
      il [Riferimento della configurazione](/it/gateway/configuration-reference#agents-defaults-skills).

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

    - Imposta `gateway.channelHealthCheckMinutes: 0` per disabilitare globalmente i riavvii del monitor di stato.
    - `channelStaleEventThresholdMinutes` deve essere maggiore o uguale all'intervallo di controllo.
    - Usa `channels.<provider>.healthMonitor.enabled` o `channels.<provider>.accounts.<id>.healthMonitor.enabled` per disabilitare i riavvii automatici per un singolo canale o account senza disabilitare il monitor globale.
    - Vedi [Health Checks](/it/gateway/health) per il debug operativo e il [riferimento completo](/it/gateway/configuration-reference#gateway) per tutti i campi.

  </Accordion>

  <Accordion title="Configurare sessioni e reset">
    Le sessioni controllano la continuità e l'isolamento delle conversazioni:

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
    - `threadBindings`: valori predefiniti globali per l'instradamento delle sessioni legate ai thread (Discord supporta `/focus`, `/unfocus`, `/agents`, `/session idle` e `/session max-age`).
    - Vedi [Gestione delle sessioni](/it/concepts/session) per ambito, link di identità e criterio di invio.
    - Vedi il [riferimento completo](/it/gateway/configuration-reference#session) per tutti i campi.

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

    Crea prima l'immagine: `scripts/sandbox-setup.sh`

    Vedi [Sandboxing](/it/gateway/sandboxing) per la guida completa e il [riferimento completo](/it/gateway/configuration-reference#agentsdefaultssandbox) per tutte le opzioni.

  </Accordion>

  <Accordion title="Abilitare il push basato su relay per le build iOS ufficiali">
    Il push basato su relay si configura in `openclaw.json`.

    Imposta questo nella configurazione del gateway:

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

    Cosa fa:

    - Consente al gateway di inviare `push.test`, segnali di wake e wake di riconnessione tramite il relay esterno.
    - Usa un'autorizzazione di invio con ambito di registrazione inoltrata dall'app iOS associata. Il gateway non ha bisogno di un token relay valido per l'intera distribuzione.
    - Associa ogni registrazione supportata dal relay all'identità del gateway con cui l'app iOS è stata associata, così un altro gateway non può riutilizzare la registrazione memorizzata.
    - Mantiene le build iOS locali/manuali su APNs diretti. Gli invii supportati dal relay si applicano solo alle build ufficiali distribuite che si sono registrate tramite il relay.
    - Deve corrispondere al base URL del relay incorporato nella build iOS ufficiale/TestFlight, così il traffico di registrazione e invio raggiunge la stessa distribuzione relay.

    Flusso end-to-end:

    1. Installa una build iOS ufficiale/TestFlight compilata con lo stesso base URL del relay.
    2. Configura `gateway.push.apns.relay.baseUrl` sul gateway.
    3. Associa l'app iOS al gateway e lascia connettere sia la sessione Node sia quella operatore.
    4. L'app iOS recupera l'identità del gateway, si registra presso il relay usando App Attest più la ricevuta dell'app e poi pubblica il payload `push.apns.register` supportato dal relay al gateway associato.
    5. Il gateway memorizza l'handle relay e l'autorizzazione di invio, quindi li usa per `push.test`, segnali di wake e wake di riconnessione.

    Note operative:

    - Se sposti l'app iOS su un gateway diverso, riconnetti l'app in modo che possa pubblicare una nuova registrazione relay associata a quel gateway.
    - Se distribuisci una nuova build iOS che punta a una distribuzione relay diversa, l'app aggiorna la registrazione relay memorizzata nella cache invece di riutilizzare il vecchio relay di origine.

    Nota di compatibilità:

    - `OPENCLAW_APNS_RELAY_BASE_URL` e `OPENCLAW_APNS_RELAY_TIMEOUT_MS` funzionano ancora come override temporanei tramite variabili d'ambiente.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` resta una via di fuga di sviluppo solo loopback; non salvare URL relay HTTP nella configurazione.

    Vedi [App iOS](/it/platforms/ios#relay-backed-push-for-official-builds) per il flusso end-to-end e [Flusso di autenticazione e fiducia](/it/platforms/ios#authentication-and-trust-flow) per il modello di sicurezza del relay.

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

    - `every`: stringa di durata (`30m`, `2h`). Imposta `0m` per disabilitare.
    - `target`: `last` | `none` | `<channel-id>` (per esempio `discord`, `matrix`, `telegram` o `whatsapp`)
    - `directPolicy`: `allow` (predefinito) o `block` per target Heartbeat in stile DM
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

    - `sessionRetention`: elimina dalle sessioni completate isolate da `sessions.json` (predefinito `24h`; imposta `false` per disabilitare).
    - `runLog`: riduce `cron/runs/<jobId>.jsonl` in base a dimensione e righe mantenute.
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
    - Tratta tutto il contenuto dei payload hook/Webhook come input non attendibile.
    - Usa un `hooks.token` dedicato; non riutilizzare il token condiviso del Gateway.
    - L'autenticazione hook è solo tramite header (`Authorization: Bearer ...` o `x-openclaw-token`); i token nella query string vengono rifiutati.
    - `hooks.path` non può essere `/`; mantieni l'ingresso Webhook su un sottopercorso dedicato come `/hooks`.
    - Mantieni disabilitati i flag di bypass dei contenuti non sicuri (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`) a meno che tu non stia facendo debug strettamente delimitato.
    - Se abiliti `hooks.allowRequestSessionKey`, imposta anche `hooks.allowedSessionKeyPrefixes` per limitare le chiavi di sessione selezionate dal chiamante.
    - Per agenti guidati da hook, preferisci livelli di modello moderni e robusti e un criterio degli strumenti restrittivo (per esempio solo messaggistica più sandboxing quando possibile).

    Vedi il [riferimento completo](/it/gateway/configuration-reference#hooks) per tutte le opzioni di mapping e l'integrazione Gmail.

  </Accordion>

  <Accordion title="Configurare l'instradamento multi-agente">
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

    - **Singolo file**: sostituisce l'oggetto contenitore
    - **Array di file**: unione profonda in ordine (quello successivo prevale)
    - **Chiavi sibling**: unite dopo gli include (sovrascrivono i valori inclusi)
    - **Include annidati**: supportati fino a 10 livelli di profondità
    - **Percorsi relativi**: risolti rispetto al file che include
    - **Gestione degli errori**: errori chiari per file mancanti, errori di parsing e include circolari

  </Accordion>
</AccordionGroup>

## Hot reload della configurazione

Il Gateway osserva `~/.openclaw/openclaw.json` e applica automaticamente le modifiche — nella maggior parte dei casi non serve un riavvio manuale.

Le modifiche dirette al file sono trattate come non attendibili finché non vengono validate. Il watcher aspetta
che il churn di scrittura/rinomina temporanea dell'editor si stabilizzi, legge il file finale e rifiuta
le modifiche esterne non valide ripristinando l'ultima configurazione valida. Le scritture di configurazione
possedute da OpenClaw usano lo stesso controllo di schema prima della scrittura; clobber distruttivi come
l'eliminazione di `gateway.mode` o la riduzione del file di oltre la metà vengono rifiutati
e salvati come `.rejected.*` per l'ispezione.

Se nei log vedi `Config auto-restored from last-known-good` oppure
`config reload restored last-known-good config`, controlla il file
`.clobbered.*` corrispondente accanto a `openclaw.json`, correggi il payload rifiutato, poi esegui
`openclaw config validate`. Vedi [Risoluzione dei problemi del Gateway](/it/gateway/troubleshooting#gateway-restored-last-known-good-config)
per la checklist di recupero.

### Modalità di reload

| Modalità               | Comportamento                                                                          |
| ---------------------- | -------------------------------------------------------------------------------------- |
| **`hybrid`** (predefinita) | Applica a caldo subito le modifiche sicure. Riavvia automaticamente per quelle critiche. |
| **`hot`**              | Applica a caldo solo le modifiche sicure. Registra un avviso quando serve un riavvio — lo gestisci tu. |
| **`restart`**          | Riavvia il Gateway a ogni modifica della configurazione, sicura o no.                  |
| **`off`**              | Disabilita l'osservazione del file. Le modifiche hanno effetto al successivo riavvio manuale. |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Cosa si applica a caldo e cosa richiede un riavvio

La maggior parte dei campi si applica a caldo senza downtime. In modalità `hybrid`, le modifiche che richiedono il riavvio vengono gestite automaticamente.

| Categoria           | Campi                                                                | Riavvio necessario? |
| ------------------- | -------------------------------------------------------------------- | ------------------- |
| Canali              | `channels.*`, `web` (WhatsApp) — tutti i canali integrati ed estesi  | No                  |
| Agente e modelli    | `agent`, `agents`, `models`, `routing`                               | No                  |
| Automazione         | `hooks`, `cron`, `agent.heartbeat`                                   | No                  |
| Sessioni e messaggi | `session`, `messages`                                                | No                  |
| Strumenti e media   | `tools`, `browser`, `skills`, `audio`, `talk`                        | No                  |
| UI e varie          | `ui`, `logging`, `identity`, `bindings`                              | No                  |
| Server Gateway      | `gateway.*` (port, bind, auth, tailscale, TLS, HTTP)                 | **Sì**              |
| Infrastruttura      | `discovery`, `canvasHost`, `plugins`                                 | **Sì**              |

<Note>
`gateway.reload` e `gateway.remote` sono eccezioni — modificarli **non** attiva un riavvio.
</Note>

## RPC di configurazione (aggiornamenti programmatici)

<Note>
Le RPC di scrittura del control plane (`config.apply`, `config.patch`, `update.run`) sono soggette a rate limit di **3 richieste ogni 60 secondi** per `deviceId+clientIp`. Quando il limite scatta, la RPC restituisce `UNAVAILABLE` con `retryAfterMs`.
</Note>

Flusso sicuro/predefinito:

- `config.schema.lookup`: ispeziona un singolo sottoalbero della configurazione relativo a un percorso con un nodo di schema superficiale,
  metadati dei suggerimenti corrispondenti e riepiloghi immediati degli elementi figli
- `config.get`: recupera lo snapshot corrente + hash
- `config.patch`: percorso preferito per aggiornamenti parziali
- `config.apply`: solo sostituzione dell'intera configurazione
- `update.run`: auto-aggiornamento esplicito + riavvio

Quando non stai sostituendo l'intera configurazione, preferisci `config.schema.lookup`
poi `config.patch`.

<AccordionGroup>
  <Accordion title="config.apply (sostituzione completa)">
    Valida + scrive l'intera configurazione e riavvia il Gateway in un solo passaggio.

    <Warning>
    `config.apply` sostituisce l'**intera configurazione**. Usa `config.patch` per aggiornamenti parziali, oppure `openclaw config set` per singole chiavi.
    </Warning>

    Parametri:

    - `raw` (stringa) — payload JSON5 per l'intera configurazione
    - `baseHash` (facoltativo) — hash della configurazione da `config.get` (richiesto quando la configurazione esiste)
    - `sessionKey` (facoltativo) — chiave di sessione per il ping di riattivazione post-riavvio
    - `note` (facoltativo) — nota per il sentinel di riavvio
    - `restartDelayMs` (facoltativo) — ritardo prima del riavvio (predefinito 2000)

    Le richieste di riavvio vengono coalescenti mentre una è già in attesa/in corso, e tra i cicli di riavvio si applica un cooldown di 30 secondi.

    ```bash
    openclaw gateway call config.get --params '{}'  # acquisisci payload.hash
    openclaw gateway call config.apply --params '{
      "raw": "{ agents: { defaults: { workspace: \"~/.openclaw/workspace\" } } }",
      "baseHash": "<hash>",
      "sessionKey": "agent:main:whatsapp:direct:+15555550123"
    }'
    ```

  </Accordion>

  <Accordion title="config.patch (aggiornamento parziale)">
    Unisce un aggiornamento parziale alla configurazione esistente (semantica JSON merge patch):

    - Gli oggetti vengono uniti ricorsivamente
    - `null` elimina una chiave
    - Gli array vengono sostituiti

    Parametri:

    - `raw` (stringa) — JSON5 con solo le chiavi da modificare
    - `baseHash` (obbligatorio) — hash della configurazione da `config.get`
    - `sessionKey`, `note`, `restartDelayMs` — uguali a `config.apply`

    Il comportamento di riavvio corrisponde a `config.apply`: riavvii in attesa coalescenti più un cooldown di 30 secondi tra i cicli di riavvio.

    ```bash
    openclaw gateway call config.patch --params '{
      "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
      "baseHash": "<hash>"
    }'
    ```

  </Accordion>
</AccordionGroup>

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

<Accordion title="Importazione dell'env della shell (facoltativo)">
  Se abilitato e le chiavi previste non sono impostate, OpenClaw esegue la tua shell di login e importa solo le chiavi mancanti:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

Equivalente tramite variabile d'ambiente: `OPENCLAW_LOAD_SHELL_ENV=1`
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

- Sono consentiti solo nomi in maiuscolo corrispondenti a: `[A-Z_][A-Z0-9_]*`
- Variabili mancanti/vuote generano un errore al momento del caricamento
- Usa l'escape `$${VAR}` per l'output letterale
- Funziona anche dentro i file `$include`
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
I percorsi delle credenziali supportati sono elencati in [SecretRef Credential Surface](/it/reference/secretref-credential-surface).
</Accordion>

Vedi [Ambiente](/it/help/environment) per la precedenza completa e le origini.

## Riferimento completo

Per il riferimento completo campo per campo, vedi **[Riferimento della configurazione](/it/gateway/configuration-reference)**.

---

_Correlati: [Esempi di configurazione](/it/gateway/configuration-examples) · [Riferimento della configurazione](/it/gateway/configuration-reference) · [Doctor](/it/gateway/doctor)_
