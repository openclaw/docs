---
read_when:
    - Configurazione dei gruppi di broadcast
    - Debug delle risposte multi-agente in WhatsApp
status: experimental
summary: Trasmettere un messaggio WhatsApp a più agenti
title: Gruppi di broadcast
x-i18n:
    generated_at: "2026-04-05T13:42:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1d117ae65ec3b63c2bd4b3c215d96f32d7eafa0f99a9cd7378e502c15e56ca56
    source_path: channels/broadcast-groups.md
    workflow: 15
---

# Gruppi di broadcast

**Stato:** Sperimentale  
**Versione:** Aggiunto nella 2026.1.9

## Panoramica

I gruppi di broadcast consentono a più agenti di elaborare e rispondere allo stesso messaggio contemporaneamente. Questo permette di creare team di agenti specializzati che lavorano insieme in un singolo gruppo WhatsApp o DM, il tutto usando un solo numero di telefono.

Ambito attuale: **solo WhatsApp** (canale web).

I gruppi di broadcast vengono valutati dopo le allowlist del canale e le regole di attivazione del gruppo. Nei gruppi WhatsApp, questo significa che i broadcast avvengono quando OpenClaw normalmente risponderebbe (per esempio: su menzione, in base alle impostazioni del gruppo).

## Casi d'uso

### 1. Team di agenti specializzati

Distribuisci più agenti con responsabilità atomiche e mirate:

```
Gruppo: "Team di sviluppo"
Agenti:
  - CodeReviewer (esamina frammenti di codice)
  - DocumentationBot (genera documentazione)
  - SecurityAuditor (controlla le vulnerabilità)
  - TestGenerator (suggerisce casi di test)
```

Ogni agente elabora lo stesso messaggio e fornisce la propria prospettiva specializzata.

### 2. Supporto multilingue

```
Gruppo: "Supporto internazionale"
Agenti:
  - Agent_EN (risponde in inglese)
  - Agent_DE (risponde in tedesco)
  - Agent_ES (risponde in spagnolo)
```

### 3. Flussi di lavoro di assurance della qualità

```
Gruppo: "Assistenza clienti"
Agenti:
  - SupportAgent (fornisce una risposta)
  - QAAgent (verifica la qualità, risponde solo se trova problemi)
```

### 4. Automazione delle attività

```
Gruppo: "Gestione progetti"
Agenti:
  - TaskTracker (aggiorna il database delle attività)
  - TimeLogger (registra il tempo impiegato)
  - ReportGenerator (crea riepiloghi)
```

## Configurazione

### Configurazione di base

Aggiungi una sezione `broadcast` di primo livello (accanto a `bindings`). Le chiavi sono peer ID di WhatsApp:

- chat di gruppo: JID del gruppo (ad es. `120363403215116621@g.us`)
- DM: numero di telefono E.164 (ad es. `+15551234567`)

```json
{
  "broadcast": {
    "120363403215116621@g.us": ["alfred", "baerbel", "assistant3"]
  }
}
```

**Risultato:** quando OpenClaw dovrebbe rispondere in questa chat, eseguirà tutti e tre gli agenti.

### Strategia di elaborazione

Controlla il modo in cui gli agenti elaborano i messaggi:

#### Parallela (predefinita)

Tutti gli agenti elaborano simultaneamente:

```json
{
  "broadcast": {
    "strategy": "parallel",
    "120363403215116621@g.us": ["alfred", "baerbel"]
  }
}
```

#### Sequenziale

Gli agenti elaborano in ordine (uno attende che il precedente finisca):

```json
{
  "broadcast": {
    "strategy": "sequential",
    "120363403215116621@g.us": ["alfred", "baerbel"]
  }
}
```

### Esempio completo

```json
{
  "agents": {
    "list": [
      {
        "id": "code-reviewer",
        "name": "Code Reviewer",
        "workspace": "/path/to/code-reviewer",
        "sandbox": { "mode": "all" }
      },
      {
        "id": "security-auditor",
        "name": "Security Auditor",
        "workspace": "/path/to/security-auditor",
        "sandbox": { "mode": "all" }
      },
      {
        "id": "docs-generator",
        "name": "Documentation Generator",
        "workspace": "/path/to/docs-generator",
        "sandbox": { "mode": "all" }
      }
    ]
  },
  "broadcast": {
    "strategy": "parallel",
    "120363403215116621@g.us": ["code-reviewer", "security-auditor", "docs-generator"],
    "120363424282127706@g.us": ["support-en", "support-de"],
    "+15555550123": ["assistant", "logger"]
  }
}
```

