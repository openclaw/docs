---
read_when:
    - Je wilt de snelste lokale ontwikkelloop (bun + watch)
    - Je loopt tegen problemen aan met Bun-installatie, patches of lifecycle-scripts
summary: 'Bun-werkwijze (experimenteel): installaties en valkuilen t.o.v. pnpm'
title: Bun (experimenteel)
x-i18n:
    generated_at: "2026-05-07T13:21:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1637cb81310422b718934f9c2d1f506dec46f1624dd9ac850bed04321b863041
    source_path: install/bun.md
    workflow: 16
---

<Warning>
Bun wordt **niet aanbevolen voor de Gateway-runtime** (bekende problemen met WhatsApp en Telegram). Gebruik Node voor productie.
</Warning>

Bun is een optionele lokale runtime om TypeScript rechtstreeks uit te voeren (`bun run ...`, `bun --watch ...`). De standaardpakketbeheerder blijft `pnpm`, dat volledig wordt ondersteund en door documentatietooling wordt gebruikt. Bun kan `pnpm-lock.yaml` niet gebruiken en zal het negeren.

## Installeren

<Steps>
  <Step title="Afhankelijkheden installeren">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` worden genegeerd door git, dus er is geen repo-ruis. Om het schrijven van lockfiles volledig over te slaan:

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

Bun blokkeert levenscyclusscripts van afhankelijkheden tenzij ze expliciet worden vertrouwd. Voor deze repo zijn de vaak geblokkeerde scripts niet vereist:

- `@whiskeysockets/baileys` `preinstall` -- controleert of de hoofdversie van Node >= 20 is (OpenClaw gebruikt standaard Node 24 en ondersteunt nog steeds Node 22 LTS, momenteel `22.16+`)
- `protobufjs` `postinstall` -- geeft waarschuwingen over incompatibele versieschema's (geen buildartefacten)

Als je een runtimeprobleem tegenkomt waarvoor deze scripts nodig zijn, vertrouw ze dan expliciet:

```sh
bun pm trust @whiskeysockets/baileys protobufjs
```

## Kanttekeningen

Sommige scripts coderen pnpm nog steeds hard (bijvoorbeeld `docs:build`, `ui:*`, `protocol:check`). Voer die voorlopig uit via pnpm.

## Gerelateerd

- [Installatie-overzicht](/nl/install)
- [Node.js](/nl/install/node)
- [Bijwerken](/nl/install/updating)
