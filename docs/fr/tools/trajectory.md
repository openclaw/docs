---
read_when:
    - Déboguer pourquoi un agent a répondu, échoué ou appelé des outils d’une certaine manière
    - Exportation d’un paquet d’assistance pour une session OpenClaw
    - Investigation du contexte des prompts, des appels d’outils, des erreurs d’exécution ou des métadonnées d’utilisation
    - Désactivation de la capture de trajectoire
summary: Exporter des ensembles de trajectoires expurgés pour déboguer une session d’agent OpenClaw
title: Lots de trajectoires
x-i18n:
    generated_at: "2026-07-12T16:06:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 7fc494732b6239ad4ea58dca3920a47cb7433c680e7566855dd265c986b55e74
    source_path: tools/trajectory.md
    workflow: 16
---

La capture de trajectoire est l’enregistreur de vol par session d’OpenClaw. Elle enregistre une
chronologie structurée pour chaque exécution d’agent, puis `/export-trajectory` regroupe la
session actuelle dans un paquet d’assistance expurgé couvrant :

- Le prompt, le prompt système et les outils envoyés au modèle
- Les messages de transcription et les appels d’outils ayant conduit à une réponse
- Si l’exécution a expiré, été interrompue, subi une Compaction ou rencontré une erreur du fournisseur
- Le modèle, les plugins, les Skills et les paramètres d’exécution actifs
- Les métadonnées d’utilisation et de cache de prompts renvoyées par le fournisseur

