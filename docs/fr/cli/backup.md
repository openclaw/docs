---
read_when:
    - Vous voulez une archive de sauvegarde de premier ordre pour l’état local d’OpenClaw
    - Vous voulez prévisualiser les chemins qui seraient inclus avant de réinitialiser ou de désinstaller
summary: Référence CLI pour `openclaw backup` (créer des archives de sauvegarde locales)
title: Sauvegarde
x-i18n:
    generated_at: "2026-04-30T07:16:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5c16f953bb32a1613181448f0e4c6ba8777383bce95bddc856dc7e1c3afe8550
    source_path: cli/backup.md
    workflow: 16
---

# `openclaw backup`

Créez une archive de sauvegarde locale pour l’état OpenClaw, la config, les profils d’authentification, les identifiants de canaux/fournisseurs, les sessions et, facultativement, les espaces de travail.

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

- L’archive inclut un fichier `manifest.json` avec les chemins source résolus et l’organisation de l’archive.
- La sortie par défaut est une archive `.tar.gz` horodatée dans le répertoire de travail actuel.
- Si le répertoire de travail actuel se trouve dans une arborescence source sauvegardée, OpenClaw utilise votre répertoire personnel comme emplacement d’archive par défaut.
- Les fichiers d’archive existants ne sont jamais écrasés.
- Les chemins de sortie situés dans les arborescences d’état/source ou d’espace de travail sont rejetés afin d’éviter l’auto-inclusion.
- `openclaw backup verify <archive>` valide que l’archive contient exactement un manifest racine, rejette les chemins d’archive de type traversée de répertoire, et vérifie que chaque charge utile déclarée dans le manifest existe dans le tarball.
- `openclaw backup create --verify` exécute cette validation immédiatement après l’écriture de l’archive.
- `openclaw backup create --only-config` sauvegarde uniquement le fichier de config JSON actif.

## Ce qui est sauvegardé

`openclaw backup create` planifie les sources de sauvegarde depuis votre installation locale d’OpenClaw :

- Le répertoire d’état renvoyé par le résolveur d’état local d’OpenClaw, généralement `~/.openclaw`
- Le chemin du fichier de config actif
- Le répertoire `credentials/` résolu lorsqu’il existe en dehors du répertoire d’état
- Les répertoires d’espace de travail découverts à partir de la config actuelle, sauf si vous passez `--no-include-workspace`

Les profils d’authentification des modèles font déjà partie du répertoire d’état sous
`agents/<agentId>/agent/auth-profiles.json`; ils sont donc normalement couverts par l’entrée de sauvegarde
de l’état.

Si vous utilisez `--only-config`, OpenClaw ignore la découverte de l’état, du répertoire d’identifiants et des espaces de travail, et archive uniquement le chemin du fichier de config actif.

OpenClaw canonicalise les chemins avant de construire l’archive. Si la config, le
répertoire d’identifiants ou un espace de travail se trouvent déjà dans le répertoire d’état,
ils ne sont pas dupliqués comme sources de sauvegarde de premier niveau distinctes. Les chemins manquants sont
ignorés.

La charge utile de l’archive stocke le contenu des fichiers issus de ces arborescences source, et le `manifest.json` intégré enregistre les chemins source absolus résolus ainsi que l’organisation d’archive utilisée pour chaque ressource.

Les fichiers source et manifest de Plugins installés sous l’arborescence
`extensions/` du répertoire d’état sont inclus, mais leurs arborescences de dépendances
`node_modules/` imbriquées sont ignorées. Ces dépendances sont des artefacts d’installation reconstruisibles ; après
la restauration d’une archive, utilisez `openclaw plugins update <id>` ou réinstallez le Plugin
avec `openclaw plugins install <spec> --force` lorsqu’un Plugin restauré signale
des dépendances manquantes.

## Comportement avec une config invalide

`openclaw backup` contourne intentionnellement le précontrôle normal de la config afin de rester utile pendant la récupération. Comme la découverte des espaces de travail dépend d’une config valide, `openclaw backup create` échoue désormais rapidement lorsque le fichier de config existe mais est invalide et que la sauvegarde des espaces de travail reste activée.

Si vous voulez tout de même une sauvegarde partielle dans cette situation, relancez :

```bash
openclaw backup create --no-include-workspace
```

Cela conserve l’état, la config et le répertoire d’identifiants externe dans le périmètre tout en
ignorant entièrement la découverte des espaces de travail.

Si vous avez seulement besoin d’une copie du fichier de config lui-même, `--only-config` fonctionne aussi lorsque la config est mal formée, car il ne dépend pas de l’analyse de la config pour la découverte des espaces de travail.

## Taille et performances

OpenClaw n’applique pas de taille maximale intégrée pour les sauvegardes ni de limite de taille par fichier.

Les limites pratiques viennent de la machine locale et du système de fichiers de destination :

- L’espace disponible pour l’écriture de l’archive temporaire plus l’archive finale
- Le temps nécessaire pour parcourir de grandes arborescences d’espaces de travail et les compresser dans une `.tar.gz`
- Le temps nécessaire pour réanalyser l’archive si vous utilisez `openclaw backup create --verify` ou exécutez `openclaw backup verify`
- Le comportement du système de fichiers au chemin de destination. OpenClaw privilégie une étape de publication par lien physique sans écrasement et revient à une copie exclusive lorsque les liens physiques ne sont pas pris en charge

Les grands espaces de travail sont généralement le principal facteur de taille de l’archive. Si vous voulez une sauvegarde plus petite ou plus rapide, utilisez `--no-include-workspace`.

Pour l’archive la plus petite, utilisez `--only-config`.

## Connexe

- [Référence CLI](/fr/cli)
