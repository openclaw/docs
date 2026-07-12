---
read_when:
    - Nuova risoluzione dei riferimenti ai segreti in fase di esecuzione
    - Verifica dei residui di testo in chiaro e dei riferimenti non risolti
    - Configurazione dei SecretRef e applicazione delle modifiche di oscuramento unidirezionale
summary: Riferimento della CLI per `openclaw secrets` (ricaricamento, verifica, configurazione, applicazione)
title: Segreti
x-i18n:
    generated_at: "2026-07-12T06:54:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d1ac0d0f6e29ae52d9dd03e3333665062ccd961ed22a2b06ca7fa7fde128e177
    source_path: cli/secrets.md
    workflow: 16
---

# `openclaw secrets`

Gestisci i SecretRef e mantieni integro lo snapshot del runtime attivo.

| Comando     | Ruolo                                                                                                                                                                                                                           |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `reload`    | RPC del Gateway (`secrets.reload`): risolve nuovamente i riferimenti e sostituisce lo snapshot del runtime solo in caso di successo completo (senza scrivere nella configurazione)                                               |
| `audit`     | Analisi in sola lettura degli archivi di configurazione, autenticazione e modelli generati, nonché dei residui legacy, alla ricerca di testo in chiaro, riferimenti non risolti e divergenze di precedenza (i riferimenti exec vengono ignorati salvo `--allow-exec`) |
| `configure` | Procedura guidata interattiva per configurare i provider, mappare le destinazioni ed eseguire i controlli preliminari (richiede un TTY)                                                                                          |
| `apply`     | Esegue un piano salvato (`--dry-run` esegue solo la convalida e, per impostazione predefinita, ignora i controlli exec; la modalità di scrittura rifiuta i piani contenenti exec salvo `--allow-exec`), quindi elimina i residui di testo in chiaro interessati |

