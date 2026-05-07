---
read_when:
    - Chcesz najszybszej lokalnej pętli deweloperskiej (bun + watch)
    - Napotykasz problemy z instalacją, poprawkami i skryptami cyklu życia w Bun
summary: 'Przepływ pracy Bun (eksperymentalny): instalowanie i pułapki w porównaniu z pnpm'
title: Bun (eksperymentalny)
x-i18n:
    generated_at: "2026-05-07T13:20:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1637cb81310422b718934f9c2d1f506dec46f1624dd9ac850bed04321b863041
    source_path: install/bun.md
    workflow: 16
---

<Warning>
Bun **nie jest zalecany dla środowiska uruchomieniowego Gateway** (znane problemy z WhatsApp i Telegram). W produkcji używaj Node.
</Warning>

Bun to opcjonalne lokalne środowisko uruchomieniowe do bezpośredniego uruchamiania TypeScript (`bun run ...`, `bun --watch ...`). Domyślnym menedżerem pakietów pozostaje `pnpm`, który jest w pełni obsługiwany i używany przez narzędzia dokumentacji. Bun nie może używać pliku `pnpm-lock.yaml` i zignoruje go.

## Instalacja

<Steps>
  <Step title="Instalacja zależności">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` są ignorowane przez git, więc nie powodują zmian w repozytorium. Aby całkowicie pominąć zapisywanie pliku blokady:

    ```sh
    bun install --no-save
    ```

  </Step>
  <Step title="Budowanie i testowanie">
    ```sh
    bun run build
    bun run vitest run
    ```
  </Step>
</Steps>

## Skrypty cyklu życia

Bun blokuje skrypty cyklu życia zależności, chyba że zostaną jawnie zaufane. W tym repozytorium często blokowane skrypty nie są wymagane:

- `@whiskeysockets/baileys` `preinstall` -- sprawdza, czy główna wersja Node >= 20 (OpenClaw domyślnie używa Node 24 i nadal obsługuje Node 22 LTS, obecnie `22.16+`)
- `protobufjs` `postinstall` -- wyświetla ostrzeżenia o niezgodnych schematach wersjonowania (brak artefaktów kompilacji)

Jeśli napotkasz problem w czasie działania, który wymaga tych skryptów, jawnie im zaufaj:

```sh
bun pm trust @whiskeysockets/baileys protobufjs
```

## Zastrzeżenia

Niektóre skrypty nadal mają na sztywno wpisane pnpm (na przykład `docs:build`, `ui:*`, `protocol:check`). Na razie uruchamiaj je przez pnpm.

## Powiązane

- [Omówienie instalacji](/pl/install)
- [Node.js](/pl/install/node)
- [Aktualizowanie](/pl/install/updating)
