---
read_when:
    - Konfigurujesz syntetyczny transport QA w lokalnym uruchomieniu testowym lub w CI
    - Potrzebujesz powierzchni konfiguracji dołączonego qa-channel
    - Pracujesz iteracyjnie nad automatyzacją QA end-to-end
summary: Syntetyczny Plugin kanału klasy Slack do deterministycznych scenariuszy QA OpenClaw
title: Kanał QA
x-i18n:
    generated_at: "2026-04-24T08:59:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 195312376ce8815af44169505b66314eb287ede19e40d27db5b4f256edaa0b46
    source_path: channels/qa-channel.md
    workflow: 15
---

`qa-channel` to dołączony syntetyczny transport wiadomości do zautomatyzowanego QA OpenClaw.

Nie jest to kanał produkcyjny. Istnieje po to, aby testować tę samą granicę Plugin kanału,
której używają rzeczywiste transporty, przy jednoczesnym zachowaniu stanu deterministycznego i w pełni możliwego do sprawdzenia.

## Co robi obecnie

- Gramatyka celu klasy Slack:
  - `dm:<user>`
  - `channel:<room>`
  - `thread:<room>/<thread>`
- Syntetyczna szyna oparta na HTTP do:
  - wstrzykiwania wiadomości przychodzących
  - przechwytywania transkryptów wychodzących
  - tworzenia wątków
  - reakcji
  - edycji
  - usuwania
  - wyszukiwania i odczytu
- Dołączony po stronie hosta runner autokontroli, który zapisuje raport w Markdown

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

To teraz przechodzi przez dołączone rozszerzenie `qa-lab`. Uruchamia szynę
QA wewnątrz repozytorium, bootuje dołączony wycinek runtime `qa-channel`, uruchamia deterministyczną
autokontrolę i zapisuje raport Markdown w `.artifacts/qa-e2e/`.

Prywatny interfejs debuggera:

```bash
pnpm qa:lab:up
```

To pojedyncze polecenie buduje witrynę QA, uruchamia stos gateway + QA Lab
oparty na Docker i wypisuje URL QA Lab. Z tej witryny możesz wybierać scenariusze, wybierać
ścieżkę modelu, uruchamiać poszczególne przebiegi i oglądać wyniki na żywo.

Pełny pakiet QA oparty na repozytorium:

```bash
pnpm openclaw qa suite
```

To uruchamia prywatny debugger QA pod lokalnym URL, oddzielnie od
dostarczanego pakietu interfejsu Control UI.

## Zakres

Obecny zakres jest celowo wąski:

- szyna + transport Plugin
- gramatyka routingu wątków
- akcje wiadomości należące do kanału
- raportowanie Markdown
- witryna QA oparta na Docker z kontrolkami uruchomień

Dalsze prace dodadzą:

- wykonywanie macierzy provider/model
- bogatsze wykrywanie scenariuszy
- później natywną orkiestrację OpenClaw

## Powiązane

- [Pairing](/pl/channels/pairing)
- [Groups](/pl/channels/groups)
- [Channels overview](/pl/channels)
