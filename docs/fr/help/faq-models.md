---
read_when:
    - Choisir ou changer de modèle, configurer des alias
    - Débogage du basculement de modèle / « Tous les modèles ont échoué »
    - Comprendre les profils d’authentification et leur gestion
sidebarTitle: Models FAQ
summary: 'FAQ : modèles par défaut, sélection, alias, changement, basculement et profils d’authentification'
title: 'FAQ : modèles et authentification'
x-i18n:
    generated_at: "2026-07-12T02:54:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 071e89c01120849179d3bc372153eb2c76a0fa4e93846df42920f0d961d597df
    source_path: help/faq-models.md
    workflow: 16
---

  Questions-réponses sur les modèles et les profils d’authentification. Pour la configuration, les sessions, le Gateway, les canaux et le
  dépannage, consultez la [FAQ](/fr/help/faq) principale.

  ## Modèles : valeurs par défaut, sélection, alias et changement

  <AccordionGroup>
  <Accordion title='Qu’est-ce que le « modèle par défaut » ?'>
    Définissez-le avec :

    ```text
    agents.defaults.model.primary
    ```

    Les modèles sont des références `fournisseur/modèle` (par exemple : `openai/gpt-5.5`,
    `anthropic/claude-sonnet-4-6`). Définissez toujours explicitement `fournisseur/modèle`. Si
    vous omettez le fournisseur, OpenClaw recherche d’abord un alias correspondant, puis une
    correspondance unique parmi les fournisseurs configurés pour cet identifiant de modèle, avant de se rabattre sur le
    fournisseur par défaut configuré (chemin de compatibilité obsolète). Si ce
    fournisseur ne propose plus le modèle par défaut configuré, OpenClaw se rabat
    sur le premier couple fournisseur/modèle configuré plutôt que sur une valeur par défaut obsolète.

  </Accordion>

  <Accordion title="Quel modèle recommandez-vous ?">
    Utilisez le modèle de dernière génération le plus performant proposé par votre ensemble de fournisseurs,
    en particulier pour les agents ayant accès à des outils ou traitant des entrées non fiables : les modèles moins performants ou
    excessivement quantifiés sont plus vulnérables à l’injection d’invite et aux comportements
    dangereux (voir [Sécurité](/fr/gateway/security)). Affectez les modèles moins coûteux aux
    conversations courantes ou à faible enjeu selon le rôle de l’agent.

    Affectez les modèles par agent et utilisez des sous-agents pour paralléliser les tâches longues (chaque
    sous-agent consomme ses propres jetons). Consultez [Modèles](/fr/concepts/models),
    [Sous-agents](/fr/tools/subagents), [MiniMax](/fr/providers/minimax) et
    [Modèles locaux](/fr/gateway/local-models).

  </Accordion>

  <Accordion title="Comment changer de modèle sans effacer ma configuration ?">
    Modifiez uniquement les champs du modèle ; évitez de remplacer toute la configuration.

    - `/model` dans la conversation (par session, voir [Commandes à barre oblique](/fr/tools/slash-commands))
    - `openclaw models set ...` (met uniquement à jour la configuration du modèle)
    - `openclaw configure --section model` (interactif)
    - modifiez directement `agents.defaults.model` dans `~/.openclaw/openclaw.json`

    Pour les modifications par RPC, inspectez d’abord avec `config.schema.lookup` (chemin
    normalisé, documentation superficielle du schéma, résumés des éléments enfants), puis préférez `config.patch`
    à `config.apply` avec un objet partiel. Si vous avez écrasé la configuration,
    restaurez-la depuis une sauvegarde ou exécutez `openclaw doctor` pour la réparer.

    Documentation : [Modèles](/fr/concepts/models), [Configuration](/fr/cli/configure),
    [Configuration](/fr/cli/config), [Doctor](/fr/gateway/doctor).

  </Accordion>

  <Accordion title="Puis-je utiliser des modèles auto-hébergés (llama.cpp, vLLM, Ollama) ?">
    Oui, Ollama est la solution la plus simple. Configuration rapide :

    1. Installez Ollama depuis `https://ollama.com/download`
    2. Téléchargez un modèle local, par exemple `ollama pull gemma4`
    3. Pour utiliser également les modèles infonuagiques, exécutez `ollama signin`
    4. Exécutez `openclaw onboard`, choisissez `Ollama`, puis `Local` ou `Cloud + Local`

    `Cloud + Local` vous donne accès aux modèles infonuagiques ainsi qu’à vos modèles Ollama locaux ;
    les modèles infonuagiques tels que `kimi-k2.5:cloud` ne nécessitent aucun téléchargement local. Pour changer
    manuellement : `openclaw models list`, puis `openclaw models set ollama/<model>`.

    Les modèles plus petits ou fortement quantifiés sont plus vulnérables à l’injection d’invite.
    Utilisez de grands modèles pour tout bot ayant accès à des outils ; si vous utilisez tout de même de petits modèles,
    activez l’environnement isolé et des listes d’autorisation d’outils strictes.

    Documentation : [Ollama](/fr/providers/ollama), [Modèles locaux](/fr/gateway/local-models),
    [Fournisseurs de modèles](/fr/concepts/model-providers), [Sécurité](/fr/gateway/security),
    [Environnement isolé](/fr/gateway/sandboxing).

  </Accordion>

  <Accordion title="Comment changer de modèle à la volée (sans redémarrer) ?">
    Envoyez `/model <name>` comme message autonome. Consultez
    [Commandes à barre oblique](/fr/tools/slash-commands) pour obtenir la
    liste complète des commandes, notamment le sélecteur numéroté (`/model`, `/model
    list`, `/model 3`), `/model default` pour supprimer un remplacement propre à la session et
    `/model status` pour afficher les détails du point de terminaison et du mode d’API.

    Imposez un profil d’authentification précis par session avec `@profile` :

    ```text
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    Pour désépingler un profil défini avec `@profile`, exécutez de nouveau `/model` sans le
    suffixe (par exemple `/model anthropic/claude-opus-4-6`) ou choisissez le profil par défaut dans
    `/model`. Utilisez `/model status` pour confirmer le profil d’authentification actif.

  </Accordion>

  <Accordion title="Si deux fournisseurs proposent le même identifiant de modèle, lequel /model utilise-t-il ?">
    `/model provider/model` sélectionne exactement cette route de fournisseur. Par exemple,
    `qianfan/deepseek-v4-flash` et `deepseek/deepseek-v4-flash` sont des références différentes,
    même si l’identifiant de modèle correspond : OpenClaw ne change pas silencieusement de
    fournisseur sur la seule base d’un identifiant correspondant.

    Une référence `/model` sélectionnée par l’utilisateur applique une règle stricte pour le basculement : si ce
    fournisseur/modèle devient indisponible, la réponse échoue de manière visible au lieu de
    se rabattre sur `agents.defaults.model.fallbacks`. Les chaînes de basculement
    configurées continuent de s’appliquer aux valeurs par défaut configurées, aux modèles principaux des tâches Cron et
    à l’état de basculement sélectionné automatiquement. Lorsqu’une exécution sans remplacement propre à la session est autorisée
    à utiliser le basculement, OpenClaw essaie d’abord le fournisseur/modèle demandé, puis
    les solutions de repli configurées et enfin le modèle principal configuré ; ainsi, des identifiants de
    modèle bruts en double ne reviennent jamais directement au fournisseur par défaut.

    Consultez [Modèles](/fr/concepts/models) et [Basculement de modèle](/fr/concepts/model-failover).

  </Accordion>

  <Accordion title="Puis-je utiliser GPT 5.5 pour les tâches quotidiennes et Codex 5.5 pour le développement ?">
    Oui, le choix du modèle et celui de l’environnement d’exécution sont distincts :

    - **Agent de développement Codex natif :** définissez `agents.defaults.model.primary` sur
      `openai/gpt-5.5`. Connectez-vous avec `openclaw models auth login --provider
      openai` pour l’authentification par abonnement ChatGPT/Codex.
    - **Tâches directes avec l’API OpenAI hors de la boucle de l’agent :** configurez
      `OPENAI_API_KEY` pour les images, les plongements, la parole, le temps réel et les autres
      fonctionnalités de l’API OpenAI hors agent.
    - **Authentification de l’agent OpenAI par clé d’API :** `/model openai/gpt-5.5` avec un profil de
      clé d’API `openai` ordonné.
    - **Sous-agents :** acheminez les tâches de développement vers un agent spécialisé dans Codex avec son
      propre modèle `openai/gpt-5.5`.

    Consultez [Modèles](/fr/concepts/models) et [Commandes à barre oblique](/fr/tools/slash-commands).

  </Accordion>

  <Accordion title="Comment configurer le mode rapide pour GPT 5.5 ?">
    - **Par session :** envoyez `/fast on` lorsque vous utilisez `openai/gpt-5.5`.
    - **Valeur par défaut par modèle :** définissez
      `agents.defaults.models["openai/gpt-5.5"].params.fastMode` sur `true`.
    - **Seuil automatique :** `/fast auto` ou `params.fastMode: "auto"` exécute rapidement les nouveaux
      appels au modèle jusqu’au seuil, puis exécute sans mode rapide les appels ultérieurs de nouvelle tentative, de basculement,
      de résultat d’outil ou de poursuite. Le seuil est de
      60 secondes par défaut ; remplacez-le avec `params.fastAutoOnSeconds` sur le modèle.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: {
                fastMode: "auto",
                fastAutoOnSeconds: 30,
              },
            },
          },
        },
      },
    }
    ```

    Le mode rapide correspond à `service_tier = "priority"` dans les requêtes OpenAI Responses
    natives ; les valeurs `service_tier` existantes sont conservées et le mode rapide ne
    modifie pas `reasoning` ni `text.verbosity`. Les remplacements `/fast` propres à la session
    prévalent sur les valeurs par défaut de la configuration.

    Consultez [Réflexion et mode rapide](/fr/tools/thinking) et la section Mode rapide
    sous Configuration avancée sur la page du fournisseur [OpenAI](/fr/providers/openai).

  </Accordion>

  <Accordion title='Pourquoi le message « Model ... is not allowed » s’affiche-t-il sans qu’aucune réponse ne suive ?'>
    Si `agents.defaults.models` est défini, il devient la **liste d’autorisation** pour
    `/model` et les remplacements propres à la session. Choisir un modèle hors de cette liste renvoie
    ceci au lieu d’une réponse normale :

    ```text
    Model "provider/model" is not allowed. Use /models to list providers, or /models <provider> to list models.
    Add it with: openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
    ```

    Correction : ajoutez le modèle exact à `agents.defaults.models`, ajoutez un caractère générique de fournisseur
    tel que `"provider/*": {}` pour les catalogues dynamiques, supprimez la
    liste d’autorisation ou choisissez un modèle dans `/model list`. Si la commande comprenait également
    `--runtime codex`, mettez d’abord à jour la liste d’autorisation, puis réessayez la
    même commande `/model provider/model --runtime codex`.

  </Accordion>

  <Accordion title='Pourquoi le message « Unknown model: minimax/MiniMax-M3 » s’affiche-t-il ?'>
    Si vous utilisez une ancienne version d’OpenClaw, effectuez d’abord la mise à niveau (ou exécutez depuis la branche
    `main` des sources) et redémarrez le Gateway : `MiniMax-M3` ne figure peut-être pas encore dans le
    catalogue de votre version installée. Sinon, le fournisseur MiniMax n’est pas
    configuré (aucune entrée de fournisseur ni aucun profil d’authentification trouvé), le modèle ne peut donc pas
    être résolu. Consultez la section Dépannage de la
    page du fournisseur [MiniMax](/fr/providers/minimax) pour obtenir la liste complète des vérifications,
    le tableau des identifiants fournisseur/modèle et un exemple de bloc de configuration.

  </Accordion>

  <Accordion title="Puis-je utiliser MiniMax par défaut et OpenAI pour les tâches complexes ?">
    Oui. Utilisez MiniMax par défaut et changez de modèle par session : les solutions de repli
    servent aux erreurs, pas aux « tâches difficiles » ; utilisez donc `/model` ou un agent distinct.

    **Option A : changer par session**

    ```json5
    {
      env: { MINIMAX_API_KEY: "sk-...", OPENAI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M3" },
          models: {
            "minimax/MiniMax-M3": { alias: "minimax" },
            "openai/gpt-5.5": { alias: "gpt" },
          },
        },
      },
    }
    ```

    Puis `/model gpt`.

    **Option B : agents distincts** — L’agent A utilise MiniMax par défaut, l’agent B
    utilise OpenAI par défaut ; acheminez selon l’agent ou utilisez `/agent` pour changer.

    Documentation : [Modèles](/fr/concepts/models), [Routage multi-agent](/fr/concepts/multi-agent),
    [MiniMax](/fr/providers/minimax), [OpenAI](/fr/providers/openai).

  </Accordion>

  <Accordion title="opus / sonnet / gpt sont-ils des raccourcis intégrés ?">
    Oui, ce sont des raccourcis intégrés, appliqués uniquement lorsque le modèle cible existe dans
    `agents.defaults.models` :

    | Alias | Correspond à |
    | --- | --- |
    | `opus` | `anthropic/claude-opus-4-8` |
    | `sonnet` | `anthropic/claude-sonnet-4-6` |
    | `gpt` | `openai/gpt-5.4` |
    | `gpt-mini` | `openai/gpt-5.4-mini` |
    | `gpt-nano` | `openai/gpt-5.4-nano` |
    | `gemini` | `google/gemini-3.1-pro-preview` |
    | `gemini-flash` | `google/gemini-3-flash-preview` |
    | `gemini-flash-lite` | `google/gemini-3.1-flash-lite` |

    Votre propre alias portant le même nom remplace l’alias intégré.

  </Accordion>

  <Accordion title="Comment définir ou remplacer les raccourcis de modèle (alias) ?">
    Les alias se trouvent dans `agents.defaults.models.<modelId>.alias` :

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": { alias: "opus" },
            "anthropic/claude-sonnet-4-6": { alias: "sonnet" },
          },
        },
      },
    }
    ```

    Ensuite, `/model sonnet` (ou `/<alias>` lorsque cette syntaxe est prise en charge) correspond à cet
    identifiant de modèle.

  </Accordion>

  <Accordion title="Comment ajouter des modèles d’autres fournisseurs comme OpenRouter ou Z.AI ?">
    OpenRouter (paiement par jeton ; nombreux modèles) :

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

    Z.AI (modèles GLM) :

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "zai/glm-5.1" },
          models: { "zai/glm-5.1": {} },
        },
      },
      env: { ZAI_API_KEY: "..." },
    }
    ```

    L’absence de clé de fournisseur pour un couple fournisseur/modèle référencé déclenche une erreur
    d’authentification à l’exécution (par exemple `No API key found for provider "zai"`).

    **Aucune clé d’API trouvée pour le fournisseur après l’ajout d’un nouvel agent**

    Le stockage d’authentification d’un nouvel agent est vide : l’authentification est propre à chaque agent et stockée dans :

    ```text
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Correction : exécutez `openclaw agents add <id>` et configurez l’authentification dans l’assistant, ou
    copiez uniquement les profils statiques portables `api_key`/`token` depuis le magasin de
    l’agent principal. Pour OAuth, connectez-vous depuis le nouvel agent lorsqu’il a besoin de son
    propre compte. Consultez [Routage multi-agent](/fr/concepts/multi-agent) pour connaître
    l’ensemble des règles de réutilisation d’`agentDir` et de partage des identifiants — ne réutilisez jamais
    `agentDir` entre plusieurs agents.

  </Accordion>
</AccordionGroup>

## Basculement des modèles et « Tous les modèles ont échoué »

<AccordionGroup>
  <Accordion title="Comment fonctionne le basculement ?">
    Deux étapes :

    1. **Rotation des profils d’authentification** au sein du même fournisseur.
    2. **Modèle de secours** suivant dans `agents.defaults.model.fallbacks`.

    Des délais de récupération s’appliquent aux profils défaillants (temporisation exponentielle), afin qu’OpenClaw
    continue de répondre lorsqu’un fournisseur limite le débit ou rencontre une défaillance temporaire.

    La catégorie de limitation de débit ne se limite pas aux simples erreurs `429` : `Too many concurrent
    requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai
    ... quota limit exceeded`, `resource exhausted` et les limites périodiques
    de fenêtre d’utilisation (`weekly/monthly limit reached`) sont toutes considérées comme des
    limitations de débit justifiant un basculement.

    Les réponses liées à la facturation ne sont pas toujours des erreurs `402`, et certaines erreurs `402` restent dans la
    catégorie des erreurs transitoires ou de limitation de débit plutôt que dans celle de la facturation. Un texte explicite
    relatif à la facturation dans une erreur `401`/`403` peut toujours être classé comme tel ; les
    correspondances textuelles propres à un fournisseur (par exemple `Key limit exceeded` d’OpenRouter) restent limitées à leur
    fournisseur respectif. Une erreur `402` qui ressemble à une limite réessayable de fenêtre d’utilisation ou
    de dépenses d’organisation/espace de travail (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`) est traitée comme `rate_limit`, et non comme une
    désactivation prolongée pour facturation.

    Les erreurs de dépassement de contexte restent entièrement en dehors du chemin de secours — les signatures
    telles que `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`, `input is
    too long for the model` ou `ollama error: context length exceeded` déclenchent une
    compaction et une nouvelle tentative au lieu de passer au modèle de secours suivant.

    La détection générique des erreurs de serveur est plus restrictive que « tout ce qui contient unknown/error ».
    Les formes transitoires propres à un fournisseur qui comptent comme signaux de basculement sont :
    le message brut `An unknown error occurred` d’Anthropic, le message brut
    `Provider returned error` d’OpenRouter, les erreurs de motif d’arrêt comme `Unhandled stop reason:
    error`, les charges utiles JSON `api_error` comportant un texte d’erreur serveur transitoire (`internal
    server error`, `unknown error, 520`, `upstream error`, `backend error`),
    ainsi que les erreurs de fournisseur occupé comme `ModelNotReadyException` lorsque le contexte du fournisseur
    correspond. Un texte générique de secours interne comme `LLM request failed
    with an unknown error.` reste traité avec prudence et ne déclenche pas de basculement
    à lui seul.

  </Accordion>

  <Accordion title='Que signifie « No credentials found for profile anthropic:default » ?'>
    L’identifiant de profil d’authentification `anthropic:default` ne possède aucun identifiant dans le
    magasin d’authentification attendu.

    **Liste de vérification pour corriger le problème :**

    - Vérifiez où se trouvent les profils — emplacement actuel :
      `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` ; ancien emplacement :
      `~/.openclaw/agent/*` (migré par `openclaw doctor`).
    - Vérifiez que le Gateway charge votre variable d’environnement. Une variable `ANTHROPIC_API_KEY` définie uniquement dans
      votre shell n’atteindra pas une exécution du Gateway via systemd/launchd — placez-la dans
      `~/.openclaw/.env` ou activez `env.shellEnv`.
    - Vérifiez que vous modifiez le bon agent — les configurations multi-agents comportent
      plusieurs fichiers `auth-profiles.json`.
    - Exécutez `openclaw models status` pour afficher les modèles configurés et l’état
      de l’authentification du fournisseur.

    **Pour « No credentials found for profile anthropic » (sans suffixe d’adresse e-mail) :**

    L’exécution est épinglée à un profil Anthropic que le Gateway ne trouve pas.

    - Utilisez la CLI Claude : exécutez `openclaw models auth login --provider anthropic
      --method cli --set-default` sur l’hôte du Gateway.
    - Si possible, préférez une clé API : placez `ANTHROPIC_API_KEY` dans
      `~/.openclaw/.env` sur l’hôte du Gateway, puis supprimez tout ordre épinglé
      qui impose le profil manquant :

      ```bash
      openclaw models auth order clear --provider anthropic
      ```

    - Mode distant : les profils d’authentification se trouvent sur la machine du Gateway, et non sur votre
      ordinateur portable — vérifiez que vous y exécutez bien les commandes.

  </Accordion>

  <Accordion title="Pourquoi a-t-il également essayé Google Gemini avant d’échouer ?">
    Si votre configuration de modèles inclut Google Gemini comme modèle de secours (ou si vous
    êtes passé à un raccourci Gemini), OpenClaw l’essaie lors du basculement. Si aucun
    identifiant Google n’est configuré, l’erreur `No API key found for provider
    "google"` apparaît. Correction : ajoutez l’authentification Google ou supprimez les modèles Google de
    `agents.defaults.model.fallbacks`/des alias.

    **Requête LLM rejetée : signature de raisonnement requise (Google Antigravity)**

    Cause : l’historique de la session contient des blocs de raisonnement sans signature (souvent
    issus d’un flux interrompu ou partiel) ; Google Antigravity exige des signatures
    sur les blocs de raisonnement. OpenClaw supprime les blocs de raisonnement non signés pour Google
    Antigravity Claude ; si le problème persiste, démarrez une nouvelle session ou définissez
    `/thinking off` pour cet agent.

  </Accordion>
