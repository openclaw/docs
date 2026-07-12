---
read_when:
    - Lavorare sulla risoluzione dei profili di autenticazione o sull'instradamento delle credenziali
    - Debug degli errori di autenticazione del modello o dell'ordine dei profili
summary: Semantica canonica di idoneità e risoluzione delle credenziali per i profili di autenticazione
title: Semantica delle credenziali di autenticazione
x-i18n:
    generated_at: "2026-07-12T06:47:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6b0516b1bb23f400d5ac5fd39a628736034440216ac22823eef061b38564dff0
    source_path: auth-credential-semantics.md
    workflow: 16
---

Queste semantiche mantengono allineato il comportamento dell'autenticazione al momento della selezione e durante l'esecuzione. Sono condivise da:

- `resolveAuthProfileOrder` (ordinamento dei profili)
- `resolveApiKeyForProfile` (risoluzione delle credenziali in fase di esecuzione)
- `openclaw models status --probe`
- controlli di autenticazione di `openclaw doctor` (`doctor-auth`)

## Codici motivo stabili delle verifiche

I risultati delle verifiche includono una categoria `status` (`ok`, `auth`, `rate_limit`, `billing`, `timeout`, `format`, `unknown`, `no_model`) e un `reasonCode` stabile quando la verifica non ha mai raggiunto una chiamata al modello:

| `reasonCode`             | Significato                                                                                         |
| ------------------------ | --------------------------------------------------------------------------------------------------- |
| `excluded_by_auth_order` | Profilo omesso dall'ordine di autenticazione esplicito del relativo provider.                       |
| `missing_credential`     | Non è configurata alcuna credenziale inline o SecretRef.                                            |
| `expired`                | Il valore `expires` del token è nel passato.                                                        |
| `invalid_expires`        | `expires` non è un timestamp Unix valido, positivo ed espresso in millisecondi.                     |
| `unresolved_ref`         | Non è stato possibile risolvere il SecretRef configurato.                                           |
| `ineligible_profile`     | Il profilo non è compatibile con la configurazione del provider (incluso un input chiave non valido). |
| `no_model`               | Le credenziali esistono, ma non è stato risolto alcun modello candidato verificabile.               |

I controlli di idoneità riportano `ok` come codice motivo per le credenziali utilizzabili.

## Credenziali token

Le credenziali token (`type: "token"`) supportano `token` inline e/o `tokenRef`.

### Regole di idoneità

1. Un profilo token non è idoneo quando sia `token` sia `tokenRef` sono assenti (`missing_credential`).
2. `expires` è facoltativo. Quando presente, deve essere un numero finito di millisecondi dall'epoca Unix maggiore di `0` e non superiore al timestamp massimo di `Date` in JavaScript (8640000000000000).
3. Se `expires` non è valido (tipo errato, `NaN`, `0`, negativo, non finito o superiore a tale massimo), il profilo non è idoneo con `invalid_expires`.
4. Se `expires` è nel passato, il profilo non è idoneo con `expired`.
5. `tokenRef` non elude la convalida di `expires`.

### Regole di risoluzione

1. Le semantiche del resolver corrispondono a quelle di idoneità per `expires`.
2. Per i profili idonei, il materiale del token può essere risolto dal valore inline o da `tokenRef`.
3. I riferimenti non risolvibili producono `unresolved_ref` nell'output di `models status --probe`.

## Portabilità della copia degli agenti

L'ereditarietà dell'autenticazione degli agenti avviene mediante lettura diretta. Quando un agente non dispone di un profilo locale, in fase di esecuzione risolve i profili dall'archivio dell'agente predefinito/principale senza copiare il materiale segreto nel proprio archivio delle credenziali (`agents/<agentId>/agent/openclaw-agent.sqlite`).

I flussi di copia espliciti, come `openclaw agents add`, utilizzano questa politica di portabilità:

- I profili `api_key` e `token` sono portabili, a meno che non sia impostato `copyToAgents: false`.
- I profili `oauth` non sono portabili per impostazione predefinita, perché i token di aggiornamento possono essere monouso o sensibili alla rotazione.
- I flussi OAuth gestiti dal provider possono aderire tramite `copyToAgents: true` solo quando è noto che la copia del materiale di aggiornamento tra agenti è sicura; l'adesione si applica solo quando il profilo contiene inline il materiale di accesso/aggiornamento.

