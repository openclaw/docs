---
read_when:
    - Configurazione delle approvazioni exec o delle allowlist
    - Implementazione della UX di approvazione exec nell'app macOS
    - Revisione dei prompt di uscita dalla sandbox e delle relative implicazioni
summary: Approvazioni exec, allowlist e prompt di uscita dalla sandbox
title: Approvazioni exec
x-i18n:
    generated_at: "2026-04-10T08:14:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5f4a2e2f1f3c13a1d1926c9de0720513ea8a74d1ca571dbe74b188d8c560c14c
    source_path: tools/exec-approvals.md
    workflow: 15
---

# Approvazioni exec

Le approvazioni exec sono la **protezione dell'app companion / dell'host del nodo** per consentire a un agente sandboxed di eseguire
comandi su un host reale (`gateway` o `node`). Considerale come un interblocco di sicurezza:
i comandi sono consentiti solo quando criteri + allowlist + approvazione utente (facoltativa) sono tutti concordi.
Le approvazioni exec sono **in aggiunta** ai criteri degli strumenti e ai controlli elevati (a meno che elevated sia impostato su `full`, che salta le approvazioni).
Il criterio effettivo è il **più restrittivo** tra i valori predefiniti di `tools.exec.*` e delle approvazioni; se un campo delle approvazioni viene omesso, viene usato il valore di `tools.exec`.
L'exec host usa anche lo stato locale delle approvazioni su quella macchina. Un valore locale sull'host
`ask: "always"` in `~/.openclaw/exec-approvals.json` continua a richiedere conferma anche se
la sessione o i valori predefiniti della configurazione richiedono `ask: "on-miss"`.
Usa `openclaw approvals get`, `openclaw approvals get --gateway` oppure
`openclaw approvals get --node <id|name|ip>` per ispezionare il criterio richiesto,
le origini dei criteri host e il risultato effettivo.
Per la macchina locale, `openclaw exec-policy show` espone la stessa vista unificata e
`openclaw exec-policy set|preset` può sincronizzare in un unico passaggio il criterio richiesto locale con il
file locale delle approvazioni host. Quando un ambito locale richiede `host=node`,
`openclaw exec-policy show` segnala quell'ambito come gestito dal nodo in fase di esecuzione invece di
far finta che il file locale delle approvazioni sia la fonte effettiva di verità.

Se l'interfaccia dell'app companion **non è disponibile**, qualsiasi richiesta che richiede un prompt viene
risolta dal **fallback ask** (predefinito: deny).

I client di approvazione nativi della chat possono anche esporre affordance specifiche del canale nel
messaggio di approvazione in attesa. Ad esempio, Matrix può precompilare scorciatoie tramite reaction nel
prompt di approvazione (`✅` consenti una volta, `❌` nega e `♾️` consenti sempre quando disponibile)
continuando comunque a lasciare i comandi `/approve ...` nel messaggio come fallback.

## Dove si applica

Le approvazioni exec vengono applicate localmente sull'host di esecuzione:

- **host gateway** → processo `openclaw` sulla macchina gateway
- **host nodo** → runner del nodo (app companion macOS o host nodo headless)

Nota sul modello di fiducia:

- I chiamanti autenticati dal Gateway sono operatori attendibili per quel Gateway.
- I nodi accoppiati estendono questa capacità di operatore attendibile all'host del nodo.
- Le approvazioni exec riducono il rischio di esecuzione accidentale, ma non sono un confine di autenticazione per utente.
- Le esecuzioni approvate sull'host del nodo vincolano il contesto di esecuzione canonico: `cwd` canonico, `argv` esatto, binding di `env`
  quando presente e percorso dell'eseguibile fissato quando applicabile.
- Per script shell e invocazioni dirette di file tramite interprete/runtime, OpenClaw cerca anche di vincolare
  un unico operando file locale concreto. Se quel file vincolato cambia dopo l'approvazione ma prima dell'esecuzione,
  l'esecuzione viene negata invece di eseguire contenuto modificato.
