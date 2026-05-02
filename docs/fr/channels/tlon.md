---
read_when:
    - Travail sur les fonctionnalités du canal Tlon/Urbit
summary: État de prise en charge, fonctionnalités et configuration de Tlon/Urbit
title: Tlon
x-i18n:
    generated_at: "2026-05-02T22:16:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 30915170786fc1ee8b84fb8be2ea42280262923064cfa9ca7107036096a13add
    source_path: channels/tlon.md
    workflow: 16
---

Tlon est une messagerie décentralisée construite sur Urbit. OpenClaw se connecte à votre ship Urbit et peut
répondre aux messages directs et aux messages de discussions de groupe. Les réponses de groupe nécessitent par défaut une mention @ et peuvent
être davantage restreintes via des listes d’autorisation.

Statut : Plugin intégré. Les messages directs, les mentions de groupe, les réponses dans les fils, la mise en forme de texte riche et les
téléversements d’images sont pris en charge. Les réactions et les sondages ne sont pas encore pris en charge.

## Plugin intégré

Tlon est livré comme Plugin intégré dans les versions actuelles d’OpenClaw ; les builds empaquetés
standard ne nécessitent donc pas d’installation séparée.

Si vous utilisez un build plus ancien ou une installation personnalisée qui exclut Tlon, installez un
paquet npm actuel :

Installation via CLI (registre npm) :

```bash
openclaw plugins install @openclaw/tlon
```

Utilisez le paquet nu pour suivre l’étiquette de version officielle actuelle. Épinglez une version
exacte uniquement lorsque vous avez besoin d’une installation reproductible.

Checkout local (lors d’une exécution depuis un dépôt git) :

```bash
openclaw plugins install ./path/to/local/tlon-plugin
```

Détails : [Plugins](/fr/tools/plugin)

## Configuration

1. Vérifiez que le Plugin Tlon est disponible.
   - Les versions empaquetées actuelles d’OpenClaw l’intègrent déjà.
   - Les installations plus anciennes/personnalisées peuvent l’ajouter manuellement avec les commandes ci-dessus.
2. Récupérez l’URL de votre ship et le code de connexion.
3. Configurez `channels.tlon`.
4. Redémarrez le Gateway.
5. Envoyez un message direct au bot ou mentionnez-le dans un canal de groupe.

Configuration minimale (compte unique) :

```json5
{
  channels: {
    tlon: {
      enabled: true,
      ship: "~sampel-palnet",
      url: "https://your-ship-host",
      code: "lidlut-tabwed-pillex-ridrup",
      ownerShip: "~your-main-ship", // recommandé : votre ship, toujours autorisé
    },
  },
}
```

## Ships privés/LAN

Par défaut, OpenClaw bloque les noms d’hôte et plages d’adresses IP privés/internes pour la protection SSRF.
Si votre ship fonctionne sur un réseau privé (localhost, IP LAN ou nom d’hôte interne),
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

⚠️ Activez cette option uniquement si vous faites confiance à votre réseau local. Ce paramètre désactive les protections SSRF
pour les requêtes vers l’URL de votre ship.

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

Liste d’autorisation des messages directs (vide = aucun message direct autorisé, utilisez `ownerShip` pour le flux d’approbation) :

```json5
{
  channels: {
    tlon: {
      dmAllowlist: ["~zod", "~nec"],
    },
  },
}
```

Autorisation des groupes (restreinte par défaut) :

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

Définissez un ship propriétaire pour recevoir les demandes d’approbation lorsque des utilisateurs non autorisés tentent d’interagir :

```json5
{
  channels: {
    tlon: {
      ownerShip: "~your-main-ship",
    },
  },
}
```

Le ship propriétaire est **automatiquement autorisé partout** — les invitations par message direct sont acceptées automatiquement et
les messages de canal sont toujours autorisés. Vous n’avez pas besoin d’ajouter le propriétaire à `dmAllowlist` ou
`defaultAuthorizedShips`.

Lorsqu’il est défini, le propriétaire reçoit des notifications par message direct pour :

- les demandes de message direct provenant de ships absents de la liste d’autorisation
- les mentions dans des canaux sans autorisation
- les demandes d’invitation de groupe

## Paramètres d’acceptation automatique

Accepter automatiquement les invitations par message direct (pour les ships dans dmAllowlist) :

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

Utilisez celles-ci avec `openclaw message send` ou la livraison cron :

