---
read_when: “You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.”
status: active
summary: Sandbox e restrizioni degli strumenti per agente, precedenza ed esempi
title: Sandbox e strumenti multi-agente
x-i18n:
    generated_at: "2026-04-05T14:07:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 07985f7c8fae860a7b9bf685904903a4a8f90249e95e4179cf0775a1208c0597
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 15
---

# Configurazione di sandbox e strumenti multi-agente

Ogni agente in una configurazione multi-agente può sovrascrivere la policy
globale di sandbox e degli strumenti. Questa pagina descrive la configurazione per agente, le regole di precedenza e
gli esempi.

- **Backend e modalità del sandbox**: vedi [Sandboxing](/it/gateway/sandboxing).
- **Debug degli strumenti bloccati**: vedi [Sandbox vs Tool Policy vs Elevated](/it/gateway/sandbox-vs-tool-policy-vs-elevated) e `openclaw sandbox explain`.
- **Exec elevato**: vedi [Elevated Mode](/tools/elevated).

L'autenticazione è per agente: ogni agente legge dal proprio archivio auth `agentDir` in
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`.
Le credenziali **non** sono condivise tra gli agenti. Non riutilizzare mai `agentDir` tra agenti.
Se vuoi condividere le credenziali, copia `auth-profiles.json` nell'`agentDir` dell'altro agente.

---

## Esempi di configurazione

### Esempio 1: agente personale + agente famiglia con restrizioni

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "default": true,
        "name": "Personal Assistant",
        "workspace": "~/.openclaw/workspace",
        "sandbox": { "mode": "off" }
      },
      {
        "id": "family",
        "name": "Family Bot",
        "workspace": "~/.openclaw/workspace-family",
        "sandbox": {
          "mode": "all",
          "scope": "agent"
        },
        "tools": {
          "allow": ["read"],
          "deny": ["exec", "write", "edit", "apply_patch", "process", "browser"]
        }
      }
    ]
  },
  "bindings": [
    {
      "agentId": "family",
      "match": {
        "provider": "whatsapp",
        "accountId": "*",
        "peer": {
          "kind": "group",
          "id": "120363424282127706@g.us"
        }
      }
    }
  ]
}
```

**Risultato:**

- agente `main`: viene eseguito sull'host, accesso completo agli strumenti
- agente `family`: viene eseguito in Docker (un container per agente), solo strumento `read`

---

### Esempio 2: agente di lavoro con sandbox condiviso

```json
{
  "agents": {
    "list": [
      {
        "id": "personal",
        "workspace": "~/.openclaw/workspace-personal",
        "sandbox": { "mode": "off" }
      },
      {
        "id": "work",
        "workspace": "~/.openclaw/workspace-work",
        "sandbox": {
          "mode": "all",
          "scope": "shared",
          "workspaceRoot": "/tmp/work-sandboxes"
        },
        "tools": {
          "allow": ["read", "write", "apply_patch", "exec"],
          "deny": ["browser", "gateway", "discord"]
        }
      }
    ]
  }
}
```

---

### Esempio 2b: profilo coding globale + agente solo messaging

```json
{
  "tools": { "profile": "coding" },
  "agents": {
    "list": [
      {
        "id": "support",
        "tools": { "profile": "messaging", "allow": ["slack"] }
      }
    ]
  }
}
```

**Risultato:**

- gli agenti predefiniti ricevono gli strumenti coding
- l'agente `support` è solo messaging (+ strumento Slack)

---

### Esempio 3: modalità sandbox diverse per agente

```json
{
  "agents": {
    "defaults": {
      "sandbox": {
        "mode": "non-main", // Predefinito globale
        "scope": "session"
      }
    },
    "list": [
      {
        "id": "main",
        "workspace": "~/.openclaw/workspace",
        "sandbox": {
          "mode": "off" // Override: main mai in sandbox
        }
      },
      {
        "id": "public",
        "workspace": "~/.openclaw/workspace-public",
        "sandbox": {
          "mode": "all", // Override: public sempre in sandbox
          "scope": "agent"
        },
        "tools": {
          "allow": ["read"],
          "deny": ["exec", "write", "edit", "apply_patch"]
        }
      }
    ]
  }
}
```

