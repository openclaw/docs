---
read_when:
    - Préparer un rapport de bug ou une demande d’assistance
    - Débogage des plantages du Gateway, des redémarrages, de la pression mémoire ou des charges utiles surdimensionnées
    - Examiner les données de diagnostic enregistrées ou expurgées
summary: Créer des ensembles de diagnostic Gateway partageables pour les rapports de bogues
title: Export des diagnostics
x-i18n:
    generated_at: "2026-04-30T07:25:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: e66f1391da77e531b5d3b0ed19600da222d80960d1b6e54d51925c04b06dae46
    source_path: gateway/diagnostics.md
    workflow: 16
---

OpenClaw peut créer une archive zip de diagnostics locale pour les rapports de bug. Elle combine
l’état, la santé, les journaux, la forme de configuration et les événements récents de stabilité
sans charge utile du Gateway, avec assainissement.

Traitez les bundles de diagnostics comme des secrets tant que vous ne les avez pas examinés. Ils sont
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
Utilisez cette commande lorsque le bug s’est produit dans une conversation réelle et que vous souhaitez un
rapport unique, copiable-collable, pour le support :

1. Envoyez `/diagnostics` dans la conversation où vous avez remarqué le problème. Ajoutez une
   courte note si cela aide, par exemple `/diagnostics bad tool choice`.
2. OpenClaw envoie le préambule des diagnostics et demande une approbation `exec`
   explicite. L’approbation exécute `openclaw gateway diagnostics export --json`.
   N’approuvez pas les diagnostics au moyen d’une règle d’autorisation globale.
3. Après approbation, OpenClaw répond avec un rapport copiable contenant le chemin local
   du bundle, le résumé du manifeste, les notes de confidentialité et les identifiants de session pertinents.

Dans les chats de groupe, un propriétaire peut toujours exécuter `/diagnostics`, mais OpenClaw ne
publie pas les détails de diagnostic dans le chat partagé. Il envoie le préambule,
les invites d’approbation, le résultat de l’export du Gateway et la répartition des sessions/fils Codex au
propriétaire via la route d’approbation privée. Le groupe reçoit seulement une courte notification
indiquant que le flux de diagnostics a été envoyé en privé. Si OpenClaw ne trouve pas de route privée
vers le propriétaire, la commande échoue en mode fermé et demande au propriétaire de l’exécuter depuis un DM.

Lorsque la session OpenClaw active utilise le harnais natif OpenAI Codex,
la même approbation `exec` couvre également un envoi de feedback OpenAI pour les fils d’exécution Codex
connus d’OpenClaw. Cet envoi est séparé de l’archive zip locale du
Gateway et apparaît uniquement pour les sessions du harnais Codex. Avant l’approbation, l’invite
explique qu’approuver les diagnostics enverra également un feedback Codex, mais elle
ne liste pas les identifiants de session ou de fil Codex. Après approbation, la réponse dans le chat liste
les canaux, les identifiants de session OpenClaw, les identifiants de fil Codex et les commandes de reprise locales
pour les fils qui ont été envoyés aux serveurs OpenAI. Si vous refusez ou ignorez
l’approbation, OpenClaw n’exécute pas l’export, n’envoie pas de feedback Codex et
n’affiche pas les identifiants Codex.

