---
read_when:
    - Vous voulez que les agents transforment les corrections ou les procédures réutilisables en Skills d’espace de travail
    - Vous configurez la mémoire de compétences procédurales
    - Vous déboguez le comportement de l’outil skill_workshop
    - Vous décidez s’il faut activer la création automatique de Skills
summary: Capture expérimentale de procédures réutilisables sous forme de Skills d’espace de travail avec revue, approbation, quarantaine et actualisation à chaud des Skills
title: Plugin d’atelier Skill
x-i18n:
    generated_at: "2026-05-07T13:24:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: f7dc89644a1ac1d7400b8a03d7a132c1e836b3aca96e66018710945637d5c393
    source_path: plugins/skill-workshop.md
    workflow: 16
---

Skill Workshop est **expérimental**. Il est désactivé par défaut, ses heuristiques de capture et ses prompts de révision peuvent changer entre les versions, et les écritures automatiques ne doivent être utilisées que dans des espaces de travail de confiance après avoir d’abord examiné la sortie du mode en attente.

Skill Workshop est une mémoire procédurale pour les Skills d’espace de travail. Il permet à un agent de transformer des workflows réutilisables, des corrections utilisateur, des correctifs durement acquis et des pièges récurrents en fichiers `SKILL.md` sous :

```text
<workspace>/skills/<skill-name>/SKILL.md
```

Cela diffère de la mémoire à long terme :

- **Mémoire** stocke des faits, des préférences, des entités et du contexte passé.
- **Skills** stockent des procédures réutilisables que l’agent doit suivre lors de tâches futures.
- **Skill Workshop** est le pont entre un échange utile et un Skill d’espace de travail durable, avec des contrôles de sécurité et une approbation facultative.

Skill Workshop est utile lorsque l’agent apprend une procédure telle que :

- comment valider des ressources GIF animées provenant de sources externes
- comment remplacer des ressources de capture d’écran et vérifier les dimensions
- comment exécuter un scénario QA propre au dépôt
- comment déboguer une défaillance récurrente de fournisseur
- comment réparer une note de workflow local obsolète

Il n’est pas destiné à :

- des faits comme « l’utilisateur aime le bleu »
- une mémoire autobiographique générale
- l’archivage brut de transcriptions
- des secrets, des identifiants ou du texte de prompt masqué
- des instructions ponctuelles qui ne se répéteront pas

## État par défaut

Le Plugin intégré est **expérimental** et **désactivé par défaut**, sauf s’il est explicitement activé dans `plugins.entries.skill-workshop`.

Le manifeste du Plugin ne définit pas `enabledByDefault: true`. La valeur par défaut `enabled: true` dans le schéma de configuration du Plugin ne s’applique qu’après que l’entrée du Plugin a déjà été sélectionnée et chargée.

Expérimental signifie :

- le Plugin est suffisamment pris en charge pour les tests opt-in et le dogfooding
- le stockage des propositions, les seuils de révision et les heuristiques de capture peuvent évoluer
- l’approbation en attente est le mode de départ recommandé
- l’application automatique est destinée aux configurations personnelles ou d’espace de travail de confiance, pas aux environnements partagés ou hostiles recevant beaucoup d’entrées

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

Avec cette configuration :

- l’outil `skill_workshop` est disponible
- les corrections réutilisables explicites sont mises en file comme propositions en attente
- les passes de révision basées sur des seuils peuvent proposer des mises à jour de Skills
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

`approvalPolicy: "auto"` utilise toujours le même scanner et le même chemin de quarantaine. Il n’applique pas les propositions avec des résultats critiques.

## Configuration

