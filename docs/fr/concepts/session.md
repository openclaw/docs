---
read_when:
    - Vous souhaitez comprendre le routage et l’isolation des sessions
    - Vous souhaitez configurer le périmètre des messages directs pour les configurations multi-utilisateurs
    - Vous déboguez les réinitialisations de session quotidiennes ou liées à l’inactivité
summary: Comment OpenClaw gère les sessions de conversation
title: Gestion des sessions
x-i18n:
    generated_at: "2026-05-02T07:05:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: b2fd0c9e880242a8d0070c24bd1f7971e4082344240e28632e2e3ca032404807
    source_path: concepts/session.md
    workflow: 16
---

OpenClaw organise les conversations en **sessions**. Chaque message est routé vers une
session selon sa provenance -- messages directs, discussions de groupe, tâches Cron, etc.

## Comment les messages sont routés

| Source            | Comportement                         |
| ----------------- | ------------------------------------ |
| Messages directs  | Session partagée par défaut          |
| Discussions de groupe | Isolée par groupe                |
| Salons/canaux     | Isolée par salon                     |
| Tâches Cron       | Nouvelle session à chaque exécution  |
| Webhooks          | Isolée par hook                      |

## Isolation des messages directs

Par défaut, tous les messages directs partagent une session pour assurer la continuité. Cela convient aux
configurations mono-utilisateur.

<Warning>
Si plusieurs personnes peuvent envoyer des messages à votre agent, activez l'isolation des messages directs. Sans cela, tous les
utilisateurs partagent le même contexte de conversation -- les messages privés d'Alice seraient
visibles par Bob.
</Warning>

**La correction :**

```json5
{
  session: {
    dmScope: "per-channel-peer", // isolate by channel + sender
  },
}
```

Autres options :

- `main` (par défaut) -- tous les messages directs partagent une session.
- `per-peer` -- isolation par expéditeur (sur tous les canaux).
- `per-channel-peer` -- isolation par canal + expéditeur (recommandé).
- `per-account-channel-peer` -- isolation par compte + canal + expéditeur.

<Tip>
Si la même personne vous contacte depuis plusieurs canaux, utilisez
`session.identityLinks` pour lier ses identités afin qu'elles partagent une seule session.
</Tip>

### Ancrer les canaux liés

Les commandes d'ancrage permettent à un utilisateur de déplacer la route de réponse de la session actuelle de discussion directe vers
un autre canal lié sans démarrer une nouvelle session. Consultez
[Ancrage de canal](/fr/concepts/channel-docking) pour des exemples, la configuration et le
dépannage.

Vérifiez votre configuration avec `openclaw security audit`.

## Cycle de vie des sessions

Les sessions sont réutilisées jusqu'à leur expiration :

- **Réinitialisation quotidienne** (par défaut) -- nouvelle session à 4 h 00, heure locale, sur l'hôte
  du Gateway. La fraîcheur quotidienne est basée sur le moment où le `sessionId` actuel a démarré, et non
  sur les écritures ultérieures de métadonnées.
- **Réinitialisation d'inactivité** (facultative) -- nouvelle session après une période d'inactivité. Définissez
  `session.reset.idleMinutes`. La fraîcheur d'inactivité est basée sur la dernière interaction réelle
  utilisateur/canal ; les événements système Heartbeat, Cron et exec ne
  maintiennent donc pas la session active.
- **Réinitialisation manuelle** -- saisissez `/new` ou `/reset` dans la discussion. `/new <model>` change aussi
  le modèle.

Lorsque les réinitialisations quotidienne et d'inactivité sont toutes deux configurées, celle qui expire en premier l'emporte.
Les tours Heartbeat, Cron, exec et autres événements système peuvent écrire des métadonnées de session,
mais ces écritures ne prolongent pas la fraîcheur des réinitialisations quotidienne ou d'inactivité. Lorsqu'une réinitialisation
fait rouler la session, les avis d'événements système en file d'attente pour l'ancienne session sont
ignorés afin que des mises à jour d'arrière-plan obsolètes ne soient pas préfixées au premier prompt de
la nouvelle session.

