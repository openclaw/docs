---
read_when:
    - Chiamare gli strumenti senza eseguire un intero turno dell'agente
    - Creare automazioni che richiedono l'applicazione dei criteri degli strumenti
summary: Invoca un singolo strumento direttamente tramite l'endpoint HTTP del Gateway
title: API di invocazione Tools
x-i18n:
    generated_at: "2026-04-24T08:42:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: edae245ca8b3eb2f4bd62fb9001ddfcb3086bec40ab976b5389b291023f6205e
    source_path: gateway/tools-invoke-http-api.md
    workflow: 15
---

# Invocazione Tools (HTTP)

Il Gateway di OpenClaw espone un semplice endpoint HTTP per invocare direttamente un singolo strumento. È sempre abilitato e usa l'autenticazione del Gateway più i criteri degli strumenti. Come la superficie compatibile con OpenAI `/v1/*`, l'autenticazione bearer con segreto condiviso viene trattata come accesso operatore attendibile per l'intero gateway.

- `POST /tools/invoke`
- Stessa porta del Gateway (multiplex WS + HTTP): `http://<gateway-host>:<port>/tools/invoke`

La dimensione massima predefinita del payload è 2 MB.

## Autenticazione

Usa la configurazione auth del Gateway.

Percorsi comuni di autenticazione HTTP:

- autenticazione con segreto condiviso (`gateway.auth.mode="token"` o `"password"`):
  `Authorization: Bearer <token-or-password>`
- autenticazione HTTP attendibile con identità (`gateway.auth.mode="trusted-proxy"`):
  instrada tramite il proxy identity-aware configurato e lascia che inietti le
  intestazioni di identità richieste
- autenticazione aperta su ingresso privato (`gateway.auth.mode="none"`):
  nessuna intestazione auth richiesta

Note:

- Quando `gateway.auth.mode="token"`, usa `gateway.auth.token` (oppure `OPENCLAW_GATEWAY_TOKEN`).
- Quando `gateway.auth.mode="password"`, usa `gateway.auth.password` (oppure `OPENCLAW_GATEWAY_PASSWORD`).
- Quando `gateway.auth.mode="trusted-proxy"`, la richiesta HTTP deve provenire da una
  sorgente proxy attendibile configurata e non loopback; i proxy loopback sullo stesso host non
  soddisfano questa modalità.
- Se `gateway.auth.rateLimit` è configurato e si verificano troppi errori auth, l'endpoint restituisce `429` con `Retry-After`.

## Confine di sicurezza (importante)

Tratta questo endpoint come una superficie di **accesso operatore completo** per l'istanza gateway.

- L'autenticazione bearer HTTP qui non è un modello a portata limitata per utente.
- Un token/password Gateway valido per questo endpoint deve essere trattato come una credenziale di owner/operatore.
- Per le modalità auth con segreto condiviso (`token` e `password`), l'endpoint ripristina i normali predefiniti completi dell'operatore anche se il chiamante invia un'intestazione `x-openclaw-scopes` più restrittiva.
- L'autenticazione con segreto condiviso tratta anche le invocazioni dirette degli strumenti su questo endpoint come turni owner-sender.
- Le modalità HTTP attendibili con identità (per esempio autenticazione trusted proxy o `gateway.auth.mode="none"` su un ingresso privato) rispettano `x-openclaw-scopes` quando presente e altrimenti ripiegano sull'insieme normale di ambiti predefiniti dell'operatore.
- Mantieni questo endpoint solo su loopback/tailnet/ingresso privato; non esporlo direttamente a internet pubblico.

Matrice auth:

- `gateway.auth.mode="token"` o `"password"` + `Authorization: Bearer ...`
  - dimostra il possesso del segreto operatore condiviso del gateway
  - ignora `x-openclaw-scopes` più restrittivo
  - ripristina l'insieme completo predefinito degli ambiti operatore:
    `operator.admin`, `operator.approvals`, `operator.pairing`,
    `operator.read`, `operator.talk.secrets`, `operator.write`
  - tratta le invocazioni dirette degli strumenti su questo endpoint come turni owner-sender
