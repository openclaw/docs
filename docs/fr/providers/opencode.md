---
read_when:
    - Vous souhaitez accéder à des modèles hébergés par OpenCode
    - Vous souhaitez choisir entre les catalogues Zen et Go
summary: Utiliser les catalogues OpenCode Zen et Go avec OpenClaw
title: OpenCode
x-i18n:
    generated_at: "2026-07-12T03:16:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: de287eb8a349f26c265f95b8b1de3af4035aa2bdc3501c7279f714d297bb8b9b
    source_path: providers/opencode.md
    workflow: 16
---

OpenCode expose deux catalogues hébergés dans OpenClaw :

| Catalogue | Préfixe           | Fournisseur d’exécution |
| --------- | ----------------- | ----------------------- |
| **Zen**   | `opencode/...`    | `opencode`              |
| **Go**    | `opencode-go/...` | `opencode-go`           |

Les deux catalogues partagent une même clé d’API OpenCode (`OPENCODE_API_KEY`, alias
`OPENCODE_ZEN_API_KEY`). OpenClaw conserve des identifiants de fournisseurs d’exécution distincts afin que
le routage en amont propre à chaque modèle reste correct, mais l’intégration initiale et la documentation les traitent comme
une seule configuration OpenCode.

## Prise en main

<Tabs>
  <Tab title="Catalogue Zen">
    **Idéal pour :** le proxy multimodèle OpenCode sélectionné avec soin (Claude, GPT, Gemini, GLM,
    DeepSeek, Kimi, MiniMax, Qwen).

    <Steps>
      <Step title="Exécuter l’intégration initiale">
        ```bash
        openclaw onboard --auth-choice opencode-zen
        ```

        Ou transmettez directement la clé :

        ```bash
        openclaw onboard --opencode-zen-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Définir un modèle Zen par défaut">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode/claude-opus-4-6"
        ```
      </Step>
      <Step title="Vérifier la disponibilité des modèles">
        ```bash
        openclaw models list --provider opencode
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Catalogue Go">
    **Idéal pour :** la gamme Kimi, GLM, MiniMax, Qwen et DeepSeek hébergée par OpenCode.

    <Steps>
      <Step title="Exécuter l’intégration initiale">
        ```bash
        openclaw onboard --auth-choice opencode-go
        ```

        Ou transmettez directement la clé :

        ```bash
        openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
        ```
      </Step>
      <Step title="Définir un modèle Go par défaut">
        ```bash
        openclaw config set agents.defaults.model.primary "opencode-go/kimi-k2.6"
        ```
      </Step>
      <Step title="Vérifier la disponibilité des modèles">
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

Exécutez `openclaw models list --provider opencode` pour obtenir la liste actuelle complète, qui
comprend également des entrées de l’offre gratuite telles que `opencode/big-pickle` et
`opencode/deepseek-v4-flash-free`.

### Go

| Propriété                | Valeur                                                                   |
| ------------------------ | ------------------------------------------------------------------------ |
| Fournisseur d’exécution  | `opencode-go`                                                            |
| Exemples de modèles      | `opencode-go/kimi-k2.6`, `opencode-go/glm-5`, `opencode-go/minimax-m2.5` |

Consultez [OpenCode Go](/fr/providers/opencode-go) pour obtenir le tableau complet des modèles Go.

## Configuration avancée

<AccordionGroup>
  <Accordion title="Alias de clé d’API">
    `OPENCODE_ZEN_API_KEY` est également accepté comme alias de `OPENCODE_API_KEY`.
  </Accordion>

  <Accordion title="Identifiants partagés">
    La saisie d’une seule clé OpenCode lors de la configuration enregistre les identifiants pour les deux fournisseurs
    d’exécution. Il n’est pas nécessaire d’effectuer séparément l’intégration initiale de chaque catalogue.
  </Accordion>

  <Accordion title="Obtenir une clé d’API">
    Créez un compte OpenCode et générez une clé d’API sur
    [opencode.ai/auth](https://opencode.ai/auth). La facturation et la disponibilité des catalogues
    sont gérées depuis le tableau de bord OpenCode.
  </Accordion>

  <Accordion title="Comportement de relecture de Gemini">
    Les références OpenCode reposant sur Gemini restent sur le chemin proxy Gemini. OpenClaw y conserve donc
    le nettoyage des signatures de raisonnement Gemini sans activer la validation native de la
    relecture Gemini ni la réécriture de l’amorçage.
  </Accordion>

  <Accordion title="Comportement de relecture hors Gemini">
    Les références OpenCode ne reposant pas sur Gemini conservent la politique minimale de relecture compatible avec OpenAI.
  </Accordion>
</AccordionGroup>

## Ressources connexes

<CardGroup cols={2}>
  <Card title="OpenCode Go" href="/fr/providers/opencode-go" icon="server">
    Référence complète du catalogue Go.
  </Card>
  <Card title="Sélection du modèle" href="/fr/concepts/model-providers" icon="layers">
    Choix des fournisseurs, des références de modèles et du comportement de basculement.
  </Card>
  <Card title="Référence de configuration" href="/fr/gateway/configuration-reference" icon="gear">
    Référence complète de la configuration des agents, des modèles et des fournisseurs.
  </Card>
</CardGroup>
