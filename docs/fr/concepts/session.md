---
read_when:
    - Vous voulez comprendre le routage et l’isolation des sessions
    - Vous souhaitez configurer le périmètre des DM pour les configurations multi-utilisateurs
    - Vous déboguez les réinitialisations quotidiennes ou de session inactive
summary: Comment OpenClaw gère les sessions de conversation
title: Gestion des sessions
x-i18n:
    generated_at: "2026-06-27T17:26:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f65249b17c8b45f569531134471683e9f458015b02af29ddf4aa6e1e5c2eac05
    source_path: concepts/session.md
    workflow: 16
---

OpenClaw organise les conversations en **sessions**. Chaque message est routé vers une
session selon sa provenance -- DM, discussions de groupe, tâches Cron, etc.

## Comment les messages sont routés

| Source          | Comportement                  |
| --------------- | ----------------------------- |
| Messages directs | Session partagée par défaut |
| Discussions de groupe | Isolée par groupe        |
| Salons/canaux  | Isolée par salon              |
| Tâches Cron    | Nouvelle session à chaque exécution |
| Webhooks       | Isolée par hook               |

## Isolation des DM

Par défaut, tous les DM partagent une seule session pour assurer la continuité. Cela convient aux
configurations avec un seul utilisateur.

<Warning>
Si plusieurs personnes peuvent envoyer des messages à votre agent, activez l’isolation des DM. Sans cela, tous les
utilisateurs partagent le même contexte de conversation -- les messages privés d’Alice seraient
visibles par Bob.
</Warning>

**Le correctif :**

```json5
{
  session: {
    dmScope: "per-channel-peer", // isolate by channel + sender
  },
}
```

Autres options :

- `main` (par défaut) -- tous les DM partagent une seule session.
- `per-peer` -- isoler par expéditeur (sur tous les canaux).
- `per-channel-peer` -- isoler par canal + expéditeur (recommandé).
- `per-account-channel-peer` -- isoler par compte + canal + expéditeur.

<Tip>
Si la même personne vous contacte depuis plusieurs canaux, utilisez
`session.identityLinks` pour lier ses identités afin qu’elles partagent une seule session.
</Tip>

### Ancrer les canaux liés

Les commandes d’ancrage permettent à un utilisateur de déplacer la route de réponse de la session de discussion directe actuelle vers
un autre canal lié sans démarrer une nouvelle session. Consultez
[Ancrage de canal](/fr/concepts/channel-docking) pour des exemples, la configuration et le
dépannage.

Vérifiez votre configuration avec `openclaw security audit`.

## Cycle de vie des sessions

Les sessions sont réutilisées jusqu’à leur expiration :

- **Réinitialisation quotidienne** (par défaut) -- nouvelle session à 4 h 00, heure locale de l’hôte
  Gateway. La fraîcheur quotidienne est basée sur le moment où le `sessionId` actuel a démarré, et non
  sur les écritures ultérieures de métadonnées.
- **Réinitialisation après inactivité** (facultative) -- nouvelle session après une période d’inactivité. Définissez
  `session.reset.idleMinutes`. La fraîcheur d’inactivité est basée sur la dernière interaction réelle
  utilisateur/canal ; ainsi, les événements système Heartbeat, Cron et exec ne
  maintiennent pas la session active.
- **Réinitialisation manuelle** -- saisissez `/new` ou `/reset` dans la discussion. `/new <model>` change aussi
  le modèle.

Lorsque les réinitialisations quotidienne et après inactivité sont toutes deux configurées, celle qui expire en premier s’applique.
Les tours d’événements système Heartbeat, Cron, exec et autres peuvent écrire des métadonnées de session,
mais ces écritures ne prolongent pas la fraîcheur de réinitialisation quotidienne ou après inactivité. Lorsqu’une réinitialisation
fait basculer la session, les notifications d’événements système en file d’attente pour l’ancienne session sont
ignorées afin que les mises à jour d’arrière-plan obsolètes ne soient pas ajoutées au début de la première invite de
la nouvelle session.

Les sessions avec une session CLI active détenue par le fournisseur ne sont pas interrompues par la valeur quotidienne implicite
par défaut. Utilisez `/reset` ou configurez explicitement `session.reset` lorsque ces
sessions doivent expirer selon un minuteur.

## Où réside l’état

Tout l’état de session appartient au **Gateway**. Les clients d’interface interrogent le Gateway pour obtenir les
données de session.

