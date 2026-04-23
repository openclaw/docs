---
read_when:
    - Travailler sur le comportement du canal WhatsApp/web ou le routage de la boîte de réception
summary: Prise en charge du canal WhatsApp, contrôles d’accès, comportement de livraison et opérations
title: WhatsApp
x-i18n:
    generated_at: "2026-04-23T06:59:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: e14735a33ffb48334b920a5e63645abf3445f56481b1ce8b7c128800e2adc981
    source_path: channels/whatsapp.md
    workflow: 15
---

# WhatsApp (canal Web)

Statut : prêt pour la production via WhatsApp Web (Baileys). La Gateway gère les sessions liées.

## Installation (à la demande)

- L’onboarding (`openclaw onboard`) et `openclaw channels add --channel whatsapp`
  proposent d’installer le plugin WhatsApp la première fois que vous le sélectionnez.
- `openclaw channels login --channel whatsapp` propose également le flux d’installation lorsque
  le plugin n’est pas encore présent.
- Canal de développement + extraction git : utilise par défaut le chemin du plugin local.
- Stable/Beta : utilise par défaut le package npm `@openclaw/whatsapp`.

L’installation manuelle reste disponible :

```bash
openclaw plugins install @openclaw/whatsapp
```

<CardGroup cols={3}>
  <Card title="Association" icon="link" href="/fr/channels/pairing">
    La politique par défaut des messages privés est l’association pour les expéditeurs inconnus.
  </Card>
  <Card title="Dépannage des canaux" icon="wrench" href="/fr/channels/troubleshooting">
    Diagnostics inter-canaux et guides de réparation.
  </Card>
  <Card title="Configuration de la Gateway" icon="settings" href="/fr/gateway/configuration">
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

  <Step title="Démarrer la Gateway">

```bash
openclaw gateway
```

  </Step>

  <Step title="Approuver la première demande d’association (si vous utilisez le mode association)">

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    Les demandes d’association expirent après 1 heure. Les demandes en attente sont limitées à 3 par canal.

  </Step>
</Steps>

<Note>
OpenClaw recommande d’utiliser WhatsApp avec un numéro distinct lorsque c’est possible. (Les métadonnées du canal et le flux de configuration sont optimisés pour cette configuration, mais les configurations avec numéro personnel sont également prises en charge.)
</Note>

## Modèles de déploiement

<AccordionGroup>
  <Accordion title="Numéro dédié (recommandé)">
    Il s’agit du mode opérationnel le plus propre :

    - identité WhatsApp distincte pour OpenClaw
    - listes d’autorisation de messages privés et limites de routage plus claires
    - risque plus faible de confusion avec les discussions avec soi-même

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

  <Accordion title="Repli vers un numéro personnel">
    L’onboarding prend en charge le mode numéro personnel et écrit une base adaptée aux discussions avec soi-même :

    - `dmPolicy: "allowlist"`
    - `allowFrom` inclut votre numéro personnel
    - `selfChatMode: true`

    À l’exécution, les protections pour les discussions avec soi-même s’appuient sur le numéro personnel lié et `allowFrom`.

  </Accordion>

  <Accordion title="Portée du canal WhatsApp Web uniquement">
    Le canal de plateforme de messagerie est basé sur WhatsApp Web (`Baileys`) dans l’architecture actuelle des canaux OpenClaw.

    Il n’existe pas de canal de messagerie WhatsApp Twilio distinct dans le registre intégré des canaux de discussion.

  </Accordion>
</AccordionGroup>

## Modèle d’exécution

