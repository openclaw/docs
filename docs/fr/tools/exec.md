---
read_when:
    - Utiliser ou modifier l’outil exec
    - Débogage du comportement de stdin ou du TTY
summary: Utilisation de l’outil Exec, modes stdin et prise en charge des TTY
title: Outil d’exécution
x-i18n:
    generated_at: "2026-05-11T20:58:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 43ed3dc70d1998f2f2a3eed70aaf20da61ba93d23b7fa7d378f22e8635c6ec68
    source_path: tools/exec.md
    workflow: 16
---

Exécutez des commandes shell dans l’espace de travail. `exec` est une surface shell mutatrice : les commandes peuvent créer, modifier ou supprimer des fichiers partout où l’hôte sélectionné ou le système de fichiers du bac à sable le permet. Désactiver les outils de système de fichiers OpenClaw tels que `write`, `edit` ou `apply_patch` ne rend pas `exec` accessible en lecture seule.

Prend en charge l’exécution au premier plan et en arrière-plan via `process`. Si `process` est interdit, `exec` s’exécute de manière synchrone et ignore `yieldMs`/`background`.
Les sessions en arrière-plan sont limitées à chaque agent ; `process` ne voit que les sessions du même agent.

## Paramètres

<ParamField path="command" type="string" required>
Commande shell à exécuter.
</ParamField>

<ParamField path="workdir" type="string" default="cwd">
Répertoire de travail de la commande.
</ParamField>

<ParamField path="env" type="object">
Remplacements d’environnement clé/valeur fusionnés au-dessus de l’environnement hérité.
</ParamField>

<ParamField path="yieldMs" type="number" default="10000">
Place automatiquement la commande en arrière-plan après ce délai (ms).
</ParamField>

<ParamField path="background" type="boolean" default="false">
Place la commande immédiatement en arrière-plan au lieu d’attendre `yieldMs`.
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSec">
Remplace le délai d’expiration configuré pour exec pour cet appel. Définissez `timeout: 0` uniquement lorsque la commande doit s’exécuter sans délai d’expiration du processus exec.
</ParamField>

<ParamField path="pty" type="boolean" default="false">
Exécute dans un pseudo-terminal lorsqu’il est disponible. À utiliser pour les CLI nécessitant un TTY, les agents de codage et les interfaces utilisateur terminal.
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
Où exécuter. `auto` se résout en `sandbox` lorsqu’un environnement d’exécution de bac à sable est actif, et en `gateway` sinon.
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
Ignoré pour les appels d’outil normaux. La sécurité de `gateway` / `node` est contrôlée par
`tools.exec.security` et `~/.openclaw/exec-approvals.json` ; le mode élevé peut
forcer `security=full` uniquement lorsque l’opérateur accorde explicitement un accès élevé.
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
Comportement de l’invite d’approbation pour l’exécution `gateway` / `node`.
</ParamField>

<ParamField path="node" type="string">
Identifiant/nom du Node lorsque `host=node`.
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
Demande le mode élevé — sortir du bac à sable vers le chemin d’hôte configuré. `security=full` est forcé uniquement lorsque le mode élevé se résout en `full`.
</ParamField>

Notes :

