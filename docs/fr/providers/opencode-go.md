---
read_when:
    - Vous voulez le catalogue Go d’OpenCode
    - Vous avez besoin des références de modèle d’exécution pour les modèles hébergés par Go
summary: Utiliser le catalogue Go d’OpenCode avec la configuration OpenCode partagée
title: OpenCode Go
x-i18n:
    generated_at: "2026-06-27T18:06:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eb4e6bd452eeebca5456b0cd70e7622e07ed050a07ff9d6d00926f32efe90569
    source_path: providers/opencode-go.md
    workflow: 16
---

OpenCode Go est le catalogue Go dans [OpenCode](/fr/providers/opencode).
Il utilise la même `OPENCODE_API_KEY` que le catalogue Zen, mais conserve l’id
du fournisseur d’exécution `opencode-go` afin que le routage amont par modèle reste correct.

| Propriété                | Valeur                          |
| ------------------------ | ------------------------------- |
| Fournisseur d’exécution  | `opencode-go`                   |
| Authentification         | `OPENCODE_API_KEY`              |
| Configuration parente    | [OpenCode](/fr/providers/opencode) |

## Catalogue intégré

OpenClaw tire la plupart des lignes du catalogue Go du registre de modèles OpenClaw intégré et
complète avec les lignes amont actuelles pendant que le registre se met à jour. Exécutez
`openclaw models list --provider opencode-go` pour obtenir la liste actuelle des modèles.

Le fournisseur inclut :

| Réf. du modèle                 | Nom                   |
| ------------------------------ | --------------------- |
| `opencode-go/glm-5`            | GLM-5                 |
| `opencode-go/glm-5.1`          | GLM-5.1               |
| `opencode-go/glm-5.2`          | GLM-5.2               |
| `opencode-go/kimi-k2.5`        | Kimi K2.5             |
| `opencode-go/kimi-k2.6`        | Kimi K2.6 (limites 3x) |
| `opencode-go/kimi-k2.7-code`   | Kimi K2.7 Code        |
| `opencode-go/deepseek-v4-pro`  | DeepSeek V4 Pro       |
| `opencode-go/deepseek-v4-flash` | DeepSeek V4 Flash     |
| `opencode-go/mimo-v2-omni`     | MiMo V2 Omni          |
| `opencode-go/mimo-v2-pro`      | MiMo V2 Pro           |
| `opencode-go/minimax-m2.5`     | MiniMax M2.5          |
| `opencode-go/minimax-m2.7`     | MiniMax M2.7          |
| `opencode-go/qwen3.5-plus`     | Qwen3.5 Plus          |
| `opencode-go/qwen3.6-plus`     | Qwen3.6 Plus          |

GLM-5.2 utilise une fenêtre de contexte de 1 M de tokens et prend en charge jusqu’à 131 K tokens de sortie.

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

## Exemple de configuration

```json5
{
  env: { OPENCODE_API_KEY: "YOUR_API_KEY_HERE" }, // pragma: allowlist secret
  agents: { defaults: { model: { primary: "opencode-go/kimi-k2.6" } } },
}
```

## Configuration avancée

<AccordionGroup>
  <Accordion title="Routing behavior">
    OpenClaw gère automatiquement le routage par modèle lorsque la référence du modèle utilise
    `opencode-go/...`. Aucune configuration de fournisseur supplémentaire n’est requise.
  </Accordion>

  <Accordion title="Runtime ref convention">
    Les références d’exécution restent explicites : `opencode/...` pour Zen, `opencode-go/...` pour Go.
    Cela maintient le routage amont par modèle correct dans les deux catalogues.
  </Accordion>

  <Accordion title="Shared credentials">
    La même `OPENCODE_API_KEY` est utilisée par les catalogues Zen et Go. La saisie
    de la clé pendant la configuration stocke les identifiants pour les deux fournisseurs d’exécution.
  </Accordion>
</AccordionGroup>

<Tip>
Consultez [OpenCode](/fr/providers/opencode) pour la vue d’ensemble de l’onboarding partagé et la référence complète
des catalogues Zen + Go.
</Tip>

## Connexe

<CardGroup cols={2}>
  <Card title="OpenCode (parent)" href="/fr/providers/opencode" icon="server">
    Onboarding partagé, vue d’ensemble du catalogue et notes avancées.
  </Card>
  <Card title="Model selection" href="/fr/concepts/model-providers" icon="layers">
    Choix des fournisseurs, références de modèles et comportement de basculement.
  </Card>
</CardGroup>
