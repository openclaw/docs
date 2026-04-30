---
read_when:
    - Vous voulez utiliser Together AI avec OpenClaw
    - Vous devez fournir la variable d’environnement de clé API ou choisir l’authentification CLI
summary: Configuration de Together AI (authentification + sélection du modèle)
title: Together AI
x-i18n:
    generated_at: "2026-04-30T07:45:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: a7713c0b1e64014bbdd87a120de0a950b583afd1481338f2c6cccfb2b7da76e7
    source_path: providers/together.md
    workflow: 16
---

[Together AI](https://together.ai) donne accès à des modèles open source de premier plan, notamment Llama, DeepSeek, Kimi et d’autres, via une API unifiée.

| Propriété | Valeur                        |
| --------- | ----------------------------- |
| Fournisseur | `together`                    |
| Authentification | `TOGETHER_API_KEY`            |
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
          model: { primary: "together/moonshotai/Kimi-K2.5" },
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
Le préréglage d’onboarding définit `together/moonshotai/Kimi-K2.5` comme modèle
par défaut.
</Note>

## Catalogue intégré

OpenClaw inclut ce catalogue Together groupé :

| Réf. de modèle                                             | Nom                                    | Entrée      | Contexte   | Notes                            |
| ---------------------------------------------------------- | -------------------------------------- | ----------- | ---------- | -------------------------------- |
| `together/moonshotai/Kimi-K2.5`                            | Kimi K2.5                              | texte, image | 262,144    | Modèle par défaut ; raisonnement activé |
| `together/zai-org/GLM-4.7`                                 | GLM 4.7 Fp8                            | texte       | 202,752    | Modèle de texte polyvalent       |
| `together/meta-llama/Llama-3.3-70B-Instruct-Turbo`         | Llama 3.3 70B Instruct Turbo           | texte       | 131,072    | Modèle d’instructions rapide     |
| `together/meta-llama/Llama-4-Scout-17B-16E-Instruct`       | Llama 4 Scout 17B 16E Instruct         | texte, image | 10,000,000 | Multimodal                       |
| `together/meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8` | Llama 4 Maverick 17B 128E Instruct FP8 | texte, image | 20,000,000 | Multimodal                       |
| `together/deepseek-ai/DeepSeek-V3.1`                       | DeepSeek V3.1                          | texte       | 131,072    | Modèle de texte général          |
| `together/deepseek-ai/DeepSeek-R1`                         | DeepSeek R1                            | texte       | 131,072    | Modèle de raisonnement           |
| `together/moonshotai/Kimi-K2-Instruct-0905`                | Kimi K2-Instruct 0905                  | texte       | 262,144    | Modèle de texte Kimi secondaire  |

## Génération vidéo

Le Plugin `together` groupé enregistre également la génération vidéo via l’outil
partagé `video_generate`.

| Propriété             | Valeur                                |
| --------------------- | ------------------------------------- |
| Modèle vidéo par défaut | `together/Wan-AI/Wan2.2-T2V-A14B`     |
| Modes                 | texte vers vidéo, référence à image unique |
| Paramètres pris en charge | `aspectRatio`, `resolution`           |

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
Consultez [Génération vidéo](/fr/tools/video-generation) pour les paramètres de l’outil partagé,
la sélection du fournisseur et le comportement de basculement.
</Tip>

<AccordionGroup>
  <Accordion title="Note sur l’environnement">
    Si le Gateway s’exécute comme un daemon (launchd/systemd), assurez-vous que
    `TOGETHER_API_KEY` est disponible pour ce processus (par exemple, dans
    `~/.openclaw/.env` ou via `env.shellEnv`).

    <Warning>
    Les clés définies uniquement dans votre shell interactif ne sont pas visibles par les processus
    gateway gérés par un daemon. Utilisez `~/.openclaw/.env` ou la configuration `env.shellEnv` pour
    une disponibilité persistante.
    </Warning>

  </Accordion>

  <Accordion title="Dépannage">
    - Vérifiez que votre clé fonctionne : `openclaw models list --provider together`
    - Si les modèles n’apparaissent pas, confirmez que la clé API est définie dans le bon
      environnement pour votre processus Gateway.
    - Les références de modèle utilisent la forme `together/<model-id>`.

  </Accordion>
</AccordionGroup>

## Voir aussi

<CardGroup cols={2}>
  <Card title="Sélection du modèle" href="/fr/concepts/model-providers" icon="layers">
    Règles de fournisseur, références de modèle et comportement de basculement.
  </Card>
  <Card title="Génération vidéo" href="/fr/tools/video-generation" icon="video">
    Paramètres de l’outil de génération vidéo partagé et sélection du fournisseur.
  </Card>
  <Card title="Référence de configuration" href="/fr/gateway/configuration-reference" icon="gear">
    Schéma de configuration complet incluant les paramètres de fournisseur.
  </Card>
  <Card title="Together AI" href="https://together.ai" icon="arrow-up-right-from-square">
    Tableau de bord Together AI, documentation de l’API et tarifs.
  </Card>
</CardGroup>
