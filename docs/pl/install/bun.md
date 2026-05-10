---
read_when:
    - Chcesz najszybszego lokalnego cyklu deweloperskiego (bun + watch)
    - Napotykasz problemy ze skryptami instalacji, poprawek i cyklu życia Bun
summary: 'Przepływ pracy z Bun (eksperymentalny): instalacje i pułapki w porównaniu z pnpm'
title: Bun (eksperymentalny)
x-i18n:
    generated_at: "2026-05-10T19:41:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: d97a7da26520d66e6033065c50d6490c869ace3d5f0b25aafcd196074cf7df7c
    source_path: install/bun.md
    workflow: 16
---

<Warning>
Bun **nie jest zalecany jako środowisko uruchomieniowe Gateway** (znane problemy z WhatsApp i Telegram). W produkcji używaj Node.
</Warning>

Bun to opcjonalne lokalne środowisko uruchomieniowe do bezpośredniego uruchamiania TypeScript (`bun run ...`, `bun --watch ...`). Domyślnym menedżerem pakietów pozostaje `pnpm`, który jest w pełni obsługiwany i używany przez narzędzia dokumentacji. Bun nie może używać `pnpm-lock.yaml` i będzie go ignorować.

## Instalacja

<Steps>
  <Step title="Zainstaluj zależności">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` są ignorowane przez git, więc w repozytorium nie powstają zmiany. Aby całkowicie pominąć zapisywanie pliku lockfile:

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

Bun blokuje skrypty cyklu życia zależności, chyba że zostaną jawnie uznane za zaufane. W tym repozytorium często blokowane skrypty nie są wymagane:

- `baileys` `preinstall` -- sprawdza główną wersję Node >= 20 (OpenClaw domyślnie używa Node 24 i nadal obsługuje Node 22 LTS, obecnie `22.16+`)
- `protobufjs` `postinstall` -- emituje ostrzeżenia o niezgodnych schematach wersjonowania (brak artefaktów kompilacji)

Jeśli napotkasz problem w czasie działania, który wymaga tych skryptów, jawnie oznacz je jako zaufane:

```sh
bun pm trust baileys protobufjs
```

## Zastrzeżenia

Niektóre skrypty nadal mają na stałe wpisane pnpm (na przykład `docs:build`, `ui:*`, `protocol:check`). Na razie uruchamiaj je przez pnpm.

## Powiązane

- [Przegląd instalacji](/pl/install)
- [Node.js](/pl/install/node)
- [Aktualizowanie](/pl/install/updating)
