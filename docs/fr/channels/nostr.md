---
read_when:
    - Vous souhaitez qu’OpenClaw reçoive des messages privés via Nostr
    - Vous configurez une messagerie décentralisée
summary: Canal de messages directs Nostr via des messages chiffrés NIP-04
title: Nostr
x-i18n:
    generated_at: "2026-04-30T07:13:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 545d68077c9fe81d5fa5a17262d37e3688185a1fb12d67b8b1053b27b96c3c7f
    source_path: channels/nostr.md
    workflow: 16
---

**Statut :** Plugin groupé facultatif (désactivé par défaut jusqu’à configuration).

Nostr est un protocole décentralisé pour les réseaux sociaux. Ce canal permet à OpenClaw de recevoir des messages directs (DM) chiffrés et d’y répondre via NIP-04.

## Plugin groupé

Les versions actuelles d’OpenClaw incluent Nostr comme Plugin groupé ; les builds
packagés normaux n’ont donc pas besoin d’une installation séparée.

### Installations anciennes/personnalisées

- L’onboarding (`openclaw onboard`) et `openclaw channels add` exposent toujours
  Nostr depuis le catalogue de canaux partagé.
- Si votre build exclut Nostr groupé, installez un package npm actuel lorsqu’il
  est publié.

```bash
openclaw plugins install @openclaw/nostr
```

Si npm signale que le package détenu par OpenClaw est obsolète, utilisez un build
OpenClaw packagé actuel ou un checkout local jusqu’à la publication d’un package npm plus récent.

Utilisez un checkout local (workflows de développement) :

```bash
openclaw plugins install --link <path-to-local-nostr-plugin>
```

Redémarrez le Gateway après l’installation ou l’activation de plugins.

### Configuration non interactive

```bash
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY" --relay-urls "wss://relay.damus.io,wss://relay.primal.net"
```

Utilisez `--use-env` pour conserver `NOSTR_PRIVATE_KEY` dans l’environnement au lieu de stocker la clé dans la configuration.

## Configuration rapide

1. Générez une paire de clés Nostr (si nécessaire) :

```bash
# Using nak
nak key generate
```

2. Ajoutez-la à la configuration :

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
    },
  },
}
```

3. Exportez la clé :

```bash
export NOSTR_PRIVATE_KEY="nsec1..."
```

4. Redémarrez le Gateway.

## Référence de configuration

| Clé          | Type     | Valeur par défaut                         | Description                                 |
| ------------ | -------- | ----------------------------------------- | ------------------------------------------- |
| `privateKey` | string   | obligatoire                               | Clé privée au format `nsec` ou hexadécimal  |
| `relays`     | string[] | `['wss://relay.damus.io', 'wss://nos.lol']` | URL des relais (WebSocket)                |
| `dmPolicy`   | string   | `pairing`                                 | Politique d’accès aux DM                    |
| `allowFrom`  | string[] | `[]`                                      | Pubkeys d’expéditeurs autorisés             |
| `enabled`    | boolean  | `true`                                    | Activer/désactiver le canal                 |
| `name`       | string   | -                                         | Nom d’affichage                             |
| `profile`    | object   | -                                         | Métadonnées de profil NIP-01                |

## Métadonnées de profil

Les données de profil sont publiées sous forme d’événement NIP-01 `kind:0`. Vous pouvez les gérer depuis l’interface de contrôle (Canaux -> Nostr -> Profil) ou les définir directement dans la configuration.

Exemple :

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      profile: {
        name: "openclaw",
        displayName: "OpenClaw",
        about: "Personal assistant DM bot",
        picture: "https://example.com/avatar.png",
        banner: "https://example.com/banner.png",
        website: "https://example.com",
        nip05: "openclaw@example.com",
        lud16: "openclaw@example.com",
      },
    },
  },
}
```

Remarques :

- Les URL de profil doivent utiliser `https://`.
- L’import depuis des relais fusionne les champs et préserve les remplacements locaux.

## Contrôle d’accès

### Politiques de DM