- Questo binding del file è intenzionalmente best-effort, non un modello semantico completo di ogni
  percorso di caricamento di interpreti/runtime. Se la modalità di approvazione non riesce a identificare esattamente un unico
  file locale concreto da vincolare, rifiuta di emettere un'esecuzione supportata da approvazione invece di fingere una copertura completa.

Separazione macOS:

- **servizio host del nodo** inoltra `system.run` alla **app macOS** tramite IPC locale.
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

Se vuoi che l'exec host venga eseguito senza prompt di approvazione, devi aprire **entrambi** i livelli di criterio:

- criterio exec richiesto nella configurazione di OpenClaw (`tools.exec.*`)
- criterio locale delle approvazioni host in `~/.openclaw/exec-approvals.json`

Questo è ora il comportamento host predefinito, a meno che tu non lo renda esplicitamente più restrittivo:

- `tools.exec.security`: `full` su `gateway`/`node`
- `tools.exec.ask`: `off`
- host `askFallback`: `full`

Distinzione importante:

- `tools.exec.host=auto` sceglie dove viene eseguito exec: nella sandbox quando disponibile, altrimenti sul gateway.
- YOLO sceglie come viene approvato l'exec host: `security=full` più `ask=off`.
- In modalità YOLO, OpenClaw non aggiunge un controllo di approvazione separato basato su euristiche di offuscamento dei comandi sopra il criterio exec host configurato.
- `auto` non rende il routing gateway una sostituzione libera da una sessione sandboxed. Una richiesta per chiamata `host=node` è consentita da `auto`, e `host=gateway` è consentito da `auto` solo quando non è attivo alcun runtime sandbox. Se vuoi un valore predefinito stabile non auto, imposta `tools.exec.host` o usa `/exec host=...` esplicitamente.

Se vuoi una configurazione più conservativa, riporta uno dei due livelli a `allowlist` / `on-miss`
o `deny`.

Configurazione persistente dell'host gateway "non chiedere mai":

```bash
openclaw config set tools.exec.host gateway
openclaw config set tools.exec.security full
openclaw config set tools.exec.ask off
openclaw gateway restart
```

Poi imposta il file delle approvazioni host in modo corrispondente:

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

Scorciatoia locale per lo stesso criterio host gateway sulla macchina corrente:

```bash
openclaw exec-policy preset yolo
```

Questa scorciatoia locale aggiorna entrambi:

- `tools.exec.host/security/ask` locali
- valori predefiniti locali di `~/.openclaw/exec-approvals.json`

È intenzionalmente solo locale. Se devi modificare da remoto le approvazioni dell'host gateway o dell'host nodo,
continua a usare `openclaw approvals set --gateway` oppure
`openclaw approvals set --node <id|name|ip>`.

Per un host nodo, applica invece lo stesso file di approvazioni su quel nodo:

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

- `openclaw exec-policy` non sincronizza le approvazioni del nodo
- `openclaw exec-policy set --host node` viene rifiutato
- le approvazioni exec del nodo vengono recuperate dal nodo in fase di esecuzione, quindi gli aggiornamenti destinati al nodo devono usare `openclaw approvals --node ...`

Scorciatoia solo sessione:

- `/exec security=full ask=off` modifica solo la sessione corrente.
- `/elevated full` è una scorciatoia di emergenza che salta anche le approvazioni exec per quella sessione.

Se il file delle approvazioni host resta più restrittivo della configurazione, continua comunque a prevalere il criterio host più restrittivo.

## Manopole del criterio

### Security (`exec.security`)

- **deny**: blocca tutte le richieste di exec host.
- **allowlist**: consente solo i comandi presenti nell'allowlist.
- **full**: consente tutto (equivalente a elevated).

### Ask (`exec.ask`)

- **off**: non richiedere mai conferma.
- **on-miss**: richiedi conferma solo quando l'allowlist non corrisponde.
- **always**: richiedi conferma per ogni comando.
- la fiducia durevole `allow-always` non sopprime i prompt quando la modalità ask effettiva è `always`

