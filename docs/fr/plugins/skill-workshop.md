---
read_when:
    - Vous souhaitez que les agents transforment des corrections ou des procédures réutilisables en Skills d’espace de travail
    - Vous configurez la mémoire procédurale des Skills
    - Vous déboguez le comportement de l’outil `skill_workshop`
    - Vous décidez s’il faut activer la création automatique de Skills
summary: Capture expérimentale de procédures réutilisables comme Skills d’espace de travail avec revue, approbation, quarantaine et actualisation à chaud des Skills
title: Plugin Skill Workshop
x-i18n:
    generated_at: "2026-04-22T04:26:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 62dcb3e1a71999bfc39a95dc3d0984d3446c8a58f7d91a914dfc7256b4e79601
    source_path: plugins/skill-workshop.md
    workflow: 15
---

# Plugin Skill Workshop

Skill Workshop est **expérimental**. Il est désactivé par défaut, ses heuristiques de capture
et ses prompts de relecture peuvent changer d’une version à l’autre, et les
écritures automatiques ne doivent être utilisées que dans des espaces de travail de confiance après avoir d’abord relu la sortie en mode en attente.

Skill Workshop est une mémoire procédurale pour les Skills d’espace de travail. Il permet à un agent de transformer
des workflows réutilisables, des corrections utilisateur, des correctifs difficiles à obtenir et des pièges récurrents
en fichiers `SKILL.md` sous :

```text
<workspace>/skills/<skill-name>/SKILL.md
```

C’est différent de la mémoire à long terme :

- **Memory** stocke des faits, des préférences, des entités et du contexte passé.
- **Skills** stockent des procédures réutilisables que l’agent doit suivre lors de tâches futures.
- **Skill Workshop** est le pont entre un tour utile et une compétence d’espace de travail durable,
  avec vérifications de sécurité et approbation facultative.

Skill Workshop est utile lorsque l’agent apprend une procédure telle que :

- comment valider des ressources GIF animées provenant de sources externes
- comment remplacer des ressources de capture d’écran et vérifier leurs dimensions
- comment exécuter un scénario QA spécifique à un dépôt
- comment déboguer un échec récurrent de provider
- comment réparer une note locale de workflow obsolète

Il n’est pas destiné à :

- des faits comme « l’utilisateur aime le bleu »
- une mémoire autobiographique large
- l’archivage brut des transcriptions
- des secrets, des identifiants ou du texte de prompt caché
- des instructions ponctuelles qui ne se répéteront pas

## État par défaut

Le Plugin inclus est **expérimental** et **désactivé par défaut** sauf s’il est
explicitement activé dans `plugins.entries.skill-workshop`.

Le manifeste du plugin ne définit pas `enabledByDefault: true`. La valeur par défaut `enabled: true`
dans le schéma de config du plugin ne s’applique qu’après la sélection et le chargement
de l’entrée du plugin.

Expérimental signifie :

- le plugin est suffisamment pris en charge pour des tests opt-in et du dogfooding
- le stockage des propositions, les seuils de relecture et les heuristiques de capture peuvent évoluer
- l’approbation en attente est le mode de départ recommandé
- l’application automatique est destinée aux configurations personnelles / d’espace de travail de confiance, pas aux environnements partagés ou fortement exposés à des entrées hostiles

## Activer

Configuration minimale sûre :

```json5
{
  plugins: {
    entries: {
      "skill-workshop": {
        enabled: true,
        config: {
          autoCapture: true,
          approvalPolicy: "pending",
          reviewMode: "hybrid",
        },
      },
    },
  },
}
```

Avec cette config :

- l’outil `skill_workshop` est disponible
- les corrections réutilisables explicites sont mises en file comme propositions en attente
- les passages de relecture fondés sur des seuils peuvent proposer des mises à jour de Skills
- aucun fichier de Skill n’est écrit tant qu’une proposition en attente n’est pas appliquée

N’utilisez les écritures automatiques que dans des espaces de travail de confiance :

