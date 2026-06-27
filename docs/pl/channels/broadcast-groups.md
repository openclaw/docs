---
read_when:
    - Konfigurowanie grup rozgłoszeniowych
    - Debugowanie odpowiedzi wielu agentów w WhatsApp
sidebarTitle: Broadcast groups
status: experimental
summary: Rozgłoś wiadomość WhatsApp do wielu agentów
title: Grupy rozgłaszania
x-i18n:
    generated_at: "2026-06-27T17:09:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a89b936322baf0fea7b487cb5354b9fad3fc021abb2970f7cd934b1880da2a0e
    source_path: channels/broadcast-groups.md
    workflow: 16
---

<Note>
**Status:** Eksperymentalne. Dodano w 2026.1.9.
</Note>

## Omówienie

Grupy rozgłoszeniowe umożliwiają wielu agentom jednoczesne przetwarzanie tej samej wiadomości i odpowiadanie na nią. Pozwala to tworzyć wyspecjalizowane zespoły agentów, które współpracują w jednej grupie WhatsApp lub w czacie prywatnym — wszystkie używają jednego numeru telefonu.

Obecny zakres: **tylko WhatsApp** (kanał webowy).

Grupy rozgłoszeniowe są oceniane po listach dozwolonych kanału i regułach aktywacji grupy. W grupach WhatsApp oznacza to, że rozgłoszenia następują wtedy, gdy OpenClaw normalnie by odpowiedział (na przykład: po wzmiance, zależnie od ustawień grupy).

## Przypadki użycia

<AccordionGroup>
  <Accordion title="1. Specialized agent teams">
    Wdróż wielu agentów z atomowymi, skoncentrowanymi odpowiedzialnościami:

    ```
    Group: "Development Team"
    Agents:
      - CodeReviewer (reviews code snippets)
      - DocumentationBot (generates docs)
      - SecurityAuditor (checks for vulnerabilities)
      - TestGenerator (suggests test cases)
    ```

    Każdy agent przetwarza tę samą wiadomość i przedstawia swoją wyspecjalizowaną perspektywę.

  </Accordion>
  <Accordion title="2. Multi-language support">
    ```
    Group: "International Support"
    Agents:
      - Agent_EN (responds in English)
      - Agent_DE (responds in German)
      - Agent_ES (responds in Spanish)
    ```
  </Accordion>
  <Accordion title="3. Quality assurance workflows">
    ```
    Group: "Customer Support"
    Agents:
      - SupportAgent (provides answer)
      - QAAgent (reviews quality, only responds if issues found)
    ```
  </Accordion>
  <Accordion title="4. Task automation">
    ```
    Group: "Project Management"
    Agents:
      - TaskTracker (updates task database)
      - TimeLogger (logs time spent)
      - ReportGenerator (creates summaries)
    ```
  </Accordion>
</AccordionGroup>

## Konfiguracja

### Podstawowa konfiguracja

Dodaj sekcję najwyższego poziomu `broadcast` (obok `bindings`). Klucze to identyfikatory peerów WhatsApp:

- czaty grupowe: JID grupy (np. `120363403215116621@g.us`)
- czaty prywatne: numer telefonu E.164 (np. `+15551234567`)

```json
{
  "broadcast": {
    "120363403215116621@g.us": ["alfred", "baerbel", "assistant3"]
  }
}
```

**Wynik:** Gdy OpenClaw odpowiedziałby w tym czacie, uruchomi wszystkich trzech agentów.

### Strategia przetwarzania

Kontroluj, jak agenci przetwarzają wiadomości:

<Tabs>
  <Tab title="parallel (default)">
    Wszyscy agenci przetwarzają jednocześnie:

    ```json
    {
      "broadcast": {
        "strategy": "parallel",
        "120363403215116621@g.us": ["alfred", "baerbel"]
      }
    }
    ```

  </Tab>
  <Tab title="sequential">
    Agenci przetwarzają po kolei (każdy czeka na zakończenie poprzedniego):

    ```json
    {
      "broadcast": {
        "strategy": "sequential",
        "120363403215116621@g.us": ["alfred", "baerbel"]
      }
    }
    ```

  </Tab>
