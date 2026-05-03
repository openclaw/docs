---
read_when:
    - Préparer un rapport de bug ou une demande d’assistance
    - Débogage des plantages du Gateway, des redémarrages, de la pression mémoire ou des charges utiles surdimensionnées
    - Examiner quelles données de diagnostic sont enregistrées ou masquées
summary: Créer des lots de diagnostics Gateway partageables pour les rapports de bogues
title: Exportation des diagnostics
x-i18n:
    generated_at: "2026-05-03T21:32:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: f6cf8e00fe8033e339b5c947ce3dd10fdee736048a358ad3a0c2ccb77e939f4b
    source_path: gateway/diagnostics.md
    workflow: 16
---

OpenClaw peut créer une archive zip de diagnostics locale pour les rapports de bogue. Elle combine
l’état, la santé, les journaux, la structure de configuration et les événements récents
de stabilité sans charge utile du Gateway, avec assainissement des données.

Traitez les lots de diagnostics comme des secrets tant que vous ne les avez pas examinés. Ils sont
conçus pour omettre ou expurger les charges utiles et les identifiants, mais ils résument tout de même
les journaux locaux du Gateway et l’état d’exécution au niveau de l’hôte.

## Démarrage rapide

```bash
openclaw gateway diagnostics export
```

La commande affiche le chemin de l’archive zip écrite. Pour choisir un chemin :

```bash
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
```

Pour l’automatisation :

```bash
openclaw gateway diagnostics export --json
```

## Commande de chat

Les propriétaires peuvent utiliser `/diagnostics [note]` dans le chat pour demander un export local du Gateway.
Utilisez ceci lorsque le bogue s’est produit dans une vraie conversation et que vous voulez un
rapport unique copiable-collable pour le support :

1. Envoyez `/diagnostics` dans la conversation où vous avez remarqué le problème. Ajoutez une
   courte note si cela aide, par exemple `/diagnostics bad tool choice`.
2. OpenClaw envoie le préambule des diagnostics et demande une approbation explicite
   d’exécution. L’approbation lance `openclaw gateway diagnostics export --json`.
   N’approuvez pas les diagnostics via une règle d’autorisation globale.
3. Après approbation, OpenClaw répond avec un rapport copiable contenant le chemin local
   du lot, un résumé du manifeste, des notes de confidentialité et les identifiants de session pertinents.

Dans les chats de groupe, un propriétaire peut toujours exécuter `/diagnostics`, mais OpenClaw ne
publie pas les détails de diagnostic dans le chat partagé. Il envoie le préambule,
les invites d’approbation, le résultat de l’export du Gateway et la répartition des sessions/fils Codex
au propriétaire via la route d’approbation privée. Le groupe reçoit seulement un court avis
indiquant que le flux de diagnostics a été envoyé en privé. Si OpenClaw ne trouve pas de route privée
vers le propriétaire, la commande échoue fermée et demande au propriétaire de l’exécuter depuis un DM.

Lorsque la session OpenClaw active utilise le harnais OpenAI Codex natif,
la même approbation d’exécution couvre aussi un téléversement de retour OpenAI pour les fils d’exécution
Codex connus d’OpenClaw. Ce téléversement est distinct de l’archive zip locale
du Gateway et n’apparaît que pour les sessions du harnais Codex. Avant l’approbation, l’invite
explique qu’approuver les diagnostics enverra également un retour Codex, mais elle
ne liste pas les identifiants de session ou de fil Codex. Après approbation, la réponse du chat liste
les canaux, les identifiants de session OpenClaw, les identifiants de fil Codex et les commandes locales
de reprise pour les fils qui ont été envoyés aux serveurs OpenAI. Si vous refusez ou ignorez
l’approbation, OpenClaw n’exécute pas l’export, n’envoie pas de retour Codex et
n’affiche pas les identifiants Codex.

