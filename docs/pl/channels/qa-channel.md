---
read_when:
    - Podłączasz syntetyczny transport QA do lokalnego przebiegu testowego lub przebiegu testowego w CI
    - Potrzebujesz wbudowanego interfejsu konfiguracji qa-channel
    - Pracujesz iteracyjnie nad automatyzacją kontroli jakości typu end-to-end
summary: Syntetyczny plugin kanału typu Slack do deterministycznych scenariuszy kontroli jakości OpenClaw
title: Kanał QA
x-i18n:
    generated_at: "2026-07-12T14:49:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f33af6ef31515e0cab0ee2540f48f3ffea8aba3d13915dc8cf66111599354187
    source_path: channels/qa-channel.md
    workflow: 16
---

`qa-channel` to lokalny dla repozytorium syntetyczny transport wiadomości do zautomatyzowanej kontroli jakości OpenClaw (`extensions/qa-channel`, pakiet prywatny, wykluczony z instalacji dystrybucyjnych). Nie jest to kanał produkcyjny — służy do testowania tej samej granicy pluginu kanału, której używają rzeczywiste transporty, przy zachowaniu deterministycznego i w pełni kontrolowalnego stanu.

## Działanie

- Gramatyka celów klasy Slack:
  - `dm:<user>`
  - `channel:<room>`
  - `group:<room>`
  - `thread:<room>/<thread>`
- Współdzielone konwersacje `channel:` i `group:` są przedstawiane agentom jako tury pokojów grupowych/kanałowych, dzięki czemu testują tę samą politykę routingu widocznych odpowiedzi i narzędzi wiadomości, której używają Discord, Slack, Telegram i podobne transporty.
- Syntetyczna magistrala oparta na HTTP do wstrzykiwania wiadomości przychodzących, przechwytywania transkrypcji wychodzących, tworzenia wątków, reakcji, edycji, usuwania oraz operacji wyszukiwania i odczytu.
- Uruchamiany po stronie hosta moduł samokontroli, który zapisuje raport Markdown w `.artifacts/qa-e2e/`.

## Konfiguracja

```json
{
  "channels": {
    "qa-channel": {
      "baseUrl": "http://127.0.0.1:43123",
      "botUserId": "openclaw",
      "botDisplayName": "OpenClaw QA",
      "allowFrom": ["*"],
      "pollTimeoutMs": 1000
    }
  }
}
```

Klucze konta:

- `enabled` — główny przełącznik tego konta.
- `name` — opcjonalna etykieta wyświetlana.
- `baseUrl` — adres URL syntetycznej magistrali. Konto jest uznawane za skonfigurowane po ustawieniu tej wartości.
- `botUserId` — syntetyczny identyfikator użytkownika bota używany w gramatyce celów (domyślnie: `openclaw`).
- `botDisplayName` — nazwa wyświetlana dla wiadomości wychodzących (domyślnie: `OpenClaw QA`).
- `pollTimeoutMs` — okno oczekiwania długiego odpytywania. Liczba całkowita od 100 do 30000 (domyślnie: 1000).
- `allowFrom` — lista dozwolonych nadawców (identyfikatory użytkowników lub `"*"`; domyślnie: `["*"]`). Wiadomości prywatne zawsze używają polityki `open`; polityka grupowa z listą dozwolonych nadawców również używa tych syntetycznych identyfikatorów nadawców.
- `groupPolicy` — polityka współdzielonego pokoju: `"open"` (domyślnie), `"allowlist"` lub `"disabled"`.
- `groupAllowFrom` — opcjonalna lista dozwolonych nadawców we współdzielonych pokojach. Jeśli zostanie pominięta przy polityce `"allowlist"`, kanał QA użyje wartości `allowFrom`.
- `groups.<room>.requireMention` — wymaga wzmianki o bocie przed odpowiedzią w określonym pokoju grupowym/kanałowym (domyślnie: false). `groups."*"` ustawia wartość domyślną; ustawienia `tools` / `toolsBySender` dla poszczególnych pokojów zastępują politykę narzędzi.
- `defaultTo` — cel zapasowy, gdy nie podano żadnego.
- `actions.messages` / `actions.reactions` / `actions.search` / `actions.threads` — kontrola dostępu do narzędzi dla poszczególnych operacji.

Klucze obsługi wielu kont na najwyższym poziomie:

- `accounts` — rekord nazwanych nadpisań dla poszczególnych kont, indeksowany według identyfikatora konta.
- `defaultAccount` — preferowany identyfikator konta, gdy skonfigurowano wiele kont.

## Moduły uruchamiające

Samokontrola po stronie hosta (zapisuje raport Markdown w `.artifacts/qa-e2e/`):

```bash
pnpm qa:e2e
```

Polecenie kieruje wykonanie przez `qa-lab`, uruchamia magistralę QA z repozytorium, inicjuje wycinek środowiska uruchomieniowego `qa-channel` i przeprowadza deterministyczną samokontrolę.

Pełny zestaw scenariuszy oparty na repozytorium:

```bash
pnpm openclaw qa suite
```

Uruchamia scenariusze równolegle w ścieżce Gateway QA. Informacje o scenariuszach, profilach i trybach dostawców zawiera [omówienie QA](/pl/concepts/qa-e2e-automation).

Witryna QA oparta na Dockerze (Gateway i interfejs debugera QA Lab w jednym stosie):

```bash
pnpm qa:lab:up
```

Buduje witrynę QA, uruchamia oparty na Dockerze stos Gateway i QA Lab oraz wyświetla adres URL QA Lab. Następnie można wybierać scenariusze, ścieżkę modelu, uruchamiać poszczególne przebiegi i obserwować wyniki na żywo. Debuger QA Lab jest oddzielony od dostarczanego pakietu interfejsu Control UI.

## Powiązane materiały

- [Omówienie QA](/pl/concepts/qa-e2e-automation) — cały stos, adaptery transportu, tworzenie scenariuszy
- [Macierz QA](/pl/concepts/qa-matrix) — przykładowy moduł uruchamiający dla aktywnego transportu, który steruje rzeczywistym kanałem
- [Parowanie](/pl/channels/pairing)
- [Grupy](/pl/channels/groups)
- [Omówienie kanałów](/pl/channels)
