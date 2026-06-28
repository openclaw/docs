---
read_when:
    - Travailler sur les fonctionnalités du canal Tlon/Urbit
summary: État de la prise en charge de Tlon/Urbit, fonctionnalités et configuration
title: Tlon
x-i18n:
    generated_at: "2026-05-04T02:22:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1718044541b431ff2437508e7e6659c14206f4aa84ab8b207e0d791dea2a48c5
    source_path: channels/tlon.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Tlon est une messagerie décentralisée construite sur Urbit. OpenClaw se connecte à votre vaisseau Urbit et peut
répondre aux MP et aux messages de discussion de groupe. Les réponses de groupe nécessitent une mention @ par défaut et peuvent
être davantage restreintes via des listes d’autorisation.

Statut : Plugin groupé. Les MP, les mentions de groupe, les réponses dans les fils, la mise en forme de texte enrichi et les
téléversements d’images sont pris en charge. Les réactions et les sondages ne sont pas encore pris en charge.

## Plugin groupé

Tlon est fourni comme Plugin groupé dans les versions actuelles d’OpenClaw ; les builds
empaquetés normaux ne nécessitent donc pas d’installation séparée.

Si vous utilisez un build plus ancien ou une installation personnalisée qui exclut Tlon, installez un
paquet npm actuel :

Installation via la CLI (registre npm) :

```bash
openclaw plugins install @openclaw/tlon
```

Utilisez le paquet nu pour suivre le tag de version officiel actuel. Épinglez une version
exacte uniquement lorsque vous avez besoin d’une installation reproductible.

Checkout local (lors de l’exécution depuis un dépôt git) :

```bash
openclaw plugins install ./path/to/local/tlon-plugin
```

Détails : [Plugins](/fr/tools/plugin)

## Configuration

1. Assurez-vous que le Plugin Tlon est disponible.
   - Les versions empaquetées actuelles d’OpenClaw l’incluent déjà.
   - Les installations plus anciennes/personnalisées peuvent l’ajouter manuellement avec les commandes ci-dessus.
2. Rassemblez l’URL de votre vaisseau et le code de connexion.
3. Configurez `channels.tlon`.
4. Redémarrez le Gateway.
5. Envoyez un MP au bot ou mentionnez-le dans un canal de groupe.

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

Par défaut, OpenClaw bloque les noms d’hôte privés/internes et les plages d’adresses IP pour la protection contre le SSRF.
Si votre vaisseau fonctionne sur un réseau privé (localhost, IP LAN ou nom d’hôte interne),
vous devez l’activer explicitement :

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

⚠️ Activez ceci uniquement si vous faites confiance à votre réseau local. Ce paramètre désactive les protections SSRF
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

Liste d’autorisation des MP (vide = aucun MP autorisé, utilisez `ownerShip` pour le flux d’approbation) :

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

## Propriétaire et système d’approbation

Définissez un vaisseau propriétaire pour recevoir les demandes d’approbation lorsque des utilisateurs non autorisés tentent d’interagir :

```json5
{
  channels: {
    tlon: {
      ownerShip: "~your-main-ship",
    },
  },
}
```

Le vaisseau propriétaire est **automatiquement autorisé partout** : les invitations par MP sont acceptées automatiquement et
les messages de canal sont toujours autorisés. Vous n’avez pas besoin d’ajouter le propriétaire à `dmAllowlist` ou à
`defaultAuthorizedShips`.

Lorsqu’il est défini, le propriétaire reçoit des notifications par MP pour :

- Les demandes de MP provenant de vaisseaux absents de la liste d’autorisation
- Les mentions dans des canaux sans autorisation
- Les demandes d’invitation de groupe

## Paramètres d’acceptation automatique

Accepter automatiquement les invitations par MP (pour les vaisseaux dans dmAllowlist) :

```json5
{
  channels: {
    tlon: {
      autoAcceptDmInvites: true,
    },
  },
}
```

Accepter automatiquement les invitations de groupe provenant de vaisseaux de confiance :

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

