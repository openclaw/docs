---
read_when:
    - Vous voulez le catalogue OpenCode Go
    - Vous avez besoin des références de modèle runtime pour les modèles hébergés sur Go
summary: Utilisez le catalogue OpenCode Go avec la configuration OpenCode partagée
title: OpenCode Go
x-i18n:
    generated_at: "2026-04-22T04:27:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: bb03bc609f0dfff2981eac13b67cbcae066184f4606ce54ba24ca6a5737fdae8
    source_path: providers/opencode-go.md
    workflow: 15
---

# OpenCode Go

OpenCode Go est le catalogue Go au sein de [OpenCode](/fr/providers/opencode).
Il utilise la même `OPENCODE_API_KEY` que le catalogue Zen, mais conserve l’ID de provider runtime
`opencode-go` afin que le routage amont par modèle reste correct.

| Propriété       | Valeur                        |
| ---------------- | ----------------------------- |
| Provider runtime | `opencode-go`                 |
| Auth             | `OPENCODE_API_KEY`            |
| Configuration parente | [OpenCode](/fr/providers/opencode) |

## Modèles pris en charge

OpenClaw source le catalogue Go depuis le registre de modèles Pi intégré. Exécutez
`openclaw models list --provider opencode-go` pour obtenir la liste actuelle des modèles.

D’après le catalogue Pi intégré, le provider inclut :

| Réf de modèle              | Nom                   |
| -------------------------- | --------------------- |
| `opencode-go/glm-5`        | GLM-5                 |
| `opencode-go/glm-5.1`      | GLM-5.1               |
| `opencode-go/kimi-k2.5`    | Kimi K2.5             |
| `opencode-go/kimi-k2.6`    | Kimi K2.6 (limites 3x) |
| `opencode-go/mimo-v2-omni` | MiMo V2 Omni          |
| `opencode-go/mimo-v2-pro`  | MiMo V2 Pro           |
| `opencode-go/minimax-m2.5` | MiniMax M2.5          |
| `opencode-go/minimax-m2.7` | MiniMax M2.7          |
| `opencode-go/qwen3.5-plus` | Qwen3.5 Plus          |
| `opencode-go/qwen3.6-plus` | Qwen3.6 Plus          |

## Démarrage

<Tabs>
  <Tab title="Interactif">
    <Steps>
      <Step title="Exécuter l’onboarding">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```
      </Step>
      <Step title="Définir un modèle Go par défaut">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode-go/kimi-k2.5"
        ```
      </Step>
      <Step title="Vérifier que les modèles sont disponibles">
        ```bash
        openclaw models list --provider opencode-go
        ```
      </Step>
    </Steps>
  </Tab>

  <Tab title="Non interactif">
    <Steps>
      <Step title="Passer la clé directement">
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
  agents: { defaults: { model: { primary: "opencode-go/kimi-k2.5" } } },
}
```

## Notes avancées

<AccordionGroup>
  <Accordion title="Comportement du routage">
    OpenClaw gère automatiquement le routage par modèle lorsque la réf de modèle utilise
    `opencode-go/...`. Aucune configuration de provider supplémentaire n’est requise.
  </Accordion>

  <Accordion title="Convention de réf runtime">
    Les références runtime restent explicites : `opencode/...` pour Zen, `opencode-go/...` pour Go.
    Cela permet de conserver un routage amont par modèle correct sur les deux catalogues.
  </Accordion>

  <Accordion title="Identifiants partagés">
    La même `OPENCODE_API_KEY` est utilisée par les catalogues Zen et Go. La saisie
    de la clé pendant la configuration stocke les identifiants pour les deux providers runtime.
  </Accordion>
</AccordionGroup>

<Tip>
Voir [OpenCode](/fr/providers/opencode) pour la vue d’ensemble partagée de l’onboarding et la référence complète
des catalogues Zen + Go.
</Tip>

## Liens associés

<CardGroup cols={2}>
  <Card title="OpenCode (parent)" href="/fr/providers/opencode" icon="server">
    Onboarding partagé, vue d’ensemble du catalogue et notes avancées.
  </Card>
  <Card title="Sélection du modèle" href="/fr/concepts/model-providers" icon="layers">
    Choisir les providers, les références de modèle et le comportement de basculement.
  </Card>
</CardGroup>
