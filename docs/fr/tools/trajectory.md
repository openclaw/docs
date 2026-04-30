---
read_when:
    - Débogage des raisons pour lesquelles un agent a répondu, échoué ou appelé des outils d’une certaine manière
    - Exporter un paquet d’assistance pour une session OpenClaw
    - Analyse du contexte de prompt, des appels d’outils, des erreurs d’exécution ou des métadonnées d’utilisation
    - Désactivation ou déplacement de la capture de trajectoire
summary: Exporter des paquets de trajectoire expurgés pour déboguer une session d’agent OpenClaw
title: Ensembles de trajectoires
x-i18n:
    generated_at: "2026-04-30T07:53:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8dad01b3662d5e75b7626eb7ed3c3ac2dce4e3a7db2ba5952d7086c721151d1f
    source_path: tools/trajectory.md
    workflow: 16
---

La capture de trajectoire est l’enregistreur de vol par session d’OpenClaw. Elle enregistre une
chronologie structurée pour chaque exécution d’agent, puis `/export-trajectory` empaquette la
session actuelle dans un paquet de support expurgé.

Utilisez-la lorsque vous devez répondre à des questions comme :

- Quel prompt, prompt système et quels outils ont été envoyés au modèle ?
- Quels messages de transcription et appels d’outils ont mené à cette réponse ?
- L’exécution a-t-elle expiré, été abandonnée, compactée ou rencontré une erreur de fournisseur ?
- Quels modèle, plugins, Skills et paramètres d’exécution étaient actifs ?
- Quelles métadonnées d’utilisation et de cache de prompt le fournisseur a-t-il renvoyées ?

