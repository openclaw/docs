---
read_when:
    - Configurazione delle approvazioni Exec o delle allowlist
    - Implementazione della UX delle approvazioni Exec nell'app macOS
    - Revisione dei prompt di uscita dalla sandbox e delle relative implicazioni
summary: Approvazioni Exec, allowlist e prompt di uscita dalla sandbox
title: Approvazioni Exec
x-i18n:
    generated_at: "2026-04-05T14:07:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: a1efa3b78efe3ca6246acfb37830b103ede40cc5298dcc7da8e9fbc5f6cc88ef
    source_path: tools/exec-approvals.md
    workflow: 15
---

# Approvazioni Exec

Le approvazioni Exec sono il **guardrail dell'app complementare / dell'host del nodo** per consentire a un agente in sandbox di eseguire
comandi su un host reale (`gateway` o `node`). Considerale come un interblocco di sicurezza:
i comandi sono consentiti solo quando criteri + allowlist + approvazione utente (facoltativa) concordano tutti.
Le approvazioni Exec sono **aggiuntive** rispetto ai criteri degli strumenti e al gating elevated (a meno che elevated non sia impostato su `full`, che salta le approvazioni).
Il criterio effettivo è il **più restrittivo** tra i valori predefiniti di `tools.exec.*` e delle approvazioni; se un campo delle approvazioni viene omesso, viene usato il valore di `tools.exec`.
L'exec host usa anche lo stato locale delle approvazioni su quella macchina. Un valore locale host
`ask: "always"` in `~/.openclaw/exec-approvals.json` continua a mostrare prompt anche se
i valori predefiniti della sessione o della configurazione richiedono `ask: "on-miss"`.
Usa `openclaw approvals get`, `openclaw approvals get --gateway` oppure
`openclaw approvals get --node <id|name|ip>` per ispezionare il criterio richiesto,
le origini del criterio host e il risultato effettivo.

Se l'interfaccia dell'app complementare **non è disponibile**, qualsiasi richiesta che richieda un prompt viene
risolta tramite il **fallback ask** (predefinito: deny).

## Dove si applica

Le approvazioni Exec vengono applicate localmente sull'host di esecuzione:

- **gateway host** → processo `openclaw` sulla macchina gateway
- **node host** → esecutore del nodo (app complementare macOS o host nodo headless)

Nota sul modello di fiducia:

- I chiamanti autenticati dal Gateway sono operatori fidati per quel Gateway.
- I nodi abbinati estendono questa capacità di operatore fidato all'host del nodo.
- Le approvazioni Exec riducono il rischio di esecuzione accidentale, ma non costituiscono un confine di autenticazione per utente.
- Le esecuzioni approvate sull'host del nodo associano il contesto di esecuzione canonico: cwd canonico, argv esatto, binding
  env quando presente, e percorso dell'eseguibile bloccato quando applicabile.
- Per gli script shell e le invocazioni dirette di file interprete/runtime, OpenClaw prova anche ad associare
  un singolo operando file locale concreto. Se quel file associato cambia dopo l'approvazione ma prima dell'esecuzione,
  l'esecuzione viene negata invece di eseguire contenuto modificato.
- Questo binding del file è intenzionalmente best-effort, non un modello semantico completo di ogni
  percorso di caricamento di interpreti/runtime. Se la modalità di approvazione non riesce a identificare esattamente
  un file locale concreto da associare, rifiuta di creare un'esecuzione supportata da approvazione invece di fingere copertura completa.

Separazione su macOS:

- Il **servizio host del nodo** inoltra `system.run` alla **app macOS** tramite IPC locale.
- La **app macOS** applica le approvazioni + esegue il comando nel contesto UI.

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
- criterio locale host delle approvazioni in `~/.openclaw/exec-approvals.json`

Questo ora è il comportamento host predefinito, a meno che tu non lo renda esplicitamente più restrittivo:

- `tools.exec.security`: `full` su `gateway`/`node`
- `tools.exec.ask`: `off`
- host `askFallback`: `full`

Distinzione importante:

- `tools.exec.host=auto` sceglie dove viene eseguito exec: sandbox quando disponibile, altrimenti gateway.
- YOLO sceglie come viene approvato l'exec host: `security=full` più `ask=off`.
- `auto` non trasforma il routing gateway in un override libero da una sessione in sandbox. Una richiesta per chiamata `host=node` è consentita da `auto`, e `host=gateway` è consentito da `auto` solo quando non è attivo alcun runtime sandbox. Se vuoi un valore predefinito stabile non `auto`, imposta `tools.exec.host` oppure usa `/exec host=...` esplicitamente.

Se vuoi un'impostazione più prudente, rendi di nuovo più restrittivo uno dei due livelli su `allowlist` / `on-miss`
oppure `deny`.

Configurazione persistente dell'host gateway "mai mostrare prompt":

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

Per un host nodo, applica invece lo stesso file delle approvazioni su quel nodo:

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

Scorciatoia solo sessione:

- `/exec security=full ask=off` cambia solo la sessione corrente.
- `/elevated full` è una scorciatoia break-glass che salta anche le approvazioni Exec per quella sessione.

Se il file delle approvazioni host resta più restrittivo della configurazione, il criterio host più restrittivo continua comunque a prevalere.

## Opzioni del criterio

### Sicurezza (`exec.security`)

- **deny**: blocca tutte le richieste exec host.
- **allowlist**: consente solo i comandi presenti in allowlist.
- **full**: consente tutto (equivalente a elevated).

### Ask (`exec.ask`)

- **off**: non mostrare mai prompt.
- **on-miss**: mostra il prompt solo quando non c'è corrispondenza nell'allowlist.
- **always**: mostra il prompt per ogni comando.
- La fiducia durevole `allow-always` non sopprime i prompt quando la modalità ask effettiva è `always`

### Ask fallback (`askFallback`)

Se è richiesto un prompt ma non è raggiungibile alcuna UI, il fallback decide:

- **deny**: blocca.
- **allowlist**: consente solo se c'è corrispondenza nell'allowlist.
- **full**: consente.

### Hardening eval inline dell'interprete (`tools.exec.strictInlineEval`)

Quando `tools.exec.strictInlineEval=true`, OpenClaw tratta le forme eval di codice inline come soggette a sola approvazione anche se il binario dell'interprete stesso è in allowlist.

Esempi:

- `python -c`
- `node -e`, `node --eval`, `node -p`
- `ruby -e`
- `perl -e`, `perl -E`
- `php -r`
- `lua -e`
- `osascript -e`

Questa è una difesa in profondità per i loader degli interpreti che non si mappano in modo pulito su un singolo operando file stabile. In modalità strict:

- questi comandi richiedono comunque approvazione esplicita;
- `allow-always` non rende persistenti automaticamente nuove voci di allowlist per essi.

## Allowlist (per agente)

Le allowlist sono **per agente**. Se esistono più agenti, cambia l'agente che stai
modificando nell'app macOS. I pattern sono corrispondenze glob **case-insensitive**.
I pattern devono risolversi in **percorsi di binari** (le voci col solo basename vengono ignorate).
Le voci legacy `agents.default` vengono migrate in `agents.main` al caricamento.
Le catene shell come `echo ok && pwd` richiedono comunque che ogni segmento di primo livello soddisfi le regole dell'allowlist.

Esempi:

- `~/Projects/**/bin/peekaboo`
- `~/.local/bin/*`
- `/opt/homebrew/bin/rg`

Ogni voce dell'allowlist tiene traccia di:

- **id** UUID stabile usato per l'identità nella UI (facoltativo)
- timestamp **last used**
- **last used command**
- **last resolved path**

## Auto-allow dei CLI delle Skills

Quando **Auto-allow skill CLIs** è abilitato, gli eseguibili referenziati da Skills note
vengono trattati come presenti in allowlist sui nodi (nodo macOS o host nodo headless). Questo usa
`skills.bins` tramite Gateway RPC per recuperare l'elenco dei binari delle Skills. Disabilitalo se vuoi allowlist manuali rigorose.

Note importanti sul modello di fiducia:

- Questa è un'**allowlist implicita di convenienza**, separata dalle voci manuali dell'allowlist dei percorsi.
- È pensata per ambienti con operatori fidati in cui Gateway e nodo sono nello stesso confine di fiducia.
- Se richiedi una fiducia esplicita rigorosa, mantieni `autoAllowSkills: false` e usa solo voci manuali dell'allowlist dei percorsi.

## Safe bins (solo stdin)

