---
read_when:
    - Hai completato la configurazione dell'inferenza e vuoi che Crestodian configuri il resto
    - Devi ispezionare o riparare OpenClaw con l'agente di configurazione locale
    - Stai progettando o abilitando la modalità di ripristino del canale di messaggistica
summary: Riferimento della CLI e modello di sicurezza per l'assistente di configurazione e riparazione di Crestodian basato sull'inferenza
title: Crestodian
x-i18n:
    generated_at: "2026-07-12T06:54:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: af4861a48fb26159cb8e0c29d08ab5c3776283eb5392dcbe08c9a28d01f4abf5
    source_path: cli/crestodian.md
    workflow: 16
---

# `openclaw crestodian`

Crestodian conversazionale è l'agente locale di OpenClaw per la configurazione iniziale, la riparazione e la configurazione. Si avvia solo dopo che il modello predefinito effettivo ha completato un turno reale. Le nuove installazioni stabiliscono prima l'inferenza; una configurazione non valida rimane nel percorso doctor classico.

## Quando si avvia

L'esecuzione di `openclaw` senza sottocomandi viene instradata in base allo stato della configurazione:

- Configurazione mancante oppure esistente ma senza impostazioni definite dall'utente (vuota o contenente solo le chiavi `$schema`/`meta`): avvia la configurazione iniziale guidata con verifica AI in tempo reale.
- La configurazione esiste ma non supera la convalida: avvia la configurazione iniziale classica, che segnala i problemi e indica di usare `openclaw doctor`.
- La configurazione esiste ed è valida: apre la normale TUI dell'agente. Un Gateway configurato e raggiungibile, il cui agente predefinito dispone di un modello, passa direttamente a tale interfaccia senza configurazione iniziale né Crestodian. Usa `/crestodian` nella TUI oppure esegui direttamente `openclaw crestodian` per accedere successivamente a Crestodian.

L'esecuzione di `openclaw crestodian` verifica prima in tempo reale il modello predefinito configurato. Se il turno riesce, viene avviato Crestodian. In caso di errore interattivo, si apre la configurazione guidata dell'inferenza, che passa il controllo a Crestodian dopo che un candidato ha superato la verifica. Le richieste singole, JSON e le altre richieste non interattive non riescono e indicano di eseguire `openclaw onboard` quando l'inferenza non è disponibile. `openclaw --help` e `openclaw --version` mantengono i normali percorsi rapidi.

L'esecuzione non interattiva del solo comando `openclaw` (senza TTY) termina con un breve messaggio invece di mostrare la guida principale: rimanda alla configurazione iniziale non interattiva per un'installazione nuova o non valida, oppure a `openclaw agent --local ...` quando la configurazione è valida.

`openclaw onboard --modern` rimane un alias di compatibilità per Crestodian, ma usa lo stesso controllo dell'inferenza: se l'inferenza funziona apre la chat, gli errori interattivi avviano la configurazione guidata dell'inferenza e gli errori non interattivi causano l'uscita con indicazioni per la configurazione iniziale. `openclaw onboard --classic` apre la procedura guidata completa, passo dopo passo.

## Cosa mostra Crestodian

Crestodian interattivo apre la stessa interfaccia TUI di `openclaw tui`, con un backend di chat Crestodian. Il saluto iniziale include:

- validità della configurazione e agente predefinito
- modello verificato utilizzato da Crestodian
- raggiungibilità del Gateway rilevata dal primo controllo all'avvio
- azione di debug successiva consigliata

Non mostra i segreti né carica i comandi CLI dei Plugin solo per avviarsi.

Usa `status` per l'inventario dettagliato: percorso della configurazione, percorsi della documentazione e del codice sorgente, controlli della CLI locale, presenza di chiavi/token, agenti, modello e dettagli del Gateway.

Crestodian usa lo stesso rilevamento dei riferimenti degli agenti normali: in un checkout Git rimanda alla directory locale `docs/` e all'albero del codice sorgente; in un'installazione npm usa la documentazione inclusa e collega [https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw), consigliando di consultare il codice sorgente quando la documentazione non è sufficiente.

