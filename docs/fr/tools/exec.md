---
read_when:
    - Utilisation ou modification de l’outil exec
    - Débogage du comportement de stdin ou du TTY
summary: Utilisation de l’outil exec, modes stdin et prise en charge du TTY
title: Outil d’exécution
x-i18n:
    generated_at: "2026-05-06T07:41:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9892f030f1eeb83ca0cebac462c469e5f9f000763e4c96d62d82b819f98c3084
    source_path: tools/exec.md
    workflow: 16
---

Exécute des commandes shell dans l’espace de travail. Prend en charge l’exécution au premier plan + en arrière-plan via `process`.
Si `process` est interdit, `exec` s’exécute de manière synchrone et ignore `yieldMs`/`background`.
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
Passe automatiquement la commande en arrière-plan après ce délai (ms).
</ParamField>

<ParamField path="background" type="boolean" default="false">
Passe immédiatement la commande en arrière-plan au lieu d’attendre `yieldMs`.
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSec">
Remplace le délai d’expiration exec configuré pour cet appel. Définissez `timeout: 0` uniquement lorsque la commande doit s’exécuter sans délai d’expiration du processus exec.
</ParamField>

<ParamField path="pty" type="boolean" default="false">
Exécute dans un pseudo-terminal lorsqu’il est disponible. À utiliser pour les CLI nécessitant un TTY, les agents de codage et les interfaces utilisateur de terminal.
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
Où exécuter. `auto` se résout en `sandbox` lorsqu’un runtime de bac à sable est actif, et en `gateway` sinon.
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
Mode d’application pour l’exécution `gateway` / `node`.
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
Comportement de la demande d’approbation pour l’exécution `gateway` / `node`.
</ParamField>

<ParamField path="node" type="string">
ID/nom de Node lorsque `host=node`.
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
Demande le mode élevé — sortie du bac à sable vers le chemin d’hôte configuré. `security=full` n’est forcé que lorsque le mode élevé se résout en `full`.
</ParamField>

Remarques :

- `host` vaut `auto` par défaut : bac à sable lorsqu’un runtime de bac à sable est actif pour la session, sinon Gateway.
- `host` n’accepte que `auto`, `sandbox`, `gateway` ou `node`. Ce n’est pas un sélecteur de nom d’hôte ; les valeurs ressemblant à des noms d’hôte sont rejetées avant l’exécution de la commande.
- `auto` est la stratégie de routage par défaut, pas un joker. `host=node` par appel est autorisé depuis `auto` ; `host=gateway` par appel n’est autorisé que lorsqu’aucun runtime de bac à sable n’est actif.
- Sans configuration supplémentaire, `host=auto` fonctionne quand même directement : l’absence de bac à sable signifie qu’il se résout en `gateway` ; un bac à sable actif signifie qu’il reste dans le bac à sable.
- `elevated` sort du bac à sable vers le chemin d’hôte configuré : `gateway` par défaut, ou `node` lorsque `tools.exec.host=node` (ou lorsque la valeur par défaut de la session est `host=node`). Il n’est disponible que lorsque l’accès élevé est activé pour la session/le fournisseur actuel.
- Les approbations `gateway`/`node` sont contrôlées par `~/.openclaw/exec-approvals.json`.
- `node` nécessite un Node appairé (application compagnon ou hôte Node sans interface).
- Si plusieurs Nodes sont disponibles, définissez `exec.node` ou `tools.exec.node` pour en sélectionner un.
- `exec host=node` est le seul chemin d’exécution shell pour les Nodes ; l’ancien wrapper `nodes.run` a été supprimé.
- `timeout` s’applique à l’exécution au premier plan, en arrière-plan, `yieldMs`, Gateway, bac à sable et `system.run` de Node. S’il est omis, OpenClaw utilise `tools.exec.timeoutSec` ; `timeout: 0` explicite désactive le délai d’expiration du processus exec pour cet appel.
- Sur les hôtes non Windows, exec utilise `SHELL` lorsqu’il est défini ; si `SHELL` est `fish`, il préfère `bash` (ou `sh`)
  depuis `PATH` pour éviter les scripts incompatibles avec fish, puis revient à `SHELL` si aucun des deux n’existe.
