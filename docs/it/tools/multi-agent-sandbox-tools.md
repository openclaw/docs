---
read_when: You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.
sidebarTitle: Multi-agent sandbox and tools
status: active
summary: Ambiente isolato per agente + restrizioni degli strumenti, precedenza ed esempi
title: Sandbox e strumenti multi-agente
x-i18n:
    generated_at: "2026-05-11T20:38:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d11af55e30996a89e665b258604108a93f4c4271fbe4edfd1caf54864e40f01
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Ogni agente in una configurazione multi-agente può sovrascrivere la sandbox globale e la policy degli strumenti. Questa pagina illustra la configurazione per agente, le regole di precedenza e alcuni esempi.

<CardGroup cols={3}>
  <Card title="Sandboxing" href="/it/gateway/sandboxing">
    Backend e modalità — riferimento completo della sandbox.
  </Card>
  <Card title="Sandbox vs policy degli strumenti vs elevata" href="/it/gateway/sandbox-vs-tool-policy-vs-elevated">
    Debug di "perché è bloccato?"
  </Card>
  <Card title="Modalità elevata" href="/it/tools/elevated">
    Esecuzione elevata per mittenti attendibili.
  </Card>
</CardGroup>

<Warning>
L'autenticazione ha ambito per agente: ogni agente ha il proprio archivio di autenticazione `agentDir` in `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`. Non riutilizzare mai `agentDir` tra agenti. Gli agenti possono consultare i profili di autenticazione dell'agente predefinito/principale quando non hanno un profilo locale, ma i token di aggiornamento OAuth non vengono clonati negli archivi degli agenti secondari. Se copi manualmente le credenziali, copia solo profili statici portabili `api_key` o `token`.
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
              "allow": ["read", "message"],
              "deny": ["exec", "write", "edit", "apply_patch", "process", "browser"],
              "message": {
                "crossContext": {
                  "allowWithinProvider": false,
                  "allowAcrossProviders": false
                }
              }
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

    - agente `main`: viene eseguito sull'host, accesso completo agli strumenti.
    - agente `family`: viene eseguito in Docker (un contenitore per agente), solo `read` e invii di messaggi nella conversazione corrente.

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
  <Accordion title="Esempio 2b: profilo di codifica globale + agente solo messaggistica">
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

    - gli agenti predefiniti ottengono gli strumenti di codifica.
    - l'agente `support` è solo messaggistica (+ strumento Slack).

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

Quando esistono sia configurazioni globali (`agents.defaults.*`) sia configurazioni specifiche dell'agente (`agents.list[].*`):

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

### Restrizioni degli strumenti

L'ordine di filtraggio è:

<Steps>
  <Step title="Profilo strumenti">
    `tools.profile` o `agents.list[].tools.profile`.
  </Step>
  <Step title="Profilo strumenti del provider">
    `tools.byProvider[provider].profile` o `agents.list[].tools.byProvider[provider].profile`.
  </Step>
  <Step title="Policy globale degli strumenti">
    `tools.allow` / `tools.deny`.
  </Step>
  <Step title="Policy degli strumenti del provider">
    `tools.byProvider[provider].allow/deny`.
  </Step>
  <Step title="Policy degli strumenti specifica dell'agente">
    `agents.list[].tools.allow/deny`.
  </Step>
  <Step title="Policy del provider dell'agente">
    `agents.list[].tools.byProvider[provider].allow/deny`.
  </Step>
  <Step title="Policy degli strumenti della sandbox">
    `tools.sandbox.tools` o `agents.list[].tools.sandbox.tools`.
  </Step>
  <Step title="Policy degli strumenti dei sottoagenti">
    `tools.subagents.tools`, se applicabile.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Regole di precedenza">
    - Ogni livello può restringere ulteriormente gli strumenti, ma non può concedere di nuovo strumenti negati dai livelli precedenti.
    - Se `agents.list[].tools.sandbox.tools` è impostato, sostituisce `tools.sandbox.tools` per quell'agente.
    - Se `agents.list[].tools.profile` è impostato, sovrascrive `tools.profile` per quell'agente.
    - Le chiavi degli strumenti del provider accettano `provider` (ad es. `google-antigravity`) oppure `provider/model` (ad es. `openai/gpt-5.4`).

  </Accordion>
  <Accordion title="Comportamento dell'allowlist vuota">
    Se una allowlist esplicita in quella catena lascia l'esecuzione senza strumenti invocabili, OpenClaw si arresta prima di inviare il prompt al modello. Questo è intenzionale: un agente configurato con uno strumento mancante come `agents.list[].tools.allow: ["query_db"]` deve fallire in modo evidente finché il plugin che registra `query_db` non viene abilitato, non continuare come agente solo testo.
  </Accordion>
