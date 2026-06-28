---
doc-schema-version: 1
read_when:
    - Wybór sposobu automatyzacji pracy z OpenClaw
    - Wybór między Heartbeat, Cron, zobowiązaniami, hookami i stałymi poleceniami
    - Szukasz właściwego punktu wejścia automatyzacji
summary: 'Przegląd mechanizmów automatyzacji: zadania, Cron, hooki, stałe polecenia i przepływ zadań'
title: Automatyzacja
x-i18n:
    generated_at: "2026-05-12T23:29:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 311ebbd557e40e38cd25b2f11b887baa4576657095d5a0841d4cb7f71898927d
    source_path: automation/index.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw wykonuje pracę w tle za pomocą zadań, zaplanowanych zadań, wywnioskowanych zobowiązań, hooków zdarzeń i stałych poleceń. Ta strona pomaga wybrać właściwy mechanizm i zrozumieć, jak pasują do siebie.

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

| Przypadek użycia                                  | Zalecane                         | Dlaczego                                                  |
| ------------------------------------------------- | -------------------------------- | --------------------------------------------------------- |
| Wyślij dzienny raport punktualnie o 9:00          | Zaplanowane zadania (Cron)       | Dokładny czas, izolowane wykonanie                        |
| Przypomnij mi za 20 minut                         | Zaplanowane zadania (Cron)       | Jednorazowe zadanie z precyzyjnym czasem (`--at`)         |
| Uruchom cotygodniową głęboką analizę              | Zaplanowane zadania (Cron)       | Samodzielne zadanie, może używać innego modelu            |
| Sprawdzaj skrzynkę co 30 min                      | Heartbeat                        | Grupuje się z innymi kontrolami, uwzględnia kontekst      |
| Monitoruj kalendarz pod kątem nadchodzących wydarzeń | Heartbeat                     | Naturalne dopasowanie do okresowej świadomości            |
| Odezwij się po wspomnianej rozmowie kwalifikacyjnej | Wywnioskowane zobowiązania      | Dalsze działanie podobne do pamięci, bez prośby o dokładne przypomnienie |
| Delikatny kontakt kontrolny wynikający z kontekstu użytkownika | Wywnioskowane zobowiązania | Ograniczone do tego samego agenta i kanału                |
| Sprawdź status subagenta lub uruchomienia ACP     | Zadania w tle                    | Rejestr zadań śledzi całą odłączoną pracę                 |
| Audytuj, co zostało uruchomione i kiedy           | Zadania w tle                    | `openclaw tasks list` i `openclaw tasks audit`            |
| Wieloetapowe badanie, a potem podsumowanie        | Przepływ zadań                   | Trwała orkiestracja ze śledzeniem rewizji                 |
| Uruchom skrypt przy resecie sesji                 | Hooki                            | Sterowane zdarzeniami, uruchamiane przy zdarzeniach cyklu życia |
| Wykonuj kod przy każdym wywołaniu narzędzia       | Hooki Plugin                     | Hooki wewnątrz procesu mogą przechwytywać wywołania narzędzi |
| Zawsze sprawdzaj zgodność przed odpowiedzią       | Stałe polecenia                  | Automatycznie wstrzykiwane do każdej sesji                |

### Zaplanowane zadania (Cron) a Heartbeat

| Wymiar          | Zaplanowane zadania (Cron)           | Heartbeat                              |
| --------------- | ------------------------------------ | -------------------------------------- |
| Czas uruchomienia | Dokładny (wyrażenia Cron, jednorazowe) | Przybliżony (domyślnie co 30 min)    |
| Kontekst sesji  | Nowy (izolowany) lub współdzielony   | Pełny kontekst sesji głównej           |
| Rekordy zadań   | Zawsze tworzone                      | Nigdy nie są tworzone                  |
| Dostarczenie    | Kanał, Webhook lub tryb cichy        | W treści sesji głównej                 |
| Najlepsze do    | Raportów, przypomnień, zadań w tle   | Kontroli skrzynki, kalendarza, powiadomień |

Używaj Zaplanowanych zadań (Cron), gdy potrzebujesz precyzyjnego czasu lub izolowanego wykonania. Używaj Heartbeat, gdy praca korzysta z pełnego kontekstu sesji, a przybliżony harmonogram jest wystarczający.

## Podstawowe pojęcia

### Zaplanowane zadania (Cron)

Cron to wbudowany harmonogram Gateway do precyzyjnego ustalania czasu. Utrwala zadania, wybudza agenta we właściwym momencie i może dostarczać wynik do kanału czatu lub punktu końcowego Webhook. Obsługuje jednorazowe przypomnienia, powtarzalne wyrażenia i przychodzące wyzwalacze Webhook.

Zobacz [Zaplanowane zadania](/pl/automation/cron-jobs).

### Zadania

Rejestr zadań w tle śledzi całą odłączoną pracę: uruchomienia ACP, utworzenia subagentów, izolowane wykonania Cron i operacje CLI. Zadania są rekordami, a nie harmonogramami. Używaj `openclaw tasks list` i `openclaw tasks audit`, aby je sprawdzać.

