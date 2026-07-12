---
read_when:
    - Vuoi verificare le impostazioni di OpenClaw rispetto a un file policy.jsonc definito manualmente
    - Vuoi che il lint di doctor rilevi le violazioni dei criteri
    - Ti serve un hash di attestazione della policy come evidenza per l'audit
summary: Riferimento della CLI per i controlli di conformità di `openclaw policy`
title: Politica
x-i18n:
    generated_at: "2026-07-12T06:54:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 280f9ed1e741786f85dfed978690eb18a03c8fbde20e0d01e31a9d215ae0a128
    source_path: cli/policy.md
    workflow: 16
---

# `openclaw policy`

`openclaw policy` è fornito dal Plugin Policy incluso. È un livello aziendale
di conformità applicato alle impostazioni OpenClaw esistenti, non un secondo sistema
di configurazione. I requisiti vengono definiti in `policy.jsonc`; OpenClaw osserva
lo spazio di lavoro attivo come evidenza; Policy segnala le difformità tramite
`doctor --lint`. Policy non impone le chiamate agli strumenti né riscrive il
comportamento di runtime al momento della richiesta e non certifica gli archivi
delle credenziali dei singoli agenti, come `auth-profiles.json`.

Policy verifica i canali configurati, i server MCP, i provider di modelli, la
postura SSRF della rete, l'accesso in ingresso e ai canali, l'esposizione del
Gateway e la postura dei comandi dei Node, l'accesso degli agenti allo spazio di
lavoro, la postura della sandbox, la postura di gestione dei dati, la postura dei
provider di segreti e dei profili di autenticazione e i metadati degli strumenti
soggetti a governance (`TOOLS.md`). Usalo quando uno spazio di lavoro necessita
di una dichiarazione durevole e verificabile, ad esempio «Telegram non deve
essere abilitato» o «gli strumenti soggetti a governance devono dichiarare i
metadati relativi al rischio e al proprietario». Se serve solo un comportamento
locale senza certificazione o rilevamento delle difformità, è sufficiente la
normale configurazione.

## Avvio rapido

```bash
openclaw plugins enable policy
```

Il Plugin rimane abilitato anche quando `policy.jsonc` è assente, così doctor
può segnalare l'artefatto mancante anziché ignorare silenziosamente i controlli.

Crea `policy.jsonc` manualmente; non viene generato dalle impostazioni correnti.
Ogni sezione di primo livello è uno spazio dei nomi delle regole: un controllo
viene eseguito solo quando contiene una regola concreta (le sezioni o le chiavi
non supportate producono l'errore `policy/policy-jsonc-invalid` anziché essere
ignorate silenziosamente). Esempio minimo che copre ogni sezione supportata:

```jsonc
{
  "channels": {
    "denyRules": [
      {
        "id": "no-telegram",
        "when": { "provider": "telegram" },
        "reason": "Telegram is not approved for this workspace.",
      },
    ],
  },
  "mcp": {
    "servers": {
      "allow": ["docs"],
      "deny": ["untrusted"],
    },
  },
  "models": {
    "providers": {
      "allow": ["openai", "anthropic"],
      "deny": ["openrouter"],
    },
  },
  "network": {
    "privateNetwork": {
      "allow": false,
    },
  },
  "ingress": {
    "session": {
      "requireDmScope": "per-channel-peer",
    },
    "channels": {
      "allowDmPolicies": ["pairing", "allowlist", "disabled"],
      "denyOpenGroups": true,
      "requireMentionInGroups": true,
    },
  },
  "gateway": {
    "exposure": {
      "allowNonLoopbackBind": false,
      "allowTailscaleFunnel": false,
    },
    "auth": {
      "requireAuth": true,
      "requireExplicitRateLimit": true,
    },
    "controlUi": {
      "allowInsecure": false,
    },
    "remote": {
      "allow": false,
    },
    "http": {
      "denyEndpoints": ["chatCompletions", "responses"],
      "requireUrlAllowlists": true,
    },
    "nodes": {
      "denyCommands": ["system.run"],
    },
  },
  "agents": {
    "workspace": {
      "allowedAccess": ["none", "ro"],
      "denyTools": ["exec", "process", "write", "edit", "apply_patch"],
    },
  },
  "dataHandling": {
    "sensitiveLogging": {
      "requireRedaction": true,
    },
    "telemetry": {
      "denyContentCapture": true,
    },
    "retention": {
      "requireSessionMaintenance": true,
    },
    "memory": {
      "denySessionTranscriptIndexing": true,
    },
  },
  "secrets": {
    "requireManagedProviders": true,
    "denySources": ["exec"],
    "allowInsecureProviders": false,
  },
  "auth": {
    "profiles": {
      "requireMetadata": ["provider", "mode"],
      "allowModes": ["api_key", "token"],
    },
  },
  "execApprovals": {
    "requireFile": true,
    "defaults": { "allowSecurity": ["deny"] },
    "agents": {
      "allowSecurity": ["deny", "allowlist"],
      "allowAutoAllowSkills": false,
      "allowlist": { "expected": ["deploy", "status"] },
    },
  },
  "tools": {
    "requireMetadata": ["risk", "sensitivity", "owner"],
    "profiles": {
      "allow": ["messaging", "minimal"],
    },
    "fs": {
      "requireWorkspaceOnly": true,
    },
    "exec": {
      "allowSecurity": ["deny", "allowlist"],
      "requireAsk": ["always"],
      "allowHosts": ["sandbox"],
    },
    "elevated": {
      "allow": false,
    },
    "denyTools": ["group:runtime", "group:fs"],
  },
}
```

Note trasversali non evidenti dalle tabelle delle regole riportate di seguito:

- Omettere `gateway.bind` quando si negano i binding diversi da local loopback
  significa accettare il valore predefinito del runtime; imposta
  `gateway.bind: "loopback"` per una conformità rigorosa.
- Per un agente di sola lettura, imposta la `mode` della sandbox su `all` o
  `non-main` nei valori predefiniti o nell'agente pertinente e
  `workspaceAccess` su `none` o `ro`. Una modalità sandbox assente o impostata
  su `off` non soddisfa una policy di sola lettura.
- `agents.workspace.denyTools` accetta `exec`, `process`, `write`, `edit`,
  `apply_patch`. I gruppi di strumenti negati nella configurazione `group:fs`
  (modifica dei file) e `group:runtime` (shell/processi) soddisfano la postura
  equivalente.
- I controlli delle approvazioni di esecuzione leggono l'artefatto attivo
  `exec-approvals.json` solo quando è presente una regola `execApprovals`; un
  artefatto assente o non valido costituisce un'evidenza non osservabile, non
  un esito positivo sintetico.
- Le evidenze relative ai segreti e ai profili di autenticazione registrano
  solo la postura del provider o dell'origine e i metadati SecretRef, mai i
  valori non elaborati. Policy non legge né certifica gli archivi delle
  credenziali dei singoli agenti, come `auth-profiles.json`.
