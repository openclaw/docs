---
read_when:
    - Travail sur les fonctionnalités du canal Tlon/Urbit
summary: État de la prise en charge de Tlon/Urbit, capacités et configuration
title: Tlon
x-i18n:
    generated_at: "2026-04-30T07:15:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: bec632f946796a0ea4bceb5ad26f1ff1825c4304bf7252e9d2fd4d3889d36b52
    source_path: channels/tlon.md
    workflow: 16
---

Tlon est une messagerie décentralisée construite sur Urbit. OpenClaw se connecte à votre vaisseau Urbit et peut
répondre aux messages privés et aux messages de discussion de groupe. Les réponses de groupe nécessitent par défaut une mention @ et peuvent
être davantage restreintes via des listes d’autorisation.

Statut : Plugin intégré. Les messages privés, les mentions de groupe, les réponses dans les fils, la mise en forme de texte enrichi et les
téléversements d’images sont pris en charge. Les réactions et les sondages ne sont pas encore pris en charge.

## Plugin intégré

Tlon est fourni comme Plugin intégré dans les versions actuelles d’OpenClaw ; les
versions empaquetées normales n’ont donc pas besoin d’installation séparée.

Si vous utilisez une ancienne version ou une installation personnalisée qui exclut Tlon, installez un
paquet npm actuel lorsqu’il est publié :

Installer via la CLI (registre npm, lorsqu’un paquet actuel existe) :

```bash
openclaw plugins install @openclaw/tlon
```

Si npm indique que le paquet détenu par OpenClaw est obsolète, utilisez une version
OpenClaw empaquetée actuelle ou le chemin d’extraction local jusqu’à ce qu’un paquet npm plus récent soit
publié.

Extraction locale (lors de l’exécution depuis un dépôt git) :

```bash
openclaw plugins install ./path/to/local/tlon-plugin
```

Détails : [Plugins](/fr/tools/plugin)

## Configuration

1. Assurez-vous que le Plugin Tlon est disponible.
   - Les versions OpenClaw empaquetées actuelles l’intègrent déjà.
   - Les installations anciennes/personnalisées peuvent l’ajouter manuellement avec les commandes ci-dessus.
2. Rassemblez l’URL de votre vaisseau et le code de connexion.
3. Configurez `channels.tlon`.
4. Redémarrez le Gateway.
5. Envoyez un message privé au bot ou mentionnez-le dans un canal de groupe.

Configuration minimale (compte unique) :

```json5
{
  channels: {
    tlon: {
      enabled: true,
      ship: "~sampel-palnet",
      url: "https://your-ship-host",
      code: "lidlut-tabwed-pillex-ridrup",
      ownerShip: "~your-main-ship", // recommended: your ship, always allowed
    },
  },
}
```

## Vaisseaux privés/LAN

Par défaut, OpenClaw bloque les noms d’hôte et plages d’IP privés/internes pour la protection SSRF.
Si votre vaisseau s’exécute sur un réseau privé (localhost, IP LAN ou nom d’hôte interne),
vous devez l’autoriser explicitement :

```json5
{
  channels: {
    tlon: {
      url: "http://localhost:8080",
      allowPrivateNetwork: true,
    },
  },
}
```

Cela s’applique aux URL comme :

- `http://localhost:8080`
- `http://192.168.x.x:8080`
- `http://my-ship.local:8080`

⚠️ N’activez cette option que si vous faites confiance à votre réseau local. Ce réglage désactive les protections SSRF
pour les requêtes vers l’URL de votre vaisseau.

## Canaux de groupe

La découverte automatique est activée par défaut. Vous pouvez aussi épingler des canaux manuellement :

```json5
{
  channels: {
    tlon: {
      groupChannels: ["chat/~host-ship/general", "chat/~host-ship/support"],
    },
  },
}
```

Désactiver la découverte automatique :

```json5
{
  channels: {
    tlon: {
      autoDiscoverChannels: false,
    },
  },
}
```

## Contrôle d’accès

Liste d’autorisation des messages privés (vide = aucun message privé autorisé, utilisez `ownerShip` pour le flux d’approbation) :

```json5
{
  channels: {
    tlon: {
      dmAllowlist: ["~zod", "~nec"],
    },
  },
}
```

Autorisation de groupe (restreinte par défaut) :

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

## Système de propriétaire et d’approbation

Définissez un vaisseau propriétaire pour recevoir les demandes d’approbation lorsque des utilisateurs non autorisés essaient d’interagir :

```json5
{
  channels: {
    tlon: {
      ownerShip: "~your-main-ship",
    },
  },
}
```

Le vaisseau propriétaire est **automatiquement autorisé partout** — les invitations par message privé sont acceptées automatiquement et
les messages de canal sont toujours autorisés. Vous n’avez pas besoin d’ajouter le propriétaire à `dmAllowlist` ou
`defaultAuthorizedShips`.

Lorsqu’il est défini, le propriétaire reçoit des notifications par message privé pour :

- Les demandes de message privé provenant de vaisseaux qui ne figurent pas dans la liste d’autorisation
- Les mentions dans des canaux sans autorisation
- Les demandes d’invitation à un groupe

