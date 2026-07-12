---
read_when: You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.
sidebarTitle: Multi-agent sandbox and tools
status: active
summary: Sandbox per agente + restrizioni degli strumenti, precedenza ed esempi
title: Sandbox e strumenti multi-agente
x-i18n:
    generated_at: "2026-07-12T07:37:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fada3672a0a7ce6eac2a8bffee8329afcd893d97e33d8e9842cb12079397efa6
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 16
---

Ogni agente in una configurazione multi-agente può sostituire le impostazioni globali dell'ambiente isolato e dei criteri degli strumenti. Questa pagina illustra la configurazione per agente, le regole di precedenza e alcuni esempi.

<CardGroup cols={3}>
  <Card title="Isolamento" href="/it/gateway/sandboxing">
    Backend e modalità — riferimento completo per l'ambiente isolato.
  </Card>
  <Card title="Ambiente isolato, criteri degli strumenti e privilegi elevati" href="/it/gateway/sandbox-vs-tool-policy-vs-elevated">
    Esegui il debug di «perché questa operazione è bloccata?»
  </Card>
  <Card title="Modalità con privilegi elevati" href="/it/tools/elevated">
    Esecuzione con privilegi elevati per mittenti attendibili.
  </Card>
</CardGroup>

<Warning>
L'autenticazione è limitata all'ambito dell'agente: ogni agente dispone di un proprio archivio di autenticazione `agentDir` in `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`. Non riutilizzare mai `agentDir` tra agenti diversi. Gli agenti possono accedere in lettura ai profili di autenticazione dell'agente predefinito/principale quando non dispongono di un profilo locale, ma i token di aggiornamento OAuth non vengono clonati negli archivi degli agenti secondari. Se copi manualmente le credenziali, copia solo profili statici portabili `api_key` o `token`.
</Warning>

---

## Esempi di configurazione

<AccordionGroup>
  <Accordion title="Esempio 1: agente personale e agente familiare con restrizioni">
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

    - Agente `main`: viene eseguito sull'host con accesso completo agli strumenti.
    - Agente `family`: viene eseguito in Docker (un contenitore per agente) e può usare solo `read` e inviare messaggi nella conversazione corrente.

  </Accordion>
  <Accordion title="Esempio 2: agente di lavoro con ambiente isolato condiviso">
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
  <Accordion title="Esempio 2b: profilo globale di programmazione e agente dedicato esclusivamente alla messaggistica">
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

    - Gli agenti predefiniti ricevono gli strumenti di programmazione.
    - L'agente `support` è dedicato esclusivamente alla messaggistica (più lo strumento Slack).

  </Accordion>
  <Accordion title="Esempio 3: modalità dell'ambiente isolato diverse per ogni agente">
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

Quando sono presenti sia configurazioni globali (`agents.defaults.*`) sia configurazioni specifiche dell'agente (`agents.list[].*`):

### Configurazione dell'ambiente isolato

Le impostazioni specifiche dell'agente sostituiscono quelle globali:

```text
agents.list[].sandbox.mode > agents.defaults.sandbox.mode
agents.list[].sandbox.scope > agents.defaults.sandbox.scope
agents.list[].sandbox.workspaceRoot > agents.defaults.sandbox.workspaceRoot
agents.list[].sandbox.workspaceAccess > agents.defaults.sandbox.workspaceAccess
agents.list[].sandbox.docker.* > agents.defaults.sandbox.docker.*
agents.list[].sandbox.browser.* > agents.defaults.sandbox.browser.*
agents.list[].sandbox.prune.* > agents.defaults.sandbox.prune.*
```

<Note>
`agents.list[].sandbox.{docker,browser,prune}.*` sostituisce `agents.defaults.sandbox.{docker,browser,prune}.*` per quell'agente (viene ignorato quando l'ambito dell'ambiente isolato viene risolto come `"shared"`).
</Note>

### Restrizioni degli strumenti

