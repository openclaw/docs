---
read_when:
    - Je wilt de snelste lokale ontwikkelcyclus (bun + watch)
    - Je loopt tegen problemen aan met Bun-installatie-, patch- of lifecycle-scripts
summary: 'Bun-werkstroom (experimenteel): installaties en valkuilen ten opzichte van pnpm'
title: Bun (experimenteel)
x-i18n:
    generated_at: "2026-04-29T22:52:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: d596c8fa9cc585e23184e7b983ec3842361eac807a1f3c12a0529631876db486
    source_path: install/bun.md
    workflow: 16
---

<Warning>
Bun wordt **niet aanbevolen voor Gateway-runtime** (bekende problemen met WhatsApp en Telegram). Gebruik Node voor productie.
</Warning>

Bun is een optionele lokale runtime om TypeScript rechtstreeks uit te voeren (`bun run ...`, `bun --watch ...`). De standaardpakketbeheerder blijft `pnpm`, dat volledig wordt ondersteund en door de documentatietooling wordt gebruikt. Bun kan `pnpm-lock.yaml` niet gebruiken en zal het negeren.

## Installeren

<Steps>
  <Step title="Afhankelijkheden installeren">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` staan in gitignore, dus er is geen repo-ruis. Om het schrijven van lockfiles volledig over te slaan:

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

## Levenscyclus-scripts

Bun blokkeert levenscyclus-scripts van afhankelijkheden tenzij ze expliciet worden vertrouwd. Voor deze repo zijn de scripts die vaak worden geblokkeerd niet vereist:

- `@whiskeysockets/baileys` `preinstall` -- controleert Node major >= 20 (OpenClaw gebruikt standaard Node 24 en ondersteunt nog steeds Node 22 LTS, momenteel `22.14+`)
- `protobufjs` `postinstall` -- geeft waarschuwingen over incompatibele versieschema's (geen buildartefacten)

Als je een runtimeprobleem tegenkomt waarvoor deze scripts nodig zijn, vertrouw ze dan expliciet:

```sh
bun pm trust @whiskeysockets/baileys protobufjs
```

## Kanttekeningen

Sommige scripts coderen pnpm nog hard (bijvoorbeeld `docs:build`, `ui:*`, `protocol:check`). Voer die voorlopig via pnpm uit.

## Gerelateerd

- [Installatieoverzicht](/nl/install)
- [Node.js](/nl/install/node)
- [Bijwerken](/nl/install/updating)
