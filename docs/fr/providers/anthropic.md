---
read_when:
    - Vous souhaitez utiliser des modèles Anthropic dans OpenClaw
summary: Utilisez Anthropic Claude via des clés API ou la CLI Claude dans OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-04-25T13:54:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: daba524d9917321d2aec55222d0df7b850ddf7f5c1c13123b62807eebd1a7a1b
    source_path: providers/anthropic.md
    workflow: 15
---

Anthropic crée la famille de modèles **Claude**. OpenClaw prend en charge deux modes d’authentification :

- **Clé API** — accès direct à l’API Anthropic avec facturation à l’usage (modèles `anthropic/*`)
- **CLI Claude** — réutilisez une connexion Claude CLI existante sur le même hôte

<Warning>
Le personnel d’Anthropic nous a indiqué que l’utilisation de Claude CLI dans le style OpenClaw est de nouveau autorisée, donc
OpenClaw considère la réutilisation de Claude CLI et l’utilisation de `claude -p` comme approuvées sauf si
Anthropic publie une nouvelle politique.

Pour les hôtes Gateway de longue durée, les clés API Anthropic restent la voie de production la plus claire et
la plus prévisible.

Documentation publique actuelle d’Anthropic :

- [Référence CLI Claude Code](https://code.claude.com/docs/en/cli-reference)
- [Vue d’ensemble du SDK Agent Claude](https://platform.claude.com/docs/en/agent-sdk/overview)
- [Utiliser Claude Code avec votre forfait Pro ou Max](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [Utiliser Claude Code avec votre forfait Team ou Enterprise](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)

</Warning>

## Premiers pas

<Tabs>
  <Tab title="Clé API">
    **Idéal pour :** l’accès API standard et la facturation à l’usage.

    <Steps>
      <Step title="Obtenir votre clé API">
        Créez une clé API dans la [console Anthropic](https://console.anthropic.com/).
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
      env: { ANTHROPIC_API_KEY: "sk-ant-..." },
      agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
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
    Les détails de configuration et d’exécution pour le backend Claude CLI se trouvent dans [Backends CLI](/fr/gateway/cli-backends).
    </Note>

    <Tip>
    Si vous voulez la voie de facturation la plus claire, utilisez plutôt une clé API Anthropic. OpenClaw prend également en charge des options de type abonnement de [OpenAI Codex](/fr/providers/openai), [Qwen Cloud](/fr/providers/qwen), [MiniMax](/fr/providers/minimax) et [Z.AI / GLM](/fr/providers/glm).
    </Tip>

  </Tab>
</Tabs>

## Valeurs par défaut de réflexion (Claude 4.6)

Les modèles Claude 4.6 utilisent par défaut le mode de réflexion `adaptive` dans OpenClaw lorsqu’aucun niveau de réflexion explicite n’est défini.

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
Documentation Anthropic connexe :
- [Adaptive thinking](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [Extended thinking](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)
</Note>

## Mise en cache des prompts

OpenClaw prend en charge la fonctionnalité de mise en cache des prompts d’Anthropic pour l’authentification par clé API.

| Valeur              | Durée du cache | Description                                 |
| ------------------- | -------------- | ------------------------------------------- |
| `"short"` (par défaut) | 5 minutes      | Appliqué automatiquement pour l’authentification par clé API |
| `"long"`            | 1 heure        | Cache étendu                                |
| `"none"`            | Aucune mise en cache | Désactiver la mise en cache des prompts     |

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
  <Accordion title="Remplacements de cache par agent">
    Utilisez les paramètres au niveau du modèle comme base, puis remplacez-les pour des agents spécifiques via `agents.list[].params` :

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
    2. `agents.list[].params` (correspondance sur `id`, remplace par clé)

    Cela permet à un agent de conserver un cache longue durée tandis qu’un autre agent sur le même modèle désactive la mise en cache pour un trafic en rafales ou à faible réutilisation.

  </Accordion>

  <Accordion title="Notes sur Bedrock Claude">
    - Les modèles Anthropic Claude sur Bedrock (`amazon-bedrock/*anthropic.claude*`) acceptent le passage direct de `cacheRetention` lorsqu’il est configuré.
    - Les modèles Bedrock non Anthropic sont forcés à `cacheRetention: "none"` à l’exécution.
    - Les valeurs intelligentes par défaut pour les clés API initialisent également `cacheRetention: "short"` pour les références Claude sur Bedrock lorsqu’aucune valeur explicite n’est définie.
  </Accordion>
</AccordionGroup>

## Configuration avancée

<AccordionGroup>
  <Accordion title="Mode rapide">
    Le basculeur partagé `/fast` d’OpenClaw prend en charge le trafic Anthropic direct (clé API et OAuth vers `api.anthropic.com`).

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

  <Accordion title="Compréhension multimédia (image et PDF)">
    Le plugin Anthropic fourni enregistre la compréhension des images et des PDF. OpenClaw
    résout automatiquement les capacités multimédias à partir de l’authentification Anthropic configurée — aucune
    configuration supplémentaire n’est nécessaire.

    | Propriété       | Valeur               |
    | -------------- | -------------------- |
    | Modèle par défaut  | `claude-opus-4-6`    |
    | Entrées prises en charge | Images, documents PDF |

    Lorsqu’une image ou un PDF est joint à une conversation, OpenClaw l’achemine automatiquement
    via le fournisseur Anthropic de compréhension multimédia.

  </Accordion>

  <Accordion title="Fenêtre de contexte 1M (bêta)">
    La fenêtre de contexte 1M d’Anthropic est protégée par une version bêta. Activez-la par modèle :

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

    OpenClaw mappe cela sur `anthropic-beta: context-1m-2025-08-07` dans les requêtes.

    <Warning>
    Nécessite un accès au contexte long sur votre identifiant Anthropic. L’authentification par jeton héritée (`sk-ant-oat-*`) est rejetée pour les requêtes de contexte 1M — OpenClaw journalise un avertissement et revient à la fenêtre de contexte standard.
    </Warning>

  </Accordion>

  <Accordion title="Contexte 1M pour Claude Opus 4.7">
    `anthropic/claude-opus-4.7` et sa variante `claude-cli` ont une fenêtre de contexte
    1M par défaut — aucun `params.context1m: true` n’est nécessaire.
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
    Exécutez `openclaw models status` pour voir quel profil d’authentification est actif. Relancez l’onboarding ou configurez une clé API pour le chemin de ce profil.
  </Accordion>

  <Accordion title="Aucun profil d’authentification disponible (tous en délai de récupération)">
    Vérifiez `openclaw models status --json` pour `auth.unusableProfiles`. Les délais de récupération de limite de débit Anthropic peuvent être limités à un modèle, donc un modèle Anthropic voisin peut encore être utilisable. Ajoutez un autre profil Anthropic ou attendez la fin du délai.
  </Accordion>
</AccordionGroup>

<Note>
Plus d’aide : [Dépannage](/fr/help/troubleshooting) et [FAQ](/fr/help/faq).
</Note>

## Liens connexes

<CardGroup cols={2}>
  <Card title="Sélection du modèle" href="/fr/concepts/model-providers" icon="layers">
    Choisir les fournisseurs, les références de modèles et le comportement de basculement.
  </Card>
  <Card title="Backends CLI" href="/fr/gateway/cli-backends" icon="terminal">
    Configuration du backend Claude CLI et détails d’exécution.
  </Card>
  <Card title="Mise en cache des prompts" href="/fr/reference/prompt-caching" icon="database">
    Fonctionnement de la mise en cache des prompts selon les fournisseurs.
  </Card>
  <Card title="OAuth et authentification" href="/fr/gateway/authentication" icon="key">
    Détails d’authentification et règles de réutilisation des identifiants.
  </Card>
</CardGroup>
