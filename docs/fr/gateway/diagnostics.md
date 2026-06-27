---
read_when:
    - Préparer un rapport de bug ou une demande d’assistance
    - Débogage des plantages du Gateway, des redémarrages, de la pression mémoire ou des charges utiles surdimensionnées
    - Examen des données de diagnostic enregistrées ou expurgées
summary: Créer des lots de diagnostics Gateway partageables pour les rapports de bugs
title: Exportation des diagnostics
x-i18n:
    generated_at: "2026-06-27T17:29:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ce431bafa51a245f2a3829074b0ca92e2d30ddfc1ae9738eed46a4e51ae98208
    source_path: gateway/diagnostics.md
    workflow: 16
---

OpenClaw peut créer une archive zip de diagnostics locale pour les rapports de bug. Elle combine
l’état, la santé, les journaux, la forme de configuration et les événements de
stabilité récents sans charge utile du Gateway, avec assainissement.

Traitez les bundles de diagnostics comme des secrets jusqu’à les avoir examinés. Ils sont
conçus pour omettre ou caviarder les charges utiles et les identifiants, mais ils résument
tout de même les journaux locaux du Gateway et l’état d’exécution au niveau de l’hôte.

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

Les propriétaires peuvent utiliser `/diagnostics [note]` dans le chat pour demander une exportation locale du Gateway.
Utilisez-la lorsque le bug s’est produit dans une vraie conversation et que vous voulez un
rapport prêt à copier-coller pour le support :

1. Envoyez `/diagnostics` dans la conversation où vous avez remarqué le problème. Ajoutez une
   courte note si cela aide, par exemple `/diagnostics bad tool choice`.
2. OpenClaw envoie le préambule des diagnostics et demande une approbation explicite
   d’exécution. L’approbation exécute `openclaw gateway diagnostics export --json`.
   N’approuvez pas les diagnostics avec une règle d’autorisation globale.
3. Après l’approbation, OpenClaw répond avec un rapport collable contenant le chemin local
   du bundle, le résumé du manifeste, les notes de confidentialité et les identifiants de session pertinents.

Dans les chats de groupe, un propriétaire peut toujours exécuter `/diagnostics`, mais OpenClaw ne
publie pas les détails de diagnostic dans le chat partagé. Il envoie le préambule,
les invites d’approbation, le résultat d’exportation du Gateway et la ventilation des sessions/fils Codex
au propriétaire via la route d’approbation privée. Le groupe reçoit seulement un court avis
indiquant que le flux de diagnostics a été envoyé en privé. Si OpenClaw ne trouve pas de route privée
vers le propriétaire, la commande échoue en mode fermé et demande au propriétaire de l’exécuter depuis un message privé.

Lorsque la session OpenClaw active utilise le harnais OpenAI Codex natif,
la même approbation d’exécution couvre aussi un téléversement de commentaires OpenAI pour les fils d’exécution Codex
connus d’OpenClaw. Ce téléversement est distinct de l’archive zip locale du
Gateway et n’apparaît que pour les sessions du harnais Codex. Avant l’approbation, l’invite
explique qu’approuver les diagnostics enverra aussi des commentaires Codex, mais elle
ne liste pas les identifiants de session ou de fil Codex. Après l’approbation, la réponse de chat liste
les canaux, les identifiants de session OpenClaw, les identifiants de fil Codex et les commandes locales de reprise
pour les fils envoyés aux serveurs OpenAI. Si vous refusez ou ignorez
l’approbation, OpenClaw n’exécute pas l’exportation, n’envoie pas de commentaires Codex et
n’affiche pas les identifiants Codex.

