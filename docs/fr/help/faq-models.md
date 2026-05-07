---
read_when:
    - Choisir ou changer de modèle, configurer des alias
    - Débogage du basculement de modèle / « Tous les modèles ont échoué »
    - Comprendre les profils d’authentification et leur gestion
sidebarTitle: Models FAQ
summary: 'FAQ : valeurs par défaut des modèles, sélection, alias, changement, basculement de secours et profils d’authentification'
title: 'FAQ : modèles et authentification'
x-i18n:
    generated_at: "2026-05-07T13:19:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: fec3256990c91d30e1241554ceafeb23ba0eb9b858cd028d64c9cd0631e67f34
    source_path: help/faq-models.md
    workflow: 16
---

  Questions-réponses sur les modèles et les profils d’authentification. Pour la configuration, les sessions, le Gateway, les canaux et le
  dépannage, consultez la [FAQ](/fr/help/faq) principale.

  ## Modèles : valeurs par défaut, sélection, alias, changement

  <AccordionGroup>
  <Accordion title='Qu’est-ce que le « modèle par défaut » ?'>
    Le modèle par défaut d’OpenClaw est celui que vous définissez comme :

    ```
    agents.defaults.model.primary
    ```

    Les modèles sont référencés sous la forme `provider/model` (exemple : `openai/gpt-5.5` ou `anthropic/claude-sonnet-4-6`). Si vous omettez le fournisseur, OpenClaw essaie d’abord un alias, puis une correspondance unique avec un fournisseur configuré pour cet identifiant de modèle exact, et ne revient qu’ensuite au fournisseur par défaut configuré comme chemin de compatibilité obsolète. Si ce fournisseur n’expose plus le modèle par défaut configuré, OpenClaw revient au premier fournisseur/modèle configuré au lieu d’afficher une valeur par défaut obsolète d’un fournisseur supprimé. Vous devriez tout de même définir **explicitement** `provider/model`.

  </Accordion>

  <Accordion title="Quel modèle recommandez-vous ?">
    **Valeur par défaut recommandée :** utilisez le modèle de dernière génération le plus puissant disponible dans votre pile de fournisseurs.
    **Pour les agents avec outils ou entrées non fiables :** privilégiez la puissance du modèle plutôt que le coût.
    **Pour les conversations courantes/à faible enjeu :** utilisez des modèles de secours moins chers et routez selon le rôle de l’agent.

    MiniMax dispose de sa propre documentation : [MiniMax](/fr/providers/minimax) et
    [Modèles locaux](/fr/gateway/local-models).

    Règle générale : utilisez le **meilleur modèle que vous pouvez vous permettre** pour les travaux à fort enjeu, et un modèle moins cher
    pour les conversations courantes ou les résumés. Vous pouvez router les modèles par agent et utiliser des sous-agents pour
    paralléliser les tâches longues (chaque sous-agent consomme des tokens). Consultez [Modèles](/fr/concepts/models) et
    [Sous-agents](/fr/tools/subagents).

    Avertissement important : les modèles plus faibles ou trop quantifiés sont plus vulnérables à l’injection de prompt
    et aux comportements dangereux. Consultez [Sécurité](/fr/gateway/security).

    Plus de contexte : [Modèles](/fr/concepts/models).

  </Accordion>

  <Accordion title="Comment changer de modèle sans effacer ma configuration ?">
    Utilisez les **commandes de modèle** ou modifiez uniquement les champs **model**. Évitez les remplacements complets de configuration.

    Options sûres :

    - `/model` dans la conversation (rapide, par session)
    - `openclaw models set ...` (met à jour uniquement la configuration du modèle)
    - `openclaw configure --section model` (interactif)
    - modifiez `agents.defaults.model` dans `~/.openclaw/openclaw.json`

    Évitez `config.apply` avec un objet partiel, sauf si vous souhaitez remplacer toute la configuration.
    Pour les modifications RPC, inspectez d’abord avec `config.schema.lookup` et privilégiez `config.patch`. La charge utile de recherche fournit le chemin normalisé, les documents/contraintes de schéma superficiels et les résumés des enfants immédiats.
    pour les mises à jour partielles.
    Si vous avez écrasé la configuration, restaurez-la depuis une sauvegarde ou relancez `openclaw doctor` pour réparer.

    Documentation : [Modèles](/fr/concepts/models), [Configurer](/fr/cli/configure), [Configuration](/fr/cli/config), [Doctor](/fr/gateway/doctor).

  </Accordion>

  <Accordion title="Puis-je utiliser des modèles auto-hébergés (llama.cpp, vLLM, Ollama) ?">
    Oui. Ollama est le chemin le plus simple pour les modèles locaux.

    Configuration la plus rapide :

    1. Installez Ollama depuis `https://ollama.com/download`
    2. Récupérez un modèle local comme `ollama pull gemma4`
    3. Si vous voulez aussi des modèles cloud, exécutez `ollama signin`
    4. Exécutez `openclaw onboard` et choisissez `Ollama`
    5. Choisissez `Local` ou `Cloud + Local`

    Notes :

    - `Cloud + Local` vous donne accès aux modèles cloud plus vos modèles Ollama locaux
    - les modèles cloud comme `kimi-k2.5:cloud` ne nécessitent pas de récupération locale
    - pour un changement manuel, utilisez `openclaw models list` et `openclaw models set ollama/<model>`

    Note de sécurité : les modèles plus petits ou fortement quantifiés sont plus vulnérables à l’injection de prompt.
    Nous recommandons fortement de **grands modèles** pour tout bot pouvant utiliser des outils.
    Si vous souhaitez tout de même utiliser de petits modèles, activez le sandboxing et des listes d’autorisation d’outils strictes.

    Documentation : [Ollama](/fr/providers/ollama), [Modèles locaux](/fr/gateway/local-models),
    [Fournisseurs de modèles](/fr/concepts/model-providers), [Sécurité](/fr/gateway/security),
    [Sandboxing](/fr/gateway/sandboxing).

  </Accordion>

  <Accordion title="Quels modèles OpenClaw, Flawd et Krill utilisent-ils ?">
    - Ces déploiements peuvent différer et évoluer au fil du temps ; il n’existe aucune recommandation fixe de fournisseur.
    - Vérifiez le paramètre d’exécution actuel sur chaque gateway avec `openclaw models status`.
    - Pour les agents sensibles à la sécurité ou avec outils, utilisez le modèle de dernière génération le plus puissant disponible.

  </Accordion>

  <Accordion title="Comment changer de modèle à la volée (sans redémarrer) ?">
    Utilisez la commande `/model` comme message autonome :

    ```
    /model sonnet
    /model opus
    /model gpt
    /model gpt-mini
    /model gemini
    /model gemini-flash
    /model gemini-flash-lite
    ```

    Ce sont les alias intégrés. Des alias personnalisés peuvent être ajoutés via `agents.defaults.models`.

    Vous pouvez lister les modèles disponibles avec `/model`, `/model list` ou `/model status`.

    `/model` (et `/model list`) affiche un sélecteur compact numéroté. Sélectionnez par numéro :

    ```
    /model 3
    ```

    Vous pouvez aussi forcer un profil d’authentification spécifique pour le fournisseur (par session) :

    ```
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    Astuce : `/model status` indique quel agent est actif, quel fichier `auth-profiles.json` est utilisé et quel profil d’authentification sera essayé ensuite.
    Il indique aussi le point de terminaison du fournisseur configuré (`baseUrl`) et le mode API (`api`) lorsqu’ils sont disponibles.

    **Comment détacher un profil que j’ai défini avec @profile ?**

    Relancez `/model` **sans** le suffixe `@profile` :

    ```
    /model anthropic/claude-opus-4-6
    ```

    Si vous voulez revenir à la valeur par défaut, choisissez-la depuis `/model` (ou envoyez `/model <default provider/model>`).
    Utilisez `/model status` pour confirmer quel profil d’authentification est actif.

  </Accordion>

  <Accordion title="Puis-je utiliser GPT 5.5 pour les tâches quotidiennes et Codex 5.5 pour le codage ?">
    Oui. Traitez le choix du modèle et le choix de l’environnement d’exécution séparément :

    - **Agent de codage Codex natif :** définissez `agents.defaults.model.primary` sur `openai/gpt-5.5`. Connectez-vous avec `openclaw models auth login --provider openai-codex` lorsque vous voulez utiliser l’authentification par abonnement ChatGPT/Codex.
    - **Tâches directes avec l’API OpenAI hors boucle d’agent :** configurez `OPENAI_API_KEY` pour les images, embeddings, la parole, le temps réel et les autres surfaces d’API OpenAI hors agent.
    - **Authentification par clé d’API de l’agent OpenAI :** utilisez `/model openai/gpt-5.5` avec un profil de clé d’API `openai-codex` ordonné.
    - **Sous-agents :** routez les tâches de codage vers un agent réservé à Codex avec son propre modèle et sa valeur par défaut `agentRuntime`.

    Consultez [Modèles](/fr/concepts/models) et [Commandes slash](/fr/tools/slash-commands).

  </Accordion>

  <Accordion title="Comment configurer le mode rapide pour GPT 5.5 ?">
    Utilisez soit un basculement de session, soit une valeur par défaut de configuration :

    - **Par session :** envoyez `/fast on` pendant que la session utilise `openai/gpt-5.5`.
    - **Valeur par défaut par modèle :** définissez `agents.defaults.models["openai/gpt-5.5"].params.fastMode` sur `true`.

    Exemple :

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: {
                fastMode: true,
              },
            },
          },
        },
      },
    }
    ```

    Pour OpenAI, le mode rapide correspond à `service_tier = "priority"` sur les requêtes Responses natives prises en charge. Les remplacements `/fast` de session priment sur les valeurs par défaut de configuration.

    Consultez [Réflexion et mode rapide](/fr/tools/thinking) et [Mode rapide OpenAI](/fr/providers/openai#fast-mode).

  </Accordion>

  <Accordion title='Pourquoi vois-je « Model ... is not allowed » puis aucune réponse ?'>
    Si `agents.defaults.models` est défini, il devient la **liste d’autorisation** pour `/model` et tous les
    remplacements de session. Choisir un modèle qui ne figure pas dans cette liste renvoie :

    ```
    Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
    Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
    ```

    Cette erreur est renvoyée **à la place** d’une réponse normale. Correctif : ajoutez le modèle à
    `agents.defaults.models`, supprimez la liste d’autorisation ou choisissez un modèle depuis `/model list`.
    Si la commande incluait aussi `--runtime codex`, ajoutez d’abord le modèle puis réessayez
    la même commande `/model provider/model --runtime codex`.

  </Accordion>

  <Accordion title='Pourquoi vois-je « Unknown model: minimax/MiniMax-M2.7 » ?'>
    Cela signifie que le **fournisseur n’est pas configuré** (aucune configuration de fournisseur MiniMax ni aucun
    profil d’authentification n’a été trouvé), donc le modèle ne peut pas être résolu.

    Liste de vérification pour corriger :

    1. Mettez à niveau vers une version actuelle d’OpenClaw (ou exécutez depuis la source `main`), puis redémarrez le gateway.
    2. Assurez-vous que MiniMax est configuré (assistant ou JSON), ou qu’une authentification MiniMax
       existe dans les variables d’environnement/profils d’authentification afin que le fournisseur correspondant puisse être injecté
       (`MINIMAX_API_KEY` pour `minimax`, `MINIMAX_OAUTH_TOKEN` ou OAuth MiniMax stocké
       pour `minimax-portal`).
    3. Utilisez l’identifiant exact du modèle (sensible à la casse) pour votre chemin d’authentification :
       `minimax/MiniMax-M2.7` ou `minimax/MiniMax-M2.7-highspeed` pour la configuration
       par clé d’API, ou `minimax-portal/MiniMax-M2.7` /
       `minimax-portal/MiniMax-M2.7-highspeed` pour la configuration OAuth.
    4. Exécutez :

       ```bash
       openclaw models list
       ```

       et choisissez dans la liste (ou `/model list` dans la conversation).

    Consultez [MiniMax](/fr/providers/minimax) et [Modèles](/fr/concepts/models).

  </Accordion>

  <Accordion title="Puis-je utiliser MiniMax par défaut et OpenAI pour les tâches complexes ?">
    Oui. Utilisez **MiniMax par défaut** et changez de modèle **par session** lorsque nécessaire.
    Les solutions de secours servent aux **erreurs**, pas aux « tâches difficiles » ; utilisez donc `/model` ou un agent séparé.

    **Option A : changer par session**

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-...", OPENAI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M2.7" },
          models: {
            "minimax/MiniMax-M2.7": { alias: "minimax" },
            "openai/gpt-5.5": { alias: "gpt" },
          },
        },
      },
    }
    ```

    Puis :

    ```
    /model gpt
    ```

    **Option B : agents séparés**

    - Valeur par défaut de l’agent A : MiniMax
    - Valeur par défaut de l’agent B : OpenAI
    - Routez par agent ou utilisez `/agent` pour changer

    Documentation : [Modèles](/fr/concepts/models), [Routage multi-agent](/fr/concepts/multi-agent), [MiniMax](/fr/providers/minimax), [OpenAI](/fr/providers/openai).

  </Accordion>

  <Accordion title="opus / sonnet / gpt sont-ils des raccourcis intégrés ?">
    Oui. OpenClaw fournit quelques raccourcis par défaut (appliqués uniquement lorsque le modèle existe dans `agents.defaults.models`) :

    - `opus` → `anthropic/claude-opus-4-6`
    - `sonnet` → `anthropic/claude-sonnet-4-6`
    - `gpt` → `openai/gpt-5.5`
    - `gpt-mini` → `openai/gpt-5.4-mini`
    - `gpt-nano` → `openai/gpt-5.4-nano`
    - `gemini` → `google/gemini-3.1-pro-preview`
    - `gemini-flash` → `google/gemini-3-flash-preview`
    - `gemini-flash-lite` → `google/gemini-3.1-flash-lite-preview`

    Si vous définissez votre propre alias avec le même nom, votre valeur l’emporte.

  </Accordion>

  <Accordion title="Comment définir/remplacer des raccourcis de modèles (alias) ?">
    Les alias viennent de `agents.defaults.models.<modelId>.alias`. Exemple :

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": { alias: "opus" },
            "anthropic/claude-sonnet-4-6": { alias: "sonnet" },
            "anthropic/claude-haiku-4-5": { alias: "haiku" },
          },
        },
      },
    }
    ```

    Ensuite, `/model sonnet` (ou `/<alias>` lorsque pris en charge) se résout vers cet ID de modèle.

  </Accordion>

  <Accordion title="Comment ajouter des modèles d’autres fournisseurs comme OpenRouter ou Z.AI ?">
    OpenRouter (paiement par token ; nombreux modèles) :

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "openrouter/anthropic/claude-sonnet-4-6" },
          models: { "openrouter/anthropic/claude-sonnet-4-6": {} },
        },
      },
      env: { OPENROUTER_API_KEY: "sk-or-..." },
    }
    ```

    Z.AI (modèles GLM):

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "zai/glm-5" },
          models: { "zai/glm-5": {} },
        },
      },
      env: { ZAI_API_KEY: "..." },
    }
    ```

    Si vous référencez un fournisseur/modèle mais que la clé fournisseur requise est absente, vous obtiendrez une erreur d’authentification à l’exécution (par exemple `No API key found for provider "zai"`).

    **Aucune clé API trouvée pour le fournisseur après l’ajout d’un nouvel agent**

    Cela signifie généralement que le **nouvel agent** possède un stockage d’authentification vide. L’authentification est propre à chaque agent et
    stockée dans :

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Options de correction :

    - Exécutez `openclaw agents add <id>` et configurez l’authentification pendant l’assistant.
    - Ou copiez uniquement les profils `api_key` / `token` statiques portables depuis le stockage d’authentification de l’agent principal vers celui du nouvel agent.
    - Pour les profils OAuth, connectez-vous depuis le nouvel agent lorsqu’il a besoin de son propre compte ; sinon OpenClaw peut lire via l’agent par défaut/principal sans cloner les jetons d’actualisation.

    Ne réutilisez **pas** `agentDir` entre plusieurs agents ; cela provoque des collisions d’authentification/session.

  </Accordion>
