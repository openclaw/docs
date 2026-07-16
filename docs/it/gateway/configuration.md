---
read_when:
    - Configurazione iniziale di OpenClaw
    - Ricerca di modelli di configurazione comuni
    - Passaggio a sezioni specifiche della configurazione
summary: 'Panoramica della configurazione: attività comuni, configurazione rapida e collegamenti alla documentazione di riferimento completa'
title: Configurazione
x-i18n:
    generated_at: "2026-07-16T14:20:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 77f45ec71032ad6f651fcb68f9fb37f6677de90ec5ccca33ee84794056c58f89
    source_path: gateway/configuration.md
    workflow: 16
---

OpenClaw legge una configurazione <Tooltip tip="JSON5 supporta commenti e virgole finali">**JSON5**</Tooltip> facoltativa da `~/.openclaw/openclaw.json`. Se il file non è presente, OpenClaw utilizza impostazioni predefinite sicure.

Il percorso della configurazione attiva deve essere un file regolare. Le scritture gestite da OpenClaw lo sostituiscono atomicamente (rinominando il file sul percorso), quindi, se `openclaw.json` è un collegamento simbolico, ne viene sostituita la destinazione anziché scrivere attraverso il collegamento: evitare configurazioni basate su collegamenti simbolici. Se la configurazione viene mantenuta al di fuori della directory di stato predefinita, impostare `OPENCLAW_CONFIG_PATH` direttamente sul file reale.

Motivi comuni per aggiungere una configurazione:

- Connettere i canali e controllare chi può inviare messaggi al bot
- Impostare modelli, strumenti, sandboxing o automazione (cron, hook)
- Regolare sessioni, contenuti multimediali, rete o interfaccia utente

Consultare il [riferimento completo](/it/gateway/configuration-reference) per tutti i campi disponibili.

Gli agenti e l'automazione devono utilizzare `config.schema.lookup` per la documentazione
esatta a livello di campo prima di modificare la configurazione. Utilizzare questa pagina per indicazioni orientate alle attività e il
[Riferimento della configurazione](/it/gateway/configuration-reference) per una panoramica più ampia
dei campi e delle impostazioni predefinite.

