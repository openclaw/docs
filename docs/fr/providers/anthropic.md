---
read_when:
    - Vous voulez utiliser les modèles Anthropic dans OpenClaw
summary: Utiliser Anthropic Claude via des clés d’API ou Claude CLI dans OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-06-28T20:44:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 48a2792e464175b3ebe6acd92606c20231fd31940f56e2432bb45657eb0a68d7
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic développe la famille de modèles **Claude**. OpenClaw prend en charge deux modes d’authentification :

- **Clé API** — accès direct à l’API Anthropic avec facturation à l’usage (modèles `anthropic/*`)
- **Claude CLI** — réutilisation d’une connexion Claude Code existante sur le même hôte

<Warning>
Le backend Claude CLI d’OpenClaw exécute la CLI Claude Code installée en
mode d’impression non interactif. La documentation Claude Code actuelle
d’Anthropic décrit `claude -p` comme un usage Agent SDK/programmatique. La mise
à jour du support Anthropic du 15 juin 2026 a suspendu le changement annoncé de
facturation de l’Agent SDK. Pour l’instant, Anthropic indique que l’utilisation
de Claude Agent SDK, de `claude -p` et des applications tierces est toujours
décomptée des limites d’utilisation de l’abonnement. Le crédit mensuel Agent SDK
annoncé précédemment n’est pas disponible pendant qu’Anthropic révise ce plan.

Claude Code interactif est toujours décompté des limites du plan Claude
connecté. L’authentification par clé API reste une facturation API directe à
l’usage. Pour les hôtes Gateway de longue durée, l’automatisation partagée et
des dépenses de production prévisibles, utilisez une clé API Anthropic.

Consultez les articles de support Anthropic actuels avant de vous appuyer sur
le comportement de facturation de l’abonnement :

