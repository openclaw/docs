---
read_when: You want per-agent sandboxing or per-agent tool allow/deny policies in a multi-agent gateway.
sidebarTitle: Multi-agent sandbox and tools
status: active
summary: Piaskownica na agenta, ograniczenia narzędzi, kolejność pierwszeństwa i przykłady
title: Piaskownica i narzędzia dla wielu agentów
x-i18n:
    generated_at: "2026-07-12T15:45:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fada3672a0a7ce6eac2a8bffee8329afcd893d97e33d8e9842cb12079397efa6
    source_path: tools/multi-agent-sandbox-tools.md
    workflow: 16
---

Każdy agent w konfiguracji wieloagentowej może nadpisać globalną politykę piaskownicy i narzędzi. Ta strona opisuje konfigurację poszczególnych agentów, reguły pierwszeństwa i przykłady.

<CardGroup cols={3}>
  <Card title="Piaskownica" href="/pl/gateway/sandboxing">
    Mechanizmy wykonawcze i tryby — pełna dokumentacja piaskownicy.
  </Card>
  <Card title="Piaskownica a polityka narzędzi a tryb podwyższony" href="/pl/gateway/sandbox-vs-tool-policy-vs-elevated">
    Diagnozowanie problemu „dlaczego jest to zablokowane?”
  </Card>
  <Card title="Tryb podwyższony" href="/pl/tools/elevated">
    Wykonywanie poleceń z podwyższonymi uprawnieniami dla zaufanych nadawców.
  </Card>
</CardGroup>

<Warning>
Uwierzytelnianie jest ograniczone do agenta: każdy agent ma własny magazyn uwierzytelniania `agentDir` w `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`. Nigdy nie używaj tego samego `agentDir` dla wielu agentów. Agenci mogą korzystać z profili uwierzytelniania domyślnego/głównego agenta, jeśli nie mają profilu lokalnego, ale tokeny odświeżania OAuth nie są klonowane do magazynów agentów dodatkowych. Jeśli kopiujesz dane uwierzytelniające ręcznie, kopiuj wyłącznie przenośne, statyczne profile `api_key` lub `token`.
</Warning>

---

## Przykłady konfiguracji

<AccordionGroup>
  <Accordion title="Przykład 1: Agent osobisty i ograniczony agent rodzinny">
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

    - Agent `main`: działa na hoście i ma pełny dostęp do narzędzi.
    - Agent `family`: działa w Dockerze (jeden kontener na agenta) i może wyłącznie odczytywać oraz wysyłać wiadomości w bieżącej rozmowie.

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
  <Accordion title="Przykład 2b: Globalny profil programistyczny i agent obsługujący wyłącznie wiadomości">
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

    - Domyślni agenci otrzymują narzędzia programistyczne.
    - Agent `support` obsługuje wyłącznie wiadomości (oraz narzędzie Slack).

  </Accordion>
  <Accordion title="Przykład 3: Różne tryby piaskownicy dla poszczególnych agentów">
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

Gdy istnieje zarówno konfiguracja globalna (`agents.defaults.*`), jak i konfiguracja właściwa dla agenta (`agents.list[].*`):

### Konfiguracja piaskownicy

