---
read_when:
    - Je wilt de snelste lokale ontwikkelcyclus (bun + watch)
    - Je ondervindt problemen met installatie-, patch- of levenscyclusscripts van Bun
summary: 'Bun-workflow (experimenteel): installatie en aandachtspunten ten opzichte van pnpm'
title: Bun (experimenteel)
x-i18n:
    generated_at: "2026-07-12T08:59:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b836be354166ceb073d170e472e8b69c3f517e754fe71417df1d85d27a18ae94
    source_path: install/bun.md
    workflow: 16
---

<Warning>
Bun wordt niet aanbevolen voor de Gateway-runtime (bekende problemen met WhatsApp en Telegram). Gebruik Node voor productie.
</Warning>

Bun is een optionele lokale runtime om TypeScript rechtstreeks uit te voeren (`bun run ...`, `bun --watch ...`). De standaardpakketbeheerder blijft `pnpm`, die volledig wordt ondersteund en door de documentatiehulpmiddelen wordt gebruikt. Bun kan `pnpm-lock.yaml` niet gebruiken en negeert dit bestand.

## Installatie

<Steps>
  <Step title="Afhankelijkheden installeren">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` worden door Git genegeerd, zodat er geen onnodige wijzigingen in de repository ontstaan. Om het schrijven van lockbestanden volledig over te slaan:

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

Bun blokkeert levenscyclusscripts van afhankelijkheden, tenzij ze expliciet worden vertrouwd. Voor deze repository zijn de scripts die doorgaans worden geblokkeerd niet vereist:

- `baileys` `preinstall`: controleert of de hoofdversie van Node >= 20 is (OpenClaw vereist Node 22.19+ of 23.11+, waarbij Node 24 wordt aanbevolen)
- `protobufjs` `postinstall`: geeft waarschuwingen weer over incompatibele versieschema's (geen buildartefacten)

Als u een runtimeprobleem tegenkomt waarvoor deze scripts nodig zijn, vertrouw ze dan expliciet:

```sh
bun pm trust baileys protobufjs
```

## Aandachtspunten

Sommige pakketscripts bevatten intern een hardgecodeerde verwijzing naar `pnpm` (bijvoorbeeld `check:docs`, `ui:*`, `protocol:check`). Als u deze via `bun run` uitvoert, wordt alsnog `pnpm` aangeroepen. Voer deze scripts daarom rechtstreeks via `pnpm` uit.

## Gerelateerd

- [Overzicht van de installatie](/nl/install)
- [Node.js](/nl/install/node)
- [Bijwerken](/nl/install/updating)
