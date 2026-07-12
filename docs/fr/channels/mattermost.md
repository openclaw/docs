---
read_when:
    - Configuration de Mattermost
    - Débogage du routage Mattermost
sidebarTitle: Mattermost
summary: Configuration du bot Mattermost et d’OpenClaw
title: Mattermost
x-i18n:
    generated_at: "2026-07-12T15:05:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 246535ff433a678624d997db640d2531d6ce434ea064a23b98abe8a9e7e6a117
    source_path: channels/mattermost.md
    workflow: 16
---

Statut : plugin téléchargeable (jeton de bot + événements WebSocket). Les canaux, canaux privés, messages privés de groupe et messages privés sont pris en charge. Mattermost est une plateforme de messagerie d’équipe auto-hébergeable ([mattermost.com](https://mattermost.com)).

## Installation

<Tabs>
  <Tab title="registre npm">
    ```bash
    openclaw plugins install @openclaw/mattermost
    ```
  </Tab>
  <Tab title="Copie de travail locale">
    ```bash
    openclaw plugins install ./path/to/local/mattermost-plugin
    ```
  </Tab>
</Tabs>

Détails : [Plugins](/fr/tools/plugin)

## Configuration rapide

<Steps>
  <Step title="Vérifier que le plugin est disponible">
    Installez `@openclaw/mattermost` à l’aide de la commande ci-dessus, puis redémarrez le Gateway s’il est déjà en cours d’exécution.
  </Step>
  <Step title="Créer un bot Mattermost">
    Créez un compte de bot Mattermost, copiez le **jeton du bot** et ajoutez le bot aux équipes et canaux qu’il doit lire.
  </Step>
  <Step title="Copier l’URL de base">
    Copiez l’**URL de base** de Mattermost (par exemple, `https://chat.example.com`). Le suffixe `/api/v4` est automatiquement supprimé.
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

    Autre méthode non interactive :

    ```bash
    openclaw channels add --channel mattermost --bot-token <token> --http-url https://chat.example.com
    ```

  </Step>
</Steps>

<Note>
Mattermost auto-hébergé sur une adresse privée/LAN/tailnet : les requêtes sortantes vers l’API Mattermost passent par une protection SSRF qui bloque par défaut les adresses IP privées et internes. Activez-les avec `channels.mattermost.network.dangerouslyAllowPrivateNetwork: true` (par compte : `channels.mattermost.accounts.<id>.network.dangerouslyAllowPrivateNetwork`).
</Note>

## Commandes slash natives

Les commandes slash natives sont facultatives. Lorsqu’elles sont activées, OpenClaw enregistre des commandes slash `oc_*` dans chaque équipe dont le bot est membre et reçoit les requêtes POST de rappel sur le serveur HTTP du Gateway.

```json5
{
  channels: {
    mattermost: {
      commands: {
        native: true,
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // À utiliser lorsque Mattermost ne peut pas joindre directement le Gateway (proxy inverse/URL publique).
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
    },
  },
}
```

Commandes enregistrées : `/oc_status`, `/oc_model`, `/oc_models`, `/oc_new`, `/oc_help`, `/oc_think`, `/oc_reasoning`, `/oc_verbose`, `/oc_queue`. Avec `nativeSkills: true`, les commandes de Skills sont également enregistrées sous la forme `/oc_<skill>`.

<AccordionGroup>
  <Accordion title="Remarques sur le comportement">
    - `native` et `nativeSkills` utilisent par défaut `"auto"`, ce qui les désactive pour Mattermost. Définissez-les explicitement sur `true`.
    - `callbackPath` utilise par défaut `/api/channels/mattermost/command`.
    - Si `callbackUrl` est omis, OpenClaw génère `http://<gateway.customBindHost or localhost>:<gateway.port, default 18789><callbackPath>`. Les hôtes de liaison génériques (`0.0.0.0`, `::`) sont remplacés par `localhost`.
    - Pour les configurations multicomptes, `commands` peut être défini au niveau supérieur ou sous `channels.mattermost.accounts.<id>.commands` (les valeurs du compte remplacent les champs de niveau supérieur).
    - Les commandes slash existantes créées par d’autres intégrations avec le même déclencheur restent intactes (elles sont ignorées lors de l’enregistrement) ; les commandes créées par le bot sont mises à jour ou recréées lorsque l’URL de rappel change.
    - Les rappels de commande sont validés à l’aide des jetons propres à chaque commande renvoyés par Mattermost lorsque OpenClaw enregistre les commandes `oc_*`.
    - OpenClaw actualise l’enregistrement actuel des commandes Mattermost avant d’accepter chaque rappel, de sorte que les anciens jetons de commandes slash supprimées ou régénérées cessent d’être acceptés sans redémarrage du Gateway.
    - La validation des rappels échoue de manière sécurisée si l’API Mattermost ne peut pas confirmer que la commande est toujours actuelle ; les échecs de validation sont brièvement mis en cache, les recherches simultanées sont regroupées et le lancement de nouvelles recherches est limité par commande afin de contenir la pression exercée par les réexécutions.
    - Les rappels slash échouent de manière sécurisée si l’enregistrement a échoué, si le démarrage était partiel ou si le jeton de rappel ne correspond pas au jeton enregistré de la commande résolue (un jeton valide pour une commande ne peut pas atteindre la validation en amont pour une autre commande).
    - Les rappels acceptés sont confirmés par une réponse éphémère « Traitement en cours... » ; la réponse réelle arrive sous la forme d’un message normal.

  </Accordion>
  <Accordion title="Exigence d’accessibilité">
    Le point de terminaison de rappel doit être accessible depuis le serveur Mattermost.

    - Ne définissez pas `callbackUrl` sur `localhost`, sauf si Mattermost s’exécute sur le même hôte ou dans le même espace de noms réseau qu’OpenClaw.
    - Ne définissez pas `callbackUrl` sur l’URL de base de votre instance Mattermost, sauf si cette URL transmet `/api/channels/mattermost/command` à OpenClaw via un proxy inverse.
    - Pour effectuer une vérification rapide, utilisez `curl https://<gateway-host>/api/channels/mattermost/command` ; une requête GET doit renvoyer `405 Method Not Allowed` depuis OpenClaw, et non `404`.

  </Accordion>
  <Accordion title="Liste d’autorisation des connexions sortantes de Mattermost">
    Si votre rappel cible des adresses privées/tailnet/internes, définissez le paramètre Mattermost `ServiceSettings.AllowedUntrustedInternalConnections` afin d’inclure l’hôte ou le domaine de rappel.

    Utilisez des entrées d’hôte ou de domaine, et non des URL complètes.

    - Correct : `gateway.tailnet-name.ts.net`
    - Incorrect : `https://gateway.tailnet-name.ts.net`

  </Accordion>
</AccordionGroup>

## Variables d’environnement (compte par défaut)

Définissez-les sur l’hôte du Gateway si vous préférez utiliser des variables d’environnement :

- `MATTERMOST_BOT_TOKEN=...`
- `MATTERMOST_URL=https://chat.example.com`

<Note>
Les variables d’environnement s’appliquent uniquement au compte **par défaut** (`default`). Les autres comptes doivent utiliser des valeurs de configuration.

`MATTERMOST_URL` ne peut pas être défini depuis un fichier `.env` de l’espace de travail ; consultez [Fichiers .env de l’espace de travail](/fr/gateway/security).
</Note>

## Modes de discussion

Mattermost répond automatiquement aux messages privés. Le comportement dans les canaux est contrôlé par `chatmode` :

<Tabs>
  <Tab title="oncall (par défaut)">
    Répondre uniquement en cas de mention @ dans les canaux.
  </Tab>
  <Tab title="onmessage">
    Répondre à chaque message du canal.
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
      oncharPrefixes: [">", "!"], // par défaut
    },
  },
}
```

Remarques :

- `onchar` répond toujours aux mentions @ explicites.
- `channels.mattermost.requireMention` est toujours respecté, mais `chatmode` est privilégié. Les paramètres `groups.<channelId>.requireMention` propres à chaque canal prévalent sur les deux.
- Après que le bot a envoyé une réponse visible dans un fil de discussion de canal, les messages suivants de ce même fil reçoivent une réponse sans nouvelle mention @ ni nouveau préfixe `onchar`, ce qui permet aux conversations à plusieurs tours de se poursuivre. La participation est mémorisée pendant 7 jours après la dernière réponse du bot dans ce fil et persiste après les redémarrages du Gateway. Les fils que le bot a seulement observés ne sont pas concernés ; démarrez un nouveau message de niveau supérieur pour exiger à nouveau une mention explicite.

## Fils de discussion et sessions

Utilisez `channels.mattermost.replyToMode` pour déterminer si les réponses dans les canaux et groupes restent dans le canal principal ou démarrent un fil sous la publication qui les a déclenchées.

- `off` (par défaut) : répondre dans un fil uniquement lorsque la publication entrante appartient déjà à un fil.
- `first` : pour les publications de niveau supérieur dans un canal ou un groupe, démarrer un fil sous cette publication et acheminer la conversation vers une session propre au fil.
- `all` et `batched` : même comportement que `first` pour Mattermost à l’heure actuelle, car dès que Mattermost dispose d’une racine de fil, les fragments et médias suivants restent dans ce même fil.
- Les messages privés utilisent par défaut `off`, même lorsque `replyToMode` est défini.

Utilisez `channels.mattermost.replyToModeByChatType` pour remplacer le mode pour les discussions `direct`, `group` ou `channel`. Définissez `direct` pour activer les fils de discussion dans les messages privés :

- `off` (par défaut) : les messages privés restent hors fil dans une seule session continue.
- `first`, `all` ou `batched` : chaque message privé de niveau supérieur démarre un fil Mattermost associé à une nouvelle session indépendante.

```json5
{
  channels: {
    mattermost: {
      replyToMode: "all",
      replyToModeByChatType: {
        direct: "first",
      },
    },
  },
}
```

Remarques :

- Les sessions propres à un fil utilisent l’identifiant de la publication déclencheuse comme racine du fil.
- `first` et `all` sont actuellement équivalents, car dès que Mattermost dispose d’une racine de fil, les fragments et médias suivants restent dans ce même fil.
- Les remplacements propres au type de discussion prévalent sur `replyToMode`. Sans remplacement pour `direct`, les déploiements existants conservent des messages privés sans fil et à structure plate.

## Contrôle d’accès (messages privés)

- Valeur par défaut : `channels.mattermost.dmPolicy = "pairing"` (les expéditeurs inconnus reçoivent un code d’appairage). Autres valeurs : `allowlist`, `open`, `disabled`.
- Approuvez avec :
  - `openclaw pairing list mattermost`
  - `openclaw pairing approve mattermost <CODE>`
- Messages privés publics : `channels.mattermost.dmPolicy="open"` avec `channels.mattermost.allowFrom=["*"]` (le schéma de configuration impose le caractère générique).
- `channels.mattermost.allowFrom` accepte les identifiants utilisateur (recommandé) et les entrées `accessGroup:<name>`. Consultez [Groupes d’accès](/fr/channels/access-groups).

## Canaux (groupes)

- Valeur par défaut : `channels.mattermost.groupPolicy = "allowlist"` (soumis à une mention).
- Autorisez les expéditeurs avec `channels.mattermost.groupAllowFrom` (identifiants utilisateur recommandés).
- `channels.mattermost.groupAllowFrom` accepte les entrées `accessGroup:<name>`. Consultez [Groupes d’accès](/fr/channels/access-groups).
- Les remplacements de mention propres à chaque canal se trouvent sous `channels.mattermost.groups.<channelId>.requireMention` ou sous `channels.mattermost.groups["*"].requireMention` pour définir une valeur par défaut.
- La correspondance `@username` est modifiable et n’est activée que lorsque `channels.mattermost.dangerouslyAllowNameMatching: true`.
- Canaux ouverts : `channels.mattermost.groupPolicy="open"` (soumis à une mention).
- Ordre de résolution : `channels.mattermost.groupPolicy`, puis `channels.defaults.groupPolicy`, puis `"allowlist"`.
- Remarque sur l’exécution : si la section `channels.mattermost` est entièrement absente, l’exécution applique de manière sécurisée `groupPolicy="allowlist"` aux vérifications de groupe (même si `channels.defaults.groupPolicy` est défini) et journalise un avertissement unique.

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

## Cibles des envois sortants

Utilisez les formats de cible suivants avec `openclaw message send` ou les tâches cron/Webhooks :

| Cible                               | Destination                                                          |
| ----------------------------------- | -------------------------------------------------------------------- |
| `channel:<id>`                      | Canal par identifiant                                                |
| `channel:<name>` ou `#channel-name` | Canal par nom, recherché dans toutes les équipes auxquelles appartient le bot |
| `user:<id>` ou `mattermost:<id>`    | Message privé avec cet utilisateur                                   |
| `@username`                         | Message privé (nom d’utilisateur résolu via l’API Mattermost)        |