- Sur les hôtes Windows, exec préfère la découverte de PowerShell 7 (`pwsh`) (Program Files, ProgramW6432, puis PATH),
  puis revient à Windows PowerShell 5.1.
- L’exécution sur l’hôte (`gateway`/`node`) rejette `env.PATH` et les remplacements de chargeur (`LD_*`/`DYLD_*`) afin
  d’empêcher le détournement de binaire ou l’injection de code.
- OpenClaw définit `OPENCLAW_SHELL=exec` dans l’environnement de la commande lancée (y compris l’exécution PTY et en bac à sable) afin que les règles de shell/profil puissent détecter le contexte de l’outil exec.
- `openclaw channels login` est bloqué depuis `exec`, car il s’agit d’un flux interactif d’authentification de canal ; exécutez-le dans un terminal sur l’hôte Gateway, ou utilisez l’outil de connexion natif du canal depuis le chat lorsqu’il existe.
- Important : le bac à sable est **désactivé par défaut**. Si le bac à sable est désactivé, `host=auto` implicite
  se résout en `gateway`. `host=sandbox` explicite échoue toujours de façon fermée au lieu de s’exécuter silencieusement
  sur l’hôte Gateway. Activez le bac à sable ou utilisez `host=gateway` avec des approbations.
- Les contrôles préalables de scripts (pour les erreurs courantes de syntaxe shell Python/Node) n’inspectent que les fichiers situés dans la
  limite effective de `workdir`. Si un chemin de script se résout en dehors de `workdir`, le contrôle préalable est ignoré pour
  ce fichier.
- Pour les travaux de longue durée qui commencent maintenant, démarrez-les une seule fois et appuyez-vous sur le réveil
  automatique à la fin lorsqu’il est activé et que la commande émet une sortie ou échoue.
  Utilisez `process` pour les journaux, l’état, l’entrée ou l’intervention ; n’émulez pas
  une planification avec des boucles de sommeil, des boucles de délai d’expiration ou des interrogations répétées.
- Pour les travaux qui doivent se produire plus tard ou selon un calendrier, utilisez Cron au lieu des
  motifs de sommeil/délai avec `exec`.

## Configuration