- `host` vaut par défaut `auto` : bac à sable lorsque l’environnement d’exécution de bac à sable est actif pour la session, sinon Gateway.
- `host` n’accepte que `auto`, `sandbox`, `gateway` ou `node`. Ce n’est pas un sélecteur de nom d’hôte ; les valeurs ressemblant à des noms d’hôte sont rejetées avant l’exécution de la commande.
- `auto` est la stratégie de routage par défaut, pas un caractère générique. `host=node` par appel est autorisé depuis `auto` ; `host=gateway` par appel n’est autorisé que lorsqu’aucun environnement d’exécution de bac à sable n’est actif.
- Sans configuration supplémentaire, `host=auto` continue de « fonctionner simplement » : sans bac à sable, il se résout en `gateway` ; avec un bac à sable actif, il reste dans le bac à sable.
- `elevated` sort du bac à sable vers le chemin d’hôte configuré : `gateway` par défaut, ou `node` lorsque `tools.exec.host=node` (ou lorsque la valeur par défaut de la session est `host=node`). Il n’est disponible que lorsque l’accès élevé est activé pour la session/le fournisseur actuel.
- Les approbations `gateway`/`node` sont contrôlées par `~/.openclaw/exec-approvals.json`.
- `node` nécessite un node appairé (application compagnon ou hôte node sans interface).
- Si plusieurs nodes sont disponibles, définissez `exec.node` ou `tools.exec.node` pour en sélectionner un.
- `exec host=node` est le seul chemin d’exécution shell pour les nodes ; l’ancien wrapper `nodes.run` a été supprimé.
- `timeout` s’applique à l’exécution au premier plan, en arrière-plan, avec `yieldMs`, Gateway, bac à sable et node `system.run`. S’il est omis, OpenClaw utilise `tools.exec.timeoutSec` ; `timeout: 0` explicite désactive le délai d’expiration du processus exec pour cet appel.
- Sur les hôtes non Windows, exec utilise `SHELL` lorsqu’il est défini ; si `SHELL` est `fish`, il préfère `bash` (ou `sh`)
  depuis `PATH` afin d’éviter les scripts incompatibles avec fish, puis se rabat sur `SHELL` si aucun des deux n’existe.
- Sur les hôtes Windows, exec privilégie la découverte de PowerShell 7 (`pwsh`) (Program Files, ProgramW6432, puis PATH),
  puis se rabat sur Windows PowerShell 5.1.
- L’exécution sur l’hôte (`gateway`/`node`) rejette `env.PATH` et les remplacements de chargeur (`LD_*`/`DYLD_*`) afin
  d’empêcher le détournement de binaires ou l’injection de code.
- OpenClaw définit `OPENCLAW_SHELL=exec` dans l’environnement de la commande lancée (y compris l’exécution PTY et bac à sable) afin que les règles de shell/profil puissent détecter le contexte de l’outil exec.
- `openclaw channels login` est bloqué depuis `exec` car il s’agit d’un flux interactif d’authentification de canal ; exécutez-le dans un terminal sur l’hôte Gateway, ou utilisez l’outil de connexion natif au canal depuis le chat lorsqu’il existe.
- Important : le bac à sable est **désactivé par défaut**. Si le bac à sable est désactivé, `host=auto` implicite
  se résout en `gateway`. `host=sandbox` explicite échoue toujours en mode fermé au lieu de s’exécuter silencieusement
  sur l’hôte Gateway. Activez le bac à sable ou utilisez `host=gateway` avec des approbations.
- Les vérifications préalables des scripts (pour les erreurs courantes de syntaxe shell Python/Node) n’inspectent que les fichiers à l’intérieur de la
  limite effective de `workdir`. Si un chemin de script se résout en dehors de `workdir`, la vérification préalable est ignorée pour
  ce fichier.
- Pour un travail de longue durée qui démarre maintenant, lancez-le une fois et appuyez-vous sur le réveil automatique
  à la fin lorsqu’il est activé et que la commande émet une sortie ou échoue.
  Utilisez `process` pour les journaux, l’état, les entrées ou les interventions ; n’émulez pas
  la planification avec des boucles de sommeil, des boucles de délai d’expiration ou des interrogations répétées.
- Pour un travail qui doit se produire plus tard ou selon une planification, utilisez Cron au lieu des
  modèles de sommeil/délai avec `exec`.

## Configuration

