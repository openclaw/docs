---
read_when:
    - Travail sur les fonctionnalités du canal Tlon/Urbit
summary: État de la prise en charge, fonctionnalités et configuration de Tlon/Urbit
title: Tlon
x-i18n:
    generated_at: "2026-07-12T15:03:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: d53ea7d97a7445910c5692a247758b652e1fce82793e65950e1e21a10fa16813
    source_path: channels/tlon.md
    workflow: 16
---

Tlon est une messagerie décentralisée basée sur Urbit. OpenClaw se connecte à votre vaisseau Urbit et
répond aux messages privés et aux messages de discussion de groupe. Par défaut, les réponses de groupe nécessitent une mention @, avec
des règles d’autorisation et un processus d’approbation par le propriétaire qui s’y ajoutent.

État : plugin intégré. Les messages privés, les mentions de groupe, les fils de discussion, le texte enrichi, l’envoi et le téléchargement d’images, ainsi qu’un
système d’approbation par le propriétaire sont pris en charge. Les réactions et les sondages ne le sont pas.

## Plugin intégré

Tlon est intégré aux versions actuelles d’OpenClaw ; les distributions empaquetées ne nécessitent pas d’installation distincte.

Sur une ancienne version ou une installation personnalisée qui l’exclut, installez-le depuis npm :

```bash
openclaw plugins install @openclaw/tlon
```

Utilisez le nom de paquet seul pour suivre l’étiquette de la version actuelle. Épinglez une version (`@openclaw/tlon@x.y.z`)
uniquement pour les installations reproductibles.

Depuis une extraction locale :

```bash
openclaw plugins install ./path/to/local/tlon-plugin
```

Détails : [Plugins](/fr/tools/plugin)

## Configuration

```bash
openclaw channels add --channel tlon --ship ~sampel-palnet --url https://your-ship-host --code lidlut-tabwed-pillex-ridrup
```

Ou modifiez directement la configuration :

```json5
{
  channels: {
    tlon: {
      enabled: true,
      ship: "~sampel-palnet",
      url: "https://your-ship-host",
      code: "lidlut-tabwed-pillex-ridrup",
      ownerShip: "~your-main-ship", // recommandé : votre vaisseau, toujours autorisé
    },
  },
}
```

Redémarrez le Gateway après avoir modifié directement la configuration. Envoyez ensuite un message privé au bot ou mentionnez-le avec @ dans un
canal de groupe.

## Vaisseaux privés/sur réseau local

OpenClaw bloque par défaut les noms d’hôte et les plages d’adresses IP privés/internes afin de protéger contre les SSRF. Si votre
vaisseau s’exécute sur un réseau privé (localhost, adresse IP du réseau local, nom d’hôte interne), autorisez-le explicitement :

```json5
{
  channels: {
    tlon: {
      url: "http://localhost:8080",
      network: {
        dangerouslyAllowPrivateNetwork: true,
      },
    },
  },
}
```

Cela s’applique aux cibles telles que `http://localhost:8080`, `http://192.168.x.x:8080` et
`http://my-ship.local:8080`. N’activez cette option que pour l’URL d’un vaisseau auquel vous faites confiance ; elle désactive la protection contre les SSRF
pour les requêtes HTTP de ce compte.

<Note>
`channels.tlon.allowPrivateNetwork` (clé à plat) est obsolète. `openclaw doctor --fix` la déplace automatiquement vers
`channels.tlon.network.dangerouslyAllowPrivateNetwork`.
</Note>

## Canaux de groupe

Épinglez manuellement les canaux ou activez la découverte automatique :

```json5
{
  channels: {
    tlon: {
      groupChannels: ["chat/~host-ship/general", "chat/~host-ship/support"],
      autoDiscoverChannels: true,
    },
  },
}
```

Lorsque `autoDiscoverChannels` n’est pas défini dans la configuration, sa valeur par défaut est `false` ; l’assistant de configuration propose
oui par défaut et écrit explicitement `true`. Lorsque cette option est activée, OpenClaw interroge les groupes rejoints au démarrage,
surveille les nouveaux canaux à mesure que les invitations à des groupes sont acceptées et effectue une nouvelle vérification toutes les 2 minutes.

## Contrôle d’accès

Liste d’autorisation des messages privés (vide = aucun message privé autorisé, sauf si l’expéditeur est `ownerShip`) :

```json5
{
  channels: {
    tlon: {
      dmAllowlist: ["~zod", "~nec"],
    },
  },
}
```

Par défaut, l’autorisation de groupe est définie sur `restricted` pour chaque canal. Définissez `defaultAuthorizedShips` pour établir une
base, puis remplacez-la pour chaque arborescence de canal :

```json5
{
  channels: {
    tlon: {
      defaultAuthorizedShips: ["~zod"],
      authorization: {
        channelRules: {
          "chat/~host-ship/general": {
            mode: "restricted",
            allowedShips: ["~zod", "~nec"],
          },
          "chat/~host-ship/announcements": {
            mode: "open",
          },
        },
      },
    },
  },
}
```

