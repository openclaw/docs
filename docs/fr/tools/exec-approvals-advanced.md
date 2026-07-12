---
read_when:
    - Configuration des exécutables de confiance ou de profils personnalisés d’exécutables de confiance
    - Transfert des approbations vers Slack, Discord, Telegram ou d’autres canaux de discussion
    - Implémentation d’un client d’approbation natif pour un canal
summary: 'Approbations d’exécution avancées : exécutables sûrs, association des interpréteurs, transfert des approbations, livraison native'
title: Approbations d’exécution — avancé
x-i18n:
    generated_at: "2026-07-12T15:57:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 99f123c7663378cc30ff9b6498c5cbc18ce9f20e9ac769755bab23af69ef1c7d
    source_path: tools/exec-approvals-advanced.md
    workflow: 16
---

Sujets avancés sur l’approbation d’exécution : le chemin rapide `safeBins`, la liaison des interpréteurs/environnements d’exécution et le transfert des approbations vers les canaux de discussion (y compris la livraison native).
Pour la politique principale et le flux d’approbation, consultez [Approbations d’exécution](/fr/tools/exec-approvals).

## Binaires sûrs (entrée standard uniquement)

`tools.exec.safeBins` désigne des binaires **limités à l’entrée standard** (par exemple `cut`) qui s’exécutent en mode liste d’autorisation **sans** entrée explicite dans celle-ci. Les binaires sûrs rejettent les arguments positionnels de fichiers et les jetons ressemblant à des chemins ; ils ne peuvent donc agir que sur le flux entrant. Considérez cela comme un chemin rapide restreint pour les filtres de flux, et non comme une liste générale de confiance.

<Warning>
N’ajoutez **pas** de binaires d’interpréteur ou d’environnement d’exécution (par exemple `python3`, `node`, `ruby`, `bash`, `sh`, `zsh`) à `safeBins`. Si une commande peut évaluer du code, exécuter des sous-commandes ou lire des fichiers par conception, privilégiez des entrées explicites dans la liste d’autorisation et maintenez les invites d’approbation activées. Les binaires sûrs personnalisés doivent définir un profil explicite dans `tools.exec.safeBinProfiles.<bin>`.
</Warning>

Binaires sûrs par défaut :

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` et `sort` ne figurent pas dans la liste par défaut. Si vous les activez, conservez des entrées explicites dans la liste d’autorisation pour leurs utilisations ne reposant pas sur l’entrée standard. Pour `grep` en mode binaire sûr, fournissez le motif avec `-e`/`--regexp` ; la forme positionnelle du motif est rejetée afin d’empêcher la dissimulation d’opérandes de fichiers sous forme d’arguments positionnels ambigus.

### Validation d’argv et options interdites

La validation est déterministe et repose uniquement sur la structure d’argv (sans vérifier l’existence de fichiers sur le système hôte), ce qui empêche d’utiliser les différences entre autorisation et refus comme oracle d’existence de fichiers. Les options orientées fichiers sont interdites pour les binaires sûrs par défaut ; la validation des options longues échoue de manière fermée (les options inconnues et les abréviations ambiguës sont rejetées). Les options booléennes reconnues et en lecture seule des binaires par défaut (par exemple `wc -l`, `tr -d`, `uniq -c`) sont acceptées, tandis que les options courtes non reconnues restent refusées par défaut et nécessitent une approbation manuelle.

Options interdites par profil de binaire sûr :

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep` : `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq` : `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort` : `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `tail` : `--follow`, `--retry`, `-F`, `-f`
- `wc` : `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

Les binaires sûrs imposent également que les jetons d’argv soient traités comme du **texte littéral** lors de l’exécution (sans développement des caractères génériques ni des `$VARS`) pour les segments limités à l’entrée standard, de sorte que des motifs comme `*` ou `$HOME/...` ne puissent pas servir à dissimuler des lectures de fichiers. `awk`, `sed` et `jq` sont toujours refusés comme binaires sûrs, car leur sémantique ne peut pas être validée comme limitée à l’entrée standard : `jq` peut lire les données d’environnement et charger du code jq depuis des modules ou des fichiers de démarrage. Pour ces outils, utilisez plutôt une entrée explicite dans la liste d’autorisation ou une invite d’approbation que `safeBins`.

