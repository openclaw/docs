---
read_when:
    - Vous souhaitez utiliser Volcengine ou des modèles Doubao avec OpenClaw
    - Vous avez besoin de la configuration de la clé API Volcengine
summary: Configuration de Volcengine (modèles Doubao, points de terminaison généraux + coding)
title: Volcengine (Doubao)
x-i18n:
    generated_at: "2026-04-23T07:10:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4d803e965699bedf06cc7ea4e902ffc92e4a168be012224e845820069fd67acc
    source_path: providers/volcengine.md
    workflow: 15
---

# Volcengine (Doubao)

Le fournisseur Volcengine donne accès aux modèles Doubao et aux modèles tiers
hébergés sur Volcengine, avec des points de terminaison distincts pour les charges générales et
de code.

| Détail    | Valeur                                              |
| --------- | --------------------------------------------------- |
| Fournisseurs | `volcengine` (général) + `volcengine-plan` (coding) |
| Auth      | `VOLCANO_ENGINE_API_KEY`                            |
| API       | Compatible OpenAI                                   |

## Bien démarrer

<Steps>
  <Step title="Définir la clé API">
    Lancez l’onboarding interactif :

    ```bash
    openclaw onboard --auth-choice volcengine-api-key
    ```

    Cela enregistre à la fois les fournisseurs général (`volcengine`) et coding (`volcengine-plan`) à partir d’une seule clé API.

  </Step>
  <Step title="Définir un modèle par défaut">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "volcengine-plan/ark-code-latest" },
        },
      },
    }
    ```
  </Step>
  <Step title="Vérifier que le modèle est disponible">
    ```bash
    openclaw models list --provider volcengine
    openclaw models list --provider volcengine-plan
    ```
  </Step>
</Steps>

<Tip>
Pour une configuration non interactive (CI, scripting), passez directement la clé :

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice volcengine-api-key \
  --volcengine-api-key "$VOLCANO_ENGINE_API_KEY"
```

</Tip>

## Fournisseurs et points de terminaison

| Fournisseur       | Point de terminaison                       | Cas d’usage      |
| ----------------- | ----------------------------------------- | ---------------- |
| `volcengine`      | `ark.cn-beijing.volces.com/api/v3`        | Modèles généraux |
| `volcengine-plan` | `ark.cn-beijing.volces.com/api/coding/v3` | Modèles de code  |

<Note>
Les deux fournisseurs sont configurés à partir d’une seule clé API. La configuration enregistre automatiquement les deux.
</Note>

## Modèles disponibles

<Tabs>
  <Tab title="Général (volcengine)">
    | Référence de modèle                           | Nom                             | Entrée      | Contexte |
    | --------------------------------------------- | ------------------------------- | ----------- | -------- |
    | `volcengine/doubao-seed-1-8-251228`          | Doubao Seed 1.8                 | text, image | 256,000 |
    | `volcengine/doubao-seed-code-preview-251028` | doubao-seed-code-preview-251028 | text, image | 256,000 |
    | `volcengine/kimi-k2-5-260127`                | Kimi K2.5                       | text, image | 256,000 |
    | `volcengine/glm-4-7-251222`                  | GLM 4.7                         | text, image | 200,000 |
    | `volcengine/deepseek-v3-2-251201`            | DeepSeek V3.2                   | text, image | 128,000 |
  </Tab>
  <Tab title="Coding (volcengine-plan)">
    | Référence de modèle                                | Nom                      | Entrée | Contexte |
    | -------------------------------------------------- | ------------------------ | ------ | -------- |
    | `volcengine-plan/ark-code-latest`                 | Ark Coding Plan          | text   | 256,000 |
    | `volcengine-plan/doubao-seed-code`                | Doubao Seed Code         | text   | 256,000 |
    | `volcengine-plan/glm-4.7`                         | GLM 4.7 Coding           | text   | 200,000 |
    | `volcengine-plan/kimi-k2-thinking`                | Kimi K2 Thinking         | text   | 256,000 |
    | `volcengine-plan/kimi-k2.5`                       | Kimi K2.5 Coding         | text   | 256,000 |
    | `volcengine-plan/doubao-seed-code-preview-251028` | Doubao Seed Code Preview | text   | 256,000 |
  </Tab>
</Tabs>

## Remarques avancées

<AccordionGroup>
  <Accordion title="Modèle par défaut après l’onboarding">
    `openclaw onboard --auth-choice volcengine-api-key` définit actuellement
    `volcengine-plan/ark-code-latest` comme modèle par défaut tout en enregistrant aussi
    le catalogue général `volcengine`.
  </Accordion>

  <Accordion title="Comportement de repli du sélecteur de modèle">
    Pendant la sélection du modèle dans onboarding/configure, le choix d’authentification Volcengine privilégie
    à la fois les lignes `volcengine/*` et `volcengine-plan/*`. Si ces modèles ne sont pas
    encore chargés, OpenClaw revient au catalogue non filtré au lieu d’afficher un
    sélecteur vide limité au fournisseur.
  </Accordion>

  <Accordion title="Variables d’environnement pour les processus daemon">
    Si le Gateway s’exécute comme daemon (launchd/systemd), assurez-vous que
    `VOLCANO_ENGINE_API_KEY` est disponible pour ce processus (par exemple dans
    `~/.openclaw/.env` ou via `env.shellEnv`).
  </Accordion>
</AccordionGroup>

<Warning>
Lorsque vous exécutez OpenClaw comme service en arrière-plan, les variables d’environnement définies dans votre
shell interactif ne sont pas automatiquement héritées. Voir la remarque ci-dessus sur les daemons.
</Warning>

## Liens associés

<CardGroup cols={2}>
  <Card title="Sélection de modèle" href="/fr/concepts/model-providers" icon="layers">
    Choisir des fournisseurs, des références de modèles et le comportement de repli.
  </Card>
  <Card title="Configuration" href="/fr/gateway/configuration" icon="gear">
    Référence complète de configuration pour les agents, les modèles et les fournisseurs.
  </Card>
  <Card title="Dépannage" href="/fr/help/troubleshooting" icon="wrench">
    Problèmes courants et étapes de débogage.
  </Card>
  <Card title="FAQ" href="/fr/help/faq" icon="circle-question">
    Questions fréquentes sur la configuration d’OpenClaw.
  </Card>
</CardGroup>
