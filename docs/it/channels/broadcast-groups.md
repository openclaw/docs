---
read_when:
    - Configurazione dei gruppi di trasmissione
    - Debug delle risposte multi-agente in WhatsApp
sidebarTitle: Broadcast groups
status: experimental
summary: Trasmettere un messaggio WhatsApp a più agenti
title: Gruppi di trasmissione
x-i18n:
    generated_at: "2026-07-12T06:48:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2771c15b31592f11293385498b9c89decf84747a9172caafb994a5dca4bbdc06
    source_path: channels/broadcast-groups.md
    workflow: 16
---

<Note>
**Stato:** Sperimentale. Aggiunto nella versione 2026.1.9. Solo WhatsApp (canale web).
</Note>

## Panoramica

I gruppi broadcast eseguono **più agenti** sullo stesso messaggio in arrivo. Ogni agente elabora il messaggio nella propria sessione isolata e pubblica la propria risposta, quindi un singolo numero WhatsApp può ospitare un team di agenti specializzati in un'unica chat di gruppo o in un messaggio diretto.

I gruppi broadcast vengono valutati dopo le liste di elementi consentiti del canale e le regole di attivazione dei gruppi. Nei gruppi WhatsApp, il broadcast avviene quando OpenClaw risponderebbe normalmente (ad esempio, in caso di menzione, a seconda delle impostazioni del gruppo). Modificano solo **quali agenti vengono eseguiti**, mai l'idoneità di un messaggio all'elaborazione.

Il flusso QA WhatsApp live include `whatsapp-broadcast-group-fanout`, che verifica che un singolo messaggio di gruppo con menzione possa produrre risposte visibili distinte da due agenti configurati.

## Configurazione

### Configurazione di base

Aggiungi una sezione `broadcast` di primo livello (accanto a `bindings`). Le chiavi sono gli ID dei peer WhatsApp, mentre i valori sono array di ID agente:

- chat di gruppo: JID del gruppo (ad es. `120363403215116621@g.us`)
- messaggi diretti: numero di telefono E.164 del mittente (ad es. `+15551234567`)

```json
{
  "broadcast": {
    "120363403215116621@g.us": ["alfred", "baerbel", "assistant3"]
  }
}
```

**Risultato:** quando OpenClaw risponderebbe in questa chat, esegue tutti e tre gli agenti.

Ogni ID agente elencato deve esistere in `agents.list`: la convalida della configurazione segnala gli ID sconosciuti e il runtime li ignora con un avviso `Broadcast agent <id> not found in agents.list; skipping`.

### Strategia di elaborazione

`broadcast.strategy` stabilisce come gli agenti elaborano il messaggio:

| Strategia                | Comportamento                                                                    |
| ------------------------ | -------------------------------------------------------------------------------- |
| `parallel` (predefinita) | Tutti gli agenti elaborano simultaneamente; le risposte arrivano in qualsiasi ordine. |
| `sequential`             | Gli agenti elaborano nell'ordine dell'array; ciascuno attende il completamento del precedente. |

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

## Funzionamento

### Flusso dei messaggi

<Steps>
  <Step title="Arriva un messaggio in ingresso">
    Arriva un messaggio da un gruppo WhatsApp o da un messaggio diretto.
  </Step>
  <Step title="Instradamento e ammissione">
    OpenClaw applica le liste di elementi consentiti del canale, le regole di attivazione dei gruppi e la proprietà dei binding ACP configurati.
  </Step>
  <Step title="Verifica del broadcast">
    Se nessun binding ACP configurato è proprietario della route, OpenClaw verifica se l'ID del peer è presente in `broadcast`.
  </Step>
  <Step title="Se si applica il broadcast">
    - Tutti gli agenti elencati elaborano il messaggio.
    - Ogni agente dispone della propria chiave di sessione e di un contesto isolato.
    - Gli agenti elaborano in parallelo (impostazione predefinita) o in sequenza.
    - Gli allegati audio vengono trascritti una sola volta prima della distribuzione, così gli agenti condividono un'unica trascrizione anziché effettuare chiamate STT separate.

  </Step>
  <Step title="Se il broadcast non si applica">
    OpenClaw inoltra alla route ordinaria o alla route della sessione ACP configurata selezionata durante l'instradamento.
  </Step>
