---
read_when:
    - Je wilt de snelste lokale ontwikkelcyclus (bun + watch)
    - Je loopt tegen problemen met Bun-installatie-, patch- of lifecycle-scripts aan
summary: 'Bun-workflow (experimenteel): installaties en valkuilen versus pnpm'
title: Bun (experimenteel)
x-i18n:
    generated_at: "2026-05-11T20:34:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: d97a7da26520d66e6033065c50d6490c869ace3d5f0b25aafcd196074cf7df7c
    source_path: install/bun.md
    workflow: 16
---

<Warning>
Bun wordt **niet aanbevolen voor Gateway-runtime** (bekende problemen met WhatsApp en Telegram). Gebruik Node voor productie.
</Warning>

Bun is een optionele lokale runtime om TypeScript rechtstreeks uit te voeren (`bun run ...`, `bun --watch ...`). De standaard pakketbeheerder blijft `pnpm`, dat volledig wordt ondersteund en door documentatietooling wordt gebruikt. Bun kan `pnpm-lock.yaml` niet gebruiken en zal het negeren.

## Installeren

<Steps>
  <Step title="Afhankelijkheden installeren">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` staan in gitignore, dus er is geen repo-ruis. Om lockfile-wijzigingen volledig over te slaan:

    ```sh
    bun install --no-save
    ```

  </Step>
  <Step title="Bouwen en testen">
    ```sh
    bun run build
    bun run vitest run
    ```
  </Step>
</Steps>

## Levenscyclusscripts

Bun blokkeert levenscyclusscripts van afhankelijkheden tenzij ze expliciet worden vertrouwd. Voor deze repo zijn de scripts die vaak worden geblokkeerd niet vereist:

- `baileys` `preinstall` -- controleert Node major >= 20 (OpenClaw gebruikt standaard Node 24 en ondersteunt nog steeds Node 22 LTS, momenteel `22.16+`)
- `protobufjs` `postinstall` -- geeft waarschuwingen over incompatibele versieschema's (geen buildartefacten)

Als je een runtimeprobleem tegenkomt waarvoor deze scripts nodig zijn, vertrouw ze dan expliciet:

```sh
bun pm trust baileys protobufjs
```

## Kanttekeningen

Sommige scripts bevatten nog steeds hardcoded pnpm (bijvoorbeeld `docs:build`, `ui:*`, `protocol:check`). Voer die voorlopig uit via pnpm.

## Gerelateerd

- [Installatieoverzicht](/nl/install)
- [Node.js](/nl/install/node)
- [Bijwerken](/nl/install/updating)
