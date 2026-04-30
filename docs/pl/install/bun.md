---
read_when:
    - Chcesz mieć najszybszą lokalną pętlę deweloperską (bun + watch)
    - Napotykasz problemy ze skryptami instalacji, nakładania poprawek lub cyklu życia Bun
summary: 'Przepływ pracy z Bun (eksperymentalny): instalacja i potencjalne problemy w porównaniu z pnpm'
title: Bun (eksperymentalny)
x-i18n:
    generated_at: "2026-04-30T09:59:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: d596c8fa9cc585e23184e7b983ec3842361eac807a1f3c12a0529631876db486
    source_path: install/bun.md
    workflow: 16
---

<Warning>
Bun **nie jest zalecany jako środowisko uruchomieniowe Gateway** (znane problemy z WhatsApp i Telegram). W produkcji używaj Node.
</Warning>

Bun to opcjonalne lokalne środowisko uruchomieniowe do bezpośredniego uruchamiania TypeScript (`bun run ...`, `bun --watch ...`). Domyślnym menedżerem pakietów pozostaje `pnpm`, który jest w pełni obsługiwany i używany przez narzędzia dokumentacji. Bun nie może używać `pnpm-lock.yaml` i zignoruje ten plik.

## Instalacja

<Steps>
  <Step title="Zainstaluj zależności">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` są ignorowane przez git, więc nie powodują zmian w repozytorium. Aby całkowicie pominąć zapisywanie pliku blokady:

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

Bun blokuje skrypty cyklu życia zależności, chyba że zostaną jawnie zaufane. W tym repozytorium często blokowane skrypty nie są wymagane:

- `@whiskeysockets/baileys` `preinstall` -- sprawdza, czy główna wersja Node >= 20 (OpenClaw domyślnie używa Node 24 i nadal obsługuje Node 22 LTS, obecnie `22.14+`)
- `protobufjs` `postinstall` -- emituje ostrzeżenia o niezgodnych schematach wersji (brak artefaktów kompilacji)

Jeśli napotkasz problem w środowisku uruchomieniowym, który wymaga tych skryptów, jawnie oznacz je jako zaufane:

```sh
bun pm trust @whiskeysockets/baileys protobufjs
```

## Zastrzeżenia

Niektóre skrypty nadal mają na stałe wpisane pnpm (na przykład `docs:build`, `ui:*`, `protocol:check`). Na razie uruchamiaj je przez pnpm.

## Powiązane

- [Przegląd instalacji](/pl/install)
- [Node.js](/pl/install/node)
- [Aktualizowanie](/pl/install/updating)