- Le evidenze sulla gestione dei dati riguardano solo la postura a livello di
  configurazione (modalità di oscuramento, opzione di acquisizione della
  telemetria, modalità di manutenzione delle sessioni, impostazione di
  indicizzazione delle trascrizioni). Non esaminano registri, esportazioni
  della telemetria, trascrizioni o file di memoria e un risultato senza
  problemi non dimostra che non contengano dati personali o segreti.

### Riferimento delle regole di Policy

Ogni regola seguente è facoltativa; un controllo viene eseguito solo quando la
regola è presente. Lo stato osservato corrisponde alla configurazione OpenClaw
esistente o ai metadati dello spazio di lavoro.

#### Sovrapposizioni con ambito

Usa `scopes.<scopeName>` quando agenti o canali specifici richiedono una policy
più rigorosa rispetto alla baseline di primo livello. Il nome dell'ambito è
solo un'etichetta; la corrispondenza usa il selettore all'interno dell'ambito.
Le sovrapposizioni sono additive: la regola globale continua a essere eseguita
e quella con ambito può aggiungere un proprio rilievo sulla stessa evidenza.

| Selettore    | Sezioni supportate                                                             | Quando usarlo                                              |
| ------------ | ------------------------------------------------------------------------------ | ---------------------------------------------------------- |
| `agentIds`   | `tools`, `agents.workspace`, `sandbox`, `dataHandling.memory`, `execApprovals` | Uno o più agenti di runtime richiedono regole più rigorose. |
| `channelIds` | `ingress.channels`                                                             | Uno o più canali richiedono regole di ingresso più rigorose. |

Se una voce `agentIds` non è presente in `agents.list[]`, OpenClaw valuta la
regola con ambito rispetto alla postura globale o predefinita ereditata per
quell'ID agente di runtime, anziché ignorarla.

```jsonc
{
  "tools": {
    "exec": {
      "allowHosts": ["sandbox", "node"],
    },
  },
  "sandbox": {
    "requireMode": ["all", "non-main"],
  },
  "scopes": {
    "release-workspace": {
      "agentIds": ["release-agent", "review-agent"],
      "agents": {
        "workspace": {
          "allowedAccess": ["none", "ro"],
        },
      },
    },
    "release-lockdown": {
      "agentIds": ["release-agent"],
      "tools": {
        "exec": {
          "allowHosts": ["sandbox"],
          "allowSecurity": ["deny", "allowlist"],
          "requireAsk": ["always"],
        },
        "denyTools": ["exec", "process", "write", "edit", "apply_patch"],
      },
      "sandbox": {
        "requireMode": ["all"],
        "allowBackends": ["docker"],
      },
      "dataHandling": {
        "memory": {
          "denySessionTranscriptIndexing": true,
        },
      },
    },
    "shell-sandbox": {
      "agentIds": ["shell-agent"],
      "sandbox": {
        "allowBackends": ["openshell"],
        "containers": {
          "requireReadOnlyMounts": false,
        },
      },
    },
    "telegram-ingress": {
      "channelIds": ["telegram"],
      "ingress": {
        "channels": {
          "allowDmPolicies": ["pairing"],
          "denyOpenGroups": true,
          "requireMentionInGroups": true,
        },
      },
    },
  },
}
```

Lo stesso agente può comparire in più ambiti se ciascun ambito governa un campo
diverso, come nell'esempio precedente. Un campo con ambito ripetuto per lo
stesso agente deve essere altrettanto o più restrittivo; una dichiarazione
duplicata più permissiva viene rifiutata (gli elenchi di elementi consentiti
devono essere sottoinsiemi, quelli di elementi negati devono essere
sovrainsiemi e i valori booleani obbligatori sono fissi).

Le regole sulla postura dei container (`sandbox.containers.*`) vengono
verificate solo rispetto alle evidenze che il backend sandbox dell'agente
corrispondente può esporre. Se un backend non può osservare una regola che hai
abilitato per esso, Policy segnala
`policy/sandbox-container-posture-unobservable` anziché considerarla
soddisfatta; limita le regole dei container agli ambiti dei gruppi di agenti
che usano un backend in grado di esporle.

`ingress.session.requireDmScope` al primo livello rimane globale;
`session.dmScope` non è un'evidenza attribuibile a un canale, quindi non può
avere un ambito definito tramite `channelIds`.

Ogni ambito presente in `policy.jsonc` deve essere valido e applicabile.

#### Canali

| Campo della policy                     | Stato osservato                         | Quando usarlo                                                        |
| -------------------------------------- | --------------------------------------- | -------------------------------------------------------------------- |
| `channels.denyRules[].when.provider`   | Provider `channels.*` e stato abilitato | Nega i canali configurati di un provider come `telegram`.            |
| `channels.denyRules[].reason`          | Messaggio del rilievo e contesto del suggerimento di correzione | Spiega perché il provider è negato. |

#### Server MCP

| Campo della policy   | Stato osservato      | Quando usarlo                                                        |
| -------------------- | -------------------- | -------------------------------------------------------------------- |
| `mcp.servers.allow`  | ID `mcp.servers.*`   | Richiede che ogni server MCP configurato sia incluso in un elenco di elementi consentiti. |
| `mcp.servers.deny`   | ID `mcp.servers.*`   | Nega specifici ID dei server MCP configurati.                        |

#### Provider di modelli

| Campo della policy        | Stato osservato                                      | Quando usarlo                                                                                         |
| ------------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `models.providers.allow`  | ID `models.providers.*` e riferimenti ai modelli selezionati | Richiede che i provider configurati e i riferimenti ai modelli selezionati usino provider approvati. |
| `models.providers.deny`   | ID `models.providers.*` e riferimenti ai modelli selezionati | Nega i provider configurati e i riferimenti ai modelli selezionati in base all'ID del provider.       |

#### Rete

| Campo della policy                  | Stato osservato                              | Quando usarlo                                                              |
| ----------------------------------- | -------------------------------------------- | --------------------------------------------------------------------------- |
| `network.privateNetwork.allow`      | Eccezioni SSRF per la rete privata           | Imposta su `false` per richiedere che l'accesso alla rete privata rimanga disabilitato. |

#### Accesso in ingresso e ai canali

| Campo dei criteri                        | Stato osservato                                                   | Utilizzare quando                                                          |
| ---------------------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `ingress.session.requireDmScope`         | `session.dmScope`                                                 | È richiesto un ambito di isolamento dei messaggi diretti sottoposto a revisione. |
| `ingress.channels.allowDmPolicies`       | `channels.*.dmPolicy` e campi legacy dei criteri DM dei canali    | Sono consentiti solo criteri dei canali per i messaggi diretti sottoposti a revisione. |
| `ingress.channels.denyOpenGroups`        | Criteri di ingresso per canale, account e gruppo                  | È negato l'ingresso nei gruppi aperti per i canali e gli account configurati. |
| `ingress.channels.requireMentionInGroups` | Configurazione dei controlli delle menzioni per canale, account, gruppo, server e livelli annidati | Sono richiesti controlli delle menzioni quando l'ingresso nei gruppi è aperto o subordinato a una menzione. |

