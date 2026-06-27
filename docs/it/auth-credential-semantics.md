---
read_when:
    - Operazioni sulla risoluzione del profilo di autenticazione o sull'instradamento delle credenziali
    - Debug degli errori di autenticazione del modello o dell’ordine dei profili
summary: Semantica canonica di idoneità e risoluzione delle credenziali per i profili di autenticazione
title: Semantica delle credenziali di autenticazione
x-i18n:
    generated_at: "2026-06-27T17:08:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 591c0384e1d43512252aaa7b362141b6bc93183b30b5847168758f86127f0663
    source_path: auth-credential-semantics.md
    workflow: 16
---

Questo documento definisce l'idoneità canonica delle credenziali e la semantica di risoluzione usate in:

- `resolveAuthProfileOrder`
- `resolveApiKeyForProfile`
- `models status --probe`
- `doctor-auth`

L'obiettivo è mantenere allineato il comportamento al momento della selezione e in runtime.

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
2. `expires` è opzionale.
3. Se `expires` è presente, deve essere un numero finito maggiore di `0`.
4. Se `expires` non è valido (`NaN`, `0`, negativo, non finito o del tipo errato), il profilo non è idoneo con `invalid_expires`.
5. Se `expires` è nel passato, il profilo non è idoneo con `expired`.
6. `tokenRef` non aggira la validazione di `expires`.

### Regole di risoluzione

1. La semantica del resolver corrisponde alla semantica di idoneità per `expires`.
2. Per i profili idonei, il materiale del token può essere risolto dal valore inline o da `tokenRef`.
3. I riferimenti non risolvibili producono `unresolved_ref` nell'output di `models status --probe`.

## Portabilità della copia dell'agente

L'ereditarietà dell'autenticazione dell'agente è read-through. Quando un agente non ha un profilo locale, può risolvere i profili dallo store dell'agente predefinito/principale in runtime senza copiare materiale segreto nel proprio `auth-profiles.json`.

I flussi di copia espliciti, come `openclaw agents add`, usano questa policy di portabilità:

- I profili `api_key` sono portabili salvo `copyToAgents: false`.
- I profili `token` sono portabili salvo `copyToAgents: false`.
- I profili `oauth` non sono portabili per impostazione predefinita perché i token di aggiornamento possono essere monouso o sensibili alla rotazione.
- I flussi OAuth di proprietà del provider possono aderire con `copyToAgents: true` solo quando è noto che copiare il materiale di aggiornamento tra agenti sia sicuro.

I profili non portabili restano disponibili tramite ereditarietà read-through salvo che l'agente di destinazione acceda separatamente e crei un proprio profilo locale.

## Rotte di autenticazione solo da configurazione

Le voci `auth.profiles` con `mode: "aws-sdk"` sono metadati di routing, non credenziali archiviate. Sono valide quando il provider di destinazione usa `models.providers.<id>.auth: "aws-sdk"` o la rotta AWS SDK della configurazione Amazon Bedrock di proprietà del Plugin. Questi ID profilo possono comparire in `auth.order` e negli override di sessione anche quando non esiste alcuna voce corrispondente in `auth-profiles.json`.

Non scrivere `type: "aws-sdk"` in `auth-profiles.json`. Se un'installazione legacy ha un marcatore di questo tipo, `openclaw doctor --fix` lo sposta in `auth.profiles` e rimuove il marcatore dallo store delle credenziali.

## Filtro esplicito dell'ordine di autenticazione

- Quando `auth.order.<provider>` o l'override dell'ordine dell'auth-store è impostato per un provider, `models status --probe` esegue probe solo sugli ID profilo che restano nell'ordine di autenticazione risolto per quel provider.
- Un profilo archiviato per quel provider che è omesso dall'ordine esplicito non viene provato silenziosamente in seguito. L'output del probe lo segnala con `reasonCode: excluded_by_auth_order` e il dettaglio `Excluded by auth.order for this provider.`

## Risoluzione della destinazione del probe

- Le destinazioni del probe possono provenire dai profili di autenticazione, dalle credenziali di ambiente o da `models.json`.
- Se un provider ha credenziali ma OpenClaw non riesce a risolvere un modello candidabile per il probe, `models status --probe` segnala `status: no_model` con `reasonCode: no_model`.

## Rilevamento delle credenziali CLI esterne

- Le credenziali solo runtime di proprietà di CLI esterne vengono rilevate solo quando il provider, il runtime o il profilo di autenticazione rientra nell'ambito dell'operazione corrente, oppure quando esiste già un profilo locale archiviato per tale origine esterna.
- I chiamanti dell'auth-store devono scegliere una modalità esplicita di rilevamento CLI esterna: `none` per autenticazione persistita/Plugin soltanto, `existing` per aggiornare profili CLI esterni già archiviati, oppure `scoped` per un set concreto di provider/profili.
- I percorsi in sola lettura/stato passano `allowKeychainPrompt: false`; usano solo credenziali CLI esterne basate su file e non leggono né riutilizzano i risultati del Portachiavi macOS.

## Guard della policy OAuth SecretRef

- L'input SecretRef è solo per credenziali statiche.
- Se una credenziale di profilo è `type: "oauth"`, gli oggetti SecretRef non sono supportati per il materiale delle credenziali di quel profilo.
- Se `auth.profiles.<id>.mode` è `"oauth"`, l'input `keyRef`/`tokenRef` basato su SecretRef per quel profilo viene rifiutato.
- Le violazioni sono errori bloccanti nei percorsi di risoluzione dell'autenticazione all'avvio/ricaricamento.

## Messaggistica compatibile con legacy

Per la compatibilità degli script, gli errori del probe mantengono invariata questa prima riga:

`Auth profile credentials are missing or expired.`

Dettagli comprensibili per l'utente e codici motivo stabili possono essere aggiunti nelle righe successive.

## Correlati

- [Gestione dei segreti](/it/gateway/secrets)
- [Archiviazione dell'autenticazione](/it/concepts/oauth)
