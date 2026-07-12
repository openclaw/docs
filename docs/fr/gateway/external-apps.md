---
read_when:
    - Vous développez une application externe, un script, un tableau de bord, une tâche CI ou une extension d’IDE qui communique avec OpenClaw
    - Vous choisissez entre le RPC du Gateway et le SDK de Plugin
    - Vous intégrez les exécutions d’agents, les sessions, les événements, les approbations, les modèles ou les outils du Gateway
    - Vous associez un contrôleur d’hébergement à un planificateur de réveil externe
sidebarTitle: External apps
summary: Parcours d’intégration actuel pour les applications externes, les scripts, les tableaux de bord, les tâches CI et les extensions d’IDE
title: Intégrations du Gateway pour les applications externes
x-i18n:
    generated_at: "2026-07-12T15:26:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 0034db64dea64f8c5c400cf2adc69c6e046d0cd574914fe7497099018cb28745
    source_path: gateway/external-apps.md
    workflow: 16
---

Les applications externes communiquent avec OpenClaw par l’intermédiaire du protocole Gateway : transport WebSocket et méthodes RPC. Utilisez-le lorsqu’un script, un tableau de bord, une tâche CI, une extension d’IDE ou un autre processus souhaite démarrer des exécutions d’agent, diffuser des événements, attendre des résultats, annuler des travaux ou inspecter les ressources du Gateway.

<Warning>
  Il n’existe pas encore de paquet client npm public. N’ajoutez pas de noms de
  paquets clients OpenClaw aux dépendances de l’application tant que les notes
  de version n’annoncent pas un paquet publié et que cette page ne contient pas
  d’instructions d’installation.
</Warning>

<Note>
  Cette page concerne le code situé en dehors du processus OpenClaw. Le code de
  Plugin exécuté dans OpenClaw doit plutôt utiliser les sous-chemins documentés
  `openclaw/plugin-sdk/*`.
</Note>

## Ce qui est disponible aujourd’hui

| Interface                               | État       | Utilisation                                                                                                  |
| --------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------ |
| [Protocole Gateway](/fr/gateway/protocol)  | Disponible | Transport WebSocket, négociation de connexion, portées d’authentification, versionnage du protocole et événements. |
| [Référence RPC du Gateway](/fr/reference/rpc) | Disponible | Méthodes actuelles du Gateway pour les agents, sessions, tâches, modèles, outils, artefacts et approbations. |
| [`openclaw agent`](/fr/cli/agent)          | Disponible | Intégration ponctuelle dans un script lorsque l’appel de la CLI depuis un shell suffit.                      |
| [`openclaw message`](/fr/cli/message)      | Disponible | Envoi de messages ou d’actions de canal depuis des scripts.                                                  |

Un futur paquet de bibliothèque cliente est en cours de développement en interne, mais il ne constitue pas encore une interface d’installation publique. Considérez-le comme un détail d’implémentation en préversion jusqu’à ce qu’une version annonce un paquet publié et versionné.

## Parcours recommandé

1. Exécutez ou découvrez un Gateway.
2. Connectez-vous via le [protocole Gateway](/fr/gateway/protocol).
3. Appelez les méthodes RPC documentées dans la [référence RPC du Gateway](/fr/reference/rpc).
4. Épinglez la version d’OpenClaw sur laquelle vous effectuez vos tests.
5. Consultez de nouveau la référence RPC lors de la mise à niveau d’OpenClaw.

Pour les exécutions d’agent, commencez par le RPC `agent` et associez-le à `agent.wait` pour obtenir un résultat terminal. Pour un état de conversation durable, utilisez les méthodes `sessions.*`. Pour les intégrations d’interface utilisateur, abonnez-vous aux événements du Gateway et affichez uniquement les familles d’événements comprises par votre application.

## Suspension coopérative de l’hôte

Les contrôleurs d’hébergement qui figent ou prennent un instantané d’un processus en cours d’exécution peuvent utiliser la négociation de suspension indépendante de l’hôte :

