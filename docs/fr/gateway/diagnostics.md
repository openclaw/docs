---
read_when:
    - Préparer un rapport de bug ou une demande d’assistance
    - Débogage des plantages du Gateway, des redémarrages, de la pression mémoire ou des charges utiles surdimensionnées
    - Examiner quelles données de diagnostic sont enregistrées ou expurgées
summary: Créer des archives de diagnostic Gateway partageables pour les rapports de bogues
title: Exportation des diagnostics
x-i18n:
    generated_at: "2026-05-02T07:06:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4d1f7c1e1d96aeeebe30b30c8a23ec3c7b0fb4938f15a3783bf22e861770bf78
    source_path: gateway/diagnostics.md
    workflow: 16
---

OpenClaw peut créer un zip de diagnostics local pour les rapports de bug. Il combine
l’état du Gateway nettoyé, l’intégrité, les journaux, la forme de la configuration
et les événements de stabilité récents sans charge utile.

Traitez les lots de diagnostics comme des secrets jusqu’à ce que vous les ayez
examinés. Ils sont conçus pour omettre ou caviarder les charges utiles et les
identifiants, mais ils résument tout de même les journaux locaux du Gateway et
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

Les propriétaires peuvent utiliser `/diagnostics [note]` dans le chat pour demander un export local du Gateway.
Utilisez cette commande lorsque le bug s’est produit dans une vraie conversation et que vous voulez un rapport
copiable-collable pour le support :

1. Envoyez `/diagnostics` dans la conversation où vous avez remarqué le problème. Ajoutez une
   courte note si cela aide, par exemple `/diagnostics bad tool choice`.
2. OpenClaw envoie le préambule des diagnostics et demande une approbation d’exécution
   explicite. L’approbation exécute `openclaw gateway diagnostics export --json`.
   N’approuvez pas les diagnostics via une règle qui autorise tout.
3. Après approbation, OpenClaw répond avec un rapport collable contenant le chemin du lot
   local, le résumé du manifeste, les notes de confidentialité et les identifiants de session pertinents.

Dans les chats de groupe, un propriétaire peut toujours exécuter `/diagnostics`, mais OpenClaw ne
publie pas les détails de diagnostic dans le chat partagé. Il envoie le préambule,
les invites d’approbation, le résultat de l’export Gateway et la ventilation des sessions/fils Codex
au propriétaire via la route d’approbation privée. Le groupe ne reçoit qu’un bref avis
indiquant que le flux de diagnostics a été envoyé en privé. Si OpenClaw ne trouve pas de route privée
vers le propriétaire, la commande échoue de manière fermée et demande au propriétaire de l’exécuter depuis un DM.

Lorsque la session OpenClaw active utilise le harnais OpenAI Codex natif,
la même approbation d’exécution couvre aussi un envoi de commentaires OpenAI pour les fils d’exécution Codex
connus d’OpenClaw. Cet envoi est distinct du zip local du Gateway et n’apparaît que pour les sessions
du harnais Codex. Avant l’approbation, l’invite explique qu’approuver les diagnostics enverra aussi des commentaires Codex,
mais elle ne liste pas les identifiants de session ou de fil Codex. Après approbation, la réponse du chat liste
les canaux, les identifiants de session OpenClaw, les identifiants de fil Codex et les commandes de reprise locales
pour les fils qui ont été envoyés aux serveurs OpenAI. Si vous refusez ou ignorez
l’approbation, OpenClaw n’exécute pas l’export, n’envoie pas de commentaires Codex et
n’affiche pas les identifiants Codex.

