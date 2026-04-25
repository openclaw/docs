---
read_when:
    - Ajout ou modification de la CLI des modèles (`models list/set/scan/aliases/fallbacks`)
    - Modification du comportement de repli des modèles ou de l’expérience de sélection
    - Mise à jour des sondes d’analyse des modèles (outils/images)
summary: 'CLI des modèles : lister, définir, alias, solutions de repli, analyse, état'
title: CLI des modèles
x-i18n:
    generated_at: "2026-04-25T13:45:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 370453529596e87e724c4de7d2ae9d20334c29393116059bc01363b47c017d5d
    source_path: concepts/models.md
    workflow: 15
---

Voir [/concepts/model-failover](/fr/concepts/model-failover) pour la
rotation des profils d’authentification, les délais de récupération et la manière dont cela interagit avec les solutions de repli.
Aperçu rapide des fournisseurs + exemples : [/concepts/model-providers](/fr/concepts/model-providers).
Les références de modèle choisissent un fournisseur et un modèle. Elles ne choisissent généralement pas le
runtime d’agent de bas niveau. Par exemple, `openai/gpt-5.5` peut s’exécuter via le
chemin fournisseur OpenAI normal ou via le runtime app-server Codex, selon
`agents.defaults.embeddedHarness.runtime`. Voir
[/concepts/agent-runtimes](/fr/concepts/agent-runtimes).

## Fonctionnement de la sélection de modèle

OpenClaw sélectionne les modèles dans cet ordre :

1. modèle **principal** (`agents.defaults.model.primary` ou `agents.defaults.model`).
2. **Solutions de repli** dans `agents.defaults.model.fallbacks` (dans l’ordre).
3. Le **basculement d’authentification du fournisseur** se produit à l’intérieur d’un fournisseur avant de passer au
   modèle suivant.

Liens associés :

- `agents.defaults.models` est la liste d’autorisation/catalogue des modèles qu’OpenClaw peut utiliser (ainsi que les alias).
- `agents.defaults.imageModel` est utilisé **uniquement lorsque** le modèle principal ne peut pas accepter d’images.
- `agents.defaults.pdfModel` est utilisé par l’outil `pdf`. S’il est omis, l’outil
  se replie sur `agents.defaults.imageModel`, puis sur le modèle de session/par défaut résolu.
- `agents.defaults.imageGenerationModel` est utilisé par la capacité partagée de génération d’images. S’il est omis, `image_generate` peut tout de même déduire une valeur par défaut de fournisseur adossée à l’authentification. Il essaie d’abord le fournisseur par défaut actuel, puis les autres fournisseurs de génération d’images enregistrés dans l’ordre des identifiants de fournisseur. Si vous définissez un fournisseur/modèle spécifique, configurez aussi l’authentification/la clé API de ce fournisseur.
- `agents.defaults.musicGenerationModel` est utilisé par la capacité partagée de génération musicale. S’il est omis, `music_generate` peut tout de même déduire une valeur par défaut de fournisseur adossée à l’authentification. Il essaie d’abord le fournisseur par défaut actuel, puis les autres fournisseurs de génération musicale enregistrés dans l’ordre des identifiants de fournisseur. Si vous définissez un fournisseur/modèle spécifique, configurez aussi l’authentification/la clé API de ce fournisseur.
- `agents.defaults.videoGenerationModel` est utilisé par la capacité partagée de génération vidéo. S’il est omis, `video_generate` peut tout de même déduire une valeur par défaut de fournisseur adossée à l’authentification. Il essaie d’abord le fournisseur par défaut actuel, puis les autres fournisseurs de génération vidéo enregistrés dans l’ordre des identifiants de fournisseur. Si vous définissez un fournisseur/modèle spécifique, configurez aussi l’authentification/la clé API de ce fournisseur.
- Les valeurs par défaut par agent peuvent remplacer `agents.defaults.model` via `agents.list[].model` plus les liaisons (voir [/concepts/multi-agent](/fr/concepts/multi-agent)).

## Politique rapide pour les modèles

