---
read_when:
    - Choisir ou changer de modèle, configurer des alias
    - Débogage du basculement de modèle / « Tous les modèles ont échoué »
    - Comprendre les profils d’authentification et leur gestion
sidebarTitle: Models FAQ
summary: 'FAQ : modèles par défaut, sélection, alias, changement, basculement et profils d’authentification'
title: 'FAQ : modèles et authentification'
x-i18n:
    generated_at: "2026-07-12T15:24:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
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

    Les modèles sont des références `provider/model` (par exemple : `openai/gpt-5.5`,
    `anthropic/claude-sonnet-4-6`). Définissez toujours `provider/model` explicitement. Si
    vous omettez le fournisseur, OpenClaw tente d’abord de trouver un alias correspondant,
    puis une correspondance unique parmi les fournisseurs configurés pour cet identifiant
    de modèle, avant de revenir au fournisseur par défaut configuré (chemin de compatibilité
    obsolète). Si ce fournisseur ne propose plus le modèle par défaut configuré, OpenClaw
    utilise le premier fournisseur/modèle configuré au lieu d’une valeur par défaut obsolète.

  </Accordion>

  <Accordion title="Quel modèle recommandez-vous ?">
    Utilisez le modèle de dernière génération le plus performant proposé par votre ensemble
    de fournisseurs, en particulier pour les agents disposant d’outils ou traitant des entrées
    non fiables : les modèles moins performants ou excessivement quantifiés sont plus vulnérables
    aux injections de prompt et aux comportements dangereux (voir [Sécurité](/fr/gateway/security)).
    Réservez les modèles moins coûteux aux conversations courantes ou à faible enjeu, selon le
    rôle de l’agent.

    Acheminez les modèles par agent et utilisez des sous-agents pour paralléliser les tâches
    longues (chaque sous-agent consomme ses propres tokens). Consultez [Modèles](/fr/concepts/models),
    [Sous-agents](/fr/tools/subagents), [MiniMax](/fr/providers/minimax) et
    [Modèles locaux](/fr/gateway/local-models).

  </Accordion>

  <Accordion title="Comment changer de modèle sans effacer ma configuration ?">
    Modifiez uniquement les champs du modèle ; évitez de remplacer toute la configuration.

    - `/model` dans la conversation (par session, voir [Commandes slash](/fr/tools/slash-commands))
    - `openclaw models set ...` (met à jour uniquement la configuration du modèle)
    - `openclaw configure --section model` (interactif)
    - modifiez directement `agents.defaults.model` dans `~/.openclaw/openclaw.json`

    Pour les modifications RPC, inspectez d’abord avec `config.schema.lookup` (chemin
    normalisé, documentation succincte du schéma et résumés des enfants), puis préférez
    `config.patch` à `config.apply` avec un objet partiel. Si vous avez écrasé la configuration,
    restaurez-la depuis une sauvegarde ou exécutez `openclaw doctor` pour la réparer.

    Documentation : [Modèles](/fr/concepts/models), [Configuration interactive](/fr/cli/configure),
    [Configuration](/fr/cli/config), [Doctor](/fr/gateway/doctor).

  </Accordion>

  <Accordion title="Puis-je utiliser des modèles auto-hébergés (llama.cpp, vLLM, Ollama) ?">
    Oui, Ollama est la solution la plus simple. Configuration rapide :

    1. Installez Ollama depuis `https://ollama.com/download`
    2. Téléchargez un modèle local, par exemple `ollama pull gemma4`
    3. Pour utiliser également les modèles cloud, exécutez `ollama signin`
    4. Exécutez `openclaw onboard`, choisissez `Ollama`, puis `Local` ou `Cloud + Local`

    `Cloud + Local` vous donne accès aux modèles cloud ainsi qu’à vos modèles Ollama locaux ;
    les modèles cloud tels que `kimi-k2.5:cloud` ne nécessitent aucun téléchargement local.
    Pour changer de modèle manuellement : `openclaw models list`, puis
    `openclaw models set ollama/<model>`.

    Les modèles plus petits ou fortement quantifiés sont plus vulnérables aux injections de
    prompt. Utilisez de grands modèles pour tout bot ayant accès à des outils ; si vous utilisez
    malgré tout de petits modèles, activez le bac à sable et des listes d’outils autorisés strictes.

    Documentation : [Ollama](/fr/providers/ollama), [Modèles locaux](/fr/gateway/local-models),
    [Fournisseurs de modèles](/fr/concepts/model-providers), [Sécurité](/fr/gateway/security),
    [Bac à sable](/fr/gateway/sandboxing).

  </Accordion>

  <Accordion title="Comment changer de modèle à la volée (sans redémarrer) ?">
    Envoyez `/model <name>` dans un message distinct. Consultez
    [Commandes slash](/fr/tools/slash-commands) pour obtenir la
    liste complète des commandes, notamment le sélecteur numéroté (`/model`, `/model
    list`, `/model 3`), `/model default` pour supprimer le remplacement propre à une
    session et `/model status` pour obtenir des détails sur le point de terminaison et
    le mode d’API.

    Forcez un profil d’authentification précis par session avec `@profile` :

    ```text
    /model opus@anthropic:default
    /model opus@anthropic:work
    ```

    Pour désépingler un profil défini avec `@profile`, exécutez de nouveau `/model` sans
    le suffixe (par exemple `/model anthropic/claude-opus-4-6`) ou sélectionnez la valeur
    par défaut dans `/model`. Utilisez `/model status` pour confirmer le profil
    d’authentification actif.

  </Accordion>

  <Accordion title="Si deux fournisseurs proposent le même identifiant de modèle, lequel /model utilise-t-il ?">
    `/model provider/model` sélectionne exactement cette route de fournisseur. Par exemple,
    `qianfan/deepseek-v4-flash` et `deepseek/deepseek-v4-flash` sont des références différentes,
    même si l’identifiant du modèle est identique : OpenClaw ne change pas silencieusement de
    fournisseur en cas de correspondance sur un identifiant seul.

    Une référence `/model` sélectionnée par l’utilisateur applique une politique stricte pour
    le basculement : si ce fournisseur/modèle devient indisponible, la réponse échoue de manière
    visible au lieu d’utiliser `agents.defaults.model.fallbacks`. Les chaînes de basculement
    configurées continuent de s’appliquer aux valeurs par défaut configurées, aux modèles
    principaux des tâches Cron et à l’état de basculement sélectionné automatiquement. Lorsqu’une
    exécution sans remplacement propre à la session est autorisée à utiliser le basculement,
    OpenClaw essaie d’abord le fournisseur/modèle demandé, puis les modèles de secours configurés,
    puis le modèle principal configuré ; des identifiants de modèle seuls dupliqués ne reviennent
    donc jamais directement au fournisseur par défaut.

    Consultez [Modèles](/fr/concepts/models) et [Basculement de modèle](/fr/concepts/model-failover).

  </Accordion>

  <Accordion title="Puis-je utiliser GPT 5.5 pour les tâches quotidiennes et Codex 5.5 pour la programmation ?">
    Oui, le choix du modèle et celui de l’environnement d’exécution sont distincts :

    - **Agent de programmation Codex natif :** définissez `agents.defaults.model.primary` sur
      `openai/gpt-5.5`. Connectez-vous avec `openclaw models auth login --provider
      openai` pour utiliser l’authentification par abonnement ChatGPT/Codex.
    - **Tâches directes de l’API OpenAI hors de la boucle de l’agent :** configurez
      `OPENAI_API_KEY` pour les images, les embeddings, la parole, le temps réel et les
      autres surfaces de l’API OpenAI ne concernant pas les agents.
    - **Authentification de l’agent OpenAI par clé d’API :** `/model openai/gpt-5.5` avec un
      profil de clé d’API `openai` ordonné.
    - **Sous-agents :** acheminez les tâches de programmation vers un agent spécialisé dans
      Codex disposant de son propre modèle `openai/gpt-5.5`.

    Consultez [Modèles](/fr/concepts/models) et [Commandes slash](/fr/tools/slash-commands).

  </Accordion>

  <Accordion title="Comment configurer le mode rapide pour GPT 5.5 ?">
    - **Par session :** envoyez `/fast on` lorsque vous utilisez `openai/gpt-5.5`.
    - **Valeur par défaut du modèle :** définissez
      `agents.defaults.models["openai/gpt-5.5"].params.fastMode` sur `true`.
    - **Seuil automatique :** `/fast auto` ou `params.fastMode: "auto"` exécute rapidement
      les nouveaux appels au modèle jusqu’au seuil, puis exécute les appels ultérieurs de
      nouvelle tentative, de basculement, de résultat d’outil ou de continuation sans le
      mode rapide. Le seuil est de 60 secondes par défaut ; remplacez-le avec
      `params.fastAutoOnSeconds` sur le modèle.

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
    modifie ni `reasoning` ni `text.verbosity`. Les remplacements `/fast` propres à la session
    ont priorité sur les valeurs par défaut de la configuration.

    Consultez [Réflexion et mode rapide](/fr/tools/thinking) ainsi que la section Mode rapide
    sous Configuration avancée sur la page du fournisseur [OpenAI](/fr/providers/openai).

  </Accordion>

  <Accordion title='Pourquoi « Model ... is not allowed » s’affiche-t-il sans qu’aucune réponse ne suive ?'>
    Si `agents.defaults.models` est défini, il devient la **liste d’autorisation** de
    `/model` et des remplacements propres aux sessions. La sélection d’un modèle absent de
    cette liste renvoie le message suivant au lieu d’une réponse normale :

    ```text
    Le modèle "provider/model" n’est pas autorisé. Utilisez /models pour répertorier les fournisseurs, ou /models <provider> pour répertorier les modèles.
    Ajoutez-le avec : openclaw config set agents.defaults.models '{"provider/model":{}}' --strict-json --merge
    ```

    Correction : ajoutez le modèle exact à `agents.defaults.models`, ajoutez un caractère
    générique de fournisseur tel que `"provider/*": {}` pour les catalogues dynamiques,
    supprimez la liste d’autorisation ou sélectionnez un modèle dans `/model list`. Si la
    commande incluait également `--runtime codex`, mettez d’abord à jour la liste
    d’autorisation, puis réessayez la même commande
    `/model provider/model --runtime codex`.

  </Accordion>

  <Accordion title='Pourquoi « Unknown model: minimax/MiniMax-M3 » s’affiche-t-il ?'>
    Si vous utilisez une ancienne version d’OpenClaw, commencez par effectuer la mise à niveau
    (ou exécutez depuis la branche source `main`) et redémarrez le Gateway : `MiniMax-M3` peut
    ne pas encore figurer dans le catalogue de votre version installée. Sinon, le fournisseur
    MiniMax n’est pas configuré (aucune entrée de fournisseur ni aucun profil d’authentification
    trouvé), si bien que le modèle ne peut pas être résolu. Consultez la section Dépannage de
    la page du fournisseur [MiniMax](/fr/providers/minimax) pour obtenir la liste de vérification
    complète, le tableau des identifiants de fournisseur/modèle et un exemple de bloc de
    configuration.

  </Accordion>

  <Accordion title="Puis-je utiliser MiniMax par défaut et OpenAI pour les tâches complexes ?">
    Oui. Utilisez MiniMax par défaut et changez de modèle par session : les modèles de secours
    servent à gérer les erreurs, et non les « tâches difficiles ». Utilisez donc `/model` ou
    un agent distinct.

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

    **Option B : agents distincts** — L’agent A utilise MiniMax par défaut, tandis que
    l’agent B utilise OpenAI ; acheminez les tâches selon l’agent ou utilisez `/agent`
    pour changer d’agent.

    Documentation : [Modèles](/fr/concepts/models), [Routage multi-agent](/fr/concepts/multi-agent),
    [MiniMax](/fr/providers/minimax), [OpenAI](/fr/providers/openai).

  </Accordion>

  <Accordion title="opus / sonnet / gpt sont-ils des raccourcis intégrés ?">
    Oui, ce sont des raccourcis intégrés, appliqués uniquement lorsque le modèle cible existe
    dans `agents.defaults.models` :

    | Alias | Se résout en |
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

  <Accordion title="Comment définir ou remplacer les raccourcis de modèles (alias) ?">
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

    Ensuite, `/model sonnet` (ou `/<alias>` lorsque cette syntaxe est prise en charge) se
    résout en cet identifiant de modèle.

  </Accordion>

  <Accordion title="Comment ajouter des modèles provenant d’autres fournisseurs, comme OpenRouter ou Z.AI ?">
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

    L’absence de clé pour un fournisseur référencé par un fournisseur/modèle provoque une
    erreur d’authentification lors de l’exécution (par exemple
    `No API key found for provider "zai"`).

    **Aucune clé d’API trouvée pour le fournisseur après l’ajout d’un nouvel agent**

    Un nouvel agent possède un magasin d’authentification vide : l’authentification est propre
    à chaque agent et stockée à l’emplacement suivant :

    ```text
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Correction : exécutez `openclaw agents add <id>` et configurez l’authentification dans l’assistant, ou
    copiez uniquement les profils statiques portables `api_key`/`token` depuis le magasin
    de l’agent principal. Pour OAuth, connectez-vous depuis le nouvel agent lorsqu’il a besoin de son
    propre compte. Consultez [Routage multi-agent](/fr/concepts/multi-agent) pour connaître
    l’ensemble des règles de réutilisation d’`agentDir` et de partage des identifiants — ne réutilisez jamais
    `agentDir` entre plusieurs agents.

  </Accordion>
</AccordionGroup>

## Basculement de modèle et « Échec de tous les modèles »

<AccordionGroup>
  <Accordion title="Comment fonctionne le basculement ?">
    Deux étapes :

    1. **Rotation des profils d’authentification** au sein du même fournisseur.
    2. **Modèle de secours** suivant dans `agents.defaults.model.fallbacks`.

    Des délais de récupération s’appliquent aux profils en échec (temporisation exponentielle), afin qu’OpenClaw
    continue de répondre lorsqu’un fournisseur limite le débit ou rencontre une défaillance temporaire.

    La catégorie de limitation de débit couvre davantage que le simple code `429` : `Too many concurrent
    requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai
    ... quota limit exceeded`, `resource exhausted` et les limites périodiques
    de fenêtre d’utilisation (`weekly/monthly limit reached`) sont toutes considérées comme
    des limitations de débit justifiant un basculement.

    Les réponses de facturation ne sont pas toujours des codes `402`, et certains codes `402` restent dans la
    catégorie des erreurs transitoires/de limitation de débit plutôt que dans celle de la facturation. Un texte explicite
    relatif à la facturation dans une réponse `401`/`403` peut tout de même être classé comme tel ; les outils de correspondance
    textuelle propres à un fournisseur (par exemple `Key limit exceeded` d’OpenRouter) restent limités à leur
    propre fournisseur. Un code `402` qui ressemble à une limite réessayable de fenêtre d’utilisation ou
    de dépenses d’organisation/espace de travail (`daily limit reached, resets tomorrow`,
    `organization spending limit exceeded`) est traité comme `rate_limit`, et non comme une
    désactivation prolongée pour facturation.

    Les erreurs de dépassement de contexte sont entièrement exclues du chemin de secours — les signatures
    telles que `request_too_large`, `input exceeds the maximum number of tokens`,
    `input token count exceeds the maximum number of input tokens`, `input is
    too long for the model` ou `ollama error: context length exceeded` entraînent
    une Compaction/nouvelle tentative au lieu de passer au modèle de secours suivant.

    Le texte générique d’erreur serveur est plus restreint que « tout ce qui contient unknown/error ».
    Les formes transitoires propres à un fournisseur qui comptent comme signaux de basculement
    sont notamment : le message seul `An unknown error occurred` d’Anthropic, le message seul
    `Provider returned error` d’OpenRouter, les erreurs de motif d’arrêt telles que `Unhandled stop reason:
    error`, les charges utiles JSON `api_error` contenant un texte d’erreur serveur transitoire (`internal
    server error`, `unknown error, 520`, `upstream error`, `backend error`),
    et les erreurs de fournisseur occupé telles que `ModelNotReadyException` lorsque le contexte du fournisseur
    correspond. Un texte générique de secours interne comme `LLM request failed
    with an unknown error.` reste interprété de manière prudente et ne déclenche pas à lui seul un basculement.

  </Accordion>

  <Accordion title='Que signifie « No credentials found for profile anthropic:default » ?'>
    L’identifiant de profil d’authentification `anthropic:default` ne contient aucun identifiant dans le
    magasin d’authentification attendu.

    **Liste de vérification pour la correction :**

    - Confirmez l’emplacement des profils — actuel :
      `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` ; ancien :
      `~/.openclaw/agent/*` (migré par `openclaw doctor`).
    - Vérifiez que le Gateway charge votre variable d’environnement. Une variable `ANTHROPIC_API_KEY` définie uniquement dans
      votre shell ne sera pas transmise à une exécution du Gateway via systemd/launchd — placez-la dans
      `~/.openclaw/.env` ou activez `env.shellEnv`.
    - Vérifiez que vous modifiez le bon agent — les configurations multi-agents comportent
      plusieurs fichiers `auth-profiles.json`.
    - Exécutez `openclaw models status` pour afficher les modèles configurés et l’état
      d’authentification du fournisseur.

    **Pour « No credentials found for profile anthropic » (sans suffixe d’adresse e-mail) :**

    L’exécution est verrouillée sur un profil Anthropic que le Gateway ne trouve pas.

    - Utilisez la CLI Claude : exécutez `openclaw models auth login --provider anthropic
      --method cli --set-default` sur l’hôte du Gateway.
    - Préférez plutôt une clé d’API : placez `ANTHROPIC_API_KEY` dans
      `~/.openclaw/.env` sur l’hôte du Gateway, puis effacez tout ordre imposé
      qui force l’utilisation du profil manquant :

      ```bash
      openclaw models auth order clear --provider anthropic
      ```

    - Mode distant : les profils d’authentification résident sur la machine du Gateway, et non sur votre
      ordinateur portable — vérifiez que vous y exécutez bien les commandes.

  </Accordion>

  <Accordion title="Pourquoi a-t-il également essayé Google Gemini et échoué ?">
    Si votre configuration de modèles inclut Google Gemini comme solution de secours (ou si vous
    êtes passé à un raccourci Gemini), OpenClaw l’essaie lors du basculement. Si aucun
    identifiant Google n’est configuré, vous obtenez `No API key found for provider
    "google"`. Correction : ajoutez l’authentification Google ou supprimez les modèles Google de
    `agents.defaults.model.fallbacks`/des alias.

    **Requête LLM rejetée : signature de réflexion requise (Google Antigravity)**

    Cause : l’historique de session contient des blocs de réflexion sans signature (souvent
    issus d’un flux interrompu/partiel) ; Google Antigravity exige des signatures
    sur les blocs de réflexion. OpenClaw supprime les blocs de réflexion non signés pour Google
    Antigravity Claude ; si le problème persiste, démarrez une nouvelle session ou définissez
    `/thinking off` pour cet agent.

  </Accordion>
</AccordionGroup>

## Profils d’authentification : définition et gestion

Voir aussi : [/concepts/oauth](/fr/concepts/oauth) (flux OAuth, stockage des jetons, configurations à plusieurs comptes)

<AccordionGroup>
  <Accordion title="Qu’est-ce qu’un profil d’authentification ?">
    Un enregistrement d’identifiants nommé (OAuth ou clé d’API), associé à un fournisseur et stocké
    à l’emplacement suivant :

    ```text
    ~/.openclaw/agents/<agentId>/agent/auth-profiles.json
    ```

    Inspectez les profils enregistrés sans afficher les secrets : `openclaw models auth
    list` (éventuellement avec `--provider <id>` ou `--json`). Consultez
    [CLI des modèles](/fr/cli/models#auth-profiles).

  </Accordion>

  <Accordion title="Quels sont les identifiants de profil habituels ?">
    Préfixés par le fournisseur : `anthropic:default` (courant lorsqu’aucune identité associée à une adresse e-mail
    n’existe), `anthropic:<email>` pour les identités OAuth, ou un identifiant personnalisé de votre
    choix (par exemple `anthropic:work`).

  </Accordion>

  <Accordion title="Puis-je contrôler quel profil d’authentification est essayé en premier ?">
    Oui. La configuration `auth.order.<provider>` définit l’ordre de rotation par fournisseur
    (métadonnées uniquement — aucun secret n’est stocké).

    OpenClaw peut ignorer un profil soumis à un court **délai de récupération** (limitations de débit,
    délais d’attente dépassés, échecs d’authentification) ou à un état **désactivé** plus long
    (facturation/crédits insuffisants). Examinez la situation avec `openclaw models status
    --json` et consultez `auth.unusableProfiles`. Ajustez-la avec
    `auth.cooldowns.billingBackoffHours*`. Les délais de récupération liés à la limitation de débit peuvent être
    propres au modèle — un profil en délai de récupération pour un modèle peut toujours servir un
    modèle apparenté chez le même fournisseur ; les fenêtres de facturation/désactivation bloquent
    l’ensemble du profil.

    Définissez un remplacement de l’ordre propre à l’agent (stocké dans le fichier `auth-state.json` de cet agent) :

    ```bash
    # Utilise par défaut l’agent configuré par défaut (omettez --agent)
    openclaw models auth order get --provider anthropic

    # Limite la rotation à un seul profil
    openclaw models auth order set --provider anthropic anthropic:default

    # Ou définit un ordre explicite (secours au sein du fournisseur)
    openclaw models auth order set --provider anthropic anthropic:work anthropic:default

    # Efface le remplacement (revient à la configuration auth.order / rotation circulaire)
    openclaw models auth order clear --provider anthropic

    # Cible un agent précis
    openclaw models auth order set --provider anthropic --agent main anthropic:default
    ```

    Vérifiez ce qui sera réellement essayé : `openclaw models status --probe`. Un
    profil enregistré omis d’un ordre explicite indique
    `excluded_by_auth_order` au lieu d’être essayé silencieusement.

  </Accordion>

  <Accordion title="OAuth ou clé d’API : quelle est la différence ?">
    - La **connexion OAuth / CLI** utilise souvent l’accès par abonnement lorsque le
      fournisseur le prend en charge. Pour Anthropic, le backend CLI Claude d’OpenClaw
      utilise Claude Code `claude -p`, qu’Anthropic considère actuellement comme une
      utilisation de l’Agent SDK/programmatique prélevée sur les limites d’utilisation de l’abonnement —
      consultez [Anthropic](/fr/providers/anthropic) pour connaître l’état actuel de la suspension de facturation
      et les liens vers les sources.
    - Les **clés d’API** utilisent une facturation par jeton.

    L’assistant prend en charge la CLI Anthropic Claude, OAuth d’OpenAI Codex et les clés
    d’API.

  </Accordion>
</AccordionGroup>

## Ressources associées

- [FAQ](/fr/help/faq) — la FAQ principale
- [FAQ — démarrage rapide et configuration initiale](/fr/help/faq-first-run)
- [Sélection du modèle](/fr/concepts/model-providers)
- [Basculement de modèle](/fr/concepts/model-failover)
