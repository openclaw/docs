---
read_when:
    - Chcesz uzyskać najszybszą lokalną pętlę programistyczną (bun + watch)
    - Napotykasz problemy ze skryptami instalacji, poprawek lub cyklu życia Bun
summary: 'Przepływ pracy z Bun (eksperymentalny): instalacja i pułapki w porównaniu z pnpm'
title: Bun (eksperymentalne)
x-i18n:
    generated_at: "2026-07-12T15:15:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b836be354166ceb073d170e472e8b69c3f517e754fe71417df1d85d27a18ae94
    source_path: install/bun.md
    workflow: 16
---

<Warning>
Bun nie jest zalecany jako środowisko uruchomieniowe Gateway (znane problemy z WhatsApp i Telegram). W środowisku produkcyjnym używaj Node.
</Warning>

Bun jest opcjonalnym lokalnym środowiskiem uruchomieniowym umożliwiającym bezpośrednie uruchamianie TypeScript (`bun run ...`, `bun --watch ...`). Domyślnym menedżerem pakietów pozostaje `pnpm`, który jest w pełni obsługiwany i używany przez narzędzia dokumentacji. Bun nie może używać pliku `pnpm-lock.yaml` i go ignoruje.

## Instalacja

<Steps>
  <Step title="Zainstaluj zależności">
    ```sh
    bun install
    ```

    Pliki `bun.lock` / `bun.lockb` są ignorowane przez Git, więc nie powodują zmian w repozytorium. Aby całkowicie pominąć zapisywanie pliku blokady:

    ```sh
    bun install --no-save
    ```

  </Step>
  <Step title="Zbuduj i przetestuj">
    ```sh
    bun run build
    bun run vitest run
    ```
  </Step>
</Steps>

## Skrypty cyklu życia

Bun blokuje skrypty cyklu życia zależności, jeśli nie zostały jawnie oznaczone jako zaufane. W tym repozytorium często blokowane skrypty nie są wymagane:

- `baileys` `preinstall`: sprawdza, czy główna wersja Node to co najmniej 20 (OpenClaw wymaga Node 22.19+ lub 23.11+; zalecany jest Node 24)
- `protobufjs` `postinstall`: wyświetla ostrzeżenia dotyczące niezgodnych schematów wersjonowania (nie tworzy artefaktów kompilacji)

Jeśli wystąpi problem w czasie działania wymagający tych skryptów, jawnie oznacz je jako zaufane:

```sh
bun pm trust baileys protobufjs
```

## Zastrzeżenia

Niektóre skrypty pakietów mają wewnętrznie wpisane na stałe polecenie `pnpm` (na przykład `check:docs`, `ui:*`, `protocol:check`). Uruchomienie ich za pomocą `bun run` i tak wywołuje `pnpm` w powłoce, dlatego uruchamiaj je bezpośrednio za pomocą `pnpm`.

## Powiązane materiały

- [Omówienie instalacji](/pl/install)
- [Node.js](/pl/install/node)
- [Aktualizowanie](/pl/install/updating)
