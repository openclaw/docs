---
read_when:
    - Utilisation ou modification de l’outil exec
    - Débogage du comportement stdin ou TTY
summary: Utilisation de l’outil Exec, modes stdin et prise en charge TTY
title: Outil Exec
x-i18n:
    generated_at: "2026-04-25T13:58:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: 358f9155120382fa2b03b22e22408bdb9e51715f80c8b1701a1ff7fd05850188
    source_path: tools/exec.md
    workflow: 15
---

Exécute des commandes shell dans l’espace de travail. Prend en charge l’exécution au premier plan + en arrière-plan via `process`.
Si `process` est interdit, `exec` s’exécute de manière synchrone et ignore `yieldMs`/`background`.
Les sessions d’arrière-plan sont limitées à chaque agent ; `process` ne voit que les sessions du même agent.

## Paramètres

<ParamField path="command" type="string" required>
Commande shell à exécuter.
</ParamField>

<ParamField path="workdir" type="string" default="cwd">
Répertoire de travail de la commande.
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

<ParamField path="timeout" type="number" default="1800">
Tue la commande après ce nombre de secondes.
</ParamField>

<ParamField path="pty" type="boolean" default="false">
Exécute dans un pseudo-terminal lorsque disponible. À utiliser pour les CLI uniquement TTY, les agents de codage et les interfaces terminal.
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
Où exécuter. `auto` se résout en `sandbox` lorsqu’un runtime sandbox est actif, sinon en `gateway`.
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
Mode d’application pour l’exécution `gateway` / `node`.
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
Comportement de l’invite d’approbation pour l’exécution `gateway` / `node`.
</ParamField>

<ParamField path="node" type="string">
ID/nom du nœud lorsque `host=node`.
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
Demande le mode élevé — sort de la sandbox vers le chemin d’hôte configuré. `security=full` n’est forcé que lorsque elevated se résout en `full`.
</ParamField>

Remarques :

- `host` vaut par défaut `auto` : sandbox lorsqu’un runtime sandbox est actif pour la session, sinon gateway.
- `auto` est la stratégie de routage par défaut, pas un joker. `host=node` par appel est autorisé depuis `auto` ; `host=gateway` par appel n’est autorisé que lorsqu’aucun runtime sandbox n’est actif.
- Sans configuration supplémentaire, `host=auto` fonctionne quand même « simplement » : sans sandbox, il se résout en `gateway` ; avec une sandbox active, il reste dans la sandbox.
- `elevated` sort de la sandbox vers le chemin d’hôte configuré : `gateway` par défaut, ou `node` lorsque `tools.exec.host=node` (ou que la valeur par défaut de la session est `host=node`). Il n’est disponible que lorsque l’accès élevé est activé pour la session/le fournisseur actuel.
- Les approbations `gateway`/`node` sont contrôlées par `~/.openclaw/exec-approvals.json`.
- `node` nécessite un nœud appairé (application compagnon ou hôte de nœud headless).
- Si plusieurs nœuds sont disponibles, définissez `exec.node` ou `tools.exec.node` pour en sélectionner un.
- `exec host=node` est le seul chemin d’exécution shell pour les nœuds ; l’ancien wrapper `nodes.run` a été supprimé.
- Sur les hôtes non Windows, exec utilise `SHELL` lorsqu’il est défini ; si `SHELL` vaut `fish`, il préfère `bash` (ou `sh`)
  depuis `PATH` pour éviter les scripts incompatibles avec fish, puis revient à `SHELL` si aucun des deux n’existe.
- Sur les hôtes Windows, exec préfère la découverte de PowerShell 7 (`pwsh`) (Program Files, ProgramW6432, puis PATH),
  puis revient à Windows PowerShell 5.1.
- L’exécution hôte (`gateway`/`node`) rejette `env.PATH` et les remplacements de chargeur (`LD_*`/`DYLD_*`) afin
  d’empêcher le détournement de binaires ou l’injection de code.