</Tabs>

### Pełny przykład

```json
{
  "agents": {
    "list": [
      {
        "id": "code-reviewer",
        "name": "Code Reviewer",
        "workspace": "/path/to/code-reviewer",
        "sandbox": { "mode": "all" }
      },
      {
        "id": "security-auditor",
        "name": "Security Auditor",
        "workspace": "/path/to/security-auditor",
        "sandbox": { "mode": "all" }
      },
      {
        "id": "docs-generator",
        "name": "Documentation Generator",
        "workspace": "/path/to/docs-generator",
        "sandbox": { "mode": "all" }
      }
    ]
  },
  "broadcast": {
    "strategy": "parallel",
    "120363403215116621@g.us": ["code-reviewer", "security-auditor", "docs-generator"],
    "120363424282127706@g.us": ["support-en", "support-de"],
    "+15555550123": ["assistant", "logger"]
  }
}
```

## Jak to działa

### Przepływ wiadomości

<Steps>
  <Step title="Incoming message arrives">
    Przychodzi wiadomość z grupy WhatsApp lub czatu prywatnego.
  </Step>
  <Step title="Route and admission">
    OpenClaw stosuje listy dozwolonych kanału, reguły aktywacji grupy oraz skonfigurowaną własność powiązań ACP.
  </Step>
  <Step title="Broadcast check">
    Jeśli żadne skonfigurowane powiązanie ACP nie jest właścicielem trasy, OpenClaw sprawdza, czy identyfikator peera znajduje się w `broadcast`.
  </Step>
  <Step title="If broadcast applies">
    - Wszyscy wymienieni agenci przetwarzają wiadomość.
    - Każdy agent ma własny klucz sesji i izolowany kontekst.
    - Agenci przetwarzają równolegle (domyślnie) albo sekwencyjnie.

  </Step>
  <Step title="If broadcast does not apply">
    OpenClaw wysyła zwykłą trasę albo skonfigurowaną trasę sesji ACP wybraną podczas routingu.
  </Step>
</Steps>

<Note>
Grupy rozgłoszeniowe nie omijają list dozwolonych kanału ani reguł aktywacji grupy (wzmianki/polecenia/itd.). Zmieniają tylko _to, którzy agenci są uruchamiani_, gdy wiadomość kwalifikuje się do przetwarzania.
</Note>

### Izolacja sesji

Każdy agent w grupie rozgłoszeniowej utrzymuje całkowicie oddzielne:

- **Klucze sesji** (`agent:alfred:whatsapp:group:120363...` kontra `agent:baerbel:whatsapp:group:120363...`)
- **Historię konwersacji** (agent nie widzi wiadomości innych agentów)
- **Obszar roboczy** (oddzielne piaskownice, jeśli skonfigurowano)
- **Dostęp do narzędzi** (różne listy dozwolonych/zabronionych)
- **Pamięć/kontekst** (oddzielne IDENTITY.md, SOUL.md itd.)
- **Bufor kontekstu grupy** (ostatnie wiadomości grupowe używane jako kontekst) jest współdzielony dla danego peera, więc wszyscy agenci rozgłoszeniowi widzą ten sam kontekst po wyzwoleniu

Pozwala to każdemu agentowi mieć:

- Różne osobowości
- Różny dostęp do narzędzi (np. tylko do odczytu kontra odczyt i zapis)
- Różne modele (np. opus kontra sonnet)
- Różne zainstalowane Skills

### Przykład: izolowane sesje

W grupie `120363403215116621@g.us` z agentami `["alfred", "baerbel"]`:

<Tabs>
  <Tab title="Alfred's context">
    ```
    Session: agent:alfred:whatsapp:group:120363403215116621@g.us
    History: [user message, alfred's previous responses]
    Workspace: /Users/user/openclaw-alfred/
    Tools: read, write, exec
    ```
  </Tab>
  <Tab title="Bärbel's context">
    ```
    Session: agent:baerbel:whatsapp:group:120363403215116621@g.us
    History: [user message, baerbel's previous responses]
    Workspace: /Users/user/openclaw-baerbel/
    Tools: read only
    ```
  </Tab>
</Tabs>

