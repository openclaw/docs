---
read_when:
    - Configurer des bacs sûrs ou des profils de bacs sûrs personnalisés
    - Transfert des approbations vers Slack/Discord/Telegram ou d’autres canaux de discussion
    - Implémenter un client d’approbation natif pour un canal
summary: 'Approbations d’exécution avancées : binaires sûrs, liaison de l’interpréteur, transfert des approbations, livraison native'
title: Approbations d’exécution — avancées
x-i18n:
    generated_at: "2026-05-07T01:54:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: d876efbfa34ef951b47cbfec9cc6a6a69a69f5b84365165d423d251163373040
    source_path: tools/exec-approvals-advanced.md
    workflow: 16
---

Sujets avancés d’approbation d’exécution : le chemin rapide `safeBins`, la liaison interpréteur/runtime et le transfert des approbations vers les canaux de chat (y compris la livraison native). Pour la politique principale et le flux d’approbation, consultez [Approbations d’exécution](/fr/tools/exec-approvals).

## Binaires sûrs (stdin uniquement)

`tools.exec.safeBins` définit une petite liste de binaires **stdin uniquement** (par exemple `cut`) qui peuvent s’exécuter en mode liste d’autorisation **sans** entrées explicites dans la liste d’autorisation. Les binaires sûrs rejettent les arguments positionnels de fichiers et les jetons ressemblant à des chemins, afin qu’ils ne puissent agir que sur le flux entrant. Considérez cela comme un chemin rapide étroit pour les filtres de flux, et non comme une liste de confiance générale.

<Warning>
N’ajoutez **pas** de binaires d’interpréteur ou de runtime (par exemple `python3`, `node`, `ruby`, `bash`, `sh`, `zsh`) à `safeBins`. Si une commande peut évaluer du code, exécuter des sous-commandes ou lire des fichiers par conception, préférez des entrées explicites dans la liste d’autorisation et gardez les invites d’approbation activées. Les binaires sûrs personnalisés doivent définir un profil explicite dans `tools.exec.safeBinProfiles.<bin>`.
</Warning>

