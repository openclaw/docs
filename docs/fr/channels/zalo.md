---
read_when:
    - Travailler sur les fonctionnalités ou les Webhooks de Zalo
summary: État de la prise en charge, fonctionnalités et configuration des bots Zalo
title: Zalo
x-i18n:
    generated_at: "2026-07-12T15:04:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 36e624f1abeeaee56d7376b9df9209f8e7614ade2f089bcecd76ff746b942765
    source_path: channels/zalo.md
    workflow: 16
---

Statut : expérimental. Les messages directs et les discussions de groupe sont tous deux implémentés ; le tableau des [fonctionnalités](#capabilities) ci-dessous reflète le comportement vérifié des bots Zalo Bot Creator / Marketplace.

## Plugin intégré

Zalo est fourni comme Plugin intégré dans les versions actuelles d’OpenClaw ; les builds empaquetés ne nécessitent donc pas d’installation distincte.

Sur un build plus ancien ou une installation personnalisée excluant Zalo, installez directement le paquet npm :

- Installation : `openclaw plugins install @openclaw/zalo`
- Version épinglée : `openclaw plugins install @openclaw/zalo@2026.6.11`
- Depuis un checkout local : `openclaw plugins install ./path/to/local/zalo-plugin`
- Détails : [Plugins](/fr/tools/plugin)

## Configuration rapide

1. Créez un jeton de bot sur [https://bot.zaloplatforms.com](https://bot.zaloplatforms.com) (connectez-vous, créez un bot, configurez les paramètres). Le jeton est au format `numeric_id:secret` ; pour les bots Marketplace, le jeton d’exécution utilisable peut apparaître dans le message de bienvenue du bot.
2. Définissez le jeton, soit dans la variable d’environnement `ZALO_BOT_TOKEN=...` (compte par défaut uniquement), soit dans la configuration.
3. Redémarrez le Gateway.
4. Approuvez le code d’appairage lors du premier contact par message direct (la politique par défaut pour les messages directs est l’appairage).

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

Comptes multiples : ajoutez d’autres entrées sous `channels.zalo.accounts.<id>`, chacune avec ses propres `botToken`/`name`. `channels.zalo.botToken` (à plat, sans `accounts`) est un raccourci hérité pour un compte unique ; privilégiez `accounts.<id>.*` pour les nouvelles configurations.

## Présentation

Zalo est une application de messagerie principalement destinée au Vietnam. Son API de bot permet au Gateway d’exécuter un bot pour les conversations individuelles comme pour les discussions de groupe, avec un routage déterministe vers Zalo (le modèle ne choisit jamais les canaux).

Cette page concerne les **bots Zalo Bot Creator / Marketplace**. Les **bots Zalo Official Account (OA)** constituent une autre offre et peuvent se comporter différemment ; cette page ne les couvre pas.

## Fonctionnement

- Les messages entrants sont normalisés dans l’enveloppe de canal partagée avec des espaces réservés pour les médias.
- Les réponses sont toujours acheminées vers la même discussion Zalo ; la réponse avec citation n’est pas utilisée (`replyToMode` est toujours désactivé).
- Interrogation longue (`getUpdates`) par défaut ; mode Webhook disponible via `channels.zalo.webhookUrl`.
- Dans les groupes, une @mention est nécessaire pour déclencher le bot ; ce comportement n’est pas configurable par canal.

## Limites

| Limite                                         | Valeur                                                                                       |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Taille des segments de texte sortants          | 2000 caractères (limite de l’API Zalo)                                                       |
| Taille des médias (entrants/sortants)           | `channels.zalo.mediaMaxMb`, valeur par défaut `5` MB                                         |
| Corps de requête Webhook                       | 1 MB, délai d’expiration de lecture de 30s                                                   |
| Limite de débit du Webhook                     | 120 requêtes / 60s par chemin+IP cliente, puis HTTP 429                                      |
| Fenêtre de détection des événements en double  | 5 minutes (clé : chemin + compte + nom de l’événement + discussion + expéditeur + ID du message) |

## Contrôle d’accès

### Messages directs

- `channels.zalo.dmPolicy` : `pairing` (par défaut) | `allowlist` | `open` | `disabled`.
- Appairage : les expéditeurs inconnus reçoivent un code d’appairage ; les messages sont ignorés jusqu’à l’approbation. Les codes expirent après 1 heure.
  - `openclaw pairing list zalo`
  - `openclaw pairing approve zalo <CODE>`
  - Détails : [Appairage](/fr/channels/pairing)
- `channels.zalo.allowFrom` accepte les ID numériques des utilisateurs Zalo (aucune recherche par nom d’utilisateur). `open` nécessite `"*"`.

### Groupes

Les discussions de groupe sont prises en charge par le Plugin (`chatTypes: ["direct", "group"]`) et soumises à une mention ainsi qu’à la politique de groupe :

- `channels.zalo.groupPolicy` : `open` | `allowlist` | `disabled`.
- `channels.zalo.groupAllowFrom` limite les ID d’expéditeurs autorisés à déclencher le bot dans les groupes ; utilise `allowFrom` par défaut lorsque cette option n’est pas définie.
- Résolution par défaut : lorsque `channels.zalo` est configuré, une valeur `groupPolicy` non définie est résolue en `open`. Lorsque `channels.zalo` est entièrement absent, l’exécution se ferme par défaut avec `allowlist`.
- Limitation signalée en conditions réelles : dans certaines configurations de bots Marketplace, il était impossible d’ajouter le bot à un groupe. Si vous rencontrez ce problème, vérifiez les paramètres Zalo Bot Platform de votre bot ; il s’agit d’une contrainte de la plateforme, et non d’une politique OpenClaw.

## Interrogation longue ou Webhook

- Par défaut : interrogation longue (aucune URL publique requise).
- Mode Webhook : définissez `channels.zalo.webhookUrl` et `channels.zalo.webhookSecret`.
  - L’URL du Webhook doit utiliser HTTPS.
  - Le secret du Webhook doit comporter de 8 à 256 caractères.
  - Zalo envoie les événements avec un en-tête `X-Bot-Api-Secret-Token`, vérifié au moyen d’une comparaison en temps constant.
  - Le serveur HTTP du Gateway traite les requêtes Webhook au chemin `channels.zalo.webhookPath` (par défaut, le chemin de l’URL du Webhook).
  - Les requêtes doivent utiliser `Content-Type: application/json` (ou un type de média `+json`).
  - Selon la documentation de l’API Zalo, l’interrogation getUpdates et le Webhook s’excluent mutuellement.

## Types de messages pris en charge

- Texte : prise en charge complète, avec segmentation à 2000 caractères.
- Médias : entrants/sortants, limités par `mediaMaxMb`.
- Réactions, fils de discussion, sondages et commandes natives : non pris en charge par le Plugin.
- Streaming : le Plugin déclare la fonctionnalité de streaming par blocs, mais Zalo ne dispose pas de paramètres dédiés de file d’attente sortante ou de réglage de fusion de texte (contrairement à certains autres canaux régionaux) ; vérifiez le comportement actuel dans votre environnement si cela est important pour votre cas d’usage.

## Fonctionnalités

| Fonctionnalité             | Statut                                      |
| -------------------------- | ------------------------------------------- |
| Messages directs           | Pris en charge                              |
| Groupes                    | Pris en charge (soumis à une mention)       |
| Médias (entrants/sortants) | Pris en charge, limités par `mediaMaxMb`    |
| Réactions                  | Non prises en charge                        |
| Fils de discussion         | Non pris en charge                          |
| Sondages                   | Non pris en charge                          |
| Commandes natives          | Non prises en charge                        |
| Réponse à / citation       | Non utilisée (toujours désactivée)          |

## Cibles de livraison (CLI/cron)

Utilisez un ID de discussion comme cible :

```bash
openclaw message send --channel zalo --target 123456789 --message "bonjour"
```

## Dépannage

**Le bot ne répond pas :**

- Vérifiez le jeton : `openclaw channels status --probe`
- Vérifiez que l’expéditeur est approuvé (appairage ou `allowFrom`)
- Consultez les journaux du Gateway : `openclaw logs --follow`

**Le Webhook ne reçoit pas les événements :**

- Vérifiez que l’URL du Webhook utilise HTTPS
- Vérifiez que le secret comporte de 8 à 256 caractères
- Vérifiez que le point de terminaison HTTP du Gateway est accessible au chemin configuré
- Vérifiez que l’interrogation getUpdates n’est pas également en cours d’exécution (les deux modes s’excluent mutuellement)
- Une rafale de requêtes peut renvoyer HTTP 429 (120 requêtes / 60s par chemin+IP) ; attendez avant de réessayer

## Référence de configuration

Configuration complète : [Configuration](/fr/gateway/configuration)

| Paramètre                                    | Description                                                        | Valeur par défaut          |
| -------------------------------------------- | ------------------------------------------------------------------ | -------------------------- |
| `channels.zalo.enabled`                      | Active/désactive le démarrage du canal                             | `true`                     |
| `channels.zalo.accounts.<id>.botToken`       | Jeton de bot provenant de Zalo Bot Platform                        | -                          |
| `channels.zalo.accounts.<id>.tokenFile`      | Lit le jeton depuis un fichier (liens symboliques refusés)         | -                          |
| `channels.zalo.accounts.<id>.name`           | Nom d’affichage                                                    | -                          |
| `channels.zalo.accounts.<id>.enabled`        | Active/désactive ce compte                                         | `true`                     |
| `channels.zalo.accounts.<id>.dmPolicy`       | Politique de messages directs par compte                           | `pairing`                  |
| `channels.zalo.accounts.<id>.allowFrom`      | Liste d’autorisation des messages directs (ID utilisateur)         | -                          |
| `channels.zalo.accounts.<id>.groupPolicy`    | Politique de groupe par compte                                     | voir [Groupes](#groups)    |
| `channels.zalo.accounts.<id>.groupAllowFrom` | Liste des expéditeurs autorisés dans les groupes ; utilise `allowFrom` par défaut | -              |
| `channels.zalo.accounts.<id>.mediaMaxMb`     | Limite des médias entrants/sortants (MB)                            | `5`                        |
| `channels.zalo.accounts.<id>.webhookUrl`     | Active le mode Webhook (HTTPS requis)                              | -                          |
| `channels.zalo.accounts.<id>.webhookSecret`  | Secret du Webhook (8 à 256 caractères)                             | -                          |
| `channels.zalo.accounts.<id>.webhookPath`    | Chemin du Webhook sur le serveur HTTP du Gateway                   | chemin de l’URL du Webhook |
| `channels.zalo.accounts.<id>.proxy`          | URL du proxy pour les requêtes API                                 | -                          |
| `channels.zalo.accounts.<id>.responsePrefix` | Remplacement du préfixe des réponses sortantes                     | -                          |
| `channels.zalo.defaultAccount`               | Compte par défaut lorsque plusieurs comptes sont configurés        | `default`                  |

`channels.zalo.botToken`, `channels.zalo.dmPolicy` et les autres clés de premier niveau à plat constituent le raccourci hérité pour un compte unique correspondant aux champs ci-dessus ; les deux formes sont prises en charge.

Option d’environnement : `ZALO_BOT_TOKEN=...` résout uniquement le jeton du compte par défaut.

## Pages connexes

- [Vue d’ensemble des canaux](/fr/channels) - tous les canaux pris en charge
- [Appairage](/fr/channels/pairing) - authentification des messages directs et processus d’appairage
- [Groupes](/fr/channels/groups) - comportement des discussions de groupe et déclenchement par mention
- [Routage des canaux](/fr/channels/channel-routing) - routage des sessions pour les messages
- [Sécurité](/fr/gateway/security) - modèle d’accès et durcissement
