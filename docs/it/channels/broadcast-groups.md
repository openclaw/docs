---
read_when:
    - Configurazione dei gruppi di broadcast
    - Risoluzione dei problemi delle risposte multi-agente in WhatsApp
sidebarTitle: Broadcast groups
status: experimental
summary: Trasmettere un messaggio WhatsApp a più agenti
title: Gruppi di broadcast
x-i18n:
    generated_at: "2026-07-01T08:07:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 97e8c2ade5d12a437864e6aca0d475e586289f71155188afed216881ebf89f88
    source_path: channels/broadcast-groups.md
    workflow: 16
---

<Note>
**Stato:** Sperimentale. Aggiunto in 2026.1.9.
</Note>

## Panoramica

I gruppi di broadcast consentono a più agenti di elaborare e rispondere allo stesso messaggio simultaneamente. Questo permette di creare team di agenti specializzati che lavorano insieme in un singolo gruppo WhatsApp o DM — tutti usando un solo numero di telefono.

Ambito attuale: **solo WhatsApp** (canale web).

I gruppi di broadcast vengono valutati dopo gli elenchi di consentiti del canale e le regole di attivazione dei gruppi. Nei gruppi WhatsApp, questo significa che i broadcast avvengono quando OpenClaw risponderebbe normalmente (per esempio: su menzione, a seconda delle impostazioni del gruppo).

La lane QA live di WhatsApp include `whatsapp-broadcast-group-fanout`, che verifica che un singolo messaggio di gruppo con menzione possa produrre risposte visibili distinte da due agenti configurati.

## Casi d'uso

<AccordionGroup>
  <Accordion title="1. Specialized agent teams">
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
  <Accordion title="2. Multi-language support">
    ```
    Group: "International Support"
    Agents:
      - Agent_EN (responds in English)
      - Agent_DE (responds in German)
      - Agent_ES (responds in Spanish)
    ```
  </Accordion>
  <Accordion title="3. Quality assurance workflows">
    ```
    Group: "Customer Support"
    Agents:
      - SupportAgent (provides answer)
      - QAAgent (reviews quality, only responds if issues found)
    ```
  </Accordion>
  <Accordion title="4. Task automation">
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

Aggiungi una sezione `broadcast` di primo livello (accanto a `bindings`). Le chiavi sono ID peer di WhatsApp:

- chat di gruppo: JID del gruppo (ad es. `120363403215116621@g.us`)
- DM: numero di telefono E.164 (ad es. `+15551234567`)

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

<Tabs>
  <Tab title="parallel (default)">
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
    Gli agenti elaborano in ordine (uno attende che il precedente finisca):

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
  <Step title="Incoming message arrives">
    Arriva un messaggio di gruppo WhatsApp o un DM.
  </Step>
  <Step title="Route and admission">
    OpenClaw applica gli elenchi di consentiti del canale, le regole di attivazione dei gruppi e la proprietà dei binding ACP configurati.
  </Step>
  <Step title="Broadcast check">
    Se nessun binding ACP configurato possiede la route, OpenClaw controlla se l'ID peer è in `broadcast`.
  </Step>
  <Step title="If broadcast applies">
    - Tutti gli agenti elencati elaborano il messaggio.
    - Ogni agente ha la propria chiave di sessione e un contesto isolato.
    - Gli agenti elaborano in parallelo (impostazione predefinita) o in sequenza.

  </Step>
  <Step title="If broadcast does not apply">
    OpenClaw invia la route ordinaria o la route della sessione ACP configurata selezionata durante il routing.
  </Step>
</Steps>

<Note>
I gruppi di broadcast non bypassano gli elenchi di consentiti del canale o le regole di attivazione dei gruppi (menzioni/comandi/ecc.). Cambiano solo _quali agenti vengono eseguiti_ quando un messaggio è idoneo all'elaborazione.
</Note>

### Isolamento della sessione

Ogni agente in un gruppo di broadcast mantiene completamente separati:

