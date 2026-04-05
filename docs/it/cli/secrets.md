---
read_when:
    - Ririsoluzione dei riferimenti ai segreti in fase di esecuzione
    - Verifica dei residui in testo semplice e dei riferimenti non risolti
    - Configurazione di SecretRef e applicazione di modifiche di pulizia irreversibili
summary: Riferimento CLI per `openclaw secrets` (ricaricare, verificare, configurare, applicare)
title: secrets
x-i18n:
    generated_at: "2026-04-05T13:49:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: f436ba089d752edb766c0a3ce746ee6bca1097b22c9b30e3d9715cb0bb50bf47
    source_path: cli/secrets.md
    workflow: 15
---

# `openclaw secrets`

Usa `openclaw secrets` per gestire SecretRef e mantenere integro lo snapshot di runtime attivo.

Ruoli dei comandi:

- `reload`: RPC del gateway (`secrets.reload`) che ririsolve i riferimenti e sostituisce lo snapshot di runtime solo in caso di successo completo (nessuna scrittura della configurazione).
- `audit`: scansione in sola lettura di archivi di configurazione/autenticazione/modelli generati e residui legacy per testo semplice, riferimenti non risolti e deriva di precedenza (i riferimenti exec vengono saltati a meno che non sia impostato `--allow-exec`).
- `configure`: pianificatore interattivo per configurazione del provider, mappatura della destinazione e preflight (TTY richiesto).
- `apply`: esegue un piano salvato (`--dry-run` solo per la convalida; il dry-run salta per impostazione predefinita i controlli exec, e la modalità di scrittura rifiuta i piani che contengono exec a meno che non sia impostato `--allow-exec`), quindi pulisce i residui mirati in testo semplice.

