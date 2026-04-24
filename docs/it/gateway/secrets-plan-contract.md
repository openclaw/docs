---
read_when:
    - Generare o rivedere i piani `openclaw secrets apply`
    - Debug degli errori di `Invalid plan target path`
    - Comprendere il comportamento di validazione del tipo di destinazione e del percorso
summary: 'Contratto per i piani `secrets apply`: validazione della destinazione, corrispondenza dei percorsi e ambito della destinazione `auth-profiles.json`'
title: Contratto del piano di applicazione Secrets
x-i18n:
    generated_at: "2026-04-24T08:42:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 80214353a1368b249784aa084c714e043c2d515706357d4ba1f111a3c68d1a84
    source_path: gateway/secrets-plan-contract.md
    workflow: 15
---

Questa pagina definisce il contratto rigoroso applicato da `openclaw secrets apply`.

Se una destinazione non rispetta queste regole, apply fallisce prima di modificare la configurazione.

## Forma del file di piano

`openclaw secrets apply --from <plan.json>` si aspetta un array `targets` di destinazioni del piano:

```json5
{
  version: 1,
  protocolVersion: 1,
  targets: [
    {
      type: "models.providers.apiKey",
      path: "models.providers.openai.apiKey",
      pathSegments: ["models", "providers", "openai", "apiKey"],
      providerId: "openai",
      ref: { source: "env", provider: "default", id: "OPENAI_API_KEY" },
    },
    {
      type: "auth-profiles.api_key.key",
      path: "profiles.openai:default.key",
      pathSegments: ["profiles", "openai:default", "key"],
      agentId: "main",
      ref: { source: "env", provider: "default", id: "OPENAI_API_KEY" },
    },
  ],
}
```

## Ambito della destinazione supportato

Le destinazioni del piano sono accettate per i percorsi delle credenziali supportati in:

- [Superficie credenziali SecretRef](/it/reference/secretref-credential-surface)

## Comportamento del tipo di destinazione

Regola generale:

- `target.type` deve essere riconosciuto e deve corrispondere alla forma normalizzata di `target.path`.

Gli alias di compatibilità continuano a essere accettati per i piani esistenti:

- `models.providers.apiKey`
- `skills.entries.apiKey`
- `channels.googlechat.serviceAccount`

## Regole di validazione del percorso

Ogni destinazione viene validata con tutte le regole seguenti:

- `type` deve essere un tipo di destinazione riconosciuto.
- `path` deve essere un dot path non vuoto.
- `pathSegments` può essere omesso. Se fornito, deve normalizzarsi esattamente allo stesso percorso di `path`.
- I segmenti vietati vengono rifiutati: `__proto__`, `prototype`, `constructor`.
- Il percorso normalizzato deve corrispondere alla forma di percorso registrata per il tipo di destinazione.
- Se `providerId` o `accountId` è impostato, deve corrispondere all'ID codificato nel percorso.
- Le destinazioni `auth-profiles.json` richiedono `agentId`.
- Quando crei una nuova mappatura `auth-profiles.json`, includi `authProfileProvider`.

## Comportamento in caso di errore

Se una destinazione non supera la validazione, apply termina con un errore come:

```text
Invalid plan target path for models.providers.apiKey: models.providers.openai.baseUrl
```

Nessuna scrittura viene eseguita per un piano non valido.

## Comportamento del consenso per provider exec

- `--dry-run` salta per impostazione predefinita i controlli SecretRef exec.
- I piani che contengono SecretRef/provider exec vengono rifiutati in modalità scrittura a meno che non sia impostato `--allow-exec`.
- Quando validi/applichi piani che contengono exec, passa `--allow-exec` sia nei comandi dry-run sia in quelli di scrittura.

## Note su runtime e ambito dell'audit

- Le voci `auth-profiles.json` solo ref (`keyRef`/`tokenRef`) sono incluse nella risoluzione runtime e nella copertura dell'audit.
- `secrets apply` scrive le destinazioni supportate in `openclaw.json`, le destinazioni supportate in `auth-profiles.json` e le destinazioni scrub facoltative.

## Controlli per l'operatore

```bash
# Valida il piano senza scrivere
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run

# Poi applicalo davvero
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json

# Per i piani che contengono exec, attiva esplicitamente l'opzione in entrambe le modalità
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
```

Se apply fallisce con un messaggio di percorso di destinazione non valido, rigenera il piano con `openclaw secrets configure` oppure correggi il percorso di destinazione in una delle forme supportate sopra.

## Documentazione correlata

- [Gestione dei segreti](/it/gateway/secrets)
- [CLI `secrets`](/it/cli/secrets)
- [Superficie credenziali SecretRef](/it/reference/secretref-credential-surface)
- [Riferimento di configurazione](/it/gateway/configuration-reference)
