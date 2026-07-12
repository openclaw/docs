---
read_when:
    - Modification du comportement de repli du modèle ou de l’expérience utilisateur de sélection
    - Débogage de l’erreur « model is not allowed » ou d’un recours obsolète au fournisseur par défaut
    - Travail sur le comportement de fusion et de gestion des secrets de models.json
sidebarTitle: Models CLI
summary: Comment OpenClaw résout les références de fournisseur/modèle, les clés de configuration et la commande de chat `/model`
title: CLI des modèles
x-i18n:
    generated_at: "2026-07-12T15:20:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 20a5e4861bdafa1f5ff549fc54968051b653611f1ef05e836df855638a7aa967
    source_path: concepts/models.md
    workflow: 16
---

<CardGroup cols={2}>
  <Card title="Basculement de modèle" href="/fr/concepts/model-failover">
    Rotation des profils d’authentification, délais de récupération et interaction avec les modèles de secours.
  </Card>
  <Card title="Fournisseurs de modèles" href="/fr/concepts/model-providers">
    Présentation rapide des fournisseurs et exemples.
  </Card>
  <Card title="Référence de la CLI des modèles" href="/fr/cli/models">
    Référence complète de la commande `openclaw models` et de ses options.
  </Card>
  <Card title="Référence de configuration" href="/fr/gateway/config-agents#agent-defaults">
    Clés de configuration des modèles, valeurs par défaut et exemples.
  </Card>
</CardGroup>

