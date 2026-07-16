---
read_when:
    - Vous souhaitez installer des dépendances ou exécuter des scripts de paquet avec Bun
    - Vous rencontrez des problèmes avec les scripts d’installation, de correctif ou de cycle de vie de Bun
summary: Flux de travail Bun pour les installations et les scripts de paquet ; Node est requis à l’exécution
title: Bun
x-i18n:
    generated_at: "2026-07-16T13:20:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b822f700123b91c785eb881ebf28a63e77915b46dfd44beb9dbf63fb71aaa0d2
    source_path: install/bun.md
    workflow: 16
---

<Warning>
Bun ne peut pas exécuter la CLI ni le Gateway OpenClaw, car il ne fournit pas l’API `node:sqlite` requise. Installez une version de Node prise en charge pour toutes les commandes d’exécution d’OpenClaw.
</Warning>

Bun reste utilisable comme programme facultatif d’installation des dépendances et d’exécution des scripts de paquet. Le gestionnaire de paquets par défaut reste `pnpm`, qui est entièrement pris en charge et utilisé par les outils de documentation. Bun ne peut pas utiliser `pnpm-lock.yaml` et l’ignore.

## Installation

<Steps>
  <Step title="Installer les dépendances">
    ```sh
    bun install
    ```

    `bun.lock` / `bun.lockb` sont ignorés par Git, donc le dépôt ne subit aucune modification parasite. Pour éviter totalement l’écriture des fichiers de verrouillage :

    ```sh
    bun install --no-save
    ```

  </Step>
  <Step title="Compiler et tester">
    ```sh
    bun run build
    bun run vitest run
    ```

    Les commandes qui lancent OpenClaw lui-même doivent toujours être exécutées avec Node.

  </Step>
</Steps>

## Scripts de cycle de vie

Bun bloque les scripts de cycle de vie des dépendances, sauf s’ils sont explicitement approuvés. Pour ce dépôt, les scripts couramment bloqués ne sont pas nécessaires :

- `baileys` `preinstall` : vérifie que la version majeure de Node est >= 20 (OpenClaw nécessite Node 22.22.3+, 24.15+ ou 25.9+, Node 24 étant recommandé)
- `protobufjs` `postinstall` : émet des avertissements concernant des schémas de version incompatibles (aucun artefact de compilation)

Si vous rencontrez un problème d’exécution nécessitant ces scripts, approuvez-les explicitement :

```sh
bun pm trust baileys protobufjs
```

## Points d’attention

Certains scripts de paquet utilisent explicitement `pnpm` en interne (par exemple `check:docs`, `ui:*`, `protocol:check`). Leur exécution via `bun run` lance tout de même `pnpm` dans un shell ; exécutez-les donc directement via `pnpm`.

## Voir aussi

- [Vue d’ensemble de l’installation](/fr/install)
- [Node.js](/fr/install/node)
- [Mise à jour](/fr/install/updating)