| Clé                  | Valeur par défaut | Plage / valeurs                             | Signification                                                        |
| -------------------- | ----------------- | ------------------------------------------- | -------------------------------------------------------------------- |
| `enabled`            | `true`            | boolean                                     | Active le Plugin après le chargement de l’entrée du Plugin.          |
| `autoCapture`        | `true`            | boolean                                     | Active la capture/révision après échange sur les tours d’agent réussis. |
| `approvalPolicy`     | `"pending"`       | `"pending"`, `"auto"`                       | Mettre les propositions en file ou écrire automatiquement les propositions sûres. |
| `reviewMode`         | `"hybrid"`        | `"off"`, `"heuristic"`, `"llm"`, `"hybrid"` | Choisit la capture de corrections explicites, le réviseur LLM, les deux ou aucun. |
| `reviewInterval`     | `15`              | `1..200`                                    | Exécute le réviseur après ce nombre de tours réussis.                |
| `reviewMinToolCalls` | `8`               | `1..500`                                    | Exécute le réviseur après ce nombre d’appels d’outils observés.      |
| `reviewTimeoutMs`    | `45000`           | `5000..180000`                              | Délai d’expiration pour l’exécution du réviseur intégré.             |
| `maxPending`         | `50`              | `1..200`                                    | Nombre maximal de propositions en attente/en quarantaine conservées par espace de travail. |
| `maxSkillBytes`      | `40000`           | `1024..200000`                              | Taille maximale du Skill/fichier de support généré.                  |

Profils recommandés :

```json5
// Conservative: explicit tool use only, no automatic capture.
{
  autoCapture: false,
  approvalPolicy: "pending",
  reviewMode: "off",
}
```

```json5
// Review-first: capture automatically, but require approval.
{
  autoCapture: true,
  approvalPolicy: "pending",
  reviewMode: "hybrid",
}
```

```json5
// Trusted automation: write safe proposals immediately.
{
  autoCapture: true,
  approvalPolicy: "auto",
  reviewMode: "hybrid",
}
```

```json5
// Low-cost: no reviewer LLM call, only explicit correction phrases.
{
  autoCapture: true,
  approvalPolicy: "pending",
  reviewMode: "heuristic",
}
```

## Chemins de capture

Skill Workshop dispose de trois chemins de capture.

### Suggestions d’outils

Le modèle peut appeler directement `skill_workshop` lorsqu’il voit une procédure réutilisable ou lorsque l’utilisateur lui demande d’enregistrer/mettre à jour un Skill.

C’est le chemin le plus explicite et il fonctionne même avec `autoCapture: false`.

### Capture heuristique

Lorsque `autoCapture` est activé et que `reviewMode` vaut `heuristic` ou `hybrid`, le Plugin analyse les tours réussis à la recherche de formulations explicites de correction par l’utilisateur :

- `next time`
- `from now on`
- `remember to`
- `make sure to`
- `always ... use/check/verify/record/save/prefer`
- `prefer ... when/for/instead/use`
- `when asked`

L’heuristique crée une proposition à partir de la dernière instruction utilisateur correspondante. Elle utilise des indices de sujet pour choisir des noms de Skills pour les workflows courants :

- tâches de GIF animés -> `animated-gif-workflow`
- tâches de capture d’écran ou de ressources -> `screenshot-asset-workflow`
- tâches QA ou de scénario -> `qa-scenario-workflow`
- tâches de PR GitHub -> `github-pr-workflow`
- repli -> `learned-workflows`

La capture heuristique est intentionnellement étroite. Elle est destinée aux corrections claires et aux notes de processus répétables, pas à la synthèse générale de transcriptions.

### Réviseur LLM

Lorsque `autoCapture` est activé et que `reviewMode` vaut `llm` ou `hybrid`, le Plugin exécute un réviseur intégré compact une fois les seuils atteints.

Le réviseur reçoit :

- le texte récent de la transcription, limité aux 12 000 derniers caractères
- jusqu’à 12 Skills d’espace de travail existants
- jusqu’à 2 000 caractères de chaque Skill existant
- des instructions JSON uniquement

Le réviseur ne dispose d’aucun outil :

- `disableTools: true`
- `toolsAllow: []`
- `disableMessageTool: true`

Le réviseur renvoie soit `{ "action": "none" }`, soit une proposition. Le champ `action` est `create`, `append` ou `replace` - privilégiez `append`/`replace` lorsqu’un Skill pertinent existe déjà ; utilisez `create` uniquement lorsqu’aucun Skill existant ne convient.

Exemple `create` :

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

`append` ajoute `section` + `body`. `replace` remplace `oldText` par `newText` dans le Skill nommé.

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
- `source` : `tool`, `agent_end` ou `reviewer`
- `status`
- `change`
- `scanFindings` facultatif
- `quarantineReason` facultatif

