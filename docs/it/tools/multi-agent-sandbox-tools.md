---
read_when: “You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.”
status: active
summary: '"Sandbox per agente + restrizioni degli strumenti, precedenza ed esempi"'
title: Sandbox multi-agente e strumenti
x-i18n:
    generated_at: "2026-04-24T09:07:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7239e28825759efb060b821f87f5ebd9a7f3b720b30ff16dc076b186e47fcde9
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 15
---

# Configurazione Sandbox & Strumenti Multi-Agente

Ogni agente in una configurazione multi-agente può sovrascrivere i criteri globali di sandbox e degli strumenti.
Questa pagina copre configurazione per agente, regole di precedenza ed
esempi.

- **Backend e modalità sandbox**: consulta [Sandboxing](/it/gateway/sandboxing).
- **Debug degli strumenti bloccati**: consulta [Sandbox vs Tool Policy vs Elevated](/it/gateway/sandbox-vs-tool-policy-vs-elevated) e `openclaw sandbox explain`.
- **Exec elevated**: consulta [Modalità Elevated](/it/tools/elevated).

L'auth è per agente: ogni agente legge dal proprio negozio auth `agentDir` in
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`.
Le credenziali **non** sono condivise tra agenti. Non riutilizzare mai `agentDir` tra agenti.
Se vuoi condividere credenziali, copia `auth-profiles.json` nell'`agentDir` dell'altro agente.

---

## Esempi di configurazione

### Esempio 1: agente personale + agente famiglia limitato

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

- Agente `main`: gira sull'host, accesso completo agli strumenti
- Agente `family`: gira in Docker (un container per agente), solo strumento `read`

---

### Esempio 2: agente work con sandbox condivisa

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

- gli agenti predefiniti ottengono strumenti di coding
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
          "mode": "off" // Override: main mai sandboxed
        }
      },
      {
        "id": "public",
        "workspace": "~/.openclaw/workspace-public",
        "sandbox": {
          "mode": "all", // Override: public sempre sandboxed
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

Quando esistono sia configurazioni globali (`agents.defaults.*`) sia specifiche dell'agente (`agents.list[].*`):

### Configurazione sandbox

Le impostazioni specifiche dell'agente sovrascrivono quelle globali:

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

- `agents.list[].sandbox.{docker,browser,prune}.*` sovrascrive `agents.defaults.sandbox.{docker,browser,prune}.*` per quell'agente (ignorato quando l'ambito sandbox si risolve in `"shared"`).

### Restrizioni degli strumenti

L'ordine di filtraggio è:

1. **Profilo strumenti** (`tools.profile` o `agents.list[].tools.profile`)
2. **Profilo strumenti del provider** (`tools.byProvider[provider].profile` o `agents.list[].tools.byProvider[provider].profile`)
3. **Criteri globali degli strumenti** (`tools.allow` / `tools.deny`)
4. **Criteri strumenti del provider** (`tools.byProvider[provider].allow/deny`)
5. **Criteri strumenti specifici dell'agente** (`agents.list[].tools.allow/deny`)
6. **Criteri provider dell'agente** (`agents.list[].tools.byProvider[provider].allow/deny`)
7. **Criteri sandbox degli strumenti** (`tools.sandbox.tools` o `agents.list[].tools.sandbox.tools`)
8. **Criteri strumenti del sottoagente** (`tools.subagents.tools`, se applicabile)

Ogni livello può restringere ulteriormente gli strumenti, ma non può ripristinare strumenti negati da livelli precedenti.
Se `agents.list[].tools.sandbox.tools` è impostato, sostituisce `tools.sandbox.tools` per quell'agente.
Se `agents.list[].tools.profile` è impostato, sovrascrive `tools.profile` per quell'agente.
Le chiavi degli strumenti per provider accettano sia `provider` (es. `google-antigravity`) sia `provider/model` (es. `openai/gpt-5.4`).

I criteri degli strumenti supportano le scorciatoie `group:*` che si espandono in più strumenti. Consulta [Gruppi di strumenti](/it/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands) per l'elenco completo.

Gli override elevated per agente (`agents.list[].tools.elevated`) possono restringere ulteriormente l'exec elevated per agenti specifici. Consulta [Modalità Elevated](/it/tools/elevated) per i dettagli.

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

Le configurazioni legacy `agent.*` vengono migrate da `openclaw doctor`; preferisci `agents.defaults` + `agents.list` d'ora in avanti.

---

## Esempi di restrizione degli strumenti

### Agente in sola lettura

```json
{
  "tools": {
    "allow": ["read"],
    "deny": ["exec", "write", "edit", "apply_patch", "process"]
  }
}
```

### Agente di esecuzione sicura (nessuna modifica ai file)

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

`sessions_history` in questo profilo restituisce comunque una vista di richiamo limitata e sanitizzata
anziché un dump grezzo della trascrizione. Il richiamo dell'assistente rimuove tag di thinking,
scaffolding `<relevant-memories>`, payload XML di chiamate di tool in testo semplice
(inclusi `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` e blocchi di chiamata di tool troncati),
scaffolding degradato delle chiamate di tool, token di controllo del modello trapelati in ASCII/full-width
e XML malformato delle chiamate di tool MiniMax prima della redazione/troncamento.

---

## Errore comune: "non-main"

`agents.defaults.sandbox.mode: "non-main"` si basa su `session.mainKey` (predefinito `"main"`),
non sull'ID agente. Le sessioni di gruppo/canale ottengono sempre le proprie chiavi, quindi
vengono trattate come non-main e saranno sandboxed. Se vuoi che un agente non entri mai
in sandbox, imposta `agents.list[].sandbox.mode: "off"`.

---

## Test

Dopo aver configurato sandbox e strumenti multi-agente:

1. **Controlla la risoluzione degli agenti:**

   ```exec
   openclaw agents list --bindings
   ```

2. **Verifica i container sandbox:**

   ```exec
   docker ps --filter "name=openclaw-sbx-"
   ```

3. **Testa le restrizioni degli strumenti:**
   - Invia un messaggio che richiede strumenti limitati
   - Verifica che l'agente non possa usare gli strumenti negati

4. **Monitora i log:**

   ```exec
   tail -f "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}/logs/gateway.log" | grep -E "routing|sandbox|tools"
   ```

---

## Risoluzione dei problemi

### L'agente non entra in sandbox nonostante `mode: "all"`

- Controlla se esiste un `agents.defaults.sandbox.mode` globale che lo sovrascrive
- La configurazione specifica dell'agente ha la precedenza, quindi imposta `agents.list[].sandbox.mode: "all"`

### Gli strumenti sono ancora disponibili nonostante la deny list

- Controlla l'ordine di filtraggio degli strumenti: globale → agente → sandbox → sottoagente
- Ogni livello può solo restringere ulteriormente, non ripristinare
- Verifica con i log: `[tools] filtering tools for agent:${agentId}`

### Il container non è isolato per agente

- Imposta `scope: "agent"` nella configurazione sandbox specifica dell'agente
- Il valore predefinito è `"session"` che crea un container per sessione

---

## Correlati

- [Sandboxing](/it/gateway/sandboxing) -- riferimento completo al sandbox (modalità, ambiti, backend, immagini)
- [Sandbox vs Tool Policy vs Elevated](/it/gateway/sandbox-vs-tool-policy-vs-elevated) -- debug di "perché questo è bloccato?"
- [Modalità Elevated](/it/tools/elevated)
- [Routing multi-agente](/it/concepts/multi-agent)
- [Configurazione Sandbox](/it/gateway/config-agents#agentsdefaultssandbox)
- [Gestione della sessione](/it/concepts/session)
