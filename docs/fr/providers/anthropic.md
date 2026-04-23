---
read_when:
    - Vous souhaitez utiliser les modèles Anthropic dans OpenClaw
summary: Utiliser Anthropic Claude via des clés API ou Claude CLI dans OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-04-23T07:08:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 02e99e31bf58d08a18f526281b3bf5c3a5a96b2ff342adf3a6a193a076147a03
    source_path: providers/anthropic.md
    workflow: 15
---

# Anthropic (Claude)

Anthropic développe la famille de modèles **Claude**. OpenClaw prend en charge deux chemins d’authentification :

- **Clé API** — accès direct à l’API Anthropic avec facturation à l’usage (modèles `anthropic/*`)
- **Claude CLI** — réutiliser une connexion Claude CLI existante sur le même hôte

<Warning>
Le personnel d’Anthropic nous a indiqué que l’usage de Claude CLI dans le style OpenClaw est de nouveau autorisé, donc
OpenClaw considère la réutilisation de Claude CLI et l’usage de `claude -p` comme approuvés sauf si
Anthropic publie une nouvelle politique.

Pour les hôtes Gateway de longue durée, les clés API Anthropic restent la voie de production la plus claire
et la plus prévisible.

Documentation publique actuelle d’Anthropic :

- [Claude Code CLI reference](https://code.claude.com/docs/en/cli-reference)
- [Claude Agent SDK overview](https://platform.claude.com/docs/en/agent-sdk/overview)
- [Using Claude Code with your Pro or Max plan](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [Using Claude Code with your Team or Enterprise plan](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)

</Warning>

## Premiers pas

<Tabs>
  <Tab title="Clé API">
    **Idéal pour :** accès API standard et facturation à l’usage.

    <Steps>
      <Step title="Obtenir votre clé API">
        Créez une clé API dans la [console Anthropic](https://console.anthropic.com/).
      </Step>
      <Step title="Exécuter l’onboarding">
        ```bash
        openclaw onboard
        # choisir : clé API Anthropic
        ```

        Ou passez la clé directement :

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
      <Step title="S’assurer que Claude CLI est installé et connecté">
        Vérifiez avec :

        ```bash
        claude --version
        ```
      </Step>
      <Step title="Exécuter l’onboarding">
        ```bash
        openclaw onboard
        # choisir : Claude CLI
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
    Les détails de configuration et d’exécution du backend Claude CLI se trouvent dans [CLI Backends](/fr/gateway/cli-backends).
    </Note>

    <Tip>
    Si vous voulez la voie de facturation la plus claire, utilisez plutôt une clé API Anthropic. OpenClaw prend aussi en charge des options de type abonnement provenant de [OpenAI Codex](/fr/providers/openai), [Qwen Cloud](/fr/providers/qwen), [MiniMax](/fr/providers/minimax), et [Z.AI / GLM](/fr/providers/glm).
    </Tip>

  </Tab>
</Tabs>

## Valeurs par défaut de réflexion (Claude 4.6)

Les modèles Claude 4.6 utilisent par défaut la réflexion `adaptive` dans OpenClaw lorsqu’aucun niveau de réflexion explicite n’est défini.

Remplacez au niveau de chaque message avec `/think:<level>` ou dans les paramètres du modèle :

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
- [Adaptive thinking](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [Extended thinking](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)
</Note>

## Mise en cache du prompt

OpenClaw prend en charge la fonctionnalité de mise en cache du prompt d’Anthropic pour l’authentification par clé API.

| Value               | Durée du cache | Description                              |
| ------------------- | -------------- | ---------------------------------------- |
| `"short"` (par défaut) | 5 minutes   | Appliquée automatiquement pour l’authentification par clé API |
| `"long"`            | 1 heure        | Cache étendu                             |
| `"none"`            | Aucun cache    | Désactiver la mise en cache du prompt    |

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
    2. `agents.list[].params` (`id` correspondant, remplacement par clé)

    Cela permet à un agent de conserver un cache de longue durée tandis qu’un autre agent sur le même modèle désactive le cache pour un trafic par rafales / à faible réutilisation.

  </Accordion>

  <Accordion title="Remarques sur Bedrock Claude">
    - Les modèles Anthropic Claude sur Bedrock (`amazon-bedrock/*anthropic.claude*`) acceptent le passage direct de `cacheRetention` lorsqu’il est configuré.
    - Les modèles Bedrock non-Anthropic sont forcés à `cacheRetention: "none"` à l’exécution.
    - Les valeurs intelligentes par défaut pour clé API initialisent aussi `cacheRetention: "short"` pour les références Claude-on-Bedrock lorsqu’aucune valeur explicite n’est définie.
  </Accordion>
</AccordionGroup>

## Configuration avancée

<AccordionGroup>
  <Accordion title="Mode rapide">
    Le basculement partagé `/fast` d’OpenClaw prend en charge le trafic Anthropic direct (clé API et OAuth vers `api.anthropic.com`).

    | Commande | Correspond à |
    |---------|--------------|
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
    résout automatiquement les capacités média à partir de l’authentification Anthropic configurée — aucune
    configuration supplémentaire n’est nécessaire.

    | Property       | Value                |
    | -------------- | -------------------- |
    | Modèle par défaut  | `claude-opus-4-6`    |
    | Entrée prise en charge | Images, documents PDF |

    Lorsqu’une image ou un PDF est joint à une conversation, OpenClaw
    le route automatiquement via le fournisseur Anthropic de compréhension des médias.

  </Accordion>

  <Accordion title="Fenêtre de contexte 1M (bêta)">
    La fenêtre de contexte 1M d’Anthropic est protégée par une bêta. Activez-la par modèle :

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

    OpenClaw mappe cela vers `anthropic-beta: context-1m-2025-08-07` dans les requêtes.

    <Warning>
    Nécessite un accès long context sur votre identifiant Anthropic. L’authentification par jeton héritée (`sk-ant-oat-*`) est rejetée pour les requêtes 1M context — OpenClaw journalise un avertissement et revient à la fenêtre de contexte standard.
    </Warning>

  </Accordion>

  <Accordion title="Normalisation du contexte 1M pour Claude Opus 4.7">
    Claude Opus 4.7 (`anthropic/claude-opus-4.7`) et sa variante `claude-cli` sont normalisés vers une fenêtre de contexte de 1M dans les métadonnées d’exécution résolues et dans les rapports d’état/contexte des agents actifs. Vous n’avez pas besoin de `params.context1m: true` pour Opus 4.7 ; il n’hérite plus du repli obsolète à 200k.

    Compaction et la gestion de débordement utilisent automatiquement la fenêtre 1M. Les autres modèles Anthropic conservent leurs limites publiées.

  </Accordion>
</AccordionGroup>

## Dépannage

<AccordionGroup>
  <Accordion title="Erreurs 401 / jeton soudainement invalide">
    L’authentification par jeton Anthropic peut expirer ou être révoquée. Pour les nouvelles configurations, migrez vers une clé API Anthropic.
  </Accordion>

  <Accordion title='Aucune clé API trouvée pour le fournisseur "anthropic"'>
    L’authentification est **par agent**. Les nouveaux agents n’héritent pas des clés de l’agent principal. Relancez l’onboarding pour cet agent, ou configurez une clé API sur l’hôte gateway, puis vérifiez avec `openclaw models status`.
  </Accordion>

  <Accordion title='Aucun identifiant trouvé pour le profil "anthropic:default"'>
    Exécutez `openclaw models status` pour voir quel profil d’authentification est actif. Relancez l’onboarding, ou configurez une clé API pour ce chemin de profil.
  </Accordion>

  <Accordion title="Aucun profil d’authentification disponible (tous en cooldown)">
    Vérifiez `openclaw models status --json` pour `auth.unusableProfiles`. Les cooldowns de limite de débit Anthropic peuvent être à portée de modèle, donc un modèle Anthropic voisin peut encore être utilisable. Ajoutez un autre profil Anthropic ou attendez la fin du cooldown.
  </Accordion>
</AccordionGroup>

<Note>
Aide supplémentaire : [Dépannage](/fr/help/troubleshooting) et [FAQ](/fr/help/faq).
</Note>

## Lié

<CardGroup cols={2}>
  <Card title="Sélection de modèle" href="/fr/concepts/model-providers" icon="layers">
    Choisir les fournisseurs, les références de modèle et le comportement de basculement.
  </Card>
  <Card title="CLI backends" href="/fr/gateway/cli-backends" icon="terminal">
    Détails de configuration et d’exécution du backend Claude CLI.
  </Card>
  <Card title="Mise en cache du prompt" href="/fr/reference/prompt-caching" icon="database">
    Fonctionnement de la mise en cache du prompt entre fournisseurs.
  </Card>
  <Card title="OAuth et authentification" href="/fr/gateway/authentication" icon="key">
    Détails d’authentification et règles de réutilisation des identifiants.
  </Card>
</CardGroup>