- OpenClaw définit `OPENCLAW_SHELL=exec` dans l’environnement de la commande lancée (y compris l’exécution PTY et sandbox) afin que les règles shell/profil puissent détecter le contexte de l’outil exec.
- Important : le sandboxing est **désactivé par défaut**. Si le sandboxing est désactivé, `host=auto`
  implicite se résout en `gateway`. `host=sandbox` explicite échoue tout de même de façon sécurisée au lieu de
  s’exécuter silencieusement sur l’hôte gateway. Activez le sandboxing ou utilisez `host=gateway` avec approbations.
- Les vérifications préalables des scripts (pour les erreurs courantes de syntaxe shell Python/Node) n’inspectent que les fichiers à l’intérieur de la
  limite effective de `workdir`. Si un chemin de script se résout en dehors de `workdir`, la vérification préalable est ignorée pour
  ce fichier.
- Pour un travail de longue durée qui commence maintenant, démarrez-le une seule fois et appuyez-vous sur le
  réveil automatique à la fin lorsqu’il est activé et que la commande émet une sortie ou échoue.
  Utilisez `process` pour les journaux, l’état, l’entrée ou l’intervention ; n’émulez pas
  une planification avec des boucles de sommeil, des boucles de délai d’expiration ou des sondages répétés.
- Pour un travail qui doit se produire plus tard ou selon une planification, utilisez Cron au lieu de
  motifs `exec` avec sommeil/délai.

## Configuration