`tools.exec.safeBins` definisce un piccolo elenco di binari **solo stdin** (per esempio `cut`)
che possono essere eseguiti in modalità allowlist **senza** voci esplicite di allowlist. I safe bins rifiutano
argomenti file posizionali e token simili a percorsi, quindi possono operare solo sul flusso in ingresso.
Consideralo come un percorso rapido ristretto per filtri di stream, non come un elenco generale di fiducia.
**Non** aggiungere binari interprete o runtime (per esempio `python3`, `node`, `ruby`, `bash`, `sh`, `zsh`) a `safeBins`.
Se un comando può valutare codice, eseguire sottocomandi o leggere file per progettazione, preferisci voci esplicite di allowlist e mantieni abilitati i prompt di approvazione.
I safe bins personalizzati devono definire un profilo esplicito in `tools.exec.safeBinProfiles.<bin>`.
La validazione è deterministica solo dalla forma di argv (nessun controllo sull'esistenza nel filesystem host), il che
evita comportamenti da oracolo sull'esistenza dei file dovuti a differenze allow/deny.
Le opzioni orientate ai file vengono negate per i safe bins predefiniti (per esempio `sort -o`, `sort --output`,
`sort --files0-from`, `sort --compress-program`, `sort --random-source`,
`sort --temporary-directory`/`-T`, `wc --files0-from`, `jq -f/--from-file`,
`grep -f/--file`).
I safe bins applicano anche un criterio esplicito per binario sui flag che interrompono il comportamento
solo stdin (per esempio `sort -o/--output/--compress-program` e i flag ricorsivi di grep).
Le opzioni lunghe vengono validate in modalità fail-closed per i safe bins: flag sconosciuti e
abbreviazioni ambigue vengono rifiutati.
Flag negati dal profilo safe-bin:

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

I safe bins forzano inoltre i token argv a essere trattati come **testo letterale** al momento dell'esecuzione (senza globbing
né espansione di `$VARS`) per i segmenti solo stdin, così pattern come `*` o `$HOME/...` non possono essere
usati per introdurre di nascosto letture di file.
I safe bins devono inoltre risolversi da directory di binari fidate (valori predefiniti di sistema più eventuali
`tools.exec.safeBinTrustedDirs`). Le voci in `PATH` non sono mai considerate automaticamente fidate.
Le directory fidate predefinite dei safe bins sono intenzionalmente minime: `/bin`, `/usr/bin`.
Se il tuo eseguibile safe-bin si trova in percorsi del package manager o dell'utente (per esempio
`/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`), aggiungili esplicitamente
a `tools.exec.safeBinTrustedDirs`.
Le concatenazioni shell e i reindirizzamenti non sono consentiti automaticamente in modalità allowlist.

