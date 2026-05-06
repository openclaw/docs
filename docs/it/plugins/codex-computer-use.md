---
read_when:
    - Vuoi che gli agenti OpenClaw in modalità Codex utilizzino Codex Computer Use
    - Stai scegliendo tra Codex Computer Use, PeekabooBridge e l'uso diretto di cua-driver MCP
    - Stai scegliendo tra Codex Computer Use e una configurazione MCP diretta con cua-driver
    - Stai configurando computerUse per il Plugin Codex incluso
    - Stai risolvendo problemi relativi allo stato o all'installazione di /codex computer-use
summary: Configura Codex Computer Use per gli agenti OpenClaw in modalità Codex
title: Uso del computer con Codex
x-i18n:
    generated_at: "2026-05-06T09:02:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0d23cd0646336e61c77357f769bc1d7ab47a401bcc484f4d16130b942db9f1f4
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use è un plugin MCP nativo di Codex per il controllo del desktop locale. OpenClaw
non include l'app desktop, non esegue direttamente azioni sul desktop né aggira
i permessi di Codex. Il Plugin `codex` incluso prepara solo Codex app-server:
abilita il supporto ai Plugin di Codex, trova o installa il Plugin Codex
Computer Use configurato, verifica che il server MCP `computer-use` sia disponibile e
poi lascia che Codex gestisca le chiamate agli strumenti MCP nativi durante i turni in modalità Codex.

Usa questa pagina quando OpenClaw sta già usando l'harness nativo di Codex. Per la
configurazione del runtime stesso, consulta [Codex harness](/it/plugins/codex-harness).

## OpenClaw.app e Peekaboo

L'integrazione Peekaboo di OpenClaw.app è separata da Codex Computer Use. L'app
macOS può ospitare un socket PeekabooBridge in modo che la CLI `peekaboo` possa riutilizzare
le autorizzazioni locali di Accessibilità e Registrazione schermo dell'app per gli strumenti di
automazione propri di Peekaboo. Quel bridge non installa né fa da proxy a Codex Computer Use, e
Codex Computer Use non passa attraverso il socket PeekabooBridge.

Usa [Peekaboo bridge](/it/platforms/mac/peekaboo) quando vuoi che OpenClaw.app sia
un host consapevole dei permessi per l'automazione CLI di Peekaboo. Usa questa pagina quando un
agente OpenClaw in modalità Codex deve avere disponibile il Plugin MCP nativo
`computer-use` di Codex prima dell'inizio del turno.

## App iOS

L'app iOS è separata da Codex Computer Use. Non installa né fa da proxy
al server MCP `computer-use` di Codex e non è un backend di controllo desktop.
Invece, l'app iOS si connette come nodo OpenClaw ed espone le capacità mobili
tramite comandi del nodo come `canvas.*`, `camera.*`, `screen.*`,
`location.*` e `talk.*`.

Usa [iOS](/it/platforms/ios) quando vuoi che un agente controlli un nodo iPhone tramite
il Gateway. Usa questa pagina quando un agente in modalità Codex deve controllare il desktop
macOS locale tramite il Plugin Computer Use nativo di Codex.

## MCP cua-driver diretto

Codex Computer Use non è l'unico modo per esporre il controllo desktop. Se vuoi che
i runtime gestiti da OpenClaw chiamino direttamente il driver di TryCua, usa il server
`cua-driver mcp` upstream tramite il registro MCP di OpenClaw invece del
flusso di marketplace specifico di Codex.

Dopo aver installato `cua-driver`, chiedigli il comando OpenClaw:

```bash
cua-driver mcp-config --client openclaw
```

oppure registra tu stesso il server stdio:

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

Questo percorso mantiene intatta la superficie degli strumenti MCP upstream, inclusi gli schemi
del driver e le risposte MCP strutturate. Usalo quando vuoi che il driver CUA
sia disponibile come normale server MCP OpenClaw. Usa la configurazione Codex Computer Use in
questa pagina quando Codex app-server deve gestire installazione dei Plugin, ricaricamenti MCP
e chiamate agli strumenti nativi all'interno dei turni in modalità Codex.

Il driver di CUA è specifico per macOS e richiede comunque le autorizzazioni macOS locali
richieste dalla sua app, come Accessibilità e Registrazione schermo. OpenClaw
non installa `cua-driver`, non concede tali autorizzazioni né aggira il modello di sicurezza
del driver upstream.

## Configurazione rapida

Imposta `plugins.entries.codex.config.computerUse` quando i turni in modalità Codex devono avere
Computer Use disponibile prima dell'avvio di un thread:

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

