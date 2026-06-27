---
read_when:
    - Vuoi controllare le impostazioni di OpenClaw rispetto a un policy.jsonc creato
    - Vuoi rilievi sulle regole in doctor lint
    - Hai bisogno di un hash di attestazione della policy per le prove di audit
summary: Riferimento CLI per i controlli di conformità `openclaw policy`
title: Criterio
x-i18n:
    generated_at: "2026-06-27T17:21:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5af65bb34aeed72bbb348a56195d65152dce1e8d0e7236da8d8681e56c9b32f4
    source_path: cli/policy.md
    workflow: 16
---

# `openclaw policy`

`openclaw policy` è fornito dal Plugin Policy incluso. Policy è un
livello di conformità enterprise sopra le impostazioni OpenClaw esistenti. Non aggiunge un
secondo sistema di configurazione. `policy.jsonc` definisce i requisiti
redatti, OpenClaw osserva l'area di lavoro attiva come evidenza e i controlli di integrità delle policy
segnalano le deviazioni tramite `doctor --lint`. Il segnale finale di conformità è un'esecuzione
pulita di `doctor --lint`; policy contribuisce con rilevamenti a quella superficie di lint condivisa
invece di creare un gate di integrità separato.

Policy attualmente gestisce canali configurati, server MCP, provider di modelli,
postura SSRF di rete, postura di accesso ingress/canale, postura di esposizione del Gateway, postura dell'area di lavoro dell'agente,
postura di gestione dei dati, postura del provider di segreti/profilo auth della configurazione OpenClaw e dichiarazioni
degli strumenti governati. Per esempio, l'IT o un operatore dell'area di lavoro può registrare che Telegram
non è un provider di canale approvato, limitare server MCP e riferimenti di modello alle
voci approvate, richiedere che l'accesso fetch/browser a reti private rimanga
disabilitato, richiedere che l'isolamento delle sessioni di messaggi diretti e la postura di ingress del canale
restino entro limiti revisionati, richiedere che bind/auth/esposizione HTTP del Gateway restino entro limiti revisionati,
richiedere che l'accesso all'area di lavoro dell'agente e i deny degli strumenti restino in una postura
revisionata, richiedere che i SecretRef della configurazione OpenClaw usino provider gestiti, richiedere
che i profili auth di configurazione portino metadati di provider/modalità, richiedere che gli strumenti governati
portino metadati di rischio e sensibilità, richiedere la redazione del logging sensibile, negare
l'acquisizione dei contenuti di telemetria, richiedere la manutenzione della conservazione delle sessioni, negare l'indicizzazione in memoria
delle trascrizioni di sessione, quindi usare `doctor --lint` come gate di conformità
condiviso.

Usa policy quando un'area di lavoro richiede una dichiarazione durevole come "questi canali
non devono essere abilitati" o "gli strumenti governati devono dichiarare metadati di approvazione" e un
modo ripetibile per dimostrare che OpenClaw è ancora conforme a quella dichiarazione. Usa
solo la configurazione regolare e la documentazione dell'area di lavoro quando ti serve soltanto il comportamento locale e
non ti servono rilevamenti di policy o output di attestazione.

## Avvio rapido

Abilita il Plugin Policy incluso prima del primo utilizzo:

```bash
openclaw plugins enable policy
```

Quando policy è abilitato, doctor può caricare i controlli di integrità delle policy senza attivare
Plugin arbitrari. Il Plugin resta abilitato se `policy.jsonc` manca, così
doctor può segnalare l'artefatto mancante.

Policy è redatto, non generato dalle impostazioni correnti dell'utente. Una policy minima
per canali, server MCP, provider di modelli, postura di rete, accesso ingress/canale, esposizione Gateway,
postura dell'area di lavoro dell'agente, postura del runtime sandbox configurato, postura di gestione dei dati
OpenClaw, postura del provider di segreti/profilo auth della configurazione, postura del file di approvazione exec
e metadati degli strumenti ha questo aspetto:

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

