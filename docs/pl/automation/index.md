---
read_when:
    - Wybór sposobu automatyzacji pracy z OpenClaw
    - Wybór między Heartbeat, Cron, zobowiązaniami, hookami i stałymi poleceniami
    - Szukasz właściwego punktu wejścia do automatyzacji
summary: 'Przegląd mechanizmów automatyzacji: zadania, Cron, hooki, stałe polecenia i TaskFlow'
title: Automatyzacja i zadania
x-i18n:
    generated_at: "2026-05-06T09:02:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: ee7f34fa4840c0e43e50d09e415b2529ef0c8bc3ccb6e3546b8a873c9458832d
    source_path: automation/index.md
    workflow: 16
---

OpenClaw uruchamia pracę w tle za pomocą zadań, zaplanowanych zadań, wywnioskowanych zobowiązań, hooków zdarzeń i stałych instrukcji. Ta strona pomaga wybrać właściwy mechanizm i zrozumieć, jak działają razem.

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

| Przypadek użycia                         | Zalecane                   | Dlaczego                                               |
| ---------------------------------------- | -------------------------- | ------------------------------------------------------ |
| Wyślij dzienny raport punktualnie o 9:00 | Zaplanowane zadania (Cron) | Dokładny czas, izolowane wykonanie                     |
| Przypomnij mi za 20 minut                | Zaplanowane zadania (Cron) | Jednorazowe z precyzyjnym czasem (`--at`)              |
| Uruchom cotygodniową głęboką analizę     | Zaplanowane zadania (Cron) | Samodzielne zadanie, może używać innego modelu         |
| Sprawdzaj skrzynkę co 30 min             | Heartbeat                  | Grupuje z innymi kontrolami, uwzględnia kontekst       |
| Monitoruj kalendarz pod kątem wydarzeń   | Heartbeat                  | Naturalne dopasowanie do okresowej świadomości         |
| Sprawdź po wspomnianej rozmowie          | Wywnioskowane zobowiązania | Dalszy kontakt podobny do pamięci, bez dokładnej prośby o przypomnienie |
| Delikatna kontrola po kontekście użytkownika | Wywnioskowane zobowiązania | Ograniczone do tego samego agenta i kanału             |
| Sprawdź status podagenta lub uruchomienia ACP | Zadania w tle          | Rejestr zadań śledzi całą odłączoną pracę              |
| Audyt tego, co uruchomiono i kiedy       | Zadania w tle              | `openclaw tasks list` i `openclaw tasks audit`         |
| Wieloetapowe badanie, a potem podsumowanie | Task Flow                | Trwała orkiestracja ze śledzeniem rewizji              |
| Uruchom skrypt przy resecie sesji        | Hooki                      | Sterowane zdarzeniami, uruchamiane przy zdarzeniach cyklu życia |
| Wykonuj kod przy każdym wywołaniu narzędzia | Hooki Plugin             | Hooki w procesie mogą przechwytywać wywołania narzędzi |
| Zawsze sprawdzaj zgodność przed odpowiedzią | Stałe polecenia         | Automatycznie wstrzykiwane do każdej sesji             |

### Zaplanowane zadania (Cron) kontra Heartbeat

| Wymiar          | Zaplanowane zadania (Cron)          | Heartbeat                             |
| --------------- | ----------------------------------- | ------------------------------------- |
| Czas            | Dokładny (wyrażenia cron, jednorazowe) | Przybliżony (domyślnie co 30 min)    |
| Kontekst sesji  | Świeży (izolowany) lub współdzielony | Pełny kontekst sesji głównej          |
| Rekordy zadań   | Zawsze tworzone                     | Nigdy nietworzone                     |
| Dostarczanie    | Kanał, webhook lub tryb cichy        | Wbudowane w sesję główną              |
| Najlepsze do    | Raportów, przypomnień, zadań w tle  | Sprawdzania skrzynki, kalendarza, powiadomień |

Używaj zaplanowanych zadań (Cron), gdy potrzebujesz precyzyjnego czasu lub izolowanego wykonania. Używaj Heartbeat, gdy praca korzysta z pełnego kontekstu sesji i wystarcza przybliżony czas.

## Podstawowe pojęcia

### Zaplanowane zadania (cron)

Cron to wbudowany harmonogram Gateway do precyzyjnego ustalania czasu. Utrwala zadania, budzi agenta we właściwym momencie i może dostarczać dane wyjściowe do kanału czatu lub punktu końcowego webhook. Obsługuje jednorazowe przypomnienia, cykliczne wyrażenia i przychodzące wyzwalacze webhook.

Zobacz [Zaplanowane zadania](/pl/automation/cron-jobs).

### Zadania

Rejestr zadań w tle śledzi całą odłączoną pracę: uruchomienia ACP, tworzenie podagentów, izolowane wykonania cron i operacje CLI. Zadania są rekordami, a nie harmonogramami. Używaj `openclaw tasks list` i `openclaw tasks audit`, aby je sprawdzać.