- modalità HTTP attendibili con identità (per esempio autenticazione trusted proxy, oppure `gateway.auth.mode="none"` su ingresso privato)
  - autenticano una qualche identità esterna attendibile o un confine di deployment
  - rispettano `x-openclaw-scopes` quando l'intestazione è presente
  - ripiegano sull'insieme normale di ambiti predefiniti dell'operatore quando l'intestazione è assente
  - perdono la semantica owner solo quando il chiamante restringe esplicitamente gli ambiti e omette `operator.admin`

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
- `action` (stringa, facoltativo): mappato negli args se lo schema dello strumento supporta `action` e il payload args lo omette.
- `args` (oggetto, facoltativo): argomenti specifici dello strumento.
- `sessionKey` (stringa, facoltativo): chiave della sessione di destinazione. Se omessa o `"main"`, il Gateway usa la chiave della sessione principale configurata (rispetta `session.mainKey` e l'agente predefinito, oppure `global` nell'ambito globale).
- `dryRun` (booleano, facoltativo): riservato a uso futuro; attualmente ignorato.

## Comportamento di criteri + instradamento

La disponibilità degli strumenti viene filtrata attraverso la stessa catena di criteri usata dagli agenti Gateway:

- `tools.profile` / `tools.byProvider.profile`
- `tools.allow` / `tools.byProvider.allow`
- `agents.<id>.tools.allow` / `agents.<id>.tools.byProvider.allow`
- criteri di gruppo (se la chiave di sessione mappa a un gruppo o canale)
- criterio del sottoagente (quando si invoca con una chiave di sessione di sottoagente)

Se uno strumento non è consentito dai criteri, l'endpoint restituisce **404**.

Note importanti sui confini:

- Le approvazioni exec sono guardrail per l'operatore, non un confine di autorizzazione separato per questo endpoint HTTP. Se uno strumento è raggiungibile qui tramite auth Gateway + criteri degli strumenti, `/tools/invoke` non aggiunge un prompt di approvazione extra per chiamata.
- Non condividere credenziali bearer Gateway con chiamanti non attendibili. Se hai bisogno di separazione tra confini di fiducia, esegui gateway separati (e idealmente utenti/host OS separati).

L'HTTP Gateway applica anche per default una deny list hard (anche se i criteri di sessione consentono lo strumento):

- `exec` — esecuzione diretta di comandi (superficie RCE)
- `spawn` — creazione arbitraria di processi figli (superficie RCE)
- `shell` — esecuzione di comandi shell (superficie RCE)
- `fs_write` — modifica arbitraria di file sull'host
- `fs_delete` — eliminazione arbitraria di file sull'host
- `fs_move` — spostamento/rinomina arbitraria di file sull'host
- `apply_patch` — l'applicazione di patch può riscrivere file arbitrari
- `sessions_spawn` — orchestrazione di sessioni; avviare agenti da remoto è RCE
- `sessions_send` — iniezione di messaggi cross-session
- `cron` — control plane di automazione persistente
- `gateway` — control plane del gateway; impedisce la riconfigurazione via HTTP
- `nodes` — il relay di comandi node può raggiungere system.run su host associati
- `whatsapp_login` — setup interattivo che richiede la scansione di un QR nel terminale; si blocca su HTTP

Puoi personalizzare questa deny list tramite `gateway.tools`:

```json5
{
  gateway: {
    tools: {
      // Strumenti aggiuntivi da bloccare su HTTP /tools/invoke
      deny: ["browser"],
      // Rimuove strumenti dalla deny list predefinita
      allow: ["gateway"],
    },
  },
}
```

Per aiutare i criteri di gruppo a risolvere il contesto, puoi facoltativamente impostare:

- `x-openclaw-message-channel: <channel>` (esempio: `slack`, `telegram`)
- `x-openclaw-account-id: <accountId>` (quando esistono più account)

## Risposte

- `200` → `{ ok: true, result }`
- `400` → `{ ok: false, error: { type, message } }` (richiesta non valida o errore di input dello strumento)
- `401` → non autorizzato
- `429` → auth soggetta a rate limit (`Retry-After` impostato)
- `404` → strumento non disponibile (non trovato o non in allowlist)
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
- [Strumenti e Plugin](/it/tools)
