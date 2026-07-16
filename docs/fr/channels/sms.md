---
read_when:
    - Vous souhaitez connecter OpenClaw aux SMS via Twilio
    - Vous devez configurer le Webhook SMS ou la liste d’autorisation
summary: Configuration du canal SMS Twilio, contrôles d’accès et configuration du webhook
title: SMS
x-i18n:
    generated_at: "2026-07-16T13:05:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 99a76b2f2d66858f8eb699939084104e620af9bc024053bbe1c1d7350530bff0
    source_path: channels/sms.md
    workflow: 16
---

OpenClaw reçoit et envoie des SMS via un numéro de téléphone Twilio ou un Messaging Service. Le Gateway enregistre une route Webhook entrante (par défaut `/webhooks/sms`), valide par défaut les signatures des requêtes Twilio et renvoie les réponses via l’API Messages de Twilio.

Statut : plugin officiel, installé séparément. Texte uniquement : aucun MMS/média, messages directs uniquement.

<CardGroup cols={3}>
  <Card title="Association" icon="link" href="/fr/channels/pairing">
    La politique de MP par défaut pour les SMS est l’association.
  </Card>
  <Card title="Sécurité du Gateway" icon="shield" href="/fr/gateway/security">
    Examinez l’exposition du Webhook et les contrôles d’accès des expéditeurs.
  </Card>
  <Card title="Dépannage des canaux" icon="wrench" href="/fr/channels/troubleshooting">
    Diagnostics intercanaux et procédures de réparation.
  </Card>
</CardGroup>

## Avant de commencer

Éléments nécessaires :

- Le plugin SMS officiel installé avec `openclaw plugins install @openclaw/sms`.
- Un compte Twilio avec un numéro de téléphone compatible SMS, ou un Twilio Messaging Service.
- Le SID de compte et le jeton d’authentification Twilio.
- Une URL HTTPS publique permettant d’accéder à votre Gateway OpenClaw.
- Un choix de politique d’expéditeur : `pairing` (par défaut) pour un usage privé, `allowlist` pour les numéros de téléphone préapprouvés, ou `open` uniquement pour un accès SMS volontairement public.

Un même numéro Twilio peut servir à la fois aux SMS et aux [appels vocaux](/fr/plugins/voice-call) s’il dispose des deux fonctionnalités. Le Webhook SMS et le Webhook vocal sont configurés séparément dans Twilio et utilisent des chemins Gateway distincts ; cette page traite uniquement du Webhook SMS.

## Configuration rapide