#### Gateway

| Campo dei criteri                       | Stato osservato                                         | Utilizzare quando                                                                    |
| --------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `gateway.exposure.allowNonLoopbackBind` | `gateway.bind`                                          | Impostare su `false` per richiedere l'associazione del Gateway al local loopback.    |
| `gateway.exposure.allowTailscaleFunnel` | Configurazione serve/funnel del Gateway tramite Tailscale | Impostare su `false` per negare l'esposizione tramite Tailscale Funnel.              |
| `gateway.auth.requireAuth`              | `gateway.auth.mode`                                     | Impostare su `true` per rifiutare l'autenticazione del Gateway disabilitata.         |
| `gateway.auth.requireExplicitRateLimit` | `gateway.auth.rateLimit`                                | Impostare su `true` per richiedere una configurazione esplicita del limite di frequenza dell'autenticazione. |
| `gateway.controlUi.allowInsecure`       | Opzioni non sicure di autenticazione, dispositivo e origine dell'interfaccia di controllo | Impostare su `false` per negare le opzioni di esposizione non sicura dell'interfaccia di controllo. |
| `gateway.remote.allow`                  | Modalità/configurazione del Gateway remoto              | Impostare su `false` per negare la modalità Gateway remoto.                          |
| `gateway.http.denyEndpoints`            | Endpoint dell'API HTTP del Gateway                      | Negare gli ID degli endpoint, ad esempio `chatCompletions` o `responses`.            |
| `gateway.http.requireUrlAllowlists`     | Input di recupero URL HTTP del Gateway                  | Impostare su `true` per richiedere elenchi di URL consentiti negli input di recupero URL. |
| `gateway.nodes.denyCommands`            | `gateway.nodes.denyCommands`                            | Richiedere che gli ID esatti dei comandi dei nodi, ad esempio `system.run`, siano negati nella configurazione di OpenClaw. |

`gateway.nodes.denyCommands` è una regola di sovrainsieme delle negazioni esatta e con distinzione tra maiuscole e minuscole.
Utilizzarla quando i criteri devono dimostrare che i comandi privilegiati dei nodi sono esplicitamente
negati dalla configurazione di OpenClaw. Una distribuzione che consente intenzionalmente un comando
privilegiato del nodo deve aggiornare `policy.jsonc` dopo la revisione, anziché affidarsi
esclusivamente a `gateway.nodes.allowCommands`.

#### Area di lavoro dell'agente

| Campo dei criteri                 | Stato osservato                                                                        | Utilizzare quando                                                                                      |
| --------------------------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `agents.workspace.allowedAccess` | `agents.defaults.sandbox.workspaceAccess` e `agents.list[].sandbox.workspaceAccess`    | Sono consentiti solo valori di accesso all'area di lavoro della sandbox, ad esempio `none` o `ro`.    |
| `agents.workspace.denyTools`     | Configurazione globale e per agente degli strumenti negati                             | È richiesto che gli strumenti di modifica (`exec`, `process`, `write`, `edit`, `apply_patch`) siano negati. |

#### Configurazione di sicurezza della sandbox

| Campo dei criteri                                    | Stato osservato                                             | Utilizzare quando                                                        |
| ---------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------ |
| `sandbox.requireMode`                                | `agents.defaults.sandbox.mode` e modalità per agente        | Sono consentite solo modalità sandbox sottoposte a revisione, ad esempio `all` o `non-main`. |
| `sandbox.allowBackends`                              | `agents.defaults.sandbox.backend` e backend per agente      | Sono consentiti solo backend sandbox sottoposti a revisione, ad esempio `docker`. |
| `sandbox.containers.denyHostNetwork`                 | Modalità di rete della sandbox/del browser basata su container | È negata la modalità di rete dell'host.                                  |
| `sandbox.containers.denyContainerNamespaceJoin`      | Modalità di rete della sandbox/del browser basata su container | È negata l'unione allo spazio dei nomi di rete di un altro container.    |
| `sandbox.containers.requireReadOnlyMounts`           | Modalità di montaggio della sandbox/del browser basata su container | È richiesto che i montaggi siano di sola lettura.                        |
| `sandbox.containers.denyContainerRuntimeSocketMounts` | Destinazioni di montaggio della sandbox/del browser basata su container | Sono negati i montaggi dei socket del runtime dei container.             |
| `sandbox.containers.denyUnconfinedProfiles`          | Configurazione dei profili di sicurezza dei container       | Sono negati i profili di sicurezza dei container senza restrizioni.     |
| `sandbox.browser.requireCdpSourceRange`              | Intervallo di origine CDP del browser della sandbox          | È richiesto che l'esposizione CDP del browser dichiari un intervallo di origine. |

I criteri considerano l'assenza di `sandbox.mode` come il valore predefinito implicito `off`; pertanto,
`sandbox.requireMode` segnala una sandbox nuova o non configurata come esterna a un
elenco di valori consentiti quale `["all"]`.

#### Gestione dei dati

| Campo dei criteri                                    | Stato osservato                                                                      | Utilizzare quando                                                               |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| `dataHandling.sensitiveLogging.requireRedaction`     | `logging.redactSensitive`                                                            | Impostare su `true` per rifiutare `logging.redactSensitive: "off"`.             |
| `dataHandling.telemetry.denyContentCapture`          | `diagnostics.otel.captureContent`                                                     | Impostare su `true` per rifiutare l'acquisizione dei contenuti di telemetria.   |
| `dataHandling.retention.requireSessionMaintenance`   | `session.maintenance.mode`                                                           | Impostare su `true` per richiedere la modalità effettiva di manutenzione della sessione `enforce`. |
| `dataHandling.memory.denySessionTranscriptIndexing`  | `memory.qmd.sessions.enabled` e `agents.*.memorySearch.experimental.sessionMemory`   | Impostare su `true` per rifiutare l'indicizzazione nella memoria delle trascrizioni delle sessioni. |

#### Segreti

| Campo dei criteri                 | Stato osservato                                              | Utilizzare quando                                                                  |
| --------------------------------- | ------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| `secrets.requireManagedProviders` | SecretRef della configurazione e dichiarazioni `secrets.providers.*` | Impostare su `true` per richiedere che i SecretRef puntino a provider dichiarati. |
| `secrets.denySources`             | Origini dei provider di segreti e origini dei SecretRef      | Negare origini quali `exec`, `file` o il nome di un'altra origine configurata.    |
| `secrets.allowInsecureProviders`  | Indicatori di configurazione non sicura dei provider di segreti | Impostare su `false` per rifiutare i provider che adottano una configurazione non sicura. |

#### Approvazioni dell'esecuzione

