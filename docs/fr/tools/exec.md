---
read_when:
    - Utilisation ou modification de l’outil exec
    - Débogage du comportement de stdin ou du TTY
summary: Utilisation de l’outil Exec, modes stdin et prise en charge du TTY
title: Outil d’exécution
x-i18n:
    generated_at: "2026-04-30T07:51:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7949cfde9f141202a3bc36c2be72ecdf6d43305b5f16fb02835a69bcaa46067b
    source_path: tools/exec.md
    workflow: 16
---

Exécuter des commandes shell dans l’espace de travail. Prend en charge l’exécution au premier plan et en arrière-plan via `process`.
Si `process` est interdit, `exec` s’exécute de façon synchrone et ignore `yieldMs`/`background`.
Les sessions en arrière-plan sont limitées à chaque agent ; `process` ne voit que les sessions du même agent.

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
Placer automatiquement la commande en arrière-plan après ce délai (ms).
</ParamField>

<ParamField path="background" type="boolean" default="false">
Placer immédiatement la commande en arrière-plan au lieu d’attendre `yieldMs`.
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSec">
Remplacer le délai d’expiration exec configuré pour cet appel. Définissez `timeout: 0` uniquement lorsque la commande doit s’exécuter sans délai d’expiration du processus exec.
</ParamField>

<ParamField path="pty" type="boolean" default="false">
Exécuter dans un pseudo-terminal lorsqu’il est disponible. À utiliser pour les CLI réservées aux TTY, les agents de code et les interfaces utilisateur de terminal.
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
Où exécuter. `auto` se résout en `sandbox` lorsqu’un runtime de sandbox est actif, et en `gateway` sinon.
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
Mode d’application pour l’exécution `gateway` / `node`.
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
Comportement de la demande d’approbation pour l’exécution `gateway` / `node`.
</ParamField>

<ParamField path="node" type="string">
ID/nom du Node lorsque `host=node`.
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
Demander le mode élevé — sortir de la sandbox vers le chemin d’hôte configuré. `security=full` n’est forcé que lorsque elevated se résout en `full`.
</ParamField>

Notes :

- `host` vaut par défaut `auto` : sandbox lorsque le runtime de sandbox est actif pour la session, sinon gateway.
- `host` n’accepte que `auto`, `sandbox`, `gateway` ou `node`. Ce n’est pas un sélecteur de nom d’hôte ; les valeurs ressemblant à des noms d’hôte sont rejetées avant l’exécution de la commande.
- `auto` est la stratégie de routage par défaut, pas un joker. `host=node` par appel est autorisé depuis `auto` ; `host=gateway` par appel n’est autorisé que lorsqu’aucun runtime de sandbox n’est actif.
- Sans configuration supplémentaire, `host=auto` fonctionne toujours simplement : sans sandbox, il se résout en `gateway` ; avec une sandbox active, il reste dans la sandbox.
- `elevated` sort de la sandbox vers le chemin d’hôte configuré : `gateway` par défaut, ou `node` lorsque `tools.exec.host=node` (ou que la valeur par défaut de la session est `host=node`). Il n’est disponible que lorsque l’accès élevé est activé pour la session/le fournisseur actuel.
- Les approbations `gateway`/`node` sont contrôlées par `~/.openclaw/exec-approvals.json`.
- `node` nécessite un Node appairé (application compagnon ou hôte Node sans interface).
- Si plusieurs Nodes sont disponibles, définissez `exec.node` ou `tools.exec.node` pour en sélectionner un.
- `exec host=node` est le seul chemin d’exécution shell pour les Nodes ; l’ancien wrapper `nodes.run` a été supprimé.
- `timeout` s’applique à l’exécution au premier plan, en arrière-plan, avec `yieldMs`, Gateway, sandbox et Node `system.run`. S’il est omis, OpenClaw utilise `tools.exec.timeoutSec` ; `timeout: 0` explicite désactive le délai d’expiration du processus exec pour cet appel.
- Sur les hôtes non Windows, exec utilise `SHELL` lorsqu’il est défini ; si `SHELL` vaut `fish`, il préfère `bash` (ou `sh`)
  depuis `PATH` afin d’éviter les scripts incompatibles avec fish, puis revient à `SHELL` si aucun des deux n’existe.
