---
read_when:
    - Configurare approvazioni exec o allowlist
    - Implementare l'esperienza utente di approvazione exec nell'app macOS
    - Esaminare i prompt di evasione dalla sandbox e le relative implicazioni
summary: Approvazioni exec, allowlist e prompt di evasione dalla sandbox
title: Approvazioni exec
x-i18n:
    generated_at: "2026-04-21T08:29:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0738108dd21e24eb6317d437b7ac693312743eddc3ec295ba62c4e60356cb33e
    source_path: tools/exec-approvals.md
    workflow: 15
---

# Approvazioni exec

Le approvazioni exec sono il **guardrail dell'app companion / host node** per consentire a un agente in sandbox di eseguire
comandi su un host reale (`gateway` o `node`). Pensale come un interblocco di sicurezza:
i comandi sono consentiti solo quando policy + allowlist + (facoltativa) approvazione dell'utente concordano tutte.
Le approvazioni exec sono **aggiuntive** rispetto alla policy degli strumenti e al gating elevated (a meno che elevated non sia impostato su `full`, che salta le approvazioni).
La policy effettiva è la **più restrittiva** tra `tools.exec.*` e i valori predefiniti delle approvazioni; se un campo delle approvazioni viene omesso, viene usato il valore di `tools.exec`.
L'exec host usa anche lo stato locale delle approvazioni su quella macchina. Un valore locale sull'host
`ask: "always"` in `~/.openclaw/exec-approvals.json` continua a richiedere prompt anche se
la sessione o i valori predefiniti della configurazione richiedono `ask: "on-miss"`.
Usa `openclaw approvals get`, `openclaw approvals get --gateway` oppure
`openclaw approvals get --node <id|name|ip>` per ispezionare la policy richiesta,
le sorgenti della policy host e il risultato effettivo.
Per la macchina locale, `openclaw exec-policy show` espone la stessa vista unificata e
`openclaw exec-policy set|preset` può sincronizzare in un solo passaggio la policy locale richiesta con il
file locale delle approvazioni host. Quando uno scope locale richiede `host=node`,
`openclaw exec-policy show` riporta quello scope come gestito dal node a runtime invece di
far finta che il file locale delle approvazioni sia la vera fonte effettiva.

Se l'interfaccia utente dell'app companion **non è disponibile**, qualsiasi richiesta che richiede un prompt viene
risolta tramite il **fallback ask** (predefinito: deny).

I client nativi di approvazione chat possono anche esporre affordance specifiche del canale nel
messaggio di approvazione in sospeso. Per esempio, Matrix può inizializzare shortcut di reazione sul
prompt di approvazione (`✅` consenti una volta, `❌` nega e `♾️` consenti sempre quando disponibile)
lasciando comunque i comandi `/approve ...` nel messaggio come fallback.

## Dove si applica

Le approvazioni exec sono applicate localmente sull'host di esecuzione:

- **gateway host** → processo `openclaw` sulla macchina gateway
- **node host** → runner node (app companion macOS o host node headless)

Nota sul modello di fiducia:

- I chiamanti autenticati sul Gateway sono operatori attendibili per quel Gateway.
- I node associati estendono quella capacità di operatore attendibile all'host node.
- Le approvazioni exec riducono il rischio di esecuzione accidentale, ma non sono un confine di autenticazione per utente.
- Le esecuzioni approvate sull'host node associano il contesto di esecuzione canonico: cwd canonico, argv esatto, binding env
  quando presente e percorso dell'eseguibile bloccato quando applicabile.
- Per script shell e invocazioni dirette di file tramite interprete/runtime, OpenClaw prova anche ad associare
  un singolo operando di file locale concreto. Se quel file associato cambia dopo l'approvazione ma prima dell'esecuzione,
  l'esecuzione viene negata invece di eseguire contenuto alterato.
- Questo binding del file è intenzionalmente best-effort, non un modello semantico completo di ogni
  percorso di caricamento di interprete/runtime. Se la modalità di approvazione non riesce a identificare esattamente un file locale concreto da associare, rifiuta di generare un'esecuzione supportata da approvazione invece di fingere una copertura completa.

