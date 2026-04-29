---
read_when: You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.
sidebarTitle: Multi-agent sandbox and tools
status: active
summary: Sandbox- en toolbeperkingen per agent, prioriteit en voorbeelden
title: Sandbox en hulpmiddelen voor meerdere agenten
x-i18n:
    generated_at: "2026-04-29T23:25:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: eedb36301f670bcd8956dbeb81788acfc96627e39401e34434c2348fcb10f155
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 16
---

Elke agent in een multi-agent-configuratie kan de globale sandbox- en toolpolicy overschrijven. Deze pagina behandelt configuratie per agent, voorrangsregels en voorbeelden.

<CardGroup cols={3}>
  <Card title="Sandboxing" href="/nl/gateway/sandboxing">
    Backends en modi — volledige sandboxreferentie.
  </Card>
  <Card title="Sandbox vs tool policy vs elevated" href="/nl/gateway/sandbox-vs-tool-policy-vs-elevated">
    Debuggen: "waarom is dit geblokkeerd?"
  </Card>
  <Card title="Elevated mode" href="/nl/tools/elevated">
    Elevated exec voor vertrouwde afzenders.
  </Card>
</CardGroup>

<Warning>
Auth is per agent afgebakend: elke agent heeft zijn eigen `agentDir`-authopslag op `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`. Hergebruik `agentDir` nooit tussen agents. Agents kunnen auth-profielen van de standaard-/hoofd-agent lezen wanneer ze geen lokaal profiel hebben, maar OAuth-vernieuwingstokens worden niet gekloond naar opslag voor secundaire agents. Als je inloggegevens handmatig kopieert, kopieer dan alleen draagbare statische `api_key`- of `token`-profielen.
</Warning>

---

## Configuratievoorbeelden

<AccordionGroup>
  <Accordion title="Voorbeeld 1: persoonlijke + beperkte gezinsagent">
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

    **Resultaat:**

    - `main`-agent: draait op host, volledige tooltoegang.
    - `family`-agent: draait in Docker (één container per agent), alleen de `read`-tool.

  </Accordion>
  <Accordion title="Voorbeeld 2: werkagent met gedeelde sandbox">
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
  <Accordion title="Voorbeeld 2b: globaal codeerprofiel + agent alleen voor berichten">
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
  <Accordion title="Voorbeeld 3: verschillende sandboxmodi per agent">
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

## Configuratievoorrang

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
`agents.list[].sandbox.{docker,browser,prune}.*` overschrijft `agents.defaults.sandbox.{docker,browser,prune}.*` voor die agent (genegeerd wanneer sandboxbereik oplost naar `"shared"`).
</Note>

### Toolbeperkingen

De filtervolgorde is:

<Steps>
  <Step title="Toolprofiel">
    `tools.profile` of `agents.list[].tools.profile`.
  </Step>
  <Step title="Providertoolprofiel">
    `tools.byProvider[provider].profile` of `agents.list[].tools.byProvider[provider].profile`.
  </Step>
  <Step title="Globale toolpolicy">
    `tools.allow` / `tools.deny`.
  </Step>
  <Step title="Providertoolpolicy">
    `tools.byProvider[provider].allow/deny`.
  </Step>
  <Step title="Agentspecifieke toolpolicy">
    `agents.list[].tools.allow/deny`.
  </Step>
  <Step title="Agentproviderpolicy">
    `agents.list[].tools.byProvider[provider].allow/deny`.
  </Step>
  <Step title="Sandboxtoolpolicy">
    `tools.sandbox.tools` of `agents.list[].tools.sandbox.tools`.
  </Step>
  <Step title="Subagent-toolpolicy">
    `tools.subagents.tools`, indien van toepassing.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Voorrangsregels">
    - Elk niveau kan tools verder beperken, maar kan eerder geweigerde tools niet opnieuw toestaan.
    - Als `agents.list[].tools.sandbox.tools` is ingesteld, vervangt dit `tools.sandbox.tools` voor die agent.
    - Als `agents.list[].tools.profile` is ingesteld, overschrijft dit `tools.profile` voor die agent.
    - Providertool-sleutels accepteren zowel `provider` (bijv. `google-antigravity`) als `provider/model` (bijv. `openai/gpt-5.4`).

  </Accordion>
  <Accordion title="Gedrag bij lege allowlist">
    Als een expliciete allowlist in die keten ervoor zorgt dat de run geen aanroepbare tools meer heeft, stopt OpenClaw voordat de prompt naar het model wordt gestuurd. Dit is opzettelijk: een agent die is geconfigureerd met een ontbrekende tool zoals `agents.list[].tools.allow: ["query_db"]` moet duidelijk falen totdat de Plugin die `query_db` registreert is ingeschakeld, en niet doorgaan als agent met alleen tekst.
  </Accordion>