- Sur les hôtes Windows, exec privilégie la découverte de PowerShell 7 (`pwsh`) (Program Files, ProgramW6432, puis PATH),
  puis revient à Windows PowerShell 5.1.
- L’exécution hôte (`gateway`/`node`) rejette `env.PATH` et les remplacements de chargeur (`LD_*`/`DYLD_*`) afin
  d’empêcher le détournement de binaires ou l’injection de code.
- OpenClaw définit `OPENCLAW_SHELL=exec` dans l’environnement de la commande lancée (y compris l’exécution PTY et sandbox) afin que les règles de shell/profil puissent détecter le contexte de l’outil exec.
- `openclaw channels login` est bloqué depuis `exec`, car il s’agit d’un flux interactif d’authentification de canal ; exécutez-le dans un terminal sur l’hôte Gateway, ou utilisez l’outil de connexion natif du canal depuis le chat lorsqu’il existe.
- Important : la sandbox est **désactivée par défaut**. Si la sandbox est désactivée, `host=auto` implicite
  se résout en `gateway`. `host=sandbox` explicite échoue toujours fermé au lieu de s’exécuter silencieusement
  sur l’hôte Gateway. Activez la sandbox ou utilisez `host=gateway` avec approbations.
- Les vérifications préalables de scripts (pour les erreurs courantes de syntaxe shell Python/Node) n’inspectent que les fichiers à l’intérieur de la
  limite effective de `workdir`. Si un chemin de script se résout en dehors de `workdir`, la vérification préalable est ignorée pour
  ce fichier.
- Pour un travail de longue durée qui démarre maintenant, lancez-le une seule fois et fiez-vous au réveil de
  complétion automatique lorsqu’il est activé et que la commande émet une sortie ou échoue.
  Utilisez `process` pour les journaux, le statut, l’entrée ou l’intervention ; n’émulez pas
  la planification avec des boucles de sommeil, des boucles de timeout ou des interrogations répétées.
- Pour un travail qui doit se produire plus tard ou selon un calendrier, utilisez Cron au lieu des
  modèles de sommeil/délai `exec`.

## Configuration

