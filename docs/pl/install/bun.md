---
read_when:
    - Chcesz najszybszą lokalną pętlę deweloperską (bun + watch)
    - Wystąpiły problemy ze skryptami instalacji, poprawek lub cyklu życia Bun
summary: 'Przepływ pracy z Bun (eksperymentalny): instalacja i pułapki w porównaniu z pnpm'
title: Bun (eksperymentalne)
x-i18n:
    generated_at: "2026-06-27T17:41:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1c31f2c09f3c1f99ae1a306184a86f2240b0c0f4f655c2759f5aeb6bac6b745a
    source_path: install/bun.md
    workflow: 16
---

<Warning>
Bun **nie jest zalecany dla środowiska uruchomieniowego Gateway** (znane problemy z WhatsApp i Telegram). Używaj Node w produkcji.
</Warning>

Bun to opcjonalne lokalne środowisko uruchomieniowe do bezpośredniego uruchamiania TypeScript (`bun run ...`, `bun --watch ...`). Domyślnym menedżerem pakietów pozostaje `pnpm`, który jest w pełni obsługiwany i używany przez narzędzia dokumentacji. Bun nie może używać `pnpm-lock.yaml` i go zignoruje.

## Instalacja

<Steps>
  <Step title="Install dependencies">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` są ignorowane przez git, więc repozytorium nie ma zbędnych zmian. Aby całkowicie pominąć zapisywanie pliku blokady:

    ```sh
    bun install --no-save
    ```

  </Step>
  <Step title="Build and test">
    ```sh
    bun run build
    bun run vitest run
    ```
  </Step>
</Steps>

## Skrypty cyklu życia

Bun blokuje skrypty cyklu życia zależności, chyba że zostaną jawnie zaufane. W tym repozytorium często blokowane skrypty nie są wymagane:

- `baileys` `preinstall` -- sprawdza, czy główna wersja Node >= 20 (OpenClaw domyślnie używa Node 24 i nadal obsługuje Node 22 LTS, obecnie `22.19+`)
- `protobufjs` `postinstall` -- emituje ostrzeżenia o niezgodnych schematach wersji (brak artefaktów kompilacji)

Jeśli napotkasz problem w czasie działania, który wymaga tych skryptów, jawnie im zaufaj:

```sh
bun pm trust baileys protobufjs
```

## Uwagi

Niektóre skrypty nadal mają na sztywno wpisane pnpm (na przykład `check:docs`, `ui:*`, `protocol:check`). Na razie uruchamiaj je przez pnpm.

## Powiązane

- [Omówienie instalacji](/pl/install)
- [Node.js](/pl/install/node)
- [Aktualizowanie](/pl/install/updating)
