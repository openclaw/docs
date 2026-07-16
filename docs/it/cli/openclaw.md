---
read_when:
    - Hai completato la configurazione dell'inferenza e vuoi che OpenClaw configuri il resto
    - È necessario ispezionare o riparare OpenClaw con l'agente di configurazione locale
    - Si sta progettando o abilitando la modalità di ripristino del canale di messaggistica
summary: Riferimento CLI e modello di sicurezza per l'assistente di configurazione e riparazione di OpenClaw basato sull'inferenza
title: Agente di configurazione di OpenClaw
x-i18n:
    generated_at: "2026-07-16T14:15:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4cf52eeaf14dd2e2bc388c69a1566d4956d42d27cd28cd74b3f1fbee5a2b2e5f
    source_path: cli/openclaw.md
    workflow: 16
---

# `openclaw setup`

OpenClaw include un agente di sistema integrato — che si presenta come "OpenClaw" — per
la configurazione locale, la riparazione e la gestione delle impostazioni (in precedenza chiamato Crestodian). Si avvia solo dopo che il modello predefinito effettivo ha completato un turno reale.
Le nuove installazioni configurano prima l'inferenza; una configurazione non valida resta nel
percorso classico di doctor.

## Quando si avvia

L'esecuzione di `openclaw` senza sottocomandi viene instradata in base allo stato della configurazione:

- Configurazione assente oppure presente ma senza impostazioni definite (vuota o contenente solo le chiavi `$schema`/`meta`): avvia l'onboarding guidato con verifica AI in tempo reale.
- La configurazione esiste ma non supera la convalida: avvia l'onboarding classico, che segnala i problemi e indica di usare `openclaw doctor`.
- La configurazione esiste ed è valida: apre la normale TUI dell'agente. Un Gateway configurato e raggiungibile, il cui agente predefinito dispone di un modello, accede direttamente a tale interfaccia
  senza onboarding né OpenClaw. Usare `/openclaw` nella TUI oppure eseguire
  direttamente `openclaw setup` per accedere successivamente a OpenClaw.

L'esecuzione di `openclaw setup` verifica prima in tempo reale il modello predefinito configurato. Un turno riuscito avvia OpenClaw. Un errore interattivo apre la configurazione guidata dell'inferenza e passa il controllo a OpenClaw dopo che un candidato supera la verifica. Le richieste singole, JSON e le altre richieste non interattive non riescono e indicano di eseguire `openclaw onboard` quando l'inferenza non è disponibile. `openclaw --help` e `openclaw --version` mantengono i rispettivi percorsi rapidi normali.

L'esecuzione non interattiva del solo `openclaw` (senza TTY) termina con un breve messaggio anziché mostrare la guida principale: rimanda all'onboarding non interattivo per un'installazione nuova o non valida, oppure a `openclaw agent --local ...` quando la configurazione è valida.

`openclaw onboard --modern` resta un alias di compatibilità per OpenClaw, ma usa lo stesso controllo dell'inferenza: se l'inferenza funziona apre la chat, in caso di errori interattivi avvia la configurazione guidata dell'inferenza e in caso di errori non interattivi termina mostrando indicazioni per l'onboarding. `openclaw onboard --classic` apre la procedura guidata completa passo dopo passo.

## Cosa mostra OpenClaw

OpenClaw interattivo apre la stessa shell TUI di `openclaw tui`, con un backend di chat OpenClaw. Il messaggio di benvenuto iniziale include:

- la validità della configurazione e l'agente predefinito
- il modello verificato utilizzato da OpenClaw
- la raggiungibilità del Gateway risultante dalla prima verifica all'avvio
- la successiva azione di debug consigliata

Non espone i segreti né carica i comandi CLI dei Plugin al solo scopo di avviarsi.

Usare `status` per l'inventario dettagliato: percorso della configurazione, percorsi della documentazione e del codice sorgente, verifiche CLI locali, presenza di chiavi/token, agenti, modello e dettagli del Gateway.

