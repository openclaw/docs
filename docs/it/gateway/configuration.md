---
read_when:
    - Configurazione iniziale di OpenClaw
    - Cerchi modelli di configurazione comuni
    - Passaggio a sezioni di configurazione specifiche
summary: 'Panoramica della configurazione: attività comuni, configurazione rapida e link al riferimento completo'
title: Configurazione
x-i18n:
    generated_at: "2026-04-23T13:58:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: d76b40c25f98de791e0d8012b2bc5b80e3e38dde99bb9105539e800ddac3f362
    source_path: gateway/configuration.md
    workflow: 15
---

# Configurazione

OpenClaw legge una configurazione <Tooltip tip="JSON5 supporta commenti e virgole finali">**JSON5**</Tooltip> facoltativa da `~/.openclaw/openclaw.json`.
Il percorso della configurazione attiva deve essere un file regolare. I layout di
`openclaw.json` con symlink non sono supportati per le scritture gestite da OpenClaw; una scrittura atomica può sostituire
il percorso invece di preservare il symlink. Se mantieni la configurazione fuori dalla
directory di stato predefinita, punta `OPENCLAW_CONFIG_PATH` direttamente al file reale.

Se il file manca, OpenClaw usa impostazioni predefinite sicure. Motivi comuni per aggiungere una configurazione:

- Connettere canali e controllare chi può inviare messaggi al bot
- Impostare modelli, strumenti, sandboxing o automazione (cron, hook)
- Regolare sessioni, contenuti multimediali, rete o UI