Zobacz [Zadania w tle](/pl/automation/tasks).

### Wywnioskowane zobowiązania

Zobowiązania to opcjonalne, krótkotrwałe pamięci dalszego kontaktu. OpenClaw wywnioskuje je ze zwykłych rozmów, ogranicza je do tego samego agenta i kanału oraz dostarcza wymagalne kontrole przez Heartbeat. Dokładne przypomnienia żądane przez użytkownika nadal należą do cron.

Zobacz [Wywnioskowane zobowiązania](/pl/concepts/commitments).

### Task Flow

Task Flow to podłoże orkiestracji przepływów nad zadaniami w tle. Zarządza trwałymi przepływami wieloetapowymi z zarządzanymi i lustrzanymi trybami synchronizacji, śledzeniem rewizji oraz `openclaw tasks flow list|show|cancel` do inspekcji.

Zobacz [Task Flow](/pl/automation/taskflow).

### Stałe polecenia

Stałe polecenia nadają agentowi stałe uprawnienia operacyjne dla zdefiniowanych programów. Znajdują się w plikach obszaru roboczego (zwykle `AGENTS.md`) i są wstrzykiwane do każdej sesji. Łącz je z cron w celu egzekwowania opartego na czasie.

Zobacz [Stałe polecenia](/pl/automation/standing-orders).

### Hooki

Wewnętrzne hooki to skrypty sterowane zdarzeniami, wyzwalane przez zdarzenia cyklu życia agenta (`/new`, `/reset`, `/stop`), Compaction sesji, uruchomienie Gateway i przepływ wiadomości. Są automatycznie wykrywane z katalogów i można nimi zarządzać za pomocą `openclaw hooks`. Do przechwytywania wywołań narzędzi w procesie używaj [hooków Plugin](/pl/plugins/hooks).

Zobacz [Hooki](/pl/automation/hooks).

### Heartbeat

Heartbeat to okresowa tura sesji głównej (domyślnie co 30 minut). Grupuje wiele kontroli (skrzynka, kalendarz, powiadomienia) w jednej turze agenta z pełnym kontekstem sesji. Tury Heartbeat nie tworzą rekordów zadań i nie przedłużają świeżości dziennego/resetu bezczynnej sesji. Użyj `HEARTBEAT.md` dla małej listy kontrolnej albo bloku `tasks:`, gdy chcesz wykonywać okresowe kontrole tylko wtedy, gdy są wymagalne, wewnątrz samego Heartbeat. Puste pliki Heartbeat są pomijane jako `empty-heartbeat-file`; tryb zadań tylko wymagalnych jest pomijany jako `no-tasks-due`. Heartbeat jest odraczany, gdy praca cron jest aktywna lub zakolejkowana, a `heartbeat.skipWhenBusy` może także odraczać go, gdy zajęte są pasma podagentów lub zagnieżdżone.

Zobacz [Heartbeat](/pl/gateway/heartbeat).

## Jak działają razem

- **Cron** obsługuje precyzyjne harmonogramy (dzienne raporty, cotygodniowe przeglądy) i jednorazowe przypomnienia. Wszystkie wykonania cron tworzą rekordy zadań.
- **Heartbeat** obsługuje rutynowe monitorowanie (skrzynka, kalendarz, powiadomienia) w jednej zgrupowanej turze co 30 minut.
- **Hooki** reagują na konkretne zdarzenia (resety sesji, Compaction, przepływ wiadomości) za pomocą niestandardowych skryptów. Hooki Plugin obejmują wywołania narzędzi.
- **Stałe polecenia** dają agentowi trwały kontekst i granice uprawnień.
- **Task Flow** koordynuje przepływy wieloetapowe nad pojedynczymi zadaniami.
- **Zadania** automatycznie śledzą całą odłączoną pracę, aby można ją było sprawdzać i audytować.

## Powiązane

- [Zaplanowane zadania](/pl/automation/cron-jobs) — precyzyjne harmonogramowanie i jednorazowe przypomnienia
- [Wywnioskowane zobowiązania](/pl/concepts/commitments) — kontrole dalszego kontaktu podobne do pamięci
- [Zadania w tle](/pl/automation/tasks) — rejestr zadań dla całej odłączonej pracy
- [Task Flow](/pl/automation/taskflow) — trwała orkiestracja przepływów wieloetapowych
- [Hooki](/pl/automation/hooks) — skrypty cyklu życia sterowane zdarzeniami
- [Hooki Plugin](/pl/plugins/hooks) — hooki narzędzi, promptów, wiadomości i cyklu życia w procesie
- [Stałe polecenia](/pl/automation/standing-orders) — trwałe instrukcje agenta
- [Heartbeat](/pl/gateway/heartbeat) — okresowe tury sesji głównej
- [Odniesienie konfiguracji](/pl/gateway/configuration-reference) — wszystkie klucze konfiguracji