Cela rend la boucle courante de débogage Codex courte : remarquez le mauvais comportement dans
Telegram, Discord ou un autre canal, exécutez `/diagnostics`, approuvez une fois, partagez
le rapport avec le support, puis exécutez localement la commande `codex resume <thread-id>`
affichée si vous voulez inspecter vous-même le fil Codex natif. Consultez
[Harnais Codex](/fr/plugins/codex-harness#inspect-a-codex-thread-from-the-cli) pour
ce flux d’inspection.

## Contenu de l’export

L’archive zip inclut :

- `summary.md` : vue d’ensemble lisible par un humain pour le support.
- `diagnostics.json` : résumé lisible par machine de la configuration, des journaux, de l’état, de la santé
  et des données de stabilité.
- `manifest.json` : métadonnées d’export et liste des fichiers.
- Structure de configuration assainie et détails de configuration non secrets.
- Résumés de journaux assainis et lignes récentes de journaux expurgées.
- Instantanés d’état et de santé du Gateway au mieux.
- `stability/latest.json` : lot de stabilité persistant le plus récent, lorsqu’il est disponible.

L’export est utile même lorsque le Gateway est défaillant. Si le Gateway ne peut pas
répondre aux requêtes d’état ou de santé, les journaux locaux, la structure de configuration et le dernier
lot de stabilité sont tout de même collectés lorsqu’ils sont disponibles.

## Modèle de confidentialité

Les diagnostics sont conçus pour être partageables. L’export conserve les données opérationnelles
qui aident au débogage, comme :

- les noms de sous-systèmes, les identifiants de plugins, les identifiants de fournisseurs, les identifiants de canaux et les modes configurés
- les codes d’état, les durées, les nombres d’octets, l’état de la file d’attente et les mesures de mémoire
- les métadonnées de journaux assainies et les messages opérationnels expurgés
- la structure de configuration et les paramètres de fonctionnalités non secrets

L’export omet ou expurge :

- le texte des chats, les prompts, les instructions, les corps de webhook et les sorties d’outils
- les identifiants, clés d’API, jetons, cookies et valeurs secrètes
- les corps bruts de requête ou de réponse
- les identifiants de compte, identifiants de message, identifiants bruts de session, noms d’hôte et noms d’utilisateur locaux

Lorsqu’un message de journal ressemble à du texte d’utilisateur, de chat, de prompt ou de charge utile d’outil,
l’export conserve seulement le fait qu’un message a été omis et le nombre d’octets.

## Enregistreur de stabilité

Le Gateway enregistre par défaut un flux de stabilité borné et sans charge utile lorsque
les diagnostics sont activés. Il sert aux faits opérationnels, pas au contenu.

Le même heartbeat de diagnostic enregistre des échantillons de vivacité lorsque le Gateway continue
de fonctionner mais que la boucle d’événements Node.js ou le CPU semble saturé. Ces événements
`diagnostic.liveness.warning` incluent le délai de boucle d’événements, l’utilisation de la boucle d’événements,
le ratio de cœurs CPU et les nombres de sessions actives/en attente/en file d’attente. Les échantillons inactifs
restent dans la télémétrie au niveau `info`. Les échantillons de vivacité deviennent des avertissements
du Gateway uniquement lorsque du travail est en attente ou en file d’attente, ou lorsque du travail actif se superpose à
un délai soutenu de la boucle d’événements. Les pics transitoires de délai maximal pendant un travail
d’arrière-plan par ailleurs sain restent dans les journaux de débogage. Ils ne redémarrent pas le Gateway
à eux seuls.

Inspecter l’enregistreur actif :

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

Inspecter le lot de stabilité persistant le plus récent après une sortie fatale, un délai d’arrêt
expiré ou un échec de démarrage après redémarrage :

```bash
openclaw gateway stability --bundle latest
```

Créer une archive zip de diagnostics à partir du lot persistant le plus récent :

```bash
openclaw gateway stability --bundle latest --export
```

Les lots persistants se trouvent sous `~/.openclaw/logs/stability/` lorsque des événements existent.

## Options utiles

```bash
openclaw gateway diagnostics export \
  --output openclaw-diagnostics.zip \
  --log-lines 5000 \
  --log-bytes 1000000
```

- `--output <path>` : écrire vers un chemin zip spécifique.
- `--log-lines <count>` : nombre maximal de lignes de journal assainies à inclure.
- `--log-bytes <bytes>` : nombre maximal d’octets de journal à inspecter.
- `--url <url>` : URL WebSocket du Gateway pour les instantanés d’état et de santé.
- `--token <token>` : jeton du Gateway pour les instantanés d’état et de santé.
- `--password <password>` : mot de passe du Gateway pour les instantanés d’état et de santé.
- `--timeout <ms>` : délai d’expiration des instantanés d’état et de santé.
- `--no-stability-bundle` : ignorer la recherche de lot de stabilité persistant.
- `--json` : afficher les métadonnées d’export lisibles par machine.

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

La désactivation des diagnostics réduit le niveau de détail des rapports de bogue. Elle n’affecte pas la journalisation
normale du Gateway.

## Liens connexes

- [Vérifications de santé](/fr/gateway/health)
- [CLI du Gateway](/fr/cli/gateway#gateway-diagnostics-export)
- [Protocole du Gateway](/fr/gateway/protocol#system-and-identity)
- [Journalisation](/fr/logging)
- [Export OpenTelemetry](/fr/gateway/opentelemetry) — flux séparé pour diffuser les diagnostics vers un collecteur
