---
read_when:
    - Chcesz zrozumieć routing i izolację sesji
    - Chcesz skonfigurować zakres wiadomości prywatnych dla konfiguracji z wieloma użytkownikami
    - Debugowanie codziennych resetów sesji lub resetów po okresie bezczynności
summary: Jak OpenClaw zarządza sesjami konwersacji
title: Zarządzanie sesjami
x-i18n:
    generated_at: "2026-07-16T18:16:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8ec9e33b4d288fa12016092ab2201431631fc9cb77e6e9d4261d348d5a849f65
    source_path: concepts/session.md
    workflow: 16
---

OpenClaw kieruje każdą wiadomość przychodzącą do **sesji** na podstawie jej
źródła: wiadomości prywatne, czaty grupowe, zadania Cron itd. Cały stan sesji
należy do **Gateway**; klienci interfejsu użytkownika pobierają dane sesji z Gateway.

## Jak kierowane są wiadomości

| Źródło              | Zachowanie                        |
| ------------------- | --------------------------------- |
| Wiadomości prywatne | Domyślnie współdzielona sesja     |
| Czaty grupowe       | Izolowana sesja dla każdej grupy |
| Pokoje/kanały       | Izolowana sesja dla każdego pokoju |
| Zadania Cron        | Nowa sesja przy każdym uruchomieniu |
| Webhooki            | Izolowana sesja dla każdego punktu zaczepienia |

## Izolacja wiadomości prywatnych

Domyślnie wszystkie wiadomości prywatne współdzielą jedną sesję w celu
zachowania ciągłości, co jest odpowiednie w konfiguracjach dla jednego użytkownika.

<Warning>
Jeśli z agentem może komunikować się wiele osób, należy włączyć izolację wiadomości
prywatnych. Bez niej wszyscy użytkownicy współdzielą ten sam kontekst rozmowy,
więc prywatne wiadomości Alicji byłyby widoczne dla Boba.
</Warning>

```json5
{
  session: {
    dmScope: "per-channel-peer", // izoluj według kanału i nadawcy
  },
}
```

Opcje `session.dmScope`:

| Wartość                      | Zachowanie                                  |
| ---------------------------- | ------------------------------------------- |
| `main` (domyślnie)           | Wszystkie wiadomości prywatne współdzielą jedną sesję |
| `per-peer`                 | Izoluj według nadawcy między kanałami       |
| `per-channel-peer`         | Izoluj według kanału i nadawcy (zalecane)   |
| `per-account-channel-peer` | Izoluj według konta, kanału i nadawcy       |

<Tip>
Jeśli ta sama osoba kontaktuje się z różnych kanałów, należy użyć
`session.identityLinks`, aby przypisać jej tożsamości do jednego kanonicznego identyfikatora
rozmówcy, dzięki czemu będą współdzielić sesję.
</Tip>

### Dokowanie połączonych kanałów

Polecenia dokowania przenoszą trasę odpowiedzi bieżącej sesji czatu prywatnego
do innego połączonego kanału bez rozpoczynania nowej sesji. Przykłady,
konfigurację i rozwiązywanie problemów zawiera [Dokowanie kanałów](/pl/concepts/channel-docking).

Konfigurację można zweryfikować za pomocą `openclaw security audit`.

## Cykl życia sesji

Sesje są używane ponownie, dopóki nie wygasną zgodnie z `session.reset`:

- **Reset dzienny** (domyślnie `mode: "daily"`) — nowa sesja o skonfigurowanej
  godzinie lokalnej (`session.reset.atHour`, domyślnie `4`, 0-23) na hoście Gateway. Aktualność
  dzienna zależy od czasu rozpoczęcia bieżącej `sessionId`, a nie od późniejszych
  zapisów metadanych.
- **Reset po bezczynności** (`mode: "idle"`) — nowa sesja po `session.reset.idleMinutes`
  bezczynności. Aktualność po bezczynności zależy od ostatniej rzeczywistej interakcji
  użytkownika/kanału, dlatego zdarzenia systemowe Heartbeat, Cron i exec nie
  podtrzymują sesji.
