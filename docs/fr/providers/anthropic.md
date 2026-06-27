---
read_when:
    - Vous souhaitez utiliser les modèles Anthropic dans OpenClaw
summary: Utiliser Anthropic Claude via des clés API ou la CLI Claude dans OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-06-27T18:02:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 299bb8661bb894c57ca7a60f350494d22f6b726061ffcb70df053c40a3f842b0
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic développe la famille de modèles **Claude**. OpenClaw prend en charge deux modes d’authentification :

- **Clé API** — accès direct à l’API Anthropic avec facturation à l’usage (modèles `anthropic/*`)
- **Claude CLI** — réutiliser une connexion Claude Code existante sur le même hôte

<Warning>
Le backend Claude CLI d’OpenClaw exécute la CLI Claude Code installée en mode
d’impression non interactif. La documentation actuelle de Claude Code d’Anthropic décrit
`claude -p` comme une utilisation Agent SDK/programmatique. À partir du 15 juin 2026, Anthropic
indique que l’utilisation de `claude -p` avec un abonnement n’est plus décomptée des limites normales du forfait
Claude ; elle utilise d’abord un crédit mensuel Agent SDK séparé, puis les
crédits d’usage aux tarifs API standard lorsque ces crédits sont activés.

Claude Code interactif continue d’être décompté des limites du forfait Claude connecté. L’authentification par clé API reste une facturation directe d’API à l’usage. Pour les hôtes Gateway de longue durée,
l’automatisation partagée et des dépenses de production prévisibles, utilisez une clé API Anthropic.

Documentation publique actuelle d’Anthropic :