- **Stockage :** `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- **Transcriptions :** `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`

`sessions.json` conserve des horodatages de cycle de vie distincts :

- `sessionStartedAt` : moment où le `sessionId` actuel a commencé ; la réinitialisation quotidienne l’utilise.
- `lastInteractionAt` : dernière interaction utilisateur/canal qui prolonge la durée de vie d’inactivité.
- `updatedAt` : dernière mutation de ligne du stockage ; utile pour l’affichage et l’élagage, mais pas
  autoritaire pour la fraîcheur de réinitialisation quotidienne/après inactivité.

Les lignes plus anciennes sans `sessionStartedAt` sont résolues à partir de l’en-tête de session JSONL de la transcription
lorsqu’il est disponible. Si une ligne plus ancienne n’a pas non plus `lastInteractionAt`,
la fraîcheur d’inactivité retombe sur l’heure de début de cette session, et non sur les écritures ultérieures de
comptabilité.

## Maintenance des sessions

OpenClaw borne automatiquement le stockage des sessions dans le temps. Par défaut, il s’exécute
en mode `enforce` et applique le nettoyage pendant la maintenance. Définissez
`session.maintenance.mode` sur `"warn"` pour signaler ce qui serait nettoyé sans modifier le stockage/les fichiers :

```json5
{
  session: {
    maintenance: {
      mode: "enforce",
      pruneAfter: "30d",
      maxEntries: 500,
    },
  },
}
```

Pour les limites `maxEntries` de taille production, les écritures d’exécution Gateway utilisent un petit tampon de seuil haut et nettoient par lots pour revenir à la limite configurée. Les lectures du stockage de sessions n’élaguent ni ne limitent les entrées au démarrage du Gateway. Cela évite d’exécuter un nettoyage complet du stockage à chaque démarrage ou session Cron isolée. `openclaw sessions cleanup --enforce` applique la limite immédiatement.

Les sessions de sondage d’exécution de modèle du Gateway sont de courte durée par défaut. Les lignes correspondantes avec
des clés explicites strictes comme `agent:*:explicit:model-run-<uuid>` utilisent une rétention fixe de `24h`,
mais le nettoyage est soumis à la pression : il ne supprime les lignes de sondage obsolètes que lorsque
la pression de maintenance/limite des entrées de session est atteinte. Lorsque le nettoyage d’exécution de modèle s’exécute,
il s’exécute avant le seuil d’âge plus général des entrées obsolètes et la limite d’entrées. Les sessions directes,
de groupe, de fil, Cron, hook, Heartbeat, ACP et de sous-agent normales n’héritent pas de
cette rétention de 24 h.

La maintenance préserve les pointeurs durables vers les conversations externes, notamment les
sessions de groupe et les sessions de discussion limitées à un fil, tout en permettant aux entrées synthétiques Cron,
hook, Heartbeat, ACP et de sous-agent de vieillir puis d’être supprimées.

Si vous utilisiez auparavant l’isolation des messages directs puis avez remis
`session.dmScope` à `main`, prévisualisez les anciennes lignes de DM avec clé par pair avec
`openclaw sessions cleanup --dry-run --fix-dm-scope`. L’application du même indicateur
retire ces anciennes lignes de DM directs et conserve leurs transcriptions comme archives
supprimées.

Prévisualisez avec `openclaw sessions cleanup --dry-run`.

## Inspecter les sessions

- `openclaw status` -- chemin du stockage de sessions et activité récente.
- `openclaw sessions --json` -- toutes les sessions (filtrer avec `--active <minutes>`).
- `/status` dans la discussion -- utilisation du contexte, modèle et bascules.
- `/context list` -- ce qui se trouve dans l’invite système.

## Pour aller plus loin

- [Élagage des sessions](/fr/concepts/session-pruning) -- réduction des résultats d’outils
- [Compaction](/fr/concepts/compaction) -- résumé des longues conversations
- [Outils de session](/fr/concepts/session-tool) -- outils d’agent pour le travail intersessions
- [Exploration approfondie de la gestion des sessions](/fr/reference/session-management-compaction) --
  schéma du stockage, transcriptions, politique d’envoi, métadonnées d’origine et configuration avancée
- [Multi-agent](/fr/concepts/multi-agent) — routage et isolation des sessions entre agents
- [Tâches d’arrière-plan](/fr/automation/tasks) — comment le travail détaché crée des enregistrements de tâche avec des références de session
- [Routage des canaux](/fr/channels/channel-routing) — comment les messages entrants sont routés vers les sessions

## Connexe

- [Élagage des sessions](/fr/concepts/session-pruning)
- [Outils de session](/fr/concepts/session-tool)
- [File de commandes](/fr/concepts/queue)
