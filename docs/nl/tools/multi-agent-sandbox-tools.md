---
read_when: You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.
sidebarTitle: Multi-agent sandbox and tools
status: active
summary: Sandbox- en toolbeperkingen per agent, prioriteit en voorbeelden
title: Sandbox en tools voor meerdere agents
x-i18n:
    generated_at: "2026-07-12T09:29:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fada3672a0a7ce6eac2a8bffee8329afcd893d97e33d8e9842cb12079397efa6
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 16
---

Elke agent in een opstelling met meerdere agents kan het globale sandbox- en toolbeleid overschrijven. Deze pagina behandelt configuratie per agent, voorrangsregels en voorbeelden.

<CardGroup cols={3}>
  <Card title="Sandboxing" href="/nl/gateway/sandboxing">
    Backends en modi — volledige sandboxreferentie.
  </Card>
  <Card title="Sandbox versus toolbeleid versus verhoogd" href="/nl/gateway/sandbox-vs-tool-policy-vs-elevated">
    Onderzoek waarom iets wordt geblokkeerd.
  </Card>
  <Card title="Verhoogde modus" href="/nl/tools/elevated">
    Verhoogde uitvoering voor vertrouwde afzenders.
  </Card>
</CardGroup>

<Warning>
Authenticatie is per agent afgebakend: elke agent heeft een eigen `agentDir`-authenticatieopslag in `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`. Gebruik `agentDir` nooit opnieuw voor meerdere agents. Agents kunnen terugvallen op de authenticatieprofielen van de standaard-/hoofdagent wanneer ze geen lokaal profiel hebben, maar OAuth-vernieuwingstokens worden niet naar de opslag van secundaire agents gekloond. Als u referenties handmatig kopieert, kopieer dan alleen overdraagbare statische `api_key`- of `token`-profielen.
</Warning>

---

## Configuratievoorbeelden

<AccordionGroup>
  <Accordion title="Voorbeeld 1: Persoonlijke agent + beperkte gezinsagent">
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

    - Agent `main`: draait op de host en heeft volledige toegang tot tools.
    - Agent `family`: draait in Docker (één container per agent) en kan alleen `read` gebruiken en berichten binnen het huidige gesprek verzenden.

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
  <Accordion title="Voorbeeld 2b: Globaal codeerprofiel + agent die alleen berichten verwerkt">
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

    - Standaardagents krijgen codeertools.
    - Agent `support` kan alleen berichten verwerken (+ Slack-tool).

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

## Configuratievoorrang

Wanneer zowel globale (`agents.defaults.*`) als agentspecifieke (`agents.list[].*`) configuraties bestaan:

### Sandboxconfiguratie

Agentspecifieke instellingen overschrijven globale instellingen:

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
`agents.list[].sandbox.{docker,browser,prune}.*` overschrijft `agents.defaults.sandbox.{docker,browser,prune}.*` voor die agent (wordt genegeerd wanneer het sandboxbereik wordt bepaald als `"shared"`).
</Note>

### Toolbeperkingen

De filtervolgorde is:

<Steps>
  <Step title="Toolprofiel">
    `tools.profile` of `agents.list[].tools.profile`.
  </Step>
  <Step title="Toolprofiel van provider">
    `tools.byProvider[provider].profile` of `agents.list[].tools.byProvider[provider].profile`.
  </Step>
  <Step title="Globaal toolbeleid">
    `tools.allow` / `tools.deny`.
  </Step>
  <Step title="Toolbeleid van provider">
    `tools.byProvider[provider].allow/deny`.
  </Step>
  <Step title="Agentspecifiek toolbeleid">
    `agents.list[].tools.allow/deny`.
  </Step>
  <Step title="Providerbeleid van agent">
    `agents.list[].tools.byProvider[provider].allow/deny`.
  </Step>
  <Step title="Toolbeleid van sandbox">
    `tools.sandbox.tools` of `agents.list[].tools.sandbox.tools`.
  </Step>
  <Step title="Toolbeleid van subagent">
    `tools.subagents.tools`, indien van toepassing.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Voorrangsregels">
    - Elk niveau kan tools verder beperken, maar kan tools die op eerdere niveaus zijn geweigerd niet opnieuw toestaan.
    - Als `agents.list[].tools.sandbox.tools` is ingesteld, vervangt dit `tools.sandbox.tools` voor die agent.
    - Als `agents.list[].tools.profile` is ingesteld, overschrijft dit `tools.profile` voor die agent.
    - Toolcodes voor providers accepteren zowel `provider` (bijvoorbeeld `google-antigravity`) als `provider/model` (bijvoorbeeld `openai/gpt-5.4`).

  </Accordion>
  <Accordion title="Gedrag bij een lege toelatingslijst">
    Als een expliciete toelatingslijst in deze keten ervoor zorgt dat er geen aanroepbare tools overblijven, stopt OpenClaw voordat de prompt naar het model wordt verzonden. Dit is opzettelijk: een agent die is geconfigureerd met een ontbrekende tool, zoals `agents.list[].tools.allow: ["query_db"]`, moet duidelijk mislukken totdat de Plugin die `query_db` registreert is ingeschakeld, en mag niet doorgaan als een agent die alleen tekst verwerkt.
  </Accordion>
</AccordionGroup>

Toolbeleid ondersteunt `group:*`-verkortingen die worden uitgebreid naar meerdere tools. Zie [Toolgroepen](/nl/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands) voor de volledige lijst.