```json5
{
  plugins: {
    entries: {
      "skill-workshop": {
        enabled: true,
        config: {
          autoCapture: true,
          approvalPolicy: "auto",
          reviewMode: "hybrid",
        },
      },
    },
  },
}
```

`approvalPolicy: "auto"` utilise toujours le même scanner et le même chemin de quarantaine. Il
n’applique pas les propositions comportant des résultats critiques.

## Configuration

| Key                  | Default     | Plage / valeurs                             | Signification                                                       |
| -------------------- | ----------- | ------------------------------------------- | ------------------------------------------------------------------- |
| `enabled`            | `true`      | boolean                                     | Active le plugin après le chargement de l’entrée du plugin.         |
| `autoCapture`        | `true`      | boolean                                     | Active la capture / relecture après tour sur les tours d’agent réussis. |
| `approvalPolicy`     | `"pending"` | `"pending"`, `"auto"`                       | Mettre les propositions en file ou écrire automatiquement les propositions sûres. |
| `reviewMode`         | `"hybrid"`  | `"off"`, `"heuristic"`, `"llm"`, `"hybrid"` | Choisit la capture de corrections explicites, le relecteur LLM, les deux ou aucun. |
| `reviewInterval`     | `15`        | `1..200`                                    | Exécuter le relecteur après ce nombre de tours réussis.             |
| `reviewMinToolCalls` | `8`         | `1..500`                                    | Exécuter le relecteur après ce nombre d’appels d’outils observés.   |
| `reviewTimeoutMs`    | `45000`     | `5000..180000`                              | Délai d’expiration de l’exécution du relecteur embarqué.            |
| `maxPending`         | `50`        | `1..200`                                    | Nombre maximal de propositions en attente / en quarantaine conservées par espace de travail. |
| `maxSkillBytes`      | `40000`     | `1024..200000`                              | Taille maximale du fichier de Skill / de support généré.            |

Profils recommandés :

```json5
// Conservateur : utilisation explicite de l’outil uniquement, aucune capture automatique.
{
  autoCapture: false,
  approvalPolicy: "pending",
  reviewMode: "off",
}
```

```json5
// Relecture d’abord : capture automatique, mais approbation requise.
{
  autoCapture: true,
  approvalPolicy: "pending",
  reviewMode: "hybrid",
}
```

```json5
// Automatisation de confiance : écrire immédiatement les propositions sûres.
{
  autoCapture: true,
  approvalPolicy: "auto",
  reviewMode: "hybrid",
}
```

```json5
// Faible coût : aucun appel LLM de relecture, uniquement des phrases de correction explicites.
{
  autoCapture: true,
  approvalPolicy: "pending",
  reviewMode: "heuristic",
}
```

## Chemins de capture

Skill Workshop possède trois chemins de capture.

### Suggestions d’outil

Le modèle peut appeler `skill_workshop` directement lorsqu’il voit une procédure réutilisable
ou lorsque l’utilisateur lui demande d’enregistrer / mettre à jour un Skill.

C’est le chemin le plus explicite et il fonctionne même avec `autoCapture: false`.

### Capture heuristique

Lorsque `autoCapture` est activé et que `reviewMode` vaut `heuristic` ou `hybrid`, le
plugin analyse les tours réussis à la recherche de phrases explicites de correction utilisateur :

- `next time`
- `from now on`
- `remember to`
- `make sure to`
- `always ... use/check/verify/record/save/prefer`
- `prefer ... when/for/instead/use`
- `when asked`

L’heuristique crée une proposition à partir de la dernière instruction utilisateur correspondante. Elle
utilise des indices de sujet pour choisir des noms de Skills pour des workflows courants :

- tâches de GIF animés -> `animated-gif-workflow`
- tâches de captures d’écran ou de ressources -> `screenshot-asset-workflow`
- tâches QA ou de scénario -> `qa-scenario-workflow`
- tâches de GitHub PR -> `github-pr-workflow`
- repli -> `learned-workflows`