</AccordionGroup>

Toolpolicy's ondersteunen `group:*`-verkortingen die uitvouwen naar meerdere tools. Zie [Toolgroepen](/nl/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands) voor de volledige lijst.

Per-agent elevated-overschrijvingen (`agents.list[].tools.elevated`) kunnen elevated exec voor specifieke agents verder beperken. Zie [Elevated mode](/nl/tools/elevated) voor details.

---

## Migratie vanaf één agent

<Tabs>
  <Tab title="Voor (één agent)">
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
  <Tab title="Alleen-lezen agent">
    ```json
    {
      "tools": {
        "allow": ["read"],
        "deny": ["exec", "write", "edit", "apply_patch", "process"]
      }
    }
    ```
  </Tab>
  <Tab title="Veilige uitvoering (geen bestandswijzigingen)">
    ```json
    {
      "tools": {
        "allow": ["read", "exec", "process"],
        "deny": ["write", "edit", "apply_patch", "browser", "gateway"]
      }
    }
    ```
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

    `sessions_history` in dit profiel retourneert nog steeds een begrensde, opgeschoonde recall-weergave in plaats van een ruwe transcriptdump. Assistant-recall verwijdert denktags, `<relevant-memories>`-scaffolding, platte-tekst XML-payloads voor toolaanroepen (waaronder `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` en afgekorte toolaanroepblokken), gedegradeerde toolaanroep-scaffolding, gelekte ASCII-/full-width modelbesturingstokens en misvormde MiniMax-toolaanroep-XML vóór redactie/afkapping.

  </Tab>
</Tabs>

---

## Veelvoorkomende valkuil: "non-main"

<Warning>
`agents.defaults.sandbox.mode: "non-main"` is gebaseerd op `session.mainKey` (standaard `"main"`), niet op de agent-id. Groeps-/kanaalsessies krijgen altijd hun eigen sleutels, dus ze worden behandeld als non-main en in een sandbox geplaatst. Als je wilt dat een agent nooit in een sandbox wordt geplaatst, stel dan `agents.list[].sandbox.mode: "off"` in.
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
  <Step title="Logs bewaken">
    ```bash
    tail -f "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}/logs/gateway.log" | grep -E "routing|sandbox|tools"
    ```
  </Step>
</Steps>

---

## Probleemoplossing

<AccordionGroup>
  <Accordion title="Agent niet in sandbox ondanks `mode: 'all'`">
    - Controleer of er een globale `agents.defaults.sandbox.mode` is die dit overschrijft.
    - Agentspecifieke configuratie heeft voorrang, dus stel `agents.list[].sandbox.mode: "all"` in.

  </Accordion>
  <Accordion title="Tools nog steeds beschikbaar ondanks denylist">
    - Controleer de toolfiltervolgorde: globaal → agent → sandbox → subagent.
    - Elk niveau kan alleen verder beperken, niet opnieuw toestaan.
    - Verifieer met logs: `[tools] filtering tools for agent:${agentId}`.

  </Accordion>
  <Accordion title="Container niet per agent geïsoleerd">
    - Stel `scope: "agent"` in de agentspecifieke sandboxconfiguratie in.
    - Standaard is `"session"`, wat één container per sessie maakt.

  </Accordion>
</AccordionGroup>

---

## Gerelateerd

- [Elevated mode](/nl/tools/elevated)
- [Multi-agent-routing](/nl/concepts/multi-agent)
- [Sandboxconfiguratie](/nl/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox vs tool policy vs elevated](/nl/gateway/sandbox-vs-tool-policy-vs-elevated) — debuggen: "waarom is dit geblokkeerd?"
- [Sandboxing](/nl/gateway/sandboxing) — volledige sandboxreferentie (modi, bereiken, backends, images)
- [Sessiebeheer](/nl/concepts/session)
