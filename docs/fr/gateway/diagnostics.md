---
read_when:
    - Préparer un rapport de bug ou une demande d’assistance
    - Débogage des plantages et redémarrages du Gateway, de la pression mémoire ou des charges utiles surdimensionnées
    - Examiner quelles données de diagnostic sont enregistrées ou expurgées
summary: Créez des paquets de diagnostic du Gateway partageables pour les rapports de bogues
title: Exportation des diagnostics
x-i18n:
    generated_at: "2026-07-12T02:35:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ee9014da15368971d8257f62707f013b579e607fa0d8413db51253612f0c0957
    source_path: gateway/diagnostics.md
    workflow: 16
---

OpenClaw peut créer une archive de diagnostic locale `.zip` pour les rapports de bugs : état et santé du Gateway, journaux, structure de configuration et événements récents de stabilité sans charge utile, le tout assaini.

Traitez les archives de diagnostic comme des secrets jusqu’à leur examen. Les charges utiles et les identifiants sont expurgés par conception, mais l’archive résume tout de même les journaux locaux du Gateway et l’état d’exécution de l’hôte.

## Démarrage rapide

```bash
openclaw gateway diagnostics export
```

Affiche le chemin de l’archive zip créée. Pour choisir un chemin de sortie :

```bash
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
```

Pour l’automatisation :

```bash
openclaw gateway diagnostics export --json
```

## Commande de conversation

Les propriétaires peuvent exécuter `/diagnostics [note]` dans n’importe quelle conversation afin de demander une exportation locale du Gateway sous la forme d’un rapport d’assistance unique pouvant être copié-collé :

1. Envoyez `/diagnostics`, éventuellement accompagné d’une courte note (`/diagnostics mauvais choix d’outil`).
2. OpenClaw envoie un préambule et demande une approbation explicite unique pour l’exécution de `openclaw gateway diagnostics export --json`. N’approuvez pas les diagnostics au moyen d’une règle autorisant tout.
3. Après approbation, OpenClaw répond avec le chemin local de l’archive, un résumé du manifeste, des remarques relatives à la confidentialité et les identifiants de session pertinents.

Dans les conversations de groupe, un propriétaire peut également exécuter `/diagnostics`, mais OpenClaw lui envoie en privé le résultat de l’exportation, les demandes d’approbation et la répartition des sessions et fils Codex. Le groupe voit uniquement une courte notification indiquant que les diagnostics ont été envoyés en privé. Si aucune voie privée vers le propriétaire n’existe, la commande échoue de manière sécurisée et lui demande de l’exécuter depuis un message privé.

Lorsque la session active utilise l’environnement d’exécution OpenAI Codex natif, la même approbation d’exécution couvre également l’envoi à OpenAI d’un rapport concernant les fils Codex connus d’OpenClaw. Cet envoi est distinct de l’archive zip locale du Gateway et ne se produit que pour les sessions utilisant l’environnement d’exécution Codex. La demande d’approbation indique que l’approbation envoie également un rapport Codex, sans répertorier les identifiants de session ni de fil Codex. Après approbation, la réponse répertorie les canaux, les identifiants de session OpenClaw, les identifiants de fil Codex et les commandes locales de reprise correspondant aux fils envoyés à OpenAI. Refuser ou ignorer l’approbation empêche l’exportation, l’envoi du rapport Codex et l’affichage de la liste des identifiants Codex.

