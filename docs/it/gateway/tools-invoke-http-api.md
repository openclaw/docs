---
read_when:
    - Chiamare strumenti senza eseguire un turno completo dell'agente
    - Creazione di automazioni che richiedono l'applicazione dei criteri degli strumenti
summary: Invoca un singolo strumento direttamente tramite l'endpoint HTTP del Gateway
title: API di invocazione degli strumenti
x-i18n:
    generated_at: "2026-05-10T19:37:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 531e77673fb9c06d0cc8f8145d874e22f7e590dc3e4c5dee1574874af5666886
    source_path: gateway/tools-invoke-http-api.md
    workflow: 16
---

Il Gateway di OpenClaw espone un semplice endpoint HTTP per invocare direttamente un singolo strumento. È sempre abilitato e usa l'autenticazione del Gateway più la policy degli strumenti. Come la superficie `/v1/*` compatibile con OpenAI, l'autenticazione bearer con segreto condiviso viene trattata come accesso operatore attendibile per l'intero Gateway.

- `POST /tools/invoke`
- Stessa porta del Gateway (multiplex WS + HTTP): `http://<gateway-host>:<port>/tools/invoke`

La dimensione massima predefinita del payload è 2 MB.

## Autenticazione

Usa la configurazione di autenticazione del Gateway.

Percorsi comuni di autenticazione HTTP:

- autenticazione con segreto condiviso (`gateway.auth.mode="token"` o `"password"`):
  `Authorization: Bearer <token-or-password>`
- autenticazione HTTP attendibile con identità (`gateway.auth.mode="trusted-proxy"`):
  instrada tramite il proxy configurato con consapevolezza dell'identità e lascia che inietti gli
  header di identità richiesti
- autenticazione aperta su ingresso privato (`gateway.auth.mode="none"`):
  nessun header di autenticazione richiesto

Note:

- Quando `gateway.auth.mode="token"`, usa `gateway.auth.token` (o `OPENCLAW_GATEWAY_TOKEN`).
- Quando `gateway.auth.mode="password"`, usa `gateway.auth.password` (o `OPENCLAW_GATEWAY_PASSWORD`).
- Quando `gateway.auth.mode="trusted-proxy"`, la richiesta HTTP deve provenire da una
  sorgente proxy attendibile configurata; i proxy local loopback sullo stesso host richiedono
  `gateway.auth.trustedProxy.allowLoopback = true` esplicito.
- Se `gateway.auth.rateLimit` è configurato e si verificano troppi errori di autenticazione, l'endpoint restituisce `429` con `Retry-After`.

## Confine di sicurezza (importante)

Tratta questo endpoint come una superficie con **accesso operatore completo** per l'istanza Gateway.

- L'autenticazione bearer HTTP qui non è un modello con ambiti ristretti per utente.
- Un token/password Gateway valido per questo endpoint deve essere trattato come una credenziale proprietario/operatore.
- Per le modalità di autenticazione con segreto condiviso (`token` e `password`), l'endpoint ripristina i normali valori predefiniti dell'operatore completo anche se il chiamante invia un header `x-openclaw-scopes` più ristretto.
- L'autenticazione con segreto condiviso tratta anche le invocazioni dirette degli strumenti su questo endpoint come turni del mittente proprietario.
- Le modalità HTTP attendibili con identità (per esempio autenticazione tramite proxy attendibile o `gateway.auth.mode="none"` su un ingresso privato) rispettano `x-openclaw-scopes` quando presente e altrimenti ripiegano sul normale insieme di ambiti predefiniti dell'operatore.
- Mantieni questo endpoint solo su loopback/tailnet/ingresso privato; non esporlo direttamente a Internet pubblico.

Matrice di autenticazione:

- `gateway.auth.mode="token"` o `"password"` + `Authorization: Bearer ...`
  - dimostra il possesso del segreto operatore condiviso del Gateway
  - ignora `x-openclaw-scopes` più ristretti
  - ripristina l'insieme completo di ambiti operatore predefiniti:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - tratta le invocazioni dirette degli strumenti su questo endpoint come turni del mittente proprietario
- modalità HTTP attendibili con identità (per esempio autenticazione tramite proxy attendibile, o `gateway.auth.mode="none"` su ingresso privato)
  - autenticano una qualche identità attendibile esterna o un confine di distribuzione
  - rispettano `x-openclaw-scopes` quando l'header è presente
  - ripiegano sul normale insieme di ambiti predefiniti dell'operatore quando l'header è assente
  - perdono la semantica di proprietario solo quando il chiamante restringe esplicitamente gli ambiti e omette `operator.admin`

## Corpo della richiesta

