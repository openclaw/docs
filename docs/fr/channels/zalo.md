---
read_when:
    - Travailler sur les fonctionnalités Zalo ou les Webhooks
summary: État de prise en charge du bot Zalo, capacités et configuration
title: Zalo
x-i18n:
    generated_at: "2026-04-30T07:16:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: e79a4a27accc7f460bd3ae9c01e8f5f80e21a285af5d89b94bb9c89244a4438f
    source_path: channels/zalo.md
    workflow: 16
---

Statut : expérimental. Les messages privés sont pris en charge. La section [Capacités](#capacités) ci-dessous reflète le comportement actuel des bots Marketplace.

## Plugin inclus

Zalo est fourni comme Plugin inclus dans les versions actuelles d’OpenClaw ; les builds empaquetés normaux n’ont donc pas besoin d’installation séparée.

Si vous utilisez un build plus ancien ou une installation personnalisée qui exclut Zalo, installez un package npm actuel lorsqu’il est publié :

- Installer via la CLI : `openclaw plugins install @openclaw/zalo`
- Ou depuis une extraction source : `openclaw plugins install ./path/to/local/zalo-plugin`
- Détails : [Plugins](/fr/tools/plugin)

Si npm signale que le package détenu par OpenClaw est obsolète, utilisez un build OpenClaw empaqueté actuel ou le chemin d’extraction locale jusqu’à ce qu’un package npm plus récent soit publié.

## Configuration rapide (débutant)

1. Assurez-vous que le Plugin Zalo est disponible.
   - Les versions OpenClaw empaquetées actuelles l’incluent déjà.
   - Les installations plus anciennes/personnalisées peuvent l’ajouter manuellement avec les commandes ci-dessus.
2. Définissez le jeton :
   - Env : `ZALO_BOT_TOKEN=...`
   - Ou config : `channels.zalo.accounts.default.botToken: "..."`.
3. Redémarrez le gateway (ou terminez la configuration).
4. L’accès aux messages privés utilise l’appairage par défaut ; approuvez le code d’appairage au premier contact.

Configuration minimale :

```json5
{
  channels: {
    zalo: {
      enabled: true,
      accounts: {
        default: {
          botToken: "12345689:abc-xyz",
          dmPolicy: "pairing",
        },
      },
    },
  },
}
```

## Ce que c’est

Zalo est une application de messagerie centrée sur le Vietnam ; son API Bot permet au Gateway d’exécuter un bot pour des conversations 1:1.
Elle convient bien au support ou aux notifications lorsque vous voulez un routage déterministe vers Zalo.

Cette page reflète le comportement actuel d’OpenClaw pour les **bots Zalo Bot Creator / Marketplace**.
Les **bots Zalo Official Account (OA)** sont une autre surface produit Zalo et peuvent se comporter différemment.

- Un canal API Bot Zalo détenu par le Gateway.
- Routage déterministe : les réponses reviennent dans Zalo ; le modèle ne choisit jamais les canaux.
- Les messages privés partagent la session principale de l’agent.
- La section [Capacités](#capacités) ci-dessous montre la prise en charge actuelle des bots Marketplace.

## Configuration (chemin rapide)

### 1) Créer un jeton de bot (Zalo Bot Platform)

1. Accédez à [https://bot.zaloplatforms.com](https://bot.zaloplatforms.com) et connectez-vous.
2. Créez un nouveau bot et configurez ses paramètres.
3. Copiez le jeton complet du bot (généralement `numeric_id:secret`). Pour les bots Marketplace, le jeton d’exécution utilisable peut apparaître dans le message de bienvenue du bot après sa création.

### 2) Configurer le jeton (env ou config)

Exemple :

```json5
{
  channels: {
    zalo: {
      enabled: true,
      accounts: {
        default: {
          botToken: "12345689:abc-xyz",
          dmPolicy: "pairing",
        },
      },
    },
  },
}
```

Si vous passez plus tard à une surface de bot Zalo où les groupes sont disponibles, vous pouvez ajouter explicitement une configuration propre aux groupes, comme `groupPolicy` et `groupAllowFrom`. Pour le comportement actuel des bots Marketplace, consultez [Capacités](#capacités).

Option env : `ZALO_BOT_TOKEN=...` (fonctionne uniquement pour le compte par défaut).

Prise en charge de plusieurs comptes : utilisez `channels.zalo.accounts` avec des jetons par compte et un `name` facultatif.

3. Redémarrez le gateway. Zalo démarre lorsqu’un jeton est résolu (env ou config).
4. L’accès aux messages privés utilise l’appairage par défaut. Approuvez le code lors du premier contact avec le bot.

## Fonctionnement (comportement)

- Les messages entrants sont normalisés dans l’enveloppe de canal partagée avec des espaces réservés de média.
- Les réponses sont toujours routées vers le même chat Zalo.
- Long-polling par défaut ; le mode webhook est disponible avec `channels.zalo.webhookUrl`.

## Limites

- Le texte sortant est découpé en blocs de 2000 caractères (limite de l’API Zalo).
- Les téléchargements/envois de médias sont plafonnés par `channels.zalo.mediaMaxMb` (5 par défaut).
- Le streaming est bloqué par défaut, car la limite de 2000 caractères rend le streaming moins utile.

## Contrôle d’accès (messages privés)

### Accès aux messages privés

- Par défaut : `channels.zalo.dmPolicy = "pairing"`. Les expéditeurs inconnus reçoivent un code d’appairage ; les messages sont ignorés jusqu’à approbation (les codes expirent après 1 heure).
- Approuver via :
  - `openclaw pairing list zalo`
  - `openclaw pairing approve zalo <CODE>`
- L’appairage est l’échange de jeton par défaut. Détails : [Appairage](/fr/channels/pairing)
- `channels.zalo.allowFrom` accepte les ID utilisateur numériques (aucune recherche par nom d’utilisateur disponible).

## Contrôle d’accès (groupes)

Pour les **bots Zalo Bot Creator / Marketplace**, la prise en charge des groupes n’était pas disponible en pratique, car le bot ne pouvait pas du tout être ajouté à un groupe.

Cela signifie que les clés de configuration liées aux groupes ci-dessous existent dans le schéma, mais n’étaient pas utilisables pour les bots Marketplace :

- `channels.zalo.groupPolicy` contrôle la gestion entrante des groupes : `open | allowlist | disabled`.
- `channels.zalo.groupAllowFrom` restreint les ID d’expéditeur pouvant déclencher le bot dans les groupes.
- Si `groupAllowFrom` n’est pas défini, Zalo se rabat sur `allowFrom` pour les vérifications d’expéditeur.
- Note d’exécution : si `channels.zalo` est entièrement absent, l’exécution se rabat tout de même sur `groupPolicy="allowlist"` par sécurité.

Les valeurs de politique de groupe (lorsque l’accès aux groupes est disponible sur votre surface de bot) sont :

- `groupPolicy: "disabled"` — bloque tous les messages de groupe.
- `groupPolicy: "open"` — autorise tout membre du groupe (soumis à mention).
- `groupPolicy: "allowlist"` — valeur par défaut fermée en cas d’échec ; seuls les expéditeurs autorisés sont acceptés.

Si vous utilisez une autre surface produit de bot Zalo et avez vérifié un comportement de groupe fonctionnel, documentez-le séparément au lieu de supposer qu’il correspond au flux des bots Marketplace.

## Long-polling vs webhook

- Par défaut : long-polling (aucune URL publique requise).
- Mode webhook : définissez `channels.zalo.webhookUrl` et `channels.zalo.webhookSecret`.
  - Le secret webhook doit contenir 8 à 256 caractères.
  - L’URL webhook doit utiliser HTTPS.
  - Zalo envoie les événements avec l’en-tête `X-Bot-Api-Secret-Token` pour vérification.
  - Le HTTP du Gateway gère les requêtes webhook à `channels.zalo.webhookPath` (par défaut, le chemin de l’URL webhook).
  - Les requêtes doivent utiliser `Content-Type: application/json` (ou des types de média `+json`).
  - Les événements dupliqués (`event_name + message_id`) sont ignorés pendant une courte fenêtre de rejeu.
  - Le trafic en rafale est limité en débit par chemin/source et peut renvoyer HTTP 429.

**Remarque :** getUpdates (polling) et webhook sont mutuellement exclusifs selon la documentation de l’API Zalo.

## Types de messages pris en charge

Pour un aperçu rapide de la prise en charge, consultez [Capacités](#capacités). Les notes ci-dessous ajoutent des détails lorsque le comportement nécessite un contexte supplémentaire.

- **Messages texte** : prise en charge complète avec découpage à 2000 caractères.
- **URL simples dans le texte** : se comportent comme une entrée texte normale.
- **Aperçus de liens / cartes de lien enrichies** : consultez le statut des bots Marketplace dans [Capacités](#capacités) ; ils ne déclenchaient pas de réponse de façon fiable.
- **Messages image** : consultez le statut des bots Marketplace dans [Capacités](#capacités) ; la gestion des images entrantes était peu fiable (indicateur de saisie sans réponse finale).
- **Stickers** : consultez le statut des bots Marketplace dans [Capacités](#capacités).
- **Notes vocales / fichiers audio / vidéo / pièces jointes de fichier génériques** : consultez le statut des bots Marketplace dans [Capacités](#capacités).
- **Types non pris en charge** : consignés (par exemple, messages d’utilisateurs protégés).

## Capacités

Ce tableau résume le comportement actuel des **bots Zalo Bot Creator / Marketplace** dans OpenClaw.

| Fonctionnalité              | Statut                                               |
| --------------------------- | ---------------------------------------------------- |
| Messages directs            | ✅ Pris en charge                                    |
| Groupes                     | ❌ Non disponible pour les bots Marketplace          |
| Médias (images entrantes)   | ⚠️ Limité / vérifier dans votre environnement        |
| Médias (images sortantes)   | ⚠️ Non retesté pour les bots Marketplace             |
| URL simples dans le texte   | ✅ Pris en charge                                    |
| Aperçus de liens            | ⚠️ Peu fiable pour les bots Marketplace              |
| Réactions                   | ❌ Non pris en charge                                |
| Stickers                    | ⚠️ Pas de réponse de l’agent pour les bots Marketplace |
| Notes vocales / audio / vidéo | ⚠️ Pas de réponse de l’agent pour les bots Marketplace |
| Pièces jointes de fichier   | ⚠️ Pas de réponse de l’agent pour les bots Marketplace |
| Threads                     | ❌ Non pris en charge                                |
| Sondages                    | ❌ Non pris en charge                                |
| Commandes natives           | ❌ Non pris en charge                                |
| Streaming                   | ⚠️ Bloqué (limite de 2000 caractères)                |

## Cibles de livraison (CLI/cron)

- Utilisez un identifiant de chat comme cible.
- Exemple : `openclaw message send --channel zalo --target 123456789 --message "hi"`.

## Dépannage

**Le bot ne répond pas :**

- Vérifiez que le jeton est valide : `openclaw channels status --probe`
- Vérifiez que l’expéditeur est approuvé (appairage ou allowFrom)
- Consultez les journaux du gateway : `openclaw logs --follow`

**Le webhook ne reçoit pas d’événements :**

- Assurez-vous que l’URL webhook utilise HTTPS
- Vérifiez que le jeton secret contient 8 à 256 caractères
- Confirmez que le point de terminaison HTTP du gateway est accessible sur le chemin configuré
- Vérifiez que le polling getUpdates n’est pas en cours d’exécution (ils sont mutuellement exclusifs)

## Référence de configuration (Zalo)

Configuration complète : [Configuration](/fr/gateway/configuration)

Les clés plates de niveau supérieur (`channels.zalo.botToken`, `channels.zalo.dmPolicy` et similaires) sont un raccourci hérité pour compte unique. Préférez `channels.zalo.accounts.<id>.*` pour les nouvelles configurations. Les deux formes restent documentées ici parce qu’elles existent dans le schéma.

Options du fournisseur :

- `channels.zalo.enabled` : activer/désactiver le démarrage du canal.
- `channels.zalo.botToken` : jeton de bot de Zalo Bot Platform.
- `channels.zalo.tokenFile` : lire le jeton depuis un chemin de fichier standard. Les liens symboliques sont rejetés.
- `channels.zalo.dmPolicy` : `pairing | allowlist | open | disabled` (par défaut : pairing).
- `channels.zalo.allowFrom` : liste d’autorisation des messages privés (ID utilisateur). `open` nécessite `"*"`. L’assistant demandera des ID numériques.
- `channels.zalo.groupPolicy` : `open | allowlist | disabled` (par défaut : allowlist). Présent dans la configuration ; consultez [Capacités](#capacités) et [Contrôle d’accès (groupes)](#contrôle-daccès-groupes) pour le comportement actuel des bots Marketplace.
- `channels.zalo.groupAllowFrom` : liste d’autorisation des expéditeurs de groupe (ID utilisateur). Se rabat sur `allowFrom` lorsqu’elle n’est pas définie.
- `channels.zalo.mediaMaxMb` : plafond des médias entrants/sortants (Mo, 5 par défaut).
- `channels.zalo.webhookUrl` : activer le mode webhook (HTTPS requis).
- `channels.zalo.webhookSecret` : secret webhook (8 à 256 caractères).
- `channels.zalo.webhookPath` : chemin webhook sur le serveur HTTP du gateway.
- `channels.zalo.proxy` : URL de proxy pour les requêtes API.

Options multi-comptes :

- `channels.zalo.accounts.<id>.botToken` : jeton par compte.
- `channels.zalo.accounts.<id>.tokenFile` : fichier de jeton standard par compte. Les liens symboliques sont rejetés.
- `channels.zalo.accounts.<id>.name` : nom d’affichage.
- `channels.zalo.accounts.<id>.enabled` : activer/désactiver le compte.
- `channels.zalo.accounts.<id>.dmPolicy` : politique de messages privés par compte.
- `channels.zalo.accounts.<id>.allowFrom` : liste d’autorisation par compte.
- `channels.zalo.accounts.<id>.groupPolicy` : politique de groupe par compte. Présente dans la configuration ; consultez [Capacités](#capacités) et [Contrôle d’accès (groupes)](#contrôle-daccès-groupes) pour le comportement actuel des bots Marketplace.
- `channels.zalo.accounts.<id>.groupAllowFrom` : liste d’autorisation des expéditeurs de groupe par compte.
- `channels.zalo.accounts.<id>.webhookUrl` : URL webhook par compte.
- `channels.zalo.accounts.<id>.webhookSecret` : secret webhook par compte.
- `channels.zalo.accounts.<id>.webhookPath` : chemin webhook par compte.
- `channels.zalo.accounts.<id>.proxy` : URL de proxy par compte.

## Connexe

- [Vue d’ensemble des canaux](/fr/channels) — tous les canaux pris en charge
- [Appairage](/fr/channels/pairing) — authentification des messages privés et flux d’appairage
- [Groupes](/fr/channels/groups) — comportement des chats de groupe et filtrage par mention
- [Routage des canaux](/fr/channels/channel-routing) — routage de session pour les messages
- [Sécurité](/fr/gateway/security) — modèle d’accès et durcissement