## Paramètres d’acceptation automatique

Accepter automatiquement les invitations par message privé (pour les vaisseaux dans dmAllowlist) :

```json5
{
  channels: {
    tlon: {
      autoAcceptDmInvites: true,
    },
  },
}
```

Accepter automatiquement les invitations de groupe :

```json5
{
  channels: {
    tlon: {
      autoAcceptGroupInvites: true,
    },
  },
}
```

## Cibles de livraison (CLI/cron)

Utilisez-les avec `openclaw message send` ou la livraison Cron :

- Message privé : `~sampel-palnet` ou `dm/~sampel-palnet`
- Groupe : `chat/~host-ship/channel` ou `group:~host-ship/channel`

## Skill intégré

Le Plugin Tlon inclut un skill intégré ([`@tloncorp/tlon-skill`](https://github.com/tloncorp/tlon-skill))
qui fournit un accès CLI aux opérations Tlon :

- **Contacts** : obtenir/mettre à jour les profils, lister les contacts
- **Canaux** : lister, créer, publier des messages, récupérer l’historique
- **Groupes** : lister, créer, gérer les membres
- **Messages privés** : envoyer des messages, réagir aux messages
- **Réactions** : ajouter/supprimer des réactions emoji aux publications et aux messages privés
- **Paramètres** : gérer les permissions du Plugin via des commandes slash

Le skill est automatiquement disponible lorsque le Plugin est installé.

## Capacités

| Fonctionnalité  | Statut                                           |
| --------------- | ------------------------------------------------ |
| Messages directs | ✅ Pris en charge                               |
| Groupes/canaux  | ✅ Pris en charge (soumis aux mentions par défaut) |
| Fils            | ✅ Pris en charge (réponses automatiques dans le fil) |
| Texte enrichi   | ✅ Markdown converti au format Tlon              |
| Images          | ✅ Téléversées vers le stockage Tlon             |
| Réactions       | ✅ Via le [skill intégré](#bundled-skill)        |
| Sondages        | ❌ Pas encore pris en charge                     |
| Commandes natives | ✅ Prises en charge (propriétaire uniquement par défaut) |

## Dépannage

Exécutez d’abord cette séquence :

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
```

Échecs courants :

- **Messages privés ignorés** : l’expéditeur n’est pas dans `dmAllowlist` et aucun `ownerShip` n’est configuré pour le flux d’approbation.
- **Messages de groupe ignorés** : canal non découvert ou expéditeur non autorisé.
- **Erreurs de connexion** : vérifiez que l’URL du vaisseau est accessible ; activez `allowPrivateNetwork` pour les vaisseaux locaux.
- **Erreurs d’authentification** : vérifiez que le code de connexion est actuel (les codes tournent).

## Référence de configuration

Configuration complète : [Configuration](/fr/gateway/configuration)

Options du fournisseur :

- `channels.tlon.enabled` : activer/désactiver le démarrage du canal.
- `channels.tlon.ship` : nom du vaisseau Urbit du bot (par ex. `~sampel-palnet`).
- `channels.tlon.url` : URL du vaisseau (par ex. `https://sampel-palnet.tlon.network`).
- `channels.tlon.code` : code de connexion du vaisseau.
- `channels.tlon.allowPrivateNetwork` : autoriser les URL localhost/LAN (contournement SSRF).
- `channels.tlon.ownerShip` : vaisseau propriétaire pour le système d’approbation (toujours autorisé).
- `channels.tlon.dmAllowlist` : vaisseaux autorisés à envoyer des messages privés (vide = aucun).
- `channels.tlon.autoAcceptDmInvites` : accepter automatiquement les messages privés des vaisseaux autorisés.
- `channels.tlon.autoAcceptGroupInvites` : accepter automatiquement toutes les invitations de groupe.
- `channels.tlon.autoDiscoverChannels` : découvrir automatiquement les canaux de groupe (par défaut : true).
- `channels.tlon.groupChannels` : nids de canaux épinglés manuellement.
- `channels.tlon.defaultAuthorizedShips` : vaisseaux autorisés pour tous les canaux.
- `channels.tlon.authorization.channelRules` : règles d’autorisation par canal.
- `channels.tlon.showModelSignature` : ajouter le nom du modèle aux messages.

## Notes

- Les réponses de groupe nécessitent une mention (par ex. `~your-bot-ship`) pour répondre.
- Réponses dans les fils : si le message entrant est dans un fil, OpenClaw répond dans le fil.
- Texte enrichi : la mise en forme Markdown (gras, italique, code, en-têtes, listes) est convertie au format natif de Tlon.
- Images : les URL sont téléversées vers le stockage Tlon et intégrées comme blocs d’image.

## Connexe

- [Vue d’ensemble des canaux](/fr/channels) — tous les canaux pris en charge
- [Appairage](/fr/channels/pairing) — authentification par message privé et flux d’appairage
- [Groupes](/fr/channels/groups) — comportement de discussion de groupe et filtrage par mention
- [Routage des canaux](/fr/channels/channel-routing) — routage de session pour les messages
- [Sécurité](/fr/gateway/security) — modèle d’accès et renforcement
