---
read_when:
    - Vuoi che gli agenti OpenClaw in modalità Codex utilizzino Codex Computer Use
    - Stai scegliendo tra Codex Computer Use, PeekabooBridge e l'MCP cua-driver diretto
    - Stai configurando computerUse per il plugin Codex incluso
    - Stai risolvendo problemi relativi allo stato o all'installazione dell'uso del computer di /codex
summary: Configura Codex Computer Use per gli agenti OpenClaw in modalità Codex
title: Uso del computer con Codex
x-i18n:
    generated_at: "2026-07-12T07:14:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a55ee330c4952c8bcc97c3178a85a67ea3b7964e6880277bd41d2bfc750e3138
    source_path: plugins/codex-computer-use.md
    workflow: 16
---

Computer Use è un plugin MCP nativo di Codex per il controllo del desktop locale. OpenClaw
non incorpora l'app desktop, non esegue direttamente azioni sul desktop e non aggira
le autorizzazioni di Codex. Il plugin `codex` incluso prepara soltanto Codex app-server:
abilita il supporto dei plugin di Codex, individua o installa il plugin Computer Use
configurato, verifica che il server MCP `computer-use` sia disponibile e quindi lascia
a Codex la gestione delle chiamate native agli strumenti MCP durante i turni in modalità Codex.

Usa questa pagina quando OpenClaw utilizza già l'infrastruttura nativa di Codex. Per la
configurazione del runtime, consulta [infrastruttura Codex](/it/plugins/codex-harness).

Questa soluzione è distinta dallo [strumento informatico integrato basato su Node](/it/nodes/computer-use) di OpenClaw. Usa lo strumento integrato quando lo stesso contratto dell'agente deve controllare un Mac associato, indipendentemente dal fatto che l'agente venga eseguito sul Gateway o su un altro nodo. Usa Codex Computer Use quando Codex app-server deve gestire l'installazione MCP locale, le autorizzazioni e le chiamate native agli strumenti.

## OpenClaw.app e Peekaboo

L'integrazione Peekaboo di OpenClaw.app è separata da Codex Computer Use. L'app
macOS può ospitare un socket PeekabooBridge affinché la CLI `peekaboo` possa riutilizzare
le autorizzazioni locali dell'app per Accessibilità e Registrazione schermo per gli strumenti
di automazione propri di Peekaboo. Questo bridge non installa né inoltra Codex Computer Use e
Codex Computer Use non effettua chiamate tramite il socket PeekabooBridge.

Usa [bridge Peekaboo](/it/platforms/mac/peekaboo) quando vuoi che OpenClaw.app sia
un host consapevole delle autorizzazioni per l'automazione tramite la CLI Peekaboo. Usa questa pagina quando un
agente OpenClaw in modalità Codex deve disporre del plugin MCP nativo `computer-use` di Codex
prima dell'inizio del turno.

## App iOS

L'app iOS è separata da Codex Computer Use. Non installa né inoltra
il server MCP `computer-use` di Codex e non è un backend per il controllo del desktop.
L'app iOS si connette invece come nodo OpenClaw ed espone funzionalità
mobili tramite comandi del nodo quali `canvas.*`, `camera.*`, `screen.*`,
`location.*` e `talk.*`.

Usa [iOS](/it/platforms/ios) quando vuoi che un agente controlli un nodo iPhone
tramite il Gateway. Usa questa pagina quando un agente in modalità Codex deve controllare il
desktop macOS locale tramite il plugin Computer Use nativo di Codex.

## MCP diretto di cua-driver

Codex Computer Use non è l'unico modo per rendere disponibile il controllo del desktop. Se vuoi
che i runtime gestiti da OpenClaw chiamino direttamente il driver di TryCua, usa il server
`cua-driver mcp` upstream tramite il registro MCP di OpenClaw, anziché il
flusso del marketplace specifico per Codex.

Dopo aver installato `cua-driver`, chiedigli di generare il comando per OpenClaw:

```bash
cua-driver mcp-config --client openclaw
```

