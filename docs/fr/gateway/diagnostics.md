---
read_when:
    - Préparer un rapport de bug ou une demande d’assistance
    - Débogage des plantages du Gateway, des redémarrages, de la pression mémoire ou des charges utiles surdimensionnées
    - Vérifier quelles données de diagnostic sont enregistrées ou expurgées
summary: Créer des paquets de diagnostics Gateway partageables pour les rapports de bogues
title: Export des diagnostics
x-i18n:
    generated_at: "2026-05-05T01:46:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 56539280bc7a7868063328626e63b2576feb5578e2651d3a2976ee9c34243382
    source_path: gateway/diagnostics.md
    workflow: 16
---

OpenClaw peut créer un zip de diagnostics local pour les rapports de bug. Il combine
l’état, la santé, les journaux, la structure de configuration et les événements
récents de stabilité sans charge utile du Gateway, avec nettoyage des données.

Traitez les bundles de diagnostics comme des secrets tant que vous ne les avez
pas examinés. Ils sont conçus pour omettre ou caviarder les charges utiles et les
identifiants, mais ils résument tout de même les journaux du Gateway local et
l’état d’exécution au niveau de l’hôte.

## Démarrage rapide

```bash
openclaw gateway diagnostics export
```

La commande affiche le chemin du zip écrit. Pour choisir un chemin :

```bash
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
```

Pour l’automatisation :

```bash
openclaw gateway diagnostics export --json
```

## Commande de chat

Les propriétaires peuvent utiliser `/diagnostics [note]` dans le chat pour demander
une exportation du Gateway local. Utilisez-la lorsque le bug s’est produit dans
une vraie conversation et que vous voulez un rapport unique à copier-coller pour
le support :

1. Envoyez `/diagnostics` dans la conversation où vous avez remarqué le problème. Ajoutez une
   courte note si cela aide, par exemple `/diagnostics bad tool choice`.
2. OpenClaw envoie le préambule de diagnostics et demande une approbation
   d’exécution explicite. L’approbation exécute `openclaw gateway diagnostics export --json`.
   N’approuvez pas les diagnostics au moyen d’une règle d’autorisation globale.
3. Après l’approbation, OpenClaw répond avec un rapport collable contenant le chemin
   du bundle local, le résumé du manifeste, les notes de confidentialité et les identifiants
   de session pertinents.

Dans les chats de groupe, un propriétaire peut toujours exécuter `/diagnostics`, mais OpenClaw ne
publie pas les détails des diagnostics dans le chat partagé. Il envoie le préambule,
les invites d’approbation, le résultat de l’exportation du Gateway et le détail des sessions/fils Codex au
propriétaire via la route d’approbation privée. Le groupe ne reçoit qu’un court avis
indiquant que le flux de diagnostics a été envoyé en privé. Si OpenClaw ne trouve pas de route privée
vers le propriétaire, la commande échoue de façon fermée et demande au propriétaire de l’exécuter depuis un DM.

Lorsque la session OpenClaw active utilise le harnais OpenAI Codex natif,
la même approbation d’exécution couvre aussi l’envoi d’un retour OpenAI pour les fils
d’exécution Codex qu’OpenClaw connaît. Cet envoi est distinct du zip du Gateway
local et n’apparaît que pour les sessions du harnais Codex. Avant l’approbation,
l’invite explique que l’approbation des diagnostics enverra aussi un retour Codex, mais elle
ne liste pas les identifiants de session ou de fil Codex. Après l’approbation, la réponse du chat liste
les canaux, les identifiants de session OpenClaw, les identifiants de fil Codex et les commandes de reprise
locales pour les fils qui ont été envoyés aux serveurs OpenAI. Si vous refusez ou ignorez
l’approbation, OpenClaw n’exécute pas l’exportation, n’envoie pas de retour Codex et
n’affiche pas les identifiants Codex.

