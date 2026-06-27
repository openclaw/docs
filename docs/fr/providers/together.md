---
read_when:
    - Vous voulez utiliser Together AI avec OpenClaw
    - Vous avez besoin de la variable d’environnement de clé API ou du choix d’authentification CLI
summary: Configuration de Together AI (authentification + sélection du modèle)
title: Together AI
x-i18n:
    generated_at: "2026-06-27T18:07:37Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a1f803ae88828a775d93dcf8b0b62e70b1dbd0cf963639121e2995fabfcd280b
    source_path: providers/together.md
    workflow: 16
---

[Together AI](https://together.ai) fournit l’accès à des modèles open source de premier plan, notamment Llama, DeepSeek, Kimi et d’autres, via une API unifiée.

| Propriété | Valeur                        |
| --------- | ----------------------------- |
| Fournisseur | `together`                  |
| Authentification | `TOGETHER_API_KEY`     |
| API       | compatible OpenAI             |
| URL de base | `https://api.together.xyz/v1` |

## Premiers pas

<Steps>
  <Step title="Obtenir une clé API">
    Créez une clé API sur
    [api.together.ai/settings/api-keys](https://api.together.ai/settings/api-keys).
  </Step>
  <Step title="Exécuter l’onboarding">
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
Le préréglage d’onboarding définit
`together/meta-llama/Llama-3.3-70B-Instruct-Turbo` comme modèle par défaut.
</Note>

## Catalogue intégré

OpenClaw fournit ce catalogue Together intégré :

| Réf. de modèle                                    | Nom                          | Entrée      | Contexte | Notes                |
| -------------------------------------------------- | ---------------------------- | ----------- | -------- | -------------------- |
| `together/meta-llama/Llama-3.3-70B-Instruct-Turbo` | Llama 3.3 70B Instruct Turbo | texte       | 131,072  | Modèle par défaut    |
| `together/moonshotai/Kimi-K2.6`                    | Kimi K2.6 FP4                | texte, image | 262,144 | Modèle de raisonnement Kimi |
| `together/deepseek-ai/DeepSeek-V4-Pro`             | DeepSeek V4 Pro              | texte       | 512,000  | Modèle de texte de raisonnement |
| `together/Qwen/Qwen2.5-7B-Instruct-Turbo`          | Qwen2.5 7B Instruct Turbo    | texte       | 32,768   | Modèle de texte rapide |
| `together/zai-org/GLM-5.1`                         | GLM 5.1 FP4                  | texte       | 202,752  | Modèle de texte de raisonnement |

## Génération vidéo

Le Plugin `together` intégré enregistre également la génération vidéo via l’outil partagé `video_generate`.

| Propriété            | Valeur                                                                   |
| -------------------- | ------------------------------------------------------------------------ |
| Modèle vidéo par défaut | `together/Wan-AI/Wan2.2-T2V-A14B`                                     |
| Modes                | texte vers vidéo ; référence à image unique seulement avec `Wan-AI/Wan2.2-I2V-A14B` |
| Paramètres pris en charge | `aspectRatio`, `resolution`                                        |

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
Consultez [Génération vidéo](/fr/tools/video-generation) pour les paramètres de l’outil partagé, la sélection du fournisseur et le comportement de basculement.
</Tip>

<AccordionGroup>
  <Accordion title="Note sur l’environnement">
    Si le Gateway s’exécute comme un démon (launchd/systemd), assurez-vous que
    `TOGETHER_API_KEY` est disponible pour ce processus (par exemple, dans
    `~/.openclaw/.env` ou via `env.shellEnv`).

    <Warning>
    Les clés définies uniquement dans votre shell interactif ne sont pas visibles par les processus Gateway gérés par un démon. Utilisez la configuration `~/.openclaw/.env` ou `env.shellEnv` pour une disponibilité persistante.
    </Warning>

  </Accordion>

  <Accordion title="Dépannage">
    - Vérifiez que votre clé fonctionne : `openclaw models list --provider together`
    - Si les modèles n’apparaissent pas, confirmez que la clé API est définie dans le bon environnement pour votre processus Gateway.
    - Les références de modèle utilisent la forme `together/<model-id>`.

  </Accordion>
</AccordionGroup>

## Associé

<CardGroup cols={2}>
  <Card title="Sélection du modèle" href="/fr/concepts/model-providers" icon="layers">
    Règles des fournisseurs, références de modèles et comportement de basculement.
  </Card>
  <Card title="Génération vidéo" href="/fr/tools/video-generation" icon="video">
    Paramètres de l’outil partagé de génération vidéo et sélection du fournisseur.
  </Card>
  <Card title="Référence de configuration" href="/fr/gateway/configuration-reference" icon="gear">
    Schéma de configuration complet, y compris les paramètres des fournisseurs.
  </Card>
  <Card title="Together AI" href="https://together.ai" icon="arrow-up-right-from-square">
    Tableau de bord Together AI, documentation de l’API et tarification.
  </Card>
</CardGroup>
