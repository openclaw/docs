---
read_when:
    - Configuration de Zalo Personal pour OpenClaw
    - Débogage de la connexion ou du flux de messages de Zalo Personal
summary: Prise en charge des comptes personnels Zalo via zca-js natif (connexion par code QR), fonctionnalités et configuration
title: Zalo personnel
x-i18n:
    generated_at: "2026-07-12T02:27:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 962697c4a56dfb733fe4973e23129ccb365506e35c09e673365842f45a837949
    source_path: channels/zalouser.md
    workflow: 16
---

Statut : expérimental. Cette intégration automatise un **compte Zalo personnel** via la bibliothèque native `zca-js`, au sein du processus, sans binaire CLI externe.

<Warning>
Cette intégration n’est pas officielle et peut entraîner la suspension ou le bannissement du compte. Utilisez-la à vos propres risques.
</Warning>

## Installation

Zalo Personal est un plugin externe officiel, non intégré au cœur. Installez-le avant de l’utiliser :

```bash
openclaw plugins install @openclaw/zalouser
```

- Épingler une version : `openclaw plugins install @openclaw/zalouser@<version>`
- Depuis un dépôt source extrait : `openclaw plugins install ./path/to/local/zalouser-plugin`
- Détails : [Plugins](/fr/tools/plugin)

## Configuration rapide

1. Installez le plugin (ci-dessus).
2. Connectez-vous (par QR, sur la machine du Gateway) :
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
5. L’accès aux messages privés utilise l’association par défaut ; approuvez le code d’association lors du premier contact.

## Présentation

- Fonctionne entièrement au sein du processus via la bibliothèque `zca-js` (sans binaire externe `zca`/`openzca`).
- Utilise les écouteurs d’événements natifs (`message`, `error`) pour recevoir les messages entrants.
- Envoie les réponses directement au moyen de l’API JS (texte, média ou lien).
- Conçu pour les cas d’utilisation d’un « compte personnel » où l’API Zalo Bot n’est pas disponible.

## Nommage

L’identifiant du canal est `zalouser` afin d’indiquer explicitement que cette intégration automatise un **compte utilisateur Zalo personnel** (non officiel). `zalo` est réservé à une éventuelle future intégration officielle de l’API Zalo.

## Recherche des identifiants (annuaire)

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## Limites

- Le texte sortant est découpé en segments de 2 000 caractères (limite du client Zalo).
- La diffusion en continu n’est pas prise en charge.

## Contrôle d’accès (messages privés)

`channels.zalouser.dmPolicy` : `pairing | allowlist | open | disabled` (valeur par défaut : `pairing`).

`channels.zalouser.allowFrom` doit utiliser des identifiants utilisateur Zalo stables. Cette option peut également référencer des groupes statiques d’accès des expéditeurs (`accessGroup:<name>`). Lors de la configuration interactive, les noms saisis peuvent être résolus en identifiants grâce à la recherche de contacts intégrée au processus du plugin.

Si un nom brut reste dans la configuration, il n’est résolu au démarrage que lorsque `channels.zalouser.dangerouslyAllowNameMatching: true` est activé. Sans cette activation explicite, les vérifications des expéditeurs à l’exécution reposent uniquement sur les identifiants et les noms bruts sont ignorés pour l’autorisation.

Approuvez au moyen de :

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## Accès aux groupes (facultatif)

- Valeur par défaut : `channels.zalouser.groupPolicy = "allowlist"` (les groupes nécessitent une entrée explicite dans la liste d’autorisation).
- Ouvrir tous les groupes : `channels.zalouser.groupPolicy = "open"`.
- Bloquer tous les groupes : `channels.zalouser.groupPolicy = "disabled"`.
- Avec `groupPolicy = "allowlist"` :
  - Les clés de `channels.zalouser.groups` doivent être des identifiants de groupe stables ; les noms ne sont résolus en identifiants au démarrage que lorsque `channels.zalouser.dangerouslyAllowNameMatching: true` est activé.
  - `channels.zalouser.groupAllowFrom` détermine quels expéditeurs des groupes autorisés peuvent déclencher le bot ; les groupes statiques d’accès des expéditeurs peuvent être référencés avec `accessGroup:<name>`.
- L’assistant de configuration peut demander les listes d’autorisation des groupes.
- Par défaut, la correspondance avec la liste d’autorisation des groupes repose uniquement sur les identifiants. Les noms non résolus sont ignorés pour l’authentification, sauf si `channels.zalouser.dangerouslyAllowNameMatching: true` est activé.
- `channels.zalouser.dangerouslyAllowNameMatching: true` est un mode de compatibilité d’urgence qui réactive la résolution au démarrage des noms modifiables et la correspondance des noms de groupe à l’exécution.
- Pour les messages de groupe ordinaires, `groupAllowFrom` ne se rabat **pas** sur `allowFrom` : si cette option reste vide pour un groupe figurant dans la liste d’autorisation, tout expéditeur peut interagir dans ce groupe. Les commandes de contrôle autorisées (par exemple `/new`) constituent l’exception ; lorsque `groupAllowFrom` est vide, la vérification de leur expéditeur se rabat sur `allowFrom`.

