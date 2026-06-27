---
read_when:
    - Vous souhaitez utiliser Vercel AI Gateway avec OpenClaw
    - Vous avez besoin de la variable d’environnement de clé d’API ou du choix d’authentification CLI
summary: Configuration du Gateway Vercel AI (authentification + sélection du modèle)
title: Gateway IA Vercel
x-i18n:
    generated_at: "2026-06-27T18:07:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 27aeeeff28661839f3be55c60bf1b383b95af78e17abb77441ae4e81f58688ed
    source_path: providers/vercel-ai-gateway.md
    workflow: 16
---

Le [Vercel AI Gateway](https://vercel.com/ai-gateway) fournit une API unifiée pour
accéder à des centaines de modèles via un seul point de terminaison.

| Propriété     | Valeur                                 |
| ------------- | -------------------------------------- |
| Fournisseur   | `vercel-ai-gateway`                    |
| Package       | `@openclaw/vercel-ai-gateway-provider` |
| Authentification | `AI_GATEWAY_API_KEY`                |
| API           | Compatible avec Anthropic Messages     |
| Catalogue de modèles | Découvert automatiquement via `/v1/models` |

<Tip>
OpenClaw découvre automatiquement le catalogue `/v1/models` du Gateway, donc
`/models vercel-ai-gateway` inclut les références de modèles actuelles comme
`vercel-ai-gateway/openai/gpt-5.5` et
`vercel-ai-gateway/moonshotai/kimi-k2.6`.
</Tip>

## Bien démarrer

<Steps>
  <Step title="Installer le Plugin">
    ```bash
    openclaw plugins install @openclaw/vercel-ai-gateway-provider
    ```
  </Step>
  <Step title="Définir la clé API">
    Exécutez l’onboarding et choisissez l’option d’authentification AI Gateway :

    ```bash
    openclaw onboard --auth-choice ai-gateway-api-key
    ```

  </Step>
  <Step title="Définir un modèle par défaut">
    Ajoutez le modèle à votre configuration OpenClaw :

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

Pour les configurations scriptées ou CI, passez toutes les valeurs sur la ligne de commande :

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice ai-gateway-api-key \
  --ai-gateway-api-key "$AI_GATEWAY_API_KEY"
```

## Raccourci d’ID de modèle

OpenClaw accepte les références abrégées de modèles Vercel Claude et les normalise à
l’exécution :

| Entrée abrégée                     | Référence de modèle normalisée                 |
| ----------------------------------- | --------------------------------------------- |
| `vercel-ai-gateway/claude-opus-4.6` | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| `vercel-ai-gateway/opus-4.6`        | `vercel-ai-gateway/anthropic/claude-opus-4-6` |

<Tip>
Vous pouvez utiliser la référence abrégée ou la référence de modèle entièrement qualifiée dans votre
configuration. OpenClaw résout automatiquement la forme canonique.
</Tip>

## Configuration avancée

<AccordionGroup>
  <Accordion title="Variable d’environnement pour les processus démons">
    Si le Gateway OpenClaw s’exécute comme un démon (launchd/systemd), assurez-vous que
    `AI_GATEWAY_API_KEY` est disponible pour ce processus.

    <Warning>
    Une clé exportée uniquement dans un shell interactif ne sera pas visible par un
    démon launchd/systemd, sauf si cet environnement est explicitement importé. Définissez
    la clé dans `~/.openclaw/.env` ou via `env.shellEnv` afin de garantir que le processus
    Gateway puisse la lire.
    </Warning>

  </Accordion>

  <Accordion title="Routage du fournisseur">
    Vercel AI Gateway achemine les requêtes vers le fournisseur amont en fonction du préfixe
    de la référence de modèle. Par exemple, `vercel-ai-gateway/anthropic/claude-opus-4.6` passe
    par Anthropic, tandis que `vercel-ai-gateway/openai/gpt-5.5` passe par
    OpenAI et `vercel-ai-gateway/moonshotai/kimi-k2.6` passe par
    MoonshotAI. Votre unique `AI_GATEWAY_API_KEY` gère l’authentification pour tous
    les fournisseurs amont.
  </Accordion>
  <Accordion title="Niveaux de réflexion">
    Les options `/think` suivent les préfixes de modèles amont approuvés lorsque OpenClaw connaît
    le contrat du fournisseur amont. `vercel-ai-gateway/anthropic/...` utilise le
    profil de réflexion Claude, y compris les valeurs adaptatives par défaut pour les modèles Claude 4.6.
    `vercel-ai-gateway/openai/gpt-5.4`, `gpt-5.5` et les références de style Codex exposent
    `/think xhigh` comme les fournisseurs directs OpenAI/OpenAI Codex. Les autres
    références avec espace de noms conservent les niveaux de raisonnement normaux, sauf si les métadonnées
    de leur catalogue en déclarent davantage.
  </Accordion>
</AccordionGroup>

## Associé

<CardGroup cols={2}>
  <Card title="Sélection du modèle" href="/fr/concepts/model-providers" icon="layers">
    Choisir les fournisseurs, les références de modèles et le comportement de basculement.
  </Card>
  <Card title="Dépannage" href="/fr/help/troubleshooting" icon="wrench">
    Dépannage général et FAQ.
  </Card>
</CardGroup>
