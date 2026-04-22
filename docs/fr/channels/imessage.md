---
read_when:
    - Configurer la prise en charge d’iMessage
    - Débogage de l’envoi/de la réception d’iMessage
summary: Prise en charge héritée d’iMessage via imsg (JSON-RPC sur stdio). Les nouvelles configurations doivent utiliser BlueBubbles.
title: iMessage
x-i18n:
    generated_at: "2026-04-22T04:20:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: fb9cc5a0bd4fbc7ff6f792e737bc4302a67f9ab6aa8231ff6f751fe6d732ca5d
    source_path: channels/imessage.md
    workflow: 15
---

# iMessage (hérité : imsg)

<Warning>
Pour les nouveaux déploiements iMessage, utilisez <a href="/fr/channels/bluebubbles">BlueBubbles</a>.

L’intégration `imsg` est héritée et peut être supprimée dans une future version.
</Warning>

Statut : intégration CLI externe héritée. Gateway lance `imsg rpc` et communique via JSON-RPC sur stdio (sans daemon/port séparé).

<CardGroup cols={3}>
  <Card title="BlueBubbles (recommandé)" icon="message-circle" href="/fr/channels/bluebubbles">
    Voie iMessage privilégiée pour les nouvelles configurations.
  </Card>
  <Card title="Appairage" icon="link" href="/fr/channels/pairing">
    Les messages privés iMessage utilisent par défaut le mode d’appairage.
  </Card>
  <Card title="Référence de configuration" icon="settings" href="/fr/gateway/configuration-reference#imessage">
    Référence complète des champs iMessage.
  </Card>
</CardGroup>

## Configuration rapide

<Tabs>
  <Tab title="Mac local (voie rapide)">
    <Steps>
      <Step title="Installer et vérifier imsg">

```bash
brew install steipete/tap/imsg
imsg rpc --help
```

      </Step>

      <Step title="Configurer OpenClaw">

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "/usr/local/bin/imsg",
      dbPath: "/Users/user/Library/Messages/chat.db",
    },
  },
}
```

      </Step>

      <Step title="Démarrer gateway">

```bash
openclaw gateway
```

      </Step>

      <Step title="Approuver le premier appairage de message privé (dmPolicy par défaut)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        Les demandes d’appairage expirent après 1 heure.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Mac distant via SSH">
    OpenClaw ne requiert qu’un `cliPath` compatible stdio, vous pouvez donc faire pointer `cliPath` vers un script wrapper qui se connecte en SSH à un Mac distant et exécute `imsg`.

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

    Configuration recommandée lorsque les pièces jointes sont activées :

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "~/.openclaw/scripts/imsg-ssh",
      remoteHost: "user@gateway-host", // utilisé pour les récupérations de pièces jointes via SCP
      includeAttachments: true,
      // Facultatif : remplace les racines de pièces jointes autorisées.
      // Par défaut : /Users/*/Library/Messages/Attachments
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    Si `remoteHost` n’est pas défini, OpenClaw tente de le détecter automatiquement en analysant le script wrapper SSH.
    `remoteHost` doit être `host` ou `user@host` (sans espaces ni options SSH).
    OpenClaw utilise une vérification stricte de la clé d’hôte pour SCP, la clé d’hôte du relais doit donc déjà exister dans `~/.ssh/known_hosts`.
    Les chemins des pièces jointes sont validés par rapport aux racines autorisées (`attachmentRoots` / `remoteAttachmentRoots`).

  </Tab>
</Tabs>

## Exigences et autorisations (macOS)

- Messages doit être connecté sur le Mac qui exécute `imsg`.
- L’accès complet au disque est requis pour le contexte de processus exécutant OpenClaw/`imsg` (accès à la base de données de Messages).
- L’autorisation Automation est requise pour envoyer des messages via Messages.app.

<Tip>
Les autorisations sont accordées par contexte de processus. Si gateway s’exécute sans interface (LaunchAgent/SSH), lancez une commande interactive unique dans ce même contexte pour déclencher les invites :

```bash
imsg chats --limit 1
# ou
imsg send <handle> "test"
```

</Tip>

## Contrôle d’accès et routage

<Tabs>
  <Tab title="Politique des messages privés">
    `channels.imessage.dmPolicy` contrôle les messages directs :

    - `pairing` (par défaut)
    - `allowlist`
    - `open` (nécessite que `allowFrom` inclue `"*"`)
    - `disabled`

    Champ de liste d’autorisation : `channels.imessage.allowFrom`.

    Les entrées de la liste d’autorisation peuvent être des identifiants ou des cibles de conversation (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`).

  </Tab>

  <Tab title="Politique des groupes + mentions">
    `channels.imessage.groupPolicy` contrôle la gestion des groupes :

    - `allowlist` (par défaut lorsqu’il est configuré)
    - `open`
    - `disabled`

    Liste d’autorisation des expéditeurs de groupe : `channels.imessage.groupAllowFrom`.

    Repli à l’exécution : si `groupAllowFrom` n’est pas défini, les vérifications d’expéditeur de groupe iMessage se replient sur `allowFrom` lorsqu’il est disponible.
    Remarque d’exécution : si `channels.imessage` est complètement absent, l’exécution se replie sur `groupPolicy="allowlist"` et consigne un avertissement (même si `channels.defaults.groupPolicy` est défini).

    Filtrage par mention pour les groupes :

    - iMessage n’a pas de métadonnées de mention natives
    - la détection des mentions utilise des motifs regex (`agents.list[].groupChat.mentionPatterns`, repli sur `messages.groupChat.mentionPatterns`)
    - sans motifs configurés, le filtrage par mention ne peut pas être appliqué

    Les commandes de contrôle provenant d’expéditeurs autorisés peuvent contourner le filtrage par mention dans les groupes.

  </Tab>

  <Tab title="Sessions et réponses déterministes">
    - Les messages privés utilisent le routage direct ; les groupes utilisent le routage de groupe.
    - Avec le `session.dmScope=main` par défaut, les messages privés iMessage sont regroupés dans la session principale de l’agent.
    - Les sessions de groupe sont isolées (`agent:<agentId>:imessage:group:<chat_id>`).
    - Les réponses sont renvoyées vers iMessage à l’aide des métadonnées du canal/de la cible d’origine.

    Comportement des fils de discussion de type groupe :

    Certains fils iMessage à plusieurs participants peuvent arriver avec `is_group=false`.
    Si ce `chat_id` est explicitement configuré sous `channels.imessage.groups`, OpenClaw le traite comme du trafic de groupe (filtrage de groupe + isolation de session de groupe).

  </Tab>
