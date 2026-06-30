---
read_when:
    - Vuoi che gli agenti OpenClaw in modalità Codex usino Codex Computer Use
    - Stai scegliendo tra Codex Computer Use, PeekabooBridge e MCP diretto cua-driver
    - Stai scegliendo tra Codex Computer Use e una configurazione MCP diretta con cua-driver
    - Stai configurando computerUse per il Plugin Codex integrato
    - Stai risolvendo problemi relativi allo stato o all'installazione di /codex computer-use
summary: Configura Codex Computer Use per gli agenti OpenClaw in modalità Codex
title: Uso del computer di Codex
x-i18n:
    generated_at: "2026-06-30T14:06:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4cb785e2fda0d89a7e7770df0c2a4b3aa23f97cb1c8515a7d555a8409acfd3b2
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use è un Plugin MCP nativo di Codex per il controllo del desktop locale. OpenClaw
non incorpora l'app desktop, non esegue direttamente azioni sul desktop e non aggira
le autorizzazioni di Codex. Il Plugin `codex` incluso prepara solo Codex app-server:
abilita il supporto ai Plugin di Codex, trova o installa il Plugin Codex
Computer Use configurato, verifica che il server MCP `computer-use` sia disponibile e
poi lascia a Codex la gestione delle chiamate agli strumenti MCP nativi durante i turni in modalità Codex.

Usa questa pagina quando OpenClaw sta già usando l'harness nativo di Codex. Per la
configurazione del runtime, consulta [harness Codex](/it/plugins/codex-harness).

## OpenClaw.app e Peekaboo

L'integrazione Peekaboo di OpenClaw.app è separata da Codex Computer Use. L'app
macOS può ospitare un socket PeekabooBridge in modo che la CLI `peekaboo` possa riutilizzare le
autorizzazioni locali dell'app per Accessibilità e Registrazione schermo per gli strumenti di
automazione propri di Peekaboo. Quel bridge non installa né fa da proxy a Codex Computer Use, e
Codex Computer Use non passa attraverso il socket PeekabooBridge.

Usa [bridge Peekaboo](/it/platforms/mac/peekaboo) quando vuoi che OpenClaw.app sia
un host consapevole delle autorizzazioni per l'automazione della CLI Peekaboo. Usa questa pagina quando un
agente OpenClaw in modalità Codex deve avere disponibile il Plugin MCP nativo
`computer-use` di Codex prima dell'avvio del turno.

## App iOS

L'app iOS è separata da Codex Computer Use. Non installa né fa da proxy al
server MCP Codex `computer-use` e non è un backend di controllo desktop.
Invece, l'app iOS si connette come nodo OpenClaw ed espone capacità mobili
tramite comandi del nodo come `canvas.*`, `camera.*`, `screen.*`,
`location.*` e `talk.*`.

Usa [iOS](/it/platforms/ios) quando vuoi che un agente controlli un nodo iPhone tramite
il Gateway. Usa questa pagina quando un agente in modalità Codex deve controllare il desktop
macOS locale tramite il Plugin Computer Use nativo di Codex.

## MCP cua-driver diretto

Codex Computer Use non è l'unico modo per esporre il controllo del desktop. Se vuoi che
i runtime gestiti da OpenClaw chiamino direttamente il driver di TryCua, usa il server
upstream `cua-driver mcp` tramite il registro MCP di OpenClaw invece del
flusso marketplace specifico di Codex.

Dopo aver installato `cua-driver`, chiedigli il comando OpenClaw:

```bash
cua-driver mcp-config --client openclaw
```

oppure registra autonomamente il server stdio:

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

Quel percorso mantiene intatta la superficie degli strumenti MCP upstream, inclusi gli schemi
del driver e le risposte MCP strutturate. Usalo quando vuoi che il driver CUA
sia disponibile come normale server MCP OpenClaw. Usa la configurazione Codex Computer Use in
questa pagina quando Codex app-server deve gestire l'installazione del Plugin, i ricaricamenti MCP
e le chiamate agli strumenti nativi all'interno dei turni in modalità Codex.

Il driver CUA è specifico per macOS e richiede comunque le autorizzazioni macOS locali
richieste dalla sua app, come Accessibilità e Registrazione schermo. OpenClaw
non installa `cua-driver`, non concede tali autorizzazioni e non aggira il modello di sicurezza
del driver upstream.

