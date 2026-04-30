---
read_when:
    - Ajout ou modification du CLI des modèles (models list/set/scan/aliases/fallbacks)
    - Modifier le comportement de repli du modèle ou l’expérience utilisateur de sélection
    - Mise à jour des sondes d’analyse de modèles (outils/images)
sidebarTitle: Models CLI
summary: 'CLI des modèles : lister, définir, alias, solutions de repli, analyser, état'
title: CLI des modèles
x-i18n:
    generated_at: "2026-04-30T07:22:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 64b97ddfcc6f804044580dfc9a441d426f737e9e7d007d78b0b045a52068b34f
    source_path: concepts/models.md
    workflow: 16
---

<CardGroup cols={2}>
  <Card title="Basculement de modèle" href="/fr/concepts/model-failover">
    Rotation des profils d'authentification, délais de récupération et interaction avec les replis.
  </Card>
  <Card title="Fournisseurs de modèles" href="/fr/concepts/model-providers">
    Aperçu rapide des fournisseurs et exemples.
  </Card>
  <Card title="Environnements d'exécution d'agents" href="/fr/concepts/agent-runtimes">
    PI, Codex et autres environnements d'exécution de boucle d'agent.
  </Card>
  <Card title="Référence de configuration" href="/fr/gateway/config-agents#agent-defaults">
    Clés de configuration des modèles.
  </Card>
</CardGroup>

Les références de modèle choisissent un fournisseur et un modèle. Elles ne choisissent généralement pas l'environnement d'exécution d'agent de bas niveau. Par exemple, `openai/gpt-5.5` peut s'exécuter via le chemin normal du fournisseur OpenAI ou via l'environnement d'exécution du serveur d'application Codex, selon `agents.defaults.agentRuntime.id`. Voir [Environnements d'exécution d'agents](/fr/concepts/agent-runtimes).

## Fonctionnement de la sélection de modèle

OpenClaw sélectionne les modèles dans cet ordre :

