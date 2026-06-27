---
read_when:
    - Ti serve un hook o uno strumento del Plugin per richiedere conferma prima che venga eseguito un effetto collaterale
    - Devi configurare dove vengono recapitate le richieste di approvazione dei plugin
    - Stai scegliendo tra strumenti opzionali, approvazioni per exec e approvazioni per Plugin
sidebarTitle: Permission requests
summary: Chiedi agli utenti di approvare le chiamate agli strumenti dei Plugin e le richieste di autorizzazione di proprietà dei Plugin
title: Richieste di autorizzazione dei Plugin
x-i18n:
    generated_at: "2026-06-27T17:53:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 72b860e9f8ddef80c70e943ec05353cbc0a917577382289649432a58c3ce6bd0
    source_path: plugins/plugin-permission-requests.md
    workflow: 16
---

Le richieste di autorizzazione del Plugin consentono al codice del Plugin di mettere in pausa una chiamata a uno strumento o un'operazione di proprietà del Plugin finché un utente non la approva o la nega. Usano il flusso Gateway `plugin.approval.*` e le stesse superfici dell'interfaccia di approvazione che gestiscono i pulsanti di approvazione in chat e i comandi `/approve`.

Usa le richieste di autorizzazione del Plugin per le autorizzazioni di Plugin/app. Non sostituiscono le approvazioni exec dell'host, le allowlist facoltative degli strumenti o la revisione nativa delle autorizzazioni di Codex.

## Scegli il gate corretto

Scegli il gate che corrisponde al punto decisionale di cui hai bisogno:

| Gate                             | Usalo quando                                                              | Cosa controlla                                                                                                  |
| -------------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| Strumenti facoltativi                   | Uno strumento non deve essere visibile al modello finché l'utente non acconsente.        | Esposizione degli strumenti tramite `tools.allow`.                                                                              |
| Richieste di autorizzazione del Plugin       | Un hook del Plugin o un'operazione di proprietà del Plugin deve chiedere prima che venga eseguita un'azione. | Approvazione runtime tramite `plugin.approval.*`.                                                                     |
| Approvazioni exec                   | Un comando host o uno strumento simile a una shell richiede l'approvazione dell'operatore.               | Criteri exec dell'host e allowlist exec durevoli.                                                                     |
| Richieste di autorizzazione native di Codex | Codex chiede prima di azioni native di shell, file, MCP o app-server.        | Gestione dell'approvazione app-server o hook nativa di Codex, instradata tramite approvazioni del Plugin quando OpenClaw possiede il prompt. |
| Elicitazioni di approvazione MCP        | Un server MCP di Codex richiede l'approvazione per una chiamata a uno strumento.                    | Risposte di approvazione MCP collegate tramite approvazioni del Plugin OpenClaw.                                                 |

Gli strumenti facoltativi sono un gate in fase di discovery. Le richieste di autorizzazione del Plugin sono un gate per singola chiamata. Usa entrambi quando uno strumento sensibile deve richiedere un consenso esplicito prima che il modello possa vederlo e un'approvazione prima che l'azione venga eseguita.

## Richiedi l'approvazione prima di una chiamata a uno strumento

