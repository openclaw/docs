---
read_when:
    - Utilizzo o modifica dello strumento exec
    - Debug del comportamento di stdin o TTY
summary: Utilizzo dello strumento Exec, modalità stdin e supporto TTY
title: Strumento di esecuzione
x-i18n:
    generated_at: "2026-07-16T15:01:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b8d7c3fcaa670851635cbd029d73f529a50be8c8c4df69565a1f96ea28757d04
    source_path: tools/exec.md
    workflow: 16
---

Esegue comandi shell nell'area di lavoro. `exec` è una superficie shell con capacità di modifica: i comandi possono creare, modificare o eliminare file ovunque il filesystem dell'host o della sandbox selezionato lo consenta. La disabilitazione degli strumenti del filesystem di OpenClaw come `write`, `edit` o `apply_patch` non rende `exec` di sola lettura.

Supporta l'esecuzione in primo piano e in background tramite `process`. Se `process` non è consentito, `exec` viene eseguito in modo sincrono e ignora `yieldMs`/`background`. Le sessioni in background sono limitate al singolo agente; `process` vede solo le sessioni dello stesso agente.

## Parametri

<ParamField path="command" type="string" required>
Comando shell da eseguire.
</ParamField>

<ParamField path="workdir" type="string" default="cwd">
Directory di lavoro per il comando.
</ParamField>

<ParamField path="env" type="object">
Override delle variabili di ambiente chiave/valore uniti all'ambiente ereditato.
</ParamField>

<ParamField path="yieldMs" type="number" default="10000">
Sposta automaticamente il comando in background dopo questo ritardo (ms).
</ParamField>

<ParamField path="background" type="boolean" default="false">
Sposta immediatamente il comando in background anziché attendere `yieldMs`.
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSec">
Sostituisce per questa chiamata il timeout di esecuzione configurato, in secondi. Si applica alle esecuzioni in primo piano, in background, `yieldMs`, sul gateway, nella sandbox e su Node `system.run`. `timeout: 0` disabilita il timeout del processo di esecuzione per quella chiamata.
</ParamField>

<ParamField path="pty" type="boolean" default="false">
Esegue in uno pseudo-terminale, se disponibile. Da usare per CLI che funzionano solo con TTY, agenti di programmazione e interfacce utente da terminale.
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
Dove eseguire. `auto` viene risolto in `sandbox` quando è attivo un runtime sandbox e in `gateway` negli altri casi.
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
Ignorato per le normali chiamate agli strumenti. La sicurezza di `gateway`/`node` è controllata da `tools.exec.security` e dal file delle approvazioni dell'host; la modalità con privilegi elevati può imporre `security=full` solo quando l'operatore concede esplicitamente l'accesso con privilegi elevati.
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
La modalità di richiesta di base deriva da `tools.exec.ask` e dalle approvazioni dell'host. Per le chiamate al modello originate da un canale, `ask` per chiamata viene ignorato quando la richiesta effettiva dell'host è `off`; altrimenti può solo imporre una modalità più restrittiva. I chiamanti interni/API attendibili che costruiscono strumenti di esecuzione con un valore `ask` esplicito rimangono invariati.
</ParamField>

<ParamField path="node" type="string">
ID/nome del Node quando `host=node`.
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
Richiede la modalità con privilegi elevati: esce dalla sandbox verso il percorso configurato dell'host. `security=full` viene imposto solo quando la modalità con privilegi elevati viene risolta in `full`.
</ParamField>

Note:

- `host` accetta solo `auto`, `sandbox`, `gateway` o `node`. Non è un selettore del nome host; i valori simili a nomi host vengono rifiutati prima dell'esecuzione del comando.
- `host=node` per chiamata è consentito da `auto`; `host=gateway` per chiamata è consentito solo quando non è attivo alcun runtime sandbox.
- Senza configurazione aggiuntiva, `host=auto` continua a "funzionare automaticamente": in assenza di una sandbox viene risolto in `gateway`; in presenza di una sandbox attiva rimane nella sandbox.
- `elevated` esce dalla sandbox verso il percorso configurato dell'host: `gateway` per impostazione predefinita oppure `node` quando `tools.exec.host=node` (o il valore predefinito della sessione è `host=node`). È disponibile solo quando l'accesso con privilegi elevati è abilitato per la sessione o il provider corrente.
- Le approvazioni di `gateway`/`node` sono controllate dal file delle approvazioni dell'host.
- `node` richiede un Node associato (app complementare o host Node headless). Se sono disponibili più Node, impostare `exec.node` o `tools.exec.node` per selezionarne uno.
- `exec host=node` è l'unico percorso di esecuzione shell per i Node; il wrapper precedente `nodes.run` è stato rimosso.
- Sugli host non Windows, l'esecuzione usa `SHELL` quando è impostato; se `SHELL` è `fish`, preferisce `bash` (o `sh`) da `PATH` per evitare costrutti bash incompatibili con fish, quindi ripiega su `SHELL` se nessuno dei due esiste.
- Sugli host Windows, l'esecuzione preferisce il rilevamento di PowerShell 7 (`pwsh`) (Program Files, ProgramW6432, quindi PATH), quindi ripiega su Windows PowerShell 5.1.
- Sugli host gateway non Windows, i comandi eseguiti con bash e zsh usano un'istantanea di avvio. OpenClaw acquisisce gli alias e le funzioni importabili e un piccolo insieme sicuro di variabili di ambiente dai file di avvio della shell in `$OPENCLAW_STATE_DIR/cache/shell-snapshots/`, quindi importa tale istantanea prima di ogni comando di esecuzione. Le variabili che sembrano contenere segreti vengono escluse; le esecuzioni nella sandbox e sui Node non usano questa istantanea. Impostare `OPENCLAW_EXEC_SHELL_SNAPSHOT=0` nell'ambiente del processo Gateway per disabilitare questo percorso basato sull'istantanea.
- L'esecuzione sull'host (`gateway`/`node`) rifiuta `env.PATH` e gli override del loader (`LD_*`/`DYLD_*`) per impedire il dirottamento dei binari o l'iniezione di codice.
- OpenClaw imposta `OPENCLAW_SHELL=exec` nell'ambiente del comando avviato (incluse le esecuzioni PTY e nella sandbox), affinché le regole della shell o del profilo possano rilevare il contesto dello strumento di esecuzione.
- Per le esecuzioni originate da un canale, OpenClaw espone inoltre in `OPENCLAW_CHANNEL_CONTEXT` un payload JSON limitato con l'identità del mittente e della chat, quando il canale ha fornito tali ID.
- `exec` non può eseguire i comandi shell `openclaw channels login` o `/approve`: `openclaw channels login` è un flusso interattivo di autenticazione del canale e `/approve` deve passare attraverso il gestore dei comandi di approvazione, non attraverso una shell. Eseguire l'accesso al canale in un terminale sull'host gateway oppure usare uno strumento dell'agente per l'accesso specifico del canale, se disponibile (ad esempio `whatsapp_login`).
- Importante: la sandbox è **disattivata per impostazione predefinita**. Se la sandbox è disattivata, `host=auto` implicito viene risolto in `gateway`. `host=sandbox` esplicito continua invece a interrompersi in modo sicuro, anziché eseguire silenziosamente sull'host gateway. Abilitare la sandbox oppure usare `host=gateway` con le approvazioni.
- I controlli preliminari degli script (per gli errori comuni di sintassi shell in Python/Node) esaminano solo i file all'interno del limite `workdir` effettivo. Se il percorso di uno script viene risolto all'esterno di `workdir`, il controllo preliminare viene ignorato per quel file. Il controllo preliminare viene inoltre ignorato completamente quando `host=gateway` e il criterio effettivo è `security=full` con `ask=off`.
- Per le attività di lunga durata che iniziano ora, avviarle una sola volta e affidarsi alla riattivazione automatica al completamento, quando è abilitata e il comando produce output o non riesce. Usare `process` per log, stato, input o interventi; non emulare la pianificazione con cicli di sospensione, cicli di timeout o polling ripetuto.
- Per le attività da eseguire in seguito o secondo una pianificazione, usare Cron anziché i modelli di sospensione/ritardo di `exec`.

## Configurazione