### Répertoires de binaires approuvés

Les binaires sûrs doivent être résolus depuis des répertoires de binaires approuvés (valeurs système par défaut, complétées éventuellement par `tools.exec.safeBinTrustedDirs`). Les entrées de `PATH` ne sont jamais automatiquement approuvées. Les répertoires approuvés par défaut sont volontairement limités : `/bin`, `/usr/bin`. Si l’exécutable de votre binaire sûr se trouve dans des chemins de gestionnaire de paquets ou d’utilisateur (par exemple `/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`), ajoutez-les explicitement à `tools.exec.safeBinTrustedDirs`.

### Chaînage de commandes shell, enveloppes et multiplexeurs

Le chaînage de commandes shell (`&&`, `||`, `;`) est autorisé lorsque chaque segment de premier niveau satisfait la liste d’autorisation (y compris les binaires sûrs ou l’autorisation automatique par une skill). Les redirections restent non prises en charge en mode liste d’autorisation. La substitution de commande (`$()` / accents graves) est rejetée lors de l’analyse de la liste d’autorisation, y compris à l’intérieur de guillemets doubles ; utilisez des guillemets simples si vous avez besoin du texte littéral `$()`.

Pour les approbations via l’application compagnon macOS, le texte shell brut contenant une syntaxe de contrôle ou de développement shell (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) est considéré comme ne correspondant pas à la liste d’autorisation, sauf si le binaire shell lui-même y figure.

Pour les enveloppes shell (`bash|sh|zsh ... -c/-lc`), les substitutions de variables d’environnement limitées à la requête sont réduites à une petite liste d’autorisation explicite (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).

Pour les décisions `allow-always` en mode liste d’autorisation, les enveloppes de distribution transparentes (par exemple `env`, `flock`, `nice`, `nohup`, `stdbuf`, `timeout`) enregistrent le chemin de l’exécutable interne plutôt que celui de l’enveloppe. Les multiplexeurs shell (`busybox`, `toybox`) sont désenveloppés de la même manière pour les applets shell (`sh`, `ash`, etc.). Si une enveloppe ou un multiplexeur ne peut pas être désenveloppé en toute sécurité, aucune entrée de liste d’autorisation n’est enregistrée automatiquement.

Si vous ajoutez à la liste d’autorisation des interpréteurs comme `python3` ou `node`, privilégiez `tools.exec.strictInlineEval=true` afin que l’évaluation en ligne nécessite toujours une approbation explicite. En mode strict, `allow-always` peut toujours enregistrer des appels bénins d’interpréteur ou de script, mais les vecteurs d’évaluation en ligne ne sont pas enregistrés automatiquement.

### Binaires sûrs et liste d’autorisation

| Sujet            | `tools.exec.safeBins`                                  | Liste d’autorisation (`exec-approvals.json`)                                                  |
| ---------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| Objectif             | Autoriser automatiquement des filtres restreints à l’entrée standard                        | Faire explicitement confiance à des exécutables spécifiques                                              |
| Type de correspondance       | Nom de l’exécutable + politique d’argv du binaire sûr                 | Motif glob du chemin d’exécutable résolu, ou motif glob du nom de commande seul pour les commandes appelées via PATH |
| Portée des arguments   | Restreinte par le profil du binaire sûr et les règles de jetons littéraux | Correspondance de chemin par défaut ; `argPattern` peut éventuellement restreindre l’argv analysé              |
| Exemples courants | `head`, `tail`, `tr`, `wc`                             | `jq`, `python3`, `node`, `ffmpeg`, CLI personnalisées                                     |
| Utilisation recommandée         | Transformations de texte à faible risque dans les pipelines                  | Tout outil ayant un comportement plus large ou des effets de bord                                     |