La maggior parte dei prompt creati dai Plugin dovrebbe iniziare in un hook `before_tool_call`. L'hook viene eseguito dopo che il modello seleziona uno strumento e prima che OpenClaw lo esegua:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "deploy-policy",
  name: "Deploy Policy",
  register(api) {
    api.on("before_tool_call", async (event) => {
      if (event.toolName !== "deploy_service") {
        return;
      }

      const environment =
        typeof event.params.environment === "string" ? event.params.environment : "unknown";

      return {
        requireApproval: {
          title: "Deploy service",
          description: `Deploy service to ${environment}.`,
          severity: environment === "production" ? "critical" : "warning",
          allowedDecisions:
            environment === "production"
              ? ["allow-once", "deny"]
              : ["allow-once", "allow-always", "deny"],
          timeoutMs: 120_000,
          timeoutBehavior: "deny",
          onResolution(decision) {
            console.log(`deploy approval resolved: ${decision}`);
          },
        },
      };
    });
  },
});
```

Scrivi il testo del prompt per la persona che approverà l'azione:

- Mantieni `title` breve e focalizzato sull'azione. Il Gateway accetta fino a 80
  caratteri.
- Mantieni `description` specifica e delimitata. Il Gateway accetta fino a 256
  caratteri.
- Includi azione, destinazione e rischio. Non includere segreti, token o
  payload privati che non dovrebbero apparire nelle superfici di approvazione in chat.
- Usa `severity: "critical"` solo per azioni in cui la decisione sbagliata potrebbe
  causare danni alla produzione o perdita di dati.
- Usa `allowedDecisions: ["allow-once", "deny"]` quando la fiducia persistente è
  non sicura per quell'azione.

## Comportamento delle decisioni

OpenClaw crea un'approvazione in sospeso con un ID `plugin:`, la consegna alle
superfici di approvazione disponibili e attende una decisione.

| Decisione          | Risultato                                                                    |
| ----------------- | ------------------------------------------------------------------------- |
| `allow-once`      | La chiamata corrente continua.                                               |
| `allow-always`    | La chiamata corrente continua e la decisione viene passata al Plugin.      |
| `deny`            | La chiamata viene bloccata con un risultato di strumento negato.                            |
| Timeout           | La chiamata viene bloccata a meno che `timeoutBehavior` non sia `"allow"`.                |
| Annullamento      | La chiamata viene bloccata quando l'esecuzione viene interrotta.                              |
| Nessuna route di approvazione | La chiamata viene bloccata perché nessuna superficie di approvazione connessa può risolverla. |

`allow-always` è durevole solo quando il Plugin o il runtime richiedente implementa
quella persistenza. Per gli hook ordinari `before_tool_call.requireApproval`,
OpenClaw tratta `allow-once` e `allow-always` come decisioni di approvazione per la
chiamata corrente e passa il valore risolto a `onResolution`. Se il tuo Plugin
offre `allow-always`, documenta e implementa esattamente quali chiamate future
considera attendibili.

Se l'hook restituisce anche `params`, OpenClaw applica quelle modifiche ai parametri solo
dopo che l'approvazione riesce. Un hook con priorità inferiore può comunque bloccare dopo che un
hook con priorità superiore ha richiesto l'approvazione.

`allowedDecisions` limita i pulsanti e i comandi mostrati all'utente. Il
Gateway rifiuta un tentativo di risoluzione per qualsiasi decisione che la richiesta non offriva.

## Instrada i prompt di approvazione

I prompt di approvazione possono risolversi nelle superfici dell'interfaccia locale o nei canali di chat che
supportano la gestione delle approvazioni. Per inoltrare i prompt di approvazione del Plugin a destinazioni di chat
esplicite, configura `approvals.plugin`:

```json5
{
  approvals: {
    plugin: {
      enabled: true,
      mode: "targets",
      agentFilter: ["main"],
      targets: [{ channel: "slack", to: "U12345678" }],
    },
  },
}
```

`approvals.plugin` è indipendente da `approvals.exec`. Abilitare l'inoltro delle approvazioni exec
non instrada i prompt di approvazione del Plugin, e abilitare l'inoltro delle approvazioni del Plugin
non modifica i criteri exec dell'host.

Quando un prompt include testo di approvazione manuale, risolvilo con una delle decisioni offerte:

```text
/approve <id> allow-once
/approve <id> allow-always
/approve <id> deny
```

Consulta [Approvazioni exec avanzate](/it/tools/exec-approvals-advanced#plugin-approval-forwarding)
per il modello completo di inoltro, il comportamento di approvazione nella stessa chat, la consegna nativa del canale
e le regole specifiche del canale per gli approvatori.

## Autorizzazioni native di Codex

Anche i prompt di autorizzazione nativi di Codex possono passare tramite approvazioni del Plugin, ma
hanno una proprietà diversa dagli hook creati dai Plugin.

- Le richieste di approvazione app-server di Codex vengono instradate tramite OpenClaw dopo la revisione di Codex.
- Il relay dell'hook nativa `permission_request` può chiedere tramite
  `plugin.approval.request` quando quel relay è abilitato.
- Le elicitazioni di approvazione degli strumenti MCP vengono instradate tramite approvazioni del Plugin quando Codex imposta
  `_meta.codex_approval_kind` su `"mcp_tool_call"`.

Consulta [Runtime dell'harness Codex](/it/plugins/codex-harness-runtime#native-permissions-and-mcp-elicitations)
per il comportamento specifico di Codex e le regole di fallback.

## Risoluzione dei problemi

**Lo strumento dice che le approvazioni del Plugin non sono disponibili.** Nessuna interfaccia di approvazione o route di
approvazione configurata ha accettato la richiesta. Connetti un client capace di approvazione, usa un
canale che supporti `/approve` nella stessa chat, oppure configura `approvals.plugin`.

**`allow-always` appare ma la chiamata successiva mostra di nuovo il prompt.** Il flusso generico di
approvazione del Plugin non persiste automaticamente la fiducia per hook arbitrari. Persiste
la fiducia di proprietà del Plugin nel tuo Plugin dopo `onResolution("allow-always")`, oppure
offri solo `allow-once` e `deny`.

**`/approve` rifiuta la decisione.** La richiesta ha limitato
`allowedDecisions`. Usa una delle decisioni stampate nel prompt.

**Un prompt Slack, Discord, Telegram o Matrix viene instradato diversamente dalle approvazioni exec.** Le approvazioni del Plugin e le approvazioni exec usano configurazioni separate e possono usare
controlli di autorizzazione diversi. Verifica `approvals.plugin` e il supporto delle approvazioni del Plugin del canale invece di controllare solo `approvals.exec`.

## Correlati

- [Hook del Plugin](/it/plugins/hooks#tool-call-policy)
- [Creare Plugin](/it/plugins/building-plugins#registering-agent-tools)
- [Approvazioni exec avanzate](/it/tools/exec-approvals-advanced#plugin-approval-forwarding)
- [Protocollo Gateway](/it/gateway/protocol)
- [Runtime dell'harness Codex](/it/plugins/codex-harness-runtime#native-permissions-and-mcp-elicitations)
