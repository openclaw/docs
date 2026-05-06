---
read_when:
    - Configuration de Zalo Personal pour OpenClaw
    - Débogage de la connexion à Zalo Personal ou du flux de messages
summary: Prise en charge des comptes personnels Zalo via zca-js natif (connexion par QR code), fonctionnalités et configuration
title: Zalo personnel
x-i18n:
    generated_at: "2026-05-06T17:52:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: d56cbf0a6300709e9fe23421cd134acc68852d0025f305c73413308f412349e8
    source_path: channels/zalouser.md
    workflow: 16
---

Statut : expérimental. Cette intégration automatise un **compte Zalo personnel** via `zca-js` natif dans OpenClaw.

<Warning>
Il s'agit d'une intégration non officielle qui peut entraîner la suspension ou le bannissement du compte. Utilisez-la à vos propres risques.
</Warning>

## Plugin intégré

Zalo Personal est fourni comme Plugin intégré dans les versions actuelles d'OpenClaw, donc les builds empaquetés
normaux ne nécessitent pas d'installation séparée.

Si vous utilisez un build plus ancien ou une installation personnalisée qui exclut Zalo Personal,
installez directement le paquet npm :

- Installer via la CLI : `openclaw plugins install @openclaw/zalouser`
- Version épinglée : `openclaw plugins install @openclaw/zalouser@2026.5.2`
- Ou depuis un checkout source : `openclaw plugins install ./path/to/local/zalouser-plugin`
- Détails : [Plugins](/fr/tools/plugin)

Aucun binaire CLI externe `zca`/`openzca` n'est requis.

## Configuration rapide (débutant)

1. Assurez-vous que le Plugin Zalo Personal est disponible.
   - Les versions empaquetées actuelles d'OpenClaw l'intègrent déjà.
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
5. L'accès aux DM utilise par défaut l'appairage ; approuvez le code d'appairage lors du premier contact.

## Ce que c'est

- Fonctionne entièrement dans le processus via `zca-js`.
- Utilise des écouteurs d'événements natifs pour recevoir les messages entrants.
- Envoie les réponses directement via l'API JS (texte/média/lien).
- Conçu pour les cas d'utilisation de « compte personnel » lorsque l'API Zalo Bot n'est pas disponible.

## Nommage

L'identifiant du canal est `zalouser` afin d'indiquer explicitement que cela automatise un **compte utilisateur Zalo personnel** (non officiel). Nous gardons `zalo` réservé pour une éventuelle future intégration officielle de l'API Zalo.

## Trouver les identifiants (annuaire)

Utilisez la CLI d'annuaire pour découvrir les pairs/groupes et leurs identifiants :

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## Limites

- Le texte sortant est découpé en blocs d'environ 2000 caractères (limites du client Zalo).
- Le streaming est bloqué par défaut.

## Contrôle d'accès (DM)

`channels.zalouser.dmPolicy` prend en charge : `pairing | allowlist | open | disabled` (par défaut : `pairing`).

`channels.zalouser.allowFrom` doit utiliser des identifiants utilisateur Zalo stables. Pendant la configuration interactive, les noms saisis peuvent être résolus en identifiants à l'aide de la recherche de contacts en processus du Plugin.

Si un nom brut reste dans la configuration, le démarrage ne le résout que lorsque `channels.zalouser.dangerouslyAllowNameMatching: true` est activé. Sans cette adhésion explicite, les vérifications d'expéditeur à l'exécution se font uniquement par identifiant et les noms bruts sont ignorés pour l'autorisation.

Approuver via :

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## Accès aux groupes (facultatif)

