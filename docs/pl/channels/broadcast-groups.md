---
read_when:
    - Konfigurowanie grup rozgłoszeniowych
    - Debugowanie odpowiedzi wielu agentów w WhatsApp
sidebarTitle: Broadcast groups
status: experimental
summary: Roześlij wiadomość WhatsApp do wielu agentów
title: Grupy rozgłoszeniowe
x-i18n:
    generated_at: "2026-07-12T14:52:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2771c15b31592f11293385498b9c89decf84747a9172caafb994a5dca4bbdc06
    source_path: channels/broadcast-groups.md
    workflow: 16
---

<Note>
**Stan:** Eksperymentalne. Dodano w wersji 2026.1.9. Tylko WhatsApp (kanał internetowy).
</Note>

## Przegląd

Grupy rozgłoszeniowe uruchamiają **wiele agentów** dla tej samej wiadomości przychodzącej. Każdy agent przetwarza wiadomość we własnej odizolowanej sesji i publikuje własną odpowiedź, dzięki czemu jeden numer WhatsApp może obsługiwać zespół wyspecjalizowanych agentów w pojedynczym czacie grupowym lub wiadomościach prywatnych.

Grupy rozgłoszeniowe są uwzględniane po zastosowaniu list dozwolonych kanału i reguł aktywacji grupy. W grupach WhatsApp rozgłaszanie następuje, gdy OpenClaw normalnie udzieliłby odpowiedzi (na przykład po wzmiance, zależnie od ustawień grupy). Zmienia ono wyłącznie **to, którzy agenci są uruchamiani**, a nigdy to, czy wiadomość kwalifikuje się do przetworzenia.

Aktywna ścieżka kontroli jakości WhatsApp obejmuje `whatsapp-broadcast-group-fanout`, który sprawdza, czy jedna wiadomość grupowa ze wzmianką może wygenerować odrębne, widoczne odpowiedzi od dwóch skonfigurowanych agentów.

## Konfiguracja

### Konfiguracja podstawowa

Dodaj sekcję najwyższego poziomu `broadcast` (obok `bindings`). Kluczami są identyfikatory rozmówców WhatsApp, a wartościami — tablice identyfikatorów agentów:

- czaty grupowe: JID grupy (np. `120363403215116621@g.us`)
- wiadomości prywatne: numer telefonu nadawcy w formacie E.164 (np. `+15551234567`)

```json
{
  "broadcast": {
    "120363403215116621@g.us": ["alfred", "baerbel", "assistant3"]
  }
}
```

**Wynik:** gdy OpenClaw udzieliłby odpowiedzi na tym czacie, uruchamia wszystkich trzech agentów.

Każdy wymieniony identyfikator agenta musi istnieć w `agents.list`: walidacja konfiguracji zgłasza nieznane identyfikatory, a środowisko uruchomieniowe pomija je z ostrzeżeniem `Broadcast agent <id> not found in agents.list; skipping`.

### Strategia przetwarzania

`broadcast.strategy` określa sposób przetwarzania wiadomości przez agentów:

| Strategia              | Zachowanie                                                                |
| ---------------------- | ------------------------------------------------------------------------- |
| `parallel` (domyślna)  | Wszyscy agenci przetwarzają jednocześnie; odpowiedzi mogą nadejść w dowolnej kolejności. |
| `sequential`           | Agenci przetwarzają w kolejności tablicy; każdy czeka na zakończenie poprzedniego. |

```json
{
  "broadcast": {
    "strategy": "sequential",
    "120363403215116621@g.us": ["alfred", "baerbel"]
  }
}
```

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

## Sposób działania

### Przepływ wiadomości

<Steps>
  <Step title="Nadejście wiadomości przychodzącej">
    Nadchodzi wiadomość z grupy WhatsApp lub wiadomość prywatna.
  </Step>
  <Step title="Trasowanie i dopuszczenie">
    OpenClaw stosuje listy dozwolonych kanału, reguły aktywacji grupy i skonfigurowane przypisanie własności powiązania ACP.
  </Step>
  <Step title="Sprawdzenie rozgłaszania">
    Jeśli żadne skonfigurowane powiązanie ACP nie jest właścicielem trasy, OpenClaw sprawdza, czy identyfikator rozmówcy znajduje się w `broadcast`.
  </Step>
  <Step title="Jeśli rozgłaszanie ma zastosowanie">
    - Wszyscy wymienieni agenci przetwarzają wiadomość.
    - Każdy agent ma własny klucz sesji i odizolowany kontekst.
    - Agenci przetwarzają równolegle (domyślnie) lub sekwencyjnie.
    - Załączniki dźwiękowe są transkrybowane raz przed rozesłaniem, dzięki czemu agenci współdzielą jedną transkrypcję zamiast wykonywać osobne wywołania STT.

  </Step>
  <Step title="Jeśli rozgłaszanie nie ma zastosowania">
    OpenClaw przekazuje wiadomość zwykłą trasą lub skonfigurowaną trasą sesji ACP wybraną podczas trasowania.
  </Step>
