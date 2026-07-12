---
read_when:
    - Exposition du Gateway sur le réseau local, le tailnet, Tailscale Serve, Funnel ou un proxy inverse
    - Vérifier un déploiement avant d’autoriser de vrais utilisateurs de messagerie
    - Annulation d’une configuration risquée d’accès à distance ou de messages privés
sidebarTitle: Exposure runbook
summary: Liste de contrôle avant déploiement et de retour arrière avant d’exposer un Gateway OpenClaw au-delà de local loopback
title: Procédure opérationnelle d’exposition du Gateway
x-i18n:
    generated_at: "2026-07-12T02:39:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fb8e66af57e804325afc91281122b822183337177c734efe065c5fc18b175e72
    source_path: gateway/security/exposure-runbook.md
    workflow: 16
---

<Warning>
N’exposez le Gateway qu’après avoir déterminé qui peut y accéder, comment ces
personnes sont authentifiées, quels agents elles peuvent déclencher et quels
outils ces agents peuvent utiliser. En cas de doute, revenez à un accès limité
à local loopback et relancez l’audit.
</Warning>

Ce guide opérationnel transforme les recommandations générales de [sécurité](/fr/gateway/security) en
une liste de contrôle destinée aux opérateurs pour l’accès à distance et l’exposition de la messagerie.

## Choisir le mode d’exposition

Privilégiez le mode le plus restrictif qui répond aux besoins du flux de travail.

| Mode                       | Recommandé pour                                  | Contrôles requis                                                                                                                        |
| -------------------------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| local loopback + tunnel SSH      | Usage personnel, accès administrateur, débogage | Conserver `gateway.bind: "loopback"` et créer un tunnel vers `127.0.0.1:18789`                                                           |
| local loopback + Tailscale Serve | Accès depuis un tailnet personnel à l’interface de contrôle/WebSocket | Limiter le Gateway à local loopback ; les en-têtes d’identité Tailscale authentifient uniquement l’interface WebSocket de contrôle, et non les autres voies d’authentification |
| Liaison tailnet/LAN        | Réseau privé dédié avec des appareils connus    | Authentification du Gateway, liste d’autorisation du pare-feu, aucune redirection de port public                                         |
| Proxy inverse de confiance | SSO/OIDC de l’organisation devant le Gateway    | Authentification `trusted-proxy`, paramètres `trustedProxies` stricts, règles de remplacement/suppression des en-têtes, utilisateurs autorisés explicites |
| Internet public            | Déploiements rares et à haut risque             | Proxy tenant compte de l’identité, TLS, limites de débit, listes d’autorisation strictes, sessions non principales isolées dans un bac à sable |

Évitez toute redirection directe d’un port public vers le Gateway. Si un accès
public est nécessaire, placez devant celui-ci un proxy tenant compte de
l’identité et faites de ce proxy le seul chemin réseau vers le Gateway.

## Inventaire préalable

Consignez les éléments suivants avant de modifier la liaison, le proxy, Tailscale ou la politique des canaux :

- L’hôte du Gateway, l’utilisateur du système d’exploitation et le répertoire d’état (`~/.openclaw` par défaut).
- L’URL du Gateway et le mode de liaison (`gateway.bind` ; port `18789` par défaut).
- Le mode d’authentification, la source du jeton/mot de passe ou la source d’identité du proxy de confiance.
- Chaque canal activé et s’il accepte les messages privés, les groupes ou les Webhooks.
- Les agents accessibles aux expéditeurs non locaux.
- Le profil d’outils, le mode de bac à sable et la politique des outils avec privilèges élevés pour chaque agent accessible.
- Les identifiants externes auxquels ces agents ont accès.
- L’emplacement de sauvegarde de `~/.openclaw/openclaw.json` et des identifiants.

Si plusieurs personnes peuvent envoyer des messages au bot, considérez cela
comme une délégation partagée de l’autorité d’utilisation des outils, et non
comme une isolation de l’hôte propre à chaque utilisateur.

## Vérifications de référence

Exécutez les commandes suivantes avant d’ouvrir l’accès :

```bash
openclaw doctor
openclaw security audit
openclaw security audit --deep
openclaw health
```

Corrigez d’abord les problèmes critiques. N’acceptez les avertissements que
s’ils sont intentionnels et documentés pour le déploiement. Consultez les
[Vérifications de l’audit de sécurité](/fr/gateway/security/audit-checks) pour connaître la signification de
chaque `checkId` et sa clé de correction.

Pour valider la CLI à distance, transmettez explicitement les identifiants :

```bash
openclaw gateway probe --url ws://127.0.0.1:18789 --token "$OPENCLAW_GATEWAY_TOKEN"
```

Ne supposez pas que les identifiants de la configuration locale s’appliquent à
une URL distante explicite.

## Configuration minimale sûre

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

Élargissez un seul contrôle à la fois : ajoutez une liste d’autorisation pour
un canal précis avant d’activer des outils capables d’écrire, ou activez un
proxy inverse avant d’accepter le trafic distant de l’interface de contrôle.

