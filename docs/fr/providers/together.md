---
read_when:
    - Vous souhaitez utiliser Together AI avec OpenClaw
    - Vous avez besoin de la variable d’environnement de clé API ou de l’option d’authentification de la CLI
summary: Configuration de Together AI (authentification + sélection du modèle)
title: Together AI
x-i18n:
    generated_at: "2026-07-12T03:02:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0860ac6e8092bb4eb48d3c0d348d5c42f538e0316d2fa22a99cbb3a9851b1185
    source_path: providers/together.md
    workflow: 16
---

[Together AI](https://together.ai) donne accès aux principaux modèles open source,
notamment Llama, DeepSeek, Kimi et bien d’autres, au moyen d’une API unifiée.
OpenClaw l’intègre en tant que fournisseur `together`.

| Propriété   | Valeur                        |
| ----------- | ----------------------------- |
| Fournisseur | `together`                    |
| Auth        | `TOGETHER_API_KEY`            |
| API         | Compatible avec OpenAI        |
| URL de base | `https://api.together.xyz/v1` |

## Prise en main

<Steps>
  <Step title="Obtenir une clé d’API">
    Créez une clé d’API sur
    [api.together.ai/settings/api-keys](https://api.together.ai/settings/api-keys).
  </Step>
  <Step title="Exécuter l’intégration initiale">
    ```bash
    openclaw onboard --auth-choice together-api-key
    ```
  </Step>
  <Step title="Définir un modèle par défaut">
    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "together/meta-llama/Llama-3.3-70B-Instruct-Turbo",
          },
        },
      },
    }
    ```
  </Step>
</Steps>

### Exemple non interactif

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice together-api-key \
  --together-api-key "$TOGETHER_API_KEY"
```

<Note>
L’intégration initiale définit `together/meta-llama/Llama-3.3-70B-Instruct-Turbo`
comme modèle par défaut.
</Note>

## Catalogue intégré

Le coût est indiqué en USD par million de jetons.

| Référence du modèle                                | Nom                          | Entrée      | Contexte | Sortie maximale | Coût (entrée/sortie) | Remarques                    |
| -------------------------------------------------- | ---------------------------- | ----------- | -------- | --------------- | -------------------- | ---------------------------- |
| `together/meta-llama/Llama-3.3-70B-Instruct-Turbo` | Llama 3.3 70B Instruct Turbo | texte       | 131 072  | 8 192           | 0,88 / 0,88          | Modèle par défaut            |
| `together/moonshotai/Kimi-K2.6`                    | Kimi K2.6 FP4                | texte, image | 262 144 | 32 768          | 1,20 / 4,50          | Modèle de raisonnement       |
| `together/deepseek-ai/DeepSeek-V4-Pro`             | DeepSeek V4 Pro              | texte       | 512 000  | 8 192           | 2,10 / 4,40          | Modèle de raisonnement       |
| `together/Qwen/Qwen2.5-7B-Instruct-Turbo`          | Qwen2.5 7B Instruct Turbo    | texte       | 32 768   | 8 192           | 0,30 / 0,30          | Rapide, sans raisonnement    |
| `together/zai-org/GLM-5.1`                         | GLM 5.1 FP4                  | texte       | 202 752  | 8 192           | 1,40 / 4,40          | Modèle de raisonnement       |

## Génération vidéo

Le plugin `together` intégré enregistre également la génération vidéo au moyen
de l’outil partagé `video_generate`.

| Propriété                 | Valeur                                                                                                          |
| ------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Modèle vidéo par défaut   | `Wan-AI/Wan2.2-T2V-A14B`                                                                                       |
| Autres modèles            | `Wan-AI/Wan2.2-I2V-A14B`, `minimax/Hailuo-02`, `Kwai/Kling-2.1-Master`                                         |
| Modes                     | texte vers vidéo ; image vers vidéo uniquement avec `Wan-AI/Wan2.2-I2V-A14B` (une seule image de référence)    |
| Durée                     | 1 à 10 secondes                                                                                                |
| Paramètres pris en charge | `size` (analysé au format `<width>x<height>`) ; `aspectRatio`/`resolution` ne sont pas lus                      |

Pour utiliser Together comme fournisseur vidéo par défaut :

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "together/Wan-AI/Wan2.2-T2V-A14B",
      },
    },
  },
}
```

<Tip>
Consultez [Génération vidéo](/fr/tools/video-generation) pour connaître les paramètres
de l’outil partagé, la sélection du fournisseur et le comportement de basculement.
</Tip>

<AccordionGroup>
  <Accordion title="Remarque sur l’environnement">
    Si le Gateway s’exécute en tant que démon (launchd/systemd), assurez-vous que
    `TOGETHER_API_KEY` est accessible à ce processus (par exemple dans
    `~/.openclaw/.env` ou au moyen de `env.shellEnv`).

    <Warning>
    Les clés définies uniquement dans votre shell interactif ne sont pas visibles
    par les processus Gateway gérés en tant que démons. Utilisez la configuration
    `~/.openclaw/.env` ou `env.shellEnv` pour garantir leur disponibilité persistante.
    </Warning>

  </Accordion>

  <Accordion title="Dépannage">
    - Vérifiez que votre clé fonctionne : `openclaw models list --provider together`
    - Si les modèles n’apparaissent pas, vérifiez que la clé d’API est définie dans
      l’environnement approprié pour votre processus Gateway.
    - Les références de modèles utilisent le format `together/<model-id>`.

  </Accordion>
</AccordionGroup>

## Contenu associé

<CardGroup cols={2}>
  <Card title="Fournisseurs de modèles" href="/fr/concepts/model-providers" icon="layers">
    Règles des fournisseurs, références de modèles et comportement de basculement.
  </Card>
  <Card title="Génération vidéo" href="/fr/tools/video-generation" icon="video">
    Paramètres de l’outil partagé de génération vidéo et sélection du fournisseur.
  </Card>
  <Card title="Référence de configuration" href="/fr/gateway/configuration-reference" icon="gear">
    Schéma de configuration complet, y compris les paramètres des fournisseurs.
  </Card>
  <Card title="Together AI" href="https://together.ai" icon="arrow-up-right-from-square">
    Tableau de bord, documentation de l’API et tarification de Together AI.
  </Card>
</CardGroup>