L'ordine di applicazione dei filtri è il seguente:

<Steps>
  <Step title="Profilo degli strumenti">
    `tools.profile` o `agents.list[].tools.profile`.
  </Step>
  <Step title="Profilo degli strumenti del provider">
    `tools.byProvider[provider].profile` o `agents.list[].tools.byProvider[provider].profile`.
  </Step>
  <Step title="Criteri globali degli strumenti">
    `tools.allow` / `tools.deny`.
  </Step>
  <Step title="Criteri degli strumenti del provider">
    `tools.byProvider[provider].allow/deny`.
  </Step>
  <Step title="Criteri degli strumenti specifici dell'agente">
    `agents.list[].tools.allow/deny`.
  </Step>
  <Step title="Criteri del provider dell'agente">
    `agents.list[].tools.byProvider[provider].allow/deny`.
  </Step>
  <Step title="Criteri degli strumenti dell'ambiente isolato">
    `tools.sandbox.tools` o `agents.list[].tools.sandbox.tools`.
  </Step>
  <Step title="Criteri degli strumenti dei sottoagenti">
    `tools.subagents.tools`, se applicabile.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Regole di precedenza">
    - Ogni livello può limitare ulteriormente gli strumenti, ma non può ripristinare strumenti negati dai livelli precedenti.
    - Se è impostato `agents.list[].tools.sandbox.tools`, questo sostituisce `tools.sandbox.tools` per quell'agente.
    - Se è impostato `agents.list[].tools.profile`, questo sostituisce `tools.profile` per quell'agente.
    - Le chiavi degli strumenti del provider accettano `provider` (ad esempio `google-antigravity`) oppure `provider/model` (ad esempio `openai/gpt-5.4`).

  </Accordion>
  <Accordion title="Comportamento di una lista di elementi consentiti vuota">
    Se una lista esplicita di strumenti consentiti nella catena non lascia alcuno strumento richiamabile per l'esecuzione, OpenClaw si arresta prima di inviare il prompt al modello. Questo comportamento è intenzionale: un agente configurato con uno strumento mancante, ad esempio `agents.list[].tools.allow: ["query_db"]`, deve generare un errore evidente finché non viene abilitato il Plugin che registra `query_db`, anziché continuare come agente di solo testo.
  </Accordion>
</AccordionGroup>

I criteri degli strumenti supportano abbreviazioni `group:*` che si espandono in più strumenti. Consulta [Gruppi di strumenti](/it/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands) per l'elenco completo.

Le sostituzioni per agente relative ai privilegi elevati (`agents.list[].tools.elevated`) possono limitare ulteriormente l'esecuzione con privilegi elevati per agenti specifici. Consulta [Modalità con privilegi elevati](/it/tools/elevated) per i dettagli.

---

## Migrazione da un singolo agente

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
Le chiavi di configurazione precedenti `agents.defaults.*`/`agents.list[].*` (come `sandbox.perSession`, `agentRuntime`, `embeddedPi`) vengono migrate da `openclaw doctor`; d'ora in avanti, preferisci `agents.defaults` + `agents.list`.
</Note>

---

## Esempi di restrizioni degli strumenti

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
  <Tab title="Esecuzione della shell con gli strumenti del file system disabilitati">
    ```json
    {
      "tools": {
        "allow": ["read", "exec", "process"],
        "deny": ["write", "edit", "apply_patch", "browser", "gateway"]
      }
    }
    ```

    <Warning>
    Questi criteri disabilitano gli strumenti del file system di OpenClaw, ma `exec` rimane una shell e può scrivere file ovunque il file system dell'host o dell'ambiente isolato selezionato lo consenta. Per un agente di sola lettura, nega `exec` e `process` oppure combina l'accesso alla shell con controlli del file system dell'ambiente isolato, come `agents.defaults.sandbox.workspaceAccess: "ro"` o `"none"`.
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

    In questo profilo, `sessions_history` restituisce comunque una vista di richiamo limitata e sanificata, anziché un dump della trascrizione non elaborata. Il richiamo dell'assistente rimuove i tag di ragionamento, la struttura `<relevant-memories>`, i payload XML in testo normale delle chiamate agli strumenti (inclusi `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` e i blocchi troncati delle chiamate agli strumenti), la struttura degradata delle chiamate agli strumenti, i token di controllo del modello ASCII/a larghezza intera trapelati e l'XML non valido delle chiamate agli strumenti MiniMax prima dell'oscuramento e del troncamento.

  </Tab>
