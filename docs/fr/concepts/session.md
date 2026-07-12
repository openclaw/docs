---
read_when:
    - Vous souhaitez comprendre le routage et l’isolation des sessions
    - Vous souhaitez configurer la portée des messages privés pour les configurations multi-utilisateurs
    - Vous déboguez les réinitialisations quotidiennes ou après une période d’inactivité des sessions
summary: Comment OpenClaw gère les sessions de conversation
title: Gestion des sessions
x-i18n:
    generated_at: "2026-07-12T15:22:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 8ec9e33b4d288fa12016092ab2201431631fc9cb77e6e9d4261d348d5a849f65
    source_path: concepts/session.md
    workflow: 16
---

OpenClaw achemine chaque message entrant vers une **session** selon sa provenance :
messages privés, discussions de groupe, tâches Cron, etc. L’intégralité de l’état
des sessions appartient au **Gateway** ; les clients d’interface interrogent le
Gateway pour obtenir les données des sessions.

## Acheminement des messages

| Source             | Comportement                         |
| ------------------ | ------------------------------------ |
| Messages privés    | Session partagée par défaut          |
| Discussions de groupe | Session isolée pour chaque groupe |
| Salons/canaux      | Session isolée pour chaque salon     |
| Tâches Cron        | Nouvelle session à chaque exécution  |
| Webhooks           | Session isolée pour chaque Webhook   |

## Isolation des messages privés

Par défaut, tous les messages privés partagent une même session afin d’assurer
la continuité, ce qui convient aux configurations à utilisateur unique.

<Warning>
Si plusieurs personnes peuvent envoyer des messages à votre agent, activez
l’isolation des messages privés. Sans cette isolation, tous les utilisateurs
partagent le même contexte de conversation : les messages privés d’Alice
seraient donc visibles par Bob.
</Warning>

```json5
{
  session: {
    dmScope: "per-channel-peer", // isoler par canal + expéditeur
  },
}
```

Options de `session.dmScope` :

| Valeur                     | Comportement                                      |
| -------------------------- | ------------------------------------------------- |
| `main` (par défaut)        | Tous les messages privés partagent une session    |
| `per-peer`                 | Isolation par expéditeur, tous canaux confondus   |
| `per-channel-peer`         | Isolation par canal + expéditeur (recommandé)     |
| `per-account-channel-peer` | Isolation par compte + canal + expéditeur          |

<Tip>
Si la même personne vous contacte depuis plusieurs canaux, utilisez
`session.identityLinks` pour associer ses identités à un identifiant canonique
de pair afin qu’elles partagent une session.
</Tip>

### Ancrage des canaux liés

Les commandes d’ancrage déplacent l’itinéraire de réponse de la session de
discussion privée actuelle vers un autre canal lié sans démarrer de nouvelle
session. Consultez [Ancrage des canaux](/fr/concepts/channel-docking) pour obtenir
des exemples, la configuration et des informations de dépannage.

Vérifiez votre configuration avec `openclaw security audit`.

## Cycle de vie des sessions

Les sessions sont réutilisées jusqu’à leur expiration selon `session.reset` :

- **Réinitialisation quotidienne** (`mode: "daily"` par défaut) - nouvelle
  session à une heure locale configurée (`session.reset.atHour`, valeur par
  défaut `4`, 0-23) sur l’hôte du Gateway. La validité quotidienne est
  déterminée par le moment où le `sessionId` actuel a démarré, et non par les
  écritures ultérieures de métadonnées.
- **Réinitialisation après inactivité** (`mode: "idle"`) - nouvelle session
  après `session.reset.idleMinutes` minutes d’inactivité. La validité liée à
  l’inactivité est déterminée par la dernière interaction réelle avec un
  utilisateur ou un canal ; les événements système Heartbeat, Cron et
  d’exécution ne maintiennent donc pas la session active.
- **Réinitialisation manuelle** - saisissez `/new` ou `/reset` dans la
  discussion. `/new <model>` change également de modèle.

Lorsque les réinitialisations quotidienne et après inactivité sont toutes deux
configurées, la première arrivée à expiration l’emporte. Les tours liés aux
événements système Heartbeat, Cron, d’exécution et autres peuvent écrire des
métadonnées de session, mais ces écritures ne prolongent pas la validité des
réinitialisations quotidienne ou après inactivité. Lorsqu’une réinitialisation
renouvelle la session, les notifications d’événements système en file d’attente
pour l’ancienne session sont supprimées afin que les mises à jour obsolètes en
arrière-plan ne soient pas ajoutées au début de la première invite de la
nouvelle session.

Les sessions disposant d’une session CLI active appartenant au fournisseur ne
sont pas interrompues par la valeur quotidienne implicite par défaut. Utilisez
`/reset` ou configurez explicitement `session.reset` lorsque ces sessions
doivent expirer selon une minuterie.

Remplacez la valeur par défaut selon le type de discussion ou le canal :

```json5
{
  session: {
    reset: { mode: "daily", atHour: 4 },
    resetByType: {
      group: { mode: "idle", idleMinutes: 120 },
      thread: { mode: "daily", atHour: 6 },
    },
    resetByChannel: {
      discord: { mode: "idle", idleMinutes: 10080 },
    },
  },
}
```

`resetByType` prend en charge `direct` (alias hérité `dm`), `group` et `thread`.
L’ancien paramètre de premier niveau `session.idleMinutes` continue de fonctionner comme alias de compatibilité pour
une valeur par défaut du mode d’inactivité lorsqu’aucun bloc `session.reset`/`resetByType` n’est défini.

## Emplacement de l’état