I controlli delle approvazioni dell'esecuzione leggono l'artefatto di runtime `exec-approvals.json`:
`~/.openclaw/exec-approvals.json` per impostazione predefinita oppure
`$OPENCLAW_STATE_DIR/exec-approvals.json` quando è impostato `OPENCLAW_STATE_DIR`.
Le regole di configurazione in `execApprovals.defaults.*` o `execApprovals.agents.*`
richiedono evidenze leggibili nell'artefatto; un artefatto mancante o non valido viene segnalato come
evidenza non osservabile, anziché essere accettato secondo il principio del massimo sforzo. Una volta leggibile, i campi
omessi ereditano i valori predefiniti del runtime: se `defaults.security` è assente, il valore è `full`, mentre
l'impostazione di sicurezza assente per un agente eredita tale valore predefinito. Le evidenze includono `defaults`,
`agents.*`, `agents.*.allowlist[].pattern`, l'eventuale `argPattern`, la configurazione effettiva
di `autoAllowSkills` e l'origine della voce, ma mai il percorso/token del socket,
`commandText`, `lastUsedCommand`, i percorsi risolti o i timestamp.

| Campo dei criteri                              | Stato osservato                                                                         | Utilizzare quando                                                                                |
| ---------------------------------------------- | --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `execApprovals.requireFile`                    | Percorso attivo di runtime di `exec-approvals.json`                                     | Impostare su `true` per richiedere che l'artefatto delle approvazioni esista e sia analizzabile. |
| `execApprovals.defaults.allowSecurity`         | `defaults.security`, con valore predefinito `full`                                      | Sono consentite solo modalità predefinite approvate per la sicurezza delle approvazioni.        |
| `execApprovals.agents.allowSecurity`           | `agents.*.security`, che eredita i valori predefiniti                                   | Sono consentite solo modalità effettive approvate per la sicurezza delle approvazioni per agente. |
| `execApprovals.agents.allowAutoAllowSkills`    | `defaults.autoAllowSkills` e `agents.*.autoAllowSkills`, che ereditano i valori predefiniti del runtime | Impostare su `false` per richiedere elenchi consentiti manuali rigorosi, senza approvazione implicita della CLI delle Skills. |
| `execApprovals.agents.allowlist.expected`      | Insieme aggregato delle voci `agents.*.allowlist[]` con pattern e `argPattern` facoltativo | È richiesto che l'elenco consentito delle approvazioni corrisponda all'insieme di pattern sottoposto a revisione. |

Esempio: richiedere l'artefatto delle approvazioni, negare impostazioni predefinite permissive e consentire
solo configurazioni delle approvazioni dell'esecuzione sottoposte a revisione per gli agenti selezionati.

```jsonc
{
  "execApprovals": {
    "requireFile": true,
    "defaults": {
      // Modalità di sicurezza: "deny", "allowlist" o "full".
      // Questa impostazione predefinita consente solo la configurazione restrittiva "deny".
      "allowSecurity": ["deny"],
    },
  },
  "scopes": {
    "restricted-shell": {
      "agentIds": ["family-agent", "groups-agent"],
      "execApprovals": {
        "agents": {
          // Gli agenti selezionati possono usare la configurazione "allowlist" revisionata, ma non "full".
          "allowSecurity": ["allowlist"],
          // false indica che le CLI delle Skills devono comparire nell'allowlist revisionata anziché
          // essere approvate implicitamente da autoAllowSkills.
          "allowAutoAllowSkills": false,
          "allowlist": {
            "expected": [
              // Voce semplice: modello esatto dell'eseguibile revisionato, senza argPattern.
              "travel-hub",
              // Voce vincolata: modello più espressione regolare degli argomenti revisionata.
              { "pattern": "calendar-cli", "argPattern": "^sync\\b" },
              "/bin/date",
            ],
          },
        },
      },
    },
  },
}
```

#### Profili di autenticazione

| Campo dei criteri               | Stato osservato                              | Da usare quando                                                                                      |
| ------------------------------- | -------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `auth.profiles.requireMetadata` | Metadati del provider e della modalità in `auth.profiles.*` | È necessario richiedere chiavi di metadati come `provider` e `mode` nei profili di autenticazione della configurazione. |
| `auth.profiles.allowModes`      | `auth.profiles.*.mode`                       | È necessario consentire solo modalità supportate dei profili di autenticazione, come `api_key`, `aws-sdk`, `oauth` o `token`. |

#### Metadati degli strumenti

| Campo dei criteri       | Stato osservato                         | Da usare quando                                                                                             |
| ----------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `tools.requireMetadata` | Dichiarazioni `TOOLS.md` soggette a criteri | È necessario richiedere agli strumenti soggetti a criteri di dichiarare chiavi di metadati come `risk`, `sensitivity` o `owner`. |

#### Configurazione degli strumenti

| Campo dei criteri                | Stato osservato                                             | Da usare quando                                                                                                       |
| -------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `tools.profiles.allow`           | `tools.profile` e `agents.list[].tools.profile`             | È necessario consentire solo ID di profili degli strumenti come `minimal`, `messaging` o `coding`.                    |
| `tools.fs.requireWorkspaceOnly`  | `tools.fs.workspaceOnly` e sostituzioni `tools.fs` per agente | Impostare su `true` per richiedere che gli strumenti del file system siano limitati all'area di lavoro.               |
| `tools.exec.allowSecurity`       | `tools.exec.security` e sicurezza di esecuzione per agente  | È necessario consentire solo modalità di sicurezza dell'esecuzione come `deny` o `allowlist`.                         |
| `tools.exec.requireAsk`          | `tools.exec.ask` e modalità di richiesta dell'esecuzione per agente | È necessario richiedere una configurazione di approvazione come `always`.                                      |
| `tools.exec.allowHosts`          | `tools.exec.host` e instradamento dell'host di esecuzione per agente | È necessario consentire solo modalità di instradamento dell'host di esecuzione come `sandbox`.                 |
| `tools.elevated.allow`           | `tools.elevated.enabled` e configurazione con privilegi elevati per agente | Impostare su `false` per richiedere che la modalità degli strumenti con privilegi elevati rimanga disabilitata. |
| `tools.alsoAllow.expected`       | `tools.alsoAllow` e `tools.alsoAllow` per agente            | È necessario richiedere voci `alsoAllow` esatte e segnalare concessioni additive degli strumenti mancanti o impreviste. |
| `tools.denyTools`                | `tools.deny` e `agents.list[].tools.deny`                   | È necessario richiedere che gli elenchi configurati di strumenti negati includano ID o gruppi di strumenti come `group:runtime` e `group:fs`. |

## Eseguire i controlli

Durante la creazione, eseguire esclusivamente i controlli dei criteri:

```bash
openclaw policy check
openclaw policy check --json
openclaw policy check --severity-min error
```

`policy check` esegue solo l'insieme dei controlli dei criteri e produce evidenze, risultati
e hash di attestazione. Gli stessi risultati vengono visualizzati anche in
`openclaw doctor --lint` quando il Plugin Policy è abilitato.

Confrontare un file dei criteri dell'operatore con una baseline creata:

