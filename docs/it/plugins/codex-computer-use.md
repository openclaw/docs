---
read_when:
    - Vuoi che gli agenti OpenClaw in modalità Codex usino Codex Computer Use
    - Stai scegliendo tra Codex Computer Use, PeekabooBridge e l'MCP cua-driver diretto
    - Stai scegliendo tra Codex Computer Use e una configurazione MCP diretta con cua-driver
    - Stai configurando computerUse per il Plugin Codex incluso
    - Stai risolvendo problemi con /codex computer-use status o install
summary: Configura Codex Computer Use per gli agenti OpenClaw in modalità Codex
title: Uso del computer di Codex
x-i18n:
    generated_at: "2026-05-03T21:37:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 08383e88ca02dccc86c622c3295478e950fdd222ef16947465e0de1dacafa56c
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use è un Plugin MCP nativo di Codex per il controllo del desktop locale. OpenClaw
non incorpora l'app desktop, non esegue direttamente azioni sul desktop né elude
le autorizzazioni di Codex. Il Plugin `codex` incluso prepara solo Codex app-server:
abilita il supporto ai Plugin di Codex, trova o installa il Plugin Codex Computer
Use configurato, verifica che il server MCP `computer-use` sia disponibile e
poi lascia che Codex gestisca le chiamate native agli strumenti MCP durante i turni
in modalità Codex.

Usa questa pagina quando OpenClaw sta già usando l'harness nativo di Codex. Per la
configurazione del runtime, vedi [harness Codex](/it/plugins/codex-harness).

## OpenClaw.app e Peekaboo

L'integrazione Peekaboo di OpenClaw.app è separata da Codex Computer Use. L'app
macOS può ospitare un socket PeekabooBridge affinché la CLI `peekaboo` possa
riutilizzare le autorizzazioni locali di Accessibilità e Registrazione schermo
dell'app per gli strumenti di automazione propri di Peekaboo. Quel bridge non
installa né fa da proxy a Codex Computer Use, e Codex Computer Use non chiama
tramite il socket PeekabooBridge.

Usa [bridge Peekaboo](/it/platforms/mac/peekaboo) quando vuoi che OpenClaw.app sia
un host consapevole delle autorizzazioni per l'automazione della CLI Peekaboo.
Usa questa pagina quando un agente OpenClaw in modalità Codex deve avere il
Plugin MCP nativo `computer-use` di Codex disponibile prima dell'inizio del turno.

## App iOS

L'app iOS è separata da Codex Computer Use. Non installa né fa da proxy al
server MCP `computer-use` di Codex e non è un backend per il controllo del
desktop. L'app iOS invece si connette come nodo OpenClaw ed espone funzionalità
mobili tramite comandi del nodo come `canvas.*`, `camera.*`, `screen.*`,
`location.*` e `talk.*`.

Usa [iOS](/it/platforms/ios) quando vuoi che un agente controlli un nodo iPhone tramite
il Gateway. Usa questa pagina quando un agente in modalità Codex deve controllare
il desktop macOS locale tramite il Plugin nativo Computer Use di Codex.

## MCP cua-driver diretto

Codex Computer Use non è l'unico modo per esporre il controllo del desktop. Se vuoi
che i runtime gestiti da OpenClaw chiamino direttamente il driver di TryCua, usa il
server upstream `cua-driver mcp` tramite il registro MCP di OpenClaw invece del
flusso marketplace specifico di Codex.

Dopo aver installato `cua-driver`, chiedigli il comando OpenClaw:

```bash
cua-driver mcp-config --client openclaw
```

oppure registra tu stesso il server stdio:

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

Questo percorso mantiene intatta la superficie degli strumenti MCP upstream, inclusi
gli schemi del driver e le risposte MCP strutturate. Usalo quando vuoi rendere il
driver CUA disponibile come normale server MCP di OpenClaw. Usa la configurazione
Codex Computer Use in questa pagina quando Codex app-server deve gestire
l'installazione del Plugin, i ricaricamenti MCP e le chiamate native agli strumenti
all'interno dei turni in modalità Codex.

Il driver di CUA è specifico per macOS e richiede comunque le autorizzazioni locali
di macOS richieste dalla sua app, come Accessibilità e Registrazione schermo.
OpenClaw non installa `cua-driver`, non concede quelle autorizzazioni e non elude
il modello di sicurezza del driver upstream.

## Configurazione rapida

Imposta `plugins.entries.codex.config.computerUse` quando i turni in modalità Codex
devono avere Computer Use disponibile prima dell'avvio di un thread:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          computerUse: {
            autoInstall: true,
          },
        },
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
      },
    },
  },
}
```

Con questa configurazione, OpenClaw controlla Codex app-server prima di ogni turno
in modalità Codex. Se Computer Use manca ma Codex app-server ha già scoperto un
marketplace installabile, OpenClaw chiede a Codex app-server di installare o
riabilitare il Plugin e ricaricare i server MCP. Su macOS, quando non è registrato
alcun marketplace corrispondente ed esiste il bundle standard dell'app Codex,
OpenClaw prova anche a registrare il marketplace Codex incluso da
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` prima di
fallire. Se la configurazione non riesce comunque a rendere disponibile il server
MCP, il turno fallisce prima dell'avvio del thread.