- Message direct : `~sampel-palnet` ou `dm/~sampel-palnet`
- Groupe : `chat/~host-ship/channel` ou `group:~host-ship/channel`

## Skill intégré

Le Plugin Tlon inclut une Skill intégrée ([`@tloncorp/tlon-skill`](https://github.com/tloncorp/tlon-skill))
qui fournit un accès CLI aux opérations Tlon :

- **Contacts** : obtenir/mettre à jour des profils, lister les contacts
- **Canaux** : lister, créer, publier des messages, récupérer l’historique
- **Groupes** : lister, créer, gérer les membres
- **Messages directs** : envoyer des messages, réagir aux messages
- **Réactions** : ajouter/supprimer des réactions emoji aux publications et aux messages directs
- **Paramètres** : gérer les autorisations du Plugin via des commandes slash

La Skill est automatiquement disponible lorsque le Plugin est installé.

## Capacités

| Fonctionnalité   | Statut                                             |
| ---------------- | -------------------------------------------------- |
| Messages directs | ✅ Pris en charge                                  |
| Groupes/canaux   | ✅ Pris en charge (mentions requises par défaut)   |
| Fils             | ✅ Pris en charge (réponses automatiques dans le fil) |
| Texte riche      | ✅ Markdown converti au format Tlon                |
| Images           | ✅ Téléversées vers le stockage Tlon               |
| Réactions        | ✅ Via la [Skill intégrée](#bundled-skill)         |
| Sondages         | ❌ Pas encore pris en charge                       |
| Commandes natives | ✅ Pris en charge (propriétaire uniquement par défaut) |

## Dépannage

Exécutez d’abord cette procédure :

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
```

Échecs courants :

- **Messages directs ignorés** : l’expéditeur n’est pas dans `dmAllowlist` et aucun `ownerShip` n’est configuré pour le flux d’approbation.
- **Messages de groupe ignorés** : canal non découvert ou expéditeur non autorisé.
- **Erreurs de connexion** : vérifiez que l’URL du ship est joignable ; activez `allowPrivateNetwork` pour les ships locaux.
- **Erreurs d’authentification** : vérifiez que le code de connexion est actuel (les codes tournent).

## Référence de configuration

Configuration complète : [Configuration](/fr/gateway/configuration)

Options du fournisseur :

- `channels.tlon.enabled` : activer/désactiver le démarrage du canal.
- `channels.tlon.ship` : nom du ship Urbit du bot (par ex. `~sampel-palnet`).
- `channels.tlon.url` : URL du ship (par ex. `https://sampel-palnet.tlon.network`).
- `channels.tlon.code` : code de connexion du ship.
- `channels.tlon.allowPrivateNetwork` : autoriser les URL localhost/LAN (contournement SSRF).
- `channels.tlon.ownerShip` : ship propriétaire pour le système d’approbation (toujours autorisé).
- `channels.tlon.dmAllowlist` : ships autorisés à envoyer des messages directs (vide = aucun).
- `channels.tlon.autoAcceptDmInvites` : accepter automatiquement les messages directs des ships dans la liste d’autorisation.
- `channels.tlon.autoAcceptGroupInvites` : accepter automatiquement toutes les invitations de groupe.
- `channels.tlon.autoDiscoverChannels` : découvrir automatiquement les canaux de groupe (par défaut : true).
- `channels.tlon.groupChannels` : nids de canaux épinglés manuellement.
- `channels.tlon.defaultAuthorizedShips` : ships autorisés pour tous les canaux.
- `channels.tlon.authorization.channelRules` : règles d’authentification par canal.
- `channels.tlon.showModelSignature` : ajouter le nom du modèle aux messages.

## Notes

- Les réponses de groupe nécessitent une mention (par ex. `~your-bot-ship`) pour répondre.
- Réponses dans les fils : si le message entrant se trouve dans un fil, OpenClaw répond dans ce fil.
- Texte riche : la mise en forme Markdown (gras, italique, code, en-têtes, listes) est convertie au format natif de Tlon.
- Images : les URL sont téléversées vers le stockage Tlon et intégrées comme blocs d’image.

## Connexe

- [Vue d’ensemble des canaux](/fr/channels) — tous les canaux pris en charge
- [Association](/fr/channels/pairing) — authentification par message direct et flux d’association
- [Groupes](/fr/channels/groups) — comportement des discussions de groupe et obligation de mention
- [Routage de canal](/fr/channels/channel-routing) — routage des sessions pour les messages
- [Sécurité](/fr/gateway/security) — modèle d’accès et durcissement