</Steps>

<Note>
Grupy rozgłoszeniowe nie omijają list dozwolonych kanału ani reguł aktywacji grupy (wzmianki/polecenia/itp.). Zmieniają wyłącznie _to, którzy agenci są uruchamiani_, gdy wiadomość kwalifikuje się do przetworzenia.
</Note>

### Izolacja sesji

Każdy agent w grupie rozgłoszeniowej ma całkowicie odrębne:

- **Klucze sesji** (`agent:alfred:whatsapp:group:120363...` oraz `agent:baerbel:whatsapp:group:120363...`)
- **Historię konwersacji** (agent nie widzi odpowiedzi innych agentów)
- **Obszar roboczy** (oddzielne piaskownice, jeśli je skonfigurowano)
- **Dostęp do narzędzi** (różne listy dozwolonych i zabronionych narzędzi)
- **Pamięć/kontekst** (oddzielne pliki `IDENTITY.md`, `SOUL.md` itp.)

Jeden wyjątek jest celowo współdzielony: **bufor kontekstu grupy** (ostatnie wiadomości grupowe używane jako kontekst) jest współdzielony dla danego rozmówcy, dzięki czemu wszyscy agenci rozgłoszeniowi po wyzwoleniu widzą ten sam kontekst. Bufor jest czyszczony raz po zakończeniu rozesłania.

Pozwala to przypisać każdemu agentowi inną osobowość, modele, Skills i dostęp do narzędzi (na przykład tylko do odczytu albo do odczytu i zapisu).

### Przykład: odizolowane sesje

W grupie `120363403215116621@g.us` z agentami `["alfred", "baerbel"]`:

<Tabs>
  <Tab title="Kontekst Alfreda">
    ```text
    Session: agent:alfred:whatsapp:group:120363403215116621@g.us
    History: [user message, alfred's previous responses]
    Workspace: ~/openclaw-alfred/
    Tools: read, write, exec
    ```
  </Tab>
  <Tab title="Kontekst Baerbel">
    ```text
    Session: agent:baerbel:whatsapp:group:120363403215116621@g.us
    History: [user message, baerbel's previous responses]
    Workspace: ~/openclaw-baerbel/
    Tools: read only
    ```
  </Tab>
</Tabs>

## Przypadki użycia

- **Zespoły wyspecjalizowanych agentów**: grupa programistyczna, w której `code-reviewer`, `security-auditor`, `test-generator` i `docs-checker` odpowiadają na tę samą wiadomość, każdy ze swojej perspektywy.
- **Obsługa wielu języków**: jeden czat pomocy technicznej, na którym `support-en`, `support-de` i `support-es` odpowiadają w swoich językach.
- **Zapewnianie jakości**: `support-agent` odpowiada, a `qa-agent` sprawdza odpowiedź i reaguje tylko po wykryciu problemów.
- **Automatyzacja zadań**: `task-tracker`, `time-logger` i `report-generator` przetwarzają tę samą aktualizację stanu.

## Najlepsze praktyki

<AccordionGroup>
  <Accordion title="1. Dbaj o ścisłą specjalizację agentów">
    Przypisz każdemu agentowi jedno jasno określone zadanie (`formatter`, `linter`, `tester`) zamiast tworzyć jednego ogólnego agenta „dev-helper”.
  </Accordion>
  <Accordion title="2. Używaj opisowych identyfikatorów i nazw">
    ```json
    {
      "agents": {
        "list": [
          { "id": "security-scanner", "name": "Security Scanner" },
          { "id": "code-formatter", "name": "Code Formatter" },
          { "id": "test-generator", "name": "Test Generator" }
        ]
      }
    }
    ```
  </Accordion>
  <Accordion title="3. Skonfiguruj różne poziomy dostępu do narzędzi">
    ```json
    {
      "agents": {
        "list": [
          { "id": "reviewer", "tools": { "allow": ["read", "exec"] } },
          { "id": "fixer", "tools": { "allow": ["read", "write", "edit", "exec"] } }
        ]
      }
    }
    ```

    `reviewer` ma dostęp tylko do odczytu. `fixer` może odczytywać i zapisywać.

  </Accordion>
  <Accordion title="4. Monitoruj wydajność">
    Przy wielu agentach wybieraj `"strategy": "parallel"` (ustawienie domyślne), ograniczaj grupy rozgłoszeniowe do kilku agentów i używaj szybszych modeli dla prostszych agentów.
  </Accordion>
  <Accordion title="5. Awarie pozostają odizolowane">
    Awarie agentów są od siebie niezależne. Błąd jednego agenta jest zapisywany w dzienniku (`Broadcast agent <id> failed: ...`) i nie blokuje pozostałych.
  </Accordion>
