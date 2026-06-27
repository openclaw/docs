---
read_when:
    - Vuoi che gli agenti OpenClaw in modalità Codex usino Codex Computer Use
    - Stai scegliendo tra Codex Computer Use, PeekabooBridge e MCP cua-driver diretto
    - Stai scegliendo tra Codex Computer Use e una configurazione MCP diretta con cua-driver
    - Stai configurando computerUse per il Plugin Codex incluso
    - Stai risolvendo problemi relativi allo stato o all'installazione dell'uso del computer di /codex
summary: Configura Codex Computer Use per gli agenti OpenClaw in modalità Codex
title: Uso del computer di Codex
x-i18n:
    generated_at: "2026-06-27T17:47:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6a595b8ae261c1cc9a1469217a31279cd3a116b0f11c16813ea018aab76b8c0d
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use è un plugin MCP nativo di Codex per il controllo del desktop locale. OpenClaw
non incorpora l'app desktop, non esegue direttamente azioni sul desktop e non aggira
le autorizzazioni di Codex. Il Plugin `codex` incluso prepara soltanto l'app-server di Codex:
abilita il supporto ai Plugin di Codex, trova o installa il Plugin Codex
Computer Use configurato, verifica che il server MCP `computer-use` sia disponibile e
poi lascia a Codex la gestione delle chiamate native agli strumenti MCP durante i turni in modalità Codex.

Usa questa pagina quando OpenClaw sta già usando l'harness nativo di Codex. Per la
configurazione del runtime stesso, vedi [harness Codex](/it/plugins/codex-harness).

## OpenClaw.app e Peekaboo

L'integrazione Peekaboo di OpenClaw.app è separata da Codex Computer Use. L'app
macOS può ospitare un socket PeekabooBridge in modo che la CLI `peekaboo` possa riutilizzare le
autorizzazioni locali di Accessibilità e Registrazione schermo dell'app per gli strumenti di
automazione propri di Peekaboo. Quel bridge non installa né fa da proxy a Codex Computer Use, e
Codex Computer Use non passa attraverso il socket PeekabooBridge.

Usa [bridge Peekaboo](/it/platforms/mac/peekaboo) quando vuoi che OpenClaw.app sia
un host consapevole delle autorizzazioni per l'automazione della CLI Peekaboo. Usa questa pagina quando un
agente OpenClaw in modalità Codex deve avere disponibile il Plugin MCP nativo
`computer-use` di Codex prima dell'inizio del turno.

## App iOS

L'app iOS è separata da Codex Computer Use. Non installa né fa da proxy al
server MCP `computer-use` di Codex e non è un backend di controllo desktop.
Invece, l'app iOS si connette come nodo OpenClaw ed espone capacità mobili
tramite comandi del nodo come `canvas.*`, `camera.*`, `screen.*`,
`location.*` e `talk.*`.

Usa [iOS](/it/platforms/ios) quando vuoi che un agente controlli un nodo iPhone tramite
il Gateway. Usa questa pagina quando un agente in modalità Codex deve controllare il
desktop macOS locale tramite il Plugin nativo Computer Use di Codex.

## MCP cua-driver diretto

Codex Computer Use non è l'unico modo per esporre il controllo desktop. Se vuoi che
i runtime gestiti da OpenClaw chiamino direttamente il driver di TryCua, usa il server
`cua-driver mcp` upstream tramite il registro MCP di OpenClaw invece del
flusso marketplace specifico di Codex.

Dopo aver installato `cua-driver`, chiedigli il comando OpenClaw:

```bash
cua-driver mcp-config --client openclaw
```

oppure registra tu stesso il server stdio:

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

Questo percorso mantiene intatta la superficie degli strumenti MCP upstream, inclusi gli schemi del driver
e le risposte MCP strutturate. Usalo quando vuoi rendere disponibile il driver CUA
come normale server MCP di OpenClaw. Usa la configurazione di Codex Computer Use in
questa pagina quando l'app-server di Codex deve gestire installazione del Plugin, ricaricamenti MCP
e chiamate agli strumenti nativi all'interno dei turni in modalità Codex.