- `tools.exec.notifyOnExit` (par défaut : true) : lorsque true, les sessions exec passées en arrière-plan mettent en file d’attente un événement système et demandent un Heartbeat à la sortie.
- `tools.exec.approvalRunningNoticeMs` (par défaut : 10000) : émet un unique avis « en cours d’exécution » lorsqu’un exec soumis à approbation s’exécute plus longtemps que cette durée (0 désactive).
- `tools.exec.timeoutSec` (par défaut : 1800) : délai d’expiration exec par commande par défaut, en secondes. `timeout` par appel le remplace ; `timeout: 0` par appel désactive le délai d’expiration du processus exec.
- `tools.exec.host` (par défaut : `auto` ; se résout en `sandbox` lorsqu’un runtime de bac à sable est actif, en `gateway` sinon)
- `tools.exec.security` (par défaut : `deny` pour le bac à sable, `full` pour Gateway + Node lorsque non défini)
- `tools.exec.ask` (par défaut : `off`)
- L’exécution exec hôte sans approbation est la valeur par défaut pour Gateway + Node. Si vous voulez un comportement d’approbations/liste d’autorisation, durcissez à la fois `tools.exec.*` et le fichier hôte `~/.openclaw/exec-approvals.json` ; consultez [Approbations exec](/fr/tools/exec-approvals#yolo-mode-no-approval).
- YOLO vient des valeurs par défaut de la politique d’hôte (`security=full`, `ask=off`), pas de `host=auto`. Si vous voulez forcer le routage Gateway ou Node, définissez `tools.exec.host` ou utilisez `/exec host=...`.
- En mode `security=full` plus `ask=off`, exec hôte suit directement la politique configurée ; il n’y a pas de préfiltre heuristique supplémentaire d’obfuscation de commande ni de couche de rejet de contrôle préalable de script.
- `tools.exec.node` (par défaut : non défini)
- `tools.exec.strictInlineEval` (par défaut : false) : lorsque true, les formes d’évaluation inline d’interpréteur telles que `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e` et `osascript -e` nécessitent toujours une approbation explicite. `allow-always` peut toujours persister des invocations bénignes d’interpréteur/script, mais les formes inline-eval affichent toujours une demande à chaque fois.
- `tools.exec.pathPrepend` : liste de répertoires à préfixer à `PATH` pour les exécutions exec (Gateway + bac à sable uniquement).
- `tools.exec.safeBins` : binaires sûrs uniquement en stdin pouvant s’exécuter sans entrées explicites de liste d’autorisation. Pour les détails de comportement, consultez [Binaires sûrs](/fr/tools/exec-approvals-advanced#safe-bins-stdin-only).
- `tools.exec.safeBinTrustedDirs` : répertoires explicites supplémentaires approuvés pour les contrôles de chemin `safeBins`. Les entrées `PATH` ne sont jamais automatiquement approuvées. Les valeurs intégrées par défaut sont `/bin` et `/usr/bin`.
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
  rejetés pour l’exécution sur l’hôte. Le daemon lui-même s’exécute toujours avec un `PATH` minimal :
  - macOS : `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux : `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox` : exécute `sh -lc` (shell de connexion) dans le conteneur, donc `/etc/profile` peut réinitialiser `PATH`.
  OpenClaw préfixe `env.PATH` après le chargement du profil via une variable d’environnement interne (sans interpolation shell) ;
  `tools.exec.pathPrepend` s’applique ici aussi.
- `host=node` : seuls les remplacements d’environnement non bloqués que vous transmettez sont envoyés au Node. Les remplacements `env.PATH` sont
  rejetés pour l’exécution sur l’hôte et ignorés par les hôtes Node. Si vous avez besoin d’entrées PATH supplémentaires sur un Node,
  configurez l’environnement du service de l’hôte Node (systemd/launchd) ou installez les outils dans des emplacements standard.

Liaison de Node par agent (utilisez l’index de la liste des agents dans la configuration) :

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Interface utilisateur de contrôle : l’onglet Nodes inclut un petit panneau « Liaison de Node exec » pour les mêmes paramètres.

## Remplacements de session (`/exec`)

Utilisez `/exec` pour définir les valeurs par défaut **par session** de `host`, `security`, `ask` et `node`.
Envoyez `/exec` sans argument pour afficher les valeurs actuelles.

Exemple :

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## Modèle d’autorisation

`/exec` n’est honoré que pour les **expéditeurs autorisés** (listes d’autorisation/appairage des canaux plus `commands.useAccessGroups`).
Il met à jour **l’état de session uniquement** et n’écrit pas la configuration. Pour désactiver exec de façon stricte, refusez-le via la
politique d’outil (`tools.deny: ["exec"]` ou par agent). Les approbations d’hôte s’appliquent toujours sauf si vous définissez explicitement
`security=full` et `ask=off`.

## Approbations exec (application compagnon / hôte Node)

Les agents en bac à sable peuvent nécessiter une approbation par requête avant que `exec` ne s’exécute sur l’hôte Gateway ou Node.
Consultez [Approbations exec](/fr/tools/exec-approvals) pour la politique, la liste d’autorisation et le flux d’interface utilisateur.

Lorsque des approbations sont requises, l’outil exec retourne immédiatement avec
`status: "approval-pending"` et un ID d’approbation. Une fois approuvé (ou refusé / expiré),
le Gateway émet des événements système (`Exec finished` / `Exec denied`). Si la commande est toujours
en cours d’exécution après `tools.exec.approvalRunningNoticeMs`, un unique avis `Exec running` est émis.
Sur les canaux avec cartes/boutons d’approbation natifs, l’agent doit s’appuyer d’abord sur cette
interface native et n’inclure une commande `/approve` manuelle que lorsque le résultat de l’outil
indique explicitement que les approbations par chat sont indisponibles ou que l’approbation manuelle est le
seul chemin.

## Liste d’autorisation + binaires sûrs

L’application manuelle de la liste d’autorisation fait correspondre les globs de chemins de binaires résolus et les globs
de noms de commande bruts. Les noms bruts ne correspondent qu’aux commandes invoquées via PATH, donc `rg` peut correspondre
à `/opt/homebrew/bin/rg` lorsque la commande est `rg`, mais pas à `./rg` ni `/tmp/rg`.
Lorsque `security=allowlist`, les commandes shell sont autorisées automatiquement uniquement si chaque segment de pipeline
est dans la liste d’autorisation ou est un binaire sûr. Les chaînages (`;`, `&&`, `||`) et les redirections
sont rejetés en mode liste d’autorisation sauf si chaque segment de niveau supérieur satisfait à la
liste d’autorisation (y compris les binaires sûrs). Les redirections restent non prises en charge.
La confiance durable `allow-always` ne contourne pas cette règle : une commande chaînée nécessite toujours que chaque
segment de niveau supérieur corresponde.

`autoAllowSkills` est un chemin de commodité distinct dans les approbations exec. Ce n’est pas la même chose que
les entrées manuelles de liste d’autorisation de chemins. Pour une confiance explicite stricte, gardez `autoAllowSkills` désactivé.

Utilisez les deux contrôles pour des tâches différentes :

- `tools.exec.safeBins` : petits filtres de flux uniquement en stdin.
- `tools.exec.safeBinTrustedDirs` : répertoires approuvés explicites supplémentaires pour les chemins d’exécutables de binaires sûrs.
- `tools.exec.safeBinProfiles` : politique argv explicite pour les binaires sûrs personnalisés.
- liste d’autorisation : confiance explicite pour les chemins d’exécutables.

Ne traitez pas `safeBins` comme une liste d’autorisation générique, et n’ajoutez pas de binaires d’interpréteur/d’environnement d’exécution (par exemple `python3`, `node`, `ruby`, `bash`). Si vous en avez besoin, utilisez des entrées explicites de liste d’autorisation et conservez les invites d’approbation activées.
`openclaw security audit` avertit lorsque des entrées `safeBins` d’interpréteur/d’environnement d’exécution n’ont pas de profils explicites, et `openclaw doctor --fix` peut générer le squelette des entrées personnalisées `safeBinProfiles` manquantes.
`openclaw security audit` et `openclaw doctor` avertissent également lorsque vous rajoutez explicitement des binaires à comportement large, comme `jq`, dans `safeBins`.
Si vous placez explicitement des interpréteurs sur liste d’autorisation, activez `tools.exec.strictInlineEval` afin que les formes d’évaluation de code en ligne nécessitent encore une nouvelle approbation.

Pour les détails complets de la politique et des exemples, consultez [Approbations exec](/fr/tools/exec-approvals-advanced#safe-bins-stdin-only) et [Bins sûrs contre liste d’autorisation](/fr/tools/exec-approvals-advanced#safe-bins-versus-allowlist).

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

Soumettre (envoyer seulement CR) :

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

Coller (entre crochets par défaut) :

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` est un sous-outil de `exec` pour les modifications structurées de plusieurs fichiers.
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

Remarques :

- Disponible uniquement pour les modèles OpenAI/OpenAI Codex.
- La politique d’outils s’applique toujours ; `allow: ["write"]` autorise implicitement `apply_patch`.
- `deny: ["write"]` ne refuse pas `apply_patch` ; refusez explicitement `apply_patch` ou utilisez `deny: ["group:fs"]` lorsque les écritures de correctifs doivent également être bloquées.
- La configuration se trouve sous `tools.exec.applyPatch`.
- `tools.exec.applyPatch.enabled` vaut `true` par défaut ; définissez-le sur `false` pour désactiver l’outil pour les modèles OpenAI.
- `tools.exec.applyPatch.workspaceOnly` vaut `true` par défaut (contenu dans l’espace de travail). Définissez-le sur `false` uniquement si vous voulez intentionnellement que `apply_patch` écrive/supprime en dehors du répertoire de l’espace de travail.

## Associé

- [Approbations exec](/fr/tools/exec-approvals) — barrières d’approbation pour les commandes shell
- [Sandboxing](/fr/gateway/sandboxing) — exécution de commandes dans des environnements en bac à sable
- [Processus en arrière-plan](/fr/gateway/background-process) — exec longue durée et outil de processus
- [Sécurité](/fr/gateway/security) — politique d’outils et accès élevé
