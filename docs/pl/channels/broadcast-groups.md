---
read_when:
    - Konfigurowanie grup rozgłoszeniowych
    - Debugowanie odpowiedzi wielu agentów w WhatsApp
status: experimental
summary: Wyślij wiadomość WhatsApp do wielu agentów
title: Grupy rozgłoszeniowe
x-i18n:
    generated_at: "2026-04-24T08:57:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: d1f3991348570170855158e82089fa073ca62b98855f443d4a227829d7c945ee
    source_path: channels/broadcast-groups.md
    workflow: 15
---

**Status:** Eksperymentalne  
**Wersja:** Dodano w 2026.1.9

## Przegląd

Grupy rozgłoszeniowe umożliwiają wielu agentom jednoczesne przetwarzanie tej samej wiadomości i odpowiadanie na nią. Pozwala to tworzyć wyspecjalizowane zespoły agentów, które współpracują w jednej grupie WhatsApp lub w wiadomości DM — wszystko przy użyciu jednego numeru telefonu.

Obecny zakres: **tylko WhatsApp** (kanał webowy).

Grupy rozgłoszeniowe są oceniane po listach dozwolonych kanału i regułach aktywacji grup. W grupach WhatsApp oznacza to, że rozgłaszanie następuje wtedy, gdy OpenClaw normalnie by odpowiedział (na przykład: przy wzmiance, zależnie od ustawień grupy).

## Przypadki użycia

### 1. Wyspecjalizowane zespoły agentów

Wdrażaj wielu agentów o atomowych, ukierunkowanych odpowiedzialnościach:

```
Group: "Development Team"
Agents:
  - CodeReviewer (reviews code snippets)
  - DocumentationBot (generates docs)
  - SecurityAuditor (checks for vulnerabilities)
  - TestGenerator (suggests test cases)
```

Każdy agent przetwarza tę samą wiadomość i przedstawia swoją wyspecjalizowaną perspektywę.

### 2. Obsługa wielu języków

```
Group: "International Support"
Agents:
  - Agent_EN (responds in English)
  - Agent_DE (responds in German)
  - Agent_ES (responds in Spanish)
```

### 3. Przepływy zapewniania jakości

```
Group: "Customer Support"
Agents:
  - SupportAgent (provides answer)
  - QAAgent (reviews quality, only responds if issues found)
```

### 4. Automatyzacja zadań

```
Group: "Project Management"
Agents:
  - TaskTracker (updates task database)
  - TimeLogger (logs time spent)
  - ReportGenerator (creates summaries)
```

## Konfiguracja

### Podstawowa konfiguracja

Dodaj sekcję najwyższego poziomu `broadcast` (obok `bindings`). Kluczami są identyfikatory peerów WhatsApp:

- czaty grupowe: grupowy JID (np. `120363403215116621@g.us`)
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

#### Równolegle (domyślnie)

Wszyscy agenci przetwarzają jednocześnie:

```json
{
  "broadcast": {
    "strategy": "parallel",
    "120363403215116621@g.us": ["alfred", "baerbel"]
  }
}
```

#### Sekwencyjnie

Agenci przetwarzają po kolei (jeden czeka na zakończenie poprzedniego):

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

## Jak to działa

### Przepływ wiadomości

1. **Przychodząca wiadomość** trafia do grupy WhatsApp
2. **Sprawdzenie rozgłaszania**: system sprawdza, czy identyfikator peera znajduje się w `broadcast`
3. **Jeśli jest na liście rozgłaszania**:
   - Wszyscy wymienieni agenci przetwarzają wiadomość
   - Każdy agent ma własny klucz sesji i odizolowany kontekst
   - Agenci przetwarzają równolegle (domyślnie) lub sekwencyjnie
4. **Jeśli nie ma go na liście rozgłaszania**:
   - Obowiązuje normalne kierowanie ruchem (pierwsze pasujące powiązanie)

Uwaga: grupy rozgłoszeniowe nie omijają list dozwolonych kanału ani reguł aktywacji grupy (wzmianki/polecenia/itp.). Zmieniają tylko _którzy agenci się uruchamiają_, gdy wiadomość kwalifikuje się do przetworzenia.

### Izolacja sesji

Każdy agent w grupie rozgłoszeniowej utrzymuje całkowicie oddzielne:

- **Klucze sesji** (`agent:alfred:whatsapp:group:120363...` vs `agent:baerbel:whatsapp:group:120363...`)
- **Historię rozmowy** (agent nie widzi wiadomości innych agentów)
- **Przestrzeń roboczą** (oddzielne sandboxy, jeśli są skonfigurowane)
- **Dostęp do narzędzi** (różne listy dozwolonych/zabronionych)
- **Pamięć/kontekst** (oddzielne `IDENTITY.md`, `SOUL.md` itd.)
- **Bufor kontekstu grupy** (ostatnie wiadomości grupowe używane jako kontekst) jest współdzielony na peera, więc wszyscy agenci rozgłoszeniowi widzą ten sam kontekst po wyzwoleniu

Dzięki temu każdy agent może mieć:

- Inną osobowość
- Inny dostęp do narzędzi (np. tylko do odczytu vs odczyt-zapis)
- Inne modele (np. opus vs sonnet)
- Inne zainstalowane Skills

### Przykład: odizolowane sesje

W grupie `120363403215116621@g.us` z agentami `["alfred", "baerbel"]`:

**Kontekst Alfreda:**

```
Session: agent:alfred:whatsapp:group:120363403215116621@g.us
History: [user message, alfred's previous responses]
Workspace: /Users/user/openclaw-alfred/
Tools: read, write, exec
```