1. Cessez d’accepter le trafic entrant externe contrôlé par l’hôte.
2. Appelez `gateway.suspend.prepare` avec un `requestId` stable et unique.
3. Si la réponse est `busy`, laissez le processus s’exécuter et réessayez plus tard.
4. Si elle est `ready`, enregistrez le `suspensionId` renvoyé, puis figez le processus ou prenez-en un instantané avant `expiresAtMs`.
5. Après la reprise, ou si la suspension est abandonnée, appelez `gateway.suspend.resume` avec ce `suspensionId` via la connexion WebSocket existante ou le chemin de contrôle HTTP d’administration.

Un Gateway préparé rejette les nouvelles négociations WebSocket. Un contrôleur WebSocket doit maintenir sa connexion authentifiée ouverte pendant l’opération de l’hôte. Si cela ne peut pas être garanti, activez et utilisez le [Plugin RPC HTTP d’administration](/fr/plugins/admin-http-rpc) avant la préparation. Si le chemin de contrôle est perdu, attendez l’expiration du bail de deux minutes avant de vous reconnecter ; l’expiration rouvre automatiquement les admissions.

Le contrat RPC est le suivant :

- `gateway.suspend.prepare` — `operator.admin` ; paramètres
  `{ "requestId": "stable-host-operation-id" }`
- `gateway.suspend.status` — `operator.read` ; paramètres
  `{ "suspensionId": "id-from-prepare" }`
- `gateway.suspend.resume` — `operator.admin` ; paramètres
  `{ "suspensionId": "id-from-prepare" }`

Les identifiants sont nettoyés de leurs espaces en début et fin, doivent contenir un caractère autre qu’un espace et sont limités à 128 caractères. Un résultat de préparation occupé comporte `status: "busy"`, `reason`, `retryAfterMs`, `activeCount` et `blockers`. Un résultat prêt présente la forme suivante :

```json
{
  "status": "ready",
  "suspensionId": "2c3f...",
  "expiresAtMs": 1770000000000,
  "activeCount": 0,
  "blockers": []
}
```

L’état renvoie `{"status":"running"}` ou un résultat prêt comprenant `expiresAtMs`. La reprise renvoie `{"ok":true,"status":"running","resumed":true}` ; un nouvel appel après une reprise réussie renvoie `resumed: false`.

Un identifiant de requête concurrent ou un échec temporaire de reprise du planificateur renvoie l’erreur réessayable `UNAVAILABLE` avec `retryAfterMs`. Pendant la récupération du planificateur, la préparation, l’état et la reprise renvoient tous cette erreur, le Gateway reste non prêt et fermé en cas d’échec, et l’hôte ne doit ni le figer ni en prendre un instantané. OpenClaw réessaie automatiquement le planificateur et ne rouvre les admissions qu’après la réussite de la récupération. Un identifiant de reprise non concordant renvoie `INVALID_REQUEST`. La préparation partage le budget d’écriture du plan de contrôle du Gateway, limité à trois tentatives par minute ; respectez le délai de nouvelle tentative renvoyé. Les clients WebSocket sont regroupés par appareil et adresse IP. Les contrôleurs HTTP d’administration sont regroupés par adresse IP cliente résolue ; les contrôleurs situés derrière un même proxy peuvent donc partager un budget.

La préparation ne fait que refuser les nouvelles opérations : OpenClaw ferme les nouvelles admissions de racine, de session et de commande, suspend les déclenchements Cron automatiques et inspecte le travail de manière synchrone. Si une activité est en cours, il reprend le planificateur et rouvre les admissions avant de renvoyer `busy` ; il n’interrompt ni ne vide ce travail. Un bail prêt dure deux minutes. Répéter `prepare` avec le même `requestId` le renouvelle ; à l’expiration, le planificateur reprend avant la réouverture des admissions.
Une émission de redémarrage arrivant à échéance pendant un bail prêt attend la reprise du bail ; un redémarrage en cours entraîne le renvoi de `busy` par la préparation.