Une fois que le bot a répondu dans un fil de discussion, il continue de répondre aux messages ultérieurs de ce fil
sans nécessiter une nouvelle mention.

## Propriétaire et système d’approbation

```json5
{
  channels: {
    tlon: {
      ownerShip: "~your-main-ship",
    },
  },
}
```

Le vaisseau propriétaire est autorisé partout : les invitations par message privé sont toujours acceptées automatiquement, les invitations à des groupes sont
toujours acceptées automatiquement et les messages des canaux sont toujours autorisés. Le propriétaire n’a pas besoin de
figurer dans `dmAllowlist`, `defaultAuthorizedShips` ou `groupInviteAllowlist`.

Lorsque `ownerShip` est défini, les requêtes non autorisées ne sont pas simplement ignorées : elles ajoutent une
approbation en attente à la file et envoient un message privé au propriétaire :

- Requêtes par message privé provenant de vaisseaux absents de `dmAllowlist`
- Mentions dans les canaux où l’expéditeur ne satisfait pas aux règles d’autorisation
- Invitations à des groupes provenant de vaisseaux absents de `groupInviteAllowlist` (lorsque l’acceptation automatique est désactivée, ou activée mais que
  l’auteur de l’invitation ne figure pas dans la liste d’autorisation)

Le propriétaire répond par message privé pour traiter une requête :

| Réponse du propriétaire      | Effet                                                                |
| ---------------------------- | -------------------------------------------------------------------- |
| `approve` / `deny` / `block` | Traite l’approbation en attente la plus récente                       |
| `approve <id>` / `deny <id>` | Traite une approbation précise selon son identifiant                  |
| `block`                      | Bloque également le vaisseau de manière native afin qu’il ne puisse pas se reconnecter |
| `unblock ~ship`              | Annule un blocage natif                                               |
| `blocked`                    | Répertorie les vaisseaux actuellement bloqués                         |
| `pending`                    | Répertorie les demandes d’approbation en attente                      |

Si `ownerShip` n’est pas configuré, les messages privés et les mentions de canal non autorisés sont simplement ignorés et consignés ;
aucune demande d’approbation n’est envoyée.

## Paramètres d’acceptation automatique

Acceptez automatiquement les invitations par message privé provenant de vaisseaux déjà présents dans `dmAllowlist` (le propriétaire est toujours accepté automatiquement,
indépendamment de cet indicateur) :

```json5
{
  channels: {
    tlon: {
      autoAcceptDmInvites: true,
    },
  },
}
```

Acceptez automatiquement les invitations à des groupes provenant d’une liste d’autorisation (refus par défaut : avec `autoAcceptGroupInvites: true` et
une `groupInviteAllowlist` vide, aucune invitation provenant d’un non-propriétaire n’est acceptée) :

```json5
{
  channels: {
    tlon: {
      autoAcceptGroupInvites: true,
      groupInviteAllowlist: ["~zod"],
    },
  },
}
```

## Rechargement à chaud via le magasin de paramètres Urbit

La plupart des paramètres ci-dessus (`dmAllowlist`, `groupInviteAllowlist`, `groupChannels`,
`defaultAuthorizedShips`, `autoDiscoverChannels`, `autoAcceptDmInvites`,
`autoAcceptGroupInvites`, `ownerShip`, `showModelSignature`) sont répliqués dans l’agent
`%settings` du vaisseau (bureau `moltbot`, compartiment `tlon`) lors de la première exécution, puis lus en direct depuis celui-ci ;
ainsi, les modifications effectuées via un client Landscape ou les commandes de paramètres du Skill intégré s’appliquent sans
redémarrage du Gateway. `channelRules` et les approbations en attente y sont également conservés au format JSON. La
configuration de fichier reste la source de référence pour les valeurs qui ne sont jamais écrites dans le magasin de paramètres.

## Cibles de livraison (CLI/cron)

À utiliser avec `openclaw message send` ou une livraison cron :

- Message privé : `~sampel-palnet` ou `dm/~sampel-palnet`
- Groupe : `chat/~host-ship/channel` ou `group:~host-ship/channel`

## Skill intégré