La capture heuristique est volontairement étroite. Elle sert aux corrections claires et aux notes de processus répétables, pas au résumé général de transcription.

### Relecteur LLM

Lorsque `autoCapture` est activé et que `reviewMode` vaut `llm` ou `hybrid`, le plugin
exécute un relecteur embarqué compact lorsque les seuils sont atteints.

Le relecteur reçoit :

- le texte récent de la transcription, limité aux 12 000 derniers caractères
- jusqu’à 12 Skills d’espace de travail existants
- jusqu’à 2 000 caractères de chaque Skill existant
- des instructions JSON-only

Le relecteur n’a aucun outil :

- `disableTools: true`
- `toolsAllow: []`
- `disableMessageTool: true`

Il peut renvoyer :

```json
{ "action": "none" }
```

ou une proposition de Skill :

```json
{
  "action": "create",
  "skillName": "media-asset-qa",
  "title": "Media Asset QA",
  "reason": "Reusable animated media acceptance workflow",
  "description": "Validate externally sourced animated media before product use.",
  "body": "## Workflow\n\n- Verify true animation.\n- Record attribution.\n- Store a local approved copy.\n- Verify in product UI before final reply."
}
```

Il peut aussi ajouter à un Skill existant :

```json
{
  "action": "append",
  "skillName": "qa-scenario-workflow",
  "title": "QA Scenario Workflow",
  "reason": "Animated media QA needs reusable checks",
  "description": "QA scenario workflow.",
  "section": "Workflow",
  "body": "- For animated GIF tasks, verify frame count and attribution before passing."
}
```

Ou remplacer un texte exact dans un Skill existant :

```json
{
  "action": "replace",
  "skillName": "screenshot-asset-workflow",
  "title": "Screenshot Asset Workflow",
  "reason": "Old validation missed image optimization",
  "oldText": "- Replace the screenshot asset.",
  "newText": "- Replace the screenshot asset, preserve dimensions, optimize the PNG, and run the relevant validation gate."
}
```

Préférez `append` ou `replace` lorsqu’un Skill pertinent existe déjà. Utilisez `create`
uniquement lorsqu’aucun Skill existant ne convient.

## Cycle de vie des propositions

Chaque mise à jour générée devient une proposition avec :

- `id`
- `createdAt`
- `updatedAt`
- `workspaceDir`
- `agentId` facultatif
- `sessionId` facultatif
- `skillName`
- `title`
- `reason`
- `source` : `tool`, `agent_end`, ou `reviewer`
- `status`
- `change`
- `scanFindings` facultatif
- `quarantineReason` facultatif

États des propositions :

- `pending` - en attente d’approbation
- `applied` - écrit dans `<workspace>/skills`
- `rejected` - rejeté par l’opérateur / le modèle
- `quarantined` - bloqué par des résultats critiques du scanner

L’état est stocké par espace de travail sous le répertoire d’état de la Gateway :

```text
<stateDir>/skill-workshop/<workspace-hash>.json
```

Les propositions en attente et en quarantaine sont dédupliquées par nom de Skill et par charge utile
de changement. Le stockage conserve les propositions en attente / en quarantaine les plus récentes jusqu’à
`maxPending`.

## Référence de l’outil

Le plugin enregistre un outil d’agent :

```text
skill_workshop
```

### `status`

Compter les propositions par état pour l’espace de travail actif.

```json
{ "action": "status" }
```

Forme du résultat :

```json
{
  "workspaceDir": "/path/to/workspace",
  "pending": 1,
  "quarantined": 0,
  "applied": 3,
  "rejected": 0
}
```

### `list_pending`

Lister les propositions en attente.

```json
{ "action": "list_pending" }
```

Pour lister un autre état :

```json
{ "action": "list_pending", "status": "applied" }
```

Valeurs valides pour `status` :

- `pending`
- `applied`
- `rejected`
- `quarantined`

### `list_quarantine`

Lister les propositions en quarantaine.

```json
{ "action": "list_quarantine" }
```

