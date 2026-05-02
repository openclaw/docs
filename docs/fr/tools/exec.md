---
read_when:
    - Utilisation ou modification de l’outil exec
    - Débogage du comportement de stdin ou du TTY
summary: Utilisation de l’outil Exec, modes stdin et prise en charge du TTY
title: Outil d’exécution
x-i18n:
    generated_at: "2026-05-02T22:23:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: 67d2847f70142b326f527a79ffddab1015b897e8ec4d7ce4557430e57fe0956a
    source_path: tools/exec.md
    workflow: 16
---

Exécutez des commandes shell dans l’espace de travail. Prend en charge l’exécution au premier plan et en arrière-plan via `process`.
Si `process` est interdit, `exec` s’exécute de manière synchrone et ignore `yieldMs`/`background`.
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
Passer automatiquement la commande en arrière-plan après ce délai (ms).
</ParamField>

<ParamField path="background" type="boolean" default="false">
Passer immédiatement la commande en arrière-plan au lieu d’attendre `yieldMs`.
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSec">
Remplacer le délai d’expiration exec configuré pour cet appel. Définissez `timeout: 0` uniquement lorsque la commande doit s’exécuter sans délai d’expiration du processus exec.
</ParamField>

<ParamField path="pty" type="boolean" default="false">
Exécuter dans un pseudo-terminal lorsqu’il est disponible. À utiliser pour les CLI réservées aux TTY, les agents de code et les interfaces utilisateur de terminal.
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
Identifiant/nom du Node lorsque `host=node`.
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
Demander le mode élevé — sortir du bac à sable vers le chemin d’hôte configuré. `security=full` n’est forcé que lorsque l’élévation se résout en `full`.
</ParamField>

Notes :

- `host` vaut par défaut `auto` : bac à sable lorsqu’un runtime de bac à sable est actif pour la session, sinon Gateway.
- `host` n’accepte que `auto`, `sandbox`, `gateway` ou `node`. Ce n’est pas un sélecteur de nom d’hôte ; les valeurs ressemblant à des noms d’hôte sont rejetées avant l’exécution de la commande.
- `auto` est la stratégie de routage par défaut, pas un joker. `host=node` par appel est autorisé depuis `auto` ; `host=gateway` par appel n’est autorisé que lorsqu’aucun runtime de bac à sable n’est actif.
- Sans configuration supplémentaire, `host=auto` « fonctionne simplement » : pas de bac à sable signifie qu’il se résout en `gateway` ; un bac à sable actif signifie qu’il reste dans le bac à sable.
- `elevated` sort du bac à sable vers le chemin d’hôte configuré : `gateway` par défaut, ou `node` lorsque `tools.exec.host=node` (ou que la valeur par défaut de la session est `host=node`). Il n’est disponible que lorsque l’accès élevé est activé pour la session/le fournisseur actuel.
- Les approbations `gateway`/`node` sont contrôlées par `~/.openclaw/exec-approvals.json`.
- `node` nécessite un Node appairé (application compagnon ou hôte Node sans interface).
- Si plusieurs Nodes sont disponibles, définissez `exec.node` ou `tools.exec.node` pour en sélectionner un.
- `exec host=node` est le seul chemin d’exécution shell pour les Nodes ; l’ancien wrapper `nodes.run` a été supprimé.
- `timeout` s’applique à l’exécution au premier plan, en arrière-plan, avec `yieldMs`, Gateway, bac à sable et Node `system.run`. S’il est omis, OpenClaw utilise `tools.exec.timeoutSec` ; `timeout: 0` explicite désactive le délai d’expiration du processus exec pour cet appel.
- Sur les hôtes non Windows, exec utilise `SHELL` lorsqu’il est défini ; si `SHELL` vaut `fish`, il préfère `bash` (ou `sh`)
  depuis `PATH` pour éviter les scripts incompatibles avec fish, puis revient à `SHELL` si aucun des deux n’existe.
- Sur les hôtes Windows, exec préfère la découverte de PowerShell 7 (`pwsh`) (Program Files, ProgramW6432, puis PATH),
  puis revient à Windows PowerShell 5.1.
