---
read_when:
    - Utilisation ou modification de l’outil exec
    - Débogage du comportement de stdin ou du TTY
summary: Utilisation de l’outil exec, modes stdin et prise en charge des TTY
title: Outil d’exécution
x-i18n:
    generated_at: "2026-05-03T21:39:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: dbc8dda08abfd4d7b2e2cd5c7319a7eddf1575156bbfbc52df841908589c8c81
    source_path: tools/exec.md
    workflow: 16
---

Exécute des commandes shell dans l’espace de travail. Prend en charge l’exécution au premier plan et en arrière-plan via `process`.
Si `process` est interdit, `exec` s’exécute de façon synchrone et ignore `yieldMs`/`background`.
Les sessions en arrière-plan sont limitées à chaque agent ; `process` ne voit que les sessions du même agent.

## Paramètres

<ParamField path="command" type="string" required>
Commande shell à exécuter.
</ParamField>

<ParamField path="workdir" type="string" default="cwd">
Répertoire de travail pour la commande.
</ParamField>

<ParamField path="env" type="object">
Surcharges d’environnement clé/valeur fusionnées par-dessus l’environnement hérité.
</ParamField>

<ParamField path="yieldMs" type="number" default="10000">
Passe automatiquement la commande en arrière-plan après ce délai (ms).
</ParamField>

<ParamField path="background" type="boolean" default="false">
Passe immédiatement la commande en arrière-plan au lieu d’attendre `yieldMs`.
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSec">
Remplace le délai d’expiration exec configuré pour cet appel. Définissez `timeout: 0` uniquement lorsque la commande doit s’exécuter sans le délai d’expiration du processus exec.
</ParamField>

<ParamField path="pty" type="boolean" default="false">
Exécute dans un pseudo-terminal lorsqu’il est disponible. À utiliser pour les CLI qui exigent un TTY, les agents de codage et les interfaces utilisateur de terminal.
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
Où exécuter. `auto` se résout en `sandbox` lorsqu’un runtime sandbox est actif et en `gateway` sinon.
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
Mode d’application pour l’exécution `gateway` / `node`.
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
Comportement de demande d’approbation pour l’exécution `gateway` / `node`.
</ParamField>

<ParamField path="node" type="string">
Identifiant/nom du Node lorsque `host=node`.
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
Demande le mode élevé — sort du sandbox vers le chemin de l’hôte configuré. `security=full` n’est forcé que lorsque le mode élevé se résout en `full`.
</ParamField>

Remarques :

- `host` utilise `auto` par défaut : sandbox lorsque le runtime sandbox est actif pour la session, sinon Gateway.
- `host` n’accepte que `auto`, `sandbox`, `gateway` ou `node`. Ce n’est pas un sélecteur de nom d’hôte ; les valeurs ressemblant à des noms d’hôte sont rejetées avant l’exécution de la commande.
- `auto` est la stratégie de routage par défaut, pas un caractère générique. `host=node` par appel est autorisé depuis `auto` ; `host=gateway` par appel n’est autorisé que lorsqu’aucun runtime sandbox n’est actif.
- Sans configuration supplémentaire, `host=auto` fonctionne quand même simplement : pas de sandbox signifie qu’il se résout en `gateway` ; un sandbox actif signifie qu’il reste dans le sandbox.
- `elevated` sort du sandbox vers le chemin de l’hôte configuré : `gateway` par défaut, ou `node` lorsque `tools.exec.host=node` (ou que la valeur par défaut de la session est `host=node`). Il n’est disponible que lorsque l’accès élevé est activé pour la session/le fournisseur actuel.
- Les approbations `gateway`/`node` sont contrôlées par `~/.openclaw/exec-approvals.json`.
- `node` nécessite un Node appairé (application compagnon ou hôte Node sans interface).
- Si plusieurs Nodes sont disponibles, définissez `exec.node` ou `tools.exec.node` pour en sélectionner un.
- `exec host=node` est le seul chemin d’exécution shell pour les Nodes ; l’ancien wrapper `nodes.run` a été supprimé.
- `timeout` s’applique à l’exécution au premier plan, en arrière-plan, `yieldMs`, Gateway, sandbox et Node `system.run`. S’il est omis, OpenClaw utilise `tools.exec.timeoutSec` ; `timeout: 0` explicite désactive le délai d’expiration du processus exec pour cet appel.
- Sur les hôtes non Windows, exec utilise `SHELL` lorsqu’il est défini ; si `SHELL` vaut `fish`, il préfère `bash` (ou `sh`)
  depuis `PATH` pour éviter les scripts incompatibles avec fish, puis revient à `SHELL` si aucun des deux n’existe.