`autoAcceptGroupInvites` échoue de manière fermée lorsque `groupInviteAllowlist` est vide. Définissez la
liste d’autorisation sur les vaisseaux dont les invitations de groupe doivent être acceptées automatiquement.

## Cibles de livraison (CLI/Cron)

Utilisez-les avec `openclaw message send` ou la livraison cron :

- MP : `~sampel-palnet` ou `dm/~sampel-palnet`
- Groupe : `chat/~host-ship/channel` ou `group:~host-ship/channel`

## Skill groupée

Le Plugin Tlon inclut une Skill groupée ([`@tloncorp/tlon-skill`](https://github.com/tloncorp/tlon-skill))
qui fournit un accès CLI aux opérations Tlon :

- **Contacts** : obtenir/mettre à jour les profils, lister les contacts
- **Canaux** : lister, créer, publier des messages, récupérer l’historique
- **Groupes** : lister, créer, gérer les membres
- **MP** : envoyer des messages, réagir aux messages
- **Réactions** : ajouter/supprimer des réactions emoji aux publications et aux MP
- **Paramètres** : gérer les autorisations du Plugin via des commandes slash

La Skill est automatiquement disponible lorsque le Plugin est installé.

## Capacités

| Fonctionnalité   | Statut                                      |
| ---------------- | ------------------------------------------- |
| Messages directs | ✅ Pris en charge                           |
| Groupes/canaux   | ✅ Pris en charge (soumis à mention par défaut) |
| Fils             | ✅ Pris en charge (réponses automatiques dans le fil) |
| Texte enrichi    | ✅ Markdown converti au format Tlon         |
| Images           | ✅ Téléversées vers le stockage Tlon        |
| Réactions        | ✅ Via la [Skill groupée](#bundled-skill)   |
| Sondages         | ❌ Pas encore pris en charge                |
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

- **MP ignorés** : l’expéditeur n’est pas dans `dmAllowlist` et aucun `ownerShip` n’est configuré pour le flux d’approbation.
- **Messages de groupe ignorés** : le canal n’a pas été découvert ou l’expéditeur n’est pas autorisé.
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
- `channels.tlon.dmAllowlist` : vaisseaux autorisés à envoyer un MP (vide = aucun).
- `channels.tlon.autoAcceptDmInvites` : accepter automatiquement les MP des vaisseaux autorisés.
- `channels.tlon.autoAcceptGroupInvites` : accepter automatiquement les invitations de groupe des vaisseaux autorisés.
- `channels.tlon.groupInviteAllowlist` : vaisseaux dont les invitations de groupe peuvent être acceptées automatiquement.
- `channels.tlon.autoDiscoverChannels` : découvrir automatiquement les canaux de groupe (par défaut : true).
- `channels.tlon.groupChannels` : nids de canaux épinglés manuellement.
- `channels.tlon.defaultAuthorizedShips` : vaisseaux autorisés pour tous les canaux.
- `channels.tlon.authorization.channelRules` : règles d’authentification par canal.
- `channels.tlon.showModelSignature` : ajouter le nom du modèle aux messages.

## Notes

- Les réponses de groupe nécessitent une mention (par ex. `~your-bot-ship`) pour répondre.
- Réponses dans les fils : si le message entrant se trouve dans un fil, OpenClaw répond dans le fil.
- Texte enrichi : la mise en forme Markdown (gras, italique, code, en-têtes, listes) est convertie au format natif de Tlon.
- Images : les URL sont téléversées vers le stockage Tlon et intégrées comme blocs d’image.

## Connexe

- [Vue d’ensemble des canaux](/fr/channels) — tous les canaux pris en charge
- [Appairage](/fr/channels/pairing) — authentification par MP et flux d’appairage
- [Groupes](/fr/channels/groups) — comportement des discussions de groupe et filtrage par mention
- [Routage des canaux](/fr/channels/channel-routing) — routage de session pour les messages
- [Sécurité](/fr/gateway/security) — modèle d’accès et durcissement
