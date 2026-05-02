---
read_when:
    - Configuration de Zalo Personal pour OpenClaw
    - Débogage de la connexion Zalo Personal ou du flux de messages
summary: Prise en charge du compte personnel Zalo via zca-js natif (connexion par code QR), fonctionnalités et configuration
title: Zalo personnel
x-i18n:
    generated_at: "2026-05-02T22:17:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0096775e0017e504130f2e19e05ab8114eadb873a9e11f79ea8f0dd91297567f
    source_path: channels/zalouser.md
    workflow: 16
---

Statut : expérimental. Cette intégration automatise un **compte Zalo personnel** via `zca-js` natif dans OpenClaw.

<Warning>
Il s'agit d'une intégration non officielle qui peut entraîner la suspension ou le bannissement du compte. Utilisez-la à vos propres risques.
</Warning>

## Plugin inclus

Zalo Personal est fourni comme Plugin inclus dans les versions actuelles d'OpenClaw ; les builds empaquetés normaux ne nécessitent donc pas d'installation séparée.

Si vous utilisez un build plus ancien ou une installation personnalisée qui exclut Zalo Personal, installez directement le package npm :

- Installer via la CLI : `openclaw plugins install @openclaw/zalouser`
- Version épinglée : `openclaw plugins install @openclaw/zalouser@2026.5.2`
- Ou depuis un checkout source : `openclaw plugins install ./path/to/local/zalouser-plugin`
- Détails : [Plugins](/fr/tools/plugin)

Aucun binaire CLI externe `zca`/`openzca` n'est requis.

## Configuration rapide (débutant)

1. Assurez-vous que le Plugin Zalo Personal est disponible.
   - Les versions empaquetées actuelles d'OpenClaw l'incluent déjà.
   - Les installations plus anciennes/personnalisées peuvent l'ajouter manuellement avec les commandes ci-dessus.
2. Connectez-vous (QR, sur la machine Gateway) :
   - `openclaw channels login --channel zalouser`
   - Scannez le code QR avec l'application mobile Zalo.
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
5. L'accès aux messages privés utilise l'association par défaut ; approuvez le code d'association au premier contact.

## Ce que c'est

- S'exécute entièrement dans le processus via `zca-js`.
- Utilise des écouteurs d'événements natifs pour recevoir les messages entrants.
- Envoie les réponses directement via l'API JS (texte/média/lien).
- Conçu pour les cas d'utilisation de « compte personnel » lorsque l'API Zalo Bot n'est pas disponible.

## Nommage

L'identifiant de canal est `zalouser` afin d'indiquer explicitement que cela automatise un **compte utilisateur Zalo personnel** (non officiel). Nous réservons `zalo` à une éventuelle future intégration officielle de l'API Zalo.

## Trouver des identifiants (annuaire)

Utilisez la CLI d'annuaire pour découvrir les pairs/groupes et leurs identifiants :

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## Limites

- Le texte sortant est découpé en segments d'environ 2000 caractères (limites du client Zalo).
- Le streaming est bloqué par défaut.

## Contrôle d'accès (messages privés)

`channels.zalouser.dmPolicy` prend en charge : `pairing | allowlist | open | disabled` (par défaut : `pairing`).

`channels.zalouser.allowFrom` accepte les identifiants ou noms d'utilisateur. Pendant la configuration, les noms sont résolus en identifiants à l'aide de la recherche de contacts en processus du Plugin.

Approuvez via :

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## Accès aux groupes (facultatif)

- Par défaut : `channels.zalouser.groupPolicy = "open"` (groupes autorisés). Utilisez `channels.defaults.groupPolicy` pour remplacer la valeur par défaut lorsqu'elle n'est pas définie.
- Restreindre à une allowlist avec :
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups` (les clés doivent être des identifiants de groupe stables ; les noms sont résolus en identifiants au démarrage lorsque c'est possible)
  - `channels.zalouser.groupAllowFrom` (contrôle quels expéditeurs dans les groupes autorisés peuvent déclencher le bot)
- Bloquer tous les groupes : `channels.zalouser.groupPolicy = "disabled"`.
- L'assistant de configuration peut demander des allowlists de groupes.
- Au démarrage, OpenClaw résout les noms de groupes/utilisateurs dans les allowlists en identifiants et journalise la correspondance.
- La correspondance de l'allowlist de groupes se fait par identifiant uniquement par défaut. Les noms non résolus sont ignorés pour l'authentification, sauf si `channels.zalouser.dangerouslyAllowNameMatching: true` est activé.
- `channels.zalouser.dangerouslyAllowNameMatching: true` est un mode de compatibilité d'urgence qui réactive la correspondance mutable par nom de groupe.
- Si `groupAllowFrom` n'est pas défini, le runtime se rabat sur `allowFrom` pour les vérifications d'expéditeur de groupe.
- Les vérifications d'expéditeur s'appliquent à la fois aux messages de groupe normaux et aux commandes de contrôle (par exemple `/new`, `/reset`).

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

### Contrôle des mentions de groupe

- `channels.zalouser.groups.<group>.requireMention` contrôle si les réponses de groupe exigent une mention.
- Ordre de résolution : identifiant/nom de groupe exact -> slug de groupe normalisé -> `*` -> valeur par défaut (`true`).
- Cela s'applique à la fois aux groupes sur allowlist et au mode groupe ouvert.
- Citer un message du bot compte comme une mention implicite pour l'activation du groupe.
- Les commandes de contrôle autorisées (par exemple `/new`) peuvent contourner le contrôle des mentions.
- Lorsqu'un message de groupe est ignoré parce qu'une mention est requise, OpenClaw le stocke comme historique de groupe en attente et l'inclut dans le prochain message de groupe traité.
- La limite d'historique de groupe utilise par défaut `messages.groupChat.historyLimit` (repli `50`). Vous pouvez la remplacer par compte avec `channels.zalouser.historyLimit`.

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

Les comptes correspondent à des profils `zalouser` dans l'état d'OpenClaw. Exemple :

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

## Saisie, réactions et accusés de réception

- OpenClaw envoie un événement de saisie avant d'émettre une réponse (au mieux).
- L'action de réaction de message `react` est prise en charge pour `zalouser` dans les actions de canal.
  - Utilisez `remove: true` pour supprimer un emoji de réaction spécifique d'un message.
  - Sémantique des réactions : [Réactions](/fr/tools/reactions)
- Pour les messages entrants qui incluent des métadonnées d'événement, OpenClaw envoie des accusés de livraison et de lecture (au mieux).

## Dépannage

**La connexion ne persiste pas :**

- `openclaw channels status --probe`
- Reconnexion : `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**Le nom d'allowlist/de groupe n'a pas été résolu :**

- Utilisez des identifiants numériques dans `allowFrom`/`groupAllowFrom`/`groups`, ou des noms exacts d'amis/de groupes.

**Mise à niveau depuis l'ancienne configuration basée sur la CLI :**

- Supprimez toute ancienne hypothèse liée à un processus externe `zca`.
- Le canal s'exécute désormais entièrement dans OpenClaw, sans binaires CLI externes.

## Connexe

- [Vue d'ensemble des canaux](/fr/channels) — tous les canaux pris en charge
- [Association](/fr/channels/pairing) — authentification des messages privés et flux d'association
- [Groupes](/fr/channels/groups) — comportement des discussions de groupe et contrôle des mentions
- [Routage des canaux](/fr/channels/channel-routing) — routage de session pour les messages
- [Sécurité](/fr/gateway/security) — modèle d'accès et renforcement
