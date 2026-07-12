---
read_when:
    - Vous souhaitez une archive de sauvegarde pleinement intégrée pour l’état local d’OpenClaw
    - Vous souhaitez prévisualiser les chemins qui seraient inclus avant la réinitialisation ou la désinstallation
summary: Référence de la CLI pour `openclaw backup` (créer des archives de sauvegarde locales)
title: Sauvegarde
x-i18n:
    generated_at: "2026-07-12T15:06:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: b40206e74b43edd6c1d2b00de3cbe9fcfa053bfbb2ffdff0323fb8c1671c28ea
    source_path: cli/backup.md
    workflow: 16
---

# `openclaw backup`

Créez une archive de sauvegarde locale pour l’état d’OpenClaw, sa configuration, ses profils d’authentification, les identifiants des canaux et fournisseurs, les sessions et, facultativement, les espaces de travail.

```bash
openclaw backup create
openclaw backup create --output ~/Backups
openclaw backup create --dry-run --json
openclaw backup create --verify
openclaw backup create --no-include-workspace
openclaw backup create --only-config
openclaw backup verify ./2026-03-09T08-00-00.000+08-00-openclaw-backup.tar.gz
```

## Remarques

- L’archive contient un fichier `manifest.json` avec les chemins sources résolus et la structure de l’archive.
- Par défaut, la sortie est une archive `.tar.gz` horodatée dans le répertoire de travail actuel. Les noms de fichiers horodatés utilisent le fuseau horaire local de votre machine et incluent le décalage UTC. Si le répertoire de travail actuel se trouve dans une arborescence source sauvegardée, OpenClaw utilise votre répertoire personnel comme emplacement par défaut de l’archive.
- Les fichiers d’archive existants ne sont jamais écrasés. Les chemins de sortie situés dans les arborescences sources d’état ou d’espace de travail sont refusés afin d’éviter l’auto-inclusion.
- `openclaw backup verify <archive>` vérifie que l’archive contient exactement un manifeste racine, refuse les chemins d’archive de type traversée et les fichiers annexes SQLite, confirme l’existence de chaque charge utile déclarée dans le manifeste, valide la structure de fichier de chaque instantané SQLite et exécute des contrôles complets d’intégrité et de rôle sur les bases de données OpenClaw canoniques. Les schémas dédiés aux plugins restent opaques, car ils peuvent nécessiter des fonctionnalités SQLite définies par leur propriétaire. `openclaw backup create --verify` exécute cette validation immédiatement après l’écriture de l’archive.
- `openclaw backup create --only-config` sauvegarde uniquement le fichier de configuration JSON actif.

## Éléments sauvegardés

`openclaw backup create` détermine les sources à partir de votre installation locale d’OpenClaw :

- Le répertoire d’état (généralement `~/.openclaw`)
- Le chemin du fichier de configuration actif
- Le répertoire `credentials/` résolu lorsqu’il se trouve en dehors du répertoire d’état
- Les répertoires d’espace de travail découverts à partir de la configuration actuelle, sauf si vous utilisez `--no-include-workspace`

Les profils d’authentification et les autres états d’exécution propres à chaque agent sont stockés dans SQLite sous le répertoire d’état (`agents/<agentId>/agent/openclaw-agent.sqlite`) ; ils sont donc automatiquement couverts par l’entrée de sauvegarde de l’état.

`--only-config` ignore la découverte de l’état, du répertoire des identifiants et des espaces de travail, et archive uniquement le chemin du fichier de configuration actif.

OpenClaw canonicalise les chemins avant de créer l’archive : si la configuration, le répertoire des identifiants ou un espace de travail se trouvent déjà dans le répertoire d’état, ils ne sont pas dupliqués en tant que sources de sauvegarde de premier niveau distinctes. Les chemins manquants sont ignorés.

Pendant la création de l’archive, OpenClaw ignore les fichiers connus qui sont modifiés en direct et n’ont aucune utilité pour la restauration : transcriptions des sessions d’agent actives, journaux d’exécution Cron, journaux tournants, files d’attente de livraison, fichiers de socket, PID et temporaires sous le répertoire d’état, ainsi que les fichiers temporaires associés aux files d’attente persistantes. La propriété `skippedVolatileCount` du résultat JSON indique le nombre de fichiers volontairement omis. Les bases de données SQLite situées sous le répertoire d’état sont compactées avec `VACUUM INTO` afin que les résidus de pages supprimées ne soient pas intégrés à l’archive, et les fichiers WAL/SHM actifs ne sont pas copiés. Une base de données appartenant à un plugin et nécessitant des fonctionnalités SQLite définies par son propriétaire mais indisponibles échoue de manière sécurisée au lieu de recourir à une copie brute des pages. Les fichiers SQLite inclus par l’intermédiaire des sauvegardes d’espaces de travail sont copiés comme fichiers d’espace de travail et ne bénéficient pas de la garantie de compaction.

Les fichiers sources et manifestes des plugins installés sous l’arborescence `extensions/` du répertoire d’état sont inclus, mais leurs arborescences de dépendances `node_modules/` imbriquées sont ignorées, car il s’agit d’artefacts d’installation pouvant être recréés. Après la restauration d’une archive, utilisez `openclaw plugins update <id>` ou réinstallez le plugin avec `openclaw plugins install <spec> --force` si un plugin restauré signale des dépendances manquantes.

## Comportement en cas de configuration non valide

`openclaw backup` contourne la vérification préalable habituelle de la configuration afin de rester utilisable pendant une récupération. La découverte des espaces de travail dépend d’une configuration valide ; `openclaw backup create` échoue donc immédiatement si le fichier de configuration existe mais n’est pas valide et que la sauvegarde des espaces de travail reste activée.

Pour effectuer une sauvegarde partielle dans cette situation, relancez la commande avec `--no-include-workspace` : l’état, la configuration et le répertoire externe des identifiants restent inclus, tandis que la découverte des espaces de travail est entièrement ignorée.

`--only-config` fonctionne également lorsque la configuration est mal formée, puisqu’il ne l’analyse pas pour découvrir les espaces de travail.

## Taille et performances

OpenClaw n’impose aucune taille maximale intégrée pour les sauvegardes ni aucune limite de taille par fichier. Les limites pratiques dépendent des éléments suivants :

- L’espace disponible pour l’écriture de l’archive temporaire et de l’archive finale
- Le temps nécessaire pour parcourir de grandes arborescences d’espaces de travail et les compresser dans un fichier `.tar.gz`
- Le temps nécessaire pour analyser de nouveau l’archive avec `--verify` ou `openclaw backup verify`
- Le comportement du système de fichiers de destination : OpenClaw privilégie une étape de publication par lien physique sans écrasement et revient à une copie exclusive lorsque les liens physiques ne sont pas pris en charge

Les grands espaces de travail sont généralement le principal facteur déterminant la taille de l’archive. Utilisez `--no-include-workspace` pour obtenir une sauvegarde plus petite et plus rapide, ou `--only-config` pour produire l’archive la plus petite possible.

## Voir aussi

- [Référence de la CLI](/fr/cli)
