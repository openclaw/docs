---
read_when:
    - Konfigurowanie grup rozgłoszeniowych
    - Debugowanie odpowiedzi wielu agentów w WhatsApp
sidebarTitle: Broadcast groups
status: experimental
summary: Wyślij wiadomość WhatsApp do wielu agentów
title: Grupy rozgłoszeniowe
x-i18n:
    generated_at: "2026-04-30T09:35:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: b0de4ccc85bf79e2ceb1dddd60db067309b15b7f876c92e7d591ff0b4b4315ec
    source_path: channels/broadcast-groups.md
    workflow: 16
---

<Note>
**Status:** Eksperymentalne. Dodano w 2026.1.9.
</Note>

## Omówienie

Grupy rozgłoszeniowe umożliwiają wielu agentom jednoczesne przetwarzanie tej samej wiadomości i odpowiadanie na nią. Pozwala to tworzyć wyspecjalizowane zespoły agentów, które współpracują w jednej grupie WhatsApp lub DM — wszystko przy użyciu jednego numeru telefonu.

Obecny zakres: **tylko WhatsApp** (kanał web).

Grupy rozgłoszeniowe są oceniane po allowlistach kanałów i regułach aktywacji grup. W grupach WhatsApp oznacza to, że rozgłoszenia następują wtedy, gdy OpenClaw normalnie by odpowiedział (na przykład: po wzmiance, zależnie od ustawień grupy).

## Przypadki użycia

<AccordionGroup>
  <Accordion title="1. Wyspecjalizowane zespoły agentów">
    Wdróż wielu agentów o atomowych, skoncentrowanych odpowiedzialnościach:

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
  <Accordion title="2. Obsługa wielu języków">
    ```
    Group: "International Support"
    Agents:
      - Agent_EN (responds in English)
      - Agent_DE (responds in German)
      - Agent_ES (responds in Spanish)
    ```
  </Accordion>
  <Accordion title="3. Przepływy pracy kontroli jakości">
    ```
    Group: "Customer Support"
    Agents:
      - SupportAgent (provides answer)
      - QAAgent (reviews quality, only responds if issues found)
    ```
  </Accordion>
  <Accordion title="4. Automatyzacja zadań">
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
- DM: numer telefonu E.164 (np. `+15551234567`)

```json
{
  "broadcast": {
    "120363403215116621@g.us": ["alfred", "baerbel", "assistant3"]
  }
}
```

**Wynik:** Gdy OpenClaw miałby odpowiedzieć w tym czacie, uruchomi wszystkich trzech agentów.

### Strategia przetwarzania

Kontroluj sposób przetwarzania wiadomości przez agentów:

<Tabs>
  <Tab title="parallel (domyślnie)">
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
    Agenci przetwarzają w kolejności (jeden czeka, aż poprzedni zakończy):

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

### Kompletny przykład

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
  <Step title="Przychodzi wiadomość przychodząca">
    Przychodzi wiadomość z grupy WhatsApp lub DM.
  </Step>
  <Step title="Sprawdzenie rozgłoszenia">
    System sprawdza, czy ID peera znajduje się w `broadcast`.
  </Step>
  <Step title="Jeśli jest na liście rozgłoszeniowej">
    - Wszyscy wymienieni agenci przetwarzają wiadomość.
    - Każdy agent ma własny klucz sesji i izolowany kontekst.
    - Agenci przetwarzają równolegle (domyślnie) lub sekwencyjnie.

  </Step>
  <Step title="Jeśli nie ma go na liście rozgłoszeniowej">
    Obowiązuje normalne routowanie (pierwsze pasujące powiązanie).
  </Step>
</Steps>

<Note>
Grupy rozgłoszeniowe nie omijają allowlist kanałów ani reguł aktywacji grup (wzmianek/poleceń/itd.). Zmieniają tylko _którzy agenci są uruchamiani_, gdy wiadomość kwalifikuje się do przetwarzania.
</Note>

### Izolacja sesji

Każdy agent w grupie rozgłoszeniowej utrzymuje całkowicie oddzielne:

- **Klucze sesji** (`agent:alfred:whatsapp:group:120363...` vs `agent:baerbel:whatsapp:group:120363...`)
- **Historię rozmowy** (agent nie widzi wiadomości innych agentów)
- **Obszar roboczy** (oddzielne piaskownice, jeśli skonfigurowano)
- **Dostęp do narzędzi** (różne listy allow/deny)
- **Pamięć/kontekst** (oddzielne IDENTITY.md, SOUL.md, itd.)
- **Bufor kontekstu grupy** (ostatnie wiadomości grupowe używane jako kontekst) jest współdzielony na peer, więc wszyscy agenci rozgłoszeniowi widzą ten sam kontekst po wyzwoleniu

Dzięki temu każdy agent może mieć:

- Różne osobowości
- Różny dostęp do narzędzi (np. tylko do odczytu vs. odczyt-zapis)
- Różne modele (np. opus vs. sonnet)
- Różne zainstalowane Skills

### Przykład: izolowane sesje

W grupie `120363403215116621@g.us` z agentami `["alfred", "baerbel"]`:

<Tabs>
  <Tab title="Kontekst Alfreda">
    ```
    Session: agent:alfred:whatsapp:group:120363403215116621@g.us
    History: [user message, alfred's previous responses]
    Workspace: /Users/user/openclaw-alfred/
    Tools: read, write, exec
    ```
  </Tab>
  <Tab title="Kontekst Bärbel">
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
  <Accordion title="1. Utrzymuj agentów skoncentrowanych">
    Zaprojektuj każdego agenta z jedną, jasną odpowiedzialnością:

    ```json
    {
      "broadcast": {
        "DEV_GROUP": ["formatter", "linter", "tester"]
      }
    }
    ```

    ✅ **Dobrze:** Każdy agent ma jedno zadanie. ❌ **Źle:** Jeden ogólny agent „dev-helper”.

  </Accordion>
  <Accordion title="2. Używaj opisowych nazw">
    Jasno pokaż, co robi każdy agent:

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
  <Accordion title="3. Skonfiguruj różny dostęp do narzędzi">
    Przyznaj agentom tylko te narzędzia, których potrzebują:

    ```json
    {
      "agents": {
        "reviewer": {
          "tools": { "allow": ["read", "exec"] } // Read-only
        },
        "fixer": {
          "tools": { "allow": ["read", "write", "edit", "exec"] } // Read-write
        }
      }
    }
    ```

  </Accordion>
  <Accordion title="4. Monitoruj wydajność">
    Przy wielu agentach rozważ:

    - Użycie `"strategy": "parallel"` (domyślnie) dla szybkości
    - Ograniczenie grup rozgłoszeniowych do 5-10 agentów
    - Użycie szybszych modeli dla prostszych agentów

  </Accordion>
  <Accordion title="5. Obsługuj awarie łagodnie">
    Agenci zawodzą niezależnie. Błąd jednego agenta nie blokuje innych:

    ```
    Message → [Agent A ✓, Agent B ✗ error, Agent C ✓]
    Result: Agent A and C respond, Agent B logs error
    ```

  </Accordion>
</AccordionGroup>

## Zgodność

### Dostawcy

Grupy rozgłoszeniowe obecnie działają z:

- ✅ WhatsApp (zaimplementowano)
- 🚧 Telegram (planowane)
- 🚧 Discord (planowane)
- 🚧 Slack (planowane)

### Routowanie

Grupy rozgłoszeniowe działają razem z istniejącym routowaniem:

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

- `GROUP_A`: Odpowiada tylko alfred (normalne routowanie).
- `GROUP_B`: Odpowiadają agent1 ORAZ agent2 (rozgłoszenie).

<Note>
**Pierwszeństwo:** `broadcast` ma pierwszeństwo przed `bindings`.
</Note>

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Agenci nie odpowiadają">
    **Sprawdź:**

    1. ID agentów istnieją w `agents.list`.
    2. Format ID peera jest poprawny (np. `120363403215116621@g.us`).
    3. Agenci nie znajdują się na listach deny.

    **Debugowanie:**

    ```bash
    tail -f ~/.openclaw/logs/gateway.log | grep broadcast
    ```

  </Accordion>
  <Accordion title="Odpowiada tylko jeden agent">
    **Przyczyna:** ID peera może znajdować się w `bindings`, ale nie w `broadcast`.

    **Poprawka:** Dodaj do konfiguracji rozgłoszenia albo usuń z powiązań.

  </Accordion>
  <Accordion title="Problemy z wydajnością">
    Jeśli działa wolno przy wielu agentach:

    - Zmniejsz liczbę agentów na grupę.
    - Użyj lżejszych modeli (sonnet zamiast opus).
    - Sprawdź czas uruchamiania piaskownicy.

  </Accordion>
</AccordionGroup>

## Przykłady

<AccordionGroup>
  <Accordion title="Przykład 1: Zespół przeglądu kodu">
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

    - code-formatter: „Naprawiono wcięcia i dodano adnotacje typów”
    - security-scanner: „⚠️ Luka SQL injection w linii 12”
    - test-coverage: „Pokrycie wynosi 45%, brakuje testów dla przypadków błędów”
    - docs-checker: „Brak docstring dla funkcji `process_data`”

  </Accordion>
  <Accordion title="Przykład 2: Obsługa wielu języków">
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
  Sposób przetwarzania agentów. `parallel` uruchamia wszystkich agentów jednocześnie; `sequential` uruchamia ich w kolejności tablicy.
</ParamField>
<ParamField path="[peerId]" type="string[]">
  JID grupy WhatsApp, numer E.164 lub inne ID peera. Wartością jest tablica ID agentów, którzy powinni przetwarzać wiadomości.
</ParamField>

## Ograniczenia

1. **Maksymalna liczba agentów:** Brak sztywnego limitu, ale 10+ agentów może działać wolno.
2. **Współdzielony kontekst:** Agenci nie widzą odpowiedzi innych agentów (celowo).
3. **Kolejność wiadomości:** Odpowiedzi równoległe mogą nadejść w dowolnej kolejności.
4. **Limity szybkości:** Wszyscy agenci wliczają się do limitów szybkości WhatsApp.

## Przyszłe usprawnienia

Planowane funkcje:

- [ ] Tryb współdzielonego kontekstu (agenci widzą odpowiedzi innych agentów)
- [ ] Koordynacja agentów (agenci mogą sygnalizować sobie nawzajem)
- [ ] Dynamiczny wybór agentów (wybór agentów na podstawie treści wiadomości)
- [ ] Priorytety agentów (niektórzy agenci odpowiadają przed innymi)

## Powiązane

- [Routing kanałów](/pl/channels/channel-routing)
- [Grupy](/pl/channels/groups)
- [Narzędzia piaskownicy wieloagentowej](/pl/tools/multi-agent-sandbox-tools)
- [Parowanie](/pl/channels/pairing)
- [Zarządzanie sesjami](/pl/concepts/session)