Il driver di CUA è specifico per macOS e richiede comunque le autorizzazioni locali di macOS
richieste dalla sua app, come Accessibilità e Registrazione schermo. OpenClaw
non installa `cua-driver`, non concede tali autorizzazioni e non aggira il modello di sicurezza
del driver upstream.

## Configurazione rapida

Imposta `plugins.entries.codex.config.computerUse` quando i turni in modalità Codex devono avere
Computer Use disponibile prima che inizi un thread. `autoInstall: true` abilita
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

Con questa configurazione, OpenClaw controlla l'app-server di Codex prima di ogni turno in modalità Codex.
Se Computer Use manca ma l'app-server di Codex ha già scoperto un
marketplace installabile, OpenClaw chiede all'app-server di Codex di installare o riabilitare
il Plugin e ricaricare i server MCP. Su macOS, quando non è registrato alcun marketplace
corrispondente e l'app bundle standard di Codex esiste, OpenClaw prova anche a
registrare il marketplace Codex incluso da
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` prima di
fallire. Se la configurazione non riesce ancora a rendere disponibile il server MCP, il turno fallisce
prima che inizi il thread.

Dopo aver modificato la configurazione di Computer Use, usa `/new` o `/reset` nella chat interessata
prima di testare, se un thread Codex esistente è già iniziato.

All'avvio stdio gestito su macOS, OpenClaw preferisce l'app bundle desktop Codex firmato
in `/Applications/Codex.app/Contents/Resources/codex` quando esiste.
Questo mantiene Computer Use sotto l'app bundle che possiede le autorizzazioni locali di
controllo desktop. Se l'app desktop non è installata, OpenClaw ripiega sul
binario Codex gestito installato accanto al Plugin. Se un'app desktop installata
si inizializza con una versione di app-server non supportata, OpenClaw chiude quel processo figlio
e ritenta il candidato binario gestito successivo invece di lasciare che un'app desktop
obsoleta oscuri il fallback locale del Plugin. La configurazione esplicita di `appServer.command`
o `OPENCLAW_CODEX_APP_SERVER_BIN` continua a prevalere su questa selezione
gestita.

## Comandi

Usa i comandi `/codex computer-use` da qualsiasi superficie di chat in cui la superficie di comandi del Plugin
`codex` è disponibile. Questi sono comandi di chat/runtime di OpenClaw,
non sottocomandi CLI `openclaw codex ...`:

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` è in sola lettura. Non aggiunge origini marketplace, non installa Plugin e non
abilita il supporto ai Plugin di Codex. Se nessuna configurazione abilita Computer Use,
`status` può riportarlo come disabilitato anche dopo un comando di installazione una tantum.

`install` abilita il supporto ai Plugin nell'app-server di Codex, aggiunge opzionalmente un'origine
marketplace configurata, installa o riabilita il Plugin configurato tramite l'app-server di Codex,
ricarica i server MCP e verifica che il server MCP esponga strumenti.

## Scelte del marketplace

OpenClaw usa la stessa API dell'app-server esposta da Codex stesso. I campi
marketplace scelgono dove Codex deve trovare `computer-use`.

| Campo                | Da usare quando                                                        | Supporto all'installazione                                          |
| -------------------- | --------------------------------------------------------------- | -------------------------------------------------------- |
| Nessun campo marketplace | Vuoi che l'app-server di Codex usi i marketplace che conosce già. | Sì, quando l'app-server restituisce un marketplace locale.        |
| `marketplaceSource`  | Hai un'origine marketplace Codex che l'app-server può aggiungere.         | Sì, per `/codex computer-use install` esplicito.         |
| `marketplacePath`    | Conosci già il percorso del file marketplace locale sull'host.   | Sì, per installazione esplicita e installazione automatica all'inizio del turno.   |
| `marketplaceName`    | Vuoi selezionare per nome un marketplace già registrato.  | Sì, solo quando il marketplace selezionato ha un percorso locale. |

Le home Codex nuove possono richiedere un breve momento per popolare i marketplace ufficiali.
Durante l'installazione, OpenClaw interroga `plugin/list` per un massimo di
`marketplaceDiscoveryTimeoutMs` millisecondi. Il valore predefinito è 60 secondi.

