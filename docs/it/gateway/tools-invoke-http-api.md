---
read_when:
    - Chiamare strumenti senza eseguire un turno agente completo
    - Creazione di automazioni che richiedono l'applicazione delle policy degli strumenti
summary: Invoca un singolo strumento direttamente tramite l'endpoint HTTP Gateway
title: Gli strumenti invocano l'API
x-i18n:
    generated_at: "2026-06-27T17:36:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2023505f5a705b62e2fd685d64d3f9bd7788d09adfe89ac99604e6660c78ad8a
    source_path: gateway/tools-invoke-http-api.md
    workflow: 16
---

Il Gateway di OpenClaw espone un semplice endpoint HTTP per invocare direttamente un singolo strumento. È sempre abilitato e usa l'autenticazione del Gateway insieme alla policy degli strumenti. Come la superficie compatibile con OpenAI `/v1/*`, l'autenticazione bearer con segreto condiviso viene trattata come accesso operatore attendibile per l'intero gateway.

- `POST /tools/invoke`
- Stessa porta del Gateway (multiplex WS + HTTP): `http://<gateway-host>:<port>/tools/invoke`

La dimensione massima predefinita del payload è 2 MB.

## Autenticazione

Usa la configurazione di autenticazione del Gateway.

Percorsi comuni di autenticazione HTTP:

- autenticazione con segreto condiviso (`gateway.auth.mode="token"` o `"password"`):
  `Authorization: Bearer <token-or-password>`
- autenticazione HTTP con identità attendibile (`gateway.auth.mode="trusted-proxy"`):
  passa attraverso il proxy configurato consapevole dell'identità e lascia che inietti gli
  header di identità richiesti
- autenticazione aperta su ingresso privato (`gateway.auth.mode="none"`):
  nessun header di autenticazione richiesto

Note:

- Quando `gateway.auth.mode="token"`, usa `gateway.auth.token` (o `OPENCLAW_GATEWAY_TOKEN`).
- Quando `gateway.auth.mode="password"`, usa `gateway.auth.password` (o `OPENCLAW_GATEWAY_PASSWORD`).
- Quando `gateway.auth.mode="trusted-proxy"`, la richiesta HTTP deve provenire da una
  sorgente proxy attendibile configurata; i proxy local loopback sullo stesso host richiedono
  `gateway.auth.trustedProxy.allowLoopback = true` esplicito.
- I chiamanti interni sullo stesso host che aggirano il proxy possono usare
  `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` come fallback locale diretto.
  Qualsiasi evidenza negli header `Forwarded`, `X-Forwarded-*` o `X-Real-IP`
  mantiene invece la richiesta sul percorso trusted-proxy.
- Se `gateway.auth.rateLimit` è configurato e si verificano troppi errori di autenticazione, l'endpoint restituisce `429` con `Retry-After`.

## Confine di sicurezza (importante)

Tratta questo endpoint come una superficie di **accesso operatore completo** per l'istanza del gateway.

