---
read_when:
    - Vous souhaitez utiliser les modèles Anthropic dans OpenClaw
summary: Utiliser Anthropic Claude via des clés API ou Claude CLI dans OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-05-11T20:51:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: c36764f1adb7585389d241303e9c61c1fe2fa49fefdfb28c314abbafa646b273
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic développe la famille de modèles **Claude**. OpenClaw prend en charge deux modes d’authentification :

- **Clé API** — accès direct à l’API Anthropic avec facturation à l’usage (modèles `anthropic/*`)
- **Claude CLI** — réutilise une connexion Claude CLI existante sur le même hôte

<Warning>
Le personnel d’Anthropic nous a indiqué que l’utilisation de type OpenClaw avec Claude CLI est de nouveau autorisée ; OpenClaw considère donc la réutilisation de Claude CLI et l’utilisation de `claude -p` comme approuvées, sauf si Anthropic publie une nouvelle politique.

Pour les hôtes Gateway de longue durée, les clés API Anthropic restent la voie de production la plus claire et la plus prévisible.

Documentation publique actuelle d’Anthropic :

- [Référence de Claude Code CLI](https://code.claude.com/docs/en/cli-reference)
- [Présentation de Claude Agent SDK](https://platform.claude.com/docs/en/agent-sdk/overview)
- [Utiliser Claude Code avec votre offre Pro ou Max](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [Utiliser Claude Code avec votre offre Team ou Enterprise](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)

</Warning>

## Bien démarrer

<Tabs>
  <Tab title="Clé API">
    **Idéal pour :** l’accès API standard et la facturation à l’usage.

    <Steps>
      <Step title="Obtenir votre clé API">
        Créez une clé API dans l’[Anthropic Console](https://console.anthropic.com/).
      </Step>
      <Step title="Exécuter l’intégration">
        ```bash
        openclaw onboard
        # choose: Anthropic API key
        ```

        Ou transmettez la clé directement :

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
      env: { ANTHROPIC_API_KEY: "sk-ant-..." },
      agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
    }
    ```

  </Tab>

  <Tab title="Claude CLI">
    **Idéal pour :** réutiliser une connexion Claude CLI existante sans clé API séparée.

    <Steps>
      <Step title="Vérifier que Claude CLI est installé et connecté">
        Vérifiez avec :

        ```bash
        claude --version
        ```
      </Step>
      <Step title="Exécuter l’intégration">
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

    ### Exemple de configuration

    Préférez la référence de modèle Anthropic canonique avec une substitution d’exécution CLI :

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-7" },
          models: {
            "anthropic/claude-opus-4-7": {
              agentRuntime: { id: "claude-cli" },
            },
          },
        },
      },
    }
    ```

    Les anciennes références de modèle `claude-cli/claude-opus-4-7` fonctionnent encore pour la compatibilité, mais les nouvelles configurations doivent conserver la sélection fournisseur/modèle sous la forme `anthropic/*` et placer le backend d’exécution dans la politique d’exécution fournisseur/modèle.

    <Tip>
    Si vous voulez le parcours de facturation le plus clair, utilisez plutôt une clé API Anthropic. OpenClaw prend également en charge des options de type abonnement depuis [OpenAI Codex](/fr/providers/openai), [Qwen Cloud](/fr/providers/qwen), [MiniMax](/fr/providers/minimax) et [Z.AI / GLM](/fr/providers/glm).
    </Tip>

  </Tab>
</Tabs>

## Valeurs par défaut de raisonnement (Claude 4.6)

Les modèles Claude 4.6 utilisent par défaut le raisonnement `adaptive` dans OpenClaw lorsqu’aucun niveau de raisonnement explicite n’est défini.

Remplacez-le par message avec `/think:<level>` ou dans les paramètres du modèle :

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { thinking: "adaptive" },
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

| Valeur              | Durée du cache | Description                                            |
| ------------------- | -------------- | ------------------------------------------------------ |
| `"short"` (défaut)  | 5 minutes      | Appliqué automatiquement pour l’authentification par clé API |
| `"long"`            | 1 heure        | Cache étendu                                          |
| `"none"`            | Aucune mise en cache | Désactive la mise en cache des prompts           |

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
  <Accordion title="Substitutions de cache par agent">
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
    2. `agents.list[].params` (`id` correspondant, remplace par clé)

    Cela permet à un agent de conserver un cache de longue durée tandis qu’un autre agent utilisant le même modèle désactive la mise en cache pour un trafic en rafales ou à faible réutilisation.

  </Accordion>

  <Accordion title="Notes sur Claude avec Bedrock">
    - Les modèles Anthropic Claude sur Bedrock (`amazon-bedrock/*anthropic.claude*`) acceptent le transfert de `cacheRetention` lorsqu’il est configuré.
    - Les modèles Bedrock non Anthropic sont forcés à `cacheRetention: "none"` à l’exécution.
    - Les valeurs par défaut intelligentes pour clé API renseignent aussi `cacheRetention: "short"` pour les références Claude sur Bedrock lorsqu’aucune valeur explicite n’est définie.

  </Accordion>
</AccordionGroup>

## Configuration avancée

<AccordionGroup>
  <Accordion title="Mode rapide">
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
    - Sur les comptes sans capacité Priority Tier, `service_tier: "auto"` peut se résoudre en `standard`.

    </Note>

  </Accordion>

  <Accordion title="Compréhension des médias (image et PDF)">
    Le Plugin Anthropic intégré enregistre la compréhension des images et des PDF. OpenClaw résout automatiquement les capacités multimédias à partir de l’authentification Anthropic configurée ; aucune configuration supplémentaire n’est nécessaire.

    | Propriété        | Valeur                |
    | --------------- | --------------------- |
    | Modèle par défaut | `claude-opus-4-7`   |
    | Entrée prise en charge | Images, documents PDF |

    Lorsqu’une image ou un PDF est joint à une conversation, OpenClaw l’achemine automatiquement via le fournisseur de compréhension multimédia Anthropic.

  </Accordion>

  <Accordion title="Fenêtre de contexte 1M (bêta)">
    La fenêtre de contexte 1M d’Anthropic est soumise à un accès bêta. Activez-la par modèle :

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-opus-4-6": {
              params: { context1m: true },
            },
          },
        },
      },
    }
    ```

    OpenClaw mappe cela à `anthropic-beta: context-1m-2025-08-07` sur les requêtes.

    `params.context1m: true` s’applique aussi au backend Claude CLI (`claude-cli/*`) pour les modèles Opus et Sonnet éligibles, en étendant la fenêtre de contexte d’exécution de ces sessions CLI afin de correspondre au comportement de l’API directe.

    <Warning>
    Nécessite un accès long contexte sur votre identifiant Anthropic. L’ancienne authentification par jeton (`sk-ant-oat-*`) est rejetée pour les requêtes de contexte 1M — OpenClaw consigne un avertissement et revient à la fenêtre de contexte standard.
    </Warning>

  </Accordion>

  <Accordion title="Contexte 1M de Claude Opus 4.7">
    `anthropic/claude-opus-4.7` et sa variante `claude-cli` disposent par défaut d’une fenêtre de contexte 1M — aucun `params.context1m: true` n’est nécessaire.
  </Accordion>
</AccordionGroup>

## Dépannage

<AccordionGroup>
  <Accordion title="Erreurs 401 / jeton soudainement invalide">
    L’authentification par jeton Anthropic expire et peut être révoquée. Pour les nouvelles configurations, utilisez plutôt une clé API Anthropic.
  </Accordion>

  <Accordion title='Aucune clé API trouvée pour le fournisseur "anthropic"'>
    L’authentification Anthropic est **par agent** : les nouveaux agents n’héritent pas des clés de l’agent principal. Relancez l’intégration pour cet agent (ou configurez une clé API sur l’hôte Gateway), puis vérifiez avec `openclaw models status`.
  </Accordion>

  <Accordion title='Aucun identifiant trouvé pour le profil "anthropic:default"'>
    Exécutez `openclaw models status` pour voir quel profil d’authentification est actif. Relancez l’intégration, ou configurez une clé API pour ce chemin de profil.
  </Accordion>

  <Accordion title="Aucun profil d’authentification disponible (tous en cooldown)">
    Consultez `openclaw models status --json` pour `auth.unusableProfiles`. Les cooldowns de limite de débit Anthropic peuvent être limités à un modèle ; un modèle Anthropic voisin peut donc encore être utilisable. Ajoutez un autre profil Anthropic ou attendez la fin du cooldown.
  </Accordion>
</AccordionGroup>

<Note>
Aide supplémentaire : [Dépannage](/fr/help/troubleshooting) et [FAQ](/fr/help/faq).
</Note>

## Liens associés

<CardGroup cols={2}>
  <Card title="Sélection de modèle" href="/fr/concepts/model-providers" icon="layers">
    Choisir des fournisseurs, des références de modèle et un comportement de basculement.
  </Card>
  <Card title="Backends CLI" href="/fr/gateway/cli-backends" icon="terminal">
    Détails de configuration et d’exécution du backend Claude CLI.
  </Card>
  <Card title="Mise en cache des prompts" href="/fr/reference/prompt-caching" icon="database">
    Fonctionnement de la mise en cache des prompts entre fournisseurs.
  </Card>
  <Card title="OAuth et authentification" href="/fr/gateway/authentication" icon="key">
    Détails d’authentification et règles de réutilisation des identifiants.
  </Card>
</CardGroup>