```bash
openclaw policy compare --baseline official.policy.jsonc
openclaw policy compare --baseline official.policy.jsonc --policy policy.jsonc --json
```

`policy compare` verifica la sintassi del file dei criteri rispetto alla sintassi del file dei criteri; non
esamina lo stato di runtime, le evidenze, le credenziali o i segreti. Usa gli stessi
metadati delle regole che disciplinano le sovrapposizioni con ambito: le allowlist devono rimanere uguali o
più restrittive, le denylist devono rimanere uguali o più ampie, i valori booleani obbligatori devono mantenere
il proprio valore, le stringhe ordinate possono spostarsi solo verso l'estremità più restrittiva
dell'ordine configurato e gli elenchi esatti devono corrispondere. La baseline può essere un
criterio creato dall'organizzazione; il criterio verificato può aggiungere valori più restrittivi o
regole aggiuntive. Una regola di primo livello verificata può soddisfare una regola della baseline con ambito quando
è altrettanto o più restrittiva. I nomi degli ambiti non devono necessariamente coincidere tra i
file; il confronto è basato sul selettore (`agentIds`/`channelIds`) e sul campo.

Confronto senza risultati (`--json`):

```json
{
  "ok": true,
  "baselinePath": "official.policy.jsonc",
  "policyPath": "policy.jsonc",
  "rulesChecked": 3,
  "findings": []
}
```

L'output senza risultati di `policy check --json` include hash stabili che un operatore o
supervisore può registrare:

```json
{
  "ok": true,
  "attestation": {
    "policy": {
      "path": "policy.jsonc",
      "hash": "sha256:..."
    },
    "workspace": {
      "scope": "policy",
      "hash": "sha256:..."
    },
    "findingsHash": "sha256:...",
    "attestationHash": "sha256:..."
  },
  "checksRun": 5,
  "checksSkipped": 0,
  "findings": []
}
```

## Configurare i criteri

La configurazione dei criteri si trova in `plugins.entries.policy.config`.

```jsonc
{
  "plugins": {
    "entries": {
      "policy": {
        "enabled": true,
        "config": {
          "enabled": true,
          "path": "policy.jsonc",
          "workspaceRepairs": false,
          "expectedHash": "sha256:...",
          "expectedAttestationHash": "sha256:...",
        },
      },
    },
  },
}
```

| Impostazione               | Scopo                                                                      |
| -------------------------- | -------------------------------------------------------------------------- |
| `enabled`                  | Abilita i controlli dei criteri anche prima che `policy.jsonc` esista.     |
| `workspaceRepairs`         | Consente a `doctor --fix` di modificare le impostazioni dell'area di lavoro gestite dai criteri. |
| `expectedHash`             | Blocco hash facoltativo per l'artefatto dei criteri approvato.             |
| `expectedAttestationHash`  | Blocco hash facoltativo per l'ultimo controllo dei criteri accettato senza risultati. |
| `path`                     | Posizione dell'artefatto dei criteri relativa all'area di lavoro.          |

Impostare `plugins.entries.policy.config.enabled` su `false` per disabilitare i controlli dei
criteri per un'area di lavoro lasciando installato il Plugin.

## Accettare lo stato dei criteri

Esempio di output JSON:

```json
{
  "ok": true,
  "attestation": {
    "checkedAt": "2026-05-10T20:00:00.000Z",
    "policy": {
      "path": "policy.jsonc",
      "hash": "sha256:..."
    },
    "workspace": {
      "scope": "policy",
      "hash": "sha256:..."
    },
    "findingsHash": "sha256:...",
    "attestationHash": "sha256:..."
  },
  "evidence": {
    "channels": [
      {
        "id": "telegram",
        "provider": "telegram",
        "source": "oc://openclaw.config/channels/telegram",
        "enabled": false
      }
    ],
    "mcpServers": [
      {
        "id": "docs",
        "transport": "stdio",
        "source": "oc://openclaw.config/mcp/servers/docs",
        "command": "npx"
      }
    ],
    "modelProviders": [
      {
        "id": "openai",
        "source": "oc://openclaw.config/models/providers/openai"
      }
    ],
    "modelRefs": [
      {
        "ref": "openai/gpt-5.6-sol",
        "provider": "openai",
        "model": "gpt-5.6-sol",
        "source": "oc://openclaw.config/agents/defaults/model"
      }
    ],
    "network": [
      {
        "id": "browser-private-network",
        "source": "oc://openclaw.config/browser/ssrfPolicy/dangerouslyAllowPrivateNetwork",
        "value": false
      }
    ],
    "gatewayExposure": [
      {
        "id": "gateway-bind",
        "kind": "bind",
        "source": "oc://openclaw.config/gateway/bind",
        "value": "loopback",
        "nonLoopback": false,
        "explicit": true
      }
    ],
    "agentWorkspace": [
      {
        "id": "agents-defaults-workspace-access",
        "kind": "workspaceAccess",
        "source": "oc://openclaw.config/agents/defaults/sandbox/workspaceAccess",
        "scope": "defaults",
        "value": "ro",
        "sandboxMode": "all",
        "sandboxModeSource": "oc://openclaw.config/agents/defaults/sandbox/mode",
        "sandboxEnabled": true,
        "explicit": true
      },
      {
        "id": "agents-defaults-tool-exec",
        "kind": "toolDeny",
        "source": "oc://openclaw.config/tools/deny",
        "scope": "defaults",
        "tool": "exec",
        "denied": true,
        "explicit": true
      }
    ],
    "secrets": [
      {
        "id": "vault",
        "kind": "provider",
        "source": "oc://openclaw.config/secrets/providers/vault",
        "providerSource": "env"
      },
      {
        "id": "oc://openclaw.config/models/providers/openai/apiKey",
        "kind": "input",
        "source": "oc://openclaw.config/models/providers/openai/apiKey",
        "provenance": "secretRef",
        "refSource": "env",
        "refProvider": "vault"
      }
    ],
    "authProfiles": [
      {
        "id": "github",
        "source": "oc://openclaw.config/auth/profiles/github",
        "validMetadata": true,
        "provider": "github",
        "mode": "token"
      }
    ],
    "tools": [
      {
        "id": "deploy",
        "source": "oc://TOOLS.md/tools/deploy",
        "line": 12,
        "risk": "critical",
        "sensitivity": "restricted",
        "capabilities": ["IRREVERSIBLE_EXTERNAL"]
      }
    ]
  },
  "checksRun": 30,
  "checksSkipped": 0,
  "findings": []
}
```

`attestation.policy.hash` identifica l'artefatto delle regole creato. `evidence`
registra lo stato osservato di OpenClaw utilizzato dai controlli e
`workspace.hash` identifica il relativo payload di evidenze. `findingsHash` identifica
l'insieme esatto dei risultati. `checkedAt` registra il momento in cui è stato eseguito il controllo.
`attestationHash` identifica l'attestazione stabile (hash dei criteri, hash delle evidenze,
hash dei risultati e stato senza/con risultati) ed esclude deliberatamente `checkedAt`,
in modo che lo stesso stato dei criteri produca sempre lo stesso hash di attestazione. Insieme,
questi quattro valori costituiscono la tupla di audit per un controllo dei criteri.

