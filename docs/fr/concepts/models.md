---
read_when:
    - Ajouter ou modifier la CLI des modèles (`models list/set/scan/aliases/fallbacks`)
    - Modifier le comportement de repli des modèles ou l'expérience de sélection
    - Mettre à jour les sondes d'analyse des modèles (outils/images)
sidebarTitle: Models CLI
summary: 'CLI des modèles : lister, définir, alias, replis, analyser, statut'
title: CLI des modèles
x-i18n:
    generated_at: "2026-04-26T11:27:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: d70dfb3f69532c6bfff5d8854ee7a5db3134e5ede3e1875410cea95072ca42a0
    source_path: concepts/models.md
    workflow: 15
---

<CardGroup cols={2}>
  <Card title="Basculement de modèle" href="/fr/concepts/model-failover">
    Rotation des profils d'authentification, délais de refroidissement et interaction avec les replis.
  </Card>
  <Card title="Fournisseurs de modèles" href="/fr/concepts/model-providers">
    Vue d'ensemble rapide des fournisseurs et exemples.
  </Card>
  <Card title="Runtimes d'agent" href="/fr/concepts/agent-runtimes">
    PI, Codex et autres runtimes de boucle d'agent.
  </Card>
  <Card title="Référence de configuration" href="/fr/gateway/config-agents#agent-defaults">
    Clés de configuration des modèles.
  </Card>
</CardGroup>