- [Référence de la CLI Claude Code](https://code.claude.com/docs/en/cli-usage)
- [Utiliser le Claude Agent SDK avec votre plan Claude](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
- [Utiliser Claude Code avec votre plan Pro ou Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
- [Utiliser Claude Code avec votre plan Team ou Enterprise](https://support.claude.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan)
- [Gérer les coûts de Claude Code](https://code.claude.com/docs/en/costs)

</Warning>

## Premiers pas

<Tabs>
  <Tab title="API key">
    **Idéal pour :** l’accès API standard et la facturation à l’usage.

    <Steps>
      <Step title="Get your API key">
        Créez une clé API dans l’[Anthropic Console](https://console.anthropic.com/).
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard
        # choose: Anthropic API key
        ```

        Ou transmettez directement la clé :

        ```bash
        openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
        ```
      </Step>
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    ### Exemple de configuration

    ```json5
    {
      env: { ANTHROPIC_API_KEY: "example-anthropic-key-not-real" },
      agents: { defaults: { model: { primary: "anthropic/claude-opus-4-8" } } },
    }
    ```

  </Tab>

  <Tab title="Claude CLI">
    **Idéal pour :** réutiliser une connexion Claude CLI existante sans clé API distincte.

    <Steps>
      <Step title="Ensure Claude CLI is installed and logged in">
        Vérifiez avec :

        ```bash
        claude --version
        ```
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard
        # choose: Claude CLI
        ```

        OpenClaw détecte et réutilise les identifiants Claude CLI existants.
      </Step>
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    Les détails de configuration et d’exécution du backend Claude CLI se trouvent dans [Backends CLI](/fr/gateway/cli-backends).
    </Note>

    <Warning>
    La réutilisation de Claude CLI suppose que le processus OpenClaw s’exécute
    sur le même hôte que la connexion Claude CLI. Les installations Docker
    peuvent conserver un répertoire personnel de conteneur et s’y connecter à
    Claude Code ; voir
    [Backend Claude CLI dans Docker](/fr/install/docker#claude-cli-backend-in-docker).
    Les autres installations de conteneur, comme [Podman](/fr/install/podman), ne
    montent pas le `~/.claude` de l’hôte dans la configuration ou l’exécution ;
    utilisez une clé API Anthropic dans ce cas, ou choisissez un fournisseur
    avec OAuth géré par OpenClaw, comme
    [OpenAI Codex](/fr/providers/openai).
    </Warning>

    ### Exemple de configuration

    Préférez la référence canonique de modèle Anthropic avec une surcharge d’exécution CLI :

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-8" },
          models: {
            "anthropic/claude-opus-4-8": {
              agentRuntime: { id: "claude-cli" },
            },
          },
        },
      },
    }
    ```

    Les références de modèles héritées `claude-cli/claude-opus-4-7`
    fonctionnent toujours par compatibilité, mais les nouvelles configurations
    doivent conserver la sélection fournisseur/modèle sous la forme
    `anthropic/*` et placer le backend d’exécution dans la politique d’exécution
    fournisseur/modèle.

    ### Facturation et `claude -p`

    OpenClaw utilise le chemin non interactif `claude -p` de Claude Code pour
    les exécutions Claude CLI. Anthropic traite actuellement ce chemin comme un
    usage Agent SDK/programmatique :

    - La mise à jour du support Anthropic du 15 juin 2026 a suspendu le plan de
      crédit Agent SDK séparé annoncé précédemment.
    - Pour l’instant, l’utilisation de Claude Agent SDK, de `claude -p` et des
      applications tierces sous abonnement est toujours décomptée des limites
      d’utilisation de l’abonnement connecté.
    - Le crédit mensuel Agent SDK annoncé précédemment n’est pas disponible
      pendant qu’Anthropic révise ce plan.
    - Les connexions Console/clé API utilisent la facturation API à l’usage et
      ne reçoivent pas le crédit Agent SDK de l’abonnement.

    Consultez l’[article sur le plan Agent SDK](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
    d’Anthropic pour l’avis de suspension, ainsi que les articles sur les plans
    Claude Code pour le comportement des abonnements
    [Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
    et
    [Team/Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan).

    Anthropic peut modifier la facturation et le comportement des limites de
    débit de Claude Code sans version OpenClaw. Vérifiez `claude auth status`,
    `/status` et la documentation liée d’Anthropic lorsque la prévisibilité de
    la facturation est importante.

    <Tip>
    Pour l’automatisation de production partagée, utilisez une clé API
    Anthropic plutôt que Claude CLI. OpenClaw prend aussi en charge des options
    de type abonnement avec
    [OpenAI Codex](/fr/providers/openai), [Qwen Cloud](/fr/providers/qwen),
    [MiniMax](/fr/providers/minimax) et [Z.AI / GLM](/fr/providers/zai).
    </Tip>

  </Tab>
</Tabs>

## Valeurs par défaut de raisonnement (Claude Fable 5, 4.8 et 4.6)

`anthropic/claude-fable-5` utilise toujours le raisonnement adaptatif et adopte
par défaut un effort `high`. Comme Anthropic n’autorise pas la désactivation du
raisonnement pour ce modèle, `/think off` et `/think minimal` utilisent un
effort `low`. OpenClaw omet également les valeurs de température personnalisées
pour les requêtes Fable 5.

Claude Opus 4.8 conserve le raisonnement désactivé par défaut dans OpenClaw. Lorsque vous activez explicitement le raisonnement adaptatif avec `/think high|xhigh|max`, OpenClaw envoie les valeurs d’effort Opus 4.8 d’Anthropic ; les modèles Claude 4.6 utilisent `adaptive` par défaut.

Remplacez ce réglage par message avec `/think:<level>` ou dans les paramètres du modèle :

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-8": {
          params: { thinking: "high" },
        },
      },
    },
  },
}
```

<Note>
Documentation Anthropic associée :
- [Raisonnement adaptatif](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [Raisonnement étendu](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

</Note>

## Mise en cache des prompts

OpenClaw prend en charge la fonctionnalité de mise en cache des prompts d’Anthropic pour l’authentification par clé API.

| Valeur              | Durée du cache | Description                                      |
| ------------------- | -------------- | ------------------------------------------------ |
| `"short"` (default) | 5 minutes      | Appliqué automatiquement pour l’auth par clé API |
| `"long"`            | 1 heure        | Cache étendu                                    |
| `"none"`            | Pas de cache   | Désactive la mise en cache des prompts           |

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { cacheRetention: "long" },
        },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Per-agent cache overrides">
    Utilisez les paramètres au niveau du modèle comme base, puis remplacez-les pour des agents précis via `agents.list[].params` :

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": {
              params: { cacheRetention: "long" },
            },
          },
        },
        list: [
          { id: "research", default: true },
          { id: "alerts", params: { cacheRetention: "none" } },
        ],
      },
    }
    ```

    Ordre de fusion de la configuration :

    1. `agents.defaults.models["provider/model"].params`
    2. `agents.list[].params` (`id` correspondant, remplacement par clé)

    Cela permet à un agent de conserver un cache longue durée tandis qu’un autre agent sur le même modèle désactive la mise en cache pour un trafic en rafales ou peu réutilisé.

  </Accordion>

  <Accordion title="Bedrock Claude notes">
    - Les modèles Anthropic Claude sur Bedrock (`amazon-bedrock/*anthropic.claude*`) acceptent le passage direct de `cacheRetention` lorsqu’il est configuré.
    - Les modèles Bedrock non Anthropic sont forcés à `cacheRetention: "none"` à l’exécution.
    - Les valeurs par défaut intelligentes de clé API initialisent aussi `cacheRetention: "short"` pour les références Claude-sur-Bedrock lorsqu’aucune valeur explicite n’est définie.

  </Accordion>
</AccordionGroup>

## Configuration avancée

<AccordionGroup>
  <Accordion title="Fast mode">
    Le bouton partagé `/fast` d’OpenClaw prend en charge le trafic Anthropic direct (clé API et OAuth vers `api.anthropic.com`).

    | Commande | Correspond à |
    |---------|---------|
    | `/fast on` | `service_tier: "auto"` |
    | `/fast off` | `service_tier: "standard_only"` |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-sonnet-4-6": {
              params: { fastMode: true },
            },
          },
        },
      },
    }
    ```

    <Note>
    - Injecté uniquement pour les requêtes directes vers `api.anthropic.com`. Les routes proxy laissent `service_tier` inchangé.
    - Les paramètres explicites `serviceTier` ou `service_tier` remplacent `/fast` lorsque les deux sont définis.
    - Sur les comptes sans capacité Priority Tier, `service_tier: "auto"` peut être résolu en `standard`.

    </Note>

  </Accordion>

  <Accordion title="Media understanding (image and PDF)">
    Le Plugin Anthropic groupé enregistre la compréhension des images et des PDF.
    OpenClaw résout automatiquement les capacités multimédias à partir de
    l’authentification Anthropic configurée — aucune configuration
    supplémentaire n’est nécessaire.

    | Propriété       | Valeur                |
    | --------------- | --------------------- |
    | Modèle par défaut | `claude-opus-4-8`   |
    | Entrée prise en charge | Images, documents PDF |

    Lorsqu’une image ou un PDF est joint à une conversation, OpenClaw l’achemine
    automatiquement via le fournisseur de compréhension multimédia Anthropic.

  </Accordion>

  <Accordion title="1M context window">
    La fenêtre de contexte 1M d’Anthropic est disponible sur les modèles Claude 4.x
    compatibles GA comme Opus 4.8, Opus 4.7, Opus 4.6 et Sonnet 4.6. OpenClaw
    dimensionne automatiquement ces modèles à 1M :

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-opus-4-6": {},
          },
        },
      },
    }
    ```

    Les anciennes configurations peuvent conserver `params.context1m: true`,
    mais OpenClaw n’envoie plus l’en-tête bêta retiré
    `context-1m-2025-08-07`. Les anciennes entrées de configuration
    `anthropicBeta` avec cette valeur sont ignorées lors de la résolution des
    en-têtes de requête, et les anciens modèles Claude non pris en charge
    restent sur leur fenêtre de contexte normale.

    `params.context1m: true` s’applique également au backend Claude CLI
    (`claude-cli/*`) pour les modèles Opus et Sonnet admissibles compatibles GA,
    ce qui préserve la fenêtre de contexte d’exécution de ces sessions CLI pour
    correspondre au comportement de l’API directe.

    <Warning>
    Nécessite un accès long contexte sur votre identifiant Anthropic. L’authentification OAuth/jeton d’abonnement conserve ses en-têtes bêta Anthropic requis, mais OpenClaw retire l’en-tête bêta 1M obsolète s’il reste dans une ancienne configuration.
    </Warning>

  </Accordion>

  <Accordion title="Contexte 1M de Claude Opus 4.8">
    `anthropic/claude-opus-4-8` et sa variante `claude-cli` disposent par défaut d'une fenêtre de contexte
    de 1M — pas besoin de `params.context1m: true`.
  </Accordion>
</AccordionGroup>

## Dépannage

<AccordionGroup>
  <Accordion title="Erreurs 401 / jeton soudainement invalide">
    L'authentification par jeton Anthropic expire et peut être révoquée. Pour les nouvelles configurations, utilisez plutôt une clé API Anthropic.
  </Accordion>

  <Accordion title='Aucune clé API trouvée pour le fournisseur "anthropic"'>
    L'authentification Anthropic est **propre à chaque agent** — les nouveaux agents n'héritent pas des clés de l'agent principal. Relancez l'intégration pour cet agent (ou configurez une clé API sur l'hôte Gateway), puis vérifiez avec `openclaw models status`.
  </Accordion>

  <Accordion title='Aucun identifiant trouvé pour le profil "anthropic:default"'>
    Exécutez `openclaw models status` pour voir quel profil d'authentification est actif. Relancez l'intégration, ou configurez une clé API pour ce chemin de profil.
  </Accordion>

  <Accordion title="Aucun profil d'authentification disponible (tous en période de récupération)">
    Vérifiez `auth.unusableProfiles` avec `openclaw models status --json`. Les périodes de récupération dues aux limites de débit Anthropic peuvent être propres au modèle, donc un modèle Anthropic frère peut encore être utilisable. Ajoutez un autre profil Anthropic ou attendez la fin de la période de récupération.
  </Accordion>
</AccordionGroup>

<Note>
Aide supplémentaire : [Dépannage](/fr/help/troubleshooting) et [FAQ](/fr/help/faq).
</Note>

## Associé

<CardGroup cols={2}>
  <Card title="Sélection du modèle" href="/fr/concepts/model-providers" icon="layers">
    Choix des fournisseurs, des références de modèles et du comportement de basculement.
  </Card>
  <Card title="Backends CLI" href="/fr/gateway/cli-backends" icon="terminal">
    Configuration du backend Claude CLI et détails d'exécution.
  </Card>
  <Card title="Mise en cache des prompts" href="/fr/reference/prompt-caching" icon="database">
    Fonctionnement de la mise en cache des prompts entre fournisseurs.
  </Card>
  <Card title="OAuth et authentification" href="/fr/gateway/authentication" icon="key">
    Détails d'authentification et règles de réutilisation des identifiants.
  </Card>
</CardGroup>