- L’exécution sur hôte (`gateway`/`node`) rejette `env.PATH` et les surcharges de chargeur (`LD_*`/`DYLD_*`) afin de
  prévenir le détournement de binaires ou le code injecté.
- OpenClaw définit `OPENCLAW_SHELL=exec` dans l’environnement de la commande lancée (y compris l’exécution PTY et en bac à sable) afin que les règles de shell/profil puissent détecter le contexte de l’outil exec.
- `openclaw channels login` est bloqué depuis `exec`, car il s’agit d’un flux interactif d’authentification de canal ; exécutez-le dans un terminal sur l’hôte Gateway, ou utilisez l’outil de connexion natif du canal depuis le chat lorsqu’il existe.
- Important : le bac à sable est **désactivé par défaut**. Si le bac à sable est désactivé, le `host=auto` implicite
  se résout en `gateway`. Le `host=sandbox` explicite échoue tout de même de manière fermée au lieu de s’exécuter silencieusement
  sur l’hôte Gateway. Activez le bac à sable ou utilisez `host=gateway` avec des approbations.
- Les vérifications préalables des scripts (pour les erreurs courantes de syntaxe shell Python/Node) n’inspectent que les fichiers situés dans la
  limite effective de `workdir`. Si un chemin de script se résout en dehors de `workdir`, la vérification préalable est ignorée pour
  ce fichier.
- Pour les tâches de longue durée qui démarrent maintenant, démarrez-les une seule fois et appuyez-vous sur le réveil automatique
  de fin lorsqu’il est activé et que la commande produit une sortie ou échoue.
  Utilisez `process` pour les journaux, l’état, l’entrée ou l’intervention ; n’émulez pas
  la planification avec des boucles de sommeil, des boucles de délai d’expiration ou des interrogations répétées.
- Pour les tâches qui doivent se produire plus tard ou selon une planification, utilisez cron au lieu des
  schémas de sommeil/délai `exec`.

## Configuration

