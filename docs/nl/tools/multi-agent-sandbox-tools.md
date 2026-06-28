---
read_when: You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.
sidebarTitle: Multi-agent sandbox and tools
status: active
summary: Sandbox per agent + toolbeperkingen, prioriteit en voorbeelden
title: Sandboxomgeving en hulpmiddelen voor meerdere agenten
x-i18n:
    generated_at: "2026-05-11T20:53:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d11af55e30996a89e665b258604108a93f4c4271fbe4edfd1caf54864e40f01
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Elke agent in een multi-agentconfiguratie kan de globale sandbox- en tool-policy overschrijven. Deze pagina behandelt configuratie per agent, prioriteitsregels en voorbeelden.

<CardGroup cols={3}>
  <Card title="Sandboxing" href="/nl/gateway/sandboxing">
    Backends en modi — volledige sandboxreferentie.
  </Card>
  <Card title="Sandbox vs tool-policy vs verhoogd" href="/nl/gateway/sandbox-vs-tool-policy-vs-elevated">
    Debuggen: "waarom wordt dit geblokkeerd?"
  </Card>
  <Card title="Verhoogde modus" href="/nl/tools/elevated">
    Verhoogde exec voor vertrouwde afzenders.
  </Card>
</CardGroup>

<Warning>
Auth is per agent afgebakend: elke agent heeft zijn eigen `agentDir`-authopslag op `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`. Hergebruik `agentDir` nooit tussen agents. Agents kunnen de authprofielen van de standaard-/hoofdagent uitlezen wanneer ze geen lokaal profiel hebben, maar OAuth-refresh tokens worden niet gekloond naar secundaire agentopslag. Als je handmatig referenties kopieert, kopieer dan alleen draagbare statische `api_key`- of `token`-profielen.
</Warning>

---

## Configuratievoorbeelden

<AccordionGroup>
  <Accordion title="Voorbeeld 1: Persoonlijke + beperkte familieagent">
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

    **Resultaat:**

    - `main`-agent: draait op de host, volledige tooltoegang.
    - `family`-agent: draait in Docker (één container per agent), alleen `read` en berichten verzenden in het huidige gesprek.

  </Accordion>
  <Accordion title="Voorbeeld 2: Werkagent met gedeelde sandbox">
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
  <Accordion title="Voorbeeld 2b: Globaal codeerprofiel + agent voor alleen berichten">
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

    **Resultaat:**

    - standaardagents krijgen codeertools.
    - `support`-agent is alleen voor berichten (+ Slack-tool).

  </Accordion>
  <Accordion title="Voorbeeld 3: Verschillende sandboxmodi per agent">
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

## Configuratieprioriteit

Wanneer zowel globale (`agents.defaults.*`) als agentspecifieke (`agents.list[].*`) configuraties bestaan:

### Sandboxconfiguratie

Agentspecifieke instellingen overschrijven globale instellingen:

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
`agents.list[].sandbox.{docker,browser,prune}.*` overschrijft `agents.defaults.sandbox.{docker,browser,prune}.*` voor die agent (genegeerd wanneer de sandboxscope wordt herleid tot `"shared"`).
</Note>

### Toolbeperkingen

De filtervolgorde is:

<Steps>
  <Step title="Toolprofiel">
    `tools.profile` of `agents.list[].tools.profile`.
  </Step>
  <Step title="Provider-toolprofiel">
    `tools.byProvider[provider].profile` of `agents.list[].tools.byProvider[provider].profile`.
  </Step>
  <Step title="Globale tool-policy">
    `tools.allow` / `tools.deny`.
  </Step>
  <Step title="Provider-tool-policy">
    `tools.byProvider[provider].allow/deny`.
  </Step>
  <Step title="Agentspecifieke tool-policy">
    `agents.list[].tools.allow/deny`.
  </Step>
  <Step title="Agent-provider-policy">
    `agents.list[].tools.byProvider[provider].allow/deny`.
  </Step>
  <Step title="Sandbox-tool-policy">
    `tools.sandbox.tools` of `agents.list[].tools.sandbox.tools`.
  </Step>
  <Step title="Subagent-tool-policy">
    `tools.subagents.tools`, indien van toepassing.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Prioriteitsregels">
    - Elk niveau kan tools verder beperken, maar kan eerder geweigerde tools niet opnieuw toestaan.
    - Als `agents.list[].tools.sandbox.tools` is ingesteld, vervangt dit `tools.sandbox.tools` voor die agent.
    - Als `agents.list[].tools.profile` is ingesteld, overschrijft dit `tools.profile` voor die agent.
    - Provider-toolsleutels accepteren `provider` (bijv. `google-antigravity`) of `provider/model` (bijv. `openai/gpt-5.4`).

  </Accordion>
  <Accordion title="Gedrag bij lege allowlist">
    Als een expliciete allowlist in die keten ervoor zorgt dat de run geen aanroepbare tools meer heeft, stopt OpenClaw voordat de prompt naar het model wordt gestuurd. Dit is opzettelijk: een agent die is geconfigureerd met een ontbrekende tool zoals `agents.list[].tools.allow: ["query_db"]` moet duidelijk falen totdat de Plugin die `query_db` registreert is ingeschakeld, en niet doorgaan als tekst-only agent.
  </Accordion>
</AccordionGroup>

Tool-policies ondersteunen `group:*`-verkortingen die worden uitgebreid naar meerdere tools. Zie [Toolgroepen](/nl/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands) voor de volledige lijst.