</AccordionGroup>

## Basculement de modèle et "All models failed"

<AccordionGroup>
  <Accordion title="Comment fonctionne le basculement ?">
    Le basculement se fait en deux étapes :

    1. **Rotation des profils d’authentification** au sein du même fournisseur.
    2. **Repli de modèle** vers le modèle suivant dans `agents.defaults.model.fallbacks`.

    Des délais de récupération s’appliquent aux profils en échec (repli exponentiel), afin qu’OpenClaw puisse continuer à répondre même lorsqu’un fournisseur est limité en débit ou échoue temporairement.

    Le compartiment de limitation de débit inclut plus que les simples réponses `429`. OpenClaw
    traite aussi les messages comme `Too many concurrent requests`,
    `ThrottlingException`, `concurrency limit reached`,
    `workers_ai ... quota limit exceeded`, `resource exhausted`, ainsi que les limites périodiques
    de fenêtre d’utilisation (`weekly/monthly limit reached`) comme des
    limitations de débit justifiant un basculement.

    Certaines réponses qui ressemblent à de la facturation ne sont pas des `402`, et certaines réponses HTTP `402`
    restent aussi dans ce compartiment transitoire. Si un fournisseur renvoie
    un texte de facturation explicite sur `401` ou `403`, OpenClaw peut quand même le conserver dans
    la voie de facturation, mais les correspondances de texte propres au fournisseur restent limitées au
    fournisseur qui les possède (par exemple OpenRouter `Key limit exceeded`). Si un message `402`
    ressemble plutôt à une fenêtre d’utilisation réessayable ou à une
    limite de dépenses d’organisation/espace de travail (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`), OpenClaw le traite comme
    `rate_limit`, et non comme une désactivation longue pour facturation.

    Les erreurs de dépassement de contexte sont différentes : les signatures telles que
    `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`,
    `input is too long for the model`, ou `ollama error: context length
    exceeded` restent sur le chemin de Compaction/nouvelle tentative au lieu de faire avancer le
    repli de modèle.

    Le texte générique d’erreur serveur est volontairement plus restreint que "tout ce qui contient
    unknown/error". OpenClaw traite bien les formes transitoires limitées à un fournisseur
    comme le `An unknown error occurred` brut d’Anthropic, le
    `Provider returned error` brut d’OpenRouter, les erreurs de raison d’arrêt comme `Unhandled stop reason:
    error`, les charges utiles JSON `api_error` avec du texte de serveur transitoire
    (`internal server error`, `unknown error, 520`, `upstream error`, `backend
    error`), et les erreurs de fournisseur occupé telles que `ModelNotReadyException` comme
    des signaux de délai expiré/surcharge justifiant un basculement lorsque le contexte du fournisseur
    correspond.
    Le texte générique de repli interne comme `LLM request failed with an unknown
    error.` reste conservateur et ne déclenche pas à lui seul le repli de modèle.

  </Accordion>

  <Accordion title='Que signifie "No credentials found for profile anthropic:default" ?'>
    Cela signifie que le système a tenté d’utiliser l’ID de profil d’authentification `anthropic:default`, mais n’a pas pu trouver d’identifiants pour celui-ci dans le stockage d’authentification attendu.

    **Liste de contrôle de correction :**

    - **Confirmez où se trouvent les profils d’authentification** (nouveaux chemins ou chemins hérités)
      - Actuel : `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
      - Hérité : `~/.openclaw/agent/*` (migré par `openclaw doctor`)
    - **Confirmez que votre variable d’environnement est chargée par le Gateway**
      - Si vous définissez `ANTHROPIC_API_KEY` dans votre shell mais exécutez le Gateway via systemd/launchd, il peut ne pas en hériter. Placez-la dans `~/.openclaw/.env` ou activez `env.shellEnv`.
    - **Assurez-vous de modifier le bon agent**
      - Les configurations multi-agents signifient qu’il peut y avoir plusieurs fichiers `auth-profiles.json`.
    - **Vérifiez rapidement l’état du modèle/de l’authentification**
      - Utilisez `openclaw models status` pour voir les modèles configurés et si les fournisseurs sont authentifiés.

    **Liste de contrôle de correction pour "No credentials found for profile anthropic"**

    Cela signifie que l’exécution est épinglée à un profil d’authentification Anthropic, mais que le Gateway
    ne peut pas le trouver dans son stockage d’authentification.

    - **Utilisez Claude CLI**
      - Exécutez `openclaw models auth login --provider anthropic --method cli --set-default` sur l’hôte du gateway.
    - **Si vous voulez plutôt utiliser une clé API**
      - Placez `ANTHROPIC_API_KEY` dans `~/.openclaw/.env` sur l’**hôte du gateway**.
      - Effacez tout ordre épinglé qui force un profil manquant :

        ```bash
        openclaw models auth order clear --provider anthropic
        ```

    - **Confirmez que vous exécutez les commandes sur l’hôte du gateway**
      - En mode distant, les profils d’authentification résident sur la machine gateway, pas sur votre ordinateur portable.

  </Accordion>

  <Accordion title="Pourquoi a-t-il aussi essayé Google Gemini et échoué ?">
    Si votre configuration de modèle inclut Google Gemini comme repli (ou si vous êtes passé à un raccourci Gemini), OpenClaw l’essaiera pendant le repli de modèle. Si vous n’avez pas configuré les identifiants Google, vous verrez `No API key found for provider "google"`.

    Correction : fournissez l’authentification Google, ou supprimez/évitez les modèles Google dans `agents.defaults.model.fallbacks` / alias afin que le repli n’y soit pas routé.

    **Requête LLM rejetée : signature de réflexion requise (Google Antigravity)**

    Cause : l’historique de session contient des **blocs de réflexion sans signatures** (souvent issus
    d’un flux interrompu/partiel). Google Antigravity exige des signatures pour les blocs de réflexion.

    Correction : OpenClaw supprime désormais les blocs de réflexion non signés pour Google Antigravity Claude. Si cela apparaît encore, démarrez une **nouvelle session** ou définissez `/thinking off` pour cet agent.

  </Accordion>
</AccordionGroup>

## Profils d’authentification : ce qu’ils sont et comment les gérer

Connexe : [/concepts/oauth](/fr/concepts/oauth) (flux OAuth, stockage des jetons, modèles multi-comptes)

<AccordionGroup>
  <Accordion title="Qu’est-ce qu’un profil d’authentification ?">
    Un profil d’authentification est un enregistrement d’identifiants nommé (OAuth ou clé API) lié à un fournisseur. Les profils résident dans :

    ```
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Pour inspecter les profils enregistrés sans afficher les secrets, exécutez `openclaw models auth list` (éventuellement `--provider <id>` ou `--json`). Consultez [CLI des modèles](/fr/cli/models#auth-profiles) pour plus de détails.

  </Accordion>

  <Accordion title="Quels sont les ID de profil typiques ?">
    OpenClaw utilise des ID préfixés par le fournisseur, comme :

    - `anthropic:default` (courant lorsqu’aucune identité e-mail n’existe)
    - `anthropic:<email>` pour les identités OAuth
    - les ID personnalisés que vous choisissez (par exemple `anthropic:work`)

  </Accordion>

  <Accordion title="Puis-je contrôler quel profil d’authentification est essayé en premier ?">
    Oui. La configuration prend en charge des métadonnées facultatives pour les profils et un ordre par fournisseur (`auth.order.<provider>`). Cela ne stocke **pas** les secrets ; cela associe les ID au fournisseur/mode et définit l’ordre de rotation.

    OpenClaw peut temporairement ignorer un profil s’il est dans un court **délai de récupération** (limitations de débit/délais expirés/échecs d’authentification) ou dans un état **désactivé** plus long (facturation/crédits insuffisants). Pour inspecter cela, exécutez `openclaw models status --json` et vérifiez `auth.unusableProfiles`. Réglage : `auth.cooldowns.billingBackoffHours*`.

    Les délais de récupération liés aux limitations de débit peuvent être propres au modèle. Un profil qui est en délai de récupération
    pour un modèle peut rester utilisable pour un modèle voisin chez le même fournisseur,
    tandis que les fenêtres de facturation/désactivation bloquent toujours tout le profil.

    Vous pouvez aussi définir un remplacement d’ordre **par agent** (stocké dans le `auth-state.json` de cet agent) via la CLI :

    ```bash
    # Utilise par défaut l’agent par défaut configuré (omettre --agent)
    openclaw models auth order get --provider anthropic

    # Verrouiller la rotation sur un seul profil (n’essayer que celui-ci)
    openclaw models auth order set --provider anthropic anthropic:default

    # Ou définir un ordre explicite (repli au sein du fournisseur)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # Effacer le remplacement (revenir à config auth.order / round-robin)
    openclaw models auth order clear --provider anthropic
    ```

    Pour cibler un agent spécifique :

    ```bash
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    Pour vérifier ce qui sera réellement essayé, utilisez :

    ```bash
    openclaw models status --probe
    ```

    Si un profil stocké est omis de l’ordre explicite, la sonde signale
    `excluded_by_auth_order` pour ce profil au lieu de l’essayer silencieusement.

  </Accordion>

  <Accordion title="OAuth ou clé API : quelle est la différence ?">
    OpenClaw prend en charge les deux :

    - **OAuth** exploite souvent l’accès par abonnement (le cas échéant).
    - Les **clés API** utilisent une facturation au jeton.

    L’assistant prend explicitement en charge Anthropic Claude CLI, OpenAI Codex OAuth et les clés API.

  </Accordion>
</AccordionGroup>

## Connexe

- [FAQ](/fr/help/faq) — la FAQ principale
- [FAQ — démarrage rapide et configuration initiale](/fr/help/faq-first-run)
- [Sélection du modèle](/fr/concepts/model-providers)
- [Basculement de modèle](/fr/concepts/model-failover)
