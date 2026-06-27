---
read_when:
    - Utiliser ou modifier l’outil exec
    - Débogage du comportement stdin ou TTY
summary: Utilisation de l’outil exec, modes stdin et prise en charge du TTY
title: Outil Exec
x-i18n:
    generated_at: "2026-06-27T18:17:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d2831d9e66b25ce251f90e59a41b25234e22106d865466e61b878e3999e849dc
    source_path: tools/exec.md
    workflow: 16
---

Exécute des commandes shell dans l’espace de travail. `exec` est une surface shell mutatrice : les commandes peuvent créer, modifier ou supprimer des fichiers partout où l’hôte sélectionné ou le système de fichiers du sandbox le permet. Désactiver les outils de système de fichiers OpenClaw tels que `write`, `edit` ou `apply_patch` ne rend pas `exec` en lecture seule.

Prend en charge l’exécution au premier plan et en arrière-plan via `process`. Si `process` est interdit, `exec` s’exécute de manière synchrone et ignore `yieldMs`/`background`.
Les sessions en arrière-plan sont limitées à chaque agent ; `process` ne voit que les sessions du même agent.

## Paramètres

<ParamField path="command" type="string" required>
Commande shell à exécuter.
</ParamField>

<ParamField path="workdir" type="string" default="cwd">
Répertoire de travail pour la commande.
</ParamField>

<ParamField path="env" type="object">
Remplacements d’environnement clé/valeur fusionnés par-dessus l’environnement hérité.
</ParamField>

<ParamField path="yieldMs" type="number" default="10000">
Passe automatiquement la commande en arrière-plan après ce délai (ms).
</ParamField>

<ParamField path="background" type="boolean" default="false">
Passe immédiatement la commande en arrière-plan au lieu d’attendre `yieldMs`.
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSec">
Remplace le délai d’expiration exec configuré pour cet appel. Définissez `timeout: 0` uniquement lorsque la commande doit s’exécuter sans délai d’expiration du processus exec.
</ParamField>

<ParamField path="pty" type="boolean" default="false">
Exécute dans un pseudo-terminal lorsqu’il est disponible. À utiliser pour les CLI réservées aux TTY, les agents de codage et les interfaces utilisateur terminal.
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
Où exécuter. `auto` se résout en `sandbox` lorsqu’un runtime sandbox est actif, et en `gateway` sinon.
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
Ignoré pour les appels d’outil normaux. La sécurité `gateway` / `node` est contrôlée par
`tools.exec.security` et le fichier d’approbations de l’hôte ; le mode élevé peut
forcer `security=full` uniquement lorsque l’opérateur accorde explicitement l’accès élevé.
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
Le mode de demande de base provient de `tools.exec.ask` et des approbations de l’hôte.
Pour les appels de modèle issus d’un canal, `ask` par appel est ignoré lorsque la
demande effective de l’hôte est `off` ; sinon, il ne peut que durcir vers un mode
plus strict. Les appelants internes/API de confiance qui construisent des outils exec avec une
valeur `ask` explicite restent inchangés.
</ParamField>

<ParamField path="node" type="string">
Identifiant/nom de Node lorsque `host=node`.
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
Demande le mode élevé — sort du sandbox vers le chemin d’hôte configuré. `security=full` est forcé uniquement lorsque elevated se résout en `full`.
</ParamField>

Notes :