Pendant l’état prêt, `/healthz` reste actif et `/readyz` renvoie `503`. Les réponses de disponibilité locales ou authentifiées incluent `gateway-draining` ; les sondes distantes non authentifiées reçoivent uniquement `{ "ready": false }`. La sonde d’état HTTP, les méthodes de suspension sur les connexions WebSocket existantes et une route RPC HTTP d’administration déjà activée restent disponibles. Les autres RPC renvoient l’erreur réessayable `UNAVAILABLE`. Les routes HTTP intégrées dédiées aux travaux des utilisateurs et les routes HTTP ordinaires des plugins, notamment les API compatibles avec OpenAI, les opérations sur les outils et les sessions, les surveillances de nœuds et les hooks configurés, renvoient `503` avec `error.code: "gateway_unavailable"`. Les nouvelles mises à niveau WebSocket appartenant à des plugins renvoient également `503` ; cela couvre la propriété de la mise à niveau, et non le travail effectué ultérieurement via un socket de Plugin déjà établi.

Cette négociation ne conserve pas les messages entrants, n’arrête pas les transports de canaux tiers et ne contrôle pas la plateforme d’hébergement. L’hôte doit bloquer son trafic entrant avant la préparation et reste responsable du réveil, de l’instantané ou du gel, ainsi que de l’arrêt. `activeCount` correspond au nombre agrégé de travaux suivis, tandis que `blockers` contient les nombres non nuls par catégorie et des détails limités sur les tâches. Il ne s’agit pas d’une barrière générale de mise au repos du processus. Un blocage `background-exec` est uniquement agrégé : le texte de la commande, les identifiants de processus, la sortie ainsi que les identifiants de session ou de portée ne traversent jamais le protocole. L’état des canaux, la maintenance, l’actualisation du cache, les sessions WebSocket de Plugin établies et les travaux d’arrière-plan non enregistrés appartenant aux plugins peuvent rester actifs.
La plateforme d’hébergement doit figer ou prendre un instantané de l’intégralité de l’arborescence des processus et de son système de fichiers de manière cohérente ; ce premier contrat ne peut pas garantir que les travaux non enregistrés sont inactifs.

<Tip>
  Pour la planification du réveil de l’hôte, conservez la partie orientée
  OpenClaw dans un Plugin intégré au processus et projetez des instantanés
  complets idempotents vers l’adaptateur d’hôte externe. Le contrôleur
  d’hébergement ne doit pas importer le SDK de Plugin ni reconstruire l’état
  Cron à partir des deltas d’événements. Consultez [Projection Cron externe
  sûre](/fr/plugins/hooks#safe-external-cron-projection).
</Tip>

## Code d’application ou code de Plugin

Utilisez le RPC du Gateway lorsque le code se trouve en dehors d’OpenClaw :

- scripts Node qui démarrent ou observent des exécutions d’agent
- tâches CI qui appellent un Gateway
- tableaux de bord et panneaux d’administration
- extensions d’IDE
- passerelles externes qui n’ont pas besoin de devenir des plugins de canal
- tests d’intégration avec des transports Gateway simulés ou réels

Utilisez le SDK de Plugin lorsque le code s’exécute dans OpenClaw :

- plugins de fournisseur
- plugins de canal
- hooks d’outil ou de cycle de vie
- plugins d’environnement d’exécution d’agent
- assistants d’exécution de confiance

Les applications externes ne doivent pas importer `openclaw/plugin-sdk/*` ; ces sous-chemins sont destinés aux plugins chargés par OpenClaw.

## Pages connexes

- [Protocole Gateway](/fr/gateway/protocol)
- [Référence RPC du Gateway](/fr/reference/rpc)
- [Commande d’agent de la CLI](/fr/cli/agent)
- [Commande de message de la CLI](/fr/cli/message)
- [Boucle d’agent](/fr/concepts/agent-loop)
- [Environnements d’exécution d’agent](/fr/concepts/agent-runtimes)
- [Sessions](/fr/concepts/session)
- [Tâches d’arrière-plan](/fr/automation/tasks)
- [Agents ACP](/fr/tools/acp-agents)
- [Présentation du SDK de Plugin](/fr/plugins/sdk-overview)
