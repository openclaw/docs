---
read_when:
    - Configurazione dei gruppi di trasmissione
    - Debug delle risposte multi-agente in WhatsApp
sidebarTitle: Broadcast groups
status: experimental
summary: Invia un messaggio WhatsApp a più agenti
title: Gruppi di trasmissione
x-i18n:
    generated_at: "2026-04-26T11:22:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: b7b36710d9cc3eb4e2b8ba3d57031bd020aedbb6a502b400ec02a835a320d609
    source_path: channels/broadcast-groups.md
    workflow: 15
---

<Note>
**Stato:** Sperimentale. Aggiunto nella versione 2026.1.9.
</Note>

## Panoramica

I gruppi di trasmissione consentono a più agenti di elaborare e rispondere allo stesso messaggio contemporaneamente. Questo permette di creare team di agenti specializzati che lavorano insieme in un singolo gruppo WhatsApp o DM, il tutto usando un solo numero di telefono.

Ambito attuale: **solo WhatsApp** (canale web).

I gruppi di trasmissione vengono valutati dopo le allowlist del canale e le regole di attivazione del gruppo. Nei gruppi WhatsApp, questo significa che le trasmissioni avvengono quando OpenClaw normalmente risponderebbe (per esempio: in caso di menzione, a seconda delle impostazioni del gruppo).

## Casi d'uso

<AccordionGroup>
  <Accordion title="1. Team di agenti specializzati">
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

  </Accordion>
  <Accordion title="2. Supporto multilingue">
    ```
    Group: "International Support"
    Agents:
      - Agent_EN (responds in English)
      - Agent_DE (responds in German)
      - Agent_ES (responds in Spanish)
    ```
  </Accordion>
  <Accordion title="3. Flussi di lavoro di garanzia della qualità">
    ```
    Group: "Customer Support"
    Agents:
      - SupportAgent (provides answer)
      - QAAgent (reviews quality, only responds if issues found)
    ```
  </Accordion>
  <Accordion title="4. Automazione delle attività">
    ```
    Group: "Project Management"
    Agents:
      - TaskTracker (updates task database)
      - TimeLogger (logs time spent)
      - ReportGenerator (creates summaries)
    ```
  </Accordion>
</AccordionGroup>

## Configurazione

### Configurazione di base

Aggiungi una sezione `broadcast` di primo livello (accanto a `bindings`). Le chiavi sono gli ID peer di WhatsApp:

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

Controlla come gli agenti elaborano i messaggi:

<Tabs>
  <Tab title="parallel (predefinito)">
    Tutti gli agenti elaborano simultaneamente:

    ```json
    {
      "broadcast": {
        "strategy": "parallel",
        "120363403215116621@g.us": ["alfred", "baerbel"]
      }
    }
    ```

  </Tab>
  <Tab title="sequential">
    Gli agenti elaborano in ordine (uno aspetta che il precedente finisca):

    ```json
    {
      "broadcast": {
        "strategy": "sequential",
        "120363403215116621@g.us": ["alfred", "baerbel"]
      }
    }
    ```

  </Tab>
</Tabs>

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

<Steps>
  <Step title="Arriva un messaggio in entrata">
    Arriva un messaggio WhatsApp di gruppo o DM.
  </Step>
  <Step title="Controllo della trasmissione">
    Il sistema controlla se l'ID peer è in `broadcast`.
  </Step>
  <Step title="Se è nell'elenco di trasmissione">
    - Tutti gli agenti elencati elaborano il messaggio.
    - Ogni agente ha la propria chiave di sessione e un contesto isolato.
    - Gli agenti elaborano in parallelo (predefinito) o in sequenza.

  </Step>
  <Step title="Se non è nell'elenco di trasmissione">
    Si applica il routing normale (primo binding corrispondente).
  </Step>
</Steps>

<Note>
I gruppi di trasmissione non aggirano le allowlist del canale o le regole di attivazione del gruppo (menzioni/comandi/ecc.). Cambiano solo _quali agenti vengono eseguiti_ quando un messaggio è idoneo per l'elaborazione.
</Note>

### Isolamento della sessione

Ogni agente in un gruppo di trasmissione mantiene completamente separati:

- **Chiavi di sessione** (`agent:alfred:whatsapp:group:120363...` vs `agent:baerbel:whatsapp:group:120363...`)
- **Cronologia della conversazione** (l'agente non vede i messaggi degli altri agenti)
- **Workspace** (sandbox separati, se configurati)
- **Accesso agli strumenti** (diversi elenchi di autorizzazione/negazione)
- **Memoria/contesto** (`IDENTITY.md`, `SOUL.md`, ecc. separati)
- **Buffer del contesto di gruppo** (messaggi recenti del gruppo usati per il contesto) è condiviso per peer, quindi tutti gli agenti in trasmissione vedono lo stesso contesto quando vengono attivati

Questo consente a ciascun agente di avere:

- Personalità diverse
- Accesso agli strumenti diverso (ad es. sola lettura vs lettura-scrittura)
- Modelli diversi (ad es. opus vs sonnet)
- Skills diverse installate

### Esempio: sessioni isolate

Nel gruppo `120363403215116621@g.us` con gli agenti `["alfred", "baerbel"]`:

<Tabs>
  <Tab title="Contesto di Alfred">
    ```
    Session: agent:alfred:whatsapp:group:120363403215116621@g.us
    History: [user message, alfred's previous responses]
    Workspace: /Users/user/openclaw-alfred/
    Tools: read, write, exec
    ```
  </Tab>
  <Tab title="Contesto di Bärbel">
    ```
    Session: agent:baerbel:whatsapp:group:120363403215116621@g.us
    History: [user message, baerbel's previous responses]
    Workspace: /Users/user/openclaw-baerbel/
    Tools: read only
    ```
  </Tab>
</Tabs>

## Best practice

<AccordionGroup>
  <Accordion title="1. Mantieni gli agenti focalizzati">
    Progetta ogni agente con una responsabilità singola e chiara:

    ```json
    {
      "broadcast": {
        "DEV_GROUP": ["formatter", "linter", "tester"]
      }
    }
    ```

    ✅ **Buono:** ogni agente ha un solo compito. ❌ **Non buono:** un agente generico "dev-helper".

  </Accordion>
  <Accordion title="2. Usa nomi descrittivi">
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

  </Accordion>
  <Accordion title="3. Configura accessi agli strumenti differenti">
    Fornisci agli agenti solo gli strumenti di cui hanno bisogno:

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

  </Accordion>
  <Accordion title="4. Monitora le prestazioni">
    Con molti agenti, considera di:

    - usare `"strategy": "parallel"` (predefinito) per la velocità
    - limitare i gruppi di trasmissione a 5-10 agenti
    - usare modelli più veloci per gli agenti più semplici

  </Accordion>
  <Accordion title="5. Gestisci i guasti con eleganza">
    Gli agenti falliscono in modo indipendente. L'errore di un agente non blocca gli altri:

    ```
    Message → [Agent A ✓, Agent B ✗ error, Agent C ✓]
    Result: Agent A and C respond, Agent B logs error
    ```

  </Accordion>
</AccordionGroup>

## Compatibilità

### Provider

I gruppi di trasmissione attualmente funzionano con:

- ✅ WhatsApp (implementato)
- 🚧 Telegram (pianificato)
- 🚧 Discord (pianificato)
- 🚧 Slack (pianificato)

### Routing

I gruppi di trasmissione funzionano insieme al routing esistente:

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

- `GROUP_A`: risponde solo alfred (routing normale).
- `GROUP_B`: rispondono agent1 E agent2 (trasmissione).

<Note>
**Precedenza:** `broadcast` ha priorità su `bindings`.
</Note>

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="Gli agenti non rispondono">
    **Controlla:**

    1. Gli ID agente esistono in `agents.list`.
    2. Il formato dell'ID peer è corretto (ad es. `120363403215116621@g.us`).
    3. Gli agenti non sono negli elenchi di negazione.

    **Debug:**

    ```bash
    tail -f ~/.openclaw/logs/gateway.log | grep broadcast
    ```

  </Accordion>
  <Accordion title="Risponde un solo agente">
    **Causa:** l'ID peer potrebbe essere in `bindings` ma non in `broadcast`.

    **Correzione:** aggiungilo alla configurazione di broadcast oppure rimuovilo da bindings.

  </Accordion>
  <Accordion title="Problemi di prestazioni">
    Se è lento con molti agenti:

    - Riduci il numero di agenti per gruppo.
    - Usa modelli più leggeri (sonnet invece di opus).
    - Controlla il tempo di avvio del sandbox.

  </Accordion>
</AccordionGroup>

## Esempi

<AccordionGroup>
  <Accordion title="Esempio 1: team di revisione del codice">
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

    **L'utente invia:** frammento di codice.

    **Risposte:**

    - code-formatter: "Indentazione corretta e type hint aggiunti"
    - security-scanner: "⚠️ Vulnerabilità di SQL injection alla riga 12"
    - test-coverage: "La copertura è del 45%, mancano test per i casi di errore"
    - docs-checker: "Manca la docstring per la funzione `process_data`"

  </Accordion>
  <Accordion title="Esempio 2: supporto multilingue">
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
  </Accordion>
</AccordionGroup>

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

<ParamField path="strategy" type='"parallel" | "sequential"' default='"parallel"'>
  Come elaborare gli agenti. `parallel` esegue tutti gli agenti simultaneamente; `sequential` li esegue nell'ordine dell'array.
</ParamField>
<ParamField path="[peerId]" type="string[]">
  JID del gruppo WhatsApp, numero E.164 o altro ID peer. Il valore è l'array di ID agente che devono elaborare i messaggi.
</ParamField>

## Limitazioni

1. **Numero massimo di agenti:** nessun limite rigido, ma più di 10 agenti può essere lento.
2. **Contesto condiviso:** gli agenti non vedono le risposte degli altri agenti (per scelta progettuale).
3. **Ordine dei messaggi:** le risposte in parallelo possono arrivare in qualsiasi ordine.
4. **Limiti di frequenza:** tutti gli agenti contribuiscono ai limiti di frequenza di WhatsApp.

## Miglioramenti futuri

Funzionalità pianificate:

- [ ] Modalità contesto condiviso (gli agenti vedono le risposte degli altri)
- [ ] Coordinamento tra agenti (gli agenti possono segnalarsi a vicenda)
- [ ] Selezione dinamica degli agenti (scegliere gli agenti in base al contenuto del messaggio)
- [ ] Priorità degli agenti (alcuni agenti rispondono prima di altri)

## Correlati

- [Routing del canale](/it/channels/channel-routing)
- [Gruppi](/it/channels/groups)
- [Strumenti sandbox multi-agente](/it/tools/multi-agent-sandbox-tools)
- [Abbinamento](/it/channels/pairing)
- [Gestione delle sessioni](/it/concepts/session)
