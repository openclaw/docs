---
read_when: You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.
sidebarTitle: Multi-agent sandbox and tools
status: active
summary: Sandbox per agente + restrizioni degli strumenti, precedenza ed esempi
title: Sandbox e strumenti multi-agente
x-i18n:
    generated_at: "2026-04-30T09:17:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: eedb36301f670bcd8956dbeb81788acfc96627e39401e34434c2348fcb10f155
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 16
---

Ogni agente in una configurazione multi-agente può sovrascrivere la sandbox globale e la policy degli strumenti. Questa pagina descrive la configurazione per agente, le regole di precedenza e alcuni esempi.

<CardGroup cols={3}>
  <Card title="Sandboxing" href="/it/gateway/sandboxing">
    Backend e modalità — riferimento completo per la sandbox.
  </Card>
  <Card title="Sandbox vs tool policy vs elevated" href="/it/gateway/sandbox-vs-tool-policy-vs-elevated">
    Debug di "perché è bloccato?"
  </Card>
  <Card title="Elevated mode" href="/it/tools/elevated">
    Exec elevato per mittenti attendibili.
  </Card>
</CardGroup>

<Warning>
L'autenticazione è limitata all'agente: ogni agente ha il proprio archivio di autenticazione `agentDir` in `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`. Non riutilizzare mai `agentDir` tra agenti. Gli agenti possono leggere i profili di autenticazione dell'agente predefinito/principale quando non hanno un profilo locale, ma i token di aggiornamento OAuth non vengono clonati negli archivi degli agenti secondari. Se copi le credenziali manualmente, copia solo profili `api_key` o `token` statici e portabili.
</Warning>

---

## Esempi di configurazione

<AccordionGroup>
  <Accordion title="Esempio 1: agente personale + agente famiglia limitato">
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

    - Agente `main`: viene eseguito sull'host, con accesso completo agli strumenti.
    - Agente `family`: viene eseguito in Docker (un container per agente), solo strumento `read`.

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

    - gli agenti predefiniti ricevono gli strumenti di codifica.
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
  <Step title="Policy strumenti del provider">
    `tools.byProvider[provider].allow/deny`.
  </Step>
  <Step title="Policy strumenti specifica dell'agente">
    `agents.list[].tools.allow/deny`.
  </Step>
  <Step title="Policy provider dell'agente">
    `agents.list[].tools.byProvider[provider].allow/deny`.
  </Step>
  <Step title="Policy strumenti della sandbox">
    `tools.sandbox.tools` o `agents.list[].tools.sandbox.tools`.
  </Step>
  <Step title="Policy strumenti del sottoagente">
    `tools.subagents.tools`, se applicabile.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Regole di precedenza">
    - Ogni livello può restringere ulteriormente gli strumenti, ma non può riabilitare strumenti negati dai livelli precedenti.
    - Se `agents.list[].tools.sandbox.tools` è impostato, sostituisce `tools.sandbox.tools` per quell'agente.
    - Se `agents.list[].tools.profile` è impostato, sovrascrive `tools.profile` per quell'agente.
    - Le chiavi degli strumenti del provider accettano `provider` (ad es. `google-antigravity`) oppure `provider/model` (ad es. `openai/gpt-5.4`).

  </Accordion>
  <Accordion title="Comportamento della allowlist vuota">
    Se una allowlist esplicita in questa catena lascia l'esecuzione senza strumenti chiamabili, OpenClaw si arresta prima di inviare il prompt al modello. È intenzionale: un agente configurato con uno strumento mancante come `agents.list[].tools.allow: ["query_db"]` deve fallire in modo evidente finché il Plugin che registra `query_db` non viene abilitato, invece di continuare come agente solo testo.
  </Accordion>
</AccordionGroup>

Le policy degli strumenti supportano abbreviazioni `group:*` che si espandono in più strumenti. Vedi [Gruppi di strumenti](/it/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands) per l'elenco completo.

Le sovrascritture elevated per agente (`agents.list[].tools.elevated`) possono limitare ulteriormente l'exec elevato per agenti specifici. Vedi [Modalità elevated](/it/tools/elevated) per i dettagli.

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

    `sessions_history` in questo profilo restituisce comunque una vista di richiamo limitata e sanificata, invece di un dump grezzo della trascrizione. Il richiamo dell'assistente rimuove tag di ragionamento, impalcature `<relevant-memories>`, payload XML di chiamate a strumenti in testo semplice (inclusi `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` e blocchi di chiamate a strumenti troncati), impalcature di chiamate a strumenti declassate, token di controllo del modello trapelati ASCII/a larghezza intera e XML di chiamate a strumenti MiniMax malformato prima della redazione/troncamento.

  </Tab>
</Tabs>

---

## Errore comune: "non-main"

<Warning>
`agents.defaults.sandbox.mode: "non-main"` si basa su `session.mainKey` (predefinito `"main"`), non sull'id dell'agente. Le sessioni di gruppo/canale ricevono sempre le proprie chiavi, quindi sono trattate come non-main e verranno eseguite in sandbox. Se vuoi che un agente non usi mai la sandbox, imposta `agents.list[].sandbox.mode: "off"`.
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
  <Step title="Verifica i container della sandbox">
    ```bash
    docker ps --filter "name=openclaw-sbx-"
    ```
  </Step>
  <Step title="Testa le restrizioni degli strumenti">
    - Invia un messaggio che richiede strumenti limitati.
    - Verifica che l'agente non possa usare strumenti negati.

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
  <Accordion title="Strumenti ancora disponibili nonostante la deny list">
    - Controlla l'ordine di filtraggio degli strumenti: globale → agente → sandbox → sottoagente.
    - Ogni livello può solo restringere ulteriormente, non riabilitare.
    - Verifica con i log: `[tools] filtering tools for agent:${agentId}`.

  </Accordion>
  <Accordion title="Container non isolato per agente">
    - Imposta `scope: "agent"` nella configurazione sandbox specifica dell'agente.
    - Il valore predefinito è `"session"`, che crea un container per sessione.

  </Accordion>
</AccordionGroup>

---

## Correlati

- [Modalità elevated](/it/tools/elevated)
- [Routing multi-agente](/it/concepts/multi-agent)
- [Configurazione della sandbox](/it/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox vs tool policy vs elevated](/it/gateway/sandbox-vs-tool-policy-vs-elevated) — debug di "perché è bloccato?"
- [Sandboxing](/it/gateway/sandboxing) — riferimento completo della sandbox (modalità, ambiti, backend, immagini)
- [Gestione delle sessioni](/it/concepts/session)
