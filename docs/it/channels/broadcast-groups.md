---
read_when:
    - Configurazione dei gruppi di diffusione
    - Debug delle risposte multi-agente in WhatsApp
status: experimental
summary: Invia un messaggio WhatsApp a più agenti
title: Gruppi di diffusione
x-i18n:
    generated_at: "2026-04-24T08:29:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: d1f3991348570170855158e82089fa073ca62b98855f443d4a227829d7c945ee
    source_path: channels/broadcast-groups.md
    workflow: 15
---

**Stato:** Sperimentale  
**Versione:** Aggiunto nella versione 2026.1.9

## Panoramica

I gruppi di diffusione consentono a più agenti di elaborare e rispondere allo stesso messaggio simultaneamente. Questo ti permette di creare team di agenti specializzati che lavorano insieme in un singolo gruppo WhatsApp o DM, il tutto usando un solo numero di telefono.

Ambito attuale: **solo WhatsApp** (canale web).

I gruppi di diffusione vengono valutati dopo le allowlist del canale e le regole di attivazione del gruppo. Nei gruppi WhatsApp, questo significa che la diffusione avviene quando OpenClaw normalmente risponderebbe (per esempio: a una menzione, a seconda delle impostazioni del tuo gruppo).

## Casi d'uso

### 1. Team di agenti specializzati

Distribuisci più agenti con responsabilità atomiche e mirate:

```
Group: "Development Team"
Agents:
  - CodeReviewer (reviews code snippets)
  - DocumentationBot (generates docs)
  - SecurityAuditor (checks for vulnerabilities)
  - TestGenerator (suggests test cases)
```

Ogni agente elabora lo stesso messaggio e fornisce la propria prospettiva specializzata.

### 2. Supporto multilingue

```
Group: "International Support"
Agents:
  - Agent_EN (responds in English)
  - Agent_DE (responds in German)
  - Agent_ES (responds in Spanish)
```

### 3. Flussi di lavoro di garanzia della qualità

```
Group: "Customer Support"
Agents:
  - SupportAgent (provides answer)
  - QAAgent (reviews quality, only responds if issues found)
```

### 4. Automazione delle attività

```
Group: "Project Management"
Agents:
  - TaskTracker (updates task database)
  - TimeLogger (logs time spent)
  - ReportGenerator (creates summaries)
```

## Configurazione

### Configurazione di base

Aggiungi una sezione `broadcast` di primo livello (accanto a `bindings`). Le chiavi sono gli ID peer di WhatsApp:

- chat di gruppo: JID del gruppo (ad esempio `120363403215116621@g.us`)
- DM: numero di telefono E.164 (ad esempio `+15551234567`)

```json
{
  "broadcast": {
    "120363403215116621@g.us": ["alfred", "baerbel", "assistant3"]
  }
}
```

**Risultato:** Quando OpenClaw risponderebbe in questa chat, eseguirà tutti e tre gli agenti.

### Strategia di elaborazione

Controlla come gli agenti elaborano i messaggi:

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

Gli agenti elaborano in ordine (uno attende che il precedente abbia finito):

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

### Flusso del messaggio

1. **Il messaggio in arrivo** arriva in un gruppo WhatsApp
2. **Controllo broadcast**: il sistema verifica se l'ID peer è in `broadcast`
3. **Se è nell'elenco broadcast**:
   - Tutti gli agenti elencati elaborano il messaggio
   - Ogni agente ha la propria chiave di sessione e un contesto isolato
   - Gli agenti elaborano in parallelo (predefinito) o in sequenza
4. **Se non è nell'elenco broadcast**:
   - Si applica l'instradamento normale (primo binding corrispondente)

Nota: i gruppi di diffusione non aggirano le allowlist del canale o le regole di attivazione del gruppo (menzioni/comandi/ecc.). Cambiano solo _quali agenti vengono eseguiti_ quando un messaggio è idoneo per l'elaborazione.

### Isolamento della sessione

Ogni agente in un gruppo di diffusione mantiene separatamente:

- **Chiavi di sessione** (`agent:alfred:whatsapp:group:120363...` vs `agent:baerbel:whatsapp:group:120363...`)
- **Cronologia della conversazione** (un agente non vede i messaggi degli altri agenti)
- **Workspace** (sandbox separate, se configurate)
- **Accesso agli strumenti** (diverse allowlist/denylist)
- **Memoria/contesto** (`IDENTITY.md`, `SOUL.md`, ecc. separati)
- **Buffer del contesto del gruppo** (messaggi recenti del gruppo usati per il contesto), che è condiviso per peer, quindi tutti gli agenti broadcast vedono lo stesso contesto quando vengono attivati