OpenClaw usa la stessa individuazione dei riferimenti degli agenti normali: in un checkout Git rimanda alla risorsa locale `docs/` e all'albero del codice sorgente; in un'installazione npm usa la documentazione inclusa e rimanda a [https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw), consigliando di consultare il codice sorgente quando la documentazione non è sufficiente.

## Esempi

```bash
openclaw
openclaw setup
openclaw setup --json
openclaw setup --message "modelli"
openclaw setup --message "convalida configurazione"
openclaw setup --message "configura spazio di lavoro ~/Projects/work" --yes
openclaw setup --message "imposta modello predefinito openai/gpt-5.6" --yes
openclaw onboard --modern
```

Nella TUI di OpenClaw:

```text
stato
integrità
doctor
convalida configurazione
configurazione
configura spazio di lavoro ~/Projects/work
config set gateway.port 19001
config set-ref gateway.auth.token env OPENCLAW_GATEWAY_TOKEN
stato gateway
riavvia gateway
agenti
crea agente work spazio di lavoro ~/Projects/work
modelli
configura provider del modello
imposta modello predefinito openai/gpt-5.6
canali
informazioni canale slack
connetti slack
apri procedura guidata del canale per slack
elenco plugin
cerca plugin slack
plugin install clawhub:openclaw-codex-app-server
parla con l'agente work
parla con l'agente per ~/Projects/work
audit
esci
```

## Operazioni e approvazione

OpenClaw usa operazioni tipizzate invece di modificare la configurazione in modo estemporaneo.

Le operazioni di sola lettura vengono eseguite immediatamente: mostrare la panoramica, elencare gli agenti, elencare i Plugin installati, cercare Plugin su ClawHub, mostrare lo stato del modello/backend, eseguire controlli di stato/integrità, verificare la raggiungibilità del Gateway, eseguire doctor senza correzioni interattive, convalidare la configurazione, mostrare il percorso del registro di audit.

Anche l'avvio della configurazione guidata del canale (`connect telegram`) viene eseguito immediatamente. La relativa procedura guidata raccoglie risposte esplicite ed è responsabile delle scritture risultanti.

Le operazioni persistenti richiedono l'approvazione nella conversazione (oppure `--yes` per un comando diretto): scrivere la configurazione, `config set`, `config set-ref`, inizializzare configurazione/onboarding, cambiare il modello predefinito, avviare/arrestare/riavviare il Gateway, creare agenti e installare Plugin.

Le riparazioni di doctor non sono disponibili in OpenClaw perché possono riscrivere il provider, l'autenticazione o il percorso di inferenza dell'agente predefinito su cui si basa la sessione. Uscire da OpenClaw ed eseguire `openclaw doctor --fix` in un terminale. Il comando di sola lettura `doctor` resta disponibile in OpenClaw.

I nuovi agenti ereditano il percorso di inferenza predefinito verificato in tempo reale. Gli ID agente `openclaw` e `crestodian` sono riservati all'agente di sistema e non possono essere creati come agenti normali. L'ID ritirato resta bloccato affinché una vecchia configurazione non possa utilizzarlo.

`config set` e `config set-ref` non possono modificare lo stato del percorso di inferenza,
incluse le credenziali del provider di inferenza, `auth.*` di primo livello, i cataloghi dei modelli,
i backend CLI, i percorsi dei modelli predefiniti/per agente, i parametri/strumenti degli agenti o
`tools.*` radice. Anche le scritture non elaborate in `env.*`, `secrets.*`, `plugins.*` e `$include`
vengono rifiutate perché possono sostituire la risoluzione delle credenziali o l'attivazione
del provider. L'autenticazione del Gateway e dei canali resta parte delle normali superfici di configurazione. Usare i flussi di lavoro tipizzati per Plugin/canali e
`set default model <provider/model>` per un percorso già
configurato; il percorso viene verificato in tempo reale prima di essere salvato. Per configurare o
riparare l'accesso al provider/all'autenticazione, uscire da OpenClaw ed eseguire `openclaw onboard`.

La disinstallazione dei Plugin viene rifiutata in OpenClaw perché la rimozione di un Plugin
provider potrebbe disabilitare il percorso di inferenza su cui si basa la sessione. Uscire da OpenClaw
ed eseguire `openclaw plugins uninstall <id>` da un terminale.