**Kontekst Bärbel:**

```
Session: agent:baerbel:whatsapp:group:120363403215116621@g.us
History: [user message, baerbel's previous responses]
Workspace: /Users/user/openclaw-baerbel/
Tools: read only
```

## Sprawdzone praktyki

### 1. Utrzymuj wyraźne role agentów

Projektuj każdego agenta z jedną, jasno określoną odpowiedzialnością:

```json
{
  "broadcast": {
    "DEV_GROUP": ["formatter", "linter", "tester"]
  }
}
```

✅ **Dobrze:** Każdy agent ma jedno zadanie  
❌ **Źle:** Jeden ogólny agent „dev-helper”

### 2. Używaj opisowych nazw

Niech będzie jasne, co robi każdy agent:

```json
{
  "agents": {
    "security-scanner": { "name": "Security Scanner" },
    "code-formatter": { "name": "Code Formatter" },
    "test-generator": { "name": "Test Generator" }
  }
}
```

### 3. Skonfiguruj różny dostęp do narzędzi

Dawaj agentom tylko te narzędzia, których potrzebują:

```json
{
  "agents": {
    "reviewer": {
      "tools": { "allow": ["read", "exec"] } // Tylko odczyt
    },
    "fixer": {
      "tools": { "allow": ["read", "write", "edit", "exec"] } // Odczyt-zapis
    }
  }
}
```

### 4. Monitoruj wydajność

Przy wielu agentach rozważ:

- Użycie `"strategy": "parallel"` (domyślnie) dla szybkości
- Ograniczenie grup rozgłoszeniowych do 5–10 agentów
- Używanie szybszych modeli dla prostszych agentów

### 5. Obsługuj awarie w sposób odporny

Agenci zawodzą niezależnie od siebie. Błąd jednego agenta nie blokuje pozostałych:

```
Message → [Agent A ✓, Agent B ✗ error, Agent C ✓]
Result: Agent A and C respond, Agent B logs error
```

## Zgodność

### Dostawcy

Grupy rozgłoszeniowe obecnie działają z:

- ✅ WhatsApp (zaimplementowane)
- 🚧 Telegram (planowane)
- 🚧 Discord (planowane)
- 🚧 Slack (planowane)

### Routing

Grupy rozgłoszeniowe działają równolegle z istniejącym routingiem:

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

- `GROUP_A`: odpowiada tylko alfred (normalny routing)
- `GROUP_B`: odpowiadają agent1 ORAZ agent2 (rozgłaszanie)

**Priorytet:** `broadcast` ma pierwszeństwo przed `bindings`.

## Rozwiązywanie problemów

### Agenci nie odpowiadają

**Sprawdź:**

1. Czy identyfikatory agentów istnieją w `agents.list`
2. Czy format identyfikatora peera jest poprawny (np. `120363403215116621@g.us`)
3. Czy agenci nie znajdują się na listach zabronionych

**Debugowanie:**

```bash
tail -f ~/.openclaw/logs/gateway.log | grep broadcast
```

### Odpowiada tylko jeden agent

**Przyczyna:** Identyfikator peera może być w `bindings`, ale nie w `broadcast`.

**Naprawa:** Dodaj go do konfiguracji broadcast albo usuń z bindings.

### Problemy z wydajnością

**Jeśli jest wolno przy wielu agentach:**

- Zmniejsz liczbę agentów na grupę
- Używaj lżejszych modeli (sonnet zamiast opus)
- Sprawdź czas uruchamiania sandboxa

## Przykłady

### Przykład 1: zespół do przeglądu kodu

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

**Użytkownik wysyła:** fragment kodu  
**Odpowiedzi:**

- code-formatter: „Naprawiono wcięcia i dodano podpowiedzi typów”
- security-scanner: „⚠️ Podatność SQL injection w linii 12”
- test-coverage: „Pokrycie wynosi 45%, brakuje testów dla przypadków błędów”
- docs-checker: „Brakuje docstringa dla funkcji `process_data`”

### Przykład 2: obsługa wielu języków

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

- `strategy` (opcjonalne): sposób przetwarzania agentów
  - `"parallel"` (domyślnie): wszyscy agenci przetwarzają jednocześnie
  - `"sequential"`: agenci przetwarzają w kolejności tablicy
- `[peerId]`: grupowy JID WhatsApp, numer E.164 lub inny identyfikator peera
  - Wartość: tablica identyfikatorów agentów, które powinny przetwarzać wiadomości

## Ograniczenia

1. **Maksymalna liczba agentów:** brak sztywnego limitu, ale 10+ agentów może działać wolno
2. **Współdzielony kontekst:** agenci nie widzą odpowiedzi innych agentów (celowo)
3. **Kolejność wiadomości:** odpowiedzi równoległe mogą przychodzić w dowolnej kolejności
4. **Limity szybkości:** wszyscy agenci liczą się do limitów szybkości WhatsApp

## Przyszłe ulepszenia

Planowane funkcje:

- [ ] Tryb współdzielonego kontekstu (agenci widzą nawzajem swoje odpowiedzi)
- [ ] Koordynacja agentów (agenci mogą sygnalizować sobie nawzajem)
- [ ] Dynamiczny wybór agentów (dobór agentów na podstawie treści wiadomości)
- [ ] Priorytety agentów (niektórzy agenci odpowiadają przed innymi)

## Powiązane

- [Groups](/pl/channels/groups)
- [Channel routing](/pl/channels/channel-routing)
- [Pairing](/pl/channels/pairing)
- [Multi-agent sandbox tools](/pl/tools/multi-agent-sandbox-tools)
- [Session management](/pl/concepts/session)