</AccordionGroup>

Le policy degli strumenti supportano scorciatoie `group:*` che si espandono in più strumenti. Consulta [Gruppi di strumenti](/it/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands) per l'elenco completo.

Le sovrascritture elevate per agente (`agents.list[].tools.elevated`) possono restringere ulteriormente l'esecuzione elevata per agenti specifici. Consulta [Modalità elevata](/it/tools/elevated) per i dettagli.

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

## Esempi di restrizione degli strumenti

<Tabs>
  <Tab title="Agente di sola lettura">
    ```json
    {
      "tools": {
        "allow": ["read"],
        "deny": ["exec", "write", "edit", "apply_patch", "process"]
      }
    }
    ```
  </Tab>
  <Tab title="Esecuzione shell con strumenti filesystem disabilitati">
    ```json
    {
      "tools": {
        "allow": ["read", "exec", "process"],
        "deny": ["write", "edit", "apply_patch", "browser", "gateway"]
      }
    }
    ```

    <Warning>
    Questa policy disabilita gli strumenti filesystem di OpenClaw, ma `exec` è comunque una shell e può scrivere file ovunque l'host selezionato o il filesystem della sandbox lo consenta. Per un agente di sola lettura, nega `exec` e `process`, oppure combina l'accesso alla shell con controlli del filesystem sandbox come `agents.defaults.sandbox.workspaceAccess: "ro"` o `"none"`.
    </Warning>

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

    `sessions_history` in questo profilo restituisce comunque una vista di richiamo limitata e sanificata, invece di un dump grezzo della trascrizione. Il richiamo dell'assistente rimuove i tag di ragionamento, l'impalcatura `<relevant-memories>`, i payload XML delle chiamate agli strumenti in testo semplice (inclusi `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` e i blocchi di chiamate agli strumenti troncati), l'impalcatura declassata delle chiamate agli strumenti, i token di controllo del modello ASCII/full-width trapelati e l'XML malformato delle chiamate agli strumenti MiniMax prima della redazione/troncatura.

  </Tab>
</Tabs>

---

## Errore comune: "non-main"

<Warning>
`agents.defaults.sandbox.mode: "non-main"` si basa su `session.mainKey` (predefinito `"main"`), non sull'id dell'agente. Le sessioni di gruppo/canale ricevono sempre chiavi proprie, quindi vengono trattate come non-main e saranno eseguite in sandbox. Se vuoi che un agente non usi mai la sandbox, imposta `agents.list[].sandbox.mode: "off"`.
</Warning>

---

## Test

Dopo aver configurato sandbox e strumenti multi-agente:

<Steps>
  <Step title="Controlla la risoluzione degli agenti">
    ```bash
    openclaw agents list --bindings
    ```
  </Step>
  <Step title="Verifica i container sandbox">
    ```bash
    docker ps --filter "name=openclaw-sbx-"
    ```
  </Step>
  <Step title="Testa le restrizioni degli strumenti">
    - Invia un messaggio che richieda strumenti con restrizioni.
    - Verifica che l'agente non possa usare gli strumenti negati.

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
  <Accordion title="Agente non in sandbox nonostante `mode: 'all'`">
    - Controlla se esiste un `agents.defaults.sandbox.mode` globale che lo sovrascrive.
    - La configurazione specifica dell'agente ha la precedenza, quindi imposta `agents.list[].sandbox.mode: "all"`.

  </Accordion>
  <Accordion title="Strumenti ancora disponibili nonostante l'elenco deny">
    - Controlla l'ordine di filtraggio degli strumenti: globale → agente → sandbox → subagente.
    - Ogni livello può solo restringere ulteriormente, non concedere di nuovo.
    - Verifica con i log: `[tools] filtering tools for agent:${agentId}`.

  </Accordion>
  <Accordion title="Container non isolato per agente">
    - Imposta `scope: "agent"` nella configurazione sandbox specifica dell'agente.
    - Il valore predefinito è `"session"`, che crea un container per sessione.

  </Accordion>
</AccordionGroup>

---

## Correlati

- [Modalità elevata](/it/tools/elevated)
- [Instradamento multi-agente](/it/concepts/multi-agent)
- [Configurazione della sandbox](/it/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox vs criterio degli strumenti vs modalità elevata](/it/gateway/sandbox-vs-tool-policy-vs-elevated) — debug di "perché è bloccato?"
- [Sandboxing](/it/gateway/sandboxing) — riferimento completo della sandbox (modalità, ambiti, backend, immagini)
- [Gestione delle sessioni](/it/concepts/session)
