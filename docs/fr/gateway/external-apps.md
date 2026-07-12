---
read_when:
    - Vous développez une application externe, un script, un tableau de bord, une tâche de CI ou une extension d’IDE qui communique avec OpenClaw
    - Vous choisissez entre le RPC du Gateway et le SDK de Plugin
    - Vous intégrez des exécutions d’agent, des sessions, des événements, des approbations, des modèles ou des outils du Gateway
    - Vous associez un contrôleur d’hébergement à un planificateur de réveil externe
sidebarTitle: External apps
summary: Voie d’intégration actuelle pour les applications externes, les scripts, les tableaux de bord, les tâches de CI et les extensions d’IDE
title: Intégrations du Gateway pour les applications externes
x-i18n:
    generated_at: "2026-07-12T02:35:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0034db64dea64f8c5c400cf2adc69c6e046d0cd574914fe7497099018cb28745
    source_path: gateway/external-apps.md
    workflow: 16
---

Les applications externes communiquent avec OpenClaw via le protocole Gateway : un transport WebSocket associé à des méthodes RPC. Utilisez-le lorsqu’un script, un tableau de bord, une tâche de CI, une extension d’IDE ou un autre processus doit démarrer des exécutions d’agent, diffuser des événements en continu, attendre des résultats, annuler des travaux ou inspecter les ressources du Gateway.

<Warning>
  Il n’existe pas encore de package client npm public. N’ajoutez pas de noms de
  packages clients OpenClaw aux dépendances de l’application avant que les notes
  de version n’annoncent la publication d’un package et que cette page ne
  contienne des instructions d’installation.
</Warning>

<Note>
  Cette page concerne le code exécuté en dehors du processus OpenClaw. Le code
  d’un Plugin exécuté dans OpenClaw doit plutôt utiliser les sous-chemins
  `openclaw/plugin-sdk/*` documentés.
</Note>

## Ce qui est disponible aujourd’hui

| Interface                               | État      | Utilisation                                                                                                     |
| --------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------- |
| [Protocole Gateway](/fr/gateway/protocol)  | Disponible | Transport WebSocket, négociation de connexion, portées d’authentification, gestion des versions du protocole et événements. |
| [Référence RPC du Gateway](/fr/reference/rpc) | Disponible | Méthodes actuelles du Gateway pour les agents, sessions, tâches, modèles, outils, artefacts et approbations. |
| [`openclaw agent`](/fr/cli/agent)          | Disponible | Intégration ponctuelle dans un script lorsque l’appel de la CLI depuis un shell suffit.                         |
| [`openclaw message`](/fr/cli/message)      | Disponible | Envoi de messages ou d’actions de canal depuis des scripts.                                                     |

Un futur package de bibliothèque cliente est en cours de développement en interne, mais il ne constitue pas encore une interface d’installation publique. Considérez-le comme un détail d’implémentation en préversion jusqu’à ce qu’une version annonce un package publié et versionné.

## Procédure recommandée

1. Exécutez ou découvrez un Gateway.
2. Connectez-vous via le [protocole Gateway](/fr/gateway/protocol).
3. Appelez les méthodes RPC documentées dans la [référence RPC du Gateway](/fr/reference/rpc).
4. Épinglez la version d’OpenClaw sur laquelle vous effectuez vos tests.
5. Consultez de nouveau la référence RPC lors de la mise à niveau d’OpenClaw.

Pour les exécutions d’agent, commencez par le RPC `agent` et associez-le à `agent.wait` pour obtenir un résultat terminal. Pour conserver durablement l’état des conversations, utilisez les méthodes `sessions.*`. Pour les intégrations d’interface utilisateur, abonnez-vous aux événements du Gateway et affichez uniquement les familles d’événements comprises par votre application.

## Suspension coopérative de l’hôte

Les contrôleurs d’hébergement qui figent ou prennent un instantané d’un processus en cours d’exécution peuvent utiliser la négociation de suspension indépendante de l’hôte :

