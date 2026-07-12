---
read_when:
    - Vous souhaitez la boucle de développement local la plus rapide (bun + watch)
    - Vous rencontrez des problèmes avec les scripts d’installation, de correctif ou de cycle de vie de Bun
summary: 'Workflow Bun (expérimental) : installation et pièges par rapport à pnpm'
title: Bun (expérimental)
x-i18n:
    generated_at: "2026-07-12T15:33:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
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

    `bun.lock` / `bun.lockb` sont ignorés par Git, ce qui évite toute modification superflue dans le dépôt. Pour empêcher entièrement l’écriture de fichiers de verrouillage :

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

Bun bloque les scripts de cycle de vie des dépendances, sauf s’ils sont explicitement approuvés. Pour ce dépôt, les scripts couramment bloqués ne sont pas nécessaires :

- `baileys` `preinstall` : vérifie que la version majeure de Node est >= 20 (OpenClaw nécessite Node 22.19+ ou 23.11+, Node 24 étant recommandé)
- `protobufjs` `postinstall` : émet des avertissements concernant des schémas de version incompatibles (aucun artefact de compilation)

Si vous rencontrez un problème d’exécution nécessitant ces scripts, approuvez-les explicitement :

```sh
bun pm trust baileys protobufjs
```

## Limitations

Certains scripts de paquet utilisent `pnpm` en dur en interne (par exemple `check:docs`, `ui:*`, `protocol:check`). Leur exécution avec `bun run` lance tout de même `pnpm` dans un shell ; exécutez-les donc directement avec `pnpm`.

## Pages connexes

- [Vue d’ensemble de l’installation](/fr/install)
- [Node.js](/fr/install/node)
- [Mise à jour](/fr/install/updating)