Cela raccourcit la boucle de débogage Codex : constatez un mauvais comportement dans un canal, exécutez `/diagnostics`, approuvez une fois, partagez le rapport, puis exécutez localement la commande `codex resume <thread-id>` affichée si vous souhaitez examiner vous-même le fil. Consultez [Environnement d’exécution Codex](/fr/plugins/codex-harness#inspect-codex-threads-locally).

## Contenu de l’exportation

- `summary.md` : vue d’ensemble lisible destinée à l’assistance.
- `diagnostics.json` : résumé exploitable par une machine de la configuration, des journaux, de l’état, de la santé et des données de stabilité.
- `manifest.json` : métadonnées de l’exportation et liste des fichiers.
- Structure de configuration assainie et détails de configuration non secrets.
- Résumés assainis des journaux et lignes récentes expurgées.
- Instantanés de l’état et de la santé du Gateway recueillis au mieux.
- `stability/latest.json` : archive de stabilité persistante la plus récente, lorsqu’elle est disponible.

L’exportation reste utile lorsque le Gateway est défaillant : si les requêtes d’état ou de santé échouent, les journaux locaux, la structure de configuration et la dernière archive de stabilité sont tout de même recueillis lorsqu’ils sont disponibles.

## Modèle de confidentialité

Conservés : noms des sous-systèmes, identifiants des plugins, identifiants des fournisseurs, identifiants des canaux, modes configurés, codes d’état, durées, nombres d’octets, état des files d’attente, mesures de mémoire, métadonnées assainies des journaux, messages opérationnels expurgés, structure de configuration et paramètres de fonctionnalités non secrets.

Omis ou expurgés : texte des conversations, invites, instructions, corps des webhooks, sorties des outils, identifiants, clés d’API, jetons, cookies, valeurs secrètes, corps bruts des requêtes et réponses, identifiants de compte, identifiants de message, identifiants de session bruts, noms d’hôte et noms d’utilisateur locaux.

Lorsqu’un message de journal semble contenir du texte provenant d’un utilisateur, d’une conversation, d’une invite ou de la charge utile d’un outil, l’exportation conserve uniquement l’indication qu’un message a été omis ainsi que son nombre d’octets.

## Enregistreur de stabilité

Par défaut, lorsque les diagnostics sont activés, le Gateway enregistre un flux de stabilité limité et dépourvu de charges utiles. Il capture des faits opérationnels, pas du contenu.

Le même Heartbeat échantillonne également l’activité lorsque la boucle d’événements ou le processeur semble saturé, en émettant des événements `diagnostic.liveness.warning` comprenant le retard de la boucle d’événements, son taux d’utilisation, le ratio des cœurs de processeur, le nombre de sessions actives, en attente et en file d’attente, la phase actuelle de démarrage ou d’exécution lorsqu’elle est connue, les intervalles de phases récents et des libellés de tâches limités. Ces événements ne deviennent des lignes de journal du Gateway de niveau `warn` que lorsque des tâches sont en attente ou en file d’attente, ou lorsque des tâches actives coïncident avec un retard prolongé de la boucle d’événements ; sinon, ils sont consignés au niveau `debug`. Les échantillons d’activité au repos sont tout de même enregistrés comme événements de diagnostic, mais ne déclenchent jamais d’eux-mêmes un avertissement.

Les phases de démarrage émettent des événements `diagnostic.phase.completed` comprenant les durées en temps réel et en temps processeur. Les diagnostics des exécutions intégrées bloquées définissent `terminalProgressStale=true` lorsque la dernière progression du pont semblait terminale, par exemple un élément de réponse brut ou un événement de fin de réponse, mais que le Gateway considère toujours l’exécution intégrée comme active.

Inspectez l’enregistreur en direct :

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

Inspectez l’archive persistante la plus récente après un arrêt fatal, un dépassement du délai d’arrêt ou un échec du démarrage après redémarrage :

```bash
openclaw gateway stability --bundle latest
```

Créez une archive zip de diagnostic à partir de l’archive persistante la plus récente :

```bash
openclaw gateway stability --bundle latest --export
```

Les archives persistantes se trouvent dans `~/.openclaw/logs/stability/` lorsqu’il existe des événements.

## Options utiles

```bash
openclaw gateway diagnostics export \
  --output openclaw-diagnostics.zip \
  --log-lines 5000 \
  --log-bytes 1000000
```

| Option                  | Valeur par défaut                                                            | Description                                                      |
| ----------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `--output <path>`       | `$OPENCLAW_STATE_DIR/logs/support/openclaw-diagnostics-<timestamp>-<pid>.zip` | Écrit dans un chemin d’archive zip précis ou dans un répertoire. |
| `--log-lines <count>`   | `5000`                                                                        | Nombre maximal de lignes de journal assainies à inclure.         |
| `--log-bytes <bytes>`   | `1000000`                                                                     | Nombre maximal d’octets de journaux à examiner.                  |
| `--url <url>`           | -                                                                             | URL WebSocket du Gateway pour les instantanés d’état et de santé. |
| `--token <token>`       | -                                                                             | Jeton du Gateway pour les instantanés d’état et de santé.        |
| `--password <password>` | -                                                                             | Mot de passe du Gateway pour les instantanés d’état et de santé. |
| `--timeout <ms>`        | `3000`                                                                        | Délai d’expiration des instantanés d’état et de santé.           |
| `--no-stability-bundle` | désactivé                                                                     | Ignore la recherche d’une archive de stabilité persistante.      |
| `--json`                | désactivé                                                                     | Affiche les métadonnées d’exportation exploitables par une machine. |

## Désactiver les diagnostics

Les diagnostics sont activés par défaut. Pour désactiver l’enregistreur de stabilité et la collecte des événements de diagnostic :

```json5
{
  diagnostics: {
    enabled: false,
  },
}
```

La désactivation des diagnostics réduit le niveau de détail des rapports de bugs ; elle n’affecte pas la journalisation normale du Gateway.

Les instantanés en cas de pression mémoire critique sont désactivés par défaut. Pour capturer l’instantané de stabilité précédant une erreur de mémoire insuffisante en plus des événements de diagnostic normaux :

```json5
{
  diagnostics: {
    memoryPressureSnapshot: true,
  },
}
```

Utilisez cette option uniquement sur les hôtes capables de supporter l’analyse supplémentaire du système de fichiers et l’écriture de l’instantané pendant une pression mémoire critique. Lorsque l’instantané est désactivé, les événements normaux de pression mémoire enregistrent tout de même les informations concernant le RSS, le tas, les seuils et la croissance (`rss_threshold`, `heap_threshold`, `rss_growth`).

## Voir aussi

- [Contrôles de santé](/fr/gateway/health)
- [CLI du Gateway](/fr/cli/gateway#gateway-diagnostics-export)
- [Protocole du Gateway](/fr/gateway/protocol#rpc-method-families)
- [Journalisation](/fr/logging)
- [Exportation OpenTelemetry](/fr/gateway/opentelemetry) - flux distinct permettant de transmettre les diagnostics en continu à un collecteur