1. Cessez d’accepter le trafic entrant externe contrôlé par l’hôte.
2. Appelez `gateway.suspend.prepare` avec un `requestId` stable et unique.
3. Si la réponse est `busy`, laissez le processus s’exécuter et réessayez ultérieurement.
4. Si elle est `ready`, enregistrez le `suspensionId` renvoyé, puis figez le
   processus ou prenez-en un instantané avant `expiresAtMs`.
5. Après la reprise, ou si la suspension est abandonnée, appelez
   `gateway.suspend.resume` avec ce `suspensionId` via le WebSocket existant ou
   le chemin de contrôle HTTP d’administration.

Un Gateway préparé rejette les nouvelles négociations WebSocket. Un contrôleur WebSocket doit maintenir sa connexion authentifiée ouverte pendant toute l’opération de l’hôte. Si cela ne peut pas être garanti, activez et utilisez le [Plugin RPC HTTP d’administration](/fr/plugins/admin-http-rpc) avant la préparation. Si le chemin de contrôle est perdu, attendez l’expiration du bail de deux minutes avant de vous reconnecter ; l’expiration rétablit automatiquement l’admission.

Le contrat RPC est le suivant :

- `gateway.suspend.prepare` — `operator.admin` ; paramètres
  `{ "requestId": "stable-host-operation-id" }`
- `gateway.suspend.status` — `operator.read` ; paramètres
  `{ "suspensionId": "id-from-prepare" }`
- `gateway.suspend.resume` — `operator.admin` ; paramètres
  `{ "suspensionId": "id-from-prepare" }`

Les identifiants sont débarrassés de leurs espaces aux extrémités, doivent contenir un caractère autre qu’un espace et sont limités à 128 caractères. Un résultat de préparation occupé comporte `status: "busy"`, `reason`, `retryAfterMs`, `activeCount` et `blockers`. Un résultat prêt présente la forme suivante :

```json
{
  "status": "ready",
  "suspensionId": "2c3f...",
  "expiresAtMs": 1770000000000,
  "activeCount": 0,
  "blockers": []
}
```

L’état renvoie `{"status":"running"}` ou un résultat prêt contenant `expiresAtMs`. La reprise renvoie `{"ok":true,"status":"running","resumed":true}` ; sa répétition après une reprise réussie renvoie `resumed: false`.

Un identifiant de requête concurrent ou un échec temporaire de reprise de l’ordonnanceur renvoie une erreur `UNAVAILABLE` réessayable avec `retryAfterMs`. Pendant la récupération de l’ordonnanceur, la préparation, la consultation de l’état et la reprise renvoient toutes cette erreur, le Gateway reste non prêt et fermé par défaut en cas d’échec, et l’hôte ne doit ni le figer ni en prendre un instantané. OpenClaw réessaie automatiquement de démarrer l’ordonnanceur et ne rétablit l’admission qu’après une récupération réussie. Un identifiant de reprise qui ne correspond pas renvoie `INVALID_REQUEST`. La préparation partage le budget d’écriture du plan de contrôle du Gateway, limité à trois tentatives par minute ; respectez le délai avant nouvelle tentative renvoyé. Les clients WebSocket sont regroupés par appareil et adresse IP. Les contrôleurs HTTP d’administration sont regroupés selon l’adresse IP cliente résolue ; plusieurs contrôleurs situés derrière un même proxy peuvent donc partager un budget.

La préparation ne fait que refuser les nouveaux travaux : OpenClaw ferme l’admission de nouvelles racines, sessions et commandes, suspend les déclenchements Cron automatiques et inspecte les travaux de manière synchrone. Si une activité est en cours, il reprend l’ordonnanceur et rétablit l’admission avant de renvoyer `busy` ; il n’interrompt pas ces travaux et n’attend pas leur achèvement. Un bail prêt dure deux minutes. La répétition de `prepare` avec le même `requestId` le renouvelle ; à son expiration, l’ordonnanceur reprend avant le rétablissement de l’admission.
Une émission de redémarrage qui devient exigible pendant un bail prêt attend la reprise du bail ; un redémarrage en cours entraîne le renvoi de `busy` par la préparation.