Cela raccourcit la boucle de débogage Codex courante : remarquez le mauvais comportement dans
Telegram, Discord ou un autre canal, exécutez `/diagnostics`, approuvez une fois, partagez
le rapport avec le support, puis exécutez localement la commande `codex resume <thread-id>` affichée
si vous voulez inspecter vous-même le fil Codex natif. Consultez
[Harnais Codex](/fr/plugins/codex-harness#inspect-codex-threads-locally) pour
ce flux d’inspection.

## Ce que contient l’exportation

L’archive zip inclut :

- `summary.md` : vue d’ensemble lisible par un humain pour le support.
- `diagnostics.json` : résumé lisible par une machine de la configuration, des journaux, de l’état, de la santé
  et des données de stabilité.
- `manifest.json` : métadonnées d’exportation et liste des fichiers.
- Forme de configuration assainie et détails de configuration non secrets.
- Résumés de journaux assainis et lignes de journaux récentes caviardées.
- Instantanés de statut et de santé du Gateway au mieux.
- `stability/latest.json` : bundle de stabilité persistant le plus récent, lorsqu’il est disponible.

L’exportation est utile même lorsque le Gateway n’est pas sain. Si le Gateway ne peut pas
répondre aux requêtes d’état ou de santé, les journaux locaux, la forme de configuration et le
dernier bundle de stabilité sont tout de même collectés lorsqu’ils sont disponibles.

## Modèle de confidentialité

Les diagnostics sont conçus pour être partageables. L’exportation conserve les données opérationnelles
qui aident au débogage, comme :

- noms de sous-systèmes, identifiants de plugins, identifiants de fournisseurs, identifiants de canaux et modes configurés
- codes d’état, durées, nombres d’octets, état de file d’attente et relevés mémoire
- métadonnées de journaux assainies et messages opérationnels caviardés
- forme de configuration et paramètres de fonctionnalités non secrets

L’exportation omet ou caviarde :

- texte de chat, prompts, instructions, corps de webhook et sorties d’outils
- identifiants, clés API, jetons, cookies et valeurs secrètes
- corps bruts de requête ou de réponse
- identifiants de compte, identifiants de message, identifiants de session bruts, noms d’hôte et noms d’utilisateur locaux

Lorsqu’un message de journal ressemble à du texte utilisateur, de chat, de prompt ou de charge utile d’outil,
l’exportation conserve seulement le fait qu’un message a été omis et le nombre d’octets.

## Enregistreur de stabilité

Le Gateway enregistre par défaut un flux de stabilité borné, sans charge utile, lorsque
les diagnostics sont activés. Il sert aux faits opérationnels, pas au contenu.

Le même Heartbeat de diagnostic enregistre des échantillons de disponibilité lorsque le Gateway continue
de s’exécuter mais que la boucle d’événements Node.js ou le CPU semble saturé. Ces événements
`diagnostic.liveness.warning` incluent le délai de boucle d’événements, l’utilisation de la boucle d’événements,
le ratio de cœurs CPU, les nombres de sessions actives/en attente/en file, la phase actuelle
de démarrage/exécution lorsqu’elle est connue, les plages de phase récentes et des libellés bornés
du travail actif/en file. Les échantillons inactifs restent dans la télémétrie au niveau `info`. Les échantillons de disponibilité
deviennent des avertissements Gateway uniquement lorsque du travail est en attente ou en file, ou lorsque du travail actif
chevauche un délai soutenu de boucle d’événements. Les pics transitoires de délai maximal pendant
un travail d’arrière-plan par ailleurs sain restent dans les journaux de débogage. Ils ne redémarrent pas
le Gateway à eux seuls.

Les phases de démarrage émettent aussi des événements `diagnostic.phase.completed` avec les mesures en temps réel et
CPU. Les diagnostics d’exécution intégrée bloquée marquent `terminalProgressStale=true`
lorsque la dernière progression du bridge semblait terminale, comme un élément de réponse brut ou
un événement de fin de réponse, mais que le Gateway considère encore l’exécution intégrée
comme active.

Inspecter l’enregistreur en direct :

```bash
openclaw gateway stability
openclaw gateway stability --type payload.large
openclaw gateway stability --json
```

Inspecter le bundle de stabilité persistant le plus récent après une sortie fatale, un délai d’arrêt
ou un échec de démarrage après redémarrage :

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

- `--output <path>` : écrire vers un chemin d’archive zip précis.
- `--log-lines <count>` : nombre maximal de lignes de journal assainies à inclure.
- `--log-bytes <bytes>` : nombre maximal d’octets de journal à inspecter.
- `--url <url>` : URL WebSocket du Gateway pour les instantanés d’état et de santé.
- `--token <token>` : jeton du Gateway pour les instantanés d’état et de santé.
- `--password <password>` : mot de passe du Gateway pour les instantanés d’état et de santé.
- `--timeout <ms>` : délai d’attente des instantanés d’état et de santé.
- `--no-stability-bundle` : ignorer la recherche du bundle de stabilité persistant.
- `--json` : afficher des métadonnées d’exportation lisibles par une machine.

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

Désactiver les diagnostics réduit le détail des rapports de bug. Cela n’affecte pas la journalisation
normale du Gateway.

Les instantanés de pression mémoire critique sont désactivés par défaut. Pour conserver les événements
de diagnostics et capturer aussi l’instantané de stabilité pré-OOM :

```json5
{
  diagnostics: {
    memoryPressureSnapshot: true,
  },
}
```

Utilisez ceci uniquement sur des hôtes capables de tolérer l’analyse supplémentaire du système de fichiers et l’écriture
d’instantané pendant une pression mémoire critique. Les événements normaux de pression mémoire continuent
d’enregistrer le RSS, le tas, le seuil et les faits de croissance lorsque l’instantané est désactivé.

## Associés

- [Vérifications de santé](/fr/gateway/health)
- [CLI du Gateway](/fr/cli/gateway#gateway-diagnostics-export)
- [Protocole Gateway](/fr/gateway/protocol#system-and-identity)
- [Journalisation](/fr/logging)
- [Export OpenTelemetry](/fr/gateway/opentelemetry) — flux distinct pour diffuser les diagnostics vers un collecteur
