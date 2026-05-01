---
read_when:
    - Podłączasz syntetyczny transport QA do lokalnego uruchomienia testów lub uruchomienia w CI
    - Potrzebujesz wbudowanego interfejsu konfiguracji qa-channel
    - Pracujesz iteracyjnie nad kompleksową automatyzacją QA
summary: Syntetyczny Plugin kanału klasy Slack do deterministycznych scenariuszy QA OpenClaw
title: Kanał QA
x-i18n:
    generated_at: "2026-05-01T09:56:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: efe057812de1fbc6d89d2b6d5860cd6af4648c3e86913efa3a69267c4e8c57b4
    source_path: channels/qa-channel.md
    workflow: 16
---

`qa-channel` to wbudowany syntetyczny transport wiadomości do zautomatyzowanego QA OpenClaw. Nie jest to kanał produkcyjny — istnieje po to, aby ćwiczyć tę samą granicę Plugin kanału, której używają rzeczywiste transporty, przy zachowaniu deterministycznego i w pełni możliwego do inspekcji stanu.

## Co robi

- Gramatyka celów klasy Slack:
  - `dm:<user>`
  - `channel:<room>`
  - `group:<room>`
  - `thread:<room>/<thread>`
- Współdzielone konwersacje `channel:` i `group:` są prezentowane agentom jako tury pokoju grupy/kanału, dzięki czemu ćwiczą tę samą politykę widocznych odpowiedzi i routingu narzędzi wiadomości, której używają Discord, Slack, Telegram i podobne transporty.
- Syntetyczna magistrala oparta na HTTP do wstrzykiwania wiadomości przychodzących, przechwytywania transkryptów wychodzących, tworzenia wątków, reakcji, edycji, usuwania oraz akcji wyszukiwania/odczytu.
- Uruchamiacz autotestu po stronie hosta, który zapisuje raport Markdown w `.artifacts/qa-e2e/`.

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
- `baseUrl` — URL syntetycznej magistrali.
- `botUserId` — identyfikator użytkownika bota w stylu Matrix używany w gramatyce celów.
- `botDisplayName` — nazwa wyświetlana dla wiadomości wychodzących.
- `pollTimeoutMs` — okno oczekiwania długiego odpytywania. Liczba całkowita od 100 do 30000.
- `allowFrom` — lista dozwolonych nadawców (identyfikatory użytkowników lub `"*"`).
- `defaultTo` — cel awaryjny, gdy nie podano żadnego.
- `actions.messages` / `actions.reactions` / `actions.search` / `actions.threads` — bramkowanie narzędzi według akcji.

Klucze wielu kont na najwyższym poziomie:

- `accounts` — rekord nazwanych nadpisań dla poszczególnych kont, indeksowany według identyfikatora konta.
- `defaultAccount` — preferowany identyfikator konta, gdy skonfigurowano wiele kont.

## Uruchamiacze

Autotest po stronie hosta (zapisuje raport Markdown w `.artifacts/qa-e2e/`):

```bash
pnpm qa:e2e
```

To przechodzi przez `qa-lab`, uruchamia magistralę QA z repozytorium, bootuje wbudowany fragment środowiska wykonawczego `qa-channel` i wykonuje deterministyczny autotest.

Pełny zestaw scenariuszy oparty na repozytorium:

```bash
pnpm openclaw qa suite
```

Uruchamia scenariusze równolegle względem ścieżki QA Gateway. Zobacz [Przegląd QA](/pl/concepts/qa-e2e-automation), aby poznać scenariusze, profile i tryby providerów.

Witryna QA oparta na Dockerze (Gateway + interfejs debuggera QA Lab w jednym stosie):

```bash
pnpm qa:lab:up
```

Buduje witrynę QA, uruchamia oparty na Dockerze stos Gateway + QA Lab i wypisuje URL QA Lab. Stamtąd możesz wybierać scenariusze, wybierać ścieżkę modelu, uruchamiać pojedyncze przebiegi i obserwować wyniki na żywo. Debugger QA Lab jest oddzielny od dostarczanego pakietu Control UI.

## Powiązane

- [Przegląd QA](/pl/concepts/qa-e2e-automation) — ogólny stos, adaptery transportu, tworzenie scenariuszy
- [Matrix QA](/pl/concepts/qa-matrix) — przykładowy uruchamiacz transportu na żywo, który steruje rzeczywistym kanałem
- [Parowanie](/pl/channels/pairing)
- [Grupy](/pl/channels/groups)
- [Przegląd kanałów](/pl/channels)