Utilisez cela lorsque la capture automatique semble ne rien faire et que les journaux mentionnent
`skill-workshop: quarantined <skill>`.

### `inspect`

Récupérer une proposition par identifiant.

```json
{
  "action": "inspect",
  "id": "proposal-id"
}
```

### `suggest`

Créer une proposition. Avec `approvalPolicy: "pending"`, cela la met en file par défaut.

```json
{
  "action": "suggest",
  "skillName": "animated-gif-workflow",
  "title": "Animated GIF Workflow",
  "reason": "User established reusable GIF validation rules.",
  "description": "Validate animated GIF assets before using them.",
  "body": "## Workflow\n\n- Verify the URL resolves to image/gif.\n- Confirm it has multiple frames.\n- Record attribution and license.\n- Avoid hotlinking when a local asset is needed."
}
```

Forcer une écriture sûre :

```json
{
  "action": "suggest",
  "apply": true,
  "skillName": "animated-gif-workflow",
  "description": "Validate animated GIF assets before using them.",
  "body": "## Workflow\n\n- Verify true animation.\n- Record attribution."
}
```

Forcer l’attente même avec `approvalPolicy: "auto"` :

```json
{
  "action": "suggest",
  "apply": false,
  "skillName": "screenshot-asset-workflow",
  "description": "Screenshot replacement workflow.",
  "body": "## Workflow\n\n- Verify dimensions.\n- Optimize the PNG.\n- Run the relevant gate."
}
```

Ajouter à une section :

```json
{
  "action": "suggest",
  "skillName": "qa-scenario-workflow",
  "section": "Workflow",
  "description": "QA scenario workflow.",
  "body": "- For media QA, verify generated assets render and pass final assertions."
}
```

Remplacer un texte exact :

```json
{
  "action": "suggest",
  "skillName": "github-pr-workflow",
  "oldText": "- Check the PR.",
  "newText": "- Check unresolved review threads, CI status, linked issues, and changed files before deciding."
}
```

### `apply`

Appliquer une proposition en attente.

```json
{
  "action": "apply",
  "id": "proposal-id"
}
```

`apply` refuse les propositions en quarantaine :

```text
quarantined proposal cannot be applied
```

### `reject`

Marquer une proposition comme rejetée.

```json
{
  "action": "reject",
  "id": "proposal-id"
}
```

### `write_support_file`

Écrire un fichier de support dans un répertoire de Skill existant ou proposé.

Répertoires de support de niveau supérieur autorisés :

- `references/`
- `templates/`
- `scripts/`
- `assets/`

Exemple :

```json
{
  "action": "write_support_file",
  "skillName": "release-workflow",
  "relativePath": "references/checklist.md",
  "body": "# Release Checklist\n\n- Run release docs.\n- Verify changelog.\n"
}
```

Les fichiers de support sont à portée de l’espace de travail, contrôlés au niveau du chemin, limités en taille par
`maxSkillBytes`, analysés, puis écrits de manière atomique.

## Écritures de Skills

Skill Workshop écrit uniquement sous :

```text
<workspace>/skills/<normalized-skill-name>/
```

Les noms de Skills sont normalisés :

- en minuscules
- les suites de caractères hors `[a-z0-9_-]` deviennent `-`
- les caractères non alphanumériques en début / fin sont supprimés
- la longueur maximale est de 80 caractères
- le nom final doit correspondre à `[a-z0-9][a-z0-9_-]{1,79}`

Pour `create` :

- si le Skill n’existe pas, Skill Workshop écrit un nouveau `SKILL.md`
- s’il existe déjà, Skill Workshop ajoute le corps à `## Workflow`

Pour `append` :

- si le Skill existe, Skill Workshop ajoute à la section demandée
- s’il n’existe pas, Skill Workshop crée un Skill minimal puis ajoute

Pour `replace` :

- le Skill doit déjà exister
- `oldText` doit être présent exactement
- seule la première correspondance exacte est remplacée