Le regole sono l'autorità. Un blocco di categoria è solo uno spazio dei nomi; i controlli vengono eseguiti
quando è presente una regola concreta. OpenClaw legge le impostazioni correnti `channels.*`,
`mcp.servers.*`, `models.providers.*`, i riferimenti di modello agente selezionati, le impostazioni SSRF
di rete, l'ambito delle sessioni di messaggi diretti, la policy DM del canale, la policy di gruppo del canale,
i gate di menzione canale/gruppo, la postura bind/auth/Control UI/Tailscale/remote/HTTP del Gateway,
la postura di accesso all'area di lavoro sandbox agente della configurazione OpenClaw e di deny degli strumenti,
la postura della configurazione di gestione dei dati, la provenienza del provider di segreti
e dei SecretRef della configurazione, i metadati dei profili auth di configurazione, la postura degli strumenti
globali/per agente configurata e le dichiarazioni `TOOLS.md` come evidenza, quindi
segnala lo stato osservato che non è conforme. Se una policy nega i bind Gateway non-loopback,
ometti `gateway.bind` solo quando sei disposto a revisionare il valore predefinito del runtime; imposta `gateway.bind=loopback` per
una conformità di configurazione rigorosa. Per la postura agente in sola lettura, configura la modalità sandbox
sui default applicabili o sull'agente e imposta `workspaceAccess` a `none` o
`ro`; una modalità sandbox omessa o `off` non soddisfa una policy in sola lettura/no-write.
`agents.workspace.denyTools` supporta `exec`, `process`, `write`,
`edit` e `apply_patch`; la configurazione OpenClaw `group:fs` copre gli strumenti di mutazione dei file
e `group:runtime` copre gli strumenti shell/processo. La policy di postura degli strumenti osserva
`tools.profile`, `tools.allow`, `tools.alsoAllow`, `tools.deny`,
`tools.fs.workspaceOnly`, `tools.exec.security`, `tools.exec.ask`,
`tools.exec.host`, `tools.elevated.enabled` e gli stessi override per agente
`agents.list[].tools.*`. La policy di approvazione exec legge l'artefatto di prodotto denominato
`exec-approvals.json` solo quando è presente una regola `execApprovals`;
l'evidenza registra default, postura per agente e pattern allowlist
senza token socket o testo dell'ultimo comando usato. Policy non applica le chiamate agli strumenti
a runtime. L'evidenza dei segreti registra
la postura provider/source e i metadati SecretRef, mai i valori grezzi dei segreti. Policy
non legge né attesta archivi di credenziali per agente come `auth-profiles.json`;
questi archivi restano di proprietà dei flussi auth e credenziali esistenti.
L'evidenza di gestione dei dati è solo postura a livello di configurazione: controlla
la modalità di redazione configurata, i toggle di acquisizione contenuti di telemetria, la modalità di manutenzione delle sessioni e
le impostazioni di indicizzazione in memoria delle trascrizioni di sessione. Non ispeziona log grezzi,
export di telemetria, contenuti di trascrizioni, file di memoria, né dimostra che non esistano dati personali
o segreti.

### Riferimento alle regole di policy

Ogni campo di policy qui sotto è facoltativo. Un controllo viene eseguito solo quando la regola corrispondente è
presente in `policy.jsonc`. Lo stato osservato è la configurazione OpenClaw esistente o
i metadati dell'area di lavoro; policy segnala le deviazioni ma non riscrive il comportamento del runtime
a meno che un percorso di riparazione sia esplicitamente disponibile e abilitato.
I file di policy sono rigorosi: sezioni o chiavi di regola non supportate vengono segnalate come
`policy/policy-jsonc-invalid` invece di essere ignorate.

Gli overlay di policy mantengono globali le regole ampie di primo livello, poi consentono ai blocchi di ambito denominati
di aggiungere sezioni di policy normali più rigorose per selettori espliciti. Il nome di un ambito è solo un
contenitore descrittivo; la corrispondenza usa i valori dei selettori dentro l'ambito.
L'overlay è additivo: le dichiarazioni globali vengono comunque eseguite e una dichiarazione con ambito può emettere
il proprio rilevamento sulla stessa configurazione osservata.

#### Overlay con ambito

Usa `scopes.<scopeName>` quando un insieme di agenti o canali richiede una
policy più rigorosa rispetto alla baseline di primo livello. Le sezioni con ambito agente usano `agentIds`, che
supporta `tools.*`, `agents.workspace.*`, `sandbox.*`, `dataHandling.memory.*`
e `execApprovals.*`. L'ingress con ambito canale
usa `channelIds`, che supporta `ingress.channels.*`. Le sezioni non supportate
vengono rifiutate invece di essere ignorate. Se una voce `agentIds` non è
presente in `agents.list[]`, OpenClaw valuta la regola con ambito rispetto alla postura globale/default
ereditata per quell'id agente runtime.

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

Lo stesso agente può apparire in più ambiti quando ogni ambito governa campi
diversi, come mostrato sopra. Un campo con ambito ripetuto per lo stesso agente deve essere
ugualmente o più restrittivo secondo i metadati di policy; le dichiarazioni duplicate più deboli
vengono rifiutate. I metadati di rigore trattano le allow-list come sottoinsiemi,
le deny-list come sovrainsiemi e i booleani richiesti come requisiti fissi.

La policy di postura dei container viene valutata solo rispetto all'evidenza che OpenClaw può
osservare per l'agente corrispondente. Se una regola `sandbox.containers.*` abilitata si applica
a un agente il cui backend sandbox non può esporre quel campo, policy segnala
`policy/sandbox-container-posture-unobservable` invece di trattare la dichiarazione come
superata. Usa ambiti `agentIds` separati per gruppi di agenti che usano backend sandbox
diversi e lascia le regole container non supportate non impostate o false per i
gruppi in cui quei campi non possono essere osservati.

`ingress.session.requireDmScope` di primo livello resta globale perché
`session.dmScope` non è evidenza attribuibile a un canale.

| Selettore    | Sezioni supportate                                                               | Usalo quando                                                  |
| ------------ | -------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `agentIds`   | `tools`, `agents.workspace`, `sandbox`, `dataHandling.memory` e `execApprovals` | Uno o più agenti runtime richiedono regole più restrittive.   |
| `channelIds` | `ingress.channels`                                                              | Uno o più canali richiedono regole di ingress più restrittive. |