Ciclo operativo consigliato:

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets audit --check
openclaw secrets reload
```

Se il tuo piano include SecretRef/provider `exec`, passa `--allow-exec` sia ai comandi di dry-run sia ai comandi `apply` in modalità scrittura.

Nota sui codici di uscita per CI/gate:

- `audit --check` restituisce `1` in presenza di risultati.
- i riferimenti non risolti restituiscono `2`.

Correlati:

- Guida ai segreti: [Gestione dei segreti](/gateway/secrets)
- Superficie delle credenziali: [Superficie delle credenziali SecretRef](/reference/secretref-credential-surface)
- Guida alla sicurezza: [Sicurezza](/gateway/security)

## Ricaricare lo snapshot di runtime

Ririsolvi i riferimenti ai segreti e sostituisci in modo atomico lo snapshot di runtime.

```bash
openclaw secrets reload
openclaw secrets reload --json
openclaw secrets reload --url ws://127.0.0.1:18789 --token <token>
```

Note:

- Usa il metodo RPC del gateway `secrets.reload`.
- Se la risoluzione fallisce, il gateway mantiene l'ultimo snapshot valido noto e restituisce un errore (nessuna attivazione parziale).
- La risposta JSON include `warningCount`.

Opzioni:

- `--url <url>`
- `--token <token>`
- `--timeout <ms>`
- `--json`

## Verifica

Scansiona lo stato di OpenClaw per rilevare:

- archiviazione di segreti in testo semplice
- riferimenti non risolti
- deriva di precedenza (credenziali in `auth-profiles.json` che oscurano i riferimenti in `openclaw.json`)
- residui generati in `agents/*/agent/models.json` (valori `apiKey` del provider e intestazioni sensibili del provider)
- residui legacy (voci legacy dell'archivio di autenticazione, promemoria OAuth)

Nota sui residui nelle intestazioni:

- Il rilevamento delle intestazioni sensibili del provider si basa su euristiche dei nomi (nomi e frammenti comuni di intestazioni di autenticazione/credenziali come `authorization`, `x-api-key`, `token`, `secret`, `password` e `credential`).

```bash
openclaw secrets audit
openclaw secrets audit --check
openclaw secrets audit --json
openclaw secrets audit --allow-exec
```

Comportamento in uscita:

- `--check` termina con un codice diverso da zero in presenza di risultati.
- i riferimenti non risolti terminano con un codice diverso da zero a priorità più alta.

Punti salienti della struttura del report:

- `status`: `clean | findings | unresolved`
- `resolution`: `refsChecked`, `skippedExecRefs`, `resolvabilityComplete`
- `summary`: `plaintextCount`, `unresolvedRefCount`, `shadowedRefCount`, `legacyResidueCount`
- codici dei risultati:
  - `PLAINTEXT_FOUND`
  - `REF_UNRESOLVED`
  - `REF_SHADOWED`
  - `LEGACY_RESIDUE`

## Configure (helper interattivo)

Crea in modo interattivo modifiche ai provider e a SecretRef, esegue il preflight e facoltativamente applica:

```bash
openclaw secrets configure
openclaw secrets configure --plan-out /tmp/openclaw-secrets-plan.json
openclaw secrets configure --apply --yes
openclaw secrets configure --providers-only
openclaw secrets configure --skip-provider-setup
openclaw secrets configure --agent ops
openclaw secrets configure --json
```

Flusso:

- Prima configurazione del provider (`add/edit/remove` per gli alias `secrets.providers`).
- Poi mappatura delle credenziali (seleziona i campi e assegna riferimenti `{source, provider, id}`).
- Infine preflight e applicazione facoltativa.

Flag:

- `--providers-only`: configura solo `secrets.providers`, salta la mappatura delle credenziali.
- `--skip-provider-setup`: salta la configurazione del provider e mappa le credenziali ai provider esistenti.
- `--agent <id>`: limita il rilevamento delle destinazioni e le scritture in `auth-profiles.json` a un solo archivio agente.
- `--allow-exec`: consente i controlli exec di SecretRef durante preflight/apply (può eseguire comandi del provider).

Note:

- Richiede un TTY interattivo.
- Non è possibile combinare `--providers-only` con `--skip-provider-setup`.
- `configure` prende di mira i campi che contengono segreti in `openclaw.json` più `auth-profiles.json` per l'ambito agente selezionato.
- `configure` supporta la creazione diretta di nuove mappature `auth-profiles.json` nel flusso del selettore.
- Superficie supportata canonica: [Superficie delle credenziali SecretRef](/reference/secretref-credential-surface).
- Esegue la risoluzione di preflight prima di apply.
- Se preflight/apply include riferimenti exec, mantieni `--allow-exec` impostato per entrambi i passaggi.
- I piani generati usano per impostazione predefinita le opzioni di pulizia (`scrubEnv`, `scrubAuthProfilesForProviderTargets`, `scrubLegacyAuthJson` tutte abilitate).
- Il percorso `apply` è irreversibile per i valori in testo semplice sottoposti a pulizia.
- Senza `--apply`, la CLI chiede comunque `Apply this plan now?` dopo il preflight.
- Con `--apply` (e senza `--yes`), la CLI richiede un'ulteriore conferma irreversibile.
- `--json` stampa il piano + il report di preflight, ma il comando richiede comunque un TTY interattivo.

Nota di sicurezza per il provider exec:

- Le installazioni Homebrew spesso espongono binari con symlink in `/opt/homebrew/bin/*`.
- Imposta `allowSymlinkCommand: true` solo quando necessario per percorsi attendibili del gestore di pacchetti e abbinalo a `trustedDirs` (per esempio `["/opt/homebrew"]`).
- In Windows, se la verifica ACL non è disponibile per un percorso del provider, OpenClaw fallisce in modalità chiusa. Solo per percorsi attendibili, imposta `allowInsecurePath: true` su quel provider per bypassare i controlli di sicurezza del percorso.

## Applicare un piano salvato

Applica o esegui il preflight di un piano generato in precedenza:

```bash
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --json
```

Comportamento exec:

- `--dry-run` convalida il preflight senza scrivere file.
- I controlli exec di SecretRef vengono saltati per impostazione predefinita in dry-run.
- La modalità di scrittura rifiuta i piani che contengono SecretRef/provider exec a meno che non sia impostato `--allow-exec`.
- Usa `--allow-exec` per abilitare i controlli/l'esecuzione del provider exec in entrambe le modalità.

Dettagli del contratto del piano (percorsi di destinazione consentiti, regole di convalida e semantica dei fallimenti):

- [Contratto del piano di applicazione dei segreti](/gateway/secrets-plan-contract)

Cosa può aggiornare `apply`:

- `openclaw.json` (destinazioni SecretRef + upsert/eliminazione dei provider)
- `auth-profiles.json` (pulizia delle destinazioni del provider)
- residui legacy in `auth.json`
- chiavi di segreto note in `~/.openclaw/.env` i cui valori sono stati migrati

## Perché non esistono backup di rollback

`secrets apply` intenzionalmente non scrive backup di rollback contenenti i vecchi valori in testo semplice.

La sicurezza deriva da un preflight rigoroso + un apply quasi atomico con ripristino in memoria best-effort in caso di errore.

## Esempio

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets audit --check
```

Se `audit --check` continua a segnalare risultati di testo semplice, aggiorna i restanti percorsi di destinazione segnalati e riesegui la verifica.