Se un Gateway o un supervisore usa i criteri per bloccare, approvare o annotare un'azione
di runtime, deve registrare l'hash di attestazione dell'ultimo controllo
senza risultati. `checkedAt` rimane nell'output JSON per i log di audit, ma non fa parte
dell'hash stabile.

Ciclo di vita per l'accettazione dello stato dei criteri:

1. Creare o revisionare `policy.jsonc`.
2. Eseguire `openclaw policy check --json`.
3. Se non vengono rilevati risultati, registrare `attestation.policy.hash` come `expectedHash`.
4. Registrare `attestation.attestationHash` come `expectedAttestationHash`.
5. Eseguire nuovamente `openclaw doctor --lint` nella CI o nei controlli di rilascio.

Se le regole dei criteri cambiano intenzionalmente, aggiorna entrambi gli hash accettati a partire da un
controllo pulito. Se cambiano solo le impostazioni dell'area di lavoro (i criteri restano invariati),
in genere cambia solo `expectedAttestationHash`.

L'abilitazione o l'aggiornamento delle regole `agents.workspace` aggiunge le evidenze `agentWorkspace`
all'hash dell'area di lavoro e all'hash di attestazione; esamina le nuove evidenze e
aggiorna gli hash di attestazione accettati dopo l'abilitazione. L'abilitazione o l'aggiornamento
delle regole sull'assetto degli strumenti aggiunge allo stesso modo le evidenze `toolPosture`.

`openclaw policy watch` riesegue il controllo e segnala quando le evidenze correnti non
corrispondono più a `expectedAttestationHash`:

```bash
openclaw policy watch --json
```

Usa `--once` nella CI o negli script che richiedono una singola valutazione delle variazioni. Senza
`--once`, per impostazione predefinita esegue il polling ogni due secondi; usa `--interval-ms` per modificare
l'intervallo.

## Risultati

