---
read_when:
    - Ajout ou modification de la CLI des modèles (models list/set/scan/aliases/fallbacks)
    - Modifier le comportement de fallback du modèle ou l’UX de sélection
    - Mise à jour des sondes d’analyse des modèles (outils/images)
sidebarTitle: Models CLI
summary: 'CLI des modèles : lister, définir, alias, solutions de repli, analyser, état'
title: CLI des modèles
x-i18n:
    generated_at: "2026-06-27T17:25:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8c7d4cbe1e0854a281f57f39dac9ac5f54c65f50da08cf37dfd298f8f1dd5536
    source_path: concepts/models.md
    workflow: 16
---

<CardGroup cols={2}>
  <Card title="Basculement de modèle" href="/fr/concepts/model-failover">
    Rotation des profils d’authentification, délais de récupération et interaction avec les solutions de repli.
  </Card>
  <Card title="Fournisseurs de modèles" href="/fr/concepts/model-providers">
    Vue d’ensemble rapide des fournisseurs et exemples.
  </Card>
  <Card title="Runtimes d’agent" href="/fr/concepts/agent-runtimes">
    OpenClaw, Codex et autres runtimes de boucle d’agent.
  </Card>
  <Card title="Référence de configuration" href="/fr/gateway/config-agents#agent-defaults">
    Clés de configuration des modèles.
  </Card>
</CardGroup>

Les références de modèle choisissent un fournisseur et un modèle. Elles ne choisissent généralement pas le runtime d’agent de bas niveau. Les références d’agent OpenAI sont la principale exception : `openai/gpt-5.5` s’exécute par défaut via le runtime Codex app-server sur le fournisseur OpenAI officiel. Les références Copilot par abonnement (`github-copilot/*`) peuvent en outre être activées dans le plugin runtime d’agent GitHub Copilot externe — ce chemin reste explicite (pas de repli `auto`). Les remplacements explicites de runtime relèvent de la politique fournisseur/modèle, pas de l’agent ou de la session entière. En mode runtime Codex, la référence `openai/gpt-*` n’implique pas une facturation par clé API ; l’authentification peut provenir d’un compte Codex ou d’un profil OAuth `openai`. Consultez [Runtimes d’agent](/fr/concepts/agent-runtimes) et [runtime d’agent GitHub Copilot](/fr/plugins/copilot).

## Fonctionnement de la sélection de modèle

OpenClaw sélectionne les modèles dans cet ordre :

<Steps>
  <Step title="Modèle principal">
    `agents.defaults.model.primary` (ou `agents.defaults.model`).
  </Step>
  <Step title="Solutions de repli">
    `agents.defaults.model.fallbacks` (dans l’ordre).
  </Step>
  <Step title="Basculement d’authentification du fournisseur">
    Le basculement d’authentification se produit à l’intérieur d’un fournisseur avant de passer au modèle suivant.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Surfaces de modèles associées">
    - `agents.defaults.models` est la liste d’autorisation/le catalogue des modèles qu’OpenClaw peut utiliser (plus les alias). Utilisez des entrées `provider/*` pour limiter les fournisseurs visibles tout en gardant la découverte des fournisseurs dynamique.
    - `agents.defaults.imageModel` est utilisé **uniquement lorsque** le modèle principal ne peut pas accepter d’images.
    - `agents.defaults.pdfModel` est utilisé par l’outil `pdf`. S’il est omis, l’outil se replie sur `agents.defaults.imageModel`, puis sur le modèle résolu de session/par défaut.
    - `agents.defaults.imageGenerationModel` est utilisé par la capacité partagée de génération d’images. S’il est omis, `image_generate` peut toujours déduire une valeur par défaut de fournisseur couverte par l’authentification. Il essaie d’abord le fournisseur par défaut actuel, puis les autres fournisseurs de génération d’images enregistrés dans l’ordre des identifiants de fournisseur. Si vous définissez un fournisseur/modèle spécifique, configurez aussi l’authentification/la clé API de ce fournisseur.
    - `agents.defaults.musicGenerationModel` est utilisé par la capacité partagée de génération de musique. S’il est omis, `music_generate` peut toujours déduire une valeur par défaut de fournisseur couverte par l’authentification. Il essaie d’abord le fournisseur par défaut actuel, puis les autres fournisseurs de génération de musique enregistrés dans l’ordre des identifiants de fournisseur. Si vous définissez un fournisseur/modèle spécifique, configurez aussi l’authentification/la clé API de ce fournisseur.
    - `agents.defaults.videoGenerationModel` est utilisé par la capacité partagée de génération de vidéos. S’il est omis, `video_generate` peut toujours déduire une valeur par défaut de fournisseur couverte par l’authentification. Il essaie d’abord le fournisseur par défaut actuel, puis les autres fournisseurs de génération de vidéos enregistrés dans l’ordre des identifiants de fournisseur. Si vous définissez un fournisseur/modèle spécifique, configurez aussi l’authentification/la clé API de ce fournisseur.
    - Les valeurs par défaut par agent peuvent remplacer `agents.defaults.model` via `agents.list[].model` plus des liaisons (voir [Routage multi-agent](/fr/concepts/multi-agent)).

  </Accordion>
