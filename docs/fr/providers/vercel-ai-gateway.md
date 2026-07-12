---
read_when:
    - Vous souhaitez utiliser Vercel AI Gateway avec OpenClaw
    - Vous devez fournir la variable d’environnement de la clé API ou choisir l’authentification via la CLI
summary: Configuration de Vercel AI Gateway (authentification + sélection du modèle)
title: Gateway IA de Vercel
x-i18n:
    generated_at: "2026-07-12T03:17:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c1e4776604491900a914e75caebfd7e27a81e9f859213f5bd5b25582a923d92a
    source_path: providers/vercel-ai-gateway.md
    workflow: 16
---

Le [Gateway IA de Vercel](https://vercel.com/ai-gateway) fournit une API unifiée permettant
d’accéder à des centaines de modèles par l’intermédiaire d’un point de terminaison unique.

| Propriété            | Valeur                                 |
| -------------------- | -------------------------------------- |
| Fournisseur          | `vercel-ai-gateway`                    |
| Paquet               | `@openclaw/vercel-ai-gateway-provider` |
| Authentification     | `AI_GATEWAY_API_KEY`                   |
| API                  | Compatible avec Anthropic Messages     |
| URL de base          | `https://ai-gateway.vercel.sh`         |
| Catalogue de modèles | Détecté automatiquement via `/v1/models` |

<Tip>
OpenClaw détecte automatiquement le catalogue `/v1/models` du Gateway. Ainsi, la
commande de discussion `/models vercel-ai-gateway` et la commande
`openclaw models list --provider vercel-ai-gateway` incluent les références de modèles
actuelles, telles que `vercel-ai-gateway/openai/gpt-5.5` et
`vercel-ai-gateway/moonshotai/kimi-k2.6`.
</Tip>

## Prise en main

<Steps>
  <Step title="Installer le plugin">
    ```bash
    openclaw plugins install @openclaw/vercel-ai-gateway-provider
    ```
  </Step>
  <Step title="Définir la clé API">
    ```bash
    openclaw onboard --auth-choice ai-gateway-api-key
    ```
  </Step>
  <Step title="Définir un modèle par défaut">
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

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice ai-gateway-api-key \
  --ai-gateway-api-key "$AI_GATEWAY_API_KEY"
```

## Forme abrégée des identifiants de modèle

OpenClaw normalise à l’exécution les références abrégées des modèles Claude :

| Saisie abrégée                      | Référence de modèle normalisée                |
| ----------------------------------- | --------------------------------------------- |
| `vercel-ai-gateway/claude-opus-4.6` | `vercel-ai-gateway/anthropic/claude-opus-4.6` |
| `vercel-ai-gateway/opus-4.6`        | `vercel-ai-gateway/anthropic/claude-opus-4-6` |

<Tip>
Vous pouvez utiliser l’une ou l’autre forme dans votre configuration ; OpenClaw résout
automatiquement la référence canonique `anthropic/...`.
</Tip>

## Configuration avancée

<AccordionGroup>
  <Accordion title="Variable d’environnement pour les processus démons">
    Si le Gateway OpenClaw s’exécute en tant que démon (launchd/systemd), assurez-vous
    que `AI_GATEWAY_API_KEY` est accessible à ce processus.

    <Warning>
    Une clé exportée uniquement dans un shell interactif ne sera pas visible par un
    démon launchd/systemd, sauf si cet environnement est explicitement importé. Définissez
    la clé dans `~/.openclaw/.env` ou via `env.shellEnv` afin que le processus du Gateway
    puisse la lire.
    </Warning>

  </Accordion>

  <Accordion title="Routage des fournisseurs">
    Le Gateway IA de Vercel achemine chaque requête vers le fournisseur en amont nommé dans le
    préfixe de la référence du modèle. Par exemple, `vercel-ai-gateway/anthropic/claude-opus-4.6`
    est acheminé via Anthropic, `vercel-ai-gateway/openai/gpt-5.5` via
    OpenAI et `vercel-ai-gateway/moonshotai/kimi-k2.6` via
    MoonshotAI. Une seule clé `AI_GATEWAY_API_KEY` authentifie tous les fournisseurs en amont.
  </Accordion>
  <Accordion title="Niveaux de réflexion">
    Les options de `/think` suivent le préfixe du modèle en amont lorsqu’OpenClaw le
    reconnaît. `vercel-ai-gateway/anthropic/...` utilise le profil de réflexion Claude,
    notamment la valeur adaptative par défaut pour les modèles Claude 4.6. Les références fiables
    `vercel-ai-gateway/openai/...` (`gpt-5.2` et versions ultérieures, ainsi que les variantes
    Codex jusqu’à `gpt-5.1-codex`) proposent `/think xhigh`. Les autres références avec espace de noms
    conservent les niveaux de raisonnement standard, sauf si les métadonnées de leur catalogue
    en déclarent davantage.
  </Accordion>
</AccordionGroup>

## Ressources associées

<CardGroup cols={2}>
  <Card title="Sélection du modèle" href="/fr/concepts/model-providers" icon="layers">
    Choix des fournisseurs, des références de modèles et du comportement de basculement.
  </Card>
  <Card title="Dépannage" href="/fr/help/troubleshooting" icon="wrench">
    Dépannage général et FAQ.
  </Card>
</CardGroup>
