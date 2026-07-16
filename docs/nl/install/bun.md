---
read_when:
    - Je wilt afhankelijkheden installeren of pakketscripts uitvoeren met Bun
    - Je ondervindt problemen met Bun-installatie-, patch- of levenscyclusscripts
summary: Bun-workflow voor installaties en pakketscripts; Node is vereist tijdens runtime
title: Bun
x-i18n:
    generated_at: "2026-07-16T15:58:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b822f700123b91c785eb881ebf28a63e77915b46dfd44beb9dbf63fb71aaa0d2
    source_path: install/bun.md
    workflow: 16
---

<Warning>
Bun kan de OpenClaw CLI of Gateway niet uitvoeren omdat het niet de vereiste `node:sqlite`-API biedt. Installeer een ondersteunde Node-versie voor alle OpenClaw-runtimeopdrachten.
</Warning>

Bun blijft bruikbaar als optioneel installatieprogramma voor afhankelijkheden en als uitvoerder van pakketscripts. De standaardpakketbeheerder blijft `pnpm`, die volledig wordt ondersteund en door de documentatietools wordt gebruikt. Bun kan `pnpm-lock.yaml` niet gebruiken en negeert dit.

## Installeren

<Steps>
  <Step title="Afhankelijkheden installeren">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` worden door git genegeerd, zodat er geen wijzigingen in de repository ontstaan. Om het schrijven van lockfiles volledig over te slaan:

    ```sh
    bun install --no-save
    ```

  </Step>
  <Step title="Bouwen en testen">
    ```sh
    bun run build
    bun run vitest run
    ```

    Opdrachten die OpenClaw zelf starten, moeten nog steeds via Node worden uitgevoerd.

  </Step>
</Steps>

## Levenscyclusscripts

Bun blokkeert levenscyclusscripts van afhankelijkheden tenzij ze expliciet worden vertrouwd. Voor deze repository zijn de scripts die doorgaans worden geblokkeerd niet vereist:

- `baileys` `preinstall`: controleert of de hoofdversie van Node >= 20 is (OpenClaw vereist Node 22.22.3+, 24.15+ of 25.9+, waarbij Node 24 wordt aanbevolen)
- `protobufjs` `postinstall`: geeft waarschuwingen over incompatibele versieschema's (geen buildartefacten)

Als je een runtimeprobleem tegenkomt waarvoor deze scripts nodig zijn, vertrouw ze dan expliciet:

```sh
bun pm trust baileys protobufjs
```

## Aandachtspunten

Sommige pakketscripts bevatten intern een hardgecodeerde `pnpm` (bijvoorbeeld `check:docs`, `ui:*`, `protocol:check`). Als je ze via `bun run` uitvoert, starten ze nog steeds `pnpm` via de shell, dus voer die gewoon rechtstreeks via `pnpm` uit.

## Gerelateerd

- [Installatieoverzicht](/nl/install)
- [Node.js](/nl/install/node)
- [Bijwerken](/nl/install/updating)
