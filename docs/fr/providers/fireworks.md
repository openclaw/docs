---
read_when:
    - Vous voulez utiliser Fireworks avec OpenClaw
    - Vous avez besoin de la variable d’environnement de clé API Fireworks ou de l’identifiant du modèle par défaut
summary: Configuration de Fireworks (auth + sélection de modèle)
title: Fireworks
x-i18n:
    generated_at: "2026-04-22T04:26:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1b2aae346f1fb7e6d649deefe9117d8d8399c0441829cb49132ff5b86a7051ce
    source_path: providers/fireworks.md
    workflow: 15
---

# Fireworks

[Fireworks](https://fireworks.ai) expose des modèles open-weight et routés via une API compatible OpenAI. OpenClaw inclut un Plugin provider Fireworks intégré.

| Propriété | Valeur |
| ------------- | ------------------------------------------------------ |
| Provider | `fireworks` |
| Auth | `FIREWORKS_API_KEY` |
| API | chat/completions compatible OpenAI |
| Base URL | `https://api.fireworks.ai/inference/v1` |
| Modèle par défaut | `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` |

## Prise en main

<Steps>
  <Step title="Configurer l’auth Fireworks via l’onboarding">
    ```bash
    openclaw onboard --auth-choice fireworks-api-key
    ```

    Cela stocke votre clé Fireworks dans la configuration OpenClaw et définit le modèle de démarrage Fire Pass comme valeur par défaut.

  </Step>
  <Step title="Vérifier que le modèle est disponible">
    ```bash
    openclaw models list --provider fireworks
    ```
  </Step>
</Steps>

## Exemple non interactif

Pour des configurations scriptées ou CI, passez toutes les valeurs sur la ligne de commande :

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY" \
  --skip-health \
  --accept-risk
```

## Catalogue intégré

| Réf de modèle | Nom | Entrée | Contexte | Sortie max | Remarques |
| ------------------------------------------------------ | --------------------------- | ---------- | ------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fireworks/accounts/fireworks/models/kimi-k2p6` | Kimi K2.6 | text,image | 262,144 | 262,144 | Dernier modèle Kimi sur Fireworks. Le thinking est désactivé pour les requêtes Fireworks K2.6 ; passez directement par Moonshot si vous avez besoin de la sortie de thinking de Kimi. |
| `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` | Kimi K2.5 Turbo (Fire Pass) | text,image | 256,000 | 256,000 | Modèle de démarrage intégré par défaut sur Fireworks |

<Tip>
Si Fireworks publie un modèle plus récent, comme une nouvelle version de Qwen ou Gemma, vous pouvez y basculer directement en utilisant son identifiant de modèle Fireworks sans attendre une mise à jour du catalogue intégré.
</Tip>

## Identifiants de modèle Fireworks personnalisés

OpenClaw accepte aussi des identifiants de modèle Fireworks dynamiques. Utilisez l’identifiant exact du modèle ou du routeur affiché par Fireworks et préfixez-le avec `fireworks/`.

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "fireworks/accounts/fireworks/routers/kimi-k2p5-turbo",
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Fonctionnement du préfixage des identifiants de modèle">
    Chaque référence de modèle Fireworks dans OpenClaw commence par `fireworks/`, suivi de l’identifiant exact ou du chemin du routeur depuis la plateforme Fireworks. Par exemple :

    - Modèle routeur : `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`
    - Modèle direct : `fireworks/accounts/fireworks/models/<model-name>`

    OpenClaw retire le préfixe `fireworks/` lors de la construction de la requête API et envoie le chemin restant au point de terminaison Fireworks.

  </Accordion>

  <Accordion title="Remarque sur l’environnement">
    Si Gateway s’exécute en dehors de votre shell interactif, assurez-vous que `FIREWORKS_API_KEY` est également disponible pour ce processus.

    <Warning>
    Une clé présente uniquement dans `~/.profile` n’aidera pas un démon launchd/systemd à moins que cet environnement y soit aussi importé. Définissez la clé dans `~/.openclaw/.env` ou via `env.shellEnv` pour garantir que le processus Gateway puisse la lire.
    </Warning>

  </Accordion>
</AccordionGroup>

## Lié

<CardGroup cols={2}>
  <Card title="Sélection de modèle" href="/fr/concepts/model-providers" icon="layers">
    Choix des providers, références de modèles et comportement de bascule.
  </Card>
  <Card title="Dépannage" href="/fr/help/troubleshooting" icon="wrench">
    Dépannage général et FAQ.
  </Card>
</CardGroup>
