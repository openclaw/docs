---
read_when:
    - Vous souhaitez utiliser Vercel AI Gateway avec OpenClaw
    - Vous avez besoin de la variable d’environnement de clé API ou de l’option d’authentification CLI
summary: Configuration de Vercel AI Gateway (authentification + sélection de modèle)
title: Gateway IA de Vercel
x-i18n:
    generated_at: "2026-04-30T07:45:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: c3bbe498a04c2073020fcfbbe68cb506eca4c52c3274e4eca6ab7e6893fcfa56
    source_path: providers/vercel-ai-gateway.md
    workflow: 16
---

Le [Vercel AI Gateway](https://vercel.com/ai-gateway) fournit une API unifiée pour
accéder à des centaines de modèles via un seul point de terminaison.

| Propriété     | Valeur                           |
| ------------- | -------------------------------- |
| Fournisseur   | `vercel-ai-gateway`              |
| Authentification | `AI_GATEWAY_API_KEY`          |
| API           | Compatible avec Anthropic Messages |
| Catalogue de modèles | Découvert automatiquement via `/v1/models` |

<Tip>
OpenClaw découvre automatiquement le catalogue Gateway `/v1/models`, donc
`/models vercel-ai-gateway` inclut les références de modèles actuelles telles que
`vercel-ai-gateway/openai/gpt-5.5` et
`vercel-ai-gateway/moonshotai/kimi-k2.6`.
</Tip>

## Premiers pas

<Steps>
  <Step title="Définir la clé API">
    Exécutez l’intégration initiale et choisissez l’option d’authentification AI Gateway :

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

Pour les configurations scriptées ou CI, transmettez toutes les valeurs en ligne de commande :

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice ai-gateway-api-key \
  --ai-gateway-api-key "$AI_GATEWAY_API_KEY"
```

## Raccourci d’ID de modèle

OpenClaw accepte les références abrégées de modèles Claude de Vercel et les normalise à
l’exécution :

| Entrée abrégée                       | Référence de modèle normalisée                 |
| ------------------------------------ | ---------------------------------------------- |
| `vercel-ai-gateway/claude-opus-4.6`  | `vercel-ai-gateway/anthropic/claude-opus-4.6`  |
| `vercel-ai-gateway/opus-4.6`         | `vercel-ai-gateway/anthropic/claude-opus-4-6`  |

<Tip>
Vous pouvez utiliser soit le raccourci, soit la référence de modèle entièrement qualifiée dans votre
configuration. OpenClaw résout automatiquement la forme canonique.
</Tip>

## Configuration avancée

<AccordionGroup>
  <Accordion title="Variable d’environnement pour les processus daemon">
    Si l’OpenClaw Gateway s’exécute comme un daemon (launchd/systemd), assurez-vous que
    `AI_GATEWAY_API_KEY` est disponible pour ce processus.

    <Warning>
    Une clé définie uniquement dans `~/.profile` ne sera pas visible par un daemon
    launchd/systemd, sauf si cet environnement est explicitement importé. Définissez la clé dans
    `~/.openclaw/.env` ou via `env.shellEnv` pour vous assurer que le processus Gateway peut
    la lire.
    </Warning>

  </Accordion>

  <Accordion title="Routage du fournisseur">
    Vercel AI Gateway achemine les requêtes vers le fournisseur en amont en fonction du préfixe
    de référence de modèle. Par exemple, `vercel-ai-gateway/anthropic/claude-opus-4.6` est acheminé
    via Anthropic, tandis que `vercel-ai-gateway/openai/gpt-5.5` est acheminé via
    OpenAI et `vercel-ai-gateway/moonshotai/kimi-k2.6` via
    MoonshotAI. Votre unique `AI_GATEWAY_API_KEY` gère l’authentification pour tous les
    fournisseurs en amont.
  </Accordion>
  <Accordion title="Niveaux de réflexion">
    Les options `/think` suivent les préfixes de modèles en amont fiables quand OpenClaw connaît
    le contrat du fournisseur en amont. `vercel-ai-gateway/anthropic/...` utilise le
    profil de réflexion Claude, y compris les valeurs adaptatives par défaut pour les modèles Claude 4.6.
    `vercel-ai-gateway/openai/gpt-5.4`, `gpt-5.5` et les références de style Codex exposent
    `/think xhigh`, comme les fournisseurs directs OpenAI/OpenAI Codex. Les autres
    références avec espace de noms conservent les niveaux de raisonnement normaux, sauf si les métadonnées de leur catalogue
    en déclarent davantage.
  </Accordion>
</AccordionGroup>

## Articles connexes

<CardGroup cols={2}>
  <Card title="Sélection de modèles" href="/fr/concepts/model-providers" icon="layers">
    Choix des fournisseurs, des références de modèles et du comportement de basculement.
  </Card>
  <Card title="Dépannage" href="/fr/help/troubleshooting" icon="wrench">
    Dépannage général et FAQ.
  </Card>
</CardGroup>