L'approvazione viene espressa con parole proprie: le risposte non ambigue ("sì", "certo", "procedi", "non ora") vengono interpretate in base a un elenco chiuso e deterministico. Quando il percorso configurato supporta una chiamata di completamento separata, le altre risposte possono essere classificate utilizzando esclusivamente il messaggio dell'utente e la proposta in sospeso, mai dal modello della conversazione stesso, che non può autoapprovarsi. Le risposte non classificabili o ambigue mantengono la proposta in sospeso e la conversazione ripete la richiesta.

Le scritture applicate vengono registrate in `~/.openclaw/audit/system-agent.jsonl`. L'individuazione non viene sottoposta ad audit; lo sono soltanto le operazioni applicate e le scritture.

La configurazione del canale può essere eseguita come conversazione ospitata finché non richiede un segreto. La
TUI locale di OpenClaw non accetta risposte sensibili nella procedura guidata perché l'input della
chat nel terminale è visibile. Propone immediatamente `open channel wizard`, trasferendo
il canale selezionato alla procedura guidata mascherata nel terminale; è inoltre possibile eseguire
successivamente `openclaw channels add --channel <channel>`.

### Passaggio alla configurazione mascherata del canale

La chat locale può passare il controllo alla procedura guidata mascherata del canale:

```text
apri procedura guidata del canale per slack
informazioni canale slack
```

`open channel wizard for <channel>` apre la configurazione mascherata del canale dopo la chiusura della
TUI della chat. Usare prima `channel info <channel>` per ottenere l'etichetta del canale, lo stato della configurazione,
un riepilogo dei prerequisiti e il collegamento alla documentazione.

OpenClaw non modifica mai l'accesso al provider/all'autenticazione dall'interno della propria sessione: la
sessione dipende già da tale percorso di inferenza. Per configurare o
riparare il provider del modello, `configure model provider` restituisce indicazioni per uscire/eseguire l'onboarding senza
avviare una procedura guidata né scrivere la configurazione. Uscire da OpenClaw ed eseguire `openclaw
onboard`; l'onboarding prepara le credenziali e salva soltanto un percorso che
completa un turno reale in tempo reale. Avviare nuovamente OpenClaw dopo il completamento riuscito dell'onboarding.

## Inizializzazione della configurazione

`setup` configura lo spazio di lavoro e lo stato del Gateway rimanenti dopo che l'onboarding guidato ha già configurato l'inferenza. Scrive esclusivamente tramite operazioni di configurazione tipizzate e richiede prima l'approvazione.

```text
configurazione
configura spazio di lavoro ~/Projects/work
```

`setup` mantiene il modello effettivo verificato. Non configura né
sostituisce l'inferenza.

Se l'inferenza manca o la relativa verifica in tempo reale non riesce, uscire da OpenClaw ed eseguire `openclaw onboard`. L'onboarding guidato rileva i modelli configurati, le chiavi API e le CLI locali autenticate, richiede una risposta reale a ciascun candidato e salva soltanto un percorso che supera la verifica. OpenClaw si avvia immediatamente dopo questo passaggio e può quindi configurare lo spazio di lavoro, il Gateway, i canali, gli agenti, i Plugin e altre funzionalità facoltative.

L'app macOS ignora completamente questa sequenza quando raggiunge un Gateway configurato
il cui agente predefinito dispone già di un modello configurato; apre la normale
interfaccia dell'agente.
Per un Gateway nuovo o incompleto, l'app gestisce la sequenza di inferenza tramite
i metodi del Gateway `openclaw.setup.detect` e `openclaw.setup.activate`:
il rilevamento elenca ogni backend candidato trovato, l'attivazione verifica in tempo reale un
candidato (un completamento reale "rispondi con OK") e salva soltanto il modello,
le credenziali e lo stato del provider/runtime necessari per tale percorso dopo il superamento della verifica. Le impostazioni predefinite dello spazio di lavoro e del Gateway restano di competenza di OpenClaw. Un candidato che non supera la verifica
non modifica mai la configurazione; l'app procede automaticamente lungo la sequenza e infine
propone un passaggio manuale per chiave/token, compilato in base ai Plugin provider
di inferenza testuale attivi del Gateway. Il provider selezionato è responsabile del relativo modello
iniziale e della configurazione, e le credenziali vengono verificate allo stesso modo prima di essere salvate.