Binaires sûrs par défaut :

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` et `sort` ne figurent pas dans la liste par défaut. Si vous les activez, conservez des entrées explicites dans la liste d’autorisation pour leurs flux de travail non stdin. Pour `grep` en mode binaire sûr, fournissez le motif avec `-e`/`--regexp` ; la forme de motif positionnel est rejetée afin que les opérandes de fichier ne puissent pas être introduits comme positionnels ambigus.

### Validation d’argv et indicateurs refusés

La validation est déterministe à partir de la seule forme d’argv (sans vérification d’existence dans le système de fichiers de l’hôte), ce qui empêche les comportements d’oracle d’existence de fichiers dus aux différences entre autorisation et refus. Les options orientées fichiers sont refusées pour les binaires sûrs par défaut ; les options longues sont validées en échec fermé (les indicateurs inconnus et les abréviations ambiguës sont rejetés).

Indicateurs refusés par profil de binaire sûr :

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

Les binaires sûrs forcent aussi les jetons argv à être traités comme du **texte littéral** au moment de l’exécution (pas de globbing et pas d’expansion de `$VARS`) pour les segments stdin uniquement, de sorte que des motifs comme `*` ou `$HOME/...` ne peuvent pas être utilisés pour introduire des lectures de fichiers.

### Répertoires de binaires de confiance

Les binaires sûrs doivent être résolus depuis des répertoires de binaires de confiance (valeurs système par défaut plus `tools.exec.safeBinTrustedDirs` facultatif). Les entrées `PATH` ne sont jamais automatiquement considérées comme fiables. Les répertoires de confiance par défaut sont volontairement minimaux : `/bin`, `/usr/bin`. Si votre exécutable de binaire sûr se trouve dans des chemins de gestionnaire de paquets ou d’utilisateur (par exemple `/opt/homebrew/bin`, `/usr/local/bin`, `/opt/local/bin`, `/snap/bin`), ajoutez-les explicitement à `tools.exec.safeBinTrustedDirs`.

### Chaînage shell, wrappers et multiplexeurs

Le chaînage shell (`&&`, `||`, `;`) est autorisé lorsque chaque segment de premier niveau satisfait la liste d’autorisation (y compris les binaires sûrs ou l’auto-autorisation de Skills). Les redirections restent non prises en charge en mode liste d’autorisation. La substitution de commande (`$()` / accents graves) est rejetée pendant l’analyse de la liste d’autorisation, y compris à l’intérieur de guillemets doubles ; utilisez des guillemets simples si vous avez besoin du texte littéral `$()`.

Dans les approbations de l’application compagnon macOS, le texte shell brut contenant une syntaxe de contrôle ou d’expansion shell (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) est traité comme une absence dans la liste d’autorisation, sauf si le binaire shell lui-même figure dans la liste d’autorisation.

Pour les wrappers shell (`bash|sh|zsh ... -c/-lc`), les remplacements d’env propres à la requête sont réduits à une petite liste d’autorisation explicite (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).

Pour les décisions `allow-always` en mode liste d’autorisation, les wrappers de dispatch connus (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) persistent le chemin de l’exécutable interne au lieu du chemin du wrapper. Les multiplexeurs shell (`busybox`, `toybox`) sont dépaquetés pour les applets shell (`sh`, `ash`, etc.) de la même façon. Si un wrapper ou un multiplexeur ne peut pas être dépaqueté de manière sûre, aucune entrée de liste d’autorisation n’est persistée automatiquement.

Si vous ajoutez des interpréteurs comme `python3` ou `node` à la liste d’autorisation, préférez `tools.exec.strictInlineEval=true` afin que l’évaluation inline nécessite encore une approbation explicite. En mode strict, `allow-always` peut toujours persister des invocations bénignes d’interpréteur/script, mais les vecteurs d’évaluation inline ne sont pas persistés automatiquement.

### Binaires sûrs contre liste d’autorisation

| Sujet            | `tools.exec.safeBins`                                  | Liste d’autorisation (`exec-approvals.json`)                                                  |
| ---------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| Objectif             | Autoriser automatiquement des filtres stdin étroits                        | Faire explicitement confiance à des exécutables précis                                              |
| Type de correspondance       | Nom d’exécutable + politique argv de binaire sûr                 | Glob de chemin d’exécutable résolu, ou glob de nom de commande nu pour les commandes invoquées via PATH |
| Portée des arguments   | Restreinte par le profil de binaire sûr et les règles de jetons littéraux | Correspondance de chemin par défaut ; `argPattern` facultatif peut restreindre l’argv analysé              |
| Exemples typiques | `head`, `tail`, `tr`, `wc`                             | `jq`, `python3`, `node`, `ffmpeg`, CLI personnalisées                                     |
| Meilleur usage         | Transformations de texte à faible risque dans les pipelines                  | Tout outil avec un comportement plus large ou des effets de bord                                     |

Emplacement de la configuration :

- `safeBins` provient de la configuration (`tools.exec.safeBins` ou `agents.list[].tools.exec.safeBins` propre à l’agent).
- `safeBinTrustedDirs` provient de la configuration (`tools.exec.safeBinTrustedDirs` ou `agents.list[].tools.exec.safeBinTrustedDirs` propre à l’agent).
- `safeBinProfiles` provient de la configuration (`tools.exec.safeBinProfiles` ou `agents.list[].tools.exec.safeBinProfiles` propre à l’agent). Les clés de profil propres à l’agent remplacent les clés globales.
- Les entrées de liste d’autorisation résident dans le fichier local à l’hôte `~/.openclaw/exec-approvals.json` sous `agents.<id>.allowlist` (ou via l’interface Control UI / `openclaw approvals allowlist ...`).
- `openclaw security audit` avertit avec `tools.exec.safe_bins_interpreter_unprofiled` lorsque des binaires d’interpréteur/runtime apparaissent dans `safeBins` sans profils explicites.
- `openclaw doctor --fix` peut échafauder les entrées personnalisées `safeBinProfiles.<bin>` manquantes sous forme de `{}` (à relire et resserrer ensuite). Les binaires d’interpréteur/runtime ne sont pas échafaudés automatiquement.

Exemple de profil personnalisé :
__OC_I18N_900000__
Si vous activez explicitement `jq` dans `safeBins`, OpenClaw rejette toujours le builtin `env` en mode binaire sûr afin que `jq -n env` ne puisse pas vider l’environnement du processus hôte sans chemin explicite de liste d’autorisation ni invite d’approbation.

## Commandes d’interpréteur/runtime

Les exécutions d’interpréteur/runtime appuyées par approbation sont volontairement conservatrices :

- Le contexte exact argv/cwd/env est toujours lié.
- Les formes de script shell direct et de fichier runtime direct sont liées au mieux à un instantané d’un fichier local concret.
- Les formes courantes de wrapper de gestionnaire de paquets qui se résolvent encore à un fichier local direct unique (par exemple `pnpm exec`, `pnpm node`, `npm exec`, `npx`) sont dépaquetées avant la liaison.
- Si OpenClaw ne peut pas identifier exactement un fichier local concret pour une commande d’interpréteur/runtime (par exemple scripts de paquets, formes eval, chaînes de loaders propres au runtime ou formes ambiguës multi-fichiers), l’exécution appuyée par approbation est refusée au lieu de prétendre à une couverture sémantique qu’elle n’a pas.
- Pour ces flux de travail, préférez le sandboxing, une frontière hôte séparée ou une liste d’autorisation/un flux de travail complet explicitement fiable où l’opérateur accepte la sémantique runtime plus large.

Lorsque des approbations sont requises, l’outil d’exécution retourne immédiatement un identifiant d’approbation. Utilisez cet identifiant pour corréler les événements système ultérieurs (`Exec finished` / `Exec denied`). Si aucune décision n’arrive avant le délai d’expiration, la requête est traitée comme une expiration d’approbation et exposée comme motif de refus.

### Comportement de livraison de suivi

Après la fin d’une exécution asynchrone approuvée, OpenClaw envoie un tour `agent` de suivi à la même session.

- Si une cible de livraison externe valide existe (canal livrable plus cible `to`), la livraison de suivi utilise ce canal.
- Dans les flux webchat uniquement ou de session interne sans cible externe, la livraison de suivi reste limitée à la session (`deliver: false`).
- Si un appelant demande explicitement une livraison externe stricte sans canal externe résoluble, la requête échoue avec `INVALID_REQUEST`.
- Si `bestEffortDeliver` est activé et qu’aucun canal externe ne peut être résolu, la livraison est rétrogradée en session uniquement au lieu d’échouer.

## Transfert des approbations vers les canaux de chat

Vous pouvez transférer les invites d’approbation d’exécution vers n’importe quel canal de chat (y compris les canaux de Plugin) et les approuver avec `/approve`. Cela utilise le pipeline normal de livraison sortante.

Configuration :
__OC_I18N_900001__
Répondre dans le chat :
__OC_I18N_900002__
La commande `/approve` gère à la fois les approbations d’exécution et les approbations de Plugin. Si l’ID ne correspond à aucune approbation d’exécution en attente, elle vérifie automatiquement les approbations de Plugin à la place.

### Transfert des approbations de Plugin

Le transfert des approbations de Plugin utilise le même pipeline de livraison que les approbations d’exécution, mais possède sa propre configuration indépendante sous `approvals.plugin`. Activer ou désactiver l’un n’affecte pas l’autre.
__OC_I18N_900003__
La forme de configuration est identique à `approvals.exec` : `enabled`, `mode`, `agentFilter`, `sessionFilter` et `targets` fonctionnent de la même manière.

Les canaux qui prennent en charge les réponses interactives partagées affichent les mêmes boutons d’approbation pour les approbations d’exécution et de Plugin. Les canaux sans interface interactive partagée basculent vers du texte brut avec des instructions `/approve`.
Les demandes d’approbation de Plugin peuvent restreindre les décisions disponibles. Les surfaces d’approbation utilisent l’ensemble de décisions déclaré par la requête, et le Gateway rejette les tentatives de soumission d’une décision qui n’était pas proposée.

### Approbations dans le même chat sur n’importe quel canal

Lorsqu’une demande d’approbation d’exécution ou de Plugin provient d’une surface de chat livrable, le même chat peut désormais l’approuver avec `/approve` par défaut. Cela s’applique à des canaux comme Slack, Matrix et Microsoft Teams en plus des flux existants de l’interface Web UI et de l’interface terminal.

Ce chemin partagé de commande texte utilise le modèle normal d’authentification du canal pour cette conversation. Si le chat d’origine peut déjà envoyer des commandes et recevoir des réponses, les demandes d’approbation n’ont plus besoin d’un adaptateur de livraison native séparé simplement pour rester en attente.

Discord et Telegram prennent également en charge `/approve` dans le même chat, mais ces canaux utilisent toujours leur liste d’approbateurs résolue pour l’autorisation, même lorsque la livraison native des approbations est désactivée.

Pour Telegram et les autres clients d’approbation native qui appellent directement le Gateway, ce repli est volontairement limité aux échecs « approbation introuvable ». Un véritable refus ou une véritable erreur d’approbation d’exécution ne réessaie pas silencieusement comme une approbation de Plugin.

### Livraison native des approbations

Certains canaux peuvent aussi agir comme clients d’approbation natifs. Les clients natifs ajoutent les DM d’approbateur, la diffusion vers le chat d’origine et une UX d’approbation interactive propre au canal par-dessus le flux partagé `/approve` dans le même chat.

Quand des cartes/boutons d’approbation natifs sont disponibles, cette UI native est le chemin principal côté agent. L’agent ne doit pas aussi répéter une commande de chat en clair `/approve`, sauf si le résultat de l’outil indique que les approbations par chat sont indisponibles ou que l’approbation manuelle est le seul chemin restant.

Si un client d’approbation natif est configuré mais qu’aucun runtime natif n’est actif pour le canal d’origine, OpenClaw garde visible l’invite locale déterministe `/approve`. Si le runtime natif est actif et tente la livraison, mais qu’aucune cible ne reçoit la carte, OpenClaw envoie un avis de repli dans le même chat avec la commande exacte `/approve <id> <decision>` afin que la demande puisse quand même être résolue.

Modèle générique :

- la politique d’exécution de l’hôte décide toujours si une approbation exec est requise
- `approvals.exec` contrôle le transfert des invites d’approbation vers d’autres destinations de chat
- `channels.<channel>.execApprovals` contrôle si ce canal agit comme client d’approbation natif

Les clients d’approbation natifs activent automatiquement la livraison aux DM en priorité quand toutes ces conditions sont vraies :

- le canal prend en charge la livraison d’approbations natives
- les approbateurs peuvent être résolus depuis `execApprovals.approvers` explicite ou depuis une identité de propriétaire telle que `commands.ownerAllowFrom`
- `channels.<channel>.execApprovals.enabled` n’est pas défini ou vaut `"auto"`

Définissez `enabled: false` pour désactiver explicitement un client d’approbation natif. Définissez `enabled: true` pour le forcer quand les approbateurs se résolvent. La livraison publique vers le chat d’origine reste explicite via `channels.<channel>.execApprovals.target`.

FAQ : [Pourquoi y a-t-il deux configurations d’approbation exec pour les approbations par chat ?](/help/faq-first-run#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord : `channels.discord.execApprovals.*`
- Slack : `channels.slack.execApprovals.*`
- Telegram : `channels.telegram.execApprovals.*`

Ces clients d’approbation natifs ajoutent le routage des DM et la diffusion optionnelle vers le canal par-dessus le flux partagé `/approve` dans le même chat et les boutons d’approbation partagés.

Comportement partagé :

- Slack, Matrix, Microsoft Teams et les chats livrables similaires utilisent le modèle d’authentification de canal normal pour `/approve` dans le même chat
- quand un client d’approbation natif s’active automatiquement, la cible de livraison native par défaut est les DM des approbateurs
- pour Discord et Telegram, seuls les approbateurs résolus peuvent approuver ou refuser
- les approbateurs Discord peuvent être explicites (`execApprovals.approvers`) ou déduits de `commands.ownerAllowFrom`
- les approbateurs Telegram peuvent être explicites (`execApprovals.approvers`) ou déduits de `commands.ownerAllowFrom`
- les approbateurs Slack peuvent être explicites (`execApprovals.approvers`) ou déduits de `commands.ownerAllowFrom`
- les boutons natifs Slack préservent le type d’identifiant d’approbation, donc les identifiants `plugin:` peuvent résoudre les approbations Plugin sans seconde couche de repli locale à Slack
- le routage natif DM/canal de Matrix et les raccourcis par réaction gèrent les approbations exec et Plugin ; l’autorisation Plugin vient toujours de `channels.matrix.dm.allowFrom`
- les invites natives Matrix incluent le contenu d’événement personnalisé `com.openclaw.approval` sur le premier événement d’invite, afin que les clients Matrix compatibles OpenClaw puissent lire l’état d’approbation structuré pendant que les clients standard conservent le repli en texte brut `/approve`
- le demandeur n’a pas besoin d’être un approbateur
- le chat d’origine peut approuver directement avec `/approve` quand ce chat prend déjà en charge les commandes et les réponses
- les boutons d’approbation natifs Discord routent selon le type d’identifiant d’approbation : les identifiants `plugin:` vont directement aux approbations Plugin, tout le reste va aux approbations exec
- les boutons d’approbation natifs Telegram suivent le même repli borné d’exec vers Plugin que `/approve`
- quand la `target` native active la livraison vers le chat d’origine, les invites d’approbation incluent le texte de la commande
- les approbations exec en attente expirent après 30 minutes par défaut
- si aucune UI opérateur ni aucun client d’approbation configuré ne peut accepter la demande, l’invite se replie sur `askFallback`

Les commandes de groupe sensibles réservées au propriétaire, comme `/diagnostics` et `/export-trajectory`, utilisent le routage privé du propriétaire pour les invites d’approbation et les résultats finaux. OpenClaw essaie d’abord une route privée sur la même surface où le propriétaire a exécuté la commande. Si cette surface n’a pas de route privée de propriétaire, il se replie sur la première route de propriétaire disponible depuis `commands.ownerAllowFrom`, afin qu’une commande de groupe Discord puisse quand même envoyer l’approbation et le résultat au DM Telegram du propriétaire quand Telegram est l’interface privée principale configurée. Le chat de groupe ne reçoit qu’un court accusé de réception.

Telegram utilise par défaut les DM des approbateurs (`target: "dm"`). Vous pouvez passer à `channel` ou `both` quand vous voulez que les invites d’approbation apparaissent aussi dans le chat/sujet Telegram d’origine. Pour les sujets de forum Telegram, OpenClaw préserve le sujet pour l’invite d’approbation et le suivi post-approbation.

Voir :

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### Flux IPC macOS
__OC_I18N_900004__
Notes de sécurité :

- Mode du socket Unix `0600`, jeton stocké dans `exec-approvals.json`.
- Vérification du pair de même UID.
- Défi/réponse (nonce + jeton HMAC + hachage de requête) + TTL court.

## Connexe

- [Approbations exec](/fr/tools/exec-approvals) — politique centrale et flux d’approbation
- [Outil exec](/fr/tools/exec)
- [Mode élevé](/fr/tools/elevated)
- [Skills](/fr/tools/skills) — comportement d’autorisation automatique adossé aux Skills