Cela rend la boucle de débogage Codex courante très courte : remarquez le mauvais comportement dans
Telegram, Discord ou un autre canal, exécutez `/diagnostics`, approuvez une fois, partagez
le rapport avec le support, puis exécutez localement la commande `codex resume <thread-id>` affichée
si vous souhaitez inspecter vous-même le fil Codex natif. Consultez
[Harnais Codex](/fr/plugins/codex-harness#inspect-a-codex-thread-from-the-cli) pour
ce flux d’inspection.

## Ce que contient l’export

L’archive zip inclut :

- `summary.md` : aperçu lisible par un humain pour le support.
- `diagnostics.json` : résumé lisible par machine de la configuration, des journaux, de l’état, de la santé
  et des données de stabilité.
- `manifest.json` : métadonnées d’export et liste des fichiers.
- Forme de configuration assainie et détails de configuration non secrets.
- Résumés de journaux assainis et lignes de journal récentes expurgées.
- Instantanés de l’état et de la santé du Gateway, au mieux.
- `stability/latest.json` : bundle de stabilité persistant le plus récent, lorsqu’il est disponible.

L’export est utile même lorsque le Gateway est défaillant. Si le Gateway ne peut pas
répondre aux requêtes d’état ou de santé, les journaux locaux, la forme de configuration et le dernier
bundle de stabilité sont tout de même collectés lorsqu’ils sont disponibles.

## Modèle de confidentialité

Les diagnostics sont conçus pour être partageables. L’export conserve les données opérationnelles
qui aident au débogage, comme :

- noms de sous-systèmes, identifiants de Plugin, identifiants de fournisseur, identifiants de canal et modes configurés
- codes d’état, durées, nombres d’octets, état des files d’attente et mesures de mémoire
- métadonnées de journaux assainies et messages opérationnels expurgés
- forme de configuration et paramètres de fonctionnalités non secrets

L’export omet ou expurge :

- texte de chat, prompts, instructions, corps de Webhook et sorties d’outils
- identifiants, clés API, jetons, cookies et valeurs secrètes
- corps bruts de requête ou de réponse
- identifiants de compte, identifiants de message, identifiants de session bruts, noms d’hôte et noms d’utilisateur locaux

Lorsqu’un message de journal ressemble à du texte utilisateur, de chat, de prompt ou de charge utile d’outil, l’
export conserve seulement le fait qu’un message a été omis et le nombre d’octets.

## Enregistreur de stabilité

Le Gateway enregistre par défaut un flux de stabilité borné et sans charge utile lorsque
les diagnostics sont activés. Il est destiné aux faits opérationnels, pas au contenu.

Le même Heartbeat de diagnostic enregistre les avertissements de vivacité lorsque le Gateway continue
de s’exécuter mais que la boucle d’événements Node.js ou le CPU semble saturé. Ces
événements `diagnostic.liveness.warning` incluent le délai de boucle d’événements, l’utilisation de la boucle d’événements,
le ratio de cœurs CPU et les nombres de sessions actives/en attente/en file. Ils ne
redémarrent pas le Gateway par eux-mêmes.

Inspecter l’enregistreur en direct :

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

Inspecter le bundle de stabilité persistant le plus récent après une sortie fatale, un délai d’arrêt
dépassé ou un échec de démarrage au redémarrage :

```bash
openclaw gateway stability --bundle latest
```

Créer une archive zip de diagnostics à partir du bundle persistant le plus récent :

```bash
openclaw gateway stability --bundle latest --export
```

Les bundles persistants se trouvent sous `~/.openclaw/logs/stability/` lorsque des événements existent.

## Options utiles

```bash
openclaw gateway diagnostics export \
  --output openclaw-diagnostics.zip \
  --log-lines 5000 \
  --log-bytes 1000000
```

- `--output <path>` : écrire vers un chemin d’archive zip spécifique.
- `--log-lines <count>` : nombre maximal de lignes de journal assainies à inclure.
- `--log-bytes <bytes>` : nombre maximal d’octets de journal à inspecter.
- `--url <url>` : URL WebSocket du Gateway pour les instantanés d’état et de santé.
- `--token <token>` : jeton du Gateway pour les instantanés d’état et de santé.
- `--password <password>` : mot de passe du Gateway pour les instantanés d’état et de santé.
- `--timeout <ms>` : délai d’expiration des instantanés d’état et de santé.
- `--no-stability-bundle` : ignorer la recherche de bundle de stabilité persistant.
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

## Associés

- [Contrôles de santé](/fr/gateway/health)
- [CLI du Gateway](/fr/cli/gateway#gateway-diagnostics-export)
- [Protocole du Gateway](/fr/gateway/protocol#system-and-identity)
- [Journalisation](/fr/logging)
- [Export OpenTelemetry](/fr/gateway/opentelemetry) — flux séparé pour diffuser les diagnostics vers un collecteur
