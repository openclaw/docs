---
read_when:
    - Vous voulez que les agents transforment les corrections ou les procédures réutilisables en Skills d’espace de travail
    - Vous configurez la mémoire de compétence procédurale
    - Vous déboguez le comportement de l’outil skill_workshop
    - Vous décidez s’il faut activer la création automatique de Skills
summary: Capture expérimentale de procédures réutilisables en tant que Skills d’espace de travail, avec examen, approbation, quarantaine et actualisation à chaud des Skills
title: Plugin d’atelier Skill
x-i18n:
    generated_at: "2026-05-06T07:34:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 03c4259777823d256bd00374858b9f47d310e727db360db37f9ba7ad3583d9dc
    source_path: plugins/skill-workshop.md
    workflow: 16
---

L’atelier de Skills est **expérimental**. Il est désactivé par défaut, ses heuristiques de capture et ses prompts de relecture peuvent changer entre les versions, et les écritures automatiques ne doivent être utilisées que dans des espaces de travail fiables après avoir d’abord examiné la sortie en mode attente.

L’atelier de Skills est une mémoire procédurale pour les Skills d’espace de travail. Il permet à un agent de transformer des workflows réutilisables, des corrections utilisateur, des correctifs durement acquis et des pièges récurrents en fichiers `SKILL.md` sous :

```text
<workspace>/skills/<skill-name>/SKILL.md
```

C’est différent de la mémoire à long terme :

- **Mémoire** stocke les faits, préférences, entités et contextes passés.
- **Skills** stocke les procédures réutilisables que l’agent doit suivre lors de tâches futures.
- **L’atelier de Skills** fait le lien entre un échange utile et une Skill d’espace de travail durable, avec des contrôles de sécurité et une approbation facultative.

L’atelier de Skills est utile lorsque l’agent apprend une procédure telle que :

- comment valider des ressources GIF animées provenant de sources externes
- comment remplacer des ressources de capture d’écran et vérifier les dimensions
- comment exécuter un scénario QA propre à un dépôt
- comment déboguer une panne récurrente de fournisseur
- comment réparer une note de workflow local obsolète

Il n’est pas destiné à :

- des faits comme « l’utilisateur aime le bleu »
- une mémoire autobiographique large
- l’archivage brut de transcriptions
- des secrets, identifiants ou texte de prompt masqué
- des instructions ponctuelles qui ne se répéteront pas

## État par défaut

Le Plugin intégré est **expérimental** et **désactivé par défaut**, sauf s’il est explicitement activé dans `plugins.entries.skill-workshop`.

Le manifeste du Plugin ne définit pas `enabledByDefault: true`. La valeur par défaut `enabled: true` dans le schéma de configuration du Plugin s’applique uniquement après que l’entrée du Plugin a déjà été sélectionnée et chargée.

Expérimental signifie :

- le Plugin est suffisamment pris en charge pour les tests opt-in et le dogfooding
- le stockage des propositions, les seuils de relecture et les heuristiques de capture peuvent évoluer
- l’approbation en attente est le mode de démarrage recommandé
- l’application automatique est destinée aux configurations personnelles/d’espace de travail fiables, pas aux environnements partagés ou hostiles riches en entrées

## Activer

Configuration sûre minimale :

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
- les corrections réutilisables explicites sont mises en file d’attente comme propositions en attente
- les passes de relecture basées sur des seuils peuvent proposer des mises à jour de Skills
- aucun fichier de Skill n’est écrit tant qu’une proposition en attente n’est pas appliquée

Utilisez les écritures automatiques uniquement dans des espaces de travail fiables :

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

`approvalPolicy: "auto"` utilise toujours le même chemin d’analyse et de quarantaine. Il n’applique pas les propositions comportant des constatations critiques.

## Configuration

