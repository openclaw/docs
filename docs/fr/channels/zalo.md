---
read_when:
    - Vous travaillez sur des fonctionnalités ou des Webhooks Zalo
summary: Statut de prise en charge, fonctionnalités et configuration de Zalo Bot
title: Zalo
x-i18n:
    generated_at: "2026-04-25T13:42:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: e7eb9d5b1879fcdf70220c4b1542e843e47e12048ff567eeb0e1cb3367b3d200
    source_path: channels/zalo.md
    workflow: 15
---

Statut : expérimental. Les messages privés sont pris en charge. La section [Fonctionnalités](#capabilities) ci-dessous reflète le comportement actuel des bots Marketplace.

## Plugin inclus

Zalo est fourni comme plugin inclus dans les versions actuelles d’OpenClaw, donc les
builds packagés normaux ne nécessitent pas d’installation séparée.

Si vous utilisez une version plus ancienne ou une installation personnalisée qui exclut Zalo, installez-le
manuellement :

- Installer via la CLI : `openclaw plugins install @openclaw/zalo`
- Ou depuis une extraction des sources : `openclaw plugins install ./path/to/local/zalo-plugin`
- Détails : [Plugins](/fr/tools/plugin)

## Configuration rapide (débutant)

1. Assurez-vous que le plugin Zalo est disponible.
   - Les versions packagées actuelles d’OpenClaw l’incluent déjà.
   - Les installations plus anciennes/personnalisées peuvent l’ajouter manuellement avec les commandes ci-dessus.
2. Définissez le jeton :
   - Variable d’environnement : `ZALO_BOT_TOKEN=...`
   - Ou configuration : `channels.zalo.accounts.default.botToken: "..."`.
3. Redémarrez la gateway (ou terminez la configuration).
4. L’accès en message privé utilise l’appairage par défaut ; approuvez le code d’appairage au premier contact.

Configuration minimale :

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

Zalo est une application de messagerie populaire au Vietnam ; son API Bot permet à la Gateway d’exécuter un bot pour des conversations en tête-à-tête.
C’est un bon choix pour le support ou les notifications lorsque vous souhaitez un routage déterministe vers Zalo.

Cette page reflète le comportement actuel d’OpenClaw pour les **bots Zalo Bot Creator / Marketplace**.
Les **bots Zalo Official Account (OA)** constituent une autre surface produit Zalo et peuvent se comporter différemment.

- Un canal API Zalo Bot détenu par la Gateway.
- Routage déterministe : les réponses reviennent vers Zalo ; le modèle ne choisit jamais les canaux.
- Les messages privés partagent la session principale de l’agent.
- La section [Fonctionnalités](#capabilities) ci-dessous montre la prise en charge actuelle des bots Marketplace.

## Configuration (voie rapide)

### 1) Créer un jeton de bot (plateforme Zalo Bot)

1. Accédez à [https://bot.zaloplatforms.com](https://bot.zaloplatforms.com) et connectez-vous.
2. Créez un nouveau bot et configurez ses paramètres.
3. Copiez le jeton complet du bot (généralement `numeric_id:secret`). Pour les bots Marketplace, le jeton d’exécution utilisable peut apparaître dans le message de bienvenue du bot après sa création.

### 2) Configurer le jeton (variable d’environnement ou configuration)

Exemple :

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

Si vous passez plus tard à une surface de bot Zalo où les groupes sont disponibles, vous pourrez ajouter explicitement une configuration spécifique aux groupes, comme `groupPolicy` et `groupAllowFrom`. Pour le comportement actuel des bots Marketplace, voir [Fonctionnalités](#capabilities).

Option via variable d’environnement : `ZALO_BOT_TOKEN=...` (fonctionne uniquement pour le compte par défaut).

Prise en charge multi-comptes : utilisez `channels.zalo.accounts` avec des jetons par compte et un `name` facultatif.

3. Redémarrez la gateway. Zalo démarre lorsqu’un jeton est résolu (depuis l’environnement ou la configuration).
4. L’accès en message privé utilise l’appairage par défaut. Approuvez le code lorsque le bot est contacté pour la première fois.

## Fonctionnement (comportement)

- Les messages entrants sont normalisés dans l’enveloppe de canal partagée avec des espaces réservés pour les médias.
- Les réponses sont toujours routées vers la même discussion Zalo.
- Long-polling par défaut ; mode Webhook disponible avec `channels.zalo.webhookUrl`.

## Limites

- Le texte sortant est découpé en blocs de 2 000 caractères (limite de l’API Zalo).
- Les téléchargements/uploads de médias sont limités par `channels.zalo.mediaMaxMb` (5 par défaut).
- Le streaming est bloqué par défaut, car la limite de 2 000 caractères le rend moins utile.

## Contrôle d’accès (messages privés)

### Accès en message privé

- Par défaut : `channels.zalo.dmPolicy = "pairing"`. Les expéditeurs inconnus reçoivent un code d’appairage ; les messages sont ignorés jusqu’à approbation (les codes expirent après 1 heure).
- Approbation via :
  - `openclaw pairing list zalo`
  - `openclaw pairing approve zalo <CODE>`
- L’appairage est l’échange de jeton par défaut. Détails : [Appairage](/fr/channels/pairing)
- `channels.zalo.allowFrom` accepte des identifiants utilisateur numériques (aucune recherche par nom d’utilisateur n’est disponible).

## Contrôle d’accès (groupes)

Pour les **bots Zalo Bot Creator / Marketplace**, la prise en charge des groupes n’était pas disponible en pratique, car le bot ne pouvait pas du tout être ajouté à un groupe.

Cela signifie que les clés de configuration liées aux groupes ci-dessous existent dans le schéma, mais n’étaient pas utilisables pour les bots Marketplace :

- `channels.zalo.groupPolicy` contrôle le traitement entrant des groupes : `open | allowlist | disabled`.
- `channels.zalo.groupAllowFrom` limite quels identifiants d’expéditeur peuvent déclencher le bot dans les groupes.
- Si `groupAllowFrom` n’est pas défini, Zalo se replie sur `allowFrom` pour les vérifications d’expéditeur.
- Remarque d’exécution : si `channels.zalo` est totalement absent, l’exécution se replie quand même sur `groupPolicy="allowlist"` par sécurité.

Les valeurs de politique de groupe (lorsque l’accès aux groupes est disponible sur votre surface de bot) sont :

- `groupPolicy: "disabled"` — bloque tous les messages de groupe.
- `groupPolicy: "open"` — autorise n’importe quel membre du groupe (avec restriction par mention).
- `groupPolicy: "allowlist"` — défaut en mode fermé ; seuls les expéditeurs autorisés sont acceptés.

Si vous utilisez une autre surface produit de bot Zalo et avez vérifié un comportement de groupe fonctionnel, documentez cela séparément plutôt que de supposer qu’il correspond au flux des bots Marketplace.

## Long-polling et webhook

- Par défaut : long-polling (aucune URL publique requise).
- Mode Webhook : définissez `channels.zalo.webhookUrl` et `channels.zalo.webhookSecret`.
  - Le secret Webhook doit contenir entre 8 et 256 caractères.
  - L’URL Webhook doit utiliser HTTPS.
  - Zalo envoie les événements avec l’en-tête `X-Bot-Api-Secret-Token` pour vérification.
  - Le HTTP Gateway traite les requêtes Webhook à `channels.zalo.webhookPath` (par défaut, le chemin de l’URL Webhook).
  - Les requêtes doivent utiliser `Content-Type: application/json` (ou des types de média `+json`).
  - Les événements dupliqués (`event_name + message_id`) sont ignorés pendant une courte fenêtre de rejeu.
  - Le trafic en rafale est limité par débit par chemin/source et peut renvoyer HTTP 429.

**Remarque :** `getUpdates` (polling) et Webhook sont mutuellement exclusifs selon la documentation de l’API Zalo.

## Types de messages pris en charge

Pour un aperçu rapide de la prise en charge, voir [Fonctionnalités](#capabilities). Les remarques ci-dessous ajoutent des détails lorsque le comportement nécessite plus de contexte.

- **Messages texte** : prise en charge complète avec découpage en blocs de 2 000 caractères.
- **URL brutes dans le texte** : se comportent comme une entrée texte normale.
- **Aperçus de liens / cartes de lien enrichies** : voir le statut des bots Marketplace dans [Fonctionnalités](#capabilities) ; ils ne déclenchaient pas de réponse de manière fiable.
- **Messages image** : voir le statut des bots Marketplace dans [Fonctionnalités](#capabilities) ; la gestion des images entrantes n’était pas fiable (indicateur de saisie sans réponse finale).
- **Stickers** : voir le statut des bots Marketplace dans [Fonctionnalités](#capabilities).
- **Messages vocaux / fichiers audio / vidéo / pièces jointes de fichier génériques** : voir le statut des bots Marketplace dans [Fonctionnalités](#capabilities).
- **Types non pris en charge** : journalisés (par exemple, messages d’utilisateurs protégés).

## Fonctionnalités

Ce tableau résume le comportement actuel des **bots Zalo Bot Creator / Marketplace** dans OpenClaw.

| Fonctionnalité            | Statut                                  |
| ------------------------- | --------------------------------------- |
| Messages directs          | ✅ Pris en charge                       |
| Groupes                   | ❌ Indisponibles pour les bots Marketplace |
| Médias (images entrantes) | ⚠️ Limité / à vérifier dans votre environnement |
| Médias (images sortantes) | ⚠️ Non retesté pour les bots Marketplace |
| URL brutes dans le texte  | ✅ Pris en charge                       |
| Aperçus de liens          | ⚠️ Peu fiable pour les bots Marketplace |
| Réactions                 | ❌ Non pris en charge                   |
| Stickers                  | ⚠️ Pas de réponse de l’agent pour les bots Marketplace |
| Messages vocaux / audio / vidéo | ⚠️ Pas de réponse de l’agent pour les bots Marketplace |
| Pièces jointes de fichier | ⚠️ Pas de réponse de l’agent pour les bots Marketplace |
| Fils de discussion        | ❌ Non pris en charge                   |
| Sondages                  | ❌ Non pris en charge                   |
| Commandes natives         | ❌ Non pris en charge                   |
| Streaming                 | ⚠️ Bloqué (limite de 2 000 caractères)  |

## Cibles de distribution (CLI/Cron)

- Utilisez un identifiant de discussion comme cible.
- Exemple : `openclaw message send --channel zalo --target 123456789 --message "hi"`.

## Dépannage

**Le bot ne répond pas :**

- Vérifiez que le jeton est valide : `openclaw channels status --probe`
- Vérifiez que l’expéditeur est approuvé (appairage ou allowFrom)
- Consultez les journaux de la gateway : `openclaw logs --follow`

**Le Webhook ne reçoit pas d’événements :**

- Assurez-vous que l’URL Webhook utilise HTTPS
- Vérifiez que le jeton secret contient entre 8 et 256 caractères
- Confirmez que le point de terminaison HTTP de la gateway est accessible sur le chemin configuré
- Vérifiez que le polling `getUpdates` n’est pas en cours d’exécution (ils sont mutuellement exclusifs)

## Référence de configuration (Zalo)

Configuration complète : [Configuration](/fr/gateway/configuration)

Les clés plates de niveau supérieur (`channels.zalo.botToken`, `channels.zalo.dmPolicy`, etc.) constituent un raccourci hérité pour compte unique. Préférez `channels.zalo.accounts.<id>.*` pour les nouvelles configurations. Les deux formes sont toujours documentées ici parce qu’elles existent dans le schéma.

Options du fournisseur :

- `channels.zalo.enabled` : activer/désactiver le démarrage du canal.
- `channels.zalo.botToken` : jeton du bot depuis la plateforme Zalo Bot.
- `channels.zalo.tokenFile` : lire le jeton depuis un chemin de fichier ordinaire. Les liens symboliques sont rejetés.
- `channels.zalo.dmPolicy` : `pairing | allowlist | open | disabled` (par défaut : pairing).
- `channels.zalo.allowFrom` : liste d’autorisations des messages privés (identifiants utilisateur). `open` nécessite `"*"`. L’assistant demandera des identifiants numériques.
- `channels.zalo.groupPolicy` : `open | allowlist | disabled` (par défaut : allowlist). Présent dans la configuration ; voir [Fonctionnalités](#capabilities) et [Contrôle d’accès (groupes)](#access-control-groups) pour le comportement actuel des bots Marketplace.
- `channels.zalo.groupAllowFrom` : liste d’autorisations des expéditeurs de groupe (identifiants utilisateur). Se replie sur `allowFrom` lorsqu’elle n’est pas définie.
- `channels.zalo.mediaMaxMb` : limite de média entrant/sortant (Mo, 5 par défaut).
- `channels.zalo.webhookUrl` : activer le mode Webhook (HTTPS requis).
- `channels.zalo.webhookSecret` : secret Webhook (8-256 caractères).
- `channels.zalo.webhookPath` : chemin Webhook sur le serveur HTTP gateway.
- `channels.zalo.proxy` : URL du proxy pour les requêtes API.

Options multi-comptes :

- `channels.zalo.accounts.<id>.botToken` : jeton par compte.
- `channels.zalo.accounts.<id>.tokenFile` : fichier de jeton ordinaire par compte. Les liens symboliques sont rejetés.
- `channels.zalo.accounts.<id>.name` : nom d’affichage.
- `channels.zalo.accounts.<id>.enabled` : activer/désactiver le compte.
- `channels.zalo.accounts.<id>.dmPolicy` : politique de message privé par compte.
- `channels.zalo.accounts.<id>.allowFrom` : liste d’autorisations par compte.
- `channels.zalo.accounts.<id>.groupPolicy` : politique de groupe par compte. Présent dans la configuration ; voir [Fonctionnalités](#capabilities) et [Contrôle d’accès (groupes)](#access-control-groups) pour le comportement actuel des bots Marketplace.
- `channels.zalo.accounts.<id>.groupAllowFrom` : liste d’autorisations des expéditeurs de groupe par compte.
- `channels.zalo.accounts.<id>.webhookUrl` : URL Webhook par compte.
- `channels.zalo.accounts.<id>.webhookSecret` : secret Webhook par compte.
- `channels.zalo.accounts.<id>.webhookPath` : chemin Webhook par compte.
- `channels.zalo.accounts.<id>.proxy` : URL de proxy par compte.

## Voir aussi

- [Vue d’ensemble des canaux](/fr/channels) — tous les canaux pris en charge
- [Appairage](/fr/channels/pairing) — authentification en message privé et flux d’appairage
- [Groupes](/fr/channels/groups) — comportement de discussion de groupe et restriction par mention
- [Routage des canaux](/fr/channels/channel-routing) — routage de session pour les messages
- [Sécurité](/fr/gateway/security) — modèle d’accès et durcissement
