---
read_when:
    - Configuration des binaires sûrs ou des profils personnalisés de binaires sûrs
    - Transfert des approbations vers Slack/Discord/Telegram ou d’autres canaux de discussion
    - Implémenter un client d’approbation natif pour un canal
summary: 'Approbations exec avancées : binaires sûrs, liaison d’interpréteur, transfert d’approbation, livraison native'
title: Approbations d’exécution — avancé
x-i18n:
    generated_at: "2026-06-27T18:17:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3d936e1a1567d204981eec7c3262cf11f2af8fc1ed6213182954c2324718a270
    source_path: tools/exec-approvals-advanced.md
    workflow: 16
---

Sujets avancés d’approbation exec : le chemin rapide `safeBins`, la liaison interpréteur/runtime
et le transfert des approbations vers les canaux de chat (y compris la distribution native).
Pour la stratégie principale et le flux d’approbation, consultez [Approbations exec](/fr/tools/exec-approvals).

## Binaires sûrs (stdin uniquement)

`tools.exec.safeBins` définit une courte liste de binaires **stdin uniquement** (par
exemple `cut`) qui peuvent s’exécuter en mode liste d’autorisation **sans** entrées
explicites dans la liste d’autorisation. Les binaires sûrs rejettent les arguments de fichier
positionnels et les jetons qui ressemblent à des chemins ; ils ne peuvent donc opérer que sur le
flux entrant. Considérez cela comme un chemin rapide étroit pour les filtres de flux,
pas comme une liste de confiance générale.

<Warning>
N’ajoutez **pas** de binaires d’interpréteur ou de runtime (par exemple `python3`, `node`,
`ruby`, `bash`, `sh`, `zsh`) à `safeBins`. Si une commande peut évaluer du code,
exécuter des sous-commandes ou lire des fichiers par conception, préférez des entrées explicites
dans la liste d’autorisation et gardez les invites d’approbation activées. Les binaires sûrs
personnalisés doivent définir un profil explicite dans `tools.exec.safeBinProfiles.<bin>`.
</Warning>

Binaires sûrs par défaut :

