---
read_when:
    - Ajout ou modification de la CLI des modèles (`models list/set/scan/aliases/fallbacks`)
    - Modification du comportement de repli des modèles ou de l’expérience utilisateur de sélection
    - Mise à jour des sondes d’analyse des modèles (`tools/images`)
summary: 'CLI des modèles : lister, définir, alias, solutions de repli, analyse et statut'
title: CLI des modèles
x-i18n:
    generated_at: "2026-04-22T04:22:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0cf7a17a20bea66e5e8dce134ed08b483417bc70ed875e796609d850aa79280e
    source_path: concepts/models.md
    workflow: 15
---

# CLI des modèles

Consultez [/concepts/model-failover](/fr/concepts/model-failover) pour la
rotation des profils d’authentification, les délais de refroidissement, et la manière dont cela interagit avec les solutions de repli.
Vue d’ensemble rapide des providers + exemples : [/concepts/model-providers](/fr/concepts/model-providers).

## Fonctionnement de la sélection de modèle

OpenClaw sélectionne les modèles dans cet ordre :

1. **Modèle principal** (`agents.defaults.model.primary` ou `agents.defaults.model`).
2. **Solutions de repli** dans `agents.defaults.model.fallbacks` (dans l’ordre).
3. Le **basculement d’authentification du provider** se produit à l’intérieur d’un provider avant le passage au
   modèle suivant.

Éléments liés :

- `agents.defaults.models` est la liste d’autorisation/le catalogue des modèles qu’OpenClaw peut utiliser (avec alias).
- `agents.defaults.imageModel` est utilisé **uniquement lorsque** le modèle principal ne peut pas accepter d’images.
- `agents.defaults.pdfModel` est utilisé par l’outil `pdf`. S’il est omis, l’outil
  se replie sur `agents.defaults.imageModel`, puis sur le modèle de session/par défaut
  résolu.
- `agents.defaults.imageGenerationModel` est utilisé par la surface de capacité partagée de génération d’images. S’il est omis, `image_generate` peut quand même déduire une valeur par défaut de provider adossée à l’authentification. Il essaie d’abord le provider par défaut actuel, puis les autres providers de génération d’images enregistrés dans l’ordre des identifiants de provider. Si vous définissez un provider/modèle spécifique, configurez aussi l’authentification/la clé API de ce provider.
- `agents.defaults.musicGenerationModel` est utilisé par la surface de capacité partagée de génération de musique. S’il est omis, `music_generate` peut quand même déduire une valeur par défaut de provider adossée à l’authentification. Il essaie d’abord le provider par défaut actuel, puis les autres providers de génération de musique enregistrés dans l’ordre des identifiants de provider. Si vous définissez un provider/modèle spécifique, configurez aussi l’authentification/la clé API de ce provider.
- `agents.defaults.videoGenerationModel` est utilisé par la surface de capacité partagée de génération vidéo. S’il est omis, `video_generate` peut quand même déduire une valeur par défaut de provider adossée à l’authentification. Il essaie d’abord le provider par défaut actuel, puis les autres providers de génération vidéo enregistrés dans l’ordre des identifiants de provider. Si vous définissez un provider/modèle spécifique, configurez aussi l’authentification/la clé API de ce provider.
- Les valeurs par défaut par agent peuvent remplacer `agents.defaults.model` via `agents.list[].model` plus les liaisons (voir [/concepts/multi-agent](/fr/concepts/multi-agent)).

## Politique rapide des modèles

- Définissez votre modèle principal sur le modèle de dernière génération le plus puissant auquel vous avez accès.
- Utilisez des solutions de repli pour les tâches sensibles au coût/à la latence et les conversations moins critiques.
- Pour les agents avec outils activés ou les entrées non fiables, évitez les niveaux de modèles plus anciens/plus faibles.

## Intégration initiale (recommandée)

Si vous ne voulez pas modifier la config à la main, lancez l’intégration initiale :

```bash
openclaw onboard
```

Elle peut configurer le modèle + l’authentification pour des providers courants, y compris **OpenAI Code (Codex)
subscription** (OAuth) et **Anthropic** (clé API ou Claude CLI).

## Clés de config (vue d’ensemble)

