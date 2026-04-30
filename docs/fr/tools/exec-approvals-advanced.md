---
read_when:
    - Configuration des répertoires de binaires sûrs ou des profils de répertoires de binaires sûrs personnalisés
    - Transfert des approbations vers Slack/Discord/Telegram ou d’autres canaux de messagerie
    - Implémentation d’un client d’approbation natif pour un canal
summary: 'Approbations exec avancées : binaires sûrs, liaison d’interpréteur, transfert d’approbation, livraison native'
title: Autorisations d’exécution — avancées
x-i18n:
    generated_at: "2026-04-30T07:51:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: de8a72ca1d23e55dc198ae3c5ad55a57660c2111feebfb89f08d8fa9584e4337
    source_path: tools/exec-approvals-advanced.md
    workflow: 16
---

Sujets avancés d’approbation d’exécution : le chemin rapide `safeBins`, la liaison interpréteur/runtime
et le transfert des approbations vers les canaux de chat (y compris la livraison native).
Pour la politique centrale et le flux d’approbation, consultez [Approbations d’exécution](/fr/tools/exec-approvals).

## Bins sûrs (stdin uniquement)

`tools.exec.safeBins` définit une petite liste de binaires **stdin uniquement** (par
exemple `cut`) qui peuvent s’exécuter en mode liste d’autorisation **sans** entrées explicites
dans la liste d’autorisation. Les bins sûrs rejettent les arguments de fichier positionnels et les jetons de type chemin, de sorte qu’ils
ne peuvent fonctionner que sur le flux entrant. Considérez cela comme un chemin rapide étroit pour les
filtres de flux, et non comme une liste de confiance générale.

<Warning>
N’ajoutez **pas** de binaires d’interpréteur ou de runtime (par exemple `python3`, `node`,
`ruby`, `bash`, `sh`, `zsh`) à `safeBins`. Si une commande peut évaluer du code,
exécuter des sous-commandes ou lire des fichiers par conception, préférez des entrées explicites
dans la liste d’autorisation et gardez les invites d’approbation activées. Les bins sûrs personnalisés doivent définir un profil
explicite dans `tools.exec.safeBinProfiles.<bin>`.
</Warning>