</Steps>

<Note>
I gruppi broadcast non ignorano le liste di elementi consentiti del canale né le regole di attivazione dei gruppi (menzioni/comandi/ecc.). Modificano solo _quali agenti vengono eseguiti_ quando un messaggio è idoneo all'elaborazione.
</Note>

### Isolamento delle sessioni

Ogni agente in un gruppo broadcast mantiene completamente separati:

- **Chiavi di sessione** (`agent:alfred:whatsapp:group:120363...` rispetto a `agent:baerbel:whatsapp:group:120363...`)
- **Cronologia della conversazione** (un agente non vede le risposte degli altri agenti)
- **Area di lavoro** (sandbox separate, se configurate)
- **Accesso agli strumenti** (elenchi di autorizzazioni/divieti differenti)
- **Memoria/contesto** (`IDENTITY.md`, `SOUL.md` e così via separati)

Un'eccezione è intenzionalmente condivisa: il **buffer del contesto di gruppo** (i messaggi recenti del gruppo utilizzati come contesto) è condiviso per peer, quindi tutti gli agenti broadcast vedono lo stesso contesto quando vengono attivati. Viene svuotato una volta al termine della distribuzione.

Ciò consente a ogni agente di avere personalità, modelli, Skills e accesso agli strumenti differenti (ad esempio, sola lettura rispetto a lettura e scrittura).

### Esempio: sessioni isolate

Nel gruppo `120363403215116621@g.us` con gli agenti `["alfred", "baerbel"]`:

<Tabs>
  <Tab title="Contesto di Alfred">
    ```text
    Session: agent:alfred:whatsapp:group:120363403215116621@g.us
    History: [user message, alfred's previous responses]
    Workspace: ~/openclaw-alfred/
    Tools: read, write, exec
    ```
  </Tab>
  <Tab title="Contesto di Baerbel">
    ```text
    Session: agent:baerbel:whatsapp:group:120363403215116621@g.us
    History: [user message, baerbel's previous responses]
    Workspace: ~/openclaw-baerbel/
    Tools: read only
    ```
  </Tab>
</Tabs>

## Casi d'uso

- **Team di agenti specializzati**: un gruppo di sviluppo in cui `code-reviewer`, `security-auditor`, `test-generator` e `docs-checker` rispondono ciascuno allo stesso messaggio dalla propria prospettiva.
- **Supporto multilingue**: un'unica chat di supporto con `support-en`, `support-de` e `support-es` che rispondono nelle rispettive lingue.
- **Garanzia della qualità**: `support-agent` risponde mentre `qa-agent` esamina la risposta e interviene solo quando rileva problemi.
- **Automazione delle attività**: `task-tracker`, `time-logger` e `report-generator` elaborano tutti lo stesso aggiornamento di stato.

## Procedure consigliate

<AccordionGroup>
  <Accordion title="1. Mantieni gli agenti focalizzati">
    Assegna a ciascun agente un'unica responsabilità chiara (`formatter`, `linter`, `tester`) anziché utilizzare un agente generico "dev-helper".
  </Accordion>
  <Accordion title="2. Usa ID e nomi descrittivi">
    ```json
    {
      "agents": {
        "list": [
          { "id": "security-scanner", "name": "Security Scanner" },
          { "id": "code-formatter", "name": "Code Formatter" },
          { "id": "test-generator", "name": "Test Generator" }
        ]
      }
    }
    ```
  </Accordion>
  <Accordion title="3. Configura accessi agli strumenti differenti">
    ```json
    {
      "agents": {
        "list": [
          { "id": "reviewer", "tools": { "allow": ["read", "exec"] } },
          { "id": "fixer", "tools": { "allow": ["read", "write", "edit", "exec"] } }
        ]
      }
    }
    ```

    `reviewer` dispone dell'accesso in sola lettura. `fixer` può leggere e scrivere.

  </Accordion>
  <Accordion title="4. Monitora le prestazioni">
    Con molti agenti, preferisci `"strategy": "parallel"` (impostazione predefinita), limita i gruppi broadcast a pochi agenti e usa modelli più veloci per gli agenti più semplici.
  </Accordion>
  <Accordion title="5. Gli errori restano isolati">
    Gli agenti possono generare errori in modo indipendente. L'errore di un agente viene registrato (`Broadcast agent <id> failed: ...`) e non blocca gli altri.
  </Accordion>
