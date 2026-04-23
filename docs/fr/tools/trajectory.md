---
read_when:
    - Débogage pour comprendre pourquoi un agent a répondu, échoué ou appelé des outils d’une certaine manière
    - Export d’un bundle de support pour une session OpenClaw
    - Investigation du contexte de prompt, des appels d’outils, des erreurs runtime ou des métadonnées d’usage
    - Désactivation ou déplacement de la capture de trajectoire
summary: Exporter des bundles de trajectoire expurgés pour déboguer une session agent OpenClaw
title: Bundles de trajectoire
x-i18n:
    generated_at: "2026-04-23T07:12:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 18f18c9b0a57fcc85624ae8592778447f61ffbd2aa455f8f92893955af744b23
    source_path: tools/trajectory.md
    workflow: 15
---

# Bundles de trajectoire

La capture de trajectoire est l’enregistreur de vol par session d’OpenClaw. Elle enregistre une
chronologie structurée pour chaque exécution d’agent, puis `/export-trajectory` empaquette la
session courante dans un bundle de support expurgé.

Utilisez-la lorsque vous devez répondre à des questions comme :

- Quel prompt, prompt système et quels outils ont été envoyés au modèle ?
- Quels messages de transcription et appels d’outils ont conduit à cette réponse ?
- L’exécution a-t-elle expiré, été abandonnée, compactée ou rencontré une erreur fournisseur ?
- Quels modèle, Plugins, Skills et paramètres runtime étaient actifs ?
- Quelles métadonnées d’usage et de cache de prompt le fournisseur a-t-il renvoyées ?

## Démarrage rapide

Envoyez ceci dans la session active :

```text
/export-trajectory
```

Alias :

```text
/trajectory
```

OpenClaw écrit le bundle dans l’espace de travail :

```text
.openclaw/trajectory-exports/openclaw-trajectory-<session>-<timestamp>/
```

Vous pouvez choisir un nom de répertoire de sortie relatif :

```text
/export-trajectory bug-1234
```

Le chemin personnalisé est résolu dans `.openclaw/trajectory-exports/`. Les
chemins absolus et les chemins `~` sont rejetés.

## Accès

L’export de trajectoire est une commande propriétaire. L’expéditeur doit passer les vérifications normales
d’autorisation de commande et les vérifications de propriétaire pour le canal.

## Ce qui est enregistré

La capture de trajectoire est activée par défaut pour les exécutions d’agent OpenClaw.

Les événements runtime incluent :

- `session.started`
- `trace.metadata`
- `context.compiled`
- `prompt.submitted`
- `model.completed`
- `trace.artifacts`
- `session.ended`

Les événements de transcription sont aussi reconstruits depuis la branche de session active :

- messages utilisateur
- messages assistant
- appels d’outils
- résultats d’outils
- Compactions
- changements de modèle
- labels et entrées de session personnalisées

Les événements sont écrits en JSON Lines avec ce marqueur de schéma :

```json
{
  "traceSchema": "openclaw-trajectory",
  "schemaVersion": 1
}
```

## Fichiers du bundle

Un bundle exporté peut contenir :

| Fichier               | Contenu                                                                                       |
| --------------------- | --------------------------------------------------------------------------------------------- |
| `manifest.json`       | Schéma du bundle, fichiers source, nombre d’événements et liste des fichiers générés         |
| `events.jsonl`        | Chronologie ordonnée runtime et transcription                                                 |
| `session-branch.json` | Branche active de transcription expurgée et en-tête de session                               |
| `metadata.json`       | Version OpenClaw, OS/runtime, modèle, instantané de configuration, Plugins, Skills et métadonnées de prompt |
| `artifacts.json`      | Statut final, erreurs, usage, cache de prompt, nombre de Compactions, texte assistant et métadonnées d’outils |
| `prompts.json`        | Prompts soumis et détails sélectionnés de construction de prompt                              |
| `system-prompt.txt`   | Dernier prompt système compilé, lorsqu’il est capturé                                         |
| `tools.json`          | Définitions d’outils envoyées au modèle, lorsqu’elles sont capturées                         |

`manifest.json` liste les fichiers présents dans ce bundle. Certains fichiers sont omis
lorsque la session n’a pas capturé les données runtime correspondantes.

## Emplacement de capture

Par défaut, les événements runtime de trajectoire sont écrits à côté du fichier de session :

```text
<session>.trajectory.jsonl
```

OpenClaw écrit aussi un fichier pointeur en best-effort à côté de la session :

```text
<session>.trajectory-path.json
```

Définissez `OPENCLAW_TRAJECTORY_DIR` pour stocker les fichiers annexes runtime de trajectoire dans un
répertoire dédié :

```bash
export OPENCLAW_TRAJECTORY_DIR=/var/lib/openclaw/trajectories
```

Lorsque cette variable est définie, OpenClaw écrit un fichier JSONL par identifiant de session dans ce
répertoire.

## Désactiver la capture

Définissez `OPENCLAW_TRAJECTORY=0` avant de démarrer OpenClaw :

```bash
export OPENCLAW_TRAJECTORY=0
```

Cela désactive la capture runtime de trajectoire. `/export-trajectory` peut toujours exporter
la branche de transcription, mais les fichiers uniquement runtime tels que le contexte compilé,
les artefacts fournisseur et les métadonnées de prompt peuvent manquer.

## Confidentialité et limites

Les bundles de trajectoire sont conçus pour le support et le débogage, pas pour une publication publique.
OpenClaw expurge les valeurs sensibles avant d’écrire les fichiers d’export :

- identifiants et champs de charge utile connus ressemblant à des secrets
- données d’image
- chemins d’état local
- chemins d’espace de travail, remplacés par `$WORKSPACE_DIR`
- chemins de répertoire personnel, lorsqu’ils sont détectés

L’exporteur borne aussi la taille des entrées :

- fichiers annexes runtime : 50 MiB
- fichiers de session : 50 MiB
- événements runtime : 200 000
- total des événements exportés : 250 000
- les lignes individuelles d’événement runtime sont tronquées au-delà de 256 KiB

Relisez les bundles avant de les partager en dehors de votre équipe. L’expurgation est faite en best-effort
et ne peut pas connaître tous les secrets spécifiques à votre application.

## Dépannage

Si l’export ne contient aucun événement runtime :

- confirmez qu’OpenClaw a été démarré sans `OPENCLAW_TRAJECTORY=0`
- vérifiez si `OPENCLAW_TRAJECTORY_DIR` pointe vers un répertoire accessible en écriture
- exécutez un autre message dans la session, puis exportez à nouveau
- inspectez `manifest.json` pour `runtimeEventCount`

Si la commande rejette le chemin de sortie :

- utilisez un nom relatif comme `bug-1234`
- ne passez pas `/tmp/...` ou `~/...`
- gardez l’export dans `.openclaw/trajectory-exports/`

Si l’export échoue avec une erreur de taille, la session ou le fichier annexe a dépassé les
limites de sécurité de l’export. Démarrez une nouvelle session ou exportez une reproduction plus petite.
