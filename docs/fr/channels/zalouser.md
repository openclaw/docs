---
read_when:
    - Configuration de Zalo Personal pour OpenClaw
    - Débogage de la connexion ou du flux de messages Zalo Personal
summary: Prise en charge des comptes personnels Zalo via zca-js natif (connexion par QR code), fonctionnalités et configuration
title: Zalo personnel
x-i18n:
    generated_at: "2026-06-27T17:13:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fdd331d118bfc0d9aba90ac5e42c2ba52e010eafba1342bd3523c64642057dc6
    source_path: channels/zalouser.md
    workflow: 16
---

Statut : expérimental. Cette intégration automatise un **compte Zalo personnel** via `zca-js` natif dans OpenClaw.

<Warning>
Il s’agit d’une intégration non officielle qui peut entraîner la suspension ou le bannissement du compte. Utilisez-la à vos propres risques.
</Warning>

## Plugin intégré

Zalo Personal est fourni comme Plugin intégré dans les versions actuelles d’OpenClaw ; les builds
packagés normaux ne nécessitent donc pas d’installation séparée.

Si vous utilisez un build plus ancien ou une installation personnalisée qui exclut Zalo Personal,
installez directement le package npm :

- Installer via la CLI : `openclaw plugins install @openclaw/zalouser`
- Version épinglée : `openclaw plugins install @openclaw/zalouser@2026.5.2`
- Ou depuis un checkout source : `openclaw plugins install ./path/to/local/zalouser-plugin`
- Détails : [Plugins](/fr/tools/plugin)

Aucun binaire CLI externe `zca`/`openzca` n’est requis.

## Configuration rapide (débutant)

1. Assurez-vous que le Plugin Zalo Personal est disponible.
   - Les versions packagées actuelles d’OpenClaw l’intègrent déjà.
   - Les installations plus anciennes/personnalisées peuvent l’ajouter manuellement avec les commandes ci-dessus.
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

4. Redémarrez le Gateway (ou terminez la configuration).
5. L’accès aux messages privés utilise l’association par défaut ; approuvez le code d’association au premier contact.

## Ce que c’est

- Fonctionne entièrement dans le processus via `zca-js`.
- Utilise des écouteurs d’événements natifs pour recevoir les messages entrants.
- Envoie les réponses directement via l’API JS (texte/média/lien).
- Conçu pour les cas d’utilisation de « compte personnel » où l’API Zalo Bot n’est pas disponible.

## Nommage

L’id du canal est `zalouser` afin d’indiquer explicitement que cela automatise un **compte utilisateur Zalo personnel** (non officiel). Nous réservons `zalo` pour une éventuelle future intégration officielle de l’API Zalo.

## Trouver les ID (annuaire)

Utilisez la CLI d’annuaire pour découvrir les pairs/groupes et leurs ID :

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## Limites

- Le texte sortant est découpé en blocs d’environ 2 000 caractères (limites du client Zalo).
- Le streaming est bloqué par défaut.

## Contrôle d’accès (messages privés)

`channels.zalouser.dmPolicy` prend en charge : `pairing | allowlist | open | disabled` (par défaut : `pairing`).

`channels.zalouser.allowFrom` doit utiliser des ID utilisateur Zalo stables. Il peut aussi référencer des groupes d’accès expéditeur statiques (`accessGroup:<name>`). Pendant la configuration interactive, les noms saisis peuvent être résolus en ID à l’aide de la recherche de contacts intégrée au processus du Plugin.

Si un nom brut reste dans la configuration, le démarrage ne le résout que lorsque `channels.zalouser.dangerouslyAllowNameMatching: true` est activé. Sans cette activation explicite, les contrôles d’expéditeur à l’exécution utilisent uniquement les ID et les noms bruts sont ignorés pour l’autorisation.

Approuvez via :

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## Accès aux groupes (facultatif)