Une référence de modèle (`provider/model`) choisit un fournisseur et un modèle, et non l’environnement d’exécution d’agent de bas niveau. Lorsque la politique d’environnement d’exécution n’est pas définie ou vaut `auto`, la politique de routage propre au fournisseur d’OpenAI peut sélectionner Codex uniquement pour une route officielle exacte HTTPS Platform Responses ou ChatGPT Responses, sans remplacement de requête défini par l’auteur ; le préfixe `openai/*` seul ne sélectionne jamais Codex. Les adaptateurs Completions, les points de terminaison personnalisés et le comportement de requête défini par l’auteur restent sur OpenClaw. Les points de terminaison HTTP officiels en texte clair sont rejetés. Consultez [Environnement d’exécution d’agent implicite d’OpenAI](/fr/providers/openai#implicit-agent-runtime).

Les références Copilot par abonnement (`github-copilot/*`) peuvent être explicitement configurées pour utiliser le plugin externe d’environnement d’exécution d’agent GitHub Copilot, mais ce chemin est toujours explicite (jamais sélectionné par `auto`). Les remplacements d’environnement d’exécution doivent être définis dans la politique du fournisseur/modèle, et non sur l’ensemble de l’agent ou de la session. La sélection de l’environnement d’exécution ne détermine pas la facturation : les identifiants de clé d’API OpenAI et d’abonnement ChatGPT/Codex restent distincts. Consultez [Environnements d’exécution d’agent](/fr/concepts/agent-runtimes) et [Environnement d’exécution d’agent GitHub Copilot](/fr/plugins/copilot).

## Ordre de sélection

<Steps>
  <Step title="Modèle principal">
    `agents.defaults.model.primary` (ou `agents.defaults.model` sous forme de chaîne simple).
  </Step>
  <Step title="Modèles de secours">
    `agents.defaults.model.fallbacks`, essayés dans l’ordre.
  </Step>
  <Step title="Basculement de l’authentification">
    La rotation des profils d’authentification s’effectue au sein d’un fournisseur avant qu’OpenClaw ne passe au modèle de secours suivant.
  </Step>
</Steps>

Surfaces associées de configuration des modèles :

- `agents.defaults.models` est la liste d’autorisation/le catalogue des modèles qu’OpenClaw peut utiliser, ainsi que leurs alias. Utilisez des entrées `provider/*` pour autoriser tous les modèles découverts auprès d’un fournisseur sans les répertorier individuellement.
- `agents.defaults.utilityModel` est un modèle facultatif moins coûteux destiné aux courtes tâches internes, telles que les titres générés des sessions du tableau de bord, les titres des fils de discussion/sujets des canaux pris en charge et la narration de la progression. La valeur `agents.list[].utilityModel` propre à chaque agent la remplace. Lorsqu’elle n’est pas définie, OpenClaw utilise le petit modèle par défaut déclaré par le fournisseur principal lorsqu’il en existe un (OpenAI → `gpt-5.6-luna`, Anthropic → `claude-haiku-4-5`), sinon le modèle principal de l’agent ; définissez-la sur une chaîne vide pour désactiver le routage des tâches utilitaires. Les tâches utilitaires sont des appels de modèle distincts et peuvent envoyer un contenu de tâche limité au fournisseur du modèle sélectionné.
- `agents.defaults.imageModel` est utilisé uniquement lorsque le modèle principal ne peut pas accepter d’images.
- `agents.defaults.pdfModel` est utilisé par l’outil `pdf`. S’il n’est pas défini, l’outil utilise en secours `imageModel`, puis le modèle résolu de la session/par défaut.
- `agents.defaults.imageGenerationModel`, `musicGenerationModel` et `videoGenerationModel` prennent en charge les outils partagés de génération de médias. Si elles ne sont pas définies, chaque outil déduit un fournisseur par défaut disposant d’une authentification : d’abord le fournisseur actuellement défini par défaut, puis les autres fournisseurs enregistrés pour cette fonctionnalité, dans l’ordre de leur identifiant. Définissez `agents.defaults.mediaGenerationAutoProviderFallback: false` pour désactiver cette déduction entre fournisseurs tout en conservant les modèles de secours explicites.
- La valeur `agents.list[].model` propre à chaque agent (ainsi que les liaisons) remplace `agents.defaults.model` — consultez [Routage multi-agent](/fr/concepts/multi-agent).

Référence complète des clés, valeurs par défaut et exemples JSON5 : [Référence de configuration](/fr/gateway/config-agents#agent-defaults).

## Source de sélection et rigueur du basculement

La même référence `provider/model` se comporte différemment selon son origine :

| Source                                                                  | Comportement                                                                                                                                                                                                                                                       |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Valeur par défaut configurée (`agents.defaults.model.primary`, modèle principal propre à l’agent) | Point de départ normal ; utilise `agents.defaults.model.fallbacks`.                                                                                                                                                                                                 |
| Basculement automatique                                                           | État temporaire de récupération, enregistré sous `modelOverrideSource: "auto"`. OpenClaw teste à nouveau périodiquement le modèle principal d’origine, efface la sélection automatique lors de la récupération et annonce les transitions vers le modèle de secours ou le retour au modèle principal une fois par changement d’état.                              |
| Sélection de la session par l’utilisateur                                                  | Exacte et stricte. `/model`, le sélecteur de modèle, `session_status(model=...)` et `sessions.patch` enregistrent `modelOverrideSource: "user"`. Si ce fournisseur/modèle devient inaccessible, l’exécution échoue de manière visible au lieu de passer à un autre modèle configuré. |
| `--model` de Cron / `model` de la charge utile                                        | Modèle principal propre à la tâche. Utilise toujours les modèles de secours configurés, sauf si la tâche fournit ses propres `fallbacks` dans la charge utile (`fallbacks: []` impose une exécution stricte).                                                                                                                    |

Autres règles de sélection :

- La modification de `agents.defaults.model.primary` ne réécrit pas les modèles épinglés des sessions existantes. Si l’état indique `This session is pinned to X; config primary Y will apply to new/unpinned sessions.`, exécutez `/model default` pour supprimer l’épinglage.
- Les sélecteurs de modèle par défaut et de liste d’autorisation de la CLI respectent `models.mode: "replace"` en répertoriant uniquement `models.providers.*.models` au lieu de l’intégralité du catalogue intégré.
- Le sélecteur de modèle de l’interface de contrôle demande au Gateway sa vue configurée des modèles : `agents.defaults.models` lorsqu’elle est définie (y compris les entrées génériques `provider/*`), sinon `models.providers.*.models` ainsi que les fournisseurs disposant d’une authentification utilisable. L’intégralité du catalogue intégré est réservée aux vues de navigation explicites (`models.list` avec `view: "all"`, ou `openclaw models list --all`).
- Les interfaces d’inventaire des fournisseurs utilisent `models.list` avec `view: "provider-config"` pour afficher les lignes de `models.providers.*.models` définies par la source sans appliquer les listes d’autorisation des sélecteurs.

Mécanisme complet : [Basculement de modèle](/fr/concepts/model-failover).

## Politique rapide pour les modèles

- Définissez comme modèle principal le modèle de dernière génération le plus performant auquel vous avez accès.
- Utilisez des modèles de secours pour les tâches sensibles au coût ou à la latence et les conversations à moindre enjeu.
- Pour les agents dotés d’outils ou les entrées non fiables, évitez les niveaux de modèles anciens ou moins performants.

## Intégration initiale

```bash
openclaw onboard
```

Configure le modèle et l’authentification pour les fournisseurs courants sans modifier manuellement la configuration, notamment l’OAuth d’abonnement OpenAI Codex et Anthropic (clé d’API ou réutilisation de la CLI Claude).

Lorsqu’aucun modèle principal n’est configuré, une nouvelle configuration par clé d’API OpenAI sélectionne `openai/gpt-5.6` ; l’identifiant d’API directe sans qualificatif correspond au niveau Sol. Une nouvelle configuration OAuth ChatGPT/Codex sélectionne la référence exacte du catalogue `openai/gpt-5.6-sol`. Une réauthentification conserve un modèle principal explicite existant, y compris `openai/gpt-5.5`. Si GPT-5.6 n’est pas disponible pour le compte, sélectionnez explicitement `openai/gpt-5.5` ; OpenClaw ne le rétrograde pas silencieusement.

## « Modèle non autorisé » (et pourquoi les réponses s’arrêtent)

Si `agents.defaults.models` est défini, il devient la liste d’autorisation pour `/model` et les remplacements de session. La sélection d’un modèle absent de cette liste renvoie le message suivant avant la génération de toute réponse normale :

```text
Le modèle "provider/model" n’est pas autorisé. Utilisez /models pour répertorier les fournisseurs, ou /models <provider> pour répertorier les modèles.
Ajoutez-le avec : openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
```

Corrigez le problème en ajoutant le modèle à `agents.defaults.models`, en supprimant entièrement la liste d’autorisation (supprimez la clé) ou en choisissant un modèle dans `/model list`. Si la commande rejetée comportait un remplacement d’environnement d’exécution, tel que `/model openai/gpt-5.5 --runtime codex`, corrigez d’abord la liste d’autorisation, puis réessayez la même commande `/model ... --runtime ...`.

Pour les modèles locaux/GGUF, la liste d’autorisation doit contenir la référence complète préfixée par le fournisseur, par exemple `ollama/gemma4:26b` ou `lmstudio/Gemma4-26b-a4-it-gguf` — consultez `openclaw models list --provider <provider>` pour obtenir la chaîne exacte. Les noms de fichiers seuls ou les noms d’affichage ne suffisent pas lorsque la liste d’autorisation est active.

Pour limiter les fournisseurs sans répertorier chaque modèle, utilisez des entrées génériques `provider/*` :

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

`/model`, `/models` et les sélecteurs de modèles affichent alors uniquement le catalogue découvert pour ces fournisseurs, et de nouveaux modèles peuvent apparaître sans modification de la liste d’autorisation. Combinez des entrées exactes `provider/model` avec des entrées `provider/*` pour inclure un modèle précis provenant d’un autre fournisseur.

Exemple de liste d’autorisation avec des alias :

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

<Accordion title="Modification sûre de la liste d’autorisation depuis la CLI">
Utilisez `--merge` pour les modifications additives :

```bash
openclaw config set agents.defaults.models '{"openai/gpt-5.4":{}}' --strict-json --merge
```

`openclaw config set` refuse les affectations d’objets simples à `agents.defaults.models`, `models.providers` ou `models.providers.<id>.models` lorsqu’elles supprimeraient des entrées existantes ; utilisez `--replace` uniquement lorsque la nouvelle valeur doit devenir la valeur cible complète. La configuration interactive des fournisseurs et `openclaw configure --section model` fusionnent déjà les sélections propres au fournisseur dans la liste d’autorisation ; l’ajout d’un fournisseur ne supprime donc pas les entrées sans rapport, et la configuration conserve une valeur `agents.defaults.model.primary` existante. Les commandes explicites telles que `openclaw models auth login --provider <id> --set-default` et `openclaw models set <model>` remplacent toujours le modèle principal.
</Accordion>

## `/model` dans la conversation

```text
/model
/model list
/model 3
/model openai/gpt-5.4
/model default
/model status
```

- `/model` et `/model list` affichent un sélecteur numéroté compact (famille de modèles + fournisseurs disponibles) ; `/model <#>` permet d’y effectuer une sélection. Sur Discord, cela ouvre des listes déroulantes de fournisseurs et de modèles avec une étape Submit ; sur Telegram, les sélections du sélecteur sont limitées à la session et ne réécrivent jamais la valeur par défaut persistante de l’agent dans `openclaw.json`. `/models add` est obsolète et renvoie un message au lieu d’enregistrer des modèles depuis la discussion.
- `/model` conserve immédiatement la nouvelle sélection de session. Si l’agent est inactif, l’exécution suivante l’utilise immédiatement ; si une exécution est déjà active, le changement est mis en file d’attente jusqu’au prochain point de nouvelle tentative propre (ou un point ultérieur, si l’activité des outils ou la sortie de la réponse a déjà commencé).
- `/model default` efface la sélection de session afin qu’elle hérite à nouveau du modèle principal configuré.
- Une référence `/model` sélectionnée par l’utilisateur est stricte pour cette session : si elle devient inaccessible, la réponse échoue de manière visible au lieu de recourir silencieusement aux modèles de secours définis dans `agents.defaults.model.fallbacks`. Les valeurs par défaut configurées et les modèles principaux des tâches Cron continuent d’utiliser les chaînes de secours.
- `/model status` fournit la vue détaillée : les candidats d’authentification par fournisseur et, lorsqu’il est configuré, le point de terminaison `baseUrl` du fournisseur ainsi que le mode `api`.
- Les références de modèles sont analysées en les scindant au premier `/` ; saisissez `provider/model`. Si l’ID du modèle contient lui-même `/` (comme avec OpenRouter), incluez le préfixe du fournisseur, par exemple `/model openrouter/moonshotai/kimi-k2`. Si vous omettez le fournisseur, OpenClaw essaie : (1) une correspondance d’alias, (2) une correspondance unique avec un fournisseur configuré pour cet ID de modèle exact sans préfixe, (3) le fournisseur par défaut configuré (solution de secours obsolète) — et, si ce fournisseur n’expose plus le modèle par défaut configuré, le premier couple fournisseur/modèle configuré à la place, afin d’éviter d’afficher une valeur par défaut obsolète correspondant à un fournisseur supprimé.
- Les références de modèles sont normalisées en minuscules ; les ID de fournisseurs doivent autrement correspondre exactement, utilisez donc l’ID annoncé par le plugin.

Comportement complet des commandes et configuration : [Commandes slash](/fr/tools/slash-commands).

## CLI

```bash
openclaw models status
openclaw models list
openclaw models set <provider/model>
openclaw models set-image <provider/model>
openclaw models scan
openclaw models aliases list|add|remove
openclaw models fallbacks list|add|remove|clear
openclaw models image-fallbacks list|add|remove|clear
openclaw models auth list|add|login|paste-api-key|paste-token|setup-token|order
```

`openclaw models` sans sous-commande est un raccourci vers `models status`, qui indique également l’expiration OAuth des profils du magasin d’authentification (avertissement dans les 24h par défaut). Options complètes, structures JSON et sous-commandes des profils d’authentification : [Référence de la CLI des modèles](/fr/cli/models).

<AccordionGroup>
  <Accordion title="Analyse (modèles gratuits d’OpenRouter)">
    `openclaw models scan` examine le catalogue public de modèles gratuits d’OpenRouter et peut tester en direct la prise en charge des outils et des images par les candidats. Le catalogue lui-même est public ; les analyses limitées aux métadonnées (`--no-probe`) ne nécessitent donc aucune clé. Les tests en direct et `--set-default`/`--set-image` nécessitent une clé API OpenRouter (profil d’authentification ou `OPENROUTER_API_KEY`) et, en son absence, échouent de manière sécurisée en produisant uniquement les métadonnées.

    Les résultats sont classés selon les critères suivants : prise en charge des images, puis latence des outils, puis taille du contexte, puis nombre de paramètres. Dans un TTY, les résultats testés invitent à effectuer une sélection interactive des modèles de secours ; le mode non interactif nécessite `--yes` pour accepter les valeurs par défaut.

  </Accordion>
</AccordionGroup>

## Registre des modèles (`models.json`)

Les fournisseurs personnalisés configurés sous `models.providers` sont écrits dans `models.json` dans le répertoire de l’agent (`~/.openclaw/agents/<agentId>/agent/models.json` par défaut). Les catalogues des plugins fournisseurs sont stockés séparément sous forme de fragments de catalogue générés appartenant aux plugins et se chargent automatiquement. Par défaut, ce fichier est fusionné avec la configuration ; définissez `models.mode: "replace"` pour utiliser uniquement vos fournisseurs configurés.

<AccordionGroup>
  <Accordion title="Priorité du mode de fusion">
    Pour les ID de fournisseurs correspondants :

    - Une valeur `baseUrl` non vide déjà présente dans le fichier `models.json` de l’agent prévaut.
    - Une valeur `apiKey` non vide dans `models.json` prévaut uniquement lorsque ce fournisseur n’est pas géré par SecretRef dans le contexte actuel de la configuration ou du profil d’authentification.
    - Les valeurs `apiKey` gérées par SecretRef sont actualisées à partir des marqueurs de source au lieu de conserver les secrets résolus : le nom de la variable d’environnement pour les références d’environnement, `secretref-managed` pour les références de fichier ou d’exécution.
    - Les valeurs d’en-tête gérées par SecretRef sont actualisées de la même manière, à l’aide de `secretref-env:ENV_VAR_NAME` pour les références d’environnement.
    - Les valeurs `apiKey`/`baseUrl` vides ou absentes dans `models.json` utilisent en dernier recours celles de `models.providers` dans la configuration.
    - Les autres champs du fournisseur sont actualisés à partir de la configuration et des données normalisées du catalogue.

  </Accordion>
</AccordionGroup>

La persistance des marqueurs fait autorité par rapport à leur source : OpenClaw écrit les marqueurs à partir de l’instantané actif de la configuration source (avant résolution), et non à partir des valeurs secrètes résolues à l’exécution, chaque fois qu’il régénère `models.json` — y compris par des chemins déclenchés par des commandes comme `openclaw agent`.

## Ressources associées

- [Environnements d’exécution des agents](/fr/concepts/agent-runtimes) — OpenClaw, Codex et autres environnements d’exécution de boucles d’agents
- [Référence de configuration](/fr/gateway/config-agents#agent-defaults) — clés de configuration des modèles
- [Génération d’images](/fr/tools/image-generation) — configuration des modèles d’images
- [Basculement de modèle](/fr/concepts/model-failover) — chaînes de secours
- [Fournisseurs de modèles](/fr/concepts/model-providers) — routage des fournisseurs et authentification
- [Référence de la CLI des modèles](/fr/cli/models) — référence complète des commandes et des options
- [Génération musicale](/fr/tools/music-generation) — configuration des modèles musicaux
- [Génération de vidéos](/fr/tools/video-generation) — configuration des modèles vidéo