[//]: # "SAFE_BIN_DEFAULTS:START"

`cut`, `uniq`, `head`, `tail`, `tr`, `wc`

[//]: # "SAFE_BIN_DEFAULTS:END"

`grep` et `sort` ne figurent pas dans la liste par défaut. Si vous les activez, conservez des
entrées explicites dans la liste d’autorisation pour leurs workflows qui ne passent pas par stdin.
Pour `grep` en mode binaire sûr, fournissez le motif avec `-e`/`--regexp` ; la forme de motif
positionnelle est rejetée afin que les opérandes de fichier ne puissent pas être introduits comme
arguments positionnels ambigus.

### Validation argv et indicateurs refusés

La validation est déterministe à partir de la seule forme d’argv (sans vérifications d’existence
sur le système de fichiers hôte), ce qui empêche un comportement d’oracle d’existence de fichier
fondé sur les différences d’autorisation/refus. Les options orientées fichiers sont refusées pour
les binaires sûrs par défaut ; les options longues sont validées en mode fermé en cas d’échec
(les indicateurs inconnus et les abréviations ambiguës sont rejetés).

Indicateurs refusés par profil de binaire sûr :

[//]: # "SAFE_BIN_DENIED_FLAGS:START"

- `grep`: `--dereference-recursive`, `--directories`, `--exclude-from`, `--file`, `--recursive`, `-R`, `-d`, `-f`, `-r`
- `jq`: `--argfile`, `--from-file`, `--library-path`, `--rawfile`, `--slurpfile`, `-L`, `-f`
- `sort`: `--compress-program`, `--files0-from`, `--output`, `--random-source`, `--temporary-directory`, `-T`, `-o`
- `wc`: `--files0-from`

[//]: # "SAFE_BIN_DENIED_FLAGS:END"

Les binaires sûrs forcent également les jetons argv à être traités comme du **texte littéral** au
moment de l’exécution (pas de globbing et pas d’expansion `$VARS`) pour les segments stdin
uniquement, afin que des motifs comme `*` ou `$HOME/...` ne puissent pas servir à introduire des
lectures de fichiers.

### Répertoires de binaires de confiance

Les binaires sûrs doivent être résolus depuis des répertoires de binaires de confiance (valeurs
système par défaut plus `tools.exec.safeBinTrustedDirs` facultatif). Les entrées `PATH` ne sont
jamais considérées automatiquement comme fiables. Les répertoires de confiance par défaut sont
volontairement minimaux : `/bin`, `/usr/bin`. Si votre exécutable de binaire sûr se trouve dans
des chemins de gestionnaire de paquets ou utilisateur (par exemple `/opt/homebrew/bin`,
`/usr/local/bin`, `/opt/local/bin`, `/snap/bin`), ajoutez-les explicitement à
`tools.exec.safeBinTrustedDirs`.

### Chaînage shell, wrappers et multiplexeurs

Le chaînage shell (`&&`, `||`, `;`) est autorisé lorsque chaque segment de niveau supérieur
satisfait la liste d’autorisation (y compris les binaires sûrs ou l’autorisation automatique par
skill). Les redirections restent non prises en charge en mode liste d’autorisation. La substitution
de commande (`$()` / accents graves) est rejetée pendant l’analyse de la liste d’autorisation, y
compris à l’intérieur de guillemets doubles ; utilisez des guillemets simples si vous avez besoin
du texte littéral `$()`.

Sur macOS, pour les approbations d’app compagnon, le texte shell brut contenant une syntaxe de
contrôle ou d’expansion shell (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) est traité
comme une absence de correspondance dans la liste d’autorisation, sauf si le binaire shell lui-même
est autorisé.

Pour les wrappers shell (`bash|sh|zsh ... -c/-lc`), les remplacements d’environnement à portée de
requête sont réduits à une petite liste d’autorisation explicite (`TERM`, `LANG`, `LC_*`,
`COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).

Pour les décisions `allow-always` en mode liste d’autorisation, les wrappers de répartition connus
(`env`, `flock`, `nice`, `nohup`, `stdbuf`, `timeout`) persistent le chemin de l’exécutable interne
au lieu du chemin du wrapper. Les multiplexeurs shell (`busybox`, `toybox`) sont dépaquetés pour
les applets shell (`sh`, `ash`, etc.) de la même manière. Si un wrapper ou un multiplexeur ne peut
pas être dépaqueté en toute sécurité, aucune entrée de liste d’autorisation n’est persistée
automatiquement.

Si vous autorisez des interpréteurs comme `python3` ou `node`, préférez
`tools.exec.strictInlineEval=true` afin que l’évaluation inline nécessite toujours une approbation
explicite. En mode strict, `allow-always` peut toujours persister des invocations bénignes
d’interpréteur/script, mais les vecteurs d’évaluation inline ne sont pas persistés automatiquement.

### Binaires sûrs ou liste d’autorisation

| Sujet            | `tools.exec.safeBins`                                  | Liste d’autorisation (`exec-approvals.json`)                                                  |
| ---------------- | ------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| Objectif             | Autoriser automatiquement des filtres stdin étroits                        | Faire explicitement confiance à des exécutables spécifiques                                              |
| Type de correspondance       | Nom d’exécutable + stratégie argv de binaire sûr                 | Glob de chemin d’exécutable résolu, ou glob de nom de commande nu pour les commandes invoquées via PATH |
| Portée des arguments   | Restreinte par le profil de binaire sûr et les règles de jetons littéraux | Correspondance de chemin par défaut ; `argPattern` facultatif peut restreindre l’argv analysé              |
| Exemples typiques | `head`, `tail`, `tr`, `wc`                             | `jq`, `python3`, `node`, `ffmpeg`, CLI personnalisées                                     |
| Meilleure utilisation         | Transformations de texte à faible risque dans des pipelines                  | Tout outil ayant un comportement plus large ou des effets de bord                                     |

Emplacement de configuration :

- `safeBins` provient de la configuration (`tools.exec.safeBins` ou `agents.list[].tools.exec.safeBins` par agent).
- `safeBinTrustedDirs` provient de la configuration (`tools.exec.safeBinTrustedDirs` ou `agents.list[].tools.exec.safeBinTrustedDirs` par agent).
- `safeBinProfiles` provient de la configuration (`tools.exec.safeBinProfiles` ou `agents.list[].tools.exec.safeBinProfiles` par agent). Les clés de profil par agent remplacent les clés globales.
- Les entrées de liste d’autorisation résident dans le fichier d’approbations local à l’hôte sous `agents.<id>.allowlist` (ou via Control UI / `openclaw approvals allowlist ...`).
- `openclaw security audit` avertit avec `tools.exec.safe_bins_interpreter_unprofiled` lorsque des binaires d’interpréteur/runtime apparaissent dans `safeBins` sans profils explicites.
- `openclaw doctor --fix` peut échafauder les entrées `safeBinProfiles.<bin>` personnalisées manquantes sous la forme `{}` (à examiner et à resserrer ensuite). Les binaires d’interpréteur/runtime ne sont pas échafaudés automatiquement.

Exemple de profil personnalisé :
__OC_I18N_900000__
Si vous ajoutez explicitement `jq` à `safeBins`, OpenClaw rejette toujours le builtin `env` en mode
binaire sûr, afin que `jq -n env` ne puisse pas vider l’environnement du processus hôte sans chemin
explicite dans la liste d’autorisation ni invite d’approbation.

## Commandes d’interpréteur/runtime

Les exécutions d’interpréteur/runtime appuyées par approbation sont volontairement conservatrices :

- Le contexte exact argv/cwd/env est toujours lié.
- Les formes de script shell direct et de fichier runtime direct sont liées au mieux à un instantané de fichier local concret unique.
- Les formes courantes de wrappers de gestionnaire de paquets qui se résolvent encore à un fichier local direct unique (par exemple `pnpm exec`, `pnpm node`, `npm exec`, `npx`) sont dépaquetées avant la liaison.
- Si OpenClaw ne peut pas identifier exactement un fichier local concret unique pour une commande d’interpréteur/runtime (par exemple scripts de paquet, formes eval, chaînes de chargeurs propres à un runtime ou formes multi-fichiers ambiguës), l’exécution appuyée par approbation est refusée au lieu de prétendre à une couverture sémantique qu’elle n’a pas.
- Pour ces workflows, préférez le sandboxing, une frontière d’hôte séparée ou une liste d’autorisation/un workflow complet explicitement fiable où l’opérateur accepte la sémantique plus large du runtime.

Lorsque des approbations sont requises, l’outil exec renvoie immédiatement un identifiant d’approbation. Utilisez cet identifiant pour
corréler les événements système d’exécution approuvée ultérieurs (`Exec finished`, et `Exec running` lorsqu’il est configuré).
Si aucune décision n’arrive avant le délai d’expiration, la requête est traitée comme un délai d’approbation dépassé et
présentée comme un refus terminal de commande hôte. Pour les approbations asynchrones de l’agent principal avec une session d’origine,
OpenClaw reprend également cette session avec un suivi interne afin que l’agent observe que
la commande ne s’est pas exécutée au lieu de réparer plus tard un résultat manquant.

### Comportement de distribution du suivi

Après la fin d’une exécution async approuvée, OpenClaw envoie un tour `agent` de suivi à la même session.
Les approbations async refusées utilisent le même chemin de suivi de session principale pour le statut de refus, mais elles
n’enregistrent pas de transferts de runtime élevés et n’exécutent pas la commande. Les refus sans session principale reprenable
sont soit supprimés, soit signalés par une route directe sûre lorsqu’il en existe une.

- Si une cible de distribution externe valide existe (canal distribuable plus cible `to`), la distribution du suivi utilise ce canal.
- Dans les flux webchat uniquement ou de session interne sans cible externe, la distribution du suivi reste limitée à la session (`deliver: false`).
- Si un appelant demande explicitement une distribution externe stricte sans canal externe résoluble, la requête échoue avec `INVALID_REQUEST`.
- Si `bestEffortDeliver` est activé et qu’aucun canal externe ne peut être résolu, la distribution est rétrogradée en mode session uniquement au lieu d’échouer.

## Transfert des approbations vers les canaux de chat

Vous pouvez transférer les invites d’approbation exec vers n’importe quel canal de chat (y compris les canaux de Plugin) et les approuver
avec `/approve`. Cela utilise le pipeline normal de distribution sortante.

Configuration :
__OC_I18N_900001__
Répondre dans le chat :
__OC_I18N_900002__
La commande `/approve` gère à la fois les approbations exec et les approbations de Plugin. Si l’ID ne correspond pas à une approbation exec en attente, elle vérifie automatiquement les approbations de Plugin à la place.

### Transfert des approbations de Plugin

Le transfert des approbations de Plugin utilise le même pipeline de distribution que les approbations exec, mais dispose de sa propre
configuration indépendante sous `approvals.plugin`. Activer ou désactiver l’un n’affecte pas l’autre.
Pour le comportement d’auteur de Plugin, les champs de requête et la sémantique de décision, consultez
[Demandes d’autorisation de Plugin](/plugins/plugin-permission-requests).
__OC_I18N_900003__
La forme de configuration est identique à `approvals.exec` : `enabled`, `mode`, `agentFilter`,
`sessionFilter` et `targets` fonctionnent de la même façon.

Les canaux qui prennent en charge les réponses interactives partagées affichent les mêmes boutons d’approbation pour les approbations exec et
de Plugin. Les canaux sans UI interactive partagée reviennent à du texte brut avec des instructions `/approve`.
Les demandes d’approbation de Plugin peuvent restreindre les décisions disponibles. Les surfaces d’approbation utilisent l’ensemble de décisions
déclaré par la requête, et le Gateway rejette les tentatives d’envoi d’une décision qui n’a pas été proposée.

### Approbations dans le même chat sur n’importe quel canal

Lorsqu’une demande d’approbation exec ou de Plugin provient d’une surface de chat distribuable, le même chat
peut désormais l’approuver avec `/approve` par défaut. Cela s’applique à des canaux comme Slack, Matrix et
Microsoft Teams en plus des flux Web UI et UI de terminal existants.

Ce chemin de commande textuelle partagé utilise le modèle normal d’authentification du canal pour cette conversation. Si la discussion d’origine peut déjà envoyer des commandes et recevoir des réponses, les demandes d’approbation n’ont plus besoin d’un adaptateur de livraison natif séparé uniquement pour rester en attente.

Discord et Telegram prennent aussi en charge `/approve` dans la même discussion, mais ces canaux utilisent toujours leur liste d’approbateurs résolue pour l’autorisation, même lorsque la livraison native des approbations est désactivée.

Pour Telegram et les autres clients d’approbation natifs qui appellent directement le Gateway, ce repli est volontairement limité aux échecs de type « approbation introuvable ». Un vrai refus ou une vraie erreur d’approbation d’exécution ne relance pas silencieusement la demande comme une approbation de plugin.

### Livraison native des approbations

Certains canaux peuvent aussi agir comme clients d’approbation natifs. Les clients natifs ajoutent les messages directs aux approbateurs, la diffusion vers la discussion d’origine et une UX d’approbation interactive propre au canal par-dessus le flux partagé `/approve` dans la même discussion.

Lorsque des cartes ou boutons d’approbation natifs sont disponibles, cette interface native est le chemin principal côté agent. L’agent ne doit pas aussi répéter une commande `/approve` en texte brut dans la discussion, sauf si le résultat de l’outil indique que les approbations par discussion ne sont pas disponibles ou que l’approbation manuelle est le seul chemin restant.

Si un client d’approbation natif est configuré mais qu’aucun runtime natif n’est actif pour le canal d’origine, OpenClaw garde visible l’invite `/approve` locale et déterministe. Si le runtime natif est actif et tente la livraison, mais qu’aucune cible ne reçoit la carte, OpenClaw envoie un avis de repli dans la même discussion avec la commande exacte `/approve <id> <decision>` afin que la demande puisse tout de même être résolue.

Modèle générique :

- la politique d’exécution de l’hôte décide toujours si une approbation d’exécution est requise
- `approvals.exec` contrôle le transfert des invites d’approbation vers d’autres destinations de discussion
- `channels.<channel>.execApprovals` contrôle si Discord, Slack, Telegram et les clients natifs similaires propres aux canaux sont activés
- les approbations de plugin Slack peuvent utiliser le client d’approbation natif de Slack lorsque la demande vient de Slack et que les approbateurs du plugin Slack sont résolus ; `approvals.plugin` peut aussi router les approbations de plugin vers des sessions ou cibles Slack même lorsque les approbations d’exécution Slack sont désactivées
- les cartes d’approbation natives Google Chat gèrent les approbations d’exécution et de plugin qui proviennent d’espaces ou de fils Google Chat lorsque des approbateurs stables `users/<id>` sont résolus depuis `dm.allowFrom` ou `defaultTo` ; elles n’utilisent pas les événements de réaction pour les décisions
- la livraison des approbations par réaction WhatsApp et Signal est contrôlée par `approvals.exec` et `approvals.plugin` ; elles n’ont pas de blocs `channels.<channel>.execApprovals`

Les clients d’approbation natifs activent automatiquement la livraison vers les messages directs en premier lorsque toutes ces conditions sont vraies :

- le canal prend en charge la livraison native des approbations
- les approbateurs peuvent être résolus depuis `execApprovals.approvers` explicite ou depuis une identité propriétaire comme `commands.ownerAllowFrom`
- `channels.<channel>.execApprovals.enabled` n’est pas défini ou vaut `"auto"`

Définissez `enabled: false` pour désactiver explicitement un client d’approbation natif. Définissez `enabled: true` pour le forcer lorsque les approbateurs sont résolus. La livraison publique vers la discussion d’origine reste explicite via `channels.<channel>.execApprovals.target`.

FAQ : [Pourquoi existe-t-il deux configurations d’approbation d’exécution pour les approbations par discussion ?](/help/faq-first-run#why-are-there-two-exec-approval-configs-for-chat-approvals)

- Discord : `channels.discord.execApprovals.*`
- Slack : `channels.slack.execApprovals.*`
- Telegram : `channels.telegram.execApprovals.*`
- Google Chat : configurez des approbateurs stables avec `channels.googlechat.dm.allowFrom` ou `channels.googlechat.defaultTo` ; aucun bloc `execApprovals` n’est requis
- WhatsApp : utilisez `approvals.exec` et `approvals.plugin` pour router les invites d’approbation vers WhatsApp
- Signal : utilisez `approvals.exec` et `approvals.plugin` pour router les invites d’approbation vers Signal

Ces clients d’approbation natifs ajoutent le routage vers les messages directs et une diffusion facultative au canal par-dessus le flux partagé `/approve` dans la même discussion et les boutons d’approbation partagés.

Comportement partagé :

- Slack, Matrix, Microsoft Teams et les discussions livrables similaires utilisent le modèle normal d’authentification du canal pour `/approve` dans la même discussion
- lorsqu’un client d’approbation natif s’active automatiquement, la cible de livraison native par défaut est les messages directs aux approbateurs
- pour Discord et Telegram, seuls les approbateurs résolus peuvent approuver ou refuser
- les approbateurs Discord peuvent être explicites (`execApprovals.approvers`) ou déduits de `commands.ownerAllowFrom`
- les approbateurs Telegram peuvent être explicites (`execApprovals.approvers`) ou déduits de `commands.ownerAllowFrom`
- les approbateurs Slack peuvent être explicites (`execApprovals.approvers`) ou déduits de `commands.ownerAllowFrom`
- les messages directs d’approbation de plugin Slack utilisent les approbateurs de plugin Slack depuis `allowFrom` et le routage par défaut du compte, pas les approbateurs d’exécution Slack
- les boutons natifs Slack conservent le type d’identifiant d’approbation, de sorte que les identifiants `plugin:` peuvent résoudre les approbations de plugin sans deuxième couche de repli locale à Slack
- les cartes natives Google Chat conservent le repli manuel `/approve` dans le texte du message, mais les rappels des boutons de carte ne transportent que des jetons d’action opaques ; l’identifiant d’approbation et la décision sont récupérés depuis l’état en attente côté serveur
- les approbations par emoji WhatsApp gèrent les invites d’exécution et de plugin uniquement lorsque la famille de transfert de premier niveau correspondante est activée et route vers WhatsApp ; le transfert vers WhatsApp uniquement par cible reste sur le chemin de transfert partagé, sauf s’il correspond à la même cible d’origine native
- les approbations par réaction Signal gèrent les invites d’exécution et de plugin uniquement lorsque la famille de transfert de premier niveau correspondante est activée et route vers Signal. Les approbations d’exécution Signal directes dans la même discussion peuvent supprimer le repli local `/approve` sans approbateurs explicites ; la résolution des réactions Signal nécessite toujours des approbateurs Signal explicites depuis `channels.signal.allowFrom` ou `defaultTo`.
- le routage natif Matrix vers les messages directs/canaux et les raccourcis par réaction gèrent les approbations d’exécution et de plugin ; l’autorisation de plugin vient toujours de `channels.matrix.dm.allowFrom`
- les invites natives Matrix incluent du contenu d’événement personnalisé `com.openclaw.approval` sur le premier événement d’invite afin que les clients Matrix compatibles avec OpenClaw puissent lire l’état d’approbation structuré tandis que les clients standard conservent le repli `/approve` en texte brut
- le demandeur n’a pas besoin d’être un approbateur
- la discussion d’origine peut approuver directement avec `/approve` lorsque cette discussion prend déjà en charge les commandes et les réponses
- les boutons d’approbation natifs Discord routent selon le type d’identifiant d’approbation : les identifiants `plugin:` vont directement aux approbations de plugin, tout le reste va aux approbations d’exécution
- les boutons d’approbation natifs Telegram suivent le même repli borné d’exécution vers plugin que `/approve`
- lorsque `target` natif active la livraison vers la discussion d’origine, les invites d’approbation incluent le texte de la commande
- les approbations d’exécution en attente expirent par défaut après 30 minutes
- si aucune interface opérateur ni aucun client d’approbation configuré ne peut accepter la demande, l’invite se replie sur `askFallback`

Les commandes de groupe sensibles réservées au propriétaire, comme `/diagnostics` et `/export-trajectory`, utilisent un routage privé propriétaire pour les invites d’approbation et les résultats finaux. OpenClaw tente d’abord une route privée sur la même surface où le propriétaire a exécuté la commande. Si cette surface n’a pas de route privée propriétaire, il se replie sur la première route propriétaire disponible depuis `commands.ownerAllowFrom`, de sorte qu’une commande de groupe Discord peut tout de même envoyer l’approbation et le résultat au message direct Telegram du propriétaire lorsque Telegram est l’interface privée principale configurée. La discussion de groupe ne reçoit qu’un court accusé de réception.

Telegram utilise par défaut les messages directs aux approbateurs (`target: "dm"`). Vous pouvez passer à `channel` ou `both` lorsque vous voulez que les invites d’approbation apparaissent aussi dans la discussion ou le sujet Telegram d’origine. Pour les sujets de forum Telegram, OpenClaw préserve le sujet pour l’invite d’approbation et le suivi après approbation.

Voir :

- [Discord](/channels/discord)
- [Telegram](/channels/telegram)

### Flux IPC macOS
__OC_I18N_900004__
Notes de sécurité :

- Mode du socket Unix `0600`, jeton stocké dans `exec-approvals.json`.
- Vérification du pair avec le même UID.
- Défi/réponse (nonce + jeton HMAC + hachage de requête) + TTL court.

## FAQ

### Quand `accountId` et `threadId` seraient-ils utilisés sur une cible d’approbation ?

Utilisez `accountId` lorsque le canal a plusieurs identités configurées et que l’invite d’approbation doit sortir par un compte spécifique. Utilisez `threadId` lorsque la destination prend en charge les sujets ou les fils et que l’invite doit rester dans ce fil plutôt que dans la discussion de premier niveau.

Un cas Telegram concret est un supergroupe d’exploitation avec des sujets de forum et deux comptes de bot Telegram. La valeur `to` nomme le supergroupe, `accountId` sélectionne le compte de bot et `threadId` sélectionne le sujet de forum :
__OC_I18N_900005__
Avec cette configuration, les approbations d’exécution transférées sont publiées par le compte Telegram `ops-bot` dans le sujet `77` de la discussion `-1001234567890`. Une cible sans `accountId` utilise le compte par défaut du canal, et une cible sans `threadId` publie vers la destination de premier niveau.

### Lorsque les approbations sont envoyées à une session, n’importe qui dans cette session peut-il les approuver ?

Non. La livraison à une session contrôle uniquement où l’invite apparaît. Elle n’autorise pas à elle seule chaque participant de cette discussion à approuver.

Pour `/approve` générique dans la même discussion, l’expéditeur doit déjà être autorisé à utiliser les commandes dans cette session de canal. Si le canal expose des approbateurs d’approbation explicites, ces approbateurs peuvent autoriser l’action `/approve` même s’ils ne sont pas autrement autorisés à utiliser les commandes dans cette session.

Certains canaux sont plus stricts. Discord, Telegram, Matrix, les messages directs d’approbation natifs Slack et les clients d’approbation natifs similaires utilisent leurs listes d’approbateurs résolues pour l’autorisation d’approbation. Par exemple, une invite d’approbation dans un sujet de forum Telegram peut être visible par tout le monde dans le sujet, mais seuls les identifiants utilisateur numériques Telegram résolus depuis `channels.telegram.execApprovals.approvers` ou `commands.ownerAllowFrom` peuvent l’approuver ou la refuser.

## Connexe

- [Approbations d’exécution](/fr/tools/exec-approvals) — politique principale et flux d’approbation
- [Outil d’exécution](/fr/tools/exec)
- [Mode élevé](/fr/tools/elevated)
- [Skills](/fr/tools/skills) — comportement d’autorisation automatique basé sur les Skills