`tools.exec.security: "deny"` bloque tous les appels d’exécution, y compris les
diagnostics sans danger. Si des diagnostics ou des commandes à faible risque
sont nécessaires, n’assouplissez ce réglage qu’après avoir choisi les
expéditeurs, agents, commandes et le mode d’approbation précis qui
correspondent à votre modèle de menace.

## Exposition des messages privés et des groupes

Les canaux de messagerie sont des surfaces d’entrée non fiables. Avant
d’autoriser les messages privés ou les groupes :

- Préférez `dmPolicy: "pairing"` ou une liste `allowFrom` stricte à `dmPolicy: "open"`.
- Ne combinez pas les listes d’autorisation `"*"` avec un large accès aux outils.
- Exigez des mentions dans les groupes, sauf si le salon est strictement contrôlé.
- Définissez `session.dmScope: "per-channel-peer"` (ou `"per-account-channel-peer"` pour
  les canaux multicomptes) lorsque plusieurs personnes peuvent envoyer des messages privés au bot, afin que
  les sessions de messages privés ne partagent pas leur contexte.
- Acheminez les canaux partagés vers des agents disposant d’un minimum d’outils et d’aucun
  identifiant personnel.

L’appairage autorise l’expéditeur à déclencher le bot. Il ne fait pas de cet
expéditeur une frontière de sécurité distincte au niveau de l’hôte.

## Vérifications du proxy inverse

Pour les proxys tenant compte de l’identité :

- Le proxy doit authentifier les utilisateurs avant de transmettre les requêtes au Gateway.
- Le pare-feu ou la politique réseau doit bloquer l’accès direct au port du Gateway.
- `gateway.trustedProxies` ne doit répertorier que les adresses IP sources du proxy.
- Le proxy doit supprimer ou remplacer les en-têtes d’identité et de transfert
  fournis par le client.
- Définissez `gateway.auth.trustedProxy.allowUsers` lorsque le proxy dessert plusieurs
  publics.
- Utilisez `gateway.auth.trustedProxy.allowLoopback` uniquement pour un proxy situé sur le même hôte,
  lorsque les processus locaux sont fiables et que le proxy contrôle les en-têtes d’identité.

Exécutez `openclaw security audit --deep` après toute modification du proxy.
Les résultats relatifs au proxy de confiance sont particulièrement pertinents,
car le proxy devient la frontière d’authentification.

## Examen des outils et du bac à sable

Avant d’exposer un agent à des expéditeurs distants :

- Vérifiez quelles sessions s’exécutent sur l’hôte et lesquelles s’exécutent dans le bac à sable.
- Refusez l’exécution sur l’hôte ou exigez une approbation.
- Laissez les outils avec privilèges élevés désactivés, sauf si un expéditeur précis et fiable en a besoin.
- Évitez les outils de navigateur, de canevas, de Node, de Cron, de Gateway et de création de sessions pour les surfaces de
  messagerie ouvertes ou semi-ouvertes.
- Limitez les montages liés au strict nécessaire ; évitez les chemins des identifiants, du répertoire personnel, du socket Docker et du
  système.
- Utilisez des Gateways, des utilisateurs du système d’exploitation ou des hôtes distincts pour les frontières de confiance
  sensiblement différentes.

Si les utilisateurs distants ne sont pas entièrement fiables, l’isolation doit
provenir de déploiements distincts, et non uniquement des invites ou des
étiquettes de session.

## Validation après modification

Après chaque modification de l’exposition :

1. Relancez `openclaw security audit --deep`.
2. Vérifiez qu’une connexion autorisée réussit.
3. Vérifiez qu’un expéditeur ou une session de navigateur non autorisés sont refusés.
4. Vérifiez que les journaux masquent les secrets.
5. Vérifiez que le routage des messages privés/groupes n’atteint que l’agent prévu.
6. Vérifiez que les outils à fort impact demandent une approbation ou sont refusés.
7. Documentez les avertissements résiduels acceptés.

Ne passez pas à la modification suivante de l’exposition tant que la
modification actuelle n’est pas comprise.

## Plan de retour en arrière

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
6. Réactivez l’accès avec le mode le plus restrictif qui répond aux besoins du flux de travail.

## Liste de contrôle de l’examen

- Le Gateway reste limité à local loopback, sauf raison documentée.
- L’accès hors local loopback dispose d’une authentification et d’un pare-feu, sans route publique directe.
- Les déploiements avec proxy de confiance imposent des adresses IP de proxy strictes et des contrôles des en-têtes.
- Les messages privés utilisent l’appairage ou des listes d’autorisation, et non un accès ouvert par défaut.
- Les groupes exigent des mentions ou des listes d’autorisation explicites.
- Les canaux partagés n’ont pas accès aux identifiants personnels.
- Les sessions non principales s’exécutent en mode bac à sable.
- L’exécution sur l’hôte et les outils avec privilèges élevés sont refusés ou soumis à approbation.
- Les journaux masquent les secrets.
- Les problèmes critiques de l’audit sont corrigés.
- Les étapes de retour en arrière sont testées et documentées.