- **Reset ręczny** — wpisz na czacie `/new` lub `/reset`. `/new <model>`
  również przełącza model.

Gdy skonfigurowano zarówno reset dzienny, jak i reset po bezczynności, obowiązuje
ten, który nastąpi wcześniej. Tury zdarzeń systemowych Heartbeat, Cron, exec i
innych mogą zapisywać metadane sesji, ale zapisy te nie przedłużają okresu
aktualności resetu dziennego ani resetu po bezczynności. Gdy reset odnawia sesję,
oczekujące powiadomienia o zdarzeniach systemowych ze starej sesji są odrzucane,
aby nieaktualne informacje z procesów w tle nie zostały dodane na początku
pierwszego promptu w nowej sesji.

Sesje z aktywną sesją CLI należącą do dostawcy nie są przerywane przez domyślny
niejawny reset dzienny. Gdy takie sesje powinny wygasać według czasomierza, należy
użyć `/reset` lub jawnie skonfigurować `session.reset`.

Domyślne ustawienie można zastąpić dla każdego typu czatu lub kanału:

```json5
{
  session: {
    reset: { mode: "daily", atHour: 4 },
    resetByType: {
      group: { mode: "idle", idleMinutes: 120 },
      thread: { mode: "daily", atHour: 6 },
    },
    resetByChannel: {
      discord: { mode: "idle", idleMinutes: 10080 },
    },
  },
}
```

`resetByType` obsługuje `direct` (starszy alias `dm`), `group` i `thread`.
Starsze ustawienie najwyższego poziomu `session.idleMinutes` nadal działa jako alias
zgodności domyślnego trybu bezczynności, gdy nie ustawiono bloku
`session.reset`/`resetByType`.

## Lokalizacja stanu