Questo consente a ogni agente di avere:

- Personalità diverse
- Accessi agli strumenti diversi (ad esempio, sola lettura vs lettura-scrittura)
- Modelli diversi (ad esempio, opus vs sonnet)
- Skills diverse installate

### Esempio: sessioni isolate

Nel gruppo `120363403215116621@g.us` con agenti `["alfred", "baerbel"]`:

**Contesto di Alfred:**

```
Session: agent:alfred:whatsapp:group:120363403215116621@g.us
History: [user message, alfred's previous responses]
Workspace: /Users/user/openclaw-alfred/
Tools: read, write, exec
```

**Contesto di Bärbel:**

```
Session: agent:baerbel:whatsapp:group:120363403215116621@g.us
History: [user message, baerbel's previous responses]
Workspace: /Users/user/openclaw-baerbel/
Tools: read only
```

## Buone pratiche

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
❌ **Cattivo:** un unico agente generico "dev-helper"

### 2. Usa nomi descrittivi

Rendi chiaro cosa fa ciascun agente:

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

Dai agli agenti solo gli strumenti di cui hanno bisogno:

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
- Limitare i gruppi di diffusione a 5-10 agenti
- Usare modelli più rapidi per gli agenti più semplici

### 5. Gestisci i guasti in modo elegante

Gli agenti falliscono in modo indipendente. L'errore di un agente non blocca gli altri:

```
Message → [Agent A ✓, Agent B ✗ error, Agent C ✓]
Result: Agent A and C respond, Agent B logs error
```

## Compatibilità

### Provider

I gruppi di diffusione attualmente funzionano con:

- ✅ WhatsApp (implementato)
- 🚧 Telegram (pianificato)
- 🚧 Discord (pianificato)
- 🚧 Slack (pianificato)

### Instradamento

I gruppi di diffusione funzionano insieme all'instradamento esistente:

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

- `GROUP_A`: risponde solo alfred (instradamento normale)
- `GROUP_B`: rispondono agent1 E agent2 (diffusione)

**Precedenza:** `broadcast` ha priorità rispetto a `bindings`.

## Risoluzione dei problemi

### Gli agenti non rispondono

**Controlla:**

1. Gli ID degli agenti esistono in `agents.list`
2. Il formato dell'ID peer è corretto (ad esempio `120363403215116621@g.us`)
3. Gli agenti non sono nelle denylist

**Debug:**

```bash
tail -f ~/.openclaw/logs/gateway.log | grep broadcast
```

### Risponde un solo agente

**Causa:** l'ID peer potrebbe essere in `bindings` ma non in `broadcast`.

**Soluzione:** aggiungilo alla configurazione broadcast oppure rimuovilo da bindings.

### Problemi di prestazioni

**Se è lento con molti agenti:**

- Riduci il numero di agenti per gruppo
- Usa modelli più leggeri (sonnet invece di opus)
- Controlla il tempo di avvio della sandbox

## Esempi

### Esempio 1: team di revisione del codice

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

**L'utente invia:** snippet di codice  
**Risposte:**

- code-formatter: "Corretta l'indentazione e aggiunti i type hint"
- security-scanner: "⚠️ Vulnerabilità di SQL injection alla riga 12"
- test-coverage: "La copertura è del 45%, mancano test per i casi di errore"
- docs-checker: "Manca la docstring per la funzione `process_data`"

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
- `[peerId]`: JID del gruppo WhatsApp, numero E.164 o altro ID peer
  - Valore: array di ID agente che devono elaborare i messaggi

## Limitazioni

1. **Numero massimo di agenti:** nessun limite rigido, ma con oltre 10 agenti può risultare lento
2. **Contesto condiviso:** gli agenti non vedono le risposte degli altri (per progettazione)
3. **Ordine dei messaggi:** le risposte parallele possono arrivare in qualsiasi ordine
4. **Limiti di frequenza:** tutti gli agenti contribuiscono ai limiti di frequenza di WhatsApp

## Miglioramenti futuri

Funzionalità pianificate:

- [ ] Modalità di contesto condiviso (gli agenti vedono le risposte degli altri)
- [ ] Coordinamento tra agenti (gli agenti possono segnalarsi tra loro)
- [ ] Selezione dinamica degli agenti (scelta degli agenti in base al contenuto del messaggio)
- [ ] Priorità degli agenti (alcuni agenti rispondono prima di altri)

## Correlati

- [Gruppi](/it/channels/groups)
- [Instradamento del canale](/it/channels/channel-routing)
- [Associazione](/it/channels/pairing)
- [Strumenti sandbox multi-agente](/it/tools/multi-agent-sandbox-tools)
- [Gestione della sessione](/it/concepts/session)
