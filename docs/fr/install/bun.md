---
read_when:
    - Vous voulez la boucle de développement local la plus rapide (bun + watch)
    - Vous rencontrez des problèmes avec l’installation, les correctifs ou les scripts de cycle de vie de Bun
summary: 'Flux de travail Bun (expérimental) : installations et pièges par rapport à pnpm'
title: Bun (expérimental)
x-i18n:
    generated_at: "2026-05-11T20:41:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: d97a7da26520d66e6033065c50d6490c869ace3d5f0b25aafcd196074cf7df7c
    source_path: install/bun.md
    workflow: 16
---

<Warning>
Bun n’est **pas recommandé pour le runtime du Gateway** (problèmes connus avec WhatsApp et Telegram). Utilisez Node en production.
</Warning>

Bun est un runtime local facultatif permettant d’exécuter TypeScript directement (`bun run ...`, `bun --watch ...`). Le gestionnaire de paquets par défaut reste `pnpm`, qui est entièrement pris en charge et utilisé par l’outillage de documentation. Bun ne peut pas utiliser `pnpm-lock.yaml` et l’ignorera.

## Installation

<Steps>
  <Step title="Install dependencies">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` sont ignorés par git, il n’y a donc pas de modifications inutiles dans le dépôt. Pour ignorer entièrement l’écriture du fichier de verrouillage :

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

## Scripts de cycle de vie

Bun bloque les scripts de cycle de vie des dépendances sauf s’ils sont explicitement approuvés. Pour ce dépôt, les scripts couramment bloqués ne sont pas requis :

- `baileys` `preinstall` -- vérifie que la version majeure de Node est >= 20 (OpenClaw utilise Node 24 par défaut et prend toujours en charge Node 22 LTS, actuellement `22.16+`)
- `protobufjs` `postinstall` -- émet des avertissements sur des schémas de version incompatibles (aucun artefact de build)

Si vous rencontrez un problème d’exécution qui nécessite ces scripts, approuvez-les explicitement :

```sh
bun pm trust baileys protobufjs
```

## Points à connaître

Certains scripts codent encore pnpm en dur (par exemple `docs:build`, `ui:*`, `protocol:check`). Exécutez-les via pnpm pour le moment.

## Connexe

- [Vue d’ensemble de l’installation](/fr/install)
- [Node.js](/fr/install/node)
- [Mise à jour](/fr/install/updating)
