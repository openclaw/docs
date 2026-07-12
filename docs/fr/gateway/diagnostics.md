---
read_when:
    - Préparer un rapport de bug ou une demande d’assistance
    - Débogage des plantages et redémarrages du Gateway, de la pression mémoire ou des charges utiles surdimensionnées
    - Vérification des données de diagnostic enregistrées ou expurgées
summary: Créer des bundles de diagnostic du Gateway partageables pour les rapports de bogues
title: Exportation des diagnostics
x-i18n:
    generated_at: "2026-07-12T15:25:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: ee9014da15368971d8257f62707f013b579e607fa0d8413db51253612f0c0957
    source_path: gateway/diagnostics.md
    workflow: 16
---

OpenClaw peut générer une archive locale de diagnostic `.zip` pour les rapports de bogues : état du Gateway
assaini, santé, journaux, structure de configuration et événements récents de stabilité sans charge utile.

Traitez les archives de diagnostic comme des secrets jusqu’à leur examen. Les charges utiles et les identifiants
sont masqués par conception, mais l’archive résume tout de même les journaux locaux du Gateway et
l’état d’exécution au niveau de l’hôte.

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

## Commande de chat

Les propriétaires peuvent exécuter `/diagnostics [note]` dans n’importe quelle conversation pour demander une
exportation locale du Gateway sous la forme d’un rapport d’assistance unique pouvant être copié-collé :

1. Envoyez `/diagnostics`, éventuellement avec une courte note (`/diagnostics bad tool choice`).
2. OpenClaw envoie un préambule et demande une autorisation d’exécution explicite, qui lance
   `openclaw gateway diagnostics export --json`. N’autorisez pas les diagnostics au moyen
   d’une règle autorisant tout.
3. Après autorisation, OpenClaw répond avec le chemin local de l’archive, le résumé du manifeste,
   les remarques de confidentialité et les identifiants de session pertinents.

Dans les discussions de groupe, un propriétaire peut toujours exécuter `/diagnostics`, mais OpenClaw envoie
le résultat de l’exportation, les demandes d’autorisation et le détail des sessions/fils Codex
au propriétaire en privé. Le groupe ne voit qu’un bref avis indiquant que les diagnostics ont été envoyés
en privé. S’il n’existe aucun canal privé vers le propriétaire, la commande échoue de manière sécurisée et demande
au propriétaire de l’exécuter depuis un message privé.

Lorsque la session active utilise le harnais OpenAI Codex natif, la même autorisation
d’exécution couvre également l’envoi de commentaires à OpenAI pour les fils Codex connus
d’OpenClaw. Cet envoi est distinct de l’archive zip locale du Gateway et n’a lieu que
pour les sessions du harnais Codex. La demande d’autorisation précise que l’approbation
envoie également des commentaires Codex, sans énumérer les identifiants de session ou de fil Codex. Après
l’approbation, la réponse énumère les canaux, les identifiants de session OpenClaw, les identifiants de fil Codex et
les commandes locales de reprise pour les fils envoyés à OpenAI. Refuser ou
ignorer l’autorisation ignore l’exportation, l’envoi des commentaires Codex et la
liste des identifiants Codex.

