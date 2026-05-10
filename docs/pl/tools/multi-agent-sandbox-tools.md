---
read_when: You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.
sidebarTitle: Multi-agent sandbox and tools
status: active
summary: Sandbox i ograniczenia narzędzi na poziomie agenta, kolejność pierwszeństwa i przykłady
title: Wieloagentowe środowisko izolowane i narzędzia
x-i18n:
    generated_at: "2026-05-10T19:57:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: c988613438f2d179b859902d3f7a39a1e29b60a0e2ae6ed598bb5f5881cf0b9f
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 16
---

Każdy agent w konfiguracji wieloagentowej może nadpisać globalną piaskownicę i politykę narzędzi. Ta strona omawia konfigurację per agent, reguły pierwszeństwa i przykłady.

<CardGroup cols={3}>
  <Card title="Piaskownica" href="/pl/gateway/sandboxing">
    Backendy i tryby — pełna dokumentacja piaskownicy.
  </Card>
  <Card title="Piaskownica kontra polityka narzędzi kontra tryb podwyższony" href="/pl/gateway/sandbox-vs-tool-policy-vs-elevated">
    Diagnozowanie „dlaczego to jest zablokowane?”
  </Card>
  <Card title="Tryb podwyższony" href="/pl/tools/elevated">
    Podwyższone wykonanie `exec` dla zaufanych nadawców.
  </Card>
</CardGroup>

<Warning>
Uwierzytelnianie jest zakresowane według agenta: każdy agent ma własny magazyn uwierzytelniania `agentDir` w `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`. Nigdy nie używaj ponownie `agentDir` między agentami. Agenci mogą odczytywać profile uwierzytelniania domyślnego/głównego agenta, gdy nie mają profilu lokalnego, ale tokeny odświeżania OAuth nie są klonowane do magazynów agentów pomocniczych. Jeśli kopiujesz poświadczenia ręcznie, kopiuj tylko przenośne statyczne profile `api_key` lub `token`.
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
  <Accordion title="Przykład 2: Agent służbowy ze współdzieloną piaskownicą">
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
  <Accordion title="Przykład 2b: Globalny profil kodowania + agent tylko do komunikacji">
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

    - agenci domyślni otrzymują narzędzia do kodowania.
    - agent `support` służy tylko do komunikacji (+ narzędzie Slack).

  </Accordion>
  <Accordion title="Przykład 3: Różne tryby piaskownicy per agent">
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

### Konfiguracja piaskownicy

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
`agents.list[].sandbox.{docker,browser,prune}.*` nadpisuje `agents.defaults.sandbox.{docker,browser,prune}.*` dla tego agenta (ignorowane, gdy zakres piaskownicy rozwiązuje się do `"shared"`).
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
  <Step title="Polityka narzędzi piaskownicy">
    `tools.sandbox.tools` lub `agents.list[].tools.sandbox.tools`.
  </Step>
  <Step title="Polityka narzędzi subagenta">
    `tools.subagents.tools`, jeśli ma zastosowanie.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Reguły pierwszeństwa">
    - Każdy poziom może dalej ograniczać narzędzia, ale nie może ponownie przyznać narzędzi odrzuconych na wcześniejszych poziomach.
    - Jeśli ustawiono `agents.list[].tools.sandbox.tools`, zastępuje ono `tools.sandbox.tools` dla tego agenta.
    - Jeśli ustawiono `agents.list[].tools.profile`, nadpisuje ono `tools.profile` dla tego agenta.
    - Klucze narzędzi dostawcy akceptują albo `provider` (np. `google-antigravity`), albo `provider/model` (np. `openai/gpt-5.4`).

  </Accordion>
  <Accordion title="Zachowanie pustej listy dozwolonych">
    Jeśli jakakolwiek jawna lista dozwolonych w tym łańcuchu pozostawi uruchomienie bez narzędzi możliwych do wywołania, OpenClaw zatrzyma się przed wysłaniem promptu do modelu. To celowe: agent skonfigurowany z brakującym narzędziem, takim jak `agents.list[].tools.allow: ["query_db"]`, powinien wyraźnie zakończyć się błędem, dopóki Plugin rejestrujący `query_db` nie zostanie włączony, a nie kontynuować jako agent tylko tekstowy.
  </Accordion>
</AccordionGroup>

Polityki narzędzi obsługują skróty `group:*`, które rozwijają się do wielu narzędzi. Pełną listę znajdziesz w [Grupach narzędzi](/pl/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands).