</AccordionGroup>

## Source de sélection et comportement de repli

Le même `provider/model` peut signifier différentes choses selon son origine :

- Les valeurs par défaut configurées (`agents.defaults.model.primary` et les modèles principaux propres aux agents) sont le point de départ normal et utilisent `agents.defaults.model.fallbacks`.
- Les sélections de repli automatiques sont un état de récupération temporaire. Elles sont stockées avec `modelOverrideSource: "auto"` afin que les tours suivants puissent continuer à utiliser la chaîne de repli sans sonder à chaque fois un modèle principal connu comme défaillant ; OpenClaw sonde périodiquement à nouveau le modèle principal d’origine, efface la sélection automatique lorsqu’il récupère et annonce les transitions de repli/récupération une seule fois par changement d’état.
- Les sélections de session utilisateur sont exactes. `/model`, le sélecteur de modèle, `session_status(model=...)` et `sessions.patch` stockent `modelOverrideSource: "user"` ; si le fournisseur/modèle sélectionné est inaccessible, OpenClaw échoue de manière visible au lieu de basculer vers un autre modèle configuré.
- Modifier `agents.defaults.model.primary` ne réécrit pas les sélections de session existantes. Si l’état indique `This session is pinned to X; config primary Y will apply to new/unpinned sessions.`, effacez la sélection de la session actuelle avec `/model default` afin qu’elle hérite à nouveau du modèle principal configuré.
- Cron `--model` / charge utile `model` est un modèle principal par tâche. Il utilise toujours les solutions de repli configurées, sauf si la tâche fournit une charge utile explicite `fallbacks` (utilisez `fallbacks: []` pour une exécution cron stricte).
- Les sélecteurs de modèle par défaut et de liste d’autorisation de la CLI respectent `models.mode: "replace"` en listant les `models.providers.*.models` explicites au lieu de charger le catalogue intégré complet.
- Le sélecteur de modèle de l’interface de contrôle demande au Gateway sa vue de modèle configurée : `agents.defaults.models` lorsqu’il est présent, y compris les entrées `provider/*` couvrant tout un fournisseur, sinon les `models.providers.*.models` explicites plus les fournisseurs avec une authentification utilisable. Le catalogue intégré complet est réservé aux vues de navigation explicites telles que `models.list` avec `view: "all"` ou `openclaw models list --all`.

## Politique de modèle rapide

- Définissez votre modèle principal sur le modèle de dernière génération le plus puissant auquel vous avez accès.
- Utilisez les solutions de repli pour les tâches sensibles au coût/à la latence et les conversations à moindre enjeu.
- Pour les agents avec outils activés ou les entrées non fiables, évitez les niveaux de modèles plus anciens/plus faibles.

## Intégration (recommandée)

Si vous ne voulez pas modifier la configuration à la main, lancez l’intégration :

```bash
openclaw onboard
```

