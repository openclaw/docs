---
read_when:
    - Serve un hook o uno strumento del plugin per chiedere conferma prima che venga eseguito un effetto collaterale
    - È necessario configurare dove vengono inviate le richieste di approvazione dei plugin
    - Si sta decidendo tra strumenti opzionali, approvazioni per l'esecuzione e approvazioni per i plugin
sidebarTitle: Permission requests
summary: Chiedere agli utenti di approvare le chiamate agli strumenti dei plugin e le richieste di autorizzazione gestite dai plugin
title: Richieste di autorizzazione dei Plugin
x-i18n:
    generated_at: "2026-07-16T14:42:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 675534212e70cc7b2e7bdc801955929c6a8156b08d620483edf0133afc3bfdaa
    source_path: plugins/plugin-permission-requests.md
    workflow: 16
---

Le richieste di autorizzazione dei Plugin consentono al codice dei Plugin di sospendere una chiamata a uno strumento o un'operazione di proprietà del Plugin finché un utente non la approva o la nega. Usano il flusso del Gateway
`plugin.approval.*` e le stesse interfacce di approvazione che gestiscono i pulsanti di approvazione nelle chat e i comandi `/approve`.

Usare le richieste di autorizzazione dei Plugin per le autorizzazioni di Plugin/app. Non sostituiscono le approvazioni di esecuzione dell'host, gli elenchi facoltativi degli strumenti consentiti o la revisione nativa delle autorizzazioni di Codex.

## Scegliere il controllo appropriato

Scegliere il controllo corrispondente al punto decisionale necessario:

| Controllo                             | Quando usarlo                                                              | Cosa controlla                                                                                                  |
| -------------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| Strumenti facoltativi                   | Uno strumento non deve essere visibile al modello finché l'utente non acconsente esplicitamente.        | Esposizione degli strumenti tramite `tools.allow`.                                                                              |
| Richieste di autorizzazione dei Plugin       | Un hook di un Plugin o un'operazione di proprietà del Plugin deve chiedere conferma prima di eseguire un'azione. | Approvazione in fase di esecuzione tramite `plugin.approval.*`.                                                                     |
| Approvazioni di esecuzione                   | Un comando dell'host o uno strumento simile a una shell richiede l'approvazione dell'operatore.               | Criteri di esecuzione dell'host ed elenchi permanenti dei comandi consentiti.                                                                     |
| Richieste di autorizzazione native di Codex | Codex chiede conferma prima di azioni native di shell, file, MCP o app-server.        | Gestione delle approvazioni dell'app-server o degli hook nativi di Codex, instradata tramite le approvazioni dei Plugin quando OpenClaw gestisce la richiesta. |
| Richieste di approvazione MCP        | Un server MCP di Codex richiede l'approvazione per una chiamata a uno strumento.                    | Risposte di approvazione MCP veicolate tramite le approvazioni dei Plugin di OpenClaw.                                                 |

Gli strumenti facoltativi costituiscono un controllo nella fase di individuazione. Le richieste di autorizzazione dei Plugin costituiscono un controllo per singola chiamata. Usarli entrambi quando uno strumento sensibile deve richiedere un consenso esplicito prima di essere visibile al modello e un'approvazione prima dell'esecuzione dell'azione.

## Richiedere l'approvazione prima di una chiamata a uno strumento