Emplacement de la configuration :

- `safeBins` provient de la configuration (`tools.exec.safeBins` ou, par agent, `agents.list[].tools.exec.safeBins`).
- `safeBinTrustedDirs` provient de la configuration (`tools.exec.safeBinTrustedDirs` ou, par agent, `agents.list[].tools.exec.safeBinTrustedDirs`).
- `safeBinProfiles` provient de la configuration (`tools.exec.safeBinProfiles` ou, par agent, `agents.list[].tools.exec.safeBinProfiles`). Les clés de profil propres à un agent remplacent les clés globales.
- Les entrées de la liste d’autorisation se trouvent dans le fichier local d’approbations de l’hôte sous `agents.<id>.allowlist` (ou via l’interface de contrôle / `openclaw approvals allowlist ...`).
- `openclaw security audit` émet l’avertissement `tools.exec.safe_bins_interpreter_unprofiled` lorsque des binaires d’interpréteur ou d’environnement d’exécution figurent dans `safeBins` sans profil explicite.
- `openclaw doctor --fix` peut générer la structure des entrées personnalisées `safeBinProfiles.<bin>` manquantes sous la forme `{}` (examinez-les et rendez-les plus restrictives ensuite). Les binaires d’interpréteur ou d’environnement d’exécution ne sont pas générés automatiquement.

Exemple de profil personnalisé :
__OC_I18N_900000__
## Commandes d’interpréteur ou d’environnement d’exécution

Les exécutions d’interpréteurs ou d’environnements d’exécution soumises à approbation sont volontairement prudentes :

- Le contexte exact d’argv, du répertoire de travail et de l’environnement est toujours lié.
- Les formes de script shell direct et de fichier d’environnement d’exécution direct sont liées, dans la mesure du possible, à un instantané précis d’un fichier local.
- Les formes courantes d’enveloppes de gestionnaire de paquets qui se résolvent toujours vers un seul fichier local direct (par exemple `pnpm exec`, `pnpm node`, `npm exec`, `npx`) sont désenveloppées avant la liaison.
- Si OpenClaw ne peut pas identifier exactement un fichier local précis pour une commande d’interpréteur ou d’environnement d’exécution (par exemple des scripts de paquet, des formes d’évaluation, des chaînes de chargeurs propres à l’environnement d’exécution ou des formes ambiguës à plusieurs fichiers), l’exécution soumise à approbation est refusée au lieu de prétendre offrir une couverture sémantique qu’elle ne possède pas.
- Pour ces flux de travail, privilégiez l’exécution en bac à sable, une limite d’hôte distincte ou une liste d’autorisation/un flux de travail complet explicitement approuvé dans lequel l’opérateur accepte la sémantique plus large de l’environnement d’exécution.

Lorsque des approbations sont requises, l’outil d’exécution renvoie immédiatement un identifiant d’approbation. Utilisez cet identifiant pour corréler les événements système ultérieurs de l’exécution approuvée (`Exec finished`, ainsi que `Exec running` lorsqu’il est configuré). Si aucune décision n’arrive avant l’expiration du délai, la requête est traitée comme une expiration de l’approbation et signalée comme un refus terminal de la commande hôte. Pour les approbations asynchrones de l’agent principal disposant d’une session d’origine, OpenClaw reprend également cette session avec un suivi interne afin que l’agent constate que la commande ne s’est pas exécutée, au lieu de tenter ultérieurement de réparer un résultat manquant. Les approbations d’exécution en attente expirent par défaut après 30 minutes.

### Comportement de livraison du suivi

Après la fin d’une exécution asynchrone approuvée, OpenClaw envoie un tour `agent` de suivi à la même session.
Les approbations asynchrones refusées utilisent le même chemin de suivi de la session principale pour signaler le refus, mais elles n’enregistrent pas de transfert vers un environnement d’exécution élevé et n’exécutent pas la commande. Les refus sans session principale pouvant être reprise sont soit ignorés, soit signalés par une voie directe sûre lorsqu’il en existe une.

