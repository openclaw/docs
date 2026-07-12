---
read_when:
    - Vous souhaitez la boucle de développement locale la plus rapide (bun + surveillance)
    - Vous rencontrez des problèmes avec les scripts d’installation, de correctifs ou de cycle de vie de Bun
summary: 'Flux de travail Bun (expérimental) : installation et pièges par rapport à pnpm'
title: Bun (expérimental)
x-i18n:
    generated_at: "2026-07-12T02:43:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b836be354166ceb073d170e472e8b69c3f517e754fe71417df1d85d27a18ae94
    source_path: install/bun.md
    workflow: 16
---

<Warning>
Bun n’est pas recommandé pour l’exécution du Gateway (problèmes connus avec WhatsApp et Telegram). Utilisez Node en production.
</Warning>

Bun est un environnement d’exécution local facultatif permettant d’exécuter directement TypeScript (`bun run ...`, `bun --watch ...`). Le gestionnaire de paquets par défaut reste `pnpm`, qui est entièrement pris en charge et utilisé par les outils de documentation. Bun ne peut pas utiliser `pnpm-lock.yaml` et l’ignore.

## Installation

<Steps>
  <Step title="Installer les dépendances">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` sont ignorés par Git, ce qui évite toute modification parasite du dépôt. Pour empêcher complètement l’écriture du fichier de verrouillage :

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

Bun bloque les scripts de cycle de vie des dépendances sauf s’ils sont explicitement approuvés. Pour ce dépôt, les scripts couramment bloqués ne sont pas nécessaires :

- `baileys` `preinstall` : vérifie que la version majeure de Node est supérieure ou égale à 20 (OpenClaw nécessite Node 22.19+ ou 23.11+, Node 24 étant recommandé)
- `protobufjs` `postinstall` : émet des avertissements concernant des systèmes de gestion des versions incompatibles (aucun artefact de compilation)

Si vous rencontrez un problème d’exécution nécessitant ces scripts, approuvez-les explicitement :

```sh
bun pm trust baileys protobufjs
```

## Points à prendre en compte

Certains scripts de paquets utilisent explicitement `pnpm` en interne (par exemple `check:docs`, `ui:*`, `protocol:check`). Leur exécution avec `bun run` lance tout de même `pnpm` dans un interpréteur de commandes ; exécutez-les donc directement avec `pnpm`.

## Pages connexes

- [Présentation de l’installation](/fr/install)
- [Node.js](/fr/install/node)
- [Mise à jour](/fr/install/updating)
