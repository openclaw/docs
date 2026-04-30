---
read_when:
    - Chiamare strumenti senza eseguire un turno completo dell'agente
    - Creare automazioni che richiedono l'applicazione dei criteri per gli strumenti
summary: Invoca direttamente un singolo strumento tramite l'endpoint HTTP del Gateway
title: API di invocazione degli strumenti
x-i18n:
    generated_at: "2026-04-30T08:54:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7ba20b7471de76e7f6bccc4d7a3d72c00d9d7b9843ad4e74825685c992a33f1a
    source_path: gateway/tools-invoke-http-api.md
    workflow: 16
---

# Invocazione degli strumenti (HTTP)

Il Gateway di OpenClaw espone un semplice endpoint HTTP per invocare direttamente un singolo strumento. È sempre abilitato e usa l’autenticazione del Gateway più la policy degli strumenti. Come la superficie compatibile con OpenAI `/v1/*`, l’autenticazione bearer con segreto condiviso è trattata come accesso operatore attendibile per l’intero gateway.

- `POST /tools/invoke`
- Stessa porta del Gateway (multiplex WS + HTTP): `http://<gateway-host>:<port>/tools/invoke`

La dimensione massima predefinita del payload è 2 MB.

## Autenticazione

Usa la configurazione di autenticazione del Gateway.

Percorsi comuni di autenticazione HTTP:

- autenticazione con segreto condiviso (`gateway.auth.mode="token"` o `"password"`):
  `Authorization: Bearer <token-or-password>`
- autenticazione HTTP attendibile con identità (`gateway.auth.mode="trusted-proxy"`):
  passa attraverso il proxy configurato consapevole dell’identità e lascia che inserisca gli
  header di identità richiesti
- autenticazione aperta su ingresso privato (`gateway.auth.mode="none"`):
  nessun header di autenticazione richiesto

Note:

- Quando `gateway.auth.mode="token"`, usa `gateway.auth.token` (o `OPENCLAW_GATEWAY_TOKEN`).
- Quando `gateway.auth.mode="password"`, usa `gateway.auth.password` (o `OPENCLAW_GATEWAY_PASSWORD`).
- Quando `gateway.auth.mode="trusted-proxy"`, la richiesta HTTP deve provenire da una
  sorgente proxy attendibile configurata; i proxy loopback sullo stesso host richiedono
  `gateway.auth.trustedProxy.allowLoopback = true` esplicito.
- Se `gateway.auth.rateLimit` è configurato e si verificano troppi errori di autenticazione, l’endpoint restituisce `429` con `Retry-After`.

## Confine di sicurezza (importante)

Tratta questo endpoint come una superficie con **accesso operatore completo** per l’istanza del gateway.

- L’autenticazione bearer HTTP qui non è un modello ristretto di ambito per utente.
- Un token/password del Gateway valido per questo endpoint deve essere trattato come una credenziale di proprietario/operatore.
- Per le modalità di autenticazione con segreto condiviso (`token` e `password`), l’endpoint ripristina i normali valori predefiniti di operatore completo anche se il chiamante invia un header `x-openclaw-scopes` più ristretto.
- L’autenticazione con segreto condiviso tratta anche le invocazioni dirette di strumenti su questo endpoint come turni del mittente proprietario.
- Le modalità HTTP attendibili con identità (per esempio autenticazione tramite proxy attendibile o `gateway.auth.mode="none"` su un ingresso privato) rispettano `x-openclaw-scopes` quando presente e altrimenti ricadono sul normale insieme di ambiti predefiniti dell’operatore.
- Mantieni questo endpoint solo su loopback/tailnet/ingresso privato; non esporlo direttamente a internet pubblico.

Matrice di autenticazione:

- `gateway.auth.mode="token"` o `"password"` + `Authorization: Bearer ...`
  - prova il possesso del segreto operatore condiviso del gateway
  - ignora `x-openclaw-scopes` più ristretti
  - ripristina l’intero insieme di ambiti predefiniti dell’operatore:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - tratta le invocazioni dirette di strumenti su questo endpoint come turni del mittente proprietario
