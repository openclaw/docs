---
read_when:
    - Generazione o revisione di piani `openclaw secrets apply`
    - Debug degli errori `Invalid plan target path`
    - Comprendere il comportamento del tipo di destinazione e della validazione del percorso
summary: 'Contratto per i piani `secrets apply`: convalida della destinazione, corrispondenza dei percorsi e ambito di destinazione `auth-profiles.json`'
title: Contratto del piano di applicazione dei segreti
x-i18n:
    generated_at: "2026-06-27T17:35:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 03f0ca9b433553a2f6d86d01b8c227a24b6f53ef7034a94bd648fbf04c81f13e
    source_path: gateway/secrets-plan-contract.md
    workflow: 16
---

Questa pagina definisce il contratto rigoroso applicato da `openclaw secrets apply`.

Se un target non rispetta queste regole, apply non riesce prima di modificare la configurazione.

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

## Upsert ed eliminazioni dei provider

I piani possono includere anche due campi opzionali di primo livello che modificano la mappa
`secrets.providers` insieme alle scritture per target:

- `providerUpserts` — un oggetto indicizzato per alias del provider. Ogni valore è una
  definizione del provider (la stessa forma accettata sotto
  `secrets.providers.<alias>` in `openclaw.json`, ad esempio un provider `exec` o `file`).
- `providerDeletes` — un array di alias dei provider da rimuovere.

`providerUpserts` viene eseguito prima di `targets`, quindi un `target.ref.provider` può
fare riferimento a un alias del provider introdotto dallo stesso piano in
`providerUpserts`. Senza questo, i piani che fanno riferimento a un alias non ancora
configurato in `openclaw.json` non riescono con `provider "<alias>" is not
configured`.

```json5
{
  version: 1,
  protocolVersion: 1,
  providerUpserts: {
    onepassword_anthropic: {
      source: "exec",
      command: "/usr/bin/op",
      args: ["read", "op://Vault/Anthropic/credential"],
    },
  },
  providerDeletes: ["legacy_unused_alias"],
  targets: [
    {
      type: "models.providers.apiKey",
      path: "models.providers.anthropic.apiKey",
      pathSegments: ["models", "providers", "anthropic", "apiKey"],
      providerId: "anthropic",
      ref: { source: "exec", provider: "onepassword_anthropic", id: "credential" },
    },
  ],
}
```

I provider exec introdotti tramite `providerUpserts` sono comunque soggetti alle
regole di consenso exec in [Comportamento del consenso del provider exec](#exec-provider-consent-behavior):
i piani che contengono provider exec richiedono `--allow-exec` in modalità di scrittura.

## Ambito dei target supportati

I target del piano sono accettati per i percorsi delle credenziali supportati in:

- [Superficie delle credenziali SecretRef](/it/reference/secretref-credential-surface)

## Comportamento del tipo di target

Regola generale:

- `target.type` deve essere riconosciuto e deve corrispondere alla forma normalizzata di `target.path`.

Gli alias di compatibilità restano accettati per i piani esistenti:

- `models.providers.apiKey`
- `skills.entries.apiKey`
- `channels.googlechat.serviceAccount`

## Regole di convalida dei percorsi

Ogni target viene convalidato con tutte le condizioni seguenti:

- `type` deve essere un tipo di target riconosciuto.
- `path` deve essere un percorso puntato non vuoto.
- `pathSegments` può essere omesso. Se fornito, deve normalizzarsi esattamente nello stesso percorso di `path`.
- I segmenti vietati vengono rifiutati: `__proto__`, `prototype`, `constructor`.
- Il percorso normalizzato deve corrispondere alla forma del percorso registrata per il tipo di target.
- Se `providerId` o `accountId` è impostato, deve corrispondere all'id codificato nel percorso.
- I target `auth-profiles.json` richiedono `agentId`.
- Quando si crea una nuova mappatura `auth-profiles.json`, includere `authProfileProvider`.

## Comportamento in caso di errore

Se un target non supera la convalida, apply termina con un errore come:

```text
Invalid plan target path for models.providers.apiKey: models.providers.openai.baseUrl
```

Non viene confermata alcuna scrittura per un piano non valido.

## Comportamento del consenso del provider exec

- `--dry-run` salta per impostazione predefinita i controlli exec SecretRef.
- I piani che contengono SecretRef/provider exec vengono rifiutati in modalità di scrittura a meno che `--allow-exec` non sia impostato.
- Quando si convalidano/applicano piani contenenti exec, passare `--allow-exec` sia nei comandi dry-run sia in quelli di scrittura.

## Note su runtime e ambito di audit

- Le voci solo ref di `auth-profiles.json` (`keyRef`/`tokenRef`) sono incluse nella risoluzione runtime e nella copertura di audit.
- `secrets apply` scrive i target supportati di `openclaw.json`, i target supportati di `auth-profiles.json` e i target di pulizia opzionali.

## Controlli dell'operatore

```bash
# Validate plan without writes
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run

# Then apply for real
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json

# For exec-containing plans, opt in explicitly in both modes
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
```

Se apply non riesce con un messaggio di percorso target non valido, rigenerare il piano con `openclaw secrets configure` oppure correggere il percorso del target in una forma supportata sopra.

## Documentazione correlata

- [Gestione dei segreti](/it/gateway/secrets)
- [CLI `secrets`](/it/cli/secrets)
- [Superficie delle credenziali SecretRef](/it/reference/secretref-credential-surface)
- [Riferimento di configurazione](/it/gateway/configuration-reference)