| Clé                  | Par défaut  | Plage / valeurs                            | Signification                                                        |
| -------------------- | ----------- | ------------------------------------------- | -------------------------------------------------------------------- |
| `enabled`            | `true`      | booléen                                     | Active le Plugin après le chargement de l’entrée du Plugin.          |
| `autoCapture`        | `true`      | booléen                                     | Active la capture/relecture après échange pour les échanges d’agent réussis. |
| `approvalPolicy`     | `"pending"` | `"pending"`, `"auto"`                       | Met les propositions en file d’attente ou écrit automatiquement les propositions sûres. |
| `reviewMode`         | `"hybrid"`  | `"off"`, `"heuristic"`, `"llm"`, `"hybrid"` | Choisit la capture de corrections explicites, la relecture LLM, les deux ou aucun des deux. |
| `reviewInterval`     | `15`        | `1..200`                                    | Exécute la relecture après ce nombre d’échanges réussis.             |
| `reviewMinToolCalls` | `8`         | `1..500`                                    | Exécute la relecture après ce nombre d’appels d’outils observés.     |
| `reviewTimeoutMs`    | `45000`     | `5000..180000`                              | Délai d’expiration pour l’exécution de la relecture intégrée.        |
| `maxPending`         | `50`        | `1..200`                                    | Nombre maximal de propositions en attente/en quarantaine conservées par espace de travail. |
| `maxSkillBytes`      | `40000`     | `1024..200000`                              | Taille maximale du fichier de Skill/support généré.                  |

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
// Relecture d’abord : capturer automatiquement, mais exiger l’approbation.
{
  autoCapture: true,
  approvalPolicy: "pending",
  reviewMode: "hybrid",
}
```

```json5
// Automatisation fiable : écrire immédiatement les propositions sûres.
{
  autoCapture: true,
  approvalPolicy: "auto",
  reviewMode: "hybrid",
}
```

```json5
// Faible coût : aucun appel LLM de relecture, uniquement des formulations de correction explicites.
{
  autoCapture: true,
  approvalPolicy: "pending",
  reviewMode: "heuristic",
}
```

## Chemins de capture

L’atelier de Skills dispose de trois chemins de capture.

### Suggestions d’outil

Le modèle peut appeler `skill_workshop` directement lorsqu’il voit une procédure réutilisable ou lorsque l’utilisateur lui demande d’enregistrer/mettre à jour une Skill.

C’est le chemin le plus explicite et il fonctionne même avec `autoCapture: false`.

### Capture heuristique

Lorsque `autoCapture` est activé et que `reviewMode` est `heuristic` ou `hybrid`, le Plugin analyse les échanges réussis à la recherche de formulations explicites de correction utilisateur :

- `next time`
- `from now on`
- `remember to`
- `make sure to`
- `always ... use/check/verify/record/save/prefer`
- `prefer ... when/for/instead/use`
- `when asked`

L’heuristique crée une proposition à partir de la dernière instruction utilisateur correspondante. Elle utilise des indices de sujet pour choisir les noms de Skills pour les workflows courants :

- tâches de GIF animé -> `animated-gif-workflow`
- tâches de capture d’écran ou de ressources -> `screenshot-asset-workflow`
- tâches QA ou de scénario -> `qa-scenario-workflow`
- tâches de PR GitHub -> `github-pr-workflow`
- solution de repli -> `learned-workflows`

La capture heuristique est intentionnellement étroite. Elle est destinée aux corrections claires et aux notes de processus répétables, pas à la synthèse générale de transcriptions.

### Relecteur LLM

Lorsque `autoCapture` est activé et que `reviewMode` est `llm` ou `hybrid`, le Plugin exécute une relecture intégrée compacte une fois les seuils atteints.

Le relecteur reçoit :

- le texte récent de la transcription, limité aux 12 000 derniers caractères
- jusqu’à 12 Skills d’espace de travail existantes
- jusqu’à 2 000 caractères de chaque Skill existante
- des instructions JSON uniquement

Le relecteur n’a pas d’outils :

- `disableTools: true`
- `toolsAllow: []`
- `disableMessageTool: true`

Le relecteur renvoie soit `{ "action": "none" }`, soit une proposition. Le champ `action` est `create`, `append` ou `replace` - préférez `append`/`replace` lorsqu’une Skill pertinente existe déjà ; utilisez `create` uniquement lorsqu’aucune Skill existante ne convient.

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

`append` ajoute `section` + `body`. `replace` remplace `oldText` par `newText` dans la Skill nommée.

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

L’état est stocké par espace de travail dans le répertoire d’état du Gateway :

```text
<stateDir>/skill-workshop/<workspace-hash>.json
```

Les propositions en attente et mises en quarantaine sont dédupliquées par nom de skill et charge utile de changement. Le magasin conserve les propositions en attente/mises en quarantaine les plus récentes jusqu’à `maxPending`.

## Référence des outils

Le Plugin enregistre un outil d’agent :

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

Valeurs `status` valides :

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

Créer une proposition. Avec `approvalPolicy: "pending"` (par défaut), cela met en file d’attente au lieu d’écrire.

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
  <Accordion title="Force a safe write (apply: true)">

```json
{
  "action": "suggest",
  "apply": true,
  "skillName": "animated-gif-workflow",
  "description": "Validate animated GIF assets before using them.",
  "body": "## Workflow\n\n- Verify true animation.\n- Record attribution."
}
```

  </Accordion>

  <Accordion title="Force pending under auto policy (apply: false)">

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

  <Accordion title="Append to a named section">

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

  <Accordion title="Replace exact text">

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

```json
{
  "action": "apply",
  "id": "proposal-id"
}
```

`apply` refuse les propositions mises en quarantaine :

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

Répertoires de support de premier niveau autorisés :

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

Les fichiers de support sont limités à l’espace de travail, vérifiés par chemin, limités en octets par
`maxSkillBytes`, analysés et écrits atomiquement.

## Écritures de skill

Skill Workshop écrit uniquement sous :

```text
<workspace>/skills/<normalized-skill-name>/
```

Les noms de skill sont normalisés :

- convertis en minuscules
- les séquences non `[a-z0-9_-]` deviennent `-`
- les caractères non alphanumériques en début/fin sont supprimés
- la longueur maximale est de 80 caractères
- le nom final doit correspondre à `[a-z0-9][a-z0-9_-]{1,79}`

Pour `create` :

- si le skill n’existe pas, Skill Workshop écrit un nouveau `SKILL.md`
- s’il existe déjà, Skill Workshop ajoute le corps à `## Workflow`