- Sur les hôtes Windows, exec préfère la découverte de PowerShell 7 (`pwsh`) (Program Files, ProgramW6432, puis PATH),
  puis revient à Windows PowerShell 5.1.
- L’exécution sur l’hôte (`gateway`/`node`) rejette `env.PATH` et les surcharges de chargeur (`LD_*`/`DYLD_*`) afin
  d’éviter le détournement de binaire ou l’injection de code.
- OpenClaw définit `OPENCLAW_SHELL=exec` dans l’environnement de la commande lancée (y compris l’exécution PTY et sandbox) afin que les règles de shell/profil puissent détecter le contexte de l’outil exec.
- `openclaw channels login` est bloqué depuis `exec` parce qu’il s’agit d’un flux interactif d’authentification de canal ; exécutez-le dans un terminal sur l’hôte Gateway, ou utilisez l’outil de connexion natif du canal depuis le chat lorsqu’il existe.
- Important : le sandboxing est **désactivé par défaut**. Si le sandboxing est désactivé, `host=auto` implicite
  se résout en `gateway`. `host=sandbox` explicite échoue toujours de façon fermée au lieu de s’exécuter silencieusement
  sur l’hôte Gateway. Activez le sandboxing ou utilisez `host=gateway` avec des approbations.
- Les vérifications préalables de scripts (pour les erreurs courantes de syntaxe shell Python/Node) n’inspectent que les fichiers à l’intérieur de la
  limite effective de `workdir`. Si le chemin d’un script se résout hors de `workdir`, la vérification préalable est ignorée pour
  ce fichier.
- Pour les travaux de longue durée qui démarrent maintenant, lancez-les une seule fois et comptez sur le réveil automatique
  de fin lorsqu’il est activé et que la commande émet une sortie ou échoue.
  Utilisez `process` pour les journaux, l’état, l’entrée ou l’intervention ; n’imitez pas
  la planification avec des boucles de sommeil, des boucles de timeout ou des interrogations répétées.
- Pour les travaux qui doivent avoir lieu plus tard ou selon un calendrier, utilisez Cron au lieu des modèles de sommeil/délai avec `exec`.

## Configuration

