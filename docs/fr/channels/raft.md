---
read_when:
    - Vous souhaitez connecter OpenClaw à un espace de travail Raft
    - Vous configurez un agent externe Raft
    - Vous déboguez la remise des réveils Raft
sidebarTitle: Raft
summary: Prise en charge de l’agent externe Raft via le pont de réveil de la CLI Raft
title: Raft
x-i18n:
    generated_at: "2026-07-12T15:03:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 454d92d764a4ec3b0ec52467cba254dcad795870e04d1d32d4cf65d8b451a0de
    source_path: channels/raft.md
    workflow: 16
---

Raft connecte un agent OpenClaw à un agent externe Raft par l’intermédiaire de la
CLI Raft locale. Raft envoie des notifications de réveil authentifiées au Gateway ;
l’agent utilise ensuite la CLI Raft pour consulter et envoyer des messages.
Conversations directes uniquement (aucun groupe).

## Installation

Raft est un plugin externe officiel. Installez-le sur l’hôte du Gateway :

```bash
openclaw plugins install @openclaw/raft
openclaw gateway restart
```

Détails : [Plugins](/fr/tools/plugin)

## Prérequis

- Un espace de travail Raft doté d’un agent externe.
- La CLI Raft installée sur le même hôte que le Gateway OpenClaw et accessible
  dans le `PATH` du service.
- Un profil de CLI Raft déjà connecté et associé à cet agent externe.

Le plugin ne stocke pas les identifiants Raft ; la CLI Raft conserve cette
authentification dans son propre profil.

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

Pour le compte par défaut, vous pouvez à la place définir `RAFT_PROFILE` dans
l’environnement du Gateway :

```bash
RAFT_PROFILE=openclaw
```

Utilisez un compte nommé lorsqu’un Gateway se connecte à plusieurs agents externes Raft :

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

La configuration interactive enregistre le même profil :

```bash
openclaw channels add --channel raft
```

## Fonctionnement

Lorsque le Gateway démarre, le plugin :

1. Ouvre un point de terminaison HTTP de réveil accessible uniquement en boucle locale sur un port éphémère.
2. Démarre `raft --profile <profile> agent bridge` avec ce point de terminaison et un
   jeton propre au processus.
3. Accepte uniquement les notifications de réveil authentifiées, sans contenu et dotées
   d’un identifiant anti-rejeu provenant du pont local.
4. Exige la présence de `eventId`, `attemptId`, `messageId`, `delivery_id`,
   `wake_id` ou `id` dans chaque charge utile de réveil.
5. Déduplique pendant 24 heures les nouvelles tentatives de livraison de notifications de réveil
   selon l’identifiant d’événement du pont, y compris après les redémarrages du Gateway.
6. Renvoie une session d’exécution stable pour le pont actuel et un lot vide
   de collecte d’activité pour le protocole de la CLI Raft.
7. Lance un tour sérialisé de l’agent OpenClaw pour chaque réveil accepté.

Le pont gère les nouvelles tentatives de livraison et les reconnexions de Raft. Le tour
OpenClaw reçoit uniquement une notification de réveil, et non une copie du corps du
message Raft. Il utilise la CLI pour lire les messages en attente et envoyer sa réponse :

```bash
raft --profile openclaw message check
raft --profile openclaw message send
```

<Note>
Raft n’est pas un transport de messages poussés. OpenClaw ne renvoie pas automatiquement le texte final du modèle par l’intermédiaire du pont ; l’agent doit donc utiliser la CLI Raft après avoir traité un réveil.
</Note>

## Vérification

Vérifiez qu’OpenClaw peut trouver la CLI et dispose d’un profil configuré :

```bash
openclaw channels status --probe
openclaw plugins inspect raft --runtime --json
```

Envoyez ensuite un message à l’agent externe Raft. Le journal du Gateway doit indiquer
le démarrage du pont Raft, suivi d’un réveil entrant. L’agent doit utiliser
le profil Raft configuré pour consulter ses messages en attente.

## Dépannage

<AccordionGroup>
  <Accordion title="La CLI Raft est introuvable">
    Installez la CLI Raft sur l’hôte du Gateway et rendez `raft` accessible dans le
    `PATH` du service. Vérifiez-la avec `raft --help`, puis redémarrez le Gateway.
  </Accordion>
  <Accordion title="Le pont s’arrête immédiatement">
    Vérifiez que le profil configuré est connecté et appartient à l’agent externe
    Raft prévu. Exécutez directement `raft --profile <profile> agent bridge`
    pour afficher le diagnostic de la CLI.
  </Accordion>
  <Accordion title="Un réveil arrive, mais aucune réponse Raft n’est envoyée">
    Ce comportement est attendu lorsque l’agent n’appelle pas la CLI Raft. Le pont
    de réveil ne transporte ni le corps des messages ni les réponses finales automatiques. Vérifiez la
    stratégie d’outils de l’agent et assurez-vous qu’il peut exécuter `raft --profile <profile>
    message check` et `message send`.
  </Accordion>
</AccordionGroup>

## Références

- [Raft](https://raft.build/)
- [Documentation de Raft](https://docs.raft.build/welcome/)
- [Intégration de Raft à Hermes](https://hermes-agent.nousresearch.com/docs/user-guide/messaging/raft)