## Esempi

```bash
openclaw
openclaw crestodian
openclaw crestodian --json
openclaw crestodian --message "models"
openclaw crestodian --message "validate config"
openclaw crestodian --message "setup workspace ~/Projects/work" --yes
openclaw crestodian --message "set default model openai/gpt-5.6" --yes
openclaw onboard --modern
```

Nella TUI di Crestodian:

```text
status
health
doctor
validate config
setup
setup workspace ~/Projects/work
config set gateway.port 19001
config set-ref gateway.auth.token env OPENCLAW_GATEWAY_TOKEN
gateway status
restart gateway
agents
create agent work workspace ~/Projects/work
models
configure model provider
set default model openai/gpt-5.6
channels
channel info slack
connect slack
open channel wizard for slack
plugins list
plugins search slack
plugin install clawhub:openclaw-codex-app-server
talk to work agent
talk to agent for ~/Projects/work
audit
quit
```

## Operazioni e approvazione

Crestodian usa operazioni tipizzate invece di modificare la configurazione in modo estemporaneo.

Le operazioni di sola lettura vengono eseguite immediatamente: mostrare la panoramica, elencare gli agenti, elencare i Plugin installati, cercare Plugin in ClawHub, mostrare lo stato del modello/backend, eseguire controlli di stato/integrità, verificare la raggiungibilità del Gateway, eseguire doctor senza correzioni interattive, convalidare la configurazione e mostrare il percorso del registro di controllo.

Anche l'avvio della configurazione guidata di un canale (`connect telegram`) viene eseguito immediatamente. La relativa procedura guidata raccoglie risposte esplicite e gestisce le conseguenti scritture.

Le operazioni persistenti richiedono l'approvazione nella conversazione (oppure `--yes` per un comando diretto): scrivere la configurazione, usare `config set`, usare `config set-ref`, inizializzare la configurazione iniziale, cambiare il modello predefinito, avviare/arrestare/riavviare il Gateway, creare agenti e installare Plugin.

Le riparazioni di doctor non sono disponibili in Crestodian perché possono riscrivere il provider, l'autenticazione o il percorso di inferenza dell'agente predefinito che alimenta la sessione. Esci da Crestodian ed esegui `openclaw doctor --fix` in un terminale. Il comando `doctor` di sola lettura rimane disponibile in Crestodian.

I nuovi agenti ereditano il percorso di inferenza predefinito verificato in tempo reale. L'ID agente `crestodian` è riservato al custode virtuale privilegiato e non può essere creato come agente normale.

`config set` e `config set-ref` non possono modificare lo stato del percorso di inferenza, incluse le credenziali del provider di inferenza, le proprietà `auth.*` di primo livello, i cataloghi dei modelli, i backend CLI, i percorsi dei modelli predefiniti o per agente, i parametri/strumenti degli agenti o le proprietà `tools.*` principali. Anche le scritture dirette in `env.*`, `secrets.*`, `plugins.*` e `$include` vengono rifiutate perché possono sostituire la risoluzione delle credenziali o l'attivazione del provider. L'autenticazione del Gateway e dei canali rimane una normale superficie di configurazione. Usa i flussi di lavoro tipizzati per Plugin/canali e `set default model <provider/model>` per un percorso già configurato; il percorso viene verificato in tempo reale prima del salvataggio. Per configurare o riparare l'accesso al provider o all'autenticazione, esci da Crestodian ed esegui `openclaw onboard`.

La disinstallazione dei Plugin viene rifiutata in Crestodian perché la rimozione di un Plugin provider potrebbe disabilitare il percorso di inferenza che alimenta la sessione. Esci da Crestodian ed esegui `openclaw plugins uninstall <id>` da un terminale.