</AccordionGroup>

## Compatibilità

### Provider

I gruppi broadcast sono attualmente implementati solo per WhatsApp (canale web). Gli altri canali ignorano la configurazione `broadcast`.

### Instradamento

I gruppi broadcast funzionano insieme all'instradamento esistente:

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

- `GROUP_A`: risponde solo alfred (instradamento normale).
- `GROUP_B`: rispondono agent1 E agent2 (broadcast).

<Note>
**Precedenza:** `broadcast` ha priorità sui binding di route ordinari. I binding ACP configurati (`bindings[].type="acp"`) sono esclusivi: quando uno corrisponde, OpenClaw inoltra alla sessione ACP configurata anziché eseguire la distribuzione broadcast.
</Note>

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="Gli agenti non rispondono">
    **Verifica:**

    1. Gli ID agente esistono in `agents.list` (la convalida della configurazione rifiuta gli ID sconosciuti).
    2. Il formato dell'ID peer è corretto (un JID di gruppo come `120363403215116621@g.us` oppure un numero E.164 come `+15551234567` per i messaggi diretti).
    3. Il messaggio ha superato i normali controlli di ammissione (le regole di menzione/attivazione continuano ad applicarsi).

    **Debug:**

    ```bash
    openclaw logs --follow | grep -i broadcast
    ```

    Una distribuzione riuscita registra `Broadcasting message to <n> agents (<strategy>)`.

  </Accordion>
  <Accordion title="Risponde un solo agente">
    **Causa:** l'ID peer potrebbe essere presente nei binding di route ordinari ma non in `broadcast`, oppure potrebbe corrispondere a un binding ACP configurato esclusivo.

    **Soluzione:** aggiungi alla configurazione broadcast i peer associati a route ordinarie oppure rimuovi/modifica il binding ACP configurato se desideri la distribuzione broadcast.

  </Accordion>
  <Accordion title="Problemi di prestazioni">
    Se le prestazioni sono lente con molti agenti: riduci il numero di agenti per gruppo, usa modelli più leggeri e controlla il tempo di avvio della sandbox.
  </Accordion>
</AccordionGroup>

## Esempi

<AccordionGroup>
  <Accordion title="Esempio 1: Team di revisione del codice">
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

    Un singolo frammento di codice nel gruppo produce quattro risposte: correzioni di formattazione, un problema di sicurezza, una lacuna nella copertura e un'osservazione minore sulla documentazione.

  </Accordion>
  <Accordion title="Esempio 2: Pipeline multilingue">
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
  Modalità di elaborazione degli agenti. `parallel` esegue tutti gli agenti simultaneamente; `sequential` li esegue nell'ordine dell'array.
</ParamField>
<ParamField path="[peerId]" type="string[]">
  JID del gruppo WhatsApp o numero di telefono E.164. Il valore è l'array degli ID degli agenti che devono elaborare tutti i messaggi provenienti da quel peer.
</ParamField>

## Limitazioni

1. **Numero massimo di agenti:** non esiste un limite rigido, ma molti agenti (10 o più) possono rallentare l'elaborazione.
2. **Contesto condiviso:** gli agenti non vedono le risposte reciproche (per progettazione).
3. **Ordine dei messaggi:** le risposte parallele possono arrivare in qualsiasi ordine.
4. **Limiti di frequenza:** tutte le risposte provengono da un unico account WhatsApp, quindi la risposta di ogni agente contribuisce agli stessi limiti di frequenza di WhatsApp.

## Argomenti correlati

- [Instradamento dei canali](/it/channels/channel-routing)
- [Gruppi](/it/channels/groups)
- [Strumenti sandbox multi-agente](/it/tools/multi-agent-sandbox-tools)
- [Associazione](/it/channels/pairing)
- [Gestione delle sessioni](/it/concepts/session)