Pour obtenir un rapport d’assistance général sur le Gateway, commencez plutôt par
[`/diagnostics`](/fr/gateway/diagnostics#chat-command) ; cette commande collecte le
paquet Gateway assaini et, pour les sessions du banc d’exécution OpenAI Codex, peut envoyer des
commentaires Codex à OpenAI après approbation. Utilisez `/export-trajectory` lorsque vous avez besoin de la
chronologie détaillée des prompts, des outils et de la transcription pour chaque session.

## Démarrage rapide

Envoyez dans la session active (alias `/trajectory`) :

```text
/export-trajectory
```

OpenClaw écrit le paquet dans l’espace de travail :

```text
.openclaw/trajectory-exports/openclaw-trajectory-<session>-<timestamp>/
```

Indiquez un nom de répertoire de sortie relatif pour le remplacer :

```text
/export-trajectory bug-1234
```

Le nom est résolu dans `.openclaw/trajectory-exports/`. Les chemins absolus et
les chemins commençant par `~` sont rejetés.

Les paquets de trajectoire peuvent contenir des prompts, des messages du modèle, des schémas d’outils, des
résultats d’outils, des événements d’exécution et des chemins locaux ; la commande de chat passe donc toujours
par l’approbation d’exécution. Approuvez l’exportation une seule fois lorsque vous souhaitez créer le
paquet ; n’utilisez pas l’autorisation globale. Dans les discussions de groupe, OpenClaw envoie la demande
d’approbation et le résultat de l’exportation au propriétaire en privé au lieu de publier les détails de la trajectoire
dans le salon partagé.

Pour une inspection locale ou des procédures d’assistance, exécutez directement la commande CLI
sous-jacente :

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
```

Autres options : `--output <path>` (nom du répertoire dans
`.openclaw/trajectory-exports`), `--store <path>` (remplacement du magasin de sessions),
`--agent <id>` (identifiant de l’agent pour la résolution du magasin), `--json` (sortie structurée).

## Accès

L’exportation de trajectoire est une commande réservée au propriétaire. L’expéditeur doit satisfaire aux contrôles
d’autorisation habituels de la commande ainsi qu’au contrôle du propriétaire pour le canal.

## Éléments enregistrés

La capture de trajectoire est activée par défaut pour les exécutions d’agents OpenClaw.

Les événements d’exécution comprennent :

- `session.started`
- `trace.metadata`
- `context.compiled`
- `prompt.submitted`
- `model.fallback_step`, y compris le modèle source, le modèle suivant, la raison et le détail de l’échec, la position dans la chaîne, ainsi que l’état d’avancement, de réussite ou d’épuisement de la chaîne
- `model.completed`
- `trace.artifacts`
- `session.ended`

Les événements de transcription sont reconstruits à partir de la branche de session active : messages
utilisateur, messages de l’assistant, appels d’outils, résultats d’outils, Compactions, changements de
modèle, libellés et entrées de session personnalisées.

Les événements sont écrits au format JSON Lines avec ce marqueur de schéma :

```json
{
  "traceSchema": "openclaw-trajectory",
  "schemaVersion": 1
}
```

## Fichiers du paquet

| Fichier               | Contenu                                                                                                  |
| --------------------- | -------------------------------------------------------------------------------------------------------- |
| `manifest.json`       | Schéma du paquet, fichiers sources, nombre d’événements et liste des fichiers générés                     |
| `events.jsonl`        | Chronologie ordonnée des événements d’exécution et de transcription                                      |
| `session-branch.json` | Branche active de la transcription expurgée et en-tête de session                                        |
| `metadata.json`       | Version d’OpenClaw, système d’exploitation/environnement d’exécution, modèle, instantané de configuration, plugins, Skills et métadonnées des prompts |
| `artifacts.json`      | État final, erreurs, utilisation, cache de prompts, nombre de Compactions, texte de l’assistant et métadonnées des outils |
| `prompts.json`        | Prompts soumis et détails sélectionnés de construction des prompts                                       |
| `system-prompt.txt`   | Dernier prompt système compilé, lorsqu’il a été capturé                                                   |
| `tools.json`          | Définitions des outils envoyées au modèle, lorsqu’elles ont été capturées                                 |

`manifest.json` répertorie les fichiers présents dans un paquet donné ; certains fichiers sont
omis lorsque la session n’a pas capturé les données d’exécution correspondantes.

## Stockage des captures

Les événements de trajectoire d’exécution sont stockés avec la session dans la base de données SQLite
propre à chaque agent. L’exportation d’une trajectoire matérialise un paquet d’assistance JSONL expurgé ;
la capture d’exécution en direct n’est pas un fichier annexe JSONL placé à côté de la session.

Les fichiers hérités `.trajectory.jsonl` et `.trajectory-path.json` peuvent encore apparaître
après l’utilisation d’anciennes versions ou d’exportations explicites au format de fichier hérité. La maintenance des sessions considère
ces fichiers comme des cibles de nettoyage ; la capture active écrit des lignes dans la base de données.

## Désactiver la capture

```bash
export OPENCLAW_TRAJECTORY=0
```

Cette commande désactive la capture de trajectoire d’exécution avant le démarrage d’OpenClaw.
`/export-trajectory` peut toujours exporter la branche de transcription, mais les données propres à
l’exécution, telles que le contexte compilé, les artefacts du fournisseur et les métadonnées des prompts, peuvent être
absentes.

## Ajuster le délai d’expiration de l’écriture

OpenClaw écrit les lignes de trajectoire d’exécution pendant le nettoyage de l’agent. Le délai
d’expiration du nettoyage par défaut est de 10,000 ms. Sur les disques lents ou avec les magasins volumineux, définissez
`OPENCLAW_TRAJECTORY_FLUSH_TIMEOUT_MS` avant de démarrer OpenClaw :

```bash
export OPENCLAW_TRAJECTORY_FLUSH_TIMEOUT_MS=30000
```

Cette variable détermine quand OpenClaw journalise une expiration `openclaw-trajectory-flush` et
poursuit son exécution ; elle ne modifie pas les limites de taille des trajectoires. Pour ajuster toutes les étapes de
nettoyage des agents qui ne transmettent pas de délai explicite, définissez
`OPENCLAW_AGENT_CLEANUP_TIMEOUT_MS`.

## Confidentialité et limites

Les paquets de trajectoire sont destinés à l’assistance et au débogage, et non à une publication publique. OpenClaw
expurge les valeurs sensibles avant d’écrire les fichiers d’exportation :

- les identifiants et les champs de charge utile connus comme susceptibles de contenir des secrets
- les données d’image
- les chemins d’état locaux
- les chemins de l’espace de travail, remplacés par `$WORKSPACE_DIR`
- les chemins du répertoire personnel, lorsqu’ils sont détectés

L’exportateur limite également la taille des entrées :

- capture d’exécution : la capture en direct est une fenêtre glissante limitée à 10 MiB, qui supprime les événements les plus anciens pour faire place aux nouveaux ; l’exportation accepte les fichiers annexes d’exécution hérités existants jusqu’à 50 MiB
- fichiers de session : 50 MiB
- événements d’exécution par exportation : 200,000
- nombre total d’événements exportés : 250,000
- les lignes individuelles des événements d’exécution sont tronquées au-delà de 256 KiB

Examinez les paquets avant de les partager hors de votre équipe. L’expurgation est effectuée au mieux
et ne peut pas connaître tous les secrets propres à chaque application.

## Résolution des problèmes

Si l’exportation ne contient aucun événement d’exécution :

- vérifiez qu’OpenClaw a été démarré sans `OPENCLAW_TRAJECTORY=0`
- envoyez un autre message dans la session, puis exportez à nouveau
- recherchez `runtimeEventCount` dans `manifest.json`

Si la commande rejette le chemin de sortie :

- utilisez un nom relatif tel que `bug-1234`
- ne transmettez pas `/tmp/...` ou `~/...`
- conservez l’exportation dans `.openclaw/trajectory-exports/`

Si l’exportation échoue en raison d’une erreur de taille, la session ou le fichier annexe a dépassé les
limites de sécurité d’exportation indiquées ci-dessus. Démarrez une nouvelle session ou exportez une
reproduction plus petite.

## Pages connexes

- [Différences](/fr/tools/diffs)
- [Gestion des sessions](/fr/concepts/session)
- [Outil d’exécution](/fr/tools/exec)
