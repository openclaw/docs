---
read_when:
    - Modifica dell'accesso ai file, dell'estrazione degli archivi, dell'archiviazione dell'area di lavoro o degli helper del filesystem dei plugin
summary: Come OpenClaw gestisce in sicurezza l'accesso ai file locali e perché l'helper Python opzionale fs-safe è disattivato per impostazione predefinita
title: Operazioni sicure sui file
x-i18n:
    generated_at: "2026-07-12T07:05:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5c8edf36ddbb8c8bc1edc52ecdf481affe5395d1779c679a40439167dfe70299
    source_path: gateway/security/secure-file-operations.md
    workflow: 16
---

OpenClaw utilizza [`@openclaw/fs-safe`](https://github.com/openclaw/fs-safe) per le operazioni sensibili alla sicurezza sui file locali: letture/scritture limitate alla directory radice, sostituzione atomica, estrazione di archivi, spazi di lavoro temporanei, stato JSON e gestione dei file contenenti segreti.

È una **protezione a livello di libreria** per il codice OpenClaw attendibile che riceve nomi di percorsi non attendibili, non una sandbox. Le autorizzazioni del file system dell'host, gli utenti del sistema operativo, i container e i criteri dell'agente e degli strumenti continuano a definire il reale raggio d'impatto.

## Impostazione predefinita: nessun helper Python

OpenClaw imposta l'helper Python POSIX di fs-safe come **disattivato** per impostazione predefinita:

- il Gateway non deve avviare un processo ausiliario Python persistente, a meno che un operatore non lo abiliti esplicitamente;
- la maggior parte delle installazioni non necessita della protezione aggiuntiva contro le modifiche alle directory superiori;
- la disattivazione di Python mantiene prevedibile il comportamento in fase di esecuzione negli ambienti desktop, Docker, CI e delle applicazioni distribuite in bundle.

OpenClaw modifica soltanto l'impostazione _predefinita_. Un'impostazione esplicita ha sempre la precedenza:

```bash
# Comportamento predefinito di OpenClaw: fallback fs-safe basati solo su Node.
OPENCLAW_FS_SAFE_PYTHON_MODE=off

# Abilita l'helper quando disponibile, ricorrendo al fallback se non è disponibile.
OPENCLAW_FS_SAFE_PYTHON_MODE=auto

# Interrompe l'esecuzione in modo sicuro se l'helper non può avviarsi.
OPENCLAW_FS_SAFE_PYTHON_MODE=require

# Percorso esplicito facoltativo dell'interprete.
OPENCLAW_FS_SAFE_PYTHON=/usr/bin/python3
```

Funzionano anche i nomi generici delle variabili di ambiente di fs-safe: `FS_SAFE_PYTHON_MODE` e `FS_SAFE_PYTHON`.

Utilizza `require` (non `auto`) quando l'helper fa parte della tua strategia di sicurezza; `auto` ricorre silenziosamente al comportamento basato solo su Node se l'helper non può avviarsi.

## Cosa rimane protetto senza Python

Con l'helper disattivato, OpenClaw continua a beneficiare delle protezioni di fs-safe basate solo su Node:

- rifiuta i tentativi di uscire dal percorso relativo (`..`), i percorsi assoluti e i separatori di percorso nei casi in cui sono consentiti soltanto nomi semplici;
- esegue le operazioni tramite un handle attendibile della directory radice anziché ricorrere a controlli ad hoc come `path.resolve(...).startsWith(...)`;
- rifiuta schemi con collegamenti simbolici e collegamenti fisici nelle API che richiedono tali criteri;
- apre i file verificandone l'identità quando l'API restituisce o utilizza il contenuto dei file;
- scrive i file di stato e configurazione tramite un file temporaneo adiacente e una rinomina atomica;
- applica limiti in byte alle letture e all'estrazione degli archivi;
- applica modalità di accesso private ai segreti e ai file di stato quando richiesto dall'API.

Ciò copre il normale modello di minaccia di OpenClaw: codice Gateway attendibile che gestisce input di percorso non attendibili provenienti da modelli, Plugin o canali all'interno del confine di un singolo operatore attendibile.

## Cosa aggiunge Python

Su POSIX, l'helper facoltativo mantiene un processo Python persistente e utilizza operazioni sul file system relative ai descrittori di file per le modifiche alle directory superiori: rinomina, rimozione, creazione di directory, rilevamento dello stato/elenco e alcuni percorsi di scrittura.

Ciò riduce le finestre temporali per condizioni di competizione con lo stesso UID, nelle quali un altro processo sostituisce una directory superiore tra la convalida e la modifica: una difesa in profondità sugli host in cui processi locali non attendibili possono modificare le stesse directory in cui opera OpenClaw.

Se la tua distribuzione presenta questo rischio e la presenza di Python è garantita, imposta:

```bash
OPENCLAW_FS_SAFE_PYTHON_MODE=require
```

## Indicazioni per Plugin e core

- L'accesso ai file da parte dei Plugin deve avvenire tramite gli helper `openclaw/plugin-sdk/*`, non direttamente tramite `fs`, quando un percorso proviene da un messaggio, dall'output di un modello, dalla configurazione o dall'input di un Plugin.
- Il codice core deve utilizzare i wrapper fs-safe in `src/infra/*`, affinché i criteri di processo di OpenClaw siano applicati in modo coerente.
- L'estrazione degli archivi deve utilizzare gli helper per archivi di fs-safe con limiti espliciti per dimensioni, numero di elementi, collegamenti e destinazione.
- I segreti devono utilizzare gli helper per i segreti di OpenClaw oppure gli helper di fs-safe per segreti e stato privato; non implementare manualmente controlli delle modalità di accesso attorno a `fs.writeFile`.
- Per l'isolamento da utenti locali ostili, non affidarti esclusivamente a fs-safe. Esegui Gateway separati con utenti del sistema operativo o host distinti oppure utilizza una sandbox.

Vedi anche: [Sicurezza](/it/gateway/security), [Uso della sandbox](/it/gateway/sandboxing), [Approvazioni dell'esecuzione](/it/tools/exec-approvals), [Segreti](/it/gateway/secrets).
