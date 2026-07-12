---
read_when:
    - Modification de l’accès aux fichiers, de l’extraction d’archives, du stockage de l’espace de travail ou des utilitaires de système de fichiers des plugins
summary: Comment OpenClaw gère en toute sécurité l’accès aux fichiers locaux et pourquoi l’utilitaire Python facultatif fs-safe est désactivé par défaut
title: Opérations sécurisées sur les fichiers
x-i18n:
    generated_at: "2026-07-12T02:53:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5c8edf36ddbb8c8bc1edc52ecdf481affe5395d1779c679a40439167dfe70299
    source_path: gateway/security/secure-file-operations.md
    workflow: 16
---

OpenClaw utilise [`@openclaw/fs-safe`](https://github.com/openclaw/fs-safe) pour les opérations locales sur les fichiers sensibles du point de vue de la sécurité : lectures/écritures limitées à une racine, remplacement atomique, extraction d’archives, espaces de travail temporaires, état JSON et gestion des fichiers de secrets.

Il s’agit d’un **garde-fou de bibliothèque** pour le code OpenClaw de confiance qui reçoit des noms de chemins non fiables, et non d’une sandbox. Les autorisations du système de fichiers hôte, les utilisateurs du système d’exploitation, les conteneurs ainsi que la politique des agents et des outils définissent toujours le véritable périmètre d’impact.

## Par défaut : aucun utilitaire Python

OpenClaw désactive par défaut l’utilitaire Python POSIX de fs-safe :

- le Gateway ne doit pas lancer de processus auxiliaire Python persistant sans activation explicite par un opérateur ;
- la plupart des installations n’ont pas besoin du renforcement supplémentaire des mutations de répertoires parents ;
- la désactivation de Python garantit un comportement d’exécution prévisible dans les environnements de bureau, Docker, CI et d’applications groupées.

OpenClaw ne modifie que la _valeur par défaut_. Un paramètre explicite prévaut toujours :

```bash
# Comportement OpenClaw par défaut : solutions de repli fs-safe reposant uniquement sur Node.
OPENCLAW_FS_SAFE_PYTHON_MODE=off

# Utiliser l’utilitaire lorsqu’il est disponible, avec repli s’il ne l’est pas.
OPENCLAW_FS_SAFE_PYTHON_MODE=auto

# Échouer de manière sécurisée si l’utilitaire ne peut pas démarrer.
OPENCLAW_FS_SAFE_PYTHON_MODE=require

# Chemin explicite facultatif de l’interpréteur.
OPENCLAW_FS_SAFE_PYTHON=/usr/bin/python3
```

Les noms génériques de variables d’environnement fs-safe fonctionnent également : `FS_SAFE_PYTHON_MODE` et `FS_SAFE_PYTHON`.

Utilisez `require` (et non `auto`) lorsque l’utilitaire fait partie de votre dispositif de sécurité ; `auto` revient silencieusement au comportement reposant uniquement sur Node si l’utilitaire ne peut pas démarrer.

## Protections maintenues sans Python

Lorsque l’utilitaire est désactivé, OpenClaw bénéficie toujours des garde-fous de fs-safe reposant uniquement sur Node :

- rejet des échappements hors du chemin relatif (`..`), des chemins absolus et des séparateurs de chemin lorsque seuls des noms simples sont autorisés ;
- résolution des opérations par l’intermédiaire d’un descripteur de racine de confiance plutôt que par des vérifications ponctuelles de type `path.resolve(...).startsWith(...)` ;
- refus des modèles de liens symboliques et de liens physiques pour les API qui imposent cette politique ;
- ouverture des fichiers avec vérification d’identité lorsque l’API renvoie ou consomme leur contenu ;
- écriture des fichiers d’état et de configuration au moyen d’un fichier temporaire adjacent et d’un renommage atomique ;
- application de limites en octets aux lectures et à l’extraction d’archives ;
- application de modes de fichier privés aux secrets et aux fichiers d’état lorsque l’API l’exige.

Cela couvre le modèle de menace habituel d’OpenClaw : du code Gateway de confiance qui traite des chemins non fiables provenant du modèle, d’un Plugin ou d’un canal au sein d’une même frontière de confiance contrôlée par l’opérateur.

## Apports de Python

Sous POSIX, l’utilitaire facultatif maintient un processus Python persistant et utilise des opérations de système de fichiers relatives à des descripteurs de fichiers pour les mutations des répertoires parents : renommage, suppression, création de répertoire, obtention d’informations ou listage, ainsi que certains chemins d’écriture.

Cela réduit les fenêtres de concurrence entre processus de même UID pendant lesquelles un autre processus peut remplacer un répertoire parent entre sa validation et sa mutation — une défense en profondeur sur les hôtes où des processus locaux non fiables peuvent modifier les mêmes répertoires qu’OpenClaw.

Si votre déploiement présente ce risque et que la présence de Python est garantie, définissez :

```bash
OPENCLAW_FS_SAFE_PYTHON_MODE=require
```

## Recommandations pour les Plugins et le cœur

- Lorsqu’un chemin provient d’un message, d’une sortie de modèle, d’une configuration ou d’une entrée de Plugin, l’accès aux fichiers côté Plugin doit passer par les utilitaires `openclaw/plugin-sdk/*`, et non directement par `fs`.
- Le code du cœur doit utiliser les enveloppes fs-safe sous `src/infra/*` afin que la politique de processus d’OpenClaw s’applique de façon cohérente.
- L’extraction d’archives doit utiliser les utilitaires d’archive fs-safe avec des limites explicites de taille, de nombre d’entrées, de liens et de destination.
- Les secrets doivent utiliser les utilitaires de secrets OpenClaw ou les utilitaires fs-safe pour les secrets et les états privés ; n’implémentez pas manuellement de vérifications de mode autour de `fs.writeFile`.
- Pour l’isolation vis-à-vis d’utilisateurs locaux hostiles, ne vous reposez pas uniquement sur fs-safe. Exécutez des Gateway distincts sous des utilisateurs du système d’exploitation ou sur des hôtes distincts, ou utilisez une sandbox.

Voir aussi : [Sécurité](/fr/gateway/security), [Mise en sandbox](/fr/gateway/sandboxing), [Approbations d’exécution](/fr/tools/exec-approvals), [Secrets](/fr/gateway/secrets).