Le sessioni esistenti mantengono il runtime e il binding del thread Codex. Dopo
aver modificato `agentRuntime` o la configurazione di Computer Use, usa `/new` o
`/reset` nella chat interessata prima di testare.

## Comandi

Usa i comandi `/codex computer-use` da qualsiasi superficie di chat in cui la
superficie dei comandi del Plugin `codex` sia disponibile. Questi sono comandi
chat/runtime di OpenClaw, non sottocomandi CLI `openclaw codex ...`:

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` è in sola lettura. Non aggiunge fonti marketplace, non installa Plugin né
abilita il supporto ai Plugin di Codex.

`install` abilita il supporto ai Plugin di Codex app-server, aggiunge facoltativamente
una fonte marketplace configurata, installa o riabilita il Plugin configurato tramite
Codex app-server, ricarica i server MCP e verifica che il server MCP esponga strumenti.

## Scelte del marketplace

OpenClaw usa la stessa API app-server esposta da Codex. I campi marketplace scelgono
dove Codex deve trovare `computer-use`.

| Campo                | Usa quando                                                        | Supporto installazione                                          |
| -------------------- | ----------------------------------------------------------------- | --------------------------------------------------------------- |
| Nessun campo marketplace | Vuoi che Codex app-server usi i marketplace che conosce già.   | Sì, quando app-server restituisce un marketplace locale.        |
| `marketplaceSource`  | Hai una fonte marketplace Codex che app-server può aggiungere.    | Sì, per `/codex computer-use install` esplicito.                |
| `marketplacePath`    | Conosci già il percorso file del marketplace locale sull'host.    | Sì, per installazione esplicita e installazione automatica all'avvio del turno. |
| `marketplaceName`    | Vuoi selezionare per nome un marketplace già registrato.          | Sì, solo quando il marketplace selezionato ha un percorso locale. |

Le home Codex nuove possono richiedere un breve momento per inizializzare i loro
marketplace ufficiali. Durante l'installazione, OpenClaw interroga `plugin/list`
fino a `marketplaceDiscoveryTimeoutMs` millisecondi. Il valore predefinito è
60 secondi.

Se più marketplace noti contengono Computer Use, OpenClaw preferisce
`openai-bundled`, poi `openai-curated`, poi `local`. Le corrispondenze ambigue
sconosciute falliscono in modo chiuso e chiedono di impostare `marketplaceName` o
`marketplacePath`.

## Marketplace macOS incluso

Le build desktop recenti di Codex includono Computer Use qui:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

Quando `computerUse.autoInstall` è true e non è registrato alcun marketplace che
contenga `computer-use`, OpenClaw prova ad aggiungere automaticamente la radice
standard del marketplace incluso:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Puoi anche registrarla esplicitamente da una shell con Codex:

```bash
codex plugin marketplace add /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Se usi un percorso non standard per l'app Codex, imposta `computerUse.marketplacePath`
su un percorso file di marketplace locale oppure esegui una volta
`/codex computer-use install --source <marketplace-source>`.

## Limite del catalogo remoto

Codex app-server può elencare e leggere voci di catalogo solo remote, ma attualmente
non supporta `plugin/install` remoto. Questo significa che `marketplaceName` può
selezionare un marketplace solo remoto per i controlli di stato, ma installazioni
e riabilitazioni richiedono comunque un marketplace locale tramite
`marketplaceSource` o `marketplacePath`.

Se lo stato dice che il Plugin è disponibile in un marketplace Codex remoto ma
l'installazione remota non è supportata, esegui l'installazione con una fonte o un
percorso locale:

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## Riferimento di configurazione

| Campo                           | Predefinito    | Significato                                                                    |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------ |
| `enabled`                       | inferito       | Richiede Computer Use. Il valore predefinito è true quando è impostato un altro campo Computer Use. |
| `autoInstall`                   | false          | Installa o riabilita dai marketplace già scoperti all'avvio del turno.         |
| `marketplaceDiscoveryTimeoutMs` | 60000          | Per quanto tempo l'installazione attende la scoperta dei marketplace di Codex app-server. |
| `marketplaceSource`             | non impostato  | Stringa fonte passata a `marketplace/add` di Codex app-server.                 |
| `marketplacePath`               | non impostato  | Percorso file del marketplace Codex locale che contiene il Plugin.             |
| `marketplaceName`               | non impostato  | Nome del marketplace Codex registrato da selezionare.                          |
| `pluginName`                    | `computer-use` | Nome del Plugin nel marketplace Codex.                                         |
| `mcpServerName`                 | `computer-use` | Nome del server MCP esposto dal Plugin installato.                             |