Ustawienia właściwe dla agenta zastępują ustawienia globalne:

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
`agents.list[].sandbox.{docker,browser,prune}.*` zastępuje `agents.defaults.sandbox.{docker,browser,prune}.*` dla danego agenta (jest ignorowane, gdy wynikowy zakres piaskownicy to `"shared"`).
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
  <Step title="Polityka narzędzi właściwa dla agenta">
    `agents.list[].tools.allow/deny`.
  </Step>
  <Step title="Polityka dostawcy właściwa dla agenta">
    `agents.list[].tools.byProvider[provider].allow/deny`.
  </Step>
  <Step title="Polityka narzędzi piaskownicy">
    `tools.sandbox.tools` lub `agents.list[].tools.sandbox.tools`.
  </Step>
  <Step title="Polityka narzędzi podagentów">
    `tools.subagents.tools`, jeśli ma zastosowanie.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Reguły pierwszeństwa">
    - Każdy poziom może dodatkowo ograniczać narzędzia, ale nie może ponownie przyznać dostępu do narzędzi zablokowanych na wcześniejszych poziomach.
    - Jeśli ustawiono `agents.list[].tools.sandbox.tools`, zastępuje ono `tools.sandbox.tools` dla danego agenta.
    - Jeśli ustawiono `agents.list[].tools.profile`, zastępuje ono `tools.profile` dla danego agenta.
    - Klucze narzędzi dostawcy przyjmują wartość `provider` (np. `google-antigravity`) albo `provider/model` (np. `openai/gpt-5.4`).

  </Accordion>
  <Accordion title="Zachowanie pustej listy dozwolonych narzędzi">
    Jeśli którakolwiek jawna lista dozwolonych narzędzi w tym łańcuchu sprawi, że podczas wykonania nie będzie można wywołać żadnego narzędzia, OpenClaw zatrzyma się przed przesłaniem monitu do modelu. Jest to zamierzone: agent skonfigurowany z brakującym narzędziem, takim jak `agents.list[].tools.allow: ["query_db"]`, powinien zgłaszać wyraźny błąd do czasu włączenia pluginu rejestrującego `query_db`, zamiast kontynuować pracę jako agent obsługujący wyłącznie tekst.
  </Accordion>
</AccordionGroup>