## Configurazione rapida

Imposta `plugins.entries.codex.config.computerUse` quando i turni in modalità Codex devono avere
Computer Use disponibile prima dell'avvio di un thread. `autoInstall: true` attiva
Computer Use e consente a OpenClaw di installarlo o riabilitarlo prima del turno:

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
    },
  },
}
```

Con questa configurazione, OpenClaw controlla Codex app-server prima di ogni turno in modalità Codex.
Se Computer Use manca ma Codex app-server ha già individuato un
marketplace installabile, OpenClaw chiede a Codex app-server di installare o riabilitare
il Plugin e ricaricare i server MCP. Su macOS, quando non è registrato alcun marketplace
corrispondente e il bundle app standard di Codex esiste, OpenClaw prova anche a
registrare il marketplace Codex incluso da
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` prima di
fallire. Se la configurazione non riesce comunque a rendere disponibile il server MCP, il turno fallisce
prima dell'avvio del thread.

Dopo aver modificato la configurazione di Computer Use, usa `/new` o `/reset` nella chat interessata
prima di testare se un thread Codex esistente è già stato avviato.

All'avvio stdio gestito su macOS, OpenClaw preferisce il bundle dell'app desktop Codex
firmato in `/Applications/Codex.app/Contents/Resources/codex` quando esiste.
Questo mantiene Computer Use sotto il bundle dell'app che possiede le autorizzazioni locali di controllo
desktop. Se l'app desktop non è installata, OpenClaw ripiega sul binario
Codex gestito installato accanto al Plugin. Se un'app desktop installata
si inizializza con una versione app-server non supportata, OpenClaw chiude quel processo figlio
e riprova il successivo candidato binario gestito invece di lasciare che un'app desktop
obsoleta oscuri il fallback locale del Plugin. La configurazione esplicita `appServer.command`
o `OPENCLAW_CODEX_APP_SERVER_BIN` continua a sovrascrivere questa selezione gestita.

## Comandi

Usa i comandi `/codex computer-use` da qualsiasi superficie di chat in cui la superficie dei comandi del Plugin
`codex` è disponibile. Questi sono comandi chat/runtime di OpenClaw,
non sottocomandi CLI `openclaw codex ...`:

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` è di sola lettura. Non aggiunge sorgenti marketplace, non installa Plugin né
abilita il supporto ai Plugin di Codex. Se nessuna configurazione attiva Computer Use, `status` può
segnalare disabilitato anche dopo un comando di installazione una tantum.

`install` abilita il supporto ai Plugin di Codex app-server, aggiunge opzionalmente una
sorgente marketplace configurata, installa o riabilita il Plugin configurato tramite Codex
app-server, ricarica i server MCP e verifica che il server MCP esponga strumenti.
Poiché l'installazione modifica risorse host attendibili, solo un proprietario o un client Gateway
`operator.admin` può eseguire `install`. Altri mittenti autorizzati possono
continuare a usare il comando di sola lettura `status`, anche con override.

## Scelte del marketplace

OpenClaw usa la stessa API app-server esposta da Codex. I campi
marketplace scelgono dove Codex deve trovare `computer-use`.

| Campo                | Usalo quando                                                        | Supporto all'installazione                                          |
| -------------------- | --------------------------------------------------------------- | -------------------------------------------------------- |
| Nessun campo marketplace | Vuoi che Codex app-server usi i marketplace che già conosce. | Sì, quando app-server restituisce un marketplace locale.        |
| `marketplaceSource`  | Hai una sorgente marketplace Codex che app-server può aggiungere.         | Sì, per `/codex computer-use install` esplicito.         |
| `marketplacePath`    | Conosci già il percorso del file marketplace locale sull'host.   | Sì, per installazione esplicita e installazione automatica all'avvio del turno.   |
| `marketplaceName`    | Vuoi selezionare un marketplace già registrato per nome.  | Sì solo quando il marketplace selezionato ha un percorso locale. |

Le home Codex nuove possono richiedere un breve momento per inizializzare i loro marketplace ufficiali.
Durante l'installazione, OpenClaw interroga `plugin/list` per un massimo di
`marketplaceDiscoveryTimeoutMs` millisecondi. Il valore predefinito è 60 secondi.

Se più marketplace noti contengono Computer Use, OpenClaw preferisce
`openai-bundled`, poi `openai-curated`, poi `local`. Le corrispondenze ambigue sconosciute
falliscono in modo chiuso e chiedono di impostare `marketplaceName` o `marketplacePath`.

## Marketplace macOS incluso

Le build desktop Codex recenti includono Computer Use qui:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

Quando `computerUse.autoInstall` è true e non è registrato alcun marketplace contenente
`computer-use`, OpenClaw prova ad aggiungere automaticamente la radice del marketplace incluso
standard:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Puoi anche registrarla esplicitamente da una shell con Codex:

```bash
codex plugin marketplace add /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Se usi un percorso app Codex non standard, esegui una volta `/codex computer-use install
--source <marketplace-root>` oppure imposta `computerUse.marketplacePath` su un
percorso file marketplace locale. Usa `--marketplace-path` solo quando hai il
percorso del file JSON del marketplace, non la radice del marketplace incluso.