- **pairing** (par défaut) : les expéditeurs inconnus reçoivent un code d’appairage.
- **allowlist** : seules les pubkeys dans `allowFrom` peuvent envoyer des DM.
- **open** : DM entrants publics (nécessite `allowFrom: ["*"]`).
- **disabled** : ignorer les DM entrants.

Remarques d’application :

- Les signatures des événements entrants sont vérifiées avant la politique d’expéditeur et le déchiffrement NIP-04 ; les événements falsifiés sont donc rejetés tôt.
- Les réponses d’appairage sont envoyées sans traiter le corps du DM d’origine.
- Les DM entrants sont limités en débit et les payloads surdimensionnés sont supprimés avant le déchiffrement.

### Exemple de liste d’autorisation

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      dmPolicy: "allowlist",
      allowFrom: ["npub1abc...", "npub1xyz..."],
    },
  },
}
```

## Formats de clés

Formats acceptés :

- **Clé privée :** `nsec...` ou hexadécimal de 64 caractères
- **Pubkeys (`allowFrom`) :** `npub...` ou hexadécimal

## Relais

Valeurs par défaut : `relay.damus.io` et `nos.lol`.

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      relays: ["wss://relay.damus.io", "wss://relay.primal.net", "wss://nostr.wine"],
    },
  },
}
```

Conseils :

- Utilisez 2 à 3 relais pour la redondance.
- Évitez un trop grand nombre de relais (latence, duplication).
- Les relais payants peuvent améliorer la fiabilité.
- Les relais locaux conviennent aux tests (`ws://localhost:7777`).

## Prise en charge du protocole

| NIP    | Statut    | Description                                      |
| ------ | --------- | ------------------------------------------------ |
| NIP-01 | Pris en charge | Format d’événement de base + métadonnées de profil |
| NIP-04 | Pris en charge | DM chiffrés (`kind:4`)                    |
| NIP-17 | Prévu     | DM emballés comme cadeaux                        |
| NIP-44 | Prévu     | Chiffrement versionné                            |

## Tests

### Relais local

```bash
# Start strfry
docker run -p 7777:7777 ghcr.io/hoytech/strfry
```

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      relays: ["ws://localhost:7777"],
    },
  },
}
```

### Test manuel

1. Notez la pubkey du bot (npub) depuis les journaux.
2. Ouvrez un client Nostr (Damus, Amethyst, etc.).
3. Envoyez un DM à la pubkey du bot.
4. Vérifiez la réponse.

## Dépannage

### Messages non reçus

- Vérifiez que la clé privée est valide.
- Assurez-vous que les URL des relais sont joignables et utilisent `wss://` (ou `ws://` en local).
- Confirmez que `enabled` n’est pas `false`.
- Consultez les journaux du Gateway pour les erreurs de connexion aux relais.

### Réponses non envoyées

- Vérifiez que le relais accepte les écritures.
- Vérifiez la connectivité sortante.
- Surveillez les limites de débit des relais.

### Réponses en double

- Attendu lors de l’utilisation de plusieurs relais.
- Les messages sont dédupliqués par ID d’événement ; seule la première livraison déclenche une réponse.

## Sécurité

- Ne commitez jamais de clés privées.
- Utilisez des variables d’environnement pour les clés.
- Envisagez `allowlist` pour les bots de production.
- Les signatures sont vérifiées avant la politique d’expéditeur, et la politique d’expéditeur est appliquée avant le déchiffrement ; les événements falsifiés sont donc rejetés tôt et les expéditeurs inconnus ne peuvent pas forcer un travail cryptographique complet.

## Limitations (MVP)

- Messages directs uniquement (pas de discussions de groupe).
- Pas de pièces jointes multimédias.
- NIP-04 uniquement (gift-wrap NIP-17 prévu).

## Connexes

- [Vue d’ensemble des canaux](/fr/channels) — tous les canaux pris en charge
- [Appairage](/fr/channels/pairing) — authentification par DM et flux d’appairage
- [Groupes](/fr/channels/groups) — comportement des discussions de groupe et filtrage des mentions
- [Routage des canaux](/fr/channels/channel-routing) — routage de session pour les messages
- [Sécurité](/fr/gateway/security) — modèle d’accès et durcissement