L'installazione automatica all'avvio del turno rifiuta intenzionalmente i valori
`marketplaceSource` configurati. Aggiungere una nuova fonte è un'operazione di
configurazione esplicita, quindi usa una volta
`/codex computer-use install --source <marketplace-source>`, poi lascia che
`autoInstall` gestisca le future riabilitazioni dai marketplace locali scoperti.
L'installazione automatica all'avvio del turno può usare un `marketplacePath`
configurato, perché è già un percorso locale sull'host.

## Cosa controlla OpenClaw

OpenClaw segnala internamente un motivo di configurazione stabile e formatta lo
stato rivolto all'utente per la chat:

| Motivo                       | Significato                                            | Passaggio successivo                          |
| ---------------------------- | ------------------------------------------------------ | --------------------------------------------- |
| `disabled`                   | `computerUse.enabled` si è risolto in false.           | Imposta `enabled` o un altro campo Computer Use. |
| `marketplace_missing`        | Non era disponibile alcun marketplace corrispondente.  | Configura fonte, percorso o nome marketplace. |
| `plugin_not_installed`       | Il marketplace esiste, ma il Plugin non è installato.  | Esegui install o abilita `autoInstall`.       |
| `plugin_disabled`            | Il Plugin è installato ma disabilitato nella configurazione Codex. | Esegui install per riabilitarlo.              |
| `remote_install_unsupported` | Il marketplace selezionato è solo remoto.              | Usa `marketplaceSource` o `marketplacePath`.  |
| `mcp_missing`                | Il Plugin è abilitato, ma il server MCP non è disponibile. | Controlla Codex Computer Use e le autorizzazioni del sistema operativo. |
| `ready`                      | Il Plugin e gli strumenti MCP sono disponibili.        | Avvia il turno in modalità Codex.             |
| `check_failed`               | Una richiesta a Codex app-server è fallita durante il controllo dello stato. | Controlla connettività e log di app-server.   |
| `auto_install_blocked`       | La configurazione all'avvio del turno dovrebbe aggiungere una nuova fonte. | Esegui prima un'installazione esplicita.      |

L'output della chat include lo stato del Plugin, lo stato del server MCP, il
marketplace, gli strumenti quando disponibili e il messaggio specifico per il
passaggio di configurazione non riuscito.

## Autorizzazioni macOS

Computer Use è specifico per macOS. Il server MCP gestito da Codex può richiedere
autorizzazioni locali del sistema operativo prima di poter ispezionare o controllare
app. Se OpenClaw dice che Computer Use è installato ma il server MCP non è
disponibile, verifica prima la configurazione Computer Use lato Codex:

- Codex app-server è in esecuzione sullo stesso host in cui deve
  avvenire il controllo del desktop.
- Il plugin Computer Use è abilitato nella configurazione di Codex.
- Il server MCP `computer-use` compare nello stato MCP di Codex app-server.
- macOS ha concesso le autorizzazioni richieste per l'app di controllo del desktop.
- La sessione host corrente può accedere al desktop controllato.

OpenClaw fallisce intenzionalmente in modo chiuso quando `computerUse.enabled` è true. Un
turno in modalità Codex non deve procedere silenziosamente senza gli strumenti desktop
nativi richiesti dalla configurazione.

## Risoluzione dei problemi

**Lo stato dice che non è installato.** Esegui `/codex computer-use install`. Se il
marketplace non viene rilevato, passa `--source` o `--marketplace-path`.

**Lo stato dice che è installato ma disabilitato.** Esegui di nuovo `/codex computer-use install`.
L'installazione di Codex app-server riscrive la configurazione del plugin come abilitata.

**Lo stato dice che l'installazione remota non è supportata.** Usa una sorgente o un
percorso di marketplace locale. Le voci di catalogo solo remote possono essere ispezionate ma non installate tramite l'API app-server corrente.

**Lo stato dice che il server MCP non è disponibile.** Esegui di nuovo l'installazione una volta, così i server MCP
si ricaricano. Se resta non disponibile, correggi l'app Codex Computer Use,
lo stato MCP di Codex app-server o le autorizzazioni di macOS.

**Lo stato o una sonda va in timeout su `computer-use.list_apps`.** Il plugin e il server MCP
sono presenti, ma il bridge locale Computer Use non ha risposto. Chiudi o
riavvia Codex Computer Use, riavvia Codex Desktop se necessario, quindi riprova in una
nuova sessione OpenClaw.

**Uno strumento Computer Use dice `Native hook relay unavailable`.** L'hook dello strumento nativo di Codex
non è riuscito a raggiungere un relay OpenClaw attivo tramite il bridge locale o il
fallback del Gateway. Avvia una nuova sessione OpenClaw con `/new` o `/reset`. Se
continua a succedere, riavvia il gateway in modo che i vecchi thread app-server e le
registrazioni degli hook vengano eliminate, quindi riprova.

**L'installazione automatica all'inizio del turno rifiuta una sorgente.** È intenzionale. Aggiungi la
sorgente con `/codex computer-use install --source <marketplace-source>` esplicito
prima; quindi le future installazioni automatiche all'inizio del turno potranno usare il marketplace locale rilevato.
