---
read_when:
    - Configuration de la diffusion silencieuse Matrix pour Synapse ou Tuwunel auto-hébergé
    - Les utilisateurs souhaitent recevoir des notifications uniquement lorsque les blocs sont terminés, et non à chaque modification de l’aperçu
summary: Règles de notification push Matrix par destinataire pour les modifications silencieuses des aperçus finalisés
title: Règles de notification push Matrix pour des aperçus silencieux
x-i18n:
    generated_at: "2026-07-16T12:56:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 1c58e7e796c3ae6d1ee25de229e4592ab8b4fb4d0d50a9cf868ab5ef35b1dab5
    source_path: channels/matrix-push-rules.md
    workflow: 16
---

Lorsque `channels.matrix.streaming.mode` vaut `"quiet"`, OpenClaw diffuse la réponse en modifiant sur place un seul événement d’aperçu. Les aperçus sont envoyés sous forme d’événements `m.notice` sans notification, et la modification finalisée est marquée avec `content["com.openclaw.finalized_preview"] = true`. Les clients Matrix n’émettent une notification pour cette modification finale que si une règle de notification propre à l’utilisateur correspond au marqueur. Cette page s’adresse aux opérateurs qui auto-hébergent Matrix et souhaitent installer cette règle pour chaque compte destinataire.

`streaming.mode: "progress"` finalise ses brouillons par le même chemin ; la même règle se déclenche donc également pour les modifications finalisées en mode progression.

Si vous souhaitez uniquement le comportement de notification Matrix standard, utilisez `streaming.mode: "partial"` ou laissez la diffusion désactivée. Consultez la [configuration du canal Matrix](/fr/channels/matrix#streaming-previews).

## Prérequis

- utilisateur destinataire = la personne qui doit recevoir la notification
- utilisateur bot = le compte Matrix d’OpenClaw qui envoie la réponse
- utilisez le jeton d’accès de l’utilisateur destinataire pour les appels d’API ci-dessous
- faites correspondre `sender` dans la règle de notification au MXID complet de l’utilisateur bot
- le compte destinataire doit déjà disposer de services de notification opérationnels ; les règles d’aperçu silencieux ne fonctionnent que lorsque l’envoi normal des notifications Matrix est opérationnel

## Étapes

<Steps>
  <Step title="Configurer les aperçus silencieux">

```json5
{
  channels: {
    matrix: {
      streaming: { mode: "quiet" },
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

  <Step title="Vérifier l’existence de services de notification">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushers"
```

Si aucun service de notification n’est renvoyé, rétablissez l’envoi normal des notifications Matrix pour ce compte avant de continuer.

  </Step>

  <Step title="Installer la règle de notification prioritaire">
    Installez une règle qui fait correspondre le marqueur d’aperçu finalisé et le MXID du bot en tant qu’expéditeur :

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

    - `https://matrix.example.org` : l’URL de base de votre serveur d’origine
    - `$USER_ACCESS_TOKEN` : le jeton d’accès de l’utilisateur destinataire
    - `openclaw-finalized-preview-botname` : un ID de règle unique pour chaque bot et chaque destinataire (modèle : `openclaw-finalized-preview-<botname>`)
    - `@bot:example.org` : le MXID de votre bot OpenClaw, et non celui du destinataire

  </Step>

  <Step title="Vérifier">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

Testez ensuite une réponse diffusée. En mode silencieux, le salon affiche un aperçu silencieux du brouillon et émet une notification lorsque le bloc ou le tour se termine.

  </Step>
</Steps>

Pour supprimer la règle ultérieurement, envoyez une requête `DELETE` à la même URL de règle avec le jeton du destinataire.

## Remarques sur les configurations à plusieurs bots

Les règles de notification sont indexées par `ruleId` : réexécuter `PUT` avec le même ID met à jour une seule règle. Pour que plusieurs bots OpenClaw notifient le même destinataire, créez une règle par bot avec une correspondance d’expéditeur distincte.

Les nouvelles règles `override` définies par l’utilisateur sont insérées avant les règles de suppression par défaut du serveur ; aucun paramètre d’ordre supplémentaire n’est donc nécessaire. La règle affecte uniquement les modifications d’aperçu ne contenant que du texte qui peuvent être finalisées sur place ; les réponses multimédias, les replis liés aux aperçus obsolètes et les textes finaux qui activeraient les mentions Matrix sont envoyés à la place comme des messages normaux avec notification.

## Remarques sur les serveurs d’origine

<AccordionGroup>
  <Accordion title="Synapse">
    Aucune modification particulière de `homeserver.yaml` n’est requise. Si les notifications Matrix normales parviennent déjà à cet utilisateur, le jeton du destinataire et l’appel `pushrules` ci-dessus constituent l’étape de configuration principale.

    Si vous exécutez Synapse derrière un proxy inverse ou avec des processus workers, assurez-vous que `/_matrix/client/.../pushrules/` atteint correctement Synapse. L’envoi des notifications est géré par le processus principal ou par `synapse.app.pusher` / les workers de notification configurés ; assurez-vous qu’ils sont opérationnels.

    La règle utilise la condition de règle de notification `event_property_is` (MSC3758, règle de notification v1.10), ajoutée à Synapse en 2023. Les anciennes versions de Synapse acceptent l’appel `PUT pushrules/...`, mais la condition ne correspond alors jamais, sans aucun avertissement ; mettez Synapse à niveau si aucune notification n’arrive lors de la modification d’un aperçu finalisé.

  </Accordion>

  <Accordion title="Tuwunel">
    Même procédure que pour Synapse ; aucune configuration propre à Tuwunel n’est nécessaire pour le marqueur d’aperçu finalisé.

    Si les notifications disparaissent lorsque l’utilisateur est actif sur un autre appareil, vérifiez si `suppress_push_when_active` est activé. Tuwunel a ajouté cette option dans la version 1.4.2 (septembre 2025) ; elle peut volontairement supprimer les notifications envoyées aux autres appareils lorsqu’un appareil est actif.

  </Accordion>
</AccordionGroup>

## Voir aussi

- [Configuration du canal Matrix](/fr/channels/matrix)
- [Concepts de diffusion](/fr/concepts/streaming)
