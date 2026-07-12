---
read_when:
    - Connessione di OpenClaw a un'area di lavoro ClickClack
    - Test delle identità dei bot ClickClack
summary: Configurazione del canale tramite token del bot ClickClack e sintassi della destinazione
title: ClickClack
x-i18n:
    generated_at: "2026-07-12T06:47:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a1fee023fd87a7b00333c18a24edfb028b231540724ba6092cf7d2b663643641
    source_path: channels/clickclack.md
    workflow: 16
---

ClickClack connette OpenClaw a uno spazio di lavoro ClickClack self-hosted tramite token bot ClickClack di prima classe.

Usa questa integrazione quando vuoi che un agente OpenClaw appaia come utente bot ClickClack. ClickClack supporta bot di servizio indipendenti e bot di proprietà degli utenti; i bot di proprietà degli utenti mantengono un `owner_user_id` e ricevono solo gli ambiti del token concessi.

## Configurazione rapida

Crea un token bot sul server ClickClack:

```bash
clickclack admin bot create \
  --workspace <workspace_id> \
  --name "OpenClaw" \
  --handle openclaw \
  --scopes bot:write \
  --plain
```

Per un bot di proprietà di un utente, aggiungi `--owner <user_id>`.

Configura OpenClaw:

```json5
{
  channels: {
    clickclack: {
      enabled: true,
      baseUrl: "https://clickclack.example.com",
      token: { source: "env", provider: "default", id: "CLICKCLACK_BOT_TOKEN" },
      workspace: "default",
      defaultTo: "channel:general",
    },
  },
}
```

Quindi esegui:

```bash
export CLICKCLACK_BOT_TOKEN="ccb_..."
openclaw gateway
```

Un account è considerato configurato solo quando `baseUrl`, `token` e `workspace` sono tutti impostati. `workspace` accetta un ID dello spazio di lavoro (`wsp_...`), uno slug o un nome; all'avvio, il Gateway lo risolve nell'ID.

### Chiavi di configurazione dell'account

| Chiave                  | Valore predefinito     | Note                                                                                                            |
| ----------------------- | ---------------------- | --------------------------------------------------------------------------------------------------------------- |
| `baseUrl`               | nessuno (obbligatorio) | URL del server ClickClack.                                                                                      |
| `token`                 | nessuno (obbligatorio) | Stringa in chiaro o riferimento a un segreto (`source: "env" \| "file" \| "exec"`).                             |
| `workspace`             | nessuno (obbligatorio) | ID, slug o nome dello spazio di lavoro.                                                                         |
| `replyMode`             | `"agent"`              | `"agent"` esegue l'intera pipeline dell'agente; `"model"` invia brevi completamenti diretti del modello.        |
| `defaultTo`             | `"channel:general"`    | Destinazione usata quando un percorso in uscita non specifica alcuna destinazione.                              |
| `allowFrom`             | `["*"]`                | Elenco consentito di ID utente per messaggi diretti e messaggi di canale in entrata.                            |
| `botUserId`             | rilevato automaticamente | Risolto all'avvio dall'identità del token bot.                                                                |
| `agentId`               | predefinito della route | Associa i messaggi in entrata di questo account a un solo agente.                                              |
| `toolsAllow`            | nessuno                | Elenco consentito di strumenti per le risposte dell'agente provenienti da questo account.                       |
| `model`, `systemPrompt` | nessuno                | Usati dai completamenti con `replyMode: "model"`.                                                               |
| `reconnectMs`           | `1500`                 | Ritardo di riconnessione in tempo reale (da 100 a 60000).                                                       |

Se `plugins.allow` è un elenco restrittivo non vuoto, selezionare esplicitamente
ClickClack durante la configurazione del canale o eseguire `openclaw plugins enable clickclack`
aggiunge `clickclack` a tale elenco. L'installazione durante l'onboarding usa lo stesso
comportamento di selezione esplicita. Questi percorsi non sostituiscono `plugins.deny` né
un'impostazione globale `plugins.enabled: false`. L'esecuzione diretta di
`openclaw plugins install @openclaw/clickclack` segue i normali criteri di
installazione dei Plugin e registra inoltre ClickClack in un elenco consentito esistente.

## Bot multipli

Ogni account apre la propria connessione ClickClack in tempo reale e usa il proprio token bot.

```json5
{
  channels: {
    clickclack: {
      enabled: true,
      baseUrl: "https://clickclack.example.com",
      defaultAccount: "service",
      accounts: {
        service: {
          token: { source: "env", provider: "default", id: "CLICKCLACK_SERVICE_BOT_TOKEN" },
          workspace: "default",
          defaultTo: "channel:general",
          agentId: "service-bot",
        },
        support: {
          token: { source: "env", provider: "default", id: "CLICKCLACK_SUPPORT_BOT_TOKEN" },
          workspace: "default",
          defaultTo: "dm:usr_...",
          agentId: "support-bot",
        },
      },
    },
  },
}
```

## Modalità di risposta

- `replyMode: "agent"` (predefinita) inoltra i messaggi in entrata attraverso la normale pipeline dell'agente, inclusi la registrazione della sessione e i criteri degli strumenti.
- `replyMode: "model"` ignora la pipeline dell'agente e usa `llm.complete` del runtime del Plugin per brevi risposte dirette del bot, eventualmente definite da `model` e `systemPrompt`.

La modalità modello esegue i completamenti usando l'ID agente risolto del bot, il che richiede
l'indicatore di attendibilità esplicito `plugins.entries.clickclack.llm.allowAgentIdOverride: true`:

```json5
{
  plugins: {
    entries: {
      clickclack: {
        llm: {
          allowAgentIdOverride: true,
        },
      },
    },
  },
}
```

