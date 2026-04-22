---
read_when:
    - Vous voulez utiliser Vercel AI Gateway avec OpenClaw
    - Vous avez besoin de la variable d’environnement de clé API ou du choix d’auth CLI
summary: Configuration de Vercel AI Gateway (auth + sélection de modèle)
title: Vercel AI Gateway
x-i18n:
    generated_at: "2026-04-22T04:27:33Z"
    model: gpt-5.4
    provider: openai
    source_hash: 11c0f764d4c35633d0fbfc189bae0fc451dc799002fc1a6d0c84fc73842bbe31
    source_path: providers/vercel-ai-gateway.md
    workflow: 15
---

# Vercel AI Gateway

La [Vercel AI Gateway](https://vercel.com/ai-gateway) fournit une API unifiée pour
accéder à des centaines de modèles via un point de terminaison unique.

| Propriété     | Valeur                          |
| ------------- | ------------------------------- |
| Provider      | `vercel-ai-gateway`             |
| Auth          | `AI_GATEWAY_API_KEY`            |
| API           | Compatible Anthropic Messages   |
| Catalogue de modèles | Découvert automatiquement via `/v1/models` |

<Tip>
OpenClaw découvre automatiquement le catalogue `/v1/models` de la Gateway, donc
`/models vercel-ai-gateway` inclut les références de modèle actuelles comme
`vercel-ai-gateway/openai/gpt-5.4` et
`vercel-ai-gateway/moonshotai/kimi-k2.6`.
</Tip>

## Démarrage

<Steps>
  <Step title="Définir la clé API">
    Exécutez l’onboarding et choisissez l’option d’auth AI Gateway :

    ```bash
    openclaw onboard --auth-choice ai-gateway-api-key
    ```

  </Step>
  <Step title="Définir un modèle par défaut">
    Ajoutez le modèle à votre configuration OpenClaw :

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "vercel-ai-gateway/anthropic/claude-opus-4.6" },
        },
      },
    }
    ```

  </Step>
  <Step title="Vérifier que le modèle est disponible">
    ```bash
    openclaw models list --provider vercel-ai-gateway
    ```
  </Step>
</Steps>

## Exemple non interactif

Pour les configurations scriptées ou CI, passez toutes les valeurs sur la ligne de commande :

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice ai-gateway-api-key \
  --ai-gateway-api-key "$AI_GATEWAY_API_KEY"
```

## Forme abrégée des ID de modèle

OpenClaw accepte les références de modèle Claude abrégées de Vercel et les normalise à
l’exécution :

| Entrée abrégée                      | Référence de modèle normalisée                |
| ----------------------------------- | --------------------------------------------- |
| `vercel-ai-gateway/claude-opus-4.6` | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| `vercel-ai-gateway/opus-4.6`        | `vercel-ai-gateway/anthropic/claude-opus-4-6` |

<Tip>
Vous pouvez utiliser soit la forme abrégée, soit la référence de modèle pleinement qualifiée dans votre
configuration. OpenClaw résout automatiquement la forme canonique.
</Tip>

## Notes avancées

<AccordionGroup>
  <Accordion title="Variable d’environnement pour les processus daemon">
    Si la Gateway OpenClaw s’exécute en daemon (launchd/systemd), assurez-vous que
    `AI_GATEWAY_API_KEY` est disponible pour ce processus.

    <Warning>
    Une clé définie uniquement dans `~/.profile` ne sera pas visible par un daemon launchd/systemd
    à moins que cet environnement ne soit explicitement importé. Définissez la clé dans
    `~/.openclaw/.env` ou via `env.shellEnv` pour garantir que le processus gateway peut
    la lire.
    </Warning>

  </Accordion>

  <Accordion title="Routage provider">
    Vercel AI Gateway route les requêtes vers le provider amont en fonction du préfixe de la
    référence de modèle. Par exemple, `vercel-ai-gateway/anthropic/claude-opus-4.6` route
    via Anthropic, tandis que `vercel-ai-gateway/openai/gpt-5.4` route via
    OpenAI et `vercel-ai-gateway/moonshotai/kimi-k2.6` route via
    MoonshotAI. Votre unique `AI_GATEWAY_API_KEY` gère l’authentification pour tous les
    providers amont.
  </Accordion>
</AccordionGroup>

## Liens associés

<CardGroup cols={2}>
  <Card title="Sélection du modèle" href="/fr/concepts/model-providers" icon="layers">
    Choisir les providers, les références de modèle et le comportement de basculement.
  </Card>
  <Card title="Dépannage" href="/fr/help/troubleshooting" icon="wrench">
    Dépannage général et FAQ.
  </Card>
</CardGroup>
