---
read_when:
    - Podłączasz syntetyczny transport QA do lokalnego uruchomienia testów lub uruchomienia testów w CI
    - Potrzebujesz dołączonego interfejsu konfiguracji qa-channel
    - Iterujesz nad kompleksową automatyzacją kontroli jakości
summary: Syntetyczny Plugin kanału klasy Slack do deterministycznych scenariuszy QA OpenClaw
title: Kanał QA
x-i18n:
    generated_at: "2026-04-30T09:39:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: e1de1f52da1a14c845cf2a536ddc6f36ab52ed6364f68d9ece32ce272e2a2f96
    source_path: channels/qa-channel.md
    workflow: 16
---

`qa-channel` to dołączony syntetyczny transport wiadomości do zautomatyzowanego QA OpenClaw. Nie jest to kanał produkcyjny — istnieje po to, aby ćwiczyć tę samą granicę Plugin kanału, której używają rzeczywiste transporty, przy zachowaniu deterministycznego i w pełni możliwego do inspekcji stanu.

## Co robi

- Gramatyka celów klasy Slack:
  - `dm:<user>`
  - `channel:<room>`
  - `thread:<room>/<thread>`
- Syntetyczna szyna oparta na HTTP do wstrzykiwania wiadomości przychodzących, przechwytywania transkrypcji wychodzącej, tworzenia wątków, reakcji, edycji, usuwania oraz akcji wyszukiwania/odczytu.
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

- `enabled` — główny przełącznik dla tego konta.
- `name` — opcjonalna etykieta wyświetlana.
- `baseUrl` — URL syntetycznej szyny.
- `botUserId` — identyfikator użytkownika bota w stylu Matrix używany w gramatyce celów.
- `botDisplayName` — nazwa wyświetlana dla wiadomości wychodzących.
- `pollTimeoutMs` — okno oczekiwania długiego odpytywania. Liczba całkowita od 100 do 30000.
- `allowFrom` — lista dozwolonych nadawców (identyfikatory użytkowników lub `"*"`).
- `defaultTo` — cel zastępczy, gdy nie podano żadnego.
- `actions.messages` / `actions.reactions` / `actions.search` / `actions.threads` — bramkowanie narzędzi dla poszczególnych akcji.

Klucze wielokontowe na najwyższym poziomie:

- `accounts` — rekord nazwanych nadpisań dla poszczególnych kont, indeksowany według identyfikatora konta.
- `defaultAccount` — preferowany identyfikator konta, gdy skonfigurowano wiele kont.

## Moduły uruchamiające

Samokontrola po stronie hosta (zapisuje raport Markdown w `.artifacts/qa-e2e/`):

```bash
pnpm qa:e2e
```

To przechodzi przez `qa-lab`, uruchamia szynę QA z repozytorium, startuje dołączony wycinek środowiska uruchomieniowego `qa-channel` i wykonuje deterministyczną samokontrolę.

Pełny zestaw scenariuszy oparty na repozytorium:

```bash
pnpm openclaw qa suite
```

Uruchamia scenariusze równolegle względem linii QA Gateway. Zobacz [omówienie QA](/pl/concepts/qa-e2e-automation), aby poznać scenariusze, profile i tryby dostawców.

Witryna QA oparta na Dockerze (Gateway + interfejs debuggera QA Lab w jednym stosie):

```bash
pnpm qa:lab:up
```

Buduje witrynę QA, uruchamia oparty na Dockerze stos Gateway + QA Lab i wypisuje URL QA Lab. Następnie możesz wybierać scenariusze, wybrać linię modelu, uruchamiać pojedyncze przebiegi i obserwować wyniki na żywo. Debugger QA Lab jest oddzielony od dostarczanego pakietu interfejsu Control UI.

## Powiązane

- [Omówienie QA](/pl/concepts/qa-e2e-automation) — ogólny stos, adaptery transportu, tworzenie scenariuszy
- [QA Matrix](/pl/concepts/qa-matrix) — przykładowy moduł uruchamiający transport na żywo, który steruje rzeczywistym kanałem
- [Parowanie](/pl/channels/pairing)
- [Grupy](/pl/channels/groups)
- [Omówienie kanałów](/pl/channels)
