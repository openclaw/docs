---
read_when:
    - Configuration de Mattermost
    - Débogage du routage Mattermost
sidebarTitle: Mattermost
summary: Configuration du bot Mattermost et d’OpenClaw
title: Mattermost
x-i18n:
    generated_at: "2026-04-30T07:13:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1926a1d7347ff35ed60f8d5c3e0b26a064863ada213ad0e171776af5a84d8475
    source_path: channels/mattermost.md
    workflow: 16
---

Statut : Plugin inclus (jeton de bot + événements WebSocket). Les canaux, les groupes et les DM sont pris en charge. Mattermost est une plateforme de messagerie d’équipe auto-hébergeable ; consultez le site officiel sur [mattermost.com](https://mattermost.com) pour les détails du produit et les téléchargements.

## Plugin inclus

<Note>
Mattermost est fourni comme Plugin inclus dans les versions actuelles d’OpenClaw ; les builds packagés normaux ne nécessitent donc pas d’installation séparée.
</Note>

Si vous utilisez un build plus ancien ou une installation personnalisée qui exclut Mattermost, installez un package npm actuel lorsqu’il est publié :

<Tabs>
  <Tab title="Registre npm">
    ```bash
    openclaw plugins install @openclaw/mattermost
    ```
  </Tab>
  <Tab title="Checkout local">
    ```bash
    openclaw plugins install ./path/to/local/mattermost-plugin
    ```
  </Tab>
</Tabs>

Si npm signale que le package appartenant à OpenClaw est obsolète, utilisez un build
OpenClaw packagé actuel ou le chemin du checkout local jusqu’à ce qu’un package npm plus récent soit
publié.

Détails : [Plugins](/fr/tools/plugin)

## Configuration rapide

<Steps>
  <Step title="Vérifier que le Plugin est disponible">
    Les versions OpenClaw packagées actuelles l’incluent déjà. Les installations plus anciennes/personnalisées peuvent l’ajouter manuellement avec les commandes ci-dessus.
  </Step>
  <Step title="Créer un bot Mattermost">
    Créez un compte de bot Mattermost et copiez le **jeton de bot**.
  </Step>
  <Step title="Copier l’URL de base">
    Copiez l’**URL de base** Mattermost (par exemple, `https://chat.example.com`).
  </Step>
  <Step title="Configurer OpenClaw et démarrer le Gateway">
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

Les commandes slash natives sont facultatives. Lorsqu’elles sont activées, OpenClaw enregistre des commandes slash `oc_*` via l’API Mattermost et reçoit les callbacks POST sur le serveur HTTP du Gateway.

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
  <Accordion title="Notes de comportement">
    - `native: "auto"` est désactivé par défaut pour Mattermost. Définissez `native: true` pour l’activer.
    - Si `callbackUrl` est omis, OpenClaw en déduit un à partir de l’hôte/du port du Gateway + `callbackPath`.
    - Pour les configurations multi-comptes, `commands` peut être défini au niveau supérieur ou sous `channels.mattermost.accounts.<id>.commands` (les valeurs du compte remplacent les champs de niveau supérieur).
    - Les callbacks de commandes sont validés avec les jetons par commande retournés par Mattermost lorsque OpenClaw enregistre les commandes `oc_*`.
    - Les callbacks slash échouent de manière fermée lorsque l’enregistrement a échoué, que le démarrage était partiel ou que le jeton de callback ne correspond à aucune des commandes enregistrées.

  </Accordion>
  <Accordion title="Exigence d’accessibilité">
    Le point de terminaison de callback doit être accessible depuis le serveur Mattermost.

    - Ne définissez pas `callbackUrl` sur `localhost` sauf si Mattermost s’exécute sur le même hôte/espace de noms réseau qu’OpenClaw.
    - Ne définissez pas `callbackUrl` sur votre URL de base Mattermost sauf si cette URL reverse-proxy `/api/channels/mattermost/command` vers OpenClaw.
    - Une vérification rapide est `curl https://<gateway-host>/api/channels/mattermost/command` ; un GET doit retourner `405 Method Not Allowed` depuis OpenClaw, et non `404`.

  </Accordion>
  <Accordion title="Allowlist de sortie Mattermost">
    Si votre callback cible des adresses privées/tailnet/internes, définissez `ServiceSettings.AllowedUntrustedInternalConnections` de Mattermost pour inclure l’hôte/domaine du callback.

    Utilisez des entrées d’hôte/domaine, pas des URL complètes.

    - Bon : `gateway.tailnet-name.ts.net`
    - Mauvais : `https://gateway.tailnet-name.ts.net`

  </Accordion>
</AccordionGroup>

## Variables d’environnement (compte par défaut)

Définissez-les sur l’hôte du Gateway si vous préférez les variables d’environnement :

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

<Note>
Les variables d’environnement s’appliquent uniquement au compte **par défaut** (`default`). Les autres comptes doivent utiliser des valeurs de configuration.

`MATTERMOST_URL` ne peut pas être défini depuis un `.env` d’espace de travail ; consultez [Fichiers `.env` d’espace de travail](/fr/gateway/security).
</Note>

## Modes de discussion

Mattermost répond automatiquement aux DM. Le comportement des canaux est contrôlé par `chatmode` :

<Tabs>
  <Tab title="oncall (par défaut)">
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

Notes :

- `onchar` répond toujours aux @mentions explicites.
- `channels.mattermost.requireMention` est pris en charge pour les anciennes configurations, mais `chatmode` est recommandé.

## Threads et sessions

Utilisez `channels.mattermost.replyToMode` pour contrôler si les réponses dans les canaux et les groupes restent dans le canal principal ou démarrent un thread sous la publication déclencheuse.

- `off` (par défaut) : répondre dans un thread uniquement lorsque la publication entrante s’y trouve déjà.
- `first` : pour les publications de premier niveau dans un canal/groupe, démarrer un thread sous cette publication et acheminer la conversation vers une session limitée au thread.
- `all` : même comportement que `first` pour Mattermost aujourd’hui.
- Les messages directs ignorent ce paramètre et restent sans thread.

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

- Les sessions limitées au thread utilisent l’id de la publication déclencheuse comme racine du thread.
- `first` et `all` sont actuellement équivalents, car dès que Mattermost dispose d’une racine de thread, les fragments de suivi et les médias continuent dans ce même thread.

## Contrôle d’accès (DM)

- Par défaut : `channels.mattermost.dmPolicy = "pairing"` (les expéditeurs inconnus reçoivent un code d’association).
- Approuver via :
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- DM publics : `channels.mattermost.dmPolicy="open"` plus `channels.mattermost.allowFrom=["*"]`.

## Canaux (groupes)

- Par défaut : `channels.mattermost.groupPolicy = "allowlist"` (soumis à mention).
- Ajoutez les expéditeurs à l’allowlist avec `channels.mattermost.groupAllowFrom` (IDs utilisateur recommandés).
- Les remplacements de mention par canal se trouvent sous `channels.mattermost.groups.<channelId>.requireMention` ou `channels.mattermost.groups["*"].requireMention` pour une valeur par défaut.
- La correspondance `@username` est mutable et activée uniquement lorsque `channels.mattermost.dangerouslyAllowNameMatching: true`.
- Canaux ouverts : `channels.mattermost.groupPolicy="open"` (soumis à mention).
- Note d’exécution : si `channels.mattermost` est complètement absent, l’exécution revient à `groupPolicy="allowlist"` pour les vérifications de groupe (même si `channels.defaults.groupPolicy` est défini).

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

## Cibles pour la livraison sortante

Utilisez ces formats de cible avec `openclaw message send` ou cron/webhooks :

- `channel:<id>` pour un canal
- `user:<id>` pour un DM
- `@username` pour un DM (résolu via l’API Mattermost)

<Warning>
Les IDs opaques nus (comme `64ifufp...`) sont **ambigus** dans Mattermost (ID utilisateur contre ID de canal).

OpenClaw les résout **utilisateur d’abord** :

- Si l’ID existe comme utilisateur (`GET /api/v4/users/<id>` réussit), OpenClaw envoie un **DM** en résolvant le canal direct via `/api/v4/channels/direct`.
- Sinon, l’ID est traité comme un **ID de canal**.

Si vous avez besoin d’un comportement déterministe, utilisez toujours les préfixes explicites (`user:<id>` / `channel:<id>`).
</Warning>

## Nouvelle tentative de canal DM

Quand OpenClaw envoie vers une cible DM Mattermost et doit d’abord résoudre le canal direct, il retente par défaut les échecs transitoires de création du canal direct.

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

- Cela s’applique uniquement à la création de canal DM (`/api/v4/channels/direct`), pas à chaque appel d’API Mattermost.
- Les nouvelles tentatives s’appliquent aux échecs transitoires tels que les limites de débit, les réponses 5xx et les erreurs réseau ou de délai d’expiration.
- Les erreurs client 4xx autres que `429` sont traitées comme permanentes et ne sont pas réessayées.

## Streaming d’aperçu

Mattermost diffuse le raisonnement, l’activité des outils et le texte de réponse partiel dans une seule **publication d’aperçu brouillon** qui est finalisée sur place lorsque la réponse finale peut être envoyée sans risque. L’aperçu se met à jour sur le même id de publication au lieu de spammer le canal avec des messages par fragment. Les finales média/erreur annulent les modifications d’aperçu en attente et utilisent la livraison normale au lieu de vider une publication d’aperçu jetable.

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
  <Accordion title="Modes de streaming">
    - `partial` est le choix habituel : une publication d’aperçu qui est modifiée à mesure que la réponse grandit, puis finalisée avec la réponse complète.
    - `block` utilise des fragments de brouillon de style ajout à l’intérieur de la publication d’aperçu.
    - `progress` affiche un aperçu d’état pendant la génération et ne publie la réponse finale qu’à la fin.
    - `off` désactive le streaming d’aperçu.

  </Accordion>
  <Accordion title="Notes de comportement du streaming">
    - Si le flux ne peut pas être finalisé sur place (par exemple, la publication a été supprimée pendant le flux), OpenClaw revient à l’envoi d’une nouvelle publication finale afin que la réponse ne soit jamais perdue.
    - Les payloads contenant uniquement du raisonnement sont supprimés des publications de canal, y compris le texte qui arrive comme citation `> Reasoning:`. Définissez `/reasoning on` pour voir le raisonnement sur d’autres surfaces ; la publication finale Mattermost conserve uniquement la réponse.
    - Consultez [Streaming](/fr/concepts/streaming#preview-streaming-modes) pour la matrice de correspondance des canaux.

  </Accordion>
</AccordionGroup>

## Réactions (outil de message)

- Utilisez `message action=react` avec `channel=mattermost`.
- `messageId` est l’id de publication Mattermost.
- `emoji` accepte des noms comme `thumbsup` ou `:+1:` (les deux-points sont facultatifs).
- Définissez `remove=true` (booléen) pour supprimer une réaction.
- Les événements d’ajout/suppression de réaction sont transmis comme événements système à la session d’agent acheminée.

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
  Libellé affiché.
</ParamField>
<ParamField path="callback_data" type="string" required>
  Valeur renvoyée au clic (utilisée comme ID d’action).
</ParamField>
<ParamField path="style" type='"default" | "primary" | "danger"'>
  Style de bouton.
</ParamField>

Lorsqu’un utilisateur clique sur un bouton :

<Steps>
  <Step title="Boutons remplacés par une confirmation">
    Tous les boutons sont remplacés par une ligne de confirmation (par exemple, "✓ **Yes** selected by @user").
  </Step>
  <Step title="L’agent reçoit la sélection">
    L’agent reçoit la sélection sous forme de message entrant et répond.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Notes d’implémentation">
    - Les callbacks des boutons utilisent une vérification HMAC-SHA256 (automatique, aucune configuration requise).
    - Mattermost supprime les données de callback de ses réponses d’API (fonctionnalité de sécurité), donc tous les boutons sont supprimés au clic — la suppression partielle n’est pas possible.
    - Les identifiants d’action contenant des traits d’union ou des underscores sont assainis automatiquement (limitation du routage Mattermost).

  </Accordion>
  <Accordion title="Configuration et accessibilité">
    - `channels.mattermost.capabilities` : tableau de chaînes de capacités. Ajoutez `"inlineButtons"` pour activer la description de l’outil de boutons dans le prompt système de l’agent.
    - `channels.mattermost.interactions.callbackBaseUrl` : URL de base externe facultative pour les callbacks de boutons (par exemple `https://gateway.example.com`). Utilisez-la lorsque Mattermost ne peut pas atteindre le gateway directement à son hôte de liaison.
    - Dans les configurations multi-comptes, vous pouvez aussi définir le même champ sous `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl`.
    - Si `interactions.callbackBaseUrl` est omis, OpenClaw déduit l’URL de callback à partir de `gateway.customBindHost` + `gateway.port`, puis se rabat sur `http://localhost:<port>`.
    - Règle d’accessibilité : l’URL de callback du bouton doit être accessible depuis le serveur Mattermost. `localhost` fonctionne uniquement lorsque Mattermost et OpenClaw s’exécutent sur le même hôte/espace de noms réseau.
    - Si votre cible de callback est privée/tailnet/interne, ajoutez son hôte/domaine à `ServiceSettings.AllowedUntrustedInternalConnections` de Mattermost.

  </Accordion>
</AccordionGroup>

### Intégration directe de l’API (scripts externes)

Les scripts externes et les webhooks peuvent publier des boutons directement via l’API REST Mattermost au lieu de passer par l’outil `message` de l’agent. Utilisez `buildButtonAttachments()` depuis le Plugin lorsque c’est possible ; si vous publiez du JSON brut, suivez ces règles :

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
            id: "mybutton01", // alphanumeric only — see below
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

1. Les pièces jointes vont dans `props.attachments`, pas dans `attachments` au niveau racine (ignoré silencieusement).
2. Chaque action nécessite `type: "button"` — sans cela, les clics sont absorbés silencieusement.
3. Chaque action nécessite un champ `id` — Mattermost ignore les actions sans identifiant.
4. L’`id` de l’action doit être **uniquement alphanumérique** (`[a-zA-Z0-9]`). Les traits d’union et les underscores cassent le routage d’action côté serveur de Mattermost (renvoie 404). Supprimez-les avant utilisation.
5. `context.action_id` doit correspondre à l’`id` du bouton pour que le message de confirmation affiche le nom du bouton (par exemple, "Approve") au lieu d’un identifiant brut.
6. `context.action_id` est requis — le gestionnaire d’interaction renvoie 400 sans lui.

</Warning>

**Génération du jeton HMAC**

Le gateway vérifie les clics sur les boutons avec HMAC-SHA256. Les scripts externes doivent générer des jetons qui correspondent à la logique de vérification du gateway :

<Steps>
  <Step title="Dériver le secret à partir du jeton du bot">
    `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`
  </Step>
  <Step title="Construire l’objet de contexte">
    Construisez l’objet de contexte avec tous les champs **sauf** `_token`.
  </Step>
  <Step title="Sérialiser avec des clés triées">
    Sérialisez avec des **clés triées** et **sans espaces** (le gateway utilise `JSON.stringify` avec des clés triées, ce qui produit une sortie compacte).
  </Step>
  <Step title="Signer la charge utile">
    `HMAC-SHA256(key=secret, data=serializedContext)`
  </Step>
  <Step title="Ajouter le jeton">
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
  <Accordion title="Pièges HMAC courants">
    - `json.dumps` de Python ajoute des espaces par défaut (`{"key": "val"}`). Utilisez `separators=(",", ":")` pour correspondre à la sortie compacte de JavaScript (`{"key":"val"}`).
    - Signez toujours **tous** les champs du contexte (moins `_token`). Le gateway supprime `_token`, puis signe tout ce qui reste. Signer un sous-ensemble provoque un échec silencieux de la vérification.
    - Utilisez `sort_keys=True` — le gateway trie les clés avant de signer, et Mattermost peut réordonner les champs de contexte lors du stockage de la charge utile.
    - Dérivez le secret à partir du jeton du bot (déterministe), et non d’octets aléatoires. Le secret doit être le même entre le processus qui crée les boutons et le gateway qui vérifie.

  </Accordion>
</AccordionGroup>

## Adaptateur d’annuaire

Le Plugin Mattermost inclut un adaptateur d’annuaire qui résout les noms de canaux et d’utilisateurs via l’API Mattermost. Cela active les cibles `#channel-name` et `@username` dans `openclaw message send` et les livraisons cron/webhook.

Aucune configuration n’est nécessaire — l’adaptateur utilise le jeton du bot provenant de la configuration du compte.

## Multi-compte

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
  <Accordion title="Aucune réponse dans les canaux">
    Assurez-vous que le bot est dans le canal et mentionnez-le (oncall), utilisez un préfixe déclencheur (onchar) ou définissez `chatmode: "onmessage"`.
  </Accordion>
  <Accordion title="Erreurs d’authentification ou de multi-compte">
    - Vérifiez le jeton du bot, l’URL de base et si le compte est activé.
    - Problèmes multi-comptes : les variables d’environnement ne s’appliquent qu’au compte `default`.

  </Accordion>
  <Accordion title="Les commandes slash natives échouent">
    - `Unauthorized: invalid command token.` : OpenClaw n’a pas accepté le jeton de callback. Causes typiques :
      - l’enregistrement de la commande slash a échoué ou ne s’est terminé que partiellement au démarrage
      - le callback atteint le mauvais gateway/compte
      - Mattermost possède encore d’anciennes commandes pointant vers une cible de callback précédente
      - le gateway a redémarré sans réactiver les commandes slash
    - Si les commandes slash natives cessent de fonctionner, recherchez dans les journaux `mattermost: failed to register slash commands` ou `mattermost: native slash commands enabled but no commands could be registered`.
    - Si `callbackUrl` est omis et que les journaux avertissent que le callback s’est résolu en `http://127.0.0.1:18789/...`, cette URL n’est probablement accessible que lorsque Mattermost s’exécute sur le même hôte/espace de noms réseau qu’OpenClaw. Définissez plutôt un `commands.callbackUrl` explicite accessible de l’extérieur.

  </Accordion>
  <Accordion title="Problèmes de boutons">
    - Les boutons apparaissent comme des boîtes blanches : l’agent envoie peut-être des données de bouton mal formées. Vérifiez que chaque bouton possède à la fois les champs `text` et `callback_data`.
    - Les boutons s’affichent mais les clics ne font rien : vérifiez que `AllowedUntrustedInternalConnections` dans la configuration du serveur Mattermost inclut `127.0.0.1 localhost`, et que `EnablePostActionIntegration` est `true` dans ServiceSettings.
    - Les boutons renvoient 404 au clic : l’`id` du bouton contient probablement des traits d’union ou des underscores. Le routeur d’actions de Mattermost casse sur les identifiants non alphanumériques. Utilisez uniquement `[a-zA-Z0-9]`.
    - Les journaux du Gateway indiquent `invalid _token` : incompatibilité HMAC. Vérifiez que vous signez tous les champs de contexte (pas un sous-ensemble), utilisez des clés triées et du JSON compact (sans espaces). Consultez la section HMAC ci-dessus.
    - Les journaux du Gateway indiquent `missing _token in context` : le champ `_token` n’est pas dans le contexte du bouton. Assurez-vous qu’il est inclus lors de la construction de la charge utile d’intégration.
    - La confirmation affiche un identifiant brut au lieu du nom du bouton : `context.action_id` ne correspond pas à l’`id` du bouton. Définissez les deux sur la même valeur assainie.
    - L’agent ne connaît pas les boutons : ajoutez `capabilities: ["inlineButtons"]` à la configuration du canal Mattermost.

  </Accordion>
</AccordionGroup>

## Associés

- [Routage des canaux](/fr/channels/channel-routing) — routage de session pour les messages
- [Vue d’ensemble des canaux](/fr/channels) — tous les canaux pris en charge
- [Groupes](/fr/channels/groups) — comportement des discussions de groupe et filtrage par mention
- [Appairage](/fr/channels/pairing) — authentification par message direct et flux d’appairage
- [Sécurité](/fr/gateway/security) — modèle d’accès et durcissement