## Limite del catalogo remoto

Codex app-server può elencare e leggere voci di catalogo solo remote, ma attualmente non
supporta `plugin/install` remoto. Questo significa che `marketplaceName` può
selezionare un marketplace solo remoto per controlli di stato, ma installazioni e riabilitazioni
richiedono comunque un marketplace locale tramite `marketplaceSource` o `marketplacePath`.

Se lo stato dice che il Plugin è disponibile in un marketplace Codex remoto ma l'installazione
remota non è supportata, esegui l'installazione con una sorgente o un percorso locale:

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## Riferimento di configurazione

| Campo                           | Predefinito        | Significato                                                                        |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------ |
| `enabled`                       | dedotto       | Richiede Computer Use. Il valore predefinito è true quando è impostato un altro campo Computer Use. |
| `autoInstall`                   | false          | Installa o riabilita dai marketplace già individuati all'avvio del turno.       |
| `marketplaceDiscoveryTimeoutMs` | 60000          | Per quanto tempo l'installazione attende l'individuazione dei marketplace di Codex app-server.             |
| `marketplaceSource`             | non impostato          | Stringa sorgente passata a Codex app-server `marketplace/add`.                    |
| `marketplacePath`               | non impostato          | Percorso file marketplace Codex locale contenente il Plugin.                       |
| `marketplaceName`               | non impostato          | Nome marketplace Codex registrato da selezionare.                                   |
| `pluginName`                    | `computer-use` | Nome del Plugin marketplace Codex.                                                 |
| `mcpServerName`                 | `computer-use` | Nome del server MCP esposto dal Plugin installato.                               |

L'installazione automatica all'avvio del turno rifiuta intenzionalmente i valori `marketplaceSource`
configurati. Aggiungere una nuova sorgente è un'operazione di configurazione esplicita, quindi usa
`/codex computer-use install --source <marketplace-source>` una volta, poi lascia che
`autoInstall` gestisca le riabilitazioni future dai marketplace locali individuati.
L'installazione automatica all'avvio del turno può usare un `marketplacePath` configurato, perché è
già un percorso locale sull'host.

## Cosa controlla OpenClaw

OpenClaw segnala internamente un motivo di configurazione stabile e formatta lo stato rivolto all'utente
per la chat:

| Motivo                       | Significato                                           | Passaggio successivo                          |
| ---------------------------- | ----------------------------------------------------- | --------------------------------------------- |
| `disabled`                   | `computerUse.enabled` risolto a false.                | Imposta `enabled` o un altro campo Computer Use. |
| `marketplace_missing`        | Nessun marketplace corrispondente era disponibile.    | Configura origine, percorso o nome del marketplace. |
| `plugin_not_installed`       | Il marketplace esiste, ma il Plugin non è installato. | Esegui l'installazione o abilita `autoInstall`. |
| `plugin_disabled`            | Il Plugin è installato ma disabilitato nella configurazione di Codex. | Esegui l'installazione per riabilitarlo. |
| `remote_install_unsupported` | Il marketplace selezionato è solo remoto.             | Usa `marketplaceSource` o `marketplacePath`. |
| `mcp_missing`                | Il Plugin è abilitato, ma il server MCP non è disponibile. | Controlla Codex Computer Use e i permessi del sistema operativo. |
| `ready`                      | Il Plugin e gli strumenti MCP sono disponibili.       | Avvia il turno in modalità Codex.             |
| `check_failed`               | Una richiesta al server dell'app Codex non è riuscita durante il controllo dello stato. | Controlla la connettività e i log del server dell'app. |
| `auto_install_blocked`       | La configurazione all'avvio del turno dovrebbe aggiungere una nuova origine. | Esegui prima un'installazione esplicita. |

