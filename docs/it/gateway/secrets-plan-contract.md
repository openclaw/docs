---
read_when:
    - Generazione o revisione dei piani `openclaw secrets apply`
    - Debug degli errori `Invalid plan target path`
    - Comprensione del comportamento di validazione di tipo target e percorso
summary: 'Contratto per i piani `secrets apply`: validazione del target, corrispondenza del percorso e ambito target di `auth-profiles.json`'
title: Contratto del piano Secrets Apply
x-i18n:
    generated_at: "2026-04-05T13:53:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: cb89a426ca937cf4d745f641b43b330c7fbb1aa9e4359b106ecd28d7a65ca327
    source_path: gateway/secrets-plan-contract.md
    workflow: 15
---

# Contratto del piano secrets apply

Questa pagina definisce il contratto rigoroso applicato da `openclaw secrets apply`.

Se un target non corrisponde a queste regole, l'applicazione fallisce prima di modificare la configurazione.

## Forma del file di piano

`openclaw secrets apply --from <plan.json>` si aspetta un array `targets` di target del piano:

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

## Ambito target supportato

I target del piano sono accettati per i percorsi delle credenziali supportati in:

- [Superficie credenziali SecretRef](/reference/secretref-credential-surface)

## Comportamento del tipo target

Regola generale:

- `target.type` deve essere riconosciuto e deve corrispondere alla forma normalizzata di `target.path`.

Gli alias di compatibilità restano accettati per i piani esistenti:

- `models.providers.apiKey`
- `skills.entries.apiKey`
- `channels.googlechat.serviceAccount`

## Regole di validazione del percorso

Ogni target viene validato con tutti i controlli seguenti:

- `type` deve essere un tipo target riconosciuto.
- `path` deve essere un percorso dot non vuoto.
- `pathSegments` può essere omesso. Se fornito, deve normalizzarsi esattamente nello stesso percorso di `path`.
- I segmenti vietati vengono rifiutati: `__proto__`, `prototype`, `constructor`.
- Il percorso normalizzato deve corrispondere alla forma del percorso registrata per il tipo target.
- Se `providerId` o `accountId` è impostato, deve corrispondere all'id codificato nel percorso.
- I target `auth-profiles.json` richiedono `agentId`.
- Quando crei una nuova mappatura `auth-profiles.json`, includi `authProfileProvider`.

## Comportamento in caso di errore

Se un target fallisce la validazione, apply termina con un errore come:

```text
Invalid plan target path for models.providers.apiKey: models.providers.openai.baseUrl
```

Nessuna scrittura viene confermata per un piano non valido.

## Comportamento del consenso per il provider exec

- `--dry-run` salta per impostazione predefinita i controlli SecretRef exec.
- I piani che contengono SecretRef/provider exec vengono rifiutati in modalità scrittura a meno che non sia impostato `--allow-exec`.
- Quando convalidi/applichi piani che contengono exec, passa `--allow-exec` sia nei comandi dry-run sia in quelli di scrittura.

## Note su runtime e ambito di audit

- Le voci `auth-profiles.json` solo-ref (`keyRef`/`tokenRef`) sono incluse nella risoluzione runtime e nella copertura di audit.
- `secrets apply` scrive target `openclaw.json` supportati, target `auth-profiles.json` supportati e target opzionali di pulizia.

## Controlli per l'operatore

```bash
# Convalida il piano senza scritture
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run

# Poi applicalo davvero
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json

# Per i piani che contengono exec, effettua esplicitamente l'opt-in in entrambe le modalità
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
```

Se apply fallisce con un messaggio di percorso target non valido, rigenera il piano con `openclaw secrets configure` oppure correggi il percorso target in una forma supportata indicata sopra.

## Documentazione correlata

- [Gestione dei segreti](/gateway/secrets)
- [CLI `secrets`](/cli/secrets)
- [Superficie credenziali SecretRef](/reference/secretref-credential-surface)
- [Riferimento configurazione](/gateway/configuration-reference)
