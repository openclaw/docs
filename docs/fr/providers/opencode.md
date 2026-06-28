---
read_when:
    - Vous voulez accéder à des modèles hébergés par OpenCode
    - Vous souhaitez choisir entre les catalogues Zen et Go
summary: Utiliser les catalogues OpenCode Zen et Go avec OpenClaw
title: OpenCode
x-i18n:
    generated_at: "2026-06-28T20:45:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1d777563b82aafbe83a5256c11f1a9cd330e782f08dd467583368a77ebca4fc4
    source_path: providers/opencode.md
    workflow: 16
---

OpenCode expose deux catalogues hébergés dans OpenClaw :

| Catalogue | Préfixe           | Fournisseur d’exécution |
| --------- | ----------------- | ----------------------- |
| **Zen**   | `opencode/...`    | `opencode`              |
| **Go**    | `opencode-go/...` | `opencode-go`           |

Les deux catalogues utilisent la même clé API OpenCode. OpenClaw garde les identifiants
des fournisseurs d’exécution séparés afin que le routage amont par modèle reste correct,
mais la configuration initiale et la documentation les traitent comme une seule
configuration OpenCode.

## Premiers pas

<Tabs>
  <Tab title="Catalogue Zen">
    **Idéal pour :** le proxy multi-modèle OpenCode organisé (Claude, GPT, Gemini, GLM).

    <Steps>
      <Step title="Lancer la configuration initiale">
        ```bash
        openclaw onboard --auth-choice opencode-zen
        ```

        Ou transmettez directement la clé :

        ```bash
        openclaw onboard --opencode-zen-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Définir un modèle Zen comme modèle par défaut">
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
      <Step title="Lancer la configuration initiale">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```

        Ou transmettez directement la clé :

        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Définir un modèle Go comme modèle par défaut">
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

| Propriété                | Valeur                                                                                        |
| ------------------------ | --------------------------------------------------------------------------------------------- |
| Fournisseur d’exécution  | `opencode`                                                                                    |
| Exemples de modèles      | `opencode/claude-opus-4-6`, `opencode/gpt-5.5`, `opencode/gemini-3.1-pro`, `opencode/glm-5.2` |

### Go

| Propriété                | Valeur                                                                   |
| ------------------------ | ------------------------------------------------------------------------ |
| Fournisseur d’exécution  | `opencode-go`                                                            |
| Exemples de modèles      | `opencode-go/kimi-k2.6`, `opencode-go/glm-5`, `opencode-go/minimax-m2.5` |

## Configuration avancée

<AccordionGroup>
  <Accordion title="Alias de clé API">
    `OPENCODE_ZEN_API_KEY` est également pris en charge comme alias de `OPENCODE_API_KEY`.
  </Accordion>

  <Accordion title="Identifiants partagés">
    Saisir une clé OpenCode pendant la configuration stocke les identifiants pour les deux
    fournisseurs d’exécution. Vous n’avez pas besoin d’initialiser chaque catalogue séparément.
  </Accordion>

  <Accordion title="Facturation et tableau de bord">
    Connectez-vous à OpenCode, ajoutez les informations de facturation et copiez votre clé API.
    La facturation et la disponibilité des catalogues sont gérées depuis le tableau de bord OpenCode.
  </Accordion>

  <Accordion title="Comportement de rejeu Gemini">
    Les références OpenCode adossées à Gemini restent sur le chemin proxy-Gemini, donc OpenClaw conserve
    l’assainissement des signatures de pensée Gemini à cet endroit sans activer la validation de rejeu
    Gemini native ni les réécritures d’amorçage.
  </Accordion>

  <Accordion title="Comportement de rejeu non-Gemini">
    Les références OpenCode non-Gemini conservent la politique de rejeu minimale compatible OpenAI.
  </Accordion>
</AccordionGroup>

<Tip>
Saisir une clé OpenCode pendant la configuration stocke les identifiants pour les fournisseurs
d’exécution Zen et Go, vous n’avez donc besoin d’effectuer l’initialisation qu’une seule fois.
</Tip>

## Connexe

<CardGroup cols={2}>
  <Card title="Sélection du modèle" href="/fr/concepts/model-providers" icon="layers">
    Choisir les fournisseurs, les références de modèle et le comportement de basculement.
  </Card>
  <Card title="Référence de configuration" href="/fr/gateway/configuration-reference" icon="gear">
    Référence de configuration complète pour les agents, les modèles et les fournisseurs.
  </Card>
</CardGroup>
