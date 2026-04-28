---
read_when:
    - Konfigurowanie grup rozgłoszeniowych
    - Debugowanie odpowiedzi wielu agentów w WhatsApp
sidebarTitle: Broadcast groups
status: experimental
summary: Rozgłoś wiadomość WhatsApp do wielu agentów
title: Grupy rozgłoszeniowe
x-i18n:
    generated_at: "2026-04-26T11:22:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: b7b36710d9cc3eb4e2b8ba3d57031bd020aedbb6a502b400ec02a835a320d609
    source_path: channels/broadcast-groups.md
    workflow: 15
---

<Note>
**Status:** Eksperymentalne. Dodano w 2026.1.9.
</Note>

## Omówienie

Grupy rozgłoszeniowe umożliwiają wielu agentom jednoczesne przetwarzanie tej samej wiadomości i odpowiadanie na nią. Pozwala to tworzyć wyspecjalizowane zespoły agentów, które współpracują w jednej grupie WhatsApp lub w wiadomości prywatnej — wszystko przy użyciu jednego numeru telefonu.

Obecny zakres: **tylko WhatsApp** (kanał webowy).

Grupy rozgłoszeniowe są oceniane po listach dozwolonych kanałów i regułach aktywacji grup. W grupach WhatsApp oznacza to, że rozgłaszanie następuje wtedy, gdy OpenClaw normalnie by odpowiedział (na przykład po wzmiance, zależnie od ustawień grupy).

## Przypadki użycia

<AccordionGroup>
  <Accordion title="1. Wyspecjalizowane zespoły agentów">
    Wdróż wielu agentów o atomowych, ukierunkowanych obowiązkach:

    ```
    Group: "Zespół programistyczny"
    Agents:
      - CodeReviewer (recenzuje fragmenty kodu)
      - DocumentationBot (generuje dokumentację)
      - SecurityAuditor (sprawdza podatności)
      - TestGenerator (sugeruje przypadki testowe)
    ```

    Każdy agent przetwarza tę samą wiadomość i dostarcza swoją wyspecjalizowaną perspektywę.

  </Accordion>
  <Accordion title="2. Obsługa wielu języków">
    ```
    Group: "Wsparcie międzynarodowe"
    Agents:
      - Agent_EN (odpowiada po angielsku)
      - Agent_DE (odpowiada po niemiecku)
      - Agent_ES (odpowiada po hiszpańsku)
    ```
  </Accordion>
  <Accordion title="3. Przepływy pracy zapewnienia jakości">
    ```
    Group: "Obsługa klienta"
    Agents:
      - SupportAgent (udziela odpowiedzi)
      - QAAgent (sprawdza jakość, odpowiada tylko w razie wykrycia problemów)
    ```
  </Accordion>
  <Accordion title="4. Automatyzacja zadań">
    ```
    Group: "Zarządzanie projektami"
    Agents:
      - TaskTracker (aktualizuje bazę zadań)
      - TimeLogger (rejestruje poświęcony czas)
      - ReportGenerator (tworzy podsumowania)
    ```
  </Accordion>
</AccordionGroup>

## Konfiguracja

### Podstawowa konfiguracja

Dodaj sekcję najwyższego poziomu `broadcast` (obok `bindings`). Klucze to identyfikatory peerów WhatsApp:

- czaty grupowe: JID grupy (np. `120363403215116621@g.us`)
- wiadomości prywatne: numer telefonu w formacie E.164 (np. `+15551234567`)

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
    Agenci przetwarzają po kolei (jeden czeka na zakończenie poprzedniego):

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
  <Step title="Nadchodzi wiadomość przychodząca">
    Nadchodzi wiadomość z grupy WhatsApp lub wiadomość prywatna.
  </Step>
  <Step title="Sprawdzenie rozgłaszania">
    System sprawdza, czy identyfikator peera znajduje się w `broadcast`.
  </Step>
  <Step title="Jeśli znajduje się na liście rozgłaszania">
    - Wszyscy wymienieni agenci przetwarzają wiadomość.
    - Każdy agent ma własny klucz sesji i odizolowany kontekst.
    - Agenci przetwarzają równolegle (domyślnie) albo sekwencyjnie.

  </Step>
  <Step title="Jeśli nie znajduje się na liście rozgłaszania">
    Obowiązuje zwykłe trasowanie (pierwsze pasujące powiązanie).
  </Step>
</Steps>

<Note>
Grupy rozgłoszeniowe nie omijają list dozwolonych kanałów ani reguł aktywacji grup (wzmianki/polecenia/itp.). Zmieniają jedynie _którzy agenci są uruchamiani_, gdy wiadomość kwalifikuje się do przetworzenia.
</Note>

### Izolacja sesji

Każdy agent w grupie rozgłoszeniowej utrzymuje całkowicie oddzielne:

- **Klucze sesji** (`agent:alfred:whatsapp:group:120363...` vs `agent:baerbel:whatsapp:group:120363...`)
- **Historię rozmowy** (agent nie widzi wiadomości innych agentów)
- **Workspace** (oddzielne sandboxy, jeśli skonfigurowano)
- **Dostęp do narzędzi** (różne listy dozwolone/zabronione)
- **Pamięć/kontekst** (oddzielne pliki IDENTITY.md, SOUL.md itd.)
- **Bufor kontekstu grupy** (ostatnie wiadomości grupowe używane jako kontekst) jest współdzielony na poziomie peera, więc wszyscy agenci rozgłoszeniowi widzą ten sam kontekst po uruchomieniu

Pozwala to każdemu agentowi mieć:

- Różne osobowości
- Różny dostęp do narzędzi (np. tylko do odczytu vs. odczyt-zapis)
- Różne modele (np. opus vs. sonnet)
- Różne zainstalowane Skills