L'output della chat include lo stato del Plugin, lo stato del server MCP, il marketplace, gli strumenti
quando disponibili e il messaggio specifico per il passaggio di configurazione non riuscito.

## Permessi macOS

Computer Use è specifico di macOS. Il server MCP gestito da Codex potrebbe richiedere
permessi locali del sistema operativo prima di poter ispezionare o controllare le app. Se OpenClaw dice che Computer Use
è installato ma il server MCP non è disponibile, verifica prima la configurazione di Computer
Use lato Codex:

- Il server dell'app Codex è in esecuzione sullo stesso host in cui dovrebbe
  avvenire il controllo del desktop.
- Il Plugin Computer Use è abilitato nella configurazione di Codex.
- Il server MCP `computer-use` appare nello stato MCP del server dell'app Codex.
- macOS ha concesso i permessi richiesti per l'app di controllo del desktop.
- La sessione host corrente può accedere al desktop controllato.

OpenClaw fallisce intenzionalmente in modo chiuso quando `computerUse.enabled` è true. Un
turno in modalità Codex non dovrebbe procedere silenziosamente senza gli strumenti desktop nativi
richiesti dalla configurazione.

## Risoluzione dei problemi

**Lo stato dice che non è installato.** Esegui `/codex computer-use install`. Se il
marketplace non viene rilevato, passa `--source` o `--marketplace-path`.

**Lo stato dice che è installato ma disabilitato.** Esegui di nuovo `/codex computer-use install`.
L'installazione del server dell'app Codex riscrive la configurazione del Plugin come abilitata.

**Lo stato dice che l'installazione remota non è supportata.** Usa un'origine o
un percorso di marketplace locale. Le voci del catalogo solo remoto possono essere ispezionate ma non installate tramite l'attuale API del server dell'app.

**Lo stato dice che il server MCP non è disponibile.** Riesegui l'installazione una volta in modo che i server MCP
si ricarichino. Se rimane non disponibile, correggi l'app Codex Computer Use,
lo stato MCP del server dell'app Codex o i permessi macOS.

**Lo stato o una sonda va in timeout su `computer-use.list_apps`.** Il Plugin e il server MCP
sono presenti, ma il bridge locale di Computer Use non ha risposto. Chiudi o
riavvia Codex Computer Use, riavvia Codex Desktop se necessario, quindi riprova in una
nuova sessione OpenClaw. Se l'host aveva precedentemente eseguito Computer Use tramite un server dell'app Codex gestito
più vecchio, aggiorna il Plugin installato dal marketplace integrato nel desktop:

```text
/codex computer-use install --source /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

**Uno strumento Computer Use dice `Native hook relay unavailable`.** L'hook dello strumento nativo di Codex
non è riuscito a raggiungere un relay OpenClaw attivo tramite il bridge locale o
il fallback Gateway. Avvia una nuova sessione OpenClaw con `/new` o `/reset`. Se
funziona una volta e poi fallisce di nuovo in una chiamata successiva allo strumento, `/new` sta solo cancellando il
tentativo corrente; riavvia il server dell'app Codex o OpenClaw Gateway in modo che i vecchi thread
e le registrazioni degli hook vengano eliminati, quindi riprova in una nuova sessione.

**L'installazione automatica all'avvio del turno rifiuta un'origine.** È intenzionale. Aggiungi prima
l'origine con `/codex computer-use install --source <marketplace-source>` esplicito,
poi le future installazioni automatiche all'avvio del turno potranno usare il
marketplace locale rilevato.

## Correlati

- [Harness Codex](/it/plugins/codex-harness)
- [Bridge Peekaboo](/it/platforms/mac/peekaboo)
- [App iOS](/it/platforms/ios)
