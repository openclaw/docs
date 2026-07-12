---
read_when:
    - Configuration de la diffusion silencieuse Matrix pour Synapse ou Tuwunel auto-hébergé
    - Les utilisateurs souhaitent recevoir des notifications uniquement lorsque les blocs sont terminés, et non à chaque modification de l’aperçu
summary: Règles de notification push Matrix par destinataire pour les modifications silencieuses des aperçus finalisés
title: Règles de push Matrix pour des aperçus discrets
x-i18n:
    generated_at: "2026-07-12T15:02:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 3f2260b4cc68f82cbe1aef86b8963b6b40e93f089b31991964fc9282b2c121fb
    source_path: channels/matrix-push-rules.md
    workflow: 16
---

Lorsque `channels.matrix.streaming` est défini sur `"quiet"`, OpenClaw diffuse la réponse en modifiant sur place un seul événement d’aperçu. Les aperçus sont envoyés sous forme d’événements `m.notice` sans notification, et la modification finale est marquée avec `content["com.openclaw.finalized_preview"] = true`. Les clients Matrix n’émettent une notification pour cette modification finale que si une règle de notification push propre à l’utilisateur correspond au marqueur. Cette page s’adresse aux opérateurs qui auto-hébergent Matrix et souhaitent installer cette règle pour chaque compte destinataire.

`streaming: "progress"` finalise ses brouillons par le même chemin ; la même règle se déclenche donc également pour les modifications finalisées en mode progression.

Si vous souhaitez uniquement le comportement de notification standard de Matrix, utilisez `streaming: "partial"` ou désactivez le streaming. Consultez [Configuration du canal Matrix](/fr/channels/matrix#streaming-previews).

## Prérequis

- utilisateur destinataire = la personne qui doit recevoir la notification
- utilisateur bot = le compte Matrix d’OpenClaw qui envoie la réponse
- utilisez le jeton d’accès de l’utilisateur destinataire pour les appels d’API ci-dessous
- faites correspondre `sender` dans la règle de notification push au MXID complet de l’utilisateur bot
- le compte destinataire doit déjà disposer de pushers fonctionnels ; les règles d’aperçu silencieux ne fonctionnent que lorsque la distribution push normale de Matrix est opérationnelle

## Étapes

<Steps>
  <Step title="Configurer les aperçus silencieux">

```json5
{
  channels: {
    matrix: {
      streaming: "quiet",
    },
  },
}
```

  </Step>

  <Step title="Obtenir le jeton d’accès du destinataire">
    Réutilisez si possible le jeton d’une session cliente existante. Pour en créer un nouveau :

```bash
curl -sS -X POST \
  "https://matrix.example.org/_matrix/client/v3/login" \
  -H "Content-Type: application/json" \
  --data '{
    "type": "m.login.password",
    "identifier": { "type": "m.id.user", "user": "@alice:example.org" },
    "password": "REDACTED"
  }'
```

  </Step>

  <Step title="Vérifier que des pushers existent">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushers"
```

Si aucun pusher n’est renvoyé, rétablissez la distribution push normale de Matrix pour ce compte avant de continuer.

  </Step>

  <Step title="Installer la règle de notification push prioritaire">
    Installez une règle qui correspond au marqueur d’aperçu finalisé et au MXID du bot en tant qu’expéditeur :

```bash
curl -sS -X PUT \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname" \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "conditions": [
      { "kind": "event_match", "key": "type", "pattern": "m.room.message" },
      {
        "kind": "event_property_is",
        "key": "content.m\\.relates_to.rel_type",
        "value": "m.replace"
      },
      {
        "kind": "event_property_is",
        "key": "content.com\\.openclaw\\.finalized_preview",
        "value": true
      },
      { "kind": "event_match", "key": "sender", "pattern": "@bot:example.org" }
    ],
    "actions": [
      "notify",
      { "set_tweak": "sound", "value": "default" },
      { "set_tweak": "highlight", "value": false }
    ]
  }'
```

    Remplacez les éléments suivants avant l’exécution :

    - `https://matrix.example.org` : l’URL de base de votre serveur Matrix
    - `$USER_ACCESS_TOKEN` : le jeton d’accès de l’utilisateur destinataire
    - `openclaw-finalized-preview-botname` : un identifiant de règle unique pour chaque bot et chaque destinataire (modèle : `openclaw-finalized-preview-<botname>`)
    - `@bot:example.org` : le MXID de votre bot OpenClaw, et non celui du destinataire

  </Step>

  <Step title="Vérifier">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

Testez ensuite une réponse diffusée en streaming. En mode silencieux, le salon affiche un aperçu silencieux du brouillon et émet une notification lorsque le bloc ou le tour se termine.

  </Step>
</Steps>

Pour supprimer ultérieurement la règle, envoyez une requête `DELETE` à la même URL de règle avec le jeton du destinataire.

## Remarques concernant plusieurs bots

Les règles de notification push sont indexées par `ruleId` : répéter une requête `PUT` avec le même identifiant met à jour une seule règle. Si plusieurs bots OpenClaw envoient des notifications au même destinataire, créez une règle par bot avec une correspondance d’expéditeur distincte.

Les nouvelles règles `override` définies par l’utilisateur sont insérées avant les règles de suppression par défaut du serveur ; aucun paramètre d’ordre supplémentaire n’est donc nécessaire. La règle ne concerne que les modifications d’aperçus textuels pouvant être finalisées sur place ; les réponses multimédias, les mécanismes de repli après expiration de l’aperçu et les textes finaux qui activeraient des mentions Matrix sont distribués comme des messages ordinaires avec notification.

## Remarques concernant le serveur Matrix

<AccordionGroup>
  <Accordion title="Synapse">
    Aucune modification particulière de `homeserver.yaml` n’est nécessaire. Si les notifications Matrix ordinaires parviennent déjà à cet utilisateur, le jeton du destinataire et l’appel à `pushrules` ci-dessus constituent l’étape principale de la configuration.

    Si vous exécutez Synapse derrière un proxy inverse ou avec des workers, vérifiez que `/_matrix/client/.../pushrules/` atteint correctement Synapse. La distribution push est gérée par le processus principal ou par `synapse.app.pusher` / les workers de pusher configurés ; assurez-vous de leur bon fonctionnement.

    La règle utilise la condition de règle de notification push `event_property_is` (MSC3758, règle de notification push v1.10), ajoutée à Synapse en 2023. Les anciennes versions de Synapse acceptent l’appel `PUT pushrules/...`, mais la condition ne correspond jamais et aucun avertissement n’est émis ; mettez Synapse à niveau si aucune notification n’arrive lors de la modification d’un aperçu finalisé.

  </Accordion>

  <Accordion title="Tuwunel">
    Le processus est identique à celui de Synapse ; aucune configuration propre à Tuwunel n’est nécessaire pour le marqueur d’aperçu finalisé.

    Si les notifications disparaissent lorsque l’utilisateur est actif sur un autre appareil, vérifiez si `suppress_push_when_active` est activé. Tuwunel a ajouté cette option dans la version 1.4.2 (septembre 2025) ; elle peut intentionnellement supprimer les notifications push vers les autres appareils lorsqu’un appareil est actif.

  </Accordion>
</AccordionGroup>

## Voir aussi

- [Configuration du canal Matrix](/fr/channels/matrix)
- [Concepts du streaming](/fr/concepts/streaming)
