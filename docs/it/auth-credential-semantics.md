---
read_when:
    - Lavorare sulla risoluzione del profilo di autenticazione o sull'instradamento delle credenziali
    - Risoluzione dei problemi relativi agli errori di autenticazione del modello o all'ordine dei profili
summary: Idoneità canonica delle credenziali e semantica di risoluzione per i profili di autenticazione
title: Semantica delle credenziali di autenticazione
x-i18n:
    generated_at: "2026-04-30T08:36:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0525a71d3f08b7aa95e2f06acc6c23d87cd92d6b5fe4fc050ecf2b7caff84b3f
    source_path: auth-credential-semantics.md
    workflow: 16
---

Questo documento definisce le semantiche canoniche di idoneità e risoluzione delle credenziali usate in:

- `resolveAuthProfileOrder`
- `resolveApiKeyForProfile`
- `models status --probe`
- `doctor-auth`

L'obiettivo è mantenere allineati il comportamento al momento della selezione e quello in fase di esecuzione.

## Codici motivo stabili del probe

- `ok`
- `excluded_by_auth_order`
- `missing_credential`
- `invalid_expires`
- `expired`
- `unresolved_ref`
- `no_model`

## Credenziali token

Le credenziali token (`type: "token"`) supportano `token` inline e/o `tokenRef`.

### Regole di idoneità

1. Un profilo token non è idoneo quando sia `token` sia `tokenRef` sono assenti.
2. `expires` è facoltativo.
3. Se `expires` è presente, deve essere un numero finito maggiore di `0`.
4. Se `expires` non è valido (`NaN`, `0`, negativo, non finito o di tipo errato), il profilo non è idoneo con `invalid_expires`.
5. Se `expires` è nel passato, il profilo non è idoneo con `expired`.
6. `tokenRef` non aggira la convalida di `expires`.

### Regole di risoluzione

1. Le semantiche del resolver corrispondono alle semantiche di idoneità per `expires`.
2. Per i profili idonei, il materiale del token può essere risolto dal valore inline o da `tokenRef`.
3. I riferimenti non risolvibili producono `unresolved_ref` nell'output di `models status --probe`.

## Portabilità della copia dell'agente

L'ereditarietà dell'autenticazione dell'agente è a lettura passante. Quando un agente non ha un profilo locale, può risolvere i profili dall'archivio dell'agente predefinito/principale in fase di esecuzione senza copiare materiale segreto nel proprio `auth-profiles.json`.

I flussi di copia espliciti, come `openclaw agents add`, usano questa policy di portabilità:

- I profili `api_key` sono portabili salvo `copyToAgents: false`.
- I profili `token` sono portabili salvo `copyToAgents: false`.
- I profili `oauth` non sono portabili per impostazione predefinita perché i token di refresh possono essere monouso o sensibili alla rotazione.
- I flussi OAuth di proprietà del provider possono aderire con `copyToAgents: true` solo quando la copia del materiale di refresh tra agenti è nota come sicura.

I profili non portabili restano disponibili tramite ereditarietà a lettura passante, a meno che l'agente di destinazione non acceda separatamente e crei un proprio profilo locale.

## Filtro esplicito dell'ordine di autenticazione

- Quando `auth.order.<provider>` o l'override dell'ordine dell'auth-store è impostato per un provider, `models status --probe` esegue il probe solo degli id profilo che restano nell'ordine di autenticazione risolto per quel provider.
- Un profilo memorizzato per quel provider che è omesso dall'ordine esplicito non viene provato silenziosamente in seguito. L'output del probe lo segnala con `reasonCode: excluded_by_auth_order` e il dettaglio `Excluded by auth.order for this provider.`

## Risoluzione della destinazione del probe

- Le destinazioni del probe possono provenire da profili di autenticazione, credenziali di ambiente o `models.json`.
- Se un provider ha credenziali ma OpenClaw non riesce a risolvere un candidato modello probeable per esso, `models status --probe` segnala `status: no_model` con `reasonCode: no_model`.

## Rilevamento delle credenziali da CLI esterne

- Le credenziali solo runtime di proprietà di CLI esterne vengono rilevate solo quando il provider, il runtime o il profilo di autenticazione rientra nell'ambito dell'operazione corrente, oppure quando esiste già un profilo locale memorizzato per quella sorgente esterna.
- I percorsi di sola lettura/stato passano `allowKeychainPrompt: false`; usano solo credenziali da CLI esterne basate su file e non leggono né riutilizzano risultati del Portachiavi macOS.

## Guardia della policy SecretRef OAuth

- L'input SecretRef è solo per credenziali statiche.
- Se una credenziale del profilo è `type: "oauth"`, gli oggetti SecretRef non sono supportati per il materiale delle credenziali di quel profilo.
- Se `auth.profiles.<id>.mode` è `"oauth"`, l'input `keyRef`/`tokenRef` basato su SecretRef per quel profilo viene rifiutato.
- Le violazioni sono errori irreversibili nei percorsi di risoluzione dell'autenticazione all'avvio/ricaricamento.

## Messaggistica compatibile con le versioni legacy

Per compatibilità con gli script, gli errori di probe mantengono invariata questa prima riga:

`Auth profile credentials are missing or expired.`

Dettagli pensati per le persone e codici motivo stabili possono essere aggiunti nelle righe successive.

## Correlati

- [Gestione dei segreti](/it/gateway/secrets)
- [Archiviazione dell'autenticazione](/it/concepts/oauth)
