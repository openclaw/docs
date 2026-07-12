---
read_when:
    - Vous souhaitez le catalogue OpenCode Go
    - Vous avez besoin des références de modèles d’exécution pour les modèles hébergés sur Go
summary: Utilisez le catalogue OpenCode Go avec la configuration OpenCode partagée
title: OpenCode Go
x-i18n:
    generated_at: "2026-07-12T15:45:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: df647721e8966fd4fad3178550b071a2eb827148fe765bda53b3d7c97ceaadc2
    source_path: providers/opencode-go.md
    workflow: 16
---

OpenCode Go est le catalogue Go au sein d’[OpenCode](/fr/providers/opencode). Il partage
l’identifiant `OPENCODE_API_KEY` avec le catalogue Zen, mais conserve son propre
identifiant de fournisseur d’exécution (`opencode-go`) afin que le routage en amont par modèle reste
correct.

| Propriété                       | Valeur                                             |
| ------------------------------- | -------------------------------------------------- |
| Fournisseur d’exécution         | `opencode-go`                                      |
| Authentification                | `OPENCODE_API_KEY` (alias : `OPENCODE_ZEN_API_KEY`) |
| Configuration parente           | [OpenCode](/fr/providers/opencode)                    |

## Prise en main

<Tabs>
  <Tab title="Interactive">
    <Steps>
      <Step title="Exécuter l’intégration">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```
      </Step>
      <Step title="Définir un modèle Go par défaut">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode-go/kimi-k2.6"
        ```
      </Step>
      <Step title="Vérifier que les modèles sont disponibles">
        ```bash
        openclaw models list --provider opencode-go
        ```
      </Step>
    </Steps>
  </Tab>

  <Tab title="Non-interactive">
    <Steps>
      <Step title="Transmettre directement la clé">
        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Vérifier que les modèles sont disponibles">
        ```bash
        openclaw models list --provider opencode-go
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

## Exemple de configuration

```json5
{
  env: { OPENCODE_API_KEY: "YOUR_API_KEY_HERE" }, // pragma: allowlist secret
  agents: { defaults: { model: { primary: "opencode-go/kimi-k2.6" } } },
}
```

## Catalogue intégré

Exécutez `openclaw models list --provider opencode-go` pour obtenir la liste actuelle des modèles.
Entrées incluses :

| Référence du modèle             | Nom               | Contexte  | Sortie max. | Entrée d’image |
| ------------------------------- | ----------------- | --------- | ----------- | -------------- |
| `opencode-go/deepseek-v4-pro`   | DeepSeek V4 Pro   | 1M        | 384K        | Non            |
| `opencode-go/deepseek-v4-flash` | DeepSeek V4 Flash | 1M        | 384K        | Non            |
| `opencode-go/glm-5`             | GLM-5             | 202,752   | 32,768      | Non            |
| `opencode-go/glm-5.1`           | GLM-5.1           | 202,752   | 32,768      | Non            |
| `opencode-go/glm-5.2`           | GLM-5.2           | 1M        | 131,072     | Non            |
| `opencode-go/hy3-preview`       | HY3 Preview       | 262,144   | 32,768      | Non            |
| `opencode-go/kimi-k2.5`         | Kimi K2.5         | 262,144   | 65,536      | Oui            |
| `opencode-go/kimi-k2.6`         | Kimi K2.6         | 262,144   | 65,536      | Oui            |
| `opencode-go/kimi-k2.7-code`    | Kimi K2.7 Code    | 262,144   | 262,144     | Oui            |
| `opencode-go/mimo-v2.5`         | MiMo V2.5         | 1M        | 128,000     | Oui            |
| `opencode-go/mimo-v2.5-pro`     | MiMo V2.5 Pro     | 1,048,576 | 128,000     | Non            |
| `opencode-go/minimax-m2.5`      | MiniMax M2.5      | 204,800   | 65,536      | Non            |
| `opencode-go/minimax-m2.7`      | MiniMax M2.7      | 204,800   | 131,072     | Non            |
| `opencode-go/minimax-m3`        | MiniMax M3        | 204,800   | 131,072     | Non            |
| `opencode-go/qwen3.5-plus`      | Qwen3.5 Plus      | 262,144   | 65,536      | Oui            |
| `opencode-go/qwen3.6-plus`      | Qwen3.6 Plus      | 262,144   | 65,536      | Oui            |
| `opencode-go/qwen3.7-max`       | Qwen3.7 Max       | 1M        | 65,536      | Non            |
| `opencode-go/qwen3.7-plus`      | Qwen3.7 Plus      | 1M        | 65,536      | Oui            |

## Configuration avancée

<AccordionGroup>
  <Accordion title="Comportement du routage">
    OpenClaw route automatiquement toute référence de modèle `opencode-go/...`. Aucune configuration
    supplémentaire du fournisseur n’est requise.
  </Accordion>

  <Accordion title="Convention des références d’exécution">
    Les références d’exécution restent explicites : `opencode/...` pour Zen, `opencode-go/...` pour
    Go. Cela garantit un routage en amont correct par modèle dans les deux catalogues.
  </Accordion>

  <Accordion title="Identifiants partagés">
    Un seul `OPENCODE_API_KEY` couvre les catalogues Zen et Go. La saisie de la
    clé pendant la configuration enregistre les identifiants pour les deux fournisseurs d’exécution.
  </Accordion>
</AccordionGroup>

<Tip>
Consultez [OpenCode](/fr/providers/opencode) pour une présentation de l’intégration partagée et la référence complète
des catalogues Zen et Go.
</Tip>

## Pages connexes

<CardGroup cols={2}>
  <Card title="OpenCode (parent)" href="/fr/providers/opencode" icon="server">
    Intégration partagée, présentation du catalogue et remarques avancées.
  </Card>
  <Card title="Sélection du modèle" href="/fr/concepts/model-providers" icon="layers">
    Choix des fournisseurs, références de modèles et comportement de basculement.
  </Card>
</CardGroup>