Toutes les écritures sont atomiques et actualisent immédiatement l’instantané en mémoire des Skills, afin que
le Skill nouveau ou mis à jour puisse devenir visible sans redémarrage de la Gateway.

## Modèle de sécurité

Skill Workshop dispose d’un scanner de sécurité sur le contenu généré de `SKILL.md` et sur les fichiers de support.

Les résultats critiques mettent les propositions en quarantaine :

| Rule id                                | Bloque un contenu qui...                                              |
| -------------------------------------- | --------------------------------------------------------------------- |
| `prompt-injection-ignore-instructions` | dit à l’agent d’ignorer des instructions antérieures / de niveau supérieur |
| `prompt-injection-system`              | fait référence aux prompts système, aux messages développeur ou à des instructions cachées |
| `prompt-injection-tool`                | encourage à contourner les permissions / approbations des outils      |
| `shell-pipe-to-shell`                  | inclut `curl`/`wget` pipe vers `sh`, `bash` ou `zsh`                  |
| `secret-exfiltration`                  | semble envoyer des données env / d’environnement de processus sur le réseau |

Les résultats d’avertissement sont conservés mais ne bloquent pas à eux seuls :

| Rule id              | Avertit sur...                    |
| -------------------- | --------------------------------- |
| `destructive-delete` | des commandes de style `rm -rf` larges |
| `unsafe-permissions` | des usages de permissions de style `chmod 777` |

Les propositions en quarantaine :

- conservent `scanFindings`
- conservent `quarantineReason`
- apparaissent dans `list_quarantine`
- ne peuvent pas être appliquées via `apply`

Pour récupérer une proposition en quarantaine, créez une nouvelle proposition sûre avec le
contenu dangereux supprimé. Ne modifiez pas le JSON du stockage à la main.

## Guide de prompt

Lorsqu’il est activé, Skill Workshop injecte une courte section de prompt qui indique à l’agent
d’utiliser `skill_workshop` pour la mémoire procédurale durable.

Le guide met l’accent sur :

- les procédures, pas les faits / préférences
- les corrections utilisateur
- les procédures réussies non évidentes
- les pièges récurrents
- la réparation de Skills obsolètes / minces / incorrects via append / replace
- l’enregistrement d’une procédure réutilisable après de longues boucles d’outils ou des correctifs difficiles
- un texte de Skill court et impératif
- pas de dumps de transcription

Le texte du mode d’écriture change selon `approvalPolicy` :

- mode pending : mettre les suggestions en file ; appliquer uniquement après approbation explicite
- mode auto : appliquer les mises à jour sûres de Skills d’espace de travail lorsqu’elles sont clairement réutilisables

## Coûts et comportement à l’exécution

La capture heuristique n’appelle pas de modèle.

La relecture LLM utilise une exécution embarquée sur le modèle actif / par défaut de l’agent. Elle est
basée sur des seuils, donc elle ne s’exécute pas à chaque tour par défaut.

Le relecteur :

- utilise le même contexte configuré provider / modèle lorsqu’il est disponible
- se replie sur les valeurs par défaut de l’agent runtime
- possède `reviewTimeoutMs`
- utilise un contexte d’initialisation léger
- n’a aucun outil
- n’écrit rien directement
- peut uniquement émettre une proposition qui passe par le scanner normal et le
  chemin d’approbation / quarantaine

Si le relecteur échoue, expire, ou renvoie un JSON invalide, le plugin enregistre un
message d’avertissement / de débogage et ignore ce passage de relecture.

## Schémas d’utilisation

Utilisez Skill Workshop lorsque l’utilisateur dit :

- « next time, do X »
- « from now on, prefer Y »
- « make sure to verify Z »
- « save this as a workflow »
- « this took a while; remember the process »
- « update the local skill for this »

Bon texte de Skill :

```markdown
## Workflow

- Verify the GIF URL resolves to `image/gif`.
- Confirm the file has multiple frames.
- Record source URL, license, and attribution.
- Store a local copy when the asset will ship with the product.
- Verify the local asset renders in the target UI before final reply.
```

Mauvais texte de Skill :