Verhoogde overschrijvingen per agent (`agents.list[].tools.elevated`) kunnen verhoogde uitvoering voor specifieke agents verder beperken. Zie [Verhoogde modus](/nl/tools/elevated) voor meer informatie.

---

## Migratie vanaf één agent

<Tabs>
  <Tab title="Voorheen (één agent)">
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
  <Tab title="Daarna (meerdere agents)">
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
Verouderde configuratiecodes onder `agents.defaults.*`/`agents.list[].*` (zoals `sandbox.perSession`, `agentRuntime` en `embeddedPi`) worden door `openclaw doctor` gemigreerd; gebruik voortaan bij voorkeur `agents.defaults` + `agents.list`.
</Note>

---

## Voorbeelden van toolbeperkingen

<Tabs>
  <Tab title="Alleen-lezenagent">
    ```json
    {
      "tools": {
        "allow": ["read"],
        "deny": ["exec", "write", "edit", "apply_patch", "process"]
      }
    }
    ```
  </Tab>
  <Tab title="Shell-uitvoering met uitgeschakelde bestandssysteemtools">
    ```json
    {
      "tools": {
        "allow": ["read", "exec", "process"],
        "deny": ["write", "edit", "apply_patch", "browser", "gateway"]
      }
    }
    ```

    <Warning>
    Dit beleid schakelt de bestandssysteemtools van OpenClaw uit, maar `exec` blijft een shell en kan bestanden schrijven op elke locatie waar het bestandssysteem van de geselecteerde host of sandbox dit toestaat. Weiger voor een alleen-lezenagent `exec` en `process`, of combineer shelltoegang met bestandssysteembeperkingen voor de sandbox, zoals `agents.defaults.sandbox.workspaceAccess: "ro"` of `"none"`.
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

    `sessions_history` retourneert in dit profiel nog steeds een begrensde, opgeschoonde terugblik in plaats van een onbewerkte transcriptdump. De terugblik van de assistent verwijdert denktags, `<relevant-memories>`-structuren, XML-payloads in platte tekst voor toolaanroepen (waaronder `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` en afgekorte toolaanroepblokken), gedegradeerde toolaanroepstructuren, gelekte ASCII-/volledige-breedtebesturingstokens van het model en ongeldige XML voor MiniMax-toolaanroepen voordat redactie en afkapping plaatsvinden.

  </Tab>
</Tabs>

---

## Veelvoorkomende valkuil: "non-main"

<Warning>
`agents.defaults.sandbox.mode: "non-main"` vergelijkt de sessiesleutel met de sleutel van de hoofdsessie (altijd `"main"`; `session.mainKey` kan niet door de gebruiker worden geconfigureerd en OpenClaw waarschuwt bij elke andere waarde en negeert deze), niet met de agent-id. Groeps-/kanaalsessies krijgen altijd hun eigen sleutels, waardoor ze als niet-hoofdsessies worden behandeld en in een sandbox worden uitgevoerd. Als u wilt dat een agent nooit in een sandbox wordt uitgevoerd, stelt u `agents.list[].sandbox.mode: "off"` in.
</Warning>

---

## Testen

Na het configureren van de sandbox en tools voor meerdere agents:

<Steps>
  <Step title="Agentbepaling controleren">
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
    - Verzend een bericht waarvoor beperkte tools nodig zijn.
    - Controleer of de agent geweigerde tools niet kan gebruiken.

  </Step>
  <Step title="Logboeken bewaken">
    ```bash
    openclaw logs --follow | grep -E "routing|sandbox|tools"
    ```
  </Step>
</Steps>

---

## Problemen oplossen

<AccordionGroup>
  <Accordion title="Agent wordt ondanks `mode: 'all'` niet in een sandbox uitgevoerd">
    - Controleer of er een globale `agents.defaults.sandbox.mode` bestaat die deze instelling overschrijft.
    - Agentspecifieke configuratie heeft voorrang; stel daarom `agents.list[].sandbox.mode: "all"` in.

  </Accordion>
  <Accordion title="Tools nog steeds beschikbaar ondanks de weigeringslijst">
    - Controleer de [volledige filtervolgorde](#tool-restrictions): profiel → providerprofiel → globaal beleid → providerbeleid → agentbeleid → agentproviderbeleid → sandbox → subagent.
    - Elk niveau kan alleen verdere beperkingen opleggen, niet opnieuw toegang verlenen.
    - Zie [Sandbox versus toolbeleid versus verhoogde modus](/nl/gateway/sandbox-vs-tool-policy-vs-elevated) voor stapsgewijze foutopsporing.

  </Accordion>
  <Accordion title="Container niet per agent geïsoleerd">
    - De standaardwaarde voor `scope` is `"agent"` (één container per agent-ID).
    - Stel `scope: "session"` in voor één container per sessie, of `scope: "shared"` om één container voor meerdere agents te hergebruiken.

  </Accordion>
</AccordionGroup>

---

## Gerelateerd

- [Verhoogde modus](/nl/tools/elevated)
- [Routering met meerdere agents](/nl/concepts/multi-agent)
- [Sandboxconfiguratie](/nl/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox versus toolbeleid versus verhoogde modus](/nl/gateway/sandbox-vs-tool-policy-vs-elevated) — foutopsporing voor "waarom wordt dit geblokkeerd?"
- [Sandboxing](/nl/gateway/sandboxing) — volledige sandboxreferentie (modi, bereiken, backends, images)
- [Sessiebeheer](/nl/concepts/session)