<Steps>
  <Step title="Modèle principal">
    `agents.defaults.model.primary` (ou `agents.defaults.model`).
  </Step>
  <Step title="Replis">
    `agents.defaults.model.fallbacks` (dans l'ordre).
  </Step>
  <Step title="Basculement d'authentification du fournisseur">
    Le basculement d'authentification se produit au sein d'un fournisseur avant de passer au modèle suivant.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Surfaces de modèle associées">
    - `agents.defaults.models` est la liste d'autorisation/le catalogue des modèles qu'OpenClaw peut utiliser (ainsi que les alias).
    - `agents.defaults.imageModel` est utilisé **uniquement lorsque** le modèle principal ne peut pas accepter les images.
    - `agents.defaults.pdfModel` est utilisé par l'outil `pdf`. S'il est omis, l'outil se replie sur `agents.defaults.imageModel`, puis sur le modèle résolu de session/par défaut.
    - `agents.defaults.imageGenerationModel` est utilisé par la capacité partagée de génération d'images. S'il est omis, `image_generate` peut toujours déduire une valeur par défaut de fournisseur appuyée par l'authentification. Il essaie d'abord le fournisseur par défaut actuel, puis les autres fournisseurs de génération d'images enregistrés, dans l'ordre des identifiants de fournisseur. Si vous définissez un fournisseur/modèle spécifique, configurez aussi l'authentification/la clé API de ce fournisseur.
    - `agents.defaults.musicGenerationModel` est utilisé par la capacité partagée de génération de musique. S'il est omis, `music_generate` peut toujours déduire une valeur par défaut de fournisseur appuyée par l'authentification. Il essaie d'abord le fournisseur par défaut actuel, puis les autres fournisseurs de génération de musique enregistrés, dans l'ordre des identifiants de fournisseur. Si vous définissez un fournisseur/modèle spécifique, configurez aussi l'authentification/la clé API de ce fournisseur.
    - `agents.defaults.videoGenerationModel` est utilisé par la capacité partagée de génération de vidéos. S'il est omis, `video_generate` peut toujours déduire une valeur par défaut de fournisseur appuyée par l'authentification. Il essaie d'abord le fournisseur par défaut actuel, puis les autres fournisseurs de génération de vidéos enregistrés, dans l'ordre des identifiants de fournisseur. Si vous définissez un fournisseur/modèle spécifique, configurez aussi l'authentification/la clé API de ce fournisseur.
    - Les valeurs par défaut propres à chaque agent peuvent remplacer `agents.defaults.model` via `agents.list[].model` plus les liaisons (voir [Routage multi-agent](/fr/concepts/multi-agent)).

  </Accordion>
</AccordionGroup>

## Source de sélection et comportement de repli

Le même `provider/model` peut signifier des choses différentes selon son origine :

- Les valeurs par défaut configurées (`agents.defaults.model.primary` et les modèles principaux propres aux agents) sont le point de départ normal et utilisent `agents.defaults.model.fallbacks`.
- Les sélections de repli automatiques sont un état de récupération temporaire. Elles sont stockées avec `modelOverrideSource: "auto"` afin que les tours suivants puissent continuer à utiliser la chaîne de repli sans tester d'abord un modèle principal connu comme défaillant.
- Les sélections de session utilisateur sont exactes. `/model`, le sélecteur de modèle, `session_status(model=...)` et `sessions.patch` stockent `modelOverrideSource: "user"` ; si ce fournisseur/modèle sélectionné est inaccessible, OpenClaw échoue de manière visible au lieu de passer à un autre modèle configuré.
- Cron `--model` / charge utile `model` est un modèle principal par tâche. Il utilise toujours les replis configurés, sauf si la tâche fournit une charge utile explicite `fallbacks` (utilisez `fallbacks: []` pour une exécution cron stricte).
- Les sélecteurs de modèle par défaut et de liste d'autorisation de la CLI respectent `models.mode: "replace"` en listant les `models.providers.*.models` explicites au lieu de charger tout le catalogue intégré.
- Le sélecteur de modèle de l'interface de contrôle demande au Gateway sa vue de modèles configurée : `agents.defaults.models` lorsqu'elle est présente, sinon les `models.providers.*.models` explicites plus les fournisseurs avec une authentification utilisable. Le catalogue intégré complet est réservé aux vues de navigation explicites comme `models.list` avec `view: "all"` ou `openclaw models list --all`.

## Politique rapide de modèle

- Définissez votre modèle principal sur le modèle de dernière génération le plus puissant auquel vous avez accès.
- Utilisez les replis pour les tâches sensibles au coût/à la latence et les conversations à faibles enjeux.
- Pour les agents avec outils activés ou les entrées non fiables, évitez les niveaux de modèles plus anciens/plus faibles.

## Intégration (recommandé)

Si vous ne voulez pas modifier la configuration à la main, lancez l'intégration :

```bash
openclaw onboard
```

Elle peut configurer le modèle + l'authentification pour les fournisseurs courants, y compris **l'abonnement OpenAI Code (Codex)** (OAuth) et **Anthropic** (clé API ou CLI Claude).

## Clés de configuration (aperçu)

- `agents.defaults.model.primary` et `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` et `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` et `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` et `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` et `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (liste d'autorisation + alias + paramètres de fournisseur)
- `models.providers` (fournisseurs personnalisés écrits dans `models.json`)

<Note>
Les références de modèle sont normalisées en minuscules. Les alias de fournisseur comme `z.ai/*` sont normalisés en `zai/*`.

Les exemples de configuration de fournisseur (y compris OpenCode) se trouvent dans [OpenCode](/fr/providers/opencode).
</Note>

### Modifications sûres de la liste d'autorisation

Utilisez des écritures additives lorsque vous mettez à jour `agents.defaults.models` à la main :

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

<AccordionGroup>
  <Accordion title="Règles de protection contre l'écrasement">
    `openclaw config set` protège les cartes de modèles/fournisseurs contre les écrasements accidentels. Une affectation d'objet simple à `agents.defaults.models`, `models.providers` ou `models.providers.<id>.models` est rejetée lorsqu'elle supprimerait des entrées existantes. Utilisez `--merge` pour les changements additifs ; utilisez `--replace` uniquement lorsque la valeur fournie doit devenir la valeur cible complète.

    La configuration interactive des fournisseurs et `openclaw configure --section model` fusionnent aussi les sélections limitées au fournisseur dans la liste d'autorisation existante, afin que l'ajout de Codex, Ollama ou d'un autre fournisseur ne supprime pas les entrées de modèle non liées. La configuration conserve un `agents.defaults.model.primary` existant lorsque l'authentification du fournisseur est réappliquée. Les commandes explicites de définition par défaut comme `openclaw models auth login --provider <id> --set-default` et `openclaw models set <model>` remplacent toujours `agents.defaults.model.primary`.

  </Accordion>
</AccordionGroup>

## "Le modèle n'est pas autorisé" (et pourquoi les réponses s'arrêtent)

Si `agents.defaults.models` est défini, il devient la **liste d'autorisation** pour `/model` et pour les remplacements de session. Lorsqu'un utilisateur sélectionne un modèle qui n'est pas dans cette liste d'autorisation, OpenClaw renvoie :

```
Model "provider/model" is not allowed. Use /model to list available models.
```

<Warning>
Cela se produit **avant** qu'une réponse normale soit générée, le message peut donc donner l'impression qu'il "n'a pas répondu". La correction consiste soit à :

- Ajouter le modèle à `agents.defaults.models`, soit
- Effacer la liste d'autorisation (supprimer `agents.defaults.models`), soit
- Choisir un modèle depuis `/model list`.

</Warning>

Pour les modèles locaux/GGUF, stockez la référence complète préfixée par le fournisseur dans la liste d'autorisation,
par exemple `ollama/gemma4:26b`, `lmstudio/Gemma4-26b-a4-it-gguf` ou le
fournisseur/modèle exact affiché par `openclaw models list --provider <provider>`.
Les noms de fichiers locaux nus ou les noms d'affichage ne suffisent pas lorsque la liste d'autorisation est
active.

Exemple de configuration de liste d'autorisation :

```json5
{
  agent: {
    model: { primary: "anthropic/claude-sonnet-4-6" },
    models: {
      "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
      "anthropic/claude-opus-4-6": { alias: "Opus" },
    },
  },
}
```

## Changer de modèle dans la conversation (`/model`)

Vous pouvez changer de modèle pour la session actuelle sans redémarrer :

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model status
```

<AccordionGroup>
  <Accordion title="Comportement du sélecteur">
    - `/model` (et `/model list`) est un sélecteur compact numéroté (famille de modèles + fournisseurs disponibles).
    - Sur Discord, `/model` et `/models` ouvrent un sélecteur interactif avec des menus déroulants de fournisseur et de modèle, plus une étape de soumission.
    - `/models add` est obsolète et renvoie maintenant un message d'obsolescence au lieu d'enregistrer des modèles depuis la conversation.
    - `/model <#>` sélectionne depuis ce sélecteur.

  </Accordion>
  <Accordion title="Persistance et changement en direct">
    - `/model` persiste immédiatement la nouvelle sélection de session.
    - Si l'agent est inactif, la prochaine exécution utilise immédiatement le nouveau modèle.
    - Si une exécution est déjà active, OpenClaw marque un changement en direct comme en attente et ne redémarre dans le nouveau modèle qu'à un point de nouvelle tentative propre.
    - Si l'activité d'outil ou la sortie de réponse a déjà commencé, le changement en attente peut rester en file jusqu'à une occasion ultérieure de nouvelle tentative ou jusqu'au prochain tour utilisateur.
    - Une référence `/model` sélectionnée par l'utilisateur est stricte pour cette session : si le fournisseur/modèle sélectionné est inaccessible, la réponse échoue de manière visible au lieu de répondre silencieusement depuis `agents.defaults.model.fallbacks`. Cela diffère des valeurs par défaut configurées et des modèles principaux des tâches cron, qui peuvent toujours utiliser les chaînes de repli.
    - `/model status` est la vue détaillée (candidats d'authentification et, lorsqu'ils sont configurés, `baseUrl` de point de terminaison du fournisseur + mode `api`).

  </Accordion>
  <Accordion title="Analyse des références">
    - Les références de modèle sont analysées en coupant sur le **premier** `/`. Utilisez `provider/model` lorsque vous saisissez `/model <ref>`.
    - Si l'ID de modèle lui-même contient `/` (style OpenRouter), vous devez inclure le préfixe fournisseur (exemple : `/model openrouter/moonshotai/kimi-k2`).
    - Si vous omettez le fournisseur, OpenClaw résout l'entrée dans cet ordre :
      1. correspondance d'alias
      2. correspondance unique de fournisseur configuré pour cet ID de modèle exact sans préfixe
      3. repli obsolète vers le fournisseur par défaut configuré — si ce fournisseur n'expose plus le modèle par défaut configuré, OpenClaw se replie plutôt sur le premier fournisseur/modèle configuré afin d'éviter d'afficher une valeur par défaut périmée provenant d'un fournisseur supprimé.
  </Accordion>
</AccordionGroup>

Comportement/configuration complets des commandes : [Commandes slash](/fr/tools/slash-commands).

## Commandes CLI

```bash
openclaw models list
openclaw models status
openclaw models set <provider/model>
openclaw models set-image <provider/model>

openclaw models aliases list
openclaw models aliases add <alias> <provider/model>
openclaw models aliases remove <alias>

openclaw models fallbacks list
openclaw models fallbacks add <provider/model>
openclaw models fallbacks remove <provider/model>
openclaw models fallbacks clear

openclaw models image-fallbacks list
openclaw models image-fallbacks add <provider/model>
openclaw models image-fallbacks remove <provider/model>
openclaw models image-fallbacks clear
```

`openclaw models` (sans sous-commande) est un raccourci pour `models status`.

### `models list`

Affiche par défaut les modèles configurés/disponibles par authentification. Indicateurs utiles :

<ParamField path="--all" type="boolean">
  Catalogue complet. Inclut les lignes de catalogue statique intégré appartenant aux fournisseurs avant la configuration de l'authentification ; les vues de découverte uniquement peuvent donc afficher des modèles indisponibles tant que vous n'ajoutez pas les identifiants de fournisseur correspondants.
</ParamField>
<ParamField path="--local" type="boolean">
  Fournisseurs locaux uniquement.
</ParamField>
<ParamField path="--provider <id>" type="string">
  Filtrer par identifiant de fournisseur, par exemple `moonshot`. Les libellés d'affichage des sélecteurs interactifs ne sont pas acceptés.
</ParamField>
<ParamField path="--plain" type="boolean">
  Un modèle par ligne.
</ParamField>
<ParamField path="--json" type="boolean">
  Sortie lisible par machine.
</ParamField>

### `models status`

Affiche le modèle principal résolu, les modèles de repli, le modèle d’image et une vue d’ensemble de l’authentification des fournisseurs configurés. Affiche également l’état d’expiration OAuth pour les profils trouvés dans le magasin d’authentification (avertit dans les 24 h par défaut). `--plain` imprime uniquement le modèle principal résolu.

<AccordionGroup>
  <Accordion title="Authentification et comportement des sondes">
    - L’état OAuth est toujours affiché (et inclus dans la sortie `--json`). Si un fournisseur configuré ne dispose d’aucun identifiant, `models status` imprime une section **Authentification manquante**.
    - JSON inclut `auth.oauth` (fenêtre d’avertissement + profils) et `auth.providers` (authentification effective par fournisseur, y compris les identifiants issus de l’environnement). `auth.oauth` concerne uniquement la santé des profils du magasin d’authentification ; les fournisseurs uniquement configurés par l’environnement n’y apparaissent pas.
    - Utilisez `--check` pour l’automatisation (code de sortie `1` en cas d’identifiants manquants/expirés, `2` en cas d’expiration prochaine).
    - Utilisez `--probe` pour les vérifications d’authentification en direct ; les lignes de sonde peuvent provenir de profils d’authentification, d’identifiants d’environnement ou de `models.json`.
    - Si `auth.order.<provider>` explicite omet un profil stocké, la sonde signale `excluded_by_auth_order` au lieu d’essayer de l’utiliser. Si l’authentification existe mais qu’aucun modèle pouvant être sondé ne peut être résolu pour ce fournisseur, la sonde signale `status: no_model`.

  </Accordion>
</AccordionGroup>

<Note>
Le choix d’authentification dépend du fournisseur et du compte. Pour les hôtes Gateway toujours actifs, les clés d’API sont généralement les plus prévisibles ; la réutilisation de Claude CLI et les profils OAuth/jeton Anthropic existants sont également pris en charge.
</Note>

Exemple (Claude CLI) :

```bash
claude auth login
openclaw models status
```

## Analyse (modèles OpenRouter gratuits)

`openclaw models scan` inspecte le **catalogue des modèles gratuits** d’OpenRouter et peut éventuellement sonder les modèles pour la prise en charge des outils et des images.

<ParamField path="--no-probe" type="boolean">
  Ignore les sondes en direct (métadonnées uniquement).
</ParamField>
<ParamField path="--min-params <b>" type="number">
  Taille minimale des paramètres (en milliards).
</ParamField>
<ParamField path="--max-age-days <days>" type="number">
  Ignore les modèles plus anciens.
</ParamField>
<ParamField path="--provider <name>" type="string">
  Filtre par préfixe de fournisseur.
</ParamField>
<ParamField path="--max-candidates <n>" type="number">
  Taille de la liste de repli.
</ParamField>
<ParamField path="--set-default" type="boolean">
  Définit `agents.defaults.model.primary` sur la première sélection.
</ParamField>
<ParamField path="--set-image" type="boolean">
  Définit `agents.defaults.imageModel.primary` sur la première sélection d’image.
</ParamField>

<Note>
Le catalogue OpenRouter `/models` est public, les analyses limitées aux métadonnées peuvent donc lister les candidats gratuits sans clé. Les sondes et l’inférence nécessitent tout de même une clé d’API OpenRouter (issue des profils d’authentification ou de `OPENROUTER_API_KEY`). Si aucune clé n’est disponible, `openclaw models scan` revient à une sortie limitée aux métadonnées et laisse la configuration inchangée. Utilisez `--no-probe` pour demander explicitement le mode métadonnées uniquement.
</Note>

Les résultats d’analyse sont classés selon :

1. Prise en charge des images
2. Latence des outils
3. Taille du contexte
4. Nombre de paramètres

Entrée :

- Liste OpenRouter `/models` (filtre `:free`)
- Les sondes en direct nécessitent une clé d’API OpenRouter issue des profils d’authentification ou de `OPENROUTER_API_KEY` (voir [Variables d’environnement](/fr/help/environment))
- Filtres facultatifs : `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- Contrôles de requête/sonde : `--timeout`, `--concurrency`

Lorsque les sondes en direct s’exécutent dans un TUI, vous pouvez sélectionner les modèles de repli de manière interactive. En mode non interactif, passez `--yes` pour accepter les valeurs par défaut. Les résultats limités aux métadonnées sont informatifs ; `--set-default` et `--set-image` nécessitent des sondes en direct afin qu’OpenClaw ne configure pas un modèle OpenRouter inutilisable sans clé.

## Registre des modèles (`models.json`)

Les fournisseurs personnalisés dans `models.providers` sont écrits dans `models.json` sous le répertoire de l’agent (par défaut `~/.openclaw/agents/<agentId>/agent/models.json`). Ce fichier est fusionné par défaut, sauf si `models.mode` est défini sur `replace`.

<AccordionGroup>
  <Accordion title="Précédence du mode fusion">
    Précédence du mode fusion pour les ID de fournisseur correspondants :

    - Une valeur `baseUrl` non vide déjà présente dans le fichier `models.json` de l’agent l’emporte.
    - Une valeur `apiKey` non vide dans le fichier `models.json` de l’agent l’emporte uniquement lorsque ce fournisseur n’est pas géré par SecretRef dans le contexte de configuration/profil d’authentification actuel.
    - Les valeurs `apiKey` de fournisseur gérées par SecretRef sont actualisées à partir des marqueurs de source (`ENV_VAR_NAME` pour les références d’environnement, `secretref-managed` pour les références fichier/exec) au lieu de conserver les secrets résolus.
    - Les valeurs d’en-tête de fournisseur gérées par SecretRef sont actualisées à partir des marqueurs de source (`secretref-env:ENV_VAR_NAME` pour les références d’environnement, `secretref-managed` pour les références fichier/exec).
    - Une valeur `apiKey`/`baseUrl` vide ou manquante pour l’agent revient à `models.providers` de la configuration.
    - Les autres champs de fournisseur sont actualisés depuis la configuration et les données de catalogue normalisées.

  </Accordion>
</AccordionGroup>

<Note>
La persistance des marqueurs fait autorité depuis la source : OpenClaw écrit les marqueurs depuis l’instantané actif de la configuration source (avant résolution), et non depuis les valeurs de secrets résolues à l’exécution. Cela s’applique chaque fois qu’OpenClaw régénère `models.json`, y compris dans les chemins pilotés par commande comme `openclaw agent`.
</Note>

## Connexe

- [Environnements d’exécution des agents](/fr/concepts/agent-runtimes) — PI, Codex et autres environnements d’exécution de boucle d’agent
- [Référence de configuration](/fr/gateway/config-agents#agent-defaults) — clés de configuration des modèles
- [Génération d’images](/fr/tools/image-generation) — configuration du modèle d’image
- [Basculement de modèle](/fr/concepts/model-failover) — chaînes de repli
- [Fournisseurs de modèles](/fr/concepts/model-providers) — routage et authentification des fournisseurs
- [Génération de musique](/fr/tools/music-generation) — configuration du modèle musical
- [Génération de vidéo](/fr/tools/video-generation) — configuration du modèle vidéo
