---
read_when:
    - Installation ou configuration des plugins
    - Comprendre les règles de découverte et de chargement des Plugins
    - Travailler avec des bundles de Plugin compatibles avec Codex/Claude
sidebarTitle: Install and Configure
summary: Installer, configurer et gérer les plugins OpenClaw
title: Plugins
x-i18n:
    generated_at: "2026-05-07T13:27:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: ef355ac480bce7140049f59d3d01909de2cf2fdf80ad07db62e05ee997840c81
    source_path: tools/plugin.md
    workflow: 16
---

Les Plugins étendent OpenClaw avec de nouvelles capacités : canaux, fournisseurs de modèles,
harnais d’agents, outils, Skills, parole, transcription en temps réel, voix
en temps réel, compréhension des médias, génération d’images, génération de vidéos, récupération web, recherche
web, et plus encore. Certains Plugins sont **core** (livrés avec OpenClaw), d’autres
sont **externes**. La plupart des Plugins externes sont publiés et découverts via
[ClawHub](/fr/tools/clawhub). Npm reste pris en charge pour les installations directes et pour un
ensemble temporaire de paquets de Plugins appartenant à OpenClaw pendant la finalisation de cette migration.

## Démarrage rapide

Pour des exemples à copier-coller d’installation, de liste, de désinstallation, de mise à jour et de publication, consultez
[Gérer les Plugins](/fr/plugins/manage-plugins).

