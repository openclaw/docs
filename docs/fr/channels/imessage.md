---
read_when:
    - Configuration de la prise en charge d’iMessage
    - Débogage de l’envoi/réception iMessage
summary: Prise en charge native d’iMessage via imsg (JSON-RPC sur stdio). À privilégier pour les nouvelles configurations OpenClaw iMessage lorsque les exigences de l’hôte sont satisfaites.
title: iMessage
x-i18n:
    generated_at: "2026-05-07T01:50:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 39a3d6350333292c147d7986568eb539aa8ce562405092b71b8cecbbf7584450
    source_path: channels/imessage.md
    workflow: 16
---

<Note>
Pour les nouveaux déploiements OpenClaw iMessage, commencez ici lorsque vous pouvez exécuter `imsg` sur un hôte macOS Messages connecté. BlueBubbles reste disponible comme solution de repli héritée pour les configurations existantes qui dépendent de son serveur HTTP, de ses webhooks ou d’actions d’API privée plus riches.
</Note>

État : intégration CLI externe native. Gateway lance `imsg rpc` et communique via JSON-RPC sur stdio (aucun démon/port séparé).

<CardGroup cols={3}>
  <Card title="BlueBubbles (solution de repli héritée)" icon="message-circle" href="/fr/channels/bluebubbles">
    Continuez à l’utiliser pour le routage existant basé sur BlueBubbles ; évitez-le pour les nouvelles configurations lorsque imsg convient.
  </Card>
  <Card title="Appairage" icon="link" href="/fr/channels/pairing">
    Les messages directs iMessage utilisent le mode d’appairage par défaut.
  </Card>
  <Card title="Référence de configuration" icon="settings" href="/fr/gateway/config-channels#imessage">
    Référence complète des champs iMessage.
  </Card>
</CardGroup>

## Configuration rapide

<Tabs>
  <Tab title="Mac local (chemin rapide)">
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

      <Step title="Démarrer Gateway">

