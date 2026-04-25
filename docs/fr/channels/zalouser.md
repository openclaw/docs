---
read_when:
    - Configuration de Zalo Personal pour OpenClaw
    - Débogage de la connexion ou du flux de messages de Zalo Personal
summary: Prise en charge des comptes personnels Zalo via le zca-js natif (connexion par QR), capacités et configuration
title: Zalo personnel
x-i18n:
    generated_at: "2026-04-25T13:42:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5f996822f44648ae7791b5b027230edf1265f90157275ac058e0fa117f071d3a
    source_path: channels/zalouser.md
    workflow: 15
---

Statut : expérimental. Cette intégration automatise un **compte personnel Zalo** via le `zca-js` natif dans OpenClaw.

> **Avertissement :** il s’agit d’une intégration non officielle et elle peut entraîner la suspension/le bannissement du compte. Utilisez-la à vos risques et périls.

## Plugin inclus

Zalo Personal est livré comme Plugin inclus dans les versions actuelles d’OpenClaw, donc les
builds packagés normaux ne nécessitent pas d’installation séparée.

Si vous utilisez une version plus ancienne ou une installation personnalisée qui exclut Zalo Personal,
installez-le manuellement :

- Installer via la CLI : `openclaw plugins install @openclaw/zalouser`
- Ou depuis un checkout source : `openclaw plugins install ./path/to/local/zalouser-plugin`
- Détails : [Plugins](/fr/tools/plugin)

Aucun binaire CLI externe `zca`/`openzca` n’est requis.

## Configuration rapide (débutant)

1. Assurez-vous que le Plugin Zalo Personal est disponible.
   - Les versions packagées actuelles d’OpenClaw l’incluent déjà.
   - Les installations anciennes/personnalisées peuvent l’ajouter manuellement avec les commandes ci-dessus.
2. Connectez-vous (QR, sur la machine Gateway) :
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

4. Redémarrez la Gateway (ou terminez la configuration).
5. L’accès DM utilise par défaut l’appairage ; approuvez le code d’appairage au premier contact.

## Ce que c’est

- S’exécute entièrement en processus via `zca-js`.
- Utilise des écouteurs d’événements natifs pour recevoir les messages entrants.
- Envoie les réponses directement via l’API JS (texte/média/lien).
- Conçu pour les cas d’usage de « compte personnel » où l’API Bot Zalo n’est pas disponible.

## Dénomination

L’identifiant du canal est `zalouser` afin de rendre explicite qu’il automatise un **compte utilisateur personnel Zalo** (non officiel). Nous réservons `zalo` pour une éventuelle future intégration officielle de l’API Zalo.

## Trouver des IDs (répertoire)

Utilisez la CLI du répertoire pour découvrir les pairs/groupes et leurs IDs :

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## Limites

- Le texte sortant est segmenté à environ 2000 caractères (limites du client Zalo).
- Le streaming est bloqué par défaut.

## Contrôle d’accès (DM)

`channels.zalouser.dmPolicy` prend en charge : `pairing | allowlist | open | disabled` (par défaut : `pairing`).

`channels.zalouser.allowFrom` accepte des IDs utilisateur ou des noms. Pendant la configuration, les noms sont résolus en IDs à l’aide de la recherche de contacts en processus du Plugin.

Approuver via :

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## Accès aux groupes (facultatif)

- Par défaut : `channels.zalouser.groupPolicy = "open"` (groupes autorisés). Utilisez `channels.defaults.groupPolicy` pour remplacer la valeur par défaut lorsqu’elle n’est pas définie.
- Restreindre à une liste d’autorisation avec :
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups` (les clés doivent être des IDs de groupe stables ; les noms sont résolus en IDs au démarrage lorsque c’est possible)
  - `channels.zalouser.groupAllowFrom` (contrôle quels expéditeurs dans les groupes autorisés peuvent déclencher le bot)
- Bloquer tous les groupes : `channels.zalouser.groupPolicy = "disabled"`.
- L’assistant de configuration peut demander des listes d’autorisation de groupes.
- Au démarrage, OpenClaw résout les noms de groupe/utilisateur dans les listes d’autorisation en IDs et journalise le mapping.
- Par défaut, la correspondance de la liste d’autorisation des groupes se fait uniquement par ID. Les noms non résolus sont ignorés pour l’autorisation sauf si `channels.zalouser.dangerouslyAllowNameMatching: true` est activé.
- `channels.zalouser.dangerouslyAllowNameMatching: true` est un mode de compatibilité de secours qui réactive la correspondance sur les noms de groupe modifiables.
- Si `groupAllowFrom` n’est pas défini, le runtime utilise `allowFrom` comme repli pour les vérifications d’expéditeur en groupe.
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

### Filtrage par mention dans les groupes

- `channels.zalouser.groups.<group>.requireMention` contrôle si les réponses en groupe nécessitent une mention.
- Ordre de résolution : ID/nom de groupe exact -> slug de groupe normalisé -> `*` -> valeur par défaut (`true`).
- Cela s’applique à la fois aux groupes en liste d’autorisation et au mode groupe ouvert.
- Citer un message du bot compte comme une mention implicite pour l’activation du groupe.
- Les commandes de contrôle autorisées (par exemple `/new`) peuvent contourner le filtrage par mention.
- Lorsqu’un message de groupe est ignoré parce qu’une mention est requise, OpenClaw le stocke comme historique de groupe en attente et l’inclut dans le prochain message de groupe traité.
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

Les comptes sont mappés aux profils `zalouser` dans l’état OpenClaw. Exemple :

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

- OpenClaw envoie un événement de saisie avant d’envoyer une réponse (best-effort).
- L’action de réaction aux messages `react` est prise en charge pour `zalouser` dans les actions de canal.
  - Utilisez `remove: true` pour supprimer un emoji de réaction spécifique d’un message.
  - Sémantique des réactions : [Réactions](/fr/tools/reactions)
- Pour les messages entrants qui incluent des métadonnées d’événement, OpenClaw envoie des accusés delivered + seen (best-effort).

## Dépannage

**La connexion ne persiste pas :**

- `openclaw channels status --probe`
- Reconnectez-vous : `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**Le nom de la liste d’autorisation/du groupe n’a pas été résolu :**

- Utilisez des IDs numériques dans `allowFrom`/`groupAllowFrom`/`groups`, ou les noms exacts d’amis/groupes.

**Mise à niveau depuis l’ancienne configuration basée sur la CLI :**

- Supprimez toute hypothèse liée à un ancien processus `zca` externe.
- Le canal fonctionne maintenant entièrement dans OpenClaw sans binaires CLI externes.

## Associé

- [Vue d’ensemble des canaux](/fr/channels) — tous les canaux pris en charge
- [Appairage](/fr/channels/pairing) — authentification DM et flux d’appairage
- [Groupes](/fr/channels/groups) — comportement des discussions de groupe et filtrage par mention
- [Routage des canaux](/fr/channels/channel-routing) — routage des sessions pour les messages
- [Sécurité](/fr/gateway/security) — modèle d’accès et durcissement