- `tools.exec.notifyOnExit` (par défaut : true) : lorsque true, les sessions exec passées en arrière-plan mettent en file d’attente un événement système et demandent un Heartbeat à la sortie.
- `tools.exec.approvalRunningNoticeMs` (par défaut : 10000) : émettre une seule notification « en cours d’exécution » lorsqu’un exec soumis à approbation s’exécute plus longtemps que cette durée (0 désactive).
- `tools.exec.timeoutSec` (par défaut : 1800) : délai d’expiration exec par commande par défaut, en secondes. `timeout` par appel le remplace ; `timeout: 0` par appel désactive le délai d’expiration du processus exec.
- `tools.exec.host` (par défaut : `auto` ; se résout en `sandbox` lorsqu’un runtime de bac à sable est actif, sinon `gateway`)
- `tools.exec.security` (par défaut : `deny` pour le bac à sable, `full` pour Gateway + Node lorsqu’il n’est pas défini)
- `tools.exec.ask` (par défaut : `off`)
- L’exécution exec sur hôte sans approbation est la valeur par défaut pour Gateway + Node. Si vous voulez un comportement avec approbations/liste d’autorisation, resserrez à la fois `tools.exec.*` et le fichier hôte `~/.openclaw/exec-approvals.json` ; consultez [Approbations exec](/fr/tools/exec-approvals#yolo-mode-no-approval).
- YOLO provient des valeurs par défaut de la politique d’hôte (`security=full`, `ask=off`), pas de `host=auto`. Si vous voulez forcer le routage Gateway ou Node, définissez `tools.exec.host` ou utilisez `/exec host=...`.
- En mode `security=full` plus `ask=off`, l’exécution exec sur hôte suit directement la politique configurée ; il n’y a pas de couche supplémentaire de préfiltre heuristique d’obfuscation de commande ni de rejet par vérification préalable des scripts.
- `tools.exec.node` (par défaut : non défini)
- `tools.exec.strictInlineEval` (par défaut : false) : lorsque true, les formes d’évaluation en ligne d’interpréteur comme `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e` et `osascript -e` nécessitent toujours une approbation explicite. `allow-always` peut toujours conserver les invocations bénignes d’interpréteur/de script, mais les formes d’évaluation en ligne demandent tout de même une confirmation à chaque fois.
- `tools.exec.pathPrepend` : liste de répertoires à ajouter au début de `PATH` pour les exécutions exec (Gateway + bac à sable uniquement).
- `tools.exec.safeBins` : binaires sûrs uniquement sur stdin qui peuvent s’exécuter sans entrées explicites de liste d’autorisation. Pour les détails de comportement, consultez [Binaires sûrs](/fr/tools/exec-approvals-advanced#safe-bins-stdin-only).
- `tools.exec.safeBinTrustedDirs` : répertoires explicites supplémentaires approuvés pour les vérifications de chemin `safeBins`. Les entrées `PATH` ne sont jamais automatiquement approuvées. Les valeurs intégrées par défaut sont `/bin` et `/usr/bin`.
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
  rejetés pour l’exécution sur hôte. Le démon lui-même s’exécute toujours avec un `PATH` minimal :
  - macOS : `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux : `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox` : exécute `sh -lc` (shell de connexion) dans le conteneur, donc `/etc/profile` peut réinitialiser `PATH`.
  OpenClaw ajoute `env.PATH` au début après le chargement du profil via une variable d’environnement interne (sans interpolation shell) ;
  `tools.exec.pathPrepend` s’applique ici aussi.
- `host=node` : seules les surcharges d’environnement non bloquées que vous transmettez sont envoyées au Node. Les remplacements `env.PATH` sont
  rejetés pour l’exécution sur hôte et ignorés par les hôtes Node. Si vous avez besoin d’entrées PATH supplémentaires sur un Node,
  configurez l’environnement du service hôte Node (systemd/launchd) ou installez les outils dans des emplacements standard.

Liaison Node par agent (utilisez l’index de la liste d’agents dans la configuration) :

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Interface utilisateur de contrôle : l’onglet Nodes inclut un petit panneau « Liaison de Node exec » pour les mêmes paramètres.

## Remplacements de session (`/exec`)

Utilisez `/exec` pour définir les valeurs par défaut **par session** pour `host`, `security`, `ask` et `node`.
Envoyez `/exec` sans arguments pour afficher les valeurs actuelles.

Exemple :

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## Modèle d’autorisation

`/exec` n’est honoré que pour les **expéditeurs autorisés** (listes d’autorisation/appairage de canal plus `commands.useAccessGroups`).
Il met à jour **uniquement l’état de session** et n’écrit pas la configuration. Pour désactiver exec de manière stricte, refusez-le via la
politique d’outil (`tools.deny: ["exec"]` ou par agent). Les approbations d’hôte s’appliquent toujours sauf si vous définissez explicitement
`security=full` et `ask=off`.

## Approbations exec (application compagnon / hôte Node)

Les agents en bac à sable peuvent exiger une approbation par requête avant que `exec` ne s’exécute sur l’hôte Gateway ou Node.
Consultez [Approbations exec](/fr/tools/exec-approvals) pour la politique, la liste d’autorisation et le flux d’interface utilisateur.

Lorsque des approbations sont requises, l’outil exec renvoie immédiatement
`status: "approval-pending"` et un identifiant d’approbation. Une fois approuvée (ou refusée / expirée),
le Gateway émet des événements système (`Exec finished` / `Exec denied`). Si la commande est toujours
en cours d’exécution après `tools.exec.approvalRunningNoticeMs`, une seule notification `Exec running` est émise.
Sur les canaux disposant de cartes/boutons d’approbation natifs, l’agent doit s’appuyer d’abord sur cette
interface utilisateur native et n’inclure une commande `/approve` manuelle que lorsque le résultat de l’outil
indique explicitement que les approbations par chat sont indisponibles ou que l’approbation manuelle est le
seul chemin.

## Liste d’autorisation + binaires sûrs

L’application manuelle de la liste d’autorisation correspond aux globs de chemins de binaires résolus et aux globs
de noms de commande nus. Les noms nus ne correspondent qu’aux commandes invoquées via PATH, donc `rg` peut correspondre à
`/opt/homebrew/bin/rg` lorsque la commande est `rg`, mais pas à `./rg` ni à `/tmp/rg`.
Lorsque `security=allowlist`, les commandes shell ne sont automatiquement autorisées que si chaque segment de pipeline
figure dans la liste d’autorisation ou est un binaire sûr. Le chaînage (`;`, `&&`, `||`) et les redirections
sont rejetés en mode liste d’autorisation, sauf si chaque segment de premier niveau satisfait la
liste d’autorisation (y compris les binaires sûrs). Les redirections restent non prises en charge.
La confiance durable `allow-always` ne contourne pas cette règle : une commande chaînée nécessite toujours que chaque
segment de premier niveau corresponde.

`autoAllowSkills` est un chemin pratique distinct dans les approbations exec. Ce n’est pas la même chose que
les entrées manuelles de liste d’autorisation de chemins. Pour une confiance explicite stricte, gardez `autoAllowSkills` désactivé.

Utilisez les deux contrôles pour des tâches différentes :

- `tools.exec.safeBins` : petits filtres de flux uniquement sur stdin.
- `tools.exec.safeBinTrustedDirs` : répertoires approuvés explicites supplémentaires pour les chemins d’exécutables de binaires sûrs.
- `tools.exec.safeBinProfiles` : politique argv explicite pour les binaires sûrs personnalisés.
- liste d’autorisation : confiance explicite pour les chemins d’exécutables.

Ne traitez pas `safeBins` comme une liste d’autorisation générique et n’ajoutez pas de binaires d’interpréteur/d’environnement d’exécution (par exemple `python3`, `node`, `ruby`, `bash`). Si vous en avez besoin, utilisez des entrées explicites de liste d’autorisation et gardez les invites d’approbation activées.
`openclaw security audit` avertit lorsque des entrées `safeBins` d’interpréteur/d’environnement d’exécution n’ont pas de profils explicites, et `openclaw doctor --fix` peut échafauder les entrées personnalisées `safeBinProfiles` manquantes.
`openclaw security audit` et `openclaw doctor` avertissent aussi lorsque vous rajoutez explicitement des binaires au comportement large, tels que `jq`, dans `safeBins`.
Si vous autorisez explicitement des interpréteurs, activez `tools.exec.strictInlineEval` afin que les formes d’évaluation de code en ligne exigent toujours une nouvelle approbation.

Pour les détails complets de la politique et des exemples, consultez [Approbations Exec](/fr/tools/exec-approvals-advanced#safe-bins-stdin-only) et [Safe bins contre liste d’autorisation](/fr/tools/exec-approvals-advanced#safe-bins-versus-allowlist).

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

`apply_patch` est un sous-outil de `exec` pour les modifications structurées sur plusieurs fichiers.
Il est activé par défaut pour les modèles OpenAI et OpenAI Codex. Utilisez la configuration uniquement
lorsque vous voulez le désactiver ou le limiter à des modèles spécifiques :

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
- La politique des outils s’applique toujours ; `allow: ["write"]` autorise implicitement `apply_patch`.
- La configuration se trouve sous `tools.exec.applyPatch`.
- `tools.exec.applyPatch.enabled` vaut `true` par défaut ; définissez-le sur `false` pour désactiver l’outil pour les modèles OpenAI.
- `tools.exec.applyPatch.workspaceOnly` vaut `true` par défaut (contenu dans l’espace de travail). Définissez-le sur `false` uniquement si vous voulez intentionnellement que `apply_patch` écrive/supprime en dehors du répertoire de l’espace de travail.

## Connexe

- [Approbations Exec](/fr/tools/exec-approvals) — barrières d’approbation pour les commandes shell
- [Sandboxing](/fr/gateway/sandboxing) — exécution de commandes dans des environnements sandboxés
- [Processus en arrière-plan](/fr/gateway/background-process) — exec longue durée et outil process
- [Sécurité](/fr/gateway/security) — politique des outils et accès élevé
