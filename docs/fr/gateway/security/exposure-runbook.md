---
read_when:
    - Exposition du Gateway via le réseau local, le tailnet, Tailscale Serve, Funnel ou un proxy inverse
    - Vérification d’un déploiement avant d’autoriser de vrais utilisateurs de messagerie
    - Annulation d’une configuration risquée d’accès à distance ou de messages privés
sidebarTitle: Exposure runbook
summary: Liste de contrôle préalable et de restauration avant d’exposer un Gateway OpenClaw au-delà de l’interface de bouclage
title: Guide opérationnel d’exposition du Gateway
x-i18n:
    generated_at: "2026-07-12T15:27:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: fb8e66af57e804325afc91281122b822183337177c734efe065c5fc18b175e72
    source_path: gateway/security/exposure-runbook.md
    workflow: 16
---

<Warning>
N’exposez le Gateway qu’après avoir déterminé qui peut y accéder, comment ces personnes sont
authentifiées, quels agents elles peuvent déclencher et quels outils ces agents peuvent
utiliser. En cas de doute, revenez à un accès limité à l’interface de bouclage et relancez l’audit.
</Warning>

Ce guide opérationnel transforme les recommandations générales de [sécurité](/fr/gateway/security) en une
liste de contrôle destinée aux opérateurs pour l’accès distant et l’exposition de la messagerie.

## Choisir le modèle d’exposition

Privilégiez le modèle le plus restrictif qui répond aux besoins du flux de travail.

| Modèle                     | Recommandé dans les cas suivants                         | Contrôles requis                                                                                                                                                      |
| -------------------------- | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bouclage + tunnel SSH      | Usage personnel, accès administrateur, débogage          | Conservez `gateway.bind: "loopback"` et établissez un tunnel vers `127.0.0.1:18789`                                                                                    |
| Bouclage + Tailscale Serve | Accès depuis un tailnet personnel à l’interface de contrôle/WebSocket | Maintenez le Gateway sur l’interface de bouclage uniquement ; les en-têtes d’identité Tailscale authentifient uniquement la surface WebSocket de l’interface de contrôle, pas les autres chemins d’authentification |
| Liaison tailnet/LAN        | Réseau privé dédié avec des appareils connus             | Authentification du Gateway, liste d’autorisation du pare-feu, aucune redirection de port public                                                                       |
| Proxy inverse de confiance | SSO/OIDC de l’organisation devant le Gateway              | Authentification `trusted-proxy`, `trustedProxies` stricts, règles de remplacement/suppression des en-têtes, utilisateurs autorisés explicitement                     |
| Internet public            | Déploiements rares et à haut risque                      | Proxy tenant compte de l’identité, TLS, limitations de débit, listes d’autorisation strictes, sessions non principales en bac à sable                                 |

Évitez toute redirection directe d’un port public vers le Gateway. Si un accès public est
requis, placez devant celui-ci un proxy tenant compte de l’identité et faites de ce proxy
le seul chemin réseau vers le Gateway.

## Inventaire préalable

Consignez les éléments suivants avant de modifier la liaison, le proxy, Tailscale ou la politique des canaux :

- Hôte du Gateway, utilisateur du système d’exploitation et répertoire d’état (par défaut `~/.openclaw`).
- URL et mode de liaison du Gateway (`gateway.bind` ; port par défaut `18789`).
- Mode d’authentification, source du jeton/mot de passe ou source d’identité du proxy de confiance.
- Chaque canal activé et s’il accepte les messages privés, les groupes ou les Webhooks.
- Agents accessibles aux expéditeurs non locaux.
- Profil d’outils, mode bac à sable et politique des outils avec privilèges élevés pour chaque agent accessible.
- Identifiants externes accessibles à ces agents.
- Emplacement de sauvegarde de `~/.openclaw/openclaw.json` et des identifiants.

Si plusieurs personnes peuvent envoyer des messages au bot, considérez cela comme une
autorité partagée et déléguée sur les outils, et non comme une isolation de l’hôte par utilisateur.

## Vérifications de référence

Exécutez les commandes suivantes avant d’ouvrir l’accès :

```bash
openclaw doctor
openclaw security audit
openclaw security audit --deep
openclaw health
```

Résolvez d’abord les constats critiques. N’acceptez les avertissements que s’ils sont intentionnels et
documentés pour le déploiement. Consultez les [vérifications de l’audit de sécurité](/fr/gateway/security/audit-checks)
pour connaître la signification de chaque `checkId` et sa clé de correction.

Pour valider la CLI à distance, transmettez explicitement les identifiants :

