---
read_when:
    - Préparer un rapport de bogue ou une demande d’assistance
    - Débogage des plantages du Gateway, des redémarrages, de la pression mémoire ou des charges utiles surdimensionnées
    - Examiner quelles données de diagnostic sont enregistrées ou expurgées
summary: Créer des bundles de diagnostic Gateway partageables pour les rapports de bogues
title: Export des diagnostics
x-i18n:
    generated_at: "2026-05-11T20:36:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: d6df695c590fd8239226e2e4d4e266a7b705f3963f00a005be38c526b1f28afb
    source_path: gateway/diagnostics.md
    workflow: 16
---

OpenClaw peut créer un fichier zip de diagnostics local pour les rapports de bug. Il combine
l’état, la santé, les journaux, la forme de configuration et les événements récents de
stabilité sans payload du Gateway, après assainissement.

Traitez les lots de diagnostics comme des secrets tant que vous ne les avez pas examinés. Ils sont
conçus pour omettre ou caviarder les payloads et les identifiants, mais ils résument tout de même
les journaux locaux du Gateway et l’état d’exécution au niveau de l’hôte.

## Démarrage rapide

```bash
openclaw gateway diagnostics export
```

La commande affiche le chemin du fichier zip écrit. Pour choisir un chemin :

```bash
openclaw gateway diagnostics export --output openclaw-diagnostics.zip
```

Pour l’automatisation :

```bash
openclaw gateway diagnostics export --json
```

## Commande de chat

Les propriétaires peuvent utiliser `/diagnostics [note]` dans le chat pour demander un export local du Gateway.
Utilisez cela lorsque le bug s’est produit dans une conversation réelle et que vous voulez un
rapport unique pouvant être copié-collé pour l’assistance :

1. Envoyez `/diagnostics` dans la conversation où vous avez remarqué le problème. Ajoutez une
   courte note si cela aide, par exemple `/diagnostics bad tool choice`.
2. OpenClaw envoie le préambule des diagnostics et demande une approbation explicite
   d’exécution. L’approbation exécute `openclaw gateway diagnostics export --json`.
   N’approuvez pas les diagnostics avec une règle d’autorisation globale.
3. Après approbation, OpenClaw répond avec un rapport collable contenant le chemin local
   du lot, le résumé du manifeste, les notes de confidentialité et les identifiants de session pertinents.

Dans les discussions de groupe, un propriétaire peut toujours exécuter `/diagnostics`, mais OpenClaw ne
publie pas les détails des diagnostics dans le chat partagé. Il envoie le préambule,
les invites d’approbation, le résultat de l’export du Gateway et le détail de session/fil Codex
au propriétaire via la route d’approbation privée. Le groupe reçoit seulement un court avis
indiquant que le flux de diagnostics a été envoyé en privé. Si OpenClaw ne trouve pas de route
propriétaire privée, la commande échoue fermement et demande au propriétaire de l’exécuter depuis un DM.

Lorsque la session OpenClaw active utilise le harnais OpenAI Codex natif,
la même approbation d’exécution couvre aussi un téléversement de feedback OpenAI pour les fils
d’exécution Codex connus d’OpenClaw. Ce téléversement est séparé du fichier zip local du
Gateway et apparaît uniquement pour les sessions du harnais Codex. Avant l’approbation, l’invite
explique que l’approbation des diagnostics enverra aussi du feedback Codex, mais elle
ne liste pas les identifiants de session ou de fil Codex. Après approbation, la réponse dans le chat liste
les canaux, les identifiants de session OpenClaw, les identifiants de fil Codex et les commandes locales
de reprise pour les fils envoyés aux serveurs OpenAI. Si vous refusez ou ignorez
l’approbation, OpenClaw n’exécute pas l’export, n’envoie pas de feedback Codex et
n’affiche pas les identifiants Codex.

