---
read_when:
    - Durante il lavoro sulla risoluzione dei profili di autenticazione o sull'instradamento delle credenziali
    - Durante il debug degli errori di autenticazione del modello o dell'ordine dei profili
summary: Semantica canonica di idoneità e risoluzione delle credenziali per i profili di autenticazione
title: Semantica delle credenziali di autenticazione
x-i18n:
    generated_at: "2026-04-05T13:41:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: a4cd3e16cd25eb22c5e707311d06a19df1a59747ee3261c2d32c534a245fd7fb
    source_path: auth-credential-semantics.md
    workflow: 15
---

# Semantica delle credenziali di autenticazione

Questo documento definisce la semantica canonica di idoneità e risoluzione delle credenziali usata in:

- `resolveAuthProfileOrder`
- `resolveApiKeyForProfile`
- `models status --probe`
- `doctor-auth`

L'obiettivo è mantenere allineati il comportamento in fase di selezione e quello in fase di esecuzione.

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

1. Un profilo token non è idoneo quando sia `token` che `tokenRef` sono assenti.
2. `expires` è facoltativo.
3. Se `expires` è presente, deve essere un numero finito maggiore di `0`.
4. Se `expires` non è valido (`NaN`, `0`, negativo, non finito o di tipo errato), il profilo non è idoneo con `invalid_expires`.
5. Se `expires` è nel passato, il profilo non è idoneo con `expired`.
6. `tokenRef` non aggira la convalida di `expires`.

### Regole di risoluzione

1. La semantica del resolver corrisponde alla semantica di idoneità per `expires`.
2. Per i profili idonei, il materiale del token può essere risolto dal valore inline o da `tokenRef`.
3. I ref non risolvibili producono `unresolved_ref` nell'output di `models status --probe`.

## Filtro esplicito dell'ordine di autenticazione

- Quando `auth.order.<provider>` o l'override dell'ordine dell'archivio auth è impostato per un
  provider, `models status --probe` esegue il probe solo degli id dei profilo che restano nell'ordine auth
  risolto per quel provider.
- Un profilo archiviato per quel provider che viene omesso dall'ordine esplicito non viene
  provato silenziosamente in seguito. L'output del probe lo segnala con
  `reasonCode: excluded_by_auth_order` e il dettaglio
  `Excluded by auth.order for this provider.`

## Risoluzione della destinazione del probe

- Le destinazioni del probe possono provenire da profili auth, credenziali di ambiente o
  `models.json`.
- Se un provider ha credenziali ma OpenClaw non riesce a risolvere un candidato
  di modello sondabile per esso, `models status --probe` segnala `status: no_model` con
  `reasonCode: no_model`.

## Protezione dei criteri SecretRef OAuth

- L'input SecretRef è solo per credenziali statiche.
- Se una credenziale di profilo è `type: "oauth"`, gli oggetti SecretRef non sono supportati per il materiale delle credenziali di quel profilo.
- Se `auth.profiles.<id>.mode` è `"oauth"`, l'input `keyRef`/`tokenRef` supportato da SecretRef per quel profilo viene rifiutato.
- Le violazioni sono errori bloccanti nei percorsi di risoluzione auth all'avvio/ricaricamento.

## Messaggistica compatibile con il legacy

Per compatibilità con gli script, gli errori del probe mantengono invariata questa prima riga:

`Auth profile credentials are missing or expired.`

Dettagli più leggibili e codici motivo stabili possono essere aggiunti nelle righe successive.