La supervisione di Codex e le altre funzionalità facoltative dei Plugin restano esterne a questa
transazione di attivazione dell'inferenza. Configurarle solo dopo che l'inferenza
funziona e OpenClaw si è avviato; i criteri esistenti dei Plugin e le esclusioni esplicite
dalla supervisione non vengono modificati durante la configurazione dell'inferenza.

## Conversazione AI

La conversazione libera di OpenClaw interattivo utilizza lo stesso ciclo degli agenti OpenClaw normali, limitato a un unico strumento di autorità OpenClaw di livello zero, `openclaw`, che incapsula le operazioni tipizzate. Le azioni di lettura vengono eseguite liberamente, le modifiche richiedono l'approvazione nella conversazione per quella specifica operazione (vedere Operazioni e approvazione) e ogni scrittura applicata viene sottoposta ad audit e riconvalidata. La sessione dell'agente persiste, quindi OpenClaw dispone di una vera memoria multiturbo. Se il percorso di inferenza verificato smette successivamente di funzionare, tornare a `openclaw onboard` e ripararlo prima di continuare.

L'host non analizza le richieste in linguaggio naturale per convertirle in operazioni. I messaggi
in forma libera, inclusi il testo che sembra un comando e domande come "perché il mio
gateway si è arrestato?", vengono inviati all'AI, che può associare la richiesta a un'operazione tipizzata
tramite lo strumento `openclaw`.

Quando una modifica è in sospeso, soltanto le espressioni non ambigue di approvazione o rifiuto appartenenti a un
elenco chiuso vengono interpretate senza inferenza. Un consenso ambiguo viene inviato a una
chiamata di completamento configurata separatamente; in caso contrario, l'operazione viene negata per impostazione predefinita. I campi strutturati
della procedura guidata e la navigazione esatta dell'host sono controlli dell'interfaccia utente, non analisi in linguaggio naturale
delle operazioni. Un'eccezione relativa alla protezione dei segreti è particolarmente importante: un
`config set` esatto su un percorso sensibile (token, chiavi, password) non raggiunge mai
un modello. L'host crea una proposta oscurata e il valore viene mascherato nella
cronologia visibile all'AI. Preferire `config set-ref <path> env <ENV_VAR>` per i segreti.

La modalità di ripristino tramite canale di messaggistica non usa mai il pianificatore assistito dal modello. Il ripristino remoto resta deterministico affinché un percorso normale dell'agente guasto o compromesso non possa essere usato come editor della configurazione.

### Modello di attendibilità dell'infrastruttura CLI

I runtime incorporati e l'harness app-server di Codex applicano direttamente la
restrizione dell'anello zero: l'esecuzione include un elenco di strumenti OpenClaw consentiti con il solo
strumento `openclaw`. Per Codex, OpenClaw disabilita inoltre gli ambienti, l'esecuzione
nativa, le funzionalità multi-agente, gli obiettivi, le app/i plugin, le Skills/MCP, la ricerca web e
le superfici `request_user_input` per tale esecuzione. Codex continua a inserire la propria utilità nativa inerte `update_plan`;
questa può aggiornare l'elenco di controllo temporaneo del modello, ma non può scrivere file
né modificare la configurazione di OpenClaw. Gli harness CLI non utilizzano l'elenco dei componenti consentiti di OpenClaw,
pertanto OpenClaw ammette solo backend il cui contratto di selezione degli strumenti possa dimostrare
la stessa restrizione:

- I backend selezionabili, incluso Claude Code, vengono avviati con una selezione vuota di strumenti
  nativi e un solo strumento MCP, `openclaw`. La configurazione MCP generata da Claude viene
  applicata con `--strict-mcp-config`, in modo che non vengano caricati altri server MCP.
- I backend che dichiarano di non avere strumenti nativi ricevono lo stesso server MCP
  OpenClaw dedicato.