Cela rend la boucle de débogage Codex courante courte : remarquez le mauvais comportement dans
Telegram, Discord ou un autre canal, exécutez `/diagnostics`, approuvez une fois, partagez
le rapport avec l’assistance, puis exécutez localement la commande `codex resume <thread-id>`
affichée si vous voulez inspecter vous-même le fil Codex natif. Consultez
[Harnais Codex](/fr/plugins/codex-harness#inspect-codex-threads-locally) pour
ce flux d’inspection.

## Ce que contient l’export

Le fichier zip inclut :

- `summary.md` : vue d’ensemble lisible par un humain pour l’assistance.
- `diagnostics.json` : résumé lisible par machine de la configuration, des journaux, de l’état, de la santé
  et des données de stabilité.
- `manifest.json` : métadonnées d’export et liste des fichiers.
- Forme de configuration assainie et détails de configuration non secrets.
- Résumés de journaux assainis et lignes de journaux récentes caviardées.
- Instantanés au mieux de l’état et de la santé du Gateway.
- `stability/latest.json` : lot de stabilité persistant le plus récent, lorsqu’il est disponible.

L’export est utile même lorsque le Gateway n’est pas sain. Si le Gateway ne peut pas
répondre aux demandes d’état ou de santé, les journaux locaux, la forme de configuration et le
dernier lot de stabilité sont tout de même collectés lorsqu’ils sont disponibles.

## Modèle de confidentialité

Les diagnostics sont conçus pour être partageables. L’export conserve les données opérationnelles
qui aident au débogage, comme :

- noms de sous-systèmes, identifiants de plugin, identifiants de fournisseur, identifiants de canal et modes configurés
- codes d’état, durées, nombres d’octets, état de file d’attente et mesures mémoire
- métadonnées de journaux assainies et messages opérationnels caviardés
- forme de configuration et paramètres de fonctionnalités non secrets

L’export omet ou caviarde :

- texte de chat, prompts, instructions, corps de Webhook et sorties d’outils
- identifiants, clés d’API, jetons, cookies et valeurs secrètes
- corps bruts de requête ou de réponse
- identifiants de compte, identifiants de message, identifiants de session bruts, noms d’hôte et noms d’utilisateur locaux

Lorsqu’un message de journal ressemble à du texte d’utilisateur, de chat, de prompt ou de payload d’outil, l’
export conserve seulement le fait qu’un message a été omis et le nombre d’octets.

## Enregistreur de stabilité

Le Gateway enregistre par défaut un flux de stabilité borné et sans payload lorsque
les diagnostics sont activés. Il est destiné aux faits opérationnels, pas au contenu.

Le même Heartbeat de diagnostic enregistre des échantillons de vivacité lorsque le Gateway continue
à fonctionner mais que la boucle d’événements Node.js ou le CPU semble saturé. Ces événements
`diagnostic.liveness.warning` incluent le délai de la boucle d’événements, l’utilisation de la boucle d’événements,
le ratio de cœurs CPU, le nombre de sessions actives/en attente/en file, la phase actuelle
de démarrage/exécution lorsqu’elle est connue, les spans de phases récents et des libellés bornés de travaux
actifs/en file. Les échantillons inactifs restent dans la télémétrie au niveau `info`. Les échantillons de vivacité
deviennent des avertissements Gateway uniquement lorsque du travail est en attente ou en file, ou lorsque du travail actif
chevauche un délai soutenu de la boucle d’événements. Les pics transitoires de délai maximal pendant un
travail d’arrière-plan par ailleurs sain restent dans les journaux de débogage. Ils ne redémarrent pas
le Gateway par eux-mêmes.

Les phases de démarrage émettent aussi des événements `diagnostic.phase.completed` avec la durée murale et
le temps CPU. Les diagnostics d’exécution embarquée bloquée marquent `terminalProgressStale=true`
lorsque la dernière progression du pont semblait terminale, comme un élément de réponse brut ou
un événement d’achèvement de réponse, mais que le Gateway considère encore l’exécution embarquée
comme active.

Inspectez l’enregistreur en direct :

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

Inspectez le lot de stabilité persistant le plus récent après une sortie fatale, un délai d’arrêt
ou un échec de démarrage après redémarrage :

```bash
openclaw gateway stability --bundle latest
```

Créez un fichier zip de diagnostics à partir du lot persistant le plus récent :

```bash
openclaw gateway stability --bundle latest --export
```

Les lots persistants résident sous `~/.openclaw/logs/stability/` lorsque des événements existent.

## Options utiles

```bash
openclaw gateway diagnostics export \
  --output openclaw-diagnostics.zip \
  --log-lines 5000 \
  --log-bytes 1000000
```

- `--output <path>` : écrire vers un chemin de zip spécifique.
- `--log-lines <count>` : nombre maximal de lignes de journaux assainies à inclure.
- `--log-bytes <bytes>` : nombre maximal d’octets de journaux à inspecter.
- `--url <url>` : URL WebSocket du Gateway pour les instantanés d’état et de santé.
- `--token <token>` : jeton du Gateway pour les instantanés d’état et de santé.
- `--password <password>` : mot de passe du Gateway pour les instantanés d’état et de santé.
- `--timeout <ms>` : délai d’expiration des instantanés d’état et de santé.
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

La désactivation des diagnostics réduit le niveau de détail des rapports de bug. Elle n’affecte pas la journalisation
normale du Gateway.

## Connexe

- [Contrôles de santé](/fr/gateway/health)
- [CLI du Gateway](/fr/cli/gateway#gateway-diagnostics-export)
- [Protocole du Gateway](/fr/gateway/protocol#system-and-identity)
- [Journalisation](/fr/logging)
- [Export OpenTelemetry](/fr/gateway/opentelemetry) — flux séparé pour transmettre les diagnostics en streaming à un collecteur