Les références de modèle choisissent un fournisseur et un modèle. Elles ne choisissent généralement pas le runtime d'agent bas niveau. Par exemple, `openai/gpt-5.5` peut s'exécuter via le chemin normal du fournisseur OpenAI ou via le runtime app-server Codex, selon `agents.defaults.agentRuntime.id`. Voir [Runtimes d'agent](/fr/concepts/agent-runtimes).

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
    Le basculement d'authentification se produit à l'intérieur d'un fournisseur avant de passer au modèle suivant.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Surfaces de modèle associées">
    - `agents.defaults.models` est la liste d'autorisation / le catalogue des modèles qu'OpenClaw peut utiliser (ainsi que les alias).
    - `agents.defaults.imageModel` est utilisé **uniquement lorsque** le modèle principal ne peut pas accepter d'images.
    - `agents.defaults.pdfModel` est utilisé par l'outil `pdf`. S'il est omis, l'outil se replie sur `agents.defaults.imageModel`, puis sur le modèle résolu de session / par défaut.
    - `agents.defaults.imageGenerationModel` est utilisé par la capacité partagée de génération d'images. S'il est omis, `image_generate` peut tout de même déduire une valeur par défaut de fournisseur adossée à l'authentification. Il essaie d'abord le fournisseur par défaut actuel, puis les autres fournisseurs de génération d'images enregistrés dans l'ordre des ids de fournisseur. Si vous définissez un fournisseur/modèle spécifique, configurez aussi l'authentification / la clé API de ce fournisseur.
    - `agents.defaults.musicGenerationModel` est utilisé par la capacité partagée de génération musicale. S'il est omis, `music_generate` peut tout de même déduire une valeur par défaut de fournisseur adossée à l'authentification. Il essaie d'abord le fournisseur par défaut actuel, puis les autres fournisseurs de génération musicale enregistrés dans l'ordre des ids de fournisseur. Si vous définissez un fournisseur/modèle spécifique, configurez aussi l'authentification / la clé API de ce fournisseur.
    - `agents.defaults.videoGenerationModel` est utilisé par la capacité partagée de génération vidéo. S'il est omis, `video_generate` peut tout de même déduire une valeur par défaut de fournisseur adossée à l'authentification. Il essaie d'abord le fournisseur par défaut actuel, puis les autres fournisseurs de génération vidéo enregistrés dans l'ordre des ids de fournisseur. Si vous définissez un fournisseur/modèle spécifique, configurez aussi l'authentification / la clé API de ce fournisseur.
    - Les valeurs par défaut par agent peuvent remplacer `agents.defaults.model` via `agents.list[].model` plus les liaisons (voir [Routage multi-agent](/fr/concepts/multi-agent)).

  </Accordion>
</AccordionGroup>

## Politique rapide des modèles

- Définissez votre modèle principal sur le modèle de dernière génération le plus performant auquel vous avez accès.
- Utilisez des replis pour les tâches sensibles au coût / à la latence et les discussions à moindre enjeu.
- Pour les agents avec outils activés ou les entrées non fiables, évitez les anciens niveaux de modèles moins performants.

## Onboarding (recommandé)

Si vous ne souhaitez pas modifier la configuration à la main, exécutez l'onboarding :

```bash
openclaw onboard
```

Il peut configurer le modèle + l'authentification pour les fournisseurs courants, y compris **l'abonnement OpenAI Code (Codex)** (OAuth) et **Anthropic** (clé API ou CLI Claude).

## Clés de configuration (vue d'ensemble)

- `agents.defaults.model.primary` et `agents.defaults.model.fallbacks`
- `agents.defaults.imageModel.primary` et `agents.defaults.imageModel.fallbacks`
- `agents.defaults.pdfModel.primary` et `agents.defaults.pdfModel.fallbacks`
- `agents.defaults.imageGenerationModel.primary` et `agents.defaults.imageGenerationModel.fallbacks`
- `agents.defaults.videoGenerationModel.primary` et `agents.defaults.videoGenerationModel.fallbacks`
- `agents.defaults.models` (liste d'autorisation + alias + paramètres de fournisseur)
- `models.providers` (fournisseurs personnalisés écrits dans `models.json`)

<Note>
Les références de modèle sont normalisées en minuscules. Les alias de fournisseur comme `z.ai/*` sont normalisés en `zai/*`.

Des exemples de configuration de fournisseur (y compris OpenCode) se trouvent dans [OpenCode](/fr/providers/opencode).
</Note>

### Modifications sûres de la liste d'autorisation

Utilisez des écritures additives lorsque vous mettez à jour `agents.defaults.models` à la main :

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

<AccordionGroup>
  <Accordion title="Règles de protection contre l'écrasement">
    `openclaw config set` protège les maps de modèles / fournisseurs contre les écrasements accidentels. Une affectation d'objet simple à `agents.defaults.models`, `models.providers` ou `models.providers.<id>.models` est rejetée lorsqu'elle supprimerait des entrées existantes. Utilisez `--merge` pour les modifications additives ; utilisez `--replace` uniquement lorsque la valeur fournie doit devenir la valeur cible complète.

    La configuration interactive du fournisseur et `openclaw configure --section model` fusionnent aussi les sélections au niveau du fournisseur dans la liste d'autorisation existante, de sorte que l'ajout de Codex, Ollama ou d'un autre fournisseur ne supprime pas les entrées de modèle sans lien. Configure préserve un `agents.defaults.model.primary` existant lorsque l'authentification du fournisseur est réappliquée. Les commandes explicites de définition par défaut telles que `openclaw models auth login --provider <id> --set-default` et `openclaw models set <model>` remplacent toujours `agents.defaults.model.primary`.

  </Accordion>
</AccordionGroup>

## « Le modèle n'est pas autorisé » (et pourquoi les réponses s'arrêtent)

Si `agents.defaults.models` est défini, il devient la **liste d'autorisation** pour `/model` et pour les remplacements de session. Lorsqu'un utilisateur sélectionne un modèle qui n'est pas dans cette liste d'autorisation, OpenClaw renvoie :

```
Model "provider/model" is not allowed. Use /model to list available models.
```

<Warning>
Cela se produit **avant** qu'une réponse normale ne soit générée, donc le message peut donner l'impression qu'il « n'a pas répondu ». La correction consiste soit à :

- Ajouter le modèle à `agents.defaults.models`, ou
- Effacer la liste d'autorisation (supprimer `agents.defaults.models`), ou
- Choisir un modèle depuis `/model list`.

</Warning>

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

## Changer de modèle dans le chat (`/model`)

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
    - Sur Discord, `/model` et `/models` ouvrent un sélecteur interactif avec listes déroulantes de fournisseur et de modèle plus une étape Submit.
    - `/models add` est obsolète et renvoie désormais un message de dépréciation au lieu d'enregistrer des modèles depuis le chat.
    - `/model <#>` sélectionne à partir de ce sélecteur.

  </Accordion>
  <Accordion title="Persistance et bascule en direct">
    - `/model` conserve immédiatement la nouvelle sélection de session.
    - Si l'agent est inactif, l'exécution suivante utilise immédiatement le nouveau modèle.
    - Si une exécution est déjà active, OpenClaw marque une bascule en direct comme en attente et ne redémarre dans le nouveau modèle qu'à un point de nouvelle tentative propre.
    - Si l'activité des outils ou la sortie de réponse a déjà commencé, la bascule en attente peut rester en file jusqu'à une occasion de nouvelle tentative ultérieure ou jusqu'au prochain tour utilisateur.
    - `/model status` est la vue détaillée (candidats d'authentification et, lorsqu'ils sont configurés, `baseUrl` du endpoint du fournisseur + mode `api`).

  </Accordion>
  <Accordion title="Analyse de la référence">
    - Les références de modèle sont analysées en découpant sur le **premier** `/`. Utilisez `provider/model` lorsque vous saisissez `/model <ref>`.
    - Si l'id du modèle lui-même contient `/` (style OpenRouter), vous devez inclure le préfixe du fournisseur (exemple : `/model openrouter/moonshotai/kimi-k2`).
    - Si vous omettez le fournisseur, OpenClaw résout l'entrée dans cet ordre :
      1. correspondance d'alias
      2. correspondance de fournisseur configuré unique pour cet id de modèle exact sans préfixe
      3. repli obsolète vers le fournisseur par défaut configuré — si ce fournisseur n'expose plus le modèle par défaut configuré, OpenClaw se replie alors sur le premier fournisseur / modèle configuré pour éviter d'afficher une valeur par défaut obsolète d'un fournisseur supprimé.
  </Accordion>
</AccordionGroup>

Comportement / configuration complète des commandes : [Commandes slash](/fr/tools/slash-commands).

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

Affiche par défaut les modèles configurés. Drapeaux utiles :

<ParamField path="--all" type="boolean">
  Catalogue complet. Inclut les lignes statiques de catalogue incluses gérées par le fournisseur avant que l'authentification ne soit configurée, de sorte que les vues de découverte seule puissent afficher des modèles indisponibles tant que vous n'ajoutez pas les identifiants de fournisseur correspondants.
</ParamField>
<ParamField path="--local" type="boolean">
  Fournisseurs locaux uniquement.
</ParamField>
<ParamField path="--provider <id>" type="string">
  Filtrer par id de fournisseur, par exemple `moonshot`. Les libellés d'affichage des sélecteurs interactifs ne sont pas acceptés.
</ParamField>
<ParamField path="--plain" type="boolean">
  Un modèle par ligne.
</ParamField>
<ParamField path="--json" type="boolean">
  Sortie lisible par machine.
</ParamField>

### `models status`

Affiche le modèle principal résolu, les replis, le modèle d'image et un aperçu de l'authentification des fournisseurs configurés. Il affiche également l'état d'expiration OAuth pour les profils trouvés dans le magasin d'authentification (avertissement dans les 24 h par défaut). `--plain` affiche uniquement le modèle principal résolu.

<AccordionGroup>
  <Accordion title="Comportement d'authentification et de sonde">
    - L'état OAuth est toujours affiché (et inclus dans la sortie `--json`). Si un fournisseur configuré n'a pas d'identifiants, `models status` affiche une section **Authentification manquante**.
    - Le JSON inclut `auth.oauth` (fenêtre d'avertissement + profils) et `auth.providers` (authentification effective par fournisseur, y compris les identifiants adossés à l'environnement). `auth.oauth` concerne uniquement l'état de santé des profils du magasin d'authentification ; les fournisseurs uniquement basés sur l'environnement n'y apparaissent pas.
    - Utilisez `--check` pour l'automatisation (code de sortie `1` si manquant / expiré, `2` si bientôt expiré).
    - Utilisez `--probe` pour des vérifications d'authentification en direct ; les lignes de sonde peuvent provenir de profils d'authentification, d'identifiants d'environnement ou de `models.json`.
    - Si `auth.order.<provider>` explicite omet un profil stocké, la sonde signale `excluded_by_auth_order` au lieu de l'essayer. Si l'authentification existe mais qu'aucun modèle sondable ne peut être résolu pour ce fournisseur, la sonde signale `status: no_model`.

  </Accordion>
</AccordionGroup>

<Note>
Le choix d'authentification dépend du fournisseur / du compte. Pour les hôtes gateway toujours actifs, les clés API sont généralement les plus prévisibles ; la réutilisation de la CLI Claude et les profils OAuth / jeton Anthropic existants sont aussi pris en charge.
</Note>

Exemple (CLI Claude) :

```bash
claude auth login
openclaw models status
```

## Analyse (modèles gratuits OpenRouter)

`openclaw models scan` inspecte le **catalogue des modèles gratuits** d'OpenRouter et peut éventuellement sonder les modèles pour la prise en charge des outils et des images.

<ParamField path="--no-probe" type="boolean">
  Ignorer les sondes en direct (métadonnées uniquement).
</ParamField>
<ParamField path="--min-params <b>" type="number">
  Taille minimale en paramètres (milliards).
</ParamField>
<ParamField path="--max-age-days <days>" type="number">
  Ignorer les modèles plus anciens.
</ParamField>
<ParamField path="--provider <name>" type="string">
  Filtre par préfixe de fournisseur.
</ParamField>
<ParamField path="--max-candidates <n>" type="number">
  Taille de la liste de repli.
</ParamField>
<ParamField path="--set-default" type="boolean">
  Définir `agents.defaults.model.primary` sur la première sélection.
</ParamField>
<ParamField path="--set-image" type="boolean">
  Définir `agents.defaults.imageModel.primary` sur la première sélection d'image.
</ParamField>

<Note>
Le catalogue OpenRouter `/models` est public, donc les analyses de métadonnées seules peuvent lister les candidats gratuits sans clé. Les sondes et l'inférence nécessitent tout de même une clé API OpenRouter (depuis les profils d'authentification ou `OPENROUTER_API_KEY`). Si aucune clé n'est disponible, `openclaw models scan` se replie sur une sortie de métadonnées seules et laisse la configuration inchangée. Utilisez `--no-probe` pour demander explicitement le mode métadonnées seules.
</Note>

Les résultats de l'analyse sont classés selon :

1. Prise en charge des images
2. Latence des outils
3. Taille du contexte
4. Nombre de paramètres

Entrée :

- Liste OpenRouter `/models` (filtre `:free`)
- Les sondes en direct nécessitent une clé API OpenRouter provenant des profils d'authentification ou de `OPENROUTER_API_KEY` (voir [Variables d'environnement](/fr/help/environment))
- Filtres facultatifs : `--max-age-days`, `--min-params`, `--provider`, `--max-candidates`
- Contrôles de requête / sonde : `--timeout`, `--concurrency`

