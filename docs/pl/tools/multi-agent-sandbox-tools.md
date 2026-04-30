---
read_when: You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.
sidebarTitle: Multi-agent sandbox and tools
status: active
summary: Piaskownica + ograniczenia narzędzi dla poszczególnych agentów, kolejność pierwszeństwa i przykłady
title: Piaskownica i narzędzia dla wielu agentów
x-i18n:
    generated_at: "2026-04-30T10:23:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: eedb36301f670bcd8956dbeb81788acfc96627e39401e34434c2348fcb10f155
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 16
---

Każdy agent w konfiguracji wieloagentowej może nadpisać globalne zasady sandboxa i narzędzi. Ta strona omawia konfigurację dla poszczególnych agentów, reguły pierwszeństwa i przykłady.

<CardGroup cols={3}>
  <Card title="Izolacja w sandboxie" href="/pl/gateway/sandboxing">
    Backendy i tryby — pełna dokumentacja sandboxa.
  </Card>
  <Card title="Sandbox a zasady narzędzi a tryb podwyższony" href="/pl/gateway/sandbox-vs-tool-policy-vs-elevated">
    Debugowanie „dlaczego to jest zablokowane?”
  </Card>
  <Card title="Tryb podwyższony" href="/pl/tools/elevated">
    Podwyższony exec dla zaufanych nadawców.
  </Card>
</CardGroup>

<Warning>
Uwierzytelnianie jest ograniczone do agenta: każdy agent ma własny magazyn uwierzytelniania `agentDir` w `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`. Nigdy nie używaj ponownie `agentDir` między agentami. Agenci mogą odczytywać profile uwierzytelniania domyślnego/głównego agenta, gdy nie mają profilu lokalnego, ale tokeny odświeżania OAuth nie są klonowane do magazynów agentów dodatkowych. Jeśli ręcznie kopiujesz poświadczenia, kopiuj tylko przenośne statyczne profile `api_key` lub `token`.
</Warning>

---

## Przykłady konfiguracji

<AccordionGroup>
  <Accordion title="Przykład 1: Agent osobisty + ograniczony agent rodzinny">
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

    - Agent `main`: działa na hoście, pełny dostęp do narzędzi.
    - Agent `family`: działa w Dockerze (jeden kontener na agenta), tylko narzędzie `read`.

  </Accordion>
  <Accordion title="Przykład 2: Agent służbowy ze współdzielonym sandboxem">
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
  <Accordion title="Przykład 2b: Globalny profil kodowania + agent tylko do wiadomości">
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

    - Domyślni agenci otrzymują narzędzia do kodowania.
    - Agent `support` działa tylko z wiadomościami (+ narzędzie Slack).

  </Accordion>
  <Accordion title="Przykład 3: Różne tryby sandboxa dla agentów">
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

## Pierwszeństwo konfiguracji

Gdy istnieją zarówno konfiguracje globalne (`agents.defaults.*`), jak i specyficzne dla agenta (`agents.list[].*`):

### Konfiguracja sandboxa

Ustawienia specyficzne dla agenta nadpisują globalne:

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
`agents.list[].sandbox.{docker,browser,prune}.*` nadpisuje `agents.defaults.sandbox.{docker,browser,prune}.*` dla tego agenta (ignorowane, gdy zakres sandboxa zostanie rozstrzygnięty jako `"shared"`).
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
  <Step title="Globalne zasady narzędzi">
    `tools.allow` / `tools.deny`.
  </Step>
  <Step title="Zasady narzędzi dostawcy">
    `tools.byProvider[provider].allow/deny`.
  </Step>
  <Step title="Zasady narzędzi specyficzne dla agenta">
    `agents.list[].tools.allow/deny`.
  </Step>
  <Step title="Zasady dostawcy dla agenta">
    `agents.list[].tools.byProvider[provider].allow/deny`.
  </Step>
  <Step title="Zasady narzędzi sandboxa">
    `tools.sandbox.tools` lub `agents.list[].tools.sandbox.tools`.
  </Step>
  <Step title="Zasady narzędzi subagenta">
    `tools.subagents.tools`, jeśli dotyczy.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Reguły pierwszeństwa">
    - Każdy poziom może dalej ograniczać narzędzia, ale nie może przywrócić narzędzi zablokowanych na wcześniejszych poziomach.
    - Jeśli ustawiono `agents.list[].tools.sandbox.tools`, zastępuje ono `tools.sandbox.tools` dla tego agenta.
    - Jeśli ustawiono `agents.list[].tools.profile`, nadpisuje ono `tools.profile` dla tego agenta.
    - Klucze narzędzi dostawcy akceptują `provider` (np. `google-antigravity`) albo `provider/model` (np. `openai/gpt-5.4`).

  </Accordion>
  <Accordion title="Zachowanie pustej listy dozwolonych">
    Jeśli jakakolwiek jawna lista dozwolonych w tym łańcuchu pozostawi uruchomienie bez możliwych do wywołania narzędzi, OpenClaw zatrzyma się przed przesłaniem promptu do modelu. To celowe: agent skonfigurowany z brakującym narzędziem, takim jak `agents.list[].tools.allow: ["query_db"]`, powinien jasno zakończyć się błędem, dopóki Plugin rejestrujący `query_db` nie zostanie włączony, zamiast kontynuować jako agent wyłącznie tekstowy.
  </Accordion>