- La Gateway gère la socket WhatsApp et la boucle de reconnexion.
- Les envois sortants nécessitent un écouteur WhatsApp actif pour le compte cible.
- Les discussions de statut et de diffusion sont ignorées (`@status`, `@broadcast`).
- Les discussions directes utilisent les règles de session des messages privés (`session.dmScope` ; par défaut, `main` regroupe les messages privés dans la session principale de l’agent).
- Les sessions de groupe sont isolées (`agent:<agentId>:whatsapp:group:<jid>`).
- Le transport WhatsApp Web respecte les variables d’environnement proxy standard sur l’hôte de la Gateway (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY` / variantes en minuscules). Préférez une configuration proxy au niveau de l’hôte plutôt que des paramètres proxy WhatsApp spécifiques au canal.

## Contrôle d’accès et activation

<Tabs>
  <Tab title="Politique des messages privés">
    `channels.whatsapp.dmPolicy` contrôle l’accès aux discussions directes :

    - `pairing` (par défaut)
    - `allowlist`
    - `open` (nécessite que `allowFrom` inclue `"*"`)
    - `disabled`

    `allowFrom` accepte des numéros au format E.164 (normalisés en interne).

    Remplacement multi-comptes : `channels.whatsapp.accounts.<id>.dmPolicy` (et `allowFrom`) ont priorité sur les valeurs par défaut au niveau du canal pour ce compte.

    Détails du comportement à l’exécution :

    - les associations sont conservées dans le magasin d’autorisation du canal et fusionnées avec `allowFrom` configuré
    - si aucune liste d’autorisation n’est configurée, le numéro personnel lié est autorisé par défaut
    - les messages privés sortants `fromMe` ne sont jamais associés automatiquement

  </Tab>

  <Tab title="Politique de groupe + listes d’autorisation">
    L’accès au groupe comporte deux couches :

    1. **Liste d’autorisation des appartenances aux groupes** (`channels.whatsapp.groups`)
       - si `groups` est omis, tous les groupes sont admissibles
       - si `groups` est présent, il agit comme une liste d’autorisation de groupes (`"*"` autorisé)

    2. **Politique des expéditeurs de groupe** (`channels.whatsapp.groupPolicy` + `groupAllowFrom`)
       - `open` : la liste d’autorisation des expéditeurs est contournée
       - `allowlist` : l’expéditeur doit correspondre à `groupAllowFrom` (ou `*`)
       - `disabled` : bloquer toutes les entrées de groupe

    Repli de liste d’autorisation des expéditeurs :

    - si `groupAllowFrom` n’est pas défini, l’exécution se replie sur `allowFrom` lorsqu’il est disponible
    - les listes d’autorisation des expéditeurs sont évaluées avant l’activation par mention/réponse

    Remarque : si aucun bloc `channels.whatsapp` n’existe du tout, le repli de politique de groupe à l’exécution est `allowlist` (avec un avertissement dans les journaux), même si `channels.defaults.groupPolicy` est défini.

  </Tab>

  <Tab title="Mentions + /activation">
    Les réponses de groupe nécessitent une mention par défaut.

    La détection de mention comprend :

    - les mentions explicites WhatsApp de l’identité du bot
    - les modèles regex de mention configurés (`agents.list[].groupChat.mentionPatterns`, avec repli sur `messages.groupChat.mentionPatterns`)
    - la détection implicite de réponse au bot (l’expéditeur de la réponse correspond à l’identité du bot)

    Remarque de sécurité :

    - la citation/réponse satisfait seulement la condition de contrôle par mention ; elle n’accorde **pas** d’autorisation à l’expéditeur
    - avec `groupPolicy: "allowlist"`, les expéditeurs non autorisés sont toujours bloqués même s’ils répondent au message d’un utilisateur autorisé

    Commande d’activation au niveau de la session :

    - `/activation mention`
    - `/activation always`

    `activation` met à jour l’état de la session (pas la configuration globale). Elle est réservée au propriétaire.

  </Tab>
</Tabs>

## Comportement avec numéro personnel et discussion avec soi-même

Lorsque le numéro personnel lié est également présent dans `allowFrom`, les protections de discussion avec soi-même de WhatsApp s’activent :

- ignorer les accusés de lecture pour les tours de discussion avec soi-même
- ignorer le comportement de déclenchement automatique par mention-JID qui vous notifierait autrement
- si `messages.responsePrefix` n’est pas défini, les réponses aux discussions avec soi-même utilisent par défaut `[{identity.name}]` ou `[openclaw]`

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

  <Accordion title="Espaces réservés média et extraction des emplacements/contacts">
    Les messages entrants composés uniquement de médias sont normalisés avec des espaces réservés tels que :

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

    Désactiver globalement :

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

    Les tours de discussion avec soi-même ignorent les accusés de lecture même lorsqu’ils sont activés globalement.

  </Accordion>
</AccordionGroup>

## Livraison, segmentation et médias

<AccordionGroup>
  <Accordion title="Segmentation du texte">
    - limite de segment par défaut : `channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - le mode `newline` privilégie les limites de paragraphe (lignes vides), puis se replie sur une segmentation sûre selon la longueur
  </Accordion>

  <Accordion title="Comportement des médias sortants">
    - prend en charge les charges utiles image, vidéo, audio (note vocale PTT) et document
    - `audio/ogg` est réécrit en `audio/ogg; codecs=opus` pour la compatibilité avec les notes vocales
    - la lecture des GIF animés est prise en charge via `gifPlayback: true` lors des envois vidéo
    - les légendes sont appliquées au premier élément média lors de l’envoi de charges utiles de réponse multi-médias
    - la source média peut être HTTP(S), `file://` ou des chemins locaux
  </Accordion>

  <Accordion title="Limites de taille des médias et comportement de repli">
    - plafond de sauvegarde des médias entrants : `channels.whatsapp.mediaMaxMb` (par défaut `50`)
    - plafond d’envoi des médias sortants : `channels.whatsapp.mediaMaxMb` (par défaut `50`)
    - les remplacements par compte utilisent `channels.whatsapp.accounts.<accountId>.mediaMaxMb`
    - les images sont automatiquement optimisées (redimensionnement/balayage de qualité) pour respecter les limites
    - en cas d’échec de l’envoi d’un média, le repli sur le premier élément envoie un avertissement texte au lieu d’abandonner silencieusement la réponse
  </Accordion>
</AccordionGroup>

## Citation des réponses

WhatsApp prend en charge la citation native des réponses, où les réponses sortantes citent visiblement le message entrant. Contrôlez-la avec `channels.whatsapp.replyToMode`.

| Value    | Comportement                                                                       |
| -------- | ---------------------------------------------------------------------------------- |
| `"auto"` | Citer le message entrant lorsque le fournisseur le prend en charge ; sinon ne pas citer |
| `"on"`   | Toujours citer le message entrant ; se replier sur un envoi simple si la citation est rejetée |
| `"off"`  | Ne jamais citer ; envoyer comme message simple                                     |

La valeur par défaut est `"auto"`. Les remplacements par compte utilisent `channels.whatsapp.accounts.<id>.replyToMode`.

```json5
{
  channels: {
    whatsapp: {
      replyToMode: "on",
    },
  },
}
```

## Niveau de réaction

`channels.whatsapp.reactionLevel` contrôle dans quelle mesure l’agent utilise des réactions emoji sur WhatsApp :

| Level         | Réactions d’accusé | Réactions initiées par l’agent | Description                                         |
| ------------- | ------------------ | ------------------------------ | --------------------------------------------------- |
| `"off"`       | Non                | Non                            | Aucune réaction                                     |
| `"ack"`       | Oui                | Non                            | Réactions d’accusé uniquement (accusé avant réponse) |
| `"minimal"`   | Oui                | Oui (conservatrices)           | Accusés + réactions de l’agent avec consignes prudentes |
| `"extensive"` | Oui                | Oui (encouragées)              | Accusés + réactions de l’agent avec consignes encourageantes |

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

- envoyée immédiatement après l’acceptation du message entrant (avant la réponse)
- les échecs sont consignés dans les journaux mais ne bloquent pas la livraison normale de la réponse
- le mode de groupe `mentions` réagit sur les tours déclenchés par mention ; l’activation de groupe `always` agit comme contournement de cette vérification
- WhatsApp utilise `channels.whatsapp.ackReaction` (l’ancien `messages.ackReaction` n’est pas utilisé ici)

## Multi-comptes et identifiants

<AccordionGroup>
  <Accordion title="Sélection du compte et valeurs par défaut">
    - les ID de compte proviennent de `channels.whatsapp.accounts`
    - sélection du compte par défaut : `default` s’il est présent, sinon le premier ID de compte configuré (trié)
    - les ID de compte sont normalisés en interne pour la recherche
  </Accordion>

  <Accordion title="Chemins des identifiants et compatibilité héritée">
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
- Contrôles d’action :
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

    Si nécessaire, reliez-le avec `channels login`.

  </Accordion>

  <Accordion title="Aucun écouteur actif lors de l’envoi">
    Les envois sortants échouent immédiatement lorsqu’aucun écouteur Gateway actif n’existe pour le compte cible.

    Assurez-vous que la Gateway est en cours d’exécution et que le compte est lié.

  </Accordion>

  <Accordion title="Messages de groupe ignorés de manière inattendue">
    Vérifiez dans cet ordre :

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - les entrées de liste d’autorisation `groups`
    - le contrôle par mention (`requireMention` + modèles de mention)
    - les clés dupliquées dans `openclaw.json` (JSON5) : les entrées ultérieures remplacent les précédentes, donc conservez un seul `groupPolicy` par portée

  </Accordion>

  <Accordion title="Avertissement d’exécution Bun">
    L’exécution de la Gateway WhatsApp doit utiliser Node. Bun est signalé comme incompatible avec le fonctionnement stable de la Gateway WhatsApp/Telegram.
  </Accordion>
</AccordionGroup>

## Prompts système

WhatsApp prend en charge les prompts système de type Telegram pour les groupes et les discussions directes via les maps `groups` et `direct`.

Hiérarchie de résolution pour les messages de groupe :

La map `groups` effective est d’abord déterminée : si le compte définit sa propre map `groups`, elle remplace entièrement la map `groups` racine (sans fusion profonde). La recherche de prompt s’exécute ensuite sur la map unique résultante :

1. **Prompt système spécifique au groupe** (`groups["<groupId>"].systemPrompt`) : utilisé si l’entrée du groupe spécifique définit un `systemPrompt`.
2. **Prompt système générique de groupe** (`groups["*"].systemPrompt`) : utilisé lorsque l’entrée du groupe spécifique est absente ou ne définit pas de `systemPrompt`.

Hiérarchie de résolution pour les messages directs :

La map `direct` effective est d’abord déterminée : si le compte définit sa propre map `direct`, elle remplace entièrement la map `direct` racine (sans fusion profonde). La recherche de prompt s’exécute ensuite sur la map unique résultante :

1. **Prompt système spécifique au direct** (`direct["<peerId>"].systemPrompt`) : utilisé si l’entrée du pair spécifique définit un `systemPrompt`.
2. **Prompt système générique direct** (`direct["*"].systemPrompt`) : utilisé lorsque l’entrée spécifique du pair est absente ou ne définit pas de `systemPrompt`.

Remarque : `dms` reste le compartiment léger de remplacement d’historique par message privé (`dms.<id>.historyLimit`) ; les remplacements de prompt se trouvent sous `direct`.

**Différence par rapport au comportement multi-comptes de Telegram :** Dans Telegram, `groups` à la racine est volontairement supprimé pour tous les comptes dans une configuration multi-comptes — même les comptes qui ne définissent pas leur propre `groups` — afin d’empêcher un bot de recevoir des messages de groupe pour des groupes auxquels il n’appartient pas. WhatsApp n’applique pas cette protection : `groups` et `direct` à la racine sont toujours hérités par les comptes qui ne définissent aucun remplacement au niveau du compte, quel que soit le nombre de comptes configurés. Dans une configuration WhatsApp multi-comptes, si vous souhaitez des prompts de groupe ou directs par compte, définissez explicitement la map complète sous chaque compte au lieu de vous appuyer sur les valeurs par défaut au niveau racine.

Comportement important :

- `channels.whatsapp.groups` est à la fois une map de configuration par groupe et la liste d’autorisation de groupe au niveau de la discussion. À la racine ou à la portée du compte, `groups["*"]` signifie « tous les groupes sont admis » pour cette portée.
- Ajoutez un `systemPrompt` générique de groupe uniquement si vous souhaitez déjà que cette portée admette tous les groupes. Si vous souhaitez toujours que seul un ensemble fixe d’ID de groupe soit admissible, n’utilisez pas `groups["*"]` pour le prompt par défaut. Répétez plutôt le prompt sur chaque entrée de groupe explicitement autorisée.
- L’admission au groupe et l’autorisation de l’expéditeur sont des vérifications distinctes. `groups["*"]` élargit l’ensemble des groupes pouvant atteindre le traitement de groupe, mais n’autorise pas à lui seul tous les expéditeurs de ces groupes. L’accès des expéditeurs reste contrôlé séparément par `channels.whatsapp.groupPolicy` et `channels.whatsapp.groupAllowFrom`.
- `channels.whatsapp.direct` n’a pas le même effet secondaire pour les messages privés. `direct["*"]` fournit uniquement une configuration de discussion directe par défaut après qu’un message privé a déjà été admis par `dmPolicy` plus `allowFrom` ou les règles du magasin d’association.

Exemple :

```json5
{
  channels: {
    whatsapp: {
      groups: {
        // À utiliser uniquement si tous les groupes doivent être admis à la portée racine.
        // S’applique à tous les comptes qui ne définissent pas leur propre map groups.
        "*": { systemPrompt: "Prompt par défaut pour tous les groupes." },
      },
      direct: {
        // S’applique à tous les comptes qui ne définissent pas leur propre map direct.
        "*": { systemPrompt: "Prompt par défaut pour toutes les discussions directes." },
      },
      accounts: {
        work: {
          groups: {
            // Ce compte définit ses propres groups, donc les groups racine sont
            // entièrement remplacés. Pour conserver un joker, définissez aussi "*" explicitement ici.
            "120363406415684625@g.us": {
              requireMention: false,
              systemPrompt: "Se concentrer sur la gestion de projet.",
            },
            // À utiliser uniquement si tous les groupes doivent être admis dans ce compte.
            "*": { systemPrompt: "Prompt par défaut pour les groupes de travail." },
          },
          direct: {
            // Ce compte définit sa propre map direct, donc les entrées direct racine sont
            // entièrement remplacées. Pour conserver un joker, définissez aussi "*" explicitement ici.
            "+15551234567": { systemPrompt: "Prompt pour une discussion directe de travail spécifique." },
            "*": { systemPrompt: "Prompt par défaut pour les discussions directes de travail." },
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
- multi-comptes : `accounts.<id>.enabled`, `accounts.<id>.authDir`, remplacements au niveau du compte
- opérations : `configWrites`, `debounceMs`, `web.enabled`, `web.heartbeatSeconds`, `web.reconnect.*`
- comportement de session : `session.dmScope`, `historyLimit`, `dmHistoryLimit`, `dms.<id>.historyLimit`
- prompts : `groups.<id>.systemPrompt`, `groups["*"].systemPrompt`, `direct.<id>.systemPrompt`, `direct["*"].systemPrompt`

## Connexe

- [Association](/fr/channels/pairing)
- [Groupes](/fr/channels/groups)
- [Sécurité](/fr/gateway/security)
- [Routage des canaux](/fr/channels/channel-routing)
- [Routage multi-agents](/fr/concepts/multi-agent)
- [Dépannage](/fr/channels/troubleshooting)