### Ask fallback (`askFallback`)

Se è richiesto un prompt ma non è raggiungibile alcuna UI, il fallback decide:

- **deny**: blocca.
- **allowlist**: consenti solo se l'allowlist corrisponde.
- **full**: consenti.

### Hardening dell'eval inline dell'interprete (`tools.exec.strictInlineEval`)

Quando `tools.exec.strictInlineEval=true`, OpenClaw tratta le forme inline di code-eval come soggette a sola approvazione anche se il binario dell'interprete stesso è nell'allowlist.

Esempi:

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

Questa è una difesa in profondità per i loader degli interpreti che non si mappano in modo pulito a un unico operando file stabile. In modalità strict:

- questi comandi richiedono comunque approvazione esplicita;
- `allow-always` non rende persistenti automaticamente nuove voci di allowlist per essi.

## Allowlist (per agente)

Le allowlist sono **per agente**. Se esistono più agenti, cambia l'agente che stai
modificando nell'app macOS. I pattern sono **corrispondenze glob case-insensitive**.
I pattern devono risolversi in **percorsi di binari** (le voci con solo basename vengono ignorate).
Le voci legacy `agents.default` vengono migrate a `agents.main` al caricamento.
Le catene shell come `echo ok && pwd` richiedono comunque che ogni segmento di primo livello soddisfi le regole dell'allowlist.

Esempi:

- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

Ogni voce dell'allowlist tiene traccia di:

- **id** UUID stabile usato per l'identità UI (facoltativo)
- **ultimo utilizzo** timestamp
- **ultimo comando usato**
- **ultimo percorso risolto**

## Auto-consenti le CLI delle skill

Quando **Auto-consenti le CLI delle skill** è abilitato, gli eseguibili referenziati da skill note
vengono trattati come presenti nell'allowlist sui nodi (nodo macOS o host nodo headless). Questo usa
`skills.bins` tramite Gateway RPC per recuperare l'elenco dei binari delle skill. Disabilitalo se vuoi allowlist manuali rigorose.

Note importanti sul modello di fiducia:

- Questa è un'**allowlist implicita di comodità**, separata dalle voci manuali di allowlist per percorso.
- È pensata per ambienti con operatori attendibili in cui Gateway e nodo si trovano nello stesso confine di fiducia.
- Se richiedi una fiducia esplicita rigorosa, mantieni `autoAllowSkills: false` e usa solo voci manuali di allowlist per percorso.

## Safe bins (solo stdin)

`tools.exec.safeBins` definisce un piccolo elenco di binari **solo stdin** (ad esempio `cut`)
che possono essere eseguiti in modalità allowlist **senza** voci esplicite di allowlist. I safe bin rifiutano
argomenti file posizionali e token simili a percorsi, quindi possono operare solo sullo stream in ingresso.
Consideralo un percorso rapido e limitato per i filtri di stream, non un elenco generale di fiducia.
**Non** aggiungere binari di interpreti o runtime (ad esempio `python3`, `node`, `ruby`, `bash`, `sh`, `zsh`) a `safeBins`.
Se un comando può valutare codice, eseguire sottocomandi o leggere file per progettazione, preferisci voci esplicite di allowlist e mantieni abilitati i prompt di approvazione.
I safe bin personalizzati devono definire un profilo esplicito in `tools.exec.safeBinProfiles.<bin>`.
La validazione è deterministica solo dalla forma di `argv` (senza controlli sull'esistenza del filesystem host), cosa che
impedisce comportamenti di tipo oracolo di esistenza dei file dalle differenze tra allow/deny.
Le opzioni orientate ai file vengono negate per i safe bin predefiniti (ad esempio `sort -o`, `sort --output`,
`sort --files0-from`, `sort --compress-program`, `sort --random-source`,
`sort --temporary-directory`/`-T`, `wc --files0-from`, `jq -f/--from-file`,
`grep -f/--file`).
I safe bin applicano inoltre un criterio esplicito per-binario sui flag per le opzioni che interrompono il
comportamento solo stdin (ad esempio `sort -o/--output/--compress-program` e i flag ricorsivi di grep).
Le opzioni lunghe vengono validate in modalità safe-bin in modo fail-closed: i flag sconosciuti e le
abbreviazioni ambigue vengono rifiutati.
Flag negati per profilo safe-bin:

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

I safe bin forzano inoltre che i token `argv` vengano trattati come **testo letterale** al momento dell'esecuzione (nessun globbing
e nessuna espansione di `$VARS`) per i segmenti solo stdin, quindi pattern come `*` o `$HOME/...` non possono essere
usati per introdurre di nascosto letture di file.
I safe bin devono inoltre risolversi da directory di binari attendibili (valori predefiniti di sistema più eventuali
`tools.exec.safeBinTrustedDirs`). Le voci di `PATH` non vengono mai considerate attendibili automaticamente.
Le directory attendibili predefinite per i safe bin sono intenzionalmente minime: `/bin`, `/usr/bin`.
Se il tuo eseguibile safe-bin si trova in percorsi package-manager/utente (ad esempio
`/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`), aggiungili esplicitamente
a `tools.exec.safeBinTrustedDirs`.
Le concatenazioni shell e i reindirizzamenti non sono consentiti automaticamente in modalità allowlist.