Statuts des propositions :

- `pending` - en attente d’approbation
- `applied` - écrit dans `<workspace>/skills`
- `rejected` - rejeté par l’opérateur/le modèle
- `quarantined` - bloqué par des résultats critiques du scanner

L’état est stocké par espace de travail dans le répertoire d’état du Gateway :

```text
<stateDir>/skill-workshop/<workspace-hash>.json
```

Les propositions en attente et mises en quarantaine sont dédupliquées par nom de skill et par charge utile de changement. Le magasin conserve les propositions en attente/mises en quarantaine les plus récentes jusqu’à `maxPending`.

## Référence de l’outil

Le Plugin enregistre un outil d’agent :

```text
skill_workshop
```

### `status`

Compter les propositions par état pour l’espace de travail actif.

```json
{ "action": "status" }
```

Forme du résultat :

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

Pour lister un autre état :

```json
{ "action": "list_pending", "status": "applied" }
```

Valeurs `status` valides :

- `pending`
- `applied`
- `rejected`
- `quarantined`

### `list_quarantine`

Lister les propositions mises en quarantaine.

```json
{ "action": "list_quarantine" }
```

Utilisez ceci lorsque la capture automatique semble ne rien faire et que les journaux mentionnent `skill-workshop: quarantined <skill>`.

### `inspect`

Récupérer une proposition par identifiant.

```json
{
  "action": "inspect",
  "id": "proposal-id"
}
```

### `suggest`

Créer une proposition. Avec `approvalPolicy: "pending"` (par défaut), cela la met en file d’attente au lieu d’écrire.

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

<AccordionGroup>
  <Accordion title="Demander une écriture immédiate en mode automatique (apply: true)">

```json
{
  "action": "suggest",
  "apply": true,
  "skillName": "animated-gif-workflow",
  "description": "Validate animated GIF assets before using them.",
  "body": "## Workflow\n\n- Verify true animation.\n- Record attribution."
}
```

Avec `approvalPolicy: "pending"`, `apply: true` met toujours la proposition en file d’attente. Examinez-la, puis utilisez l’action `apply` après approbation.

  </Accordion>

  <Accordion title="Forcer l’attente avec une politique automatique (apply: false)">

```json
{
  "action": "suggest",
  "apply": false,
  "skillName": "screenshot-asset-workflow",
  "description": "Screenshot replacement workflow.",
  "body": "## Workflow\n\n- Verify dimensions.\n- Optimize the PNG.\n- Run the relevant gate."
}
```

  </Accordion>

  <Accordion title="Ajouter à une section nommée">

```json
{
  "action": "suggest",
  "skillName": "qa-scenario-workflow",
  "section": "Workflow",
  "description": "QA scenario workflow.",
  "body": "- For media QA, verify generated assets render and pass final assertions."
}
```

  </Accordion>

  <Accordion title="Remplacer le texte exact">

```json
{
  "action": "suggest",
  "skillName": "github-pr-workflow",
  "oldText": "- Check the PR.",
  "newText": "- Check unresolved review threads, CI status, linked issues, and changed files before deciding."
}
```

  </Accordion>
</AccordionGroup>

### `apply`

Appliquer une proposition en attente.

Avec `approvalPolicy: "pending"`, cette action demande l’approbation de l’opérateur avant d’écrire le skill de l’espace de travail.

```json
{
  "action": "apply",
  "id": "proposal-id"
}
```

`apply` refuse les propositions mises en quarantaine :

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

Écrire un fichier de support dans un répertoire de skill existant ou proposé.

Répertoires de support de premier niveau autorisés :

- `references/`
- `templates/`
- `scripts/`
- `assets/`

Exemple :

```json
{
  "action": "write_support_file",
  "skillName": "release-workflow",
  "relativePath": "references/checklist.md",
  "body": "# Release Checklist\n\n- Run release docs.\n- Verify changelog.\n"
}
```

Les fichiers de support sont limités à l’espace de travail, vérifiés par chemin, limités en octets par
`maxSkillBytes`, analysés et écrits de manière atomique.

## Écritures de Skills

Skill Workshop écrit uniquement sous :

```text
<workspace>/skills/<normalized-skill-name>/
```