- L'autenticazione bearer HTTP qui non è un modello di ambito ristretto per utente.
- Un token/password Gateway valido per questo endpoint deve essere trattato come una credenziale di proprietario/operatore.
- Per le modalità di autenticazione con segreto condiviso (`token` e `password`), l'endpoint ripristina i normali valori predefiniti di operatore completo anche se il chiamante invia un header `x-openclaw-scopes` più ristretto.
- L'autenticazione con segreto condiviso tratta anche le invocazioni dirette degli strumenti su questo endpoint come turni del mittente proprietario.
- Le modalità HTTP con identità attendibile (per esempio l'autenticazione tramite proxy attendibile o `gateway.auth.mode="none"` su un ingresso privato) rispettano `x-openclaw-scopes` quando presente e altrimenti ricadono sul normale insieme di ambiti predefinito dell'operatore.
- Mantieni questo endpoint solo su loopback/tailnet/ingresso privato; non esporlo direttamente a Internet pubblico.

Matrice di autenticazione:

- `gateway.auth.mode="token"` o `"password"` + `Authorization: Bearer ...`
  - prova il possesso del segreto operatore condiviso del gateway
  - ignora `x-openclaw-scopes` più ristretto
  - ripristina l'insieme completo di ambiti operatore predefiniti:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - tratta le invocazioni dirette degli strumenti su questo endpoint come turni del mittente proprietario
- modalità HTTP con identità attendibile (per esempio autenticazione tramite proxy attendibile, oppure `gateway.auth.mode="none"` su ingresso privato)
  - autenticano un'identità esterna attendibile o un confine di distribuzione
  - rispettano `x-openclaw-scopes` quando l'header è presente
  - ricadono sul normale insieme di ambiti predefinito dell'operatore quando l'header è assente
  - perdono le semantiche di proprietario solo quando il chiamante restringe esplicitamente gli ambiti e omette `operator.admin`

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

- `tool` (stringa, obbligatorio): nome dello strumento da invocare.
- `action` (stringa, facoltativo): mappato negli argomenti se lo schema dello strumento supporta `action` e il payload degli argomenti lo ha omesso.
- `args` (oggetto, facoltativo): argomenti specifici dello strumento.
- `sessionKey` (stringa, facoltativo): chiave della sessione di destinazione. Se omessa o `"main"`, il Gateway usa la chiave della sessione principale configurata (rispetta `session.mainKey` e l'agente predefinito, oppure `global` nell'ambito globale).
- `dryRun` (booleano, facoltativo): riservato per uso futuro; attualmente ignorato.

## Comportamento di policy e instradamento

La disponibilità degli strumenti viene filtrata attraverso la stessa catena di policy usata dagli agenti del Gateway:

- `tools.profile` / `tools.byProvider.profile`
- `tools.allow` / `tools.byProvider.allow`
- `agents.<id>.tools.allow` / `agents.<id>.tools.byProvider.allow`
- policy di gruppo (se la chiave della sessione è mappata a un gruppo o canale)
- policy del subagente (quando si invoca con una chiave di sessione del subagente)

Se uno strumento non è consentito dalla policy, l'endpoint restituisce **404**.

Note importanti sui confini:

- Le approvazioni exec sono barriere di protezione per l'operatore, non un confine di autorizzazione separato per questo endpoint HTTP. Se uno strumento è raggiungibile qui tramite autenticazione Gateway + policy degli strumenti, `/tools/invoke` non aggiunge una richiesta di approvazione per chiamata aggiuntiva.
- Se `exec` è raggiungibile qui, trattalo come una superficie shell mutante. Negare `write`, `edit`, `apply_patch` o strumenti HTTP di scrittura sul filesystem non rende l'esecuzione shell di sola lettura.
- Non condividere le credenziali bearer del Gateway con chiamanti non attendibili. Se hai bisogno di separazione tra confini di fiducia, esegui gateway separati (e idealmente utenti/host del sistema operativo separati).

L'HTTP del Gateway applica anche una lista di negazione rigida per impostazione predefinita (anche se la policy di sessione consente lo strumento):

- `exec` - esecuzione diretta di comandi (superficie RCE)
- `spawn` - creazione arbitraria di processi figli (superficie RCE)
- `shell` - esecuzione di comandi shell (superficie RCE)
- `fs_write` - mutazione arbitraria di file sull'host
- `fs_delete` - eliminazione arbitraria di file sull'host
- `fs_move` - spostamento/rinomina arbitraria di file sull'host
- `apply_patch` - l'applicazione di patch può riscrivere file arbitrari
- `sessions_spawn` - orchestrazione di sessioni; generare agenti da remoto è RCE
- `sessions_send` - iniezione di messaggi tra sessioni
- `cron` - piano di controllo dell'automazione persistente
- `gateway` - piano di controllo del gateway; impedisce la riconfigurazione via HTTP
- `nodes` - il relay dei comandi dei nodi può raggiungere system.run sugli host associati
- `whatsapp_login` - configurazione interattiva che richiede la scansione del QR da terminale; si blocca su HTTP

Puoi personalizzare questa lista di negazione tramite `gateway.tools`:

```json5
{
  gateway: {
    tools: {
      // Additional tools to block over HTTP /tools/invoke
      deny: ["browser"],
      // Remove tools from the default deny list for owner/admin callers
      allow: ["gateway"],
    },
  },
}
```

`gateway.tools.allow` è una sovrascrittura di esposizione, non un aumento di ambito. Nelle
modalità HTTP con identità, `cron`, `gateway` e `nodes` restano non disponibili
per i chiamanti che non hanno identità proprietario/admin (`operator.admin`) anche quando
sono elencati in `gateway.tools.allow`. L'autenticazione bearer con segreto condiviso segue comunque
la regola dell'operatore attendibile completo descritta sopra.

Per aiutare le policy di gruppo a risolvere il contesto, puoi facoltativamente impostare:

- `x-openclaw-message-channel: <channel>` (esempio: `slack`, `telegram`)
- `x-openclaw-account-id: <accountId>` (quando esistono più account)

## Risposte

- `200` → `{ ok: true, result }`
- `400` → `{ ok: false, error: { type, message } }` (richiesta non valida o errore di input dello strumento)
- `401` → non autorizzato
- `429` → autenticazione soggetta a limite di frequenza (`Retry-After` impostato)
- `404` → strumento non disponibile (non trovato o non inserito nella lista consentita)
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
