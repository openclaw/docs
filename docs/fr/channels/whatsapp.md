---
read_when:
    - Travail sur le comportement du canal WhatsApp/web ou le routage de la boîte de réception
summary: Prise en charge du canal WhatsApp, contrôles d’accès, comportement de livraison et opérations
title: WhatsApp
x-i18n:
    generated_at: "2026-04-22T04:21:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5c527b9f7f58f4bb7272a6d1c0f9a435d7d46a9b99790243594afb5c305606b3
    source_path: channels/whatsapp.md
    workflow: 15
---

# WhatsApp (canal Web)

Statut : prêt pour la production via WhatsApp Web (Baileys). Le Gateway possède la ou les sessions liées.

## Installation (à la demande)

- L’onboarding (`openclaw onboard`) et `openclaw channels add --channel whatsapp`
  proposent d’installer le plugin WhatsApp la première fois que vous le sélectionnez.
- `openclaw channels login --channel whatsapp` propose aussi le flux d’installation lorsque
  le plugin n’est pas encore présent.
- Canal de développement + checkout git : utilise par défaut le chemin du plugin local.
- Stable/Beta : utilise par défaut le package npm `@openclaw/whatsapp`.

L’installation manuelle reste disponible :

```bash
openclaw plugins install @openclaw/whatsapp
```

<CardGroup cols={3}>
  <Card title="Appairage" icon="link" href="/fr/channels/pairing">
    La politique par défaut pour les messages privés est l’appairage pour les expéditeurs inconnus.
  </Card>
  <Card title="Dépannage des canaux" icon="wrench" href="/fr/channels/troubleshooting">
    Diagnostics inter-canaux et procédures de réparation.
  </Card>
  <Card title="Configuration du Gateway" icon="settings" href="/fr/gateway/configuration">
    Modèles et exemples complets de configuration des canaux.
  </Card>
</CardGroup>

## Configuration rapide