- **Lignes de session d’exécution :** `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- **Fichiers de transcription archivés :** `~/.openclaw/agents/<agentId>/sessions/`
- **Source de migration des lignes héritées :** `~/.openclaw/agents/<agentId>/sessions/sessions.json`

Les lignes de session de la base de données SQLite propre à chaque agent conservent des
horodatages de cycle de vie distincts :

- `sessionStartedAt` : moment où le `sessionId` actuel a commencé ; la réinitialisation quotidienne l’utilise.
- `lastInteractionAt` : dernière interaction de l’utilisateur ou du canal qui prolonge la durée d’inactivité.
- `updatedAt` : dernière modification de la ligne dans le stockage ; utile pour l’énumération et l’élagage, mais ne fait pas
  autorité pour déterminer l’actualité des réinitialisations quotidiennes ou pour inactivité.

Lors de la migration depuis d’anciennes installations, le démarrage du Gateway et `openclaw doctor
--fix` importent automatiquement dans SQLite les lignes de l’ancien fichier `sessions.json` et l’historique actif des transcriptions JSONL.
Les lignes dépourvues de `sessionStartedAt` sont complétées à partir de l’en-tête de session de la
transcription JSONL héritée lorsqu’il est disponible. Si une ancienne ligne ne comporte pas non plus
`lastInteractionAt`, l’actualité liée à l’inactivité se fonde sur cette heure de début de session,
et non sur des écritures de gestion ultérieures. Utilisez `openclaw doctor --session-sqlite inspect
--session-sqlite-all-agents` et la [séquence de migration de Doctor
](/fr/cli/doctor#session-sqlite-migration) lorsque vous souhaitez obtenir des preuves explicites
d’inspection ou de validation.

## Maintenance des sessions

OpenClaw limite le stockage des sessions au fil du temps au moyen de `session.maintenance`, dont les valeurs par défaut
sont présentées ci-dessous :

```json5
{
  session: {
    maintenance: {
      mode: "enforce", // "enforce" applique le nettoyage ; "warn" se contente de le signaler
      pruneAfter: "30d",
      maxEntries: 500,
    },
  },
}
```

Pour les limites de `maxEntries` adaptées à la production, les écritures d’exécution du Gateway utilisent une petite
marge haute et ramènent par lots le nombre d’entrées à la limite configurée.
Les lectures du stockage de sessions n’élaguent ni ne plafonnent les entrées au démarrage du Gateway, afin que
le démarrage et les sessions Cron isolées n’aient pas à supporter le coût d’un nettoyage complet du stockage.
`openclaw sessions cleanup --enforce` applique immédiatement la limite.

Les sessions de vérification d’exécution de modèle du Gateway ont une courte durée de vie par défaut. Les lignes correspondant à
`agent:*:explicit:model-run-<uuid>` utilisent une durée de conservation fixe de `24h`, mais le nettoyage
dépend de la pression : il ne supprime les anciennes lignes de vérification que lorsque la pression liée à la
maintenance ou à la limite des entrées de session est atteinte, et s’exécute avant le seuil d’âge plus général
des entrées obsolètes et la limite du nombre d’entrées. Les sessions normales directes, de groupe, de fil de discussion, Cron, de hook, Heartbeat,
ACP et de sous-agent n’héritent pas de cette durée de conservation de 24h.

La maintenance préserve les pointeurs durables vers les conversations externes, notamment les sessions de groupe
et les sessions de discussion limitées à un fil, tout en permettant aux entrées synthétiques Cron,
de hook, Heartbeat, ACP et de sous-agent d’expirer.

Si vous utilisiez auparavant l’isolation des DM et avez ensuite rétabli `session.dmScope` sur
`main`, prévisualisez les anciennes lignes de DM indexées par pair avec
`openclaw sessions cleanup --dry-run --fix-dm-scope`. L’application du même indicateur
retire ces anciennes lignes de DM directs et conserve leurs transcriptions sous forme d’archives
supprimées.

Prévisualisez toute opération de maintenance avec `openclaw sessions cleanup --dry-run`.

## Inspection des sessions

| Commande                   | Affiche                                                         |
| -------------------------- | --------------------------------------------------------------- |
| `openclaw status`          | Chemin du stockage de sessions et activité récente              |
| `openclaw sessions --json` | Toutes les sessions (filtrage avec `--active <minutes>`)         |
| `/status` dans le chat     | Utilisation du contexte, modèle et options                       |
| `/context list`            | Contenu de l’invite système                                     |

## Pour aller plus loin

- [Recherche de sessions](/concepts/session-search) - rappel en texte intégral dans les transcriptions passées
- [Élagage des sessions](/fr/concepts/session-pruning) - réduction des résultats des outils
- [Compaction](/fr/concepts/compaction) - résumé des longues conversations
- [Outils de session](/fr/concepts/session-tool) - outils d’agent pour le travail entre sessions
- [Analyse approfondie de la gestion des sessions](/fr/reference/session-management-compaction) -
  schéma de stockage, transcriptions, politique d’envoi, métadonnées d’origine et configuration avancée
- [Multi-agent](/fr/concepts/multi-agent) - routage et isolation des sessions entre les agents
- [Tâches en arrière-plan](/fr/automation/tasks) - création d’enregistrements de tâches avec des références de session par les travaux détachés
- [Routage des canaux](/fr/channels/channel-routing) - routage des messages entrants vers les sessions

## Contenu associé

- [Élagage des sessions](/fr/concepts/session-pruning)
- [Outils de session](/fr/concepts/session-tool)
- [File d’attente des commandes](/fr/concepts/queue)