Le plugin intègre [`@tloncorp/tlon-skill`](https://github.com/tloncorp/tlon-skill), une CLI permettant
d’effectuer directement des opérations Urbit, disponible automatiquement une fois le plugin installé :

- **Activité** : mentions, réponses, messages non lus
- **Canaux** : répertorier, créer, renommer
- **Contacts** : répertorier/obtenir/mettre à jour les profils
- **Groupes** : créer, rejoindre, inviter/demander l’accès, gérer les rôles
- **Hooks** : gérer les hooks de canal
- **Messages** : historique, recherche
- **Messages privés** : envoyer, réagir, accepter/refuser
- **Publications** : réagir, supprimer
- **Carnet** : publier dans les canaux de journal
- **Paramètres** : recharger à chaud la configuration du plugin via le magasin de paramètres ci-dessus

## Capacités

| Fonctionnalité           | État                                                      |
| ------------------------ | --------------------------------------------------------- |
| Messages directs         | Pris en charge                                            |
| Groupes/canaux           | Pris en charge (mention requise par défaut)               |
| Fils de discussion       | Pris en charge (continue de répondre après les avoir rejoints) |
| Texte enrichi            | Markdown converti au format natif de Tlon                 |
| Images                   | Téléchargées en entrée, envoyées en sortie                |
| Réactions                | Uniquement via le [Skill intégré](#bundled-skill)         |
| Sondages                 | Non pris en charge                                        |
| Commandes natives        | Réservées au propriétaire par défaut                      |

## Dépannage

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
```

Échecs courants :

- **Messages privés ignorés** : l’expéditeur ne figure pas dans `dmAllowlist` et aucun `ownerShip` n’est configuré pour le processus d’approbation.
- **Messages de groupe ignorés** : le canal n’a pas été découvert/épinglé, ou l’expéditeur ne satisfait pas aux règles d’autorisation et aucun
  `ownerShip` ne permet de mettre une approbation en file d’attente.
- **Erreurs de connexion** : vérifiez que l’URL du vaisseau est accessible ; définissez
  `network.dangerouslyAllowPrivateNetwork` pour les vaisseaux locaux.
- **Erreurs d’authentification** : les codes de connexion changent ; copiez le code actuel depuis votre vaisseau.

## Référence de configuration

Configuration complète : [Configuration](/fr/gateway/configuration)

| Clé                                                    | Signification                                                           |
| ------------------------------------------------------ | ----------------------------------------------------------------------- |
| `channels.tlon.enabled`                                | Active/désactive le démarrage du canal.                                 |
| `channels.tlon.ship`                                   | Nom du vaisseau Urbit du bot (par ex. `~sampel-palnet`).                |
| `channels.tlon.url`                                    | URL du vaisseau (par ex. `https://sampel-palnet.tlon.network`).         |
| `channels.tlon.code`                                   | Code de connexion du vaisseau.                                          |
| `channels.tlon.network.dangerouslyAllowPrivateNetwork` | Autorise les URL de vaisseaux sur localhost/réseau local (activation explicite des SSRF). |
| `channels.tlon.ownerShip`                              | Vaisseau propriétaire : toujours autorisé, reçoit les demandes d’approbation. |
| `channels.tlon.dmAllowlist`                            | Vaisseaux autorisés à envoyer des messages privés (vide = aucun sauf le propriétaire). |
| `channels.tlon.autoAcceptDmInvites`                    | Accepte automatiquement les messages privés des vaisseaux de `dmAllowlist`. |
| `channels.tlon.autoAcceptGroupInvites`                 | Accepte automatiquement les invitations à des groupes de `groupInviteAllowlist`. |
| `channels.tlon.groupInviteAllowlist`                   | Vaisseaux dont les invitations à des groupes sont acceptées automatiquement. |
| `channels.tlon.autoDiscoverChannels`                   | Découvre automatiquement les canaux de groupe rejoints (valeur par défaut : `false`). |
| `channels.tlon.groupChannels`                          | Arborescences de canaux épinglées manuellement.                          |
| `channels.tlon.defaultAuthorizedShips`                 | Vaisseaux autorisés pour tous les canaux (utilisé lorsqu’aucune règle ne correspond). |
| `channels.tlon.authorization.channelRules`             | Mode d’authentification + liste d’autorisation par arborescence de canal. |
| `channels.tlon.showModelSignature`                     | Ajoute `_[Generated by <model>]_` aux réponses.                         |
| `channels.tlon.responsePrefix`                         | Préfixe statique ajouté au début des réponses sortantes.                 |
| `channels.tlon.accounts.<id>`                          | Comptes nommés supplémentaires (configurations à plusieurs vaisseaux).   |

## Remarques

- Les réponses de groupe nécessitent une mention @ (par ex. `~your-bot-ship`), sauf si le bot a déjà rejoint ce fil de discussion.
- Les réponses à un fil de discussion sont publiées dans celui-ci ; les 10 derniers messages du contexte du fil sont également ajoutés au début
  pour l’agent.
- Le texte enrichi (gras, italique, code, titres, listes) est converti au format natif de Tlon.
- L’envoi d’un message entrant demandant un résumé du canal (par exemple « résumez ce
  canal ») déclenche une synthèse intégrée de l’historique au lieu du processus de réponse normal.

## Pages connexes

- [Présentation des canaux](/fr/channels) — tous les canaux pris en charge
- [Association](/fr/channels/pairing) — authentification par message privé et processus d’association
- [Groupes](/fr/channels/groups) — comportement des discussions de groupe et exigence de mention
- [Routage des canaux](/fr/channels/channel-routing) — routage des sessions pour les messages
- [Sécurité](/fr/gateway/security) — modèle d’accès et renforcement