- [Référence de la CLI Claude Code](https://code.claude.com/docs/en/cli-usage)
- [Utiliser le Claude Agent SDK avec votre forfait Claude](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
- [Utiliser Claude Code avec votre forfait Pro ou Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
- [Utiliser Claude Code avec votre forfait Team ou Enterprise](https://support.claude.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan)
- [Gérer les coûts de Claude Code](https://code.claude.com/docs/en/costs)

</Warning>

## Premiers pas

<Tabs>
  <Tab title="Clé API">
    **Idéal pour :** l’accès API standard et la facturation à l’usage.

    <Steps>
      <Step title="Obtenir votre clé API">
        Créez une clé API dans l’[Anthropic Console](https://console.anthropic.com/).
      </Step>
      <Step title="Exécuter l’onboarding">
        ```bash
        openclaw onboard
        # choose: Anthropic API key
        ```

        Ou transmettez directement la clé :

        ```bash
        openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
        ```
      </Step>
      <Step title="Vérifier que le modèle est disponible">
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
      <Step title="Vérifier que Claude CLI est installé et connecté">
        Vérifiez avec :

        ```bash
        claude --version
        ```
      </Step>
      <Step title="Exécuter l’onboarding">
        ```bash
        openclaw onboard
        # choose: Claude CLI
        ```

        OpenClaw détecte et réutilise les identifiants Claude CLI existants.
      </Step>
      <Step title="Vérifier que le modèle est disponible">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    Les détails de configuration et d’exécution du backend Claude CLI se trouvent dans [Backends CLI](/fr/gateway/cli-backends).
    </Note>

    <Warning>
    La réutilisation de Claude CLI suppose que le processus OpenClaw s’exécute sur le même hôte que la
    connexion Claude CLI. Les installations Docker peuvent conserver le répertoire personnel d’un conteneur et s’y connecter à
    Claude Code ; consultez
    [Backend Claude CLI dans Docker](/fr/install/docker#claude-cli-backend-in-docker).
    Les autres installations de conteneur, comme [Podman](/fr/install/podman), ne montent pas le
    `~/.claude` de l’hôte dans la configuration ou l’exécution ; utilisez une clé API Anthropic dans ce cas, ou choisissez
    un fournisseur avec OAuth géré par OpenClaw, comme
    [OpenAI Codex](/fr/providers/openai).
    </Warning>

    ### Exemple de configuration

    Préférez la référence de modèle Anthropic canonique avec une surcharge d’exécution CLI :

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

    Les anciennes références de modèle `claude-cli/claude-opus-4-7` fonctionnent encore pour
    compatibilité, mais les nouvelles configurations doivent conserver la sélection fournisseur/modèle sous
    `anthropic/*` et placer le backend d’exécution dans la politique d’exécution fournisseur/modèle.

    ### Facturation et `claude -p`

    OpenClaw utilise le chemin non interactif `claude -p` de Claude Code pour les exécutions Claude CLI.
    Anthropic traite actuellement ce chemin comme une utilisation Agent SDK/programmatique :

    - Jusqu’au 15 juin 2026, la gestion des abonnements suit les règles Claude Code actives d’Anthropic
      pour le compte connecté.
    - À partir du 15 juin 2026, l’utilisation de `claude -p` avec un abonnement est décomptée
      d’abord du crédit mensuel Agent SDK de l’utilisateur, puis des crédits d’usage aux tarifs
      API standard si les crédits d’usage sont activés.
    - Les connexions Console/clé API utilisent la facturation API à l’usage et ne reçoivent pas
      le crédit Agent SDK d’abonnement.

    Anthropic peut modifier la facturation et le comportement de limite de débit de Claude Code sans
    version OpenClaw. Vérifiez `claude auth status`, `/status` et
    la documentation liée d’Anthropic lorsque la prévisibilité de la facturation est importante.

    <Tip>
    Pour l’automatisation de production partagée, utilisez une clé API Anthropic plutôt que
    Claude CLI. OpenClaw prend également en charge des options de type abonnement depuis
    [OpenAI Codex](/fr/providers/openai), [Qwen Cloud](/fr/providers/qwen),
    [MiniMax](/fr/providers/minimax) et [Z.AI / GLM](/fr/providers/zai).
    </Tip>

  </Tab>
</Tabs>

## Valeurs par défaut de raisonnement (Claude Fable 5, 4.8 et 4.6)

`anthropic/claude-fable-5` utilise toujours le raisonnement adaptatif et utilise par défaut un effort `high`.
Comme Anthropic n’autorise pas la désactivation du raisonnement pour ce modèle,
`/think off` et `/think minimal` utilisent l’effort `low`. OpenClaw omet également les valeurs de
température personnalisées pour les requêtes Fable 5.

Claude Opus 4.8 garde le raisonnement désactivé par défaut dans OpenClaw. Lorsque vous activez explicitement le raisonnement adaptatif avec `/think high|xhigh|max`, OpenClaw envoie les valeurs d’effort Opus 4.8 d’Anthropic ; les modèles Claude 4.6 utilisent par défaut `adaptive`.

Remplacez par message avec `/think:<level>` ou dans les paramètres du modèle :

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
| `"short"` (défaut)  | 5 minutes      | Appliqué automatiquement pour l’auth par clé API |
| `"long"`            | 1 heure        | Cache étendu                                     |
| `"none"`            | Pas de cache   | Désactiver la mise en cache des prompts          |

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
  <Accordion title="Surcharges de cache par agent">
    Utilisez les paramètres au niveau du modèle comme base, puis remplacez des agents spécifiques via `agents.list[].params` :

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
    2. `agents.list[].params` (`id` correspondant, remplacements par clé)

    Cela permet à un agent de conserver un cache longue durée tandis qu’un autre agent sur le même modèle désactive la mise en cache pour un trafic par rafales ou à faible réutilisation.

  </Accordion>

  <Accordion title="Notes sur Claude Bedrock">
    - Les modèles Anthropic Claude sur Bedrock (`amazon-bedrock/*anthropic.claude*`) acceptent le transfert direct de `cacheRetention` lorsqu’il est configuré.
    - Les modèles Bedrock non Anthropic sont forcés à `cacheRetention: "none"` à l’exécution.
    - Les valeurs par défaut intelligentes de clé API initialisent également `cacheRetention: "short"` pour les références Claude sur Bedrock lorsqu’aucune valeur explicite n’est définie.

  </Accordion>
</AccordionGroup>

## Configuration avancée

<AccordionGroup>
  <Accordion title="Mode rapide">
    Le basculement partagé `/fast` d’OpenClaw prend en charge le trafic Anthropic direct (clé API et OAuth vers `api.anthropic.com`).

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
    - Sur les comptes sans capacité Priority Tier, `service_tier: "auto"` peut se résoudre en `standard`.

    </Note>

  </Accordion>

  <Accordion title="Compréhension des médias (image et PDF)">
    Le Plugin Anthropic intégré enregistre la compréhension des images et des PDF. OpenClaw
    résout automatiquement les capacités médias depuis l’authentification Anthropic configurée — aucune
    configuration supplémentaire n’est nécessaire.

    | Propriété        | Valeur                |
    | --------------- | --------------------- |
    | Modèle par défaut | `claude-opus-4-8`   |
    | Entrée prise en charge | Images, documents PDF |

    Lorsqu’une image ou un PDF est joint à une conversation, OpenClaw l’achemine automatiquement
    via le fournisseur de compréhension des médias Anthropic.

  </Accordion>

  <Accordion title="Fenêtre de contexte 1M">
    La fenêtre de contexte 1M d’Anthropic est disponible sur les modèles Claude 4.x compatibles GA,
    tels qu’Opus 4.8, Opus 4.7, Opus 4.6 et Sonnet 4.6. OpenClaw dimensionne ces modèles à
    1M automatiquement :

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

    Les anciennes configurations peuvent conserver `params.context1m: true`, mais OpenClaw n’envoie plus
    l’en-tête bêta retiré `context-1m-2025-08-07`. Les anciennes entrées de configuration `anthropicBeta`
    contenant cette valeur sont ignorées pendant la résolution des en-têtes de requête, et
    les anciens modèles Claude non pris en charge restent sur leur fenêtre de contexte normale.

    `params.context1m: true` s’applique également au backend Claude CLI
    (`claude-cli/*`) pour les modèles Opus et Sonnet admissibles compatibles GA, ce qui préserve
    la fenêtre de contexte d’exécution de ces sessions CLI afin qu’elle corresponde au comportement
    de l’API directe.

    <Warning>
    Nécessite un accès long contexte sur vos identifiants Anthropic. L’authentification par jeton OAuth/abonnement conserve ses en-têtes bêta Anthropic requis, mais OpenClaw retire l’en-tête bêta 1M retiré s’il reste dans une ancienne configuration.
    </Warning>

  </Accordion>

  <Accordion title="Contexte 1M de Claude Opus 4.8">
    `anthropic/claude-opus-4-8` et sa variante `claude-cli` ont une fenêtre de contexte 1M
    par défaut — aucun `params.context1m: true` nécessaire.
  </Accordion>
</AccordionGroup>

## Dépannage

<AccordionGroup>
  <Accordion title="Erreurs 401 / jeton soudainement invalide">
    L’authentification par jeton Anthropic expire et peut être révoquée. Pour les nouvelles configurations, utilisez plutôt une clé API Anthropic.
  </Accordion>

  <Accordion title='Aucune clé API trouvée pour le fournisseur "anthropic"'>
    L’authentification Anthropic est **par agent** — les nouveaux agents n’héritent pas des clés de l’agent principal. Relancez l’onboarding pour cet agent (ou configurez une clé API sur l’hôte Gateway), puis vérifiez avec `openclaw models status`.
  </Accordion>

  <Accordion title='Aucun identifiant trouvé pour le profil "anthropic:default"'>
    Exécutez `openclaw models status` pour voir quel profil d’authentification est actif. Relancez l’onboarding, ou configurez une clé API pour ce chemin de profil.
  </Accordion>

  <Accordion title="Aucun profil d’authentification disponible (tous en période de récupération)">
    Consultez `auth.unusableProfiles` dans `openclaw models status --json`. Les périodes de récupération dues aux limites de débit Anthropic peuvent être propres à un modèle, donc un modèle Anthropic apparenté peut encore être utilisable. Ajoutez un autre profil Anthropic ou attendez la fin de la période de récupération.
  </Accordion>
</AccordionGroup>

<Note>
Plus d’aide : [Dépannage](/fr/help/troubleshooting) et [FAQ](/fr/help/faq).
</Note>

## Associé

<CardGroup cols={2}>
  <Card title="Sélection du modèle" href="/fr/concepts/model-providers" icon="layers">
    Choisir les fournisseurs, les références de modèle et le comportement de basculement.
  </Card>
  <Card title="Backends CLI" href="/fr/gateway/cli-backends" icon="terminal">
    Configuration du backend Claude CLI et détails d’exécution.
  </Card>
  <Card title="Mise en cache des prompts" href="/fr/reference/prompt-caching" icon="database">
    Fonctionnement de la mise en cache des prompts entre les fournisseurs.
  </Card>
  <Card title="OAuth et authentification" href="/fr/gateway/authentication" icon="key">
    Détails d’authentification et règles de réutilisation des identifiants.
  </Card>
</CardGroup>