<Steps>
  <Step title="Installer le plugin">
    ```bash
    openclaw plugins install @openclaw/sms
    ```
  </Step>
  <Step title="Créer ou choisir un expéditeur Twilio">
    Dans Twilio, ouvrez **Phone Numbers > Manage > Active numbers** et choisissez un numéro compatible SMS. Enregistrez :

    - Le SID de compte, par exemple `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
    - Le jeton d’authentification
    - Le numéro de téléphone de l’expéditeur, par exemple `+15551234567`

    Si vous utilisez un Messaging Service au lieu d’un numéro d’expéditeur fixe, enregistrez le SID du Messaging Service, par exemple `MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`.

  </Step>

  <Step title="Configurer le canal SMS">

Enregistrez ceci sous `sms.patch.json5` et modifiez les espaces réservés :

```json5
{
  channels: {
    sms: {
      enabled: true,
      accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      authToken: "twilio-auth-token",
      fromNumber: "+15551234567",
      publicWebhookUrl: "https://gateway.example.com/webhooks/sms",
      dmPolicy: "pairing",
    },
  },
}
```

Appliquez-le :

```bash
openclaw config patch --file ./sms.patch.json5 --dry-run
openclaw config patch --file ./sms.patch.json5
```

  </Step>

  <Step title="Faire pointer Twilio vers le Webhook du Gateway">
    Dans les paramètres du numéro de téléphone Twilio, ouvrez **Messaging** et définissez **A message comes in** sur :

```text
https://gateway.example.com/webhooks/sms
```

    Utilisez HTTP `POST`. Le chemin local par défaut est `/webhooks/sms` ; modifiez `channels.sms.webhookPath` si vous avez besoin d’une autre route.

  </Step>

  <Step title="Exposer le chemin exact du Webhook SMS">
    Votre URL publique doit acheminer le chemin SMS vers le processus Gateway (port par défaut `18789`). Si vous utilisez Tailscale Funnel pour des tests locaux, exposez explicitement `/webhooks/sms` :

```bash
tailscale funnel --bg --set-path /webhooks/sms http://127.0.0.1:<gateway-port>/webhooks/sms
tailscale funnel status
```

    Les appels vocaux et les SMS utilisent des chemins Webhook distincts. Si le même numéro Twilio gère les deux, conservez les deux routes configurées dans Twilio et dans votre tunnel.

  </Step>

  <Step title="Démarrer le Gateway et approuver le premier expéditeur">

```bash
openclaw gateway
```

Envoyez un SMS au numéro Twilio. Le premier message crée une demande d’association. Approuvez-la :

```bash
openclaw pairing list sms
openclaw pairing approve sms <CODE>
```

    Les codes d’association expirent après 1 heure.

  </Step>
</Steps>

## Exemples de configuration

Toutes les clés se trouvent sous `channels.sms` (et, pour chaque compte, sous `channels.sms.accounts.<id>`) :

| Clé                                     | Valeur par défaut | Fonction                                                            |
| --------------------------------------- | ----------------- | ------------------------------------------------------------------- |
| `enabled`                               | `true`          | Active ou désactive le canal/compte.                                |
| `accountSid`                            | —               | SID du compte Twilio (`AC...`).                                     |
| `authToken`                             | —               | Jeton d’authentification Twilio ; chaîne en texte brut ou SecretRef. |
| `fromNumber`                            | —               | Numéro d’expéditeur au format E.164.                                |
| `messagingServiceSid`                   | —               | SID du Messaging Service (`MG...`) utilisé lorsqu’aucun `fromNumber` n’est résolu. |
| `defaultTo`                             | —               | Destination par défaut lorsqu’un flux d’envoi omet une cible explicite. |
| `webhookPath`                           | `/webhooks/sms` | Chemin HTTP du Gateway pour les Webhooks Twilio entrants.           |
| `publicWebhookUrl`                      | —               | URL publique configurée dans Twilio ; requise pour valider les signatures. |
| `dangerouslyDisableSignatureValidation` | `false`         | Ignore les vérifications `X-Twilio-Signature` ; uniquement pour tester un tunnel local. |
| `dmPolicy`                              | `"pairing"`     | `pairing`, `allowlist`, `open` ou `disabled`.                      |
| `allowFrom`                             | `[]`            | Numéros d’expéditeurs autorisés au format E.164, ou `"*"` avec `dmPolicy: "open"`. |
| `textChunkLimit`                        | `1500`          | Nombre maximal de caractères par segment de SMS sortant.            |
| `accounts`, `defaultAccount`            | —               | Table de correspondance multicomptes et identifiant du compte par défaut. |

### Fichier de configuration

Utilisez la configuration par fichier lorsque vous souhaitez que la définition du canal accompagne la configuration du Gateway :

```json5
{
  channels: {
    sms: {
      enabled: true,
      accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      authToken: "twilio-auth-token",
      fromNumber: "+15551234567",
      publicWebhookUrl: "https://gateway.example.com/webhooks/sms",
      dmPolicy: "pairing",
    },
  },
}
```

### Variables d’environnement

Les variables d’environnement s’appliquent uniquement au compte par défaut ; les valeurs de configuration ont priorité sur celles de l’environnement.

| Variable                                        | Correspond à                                      |
| ----------------------------------------------- | ------------------------------------------------- |
| `TWILIO_ACCOUNT_SID`                            | `accountSid`                                       |
| `TWILIO_AUTH_TOKEN`                             | `authToken`                                        |
| `TWILIO_PHONE_NUMBER` (alias `TWILIO_SMS_FROM`) | `fromNumber`                                       |
| `TWILIO_MESSAGING_SERVICE_SID`                  | `messagingServiceSid`                              |
| `SMS_PUBLIC_WEBHOOK_URL`                        | `publicWebhookUrl`                                 |
| `SMS_WEBHOOK_PATH`                              | `webhookPath`                                      |
| `SMS_ALLOWED_USERS`                             | `allowFrom` (séparées par des virgules)           |
| `SMS_TEXT_CHUNK_LIMIT`                          | `textChunkLimit`                                   |
| `SMS_DANGEROUSLY_DISABLE_SIGNATURE_VALIDATION`  | `dangerouslyDisableSignatureValidation` (`"true"`) |

```bash
export TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
export TWILIO_AUTH_TOKEN="<twilio-auth-token>"
export TWILIO_PHONE_NUMBER="+15551234567"
export SMS_PUBLIC_WEBHOOK_URL="https://gateway.example.com/webhooks/sms"
```

Activez ensuite le canal dans la configuration :

```json5
{
  channels: {
    sms: {
      enabled: true,
      dmPolicy: "pairing",
    },
  },
}
```

### Jeton d’authentification SecretRef

`authToken` peut être une SecretRef (`source: "env" | "file" | "exec"`). Utilisez cette option lorsque le Gateway doit résoudre le jeton d’authentification Twilio depuis l’environnement d’exécution des secrets OpenClaw au lieu de le stocker en texte brut dans la configuration :

```json5
{
  channels: {
    sms: {
      enabled: true,
      accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      authToken: { source: "env", provider: "default", id: "TWILIO_AUTH_TOKEN" },
      fromNumber: "+15551234567",
      publicWebhookUrl: "https://gateway.example.com/webhooks/sms",
      dmPolicy: "pairing",
    },
  },
}
```

La variable d’environnement ou le fournisseur de secrets référencé doit être visible par l’environnement d’exécution du Gateway. Redémarrez les processus Gateway gérés après avoir modifié les variables d’environnement de l’hôte.

### Expéditeur Messaging Service

Utilisez `messagingServiceSid` au lieu de `fromNumber` lorsque Twilio doit choisir l’expéditeur par l’intermédiaire d’un Messaging Service :

```json5
{
  channels: {
    sms: {
      enabled: true,
      accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      authToken: "twilio-auth-token",
      messagingServiceSid: "MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      publicWebhookUrl: "https://gateway.example.com/webhooks/sms",
      dmPolicy: "pairing",
    },
  },
}
```

Si `fromNumber` et `messagingServiceSid` sont tous deux présents après la résolution de la configuration et de l’environnement, `fromNumber` est utilisé.

### Cible sortante par défaut

Définissez `defaultTo` lorsqu’une automatisation ou un envoi initié par un agent doit disposer d’une destination par défaut si un flux d’envoi omet une cible explicite :

```json5
{
  channels: {
    sms: {
      enabled: true,
      accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      authToken: "twilio-auth-token",
      fromNumber: "+15551234567",
      defaultTo: "+15557654321",
      publicWebhookUrl: "https://gateway.example.com/webhooks/sms",
    },
  },
}
```

## Contrôle d’accès

`channels.sms.dmPolicy` contrôle l’accès direct par SMS :

- `pairing` (par défaut) : les expéditeurs inconnus reçoivent un code d’association ; approuvez-les avec `openclaw pairing approve sms <CODE>`.
- `allowlist` : seuls les expéditeurs figurant dans `allowFrom` sont traités. Une valeur `allowFrom` vide rejette tous les expéditeurs (le Gateway consigne un avertissement au démarrage).
- `open` : la validation de la configuration exige que `allowFrom` contienne `"*"`. Sans le caractère générique, seuls les numéros répertoriés peuvent discuter.
- `disabled` : tous les MP entrants sont ignorés.

Les entrées `allowFrom` doivent être des numéros de téléphone au format E.164, tels que `+15551234567`. Les préfixes `sms:` et `twilio-sms:` sont acceptés et normalisés. Pour un assistant privé, privilégiez `dmPolicy: "allowlist"` avec des numéros de téléphone explicites :

```json5
{
  channels: {
    sms: {
      enabled: true,
      accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      authToken: "twilio-auth-token",
      fromNumber: "+15551234567",
      publicWebhookUrl: "https://gateway.example.com/webhooks/sms",
      dmPolicy: "allowlist",
      allowFrom: ["+15557654321"],
    },
  },
}
```

## Envoi de SMS

Lorsque le canal SMS est sélectionné, les cibles acceptent les numéros E.164 sans préfixe ou le préfixe `sms:` :

```bash
openclaw message send --channel sms --target sms:+15551234567 --message "hello"
```

Lorsque la sélection du canal est implicite, le préfixe `twilio-sms:` sélectionne ce canal sans remplacer le préfixe de service `sms:`, qu’iMessage utilise pour choisir l’acheminement SMS de l’opérateur pour ses propres cibles :

```bash
openclaw message send --target twilio-sms:+15551234567 --message "hello"
```

La CLI exige une valeur `--target` explicite. `defaultTo` est destiné aux automatisations et aux envois initiés par un agent, pour lesquels la cible peut être résolue à partir de la configuration du canal.

Les réponses de l’agent aux conversations SMS entrantes sont automatiquement renvoyées à l’expéditeur via l’expéditeur Twilio configuré.

La sortie SMS est en texte brut. OpenClaw supprime le Markdown, aplatit les blocs de code délimités, réécrit les liens sous la forme `label (url)` et divise les longues réponses en segments d’au plus `textChunkLimit` caractères (1500 par défaut) avant de les envoyer via Twilio.

## Vérifier la configuration

Après le démarrage du Gateway :

1. Confirmez que le journal du Gateway affiche la route du Webhook SMS.
2. Exécutez une sonde côté Twilio (elle vérifie l’URL et la méthode du Webhook Twilio configuré ainsi que les erreurs entrantes récentes) :

```bash
openclaw channels capabilities --channel sms
openclaw channels status --channel sms --probe --json
```

3. Envoyez un SMS au numéro Twilio depuis votre téléphone.
4. Exécutez `openclaw pairing list sms`.
5. Approuvez le code d’appairage avec `openclaw pairing approve sms <CODE>`.
6. Envoyez un autre SMS et confirmez que l’agent répond.

Pour tester uniquement l’envoi sortant, utilisez :

```bash
openclaw message send --channel sms --target sms:+15557654321 --message "OpenClaw SMS test"
```

### Test de bout en bout depuis iMessage/SMS sous macOS

Sur un Mac capable d’envoyer des SMS via l’opérateur avec Messages, vous pouvez utiliser `imsg` pour piloter le côté expéditeur sans toucher à votre téléphone :

```bash
imsg send --to "+15551234567" --service sms --text "OpenClaw SMS E2E $(date -u +%Y%m%dT%H%M%SZ)" --json
openclaw pairing list sms
openclaw pairing approve sms <CODE>
imsg send --to "+15551234567" --service sms --text "reply exactly SMS pong" --json
```

Le premier message doit créer une demande d’appairage. Le second message doit recevoir la réponse de l’agent via Twilio.

## Sécurité du Webhook

Par défaut, OpenClaw valide `X-Twilio-Signature` à l’aide de `publicWebhookUrl` et de `authToken`. Veillez à ce que la partie point de terminaison de `publicWebhookUrl` corresponde octet pour octet à l’URL configurée dans Twilio, notamment le schéma, l’hôte, le chemin et la chaîne de requête. OpenClaw exclut du calcul de la signature les fragments [connection-override](https://www.twilio.com/docs/usage/webhooks/webhooks-connection-overrides) de Twilio (`#...`), comme l’exige Twilio.

