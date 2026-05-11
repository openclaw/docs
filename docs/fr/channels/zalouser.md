---
read_when:
    - Configuration de Zalo Personal pour OpenClaw
    - Débogage de la connexion à Zalo Personal ou du flux de messages
summary: Prise en charge des comptes personnels Zalo via zca-js natif (connexion par QR code), fonctionnalités et configuration
title: Zalo personnel
x-i18n:
    generated_at: "2026-05-11T20:22:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8b55f980b92a17f6a8de39df0ce49fc5705b5cb2bf4d69589c07d84a854e863a
    source_path: channels/zalouser.md
    workflow: 16
---

Statut : expérimental. Cette intégration automatise un **compte Zalo personnel** via `zca-js` natif dans OpenClaw.

<Warning>
Il s’agit d’une intégration non officielle qui peut entraîner une suspension ou un bannissement du compte. Utilisez-la à vos propres risques.
</Warning>

## Plugin intégré

Zalo Personal est fourni comme Plugin intégré dans les versions actuelles d’OpenClaw ; les builds
empaquetés normaux ne nécessitent donc pas d’installation séparée.

Si vous utilisez un ancien build ou une installation personnalisée qui exclut Zalo Personal,
installez directement le package npm :

- Installer via la CLI : `openclaw plugins install @openclaw/zalouser`
- Version épinglée : `openclaw plugins install @openclaw/zalouser@2026.5.2`
- Ou depuis un checkout source : `openclaw plugins install ./path/to/local/zalouser-plugin`
- Détails : [Plugins](/fr/tools/plugin)

Aucun binaire CLI externe `zca`/`openzca` n’est requis.

## Configuration rapide (débutant)

1. Vérifiez que le Plugin Zalo Personal est disponible.
   - Les versions OpenClaw empaquetées actuelles l’intègrent déjà.
   - Les installations plus anciennes/personnalisées peuvent l’ajouter manuellement avec les commandes ci-dessus.
2. Connectez-vous (QR, sur la machine du Gateway) :
   - `openclaw channels login --channel zalouser`
   - Scannez le code QR avec l’application mobile Zalo.
3. Activez le canal :

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      dmPolicy: "pairing",
    },
  },
}
```

4. Redémarrez le Gateway (ou terminez la configuration).
5. L’accès DM utilise le jumelage par défaut ; approuvez le code de jumelage au premier contact.

## Ce que c’est

- S’exécute entièrement dans le processus via `zca-js`.
- Utilise des écouteurs d’événements natifs pour recevoir les messages entrants.
- Envoie les réponses directement via l’API JS (texte/média/lien).
- Conçu pour les cas d’usage de « compte personnel » lorsque l’API Zalo Bot n’est pas disponible.

## Nommage

L’id de canal est `zalouser` pour indiquer explicitement que cela automatise un **compte utilisateur Zalo personnel** (non officiel). Nous réservons `zalo` à une éventuelle future intégration officielle de l’API Zalo.

## Trouver les ID (répertoire)

Utilisez la CLI de répertoire pour découvrir les pairs/groupes et leurs ID :

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## Limites

- Le texte sortant est découpé en segments d’environ 2000 caractères (limites du client Zalo).
- Le streaming est bloqué par défaut.

## Contrôle d’accès (DM)

`channels.zalouser.dmPolicy` prend en charge : `pairing | allowlist | open | disabled` (par défaut : `pairing`).

`channels.zalouser.allowFrom` doit utiliser des ID utilisateur Zalo stables. Il peut aussi référencer des groupes d’accès d’expéditeurs statiques (`accessGroup:<name>`). Pendant la configuration interactive, les noms saisis peuvent être résolus en ID à l’aide de la recherche de contacts en cours de processus du Plugin.

Si un nom brut reste dans la configuration, le démarrage ne le résout que lorsque `channels.zalouser.dangerouslyAllowNameMatching: true` est activé. Sans cette option explicite, les vérifications d’expéditeur à l’exécution se font uniquement par ID et les noms bruts sont ignorés pour l’autorisation.

Approuvez via :

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## Accès aux groupes (facultatif)

- Par défaut : `channels.zalouser.groupPolicy = "open"` (groupes autorisés). Utilisez `channels.defaults.groupPolicy` pour remplacer la valeur par défaut lorsqu’elle n’est pas définie.
- Restreindre à une liste d’autorisation avec :
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups` (les clés doivent être des ID de groupe stables ; les noms sont résolus en ID au démarrage uniquement lorsque `channels.zalouser.dangerouslyAllowNameMatching: true` est activé)
  - `channels.zalouser.groupAllowFrom` (contrôle quels expéditeurs dans les groupes autorisés peuvent déclencher le bot ; les groupes d’accès d’expéditeurs statiques peuvent être référencés avec `accessGroup:<name>`)