- **Wiersze sesji środowiska uruchomieniowego:** `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- **Zarchiwizowane pliki transkrypcji:** `~/.openclaw/agents/<agentId>/sessions/`
- **Źródło migracji starszych wierszy:** `~/.openclaw/agents/<agentId>/sessions/sessions.json`

Wiersze sesji w bazie danych SQLite poszczególnych agentów przechowują oddzielne
znaczniki czasu cyklu życia:

- `sessionStartedAt`: czas rozpoczęcia bieżącej `sessionId`; używany przez reset dzienny.
- `lastInteractionAt`: ostatnia interakcja użytkownika/kanału przedłużająca okres aktywności.
- `updatedAt`: ostatnia modyfikacja wiersza magazynu; przydatna podczas wyświetlania i usuwania,
  ale niemiarodajna dla aktualności resetu dziennego lub resetu po bezczynności.

Podczas migracji ze starszych instalacji uruchomienie Gateway i `openclaw doctor
--fix` automatycznie importują starsze wiersze `sessions.json` oraz aktywną historię
transkrypcji JSONL do SQLite. Wiersze bez `sessionStartedAt` są rozpoznawane na
podstawie nagłówka sesji w starszej transkrypcji JSONL, jeśli jest dostępny. Jeśli
starszy wiersz nie zawiera również `lastInteractionAt`, aktualność po bezczynności
jest ustalana na podstawie czasu rozpoczęcia tej sesji, a nie późniejszych zapisów
technicznych. Aby jawnie sprawdzić dane lub uzyskać dowody walidacji, należy użyć
`openclaw doctor --session-sqlite inspect
--session-sqlite-all-agents` i [sekwencji migracji narzędzia Doctor](/pl/cli/doctor#session-sqlite-migration).

## Konserwacja sesji

OpenClaw ogranicza rozmiar magazynu sesji w czasie za pomocą `session.maintenance`;
poniżej przedstawiono wartości domyślne:

```json5
{
  session: {
    maintenance: {
      mode: "enforce", // "enforce" wykonuje czyszczenie; "warn" tylko zgłasza
      pruneAfter: "30d",
      maxEntries: 500,
    },
  },
}
```

W przypadku limitów `maxEntries` o rozmiarze produkcyjnym zapisy środowiska
uruchomieniowego Gateway wykorzystują mały bufor przekroczenia limitu i partiami
zmniejszają liczbę wpisów do skonfigurowanego maksimum. Odczyty magazynu sesji
nie usuwają ani nie ograniczają wpisów podczas uruchamiania Gateway, dzięki czemu
uruchamianie i izolowane sesje Cron nie ponoszą kosztu pełnego czyszczenia
magazynu. `openclaw sessions cleanup --enforce` natychmiast stosuje limit.

Sesje sond uruchomień modelu Gateway są domyślnie krótkotrwałe. Wiersze pasujące
do `agent:*:explicit:model-run-<uuid>` używają stałego okresu przechowywania `24h`,
ale czyszczenie zależy od obciążenia: usuwa nieaktualne wiersze sond tylko po
osiągnięciu progu konserwacji/limitu wpisów sesji i jest wykonywane przed
ogólniejszym limitem wieku nieaktualnych wpisów oraz limitem liczby wpisów.
Zwykłe sesje prywatne, grupowe, wątków, Cron, punktów zaczepienia, Heartbeat,
ACP i podagentów nie dziedziczą tego 24-godzinnego okresu przechowywania.

Konserwacja zachowuje trwałe zewnętrzne wskaźniki konwersacji, w tym sesje
grupowe i sesje czatu ograniczone do wątku, jednocześnie umożliwiając wygasanie
syntetycznych wpisów Cron, punktów zaczepienia, Heartbeat, ACP i podagentów.

Jeśli wcześniej używano izolacji wiadomości prywatnych, a następnie przywrócono
wartość `session.dmScope` na `main`, nieaktualne wiersze wiadomości
prywatnych z kluczami rozmówców można wyświetlić za pomocą
`openclaw sessions cleanup --dry-run --fix-dm-scope`. Zastosowanie tej samej flagi
wycofuje stare wiersze bezpośrednich wiadomości prywatnych i zachowuje ich
transkrypcje jako usunięte archiwa.

Podgląd dowolnego przebiegu konserwacji można wyświetlić za pomocą `openclaw sessions cleanup --dry-run`.

## Sprawdzanie sesji

| Polecenie                    | Wyświetlane informacje                           |
| ---------------------------- | ------------------------------------------------ |
| `openclaw status`          | Ścieżka magazynu sesji i ostatnia aktywność      |
| `openclaw sessions --json` | Wszystkie sesje (filtrowanie za pomocą `--active <minutes>`) |
| `/status` na czacie          | Użycie kontekstu, model i przełączniki           |
| `/context list`            | Zawartość promptu systemowego                     |

## Dalsza lektura

- [Wyszukiwanie sesji](/pl/concepts/session-search) — wyszukiwanie pełnotekstowe w poprzednich transkrypcjach
- [Ograniczanie sesji](/pl/concepts/session-pruning) — skracanie wyników narzędzi
- [Compaction](/pl/concepts/compaction) — podsumowywanie długich konwersacji
- [Narzędzia sesji](/pl/concepts/session-tool) — narzędzia agenta do pracy między sesjami
- [Szczegółowe omówienie zarządzania sesjami](/pl/reference/session-management-compaction) —
  schemat magazynu, transkrypcje, zasady wysyłania, metadane pochodzenia i zaawansowana konfiguracja
- [Wielu agentów](/pl/concepts/multi-agent) — kierowanie i izolowanie sesji między agentami
- [Zadania w tle](/pl/automation/tasks) — sposób, w jaki odłączona praca tworzy rekordy zadań z odwołaniami do sesji
- [Kierowanie kanałów](/pl/channels/channel-routing) — sposób kierowania wiadomości przychodzących do sesji

## Powiązane

- [Ograniczanie sesji](/pl/concepts/session-pruning)
- [Narzędzia sesji](/pl/concepts/session-tool)
- [Kolejka poleceń](/pl/concepts/queue)