La route du Webhook applique également les règles suivantes, indépendamment de la validation de la signature :

- `POST` uniquement.
- Budget de 300 requêtes ayant échoué par minute, par compte SMS, route de Webhook et adresse cliente résolue. Toutes les requêtes sont comptabilisées dans ce budget, mais le statut HTTP 429 n’est appliqué qu’après l’échec d’une requête lors de l’analyse du corps, de la validation Twilio ou de la mise en correspondance d’AccountSid.
- Limite de débit de 30 rappels acceptés et distribuables par minute, par compte SMS, route de Webhook et adresse cliente résolue, une fois ces vérifications réussies (HTTP 429 au-delà). Si la validation de la signature est désactivée, cette limite de 30/min constitue le plafond de distribution non authentifiée.
- Les adresses clientes sont résolues selon les règles partagées du Gateway relatives aux proxys de confiance. Si `gateway.trustedProxies` contient le proxy inverse qui transfère les rappels Twilio, OpenClaw indexe ces limites selon l’adresse cliente transférée ; sinon, il utilise l’adresse directe du socket.
- La valeur `AccountSid` de la charge utile doit correspondre à la valeur `accountSid` configurée (sinon, HTTP 403).
- Les valeurs `MessageSid` rejouées sont dédupliquées pendant 10 minutes.
- Le cache de rejeu de chaque compte SMS conserve jusqu’à 10,000 SID de messages actifs. Lorsque tous les emplacements sont actifs, les nouveaux Webhooks de ce compte échouent de manière fermée avec HTTP 429 et un en-tête `Retry-After` jusqu’à l’expiration de l’emplacement le plus ancien.
- Les corps de requête dépassant 32 KB sont rejetés.