</AccordionGroup>

## Profils d’authentification : définition et gestion

Voir aussi : [/concepts/oauth](/fr/concepts/oauth) (flux OAuth, stockage des jetons, modèles de gestion de plusieurs comptes)

<AccordionGroup>
  <Accordion title="Qu’est-ce qu’un profil d’authentification ?">
    Un enregistrement d’identifiants nommé (OAuth ou clé API), associé à un fournisseur et stocké
    à l’emplacement suivant :

    ```text
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Examinez les profils enregistrés sans afficher les secrets : `openclaw models auth
    list` (éventuellement avec `--provider <id>` ou `--json`). Consultez
    [CLI des modèles](/fr/cli/models#auth-profiles).

  </Accordion>

  <Accordion title="Quels sont les identifiants de profil courants ?">
    Ils sont préfixés par le fournisseur : `anthropic:default` (courant lorsqu’aucune identité par adresse e-mail
    n’existe), `anthropic:<email>` pour les identités OAuth, ou un identifiant personnalisé que vous
    choisissez (par exemple `anthropic:work`).

  </Accordion>

  <Accordion title="Puis-je contrôler quel profil d’authentification est essayé en premier ?">
    Oui. La configuration `auth.order.<provider>` définit l’ordre de rotation par fournisseur
    (métadonnées uniquement — aucun secret n’est stocké).

    OpenClaw peut ignorer un profil soumis à un court **délai de récupération** (limitations de débit,
    délais d’expiration, échecs d’authentification) ou à un état **désactivé** plus long
    (facturation/crédits insuffisants). Examinez cet état avec `openclaw models status
    --json` et consultez `auth.unusableProfiles`. Ajustez-le avec
    `auth.cooldowns.billingBackoffHours*`. Les délais de récupération dus à la limitation de débit peuvent être
    propres à un modèle — un profil en délai de récupération pour un modèle peut toujours servir un
    modèle apparenté chez le même fournisseur ; les périodes de facturation/désactivation bloquent
    l’ensemble du profil.

    Définissez un remplacement de l’ordre propre à un agent (stocké dans le fichier `auth-state.json` de cet agent) :

    ```bash
    # Defaults to the configured default agent (omit --agent)
    openclaw models auth order get --provider anthropic

    # Lock rotation to a single profile
    openclaw models auth order set --provider anthropic anthropic:default

    # Or set an explicit order (fallback within provider)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # Clear override (fall back to config auth.order / round-robin)
    openclaw models auth order clear --provider anthropic

    # Target a specific agent
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    Vérifiez ce qui sera réellement essayé : `openclaw models status --probe`. Un
    profil stocké omis d’un ordre explicite signale
    `excluded_by_auth_order` au lieu d’être essayé silencieusement.

  </Accordion>

  <Accordion title="OAuth ou clé API : quelle est la différence ?">
    - **Connexion OAuth / CLI** utilise souvent l’accès par abonnement lorsque le
      fournisseur le prend en charge. Pour Anthropic, le backend CLI Claude d’OpenClaw
      utilise `claude -p` de Claude Code, qu’Anthropic considère actuellement comme une
      utilisation de l’Agent SDK/programmatique décomptée des limites d’utilisation de l’abonnement —
      consultez [Anthropic](/fr/providers/anthropic) pour connaître l’état actuel de la suspension de facturation
      et les liens vers les sources.
    - **Les clés API** utilisent une facturation par jeton.

    L’assistant prend en charge la CLI Anthropic Claude, OAuth d’OpenAI Codex et les clés
    API.

  </Accordion>
</AccordionGroup>

## Voir aussi

- [FAQ](/fr/help/faq) — la FAQ principale
- [FAQ — démarrage rapide et configuration initiale](/fr/help/faq-first-run)
- [Sélection du modèle](/fr/concepts/model-providers)
- [Basculement des modèles](/fr/concepts/model-failover)
