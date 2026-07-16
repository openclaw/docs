---
read_when:
    - Podłączanie syntetycznego transportu QA do lokalnego przebiegu testowego lub przebiegu w CI
    - Potrzebna jest powierzchnia konfiguracji dołączonego kanału qa-channel
    - Iteracyjnie rozwijasz kompleksową automatyzację kontroli jakości.
summary: Syntetyczny plugin kanału klasy Slack do deterministycznych scenariuszy kontroli jakości OpenClaw
title: Kanał QA
x-i18n:
    generated_at: "2026-07-16T18:14:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: a43c35e197116a6bd44b238010eb508aed23dea99ab872d10e6fc853b5f4d4a7
    source_path: channels/qa-channel.md
    workflow: 16
---

`qa-channel` to lokalny dla repozytorium syntetyczny transport wiadomości do zautomatyzowanej kontroli jakości OpenClaw (`extensions/qa-channel`, pakiet prywatny, wykluczony z dystrybuowanych instalacji). Nie jest to kanał produkcyjny — służy do testowania tej samej granicy pluginu kanału, której używają rzeczywiste transporty, przy jednoczesnym zachowaniu deterministycznego i w pełni możliwego do inspekcji stanu.

## Działanie

- Gramatyka adresatów klasy Slack:
  - `dm:<user>`
  - `channel:<room>`
  - `group:<room>`
  - `thread:<room>/<thread>`
- Współdzielone konwersacje `channel:` i `group:` są przedstawiane agentom jako tury w pokoju grupowym/kanale, dzięki czemu testują tę samą politykę routingu widocznych odpowiedzi i narzędzia wiadomości, której używają Discord, Slack, Telegram i podobne transporty.
- Syntetyczna magistrala oparta na HTTP do wstrzykiwania wiadomości przychodzących, przechwytywania transkrypcji wychodzących, tworzenia wątków, reakcji, edycji, usuwania oraz operacji wyszukiwania/odczytu.
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
- `botUserId` — syntetyczny identyfikator użytkownika bota używany w gramatyce adresatów (domyślnie: `openclaw`).
- `botDisplayName` — nazwa wyświetlana dla wiadomości wychodzących (domyślnie: `OpenClaw QA`).
- `pollTimeoutMs` — przedział oczekiwania długiego odpytywania. Liczba całkowita od 100 do 30000 (domyślnie: 1000).
- `allowFrom` — lista dozwolonych nadawców (identyfikatory użytkowników lub `"*"`; domyślnie: `["*"]`). Wiadomości prywatne zawsze podlegają polityce `open`; polityka grup z listą dozwolonych również używa tych syntetycznych
  identyfikatorów nadawców.
- `groupPolicy` — polityka pokoju współdzielonego: `"open"` (domyślnie), `"allowlist"` lub
  `"disabled"`.
- `groupAllowFrom` — opcjonalna lista dozwolonych nadawców w pokoju współdzielonym. W przypadku pominięcia przy
  `"allowlist"` QA Channel używa awaryjnie `allowFrom`.
- `groups.<room>.requireMention` — wymaga wzmianki o bocie przed udzieleniem odpowiedzi w
  określonym pokoju grupowym/kanale (domyślnie: false). `groups."*"` ustawia wartość domyślną;
  ustawienia `tools` / `toolsBySender` poszczególnych pokojów określają nadpisania polityki narzędzi.
- `defaultTo` — adresat rezerwowy, gdy nie podano żadnego.
- `actions.messages` / `actions.reactions` / `actions.search` / `actions.threads` — kontrola dostępu do narzędzi dla poszczególnych operacji.

Klucze obsługi wielu kont na najwyższym poziomie:

- `accounts` — rekord nazwanych nadpisań dla poszczególnych kont, indeksowanych według identyfikatora konta.
- `defaultAccount` — preferowany identyfikator konta, gdy skonfigurowano wiele kont.

## Moduły uruchamiające

Samokontrola po stronie hosta (zapisuje raport Markdown w katalogu `.artifacts/qa-e2e/`):

```bash
pnpm qa:e2e
```

Polecenie przekierowuje działanie przez `qa-lab`, uruchamia magistralę QA z repozytorium, uruchamia wycinek środowiska wykonawczego `qa-channel` i przeprowadza deterministyczną samokontrolę.

Pełny zestaw scenariuszy oparty na repozytorium:

```bash
pnpm openclaw qa suite
```

Uruchamia scenariusze równolegle względem ścieżki Gateway QA. Scenariusze, profile i tryby dostawców opisano w [omówieniu QA](/pl/concepts/qa-e2e-automation).

Witryna QA oparta na Dockerze (Gateway i interfejs debugera QA Lab w jednym stosie):

```bash
pnpm qa:lab:up
```

Buduje witrynę QA, uruchamia oparty na Dockerze stos Gateway i QA Lab oraz wyświetla adres URL QA Lab. Następnie można wybierać scenariusze, wybrać ścieżkę modelu, uruchamiać poszczególne przebiegi i obserwować wyniki na żywo. Debuger QA Lab jest niezależny od dystrybuowanego pakietu Control UI.

## Powiązane materiały

- [Omówienie QA](/pl/concepts/qa-e2e-automation) — ogólny stos, adaptery transportu, profile Matrix i tworzenie scenariuszy
- [Parowanie](/pl/channels/pairing)
- [Grupy](/pl/channels/groups)
- [Omówienie kanałów](/pl/channels)