Con questa configurazione, OpenClaw controlla Codex app-server prima di ogni turno in modalità Codex.
Se Computer Use manca ma Codex app-server ha già individuato un
marketplace installabile, OpenClaw chiede a Codex app-server di installare o riabilitare
il Plugin e ricaricare i server MCP. Su macOS, quando non è registrato alcun marketplace
corrispondente ed esiste il bundle standard dell'app Codex, OpenClaw prova anche a
registrare il marketplace Codex incluso da
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` prima di
fallire. Se la configurazione continua a non riuscire a rendere disponibile il server MCP, il turno fallisce
prima dell'avvio del thread.

Le sessioni esistenti mantengono il loro runtime e l'associazione al thread Codex. Dopo aver modificato
`agentRuntime` o la configurazione di Computer Use, usa `/new` o `/reset` nella chat interessata
prima di testare.

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

`status` è di sola lettura. Non aggiunge fonti di marketplace, non installa Plugin né
abilita il supporto ai Plugin di Codex.

`install` abilita il supporto ai Plugin di Codex app-server, aggiunge facoltativamente una fonte
di marketplace configurata, installa o riabilita il Plugin configurato tramite Codex
app-server, ricarica i server MCP e verifica che il server MCP esponga strumenti.

## Scelte di marketplace

OpenClaw usa la stessa API app-server esposta da Codex. I campi
del marketplace scelgono dove Codex deve trovare `computer-use`.

| Campo                | Da usare quando                                                        | Supporto installazione                                          |
| -------------------- | --------------------------------------------------------------- | -------------------------------------------------------- |
| Nessun campo marketplace | Vuoi che Codex app-server usi i marketplace che già conosce. | Sì, quando app-server restituisce un marketplace locale.        |
| `marketplaceSource`  | Hai una fonte di marketplace Codex che app-server può aggiungere.         | Sì, per `/codex computer-use install` esplicito.         |
| `marketplacePath`    | Conosci già il percorso file del marketplace locale sull'host.   | Sì, per l'installazione esplicita e l'installazione automatica all'avvio del turno.   |
| `marketplaceName`    | Vuoi selezionare un marketplace già registrato per nome.  | Sì solo quando il marketplace selezionato ha un percorso locale. |

Le home Codex appena create potrebbero richiedere un breve momento per inizializzare i marketplace ufficiali.
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
`computer-use`, OpenClaw prova ad aggiungere automaticamente la radice standard del marketplace
incluso:

```text
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Puoi anche registrarla esplicitamente da una shell con Codex:

```bash
codex plugin marketplace add /Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Se usi un percorso non standard dell'app Codex, imposta `computerUse.marketplacePath` su un
percorso file di marketplace locale o esegui `/codex computer-use install --source
<marketplace-source>` una volta.

## Limite del catalogo remoto

Codex app-server può elencare e leggere voci di catalogo solo remote, ma attualmente non
supporta `plugin/install` remoto. Questo significa che `marketplaceName` può
selezionare un marketplace solo remoto per i controlli di stato, ma installazioni e riabilitazioni
hanno comunque bisogno di un marketplace locale tramite `marketplaceSource` o `marketplacePath`.

Se lo stato indica che il Plugin è disponibile in un marketplace Codex remoto ma l'installazione
remota non è supportata, esegui l'installazione con una fonte o un percorso locale:

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## Riferimento configurazione

| Campo                           | Predefinito        | Significato                                                                        |
| ------------------------------- | -------------- | ------------------------------------------------------------------------------ |
| `enabled`                       | dedotto       | Richiede Computer Use. Il valore predefinito è true quando è impostato un altro campo Computer Use. |
| `autoInstall`                   | false          | Installa o riabilita dai marketplace già scoperti all'avvio del turno.       |
| `marketplaceDiscoveryTimeoutMs` | 60000          | Quanto tempo l'installazione attende la scoperta dei marketplace da parte di Codex app-server.             |
| `marketplaceSource`             | non impostato          | Stringa sorgente passata a `marketplace/add` di Codex app-server.                    |
| `marketplacePath`               | non impostato          | Percorso file del marketplace Codex locale contenente il Plugin.                       |
| `marketplaceName`               | non impostato          | Nome del marketplace Codex registrato da selezionare.                                   |
| `pluginName`                    | `computer-use` | Nome del Plugin marketplace Codex.                                                 |
| `mcpServerName`                 | `computer-use` | Nome del server MCP esposto dal Plugin installato.                               |

L'installazione automatica all'avvio del turno rifiuta intenzionalmente i valori `marketplaceSource`
configurati. Aggiungere una nuova fonte è un'operazione di configurazione esplicita, quindi usa
`/codex computer-use install --source <marketplace-source>` una volta, poi lascia che
`autoInstall` gestisca le riabilitazioni future dai marketplace locali scoperti.
L'installazione automatica all'avvio del turno può usare un `marketplacePath` configurato, perché quello è
già un percorso locale sull'host.

## Cosa controlla OpenClaw

OpenClaw segnala internamente un motivo di configurazione stabile e formatta lo stato rivolto all'utente
per la chat:

| Motivo                       | Significato                                                | Passo successivo                                     |
| ---------------------------- | ------------------------------------------------------ | --------------------------------------------- |
| `disabled`                   | `computerUse.enabled` si è risolto in false.               | Imposta `enabled` o un altro campo Computer Use.  |
| `marketplace_missing`        | Non era disponibile alcun marketplace corrispondente.                 | Configura fonte, percorso o nome del marketplace.  |
| `plugin_not_installed`       | Il marketplace esiste, ma il Plugin non è installato.   | Esegui l'installazione o abilita `autoInstall`.          |
| `plugin_disabled`            | Il Plugin è installato ma disabilitato nella configurazione Codex.      | Esegui l'installazione per riabilitarlo.                  |
| `remote_install_unsupported` | Il marketplace selezionato è solo remoto.                   | Usa `marketplaceSource` o `marketplacePath`. |
| `mcp_missing`                | Il Plugin è abilitato, ma il server MCP non è disponibile.  | Controlla Codex Computer Use e i permessi del sistema operativo.  |
| `ready`                      | Il Plugin e gli strumenti MCP sono disponibili.                    | Avvia il turno in modalità Codex.                    |
| `check_failed`               | Una richiesta a Codex app-server è fallita durante il controllo dello stato. | Controlla connettività e log di app-server.       |
| `auto_install_blocked`       | La configurazione all'avvio del turno dovrebbe aggiungere una nuova fonte.       | Esegui prima l'installazione esplicita.                   |

L'output della chat include lo stato del Plugin, lo stato del server MCP, il marketplace, gli strumenti
quando disponibili e il messaggio specifico per il passaggio di configurazione non riuscito.

## Permessi macOS

Computer Use è specifico per macOS. Il server MCP gestito da Codex potrebbe richiedere
permessi locali del sistema operativo prima di poter ispezionare o controllare le app. Se OpenClaw dice che Computer Use
è installato ma il server MCP non è disponibile, verifica prima la configurazione di Computer
Use lato Codex:

- Codex app-server è in esecuzione sullo stesso host in cui deve avvenire il
  controllo del desktop.
- Il Plugin Computer Use è abilitato nella configurazione di Codex.
- Il server MCP `computer-use` appare nello stato MCP di Codex app-server.
- macOS ha concesso le autorizzazioni richieste per l'app di controllo del desktop.
- La sessione host corrente può accedere al desktop controllato.

OpenClaw intenzionalmente fallisce in modo chiuso quando `computerUse.enabled` è true. Un
turno in modalità Codex non deve procedere silenziosamente senza gli strumenti nativi per il desktop
richiesti dalla configurazione.

## Risoluzione dei problemi

**Lo stato indica non installato.** Esegui `/codex computer-use install`. Se il
marketplace non viene rilevato, passa `--source` o `--marketplace-path`.

**Lo stato indica installato ma disabilitato.** Esegui di nuovo `/codex computer-use install`.
L'installazione di Codex app-server riscrive la configurazione del Plugin come abilitata.

**Lo stato indica che l'installazione remota non è supportata.** Usa una sorgente o un
percorso marketplace locale. Le voci del catalogo solo remoto possono essere ispezionate ma non installate tramite l'
attuale API app-server.

**Lo stato indica che il server MCP non è disponibile.** Riesegui l'installazione una volta in modo che i server MCP
vengano ricaricati. Se rimane non disponibile, correggi l'app Codex Computer Use,
lo stato MCP di Codex app-server o le autorizzazioni di macOS.

**Lo stato o un probe va in timeout su `computer-use.list_apps`.** Il Plugin e il server MCP
sono presenti, ma il bridge locale Computer Use non ha risposto. Esci da
Codex Computer Use o riavvialo, rilancia Codex Desktop se necessario, quindi riprova in una
nuova sessione OpenClaw.

**Uno strumento Computer Use indica `Native hook relay unavailable`.** L'hook tool nativo di Codex
non è riuscito a raggiungere un relay OpenClaw attivo tramite il bridge locale o il fallback del
Gateway. Avvia una nuova sessione OpenClaw con `/new` o `/reset`. Se il problema
continua, riavvia il gateway in modo che i vecchi thread app-server e le registrazioni degli hook
vengano eliminati, quindi riprova.

**L'installazione automatica all'avvio del turno rifiuta una sorgente.** È intenzionale. Aggiungi prima la
sorgente con `/codex computer-use install --source <marketplace-source>` esplicito,
poi le future installazioni automatiche all'avvio del turno potranno usare il marketplace locale
rilevato.

## Correlati

- [Harness Codex](/it/plugins/codex-harness)
- [Bridge Peekaboo](/it/platforms/mac/peekaboo)
- [App iOS](/it/platforms/ios)