Cela raccourcit la boucle de débogage Codex : constatez un mauvais comportement dans un canal,
exécutez `/diagnostics`, approuvez une fois, partagez le rapport, puis exécutez localement la commande
`codex resume <thread-id>` affichée si vous souhaitez examiner le fil
vous-même. Consultez [Harnais Codex](/fr/plugins/codex-harness#inspect-codex-threads-locally).

## Contenu de l’exportation

- `summary.md` : vue d’ensemble lisible par un humain pour l’assistance.
- `diagnostics.json` : résumé lisible par machine de la configuration, des journaux, de l’état, de la santé
  et des données de stabilité.
- `manifest.json` : métadonnées d’exportation et liste des fichiers.
- Structure de configuration assainie et détails de configuration non secrets.
- Résumés assainis des journaux et lignes de journal récentes masquées.
- Instantanés au mieux de l’état et de la santé du Gateway.
- `stability/latest.json` : archive de stabilité persistée la plus récente, lorsqu’elle est disponible.

L’exportation reste utile lorsque le Gateway est défaillant : si les requêtes d’état/de santé
échouent, les journaux locaux, la structure de configuration et la dernière archive de stabilité sont
tout de même collectés lorsqu’ils sont disponibles.

## Modèle de confidentialité

Conservés : noms des sous-systèmes, identifiants de Plugin, identifiants de fournisseur, identifiants de canal, modes
configurés, codes d’état, durées, nombres d’octets, état des files d’attente, mesures de mémoire,
métadonnées de journal assainies, messages opérationnels masqués, structure de configuration et
paramètres de fonctionnalités non secrets.

Omis ou masqués : texte des discussions, invites, instructions, corps de Webhook, sorties
des outils, identifiants, clés d’API, jetons, cookies, valeurs secrètes, corps bruts
des requêtes/réponses, identifiants de compte, identifiants de message, identifiants de session bruts,
noms d’hôte et noms d’utilisateur locaux.

Lorsqu’un message de journal ressemble à du texte provenant d’un utilisateur, d’une discussion, d’une invite ou d’une charge utile d’outil,
l’exportation conserve uniquement l’indication qu’un message a été omis ainsi que son nombre d’octets.

## Enregistreur de stabilité

Le Gateway enregistre par défaut un flux de stabilité limité et sans charge utile lorsque
les diagnostics sont activés. Il capture des faits opérationnels, pas du contenu.

Le même Heartbeat échantillonne également l’activité lorsque la boucle d’événements ou le processeur semble
saturé, en émettant des événements `diagnostic.liveness.warning` avec le délai de la boucle d’événements,
l’utilisation de la boucle d’événements, le ratio de cœurs de processeur, le nombre de sessions actives/en attente/en file,
la phase actuelle de démarrage/d’exécution (lorsqu’elle est connue), les intervalles de phase récents et
des libellés de travail limités. Ceux-ci deviennent des lignes de journal du Gateway de niveau `warn` uniquement lorsque
du travail est en attente ou en file, ou lorsque du travail actif coïncide avec un délai soutenu de la boucle d’événements ;
sinon, ils sont consignés au niveau `debug`. Les échantillons d’activité au repos sont tout de même enregistrés
comme événements de diagnostic, mais ne sont jamais élevés à eux seuls au niveau d’avertissement.

Les phases de démarrage émettent des événements `diagnostic.phase.completed` avec les temps écoulé et
processeur. Les diagnostics d’exécution intégrée bloquée définissent `terminalProgressStale=true`
lorsque la dernière progression du pont semblait terminale (par exemple, un élément de réponse brut
ou un événement d’achèvement de réponse), mais que le Gateway considère toujours
l’exécution intégrée comme active.

Inspectez l’enregistreur en direct :

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

Inspectez la dernière archive persistée après un arrêt fatal, un dépassement du délai d’arrêt ou
un échec du démarrage après redémarrage :

```bash
openclaw gateway stability --bundle latest
```

Créez une archive zip de diagnostic à partir de la dernière archive persistée :

```bash
openclaw gateway stability --bundle latest --export
```

Les archives persistées se trouvent sous `~/.openclaw/logs/stability/` lorsque des événements existent.

## Options utiles

```bash
openclaw gateway diagnostics export \
  --output openclaw-diagnostics.zip \
  --log-lines 5000 \
  --log-bytes 1000000
```

| Option                  | Valeur par défaut                                                            | Description                                                      |
| ----------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `--output <path>`       | `$OPENCLAW_STATE_DIR/logs/support/openclaw-diagnostics-<timestamp>-<pid>.zip` | Écrit dans un chemin d’archive zip précis (ou un répertoire).     |
| `--log-lines <count>`   | `5000`                                                                        | Nombre maximal de lignes de journal assainies à inclure.          |
| `--log-bytes <bytes>`   | `1000000`                                                                     | Nombre maximal d’octets de journal à inspecter.                   |
| `--url <url>`           | -                                                                             | URL WebSocket du Gateway pour les instantanés d’état/de santé.    |
| `--token <token>`       | -                                                                             | Jeton du Gateway pour les instantanés d’état/de santé.            |
| `--password <password>` | -                                                                             | Mot de passe du Gateway pour les instantanés d’état/de santé.     |
| `--timeout <ms>`        | `3000`                                                                        | Délai d’expiration des instantanés d’état/de santé.               |
| `--no-stability-bundle` | désactivé                                                                     | Ignore la recherche d’une archive de stabilité persistée.         |
| `--json`                | désactivé                                                                     | Affiche les métadonnées d’exportation lisibles par machine.       |

## Désactiver les diagnostics

Les diagnostics sont activés par défaut. Pour désactiver l’enregistreur de stabilité et
la collecte des événements de diagnostic :

```json5
{
  diagnostics: {
    enabled: false,
  },
}
```

La désactivation des diagnostics réduit le niveau de détail des rapports de bogues ; elle n’affecte pas la journalisation
normale du Gateway.

Les instantanés en cas de pression critique sur la mémoire sont désactivés par défaut. Pour capturer
l’instantané de stabilité précédant une saturation mémoire en plus des événements de diagnostic normaux :

```json5
{
  diagnostics: {
    memoryPressureSnapshot: true,
  },
}
```

Utilisez cette option uniquement sur des hôtes capables de tolérer l’analyse supplémentaire du système de fichiers et
l’écriture de l’instantané pendant une pression critique sur la mémoire. Les événements normaux de pression mémoire
enregistrent toujours la mémoire RSS, le tas, le seuil et les données de croissance (`rss_threshold`,
`heap_threshold`, `rss_growth`) lorsque l’instantané est désactivé.

## Voir aussi

- [Contrôles de santé](/fr/gateway/health)
- [CLI du Gateway](/fr/cli/gateway#gateway-diagnostics-export)
- [Protocole du Gateway](/fr/gateway/protocol#rpc-method-families)
- [Journalisation](/fr/logging)
- [Exportation OpenTelemetry](/fr/gateway/opentelemetry) - flux distinct pour transmettre les diagnostics en continu à un collecteur
