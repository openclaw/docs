---
read_when:
    - Vuoi chiamare strumenti senza eseguire un turno completo dell'agente
    - Stai creando automazioni che richiedono l'applicazione della policy degli strumenti
summary: Invoca un singolo strumento direttamente tramite l'endpoint HTTP del Gateway
title: API Tools Invoke
x-i18n:
    generated_at: "2026-04-05T13:53:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: e924f257ba50b25dea0ec4c3f9eed4c8cac8a53ddef18215f87ac7de330a37fd
    source_path: gateway/tools-invoke-http-api.md
    workflow: 15
---

# Tools Invoke (HTTP)

Il Gateway di OpenClaw espone un semplice endpoint HTTP per invocare direttamente un singolo strumento. È sempre abilitato e usa l'autenticazione del Gateway più la policy degli strumenti. Come la superficie compatibile con OpenAI `/v1/*`, l'autenticazione bearer con segreto condiviso viene trattata come accesso operatore fidato per l'intero gateway.

- `POST /tools/invoke`
- Stessa porta del Gateway (multiplex WS + HTTP): `http://<gateway-host>:<port>/tools/invoke`

La dimensione massima predefinita del payload è 2 MB.

## Autenticazione

Usa la configurazione di autenticazione del Gateway.

Percorsi comuni di autenticazione HTTP:

- autenticazione con segreto condiviso (`gateway.auth.mode="token"` o `"password"`):
  `Authorization: Bearer <token-or-password>`
- autenticazione HTTP fidata con identità (`gateway.auth.mode="trusted-proxy"`):
  instrada tramite il proxy identity-aware configurato e lascia che inserisca le
  intestazioni di identità richieste
- autenticazione aperta su ingresso privato (`gateway.auth.mode="none"`):
  nessuna intestazione auth richiesta

Note:

- Quando `gateway.auth.mode="token"`, usa `gateway.auth.token` (o `OPENCLAW_GATEWAY_TOKEN`).
- Quando `gateway.auth.mode="password"`, usa `gateway.auth.password` (o `OPENCLAW_GATEWAY_PASSWORD`).
- Quando `gateway.auth.mode="trusted-proxy"`, la richiesta HTTP deve provenire da una
  sorgente proxy fidata non loopback configurata; i proxy loopback sullo stesso host
  non soddisfano questa modalità.
- Se `gateway.auth.rateLimit` è configurato e si verificano troppi errori di autenticazione, l'endpoint restituisce `429` con `Retry-After`.

## Confine di sicurezza (importante)

Tratta questo endpoint come una superficie di **accesso operatore completo** per l'istanza gateway.

- L'autenticazione bearer HTTP qui non è un modello a portata ridotta per utente.
- Un token/password Gateway valido per questo endpoint deve essere trattato come una credenziale da proprietario/operatore.
- Per le modalità di autenticazione con segreto condiviso (`token` e `password`), l'endpoint ripristina i normali valori predefiniti completi dell'operatore anche se il chiamante invia un'intestazione `x-openclaw-scopes` più restrittiva.
- L'autenticazione con segreto condiviso tratta anche le invocazioni dirette degli strumenti su questo endpoint come turni owner-sender.
- Le modalità HTTP fidate con identità (ad esempio autenticazione trusted proxy o `gateway.auth.mode="none"` su un ingresso privato) rispettano `x-openclaw-scopes` quando presente e altrimenti tornano all'insieme normale di scope predefiniti dell'operatore.
- Mantieni questo endpoint solo su loopback/tailnet/ingresso privato; non esporlo direttamente a internet pubblico.

Matrice di autenticazione:

- `gateway.auth.mode="token"` o `"password"` + `Authorization: Bearer ...`
  - dimostra il possesso del segreto operatore condiviso del gateway
  - ignora `x-openclaw-scopes` più restrittivo
  - ripristina l'insieme completo degli scope operatore predefiniti:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - tratta le invocazioni dirette degli strumenti su questo endpoint come turni owner-sender