Polityki narzędzi obsługują skróty `group:*`, które rozwijają się do wielu narzędzi. Pełną listę zawiera sekcja [Grupy narzędzi](/pl/gateway/sandbox-vs-tool-policy-vs-elevated#tool-groups-shorthands).

Nadpisania trybu podwyższonego dla poszczególnych agentów (`agents.list[].tools.elevated`) mogą dodatkowo ograniczać wykonywanie poleceń z podwyższonymi uprawnieniami przez określonych agentów. Szczegółowe informacje zawiera sekcja [Tryb podwyższony](/pl/tools/elevated).

---

## Migracja z pojedynczego agenta

<Tabs>
  <Tab title="Przed migracją (pojedynczy agent)">
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
  <Tab title="Po migracji (wielu agentów)">
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
Starsze klucze konfiguracji `agents.defaults.*`/`agents.list[].*` (takie jak `sandbox.perSession`, `agentRuntime`, `embeddedPi`) są migrowane przez `openclaw doctor`; w przyszłości używaj `agents.defaults` i `agents.list`.
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
  <Tab title="Wykonywanie poleceń powłoki przy wyłączonych narzędziach systemu plików">
    ```json
    {
      "tools": {
        "allow": ["read", "exec", "process"],
        "deny": ["write", "edit", "apply_patch", "browser", "gateway"]
      }
    }
    ```

    <Warning>
    Ta polityka wyłącza narzędzia systemu plików OpenClaw, ale `exec` nadal jest powłoką i może zapisywać pliki wszędzie tam, gdzie pozwala na to system plików wybranego hosta lub piaskownicy. W przypadku agenta tylko do odczytu zablokuj `exec` i `process` albo połącz dostęp do powłoki z mechanizmami kontroli systemu plików piaskownicy, takimi jak `agents.defaults.sandbox.workspaceAccess: "ro"` lub `"none"`.
    </Warning>

  </Tab>
  <Tab title="Wyłącznie komunikacja">
    ```json
    {
      "tools": {
        "sessions": { "visibility": "tree" },
        "allow": ["sessions_list", "sessions_send", "sessions_history", "session_status"],
        "deny": ["exec", "write", "edit", "apply_patch", "read", "browser"]
      }
    }
    ```

    W tym profilu `sessions_history` nadal zwraca ograniczony i oczyszczony widok przywołanych informacji, a nie surowy zrzut transkrypcji. Mechanizm przywoływania informacji przez asystenta usuwa znaczniki rozumowania, strukturę pomocniczą `<relevant-memories>`, tekstowe ładunki XML wywołań narzędzi (w tym `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` oraz ucięte bloki wywołań narzędzi), zdegradowaną strukturę pomocniczą wywołań narzędzi, ujawnione tokeny sterujące modelu zapisane znakami ASCII lub znakami pełnej szerokości oraz nieprawidłowy XML wywołań narzędzi MiniMax przed redakcją i skróceniem.

  </Tab>
</Tabs>

---

## Częsta pułapka: „non-main”

<Warning>
`agents.defaults.sandbox.mode: "non-main"` porównuje klucz sesji z kluczem sesji głównej (zawsze `"main"`; `session.mainKey` nie może być konfigurowany przez użytkownika, a OpenClaw ostrzega o każdej innej wartości i ją ignoruje), a nie z identyfikatorem agenta. Sesje grupowe i kanałowe zawsze otrzymują własne klucze, dlatego są traktowane jako inne niż główna i uruchamiane w piaskownicy. Jeśli agent nigdy nie powinien korzystać z piaskownicy, ustaw `agents.list[].sandbox.mode: "off"`.
</Warning>

---

## Testowanie

Po skonfigurowaniu piaskownicy i narzędzi dla wielu agentów:

<Steps>
  <Step title="Sprawdź rozpoznawanie agentów">
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
    - Wyślij wiadomość wymagającą użycia ograniczonych narzędzi.
    - Sprawdź, czy agent nie może używać zablokowanych narzędzi.

  </Step>
  <Step title="Monitoruj dzienniki">
    ```bash
    openclaw logs --follow | grep -E "routing|sandbox|tools"
    ```
  </Step>
</Steps>

---

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Agent nie działa w piaskownicy pomimo ustawienia `mode: 'all'`">
    - Sprawdź, czy istnieje globalne ustawienie `agents.defaults.sandbox.mode`, które je zastępuje.
    - Konfiguracja właściwa dla agenta ma pierwszeństwo, dlatego ustaw `agents.list[].sandbox.mode: "all"`.

  </Accordion>
  <Accordion title="Narzędzia nadal dostępne pomimo listy odmowy">
    - Sprawdź [pełną kolejność filtrowania](#tool-restrictions): profil → profil dostawcy → zasady globalne → zasady dostawcy → zasady agenta → zasady dostawcy dla agenta → piaskownica → agent podrzędny.
    - Każdy poziom może jedynie wprowadzać dalsze ograniczenia, a nie ponownie przyznawać uprawnienia.
    - Zobacz [Piaskownica a zasady narzędzi a tryb podwyższonych uprawnień](/pl/gateway/sandbox-vs-tool-policy-vs-elevated), aby poznać procedurę debugowania krok po kroku.

  </Accordion>
  <Accordion title="Kontener nie jest izolowany dla każdego agenta">
    - Domyślna wartość `scope` to `"agent"` (jeden kontener na identyfikator agenta).
    - Ustaw `scope: "session"`, aby używać jednego kontenera na sesję, lub `scope: "shared"`, aby ponownie wykorzystywać jeden kontener przez wielu agentów.

  </Accordion>
</AccordionGroup>

---

## Powiązane

- [Tryb podwyższonych uprawnień](/pl/tools/elevated)
- [Routing wieloagentowy](/pl/concepts/multi-agent)
- [Konfiguracja piaskownicy](/pl/gateway/config-agents#agentsdefaultssandbox)
- [Piaskownica a zasady narzędzi a tryb podwyższonych uprawnień](/pl/gateway/sandbox-vs-tool-policy-vs-elevated) — debugowanie problemu „dlaczego jest to blokowane?”
- [Piaskownica](/pl/gateway/sandboxing) — pełna dokumentacja piaskownicy (tryby, zakresy, backendy, obrazy)
- [Zarządzanie sesjami](/pl/concepts/session)