## Najlepsze praktyki

<AccordionGroup>
  <Accordion title="1. Keep agents focused">
    Projektuj każdego agenta z jedną, jasną odpowiedzialnością:

    ```json
    {
      "broadcast": {
        "DEV_GROUP": ["formatter", "linter", "tester"]
      }
    }
    ```

    ✅ **Dobrze:** Każdy agent ma jedno zadanie. ❌ **Źle:** Jeden ogólny agent „dev-helper”.

  </Accordion>
  <Accordion title="2. Use descriptive names">
    Uczyń jasnym, co robi każdy agent:

    ```json
    {
      "agents": {
        "security-scanner": { "name": "Security Scanner" },
        "code-formatter": { "name": "Code Formatter" },
        "test-generator": { "name": "Test Generator" }
      }
    }
    ```

  </Accordion>
  <Accordion title="3. Configure different tool access">
    Przyznawaj agentom tylko te narzędzia, których potrzebują:

    ```json
    {
      "agents": {
        "reviewer": {
          "tools": { "allow": ["read", "exec"] }
        },
        "fixer": {
          "tools": { "allow": ["read", "write", "edit", "exec"] }
        }
      }
    }
    ```

    `reviewer` działa tylko w trybie odczytu. `fixer` może czytać i zapisywać.

  </Accordion>
  <Accordion title="4. Monitor performance">
    Przy wielu agentach rozważ:

    - Użycie `"strategy": "parallel"` (domyślnie) dla szybkości
    - Ograniczenie grup rozgłoszeniowych do 5-10 agentów
    - Użycie szybszych modeli dla prostszych agentów

  </Accordion>
  <Accordion title="5. Handle failures gracefully">
    Agenci zawodzą niezależnie. Błąd jednego agenta nie blokuje pozostałych:

    ```
    Message → [Agent A ✓, Agent B ✗ error, Agent C ✓]
    Result: Agent A and C respond, Agent B logs error
    ```

  </Accordion>
</AccordionGroup>

## Zgodność

### Dostawcy

Grupy rozgłoszeniowe obecnie działają z:

- ✅ WhatsApp (zaimplementowane)
- 🚧 Telegram (planowane)
- 🚧 Discord (planowane)
- 🚧 Slack (planowane)

### Routing

Grupy rozgłoszeniowe działają obok istniejącego routingu:

```json
{
  "bindings": [
    {
      "match": { "channel": "whatsapp", "peer": { "kind": "group", "id": "GROUP_A" } },
      "agentId": "alfred"
    }
  ],
  "broadcast": {
    "GROUP_B": ["agent1", "agent2"]
  }
}
```

- `GROUP_A`: Odpowiada tylko alfred (normalny routing).
- `GROUP_B`: Odpowiadają agent1 ORAZ agent2 (rozgłoszenie).

<Note>
**Pierwszeństwo:** `broadcast` ma priorytet nad zwykłymi powiązaniami tras. Skonfigurowane powiązania ACP (`bindings[].type="acp"`) są wyłączne: gdy jedno z nich pasuje, OpenClaw wysyła do skonfigurowanej sesji ACP zamiast rozgłoszenia typu fan-out.
</Note>

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Agents not responding">
    **Sprawdź:**

    1. Identyfikatory agentów istnieją w `agents.list`.
    2. Format identyfikatora peera jest poprawny (np. `120363403215116621@g.us`).
    3. Agenci nie znajdują się na listach zabronionych.

    **Debugowanie:**

    ```bash
    tail -f ~/.openclaw/logs/gateway.log | grep broadcast
    ```

  </Accordion>
  <Accordion title="Only one agent responding">
    **Przyczyna:** Identyfikator peera może znajdować się w zwykłych powiązaniach tras, ale nie w `broadcast`, albo może pasować do wyłącznego skonfigurowanego powiązania ACP.

    **Naprawa:** Dodaj peery powiązane zwykłą trasą do konfiguracji rozgłoszeń albo usuń/zmień skonfigurowane powiązanie ACP, jeśli pożądane jest rozgłoszenie typu fan-out.

  </Accordion>
  <Accordion title="Performance issues">
    Jeśli działanie jest wolne przy wielu agentach:

    - Zmniejsz liczbę agentów na grupę.
    - Użyj lżejszych modeli (sonnet zamiast opus).
    - Sprawdź czas uruchamiania piaskownicy.

  </Accordion>