L'approvazione viene espressa con parole proprie: le risposte inequivocabili ("sì", "certo", "procedi", "non ora") vengono interpretate usando un elenco chiuso e deterministico. Quando il percorso configurato supporta una chiamata di completamento separata, le altre risposte possono essere classificate usando esclusivamente il messaggio dell'utente e la proposta in sospeso, mai dal modello della conversazione stessa, che non può autoapprovarsi. Le risposte non classificate o ambigue mantengono la proposta in sospeso e la conversazione richiede nuovamente una risposta.

Le scritture applicate vengono registrate in `~/.openclaw/audit/crestodian.jsonl`. Il rilevamento non viene registrato; lo sono soltanto le operazioni applicate e le scritture.

La configurazione del canale può essere eseguita come conversazione ospitata finché non richiede un segreto. La TUI locale di Crestodian non accetta risposte sensibili nella procedura guidata perché l'input della chat nel terminale è visibile. Propone immediatamente `open channel wizard`, trasferendo il canale selezionato alla procedura guidata mascherata nel terminale; in alternativa, è possibile eseguire successivamente `openclaw channels add --channel <channel>`.

### Passaggio alla configurazione mascherata del canale

La chat locale può trasferire il controllo alla procedura guidata mascherata del canale:

```text
open channel wizard for slack
channel info slack
```

`open channel wizard for <channel>` apre la configurazione mascherata del canale dopo la chiusura della TUI della chat. Usa prima `channel info <channel>` per visualizzare l'etichetta del canale, lo stato della configurazione, il riepilogo dei prerequisiti e il collegamento alla documentazione.

Crestodian non modifica mai l'accesso al provider o all'autenticazione dall'interno della propria sessione: la sessione dipende già da tale percorso di inferenza. Per configurare o riparare il provider del modello, `configure model provider` restituisce indicazioni per uscire e avviare la configurazione iniziale, senza avviare una procedura guidata né scrivere la configurazione. Esci da Crestodian ed esegui `openclaw onboard`; la configurazione iniziale prepara le credenziali e salva soltanto un percorso che completa un turno reale in tempo reale. Avvia nuovamente Crestodian dopo il completamento della configurazione iniziale.

## Inizializzazione della configurazione

`setup` configura lo spazio di lavoro e lo stato del Gateway rimanenti dopo che la configurazione iniziale guidata ha già stabilito l'inferenza. Scrive esclusivamente tramite operazioni di configurazione tipizzate e richiede prima l'approvazione.

```text
setup
setup workspace ~/Projects/work
```

`setup` conserva il modello effettivo verificato. Non configura né sostituisce l'inferenza.

Se l'inferenza manca o il relativo controllo in tempo reale non riesce, esci da Crestodian ed esegui `openclaw onboard`. La configurazione iniziale guidata rileva i modelli configurati, le chiavi API e le CLI locali autenticate, richiede a ciascun candidato una risposta reale e rende persistente soltanto un percorso che supera la verifica. Crestodian si avvia immediatamente dopo questo passaggio e può quindi configurare lo spazio di lavoro, il Gateway, i canali, gli agenti, i Plugin e le altre funzionalità facoltative.

L'app macOS ignora completamente questa sequenza quando raggiunge un Gateway configurato il cui agente predefinito dispone già di un modello configurato; apre la normale interfaccia dell'agente.
Per un Gateway nuovo o incompleto, l'app gestisce la sequenza dell'inferenza tramite i metodi Gateway `crestodian.setup.detect` e `crestodian.setup.activate`: detect elenca tutti i backend candidati rilevati, activate verifica in tempo reale un candidato (un completamento reale "reply with OK") e rende persistenti il modello, la credenziale e lo stato del provider/runtime necessari per tale percorso soltanto dopo il superamento della verifica. Le impostazioni predefinite dello spazio di lavoro e del Gateway rimangono affidate a Crestodian. Un candidato che non supera la verifica non modifica mai la configurazione; l'app percorre automaticamente la sequenza e infine propone un passaggio manuale per chiave/token, compilato in base ai Plugin del provider di inferenza testuale attivi nel Gateway. Il provider selezionato gestisce il proprio modello iniziale e la relativa configurazione, e la credenziale viene verificata nello stesso modo prima di essere salvata.

