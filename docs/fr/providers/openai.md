---
read_when:
    - Vous souhaitez utiliser les modèles OpenAI dans OpenClaw
    - Vous souhaitez utiliser l’authentification par abonnement Codex plutôt que des clés API
    - Vous avez besoin d’un comportement d’exécution plus strict pour l’agent GPT-5
summary: Utilisez OpenAI via des clés API ou un abonnement Codex dans OpenClaw
title: OpenAI
x-i18n:
    generated_at: "2026-07-16T13:42:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 18efddc44f2b06ae9592cdbc01c0aadc4621ddf99e818793a4d835c741a2464e
    source_path: providers/openai.md
    workflow: 16
---

OpenClaw utilise un seul identifiant de fournisseur, `openai`, pour l’authentification directe par clé d’API et
l’authentification par abonnement ChatGPT/Codex. `openai/*` est la route de modèle canonique.
Pour les tours d’agent intégrés dont la politique d’exécution n’est pas définie ou vaut `auto`, les caractéristiques de route
d’OpenAI déterminent si OpenClaw peut sélectionner implicitement l’environnement d’exécution app-server Codex inclus.
Le préfixe `openai/*` seul ne sélectionne aucun environnement d’exécution.

- **Modèles d’agent** - `openai/*` via l’environnement d’exécution sélectionné par une configuration
  `agentRuntime` explicite ou par la politique de route implicite d’OpenAI. Connectez-vous avec l’authentification Codex
  pour utiliser un abonnement ChatGPT/Codex, ou configurez un profil d’authentification par clé d’API
  si vous souhaitez une facturation basée sur une clé.
- **API OpenAI hors agent** - accès direct à OpenAI Platform, facturé à l’utilisation,
  via `OPENAI_API_KEY` ou un profil d’authentification par clé d’API `openai`.
- **Configuration héritée** - les références `codex/*` et `openai-codex/*` sont corrigées en
  `openai/*`, avec `agentRuntime.id: "codex"` limité au modèle, par
  `openclaw doctor --fix`.

OpenAI prend explicitement en charge l’utilisation d’OAuth avec un abonnement dans des outils externes et
des workflows comme OpenClaw.

## Suivi de l’utilisation et des coûts

OpenClaw distingue le quota de l’abonnement de la facturation de l’API Platform :

- L’OAuth ChatGPT/Codex affiche le forfait d’abonnement, les fenêtres de quota et le solde de crédits.
- `OPENAI_ADMIN_KEY` affiche 30 jours de coûts d’organisation et d’utilisation des complétions communiqués par le fournisseur dans **Utilisation** de l’interface de contrôle, notamment les dépenses quotidiennes, les totaux de requêtes et de jetons, les principaux modèles et les catégories de coûts.
- `OPENAI_PROJECT_ID` limite facultativement l’historique de l’API d’administration à un seul projet.
- OpenClaw n’envoie jamais `OPENAI_API_KEY` ni un profil d’inférence `openai` aux API de l’organisation ; ces identifiants peuvent appartenir à des points de terminaison personnalisés, Azure ou locaux à l’agent.

Une clé d’administration explicite est prioritaire sur OAuth. L’historique communiqué par le fournisseur n’est pas fusionné avec le coût estimé par OpenClaw à partir des sessions ; il peut inclure l’activité d’API d’autres clients et des ajustements de facturation effectués côté fournisseur.

