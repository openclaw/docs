---
read_when:
    - Utilisation ou modification de l’outil exec
    - Débogage du comportement de stdin ou du TTY
summary: Utilisation de l’outil exec, modes stdin et prise en charge du TTY
title: Outil d’exécution
x-i18n:
    generated_at: "2026-07-12T16:02:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: b8d7c3fcaa670851635cbd029d73f529a50be8c8c4df69565a1f96ea28757d04
    source_path: tools/exec.md
    workflow: 16
---

Exécute des commandes shell dans l’espace de travail. `exec` est une interface shell permettant les modifications : les commandes peuvent créer, modifier ou supprimer des fichiers partout où le système de fichiers de l’hôte ou du bac à sable sélectionné le permet. La désactivation des outils de système de fichiers OpenClaw tels que `write`, `edit` ou `apply_patch` ne rend pas `exec` accessible en lecture seule.

Prend en charge l’exécution au premier plan et en arrière-plan via `process`. Si `process` n’est pas autorisé, `exec` s’exécute de manière synchrone et ignore `yieldMs`/`background`. Les sessions en arrière-plan sont propres à chaque agent ; `process` ne voit que les sessions du même agent.

## Paramètres

<ParamField path="command" type="string" required>
Commande shell à exécuter.
</ParamField>

<ParamField path="workdir" type="string" default="cwd">
Répertoire de travail de la commande.
</ParamField>

<ParamField path="env" type="object">
Remplacements de variables d’environnement sous forme de paires clé/valeur, fusionnés avec l’environnement hérité.
</ParamField>

<ParamField path="yieldMs" type="number" default="10000">
Place automatiquement la commande en arrière-plan après ce délai (ms).
</ParamField>

<ParamField path="background" type="boolean" default="false">
Place immédiatement la commande en arrière-plan au lieu d’attendre `yieldMs`.
</ParamField>

<ParamField path="timeout" type="number" default="tools.exec.timeoutSec">
Remplace le délai d’expiration d’exécution configuré pour cet appel, en secondes. S’applique aux exécutions au premier plan, en arrière-plan, avec `yieldMs`, via le Gateway, dans le bac à sable et via `system.run` du Node. `timeout: 0` désactive le délai d’expiration du processus d’exécution pour cet appel.
</ParamField>

<ParamField path="pty" type="boolean" default="false">
Exécute dans un pseudo-terminal lorsqu’il est disponible. À utiliser pour les CLI réservées aux TTY, les agents de codage et les interfaces utilisateur de terminal.
</ParamField>

<ParamField path="host" type="'auto' | 'sandbox' | 'gateway' | 'node'" default="auto">
Emplacement d’exécution. `auto` est résolu en `sandbox` lorsqu’un environnement d’exécution de bac à sable est actif, et en `gateway` dans le cas contraire.
</ParamField>

<ParamField path="security" type="'deny' | 'allowlist' | 'full'">
Ignoré pour les appels d’outils normaux. La sécurité de `gateway`/`node` est contrôlée par `tools.exec.security` et le fichier d’approbations de l’hôte ; le mode élevé ne peut imposer `security=full` que lorsque l’opérateur accorde explicitement un accès élevé.
</ParamField>

<ParamField path="ask" type="'off' | 'on-miss' | 'always'">
Le mode de demande de référence provient de `tools.exec.ask` et des approbations de l’hôte. Pour les appels de modèle provenant d’un canal, la valeur `ask` propre à l’appel est ignorée lorsque la demande effective de l’hôte est `off` ; sinon, elle peut uniquement imposer un mode plus strict. Les appelants internes/de l’API approuvés qui construisent des outils d’exécution avec une valeur `ask` explicite restent inchangés.
</ParamField>

<ParamField path="node" type="string">
Identifiant/nom du Node lorsque `host=node`.
</ParamField>

<ParamField path="elevated" type="boolean" default="false">
Demande le mode élevé : sort de la sandbox pour accéder au chemin d’hôte configuré. `security=full` est imposé uniquement lorsque le mode élevé est résolu sur `full`.
</ParamField>

