---
read_when:
    - Konfigurujesz syntetyczny transport QA w lokalnym lub CI uruchomieniu testowym
    - Potrzebujesz powierzchni konfiguracji dołączonego `qa-channel`
    - Pracujesz iteracyjnie nad kompleksową automatyzacją QA
summary: Syntetyczna wtyczka kanału klasy Slack do deterministycznych scenariuszy QA OpenClaw
title: Kanał QA
x-i18n:
    generated_at: "2026-04-07T09:43:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 65c2c908d3ec27c827087616c4ea278f10686810091058321ff26f68296a1782
    source_path: channels/qa-channel.md
    workflow: 15
---

# Kanał QA

`qa-channel` to dołączony syntetyczny transport wiadomości do zautomatyzowanego QA OpenClaw.

Nie jest to kanał produkcyjny. Istnieje po to, aby testować tę samą granicę wtyczki kanału,
której używają rzeczywiste transporty, przy zachowaniu deterministycznego i w pełni
inspekcjonowalnego stanu.

## Co robi obecnie

- Gramatyka celu klasy Slack:
  - `dm:<user>`
  - `channel:<room>`
  - `thread:<room>/<thread>`
- Syntetyczna magistrala oparta na HTTP dla:
  - wstrzykiwania wiadomości przychodzących
  - przechwytywania transkryptu wychodzącego
  - tworzenia wątków
  - reakcji
  - edycji
  - usunięć
  - działań wyszukiwania i odczytu
- Dołączony po stronie hosta runner kontroli własnej, który zapisuje raport w Markdown

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

Obsługiwane klucze konta:

- `baseUrl`
- `botUserId`
- `botDisplayName`
- `pollTimeoutMs`
- `allowFrom`
- `defaultTo`
- `actions.messages`
- `actions.reactions`
- `actions.search`
- `actions.threads`

## Runner

Obecny pionowy wycinek:

```bash
pnpm qa:e2e
```

To teraz przechodzi przez dołączone rozszerzenie `qa-lab`. Uruchamia ono
magistralę QA w repozytorium, uruchamia dołączony wycinek środowiska uruchomieniowego `qa-channel`,
wykonuje deterministyczną kontrolę własną i zapisuje raport w Markdown w `.artifacts/qa-e2e/`.

Prywatny interfejs debugowania:

```bash
pnpm qa:lab:up
```

To jedno polecenie buduje witrynę QA, uruchamia stos gateway + QA Lab oparty na Dockerze
i wyświetla URL QA Lab. W tej witrynie możesz wybierać scenariusze, wybrać ścieżkę modelu,
uruchamiać pojedyncze przebiegi i obserwować wyniki na żywo.

Pełny pakiet QA oparty na repozytorium:

```bash
pnpm openclaw qa suite
```

To uruchamia prywatny debugger QA pod lokalnym URL, oddzielnie od
dostarczonego pakietu interfejsu Control UI.

## Zakres

Obecny zakres jest celowo wąski:

- magistrala + transport wtyczki
- gramatyka routingu wątków
- działania na wiadomościach należące do kanału
- raportowanie w Markdown
- witryna QA oparta na Dockerze z kontrolkami uruchomień

Dalsze prace dodadzą:

- wykonywanie macierzy dostawca/model
- bogatsze wykrywanie scenariuszy
- później natywną orkiestrację OpenClaw
