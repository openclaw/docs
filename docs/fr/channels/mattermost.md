---
read_when:
    - Configuration de Mattermost
    - Débogage du routage Mattermost
sidebarTitle: Mattermost
summary: Configuration du bot Mattermost et d’OpenClaw
title: Mattermost
x-i18n:
    generated_at: "2026-06-27T17:11:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 31ed1c6aaffc4b7a61a06c81a516c2dba6c31ebf31e0e922bbba884f8bf2b661
    source_path: channels/mattermost.md
    workflow: 16
---

Statut : plugin téléchargeable (jeton de bot + événements WebSocket). Les canaux, les groupes et les messages directs sont pris en charge. Mattermost est une plateforme de messagerie d’équipe auto-hébergeable ; consultez le site officiel [mattermost.com](https://mattermost.com) pour les détails du produit et les téléchargements.

## Installation

Installez Mattermost avant de configurer le canal :

<Tabs>
  <Tab title="npm registry">
    ```bash
    openclaw plugins install @openclaw/mattermost
    ```
  </Tab>
  <Tab title="Local checkout">
    ```bash
    openclaw plugins install ./path/to/local/mattermost-plugin
    ```
  </Tab>
</Tabs>

Détails : [Plugins](/fr/tools/plugin)

## Configuration rapide

<Steps>
  <Step title="Ensure plugin is available">
    Installez `@openclaw/mattermost` avec la commande ci-dessus, puis redémarrez le Gateway s’il est déjà en cours d’exécution.
  </Step>
  <Step title="Create a Mattermost bot">
    Créez un compte de bot Mattermost et copiez le **jeton de bot**.
  </Step>
  <Step title="Copy the base URL">
    Copiez l’**URL de base** de Mattermost (par exemple, `https://chat.example.com`).
  </Step>
  <Step title="Configure OpenClaw and start the gateway">
    Configuration minimale :

    ```json5
    {
      channels: {
        mattermost: {
          enabled: true,
          botToken: "mm-token",
          baseUrl: "https://chat.example.com",
          dmPolicy: "pairing",
        },
      },
    }
    ```

  </Step>
</Steps>

## Commandes slash natives

Les commandes slash natives sont optionnelles. Lorsqu’elles sont activées, OpenClaw enregistre les commandes slash `oc_*` via l’API Mattermost et reçoit les POST de rappel sur le serveur HTTP du Gateway.

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Use when Mattermost cannot reach the gateway directly (reverse proxy/public URL).
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Behavior notes">
    - `native: "auto"` est désactivé par défaut pour Mattermost. Définissez `native: true` pour l’activer.
    - Si `callbackUrl` est omis, OpenClaw en déduit un à partir de l’hôte/du port du Gateway + `callbackPath`.
    - Pour les configurations multicomptes, `commands` peut être défini au niveau supérieur ou sous `channels.mattermost.accounts.<id>.commands` (les valeurs du compte remplacent les champs de niveau supérieur).
    - Les rappels de commande sont validés avec les jetons par commande renvoyés par Mattermost lorsqu’OpenClaw enregistre les commandes `oc_*`.
    - OpenClaw actualise l’enregistrement actuel des commandes Mattermost avant d’accepter chaque rappel afin que les anciens jetons provenant de commandes slash supprimées ou régénérées cessent d’être acceptés sans redémarrage du Gateway.
    - La validation du rappel échoue en mode fermé si l’API Mattermost ne peut pas confirmer que la commande est toujours actuelle ; les échecs de validation sont brièvement mis en cache, les recherches concurrentes sont fusionnées, et les nouveaux démarrages de recherche sont limités en débit par commande pour borner la pression de rejeu.
    - Les rappels slash échouent en mode fermé lorsque l’enregistrement a échoué, que le démarrage a été partiel, ou que le jeton de rappel ne correspond pas au jeton enregistré de la commande résolue (un jeton valide pour une commande ne peut pas atteindre la validation amont pour une commande différente).

  </Accordion>
  <Accordion title="Reachability requirement">
    Le point de terminaison de rappel doit être joignable depuis le serveur Mattermost.

    - Ne définissez pas `callbackUrl` sur `localhost` sauf si Mattermost s’exécute dans le même hôte/espace de noms réseau qu’OpenClaw.
    - Ne définissez pas `callbackUrl` sur votre URL de base Mattermost sauf si cette URL utilise un proxy inverse pour `/api/channels/mattermost/command` vers OpenClaw.
    - Une vérification rapide est `curl https://<gateway-host>/api/channels/mattermost/command` ; une requête GET doit renvoyer `405 Method Not Allowed` depuis OpenClaw, et non `404`.

  </Accordion>
  <Accordion title="Mattermost egress allowlist">
    Si votre rappel cible des adresses privées/tailnet/internes, définissez `ServiceSettings.AllowedUntrustedInternalConnections` de Mattermost pour inclure l’hôte/le domaine du rappel.

    Utilisez des entrées d’hôte/de domaine, pas des URL complètes.

    - Bon : `gateway.tailnet-name.ts.net`
    - Mauvais : `https://gateway.tailnet-name.ts.net`

  </Accordion>
</AccordionGroup>

## Variables d’environnement (compte par défaut)

Définissez-les sur l’hôte du Gateway si vous préférez les variables d’environnement :

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

<Note>
Les variables d’environnement ne s’appliquent qu’au compte **par défaut** (`default`). Les autres comptes doivent utiliser des valeurs de configuration.

`MATTERMOST_URL` ne peut pas être défini depuis un fichier `.env` d’espace de travail ; voir [Fichiers `.env` d’espace de travail](/fr/gateway/security).
</Note>

## Modes de chat

Mattermost répond automatiquement aux messages directs. Le comportement dans les canaux est contrôlé par `chatmode` :

<Tabs>
  <Tab title="oncall (default)">
    Répondre uniquement lorsqu’il est @mentionné dans les canaux.
  </Tab>
  <Tab title="onmessage">
    Répondre à chaque message de canal.
  </Tab>
  <Tab title="onchar">
    Répondre lorsqu’un message commence par un préfixe déclencheur.
  </Tab>
</Tabs>

Exemple de configuration :

```json5
{
  channels: {
    mattermost: {
      chatmode: "onchar",
      oncharPrefixes: [">", "!"],
    },
  },
}
```

Remarques :

- `onchar` répond tout de même aux @mentions explicites.
- `channels.mattermost.requireMention` est respecté pour les configurations héritées, mais `chatmode` est préférable.
- Après que le bot a envoyé une réponse visible dans un fil de canal, les messages ultérieurs dans ce même fil reçoivent une réponse sans nouvelle @mention ni préfixe `onchar`, ce qui permet aux conversations de fil à plusieurs tours de continuer. La participation est mémorisée pendant 7 jours d’inactivité du fil (actualisée à chaque réponse) et persiste après les redémarrages du Gateway. Les fils que le bot a seulement observés ne sont pas affectés ; commencez un nouveau message de premier niveau pour exiger à nouveau une mention explicite.

## Fils et sessions

Utilisez `channels.mattermost.replyToMode` pour contrôler si les réponses de canal et de groupe restent dans le canal principal ou démarrent un fil sous le message déclencheur.

- `off` (par défaut) : répondre dans un fil uniquement lorsque le message entrant est déjà dans un fil.
- `first` : pour les messages de canal/groupe de premier niveau, démarrer un fil sous ce message et acheminer la conversation vers une session limitée au fil.
- `all` : même comportement que `first` pour Mattermost aujourd’hui.
- Les messages directs ignorent ce paramètre et restent non filés.

Exemple de configuration :

```json5
{
  channels: {
    mattermost: {
      replyToMode: "all",
    },
  },
}
```

Notes :

- Les sessions limitées au fil utilisent l’identifiant de la publication déclencheuse comme racine du fil.
- `first` et `all` sont actuellement équivalents, car une fois que Mattermost dispose d’une racine de fil, les fragments suivants et les médias continuent dans ce même fil.

## Contrôle d’accès (DM)

- Par défaut : `channels.mattermost.dmPolicy = "pairing"` (les expéditeurs inconnus reçoivent un code d’appairage).
- Approuver via :
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- DM publics : `channels.mattermost.dmPolicy="open"` plus `channels.mattermost.allowFrom=["*"]`.
- `channels.mattermost.allowFrom` accepte les entrées `accessGroup:<name>`. Voir [Groupes d’accès](/fr/channels/access-groups).

## Canaux (groupes)

- Par défaut : `channels.mattermost.groupPolicy = "allowlist"` (nécessite une mention).
- Autorisez les expéditeurs avec `channels.mattermost.groupAllowFrom` (identifiants utilisateur recommandés).
- `channels.mattermost.groupAllowFrom` accepte les entrées `accessGroup:<name>`. Voir [Groupes d’accès](/fr/channels/access-groups).
- Les remplacements de mention par canal se trouvent sous `channels.mattermost.groups.<channelId>.requireMention` ou `channels.mattermost.groups["*"].requireMention` comme valeur par défaut.
- La correspondance `@username` est mutable et activée uniquement lorsque `channels.mattermost.dangerouslyAllowNameMatching: true`.
- Canaux ouverts : `channels.mattermost.groupPolicy="open"` (nécessite une mention).
- Note d’exécution : si `channels.mattermost` est totalement absent, l’exécution revient à `groupPolicy="allowlist"` pour les vérifications de groupe (même si `channels.defaults.groupPolicy` est défini).

Exemple :

```json5
{
  channels: {
    mattermost: {
      groupPolicy: "open",
      groups: {
        "*": { requireMention: true },
        "team-channel-id": { requireMention: false },
      },
    },
  },
}
```

## Cibles pour la distribution sortante

Utilisez ces formats de cible avec `openclaw message send` ou cron/webhooks :

- `channel:<id>` pour un canal
- `user:<id>` pour un DM
- `@username` pour un DM (résolu via l’API Mattermost)

<Warning>
Les identifiants opaques nus (comme `64ifufp...`) sont **ambigus** dans Mattermost (identifiant utilisateur ou identifiant de canal).

OpenClaw les résout **utilisateur d’abord** :

- Si l’identifiant existe en tant qu’utilisateur (`GET /api/v4/users/<id>` réussit), OpenClaw envoie un **DM** en résolvant le canal direct via `/api/v4/channels/direct`.
- Sinon, l’identifiant est traité comme un **identifiant de canal**.

Si vous avez besoin d’un comportement déterministe, utilisez toujours les préfixes explicites (`user:<id>` / `channel:<id>`).
</Warning>

## Nouvelle tentative de canal DM

Quand OpenClaw envoie vers une cible DM Mattermost et doit d’abord résoudre le canal direct, il réessaie par défaut les échecs transitoires de création de canal direct.

Utilisez `channels.mattermost.dmChannelRetry` pour ajuster ce comportement globalement pour le Plugin Mattermost, ou `channels.mattermost.accounts.<id>.dmChannelRetry` pour un compte.

```json5
{
  channels: {
    mattermost: {
      dmChannelRetry: {
        maxRetries: 3,
        initialDelayMs: 1000,
        maxDelayMs: 10000,
        timeoutMs: 30000,
      },
    },
  },
}
```

Notes :

- Cela s’applique uniquement à la création de canal DM (`/api/v4/channels/direct`), pas à chaque appel de l’API Mattermost.
- Les nouvelles tentatives s’appliquent aux échecs transitoires comme les limites de débit, les réponses 5xx et les erreurs réseau ou de délai d’attente.
- Les erreurs client 4xx autres que `429` sont traitées comme permanentes et ne sont pas réessayées.

## Diffusion en continu de l’aperçu

Mattermost diffuse la réflexion, l’activité des outils et le texte de réponse partiel dans une seule **publication d’aperçu brouillon** qui est finalisée sur place lorsque la réponse finale peut être envoyée en toute sécurité. L’aperçu se met à jour sur le même identifiant de publication au lieu de saturer le canal avec des messages par fragment. Les réponses finales de médias ou d’erreurs annulent les modifications d’aperçu en attente et utilisent la distribution normale au lieu d’envoyer une publication d’aperçu jetable.

Activez via `channels.mattermost.streaming` :

```json5
{
  channels: {
    mattermost: {
      streaming: "partial", // off | partial | block | progress
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Modes de diffusion en continu">
    - `partial` est le choix habituel : une publication d’aperçu unique qui est modifiée à mesure que la réponse s’allonge, puis finalisée avec la réponse complète.
    - `block` utilise des fragments de brouillon de style ajout dans la publication d’aperçu.
    - `progress` affiche un aperçu d’état pendant la génération et publie uniquement la réponse finale à la fin.
    - `off` désactive la diffusion en continu de l’aperçu.

  </Accordion>
  <Accordion title="Notes sur le comportement de la diffusion en continu">
    - Si le flux ne peut pas être finalisé sur place (par exemple si la publication a été supprimée pendant le flux), OpenClaw revient à l’envoi d’une nouvelle publication finale afin que la réponse ne soit jamais perdue.
    - Les charges utiles contenant uniquement la réflexion sont supprimées des publications de canal, y compris le texte qui arrive sous forme de citation `> Thinking`. Définissez `/reasoning on` pour voir la réflexion dans d’autres surfaces ; la publication finale Mattermost conserve uniquement la réponse.
    - Voir [Diffusion en continu](/fr/concepts/streaming#preview-streaming-modes) pour la matrice de correspondance des canaux.

  </Accordion>
</AccordionGroup>

## Réactions (outil de message)

- Utilisez `message action=react` avec `channel=mattermost`.
- `messageId` est l’identifiant de publication Mattermost.
- `emoji` accepte des noms comme `thumbsup` ou `:+1:` (les deux-points sont facultatifs).
- Définissez `remove=true` (booléen) pour supprimer une réaction.
- Les événements d’ajout et de suppression de réaction sont transmis comme événements système à la session d’agent routée.

Exemples :

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

Configuration :

- `channels.mattermost.actions.reactions` : activer/désactiver les actions de réaction (par défaut true).
- Remplacement par compte : `channels.mattermost.accounts.<id>.actions.reactions`.

## Boutons interactifs (outil de message)

Envoyez des messages avec des boutons cliquables. Lorsqu’un utilisateur clique sur un bouton, l’agent reçoit la sélection et peut répondre.

Les réponses normales de l’agent peuvent aussi inclure des charges utiles sémantiques `presentation`. OpenClaw affiche les boutons de valeur comme des boutons interactifs Mattermost, conserve les boutons URL visibles dans le texte du message et rétrograde les menus de sélection en texte lisible.

Activez les boutons en ajoutant `inlineButtons` aux capacités du canal :

```json5
{
  channels: {
    mattermost: {
      capabilities: ["inlineButtons"],
    },
  },
}
```

Utilisez `message action=send` avec un paramètre `buttons`. Les boutons sont un tableau 2D (lignes de boutons) :

```
message action=send channel=mattermost target=channel:<channelId> buttons=[[{"text":"Yes","callback_data":"yes"},{"text":"No","callback_data":"no"}]]
```

Champs des boutons :

<ParamField path="text" type="string" required>
  Libellé d’affichage.
</ParamField>
<ParamField path="callback_data" type="string" required>
  Valeur renvoyée au clic (utilisée comme ID d’action).
</ParamField>
<ParamField path="style" type='"default" | "primary" | "danger"'>
  Style du bouton.
</ParamField>

Lorsqu’un utilisateur clique sur un bouton :

<Steps>
  <Step title="Buttons replaced with confirmation">
    Tous les boutons sont remplacés par une ligne de confirmation (par exemple, « ✓ **Yes** sélectionné par @user »).
  </Step>
  <Step title="Agent receives the selection">
    L’agent reçoit la sélection sous forme de message entrant et répond.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Implementation notes">
    - Les rappels de boutons utilisent une vérification HMAC-SHA256 (automatique, aucune configuration nécessaire).
    - Mattermost supprime les données de rappel de ses réponses d’API (fonction de sécurité), donc tous les boutons sont supprimés au clic - la suppression partielle n’est pas possible.
    - Les ID d’action contenant des traits d’union ou des tirets bas sont assainis automatiquement (limitation du routage Mattermost).

  </Accordion>
  <Accordion title="Config and reachability">
    - `channels.mattermost.capabilities` : tableau de chaînes de capacités. Ajoutez `"inlineButtons"` pour activer la description de l’outil de boutons dans l’invite système de l’agent.
    - `channels.mattermost.interactions.callbackBaseUrl` : URL de base externe facultative pour les rappels de boutons (par exemple `https://gateway.example.com`). Utilisez-la lorsque Mattermost ne peut pas atteindre directement le Gateway sur son hôte de liaison.
    - Dans les configurations à plusieurs comptes, vous pouvez aussi définir le même champ sous `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl`.
    - Si `interactions.callbackBaseUrl` est omis, OpenClaw déduit l’URL de rappel depuis `gateway.customBindHost` + `gateway.port`, puis se replie sur `http://localhost:<port>`.
    - Règle d’accessibilité : l’URL de rappel du bouton doit être accessible depuis le serveur Mattermost. `localhost` ne fonctionne que lorsque Mattermost et OpenClaw s’exécutent sur le même hôte/espace de noms réseau.
    - Si votre cible de rappel est privée/tailnet/interne, ajoutez son hôte/domaine à `ServiceSettings.AllowedUntrustedInternalConnections` de Mattermost.

  </Accordion>
</AccordionGroup>

### Intégration API directe (scripts externes)

Les scripts externes et les webhooks peuvent publier des boutons directement via l’API REST Mattermost au lieu de passer par l’outil `message` de l’agent. Utilisez `buildButtonAttachments()` depuis le plugin lorsque c’est possible ; si vous publiez du JSON brut, suivez ces règles :

**Structure de la charge utile :**

```json5
{
  channel_id: "<channelId>",
  message: "Choose an option:",
  props: {
    attachments: [
      {
        actions: [
          {
            id: "mybutton01", // alphanumeric only - see below
            type: "button", // required, or clicks are silently ignored
            name: "Approve", // display label
            style: "primary", // optional: "default", "primary", "danger"
            integration: {
              url: "https://gateway.example.com/mattermost/interactions/default",
              context: {
                action_id: "mybutton01", // must match button id (for name lookup)
                action: "approve",
                // ... any custom fields ...
                _token: "<hmac>", // see HMAC section below
              },
            },
          },
        ],
      },
    ],
  },
}
```

<Warning>
**Règles critiques**

1. Les pièces jointes vont dans `props.attachments`, pas dans des `attachments` de premier niveau (ignorées silencieusement).
2. Chaque action a besoin de `type: "button"` - sans cela, les clics sont avalés silencieusement.
3. Chaque action a besoin d’un champ `id` - Mattermost ignore les actions sans ID.
4. L’`id` d’action doit être **alphanumérique uniquement** (`[a-zA-Z0-9]`). Les traits d’union et les tirets bas cassent le routage d’action côté serveur de Mattermost (renvoie 404). Supprimez-les avant utilisation.
5. `context.action_id` doit correspondre à l’`id` du bouton afin que le message de confirmation affiche le nom du bouton (par exemple, « Approve ») au lieu d’un ID brut.
6. `context.action_id` est requis - le gestionnaire d’interaction renvoie 400 sans lui.

</Warning>

**Génération du jeton HMAC**

Le Gateway vérifie les clics sur les boutons avec HMAC-SHA256. Les scripts externes doivent générer des jetons qui correspondent à la logique de vérification du Gateway :

<Steps>
  <Step title="Derive the secret from the bot token">
    `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
  </Step>
  <Step title="Build the context object">
    Construisez l’objet de contexte avec tous les champs **sauf** `_token`.
  </Step>
  <Step title="Serialize with sorted keys">
    Sérialisez avec des **clés triées** et **sans espaces** (le Gateway utilise `JSON.stringify` avec des clés triées, ce qui produit une sortie compacte).
  </Step>
  <Step title="Sign the payload">
    `HMAC-SHA256(key=secret, data=serializedContext)`
  </Step>
  <Step title="Add the token">
    Ajoutez le condensat hexadécimal obtenu comme `_token` dans le contexte.
  </Step>
</Steps>

Exemple Python :

```python
import hmac, hashlib, json

secret = hmac.new(
    b"openclaw-mattermost-interactions",
    bot_token.encode(), hashlib.sha256
).hexdigest()

ctx = {"action_id": "mybutton01", "action": "approve"}
payload = json.dumps(ctx, sort_keys=True, separators=(",", ":"))
token = hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()

context = {**ctx, "_token": token}
```

<AccordionGroup>
  <Accordion title="Common HMAC pitfalls">
    - `json.dumps` de Python ajoute des espaces par défaut (`{"key": "val"}`). Utilisez `separators=(",", ":")` pour correspondre à la sortie compacte de JavaScript (`{"key":"val"}`).
    - Signez toujours **tous** les champs de contexte (moins `_token`). Le Gateway supprime `_token` puis signe tout ce qui reste. Signer un sous-ensemble provoque un échec silencieux de la vérification.
    - Utilisez `sort_keys=True` - le Gateway trie les clés avant de signer, et Mattermost peut réordonner les champs de contexte lors du stockage de la charge utile.
    - Dérivez le secret depuis le jeton du bot (déterministe), pas depuis des octets aléatoires. Le secret doit être identique entre le processus qui crée les boutons et le Gateway qui vérifie.

  </Accordion>
</AccordionGroup>

## Adaptateur d’annuaire

Le plugin Mattermost inclut un adaptateur d’annuaire qui résout les noms de canaux et d’utilisateurs via l’API Mattermost. Cela active les cibles `#channel-name` et `@username` dans `openclaw message send` et les livraisons Cron/Webhook.

Aucune configuration n’est nécessaire - l’adaptateur utilise le jeton du bot depuis la configuration du compte.

## Plusieurs comptes

Mattermost prend en charge plusieurs comptes sous `channels.mattermost.accounts` :

```json5
{
  channels: {
    mattermost: {
      accounts: {
        default: { name: "Primary", botToken: "mm-token", baseUrl: "https://chat.example.com" },
        alerts: { name: "Alerts", botToken: "mm-token-2", baseUrl: "https://alerts.example.com" },
      },
    },
  },
}
```

## Dépannage

<AccordionGroup>
  <Accordion title="No replies in channels">
    Assurez-vous que le bot est dans le canal et mentionnez-le (oncall), utilisez un préfixe déclencheur (onchar), ou définissez `chatmode: "onmessage"`.
  </Accordion>
  <Accordion title="Auth or multi-account errors">
    - Vérifiez le jeton du bot, l’URL de base et si le compte est activé.
    - Problèmes liés aux comptes multiples : les variables d’environnement ne s’appliquent qu’au compte `default`.

  </Accordion>
  <Accordion title="Native slash commands fail">
    - `Unauthorized: invalid command token.` : OpenClaw n’a pas accepté le jeton de rappel. Causes typiques :
      - l’enregistrement de la commande slash a échoué ou ne s’est terminé que partiellement au démarrage
      - le rappel atteint le mauvais Gateway/compte
      - Mattermost a encore d’anciennes commandes pointant vers une cible de rappel précédente
      - le Gateway a redémarré sans réactiver les commandes slash
    - Si les commandes slash natives cessent de fonctionner, vérifiez les journaux pour `mattermost: failed to register slash commands` ou `mattermost: native slash commands enabled but no commands could be registered`.
    - Si `callbackUrl` est omis et que les journaux avertissent que le rappel a été résolu en `http://127.0.0.1:18789/...`, cette URL n’est probablement accessible que lorsque Mattermost s’exécute sur le même hôte/espace de noms réseau qu’OpenClaw. Définissez plutôt un `commands.callbackUrl` explicite et accessible de l’extérieur.

  </Accordion>
  <Accordion title="Buttons issues">
    - Les boutons apparaissent comme des boîtes blanches : l’agent envoie peut-être des données de bouton mal formées. Vérifiez que chaque bouton possède à la fois les champs `text` et `callback_data`.
    - Les boutons s’affichent, mais les clics ne font rien : vérifiez que `AllowedUntrustedInternalConnections` dans la configuration du serveur Mattermost inclut `127.0.0.1 localhost`, et que `EnablePostActionIntegration` vaut `true` dans ServiceSettings.
    - Les boutons renvoient 404 au clic : l’`id` du bouton contient probablement des traits d’union ou des tirets bas. Le routeur d’action de Mattermost casse avec des ID non alphanumériques. Utilisez uniquement `[a-zA-Z0-9]`.
    - Les journaux du Gateway affichent `invalid _token` : incompatibilité HMAC. Vérifiez que vous signez tous les champs de contexte (pas un sous-ensemble), utilisez des clés triées et du JSON compact (sans espaces). Consultez la section HMAC ci-dessus.
    - Les journaux du Gateway affichent `missing _token in context` : le champ `_token` n’est pas dans le contexte du bouton. Assurez-vous qu’il est inclus lors de la création de la charge utile d’intégration.
    - La confirmation affiche un ID brut au lieu du nom du bouton : `context.action_id` ne correspond pas à l’`id` du bouton. Définissez les deux sur la même valeur assainie.
    - L’agent ne connaît pas les boutons : ajoutez `capabilities: ["inlineButtons"]` à la configuration du canal Mattermost.

  </Accordion>
</AccordionGroup>

## Connexe

- [Routage des canaux](/fr/channels/channel-routing) - routage de session pour les messages
- [Vue d’ensemble des canaux](/fr/channels) - tous les canaux pris en charge
- [Groupes](/fr/channels/groups) - comportement des discussions de groupe et contrôle par mention
- [Appairage](/fr/channels/pairing) - authentification par DM et flux d’appairage
- [Sécurité](/fr/gateway/security) - modèle d’accès et renforcement
