---
read_when:
    - Generazione o revisione dei piani `openclaw secrets apply`
    - Debug degli errori `Invalid plan target path`
    - Comprendere il comportamento della convalida del tipo e del percorso di destinazione
summary: 'Contratto per i piani `secrets apply`: convalida delle destinazioni, corrispondenza dei percorsi e ambito della destinazione `auth-profiles.json`'
title: Contratto del piano di applicazione dei segreti
x-i18n:
    generated_at: "2026-07-12T07:05:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ddaf3df7f0be326fa1c8dc8c360b03697fb58329d03c4eb8106a8740ddf6c47a
    source_path: gateway/secrets-plan-contract.md
    workflow: 16
---

Questa pagina definisce il contratto rigoroso applicato da `openclaw secrets apply`. Se una destinazione non rispetta queste regole, l'applicazione non riesce prima di modificare qualsiasi file.

## Struttura del file del piano

`openclaw secrets apply --from <plan.json>` prevede un array `targets` di destinazioni del piano:

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

`openclaw secrets configure` genera piani con questa struttura. È anche possibile scriverne o modificarne uno manualmente.

## Inserimenti o aggiornamenti ed eliminazioni dei provider

I piani possono includere anche due campi facoltativi di primo livello che modificano la mappa `secrets.providers` insieme alle scritture per ciascuna destinazione:

- `providerUpserts` -- un oggetto le cui chiavi sono gli alias dei provider. Ogni valore è una definizione di provider, con la stessa struttura accettata in `secrets.providers.<alias>` in `openclaw.json`, ad esempio un provider `exec` o `file`.
- `providerDeletes` -- un array di alias di provider da rimuovere.

`providerUpserts` viene eseguito prima di `targets`, quindi `target.ref.provider` può fare riferimento a un alias di provider introdotto dallo stesso piano in `providerUpserts`. Senza questo ordine, i piani che fanno riferimento a un alias non ancora configurato in `openclaw.json` non riescono con `provider "<alias>" is not configured`.

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

I provider exec introdotti tramite `providerUpserts` restano soggetti alle regole di consenso per exec descritte in [Comportamento del consenso per i provider exec](#exec-provider-consent-behavior): i piani contenenti provider exec richiedono `--allow-exec` in modalità di scrittura.

## Ambito delle destinazioni supportate

Le destinazioni del piano sono accettate per i percorsi delle credenziali supportati in [Superficie delle credenziali SecretRef](/it/reference/secretref-credential-surface).

## Comportamento dei tipi di destinazione

`target.type` deve essere un tipo di destinazione riconosciuto e il valore normalizzato di `target.path` deve corrispondere alla struttura del percorso registrata per quel tipo.

Alcuni tipi di destinazione accettano, oltre al nome canonico del tipo, un alias di compatibilità come `target.type` per i piani esistenti:

| Tipo canonico                        | Alias accettato                                 |
| ------------------------------------ | ----------------------------------------------- |
| `models.providers.apiKey`            | `models.providers.*.apiKey`                     |
| `skills.entries.apiKey`              | `skills.entries.*.apiKey`                       |
| `channels.googlechat.serviceAccount` | `channels.googlechat.accounts.*.serviceAccount` |

## Regole di convalida dei percorsi

Ogni destinazione viene convalidata applicando tutte le regole seguenti:

- `type` deve essere un tipo di destinazione riconosciuto.
- `path` deve essere un percorso puntato non vuoto.
- `pathSegments` può essere omesso. Se specificato, deve normalizzarsi esattamente nello stesso percorso di `path`.
- I segmenti vietati vengono rifiutati: `__proto__`, `prototype`, `constructor`.
- Il percorso normalizzato deve corrispondere alla struttura del percorso registrata per il tipo di destinazione.
- Se `providerId` o `accountId` è impostato, deve corrispondere all'ID codificato nel percorso.
- Le destinazioni di `auth-profiles.json` richiedono `agentId`.
- Quando si crea una nuova associazione in `auth-profiles.json`, includere `authProfileProvider`.

## Comportamento in caso di errore

Se una destinazione non supera la convalida, l'applicazione termina con un errore simile al seguente:

```text
Invalid plan target path for models.providers.apiKey: models.providers.openai.baseUrl
```

Per un piano non valido non viene confermata alcuna scrittura: la risoluzione delle destinazioni e la convalida dei percorsi vengono eseguite prima che qualsiasi file venga modificato. Separatamente, quando un piano valido inizia la scrittura, l'applicazione crea prima un'istantanea di ogni file interessato e ripristina tali istantanee se una scrittura successiva nella stessa esecuzione non riesce; in questo modo, una scrittura parziale non lascia mai fuori sincronia la configurazione, i profili di autenticazione o lo stato delle variabili d'ambiente.

## Comportamento del consenso per i provider exec

- Per impostazione predefinita, `--dry-run` ignora i controlli sulle SecretRef exec.
- I piani contenenti SecretRef o provider exec vengono rifiutati in modalità di scrittura, a meno che non sia impostato `--allow-exec`.
- Durante la convalida o l'applicazione di piani contenenti exec, specificare `--allow-exec` sia nei comandi di simulazione sia in quelli di scrittura.

## Note sull'ambito di runtime e controllo

- Le voci di `auth-profiles.json` contenenti solo riferimenti (`keyRef`/`tokenRef`) sono incluse nella risoluzione delle credenziali durante il runtime e nella copertura del controllo.
- `secrets apply` scrive le destinazioni supportate di `openclaw.json`, le destinazioni supportate di `auth-profiles.json` e tre passaggi facoltativi di pulizia, ciascuno attivo per impostazione predefinita: `scrubEnv` (rimuove da `.env` i valori in testo normale migrati), `scrubAuthProfilesForProviderTargets` (elimina da `auth-profiles.json` i residui in testo normale o i riferimenti inutilizzati per i provider appena migrati da un piano) e `scrubLegacyAuthJson` (elimina le voci `api_key` migrate dagli archivi legacy `auth.json`). Impostare su `false` nel piano uno qualsiasi tra `options.scrubEnv`, `options.scrubAuthProfilesForProviderTargets` e `options.scrubLegacyAuthJson` per ignorare il relativo passaggio.

## Controlli per l'operatore

```bash
# Convalida il piano senza effettuare scritture
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run

# Quindi applicalo realmente
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json

# Per i piani contenenti exec, abilitalo esplicitamente in entrambe le modalità
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from /tmp/openclaw-secrets-plan.json --allow-exec
```

Se l'applicazione non riesce con un messaggio relativo a un percorso di destinazione non valido, rigenerare il piano con `openclaw secrets configure` oppure correggere il percorso della destinazione affinché corrisponda a una delle strutture supportate indicate sopra.

## Documentazione correlata

- [Gestione dei segreti](/it/gateway/secrets)
- [CLI `secrets`](/it/cli/secrets)
- [Superficie delle credenziali SecretRef](/it/reference/secretref-credential-surface)
- [Riferimento della configurazione](/it/gateway/configuration-reference)