- Par défaut : `channels.zalouser.groupPolicy = "open"` (groupes autorisés). Utilisez `channels.defaults.groupPolicy` pour remplacer la valeur par défaut lorsqu’elle n’est pas définie.
- Restreignez à une liste d’autorisation avec :
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups` (les clés doivent être des ID de groupe stables ; les noms sont résolus en ID au démarrage uniquement lorsque `channels.zalouser.dangerouslyAllowNameMatching: true` est activé)
  - `channels.zalouser.groupAllowFrom` (contrôle quels expéditeurs dans les groupes autorisés peuvent déclencher le bot ; les groupes d’accès statiques d’expéditeurs peuvent être référencés avec `accessGroup:<name>`)
- Bloquez tous les groupes : `channels.zalouser.groupPolicy = "disabled"`.
- L’assistant de configuration peut demander des listes d’autorisation de groupes.
- Au démarrage, OpenClaw résout les noms de groupes/utilisateurs dans les listes d’autorisation en ID et journalise la correspondance uniquement lorsque `channels.zalouser.dangerouslyAllowNameMatching: true` est activé.
- Par défaut, la correspondance de liste d’autorisation de groupe se fait uniquement par ID. Les noms non résolus sont ignorés pour l’authentification, sauf si `channels.zalouser.dangerouslyAllowNameMatching: true` est activé.
- `channels.zalouser.dangerouslyAllowNameMatching: true` est un mode de compatibilité d’urgence qui réactive la résolution mutable des noms au démarrage et la correspondance des noms de groupe à l’exécution.
- Si `groupAllowFrom` n’est pas défini, l’exécution se rabat sur `allowFrom` pour les vérifications des expéditeurs de groupe.
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

### Contrôle par mention dans les groupes

- `channels.zalouser.groups.<group>.requireMention` contrôle si les réponses de groupe exigent une mention.
- Ordre de résolution : ID/nom de groupe exact -> slug de groupe normalisé -> `*` -> valeur par défaut (`true`).
- Cela s’applique à la fois aux groupes en liste d’autorisation et au mode groupe ouvert.
- Citer un message du bot compte comme mention implicite pour l’activation du groupe.
- Les commandes de contrôle autorisées (par exemple `/new`) peuvent contourner le contrôle par mention.
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

## Comptes multiples

Les comptes correspondent à des profils `zalouser` dans l’état OpenClaw. Exemple :

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

## Variables d’environnement

Le Plugin Zalo Personal peut aussi lire la sélection du profil depuis les variables d’environnement :

- `ZALOUSER_PROFILE` : nom de profil à utiliser lorsqu’aucun `profile` n’est défini dans la configuration du canal ou du compte.
- `ZCA_PROFILE` : nom de profil de repli hérité, utilisé uniquement lorsque `ZALOUSER_PROFILE` n’est pas défini.

Les noms de profil sélectionnent les identifiants de connexion Zalo enregistrés dans l’état OpenClaw. L’ordre de résolution est :

1. `profile` explicite dans la configuration.
2. `ZALOUSER_PROFILE`.
3. `ZCA_PROFILE`.
4. L’ID du compte pour les comptes non par défaut, ou `default` pour le compte par défaut.

Pour les configurations à comptes multiples, préférez définir `profile` sur chaque compte dans la configuration afin
qu’une variable d’environnement unique ne fasse pas partager la même session de connexion
à plusieurs comptes.

## Saisie, réactions et accusés de remise

- OpenClaw envoie un événement de saisie avant d’expédier une réponse (au mieux).
- L’action de réaction de message `react` est prise en charge pour `zalouser` dans les actions de canal.
  - Utilisez `remove: true` pour retirer un émoji de réaction spécifique d’un message.
  - Sémantique des réactions : [Réactions](/fr/tools/reactions)
- Pour les messages entrants qui incluent des métadonnées d’événement, OpenClaw envoie des accusés remis + vus (au mieux).

## Dépannage

**La connexion ne persiste pas :**

- `openclaw channels status --probe`
- Reconnexion : `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**La liste d’autorisation/le nom de groupe n’a pas été résolu :**

- Utilisez des ID numériques dans `allowFrom`/`groupAllowFrom` et des ID de groupe stables dans `groups`. Si vous avez intentionnellement besoin de noms exacts d’amis/groupes, activez `channels.zalouser.dangerouslyAllowNameMatching: true`.

**Mise à niveau depuis une ancienne configuration basée sur la CLI :**

- Supprimez toute ancienne hypothèse de processus externe `zca`.
- Le canal fonctionne désormais entièrement dans OpenClaw sans binaires CLI externes.

## Connexe

- [Vue d’ensemble des canaux](/fr/channels) — tous les canaux pris en charge
- [Appairage](/fr/channels/pairing) — authentification par DM et flux d’appairage
- [Groupes](/fr/channels/groups) — comportement des discussions de groupe et contrôle par mention
- [Routage des canaux](/fr/channels/channel-routing) — routage de session pour les messages
- [Sécurité](/fr/gateway/security) — modèle d’accès et durcissement