- `tools.exec.notifyOnExit` (par défaut : true) : lorsque true, les sessions exec placées en arrière-plan mettent en file d’attente un événement système et demandent un Heartbeat à la sortie.
- `tools.exec.approvalRunningNoticeMs` (par défaut : 10000) : émet un seul avis « en cours d’exécution » lorsqu’un exec soumis à approbation s’exécute plus longtemps que cette durée (0 désactive).
- `tools.exec.timeoutSec` (par défaut : 1800) : délai d’expiration exec par commande par défaut en secondes. `timeout` par appel le remplace ; `timeout: 0` par appel désactive le délai d’expiration du processus exec.
- `tools.exec.host` (par défaut : `auto` ; se résout en `sandbox` lorsque l’environnement d’exécution de bac à sable est actif, sinon en `gateway`)
- `tools.exec.security` (par défaut : `deny` pour le bac à sable, `full` pour Gateway + node lorsque non défini)
- `tools.exec.ask` (par défaut : `off`)
- L’exécution exec sur hôte sans approbation est la valeur par défaut pour Gateway + node. Si vous voulez un comportement d’approbations/de liste d’autorisation, durcissez à la fois `tools.exec.*` et le fichier d’hôte `~/.openclaw/exec-approvals.json` ; consultez [Approbations exec](/fr/tools/exec-approvals#yolo-mode-no-approval).
- YOLO vient des valeurs par défaut de la politique d’hôte (`security=full`, `ask=off`), pas de `host=auto`. Si vous voulez forcer le routage vers Gateway ou node, définissez `tools.exec.host` ou utilisez `/exec host=...`.
- En mode `security=full` avec `ask=off`, exec sur hôte suit directement la politique configurée ; il n’y a aucune couche supplémentaire de préfiltrage heuristique d’obfuscation des commandes ni de rejet par vérification préalable des scripts.
- `tools.exec.node` (par défaut : non défini)
- `tools.exec.strictInlineEval` (par défaut : false) : lorsque true, les formes d’évaluation inline d’interpréteur telles que `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e` et `osascript -e` nécessitent toujours une approbation explicite. `allow-always` peut toujours persister des invocations bénignes d’interpréteur/script, mais les formes d’évaluation inline affichent toujours une invite à chaque fois.
- `tools.exec.commandHighlighting` (par défaut : false) : lorsque true, les invites d’approbation peuvent surligner dans le texte de commande les segments de commande dérivés de l’analyseur. Définissez sur `true` globalement ou par agent pour activer le surlignage du texte de commande sans modifier la politique d’approbation exec.
- `tools.exec.pathPrepend` : liste de répertoires à préfixer à `PATH` pour les exécutions exec (Gateway + bac à sable uniquement).
- `tools.exec.safeBins` : binaires sûrs, uniquement via stdin, qui peuvent s’exécuter sans entrées explicites de liste d’autorisation. Pour les détails de comportement, consultez [Binaires sûrs](/fr/tools/exec-approvals-advanced#safe-bins-stdin-only).
- `tools.exec.safeBinTrustedDirs` : répertoires explicites supplémentaires approuvés pour les vérifications de chemin `safeBins`. Les entrées `PATH` ne sont jamais automatiquement approuvées. Les valeurs par défaut intégrées sont `/bin` et `/usr/bin`.
- `tools.exec.safeBinProfiles` : politique argv personnalisée facultative par binaire sûr (`minPositional`, `maxPositional`, `allowedValueFlags`, `deniedFlags`).

Exemple :

```json5
{
  tools: {
    exec: {
      pathPrepend: ["~/bin", "/opt/oss/bin"],
    },
  },
}
```

### Gestion de PATH

- `host=gateway` : fusionne le `PATH` de votre shell de connexion dans l’environnement exec. Les remplacements `env.PATH` sont
  rejetés pour l’exécution sur hôte. Le daemon lui-même s’exécute toujours avec un `PATH` minimal :
  - macOS : `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux : `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox` : exécute `sh -lc` (shell de connexion) dans le conteneur, de sorte que `/etc/profile` peut réinitialiser `PATH`.
  OpenClaw préfixe `env.PATH` après le chargement du profil via une variable d’environnement interne (sans interpolation shell) ;
  `tools.exec.pathPrepend` s’applique ici aussi.
- `host=node` : seuls les remplacements d’environnement non bloqués que vous transmettez sont envoyés au node. Les remplacements `env.PATH` sont
  rejetés pour l’exécution sur hôte et ignorés par les hôtes node. Si vous avez besoin d’entrées PATH supplémentaires sur un node,
  configurez l’environnement du service hôte node (systemd/launchd) ou installez les outils dans des emplacements standard.

Liaison de node par agent (utilisez l’index de liste d’agents dans la configuration) :

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Interface de contrôle : l’onglet Nodes comprend un petit panneau « Liaison de node exec » pour les mêmes paramètres.

## Remplacements de session (`/exec`)

Utilisez `/exec` pour définir les valeurs par défaut **par session** de `host`, `security`, `ask` et `node`.
Envoyez `/exec` sans arguments pour afficher les valeurs actuelles.

Exemple :

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## Modèle d’autorisation

`/exec` n’est honoré que pour les **expéditeurs autorisés** (listes d’autorisation/appairage de canal plus `commands.useAccessGroups`).
Il met à jour **uniquement l’état de session** et n’écrit pas la configuration. Pour désactiver exec de manière stricte, refusez-le via la
politique d’outils (`tools.deny: ["exec"]` ou par agent). Les approbations d’hôte s’appliquent toujours sauf si vous définissez explicitement
`security=full` et `ask=off`.

## Approbations exec (application compagnon / hôte node)

Les agents en bac à sable peuvent exiger une approbation par requête avant que `exec` ne s’exécute sur l’hôte Gateway ou node.
Consultez [Approbations exec](/fr/tools/exec-approvals) pour la politique, la liste d’autorisation et le flux d’interface utilisateur.

Lorsque des approbations sont requises, l’outil exec retourne immédiatement avec
`status: "approval-pending"` et un identifiant d’approbation. Une fois approuvée (ou refusée / expirée),
le Gateway émet des événements système (`Exec finished` / `Exec denied`). Si la commande est toujours
en cours d’exécution après `tools.exec.approvalRunningNoticeMs`, un seul avis `Exec running` est émis.
Sur les canaux avec cartes/boutons d’approbation natifs, l’agent doit d’abord s’appuyer sur cette
interface utilisateur native et n’inclure une commande manuelle `/approve` que lorsque le résultat de l’outil
indique explicitement que les approbations par chat sont indisponibles ou que l’approbation manuelle est le
seul chemin.

## Liste d’autorisation + binaires sûrs

L’application de la liste d’autorisation manuelle correspond aux globs de chemins de binaires résolus et aux globs de noms de commande nus.
Les noms nus ne correspondent qu’aux commandes invoquées via PATH, donc `rg` peut correspondre à
`/opt/homebrew/bin/rg` lorsque la commande est `rg`, mais pas à `./rg` ni à `/tmp/rg`.
Lorsque `security=allowlist`, les commandes shell ne sont autorisées automatiquement que si chaque segment de pipeline
est dans la liste d’autorisation ou est un binaire sûr. Le chaînage (`;`, `&&`, `||`) et les redirections
sont rejetés en mode liste d’autorisation sauf si chaque segment de niveau supérieur satisfait à la
liste d’autorisation (y compris les binaires sûrs). Les redirections restent non prises en charge.
La confiance durable `allow-always` ne contourne pas cette règle : une commande chaînée nécessite toujours que chaque
segment de niveau supérieur corresponde.

`autoAllowSkills` est un chemin de commodité distinct dans les approbations exec. Il n’est pas identique aux
entrées manuelles de liste d’autorisation par chemin. Pour une confiance explicite stricte, gardez `autoAllowSkills` désactivé.

Utilisez les deux contrôles pour des tâches différentes :

- `tools.exec.safeBins` : petits filtres de flux, uniquement via stdin.
- `tools.exec.safeBinTrustedDirs` : répertoires de confiance supplémentaires explicites pour les chemins d’exécutables safe-bin.
- `tools.exec.safeBinProfiles` : politique argv explicite pour les safe bins personnalisés.
- allowlist : confiance explicite pour les chemins d’exécutables.

Ne traitez pas `safeBins` comme une allowlist générique, et n’ajoutez pas de binaires d’interpréteur/runtime (par exemple `python3`, `node`, `ruby`, `bash`). Si vous en avez besoin, utilisez des entrées d’allowlist explicites et gardez les invites d’approbation activées.
`openclaw security audit` avertit lorsque des entrées `safeBins` d’interpréteur/runtime n’ont pas de profils explicites, et `openclaw doctor --fix` peut générer la structure des entrées `safeBinProfiles` personnalisées manquantes.
`openclaw security audit` et `openclaw doctor` avertissent également lorsque vous rajoutez explicitement des binaires au comportement large, tels que `jq`, dans `safeBins`.
Si vous ajoutez explicitement des interpréteurs à l’allowlist, activez `tools.exec.strictInlineEval` afin que les formes d’évaluation de code en ligne exigent toujours une nouvelle approbation.

Pour les détails complets de la politique et des exemples, consultez [Approbations Exec](/fr/tools/exec-approvals-advanced#safe-bins-stdin-only) et [Safe bins contre allowlist](/fr/tools/exec-approvals-advanced#safe-bins-versus-allowlist).

## Exemples

Premier plan :

```json
{ "tool": "exec", "command": "ls -la" }
```

Arrière-plan + interrogation :

```json
{"tool":"exec","command":"npm run build","yieldMs":1000}
{"tool":"process","action":"poll","sessionId":"<id>"}
```

L’interrogation sert à obtenir un état à la demande, pas à créer des boucles d’attente. Si le réveil automatique à la fin
est activé, la commande peut réveiller la session lorsqu’elle émet une sortie ou échoue.

Envoyer des touches (style tmux) :

```json
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Enter"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["C-c"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Up","Up","Enter"]}
```

Soumettre (envoyer uniquement CR) :

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

Coller (encadré par défaut) :

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` est un sous-outil de `exec` pour les modifications structurées portant sur plusieurs fichiers.
Il est activé par défaut pour les modèles OpenAI et OpenAI Codex. Utilisez la configuration uniquement
lorsque vous voulez le désactiver ou le restreindre à des modèles spécifiques :