Les envois sortants prennent en charge au maximum une pièce jointe par message ; répartissez plusieurs fichiers entre des envois distincts.

<Warning>
Les identifiants opaques sans préfixe (comme `64ifufp...`) sont **ambigus** dans Mattermost (identifiant utilisateur ou identifiant de canal).

OpenClaw les résout en donnant **la priorité à l’utilisateur** :

- Si l’identifiant correspond à un utilisateur (`GET /api/v4/users/<id>` réussit), OpenClaw envoie un **message privé** en résolvant le canal direct via `/api/v4/channels/direct`.
- Sinon, l’identifiant est traité comme un **identifiant de canal**.

Si vous avez besoin d’un comportement déterministe, utilisez toujours les préfixes explicites (`user:<id>` / `channel:<id>`).
</Warning>

## Nouvelle tentative pour le canal de messages privés

Lorsque OpenClaw envoie un message à une cible de message privé Mattermost et doit d’abord résoudre le canal direct, il réessaie par défaut les échecs temporaires de création du canal direct.

Utilisez `channels.mattermost.dmChannelRetry` pour ajuster ce comportement globalement pour le plugin Mattermost, ou `channels.mattermost.accounts.<id>.dmChannelRetry` pour un compte. Valeurs par défaut :

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

Remarques :