Les noms de skill sont normalisés :

- convertis en minuscules
- les séquences non `[a-z0-9_-]` deviennent `-`
- les caractères non alphanumériques de début/fin sont supprimés
- la longueur maximale est de 80 caractères
- le nom final doit correspondre à `[a-z0-9][a-z0-9_-]{1,79}`

Pour `create` :

- si la skill n’existe pas, Skill Workshop écrit un nouveau `SKILL.md`
- si elle existe déjà, Skill Workshop ajoute le corps à `## Workflow`

Pour `append` :

- si la skill existe, Skill Workshop ajoute à la section demandée
- si elle n’existe pas, Skill Workshop crée une skill minimale puis ajoute le contenu

Pour `replace` :

- la skill doit déjà exister
- `oldText` doit être présent exactement
- seule la première correspondance exacte est remplacée

Toutes les écritures sont atomiques et actualisent immédiatement l’instantané des skills en mémoire, afin que
la skill nouvelle ou mise à jour puisse devenir visible sans redémarrage du Gateway.

## Modèle de sécurité

Skill Workshop dispose d’un analyseur de sécurité sur le contenu `SKILL.md` généré et les fichiers de support.

Les constats critiques mettent les propositions en quarantaine :

| ID de règle                            | Bloque le contenu qui...                                             |
| -------------------------------------- | -------------------------------------------------------------------- |
| `prompt-injection-ignore-instructions` | demande à l’agent d’ignorer les instructions précédentes/supérieures |
| `prompt-injection-system`              | référence les prompts système, les messages développeur ou les instructions cachées |
| `prompt-injection-tool`                | encourage à contourner les permissions/approbations d’outils         |
| `shell-pipe-to-shell`                  | inclut `curl`/`wget` redirigé vers `sh`, `bash` ou `zsh`             |
| `secret-exfiltration`                  | semble envoyer des données env/process env sur le réseau             |

Les constats d’avertissement sont conservés mais ne bloquent pas à eux seuls :

| ID de règle          | Avertit sur...                              |
| -------------------- | ------------------------------------------ |
| `destructive-delete` | commandes larges de type `rm -rf`          |
| `unsafe-permissions` | utilisation de permissions de type `chmod 777` |

Les propositions mises en quarantaine :

- conservent `scanFindings`
- conservent `quarantineReason`
- apparaissent dans `list_quarantine`
- ne peuvent pas être appliquées via `apply`

Pour récupérer après une proposition mise en quarantaine, créez une nouvelle proposition sûre avec le
contenu dangereux supprimé. Ne modifiez pas le JSON du magasin à la main.

## Conseils de prompt

Lorsqu’il est activé, Skill Workshop injecte une courte section de prompt qui indique à l’agent
d’utiliser `skill_workshop` pour une mémoire procédurale durable.

Les conseils mettent l’accent sur :

- les procédures, pas les faits/préférences
- les corrections de l’utilisateur
- les procédures réussies non évidentes
- les pièges récurrents
- la réparation des skills obsolètes/minces/erronées via append/replace
- l’enregistrement d’une procédure réutilisable après de longues boucles d’outils ou des corrections difficiles
- un texte de skill court et impératif
- aucun vidage de transcription

Le texte du mode d’écriture change avec `approvalPolicy` :

- mode pending : mettre les suggestions en file d’attente ; utiliser `apply` après approbation explicite
- mode auto : appliquer les mises à jour de skills d’espace de travail sûres, sauf si `apply: false` les met plutôt en file d’attente

## Coûts et comportement d’exécution

La capture heuristique n’appelle pas de modèle.

La revue LLM utilise une exécution intégrée sur le modèle d’agent actif/par défaut. Elle est
basée sur des seuils, elle ne s’exécute donc pas à chaque tour par défaut.

Le réviseur :

- utilise le même contexte fournisseur/modèle configuré lorsqu’il est disponible
- se rabat sur les valeurs par défaut de l’agent d’exécution
- possède `reviewTimeoutMs`
- utilise un contexte d’amorçage léger
- n’a aucun outil
- n’écrit rien directement
- ne peut qu’émettre une proposition qui passe par le chemin normal d’analyse et
  d’approbation/quarantaine