### Przykład: odizolowane sesje

W grupie `120363403215116621@g.us` z agentami `["alfred", "baerbel"]`:

<Tabs>
  <Tab title="Kontekst Alfreda">
    ```
    Session: agent:alfred:whatsapp:group:120363403215116621@g.us
    History: [wiadomość użytkownika, wcześniejsze odpowiedzi alfreda]
    Workspace: /Users/user/openclaw-alfred/
    Tools: read, write, exec
    ```
  </Tab>
  <Tab title="Kontekst Bärbel">
    ```
    Session: agent:baerbel:whatsapp:group:120363403215116621@g.us
    History: [wiadomość użytkownika, wcześniejsze odpowiedzi baerbel]
    Workspace: /Users/user/openclaw-baerbel/
    Tools: tylko read
    ```
  </Tab>
</Tabs>

## Dobre praktyki

<AccordionGroup>
  <Accordion title="1. Utrzymuj agentów w wąskim zakresie odpowiedzialności">
    Projektuj każdego agenta z jedną, jasno określoną odpowiedzialnością:

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
    Jasno określ, czym zajmuje się każdy agent:

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
    Przydziel agentom tylko te narzędzia, których potrzebują:

    ```json
    {
      "agents": {
        "reviewer": {
          "tools": { "allow": ["read", "exec"] } // Tylko do odczytu
        },
        "fixer": {
          "tools": { "allow": ["read", "write", "edit", "exec"] } // Odczyt-zapis
        }
      }
    }
    ```

  </Accordion>
  <Accordion title="4. Monitoruj wydajność">
    Przy wielu agentach rozważ:

    - Użycie `"strategy": "parallel"` (domyślnie) dla szybkości
    - Ograniczenie grup rozgłoszeniowych do 5–10 agentów
    - Użycie szybszych modeli dla prostszych agentów

  </Accordion>
  <Accordion title="5. Obsługuj awarie z zachowaniem odporności">
    Agenci zawodzą niezależnie od siebie. Błąd jednego agenta nie blokuje pozostałych:

    ```
    Wiadomość → [Agent A ✓, Agent B ✗ błąd, Agent C ✓]
    Wynik: Agent A i C odpowiadają, Agent B zapisuje błąd w logach
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

### Trasowanie

Grupy rozgłoszeniowe działają równolegle z istniejącym trasowaniem:

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

- `GROUP_A`: Odpowiada tylko alfred (zwykłe trasowanie).
- `GROUP_B`: Odpowiadają agent1 ORAZ agent2 (rozgłaszanie).

<Note>
**Pierwszeństwo:** `broadcast` ma wyższy priorytet niż `bindings`.
</Note>

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Agenci nie odpowiadają">
    **Sprawdź:**

    1. Identyfikatory agentów istnieją w `agents.list`.
    2. Format identyfikatora peera jest poprawny (np. `120363403215116621@g.us`).
    3. Agenci nie znajdują się na listach zabronionych.

    **Debugowanie:**

    ```bash
    tail -f ~/.openclaw/logs/gateway.log | grep broadcast
    ```

  </Accordion>
  <Accordion title="Odpowiada tylko jeden agent">
    **Przyczyna:** Identyfikator peera może znajdować się w `bindings`, ale nie w `broadcast`.

    **Naprawa:** Dodaj go do konfiguracji broadcast albo usuń z bindings.

  </Accordion>
  <Accordion title="Problemy z wydajnością">
    Jeśli przy wielu agentach działa wolno:

    - Zmniejsz liczbę agentów w grupie.
    - Używaj lżejszych modeli (sonnet zamiast opus).
    - Sprawdź czas uruchamiania sandboxa.

  </Accordion>
</AccordionGroup>

## Przykłady

<AccordionGroup>
  <Accordion title="Przykład 1: Zespół recenzji kodu">
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

    - code-formatter: "Poprawiono wcięcia i dodano podpowiedzi typów"
    - security-scanner: "⚠️ Podatność na SQL injection w linii 12"
    - test-coverage: "Pokrycie wynosi 45%, brakuje testów dla przypadków błędów"
    - docs-checker: "Brak docstringa dla funkcji `process_data`"

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
  JID grupy WhatsApp, numer E.164 lub inny identyfikator peera. Wartością jest tablica identyfikatorów agentów, które mają przetwarzać wiadomości.
</ParamField>

## Ograniczenia

1. **Maksymalna liczba agentów:** Brak twardego limitu, ale ponad 10 agentów może działać wolno.
2. **Współdzielony kontekst:** Agenci nie widzą nawzajem swoich odpowiedzi (zgodnie z założeniem).
3. **Kolejność wiadomości:** Odpowiedzi równoległe mogą przychodzić w dowolnej kolejności.
4. **Limity szybkości:** Wszyscy agenci są wliczani do limitów szybkości WhatsApp.

## Przyszłe ulepszenia

Planowane funkcje:

- [ ] Tryb współdzielonego kontekstu (agenci widzą nawzajem swoje odpowiedzi)
- [ ] Koordynacja agentów (agenci mogą sygnalizować sobie nawzajem)
- [ ] Dynamiczny wybór agentów (wybór agentów na podstawie treści wiadomości)
- [ ] Priorytety agentów (niektórzy agenci odpowiadają przed innymi)

## Powiązane

- [Trasowanie kanałów](/pl/channels/channel-routing)
- [Grupy](/pl/channels/groups)
- [Narzędzia sandboxa dla wielu agentów](/pl/tools/multi-agent-sandbox-tools)
- [Parowanie](/pl/channels/pairing)
- [Zarządzanie sesjami](/pl/concepts/session)