```bash
openclaw gateway
```

      </Step>

      <Step title="Approuver le premier appairage par message direct (dmPolicy par défaut)">

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        Les demandes d’appairage expirent après 1 heure.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Mac distant via SSH">
    OpenClaw nécessite seulement un `cliPath` compatible stdio ; vous pouvez donc faire pointer `cliPath` vers un script wrapper qui se connecte en SSH à un Mac distant et exécute `imsg`.

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
      remoteHost: "user@gateway-host", // used for SCP attachment fetches
      includeAttachments: true,
      // Optional: override allowed attachment roots.
      // Defaults include /Users/*/Library/Messages/Attachments
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
    },
  },
}
```

    Si `remoteHost` n’est pas défini, OpenClaw tente de le détecter automatiquement en analysant le script wrapper SSH.
    `remoteHost` doit être `host` ou `user@host` (sans espaces ni options SSH).
    OpenClaw utilise une vérification stricte des clés d’hôte pour SCP ; la clé d’hôte du relais doit donc déjà exister dans `~/.ssh/known_hosts`.
    Les chemins des pièces jointes sont validés par rapport aux racines autorisées (`attachmentRoots` / `remoteAttachmentRoots`).

  </Tab>
</Tabs>

## Exigences et autorisations (macOS)

- Messages doit être connecté sur le Mac qui exécute `imsg`.
- L’accès complet au disque est requis pour le contexte de processus exécutant OpenClaw/`imsg` (accès à la base de données Messages).
- L’autorisation d’automatisation est requise pour envoyer des messages via Messages.app.

<Tip>
Les autorisations sont accordées par contexte de processus. Si Gateway s’exécute sans interface (LaunchAgent/SSH), exécutez une commande interactive unique dans ce même contexte pour déclencher les invites :

```bash
imsg chats --limit 1
# or
imsg send <handle> "test"
```

</Tip>

## Contrôle d’accès et routage

<Tabs>
  <Tab title="Politique des messages directs">
    `channels.imessage.dmPolicy` contrôle les messages directs :

    - `pairing` (par défaut)
    - `allowlist`
    - `open` (nécessite que `allowFrom` inclue `"*"`)
    - `disabled`

    Champ de liste d’autorisation : `channels.imessage.allowFrom`.

    Les entrées de liste d’autorisation peuvent être des identifiants ou des cibles de chat (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`).

  </Tab>

  <Tab title="Politique de groupe + mentions">
    `channels.imessage.groupPolicy` contrôle la gestion des groupes :

    - `allowlist` (par défaut lorsque configuré)
    - `open`
    - `disabled`

    Liste d’autorisation des expéditeurs de groupe : `channels.imessage.groupAllowFrom`.

    Repli à l’exécution : si `groupAllowFrom` n’est pas défini, les vérifications d’expéditeur de groupe iMessage se replient sur `allowFrom` lorsqu’il est disponible.
    Note d’exécution : si `channels.imessage` est entièrement absent, l’exécution se replie sur `groupPolicy="allowlist"` et consigne un avertissement (même si `channels.defaults.groupPolicy` est défini).

    Gating par mention pour les groupes :

    - iMessage ne fournit aucune métadonnée native de mention
    - la détection des mentions utilise des motifs regex (`agents.list[].groupChat.mentionPatterns`, repli `messages.groupChat.mentionPatterns`)
    - sans motifs configurés, le gating par mention ne peut pas être appliqué

    Les commandes de contrôle envoyées par des expéditeurs autorisés peuvent contourner le gating par mention dans les groupes.

  </Tab>

  <Tab title="Sessions et réponses déterministes">
    - Les messages directs utilisent le routage direct ; les groupes utilisent le routage de groupe.
    - Avec la valeur par défaut `session.dmScope=main`, les messages directs iMessage sont regroupés dans la session principale de l’agent.
    - Les sessions de groupe sont isolées (`agent:<agentId>:imessage:group:<chat_id>`).
    - Les réponses sont routées vers iMessage à l’aide des métadonnées du canal/de la cible d’origine.

    Comportement des fils assimilables à des groupes :

    Certains fils iMessage à plusieurs participants peuvent arriver avec `is_group=false`.
    Si ce `chat_id` est explicitement configuré sous `channels.imessage.groups`, OpenClaw le traite comme du trafic de groupe (gating de groupe + isolation de session de groupe).

  </Tab>
</Tabs>

## Liaisons de conversation ACP

Les chats iMessage hérités peuvent aussi être liés à des sessions ACP.

Flux opérateur rapide :

- Exécutez `/acp spawn codex --bind here` dans le message direct ou le chat de groupe autorisé.
- Les futurs messages dans cette même conversation iMessage sont routés vers la session ACP créée.
- `/new` et `/reset` réinitialisent sur place la même session ACP liée.
- `/acp close` ferme la session ACP et supprime la liaison.

Les liaisons persistantes configurées sont prises en charge via des entrées `bindings[]` de premier niveau avec `type: "acp"` et `match.channel: "imessage"`.

`match.peer.id` peut utiliser :

- un identifiant de message direct normalisé comme `+15555550123` ou `user@example.com`
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

Consultez [Agents ACP](/fr/tools/acp-agents) pour le comportement partagé des liaisons ACP.

## Modèles de déploiement

