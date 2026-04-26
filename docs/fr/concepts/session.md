---
read_when:
    - Vous voulez comprendre le routage et l’isolation des sessions
    - Vous voulez configurer la portée des messages privés pour des configurations multi-utilisateurs
    - Vous déboguez des réinitialisations de session quotidiennes ou sur inactivité
summary: Comment OpenClaw gère les sessions de conversation
title: Gestion des sessions
x-i18n:
    generated_at: "2026-04-26T11:27:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8f36995997dc7eb612333c6bbfe6cd6c08dc22769ad0a7e47d15dbb4208e6113
    source_path: concepts/session.md
    workflow: 15
---

OpenClaw organise les conversations en **sessions**. Chaque message est routé vers une
session selon sa provenance — messages privés, discussions de groupe, tâches Cron, etc.

## Comment les messages sont routés

| Source          | Comportement                  |
| --------------- | ----------------------------- |
| Messages privés | Session partagée par défaut   |
| Discussions de groupe | Isolées par groupe     |
| Salons/canaux   | Isolés par salon              |
| Tâches Cron     | Nouvelle session par exécution |
| Webhooks        | Isolés par hook               |

## Isolation des messages privés

Par défaut, tous les messages privés partagent une seule session pour assurer la continuité. Cela convient aux configurations à utilisateur unique.

<Warning>
Si plusieurs personnes peuvent envoyer des messages à votre agent, activez l’isolation des messages privés. Sans cela, tous
les utilisateurs partagent le même contexte de conversation — les messages privés d’Alice seraient
visibles par Bob.
</Warning>

**Le correctif :**

```json5
{
  session: {
    dmScope: "per-channel-peer", // isoler par canal + expéditeur
  },
}
```

Autres options :

- `main` (par défaut) — tous les messages privés partagent une seule session.
- `per-peer` — isolation par expéditeur (sur tous les canaux).
- `per-channel-peer` — isolation par canal + expéditeur (recommandé).
- `per-account-channel-peer` — isolation par compte + canal + expéditeur.

<Tip>
Si la même personne vous contacte depuis plusieurs canaux, utilisez
`session.identityLinks` pour lier ses identités afin qu’elles partagent une seule session.
</Tip>

Vérifiez votre configuration avec `openclaw security audit`.

## Cycle de vie des sessions

Les sessions sont réutilisées jusqu’à expiration :

- **Réinitialisation quotidienne** (par défaut) — nouvelle session à 4 h 00, heure locale, sur l’hôte
  de la gateway. La fraîcheur quotidienne est basée sur le moment où le `sessionId` actuel a commencé, et non
  sur les écritures ultérieures de métadonnées.
- **Réinitialisation sur inactivité** (facultative) — nouvelle session après une période d’inactivité. Définissez
  `session.reset.idleMinutes`. La fraîcheur liée à l’inactivité est basée sur la dernière
  interaction utilisateur/canal réelle, donc les événements système Heartbeat, Cron et exec ne
  maintiennent pas la session active.
- **Réinitialisation manuelle** — saisissez `/new` ou `/reset` dans la discussion. `/new <model>` change aussi
  le modèle.

Lorsque les réinitialisations quotidienne et sur inactivité sont toutes deux configurées, la première à expirer l’emporte.
Les tours Heartbeat, Cron, exec et autres événements système peuvent écrire des métadonnées de session,
mais ces écritures n’étendent pas la fraîcheur des réinitialisations quotidiennes ou sur inactivité. Lorsqu’une réinitialisation
fait basculer la session, les notifications d’événements système en file d’attente pour l’ancienne session sont
abandonnées afin que des mises à jour d’arrière-plan obsolètes ne soient pas préfixées au premier prompt de
la nouvelle session.

Les sessions avec une session CLI appartenant activement au fournisseur ne sont pas coupées par la valeur implicite
quotidienne par défaut. Utilisez `/reset` ou configurez `session.reset` explicitement lorsque ces
sessions doivent expirer selon un minuteur.

## Où l’état est stocké

Tout l’état de session appartient à la **gateway**. Les clients d’UI interrogent la gateway pour obtenir
les données de session.

- **Stockage :** `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- **Transcriptions :** `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`

`sessions.json` conserve des horodatages distincts pour le cycle de vie :

- `sessionStartedAt` : moment où le `sessionId` actuel a commencé ; la réinitialisation quotidienne utilise cette valeur.
- `lastInteractionAt` : dernière interaction utilisateur/canal qui prolonge la durée de vie sur inactivité.
- `updatedAt` : dernière mutation de ligne dans le stockage ; utile pour le listage et l’élagage, mais
  non authoritative pour la fraîcheur des réinitialisations quotidiennes/sur inactivité.

Les anciennes lignes sans `sessionStartedAt` sont résolues à partir de l’en-tête de session JSONL de la transcription
lorsqu’il est disponible. Si une ancienne ligne n’a pas non plus `lastInteractionAt`,
la fraîcheur sur inactivité revient au moment de début de cette session, et non à des écritures administratives ultérieures.

## Maintenance des sessions

OpenClaw borne automatiquement le stockage des sessions au fil du temps. Par défaut, il s’exécute
en mode `warn` (signale ce qui serait nettoyé). Définissez `session.maintenance.mode`
sur `"enforce"` pour un nettoyage automatique :

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

Prévisualisez avec `openclaw sessions cleanup --dry-run`.

## Inspection des sessions

- `openclaw status` — chemin du magasin de sessions et activité récente.
- `openclaw sessions --json` — toutes les sessions (filtrez avec `--active <minutes>`).
- `/status` dans la discussion — utilisation du contexte, modèle et bascules.
- `/context list` — ce qui se trouve dans le prompt système.

## Pour aller plus loin

- [Élagage des sessions](/fr/concepts/session-pruning) — réduction des résultats d’outils
- [Compaction](/fr/concepts/compaction) — résumé des longues conversations
- [Outils de session](/fr/concepts/session-tool) — outils d’agent pour le travail inter-session
- [Analyse approfondie de la gestion des sessions](/fr/reference/session-management-compaction) —
  schéma de stockage, transcriptions, politique d’envoi, métadonnées d’origine et configuration avancée
- [Multi-Agent](/fr/concepts/multi-agent) — routage et isolation des sessions entre agents
- [Tâches en arrière-plan](/fr/automation/tasks) — comment le travail détaché crée des enregistrements de tâche avec des références de session
- [Routage des canaux](/fr/channels/channel-routing) — comment les messages entrants sont routés vers des sessions

## Connexe

- [Élagage des sessions](/fr/concepts/session-pruning)
- [Outils de session](/fr/concepts/session-tool)
- [File de commandes](/fr/concepts/queue)