Suddivisione macOS:

- **servizio host node** inoltra `system.run` alla **app macOS** tramite IPC locale.
- **app macOS** applica le approvazioni + esegue il comando nel contesto UI.

## Impostazioni e archiviazione

Le approvazioni risiedono in un file JSON locale sull'host di esecuzione:

`~/.openclaw/exec-approvals.json`

Schema di esempio:

```json
{
  "version": 1,
  "socket": {
    "path": "~/.openclaw/exec-approvals.sock",
    "token": "base64url-token"
  },
  "defaults": {
    "security": "deny",
    "ask": "on-miss",
    "askFallback": "deny",
    "autoAllowSkills": false
  },
  "agents": {
    "main": {
      "security": "allowlist",
      "ask": "on-miss",
      "askFallback": "deny",
      "autoAllowSkills": true,
      "allowlist": [
        {
          "id": "B0C8C0B3-2C2D-4F8A-9A3C-5A4B3C2D1E0F",
          "pattern": "~/Projects/**/bin/rg",
          "lastUsedAt": 1737150000000,
          "lastUsedCommand": "rg -n TODO",
          "lastResolvedPath": "/Users/user/Projects/.../bin/rg"
        }
      ]
    }
  }
}
```

## Modalità "YOLO" senza approvazione

Se vuoi che l'exec host venga eseguito senza prompt di approvazione, devi aprire **entrambi** i livelli di policy:

- policy exec richiesta nella configurazione di OpenClaw (`tools.exec.*`)
- policy locale delle approvazioni host in `~/.openclaw/exec-approvals.json`

Questo è ora il comportamento host predefinito, a meno che tu non lo restringa esplicitamente:

- `tools.exec.security`: `full` su `gateway`/`node`
- `tools.exec.ask`: `off`
- host `askFallback`: `full`

Distinzione importante:

- `tools.exec.host=auto` sceglie dove viene eseguito exec: sandbox quando disponibile, altrimenti gateway.
- YOLO sceglie come viene approvato l'exec host: `security=full` più `ask=off`.
- In modalità YOLO, OpenClaw non aggiunge un gate separato di approvazione euristica per l'offuscamento dei comandi né un livello di rifiuto preflight degli script sopra la policy configurata di exec host.
- `auto` non rende il routing al gateway un override libero da una sessione in sandbox. Una richiesta per chiamata `host=node` è consentita da `auto`, e `host=gateway` è consentito da `auto` solo quando non è attivo alcun runtime sandbox. Se vuoi un valore predefinito stabile non-auto, imposta `tools.exec.host` oppure usa `/exec host=...` esplicitamente.

Se vuoi una configurazione più prudente, restringi uno dei due livelli a `allowlist` / `on-miss`
oppure `deny`.

