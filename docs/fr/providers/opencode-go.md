---
read_when:
    - Vous souhaitez utiliser le catalogue OpenCode Go
    - Vous avez besoin des références de modèle runtime pour les modèles hébergés sur Go
summary: Utilisez le catalogue OpenCode Go avec la configuration OpenCode partagée
title: OpenCode Go
x-i18n:
    generated_at: "2026-04-25T13:56:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 42aba47207d85cdc6d2c5d85c3726da660b456320765c83df92ee705f005d3c3
    source_path: providers/opencode-go.md
    workflow: 15
---

OpenCode Go est le catalogue Go au sein d’[OpenCode](/fr/providers/opencode).
Il utilise la même `OPENCODE_API_KEY` que le catalogue Zen, mais conserve l’ID de fournisseur runtime
`opencode-go` afin que le routage amont par modèle reste correct.

| Propriété       | Valeur                        |
| --------------- | ----------------------------- |
| Fournisseur runtime | `opencode-go`             |
| Authentification | `OPENCODE_API_KEY`           |
| Configuration parente | [OpenCode](/fr/providers/opencode) |

## Catalogue intégré

OpenClaw récupère le catalogue Go depuis le registre de modèles pi intégré. Exécutez
`openclaw models list --provider opencode-go` pour obtenir la liste actuelle des modèles.

D’après le catalogue pi intégré, le fournisseur comprend :

| Référence de modèle        | Nom                   |
| -------------------------- | --------------------- |
| `opencode-go/glm-5`        | GLM-5                 |
| `opencode-go/glm-5.1`      | GLM-5.1               |
| `opencode-go/kimi-k2.5`    | Kimi K2.5             |
| `opencode-go/kimi-k2.6`    | Kimi K2.6 (limites x3) |
| `opencode-go/mimo-v2-omni` | MiMo V2 Omni          |
| `opencode-go/mimo-v2-pro`  | MiMo V2 Pro           |
| `opencode-go/minimax-m2.5` | MiniMax M2.5          |
| `opencode-go/minimax-m2.7` | MiniMax M2.7          |
| `opencode-go/qwen3.5-plus` | Qwen3.5 Plus          |
| `opencode-go/qwen3.6-plus` | Qwen3.6 Plus          |

## Premiers pas

<Tabs>
  <Tab title="Interactive">
    <Steps>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```
      </Step>
      <Step title="Set a Go model as default">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode-go/kimi-k2.6"
        ```
      </Step>
      <Step title="Verify models are available">
        ```bash
        openclaw models list --provider opencode-go
        ```
      </Step>
    </Steps>
  </Tab>

  <Tab title="Non-interactive">
    <Steps>
      <Step title="Pass the key directly">
        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Verify models are available">
        ```bash
        openclaw models list --provider opencode-go
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

## Exemple de config

```json5
{
  env: { OPENCODE_API_KEY: "YOUR_API_KEY_HERE" }, // pragma: allowlist secret
  agents: { defaults: { model: { primary: "opencode-go/kimi-k2.6" } } },
}
```

## Configuration avancée

<AccordionGroup>
  <Accordion title="Routing behavior">
    OpenClaw gère automatiquement le routage par modèle lorsque la référence de modèle utilise
    `opencode-go/...`. Aucune configuration supplémentaire du fournisseur n’est requise.
  </Accordion>

  <Accordion title="Runtime ref convention">
    Les références runtime restent explicites : `opencode/...` pour Zen, `opencode-go/...` pour Go.
    Cela permet de conserver un routage amont correct par modèle dans les deux catalogues.
  </Accordion>

  <Accordion title="Shared credentials">
    La même `OPENCODE_API_KEY` est utilisée par les catalogues Zen et Go. Saisir
    la clé pendant la configuration stocke les identifiants pour les deux fournisseurs runtime.
  </Accordion>
</AccordionGroup>

<Tip>
Consultez [OpenCode](/fr/providers/opencode) pour la vue d’ensemble de configuration partagée et la référence complète
des catalogues Zen + Go.
</Tip>

## Liens connexes

<CardGroup cols={2}>
  <Card title="OpenCode (parent)" href="/fr/providers/opencode" icon="server">
    Configuration partagée, vue d’ensemble du catalogue et notes avancées.
  </Card>
  <Card title="Model selection" href="/fr/concepts/model-providers" icon="layers">
    Choix des fournisseurs, références de modèle et comportement de basculement.
  </Card>
</CardGroup>