</Tabs>

---

## Errore comune: "non-main"

<Warning>
`agents.defaults.sandbox.mode: "non-main"` confronta la chiave della sessione con la chiave della sessione principale (sempre `"main"`; `session.mainKey` non è configurabile dall'utente e OpenClaw avvisa e ignora qualsiasi altro valore), non con l'ID dell'agente. Le sessioni di gruppo/canale ricevono sempre chiavi proprie, quindi vengono considerate non principali e saranno eseguite in un ambiente isolato. Se vuoi che un agente non venga mai eseguito in un ambiente isolato, imposta `agents.list[].sandbox.mode: "off"`.
</Warning>

---

## Verifica

Dopo aver configurato l'ambiente isolato e gli strumenti multi-agente:

<Steps>
  <Step title="Controlla la risoluzione degli agenti">
    ```bash
    openclaw agents list --bindings
    ```
  </Step>
  <Step title="Verifica i contenitori dell'ambiente isolato">
    ```bash
    docker ps --filter "name=openclaw-sbx-"
    ```
  </Step>
  <Step title="Verifica le restrizioni degli strumenti">
    - Invia un messaggio che richieda strumenti soggetti a restrizioni.
    - Verifica che l'agente non possa utilizzare gli strumenti negati.

  </Step>
  <Step title="Monitora i log">
    ```bash
    openclaw logs --follow | grep -E "routing|sandbox|tools"
    ```
  </Step>
</Steps>

---

## Risoluzione dei problemi

<AccordionGroup>
  <Accordion title="L'agente non viene eseguito in un ambiente isolato nonostante `mode: 'all'`">
    - Controlla se è presente un valore globale `agents.defaults.sandbox.mode` che lo sostituisce.
    - La configurazione specifica dell'agente ha la precedenza, quindi imposta `agents.list[].sandbox.mode: "all"`.

  </Accordion>
  <Accordion title="Strumenti ancora disponibili nonostante l'elenco di esclusione">
    - Consulta l'[ordine completo di filtraggio](#tool-restrictions): profilo → profilo del provider → criterio globale → criterio del provider → criterio dell'agente → criterio del provider dell'agente → sandbox → sottoagente.
    - Ogni livello può solo imporre ulteriori restrizioni, non ripristinare autorizzazioni.
    - Consulta [Sandbox, criterio degli strumenti e modalità con privilegi elevati](/it/gateway/sandbox-vs-tool-policy-vs-elevated) per il debug passo passo.

  </Accordion>
  <Accordion title="Container non isolato per agente">
    - Il valore predefinito di `scope` è `"agent"` (un container per ID agente).
    - Imposta `scope: "session"` per avere un container per sessione oppure `scope: "shared"` per riutilizzare un container tra più agenti.

  </Accordion>
</AccordionGroup>

---

## Contenuti correlati

- [Modalità con privilegi elevati](/it/tools/elevated)
- [Instradamento multi-agente](/it/concepts/multi-agent)
- [Configurazione della sandbox](/it/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox, criterio degli strumenti e modalità con privilegi elevati](/it/gateway/sandbox-vs-tool-policy-vs-elevated) — debug di "perché è bloccato?"
- [Sandboxing](/it/gateway/sandboxing) — riferimento completo della sandbox (modalità, ambiti, backend, immagini)
- [Gestione delle sessioni](/it/concepts/session)
