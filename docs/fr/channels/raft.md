---
read_when:
    - Vous souhaitez connecter OpenClaw à un espace de travail Raft
    - Vous configurez un agent externe Raft
    - Vous déboguez la remise du réveil Raft
sidebarTitle: Raft
summary: Prise en charge des agents externes Raft via le pont de réveil de la CLI Raft
title: Raft
x-i18n:
    generated_at: "2026-06-27T17:12:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ef9ebfd27e69575d9a1534b3b31f05036f081c54a2379411d2c7fb6f8165d558
    source_path: channels/raft.md
    workflow: 16
---

La prise en charge de Raft connecte un agent OpenClaw à un Agent externe Raft via la
CLI Raft locale. Raft envoie des indices de réveil authentifiés au Gateway. L’agent utilise ensuite
la CLI Raft pour vérifier et envoyer des messages.

## Installation

Raft est un Plugin externe officiel. Installez-le sur l’hôte du Gateway :

```bash
openclaw plugins install @openclaw/raft
openclaw gateway restart
```

Détails : [Plugins](/fr/tools/plugin)

## Prérequis

- Un espace de travail Raft avec un Agent externe.
- La CLI Raft installée sur le même hôte que le Gateway OpenClaw.
- Un profil CLI Raft déjà connecté et associé à cet Agent externe.

Le Plugin ne stocke pas les identifiants Raft. La CLI Raft conserve cette authentification
dans son propre profil.

## Configuration

Définissez le profil dans la configuration :

```json5
{
  channels: {
    raft: {
      enabled: true,
      profile: "openclaw",
    },
  },
}
```

Pour le compte par défaut, vous pouvez plutôt définir `RAFT_PROFILE` dans
l’environnement du Gateway :

```bash
RAFT_PROFILE=openclaw
```

Utilisez un compte nommé lorsqu’un Gateway se connecte à plusieurs Agents externes Raft :

```json5
{
  channels: {
    raft: {
      accounts: {
        support: {
          profile: "support-agent",
        },
        engineering: {
          profile: "engineering-agent",
        },
      },
    },
  },
}
```

Le flux de configuration interactif enregistre le même profil :

```bash
openclaw channels setup raft
```

## Fonctionnement

Au démarrage du Gateway, le Plugin :

1. Ouvre un point de terminaison HTTP de réveil limité au loopback sur un port éphémère.
2. Lance `raft --profile <profile> agent bridge` avec ce point de terminaison et un
   jeton propre au processus.
3. Accepte uniquement les indices de réveil authentifiés, sans contenu, avec une identité de relecture provenant du pont local.
4. Exige l’un des champs `eventId`, `attemptId`, `messageId`, `delivery_id`, `wake_id` ou `id`.
5. Déduplique les livraisons de réveil réessayées récemment selon l’identifiant d’événement du pont, y compris entre les redémarrages du Gateway.
6. Renvoie une session d’exécution stable pour le pont actuel et un lot de vidage d’activité vide pour le protocole CLI Raft.
7. Lance un tour d’agent OpenClaw sérialisé pour chaque réveil accepté.

Le pont gère les nouvelles tentatives de livraison Raft et les reconnexions. Le tour OpenClaw reçoit
uniquement un avis de réveil, pas une copie du corps du message Raft. Il utilise la CLI pour lire
les messages en attente et envoyer sa réponse :

```bash
raft --profile openclaw message check
raft --profile openclaw message send
```

<Note>
Raft n’est pas un transport normal de messages push. OpenClaw n’envoie pas automatiquement
le texte final du modèle via le pont ; l’agent doit donc utiliser la
CLI Raft après avoir traité un réveil.
</Note>

## Vérification

Vérifiez qu’OpenClaw peut trouver la CLI et dispose d’un profil configuré :

```bash
openclaw channels status --probe
openclaw plugins inspect raft --runtime --json
```

Envoyez ensuite un message à l’Agent externe Raft. Le journal du Gateway doit afficher le
démarrage du pont Raft, suivi d’un réveil entrant. L’agent doit utiliser le
profil Raft configuré pour vérifier ses messages en attente.

## Dépannage

<AccordionGroup>
  <Accordion title="La CLI Raft est manquante">
    Installez la CLI Raft sur l’hôte du Gateway et rendez `raft` disponible dans le
    `PATH` du service. Vérifiez avec `raft --help`, puis redémarrez le Gateway.
  </Accordion>
  <Accordion title="Le pont se ferme immédiatement">
    Vérifiez que le profil configuré est connecté et appartient à l’Agent externe
    Raft prévu. Exécutez `raft --profile <profile> agent bridge` directement
    pour voir le diagnostic de la CLI.
  </Accordion>
  <Accordion title="Un réveil arrive, mais aucune réponse Raft n’est envoyée">
    C’est attendu lorsque l’agent n’invoque pas la CLI Raft. Le pont de réveil
    ne transporte pas les corps de message ni les réponses finales automatiques. Vérifiez la
    politique d’outils de l’agent et assurez-vous qu’il peut exécuter `raft --profile <profile> message
    check` et `message send`.
  </Accordion>
</AccordionGroup>

## Références

- [Raft](https://raft.build/)
- [Documentation Raft](https://docs.raft.build/welcome/)
- [Intégration Hermes Raft](https://hermes-agent.nousresearch.com/docs/user-guide/messaging/raft)
