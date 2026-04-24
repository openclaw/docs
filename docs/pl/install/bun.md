---
read_when:
    - Chcesz najszybszej lokalnej pętli deweloperskiej (bun + watch)
    - Napotkałeś problemy z instalacją/skryptami patch/lifecycle w Bun
summary: 'Workflow Bun (eksperymentalny): instalacja i pułapki w porównaniu z pnpm'
title: Bun (eksperymentalny)
x-i18n:
    generated_at: "2026-04-24T09:15:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5637f64fe272faf74915e8de115f21fdf9c9dd0406e5c471932323b2c1d4c0bd
    source_path: install/bun.md
    workflow: 15
---

<Warning>
Bun jest **niezalecany jako środowisko wykonawcze gateway** (znane problemy z WhatsApp i Telegram). W produkcji używaj Node.
</Warning>

Bun to opcjonalne lokalne środowisko wykonawcze do bezpośredniego uruchamiania TypeScript (`bun run ...`, `bun --watch ...`). Domyślnym menedżerem pakietów pozostaje `pnpm`, który jest w pełni obsługiwany i używany przez narzędzia dokumentacji. Bun nie może używać `pnpm-lock.yaml` i go zignoruje.

## Instalacja

<Steps>
  <Step title="Zainstaluj zależności">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` są ignorowane przez git, więc repozytorium nie będzie się zaśmiecać. Aby całkowicie pominąć zapis lockfile:

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

## Skrypty lifecycle

Bun blokuje skrypty lifecycle zależności, chyba że jawnie im zaufasz. W tym repozytorium najczęściej blokowane skrypty nie są wymagane:

- `@whiskeysockets/baileys` `preinstall` -- sprawdza, czy główna wersja Node jest >= 20 (OpenClaw domyślnie używa Node 24 i nadal obsługuje Node 22 LTS, obecnie `22.14+`)
- `protobufjs` `postinstall` -- emituje ostrzeżenia o niezgodnych schematach wersjonowania (brak artefaktów builda)

Jeśli napotkasz problem w czasie działania, który wymaga tych skryptów, jawnie im zaufaj:

```sh
bun pm trust @whiskeysockets/baileys protobufjs
```

## Ograniczenia

Niektóre skrypty nadal na sztywno używają pnpm (na przykład `docs:build`, `ui:*`, `protocol:check`). Na razie uruchamiaj je przez pnpm.

## Powiązane

- [Przegląd instalacji](/pl/install)
- [Node.js](/pl/install/node)
- [Aktualizowanie](/pl/install/updating)