</AccordionGroup>

## Zgodność

### Dostawcy

Grupy rozgłoszeniowe są obecnie zaimplementowane wyłącznie dla WhatsApp (kanału internetowego). Inne kanały ignorują konfigurację `broadcast`.

### Trasowanie

Grupy rozgłoszeniowe współdziałają z istniejącym trasowaniem:

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

- `GROUP_A`: odpowiada tylko alfred (zwykłe trasowanie).
- `GROUP_B`: odpowiadają agent1 ORAZ agent2 (rozgłaszanie).

<Note>
**Priorytet:** `broadcast` ma pierwszeństwo przed zwykłymi powiązaniami tras. Skonfigurowane powiązania ACP (`bindings[].type="acp"`) są wyłączne: gdy jedno z nich pasuje, OpenClaw przekazuje wiadomość do skonfigurowanej sesji ACP zamiast rozsyłać ją do wielu agentów.
</Note>

## Rozwiązywanie problemów

<AccordionGroup>
  <Accordion title="Agenci nie odpowiadają">
    **Sprawdź:**

    1. Identyfikatory agentów istnieją w `agents.list` (walidacja konfiguracji odrzuca nieznane identyfikatory).
    2. Format identyfikatora rozmówcy jest prawidłowy (JID grupy, na przykład `120363403215116621@g.us`, lub numer E.164, na przykład `+15551234567`, dla wiadomości prywatnych).
    3. Wiadomość przeszła standardowe mechanizmy dopuszczania (reguły wzmianek/aktywacji nadal obowiązują).

    **Debugowanie:**

    ```bash
    openclaw logs --follow | grep -i broadcast
    ```

    Pomyślne rozesłanie zapisuje w dzienniku komunikat `Broadcasting message to <n> agents (<strategy>)`.

  </Accordion>
  <Accordion title="Odpowiada tylko jeden agent">
    **Przyczyna:** identyfikator rozmówcy może znajdować się w zwykłych powiązaniach tras, ale nie w `broadcast`, albo może pasować do wyłącznego skonfigurowanego powiązania ACP.

    **Rozwiązanie:** dodaj rozmówców przypisanych do zwykłych tras do konfiguracji rozgłaszania albo usuń/zmień skonfigurowane powiązanie ACP, jeśli oczekiwane jest rozesłanie do wielu agentów.

  </Accordion>
  <Accordion title="Problemy z wydajnością">
    Jeśli działanie jest powolne przy wielu agentach: zmniejsz liczbę agentów w grupie, użyj lżejszych modeli i sprawdź czas uruchamiania piaskownicy.
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

    Jeden fragment kodu w grupie generuje cztery odpowiedzi: poprawki formatowania, wykryty problem z bezpieczeństwem, lukę w pokryciu testami i drobną uwagę dotyczącą dokumentacji.

  </Accordion>
  <Accordion title="Przykład 2: Wielojęzyczny potok">
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
  Sposób przetwarzania przez agentów. `parallel` uruchamia wszystkich agentów jednocześnie; `sequential` uruchamia ich w kolejności tablicy.
</ParamField>
<ParamField path="[peerId]" type="string[]">
  JID grupy WhatsApp lub numer telefonu w formacie E.164. Wartością jest tablica identyfikatorów agentów, którzy powinni przetwarzać wszystkie wiadomości od tego rozmówcy.
</ParamField>

## Ograniczenia

1. **Maksymalna liczba agentów:** brak sztywnego limitu, ale duża liczba agentów (10+) może powodować spowolnienie.
2. **Współdzielony kontekst:** agenci nie widzą odpowiedzi innych agentów (zgodnie z założeniem).
3. **Kolejność wiadomości:** odpowiedzi przetwarzane równolegle mogą nadejść w dowolnej kolejności.
4. **Limity częstotliwości:** wszystkie odpowiedzi są wysyłane z jednego konta WhatsApp, dlatego odpowiedź każdego agenta wlicza się do tych samych limitów częstotliwości WhatsApp.

## Powiązane

- [Routing kanałów](/pl/channels/channel-routing)
- [Grupy](/pl/channels/groups)
- [Narzędzia piaskownicy dla wielu agentów](/pl/tools/multi-agent-sandbox-tools)
- [Parowanie](/pl/channels/pairing)
- [Zarządzanie sesjami](/pl/concepts/session)