- `tools.exec.notifyOnExit` (par défaut : true) : lorsque true, les sessions exec placées en arrière-plan mettent en file d’attente un événement système et demandent un Heartbeat à la sortie.
- `tools.exec.approvalRunningNoticeMs` (par défaut : 10000) : émettre une seule notification « running » lorsqu’un exec soumis à approbation s’exécute plus longtemps que cette durée (0 désactive).
- `tools.exec.timeoutSec` (par défaut : 1800) : délai d’expiration exec par défaut, par commande, en secondes. `timeout` par appel le remplace ; `timeout: 0` par appel désactive le délai d’expiration du processus exec.
- `tools.exec.host` (par défaut : `auto` ; se résout en `sandbox` lorsqu’un runtime de sandbox est actif, sinon en `gateway`)
- `tools.exec.security` (par défaut : `deny` pour sandbox, `full` pour Gateway + Node lorsque non défini)
- `tools.exec.ask` (par défaut : `off`)
- L’exécution hôte sans approbation est la valeur par défaut pour Gateway + Node. Si vous voulez un comportement avec approbations/liste d’autorisation, renforcez à la fois `tools.exec.*` et le fichier hôte `~/.openclaw/exec-approvals.json` ; voir [Approbations exec](/fr/tools/exec-approvals#no-approval-yolo-mode).
- YOLO vient des valeurs par défaut de la politique hôte (`security=full`, `ask=off`), pas de `host=auto`. Si vous voulez forcer le routage Gateway ou Node, définissez `tools.exec.host` ou utilisez `/exec host=...`.
- En mode `security=full` plus `ask=off`, l’exécution hôte suit directement la politique configurée ; il n’y a pas de couche heuristique supplémentaire de préfiltrage d’obfuscation des commandes ni de rejet par vérification préalable des scripts.
- `tools.exec.node` (par défaut : non défini)
- `tools.exec.strictInlineEval` (par défaut : false) : lorsque true, les formes d’évaluation inline d’interpréteur telles que `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e` et `osascript -e` nécessitent toujours une approbation explicite. `allow-always` peut toujours conserver des invocations bénignes d’interpréteur/script, mais les formes inline-eval demandent toujours une confirmation à chaque fois.
- `tools.exec.pathPrepend` : liste de répertoires à ajouter au début de `PATH` pour les exécutions exec (Gateway + sandbox uniquement).
- `tools.exec.safeBins` : binaires sûrs uniquement via stdin qui peuvent s’exécuter sans entrées de liste d’autorisation explicites. Pour les détails de comportement, voir [Binaires sûrs](/fr/tools/exec-approvals-advanced#safe-bins-stdin-only).
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
  rejetés pour l’exécution hôte. Le daemon lui-même s’exécute toujours avec un `PATH` minimal :
  - macOS : `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux : `/usr/local/bin`, `/usr/bin`, `/bin`
- `host=sandbox` : exécute `sh -lc` (shell de connexion) dans le conteneur, donc `/etc/profile` peut réinitialiser `PATH`.
  OpenClaw ajoute `env.PATH` au début après le chargement du profil via une variable d’environnement interne (sans interpolation shell) ;
  `tools.exec.pathPrepend` s’applique ici aussi.
- `host=node` : seuls les remplacements d’environnement non bloqués que vous transmettez sont envoyés au Node. Les remplacements `env.PATH` sont
  rejetés pour l’exécution hôte et ignorés par les hôtes Node. Si vous avez besoin d’entrées PATH supplémentaires sur un Node,
  configurez l’environnement du service hôte Node (systemd/launchd) ou installez les outils dans des emplacements standards.

Liaison Node par agent (utilisez l’index de la liste des agents dans la configuration) :

```bash
openclaw config get agents.list
openclaw config set agents.list[0].tools.exec.node "node-id-or-name"
```

Interface utilisateur de contrôle : l’onglet Nodes inclut un petit panneau « Exec node binding » pour les mêmes paramètres.

## Remplacements de session (`/exec`)

Utilisez `/exec` pour définir les valeurs par défaut **par session** de `host`, `security`, `ask` et `node`.
Envoyez `/exec` sans arguments pour afficher les valeurs actuelles.

Exemple :

```
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

## Modèle d’autorisation

`/exec` n’est honoré que pour les **expéditeurs autorisés** (listes d’autorisation/appairage des canaux plus `commands.useAccessGroups`).
Il met à jour **uniquement l’état de session** et n’écrit pas la configuration. Pour désactiver strictement exec, refusez-le via la politique
d’outil (`tools.deny: ["exec"]` ou par agent). Les approbations hôte s’appliquent toujours, sauf si vous définissez explicitement
`security=full` et `ask=off`.

## Approbations exec (application compagnon / hôte Node)

Les agents sandboxés peuvent exiger une approbation par demande avant que `exec` ne s’exécute sur l’hôte Gateway ou Node.
Voir [Approbations exec](/fr/tools/exec-approvals) pour la politique, la liste d’autorisation et le flux d’interface utilisateur.

Lorsque des approbations sont requises, l’outil exec retourne immédiatement
`status: "approval-pending"` et un ID d’approbation. Une fois approuvée (ou refusée / expirée),
la Gateway émet des événements système (`Exec finished` / `Exec denied`). Si la commande est toujours
en cours d’exécution après `tools.exec.approvalRunningNoticeMs`, une seule notification `Exec running` est émise.
Sur les canaux avec cartes/boutons d’approbation natifs, l’agent doit d’abord s’appuyer sur cette
interface utilisateur native et n’inclure une commande `/approve` manuelle que lorsque le
résultat de l’outil indique explicitement que les approbations par chat sont indisponibles ou que l’approbation manuelle est la
seule voie.

## Liste d’autorisation + binaires sûrs

L’application manuelle de la liste d’autorisation fait correspondre les globs de chemins binaires résolus et les globs de noms de commande
nus. Les noms nus ne correspondent qu’aux commandes invoquées via PATH, donc `rg` peut correspondre à
`/opt/homebrew/bin/rg` lorsque la commande est `rg`, mais pas à `./rg` ni à `/tmp/rg`.
Lorsque `security=allowlist`, les commandes shell sont automatiquement autorisées uniquement si chaque segment de pipeline
est dans la liste d’autorisation ou est un binaire sûr. Le chaînage (`;`, `&&`, `||`) et les redirections
sont rejetés en mode liste d’autorisation sauf si chaque segment de niveau supérieur satisfait à la
liste d’autorisation (y compris les binaires sûrs). Les redirections restent non prises en charge.
La confiance durable `allow-always` ne contourne pas cette règle : une commande chaînée exige toujours que chaque
segment de niveau supérieur corresponde.

`autoAllowSkills` est un chemin de commodité distinct dans les approbations exec. Ce n’est pas la même chose que
les entrées manuelles de liste d’autorisation par chemin. Pour une confiance strictement explicite, laissez `autoAllowSkills` désactivé.

Utilisez les deux contrôles pour des tâches différentes :

- `tools.exec.safeBins` : petits filtres de flux uniquement via stdin.
- `tools.exec.safeBinTrustedDirs` : répertoires approuvés explicites supplémentaires pour les chemins d’exécutables de binaires sûrs.
- `tools.exec.safeBinProfiles` : politique argv explicite pour les binaires sûrs personnalisés.
- liste d’autorisation : confiance explicite pour les chemins d’exécutables.

Ne traitez pas `safeBins` comme une liste d’autorisation générique, et n’ajoutez pas de binaires d’interpréteur/d’exécution (par exemple `python3`, `node`, `ruby`, `bash`). Si vous en avez besoin, utilisez des entrées explicites de liste d’autorisation et gardez les invites d’approbation activées.
`openclaw security audit` avertit lorsque des entrées `safeBins` d’interpréteur/d’exécution n’ont pas de profils explicites, et `openclaw doctor --fix` peut générer la structure des entrées `safeBinProfiles` personnalisées manquantes.
`openclaw security audit` et `openclaw doctor` avertissent aussi lorsque vous ajoutez explicitement des binaires au comportement étendu comme `jq` dans `safeBins`.
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

Soumettre (envoyer seulement CR) :

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

Coller (entre crochets par défaut) :

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` est un sous-outil de `exec` pour les modifications multi-fichiers structurées.
Il est activé par défaut pour les modèles OpenAI et OpenAI Codex. Utilisez la configuration uniquement
lorsque vous souhaitez le désactiver ou le restreindre à des modèles spécifiques :

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
- La politique d’outils s’applique toujours ; `allow: ["write"]` autorise implicitement `apply_patch`.
- La configuration se trouve sous `tools.exec.applyPatch`.
- `tools.exec.applyPatch.enabled` vaut `true` par défaut ; définissez-le sur `false` pour désactiver l’outil pour les modèles OpenAI.
- `tools.exec.applyPatch.workspaceOnly` vaut `true` par défaut (limité à l’espace de travail). Définissez-le sur `false` uniquement si vous voulez intentionnellement que `apply_patch` écrive/supprime en dehors du répertoire de l’espace de travail.

## Connexe

- [Approbations Exec](/fr/tools/exec-approvals) — barrières d’approbation pour les commandes shell
- [Sandboxing](/fr/gateway/sandboxing) — exécution de commandes dans des environnements sandboxés
- [Processus en arrière-plan](/fr/gateway/background-process) — outils exec et process de longue durée
- [Sécurité](/fr/gateway/security) — politique d’outils et accès élevé
