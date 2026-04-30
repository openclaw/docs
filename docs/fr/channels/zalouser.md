---
read_when:
    - Configurer Zalo Personal pour OpenClaw
    - Débogage de la connexion ou du flux de messages de Zalo Personal
summary: Prise en charge des comptes personnels Zalo via zca-js natif (connexion par QR code), capacités et configuration
title: Zalo personnel
x-i18n:
    generated_at: "2026-04-30T07:16:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 581a427f7fa37b0fa204f6b813c767eaa7af1f577baf2ac6ea3a31bf23ca6a49
    source_path: channels/zalouser.md
    workflow: 16
---

Statut : expérimental. Cette intégration automatise un **compte Zalo personnel** via `zca-js` natif dans OpenClaw.

<Warning>
Cette intégration n’est pas officielle et peut entraîner une suspension ou un bannissement du compte. Utilisez-la à vos propres risques.
</Warning>

## Plugin intégré

Zalo Personal est fourni comme Plugin intégré dans les versions actuelles d’OpenClaw ; les builds
packagés normaux ne nécessitent donc pas d’installation séparée.

Si vous utilisez un ancien build ou une installation personnalisée qui exclut Zalo Personal,
installez un paquet npm actuel lorsqu’il est publié :

- Installer via la CLI : `openclaw plugins install @openclaw/zalouser`
- Ou depuis un checkout source : `openclaw plugins install ./path/to/local/zalouser-plugin`
- Détails : [Plugins](/fr/tools/plugin)

Si npm indique que le paquet détenu par OpenClaw est obsolète, utilisez un build OpenClaw
packagé actuel ou le chemin de checkout local jusqu’à la publication d’un paquet npm
plus récent.

Aucun binaire CLI externe `zca`/`openzca` n’est requis.

## Configuration rapide (débutant)

1. Assurez-vous que le Plugin Zalo Personal est disponible.
   - Les versions OpenClaw packagées actuelles l’incluent déjà.
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
5. L’accès aux DM utilise l’appairage par défaut ; approuvez le code d’appairage au premier contact.

## Ce que c’est

- Fonctionne entièrement dans le processus via `zca-js`.
- Utilise des écouteurs d’événements natifs pour recevoir les messages entrants.
- Envoie les réponses directement via l’API JS (texte/média/lien).
- Conçu pour les cas d’usage de « compte personnel » lorsque l’API Zalo Bot n’est pas disponible.

## Nommage

L’id du canal est `zalouser` afin d’indiquer explicitement que cela automatise un **compte utilisateur Zalo personnel** (non officiel). Nous gardons `zalo` réservé pour une éventuelle future intégration officielle de l’API Zalo.

## Trouver les IDs (répertoire)

Utilisez la CLI de répertoire pour découvrir les pairs/groupes et leurs IDs :

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
- Au démarrage, OpenClaw résout les noms de groupes/utilisateurs dans les listes d’autorisation en IDs et journalise la correspondance.
- La correspondance de liste d’autorisation de groupes se fait uniquement par ID par défaut. Les noms non résolus sont ignorés pour l’authentification sauf si `channels.zalouser.dangerouslyAllowNameMatching: true` est activé.
- `channels.zalouser.dangerouslyAllowNameMatching: true` est un mode de compatibilité de dernier recours qui réactive la correspondance mutable des noms de groupes.
- Si `groupAllowFrom` n’est pas défini, l’exécution se rabat sur `allowFrom` pour les vérifications d’expéditeurs de groupe.
- Les vérifications d’expéditeur s’appliquent aux messages de groupe normaux comme aux commandes de contrôle (par exemple `/new`, `/reset`).

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

### Contrôle par mention de groupe

- `channels.zalouser.groups.<group>.requireMention` contrôle si les réponses de groupe nécessitent une mention.
- Ordre de résolution : id/nom de groupe exact -> slug de groupe normalisé -> `*` -> valeur par défaut (`true`).
- Cela s’applique à la fois aux groupes en liste d’autorisation et au mode groupe ouvert.
- Citer un message du bot compte comme une mention implicite pour l’activation dans un groupe.
- Les commandes de contrôle autorisées (par exemple `/new`) peuvent contourner le contrôle par mention.
- Lorsqu’un message de groupe est ignoré parce qu’une mention est requise, OpenClaw le stocke comme historique de groupe en attente et l’inclut dans le prochain message de groupe traité.
- La limite d’historique de groupe utilise par défaut `messages.groupChat.historyLimit` (valeur de repli `50`). Vous pouvez la remplacer par compte avec `channels.zalouser.historyLimit`.

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

Les comptes sont associés à des profils `zalouser` dans l’état d’OpenClaw. Exemple :

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

- OpenClaw envoie un événement de saisie avant de transmettre une réponse (au mieux).
- L’action de réaction à un message `react` est prise en charge pour `zalouser` dans les actions de canal.
  - Utilisez `remove: true` pour supprimer un emoji de réaction spécifique d’un message.
  - Sémantique des réactions : [Réactions](/fr/tools/reactions)
- Pour les messages entrants qui incluent des métadonnées d’événement, OpenClaw envoie des accusés livré + vu (au mieux).

## Dépannage

**La connexion ne persiste pas :**

- `openclaw channels status --probe`
- Reconnexion : `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**La liste d’autorisation/le nom de groupe n’a pas été résolu :**

- Utilisez des IDs numériques dans `allowFrom`/`groupAllowFrom`/`groups`, ou les noms exacts d’amis/groupes.

**Mise à niveau depuis l’ancienne configuration basée sur la CLI :**

- Supprimez toute ancienne hypothèse de processus `zca` externe.
- Le canal fonctionne désormais entièrement dans OpenClaw, sans binaires CLI externes.

## Connexe

- [Vue d’ensemble des canaux](/fr/channels) — tous les canaux pris en charge
- [Appairage](/fr/channels/pairing) — authentification DM et flux d’appairage
- [Groupes](/fr/channels/groups) — comportement des discussions de groupe et contrôle par mention
- [Routage de canal](/fr/channels/channel-routing) — routage de session pour les messages
- [Sécurité](/fr/gateway/security) — modèle d’accès et durcissement