Nadpisania trybu podwyższonego per agent (`agents.list[].tools.elevated`) mogą dalej ograniczać podwyższone wykonanie `exec` dla określonych agentów. Szczegóły znajdziesz w [Trybie podwyższonym](/pl/tools/elevated).

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
  <Tab title="Wykonywanie powłoki przy wyłączonych narzędziach systemu plików">
    ```json
    {
      "tools": {
        "allow": ["read", "exec", "process"],
        "deny": ["write", "edit", "apply_patch", "browser", "gateway"]
      }
    }
    ```

    <Warning>
    Ta polityka wyłącza narzędzia systemu plików OpenClaw, ale `exec` nadal jest powłoką i może zapisywać pliki wszędzie tam, gdzie pozwala na to wybrany host lub system plików piaskownicy. Dla agenta tylko do odczytu odmów `exec` i `process` albo połącz dostęp do powłoki z kontrolami systemu plików piaskownicy, takimi jak `agents.defaults.sandbox.workspaceAccess: "ro"` lub `"none"`.
    </Warning>

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

    `sessions_history` w tym profilu nadal zwraca ograniczony, oczyszczony widok przypomnienia zamiast surowego zrzutu transkrypcji. Przypomnienie asystenta usuwa znaczniki myślenia, rusztowanie `<relevant-memories>`, zwykłotekstowe ładunki XML wywołań narzędzi (w tym `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` oraz obcięte bloki wywołań narzędzi), zdegradowane rusztowanie wywołań narzędzi, ujawnione tokeny sterujące modelu ASCII/pełnej szerokości oraz zniekształcony XML wywołań narzędzi MiniMax przed redakcją/obcięciem.

  </Tab>
</Tabs>

---

## Częsta pułapka: `"non-main"`

<Warning>
`agents.defaults.sandbox.mode: "non-main"` bazuje na `session.mainKey` (domyślnie `"main"`), a nie na identyfikatorze agenta. Sesje grup/kanałów zawsze otrzymują własne klucze, więc są traktowane jako niegłówne i będą umieszczane w piaskownicy. Jeśli chcesz, aby agent nigdy nie trafiał do piaskownicy, ustaw `agents.list[].sandbox.mode: "off"`.
</Warning>

---

## Testowanie

Po skonfigurowaniu piaskownicy i narzędzi dla wielu agentów:

<Steps>
  <Step title="Sprawdź rozwiązywanie agenta">
    ```bash
    openclaw agents list --bindings
    ```
  </Step>
  <Step title="Zweryfikuj kontenery piaskownicy">
    ```bash
    docker ps --filter "name=openclaw-sbx-"
    ```
  </Step>
  <Step title="Przetestuj ograniczenia narzędzi">
    - Wyślij wiadomość wymagającą ograniczonych narzędzi.
    - Zweryfikuj, że agent nie może używać odrzuconych narzędzi.

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
  <Accordion title="Agent nie jest w piaskownicy mimo `mode: 'all'`">
    - Sprawdź, czy istnieje globalne `agents.defaults.sandbox.mode`, które to nadpisuje.
    - Konfiguracja specyficzna dla agenta ma pierwszeństwo, więc ustaw `agents.list[].sandbox.mode: "all"`.

  </Accordion>
  <Accordion title="Narzędzia nadal dostępne mimo listy odmów">
    - Sprawdź kolejność filtrowania narzędzi: globalna → agent → piaskownica → subagent.
    - Każdy poziom może tylko dalej ograniczać, nie przyznawać ponownie.
    - Zweryfikuj w logach: `[tools] filtering tools for agent:${agentId}`.

  </Accordion>
  <Accordion title="Kontener nie jest izolowany per agent">
    - Ustaw `scope: "agent"` w konfiguracji piaskownicy specyficznej dla agenta.
    - Domyślna wartość to `"session"`, która tworzy jeden kontener na sesję.

  </Accordion>
</AccordionGroup>

---

## Powiązane

- [Tryb podwyższony](/pl/tools/elevated)
- [Routing wieloagentowy](/pl/concepts/multi-agent)
- [Konfiguracja piaskownicy](/pl/gateway/config-agents#agentsdefaultssandbox)
- [Piaskownica a polityka narzędzi a tryb podwyższony](/pl/gateway/sandbox-vs-tool-policy-vs-elevated) — debugowanie „dlaczego to jest zablokowane?”
- [Piaskownica](/pl/gateway/sandboxing) — pełna dokumentacja piaskownicy (tryby, zakresy, backendy, obrazy)
- [Zarządzanie sesją](/pl/concepts/session)