- Cela s’applique uniquement à la création de canaux de messages directs (`/api/v4/channels/direct`), et non à chaque appel à l’API Mattermost.
- Les nouvelles tentatives utilisent un délai exponentiel avec gigue et s’appliquent aux échecs temporaires tels que les limitations de débit, les réponses 5xx et les erreurs réseau ou d’expiration du délai.
- Les erreurs client 4xx autres que `429` sont considérées comme permanentes et ne font pas l’objet de nouvelles tentatives.

## Diffusion en continu de l’aperçu

Mattermost diffuse le raisonnement, l’activité des outils et le texte partiel de la réponse dans une **publication d’aperçu à l’état de brouillon**, qui est finalisée sur place lorsque la réponse finale peut être envoyée en toute sécurité. En mode `partial`, l’aperçu est mis à jour avec le même identifiant de publication au lieu d’inonder le canal de messages pour chaque fragment. En mode `block`, l’aperçu alterne entre les blocs de texte terminé et d’activité des outils, afin que les blocs précédents restent visibles sous forme de publications distinctes au lieu d’être remplacés par le suivant. Les réponses finales contenant un média ou une erreur annulent les modifications d’aperçu en attente et utilisent la livraison normale au lieu de publier un aperçu provisoire inutile.

La diffusion en continu de l’aperçu est **activée par défaut** en mode `partial`. Configurez-la via `channels.mattermost.streaming` (une chaîne de mode, une valeur booléenne ou un objet tel que `{ mode: "progress" }`) :

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
    - `partial` (par défaut) : une publication d’aperçu qui est modifiée à mesure que la réponse s’allonge, puis finalisée avec la réponse complète.
    - `block` alterne l’aperçu entre les blocs de texte terminé et d’activité des outils, afin que chaque bloc reste visible sous forme de publication distincte au lieu d’être remplacé sur place. Les mises à jour d’outils parallèles et consécutives partagent la publication actuelle d’activité des outils.
    - `progress` affiche un aperçu de l’état pendant la génération et ne publie la réponse finale qu’une fois celle-ci terminée.
    - `off` désactive la diffusion en continu de l’aperçu. Avec `blockStreaming: true`, les blocs terminés de l’assistant sont toujours livrés comme des réponses normales par blocs (publications distinctes), plutôt que sous la forme d’une publication finale unique fusionnée.

  </Accordion>
  <Accordion title="Remarques sur le comportement de la diffusion en continu">
    - Si le flux ne peut pas être finalisé sur place (par exemple, si la publication a été supprimée pendant la diffusion), OpenClaw envoie à la place une nouvelle publication finale afin que la réponse ne soit jamais perdue.
    - Les contenus composés uniquement du raisonnement ne sont pas publiés dans le canal, y compris le texte reçu sous la forme d’une citation `> Thinking`. Définissez `/reasoning on` pour afficher le raisonnement dans les autres interfaces ; la publication finale Mattermost conserve uniquement la réponse.
    - Consultez [Diffusion en continu](/fr/concepts/streaming#preview-streaming-modes) pour connaître la matrice de correspondance des canaux.

  </Accordion>
</AccordionGroup>

## Réactions (outil de messagerie)

- Utilisez `message action=react` avec `channel=mattermost`.
- `messageId` est l’identifiant de la publication Mattermost.
- `emoji` accepte des noms tels que `thumbsup` ou `:+1:` (les deux-points sont facultatifs).
- Définissez `remove=true` (valeur booléenne) pour supprimer une réaction.
- Les événements d’ajout et de suppression de réactions sont transmis sous forme d’événements système à la session de l’agent acheminée, sous réserve des mêmes vérifications de politique pour les messages directs et les groupes que les messages.

Exemples :

```text
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup
message action=react channel=mattermost target=channel:<channelId> messageId=<postId> emoji=thumbsup remove=true
```

Configuration :

- `channels.mattermost.actions.reactions` : active ou désactive les actions de réaction (valeur par défaut : true).
- Remplacement par compte : `channels.mattermost.accounts.<id>.actions.reactions`.

## Boutons interactifs (outil de messagerie)

Envoyez des messages comportant des boutons cliquables. Lorsqu’un utilisateur clique sur un bouton, l’agent reçoit la sélection et peut répondre.

Les boutons proviennent du contenu sémantique `presentation` (dans les réponses normales de l’agent et dans `message action=send`). OpenClaw affiche les boutons de valeur comme des boutons interactifs Mattermost, conserve les boutons URL visibles dans le texte du message et convertit les menus de sélection en texte lisible.

```text
message action=send channel=mattermost target=channel:<channelId> presentation={"blocks":[{"type":"buttons","buttons":[{"label":"Oui","value":"yes"},{"label":"Non","value":"no"}]}]}
```

Champs des boutons de présentation :

<ParamField path="label" type="string" required>
  Libellé affiché (alias : `text`).
</ParamField>
<ParamField path="value" type="string">
  Valeur renvoyée lors du clic, utilisée comme identifiant d’action (alias : `callback_data`, `callbackData`). Requise pour un bouton cliquable, sauf si `url` est défini.
</ParamField>
<ParamField path="url" type="string">
  Bouton de lien ; affiché sous forme de texte `label: url` dans le corps du message plutôt que comme bouton interactif.
</ParamField>
<ParamField path="style" type='"primary" | "secondary" | "success" | "danger"'>
  Style du bouton. Mattermost applique le style par défaut aux valeurs qu’il ne prend pas en charge.
</ParamField>

Pour annoncer la prise en charge des boutons dans l’invite système de l’agent, ajoutez `inlineButtons` aux capacités du canal :

```json5
{
  channels: {
    mattermost: {
      capabilities: ["inlineButtons"],
    },
  },
}
```

Lorsqu’un utilisateur clique sur un bouton :

<Steps>
  <Step title="Vérification des accès">
    L’utilisateur qui clique doit satisfaire aux mêmes vérifications de politique pour les messages directs et les groupes qu’un expéditeur de message ; les clics non autorisés reçoivent une notification éphémère et sont ignorés.
  </Step>
  <Step title="Remplacement des boutons par une confirmation">
    Tous les boutons sont remplacés par une ligne de confirmation (par exemple, « ✓ **Oui** sélectionné par @user »).
  </Step>
  <Step title="Réception de la sélection par l’agent">
    L’agent reçoit la sélection sous forme de message entrant (accompagné d’un événement système) et répond.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Remarques sur l’implémentation">
    - Les rappels de boutons utilisent une vérification HMAC-SHA256 (automatique, aucune configuration requise).
    - L’ensemble du bloc de pièce jointe est remplacé lors du clic ; tous les boutons sont donc supprimés ensemble et une suppression partielle est impossible.
    - Les identifiants d’action contenant des traits d’union ou des tirets bas sont automatiquement assainis (limitation de l’acheminement Mattermost).
    - Les clics dont l’`action_id` ne correspond à aucune action de la publication d’origine sont rejetés avec `403` (« Action inconnue »).

  </Accordion>
  <Accordion title="Configuration et accessibilité">
    - `channels.mattermost.capabilities` : tableau de chaînes de capacités. Ajoutez `"inlineButtons"` pour activer la description de l’outil de boutons dans l’invite système de l’agent.
    - `channels.mattermost.interactions.callbackBaseUrl` : URL de base externe facultative pour les rappels de boutons (par exemple `https://gateway.example.com`). Utilisez-la lorsque Mattermost ne peut pas accéder directement au Gateway via son hôte d’écoute.
    - Dans les configurations multicomptes, vous pouvez également définir le même champ sous `channels.mattermost.accounts.<id>.interactions.callbackBaseUrl`.
    - Si `interactions.callbackBaseUrl` est omis, OpenClaw déduit l’URL de rappel à partir de `gateway.customBindHost` + `gateway.port` (valeur par défaut : 18789), puis utilise `http://localhost:<port>` comme solution de repli. Le chemin de rappel est `/mattermost/interactions/<accountId>`.
    - Règle d’accessibilité : l’URL de rappel des boutons doit être accessible depuis le serveur Mattermost. `localhost` ne fonctionne que lorsque Mattermost et OpenClaw s’exécutent sur le même hôte ou dans le même espace de noms réseau.
    - `channels.mattermost.interactions.allowedSourceIps` : liste d’adresses IP sources autorisées pour les rappels de boutons. Sans celle-ci, seules les sources de bouclage (`127.0.0.1`, `::1`) sont acceptées ; un serveur Mattermost distant doit donc être ajouté ici à la liste d’autorisation, sinon ses clics sont rejetés avec `403`. Derrière un proxy inverse, définissez également `gateway.trustedProxies` afin que l’adresse IP réelle du client soit déduite des en-têtes transférés.
    - Si votre cible de rappel est privée, interne ou située sur un réseau Tailscale, ajoutez son hôte ou domaine à `ServiceSettings.AllowedUntrustedInternalConnections` dans Mattermost.

  </Accordion>
</AccordionGroup>

### Intégration directe à l’API (scripts externes)

Les scripts externes et les Webhooks peuvent publier des boutons directement via l’API REST Mattermost au lieu de passer par l’outil `message` de l’agent. Utilisez `buildButtonAttachments()` du Plugin lorsque cela est possible ; si vous publiez du JSON brut, respectez les règles suivantes :

**Structure du contenu :**

```json5
{
  channel_id: "<channelId>",
  message: "Choisissez une option :",
  props: {
    attachments: [
      {
        actions: [
          {
            id: "mybutton01", // caractères alphanumériques uniquement - voir ci-dessous
            type: "button", // obligatoire, sinon les clics sont ignorés silencieusement
            name: "Approuver", // libellé affiché
            style: "primary", // facultatif : "default", "primary", "danger"
            integration: {
              url: "https://gateway.example.com/mattermost/interactions/default",
              context: {
                action_id: "mybutton01", // doit correspondre à l’identifiant du bouton
                action: "approve",
                // ... champs personnalisés éventuels ...
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

1. Les pièces jointes doivent se trouver dans `props.attachments`, et non dans `attachments` au niveau supérieur (elles seraient ignorées silencieusement).
2. Chaque action nécessite `type: "button"` ; sans celui-ci, les clics sont absorbés silencieusement.
3. Chaque action nécessite un champ `id` ; Mattermost ignore les actions sans identifiant.
4. L’`id` de l’action doit contenir **uniquement des caractères alphanumériques** (`[a-zA-Z0-9]`). Les traits d’union et les tirets bas empêchent l’acheminement des actions côté serveur de Mattermost (réponse 404). Supprimez-les avant utilisation.
5. `context.action_id` doit correspondre à l’`id` du bouton ; le Gateway rejette les clics dont l’`action_id` n’existe pas dans la publication.
6. `context.action_id` est requis ; le gestionnaire d’interactions renvoie 400 s’il est absent.
7. L’adresse IP source du rappel doit être autorisée (voir `interactions.allowedSourceIps` ci-dessus).

</Warning>

**Génération du jeton HMAC**

Le Gateway vérifie les clics sur les boutons avec HMAC-SHA256. Les scripts externes doivent générer des jetons correspondant à la logique de vérification du Gateway :

<Steps>
  <Step title="Dériver le secret à partir du jeton du bot">
    `HMAC-SHA256(key="openclaw-mattermost-interactions", data=botToken)`, encodé en hexadécimal.
  </Step>
  <Step title="Construire l’objet de contexte">
    Construisez l’objet de contexte avec tous les champs **sauf** `_token`.
  </Step>
  <Step title="Sérialiser avec les clés triées">
    Sérialisez avec des **clés triées récursivement** et **sans espaces** (le Gateway normalise également les objets imbriqués et produit du JSON compact).
  </Step>
  <Step title="Signer le contenu">
    `HMAC-SHA256(key=secret, data=serializedContext)`
  </Step>
  <Step title="Ajouter le jeton">
    Ajoutez l’empreinte hexadécimale obtenue comme `_token` dans le contexte.
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
  <Accordion title="Pièges courants liés à HMAC">
    - La fonction `json.dumps` de Python ajoute des espaces par défaut (`{"key": "val"}`). Utilisez `separators=(",", ":")` pour correspondre à la sortie compacte de JavaScript (`{"key":"val"}`).
    - Signez toujours **tous** les champs du contexte (à l’exception de `_token`). Le Gateway supprime `_token`, puis signe tous les éléments restants. La signature d’un sous-ensemble provoque un échec silencieux de la vérification.
    - Utilisez `sort_keys=True` ; le Gateway trie les clés avant de signer, et Mattermost peut réordonner les champs du contexte lors du stockage du contenu.
    - Dérivez le secret du jeton du bot (de manière déterministe), et non d’octets aléatoires. Le secret doit être identique dans le processus qui crée les boutons et dans le Gateway qui effectue la vérification.

  </Accordion>
</AccordionGroup>

## Adaptateur d’annuaire

Le Plugin Mattermost comprend un adaptateur d’annuaire qui résout les noms de canaux et d’utilisateurs via l’API Mattermost. Cela permet d’utiliser des cibles `#channel-name` et `@username` dans `openclaw message send` ainsi que dans les livraisons Cron et Webhook.

Aucune configuration n’est requise ; l’adaptateur utilise le jeton du bot défini dans la configuration du compte.

## Multicompte

Mattermost prend en charge plusieurs comptes sous `channels.mattermost.accounts` :

```json5
{
  channels: {
    mattermost: {
      accounts: {
        default: { name: "Principal", botToken: "mm-token", baseUrl: "https://chat.example.com" },
        alerts: { name: "Alertes", botToken: "mm-token-2", baseUrl: "https://alerts.example.com" },
      },
    },
  },
}
```

Les valeurs du compte remplacent les champs de premier niveau ; `channels.mattermost.defaultAccount` sélectionne le compte utilisé lorsqu’aucun n’est spécifié.

## Résolution des problèmes

<AccordionGroup>
  <Accordion title="Aucune réponse dans les canaux">
    Vérifiez que le bot se trouve dans le canal et mentionnez-le (oncall), utilisez un préfixe déclencheur (onchar) ou définissez `chatmode: "onmessage"`.
  </Accordion>
  <Accordion title="Erreurs d’authentification ou de comptes multiples">
    - Vérifiez le jeton du bot, l’URL de base et si le compte est activé.
    - Problèmes liés aux comptes multiples : les variables d’environnement s’appliquent uniquement au compte `default`.
    - Les hôtes Mattermost privés/sur le réseau local nécessitent `network.dangerouslyAllowPrivateNetwork: true` (la protection SSRF bloque les adresses IP privées par défaut).

  </Accordion>
  <Accordion title="Échec des commandes slash natives">
    - `Unauthorized: invalid command token.` : OpenClaw n’a pas accepté le jeton de rappel. Causes courantes :
      - l’enregistrement des commandes slash a échoué ou n’a été que partiellement effectué au démarrage
      - le rappel atteint le mauvais Gateway ou compte
      - Mattermost possède encore d’anciennes commandes qui pointent vers une précédente cible de rappel
      - le Gateway a redémarré sans réactiver les commandes slash
    - Si les commandes slash natives cessent de fonctionner, recherchez dans les journaux `mattermost: failed to register slash commands` ou `mattermost: native slash commands enabled but no commands could be registered`.
    - Si `callbackUrl` est omis et que les journaux avertissent que le rappel a été résolu vers une URL de bouclage telle que `http://localhost:18789/...`, cette URL n’est probablement accessible que lorsque Mattermost s’exécute sur le même hôte ou dans le même espace de noms réseau qu’OpenClaw. Définissez plutôt une valeur `commands.callbackUrl` explicite et accessible de l’extérieur.

  </Accordion>
  <Accordion title="Problèmes liés aux boutons">
    - Les boutons apparaissent sous forme de cases blanches ou ne s’affichent pas du tout : les données du bouton sont mal formées. Chaque bouton de présentation nécessite un `label` et une `value` (les boutons auxquels l’un ou l’autre manque sont ignorés).
    - Les boutons s’affichent, mais les clics ne produisent aucun effet : vérifiez que le Gateway est accessible depuis le serveur Mattermost, que l’adresse IP du serveur Mattermost figure dans `channels.mattermost.interactions.allowedSourceIps` (seule l’adresse de bouclage est acceptée sans ce paramètre) et que `ServiceSettings.AllowedUntrustedInternalConnections` inclut l’hôte de rappel pour les cibles privées.
    - Les boutons renvoient une erreur 404 lors d’un clic : l’`id` du bouton contient probablement des traits d’union ou des traits de soulignement. Le routeur d’actions de Mattermost ne fonctionne pas avec les identifiants non alphanumériques. Utilisez uniquement `[a-zA-Z0-9]`.
    - Le Gateway journalise `rejected callback source` : le clic provient d’une adresse IP absente de `interactions.allowedSourceIps`. Ajoutez le serveur Mattermost ou votre point d’entrée à la liste d’autorisation et définissez `gateway.trustedProxies` si vous utilisez un proxy inverse.
    - Le Gateway journalise `invalid _token` : non-correspondance HMAC. Vérifiez que vous signez tous les champs de contexte (et non un sous-ensemble), que vous utilisez des clés triées et un JSON compact (sans espaces). Consultez la section HMAC ci-dessus.
    - Le Gateway journalise `missing _token in context` : le champ `_token` ne figure pas dans le contexte du bouton. Veillez à l’inclure lors de la création de la charge utile d’intégration.
    - Le Gateway rejette le clic avec `Unknown action` : `context.action_id` ne correspond à l’`id` d’aucune action de la publication. Définissez les deux sur la même valeur assainie.
    - L’agent ne propose pas de boutons : ajoutez `capabilities: ["inlineButtons"]` à la configuration du canal Mattermost.

  </Accordion>
</AccordionGroup>

## Voir aussi

- [Routage des canaux](/fr/channels/channel-routing) - routage des sessions pour les messages
- [Vue d’ensemble des canaux](/fr/channels) - tous les canaux pris en charge
- [Groupes](/fr/channels/groups) - comportement des discussions de groupe et filtrage par mention
- [Association](/fr/channels/pairing) - authentification des messages privés et flux d’association
- [Sécurité](/fr/gateway/security) - modèle d’accès et renforcement de la sécurité
