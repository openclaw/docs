---
read_when:
    - Vous voulez connecter OpenClaw aux SMS via Twilio
    - Vous devez configurer un webhook SMS ou une liste d’autorisation
summary: Configuration du canal SMS Twilio, des contrôles d’accès et du webhook
title: SMS
x-i18n:
    generated_at: "2026-06-27T17:12:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0c384fa3374450aa3facc749791b5d59165d9daf0920ea5438ad412522166f52
    source_path: channels/sms.md
    workflow: 16
---

OpenClaw peut recevoir et envoyer des SMS via un numéro de téléphone Twilio ou un service de messagerie. Le Gateway enregistre une route de Webhook entrant, valide les signatures de requête Twilio par défaut et renvoie les réponses via l’API Messages de Twilio.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/fr/channels/pairing">
    La politique de messages directs par défaut pour les SMS est l’appairage.
  </Card>
  <Card title="Gateway security" icon="shield" href="/fr/gateway/security">
    Examinez l’exposition du Webhook et les contrôles d’accès des expéditeurs.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/fr/channels/troubleshooting">
    Diagnostics intercanaux et procédures de réparation.
  </Card>
</CardGroup>

## Avant de commencer

Vous avez besoin de :

- Le Plugin SMS officiel installé avec `openclaw plugins install @openclaw/sms`.
- Un compte Twilio avec un numéro de téléphone compatible SMS, ou un service de messagerie Twilio.
- Le SID de compte Twilio et le jeton d’authentification.
- Une URL HTTPS publique qui atteint votre Gateway OpenClaw.
- Un choix de politique d’expéditeur : `pairing` pour un usage privé, `allowlist` pour les numéros de téléphone préapprouvés, ou `open` uniquement pour un accès SMS volontairement public.

Utilisez un seul numéro Twilio pour les SMS et les appels vocaux si le numéro dispose des deux capacités. Configurez séparément le Webhook SMS et le Webhook vocal dans Twilio ; cette page couvre uniquement le Webhook SMS.

## Configuration rapide