Remarques :

- `host` accepte uniquement `auto`, `sandbox`, `gateway` ou `node`. Ce n’est pas un sélecteur de nom d’hôte ; les valeurs qui ressemblent à des noms d’hôte sont rejetées avant l’exécution de la commande.
- L’utilisation de `host=node` pour un appel est autorisée depuis `auto` ; l’utilisation de `host=gateway` pour un appel n’est autorisée que lorsqu’aucun environnement d’exécution sandbox n’est actif.
- Sans configuration supplémentaire, `host=auto` « fonctionne tout simplement » : en l’absence de sandbox, il se résout en `gateway` ; si une sandbox est active, il reste dans la sandbox.
- `elevated` permet de sortir de la sandbox pour utiliser le chemin d’hôte configuré : `gateway` par défaut, ou `node` lorsque `tools.exec.host=node` (ou que la valeur par défaut de la session est `host=node`). Cette option n’est disponible que lorsque l’accès élevé est activé pour la session ou le fournisseur actuel.
- Les approbations de `gateway`/`node` sont contrôlées par le fichier d’approbations de l’hôte.
- `node` nécessite un Node appairé (application compagnon ou hôte Node sans interface graphique). Si plusieurs Nodes sont disponibles, définissez `exec.node` ou `tools.exec.node` pour en sélectionner un.
- `exec host=node` est le seul chemin d’exécution de commandes shell pour les Nodes ; l’ancien wrapper `nodes.run` a été supprimé.
- Sur les hôtes autres que Windows, l’exécution utilise `SHELL` lorsqu’il est défini ; si `SHELL` vaut `fish`, elle privilégie `bash` (ou `sh`) depuis `PATH` afin d’éviter les constructions propres à bash incompatibles avec fish, puis se rabat sur `SHELL` si aucun des deux n’existe.
- Sur les hôtes Windows, l’exécution privilégie la détection de PowerShell 7 (`pwsh`) (Program Files, ProgramW6432, puis PATH), puis se rabat sur Windows PowerShell 5.1.
- Sur les hôtes Gateway autres que Windows, les commandes d’exécution bash et zsh utilisent un instantané de démarrage. OpenClaw capture les alias et fonctions pouvant être chargés ainsi qu’un petit ensemble sûr de variables d’environnement depuis les fichiers de démarrage du shell dans `$OPENCLAW_STATE_DIR/cache/shell-snapshots/`, puis charge cet instantané avant chaque commande d’exécution. Les variables dont le nom semble indiquer un secret sont exclues ; les exécutions dans le bac à sable et sur un Node n’utilisent pas cet instantané. Définissez `OPENCLAW_EXEC_SHELL_SNAPSHOT=0` dans l’environnement du processus Gateway pour désactiver ce chemin d’instantané.
- L’exécution sur l’hôte (`gateway`/`node`) rejette `env.PATH` et les substitutions du chargeur (`LD_*`/`DYLD_*`) afin d’empêcher le détournement de binaires ou l’injection de code.
- OpenClaw définit `OPENCLAW_SHELL=exec` dans l’environnement de la commande lancée (y compris pour l’exécution dans un PTY et dans un bac à sable), afin que les règles de shell/profil puissent détecter le contexte de l’outil exec.
- Pour les exécutions provenant d’un canal, OpenClaw expose également dans `OPENCLAW_CHANNEL_CONTEXT` une charge utile JSON restreinte contenant l’identité de l’expéditeur et de la discussion, lorsque le canal a fourni ces identifiants.
- `exec` ne peut pas exécuter les commandes shell `openclaw channels login` ou `/approve` : `openclaw channels login` est un flux interactif d’authentification de canal, et `/approve` doit passer par le gestionnaire de commandes d’approbation, et non par un shell. Exécutez la connexion au canal dans un terminal sur l’hôte du Gateway, ou utilisez un outil d’agent de connexion propre au canal lorsqu’il en existe un (par exemple `whatsapp_login`).
- Important : l’exécution en bac à sable est **désactivée par défaut**. Si elle est désactivée, la valeur implicite `host=auto` est résolue en `gateway`. La valeur explicite `host=sandbox` échoue toujours de manière sécurisée au lieu d’exécuter silencieusement la commande sur l’hôte du Gateway. Activez l’exécution en bac à sable ou utilisez `host=gateway` avec des approbations.
- Les vérifications préalables des scripts (pour les erreurs courantes de syntaxe shell Python/Node) inspectent uniquement les fichiers situés dans les limites du `workdir` effectif. Si le chemin d’un script est résolu en dehors de `workdir`, la vérification préalable est ignorée pour ce fichier. Elle est également entièrement ignorée lorsque `host=gateway` et que la politique effective est `security=full` avec `ask=off`.
- Pour un travail de longue durée qui commence maintenant, lancez-le une seule fois et fiez-vous au réveil automatique à la fin lorsqu’il est activé et que la commande produit une sortie ou échoue. Utilisez `process` pour les journaux, l’état, les entrées ou les interventions ; n’émulez pas une planification avec des boucles de mise en veille, des boucles de délai d’expiration ou des interrogations répétées.
- Pour un travail qui doit avoir lieu ultérieurement ou selon une planification, utilisez Cron plutôt que des modèles de mise en veille ou de temporisation avec `exec`.