- `host` vaut par défaut `auto` : sandbox lorsqu’un runtime sandbox est actif pour la session, sinon gateway.
- `host` n’accepte que `auto`, `sandbox`, `gateway` ou `node`. Ce n’est pas un sélecteur de nom d’hôte ; les valeurs ressemblant à des noms d’hôte sont rejetées avant l’exécution de la commande.
- `auto` est la stratégie de routage par défaut, pas un caractère générique. `host=node` par appel est autorisé depuis `auto` ; `host=gateway` par appel n’est autorisé que lorsqu’aucun runtime sandbox n’est actif.
- `tools.exec.mode` est le bouton de politique normalisé. Les valeurs sont `deny`, `allowlist`, `ask`, `auto` et `full`. `auto` exécute directement les correspondances déterministes d’allowlist/binaires sûrs et achemine tous les autres cas d’approbation exec via le réviseur automatique natif d’OpenClaw avant de demander à un humain. `ask` / `ask=always` demande toujours à un humain à chaque fois.
- Sans configuration supplémentaire, `host=auto` « fonctionne tout simplement » : sans sandbox, il se résout en `gateway` ; avec un sandbox actif, il reste dans le sandbox.
- `elevated` sort du sandbox vers le chemin d’hôte configuré : `gateway` par défaut, ou `node` lorsque `tools.exec.host=node` (ou lorsque la valeur par défaut de la session est `host=node`). Il n’est disponible que lorsque l’accès élevé est activé pour la session/le fournisseur actuel.
- Les approbations `gateway`/`node` sont contrôlées par le fichier d’approbations de l’hôte.
- `node` nécessite un node apparié (application compagnon ou hôte node sans interface).
- Si plusieurs nodes sont disponibles, définissez `exec.node` ou `tools.exec.node` pour en sélectionner un.
- `exec host=node` est le seul chemin d’exécution shell pour les nodes ; l’ancien wrapper `nodes.run` a été supprimé.
- `timeout` s’applique à l’exécution au premier plan, en arrière-plan, `yieldMs`, gateway, sandbox et `system.run` de node. S’il est omis, OpenClaw utilise `tools.exec.timeoutSec` ; `timeout: 0` explicite désactive le délai d’expiration du processus exec pour cet appel.
- Sur les hôtes non Windows, exec utilise `SHELL` lorsqu’il est défini ; si `SHELL` est `fish`, il préfère `bash` (ou `sh`)
  depuis `PATH` pour éviter les scripts incompatibles avec fish, puis revient à `SHELL` si aucun des deux n’existe.
- Sur les hôtes Windows, exec préfère la découverte de PowerShell 7 (`pwsh`) (Program Files, ProgramW6432, puis PATH),
  puis revient à Windows PowerShell 5.1.
- Sur les hôtes gateway non Windows, les commandes exec bash et zsh utilisent un instantané de démarrage. OpenClaw capture les
  alias/fonctions sourçables et un petit ensemble d’environnement sûr depuis les fichiers de démarrage du shell dans
  `$OPENCLAW_STATE_DIR/cache/shell-snapshots/`, puis source cet instantané avant chaque commande exec.
  Les variables ressemblant à des secrets sont exclues ; les exec sandbox et node n’utilisent pas cet instantané. Définissez
  `OPENCLAW_EXEC_SHELL_SNAPSHOT=0` dans l’environnement du processus Gateway pour désactiver ce chemin d’instantané.
- L’exécution sur hôte (`gateway`/`node`) rejette `env.PATH` et les remplacements de chargeur (`LD_*`/`DYLD_*`) afin de
  prévenir le détournement de binaire ou l’injection de code.
- OpenClaw définit `OPENCLAW_SHELL=exec` dans l’environnement de la commande lancée (y compris l’exécution PTY et sandbox) afin que les règles shell/profil puissent détecter le contexte de l’outil exec.
- Pour les exécutions issues d’un canal, OpenClaw expose aussi une charge utile JSON étroite d’identité expéditeur/chat dans
  `OPENCLAW_CHANNEL_CONTEXT` lorsque le canal a fourni ces identifiants.
- `openclaw channels login` est bloqué depuis `exec` car il s’agit d’un flux interactif d’authentification de canal ; exécutez-le dans un terminal sur l’hôte gateway, ou utilisez l’outil de connexion natif du canal depuis le chat lorsqu’il existe.
- Important : le sandboxing est **désactivé par défaut**. Si le sandboxing est désactivé, `host=auto` implicite
  se résout en `gateway`. `host=sandbox` explicite échoue toujours de manière fermée au lieu de s’exécuter silencieusement
  sur l’hôte gateway. Activez le sandboxing ou utilisez `host=gateway` avec approbations.