Ogni ambito presente in `policy.jsonc` deve essere valido e applicabile.

#### Canali

| Campo policy                         | Stato osservato                            | Usalo quando                                                   |
| ------------------------------------ | ------------------------------------------ | -------------------------------------------------------------- |
| `channels.denyRules[].when.provider` | Provider `channels.*` e stato di abilitazione | Nega i canali configurati da un provider come `telegram`.      |
| `channels.denyRules[].reason`        | Messaggio del finding e contesto del suggerimento di riparazione | Spiega perché il provider è negato.                            |

#### Server MCP

| Campo policy        | Stato osservato    | Usalo quando                                                  |
| ------------------- | ------------------ | ------------------------------------------------------------- |
| `mcp.servers.allow` | ID `mcp.servers.*` | Richiedi che ogni server MCP configurato sia in un'allowlist. |
| `mcp.servers.deny`  | ID `mcp.servers.*` | Nega ID specifici di server MCP configurati.                  |

#### Provider di modelli

| Campo policy             | Stato osservato                                      | Usalo quando                                                                                 |
| ------------------------ | ---------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `models.providers.allow` | ID `models.providers.*` e riferimenti modello selezionati | Richiedi che i provider configurati e i riferimenti modello selezionati usino provider approvati. |
| `models.providers.deny`  | ID `models.providers.*` e riferimenti modello selezionati | Nega i provider configurati e i riferimenti modello selezionati in base all'ID provider.      |

#### Rete

| Campo policy                   | Stato osservato                         | Usalo quando                                                        |
| ------------------------------ | --------------------------------------- | ------------------------------------------------------------------- |
| `network.privateNetwork.allow` | Vie di fuga SSRF della rete privata     | Imposta su `false` per richiedere che l'accesso alla rete privata resti disabilitato. |

#### Ingress e accesso ai canali

| Campo policy                              | Stato osservato                                                   | Usalo quando                                                                       |
| ----------------------------------------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `ingress.session.requireDmScope`          | `session.dmScope`                                                 | Richiedi un ambito di isolamento dei messaggi diretti revisionato.                 |
| `ingress.channels.allowDmPolicies`        | `channels.*.dmPolicy` e campi legacy della policy DM del canale   | Consenti solo policy di canale per messaggi diretti revisionate.                   |
| `ingress.channels.denyOpenGroups`         | Policy di ingress per canale, account e gruppo                    | Nega l'ingress di gruppi aperti per canali e account configurati.                  |
| `ingress.channels.requireMentionInGroups` | Configurazione del gate di menzione per canale, account, gruppo, guild e annidamenti | Richiedi gate di menzione quando l'ingress di gruppo è aperto o vincolato a menzione. |

#### Gateway

| Campo policy                            | Stato osservato                                  | Usalo quando                                                       |
| --------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------ |
| `gateway.exposure.allowNonLoopbackBind` | `gateway.bind`                                  | Imposta su `false` per richiedere il binding loopback del Gateway. |
| `gateway.exposure.allowTailscaleFunnel` | Postura Tailscale serve/funnel del Gateway      | Imposta su `false` per negare l'esposizione Tailscale Funnel.      |
| `gateway.auth.requireAuth`              | `gateway.auth.mode`                             | Imposta su `true` per rifiutare l'autenticazione Gateway disabilitata. |
| `gateway.auth.requireExplicitRateLimit` | `gateway.auth.rateLimit`                        | Imposta su `true` per richiedere una configurazione esplicita del rate limit di autenticazione. |
| `gateway.controlUi.allowInsecure`       | Toggle non sicuri di autenticazione/dispositivo/origine della UI di controllo | Imposta su `false` per negare i toggle di esposizione non sicuri della UI di controllo. |
| `gateway.remote.allow`                  | Modalità/configurazione Gateway remoto          | Imposta su `false` per negare la modalità Gateway remoto.          |
| `gateway.http.denyEndpoints`            | Endpoint API HTTP del Gateway                   | Nega ID di endpoint come `chatCompletions` o `responses`.          |
| `gateway.http.requireUrlAllowlists`     | Input di fetch URL HTTP del Gateway             | Imposta su `true` per richiedere allowlist URL sugli input di fetch URL. |

#### Workspace agente

| Campo policy                     | Stato osservato                                                                        | Usalo quando                                                                                                            |
| -------------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `agents.workspace.allowedAccess` | `agents.defaults.sandbox.workspaceAccess` e `agents.list[].sandbox.workspaceAccess`   | Consenti solo valori di accesso al workspace sandbox come `none` o `ro`.                                                |
| `agents.workspace.denyTools`     | Configurazione globale e per agente di negazione strumenti                            | Richiedi che strumenti di mutazione workspace/runtime come `exec`, `process`, `write`, `edit` o `apply_patch` siano negati. |

#### Postura sandbox