| Chiave                                | Valore predefinito                                    | Note                                                                                                                                                    |
| ------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tools.exec.timeoutSec`              | `1800`                                                 | Timeout di esecuzione predefinito per comando, in secondi. Il valore `timeout` per chiamata lo sovrascrive; `timeout: 0` per chiamata disabilita il timeout del processo di esecuzione. |
| `tools.exec.host`                    | `auto`                                                 | Viene risolto in `sandbox` quando è attivo un runtime sandbox, altrimenti in `gateway`.                                                         |
| `tools.exec.security`                | `deny` per la sandbox, `full` per Gateway/Node quando non impostato |                                                                                                                                                         |
| `tools.exec.ask`                     | `off`                                                  |                                                                                                                                                         |
| `tools.exec.mode`                    | non impostato                                          | Parametro normalizzato dei criteri. Consultare [Modalità](#modes) di seguito. Non può essere combinato con `tools.exec.security`/`tools.exec.ask`.       |
| `tools.exec.reviewer.model`          | modello principale dell'agente configurato            | Sostituzione facoltativa di provider/modello per la revisione `mode=auto`.                                                                               |
| `tools.exec.reviewer.timeoutMs`      | `30000`                                                | Timeout per fase per la preparazione e il completamento del modello revisore prima del passaggio a una persona.                                         |
| `tools.exec.node`                    | non impostato                                          |                                                                                                                                                         |
| `tools.exec.notifyOnExit`            | `true`                                                 | Se true, le sessioni di esecuzione in background accodano un evento di sistema e richiedono un Heartbeat all'uscita.                                    |
| `tools.exec.approvalRunningNoticeMs` | `10000`                                                | Emette un'unica notifica di "esecuzione in corso" quando un'esecuzione soggetta ad approvazione dura più di questo valore (`0` disabilita la notifica). |
| `tools.exec.strictInlineEval`        | `false`                                                | Consultare [Valutazione inline](#inline-eval-strictinlineeval).                                                                                         |
| `tools.exec.commandHighlighting`     | `false`                                                | Se true, le richieste di approvazione possono evidenziare nel testo del comando le porzioni derivate dal parser. Impostabile globalmente o per agente; non modifica i criteri di approvazione. |
| `tools.exec.pathPrepend`             | non impostato                                          | Elenco di directory da anteporre a `PATH` per le esecuzioni (solo Gateway + sandbox).                                                               |
| `tools.exec.safeBins`                | non impostato                                          | Binari sicuri che accettano solo stdin e possono essere eseguiti senza voci esplicite nell'elenco consentito. Consultare [Binari sicuri](/it/tools/exec-approvals-advanced#safe-bins-stdin-only). |
| `tools.exec.safeBinTrustedDirs`      | `/bin`, `/usr/bin`                                     | Directory esplicite aggiuntive considerate attendibili per i controlli dei percorsi `safeBins`. Le voci `PATH` non vengono mai considerate attendibili automaticamente. |
| `tools.exec.safeBinProfiles`         | non impostato                                          | Criteri argv personalizzati facoltativi per ogni binario sicuro (`minPositional`, `maxPositional`, `allowedValueFlags`, `deniedFlags`).             |

L'esecuzione sull'host senza approvazione è l'impostazione predefinita per Gateway e Node (`security=full`, `ask=off`): deriva dai valori predefiniti dei criteri dell'host, non da `host=auto`. Per usare approvazioni o un elenco consentito, rendere più restrittivi sia `tools.exec.*` sia il file delle approvazioni dell'host; consultare [Approvazioni delle esecuzioni](/it/tools/exec-approvals#yolo-mode-no-approval). Per forzare l'instradamento verso Gateway o Node indipendentemente dallo stato della sandbox, impostare `tools.exec.host` o usare `/exec host=...`.

Esempio:

```json5
{
  tools: {
    exec: {
      pathPrepend: ["~/bin", "/opt/oss/bin"],
    },
  },
}
```

### Modalità

`tools.exec.mode` è il parametro normalizzato dei criteri. La sua impostazione determina `security`/`ask` e non può essere combinata con valori espliciti di `tools.exec.security`/`tools.exec.ask`.

| Modalità    | sicurezza   | richiesta | Comportamento                                                                                                                          |
| ----------- | ----------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `deny`      | `deny`      | `off`     | L'esecuzione viene negata.                                                                                                             |
| `allowlist` | `allowlist` | `off`     | Vengono eseguiti solo i comandi inclusi nell'elenco consentito o considerati binari sicuri; per gli altri non viene richiesta conferma. |
| `ask`       | `allowlist` | `on-miss` | Le corrispondenze con l'elenco consentito vengono eseguite direttamente; per tutto il resto viene richiesta l'approvazione di una persona. |
| `auto`      | `allowlist` | `on-miss` | Le corrispondenze con l'elenco consentito o i binari sicuri vengono eseguite direttamente; tutto il resto passa attraverso il revisore automatico nativo di OpenClaw prima di richiedere l'approvazione di una persona. |
| `full`      | `full`      | `off`     | Nessun controllo di approvazione.                                                                                                      |

`ask`/`ask=always` richiede comunque ogni volta l'approvazione di una persona, indipendentemente dalla modalità.

L'approvazione tramite revisione automatica è monouso. Sul Gateway, OpenClaw fornisce al revisore il percorso risolto dell'eseguibile e vincola l'esecuzione allo stesso percorso. I comandi che non possono essere ridotti a un unico piano di esecuzione applicabile, come heredoc, espansioni della shell o virgolette non supportate nei wrapper, ricorrono all'approvazione di una persona anche se il modello li consentirebbe altrimenti.

Le approvazioni dei comandi dell'app server Codex che non sono già determinate da criteri espliciti del runtime o nativi seguono il percorso di approvazione umana. OpenClaw non esegue il revisore configurato per le esecuzioni su queste richieste perché Codex non espone un eseguibile risolto applicabile che possa vincolare la decisione di revisione al comando eseguito da Codex.

### Valutazione inline (`strictInlineEval`)

Quando `tools.exec.strictInlineEval` è `true`, le forme di valutazione inline dell'interprete richiedono l'approvazione del revisore o un'approvazione esplicita: `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e`, `osascript -e` e forme analoghe negli altri interpreti e vettori di comando supportati (`awk`, `find -exec`, `make`, `sed`, `xargs` e altri). In `mode=auto`, il normale percorso di approvazione dell'esecuzione può consentire al revisore automatico nativo di approvare un comando occasionale chiaramente a basso rischio; le chiamate dirette `system.run` sull'host Node richiedono comunque un'approvazione esplicita, poiché non possono inoltrare il comando a un percorso di approvazione umana. Se il revisore richiede conferma, la richiesta viene inoltrata a una persona. `allow-always` può comunque rendere persistenti le invocazioni innocue di interpreti/script, ma le forme di valutazione inline non diventano regole di autorizzazione permanenti.

### Gestione di PATH

- `host=gateway`: unisce il `PATH` della shell di login all'ambiente di esecuzione. Le sostituzioni di `env.PATH` vengono rifiutate per l'esecuzione sull'host. Il daemon stesso continua a essere eseguito con un `PATH` minimo:
  - macOS: `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux: `/usr/local/bin`, `/usr/bin`, `/bin`
  - Per impedire che la configurazione della shell dell'utente, come `~/.zshenv` o `/etc/zshenv`, sovrascriva i percorsi prioritari durante l'avvio, le voci `tools.exec.pathPrepend` vengono anteposte in modo sicuro al `PATH` finale all'interno del comando della shell subito prima dell'esecuzione.