La documentation du [tableau de bord d’utilisation de l’API](https://help.openai.com/en/articles/10478918) d’OpenAI décrit les exigences relatives au rôle de propriétaire de l’organisation et à l’autorisation explicite Usage Dashboard pour accéder aux données d’utilisation.

Le fournisseur, le modèle, l’environnement d’exécution et le canal constituent des couches distinctes. Si ces libellés
sont confondus, consultez [Environnements d’exécution des agents](/fr/concepts/agent-runtimes) avant de
modifier la configuration.

## Choix rapide

| Objectif                                          | Utiliser                                                           | Remarques                                                           |
| ------------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------- |
| Abonnement ChatGPT/Codex, environnement d’exécution Codex natif | `openai/gpt-5.6-sol`                                               | Nouvelle configuration d’abonnement ; connectez-vous avec l’authentification Codex. |
| Facturation directe par clé d’API pour les tours d’agent | `openai/gpt-5.6` avec un profil d’authentification par clé d’API ordonné | Nouvelle configuration par clé d’API ; l’identifiant d’API directe sans qualification correspond à Sol. |
| Choisir un niveau GPT-5.6 précis                  | `openai/gpt-5.6-sol`, `-terra` ou `-luna`                         | Consultez `models list` pour connaître les niveaux disponibles pour ce compte. |
| Compte sans accès à GPT-5.6                       | `openai/gpt-5.5`                                                   | Choix explicite de récupération ; OpenClaw ne rétrograde pas silencieusement. |
| Facturation directe par clé d’API, environnement d’exécution OpenClaw explicite | `openai/gpt-5.6` avec le fournisseur/modèle `agentRuntime.id: "openclaw"` | Sélectionnez un profil d’authentification par clé d’API `openai` normal. |
| Dernier alias du modèle ChatGPT Instant           | `openai/chat-latest`                                               | Clé d’API directe uniquement ; alias évolutif, et non valeur par défaut stable. |
| Génération ou modification d’images               | `openai/gpt-image-2`                                               | Fonctionne avec `OPENAI_API_KEY` ou OAuth Codex. |
| Images à arrière-plan transparent                 | `openai/gpt-image-1.5`                                             | Définissez `outputFormat` sur `png` ou `webp`, ainsi que `background=transparent`. |

## Correspondance des noms

| Nom affiché                              | Couche            | Signification                                                                            |
| ---------------------------------------- | ----------------- | ---------------------------------------------------------------------------------------- |
| `openai`                                | Préfixe du fournisseur | Route de modèle OpenAI canonique ; les caractéristiques de route déterminent l’environnement d’exécution implicite. |
| Plugin `codex`                         | Plugin            | Plugin inclus fournissant l’environnement d’exécution app-server Codex natif et les commandes de discussion `/codex`. |
| fournisseur/modèle `agentRuntime.id: codex` | Environnement d’exécution de l’agent | Force le harnais app-server Codex natif pour les tours intégrés correspondants. |
| `/codex ...`                            | Ensemble de commandes de discussion | Associe et contrôle les fils app-server Codex depuis une conversation. |
| `runtime: "acp", agentId: "codex"`      | Route de session ACP | Chemin de repli explicite qui exécute Codex via ACP/acpx. |

## Environnement d’exécution implicite de l’agent

Lorsque la politique `agentRuntime` du fournisseur/modèle n’est pas définie ou vaut `auto`, la politique de route
détenue par le fournisseur OpenAI choisit l’environnement d’exécution implicite à partir du
point de terminaison et de l’adaptateur effectifs :

| Caractéristiques de la route effective                                                                                                                                | Environnement d’exécution implicite |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| Point de terminaison HTTPS Platform officiel exact avec `openai-responses`, ou point de terminaison HTTPS ChatGPT officiel exact avec `openai-chatgpt-responses` ; aucune substitution de requête définie | Codex peut être sélectionné |
| Adaptateur `openai-completions` défini                                                                                                                                  | OpenClaw              |
| Point de terminaison personnalisé                                                                                                                                      | OpenClaw              |
| Point de terminaison officiel exact explicitement configuré avec HTTP                                                                                                  | Rejeté                |
| Route avec une substitution de requête définie pour le fournisseur/modèle                                                                                              | OpenClaw              |

Une configuration `agentRuntime.id` explicite et non par défaut du fournisseur/modèle reste prioritaire.
Par exemple, `agentRuntime.id: "openclaw"` maintient sur OpenClaw une
route qui serait autrement admissible à Codex, tandis que `agentRuntime.id: "codex"` exige Codex et échoue
de manière fermée lorsque la route effective n’est pas déclarée compatible avec Codex.
La sélection de l’environnement d’exécution ne modifie ni le type d’identifiants ni la facturation : l’authentification
par clé d’API Platform et l’authentification par abonnement ChatGPT/Codex restent distinctes.

`openclaw doctor --fix` migre les références de modèle héritées `codex/*` et `openai-codex/*`,
les identifiants de profils d’authentification Codex hérités et les entrées héritées d’ordre d’authentification Codex vers la
route canonique `openai`. Les références de modèle migrées reçoivent
`agentRuntime.id: "codex"` limité au modèle ; utilisez `auth.order.openai` pour toute nouvelle configuration de l’ordre d’authentification.

<Note>
Une nouvelle configuration OpenAI applique un modèle principal GPT-5.6 uniquement lorsqu’aucun modèle principal n’est
configuré. L’ajout ou l’actualisation de l’authentification OpenAI conserve toute sélection explicite
existante, notamment `openai/gpt-5.5`, sauf si vous utilisez explicitement
`models auth login --set-default` ou `models set`. Utilisez un profil d’authentification par clé d’API
uniquement si vous souhaitez une authentification par clé d’API pour un modèle d’agent.
</Note>

## Aperçu limité de GPT-5.6

OpenClaw reconnaît les identifiants de modèle exacts `openai/gpt-5.6-sol`,
`openai/gpt-5.6-terra` et `openai/gpt-5.6-luna`. Tous trois proposent le raisonnement
`xhigh` et `max` dans le catalogue actuel. OpenAI décrit Sol comme
le niveau phare, Terra comme le niveau équilibré et Luna comme le niveau rapide
et moins coûteux. Consultez
[l’annonce de lancement de GPT-5.6](https://openai.com/index/previewing-gpt-5-6-sol/)
et le [guide d’accès](https://help.openai.com/en/articles/20001325-a-preview-of-gpt-5-6-sol-terra-and-luna).

Avec l’authentification directe par clé d’API OpenAI, l’identifiant `openai/gpt-5.6` sans qualification est un alias de
Sol et constitue la valeur par défaut d’une nouvelle configuration. Le catalogue Codex natif n’applique pas
cet alias d’API directe côté client ; selon l’accès de l’espace de travail, il peut afficher
les identifiants exacts de Sol, Terra et Luna. Une nouvelle configuration OAuth ChatGPT/Codex
utilise donc `openai/gpt-5.6-sol`. Vérifiez le compte actuel avec :

```bash
openclaw models list --provider openai
```

L’accès de l’organisation de l’API et celui de l’espace de travail Codex peuvent différer. Si GPT-5.6 n’est pas
disponible, sélectionnez explicitement GPT-5.5 :

```bash
openclaw models set openai/gpt-5.5
```

OpenClaw affiche l’erreur d’accès en amont et ne remplace pas silencieusement une
sélection GPT-5.6 par GPT-5.5.

<Note>
Les routes HTTPS officielles exactes admissibles peuvent sélectionner le Plugin app-server Codex
inclus lorsque la politique d’exécution n’est pas définie ou vaut `auto` ; les routes Completions définies,
les points de terminaison personnalisés et les substitutions de transport des requêtes restent sur OpenClaw. Les points de terminaison
HTTP officiels en texte clair sont rejetés. La configuration explicite de l’environnement d’exécution du fournisseur/modèle reste
prioritaire. Exécutez `openclaw doctor --fix` pour corriger les anciennes références de modèle Codex
héritées, les références `codex-cli/*` ou les anciens épinglages de session d’exécution qui n’ont pas été définis par
une configuration d’exécution explicite.
</Note>

## Couverture fonctionnelle d’OpenClaw

| Fonctionnalité OpenAI         | Surface OpenClaw                                                                              | État                                                          |
| ------------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Chat / Responses          | fournisseur de modèles `openai/<model>`                                                               | Oui                                                             |
| Modèles de l’abonnement Codex | `openai/<model>` avec OAuth OpenAI                                                            | Oui                                                             |
| Anciennes références de modèles Codex   | anciennes références de modèles Codex, `codex-cli/<model>`                                                     | Réparées par doctor en `openai/<model>`                          |
| Harnais app-server Codex  | route HTTPS compatible avec Codex avec runtime non défini/`auto`, ou `agentRuntime.id: codex` explicite  | Oui                                                             |
| Recherche web côté serveur    | Outil OpenAI Responses natif                                                                  | Oui, lorsque la recherche web est activée et qu’aucun autre fournisseur n’est imposé |
| Images                    | `image_generate`                                                                              | Oui                                                             |
| Vidéos                    | `video_generate`                                                                              | Oui                                                             |
| Synthèse vocale            | `messages.tts.provider: "openai"` / `tts`                                                     | Oui                                                             |
| Transcription vocale par lots      | `tools.media.audio` / compréhension des médias                                                     | Oui                                                             |
| Transcription vocale en streaming  | Voice Call `streaming.provider: "openai"`                                                     | Oui                                                             |
| Voix en temps réel            | Voice Call `realtime.provider: "openai"` / Talk de la Control UI `talk.realtime.provider: "openai"` | Oui (clé API OpenAI Platform)                                   |
| Plongements                | fournisseur de plongements de mémoire                                                                     | Oui                                                             |

<Note>
La voix OpenAI Realtime passe par l’**API Realtime publique d’OpenAI Platform**
et nécessite une clé API Platform. Les jetons OAuth Codex authentifient à la
place le backend ChatGPT Codex ; ils ne sont pas interchangeables avec les clés
API Platform pour les points de terminaison Realtime publics.

Si l’authentification par clé API signale une facturation manquante, rechargez les crédits Platform sur
[platform.openai.com/account/billing](https://platform.openai.com/account/billing)
pour l’organisation associée à vos identifiants en temps réel lors de l’utilisation de
l’authentification par clé API. La voix en temps réel accepte le profil d’authentification par clé API `openai` créé par
`openclaw onboard --auth-choice openai-api-key`, une clé API Platform définie via
`talk.realtime.providers.openai.apiKey` pour Talk de la Control UI, ou
`plugins.entries.voice-call.config.realtime.providers.openai.apiKey` pour Voice
Call, ou la variable d’environnement `OPENAI_API_KEY`.
</Note>

## Plongements de mémoire

OpenClaw peut utiliser OpenAI, ou un point de terminaison de plongements compatible avec OpenAI, pour
les plongements d’indexation et de requête `memory_search` :

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "openai",
        model: "text-embedding-3-small",
      },
    },
  },
}
```

Pour les points de terminaison compatibles avec OpenAI qui nécessitent des libellés de plongement asymétriques, définissez
`queryInputType` et `documentInputType` sous `memorySearch`. OpenClaw
les transmet en tant que champs de requête `input_type` propres au fournisseur : les plongements de
requête utilisent `queryInputType` ; les fragments de mémoire indexés et l’indexation par lots utilisent
`documentInputType`. Consultez la
[référence de configuration de la mémoire](/fr/reference/memory-config#provider-specific-config)
pour l’exemple complet.

## Prise en main

<Tabs>
  <Tab title="Clé API (OpenAI Platform)">
    **Idéal pour :** l’accès direct à l’API et la facturation à l’usage.

    <Steps>
      <Step title="Obtenir votre clé API">
        Créez ou copiez une clé API depuis le [tableau de bord OpenAI Platform](https://platform.openai.com/api-keys).
      </Step>
      <Step title="Exécuter l’intégration initiale">
        ```bash
        openclaw onboard --auth-choice openai-api-key
        ```

        Ou transmettez directement la clé :

        ```bash
        openclaw onboard --openai-api-key "$OPENAI_API_KEY"
        ```
      </Step>
      <Step title="Vérifier que le modèle est disponible">
        ```bash
        openclaw models list --provider openai
        ```
      </Step>
    </Steps>

    ### Résumé des routes

    | Référence du modèle        | Politique de runtime ou caractéristiques de la route                                 | Route                     | Authentification                              |
    | ---------------- | ------------------------------------------------------------- | ------------------------- | --------------------------------- |
    | `openai/gpt-5.6` | non défini/`auto`, route native HTTPS officielle exacte, aucune substitution de requête | Codex peut être sélectionné     | Profil d’authentification par clé API ordonné      |
    | `openai/gpt-5.6` | fournisseur/modèle `agentRuntime.id: "openclaw"`                  | runtime intégré d’OpenClaw | Profil de clé API `openai` sélectionné |
    | `openai/gpt-5.5` | fournisseur/modèle `agentRuntime.id` explicite                     | runtime d’agent sélectionné    | Profil de clé API OpenAI sélectionné   |
    | `openai/*`       | Completions créées, personnalisées ou substitution de requête | runtime intégré d’OpenClaw | Le type d’identifiant reste inchangé |
    | `openai/*`       | point de terminaison HTTP officiel en clair                  | Rejeté                 | L’identifiant n’est pas envoyé             |

    <Note>
    Lorsque le runtime est non défini ou vaut `auto`, seule une route native HTTPS officielle exacte
    et admissible peut sélectionner implicitement le harnais app-server Codex. Pour l’authentification
    par clé API sur un modèle d’agent, créez un profil d’authentification par clé API `openai` et ordonnez-le avec
    `auth.order.openai` ; `OPENAI_API_KEY` reste la solution de repli directe pour
    les surfaces de l’API OpenAI ne concernant pas les agents. Exécutez `openclaw doctor --fix` pour migrer les anciennes
    entrées d’ordre d’authentification Codex.
    </Note>

    ### Exemple de configuration

    ```json5
    {
      env: { OPENAI_API_KEY: "example-openai-key-not-real" },
      agents: { defaults: { model: { primary: "openai/gpt-5.6" } } },
    }
    ```

    L’identifiant direct d’API nu `gpt-5.6` correspond au niveau Sol. Si cette organisation
    d’API n’expose pas GPT-5.6, définissez explicitement le modèle principal sur
    `openai/gpt-5.5`.

    Pour essayer le modèle Instant actuel de ChatGPT depuis l’API OpenAI, définissez le modèle
    sur `openai/chat-latest` :

    ```json5
    {
      env: { OPENAI_API_KEY: "example-openai-key-not-real" },
      agents: { defaults: { model: { primary: "openai/chat-latest" } } },
    }
    ```

    `chat-latest` est un alias évolutif. Une nouvelle configuration par clé API OpenAI utilise plutôt
    `openai/gpt-5.6`, dont l’identifiant direct d’API nu correspond à Sol. Les modèles principaux
    explicites existants, notamment `openai/gpt-5.5`, restent inchangés. L’alias
    `chat-latest` accepte uniquement la verbosité de texte `medium` ; OpenClaw force
    toute autre verbosité demandée sur `medium` pour ce modèle.

    <Warning>
    OpenClaw n’expose **pas** `gpt-5.3-codex-spark` sur la route directe par
    clé API OpenAI. Il n’est disponible que par l’intermédiaire des entrées du
    catalogue de l’abonnement Codex lorsque votre compte connecté l’expose.
    </Warning>

  </Tab>

  <Tab title="Abonnement Codex">
    **Idéal pour :** utiliser votre abonnement ChatGPT/Codex avec l’exécution app-server
    Codex native plutôt qu’une clé API distincte. Le cloud Codex nécessite une
    connexion à ChatGPT.

    <Steps>
      <Step title="Exécuter OAuth Codex">
        ```bash
        openclaw onboard --auth-choice openai
        ```

        Ou exécutez directement OAuth :

        ```bash
        openclaw models auth login --provider openai
        ```

        Pour les configurations sans interface graphique ou incompatibles avec les rappels, ajoutez `--device-code` afin de vous
        connecter au moyen d’un flux de code d’appareil ChatGPT plutôt que du rappel du navigateur
        localhost :

        ```bash
        openclaw models auth login --provider openai --device-code
        ```
      </Step>
      <Step title="Utiliser la route canonique du modèle OpenAI">
        ```bash
        openclaw config set agents.defaults.model.primary openai/gpt-5.6-sol
        ```

        Aucune configuration du runtime n’est requise pour cette route native HTTPS officielle
        exacte. Elle peut sélectionner automatiquement le runtime app-server Codex, et
        OpenClaw installe ou répare le plugin Codex intégré lorsque ce runtime
        est choisi.
      </Step>
      <Step title="Vérifier que l’authentification Codex est disponible">
        ```bash
        openclaw models list --provider openai
        ```

        Une fois le Gateway en cours d’exécution, envoyez `/codex status` ou `/codex models`
        dans le chat pour vérifier le runtime app-server natif.
      </Step>
    </Steps>

    ### Résumé des routes

    | Référence du modèle                | Politique de runtime ou caractéristiques de la route                                 | Route                                                    | Authentification                                               |
    | ------------------------ | ------------------------------------------------------------- | -------------------------------------------------------- | -------------------------------------------------- |
    | `openai/gpt-5.6-sol`     | non défini/`auto`, route native HTTPS officielle exacte, aucune substitution de requête | Codex peut être sélectionné                                    | Connexion Codex, ou profil d’authentification `openai` ordonné |
    | `openai/gpt-5.6-terra`   | non défini/`auto`, route native HTTPS officielle exacte, aucune substitution de requête | Codex peut être sélectionné                                    | Connexion Codex lorsque le catalogue expose Terra       |
    | `openai/gpt-5.6-luna`    | non défini/`auto`, route native HTTPS officielle exacte, aucune substitution de requête | Codex peut être sélectionné                                    | Connexion Codex lorsque le catalogue expose Luna        |
    | `openai/gpt-5.6-sol`     | fournisseur/modèle `agentRuntime.id: "openclaw"`                  | runtime intégré d’OpenClaw, transport interne d’authentification Codex | Profil OAuth `openai` sélectionné                    |
    | `openai/gpt-5.5`         | fournisseur/modèle `agentRuntime.id` explicite                     | runtime d’agent sélectionné                                   | Profil d’authentification OpenAI sélectionné                       |
    | `openai/*`               | Completions créées, personnalisées ou substitution de requête | runtime intégré d’OpenClaw                                | L’exigence relative aux identifiants reste propre à la route      |
    | `openai/*`               | point de terminaison HTTP officiel en clair                  | Rejeté                                                 | L’identifiant n’est pas envoyé                              |
    | Ancienne référence Codex GPT-5.5 | réparée par doctor                                            | Réécrite en `openai/gpt-5.5`                            | Profil OAuth OpenAI migré                      |
    | `codex-cli/gpt-5.5`      | réparée par doctor                                            | Réécrite en `openai/gpt-5.5`                            | Authentification app-server Codex                              |

    <Warning>
    La configuration initiale reposant sur un abonnement utilise exactement `openai/gpt-5.6-sol` ; le
    catalogue Codex natif peut également exposer des références Terra ou Luna exactes. Si le
    compte n’expose pas GPT-5.6, sélectionnez explicitement `openai/gpt-5.5`. Les anciennes
    références GPT de Codex sont des routes OpenClaw héritées, et non le chemin du runtime Codex
    natif ; exécutez `openclaw doctor --fix` pour les migrer sans mettre à niveau une
    sélection explicite existante de GPT-5.5. `gpt-5.3-codex-spark` reste limité
    aux comptes dont le catalogue d’abonnement Codex l’annonce ; les références directes
    par clé d’API OpenAI et Azure correspondantes restent masquées.
    </Warning>

    <Note>
    La nouvelle configuration doit placer l’ordre d’authentification de l’agent OpenAI sous `auth.order.openai` ;
    doctor migre les anciennes entrées héritées d’ordre d’authentification Codex.
    </Note>

    ### Exemple de configuration

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.6-sol" },
        },
      },
    }
    ```

    Avec une clé d’API de secours, conservez le modèle sélectionné sous `openai/*` et placez
    l’ordre d’authentification sous `openai`. OpenClaw essaie d’abord l’abonnement, puis
    la clé d’API, tout en restant sur le harnais Codex :

    ```json5
    {
      plugins: { entries: { codex: { enabled: true } } },
      agents: {
        defaults: {
          model: { primary: "openai/gpt-5.6-sol" },
        },
      },
      auth: {
        order: {
          openai: [
            "openai:user@example.com",
            "openai:api-key-backup",
          ],
        },
      },
    }
    ```

    <Note>
    L’intégration initiale n’importe plus les données OAuth depuis `~/.codex`. Connectez-vous avec
    OAuth dans le navigateur (par défaut) ou avec le flux par code d’appareil ci-dessus ; OpenClaw gère les
    identifiants obtenus dans son propre magasin d’authentification d’agent.
    </Note>

    ### Vérifier et rétablir le routage OAuth de Codex

    ```bash
    openclaw models status
    openclaw models auth list --provider openai
    openclaw config get agents.defaults.model --json
    openclaw config get models.providers.openai.agentRuntime --json
    ```

    Pour un agent précis, ajoutez `--agent <id>` :

    ```bash
    openclaw models status --agent <id>
    openclaw models auth list --agent <id> --provider openai
    ```

    Si une ancienne configuration contient encore des références GPT Codex héritées, ou un épinglage obsolète
    de session du runtime OpenAI sans configuration explicite du runtime, réparez-la :

    ```bash
    openclaw doctor --fix
    openclaw config validate
    ```

    Si `models auth list --provider openai` n’affiche aucun profil utilisable, reconnectez-vous :

    ```bash
    openclaw models auth login --provider openai
    openclaw models status --probe --probe-provider openai
    ```

    Utilisez `--profile-id` pour plusieurs connexions OAuth Codex dans le même agent, puis
    contrôlez-les au moyen de l’ordre d’authentification ou de `/model ...@<profileId>` :

    ```bash
    openclaw models auth login --provider openai --profile-id openai:ritsuko
    openclaw models auth login --provider openai --profile-id openai:lain
    ```

    Exécutez `openclaw doctor --fix` pour migrer les anciens identifiants de profil
    préfixés OpenAI Codex et les entrées d’ordre héritées avant de vous fier à l’ordre des profils.

    ### Indicateur d’état

    La commande de discussion `/status` indique quel runtime de modèle est actif pour la
    session actuelle. Le harnais de serveur d’application Codex inclus apparaît sous la forme
    `Runtime: OpenAI Codex` lorsqu’une route implicite admissible ou une politique explicite
    de runtime de fournisseur/modèle le sélectionne.

    ### Avertissement de doctor

    Si des références de modèle Codex héritées ou des épinglages obsolètes du runtime OpenAI subsistent dans la configuration
    ou l’état de session, `openclaw doctor --fix` les réécrit en `openai/*` avec
    le runtime Codex, sauf si OpenClaw est explicitement configuré.

    ### Limite de la fenêtre de contexte

    OpenClaw traite les métadonnées du modèle et la limite de contexte du runtime comme des
    valeurs distinctes. Pour `openai/gpt-5.5` via le catalogue OAuth Codex :

    - `contextWindow` natif : `400000`
    - Limite `contextTokens` par défaut du runtime : `272000`

    Dans la pratique, la limite par défaut plus faible offre de meilleures caractéristiques de latence et de qualité.
    Remplacez-la avec `contextTokens` :

    ```json5
    {
      models: {
        providers: {
          openai: {
            models: [{ id: "gpt-5.5", contextTokens: 160000 }],
          },
        },
      },
    }
    ```

    <Note>
    Utilisez `contextWindow` pour déclarer les métadonnées natives du modèle. Utilisez `contextTokens`
    pour limiter le budget de contexte du runtime. La route directe par clé d’API OpenAI
    indique un `contextWindow` natif plus grand (`1000000`) pour `gpt-5.5` ; les deux
    routes sont suivies séparément, car les catalogues en amont diffèrent.
    </Note>

    ### Rétablissement du catalogue

    OpenClaw utilise les métadonnées du catalogue Codex en amont pour `gpt-5.5` lorsqu’elles sont
    présentes. Si la découverte Codex en direct omet la ligne `gpt-5.5` alors que le compte
    est authentifié, OpenClaw synthétise cette ligne de modèle OAuth afin que les exécutions Cron,
    de sous-agents et avec le modèle configuré par défaut n’échouent pas avec
    `Unknown model`.

  </Tab>
</Tabs>

## Authentification du serveur d’application Codex natif

Le harnais de serveur d’application Codex natif utilise les références de modèle `openai/*` lorsqu’une route
HTTPS officielle exacte et admissible le sélectionne implicitement, ou lorsque le `agentRuntime.id: "codex"`
du fournisseur/modèle le sélectionne explicitement. Son authentification reste
liée au compte. OpenClaw sélectionne l’authentification dans cet ordre :

1. Profils d’authentification OpenAI ordonnés pour l’agent, de préférence sous
   `auth.order.openai`. Exécutez `openclaw doctor --fix` pour migrer les anciens identifiants
   de profil d’authentification Codex et l’ordre d’authentification hérités.
2. Compte existant du serveur d’application, par exemple une connexion ChatGPT
   locale dans la CLI Codex. Pour le répertoire personnel isolé par défaut de l’agent, OpenClaw transmet ce compte
   CLI natif au serveur d’application via son RPC de connexion ; il ne partage pas la
   configuration, les plugins ni le magasin de fils de discussion de la CLI.
3. Pour les lancements locaux du serveur d’application via stdio uniquement, et seulement lorsque celui-ci
   ne signale aucun compte : `CODEX_API_KEY`, puis `OPENAI_API_KEY`.

Une connexion locale à un abonnement ChatGPT/Codex n’est pas remplacée simplement parce que le
processus Gateway dispose également de `OPENAI_API_KEY` pour les modèles OpenAI directs ou les
embeddings. Le recours à la clé d’API d’environnement s’applique uniquement au chemin local stdio sans compte ;
elle n’est jamais envoyée sur les connexions WebSocket du serveur d’application. Lorsqu’un
profil Codex de type abonnement est sélectionné, OpenClaw empêche également
`CODEX_API_KEY` et `OPENAI_API_KEY` d’atteindre le processus enfant du serveur d’application stdio
et envoie plutôt les identifiants sélectionnés via le RPC de connexion du serveur d’application.

Lorsque ce profil d’abonnement est bloqué par une limite d’utilisation Codex, OpenClaw
marque le profil comme bloqué jusqu’à l’heure de réinitialisation annoncée par Codex et permet à l’ordre
d’authentification de passer au profil `openai:*` suivant, sans changer le modèle sélectionné
ni quitter le harnais Codex. Une fois l’heure de réinitialisation passée, le
profil d’abonnement redevient admissible.

## Génération d’images

Le plugin `openai` inclus enregistre la génération d’images au moyen de l’outil
`image_generate`. Il prend en charge la génération d’images avec une clé d’API OpenAI et avec OAuth Codex
via la même référence de modèle `openai/gpt-image-2`.

| Fonctionnalité            | Clé d’API OpenAI                    | OAuth Codex                          |
| ------------------------- | ---------------------------------- | ------------------------------------ |
| Référence du modèle       | `openai/gpt-image-2`               | `openai/gpt-image-2`                 |
| Authentification          | `OPENAI_API_KEY`                   | Connexion OAuth OpenAI Codex         |
| Transport                 | API OpenAI Images                  | Backend Codex Responses              |
| Nombre maximal d’images par requête | 4                         | 4                                    |
| Mode d’édition            | Activé (jusqu’à 5 images de référence) | Activé (jusqu’à 5 images de référence) |
| Remplacement des dimensions | Pris en charge, y compris les dimensions 2K/4K | Pris en charge, y compris les dimensions 2K/4K |
| Format d’image / résolution | Non transmis à l’API OpenAI Images | Converti en une dimension prise en charge lorsque cela est sûr |

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: { primary: "openai/gpt-image-2" },
    },
  },
}
```

<Note>
Consultez [Génération d’images](/fr/tools/image-generation) pour les paramètres communs de l’outil,
la sélection du fournisseur et le comportement de basculement.
</Note>

`gpt-image-2` est la valeur par défaut pour la génération d’images à partir de texte et la
retouche d’images avec OpenAI. `gpt-image-1.5`, `gpt-image-1` et `gpt-image-1-mini` restent utilisables
comme remplacements explicites du modèle. Utilisez `openai/gpt-image-1.5` pour
une sortie PNG/WebP à arrière-plan transparent ; l’API `gpt-image-2` actuelle rejette
`background: "transparent"`.

Pour une requête avec arrière-plan transparent, appelez `image_generate` avec
`model: "openai/gpt-image-1.5"`, `outputFormat: "png"` ou `"webp"`, ainsi que
`background: "transparent"` ; l’ancienne option de fournisseur `openai.background` est
toujours acceptée. OpenClaw protège également les routes publiques OpenAI et OAuth OpenAI Codex
en réécrivant les requêtes transparentes `openai/gpt-image-2` par défaut en
`gpt-image-1.5` ; Azure et les points de terminaison personnalisés compatibles avec OpenAI conservent leurs
noms de déploiement/modèle configurés.

Le même réglage est disponible pour les exécutions sans interface de la CLI :

```bash
openclaw infer image generate \
  --model openai/gpt-image-1.5 \
  --output-format png \
  --background transparent \
  --prompt "Un autocollant représentant un simple cercle rouge sur un arrière-plan transparent" \
  --json
```

Utilisez les mêmes options `--output-format` et `--background` avec
`openclaw infer image edit` lorsque vous partez d’un fichier d’entrée.
`--openai-background` reste disponible comme alias propre à OpenAI. Utilisez
`--quality low|medium|high|auto` pour contrôler la qualité et le coût d’OpenAI Images.
Utilisez `--openai-moderation low|auto` pour transmettre l’indication de modération d’OpenAI depuis
`image generate` ou `image edit`.

Pour les installations OAuth ChatGPT/Codex, conservez la même référence `openai/gpt-image-2`. Lorsqu’un
profil OAuth `openai` est configuré, OpenClaw résout le jeton d’accès OAuth stocké
et envoie les requêtes d’image via le backend Codex Responses ; il
n’essaie pas d’abord `OPENAI_API_KEY` et ne bascule pas silencieusement vers une clé d’API.
Configurez explicitement `models.providers.openai` avec une clé d’API, une URL de base
personnalisée ou un point de terminaison Azure lorsque vous souhaitez utiliser directement la route de l’API OpenAI Images.
Si ce point de terminaison d’image personnalisé se trouve sur une adresse de réseau local/privée de confiance,
définissez également `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork: true` ; OpenClaw
maintient les points de terminaison d’image privés/internes compatibles avec OpenAI bloqués en l’absence de cette
activation explicite.

Générer :

```
/tool image_generate model=openai/gpt-image-2 prompt="Une affiche de lancement soignée pour OpenClaw sur macOS" size=3840x2160 count=1
```

Générer un PNG transparent :

```
/tool image_generate model=openai/gpt-image-1.5 prompt="Un autocollant représentant un simple cercle rouge sur un arrière-plan transparent" outputFormat=png background=transparent
```

Modifier :

```
/tool image_generate model=openai/gpt-image-2 prompt="Conserver la forme de l’objet et remplacer le matériau par du verre translucide" image=/path/to/reference.png size=1024x1536
```

## Génération de vidéos

Le plugin `openai` inclus enregistre la génération de vidéos au moyen de
l’outil `video_generate`.

| Fonctionnalité     | Valeur                                                                             |
| ------------------ | ---------------------------------------------------------------------------------- |
| Modèle par défaut  | `openai/sora-2`                                                                 |
| Modes              | Texte vers vidéo, image vers vidéo, modification d’une seule vidéo                 |
| Entrées de référence | 1 image ou 1 vidéo                                                               |
| Remplacement des dimensions | Pris en charge pour le texte vers vidéo et l’image vers vidéo             |
| Format d’image     | Converti à la dimension prise en charge la plus proche, sans transmission brute    |
| Autres remplacements | `resolution`, `audio`, `watermark` ne sont pas pris en charge et sont ignorés avec un avertissement de l’outil |

Les requêtes image-vers-vidéo OpenAI utilisent `POST /v1/videos` avec une image
`input_reference`. Les modifications d’une seule vidéo utilisent `POST /v1/videos/edits` avec la
vidéo téléversée dans le champ `video`.

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: { primary: "openai/sora-2" },
    },
  },
}
```

<Note>
Consultez [Génération de vidéos](/fr/tools/video-generation) pour connaître les paramètres partagés de l’outil,
la sélection du fournisseur et le comportement de basculement.

Le fournisseur OpenAI déclare `supportsSize`, mais pas `supportsAspectRatio` ni
`supportsResolution`. La couche de normalisation partagée d’OpenClaw convertit un
`aspectRatio` demandé en l’`size` OpenAI correspondant le mieux avant que la
requête n’atteigne le fournisseur ; les requêtes de rapport d’aspect fonctionnent donc généralement malgré tout.
`resolution` ne dispose d’aucune solution de repli pour la taille et est supprimé, ce qui est signalé à l’appelant comme
`Ignored unsupported overrides for openai/<model>: resolution=<value>`.
</Note>

## Contribution à l’invite GPT-5

OpenClaw ajoute une contribution partagée à l’invite GPT-5 pour les modèles de la famille GPT-5 sur
le fournisseur `openai` (y compris les anciennes références Codex antérieures à la réparation, qui sont normalisées
en `openai/*`). Les autres fournisseurs qui proposent également des identifiants de modèles de la famille GPT-5,
tels qu’OpenRouter ou les routes opencode, ne reçoivent pas cette surcouche ; son activation dépend de
l’identifiant de fournisseur `openai`, et non du seul identifiant de modèle. Les anciens modèles GPT-4.x ne
la reçoivent jamais.

Le harnais natif du serveur d’application Codex ne reçoit pas le contrat de comportement relatif à la personnalité et à la
discipline d’utilisation des outils, ni la surcouche de style d’interaction convivial, par l’intermédiaire
des instructions du développeur ; le Codex natif conserve les comportements de base, de modèle et
de documentation du projet propres à Codex, et OpenClaw désactive la personnalité intégrée de Codex pour
les fils natifs afin que les fichiers de personnalité de l’espace de travail de l’agent restent la référence.
OpenClaw apporte uniquement le contexte d’exécution aux fils Codex natifs : distribution par
canal, outils dynamiques OpenClaw, délégation ACP, contexte de l’espace de travail et
Skills OpenClaw. Le texte d’orientation du Heartbeat issu de cette même contribution constitue
l’unique exception : les tours de Heartbeat Codex natifs le reçoivent bien, injecté sous forme
d’instructions de collaboration dédiées plutôt que par l’intermédiaire du point d’extension partagé
de contribution à l’invite.

La contribution GPT-5 ajoute un contrat de comportement balisé pour la persistance de la personnalité,
la sécurité d’exécution, la discipline d’utilisation des outils, la forme de la sortie, les vérifications
d’achèvement et la validation dans les invites correspondantes assemblées par OpenClaw. Le comportement
des réponses propres aux canaux et des messages silencieux reste défini dans l’invite système partagée
d’OpenClaw et dans la politique de distribution sortante. La couche de style d’interaction convivial est
distincte et configurable.

| Valeur                  | Effet                                      |
| ---------------------- | ------------------------------------------- |
| `"friendly"` (par défaut) | Active la couche de style d’interaction convivial |
| `"on"`                 | Alias de `"friendly"`                      |
| `"off"`                | Désactive uniquement la couche de style convivial       |

<Tabs>
  <Tab title="Configuration">
    ```json5
    {
      agents: {
        defaults: {
          promptOverlays: {
            gpt5: { personality: "friendly" },
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="CLI">
    ```bash
    openclaw config set agents.defaults.promptOverlays.gpt5.personality off
    ```
  </Tab>
</Tabs>

<Tip>
Les valeurs ne sont pas sensibles à la casse lors de l’exécution ; `"Off"` et `"off"` désactivent donc tous deux la
couche de style convivial.
</Tip>

<Note>
L’ancien paramètre `plugins.entries.openai.config.personality` est toujours lu comme
solution de repli de compatibilité lorsque le paramètre partagé
`agents.defaults.promptOverlays.gpt5.personality` n’est pas défini.
</Note>

## Voix et parole

<AccordionGroup>
  <Accordion title="Synthèse vocale (TTS)">
    Le Plugin intégré `openai` enregistre la synthèse vocale pour la
    surface `messages.tts`.

    | Paramètre      | Chemin de configuration                                            | Valeur par défaut                          |
    | ------------- | --------------------------------------------------------- | ----------------------------------- |
    | Modèle        | `messages.tts.providers.openai.model`                  | `gpt-4o-mini-tts`                |
    | Voix        | `messages.tts.providers.openai.speakerVoice`           | `coral`                          |
    | Vitesse        | `messages.tts.providers.openai.speed`                  | (non défini)                          |
    | Instructions | `messages.tts.providers.openai.instructions`           | (non défini, `gpt-4o-mini-tts` uniquement)  |
    | Format       | `messages.tts.providers.openai.responseFormat`         | `opus` pour les messages vocaux, `mp3` pour les fichiers |
    | Clé API      | `messages.tts.providers.openai.apiKey`                 | Utilise `OPENAI_API_KEY` comme solution de repli   |
    | URL de base     | `messages.tts.providers.openai.baseUrl`                | `https://api.openai.com/v1`      |
    | Corps supplémentaire   | `messages.tts.providers.openai.extraBody` / `extra_body` | (non défini)                        |

    Modèles disponibles : `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd`. Voix disponibles :
    `alloy`, `ash`, `ballad`, `cedar`, `coral`, `echo`, `fable`, `juniper`,
    `marin`, `onyx`, `nova`, `sage`, `shimmer`, `verse`.

    `extraBody` est fusionné dans le JSON de requête `/audio/speech` après les
    champs générés par OpenClaw ; utilisez-le donc pour les points de terminaison compatibles avec OpenAI qui nécessitent
    des clés supplémentaires telles que `lang`. Les clés de prototype sont ignorées.

    ```json5
    {
      messages: {
        tts: {
          providers: {
            openai: { model: "gpt-4o-mini-tts", speakerVoice: "coral" },
          },
        },
      },
    }
    ```

    <Note>
    Définissez `OPENAI_TTS_BASE_URL` pour remplacer l’URL de base de la TTS sans affecter
    le point de terminaison de l’API de chat. La TTS OpenAI et la voix Realtime sont toutes deux configurées
    à l’aide d’une clé API OpenAI Platform ; les installations utilisant uniquement OAuth peuvent toujours utiliser
    les modèles de chat reposant sur Codex, mais pas le retour vocal en direct d’OpenAI.
    </Note>

  </Accordion>

  <Accordion title="Reconnaissance vocale">
    Le Plugin intégré `openai` enregistre la reconnaissance vocale par lots par l’intermédiaire
    de la surface de transcription de compréhension des médias d’OpenClaw.

    - Modèle par défaut : `gpt-4o-transcribe`
    - Point de terminaison : REST OpenAI `/v1/audio/transcriptions`
    - Chemin d’entrée : téléversement multipart d’un fichier audio
    - Utilisé partout où la transcription audio entrante lit `tools.media.audio`,
      y compris les segments de canaux vocaux Discord et les pièces jointes audio des canaux

    Pour imposer OpenAI pour la transcription audio entrante :

    ```json5
    {
      tools: {
        media: {
          audio: {
            models: [
              {
                type: "provider",
                provider: "openai",
                model: "gpt-4o-transcribe",
              },
            ],
          },
        },
      },
    }
    ```

    Les indications de langue et d’invite sont transmises à OpenAI lorsqu’elles sont fournies par la
    configuration partagée des médias audio ou par la requête de transcription propre à l’appel.

  </Accordion>

  <Accordion title="Transcription en temps réel">
    Le Plugin intégré `openai` enregistre la transcription en temps réel pour le
    Plugin Voice Call.

    | Paramètre          | Chemin de configuration                                                          | Valeur par défaut |
    | ----------------- | ----------------------------------------------------------------------- | --------- |
    | Modèle            | `plugins.entries.voice-call.config.streaming.providers.openai.model` | `gpt-4o-transcribe` |
    | Langue         | `...openai.language`                                                 | (non défini) |
    | Invite           | `...openai.prompt`                                                   | (non défini) |
    | Durée du silence | `...openai.silenceDurationMs`                                        | `800`   |
    | Seuil VAD    | `...openai.vadThreshold`                                             | `0.5`   |
    | Authentification             | `...openai.apiKey`, `OPENAI_API_KEY` ou profil de clé API `openai`    | Clé API Platform requise |

    <Note>
    Utilise une connexion WebSocket à `wss://api.openai.com/v1/realtime` avec de l’audio
    G.711 loi μ (`g711_ulaw` / `audio/pcmu`). Pour un profil de clé API `openai`,
    le Gateway génère un secret client éphémère pour la transcription Realtime
    avant d’ouvrir le WebSocket. Ce fournisseur de diffusion en continu est destiné au chemin de transcription
    en temps réel de Voice Call ; la voix Discord enregistre actuellement de courts
    segments et utilise à la place le chemin de transcription par lots `tools.media.audio`.
    </Note>

  </Accordion>

  <Accordion title="Voix en temps réel">
    Le Plugin intégré `openai` enregistre la voix en temps réel pour le Plugin Voice Call.

    | Paramètre                               | Chemin de configuration                                                              | Valeur par défaut             |
    | --------------------------------------- | ---------------------------------------------------------------------------- | ---------------------- |
    | Modèle                                  | `plugins.entries.voice-call.config.realtime.providers.openai.model`     | `gpt-realtime-2.1`  |
    | Voix                                  | `...openai.voice`                                                       | `alloy`             |
    | Température (passerelle de déploiement Azure)  | `...openai.temperature`                                                 | `0.8`               |
    | Seuil VAD                          | `...openai.vadThreshold`                                                | `0.5`                |
    | Durée du silence                       | `...openai.silenceDurationMs`                                           | `500`                |
    | Remplissage du préfixe                         | `...openai.prefixPaddingMs`                                             | `300`                |
    | Effort de raisonnement                       | `...openai.reasoningEffort`                                             | (non défini)              |
    | Authentification                                   | Profil de clé API `openai`, `...openai.apiKey` ou `OPENAI_API_KEY` | Clé API OpenAI Platform requise |

    Voix Realtime intégrées disponibles pour `gpt-realtime-2.1` : `alloy`, `ash`,
    `ballad`, `coral`, `echo`, `sage`, `shimmer`, `verse`, `marin`, `cedar`.
    OpenAI recommande `marin` et `cedar` pour obtenir la meilleure qualité Realtime. Il
    s’agit d’un ensemble distinct des voix de synthèse vocale ci-dessus ; une voix réservée à la TTS,
    telle que `fable`, `nova` ou `onyx`, n’est pas valide pour les sessions Realtime.
    Définissez explicitement le modèle sur `gpt-realtime-2.1-mini` si vous préférez la
    variante Realtime 2.1 plus petite et moins coûteuse.

    <Note>
    **GPT-Live (à venir).** Les modèles duplex intégral `gpt-live-1` et
    `gpt-live-1-mini` d’OpenAI ont remplacé le mode vocal de ChatGPT en juillet 2026 ; l’
    API pour développeurs est en cours de déploiement auprès des organisations disposant d’un accès anticipé. OpenClaw
    reconnaît la famille de modèles, mais ne l’exécute pas encore : les sessions GPT-Live utilisent
    uniquement WebRTC, gèrent elles-mêmes l’alternance des tours de parole (sans VAD) et délèguent le travail de l’agent
    par l’intermédiaire d’un protocole d’événements de transfert que les transports en temps réel d’OpenClaw
    ne prennent pas encore en charge. La configuration d’un modèle `gpt-live-*` échoue de manière fermée avec
    des instructions concernant à la fois la passerelle WebSocket et les sessions Talk dans le navigateur, au lieu de
    connecter silencieusement l’audio sans accès à l’agent. L’accès à l’API est également contrôlé
    pour chaque organisation OpenAI pendant l’accès anticipé. Conservez `gpt-realtime-2.1` (la
    valeur par défaut) jusqu’à la prise en charge de GPT-Live.
    </Note>

    <Note>
    Les passerelles OpenAI en temps réel côté serveur utilisent le format de session WebSocket Realtime
    en disponibilité générale, qui n’accepte pas `session.temperature`. Les déploiements Azure OpenAI
    restent disponibles par l’intermédiaire de `azureEndpoint` et `azureDeployment` et
    conservent le format de session compatible avec les déploiements (y compris `temperature`).
    Prend en charge l’appel d’outils bidirectionnel et l’audio G.711 loi μ.
    </Note>

    <Note>
    La voix en temps réel est sélectionnée lors de la création de la session. OpenAI autorise la modification ultérieure de la plupart
    des champs de session, mais la voix ne peut plus être modifiée après que le
    modèle a émis de l’audio dans cette session. OpenClaw expose actuellement les
    identifiants de voix Realtime intégrés sous forme de chaînes.
    </Note>

    <Note>
    La fonction Talk de l’interface de contrôle utilise des sessions en temps réel OpenAI dans le navigateur, avec un secret client éphémère
    émis par le Gateway et un échange SDP WebRTC direct depuis le navigateur
    avec l’API Realtime d’OpenAI. Le Gateway émet ce secret client avec
    l’identifiant `openai` sélectionné. Les clés configurées, les profils de clé API et
    `OPENAI_API_KEY` sont prioritaires ; un profil OAuth `openai` ou une connexion
    Codex externe sert de solution de repli. Les relais Gateway et les ponts WebSocket en temps réel
    du backend Voice Call utilisent le même ordre d’identifiants pour les points de terminaison OpenAI natifs.
    La vérification en direct par les responsables de maintenance est disponible avec
    `OPENAI_API_KEY=... GEMINI_API_KEY=... node --import tsx scripts/dev/realtime-talk-live-smoke.ts` ;
    les étapes OpenAI vérifient à la fois le pont WebSocket du backend et l’échange SDP
    WebRTC du navigateur sans journaliser les secrets.
    Transmettez `--openai-only` pour exécuter ces deux étapes sans identifiants Google.
    </Note>

  </Accordion>
</AccordionGroup>

## Points de terminaison Azure OpenAI

Le fournisseur `openai` intégré peut cibler une ressource Azure OpenAI pour la génération
d’images en remplaçant l’URL de base. Sur le chemin de génération d’images, OpenClaw
détecte les noms d’hôte Azure dans `models.providers.openai.baseUrl` et adopte
automatiquement le format de requête d’Azure.

<Note>
La voix en temps réel utilise un chemin de configuration distinct
(`plugins.entries.voice-call.config.realtime.providers.openai.azureEndpoint`)
et n’est pas affectée par `models.providers.openai.baseUrl`. Consultez l’accordéon **Voix en
temps réel** sous [Voix et parole](#voice-and-speech) pour ses paramètres Azure.
</Note>

Utilisez Azure OpenAI dans les cas suivants :

- Vous disposez déjà d’un abonnement Azure OpenAI, d’un quota ou d’un contrat
  d’entreprise
- Vous avez besoin de la résidence régionale des données ou des contrôles de conformité fournis par Azure
- Vous souhaitez conserver le trafic au sein d’un locataire Azure existant

### Configuration

Pour la génération d’images Azure via le fournisseur `openai` intégré, faites pointer
`models.providers.openai.baseUrl` vers votre ressource Azure et définissez `apiKey` sur
la clé Azure OpenAI (et non une clé OpenAI Platform) :

```json5
{
  models: {
    providers: {
      openai: {
        baseUrl: "https://<your-resource>.openai.azure.com",
        apiKey: "<azure-openai-api-key>",
      },
    },
  },
}
```

OpenClaw reconnaît les suffixes d’hôte Azure suivants pour la route de génération
d’images Azure :

- `*.openai.azure.com`
- `*.services.ai.azure.com`
- `*.cognitiveservices.azure.com`

Pour les requêtes de génération d’images sur un hôte Azure reconnu, OpenClaw :

- Envoie l’en-tête `api-key` au lieu de `Authorization: Bearer`
- Utilise des chemins propres au déploiement (`/openai/deployments/{deployment}/...`)
- Ajoute `?api-version=...` à chaque requête
- Utilise un délai d’expiration de requête par défaut de 600s pour les appels de génération d’images Azure.
  Les valeurs `timeoutMs` propres à chaque appel remplacent toujours cette valeur par défaut.

Les autres URL de base (OpenAI public, proxys compatibles avec OpenAI) conservent le format
standard des requêtes d’images OpenAI.

<Note>
Le routage Azure du chemin de génération d’images du fournisseur `openai` nécessite
OpenClaw 2026.4.22 ou une version ultérieure. Les versions antérieures traitent toute valeur
`openai.baseUrl` personnalisée comme le point de terminaison OpenAI public et échouent avec les déploiements
d’images Azure.
</Note>

### Version de l’API

Définissez `AZURE_OPENAI_API_VERSION` pour fixer une version préliminaire ou GA spécifique d’Azure
pour le chemin de génération d’images Azure :

```bash
export AZURE_OPENAI_API_VERSION="2024-12-01-preview"
```

La valeur par défaut est `2024-12-01-preview` lorsque la variable n’est pas définie.

### Les noms de modèles sont des noms de déploiements

Azure OpenAI associe les modèles à des déploiements. Pour les requêtes de génération d’images Azure
routées via le fournisseur `openai` intégré, le champ `model` dans OpenClaw
doit correspondre au **nom du déploiement Azure** que vous avez configuré dans le portail Azure, et non
à l’identifiant public du modèle OpenAI.

Si vous créez un déploiement nommé `gpt-image-2-prod` qui fournit `gpt-image-2` :

```
/tool image_generate model=openai/gpt-image-2-prod prompt="Une affiche épurée" size=1024x1024 count=1
```

La même règle concernant le nom du déploiement s’applique à tout appel de génération d’images routé
via le fournisseur `openai` intégré.

### Disponibilité régionale

La génération d’images Azure n’est actuellement disponible que dans un sous-ensemble de régions
(par exemple `eastus2`, `swedencentral`, `polandcentral`, `westus3`,
`uaenorth`). Consultez la liste actuelle des régions de Microsoft avant de créer un
déploiement et vérifiez que le modèle concerné est proposé dans votre région.

### Différences entre les paramètres

Azure OpenAI et OpenAI public n’acceptent pas toujours les mêmes paramètres d’image.
Azure peut refuser des options autorisées par OpenAI public (par exemple certaines
valeurs `background` sur `gpt-image-2`) ou ne les proposer que pour des versions
de modèle spécifiques. Ces différences proviennent d’Azure et du modèle sous-jacent, et non
d’OpenClaw. Si une requête Azure échoue avec une erreur de validation, consultez dans le
portail Azure l’ensemble de paramètres pris en charge par votre déploiement et votre version
d’API spécifiques.

<Note>
Azure OpenAI utilise le transport natif et le comportement de compatibilité, mais ne reçoit pas
les en-têtes d’attribution masqués d’OpenClaw — consultez l’accordéon **Routes natives et compatibles
avec OpenAI** sous [Configuration avancée](#advanced-configuration).

Pour le trafic de discussion ou Responses sur Azure (au-delà de la génération d’images), utilisez le
processus d’intégration ou une configuration de fournisseur Azure dédiée ; `openai.baseUrl` seul
n’adopte pas le format d’API et d’authentification Azure. Un fournisseur
`azure-openai-responses/*` distinct existe ; consultez l’accordéon Compaction côté
serveur ci-dessous.
</Note>

## Configuration avancée

Les exemples `params` propres à chaque modèle ci-dessous définissent la requête du fournisseur
intégré d’OpenClaw. Leur configuration constitue un comportement de requête explicite ; une route
`auto` par ailleurs admissible reste donc sur OpenClaw au lieu de sélectionner implicitement Codex. Le
harnachement natif du serveur d’application Codex gère son propre transport et ses propres paramètres de requête ;
une valeur `agentRuntime.id: "codex"` explicite échoue de manière fermée lorsque la route effective n’est pas déclarée
compatible avec Codex.

<AccordionGroup>
  <Accordion title="Transport (WebSocket ou SSE)">
    OpenClaw utilise WebSocket en priorité avec SSE comme solution de repli (`"auto"`) pour `openai/*`.

    En mode `"auto"`, OpenClaw :
    - Réessaie une fois après un échec précoce de WebSocket avant de se rabattre sur SSE
    - Après un échec, marque WebSocket comme dégradé pendant 60 secondes et utilise SSE
      pendant la période de récupération
    - Ajoute des en-têtes stables d’identité de session et de tour pour les nouvelles tentatives et
      les reconnexions
    - Normalise les compteurs d’utilisation (`input_tokens` / `prompt_tokens`) entre
      les variantes de transport

    | Valeur                | Comportement                          |
    | ---------------------- | ------------------------------------ |
    | `"auto"` (par défaut)   | WebSocket en priorité, SSE en solution de repli     |
    | `"sse"`              | Forcer uniquement SSE                    |
    | `"websocket"`        | Forcer uniquement WebSocket              |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": {
              params: { transport: "auto" },
            },
          },
        },
      },
    }
    ```

    Documentation OpenAI associée :
    - [API Realtime avec WebSocket](https://platform.openai.com/docs/guides/realtime-websocket)
    - [Réponses d’API en flux continu (SSE)](https://platform.openai.com/docs/guides/streaming-responses)

  </Accordion>

  <Accordion title="Mode rapide">
    OpenClaw expose un commutateur de mode rapide partagé pour `openai/*` :

    - **Discussion/interface utilisateur :** `/fast status|auto|on|off`
    - **Configuration :** `agents.defaults.models["<provider>/<model>"].params.fastMode`

    Lorsqu’il est activé, OpenClaw associe le mode rapide au traitement prioritaire d’OpenAI
    (`service_tier = "priority"`). Les valeurs `service_tier` existantes sont
    conservées, et le mode rapide ne réécrit ni `reasoning` ni
    `text.verbosity`. `fastMode: "auto"` lance rapidement les nouveaux appels au modèle jusqu’au
    seuil automatique, puis lance les appels ultérieurs de nouvelle tentative, de solution de repli, de résultat
    d’outil ou de continuation sans le mode rapide. Le seuil est de 60 secondes par défaut ;
    définissez `params.fastAutoOnSeconds` sur le modèle actif pour le modifier.

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": { params: { fastMode: "auto", fastAutoOnSeconds: 30 } },
          },
        },
      },
    }
    ```

    <Note>
    Les remplacements propres à la session sont prioritaires sur la configuration. La suppression du remplacement de session dans
    l’interface Sessions rétablit la valeur par défaut configurée pour la session.
    </Note>

  </Accordion>

  <Accordion title="Traitement prioritaire (service_tier)">
    L’API d’OpenAI expose le traitement prioritaire via `service_tier`. Définissez-le pour chaque
    modèle dans OpenClaw :

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "openai/gpt-5.5": { params: { serviceTier: "priority" } },
          },
        },
      },
    }
    ```

    Valeurs prises en charge : `auto`, `default`, `flex`, `priority`.

    <Warning>
    `serviceTier` est transmis uniquement aux points de terminaison OpenAI natifs
    (`api.openai.com`) et aux points de terminaison Codex natifs (`chatgpt.com/backend-api`).
    Si vous routez l’un ou l’autre fournisseur via un proxy, OpenClaw laisse
    `service_tier` inchangé.
    </Warning>

  </Accordion>

  <Accordion title="Compaction côté serveur (API Responses)">
    Pour les modèles Responses OpenAI directs (`openai/*` sur `api.openai.com`), l’enveloppe
    de flux OpenClaw du Plugin OpenAI active automatiquement la Compaction côté
    serveur :

    - Force `store: true` (sauf si la compatibilité du modèle définit `supportsStore: false`)
    - Injecte `context_management: [{ type: "compaction", compact_threshold: ... }]`
    - Valeur par défaut de `compact_threshold` : 70 % de `contextWindow` (ou `80000` lorsque
      cette valeur n’est pas disponible)

    Cela s’applique au chemin d’exécution intégré d’OpenClaw et aux hooks du fournisseur OpenAI
    utilisés par les exécutions intégrées. Le harnachement natif du serveur d’application Codex gère
    son propre contexte via Codex et n’est pas affecté par ce paramètre.

    <Tabs>
      <Tab title="Activer explicitement">
        Utile pour les points de terminaison compatibles, comme Azure OpenAI Responses :

        ```json5
        {
          agents: {
            defaults: {
              models: {
                "azure-openai-responses/gpt-5.5": {
                  params: { responsesServerCompaction: true },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="Seuil personnalisé">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.5": {
                  params: {
                    responsesServerCompaction: true,
                    responsesCompactThreshold: 120000,
                  },
                },
              },
            },
          },
        }
        ```
      </Tab>
      <Tab title="Désactiver">
        ```json5
        {
          agents: {
            defaults: {
              models: {
                "openai/gpt-5.5": {
                  params: { responsesServerCompaction: false },
                },
              },
            },
          },
        }
        ```
      </Tab>
    </Tabs>

    <Note>
    `responsesServerCompaction` contrôle uniquement l’injection de `context_management`.
    Les modèles Responses OpenAI directs forcent toujours `store: true`, sauf si la compatibilité
    définit `supportsStore: false`.
    </Note>

  </Accordion>

  <Accordion title="Mode GPT strictement agentique">
    Pour les modèles de la famille GPT-5 du fournisseur `openai` exécutés par l’intermédiaire de l’environnement
    d’exécution intégré d’OpenClaw, OpenClaw utilise déjà par défaut un contrat d’exécution plus strict appelé
    `strict-agentic`. Il s’active automatiquement chaque fois que le fournisseur résolu est
    `openai` et que l’identifiant du modèle correspond à la famille GPT-5, sauf si la configuration
    le désactive explicitement :

    ```json5
    {
      agents: {
        defaults: {
          embeddedAgent: { executionContract: "default" },
        },
      },
    }
    ```

    Définir explicitement `"strict-agentic"` est sans effet sur une voie prise en charge (il
    s'agit déjà de la valeur par défaut) et reste inopérant pour les paires fournisseur/modèle non prises en charge.

    Lorsque `strict-agentic` est actif, OpenClaw :
    - Active automatiquement `update_plan` pour les travaux conséquents
    - Réessaie les tours structurellement vides ou contenant uniquement du raisonnement avec une continuation
      produisant une réponse visible
    - Utilise des événements de plan explicites du harnais lorsque le harnais sélectionné
      les fournit

    OpenClaw ne classe pas le texte de l'assistant pour déterminer si un tour est un
    plan, une mise à jour de progression ou une réponse finale.

    <Note>
    Ce contrat réside entièrement dans l'exécuteur d'agent intégré d'OpenClaw. Il ne
    s'applique pas au harnais app-server natif de Codex, qui gère lui-même
    le comportement des tours et des plans ; la sélection du harnais importe davantage que le
    paramètre du contrat d'exécution pour les exécutions Codex natives.
    </Note>

  </Accordion>

  <Accordion title="Routes natives et compatibles avec OpenAI">
    OpenClaw traite les points de terminaison directs OpenAI, Codex et Azure OpenAI
    différemment des proxys génériques `/v1` compatibles avec OpenAI :

    **Routes natives** (`openai/*`, Azure OpenAI) :
    - Conservent `reasoning: { effort: "none" }` uniquement pour les modèles qui prennent en charge l'effort
      OpenAI `none`
    - Omettent le raisonnement désactivé pour les modèles ou proxys qui rejettent
      `reasoning.effort: "none"`
    - Utilisent par défaut le mode strict pour les schémas d'outils
    - Joignent des en-têtes d'attribution masqués uniquement sur les hôtes natifs vérifiés (Azure
      OpenAI ne reçoit pas ces en-têtes, même s'il s'agit d'une route native)
    - Conservent la mise en forme des requêtes propre à OpenAI (`service_tier`, `store`,
      compatibilité du raisonnement, indications de cache des prompts)

    **Routes proxy/compatibles :**
    - Utilisent un comportement de compatibilité plus souple
    - Suppriment le champ Completions `store` des charges utiles `openai-completions` non natives
    - Acceptent le JSON avancé `params.extra_body`/`params.extraBody` transmis tel quel
      pour les proxys Completions compatibles avec OpenAI
    - Acceptent `params.chat_template_kwargs` pour les proxys Completions compatibles avec OpenAI
      tels que vLLM
    - N'imposent ni les schémas d'outils stricts ni les en-têtes réservés aux routes natives

  </Accordion>
</AccordionGroup>

## Voir aussi

<CardGroup cols={2}>
  <Card title="Sélection du modèle" href="/fr/concepts/model-providers" icon="layers">
    Choix des fournisseurs, des références de modèles et du comportement de basculement.
  </Card>
  <Card title="Génération d'images" href="/fr/tools/image-generation" icon="image">
    Paramètres partagés de l'outil d'image et sélection du fournisseur.
  </Card>
  <Card title="Génération de vidéos" href="/fr/tools/video-generation" icon="video">
    Paramètres partagés de l'outil vidéo et sélection du fournisseur.
  </Card>
  <Card title="OAuth et authentification" href="/fr/gateway/authentication" icon="key">
    Détails de l'authentification et règles de réutilisation des identifiants.
  </Card>
</CardGroup>