- S’il existe une cible de livraison externe valide (canal permettant la livraison et cible `to`), le suivi est livré via ce canal.
- Dans les flux limités au chat web ou aux sessions internes sans cible externe, la livraison du suivi reste limitée à la session (`deliver: false`).
- Si un appelant demande explicitement une livraison externe stricte sans canal externe pouvant être résolu, la requête échoue avec `INVALID_REQUEST`.
- Si `bestEffortDeliver` est activé et qu’aucun canal externe ne peut être résolu, la livraison est rétrogradée en livraison limitée à la session au lieu d’échouer.

## Transfert des approbations vers les canaux de discussion

Vous pouvez transférer les invites d’approbation d’exécution vers n’importe quel canal de discussion (y compris les canaux de Plugin) et les approuver avec `/approve`. Cette fonctionnalité utilise le pipeline normal de livraison sortante.

Configuration :
__OC_I18N_900001__
Répondez dans le chat :
__OC_I18N_900002__
La commande `/approve` gère à la fois les approbations d’exécution et celles de Plugin. Si l’identifiant ne correspond à aucune approbation d’exécution en attente, elle vérifie automatiquement les approbations de Plugin à la place. Ce mécanisme de repli est limité aux échecs de type « approbation introuvable » ; un refus ou une erreur réelle d’approbation d’exécution ne déclenche pas silencieusement une nouvelle tentative en tant qu’approbation de Plugin.

### Transfert des approbations de Plugin

Le transfert des approbations de Plugin utilise le même pipeline de livraison que les approbations d’exécution, mais dispose de sa propre configuration indépendante sous `approvals.plugin`. L’activation ou la désactivation de l’un n’affecte pas l’autre.
Pour le comportement de création de Plugin, les champs de requête et la sémantique des décisions, consultez [Demandes d’autorisation de Plugin](/plugins/plugin-permission-requests).
__OC_I18N_900003__
La structure de configuration est identique à celle de `approvals.exec` : `enabled`, `mode`, `agentFilter`, `sessionFilter` et `targets` fonctionnent de la même manière.

Les canaux qui prennent en charge les réponses interactives partagées affichent les mêmes boutons d’approbation pour les approbations d’exécution et de
Plugin. Les canaux dépourvus d’interface utilisateur interactive partagée utilisent à la place du texte brut avec des instructions
`/approve`. Les demandes d’approbation de Plugin peuvent restreindre les décisions disponibles : les interfaces d’approbation utilisent
l’ensemble de décisions déclaré par la demande, et le Gateway rejette toute tentative d’envoyer une décision qui
n’a pas été proposée.

### Approbations dans la même conversation sur n’importe quel canal

Lorsqu’une demande d’approbation d’exécution ou de Plugin provient d’une interface de conversation permettant la remise des messages, cette même conversation
peut l’approuver avec `/approve` par défaut. Cela s’applique à Slack, Matrix, Microsoft Teams et aux
conversations similaires permettant la remise des messages, en plus des flux existants de l’interface Web et de l’interface de terminal, en utilisant le
modèle d’authentification normal du canal pour cette conversation. Si la conversation d’origine peut déjà envoyer des commandes
et recevoir des réponses, les demandes d’approbation n’ont plus besoin d’un adaptateur de remise natif distinct uniquement pour
rester en attente.

Discord, Telegram et QQ bot prennent également en charge `/approve` dans la même conversation, mais ces canaux utilisent toujours leur
liste d’approbateurs résolue pour l’autorisation, même lorsque la remise native des approbations est désactivée.

### Remise native des approbations

Certains canaux peuvent également agir comme clients d’approbation natifs : Discord, Slack, Telegram, Matrix et QQ bot.
Les clients natifs ajoutent les messages privés aux approbateurs, la diffusion vers la conversation d’origine et une expérience d’approbation interactive propre au canal,
en complément du flux partagé `/approve` dans la même conversation.