- `host=sandbox`: esegue `sh -lc` (shell di login) all'interno del container, quindi `/etc/profile` può reimpostare `PATH`. OpenClaw antepone `env.PATH` dopo il caricamento del profilo tramite una variabile d'ambiente interna, senza interpolazione della shell; anche `tools.exec.pathPrepend` si applica in questo caso.
- `host=node`: al Node vengono inviate solo le sostituzioni di ambiente non bloccate specificate. Le sostituzioni di `env.PATH` vengono rifiutate per l'esecuzione sull'host e ignorate dagli host Node. Se sono necessarie ulteriori voci PATH su un Node, configurare l'ambiente del servizio host Node (systemd/launchd) o installare gli strumenti nelle posizioni standard.

Associazione di un Node per agente (usare l'indice dell'agente nell'elenco della configurazione):

```bash
openclaw config get agents.list
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
```

Interfaccia di controllo: la pagina **Dispositivi** include un piccolo pannello "Associazione del Node di esecuzione" per le stesse impostazioni.

## Sostituzioni della sessione (`/exec`)

Usare `/exec` per impostare i valori predefiniti **per sessione** di `host`, `security`, `ask` e `node`. Inviare `/exec` senza argomenti per visualizzare i valori correnti.

Esempio:

```text
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

`/exec` viene rispettato solo per i **mittenti autorizzati** (elenchi consentiti/associazione del canale più `commands.useAccessGroups`). Aggiorna **solo lo stato della sessione** e non scrive nella configurazione. I mittenti autorizzati dei canali esterni possono impostare questi valori predefiniti della sessione. I client interni di Gateway/webchat necessitano di `operator.admin` per renderli persistenti.

Per disabilitare completamente l'esecuzione, negarla tramite i criteri degli strumenti (`tools.deny: ["exec"]` o per agente). Le approvazioni dell'host continuano ad applicarsi, a meno che non vengano impostati esplicitamente `security=full` e `ask=off`.

## Approvazioni delle esecuzioni (app complementare/host Node)

Gli agenti in sandbox possono richiedere un'approvazione per ogni richiesta prima che `exec` venga eseguito sul Gateway o sull'host Node. Consultare [Approvazioni delle esecuzioni](/it/tools/exec-approvals) per i criteri, l'elenco consentito e il flusso dell'interfaccia.

Quando è richiesta l'approvazione di una persona, i flussi dell'host Node e i flussi non nativi del Gateway restituiscono immediatamente `status: "approval-pending"` e un ID di approvazione. I flussi nativi della chat e dell'interfaccia Web del Gateway possono invece attendere inline e restituire il risultato finale del comando dopo l'approvazione. Un risultato `approval-pending` indica che il comando non è stato avviato, pertanto gli avvisi di fallback in primo piano vengono visualizzati solo se il comando approvato viene effettivamente eseguito inline. Le esecuzioni asincrone approvate emettono eventi di sistema relativi all'avanzamento e al completamento del comando (`Exec running` / `Exec finished`); le approvazioni negate o scadute sono definitive e non riattivano la sessione dell'agente con un evento di sistema di negazione.

Nei canali con schede/pulsanti di approvazione nativi, l'agente deve fare affidamento innanzitutto su tale interfaccia utente nativa e includere un comando manuale `/approve` solo quando il risultato dello strumento indica esplicitamente che le approvazioni tramite chat non sono disponibili o che l'approvazione manuale è l'unica opzione.

## Allowlist e binari sicuri

L'applicazione manuale dell'allowlist confronta i glob dei percorsi binari risolti e i glob dei soli nomi dei comandi. I nomi semplici corrispondono solo ai comandi invocati tramite PATH, quindi `rg` può corrispondere a `/opt/homebrew/bin/rg` quando il comando è `rg`, ma non a `./rg` o `/tmp/rg`.

Quando `security=allowlist`, i comandi shell sono consentiti automaticamente solo se ogni segmento della pipeline è incluso nell'allowlist o è un binario sicuro. Il concatenamento (`;`, `&&`, `||`) e i reindirizzamenti vengono rifiutati in modalità allowlist, a meno che ogni segmento di primo livello non soddisfi l'allowlist (inclusi i binari sicuri). I reindirizzamenti restano non supportati. La fiducia permanente `allow-always` non consente di aggirare questa regola: un comando concatenato richiede comunque una corrispondenza per ogni segmento di primo livello.

`autoAllowSkills` è un percorso agevolato separato nelle approvazioni di exec e non equivale alle voci manuali dell'allowlist dei percorsi. Per una fiducia esplicita rigorosa, mantenere `autoAllowSkills` disabilitato.

Usare i due controlli per scopi diversi:

- `tools.exec.safeBins`: filtri di flusso di piccole dimensioni, solo stdin.
- `tools.exec.safeBinTrustedDirs`: directory attendibili aggiuntive esplicite per i percorsi eseguibili dei binari sicuri.
- `tools.exec.safeBinProfiles`: criterio argv esplicito per i binari sicuri personalizzati.
- allowlist: fiducia esplicita per i percorsi eseguibili.

Non considerare `safeBins` come un'allowlist generica e non aggiungere binari di interpreti/runtime (ad esempio `python3`, `node`, `ruby`, `bash`). Se sono necessari, usare voci esplicite nell'allowlist e mantenere abilitate le richieste di approvazione.

`openclaw security audit` avvisa quando nelle voci `safeBins` degli interpreti/runtime mancano profili espliciti e `openclaw doctor --fix` può generare la struttura delle voci `safeBinProfiles` personalizzate mancanti. Anche `openclaw security audit` e `openclaw doctor` avvisano quando si aggiungono esplicitamente binari con comportamento ampio, come `jq`, nuovamente a `safeBins` (`jq` può leggere dati dell'ambiente e caricare codice jq da moduli o file di avvio, quindi è preferibile usare voci esplicite nell'allowlist o esecuzioni soggette ad approvazione). `jq` viene rifiutato come binario sicuro anche quando è elencato esplicitamente. Se si includono esplicitamente gli interpreti nell'allowlist, abilitare `tools.exec.strictInlineEval` affinché le forme di valutazione inline del codice richiedano comunque la revisione o l'approvazione esplicita.

Per dettagli ed esempi completi sui criteri, consultare [Approvazioni di exec](/it/tools/exec-approvals-advanced#safe-bins-stdin-only) e [Binari sicuri e allowlist a confronto](/it/tools/exec-approvals-advanced#safe-bins-versus-allowlist).

## Esempi

In primo piano:

```json
{ "tool": "exec", "command": "ls -la" }
```

In background + polling:

```json
{"tool":"exec","command":"npm run build","yieldMs":1000}
{"tool":"process","action":"poll","sessionId":"<id>"}
```

Il polling serve a ottenere lo stato su richiesta, non a creare cicli di attesa. Se è abilitata la riattivazione automatica al completamento, il comando può riattivare la sessione quando produce output o non riesce.

Invio di tasti (stile tmux):

```json
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Enter"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["C-c"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Up","Up","Enter"]}
```

Invio (invia solo CR):

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

Incolla (con modalità bracketed paste per impostazione predefinita):

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` è un sottostrumento di `exec` per modifiche strutturate su più file. È abilitato per impostazione predefinita e disponibile per qualsiasi provider di modelli; `allowModels` può limitarne l'uso. Usare la configurazione solo per disabilitarlo o limitarlo a modelli specifici:

```json5
{
  tools: {
    exec: {
      applyPatch: { workspaceOnly: true, allowModels: ["gpt-5.6-sol"] },
    },
  },
}
```

Note:

- Il criterio degli strumenti continua ad applicarsi; `allow: ["write"]` consente implicitamente `apply_patch`.
- `deny: ["write"]` non nega `apply_patch`; negare esplicitamente `apply_patch` oppure usare `deny: ["group:fs"]` quando devono essere bloccate anche le scritture delle patch.
- La configurazione si trova in `tools.exec.applyPatch`.
- `tools.exec.applyPatch.enabled` ha come valore predefinito `true`; impostarlo su `false` per disabilitare lo strumento.
- `tools.exec.applyPatch.workspaceOnly` ha come valore predefinito `true` (limitato all'area di lavoro). Impostarlo su `false` solo se si vuole intenzionalmente consentire a `apply_patch` di scrivere/eliminare al di fuori della directory dell'area di lavoro.
- `tools.exec.applyPatch.allowModels` è un'allowlist facoltativa di ID dei modelli (in forma semplice, come `gpt-5.4`, o completa, come `openai/gpt-5.4`). Se è impostata, solo i modelli corrispondenti ricevono lo strumento; se non è impostata, lo ricevono tutti i modelli.

## Correlati

- [Approvazioni di exec](/it/tools/exec-approvals) — controlli di approvazione per i comandi shell
- [Sandboxing](/it/gateway/sandboxing) — esecuzione di comandi in ambienti con sandbox
- [Processo in background](/it/gateway/background-process) — strumenti exec e process per operazioni di lunga durata
- [Sicurezza](/it/gateway/security) — criteri degli strumenti e accesso con privilegi elevati
