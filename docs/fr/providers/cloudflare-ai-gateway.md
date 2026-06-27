---
read_when:
    - Vous voulez utiliser Cloudflare AI Gateway avec OpenClaw
    - Vous avez besoin de l’ID de compte, de l’ID de Gateway ou de la variable d’environnement de clé API
summary: Configuration de Cloudflare AI Gateway (authentification + sélection du modèle)
title: Passerelle d’IA Cloudflare
x-i18n:
    generated_at: "2026-06-27T18:03:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 05678faa049349c610a9c7ea9d23958bf51927453cf6987fef397cd273f6556b
    source_path: providers/cloudflare-ai-gateway.md
    workflow: 16
---

Cloudflare AI Gateway se place devant les API des fournisseurs et vous permet d’ajouter des analyses, de la mise en cache et des contrôles. Pour Anthropic, OpenClaw utilise l’API Anthropic Messages via votre point de terminaison Gateway.

| Propriété         | Valeur                                                                                   |
| ----------------- | ---------------------------------------------------------------------------------------- |
| Fournisseur       | `cloudflare-ai-gateway`                                                                  |
| URL de base       | `https://gateway.ai.cloudflare.com/v1/<account_id>/<gateway_id>/anthropic`               |
| Modèle par défaut | `cloudflare-ai-gateway/claude-sonnet-4-6`                                                |
| Clé API           | `CLOUDFLARE_AI_GATEWAY_API_KEY` (votre clé API fournisseur pour les requêtes via le Gateway) |

<Note>
Pour les modèles Anthropic routés via Cloudflare AI Gateway, utilisez votre **clé API Anthropic** comme clé fournisseur.
</Note>

Lorsque la réflexion est activée pour les modèles Anthropic Messages, OpenClaw supprime les tours de préremplissage finaux de l’assistant avant d’envoyer la charge utile via Cloudflare AI Gateway.
Anthropic rejette le préremplissage de réponse avec la réflexion étendue, tandis que le préremplissage ordinaire sans réflexion reste disponible.

## Installer le plugin

Installez le plugin officiel, puis redémarrez Gateway :

```bash
openclaw plugins install @openclaw/cloudflare-ai-gateway-provider
openclaw gateway restart
```

## Premiers pas

<Steps>
  <Step title="Définir la clé API fournisseur et les détails du Gateway">
    Exécutez l’intégration et choisissez l’option d’authentification Cloudflare AI Gateway :

    ```bash
    openclaw onboard --auth-choice cloudflare-ai-gateway-api-key
    ```

    Cette commande vous demande votre ID de compte, votre ID de Gateway et votre clé API.

  </Step>
  <Step title="Définir un modèle par défaut">
    Ajoutez le modèle à votre configuration OpenClaw :

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "cloudflare-ai-gateway/claude-sonnet-4-6" },
        },
      },
    }
    ```

  </Step>
  <Step title="Vérifier que le modèle est disponible">
    ```bash
    openclaw models list --provider cloudflare-ai-gateway
    ```
  </Step>
</Steps>

## Exemple non interactif

Pour les configurations scriptées ou CI, transmettez toutes les valeurs sur la ligne de commande :

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice cloudflare-ai-gateway-api-key \
  --cloudflare-ai-gateway-account-id "your-account-id" \
  --cloudflare-ai-gateway-gateway-id "your-gateway-id" \
  --cloudflare-ai-gateway-api-key "$CLOUDFLARE_AI_GATEWAY_API_KEY"
```

## Configuration avancée

<AccordionGroup>
  <Accordion title="Gateways authentifiés">
    Si vous avez activé l’authentification Gateway dans Cloudflare, ajoutez l’en-tête `cf-aig-authorization`. Cela s’ajoute à votre clé API fournisseur.

    ```json5
    {
      models: {
        providers: {
          "cloudflare-ai-gateway": {
            headers: {
              "cf-aig-authorization": "Bearer <cloudflare-ai-gateway-token>",
            },
          },
        },
      },
    }
    ```

    <Tip>
    L’en-tête `cf-aig-authorization` authentifie auprès du Cloudflare Gateway lui-même, tandis que la clé API fournisseur (par exemple, votre clé Anthropic) authentifie auprès du fournisseur en amont.
    </Tip>

  </Accordion>

  <Accordion title="Note sur l’environnement">
    Si le Gateway s’exécute comme démon (launchd/systemd), assurez-vous que `CLOUDFLARE_AI_GATEWAY_API_KEY` est disponible pour ce processus.

    <Warning>
    Une clé exportée uniquement dans un shell interactif n’aidera pas un démon launchd/systemd, sauf si cet environnement y est également importé. Définissez la clé dans `~/.openclaw/.env` ou via `env.shellEnv` pour garantir que le processus Gateway puisse la lire.
    </Warning>

  </Accordion>
</AccordionGroup>

## Connexe

<CardGroup cols={2}>
  <Card title="Sélection du modèle" href="/fr/concepts/model-providers" icon="layers">
    Choix des fournisseurs, des références de modèle et du comportement de basculement.
  </Card>
  <Card title="Dépannage" href="/fr/help/troubleshooting" icon="wrench">
    Dépannage général et FAQ.
  </Card>
</CardGroup>
