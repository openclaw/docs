---
read_when:
    - Vous voulez la boucle de développement locale la plus rapide (bun + watch)
    - Vous rencontrez des problèmes de scripts d’installation, de correctifs ou de cycle de vie de Bun
summary: 'Flux de travail Bun (expérimental) : installations et pièges par rapport à pnpm'
title: Bun (expérimental)
x-i18n:
    generated_at: "2026-05-07T13:20:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1637cb81310422b718934f9c2d1f506dec46f1624dd9ac850bed04321b863041
    source_path: install/bun.md
    workflow: 16
---

<Warning>
Bun n’est **pas recommandé pour l’exécution du Gateway** (problèmes connus avec WhatsApp et Telegram). Utilisez Node en production.
</Warning>

Bun est un environnement d’exécution local facultatif pour exécuter TypeScript directement (`bun run ...`, `bun --watch ...`). Le gestionnaire de paquets par défaut reste `pnpm`, qui est entièrement pris en charge et utilisé par l’outillage de documentation. Bun ne peut pas utiliser `pnpm-lock.yaml` et l’ignorera.

## Installation

<Steps>
  <Step title="Installer les dépendances">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` sont ignorés par Git, il n’y a donc pas de changements parasites dans le dépôt. Pour ignorer entièrement l’écriture du fichier de verrouillage :

    ```sh
    bun install --no-save
    ```

  </Step>
  <Step title="Compiler et tester">
    ```sh
    bun run build
    bun run vitest run
    ```
  </Step>
</Steps>

## Scripts de cycle de vie

Bun bloque les scripts de cycle de vie des dépendances, sauf s’ils sont explicitement approuvés. Pour ce dépôt, les scripts couramment bloqués ne sont pas requis :

- `@whiskeysockets/baileys` `preinstall` -- vérifie que la version majeure de Node est >= 20 (OpenClaw utilise Node 24 par défaut et prend toujours en charge Node 22 LTS, actuellement `22.16+`)
- `protobufjs` `postinstall` -- émet des avertissements sur les schémas de version incompatibles (aucun artefact de build)

Si vous rencontrez un problème à l’exécution qui nécessite ces scripts, approuvez-les explicitement :

```sh
bun pm trust @whiskeysockets/baileys protobufjs
```

## Mises en garde

Certains scripts codent encore pnpm en dur (par exemple `docs:build`, `ui:*`, `protocol:check`). Exécutez-les via pnpm pour le moment.

## Articles connexes

- [Vue d’ensemble de l’installation](/fr/install)
- [Node.js](/fr/install/node)
- [Mise à jour](/fr/install/updating)
