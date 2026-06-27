---
read_when:
    - Je wilt de snelste lokale ontwikkelcyclus (`bun` + watch)
    - Je loopt tegen problemen met Bun-installatie-, patch- en levenscyclusscripts aan
summary: 'Bun-workflow (experimenteel): installatie en aandachtspunten vergeleken met pnpm'
title: Bun (experimenteel)
x-i18n:
    generated_at: "2026-06-27T17:41:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1c31f2c09f3c1f99ae1a306184a86f2240b0c0f4f655c2759f5aeb6bac6b745a
    source_path: install/bun.md
    workflow: 16
---

<Warning>
Bun wordt **niet aanbevolen voor Gateway-runtime** (bekende problemen met WhatsApp en Telegram). Gebruik Node voor productie.
</Warning>

Bun is een optionele lokale runtime om TypeScript direct uit te voeren (`bun run ...`, `bun --watch ...`). De standaard pakketbeheerder blijft `pnpm`, dat volledig wordt ondersteund en door documentatietooling wordt gebruikt. Bun kan `pnpm-lock.yaml` niet gebruiken en zal het negeren.

## Installeren

<Steps>
  <Step title="Afhankelijkheden installeren">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` worden door git genegeerd, dus er is geen repo-ruis. Om het schrijven van lockfiles volledig over te slaan:

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

- `baileys` `preinstall` -- controleert of Node major >= 20 (OpenClaw gebruikt standaard Node 24 en ondersteunt nog steeds Node 22 LTS, momenteel `22.19+`)
- `protobufjs` `postinstall` -- geeft waarschuwingen over incompatibele versieschema's (geen buildartefacten)

Als je een runtimeprobleem tegenkomt waarvoor deze scripts nodig zijn, vertrouw ze dan expliciet:

```sh
bun pm trust baileys protobufjs
```

## Kanttekeningen

Sommige scripts hardcoderen pnpm nog steeds (bijvoorbeeld `check:docs`, `ui:*`, `protocol:check`). Voer die voorlopig uit via pnpm.

## Gerelateerd

- [Installatieoverzicht](/nl/install)
- [Node.js](/nl/install/node)
- [Bijwerken](/nl/install/updating)
