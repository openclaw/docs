---
read_when:
    - Configurer des binaires sûrs ou des profils personnalisés de binaires sûrs
    - Transférer les approbations vers Slack/Discord/Telegram ou d’autres canaux de chat
    - Implémenter un client d’approbation natif pour un canal
summary: 'Approbations d’exécution avancées : binaires sûrs, liaison de l’interpréteur, transfert des approbations, livraison native'
title: Approbations d’exécution — avancé
x-i18n:
    generated_at: "2026-04-25T13:58:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: f5fab4a65d2d14f0d15cbe750d718b2a4e8f781a218debdb24b41be570a22d87
    source_path: tools/exec-approvals-advanced.md
    workflow: 15
---

Sujets avancés des approbations d’exécution : le chemin rapide `safeBins`, la liaison de l’interpréteur/runtime et le transfert des approbations vers les canaux de chat (y compris la livraison native). Pour la politique centrale et le flux d’approbation, voir [Approbations d’exécution](/fr/tools/exec-approvals).

## Binaires sûrs (stdin uniquement)

`tools.exec.safeBins` définit une petite liste de binaires **stdin uniquement** (par exemple `cut`) qui peuvent s’exécuter en mode allowlist **sans** entrées allowlist explicites. Les binaires sûrs rejettent les arguments de fichier positionnels et les jetons de type chemin, de sorte qu’ils ne peuvent opérer que sur le flux entrant. Considérez cela comme un chemin rapide étroit pour les filtres de flux, et non comme une liste générale de confiance.

<Warning>
N’ajoutez **pas** de binaires d’interpréteur ou de runtime (par exemple `python3`, `node`, `ruby`, `bash`, `sh`, `zsh`) à `safeBins`. Si une commande peut évaluer du code, exécuter des sous-commandes ou lire des fichiers par conception, préférez des entrées allowlist explicites et laissez les invites d’approbation activées. Les binaires sûrs personnalisés doivent définir un profil explicite dans `tools.exec.safeBinProfiles.<bin>`.
</Warning>

