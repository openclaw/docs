---
read_when:
    - Modification de l’accès aux fichiers, de l’extraction d’archives, du stockage de l’espace de travail ou des utilitaires de système de fichiers des plugins
summary: Comment OpenClaw gère en toute sécurité l’accès aux fichiers locaux, et pourquoi l’utilitaire Python facultatif fs-safe est désactivé par défaut
title: Opérations sécurisées sur les fichiers
x-i18n:
    generated_at: "2026-07-12T15:23:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 5c8edf36ddbb8c8bc1edc52ecdf481affe5395d1779c679a40439167dfe70299
    source_path: gateway/security/secure-file-operations.md
    workflow: 16
---

OpenClaw utilise [`@openclaw/fs-safe`](https://github.com/openclaw/fs-safe) pour les opérations sensibles à la sécurité sur les fichiers locaux : lectures/écritures limitées à une racine, remplacement atomique, extraction d’archives, espaces de travail temporaires, état JSON et gestion des fichiers de secrets.

Il s’agit d’un **garde-fou de bibliothèque** destiné au code OpenClaw de confiance qui reçoit des noms de chemins non fiables, et non d’un bac à sable. Les autorisations du système de fichiers hôte, les utilisateurs du système d’exploitation, les conteneurs ainsi que la politique de l’agent et des outils définissent toujours le véritable rayon d’impact.

## Par défaut : aucun auxiliaire Python

OpenClaw désactive par défaut l’auxiliaire Python POSIX de fs-safe :

- le Gateway ne doit pas lancer de processus auxiliaire Python persistant sans activation explicite par un opérateur ;
- la plupart des installations n’ont pas besoin du renforcement supplémentaire contre la modification des répertoires parents ;
- la désactivation de Python garantit un comportement d’exécution prévisible dans les environnements de bureau, Docker, CI et d’applications intégrées.

OpenClaw modifie uniquement la _valeur par défaut_. Un paramètre explicite est toujours prioritaire :

```bash
# Comportement par défaut d’OpenClaw : solutions de repli fs-safe reposant uniquement sur Node.
OPENCLAW_FS_SAFE_PYTHON_MODE=off

# Activer l’auxiliaire lorsqu’il est disponible, avec repli s’il ne l’est pas.
OPENCLAW_FS_SAFE_PYTHON_MODE=auto

# Échouer de manière sécurisée si l’auxiliaire ne peut pas démarrer.
OPENCLAW_FS_SAFE_PYTHON_MODE=require

# Chemin explicite facultatif vers l’interpréteur.
OPENCLAW_FS_SAFE_PYTHON=/usr/bin/python3
```

Les noms génériques des variables d’environnement de fs-safe fonctionnent également : `FS_SAFE_PYTHON_MODE` et `FS_SAFE_PYTHON`.

Utilisez `require` (et non `auto`) lorsque l’auxiliaire fait partie de votre dispositif de sécurité ; `auto` revient silencieusement au comportement reposant uniquement sur Node si l’auxiliaire ne peut pas démarrer.

## Ce qui reste protégé sans Python

Lorsque l’auxiliaire est désactivé, OpenClaw bénéficie toujours des garde-fous de fs-safe reposant uniquement sur Node :

- rejette les sorties de chemin relatif (`..`), les chemins absolus et les séparateurs de chemin lorsque seuls des noms simples sont autorisés ;
- résout les opérations au moyen d’un descripteur de racine de confiance plutôt que de vérifications ponctuelles avec `path.resolve(...).startsWith(...)` ;
- refuse les schémas de liens symboliques et physiques pour les API qui imposent cette politique ;
- ouvre les fichiers en vérifiant leur identité lorsque l’API renvoie ou consomme leur contenu ;
- écrit les fichiers d’état et de configuration au moyen d’un fichier temporaire adjacent suivi d’un renommage atomique ;
- applique des limites d’octets aux lectures et à l’extraction d’archives ;
- applique des modes de fichier privés aux secrets et aux fichiers d’état lorsque l’API l’exige.

Cela couvre le modèle de menace normal d’OpenClaw : du code Gateway de confiance qui traite des chemins non fiables provenant de modèles, de plugins ou de canaux au sein d’un même périmètre d’opérateur de confiance.

## Ce qu’ajoute Python

Sur POSIX, l’auxiliaire facultatif maintient un processus Python persistant et utilise des opérations de système de fichiers relatives à des descripteurs de fichiers pour les modifications de répertoires parents : renommage, suppression, création de répertoires, obtention d’informations/listage et certains chemins d’écriture.

Cela réduit les fenêtres de conditions de concurrence pour un même UID dans lesquelles un autre processus remplace un répertoire parent entre la validation et la modification — une défense en profondeur sur les hôtes où des processus locaux non fiables peuvent modifier les mêmes répertoires que ceux dans lesquels OpenClaw intervient.

Si votre déploiement présente ce risque et que la présence de Python est garantie, définissez :

```bash
OPENCLAW_FS_SAFE_PYTHON_MODE=require
```

## Recommandations pour les plugins et le cœur

- L’accès aux fichiers exposé aux plugins doit passer par les assistants `openclaw/plugin-sdk/*`, et non directement par `fs`, lorsqu’un chemin provient d’un message, de la sortie d’un modèle, de la configuration ou d’une entrée de plugin.
- Le code du cœur doit utiliser les enveloppes fs-safe sous `src/infra/*` afin que la politique de processus d’OpenClaw s’applique de manière cohérente.
- L’extraction d’archives doit utiliser les assistants d’archive de fs-safe avec des limites explicites de taille, de nombre d’entrées, de liens et de destination.
- Les secrets doivent utiliser les assistants de secrets d’OpenClaw ou les assistants de secrets et d’état privé de fs-safe ; n’implémentez pas manuellement des vérifications de mode autour de `fs.writeFile`.
- Pour l’isolation contre des utilisateurs locaux hostiles, ne comptez pas uniquement sur fs-safe. Exécutez des Gateway distincts sous des utilisateurs du système d’exploitation ou sur des hôtes distincts, ou utilisez un bac à sable.

Voir aussi : [Sécurité](/fr/gateway/security), [Mise en bac à sable](/fr/gateway/sandboxing), [Approbations d’exécution](/fr/tools/exec-approvals), [Secrets](/fr/gateway/secrets).
