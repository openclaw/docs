---
read_when:
    - Ririsoluzione dei ref segreti in fase di esecuzione
    - Verifica di residui in chiaro e ref non risolti
    - Configurazione di SecretRef e applicazione di modifiche di scrub unidirezionali
summary: Riferimento CLI per `openclaw secrets` (ricaricare, verificare, configurare, applicare)
title: Segreti
x-i18n:
    generated_at: "2026-04-24T08:35:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6fe1933ca6a9f2a24fbbe20fa3b83bf8f6493ea6c94061e135b4e1b48c33d62c
    source_path: cli/secrets.md
    workflow: 15
---

# `openclaw secrets`

Usa `openclaw secrets` per gestire SecretRef e mantenere sano lo snapshot runtime attivo.

Ruoli dei comandi:

- `reload`: RPC gateway (`secrets.reload`) che ririsolve i ref e sostituisce lo snapshot runtime solo in caso di successo completo (nessuna scrittura di configurazione).
- `audit`: scansione in sola lettura di archivi di configurazione/autenticazione/modelli generati e residui legacy per testo in chiaro, ref non risolti e deriva di precedenza (i ref exec vengono saltati a meno che non sia impostato `--allow-exec`).
- `configure`: planner interattivo per configurazione provider, mappatura dei target e preflight (richiede TTY).
- `apply`: esegue un piano salvato (`--dry-run` solo per validazione; il dry-run salta per impostazione predefinita i controlli exec, e la modalità scrittura rifiuta i piani che contengono exec a meno che non sia impostato `--allow-exec`), quindi pulisce i residui in chiaro mirati.

