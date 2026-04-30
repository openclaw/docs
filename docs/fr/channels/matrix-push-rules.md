---
read_when:
    - Configurer le streaming silencieux Matrix pour Synapse ou Tuwunel auto-hébergé
    - Les utilisateurs veulent des notifications uniquement pour les blocs terminés, pas à chaque modification d’aperçu.
summary: Règles de push Matrix par destinataire pour les modifications silencieuses des aperçus finalisés
title: Règles de notifications push de Matrix pour les aperçus silencieux
x-i18n:
    generated_at: "2026-04-30T07:13:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: e2f037a50a85b350163c74cf6b9cce335ecaaa5cccc762124122ad6d0321a1fa
    source_path: channels/matrix-push-rules.md
    workflow: 16
---

Lorsque `channels.matrix.streaming` vaut `"quiet"`, OpenClaw modifie un seul événement de prévisualisation sur place et marque la modification finalisée avec un indicateur de contenu personnalisé. Les clients Matrix n’envoient une notification sur la modification finale que si une règle push par utilisateur correspond à cet indicateur. Cette page s’adresse aux opérateurs qui auto-hébergent Matrix et veulent installer cette règle pour chaque compte destinataire.

Si vous voulez seulement le comportement de notification Matrix standard, utilisez `streaming: "partial"` ou laissez le streaming désactivé. Consultez [Configuration du canal Matrix](/fr/channels/matrix#streaming-previews).

## Prérequis

- utilisateur destinataire = la personne qui doit recevoir la notification
- utilisateur bot = le compte Matrix OpenClaw qui envoie la réponse
- utilisez le jeton d’accès de l’utilisateur destinataire pour les appels d’API ci-dessous
- faites correspondre `sender` dans la règle push au MXID complet de l’utilisateur bot
- le compte destinataire doit déjà avoir des pushers fonctionnels — les règles de prévisualisation silencieuse ne fonctionnent que lorsque la distribution push Matrix normale est saine

## Étapes

<Steps>
  <Step title="Configurer les prévisualisations silencieuses">

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
    Réutilisez un jeton de session client existant lorsque c’est possible. Pour en créer un nouveau :

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

Si aucun pusher n’est renvoyé, corrigez la distribution push Matrix normale pour ce compte avant de continuer.

  </Step>

  <Step title="Installer la règle push de remplacement">
    OpenClaw marque les modifications de prévisualisation finalisées contenant uniquement du texte avec `content["com.openclaw.finalized_preview"] = true`. Installez une règle qui correspond à ce marqueur ainsi qu’au MXID du bot comme expéditeur :

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

    Remplacez avant l’exécution :

    - `https://matrix.example.org` : l’URL de base de votre serveur d’accueil
    - `$USER_ACCESS_TOKEN` : le jeton d’accès de l’utilisateur destinataire
    - `openclaw-finalized-preview-botname` : un ID de règle unique par bot et par destinataire (motif : `openclaw-finalized-preview-<botname>`)
    - `@bot:example.org` : le MXID de votre bot OpenClaw, pas celui du destinataire

  </Step>

  <Step title="Vérifier">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

Testez ensuite une réponse diffusée en streaming. En mode silencieux, le salon affiche un brouillon de prévisualisation silencieux et envoie une notification une fois le bloc ou le tour terminé.

  </Step>
</Steps>

Pour supprimer la règle ultérieurement, envoyez `DELETE` sur la même URL de règle avec le jeton du destinataire.

## Notes multi-bots

Les règles push sont indexées par `ruleId` : réexécuter `PUT` sur le même ID met à jour une seule règle. Pour plusieurs bots OpenClaw notifiant le même destinataire, créez une règle par bot avec une correspondance d’expéditeur distincte.

Les nouvelles règles `override` définies par l’utilisateur sont insérées avant les règles de suppression par défaut, donc aucun paramètre d’ordre supplémentaire n’est nécessaire. La règle ne concerne que les modifications de prévisualisation contenant uniquement du texte qui peuvent être finalisées sur place ; les fallbacks de médias et les fallbacks de prévisualisation obsolète utilisent la distribution Matrix normale.

## Notes sur le serveur d’accueil

<AccordionGroup>
  <Accordion title="Synapse">
    Aucune modification spéciale de `homeserver.yaml` n’est requise. Si les notifications Matrix normales atteignent déjà cet utilisateur, le jeton du destinataire et l’appel `pushrules` ci-dessus constituent l’étape de configuration principale.

    Si vous exécutez Synapse derrière un proxy inverse ou des workers, assurez-vous que `/_matrix/client/.../pushrules/` atteint correctement Synapse. La distribution push est gérée par le processus principal ou par `synapse.app.pusher` / les workers pusher configurés — assurez-vous qu’ils sont sains.

    La règle utilise la condition de règle push `event_property_is` (MSC3758, règle push v1.10), ajoutée à Synapse en 2023. Les anciennes versions de Synapse acceptent l’appel `PUT pushrules/...`, mais la condition ne correspond silencieusement jamais — mettez Synapse à niveau si aucune notification n’arrive sur une modification de prévisualisation finalisée.

  </Accordion>

  <Accordion title="Tuwunel">
    Même flux que Synapse ; aucune configuration propre à Tuwunel n’est nécessaire pour le marqueur de prévisualisation finalisée.

    Si les notifications disparaissent alors que l’utilisateur est actif sur un autre appareil, vérifiez si `suppress_push_when_active` est activé. Tuwunel a ajouté cette option dans la version 1.4.2 (septembre 2025), et elle peut supprimer volontairement les notifications push vers d’autres appareils lorsqu’un appareil est actif.

  </Accordion>
</AccordionGroup>

## Connexe

- [Configuration du canal Matrix](/fr/channels/matrix)
- [Concepts de streaming](/fr/concepts/streaming)
