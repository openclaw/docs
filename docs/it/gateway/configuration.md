---
read_when:
    - Stai configurando OpenClaw per la prima volta
    - Cerchi pattern di configurazione comuni
    - Vuoi navigare verso sezioni specifiche della configurazione
summary: 'Panoramica della configurazione: attività comuni, configurazione rapida e link al riferimento completo'
title: Configurazione
x-i18n:
    generated_at: "2026-04-05T13:52:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: a39a7de09c5f9540785ec67f37d435a7a86201f0f5f640dae663054f35976712
    source_path: gateway/configuration.md
    workflow: 15
---

# Configurazione

OpenClaw legge una configurazione facoltativa in <Tooltip tip="JSON5 supporta commenti e virgole finali">**JSON5**</Tooltip> da `~/.openclaw/openclaw.json`.

Se il file manca, OpenClaw usa impostazioni predefinite sicure. Motivi comuni per aggiungere una configurazione:

- Connettere i canali e controllare chi può inviare messaggi al bot
- Impostare modelli, strumenti, sandboxing o automazione (cron, hook)
- Ottimizzare sessioni, media, rete o UI

Consulta il [riferimento completo](/gateway/configuration-reference) per ogni campo disponibile.

<Tip>
**Sei nuovo alla configurazione?** Inizia con `openclaw onboard` per la configurazione interattiva, oppure consulta la guida [Esempi di configurazione](/gateway/configuration-examples) per configurazioni complete da copiare e incollare.
</Tip>

## Configurazione minima

