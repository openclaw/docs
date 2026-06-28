---
read_when: You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.
sidebarTitle: Multi-agent sandbox and tools
status: active
summary: Piaskownica na agenta + ograniczenia narzędzi, pierwszeństwo i przykłady
title: Piaskownica i narzędzia dla wielu agentów
x-i18n:
    generated_at: "2026-05-11T20:39:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8d11af55e30996a89e665b258604108a93f4c4271fbe4edfd1caf54864e40f01
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Każdy agent w konfiguracji wieloagentowej może nadpisać globalne zasady sandboxa i narzędzi. Ta strona omawia konfigurację per agent, reguły pierwszeństwa oraz przykłady.

<CardGroup cols={3}>
  <Card title="Sandboxing" href="/pl/gateway/sandboxing">
    Backendy i tryby — pełna dokumentacja sandboxa.
  </Card>
  <Card title="Sandbox a zasady narzędzi a elevated" href="/pl/gateway/sandbox-vs-tool-policy-vs-elevated">
    Debugowanie: „dlaczego to jest zablokowane?”
  </Card>
  <Card title="Tryb elevated" href="/pl/tools/elevated">
    Podniesione uprawnienia exec dla zaufanych nadawców.
  </Card>
</CardGroup>

<Warning>
Uwierzytelnianie jest ograniczone do agenta: każdy agent ma własny magazyn uwierzytelniania `agentDir` pod adresem `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`. Nigdy nie używaj ponownie `agentDir` między agentami. Agenci mogą odczytywać profile uwierzytelniania domyślnego/głównego agenta, gdy nie mają profilu lokalnego, ale tokeny odświeżania OAuth nie są klonowane do magazynów agentów dodatkowych. Jeśli kopiujesz poświadczenia ręcznie, kopiuj tylko przenośne statyczne profile `api_key` lub `token`.
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

    **Wynik:**

    - agent `main`: działa na hoście, pełny dostęp do narzędzi.
    - agent `family`: działa w Dockerze (jeden kontener na agenta), tylko `read` i wysyłanie wiadomości w bieżącej konwersacji.

  </Accordion>
  <Accordion title="Przykład 2: Agent roboczy ze współdzielonym sandboxem">
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

    - agenci domyślni otrzymują narzędzia do kodowania.
    - agent `support` służy tylko do wiadomości (+ narzędzie Slack).

  </Accordion>
  <Accordion title="Przykład 3: Różne tryby sandboxa per agent">
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
`agents.list[].sandbox.{docker,browser,prune}.*` nadpisuje `agents.defaults.sandbox.{docker,browser,prune}.*` dla tego agenta (ignorowane, gdy zakres sandboxa rozwiązuje się do `"shared"`).
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
  <Step title="Polityka narzędzi sandboxa">
    `tools.sandbox.tools` lub `agents.list[].tools.sandbox.tools`.
  </Step>
  <Step title="Polityka narzędzi subagenta">
    `tools.subagents.tools`, jeśli ma zastosowanie.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Reguły pierwszeństwa">
    - Każdy poziom może dalej ograniczać narzędzia, ale nie może ponownie przyznać narzędzi zabronionych na wcześniejszych poziomach.
    - Jeśli ustawiono `agents.list[].tools.sandbox.tools`, zastępuje ono `tools.sandbox.tools` dla tego agenta.
    - Jeśli ustawiono `agents.list[].tools.profile`, nadpisuje ono `tools.profile` dla tego agenta.
    - Klucze narzędzi dostawcy akceptują `provider` (np. `google-antigravity`) albo `provider/model` (np. `openai/gpt-5.4`).

  </Accordion>
  <Accordion title="Zachowanie pustej listy dozwolonych">
    Jeśli dowolna jawna lista dozwolonych w tym łańcuchu pozostawi uruchomienie bez wywoływalnych narzędzi, OpenClaw zatrzyma się przed wysłaniem promptu do modelu. Jest to celowe: agent skonfigurowany z brakującym narzędziem, takim jak `agents.list[].tools.allow: ["query_db"]`, powinien zakończyć się głośnym błędem, dopóki Plugin rejestrujący `query_db` nie zostanie włączony, zamiast kontynuować jako agent tylko tekstowy.
  </Accordion>
</AccordionGroup>

Polityki narzędzi obsługują skróty `group:*`, które rozwijają się do wielu narzędzi. Pełną listę znajdziesz w [Grupach narzędzi](/pl/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands).