<Steps>
  <Step title="Voir ce qui est chargé">
    ```bash
    openclaw plugins list
    ```
  </Step>

  <Step title="Installer un Plugin">
    ```bash
    # Rechercher des Plugins ClawHub
    openclaw plugins search "calendar"

    # Depuis ClawHub
    openclaw plugins install clawhub:openclaw-codex-app-server

    # Depuis npm
    openclaw plugins install npm:@acme/openclaw-plugin
    openclaw plugins install npm-pack:./openclaw-plugin-1.2.3.tgz

    # Depuis git
    openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0

    # Depuis un répertoire ou une archive local(e)
    openclaw plugins install ./my-plugin
    openclaw plugins install ./my-plugin.tgz
    ```

  </Step>

  <Step title="Redémarrer le Gateway">
    ```bash
    openclaw gateway restart
    ```

    Configurez ensuite sous `plugins.entries.\<id\>.config` dans votre fichier de configuration.

  </Step>

  <Step title="Gestion native au chat">
    Dans un Gateway en cours d’exécution, les commandes réservées au propriétaire `/plugins enable` et `/plugins disable`
    déclenchent le rechargeur de configuration du Gateway. Le Gateway recharge les surfaces d’exécution des Plugins
    dans le processus, et les nouveaux tours d’agent reconstruisent leur liste d’outils depuis le
    registre actualisé. `/plugins install` modifie le code source du Plugin, donc le
    Gateway demande un redémarrage au lieu de prétendre que le processus actuel peut
    recharger en toute sécurité des modules déjà importés.

  </Step>

  <Step title="Vérifier le Plugin">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json

    # Si le Plugin a enregistré une racine CLI, exécutez une commande depuis cette racine.
    openclaw <plugin-command> --help
    ```

    Utilisez `--runtime` lorsque vous devez prouver les outils enregistrés, services, méthodes de Gateway,
    hooks ou commandes CLI appartenant au Plugin. `inspect` seul est une vérification froide
    du manifeste/registre et évite intentionnellement d’importer l’exécution du Plugin.

  </Step>
</Steps>

Si vous préférez le contrôle natif au chat, activez `commands.plugins: true` et utilisez :

```text
/plugin install clawhub:<package>
/plugin show <plugin-id>
/plugin enable <plugin-id>
```

Le chemin d’installation utilise le même résolveur que la CLI : chemin/archive local(e), explicite
`clawhub:<pkg>`, explicite `npm:<pkg>`, explicite `npm-pack:<path.tgz>`,
explicite `git:<repo>`, ou spécification de paquet nue via npm.

Si la configuration est invalide, l’installation échoue normalement de manière fermée et vous renvoie vers
`openclaw doctor --fix`. La seule exception de récupération est un chemin étroit de réinstallation de Plugin groupé
pour les Plugins qui optent pour
`openclaw.install.allowInvalidConfigRecovery`.
Lors du démarrage du Gateway, une configuration de Plugin invalide échoue de manière fermée comme toute autre configuration
invalide. Exécutez `openclaw doctor --fix` pour mettre en quarantaine la mauvaise configuration de Plugin en
désactivant cette entrée de Plugin et en supprimant sa charge utile de configuration invalide ; la sauvegarde normale
de configuration conserve les valeurs précédentes.
Lorsqu’une configuration de canal référence un Plugin qui n’est plus découvrable mais que le
même identifiant de Plugin obsolète reste dans la configuration de Plugin ou les enregistrements d’installation, le démarrage du Gateway
journalise des avertissements et ignore ce canal au lieu de bloquer tous les autres canaux.
Exécutez `openclaw doctor --fix` pour supprimer les entrées de canal/Plugin obsolètes ; les clés de
canal inconnues sans preuve de Plugin obsolète échouent toujours à la validation afin que les fautes de frappe restent
visibles.
Si `plugins.enabled: false` est défini, les références de Plugin obsolètes sont traitées comme inertes :
le démarrage du Gateway ignore le travail de découverte/chargement des Plugins et `openclaw doctor` préserve
la configuration de Plugin désactivée au lieu de la supprimer automatiquement. Réactivez les Plugins avant
d’exécuter le nettoyage doctor si vous voulez supprimer les identifiants de Plugin obsolètes.

L’installation des dépendances de Plugin n’a lieu que lors des flux explicites d’installation/mise à jour ou
de réparation doctor. Le démarrage du Gateway, le rechargement de configuration et l’inspection d’exécution
n’exécutent pas de gestionnaires de paquets et ne réparent pas les arbres de dépendances. Les Plugins locaux doivent déjà
avoir leurs dépendances installées, tandis que les Plugins npm, git et ClawHub sont
installés sous les racines de Plugins gérées par OpenClaw. Les dépendances npm peuvent être hissées
dans la racine npm gérée d’OpenClaw ; l’installation/mise à jour analyse cette racine gérée avant
la confiance et la désinstallation supprime les paquets gérés par npm via npm. Les Plugins externes
et les chemins de chargement personnalisés doivent toujours être installés via `openclaw plugins install`.
Utilisez `openclaw plugins list --json` pour voir le `dependencyStatus` statique de chaque
Plugin visible sans importer le code d’exécution ni réparer les dépendances.
Consultez [Résolution des dépendances de Plugin](/fr/plugins/dependency-resolution) pour le
cycle de vie au moment de l’installation.

### Propriété de chemin de Plugin bloqué

Si les diagnostics de Plugin indiquent
`blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)`
et que la validation de configuration suit avec `plugin present but blocked`, OpenClaw a trouvé
des fichiers de Plugin appartenant à un utilisateur Unix différent de celui du processus qui les charge.
Gardez la configuration du Plugin en place ; corrigez la propriété du système de fichiers ou exécutez
OpenClaw avec le même utilisateur que celui qui possède le répertoire d’état.

Pour les installations Docker, l’image officielle s’exécute en tant que `node` (uid `1000`), donc les
répertoires de configuration et d’espace de travail OpenClaw montés en bind depuis l’hôte doivent normalement être
détenus par l’uid `1000` :

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

Si vous exécutez intentionnellement OpenClaw en tant que root, réparez plutôt la racine de Plugins gérée
avec une propriété root :

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

Après avoir corrigé la propriété, réexécutez `openclaw doctor --fix` ou
`openclaw plugins registry --refresh` afin que le registre de Plugins persistant corresponde
aux fichiers réparés.

Pour les installations npm, les sélecteurs mutables comme `latest` ou un dist-tag sont résolus
avant l’installation puis épinglés à la version exacte vérifiée dans la racine npm
gérée d’OpenClaw. Une fois npm terminé, OpenClaw vérifie que l’entrée
`package-lock.json` installée correspond toujours à la version résolue et à l’intégrité. Si
npm écrit des métadonnées de paquet différentes, l’installation échoue et le paquet géré
est restauré au lieu d’accepter un artefact de Plugin différent.
Les racines npm gérées héritent également des `overrides` npm au niveau paquet d’OpenClaw, donc
les épinglages de sécurité qui protègent l’hôte empaqueté s’appliquent aussi aux dépendances
de Plugins externes hissées.

Les extractions source sont des workspaces pnpm. Si vous clonez OpenClaw pour modifier des Plugins
groupés, exécutez `pnpm install` ; OpenClaw charge alors les Plugins groupés depuis
`extensions/<id>` afin que les modifications et les dépendances locales au paquet soient utilisées directement.
Les installations racine npm simples sont destinées à OpenClaw empaqueté, pas au développement
depuis une extraction source.

## Types de Plugins

OpenClaw reconnaît deux formats de Plugins :

| Format     | Fonctionnement                                                     | Exemples                                               |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------ |
| **Native** | `openclaw.plugin.json` + module d’exécution ; s’exécute dans le processus | Plugins officiels, paquets npm communautaires          |
| **Bundle** | Disposition compatible Codex/Claude/Cursor ; mappée aux fonctionnalités OpenClaw | `.codex-plugin/`, `.claude-plugin/`, `.cursor-plugin/` |

Les deux apparaissent sous `openclaw plugins list`. Consultez [Bundles de Plugins](/fr/plugins/bundles) pour les détails sur les bundles.

Si vous écrivez un Plugin natif, commencez par [Créer des Plugins](/fr/plugins/building-plugins)
et la [Vue d’ensemble du SDK de Plugin](/fr/plugins/sdk-overview).

## Points d’entrée des paquets

Les paquets npm de Plugins natifs doivent déclarer `openclaw.extensions` dans `package.json`.
Chaque entrée doit rester dans le répertoire du paquet et se résoudre vers un fichier
d’exécution lisible, ou vers un fichier source TypeScript avec un pair JavaScript compilé
inféré, comme `src/index.ts` vers `dist/index.js`.
Les installations empaquetées doivent livrer cette sortie d’exécution JavaScript. Le repli vers la source
TypeScript est destiné aux extractions source et aux chemins de développement locaux, pas aux
paquets npm installés dans la racine de Plugins gérée d’OpenClaw.

Si un avertissement de paquet géré indique qu’il `requires compiled runtime output for
TypeScript entry ...`, le paquet a été publié sans les fichiers JavaScript
dont OpenClaw a besoin à l’exécution. Il s’agit d’un problème d’empaquetage du Plugin, pas d’un problème de configuration
locale. Mettez à jour ou réinstallez le Plugin après que l’éditeur a republié le JavaScript
compilé, ou désactivez/désinstallez ce Plugin jusqu’à ce qu’un paquet corrigé soit disponible.

Utilisez `openclaw.runtimeExtensions` lorsque les fichiers d’exécution publiés ne se trouvent pas aux
mêmes chemins que les entrées source. Lorsqu’il est présent, `runtimeExtensions` doit contenir
exactement une entrée pour chaque entrée `extensions`. Les listes incompatibles font échouer l’installation et
la découverte des Plugins au lieu de revenir silencieusement aux chemins source. Si vous publiez également
`openclaw.setupEntry`, utilisez `openclaw.runtimeSetupEntry` pour son pair JavaScript
compilé ; ce fichier est requis lorsqu’il est déclaré.

```json
{
  "name": "@acme/openclaw-plugin",
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"]
  }
}
```

## Plugins officiels

### Paquets npm appartenant à OpenClaw pendant la migration

ClawHub est le principal chemin de distribution pour la plupart des Plugins. Les versions empaquetées actuelles
d’OpenClaw regroupent déjà de nombreux Plugins officiels, ceux-ci n’ont donc pas besoin
d’installations npm séparées dans les configurations normales. Jusqu’à ce que chaque Plugin appartenant à OpenClaw ait
migré vers ClawHub, OpenClaw publie encore certains paquets de Plugins `@openclaw/*` sur
npm pour les installations plus anciennes/personnalisées et les workflows npm directs.

Si npm signale un paquet de Plugin `@openclaw/*` comme obsolète, cette version de paquet
provient d’une ancienne ligne de paquets externes. Utilisez le Plugin groupé de
l’OpenClaw actuel ou une extraction locale jusqu’à la publication d’un paquet npm plus récent.

| Plugin          | Paquet                     | Docs                                       |
| --------------- | -------------------------- | ------------------------------------------ |
| BlueBubbles     | `@openclaw/bluebubbles`    | [BlueBubbles](/fr/channels/bluebubbles)       |
| Discord         | `@openclaw/discord`        | [Discord](/fr/channels/discord)               |
| Feishu          | `@openclaw/feishu`         | [Feishu](/fr/channels/feishu)                 |
| Matrix          | `@openclaw/matrix`         | [Matrix](/fr/channels/matrix)                 |
| Mattermost      | `@openclaw/mattermost`     | [Mattermost](/fr/channels/mattermost)         |
| Microsoft Teams | `@openclaw/msteams`        | [Microsoft Teams](/fr/channels/msteams)       |
| Nextcloud Talk  | `@openclaw/nextcloud-talk` | [Nextcloud Talk](/fr/channels/nextcloud-talk) |
| Nostr           | `@openclaw/nostr`          | [Nostr](/fr/channels/nostr)                   |
| Synology Chat   | `@openclaw/synology-chat`  | [Synology Chat](/fr/channels/synology-chat)   |
| Tlon            | `@openclaw/tlon`           | [Tlon](/fr/channels/tlon)                     |
| WhatsApp        | `@openclaw/whatsapp`       | [WhatsApp](/fr/channels/whatsapp)             |
| Zalo            | `@openclaw/zalo`           | [Zalo](/fr/channels/zalo)                     |
| Zalo Personal   | `@openclaw/zalouser`       | [Zalo Personal](/fr/plugins/zalouser)         |

### Core (livré avec OpenClaw)

<AccordionGroup>
  <Accordion title="Fournisseurs de modèles (activés par défaut)">
    `anthropic`, `byteplus`, `cloudflare-ai-gateway`, `github-copilot`, `google`,
    `huggingface`, `kilocode`, `kimi-coding`, `minimax`, `mistral`, `qwen`,
    `moonshot`, `nvidia`, `openai`, `opencode`, `opencode-go`, `openrouter`,
    `qianfan`, `synthetic`, `together`, `venice`,
    `vercel-ai-gateway`, `volcengine`, `xiaomi`, `zai`
  </Accordion>

  <Accordion title="Plugins de mémoire">
    - `memory-core` - recherche de mémoire intégrée (par défaut via `plugins.slots.memory`)
    - `memory-lancedb` - mémoire à long terme basée sur LanceDB avec rappel/capture automatique (définissez `plugins.slots.memory = "memory-lancedb"`)

    Consultez [Memory LanceDB](/fr/plugins/memory-lancedb) pour la configuration des embeddings compatibles avec OpenAI, des exemples Ollama, les limites de rappel et le dépannage.

  </Accordion>

  <Accordion title="Fournisseurs vocaux (activés par défaut)">
    `elevenlabs`, `microsoft`
  </Accordion>

  <Accordion title="Autre">
    - `browser` - Plugin de navigateur intégré pour l’outil de navigateur, la CLI `openclaw browser`, la méthode Gateway `browser.request`, le runtime de navigateur et le service de contrôle de navigateur par défaut (activé par défaut ; désactivez-le avant de le remplacer)
    - `copilot-proxy` - passerelle VS Code Copilot Proxy (désactivée par défaut)

  </Accordion>
</AccordionGroup>

Vous cherchez des Plugins tiers ? Consultez [Plugins communautaires](/fr/plugins/community).

## Configuration

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: ["untrusted-plugin"],
    load: { paths: ["~/Projects/oss/voice-call-plugin"] },
    entries: {
      "voice-call": { enabled: true, config: { provider: "twilio" } },
    },
  },
}
```

| Champ              | Description                                               |
| ------------------ | --------------------------------------------------------- |
| `enabled`          | Interrupteur principal (par défaut : `true`)              |
| `allow`            | Liste d’autorisation des Plugins (facultatif)             |
| `bundledDiscovery` | Mode de découverte des Plugins intégrés (`allowlist` par défaut) |
| `deny`             | Liste de refus des Plugins (facultatif ; le refus l’emporte) |
| `load.paths`       | Fichiers/répertoires de Plugins supplémentaires           |
| `slots`            | Sélecteurs d’emplacements exclusifs (par ex. `memory`, `contextEngine`) |
| `entries.\<id\>`   | Activations + configuration par Plugin                    |

`plugins.allow` est exclusif. Lorsqu’il n’est pas vide, seuls les Plugins listés peuvent être chargés ou exposer des outils, même si `tools.allow` contient `"*"` ou un nom d’outil spécifique détenu par un Plugin. Si une liste d’autorisation d’outils référence des outils de Plugin, ajoutez les identifiants des Plugins propriétaires à `plugins.allow` ou supprimez `plugins.allow` ; `openclaw doctor` signale cette forme.

`plugins.bundledDiscovery` vaut par défaut `"allowlist"` pour les nouvelles configurations ; ainsi, un inventaire `plugins.allow` restrictif bloque aussi les Plugins de fournisseurs intégrés omis, y compris la découverte des fournisseurs de recherche web au runtime. Doctor marque les anciennes configurations de liste d’autorisation restrictives avec `"compat"` pendant la migration afin que les mises à niveau conservent le comportement hérité des fournisseurs intégrés jusqu’à ce que l’opérateur opte pour le mode plus strict. Un `plugins.allow` vide est toujours traité comme non défini/ouvert.

Les changements de configuration effectués via `/plugins enable` ou `/plugins disable` déclenchent un rechargement des Plugins Gateway dans le processus. Les nouveaux tours d’agent reconstruisent leur liste d’outils depuis le registre de Plugins actualisé. Les opérations qui changent les sources, comme l’installation, la mise à jour et la désinstallation, redémarrent toujours le processus Gateway, car les modules de Plugin déjà importés ne peuvent pas être remplacés en place en toute sécurité.

`openclaw plugins list` est un instantané local du registre/de la configuration des Plugins. Un Plugin `enabled` à cet endroit signifie que le registre persistant et la configuration actuelle autorisent le Plugin à participer. Cela ne prouve pas qu’un Gateway distant déjà en cours d’exécution a été rechargé ou redémarré avec le même code de Plugin. Sur les configurations VPS/conteneur avec des processus wrapper, envoyez les redémarrages ou les écritures déclenchant un rechargement au véritable processus `openclaw gateway run`, ou utilisez `openclaw gateway restart` contre le Gateway en cours d’exécution lorsque le rechargement signale un échec.

<Accordion title="États des Plugins : désactivé, manquant ou invalide">
  - **Désactivé** : le Plugin existe, mais les règles d’activation l’ont désactivé. La configuration est conservée.
  - **Manquant** : la configuration référence un identifiant de Plugin que la découverte n’a pas trouvé.
  - **Invalide** : le Plugin existe, mais sa configuration ne correspond pas au schéma déclaré. Le démarrage du Gateway ignore seulement ce Plugin ; `openclaw doctor --fix` peut mettre en quarantaine l’entrée invalide en la désactivant et en supprimant sa charge utile de configuration.

</Accordion>

## Découverte et précédence

OpenClaw recherche les Plugins dans cet ordre (la première correspondance l’emporte) :

<Steps>
  <Step title="Chemins de configuration">
    `plugins.load.paths` - chemins de fichiers ou de répertoires explicites. Les chemins qui pointent vers les propres répertoires de Plugins intégrés empaquetés d’OpenClaw sont ignorés ; exécutez `openclaw doctor --fix` pour supprimer ces alias obsolètes.
  </Step>

  <Step title="Plugins d’espace de travail">
    `\<workspace\>/.openclaw/<plugin-root>/*.ts` et `\<workspace\>/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugins globaux">
    `~/.openclaw/<plugin-root>/*.ts` et `~/.openclaw/<plugin-root>/*/index.ts`.
  </Step>

  <Step title="Plugins intégrés">
    Livrés avec OpenClaw. Beaucoup sont activés par défaut (fournisseurs de modèles, voix). D’autres nécessitent une activation explicite.
  </Step>
</Steps>

Les installations empaquetées et les images Docker résolvent normalement les Plugins intégrés depuis l’arborescence compilée `dist/extensions`. Si un répertoire source de Plugin intégré est monté en bind sur le chemin source empaqueté correspondant, par exemple `/app/extensions/synology-chat`, OpenClaw traite ce répertoire source monté comme une surcouche source intégrée et le découvre avant le bundle empaqueté `/app/dist/extensions/synology-chat`. Cela permet aux boucles de conteneur des mainteneurs de fonctionner sans repasser chaque Plugin intégré en source TypeScript. Définissez `OPENCLAW_DISABLE_BUNDLED_SOURCE_OVERLAYS=1` pour forcer les bundles dist empaquetés même lorsque des montages de surcouche source sont présents.

### Règles d’activation

- `plugins.enabled: false` désactive tous les Plugins et ignore le travail de découverte/chargement des Plugins
- `plugins.deny` l’emporte toujours sur l’autorisation
- `plugins.entries.\<id\>.enabled: false` désactive ce Plugin
- Les Plugins issus de l’espace de travail sont **désactivés par défaut** (ils doivent être explicitement activés)
- Les Plugins intégrés suivent l’ensemble intégré activé par défaut, sauf remplacement
- Les emplacements exclusifs peuvent forcer l’activation du Plugin sélectionné pour cet emplacement
- Certains Plugins intégrés optionnels sont activés automatiquement lorsque la configuration nomme une surface détenue par un Plugin, comme une référence de modèle fournisseur, une configuration de canal ou un runtime de harnais
- La configuration de Plugin obsolète est conservée tant que `plugins.enabled: false` est actif ; réactivez les Plugins avant d’exécuter le nettoyage de doctor si vous voulez supprimer les identifiants obsolètes
- Les routes Codex de la famille OpenAI conservent des frontières de Plugin séparées :
  `openai-codex/*` appartient au Plugin OpenAI, tandis que le Plugin app-server Codex intégré est sélectionné par `agentRuntime.id: "codex"` ou les références de modèle héritées `codex/*`

## Dépannage des hooks de runtime

Si un Plugin apparaît dans `plugins list`, mais que les effets de bord ou les hooks `register(api)` ne s’exécutent pas dans le trafic de discussion en direct, vérifiez d’abord ceci :

- Exécutez `openclaw gateway status --deep --require-rpc` et confirmez que l’URL Gateway active, le profil, le chemin de configuration et le processus sont bien ceux que vous modifiez.
- Redémarrez le Gateway en direct après les changements d’installation/configuration/code de Plugin. Dans les conteneurs wrapper, le PID 1 peut n’être qu’un superviseur ; redémarrez ou signalez le processus enfant `openclaw gateway run`.
- Utilisez `openclaw plugins inspect <id> --runtime --json` pour confirmer les enregistrements de hooks et les diagnostics. Les hooks de conversation non intégrés comme `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `llm_input`, `llm_output`, `before_agent_finalize` et `agent_end` nécessitent `plugins.entries.<id>.hooks.allowConversationAccess=true`.
- Pour le changement de modèle, préférez `before_model_resolve`. Il s’exécute avant la résolution du modèle pour les tours d’agent ; `llm_output` ne s’exécute qu’après qu’une tentative de modèle produit une sortie d’assistant.
- Pour prouver le modèle de session effectif, utilisez `openclaw sessions` ou les surfaces de session/statut du Gateway et, lors du débogage des charges utiles fournisseur, démarrez le Gateway avec `--raw-stream --raw-stream-path <path>`.

### Configuration lente des outils de Plugin

Si les tours d’agent semblent bloquer pendant la préparation des outils, activez la journalisation de trace et recherchez les lignes de temporisation des fabriques d’outils de Plugin :

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

Recherchez :

```text
[trace:plugin-tools] factory timings ...
```

Le résumé liste le temps total des fabriques et les fabriques d’outils de Plugin les plus lentes, y compris l’identifiant de Plugin, les noms d’outils déclarés, la forme du résultat et si l’outil est facultatif. Les lignes lentes sont promues en avertissements lorsqu’une seule fabrique prend au moins 1 s ou que la préparation totale des fabriques d’outils de Plugin prend au moins 5 s.

OpenClaw met en cache les résultats réussis des fabriques d’outils de Plugin pour les résolutions répétées avec le même contexte de requête effectif. La clé de cache inclut la configuration de runtime effective, l’espace de travail, les identifiants d’agent/session, la politique de bac à sable, les paramètres du navigateur, le contexte de livraison, l’identité du demandeur et l’état de propriété ; ainsi, les fabriques qui dépendent de ces champs fiables sont réexécutées lorsque le contexte change.

Si un Plugin domine la temporisation, inspectez ses enregistrements de runtime :

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

Puis mettez à jour, réinstallez ou désactivez ce Plugin. Les auteurs de Plugins doivent déplacer le chargement coûteux des dépendances derrière le chemin d’exécution de l’outil au lieu de l’effectuer dans la fabrique d’outils.

### Propriété de canal ou d’outil en double

Symptômes :

- `channel already registered: <channel-id> (<plugin-id>)`
- `channel setup already registered: <channel-id> (<plugin-id>)`
- `plugin tool name conflict (<plugin-id>): <tool-name>`

Cela signifie que plusieurs Plugins activés tentent de posséder le même canal, le même flux de configuration ou le même nom d’outil. La cause la plus fréquente est un Plugin de canal externe installé à côté d’un Plugin intégré qui fournit désormais le même identifiant de canal.

Étapes de débogage :

- Exécutez `openclaw plugins list --enabled --verbose` pour voir chaque Plugin activé et son origine.
- Exécutez `openclaw plugins inspect <id> --runtime --json` pour chaque Plugin suspecté et comparez `channels`, `channelConfigs`, `tools` et les diagnostics.
- Exécutez `openclaw plugins registry --refresh` après l’installation ou la suppression de paquets de Plugin afin que les métadonnées persistantes reflètent l’installation actuelle.
- Redémarrez le Gateway après les changements d’installation, de registre ou de configuration.

Options de correction :

- Si un Plugin remplace intentionnellement un autre pour le même identifiant de canal, le Plugin préféré doit déclarer `channelConfigs.<channel-id>.preferOver` avec l’identifiant du Plugin de priorité inférieure. Consultez [/plugins/manifest#replacing-another-channel-plugin](/fr/plugins/manifest#replacing-another-channel-plugin).
- Si le doublon est accidentel, désactivez un côté avec `plugins.entries.<plugin-id>.enabled: false` ou supprimez l’installation de Plugin obsolète.
- Si vous avez explicitement activé les deux Plugins, OpenClaw conserve cette demande et signale le conflit. Choisissez un seul propriétaire pour le canal ou renommez les outils détenus par des Plugins afin que la surface de runtime soit sans ambiguïté.

## Emplacements de Plugins (catégories exclusives)

Certaines catégories sont exclusives (une seule active à la fois) :

```json5
{
  plugins: {
    slots: {
      memory: "memory-core", // or "none" to disable
      contextEngine: "legacy", // or a plugin id
    },
  },
}
```

| Emplacement     | Ce qu’il contrôle       | Par défaut          |
| --------------- | ----------------------- | ------------------- |
| `memory`        | Plugin de mémoire actif | `memory-core`       |
| `contextEngine` | Moteur de contexte actif | `legacy` (intégré) |

## Référence CLI

```bash
openclaw plugins list                       # compact inventory
openclaw plugins list --enabled            # only enabled plugins
openclaw plugins list --verbose            # per-plugin detail lines
openclaw plugins list --json               # machine-readable inventory
openclaw plugins search <query>            # search ClawHub plugin catalog
openclaw plugins inspect <id>              # static detail
openclaw plugins inspect <id> --runtime    # registered hooks/tools/CLI/gateway methods
openclaw plugins inspect <id> --json       # machine-readable
openclaw plugins inspect --all             # fleet-wide table
openclaw plugins info <id>                 # inspect alias
openclaw plugins doctor                    # diagnostics
openclaw plugins registry                  # inspect persisted registry state
openclaw plugins registry --refresh        # rebuild persisted registry
openclaw doctor --fix                      # repair plugin registry state

openclaw plugins install <package>         # install from npm by default
openclaw plugins install clawhub:<pkg>     # install from ClawHub only
openclaw plugins install npm:<pkg>         # install from npm only
openclaw plugins install git:<repo>        # install from git
openclaw plugins install git:<repo>@<ref>  # install from git ref
openclaw plugins install <spec> --force    # overwrite existing install
openclaw plugins install <path>            # install from local path
openclaw plugins install -l <path>         # link (no copy) for dev
openclaw plugins install <plugin> --marketplace <source>
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <spec> --pin      # record exact resolved npm spec
openclaw plugins install <spec> --dangerously-force-unsafe-install
openclaw plugins update <id-or-npm-spec> # update one plugin
openclaw plugins update <id-or-npm-spec> --dangerously-force-unsafe-install
openclaw plugins update --all            # update all
openclaw plugins uninstall <id>          # remove config and plugin index records
openclaw plugins uninstall <id> --keep-files
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json

# Verify runtime registrations after install.
openclaw plugins inspect <id> --runtime --json

# Run plugin-owned CLI commands directly from the OpenClaw root CLI.
openclaw <plugin-command> --help

openclaw plugins enable <id>
openclaw plugins disable <id>
```

Les plugins intégrés sont fournis avec OpenClaw. Beaucoup sont activés par défaut (par exemple
les fournisseurs de modèles intégrés, les fournisseurs de synthèse vocale intégrés et le plugin
de navigateur intégré). D’autres plugins intégrés nécessitent toujours `openclaw plugins enable <id>`.

`--force` écrase sur place un plugin installé ou un pack de hooks existant. Utilisez
`openclaw plugins update <id-or-npm-spec>` pour les mises à niveau courantes des plugins npm
suivis. Il n’est pas pris en charge avec `--link`, qui réutilise le chemin source au lieu
de copier vers une cible d’installation gérée.

Lorsque `plugins.allow` est déjà défini, `openclaw plugins install` ajoute l’identifiant du
plugin installé à cette liste d’autorisation avant de l’activer. Si le même identifiant de plugin
est présent dans `plugins.deny`, l’installation supprime cette entrée de refus obsolète afin que
l’installation explicite soit immédiatement chargeable après redémarrage.

OpenClaw conserve un registre local persistant des plugins comme modèle de lecture à froid pour
l’inventaire des plugins, la propriété des contributions et la planification du démarrage. Les flux
d’installation, de mise à jour, de désinstallation, d’activation et de désactivation actualisent ce
registre après avoir modifié l’état des plugins. Le même fichier `plugins/installs.json` conserve les
métadonnées d’installation durables dans `installRecords` au niveau supérieur et les métadonnées de
manifeste reconstructibles dans `plugins`. Si le registre est absent, obsolète ou non valide,
`openclaw plugins registry --refresh` reconstruit sa vue des manifestes à partir des enregistrements
d’installation, de la stratégie de configuration et des métadonnées de manifeste/package sans charger
les modules d’exécution des plugins.

En mode Nix (`OPENCLAW_NIX_MODE=1`), les mutateurs du cycle de vie des plugins sont désactivés.
Gérez plutôt la sélection des packages de plugins et la configuration via la source Nix de
l’installation ; pour nix-openclaw, commencez par le
[Guide de démarrage rapide](https://github.com/openclaw/nix-openclaw#quick-start) centré sur l’agent.
`openclaw plugins update <id-or-npm-spec>` s’applique aux installations suivies. Fournir une
spécification de package npm avec un dist-tag ou une version exacte résout le nom du package vers
l’enregistrement du plugin suivi et enregistre la nouvelle spécification pour les futures mises à jour.
Fournir le nom du package sans version replace une installation épinglée exacte sur la ligne de
publication par défaut du registre. Si le plugin npm installé correspond déjà à la version résolue et
à l’identité d’artefact enregistrée, OpenClaw ignore la mise à jour sans télécharger, réinstaller ni
réécrire la configuration.
Lorsque `openclaw update` s’exécute sur le canal bêta, les enregistrements de plugins npm et ClawHub
sur la ligne par défaut essaient d’abord `@beta`, puis se replient sur la valeur par défaut/latest
lorsqu’aucune publication bêta du plugin n’existe. Les versions exactes et les balises explicites
restent épinglées.

`--pin` est réservé à npm. Il n’est pas pris en charge avec `--marketplace`, car les installations
depuis une marketplace persistent les métadonnées de source de marketplace au lieu d’une spécification npm.

`--dangerously-force-unsafe-install` est un contournement d’urgence pour les faux positifs du scanner
de code dangereux intégré. Il permet aux installations et mises à jour de plugins de continuer malgré
des résultats `critical` intégrés, mais il ne contourne toujours pas les blocages de stratégie
`before_install` des plugins ni le blocage dû à un échec d’analyse.
Les analyses d’installation ignorent les fichiers et répertoires de test courants comme `tests/`,
`__tests__/`, `*.test.*` et `*.spec.*` afin d’éviter de bloquer les mocks de test packagés ;
les points d’entrée d’exécution déclarés des plugins sont toujours analysés même s’ils utilisent
l’un de ces noms.

Ce drapeau CLI s’applique uniquement aux flux d’installation/mise à jour de plugins. Les installations
de dépendances de Skills adossées au Gateway utilisent plutôt le remplacement de requête correspondant
`dangerouslyForceUnsafeInstall`, tandis que `openclaw skills install` reste le flux séparé de
téléchargement/installation de Skills depuis ClawHub.

Si un plugin que vous avez publié sur ClawHub est masqué ou bloqué par une analyse, ouvrez le tableau
de bord ClawHub ou exécutez `clawhub package rescan <name>` pour demander à ClawHub de le vérifier à
nouveau. `--dangerously-force-unsafe-install` affecte uniquement les installations sur votre propre
machine ; il ne demande pas à ClawHub de réanalyser le plugin ni de rendre publique une publication
bloquée.

Les bundles compatibles participent au même flux de liste/inspection/activation/désactivation des
plugins. La prise en charge actuelle à l’exécution inclut les Skills de bundle, les Skills de commande
Claude, les valeurs par défaut Claude `settings.json`, les valeurs par défaut Claude `.lsp.json` et
`lspServers` déclarées dans le manifeste, les Skills de commande Cursor et les répertoires de hooks
Codex compatibles.

`openclaw plugins inspect <id>` signale également les capacités de bundle détectées ainsi que les
entrées de serveurs MCP et LSP prises en charge ou non prises en charge pour les plugins adossés à
un bundle.

Les sources de marketplace peuvent être un nom de marketplace connue de Claude provenant de
`~/.claude/plugins/known_marketplaces.json`, une racine de marketplace locale ou un chemin
`marketplace.json`, un raccourci GitHub comme `owner/repo`, une URL de dépôt GitHub ou une URL git.
Pour les marketplaces distantes, les entrées de plugins doivent rester dans le dépôt de marketplace
cloné et utiliser uniquement des sources à chemins relatifs.

Voir la [référence CLI `openclaw plugins`](/fr/cli/plugins) pour tous les détails.

## Présentation de l’API Plugin

Les plugins natifs exportent un objet d’entrée qui expose `register(api)`. Les anciens plugins peuvent
encore utiliser `activate(api)` comme alias hérité, mais les nouveaux plugins devraient utiliser
`register`.

```typescript
export default definePluginEntry({
  id: "my-plugin",
  name: "My Plugin",
  register(api) {
    api.registerProvider({
      /* ... */
    });
    api.registerTool({
      /* ... */
    });
    api.registerChannel({
      /* ... */
    });
  },
});
```

OpenClaw charge l’objet d’entrée et appelle `register(api)` pendant l’activation du plugin.
Le chargeur se rabat toujours sur `activate(api)` pour les anciens plugins, mais les plugins intégrés
et les nouveaux plugins externes devraient considérer `register` comme le contrat public.

`api.registrationMode` indique à un plugin pourquoi son entrée est chargée :

| Mode            | Signification                                                                                                                   |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `full`          | Activation à l’exécution. Enregistre les outils, hooks, services, commandes, routes et autres effets de bord actifs.            |
| `discovery`     | Découverte de capacités en lecture seule. Enregistre les fournisseurs et les métadonnées ; le code d’entrée du plugin approuvé peut se charger, mais doit ignorer les effets de bord actifs. |
| `setup-only`    | Chargement des métadonnées de configuration de canal via une entrée de configuration légère.                                    |
| `setup-runtime` | Chargement de la configuration de canal qui nécessite aussi l’entrée d’exécution.                                                |
| `cli-metadata`  | Collecte uniquement des métadonnées des commandes CLI.                                                                           |

Les entrées de plugins qui ouvrent des sockets, des bases de données, des workers en arrière-plan ou
des clients de longue durée devraient protéger ces effets de bord avec `api.registrationMode === "full"`.
Les chargements de découverte sont mis en cache séparément des chargements d’activation et ne remplacent
pas le registre Gateway en cours d’exécution. La découverte est non activante, mais pas sans import :
OpenClaw peut évaluer l’entrée de plugin approuvée ou le module de plugin de canal pour construire
l’instantané. Gardez les niveaux supérieurs des modules légers et sans effets de bord, et déplacez
les clients réseau, sous-processus, écouteurs, lectures d’identifiants et démarrages de services
derrière les chemins d’exécution complète.

Méthodes d’enregistrement courantes :

| Méthode                                 | Ce qu’elle enregistre                 |
| --------------------------------------- | ------------------------------------- |
| `registerProvider`                      | Fournisseur de modèles (LLM)          |
| `registerChannel`                       | Canal de chat                         |
| `registerTool`                          | Outil d’agent                         |
| `registerHook` / `on(...)`              | Hooks de cycle de vie                 |
| `registerSpeechProvider`                | Synthèse vocale / STT                 |
| `registerRealtimeTranscriptionProvider` | STT en streaming                      |
| `registerRealtimeVoiceProvider`         | Voix temps réel duplex                |
| `registerMediaUnderstandingProvider`    | Analyse d’images/audio                |
| `registerImageGenerationProvider`       | Génération d’images                   |
| `registerMusicGenerationProvider`       | Génération de musique                 |
| `registerVideoGenerationProvider`       | Génération de vidéo                   |
| `registerWebFetchProvider`              | Fournisseur de récupération / scraping web |
| `registerWebSearchProvider`             | Recherche web                         |
| `registerHttpRoute`                     | Point de terminaison HTTP             |
| `registerCommand` / `registerCli`       | Commandes CLI                         |
| `registerContextEngine`                 | Moteur de contexte                    |
| `registerService`                       | Service en arrière-plan               |

Comportement de garde des hooks pour les hooks de cycle de vie typés :

- `before_tool_call` : `{ block: true }` est terminal ; les gestionnaires de priorité inférieure sont ignorés.
- `before_tool_call` : `{ block: false }` est un no-op et n’efface pas un blocage antérieur.
- `before_install` : `{ block: true }` est terminal ; les gestionnaires de priorité inférieure sont ignorés.
- `before_install` : `{ block: false }` est un no-op et n’efface pas un blocage antérieur.
- `message_sending` : `{ cancel: true }` est terminal ; les gestionnaires de priorité inférieure sont ignorés.
- `message_sending` : `{ cancel: false }` est un no-op et n’efface pas une annulation antérieure.

Les exécutions app-server Codex natives relaient les événements d’outils natifs Codex vers cette
surface de hook. Les Plugins peuvent bloquer les outils natifs Codex via `before_tool_call`,
observer les résultats via `after_tool_call` et participer aux approbations Codex
`PermissionRequest`. Le bridge ne réécrit pas encore les arguments des outils natifs Codex.
La limite exacte de prise en charge du runtime Codex est définie dans le
[contrat de prise en charge Codex harness v1](/fr/plugins/codex-harness#v1-support-contract).

Pour le comportement complet des hooks typés, consultez la [présentation du SDK](/fr/plugins/sdk-overview#hook-decision-semantics).

## Associé

- [Créer des Plugins](/fr/plugins/building-plugins) - créez votre propre Plugin
- [Bundles de Plugins](/fr/plugins/bundles) - compatibilité des bundles Codex/Claude/Cursor
- [Manifeste de Plugin](/fr/plugins/manifest) - schéma du manifeste
- [Enregistrer des outils](/fr/plugins/building-plugins#registering-agent-tools) - ajoutez des outils d’agent dans un Plugin
- [Internes des Plugins](/fr/plugins/architecture) - modèle de capacités et pipeline de chargement
- [Plugins communautaires](/fr/plugins/community) - listes tierces