- Les vérifications préalables de scripts (pour les erreurs courantes de syntaxe shell Python/Node) inspectent uniquement les fichiers à l’intérieur de la
  limite effective de `workdir`. Si un chemin de script se résout hors de `workdir`, la vérification préalable est ignorée pour
  ce fichier.
- Pour les travaux longue durée qui démarrent maintenant, lancez-les une seule fois et fiez-vous au réveil automatique
  à l’achèvement lorsqu’il est activé et que la commande émet une sortie ou échoue.
  Utilisez `process` pour les journaux, l’état, l’entrée ou l’intervention ; n’émulez pas
  la planification avec des boucles de sleep, des boucles de timeout ou des interrogations répétées.
- Pour les travaux qui doivent se produire plus tard ou selon un calendrier, utilisez cron au lieu des
  modèles sleep/delay avec `exec`.

## Configuration

- `tools.exec.notifyOnExit` (par défaut : true) : lorsque true, les sessions exec passées en arrière-plan mettent en file un événement système et demandent un Heartbeat à la sortie.
- `tools.exec.approvalRunningNoticeMs` (par défaut : 10000) : émet un unique avis « en cours d’exécution » lorsqu’un exec soumis à approbation s’exécute plus longtemps que cette durée (0 désactive).
- `tools.exec.timeoutSec` (par défaut : 1800) : délai d’expiration exec par défaut par commande, en secondes. `timeout` par appel le remplace ; `timeout: 0` par appel désactive le délai d’expiration du processus exec.
- `tools.exec.host` (par défaut : `auto` ; se résout en `sandbox` lorsqu’un runtime sandbox est actif, en `gateway` sinon)
- `tools.exec.security` (par défaut : `deny` pour sandbox, `full` pour gateway + node lorsque non défini)
- `tools.exec.ask` (par défaut : `off`)
- L’exec sur hôte sans approbation est la valeur par défaut pour gateway + node. Si vous voulez un comportement d’approbations/allowlist, durcissez à la fois `tools.exec.*` et le fichier d’approbations de l’hôte ; voir [Approbations exec](/fr/tools/exec-approvals#yolo-mode-no-approval).
- YOLO provient des valeurs par défaut de la politique d’hôte (`security=full`, `ask=off`), pas de `host=auto`. Si vous voulez forcer le routage gateway ou node, définissez `tools.exec.host` ou utilisez `/exec host=...`.
- En mode `security=full` plus `ask=off`, l’exec sur hôte suit directement la politique configurée ; il n’y a pas de couche heuristique supplémentaire de préfiltrage d’obfuscation de commande ni de rejet de vérification préalable de script.
- `tools.exec.node` (par défaut : non défini)
- `tools.exec.strictInlineEval` (par défaut : false) : lorsque true, les formes d’évaluation inline d’interpréteur telles que `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e` et `osascript -e` nécessitent un réviseur ou une approbation explicite. En `mode=auto`, le chemin d’approbation exec normal peut laisser le réviseur automatique natif autoriser une commande ponctuelle clairement à faible risque ; les appels directs `system.run` sur hôte node nécessitent toujours une approbation explicite, car ils ne peuvent pas transmettre la commande à un circuit d’approbation humaine. Si le réviseur le demande, la requête est envoyée à un humain. `allow-always` peut toujours persister les invocations bénignes d’interpréteur/script, mais les formes inline-eval ne deviennent pas des règles d’autorisation durables.
- `tools.exec.commandHighlighting` (par défaut : false) : lorsque true, les invites d’approbation peuvent mettre en évidence les segments de commande dérivés par l’analyseur dans le texte de la commande. Définissez sur `true` globalement ou par agent pour activer la mise en évidence du texte de commande sans modifier la politique d’approbation exec.
- `tools.exec.pathPrepend` : liste de répertoires à préfixer à `PATH` pour les exécutions exec (gateway + sandbox uniquement).
- `tools.exec.safeBins` : binaires sûrs uniquement via stdin qui peuvent s’exécuter sans entrées allowlist explicites. Pour les détails de comportement, voir [Binaires sûrs](/fr/tools/exec-approvals-advanced#safe-bins-stdin-only).
- `tools.exec.safeBinTrustedDirs` : répertoires explicites supplémentaires approuvés pour les vérifications de chemin `safeBins`. Les entrées `PATH` ne sont jamais approuvées automatiquement. Les valeurs par défaut intégrées sont `/bin` et `/usr/bin`.
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
    - Pour empêcher la configuration du shell utilisateur (comme `~/.zshenv` ou `/etc/zshenv`) de remplacer les chemins prioritaires pendant le démarrage, les entrées `tools.exec.pathPrepend` sont préfixées de manière sécurisée au `PATH` final dans la commande shell juste avant l’exécution.
- `host=sandbox` : exécute `sh -lc` (shell de connexion) dans le conteneur, donc `/etc/profile` peut réinitialiser `PATH`.
  OpenClaw préfixe `env.PATH` après le sourçage du profil via une variable d’environnement interne (sans interpolation shell) ;
  `tools.exec.pathPrepend` s’applique ici aussi.
- `host=node` : seuls les remplacements d’environnement non bloqués que vous transmettez sont envoyés au node. Les remplacements `env.PATH` sont
  rejetés pour l’exécution sur hôte et ignorés par les hôtes node. Si vous avez besoin d’entrées PATH supplémentaires sur un node,
  configurez l’environnement du service hôte node (systemd/launchd) ou installez les outils aux emplacements standard.

Liaison node par agent (utilisez l’index de la liste d’agents dans la configuration) :

```bash
openclaw config get agents.list
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
```

Control UI : l’onglet Nodes inclut un petit panneau « Liaison de node exec » pour les mêmes paramètres.

## Remplacements de session (`/exec`)

Utilisez `/exec` pour définir les valeurs par défaut **par session** pour `host`, `security`, `ask` et `node`.
Envoyez `/exec` sans argument pour afficher les valeurs actuelles.

Exemple :

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## Modèle d’autorisation

`/exec` n’est honoré que pour les **expéditeurs autorisés** (listes d’autorisation/appairage de canal plus `commands.useAccessGroups`).
Il met à jour **uniquement l’état de session** et n’écrit pas la configuration. Les expéditeurs de canaux externes autorisés peuvent
définir ces valeurs par défaut de session. Les clients internes gateway/webchat ont besoin de `operator.admin` pour les persister.
Pour désactiver strictement exec, refusez-le via la stratégie d’outils (`tools.deny: ["exec"]` ou par agent). Les approbations de l’hôte
s’appliquent toujours, sauf si vous définissez explicitement `security=full` et `ask=off`.

## Approbations Exec (application compagnon / hôte Node)

Les agents sandboxés peuvent exiger une approbation par requête avant que `exec` s’exécute sur le Gateway ou l’hôte Node.
Consultez [Approbations Exec](/fr/tools/exec-approvals) pour la stratégie, la liste d’autorisation et le flux d’interface utilisateur.

Lorsque des approbations sont requises, l’outil exec retourne immédiatement
`status: "approval-pending"` et un identifiant d’approbation. Une fois approuvée (ou refusée / expirée),
le Gateway émet des événements système de progression et d’achèvement de commande uniquement pour les exécutions approuvées
(`Exec running` / `Exec finished`). Les approbations refusées ou expirées sont terminales et ne
réveillent pas la session de l’agent avec un événement système de refus.
Sur les canaux dotés de cartes/boutons d’approbation natifs, l’agent doit s’appuyer d’abord sur cette
interface utilisateur native et n’inclure une commande manuelle `/approve` que lorsque le résultat de l’outil
indique explicitement que les approbations par chat ne sont pas disponibles ou que l’approbation manuelle est le
seul chemin.

## Liste d’autorisation + binaires sûrs

L’application manuelle de la liste d’autorisation correspond aux globs de chemins binaires résolus et aux globs de noms de commande
bruts. Les noms bruts correspondent uniquement aux commandes invoquées via PATH, donc `rg` peut correspondre à
`/opt/homebrew/bin/rg` lorsque la commande est `rg`, mais pas à `./rg` ni à `/tmp/rg`.
Lorsque `security=allowlist`, les commandes shell ne sont autorisées automatiquement que si chaque segment de pipeline
figure dans la liste d’autorisation ou est un binaire sûr. Les chaînages (`;`, `&&`, `||`) et les redirections
sont rejetés en mode liste d’autorisation, sauf si chaque segment de premier niveau satisfait la
liste d’autorisation (y compris les binaires sûrs). Les redirections restent non prises en charge.
La confiance durable `allow-always` ne contourne pas cette règle : une commande chaînée exige toujours que chaque
segment de premier niveau corresponde.

`autoAllowSkills` est un chemin de commodité séparé dans les approbations exec. Ce n’est pas la même chose que
les entrées manuelles de liste d’autorisation de chemins. Pour une confiance explicite stricte, gardez `autoAllowSkills` désactivé.

Utilisez les deux contrôles pour des tâches différentes :

- `tools.exec.safeBins` : petits filtres de flux stdin uniquement.
- `tools.exec.safeBinTrustedDirs` : répertoires de confiance supplémentaires explicites pour les chemins exécutables de binaires sûrs.
- `tools.exec.safeBinProfiles` : stratégie argv explicite pour les binaires sûrs personnalisés.
- liste d’autorisation : confiance explicite pour les chemins exécutables.

Ne traitez pas `safeBins` comme une liste d’autorisation générique, et n’ajoutez pas de binaires d’interpréteur/runtime (par exemple `python3`, `node`, `ruby`, `bash`). Si vous en avez besoin, utilisez des entrées de liste d’autorisation explicites et gardez les invites d’approbation activées.
`openclaw security audit` avertit lorsque des entrées `safeBins` d’interpréteur/runtime n’ont pas de profils explicites, et `openclaw doctor --fix` peut générer des entrées `safeBinProfiles` personnalisées manquantes.
`openclaw security audit` et `openclaw doctor` avertissent aussi lorsque vous rajoutez explicitement dans `safeBins` des binaires au comportement large tels que `jq`.
Si vous autorisez explicitement des interpréteurs, activez `tools.exec.strictInlineEval` afin que les formes d’évaluation de code inline exigent toujours un réviseur ou une approbation explicite.

Pour les détails complets de stratégie et des exemples, consultez [Approbations Exec](/fr/tools/exec-approvals-advanced#safe-bins-stdin-only) et [Binaires sûrs contre liste d’autorisation](/fr/tools/exec-approvals-advanced#safe-bins-versus-allowlist).

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

L’interrogation sert à obtenir un état à la demande, pas à créer des boucles d’attente. Si le réveil d’achèvement automatique
est activé, la commande peut réveiller la session lorsqu’elle émet une sortie ou échoue.

Envoyer des touches (style tmux) :

```json
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Enter"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["C-c"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Up","Up","Enter"]}
```

Soumettre (envoyer seulement CR) :

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

Coller (encadré par défaut) :

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` est un sous-outil de `exec` pour les modifications structurées multifichiers.
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
- La stratégie d’outils s’applique toujours ; `allow: ["write"]` autorise implicitement `apply_patch`.
- `deny: ["write"]` ne refuse pas `apply_patch` ; refusez explicitement `apply_patch` ou utilisez `deny: ["group:fs"]` lorsque les écritures de patch doivent aussi être bloquées.
- La configuration se trouve sous `tools.exec.applyPatch`.
- `tools.exec.applyPatch.enabled` vaut `true` par défaut ; définissez-le sur `false` pour désactiver l’outil pour les modèles OpenAI.
- `tools.exec.applyPatch.workspaceOnly` vaut `true` par défaut (contenu dans le workspace). Définissez-le sur `false` uniquement si vous voulez intentionnellement que `apply_patch` écrive/supprime hors du répertoire du workspace.

## Connexe

- [Approbations Exec](/fr/tools/exec-approvals) — barrières d’approbation pour les commandes shell
- [Sandboxing](/fr/gateway/sandboxing) — exécuter des commandes dans des environnements sandboxés
- [Processus en arrière-plan](/fr/gateway/background-process) — exec de longue durée et outil process
- [Sécurité](/fr/gateway/security) — stratégie d’outils et accès élevé