Pour `append` :

- si le skill existe, Skill Workshop ajoute le contenu à la section demandée
- s’il n’existe pas, Skill Workshop crée un skill minimal puis ajoute le contenu

Pour `replace` :

- le skill doit déjà exister
- `oldText` doit être présent exactement
- seule la première correspondance exacte est remplacée

Toutes les écritures sont atomiques et actualisent immédiatement l’instantané des skills en mémoire, de sorte que
le skill nouveau ou mis à jour peut devenir visible sans redémarrage du Gateway.

## Modèle de sécurité

Skill Workshop dispose d’un analyseur de sécurité sur le contenu `SKILL.md` généré et les fichiers de support.

Les résultats critiques mettent les propositions en quarantaine :

| ID de règle                             | Bloque le contenu qui...                                            |
| -------------------------------------- | ------------------------------------------------------------------- |
| `prompt-injection-ignore-instructions` | demande à l’agent d’ignorer les instructions antérieures/supérieures |
| `prompt-injection-system`              | référence des invites système, messages développeur ou instructions cachées |
| `prompt-injection-tool`                | encourage le contournement des autorisations/approbations d’outils  |
| `shell-pipe-to-shell`                  | inclut `curl`/`wget` redirigé vers `sh`, `bash` ou `zsh`            |
| `secret-exfiltration`                  | semble envoyer des données d’env/process env sur le réseau          |

Les avertissements sont conservés mais ne bloquent pas à eux seuls :

| ID de règle          | Avertit sur...                         |
| -------------------- | -------------------------------------- |
| `destructive-delete` | commandes larges de type `rm -rf`      |
| `unsafe-permissions` | utilisation de permissions de type `chmod 777` |

Les propositions mises en quarantaine :

- conservent `scanFindings`
- conservent `quarantineReason`
- apparaissent dans `list_quarantine`
- ne peuvent pas être appliquées via `apply`

Pour récupérer après une proposition mise en quarantaine, créez une nouvelle proposition sûre avec le
contenu dangereux supprimé. Ne modifiez pas manuellement le JSON de stockage.

## Conseils d’invite

Lorsqu’il est activé, Skill Workshop injecte une courte section d’invite qui indique à l’agent
d’utiliser `skill_workshop` pour la mémoire procédurale durable.

Les conseils mettent l’accent sur :

- les procédures, pas les faits/préférences
- les corrections utilisateur
- les procédures réussies non évidentes
- les pièges récurrents
- la réparation de skills obsolètes/minces/incorrects par ajout/remplacement
- l’enregistrement d’une procédure réutilisable après de longues boucles d’outils ou des corrections difficiles
- un texte de skill court et impératif
- aucun vidage de transcription

Le texte du mode d’écriture change avec `approvalPolicy` :

- mode pending : mettre les suggestions en file d’attente ; appliquer uniquement après approbation explicite
- mode auto : appliquer les mises à jour sûres de skills d’espace de travail lorsqu’elles sont clairement réutilisables