- I backend con strumenti nativi sempre attivi o sconosciuti vengono bloccati in modo sicuro prima dell'inferenza;
  non possono ospitare una sessione OpenClaw.

Solo le sessioni OpenClaw ricevono il server MCP openclaw; le normali esecuzioni degli agenti
non vedono mai questo strumento. I backend CLI selezionabili/senza strumenti nativi e i modelli
con chiave API applicano quindi il ciclo letterale con un singolo strumento. I modelli app-server Codex applicano
un singolo strumento di autorità OpenClaw più l'utilità nativa inerte di pianificazione. In tutti
e tre i casi, le scritture di configurazione restano confinate al contratto di approvazione
verificato di OpenClaw.

Gemini CLI resta disponibile per gli agenti normali, ma non può applicare il
sondaggio senza strumenti richiesto dal controllo di inferenza, pertanto non può ospitare OpenClaw.

## Passaggio a un agente

Utilizzare un selettore in linguaggio naturale per uscire da OpenClaw e aprire la normale TUI:

```text
parla con l'agente
parla con l'agente di lavoro
passa all'agente principale
```

`openclaw tui`, `openclaw chat` e `openclaw terminal` aprono direttamente la normale TUI dell'agente; non avviano OpenClaw. Dopo il passaggio alla normale TUI, `/openclaw` consente di tornare a OpenClaw, facoltativamente con una richiesta successiva:

```text
/openclaw
/openclaw riavvia il gateway
```

## Modalità di ripristino tramite messaggi

La modalità di ripristino tramite messaggi è il punto di ingresso dei canali di messaggistica per OpenClaw: va utilizzata quando l'agente normale non funziona, ma un canale attendibile (ad esempio WhatsApp) continua a ricevere comandi.

Si tratta di un gestore deterministico di comandi di emergenza, non dell'agente
conversazionale OpenClaw. Non inizializza una nuova configurazione né allenta il controllo di inferenza
per la chat di OpenClaw.

Comando supportato: `/openclaw <request>`. Il ripristino accetta esclusivamente la grammatica esatta del comando digitato: il linguaggio naturale viene rifiutato con un suggerimento, non viene mai interpretato arbitrariamente come un'operazione e non viene mai consultato alcun modello.

```text
Tu, in un messaggio diretto attendibile del proprietario: /openclaw status
OpenClaw: Modalità di ripristino OpenClaw. Gateway raggiungibile: no. Configurazione valida: no.
Tu: /openclaw restart gateway
OpenClaw: Piano: riavviare il Gateway. Rispondere /openclaw yes per applicarlo.
Tu: /openclaw yes
OpenClaw: Applicato. Voce di audit registrata.
```

La creazione degli agenti può anche essere accodata localmente o tramite il ripristino:

```text
crea l'agente work con area di lavoro ~/Projects/work e modello openai/gpt-5.6-sol
/openclaw create agent work workspace ~/Projects/work
```

La creazione di un agente può specificare solo il modello predefinito attualmente verificato in tempo reale. Omettere il
modello per ereditare tale instradamento.

Il ripristino remoto è una superficie amministrativa e deve essere trattato come una riparazione remota della configurazione, non come una normale chat.

Contratto di sicurezza per il ripristino remoto:

- Disabilitato quando il sandboxing è attivo per l'agente/la sessione; OpenClaw rifiuta il ripristino remoto e rimanda alla riparazione tramite CLI locale.
- Lo stato effettivo predefinito è `auto`: consente il ripristino remoto solo durante un'operazione YOLO attendibile, in cui il runtime dispone già di autorità locale senza sandbox (`tools.exec.security` si risolve in `full` e `tools.exec.ask` si risolve in `off`, con modalità sandbox `off`).
- Richiede un'identità esplicita del proprietario; non sono consentite regole mittente con caratteri jolly, criteri di gruppo aperti, Webhook non autenticati o canali anonimi.
- Per impostazione predefinita, solo messaggi diretti del proprietario; il ripristino in gruppi/canali richiede un'attivazione esplicita.
- La ricerca e l'elenco dei plugin sono di sola lettura. L'installazione dei plugin è sempre consentita solo localmente (bloccata durante il ripristino, anche quando altrimenti abilitata), poiché scarica codice eseguibile. La disinstallazione dei plugin viene rifiutata sia in OpenClaw locale sia durante il ripristino; eseguire `openclaw plugins uninstall <id>` da un terminale.
- Il ripristino remoto non può aprire la TUI locale né passare a una sessione interattiva dell'agente; utilizzare localmente `openclaw` per il passaggio all'agente.
- Le scritture persistenti richiedono comunque l'approvazione, anche in modalità di ripristino.
- Le approvazioni in sospeso sono monouso. Qualsiasi comando di ripristino più recente per lo stesso account, canale e mittente revoca il piano precedente; anche un'esecuzione non riuscita consuma l'approvazione, quindi inviare nuovamente il comando per riprovare.
- Ogni operazione di ripristino applicata viene registrata nell'audit. Il ripristino tramite canale di messaggistica registra i metadati relativi a canale, account, mittente e indirizzo di origine; le operazioni che modificano la configurazione registrano anche gli hash della configurazione prima e dopo.
- I segreti non vengono mai visualizzati. L'ispezione di SecretRef segnala la disponibilità, non i valori.
- Se il Gateway è attivo, il ripristino privilegia le operazioni tipizzate del Gateway; se non è attivo, utilizza esclusivamente la superficie minima di riparazione locale che non dipende dal normale ciclo dell'agente.

Struttura della configurazione:

```jsonc
{
  "systemAgent": {
    "rescue": {
      "enabled": "auto",
      "ownerDmOnly": true,
      "pendingTtlMinutes": 15,
    },
  },
}
```

- `enabled`: `"auto"` (predefinito) consente il ripristino solo quando il runtime effettivo è YOLO e il sandboxing è disattivato; `false` non consente mai il ripristino tramite canale di messaggistica; `true` consente esplicitamente il ripristino quando i controlli su proprietario/canale vengono superati (resta comunque soggetto al rifiuto dovuto al sandboxing).
- `ownerDmOnly`: limita il ripristino ai messaggi diretti del proprietario. Valore predefinito `true`.
- `pendingTtlMinutes`: periodo durante il quale una scrittura di ripristino in sospeso rimane disponibile per l'approvazione `/openclaw yes` prima di scadere. Valore predefinito `15`.

`openclaw doctor --fix` migra il blocco di configurazione precedente `crestodian` in
`systemAgent`. Il runtime legge solo il blocco canonico.

Il ripristino remoto è coperto dal percorso Docker:

```bash
pnpm test:docker:system-agent-rescue
```

Un controllo smoke facoltativo della superficie dei comandi del canale in tempo reale verifica `/openclaw status` insieme a un ciclo completo di approvazione persistente tramite il gestore del ripristino:

```bash
pnpm test:live:system-agent-rescue-channel
```

La configurazione singola del pacchetto soggetta al controllo di inferenza è coperta da:

```bash
pnpm test:docker:system-agent-first-run
```

Questo percorso della CLI pacchettizzata parte con una directory di stato vuota e dimostra che OpenClaw
si blocca in modo sicuro senza inferenza. Successivamente verifica e attiva un Claude simulato tramite
il modulo di attivazione pacchettizzato. Solo dopo una richiesta approssimativa raggiunge il
pianificatore e viene risolta in una configurazione tipizzata, seguita da comandi singoli che creano un
agente aggiuntivo, configurano Discord mediante l'abilitazione di un plugin e un token
SecretRef, convalidano la configurazione e controllano il registro di audit. Questo percorso fornisce
prove di supporto sul controllo e sulle operazioni; non esercita l'onboarding interattivo né la
conversazione agente/strumento/approvazione di OpenClaw. Lo scenario QA Lab seguente reindirizza
allo stesso percorso Docker:

```bash
pnpm openclaw qa suite --scenario system-agent-ring-zero-setup
```

## Contenuti correlati

- [Riferimento CLI](/it/cli)
- [Doctor](/it/cli/doctor)
- [TUI](/it/cli/tui)
- [Sandbox](/it/cli/sandbox)
- [Sicurezza](/it/cli/security)