```json5
{
  tools: {
    exec: {
      applyPatch: { workspaceOnly: true, allowModels: ["gpt-5.5"] },
    },
  },
}
```

Notes :

- Disponible uniquement pour les modèles OpenAI/OpenAI Codex.
- La politique d’outil s’applique toujours ; `allow: ["write"]` autorise implicitement `apply_patch`.
- `deny: ["write"]` ne refuse pas `apply_patch` ; refusez explicitement `apply_patch` ou utilisez `deny: ["group:fs"]` lorsque les écritures par patch doivent également être bloquées.
- La configuration se trouve sous `tools.exec.applyPatch`.
- `tools.exec.applyPatch.enabled` vaut `true` par défaut ; définissez-le sur `false` pour désactiver l’outil pour les modèles OpenAI.
- `tools.exec.applyPatch.workspaceOnly` vaut `true` par défaut (limité à l’espace de travail). Définissez-le sur `false` uniquement si vous voulez intentionnellement qu’`apply_patch` écrive/supprime en dehors du répertoire de l’espace de travail.

## Connexe

- [Approbations Exec](/fr/tools/exec-approvals) — barrières d’approbation pour les commandes shell
- [Bac à sable](/fr/gateway/sandboxing) — exécution de commandes dans des environnements isolés
- [Processus en arrière-plan](/fr/gateway/background-process) — exec de longue durée et outil process
- [Sécurité](/fr/gateway/security) — politique d’outil et accès élevé