I profili non portabili restano disponibili tramite ereditarietà con lettura diretta, a meno che l'agente di destinazione non esegua l'accesso separatamente e crei un proprio profilo locale.

## Route di autenticazione basate solo sulla configurazione

Le voci di `auth.profiles` con `mode: "aws-sdk"` sono metadati di instradamento, non credenziali archiviate. Sono valide quando il provider di destinazione utilizza `models.providers.<id>.auth: "aws-sdk"`, la route scritta dalla configurazione di Amazon Bedrock gestita dal plugin. Questi ID profilo possono comparire in `auth.order` e nelle sostituzioni di sessione anche quando nell'archivio delle credenziali non esiste alcuna voce corrispondente.

Non scrivere `type: "aws-sdk"` nell'archivio delle credenziali; le credenziali archiviate possono essere solo `api_key`, `token` o `oauth`. Se un file `auth-profiles.json` legacy contiene un indicatore di questo tipo, `openclaw doctor --fix` lo sposta in `auth.profiles` e lo rimuove dall'archivio.

## Filtraggio dell'ordine di autenticazione esplicito

- Quando per un provider è impostato `auth.order.<provider>` o la sostituzione dell'ordine dell'archivio di autenticazione, `models status --probe` verifica solo gli ID profilo che rimangono nell'ordine di autenticazione risolto per quel provider. La sostituzione archiviata ha la precedenza sulla configurazione `auth.order`.
- Un profilo archiviato per quel provider ma omesso dall'ordine esplicito non viene provato silenziosamente in seguito. L'output della verifica lo riporta con `reasonCode: excluded_by_auth_order` e il dettaglio `Escluso da auth.order per questo provider.`

## Risoluzione della destinazione della verifica

- Le destinazioni delle verifiche possono provenire dai profili di autenticazione, dalle credenziali di ambiente o da `models.json` (`source` del risultato: `profile`, `env`, `models.json`).
- Se un provider dispone di credenziali ma OpenClaw non riesce a risolvere un modello candidato verificabile, `models status --probe` riporta `status: no_model` con `reasonCode: no_model`.

## Individuazione delle credenziali delle CLI esterne

- Le credenziali disponibili solo in fase di esecuzione e gestite da CLI esterne (Claude CLI per `claude-cli`, Codex CLI per `openai`, MiniMax CLI per `minimax-portal`) vengono individuate solo quando il provider, l'ambiente di esecuzione o il profilo di autenticazione rientra nell'ambito dell'operazione corrente, oppure quando esiste già un profilo locale archiviato per quella fonte esterna.
- I chiamanti dell'archivio di autenticazione scelgono una modalità esplicita di individuazione delle CLI esterne: `none` solo per l'autenticazione persistita/del plugin, `existing` per aggiornare i profili CLI esterni già archiviati oppure `scoped` per un insieme concreto di provider/profili.
- I percorsi di sola lettura/stato passano `allowKeychainPrompt: false`; utilizzano solo credenziali delle CLI esterne basate su file e non leggono né riutilizzano i risultati del Portachiavi di macOS.

## Protezione della politica SecretRef per OAuth

L'input SecretRef è destinato esclusivamente alle credenziali statiche. Le credenziali OAuth sono modificabili in fase di esecuzione (i flussi di aggiornamento persistono i token ruotati), pertanto il materiale OAuth basato su SecretRef suddividerebbe lo stato modificabile tra più archivi.

- Se la credenziale di un profilo è `type: "oauth"`, gli oggetti SecretRef vengono rifiutati per qualsiasi campo contenente materiale delle credenziali in tale profilo.
- Se `auth.profiles.<id>.mode` è `"oauth"`, l'input `keyRef`/`tokenRef` basato su SecretRef per tale profilo viene rifiutato.
- Le violazioni causano errori irreversibili (eccezioni generate) nei percorsi di preparazione dei segreti all'avvio/ricaricamento e di risoluzione dei profili.

## Messaggistica compatibile con le versioni legacy

Per la compatibilità degli script, gli errori delle verifiche mantengono invariata questa prima riga:

`Auth profile credentials are missing or expired.`

I dettagli leggibili e il codice motivo stabile seguono nelle righe successive nel formato `↳ Motivo dell'autenticazione [codice]: ...`.

## Argomenti correlati

- [Gestione dei segreti](/it/gateway/secrets)
- [Archiviazione dell'autenticazione](/it/concepts/oauth)