</AccordionGroup>

Zasady narzędzi obsługują skróty `group:*`, które rozwijają się do wielu narzędzi. Pełną listę znajdziesz w [Grupach narzędzi](/pl/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands).

Nadpisania trybu podwyższonego dla poszczególnych agentów (`agents.list[].tools.elevated`) mogą dodatkowo ograniczać podwyższony exec dla konkretnych agentów. Szczegóły znajdziesz w [Trybie podwyższonym](/pl/tools/elevated).

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
Starsze konfiguracje `agent.*` są migrowane przez `openclaw doctor`; w przyszłości preferuj `agents.defaults` + `agents.list`.
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

    `sessions_history` w tym profilu nadal zwraca ograniczony, oczyszczony widok przywołania zamiast surowego zrzutu transkrypcji. Przywołanie asystenta usuwa znaczniki myślenia, strukturę pomocniczą `<relevant-memories>`, tekstowe ładunki XML wywołań narzędzi (w tym `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` oraz ucięte bloki wywołań narzędzi), zdegradowaną strukturę pomocniczą wywołań narzędzi, ujawnione ASCII/pełnoszerokościowe tokeny sterujące modelu oraz niepoprawnie sformowany XML wywołań narzędzi MiniMax przed redakcją/ucięciem.

  </Tab>
</Tabs>

---

## Częsta pułapka: "non-main"

<Warning>
`agents.defaults.sandbox.mode: "non-main"` opiera się na `session.mainKey` (domyślnie `"main"`), a nie na identyfikatorze agenta. Sesje grup/kanałów zawsze otrzymują własne klucze, więc są traktowane jako niegłówne i zostaną umieszczone w sandboxie. Jeśli chcesz, aby agent nigdy nie używał sandboxa, ustaw `agents.list[].sandbox.mode: "off"`.
</Warning>

---

## Testowanie

Po skonfigurowaniu sandboxa i narzędzi dla wielu agentów:

<Steps>
  <Step title="Sprawdź rozstrzyganie agenta">
    ```bash
    openclaw agents list --bindings
    ```
  </Step>
  <Step title="Zweryfikuj kontenery sandboxa">
    ```bash
    docker ps --filter "name=openclaw-sbx-"
    ```
  </Step>
  <Step title="Przetestuj ograniczenia narzędzi">
    - Wyślij wiadomość wymagającą ograniczonych narzędzi.
    - Zweryfikuj, że agent nie może używać zablokowanych narzędzi.

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
  <Accordion title="Agent nie jest w sandboxie mimo `mode: 'all'`">
    - Sprawdź, czy istnieje globalne `agents.defaults.sandbox.mode`, które je nadpisuje.
    - Konfiguracja specyficzna dla agenta ma pierwszeństwo, więc ustaw `agents.list[].sandbox.mode: "all"`.

  </Accordion>
  <Accordion title="Narzędzia nadal dostępne mimo listy blokad">
    - Sprawdź kolejność filtrowania narzędzi: globalne → agent → sandbox → subagent.
    - Każdy poziom może tylko dalej ograniczać, nie przywracać.
    - Zweryfikuj w logach: `[tools] filtering tools for agent:${agentId}`.

  </Accordion>
  <Accordion title="Kontener nie jest izolowany dla każdego agenta">
    - Ustaw `scope: "agent"` w konfiguracji sandboxa specyficznej dla agenta.
    - Domyślnie jest to `"session"`, co tworzy jeden kontener na sesję.

  </Accordion>
</AccordionGroup>

---

## Powiązane

- [Tryb podwyższony](/pl/tools/elevated)
- [Routing wieloagentowy](/pl/concepts/multi-agent)
- [Konfiguracja sandboxa](/pl/gateway/config-agents#agentsdefaultssandbox)
- [Sandbox a zasady narzędzi a tryb podwyższony](/pl/gateway/sandbox-vs-tool-policy-vs-elevated) — debugowanie „dlaczego to jest zablokowane?”
- [Izolacja w sandboxie](/pl/gateway/sandboxing) — pełna dokumentacja sandboxa (tryby, zakresy, backendy, obrazy)
- [Zarządzanie sesją](/pl/concepts/session)