- **Chiavi di sessione** (`agent:alfred:whatsapp:group:120363...` vs `agent:baerbel:whatsapp:group:120363...`)
- **Cronologia della conversazione** (l'agente non vede i messaggi degli altri agenti)
- **Workspace** (sandbox separati, se configurati)
- **Accesso agli strumenti** (elenchi di consentiti/negati diversi)
- **Memoria/contesto** (IDENTITY.md, SOUL.md, ecc. separati)
- **Buffer del contesto di gruppo** (messaggi recenti del gruppo usati per il contesto) è condiviso per peer, quindi tutti gli agenti di broadcast vedono lo stesso contesto quando vengono attivati

Questo consente a ogni agente di avere:

- Personalità diverse
- Accesso agli strumenti diverso (ad es. sola lettura vs. lettura-scrittura)
- Modelli diversi (ad es. opus vs. sonnet)
- Skills diverse installate

### Esempio: sessioni isolate

Nel gruppo `120363403215116621@g.us` con gli agenti `["alfred", "baerbel"]`:

<Tabs>
  <Tab title="Alfred's context">
    ```
    Session: agent:alfred:whatsapp:group:120363403215116621@g.us
    History: [user message, alfred's previous responses]
    Workspace: /Users/user/openclaw-alfred/
    Tools: read, write, exec
    ```
  </Tab>
  <Tab title="Bärbel's context">
    ```
    Session: agent:baerbel:whatsapp:group:120363403215116621@g.us
    History: [user message, baerbel's previous responses]
    Workspace: /Users/user/openclaw-baerbel/
    Tools: read only
    ```
  </Tab>
</Tabs>

## Buone pratiche

<AccordionGroup>
  <Accordion title="1. Keep agents focused">
    Progetta ogni agente con una responsabilità singola e chiara:

    ```json
    {
      "broadcast": {
        "DEV_GROUP": ["formatter", "linter", "tester"]
      }
    }
    ```

    ✅ **Bene:** Ogni agente ha un solo compito. ❌ **Male:** Un agente generico "dev-helper".

  </Accordion>
  <Accordion title="2. Use descriptive names">
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
  <Accordion title="3. Configure different tool access">
    Concedi agli agenti solo gli strumenti di cui hanno bisogno:

    ```json
    {
      "agents": {
        "reviewer": {
          "tools": { "allow": ["read", "exec"] }
        },
        "fixer": {
          "tools": { "allow": ["read", "write", "edit", "exec"] }
        }
      }
    }
    ```

    `reviewer` è in sola lettura. `fixer` può leggere e scrivere.

  </Accordion>
  <Accordion title="4. Monitor performance">
    Con molti agenti, considera:

    - Usare `"strategy": "parallel"` (predefinita) per la velocità
    - Limitare i gruppi di broadcast a 5-10 agenti
    - Usare modelli più veloci per agenti più semplici

  </Accordion>
  <Accordion title="5. Handle failures gracefully">
    Gli agenti falliscono in modo indipendente. L'errore di un agente non blocca gli altri:

    ```
    Message → [Agent A ✓, Agent B ✗ error, Agent C ✓]
    Result: Agent A and C respond, Agent B logs error
    ```

  </Accordion>
</AccordionGroup>

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

- `GROUP_A`: Risponde solo alfred (routing normale).
- `GROUP_B`: agent1 E agent2 rispondono (broadcast).

<Note>
**Precedenza:** `broadcast` ha priorità sui binding di route ordinari. I binding ACP configurati (`bindings[].type="acp"`) sono esclusivi: quando uno corrisponde, OpenClaw invia alla sessione ACP configurata invece che al broadcast fan-out.
</Note>

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="Agents not responding">
    **Controlla:**

    1. Gli ID agente esistono in `agents.list`.
    2. Il formato dell'ID peer è corretto (ad es. `120363403215116621@g.us`).
    3. Gli agenti non sono negli elenchi di negati.

    **Debug:**

    ```bash
    tail -f ~/.openclaw/logs/gateway.log | grep broadcast
    ```

  </Accordion>
  <Accordion title="Only one agent responding">
    **Causa:** L'ID peer potrebbe essere nei binding di route ordinari ma non in `broadcast`, oppure potrebbe corrispondere a un binding ACP configurato esclusivo.

    **Correzione:** Aggiungi i peer associati a route ordinarie alla configurazione di broadcast, oppure rimuovi/modifica il binding ACP configurato se si desidera il broadcast fan-out.

  </Accordion>
  <Accordion title="Performance issues">
    Se è lento con molti agenti:

    - Riduci il numero di agenti per gruppo.
    - Usa modelli più leggeri (sonnet invece di opus).
    - Controlla il tempo di avvio del sandbox.

  </Accordion>
</AccordionGroup>

## Esempi

<AccordionGroup>
  <Accordion title="Example 1: Code review team">
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

    **L'utente invia:** Frammento di codice.

    **Risposte:**

    - code-formatter: "Fixed indentation and added type hints"
    - security-scanner: "⚠️ SQL injection vulnerability in line 12"
    - test-coverage: "Coverage is 45%, missing tests for error cases"
    - docs-checker: "Missing docstring for function `process_data`"

  </Accordion>
  <Accordion title="Example 2: Multi-language support">
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
  JID del gruppo WhatsApp, numero E.164 o altro ID peer. Il valore è l'array degli ID degli agenti che devono elaborare i messaggi.
</ParamField>

## Limitazioni

1. **Numero massimo di agenti:** Nessun limite rigido, ma 10 o più agenti possono essere lenti.
2. **Contesto condiviso:** Gli agenti non vedono le risposte degli altri agenti (per progettazione).
3. **Ordinamento dei messaggi:** Le risposte parallele possono arrivare in qualsiasi ordine.
4. **Limiti di frequenza:** Tutti gli agenti contano ai fini dei limiti di frequenza di WhatsApp.

## Miglioramenti futuri

Funzionalità pianificate:

- [ ] Modalità contesto condiviso (gli agenti vedono le risposte degli altri agenti)
- [ ] Coordinamento degli agenti (gli agenti possono segnalarsi a vicenda)
- [ ] Selezione dinamica degli agenti (scegli gli agenti in base al contenuto del messaggio)
- [ ] Priorità degli agenti (alcuni agenti rispondono prima di altri)

## Correlati

- [Routing dei canali](/it/channels/channel-routing)
- [Gruppi](/it/channels/groups)
- [Strumenti sandbox multi-agente](/it/tools/multi-agent-sandbox-tools)
- [Abbinamento](/it/channels/pairing)
- [Gestione delle sessioni](/it/concepts/session)
