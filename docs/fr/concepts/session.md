---
read_when:
    - Vous voulez comprendre le routage et l’isolation des sessions
    - Vous souhaitez configurer la portée des messages directs pour les configurations multi-utilisateurs
    - Vous déboguez des réinitialisations de session quotidiennes ou dues à l’inactivité
summary: Comment OpenClaw gère les sessions de conversation
title: Gestion des sessions
x-i18n:
    generated_at: "2026-04-30T07:23:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2bbb8f8fddf8ac942bc24b8b94a6464ec31d0aee035bf367726d2112269095f4
    source_path: concepts/session.md
    workflow: 16
---

OpenClaw organise les conversations en **sessions**. Chaque message est routé vers une
session en fonction de sa provenance -- messages directs, discussions de groupe, tâches Cron, etc.

## Comment les messages sont routés

| Source            | Comportement                 |
| ----------------- | ---------------------------- |
| Messages directs  | Session partagée par défaut  |
| Discussions de groupe | Isolée par groupe        |
| Salons/canaux     | Isolée par salon             |
| Tâches Cron       | Nouvelle session à chaque exécution |
| Webhooks          | Isolée par hook              |

## Isolation des DM

Par défaut, tous les DM partagent une même session pour assurer la continuité. Cela convient aux
configurations avec un seul utilisateur.

<Warning>
Si plusieurs personnes peuvent envoyer des messages à votre agent, activez l’isolation des DM. Sans cela, tous
les utilisateurs partagent le même contexte de conversation -- les messages privés d’Alice seraient
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

- `main` (par défaut) -- tous les DM partagent une même session.
- `per-peer` -- isole par expéditeur (sur tous les canaux).
- `per-channel-peer` -- isole par canal + expéditeur (recommandé).
- `per-account-channel-peer` -- isole par compte + canal + expéditeur.

<Tip>
Si la même personne vous contacte depuis plusieurs canaux, utilisez
`session.identityLinks` pour lier ses identités afin qu’elles partagent une même session.
</Tip>

### Ancrer les canaux liés

Les commandes d’ancrage permettent à un utilisateur de déplacer la route de réponse de la session de discussion directe actuelle vers
un autre canal lié sans démarrer une nouvelle session. Consultez
[Ancrage de canal](/fr/concepts/channel-docking) pour des exemples, la configuration et
le dépannage.

Vérifiez votre configuration avec `openclaw security audit`.

## Cycle de vie des sessions

Les sessions sont réutilisées jusqu’à leur expiration :

- **Réinitialisation quotidienne** (par défaut) -- nouvelle session à 4 h 00, heure locale, sur l’hôte
  Gateway. La fraîcheur quotidienne est basée sur le moment où le `sessionId` actuel a démarré, et non
  sur les écritures de métadonnées ultérieures.
- **Réinitialisation après inactivité** (facultatif) -- nouvelle session après une période d’inactivité. Définissez
  `session.reset.idleMinutes`. La fraîcheur d’inactivité est basée sur la dernière interaction réelle
  utilisateur/canal, de sorte que les événements système heartbeat, cron et exec ne
  maintiennent pas la session en vie.
- **Réinitialisation manuelle** -- saisissez `/new` ou `/reset` dans la discussion. `/new <model>` change aussi
  le modèle.

Lorsque les réinitialisations quotidienne et après inactivité sont toutes deux configurées, celle qui expire en premier l’emporte.
Les tours Heartbeat, Cron, exec et autres événements système peuvent écrire des métadonnées de session,
mais ces écritures ne prolongent pas la fraîcheur de réinitialisation quotidienne ou après inactivité. Lorsqu’une réinitialisation
fait basculer la session, les notifications d’événements système en file d’attente pour l’ancienne session sont
supprimées afin que des mises à jour d’arrière-plan obsolètes ne soient pas ajoutées au début de la première invite dans
la nouvelle session.

Les sessions avec une session CLI active appartenant au fournisseur ne sont pas coupées par la valeur implicite
quotidienne par défaut. Utilisez `/reset` ou configurez explicitement `session.reset` lorsque ces
sessions doivent expirer selon une minuterie.

## Où l’état est stocké

Tout l’état de session appartient au **Gateway**. Les clients UI interrogent le Gateway pour
obtenir les données de session.

- **Magasin :** `~/.openclaw/agents/<agentId>/sessions/sessions.json`
- **Transcriptions :** `~/.openclaw/agents/<agentId>/sessions/<sessionId>.jsonl`

`sessions.json` conserve des horodatages de cycle de vie distincts :

- `sessionStartedAt` : moment où le `sessionId` actuel a commencé ; la réinitialisation quotidienne l’utilise.
- `lastInteractionAt` : dernière interaction utilisateur/canal qui prolonge la durée de vie d’inactivité.
- `updatedAt` : dernière mutation de ligne du magasin ; utile pour lister et élaguer, mais ne fait pas
  autorité pour la fraîcheur des réinitialisations quotidienne/après inactivité.

Les anciennes lignes sans `sessionStartedAt` sont résolues à partir de l’en-tête de session JSONL de la transcription
lorsqu’il est disponible. Si une ancienne ligne n’a pas non plus `lastInteractionAt`,
la fraîcheur d’inactivité se rabat sur l’heure de début de cette session, et non sur des écritures de tenue de registre
ultérieures.

## Maintenance des sessions

OpenClaw borne automatiquement le stockage des sessions au fil du temps. Par défaut, il s’exécute
en mode `warn` (signale ce qui serait nettoyé). Définissez `session.maintenance.mode`
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

Pour les limites `maxEntries` de taille production, les écritures d’exécution du Gateway utilisent un petit tampon de niveau haut et nettoient par lots jusqu’au plafond configuré. Cela évite d’exécuter un nettoyage complet du magasin à chaque session Cron isolée. `openclaw sessions cleanup --enforce` applique immédiatement le plafond.

Prévisualisez avec `openclaw sessions cleanup --dry-run`.

## Inspecter les sessions

- `openclaw status` -- chemin du magasin de sessions et activité récente.
- `openclaw sessions --json` -- toutes les sessions (filtrez avec `--active <minutes>`).
- `/status` dans la discussion -- utilisation du contexte, modèle et bascules.
- `/context list` -- contenu de l’invite système.

## Pour aller plus loin

- [Élagage des sessions](/fr/concepts/session-pruning) -- réduction des résultats d’outils
- [Compaction](/fr/concepts/compaction) -- résumé des longues conversations
- [Outils de session](/fr/concepts/session-tool) -- outils d’agent pour le travail intersessions
- [Exploration approfondie de la gestion des sessions](/fr/reference/session-management-compaction) --
  schéma du magasin, transcriptions, politique d’envoi, métadonnées d’origine et configuration avancée
- [Multi-Agent](/fr/concepts/multi-agent) — routage et isolation des sessions entre agents
- [Tâches d’arrière-plan](/fr/automation/tasks) — comment le travail détaché crée des enregistrements de tâche avec des références de session
- [Routage des canaux](/fr/channels/channel-routing) — comment les messages entrants sont routés vers les sessions

## Connexe

- [Élagage des sessions](/fr/concepts/session-pruning)
- [Outils de session](/fr/concepts/session-tool)
- [File de commandes](/fr/concepts/queue)
