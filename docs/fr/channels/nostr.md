---
read_when:
    - Vous souhaitez qu’OpenClaw reçoive des messages privés via Nostr
    - Vous configurez une messagerie décentralisée
summary: Canal de messages privés Nostr via des messages chiffrés NIP-04
title: Nostr
x-i18n:
    generated_at: "2026-07-12T02:24:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 31fa283f706036a37795ddad71602058ba94388a9cb01044927c4bb2d83ba4a8
    source_path: channels/nostr.md
    workflow: 16
---

Nostr est un plugin de canal téléchargeable (`@openclaw/nostr`) qui permet à OpenClaw de recevoir des messages directs chiffrés avec NIP-04 et d’y répondre via des relais Nostr. Un compte par Gateway ; messages directs uniquement.

## Installation

```bash
openclaw plugins install @openclaw/nostr
```

Utilisez la spécification de paquet sans version pour suivre le tag de la version officielle actuelle. Épinglez une version exacte uniquement si vous avez besoin d’une installation reproductible.

Depuis une copie de travail locale (flux de développement) :

```bash
openclaw plugins install --link <path-to-local-nostr-plugin>
```

Redémarrez le Gateway après avoir installé ou activé des plugins. L’intégration initiale (`openclaw onboard`) et `openclaw channels add` proposent Nostr depuis le catalogue partagé des canaux une fois le plugin installé.

### Configuration non interactive

```bash
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY"
openclaw channels add --channel nostr --private-key "$NOSTR_PRIVATE_KEY" --relay-urls "wss://relay.damus.io,wss://relay.primal.net"
```

Utilisez `--use-env` pour conserver `NOSTR_PRIVATE_KEY` dans l’environnement au lieu d’enregistrer la clé dans la configuration (compte par défaut uniquement).

## Configuration rapide

1. Générez une paire de clés Nostr (si nécessaire) :

```bash
# Avec nak
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

| Clé          | Type     | Valeur par défaut                           | Description                                                         |
| ------------ | -------- | ------------------------------------------- | ------------------------------------------------------------------- |
| `privateKey` | string   | obligatoire                                 | Clé privée au format `nsec` ou hexadécimal ; références de secrets autorisées |
| `relays`     | string[] | `['wss://relay.damus.io', 'wss://nos.lol']` | URL des relais (WebSocket)                                          |
| `dmPolicy`   | string   | `pairing`                                   | Politique d’accès aux messages directs                              |
| `allowFrom`  | string[] | `[]`                                        | Clés publiques des expéditeurs autorisés                            |
| `enabled`    | boolean  | `true`                                      | Activer ou désactiver le canal                                      |
| `name`       | string   | -                                           | Nom d’affichage                                                      |
| `profile`    | object   | -                                           | Métadonnées de profil NIP-01                                        |

## Métadonnées du profil

Les données du profil sont publiées sous la forme d’un événement NIP-01 `kind:0`. Vous pouvez les gérer depuis l’interface de contrôle (Channels -> Nostr -> Profile) ou les définir directement dans la configuration.

Exemple :

```json5
{
  channels: {
    nostr: {
      privateKey: "${NOSTR_PRIVATE_KEY}",
      profile: {
        name: "openclaw",
        displayName: "OpenClaw",
        about: "Bot assistant personnel par message direct",
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
- L’importation depuis les relais fusionne les champs et préserve les valeurs locales prioritaires.

## Contrôle d’accès

### Politiques des messages directs

- **pairing** (par défaut) : les expéditeurs inconnus reçoivent un code d’appairage.
- **allowlist** : seules les clés publiques figurant dans `allowFrom` peuvent envoyer des messages directs.
- **open** : messages directs entrants publics (nécessite `allowFrom: ["*"]`).
- **disabled** : ignore les messages directs entrants.

Remarques sur l’application des règles :

- Les signatures des événements entrants sont vérifiées avant l’application de la politique d’expéditeur et le déchiffrement NIP-04, afin de rejeter rapidement les événements falsifiés.
- Les réponses d’appairage sont envoyées sans déchiffrer ni traiter le contenu du message direct d’origine.
- Le débit des messages directs entrants est limité globalement et par expéditeur, et les charges utiles trop volumineuses sont abandonnées avant le déchiffrement.

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

## Formats de clé

Formats acceptés :

- **Clé privée :** `nsec...` ou chaîne hexadécimale de 64 caractères
- **Clés publiques (`allowFrom`) :** `npub...` ou format hexadécimal

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

- Utilisez 2 à 3 relais pour assurer la redondance.
- Évitez d’utiliser trop de relais (latence, doublons).
- Les relais payants peuvent améliorer la fiabilité.
- Les relais locaux conviennent aux tests (`ws://localhost:7777`).

## Prise en charge des protocoles

| NIP    | État      | Description                                      |
| ------ | --------- | ------------------------------------------------ |
| NIP-01 | Pris en charge | Format d’événement de base et métadonnées de profil |
| NIP-04 | Pris en charge | Messages directs chiffrés (`kind:4`)             |
| NIP-17 | Prévu     | Messages directs encapsulés comme cadeaux        |
| NIP-44 | Prévu     | Chiffrement versionné                             |

## Tests

### Relais local

```bash
# Démarrer strfry
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

1. Relevez la clé publique du bot dans les journaux du Gateway ou avec `openclaw channels status` (format hexadécimal ; convertissez-la en npub dans votre client si nécessaire).
2. Ouvrez un client Nostr (Amethyst, Damus, etc.).
3. Envoyez un message direct à la clé publique du bot.
4. Vérifiez la réponse.

## Résolution des problèmes

### Aucun message reçu

- Vérifiez que la clé privée est valide.
- Assurez-vous que les URL des relais sont accessibles et utilisent `wss://` (ou `ws://` en local).
- Confirmez que `enabled` n’est pas défini sur `false`.
- Consultez les journaux du Gateway pour détecter les erreurs de connexion aux relais.

### Aucune réponse envoyée

- Vérifiez que le relais accepte les écritures.
- Vérifiez la connectivité sortante.
- Surveillez les limites de débit des relais.

### Réponses en double

- Ce comportement est attendu lors de l’utilisation de plusieurs relais.
- Les messages sont dédupliqués selon l’identifiant de l’événement ; seule la première livraison déclenche une réponse.

## Sécurité

- Ne validez jamais de clés privées dans le dépôt.
- Utilisez des variables d’environnement pour les clés.
- Envisagez `allowlist` pour les bots en production.
- Les signatures sont vérifiées avant l’application de la politique d’expéditeur, laquelle intervient avant le déchiffrement ; les événements falsifiés sont donc rejetés rapidement et les expéditeurs inconnus ne peuvent pas imposer l’exécution de l’intégralité des opérations cryptographiques.

## Limitations (MVP)

- Messages directs uniquement (aucune discussion de groupe).
- Aucune pièce jointe multimédia.
- NIP-04 uniquement (encapsulation NIP-17 prévue).

## Pages connexes

- [Présentation des canaux](/fr/channels) — tous les canaux pris en charge
- [Appairage](/fr/channels/pairing) — authentification des messages directs et processus d’appairage
- [Groupes](/fr/channels/groups) — comportement des discussions de groupe et filtrage par mention
- [Routage des canaux](/fr/channels/channel-routing) — routage des sessions pour les messages
- [Sécurité](/fr/gateway/security) — modèle d’accès et renforcement de la sécurité