```bash
openclaw gateway probe --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

Ne supposez pas que les identifiants de la configuration locale s’appliquent à une URL distante explicite.

## Configuration minimale sécurisée

Utilisez cette structure comme point de départ pour les déploiements exposés :

```json5
{
  gateway: {
    bind: "loopback",
    auth: {
      mode: "token",
      token: "replace-with-a-long-random-token",
    },
  },
  session: {
    dmScope: "per-channel-peer",
  },
  agents: {
    defaults: {
      sandbox: { mode: "non-main" },
    },
  },
  tools: {
    profile: "messaging",
    exec: { security: "deny", ask: "always" },
    elevated: { enabled: false },
  },
}
```

Élargissez un seul contrôle à la fois : ajoutez une liste d’autorisation pour un canal précis avant d’activer
des outils capables d’écrire, ou activez un proxy inverse avant d’accepter du trafic distant vers
l’interface de contrôle.

`tools.exec.security: "deny"` bloque tous les appels d’exécution, y compris les diagnostics
sans danger. Si des diagnostics ou des commandes à faible risque sont nécessaires, n’assouplissez ce paramètre
qu’après avoir choisi les expéditeurs, agents, commandes et modes d’approbation précis qui
correspondent à votre modèle de menace.

## Exposition des messages privés et des groupes

Les canaux de messagerie constituent des surfaces d’entrée non fiables. Avant d’autoriser les messages privés ou
les groupes :

- Préférez `dmPolicy: "pairing"` ou une liste `allowFrom` stricte à `dmPolicy: "open"`.
- Ne combinez pas des listes d’autorisation contenant `"*"` avec un accès étendu aux outils.
- Exigez des mentions dans les groupes, sauf si le salon est strictement contrôlé.
- Définissez `session.dmScope: "per-channel-peer"` (ou `"per-account-channel-peer"` pour les
  canaux multicomptes) lorsque plusieurs personnes peuvent envoyer des messages privés au bot, afin que les sessions de
  messages privés ne partagent pas leur contexte.
- Acheminez les canaux partagés vers des agents disposant d’un minimum d’outils et d’aucun
  identifiant personnel.

L’appairage autorise l’expéditeur à déclencher le bot. Il ne fait pas de cet expéditeur une
frontière de sécurité hôte distincte.

## Vérifications du proxy inverse

Pour les proxys tenant compte de l’identité :

- Le proxy doit authentifier les utilisateurs avant de transmettre les requêtes au Gateway.
- Le pare-feu ou la politique réseau doit bloquer l’accès direct au port du Gateway.
- `gateway.trustedProxies` doit répertorier uniquement les adresses IP sources du proxy.
- Le proxy doit supprimer ou remplacer les en-têtes d’identité et de transfert
  fournis par le client.
- Définissez `gateway.auth.trustedProxy.allowUsers` lorsque le proxy dessert plusieurs
  publics.
- Utilisez `gateway.auth.trustedProxy.allowLoopback` uniquement pour un proxy situé sur le même hôte,
  lorsque les processus locaux sont considérés comme fiables et que le proxy contrôle les en-têtes d’identité.

Exécutez `openclaw security audit --deep` après toute modification du proxy. Les constats relatifs au
proxy de confiance sont particulièrement significatifs, car le proxy devient la frontière
d’authentification.

## Examen des outils et du bac à sable

Avant d’exposer un agent à des expéditeurs distants :

- Vérifiez quelles sessions s’exécutent sur l’hôte et lesquelles s’exécutent dans le bac à sable.
- Refusez l’exécution sur l’hôte ou exigez une approbation.
- Maintenez les outils avec privilèges élevés désactivés, sauf si un expéditeur précis et de confiance en a besoin.
- Évitez les outils de navigateur, canevas, Node, Cron, Gateway et création de session pour les surfaces de
  messagerie ouvertes ou semi-ouvertes.
- Limitez strictement les montages de liaison ; évitez les chemins des identifiants, du répertoire personnel, du socket Docker et du
  système.
- Utilisez des Gateways, des utilisateurs du système d’exploitation ou des hôtes distincts pour des frontières de confiance
  sensiblement différentes.

Si les utilisateurs distants ne sont pas entièrement fiables, l’isolation doit provenir de
déploiements distincts, et non uniquement d’instructions ou d’étiquettes de session.

## Validation après modification

Après chaque modification de l’exposition :

1. Relancez `openclaw security audit --deep`.
2. Vérifiez qu’une connexion autorisée aboutit.
3. Vérifiez qu’un expéditeur ou une session de navigateur non autorisé est refusé.
4. Vérifiez que les journaux masquent les secrets.
5. Vérifiez que l’acheminement des messages privés/groupes atteint uniquement l’agent prévu.
6. Vérifiez que les outils à fort impact demandent une approbation ou sont refusés.
7. Documentez les avertissements résiduels acceptés.

Ne passez pas à la modification d’exposition suivante tant que la modification actuelle n’est pas
comprise.

## Plan de retour arrière

Si le Gateway risque d’être surexposé :

```json5
{
  gateway: {
    bind: "loopback",
  },
  channels: {
    whatsapp: { dmPolicy: "disabled" },
    telegram: { dmPolicy: "disabled" },
    discord: { dmPolicy: "disabled" },
    slack: { dmPolicy: "disabled" },
  },
  tools: {
    exec: { security: "deny", ask: "always" },
    elevated: { enabled: false },
  },
}
```

Ensuite :

1. Arrêtez la redirection publique, Tailscale Funnel ou les routes du proxy inverse.
2. Renouvelez les jetons/mots de passe du Gateway et les identifiants d’intégration concernés.
3. Supprimez `"*"` et les expéditeurs inattendus des listes d’autorisation.
4. Examinez les journaux d’audit récents, l’historique des exécutions, les appels d’outils et les modifications de configuration.
5. Relancez `openclaw security audit --deep`.
6. Réactivez l’accès avec le modèle le plus restrictif qui répond aux besoins du flux de travail.

## Liste de contrôle de l’examen

- Le Gateway reste limité à l’interface de bouclage, sauf raison documentée.
- L’accès hors bouclage dispose d’une authentification, d’un filtrage par pare-feu et d’aucune route publique directe.
- Les déploiements avec proxy de confiance disposent d’adresses IP de proxy strictes et de contrôles des en-têtes.
- Les messages privés utilisent l’appairage ou des listes d’autorisation, et non un accès ouvert par défaut.
- Les groupes exigent des mentions ou des listes d’autorisation explicites.
- Les canaux partagés n’accèdent pas aux identifiants personnels.
- Les sessions non principales s’exécutent en mode bac à sable.
- L’exécution sur l’hôte et les outils avec privilèges élevés sont refusés ou soumis à approbation.
- Les journaux masquent les secrets.
- Les constats critiques de l’audit sont résolus.
- Les étapes de retour arrière sont testées et documentées.