Se più marketplace noti contengono Computer Use, OpenClaw preferisce
`openai-bundled`, poi `openai-curated`, poi `local`. Le corrispondenze ambigue sconosciute
falliscono in modo chiuso e chiedono di impostare `marketplaceName` o `marketplacePath`.

## Marketplace macOS incluso

Le build desktop recenti di Codex includono Computer Use qui:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

Quando `computerUse.autoInstall` è true e non è registrato alcun marketplace contenente
`computer-use`, OpenClaw prova ad aggiungere automaticamente la radice del marketplace incluso
standard:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Puoi anche registrarlo esplicitamente da una shell con Codex:

```bash
codex plugin marketplace add /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Se usi un percorso non standard per l'app Codex, esegui una volta `/codex computer-use install
--source <marketplace-root>` oppure imposta `computerUse.marketplacePath` su un
percorso di file marketplace locale. Usa `--marketplace-path` solo quando hai il
percorso del file JSON del marketplace, non la radice del marketplace incluso.

## Limite del catalogo remoto

L'app-server di Codex può elencare e leggere voci di catalogo solo remote, ma al momento non
supporta `plugin/install` remoto. Questo significa che `marketplaceName` può
selezionare un marketplace solo remoto per i controlli di stato, ma installazioni e riabilitazioni
richiedono comunque un marketplace locale tramite `marketplaceSource` o `marketplacePath`.

Se lo stato dice che il Plugin è disponibile in un marketplace Codex remoto ma l'installazione
remota non è supportata, esegui l'installazione con un'origine o un percorso locale:

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## Riferimento di configurazione

| Campo                           | Predefinito        | Significato                                                                        |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------ |
| `enabled`                       | dedotto       | Richiede Computer Use. Il valore predefinito è true quando è impostato un altro campo Computer Use. |
| `autoInstall`                   | false          | Installa o riabilita dai marketplace già scoperti all'inizio del turno.       |
| `marketplaceDiscoveryTimeoutMs` | 60000          | Per quanto tempo l'installazione attende la scoperta dei marketplace da parte dell'app-server di Codex.             |
| `marketplaceSource`             | non impostato          | Stringa di origine passata a `marketplace/add` dell'app-server di Codex.                    |
| `marketplacePath`               | non impostato          | Percorso del file marketplace locale di Codex contenente il Plugin.                       |
| `marketplaceName`               | non impostato          | Nome del marketplace Codex registrato da selezionare.                                   |
| `pluginName`                    | `computer-use` | Nome del Plugin marketplace Codex.                                                 |
| `mcpServerName`                 | `computer-use` | Nome del server MCP esposto dal Plugin installato.                               |

L'installazione automatica all'inizio del turno rifiuta intenzionalmente i valori configurati di `marketplaceSource`.
Aggiungere una nuova origine è un'operazione di configurazione esplicita, quindi usa
`/codex computer-use install --source <marketplace-source>` una volta, poi lascia che
`autoInstall` gestisca le future riabilitazioni dai marketplace locali scoperti.
L'installazione automatica all'inizio del turno può usare un `marketplacePath` configurato, perché è
già un percorso locale sull'host.

## Cosa controlla OpenClaw

OpenClaw riporta internamente un motivo di configurazione stabile e formatta lo stato
visibile all'utente per la chat:

| Motivo                       | Significato                                            | Passaggio successivo                          |
| ---------------------------- | ------------------------------------------------------ | --------------------------------------------- |
| `disabled`                   | `computerUse.enabled` si è risolto in false.           | Imposta `enabled` o un altro campo Computer Use. |
| `marketplace_missing`        | Nessun marketplace corrispondente era disponibile.     | Configura origine, percorso o nome del marketplace. |
| `plugin_not_installed`       | Il marketplace esiste, ma il Plugin non è installato.  | Esegui l'installazione o abilita `autoInstall`. |
| `plugin_disabled`            | Il Plugin è installato ma disabilitato nella configurazione Codex. | Esegui l'installazione per riabilitarlo. |
| `remote_install_unsupported` | Il marketplace selezionato è solo remoto.              | Usa `marketplaceSource` o `marketplacePath`. |
| `mcp_missing`                | Il Plugin è abilitato, ma il server MCP non è disponibile. | Controlla Codex Computer Use e i permessi del sistema operativo. |
| `ready`                      | Il Plugin e gli strumenti MCP sono disponibili.        | Avvia il turno in modalità Codex.             |
| `check_failed`               | Una richiesta al server app Codex è fallita durante il controllo dello stato. | Controlla la connettività e i log del server app. |
| `auto_install_blocked`       | La configurazione all'avvio del turno dovrebbe aggiungere una nuova origine. | Esegui prima un'installazione esplicita.      |

L'output della chat include lo stato del Plugin, lo stato del server MCP, il marketplace, gli strumenti
quando disponibili e il messaggio specifico per il passaggio di configurazione non riuscito.

## Permessi macOS

Computer Use è specifico per macOS. Il server MCP gestito da Codex potrebbe richiedere permessi locali del sistema operativo
prima di poter ispezionare o controllare le app. Se OpenClaw indica che Computer Use
è installato ma il server MCP non è disponibile, verifica prima la configurazione Computer
Use lato Codex:

- Il server app Codex è in esecuzione sullo stesso host in cui dovrebbe avvenire il controllo del desktop.
- Il Plugin Computer Use è abilitato nella configurazione Codex.
- Il server MCP `computer-use` appare nello stato MCP del server app Codex.
- macOS ha concesso i permessi richiesti per l'app di controllo del desktop.
- La sessione host corrente può accedere al desktop controllato.

OpenClaw fallisce intenzionalmente in modo chiuso quando `computerUse.enabled` è true. Un
turno in modalità Codex non dovrebbe proseguire silenziosamente senza gli strumenti desktop nativi
richiesti dalla configurazione.

## Risoluzione dei problemi

**Lo stato indica non installato.** Esegui `/codex computer-use install`. Se il
marketplace non viene rilevato, passa `--source` o `--marketplace-path`.

**Lo stato indica installato ma disabilitato.** Esegui di nuovo `/codex computer-use install`.
L'installazione del server app Codex riscrive la configurazione del Plugin come abilitata.

**Lo stato indica che l'installazione remota non è supportata.** Usa un'origine o
un percorso di marketplace locale. Le voci di catalogo solo remote possono essere ispezionate ma non installate tramite l'attuale API del server app.

**Lo stato indica che il server MCP non è disponibile.** Riesegui l'installazione una volta, così i server MCP
si ricaricano. Se resta non disponibile, correggi l'app Codex Computer Use,
lo stato MCP del server app Codex o i permessi macOS.

**Lo stato o un probe va in timeout su `computer-use.list_apps`.** Il Plugin e il server MCP
sono presenti, ma il bridge locale Computer Use non ha risposto. Esci o
riavvia Codex Computer Use, rilancia Codex Desktop se necessario, quindi riprova in una
nuova sessione OpenClaw. Se l'host in precedenza eseguiva Computer Use tramite un vecchio
server app Codex gestito, aggiorna il Plugin installato dal marketplace incluso
nel desktop:

```text
/codex computer-use install --source /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

**Uno strumento Computer Use indica `Native hook relay unavailable`.** L'hook dello strumento nativo Codex
non è riuscito a raggiungere un relay OpenClaw attivo tramite il bridge locale o il
fallback Gateway. Avvia una nuova sessione OpenClaw con `/new` o `/reset`. Se funziona
una volta e poi fallisce di nuovo in una chiamata successiva dello strumento, `/new` sta solo cancellando il
tentativo corrente; riavvia il server app Codex o il Gateway OpenClaw in modo che i vecchi thread
e le registrazioni degli hook vengano eliminati, quindi riprova in una nuova sessione.

**L'installazione automatica all'avvio del turno rifiuta un'origine.** È intenzionale. Aggiungi prima
l'origine con `/codex computer-use install --source <marketplace-source>` esplicito,
poi le installazioni automatiche all'avvio dei turni futuri potranno usare il
marketplace locale rilevato.

## Correlati

- [Harness Codex](/it/plugins/codex-harness)
- [Bridge Peekaboo](/it/platforms/mac/peekaboo)
- [App iOS](/it/platforms/ios)