## Configuration

| Clé                                  | Valeur par défaut                                     | Remarques                                                                                                                                                               |
| ------------------------------------ | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tools.exec.timeoutSec`              | `1800`                                                 | Délai d’expiration par défaut de chaque commande exec, en secondes. La valeur `timeout` de l’appel le remplace ; `timeout: 0` au niveau de l’appel désactive le délai d’expiration du processus exec. |
| `tools.exec.host`                    | `auto`                                                 | Se résout en `sandbox` lorsqu’un environnement d’exécution sandbox est actif, sinon en `gateway`.                                                                       |
| `tools.exec.security`                | `deny` pour sandbox, `full` pour gateway/node si non défini |                                                                                                                                                                     |
| `tools.exec.ask`                     | `off`                                                  |                                                                                                                                                                         |
| `tools.exec.mode`                    | non défini                                             | Paramètre de stratégie normalisé. Consultez [Modes](#modes) ci-dessous. Ne peut pas être combiné avec `tools.exec.security`/`tools.exec.ask`.                             |
| `tools.exec.reviewer.model`          | modèle principal configuré de l’agent                  | Remplacement facultatif du fournisseur/modèle pour la révision avec `mode=auto`.                                                                                         |
| `tools.exec.reviewer.timeoutMs`      | `30000`                                                | Délai d’expiration par étape pour la préparation et l’exécution du modèle de révision avant le recours à un humain.                                                      |
| `tools.exec.node`                    | non défini                                             |                                                                                                                                                                         |
| `tools.exec.notifyOnExit`            | `true`                                                 | Lorsque cette option est vraie, les sessions exec exécutées en arrière-plan mettent en file d’attente un événement système et demandent un Heartbeat à leur arrêt.       |
| `tools.exec.approvalRunningNoticeMs` | `10000`                                                | Émet une seule notification « en cours d’exécution » lorsqu’une commande exec soumise à approbation s’exécute au-delà de cette durée (`0` désactive cette notification). |
| `tools.exec.strictInlineEval`        | `false`                                                | Consultez [Évaluation en ligne](#inline-eval-strictinlineeval).                                                                                                          |
| `tools.exec.commandHighlighting`     | `false`                                                | Lorsque cette option est vraie, les demandes d’approbation peuvent mettre en évidence dans le texte de la commande les segments déduits par l’analyseur. À définir globalement ou par agent ; ne modifie pas la stratégie d’approbation. |
| `tools.exec.pathPrepend`             | non défini                                             | Liste des répertoires à ajouter au début de `PATH` pour les exécutions exec (gateway + sandbox uniquement).                                                              |
| `tools.exec.safeBins`                | non défini                                             | Binaires sûrs acceptant uniquement stdin, qui peuvent s’exécuter sans entrée explicite dans la liste d’autorisation. Consultez [Binaires sûrs](/fr/tools/exec-approvals-advanced#safe-bins-stdin-only). |
| `tools.exec.safeBinTrustedDirs`      | `/bin`, `/usr/bin`                                     | Répertoires explicites supplémentaires approuvés pour les vérifications de chemin de `safeBins`. Les entrées de `PATH` ne sont jamais approuvées automatiquement.        |
| `tools.exec.safeBinProfiles`         | non défini                                             | Stratégie argv personnalisée facultative par binaire sûr (`minPositional`, `maxPositional`, `allowedValueFlags`, `deniedFlags`).                                         |

L’exécution exec sur l’hôte sans approbation est le comportement par défaut pour gateway et node (`security=full`, `ask=off`) — cela provient des valeurs par défaut de la stratégie de l’hôte, et non de `host=auto`. Si vous souhaitez un comportement fondé sur les approbations ou une liste d’autorisation, renforcez à la fois `tools.exec.*` et le fichier d’approbations de l’hôte ; consultez [Approbations exec](/fr/tools/exec-approvals#yolo-mode-no-approval). Pour imposer le routage vers gateway ou node quel que soit l’état de la sandbox, définissez `tools.exec.host` ou utilisez `/exec host=...`.

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

### Modes

`tools.exec.mode` est le paramètre de stratégie normalisé. Le définir permet de déduire `security`/`ask` et il ne peut pas être combiné avec des valeurs explicites pour `tools.exec.security`/`tools.exec.ask`.

| Mode        | security    | ask       | Comportement                                                                                                                                        |
| ----------- | ----------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `deny`      | `deny`      | `off`     | L’exécution est refusée.                                                                                                                            |
| `allowlist` | `allowlist` | `off`     | Seules les commandes figurant dans la liste d’autorisation ou utilisant des binaires sûrs sont exécutées ; aucune autre autorisation n’est demandée. |
| `ask`       | `allowlist` | `on-miss` | Les correspondances avec la liste d’autorisation sont exécutées directement ; tout le reste nécessite l’autorisation d’une personne.                 |
| `auto`      | `allowlist` | `on-miss` | Les correspondances avec la liste d’autorisation ou les binaires sûrs sont exécutées directement ; tout le reste passe par l’évaluateur automatique natif d’OpenClaw avant de demander l’autorisation d’une personne. |
| `full`      | `full`      | `off`     | Aucune étape d’approbation.                                                                                                                         |

`ask`/`ask=always` demande toujours l’autorisation d’une personne, quel que soit le mode.

L’approbation issue de l’évaluation automatique est à usage unique. Sur le Gateway, OpenClaw fournit à l’évaluateur le chemin résolu de l’exécutable et impose que l’exécution utilise ce même chemin. Les commandes qui ne peuvent pas être réduites à un seul plan d’exécution applicable, telles que les heredocs, les expansions du shell ou les guillemets non pris en charge dans les wrappers, nécessitent l’approbation d’une personne, même si le modèle les autoriserait autrement.

Les approbations de commandes du serveur d’application Codex qui ne sont pas déjà déterminées par une politique explicite du runtime ou une politique native utilisent le parcours d’approbation humaine. OpenClaw n’exécute pas son évaluateur d’exécution configuré pour ces requêtes, car Codex n’expose pas d’exécutable résolu applicable permettant de lier la décision d’évaluation à la commande exécutée par Codex.

### Évaluation intégrée (`strictInlineEval`)

Lorsque `tools.exec.strictInlineEval` vaut `true`, les formes d’évaluation intégrées de l’interpréteur nécessitent l’autorisation de l’évaluateur ou une approbation explicite : `python -c`, `node -e`, `ruby -e`, `perl -e`, `php -r`, `lua -e`, `osascript -e`, ainsi que les formes similaires des autres interpréteurs et vecteurs de commande pris en charge (`awk`, `find -exec`, `make`, `sed`, `xargs`, entre autres). Avec `mode=auto`, le parcours normal d’approbation de l’exécution peut permettre à l’évaluateur automatique natif d’autoriser une commande ponctuelle présentant clairement un faible risque ; les appels directs à `system.run` sur l’hôte Node nécessitent toujours une approbation explicite, car ils ne peuvent pas transmettre la commande à un parcours d’approbation humaine. Si l’évaluateur demande une approbation, la requête est transmise à une personne. `allow-always` peut toujours mémoriser les invocations bénignes d’interpréteurs ou de scripts, mais les formes d’évaluation intégrées ne deviennent pas des règles d’autorisation permanentes.

### Gestion de PATH

- `host=gateway` : fusionne le `PATH` de votre shell de connexion avec l’environnement d’exécution. Les substitutions de `env.PATH` sont refusées pour l’exécution sur l’hôte. Le démon lui-même continue de s’exécuter avec un `PATH` minimal :
  - macOS : `/opt/homebrew/bin`, `/usr/local/bin`, `/usr/bin`, `/bin`
  - Linux : `/usr/local/bin`, `/usr/bin`, `/bin`
  - Pour empêcher la configuration du shell utilisateur, comme `~/.zshenv` ou `/etc/zshenv`, de remplacer les chemins prioritaires au démarrage, les entrées de `tools.exec.pathPrepend` sont ajoutées de manière sécurisée au début du `PATH` final dans la commande shell juste avant l’exécution.
- `host=sandbox` : exécute `sh -lc` (shell de connexion) dans le conteneur, de sorte que `/etc/profile` peut réinitialiser `PATH`. OpenClaw ajoute `env.PATH` au début du chemin après le chargement du profil au moyen d’une variable d’environnement interne, sans interpolation du shell ; `tools.exec.pathPrepend` s’applique également ici.
- `host=node` : seules les substitutions d’environnement non bloquées que vous fournissez sont envoyées au Node. Les substitutions de `env.PATH` sont refusées pour l’exécution sur l’hôte et ignorées par les hôtes Node. Si vous avez besoin d’entrées PATH supplémentaires sur un Node, configurez l’environnement du service de l’hôte Node (systemd/launchd) ou installez les outils dans des emplacements standard.

Association d’un Node par agent (utilisez l’index de la liste des agents dans la configuration) :

```bash
openclaw config get agents.list
openclaw config set 'agents.list[0].tools.exec.node' "node-id-or-name"
```

Interface de contrôle : la page **Devices** comprend un petit panneau « Exec node binding » pour les mêmes paramètres.

## Substitutions de session (`/exec`)

Utilisez `/exec` pour définir les valeurs par défaut **propres à la session** de `host`, `security`, `ask` et `node`. Envoyez `/exec` sans argument pour afficher les valeurs actuelles.

Exemple :

```text
/exec host=auto security=allowlist ask=on-miss node=mac-1
```

`/exec` est pris en compte uniquement pour les **expéditeurs autorisés** (listes d’autorisation ou appairage du canal, plus `commands.useAccessGroups`). Il met à jour **uniquement l’état de la session** et n’écrit pas dans la configuration. Les expéditeurs autorisés de canaux externes peuvent définir ces valeurs par défaut de session. Les clients internes du Gateway ou du chat web ont besoin de `operator.admin` pour les rendre persistantes.

Pour désactiver complètement l’exécution, refusez-la au moyen de la politique des outils (`tools.deny: ["exec"]` ou par agent). Les approbations de l’hôte continuent de s’appliquer, sauf si vous définissez explicitement `security=full` et `ask=off`.

## Approbations d’exécution (application compagnon / hôte Node)

Les agents en bac à sable peuvent exiger une approbation pour chaque requête avant l’exécution de `exec` sur le Gateway ou l’hôte Node. Consultez [Approbations d’exécution](/fr/tools/exec-approvals) pour en savoir plus sur la politique, la liste d’autorisation et le parcours dans l’interface utilisateur.

Lorsqu’une approbation humaine est requise, les parcours de l’hôte Node et les parcours non natifs du Gateway renvoient immédiatement `status: "approval-pending"` ainsi qu’un identifiant d’approbation. Les parcours natifs du chat et du Gateway de l’interface Web peuvent à la place attendre en ligne et renvoyer le résultat final de la commande après l’approbation. Un résultat `approval-pending` signifie que la commande n’a pas démarré ; les avertissements de basculement vers le premier plan n’apparaissent donc que si la commande approuvée est effectivement exécutée en ligne. Les exécutions asynchrones approuvées émettent des événements système de progression et de fin de commande (`Exec running` / `Exec finished`) ; les approbations refusées ou arrivées à expiration sont définitives et ne réactivent pas la session de l’agent avec un événement système de refus.

Sur les canaux disposant de cartes ou de boutons d’approbation natifs, l’agent doit utiliser en priorité cette interface native et n’inclure une commande manuelle `/approve` que lorsque le résultat de l’outil indique explicitement que les approbations dans le chat sont indisponibles ou que l’approbation manuelle constitue le seul parcours possible.

## Liste d’autorisation et binaires sûrs

L’application manuelle de la liste d’autorisation fait correspondre les motifs glob des chemins binaires résolus et ceux des noms de commandes seuls. Les noms seuls correspondent uniquement aux commandes invoquées par l’intermédiaire de PATH ; `rg` peut donc correspondre à `/opt/homebrew/bin/rg` lorsque la commande est `rg`, mais pas à `./rg` ni à `/tmp/rg`.

Lorsque `security=allowlist`, les commandes shell sont automatiquement autorisées uniquement si chaque segment du pipeline figure dans la liste d’autorisation ou correspond à un binaire sûr. Les enchaînements (`;`, `&&`, `||`) et les redirections sont refusés en mode liste d’autorisation, sauf si chaque segment de premier niveau satisfait la liste d’autorisation, y compris les binaires sûrs. Les redirections restent non prises en charge. La confiance permanente accordée par `allow-always` ne contourne pas cette règle : chaque segment de premier niveau d’une commande enchaînée doit toujours correspondre.

`autoAllowSkills` est un parcours pratique distinct dans les approbations d’exécution, différent des entrées manuelles de chemins dans la liste d’autorisation. Pour une confiance explicite stricte, laissez `autoAllowSkills` désactivé.

Utilisez les deux contrôles à des fins différentes :

- `tools.exec.safeBins` : petits filtres de flux limités à l’entrée standard.
- `tools.exec.safeBinTrustedDirs` : répertoires de confiance supplémentaires explicitement définis pour les chemins des exécutables sûrs.
- `tools.exec.safeBinProfiles` : politique d’arguments explicite pour les binaires sûrs personnalisés.
- liste d’autorisation : confiance explicite accordée aux chemins des exécutables.

Ne considérez pas `safeBins` comme une liste d’autorisation générique et n’y ajoutez pas de binaires d’interpréteur ou de runtime, par exemple `python3`, `node`, `ruby` ou `bash`. Si vous en avez besoin, utilisez des entrées explicites dans la liste d’autorisation et conservez les demandes d’approbation activées.

`openclaw security audit` émet un avertissement lorsque des entrées d’interpréteur ou de runtime dans `safeBins` ne disposent pas de profils explicites, et `openclaw doctor --fix` peut générer la structure des entrées personnalisées manquantes dans `safeBinProfiles`. `openclaw security audit` et `openclaw doctor` émettent également un avertissement lorsque vous réintroduisez explicitement dans `safeBins` des binaires au comportement étendu tels que `jq` (`jq` peut lire les données d’environnement et charger du code jq depuis des modules ou des fichiers de démarrage ; préférez donc des entrées explicites dans la liste d’autorisation ou des exécutions soumises à approbation). L’utilisation de `jq` comme binaire sûr est refusée même lorsqu’il figure explicitement dans la liste. Si vous placez explicitement des interpréteurs dans la liste d’autorisation, activez `tools.exec.strictInlineEval` afin que les formes d’évaluation de code intégrées nécessitent toujours l’autorisation de l’évaluateur ou une approbation explicite.

Pour obtenir les détails complets de la politique et des exemples, consultez [Approbations d’exécution](/fr/tools/exec-approvals-advanced#safe-bins-stdin-only) et [Binaires sûrs et liste d’autorisation](/fr/tools/exec-approvals-advanced#safe-bins-versus-allowlist).

## Exemples

Premier plan :

```json
{ "tool": "exec", "command": "ls -la" }
```

Arrière-plan et interrogation :

```json
{"tool":"exec","command":"npm run build","yieldMs":1000}
{"tool":"process","action":"poll","sessionId":"<id>"}
```

L’interrogation sert à obtenir l’état à la demande, et non à créer des boucles d’attente. Si la réactivation automatique à la fin est activée, la commande peut réactiver la session lorsqu’elle produit une sortie ou échoue.

Envoi de touches (style tmux) :

```json
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Enter"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["C-c"]}
{"tool":"process","action":"send-keys","sessionId":"<id>","keys":["Up","Up","Enter"]}
```

Soumission (envoie uniquement CR) :

```json
{ "tool": "process", "action": "submit", "sessionId": "<id>" }
```

Collage (encadré par défaut) :

```json
{ "tool": "process", "action": "paste", "sessionId": "<id>", "text": "line1\nline2\n" }
```

## apply_patch

`apply_patch` est un sous-outil de `exec` destiné aux modifications structurées de plusieurs fichiers. Il est activé par défaut et disponible avec tous les fournisseurs de modèles ; `allowModels` permet de restreindre son utilisation. Utilisez la configuration uniquement lorsque vous souhaitez le désactiver ou le limiter à certains modèles :

```json5
{
  tools: {
    exec: {
      applyPatch: { workspaceOnly: true, allowModels: ["gpt-5.6-sol"] },
    },
  },
}
```

Remarques :

- La politique des outils continue de s’appliquer ; `allow: ["write"]` autorise implicitement `apply_patch`.
- `deny: ["write"]` ne refuse pas `apply_patch` ; refusez explicitement `apply_patch` ou utilisez `deny: ["group:fs"]` lorsque les écritures de correctifs doivent également être bloquées.
- La configuration se trouve sous `tools.exec.applyPatch`.
- `tools.exec.applyPatch.enabled` vaut `true` par défaut ; définissez-le sur `false` pour désactiver l’outil.
- `tools.exec.applyPatch.workspaceOnly` vaut `true` par défaut, ce qui limite les modifications à l’espace de travail. Définissez-le sur `false` uniquement si vous souhaitez intentionnellement que `apply_patch` écrive ou supprime des éléments en dehors du répertoire de l’espace de travail.
- `tools.exec.applyPatch.allowModels` est une liste d’autorisation facultative d’identifiants de modèles, sous forme brute comme `gpt-5.4` ou complète comme `openai/gpt-5.4`. Lorsqu’elle est définie, seuls les modèles correspondants obtiennent l’outil ; lorsqu’elle ne l’est pas, tous les modèles l’obtiennent.

## Pages connexes

- [Approbations d’exécution](/fr/tools/exec-approvals) — étapes d’approbation pour les commandes shell
- [Mise en bac à sable](/fr/gateway/sandboxing) — exécution de commandes dans des environnements en bac à sable
- [Processus en arrière-plan](/fr/gateway/background-process) — outils d’exécution et de traitement pour les commandes de longue durée
- [Sécurité](/fr/gateway/security) — politique des outils et accès privilégié