</AccordionGroup>

## Przykłady

<AccordionGroup>
  <Accordion title="Example 1: Code review team">
    ```json
    {
      "broadcast": {
        "strategy": "parallel",
        "120363403215116621@g.us": [
          "code-formatter",
          "security-scanner",
          "test-coverage",
          "docs-checker"
        ]
      },
      "agents": {
        "list": [
          {
            "id": "code-formatter",
            "workspace": "~/agents/formatter",
            "tools": { "allow": ["read", "write"] }
          },
          {
            "id": "security-scanner",
            "workspace": "~/agents/security",
            "tools": { "allow": ["read", "exec"] }
          },
          {
            "id": "test-coverage",
            "workspace": "~/agents/testing",
            "tools": { "allow": ["read", "exec"] }
          },
          { "id": "docs-checker", "workspace": "~/agents/docs", "tools": { "allow": ["read"] } }
        ]
      }
    }
    ```

    **Użytkownik wysyła:** Fragment kodu.

    **Odpowiedzi:**

    - code-formatter: „Naprawiono wcięcia i dodano podpowiedzi typów”
    - security-scanner: „⚠️ Luka SQL injection w wierszu 12”
    - test-coverage: „Pokrycie wynosi 45%, brakuje testów dla przypadków błędów”
    - docs-checker: „Brakuje docstringa dla funkcji `process_data`”

  </Accordion>
  <Accordion title="Example 2: Multi-language support">
    ```json
    {
      "broadcast": {
        "strategy": "sequential",
        "+15555550123": ["detect-language", "translator-en", "translator-de"]
      },
      "agents": {
        "list": [
          { "id": "detect-language", "workspace": "~/agents/lang-detect" },
          { "id": "translator-en", "workspace": "~/agents/translate-en" },
          { "id": "translator-de", "workspace": "~/agents/translate-de" }
        ]
      }
    }
    ```
  </Accordion>
</AccordionGroup>

## Dokumentacja API

### Schemat konfiguracji

```typescript
interface OpenClawConfig {
  broadcast?: {
    strategy?: "parallel" | "sequential";
    [peerId: string]: string[];
  };
}
```

### Pola

<ParamField path="strategy" type='"parallel" | "sequential"' default='"parallel"'>
  Jak przetwarzać agentów. `parallel` uruchamia wszystkich agentów jednocześnie; `sequential` uruchamia ich w kolejności z tablicy.
</ParamField>
<ParamField path="[peerId]" type="string[]">
  JID grupy WhatsApp, numer E.164 lub inny identyfikator peera. Wartością jest tablica identyfikatorów agentów, którzy powinni przetwarzać wiadomości.
</ParamField>

## Ograniczenia

1. **Maksymalna liczba agentów:** Brak twardego limitu, ale ponad 10 agentów może działać wolno.
2. **Wspólny kontekst:** Agenci nie widzą odpowiedzi innych agentów (celowo).
3. **Kolejność wiadomości:** Równoległe odpowiedzi mogą docierać w dowolnej kolejności.
4. **Limity szybkości:** Wszyscy agenci wliczają się do limitów szybkości WhatsApp.

## Przyszłe ulepszenia

Planowane funkcje:

- [ ] Tryb wspólnego kontekstu (agenci widzą odpowiedzi innych agentów)
- [ ] Koordynacja agentów (agenci mogą wysyłać sobie sygnały)
- [ ] Dynamiczny wybór agentów (wybór agentów na podstawie treści wiadomości)
- [ ] Priorytety agentów (niektórzy agenci odpowiadają przed innymi)

## Powiązane

- [Routing kanałów](/pl/channels/channel-routing)
- [Grupy](/pl/channels/groups)
- [Narzędzia piaskownicy dla wielu agentów](/pl/tools/multi-agent-sandbox-tools)
- [Parowanie](/pl/channels/pairing)
- [Zarządzanie sesją](/pl/concepts/session)