Si le réviseur échoue, expire ou renvoie du JSON invalide, le Plugin journalise un
message d’avertissement/débogage et ignore cette passe de revue.

## Schémas d’utilisation

Utilisez Skill Workshop lorsque l’utilisateur dit :

- « la prochaine fois, fais X »
- « à partir de maintenant, préfère Y »
- « assure-toi de vérifier Z »
- « enregistre ceci comme workflow »
- « cela a pris du temps ; mémorise le processus »
- « mets à jour la skill locale pour ceci »

Bon texte de skill :

```markdown
## Workflow

- Verify the GIF URL resolves to `image/gif`.
- Confirm the file has multiple frames.
- Record source URL, license, and attribution.
- Store a local copy when the asset will ship with the product.
- Verify the local asset renders in the target UI before final reply.
```

Mauvais texte de skill :

```markdown
The user asked about a GIF and I searched two websites. Then one was blocked by
Cloudflare. The final answer said to check attribution.
```

Raisons pour lesquelles la mauvaise version ne doit pas être enregistrée :

- en forme de transcription
- non impérative
- inclut des détails ponctuels bruyants
- n’indique pas au prochain agent quoi faire

## Débogage

Vérifiez si le Plugin est chargé :

```bash
openclaw plugins list --enabled
```

Vérifiez les nombres de propositions depuis un contexte agent/outil :

```json
{ "action": "status" }
```

Inspectez les propositions en attente :

```json
{ "action": "list_pending" }
```

Inspectez les propositions mises en quarantaine :

```json
{ "action": "list_quarantine" }
```

Symptômes courants :

| Symptôme                              | Cause probable                                                                    | Vérification                                                        |
| ------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| L’outil est indisponible              | L’entrée du Plugin n’est pas activée                                              | `plugins.entries.skill-workshop.enabled` et `openclaw plugins list` |
| Aucune proposition automatique n’apparaît | `autoCapture: false`, `reviewMode: "off"` ou seuils non atteints              | Configuration, statut des propositions, journaux du Gateway         |
| L’heuristique n’a pas capturé         | La formulation de l’utilisateur ne correspondait pas aux schémas de correction    | Utiliser explicitement `skill_workshop.suggest` ou activer le réviseur LLM |
| Le réviseur n’a pas créé de proposition | Le réviseur a renvoyé `none`, du JSON invalide ou a expiré                      | Journaux du Gateway, `reviewTimeoutMs`, seuils                      |
| La proposition n’est pas appliquée    | `approvalPolicy: "pending"`                                                       | `list_pending`, puis `apply`                                        |
| La proposition a disparu de pending   | Proposition dupliquée réutilisée, élagage max pending, ou appliquée/rejetée/mise en quarantaine | `status`, `list_pending` avec filtres de statut, `list_quarantine` |
| Le fichier de skill existe mais le modèle l’ignore | Instantané de skill non actualisé ou gating de skill qui l’exclut        | statut `openclaw skills` et éligibilité de la skill d’espace de travail |

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

Exécutez la couverture déterministe :

```bash
pnpm openclaw qa suite \
  --scenario skill-workshop-animated-gif-autocreate \
  --scenario skill-workshop-pending-approval \
  --concurrency 1
```

Exécutez la couverture du réviseur :

```bash
pnpm openclaw qa suite \
  --scenario skill-workshop-reviewer-autonomous \
  --concurrency 1
```

Le scénario du réviseur est intentionnellement séparé, car il active
`reviewMode: "llm"` et exerce la passe du réviseur intégré.

## Quand ne pas activer l’application automatique

Évitez `approvalPolicy: "auto"` lorsque :

- l’espace de travail contient des procédures sensibles
- l’agent travaille sur une entrée non fiable
- les skills sont partagées au sein d’une grande équipe
- vous ajustez encore les prompts ou les règles de l’analyseur
- le modèle traite fréquemment du contenu web/e-mail hostile

Utilisez d’abord le mode pending. Passez au mode auto uniquement après avoir examiné le type de
skills que l’agent propose dans cet espace de travail.

## Docs associés

- [Skills](/fr/tools/skills)
- [Plugins](/fr/tools/plugin)
- [Tests](/fr/reference/test)
