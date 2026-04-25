---
read_when:
    - Vous souhaitez un accès aux modèles hébergés par OpenCode
    - Vous souhaitez choisir entre les catalogues Zen et Go
summary: Utiliser les catalogues OpenCode Zen et Go avec OpenClaw
title: OpenCode
x-i18n:
    generated_at: "2026-04-25T13:56:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: cb0521b038e519f139c66f98ddef4919d8c43ce64018ef8af8f7b42ac00114a4
    source_path: providers/opencode.md
    workflow: 15
---

OpenCode expose deux catalogues hébergés dans OpenClaw :

| Catalogue | Préfixe          | Fournisseur runtime |
| --------- | ---------------- | ------------------- |
| **Zen**   | `opencode/...`   | `opencode`          |
| **Go**    | `opencode-go/...` | `opencode-go`      |

Les deux catalogues utilisent la même clé API OpenCode. OpenClaw conserve des identifiants de fournisseur runtime
distincts afin que le routage en amont par modèle reste correct, mais l’onboarding et la documentation les traitent
comme une seule configuration OpenCode.

## Démarrage

<Tabs>
  <Tab title="Catalogue Zen">
    **Idéal pour :** le proxy multi-modèles OpenCode sélectionné (Claude, GPT, Gemini).

    <Steps>
      <Step title="Exécuter l’onboarding">
        ```bash
        openclaw onboard --auth-choice opencode-zen
        ```

        Ou passez la clé directement :

        ```bash
        openclaw onboard --opencode-zen-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Définir un modèle Zen comme valeur par défaut">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode/claude-opus-4-6"
        ```
      </Step>
      <Step title="Vérifier que les modèles sont disponibles">
        ```bash
        openclaw models list --provider opencode
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Catalogue Go">
    **Idéal pour :** la gamme Kimi, GLM et MiniMax hébergée par OpenCode.

    <Steps>
      <Step title="Exécuter l’onboarding">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```

        Ou passez la clé directement :

        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Définir un modèle Go comme valeur par défaut">
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
</Tabs>

## Exemple de configuration

```json5
{
  env: { OPENCODE_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

## Catalogues intégrés

### Zen

| Property         | Value                                                                   |
| ---------------- | ----------------------------------------------------------------------- |
| Fournisseur runtime | `opencode`                                                           |
| Exemples de modèles | `opencode/claude-opus-4-6`, `opencode/gpt-5.5`, `opencode/gemini-3-pro` |

### Go

| Property         | Value                                                                    |
| ---------------- | ------------------------------------------------------------------------ |
| Fournisseur runtime | `opencode-go`                                                         |
| Exemples de modèles | `opencode-go/kimi-k2.6`, `opencode-go/glm-5`, `opencode-go/minimax-m2.5` |

## Configuration avancée

<AccordionGroup>
  <Accordion title="Alias de clé API">
    `OPENCODE_ZEN_API_KEY` est également pris en charge comme alias de `OPENCODE_API_KEY`.
  </Accordion>

  <Accordion title="Identifiants partagés">
    Saisir une clé OpenCode pendant la configuration stocke les identifiants pour les deux fournisseurs runtime.
    Vous n’avez pas besoin d’effectuer l’onboarding de chaque catalogue séparément.
  </Accordion>

  <Accordion title="Facturation et tableau de bord">
    Vous vous connectez à OpenCode, ajoutez les détails de facturation, puis copiez votre clé API. La facturation
    et la disponibilité du catalogue sont gérées depuis le tableau de bord OpenCode.
  </Accordion>

  <Accordion title="Comportement de relecture Gemini">
    Les références OpenCode adossées à Gemini restent sur le chemin proxy-Gemini, donc OpenClaw conserve
    l’assainissement des signatures de pensée Gemini sans activer la validation native de relecture Gemini
    ni les réécritures bootstrap.
  </Accordion>

  <Accordion title="Comportement de relecture non-Gemini">
    Les références OpenCode non-Gemini conservent la politique minimale de relecture compatible OpenAI.
  </Accordion>
</AccordionGroup>

<Tip>
Saisir une seule clé OpenCode pendant la configuration stocke les identifiants pour les deux fournisseurs runtime Zen et
Go, vous n’avez donc besoin de faire l’onboarding qu’une seule fois.
</Tip>

## Liens associés

<CardGroup cols={2}>
  <Card title="Sélection de modèle" href="/fr/concepts/model-providers" icon="layers">
    Choisir les fournisseurs, les références de modèles et le comportement de failover.
  </Card>
  <Card title="Référence de configuration" href="/fr/gateway/configuration-reference" icon="gear">
    Référence complète de configuration pour agents, modèles et fournisseurs.
  </Card>
</CardGroup>
