---
read_when:
    - Vous voulez une archive de sauvegarde de premier ordre pour l’état local d’OpenClaw
    - Vous souhaitez prévisualiser les chemins qui seraient inclus avant une réinitialisation ou une désinstallation
summary: Référence CLI pour `openclaw backup` (créer des archives de sauvegarde locales)
title: Sauvegarde
x-i18n:
    generated_at: "2026-05-11T20:25:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2c95cf475a563ad4f0a2dbaeda504b265580545c9d3f6f71d2f4d2a183e76a5c
    source_path: cli/backup.md
    workflow: 16
---

# `openclaw backup`

Créez une archive de sauvegarde locale pour l’état, la configuration, les profils d’authentification, les identifiants de canal/fournisseur, les sessions et, éventuellement, les espaces de travail d’OpenClaw.

```bash
openclaw backup create
openclaw backup create --output ~/Backups
openclaw backup create --dry-run --json
openclaw backup create --verify
openclaw backup create --no-include-workspace
openclaw backup create --only-config
openclaw backup verify ./2026-03-09T00-00-00.000Z-openclaw-backup.tar.gz
```

## Notes

- L’archive inclut un fichier `manifest.json` avec les chemins source résolus et la disposition de l’archive.
- La sortie par défaut est une archive `.tar.gz` horodatée dans le répertoire de travail actuel.
- Si le répertoire de travail actuel se trouve dans une arborescence source sauvegardée, OpenClaw se rabat sur votre répertoire personnel pour l’emplacement par défaut de l’archive.
- Les fichiers d’archive existants ne sont jamais écrasés.
- Les chemins de sortie à l’intérieur des arborescences d’état/source et d’espace de travail sont rejetés afin d’éviter l’auto-inclusion.
- `openclaw backup verify <archive>` vérifie que l’archive contient exactement un manifeste racine, rejette les chemins d’archive de type traversée de répertoires et vérifie que chaque charge utile déclarée dans le manifeste existe dans le tarball.
- `openclaw backup create --verify` exécute cette validation immédiatement après l’écriture de l’archive.
- `openclaw backup create --only-config` sauvegarde uniquement le fichier de configuration JSON actif.

## Ce qui est sauvegardé

`openclaw backup create` planifie les sources de sauvegarde à partir de votre installation OpenClaw locale :

- Le répertoire d’état renvoyé par le résolveur d’état local d’OpenClaw, généralement `~/.openclaw`
- Le chemin du fichier de configuration actif
- Le répertoire `credentials/` résolu lorsqu’il existe en dehors du répertoire d’état
- Les répertoires d’espace de travail découverts à partir de la configuration actuelle, sauf si vous passez `--no-include-workspace`

Les profils d’authentification de modèle font déjà partie du répertoire d’état sous
`agents/<agentId>/agent/auth-profiles.json`, ils sont donc normalement couverts par
l’entrée de sauvegarde de l’état.

Si vous utilisez `--only-config`, OpenClaw ignore la découverte de l’état, du répertoire d’identifiants et des espaces de travail, et archive uniquement le chemin du fichier de configuration actif.

OpenClaw canonicalise les chemins avant de construire l’archive. Si la configuration,
le répertoire d’identifiants ou un espace de travail se trouvent déjà dans le répertoire d’état,
ils ne sont pas dupliqués comme sources de sauvegarde de premier niveau séparées. Les chemins manquants sont
ignorés.

La charge utile de l’archive stocke le contenu des fichiers provenant de ces arborescences source, et le `manifest.json` intégré enregistre les chemins source absolus résolus ainsi que la disposition d’archive utilisée pour chaque ressource.

Pendant la création de l’archive, OpenClaw ignore les fichiers connus de mutation en direct qui n’ont pas de valeur de restauration, notamment les transcriptions de session d’agent actives, les journaux d’exécution Cron, les journaux tournants, les files de livraison, les fichiers de socket/pid/temp sous le répertoire d’état, ainsi que les fichiers temporaires de file durable associés. Le résultat JSON inclut `skippedVolatileCount` afin que l’automatisation puisse voir combien de fichiers ont été intentionnellement omis.

Les fichiers source et manifeste des plugins installés sous l’arborescence
`extensions/` du répertoire d’état sont inclus, mais leurs arborescences de dépendances
`node_modules/` imbriquées sont ignorées. Ces dépendances sont des artefacts d’installation reconstructibles ; après
la restauration d’une archive, utilisez `openclaw plugins update <id>` ou réinstallez le plugin
avec `openclaw plugins install <spec> --force` lorsqu’un plugin restauré signale
des dépendances manquantes.

## Comportement en cas de configuration invalide

`openclaw backup` contourne intentionnellement la vérification préalable normale de la configuration afin de pouvoir encore aider pendant la récupération. Comme la découverte des espaces de travail dépend d’une configuration valide, `openclaw backup create` échoue désormais rapidement lorsque le fichier de configuration existe mais qu’il est invalide et que la sauvegarde des espaces de travail est toujours activée.

Si vous voulez tout de même une sauvegarde partielle dans cette situation, relancez :

```bash
openclaw backup create --no-include-workspace
```

Cela garde l’état, la configuration et le répertoire d’identifiants externe dans le périmètre tout en
ignorant entièrement la découverte des espaces de travail.

Si vous avez seulement besoin d’une copie du fichier de configuration lui-même, `--only-config` fonctionne aussi lorsque la configuration est mal formée, car il ne s’appuie pas sur l’analyse de la configuration pour découvrir les espaces de travail.

## Taille et performances

OpenClaw n’impose pas de taille maximale de sauvegarde intégrée ni de limite de taille par fichier.

Les limites pratiques proviennent de la machine locale et du système de fichiers de destination :

- Espace disponible pour l’écriture temporaire de l’archive plus l’archive finale
- Temps nécessaire pour parcourir de grandes arborescences d’espace de travail et les compresser dans un `.tar.gz`
- Temps nécessaire pour réanalyser l’archive si vous utilisez `openclaw backup create --verify` ou exécutez `openclaw backup verify`
- Comportement du système de fichiers au chemin de destination. OpenClaw privilégie une étape de publication par lien matériel sans écrasement et se rabat sur une copie exclusive lorsque les liens matériels ne sont pas pris en charge

Les grands espaces de travail sont généralement le principal facteur de taille de l’archive. Si vous voulez une sauvegarde plus petite ou plus rapide, utilisez `--no-include-workspace`.

Pour l’archive la plus petite, utilisez `--only-config`.

## Associé

- [Référence CLI](/fr/cli)