Lorsque l’état est prêt, `/healthz` reste opérationnel et `/readyz` renvoie `503`. Les réponses locales ou authentifiées de disponibilité incluent `gateway-draining` ; les sondes distantes non authentifiées reçoivent uniquement `{ "ready": false }`. La sonde d’intégrité HTTP, les méthodes de suspension sur les connexions WebSocket existantes et une route RPC HTTP d’administration déjà activée restent disponibles. Les autres RPC renvoient une erreur `UNAVAILABLE` réessayable. Les routes HTTP intégrées consacrées aux travaux des utilisateurs et les routes HTTP ordinaires des Plugins, notamment les API compatibles avec OpenAI, les opérations sur les outils et les sessions, la surveillance des Nodes et les hooks configurés, renvoient `503` avec `error.code: "gateway_unavailable"`. Les nouvelles mises à niveau WebSocket appartenant à des Plugins renvoient également `503` ; cela couvre la propriété de la mise à niveau, et non les travaux effectués ultérieurement via un socket de Plugin déjà établi.

Cette négociation ne conserve pas les messages entrants, n’arrête pas les transports de canaux tiers et ne contrôle pas la plateforme d’hébergement. L’hôte doit bloquer son trafic entrant avant la préparation et reste responsable du réveil, de la prise d’instantané ou du gel, ainsi que de l’arrêt. `activeCount` représente le nombre total de travaux suivis, tandis que `blockers` contient les nombres non nuls par catégorie et des détails de tâches limités. Il ne s’agit pas d’une barrière générale garantissant l’inactivité du processus. Un blocage `background-exec` est uniquement agrégé : le texte des commandes, les identifiants de processus, les sorties ainsi que les identifiants de session ou de portée ne transitent jamais par le protocole. L’intégrité des canaux, la maintenance, l’actualisation des caches, les sessions WebSocket de Plugins établies et les travaux d’arrière-plan non enregistrés appartenant aux Plugins peuvent rester actifs.
La plateforme d’hébergement doit figer ou prendre un instantané de l’intégralité de l’arborescence des processus et de son système de fichiers de manière cohérente ; ce premier contrat ne permet pas de prouver que les travaux non enregistrés sont inactifs.

<Tip>
  Pour la planification du réveil de l’hôte, conservez la partie tournée vers
  OpenClaw dans un Plugin intégré au processus et projetez des instantanés
  complets idempotents vers l’adaptateur externe de l’hôte. Le contrôleur
  d’hébergement ne doit pas importer le SDK de Plugin ni reconstruire l’état
  Cron à partir des différences entre événements. Consultez
  [Projection Cron externe sûre](/fr/plugins/hooks#safe-external-cron-projection).
</Tip>

## Code d’application ou code de Plugin

Utilisez les RPC du Gateway lorsque le code s’exécute en dehors d’OpenClaw :

- scripts Node qui démarrent ou observent des exécutions d’agent
- tâches de CI qui appellent un Gateway
- tableaux de bord et panneaux d’administration
- extensions d’IDE
- ponts externes qui n’ont pas besoin de devenir des Plugins de canal
- tests d’intégration utilisant des transports Gateway simulés ou réels

Utilisez le SDK de Plugin lorsque le code s’exécute dans OpenClaw :

- Plugins de fournisseur
- Plugins de canal
- hooks d’outil ou de cycle de vie
- Plugins de cadre d’exécution d’agent
- utilitaires d’exécution de confiance

Les applications externes ne doivent pas importer `openclaw/plugin-sdk/*` ; ces sous-chemins sont destinés aux Plugins chargés par OpenClaw.

## Voir aussi

- [Protocole Gateway](/fr/gateway/protocol)
- [Référence RPC du Gateway](/fr/reference/rpc)
- [Commande CLI d’agent](/fr/cli/agent)
- [Commande CLI de message](/fr/cli/message)
- [Boucle d’agent](/fr/concepts/agent-loop)
- [Environnements d’exécution des agents](/fr/concepts/agent-runtimes)
- [Sessions](/fr/concepts/session)
- [Tâches d’arrière-plan](/fr/automation/tasks)
- [Agents ACP](/fr/tools/acp-agents)
- [Présentation du SDK de Plugin](/fr/plugins/sdk-overview)
