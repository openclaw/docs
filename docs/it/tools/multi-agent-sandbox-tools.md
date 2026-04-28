---
read_when: You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.
sidebarTitle: Multi-agent sandbox and tools
status: active
summary: Sandbox per agente + restrizioni dei tool, precedenza ed esempi
title: Sandbox e tool multi-agente
x-i18n:
    generated_at: "2026-04-26T11:40:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8b8d24252b03dbcd00a5eefcc8e58bd51577a99ae057008f19a0acc4016413ea
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 15
---

Ogni agente in una configurazione multi-agente può sovrascrivere la sandbox globale e la policy dei tool. Questa pagina copre la configurazione per agente, le regole di precedenza e gli esempi.

<CardGroup cols={3}>
  <Card title="Sandboxing" href="/it/gateway/sandboxing">
    Backend e modalità — riferimento completo della sandbox.
  </Card>
  <Card title="Sandbox vs policy dei tool vs elevated" href="/it/gateway/sandbox-vs-tool-policy-vs-elevated">
    Debug di "perché questo è bloccato?"
  </Card>
  <Card title="Modalità elevated" href="/it/tools/elevated">
    Exec elevated per mittenti attendibili.
  </Card>
</CardGroup>

<Warning>
L'autenticazione è per agente: ogni agente legge dal proprio store di autenticazione `agentDir` in `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`. Le credenziali **non** sono condivise tra agenti. Non riutilizzare mai `agentDir` tra agenti. Se vuoi condividere le credenziali, copia `auth-profiles.json` nell'`agentDir` dell'altro agente.
</Warning>

---

## Esempi di configurazione