---

## Precedenza della configurazione

Quando esistono sia configurazioni globali (`agents.defaults.*`) sia configurazioni specifiche per agente (`agents.list[].*`):

### Configurazione del sandbox

Le impostazioni specifiche per agente sovrascrivono quelle globali:

```
agents.list[].sandbox.mode > agents.defaults.sandbox.mode
agents.list[].sandbox.scope > agents.defaults.sandbox.scope
agents.list[].sandbox.workspaceRoot > agents.defaults.sandbox.workspaceRoot
agents.list[].sandbox.workspaceAccess > agents.defaults.sandbox.workspaceAccess
agents.list[].sandbox.docker.* > agents.defaults.sandbox.docker.*
agents.list[].sandbox.browser.* > agents.defaults.sandbox.browser.*
agents.list[].sandbox.prune.* > agents.defaults.sandbox.prune.*
```

**Note:**

- `agents.list[].sandbox.{docker,browser,prune}.*` sovrascrive `agents.defaults.sandbox.{docker,browser,prune}.*` per quell'agente (ignorato quando l'ambito del sandbox si risolve in `"shared"`).

### Restrizioni degli strumenti

L'ordine di filtraggio è:

1. **Profilo strumenti** (`tools.profile` o `agents.list[].tools.profile`)
2. **Profilo strumenti del provider** (`tools.byProvider[provider].profile` o `agents.list[].tools.byProvider[provider].profile`)
3. **Policy globale degli strumenti** (`tools.allow` / `tools.deny`)
4. **Policy strumenti del provider** (`tools.byProvider[provider].allow/deny`)
5. **Policy strumenti specifica per agente** (`agents.list[].tools.allow/deny`)
6. **Policy provider dell'agente** (`agents.list[].tools.byProvider[provider].allow/deny`)
7. **Policy strumenti del sandbox** (`tools.sandbox.tools` o `agents.list[].tools.sandbox.tools`)
8. **Policy strumenti del sotto-agente** (`tools.subagents.tools`, se applicabile)

Ogni livello può limitare ulteriormente gli strumenti, ma non può ripristinare strumenti negati dai livelli precedenti.
Se `agents.list[].tools.sandbox.tools` è impostato, sostituisce `tools.sandbox.tools` per quell'agente.
Se `agents.list[].tools.profile` è impostato, sovrascrive `tools.profile` per quell'agente.
Le chiavi degli strumenti del provider accettano sia `provider` (ad es. `google-antigravity`) sia `provider/model` (ad es. `openai/gpt-5.4`).

Le policy degli strumenti supportano le abbreviazioni `group:*` che si espandono in più strumenti. Vedi [Tool groups](/it/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands) per l'elenco completo.

Gli override elevati per agente (`agents.list[].tools.elevated`) possono limitare ulteriormente l'exec elevato per agenti specifici. Vedi [Elevated Mode](/tools/elevated) per i dettagli.

---

## Migrazione da agente singolo

**Prima (agente singolo):**

```json
{
  "agents": {
    "defaults": {
      "workspace": "~/.openclaw/workspace",
      "sandbox": {
        "mode": "non-main"
      }
    }
  },
  "tools": {
    "sandbox": {
      "tools": {
        "allow": ["read", "write", "apply_patch", "exec"],
        "deny": []
      }
    }
  }
}
```

