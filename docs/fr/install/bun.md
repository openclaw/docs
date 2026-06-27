---
read_when:
    - Vous voulez la boucle de développement locale la plus rapide (bun + watch)
    - Vous rencontrez des problèmes de scripts d’installation, de correctif et de cycle de vie avec Bun
summary: 'Flux de travail Bun (expérimental) : installations et pièges par rapport à pnpm'
title: Bun (expérimental)
x-i18n:
    generated_at: "2026-06-27T17:38:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1c31f2c09f3c1f99ae1a306184a86f2240b0c0f4f655c2759f5aeb6bac6b745a
    source_path: install/bun.md
    workflow: 16
---

<Warning>
Bun est **déconseillé pour l’exécution du Gateway** (problèmes connus avec WhatsApp et Telegram). Utilisez Node en production.
</Warning>

Bun est un runtime local facultatif pour exécuter TypeScript directement (`bun run ...`, `bun --watch ...`). Le gestionnaire de paquets par défaut reste `pnpm`, qui est entièrement pris en charge et utilisé par les outils de documentation. Bun ne peut pas utiliser `pnpm-lock.yaml` et l’ignorera.

## Installer

<Steps>
  <Step title="Install dependencies">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` sont ignorés par git, il n’y a donc pas de bruit dans le dépôt. Pour ignorer entièrement l’écriture du fichier de verrouillage :

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

Bun bloque les scripts de cycle de vie des dépendances sauf s’ils sont explicitement approuvés. Pour ce dépôt, les scripts couramment bloqués ne sont pas requis :

- `baileys` `preinstall` -- vérifie que la version majeure de Node est >= 20 (OpenClaw utilise Node 24 par défaut et prend toujours en charge Node 22 LTS, actuellement `22.19+`)
- `protobufjs` `postinstall` -- émet des avertissements sur des schémas de version incompatibles (aucun artefact de build)

Si vous rencontrez un problème d’exécution qui nécessite ces scripts, approuvez-les explicitement :

```sh
bun pm trust baileys protobufjs
```

## Mises en garde

Certains scripts codent encore pnpm en dur (par exemple `check:docs`, `ui:*`, `protocol:check`). Exécutez-les via pnpm pour l’instant.

## Voir aussi

- [Vue d’ensemble de l’installation](/fr/install)
- [Node.js](/fr/install/node)
- [Mise à jour](/fr/install/updating)
