---
read_when:
    - Chiamare gli strumenti senza eseguire un turno completo dell'agente
    - Creazione di automazioni che richiedono l'applicazione dei criteri per gli strumenti
summary: Richiama direttamente un singolo strumento tramite l'endpoint HTTP del Gateway
title: Gli strumenti invocano l'API
x-i18n:
    generated_at: "2026-07-12T07:05:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6d07f765d63255e718d5e558b662589e77b2992538f43288cd83e6e3f2a06dda
    source_path: gateway/tools-invoke-http-api.md
    workflow: 16
---

L'Gateway di OpenClaw espone un endpoint HTTP per invocare direttamente un singolo strumento. È sempre abilitato e usa l'autenticazione del Gateway insieme ai criteri degli strumenti. Come per l'interfaccia compatibile con OpenAI `/v1/*`, l'autenticazione bearer con segreto condiviso viene considerata un accesso operatore attendibile per l'intero Gateway.

- `POST /tools/invoke`
- Stessa porta del Gateway (multiplexing WS + HTTP): `http://<gateway-host>:<port>/tools/invoke`
- Dimensione massima predefinita del corpo della richiesta: 2 MB

## Autenticazione

Usa la configurazione di autenticazione del Gateway.

Percorsi comuni di autenticazione HTTP:

- autenticazione con segreto condiviso (`gateway.auth.mode="token"` o `"password"`): `Authorization: Bearer <token-or-password>`
- autenticazione HTTP attendibile con identità (`gateway.auth.mode="trusted-proxy"`): instrada la richiesta attraverso il proxy configurato con riconoscimento dell'identità e lascia che inserisca le intestazioni di identità richieste
- autenticazione aperta su ingresso privato (`gateway.auth.mode="none"`): non è richiesta alcuna intestazione di autenticazione

Note:

- `mode="token"` usa `gateway.auth.token` (o `OPENCLAW_GATEWAY_TOKEN`).
- `mode="password"` usa `gateway.auth.password` (o `OPENCLAW_GATEWAY_PASSWORD`).
- `mode="trusted-proxy"` richiede che la richiesta HTTP provenga da un'origine proxy attendibile configurata; i proxy local loopback sullo stesso host richiedono esplicitamente `gateway.auth.trustedProxy.allowLoopback = true`.
- I chiamanti interni sullo stesso host che bypassano il proxy possono usare `gateway.auth.password` / `OPENCLAW_GATEWAY_PASSWORD` come ripiego diretto locale. Qualsiasi evidenza nelle intestazioni `Forwarded`, `X-Forwarded-*` o `X-Real-IP` mantiene invece la richiesta sul percorso del proxy attendibile.
- Se `gateway.auth.rateLimit` è configurato e si verificano troppi errori di autenticazione, l'endpoint restituisce `429` con `Retry-After`.

## Confine di sicurezza (importante)

Considera questo endpoint come una superficie di **accesso operatore completo** per l'istanza del Gateway.

- In questo caso, l'autenticazione bearer HTTP non è un modello con ambito ristretto per singolo utente.
- Un token o una password del Gateway validi per questo endpoint devono essere considerati credenziali di proprietario/operatore.
- Per le modalità di autenticazione con segreto condiviso (`token` e `password`), l'endpoint ripristina i normali valori predefiniti di accesso operatore completo anche se il chiamante invia un'intestazione `x-openclaw-scopes` più restrittiva.
- L'autenticazione con segreto condiviso considera inoltre le invocazioni dirette degli strumenti su questo endpoint come turni inviati dal proprietario.
- Le modalità HTTP attendibili con identità (autenticazione tramite proxy attendibile oppure `gateway.auth.mode="none"` su un ingresso privato) rispettano `x-openclaw-scopes` quando presente; in caso contrario, usano il normale insieme predefinito di ambiti dell'operatore.
- Mantieni questo endpoint accessibile solo tramite local loopback, tailnet o ingresso privato; non esporlo direttamente alla rete Internet pubblica.

