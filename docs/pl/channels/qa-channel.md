---
read_when:
    - Podłączasz syntetyczny transport QA do lokalnego lub CI uruchomienia testów
    - Potrzebujesz powierzchni konfiguracji dołączonego qa-channel
    - Iteracyjnie rozwijasz automatyzację zapewniania jakości w całym przepływie.
summary: Syntetyczny Plugin kanału klasy Slack do deterministycznych scenariuszy QA OpenClaw
title: Kanał QA
x-i18n:
    generated_at: "2026-05-10T19:23:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8f28962032bc5f6b228de731ae6bd9a22831604b506b7073aeffba19ac22e0e8
    source_path: channels/qa-channel.md
    workflow: 16
---

`qa-channel` to wbudowany syntetyczny transport wiadomości do zautomatyzowanej kontroli jakości OpenClaw. Nie jest to kanał produkcyjny - istnieje po to, aby ćwiczyć tę samą granicę Plugin kanału, której używają prawdziwe transporty, przy zachowaniu deterministycznego i w pełni kontrolowalnego stanu.

## Co robi

- Gramatyka celów klasy Slack:
  - `dm:<user>`
  - `channel:<room>`
  - `group:<room>`
  - `thread:<room>/<thread>`
- Współdzielone konwersacje `channel:` i `group:` są udostępniane agentom jako tury pomieszczeń grup/kanałów, dzięki czemu ćwiczą tę samą politykę widocznych odpowiedzi i routingu narzędzi wiadomości, której używają Discord, Slack, Telegram oraz podobne transporty.
- Syntetyczna magistrala oparta na HTTP do wstrzykiwania wiadomości przychodzących, przechwytywania transkrypcji wychodzących, tworzenia wątków, reakcji, edycji, usuwania oraz akcji wyszukiwania/odczytu.
- Runner samokontroli po stronie hosta, który zapisuje raport Markdown do `.artifacts/qa-e2e/`.

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

- `enabled` - główny przełącznik dla tego konta.
- `name` - opcjonalna etykieta wyświetlana.
- `baseUrl` - URL syntetycznej magistrali.
- `botUserId` - identyfikator użytkownika bota w stylu Matrix używany w gramatyce celów.
- `botDisplayName` - nazwa wyświetlana dla wiadomości wychodzących.
- `pollTimeoutMs` - okno oczekiwania długiego odpytywania. Liczba całkowita od 100 do 30000.
- `allowFrom` - lista dozwolonych nadawców (identyfikatory użytkowników lub `"*"`). Wiadomości bezpośrednie i
  polityka dozwolonych grup używają tych samych syntetycznych identyfikatorów nadawców.
- `groupPolicy` - polityka współdzielonych pomieszczeń: `"open"` (domyślnie), `"allowlist"` lub
  `"disabled"`.
- `groupAllowFrom` - opcjonalna lista dozwolonych nadawców dla współdzielonych pomieszczeń. Gdy zostanie pominięta przy
  `"allowlist"`, QA Channel używa awaryjnie `allowFrom`.
- `groups.<room>.requireMention` - wymaga wzmianki o bocie przed odpowiedzią w
  konkretnym pomieszczeniu grupy/kanału. `groups."*"` ustawia wartość domyślną.
- `defaultTo` - cel awaryjny, gdy nie podano żadnego.
- `actions.messages` / `actions.reactions` / `actions.search` / `actions.threads` - bramkowanie narzędzi dla poszczególnych akcji.

Klucze wielu kont na najwyższym poziomie:

- `accounts` - rekord nazwanych nadpisań dla poszczególnych kont, indeksowany identyfikatorem konta.
- `defaultAccount` - preferowany identyfikator konta, gdy skonfigurowano wiele kont.

## Runnery

Samokontrola po stronie hosta (zapisuje raport Markdown w `.artifacts/qa-e2e/`):

```bash
pnpm qa:e2e
```

To przechodzi przez `qa-lab`, uruchamia magistralę QA z repozytorium, startuje wbudowany wycinek runtime `qa-channel` i wykonuje deterministyczną samokontrolę.

Pełny zestaw scenariuszy oparty na repozytorium:

```bash
pnpm openclaw qa suite
```

Uruchamia scenariusze równolegle względem pasa Gateway QA. Zobacz [przegląd QA](/pl/concepts/qa-e2e-automation), aby poznać scenariusze, profile i tryby providerów.

Witryna QA oparta na Dockerze (Gateway + interfejs debuggera QA Lab w jednym stosie):

```bash
pnpm qa:lab:up
```

Buduje witrynę QA, uruchamia oparty na Dockerze stos Gateway + QA Lab i wypisuje URL QA Lab. Stamtąd możesz wybierać scenariusze, wybrać pas modelu, uruchamiać pojedyncze przebiegi i obserwować wyniki na żywo. Debugger QA Lab jest oddzielny od dostarczanego pakietu Control UI.

## Powiązane

- [przegląd QA](/pl/concepts/qa-e2e-automation) - ogólny stos, adaptery transportu, tworzenie scenariuszy
- [Matrix QA](/pl/concepts/qa-matrix) - przykładowy runner transportu na żywo, który steruje prawdziwym kanałem
- [Parowanie](/pl/channels/pairing)
- [Grupy](/pl/channels/groups)
- [Przegląd kanałów](/pl/channels)
