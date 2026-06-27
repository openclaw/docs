---
read_when:
    - Déboguer pourquoi un agent a répondu, échoué ou appelé des outils d’une certaine manière
    - Exporter un paquet de support pour une session OpenClaw
    - Examiner le contexte des prompts, les appels d’outils, les erreurs d’exécution ou les métadonnées d’utilisation
    - Désactiver ou déplacer la capture de trajectoire
summary: Exporter des bundles de trajectoire expurgés pour déboguer une session d’agent OpenClaw
title: Bundles de trajectoire
x-i18n:
    generated_at: "2026-06-27T18:22:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bf48616c29a1055f26d39a88869c025db7e6261b13dcaa0cd35be438c6a86a88
    source_path: tools/trajectory.md
    workflow: 16
---

La capture de trajectoire est l’enregistreur de vol par session d’OpenClaw. Elle enregistre une
chronologie structurée pour chaque exécution d’agent, puis `/export-trajectory` empaquette la
session actuelle dans un paquet de support expurgé.

Utilisez-la lorsque vous devez répondre à des questions comme :

- Quels prompt, prompt système et outils ont été envoyés au modèle ?
- Quels messages de transcript et appels d’outils ont mené à cette réponse ?
- L’exécution a-t-elle expiré, été abandonnée, compactée ou rencontré une erreur de fournisseur ?
- Quels modèle, plugins, Skills et paramètres d’exécution étaient actifs ?
- Quelles métadonnées d’utilisation et de cache de prompt le fournisseur a-t-il renvoyées ?