| ID controllo                                              | Risultato                                                                                          |
| --------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `policy/policy-jsonc-missing`                             | I criteri sono abilitati, ma manca `policy.jsonc`.                                                  |
| `policy/policy-jsonc-invalid`                             | I criteri non possono essere analizzati o contengono voci di regole non valide.                    |
| `policy/policy-hash-mismatch`                             | I criteri non corrispondono al valore `expectedHash` configurato.                                  |
| `policy/attestation-hash-mismatch`                        | Le evidenze correnti dei criteri non corrispondono più all'attestazione accettata.                 |
| `policy/policy-conformance-invalid`                       | Un file dei criteri di riferimento o sottoposto a controllo contiene una sintassi di confronto non valida. |
| `policy/policy-conformance-missing`                       | In un file dei criteri sottoposto a controllo manca una regola richiesta dal file dei criteri di riferimento. |
| `policy/policy-conformance-weaker`                        | Un file dei criteri sottoposto a controllo contiene un valore meno restrittivo rispetto al file dei criteri di riferimento. |
| `policy/channels-denied-provider`                         | Un canale abilitato corrisponde a una regola di esclusione dei canali.                             |
| `policy/mcp-denied-server`                                | Un server MCP configurato è vietato dai criteri.                                                    |
| `policy/mcp-unapproved-server`                            | Un server MCP configurato non è incluso nell'elenco consentito.                                   |
| `policy/models-denied-provider`                           | Un fornitore di modelli o un riferimento a un modello configurato usa un fornitore vietato.        |
| `policy/models-unapproved-provider`                       | Un fornitore di modelli o un riferimento a un modello configurato non è incluso nell'elenco consentito. |
| `policy/network-private-access-enabled`                   | È abilitata una via di fuga SSRF verso reti private, sebbene i criteri la vietino.                 |
| `policy/ingress-dm-policy-unapproved`                     | I criteri per i messaggi diretti di un canale non sono inclusi nell'elenco consentito dai criteri. |
| `policy/ingress-dm-scope-unapproved`                      | `session.dmScope` non corrisponde all'ambito di isolamento dei messaggi diretti richiesto dai criteri. |
| `policy/ingress-open-groups-denied`                       | I criteri di gruppo di un canale sono impostati su `open`, sebbene i criteri vietino l'ingresso nei gruppi aperti. |
| `policy/ingress-group-mention-required`                   | Una voce di canale o gruppo disabilita i controlli delle menzioni, sebbene i criteri li richiedano. |
| `policy/gateway-non-loopback-bind`                        | L'assetto di associazione del Gateway consente l'esposizione non loopback, sebbene i criteri la vietino. |
| `policy/gateway-auth-disabled`                            | L'autenticazione del Gateway è disabilitata, sebbene i criteri la richiedano.                      |
| `policy/gateway-rate-limit-missing`                       | L'assetto di limitazione della frequenza per l'autenticazione del Gateway non è esplicito, sebbene i criteri lo richiedano. |
| `policy/gateway-control-ui-insecure`                      | Sono abilitate le opzioni di esposizione non sicura dell'interfaccia di controllo del Gateway.     |
| `policy/gateway-tailscale-funnel`                         | L'esposizione tramite Tailscale Funnel del Gateway è abilitata, sebbene i criteri la vietino.       |
| `policy/gateway-remote-enabled`                           | La modalità remota del Gateway è attiva, sebbene i criteri la vietino.                             |
| `policy/gateway-http-endpoint-enabled`                    | Un endpoint API HTTP del Gateway è abilitato, sebbene sia vietato dai criteri.                     |
| `policy/gateway-http-url-fetch-unrestricted`              | L'input del Gateway per il recupero di URL HTTP non dispone dell'elenco consentito di URL richiesto. |
| `policy/gateway-node-command-denied`                      | Un comando Node vietato dai criteri non è vietato dalla configurazione di OpenClaw.                |
| `policy/agents-workspace-access-denied`                   | La modalità sandbox dell'agente o l'accesso all'area di lavoro non è incluso nell'elenco consentito dai criteri. |
| `policy/agents-tool-not-denied`                           | La configurazione di un agente o quella predefinita non vieta uno strumento che i criteri richiedono di vietare. |
| `policy/tools-profile-unapproved`                         | Un profilo degli strumenti globale o specifico per agente configurato non è incluso nell'elenco consentito. |
| `policy/tools-fs-workspace-only-required`                 | Gli strumenti del file system non sono configurati con un assetto dei percorsi limitato all'area di lavoro. |
| `policy/tools-exec-security-unapproved`                   | La modalità di sicurezza dell'esecuzione non è inclusa nell'elenco consentito dai criteri.         |
| `policy/tools-exec-ask-unapproved`                        | La modalità di richiesta dell'esecuzione non è inclusa nell'elenco consentito dai criteri.         |
| `policy/tools-exec-host-unapproved`                       | L'instradamento dell'host di esecuzione non è incluso nell'elenco consentito dai criteri.          |
| `policy/tools-elevated-enabled`                           | La modalità con privilegi elevati degli strumenti è abilitata, sebbene i criteri la vietino.       |
| `policy/tools-also-allow-missing`                         | In un elenco `alsoAllow` configurato manca una voce richiesta dai criteri.                         |
| `policy/tools-also-allow-unexpected`                      | Un elenco `alsoAllow` configurato include una voce non prevista dai criteri.                       |
| `policy/tools-required-deny-missing`                      | Un elenco globale o specifico per agente degli strumenti vietati non include uno strumento che deve essere vietato. |
| `policy/sandbox-mode-unapproved`                          | La modalità sandbox non è inclusa nell'elenco consentito dai criteri.                              |
| `policy/sandbox-backend-unapproved`                       | Il backend della sandbox non è incluso nell'elenco consentito dai criteri.                         |
| `policy/sandbox-container-posture-unobservable`           | Una regola sull'assetto dei container è abilitata per un backend che non può osservarlo.           |
| `policy/sandbox-container-host-network-denied`            | Una sandbox o un browser basato su container usa la modalità di rete dell'host.                    |
| `policy/sandbox-container-namespace-join-denied`          | Una sandbox o un browser basato su container si unisce allo spazio dei nomi di un altro container. |
| `policy/sandbox-container-mount-mode-required`            | Un montaggio di una sandbox o di un browser basato su container non è di sola lettura.             |
| `policy/sandbox-container-runtime-socket-mount`           | Un montaggio di una sandbox o di un browser basato su container espone il socket del runtime dei container. |
| `policy/sandbox-container-unconfined-profile`             | Il profilo della sandbox del container non è confinato, sebbene i criteri lo vietino.              |
| `policy/sandbox-browser-cdp-source-range-missing`         | Manca l'intervallo di origine CDP del browser sandbox, sebbene i criteri ne richiedano uno.         |
| `policy/data-handling-redaction-disabled`                 | L'oscuramento dei dati sensibili nei log è disabilitato, sebbene i criteri lo richiedano.          |
| `policy/data-handling-telemetry-content-capture`          | L'acquisizione dei contenuti di telemetria è abilitata, sebbene i criteri la vietino.              |
| `policy/data-handling-session-retention-not-enforced`     | La manutenzione della conservazione delle sessioni non viene applicata, sebbene i criteri la richiedano. |
| `policy/data-handling-session-transcript-memory-enabled`  | L'indicizzazione in memoria delle trascrizioni delle sessioni è abilitata, sebbene i criteri la vietino. |
| `policy/secrets-unmanaged-provider`                       | Un SecretRef di configurazione fa riferimento a un fornitore non dichiarato in `secrets.providers`. |
| `policy/secrets-denied-provider-source`                   | Un fornitore di segreti o un SecretRef di configurazione usa un'origine vietata dai criteri.       |
| `policy/secrets-insecure-provider`                        | Un fornitore di segreti abilita un assetto non sicuro, sebbene i criteri lo vietino.               |
| `policy/auth-profile-invalid-metadata`                    | In un profilo di autenticazione della configurazione mancano metadati validi relativi al fornitore o alla modalità. |
| `policy/auth-profile-unapproved-mode`                     | La modalità di un profilo di autenticazione della configurazione non è inclusa nell'elenco consentito dai criteri. |
| `policy/exec-approvals-missing`                           | I criteri richiedono `exec-approvals.json`, ma l'artefatto è mancante.                             |
| `policy/exec-approvals-invalid`                           | L'artefatto configurato delle approvazioni di esecuzione non può essere analizzato.                |
| `policy/exec-approvals-default-security-unapproved`       | Le impostazioni predefinite delle approvazioni di esecuzione usano una modalità di sicurezza non inclusa nell'elenco consentito dai criteri. |
| `policy/exec-approvals-agent-security-unapproved`         | La modalità di sicurezza effettiva delle approvazioni di esecuzione per un agente non è inclusa nell'elenco consentito. |
| `policy/exec-approvals-auto-allow-skills-enabled`         | Un agente per le approvazioni di esecuzione consente automaticamente e implicitamente le CLI delle Skills, sebbene i criteri lo vietino. |
| `policy/exec-approvals-allowlist-missing`                 | Nell'elenco consentito delle approvazioni manca un modello richiesto dai criteri.                  |
| `policy/exec-approvals-allowlist-unexpected`              | L'elenco consentito delle approvazioni include un modello non previsto dai criteri.                |
| `policy/tools-missing-risk-level`                         | In una dichiarazione di uno strumento soggetto a criteri mancano i metadati sul rischio.           |
| `policy/tools-unknown-risk-level`                         | Una dichiarazione di uno strumento soggetto a criteri usa un valore di rischio sconosciuto.        |
| `policy/tools-missing-sensitivity-token`                  | In una dichiarazione di uno strumento soggetto a criteri mancano i metadati sulla sensibilità.     |
| `policy/tools-missing-owner`                              | In una dichiarazione di uno strumento soggetto a criteri mancano i metadati sul proprietario.      |
| `policy/tools-unknown-sensitivity-token`                  | Una dichiarazione di uno strumento soggetto a criteri usa un valore di sensibilità sconosciuto.    |

Un risultato può includere sia `target` (l'elemento osservato nell'area di lavoro che non
è conforme) sia `requirement` (la regola definita che ha determinato il risultato).
Attualmente entrambi sono stringhe di indirizzo `oc://`, ma i nomi dei campi descrivono il ruolo
nei criteri anziché il formato dell'indirizzo.

Esempi di risultati:

```json
{
  "checkId": "policy/channels-denied-provider",
  "severity": "error",
  "message": "Channel 'telegram' uses denied provider 'telegram'.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/channels/telegram",
  "target": "oc://openclaw.config/channels/telegram",
  "requirement": "oc://policy.jsonc/channels/denyRules/#0",
  "fixHint": "Telegram is not approved for this workspace."
}
```

```json
{
  "checkId": "policy/tools-missing-risk-level",
  "severity": "error",
  "message": "TOOLS.md tool 'deploy' has no explicit risk classification.",
  "source": "policy",
  "path": "TOOLS.md",
  "line": 12,
  "ocPath": "oc://TOOLS.md/tools/deploy",
  "target": "oc://TOOLS.md/tools/deploy",
  "requirement": "oc://policy.jsonc/tools/requireMetadata"
}
```

```json
{
  "checkId": "policy/mcp-unapproved-server",
  "severity": "error",
  "message": "MCP server 'remote' is not in the policy allowlist.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/mcp/servers/remote",
  "target": "oc://openclaw.config/mcp/servers/remote",
  "requirement": "oc://policy.jsonc/mcp/servers/allow"
}
```

```json
{
  "checkId": "policy/models-unapproved-provider",
  "severity": "error",
  "message": "Model ref 'anthropic/claude-sonnet-4.7' uses unapproved provider 'anthropic'.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/agents/defaults/model/fallbacks/#0",
  "target": "oc://openclaw.config/agents/defaults/model/fallbacks/#0",
  "requirement": "oc://policy.jsonc/models/providers/allow"
}
```