- Bloquer tous les groupes : `channels.zalouser.groupPolicy = "disabled"`.
- L’assistant de configuration peut demander des listes d’autorisation de groupes.
- Au démarrage, OpenClaw résout les noms de groupes/utilisateurs dans les listes d’autorisation en ID et journalise la correspondance uniquement lorsque `channels.zalouser.dangerouslyAllowNameMatching: true` est activé.
- La correspondance de liste d’autorisation de groupes se fait uniquement par ID par défaut. Les noms non résolus sont ignorés pour l’authentification, sauf si `channels.zalouser.dangerouslyAllowNameMatching: true` est activé.
- `channels.zalouser.dangerouslyAllowNameMatching: true` est un mode de compatibilité de dernier recours qui réactive la résolution de noms mutable au démarrage et la correspondance des noms de groupe à l’exécution.
- Si `groupAllowFrom` n’est pas défini, l’exécution se rabat sur `allowFrom` pour les vérifications des expéditeurs de groupe.
- Les vérifications d’expéditeur s’appliquent à la fois aux messages de groupe normaux et aux commandes de contrôle (par exemple `/new`, `/reset`).

Exemple :

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["1471383327500481391"],
      groups: {
        "123456789": { allow: true },
        "Work Chat": { allow: true },
      },
    },
  },
}
```

### Garde par mention dans les groupes

- `channels.zalouser.groups.<group>.requireMention` contrôle si les réponses de groupe nécessitent une mention.
- Ordre de résolution : id/nom de groupe exact -> slug de groupe normalisé -> `*` -> valeur par défaut (`true`).
- Cela s’applique à la fois aux groupes sur liste d’autorisation et au mode groupe ouvert.
- Citer un message du bot compte comme une mention implicite pour l’activation de groupe.
- Les commandes de contrôle autorisées (par exemple `/new`) peuvent contourner la garde par mention.
- Lorsqu’un message de groupe est ignoré parce qu’une mention est requise, OpenClaw l’enregistre comme historique de groupe en attente et l’inclut dans le prochain message de groupe traité.
- La limite d’historique de groupe utilise par défaut `messages.groupChat.historyLimit` (repli `50`). Vous pouvez la remplacer par compte avec `channels.zalouser.historyLimit`.

Exemple :

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groups: {
        "*": { allow: true, requireMention: true },
        "Work Chat": { allow: true, requireMention: false },
      },
    },
  },
}
```

## Multi-compte

Les comptes correspondent aux profils `zalouser` dans l’état d’OpenClaw. Exemple :

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      defaultAccount: "default",
      accounts: {
        work: { enabled: true, profile: "work" },
      },
    },
  },
}
```

## Saisie, réactions et accusés de livraison

- OpenClaw envoie un événement de saisie avant d’envoyer une réponse (au mieux).
- L’action de réaction de message `react` est prise en charge pour `zalouser` dans les actions de canal.
  - Utilisez `remove: true` pour retirer un emoji de réaction spécifique d’un message.
  - Sémantique des réactions : [Réactions](/fr/tools/reactions)
- Pour les messages entrants qui incluent des métadonnées d’événement, OpenClaw envoie des accusés de livraison + de lecture (au mieux).

## Dépannage

**La connexion ne persiste pas :**

- `openclaw channels status --probe`
- Reconnexion : `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**Le nom de liste d’autorisation/groupe n’a pas été résolu :**

- Utilisez des ID numériques dans `allowFrom`/`groupAllowFrom` et des ID de groupe stables dans `groups`. Si vous avez intentionnellement besoin de noms exacts d’amis/groupes, activez `channels.zalouser.dangerouslyAllowNameMatching: true`.

**Mise à niveau depuis l’ancienne configuration basée sur la CLI :**

- Supprimez toute ancienne hypothèse liée à un processus `zca` externe.
- Le canal s’exécute désormais entièrement dans OpenClaw sans binaires CLI externes.

## Associé

- [Vue d’ensemble des canaux](/fr/channels) — tous les canaux pris en charge
- [Jumelage](/fr/channels/pairing) — authentification DM et flux de jumelage
- [Groupes](/fr/channels/groups) — comportement des discussions de groupe et garde par mention
- [Routage de canal](/fr/channels/channel-routing) — routage de session pour les messages
- [Sécurité](/fr/gateway/security) — modèle d’accès et renforcement