| Campo policy                                          | Stato osservato                                          | Usalo quando                                                       |
| ----------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------ |
| `sandbox.requireMode`                                 | `agents.defaults.sandbox.mode` e modalità per agente    | Consenti solo modalità sandbox revisionate come `all` o `non-main`. |
| `sandbox.allowBackends`                               | `agents.defaults.sandbox.backend` e backend per agente  | Consenti solo backend sandbox revisionati come `docker`.           |
| `sandbox.containers.denyHostNetwork`                  | Modalità rete del sandbox/browser basato su container   | Nega la modalità rete host.                                        |
| `sandbox.containers.denyContainerNamespaceJoin`       | Modalità rete del sandbox/browser basato su container   | Nega l'adesione allo spazio dei nomi di rete di un altro container. |
| `sandbox.containers.requireReadOnlyMounts`            | Modalità mount del sandbox/browser basato su container  | Richiedi che i mount siano di sola lettura.                        |
| `sandbox.containers.denyContainerRuntimeSocketMounts` | Target di mount del sandbox/browser basato su container | Nega i mount dei socket runtime dei container.                     |
| `sandbox.containers.denyUnconfinedProfiles`           | Postura del profilo di sicurezza del container          | Nega profili di sicurezza container non confinati.                 |
| `sandbox.browser.requireCdpSourceRange`               | Intervallo sorgente CDP del browser sandbox             | Richiedi che l'esposizione CDP del browser dichiari un intervallo sorgente. |

La policy tratta `sandbox.mode` mancante come default implicito `off`, quindi
`sandbox.requireMode` segnala un sandbox nuovo o non configurato come fuori da
un'allowlist come `["all"]`.

#### Gestione dei dati

| Campo policy                                        | Stato osservato                                                                       | Usalo quando                                                               |
| --------------------------------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| `dataHandling.sensitiveLogging.requireRedaction`    | `logging.redactSensitive`                                                            | Imposta su `true` per rifiutare `logging.redactSensitive: "off"`.          |
| `dataHandling.telemetry.denyContentCapture`         | `diagnostics.otel.captureContent`                                                    | Imposta su `true` per rifiutare l'acquisizione dei contenuti di telemetria. |
| `dataHandling.retention.requireSessionMaintenance`  | `session.maintenance.mode`                                                           | Imposta su `true` per richiedere la modalità effettiva di manutenzione sessione `enforce`. |
| `dataHandling.memory.denySessionTranscriptIndexing` | `memory.qmd.sessions.enabled` e `agents.*.memorySearch.experimental.sessionMemory`   | Imposta su `true` per rifiutare l'indicizzazione delle trascrizioni di sessione in memoria. |

#### Segreti

| Campo policy                      | Stato osservato                                           | Usalo quando                                                               |
| --------------------------------- | -------------------------------------------------------- | -------------------------------------------------------------------------- |
| `secrets.requireManagedProviders` | SecretRefs di configurazione e dichiarazioni `secrets.providers.*` | Imposta su `true` per richiedere che i SecretRefs puntino a provider dichiarati. |
| `secrets.denySources`             | Origini dei provider di segreti e origini SecretRef      | Nega origini come `exec`, `file` o un altro nome di origine configurato.   |
| `secrets.allowInsecureProviders`  | Flag di postura non sicura dei provider di segreti       | Imposta su `false` per rifiutare provider che optano per una postura non sicura. |

#### Approvazioni exec

La policy delle approvazioni exec osserva l'artefatto runtime attivo
`exec-approvals.json`. Per default è `~/.openclaw/exec-approvals.json`; quando
`OPENCLAW_STATE_DIR` è impostato, Policy legge
`$OPENCLAW_STATE_DIR/exec-approvals.json`. Le regole di postura effettive come
`execApprovals.defaults.*` o `execApprovals.agents.*` richiedono evidenza leggibile
dall'artefatto; un artefatto mancante o non valido viene segnalato come evidenza
non osservabile invece di diventare un pass best-effort contro default runtime sintetici. Una volta
che l'artefatto è leggibile, i campi di approvazione omessi ereditano i default runtime:
`defaults.security` mancante è `full`, e la sicurezza agente mancante eredita quel
default. L'evidenza include `defaults`, `agents.*` e
`agents.*.allowlist[].pattern` più `argPattern` opzionale, postura effettiva
`autoAllowSkills` e origine della voce. Non include percorso/token del socket,
`commandText`, `lastUsedCommand`, percorsi risolti o timestamp.

| Campo policy                               | Stato osservato                                                                         | Da usare quando                                                                                |
| ------------------------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `execApprovals.requireFile`                 | Percorso `exec-approvals.json` del runtime attivo                                      | Impostare su `true` per richiedere che l'artefatto delle approvazioni esista e venga analizzato. |
| `execApprovals.defaults.allowSecurity`      | `defaults.security`, con valore predefinito `full`                                    | Consentire solo le modalita di sicurezza di approvazione predefinite approvate.          |
| `execApprovals.agents.allowSecurity`        | `agents.*.security`, che eredita i valori predefiniti                                 | Consentire solo le modalita di sicurezza di approvazione effettive per agente approvate. |
| `execApprovals.agents.allowAutoAllowSkills` | `defaults.autoAllowSkills` e `agents.*.autoAllowSkills`, che ereditano i valori predefiniti del runtime | Impostare su `false` per richiedere allowlist manuali rigorose senza approvazione implicita della CLI delle skill. |
| `execApprovals.agents.allowlist.expected`   | Pattern aggregato `agents.*.allowlist[]` e voci opzionali argPattern                  | Richiedere che la allowlist delle approvazioni corrisponda all'insieme di pattern revisionato. |