Si vous déposez un rapport de support large pour un problème Gateway en direct, commencez par
[`/diagnostics`](/fr/gateway/diagnostics#chat-command). Diagnostics collecte le paquet Gateway
sanitisé et, pour les sessions du harnais OpenAI Codex, peut aussi envoyer
un retour Codex aux serveurs OpenAI après approbation. Utilisez `/export-trajectory` lorsque
vous avez spécifiquement besoin de la chronologie détaillée par session des prompts, des outils
et du transcript.

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
et les chemins `~` sont refusés.

Les paquets de trajectoire peuvent contenir des prompts, des messages de modèle, des schémas
d’outils, des résultats d’outils, des événements d’exécution et des chemins locaux. La commande
slash de chat passe donc par l’approbation exec à chaque fois. Approuvez l’export une fois lorsque
vous avez l’intention de créer le paquet ; n’utilisez pas allow-all. Dans les discussions de groupe, OpenClaw envoie
la demande d’approbation et le résultat d’export au propriétaire en privé au lieu de publier les
détails de trajectoire dans le salon partagé.

Pour l’inspection locale ou les workflows de support, vous pouvez aussi exécuter directement le chemin
de commande approuvé :

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
```

## Accès

L’export de trajectoire est une commande propriétaire. L’expéditeur doit réussir les vérifications normales
d’autorisation de commande et les vérifications de propriétaire pour le canal.

## Ce qui est enregistré

La capture de trajectoire est activée par défaut pour les exécutions d’agent OpenClaw.

Les événements d’exécution incluent :

- `session.started`
- `trace.metadata`
- `context.compiled`
- `prompt.submitted`
- `model.fallback_step`, y compris le modèle source, le modèle suivant, la raison/le détail de l’échec, la position dans la chaîne, et si le fallback a avancé, réussi ou épuisé la chaîne
- `model.completed`
- `trace.artifacts`
- `session.ended`

Les événements de transcript sont aussi reconstruits depuis la branche de session active :

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

## Fichiers du paquet

Un paquet exporté peut contenir :

| Fichier               | Contenu                                                                                        |
| --------------------- | ---------------------------------------------------------------------------------------------- |
| `manifest.json`       | Schéma du paquet, fichiers source, nombres d’événements et liste des fichiers générés          |
| `events.jsonl`        | Chronologie ordonnée de l’exécution et du transcript                                           |
| `session-branch.json` | Branche de transcript active expurgée et en-tête de session                                    |
| `metadata.json`       | Version d’OpenClaw, OS/runtime, modèle, instantané de config, plugins, Skills et métadonnées de prompt |
| `artifacts.json`      | Statut final, erreurs, utilisation, cache de prompt, nombre de Compactions, texte assistant et métadonnées d’outils |
| `prompts.json`        | Prompts soumis et détails sélectionnés de construction de prompt                               |
| `system-prompt.txt`   | Dernier prompt système compilé, lorsqu’il est capturé                                          |
| `tools.json`          | Définitions d’outils envoyées au modèle, lorsqu’elles sont capturées                           |

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

Définissez `OPENCLAW_TRAJECTORY_DIR` pour stocker les sidecars de trajectoire d’exécution dans un
répertoire dédié :

```bash
export OPENCLAW_TRAJECTORY_DIR=/var/lib/openclaw/trajectories
```

Lorsque cette variable est définie, OpenClaw écrit un fichier JSONL par identifiant de session dans ce
répertoire.

La maintenance des sessions supprime les sidecars de trajectoire lorsque leur entrée de session propriétaire
est élaguée, plafonnée ou évincée par le budget disque des sessions. Les fichiers d’exécution en dehors
du répertoire des sessions ne sont supprimés que lorsque la cible du pointeur prouve encore qu’elle
appartient à cette session.

## Désactiver la capture

Définissez `OPENCLAW_TRAJECTORY=0` avant de démarrer OpenClaw :

```bash
export OPENCLAW_TRAJECTORY=0
```

Cela désactive la capture de trajectoire d’exécution. `/export-trajectory` peut encore exporter
la branche de transcript, mais les fichiers propres à l’exécution, comme le contexte compilé,
les artefacts de fournisseur et les métadonnées de prompt, peuvent manquer.

## Régler le délai d’expiration du flush

OpenClaw flush les sidecars de trajectoire d’exécution pendant le nettoyage de l’agent. Le délai d’expiration
de nettoyage par défaut est de 10 000 ms. Sur les disques lents ou les grands magasins, définissez
`OPENCLAW_TRAJECTORY_FLUSH_TIMEOUT_MS` avant de démarrer OpenClaw :

```bash
export OPENCLAW_TRAJECTORY_FLUSH_TIMEOUT_MS=30000
```

Cela contrôle le moment où OpenClaw journalise un délai d’expiration `openclaw-trajectory-flush` et continue.
Cela ne modifie pas les plafonds de taille de trajectoire. Pour régler toutes les étapes de nettoyage d’agent
qui ne transmettent pas de délai d’expiration explicite, définissez `OPENCLAW_AGENT_CLEANUP_TIMEOUT_MS`.

## Confidentialité et limites

Les paquets de trajectoire sont conçus pour le support et le débogage, pas pour une publication publique.
OpenClaw expurge les valeurs sensibles avant d’écrire les fichiers d’export :

- identifiants et champs de charge utile connus comme ressemblant à des secrets
- données d’image
- chemins d’état locaux
- chemins d’espace de travail, remplacés par `$WORKSPACE_DIR`
- chemins du répertoire personnel, lorsqu’ils sont détectés

L’exporteur limite aussi la taille des entrées :

- fichiers sidecar d’exécution : la capture en direct s’arrête à 10 MiB et enregistre un événement de troncature lorsqu’il reste de l’espace ; l’export accepte les sidecars d’exécution existants jusqu’à 50 MiB
- fichiers de session : 50 MiB
- événements d’exécution : 200 000
- total des événements exportés : 250 000
- les lignes d’événement d’exécution individuelles sont tronquées au-dessus de 256 KiB

Relisez les paquets avant de les partager en dehors de votre équipe. L’expurgation est réalisée au mieux
et ne peut pas connaître tous les secrets propres à chaque application.

## Dépannage

Si l’export n’a aucun événement d’exécution :

- confirmez qu’OpenClaw a été démarré sans `OPENCLAW_TRAJECTORY=0`
- vérifiez si `OPENCLAW_TRAJECTORY_DIR` pointe vers un répertoire accessible en écriture
- exécutez un autre message dans la session, puis exportez à nouveau
- inspectez `manifest.json` pour `runtimeEventCount`

Si la commande refuse le chemin de sortie :

- utilisez un nom relatif comme `bug-1234`
- ne transmettez pas `/tmp/...` ni `~/...`
- gardez l’export dans `.openclaw/trajectory-exports/`

Si l’export échoue avec une erreur de taille, la session ou le sidecar a dépassé les
limites de sécurité d’export. Démarrez une nouvelle session ou exportez une reproduction plus petite.

## Connexe

- [Diffs](/fr/tools/diffs)
- [Gestion des sessions](/fr/concepts/session)
- [Outil exec](/fr/tools/exec)