Lorsque des cartes ou boutons d’approbation natifs sont disponibles, cette interface native constitue le principal parcours destiné à l’agent.
L’agent ne doit pas également répéter une commande `/approve` en texte brut dans la conversation, sauf si le résultat de l’outil indique que
les approbations par conversation sont indisponibles ou que l’approbation manuelle est la seule possibilité restante.

Si un client d’approbation natif est configuré, mais qu’aucun environnement d’exécution natif n’est actif pour le canal
d’origine, OpenClaw conserve l’invite locale déterministe `/approve` visible. Si l’environnement d’exécution natif est
actif et tente la remise, mais qu’aucune cible ne reçoit la carte, OpenClaw envoie une notification de repli dans la même conversation
avec la commande exacte `/approve <id> <decision>` afin que la demande puisse toujours être traitée.

Modèle générique :

- la politique d’exécution de l’hôte détermine toujours si une approbation d’exécution est requise
- `approvals.exec` contrôle le transfert des invites d’approbation vers d’autres destinations de conversation
- `channels.<channel>.execApprovals` détermine si les clients natifs propres à Discord, Slack, Telegram, QQ bot et aux
  canaux similaires sont activés
- les approbations de Plugin Slack peuvent utiliser le client d’approbation natif de Slack lorsque la demande provient de Slack
  et que les approbateurs de Plugin Slack sont résolus ; `approvals.plugin` peut également acheminer les approbations de Plugin vers des
  sessions ou cibles Slack, même lorsque les approbations d’exécution Slack sont désactivées
- les cartes d’approbation natives de Google Chat gèrent les approbations d’exécution et de Plugin provenant d’espaces ou de fils de discussion Google
  Chat lorsque des approbateurs stables `users/<id>` sont résolus à partir de `dm.allowFrom` ou
  `defaultTo` ; elles n’utilisent pas les événements de réaction pour les décisions
- la remise des approbations par réaction dans WhatsApp et Signal est contrôlée par `approvals.exec` et
  `approvals.plugin` ; ces canaux ne comportent pas de blocs `channels.<channel>.execApprovals`

Les clients d’approbation natifs activent automatiquement la remise prioritaire par message privé lorsque toutes les conditions suivantes sont remplies :

- le canal prend en charge la remise native des approbations
- les approbateurs peuvent être résolus à partir de `execApprovals.approvers` explicites ou de l’identité du
  propriétaire, telle que `commands.ownerAllowFrom`
- `channels.<channel>.execApprovals.enabled` n’est pas défini ou vaut `"auto"`

Définissez `enabled: false` pour désactiver explicitement un client d’approbation natif. Définissez `enabled: true` pour forcer
son activation lorsque les approbateurs sont résolus. La remise publique dans la conversation d’origine reste explicitement contrôlée par
`channels.<channel>.execApprovals.target`. Lorsque la valeur native `target` active la remise dans la conversation d’origine,
les invites d’approbation incluent le texte de la commande.

FAQ : [Pourquoi existe-t-il deux configurations d’approbation d’exécution pour les approbations par conversation ?](/help/faq-first-run)

- Discord : `channels.discord.execApprovals.*`
- Slack : `channels.slack.execApprovals.*`
- Telegram : `channels.telegram.execApprovals.*`
- QQ bot : `channels.qqbot.execApprovals.*`
- Google Chat : configurez des approbateurs stables avec `channels.googlechat.dm.allowFrom` ou
  `channels.googlechat.defaultTo` ; aucun bloc `execApprovals` n’est requis
- WhatsApp : utilisez `approvals.exec` et `approvals.plugin` pour acheminer les invites d’approbation vers WhatsApp
- Signal : utilisez `approvals.exec` et `approvals.plugin` pour acheminer les invites d’approbation vers Signal

Acheminement propre aux clients natifs :

- Telegram utilise par défaut les messages privés aux approbateurs (`target: "dm"`). Passez à `channel` ou `both` pour également afficher
  les invites d’approbation dans la conversation ou le sujet Telegram d’origine. Pour les sujets de forum Telegram, OpenClaw
  conserve le sujet pour l’invite d’approbation et le suivi après approbation.