Nadpisania elevated per agent (`agents.list[].tools.elevated`) mogą dodatkowo ograniczać podniesione uprawnienia exec dla konkretnych agentów. Szczegóły znajdziesz w [Trybie elevated](/pl/tools/elevated).

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
Starsze konfiguracje `agent.*` są migrowane przez `openclaw doctor`; w nowych konfiguracjach preferuj `agents.defaults` + `agents.list`.
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
  <Tab title="Wykonywanie poleceń powłoki z wyłączonymi narzędziami systemu plików">
    ```json
    {
      "tools": {
        "allow": ["read", "exec", "process"],
        "deny": ["write", "edit", "apply_patch", "browser", "gateway"]
      }
    }
    ```

    <Warning>
    Ta polityka wyłącza narzędzia systemu plików OpenClaw, ale `exec` nadal jest powłoką i może zapisywać pliki wszędzie tam, gdzie pozwala na to wybrany host lub system plików sandboxa. W przypadku agenta tylko do odczytu odmów `exec` i `process` albo połącz dostęp do powłoki z kontrolami systemu plików sandboxa, takimi jak `agents.defaults.sandbox.workspaceAccess: "ro"` lub `"none"`.
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

    `sessions_history` w tym profilu nadal zwraca ograniczony, oczyszczony widok przypominania, a nie surowy zrzut transkrypcji. Przypominanie asystenta usuwa tagi rozumowania, struktury pomocnicze `<relevant-memories>`, ładunki XML wywołań narzędzi w postaci zwykłego tekstu (w tym `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` oraz ucięte bloki wywołań narzędzi), zdegradowane struktury pomocnicze wywołań narzędzi, ujawnione tokeny kontrolne modelu ASCII/pełnej szerokości oraz nieprawidłowy XML wywołań narzędzi MiniMax przed redakcją/ucięciem.

  </Tab>
</Tabs>

---

## Typowa pułapka: „non-main”

<Warning>
`agents.defaults.sandbox.mode: "non-main"` opiera się na `session.mainKey` (domyślnie `"main"`), a nie na identyfikatorze agenta. Sesje grupowe/kanałowe zawsze otrzymują własne klucze, więc są traktowane jako niegłówne i zostaną objęte sandboxem. Jeśli chcesz, aby agent nigdy nie był objęty sandboxem, ustaw `agents.list[].sandbox.mode: "off"`.
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
    - Sprawdź, czy agent nie może używać narzędzi, którym odmówiono dostępu.

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
  <Accordion title="Agent nie jest objęty sandboxem mimo `mode: 'all'`">
    - Sprawdź, czy istnieje globalne `agents.defaults.sandbox.mode`, które je zastępuje.
    - Konfiguracja specyficzna dla agenta ma pierwszeństwo, więc ustaw `agents.list[].sandbox.mode: "all"`.

  </Accordion>
  <Accordion title="Narzędzia nadal dostępne mimo listy odmów">
    - Sprawdź kolejność filtrowania narzędzi: globalne → agent → sandbox → podagent.
    - Każdy poziom może tylko dalej ograniczać, nie ponownie przyznawać dostęp.
    - Zweryfikuj w logach: `[tools] filtering tools for agent:${agentId}`.

  </Accordion>
  <Accordion title="Kontener nie jest izolowany na agenta">
    - Ustaw `scope: "agent"` w konfiguracji sandboxa specyficznej dla agenta.
    - Wartością domyślną jest `"session"`, co tworzy jeden kontener na sesję.

  </Accordion>
</AccordionGroup>

---

## Powiązane

- [Tryb podwyższonych uprawnień](/pl/tools/elevated)
- [Routing wieloagentowy](/pl/concepts/multi-agent)
- [Konfiguracja piaskownicy](/pl/gateway/config-agents#agentsdefaultssandbox)
- [Piaskownica kontra polityka narzędzi kontra tryb podwyższonych uprawnień](/pl/gateway/sandbox-vs-tool-policy-vs-elevated) — debugowanie „dlaczego to jest blokowane?”
- [Izolacja w piaskownicy](/pl/gateway/sandboxing) — pełna dokumentacja referencyjna piaskownicy (tryby, zakresy, backendy, obrazy)
- [Zarządzanie sesją](/pl/concepts/session)