## Come funziona

### Flusso dei messaggi

1. Un **messaggio in arrivo** arriva in un gruppo WhatsApp
2. **Controllo broadcast**: il sistema controlla se il peer ID è in `broadcast`
3. **Se è nell'elenco broadcast**:
   - Tutti gli agenti elencati elaborano il messaggio
   - Ogni agente ha la propria chiave di sessione e un contesto isolato
   - Gli agenti elaborano in parallelo (predefinito) o in sequenza
4. **Se non è nell'elenco broadcast**:
   - Si applica il routing normale (primo binding corrispondente)

Nota: i gruppi di broadcast non aggirano le allowlist del canale o le regole di attivazione del gruppo (menzioni/comandi/ecc.). Cambiano solo _quali agenti vengono eseguiti_ quando un messaggio è idoneo per l'elaborazione.

### Isolamento della sessione

Ogni agente in un gruppo di broadcast mantiene completamente separati:

- **Chiavi di sessione** (`agent:alfred:whatsapp:group:120363...` vs `agent:baerbel:whatsapp:group:120363...`)
- **Cronologia della conversazione** (l'agente non vede i messaggi degli altri agenti)
- **Workspace** (sandbox separati se configurati)
- **Accesso agli strumenti** (diverse allowlist/denylist)
- **Memoria/contesto** (`IDENTITY.md`, `SOUL.md`, ecc. separati)
- **Buffer del contesto del gruppo** (messaggi recenti del gruppo usati per il contesto) è condiviso per peer, quindi tutti gli agenti del broadcast vedono lo stesso contesto quando vengono attivati

Questo consente a ogni agente di avere:

- Personalità diverse
- Accesso agli strumenti diverso (ad es. sola lettura vs lettura-scrittura)
- Modelli diversi (ad es. opus vs sonnet)
- Skills diverse installate

### Esempio: sessioni isolate

Nel gruppo `120363403215116621@g.us` con agenti `["alfred", "baerbel"]`:

**Contesto di Alfred:**

```
Sessione: agent:alfred:whatsapp:group:120363403215116621@g.us
Cronologia: [messaggio utente, risposte precedenti di alfred]
Workspace: /Users/user/openclaw-alfred/
Strumenti: read, write, exec
```

**Contesto di Bärbel:**

```
Sessione: agent:baerbel:whatsapp:group:120363403215116621@g.us
Cronologia: [messaggio utente, risposte precedenti di baerbel]
Workspace: /Users/user/openclaw-baerbel/
Strumenti: sola lettura
```

## Best practice

### 1. Mantieni gli agenti focalizzati

Progetta ogni agente con una responsabilità unica e chiara:

```json
{
  "broadcast": {
    "DEV_GROUP": ["formatter", "linter", "tester"]
  }
}
```

✅ **Buono:** ogni agente ha un solo compito  
❌ **Cattivo:** un agente generico "dev-helper"

### 2. Usa nomi descrittivi

Rendi chiaro cosa fa ogni agente:

```json
{
  "agents": {
    "security-scanner": { "name": "Security Scanner" },
    "code-formatter": { "name": "Code Formatter" },
    "test-generator": { "name": "Test Generator" }
  }
}
```

### 3. Configura accessi agli strumenti diversi

Concedi agli agenti solo gli strumenti di cui hanno bisogno:

```json
{
  "agents": {
    "reviewer": {
      "tools": { "allow": ["read", "exec"] } // Sola lettura
    },
    "fixer": {
      "tools": { "allow": ["read", "write", "edit", "exec"] } // Lettura-scrittura
    }
  }
}
```

### 4. Monitora le prestazioni

Con molti agenti, considera di:

- Usare `"strategy": "parallel"` (predefinito) per la velocità
- Limitare i gruppi di broadcast a 5-10 agenti
- Usare modelli più rapidi per agenti più semplici

### 5. Gestisci i guasti con eleganza

Gli agenti falliscono in modo indipendente. L'errore di un agente non blocca gli altri:

```
Messaggio → [Agente A ✓, Agente B ✗ errore, Agente C ✓]
Risultato: gli agenti A e C rispondono, l'agente B registra un errore
```

## Compatibilità

### Provider

I gruppi di broadcast attualmente funzionano con:

- ✅ WhatsApp (implementato)
- 🚧 Telegram (pianificato)
- 🚧 Discord (pianificato)
- 🚧 Slack (pianificato)

### Routing

I gruppi di broadcast funzionano insieme al routing esistente:

```json
{
  "bindings": [
    {
      "match": { "channel": "whatsapp", "peer": { "kind": "group", "id": "GROUP_A" } },
      "agentId": "alfred"
    }
  ],
  "broadcast": {
    "GROUP_B": ["agent1", "agent2"]
  }
}
```

- `GROUP_A`: risponde solo alfred (routing normale)
- `GROUP_B`: rispondono agent1 E agent2 (broadcast)

**Precedenza:** `broadcast` ha priorità rispetto a `bindings`.

## Risoluzione dei problemi

### Gli agenti non rispondono

**Controlla:**

1. Gli ID degli agenti esistono in `agents.list`
2. Il formato del peer ID è corretto (ad es. `120363403215116621@g.us`)
3. Gli agenti non sono in denylist

**Debug:**

```bash
tail -f ~/.openclaw/logs/gateway.log | grep broadcast
```

### Risponde un solo agente

**Causa:** il peer ID potrebbe essere in `bindings` ma non in `broadcast`.

**Correzione:** aggiungilo alla configurazione broadcast o rimuovilo da bindings.

### Problemi di prestazioni

**Se è lento con molti agenti:**

- Riduci il numero di agenti per gruppo
- Usa modelli più leggeri (sonnet invece di opus)
- Controlla il tempo di avvio del sandbox

## Esempi

### Esempio 1: team di code review

```json
{
  "broadcast": {
    "strategy": "parallel",
    "120363403215116621@g.us": [
      "code-formatter",
      "security-scanner",
      "test-coverage",
      "docs-checker"
    ]
  },
  "agents": {
    "list": [
      {
        "id": "code-formatter",
        "workspace": "~/agents/formatter",
        "tools": { "allow": ["read", "write"] }
      },
      {
        "id": "security-scanner",
        "workspace": "~/agents/security",
        "tools": { "allow": ["read", "exec"] }
      },
      {
        "id": "test-coverage",
        "workspace": "~/agents/testing",
        "tools": { "allow": ["read", "exec"] }
      },
      { "id": "docs-checker", "workspace": "~/agents/docs", "tools": { "allow": ["read"] } }
    ]
  }
}
```

**L'utente invia:** frammento di codice  
**Risposte:**

- code-formatter: "Corretta l'indentazione e aggiunti i type hint"
- security-scanner: "⚠️ Vulnerabilità SQL injection alla riga 12"
- test-coverage: "La copertura è del 45%, mancano test per i casi di errore"
- docs-checker: "Manca il docstring per la funzione `process_data`"

### Esempio 2: supporto multilingue

```json
{
  "broadcast": {
    "strategy": "sequential",
    "+15555550123": ["detect-language", "translator-en", "translator-de"]
  },
  "agents": {
    "list": [
      { "id": "detect-language", "workspace": "~/agents/lang-detect" },
      { "id": "translator-en", "workspace": "~/agents/translate-en" },
      { "id": "translator-de", "workspace": "~/agents/translate-de" }
    ]
  }
}
```

## Riferimento API

### Schema di configurazione

```typescript
interface OpenClawConfig {
  broadcast?: {
    strategy?: "parallel" | "sequential";
    [peerId: string]: string[];
  };
}
```

### Campi

- `strategy` (opzionale): come elaborare gli agenti
  - `"parallel"` (predefinito): tutti gli agenti elaborano simultaneamente
  - `"sequential"`: gli agenti elaborano nell'ordine dell'array
- `[peerId]`: JID del gruppo WhatsApp, numero E.164 o altro peer ID
  - Valore: array di ID agente che devono elaborare i messaggi

## Limitazioni

1. **Numero massimo di agenti:** nessun limite rigido, ma oltre 10 agenti potrebbe essere lento
2. **Contesto condiviso:** gli agenti non vedono le risposte reciproche (per scelta progettuale)
3. **Ordine dei messaggi:** le risposte parallele possono arrivare in qualsiasi ordine
4. **Rate limit:** tutti gli agenti contribuiscono ai rate limit di WhatsApp

## Miglioramenti futuri

Funzionalità pianificate:

- [ ] Modalità contesto condiviso (gli agenti vedono le risposte reciproche)
- [ ] Coordinamento tra agenti (gli agenti possono segnalarsi a vicenda)
- [ ] Selezione dinamica degli agenti (scegliere gli agenti in base al contenuto del messaggio)
- [ ] Priorità degli agenti (alcuni agenti rispondono prima degli altri)

## Vedi anche

- [Configurazione multi-agente](/tools/multi-agent-sandbox-tools)
- [Configurazione del routing](/channels/channel-routing)
- [Gestione delle sessioni](/concepts/session)