Par défaut, Twilio ne retente pas les requêtes HTTP 429 et ne documente pas la prise en charge de `Retry-After`. Les remplacements de connexion `#rp=4xx` et `#rp=all` activent les nouvelles tentatives en cas d’erreur 4xx, mais Twilio limite la transaction de nouvelle tentative complète à 15 secondes ; les tentatives peuvent donc toujours se terminer avant l’expiration d’un emplacement du cache de rejeu. Configurez une URL de secours lorsqu’un autre gestionnaire doit recevoir les livraisons ayant échoué ; considérez un statut 429 comme un rejet par fermeture en cas d’échec, et non comme une contre-pression fiable.

Pour les tests avec un tunnel local uniquement, vous pouvez définir :

```json5
{
  channels: {
    sms: {
      dangerouslyDisableSignatureValidation: true,
    },
  },
}
```

N’utilisez pas la validation de signature désactivée sur un Gateway public.

## Configuration multicomptes

Utilisez `accounts` lorsque vous exploitez plusieurs numéros Twilio :

```json5
{
  channels: {
    sms: {
      accounts: {
        support: {
          enabled: true,
          accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
          authToken: "twilio-auth-token",
          fromNumber: "+15551234567",
          publicWebhookUrl: "https://gateway.example.com/webhooks/sms/support",
          webhookPath: "/webhooks/sms/support",
          dmPolicy: "allowlist",
          allowFrom: ["+15557654321"],
        },
      },
    },
  },
}
```