<Steps>
  <Step title="Configurer la politique d’accès WhatsApp">

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing",
      allowFrom: ["+15551234567"],
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
    },
  },
}
```

  </Step>

  <Step title="Lier WhatsApp (QR)">

```bash
openclaw channels login --channel whatsapp
```

    Pour un compte spécifique :

```bash
openclaw channels login --channel whatsapp --account work
```

  </Step>

  <Step title="Démarrer le Gateway">

```bash
openclaw gateway
```

  </Step>

  <Step title="Approuver la première demande d’appairage (si vous utilisez le mode appairage)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    Les demandes d’appairage expirent après 1 heure. Les demandes en attente sont limitées à 3 par canal.

  </Step>
</Steps>

<Note>
OpenClaw recommande d’utiliser WhatsApp avec un numéro séparé lorsque c’est possible. (Les métadonnées du canal et le flux de configuration sont optimisés pour cette configuration, mais les configurations avec numéro personnel sont également prises en charge.)
</Note>

## Modèles de déploiement

<AccordionGroup>
  <Accordion title="Numéro dédié (recommandé)">
    Il s’agit du mode opérationnel le plus propre :

    - identité WhatsApp séparée pour OpenClaw
    - limites de routage et listes d’autorisation des messages privés plus claires
    - risque plus faible de confusion avec l’auto-discussion

    Modèle de politique minimal :

    ```json5
    {
      channels: {
        whatsapp: {
          dmPolicy: "allowlist",
          allowFrom: ["+15551234567"],
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Solution de repli avec numéro personnel">
    L’onboarding prend en charge le mode numéro personnel et écrit une base adaptée à l’auto-discussion :

    - `dmPolicy: "allowlist"`
    - `allowFrom` inclut votre numéro personnel
    - `selfChatMode: true`

    À l’exécution, les protections d’auto-discussion s’appuient sur le numéro personnel lié et `allowFrom`.

  </Accordion>

  <Accordion title="Portée du canal WhatsApp Web uniquement">
    Le canal de plateforme de messagerie est basé sur WhatsApp Web (`Baileys`) dans l’architecture actuelle des canaux OpenClaw.

    Il n’existe pas de canal de messagerie WhatsApp Twilio séparé dans le registre intégré des canaux de chat.

  </Accordion>
</AccordionGroup>

## Modèle d’exécution

- Le Gateway possède le socket WhatsApp et la boucle de reconnexion.
- Les envois sortants nécessitent un écouteur WhatsApp actif pour le compte cible.
- Les discussions de statut et de diffusion sont ignorées (`@status`, `@broadcast`).
- Les discussions directes utilisent les règles de session des messages privés (`session.dmScope` ; `main` par défaut regroupe les messages privés dans la session principale de l’agent).
- Les sessions de groupe sont isolées (`agent:<agentId>:whatsapp:group:<jid>`).
- Le transport WhatsApp Web respecte les variables d’environnement proxy standard sur l’hôte Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / variantes en minuscules). Préférez une configuration proxy au niveau de l’hôte plutôt que des paramètres proxy WhatsApp spécifiques au canal.

## Contrôle d’accès et activation

<Tabs>
  <Tab title="Politique des messages privés">
    `channels.whatsapp.dmPolicy` contrôle l’accès aux discussions directes :

    - `pairing` (par défaut)
    - `allowlist`
    - `open` (nécessite que `allowFrom` inclue `"*"`)
    - `disabled`

    `allowFrom` accepte des numéros au format E.164 (normalisés en interne).

    Remplacement multi-comptes : `channels.whatsapp.accounts.<id>.dmPolicy` (et `allowFrom`) est prioritaire sur les valeurs par défaut au niveau du canal pour ce compte.

    Détails du comportement à l’exécution :

    - les appairages sont persistés dans le magasin d’autorisation du canal et fusionnés avec `allowFrom` configuré
    - si aucune liste d’autorisation n’est configurée, le numéro personnel lié est autorisé par défaut
    - les messages privés sortants `fromMe` ne sont jamais appairés automatiquement

  </Tab>

  <Tab title="Politique de groupe + listes d’autorisation">
    L’accès aux groupes comporte deux couches :

    1. **Liste d’autorisation d’appartenance aux groupes** (`channels.whatsapp.groups`)
       - si `groups` est omis, tous les groupes sont admissibles
       - si `groups` est présent, il agit comme une liste d’autorisation de groupes (`"*"` autorisé)

    2. **Politique des expéditeurs de groupe** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open` : la liste d’autorisation des expéditeurs est contournée
       - `allowlist` : l’expéditeur doit correspondre à `groupAllowFrom` (ou `*`)
       - `disabled` : bloque tous les messages entrants de groupe

    Repli de la liste d’autorisation des expéditeurs :

    - si `groupAllowFrom` n’est pas défini, l’exécution revient à `allowFrom` lorsqu’il est disponible
    - les listes d’autorisation des expéditeurs sont évaluées avant l’activation par mention/réponse

    Remarque : si aucun bloc `channels.whatsapp` n’existe du tout, le repli de politique de groupe à l’exécution est `allowlist` (avec un avertissement dans les journaux), même si `channels.defaults.groupPolicy` est défini.

  </Tab>

  <Tab title="Mentions + /activation">
    Les réponses de groupe exigent une mention par défaut.

    La détection des mentions inclut :

    - les mentions WhatsApp explicites de l’identité du bot
    - les modèles regex de mention configurés (`agents.list[].groupChat.mentionPatterns`, repli sur `messages.groupChat.mentionPatterns`)
    - la détection implicite de réponse-au-bot (l’expéditeur de la réponse correspond à l’identité du bot)

    Remarque de sécurité :

    - la citation/réponse ne satisfait que la protection par mention ; elle **n’accorde pas** d’autorisation à l’expéditeur
    - avec `groupPolicy: "allowlist"`, les expéditeurs non présents dans la liste d’autorisation sont toujours bloqués même s’ils répondent au message d’un utilisateur autorisé

    Commande d’activation au niveau de la session :

    - `/activation mention`
    - `/activation always`

    `activation` met à jour l’état de la session (pas la configuration globale). Elle est limitée au propriétaire.

  </Tab>
</Tabs>

## Comportement avec numéro personnel et auto-discussion

Lorsque le numéro personnel lié est également présent dans `allowFrom`, les protections d’auto-discussion WhatsApp s’activent :

- ignorer les accusés de lecture pour les tours d’auto-discussion
- ignorer le comportement de déclenchement automatique par mention-JID qui vous notifierait autrement vous-même
- si `messages.responsePrefix` n’est pas défini, les réponses d’auto-discussion utilisent par défaut `[{identity.name}]` ou `[openclaw]`

## Normalisation des messages et contexte

<AccordionGroup>
  <Accordion title="Enveloppe entrante + contexte de réponse">
    Les messages WhatsApp entrants sont encapsulés dans l’enveloppe entrante partagée.

    Si une réponse citée existe, le contexte est ajouté sous cette forme :

    ```text
    [Replying to <sender> id:<stanzaId>]
    <quoted body or media placeholder>
    [/Replying]
    ```

    Les champs de métadonnées de réponse sont également renseignés lorsqu’ils sont disponibles (`ReplyToId`, `ReplyToBody`, `ReplyToSender`, JID expéditeur/E.164).

  </Accordion>

  <Accordion title="Espaces réservés pour les médias et extraction des emplacements/contacts">
    Les messages entrants contenant uniquement des médias sont normalisés avec des espaces réservés comme :

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    Les charges utiles d’emplacement et de contact sont normalisées en contexte textuel avant le routage.

  </Accordion>

  <Accordion title="Injection de l’historique de groupe en attente">
    Pour les groupes, les messages non traités peuvent être mis en mémoire tampon et injectés comme contexte lorsque le bot est finalement déclenché.

    - limite par défaut : `50`
    - configuration : `channels.whatsapp.historyLimit`
    - repli : `messages.groupChat.historyLimit`
    - `0` désactive

    Marqueurs d’injection :

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  </Accordion>

  <Accordion title="Accusés de lecture">
    Les accusés de lecture sont activés par défaut pour les messages WhatsApp entrants acceptés.

    Désactivation globale :

    ```json5
    {
      channels: {
        whatsapp: {
          sendReadReceipts: false,
        },
      },
    }
    ```

    Remplacement par compte :

    ```json5
    {
      channels: {
        whatsapp: {
          accounts: {
            work: {
              sendReadReceipts: false,
            },
          },
        },
      },
    }
    ```

    Les tours d’auto-discussion ignorent les accusés de lecture même lorsqu’ils sont activés globalement.

  </Accordion>
</AccordionGroup>

## Livraison, découpage et médias

<AccordionGroup>
  <Accordion title="Découpage du texte">
    - limite de découpage par défaut : `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - le mode `newline` privilégie les limites de paragraphe (lignes vides), puis revient à un découpage sûr selon la longueur
  </Accordion>

  <Accordion title="Comportement des médias sortants">
    - prend en charge les charges utiles image, vidéo, audio (note vocale PTT) et document
    - `audio/ogg` est réécrit en `audio/ogg; codecs=opus` pour la compatibilité avec les notes vocales
    - la lecture GIF animée est prise en charge via `gifPlayback: true` lors des envois vidéo
    - les légendes sont appliquées au premier élément média lors de l’envoi de charges utiles de réponse multi-médias
    - la source du média peut être HTTP(S), `file://` ou des chemins locaux
  </Accordion>

  <Accordion title="Limites de taille des médias et comportement de repli">
    - limite de sauvegarde des médias entrants : `channels.whatsapp.mediaMaxMb` (par défaut `50`)
    - limite d’envoi des médias sortants : `channels.whatsapp.mediaMaxMb` (par défaut `50`)
    - les remplacements par compte utilisent `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - les images sont automatiquement optimisées (redimensionnement/balayage de qualité) pour respecter les limites
    - en cas d’échec de l’envoi d’un média, le repli du premier élément envoie un avertissement texte au lieu d’abandonner silencieusement la réponse
  </Accordion>
</AccordionGroup>

## Niveau de réaction

`channels.whatsapp.reactionLevel` contrôle à quel point l’agent utilise largement les réactions emoji sur WhatsApp :

| Niveau        | Réactions d’accusé | Réactions initiées par l’agent | Description                                      |
| ------------- | ------------------ | ------------------------------ | ------------------------------------------------ |
| `"off"`       | Non                | Non                            | Aucune réaction                                  |
| `"ack"`       | Oui                | Non                            | Réactions d’accusé uniquement (pré-réponse)      |
| `"minimal"`   | Oui                | Oui (conservatrices)           | Accusé + réactions agent avec consignes prudentes |
| `"extensive"` | Oui                | Oui (encouragées)              | Accusé + réactions agent avec consignes favorables |

Par défaut : `"minimal"`.

Les remplacements par compte utilisent `channels.whatsapp.accounts.<id>.reactionLevel`.

```json5
{
  channels: {
    whatsapp: {
      reactionLevel: "ack",
    },
  },
}
```

## Réactions d’accusé

WhatsApp prend en charge les réactions d’accusé immédiates à la réception entrante via `channels.whatsapp.ackReaction`.
Les réactions d’accusé sont contrôlées par `reactionLevel` — elles sont supprimées lorsque `reactionLevel` vaut `"off"`.

```json5
{
  channels: {
    whatsapp: {
      ackReaction: {
        emoji: "👀",
        direct: true,
        group: "mentions", // always | mentions | never
      },
    },
  },
}
```

Remarques sur le comportement :

- envoyées immédiatement après l’acceptation du message entrant (avant la réponse)
- les échecs sont consignés dans les journaux mais ne bloquent pas la livraison normale de la réponse
- le mode groupe `mentions` réagit sur les tours déclenchés par mention ; l’activation de groupe `always` agit comme contournement de cette vérification
- WhatsApp utilise `channels.whatsapp.ackReaction` (l’ancien `messages.ackReaction` n’est pas utilisé ici)

## Multi-compte et identifiants

<AccordionGroup>
  <Accordion title="Sélection de compte et valeurs par défaut">
    - les identifiants de compte proviennent de `channels.whatsapp.accounts`
    - sélection du compte par défaut : `default` s’il est présent, sinon premier identifiant de compte configuré (trié)
    - les identifiants de compte sont normalisés en interne pour la résolution
  </Accordion>

  <Accordion title="Chemins des identifiants et compatibilité avec l’ancien format">
    - chemin d’authentification actuel : `~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - fichier de sauvegarde : `creds.json.bak`
    - l’authentification par défaut héritée dans `~/.openclaw/credentials/` est toujours reconnue/migrée pour les flux de compte par défaut
  </Accordion>

  <Accordion title="Comportement de déconnexion">
    `openclaw channels logout --channel whatsapp [--account <id>]` efface l’état d’authentification WhatsApp pour ce compte.

    Dans les répertoires d’authentification hérités, `oauth.json` est conservé tandis que les fichiers d’authentification Baileys sont supprimés.

  </Accordion>
</AccordionGroup>

## Outils, actions et écritures de configuration

- La prise en charge des outils d’agent inclut l’action de réaction WhatsApp (`react`).
- Contrôles d’actions :
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- Les écritures de configuration initiées par le canal sont activées par défaut (désactivez-les via `channels.whatsapp.configWrites=false`).

## Dépannage

<AccordionGroup>
  <Accordion title="Non lié (QR requis)">
    Symptôme : l’état du canal indique qu’il n’est pas lié.

    Correctif :

    ```bash
    openclaw channels login --channel whatsapp
    openclaw channels status
    ```

  </Accordion>

  <Accordion title="Lié mais déconnecté / boucle de reconnexion">
    Symptôme : compte lié avec déconnexions répétées ou tentatives de reconnexion.

    Correctif :

    ```bash
    openclaw doctor
    openclaw logs --follow
    ```

    Si nécessaire, reliez avec `channels login`.

  </Accordion>

  <Accordion title="Aucun écouteur actif lors de l’envoi">
    Les envois sortants échouent immédiatement lorsqu’aucun écouteur Gateway actif n’existe pour le compte cible.

    Assurez-vous que le Gateway est en cours d’exécution et que le compte est lié.

  </Accordion>

  <Accordion title="Messages de groupe ignorés de manière inattendue">
    Vérifiez dans cet ordre :

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - entrées de liste d’autorisation `groups`
    - protection par mention (`requireMention` + modèles de mention)
    - clés dupliquées dans `openclaw.json` (JSON5) : les entrées ultérieures remplacent les précédentes, gardez donc un seul `groupPolicy` par portée

  </Accordion>

  <Accordion title="Avertissement d’exécution Bun">
    L’exécution du Gateway WhatsApp doit utiliser Node. Bun est signalé comme incompatible pour le fonctionnement stable du Gateway WhatsApp/Telegram.
  </Accordion>
</AccordionGroup>

## Prompts système

WhatsApp prend en charge des prompts système de style Telegram pour les groupes et les discussions directes via les maps `groups` et `direct`.

Hiérarchie de résolution pour les messages de groupe :

La map `groups` effective est d’abord déterminée : si le compte définit sa propre map `groups`, elle remplace entièrement la map `groups` racine (aucune fusion profonde). La recherche du prompt s’exécute ensuite sur la map unique résultante :

1. **Prompt système spécifique au groupe** (`groups["<groupId>"].systemPrompt`) : utilisé si l’entrée du groupe spécifique définit un `systemPrompt`.
2. **Prompt système générique pour les groupes** (`groups["*"].systemPrompt`) : utilisé lorsque l’entrée du groupe spécifique est absente ou ne définit pas de `systemPrompt`.

Hiérarchie de résolution pour les messages directs :

La map `direct` effective est d’abord déterminée : si le compte définit sa propre map `direct`, elle remplace entièrement la map `direct` racine (aucune fusion profonde). La recherche du prompt s’exécute ensuite sur la map unique résultante :

1. **Prompt système spécifique au direct** (`direct["<peerId>"].systemPrompt`) : utilisé si l’entrée du pair spécifique définit un `systemPrompt`.
2. **Prompt système générique pour les directs** (`direct["*"].systemPrompt`) : utilisé lorsque l’entrée du pair spécifique est absente ou ne définit pas de `systemPrompt`.

Remarque : `dms` reste le compartiment léger de remplacement d’historique par message privé (`dms.<id>.historyLimit`) ; les remplacements de prompt se trouvent sous `direct`.

**Différence par rapport au comportement multi-compte de Telegram :** dans Telegram, la racine `groups` est volontairement supprimée pour tous les comptes dans une configuration multi-compte — même pour les comptes qui ne définissent pas leurs propres `groups` — afin d’empêcher un bot de recevoir des messages de groupe pour des groupes auxquels il n’appartient pas. WhatsApp n’applique pas cette protection : la racine `groups` et la racine `direct` sont toujours héritées par les comptes qui ne définissent pas de remplacement au niveau du compte, quel que soit le nombre de comptes configurés. Dans une configuration WhatsApp multi-compte, si vous souhaitez des prompts de groupe ou directs par compte, définissez la map complète sous chaque compte explicitement au lieu de vous appuyer sur des valeurs par défaut au niveau racine.

Comportement important :

- `channels.whatsapp.groups` est à la fois une map de configuration par groupe et la liste d’autorisation des groupes au niveau du chat. À la racine comme au niveau du compte, `groups["*"]` signifie « tous les groupes sont admis » pour cette portée.
- N’ajoutez un `systemPrompt` générique de groupe que si vous souhaitez déjà que cette portée admette tous les groupes. Si vous voulez seulement qu’un ensemble fixe d’identifiants de groupe soit admissible, n’utilisez pas `groups["*"]` comme valeur par défaut du prompt. Répétez plutôt le prompt sur chaque entrée de groupe explicitement autorisée.
- L’admission du groupe et l’autorisation de l’expéditeur sont des vérifications distinctes. `groups["*"]` élargit l’ensemble des groupes pouvant atteindre le traitement de groupe, mais n’autorise pas à lui seul tous les expéditeurs de ces groupes. L’accès des expéditeurs est toujours contrôlé séparément par `channels.whatsapp.groupPolicy` et `channels.whatsapp.groupAllowFrom`.
- `channels.whatsapp.direct` n’a pas le même effet secondaire pour les messages privés. `direct["*"]` ne fournit qu’une configuration de discussion directe par défaut une fois qu’un message privé a déjà été admis par `dmPolicy` plus `allowFrom` ou les règles du magasin d’appairage.

Exemple :

```json5
{
  channels: {
    whatsapp: {
      groups: {
        // À utiliser uniquement si tous les groupes doivent être admis à la portée racine.
        // S’applique à tous les comptes qui ne définissent pas leur propre map groups.
        "*": { systemPrompt: "Default prompt for all groups." },
      },
      direct: {
        // S’applique à tous les comptes qui ne définissent pas leur propre map direct.
        "*": { systemPrompt: "Default prompt for all direct chats." },
      },
      accounts: {
        work: {
          groups: {
            // Ce compte définit ses propres groups, donc les groups racine sont
            // entièrement remplacés. Pour conserver un joker, définissez aussi "*" explicitement ici.
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "Focus on project management.",
            },
            // À utiliser uniquement si tous les groupes doivent être admis dans ce compte.
            "*": { systemPrompt: "Default prompt for work groups." },
          },
          direct: {
            // Ce compte définit sa propre map direct, donc les entrées direct racine sont
            // entièrement remplacées. Pour conserver un joker, définissez aussi "*" explicitement ici.
            "+15551234567": { systemPrompt: "Prompt for a specific work direct chat." },
            "*": { systemPrompt: "Default prompt for work direct chats." },
          },
        },
      },
    },
  },
}
```

## Pointeurs vers la référence de configuration

Référence principale :

- [Référence de configuration - WhatsApp](/fr/gateway/configuration-reference#whatsapp)

Champs WhatsApp à fort impact :

- accès : `dmPolicy`, `allowFrom`, `groupPolicy`, `groupAllowFrom`, `groups`
- livraison : `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `sendReadReceipts`, `ackReaction`, `reactionLevel`
- multi-compte : `accounts.<id>.enabled`, `accounts.<id>.authDir`, remplacements au niveau du compte
- opérations : `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`
- comportement de session : `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- prompts : `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## Liens associés

- [Pairing](/fr/channels/pairing)
- [Groups](/fr/channels/groups)
- [Security](/fr/gateway/security)
- [Routage des canaux](/fr/channels/channel-routing)
- [Routage multi-agent](/fr/concepts/multi-agent)
- [Dépannage](/fr/channels/troubleshooting)
