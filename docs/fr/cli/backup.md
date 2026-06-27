---
read_when:
    - Vous voulez une archive de sauvegarde de première classe pour l’état local d’OpenClaw
    - Vous voulez prévisualiser les chemins qui seraient inclus avant une réinitialisation ou une désinstallation
summary: Référence CLI pour `openclaw backup` (créer des archives de sauvegarde locales)
title: Sauvegarde
x-i18n:
    generated_at: "2026-06-27T17:17:29Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1ac7d8e4babd24f1c46ac48dca6c413e12361173df83cfe485dd3945ccd30c3e
    source_path: cli/backup.md
    workflow: 16
---

# `openclaw backup`

Créer une archive de sauvegarde locale pour l’état, la configuration, les profils d’authentification, les identifiants de canaux/fournisseurs, les sessions et, éventuellement, les espaces de travail d’OpenClaw.

```bash
openclaw backup create
openclaw backup create --output ~/Backups
openclaw backup create --dry-run --json
openclaw backup create --verify
openclaw backup create --no-include-workspace
openclaw backup create --only-config
openclaw backup verify ./2026-03-09T08-00-00.000+08-00-openclaw-backup.tar.gz
```

## Notes

- L’archive inclut un fichier `manifest.json` avec les chemins source résolus et l’agencement de l’archive.
- La sortie par défaut est une archive `.tar.gz` horodatée dans le répertoire de travail actuel.
- Les noms de fichiers de sauvegarde horodatés utilisent le fuseau horaire local de votre machine et incluent le décalage UTC.
- Si le répertoire de travail actuel se trouve dans une arborescence source sauvegardée, OpenClaw utilise à la place votre répertoire personnel comme emplacement d’archive par défaut.
- Les fichiers d’archive existants ne sont jamais écrasés.
- Les chemins de sortie situés dans les arborescences d’état/d’espace de travail source sont refusés afin d’éviter une auto-inclusion.
- `openclaw backup verify <archive>` vérifie que l’archive contient exactement un manifeste racine, refuse les chemins d’archive de type traversée de répertoires et vérifie que chaque charge utile déclarée dans le manifeste existe dans le tarball.
- `openclaw backup create --verify` exécute cette validation immédiatement après l’écriture de l’archive.
- `openclaw backup create --only-config` sauvegarde uniquement le fichier de configuration JSON actif.

## Ce qui est sauvegardé

`openclaw backup create` planifie les sources de sauvegarde depuis votre installation OpenClaw locale :

- Le répertoire d’état renvoyé par le résolveur d’état local d’OpenClaw, généralement `~/.openclaw`
- Le chemin du fichier de configuration actif
- Le répertoire `credentials/` résolu lorsqu’il existe en dehors du répertoire d’état
- Les répertoires d’espaces de travail découverts depuis la configuration actuelle, sauf si vous passez `--no-include-workspace`

Les profils d’authentification de modèles font déjà partie du répertoire d’état sous
`agents/<agentId>/agent/auth-profiles.json` ; ils sont donc normalement couverts par l’entrée de sauvegarde de l’état.

Si vous utilisez `--only-config`, OpenClaw ignore la découverte de l’état, du répertoire des identifiants et des espaces de travail, et archive uniquement le chemin du fichier de configuration actif.

OpenClaw canonicalise les chemins avant de créer l’archive. Si la configuration, le
répertoire des identifiants ou un espace de travail se trouvent déjà dans le répertoire d’état,
ils ne sont pas dupliqués comme sources de sauvegarde de premier niveau distinctes. Les chemins manquants sont
ignorés.

La charge utile de l’archive stocke le contenu des fichiers provenant de ces arborescences source, et le `manifest.json` intégré enregistre les chemins source absolus résolus ainsi que l’agencement d’archive utilisé pour chaque ressource.

Pendant la création de l’archive, OpenClaw ignore les fichiers connus comme mutés en direct qui n’ont pas de valeur de restauration, notamment les transcriptions de sessions d’agents actives, les journaux d’exécutions Cron, les journaux tournants, les files de livraison, les fichiers socket/pid/temp sous le répertoire d’état, ainsi que les fichiers temporaires associés aux files durables. Le résultat JSON inclut `skippedVolatileCount` afin que l’automatisation puisse voir combien de fichiers ont été intentionnellement omis.

Les fichiers source et manifestes des Plugins installés sous l’arborescence
`extensions/` du répertoire d’état sont inclus, mais leurs arborescences de dépendances `node_modules/`
imbriquées sont ignorées. Ces dépendances sont des artefacts d’installation reconstruisibles ; après
la restauration d’une archive, utilisez `openclaw plugins update <id>` ou réinstallez le Plugin
avec `openclaw plugins install <spec> --force` lorsqu’un Plugin restauré signale
des dépendances manquantes.

## Comportement en cas de configuration invalide

`openclaw backup` contourne intentionnellement le précontrôle normal de configuration afin de rester utile lors d’une récupération. Comme la découverte des espaces de travail dépend d’une configuration valide, `openclaw backup create` échoue désormais rapidement lorsque le fichier de configuration existe mais qu’il est invalide et que la sauvegarde des espaces de travail est toujours activée.

Si vous voulez tout de même une sauvegarde partielle dans cette situation, relancez :

```bash
openclaw backup create --no-include-workspace
```

Cela conserve l’état, la configuration et le répertoire externe des identifiants dans le périmètre, tout en
ignorant entièrement la découverte des espaces de travail.

Si vous avez seulement besoin d’une copie du fichier de configuration lui-même, `--only-config` fonctionne aussi lorsque la configuration est mal formée, car il ne dépend pas de l’analyse de la configuration pour la découverte des espaces de travail.

## Taille et performances

OpenClaw n’applique pas de taille maximale intégrée pour les sauvegardes ni de limite de taille par fichier.

Les limites pratiques viennent de la machine locale et du système de fichiers de destination :

- L’espace disponible pour l’écriture de l’archive temporaire plus l’archive finale
- Le temps nécessaire pour parcourir de grandes arborescences d’espaces de travail et les compresser dans un `.tar.gz`
- Le temps nécessaire pour rescanner l’archive si vous utilisez `openclaw backup create --verify` ou exécutez `openclaw backup verify`
- Le comportement du système de fichiers au chemin de destination. OpenClaw privilégie une étape de publication par lien physique sans écrasement et se rabat sur une copie exclusive lorsque les liens physiques ne sont pas pris en charge

Les grands espaces de travail sont généralement le principal facteur de taille d’archive. Si vous voulez une sauvegarde plus petite ou plus rapide, utilisez `--no-include-workspace`.

Pour l’archive la plus petite, utilisez `--only-config`.

## Associé

- [Référence CLI](/fr/cli)