## Coûts et comportement d’exécution

La capture heuristique n’appelle pas de modèle.

La revue LLM utilise une exécution intégrée sur le modèle d’agent actif/par défaut. Elle est
basée sur des seuils, donc elle ne s’exécute pas à chaque tour par défaut.

Le réviseur :

- utilise le même contexte de fournisseur/modèle configuré lorsqu’il est disponible
- se rabat sur les valeurs par défaut de l’agent d’exécution
- dispose de `reviewTimeoutMs`
- utilise un contexte d’amorçage léger
- n’a aucun outil
- n’écrit rien directement
- peut uniquement émettre une proposition qui passe par l’analyseur normal et le
  chemin d’approbation/quarantaine

Si le réviseur échoue, expire ou renvoie un JSON invalide, le Plugin journalise un
message warning/debug et ignore ce passage de revue.

## Modèles d’utilisation

Utilisez Skill Workshop lorsque l’utilisateur dit :

- « la prochaine fois, fais X »
- « désormais, privilégie Y »
- « assure-toi de vérifier Z »
- « enregistre ceci comme workflow »
- « cela a pris du temps ; mémorise le processus »
- « mets à jour le skill local pour ceci »

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

Vérifier si le Plugin est chargé :

```bash
openclaw plugins list --enabled
```

Vérifier le nombre de propositions depuis un contexte d’agent/outil :

```json
{ "action": "status" }
```

Inspecter les propositions en attente :

```json
{ "action": "list_pending" }
```

Inspecter les propositions mises en quarantaine :

```json
{ "action": "list_quarantine" }
```

Symptômes courants :

| Symptôme                             | Cause probable                                                                      | Vérification                                                         |
| ------------------------------------ | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| L’outil est indisponible             | L’entrée de Plugin n’est pas activée                                                | `plugins.entries.skill-workshop.enabled` et `openclaw plugins list` |
| Aucune proposition automatique n’apparaît | `autoCapture: false`, `reviewMode: "off"` ou seuils non atteints                    | Configuration, statut des propositions, journaux du Gateway          |
| L’heuristique n’a pas capturé        | La formulation utilisateur ne correspondait pas aux modèles de correction           | Utiliser explicitement `skill_workshop.suggest` ou activer le réviseur LLM |
| Le réviseur n’a pas créé de proposition | Le réviseur a renvoyé `none`, un JSON invalide ou a expiré                          | Journaux du Gateway, `reviewTimeoutMs`, seuils                       |
| La proposition n’est pas appliquée   | `approvalPolicy: "pending"`                                                         | `list_pending`, puis `apply`                                         |
| La proposition a disparu des éléments en attente | Proposition dupliquée réutilisée, élagage maximal des éléments en attente, ou appliquée/rejetée/mise en quarantaine | `status`, `list_pending` avec filtres de statut, `list_quarantine`   |
| Le fichier de skill existe mais le modèle ne le voit pas | L’instantané de skill n’est pas actualisé ou le filtrage de skills l’exclut          | statut `openclaw skills` et éligibilité du skill d’espace de travail |

Journaux pertinents :

- `skill-workshop: queued <skill>`
- `skill-workshop: applied <skill>`
- `skill-workshop: quarantined <skill>`
- `skill-workshop: heuristic capture skipped: ...`
- `skill-workshop: reviewer skipped: ...`
- `skill-workshop: reviewer found no update`

## Scénarios de QA

Scénarios de QA adossés au dépôt :

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

Exécuter la couverture du réviseur :

```bash
pnpm openclaw qa suite \
  --scenario skill-workshop-reviewer-autonomous \
  --concurrency 1
```

Le scénario du réviseur est intentionnellement séparé, car il active
`reviewMode: "llm"` et exerce le passage du réviseur intégré.

## Quand ne pas activer l’application automatique

Évitez `approvalPolicy: "auto"` lorsque :

- l’espace de travail contient des procédures sensibles
- l’agent travaille sur une entrée non fiable
- les skills sont partagés au sein d’une grande équipe
- vous êtes encore en train d’ajuster les invites ou les règles de l’analyseur
- le modèle traite fréquemment du contenu web/e-mail hostile

Utilisez d’abord le mode pending. Passez au mode auto uniquement après avoir examiné le type de
skills que l’agent propose dans cet espace de travail.

## Docs connexes

- [Skills](/fr/tools/skills)
- [Plugins](/fr/tools/plugin)
- [Tests](/fr/reference/test)