Mantieni disattivato l'indicatore di attendibilità se usi solo la modalità di risposta
predefinita `agent`; in quel caso non è necessario.

Usa la modalità `agent` per le prove di correlazione tra servizi. Per un ID messaggio
ClickClack autorevole nella sua forma canonica `msg_<ulid>`, il canale deriva
l'ID di esecuzione OpenClaw deterministico `clickclack:<message-id>`. Ogni chiamata al modello è
quindi visibile nella diagnostica come `clickclack:<message-id>:model:<n>`; quando quel
turno usa ClawRouter, lo stesso ID della chiamata al modello viene inviato come `X-Request-ID`.
La modalità `model` bypassa la normale diagnostica delle esecuzioni e delle sessioni dell'agente e pertanto
non è adatta a questo percorso di prova.

Quando un evento in tempo reale contiene un `payload.correlation_id` convalidato, il
canale lo trasmette come `X-Correlation-ID` nel recupero autorevole del messaggio e
nelle conseguenti richieste di risposta ClickClack. I valori usano l'insieme sicuro di
128 caratteri di ClickClack (`A-Z`, `a-z`, `0-9`, `.`, `_`, `:` e `-`); i valori non validi
vengono omessi. Queste correlazioni contengono solo identificatori, mai corpi dei messaggi,
prompt, completamenti, credenziali o output degli strumenti.

## Righe delle attività dell'agente

Per impostazione predefinita, un canale ClickClack non mostra nulla durante l'esecuzione di un turno dell'agente; viene pubblicata solo la risposta finale. Imposta `agentActivity: true` su un account per pubblicare righe di messaggio persistenti `agent_commentary` e `agent_tool` mentre il turno è in corso:

```json5
{
  channels: {
    clickclack: {
      enabled: true,
      token: { source: "env", provider: "default", id: "CLICKCLACK_BOT_TOKEN" },
      workspace: "default",
      agentActivity: true,
    },
  },
}
```

Requisiti e comportamento:

- **Disattivata per impostazione predefinita.** Le configurazioni standard e i server ClickClack meno recenti non subiscono modifiche.
- **Richiede l'ambito del token `agent_activity:write`.** Questo ambito è separato da `bot:write` e non viene ereditato da quest'ultimo; crea il token bot con `--scopes bot:write,agent_activity:write` (oppure concedi l'ambito a un token esistente) prima di abilitare l'opzione.
- **Degrado controllato secondo il principio del massimo sforzo.** Se il token non dispone di `agent_activity:write` o il server rifiuta la scrittura delle attività, gli errori vengono registrati e la risposta finale viene comunque consegnata normalmente; non appare alcuna riga di attività.
- Le righe vengono raggruppate per turno (`turn_id`) e accorpate in modo che ogni passaggio logico corrisponda a una riga; le righe degli strumenti usano la stessa formattazione dell'avanzamento di Discord/Slack/Telegram (nome dello strumento più dettagli del comando).
- **Metadati di attribuzione.** I messaggi pubblicati dall'agente (righe di attività e risposta finale) includono i campi `author_model` e `author_thinking`, risolti dal modello effettivamente usato per il turno (anche dopo un fallback). I server che non definiscono queste colonne ignorano i campi JSON sconosciuti; quelli che li rendono persistenti possono determinare, per ciascun messaggio, «quale modello ha pronunciato questa frase e con quale livello di ragionamento».

## Destinazioni

- `channel:<name-or-id>` invia a un canale dello spazio di lavoro. Le destinazioni senza prefisso usano per impostazione predefinita `channel:`.
- `dm:<user_id>` crea o riutilizza una conversazione diretta con tale utente.
- `thread:<message_id>` risponde nel thread che ha origine da quel messaggio.

Le destinazioni esplicite in uscita possono anche includere il prefisso del provider `clickclack:` o `cc:`.

Esempi:

```bash
openclaw message send --channel clickclack --target channel:general --message "hello"
openclaw message send --channel clickclack --target dm:usr_123 --message "hello"
openclaw message send --channel clickclack --target thread:msg_123 --message "following up"
```

## Autorizzazioni

Gli ambiti dei token ClickClack vengono applicati dall'API ClickClack.

- `bot:read`: legge i dati di spazio di lavoro, canale, messaggio, thread, messaggi diretti, tempo reale e profilo.
- `bot:write`: `bot:read` più messaggi nei canali, risposte nei thread, messaggi diretti e caricamenti.
- `bot:admin`: `bot:write` più creazione dei canali.
- `agent_activity:write`: righe persistenti delle attività dell'agente (`agent_commentary` / `agent_tool`). Non viene ereditato da `bot:write` o `bot:admin`; è necessario solo quando è impostato `agentActivity: true`.

OpenClaw necessita solo di `bot:write` per la normale chat dell'agente. Aggiungi `agent_activity:write` quando abiliti le [righe delle attività dell'agente](#agent-activity-rows).

## Risoluzione dei problemi

- `ClickClack is not configured for account "<id>"`: imposta `baseUrl`, `token` (ad esempio tramite `CLICKCLACK_BOT_TOKEN`) e `workspace` per tale account.
- `ClickClack workspace not found: <value>`: imposta `workspace` sull'ID, sullo slug o sul nome dello spazio di lavoro restituito da ClickClack.
- Nessuna risposta in entrata: verifica che il token disponga dell'accesso in lettura in tempo reale e tieni presente che il bot ignora i propri messaggi e quelli provenienti da altri bot.
- L'invio ai canali non riesce: verifica che il bot sia membro dello spazio di lavoro e disponga di `bot:write`.