Configurazione persistente "mai chiedere" per l'host gateway:

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
openclaw gateway restart
```

Poi imposta il file delle approvazioni host in modo coerente:

```bash
openclaw approvals set --stdin <<'EOF'
{
  version: 1,
  defaults: {
    security: "full",
    ask: "off",
    askFallback: "full"
  }
}
EOF
```

Shortcut locale per la stessa policy gateway-host sulla macchina corrente:

```bash
openclaw exec-policy preset yolo
```

Questa scorciatoia locale aggiorna entrambi:

- `tools.exec.host/security/ask` locali
- i valori predefiniti locali di `~/.openclaw/exec-approvals.json`

È intenzionalmente solo locale. Se devi cambiare le approvazioni gateway-host o node-host
da remoto, continua a usare `openclaw approvals set --gateway` oppure
`openclaw approvals set --node <id|name|ip>`.

Per un host node, applica invece lo stesso file di approvazioni su quel node:

```bash
openclaw approvals set --node <id|name|ip> --stdin <<'EOF'
{
  version: 1,
  defaults: {
    security: "full",
    ask: "off",
    askFallback: "full"
  }
}
EOF
```

Importante limitazione solo locale:

- `openclaw exec-policy` non sincronizza le approvazioni del node
- `openclaw exec-policy set --host node` viene rifiutato
- le approvazioni exec del node vengono recuperate dal node a runtime, quindi gli aggiornamenti destinati al node devono usare `openclaw approvals --node ...`

Scorciatoia solo sessione:

- `/exec security=full ask=off` cambia solo la sessione corrente.
- `/elevated full` è una scorciatoia break-glass che salta anche le approvazioni exec per quella sessione.

Se il file delle approvazioni host resta più restrittivo della configurazione, continua a prevalere la policy host più restrittiva.

## Manopole della policy

### Sicurezza (`exec.security`)

- **deny**: blocca tutte le richieste di exec host.
- **allowlist**: consente solo i comandi presenti nella allowlist.
- **full**: consente tutto (equivalente a elevated).

### Ask (`exec.ask`)

- **off**: non chiedere mai.
- **on-miss**: chiedi solo quando la allowlist non corrisponde.
- **always**: chiedi per ogni comando.
- la fiducia durevole `allow-always` non sopprime i prompt quando la modalità ask effettiva è `always`

### Fallback ask (`askFallback`)

Se è richiesto un prompt ma nessuna UI è raggiungibile, il fallback decide:

- **deny**: blocca.
- **allowlist**: consente solo se la allowlist corrisponde.
- **full**: consente.

### Hardening dell'eval inline dell'interprete (`tools.exec.strictInlineEval`)

Quando `tools.exec.strictInlineEval=true`, OpenClaw tratta le forme di eval inline del codice come da-approvazione anche se il binario dell'interprete stesso è nella allowlist.

Esempi:

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

Questo è defense-in-depth per i loader di interpreti che non si mappano pulitamente a un singolo operando file stabile. In modalità strict:

- questi comandi richiedono comunque approvazione esplicita;
- `allow-always` non persiste automaticamente nuove voci di allowlist per essi.

## Allowlist (per agente)

Le allowlist sono **per agente**. Se esistono più agenti, cambia quale agente stai
modificando nell'app macOS. I pattern sono **glob case-insensitive**.
I pattern dovrebbero risolversi in **percorsi di binari** (le voci solo-basename vengono ignorate).
Le voci legacy `agents.default` vengono migrate a `agents.main` al caricamento.
Le catene shell come `echo ok && pwd` richiedono comunque che ogni segmento di primo livello soddisfi le regole della allowlist.

Esempi:

- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

Ogni voce della allowlist traccia:

- **id** UUID stabile usato per l'identità della UI (facoltativo)
- **ultimo utilizzo** timestamp
- **ultimo comando usato**
- **ultimo percorso risolto**

## Auto-allow CLI delle Skills

Quando **Auto-allow skill CLIs** è abilitato, gli eseguibili referenziati da Skills note
vengono trattati come presenti nella allowlist sui node (node macOS o host node headless). Questo usa
`skills.bins` tramite Gateway RPC per recuperare l'elenco dei binari delle Skills. Disabilitalo se vuoi allowlist manuali rigorose.

Note importanti sulla fiducia:

- Questa è una **allowlist implicita di comodità**, separata dalle voci manuali della allowlist dei percorsi.
- È pensata per ambienti di operatori attendibili in cui Gateway e node condividono lo stesso confine di fiducia.
- Se richiedi una fiducia rigorosa ed esplicita, mantieni `autoAllowSkills: false` e usa solo voci manuali della allowlist dei percorsi.

## Safe bins (solo stdin)

`tools.exec.safeBins` definisce un piccolo elenco di binari **solo-stdin** (per esempio `cut`)
che possono essere eseguiti in modalità allowlist **senza** voci esplicite di allowlist. I safe bins rifiutano
argomenti posizionali di file e token simili a percorsi, quindi possono operare solo sul flusso in ingresso.
Tratta questo come un percorso rapido ristretto per filtri di stream, non come una lista generale di fiducia.
**Non** aggiungere binari di interpreti o runtime (per esempio `python3`, `node`, `ruby`, `bash`, `sh`, `zsh`) a `safeBins`.
Se un comando può valutare codice, eseguire sottocomandi o leggere file per progettazione, preferisci voci esplicite di allowlist e mantieni abilitati i prompt di approvazione.
I safe bins personalizzati devono definire un profilo esplicito in `tools.exec.safeBinProfiles.<bin>`.
La validazione è deterministica solo dalla forma di argv (nessun controllo dell'esistenza sul filesystem host), il che
impedisce comportamenti da oracolo dell'esistenza dei file dovuti a differenze allow/deny.
Le opzioni orientate ai file vengono negate per i safe bins predefiniti (per esempio `sort -o`, `sort --output`,
`sort --files0-from`, `sort --compress-program`, `sort --random-source`,
`sort --temporary-directory`/`-T`, `wc --files0-from`, `jq -f/--from-file`,
`grep -f/--file`).
I safe bins applicano anche una policy esplicita per binario sui flag che rompono il comportamento solo-stdin
(per esempio `sort -o/--output/--compress-program` e i flag ricorsivi di grep).
Le opzioni lunghe vengono validate fail-closed in modalità safe-bin: flag sconosciuti e abbreviazioni ambigue vengono rifiutati.
Flag negati per profilo safe-bin:

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

I safe bins forzano anche che i token argv vengano trattati come **testo letterale** al momento dell'esecuzione (niente globbing
e nessuna espansione di `$VARS`) per i segmenti solo-stdin, così pattern come `*` o `$HOME/...` non possono
essere usati per far passare di nascosto letture di file.
I safe bins devono anche risolversi da directory di binari attendibili (valori di sistema predefiniti più eventuali
`tools.exec.safeBinTrustedDirs`). Le voci `PATH` non sono mai automaticamente attendibili.
Le directory attendibili predefinite per i safe bins sono intenzionalmente minime: `/bin`, `/usr/bin`.
Se il tuo eseguibile safe-bin si trova in percorsi utente/package manager (per esempio
`/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`), aggiungili esplicitamente
a `tools.exec.safeBinTrustedDirs`.
Le concatenazioni shell e i reindirizzamenti non sono consentiti automaticamente in modalità allowlist.

La concatenazione shell (`&&`, `||`, `;`) è consentita quando ogni segmento di primo livello soddisfa la allowlist
(inclusi safe bins o auto-allow delle Skills). I reindirizzamenti restano non supportati in modalità allowlist.
La sostituzione di comando (`$()` / backtick) viene rifiutata durante il parsing della allowlist, anche all'interno
di doppi apici; usa apici singoli se hai bisogno di testo letterale `$()`.
Nelle approvazioni dell'app companion macOS, il testo shell raw che contiene sintassi di controllo o espansione shell
(`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) viene trattato come miss della allowlist a meno che
il binario shell stesso non sia nella allowlist.
Per i wrapper shell (`bash|sh|zsh ... -c/-lc`), gli override env con scope di richiesta vengono ridotti a una
piccola allowlist esplicita (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
Per le decisioni allow-always in modalità allowlist, i wrapper di dispatch noti
(`env`, `nice`, `nohup`, `stdbuf`, `timeout`) persistono i percorsi degli eseguibili interni invece dei
percorsi dei wrapper. Anche i multiplexer shell (`busybox`, `toybox`) vengono decomposti per le applet shell (`sh`, `ash`,
ecc.) così vengono persistiti gli eseguibili interni invece dei binari multiplexer. Se un wrapper o
multiplexer non può essere decomposto in modo sicuro, nessuna voce della allowlist viene persistita automaticamente.
Se inserisci nella allowlist interpreti come `python3` o `node`, preferisci `tools.exec.strictInlineEval=true` così l'eval inline richiede comunque approvazione esplicita. In modalità strict, `allow-always` può ancora persistere invocazioni innocue di interpreti/script, ma i vettori di inline-eval non vengono persistiti automaticamente.

Safe bins predefiniti:

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` e `sort` non sono nell'elenco predefinito. Se fai opt-in, mantieni voci esplicite di allowlist per
i loro flussi di lavoro non-stdin.
Per `grep` in modalità safe-bin, fornisci il pattern con `-e`/`--regexp`; la forma con pattern posizionale viene
rifiutata così gli operandi file non possono essere fatti passare di nascosto come posizionali ambigui.

### Safe bins rispetto alla allowlist

| Argomento        | `tools.exec.safeBins`                                  | Allowlist (`exec-approvals.json`)                            |
| ---------------- | ------------------------------------------------------ | ------------------------------------------------------------ |
| Obiettivo        | Consentire automaticamente filtri stretti solo-stdin   | Accordare fiducia esplicita a eseguibili specifici           |
| Tipo di corrispondenza | Nome dell'eseguibile + policy argv safe-bin      | Pattern glob del percorso dell'eseguibile risolto            |
| Scope degli argomenti | Limitato dal profilo safe-bin e dalle regole dei token letterali | Solo corrispondenza del percorso; per il resto gli argomenti sono responsabilità tua |
| Esempi tipici    | `head`, `tail`, `tr`, `wc`                             | `jq`, `python3`, `node`, `ffmpeg`, CLI personalizzate        |
| Uso migliore     | Trasformazioni testuali a basso rischio nelle pipeline | Qualsiasi strumento con comportamento o effetti collaterali più ampi |

Posizione della configurazione:

- `safeBins` proviene dalla configurazione (`tools.exec.safeBins` oppure per agente `agents.list[].tools.exec.safeBins`).
- `safeBinTrustedDirs` proviene dalla configurazione (`tools.exec.safeBinTrustedDirs` oppure per agente `agents.list[].tools.exec.safeBinTrustedDirs`).
- `safeBinProfiles` proviene dalla configurazione (`tools.exec.safeBinProfiles` oppure per agente `agents.list[].tools.exec.safeBinProfiles`). Le chiavi del profilo per agente sovrascrivono quelle globali.
- Le voci della allowlist risiedono nell'host locale `~/.openclaw/exec-approvals.json` sotto `agents.<id>.allowlist` (oppure tramite UI di controllo / `openclaw approvals allowlist ...`).
- `openclaw security audit` avvisa con `tools.exec.safe_bins_interpreter_unprofiled` quando binari interprete/runtime compaiono in `safeBins` senza profili espliciti.
- `openclaw doctor --fix` può generare in modo guidato le voci mancanti `safeBinProfiles.<bin>` come `{}` (rivedile e restringile dopo). I binari interprete/runtime non vengono generati automaticamente.

Esempio di profilo personalizzato:
__OC_I18N_900005__
Se fai esplicitamente opt-in di `jq` in `safeBins`, OpenClaw continua a rifiutare la builtin `env` in modalità safe-bin
così `jq -n env` non può scaricare l'ambiente del processo host senza un percorso esplicito nella allowlist
o un prompt di approvazione.

## Modifica nella Control UI

Usa la scheda **Control UI → Nodes → Exec approvals** per modificare valori predefiniti, override
per agente e allowlist. Scegli uno scope (Defaults o un agente), modifica la policy,
aggiungi/rimuovi pattern della allowlist, poi fai clic su **Save**. La UI mostra i metadati di **ultimo utilizzo**
per pattern così puoi mantenere ordinato l'elenco.

Il selettore del target sceglie **Gateway** (approvazioni locali) oppure un **Node**. I node
devono pubblicizzare `system.execApprovals.get/set` (app macOS o host node headless).
Se un node non pubblicizza ancora le exec approvals, modifica direttamente il suo
`~/.openclaw/exec-approvals.json` locale.

CLI: `openclaw approvals` supporta la modifica di gateway o node (consulta [Approvals CLI](/cli/approvals)).

## Flusso di approvazione

Quando è richiesto un prompt, il gateway trasmette `exec.approval.requested` ai client operatore.
La Control UI e l'app macOS lo risolvono tramite `exec.approval.resolve`, poi il gateway inoltra la
richiesta approvata all'host node.

Per `host=node`, le richieste di approvazione includono un payload canonico `systemRunPlan`. Il gateway usa
quel piano come contesto autorevole di comando/cwd/sessione quando inoltra le richieste
approvate `system.run`.

Questo è importante per la latenza dell'approvazione asincrona:

- il percorso exec del node prepara in anticipo un piano canonico
- il record di approvazione memorizza quel piano e i relativi metadati di binding
- una volta approvata, la chiamata finale `system.run` inoltrata riutilizza il piano memorizzato
  invece di fidarsi di modifiche successive del chiamante
- se il chiamante cambia `command`, `rawCommand`, `cwd`, `agentId` o
  `sessionKey` dopo la creazione della richiesta di approvazione, il gateway rifiuta
  l'esecuzione inoltrata come approval mismatch

## Comandi interprete/runtime

Le esecuzioni approvate di interprete/runtime sono intenzionalmente conservative:

- Il contesto esatto argv/cwd/env viene sempre associato.
- Le forme dirette di script shell e file runtime vengono associate in modalità best-effort a uno snapshot concreto di un file locale.
- Le comuni forme wrapper dei package manager che si risolvono comunque in un file locale diretto (per esempio
  `pnpm exec`, `pnpm node`, `npm exec`, `npx`) vengono decomposte prima del binding.
- Se OpenClaw non riesce a identificare esattamente un file locale concreto per un comando interprete/runtime
  (per esempio script di pacchetto, forme eval, catene di loader specifiche del runtime o forme ambigue
  multi-file), l'esecuzione supportata da approvazione viene negata invece di rivendicare una copertura semantica che non
  ha.
- Per questi flussi di lavoro, preferisci la sandboxing, un confine host separato o un flusso esplicito trusted
  allowlist/full in cui l'operatore accetta la semantica runtime più ampia.

Quando sono richieste approvazioni, lo strumento exec restituisce immediatamente un ID di approvazione. Usa quell'ID per
correlare eventi di sistema successivi (`Exec finished` / `Exec denied`). Se non arriva alcuna decisione prima del
timeout, la richiesta viene trattata come timeout di approvazione e mostrata come motivo di diniego.

### Comportamento di consegna del follow-up

Dopo che un exec asincrono approvato termina, OpenClaw invia un turno `agent` di follow-up alla stessa sessione.

- Se esiste un target di consegna esterno valido (canale consegnabile più target `to`), la consegna del follow-up usa quel canale.
- Nei flussi solo-webchat o solo-sessione interna senza target esterno, la consegna del follow-up resta solo-sessione (`deliver: false`).
- Se un chiamante richiede esplicitamente consegna esterna rigorosa senza un canale esterno risolvibile, la richiesta fallisce con `INVALID_REQUEST`.
- Se `bestEffortDeliver` è abilitato e non è possibile risolvere alcun canale esterno, la consegna viene degradata a solo-sessione invece di fallire.

La finestra di dialogo di conferma include:

- comando + argomenti
- cwd
- ID agente
- percorso dell'eseguibile risolto
- host + metadati della policy

Azioni:

- **Allow once** → esegui ora
- **Always allow** → aggiungi alla allowlist + esegui
- **Deny** → blocca

## Inoltro delle approvazioni ai canali chat

Puoi inoltrare i prompt di approvazione exec a qualsiasi canale chat (inclusi i canali plugin) e approvarli
con `/approve`. Questo usa la normale pipeline di consegna outbound.

Configurazione:
__OC_I18N_900006__
Rispondi in chat:
__OC_I18N_900007__
Il comando `/approve` gestisce sia le approvazioni exec sia le approvazioni plugin. Se l'ID non corrisponde a un'approvazione exec in sospeso, controlla automaticamente le approvazioni plugin.

### Inoltro delle approvazioni plugin

L'inoltro delle approvazioni plugin usa la stessa pipeline di consegna delle approvazioni exec ma ha una propria
configurazione indipendente sotto `approvals.plugin`. Abilitare o disabilitare una non influisce sull'altra.
__OC_I18N_900008__
La forma della configurazione è identica a `approvals.exec`: `enabled`, `mode`, `agentFilter`,
`sessionFilter` e `targets` funzionano allo stesso modo.

I canali che supportano risposte interattive condivise renderizzano gli stessi pulsanti di approvazione sia per approvazioni exec sia per approvazioni plugin. I canali senza UI interattiva condivisa ricadono su testo semplice con istruzioni `/approve`.

### Approvazioni nella stessa chat su qualsiasi canale

Quando una richiesta di approvazione exec o plugin proviene da una superficie chat consegnabile, la stessa chat
può ora approvarla con `/approve` per impostazione predefinita. Questo si applica a canali come Slack, Matrix e
Microsoft Teams oltre ai flussi già esistenti di Web UI e terminal UI.

Questo percorso condiviso con comando testuale usa il normale modello di autenticazione del canale per quella
conversazione. Se la chat di origine può già inviare comandi e ricevere risposte, le richieste di approvazione non hanno più bisogno di un adapter di consegna nativo separato solo per restare in sospeso.

Anche Discord e Telegram supportano `/approve` nella stessa chat, ma questi canali continuano a usare il
proprio elenco risolto di approvatori per l'autorizzazione anche quando la consegna nativa delle approvazioni è disabilitata.

Per Telegram e altri client nativi di approvazione che chiamano direttamente il Gateway,
questo fallback è intenzionalmente limitato ai fallimenti “approval not found”. Un vero
diniego/errore di approvazione exec non viene ritentato silenziosamente come approvazione plugin.

### Consegna nativa delle approvazioni

Alcuni canali possono anche agire come client nativi di approvazione. I client nativi aggiungono DM agli approvatori, fanout alla chat di origine ed esperienza utente interattiva di approvazione specifica del canale sopra il flusso condiviso `/approve` nella stessa chat.

Quando sono disponibili card/pulsanti di approvazione nativi, quella UI nativa è il percorso principale
rivolto all'agente. L'agente non dovrebbe anche ripetere un comando in chat semplice
`/approve` duplicato a meno che il risultato dello strumento non dica che le approvazioni via chat non sono disponibili o
che l'approvazione manuale sia l'unico percorso rimasto.

Modello generico:

- la policy exec host decide comunque se è richiesta l'approvazione exec
- `approvals.exec` controlla l'inoltro dei prompt di approvazione ad altre destinazioni chat
- `channels.<channel>.execApprovals` controlla se quel canale agisce come client nativo di approvazione

I client nativi di approvazione abilitano automaticamente la consegna DM-first quando tutte queste condizioni sono vere:

- il canale supporta la consegna nativa delle approvazioni
- gli approvatori possono essere risolti da `execApprovals.approvers` esplicito o dalle
  sorgenti di fallback documentate di quel canale
- `channels.<channel>.execApprovals.enabled` non è impostato oppure è `"auto"`

Imposta `enabled: false` per disabilitare esplicitamente un client nativo di approvazione. Imposta `enabled: true` per forzarne
l'attivazione quando gli approvatori vengono risolti. La consegna pubblica alla chat di origine resta esplicita tramite
`channels.<channel>.execApprovals.target`.

FAQ: [Why are there two exec approval configs for chat approvals?](/help/faq#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord: `channels.discord.execApprovals.*`
- Slack: `channels.slack.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`

Questi client nativi di approvazione aggiungono routing DM e fanout facoltativo al canale sopra il flusso condiviso
`/approve` nella stessa chat e i pulsanti condivisi di approvazione.

Comportamento condiviso:

- Slack, Matrix, Microsoft Teams e chat consegnabili simili usano il normale modello di autenticazione del canale
  per `/approve` nella stessa chat
- quando un client nativo di approvazione si abilita automaticamente, il target predefinito di consegna nativa è costituito dai DM degli approvatori
- per Discord e Telegram, solo gli approvatori risolti possono approvare o negare
- Gli approvatori Discord possono essere espliciti (`execApprovals.approvers`) o dedotti da `commands.ownerAllowFrom`
- Gli approvatori Telegram possono essere espliciti (`execApprovals.approvers`) o dedotti dalla configurazione owner esistente (`allowFrom`, più `defaultTo` per messaggi diretti dove supportato)
- Gli approvatori Slack possono essere espliciti (`execApprovals.approvers`) o dedotti da `commands.ownerAllowFrom`
- I pulsanti nativi Slack preservano il tipo dell'ID di approvazione, così gli ID `plugin:` possono risolvere approvazioni plugin senza un secondo livello di fallback locale Slack
- Il routing nativo DM/canale di Matrix e le shortcut di reazione gestiscono sia approvazioni exec sia plugin; l'autorizzazione plugin continua a provenire da `channels.matrix.dm.allowFrom`
- il richiedente non deve essere necessariamente un approvatore
- la chat di origine può approvare direttamente con `/approve` quando quella chat supporta già comandi e risposte
- i pulsanti nativi di approvazione Discord instradano in base al tipo di ID di approvazione: gli ID `plugin:` vanno
  direttamente alle approvazioni plugin, tutto il resto va alle approvazioni exec
- i pulsanti nativi Telegram seguono lo stesso fallback limitato da exec a plugin di `/approve`
- quando `target` nativo abilita la consegna alla chat di origine, i prompt di approvazione includono il testo del comando
- le approvazioni exec in sospeso scadono dopo 30 minuti per impostazione predefinita
- se nessuna UI operatore o client di approvazione configurato può accettare la richiesta, il prompt ricade su `askFallback`

Telegram usa come impostazione predefinita i DM degli approvatori (`target: "dm"`). Puoi passare a `channel` o `both` quando
vuoi che i prompt di approvazione compaiano anche nella chat/topic Telegram di origine. Per i topic forum Telegram, OpenClaw preserva il topic per il prompt di approvazione e per il follow-up post-approvazione.

Consulta:

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### Flusso IPC macOS
__OC_I18N_900009__
Note di sicurezza:

- Modalità socket Unix `0600`, token memorizzato in `exec-approvals.json`.
- Controllo peer con stesso UID.
- Challenge/response (nonce + token HMAC + hash della richiesta) + TTL breve.

## Eventi di sistema

Il ciclo di vita exec viene esposto come messaggi di sistema:

- `Exec running` (solo se il comando supera la soglia di notifica running)
- `Exec finished`
- `Exec denied`

Questi vengono pubblicati nella sessione dell'agente dopo che il node segnala l'evento.
Le approvazioni exec dell'host gateway emettono gli stessi eventi del ciclo di vita quando il comando termina (e facoltativamente quando è in esecuzione più a lungo della soglia).
Gli exec protetti da approvazione riutilizzano l'ID di approvazione come `runId` in questi messaggi per una correlazione semplice.

## Comportamento in caso di approvazione negata

Quando un'approvazione exec asincrona viene negata, OpenClaw impedisce all'agente di riutilizzare
l'output di una precedente esecuzione dello stesso comando nella sessione. Il motivo del diniego
viene passato con una guida esplicita che indica che non è disponibile alcun output del comando, impedendo così
all'agente di affermare che esiste nuovo output o di ripetere il comando negato con
risultati obsoleti provenienti da una precedente esecuzione riuscita.

## Implicazioni

- **full** è potente; preferisci le allowlist quando possibile.
- **ask** ti mantiene nel loop consentendo comunque approvazioni rapide.
- Le allowlist per agente impediscono che le approvazioni di un agente si propaghino ad altri.
- Le approvazioni si applicano solo alle richieste di exec host provenienti da **mittenti autorizzati**. I mittenti non autorizzati non possono emettere `/exec`.
- `/exec security=full` è una comodità a livello di sessione per operatori autorizzati e salta per progettazione le approvazioni.
  Per bloccare rigidamente l'exec host, imposta la sicurezza delle approvazioni su `deny` o nega lo strumento `exec` tramite la policy degli strumenti.

Correlati:

- [Exec tool](/it/tools/exec)
- [Elevated mode](/it/tools/elevated)
- [Skills](/it/tools/skills)

## Correlati

- [Exec](/it/tools/exec) — strumento di esecuzione dei comandi shell
- [Sandboxing](/it/gateway/sandboxing) — modalità sandbox e accesso al workspace
- [Security](/it/gateway/security) — modello di sicurezza e hardening
- [Sandbox vs Tool Policy vs Elevated](/it/gateway/sandbox-vs-tool-policy-vs-elevated) — quando usare ciascuno