oppure registra direttamente il server stdio:

```bash
openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
```

Questo percorso mantiene intatta la superficie degli strumenti MCP upstream, inclusi gli schemi
del driver e le risposte MCP strutturate. Usalo quando vuoi rendere disponibile il driver CUA
come normale server MCP di OpenClaw. Usa la configurazione di Codex Computer Use descritta in
questa pagina quando Codex app-server deve gestire l'installazione del plugin, i ricaricamenti MCP
e le chiamate native agli strumenti durante i turni in modalità Codex.

Il driver di CUA è specifico per macOS e richiede comunque le autorizzazioni macOS locali
richieste dalla relativa app, come Accessibilità e Registrazione schermo. OpenClaw non
installa `cua-driver`, non concede tali autorizzazioni e non aggira il modello di sicurezza
del driver upstream.

## Configurazione rapida

Imposta `plugins.entries.codex.config.computerUse` quando i turni in modalità Codex devono avere
Computer Use disponibile prima dell'avvio di un thread. `autoInstall: true` abilita
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
      model: "openai/gpt-5.6-sol",
    },
  },
}
```

Con questa configurazione, OpenClaw verifica Codex app-server prima di ogni turno
in modalità Codex. Se Computer Use è assente, ma Codex app-server ha già individuato
un marketplace utilizzabile per l'installazione, OpenClaw chiede a Codex app-server di installare o
riabilitare il plugin e ricaricare i server MCP. Su macOS, quando non è registrato alcun
marketplace corrispondente ed esiste un bundle standard dell'app desktop, OpenClaw
prova inoltre a registrare il marketplace Codex incluso da
`/Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled`, mantenendo
`/Applications/Codex.app/Contents/Resources/plugins/openai-bundled` come
ripiego per le installazioni autonome precedenti. Se la configurazione non riesce comunque a rendere
disponibile il server MCP, il turno non viene avviato e il thread non inizia.

Dopo aver modificato la configurazione di Computer Use, usa `/new` o `/reset` nella chat
interessata prima di eseguire il test, se è già stato avviato un thread Codex.

Su macOS, l'avvio gestito di Computer Use usa preferibilmente il binario dell'app desktop in
`/Applications/ChatGPT.app/Contents/Resources/codex`, quindi ricorre
a `/Applications/Codex.app/Contents/Resources/codex` per le installazioni
autonome precedenti. Ciò vale anche per i comandi occasionali di stato e
installazione di Computer Use che avviano un proprio client. In questo modo, il controllo del desktop
rimane sotto il bundle dell'app che detiene le autorizzazioni macOS locali. Se l'app desktop non è
installata, OpenClaw ricorre al binario Codex gestito installato insieme al
plugin. I normali turni Codex gestiti con la home isolata predefinita dell'agente usano
preferibilmente questo pacchetto bloccato, affinché un'app desktop meno recente non possa prevalere sul supporto
corrente dei modelli. Le home con ambito utente continuano a dare priorità all'app desktop perché possono caricare lo stato
nativo di Computer Use. Anche una home isolata dell'agente la cui configurazione Codex effettiva abilita
Computer Use continua a dare priorità all'app desktop. Una configurazione esplicita di
`appServer.command` o `OPENCLAW_CODEX_APP_SERVER_BIN` continua a prevalere
su questa selezione gestita.

OpenClaw serializza le letture della configurazione nativa di Codex e l'installazione di Computer Use
all'interno di un singolo Gateway in esecuzione. Un processo Codex separato o un altro Gateway non
rientra in questa protezione. Dopo aver modificato la configurazione nativa del plugin Codex al di fuori del
Gateway, riavvia il Gateway e avvia una nuova chat prima di fare affidamento sulla nuova
selezione.

## Comandi

Usa i comandi `/codex computer-use` da qualsiasi superficie di chat in cui sia
disponibile la superficie dei comandi del plugin `codex`. Sono comandi di chat/runtime
di OpenClaw, non sottocomandi CLI `openclaw codex ...`:

```text
/codex computer-use status
/codex computer-use install
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
/codex computer-use install --marketplace <name>
```

`status` è l'azione predefinita ed è di sola lettura: non aggiunge origini del marketplace,
non installa plugin e non abilita il supporto dei plugin di Codex. Se nessuna configurazione abilita
Computer Use, `status` può segnalarlo come disabilitato anche dopo un comando di
installazione occasionale.

`install` abilita il supporto dei plugin di Codex app-server, aggiunge facoltativamente
un'origine del marketplace configurata, installa o riabilita il plugin configurato
tramite Codex app-server, ricarica i server MCP e verifica che il server MCP
esponga gli strumenti. Poiché l'installazione modifica risorse host attendibili,
solo un proprietario o un client Gateway `operator.admin` può eseguire `install`. Gli altri
mittenti autorizzati possono continuare a usare il comando `status` di sola lettura,
anche con sostituzioni.

Le versioni precedenti accettavano sostituzioni occasionali dell'identità tramite `--plugin`, `--server` e `--mcp-server`.
Configura invece in modo persistente `computerUse.pluginName` e
`computerUse.mcpServerName`. Quando viene usato un flag di identità precedente,
il comando identifica l'impostazione esatta da rendere persistente e ripete
l'azione richiesta e gli eventuali flag del marketplace supportati nelle istruzioni per la migrazione.

## Scelte del marketplace

OpenClaw usa la stessa API app-server esposta da Codex. I
campi del marketplace scelgono dove Codex deve trovare `computer-use`.

| Campo                | Quando usarlo                                                        | Supporto per l'installazione                                          |
| -------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Nessun campo marketplace | Vuoi che Codex app-server usi i marketplace che già conosce.     | Sì, quando app-server restituisce un marketplace locale.              |
| `marketplaceSource`  | Disponi di un'origine del marketplace Codex che app-server può aggiungere. | Sì, per `/codex computer-use install` esplicito.                  |
| `marketplacePath`    | Conosci già il percorso locale del file del marketplace sull'host.   | Sì, per l'installazione esplicita e automatica all'avvio del turno.   |
| `marketplaceName`    | Vuoi selezionare per nome un marketplace già registrato.             | Sì, solo quando il marketplace selezionato ha un percorso locale.     |

Le nuove home Codex potrebbero richiedere un breve intervallo per inizializzare i rispettivi
marketplace ufficiali. Durante l'installazione, OpenClaw interroga `plugin/list` per un massimo di
`marketplaceDiscoveryTimeoutMs` millisecondi (valore predefinito: 60 secondi).

Se più marketplace noti contengono Computer Use, OpenClaw preferisce
`openai-bundled`, quindi `openai-curated`, infine `local`. Le corrispondenze ambigue
sconosciute causano un arresto precauzionale e richiedono di impostare `marketplaceName` o
`marketplacePath`.

## Marketplace macOS incluso

Le versioni desktop attuali di ChatGPT includono Computer Use qui; le versioni desktop
autonome precedenti di Codex usano la stessa struttura sotto `Codex.app`:

```text
/Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled/plugins/computer-use
```

Quando `computerUse.autoInstall` è `true` e non è registrato alcun marketplace contenente
`computer-use`, OpenClaw prova ad aggiungere la prima radice standard
del marketplace incluso esistente:

```text
/Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled
/Applications/Codex.app/Contents/Resources/plugins/openai-bundled
```

Puoi anche registrarla esplicitamente da una shell con Codex:

```bash
codex plugin marketplace add /Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled
```

Se usi un percorso non standard per l'app Codex, esegui una volta `/codex computer-use install
--source <marketplace-root>` oppure imposta `computerUse.marketplacePath` sul
percorso locale di un file del marketplace. Usa `--marketplace-path` soltanto quando disponi del
percorso del file JSON del marketplace, non della radice del marketplace incluso.

### Cache condivisa dei plugin

Il valore predefinito `pluginCacheMode: "independent"` lascia non gestite ciascuna home Codex e la relativa
cache dei plugin. Imposta `pluginCacheMode: "shared"` per copiare il plugin
Computer Use incluso nella cache dei plugin individuabile della home Codex attiva
prima dell'avvio di app-server. La modalità condivisa conserva le versioni precedenti nella cache perché
i client Codex in esecuzione possono ancora fare riferimento alle rispettive directory di plugin con versione; anche
una copia sostitutiva non riuscita conserva la cache attiva. Una configurazione esplicita di
`marketplaceName` o `marketplacePath` disabilita questa
riconciliazione, affinché OpenClaw non sostituisca la selezione.

## Limite del catalogo remoto

Codex app-server può elencare e leggere le voci disponibili soltanto nel catalogo remoto, ma
attualmente non supporta `plugin/install` remoto. Ciò significa che `marketplaceName`
può selezionare un marketplace disponibile soltanto in remoto per i controlli di stato, ma le installazioni e
le riabilitazioni richiedono comunque un marketplace locale tramite `marketplaceSource` o
`marketplacePath`.

Se lo stato indica che il plugin è disponibile in un marketplace Codex remoto, ma
l'installazione remota non è supportata, esegui l'installazione con un'origine o un percorso locale:

```text
/codex computer-use install --source <marketplace-source>
/codex computer-use install --marketplace-path <path>
```

## Riferimento della configurazione

| Campo                           | Valore predefinito | Significato                                                                                       |
| ------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------- |
| `enabled`                       | dedotto            | Richiede Computer Use. Il valore predefinito è true quando è impostato un altro campo Computer Use. |
| `autoInstall`                   | false              | Installa o riattiva dai marketplace già rilevati all'inizio del turno.                            |
| `marketplaceDiscoveryTimeoutMs` | 60000              | Tempo di attesa dell'installazione per il rilevamento del marketplace da parte dell'app-server Codex. |
| `liveTestTimeoutMs`             | 60000              | Timeout per il thread temporaneo di verifica della disponibilità e per le relative richieste di pulizia. |
| `toolCallTimeoutMs`             | 60000              | Timeout per la chiamata allo strumento di disponibilità `list_apps` di Computer Use.              |
| `healthCheckEnabled`            | false              | Esegue verifiche periodiche della disponibilità mentre il client app-server proprietario è attivo. |
| `healthCheckIntervalMinutes`    | 60                 | Frequenza delle verifiche; i valori accettati sono 30, 60, 120 o 240 minuti.                       |
| `pluginCacheMode`               | `independent`      | Usa `shared` per aggiornare la cache della directory home di Codex dal plugin desktop incluso.     |
| `strictReadiness`               | false              | Interrompe l'avvio in caso di verifica in tempo reale non riuscita, anziché continuare con un avviso. |
| `autoRepair`                    | false              | Termina i processi figli MCP obsoleti di Computer Use nell'ambito interessato e ripete una volta la verifica non riuscita. |
| `marketplaceSource`             | non impostato      | Stringa sorgente passata a `marketplace/add` dell'app-server Codex.                               |
| `marketplacePath`               | non impostato      | Percorso locale del file del marketplace Codex contenente il plugin.                              |
| `marketplaceName`               | non impostato      | Nome del marketplace Codex registrato da selezionare.                                             |
| `pluginName`                    | `computer-use`     | Nome del plugin nel marketplace Codex.                                                            |
| `mcpServerName`                 | `computer-use`     | Nome del server MCP esposto dal plugin installato.                                                 |

L'installazione automatica all'inizio del turno rifiuta intenzionalmente i valori
`marketplaceSource` configurati. L'aggiunta di una nuova sorgente è un'operazione
di configurazione esplicita, quindi usa una volta
`/codex computer-use install --source <marketplace-source>`, quindi lascia che
`autoInstall` gestisca le riattivazioni future dai marketplace locali rilevati.
L'installazione automatica all'inizio del turno può usare un `marketplacePath`
configurato, perché si tratta già di un percorso locale sull'host.

Ogni campo accetta anche una variabile d'ambiente sostitutiva, verificata quando
la chiave di configurazione corrispondente non è impostata:

| Campo                           | Variabile d'ambiente                                            |
| ------------------------------- | -------------------------------------------------------------- |
| `enabled`                       | `OPENCLAW_CODEX_COMPUTER_USE`                                  |
| `autoInstall`                   | `OPENCLAW_CODEX_COMPUTER_USE_AUTO_INSTALL`                     |
| `marketplaceDiscoveryTimeoutMs` | `OPENCLAW_CODEX_COMPUTER_USE_MARKETPLACE_DISCOVERY_TIMEOUT_MS` |
| `liveTestTimeoutMs`             | `OPENCLAW_CODEX_COMPUTER_USE_LIVE_TEST_TIMEOUT_MS`             |
| `toolCallTimeoutMs`             | `OPENCLAW_CODEX_COMPUTER_USE_TOOL_CALL_TIMEOUT_MS`             |
| `healthCheckEnabled`            | `OPENCLAW_CODEX_COMPUTER_USE_HEALTH_CHECK_ENABLED`             |
| `healthCheckIntervalMinutes`    | `OPENCLAW_CODEX_COMPUTER_USE_HEALTH_CHECK_INTERVAL_MINUTES`    |
| `pluginCacheMode`               | `OPENCLAW_CODEX_COMPUTER_USE_PLUGIN_CACHE_MODE`                |
| `strictReadiness`               | `OPENCLAW_CODEX_COMPUTER_USE_STRICT_READINESS`                 |
| `autoRepair`                    | `OPENCLAW_CODEX_COMPUTER_USE_AUTO_REPAIR`                      |
| `marketplaceSource`             | `OPENCLAW_CODEX_COMPUTER_USE_MARKETPLACE_SOURCE`               |
| `marketplacePath`               | `OPENCLAW_CODEX_COMPUTER_USE_MARKETPLACE_PATH`                 |
| `marketplaceName`               | `OPENCLAW_CODEX_COMPUTER_USE_MARKETPLACE_NAME`                 |
| `pluginName`                    | `OPENCLAW_CODEX_COMPUTER_USE_PLUGIN_NAME`                      |
| `mcpServerName`                 | `OPENCLAW_CODEX_COMPUTER_USE_MCP_SERVER_NAME`                  |

## Cosa verifica OpenClaw

OpenClaw segnala internamente un motivo stabile relativo alla configurazione e
formatta lo stato mostrato all'utente nella chat:

| Motivo                       | Significato                                                     | Passaggio successivo                              |
| ---------------------------- | --------------------------------------------------------------- | ------------------------------------------------- |
| `disabled`                   | `computerUse.enabled` è stato risolto come false.               | Imposta `enabled` o un altro campo Computer Use.  |
| `marketplace_missing`        | Non era disponibile alcun marketplace corrispondente.           | Configura la sorgente, il percorso o il nome del marketplace. |
| `plugin_not_installed`       | Il marketplace esiste, ma il plugin non è installato.           | Esegui l'installazione o abilita `autoInstall`.   |
| `plugin_disabled`            | Il plugin è installato ma disabilitato nella configurazione di Codex. | Esegui l'installazione per riattivarlo.       |
| `remote_install_unsupported` | Il marketplace selezionato è disponibile solo da remoto.        | Usa `marketplaceSource` o `marketplacePath`.      |
| `mcp_missing`                | Il plugin è abilitato, ma il server MCP non è disponibile.      | Verifica Computer Use di Codex e i permessi del sistema operativo. |
| `ready`                      | Il plugin e gli strumenti MCP sono disponibili.                 | Avvia il turno in modalità Codex.                 |
| `check_failed`               | Una richiesta all'app-server Codex non è riuscita durante il controllo dello stato. | Verifica la connettività e i log dell'app-server. |
| `auto_install_blocked`       | La configurazione all'inizio del turno richiederebbe l'aggiunta di una nuova sorgente. | Esegui prima l'installazione esplicita. |

L'output della chat include lo stato del plugin, lo stato del server MCP, il
marketplace, gli strumenti quando disponibili e il messaggio specifico relativo
al passaggio di configurazione non riuscito.

## Permessi macOS

Computer Use è specifico per macOS. Il server MCP gestito da Codex potrebbe
richiedere permessi locali del sistema operativo prima di poter ispezionare o
controllare le app. Se OpenClaw indica che Computer Use è installato ma il server
MCP non è disponibile, verifica prima la configurazione di Computer Use sul lato
Codex:

- L'app-server Codex è in esecuzione sullo stesso host in cui deve avvenire il
  controllo del desktop.
- Il plugin Computer Use è abilitato nella configurazione di Codex.
- Il server MCP `computer-use` compare nello stato MCP dell'app-server Codex.
- macOS ha concesso i permessi richiesti all'app di controllo del desktop.
- La sessione corrente dell'host può accedere al desktop controllato.

OpenClaw interrompe intenzionalmente l'operazione in modo sicuro quando
`computerUse.enabled` è true. Un turno in modalità Codex non deve proseguire
silenziosamente senza gli strumenti desktop nativi richiesti dalla configurazione.

## Risoluzione dei problemi

**Lo stato indica che non è installato.** Esegui `/codex computer-use install`.
Se il marketplace non viene rilevato, specifica `--source` o
`--marketplace-path`.

**Lo stato indica che è installato ma disabilitato.** Esegui nuovamente
`/codex computer-use install`. L'installazione dell'app-server Codex riscrive la
configurazione del plugin impostandolo come abilitato.

**Lo stato indica che l'installazione remota non è supportata.** Usa una sorgente
o un percorso del marketplace locale. Le voci del catalogo disponibili solo da
remoto possono essere ispezionate, ma non installate tramite l'API corrente
dell'app-server.

**Lo stato indica che il server MCP non è disponibile.** Ripeti una volta
l'installazione affinché i server MCP vengano ricaricati. Se rimane non
disponibile, correggi l'app Computer Use di Codex, lo stato MCP dell'app-server
Codex o i permessi macOS.

**Lo stato o una verifica scade su `computer-use.list_apps`.** Il plugin e il
server MCP sono presenti, ma il bridge locale di Computer Use non ha risposto.
Chiudi o riavvia Computer Use di Codex, riavvia Codex Desktop se necessario,
quindi riprova in una nuova sessione OpenClaw. Se in precedenza l'host eseguiva
Computer Use tramite un app-server Codex gestito meno recente, aggiorna il plugin
installato dal marketplace incluso nell'app desktop (usa il percorso `Codex.app`
per le installazioni desktop autonome di Codex):

```text
/codex computer-use install --source /Applications/ChatGPT.app/Contents/Resources/plugins/openai-bundled
```

**Uno strumento Computer Use segnala `Native hook relay unavailable`.** L'hook
nativo dello strumento Codex non è riuscito a raggiungere un relay OpenClaw
attivo tramite il bridge locale o il fallback del Gateway. Avvia una nuova
sessione OpenClaw con `/new` o `/reset`. Se funziona una volta e poi non riesce
nuovamente durante una chiamata successiva allo strumento, `/new` sta solo
azzerando il tentativo corrente; riavvia l'app-server Codex o il Gateway
OpenClaw affinché i vecchi thread e le registrazioni degli hook vengano
eliminati, quindi riprova in una nuova sessione.

**L'installazione automatica all'inizio del turno rifiuta una sorgente.** È un
comportamento intenzionale. Aggiungi prima la sorgente con il comando esplicito
`/codex computer-use install --source <marketplace-source>`, quindi le future
installazioni automatiche all'inizio del turno potranno usare il marketplace
locale rilevato.

## Contenuti correlati

- [Harness Codex](/it/plugins/codex-harness)
- [Bridge Peekaboo](/it/platforms/mac/peekaboo)
- [App iOS](/it/platforms/ios)
