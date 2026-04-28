---
read_when:
    - Configurer Mattermost
    - Déboguer le routage Mattermost
sidebarTitle: Mattermost
summary: Configuration du bot Mattermost et d’OpenClaw
title: Mattermost
x-i18n:
    generated_at: "2026-04-26T11:23:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 22916fcff2eeccf53055f2ebf60fc621d595991d0ca4cd148015b61cce09c52f
    source_path: channels/mattermost.md
    workflow: 15
---

Statut : plugin intégré (bot token + événements WebSocket). Les canaux, groupes et messages privés sont pris en charge. Mattermost est une plateforme de messagerie d’équipe auto-hébergeable ; consultez le site officiel à [mattermost.com](https://mattermost.com) pour les détails du produit et les téléchargements.

## Plugin intégré

<Note>
Mattermost est livré comme plugin intégré dans les versions actuelles d’OpenClaw, donc les builds packagés normaux n’ont pas besoin d’une installation séparée.
</Note>

Si vous utilisez une build plus ancienne ou une installation personnalisée qui exclut Mattermost, installez-le manuellement :

<Tabs>
  <Tab title="registre npm">
    ```bash
    openclaw plugins install @openclaw/mattermost
    ```
  </Tab>
  <Tab title="checkout local">
    ```bash
    openclaw plugins install ./path/to/local/mattermost-plugin
    ```
  </Tab>
</Tabs>

Détails : [Plugins](/fr/tools/plugin)

## Configuration rapide

<Steps>
  <Step title="Vérifier que le plugin est disponible">
    Les versions packagées actuelles d’OpenClaw l’intègrent déjà. Les installations anciennes/personnalisées peuvent l’ajouter manuellement avec les commandes ci-dessus.
  </Step>
  <Step title="Créer un bot Mattermost">
    Créez un compte bot Mattermost et copiez le **bot token**.
  </Step>
  <Step title="Copier l’URL de base">
    Copiez l’**URL de base** Mattermost (par ex. `https://chat.example.com`).
  </Step>
  <Step title="Configurer OpenClaw et démarrer la gateway">
    Configuration minimale :

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

Les commandes slash natives sont facultatives. Lorsqu’elles sont activées, OpenClaw enregistre les commandes slash `oc_*` via l’API Mattermost et reçoit des POST de rappel sur le serveur HTTP de la gateway.

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // À utiliser lorsque Mattermost ne peut pas joindre directement la gateway (proxy inverse/URL publique).
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Notes de comportement">
    - `native: "auto"` est désactivé par défaut pour Mattermost. Définissez `native: true` pour l’activer.
    - Si `callbackUrl` est omis, OpenClaw en dérive un à partir de l’hôte/port de la gateway + `callbackPath`.
    - Pour les configurations multi-comptes, `commands` peut être défini au niveau supérieur ou sous `channels.mattermost.accounts.<id>.commands` (les valeurs de compte remplacent les champs de niveau supérieur).
    - Les rappels de commandes sont validés avec les tokens par commande renvoyés par Mattermost lorsque OpenClaw enregistre les commandes `oc_*`.
    - Les rappels slash échouent de manière fermée lorsque l’enregistrement a échoué, que le démarrage a été partiel ou que le token de rappel ne correspond à aucune des commandes enregistrées.

  </Accordion>
  <Accordion title="Exigence d’accessibilité">
    Le point de terminaison de rappel doit être accessible depuis le serveur Mattermost.

    - Ne définissez pas `callbackUrl` sur `localhost` sauf si Mattermost s’exécute sur le même hôte/espace de noms réseau qu’OpenClaw.
    - Ne définissez pas `callbackUrl` sur votre URL de base Mattermost sauf si cette URL reverse-proxy `/api/channels/mattermost/command` vers OpenClaw.
    - Une vérification rapide consiste à exécuter `curl https://<gateway-host>/api/channels/mattermost/command` ; une requête GET doit renvoyer `405 Method Not Allowed` depuis OpenClaw, et non `404`.

  </Accordion>
  <Accordion title="Liste d’autorisation sortante Mattermost">
    Si votre rappel cible des adresses privées/tailnet/internes, définissez `ServiceSettings.AllowedUntrustedInternalConnections` de Mattermost pour inclure l’hôte/domaine du rappel.

    Utilisez des entrées hôte/domaine, pas des URL complètes.

    - Bon : `gateway.tailnet-name.ts.net`
    - Mauvais : `https://gateway.tailnet-name.ts.net`

  </Accordion>
</AccordionGroup>

## Variables d’environnement (compte par défaut)

Définissez-les sur l’hôte de la gateway si vous préférez utiliser des variables d’environnement :

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

<Note>
Les variables d’environnement s’appliquent uniquement au compte **par défaut** (`default`). Les autres comptes doivent utiliser des valeurs de configuration.

`MATTERMOST_URL` ne peut pas être défini à partir d’un `.env` d’espace de travail ; voir [fichiers `.env` d’espace de travail](/fr/gateway/security).
</Note>

## Modes de chat

Mattermost répond automatiquement aux messages privés. Le comportement dans les canaux est contrôlé par `chatmode` :

<Tabs>
  <Tab title="oncall (par défaut)">
    Répond uniquement lorsqu’il est @mentionné dans les canaux.
  </Tab>
  <Tab title="onmessage">
    Répond à chaque message de canal.
  </Tab>
  <Tab title="onchar">
    Répond lorsqu’un message commence par un préfixe de déclenchement.
  </Tab>
</Tabs>

Exemple de configuration :

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

Remarques :

- `onchar` répond toujours aux @mentions explicites.
- `channels.mattermost.requireMention` est respecté pour les configurations héritées, mais `chatmode` est préférable.

## Fils et sessions

Utilisez `channels.mattermost.replyToMode` pour contrôler si les réponses dans les canaux et groupes restent dans le canal principal ou démarrent un fil sous le post déclencheur.

- `off` (par défaut) : répondre dans un fil uniquement si le post entrant est déjà dans un fil.
- `first` : pour les posts de niveau supérieur dans les canaux/groupes, démarrer un fil sous ce post et acheminer la conversation vers une session à portée de fil.
- `all` : même comportement que `first` pour Mattermost aujourd’hui.
- Les messages privés ignorent ce paramètre et restent hors fil.

Exemple de configuration :

```json5
{
  channels: {
    mattermost: {
      replyToMode: "all",
    },
  },
}
```

Remarques :

- Les sessions à portée de fil utilisent l’identifiant du post déclencheur comme racine du fil.
- `first` et `all` sont actuellement équivalents car une fois qu’il existe une racine de fil dans Mattermost, les morceaux de suivi et les médias continuent dans ce même fil.

## Contrôle d’accès (messages privés)

- Par défaut : `channels.mattermost.dmPolicy = "pairing"` (les expéditeurs inconnus reçoivent un code d’appairage).
- Approuver via :
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- Messages privés publics : `channels.mattermost.dmPolicy="open"` plus `channels.mattermost.allowFrom=["*"]`.

## Canaux (groupes)

- Par défaut : `channels.mattermost.groupPolicy = "allowlist"` (protégé par mention).
- Autorisez des expéditeurs avec `channels.mattermost.groupAllowFrom` (identifiants utilisateur recommandés).
- Les remplacements de mention par canal se trouvent sous `channels.mattermost.groups.<channelId>.requireMention` ou `channels.mattermost.groups["*"].requireMention` pour une valeur par défaut.
- La correspondance `@username` est mutable et activée uniquement lorsque `channels.mattermost.dangerouslyAllowNameMatching: true`.
- Canaux ouverts : `channels.mattermost.groupPolicy="open"` (protégé par mention).
- Note d’exécution : si `channels.mattermost` est complètement absent, l’exécution revient à `groupPolicy="allowlist"` pour les vérifications de groupe (même si `channels.defaults.groupPolicy` est défini).

Exemple :

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

## Cibles pour la livraison sortante

Utilisez ces formats de cible avec `openclaw message send` ou Cron/Webhooks :

- `channel:<id>` pour un canal
- `user:<id>` pour un message privé
- `@username` pour un message privé (résolu via l’API Mattermost)

<Warning>
Les identifiants opaques nus (comme `64ifufp...`) sont **ambiguës** dans Mattermost (identifiant utilisateur vs identifiant de canal).

OpenClaw les résout **utilisateur d’abord** :

- Si l’identifiant existe comme utilisateur (`GET /api/v4/users/<id>` réussit), OpenClaw envoie un **message privé** en résolvant le canal direct via `/api/v4/channels/direct`.
- Sinon, l’identifiant est traité comme un **identifiant de canal**.

Si vous avez besoin d’un comportement déterministe, utilisez toujours les préfixes explicites (`user:<id>` / `channel:<id>`).
</Warning>

## Nouvelle tentative de canal DM

Lorsqu’OpenClaw envoie vers une cible de message privé Mattermost et doit d’abord résoudre le canal direct, il réessaie par défaut en cas d’échec transitoire de création du canal direct.

Utilisez `channels.mattermost.dmChannelRetry` pour ajuster ce comportement globalement pour le plugin Mattermost, ou `channels.mattermost.accounts.<id>.dmChannelRetry` pour un compte donné.

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

Remarques :

- Cela s’applique uniquement à la création de canal DM (`/api/v4/channels/direct`), pas à tous les appels API Mattermost.
- Les nouvelles tentatives s’appliquent aux échecs transitoires comme les limitations de débit, les réponses 5xx et les erreurs réseau ou de délai d’attente.
- Les erreurs client 4xx autres que `429` sont considérées comme permanentes et ne font pas l’objet de nouvelles tentatives.

## Diffusion d’aperçu

Mattermost diffuse la réflexion, l’activité des outils et le texte partiel de la réponse dans un seul **post d’aperçu brouillon** qui se finalise sur place lorsque la réponse finale peut être envoyée sans risque. L’aperçu se met à jour sur le même identifiant de post au lieu d’inonder le canal avec des messages par morceau. Les réponses finales média/erreur annulent les modifications d’aperçu en attente et utilisent la livraison normale au lieu de vider un post d’aperçu jetable.

Activez avec `channels.mattermost.streaming` :

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
  <Accordion title="Modes de diffusion">
    - `partial` est le choix habituel : un post d’aperçu unique qui est modifié à mesure que la réponse grandit, puis finalisé avec la réponse complète.
    - `block` utilise des morceaux de brouillon de style ajout dans le post d’aperçu.
    - `progress` affiche un aperçu d’état pendant la génération et ne publie la réponse finale qu’à la fin.
    - `off` désactive la diffusion d’aperçu.

  </Accordion>
  <Accordion title="Remarques sur le comportement de diffusion">
    - Si le flux ne peut pas être finalisé sur place (par exemple si le post a été supprimé en cours de flux), OpenClaw revient à l’envoi d’un nouveau post final afin que la réponse ne soit jamais perdue.
    - Les charges utiles contenant uniquement le raisonnement sont supprimées des posts de canal, y compris le texte qui arrive sous forme de blocquote `> Reasoning:`. Définissez `/reasoning on` pour voir la réflexion sur d’autres surfaces ; le post final Mattermost ne conserve que la réponse.
    - Voir [Streaming](/fr/concepts/streaming#preview-streaming-modes) pour la matrice de correspondance des canaux.

  </Accordion>
</AccordionGroup>

## Réactions (outil de message)

- Utilisez `message action=react` avec `channel=mattermost`.
- `messageId` est l’identifiant du post Mattermost.
- `emoji` accepte des noms comme `thumbsup` ou `:+1:` (les deux-points sont facultatifs).
- Définissez `remove=true` (booléen) pour supprimer une réaction.
- Les événements d’ajout/suppression de réaction sont transmis comme événements système à la session d’agent acheminée.

Exemples :

```
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

Configuration :

- `channels.mattermost.actions.reactions` : activer/désactiver les actions de réaction (true par défaut).
- Remplacement par compte : `channels.mattermost.accounts.<id>.actions.reactions`.

## Boutons interactifs (outil de message)

Envoyez des messages avec des boutons cliquables. Lorsqu’un utilisateur clique sur un bouton, l’agent reçoit la sélection et peut répondre.

Activez les boutons en ajoutant `inlineButtons` aux capacités du canal :

```json5
{
  channels: {
    mattermost: {
      capabilities: ["inlineButtons"],
    },
  },
}
```

Utilisez `message action=send` avec un paramètre `buttons`. Les boutons sont un tableau 2D (lignes de boutons) :

```
message action=send channel=mattermost target=channel:<channelId> buttons=[[{"text":"Yes","callback_data":"yes"},{"text":"No","callback_data":"no"}]]
```

Champs des boutons :

<ParamField path="text" type="string" required>
  Libellé affiché.
</ParamField>
<ParamField path="callback_data" type="string" required>
  Valeur renvoyée au clic (utilisée comme identifiant d’action).
</ParamField>
<ParamField path="style" type='"default" | "primary" | "danger"'>
  Style du bouton.
</ParamField>

Lorsqu’un utilisateur clique sur un bouton :

<Steps>
  <Step title="Boutons remplacés par une confirmation">
    Tous les boutons sont remplacés par une ligne de confirmation (par ex. « ✓ **Oui** sélectionné par @utilisateur »).
  </Step>
  <Step title="L’agent reçoit la sélection">
    L’agent reçoit la sélection comme message entrant et répond.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Notes d’implémentation">
    - Les rappels de boutons utilisent une vérification HMAC-SHA256 (automatique, aucune configuration requise).
    - Mattermost supprime les données de rappel de ses réponses API (fonction de sécurité), donc tous les boutons sont retirés au clic — une suppression partielle n’est pas possible.
    - Les identifiants d’action contenant des tirets ou des underscores sont nettoyés automatiquement (limitation du routage Mattermost).

  </Accordion>
  <Accordion title="Configuration et accessibilité">
    - `channels.mattermost.capabilities` : tableau de chaînes de capacités. Ajoutez `"inlineButtons"` pour activer la description de l’outil de boutons dans le prompt système de l’agent.
    - `channels.mattermost.interactions.callbackBaseUrl` : URL de base externe facultative pour les rappels de boutons (par exemple `https://gateway.example.com`). Utilisez-la lorsque Mattermost ne peut pas joindre directement la gateway sur son hôte de liaison.
    - Dans les configurations multi-comptes, vous pouvez également définir le même champ sous `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl`.
    - Si `interactions.callbackBaseUrl` est omis, OpenClaw dérive l’URL de rappel à partir de `gateway.customBindHost` + `gateway.port`, puis revient à `http://localhost:<port>`.
    - Règle d’accessibilité : l’URL de rappel des boutons doit être accessible depuis le serveur Mattermost. `localhost` ne fonctionne que lorsque Mattermost et OpenClaw s’exécutent sur le même hôte/espace de noms réseau.
    - Si votre cible de rappel est privée/tailnet/interne, ajoutez son hôte/domaine à `ServiceSettings.AllowedUntrustedInternalConnections` de Mattermost.

  </Accordion>
</AccordionGroup>

### Intégration API directe (scripts externes)

Les scripts externes et Webhooks peuvent publier des boutons directement via l’API REST Mattermost au lieu de passer par l’outil `message` de l’agent. Utilisez `buildButtonAttachments()` du plugin lorsque c’est possible ; si vous publiez du JSON brut, suivez ces règles :

**Structure de charge utile :**

```json5
{
  channel_id: "<channelId>",
  message: "Choose an option:",
  props: {
    attachments: [
      {
        actions: [
          {
            id: "mybutton01", // alphanumérique uniquement — voir ci-dessous
            type: "button", // requis, sinon les clics sont ignorés silencieusement
            name: "Approve", // libellé affiché
            style: "primary", // facultatif : "default", "primary", "danger"
            integration: {
              url: "https://gateway.example.com/mattermost/interactions/default",
              context: {
                action_id: "mybutton01", // doit correspondre à l’id du bouton (pour la résolution du nom)
                action: "approve",
                // ... tout champ personnalisé ...
                _token: "<hmac>", // voir la section HMAC ci-dessous
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

1. Les pièces jointes vont dans `props.attachments`, pas dans `attachments` au niveau supérieur (ignoré silencieusement).
2. Chaque action doit avoir `type: "button"` — sans cela, les clics sont absorbés silencieusement.
3. Chaque action doit avoir un champ `id` — Mattermost ignore les actions sans ID.
4. L’`id` d’action doit être **strictement alphanumérique** (`[a-zA-Z0-9]`). Les tirets et underscores cassent le routage des actions côté serveur de Mattermost (renvoie 404). Supprimez-les avant utilisation.
5. `context.action_id` doit correspondre à l’`id` du bouton afin que le message de confirmation affiche le nom du bouton (par ex. « Approve ») au lieu d’un ID brut.
6. `context.action_id` est requis — le gestionnaire d’interaction renvoie 400 sans lui.
</Warning>

**Génération du token HMAC**

La gateway vérifie les clics sur les boutons avec HMAC-SHA256. Les scripts externes doivent générer des tokens correspondant à la logique de vérification de la gateway :

<Steps>
  <Step title="Dériver le secret à partir du bot token">
    `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
  </Step>
  <Step title="Construire l’objet context">
    Construisez l’objet context avec tous les champs **sauf** `_token`.
  </Step>
  <Step title="Sérialiser avec des clés triées">
    Sérialisez avec des **clés triées** et **sans espaces** (la gateway utilise `JSON.stringify` avec des clés triées, ce qui produit une sortie compacte).
  </Step>
  <Step title="Signer la charge utile">
    `HMAC-SHA256(key=secret, data=serializedContext)`
  </Step>
  <Step title="Ajouter le token">
    Ajoutez le condensé hexadécimal obtenu comme `_token` dans le context.
  </Step>
</Steps>

Exemple Python :

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
  <Accordion title="Pièges HMAC courants">
    - `json.dumps` de Python ajoute des espaces par défaut (`{"key": "val"}`). Utilisez `separators=(",", ":")` pour correspondre à la sortie compacte de JavaScript (`{"key":"val"}`).
    - Signez toujours **tous** les champs du context (moins `_token`). La gateway supprime `_token`, puis signe tout le reste. Signer un sous-ensemble provoque un échec de vérification silencieux.
    - Utilisez `sort_keys=True` — la gateway trie les clés avant la signature, et Mattermost peut réordonner les champs du context lors du stockage de la charge utile.
    - Dérivez le secret à partir du bot token (déterministe), et non à partir d’octets aléatoires. Le secret doit être identique dans le processus qui crée les boutons et dans la gateway qui les vérifie.

  </Accordion>
</AccordionGroup>

## Adaptateur d’annuaire

Le plugin Mattermost inclut un adaptateur d’annuaire qui résout les noms de canaux et d’utilisateurs via l’API Mattermost. Cela active les cibles `#channel-name` et `@username` dans `openclaw message send` et les livraisons Cron/Webhooks.

Aucune configuration n’est nécessaire — l’adaptateur utilise le bot token de la configuration du compte.

## Multi-comptes

Mattermost prend en charge plusieurs comptes sous `channels.mattermost.accounts` :

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
  <Accordion title="Aucune réponse dans les canaux">
    Assurez-vous que le bot est dans le canal et mentionnez-le (oncall), utilisez un préfixe de déclenchement (onchar), ou définissez `chatmode: "onmessage"`.
  </Accordion>
  <Accordion title="Erreurs d’authentification ou de multi-comptes">
    - Vérifiez le bot token, l’URL de base et si le compte est activé.
    - Problèmes multi-comptes : les variables d’environnement ne s’appliquent qu’au compte `default`.

  </Accordion>
  <Accordion title="Les commandes slash natives échouent">
    - `Unauthorized: invalid command token.` : OpenClaw n’a pas accepté le token de rappel. Causes typiques :
      - l’enregistrement des commandes slash a échoué ou ne s’est terminé que partiellement au démarrage
      - le rappel atteint la mauvaise gateway/le mauvais compte
      - Mattermost a encore d’anciennes commandes pointant vers une cible de rappel précédente
      - la gateway a redémarré sans réactiver les commandes slash
    - Si les commandes slash natives cessent de fonctionner, vérifiez les journaux pour `mattermost: failed to register slash commands` ou `mattermost: native slash commands enabled but no commands could be registered`.
    - Si `callbackUrl` est omis et que les journaux avertissent que le rappel a été résolu en `http://127.0.0.1:18789/...`, cette URL n’est probablement accessible que lorsque Mattermost s’exécute sur le même hôte/espace de noms réseau qu’OpenClaw. Définissez à la place un `commands.callbackUrl` explicite et accessible de l’extérieur.

  </Accordion>
  <Accordion title="Problèmes de boutons">
    - Les boutons apparaissent comme des blocs blancs : l’agent envoie peut-être des données de bouton mal formées. Vérifiez que chaque bouton comporte bien les champs `text` et `callback_data`.
    - Les boutons s’affichent mais les clics ne font rien : vérifiez que `AllowedUntrustedInternalConnections` dans la configuration du serveur Mattermost inclut `127.0.0.1 localhost`, et que `EnablePostActionIntegration` est `true` dans ServiceSettings.
    - Les boutons renvoient 404 au clic : l’`id` du bouton contient probablement des tirets ou des underscores. Le routeur d’actions de Mattermost ne fonctionne pas avec les ID non alphanumériques. Utilisez uniquement `[a-zA-Z0-9]`.
    - La gateway journalise `invalid _token` : incompatibilité HMAC. Vérifiez que vous signez tous les champs du context (et pas un sous-ensemble), que vous utilisez des clés triées et un JSON compact (sans espaces). Voir la section HMAC ci-dessus.
    - La gateway journalise `missing _token in context` : le champ `_token` n’est pas présent dans le context du bouton. Assurez-vous qu’il est inclus lors de la construction de la charge utile d’intégration.
    - La confirmation affiche l’ID brut au lieu du nom du bouton : `context.action_id` ne correspond pas à l’`id` du bouton. Définissez les deux à la même valeur nettoyée.
    - L’agent ne connaît pas les boutons : ajoutez `capabilities: ["inlineButtons"]` à la configuration du canal Mattermost.

  </Accordion>
</AccordionGroup>

## Lié

- [Routage des canaux](/fr/channels/channel-routing) — routage des sessions pour les messages
- [Vue d’ensemble des canaux](/fr/channels) — tous les canaux pris en charge
- [Groupes](/fr/channels/groups) — comportement des discussions de groupe et protection par mention
- [Appairage](/fr/channels/pairing) — authentification des messages privés et flux d’appairage
- [Sécurité](/fr/gateway/security) — modèle d’accès et durcissement
