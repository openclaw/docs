---
read_when:
    - Modifica dell'accesso ai file, dell'estrazione degli archivi, dell'archiviazione dell'area di lavoro o degli helper del filesystem dei Plugin
summary: Come OpenClaw gestisce in modo sicuro l'accesso ai file locali e perché lo strumento di supporto Python fs-safe opzionale è disattivato per impostazione predefinita
title: Operazioni sicure sui file
x-i18n:
    generated_at: "2026-05-06T08:53:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 19d5b31ec2f2c7ab1033bdb55a701c60468dfac58142f726ecbc9ac933f68e30
    source_path: gateway/security/secure-file-operations.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw usa [`@openclaw/fs-safe`](https://github.com/openclaw/fs-safe) per operazioni sui file locali sensibili alla sicurezza: letture/scritture delimitate alla radice, sostituzione atomica, estrazione di archivi, workspace temporanei, stato JSON e gestione dei file segreti.

L'obiettivo è una **barriera di protezione della libreria** coerente per codice OpenClaw attendibile che riceve nomi di percorso non attendibili. Non è una sandbox. Le autorizzazioni del filesystem host, gli utenti del sistema operativo, i container e la policy di agenti/strumenti definiscono comunque il reale raggio d'impatto.

## Predefinito: nessun helper Python

OpenClaw imposta per impostazione predefinita l'helper Python POSIX di fs-safe su **off**.

Perché:

- il gateway non dovrebbe avviare un sidecar Python persistente a meno che un operatore non abbia scelto di abilitarlo;
- molte installazioni non hanno bisogno dell'irrobustimento aggiuntivo contro le mutazioni delle directory padre;
- disabilitare Python mantiene il comportamento di package/runtime più prevedibile tra ambienti desktop, Docker, CI e app in bundle.

OpenClaw modifica solo il valore predefinito. Se imposti esplicitamente una modalità, fs-safe la rispetta:

```bash
# Default OpenClaw behavior: Node-only fs-safe fallbacks.
OPENCLAW_FS_SAFE_PYTHON_MODE=off

# Opt into the helper when available, falling back if unavailable.
OPENCLAW_FS_SAFE_PYTHON_MODE=auto

# Fail closed if the helper cannot start.
OPENCLAW_FS_SAFE_PYTHON_MODE=require

# Optional explicit interpreter.
OPENCLAW_FS_SAFE_PYTHON=/usr/bin/python3
```

Funzionano anche i nomi generici di fs-safe: `FS_SAFE_PYTHON_MODE` e `FS_SAFE_PYTHON`.

## Cosa resta protetto senza Python

Con l'helper disattivato, OpenClaw usa comunque i percorsi Node di fs-safe per:

- rifiutare escape da percorsi relativi come `..`, percorsi assoluti e separatori di percorso dove sono consentiti solo nomi;
- risolvere le operazioni tramite un handle radice attendibile invece di controlli ad hoc `path.resolve(...).startsWith(...)`;
- rifiutare pattern di symlink e hardlink sulle API che richiedono tale policy;
- aprire file con controlli di identità quando l'API restituisce o consuma contenuti di file;
- scritture atomiche con file temporanei sibling per file di stato/configurazione;
- limiti di byte per letture ed estrazione di archivi;
- modalità private per segreti e file di stato dove l'API le richiede.

Queste protezioni coprono il normale modello di minaccia di OpenClaw: codice gateway attendibile che gestisce input di percorso non attendibili da modello/plugin/canale all'interno del perimetro di un singolo operatore attendibile.

## Cosa aggiunge Python

Su POSIX, l'helper opzionale di fs-safe mantiene un processo Python persistente e usa operazioni filesystem relative a fd per mutazioni delle directory padre come rename, remove, mkdir, stat/list e alcuni percorsi di scrittura.

Questo riduce le finestre di race della stessa UID in cui un altro processo può scambiare una directory padre tra validazione e mutazione. È difesa in profondità per host in cui processi locali non attendibili possono modificare le stesse directory su cui OpenClaw sta operando.

Se il tuo deployment ha questo rischio e Python è garantito, usa:

```bash
OPENCLAW_FS_SAFE_PYTHON_MODE=require
```

Usa `require` invece di `auto` quando l'helper fa parte della tua postura di sicurezza; `auto` ripiega intenzionalmente sul comportamento solo Node se l'helper non è disponibile.

## Indicazioni per Plugin e core

- L'accesso ai file rivolto ai Plugin dovrebbe passare dagli helper `openclaw/plugin-sdk/*`, non da `fs` grezzo, quando un percorso proviene da un messaggio, output del modello, configurazione o input del Plugin.
- Il codice core dovrebbe usare i wrapper fs-safe locali in `src/infra/*` in modo che la policy di processo di OpenClaw sia applicata coerentemente.
- L'estrazione di archivi dovrebbe usare gli helper di archivio fs-safe con limiti espliciti di dimensione, numero di voci, link e destinazione.
- I segreti dovrebbero usare gli helper per segreti di OpenClaw o gli helper fs-safe per segreti/stato privato; non implementare manualmente controlli di modalità attorno a `fs.writeFile`.
- Se ti serve isolamento da utenti locali ostili, non fare affidamento solo su fs-safe. Esegui gateway separati sotto utenti/host del sistema operativo separati o usa sandboxing.

Correlati: [Sicurezza](/it/gateway/security), [Sandboxing](/it/gateway/sandboxing), [Approvazioni exec](/it/tools/exec-approvals), [Segreti](/it/gateway/secrets).