- Les approbateurs Discord et Telegram peuvent être explicites (`execApprovals.approvers`) ou déduits de
  `commands.ownerAllowFrom` ; seuls les approbateurs résolus peuvent approuver ou refuser.
- Les approbateurs Slack peuvent être explicites (`execApprovals.approvers`) ou déduits de
  `commands.ownerAllowFrom`. Les messages privés d’approbation de Plugin Slack utilisent les approbateurs de Plugin Slack issus de `allowFrom`
  et l’acheminement par défaut du compte, et non les approbateurs d’exécution Slack. Les boutons natifs Slack conservent le type de l’identifiant
  d’approbation, de sorte que les identifiants `plugin:` peuvent traiter les approbations de Plugin sans seconde couche de repli locale à Slack.
- Les cartes natives de Google Chat conservent le repli manuel `/approve` dans le texte du message, mais les rappels des boutons de la carte
  ne transportent que des jetons d’action opaques ; l’identifiant d’approbation et la décision sont récupérés depuis
  l’état des demandes en attente côté serveur.
- Les approbations par emoji WhatsApp gèrent à la fois les invites d’exécution et de Plugin lorsque la famille de
  transfert de niveau supérieur correspondante achemine vers WhatsApp. Les invites d’origine native sont liées directement ; la remise en
  mode cible partagé lie les mêmes métadonnées typées d’approbation à l’accusé de réception de message WhatsApp accepté.
- Les approbations par réaction Signal gèrent à la fois les invites d’exécution et de Plugin uniquement lorsque la famille de
  transfert de niveau supérieur correspondante est activée et achemine vers Signal. Les approbations d’exécution Signal directes dans la même conversation peuvent
  supprimer le repli local `/approve` sans approbateurs explicites ; la résolution par réaction Signal
  nécessite toujours des approbateurs Signal explicites provenant de `channels.signal.allowFrom` ou `defaultTo`.
- L’acheminement natif Matrix par message privé ou canal et les raccourcis par réaction gèrent les approbations d’exécution et de Plugin ;
  l’autorisation des Plugins provient toujours de `channels.matrix.dm.allowFrom`. Les invites natives Matrix
  incluent le contenu d’événement personnalisé `com.openclaw.approval` dans le premier événement d’invite afin que les clients
  Matrix compatibles avec OpenClaw puissent lire l’état d’approbation structuré, tandis que les clients standard conservent le repli en texte brut
  `/approve`.
- Les boutons d’approbation natifs Discord et Telegram transportent un type explicite de propriétaire d’exécution ou de Plugin dans les
  données de rappel privées au transport et ne traitent que ce propriétaire. Les anciens contrôles `/approve` dépourvus
  de type restent un chemin de compatibilité limité : ils essaient uniquement les types de propriétaires que l’acteur peut approuver,
  ne poursuivent qu’après un résultat indiquant que l’approbation est introuvable et ne déduisent jamais la propriété à partir de l’identifiant d’approbation.
- Le demandeur n’a pas besoin d’être un approbateur.
- Si aucune interface opérateur ni aucun client d’approbation configuré ne peut accepter la demande, l’invite utilise
  `askFallback` comme solution de repli.

Les commandes de groupe sensibles réservées au propriétaire, telles que `/diagnostics` et `/export-trajectory`, utilisent un
acheminement privé vers le propriétaire pour les invites d’approbation et les résultats finaux. OpenClaw essaie d’abord un acheminement privé sur la
même interface que celle depuis laquelle le propriétaire a exécuté la commande. Si cette interface ne dispose d’aucun acheminement privé vers le propriétaire, OpenClaw
utilise à la place le premier acheminement disponible vers le propriétaire dans `commands.ownerAllowFrom`, de sorte qu’une commande de groupe Discord
peut toujours envoyer l’approbation et le résultat dans le message privé Telegram du propriétaire lorsque Telegram est configuré comme
interface privée principale. La conversation de groupe reçoit uniquement un bref accusé de réception.