La supervisione di Codex e le altre funzionalità facoltative dei Plugin rimangono escluse da questa transazione di attivazione dell'inferenza. Configurale soltanto dopo che l'inferenza funziona e Crestodian si è avviato; i criteri esistenti dei Plugin e le esclusioni esplicite dalla supervisione rimangono invariati durante la configurazione dell'inferenza.

## Conversazione AI

La conversazione libera di Crestodian interattivo viene eseguita tramite lo stesso ciclo degli agenti OpenClaw normali, limitato a un solo strumento con autorità di livello zero di OpenClaw, `crestodian`, che incapsula le operazioni tipizzate. Le azioni di lettura vengono eseguite liberamente, le modifiche richiedono l'approvazione nella conversazione per quella specifica operazione (vedi Operazioni e approvazione) e ogni scrittura applicata viene registrata e nuovamente convalidata. La sessione dell'agente è persistente, quindi Crestodian dispone di una reale memoria multi-turno. Se il percorso di inferenza verificato smette successivamente di funzionare, torna a `openclaw onboard` e riparalo prima di continuare.

L'host non interpreta le richieste in linguaggio naturale trasformandole in operazioni. I messaggi in forma libera, inclusi testi simili a comandi e domande come "perché il mio Gateway si è arrestato?", vengono inviati all'AI, che può associare la richiesta a un'operazione tipizzata tramite lo strumento `crestodian`.

Quando una modifica è in sospeso, soltanto le frasi inequivocabili di approvazione o rifiuto appartenenti a un elenco chiuso vengono interpretate senza inferenza. Il consenso ambiguo viene inviato a una chiamata di completamento configurata separatamente e, in caso contrario, viene rifiutato in modo sicuro. I campi strutturati delle procedure guidate e la navigazione esatta dell'host sono controlli dell'interfaccia, non interpretazione di operazioni dal linguaggio naturale. Un'eccezione particolarmente importante per la protezione dei segreti riguarda un comando `config set` esatto su un percorso sensibile (token, chiavi, password), che non raggiunge mai un modello. L'host crea una proposta oscurata e il valore viene mascherato nella cronologia visibile all'AI. Per i segreti, preferisci `config set-ref <path> env <ENV_VAR>`.

La modalità di ripristino tramite canale di messaggistica non usa mai il pianificatore assistito dal modello. Il ripristino remoto rimane deterministico, in modo che un percorso normale dell'agente compromesso o non funzionante non possa essere usato come editor della configurazione.

### Modello di attendibilità dell'infrastruttura CLI

I runtime incorporati e l'infrastruttura app-server di Codex applicano direttamente la limitazione di livello zero: l'esecuzione include un elenco di strumenti consentiti da OpenClaw contenente soltanto lo strumento `crestodian`. Per Codex, OpenClaw disabilita inoltre, per tale esecuzione, gli ambienti, l'esecuzione nativa, la modalità multi-agente, gli obiettivi, le superfici di app/Plugin, Skills/MCP, ricerca sul web e `request_user_input`. Codex continua a inserire la propria utilità nativa inerte `update_plan`; questa può aggiornare l'elenco di controllo temporaneo del modello, ma non può scrivere file né modificare la configurazione di OpenClaw. Le infrastrutture CLI non utilizzano l'elenco di strumenti consentiti di OpenClaw, quindi Crestodian ammette soltanto backend il cui contratto di selezione degli strumenti possa garantire la stessa limitazione:

- I backend selezionabili, incluso Claude Code, vengono avviati con una selezione
  vuota degli strumenti nativi e un solo strumento MCP, `crestodian`. La
  configurazione MCP generata da Claude viene applicata con `--strict-mcp-config`,
  pertanto non vengono caricati altri server MCP.