Cela rend la boucle de débogage Codex courante courte : remarquez le mauvais comportement dans
Telegram, Discord ou un autre canal, exécutez `/diagnostics`, approuvez une fois, partagez
le rapport avec le support, puis exécutez localement la commande `codex resume <thread-id>` affichée
si vous voulez inspecter vous-même le fil Codex natif. Consultez
[harnais Codex](/fr/plugins/codex-harness#inspect-a-codex-thread-from-the-cli) pour
ce flux d’inspection.

## Ce que contient l’export

Le zip inclut :

- `summary.md` : vue d’ensemble lisible par un humain pour le support.
- `diagnostics.json` : résumé lisible par machine de la configuration, des journaux, de l’état, de l’intégrité
  et des données de stabilité.
- `manifest.json` : métadonnées d’export et liste des fichiers.
- Forme de configuration nettoyée et détails de configuration non secrets.
- Résumés de journaux nettoyés et lignes de journaux récentes caviardées.
- Instantanés d’état et d’intégrité du Gateway au mieux.
- `stability/latest.json` : lot de stabilité persistant le plus récent, quand il est disponible.

L’export est utile même lorsque le Gateway est en mauvais état. Si le Gateway ne peut pas
répondre aux requêtes d’état ou d’intégrité, les journaux locaux, la forme de la configuration et le dernier
lot de stabilité sont tout de même collectés quand ils sont disponibles.

## Modèle de confidentialité

Les diagnostics sont conçus pour être partageables. L’export conserve les données opérationnelles
qui aident au débogage, comme :

- noms de sous-systèmes, identifiants de plugins, identifiants de fournisseurs, identifiants de canaux et modes configurés
- codes d’état, durées, nombres d’octets, état des files d’attente et mesures mémoire
- métadonnées de journaux nettoyées et messages opérationnels caviardés
- forme de la configuration et paramètres de fonctionnalités non secrets

L’export omet ou caviarde :

- texte de chat, prompts, instructions, corps de Webhook et sorties d’outils
- identifiants, clés d’API, jetons, cookies et valeurs secrètes
- corps bruts de requête ou de réponse
- identifiants de compte, identifiants de message, identifiants de session bruts, noms d’hôte et noms d’utilisateur locaux

Lorsqu’un message de journal ressemble à du texte d’utilisateur, de chat, de prompt ou de charge utile d’outil,
l’export conserve seulement le fait qu’un message a été omis et le nombre d’octets.

## Enregistreur de stabilité

Le Gateway enregistre par défaut un flux de stabilité borné et sans charge utile lorsque
les diagnostics sont activés. Il concerne les faits opérationnels, pas le contenu.

Le même Heartbeat de diagnostic enregistre des échantillons de vivacité lorsque le Gateway continue de
fonctionner mais que la boucle d’événements Node.js ou le CPU semble saturé. Ces événements
`diagnostic.liveness.warning` incluent le délai de boucle d’événements, l’utilisation de la boucle d’événements,
le ratio de cœurs CPU et les nombres de sessions actives/en attente/en file d’attente. Les échantillons inactifs
restent dans la télémétrie au niveau `info` ; ils ne sont journalisés comme avertissements Gateway
que lorsque le travail de diagnostic est actif, en attente ou en file d’attente. Ils ne
redémarrent pas le Gateway par eux-mêmes.

Inspecter l’enregistreur en direct :

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

Inspecter le lot de stabilité persistant le plus récent après une sortie fatale, un délai d’arrêt
ou un échec de démarrage après redémarrage :

```bash
openclaw gateway stability --bundle latest
```

Créer un zip de diagnostics à partir du lot persistant le plus récent :

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
- `--log-lines <count>` : nombre maximal de lignes de journal nettoyées à inclure.
- `--log-bytes <bytes>` : nombre maximal d’octets de journal à inspecter.
- `--url <url>` : URL WebSocket du Gateway pour les instantanés d’état et d’intégrité.
- `--token <token>` : jeton Gateway pour les instantanés d’état et d’intégrité.
- `--password <password>` : mot de passe Gateway pour les instantanés d’état et d’intégrité.
- `--timeout <ms>` : délai d’attente des instantanés d’état et d’intégrité.
- `--no-stability-bundle` : ignorer la recherche de lot de stabilité persistant.
- `--json` : afficher les métadonnées d’export lisibles par machine.

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

Désactiver les diagnostics réduit le niveau de détail des rapports de bug. Cela n’affecte pas la journalisation
normale du Gateway.

## Connexe

- [Contrôles d’intégrité](/fr/gateway/health)
- [CLI Gateway](/fr/cli/gateway#gateway-diagnostics-export)
- [Protocole Gateway](/fr/gateway/protocol#system-and-identity)
- [Journalisation](/fr/logging)
- [Export OpenTelemetry](/fr/gateway/opentelemetry) — flux distinct pour diffuser les diagnostics vers un collecteur