Matrice di autenticazione:

| Modalità di autenticazione                                                               | Comportamento                                                                                                                                                                                                                                                                                                                                                       |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `token` o `password` + `Authorization: Bearer ...`                                        | Dimostra il possesso del segreto condiviso dell'operatore del Gateway. Ignora un'intestazione `x-openclaw-scopes` più restrittiva. Ripristina l'insieme completo predefinito degli ambiti dell'operatore: `operator.admin`, `operator.approvals`, `operator.pairing`, `operator.read`, `operator.talk.secrets`, `operator.write`. Considera le invocazioni dirette degli strumenti come turni inviati dal proprietario. |
| HTTP attendibile con identità (autenticazione tramite proxy attendibile o `mode="none"` su ingresso privato) | Autentica un'identità attendibile esterna o un confine di distribuzione. Rispetta `x-openclaw-scopes` quando presente. Se l'intestazione è assente, usa il normale insieme predefinito degli ambiti dell'operatore. Perde la semantica di proprietario solo quando il chiamante restringe esplicitamente gli ambiti e omette `operator.admin`.                                               |

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

- `tool` / `name` (stringa, obbligatorio): nome dello strumento da invocare. `name` ha la precedenza se vengono inviati entrambi.
- `action` (stringa, facoltativo): viene unito in `args.action` se lo schema dello strumento supporta una proprietà `action` e `args` non ne ha già impostata una.
- `args` (oggetto, facoltativo): argomenti specifici dello strumento.
- `sessionKey` (stringa, facoltativo): chiave della sessione di destinazione. Se omessa o impostata su `"main"`, il Gateway usa la chiave della sessione principale configurata (rispetta `session.mainKey` e l'agente predefinito, oppure `global` nell'ambito di sessione globale).
- `agentId` (stringa, facoltativo): risolve la chiave di sessione per quell'agente. Restituisce un errore `400` se è in conflitto con un `sessionKey` esplicito già associato a un agente diverso.
- `idempotencyKey` (stringa, facoltativo): usata per derivare un ID stabile della chiamata allo strumento per l'invocazione.
- `dryRun` (booleano, facoltativo): riservato per usi futuri; attualmente ignorato.

## Comportamento dei criteri e dell'instradamento

La disponibilità degli strumenti viene filtrata tramite la stessa catena di criteri usata dagli agenti del Gateway:

- `tools.profile` / `tools.byProvider.profile`
- `tools.allow` / `tools.byProvider.allow`
- `agents.<id>.tools.allow` / `agents.<id>.tools.byProvider.allow`
- criteri di gruppo (se la chiave di sessione è associata a un gruppo o a un canale)
- criteri del sottoagente (quando si invoca usando la chiave di sessione di un sottoagente)

Se uno strumento non è consentito dai criteri, l'endpoint restituisce **404**.

Note importanti sui confini:

- Le approvazioni di esecuzione sono misure di protezione per l'operatore, non un confine di autorizzazione separato per questo endpoint HTTP. Se uno strumento è raggiungibile da qui tramite l'autenticazione del Gateway e i criteri degli strumenti, `/tools/invoke` non aggiunge un'ulteriore richiesta di approvazione per ogni chiamata.
- Se `exec` è raggiungibile da qui, consideralo una superficie shell con capacità di modifica. Negare `write`, `edit`, `apply_patch` o gli strumenti HTTP di scrittura sul file system non rende l'esecuzione della shell di sola lettura.
- Non condividere le credenziali bearer del Gateway con chiamanti non attendibili. Se devi separare diversi confini di attendibilità, esegui Gateway distinti, preferibilmente con utenti o host del sistema operativo separati.

Per impostazione predefinita, l'HTTP del Gateway applica inoltre un elenco di esclusione rigido, anche se i criteri della sessione consentono lo strumento:

| Strumento        | Motivo                                                                 |
| ---------------- | ---------------------------------------------------------------------- |
| `exec`           | Esecuzione diretta di comandi (superficie RCE)                         |
| `spawn`          | Creazione arbitraria di processi figlio (superficie RCE)               |
| `shell`          | Esecuzione di comandi shell (superficie RCE)                           |
| `fs_write`       | Modifica arbitraria di file sull'host                                  |
| `fs_delete`      | Eliminazione arbitraria di file sull'host                              |
| `fs_move`        | Spostamento o ridenominazione arbitrari di file sull'host              |
| `apply_patch`    | L'applicazione di patch può riscrivere file arbitrari                  |
| `sessions_spawn` | Orchestrazione delle sessioni; avviare agenti da remoto costituisce RCE |
| `sessions_send`  | Inserimento di messaggi tra sessioni                                   |
| `cron`           | Piano di controllo dell'automazione persistente                        |
| `gateway`        | Piano di controllo del Gateway; impedisce la riconfigurazione via HTTP |
| `nodes`          | L'inoltro di comandi Node può raggiungere `system.run` sugli host associati |

Anche `cron`, `gateway` e `nodes` sono riservati al proprietario: persino al di fuori di questo elenco di esclusione predefinito, i chiamanti non proprietari non possono invocarli tramite questa interfaccia.

Personalizza l'elenco generale di esclusione tramite `gateway.tools`:

```json5
{
  gateway: {
    tools: {
      // Strumenti aggiuntivi da bloccare tramite HTTP /tools/invoke
      deny: ["browser"],
      // Rimuove strumenti dall'elenco di esclusione predefinito per i chiamanti proprietari/amministratori
      allow: ["gateway"],
    },
  },
}
```

`gateway.tools.allow` è una deroga all'esposizione, non un'elevazione degli ambiti. Nelle modalità HTTP con identità, `cron`, `gateway` e `nodes` restano non disponibili ai chiamanti senza identità di proprietario/amministratore (`operator.admin`), anche quando sono elencati in `gateway.tools.allow`. L'autenticazione bearer con segreto condiviso continua a seguire la regola dell'operatore completamente attendibile descritta sopra.

Per agevolare la risoluzione del contesto da parte dei criteri di gruppo, puoi facoltativamente impostare:

- `x-openclaw-message-channel: <channel>` (esempio: `slack`, `telegram`)
- `x-openclaw-account-id: <accountId>` (quando esistono più account)
- `x-openclaw-message-to: <target>` (destinazione di consegna per i criteri dello strumento di messaggistica)
- `x-openclaw-thread-id: <threadId>` (contesto del thread per i criteri dello strumento di messaggistica)

## Risposte

| Stato | Significato                                                                                              |
| ----- | -------------------------------------------------------------------------------------------------------- |
| `200` | `{ ok: true, result }`                                                                                   |
| `400` | `{ ok: false, error: { type, message } }` (richiesta non valida o errore nell'input dello strumento)     |
| `401` | Non autorizzato                                                                                          |
| `403` | `{ ok: false, error: { type, message, requiresApproval? } }` (chiamata allo strumento bloccata dai criteri) |
| `404` | Strumento non disponibile (non trovato o non incluso nell'elenco dei consentiti)                         |
| `405` | Metodo non consentito                                                                                    |
| `408` | Tempo scaduto durante la lettura del corpo della richiesta                                               |
| `413` | Il corpo della richiesta ha superato la dimensione massima del payload                                   |
| `429` | Autenticazione soggetta a limitazione di frequenza (`Retry-After` impostato)                              |
| `500` | `{ ok: false, error: { type, message } }` (errore imprevisto durante l'esecuzione dello strumento; messaggio sanificato) |

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

## Argomenti correlati

- [Protocollo del Gateway](/it/gateway/protocol)
- [Strumenti e plugin](/it/tools)