<AccordionGroup>
  <Accordion title="Utilisateur macOS dédié au bot (identité iMessage séparée)">
    Utilisez un Apple ID et un utilisateur macOS dédiés afin que le trafic du bot soit isolé de votre profil Messages personnel.

    Flux typique :

    1. Créez/connectez un utilisateur macOS dédié.
    2. Connectez-vous à Messages avec l’Apple ID du bot dans cet utilisateur.
    3. Installez `imsg` dans cet utilisateur.
    4. Créez un wrapper SSH pour qu’OpenClaw puisse exécuter `imsg` dans ce contexte utilisateur.
    5. Faites pointer `channels.imessage.accounts.<id>.cliPath` et `.dbPath` vers ce profil utilisateur.

    La première exécution peut nécessiter des approbations via l’interface graphique (Automatisation + Accès complet au disque) dans la session de cet utilisateur bot.

  </Accordion>

  <Accordion title="Mac distant via Tailscale (exemple)">
    Topologie courante :

    - Gateway s’exécute sur Linux/VM
    - iMessage + `imsg` s’exécute sur un Mac dans votre tailnet
    - le wrapper `cliPath` utilise SSH pour exécuter `imsg`
    - `remoteHost` active la récupération des pièces jointes via SCP

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

  <Accordion title="Modèle multi-compte">
    iMessage prend en charge la configuration par compte sous `channels.imessage.accounts`.

    Chaque compte peut remplacer des champs tels que `cliPath`, `dbPath`, `allowFrom`, `groupPolicy`, `mediaMaxMb`, les paramètres d’historique et les listes d’autorisation de racines de pièces jointes.

  </Accordion>
</AccordionGroup>

## Médias, découpage et cibles de livraison

<AccordionGroup>
  <Accordion title="Pièces jointes et médias">
    - l’ingestion des pièces jointes entrantes est facultative : `channels.imessage.includeAttachments`
    - les chemins des pièces jointes distantes peuvent être récupérés via SCP lorsque `remoteHost` est défini
    - les chemins des pièces jointes doivent correspondre aux racines autorisées :
      - `channels.imessage.attachmentRoots` (local)
      - `channels.imessage.remoteAttachmentRoots` (mode SCP distant)
      - motif de racine par défaut : `/Users/*/Library/Messages/Attachments`
    - SCP utilise une vérification stricte des clés d’hôte (`StrictHostKeyChecking=yes`)
    - la taille des médias sortants utilise `channels.imessage.mediaMaxMb` (16 Mo par défaut)

  </Accordion>

  <Accordion title="Découpage sortant">
    - limite de découpage du texte : `channels.imessage.textChunkLimit` (4000 par défaut)
    - mode de découpage : `channels.imessage.chunkMode`
      - `length` (par défaut)
      - `newline` (division privilégiant les paragraphes)

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
    Validez le binaire et la prise en charge RPC :

```bash
imsg rpc --help
openclaw channels status --probe
```

    Si la sonde signale que RPC n’est pas pris en charge, mettez à jour `imsg`.

  </Accordion>

  <Accordion title="Les messages directs sont ignorés">
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
    - l’authentification par clé SSH/SCP depuis l’hôte Gateway
    - la clé d’hôte existe dans `~/.ssh/known_hosts` sur l’hôte Gateway
    - la lisibilité du chemin distant sur le Mac exécutant Messages

  </Accordion>

  <Accordion title="Les invites d’autorisation macOS ont été manquées">
    Réexécutez dans un terminal GUI interactif dans le même contexte utilisateur/session et approuvez les invites :

```bash
imsg chats --limit 1
imsg send <handle> "test"
```

    Confirmez que l’accès complet au disque + l’automatisation sont accordés pour le contexte de processus qui exécute OpenClaw/`imsg`.

  </Accordion>
</AccordionGroup>

## Pointeurs de référence de configuration

- [Référence de configuration - iMessage](/fr/gateway/config-channels#imessage)
- [Configuration de Gateway](/fr/gateway/configuration)
- [Appairage](/fr/channels/pairing)
- [BlueBubbles](/fr/channels/bluebubbles)

## Associé

- [Vue d’ensemble des canaux](/fr/channels) — tous les canaux pris en charge
- [Appairage](/fr/channels/pairing) — authentification par message direct et flux d’appairage
- [Groupes](/fr/channels/groups) — comportement des discussions de groupe et contrôle par mention
- [Routage des canaux](/fr/channels/channel-routing) — routage des sessions pour les messages
- [Sécurité](/fr/gateway/security) — modèle d’accès et durcissement
