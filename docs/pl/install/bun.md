---
read_when:
    - Chcesz uzyskać najszybszą lokalną pętlę deweloperską (bun + watch)
    - Natrafiłeś na problemy Bun z instalacją/patchami/skryptami cyklu życia
summary: 'Przepływ pracy Bun (eksperymentalny): instalacja i pułapki w porównaniu z pnpm'
title: Bun (eksperymentalny)
x-i18n:
    generated_at: "2026-04-05T13:56:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: b0845567834124bb9206db64df013dc29f3b61a04da4f7e7f0c2823a9ecd67a6
    source_path: install/bun.md
    workflow: 15
---

# Bun (eksperymentalny)

<Warning>
Bun **nie jest zalecany jako środowisko uruchomieniowe gateway** (znane problemy z WhatsApp i Telegram). W produkcji używaj Node.
</Warning>

Bun to opcjonalne lokalne środowisko uruchomieniowe do bezpośredniego uruchamiania TypeScript (`bun run ...`, `bun --watch ...`). Domyślnym menedżerem pakietów pozostaje `pnpm`, który jest w pełni wspierany i używany przez narzędzia dokumentacji. Bun nie może używać `pnpm-lock.yaml` i zignoruje ten plik.

## Instalacja

<Steps>
  <Step title="Zainstaluj zależności">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` są ignorowane przez git, więc repozytorium nie będzie zaśmiecane zmianami. Aby całkowicie pominąć zapis lockfile:

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

Bun blokuje skrypty cyklu życia zależności, chyba że jawnie im zaufasz. W tym repo najczęściej blokowane skrypty nie są wymagane:

- `@whiskeysockets/baileys` `preinstall` — sprawdza, czy główna wersja Node jest >= 20 (OpenClaw domyślnie używa Node 24 i nadal wspiera Node 22 LTS, obecnie `22.14+`)
- `protobufjs` `postinstall` — emituje ostrzeżenia o niezgodnych schematach wersjonowania (bez artefaktów builda)

Jeśli trafisz na problem w czasie działania, który wymaga tych skryptów, jawnie im zaufaj:

```sh
bun pm trust @whiskeysockets/baileys protobufjs
```

## Ograniczenia

Niektóre skrypty nadal mają na sztywno wpisane pnpm (na przykład `docs:build`, `ui:*`, `protocol:check`). Na razie uruchamiaj je przez pnpm.