Loop operatore consigliato:

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets audit --check
openclaw secrets reload
```

Se il tuo piano include provider/SecretRef `exec`, passa `--allow-exec` sia sui comandi apply dry-run sia su quelli in scrittura.

Nota sul codice di uscita per CI/controlli:

- `audit --check` restituisce `1` in presenza di risultati.
- i ref non risolti restituiscono `2`.

Correlati:

- Guida ai segreti: [Gestione dei segreti](/it/gateway/secrets)
- Superficie delle credenziali: [Superficie delle credenziali SecretRef](/it/reference/secretref-credential-surface)
- Guida alla sicurezza: [Sicurezza](/it/gateway/security)

## Ricaricare lo snapshot runtime

Ririsolve i ref segreti e sostituisce atomicamente lo snapshot runtime.

```bash
openclaw secrets reload
openclaw secrets reload --json
openclaw secrets reload --url ws://127.0.0.1:18789 --token <token>
```

Note:

- Usa il metodo RPC del gateway `secrets.reload`.
- Se la risoluzione fallisce, il gateway mantiene l'ultimo snapshot noto funzionante e restituisce un errore (nessuna attivazione parziale).
- La risposta JSON include `warningCount`.

Opzioni:

- `--url <url>`
- `--token <token>`
- `--timeout <ms>`
- `--json`

## Audit

Scansiona lo stato di OpenClaw per:

- archiviazione di segreti in chiaro
- ref non risolti
- deriva di precedenza (credenziali in `auth-profiles.json` che oscurano i ref in `openclaw.json`)
- residui generati in `agents/*/agent/models.json` (valori provider `apiKey` e header provider sensibili)
- residui legacy (voci legacy dell'archivio auth, promemoria OAuth)

Nota sui residui negli header:

- Il rilevamento di header provider sensibili è basato su euristiche del nome (nomi e frammenti comuni per header di autenticazione/credenziali come `authorization`, `x-api-key`, `token`, `secret`, `password` e `credential`).

```bash
openclaw secrets audit
openclaw secrets audit --check
openclaw secrets audit --json
openclaw secrets audit --allow-exec
```

Comportamento in uscita:

- `--check` esce con valore non zero in presenza di risultati.
- i ref non risolti escono con un codice non zero a priorità più alta.

Elementi salienti della struttura del report:

- `status`: `clean | findings | unresolved`
- `resolution`: `refsChecked`, `skippedExecRefs`, `resolvabilityComplete`
- `summary`: `plaintextCount`, `unresolvedRefCount`, `shadowedRefCount`, `legacyResidueCount`
- codici dei risultati:
  - `PLAINTEXT_FOUND`
  - `REF_UNRESOLVED`
  - `REF_SHADOWED`
  - `LEGACY_RESIDUE`

## Configure (helper interattivo)

Costruisci in modo interattivo modifiche a provider e SecretRef, esegui il preflight e facoltativamente applicale:

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
- Seconda mappatura delle credenziali (seleziona i campi e assegna ref `{source, provider, id}`).
- Preflight e apply facoltativo alla fine.

Flag:

- `--providers-only`: configura solo `secrets.providers`, salta la mappatura delle credenziali.
- `--skip-provider-setup`: salta la configurazione del provider e mappa le credenziali ai provider esistenti.
- `--agent <id>`: limita discovery dei target e scritture di `auth-profiles.json` a un archivio agente.
- `--allow-exec`: consente i controlli exec SecretRef durante preflight/apply (può eseguire comandi provider).

Note:

- Richiede una TTY interattiva.
- Non puoi combinare `--providers-only` con `--skip-provider-setup`.
- `configure` prende di mira i campi che contengono segreti in `openclaw.json` più `auth-profiles.json` per l'ambito agente selezionato.
- `configure` supporta la creazione diretta di nuove mappature `auth-profiles.json` nel flusso del selettore.
- Superficie canonica supportata: [Superficie delle credenziali SecretRef](/it/reference/secretref-credential-surface).
- Esegue la risoluzione di preflight prima dell'apply.
- Se il preflight/apply include ref exec, mantieni `--allow-exec` impostato in entrambi i passaggi.
- I piani generati usano per impostazione predefinita opzioni di scrub (`scrubEnv`, `scrubAuthProfilesForProviderTargets`, `scrubLegacyAuthJson` tutte abilitate).
- Il percorso apply è unidirezionale per i valori in chiaro sottoposti a scrub.
- Senza `--apply`, la CLI chiede comunque `Apply this plan now?` dopo il preflight.
- Con `--apply` (e senza `--yes`), la CLI chiede un'ulteriore conferma irreversibile.
- `--json` stampa il piano + report di preflight, ma il comando richiede comunque una TTY interattiva.

Nota sulla sicurezza del provider exec:

- Le installazioni Homebrew espongono spesso binari collegati tramite symlink sotto `/opt/homebrew/bin/*`.
- Imposta `allowSymlinkCommand: true` solo quando necessario per percorsi affidabili del package manager e abbinalo a `trustedDirs` (ad esempio `["/opt/homebrew"]`).
- Su Windows, se la verifica ACL non è disponibile per un percorso provider, OpenClaw fallisce in modalità fail-closed. Solo per percorsi affidabili, imposta `allowInsecurePath: true` su quel provider per bypassare i controlli di sicurezza del percorso.

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

- `--dry-run` valida il preflight senza scrivere file.
- i controlli exec SecretRef vengono saltati per impostazione predefinita nel dry-run.
- la modalità scrittura rifiuta i piani che contengono provider/SecretRef exec a meno che non sia impostato `--allow-exec`.
- Usa `--allow-exec` per abilitare esplicitamente controlli/esecuzione dei provider exec in entrambe le modalità.

Dettagli del contratto del piano (percorsi target consentiti, regole di validazione e semantica dei fallimenti):

- [Contratto del piano Secrets Apply](/it/gateway/secrets-plan-contract)

Cosa può aggiornare `apply`:

- `openclaw.json` (target SecretRef + upsert/delete dei provider)
- `auth-profiles.json` (scrub dei target provider)
- residui legacy in `auth.json`
- chiavi segrete note in `~/.openclaw/.env` i cui valori sono stati migrati

## Perché non ci sono backup di rollback

`secrets apply` intenzionalmente non scrive backup di rollback che contengano vecchi valori in chiaro.

La sicurezza deriva da preflight rigoroso + apply quasi atomico con ripristino in memoria best-effort in caso di errore.

## Esempio

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets audit --check
```

Se `audit --check` continua a riportare risultati di testo in chiaro, aggiorna i restanti percorsi target segnalati ed esegui di nuovo l'audit.

## Correlati

- [Riferimento CLI](/it/cli)
- [Gestione dei segreti](/it/gateway/secrets)