Verhoogde overschrijvingen per agent (`agents.list[].tools.elevated`) kunnen verhoogde exec voor specifieke agents verder beperken. Zie [Verhoogde modus](/nl/tools/elevated) voor details.

---

## Migratie van één agent

<Tabs>
  <Tab title="Vóór (één agent)">
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
  <Tab title="Na (multi-agent)">
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
Verouderde `agent.*`-configuraties worden gemigreerd door `openclaw doctor`; geef voortaan de voorkeur aan `agents.defaults` + `agents.list`.
</Note>

---

## Voorbeelden van toolbeperkingen

<Tabs>
  <Tab title="Alleen-lezen-agent">
    ```json
    {
      "tools": {
        "allow": ["read"],
        "deny": ["exec", "write", "edit", "apply_patch", "process"]
      }
    }
    ```
  </Tab>
  <Tab title="Shelluitvoering met bestandssysteemtools uitgeschakeld">
    ```json
    {
      "tools": {
        "allow": ["read", "exec", "process"],
        "deny": ["write", "edit", "apply_patch", "browser", "gateway"]
      }
    }
    ```

    <Warning>
    Dit beleid schakelt de bestandssysteemtools van OpenClaw uit, maar `exec` is nog steeds een shell en kan bestanden schrijven overal waar de geselecteerde host of het sandboxbestandssysteem dit toestaat. Weiger voor een alleen-lezen-agent `exec` en `process`, of combineer shelltoegang met sandboxbestandssysteemcontroles zoals `agents.defaults.sandbox.workspaceAccess: "ro"` of `"none"`.
    </Warning>

  </Tab>
  <Tab title="Alleen communicatie">
    ```json
    {
      "tools": {
        "sessions": { "visibility": "tree" },
        "allow": ["sessions_list", "sessions_send", "sessions_history", "session_status"],
        "deny": ["exec", "write", "edit", "apply_patch", "read", "browser"]
      }
    }
    ```

    `sessions_history` in dit profiel retourneert nog steeds een begrensde, opgeschoonde recall-weergave in plaats van een ruwe transcriptdump. Assistant-recall verwijdert denktags, `<relevant-memories>`-scaffolding, tool-call-XML-payloads in platte tekst (inclusief `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` en afgekorte tool-call-blokken), gedegradeerde tool-call-scaffolding, gelekte ASCII-/full-width-modelcontroletokens en misvormde MiniMax-tool-call-XML vóór redactie/afkapping.

  </Tab>
</Tabs>

---

## Veelvoorkomende valkuil: "non-main"

<Warning>
`agents.defaults.sandbox.mode: "non-main"` is gebaseerd op `session.mainKey` (standaard `"main"`), niet op de agent-id. Groeps-/kanaalsessies krijgen altijd hun eigen sleutels, dus ze worden behandeld als niet-main en worden gesandboxed. Als je wilt dat een agent nooit wordt gesandboxed, stel dan `agents.list[].sandbox.mode: "off"` in.
</Warning>

---

## Testen

Na het configureren van multi-agent-sandbox en tools:

<Steps>
  <Step title="Agentresolutie controleren">
    ```bash
    openclaw agents list --bindings
    ```
  </Step>
  <Step title="Sandboxcontainers verifiëren">
    ```bash
    docker ps --filter "name=openclaw-sbx-"
    ```
  </Step>
  <Step title="Toolbeperkingen testen">
    - Stuur een bericht waarvoor beperkte tools nodig zijn.
    - Controleer of de agent geweigerde tools niet kan gebruiken.

  </Step>
  <Step title="Logs monitoren">
    ```bash
    tail -f "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}/logs/gateway.log" | grep -E "routing|sandbox|tools"
    ```
  </Step>
</Steps>

---

## Problemen oplossen

<AccordionGroup>
  <Accordion title="Agent niet gesandboxed ondanks `mode: 'all'`">
    - Controleer of er een globale `agents.defaults.sandbox.mode` is die dit overschrijft.
    - Agentspecifieke configuratie heeft voorrang, dus stel `agents.list[].sandbox.mode: "all"` in.

  </Accordion>
  <Accordion title="Tools nog steeds beschikbaar ondanks deny-lijst">
    - Controleer de volgorde van toolfiltering: globaal → agent → sandbox → subagent.
    - Elk niveau kan alleen verder beperken, niet opnieuw toestaan.
    - Verifieer met logs: `[tools] filtering tools for agent:${agentId}`.

  </Accordion>
  <Accordion title="Container niet per agent geïsoleerd">
    - Stel `scope: "agent"` in in agentspecifieke sandboxconfiguratie.
    - De standaard is `"session"`, waarmee één container per sessie wordt gemaakt.

  </Accordion>
</AccordionGroup>

---

## Gerelateerd

- [Verhoogde modus](/nl/tools/elevated)
- [Routering met meerdere agents](/nl/concepts/multi-agent)
- [Sandboxconfiguratie](/nl/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox versus toolbeleid versus verhoogd](/nl/gateway/sandbox-vs-tool-policy-vs-elevated) — foutopsporing voor "waarom is dit geblokkeerd?"
- [Sandboxing](/nl/gateway/sandboxing) — volledige sandboxreferentie (modi, bereiken, backends, containerimages)
- [Sessiebeheer](/nl/concepts/session)