Cela rend la boucle de débogage Codex courante courte : remarquez le mauvais comportement dans
Telegram, Discord ou un autre canal, exécutez `/diagnostics`, approuvez une fois, partagez
le rapport avec le support, puis exécutez localement la commande `codex resume <thread-id>` affichée
si vous voulez inspecter vous-même le fil Codex natif. Consultez
[Harnais Codex](/fr/plugins/codex-harness#inspect-a-codex-thread-from-the-cli) pour
ce flux d’inspection.

## Contenu de l’exportation

Le zip inclut :

- `summary.md` : vue d’ensemble lisible par un humain pour le support.
- `diagnostics.json` : résumé lisible par machine de la configuration, des journaux, de l’état, de la santé
  et des données de stabilité.
- `manifest.json` : métadonnées d’exportation et liste des fichiers.
- Structure de configuration nettoyée et détails de configuration non secrets.
- Résumés de journaux nettoyés et lignes de journal récentes caviardées.
- Instantanés d’état et de santé du Gateway au mieux.
- `stability/latest.json` : bundle de stabilité persisté le plus récent, lorsqu’il est disponible.

L’exportation est utile même lorsque le Gateway n’est pas sain. Si le Gateway ne peut pas
répondre aux requêtes d’état ou de santé, les journaux locaux, la structure de configuration et le dernier
bundle de stabilité sont tout de même collectés lorsqu’ils sont disponibles.

## Modèle de confidentialité

Les diagnostics sont conçus pour être partageables. L’exportation conserve les données opérationnelles
qui aident au débogage, telles que :

- noms de sous-systèmes, identifiants de plugin, identifiants de fournisseur, identifiants de canal et modes configurés
- codes d’état, durées, nombres d’octets, état de file d’attente et mesures mémoire
- métadonnées de journaux nettoyées et messages opérationnels caviardés
- structure de configuration et paramètres de fonctionnalités non secrets

L’exportation omet ou caviarde :

- texte de chat, prompts, instructions, corps de webhook et sorties d’outils
- identifiants, clés API, jetons, cookies et valeurs secrètes
- corps bruts de requête ou de réponse
- identifiants de compte, identifiants de message, identifiants de session bruts, noms d’hôte et noms d’utilisateur locaux

Lorsqu’un message de journal ressemble à du texte de charge utile utilisateur, de chat, de prompt ou d’outil, l’
exportation conserve uniquement le fait qu’un message a été omis et le nombre d’octets.

## Enregistreur de stabilité

Le Gateway enregistre par défaut un flux de stabilité borné, sans charge utile, lorsque
les diagnostics sont activés. Il porte sur des faits opérationnels, pas sur du contenu.

Le même Heartbeat de diagnostics enregistre des échantillons de vivacité lorsque le Gateway continue
de fonctionner mais que la boucle d’événements Node.js ou le CPU semble saturé. Ces événements
`diagnostic.liveness.warning` incluent le délai de la boucle d’événements, l’utilisation de la boucle d’événements,
le ratio de cœurs CPU, les nombres de sessions actives/en attente/en file, la phase actuelle
de démarrage/exécution lorsqu’elle est connue, les intervalles de phase récents et les libellés bornés des travaux
actifs/en file. Les échantillons inactifs restent dans la télémétrie au niveau `info`. Les échantillons de vivacité
deviennent des avertissements du Gateway uniquement lorsque du travail est en attente ou en file, ou lorsqu’un travail actif
coïncide avec un délai soutenu de la boucle d’événements. Les pics transitoires de délai maximal pendant
un travail d’arrière-plan autrement sain restent dans les journaux de débogage. Ils ne redémarrent pas le
Gateway à eux seuls.

Les phases de démarrage émettent aussi des événements `diagnostic.phase.completed` avec les temps d’horloge murale et
CPU. Les diagnostics d’exécution intégrée bloquée marquent `terminalProgressStale=true`
lorsque la dernière progression du pont semblait terminale, comme un élément de réponse brut ou
un événement d’achèvement de réponse, mais que le Gateway considère encore l’exécution intégrée
comme active.

Inspectez l’enregistreur en direct :

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

Inspectez le dernier bundle de stabilité persisté après une sortie fatale, un délai d’arrêt expiré
ou un échec de démarrage au redémarrage :

```bash
openclaw gateway stability --bundle latest
```

Créez un zip de diagnostics à partir du dernier bundle persisté :

```bash
openclaw gateway stability --bundle latest --export
```

Les bundles persistés se trouvent sous `~/.openclaw/logs/stability/` lorsque des événements existent.

## Options utiles

```bash
openclaw gateway diagnostics export \
  --output openclaw-diagnostics.zip \
  --log-lines 5000 \
  --log-bytes 1000000
```

- `--output <path>` : écrire vers un chemin zip spécifique.
- `--log-lines <count>` : nombre maximal de lignes de journal nettoyées à inclure.
- `--log-bytes <bytes>` : nombre maximal d’octets de journal à inspecter.
- `--url <url>` : URL WebSocket du Gateway pour les instantanés d’état et de santé.
- `--token <token>` : jeton du Gateway pour les instantanés d’état et de santé.
- `--password <password>` : mot de passe du Gateway pour les instantanés d’état et de santé.
- `--timeout <ms>` : délai d’expiration des instantanés d’état et de santé.
- `--no-stability-bundle` : ignorer la recherche de bundle de stabilité persisté.
- `--json` : afficher les métadonnées d’exportation lisibles par machine.

## Désactiver les diagnostics

Les diagnostics sont activés par défaut. Pour désactiver l’enregistreur de stabilité et
la collecte d’événements de diagnostic :

```json5
{
  diagnostics: {
    enabled: false,
  },
}
```

La désactivation des diagnostics réduit le niveau de détail des rapports de bug. Elle n’affecte pas la journalisation
normale du Gateway.

## Liens connexes

- [Vérifications de santé](/fr/gateway/health)
- [CLI du Gateway](/fr/cli/gateway#gateway-diagnostics-export)
- [Protocole du Gateway](/fr/gateway/protocol#system-and-identity)
- [Journalisation](/fr/logging)
- [Exportation OpenTelemetry](/fr/gateway/opentelemetry) — flux distinct pour diffuser les diagnostics vers un collecteur