```json5
// ~/.openclaw/openclaw.json
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

## Modificare la configurazione

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
  <Tab title="UI di controllo">
    Apri [http://127.0.0.1:18789](http://127.0.0.1:18789) e usa la scheda **Config**.
    La UI di controllo visualizza un modulo dallo schema di configurazione live, inclusi i metadati di documentazione dei campi
    `title` / `description` più gli schemi di plugin e canale quando
    disponibili, con un editor **Raw JSON** come via di fuga. Per UI di analisi dettagliata
    e altri strumenti, il gateway espone anche `config.schema.lookup` per
    recuperare un nodo di schema limitato a un percorso più i riepiloghi dei figli immediati.
  </Tab>
  <Tab title="Modifica diretta">
    Modifica direttamente `~/.openclaw/openclaw.json`. Il Gateway osserva il file e applica automaticamente le modifiche (vedi [hot reload](#config-hot-reload)).
  </Tab>
</Tabs>

## Validazione rigorosa

<Warning>
OpenClaw accetta solo configurazioni che corrispondono completamente allo schema. Chiavi sconosciute, tipi non validi o valori non validi fanno sì che il Gateway **si rifiuti di avviarsi**. L'unica eccezione a livello root è `$schema` (stringa), così gli editor possono collegare metadati JSON Schema.
</Warning>

Note sugli strumenti di schema:

- `openclaw config schema` stampa la stessa famiglia di JSON Schema usata dalla UI di controllo
  e dalla validazione della configurazione.
- I valori `title` e `description` dei campi vengono riportati nell'output dello schema per
  editor e strumenti per moduli.
- Le voci di oggetti annidati, wildcard (`*`) e elementi di array (`[]`) ereditano gli stessi
  metadati di documentazione dove esiste documentazione di campo corrispondente.
- Anche i rami di composizione `anyOf` / `oneOf` / `allOf` ereditano gli stessi metadati
  di documentazione, così le varianti union/intersection mantengono lo stesso aiuto per i campi.
- `config.schema.lookup` restituisce un percorso di configurazione normalizzato con un nodo di schema superficiale (`title`, `description`, `type`, `enum`, `const`, limiti comuni
  e campi di validazione simili), metadati di suggerimento UI corrispondenti e riepiloghi dei figli immediati per strumenti di analisi dettagliata.
- Gli schemi runtime di plugin/canale vengono uniti quando il gateway riesce a caricare il
  registro manifest corrente.

Quando la validazione fallisce:

- Il Gateway non si avvia
- Funzionano solo i comandi diagnostici (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Esegui `openclaw doctor` per vedere i problemi esatti
- Esegui `openclaw doctor --fix` (o `--yes`) per applicare le riparazioni

## Attività comuni

<AccordionGroup>
  <Accordion title="Configurare un canale (WhatsApp, Telegram, Discord, ecc.)">
    Ogni canale ha la propria sezione di configurazione sotto `channels.<provider>`. Consulta la pagina dedicata al canale per i passaggi di configurazione:

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

    - `agents.defaults.models` definisce il catalogo modelli e funge da allowlist per `/model`.
    - I riferimenti ai modelli usano il formato `provider/model` (ad esempio `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` controlla il ridimensionamento delle immagini in trascrizione/strumenti (predefinito `1200`); valori inferiori in genere riducono l'uso di token vision nelle esecuzioni ricche di screenshot.
    - Vedi [Models CLI](/concepts/models) per cambiare modello in chat e [Model Failover](/concepts/model-failover) per il comportamento di rotazione auth e fallback.
    - Per provider personalizzati/self-hosted, vedi [Provider personalizzati](/gateway/configuration-reference#custom-providers-and-base-urls) nel riferimento.

  </Accordion>

  <Accordion title="Controllare chi può inviare messaggi al bot">
    L'accesso DM è controllato per canale tramite `dmPolicy`:

    - `"pairing"` (predefinito): i mittenti sconosciuti ricevono un codice pairing monouso da approvare
    - `"allowlist"`: solo i mittenti in `allowFrom` (o nello store paired allow)
    - `"open"`: consente tutti i DM in ingresso (richiede `allowFrom: ["*"]`)
    - `"disabled"`: ignora tutti i DM

    Per i gruppi, usa `groupPolicy` + `groupAllowFrom` o allowlist specifiche del canale.

    Consulta il [riferimento completo](/gateway/configuration-reference#dm-and-group-access) per i dettagli per canale.

  </Accordion>

  <Accordion title="Configurare il gating per menzione nelle chat di gruppo">
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

    - **Menzioni nei metadati**: @-mention native (tap-to-mention di WhatsApp, @bot di Telegram, ecc.)
    - **Pattern di testo**: pattern regex sicuri in `mentionPatterns`
    - Consulta il [riferimento completo](/gateway/configuration-reference#group-chat-mention-gating) per override per canale e modalità self-chat.

  </Accordion>

  <Accordion title="Limitare le Skills per agente">
    Usa `agents.defaults.skills` per una baseline condivisa, quindi fai override di
    agenti specifici con `agents.list[].skills`:

    ```json5
    {
      agents: {
        defaults: {
          skills: ["github", "weather"],
        },
        list: [
          { id: "writer" }, // eredita github, weather
          { id: "docs", skills: ["docs-search"] }, // sostituisce i default
          { id: "locked-down", skills: [] }, // nessuna Skills
        ],
      },
    }
    ```

    - Ometti `agents.defaults.skills` per avere Skills senza restrizioni per impostazione predefinita.
    - Ometti `agents.list[].skills` per ereditare i valori predefiniti.
    - Imposta `agents.list[].skills: []` per nessuna Skills.
    - Consulta [Skills](/tools/skills), [Config Skills](/tools/skills-config) e
      il [Riferimento configurazione](/gateway/configuration-reference#agentsdefaultsskills).

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
    - Usa `channels.<provider>.healthMonitor.enabled` o `channels.<provider>.accounts.<id>.healthMonitor.enabled` per disabilitare i riavvii automatici per un canale o account senza disabilitare il monitor globale.
    - Consulta [Health Checks](/gateway/health) per il debug operativo e il [riferimento completo](/gateway/configuration-reference#gateway) per tutti i campi.

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

    - `dmScope`: `main` (condivisa) | `per-peer` | `per-channel-peer` | `per-account-channel-peer`
    - `threadBindings`: valori predefiniti globali per l'instradamento delle sessioni associate ai thread (Discord supporta `/focus`, `/unfocus`, `/agents`, `/session idle` e `/session max-age`).
    - Consulta [Gestione delle sessioni](/concepts/session) per ambito, collegamenti di identità e policy di invio.
    - Consulta il [riferimento completo](/gateway/configuration-reference#session) per tutti i campi.

  </Accordion>

  <Accordion title="Abilitare il sandboxing">
    Esegui le sessioni agente in container Docker isolati:

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

    Consulta [Sandboxing](/gateway/sandboxing) per la guida completa e il [riferimento completo](/gateway/configuration-reference#agentsdefaultssandbox) per tutte le opzioni.

  </Accordion>

  <Accordion title="Abilitare il push supportato da relay per le build iOS ufficiali">
    Il push supportato da relay si configura in `openclaw.json`.

    Imposta questo nella configurazione gateway:

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

    - Consente al gateway di inviare `push.test`, wake nudges e wake di riconnessione tramite il relay esterno.
    - Usa un permesso di invio limitato alla registrazione inoltrato dall'app iOS paired. Il gateway non ha bisogno di un token relay valido per tutta la distribuzione.
    - Associa ogni registrazione supportata da relay all'identità del gateway con cui l'app iOS ha effettuato il pairing, così un altro gateway non può riutilizzare la registrazione memorizzata.
    - Mantiene le build iOS locali/manuali su APNs diretti. Gli invii supportati da relay si applicano solo alle build ufficiali distribuite che si sono registrate tramite il relay.
    - Deve corrispondere al base URL del relay incorporato nella build iOS ufficiale/TestFlight, così il traffico di registrazione e invio raggiunge la stessa distribuzione relay.

    Flusso end-to-end:

    1. Installa una build iOS ufficiale/TestFlight compilata con lo stesso base URL del relay.
    2. Configura `gateway.push.apns.relay.baseUrl` sul gateway.
    3. Esegui il pairing dell'app iOS con il gateway e lascia che si connettano sia le sessioni node sia quelle operator.
    4. L'app iOS recupera l'identità del gateway, si registra presso il relay usando App Attest più la ricevuta dell'app e quindi pubblica il payload `push.apns.register` supportato da relay sul gateway paired.
    5. Il gateway memorizza l'handle relay e il permesso di invio, poi li usa per `push.test`, wake nudges e wake di riconnessione.

    Note operative:

    - Se sposti l'app iOS su un gateway diverso, ricollega l'app così potrà pubblicare una nuova registrazione relay associata a quel gateway.
    - Se distribuisci una nuova build iOS che punta a una distribuzione relay diversa, l'app aggiorna la registrazione relay memorizzata invece di riutilizzare la vecchia origine relay.

    Nota di compatibilità:

    - `OPENCLAW_APNS_RELAY_BASE_URL` e `OPENCLAW_APNS_RELAY_TIMEOUT_MS` funzionano ancora come override temporanei via env.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` rimane una via di fuga di sviluppo solo loopback; non mantenere URL relay HTTP nella configurazione.

    Consulta [App iOS](/platforms/ios#relay-backed-push-for-official-builds) per il flusso end-to-end e [Flusso di autenticazione e attendibilità](/platforms/ios#authentication-and-trust-flow) per il modello di sicurezza del relay.

  </Accordion>

  <Accordion title="Configurare heartbeat (check-in periodici)">
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
    - `directPolicy`: `allow` (predefinito) oppure `block` per target heartbeat in stile DM
    - Consulta [Heartbeat](/gateway/heartbeat) per la guida completa.

  </Accordion>

  <Accordion title="Configurare i cron job">
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

    - `sessionRetention`: elimina le sessioni isolate completate da `sessions.json` (predefinito `24h`; imposta `false` per disabilitare).
    - `runLog`: pota `cron/runs/<jobId>.jsonl` in base a dimensione e righe mantenute.
    - Consulta [Cron jobs](/it/automation/cron-jobs) per la panoramica della funzionalità e gli esempi CLI.

  </Accordion>

  <Accordion title="Configurare webhook (hook)">
    Abilita endpoint webhook HTTP sul Gateway:

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
    - Usa un `hooks.token` dedicato; non riutilizzare il token condiviso del Gateway.
    - L'autenticazione hook è solo header (`Authorization: Bearer ...` o `x-openclaw-token`); i token nella query string vengono rifiutati.
    - `hooks.path` non può essere `/`; mantieni l'ingresso webhook su un sottopercorso dedicato come `/hooks`.
    - Mantieni disabilitati i flag di bypass per contenuto non sicuro (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`) a meno che tu non stia facendo debug molto mirato.
    - Se abiliti `hooks.allowRequestSessionKey`, imposta anche `hooks.allowedSessionKeyPrefixes` per limitare le chiavi di sessione selezionabili dal chiamante.
    - Per agenti guidati da hook, preferisci livelli di modello moderni e forti e una policy strumenti rigorosa (ad esempio solo messaggistica più sandboxing dove possibile).

    Consulta il [riferimento completo](/gateway/configuration-reference#hooks) per tutte le opzioni di mapping e l'integrazione Gmail.

  </Accordion>

  <Accordion title="Configurare l'instradamento multi-agent">
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

    Consulta [Multi-Agent](/concepts/multi-agent) e il [riferimento completo](/gateway/configuration-reference#multi-agent-routing) per regole di binding e profili di accesso per agente.

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
    - **Percorsi relativi**: risolti relativamente al file che include
    - **Gestione errori**: errori chiari per file mancanti, errori di parsing e include circolari

  </Accordion>
</AccordionGroup>

## Hot reload della configurazione

Il Gateway osserva `~/.openclaw/openclaw.json` e applica automaticamente le modifiche — per la maggior parte delle impostazioni non è necessario alcun riavvio manuale.

### Modalità di ricarica

| Modalità               | Comportamento                                                                          |
| ---------------------- | -------------------------------------------------------------------------------------- |
| **`hybrid`** (predefinita) | Applica a caldo immediatamente le modifiche sicure. Si riavvia automaticamente per quelle critiche. |
| **`hot`**              | Applica a caldo solo le modifiche sicure. Registra un avviso quando è necessario un riavvio — lo gestisci tu. |
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

La maggior parte dei campi viene applicata a caldo senza downtime. In modalità `hybrid`, le modifiche che richiedono un riavvio vengono gestite automaticamente.

| Categoria            | Campi                                                               | Riavvio necessario? |
| ------------------- | -------------------------------------------------------------------- | --------------- |
| Canali            | `channels.*`, `web` (WhatsApp) — tutti i canali built-in ed extension | No              |
| Agente e modelli      | `agent`, `agents`, `models`, `routing`                               | No              |
| Automazione          | `hooks`, `cron`, `agent.heartbeat`                                   | No              |
| Sessioni e messaggi | `session`, `messages`                                                | No              |
| Strumenti e media       | `tools`, `browser`, `skills`, `audio`, `talk`                        | No              |
| UI e varie           | `ui`, `logging`, `identity`, `bindings`                              | No              |
| Server Gateway      | `gateway.*` (porta, bind, auth, tailscale, TLS, HTTP)                 | **Sì**         |
| Infrastruttura      | `discovery`, `canvasHost`, `plugins`                                 | **Sì**         |

<Note>
`gateway.reload` e `gateway.remote` sono eccezioni — modificarli **non** attiva un riavvio.
</Note>

## RPC di configurazione (aggiornamenti programmatici)

<Note>
Le RPC di scrittura del control-plane (`config.apply`, `config.patch`, `update.run`) hanno un rate limit di **3 richieste per 60 secondi** per `deviceId+clientIp`. Quando il limite viene raggiunto, la RPC restituisce `UNAVAILABLE` con `retryAfterMs`.
</Note>

Flusso sicuro/predefinito:

- `config.schema.lookup`: ispeziona un sottoalbero di configurazione limitato a un percorso con un nodo di schema superficiale, metadati di suggerimento corrispondenti e riepiloghi dei figli immediati
- `config.get`: recupera l'istantanea corrente + hash
- `config.patch`: percorso preferito per aggiornamenti parziali
- `config.apply`: sostituzione completa della configurazione solo
- `update.run`: auto-aggiornamento esplicito + riavvio

Quando non stai sostituendo l'intera configurazione, preferisci `config.schema.lookup`
poi `config.patch`.

<AccordionGroup>
  <Accordion title="config.apply (sostituzione completa)">
    Valida + scrive l'intera configurazione e riavvia il Gateway in un unico passaggio.

    <Warning>
    `config.apply` sostituisce l'**intera configurazione**. Usa `config.patch` per aggiornamenti parziali, oppure `openclaw config set` per singole chiavi.
    </Warning>

    Parametri:

    - `raw` (stringa) — payload JSON5 per l'intera configurazione
    - `baseHash` (facoltativo) — hash di configurazione da `config.get` (obbligatorio quando la configurazione esiste)
    - `sessionKey` (facoltativo) — chiave di sessione per il ping di wake-up post-riavvio
    - `note` (facoltativo) — nota per il sentinel di riavvio
    - `restartDelayMs` (facoltativo) — ritardo prima del riavvio (predefinito 2000)

    Le richieste di riavvio vengono accorpate mentre una è già in attesa/in corso, e si applica un cooldown di 30 secondi tra i cicli di riavvio.

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
    - Gli array sostituiscono

    Parametri:

    - `raw` (stringa) — JSON5 con solo le chiavi da modificare
    - `baseHash` (obbligatorio) — hash di configurazione da `config.get`
    - `sessionKey`, `note`, `restartDelayMs` — uguali a `config.apply`

    Il comportamento di riavvio corrisponde a `config.apply`: riavvii in attesa accorpati più un cooldown di 30 secondi tra i cicli di riavvio.

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

<Accordion title="Importazione env della shell (facoltativa)">
  Se abilitato e le chiavi previste non sono impostate, OpenClaw esegue la shell di login e importa solo le chiavi mancanti:

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

- Vengono riconosciuti solo nomi maiuscoli corrispondenti a: `[A-Z_][A-Z0-9_]*`
- Variabili mancanti/vuote generano un errore al caricamento
- Esegui l'escape con `$${VAR}` per output letterale
- Funziona nei file `$include`
- Sostituzione inline: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="Riferimenti ai secret (env, file, exec)">
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

I dettagli su SecretRef (inclusi `secrets.providers` per `env`/`file`/`exec`) sono in [Gestione dei secret](/gateway/secrets).
I percorsi credenziali supportati sono elencati in [Superficie credenziali SecretRef](/reference/secretref-credential-surface).
</Accordion>

Consulta [Ambiente](/help/environment) per la precedenza completa e le sorgenti.

## Riferimento completo

Per il riferimento completo campo per campo, consulta **[Riferimento configurazione](/gateway/configuration-reference)**.

---

_Correlati: [Esempi di configurazione](/gateway/configuration-examples) · [Riferimento configurazione](/gateway/configuration-reference) · [Doctor](/gateway/doctor)_