Elle peut configurer le modèle et l’authentification pour les fournisseurs courants, y compris **l’abonnement OpenAI Code (Codex)** (OAuth) et **Anthropic** (clé API ou CLI Claude).

## Clés de configuration (aperçu)

- `agents.defaults.model.primary` et `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` et `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` et `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` et `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` et `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (liste d’autorisation + alias + paramètres de fournisseur + entrées dynamiques de fournisseur `provider/*`)
- `models.providers` (fournisseurs personnalisés écrits dans `models.json`)

<Note>
Les références de modèle sont normalisées en minuscules. Les identifiants de fournisseur sont autrement exacts ; utilisez l’identifiant de fournisseur annoncé par le plugin.

Les exemples de configuration de fournisseur (y compris OpenCode) se trouvent dans [OpenCode](/fr/providers/opencode).
</Note>

### Modifications sûres de liste d’autorisation

Utilisez des écritures additives lorsque vous mettez à jour `agents.defaults.models` à la main :

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

<AccordionGroup>
  <Accordion title="Règles de protection contre l’écrasement">
    `openclaw config set` protège les cartes de modèles/fournisseurs contre les écrasements accidentels. Une affectation d’objet simple à `agents.defaults.models`, `models.providers` ou `models.providers.<id>.models` est rejetée lorsqu’elle supprimerait des entrées existantes. Utilisez `--merge` pour les changements additifs ; utilisez `--replace` uniquement lorsque la valeur fournie doit devenir la valeur cible complète.

    La configuration interactive des fournisseurs et `openclaw configure --section model` fusionnent également les sélections limitées au fournisseur dans la liste d’autorisation existante, de sorte que l’ajout de Codex, Ollama ou d’un autre fournisseur ne supprime pas les entrées de modèles sans rapport. Configure préserve une valeur `agents.defaults.model.primary` existante lorsque l’authentification du fournisseur est réappliquée. Les commandes explicites de définition par défaut telles que `openclaw models auth login --provider <id> --set-default` et `openclaw models set <model>` remplacent toujours `agents.defaults.model.primary`.

  </Accordion>
</AccordionGroup>

## « Le modèle n’est pas autorisé » (et pourquoi les réponses s’arrêtent)

Si `agents.defaults.models` est défini, il devient la **liste d’autorisation** pour `/model` et les remplacements de session. Lorsqu’un utilisateur sélectionne un modèle qui ne figure pas dans cette liste d’autorisation, OpenClaw renvoie :

```
Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
```

<Warning>
Cela se produit **avant** qu’une réponse normale soit générée, de sorte que le message peut donner l’impression qu’il « n’a pas répondu ». La solution consiste à :

- Ajouter le modèle à `agents.defaults.models`, ou
- Effacer la liste d’autorisation (supprimer `agents.defaults.models`), ou
- Choisir un modèle dans `/model list`.

</Warning>

Lorsque la commande rejetée incluait un remplacement de runtime tel que `/model openai/gpt-5.5 --runtime codex`, corrigez d’abord la liste d’autorisation, puis réessayez la même commande `/model ... --runtime ...`. Pour l’exécution native Codex, le modèle sélectionné reste `openai/gpt-5.5` ; le runtime `codex` sélectionne le harnais et utilise l’authentification Codex séparément.

Pour les modèles locaux/GGUF, stockez dans la liste d’autorisation la référence complète préfixée par le fournisseur,
par exemple `ollama/gemma4:26b`, `lmstudio/Gemma4-26b-a4-it-gguf`, ou le
fournisseur/modèle exact affiché par `openclaw models list --provider <provider>`.
Les noms de fichiers locaux seuls ou les noms d’affichage ne suffisent pas lorsque la liste d’autorisation est
active.

Si vous voulez limiter les fournisseurs sans lister manuellement chaque modèle, ajoutez
des entrées `provider/*` à `agents.defaults.models` :

```json5
{
  agents: {
    defaults: {
      models: {
        "openai/*": {},
        "vllm/*": {},
      },
    },
  },
}
```

Avec cette politique, `/model`, `/models` et les sélecteurs de modèle affichent le catalogue
découvert uniquement pour ces fournisseurs. Les nouveaux modèles des fournisseurs sélectionnés peuvent
apparaître sans modifier la liste d’autorisation. Les entrées exactes `provider/model` peuvent être mélangées
avec des entrées `provider/*` lorsque vous avez besoin d’un modèle spécifique d’un autre fournisseur.

Exemple de configuration de liste d’autorisation :

```json5
{
  agents: {
    defaults: {
      model: { primary: "anthropic/claude-sonnet-4-6" },
      models: {
        "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
        "anthropic/claude-opus-4-6": { alias: "Opus" },
      },
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
/model default
/model status
```

<AccordionGroup>
  <Accordion title="Comportement du sélecteur">
    - `/model` (et `/model list`) est un sélecteur compact, numéroté (famille de modèles + fournisseurs disponibles).
    - Sur Discord, `/model` et `/models` ouvrent un sélecteur interactif avec des menus déroulants de fournisseur et de modèle, plus une étape Envoyer.
    - Sur Telegram, les sélections du sélecteur `/models` sont limitées à la session ; elles ne modifient pas la valeur par défaut persistante de l’agent dans `openclaw.json`.
    - `/models add` est obsolète et renvoie maintenant un message de dépréciation au lieu d’enregistrer des modèles depuis la conversation.
    - `/model <#>` sélectionne depuis ce sélecteur.

  </Accordion>
  <Accordion title="Persistance et basculement en direct">
    - `/model` conserve immédiatement la nouvelle sélection de session.
    - Si l’agent est inactif, la prochaine exécution utilise immédiatement le nouveau modèle.
    - Si une exécution est déjà active, OpenClaw marque un basculement en direct comme en attente et ne redémarre sur le nouveau modèle qu’à un point de nouvelle tentative propre.
    - Si l’activité des outils ou la sortie de réponse a déjà commencé, le basculement en attente peut rester en file jusqu’à une occasion de nouvelle tentative ultérieure ou jusqu’au prochain tour utilisateur.
    - `/model default` efface la sélection de session et rétablit le modèle par défaut configuré pour la session.
    - Une référence `/model` sélectionnée par l’utilisateur est stricte pour cette session : si le fournisseur/modèle sélectionné est inaccessible, la réponse échoue de manière visible au lieu de répondre silencieusement depuis `agents.defaults.model.fallbacks`. C’est différent des valeurs par défaut configurées et des modèles principaux des tâches cron, qui peuvent toujours utiliser des chaînes de repli.
    - `/model status` est la vue détaillée (candidats d’authentification et, lorsqu’il est configuré, point de terminaison fournisseur `baseUrl` + mode `api`).

  </Accordion>
  <Accordion title="Analyse des références">
    - Les références de modèle sont analysées en séparant sur le **premier** `/`. Utilisez `provider/model` lorsque vous saisissez `/model <ref>`.
    - Si l’ID du modèle contient lui-même `/` (style OpenRouter), vous devez inclure le préfixe du fournisseur (exemple : `/model openrouter/moonshotai/kimi-k2`).
    - Si vous omettez le fournisseur, OpenClaw résout l’entrée dans cet ordre :
      1. correspondance d’alias
      2. correspondance unique avec un fournisseur configuré pour cet ID de modèle exact sans préfixe
      3. repli obsolète vers le fournisseur par défaut configuré — si ce fournisseur n’expose plus le modèle par défaut configuré, OpenClaw se replie plutôt sur le premier fournisseur/modèle configuré afin d’éviter de faire apparaître une valeur par défaut obsolète d’un fournisseur supprimé.
  </Accordion>
</AccordionGroup>

Comportement/configuration complète des commandes : [Commandes slash](/fr/tools/slash-commands).

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

Affiche par défaut les modèles configurés/disponibles par authentification. Options utiles :

<ParamField path="--all" type="boolean">
  Catalogue complet. Inclut les lignes du catalogue statique intégré appartenant au fournisseur avant la configuration de l’authentification, afin que les vues de découverte seules puissent afficher les modèles indisponibles tant que vous n’avez pas ajouté les identifiants de fournisseur correspondants.
</ParamField>
<ParamField path="--local" type="boolean">
  Fournisseurs locaux uniquement.
</ParamField>
<ParamField path="--provider <id>" type="string">
  Filtrer par ID de fournisseur, par exemple `moonshot`. Les libellés d’affichage des sélecteurs interactifs ne sont pas acceptés.
</ParamField>
<ParamField path="--plain" type="boolean">
  Un modèle par ligne.
</ParamField>
<ParamField path="--json" type="boolean">
  Sortie lisible par machine.
</ParamField>

### `models status`

Affiche le modèle principal résolu, les replis, le modèle d’image et une vue d’ensemble de l’authentification des fournisseurs configurés. Il expose aussi l’état d’expiration OAuth des profils trouvés dans le magasin d’authentification (avertissement dans les 24 h par défaut). `--plain` affiche uniquement le modèle principal résolu.

<AccordionGroup>
  <Accordion title="Comportement d’authentification et de sonde">
    - L’état OAuth est toujours affiché (et inclus dans la sortie `--json`). Si un fournisseur configuré n’a pas d’identifiants, `models status` affiche une section **Authentification manquante**.
    - JSON inclut `auth.oauth` (fenêtre d’avertissement + profils) et `auth.providers` (authentification effective par fournisseur, y compris les identifiants fournis par l’environnement). `auth.oauth` concerne uniquement la santé des profils du magasin d’authentification ; les fournisseurs uniquement basés sur l’environnement n’y apparaissent pas.
    - Utilisez `--check` pour l’automatisation (sortie `1` en cas d’authentification manquante/expirée, `2` en cas d’expiration prochaine).
    - Utilisez `--probe` pour les vérifications d’authentification en direct ; les lignes de sonde peuvent provenir de profils d’authentification, d’identifiants d’environnement ou de `models.json`.
    - Si `auth.order.<provider>` explicite omet un profil stocké, la sonde signale `excluded_by_auth_order` au lieu de l’essayer. Si l’authentification existe mais qu’aucun modèle sondable ne peut être résolu pour ce fournisseur, la sonde signale `status: no_model`.

  </Accordion>
</AccordionGroup>

<Note>
Le choix d’authentification dépend du fournisseur/compte. Pour les hôtes Gateway toujours actifs, les clés API sont généralement les plus prévisibles ; la réutilisation de la CLI Claude et les profils OAuth/jeton Anthropic existants sont également pris en charge.
</Note>

Exemple (CLI Claude) :

```bash
claude auth login
openclaw models status
```

## Analyse (modèles gratuits OpenRouter)

`openclaw models scan` inspecte le **catalogue de modèles gratuits** d’OpenRouter et peut éventuellement sonder les modèles pour la prise en charge des outils et des images.

<ParamField path="--no-probe" type="boolean">
  Ignorer les sondes en direct (métadonnées uniquement).
</ParamField>
<ParamField path="--min-params <b>" type="number">
  Taille minimale des paramètres (en milliards).
</ParamField>
<ParamField path="--max-age-days <days>" type="number">
  Ignorer les modèles plus anciens.
</ParamField>
<ParamField path="--provider <name>" type="string">
  Filtre de préfixe fournisseur.
</ParamField>
<ParamField path="--max-candidates <n>" type="number">
  Taille de la liste de replis.
</ParamField>
<ParamField path="--set-default" type="boolean">
  Définir `agents.defaults.model.primary` sur la première sélection.
</ParamField>
<ParamField path="--set-image" type="boolean">
  Définir `agents.defaults.imageModel.primary` sur la première sélection d’image.
</ParamField>

<Note>
Le catalogue `/models` d’OpenRouter est public, donc les analyses de métadonnées seules peuvent lister les candidats gratuits sans clé. Le sondage et l’inférence nécessitent toujours une clé API OpenRouter (depuis les profils d’authentification ou `OPENROUTER_API_KEY`). Si aucune clé n’est disponible, `openclaw models scan` se replie sur une sortie de métadonnées seules et laisse la configuration inchangée. Utilisez `--no-probe` pour demander explicitement le mode métadonnées seules.
</Note>

Les résultats d’analyse sont classés par :

1. Prise en charge des images
2. Latence des outils
3. Taille du contexte
4. Nombre de paramètres

Entrée :

- Liste OpenRouter `/models` (filtre `:free`)
- Les sondes en direct nécessitent une clé API OpenRouter depuis les profils d’authentification ou `OPENROUTER_API_KEY` (voir [Variables d’environnement](/fr/help/environment))
- Filtres facultatifs : `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- Contrôles de requête/sonde : `--timeout`, `--concurrency`

Lorsque les sondes en direct s’exécutent dans un TUI, vous pouvez sélectionner les replis de manière interactive. En mode non interactif, passez `--yes` pour accepter les valeurs par défaut. Les résultats de métadonnées seules sont informatifs ; `--set-default` et `--set-image` nécessitent des sondes en direct afin qu’OpenClaw ne configure pas un modèle OpenRouter sans clé inutilisable.

## Registre des modèles (`models.json`)

Les fournisseurs personnalisés dans `models.providers` sont écrits dans `models.json` sous le répertoire de l’agent (par défaut `~/.openclaw/agents/<agentId>/agent/models.json`). Les catalogues des Plugin de fournisseur sont stockés comme fragments de catalogue générés appartenant au Plugin sous l’état Plugin de l’agent et chargés automatiquement. Ce fichier est fusionné par défaut sauf si `models.mode` est défini sur `replace`.

<AccordionGroup>
  <Accordion title="Priorité du mode fusion">
    Priorité du mode fusion pour les ID de fournisseurs correspondants :

    - Un `baseUrl` non vide déjà présent dans le `models.json` de l’agent l’emporte.
    - Un `apiKey` non vide dans le `models.json` de l’agent l’emporte uniquement lorsque ce fournisseur n’est pas géré par SecretRef dans le contexte actuel de configuration/profil d’authentification.
    - Les valeurs `apiKey` du fournisseur géré par SecretRef sont actualisées depuis les marqueurs source (`ENV_VAR_NAME` pour les références d’environnement, `secretref-managed` pour les références de fichier/exec) au lieu de conserver les secrets résolus.
    - Les valeurs d’en-tête du fournisseur géré par SecretRef sont actualisées depuis les marqueurs source (`secretref-env:ENV_VAR_NAME` pour les références d’environnement, `secretref-managed` pour les références de fichier/exec).
    - Les `apiKey`/`baseUrl` vides ou manquants de l’agent se replient sur `models.providers` de la configuration.
    - Les autres champs de fournisseur sont actualisés depuis la configuration et les données de catalogue normalisées.

  </Accordion>
</AccordionGroup>

<Note>
La persistance des marqueurs est contrôlée par la source : OpenClaw écrit les marqueurs depuis l’instantané de configuration source actif (avant résolution), et non depuis les valeurs de secrets résolues à l’exécution. Cela s’applique chaque fois qu’OpenClaw régénère `models.json`, y compris les chemins pilotés par des commandes comme `openclaw agent`.
</Note>

## Connexe

- [Runtimes d’agent](/fr/concepts/agent-runtimes) — OpenClaw, Codex et autres runtimes de boucle d’agent
- [Référence de configuration](/fr/gateway/config-agents#agent-defaults) — clés de configuration de modèle
- [Génération d’images](/fr/tools/image-generation) — configuration du modèle d’image
- [Basculement de modèle](/fr/concepts/model-failover) — chaînes de repli
- [Fournisseurs de modèles](/fr/concepts/model-providers) — routage des fournisseurs et authentification
- [Génération de musique](/fr/tools/music-generation) — configuration du modèle de musique
- [Génération de vidéos](/fr/tools/video-generation) — configuration du modèle vidéo
