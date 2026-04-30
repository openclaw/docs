---
read_when:
    - Wybór sposobu automatyzacji pracy z OpenClaw
    - Wybór między Heartbeat, Cron, zobowiązaniami, hookami i stałymi poleceniami
    - Szukasz właściwego punktu wejścia do automatyzacji
summary: 'Omówienie mechanizmów automatyzacji: zadania, Cron, hooki, stałe polecenia i TaskFlow'
title: Automatyzacja i zadania
x-i18n:
    generated_at: "2026-04-30T09:35:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: a2465c39f21db8bcb98f980a2c4b2c03018dddd5f43de59d8bf6ce0d6e97d9ef
    source_path: automation/index.md
    workflow: 16
---

OpenClaw uruchamia pracę w tle przez zadania, zaplanowane zadania, wywnioskowane
zobowiązania, haki zdarzeń oraz stałe instrukcje. Ta strona pomaga wybrać
właściwy mechanizm i zrozumieć, jak pasują do siebie.

## Szybki przewodnik decyzyjny

```mermaid
flowchart TD
    START([What do you need?]) --> Q1{Schedule work?}
    START --> Q2{Track detached work?}
    START --> Q3{Orchestrate multi-step flows?}
    START --> Q4{React to lifecycle events?}
    START --> Q5{Give the agent persistent instructions?}
    START --> Q6{Remember a natural follow-up?}

    Q1 -->|Yes| Q1a{Exact timing or flexible?}
    Q1a -->|Exact| CRON["Scheduled Tasks (Cron)"]
    Q1a -->|Flexible| HEARTBEAT[Heartbeat]

    Q2 -->|Yes| TASKS[Background Tasks]
    Q3 -->|Yes| FLOW[Task Flow]
    Q4 -->|Yes| HOOKS[Hooks]
    Q5 -->|Yes| SO[Standing Orders]
    Q6 -->|Yes| COMMITMENTS[Inferred Commitments]
```

| Przypadek użycia                         | Zalecane               | Dlaczego                                          |
| ---------------------------------------- | ---------------------- | ------------------------------------------------- |
| Wysyłanie dziennego raportu punktualnie o 9:00 | Scheduled Tasks (Cron) | Dokładny czas, izolowane wykonanie                |
| Przypomnij mi za 20 minut                | Scheduled Tasks (Cron) | Jednorazowe z precyzyjnym czasem (`--at`)         |
| Uruchamianie cotygodniowej głębokiej analizy | Scheduled Tasks (Cron) | Samodzielne zadanie, może używać innego modelu    |
| Sprawdzanie skrzynki co 30 min           | Heartbeat              | Grupuje z innymi sprawdzeniami, uwzględnia kontekst |
| Monitorowanie kalendarza pod kątem nadchodzących wydarzeń | Heartbeat              | Naturalnie pasuje do okresowej świadomości        |
| Sprawdzenie po wspomnianej rozmowie kwalifikacyjnej | Wywnioskowane zobowiązania | Kontynuacja podobna do pamięci, bez prośby o dokładne przypomnienie |
| Delikatne sprawdzenie samopoczucia po kontekście użytkownika | Wywnioskowane zobowiązania | Ograniczone do tego samego agenta i kanału        |
| Sprawdzenie stanu podagenta lub uruchomienia ACP | Zadania w tle          | Rejestr zadań śledzi całą odłączoną pracę         |
| Audyt tego, co zostało uruchomione i kiedy | Zadania w tle          | `openclaw tasks list` i `openclaw tasks audit`    |
| Wieloetapowe badanie, a następnie podsumowanie | Task Flow              | Trwała orkiestracja ze śledzeniem rewizji         |
| Uruchomienie skryptu przy resecie sesji  | Haki                   | Sterowane zdarzeniami, uruchamiane przy zdarzeniach cyklu życia |
| Wykonanie kodu przy każdym wywołaniu narzędzia | Haki Plugin           | Haki w procesie mogą przechwytywać wywołania narzędzi |
| Zawsze sprawdzaj zgodność przed odpowiedzią | Stałe polecenia        | Automatycznie wstrzykiwane do każdej sesji        |

### Scheduled Tasks (Cron) a Heartbeat

| Wymiar         | Scheduled Tasks (Cron)              | Heartbeat                             |
| -------------- | ----------------------------------- | ------------------------------------- |
| Czas           | Dokładny (wyrażenia cron, jednorazowe) | Przybliżony (domyślnie co 30 min)     |
| Kontekst sesji | Świeży (izolowany) lub współdzielony | Pełny kontekst głównej sesji          |
| Rekordy zadań  | Zawsze tworzone                     | Nigdy nietworzone                     |
| Dostarczenie   | Kanał, webhook lub tryb cichy       | Wbudowane w główną sesję              |
| Najlepsze do   | Raportów, przypomnień, zadań w tle  | Sprawdzeń skrzynki, kalendarza, powiadomień |

Użyj Scheduled Tasks (Cron), gdy potrzebujesz precyzyjnego czasu lub izolowanego wykonania. Użyj Heartbeat, gdy praca korzysta z pełnego kontekstu sesji i wystarcza przybliżony czas.

## Kluczowe pojęcia

### Zaplanowane zadania (cron)