Les sessions avec une session CLI active détenue par le fournisseur ne sont pas coupées par la valeur quotidienne implicite
par défaut. Utilisez `/reset` ou configurez explicitement `session.reset` lorsque ces
sessions doivent expirer selon un minuteur.

## Où vit l'état

Tout l'état de session est détenu par le **gateway**. Les clients d'interface interrogent le gateway pour
les données de session.

- **Stockage :** `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- **Transcriptions :** `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`

`sessions.json` conserve des horodatages de cycle de vie séparés :

- `sessionStartedAt` : moment où le `sessionId` actuel a commencé ; la réinitialisation quotidienne l'utilise.
- `lastInteractionAt` : dernière interaction utilisateur/canal qui prolonge la durée de vie d'inactivité.
- `updatedAt` : dernière mutation de ligne du stockage ; utile pour lister et élaguer, mais pas
  authoritative pour la fraîcheur des réinitialisations quotidienne/d'inactivité.

Les lignes plus anciennes sans `sessionStartedAt` sont résolues à partir de l'en-tête de session JSONL de la transcription
lorsqu'il est disponible. Si une ligne plus ancienne n'a pas non plus `lastInteractionAt`,
la fraîcheur d'inactivité se rabat sur l'heure de début de cette session, et non sur des écritures ultérieures de tenue
de registre.

## Maintenance des sessions

OpenClaw borne automatiquement le stockage des sessions au fil du temps. Par défaut, il s'exécute
en mode `warn` (rapporte ce qui serait nettoyé). Définissez `session.maintenance.mode`
sur `"enforce"` pour le nettoyage automatique :

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

Pour les limites `maxEntries` de taille production, les écritures du runtime Gateway utilisent un petit tampon de niveau haut et nettoient par lots jusqu'à revenir à la limite configurée. Les lectures du stockage de sessions n'élaguent ni ne plafonnent les entrées pendant le démarrage du Gateway. Cela évite d'exécuter un nettoyage complet du stockage à chaque démarrage ou session Cron isolée. `openclaw sessions cleanup --enforce` applique immédiatement le plafond.

La maintenance préserve les pointeurs durables vers les conversations externes, y compris les sessions de groupe
et les sessions de discussion limitées à un fil, tout en permettant aux entrées synthétiques Cron,
hook, Heartbeat, ACP et de sous-agent de vieillir jusqu'à expiration.

Prévisualisez avec `openclaw sessions cleanup --dry-run`.

## Inspecter les sessions

- `openclaw status` -- chemin du stockage de sessions et activité récente.
- `openclaw sessions --json` -- toutes les sessions (filtrer avec `--active <minutes>`).
- `/status` dans la discussion -- utilisation du contexte, modèle et bascules.
- `/context list` -- ce qui se trouve dans le prompt système.

## Pour aller plus loin

- [Élagage des sessions](/fr/concepts/session-pruning) -- réduction des résultats d'outils
- [Compaction](/fr/concepts/compaction) -- résumé des longues conversations
- [Outils de session](/fr/concepts/session-tool) -- outils d'agent pour le travail intersessions
- [Étude approfondie de la gestion des sessions](/fr/reference/session-management-compaction) --
  schéma du stockage, transcriptions, politique d'envoi, métadonnées d'origine et configuration avancée
- [Multi-agent](/fr/concepts/multi-agent) — routage et isolation des sessions entre agents
- [Tâches d'arrière-plan](/fr/automation/tasks) — comment le travail détaché crée des enregistrements de tâches avec des références de session
- [Routage de canal](/fr/channels/channel-routing) — comment les messages entrants sont routés vers les sessions

## Connexe

- [Élagage des sessions](/fr/concepts/session-pruning)
- [Outils de session](/fr/concepts/session-tool)
- [File d'attente des commandes](/fr/concepts/queue)