<Tip>
**Prima esperienza con la configurazione?** Iniziare con `openclaw onboard` per la configurazione interattiva oppure consultare la guida [Esempi di configurazione](/it/gateway/configuration-examples) per configurazioni complete da copiare e incollare.
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
  <Tab title="CLI (comandi su una riga)">
    ```bash
    openclaw config get agents.defaults.workspace
    openclaw config set agents.defaults.heartbeat.every "2h"
    openclaw config unset plugins.entries.brave.config.webSearch.apiKey
    ```
  </Tab>
  <Tab title="Interfaccia di controllo">
    Aprire [http://127.0.0.1:18789](http://127.0.0.1:18789) e utilizzare la scheda **Config**.
    L'interfaccia di controllo genera un modulo dallo schema di configurazione attivo, includendo i metadati della documentazione
    `title` / `description` dei campi e gli schemi di Plugin e canali, quando
    disponibili, con un editor **Raw JSON** come soluzione alternativa. Per interfacce
    di approfondimento e altri strumenti, il Gateway espone anche `config.schema.lookup` per
    recuperare un nodo dello schema relativo a un singolo percorso insieme ai riepiloghi dei figli immediati.
  </Tab>
  <Tab title="Modifica diretta">
    Modificare direttamente `~/.openclaw/openclaw.json`. Il Gateway monitora il file e applica automaticamente le modifiche (vedere [ricaricamento a caldo](#config-hot-reload)).
  </Tab>
</Tabs>

## Convalida rigorosa

<Warning>
OpenClaw accetta solo configurazioni che corrispondono completamente allo schema. Chiavi sconosciute, tipi non validi o valori non validi fanno sì che il Gateway **si rifiuti di avviarsi**. L'unica eccezione a livello radice è `$schema` (stringa), che consente agli editor di allegare metadati JSON Schema.
</Warning>

`openclaw config schema` stampa il JSON Schema canonico utilizzato dall'interfaccia di controllo
e dalla convalida. `config.schema.lookup` recupera un singolo nodo relativo a un percorso insieme
ai riepiloghi dei figli per gli strumenti di approfondimento. I metadati della documentazione dei campi `title`/`description`
si propagano attraverso oggetti annidati, caratteri jolly (`*`), elementi di array (`[]`) e rami `anyOf`/
`oneOf`/`allOf`. Gli schemi di runtime di Plugin e canali vengono integrati quando
viene caricato il registro dei manifest.

Quando la convalida non riesce:

- Il Gateway non si avvia
- Funzionano solo i comandi diagnostici (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Eseguire `openclaw doctor` per visualizzare i problemi esatti
- Eseguire `openclaw doctor --fix` (`--repair` è lo stesso flag; `--yes` ignora le richieste di conferma) per applicare le correzioni

Dopo ogni avvio riuscito, il Gateway conserva una copia attendibile dell'ultima configurazione valida nota,
ma l'avvio e il ricaricamento a caldo non la ripristinano automaticamente: solo `openclaw doctor --fix`
lo fa. Se `openclaw.json` non supera la convalida (inclusa quella locale del Plugin), l'avvio del Gateway
non riesce oppure il ricaricamento viene ignorato e il runtime corrente mantiene l'ultima configurazione
accettata. Una scrittura rifiutata viene inoltre salvata come `<path>.rejected.<timestamp>` per poterla esaminare.
Il Gateway blocca le scritture che sembrano sovrascritture accidentali, come la rimozione di `gateway.mode`,
la perdita del blocco `meta` o la riduzione del file di oltre la metà, a meno che la scrittura
non consenta esplicitamente modifiche distruttive. La promozione a ultima configurazione valida nota viene ignorata quando un
candidato contiene un segnaposto di segreto oscurato, come `***` o `[redacted]`.

## Attività comuni

<AccordionGroup>
  <Accordion title="Configurare un canale (WhatsApp, Telegram, Discord e così via)">
    Ogni canale dispone della propria sezione di configurazione in `channels.<provider>`. Consultare la pagina dedicata al canale per i passaggi di configurazione:

    - [Discord](/it/channels/discord) - `channels.discord`
    - [Feishu](/it/channels/feishu) - `channels.feishu`
    - [Google Chat](/it/channels/googlechat) - `channels.googlechat`
    - [iMessage](/it/channels/imessage) - `channels.imessage`
    - [Mattermost](/it/channels/mattermost) - `channels.mattermost`
    - [Microsoft Teams](/it/channels/msteams) - `channels.msteams`
    - [Signal](/it/channels/signal) - `channels.signal`
    - [Slack](/it/channels/slack) - `channels.slack`
    - [Telegram](/it/channels/telegram) - `channels.telegram`
    - [WhatsApp](/it/channels/whatsapp) - `channels.whatsapp`

    Tutti i canali condividono lo stesso modello di criteri per i messaggi diretti:

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
    Impostare il modello principale e i fallback facoltativi:

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

    - `agents.defaults.models` definisce il catalogo dei modelli e funge da elenco consentito per `/model`; le voci `provider/*` filtrano `/model`, `/models` e i selettori dei modelli limitandoli ai provider selezionati, pur continuando a utilizzare il rilevamento dinamico dei modelli.
    - Utilizzare `openclaw config set agents.defaults.models '<json>' --strict-json --merge` per aggiungere voci all'elenco consentito senza rimuovere i modelli esistenti. Le sostituzioni semplici che rimuoverebbero delle voci vengono rifiutate, a meno che non venga passato `--replace`.
    - I riferimenti ai modelli utilizzano il formato `provider/model` (ad esempio `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` controlla il ridimensionamento verso il basso delle immagini di trascrizioni e strumenti (valore predefinito `1200`); valori inferiori riducono generalmente l'utilizzo di token visivi nelle esecuzioni con molte schermate.
    - Consultare [CLI dei modelli](/it/concepts/models) per cambiare modello nella chat e [Failover dei modelli](/it/concepts/model-failover) per la rotazione dell'autenticazione e il comportamento di fallback.
    - Per provider personalizzati o self-hosted, consultare [Provider personalizzati](/it/gateway/config-tools#custom-providers-and-base-urls) nel riferimento.

  </Accordion>

  <Accordion title="Controllare chi può inviare messaggi al bot">
    L'accesso ai messaggi diretti è controllato per ciascun canale tramite `dmPolicy` (valore predefinito `"pairing"`):

    - `"pairing"`: i mittenti sconosciuti ricevono un codice di associazione monouso da approvare
    - `"allowlist"`: sono ammessi solo i mittenti presenti in `allowFrom` (o nell'archivio degli elementi consentiti associati)
    - `"open"`: consente tutti i messaggi diretti in entrata (richiede `allowFrom: ["*"]`)
    - `"disabled"`: ignora tutti i messaggi diretti

    Per i gruppi, utilizzare `groupPolicy` (`"allowlist" | "open" | "disabled"`) insieme a `groupAllowFrom` o agli elenchi consentiti specifici del canale.

    Consultare il [riferimento completo](/it/gateway/config-channels#dm-and-group-access) per i dettagli relativi a ciascun canale.

  </Accordion>

  <Accordion title="Configurare l'attivazione tramite menzione nelle chat di gruppo">
    Per impostazione predefinita, i messaggi di gruppo **richiedono una menzione**. Configurare i modelli di attivazione per ciascun agente. Le normali risposte di gruppo o del canale vengono pubblicate automaticamente; attivare il percorso dello strumento per messaggi nelle stanze condivise in cui l'agente deve decidere quando intervenire:

    ```json5
    {
      messages: {
        visibleReplies: "automatic", // impostare "message_tool" per richiedere ovunque l'invio tramite lo strumento per messaggi
        groupChat: {
          visibleReplies: "message_tool", // consenso esplicito; l'output visibile richiede message(action=send)
          unmentionedInbound: "room_event", // le conversazioni di gruppo sempre attive senza menzioni costituiscono un contesto silenzioso
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

    - **Menzioni nei metadati**: @-menzioni native (toccare per menzionare in WhatsApp, @bot in Telegram e così via)
    - **Modelli di testo**: modelli regex sicuri in `mentionPatterns`
    - **Risposte visibili**: `messages.visibleReplies` può richiedere globalmente l'invio tramite lo strumento per messaggi; `messages.groupChat.visibleReplies` sostituisce questa impostazione per gruppi e canali.
    - Consultare il [riferimento completo](/it/gateway/config-channels#group-chat-mention-gating) per le modalità di risposta visibile, le sostituzioni specifiche per canale e la modalità di chat con sé stessi.

  </Accordion>

  <Accordion title="Limitare le Skills per agente">
    Utilizzare `agents.defaults.skills` come base condivisa, quindi sostituirla per agenti
    specifici con `agents.list[].skills`:

    ```json5
    {
      agents: {
        defaults: {
          skills: ["github", "weather"],
        },
        list: [
          { id: "writer" }, // eredita github, weather
          { id: "docs", skills: ["docs-search"] }, // sostituisce le impostazioni predefinite
          { id: "locked-down", skills: [] }, // nessuna skill
        ],
      },
    }
    ```

    - Omettere `agents.defaults.skills` per consentire tutte le Skills per impostazione predefinita.
    - Omettere `agents.list[].skills` per ereditare le impostazioni predefinite.
    - Impostare `agents.list[].skills: []` per non consentire alcuna skill.
    - Consultare [Skills](/it/tools/skills), [Configurazione delle Skills](/it/tools/skills-config) e
      il [Riferimento della configurazione](/it/gateway/config-agents#agents-defaults-skills).

  </Accordion>

  <Accordion title="Regolare il monitoraggio dello stato dei canali del Gateway">
    Controllare con quale aggressività il Gateway riavvia i canali che sembrano inattivi:

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

    - I valori mostrati sono quelli predefiniti. Impostare `gateway.channelHealthCheckMinutes: 0` per disabilitare globalmente i riavvii del monitoraggio dello stato.
    - `channelStaleEventThresholdMinutes` deve essere maggiore o uguale all'intervallo di controllo.
    - Utilizzare `channels.<provider>.healthMonitor.enabled` o `channels.<provider>.accounts.<id>.healthMonitor.enabled` per disabilitare i riavvii automatici di un singolo canale o account senza disabilitare il monitoraggio globale.
    - Consultare [Controlli dello stato](/it/gateway/health) per il debug operativo e il [riferimento completo](/it/gateway/configuration-reference#gateway) per tutti i campi.

  </Accordion>

  <Accordion title="Regolare il timeout dell'handshake WebSocket del Gateway">
    Concedere ai client locali più tempo per completare l'handshake WebSocket precedente all'autenticazione su
    host sovraccarichi o a bassa potenza:

    ```json5
    {
      gateway: {
        handshakeTimeoutMs: 30000,
      },
    }
    ```

    - Il valore predefinito è `15000` millisecondi.
    - `OPENCLAW_HANDSHAKE_TIMEOUT_MS` continua ad avere la precedenza per le sostituzioni una tantum del servizio o della shell.
    - È preferibile correggere prima gli stalli di avvio o del ciclo degli eventi; questa impostazione è destinata agli host integri ma lenti durante il riscaldamento.

  </Accordion>

  <Accordion title="Configurare sessioni e reimpostazioni">
    Le sessioni controllano la continuità e l'isolamento delle conversazioni:

    ```json5
    {
      session: {
        dmScope: "per-channel-peer",  // consigliato per più utenti
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
    - `threadBindings`: valori predefiniti globali per l'instradamento delle sessioni associate ai thread. `/focus`, `/unfocus`, `/agents`, `/session idle` e `/session max-age` consentono di associare, dissociare, elencare e regolare questa impostazione per ogni sessione (Discord associa i thread, Telegram associa gli argomenti/le conversazioni).
    - Consultare [Gestione delle sessioni](/it/concepts/session) per ambiti, collegamenti delle identità e criteri di invio.
    - Consultare il [riferimento completo](/it/gateway/config-agents#session) per tutti i campi.

  </Accordion>

  <Accordion title="Abilitare il sandboxing">
    Eseguire le sessioni degli agenti in runtime sandbox isolati:

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

    Creare prima l'immagine: da un checkout del codice sorgente eseguire `scripts/sandbox-setup.sh`; per un'installazione npm, consultare il comando `docker build` incorporato in [Sandboxing § Immagini e configurazione](/it/gateway/sandboxing#images-and-setup).

    Consultare [Sandboxing](/it/gateway/sandboxing) per la guida completa e il [riferimento completo](/it/gateway/config-agents#agentsdefaultssandbox) per tutte le opzioni.

  </Accordion>

  <Accordion title="Abilitare le notifiche push supportate dal relay per le build iOS ufficiali">
    Le notifiche push supportate dal relay per le build pubbliche dell'App Store utilizzano il relay OpenClaw ospitato: `https://ios-push-relay.openclaw.ai`.

    Le distribuzioni di relay personalizzate richiedono un percorso di build/distribuzione iOS deliberatamente separato, il cui URL del relay corrisponda all'URL del relay del gateway. Se si utilizza una build con relay personalizzato, impostare quanto segue nella configurazione del gateway:

    ```json5
    {
      gateway: {
        push: {
          apns: {
            relay: {
              baseUrl: "https://relay.example.com",
              // Facoltativo. Valore predefinito: 10000
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

    Effetti:

    - Consente al gateway di inviare `push.test`, solleciti di riattivazione e riattivazioni per la riconnessione tramite il relay esterno.
    - Utilizza un'autorizzazione di invio limitata alla registrazione, inoltrata dall'app iOS associata. Il gateway non necessita di un token del relay valido per l'intera distribuzione.
    - Associa ogni registrazione supportata dal relay all'identità del gateway a cui è stata associata l'app iOS, impedendo a un altro gateway di riutilizzare la registrazione memorizzata.
    - Mantiene le build iOS locali/manuali su APNs diretto. Gli invii supportati dal relay si applicano solo alle build distribuite ufficialmente che si sono registrate tramite il relay.
    - Deve corrispondere all'URL di base del relay incorporato nella build iOS, affinché il traffico di registrazione e invio raggiunga la stessa distribuzione del relay.

    Flusso end-to-end:

    1. Installare l'app iOS ufficiale.
    2. Facoltativo: configurare `gateway.push.apns.relay.baseUrl` sul gateway solo quando si utilizza una build con relay personalizzato deliberatamente separata.
    3. Associare l'app iOS al gateway e consentire la connessione sia delle sessioni del Node sia di quelle dell'operatore.
    4. L'app iOS recupera l'identità del gateway, si registra presso il relay utilizzando App Attest insieme alla ricevuta dell'app, quindi pubblica il payload `push.apns.register` supportato dal relay sul gateway associato.
    5. Il gateway memorizza l'handle del relay e l'autorizzazione di invio, quindi li utilizza per `push.test`, i solleciti di riattivazione e le riattivazioni per la riconnessione.

    Note operative:

    - Se si collega l'app iOS a un gateway diverso, riconnettere l'app affinché possa pubblicare una nuova registrazione del relay associata a tale gateway.
    - Se si distribuisce una nuova build iOS che punta a una distribuzione del relay diversa, l'app aggiorna la registrazione del relay memorizzata nella cache anziché riutilizzare la precedente origine del relay.

    Nota sulla compatibilità:

    - `OPENCLAW_APNS_RELAY_BASE_URL` e `OPENCLAW_APNS_RELAY_TIMEOUT_MS` continuano a funzionare come sostituzioni temporanee tramite variabili di ambiente.
    - Gli URL del relay personalizzati del gateway devono corrispondere all'URL di base del relay incorporato nella build iOS; il canale di rilascio pubblico dell'App Store rifiuta le sostituzioni personalizzate dell'URL del relay iOS.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` rimane un meccanismo di emergenza di sviluppo limitato al loopback; non salvare in modo permanente URL HTTP del relay nella configurazione.

    Consultare [App iOS](/it/platforms/ios#relay-backed-push-for-official-builds) per il flusso end-to-end e [Flusso di autenticazione e attendibilità](/it/platforms/ios#authentication-and-trust-flow) per il modello di sicurezza del relay.

  </Accordion>

  <Accordion title="Configurare Heartbeat (controlli periodici)">
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

    - `every`: stringa di durata (`30m`, `2h`). Impostare `0m` per disabilitare. Valore predefinito: `30m`.
    - `target`: `last` | `none` | `<channel-id>` (ad esempio `discord`, `matrix`, `telegram` o `whatsapp`)
    - `directPolicy`: `allow` (valore predefinito) o `block` per destinazioni Heartbeat di tipo DM
    - Consultare [Heartbeat](/it/gateway/heartbeat) per la guida completa.

  </Accordion>

  <Accordion title="Configurare i processi Cron">
    ```json5
    {
      cron: {
        enabled: true,
        maxConcurrentRuns: 8, // valore predefinito; distribuzione Cron + esecuzione isolata dei turni dell'agente Cron
        sessionRetention: "24h",
      },
    }
    ```

    - `sessionRetention`: elimina dalle righe delle sessioni SQLite le sessioni di esecuzione isolate completate (valore predefinito `24h`; impostare `false` per disabilitare).
    - La cronologia delle esecuzioni conserva automaticamente le 2000 righe terminali più recenti per ogni processo; le righe perse mantengono la propria finestra di pulizia di 24 ore.
    - Consultare [Processi Cron](/it/automation/cron-jobs) per una panoramica della funzionalità ed esempi CLI.

  </Accordion>

  <Accordion title="Configurare i Webhook (hook)">
    Abilitare gli endpoint Webhook HTTP sul Gateway:

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
    - Considerare tutto il contenuto dei payload di hook/Webhook come input non attendibile.
    - Utilizzare un `hooks.token` dedicato; non riutilizzare segreti di autenticazione del Gateway attivi (`gateway.auth.token` / `OPENCLAW_GATEWAY_TOKEN` oppure `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD`).
    - L'autenticazione degli hook avviene esclusivamente tramite intestazione (`Authorization: Bearer ...` o `x-openclaw-token`); i token nella stringa di query vengono rifiutati.
    - `hooks.path` non può essere `/`; mantenere l'ingresso Webhook in un sottopercorso dedicato, ad esempio `/hooks`.
    - Mantenere disabilitati i flag che ignorano i controlli sui contenuti non sicuri (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`), salvo durante attività di debug strettamente circoscritte.
    - Se si abilita `hooks.allowRequestSessionKey`, impostare anche `hooks.allowedSessionKeyPrefixes` per limitare le chiavi di sessione selezionate dal chiamante.
    - Per gli agenti attivati dagli hook, preferire livelli di modelli moderni e robusti e criteri rigorosi per gli strumenti (ad esempio, solo messaggistica più sandboxing ove possibile).

    Consultare il [riferimento completo](/it/gateway/configuration-reference#hooks) per tutte le opzioni di mappatura e l'integrazione con Gmail.

  </Accordion>

  <Accordion title="Configurare l'instradamento multi-agente">
    Eseguire più agenti isolati con spazi di lavoro e sessioni separati:

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

    Consultare [Multi-agente](/it/concepts/multi-agent) e il [riferimento completo](/it/gateway/config-agents#multi-agent-routing) per le regole di associazione e i profili di accesso specifici per ogni agente.

  </Accordion>

  <Accordion title="Suddividere la configurazione in più file ($include)">
    Utilizzare `$include` per organizzare configurazioni di grandi dimensioni:

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
    - **Array di file**: unione profonda in ordine (prevale l'ultimo), fino a 10 livelli di nidificazione
    - **Chiavi allo stesso livello**: unite dopo le inclusioni (sovrascrivono i valori inclusi)
    - **Percorsi relativi**: risolti rispetto al file che esegue l'inclusione
    - **Formato del percorso**: i percorsi di inclusione non devono contenere byte nulli e devono essere rigorosamente più corti di 4096 caratteri sia prima sia dopo la risoluzione
    - **Scritture gestite da OpenClaw**: quando una scrittura modifica una sola sezione di primo livello
      basata sull'inclusione di un singolo file, come `plugins: { $include: "./plugins.json5" }`,
      OpenClaw aggiorna tale file incluso e lascia invariato `openclaw.json`
    - **Scrittura passante non supportata**: le inclusioni radice, gli array di inclusioni e le inclusioni
      con sostituzioni allo stesso livello impediscono in modo sicuro le scritture gestite da OpenClaw, anziché
      appiattire la configurazione
    - **Confinamento**: i percorsi `$include` devono risolversi all'interno della directory contenente
      `openclaw.json`. Per condividere un albero tra macchine o utenti, impostare
      `OPENCLAW_INCLUDE_ROOTS` su un elenco di percorsi (`:` su POSIX, `;` su Windows) delle
      directory aggiuntive a cui le inclusioni possono fare riferimento. I collegamenti simbolici vengono risolti
      e ricontrollati, pertanto un percorso che lessicalmente si trova in una directory di configurazione, ma la cui
      destinazione reale esce da tutte le radici consentite, viene comunque rifiutato.
    - **Gestione degli errori**: errori chiari per file mancanti, errori di analisi, inclusioni circolari, formato del percorso non valido e lunghezza eccessiva

  </Accordion>
</AccordionGroup>

## Ricaricamento a caldo della configurazione

Il Gateway monitora `~/.openclaw/openclaw.json` e applica automaticamente le modifiche: per la maggior parte delle impostazioni non è necessario alcun riavvio manuale.

Le modifiche dirette ai file vengono considerate non attendibili finché non superano la convalida. Il monitor attende
che si stabilizzino le operazioni di scrittura temporanea/ridenominazione dell'editor, legge il file finale e rifiuta
le modifiche esterne non valide senza riscrivere `openclaw.json`. Le scritture della configurazione gestite da OpenClaw
utilizzano lo stesso controllo dello schema prima della scrittura (consultare [Convalida rigorosa](#strict-validation)
per le regole di sovrascrittura/rollback applicabili a ogni scrittura).

Se viene visualizzato `config reload skipped (invalid config)` o l'avvio segnala `Invalid
config`, esaminare la configurazione, eseguire `openclaw config validate`, quindi eseguire `openclaw
doctor --fix` per la riparazione. Consultare [Risoluzione dei problemi del Gateway](/it/gateway/troubleshooting#gateway-rejected-invalid-config)
per l'elenco di controllo.

### Modalità di ricaricamento

| Modalità                   | Comportamento                                                                                |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **`hybrid`** (predefinita) | Applica immediatamente le modifiche sicure senza riavvio. Esegue automaticamente il riavvio per quelle critiche.           |
| **`hot`**              | Applica senza riavvio solo le modifiche sicure. Registra un avviso quando è necessario un riavvio, che deve essere gestito manualmente. |
| **`restart`**          | Riavvia il Gateway a ogni modifica della configurazione, sicura o meno.                                 |
| **`off`**              | Disabilita il monitoraggio dei file. Le modifiche hanno effetto al successivo riavvio manuale.                 |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Modifiche applicate senza riavvio e modifiche che richiedono un riavvio

La maggior parte dei campi viene applicata senza riavvio e senza tempi di inattività; alcune sezioni applicate senza riavvio riavviano soltanto il relativo
sottosistema (canale, cron, heartbeat, monitoraggio dello stato) anziché l'intero Gateway. In
modalità `hybrid`, le modifiche che richiedono il riavvio del Gateway vengono gestite automaticamente.

| Categoria            | Campi                                                                  | Riavvio del Gateway necessario?      |
| ------------------- | ----------------------------------------------------------------------- | ---------------------------- |
| Canali            | `channels.*`, `web` (WhatsApp) - tutti i canali integrati e dei plugin       | No (riavvia il relativo canale)   |
| Agente e modelli      | `agent`, `agents`, `models`, `routing`                                  | No                           |
| Automazione          | `hooks`, `cron`, `agent.heartbeat`                                      | No (riavvia il relativo sottosistema) |
| Sessioni e messaggi | `session`, `messages`                                                   | No                           |
| Strumenti e contenuti multimediali       | `tools`, `skills`, `mcp`, `audio`, `talk`                               | No                           |
| Configurazione dei plugin       | `plugins.entries.*`, `plugins.allow`, `plugins.deny`, `plugins.enabled` | No (ricarica il runtime dei plugin)  |
| Interfaccia utente e varie           | `ui`, `logging`, `identity`, `bindings`                                 | No                           |
| Server Gateway      | `gateway.*` (porta, associazione, autenticazione, tailscale, TLS, HTTP, push)              | **Sì**                      |
| Infrastruttura      | `discovery`, `browser`, `plugins.load`, `plugins.installs`              | **Sì**                      |

<Note>
`gateway.reload` e `gateway.remote` costituiscono eccezioni in `gateway.*`: la loro modifica **non** attiva un riavvio. Anche i singoli plugin possono sostituire quanto indicato in questa tabella: un plugin caricato può dichiarare i propri prefissi di configurazione che attivano il riavvio (ad esempio, il plugin Canvas incluso riavvia il Gateway per `plugins.enabled`, `plugins.allow` e `plugins.deny`, non soltanto per il proprio `plugins.entries.canvas`), quindi il comportamento effettivo dipende dai plugin attivi.
</Note>

### Pianificazione del ricaricamento

Quando si modifica un file sorgente a cui si fa riferimento tramite `$include`, OpenClaw pianifica
il ricaricamento in base alla struttura definita nel sorgente, non alla vista appiattita in memoria.
Ciò mantiene prevedibili le decisioni di ricaricamento senza riavvio (applicazione senza riavvio o riavvio), anche quando
una singola sezione di primo livello si trova in un file incluso separato, come
`plugins: { $include: "./plugins.json5" }`. La pianificazione del ricaricamento si interrompe in modo sicuro se la
struttura del sorgente è ambigua.

## RPC di configurazione (aggiornamenti programmatici)

Per gli strumenti che scrivono la configurazione tramite l'API del Gateway, è preferibile questo flusso:

- `config.schema.lookup` per esaminare un sottoalbero (nodo dello schema superficiale e riepiloghi dei
  figli)
- `config.get` per recuperare lo snapshot corrente insieme a `hash`
- `config.patch` per gli aggiornamenti parziali (patch di unione JSON: gli oggetti vengono uniti, `null`
  elimina e gli array vengono sostituiti quando la sostituzione viene confermata esplicitamente con `replacePaths`, se
  comporterebbe la rimozione di elementi)
- `config.apply` solo quando si intende sostituire l'intera configurazione
- `update.run` per l'aggiornamento automatico esplicito seguito dal riavvio; includere `continuationMessage` quando la sessione successiva al riavvio deve eseguire un turno di completamento
- `update.status` per esaminare l'indicatore di riavvio dell'aggiornamento più recente e verificare la versione in esecuzione dopo un riavvio

Gli agenti devono considerare `config.schema.lookup` come primo riferimento per la documentazione e i vincoli esatti
a livello di campo. Utilizzare il [riferimento alla configurazione](/it/gateway/configuration-reference)
quando è necessaria una panoramica più ampia della configurazione, dei valori predefiniti o dei collegamenti ai riferimenti
dei sottosistemi dedicati.

<Note>
Le scritture del piano di controllo (`config.apply`, `config.patch`, `update.run`) sono
limitate a 3 richieste ogni 60 secondi per `deviceId+clientIp`. Le richieste di riavvio
vengono aggregate e applicano quindi un intervallo di attesa di 30 secondi tra i cicli di riavvio.
`update.status` è di sola lettura, ma limitato agli amministratori, poiché l'indicatore di riavvio può
includere riepiloghi dei passaggi di aggiornamento e le parti finali dell'output dei comandi.
</Note>

Esempio di patch parziale:

```bash
openclaw gateway call config.get --params '{}'  # acquisisce payload.hash
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

Sia `config.apply` sia `config.patch` accettano `raw`, `baseHash`, `sessionKey`,
`note` e `restartDelayMs`. `baseHash` è obbligatorio per entrambi i metodi quando esiste già un
file di configurazione (la prima scrittura, in assenza di una configurazione esistente, ignora il controllo).

`config.patch` accetta anche `replacePaths`, un array di percorsi di configurazione la cui sostituzione dell'array
è intenzionale. Se una patch sostituisse o eliminasse un array esistente
con un numero inferiore di elementi, il Gateway rifiuta la scrittura, a meno che il percorso esatto non sia presente
in `replacePaths`; gli array annidati nelle voci degli array utilizzano `[]`, ad esempio
`agents.list[].skills`. Ciò impedisce agli snapshot `config.get` troncati di
sovrascrivere silenziosamente gli array di instradamento o delle liste di elementi consentiti. Utilizzare `config.apply` quando si
intende sostituire l'intera configurazione.

## Variabili di ambiente

OpenClaw legge le variabili di ambiente dal processo padre e inoltre da:

- `.env` nella directory di lavoro corrente (se presente)
- `~/.openclaw/.env` (ripiego globale)

Nessuno dei due file sostituisce le variabili di ambiente esistenti. È inoltre possibile impostare variabili di ambiente inline nella configurazione:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Importazione dell'ambiente della shell (facoltativa)">
  Se l'opzione è abilitata e le chiavi previste non sono impostate, OpenClaw esegue la shell di accesso e importa soltanto le chiavi mancanti:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

Variabile di ambiente equivalente: `OPENCLAW_LOAD_SHELL_ENV=1`. Valore predefinito di `timeoutMs`: `15000`.
</Accordion>

<Accordion title="Sostituzione delle variabili di ambiente nei valori di configurazione">
  È possibile fare riferimento alle variabili di ambiente in qualsiasi valore stringa della configurazione con `${VAR_NAME}`:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

Regole:

- Vengono riconosciuti soltanto i nomi in maiuscolo: `[A-Z_][A-Z0-9_]*`
- Le variabili mancanti o vuote generano un errore durante il caricamento
- Eseguire l'escape con `$${VAR}` per ottenere un output letterale
- Funziona nei file `$include`
- Sostituzione inline: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="Riferimenti ai segreti (ambiente, file, esecuzione)">
  Per i campi che supportano gli oggetti SecretRef, è possibile utilizzare:

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

I dettagli di SecretRef (incluso `secrets.providers` per `env`/`file`/`exec`) sono disponibili in [Gestione dei segreti](/it/gateway/secrets).
I percorsi delle credenziali supportati sono elencati in [Superficie delle credenziali SecretRef](/it/reference/secretref-credential-surface).
</Accordion>

Consultare [Ambiente](/it/help/environment) per la precedenza e le origini complete.

## Riferimento completo

Per il riferimento completo campo per campo, consultare **[Riferimento alla configurazione](/it/gateway/configuration-reference)**.

---

_Correlati: [Esempi di configurazione](/it/gateway/configuration-examples) · [Riferimento alla configurazione](/it/gateway/configuration-reference) · [Doctor](/it/gateway/doctor)_

## Contenuti correlati

- [Riferimento alla configurazione](/it/gateway/configuration-reference)
- [Esempi di configurazione](/it/gateway/configuration-examples)
- [Runbook del Gateway](/it/gateway)