<AccordionGroup>
  <Accordion title="Esempio 1: agente personale + agente famiglia con restrizioni">
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

    - agente `main`: viene eseguito sull'host, accesso completo ai tool.
    - agente `family`: viene eseguito in Docker (un container per agente), solo tool `read`.

  </Accordion>
  <Accordion title="Esempio 2: agente di lavoro con sandbox condivisa">
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
  </Accordion>
  <Accordion title="Esempio 2b: profilo di coding globale + agente solo messaggistica">
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

    - gli agenti predefiniti ottengono i tool di coding.
    - l'agente `support` è solo messaggistica (+ tool Slack).

  </Accordion>
  <Accordion title="Esempio 3: modalità sandbox diverse per agente">
    ```json
    {
      "agents": {
        "defaults": {
          "sandbox": {
            "mode": "non-main",
            "scope": "session"
          }
        },
        "list": [
          {
            "id": "main",
            "workspace": "~/.openclaw/workspace",
            "sandbox": {
              "mode": "off"
            }
          },
          {
            "id": "public",
            "workspace": "~/.openclaw/workspace-public",
            "sandbox": {
              "mode": "all",
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
  </Accordion>
</AccordionGroup>

---

## Precedenza della configurazione

Quando esistono sia configurazioni globali (`agents.defaults.*`) sia specifiche dell'agente (`agents.list[].*`):

### Configurazione della sandbox

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

<Note>
`agents.list[].sandbox.{docker,browser,prune}.*` sovrascrive `agents.defaults.sandbox.{docker,browser,prune}.*` per quell'agente (ignorato quando l'ambito della sandbox si risolve in `"shared"`).
</Note>

### Restrizioni dei tool

L'ordine di filtraggio è:

<Steps>
  <Step title="Profilo dei tool">
    `tools.profile` oppure `agents.list[].tools.profile`.
  </Step>
  <Step title="Profilo dei tool del provider">
    `tools.byProvider[provider].profile` oppure `agents.list[].tools.byProvider[provider].profile`.
  </Step>
  <Step title="Policy globale dei tool">
    `tools.allow` / `tools.deny`.
  </Step>
  <Step title="Policy dei tool del provider">
    `tools.byProvider[provider].allow/deny`.
  </Step>
  <Step title="Policy dei tool specifica dell'agente">
    `agents.list[].tools.allow/deny`.
  </Step>
  <Step title="Policy del provider dell'agente">
    `agents.list[].tools.byProvider[provider].allow/deny`.
  </Step>
  <Step title="Policy dei tool della sandbox">
    `tools.sandbox.tools` oppure `agents.list[].tools.sandbox.tools`.
  </Step>
  <Step title="Policy dei tool del subagent">
    `tools.subagents.tools`, se applicabile.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Regole di precedenza">
    - Ogni livello può restringere ulteriormente i tool, ma non può restituire tool negati da livelli precedenti.
    - Se `agents.list[].tools.sandbox.tools` è impostato, sostituisce `tools.sandbox.tools` per quell'agente.
    - Se `agents.list[].tools.profile` è impostato, sovrascrive `tools.profile` per quell'agente.
    - Le chiavi dei tool del provider accettano sia `provider` (ad esempio `google-antigravity`) sia `provider/model` (ad esempio `openai/gpt-5.4`).

  </Accordion>
  <Accordion title="Comportamento di allowlist vuota">
    Se una allowlist esplicita in quella catena lascia l'esecuzione senza tool richiamabili, OpenClaw si ferma prima di inviare il prompt al modello. Questo è intenzionale: un agente configurato con un tool mancante come `agents.list[].tools.allow: ["query_db"]` dovrebbe fallire in modo evidente finché non viene abilitato il plugin che registra `query_db`, non continuare come agente solo testo.
  </Accordion>
</AccordionGroup>

Le policy dei tool supportano abbreviazioni `group:*` che si espandono in più tool. Vedi [Gruppi di tool](/it/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands) per l'elenco completo.

Le sovrascritture elevated per agente (`agents.list[].tools.elevated`) possono restringere ulteriormente exec elevated per agenti specifici. Vedi [Modalità elevated](/it/tools/elevated) per i dettagli.

---

## Migrazione da agente singolo

<Tabs>
  <Tab title="Prima (agente singolo)">
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
  </Tab>
  <Tab title="Dopo (multi-agente)">
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
  </Tab>
</Tabs>

<Note>
Le configurazioni legacy `agent.*` vengono migrate da `openclaw doctor`; in futuro preferisci `agents.defaults` + `agents.list`.
</Note>

---

## Esempi di restrizione dei tool

<Tabs>
  <Tab title="Agente in sola lettura">
    ```json
    {
      "tools": {
        "allow": ["read"],
        "deny": ["exec", "write", "edit", "apply_patch", "process"]
      }
    }
    ```
  </Tab>
  <Tab title="Esecuzione sicura (nessuna modifica ai file)">
    ```json
    {
      "tools": {
        "allow": ["read", "exec", "process"],
        "deny": ["write", "edit", "apply_patch", "browser", "gateway"]
      }
    }
    ```
  </Tab>
  <Tab title="Solo comunicazione">
    ```json
    {
      "tools": {
        "sessions": { "visibility": "tree" },
        "allow": ["sessions_list", "sessions_send", "sessions_history", "session_status"],
        "deny": ["exec", "write", "edit", "apply_patch", "read", "browser"]
      }
    }
    ```

    `sessions_history` in questo profilo restituisce comunque una vista di richiamo limitata e sanitizzata invece di un dump grezzo della trascrizione. Il richiamo assistant rimuove tag di thinking, scaffolding `<relevant-memories>`, payload XML delle tool-call in testo semplice (inclusi `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` e blocchi tool-call troncati), scaffolding di tool-call declassato, token di controllo del modello trapelati ASCII/a larghezza piena e XML tool-call MiniMax malformato prima di redazione/troncamento.

  </Tab>
</Tabs>

---

## Errore comune: "non-main"

<Warning>
`agents.defaults.sandbox.mode: "non-main"` è basato su `session.mainKey` (predefinito `"main"`), non sull'ID dell'agente. Le sessioni di gruppo/canale ottengono sempre le proprie chiavi, quindi vengono trattate come non-main e saranno messe in sandbox. Se vuoi che un agente non usi mai la sandbox, imposta `agents.list[].sandbox.mode: "off"`.
</Warning>

---

## Test

Dopo aver configurato sandbox e tool multi-agente:

<Steps>
  <Step title="Controlla la risoluzione dell'agente">
    ```bash
    openclaw agents list --bindings
    ```
  </Step>
  <Step title="Verifica i container sandbox">
    ```bash
    docker ps --filter "name=openclaw-sbx-"
    ```
  </Step>
  <Step title="Testa le restrizioni dei tool">
    - Invia un messaggio che richieda tool con restrizioni.
    - Verifica che l'agente non possa usare i tool negati.

  </Step>
  <Step title="Monitora i log">
    ```bash
    tail -f "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}/logs/gateway.log" | grep -E "routing|sandbox|tools"
    ```
  </Step>
</Steps>

---

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="L'agente non usa la sandbox nonostante `mode: 'all'`">
    - Controlla se esiste `agents.defaults.sandbox.mode` globale che lo sovrascrive.
    - La configurazione specifica dell'agente ha precedenza, quindi imposta `agents.list[].sandbox.mode: "all"`.

  </Accordion>
  <Accordion title="I tool sono ancora disponibili nonostante la deny list">
    - Controlla l'ordine di filtraggio dei tool: globale → agente → sandbox → subagent.
    - Ogni livello può solo restringere ulteriormente, non restituire accesso.
    - Verifica con i log: `[tools] filtering tools for agent:${agentId}`.

  </Accordion>
  <Accordion title="Il container non è isolato per agente">
    - Imposta `scope: "agent"` nella configurazione della sandbox specifica dell'agente.
    - Il valore predefinito è `"session"`, che crea un container per sessione.

  </Accordion>
</AccordionGroup>

---

## Correlati

- [Modalità elevated](/it/tools/elevated)
- [Instradamento multi-agente](/it/concepts/multi-agent)
- [Configurazione sandbox](/it/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox vs policy dei tool vs elevated](/it/gateway/sandbox-vs-tool-policy-vs-elevated) — debug di "perché questo è bloccato?"
- [Sandboxing](/it/gateway/sandboxing) — riferimento completo della sandbox (modalità, ambiti, backend, immagini)
- [Gestione delle sessioni](/it/concepts/session)