Voir :

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)
- [QQ bot](/channels/qqbot)

### Applications mobiles officielles pour les opérateurs

Les applications officielles iOS et Android peuvent également examiner les approbations d’exécution en attente détenues par le Gateway
lorsqu’une connexion `operator.admin` est utilisée, ou lorsque leur appareil
`operator.approvals` associé a été explicitement ciblé par la demande. Elles lisent
le même enregistrement durable assaini que celui utilisé par la
Control UI, envoient une décision tenant compte du type et affichent le résultat canonique
de la première réponse du Gateway. L’Apple Watch reproduit ces invites d’approbation par l’intermédiaire
de l’iPhone associé, avec des actions d’autorisation unique et de refus. Le mode Gateway direct de la Watch
ne permet pas d’examiner les approbations.

La perte d’un accusé de réception de la résolution ne rend pas le choix envoyé définitif :
l’application désactive les contrôles et relit l’enregistrement. Si une autre interface
a prévalu, l’application affiche cette décision enregistrée. Les invites en attente restent liées au
Gateway qui les a émises ; changer de Gateway actif ne peut donc pas rediriger un
ancien identifiant d’approbation.

### Flux IPC macOS
__OC_I18N_900004__
Remarques de sécurité :

- Mode du socket Unix `0600`, jeton stocké dans `exec-approvals.json`.
- Vérification du pair avec le même UID.
- Défi/réponse (nonce + jeton HMAC + hachage de la demande) + TTL court.

## FAQ

### Quand `accountId` et `threadId` sont-ils utilisés sur une cible d’approbation ?

Utilisez `accountId` lorsque plusieurs identités sont configurées pour le canal et que l’invite d’approbation doit
être envoyée par un compte précis. Utilisez `threadId` lorsque la destination prend en charge les sujets ou les
fils de discussion et que l’invite doit rester dans ce fil plutôt que dans la conversation de premier niveau.

Un exemple concret pour Telegram est un supergroupe d’exploitation avec des sujets de forum et deux comptes de bot Telegram.
La valeur `to` désigne le supergroupe, `accountId` sélectionne le compte du bot et `threadId`
sélectionne le sujet du forum :
__OC_I18N_900005__
Avec cette configuration, les approbations d’exécution transférées sont publiées par le compte Telegram `ops-bot` dans le sujet
`77` de la conversation `-1001234567890`. Une cible sans `accountId` utilise le compte par défaut du canal, et
une cible sans `threadId` publie dans la destination de premier niveau.

### Lorsque les approbations sont envoyées à une session, n’importe quel participant de cette session peut-il les approuver ?

Non. La remise dans une session détermine uniquement où l’invite apparaît. Elle n’autorise pas à elle seule chaque
participant de cette conversation à approuver.

Pour le mécanisme générique `/approve` dans la même conversation, l’expéditeur doit déjà être autorisé à exécuter des commandes dans cette
session de canal. Si le canal expose des approbateurs explicites, ceux-ci peuvent autoriser
l’action `/approve` même s’ils ne sont pas autrement autorisés à exécuter des commandes dans cette session.

Certains canaux sont plus stricts. Les messages privés d’approbation natifs de Discord, Telegram, Matrix et Slack, ainsi que les
clients d’approbation natifs similaires, utilisent leurs listes d’approbateurs résolues pour autoriser les approbations. Par exemple,
une invite d’approbation dans un sujet de forum Telegram peut être visible par tous les participants du sujet, mais seuls les identifiants
numériques des utilisateurs Telegram résolus à partir de `channels.telegram.execApprovals.approvers` ou de
`commands.ownerAllowFrom` peuvent l’approuver ou la refuser.

## Pages connexes

- [Approbations d’exécution](/fr/tools/exec-approvals) — politique centrale et flux d’approbation
- [Outil d’exécution](/fr/tools/exec)
- [Mode privilégié](/fr/tools/elevated)
- [Skills](/fr/tools/skills) — comportement d’autorisation automatique reposant sur les Skills