Binaires sûrs par défaut :

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` et `sort` ne figurent pas dans la liste par défaut. Si vous choisissez de les activer, conservez des entrées allowlist explicites pour leurs flux de travail non stdin. Pour `grep` en mode binaire sûr, fournissez le motif avec `-e`/`--regexp` ; la forme positionnelle du motif est rejetée afin que des opérandes de fichier ne puissent pas être introduits en contrebande comme positionnels ambigus.

### Validation argv et drapeaux refusés

La validation est déterministe à partir de la seule forme argv (pas de vérification de l’existence du système de fichiers hôte), ce qui évite un comportement d’oracle d’existence de fichier à partir des différences allow/deny. Les options orientées fichier sont refusées pour les binaires sûrs par défaut ; les options longues sont validées en mode fail-closed (les drapeaux inconnus et les abréviations ambiguës sont rejetés).

Drapeaux refusés par profil de binaire sûr :

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep` : `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq` : `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort` : `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc` : `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

Les binaires sûrs forcent également les jetons argv à être traités comme du **texte littéral** au moment de l’exécution (pas de globbing ni d’expansion `$VARS`) pour les segments stdin uniquement, de sorte que des motifs comme `*` ou `$HOME/...` ne puissent pas être utilisés pour introduire des lectures de fichiers en contrebande.

### Répertoires de binaires de confiance

Les binaires sûrs doivent être résolus à partir de répertoires de binaires de confiance (valeurs système par défaut plus `tools.exec.safeBinTrustedDirs` facultatif). Les entrées `PATH` ne sont jamais approuvées automatiquement. Les répertoires de confiance par défaut sont volontairement minimaux : `/bin`, `/usr/bin`. Si votre exécutable de binaire sûr se trouve dans des chemins de gestionnaire de paquets/utilisateur (par exemple `/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`), ajoutez-les explicitement à `tools.exec.safeBinTrustedDirs`.

### Chaînage shell, wrappers et multiplexeurs

Le chaînage shell (`&&`, `||`, `;`) est autorisé lorsque chaque segment de niveau supérieur satisfait l’allowlist (y compris les binaires sûrs ou l’auto-autorisation par Skill). Les redirections restent non prises en charge en mode allowlist. La substitution de commande (`$()` / accents graves) est rejetée lors de l’analyse allowlist, y compris à l’intérieur de guillemets doubles ; utilisez des guillemets simples si vous avez besoin de texte littéral `$()`.

Sur les approbations de l’application compagnon macOS, le texte shell brut contenant une syntaxe de contrôle ou d’expansion shell (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) est traité comme un échec allowlist sauf si le binaire shell lui-même est en allowlist.

Pour les wrappers shell (`bash|sh|zsh ... -c/-lc`), les remplacements env à portée de requête sont réduits à une petite allowlist explicite (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).

Pour les décisions `allow-always` en mode allowlist, les wrappers de distribution connus (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) conservent le chemin de l’exécutable interne au lieu du chemin du wrapper. Les multiplexeurs shell (`busybox`, `toybox`) sont déballés pour les applets shell (`sh`, `ash`, etc.) de la même manière. Si un wrapper ou un multiplexeur ne peut pas être déballé en toute sécurité, aucune entrée allowlist n’est automatiquement conservée.

Si vous mettez des interpréteurs comme `python3` ou `node` en allowlist, préférez `tools.exec.strictInlineEval=true` afin que l’évaluation inline nécessite toujours une approbation explicite. En mode strict, `allow-always` peut toujours conserver des invocations bénignes d’interpréteur/script, mais les vecteurs d’évaluation inline ne sont pas conservés automatiquement.

### Binaires sûrs versus allowlist

| Sujet | `tools.exec.safeBins` | Allowlist (`exec-approvals.json`) |
| ---------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| Objectif | Autoriser automatiquement des filtres stdin étroits | Faire explicitement confiance à des exécutables spécifiques |
| Type de correspondance | Nom d’exécutable + politique argv de binaire sûr | Glob de chemin d’exécutable résolu, ou glob de nom de commande nu pour les commandes invoquées via PATH |
| Portée des arguments | Restreinte par le profil de binaire sûr et les règles de jetons littéraux | Correspondance de chemin uniquement ; les arguments relèvent autrement de votre responsabilité |
| Exemples typiques | `head`, `tail`, `tr`, `wc` | `jq`, `python3`, `node`, `ffmpeg`, CLI personnalisés |
| Meilleure utilisation | Transformations de texte à faible risque dans des pipelines | Tout outil avec un comportement plus large ou des effets secondaires |

Emplacement de la configuration :

- `safeBins` provient de la configuration (`tools.exec.safeBins` ou par agent `agents.list[].tools.exec.safeBins`).
- `safeBinTrustedDirs` provient de la configuration (`tools.exec.safeBinTrustedDirs` ou par agent `agents.list[].tools.exec.safeBinTrustedDirs`).
- `safeBinProfiles` provient de la configuration (`tools.exec.safeBinProfiles` ou par agent `agents.list[].tools.exec.safeBinProfiles`). Les clés de profil par agent remplacent les clés globales.
- les entrées allowlist résident dans `~/.openclaw/exec-approvals.json` local à l’hôte sous `agents.<id>.allowlist` (ou via l’UI de contrôle / `openclaw approvals allowlist ...`).
- `openclaw security audit` avertit avec `tools.exec.safe_bins_interpreter_unprofiled` lorsque des binaires d’interpréteur/runtime apparaissent dans `safeBins` sans profils explicites.
- `openclaw doctor --fix` peut générer les entrées personnalisées manquantes `safeBinProfiles.<bin>` sous la forme `{}` (vérifiez et resserrez ensuite). Les binaires d’interpréteur/runtime ne sont pas générés automatiquement.

Exemple de profil personnalisé :
__OC_I18N_900000__
Si vous activez explicitement `jq` dans `safeBins`, OpenClaw rejette quand même le builtin `env` en mode binaire sûr afin que `jq -n env` ne puisse pas vider l’environnement du processus hôte sans chemin allowlist explicite ni invite d’approbation.

## Commandes d’interpréteur/runtime

Les exécutions d’interpréteur/runtime appuyées par approbation sont volontairement conservatrices :

- Le contexte exact argv/cwd/env est toujours lié.
- Les formes directes de script shell et de fichier runtime sont liées, en mode best-effort, à un instantané concret unique de fichier local.
- Les formes courantes de wrapper de gestionnaire de paquets qui se résolvent quand même vers un fichier local direct unique (par exemple `pnpm exec`, `pnpm node`, `npm exec`, `npx`) sont déballées avant la liaison.
- Si OpenClaw ne peut pas identifier exactement un fichier local concret pour une commande d’interpréteur/runtime (par exemple scripts de paquet, formes eval, chaînes de chargeur spécifiques au runtime ou formes ambiguës multi-fichiers), l’exécution appuyée par approbation est refusée au lieu de prétendre couvrir sémantiquement ce qu’elle ne couvre pas.
- Pour ces flux de travail, préférez le sandboxing, une frontière d’hôte séparée ou un flux complet/allowlist explicitement approuvé où l’opérateur accepte la sémantique runtime plus large.

Lorsque des approbations sont requises, l’outil exec renvoie immédiatement avec un identifiant d’approbation. Utilisez cet identifiant pour corréler les événements système ultérieurs (`Exec finished` / `Exec denied`). Si aucune décision n’arrive avant le délai d’attente, la requête est traitée comme un délai d’attente d’approbation et exposée comme motif de refus.

### Comportement de livraison du suivi

Une fois une exécution asynchrone approuvée terminée, OpenClaw envoie un tour `agent` de suivi à la même session.

- Si une cible de livraison externe valide existe (canal livrable plus cible `to`), la livraison du suivi utilise ce canal.
- Dans les flux webchat uniquement ou session interne sans cible externe, la livraison du suivi reste limitée à la session (`deliver: false`).
- Si un appelant demande explicitement une livraison externe stricte sans canal externe résoluble, la requête échoue avec `INVALID_REQUEST`.
- Si `bestEffortDeliver` est activé et qu’aucun canal externe ne peut être résolu, la livraison est rétrogradée en mode session uniquement au lieu d’échouer.

## Transfert des approbations vers les canaux de chat

Vous pouvez transférer les invites d’approbation d’exécution vers n’importe quel canal de chat (y compris les canaux de Plugin) et les approuver avec `/approve`. Cela utilise le pipeline normal de livraison sortante.

Configuration :
__OC_I18N_900001__
Répondez dans le chat :
__OC_I18N_900002__
La commande `/approve` gère à la fois les approbations d’exécution et les approbations de Plugin. Si l’identifiant ne correspond pas à une approbation d’exécution en attente, elle vérifie automatiquement les approbations de Plugin à la place.

### Transfert des approbations de Plugin

Le transfert des approbations de Plugin utilise le même pipeline de livraison que les approbations d’exécution, mais possède sa propre configuration indépendante sous `approvals.plugin`. Activer ou désactiver l’un n’affecte pas l’autre.
__OC_I18N_900003__
La forme de configuration est identique à `approvals.exec` : `enabled`, `mode`, `agentFilter`, `sessionFilter` et `targets` fonctionnent de la même manière.

Les canaux qui prennent en charge les réponses interactives partagées affichent les mêmes boutons d’approbation pour les approbations d’exécution et de Plugin. Les canaux sans UI interactive partagée basculent vers du texte brut avec des instructions `/approve`.

### Approbations dans le même chat sur n’importe quel canal

Lorsqu’une demande d’approbation d’exécution ou de Plugin provient d’une surface de chat livrable, ce même chat peut désormais l’approuver avec `/approve` par défaut. Cela s’applique à des canaux comme Slack, Matrix et Microsoft Teams, en plus des flux existants d’interface Web et d’interface terminal.

Ce chemin partagé de commande texte utilise le modèle d’authentification normal du canal pour cette conversation. Si le chat d’origine peut déjà envoyer des commandes et recevoir des réponses, les demandes d’approbation n’ont plus besoin d’un adaptateur de livraison natif séparé juste pour rester en attente.

Discord et Telegram prennent également en charge `/approve` dans le même chat, mais ces canaux continuent d’utiliser leur liste d’approbateurs résolue pour l’autorisation même lorsque la livraison native des approbations est désactivée.

Pour Telegram et les autres clients d’approbation natifs qui appellent directement la Gateway, ce fallback est volontairement limité aux échecs « approval not found ». Un vrai refus/une vraie erreur d’approbation d’exécution ne réessaie pas silencieusement comme approbation de Plugin.

### Livraison native des approbations

Certains canaux peuvent également agir comme clients d’approbation natifs. Les clients natifs ajoutent les DM d’approbateurs, la diffusion vers le chat d’origine et une UX d’approbation interactive spécifique au canal en plus du flux partagé `/approve` dans le même chat.

Lorsque des cartes/boutons d’approbation natifs sont disponibles, cette UI native constitue le chemin principal côté agent. L’agent ne doit pas également répéter une commande `/approve` en texte brut en double dans le chat, sauf si le résultat de l’outil indique que les approbations par chat ne sont pas disponibles ou que l’approbation manuelle est le seul chemin restant.

Modèle générique :

- la politique d’exécution de l’hôte décide toujours si une approbation d’exécution est requise
- `approvals.exec` contrôle le transfert des invites d’approbation vers d’autres destinations de chat
- `channels.<channel>.execApprovals` contrôle si ce canal agit comme client d’approbation natif

Les clients d’approbation natifs activent automatiquement la livraison DM-first lorsque toutes les conditions suivantes sont remplies :

- le canal prend en charge la livraison d’approbation native
- les approbateurs peuvent être résolus à partir de `execApprovals.approvers` explicite ou des sources de repli documentées de ce canal
- `channels.<channel>.execApprovals.enabled` n’est pas défini ou vaut `"auto"`

Définissez `enabled: false` pour désactiver explicitement un client d’approbation natif. Définissez `enabled: true` pour le forcer lorsqu’il y a résolution des approbateurs. La livraison publique vers le chat d’origine reste explicite via `channels.<channel>.execApprovals.target`.

FAQ : [Pourquoi y a-t-il deux configurations d’approbation d’exécution pour les approbations par chat ?](/help/faq-first-run#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord : `channels.discord.execApprovals.*`
- Slack : `channels.slack.execApprovals.*`
- Telegram : `channels.telegram.execApprovals.*`

Ces clients d’approbation natifs ajoutent le routage DM et une diffusion facultative au canal en plus du flux partagé `/approve` dans le même chat et des boutons d’approbation partagés.

Comportement partagé :

- Slack, Matrix, Microsoft Teams et des chats livrables similaires utilisent le modèle d’authentification normal du canal pour `/approve` dans le même chat
- lorsqu’un client d’approbation natif s’active automatiquement, la cible de livraison native par défaut est les DM des approbateurs
- pour Discord et Telegram, seuls les approbateurs résolus peuvent approuver ou refuser
- les approbateurs Discord peuvent être explicites (`execApprovals.approvers`) ou déduits de `commands.ownerAllowFrom`
- les approbateurs Telegram peuvent être explicites (`execApprovals.approvers`) ou déduits de la configuration de propriétaire existante (`allowFrom`, plus `defaultTo` en message direct lorsque pris en charge)
- les approbateurs Slack peuvent être explicites (`execApprovals.approvers`) ou déduits de `commands.ownerAllowFrom`
- les boutons natifs Slack conservent le type d’identifiant d’approbation, de sorte que les identifiants `plugin:` peuvent résoudre les approbations de Plugin sans seconde couche de repli locale à Slack
- le routage DM/canal natif Matrix et les raccourcis par réaction gèrent à la fois les approbations d’exécution et de Plugin ; l’autorisation de Plugin provient toujours de `channels.matrix.dm.allowFrom`
- le demandeur n’a pas besoin d’être un approbateur
- le chat d’origine peut approuver directement avec `/approve` lorsque ce chat prend déjà en charge les commandes et les réponses
- les boutons d’approbation natifs Discord routent selon le type d’identifiant d’approbation : les identifiants `plugin:` vont directement vers les approbations de Plugin, tout le reste va vers les approbations d’exécution
- les boutons d’approbation natifs Telegram suivent le même repli borné exécution-vers-Plugin que `/approve`
- lorsque `target` natif active la livraison vers le chat d’origine, les invites d’approbation incluent le texte de la commande
- les approbations d’exécution en attente expirent après 30 minutes par défaut
- si aucune UI opérateur ni aucun client d’approbation configuré ne peut accepter la demande, l’invite se replie sur `askFallback`

Telegram utilise par défaut les DM des approbateurs (`target: "dm"`). Vous pouvez passer à `channel` ou `both` lorsque vous souhaitez que les invites d’approbation apparaissent également dans le chat/sujet Telegram d’origine. Pour les sujets de forum Telegram, OpenClaw conserve le sujet pour l’invite d’approbation et le suivi post-approbation.

Voir :

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### Flux IPC macOS
__OC_I18N_900004__
Notes de sécurité :

- Socket Unix en mode `0600`, jeton stocké dans `exec-approvals.json`.
- Vérification de pair Same-UID.
- Challenge/réponse (nonce + jeton HMAC + hash de requête) + TTL court.

## Lié

- [Approbations d’exécution](/fr/tools/exec-approvals) — politique centrale et flux d’approbation
- [Outil exec](/fr/tools/exec)
- [Mode élevé](/fr/tools/elevated)
- [Skills](/fr/tools/skills) — comportement d’auto-autorisation appuyé par les Skills
