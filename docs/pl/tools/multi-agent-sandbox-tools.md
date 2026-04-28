---
read_when: You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.
sidebarTitle: Multi-agent sandbox and tools
status: active
summary: Ograniczenia sandbox i narzędzi per agent, priorytety oraz przykłady
title: Sandbox i narzędzia dla wielu agentów
x-i18n:
    generated_at: "2026-04-26T11:43:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8b8d24252b03dbcd00a5eefcc8e58bd51577a99ae057008f19a0acc4016413ea
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 15
---

Każdy agent w konfiguracji wieloagentowej może nadpisywać globalny sandbox i politykę narzędzi. Ta strona opisuje konfigurację per agent, zasady priorytetów i przykłady.

<CardGroup cols={3}>
  <Card title="Sandboxing" href="/pl/gateway/sandboxing">
    Backendy i tryby — pełna dokumentacja sandbox.
  </Card>
  <Card title="Sandbox vs tool policy vs elevated" href="/pl/gateway/sandbox-vs-tool-policy-vs-elevated">
    Debugowanie „dlaczego to jest blokowane?”.
  </Card>
  <Card title="Elevated mode" href="/pl/tools/elevated">
    Elevated exec dla zaufanych nadawców.
  </Card>
</CardGroup>

<Warning>
Uwierzytelnianie jest per agent: każdy agent odczytuje dane z własnego magazynu auth w `agentDir` pod `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`. Poświadczenia **nie** są współdzielone między agentami. Nigdy nie używaj ponownie `agentDir` dla wielu agentów. Jeśli chcesz współdzielić poświadczenia, skopiuj `auth-profiles.json` do `agentDir` drugiego agenta.
</Warning>

---

## Przykłady konfiguracji

<AccordionGroup>
  <Accordion title="Przykład 1: osobisty agent + ograniczony agent rodzinny">
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

    **Wynik:**

    - agent `main`: działa na hoście, pełny dostęp do narzędzi.
    - agent `family`: działa w Docker (jeden kontener na agenta), tylko narzędzie `read`.

  </Accordion>
  <Accordion title="Przykład 2: agent do pracy ze współdzielonym sandbox">
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
  <Accordion title="Przykład 2b: globalny profil coding + agent tylko do komunikacji">
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

    **Wynik:**

    - domyślni agenci otrzymują narzędzia coding.
    - agent `support` jest tylko do komunikacji (+ narzędzie Slack).

  </Accordion>
  <Accordion title="Przykład 3: różne tryby sandbox per agent">
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

## Priorytety konfiguracji

Gdy istnieją zarówno konfiguracje globalne (`agents.defaults.*`), jak i specyficzne dla agenta (`agents.list[].*`):

### Konfiguracja sandbox

Ustawienia specyficzne dla agenta nadpisują ustawienia globalne:

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
`agents.list[].sandbox.{docker,browser,prune}.*` nadpisuje `agents.defaults.sandbox.{docker,browser,prune}.*` dla tego agenta (ignorowane, gdy zakres sandbox rozwiązuje się do `"shared"`).
</Note>

### Ograniczenia narzędzi

Kolejność filtrowania jest następująca:

<Steps>
  <Step title="Profil narzędzi">
    `tools.profile` lub `agents.list[].tools.profile`.
  </Step>
  <Step title="Profil narzędzi dostawcy">
    `tools.byProvider[provider].profile` lub `agents.list[].tools.byProvider[provider].profile`.
  </Step>
  <Step title="Globalna polityka narzędzi">
    `tools.allow` / `tools.deny`.
  </Step>
  <Step title="Polityka narzędzi dostawcy">
    `tools.byProvider[provider].allow/deny`.
  </Step>
  <Step title="Polityka narzędzi specyficzna dla agenta">
    `agents.list[].tools.allow/deny`.
  </Step>
  <Step title="Polityka dostawcy agenta">
    `agents.list[].tools.byProvider[provider].allow/deny`.
  </Step>
  <Step title="Polityka narzędzi sandbox">
    `tools.sandbox.tools` lub `agents.list[].tools.sandbox.tools`.
  </Step>
  <Step title="Polityka narzędzi subagent">
    `tools.subagents.tools`, jeśli dotyczy.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Zasady priorytetów">
    - Każdy poziom może dalej ograniczać narzędzia, ale nie może przywrócić narzędzi odrzuconych na wcześniejszych poziomach.
    - Jeśli ustawiono `agents.list[].tools.sandbox.tools`, zastępuje ono `tools.sandbox.tools` dla tego agenta.
    - Jeśli ustawiono `agents.list[].tools.profile`, nadpisuje ono `tools.profile` dla tego agenta.
    - Klucze narzędzi dostawcy akceptują zarówno `provider` (np. `google-antigravity`), jak i `provider/model` (np. `openai/gpt-5.4`).

  </Accordion>
  <Accordion title="Zachowanie pustej listy dozwolonych">
    Jeśli jakakolwiek jawna lista dozwolonych w tym łańcuchu pozostawi uruchomienie bez wywoływalnych narzędzi, OpenClaw zatrzymuje się przed wysłaniem promptu do modelu. Jest to zamierzone: agent skonfigurowany z brakującym narzędziem, takim jak `agents.list[].tools.allow: ["query_db"]`, powinien zakończyć się głośnym błędem, dopóki nie zostanie włączony Plugin rejestrujący `query_db`, a nie działać dalej jako agent wyłącznie tekstowy.
  </Accordion>