Ad esempio, richiedere l'artefatto delle approvazioni, negare valori predefiniti permissivi e
consentire solo la postura di approvazione exec revisionata per agenti selezionati:

```jsonc
{
  "execApprovals": {
    "requireFile": true,
    "defaults": {
      // Security modes: "deny", "allowlist", or "full".
      // This default permits only the locked-down deny posture.
      "allowSecurity": ["deny"],
    },
  },
  "scopes": {
    "restricted-shell": {
      "agentIds": ["family-agent", "groups-agent"],
      "execApprovals": {
        "agents": {
          // Selected agents may use reviewed allowlist posture, but not "full".
          "allowSecurity": ["allowlist"],
          // false means skill CLIs must appear in the reviewed allowlist instead of
          // being implicitly approved by autoAllowSkills.
          "allowAutoAllowSkills": false,
          "allowlist": {
            "expected": [
              // Simple entry: exact reviewed executable pattern with no argPattern.
              "travel-hub",
              // Constrained entry: pattern plus reviewed argument regex.
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

| Campo policy                    | Stato osservato                               | Da usare quando                                                                                   |
| ------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `auth.profiles.requireMetadata` | Metadati provider e mode di `auth.profiles.*` | Richiedere chiavi di metadati come `provider` e `mode` nei profili di autenticazione della configurazione. |
| `auth.profiles.allowModes`      | `auth.profiles.*.mode`                       | Consentire solo modalita dei profili di autenticazione supportate come `api_key`, `aws-sdk`, `oauth` o `token`. |

#### Metadati degli strumenti

| Campo policy            | Stato osservato                   | Da usare quando                                                                                   |
| ----------------------- | -------------------------------- | ------------------------------------------------------------------------------------------ |
| `tools.requireMetadata` | Dichiarazioni governate `TOOLS.md` | Richiedere agli strumenti governati di dichiarare chiavi di metadati come `risk`, `sensitivity` o `owner`. |

#### Postura degli strumenti

| Campo policy                    | Stato osservato                                              | Da usare quando                                                                                                 |
| ------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `tools.profiles.allow`          | `tools.profile` e `agents.list[].tools.profile`             | Consentire solo id di profilo strumenti come `minimal`, `messaging` o `coding`.                         |
| `tools.fs.requireWorkspaceOnly` | `tools.fs.workspaceOnly` e override `tools.fs` per agente   | Impostare su `true` per richiedere la postura dello strumento filesystem limitata al workspace.          |
| `tools.exec.allowSecurity`      | `tools.exec.security` e sicurezza exec per agente           | Consentire solo modalita di sicurezza exec come `deny` o `allowlist`.                                   |
| `tools.exec.requireAsk`         | `tools.exec.ask` e modalita ask exec per agente             | Richiedere una postura di approvazione come `always`.                                                    |
| `tools.exec.allowHosts`         | `tools.exec.host` e routing host exec per agente            | Consentire solo modalita di routing host exec come `sandbox`.                                            |
| `tools.elevated.allow`          | `tools.elevated.enabled` e postura elevata per agente       | Impostare su `false` per richiedere che la modalita strumento elevata rimanga disabilitata.              |
| `tools.alsoAllow.expected`      | `tools.alsoAllow` e `tools.alsoAllow` per agente            | Richiedere voci `alsoAllow` esatte e segnalare concessioni additive mancanti o inattese agli strumenti.  |
| `tools.denyTools`               | `tools.deny` e `agents.list[].tools.deny`                   | Richiedere che gli elenchi di negazione strumenti configurati includano id o gruppi di strumenti come `group:runtime` e `group:fs`. |

Eseguire controlli solo policy durante la creazione:

```bash
openclaw policy check
openclaw policy check --json
openclaw policy check --severity-min error
```

`policy check` esegue solo l'insieme dei controlli policy ed emette evidenze, findings e
hash di attestazione. Gli stessi findings compaiono anche in `openclaw doctor --lint`
quando il Plugin Policy e abilitato.

Confrontare un file policy operatore con un file policy baseline creato:

```bash
openclaw policy compare --baseline official.policy.jsonc
openclaw policy compare --baseline official.policy.jsonc --policy policy.jsonc --json
```

`policy compare` confronta la sintassi di un file policy con la sintassi di un file policy. Non
ispeziona lo stato del runtime OpenClaw, evidenze, credenziali o segreti. Il comando
usa gli stessi metadati delle regole policy che governano gli overlay con scope: le allowlist devono
rimanere uguali o piu ristrette, le denylist devono rimanere uguali o piu ampie, i booleani richiesti
devono mantenere il loro valore richiesto, le stringhe ordinate devono spostarsi solo verso l'estremita piu
restrittiva dell'ordine configurato e gli elenchi esatti devono corrispondere.

Il file baseline puo essere una policy creata dall'organizzazione. La policy controllata puo
usare valori piu rigorosi o aggiungere regole policy extra. Una regola controllata di livello superiore puo anche
soddisfare una regola baseline con scope quando e ugualmente o piu restrittiva, perche
la policy di livello superiore si applica in modo ampio. I nomi degli scope non devono corrispondere; il
confronto con scope e indicizzato per valore del selettore, come `agentIds` o `channelIds`, e per
il campo policy controllato.

Esempio di output JSON di confronto pulito che riporta solo lo stato del confronto dei file policy:

```json
{
  "ok": true,
  "baselinePath": "official.policy.jsonc",
  "policyPath": "policy.jsonc",
  "rulesChecked": 3,
  "findings": []
}
```

Esempio di output pulito di `policy check --json` che include hash stabili che possono essere
registrati da un operatore o supervisore:

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

## Configurare la policy

La configurazione della policy si trova sotto `plugins.entries.policy.config`.

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

| Impostazione              | Scopo                                                           |
| ------------------------- | --------------------------------------------------------------- |
| `enabled`                 | Abilitare i controlli policy anche prima che `policy.jsonc` esista. |
| `workspaceRepairs`        | Consentire a `doctor --fix` di modificare impostazioni workspace gestite dalla policy. |
| `expectedHash`            | Blocco hash opzionale per l'artefatto policy approvato.         |
| `expectedAttestationHash` | Blocco hash opzionale per l'ultimo controllo policy pulito accettato. |
| `path`                    | Posizione relativa al workspace dell'artefatto policy.          |

Impostare `plugins.entries.policy.config.enabled` su `false` per disabilitare i controlli policy
per un workspace lasciando installato il plugin.

I requisiti dei metadati degli strumenti vengono creati in `policy.jsonc` con
`tools.requireMetadata`, ad esempio `["risk", "sensitivity", "owner"]`.

## Accettare lo stato policy

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
        "ref": "openai/gpt-5.5",
        "provider": "openai",
        "model": "gpt-5.5",
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

L’hash della policy identifica l’artefatto della regola redatto. Il blocco evidence
registra lo stato OpenClaw osservato usato dai controlli della policy. Il valore
`workspace.hash` identifica quel payload di evidenza per l’ambito controllato.
L’hash dei finding identifica l’esatto insieme di finding restituito dal controllo.
`checkedAt` registra quando è stata eseguita la valutazione. L’hash di attestazione identifica
la dichiarazione stabile: hash della policy, hash dell’evidenza, hash dei finding e se il
risultato era pulito. Intenzionalmente non include `checkedAt`, quindi lo stesso
stato della policy produce la stessa attestazione in controlli ripetuti. Insieme,
questi formano la tupla di audit per questo controllo della policy.

Se un Gateway o un supervisore successivo usa la policy per bloccare, approvare o annotare
un’azione runtime, deve registrare l’hash di attestazione dell’ultimo controllo della policy
pulito. `checkedAt` rimane nell’output JSON per i log di audit, ma non fa parte
dell’hash di attestazione stabile.

Usa questo ciclo di vita quando accetti lo stato della policy:

1. Redigi o rivedi `policy.jsonc`.
2. Esegui `openclaw policy check --json`.
3. Se il risultato è pulito, registra `attestation.policy.hash` come `expectedHash`.
4. Registra `attestation.attestationHash` come `expectedAttestationHash`.
5. Riesegui `openclaw doctor --lint` in CI o nei gate di rilascio.

Se le regole della policy cambiano intenzionalmente, aggiorna entrambi gli hash accettati da un controllo
pulito. Se le impostazioni del workspace cambiano intenzionalmente ma la policy rimane la stessa,
di solito cambia solo `expectedAttestationHash`.

L’abilitazione o l’aggiornamento delle regole `agents.workspace` aggiunge evidenze `agentWorkspace`
all’hash del workspace e all’hash di attestazione. Gli operatori devono rivedere le nuove
evidenze e aggiornare gli hash di attestazione accettati dopo aver abilitato queste regole.
L’abilitazione o l’aggiornamento delle regole di postura degli strumenti aggiunge evidenze `toolPosture` nello
stesso modo.

`openclaw policy watch` esegue ripetutamente lo stesso controllo e segnala quando
l’evidenza corrente non corrisponde più a `expectedAttestationHash`:

```bash
openclaw policy watch --json
```

Usa `--once` in CI o negli script che richiedono una sola valutazione della deriva. Senza
`--once`, il comando esegue il polling ogni due secondi per impostazione predefinita; usa `--interval-ms` per
scegliere un intervallo diverso.

## Finding

La policy attualmente verifica:

| ID controllo                                             | Riscontro                                                                         |
| -------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `policy/policy-jsonc-missing`                            | La policy è abilitata ma `policy.jsonc` manca.                                    |
| `policy/policy-jsonc-invalid`                            | La policy non può essere analizzata o contiene voci di regola malformate.         |
| `policy/policy-hash-mismatch`                            | La policy non corrisponde a `expectedHash` configurato.                           |
| `policy/attestation-hash-mismatch`                       | Le prove della policy corrente non corrispondono più all’attestazione accettata.  |
| `policy/policy-conformance-invalid`                      | Un file di policy di baseline o verificato ha una sintassi di confronto non valida. |
| `policy/policy-conformance-missing`                      | A un file di policy verificato manca una regola richiesta dal file di policy di baseline. |
| `policy/policy-conformance-weaker`                       | Un file di policy verificato ha un valore più debole rispetto al file di policy di baseline. |
| `policy/channels-denied-provider`                        | Un canale abilitato corrisponde a una regola di negazione dei canali.             |
| `policy/mcp-denied-server`                               | Un server MCP configurato è negato dalla policy.                                  |
| `policy/mcp-unapproved-server`                           | Un server MCP configurato è fuori dall’allowlist.                                 |
| `policy/models-denied-provider`                          | Un provider di modelli configurato o un riferimento di modello usa un provider negato. |
| `policy/models-unapproved-provider`                      | Un provider di modelli configurato o un riferimento di modello è fuori dall’allowlist. |
| `policy/network-private-access-enabled`                  | Una via di uscita SSRF verso rete privata è abilitata quando la policy la nega.   |
| `policy/ingress-dm-policy-unapproved`                    | Una policy DM del canale è fuori dall’allowlist della policy.                     |
| `policy/ingress-dm-scope-unapproved`                     | `session.dmScope` non corrisponde all’ambito di isolamento DM richiesto dalla policy. |
| `policy/ingress-open-groups-denied`                      | Una policy di gruppo del canale è `open` mentre la policy nega l’ingresso a gruppi aperti. |
| `policy/ingress-group-mention-required`                  | Una voce di canale o gruppo disabilita i gate di menzione mentre la policy li richiede. |
| `policy/gateway-non-loopback-bind`                       | La postura di bind del Gateway consente esposizione non local loopback quando la policy la nega. |
| `policy/gateway-auth-disabled`                           | L’autenticazione del Gateway è disabilitata quando la policy richiede l’autenticazione. |
| `policy/gateway-rate-limit-missing`                      | La postura del limite di frequenza dell’autenticazione del Gateway non è esplicita quando la policy la richiede. |
| `policy/gateway-control-ui-insecure`                     | Le opzioni di esposizione non sicura della Control UI del Gateway sono abilitate. |
| `policy/gateway-tailscale-funnel`                        | L’esposizione Tailscale Funnel del Gateway è abilitata quando la policy la nega.  |
| `policy/gateway-remote-enabled`                          | La modalità remota del Gateway è attiva quando la policy la nega.                |
| `policy/gateway-http-endpoint-enabled`                   | Un endpoint API HTTP del Gateway è abilitato mentre è negato dalla policy.        |
| `policy/gateway-http-url-fetch-unrestricted`             | L’input di recupero URL HTTP del Gateway non ha l’allowlist URL richiesta.        |
| `policy/agents-workspace-access-denied`                  | La modalità sandbox dell’agente o l’accesso al workspace è fuori dall’allowlist della policy. |
| `policy/agents-tool-not-denied`                          | Una configurazione agente o predefinita non nega uno strumento richiesto dalla policy. |
| `policy/tools-profile-unapproved`                        | Un profilo strumenti globale o per agente configurato è fuori dall’allowlist.     |
| `policy/tools-fs-workspace-only-required`                | Gli strumenti del filesystem non sono configurati con postura dei percorsi solo workspace. |
| `policy/tools-exec-security-unapproved`                  | La modalità di sicurezza exec è fuori dall’allowlist della policy.               |
| `policy/tools-exec-ask-unapproved`                       | La modalità ask di exec è fuori dall’allowlist della policy.                     |
| `policy/tools-exec-host-unapproved`                      | Il routing host di exec è fuori dall’allowlist della policy.                     |
| `policy/tools-elevated-enabled`                          | La modalità strumento elevata è abilitata quando la policy la nega.              |
| `policy/tools-also-allow-missing`                        | A una lista `alsoAllow` configurata manca una voce richiesta dalla policy.        |
| `policy/tools-also-allow-unexpected`                     | Una lista `alsoAllow` configurata include una voce non attesa dalla policy.       |
| `policy/tools-required-deny-missing`                     | Una lista di negazione strumenti globale o per agente non include uno strumento negato richiesto. |
| `policy/sandbox-mode-unapproved`                         | La modalità sandbox è fuori dall’allowlist della policy.                         |
| `policy/sandbox-backend-unapproved`                      | Il backend sandbox è fuori dall’allowlist della policy.                          |
| `policy/sandbox-container-posture-unobservable`          | Una regola di postura del container è abilitata per un backend che non può osservarla. |
| `policy/sandbox-container-host-network-denied`           | Una sandbox o un browser basato su container usa la modalità rete host.           |
| `policy/sandbox-container-namespace-join-denied`         | Una sandbox o un browser basato su container si unisce al namespace di un altro container. |
| `policy/sandbox-container-mount-mode-required`           | Un mount di una sandbox o di un browser basato su container non è di sola lettura. |
| `policy/sandbox-container-runtime-socket-mount`          | Un mount di una sandbox o di un browser basato su container espone il socket del runtime del container. |
| `policy/sandbox-container-unconfined-profile`            | Il profilo sandbox del container è senza confinamento quando la policy lo nega.   |
| `policy/sandbox-browser-cdp-source-range-missing`        | L’intervallo sorgente CDP del browser sandbox manca quando la policy ne richiede uno. |
| `policy/data-handling-redaction-disabled`                | La redazione dei log sensibili è disabilitata quando la policy la richiede.       |
| `policy/data-handling-telemetry-content-capture`         | L’acquisizione del contenuto della telemetria è abilitata quando la policy la nega. |
| `policy/data-handling-session-retention-not-enforced`    | La manutenzione della conservazione delle sessioni non è applicata quando la policy la richiede. |
| `policy/data-handling-session-transcript-memory-enabled` | L’indicizzazione in memoria delle trascrizioni di sessione è abilitata quando la policy la nega. |
| `policy/secrets-unmanaged-provider`                      | Un SecretRef di configurazione fa riferimento a un provider non dichiarato in `secrets.providers`. |
| `policy/secrets-denied-provider-source`                  | Un provider di segreti di configurazione o SecretRef usa una sorgente negata dalla policy. |
| `policy/secrets-insecure-provider`                       | Un provider di segreti opta per una postura non sicura quando la policy la nega.  |
| `policy/auth-profile-invalid-metadata`                   | A un profilo di autenticazione di configurazione mancano metadati validi di provider o modalità. |
| `policy/auth-profile-unapproved-mode`                    | Una modalità di profilo di autenticazione di configurazione è fuori dall’allowlist della policy. |
| `policy/exec-approvals-missing`                          | La policy richiede `exec-approvals.json`, ma l’artefatto manca.                  |
| `policy/exec-approvals-invalid`                          | L’artefatto delle approvazioni exec configurato non può essere analizzato.        |
| `policy/exec-approvals-default-security-unapproved`      | I valori predefiniti di approvazione exec usano una modalità di sicurezza fuori dall’allowlist della policy. |
| `policy/exec-approvals-agent-security-unapproved`        | Una modalità di sicurezza effettiva di approvazione exec per agente è fuori dall’allowlist. |
| `policy/exec-approvals-auto-allow-skills-enabled`        | Un agente di approvazione exec consente automaticamente in modo implicito le CLI skill quando la policy lo nega. |
| `policy/exec-approvals-allowlist-missing`                | All’allowlist delle approvazioni manca un pattern richiesto dalla policy.         |
| `policy/exec-approvals-allowlist-unexpected`             | L’allowlist delle approvazioni include un pattern non atteso dalla policy.        |
| `policy/tools-missing-risk-level`                        | A una dichiarazione di strumento governato mancano i metadati di rischio.         |
| `policy/tools-unknown-risk-level`                        | Una dichiarazione di strumento governato usa un valore di rischio sconosciuto.    |
| `policy/tools-missing-sensitivity-token`                 | A una dichiarazione di strumento governato mancano i metadati di sensibilità.     |
| `policy/tools-missing-owner`                             | A una dichiarazione di strumento governato mancano i metadati del proprietario.   |
| `policy/tools-unknown-sensitivity-token`                 | Una dichiarazione di strumento governato usa un valore di sensibilità sconosciuto. |

I riscontri della policy possono includere sia `target` sia `requirement`. `target` è
l’elemento osservato nel workspace che non è conforme. `requirement` è la regola di
policy scritta che lo ha reso un riscontro. Entrambi i valori oggi sono indirizzi, di solito
percorsi `oc://`, ma i nomi dei campi descrivono il loro ruolo nella policy anziché il
formato dell’indirizzo.