- I backend che non dichiarano strumenti nativi ricevono lo stesso server MCP
  dedicato di Crestodian.
- I backend con strumenti nativi sempre attivi o sconosciuti si bloccano in
  sicurezza prima dell'inferenza; non possono ospitare una sessione Crestodian.

Solo le sessioni Crestodian ricevono il server MCP crestodian; le normali
esecuzioni degli agenti non vedono mai questo strumento. I backend CLI
selezionabili/senza strumenti nativi e i modelli con chiave API applicano quindi
il ciclo letterale con un solo strumento. I modelli Codex app-server applicano
un unico strumento di autorità OpenClaw più l'utilità nativa inerte di
pianificazione. In tutti e tre i casi, le scritture di configurazione rimangono
limitate al contratto di approvazione verificato di Crestodian.

Gemini CLI rimane disponibile per gli agenti normali, ma non può applicare il
controllo senza strumenti richiesto dal gate di inferenza, quindi non può
ospitare Crestodian.

## Passaggio a un agente

Usa un selettore in linguaggio naturale per uscire da Crestodian e aprire la TUI normale:

```text
parla con l'agente
parla con l'agente di lavoro
passa all'agente principale
```

`openclaw tui`, `openclaw chat` e `openclaw terminal` aprono direttamente la TUI dell'agente normale; non avviano Crestodian. Dopo essere passati alla TUI normale, `/crestodian` torna a Crestodian, facoltativamente con una richiesta successiva:

```text
/crestodian
/crestodian riavvia gateway
```

## Modalità di ripristino tramite messaggi

La modalità di ripristino tramite messaggi è il punto di ingresso di Crestodian
attraverso i canali di messaggistica: usala quando il tuo agente normale non
funziona, ma un canale attendibile (ad esempio WhatsApp) riceve ancora i comandi.

Si tratta di un gestore deterministico dei comandi di emergenza, non dell'agente
conversazionale Crestodian. Non inizializza da zero una nuova configurazione né
allenta il gate di inferenza per la chat di Crestodian.

Comando supportato: `/crestodian <richiesta>`. Il ripristino accetta solo
l'esatta grammatica tipizzata dei comandi: il linguaggio naturale viene
rifiutato con un suggerimento, non viene mai interpretato arbitrariamente come
un'operazione e non viene mai consultato alcun modello.

```text
Tu, in un DM attendibile del proprietario: /crestodian status
OpenClaw: Modalità di ripristino Crestodian. Gateway raggiungibile: no. Configurazione valida: no.
Tu: /crestodian restart gateway
OpenClaw: Piano: riavviare il Gateway. Rispondi /crestodian yes per applicare.
Tu: /crestodian yes
OpenClaw: Applicato. Voce di audit registrata.
```

La creazione di un agente può anche essere accodata localmente o tramite il ripristino:

```text
create agent work workspace ~/Projects/work model openai/gpt-5.6-sol
/crestodian create agent work workspace ~/Projects/work
```

La creazione di un agente può specificare solo il modello predefinito corrente
verificato dal vivo. Ometti il modello per ereditare tale percorso.

Il ripristino remoto è una superficie amministrativa e deve essere trattato
come una riparazione remota della configurazione, non come una normale chat.

Contratto di sicurezza per il ripristino remoto:

- È disabilitato quando il sandboxing è attivo per l'agente/sessione; Crestodian rifiuta il ripristino remoto e rimanda alla riparazione tramite CLI locale.
- Lo stato effettivo predefinito è `auto`: consente il ripristino remoto solo durante un'operazione YOLO attendibile, in cui il runtime dispone già di autorità locale senza sandbox (`tools.exec.security` si risolve in `full` e `tools.exec.ask` si risolve in `off`, con modalità sandbox `off`).
- Richiede un'identità esplicita del proprietario; non sono consentite regole mittente con caratteri jolly, criteri di gruppo aperti, Webhook non autenticati o canali anonimi.
- Per impostazione predefinita, sono consentiti solo i DM del proprietario; il ripristino in gruppi/canali richiede un consenso esplicito.
- La ricerca e l'elenco dei Plugin sono di sola lettura. L'installazione dei Plugin è sempre consentita solo localmente (bloccata nel ripristino, anche quando altrimenti abilitata), poiché scarica codice eseguibile. La disinstallazione dei Plugin viene rifiutata sia in Crestodian locale sia nel ripristino; esegui `openclaw plugins uninstall <id>` da un terminale.
- Il ripristino remoto non può aprire la TUI locale né passare a una sessione interattiva dell'agente; usa `openclaw` localmente per il passaggio all'agente.
- Le scritture persistenti richiedono comunque l'approvazione, anche in modalità di ripristino.
- Ogni operazione di ripristino applicata viene registrata nell'audit. Il ripristino tramite canale di messaggistica registra i metadati relativi a canale, account, mittente e indirizzo di origine; le operazioni che modificano la configurazione registrano anche gli hash della configurazione prima e dopo.
- I segreti non vengono mai mostrati. L'ispezione di SecretRef segnala la disponibilità, non i valori.
- Se il Gateway è attivo, il ripristino privilegia le operazioni tipizzate del Gateway; se non è attivo, utilizza solo la superficie minima di riparazione locale che non dipende dal normale ciclo dell'agente.

Struttura della configurazione:

```jsonc
{
  "crestodian": {
    "rescue": {
      "enabled": "auto",
      "ownerDmOnly": true,
      "pendingTtlMinutes": 15,
    },
  },
}
```

- `enabled`: `"auto"` (predefinito) consente il ripristino solo quando il runtime effettivo è YOLO e il sandboxing è disattivato; `false` non consente mai il ripristino tramite canale di messaggistica; `true` consente esplicitamente il ripristino quando i controlli del proprietario/canale hanno esito positivo (resta comunque soggetto al rifiuto dovuto al sandboxing).
- `ownerDmOnly`: limita il ripristino ai messaggi diretti del proprietario. Valore predefinito: `true`.
- `pendingTtlMinutes`: durata per cui una scrittura di ripristino in sospeso rimane disponibile per l'approvazione tramite `/crestodian yes` prima di scadere. Valore predefinito: `15`.

Il ripristino remoto è coperto dal percorso Docker:

```bash
pnpm test:docker:crestodian-rescue
```

Un controllo rapido facoltativo e dal vivo della superficie dei comandi del
canale verifica `/crestodian status` e un ciclo completo di approvazione
persistente tramite il gestore del ripristino:

```bash
pnpm test:live:crestodian-rescue-channel
```

La configurazione monouso del pacchetto sottoposta al gate di inferenza è coperta da:

```bash
pnpm test:docker:crestodian-first-run
```

Questo percorso della CLI inclusa nel pacchetto inizia con una directory di
stato vuota e dimostra che Crestodian si blocca in sicurezza senza inferenza.
Successivamente testa e attiva un Claude simulato attraverso il modulo di
attivazione incluso nel pacchetto. Solo in seguito una richiesta approssimativa
raggiunge il pianificatore e viene risolta in una configurazione tipizzata,
seguita da comandi monouso che creano un agente aggiuntivo, configurano Discord
tramite l'abilitazione di un Plugin e un SecretRef per il token, convalidano la
configurazione e controllano il registro di audit. Questo percorso fornisce
prove di supporto per gate e operazioni; non esercita l'onboarding interattivo
né la conversazione tra agente, strumento e approvazione di Crestodian. Lo
scenario QA Lab seguente reindirizza allo stesso percorso Docker:

```bash
pnpm openclaw qa suite --scenario crestodian-ring-zero-setup
```

## Contenuti correlati

- [Riferimento della CLI](/it/cli)
- [Doctor](/it/cli/doctor)
- [TUI](/it/cli/tui)
- [Sandbox](/it/cli/sandbox)
- [Sicurezza](/it/cli/security)
