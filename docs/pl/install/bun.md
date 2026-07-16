---
read_when:
    - Chcesz zainstalować zależności lub uruchomić skrypty pakietów za pomocą Bun
    - Występują problemy ze skryptami instalacji, poprawek lub cyklu życia Bun
summary: Przepływ pracy Bun do instalacji i skryptów pakietów; Node jest wymagany w czasie wykonywania
title: Bun
x-i18n:
    generated_at: "2026-07-16T18:43:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b822f700123b91c785eb881ebf28a63e77915b46dfd44beb9dbf63fb71aaa0d2
    source_path: install/bun.md
    workflow: 16
---

<Warning>
Bun nie może uruchamiać CLI ani Gateway OpenClaw, ponieważ nie udostępnia wymaganego API `node:sqlite`. Dla wszystkich poleceń środowiska uruchomieniowego OpenClaw należy zainstalować obsługiwaną wersję Node.
</Warning>

Bun może nadal służyć jako opcjonalny instalator zależności i mechanizm uruchamiania skryptów pakietów. Domyślnym menedżerem pakietów pozostaje `pnpm`, który jest w pełni obsługiwany i używany przez narzędzia dokumentacji. Bun nie może używać `pnpm-lock.yaml` i je ignoruje.

## Instalacja

<Steps>
  <Step title="Zainstaluj zależności">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` są ignorowane przez Git, więc nie powodują zmian w repozytorium. Aby całkowicie pominąć zapisywanie plików blokady:

    ```sh
    bun install --no-save
    ```

  </Step>
  <Step title="Zbuduj i przetestuj">
    ```sh
    bun run build
    bun run vitest run
    ```

    Polecenia uruchamiające sam OpenClaw nadal muszą być wykonywane za pośrednictwem Node.

  </Step>
</Steps>

## Skrypty cyklu życia

Bun blokuje skrypty cyklu życia zależności, jeśli nie zostały wyraźnie uznane za zaufane. W tym repozytorium często blokowane skrypty nie są wymagane:

- `baileys` `preinstall`: sprawdza, czy główna wersja Node jest >= 20 (OpenClaw wymaga Node 22.22.3+, 24.15+ lub 25.9+; zalecany jest Node 24)
- `protobufjs` `postinstall`: wyświetla ostrzeżenia o niezgodnych schematach wersjonowania (bez artefaktów kompilacji)

Jeśli wystąpi problem w czasie działania wymagający tych skryptów, należy wyraźnie oznaczyć je jako zaufane:

```sh
bun pm trust baileys protobufjs
```

## Ograniczenia

Niektóre skrypty pakietów mają wewnętrznie wpisane na stałe `pnpm` (na przykład `check:docs`, `ui:*`, `protocol:check`). Uruchamianie ich za pomocą `bun run` nadal wywołuje `pnpm` w powłoce, dlatego należy uruchamiać je bezpośrednio za pomocą `pnpm`.

## Powiązane materiały

- [Omówienie instalacji](/pl/install)
- [Node.js](/pl/install/node)
- [Aktualizowanie](/pl/install/updating)