Lorsque les sondes en direct s'exécutent dans un TTY, vous pouvez sélectionner les replis de manière interactive. En mode non interactif, transmettez `--yes` pour accepter les valeurs par défaut. Les résultats de métadonnées seules sont informatifs ; `--set-default` et `--set-image` nécessitent des sondes en direct afin qu'OpenClaw ne configure pas un modèle OpenRouter sans clé et inutilisable.

## Registre des modèles (`models.json`)

Les fournisseurs personnalisés dans `models.providers` sont écrits dans `models.json` sous le répertoire de l'agent (par défaut `~/.openclaw/agents/<agentId>/agent/models.json`). Ce fichier est fusionné par défaut, sauf si `models.mode` est défini sur `replace`.

<AccordionGroup>
  <Accordion title="Priorité du mode fusion">
    Priorité du mode fusion pour les ids de fournisseur correspondants :

    - `baseUrl` non vide déjà présent dans `models.json` de l'agent l'emporte.
    - `apiKey` non vide dans `models.json` de l'agent l'emporte uniquement lorsque ce fournisseur n'est pas géré par SecretRef dans le contexte actuel de configuration / profil d'authentification.
    - Les valeurs `apiKey` de fournisseur gérées par SecretRef sont actualisées à partir des marqueurs de source (`ENV_VAR_NAME` pour les références d'environnement, `secretref-managed` pour les références fichier / exec) au lieu de conserver les secrets résolus.
    - Les valeurs d'en-tête de fournisseur gérées par SecretRef sont actualisées à partir des marqueurs de source (`secretref-env:ENV_VAR_NAME` pour les références d'environnement, `secretref-managed` pour les références fichier / exec).
    - Les `apiKey` / `baseUrl` vides ou manquants de l'agent se replient sur `models.providers` de la configuration.
    - Les autres champs du fournisseur sont actualisés à partir de la configuration et des données de catalogue normalisées.

  </Accordion>
</AccordionGroup>

<Note>
La persistance des marqueurs est pilotée par la source : OpenClaw écrit les marqueurs à partir de l'instantané de configuration source actif (avant résolution), et non à partir des valeurs secrètes résolues à l'exécution. Cela s'applique chaque fois qu'OpenClaw régénère `models.json`, y compris dans les chemins pilotés par commande comme `openclaw agent`.
</Note>

## Liens associés

- [Runtimes d'agent](/fr/concepts/agent-runtimes) — PI, Codex et autres runtimes de boucle d'agent
- [Référence de configuration](/fr/gateway/config-agents#agent-defaults) — clés de configuration des modèles
- [Génération d'images](/fr/tools/image-generation) — configuration du modèle d'image
- [Basculement de modèle](/fr/concepts/model-failover) — chaînes de repli
- [Fournisseurs de modèles](/fr/concepts/model-providers) — routage des fournisseurs et authentification
- [Génération musicale](/fr/tools/music-generation) — configuration du modèle musical
- [Génération vidéo](/fr/tools/video-generation) — configuration du modèle vidéo