- modalità HTTP fidate con identità (ad esempio autenticazione trusted proxy, o `gateway.auth.mode="none"` su ingresso privato)
  - autenticano una qualche identità fidata esterna o un confine di deployment
  - rispettano `x-openclaw-scopes` quando l'intestazione è presente
  - tornano all'insieme normale di scope operatore predefiniti quando l'intestazione è assente
  - perdono la semantica owner solo quando il chiamante restringe esplicitamente gli scope e omette `operator.admin`

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
- `action` (stringa, facoltativo): mappato negli argomenti se lo schema dello strumento supporta `action` e il payload args lo ha omesso.
- `args` (oggetto, facoltativo): argomenti specifici dello strumento.
- `sessionKey` (stringa, facoltativo): chiave di sessione di destinazione. Se omessa o `"main"`, il Gateway usa la chiave della sessione principale configurata (rispetta `session.mainKey` e l'agente predefinito, oppure `global` in ambito globale).
- `dryRun` (booleano, facoltativo): riservato per uso futuro; attualmente ignorato.

## Comportamento di policy + instradamento

La disponibilità degli strumenti viene filtrata attraverso la stessa catena di policy usata dagli agenti Gateway:

- `tools.profile` / `tools.byProvider.profile`
- `tools.allow` / `tools.byProvider.allow`
- `agents.<id>.tools.allow` / `agents.<id>.tools.byProvider.allow`
- policy di gruppo (se la chiave di sessione corrisponde a un gruppo o canale)
- policy del sotto-agente (quando si invoca con una chiave di sessione del sotto-agente)

Se uno strumento non è consentito dalla policy, l'endpoint restituisce **404**.

Note importanti sui confini:

- Le approvazioni exec sono barriere operative, non un confine di autorizzazione separato per questo endpoint HTTP. Se uno strumento è raggiungibile qui tramite autenticazione Gateway + policy degli strumenti, `/tools/invoke` non aggiunge un ulteriore prompt di approvazione per chiamata.
- Non condividere credenziali bearer Gateway con chiamanti non fidati. Se hai bisogno di separazione tra confini di fiducia, esegui gateway separati (e idealmente utenti/host OS separati).

L'HTTP del Gateway applica anche un deny list rigido per impostazione predefinita (anche se la policy della sessione consente lo strumento):

- `exec` — esecuzione diretta di comandi (superficie RCE)
- `spawn` — creazione arbitraria di processi figlio (superficie RCE)
- `shell` — esecuzione di comandi shell (superficie RCE)
- `fs_write` — modifica arbitraria di file sull'host
- `fs_delete` — eliminazione arbitraria di file sull'host
- `fs_move` — spostamento/rinomina arbitrari di file sull'host
- `apply_patch` — l'applicazione di patch può riscrivere file arbitrari
- `sessions_spawn` — orchestrazione delle sessioni; generare agenti da remoto è RCE
- `sessions_send` — iniezione di messaggi cross-session
- `cron` — piano di controllo dell'automazione persistente
- `gateway` — piano di controllo del gateway; impedisce la riconfigurazione via HTTP
- `nodes` — il relay dei comandi ai nodi può raggiungere system.run su host associati
- `whatsapp_login` — configurazione interattiva che richiede scansione QR da terminale; si blocca su HTTP

Puoi personalizzare questo deny list tramite `gateway.tools`:

```json5
{
  gateway: {
    tools: {
      // Strumenti aggiuntivi da bloccare su HTTP /tools/invoke
      deny: ["browser"],
      // Rimuove strumenti dal deny list predefinito
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
- `400` → `{ ok: false, error: { type, message } }` (richiesta non valida o errore negli input dello strumento)
- `401` → non autorizzato
- `429` → autenticazione rate-limited (`Retry-After` impostato)
- `404` → strumento non disponibile (non trovato o non in allowlist)
- `405` → metodo non consentito
- `500` → `{ ok: false, error: { type, message } }` (errore imprevisto nell'esecuzione dello strumento; messaggio sanitizzato)

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