</Tabs>

## Liaisons de conversation ACP

Les conversations iMessage héritées peuvent également être liées à des sessions ACP.

Flux opérateur rapide :

- Exécutez `/acp spawn codex --bind here` dans le message privé ou le groupe autorisé.
- Les messages futurs dans cette même conversation iMessage seront routés vers la session ACP lancée.
- `/new` et `/reset` réinitialisent sur place cette même session ACP liée.
- `/acp close` ferme la session ACP et supprime la liaison.

Les liaisons persistantes configurées sont prises en charge via des entrées `bindings[]` de premier niveau avec `type: "acp"` et `match.channel: "imessage"`.

`match.peer.id` peut utiliser :

- un identifiant normalisé de message privé tel que `+15555550123` ou `user@example.com`
- `chat_id:<id>` (recommandé pour des liaisons de groupe stables)
- `chat_guid:<guid>`
- `chat_identifier:<identifier>`

Exemple :

```json5
{
  agents: {
    list: [
      {
        id: "codex",
        runtime: {
          type: "acp",
          acp: { agent: "codex", backend: "acpx", mode: "persistent" },
        },
      },
    ],
  },
  bindings: [
    {
      type: "acp",
      agentId: "codex",
      match: {
        channel: "imessage",
        accountId: "default",
        peer: { kind: "group", id: "chat_id:123" },
      },
      acp: { label: "codex-group" },
    },
  ],
}
```

Voir [Agents ACP](/fr/tools/acp-agents) pour le comportement partagé des liaisons ACP.

## Modèles de déploiement

<AccordionGroup>
  <Accordion title="Utilisateur macOS de bot dédié (identité iMessage séparée)">
    Utilisez un Apple ID et un utilisateur macOS dédiés afin que le trafic du bot soit isolé de votre profil Messages personnel.

    Flux typique :

    1. Créez/connectez un utilisateur macOS dédié.
    2. Connectez-vous à Messages avec l’Apple ID du bot dans cet utilisateur.
    3. Installez `imsg` pour cet utilisateur.
    4. Créez un wrapper SSH afin qu’OpenClaw puisse exécuter `imsg` dans le contexte de cet utilisateur.
    5. Faites pointer `channels.imessage.accounts.<id>.cliPath` et `.dbPath` vers le profil de cet utilisateur.

    La première exécution peut nécessiter des approbations via l’interface graphique (Automation + accès complet au disque) dans la session de cet utilisateur de bot.

  </Accordion>

  <Accordion title="Mac distant via Tailscale (exemple)">
    Topologie courante :

    - gateway s’exécute sur Linux/VM
    - iMessage + `imsg` s’exécute sur un Mac dans votre tailnet
    - le wrapper `cliPath` utilise SSH pour exécuter `imsg`
    - `remoteHost` active les récupérations de pièces jointes via SCP

    Exemple :

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "~/.openclaw/scripts/imsg-ssh",
      remoteHost: "bot@mac-mini.tailnet-1234.ts.net",
      includeAttachments: true,
      dbPath: "/Users/bot/Library/Messages/chat.db",
    },
  },
}
```

```bash
#!/usr/bin/env bash
exec ssh -T bot@mac-mini.tailnet-1234.ts.net imsg "$@"
```

    Utilisez des clés SSH afin que SSH et SCP soient tous deux non interactifs.
    Assurez-vous d’abord que la clé d’hôte est approuvée (par exemple `ssh bot@mac-mini.tailnet-1234.ts.net`) afin que `known_hosts` soit renseigné.

  </Accordion>

  <Accordion title="Modèle multi-comptes">
    iMessage prend en charge une configuration par compte sous `channels.imessage.accounts`.

    Chaque compte peut remplacer des champs comme `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, les paramètres d’historique et les listes d’autorisation des racines de pièces jointes.

  </Accordion>