La concatenazione shell (`&&`, `||`, `;`) è consentita quando ogni segmento di primo livello soddisfa l'allowlist
(inclusi safe bins o auto-allow delle Skills). I reindirizzamenti restano non supportati in modalità allowlist.
La sostituzione di comando (`$()` / backticks) viene rifiutata durante il parsing dell'allowlist, anche all'interno
delle virgolette doppie; usa apici singoli se hai bisogno di testo letterale `$()`.
Nelle approvazioni dell'app complementare macOS, il testo shell grezzo contenente sintassi di controllo o espansione della shell
(`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) viene trattato come mancata corrispondenza dell'allowlist a meno che
il binario shell stesso non sia in allowlist.
Per i wrapper shell (`bash|sh|zsh ... -c/-lc`), gli override env con ambito richiesta vengono ridotti a una
piccola allowlist esplicita (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
Per le decisioni allow-always in modalità allowlist, i wrapper di dispatch noti
(`env`, `nice`, `nohup`, `stdbuf`, `timeout`) rendono persistenti i percorsi degli eseguibili interni invece dei
percorsi dei wrapper. Anche i multiplexer shell (`busybox`, `toybox`) vengono spacchettati per le applet shell (`sh`, `ash`,
ecc.) in modo che vengano resi persistenti gli eseguibili interni invece dei binari multiplexer. Se un wrapper o
multiplexer non può essere spacchettato in modo sicuro, nessuna voce di allowlist viene resa persistente automaticamente.
Se metti in allowlist interpreti come `python3` o `node`, preferisci `tools.exec.strictInlineEval=true` così l'eval inline richiede comunque un'approvazione esplicita. In modalità strict, `allow-always` può comunque rendere persistenti invocazioni innocue di interprete/script, ma i vettori eval inline non vengono resi persistenti automaticamente.

Safe bins predefiniti:

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` e `sort` non sono nell'elenco predefinito. Se scegli di abilitarli esplicitamente, mantieni voci esplicite di allowlist per
i loro flussi di lavoro non-stdin.
Per `grep` in modalità safe-bin, fornisci il pattern con `-e`/`--regexp`; la forma del pattern posizionale è
rifiutata così che gli operandi file non possano essere introdotti di nascosto come posizionali ambigui.

### Safe bins rispetto all'allowlist

| Topic            | `tools.exec.safeBins`                                  | Allowlist (`exec-approvals.json`)                            |
| ---------------- | ------------------------------------------------------ | ------------------------------------------------------------ |
| Obiettivo        | Consentire automaticamente filtri stdin ristretti      | Fidarsi esplicitamente di eseguibili specifici               |
| Tipo di corrispondenza | Nome dell'eseguibile + criterio argv safe-bin    | Pattern glob del percorso dell'eseguibile risolto            |
| Ambito degli argomenti | Limitato dal profilo safe-bin e dalle regole dei token letterali | Solo corrispondenza del percorso; per il resto gli argomenti sono sotto la tua responsabilità |
| Esempi tipici    | `head`, `tail`, `tr`, `wc`                             | `jq`, `python3`, `node`, `ffmpeg`, CLI personalizzati        |
| Uso migliore     | Trasformazioni testuali a basso rischio nelle pipeline | Qualsiasi strumento con comportamento più ampio o effetti collaterali |

Posizione della configurazione:

- `safeBins` proviene dalla configurazione (`tools.exec.safeBins` oppure `agents.list[].tools.exec.safeBins` per agente).
- `safeBinTrustedDirs` proviene dalla configurazione (`tools.exec.safeBinTrustedDirs` oppure `agents.list[].tools.exec.safeBinTrustedDirs` per agente).
- `safeBinProfiles` proviene dalla configurazione (`tools.exec.safeBinProfiles` oppure `agents.list[].tools.exec.safeBinProfiles` per agente). Le chiavi di profilo per agente sovrascrivono le chiavi globali.
- le voci dell'allowlist risiedono nel file locale host `~/.openclaw/exec-approvals.json` sotto `agents.<id>.allowlist` (oppure tramite Control UI / `openclaw approvals allowlist ...`).
- `openclaw security audit` avvisa con `tools.exec.safe_bins_interpreter_unprofiled` quando binari interprete/runtime compaiono in `safeBins` senza profili espliciti.
- `openclaw doctor --fix` può generare i valori mancanti `safeBinProfiles.<bin>` come `{}` (rivedili e rendili più restrittivi dopo). I binari interprete/runtime non vengono generati automaticamente.

Esempio di profilo personalizzato:
__OC_I18N_900004__
Se scegli esplicitamente di inserire `jq` in `safeBins`, OpenClaw rifiuta comunque il builtin `env` in modalità safe-bin
così `jq -n env` non può scaricare le variabili d'ambiente del processo host senza un percorso esplicito in allowlist
o un prompt di approvazione.

## Modifica dalla Control UI

Usa la scheda **Control UI → Nodes → Exec approvals** per modificare valori predefiniti, override
per agente e allowlist. Scegli un ambito (Defaults o un agente), modifica il criterio,
aggiungi/rimuovi pattern di allowlist, poi **Save**. La UI mostra i metadati **last used**
per pattern così puoi mantenere l'elenco ordinato.

Il selettore della destinazione sceglie **Gateway** (approvazioni locali) oppure un **Node**. I nodi
devono pubblicizzare `system.execApprovals.get/set` (app macOS o host nodo headless).
Se un nodo non pubblicizza ancora le approvazioni exec, modifica direttamente il suo file locale
`~/.openclaw/exec-approvals.json`.

CLI: `openclaw approvals` supporta la modifica di gateway o nodo (vedi [Approvals CLI](/cli/approvals)).

## Flusso di approvazione

Quando è richiesto un prompt, il gateway trasmette `exec.approval.requested` ai client operatore.
La Control UI e l'app macOS lo risolvono tramite `exec.approval.resolve`, poi il gateway inoltra la
richiesta approvata all'host del nodo.

Per `host=node`, le richieste di approvazione includono un payload canonico `systemRunPlan`. Il gateway usa
quel piano come contesto autorevole di comando/cwd/sessione quando inoltra richieste `system.run`
approvate.

Questo è importante per la latenza delle approvazioni asincrone:

- il percorso exec del nodo prepara in anticipo un unico piano canonico
- il record di approvazione memorizza quel piano e i suoi metadati di binding
- una volta approvata, la chiamata finale `system.run` inoltrata riusa il piano memorizzato
  invece di fidarsi di modifiche successive del chiamante
- se il chiamante cambia `command`, `rawCommand`, `cwd`, `agentId` oppure
  `sessionKey` dopo la creazione della richiesta di approvazione, il gateway rifiuta
  l'esecuzione inoltrata come mancata corrispondenza dell'approvazione

## Comandi di interpreti/runtime

Le esecuzioni di interpreti/runtime supportate da approvazione sono intenzionalmente conservative:

- Il contesto esatto di argv/cwd/env viene sempre associato.
- Le forme di script shell diretto e di file runtime diretto vengono associate in best-effort a uno snapshot di un singolo file locale concreto.
- Le forme wrapper comuni dei package manager che si risolvono comunque in un solo file locale diretto (per esempio
  `pnpm exec`, `pnpm node`, `npm exec`, `npx`) vengono spacchettate prima del binding.
- Se OpenClaw non riesce a identificare esattamente un singolo file locale concreto per un comando interprete/runtime
  (per esempio script di package, forme eval, catene di loader specifiche del runtime o forme ambigue multi-file),
  l'esecuzione supportata da approvazione viene negata invece di dichiarare una copertura semantica che non
  possiede.
- Per questi flussi di lavoro, preferisci la sandbox, un confine host separato oppure un flusso esplicito
  con allowlist/full fidato in cui l'operatore accetta la semantica più ampia del runtime.

Quando sono richieste approvazioni, lo strumento exec restituisce immediatamente un id di approvazione. Usa tale id per
correlare gli eventi di sistema successivi (`Exec finished` / `Exec denied`). Se non arriva alcuna decisione prima del
timeout, la richiesta viene trattata come timeout di approvazione e mostrata come motivo di rifiuto.

### Comportamento di recapito del follow-up

Dopo il completamento di un exec asincrono approvato, OpenClaw invia un turno `agent` di follow-up alla stessa sessione.

- Se esiste una destinazione esterna valida per il recapito (canale recapitabile più destinazione `to`), il recapito del follow-up usa quel canale.
- Nei flussi solo webchat o solo sessione interna senza destinazione esterna, il recapito del follow-up resta solo sessione (`deliver: false`).
- Se un chiamante richiede esplicitamente un recapito esterno rigoroso senza un canale esterno risolvibile, la richiesta fallisce con `INVALID_REQUEST`.
- Se `bestEffortDeliver` è abilitato e non è possibile risolvere alcun canale esterno, il recapito viene declassato a solo sessione invece di fallire.

La finestra di conferma include:

- comando + argomenti
- cwd
- id agente
- percorso dell'eseguibile risolto
- host + metadati del criterio

Azioni:

- **Allow once** → esegui ora
- **Always allow** → aggiungi all'allowlist + esegui
- **Deny** → blocca

## Inoltro delle approvazioni ai canali di chat

Puoi inoltrare i prompt di approvazione exec a qualsiasi canale di chat (inclusi i canali plugin) e approvarli
con `/approve`. Questo usa la normale pipeline di recapito in uscita.

Configurazione:
__OC_I18N_900005__
Rispondi in chat:
__OC_I18N_900006__
Il comando `/approve` gestisce sia le approvazioni exec sia le approvazioni dei plugin. Se l'ID non corrisponde a un'approvazione exec in sospeso, controlla automaticamente invece le approvazioni dei plugin.

### Inoltro delle approvazioni dei plugin

L'inoltro delle approvazioni dei plugin usa la stessa pipeline di recapito delle approvazioni exec ma ha una
configurazione indipendente sotto `approvals.plugin`. Abilitare o disabilitare una delle due non influisce sull'altra.
__OC_I18N_900007__
La forma della configurazione è identica a `approvals.exec`: `enabled`, `mode`, `agentFilter`,
`sessionFilter` e `targets` funzionano allo stesso modo.

I canali che supportano risposte interattive condivise renderizzano gli stessi pulsanti di approvazione sia per le approvazioni exec sia per quelle dei plugin. I canali senza UI interattiva condivisa ricadono su testo semplice con istruzioni `/approve`.

### Approvazioni nella stessa chat su qualsiasi canale

Quando una richiesta di approvazione exec o plugin ha origine da una superficie di chat recapitabile, per impostazione predefinita
la stessa chat può ora approvarla con `/approve`. Questo si applica a canali come Slack, Matrix e
Microsoft Teams oltre ai flussi già esistenti della Web UI e della terminal UI.

Questo percorso condiviso tramite comando testuale usa il normale modello di autenticazione del canale per quella conversazione. Se la
chat di origine può già inviare comandi e ricevere risposte, le richieste di approvazione non hanno più bisogno di un
adattatore di recapito nativo separato solo per restare in sospeso.

Discord e Telegram supportano anche `/approve` nella stessa chat, ma questi canali continuano a usare il loro
elenco di approvatori risolto per l'autorizzazione anche quando il recapito nativo delle approvazioni è disabilitato.

Per Telegram e altri client nativi di approvazione che chiamano direttamente il Gateway,
questo fallback è intenzionalmente limitato ai fallimenti "approval not found". Un vero
rifiuto/errore di approvazione exec non riprova silenziosamente come approvazione plugin.

### Recapito nativo delle approvazioni

Alcuni canali possono anche agire come client nativi di approvazione. I client nativi aggiungono DM degli approvatori, fanout
alla chat di origine e UX interattiva di approvazione specifica del canale sopra il flusso condiviso `/approve` nella stessa chat.

Quando sono disponibili schede/pulsanti nativi di approvazione, quella UI nativa è il percorso principale
rivolto all'agente. L'agente non deve anche ripetere un comando testuale duplicato
`/approve` nella chat, a meno che il risultato dello strumento non dica che le approvazioni via chat non sono disponibili o che
l'approvazione manuale è l'unico percorso rimasto.

Modello generico:

- il criterio exec host continua a decidere se è richiesta un'approvazione exec
- `approvals.exec` controlla l'inoltro dei prompt di approvazione verso altre destinazioni chat
- `channels.<channel>.execApprovals` controlla se quel canale agisce come client nativo di approvazione

I client nativi di approvazione abilitano automaticamente il recapito DM-first quando sono tutti veri i seguenti punti:

- il canale supporta il recapito nativo delle approvazioni
- gli approvatori possono essere risolti da `execApprovals.approvers` esplicito oppure dalle sorgenti di fallback documentate per quel canale
- `channels.<channel>.execApprovals.enabled` non è impostato oppure è `"auto"`

Imposta `enabled: false` per disabilitare esplicitamente un client nativo di approvazione. Imposta `enabled: true` per forzarlo
quando gli approvatori vengono risolti. Il recapito pubblico alla chat di origine resta
esplicito tramite `channels.<channel>.execApprovals.target`.

FAQ: [Perché esistono due configurazioni exec approval per le approvazioni via chat?](/help/faq#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord: `channels.discord.execApprovals.*`
- Slack: `channels.slack.execApprovals.*`
- Telegram: `channels.telegram.execApprovals.*`

Questi client nativi di approvazione aggiungono instradamento DM e fanout facoltativo al canale sopra il flusso condiviso
`/approve` nella stessa chat e ai pulsanti di approvazione condivisi.

Comportamento condiviso:

- Slack, Matrix, Microsoft Teams e chat recapitabili simili usano il normale modello di autenticazione del canale
  per `/approve` nella stessa chat
- quando un client nativo di approvazione si abilita automaticamente, la destinazione nativa predefinita è rappresentata dai DM degli approvatori
- per Discord e Telegram, solo gli approvatori risolti possono approvare o negare
- gli approvatori Discord possono essere espliciti (`execApprovals.approvers`) o dedotti da `commands.ownerAllowFrom`
- gli approvatori Telegram possono essere espliciti (`execApprovals.approvers`) o dedotti dalla configurazione owner esistente (`allowFrom`, più `defaultTo` del messaggio diretto dove supportato)
- gli approvatori Slack possono essere espliciti (`execApprovals.approvers`) o dedotti da `commands.ownerAllowFrom`
- i pulsanti nativi Slack preservano il tipo di id dell'approvazione, quindi gli id `plugin:` possono risolvere le approvazioni plugin
  senza un secondo livello di fallback locale a Slack
- l'instradamento DM/canale nativo di Matrix è solo exec; le approvazioni plugin di Matrix restano sul flusso condiviso
  `/approve` nella stessa chat e sui percorsi facoltativi di inoltro `approvals.plugin`
- il richiedente non deve necessariamente essere un approvatore
- la chat di origine può approvare direttamente con `/approve` quando quella chat supporta già comandi e risposte
- i pulsanti nativi di approvazione Discord instradano in base al tipo di id dell'approvazione: gli id `plugin:` vanno
  direttamente alle approvazioni plugin, tutto il resto va alle approvazioni exec
- i pulsanti nativi di approvazione Telegram seguono lo stesso fallback limitato da exec a plugin di `/approve`
- quando `target` nativo abilita il recapito alla chat di origine, i prompt di approvazione includono il testo del comando
- le approvazioni exec in sospeso scadono dopo 30 minuti per impostazione predefinita
- se nessuna UI operatore o client di approvazione configurato può accettare la richiesta, il prompt usa `askFallback`

Telegram usa per impostazione predefinita i DM degli approvatori (`target: "dm"`). Puoi passare a `channel` oppure `both` quando
vuoi che i prompt di approvazione compaiano anche nella chat/topic Telegram di origine. Per i topic del forum Telegram,
OpenClaw preserva il topic per il prompt di approvazione e il follow-up successivo all'approvazione.

Vedi:

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### Flusso IPC su macOS
__OC_I18N_900008__
Note sulla sicurezza:

- Modalità Unix socket `0600`, token memorizzato in `exec-approvals.json`.
- Controllo peer con stesso UID.
- Challenge/response (nonce + token HMAC + hash della richiesta) + TTL breve.

## Eventi di sistema

Il ciclo di vita Exec viene esposto come messaggi di sistema:

- `Exec running` (solo se il comando supera la soglia di notifica di esecuzione)
- `Exec finished`
- `Exec denied`

Questi vengono pubblicati nella sessione dell'agente dopo che il nodo segnala l'evento.
Le approvazioni exec dell'host gateway emettono gli stessi eventi del ciclo di vita quando il comando termina (e facoltativamente quando resta in esecuzione oltre la soglia).
Gli exec soggetti ad approvazione riusano l'id di approvazione come `runId` in questi messaggi per una correlazione più semplice.

## Comportamento delle approvazioni negate

Quando un'approvazione exec asincrona viene negata, OpenClaw impedisce all'agente di riutilizzare
l'output di eventuali esecuzioni precedenti dello stesso comando nella sessione. Il motivo del rifiuto
viene passato con indicazioni esplicite che nessun output del comando è disponibile, impedendo così
all'agente di affermare che ci sia nuovo output o di ripetere il comando negato con
risultati obsoleti di una precedente esecuzione riuscita.

## Implicazioni

- **full** è potente; preferisci le allowlist quando possibile.
- **ask** ti mantiene coinvolto consentendo comunque approvazioni rapide.
- Le allowlist per agente impediscono che le approvazioni di un agente si estendano ad altri.
- Le approvazioni si applicano solo alle richieste exec host provenienti da **mittenti autorizzati**. I mittenti non autorizzati non possono emettere `/exec`.
- `/exec security=full` è una comodità a livello di sessione per operatori autorizzati e per progettazione salta le approvazioni.
  Per bloccare in modo rigido l'exec host, imposta la sicurezza delle approvazioni su `deny` oppure nega lo strumento `exec` tramite il criterio degli strumenti.

Correlati:

- [Strumento Exec](/tools/exec)
- [Modalità elevated](/tools/elevated)
- [Skills](/tools/skills)

## Correlati

- [Exec](/tools/exec) — strumento di esecuzione di comandi shell
- [Sandboxing](/it/gateway/sandboxing) — modalità sandbox e accesso al workspace
- [Sicurezza](/it/gateway/security) — modello di sicurezza e hardening
- [Sandbox vs Tool Policy vs Elevated](/it/gateway/sandbox-vs-tool-policy-vs-elevated) — quando usare ciascuno