- modalità HTTP attendibili con identità (per esempio autenticazione tramite proxy attendibile, o `gateway.auth.mode="none"` su ingresso privato)
  - autenticano un’identità attendibile esterna o un confine di distribuzione
  - rispettano `x-openclaw-scopes` quando l’header è presente
  - ricadono sul normale insieme di ambiti predefiniti dell’operatore quando l’header è assente
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

- `tool` (stringa, obbligatorio): nome dello strumento da invocare.
- `action` (stringa, facoltativo): mappato negli argomenti se lo schema dello strumento supporta `action` e il payload degli argomenti lo omette.
- `args` (oggetto, facoltativo): argomenti specifici dello strumento.
- `sessionKey` (stringa, facoltativo): chiave della sessione di destinazione. Se omessa o `"main"`, il Gateway usa la chiave della sessione principale configurata (rispetta `session.mainKey` e l’agente predefinito, o `global` nell’ambito globale).
- `dryRun` (booleano, facoltativo): riservato per uso futuro; attualmente ignorato.

## Policy e comportamento di routing

La disponibilità degli strumenti viene filtrata attraverso la stessa catena di policy usata dagli agenti del Gateway:

- `tools.profile` / `tools.byProvider.profile`
- `tools.allow` / `tools.byProvider.allow`
- `agents.<id>.tools.allow` / `agents.<id>.tools.byProvider.allow`
- policy di gruppo (se la chiave di sessione mappa a un gruppo o canale)
- policy del subagente (quando si invoca con una chiave di sessione di subagente)

Se uno strumento non è consentito dalla policy, l’endpoint restituisce **404**.

Note importanti sul confine:

- Le approvazioni di esecuzione sono guardrail dell’operatore, non un confine di autorizzazione separato per questo endpoint HTTP. Se uno strumento è raggiungibile qui tramite autenticazione del Gateway + policy degli strumenti, `/tools/invoke` non aggiunge un prompt di approvazione aggiuntivo per chiamata.
- Non condividere credenziali bearer del Gateway con chiamanti non attendibili. Se hai bisogno di separazione tra confini di fiducia, esegui gateway separati (e idealmente utenti/host del sistema operativo separati).

L’HTTP del Gateway applica anche per impostazione predefinita una lista di negazione rigida (anche se la policy di sessione consente lo strumento):

- `exec` — esecuzione diretta di comandi (superficie RCE)
- `spawn` — creazione arbitraria di processi figli (superficie RCE)
- `shell` — esecuzione di comandi shell (superficie RCE)
- `fs_write` — modifica arbitraria di file sull’host
- `fs_delete` — eliminazione arbitraria di file sull’host
- `fs_move` — spostamento/rinomina arbitrari di file sull’host
- `apply_patch` — l’applicazione di patch può riscrivere file arbitrari
- `sessions_spawn` — orchestrazione delle sessioni; generare agenti da remoto è RCE
- `sessions_send` — iniezione di messaggi tra sessioni
- `cron` — piano di controllo dell’automazione persistente
- `gateway` — piano di controllo del gateway; impedisce la riconfigurazione tramite HTTP
- `nodes` — il relay dei comandi dei nodi può raggiungere system.run sugli host associati
- `whatsapp_login` — configurazione interattiva che richiede la scansione QR da terminale; si blocca su HTTP

Puoi personalizzare questa lista di negazione tramite `gateway.tools`:

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

Per aiutare le policy di gruppo a risolvere il contesto, puoi facoltativamente impostare:

- `x-openclaw-message-channel: <channel>` (esempio: `slack`, `telegram`)
- `x-openclaw-account-id: <accountId>` (quando esistono più account)

## Risposte

- `200` → `{ ok: true, result }`
- `400` → `{ ok: false, error: { type, message } }` (richiesta non valida o errore nell’input dello strumento)
- `401` → non autorizzato
- `429` → autenticazione limitata per frequenza (`Retry-After` impostato)
- `404` → strumento non disponibile (non trovato o non consentito)
- `405` → metodo non consentito
- `500` → `{ ok: false, error: { type, message } }` (errore imprevisto di esecuzione dello strumento; messaggio sanitizzato)

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

- [Protocollo del Gateway](/it/gateway/protocol)
- [Strumenti e plugin](/it/tools)