</AccordionGroup>

## Médias, segmentation et cibles de livraison

<AccordionGroup>
  <Accordion title="Pièces jointes et médias">
    - l’ingestion des pièces jointes entrantes est facultative : `channels.imessage.includeAttachments`
    - les chemins de pièces jointes distantes peuvent être récupérés via SCP lorsque `remoteHost` est défini
    - les chemins de pièces jointes doivent correspondre aux racines autorisées :
      - `channels.imessage.attachmentRoots` (local)
      - `channels.imessage.remoteAttachmentRoots` (mode SCP distant)
      - motif de racine par défaut : `/Users/*/Library/Messages/Attachments`
    - SCP utilise une vérification stricte de la clé d’hôte (`StrictHostKeyChecking=yes`)
    - la taille des médias sortants utilise `channels.imessage.mediaMaxMb` (16 Mo par défaut)
  </Accordion>

  <Accordion title="Segmentation sortante">
    - limite des segments de texte : `channels.imessage.textChunkLimit` (4000 par défaut)
    - mode de segmentation : `channels.imessage.chunkMode`
      - `length` (par défaut)
      - `newline` (division d’abord par paragraphes)
  </Accordion>

  <Accordion title="Formats d’adressage">
    Cibles explicites recommandées :

    - `chat_id:123` (recommandé pour un routage stable)
    - `chat_guid:...`
    - `chat_identifier:...`

    Les cibles par identifiant sont également prises en charge :

    - `imessage:+1555...`
    - `sms:+1555...`
    - `user@example.com`

```bash
imsg chats --limit 20
```

  </Accordion>
</AccordionGroup>

## Écritures de configuration

iMessage autorise par défaut les écritures de configuration initiées par le canal (pour `/config set|unset` lorsque `commands.config: true`).

Désactiver :

```json5
{
  channels: {
    imessage: {
      configWrites: false,
    },
  },
}
```

## Dépannage

<AccordionGroup>
  <Accordion title="imsg introuvable ou RPC non pris en charge">
    Validez le binaire et la prise en charge de RPC :

```bash
imsg rpc --help
openclaw channels status --probe
```

    Si la sonde indique que RPC n’est pas pris en charge, mettez `imsg` à jour.

  </Accordion>

  <Accordion title="Les messages privés sont ignorés">
    Vérifiez :

    - `channels.imessage.dmPolicy`
    - `channels.imessage.allowFrom`
    - les approbations d’appairage (`openclaw pairing list imessage`)

  </Accordion>

  <Accordion title="Les messages de groupe sont ignorés">
    Vérifiez :

    - `channels.imessage.groupPolicy`
    - `channels.imessage.groupAllowFrom`
    - le comportement de liste d’autorisation de `channels.imessage.groups`
    - la configuration des motifs de mention (`agents.list[].groupChat.mentionPatterns`)

  </Accordion>

  <Accordion title="Les pièces jointes distantes échouent">
    Vérifiez :

    - `channels.imessage.remoteHost`
    - `channels.imessage.remoteAttachmentRoots`
    - l’authentification par clé SSH/SCP depuis l’hôte gateway
    - que la clé d’hôte existe dans `~/.ssh/known_hosts` sur l’hôte gateway
    - la lisibilité du chemin distant sur le Mac qui exécute Messages

  </Accordion>

  <Accordion title="Les invites d’autorisation macOS ont été manquées">
    Relancez dans un terminal GUI interactif dans le même contexte utilisateur/session et approuvez les invites :

```bash
imsg chats --limit 1
imsg send <handle> "test"
```

    Confirmez que l’accès complet au disque et Automation sont accordés au contexte de processus qui exécute OpenClaw/`imsg`.

  </Accordion>
</AccordionGroup>

## Pointeurs vers la référence de configuration

- [Référence de configuration - iMessage](/fr/gateway/configuration-reference#imessage)
- [Configuration de Gateway](/fr/gateway/configuration)
- [Appairage](/fr/channels/pairing)
- [BlueBubbles](/fr/channels/bluebubbles)

## Liens connexes

- [Vue d’ensemble des canaux](/fr/channels) — tous les canaux pris en charge
- [Appairage](/fr/channels/pairing) — authentification des messages privés et flux d’appairage
- [Groupes](/fr/channels/groups) — comportement des discussions de groupe et filtrage par mention
- [Routage des canaux](/fr/channels/channel-routing) — routage des sessions pour les messages
- [Sécurité](/fr/gateway/security) — modèle d’accès et renforcement
