---
read_when:
    - Développement de fonctionnalités Zalo ou de webhooks
summary: État de la prise en charge, fonctionnalités et configuration des bots Zalo
title: Zalo
x-i18n:
    generated_at: "2026-07-12T02:39:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 36e624f1abeeaee56d7376b9df9209f8e7614ade2f089bcecd76ff746b942765
    source_path: channels/zalo.md
    workflow: 16
---

Statut : expérimental. Les messages directs et les discussions de groupe sont tous deux implémentés ; le tableau des [fonctionnalités](#capabilities) ci-dessous reflète le comportement vérifié des bots Zalo Bot Creator / Marketplace.

## Plugin intégré

Zalo est fourni comme Plugin intégré dans les versions actuelles d’OpenClaw ; les versions empaquetées ne nécessitent donc pas d’installation séparée.

Sur une ancienne version ou une installation personnalisée excluant Zalo, installez directement le paquet npm :

- Installation : `openclaw plugins install @openclaw/zalo`
- Version épinglée : `openclaw plugins install @openclaw/zalo@2026.6.11`
- Depuis une copie de travail locale : `openclaw plugins install ./path/to/local/zalo-plugin`
- Détails : [Plugins](/fr/tools/plugin)

## Configuration rapide

1. Créez un jeton de bot sur [https://bot.zaloplatforms.com](https://bot.zaloplatforms.com) (connectez-vous, créez un bot et configurez ses paramètres). Le jeton suit le format `numeric_id:secret` ; pour les bots Marketplace, le jeton utilisable à l’exécution peut apparaître dans le message de bienvenue du bot.
2. Définissez le jeton, soit dans la variable d’environnement `ZALO_BOT_TOKEN=...` (compte par défaut uniquement), soit dans la configuration.
3. Redémarrez le Gateway.
4. Approuvez le code d’association lors du premier contact par message direct (la politique par défaut des messages directs est l’association).

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

Comptes multiples : ajoutez d’autres entrées sous `channels.zalo.accounts.<id>`, chacune avec ses propres `botToken` et `name`. `channels.zalo.botToken` (forme plate, sans `accounts`) est un raccourci historique pour un compte unique ; préférez `accounts.<id>.*` dans les nouvelles configurations.

## Présentation

Zalo est une application de messagerie principalement destinée au Vietnam. Son API de bot permet au Gateway d’exécuter un bot pour les conversations individuelles comme pour les discussions de groupe, avec un routage déterministe des réponses vers Zalo (le modèle ne choisit jamais les canaux).

Cette page concerne les **bots Zalo Bot Creator / Marketplace**. Les **bots Zalo Official Account (OA)** constituent une offre différente et peuvent se comporter autrement ; ils ne sont pas traités sur cette page.

## Fonctionnement

- Les messages entrants sont normalisés dans l’enveloppe de canal commune avec des espaces réservés pour les médias.
- Les réponses sont toujours renvoyées vers la même discussion Zalo ; la réponse avec citation n’est pas utilisée (`replyToMode` est désactivé de manière fixe).
- L’interrogation longue (`getUpdates`) est utilisée par défaut ; le mode Webhook est disponible via `channels.zalo.webhookUrl`.
- Dans les groupes, une @mention est nécessaire pour déclencher le bot ; ce comportement n’est pas configurable par canal.

## Limites

| Limite                                      | Valeur                                                                                          |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Taille des segments de texte sortants       | 2 000 caractères (limite de l’API Zalo)                                                        |
| Taille des médias (entrants/sortants)       | `channels.zalo.mediaMaxMb`, valeur par défaut : `5` Mo                                          |
| Corps des requêtes Webhook                  | 1 Mo, délai d’expiration de lecture de 30 s                                                     |
| Limite de débit des Webhooks                | 120 requêtes par période de 60 s, par chemin et IP cliente, puis HTTP 429                       |
| Fenêtre de détection des événements en double des Webhooks | 5 minutes (clé fondée sur le chemin, le compte, le nom de l’événement, la discussion, l’expéditeur et l’identifiant du message) |

## Contrôle d’accès

### Messages directs

- `channels.zalo.dmPolicy` : `pairing` (par défaut) | `allowlist` | `open` | `disabled`.
- Association : les expéditeurs inconnus reçoivent un code d’association ; les messages sont ignorés jusqu’à son approbation. Les codes expirent au bout d’une heure.
  - `openclaw pairing list zalo`
  - `openclaw pairing approve zalo <CODE>`
  - Détails : [Association](/fr/channels/pairing)
- `channels.zalo.allowFrom` accepte les identifiants utilisateur Zalo numériques (aucune recherche par nom d’utilisateur). `open` nécessite `"*"`.

### Groupes

Les discussions de groupe sont prises en charge par le Plugin (`chatTypes: ["direct", "group"]`) et soumises à une mention ainsi qu’à la politique de groupe :

- `channels.zalo.groupPolicy` : `open` | `allowlist` | `disabled`.
- `channels.zalo.groupAllowFrom` limite les identifiants d’expéditeurs autorisés à déclencher le bot dans les groupes ; si cette valeur n’est pas définie, `allowFrom` est utilisée.
- Résolution par défaut : lorsque `channels.zalo` est configuré, une valeur `groupPolicy` non définie est résolue en `open`. Lorsque `channels.zalo` est entièrement absent, l’exécution adopte par sécurité `allowlist`.
- Limitation signalée en conditions réelles : dans certaines configurations de bots Marketplace, il était impossible d’ajouter le bot à un groupe. Si vous rencontrez ce problème, vérifiez les paramètres Zalo Bot Platform de votre bot ; il s’agit d’une contrainte de la plateforme et non d’une politique OpenClaw.

## Interrogation longue ou Webhook

- Par défaut : interrogation longue (aucune URL publique requise).
- Mode Webhook : définissez `channels.zalo.webhookUrl` et `channels.zalo.webhookSecret`.
  - L’URL du Webhook doit utiliser HTTPS.
  - Le secret du Webhook doit comporter entre 8 et 256 caractères.
  - Zalo envoie les événements avec un en-tête `X-Bot-Api-Secret-Token`, vérifié au moyen d’une comparaison en temps constant.
  - Le serveur HTTP du Gateway traite les requêtes Webhook à l’emplacement `channels.zalo.webhookPath` (par défaut, le chemin de l’URL du Webhook).
  - Les requêtes doivent utiliser `Content-Type: application/json` (ou un type de média `+json`).
  - Selon la documentation de l’API Zalo, l’interrogation `getUpdates` et le Webhook sont mutuellement exclusifs.

## Types de messages pris en charge

- Texte : prise en charge complète, avec découpage en segments de 2 000 caractères.
- Médias : entrants et sortants, limités par `mediaMaxMb`.
- Réactions, fils de discussion, sondages et commandes natives : non pris en charge par le Plugin.
- Diffusion en continu : le Plugin déclare la prise en charge de la diffusion par blocs, mais Zalo ne possède aucun paramètre dédié au réglage de la file d’attente sortante ou de la fusion du texte, contrairement à certains autres canaux régionaux ; si cela est important pour votre cas d’utilisation, vérifiez le comportement actuel dans votre environnement.

## Fonctionnalités

| Fonctionnalité                     | Statut                                      |
| ---------------------------------- | ------------------------------------------- |
| Messages directs                   | Pris en charge                              |
| Groupes                            | Pris en charge (mention obligatoire)        |
| Médias (entrants/sortants)         | Pris en charge, limités par `mediaMaxMb`    |
| Réactions                          | Non prises en charge                        |
| Fils de discussion                 | Non pris en charge                          |
| Sondages                           | Non pris en charge                          |
| Commandes natives                  | Non prises en charge                        |
| Réponse à un message / citation    | Non utilisée (désactivée de manière fixe)   |

## Destinations de livraison (CLI/Cron)

Utilisez un identifiant de discussion comme destination :

```bash
openclaw message send --channel zalo --target 123456789 --message "hi"
```

## Dépannage

**Le bot ne répond pas :**

- Vérifiez le jeton : `openclaw channels status --probe`
- Vérifiez que l’expéditeur est approuvé (association ou `allowFrom`)
- Consultez les journaux du Gateway : `openclaw logs --follow`

**Le Webhook ne reçoit pas les événements :**

- Vérifiez que l’URL du Webhook utilise HTTPS
- Vérifiez que le secret comporte entre 8 et 256 caractères
- Vérifiez que le point de terminaison HTTP du Gateway est accessible sur le chemin configuré
- Vérifiez que l’interrogation `getUpdates` ne s’exécute pas également (les deux modes sont mutuellement exclusifs)
- Une rafale de requêtes peut entraîner une réponse HTTP 429 (120 requêtes par période de 60 s, par chemin et IP) ; attendez avant de réessayer

## Référence de configuration

Configuration complète : [Configuration](/fr/gateway/configuration)

| Paramètre                                    | Description                                                        | Valeur par défaut            |
| -------------------------------------------- | ------------------------------------------------------------------ | ---------------------------- |
| `channels.zalo.enabled`                      | Active ou désactive le démarrage du canal                          | `true`                       |
| `channels.zalo.accounts.<id>.botToken`       | Jeton de bot provenant de Zalo Bot Platform                        | -                            |
| `channels.zalo.accounts.<id>.tokenFile`      | Lit le jeton depuis un fichier (liens symboliques refusés)         | -                            |
| `channels.zalo.accounts.<id>.name`           | Nom d’affichage                                                    | -                            |
| `channels.zalo.accounts.<id>.enabled`        | Active ou désactive ce compte                                      | `true`                       |
| `channels.zalo.accounts.<id>.dmPolicy`       | Politique des messages directs propre au compte                    | `pairing`                    |
| `channels.zalo.accounts.<id>.allowFrom`      | Liste d’autorisation des messages directs (identifiants utilisateur) | -                          |
| `channels.zalo.accounts.<id>.groupPolicy`    | Politique de groupe propre au compte                               | voir [Groupes](#groups)      |
| `channels.zalo.accounts.<id>.groupAllowFrom` | Liste d’autorisation des expéditeurs de groupe ; utilise `allowFrom` par défaut | -                 |
| `channels.zalo.accounts.<id>.mediaMaxMb`     | Limite des médias entrants/sortants (Mo)                           | `5`                          |
| `channels.zalo.accounts.<id>.webhookUrl`     | Active le mode Webhook (HTTPS requis)                              | -                            |
| `channels.zalo.accounts.<id>.webhookSecret`  | Secret du Webhook (8 à 256 caractères)                             | -                            |
| `channels.zalo.accounts.<id>.webhookPath`    | Chemin du Webhook sur le serveur HTTP du Gateway                   | chemin de l’URL du Webhook   |
| `channels.zalo.accounts.<id>.proxy`          | URL du proxy pour les requêtes d’API                               | -                            |
| `channels.zalo.accounts.<id>.responsePrefix` | Remplacement du préfixe des réponses sortantes                     | -                            |
| `channels.zalo.defaultAccount`               | Compte par défaut lorsque plusieurs comptes sont configurés        | `default`                    |

`channels.zalo.botToken`, `channels.zalo.dmPolicy` et les autres clés plates de premier niveau constituent les raccourcis historiques pour compte unique correspondant aux champs ci-dessus ; les deux formes sont prises en charge.

Option d’environnement : `ZALO_BOT_TOKEN=...` définit uniquement le jeton du compte par défaut.

## Pages associées

- [Vue d’ensemble des canaux](/fr/channels) - tous les canaux pris en charge
- [Association](/fr/channels/pairing) - authentification des messages directs et processus d’association
- [Groupes](/fr/channels/groups) - comportement des discussions de groupe et déclenchement par mention
- [Routage des canaux](/fr/channels/channel-routing) - routage des sessions pour les messages
- [Sécurité](/fr/gateway/security) - modèle d’accès et renforcement de la sécurité