- `tools.exec.notifyOnExit` (par défaut : true) : lorsque true, les sessions exec passées en arrière-plan mettent en file d’attente un événement système et demandent un Heartbeat à la sortie.
- `tools.exec.approvalRunningNoticeMs` (par défaut : 10000) : émet un seul avis « en cours d’exécution » lorsqu’un exec soumis à approbation s’exécute plus longtemps que cette durée (0 désactive).
- `tools.exec.timeoutSec` (par défaut : 1800) : délai d’expiration exec par commande par défaut, en secondes. `timeout` par appel le remplace ; `timeout: 0` par appel désactive le délai d’expiration du processus exec.
- `tools.exec.host` (par défaut : `auto` ; se résout en `sandbox` lorsque le runtime sandbox est actif, sinon en `gateway`)
- `tools.exec.security` (par défaut : `deny` pour sandbox, `full` pour Gateway + Node lorsqu’il n’est pas défini)
- `tools.exec.ask` (par défaut : `off`)
- L’exécution hôte sans approbation est la valeur par défaut pour Gateway + Node. Si vous voulez un comportement avec approbations/liste d’autorisation, renforcez à la fois `tools.exec.*` et le fichier hôte `~/.openclaw/exec-approvals.json` ; consultez [Approbations exec](/fr/tools/exec-approvals#yolo-mode-no-approval).
- YOLO vient des valeurs par défaut de politique d’hôte (`security=full`, `ask=off`), pas de `host=auto`. Si vous voulez forcer le routage Gateway ou Node, définissez `tools.exec.host` ou utilisez `/exec host=...`.
- En mode `security=full` plus `ask=off`, host exec suit directement la politique configurée ; il n’y a pas de préfiltre heuristique supplémentaire d’obfuscation de commande ni de couche de rejet par vérification préalable de script.
- `tools.exec.node` (par défaut : non défini)
- `tools.exec.strictInlineEval` (par défaut : false) : lorsque true, les formes d’évaluation en ligne d’interpréteur comme `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e` et `osascript -e` nécessitent toujours une approbation explicite. `allow-always` peut encore persister les invocations bénignes d’interpréteur/script, mais les formes d’évaluation en ligne déclenchent toujours une demande à chaque fois.
- `tools.exec.pathPrepend` : liste de répertoires à préfixer à `PATH` pour les exécutions exec (Gateway + sandbox uniquement).
- `tools.exec.safeBins` : binaires sûrs qui lisent seulement stdin et peuvent s’exécuter sans entrées explicites de liste d’autorisation. Pour les détails de comportement, consultez [Binaires sûrs](/fr/tools/exec-approvals-advanced#safe-bins-stdin-only).
- `tools.exec.safeBinTrustedDirs` : répertoires explicites supplémentaires approuvés pour les vérifications de chemins `safeBins`. Les entrées `PATH` ne sont jamais approuvées automatiquement. Les valeurs intégrées par défaut sont `/bin` et `/usr/bin`.
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

- `host=gateway` : fusionne le `PATH` de votre shell de connexion dans l’environnement exec. Les surcharges `env.PATH` sont
  rejetées pour l’exécution sur l’hôte. Le daemon lui-même s’exécute toujours avec un `PATH` minimal :
  - macOS : `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux : `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox` : exécute `sh -lc` (shell de connexion) dans le conteneur, donc `/etc/profile` peut réinitialiser `PATH`.
  OpenClaw préfixe `env.PATH` après le chargement du profil via une variable d’environnement interne (sans interpolation shell) ;
  `tools.exec.pathPrepend` s’applique ici aussi.
- `host=node` : seules les surcharges d’environnement non bloquées que vous passez sont envoyées au Node. Les surcharges `env.PATH` sont
  rejetées pour l’exécution sur l’hôte et ignorées par les hôtes Node. Si vous avez besoin d’entrées PATH supplémentaires sur un Node,
  configurez l’environnement du service de l’hôte Node (systemd/launchd) ou installez les outils dans des emplacements standard.

Liaison Node par agent (utilisez l’index de la liste d’agents dans la configuration) :

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Interface utilisateur de contrôle : l’onglet Nodes inclut un petit panneau « Liaison Node exec » pour les mêmes paramètres.

## Surcharges de session (`/exec`)

Utilisez `/exec` pour définir les valeurs par défaut **par session** pour `host`, `security`, `ask` et `node`.
Envoyez `/exec` sans argument pour afficher les valeurs actuelles.

Exemple :

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## Modèle d’autorisation

`/exec` n’est honoré que pour les **expéditeurs autorisés** (listes d’autorisation/appairage des canaux plus `commands.useAccessGroups`).
Il met à jour **uniquement l’état de la session** et n’écrit pas la configuration. Pour désactiver exec de façon stricte, refusez-le via la politique d’outil
(`tools.deny: ["exec"]` ou par agent). Les approbations d’hôte s’appliquent toujours, sauf si vous définissez explicitement
`security=full` et `ask=off`.

## Approbations exec (application compagnon / hôte Node)

Les agents sandboxés peuvent exiger une approbation par requête avant que `exec` s’exécute sur l’hôte Gateway ou Node.
Consultez [Approbations exec](/fr/tools/exec-approvals) pour la politique, la liste d’autorisation et le flux d’interface utilisateur.

Lorsque des approbations sont requises, l’outil exec retourne immédiatement
`status: "approval-pending"` et un identifiant d’approbation. Une fois approuvée (ou refusée / expirée),
le Gateway émet des événements système (`Exec finished` / `Exec denied`). Si la commande est toujours
en cours après `tools.exec.approvalRunningNoticeMs`, un seul avis `Exec running` est émis.
Sur les canaux avec des cartes/boutons d’approbation natifs, l’agent doit d’abord s’appuyer sur cette
interface utilisateur native et n’inclure une commande manuelle `/approve` que lorsque le résultat de l’outil
indique explicitement que les approbations par chat ne sont pas disponibles ou que l’approbation manuelle est le
seul chemin possible.

## Liste d’autorisation + binaires sûrs

L’application manuelle de la liste d’autorisation compare les globs de chemins de binaires résolus et les globs
de noms de commande nus. Les noms nus ne correspondent qu’aux commandes invoquées via PATH, donc `rg` peut correspondre à
`/opt/homebrew/bin/rg` lorsque la commande est `rg`, mais pas à `./rg` ni à `/tmp/rg`.
Lorsque `security=allowlist`, les commandes shell ne sont autorisées automatiquement que si chaque segment de pipeline
est dans la liste d’autorisation ou est un binaire sûr. Le chaînage (`;`, `&&`, `||`) et les redirections
sont rejetés en mode liste d’autorisation sauf si chaque segment de premier niveau satisfait la
liste d’autorisation (y compris les binaires sûrs). Les redirections restent non prises en charge.
La confiance durable `allow-always` ne contourne pas cette règle : une commande chaînée nécessite toujours que chaque
segment de premier niveau corresponde.

`autoAllowSkills` est un chemin de commodité distinct dans les approbations exec. Ce n’est pas la même chose que
les entrées manuelles de liste d’autorisation de chemins. Pour une confiance explicite stricte, gardez `autoAllowSkills` désactivé.

Utilisez les deux contrôles pour des tâches différentes :

- `tools.exec.safeBins` : petits filtres de flux lisant seulement stdin.
- `tools.exec.safeBinTrustedDirs` : répertoires approuvés explicites supplémentaires pour les chemins d’exécutables de binaires sûrs.
- `tools.exec.safeBinProfiles` : politique argv explicite pour les binaires sûrs personnalisés.
- liste d’autorisation : confiance explicite pour les chemins d’exécutables.

Ne considérez pas `safeBins` comme une liste d’autorisation générique, et n’ajoutez pas de binaires d’interpréteur/d’environnement d’exécution (par exemple `python3`, `node`, `ruby`, `bash`). Si vous en avez besoin, utilisez des entrées explicites de liste d’autorisation et gardez les invites d’approbation activées.
`openclaw security audit` avertit lorsque des entrées `safeBins` d’interpréteur/d’environnement d’exécution n’ont pas de profils explicites, et `openclaw doctor --fix` peut générer la structure des entrées `safeBinProfiles` personnalisées manquantes.
`openclaw security audit` et `openclaw doctor` avertissent également lorsque vous rajoutez explicitement dans `safeBins` des binaires au comportement large, comme `jq`.
Si vous autorisez explicitement des interpréteurs via une liste d’autorisation, activez `tools.exec.strictInlineEval` afin que les formes d’évaluation de code en ligne exigent toujours une nouvelle approbation.

Pour les détails complets de la politique et des exemples, consultez [Approbations exec](/fr/tools/exec-approvals-advanced#safe-bins-stdin-only) et [Safe bins contre liste d’autorisation](/fr/tools/exec-approvals-advanced#safe-bins-versus-allowlist).

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

L’interrogation sert à obtenir un état à la demande, pas à créer des boucles d’attente. Si le réveil automatique à l’achèvement
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

Coller (mode bracketed par défaut) :

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` est un sous-outil de `exec` pour les modifications structurées sur plusieurs fichiers.
Il est activé par défaut pour les modèles OpenAI et OpenAI Codex. Utilisez la configuration uniquement
lorsque vous voulez le désactiver ou le limiter à des modèles précis :

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
- La politique des outils s’applique toujours ; `allow: ["write"]` autorise implicitement `apply_patch`.
- `deny: ["write"]` ne refuse pas `apply_patch` ; refusez explicitement `apply_patch` ou utilisez `deny: ["group:fs"]` lorsque les écritures de correctifs doivent aussi être bloquées.
- La configuration se trouve sous `tools.exec.applyPatch`.
- `tools.exec.applyPatch.enabled` vaut `true` par défaut ; définissez-le sur `false` pour désactiver l’outil pour les modèles OpenAI.
- `tools.exec.applyPatch.workspaceOnly` vaut `true` par défaut (contenu dans l’espace de travail). Définissez-le sur `false` uniquement si vous voulez intentionnellement que `apply_patch` écrive/supprime en dehors du répertoire de l’espace de travail.

## Liens connexes

- [Approbations exec](/fr/tools/exec-approvals) — barrières d’approbation pour les commandes shell
- [Sandboxing](/fr/gateway/sandboxing) — exécution de commandes dans des environnements isolés
- [Processus en arrière-plan](/fr/gateway/background-process) — outil exec et process de longue durée
- [Sécurité](/fr/gateway/security) — politique des outils et accès élevé