```json
{
  "checkId": "policy/network-private-access-enabled",
  "severity": "error",
  "message": "Network setting 'browser-private-network' allows private-network access.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/browser/ssrfPolicy/dangerouslyAllowPrivateNetwork",
  "target": "oc://openclaw.config/browser/ssrfPolicy/dangerouslyAllowPrivateNetwork",
  "requirement": "oc://policy.jsonc/network/privateNetwork/allow"
}
```

```json
{
  "checkId": "policy/gateway-non-loopback-bind",
  "severity": "error",
  "message": "Gateway bind setting 'gateway-bind' permits non-loopback exposure.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/gateway/bind",
  "target": "oc://openclaw.config/gateway/bind",
  "requirement": "oc://policy.jsonc/gateway/exposure/allowNonLoopbackBind"
}
```

```json
{
  "checkId": "policy/gateway-node-command-denied",
  "severity": "error",
  "message": "Gateway node command 'system.run' is denied by policy but not denied by OpenClaw config.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/gateway/nodes/denyCommands",
  "target": "oc://openclaw.config/gateway/nodes/denyCommands",
  "requirement": "oc://policy.jsonc/gateway/nodes/denyCommands",
  "fixHint": "Add 'system.run' to gateway.nodes.denyCommands or update policy after review."
}
```

```json
{
  "checkId": "policy/agents-workspace-access-denied",
  "severity": "error",
  "message": "agents.defaults sandbox workspaceAccess 'rw' is not allowed by policy.",
  "source": "policy",
  "path": "openclaw config",
  "ocPath": "oc://openclaw.config/agents/defaults/sandbox/workspaceAccess",
  "target": "oc://openclaw.config/agents/defaults/sandbox/workspaceAccess",
  "requirement": "oc://policy.jsonc/agents/workspace/allowedAccess"
}
```

## Riparazione

`doctor --lint` e `policy check` sono di sola lettura.

`doctor --fix` modifica le impostazioni dell'area di lavoro gestite dai criteri solo quando
`workspaceRepairs` è esplicitamente abilitato; in caso contrario, i controlli indicano cosa
riparerebbero e lasciano invariate le impostazioni.

In questa versione, la riparazione può disabilitare i canali vietati da `channels.denyRules` e
applicare le riparazioni automatiche restrittive elencate di seguito. Abilita `workspaceRepairs`
solo dopo aver esaminato il file dei criteri, perché una regola valida può modificare
la configurazione dell'area di lavoro:

- impostare `tools.elevated.enabled=false` quando un criterio globale vieta gli strumenti con privilegi elevati
- aggiungere gli ID mancanti degli strumenti che devono essere vietati a `tools.deny` o
  `agents.list[].tools.deny` quando i criteri richiedono che tali strumenti siano vietati
- impostare su `false` le opzioni non sicure di `gateway.controlUi.*`
- impostare `gateway.mode=local` quando i criteri vietano la modalità Gateway remota
- impostare su `false` i percorsi segnalati `gateway.http.endpoints.*.enabled` quando i criteri
  vietano gli endpoint dell'API HTTP del Gateway
- impostare su `allowlist` i percorsi `groupPolicy` segnalati per l'ingresso dei canali quando i criteri
  vietano l'ingresso aperto nei gruppi
- impostare su `true` i percorsi `requireMention` segnalati per l'ingresso dei canali quando i criteri
  richiedono le menzioni nei gruppi
- impostare `logging.redactSensitive=tools` quando i criteri richiedono l'oscuramento
  dei dati sensibili nei log
- impostare `diagnostics.otel.captureContent=false`, oppure
  `diagnostics.otel.captureContent.enabled=false` per le impostazioni di acquisizione della telemetria
  in forma di oggetto, quando i criteri vietano l'acquisizione del contenuto della telemetria

Le riparazioni con ambito limitato degli strumenti con privilegi elevati sono solo di rilevamento. Anche le riparazioni con ambito limitato
relative alla gestione dei dati vengono ignorate quando il rilievo segnala una configurazione condivisa dei log o della telemetria,
perché la modifica dell'impostazione condivisa avrebbe effetto su elementi ulteriori rispetto
alla destinazione dei criteri con ambito limitato.

Le riparazioni con ambito limitato dei divieti obbligatori vengono ignorate quando il rilievo segnala
il valore radice ereditato `tools.deny`, perché l'aggiunta dello strumento richiesto alla configurazione radice avrebbe effetto
su elementi ulteriori rispetto alla destinazione dei criteri con ambito limitato. Le riparazioni dei divieti obbligatori locali all'agente possono aggiornare
il percorso segnalato `agents.list[].tools.deny`.

Le riparazioni con ambito limitato dell'ingresso dei canali vengono ignorate quando il rilievo segnala
`channels.defaults.*` ereditato, perché la modifica dell'impostazione predefinita condivisa del canale avrebbe effetto
su elementi ulteriori rispetto alla destinazione dei criteri con ambito limitato. I rilievi relativi all'elenco consentito per il recupero di URL HTTP del Gateway
rimangono manuali, perché la riparazione automatica non può scegliere i valori corretti
dell'elenco di URL consentiti per l'endpoint.

I rilievi relativi al binding del Gateway e ai comandi del Node continuano a richiedere una revisione. Quando
`policy/gateway-non-loopback-bind` o `policy/gateway-node-command-denied`
possono essere associati a un percorso di configurazione, `doctor --fix` segnala la modifica proposta
di `gateway.bind` o `gateway.nodes.denyCommands` come indicazione di anteprima ignorata.
Non applica la modifica e il rilievo non viene considerato
riparato finché un operatore non esamina e aggiorna la configurazione o i criteri.

```jsonc
{
  "plugins": {
    "entries": {
      "policy": {
        "config": {
          "workspaceRepairs": true,
        },
      },
    },
  },
}
```

## Codici di uscita

| Comando          | `0`                                                    | `1`                                                                 | `2`                          |
| ---------------- | ------------------------------------------------------ | ------------------------------------------------------------------- | ---------------------------- |
| `policy check`   | Nessun rilievo alla soglia specificata.                          | Uno o più rilievi hanno raggiunto la soglia.                             | Errore degli argomenti o di esecuzione. |
| `policy compare` | Il file dei criteri è almeno altrettanto restrittivo della baseline. | Il file dei criteri non è valido, è mancante o è meno restrittivo delle regole della baseline. | Errore degli argomenti o di esecuzione. |
| `policy watch`   | Nessun rilievo e l'hash accettato è aggiornato.              | Sono presenti rilievi oppure l'attestazione accettata è obsoleta.                    | Errore degli argomenti o di esecuzione. |

## Contenuti correlati

- [Modalità lint di Doctor](/it/cli/doctor#lint-mode)
- [CLI dei percorsi](/it/cli/path)