- `tools.exec.notifyOnExit` (par défaut : true) : lorsque true, les sessions exec passées en arrière-plan ajoutent un événement système à la file et demandent un Heartbeat à la fin.
- `tools.exec.approvalRunningNoticeMs` (par défaut : 10000) : émet un unique avis « running » lorsqu’un exec soumis à approbation dure plus longtemps que cela (0 désactive).
- `tools.exec.host` (par défaut : `auto` ; se résout en `sandbox` lorsqu’un runtime sandbox est actif, sinon en `gateway`)
- `tools.exec.security` (par défaut : `deny` pour sandbox, `full` pour gateway + node lorsqu’il n’est pas défini)
- `tools.exec.ask` (par défaut : `off`)
- L’exécution hôte sans approbation est la valeur par défaut pour gateway + node. Si vous voulez un comportement avec approbations/liste d’autorisation, resserrez à la fois `tools.exec.*` et la politique d’hôte `~/.openclaw/exec-approvals.json` ; consultez [Approbations Exec](/fr/tools/exec-approvals#no-approval-yolo-mode).
- Le mode YOLO vient des politiques hôte par défaut (`security=full`, `ask=off`), pas de `host=auto`. Si vous voulez forcer le routage gateway ou node, définissez `tools.exec.host` ou utilisez `/exec host=...`.
- En mode `security=full` plus `ask=off`, l’exécution hôte suit directement la politique configurée ; il n’y a pas de couche supplémentaire de préfiltrage heuristique d’obfuscation des commandes ni de rejet de vérification préalable des scripts.
- `tools.exec.node` (par défaut : non défini)
- `tools.exec.strictInlineEval` (par défaut : false) : lorsque true, les formes d’évaluation inline de l’interpréteur telles que `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e`, et `osascript -e` nécessitent toujours une approbation explicite. `allow-always` peut toujours persister des invocations bénignes d’interpréteur/script, mais les formes d’évaluation inline invitent quand même à chaque fois.
- `tools.exec.pathPrepend` : liste de répertoires à préfixer à `PATH` pour les exécutions exec (gateway + sandbox uniquement).
- `tools.exec.safeBins` : binaires sûrs stdin-only qui peuvent s’exécuter sans entrées explicites dans la liste d’autorisation. Pour les détails de comportement, consultez [Safe bins](/fr/tools/exec-approvals-advanced#safe-bins-stdin-only).
- `tools.exec.safeBinTrustedDirs` : répertoires explicites supplémentaires considérés de confiance pour les vérifications de chemin des exécutable de `safeBins`. Les entrées `PATH` ne sont jamais automatiquement considérées de confiance. Les valeurs intégrées par défaut sont `/bin` et `/usr/bin`.
- `tools.exec.safeBinProfiles` : politique argv personnalisée facultative par safe bin (`minPositional`, `maxPositional`, `allowedValueFlags`, `deniedFlags`).

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

- `host=gateway` : fusionne votre `PATH` de shell de connexion dans l’environnement exec. Les remplacements `env.PATH` sont
  rejetés pour l’exécution hôte. Le démon lui-même continue de s’exécuter avec un `PATH` minimal :
  - macOS : `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux : `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox` : exécute `sh -lc` (shell de connexion) dans le conteneur, de sorte que `/etc/profile` peut réinitialiser `PATH`.
  OpenClaw préfixe `env.PATH` après le chargement du profil via une variable d’environnement interne (sans interpolation shell) ;
  `tools.exec.pathPrepend` s’applique également ici.
- `host=node` : seuls les remplacements d’environnement non bloqués que vous transmettez sont envoyés au nœud. Les remplacements `env.PATH` sont
  rejetés pour l’exécution hôte et ignorés par les hôtes de nœud. Si vous avez besoin d’entrées PATH supplémentaires sur un nœud,
  configurez l’environnement du service d’hébergement du nœud (systemd/launchd) ou installez les outils dans des emplacements standard.

Liaison de nœud par agent (utilisez l’index de la liste d’agents dans la config) :

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Control UI : l’onglet Nodes inclut un petit panneau « Exec node binding » pour les mêmes paramètres.

## Remplacements de session (`/exec`)

Utilisez `/exec` pour définir les valeurs par défaut **par session** de `host`, `security`, `ask`, et `node`.
Envoyez `/exec` sans argument pour afficher les valeurs actuelles.

Exemple :

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## Modèle d’autorisation

`/exec` n’est pris en compte que pour les **expéditeurs autorisés** (listes d’autorisation de canal/appairage plus `commands.useAccessGroups`).
Il met à jour **uniquement l’état de session** et n’écrit pas dans la config. Pour désactiver exec de façon stricte, refusez-le via la
politique d’outil (`tools.deny: ["exec"]` ou par agent). Les approbations hôte continuent de s’appliquer sauf si vous définissez explicitement
`security=full` et `ask=off`.

## Approbations Exec (application compagnon / hôte de nœud)

Les agents sandboxés peuvent exiger une approbation par requête avant que `exec` ne s’exécute sur l’hôte gateway ou node.
Consultez [Approbations Exec](/fr/tools/exec-approvals) pour la politique, la liste d’autorisation et le flux d’interface.

Lorsque des approbations sont requises, l’outil exec renvoie immédiatement avec
`status: "approval-pending"` et un id d’approbation. Une fois approuvée (ou refusée / expirée),
la Gateway émet des événements système (`Exec finished` / `Exec denied`). Si la commande est encore
en cours d’exécution après `tools.exec.approvalRunningNoticeMs`, un unique avis `Exec running` est émis.
Sur les canaux avec cartes/boutons d’approbation natifs, l’agent doit s’appuyer d’abord sur cette
interface native et n’inclure une commande manuelle `/approve` que lorsque le
résultat de l’outil indique explicitement que les approbations par chat ne sont pas disponibles ou que l’approbation manuelle est le
seul chemin.

## Liste d’autorisation + safe bins

L’application manuelle de la liste d’autorisation correspond aux globs de chemin binaire résolu et aux globs de nom de commande nu.
Les noms nus ne correspondent qu’aux commandes invoquées via PATH, donc `rg` peut correspondre à
`/opt/homebrew/bin/rg` lorsque la commande est `rg`, mais pas à `./rg` ni `/tmp/rg`.
Lorsque `security=allowlist`, les commandes shell sont automatiquement autorisées uniquement si chaque segment
de pipeline figure dans la liste d’autorisation ou est un safe bin. Le chaînage (`;`, `&&`, `||`) et les redirections
sont rejetés en mode liste d’autorisation sauf si chaque segment de niveau supérieur satisfait la
liste d’autorisation (y compris les safe bins). Les redirections restent non prises en charge.
La confiance durable `allow-always` ne contourne pas cette règle : une commande chaînée exige toujours que chaque
segment de niveau supérieur corresponde.

`autoAllowSkills` est un chemin de confort distinct dans les approbations exec. Ce n’est pas la même chose que
les entrées manuelles de liste d’autorisation par chemin. Pour une confiance stricte explicite, laissez `autoAllowSkills` désactivé.

Utilisez les deux contrôles pour des tâches différentes :

- `tools.exec.safeBins` : petits filtres de flux stdin-only.
- `tools.exec.safeBinTrustedDirs` : répertoires supplémentaires explicites de confiance pour les chemins d’exécutables safe-bin.
- `tools.exec.safeBinProfiles` : politique argv explicite pour les safe bins personnalisés.
- liste d’autorisation : confiance explicite pour les chemins d’exécutables.

Ne considérez pas `safeBins` comme une liste d’autorisation générique, et n’ajoutez pas de binaires d’interpréteur/runtime (par exemple `python3`, `node`, `ruby`, `bash`). Si vous en avez besoin, utilisez des entrées explicites de liste d’autorisation et laissez les invites d’approbation activées.
`openclaw security audit` avertit lorsque des entrées `safeBins` d’interpréteur/runtime n’ont pas de profils explicites, et `openclaw doctor --fix` peut générer les entrées `safeBinProfiles` personnalisées manquantes.
`openclaw security audit` et `openclaw doctor` avertissent aussi lorsque vous ajoutez explicitement de nouveau des binaires à comportement large comme `jq` dans `safeBins`.
Si vous ajoutez explicitement des interpréteurs à la liste d’autorisation, activez `tools.exec.strictInlineEval` afin que les formes d’évaluation inline du code exigent quand même une nouvelle approbation.

Pour tous les détails de politique et des exemples, consultez [Approbations Exec](/fr/tools/exec-approvals-advanced#safe-bins-stdin-only) et [Safe bins versus allowlist](/fr/tools/exec-approvals-advanced#safe-bins-versus-allowlist).

## Exemples

Premier plan :

```json
{ "tool": "exec", "command": "ls -la" }
```

Arrière-plan + sondage :

```json
{"tool":"exec","command":"npm run build","yieldMs":1000}
{"tool":"process","action":"poll","sessionId":"<id>"}
```

Le sondage sert à obtenir un état à la demande, pas à faire des boucles d’attente. Si le réveil automatique à la fin
est activé, la commande peut réveiller la session lorsqu’elle émet une sortie ou échoue.

Envoi de touches (style tmux) :

```json
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Enter"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["C-c"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Up","Up","Enter"]}
```

Soumettre (envoi de CR uniquement) :

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

Coller (avec délimitation par défaut) :

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` est un sous-outil de `exec` pour les modifications structurées multi-fichiers.
Il est activé par défaut pour les modèles OpenAI et OpenAI Codex. Utilisez la configuration seulement
si vous voulez le désactiver ou le restreindre à des modèles spécifiques :

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
- La politique d’outil continue de s’appliquer ; `allow: ["write"]` autorise implicitement `apply_patch`.
- La configuration se trouve sous `tools.exec.applyPatch`.
- `tools.exec.applyPatch.enabled` vaut `true` par défaut ; définissez-le à `false` pour désactiver l’outil pour les modèles OpenAI.
- `tools.exec.applyPatch.workspaceOnly` vaut `true` par défaut (contenu dans l’espace de travail). Définissez-le à `false` uniquement si vous souhaitez intentionnellement que `apply_patch` écrive/supprime en dehors du répertoire de l’espace de travail.

## Liens connexes

- [Approbations Exec](/fr/tools/exec-approvals) — barrières d’approbation pour les commandes shell
- [Sandboxing](/fr/gateway/sandboxing) — exécution de commandes dans des environnements sandboxés
- [Processus d’arrière-plan](/fr/gateway/background-process) — exec de longue durée et outil process
- [Sécurité](/fr/gateway/security) — politique d’outil et accès élevé