Cron to wbudowany harmonogram Gateway do precyzyjnego planowania czasu. Utrwala zadania, wybudza agenta we właściwym momencie i może dostarczać wynik do kanału czatu lub punktu końcowego webhooka. Obsługuje jednorazowe przypomnienia, wyrażenia cykliczne i przychodzące wyzwalacze webhooków.

Zobacz [Scheduled Tasks](/pl/automation/cron-jobs).

### Zadania

Rejestr zadań w tle śledzi całą odłączoną pracę: uruchomienia ACP, tworzenie podagentów, izolowane wykonania cron i operacje CLI. Zadania są rekordami, nie harmonogramami. Użyj `openclaw tasks list` i `openclaw tasks audit`, aby je sprawdzić.

Zobacz [Background Tasks](/pl/automation/tasks).

### Wywnioskowane zobowiązania

Zobowiązania to opcjonalne, krótkotrwałe pamięci kontynuacji. OpenClaw wywnioskuje je
ze zwykłych rozmów, ogranicza do tego samego agenta i kanału oraz
dostarcza zaległe sprawdzenia przez Heartbeat. Dokładne przypomnienia wymagane przez użytkownika nadal
należą do cron.

Zobacz [Inferred Commitments](/pl/concepts/commitments).

### Task Flow

Task Flow to warstwa orkiestracji przepływów nad zadaniami w tle. Zarządza trwałymi wieloetapowymi przepływami z zarządzanymi i lustrzanymi trybami synchronizacji, śledzeniem rewizji oraz `openclaw tasks flow list|show|cancel` do kontroli.

Zobacz [Task Flow](/pl/automation/taskflow).

### Stałe polecenia

Stałe polecenia przyznają agentowi stałe uprawnienia operacyjne dla zdefiniowanych programów. Znajdują się w plikach obszaru roboczego (zwykle `AGENTS.md`) i są wstrzykiwane do każdej sesji. Połącz je z cron w celu egzekwowania opartego na czasie.

Zobacz [Standing Orders](/pl/automation/standing-orders).

### Haki

Wewnętrzne haki to skrypty sterowane zdarzeniami, wyzwalane przez zdarzenia cyklu życia agenta
(`/new`, `/reset`, `/stop`), Compaction sesji, uruchomienie Gateway i przepływ
wiadomości. Są automatycznie wykrywane z katalogów i można nimi zarządzać
za pomocą `openclaw hooks`. Do przechwytywania wywołań narzędzi w procesie użyj
[haków Plugin](/pl/plugins/hooks).

Zobacz [Hooks](/pl/automation/hooks).

### Heartbeat

Heartbeat to okresowy przebieg głównej sesji (domyślnie co 30 minut). Grupuje wiele sprawdzeń (skrzynka, kalendarz, powiadomienia) w jednej turze agenta z pełnym kontekstem sesji. Tury Heartbeat nie tworzą rekordów zadań i nie wydłużają świeżości dziennego/bezczynnego resetu sesji. Użyj `HEARTBEAT.md` jako krótkiej listy kontrolnej albo bloku `tasks:`, gdy chcesz wykonywać tylko zaległe okresowe sprawdzenia wewnątrz samego Heartbeat. Puste pliki Heartbeat są pomijane jako `empty-heartbeat-file`; tryb zadań tylko zaległych jest pomijany jako `no-tasks-due`. Heartbeats odraczają się, gdy praca cron jest aktywna lub w kolejce, a `heartbeat.skipWhenBusy` może też odraczać je, gdy podagent lub zagnieżdżone ścieżki są zajęte.

Zobacz [Heartbeat](/pl/gateway/heartbeat).

## Jak działają razem

- **Cron** obsługuje precyzyjne harmonogramy (dzienne raporty, cotygodniowe przeglądy) i jednorazowe przypomnienia. Wszystkie wykonania cron tworzą rekordy zadań.
- **Heartbeat** obsługuje rutynowe monitorowanie (skrzynka, kalendarz, powiadomienia) w jednej zgrupowanej turze co 30 minut.
- **Haki** reagują na konkretne zdarzenia (resety sesji, Compaction, przepływ wiadomości) za pomocą niestandardowych skryptów. Haki Plugin obejmują wywołania narzędzi.
- **Stałe polecenia** dają agentowi trwały kontekst i granice uprawnień.
- **Task Flow** koordynuje wieloetapowe przepływy ponad pojedynczymi zadaniami.
- **Zadania** automatycznie śledzą całą odłączoną pracę, aby można ją było sprawdzać i audytować.

## Powiązane

- [Scheduled Tasks](/pl/automation/cron-jobs) — precyzyjne planowanie i jednorazowe przypomnienia
- [Inferred Commitments](/pl/concepts/commitments) — sprawdzenia kontynuacyjne podobne do pamięci
- [Background Tasks](/pl/automation/tasks) — rejestr zadań dla całej odłączonej pracy
- [Task Flow](/pl/automation/taskflow) — trwała orkiestracja wieloetapowych przepływów
- [Hooks](/pl/automation/hooks) — skrypty cyklu życia sterowane zdarzeniami
- [Plugin hooks](/pl/plugins/hooks) — haki narzędzi, promptów, wiadomości i cyklu życia w procesie
- [Standing Orders](/pl/automation/standing-orders) — trwałe instrukcje agenta
- [Heartbeat](/pl/gateway/heartbeat) — okresowe tury głównej sesji
- [Configuration Reference](/pl/gateway/configuration-reference) — wszystkie klucze konfiguracji