Zobacz [Zadania w tle](/pl/automation/tasks).

### Wywnioskowane zobowiązania

Zobowiązania to opcjonalne, krótkotrwałe pamięci działań następczych. OpenClaw wywnioskuje je ze zwykłych rozmów, ogranicza ich zakres do tego samego agenta i kanału oraz dostarcza należne kontakty kontrolne przez Heartbeat. Dokładne przypomnienia żądane przez użytkownika nadal należą do Cron.

Zobacz [Wywnioskowane zobowiązania](/pl/concepts/commitments).

### Przepływ zadań

Przepływ zadań to warstwa orkiestracji przepływów ponad zadaniami w tle. Zarządza trwałymi przepływami wieloetapowymi z zarządzanymi i lustrzanymi trybami synchronizacji, śledzeniem rewizji oraz `openclaw tasks flow list|show|cancel` do sprawdzania.

Zobacz [Przepływ zadań](/pl/automation/taskflow).

### Stałe polecenia

Stałe polecenia nadają agentowi stałe uprawnienia operacyjne dla zdefiniowanych programów. Są przechowywane w plikach obszaru roboczego (zwykle `AGENTS.md`) i wstrzykiwane do każdej sesji. Łącz je z Cron, aby egzekwować je na podstawie czasu.

Zobacz [Stałe polecenia](/pl/automation/standing-orders).

### Hooki

Wewnętrzne hooki to skrypty sterowane zdarzeniami, wyzwalane przez zdarzenia cyklu życia agenta (`/new`, `/reset`, `/stop`), Compaction sesji, uruchomienie Gateway i przepływ wiadomości. Są automatycznie wykrywane w katalogach i można nimi zarządzać za pomocą `openclaw hooks`. Do przechwytywania wywołań narzędzi wewnątrz procesu użyj [hooków Plugin](/pl/plugins/hooks).

Zobacz [Hooki](/pl/automation/hooks).

### Heartbeat

Heartbeat to okresowa tura sesji głównej (domyślnie co 30 minut). Grupuje wiele kontroli (skrzynka, kalendarz, powiadomienia) w jednej turze agenta z pełnym kontekstem sesji. Tury Heartbeat nie tworzą rekordów zadań i nie odświeżają ważności codziennego resetu sesji ani resetu po bezczynności. Użyj `HEARTBEAT.md` jako małej listy kontrolnej albo bloku `tasks:`, gdy chcesz wykonywać w samym Heartbeat okresowe kontrole tylko wtedy, gdy są należne. Puste pliki Heartbeat są pomijane jako `empty-heartbeat-file`; tryb zadań tylko po terminie jest pomijany jako `no-tasks-due`. Działania Heartbeat są odraczane, gdy praca Cron jest aktywna lub w kolejce, a `heartbeat.skipWhenBusy` może też odroczyć agenta, gdy subagent tego samego agenta powiązany kluczem sesji albo zagnieżdżone ścieżki są zajęte.

Zobacz [Heartbeat](/pl/gateway/heartbeat).

## Jak działają razem

- **Cron** obsługuje precyzyjne harmonogramy (dzienne raporty, cotygodniowe przeglądy) i jednorazowe przypomnienia. Wszystkie wykonania Cron tworzą rekordy zadań.
- **Heartbeat** obsługuje rutynowe monitorowanie (skrzynka, kalendarz, powiadomienia) w jednej zgrupowanej turze co 30 minut.
- **Hooki** reagują na konkretne zdarzenia (resety sesji, Compaction, przepływ wiadomości) za pomocą własnych skryptów. Hooki Plugin obejmują wywołania narzędzi.
- **Stałe polecenia** dają agentowi trwały kontekst i granice uprawnień.
- **Przepływ zadań** koordynuje wieloetapowe przepływy ponad pojedynczymi zadaniami.
- **Zadania** automatycznie śledzą całą odłączoną pracę, aby można było ją sprawdzać i audytować.

## Powiązane

- [Zaplanowane zadania](/pl/automation/cron-jobs) — precyzyjne planowanie i jednorazowe przypomnienia
- [Wywnioskowane zobowiązania](/pl/concepts/commitments) — kontakty kontrolne działań następczych podobne do pamięci
- [Zadania w tle](/pl/automation/tasks) — rejestr zadań dla całej odłączonej pracy
- [Przepływ zadań](/pl/automation/taskflow) — trwała orkiestracja przepływów wieloetapowych
- [Hooki](/pl/automation/hooks) — skrypty cyklu życia sterowane zdarzeniami
- [Hooki Plugin](/pl/plugins/hooks) — wewnątrzprocesowe hooki narzędzi, promptów, wiadomości i cyklu życia
- [Stałe polecenia](/pl/automation/standing-orders) — trwałe instrukcje agenta
- [Heartbeat](/pl/gateway/heartbeat) — okresowe tury sesji głównej
- [Referencja konfiguracji](/pl/gateway/configuration-reference) — wszystkie klucze konfiguracji