Si vous déposez un rapport de support général pour un problème de Gateway en direct, commencez par
[`/diagnostics`](/fr/gateway/diagnostics#chat-command). Diagnostics collecte le paquet Gateway
assaini et, pour les sessions du harnais OpenAI Codex, peut également envoyer
des retours Codex aux serveurs OpenAI après approbation. Utilisez `/export-trajectory` lorsque
vous avez spécifiquement besoin de la chronologie détaillée par session des prompts, outils et transcriptions.

## Démarrage rapide

Envoyez ceci dans la session active :

```text
/export-trajectory
```

Alias :

```text
/trajectory
```

OpenClaw écrit le paquet sous l’espace de travail :

```text
.openclaw/trajectory-exports/openclaw-trajectory-<session>-<timestamp>/
```

Vous pouvez choisir un nom de répertoire de sortie relatif :

```text
/export-trajectory bug-1234
```

Le chemin personnalisé est résolu dans `.openclaw/trajectory-exports/`. Les chemins absolus
et les chemins `~` sont rejetés.

Les paquets de trajectoire peuvent contenir des prompts, messages de modèle, schémas d’outils, résultats
d’outils, événements d’exécution et chemins locaux. La commande slash du chat passe donc
par l’approbation d’exécution à chaque fois. Approuvez l’exportation une seule fois lorsque vous avez l’intention de
créer le paquet ; n’utilisez pas l’autorisation globale. Dans les discussions de groupe, OpenClaw envoie
la demande d’approbation et le résultat de l’exportation au propriétaire en privé au lieu de publier les
détails de trajectoire dans le salon partagé.

Pour l’inspection locale ou les flux de support, vous pouvez également exécuter directement le chemin
de commande approuvé :

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
```

## Accès

L’exportation de trajectoire est une commande réservée au propriétaire. L’expéditeur doit réussir les vérifications
normales d’autorisation de commande et les vérifications de propriétaire pour le canal.

## Ce qui est enregistré

La capture de trajectoire est activée par défaut pour les exécutions d’agents OpenClaw.

Les événements d’exécution incluent :

- `session.started`
- `trace.metadata`
- `context.compiled`
- `prompt.submitted`
- `model.fallback_step`, y compris le modèle source, le modèle suivant, la raison/le détail de l’échec, la position dans la chaîne et si le repli a progressé, réussi ou épuisé la chaîne
- `model.completed`
- `trace.artifacts`
- `session.ended`

Les événements de transcription sont également reconstruits depuis la branche de session active :

- messages utilisateur
- messages d’assistant
- appels d’outils
- résultats d’outils
- compactions
- changements de modèle
- libellés et entrées de session personnalisées

Les événements sont écrits au format JSON Lines avec ce marqueur de schéma :

```json
{
  "traceSchema": "openclaw-trajectory",
  "schemaVersion": 1
}
```

## Fichiers du paquet

Un paquet exporté peut contenir :

| Fichier               | Contenu                                                                                         |
| --------------------- | ------------------------------------------------------------------------------------------------ |
| `manifest.json`       | Schéma du paquet, fichiers sources, nombres d’événements et liste des fichiers générés          |
| `events.jsonl`        | Chronologie ordonnée de l’exécution et de la transcription                                      |
| `session-branch.json` | Branche de transcription active expurgée et en-tête de session                                  |
| `metadata.json`       | Version d’OpenClaw, OS/runtime, modèle, instantané de configuration, plugins, Skills et métadonnées de prompt |
| `artifacts.json`      | État final, erreurs, utilisation, cache de prompt, nombre de compactions, texte de l’assistant et métadonnées d’outils |
| `prompts.json`        | Prompts soumis et détails sélectionnés de construction des prompts                              |
| `system-prompt.txt`   | Dernier prompt système compilé, lorsqu’il est capturé                                           |
| `tools.json`          | Définitions d’outils envoyées au modèle, lorsqu’elles sont capturées                            |

`manifest.json` liste les fichiers présents dans ce paquet. Certains fichiers sont omis
lorsque la session n’a pas capturé les données d’exécution correspondantes.

## Emplacement de capture

Par défaut, les événements de trajectoire d’exécution sont écrits à côté du fichier de session :

```text
<session>.trajectory.jsonl
```

OpenClaw écrit aussi un fichier pointeur au mieux à côté de la session :

```text
<session>.trajectory-path.json
```

Définissez `OPENCLAW_TRAJECTORY_DIR` pour stocker les fichiers annexes de trajectoire d’exécution dans un
répertoire dédié :

```bash
export OPENCLAW_TRAJECTORY_DIR=/var/lib/openclaw/trajectories
```

Lorsque cette variable est définie, OpenClaw écrit un fichier JSONL par identifiant de session dans ce
répertoire.

La maintenance des sessions supprime les fichiers annexes de trajectoire lorsque leur entrée de session propriétaire
est élaguée, plafonnée ou évincée par le budget disque des sessions. Les fichiers d’exécution en dehors
du répertoire des sessions ne sont supprimés que lorsque la cible du pointeur prouve encore qu’elle
appartient à cette session.

## Désactiver la capture

Définissez `OPENCLAW_TRAJECTORY=0` avant de démarrer OpenClaw :

```bash
export OPENCLAW_TRAJECTORY=0
```

Cela désactive la capture de trajectoire d’exécution. `/export-trajectory` peut toujours exporter
la branche de transcription, mais les fichiers propres à l’exécution tels que le contexte compilé,
les artefacts du fournisseur et les métadonnées de prompt peuvent manquer.

## Confidentialité et limites

Les paquets de trajectoire sont conçus pour le support et le débogage, pas pour une publication publique.
OpenClaw expurge les valeurs sensibles avant d’écrire les fichiers d’exportation :

- identifiants et champs de charge utile connus comme ressemblant à des secrets
- données d’image
- chemins d’état local
- chemins d’espace de travail, remplacés par `$WORKSPACE_DIR`
- chemins du répertoire personnel, lorsqu’ils sont détectés

L’exportateur limite également la taille des entrées :

- fichiers annexes d’exécution : 50 Mio
- fichiers de session : 50 Mio
- événements d’exécution : 200 000
- total des événements exportés : 250 000
- les lignes individuelles d’événements d’exécution sont tronquées au-delà de 256 Kio

Passez les paquets en revue avant de les partager en dehors de votre équipe. L’expurgation se fait au mieux
et ne peut pas connaître tous les secrets propres à une application.

## Dépannage

Si l’exportation ne contient aucun événement d’exécution :

- confirmez qu’OpenClaw a été démarré sans `OPENCLAW_TRAJECTORY=0`
- vérifiez si `OPENCLAW_TRAJECTORY_DIR` pointe vers un répertoire accessible en écriture
- exécutez un autre message dans la session, puis exportez de nouveau
- inspectez `manifest.json` pour `runtimeEventCount`

Si la commande rejette le chemin de sortie :

- utilisez un nom relatif comme `bug-1234`
- ne passez pas `/tmp/...` ni `~/...`
- gardez l’exportation dans `.openclaw/trajectory-exports/`

Si l’exportation échoue avec une erreur de taille, la session ou le fichier annexe a dépassé les
limites de sécurité d’exportation. Démarrez une nouvelle session ou exportez une reproduction plus petite.

## Connexe

- [Diffs](/fr/tools/diffs)
- [Gestion des sessions](/fr/concepts/session)
- [Outil exec](/fr/tools/exec)