Consulta il [riferimento completo](/it/gateway/configuration-reference) per ogni campo disponibile.

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
  <Tab title="CLI (comandi in una riga)">
    ```bash
    openclaw config get agents.defaults.workspace
    openclaw config set agents.defaults.heartbeat.every "2h"
    openclaw config unset plugins.entries.brave.config.webSearch.apiKey
    ```
  </Tab>
  <Tab title="Control UI">
    Apri [http://127.0.0.1:18789](http://127.0.0.1:18789) e usa la scheda **Config**.
    Il Control UI genera un modulo dallo schema di configurazione live, inclusi i metadati di documentazione dei campi
    `title` / `description` più gli schemi di plugin e canali quando
    disponibili, con un editor **Raw JSON** come via di fuga. Per UI
    di navigazione dettagliata e altri strumenti, il gateway espone anche `config.schema.lookup` per
    recuperare un singolo nodo di schema con ambito di percorso più i riepiloghi immediati dei figli.
  </Tab>
  <Tab title="Modifica diretta">
    Modifica direttamente `~/.openclaw/openclaw.json`. Il Gateway osserva il file e applica automaticamente le modifiche (vedi [ricaricamento a caldo](#config-hot-reload)).
  </Tab>
</Tabs>

## Validazione rigorosa

<Warning>
OpenClaw accetta solo configurazioni che corrispondono completamente allo schema. Chiavi sconosciute, tipi malformati o valori non validi fanno sì che il Gateway **rifiuti di avviarsi**. L'unica eccezione a livello root è `$schema` (stringa), così gli editor possono associare i metadati JSON Schema.
</Warning>

`openclaw config schema` stampa il JSON Schema canonico usato da Control UI
e dalla validazione. `config.schema.lookup` recupera un singolo nodo con ambito di percorso più
i riepiloghi dei figli per strumenti di navigazione dettagliata. I metadati di documentazione dei campi `title`/`description`
si propagano attraverso oggetti annidati, wildcard (`*`), elementi di array (`[]`) e rami `anyOf`/
`oneOf`/`allOf`. Gli schemi runtime di plugin e canali vengono uniti quando il
registro dei manifest è caricato.

Quando la validazione fallisce:

- Il Gateway non si avvia
- Funzionano solo i comandi diagnostici (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Esegui `openclaw doctor` per vedere i problemi esatti
- Esegui `openclaw doctor --fix` (o `--yes`) per applicare le riparazioni

Il Gateway mantiene una copia attendibile dell'ultimo stato valido dopo ogni avvio riuscito.
Se `openclaw.json` in seguito non supera la validazione (o perde `gateway.mode`, si riduce
bruscamente o presenta una riga di log estranea anteposta), OpenClaw conserva il file non valido
come `.clobbered.*`, ripristina la copia dell'ultimo stato valido e registra il motivo del
ripristino. Anche il turno successivo dell'agente riceve un avviso di evento di sistema, così l'agente principale
non riscrive alla cieca la configurazione ripristinata. La promozione a ultimo stato valido
viene saltata quando un candidato contiene segnaposto di segreti oscurati come `***`.

## Attività comuni

<AccordionGroup>
  <Accordion title="Configurare un canale (WhatsApp, Telegram, Discord, ecc.)">
    Ogni canale ha una propria sezione di configurazione sotto `channels.<provider>`. Consulta la pagina dedicata al canale per i passaggi di configurazione:

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

    Tutti i canali condividono lo stesso schema di policy per i DM:

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

    - `agents.defaults.models` definisce il catalogo dei modelli e funge da allowlist per `/model`.
    - Usa `openclaw config set agents.defaults.models '<json>' --strict-json --merge` per aggiungere voci all'allowlist senza rimuovere i modelli esistenti. Le sostituzioni semplici che rimuoverebbero voci vengono rifiutate a meno che tu non passi `--replace`.
    - I riferimenti ai modelli usano il formato `provider/model` (ad esempio `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` controlla il ridimensionamento delle immagini nel transcript/negli strumenti (predefinito `1200`); valori più bassi di solito riducono l'uso di vision token nelle esecuzioni con molti screenshot.
    - Consulta [Models CLI](/it/concepts/models) per cambiare modello in chat e [Model Failover](/it/concepts/model-failover) per la rotazione dell'autenticazione e il comportamento di fallback.
    - Per provider personalizzati/self-hosted, consulta [Provider personalizzati](/it/gateway/configuration-reference#custom-providers-and-base-urls) nel riferimento.

  </Accordion>

  <Accordion title="Controllare chi può inviare messaggi al bot">
    L'accesso ai DM è controllato per canale tramite `dmPolicy`:

    - `"pairing"` (predefinito): i mittenti sconosciuti ricevono un codice di associazione monouso da approvare
    - `"allowlist"`: solo i mittenti in `allowFrom` (o nell'archivio degli abbinamenti approvati)
    - `"open"`: consente tutti i DM in ingresso (richiede `allowFrom: ["*"]`)
    - `"disabled"`: ignora tutti i DM

    Per i gruppi, usa `groupPolicy` + `groupAllowFrom` o le allowlist specifiche del canale.

    Consulta il [riferimento completo](/it/gateway/configuration-reference#dm-and-group-access) per i dettagli per canale.

  </Accordion>

  <Accordion title="Impostare il filtro per menzioni nelle chat di gruppo">
    Per impostazione predefinita, i messaggi di gruppo **richiedono una menzione**. Configura i pattern per agente:

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

    - **Menzioni nei metadati**: @-mention native (WhatsApp tocca-per-menzionare, Telegram @bot, ecc.)
    - **Pattern di testo**: pattern regex sicuri in `mentionPatterns`
    - Consulta il [riferimento completo](/it/gateway/configuration-reference#group-chat-mention-gating) per override per canale e modalità self-chat.

  </Accordion>

  <Accordion title="Limitare le Skills per agente">
    Usa `agents.defaults.skills` per una base condivisa, poi sovrascrivi gli
    agenti specifici con `agents.list[].skills`:

    ```json5
    {
      agents: {
        defaults: {
          skills: ["github", "weather"],
        },
        list: [
          { id: "writer" }, // eredita github, weather
          { id: "docs", skills: ["docs-search"] }, // sostituisce i valori predefiniti
          { id: "locked-down", skills: [] }, // nessuna Skills
        ],
      },
    }
    ```

    - Ometti `agents.defaults.skills` per avere Skills senza restrizioni per impostazione predefinita.
    - Ometti `agents.list[].skills` per ereditare i valori predefiniti.
    - Imposta `agents.list[].skills: []` per non avere Skills.
    - Consulta [Skills](/it/tools/skills), [Configurazione di Skills](/it/tools/skills-config) e
      il [Riferimento configurazione](/it/gateway/configuration-reference#agents-defaults-skills).

  </Accordion>

  <Accordion title="Regolare il monitoraggio dello stato dei canali del gateway">
    Controlla quanto aggressivamente il gateway riavvia i canali che sembrano inattivi:

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
    - Consulta [Health Checks](/it/gateway/health) per il debug operativo e il [riferimento completo](/it/gateway/configuration-reference#gateway) per tutti i campi.

  </Accordion>

  <Accordion title="Configurare sessioni e reset">
    Le sessioni controllano la continuità e l'isolamento della conversazione:

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
    - `threadBindings`: valori predefiniti globali per il routing delle sessioni legate ai thread (Discord supporta `/focus`, `/unfocus`, `/agents`, `/session idle` e `/session max-age`).
    - Consulta [Gestione delle sessioni](/it/concepts/session) per ambito, collegamenti di identità e policy di invio.
    - Consulta il [riferimento completo](/it/gateway/configuration-reference#session) per tutti i campi.

  </Accordion>

  <Accordion title="Abilitare il sandboxing">
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

    Costruisci prima l'immagine: `scripts/sandbox-setup.sh`

    Consulta [Sandboxing](/it/gateway/sandboxing) per la guida completa e il [riferimento completo](/it/gateway/configuration-reference#agentsdefaultssandbox) per tutte le opzioni.

  </Accordion>

  <Accordion title="Abilitare le notifiche push tramite relay per le build iOS ufficiali">
    Le notifiche push tramite relay sono configurate in `openclaw.json`.

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

    - Consente al gateway di inviare `push.test`, segnali di risveglio e risvegli di riconnessione tramite il relay esterno.
    - Usa un permesso di invio con ambito di registrazione inoltrato dall'app iOS associata. Il gateway non ha bisogno di un token relay valido per l'intera distribuzione.
    - Collega ogni registrazione supportata da relay all'identità del gateway con cui l'app iOS è stata associata, così un altro gateway non può riutilizzare la registrazione memorizzata.
    - Mantiene le build iOS locali/manuali su APNs diretto. Gli invii supportati da relay si applicano solo alle build ufficiali distribuite che si sono registrate tramite il relay.
    - Deve corrispondere al base URL del relay incorporato nella build iOS ufficiale/TestFlight, in modo che il traffico di registrazione e invio raggiunga la stessa distribuzione relay.

    Flusso end-to-end:

    1. Installa una build iOS ufficiale/TestFlight compilata con lo stesso base URL del relay.
    2. Configura `gateway.push.apns.relay.baseUrl` sul gateway.
    3. Associa l'app iOS al gateway e lascia che si connettano sia le sessioni del nodo sia quelle dell'operatore.
    4. L'app iOS recupera l'identità del gateway, si registra con il relay usando App Attest insieme alla ricevuta dell'app, quindi pubblica il payload `push.apns.register` supportato da relay sul gateway associato.
    5. Il gateway memorizza l'handle relay e il permesso di invio, quindi li usa per `push.test`, segnali di risveglio e risvegli di riconnessione.

    Note operative:

    - Se sposti l'app iOS su un gateway diverso, riconnetti l'app così potrà pubblicare una nuova registrazione relay associata a quel gateway.
    - Se distribuisci una nuova build iOS che punta a una distribuzione relay diversa, l'app aggiorna la registrazione relay memorizzata in cache invece di riutilizzare la vecchia origine relay.

    Nota sulla compatibilità:

    - `OPENCLAW_APNS_RELAY_BASE_URL` e `OPENCLAW_APNS_RELAY_TIMEOUT_MS` continuano a funzionare come override temporanei tramite env.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` rimane una via di fuga di sviluppo solo loopback; non persistere URL relay HTTP nella configurazione.

    Consulta [App iOS](/it/platforms/ios#relay-backed-push-for-official-builds) per il flusso end-to-end e [Flusso di autenticazione e attendibilità](/it/platforms/ios#authentication-and-trust-flow) per il modello di sicurezza del relay.

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

    - `every`: stringa di durata (`30m`, `2h`). Imposta `0m` per disabilitare.
    - `target`: `last` | `none` | `<channel-id>` (ad esempio `discord`, `matrix`, `telegram` o `whatsapp`)
    - `directPolicy`: `allow` (predefinito) o `block` per target Heartbeat in stile DM
    - Consulta [Heartbeat](/it/gateway/heartbeat) per la guida completa.

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
    - `runLog`: elimina in `cron/runs/<jobId>.jsonl` in base alla dimensione e alle righe conservate.
    - Consulta [Processi Cron](/it/automation/cron-jobs) per una panoramica della funzionalità ed esempi CLI.

  </Accordion>

  <Accordion title="Impostare Webhook (hook)">
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

    Nota sulla sicurezza:
    - Tratta tutto il contenuto dei payload hook/webhook come input non attendibile.
    - Usa un `hooks.token` dedicato; non riutilizzare il token Gateway condiviso.
    - L'autenticazione hook è solo tramite header (`Authorization: Bearer ...` o `x-openclaw-token`); i token nella query string vengono rifiutati.
    - `hooks.path` non può essere `/`; mantieni l'ingresso webhook su un sottopercorso dedicato come `/hooks`.
    - Mantieni disabilitati i flag di bypass del contenuto non sicuro (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`) a meno che tu non stia eseguendo debug strettamente circoscritti.
    - Se abiliti `hooks.allowRequestSessionKey`, imposta anche `hooks.allowedSessionKeyPrefixes` per limitare le chiavi di sessione selezionate dal chiamante.
    - Per gli agenti guidati da hook, preferisci tier di modelli moderni e robusti e una policy degli strumenti rigorosa (ad esempio solo messaggistica più sandboxing quando possibile).

    Consulta il [riferimento completo](/it/gateway/configuration-reference#hooks) per tutte le opzioni di mapping e l'integrazione Gmail.

  </Accordion>

  <Accordion title="Configurare il routing multi-agent">
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

    Consulta [Multi-Agent](/it/concepts/multi-agent) e il [riferimento completo](/it/gateway/configuration-reference#multi-agent-routing) per le regole di binding e i profili di accesso per agente.

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
    - **Array di file**: unione profonda in ordine (i successivi hanno la precedenza)
    - **Chiavi sibling**: unite dopo gli include (sovrascrivono i valori inclusi)
    - **Include annidati**: supportati fino a 10 livelli di profondità
    - **Percorsi relativi**: risolti relativamente al file che include
    - **Scritture gestite da OpenClaw**: quando una scrittura modifica solo una sezione di primo livello
      supportata da un include a file singolo come `plugins: { $include: "./plugins.json5" }`,
      OpenClaw aggiorna quel file incluso e lascia intatto `openclaw.json`
    - **Write-through non supportato**: include root, array di include e include
      con override sibling falliscono in modo sicuro per le scritture gestite da OpenClaw invece di
      appiattire la configurazione
    - **Gestione degli errori**: errori chiari per file mancanti, errori di parsing e include circolari

  </Accordion>
</AccordionGroup>

## Ricaricamento a caldo della configurazione

Il Gateway osserva `~/.openclaw/openclaw.json` e applica automaticamente le modifiche — per la maggior parte delle impostazioni non è necessario alcun riavvio manuale.

Le modifiche dirette al file vengono trattate come non attendibili finché non superano la validazione. Il watcher attende
che il churn di scrittura temporanea/rinomina dell'editor si stabilizzi, legge il file finale e rifiuta
le modifiche esterne non valide ripristinando la configurazione dell'ultimo stato valido. Le scritture di configurazione
gestite da OpenClaw usano lo stesso controllo di schema prima della scrittura; clobber distruttivi come
la rimozione di `gateway.mode` o la riduzione del file di oltre la metà vengono rifiutati
e salvati come `.rejected.*` per l'ispezione.

Se vedi `Config auto-restored from last-known-good` o
`config reload restored last-known-good config` nei log, esamina il file
`.clobbered.*` corrispondente accanto a `openclaw.json`, correggi il payload rifiutato, quindi esegui
`openclaw config validate`. Consulta [Risoluzione dei problemi del Gateway](/it/gateway/troubleshooting#gateway-restored-last-known-good-config)
per la checklist di ripristino.

### Modalità di ricaricamento

| Modalità               | Comportamento                                                                          |
| ---------------------- | -------------------------------------------------------------------------------------- |
| **`hybrid`** (predefinita) | Applica a caldo immediatamente le modifiche sicure. Riavvia automaticamente per quelle critiche. |
| **`hot`**              | Applica a caldo solo le modifiche sicure. Registra un avviso quando è necessario un riavvio — lo gestisci tu. |
| **`restart`**          | Riavvia il Gateway a ogni modifica della configurazione, sicura o meno.                |
| **`off`**              | Disabilita l'osservazione dei file. Le modifiche hanno effetto al successivo riavvio manuale. |

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
| ------------------- | ----------------------------------------------------------------- | ------------------- |
| Canali              | `channels.*`, `web` (WhatsApp) — tutti i canali integrati e plugin | No                  |
| Agente e modelli    | `agent`, `agents`, `models`, `routing`                            | No                  |
| Automazione         | `hooks`, `cron`, `agent.heartbeat`                                | No                  |
| Sessioni e messaggi | `session`, `messages`                                             | No                  |
| Strumenti e media   | `tools`, `browser`, `skills`, `audio`, `talk`                     | No                  |
| UI e varie          | `ui`, `logging`, `identity`, `bindings`                           | No                  |
| Server Gateway      | `gateway.*` (porta, bind, auth, tailscale, TLS, HTTP)             | **Sì**              |
| Infrastruttura      | `discovery`, `canvasHost`, `plugins`                              | **Sì**              |

<Note>
`gateway.reload` e `gateway.remote` sono eccezioni — modificarli **non** attiva un riavvio.
</Note>

### Pianificazione del ricaricamento

Quando modifichi un file sorgente referenziato tramite `$include`, OpenClaw pianifica
il ricaricamento in base al layout creato nella sorgente, non alla vista in memoria appiattita.
Questo mantiene prevedibili le decisioni di hot reload (applicazione a caldo vs riavvio) anche quando una
singola sezione di primo livello si trova nel proprio file incluso, come
`plugins: { $include: "./plugins.json5" }`. La pianificazione del ricaricamento fallisce in modo sicuro se il
layout sorgente è ambiguo.

## RPC di configurazione (aggiornamenti programmatici)

Per gli strumenti che scrivono la configurazione tramite l'API del gateway, preferisci questo flusso:

- `config.schema.lookup` per ispezionare un sottoalbero (nodo di schema superficiale + riepiloghi
  dei figli)
- `config.get` per recuperare lo snapshot corrente più `hash`
- `config.patch` per aggiornamenti parziali (JSON merge patch: gli oggetti si uniscono, `null`
  elimina, gli array sostituiscono)
- `config.apply` solo quando intendi sostituire l'intera configurazione
- `update.run` per auto-aggiornamento esplicito più riavvio

<Note>
Le scritture del control plane (`config.apply`, `config.patch`, `update.run`) sono
soggette a rate limit di 3 richieste per 60 secondi per `deviceId+clientIp`. Le richieste di riavvio
vengono accorpate e poi applicano un cooldown di 30 secondi tra i cicli di riavvio.
</Note>

Esempio di patch parziale:

```bash
openclaw gateway call config.get --params '{}'  # acquisisci payload.hash
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

Sia `config.apply` sia `config.patch` accettano `raw`, `baseHash`, `sessionKey`,
`note` e `restartDelayMs`. `baseHash` è richiesto per entrambi i metodi quando
esiste già una configurazione.

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

<Accordion title="Importazione env della shell (facoltativa)">
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

<Accordion title="Sostituzione di variabili d'ambiente nei valori di configurazione">
  Fai riferimento alle variabili d'ambiente in qualsiasi valore stringa della configurazione con `${VAR_NAME}`:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

Regole:

- Vengono corrisposti solo nomi in maiuscolo: `[A-Z_][A-Z0-9_]*`
- Variabili mancanti/vuote generano un errore al momento del caricamento
- Usa l'escape con `$${VAR}` per output letterale
- Funziona all'interno dei file `$include`
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

I dettagli di SecretRef (incluso `secrets.providers` per `env`/`file`/`exec`) sono in [Gestione dei segreti](/it/gateway/secrets).
I percorsi delle credenziali supportati sono elencati in [Superficie delle credenziali SecretRef](/it/reference/secretref-credential-surface).
</Accordion>

Consulta [Ambiente](/it/help/environment) per la precedenza completa e le fonti.

## Riferimento completo

Per il riferimento completo campo per campo, consulta **[Riferimento configurazione](/it/gateway/configuration-reference)**.

---

_Correlati: [Esempi di configurazione](/it/gateway/configuration-examples) · [Riferimento configurazione](/it/gateway/configuration-reference) · [Doctor](/it/gateway/doctor)_