Bins sûrs par défaut :

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` et `sort` ne figurent pas dans la liste par défaut. Si vous les activez, conservez des entrées
explicites dans la liste d’autorisation pour leurs workflows non-stdin. Pour `grep` en mode bin sûr,
fournissez le motif avec `-e`/`--regexp` ; la forme positionnelle du motif est rejetée
afin que les opérandes de fichier ne puissent pas être introduits comme arguments positionnels ambigus.

### Validation argv et indicateurs refusés

La validation est déterministe uniquement à partir de la forme d’argv (aucune vérification d’existence sur le système de fichiers
de l’hôte), ce qui empêche un comportement d’oracle d’existence de fichier via les différences
autoriser/refuser. Les options orientées fichier sont refusées pour les bins sûrs par défaut ; les options longues
sont validées en échec fermé (les indicateurs inconnus et les abréviations ambiguës sont
rejetés).

Indicateurs refusés par profil de bin sûr :

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

Les bins sûrs forcent également les jetons argv à être traités comme du **texte littéral** au moment de l’exécution
(pas de globbing ni d’expansion de `$VARS`) pour les segments stdin uniquement, de sorte que des motifs
comme `*` ou `$HOME/...` ne peuvent pas servir à introduire des lectures de fichiers.

### Répertoires de binaires fiables

Les bins sûrs doivent être résolus depuis des répertoires de binaires fiables (valeurs par défaut du système plus
`tools.exec.safeBinTrustedDirs` facultatif). Les entrées `PATH` ne sont jamais automatiquement approuvées.
Les répertoires fiables par défaut sont volontairement minimaux : `/bin`, `/usr/bin`. Si
votre exécutable de bin sûr se trouve dans des chemins de gestionnaire de paquets/utilisateur (par exemple
`/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`), ajoutez-les
explicitement à `tools.exec.safeBinTrustedDirs`.

### Chaînage shell, wrappers et multiplexeurs

Le chaînage shell (`&&`, `||`, `;`) est autorisé lorsque chaque segment de premier niveau
satisfait la liste d’autorisation (y compris les bins sûrs ou l’autorisation automatique de compétence). Les redirections
restent non prises en charge en mode liste d’autorisation. La substitution de commande (`$()` / accents graves) est
rejetée pendant l’analyse de la liste d’autorisation, y compris à l’intérieur de guillemets doubles ; utilisez des guillemets simples
si vous avez besoin du texte littéral `$()`.

Sur macOS, pour les approbations de l’app compagnon, le texte shell brut contenant une syntaxe de contrôle ou
d’expansion shell (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) est
traité comme une absence de correspondance dans la liste d’autorisation, sauf si le binaire shell lui-même est autorisé.

Pour les wrappers shell (`bash|sh|zsh ... -c/-lc`), les remplacements d’environnement limités à la requête sont
réduits à une petite liste d’autorisation explicite (`TERM`, `LANG`, `LC_*`, `COLORTERM`,
`NO_COLOR`, `FORCE_COLOR`).

Pour les décisions `allow-always` en mode liste d’autorisation, les wrappers de dispatch connus (`env`,
`nice`, `nohup`, `stdbuf`, `timeout`) persistent le chemin de l’exécutable interne au lieu
du chemin du wrapper. Les multiplexeurs shell (`busybox`, `toybox`) sont déballés pour les
applets shell (`sh`, `ash`, etc.) de la même manière. Si un wrapper ou un multiplexeur
ne peut pas être déballé en sécurité, aucune entrée de liste d’autorisation n’est persistée automatiquement.

Si vous ajoutez des interpréteurs comme `python3` ou `node` à la liste d’autorisation, préférez
`tools.exec.strictInlineEval=true` afin que l’évaluation inline exige toujours une approbation
explicite. En mode strict, `allow-always` peut toujours persister des invocations
bénignes d’interpréteur/script, mais les transporteurs d’évaluation inline ne sont pas persistés
automatiquement.

### Bins sûrs et liste d’autorisation

| Sujet            | `tools.exec.safeBins`                                  | Liste d’autorisation (`exec-approvals.json`)                                                  |
| ---------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| Objectif         | Autoriser automatiquement des filtres stdin étroits    | Faire explicitement confiance à des exécutables précis                                              |
| Type de correspondance | Nom de l’exécutable + politique argv de bin sûr       | Glob du chemin d’exécutable résolu, ou glob de nom de commande nu pour les commandes invoquées via PATH |
| Portée des arguments | Restreinte par le profil de bin sûr et les règles de jetons littéraux | Correspondance de chemin uniquement ; les arguments relèvent autrement de votre responsabilité                       |
| Exemples typiques | `head`, `tail`, `tr`, `wc`                             | `jq`, `python3`, `node`, `ffmpeg`, CLI personnalisées                                     |
| Meilleur usage   | Transformations de texte à faible risque dans les pipelines | Tout outil ayant un comportement ou des effets secondaires plus larges                                     |

Emplacement de configuration :

- `safeBins` provient de la configuration (`tools.exec.safeBins` ou `agents.list[].tools.exec.safeBins` par agent).
- `safeBinTrustedDirs` provient de la configuration (`tools.exec.safeBinTrustedDirs` ou `agents.list[].tools.exec.safeBinTrustedDirs` par agent).
- `safeBinProfiles` provient de la configuration (`tools.exec.safeBinProfiles` ou `agents.list[].tools.exec.safeBinProfiles` par agent). Les clés de profil par agent remplacent les clés globales.
- Les entrées de liste d’autorisation résident dans le fichier local à l’hôte `~/.openclaw/exec-approvals.json` sous `agents.<id>.allowlist` (ou via l’interface utilisateur de contrôle / `openclaw approvals allowlist ...`).
- `openclaw security audit` avertit avec `tools.exec.safe_bins_interpreter_unprofiled` lorsque des bins d’interpréteur/runtime apparaissent dans `safeBins` sans profils explicites.
- `openclaw doctor --fix` peut échafauder les entrées `safeBinProfiles.<bin>` personnalisées manquantes sous forme de `{}` (à examiner et à resserrer ensuite). Les bins d’interpréteur/runtime ne sont pas échafaudés automatiquement.

Exemple de profil personnalisé :
__OC_I18N_900000__
Si vous activez explicitement `jq` dans `safeBins`, OpenClaw rejette toujours le builtin `env` en mode bin sûr,
de sorte que `jq -n env` ne puisse pas vider l’environnement du processus hôte sans chemin explicite dans la liste d’autorisation
ni invite d’approbation.

## Commandes d’interpréteur/runtime

Les exécutions d’interpréteur/runtime appuyées par approbation sont volontairement conservatrices :

- Le contexte exact argv/cwd/env est toujours lié.
- Les formes de script shell direct et de fichier runtime direct sont liées au mieux à un instantané concret unique
  de fichier local.
- Les formes courantes de wrappers de gestionnaire de paquets qui se résolvent encore vers un fichier local direct unique (par exemple
  `pnpm exec`, `pnpm node`, `npm exec`, `npx`) sont déballées avant la liaison.
- Si OpenClaw ne peut pas identifier exactement un fichier local concret unique pour une commande d’interpréteur/runtime
  (par exemple scripts de paquet, formes eval, chaînes de chargeurs propres au runtime ou formes multi-fichiers ambiguës),
  l’exécution appuyée par approbation est refusée au lieu de prétendre à une couverture sémantique qu’elle n’a pas.
- Pour ces workflows, préférez le sandboxing, une frontière d’hôte séparée ou un workflow complet/liste d’autorisation de confiance explicite
  où l’opérateur accepte la sémantique plus large du runtime.

Lorsque des approbations sont requises, l’outil exec renvoie immédiatement un identifiant d’approbation. Utilisez cet identifiant pour
mettre en corrélation les événements système ultérieurs (`Exec finished` / `Exec denied`). Si aucune décision n’arrive avant le
délai d’expiration, la requête est traitée comme un délai d’approbation expiré et exposée comme motif de refus.

### Comportement de livraison de suivi

Après la fin d’une exécution async approuvée, OpenClaw envoie un tour de suivi `agent` à la même session.

- Si une cible de livraison externe valide existe (canal livrable plus cible `to`), la livraison de suivi utilise ce canal.
- Dans les flux webchat uniquement ou les sessions internes sans cible externe, la livraison de suivi reste limitée à la session (`deliver: false`).
- Si un appelant demande explicitement une livraison externe stricte sans canal externe résolvable, la requête échoue avec `INVALID_REQUEST`.
- Si `bestEffortDeliver` est activé et qu’aucun canal externe ne peut être résolu, la livraison est rétrogradée à session uniquement au lieu d’échouer.

## Transfert des approbations vers les canaux de chat

Vous pouvez transférer les invites d’approbation d’exécution vers n’importe quel canal de chat (y compris les canaux de Plugin) et les approuver
avec `/approve`. Cela utilise le pipeline normal de livraison sortante.

Configuration :
__OC_I18N_900001__
Répondre dans le chat :
__OC_I18N_900002__
La commande `/approve` gère à la fois les approbations d’exécution et les approbations de Plugin. Si l’identifiant ne correspond pas à une approbation d’exécution en attente, elle vérifie automatiquement les approbations de Plugin à la place.

### Transfert des approbations de Plugin

Le transfert des approbations de Plugin utilise le même pipeline de livraison que les approbations d’exécution, mais possède sa propre
configuration indépendante sous `approvals.plugin`. Activer ou désactiver l’un n’affecte pas l’autre.
__OC_I18N_900003__
La forme de configuration est identique à `approvals.exec` : `enabled`, `mode`, `agentFilter`,
`sessionFilter` et `targets` fonctionnent de la même manière.

Les canaux qui prennent en charge les réponses interactives partagées affichent les mêmes boutons d’approbation pour les approbations d’exécution et
de Plugin. Les canaux sans interface utilisateur interactive partagée reviennent au texte brut avec des instructions `/approve`.

### Approbations dans le même chat sur n’importe quel canal

Lorsqu’une demande d’approbation d’exécution ou de Plugin provient d’une surface de chat livrable, le même chat
peut désormais l’approuver avec `/approve` par défaut. Cela s’applique aux canaux tels que Slack, Matrix et
Microsoft Teams en plus des flux existants de l’interface utilisateur Web et de l’interface utilisateur terminal.

Ce chemin de commande textuelle partagé utilise le modèle d’authentification normal du canal pour cette conversation. Si le
chat d’origine peut déjà envoyer des commandes et recevoir des réponses, les demandes d’approbation n’ont plus besoin d’un
adaptateur de livraison native séparé simplement pour rester en attente.

Discord et Telegram prennent également en charge `/approve` dans le même chat, mais ces canaux utilisent toujours leur
liste d’approbateurs résolue pour l’autorisation, même lorsque la livraison native des approbations est désactivée.

Pour Telegram et les autres clients d’approbation natifs qui appellent directement le Gateway,
ce repli est volontairement limité aux échecs « approbation introuvable ». Un vrai
refus/une vraie erreur d’approbation d’exécution ne réessaie pas silencieusement comme approbation de Plugin.

### Livraison native des approbations

Certains canaux peuvent aussi agir comme clients d’approbation natifs. Les clients natifs ajoutent les DM d’approbateurs, la diffusion au chat d’origine
et une UX d’approbation interactive propre au canal au-dessus du flux partagé `/approve` dans le même chat.

Lorsque des cartes/boutons d’approbation natifs sont disponibles, cette interface utilisateur native est le chemin principal
côté agent. L’agent ne doit pas aussi répéter une commande de chat en clair
`/approve` en double, sauf si le résultat de l’outil indique que les approbations par chat ne sont pas disponibles ou que
l’approbation manuelle est le seul chemin restant.

Si un client d’approbation natif est configuré mais qu’aucun runtime natif n’est actif pour
le canal d’origine, OpenClaw conserve l’invite locale déterministe `/approve`
visible. Si le runtime natif est actif et tente la livraison mais qu’aucune
cible ne reçoit la carte, OpenClaw envoie une notification de repli dans le même chat avec la
commande exacte `/approve <id> <decision>` afin que la demande puisse quand même être traitée.

Modèle générique :

- la politique d’exécution de l’hôte décide toujours si une approbation d’exécution est requise
- `approvals.exec` contrôle le transfert des invites d’approbation vers d’autres destinations de chat
- `channels.<channel>.execApprovals` contrôle si ce canal agit comme client d’approbation natif

Les clients d’approbation natifs activent automatiquement la livraison en DM d’abord lorsque toutes ces conditions sont vraies :

- le canal prend en charge la livraison d’approbation native
- les approbateurs peuvent être résolus à partir de `execApprovals.approvers` explicites ou de
  l’identité du propriétaire, comme `commands.ownerAllowFrom`
- `channels.<channel>.execApprovals.enabled` n’est pas défini ou vaut `"auto"`

Définissez `enabled: false` pour désactiver explicitement un client d’approbation natif. Définissez `enabled: true` pour forcer
son activation lorsque les approbateurs peuvent être résolus. La livraison dans le chat public d’origine reste explicite via
`channels.<channel>.execApprovals.target`.

FAQ : [Pourquoi existe-t-il deux configurations d’approbation d’exécution pour les approbations par chat ?](/help/faq-first-run#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord : `channels.discord.execApprovals.*`
- Slack : `channels.slack.execApprovals.*`
- Telegram : `channels.telegram.execApprovals.*`

Ces clients d’approbation natifs ajoutent le routage DM et une diffusion facultative vers les canaux par-dessus le flux partagé
`/approve` dans le même chat et les boutons d’approbation partagés.

Comportement partagé :

- Slack, Matrix, Microsoft Teams et les chats similaires livrables utilisent le modèle d’authentification de canal normal
  pour `/approve` dans le même chat
- lorsqu’un client d’approbation natif s’active automatiquement, la cible de livraison native par défaut est les DM des approbateurs
- pour Discord et Telegram, seuls les approbateurs résolus peuvent approuver ou refuser
- les approbateurs Discord peuvent être explicites (`execApprovals.approvers`) ou déduits de `commands.ownerAllowFrom`
- les approbateurs Telegram peuvent être explicites (`execApprovals.approvers`) ou déduits de `commands.ownerAllowFrom`
- les approbateurs Slack peuvent être explicites (`execApprovals.approvers`) ou déduits de `commands.ownerAllowFrom`
- les boutons natifs Slack préservent le type de l’identifiant d’approbation, de sorte que les identifiants `plugin:` peuvent résoudre les approbations de Plugin
  sans seconde couche de repli locale à Slack
- le routage natif Matrix en DM/canal et les raccourcis par réaction gèrent à la fois les approbations d’exécution et de Plugin ;
  l’autorisation de Plugin provient toujours de `channels.matrix.dm.allowFrom`
- les invites natives Matrix incluent le contenu d’événement personnalisé `com.openclaw.approval` dans le premier événement
  d’invite, afin que les clients Matrix compatibles avec OpenClaw puissent lire l’état d’approbation structuré tandis que les clients standard
  conservent le repli `/approve` en texte brut
- le demandeur n’a pas besoin d’être approbateur
- le chat d’origine peut approuver directement avec `/approve` lorsque ce chat prend déjà en charge les commandes et les réponses
- les boutons d’approbation natifs Discord routent selon le type de l’identifiant d’approbation : les identifiants `plugin:` vont
  directement aux approbations de Plugin, tout le reste va aux approbations d’exécution
- les boutons d’approbation natifs Telegram suivent le même repli borné de l’exécution vers le Plugin que `/approve`
- lorsque `target` natif active la livraison dans le chat d’origine, les invites d’approbation incluent le texte de la commande
- les approbations d’exécution en attente expirent après 30 minutes par défaut
- si aucune interface utilisateur opérateur ni aucun client d’approbation configuré ne peut accepter la demande, l’invite se replie sur `askFallback`

Les commandes de groupe sensibles réservées au propriétaire, comme `/diagnostics` et `/export-trajectory`, utilisent le routage privé
du propriétaire pour les invites d’approbation et les résultats finaux. OpenClaw essaie d’abord une route privée sur la
même surface que celle où le propriétaire a exécuté la commande. Si cette surface n’a aucune route privée de propriétaire, il se
replie sur la première route de propriétaire disponible depuis `commands.ownerAllowFrom`, afin qu’une commande de groupe Discord
puisse quand même envoyer l’approbation et le résultat au DM Telegram du propriétaire lorsque Telegram est l’interface privée
principale configurée. Le chat de groupe ne reçoit qu’un court accusé de réception.

Telegram utilise par défaut les DM des approbateurs (`target: "dm"`). Vous pouvez passer à `channel` ou `both` lorsque vous
voulez que les invites d’approbation apparaissent aussi dans le chat/sujet Telegram d’origine. Pour les sujets de forum Telegram,
OpenClaw préserve le sujet pour l’invite d’approbation et le suivi post-approbation.

Voir :

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### Flux IPC macOS
__OC_I18N_900004__
Notes de sécurité :

- mode de socket Unix `0600`, jeton stocké dans `exec-approvals.json`.
- Vérification du pair avec le même UID.
- Défi/réponse (nonce + jeton HMAC + hachage de requête) + TTL courte.

## Associé

- [Approbations d’exécution](/fr/tools/exec-approvals) — politique principale et flux d’approbation
- [Outil d’exécution](/fr/tools/exec)
- [Mode élevé](/fr/tools/elevated)
- [Skills](/fr/tools/skills) — comportement d’autorisation automatique adossé aux Skills
