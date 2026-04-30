---
read_when:
    - Lavorare sulla risoluzione dei profili di autenticazione o sull'instradamento delle credenziali
    - Risoluzione dei problemi relativi agli errori di autenticazione del modello o all'ordine dei profili
summary: Semantica canonica di idoneità e risoluzione delle credenziali per i profili di autenticazione
title: Semantica delle credenziali di autenticazione
x-i18n:
    generated_at: "2026-04-30T21:02:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 39b9f96159d5a7b793983d07c37a73139a0904abbbc8831267807d6acf5c0037
    source_path: auth-credential-semantics.md
    workflow: 16
---

Questo documento definisce la semantica canonica di idoneità e risoluzione delle credenziali usata in:

- `resolveAuthProfileOrder`
- `resolveApiKeyForProfile`
- `models status --probe`
- `doctor-auth`

L'obiettivo è mantenere allineati il comportamento in fase di selezione e quello a runtime.

## Codici motivo stabili della verifica

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
6. `tokenRef` non bypassa la validazione di `expires`.

### Regole di risoluzione

1. La semantica del resolver corrisponde alla semantica di idoneità per `expires`.
2. Per i profili idonei, il materiale del token può essere risolto dal valore inline o da `tokenRef`.
3. I riferimenti non risolvibili producono `unresolved_ref` nell'output di `models status --probe`.

## Portabilità della copia dell'agente

L'ereditarietà dell'autenticazione dell'agente è read-through. Quando un agente non ha un profilo locale, può risolvere i profili dallo store dell'agente predefinito/principale a runtime senza copiare materiale segreto nel proprio `auth-profiles.json`.

I flussi di copia espliciti, come `openclaw agents add`, usano questa policy di portabilità:

- I profili `api_key` sono portabili salvo `copyToAgents: false`.
- I profili `token` sono portabili salvo `copyToAgents: false`.
- I profili `oauth` non sono portabili per impostazione predefinita perché i token di refresh possono essere monouso o sensibili alla rotazione.
- I flussi OAuth di proprietà del provider possono optare per `copyToAgents: true` solo quando la copia del materiale di refresh tra agenti è nota come sicura.

I profili non portabili restano disponibili tramite ereditarietà read-through salvo che l'agente di destinazione acceda separatamente e crei il proprio profilo locale.

## Filtraggio esplicito dell'ordine di autenticazione

- Quando `auth.order.<provider>` o l'override dell'ordine dell'auth-store è impostato per un provider, `models status --probe` verifica solo gli ID profilo che rimangono nell'ordine di autenticazione risolto per quel provider.
- Un profilo memorizzato per quel provider che è omesso dall'ordine esplicito non viene provato silenziosamente in seguito. L'output della verifica lo segnala con `reasonCode: excluded_by_auth_order` e il dettaglio `Excluded by auth.order for this provider.`

## Risoluzione della destinazione della verifica

- Le destinazioni della verifica possono provenire da profili di autenticazione, credenziali d'ambiente o `models.json`.
- Se un provider ha credenziali ma OpenClaw non riesce a risolvere un candidato modello verificabile per esso, `models status --probe` segnala `status: no_model` con `reasonCode: no_model`.

## Rilevamento delle credenziali da CLI esterna

- Le credenziali solo runtime di proprietà di CLI esterne vengono rilevate solo quando il provider, il runtime o il profilo di autenticazione rientra nell'ambito dell'operazione corrente, oppure quando esiste già un profilo locale memorizzato per quella sorgente esterna.
- I chiamanti dell'auth-store devono scegliere una modalità esplicita di rilevamento della CLI esterna: `none` per sola autenticazione persistente/Plugin, `existing` per aggiornare i profili CLI esterni già memorizzati oppure `scoped` per un insieme concreto di provider/profili.
- I percorsi di sola lettura/stato passano `allowKeychainPrompt: false`; usano solo credenziali CLI esterne basate su file e non leggono né riutilizzano risultati del Portachiavi macOS.

## Guard della policy OAuth SecretRef

- L'input SecretRef è solo per credenziali statiche.
- Se una credenziale di profilo è `type: "oauth"`, gli oggetti SecretRef non sono supportati per il materiale della credenziale di quel profilo.
- Se `auth.profiles.<id>.mode` è `"oauth"`, l'input `keyRef`/`tokenRef` basato su SecretRef per quel profilo viene rifiutato.
- Le violazioni sono errori bloccanti nei percorsi di risoluzione dell'autenticazione all'avvio/ricaricamento.

## Messaggistica compatibile con versioni legacy

Per la compatibilità degli script, gli errori di verifica mantengono invariata questa prima riga:

`Auth profile credentials are missing or expired.`

Dettagli leggibili per l'utente e codici motivo stabili possono essere aggiunti nelle righe successive.

## Correlati

- [Gestione dei segreti](/it/gateway/secrets)
- [Archiviazione dell'autenticazione](/it/concepts/oauth)