- Définissez votre modèle principal sur le modèle le plus puissant et de dernière génération auquel vous avez accès.
- Utilisez des solutions de repli pour les tâches sensibles au coût/à la latence et les discussions à plus faible enjeu.
- Pour les agents avec outils activés ou les entrées non fiables, évitez les niveaux de modèles plus anciens/plus faibles.

## Intégration initiale (recommandée)

Si vous ne voulez pas modifier la configuration à la main, lancez l’intégration initiale :

```bash
openclaw onboard
```

Elle peut configurer le modèle + l’authentification pour les fournisseurs courants, y compris **l’abonnement OpenAI Code (Codex)**
(OAuth) et **Anthropic** (clé API ou Claude CLI).

## Clés de configuration (aperçu)

- `agents.defaults.model.primary` et `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` et `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` et `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` et `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` et `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (liste d’autorisation + alias + paramètres fournisseur)
- `models.providers` (fournisseurs personnalisés écrits dans `models.json`)

Les références de modèle sont normalisées en minuscules. Les alias de fournisseur comme `z.ai/*` sont normalisés
en `zai/*`.

Des exemples de configuration de fournisseur (y compris OpenCode) se trouvent dans
[/providers/opencode](/fr/providers/opencode).

### Modifications sûres de la liste d’autorisation

Utilisez des écritures additives lors de la mise à jour manuelle de `agents.defaults.models` :

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

`openclaw config set` protège les mappages modèle/fournisseur contre les écrasements accidentels. Une
affectation directe d’objet à `agents.defaults.models`, `models.providers` ou
`models.providers.<id>.models` est rejetée lorsqu’elle supprimerait des entrées
existantes. Utilisez `--merge` pour les modifications additives ; utilisez `--replace` uniquement lorsque la
valeur fournie doit devenir la valeur cible complète.

La configuration interactive du fournisseur et `openclaw configure --section model` fusionnent également
les sélections à portée fournisseur dans la liste d’autorisation existante ; ainsi l’ajout de Codex,
Ollama ou d’un autre fournisseur ne supprime pas des entrées de modèle sans rapport.
Configure préserve une valeur existante de `agents.defaults.model.primary` lorsque l’authentification du fournisseur
est réappliquée. Les commandes explicites de définition de valeur par défaut telles que
`openclaw models auth login --provider <id> --set-default` et
`openclaw models set <model>` remplacent toujours `agents.defaults.model.primary`.

## « Le modèle n’est pas autorisé » (et pourquoi les réponses s’arrêtent)

Si `agents.defaults.models` est défini, il devient la **liste d’autorisation** pour `/model` et pour
les remplacements de session. Lorsqu’un utilisateur sélectionne un modèle qui ne figure pas dans cette liste d’autorisation,
OpenClaw renvoie :

```
Model "provider/model" is not allowed. Use /model to list available models.
```

Cela se produit **avant** qu’une réponse normale soit générée, donc le message peut donner
l’impression qu’il « n’a pas répondu ». La solution consiste soit à :

- Ajouter le modèle à `agents.defaults.models`, soit
- Effacer la liste d’autorisation (supprimer `agents.defaults.models`), soit
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

## Changer de modèle dans la discussion (`/model`)

Vous pouvez changer de modèle pour la session en cours sans redémarrer :

```
/model
/model list
/model 3
/model openai/gpt-5.4
/model status
```

Remarques :

- `/model` (et `/model list`) est un sélecteur compact numéroté (famille de modèles + fournisseurs disponibles).
- Sur Discord, `/model` et `/models` ouvrent un sélecteur interactif avec listes déroulantes de fournisseur et de modèle, plus une étape Submit.
- `/models add` est obsolète et renvoie désormais un message d’obsolescence au lieu d’enregistrer des modèles depuis la discussion.
- `/model <#>` sélectionne depuis ce sélecteur.
- `/model` persiste immédiatement la nouvelle sélection de session.
- Si l’agent est inactif, l’exécution suivante utilise immédiatement le nouveau modèle.
- Si une exécution est déjà active, OpenClaw marque un changement live comme en attente et ne redémarre dans le nouveau modèle qu’à un point de nouvelle tentative propre.
- Si une activité d’outil ou une sortie de réponse a déjà commencé, le changement en attente peut rester en file jusqu’à une opportunité de nouvelle tentative ultérieure ou au prochain tour utilisateur.
- `/model status` est la vue détaillée (candidats d’authentification et, lorsqu’ils sont configurés, `baseUrl` de point de terminaison fournisseur + mode `api`).
- Les références de modèle sont analysées en découpant sur le **premier** `/`. Utilisez `provider/model` lorsque vous saisissez `/model <ref>`.
- Si l’identifiant du modèle lui-même contient `/` (style OpenRouter), vous devez inclure le préfixe fournisseur (exemple : `/model openrouter/moonshotai/kimi-k2`).
- Si vous omettez le fournisseur, OpenClaw résout l’entrée dans cet ordre :
  1. correspondance d’alias
  2. correspondance unique de fournisseur configuré pour cet identifiant de modèle exact sans préfixe
  3. repli obsolète vers le fournisseur par défaut configuré
     Si ce fournisseur n’expose plus le modèle par défaut configuré, OpenClaw
     se replie à la place sur le premier fournisseur/modèle configuré afin d’éviter
     d’exposer une valeur par défaut obsolète d’un fournisseur supprimé.

Comportement/configuration complète de la commande : [Commandes slash](/fr/tools/slash-commands).

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

Affiche les modèles configurés par défaut. Drapeaux utiles :

- `--all` : catalogue complet
- `--local` : fournisseurs locaux uniquement
- `--provider <id>` : filtrer par identifiant de fournisseur, par exemple `moonshot` ; les
  libellés affichés par les sélecteurs interactifs ne sont pas acceptés
- `--plain` : un modèle par ligne
- `--json` : sortie exploitable par machine

`--all` inclut les lignes de catalogue statiques appartenant aux fournisseurs intégrés avant que l’authentification soit
configurée, afin que les vues de découverte seule puissent afficher des modèles indisponibles tant que
vous n’avez pas ajouté les identifiants de fournisseur correspondants.

### `models status`

Affiche le modèle principal résolu, les solutions de repli, le modèle d’image et une vue d’ensemble de l’authentification
des fournisseurs configurés. Il fait également apparaître l’état d’expiration OAuth pour les profils trouvés
dans le magasin d’authentification (avertit dans les 24 h par défaut). `--plain` n’affiche que le
modèle principal résolu.
L’état OAuth est toujours affiché (et inclus dans la sortie `--json`). Si un fournisseur configuré
n’a pas d’identifiants, `models status` affiche une section **Authentification manquante**.
Le JSON inclut `auth.oauth` (fenêtre d’avertissement + profils) et `auth.providers`
(authentification effective par fournisseur, y compris les identifiants adossés à l’environnement). `auth.oauth`
correspond uniquement à l’état de santé des profils du magasin d’authentification ; les fournisseurs uniquement environnement n’y apparaissent pas.
Utilisez `--check` pour l’automatisation (code de sortie `1` si manquant/expiré, `2` si expiration imminente).
Utilisez `--probe` pour des vérifications live de l’authentification ; les lignes de sonde peuvent provenir de profils d’authentification, d’identifiants d’environnement
ou de `models.json`.
Si `auth.order.<provider>` explicite omet un profil enregistré, la sonde signale
`excluded_by_auth_order` au lieu de l’essayer. Si l’authentification existe mais qu’aucun modèle sondable ne peut être résolu pour ce fournisseur, la sonde renvoie `status: no_model`.

Le choix de l’authentification dépend du fournisseur/compte. Pour les hôtes Gateway toujours actifs, les clés API
sont généralement les plus prévisibles ; la réutilisation de Claude CLI et les profils OAuth/jeton Anthropic
existants sont également pris en charge.

Exemple (Claude CLI) :

```bash
claude auth login
openclaw models status
```

## Analyse (modèles gratuits OpenRouter)

`openclaw models scan` inspecte le **catalogue de modèles gratuits** d’OpenRouter et peut
éventuellement sonder les modèles pour la prise en charge des outils et des images.

Drapeaux clés :

- `--no-probe` : ignorer les sondes live (métadonnées uniquement)
- `--min-params <b>` : taille minimale de paramètres (milliards)
- `--max-age-days <days>` : ignorer les modèles plus anciens
- `--provider <name>` : filtre de préfixe fournisseur
- `--max-candidates <n>` : taille de la liste de repli
- `--set-default` : définir `agents.defaults.model.primary` sur la première sélection
- `--set-image` : définir `agents.defaults.imageModel.primary` sur la première sélection d’image

Le catalogue OpenRouter `/models` est public ; les analyses de métadonnées seules peuvent donc lister
des candidats gratuits sans clé. Le sondage et l’inférence nécessitent tout de même une
clé API OpenRouter (depuis les profils d’authentification ou `OPENROUTER_API_KEY`). Si aucune clé n’est
disponible, `openclaw models scan` se replie sur une sortie de métadonnées seules et laisse la
configuration inchangée. Utilisez `--no-probe` pour demander explicitement le mode métadonnées seules.

Les résultats de l’analyse sont classés selon :

1. prise en charge des images
2. latence des outils
3. taille de contexte
4. nombre de paramètres

Entrée

- liste OpenRouter `/models` (filtre `:free`)
- les sondes live nécessitent une clé API OpenRouter provenant des profils d’authentification ou de `OPENROUTER_API_KEY` (voir [/environment](/fr/help/environment))
- filtres facultatifs : `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- contrôles de requête/sonde : `--timeout`, `--concurrency`

Lorsque des sondes live s’exécutent dans un TTY, vous pouvez sélectionner interactivement les solutions de repli. En
mode non interactif, passez `--yes` pour accepter les valeurs par défaut. Les résultats de métadonnées seules sont
informatifs ; `--set-default` et `--set-image` nécessitent des sondes live afin qu’OpenClaw
ne configure pas un modèle OpenRouter inutilisable sans clé.

## Registre des modèles (`models.json`)

Les fournisseurs personnalisés dans `models.providers` sont écrits dans `models.json` sous le
répertoire de l’agent (par défaut `~/.openclaw/agents/<agentId>/agent/models.json`). Ce fichier
est fusionné par défaut sauf si `models.mode` est défini sur `replace`.

Priorité de mode fusion pour les identifiants de fournisseur correspondants :

- `baseUrl` non vide déjà présent dans le `models.json` de l’agent l’emporte.
- `apiKey` non vide dans le `models.json` de l’agent l’emporte uniquement lorsque ce fournisseur n’est pas géré par SecretRef dans le contexte actuel de configuration/profil d’authentification.
- Les valeurs `apiKey` des fournisseurs gérés par SecretRef sont actualisées à partir des marqueurs source (`ENV_VAR_NAME` pour les références d’environnement, `secretref-managed` pour les références fichier/exec) au lieu de persister les secrets résolus.
- Les valeurs d’en-tête des fournisseurs gérés par SecretRef sont actualisées à partir des marqueurs source (`secretref-env:ENV_VAR_NAME` pour les références d’environnement, `secretref-managed` pour les références fichier/exec).
- `apiKey`/`baseUrl` d’agent vides ou absents se replient sur la configuration `models.providers`.
- Les autres champs de fournisseur sont actualisés depuis la configuration et les données de catalogue normalisées.

La persistance des marqueurs est autoritaire côté source : OpenClaw écrit les marqueurs depuis l’instantané actif de configuration source (pré-résolution), et non depuis les valeurs de secrets résolues à l’exécution.
Cela s’applique chaque fois qu’OpenClaw régénère `models.json`, y compris dans les chemins pilotés par commande comme `openclaw agent`.

## Liens associés

- [Fournisseurs de modèles](/fr/concepts/model-providers) — routage des fournisseurs et authentification
- [Runtimes d’agent](/fr/concepts/agent-runtimes) — Pi, Codex et autres runtimes de boucle d’agent
- [Model Failover](/fr/concepts/model-failover) — chaînes de repli
- [Génération d’images](/fr/tools/image-generation) — configuration du modèle d’image
- [Génération musicale](/fr/tools/music-generation) — configuration du modèle musical
- [Génération vidéo](/fr/tools/video-generation) — configuration du modèle vidéo
- [Référence de configuration](/fr/gateway/config-agents#agent-defaults) — clés de configuration de modèle