```markdown
The user asked about a GIF and I searched two websites. Then one was blocked by
Cloudflare. The final answer said to check attribution.
```

Raisons pour lesquelles la mauvaise version ne doit pas être enregistrée :

- forme de transcription
- non impératif
- inclut des détails ponctuels bruyants
- n’indique pas au prochain agent quoi faire

## Débogage

Vérifiez si le plugin est chargé :

```bash
openclaw plugins list --enabled
```

Vérifiez le nombre de propositions depuis un contexte agent / outil :

```json
{ "action": "status" }
```

Inspectez les propositions en attente :

```json
{ "action": "list_pending" }
```

Inspectez les propositions en quarantaine :

```json
{ "action": "list_quarantine" }
```

Symptômes courants :

| Symptom                               | Cause probable                                                                      | Vérification                                                        |
| ------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| L’outil est indisponible              | L’entrée du plugin n’est pas activée                                                | `plugins.entries.skill-workshop.enabled` et `openclaw plugins list` |
| Aucune proposition automatique n’apparaît | `autoCapture: false`, `reviewMode: "off"`, ou seuils non atteints              | Config, état des propositions, journaux Gateway                     |
| La heuristique n’a pas capturé        | Le libellé de l’utilisateur ne correspondait pas aux motifs de correction           | Utilisez `skill_workshop.suggest` explicitement ou activez le relecteur LLM |
| Le relecteur n’a pas créé de proposition | Le relecteur a renvoyé `none`, un JSON invalide, ou a expiré                   | Journaux Gateway, `reviewTimeoutMs`, seuils                         |
| La proposition n’est pas appliquée    | `approvalPolicy: "pending"`                                                         | `list_pending`, puis `apply`                                        |
| La proposition a disparu des attentes | Réutilisation d’une proposition dupliquée, élagage max pending, ou application / rejet / quarantaine | `status`, `list_pending` avec filtres d’état, `list_quarantine` |
| Le fichier de Skill existe mais le modèle l’ignore | L’instantané de Skills n’a pas été actualisé ou le filtrage des Skills l’exclut | statut `openclaw skills` et éligibilité des Skills d’espace de travail |

Journaux pertinents :

- `skill-workshop: queued <skill>`
- `skill-workshop: applied <skill>`
- `skill-workshop: quarantined <skill>`
- `skill-workshop: heuristic capture skipped: ...`
- `skill-workshop: reviewer skipped: ...`
- `skill-workshop: reviewer found no update`

## Scénarios QA

Scénarios QA adossés au dépôt :

- `qa/scenarios/plugins/skill-workshop-animated-gif-autocreate.md`
- `qa/scenarios/plugins/skill-workshop-pending-approval.md`
- `qa/scenarios/plugins/skill-workshop-reviewer-autonomous.md`

Exécuter la couverture déterministe :

```bash
pnpm openclaw qa suite \
  --scenario skill-workshop-animated-gif-autocreate \
  --scenario skill-workshop-pending-approval \
  --concurrency 1
```

Exécuter la couverture du relecteur :

```bash
pnpm openclaw qa suite \
  --scenario skill-workshop-reviewer-autonomous \
  --concurrency 1
```

Le scénario du relecteur est volontairement séparé car il active
`reviewMode: "llm"` et exerce le passage de relecture embarqué.

## Quand ne pas activer l’application automatique

Évitez `approvalPolicy: "auto"` lorsque :

- l’espace de travail contient des procédures sensibles
- l’agent travaille sur des entrées non fiables
- les Skills sont partagés avec une équipe large
- vous êtes encore en train d’ajuster les prompts ou les règles du scanner
- le modèle traite fréquemment du contenu Web / email hostile

Utilisez d’abord le mode pending. Passez au mode auto uniquement après avoir relu le type de
Skills que l’agent propose dans cet espace de travail.

## Documentation associée

- [Skills](/fr/tools/skills)
- [Plugins](/fr/tools/plugin)
- [Testing](/fr/reference/test)