Ciclo operativo consigliato:

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets audit --check
openclaw secrets reload
```

Se il piano include SecretRef/provider `exec`, passa `--allow-exec` sia al comando `apply` di prova sia a quello di scrittura.

Codici di uscita per CI/gate:

- `audit --check` restituisce `1` in presenza di rilevamenti.
- I riferimenti non risolti restituiscono `2` (indipendentemente da `--check`).

Correlati: [Gestione dei segreti](/it/gateway/secrets) · [Superficie delle credenziali SecretRef](/it/reference/secretref-credential-surface) · [Sicurezza](/it/gateway/security)

## Ricaricare lo snapshot del runtime

```bash
openclaw secrets reload
openclaw secrets reload --json
openclaw secrets reload --url ws://127.0.0.1:18789 --token <token>
```

Utilizza il metodo RPC del Gateway `secrets.reload`. Se la risoluzione non riesce, il Gateway conserva l'ultimo snapshot valido noto e restituisce un errore (senza attivazione parziale). La risposta JSON include `warningCount`.

Opzioni: `--url <url>`, `--token <token>`, `--timeout <ms>`, `--json`.

## Verifica

Analizza lo stato di OpenClaw alla ricerca di:

- archiviazione di segreti in testo in chiaro
- riferimenti non risolti
- divergenze di precedenza (credenziali di `auth-profiles.json` che hanno priorità sui riferimenti di `openclaw.json`)
- residui generati in `agents/*/agent/models.json` (valori `apiKey` dei provider e intestazioni sensibili dei provider)
- residui legacy (voci dell'archivio di autenticazione legacy, promemoria OAuth)

Il rilevamento delle intestazioni sensibili dei provider si basa su un'euristica dei nomi: segnala le intestazioni il cui nome corrisponde a frammenti comuni relativi ad autenticazione o credenziali (`authorization`, `x-api-key`, `token`, `secret`, `password`, `credential`).

```bash
openclaw secrets audit
openclaw secrets audit --check
openclaw secrets audit --json
openclaw secrets audit --allow-exec
```

Struttura del rapporto:

- `status`: `clean | findings | unresolved`
- `resolution`: `refsChecked`, `skippedExecRefs`, `resolvabilityComplete`
- `summary`: `plaintextCount`, `unresolvedRefCount`, `shadowedRefCount`, `legacyResidueCount`
- codici dei rilevamenti: `PLAINTEXT_FOUND`, `REF_UNRESOLVED`, `REF_SHADOWED`, `LEGACY_RESIDUE`

## Configurazione (procedura guidata interattiva)

Crea interattivamente le modifiche ai provider e ai SecretRef, esegue i controlli preliminari e, facoltativamente, le applica:

```bash
openclaw secrets configure
openclaw secrets configure --plan-out /tmp/openclaw-secrets-plan.json
openclaw secrets configure --apply --yes
openclaw secrets configure --providers-only
openclaw secrets configure --skip-provider-setup
openclaw secrets configure --agent ops
openclaw secrets configure --json
```

Flusso: prima la configurazione dei provider (aggiunta/modifica/rimozione degli alias di `secrets.providers`), quindi la mappatura delle credenziali (selezione dei campi e assegnazione dei riferimenti `{source, provider, id}`), infine i controlli preliminari e l'applicazione facoltativa.

Flag:

- `--providers-only`: configura solo `secrets.providers`, ignorando la mappatura delle credenziali
- `--skip-provider-setup`: ignora la configurazione dei provider e mappa le credenziali sui provider esistenti
- `--agent <id>`: limita l'individuazione delle destinazioni e le scritture di `auth-profiles.json` all'archivio di un singolo agente
- `--allow-exec`: consente i controlli dei SecretRef exec durante i controlli preliminari e l'applicazione (può eseguire comandi dei provider)

`--providers-only` e `--skip-provider-setup` non possono essere combinati.

Note:

- Richiede un TTY interattivo.
- Interessa i campi contenenti segreti in `openclaw.json` e `auth-profiles.json` per l'ambito dell'agente selezionato; superficie supportata canonica: [Superficie delle credenziali SecretRef](/it/reference/secretref-credential-surface).
- Supporta la creazione di nuove mappature di `auth-profiles.json` direttamente nel flusso di selezione.
- Esegue la risoluzione preliminare prima dell'applicazione.
- Per impostazione predefinita, i piani generati hanno abilitate le opzioni di eliminazione (`scrubEnv`, `scrubAuthProfilesForProviderTargets`, `scrubLegacyAuthJson`). L'applicazione è irreversibile per i valori in testo in chiaro eliminati.
- Senza `--apply`, dopo i controlli preliminari la CLI chiede comunque `Apply this plan now?`.
- Con `--apply` (e senza `--yes`), la CLI richiede un'ulteriore conferma per la migrazione irreversibile.
- `--json` stampa il piano e il rapporto dei controlli preliminari, ma richiede comunque un TTY interattivo.

### Sicurezza dei provider exec

Le installazioni Homebrew spesso espongono binari tramite collegamenti simbolici in `/opt/homebrew/bin/*`. Imposta `allowSymlinkCommand: true` solo quando necessario per percorsi attendibili del gestore di pacchetti, insieme a `trustedDirs` (ad esempio `["/opt/homebrew"]`). In Windows, se la verifica ACL non è disponibile per il percorso di un provider, OpenClaw interrompe l'operazione in modo sicuro; solo per i percorsi attendibili, imposta `allowInsecurePath: true` su quel provider per ignorare il controllo di sicurezza del percorso.

## Applicare un piano salvato

```bash
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --json
```

`--dry-run` convalida i controlli preliminari senza scrivere file; per impostazione predefinita, i controlli dei SecretRef exec vengono ignorati durante la prova. La modalità di scrittura rifiuta i piani contenenti SecretRef/provider exec salvo che sia specificato `--allow-exec`. Usa `--allow-exec` per acconsentire ai controlli o all'esecuzione dei provider exec in entrambe le modalità.

Elementi che `apply` può aggiornare:

- `openclaw.json` (destinazioni SecretRef e inserimenti/aggiornamenti/eliminazioni dei provider)
- `auth-profiles.json` (eliminazione dei dati per le destinazioni dei provider)
- residui del file legacy `auth.json`
- chiavi dei segreti note in `~/.openclaw/.env` i cui valori sono stati migrati

Dettagli del contratto del piano (percorsi di destinazione consentiti, regole di convalida, semantica degli errori): [Contratto del piano di applicazione dei segreti](/it/gateway/secrets-plan-contract).

### Perché non sono presenti backup di ripristino

`secrets apply` non scrive intenzionalmente backup di ripristino contenenti i precedenti valori in testo in chiaro. La sicurezza deriva da rigorosi controlli preliminari e da un'applicazione quasi atomica, con un tentativo di ripristino in memoria in caso di errore.

## Esempio

```bash
openclaw secrets audit --check
openclaw secrets configure
openclaw secrets audit --check
```

Se `audit --check` segnala ancora rilevamenti di testo in chiaro, aggiorna i restanti percorsi di destinazione segnalati ed esegui nuovamente la verifica.

## Correlati

- [Riferimento della CLI](/it/cli)
- [Gestione dei segreti](/it/gateway/secrets)
- [SecretRef di Vault](/plugins/vault)