- Par défaut : `channels.zalouser.groupPolicy = "open"` (groupes autorisés). Utilisez `channels.defaults.groupPolicy` pour remplacer la valeur par défaut lorsqu'elle n'est pas définie.
- Restreindre à une liste d'autorisation avec :
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups` (les clés doivent être des identifiants de groupe stables ; les noms sont résolus en identifiants au démarrage uniquement lorsque `channels.zalouser.dangerouslyAllowNameMatching: true` est activé)
  - `channels.zalouser.groupAllowFrom` (contrôle quels expéditeurs dans les groupes autorisés peuvent déclencher le bot)
- Bloquer tous les groupes : `channels.zalouser.groupPolicy = "disabled"`.
- L'assistant de configuration peut demander les listes d'autorisation de groupes.
- Au démarrage, OpenClaw résout les noms de groupes/utilisateurs dans les listes d'autorisation en identifiants et consigne la correspondance uniquement lorsque `channels.zalouser.dangerouslyAllowNameMatching: true` est activé.
- La correspondance des listes d'autorisation de groupes se fait par identifiant uniquement par défaut. Les noms non résolus sont ignorés pour l'authentification sauf si `channels.zalouser.dangerouslyAllowNameMatching: true` est activé.
- `channels.zalouser.dangerouslyAllowNameMatching: true` est un mode de compatibilité de dernier recours qui réactive la résolution mutable des noms au démarrage et la correspondance des noms de groupes à l'exécution.
- Si `groupAllowFrom` n'est pas défini, l'exécution se rabat sur `allowFrom` pour les vérifications d'expéditeur de groupe.
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

### Contrôle par mention de groupe

- `channels.zalouser.groups.<group>.requireMention` contrôle si les réponses de groupe nécessitent une mention.
- Ordre de résolution : identifiant/nom exact du groupe -> slug de groupe normalisé -> `*` -> valeur par défaut (`true`).
- Cela s'applique à la fois aux groupes en liste d'autorisation et au mode groupe ouvert.
- Citer un message du bot compte comme une mention implicite pour l'activation du groupe.
- Les commandes de contrôle autorisées (par exemple `/new`) peuvent contourner le contrôle par mention.
- Lorsqu'un message de groupe est ignoré parce qu'une mention est requise, OpenClaw le stocke comme historique de groupe en attente et l'inclut dans le prochain message de groupe traité.
- La limite d'historique de groupe utilise par défaut `messages.groupChat.historyLimit` (valeur de secours `50`). Vous pouvez la remplacer par compte avec `channels.zalouser.historyLimit`.

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

## Comptes multiples

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

## Saisie, réactions et accusés de réception de livraison

- OpenClaw envoie un événement de saisie avant de transmettre une réponse (dans la mesure du possible).
- L'action de réaction aux messages `react` est prise en charge pour `zalouser` dans les actions de canal.
  - Utilisez `remove: true` pour retirer un emoji de réaction spécifique d'un message.
  - Sémantique des réactions : [Réactions](/fr/tools/reactions)
- Pour les messages entrants qui incluent des métadonnées d'événement, OpenClaw envoie des accusés de réception delivered + seen (dans la mesure du possible).

## Dépannage

**La connexion ne persiste pas :**

- `openclaw channels status --probe`
- Se reconnecter : `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**La liste d'autorisation/le nom de groupe n'a pas été résolu :**

- Utilisez des identifiants numériques dans `allowFrom`/`groupAllowFrom` et des identifiants de groupe stables dans `groups`. Si vous avez intentionnellement besoin des noms exacts d'amis/de groupes, activez `channels.zalouser.dangerouslyAllowNameMatching: true`.

**Mise à niveau depuis l'ancienne configuration basée sur la CLI :**

- Supprimez toute ancienne hypothèse liée à un processus externe `zca`.
- Le canal fonctionne désormais entièrement dans OpenClaw sans binaires CLI externes.

## Connexe

- [Vue d'ensemble des canaux](/fr/channels) — tous les canaux pris en charge
- [Appairage](/fr/channels/pairing) — authentification DM et flux d'appairage
- [Groupes](/fr/channels/groups) — comportement des discussions de groupe et contrôle par mention
- [Routage des canaux](/fr/channels/channel-routing) — routage de session pour les messages
- [Sécurité](/fr/gateway/security) — modèle d'accès et durcissement
