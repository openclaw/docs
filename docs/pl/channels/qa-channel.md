---
read_when:
    - Integrujesz syntetyczny transport QA z lokalnym uruchomieniem testów lub uruchomieniem testów w CI
    - Potrzebujesz dołączonego interfejsu konfiguracji qa-channel
    - Udoskonalasz całościową automatyzację zapewniania jakości
summary: Syntetyczny Plugin kanału klasy Slack do deterministycznych scenariuszy QA OpenClaw
title: Kanał QA
x-i18n:
    generated_at: "2026-05-06T09:04:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1990b64d8a3ed158b11fc08742f774c5355ee25b68402ec447b92316109ac2f2
    source_path: channels/qa-channel.md
    workflow: 16
---

`qa-channel` to dołączony syntetyczny transport wiadomości dla zautomatyzowanego QA OpenClaw. Nie jest to kanał produkcyjny - istnieje po to, aby ćwiczyć tę samą granicę Plugin kanału, której używają rzeczywiste transporty, przy zachowaniu deterministycznego i w pełni możliwego do inspekcji stanu.

## Co robi

- Gramatyka celów klasy Slack:
  - `dm:<user>`
  - `channel:<room>`
  - `group:<room>`
  - `thread:<room>/<thread>`
- Wspólne konwersacje `channel:` i `group:` są udostępniane agentom jako tury pokoju grupy/kanału, dzięki czemu ćwiczą tę samą politykę widocznych odpowiedzi i routingu narzędzia wiadomości, której używają Discord, Slack, Telegram i podobne transporty.
- Syntetyczna magistrala oparta na HTTP do wstrzykiwania wiadomości przychodzących, przechwytywania transkrypcji wychodzących, tworzenia wątków, reakcji, edycji, usunięć oraz akcji wyszukiwania/odczytu.
- Uruchamiany po stronie hosta mechanizm samokontroli, który zapisuje raport Markdown w `.artifacts/qa-e2e/`.

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

- `enabled` - główny przełącznik tego konta.
- `name` - opcjonalna etykieta wyświetlana.
- `baseUrl` - URL syntetycznej magistrali.
- `botUserId` - identyfikator użytkownika bota w stylu Matrix używany w gramatyce celów.
- `botDisplayName` - nazwa wyświetlana dla wiadomości wychodzących.
- `pollTimeoutMs` - okno oczekiwania long-poll. Liczba całkowita od 100 do 30000.
- `allowFrom` - lista dozwolonych nadawców (identyfikatory użytkowników lub `"*"`).
- `defaultTo` - cel zastępczy, gdy nie podano żadnego.
- `actions.messages` / `actions.reactions` / `actions.search` / `actions.threads` - bramkowanie narzędzi według akcji.

Klucze dla wielu kont na najwyższym poziomie:

- `accounts` - rekord nazwanych nadpisań dla poszczególnych kont, indeksowanych według identyfikatora konta.
- `defaultAccount` - preferowany identyfikator konta, gdy skonfigurowano wiele kont.

## Uruchamiacze

Samokontrola po stronie hosta (zapisuje raport Markdown w `.artifacts/qa-e2e/`):

```bash
pnpm qa:e2e
```

To kieruje przez `qa-lab`, uruchamia znajdującą się w repozytorium magistralę QA, startuje dołączony wycinek środowiska uruchomieniowego `qa-channel` i wykonuje deterministyczną samokontrolę.

Pełny zestaw scenariuszy oparty na repozytorium:

```bash
pnpm openclaw qa suite
```

Uruchamia scenariusze równolegle względem pasa Gateway QA. Zobacz [omówienie QA](/pl/concepts/qa-e2e-automation), aby poznać scenariusze, profile i tryby dostawców.

Witryna QA oparta na Dockerze (Gateway + interfejs debuggera QA Lab w jednym stosie):

```bash
pnpm qa:lab:up
```

Buduje witrynę QA, uruchamia oparty na Dockerze stos Gateway + QA Lab i wypisuje URL QA Lab. Następnie możesz wybierać scenariusze, wybrać pas modelu, uruchamiać pojedyncze przebiegi i obserwować wyniki na żywo. Debugger QA Lab jest oddzielny od dostarczanego pakietu Control UI.

## Powiązane

- [Omówienie QA](/pl/concepts/qa-e2e-automation) - ogólny stos, adaptery transportu, tworzenie scenariuszy
- [Matrix QA](/pl/concepts/qa-matrix) - przykładowy uruchamiacz transportu na żywo, który steruje rzeczywistym kanałem
- [Parowanie](/pl/channels/pairing)
- [Grupy](/pl/channels/groups)
- [Omówienie kanałów](/pl/channels)