La concatenazione shell (`&&`, `||`, `;`) è consentita quando ogni segmento di primo livello soddisfa l'allowlist
(inclusi safe bin o auto-consenti delle skill). I reindirizzamenti restano non supportati in modalità allowlist.
La sostituzione di comandi (`$()` / backtick) viene rifiutata durante il parsing dell'allowlist, incluso all'interno
delle virgolette doppie; usa virgolette singole se ti serve testo letterale `$()`.
Nelle approvazioni dell'app companion macOS, il testo shell grezzo contenente sintassi di controllo o espansione shell
(`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) viene trattato come mancata corrispondenza dell'allowlist a meno che
il binario della shell stessa non sia nell'allowlist.
Per i wrapper shell (`bash|sh|zsh ... -c/-lc`), gli override `env` con ambito richiesta vengono ridotti a una
piccola allowlist esplicita (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
Per le decisioni allow-always in modalità allowlist, i wrapper di dispatch noti
(`env`, `nice`, `nohup`, `stdbuf`, `timeout`) persistono i percorsi degli eseguibili interni invece dei
percorsi dei wrapper. Anche i multiplexer shell (`busybox`, `toybox`) vengono spacchettati per le applet shell (`sh`, `ash`,
ecc.) così che vengano persistiti gli eseguibili interni invece dei binari del multiplexer. Se un wrapper o
un multiplexer non può essere spacchettato in modo sicuro, nessuna voce di allowlist viene persistita automaticamente.
Se inserisci interpreti come `python3` o `node` nell'allowlist, preferisci `tools.exec.strictInlineEval=true` così l'eval inline richiede comunque un'approvazione esplicita. In modalità strict, `allow-always` può comunque rendere persistenti invocazioni innocue di interpreti/script, ma i vettori di inline-eval non vengono persistiti automaticamente.

Safe bin predefiniti:

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` e `sort` non sono nell'elenco predefinito. Se li abiliti esplicitamente, mantieni voci di allowlist esplicite per
i loro flussi di lavoro non-stdin.
Per `grep` in modalità safe-bin, fornisci il pattern con `-e`/`--regexp`; la forma con pattern posizionale viene
rifiutata così che gli operandi file non possano essere introdotti di nascosto come posizionali ambigui.

### Safe bin rispetto all'allowlist

| Argomento        | `tools.exec.safeBins`                                  | Allowlist (`exec-approvals.json`)                            |
| ---------------- | ------------------------------------------------------ | ------------------------------------------------------------ |
| Obiettivo        | Consenti automaticamente filtri stdin limitati         | Considera attendibili esplicitamente eseguibili specifici    |
| Tipo di match    | Nome dell'eseguibile + criterio `argv` del safe-bin    | Pattern glob del percorso dell'eseguibile risolto            |
| Ambito argomenti | Limitato dal profilo safe-bin e dalle regole dei token letterali | Solo match del percorso; per il resto gli argomenti sono tua responsabilità |
| Esempi tipici    | `head`, `tail`, `tr`, `wc`                             | `jq`, `python3`, `node`, `ffmpeg`, CLI personalizzate        |
| Uso migliore     | Trasformazioni di testo a basso rischio nelle pipeline | Qualsiasi strumento con comportamento più ampio o effetti collaterali |

Posizione della configurazione:

- `safeBins` proviene dalla configurazione (`tools.exec.safeBins` o per-agente `agents.list[].tools.exec.safeBins`).
- `safeBinTrustedDirs` proviene dalla configurazione (`tools.exec.safeBinTrustedDirs` o per-agente `agents.list[].tools.exec.safeBinTrustedDirs`).
- `safeBinProfiles` proviene dalla configurazione (`tools.exec.safeBinProfiles` o per-agente `agents.list[].tools.exec.safeBinProfiles`). Le chiavi di profilo per-agente sovrascrivono le chiavi globali.
- le voci di allowlist risiedono nel file locale dell'host `~/.openclaw/exec-approvals.json` in `agents.<id>.allowlist` (oppure tramite Control UI / `openclaw approvals allowlist ...`).
- `openclaw security audit` avvisa con `tools.exec.safe_bins_interpreter_unprofiled` quando binari di interpreti/runtime compaiono in `safeBins` senza profili espliciti.
- `openclaw doctor --fix` può generare le voci mancanti `safeBinProfiles.<bin>` come `{}` (rivedile e rendile più restrittive in seguito). I binari di interpreti/runtime non vengono generati automaticamente.

Esempio di profilo personalizzato:
__OC_I18N_900005__
Se abiliti esplicitamente `jq` in `safeBins`, OpenClaw continua comunque a rifiutare la builtin `env` in modalità safe-bin
così che `jq -n env` non possa esporre l'ambiente del processo host senza un percorso esplicito nell'allowlist
o un prompt di approvazione.

## Modifica nella Control UI

Usa la scheda **Control UI → Nodes → Exec approvals** per modificare i valori predefiniti, gli
override per-agente e le allowlist. Scegli un ambito (Defaults o un agente), modifica il criterio,
aggiungi/rimuovi pattern di allowlist, quindi fai clic su **Save**. L'interfaccia mostra i metadati di **ultimo utilizzo**
per pattern così puoi mantenere ordinato l'elenco.

Il selettore della destinazione sceglie **Gateway** (approvazioni locali) oppure un **Node**. I nodi
devono dichiarare `system.execApprovals.get/set` (app macOS o host nodo headless).
Se un nodo non dichiara ancora le approvazioni exec, modifica direttamente il suo file locale
`~/.openclaw/exec-approvals.json`.

CLI: `openclaw approvals` supporta la modifica di gateway o nodo (vedi [Approvals CLI](/cli/approvals)).

## Flusso di approvazione

Quando è richiesto un prompt, il gateway trasmette `exec.approval.requested` ai client operatore.
La Control UI e l'app macOS lo risolvono tramite `exec.approval.resolve`, quindi il gateway inoltra la
richiesta approvata all'host del nodo.

Per `host=node`, le richieste di approvazione includono un payload canonico `systemRunPlan`. Il gateway usa
quel piano come contesto autorevole di comando/cwd/sessione quando inoltra le richieste approvate di `system.run`.

Questo è importante per la latenza delle approvazioni asincrone:

- il percorso exec del nodo prepara in anticipo un unico piano canonico
- il record di approvazione memorizza quel piano e i suoi metadati di binding
- una volta approvato, la chiamata finale inoltrata `system.run` riutilizza il piano memorizzato
  invece di fidarsi di modifiche successive del chiamante
- se il chiamante modifica `command`, `rawCommand`, `cwd`, `agentId` o
  `sessionKey` dopo che la richiesta di approvazione è stata creata, il gateway rifiuta
  l'esecuzione inoltrata come mancata corrispondenza dell'approvazione

## Comandi di interprete/runtime

Le esecuzioni di interprete/runtime supportate da approvazione sono intenzionalmente conservative:

- Il contesto esatto di argv/cwd/env è sempre vincolato.
- Le forme dirette di script shell e di file runtime diretto vengono vincolate in best-effort a un unico snapshot
  di file locale concreto.
- Le comuni forme wrapper di package-manager che si risolvono comunque in un unico file locale diretto (ad esempio
  `pnpm exec`, `pnpm node`, `npm exec`, `npx`) vengono spacchettate prima del binding.
- Se OpenClaw non riesce a identificare esattamente un unico file locale concreto per un comando di interprete/runtime
  (ad esempio script di package, forme eval, catene di loader specifiche del runtime o forme
  ambigue multi-file), l'esecuzione supportata da approvazione viene negata invece di dichiarare una copertura semantica
  che in realtà non ha.
- Per questi flussi di lavoro, preferisci la sandbox, un confine host separato o un flusso esplicito
  allowlist/full attendibile in cui l'operatore accetta la semantica più ampia del runtime.

Quando sono richieste approvazioni, lo strumento exec restituisce immediatamente un ID di approvazione. Usa quell'ID per
correlare eventi di sistema successivi (`Exec finished` / `Exec denied`). Se non arriva alcuna decisione prima del
timeout, la richiesta viene trattata come timeout di approvazione ed esposta come motivo di negazione.

### Comportamento di consegna del followup

Dopo che un exec asincrono approvato termina, OpenClaw invia un turno `agent` di followup alla stessa sessione.

- Se esiste una destinazione di consegna esterna valida (canale consegnabile più target `to`), la consegna del followup usa quel canale.
- Nei flussi solo webchat o solo sessione interna senza destinazione esterna, la consegna del followup resta solo di sessione (`deliver: false`).
- Se un chiamante richiede esplicitamente una consegna esterna rigorosa senza alcun canale esterno risolvibile, la richiesta fallisce con `INVALID_REQUEST`.
- Se `bestEffortDeliver` è abilitato e non può essere risolto alcun canale esterno, la consegna viene declassata a solo sessione invece di fallire.

La finestra di dialogo di conferma include:

- comando + argomenti
- cwd
- id agente
- percorso dell'eseguibile risolto
- host + metadati del criterio

Azioni:

- **Allow once** → esegui ora
- **Always allow** → aggiungi all'allowlist + esegui
- **Deny** → blocca

## Inoltro delle approvazioni ai canali chat

Puoi inoltrare i prompt di approvazione exec a qualsiasi canale chat (inclusi i canali plugin) e approvarli
con `/approve`. Questo usa la normale pipeline di consegna in uscita.

Configurazione:
__OC_I18N_900006__
Rispondi nella chat:
__OC_I18N_900007__
Il comando `/approve` gestisce sia le approvazioni exec sia le approvazioni plugin. Se l'ID non corrisponde a un'approvazione exec in attesa, controlla automaticamente invece le approvazioni plugin.

### Inoltro delle approvazioni plugin

L'inoltro delle approvazioni plugin usa la stessa pipeline di consegna delle approvazioni exec, ma ha una propria
configurazione indipendente in `approvals.plugin`. Abilitare o disabilitare una non influisce sull'altra.
__OC_I18N_900008__
La forma della configurazione è identica a `approvals.exec`: `enabled`, `mode`, `agentFilter`,
`sessionFilter` e `targets` funzionano allo stesso modo.

I canali che supportano risposte interattive condivise mostrano gli stessi pulsanti di approvazione sia per le approvazioni exec sia per quelle plugin. I canali senza UI interattiva condivisa ricorrono al testo semplice con istruzioni `/approve`.

### Approvazioni nella stessa chat su qualsiasi canale

Quando una richiesta di approvazione exec o plugin proviene da una superficie chat consegnabile, la stessa chat
può ora approvarla con `/approve` per impostazione predefinita. Questo vale per canali come Slack, Matrix e
Microsoft Teams oltre ai flussi già esistenti di Web UI e terminal UI.

Questo percorso condiviso di comando testuale usa il normale modello di autenticazione del canale per quella conversazione. Se la
chat di origine può già inviare comandi e ricevere risposte, le richieste di approvazione non hanno più bisogno di un
adapter di consegna nativo separato solo per restare in attesa.

Discord e Telegram supportano anche `/approve` nella stessa chat, ma questi canali usano comunque il loro
elenco approvatori risolto per l'autorizzazione anche quando la consegna nativa delle approvazioni è disabilitata.

Per Telegram e altri client di approvazione nativi che chiamano direttamente il Gateway,
questo fallback è intenzionalmente limitato ai fallimenti "approval not found". Un vero
rifiuto/errore di approvazione exec non viene ritentato silenziosamente come approvazione plugin.

### Consegna nativa delle approvazioni

Alcuni canali possono anche agire come client di approvazione nativi. I client nativi aggiungono DM agli approvatori, fanout alla chat di origine e UX di approvazione interattiva specifica del canale sopra il flusso condiviso `/approve` nella stessa chat.

Quando sono disponibili card/pulsanti di approvazione nativi, quella UI nativa è il percorso principale
visibile all'agente. L'agente non dovrebbe anche ripetere un comando semplice di chat
`/approve` duplicato, a meno che il risultato dello strumento indichi che le approvazioni via chat non sono disponibili o
che l'approvazione manuale è l'unico percorso rimasto.

Modello generico:

- il criterio exec host continua a decidere se è richiesta un'approvazione exec
- `approvals.exec` controlla l'inoltro dei prompt di approvazione verso altre destinazioni chat
- `channels.<channel>.execApprovals` controlla se quel canale agisce come client di approvazione nativo

I client di approvazione nativi abilitano automaticamente la consegna DM-first quando tutte queste condizioni sono vere:

- il canale supporta la consegna di approvazioni native
- gli approvatori possono essere risolti da `execApprovals.approvers` esplicito oppure dalle
  origini di fallback documentate di quel canale
- `channels.<channel>.execApprovals.enabled` non è impostato oppure è `"auto"`

Imposta `enabled: false` per disabilitare esplicitamente un client di approvazione nativo. Imposta `enabled: true` per forzarlo
all'attivazione quando gli approvatori vengono risolti. La consegna pubblica alla chat di origine resta esplicita tramite
`channels.<channel>.execApprovals.target`.

FAQ: [Perché esistono due configurazioni di approvazione exec per le approvazioni in chat?](/help/faq#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord: `channels.discord.execApprovals.*`
- Slack: `channels.slack.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`

Questi client di approvazione nativi aggiungono instradamento DM e fanout opzionale del canale sopra il flusso condiviso
`/approve` nella stessa chat e i pulsanti di approvazione condivisi.

Comportamento condiviso:

- Slack, Matrix, Microsoft Teams e chat consegnabili simili usano il normale modello di autenticazione del canale
  per `/approve` nella stessa chat
- quando un client di approvazione nativo si abilita automaticamente, la destinazione nativa predefinita di consegna sono i DM degli approvatori
- per Discord e Telegram, solo gli approvatori risolti possono approvare o negare
- gli approvatori Discord possono essere espliciti (`execApprovals.approvers`) o dedotti da `commands.ownerAllowFrom`
- gli approvatori Telegram possono essere espliciti (`execApprovals.approvers`) o dedotti dalla configurazione owner esistente (`allowFrom`, più `defaultTo` del messaggio diretto dove supportato)
- gli approvatori Slack possono essere espliciti (`execApprovals.approvers`) o dedotti da `commands.ownerAllowFrom`
- i pulsanti nativi di Slack preservano il tipo dell'ID di approvazione, quindi gli ID `plugin:` possono risolvere le approvazioni plugin
  senza un secondo livello di fallback locale a Slack
- l'instradamento nativo DM/canale di Matrix e le scorciatoie tramite reaction gestiscono sia le approvazioni exec sia quelle plugin;
  l'autorizzazione plugin continua però a provenire da `channels.matrix.dm.allowFrom`
- chi effettua la richiesta non deve essere un approvatore
- la chat di origine può approvare direttamente con `/approve` quando quella chat supporta già comandi e risposte
- i pulsanti nativi di approvazione Discord instradano in base al tipo dell'ID di approvazione: gli ID `plugin:` vanno
  direttamente alle approvazioni plugin, tutto il resto va alle approvazioni exec
- i pulsanti nativi di approvazione Telegram seguono lo stesso fallback limitato exec-to-plugin di `/approve`
- quando `target` nativo abilita la consegna alla chat di origine, i prompt di approvazione includono il testo del comando
- le approvazioni exec in attesa scadono dopo 30 minuti per impostazione predefinita
- se nessuna UI operatore o client di approvazione configurato può accettare la richiesta, il prompt ricorre a `askFallback`

Telegram usa come valore predefinito i DM degli approvatori (`target: "dm"`). Puoi passare a `channel` o `both` quando
vuoi che i prompt di approvazione compaiano anche nella chat/topic Telegram di origine. Per i topic forum di Telegram,
OpenClaw preserva il topic per il prompt di approvazione e il follow-up post-approvazione.

Vedi:

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### Flusso IPC macOS
__OC_I18N_900009__
Note di sicurezza:

- Modalità del socket Unix `0600`, token archiviato in `exec-approvals.json`.
- Controllo del peer con stesso UID.
- Challenge/response (nonce + token HMAC + hash della richiesta) + TTL breve.

## Eventi di sistema

Il ciclo di vita exec viene esposto come messaggi di sistema:

- `Exec running` (solo se il comando supera la soglia dell'avviso di esecuzione)
- `Exec finished`
- `Exec denied`

Questi vengono pubblicati nella sessione dell'agente dopo che il nodo segnala l'evento.
Le approvazioni exec sull'host gateway emettono gli stessi eventi di ciclo di vita quando il comando termina (e facoltativamente quando è in esecuzione più a lungo della soglia).
Gli exec soggetti ad approvazione riutilizzano l'ID di approvazione come `runId` in questi messaggi per una correlazione semplice.

## Comportamento delle approvazioni negate

Quando un'approvazione exec asincrona viene negata, OpenClaw impedisce all'agente di riutilizzare
l'output di qualsiasi esecuzione precedente dello stesso comando nella sessione. Il motivo del rifiuto
viene passato con indicazioni esplicite che nessun output del comando è disponibile, il che impedisce
all'agente di dichiarare che c'è un nuovo output o di ripetere il comando negato con
risultati obsoleti da una precedente esecuzione riuscita.

## Implicazioni

- **full** è potente; preferisci le allowlist quando possibile.
- **ask** ti mantiene nel circuito pur consentendo approvazioni rapide.
- Le allowlist per-agente impediscono che le approvazioni di un agente si propaghino ad altri.
- Le approvazioni si applicano solo alle richieste di exec host provenienti da **mittenti autorizzati**. I mittenti non autorizzati non possono emettere `/exec`.
- `/exec security=full` è una comodità a livello di sessione per operatori autorizzati e per progettazione salta le approvazioni.
  Per bloccare rigidamente l'exec host, imposta la security delle approvazioni su `deny` o nega lo strumento `exec` tramite il criterio degli strumenti.

Correlati:

- [Exec tool](/it/tools/exec)
- [Elevated mode](/it/tools/elevated)
- [Skills](/it/tools/skills)

## Correlati

- [Exec](/it/tools/exec) — strumento di esecuzione di comandi shell
- [Sandboxing](/it/gateway/sandboxing) — modalità sandbox e accesso al workspace
- [Security](/it/gateway/security) — modello di sicurezza e hardening
- [Sandbox vs Tool Policy vs Elevated](/it/gateway/sandbox-vs-tool-policy-vs-elevated) — quando usare ciascuno