```json
{
  "tool": "sessions_list",
  "action": "json",
  "args": {},
  "sessionKey": "main",
  "dryRun": false
}
```

Campi:

- `tool` (string, obbligatorio): nome dello strumento da invocare.
- `action` (string, facoltativo): mappato negli argomenti se lo schema dello strumento supporta `action` e il payload degli argomenti l'ha omesso.
- `args` (object, facoltativo): argomenti specifici dello strumento.
- `sessionKey` (string, facoltativo): chiave della sessione di destinazione. Se omessa o `"main"`, il Gateway usa la chiave della sessione principale configurata (rispetta `session.mainKey` e l'agente predefinito, oppure `global` nell'ambito globale).
- `dryRun` (boolean, facoltativo): riservato per uso futuro; attualmente ignorato.

## Comportamento di policy e instradamento

La disponibilità degli strumenti viene filtrata tramite la stessa catena di policy usata dagli agenti Gateway:

- `tools.profile` / `tools.byProvider.profile`
- `tools.allow` / `tools.byProvider.allow`
- `agents.<id>.tools.allow` / `agents.<id>.tools.byProvider.allow`
- policy di gruppo (se la chiave di sessione è mappata a un gruppo o canale)
- policy dei sottoagenti (quando si invoca con una chiave di sessione di sottoagente)

Se uno strumento non è consentito dalla policy, l'endpoint restituisce **404**.

Note importanti sui confini:

- Le approvazioni exec sono protezioni per l'operatore, non un confine di autorizzazione separato per questo endpoint HTTP. Se uno strumento è raggiungibile qui tramite autenticazione Gateway + policy degli strumenti, `/tools/invoke` non aggiunge un prompt di approvazione aggiuntivo per chiamata.
- Se `exec` è raggiungibile qui, trattalo come una superficie shell mutante. Negare `write`, `edit`, `apply_patch` o strumenti HTTP di scrittura sul filesystem non rende l'esecuzione shell di sola lettura.
- Non condividere le credenziali bearer del Gateway con chiamanti non attendibili. Se hai bisogno di separazione tra confini di fiducia, esegui Gateway separati (e idealmente utenti/host OS separati).

Per impostazione predefinita, l'HTTP del Gateway applica anche una deny list rigida (anche se la policy di sessione consente lo strumento):

- `exec` - esecuzione diretta di comandi (superficie RCE)
- `spawn` - creazione arbitraria di processi figlio (superficie RCE)
- `shell` - esecuzione di comandi shell (superficie RCE)
- `fs_write` - modifica arbitraria di file sull'host
- `fs_delete` - eliminazione arbitraria di file sull'host
- `fs_move` - spostamento/rinomina arbitraria di file sull'host
- `apply_patch` - l'applicazione di patch può riscrivere file arbitrari
- `sessions_spawn` - orchestrazione delle sessioni; generare agenti da remoto è RCE
- `sessions_send` - iniezione di messaggi tra sessioni
- `cron` - piano di controllo dell'automazione persistente
- `gateway` - piano di controllo del Gateway; impedisce la riconfigurazione tramite HTTP
- `nodes` - il relay dei comandi del nodo può raggiungere system.run sugli host associati
- `whatsapp_login` - configurazione interattiva che richiede la scansione QR dal terminale; resta in sospeso su HTTP

Puoi personalizzare questa deny list tramite `gateway.tools`:

```json5
{
  gateway: {
    tools: {
      // Additional tools to block over HTTP /tools/invoke
      deny: ["browser"],
      // Remove tools from the default deny list
      allow: ["gateway"],
    },
  },
}
```

Per aiutare le policy di gruppo a risolvere il contesto, puoi opzionalmente impostare:

- `x-openclaw-message-channel: <channel>` (esempio: `slack`, `telegram`)
- `x-openclaw-account-id: <accountId>` (quando esistono più account)

## Risposte

- `200` → `{ ok: true, result }`
- `400` → `{ ok: false, error: { type, message } }` (richiesta non valida o errore di input dello strumento)
- `401` → non autorizzato
- `429` → autenticazione soggetta a limite di frequenza (`Retry-After` impostato)
- `404` → strumento non disponibile (non trovato o non inserito nella allowlist)
- `405` → metodo non consentito
- `500` → `{ ok: false, error: { type, message } }` (errore imprevisto di esecuzione dello strumento; messaggio sanificato)

## Esempio

```bash
curl -sS http://127.0.0.1:18789/tools/invoke \
  -H 'Authorization: Bearer secret' \
  -H 'Content-Type: application/json' \
  -d '{
    "tool": "sessions_list",
    "action": "json",
    "args": {}
  }'
```

## Correlati

- [Protocollo Gateway](/it/gateway/protocol)
- [Strumenti e plugin](/it/tools)