- `agents.defaults.model.primary` et `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` et `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` et `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` et `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` et `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (liste d’autorisation + alias + paramètres de provider)
- `models.providers` (providers personnalisés écrits dans `models.json`)

Les références de modèles sont normalisées en minuscules. Les alias de provider comme `z.ai/*` sont normalisés
en `zai/*`.

Des exemples de configuration de provider (y compris OpenCode) se trouvent dans
[/providers/opencode](/fr/providers/opencode).

## « Model is not allowed » (et pourquoi les réponses s’arrêtent)

Si `agents.defaults.models` est défini, il devient la **liste d’autorisation** pour `/model` et pour les
remplacements de session. Lorsqu’un utilisateur sélectionne un modèle qui n’est pas dans cette liste d’autorisation,
OpenClaw renvoie :

```
Model "provider/model" is not allowed. Use /model to list available models.
```

Cela se produit **avant** qu’une réponse normale soit générée, donc le message peut donner l’impression
qu’il « n’a pas répondu ». La solution consiste soit à :

- Ajouter le modèle à `agents.defaults.models`, ou
- Effacer la liste d’autorisation (supprimer `agents.defaults.models`), ou
- Choisir un modèle depuis `/model list`.

Exemple de configuration de liste d’autorisation :

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

## Changer de modèle dans le chat (`/model`)

Vous pouvez changer de modèle pour la session en cours sans redémarrer :

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model status
```

Remarques :

- `/model` (et `/model list`) est un sélecteur compact numéroté (famille de modèles + providers disponibles).
- Sur Discord, `/model` et `/models` ouvrent un sélecteur interactif avec des listes déroulantes de provider et de modèle, puis une étape Submit.
- `/model <#>` sélectionne à partir de ce sélecteur.
- `/model` conserve immédiatement la nouvelle sélection de session.
- Si l’agent est inactif, l’exécution suivante utilise immédiatement le nouveau modèle.
- Si une exécution est déjà active, OpenClaw marque un changement à chaud comme en attente et ne redémarre dans le nouveau modèle qu’à un point de nouvelle tentative propre.
- Si l’activité d’outil ou la sortie de réponse a déjà commencé, le changement en attente peut rester en file jusqu’à une opportunité de nouvelle tentative ultérieure ou jusqu’au prochain tour utilisateur.
- `/model status` est la vue détaillée (candidats d’authentification et, lorsqu’ils sont configurés, `baseUrl` du point de terminaison du provider + mode `api`).
- Les références de modèles sont analysées en séparant sur le **premier** `/`. Utilisez `provider/model` en saisissant `/model <ref>`.
- Si l’identifiant du modèle lui-même contient `/` (style OpenRouter), vous devez inclure le préfixe du provider (exemple : `/model openrouter/moonshotai/kimi-k2`).
- Si vous omettez le provider, OpenClaw résout l’entrée dans cet ordre :
  1. correspondance d’alias
  2. correspondance unique de provider configuré pour cet identifiant de modèle exact sans préfixe
  3. repli obsolète vers le provider par défaut configuré
     Si ce provider n’expose plus le modèle par défaut configuré, OpenClaw
     se replie à la place sur le premier provider/modèle configuré afin d’éviter
     d’exposer une valeur par défaut obsolète provenant d’un provider supprimé.

Comportement/configuration complets de la commande : [Commandes slash](/fr/tools/slash-commands).

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

`openclaw models` (sans sous-commande) est un raccourci vers `models status`.

### `models list`

Affiche par défaut les modèles configurés. Indicateurs utiles :

- `--all` : catalogue complet
- `--local` : providers locaux uniquement
- `--provider <name>` : filtrer par provider
- `--plain` : un modèle par ligne
- `--json` : sortie lisible par machine

`--all` inclut les lignes de catalogue statique fournies par les providers inclus avant que l’authentification ne soit
configurée, afin que les vues de découverte seule puissent afficher des modèles indisponibles tant que
vous n’ajoutez pas les identifiants de provider correspondants.

### `models status`

Affiche le modèle principal résolu, les solutions de repli, le modèle d’image, et une vue d’ensemble de l’authentification
des providers configurés. Il affiche aussi l’état d’expiration OAuth pour les profils trouvés
dans le magasin d’authentification (avertissement dans les 24 h par défaut). `--plain` affiche uniquement le
modèle principal résolu.
L’état OAuth est toujours affiché (et inclus dans la sortie `--json`). Si un provider configuré
n’a pas d’identifiants, `models status` affiche une section **Missing auth**.
Le JSON inclut `auth.oauth` (fenêtre d’avertissement + profils) et `auth.providers`
(authentification effective par provider, y compris les identifiants adossés à l’environnement). `auth.oauth`
concerne uniquement l’état de santé des profils du magasin d’authentification ; les providers uniquement définis par environnement n’y apparaissent pas.
Utilisez `--check` pour l’automatisation (code de sortie `1` si absent/expiré, `2` si expiration imminente).
Utilisez `--probe` pour des vérifications d’authentification en direct ; les lignes de sonde peuvent provenir de profils d’authentification, d’identifiants d’environnement
ou de `models.json`.
Si `auth.order.<provider>` explicite omet un profil stocké, la sonde signale
`excluded_by_auth_order` au lieu de l’essayer. Si l’authentification existe mais qu’aucun modèle sondable
ne peut être résolu pour ce provider, la sonde signale `status: no_model`.

Le choix de l’authentification dépend du provider/compte. Pour les hôtes Gateway toujours actifs, les clés API
sont généralement les plus prévisibles ; la réutilisation de Claude CLI et les profils OAuth/jeton Anthropic
existants sont également pris en charge.

Exemple (Claude CLI) :

```bash
claude auth login
openclaw models status
```

## Analyse (modèles gratuits OpenRouter)

`openclaw models scan` inspecte le **catalogue des modèles gratuits** d’OpenRouter et peut
éventuellement sonder les modèles pour vérifier la prise en charge des outils et des images.

Indicateurs clés :

- `--no-probe` : ignorer les sondes en direct (métadonnées uniquement)
- `--min-params <b>` : taille minimale en paramètres (milliards)
- `--max-age-days <days>` : ignorer les modèles plus anciens
- `--provider <name>` : filtre de préfixe de provider
- `--max-candidates <n>` : taille de la liste de repli
- `--set-default` : définir `agents.defaults.model.primary` sur la première sélection
- `--set-image` : définir `agents.defaults.imageModel.primary` sur la première sélection d’image

Le sondage nécessite une clé API OpenRouter (issue de profils d’authentification ou de
`OPENROUTER_API_KEY`). Sans clé, utilisez `--no-probe` pour lister uniquement les candidats.

Les résultats d’analyse sont classés selon :

1. Prise en charge des images
2. Latence des outils
3. Taille du contexte
4. Nombre de paramètres

Entrée

- Liste OpenRouter `/models` (filtre `:free`)
- Nécessite une clé API OpenRouter provenant de profils d’authentification ou de `OPENROUTER_API_KEY` (voir [/environment](/fr/help/environment))
- Filtres optionnels : `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- Contrôles de sonde : `--timeout`, `--concurrency`

Lorsqu’elle est exécutée dans un TTY, vous pouvez sélectionner les solutions de repli de manière interactive. En mode non interactif,
passez `--yes` pour accepter les valeurs par défaut.

## Registre des modèles (`models.json`)

Les providers personnalisés dans `models.providers` sont écrits dans `models.json` sous le
répertoire de l’agent (par défaut `~/.openclaw/agents/<agentId>/agent/models.json`). Ce fichier
est fusionné par défaut, sauf si `models.mode` est défini sur `replace`.

Priorité du mode fusion pour les identifiants de provider correspondants :

- Un `baseUrl` non vide déjà présent dans le `models.json` de l’agent l’emporte.
- Un `apiKey` non vide dans le `models.json` de l’agent l’emporte uniquement lorsque ce provider n’est pas géré par SecretRef dans le contexte actuel de configuration/profil d’authentification.
- Les valeurs `apiKey` de provider gérées par SecretRef sont actualisées à partir de marqueurs source (`ENV_VAR_NAME` pour les références d’environnement, `secretref-managed` pour les références fichier/exec) au lieu de conserver les secrets résolus.
- Les valeurs d’en-tête de provider gérées par SecretRef sont actualisées à partir de marqueurs source (`secretref-env:ENV_VAR_NAME` pour les références d’environnement, `secretref-managed` pour les références fichier/exec).
- Un `apiKey`/`baseUrl` d’agent vide ou manquant se replie sur la config `models.providers`.
- Les autres champs de provider sont actualisés à partir de la config et des données de catalogue normalisées.

La persistance des marqueurs suit l’autorité de la source : OpenClaw écrit les marqueurs à partir de l’instantané de config source actif (pré-résolution), et non à partir des valeurs secrètes résolues à l’exécution.
Cela s’applique chaque fois qu’OpenClaw régénère `models.json`, y compris dans les chemins pilotés par commande comme `openclaw agent`.

## Liens associés

- [Model Providers](/fr/concepts/model-providers) — routage des providers et authentification
- [Model Failover](/fr/concepts/model-failover) — chaînes de repli
- [Image Generation](/fr/tools/image-generation) — configuration du modèle d’image
- [Music Generation](/fr/tools/music-generation) — configuration du modèle de musique
- [Video Generation](/fr/tools/video-generation) — configuration du modèle vidéo
- [Configuration Reference](/fr/gateway/configuration-reference#agent-defaults) — clés de configuration des modèles
