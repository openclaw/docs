---
read_when:
    - Travailler sur les fonctionnalités Zalo ou les Webhooks
summary: État de la prise en charge, fonctionnalités et configuration du bot Zalo
title: Zalo
x-i18n:
    generated_at: "2026-05-02T22:16:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6226af1217e1e8b03b485df99f6375872b487f7040c091f2bb2d85e18dec75d0
    source_path: channels/zalo.md
    workflow: 16
---

Status : expérimental. Les messages privés sont pris en charge. La section [Capacités](#capabilities) ci-dessous reflète le comportement actuel des bots Marketplace.

## Plugin fourni

Zalo est livré comme plugin fourni dans les versions actuelles d’OpenClaw, les builds
empaquetés normaux ne nécessitent donc pas d’installation séparée.

Si vous utilisez un build plus ancien ou une installation personnalisée qui exclut Zalo, installez le
package npm directement :

- Installer via la CLI : `openclaw plugins install @openclaw/zalo`
- Version épinglée : `openclaw plugins install @openclaw/zalo@2026.5.2`
- Ou depuis un checkout source : `openclaw plugins install ./path/to/local/zalo-plugin`
- Détails : [Plugins](/fr/tools/plugin)

## Configuration rapide (débutant)

1. Assurez-vous que le plugin Zalo est disponible.
   - Les versions empaquetées actuelles d’OpenClaw l’intègrent déjà.
   - Les installations plus anciennes/personnalisées peuvent l’ajouter manuellement avec les commandes ci-dessus.
2. Définissez le token :
   - Env : `ZALO_BOT_TOKEN=...`
   - Ou config : `channels.zalo.accounts.default.botToken: "..."`.
3. Redémarrez le Gateway (ou terminez la configuration).
4. L’accès aux messages privés utilise l’association par défaut ; approuvez le code d’association au premier contact.

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

Zalo est une application de messagerie axée sur le Vietnam ; son Bot API permet au Gateway d’exécuter un bot pour les conversations 1:1.
C’est un bon choix pour le support ou les notifications lorsque vous voulez un routage déterministe vers Zalo.

Cette page reflète le comportement actuel d’OpenClaw pour les **bots Zalo Bot Creator / Marketplace**.
Les **bots Zalo Official Account (OA)** sont une surface produit Zalo différente et peuvent se comporter autrement.

- Un canal Zalo Bot API possédé par le Gateway.
- Routage déterministe : les réponses retournent vers Zalo ; le modèle ne choisit jamais les canaux.
- Les messages privés partagent la session principale de l’agent.
- La section [Capacités](#capabilities) ci-dessous montre la prise en charge actuelle des bots Marketplace.

## Configuration (chemin rapide)

### 1) Créer un token de bot (Zalo Bot Platform)

1. Accédez à [https://bot.zaloplatforms.com](https://bot.zaloplatforms.com) et connectez-vous.
2. Créez un nouveau bot et configurez ses paramètres.
3. Copiez le token complet du bot (généralement `numeric_id:secret`). Pour les bots Marketplace, le token d’exécution utilisable peut apparaître dans le message de bienvenue du bot après sa création.

### 2) Configurer le token (env ou config)

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

Si vous passez plus tard à une surface de bot Zalo où les groupes sont disponibles, vous pouvez ajouter explicitement une config propre aux groupes, comme `groupPolicy` et `groupAllowFrom`. Pour le comportement actuel des bots Marketplace, consultez [Capacités](#capabilities).

Option env : `ZALO_BOT_TOKEN=...` (fonctionne uniquement pour le compte par défaut).

Prise en charge multicomptes : utilisez `channels.zalo.accounts` avec des tokens par compte et un `name` facultatif.

3. Redémarrez le Gateway. Zalo démarre lorsqu’un token est résolu (env ou config).
4. L’accès aux messages privés utilise l’association par défaut. Approuvez le code lors du premier contact avec le bot.

## Fonctionnement (comportement)

- Les messages entrants sont normalisés dans l’enveloppe de canal partagée avec des placeholders de médias.
- Les réponses sont toujours routées vers la même conversation Zalo.
- Long-polling par défaut ; le mode Webhook est disponible avec `channels.zalo.webhookUrl`.

## Limites

- Le texte sortant est découpé en blocs de 2000 caractères (limite de l’API Zalo).
- Les téléchargements/envois de médias sont plafonnés par `channels.zalo.mediaMaxMb` (5 par défaut).
- Le streaming est bloqué par défaut, car la limite de 2000 caractères rend le streaming moins utile.

## Contrôle d’accès (messages privés)

### Accès aux messages privés

- Par défaut : `channels.zalo.dmPolicy = "pairing"`. Les expéditeurs inconnus reçoivent un code d’association ; les messages sont ignorés jusqu’à approbation (les codes expirent après 1 heure).
- Approuver via :
  - `openclaw pairing list zalo`
  - `openclaw pairing approve zalo <CODE>`
- L’association est l’échange de token par défaut. Détails : [Association](/fr/channels/pairing)
- `channels.zalo.allowFrom` accepte les ID utilisateur numériques (aucune recherche par nom d’utilisateur disponible).

## Contrôle d’accès (groupes)

Pour les **bots Zalo Bot Creator / Marketplace**, la prise en charge des groupes n’était pas disponible en pratique, car le bot ne pouvait pas du tout être ajouté à un groupe.

Cela signifie que les clés de config liées aux groupes ci-dessous existent dans le schéma, mais n’étaient pas utilisables pour les bots Marketplace :

- `channels.zalo.groupPolicy` contrôle le traitement des messages entrants de groupe : `open | allowlist | disabled`.
- `channels.zalo.groupAllowFrom` limite les ID d’expéditeur pouvant déclencher le bot dans les groupes.
- Si `groupAllowFrom` n’est pas défini, Zalo se rabat sur `allowFrom` pour les contrôles d’expéditeur.
- Note d’exécution : si `channels.zalo` est entièrement absent, l’exécution se rabat toujours sur `groupPolicy="allowlist"` par sécurité.

Les valeurs de politique de groupe (lorsque l’accès aux groupes est disponible sur votre surface de bot) sont :

- `groupPolicy: "disabled"` — bloque tous les messages de groupe.
- `groupPolicy: "open"` — autorise n’importe quel membre du groupe (avec déclenchement par mention).
- `groupPolicy: "allowlist"` — valeur par défaut fermée en cas d’échec ; seuls les expéditeurs autorisés sont acceptés.

Si vous utilisez une autre surface de produit de bot Zalo et avez vérifié que le comportement de groupe fonctionne, documentez-le séparément plutôt que de supposer qu’il correspond au flux des bots Marketplace.

## Long-polling ou Webhook

- Par défaut : long-polling (aucune URL publique requise).
- Mode Webhook : définissez `channels.zalo.webhookUrl` et `channels.zalo.webhookSecret`.
  - Le secret du Webhook doit comporter 8 à 256 caractères.
  - L’URL du Webhook doit utiliser HTTPS.
  - Zalo envoie les événements avec l’en-tête `X-Bot-Api-Secret-Token` pour vérification.
  - Le HTTP du Gateway traite les requêtes Webhook à `channels.zalo.webhookPath` (par défaut, le chemin de l’URL du Webhook).
  - Les requêtes doivent utiliser `Content-Type: application/json` (ou des types de média `+json`).
  - Les événements dupliqués (`event_name + message_id`) sont ignorés pendant une courte fenêtre de rejeu.
  - Le trafic en rafale est limité par débit selon le chemin/la source et peut renvoyer HTTP 429.

**Remarque :** getUpdates (polling) et Webhook sont mutuellement exclusifs selon la documentation de l’API Zalo.

## Types de messages pris en charge

Pour un aperçu rapide de la prise en charge, consultez [Capacités](#capabilities). Les notes ci-dessous ajoutent des détails lorsque le comportement nécessite un contexte supplémentaire.

- **Messages texte** : prise en charge complète avec découpage à 2000 caractères.
- **URL simples dans le texte** : se comportent comme une entrée texte normale.
- **Aperçus de liens / cartes de liens enrichies** : consultez le statut des bots Marketplace dans [Capacités](#capabilities) ; ils ne déclenchaient pas de réponse de manière fiable.
- **Messages image** : consultez le statut des bots Marketplace dans [Capacités](#capabilities) ; le traitement des images entrantes était peu fiable (indicateur de saisie sans réponse finale).
- **Stickers** : consultez le statut des bots Marketplace dans [Capacités](#capabilities).
- **Notes vocales / fichiers audio / vidéo / pièces jointes de fichier génériques** : consultez le statut des bots Marketplace dans [Capacités](#capabilities).
- **Types non pris en charge** : journalisés (par exemple, messages provenant d’utilisateurs protégés).

## Capacités

Ce tableau résume le comportement actuel des **bots Zalo Bot Creator / Marketplace** dans OpenClaw.

| Fonctionnalité              | Statut                                  |
| --------------------------- | --------------------------------------- |
| Messages directs            | ✅ Pris en charge                       |
| Groupes                     | ❌ Non disponible pour les bots Marketplace |
| Média (images entrantes)    | ⚠️ Limité / à vérifier dans votre environnement |
| Média (images sortantes)    | ⚠️ Non retesté pour les bots Marketplace |
| URL simples dans le texte   | ✅ Pris en charge                       |
| Aperçus de liens            | ⚠️ Peu fiable pour les bots Marketplace |
| Réactions                   | ❌ Non prises en charge                 |
| Stickers                    | ⚠️ Pas de réponse de l’agent pour les bots Marketplace |
| Notes vocales / audio / vidéo | ⚠️ Pas de réponse de l’agent pour les bots Marketplace |
| Pièces jointes de fichier   | ⚠️ Pas de réponse de l’agent pour les bots Marketplace |
| Threads                     | ❌ Non pris en charge                   |
| Sondages                    | ❌ Non pris en charge                   |
| Commandes natives           | ❌ Non prises en charge                 |
| Streaming                   | ⚠️ Bloqué (limite de 2000 caractères)  |

## Cibles de livraison (CLI/cron)

- Utilisez un ID de conversation comme cible.
- Exemple : `openclaw message send --channel zalo --target 123456789 --message "hi"`.

## Dépannage

**Le bot ne répond pas :**

- Vérifiez que le token est valide : `openclaw channels status --probe`
- Vérifiez que l’expéditeur est approuvé (association ou allowFrom)
- Consultez les journaux du Gateway : `openclaw logs --follow`

**Le Webhook ne reçoit pas d’événements :**

- Assurez-vous que l’URL du Webhook utilise HTTPS
- Vérifiez que le token secret comporte 8 à 256 caractères
- Confirmez que l’endpoint HTTP du Gateway est accessible au chemin configuré
- Vérifiez que le polling getUpdates n’est pas en cours d’exécution (ils sont mutuellement exclusifs)

## Référence de configuration (Zalo)

Configuration complète : [Configuration](/fr/gateway/configuration)

Les clés plates de premier niveau (`channels.zalo.botToken`, `channels.zalo.dmPolicy` et similaires) sont un raccourci hérité pour compte unique. Préférez `channels.zalo.accounts.<id>.*` pour les nouvelles configs. Les deux formes restent documentées ici, car elles existent dans le schéma.

Options du provider :

- `channels.zalo.enabled` : active/désactive le démarrage du canal.
- `channels.zalo.botToken` : token du bot provenant de Zalo Bot Platform.
- `channels.zalo.tokenFile` : lit le token depuis un chemin de fichier régulier. Les symlinks sont rejetés.
- `channels.zalo.dmPolicy` : `pairing | allowlist | open | disabled` (par défaut : pairing).
- `channels.zalo.allowFrom` : allowlist des messages privés (ID utilisateur). `open` exige `"*"`. L’assistant demandera des ID numériques.
- `channels.zalo.groupPolicy` : `open | allowlist | disabled` (par défaut : allowlist). Présent dans la config ; consultez [Capacités](#capabilities) et [Contrôle d’accès (groupes)](#access-control-groups) pour le comportement actuel des bots Marketplace.
- `channels.zalo.groupAllowFrom` : allowlist des expéditeurs de groupe (ID utilisateur). Se rabat sur `allowFrom` lorsqu’il n’est pas défini.
- `channels.zalo.mediaMaxMb` : plafond des médias entrants/sortants (Mo, 5 par défaut).
- `channels.zalo.webhookUrl` : active le mode Webhook (HTTPS requis).
- `channels.zalo.webhookSecret` : secret du Webhook (8 à 256 caractères).
- `channels.zalo.webhookPath` : chemin du Webhook sur le serveur HTTP du Gateway.
- `channels.zalo.proxy` : URL de proxy pour les requêtes API.

Options multicomptes :

- `channels.zalo.accounts.<id>.botToken` : token par compte.
- `channels.zalo.accounts.<id>.tokenFile` : fichier de token régulier par compte. Les symlinks sont rejetés.
- `channels.zalo.accounts.<id>.name` : nom d’affichage.
- `channels.zalo.accounts.<id>.enabled` : active/désactive le compte.
- `channels.zalo.accounts.<id>.dmPolicy` : politique de messages privés par compte.
- `channels.zalo.accounts.<id>.allowFrom` : allowlist par compte.
- `channels.zalo.accounts.<id>.groupPolicy` : politique de groupe par compte. Présent dans la config ; consultez [Capacités](#capabilities) et [Contrôle d’accès (groupes)](#access-control-groups) pour le comportement actuel des bots Marketplace.
- `channels.zalo.accounts.<id>.groupAllowFrom` : allowlist des expéditeurs de groupe par compte.
- `channels.zalo.accounts.<id>.webhookUrl` : URL du Webhook par compte.
- `channels.zalo.accounts.<id>.webhookSecret` : secret du Webhook par compte.
- `channels.zalo.accounts.<id>.webhookPath` : chemin du Webhook par compte.
- `channels.zalo.accounts.<id>.proxy` : URL de proxy par compte.

## Liens connexes

- [Vue d’ensemble des canaux](/fr/channels) — tous les canaux pris en charge
- [Association](/fr/channels/pairing) — authentification des messages privés et flux d’association
- [Groupes](/fr/channels/groups) — comportement des conversations de groupe et déclenchement par mention
- [Routage de canal](/fr/channels/channel-routing) — routage de session pour les messages
- [Sécurité](/fr/gateway/security) — modèle d’accès et durcissement