</AccordionGroup>

Polityki narzędzi obsługują skróty `group:*`, które rozwijają się do wielu narzędzi. Pełną listę znajdziesz w [Grupy narzędzi](/pl/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands).

Nadpisania elevated per agent (`agents.list[].tools.elevated`) mogą dodatkowo ograniczać elevated exec dla konkretnych agentów. Szczegóły znajdziesz w [Elevated mode](/pl/tools/elevated).

---

## Migracja z pojedynczego agenta

<Tabs>
  <Tab title="Przed (pojedynczy agent)">
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
  <Tab title="Po (wielu agentów)">
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
Starsze konfiguracje `agent.*` są migrowane przez `openclaw doctor`; od teraz preferuj `agents.defaults` + `agents.list`.
</Note>

---

## Przykłady ograniczeń narzędzi

<Tabs>
  <Tab title="Agent tylko do odczytu">
    ```json
    {
      "tools": {
        "allow": ["read"],
        "deny": ["exec", "write", "edit", "apply_patch", "process"]
      }
    }
    ```
  </Tab>
  <Tab title="Bezpieczne wykonywanie (bez modyfikacji plików)">
    ```json
    {
      "tools": {
        "allow": ["read", "exec", "process"],
        "deny": ["write", "edit", "apply_patch", "browser", "gateway"]
      }
    }
    ```
  </Tab>
  <Tab title="Tylko komunikacja">
    ```json
    {
      "tools": {
        "sessions": { "visibility": "tree" },
        "allow": ["sessions_list", "sessions_send", "sessions_history", "session_status"],
        "deny": ["exec", "write", "edit", "apply_patch", "read", "browser"]
      }
    }
    ```

    `sessions_history` w tym profilu nadal zwraca ograniczony, oczyszczony widok historii zamiast surowego zrzutu transkrypcji. Przywołanie asystenta usuwa tagi myślenia, szkielety `<relevant-memories>`, ładunki XML wywołań narzędzi w postaci zwykłego tekstu (w tym `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` oraz obcięte bloki wywołań narzędzi), zdegradowane szkielety wywołań narzędzi, ujawnione tokeny sterujące modelu ASCII/full-width oraz nieprawidłowy XML wywołań narzędzi MiniMax przed redakcją/obcięciem.

  </Tab>
</Tabs>

---

## Częsta pułapka: "non-main"

<Warning>
`agents.defaults.sandbox.mode: "non-main"` opiera się na `session.mainKey` (domyślnie `"main"`), a nie na identyfikatorze agenta. Sesje grupowe/kanałowe zawsze otrzymują własne klucze, więc są traktowane jako non-main i będą uruchamiane w sandbox. Jeśli chcesz, aby agent nigdy nie używał sandbox, ustaw `agents.list[].sandbox.mode: "off"`.
</Warning>

---

## Testowanie

Po skonfigurowaniu sandbox i narzędzi dla wielu agentów:

<Steps>
  <Step title="Sprawdź rozwiązywanie agentów">
    ```bash
    openclaw agents list --bindings
    ```
  </Step>
  <Step title="Zweryfikuj kontenery sandbox">
    ```bash
    docker ps --filter "name=openclaw-sbx-"
    ```
  </Step>
  <Step title="Przetestuj ograniczenia narzędzi">
    - Wyślij wiadomość wymagającą ograniczonych narzędzi.
    - Zweryfikuj, że agent nie może używać narzędzi z listy deny.

  </Step>
  <Step title="Monitoruj logi">
    ```bash
    tail -f "${OPENCLAW_STATE_DIR:-$HOME/.openclaw}/logs/gateway.log" | grep -E "routing|sandbox|tools"
    ```
  </Step>
</Steps>

---

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Agent nie jest uruchamiany w sandbox mimo `mode: 'all'`">
    - Sprawdź, czy istnieje globalne `agents.defaults.sandbox.mode`, które to nadpisuje.
    - Konfiguracja specyficzna dla agenta ma pierwszeństwo, więc ustaw `agents.list[].sandbox.mode: "all"`.

  </Accordion>
  <Accordion title="Narzędzia nadal są dostępne mimo listy deny">
    - Sprawdź kolejność filtrowania narzędzi: globalne → agent → sandbox → subagent.
    - Każdy poziom może tylko dalej ograniczać, a nie przywracać.
    - Zweryfikuj w logach: `[tools] filtering tools for agent:${agentId}`.

  </Accordion>
  <Accordion title="Kontener nie jest izolowany per agent">
    - Ustaw `scope: "agent"` w konfiguracji sandbox specyficznej dla agenta.
    - Domyślnie jest `"session"`, co tworzy jeden kontener na sesję.

  </Accordion>
</AccordionGroup>

---

## Powiązane

- [Elevated mode](/pl/tools/elevated)
- [Routing wielu agentów](/pl/concepts/multi-agent)
- [Konfiguracja sandbox](/pl/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox vs tool policy vs elevated](/pl/gateway/sandbox-vs-tool-policy-vs-elevated) — debugowanie „dlaczego to jest blokowane?”
- [Sandboxing](/pl/gateway/sandboxing) — pełna dokumentacja sandbox (tryby, zakresy, backendy, obrazy)
- [Zarządzanie sesjami](/pl/concepts/session)