**Dopo (multi-agente con profili diversi):**

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "default": true,
        "workspace": "~/.openclaw/workspace",
        "sandbox": { "mode": "off" }
      }
    ]
  }
}
```

Le configurazioni legacy `agent.*` vengono migrate da `openclaw doctor`; in futuro preferisci `agents.defaults` + `agents.list`.

---

## Esempi di restrizioni degli strumenti

### Agente in sola lettura

```json
{
  "tools": {
    "allow": ["read"],
    "deny": ["exec", "write", "edit", "apply_patch", "process"]
  }
}
```

### Agente con esecuzione sicura (nessuna modifica ai file)

```json
{
  "tools": {
    "allow": ["read", "exec", "process"],
    "deny": ["write", "edit", "apply_patch", "browser", "gateway"]
  }
}
```

### Agente solo comunicazione

```json
{
  "tools": {
    "sessions": { "visibility": "tree" },
    "allow": ["sessions_list", "sessions_send", "sessions_history", "session_status"],
    "deny": ["exec", "write", "edit", "apply_patch", "read", "browser"]
  }
}
```

` sessions_history` in questo profilo restituisce comunque una vista di richiamo limitata e sanificata
anziché un dump grezzo della trascrizione. Il richiamo dell'assistente rimuove i tag di pensiero,
l'impalcatura `<relevant-memories>`, i payload XML di chiamata agli strumenti in testo normale
(inclusi `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` e blocchi troncati di chiamata agli strumenti),
l'impalcatura degradata delle chiamate agli strumenti, i token di controllo del modello ASCII/a larghezza piena trapelati
e il malformed MiniMax tool-call XML prima della redazione/troncatura.

---

## Errore comune: `non-main`

`agents.defaults.sandbox.mode: "non-main"` si basa su `session.mainKey` (predefinito `"main"`),
non sull'id dell'agente. Le sessioni di gruppo/canale ricevono sempre le proprie chiavi, quindi
sono trattate come non-main e verranno eseguite in sandbox. Se vuoi che un agente non usi mai il
sandbox, imposta `agents.list[].sandbox.mode: "off"`.

---

## Test

Dopo aver configurato sandbox e strumenti multi-agente:

1. **Controlla la risoluzione dell'agente:**

   ```exec
   openclaw agents list --bindings
   ```

2. **Verifica i container sandbox:**

   ```exec
   docker ps --filter "name=openclaw-sbx-"
   ```

3. **Testa le restrizioni degli strumenti:**
   - Invia un messaggio che richiede strumenti con restrizioni
   - Verifica che l'agente non possa usare gli strumenti negati

4. **Monitora i log:**

   ```exec
   tail -f "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}/logs/gateway.log" | grep -E "routing|sandbox|tools"
   ```

---

## Risoluzione dei problemi

### L'agente non usa il sandbox nonostante `mode: "all"`

- Controlla se esiste un `agents.defaults.sandbox.mode` globale che lo sovrascrive
- La configurazione specifica per agente ha la precedenza, quindi imposta `agents.list[].sandbox.mode: "all"`

### Gli strumenti sono ancora disponibili nonostante la deny list

- Controlla l'ordine di filtraggio degli strumenti: globale → agente → sandbox → sotto-agente
- Ogni livello può solo limitare ulteriormente, non ripristinare accessi
- Verifica con i log: `[tools] filtering tools for agent:${agentId}`

### Il container non è isolato per agente

- Imposta `scope: "agent"` nella configurazione sandbox specifica per agente
- Il valore predefinito è `"session"`, che crea un container per sessione

---

## Vedi anche

- [Sandboxing](/it/gateway/sandboxing) -- riferimento completo del sandbox (modalità, ambiti, backend, immagini)
- [Sandbox vs Tool Policy vs Elevated](/it/gateway/sandbox-vs-tool-policy-vs-elevated) -- debug di "perché questo è bloccato?"
- [Elevated Mode](/tools/elevated)
- [Instradamento multi-agente](/it/concepts/multi-agent)
- [Configurazione del sandbox](/it/gateway/configuration-reference#agentsdefaultssandbox)
- [Gestione delle sessioni](/it/concepts/session)