<Steps>
  <Step title="Installer le plugin">
    ```bash
    openclaw plugins install @openclaw/sms
    ```
  </Step>
  <Step title="Créer ou choisir un expéditeur Twilio">
    Dans Twilio, ouvrez **Numéros de téléphone > Gérer > Numéros actifs** et choisissez un numéro compatible SMS. Enregistrez :

    - SID du compte, par exemple `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
    - Jeton d’authentification
    - Numéro de téléphone expéditeur, par exemple `+15551234567`

    Si vous utilisez un service de messagerie plutôt qu’un numéro d’expéditeur fixe, enregistrez le SID du service de messagerie, par exemple `MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`.

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

  <Step title="Pointer Twilio vers le Webhook du Gateway">
    Dans les paramètres du numéro de téléphone Twilio, ouvrez **Messagerie** et définissez **Un message arrive** sur :

```text
https://gateway.example.com/webhooks/sms
```

    Utilisez HTTP `POST`. Le chemin local par défaut est `/webhooks/sms` ; modifiez `channels.sms.webhookPath` si vous avez besoin d’une route différente.

  </Step>

  <Step title="Exposer le chemin exact du Webhook SMS">
    Votre URL publique doit router le chemin SMS vers le processus Gateway. Si vous utilisez Tailscale Funnel pour les tests locaux, exposez explicitement `/webhooks/sms` :

```bash
tailscale funnel --bg --set-path /webhooks/sms http://127.0.0.1:<gateway-port>/webhooks/sms
tailscale funnel status
```

    Les appels vocaux et les SMS utilisent des chemins de Webhook distincts. Si le même numéro Twilio gère les deux, conservez les deux routes configurées dans Twilio et dans votre tunnel.

  </Step>

  <Step title="Démarrer le Gateway et approuver le premier expéditeur">

```bash
openclaw gateway
```

Envoyez un SMS au numéro Twilio. Le premier message crée une demande d’appairage. Approuvez-la :

```bash
openclaw pairing list sms
openclaw pairing approve sms <CODE>
```

    Les codes d’appairage expirent après 1 heure.

  </Step>
</Steps>

## Exemples de configuration

### Fichier de configuration

Utilisez la configuration par fichier lorsque vous voulez que la définition du canal soit transportée avec la configuration du Gateway :

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

Utilisez la configuration par variables d’environnement pour les déploiements à compte unique où les secrets proviennent de l’environnement hôte :

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

`TWILIO_SMS_FROM` est accepté comme alias de `TWILIO_PHONE_NUMBER`. Utilisez `TWILIO_MESSAGING_SERVICE_SID` au lieu d’un expéditeur par numéro de téléphone lorsque Twilio doit choisir l’expéditeur à partir d’un service de messagerie.

### Jeton d’authentification SecretRef

`authToken` peut être une SecretRef. Utilisez ceci lorsque le Gateway doit résoudre le jeton d’authentification Twilio depuis l’environnement d’exécution des secrets OpenClaw au lieu de stocker la configuration en texte clair :

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

### Numéro privé uniquement sur liste d’autorisation

Utilisez `allowlist` lorsque seuls des numéros de téléphone connus doivent pouvoir parler à l’agent :

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

### Expéditeur via service de messagerie

Utilisez `messagingServiceSid` au lieu de `fromNumber` lorsque Twilio doit choisir l’expéditeur via un service de messagerie :

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

Si `fromNumber` et `messagingServiceSid` sont tous deux présents après la résolution de la configuration et des variables d’environnement, `fromNumber` est utilisé.

### Cible sortante par défaut

Définissez `defaultTo` lorsque l’automatisation ou la livraison initiée par l’agent doit avoir une destination par défaut si un flux d’envoi omet une cible explicite :

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

- `pairing` (par défaut)
- `allowlist` (nécessite au moins un expéditeur dans `allowFrom`)
- `open` (nécessite que `allowFrom` inclue `"*"`)
- `disabled`

Les entrées `allowFrom` doivent être des numéros de téléphone E.164 comme `+15551234567`. Les préfixes `sms:` sont acceptés et normalisés. Pour un assistant privé, privilégiez `dmPolicy: "allowlist"` avec des numéros de téléphone explicites.

## Envoyer des SMS

Les cibles SMS sortantes utilisent le préfixe de service `sms:` avec le canal SMS sélectionné :

```bash
openclaw message send --channel sms --target sms:+15551234567 --message "hello"
```

Lorsque la sélection du canal est implicite, `twilio-sms:+15551234567` sélectionne ce canal sans prendre le contrôle du préfixe de service `sms:` existant, détenu par le canal et utilisé par iMessage.

```bash
openclaw message send --target twilio-sms:+15551234567 --message "hello"
```

La CLI nécessite un `--target` explicite. `defaultTo` est destiné aux chemins d’automatisation et de livraison initiée par l’agent où la cible peut être résolue depuis la configuration du canal.

Les réponses de l’agent issues de conversations SMS entrantes retournent automatiquement à l’expéditeur via l’expéditeur Twilio configuré.

La sortie SMS est du texte brut. OpenClaw supprime le markdown, aplatit les blocs de code clôturés, préserve les liens lisibles et découpe les longues réponses avant de les envoyer via Twilio.

## Vérifier la configuration

Après le démarrage du Gateway :

1. Confirmez que le journal du Gateway affiche la route du Webhook SMS.
2. Exécutez une sonde côté Twilio :

```bash
openclaw channels capabilities --channel sms
openclaw channels status --channel sms --probe --json
```

3. Envoyez un SMS au numéro Twilio depuis votre téléphone.
4. Exécutez `openclaw pairing list sms`.
5. Approuvez le code d’appairage avec `openclaw pairing approve sms <CODE>`.
6. Envoyez un autre SMS et confirmez que l’agent répond.

Pour les tests sortants uniquement, utilisez :

```bash
openclaw message send --channel sms --target sms:+15557654321 --message "OpenClaw SMS test"
```

### Test de bout en bout depuis macOS iMessage/SMS

Sur un Mac capable d’envoyer des SMS opérateur via Messages, vous pouvez utiliser `imsg` pour piloter le côté expéditeur sans toucher à votre téléphone :

```bash
imsg send --to "+15551234567" --service sms --text "OpenClaw SMS E2E $(date -u +%Y%m%dT%H%M%SZ)" --json
openclaw pairing list sms
openclaw pairing approve sms <CODE>
imsg send --to "+15551234567" --service sms --text "reply exactly SMS pong" --json
```

Le premier message doit créer une demande d’appairage. Le second message doit recevoir la réponse de l’agent via Twilio.

## Sécurité du Webhook

Par défaut, OpenClaw valide `X-Twilio-Signature` à l’aide de `publicWebhookUrl` et `authToken`. Gardez `publicWebhookUrl` aligné octet pour octet avec l’URL configurée dans Twilio, y compris le schéma, l’hôte, le chemin et la chaîne de requête.

Pour les tests de tunnel local uniquement, vous pouvez définir :

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

## Configuration multi-comptes

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

Chaque compte doit utiliser un `webhookPath` distinct.

## Dépannage

### Twilio renvoie 403 ou OpenClaw rejette le Webhook

Vérifiez que `publicWebhookUrl` correspond exactement à l’URL configurée dans Twilio, y compris le schéma, l’hôte, le chemin et la chaîne de requête. Twilio signe la chaîne d’URL publique ; les réécritures de proxy et les noms d’hôte alternatifs peuvent donc casser la validation de signature.

### Aucune demande d’appairage n’apparaît

Vérifiez l’URL et la méthode du Webhook **Messagerie** du numéro Twilio. Il doit pointer vers l’URL du Webhook SMS et utiliser `POST`. Confirmez également que le Gateway est accessible depuis Internet public ou via votre tunnel.

Si le journal des messages Twilio affiche l’erreur `11200`, Twilio a accepté le SMS entrant mais n’a pas pu atteindre votre Webhook. Vérifiez :

- **Messagerie > Un message arrive** dans Twilio pointe vers `publicWebhookUrl`.
- La méthode est `POST`.
- Le tunnel ou le proxy inverse expose le `webhookPath` exact ; pour Tailscale Funnel, exécutez `tailscale funnel status` et confirmez que `/webhooks/sms` est répertorié.
- `publicWebhookUrl` utilise les mêmes schéma, hôte, chemin et chaîne de requête que ceux envoyés par Twilio, afin que la validation de signature puisse reproduire l’URL signée.

### Les envois sortants échouent

Confirmez que `accountSid`, `authToken`, et soit `fromNumber` soit `messagingServiceSid` sont résolus. Si vous utilisez un compte Twilio d’essai, le numéro de destination devra peut-être être vérifié dans Twilio avant que les SMS sortants puissent être envoyés.

### Les messages arrivent mais l’agent ne répond pas

Vérifiez `dmPolicy` et `allowFrom`. Avec la stratégie `pairing` par défaut, l’expéditeur doit être approuvé avant que les tours d’agent normaux soient traités.