Chaque compte doit utiliser une valeur `webhookPath` distincte ; le Gateway refuse d’enregistrer une route de Webhook dont le chemin appartient déjà à un autre compte. Les valeurs de secours d’environnement `TWILIO_*`/`SMS_*` ne s’appliquent qu’au compte par défaut ; définissez `defaultAccount` pour changer ce compte.

## Résolution des problèmes

### Twilio renvoie 403 ou OpenClaw rejette le Webhook

Vérifiez que `publicWebhookUrl` correspond exactement à l’URL configurée dans Twilio, notamment le schéma, l’hôte, le chemin et la chaîne de requête. Twilio signe la chaîne de l’URL publique ; les réécritures effectuées par un proxy et les autres noms d’hôte peuvent donc empêcher la validation de la signature.

Un statut 403 avec `Invalid account` signifie que la valeur `AccountSid` de la charge utile entrante ne correspond pas à la valeur `accountSid` configurée ; vérifiez que le Webhook pointe vers le compte propriétaire du numéro.

### Aucune demande d’appairage n’apparaît

Vérifiez l’URL et la méthode du Webhook **Messaging** du numéro Twilio. Il doit pointer vers l’URL du Webhook SMS et utiliser `POST`. Confirmez également que le Gateway est accessible depuis l’Internet public ou via votre tunnel.

Si le journal des messages Twilio affiche l’erreur `11200`, Twilio a accepté le SMS entrant, mais n’a pas pu joindre votre Webhook. Vérifiez les points suivants :

- Dans Twilio, **Messaging > A message comes in** pointe vers `publicWebhookUrl`.
- La méthode est `POST`.
- Le tunnel ou le proxy inverse expose exactement `webhookPath` ; pour Tailscale Funnel, exécutez `tailscale funnel status` et confirmez que `/webhooks/sms` est répertorié.
- `publicWebhookUrl` utilise le même schéma, hôte, chemin et chaîne de requête que ceux envoyés par Twilio, afin que la validation de la signature puisse reproduire l’URL signée.

`openclaw channels status --channel sms --probe` signale à la fois les paramètres de Webhook Twilio non concordants et les erreurs `11200` récentes.

### Les envois sortants échouent

Confirmez que `accountSid`, `authToken` et soit `fromNumber`, soit `messagingServiceSid` sont résolus. Si vous utilisez un compte d’essai Twilio, le numéro de destination peut devoir être vérifié dans Twilio avant l’envoi de SMS sortants.

### Les messages arrivent, mais l’agent ne répond pas

Vérifiez `dmPolicy` et `allowFrom`. Avec la politique `pairing` par défaut, l’expéditeur doit être approuvé avant le traitement des interactions normales avec l’agent.