Esempio di riscontro JSON:

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

Esempio di riscontro strumento:

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

Esempio di riscontro MCP:

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

Esempio di riscontro provider di modelli:

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

Esempio di riscontro rete:

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

Esempio di rilevamento dell'esposizione del Gateway:

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

Esempio di rilevamento dell'area di lavoro dell'agente:

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

`doctor --lint` e `policy check` sono in sola lettura.

`doctor --fix` modifica solo le impostazioni dell'area di lavoro gestite dalla policy quando
`workspaceRepairs` è abilitato esplicitamente. Senza questa adesione esplicita, i controlli delle policy
segnalano ciò che riparerebbero e lasciano le impostazioni invariate.

In questa versione, la riparazione può disabilitare i canali che sono abilitati nella configurazione OpenClaw
ma negati da `channels.denyRules`. Abilita `workspaceRepairs` solo dopo che il
file delle policy è stato revisionato, perché una regola di negazione valida può disattivare un
canale configurato:

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
| `policy check`   | Nessun rilevamento alla soglia.                        | Uno o più rilevamenti hanno raggiunto la soglia.                    | Errore di argomento o runtime. |
| `policy compare` | Il file delle policy è almeno rigoroso quanto il riferimento. | Il file delle policy non è valido, manca o è più debole delle regole di riferimento. | Errore di argomento o runtime. |
| `policy watch`   | Nessun rilevamento e l'hash accettato è aggiornato.    | Esistono rilevamenti o l'attestazione accettata è obsoleta.         | Errore di argomento o runtime. |

## Correlati

- [Modalità lint di Doctor](/it/cli/doctor#lint-mode)
- [CLI path](/it/cli/path)
