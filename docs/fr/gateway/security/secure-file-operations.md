---
read_when:
    - Modification de l’accès aux fichiers, de l’extraction d’archives, du stockage de l’espace de travail ou des assistants de système de fichiers Plugin
summary: Comment OpenClaw gère l’accès aux fichiers locaux en toute sécurité, et pourquoi l’assistant Python facultatif fs-safe est désactivé par défaut
title: Opérations sécurisées sur les fichiers
x-i18n:
    generated_at: "2026-05-06T07:25:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 19d5b31ec2f2c7ab1033bdb55a701c60468dfac58142f726ecbc9ac933f68e30
    source_path: gateway/security/secure-file-operations.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw utilise [`@openclaw/fs-safe`](https://github.com/openclaw/fs-safe) pour les opérations locales sur les fichiers sensibles à la sécurité : lectures/écritures bornées à une racine, remplacement atomique, extraction d’archives, espaces de travail temporaires, état JSON et gestion des fichiers secrets.

L’objectif est un **garde-fou de bibliothèque** cohérent pour le code OpenClaw de confiance qui reçoit des noms de chemins non fiables. Ce n’est pas un bac à sable. Les permissions du système de fichiers hôte, les utilisateurs du système d’exploitation, les conteneurs et la politique agent/outil définissent toujours le véritable périmètre d’impact.

## Par défaut : aucun assistant Python

OpenClaw désactive par défaut l’assistant Python POSIX de fs-safe.

Pourquoi :

- le Gateway ne doit pas lancer de processus Python auxiliaire persistant sauf si un opérateur l’a explicitement choisi ;
- de nombreuses installations n’ont pas besoin du durcissement supplémentaire contre les mutations de répertoires parents ;
- désactiver Python rend le comportement du paquet/runtime plus prévisible entre les environnements de bureau, Docker, CI et applications groupées.

OpenClaw ne change que la valeur par défaut. Si vous définissez explicitement un mode, fs-safe le respecte :

```bash
# Default OpenClaw behavior: Node-only fs-safe fallbacks.
OPENCLAW_FS_SAFE_PYTHON_MODE=off

# Opt into the helper when available, falling back if unavailable.
OPENCLAW_FS_SAFE_PYTHON_MODE=auto

# Fail closed if the helper cannot start.
OPENCLAW_FS_SAFE_PYTHON_MODE=require

# Optional explicit interpreter.
OPENCLAW_FS_SAFE_PYTHON=/usr/bin/python3
```

Les noms génériques de fs-safe fonctionnent aussi : `FS_SAFE_PYTHON_MODE` et `FS_SAFE_PYTHON`.

## Ce qui reste protégé sans Python

Avec l’assistant désactivé, OpenClaw utilise toujours les chemins d’exécution Node de fs-safe pour :

- rejeter les échappements de chemins relatifs comme `..`, les chemins absolus et les séparateurs de chemin là où seuls des noms sont autorisés ;
- résoudre les opérations via un descripteur de racine fiable au lieu de vérifications ad hoc `path.resolve(...).startsWith(...)` ;
- refuser les modèles de liens symboliques et de liens physiques sur les API qui exigent cette politique ;
- ouvrir les fichiers avec des vérifications d’identité lorsque l’API renvoie ou consomme le contenu des fichiers ;
- effectuer des écritures atomiques dans un fichier temporaire frère pour les fichiers d’état/configuration ;
- appliquer des limites d’octets pour les lectures et l’extraction d’archives ;
- appliquer des modes privés pour les secrets et les fichiers d’état lorsque l’API les exige.

Ces protections couvrent le modèle de menace normal d’OpenClaw : du code Gateway fiable traitant des entrées de chemins non fiables provenant du modèle, d’un Plugin ou d’un canal, dans une limite opérateur unique et fiable.

## Ce que Python ajoute

Sur POSIX, l’assistant facultatif de fs-safe conserve un processus Python persistant et utilise des opérations de système de fichiers relatives à des descripteurs de fichiers pour les mutations de répertoires parents comme le renommage, la suppression, mkdir, stat/list et certains chemins d’écriture.

Cela réduit les fenêtres de course même UID où un autre processus peut remplacer un répertoire parent entre la validation et la mutation. C’est une défense en profondeur pour les hôtes où des processus locaux non fiables peuvent modifier les mêmes répertoires dans lesquels OpenClaw opère.

Si votre déploiement présente ce risque et que Python est garanti disponible, utilisez :

```bash
OPENCLAW_FS_SAFE_PYTHON_MODE=require
```

Utilisez `require` plutôt que `auto` lorsque l’assistant fait partie de votre posture de sécurité ; `auto` revient intentionnellement au comportement Node uniquement si l’assistant est indisponible.

## Conseils pour Plugin et le cœur

- L’accès aux fichiers exposé aux Plugins doit passer par les assistants `openclaw/plugin-sdk/*`, et non par `fs` directement, lorsqu’un chemin provient d’un message, d’une sortie de modèle, d’une configuration ou d’une entrée de Plugin.
- Le code du cœur doit utiliser les wrappers fs-safe locaux sous `src/infra/*` afin que la politique de processus d’OpenClaw soit appliquée de manière cohérente.
- L’extraction d’archives doit utiliser les assistants d’archives fs-safe avec des limites explicites de taille, de nombre d’entrées, de liens et de destination.
- Les secrets doivent utiliser les assistants de secrets d’OpenClaw ou les assistants de secrets/état privé de fs-safe ; ne réimplémentez pas manuellement les vérifications de mode autour de `fs.writeFile`.
- Si vous avez besoin d’une isolation contre des utilisateurs locaux hostiles, ne vous appuyez pas uniquement sur fs-safe. Exécutez des gateways séparés sous des utilisateurs/hôtes de système d’exploitation distincts ou utilisez un bac à sable.

Connexe : [Sécurité](/fr/gateway/security), [Bac à sable](/fr/gateway/sandboxing), [Approbations d’exécution](/fr/tools/exec-approvals), [Secrets](/fr/gateway/secrets).