La maggior parte delle richieste create dai Plugin dovrebbe iniziare in un hook `before_tool_call`. L'hook viene eseguito dopo che il modello seleziona uno strumento e prima che OpenClaw lo esegua:

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
          onResolution(decision) {
            console.log(`deploy approval resolved: ${decision}`);
          },
        },
      };
    });
  },
});
```

Scrivere il testo della richiesta per la persona che approverà l'azione:

- Mantenere `title` breve e incentrato sull'azione; il Gateway lo limita a 80 caratteri.
- Mantenere `description` specifico e circoscritto; il Gateway lo limita a 512
  caratteri.
- Includere l'azione, la destinazione e il rischio. Non includere segreti, token o
  payload privati che non devono apparire nelle interfacce di approvazione delle chat.
- `severity` usa per impostazione predefinita `"warning"` se omesso. Usare `"critical"` solo per
  le azioni in cui una decisione errata potrebbe causare danni alla produzione o perdita di dati.
- `allowedDecisions` usa per impostazione predefinita `["allow-once", "allow-always", "deny"]` se
  omesso. Passare `["allow-once", "deny"]` quando la fiducia persistente non è sicura per
  quell'azione.
- `timeoutMs` usa per impostazione predefinita 120000 (2 minuti) ed è limitato a 600000 (10
  minuti), indipendentemente dal valore richiesto.

## Comportamento delle decisioni

OpenClaw crea un'approvazione in sospeso con un ID `plugin:`, la invia alle
interfacce di approvazione disponibili e attende una decisione.

| Decisione          | Risultato                                                                    |
| ----------------- | ------------------------------------------------------------------------- |
| `allow-once`      | La chiamata corrente prosegue.                                               |
| `allow-always`    | La chiamata corrente prosegue e la decisione viene trasmessa al Plugin.      |
| `deny`            | La chiamata viene bloccata con un risultato di strumento negato.                            |
| Timeout           | La chiamata viene bloccata.                                                      |
| Annullamento      | La chiamata viene bloccata quando l'esecuzione viene interrotta.                              |
| Nessun percorso di approvazione | La chiamata viene bloccata perché nessuna interfaccia di approvazione connessa può gestirla. |

Solo le decisioni esatte `allow-once` e `allow-always` consentite dalla
richiesta permettono l'esecuzione. Le decisioni sconosciute, non valide, non corrispondenti, mancanti o scadute
determinano un blocco per impostazione predefinita. Il campo legacy `timeoutBehavior` continua a essere accettato per
la compatibilità dei Plugin, ma è deprecato e ignorato; non impostarlo nei nuovi hook.

`allow-always` è permanente solo quando il Plugin o il runtime richiedente implementa
tale persistenza. Per i normali hook `before_tool_call.requireApproval`,
OpenClaw considera `allow-once` e `allow-always` decisioni di approvazione per la
chiamata corrente e passa il valore risolto a `onResolution`. Se il Plugin
offre `allow-always`, documentare e implementare esattamente quali chiamate future considera
attendibili.

Se l'hook restituisce anche `params`, OpenClaw applica tali modifiche ai parametri solo
dopo l'approvazione. Un hook con priorità inferiore può comunque bloccare dopo che un
hook con priorità superiore ha richiesto l'approvazione.

`allowedDecisions` limita i pulsanti e i comandi mostrati all'utente. Il
Gateway rifiuta qualsiasi tentativo di risoluzione con una decisione non proposta dalla richiesta.

## Instradare le richieste di approvazione

Le richieste di approvazione possono essere risolte nelle interfacce utente locali o nei canali di chat che
supportano la gestione delle approvazioni. Per inoltrare le richieste di approvazione dei Plugin a destinazioni
di chat esplicite, configurare `approvals.plugin`:

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

`approvals.plugin` è indipendente da `approvals.exec`. L'abilitazione dell'inoltro delle approvazioni di esecuzione
non instrada le richieste di approvazione dei Plugin e l'abilitazione dell'inoltro delle approvazioni dei Plugin
non modifica i criteri di esecuzione dell'host.

Quando una richiesta include testo per l'approvazione manuale, risolverla con una delle decisioni
proposte:

```text
/approve <id> allow-once
/approve <id> allow-always
/approve <id> deny
```

Consultare [Approvazioni di esecuzione avanzate](/it/tools/exec-approvals-advanced#plugin-approval-forwarding)
per il modello completo di inoltro, il comportamento di approvazione nella stessa chat, la consegna nativa
del canale e le regole specifiche del canale per gli approvatori.

## Autorizzazioni native di Codex

Anche le richieste di autorizzazione native di Codex possono transitare tramite le approvazioni dei Plugin, ma
hanno una titolarità diversa dagli hook creati dai Plugin.

- Le richieste di approvazione dell'app-server di Codex vengono instradate tramite OpenClaw dopo la revisione di Codex.
- Il relay dell'hook nativo `permission_request` può effettuare la richiesta tramite
  `plugin.approval.request` quando tale relay è abilitato.
- Le richieste di approvazione degli strumenti MCP vengono instradate tramite le approvazioni dei Plugin quando Codex contrassegna
  `_meta.codex_approval_kind` come `"mcp_tool_call"`.

Consultare [Runtime dell'harness di Codex](/it/plugins/codex-harness-runtime#native-permissions-and-mcp-elicitations)
per il comportamento specifico di Codex e le regole di ripiego.

## Risoluzione dei problemi

**Lo strumento indica che le approvazioni dei Plugin non sono disponibili.** Nessuna interfaccia di approvazione o percorso di approvazione configurato
ha accettato la richiesta. Connettere un client in grado di gestire le approvazioni, usare un
canale che supporti `/approve` nella stessa chat oppure configurare `approvals.plugin`.

**Viene visualizzato `allow-always`, ma la chiamata successiva richiede nuovamente l'approvazione.** Il flusso generico di
approvazione dei Plugin non rende automaticamente permanente la fiducia per hook arbitrari. Rendere permanente
la fiducia di proprietà del Plugin nel Plugin dopo `onResolution("allow-always")`, oppure
offrire solo `allow-once` e `deny`.

**`/approve` rifiuta la decisione.** La richiesta ha limitato
`allowedDecisions`. Usare una delle decisioni mostrate nella richiesta.

**Una richiesta di Discord, Matrix, Slack o Telegram viene instradata diversamente dalle
approvazioni di esecuzione.** Le approvazioni dei Plugin e le approvazioni di esecuzione usano configurazioni separate e possono usare
controlli di autorizzazione diversi. Verificare `approvals.plugin` e il supporto del canale
per l'approvazione dei Plugin, anziché controllare soltanto `approvals.exec`.

## Argomenti correlati

- [Hook dei Plugin](/it/plugins/hooks#tool-call-policy)
- [Creazione di Plugin](/it/plugins/building-plugins#registering-tools)
- [Approvazioni di esecuzione avanzate](/it/tools/exec-approvals-advanced#plugin-approval-forwarding)
- [Protocollo del Gateway](/it/gateway/protocol)
- [Runtime dell'harness di Codex](/it/plugins/codex-harness-runtime#native-permissions-and-mcp-elicitations)