Exemple :

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["1471383327500481391"],
      groups: {
        "123456789": { enabled: true },
        "Work Chat": { enabled: true },
      },
    },
  },
}
```

<Note>
`channels.zalouser.groups.<id>.allow` est un ancien nom de champ ; la configuration actuelle utilise `enabled`. `openclaw doctor --fix` migre automatiquement `allow` vers `enabled`.
</Note>

### Filtrage des mentions dans les groupes

- `channels.zalouser.groups.<group>.requireMention` détermine si les réponses dans les groupes nécessitent une mention.
- Ordre de résolution : identifiant du groupe -> alias `group:<id>` -> nom/slug du groupe (les correspondances fondées sur le nom ne s’appliquent que lorsque `dangerouslyAllowNameMatching: true`) -> `*` -> valeur par défaut (`true`).
- S’applique aussi bien aux groupes figurant dans la liste d’autorisation qu’au mode de groupes ouverts.
- Citer un message du bot compte comme une mention implicite pour l’activation dans un groupe.
- Les commandes de contrôle autorisées (par exemple `/new`) peuvent contourner le filtrage des mentions.
- Lorsqu’un message de groupe est ignoré parce qu’une mention est requise, OpenClaw le conserve dans l’historique de groupe en attente et l’inclut dans le prochain message de groupe traité.
- Limite de l’historique des groupes : `channels.zalouser.historyLimit`, puis `messages.groupChat.historyLimit`, puis une valeur de repli de `50`.

Exemple :

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groups: {
        "*": { enabled: true, requireMention: true },
        "Work Chat": { enabled: true, requireMention: false },
      },
    },
  },
}
```

## Comptes multiples

Les comptes correspondent à des profils `zalouser` dans l’état d’OpenClaw. Exemple :

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

La sélection du profil peut également provenir de variables d’environnement :

| Variable           | Fonction                                                                                                                      |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| `ZALOUSER_PROFILE` | Nom du profil à utiliser lorsqu’aucun `profile` n’est défini dans la configuration du canal ou du compte.                     |
| `ZCA_PROFILE`      | Valeur de repli historique, utilisée uniquement lorsque `ZALOUSER_PROFILE` n’est pas défini.                                  |

Les noms de profil sélectionnent les identifiants de connexion Zalo enregistrés dans l’état d’OpenClaw. Ordre de résolution :

1. `profile` explicite dans la configuration.
2. `ZALOUSER_PROFILE`.
3. `ZCA_PROFILE`.
4. L’identifiant du compte pour les comptes autres que celui par défaut, ou `default` pour le compte par défaut.

Pour les configurations à plusieurs comptes, définissez de préférence `profile` pour chaque compte dans la configuration afin qu’une seule variable d’environnement ne conduise pas plusieurs comptes à partager la même session de connexion.

## Saisie, réactions et accusés de réception

- OpenClaw envoie un événement de saisie avant d’envoyer une réponse (dans la mesure du possible).
- L’action de réaction aux messages `react` est prise en charge pour `zalouser` dans les actions de canal.
  - Utilisez `remove: true` pour supprimer d’un message un émoji de réaction précis.
  - Sémantique des réactions : [Réactions](/fr/tools/reactions)
- Pour les messages entrants comportant des métadonnées d’événement, OpenClaw envoie des accusés de livraison et de lecture (dans la mesure du possible).

## Dépannage

**La connexion n’est pas conservée :**

- `openclaw channels status --probe`
- Reconnexion : `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**Le nom de la liste d’autorisation ou du groupe n’a pas été résolu :**

- Utilisez des identifiants numériques dans `allowFrom`/`groupAllowFrom` et des identifiants de groupe stables dans `groups`. Si vous devez intentionnellement utiliser les noms exacts d’amis ou de groupes, activez `channels.zalouser.dangerouslyAllowNameMatching: true`.

**Mise à niveau depuis une ancienne configuration externe fondée sur `zca`/la CLI :**

- Supprimez toute dépendance supposée à un processus `zca` externe ; le canal fonctionne désormais entièrement au sein du processus via `zca-js`, sans binaire CLI externe.

## Pages connexes

- [Vue d’ensemble des canaux](/fr/channels) - tous les canaux pris en charge
- [Association](/fr/channels/pairing) - authentification des messages privés et processus d’association
- [Groupes](/fr/channels/groups) - comportement des discussions de groupe et filtrage des mentions
- [Routage des canaux](/fr/channels/channel-routing) - routage des sessions pour les messages
- [Sécurité](/fr/gateway/security) - modèle d’accès et durcissement
