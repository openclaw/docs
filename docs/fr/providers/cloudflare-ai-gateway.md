---
read_when:
    - Vous souhaitez utiliser Cloudflare AI Gateway avec OpenClaw
    - Vous avez besoin de l’ID de compte, de l’ID de Gateway ou de la variable d’environnement de clé API
summary: Configuration de Cloudflare AI Gateway (authentification + sélection du modèle)
title: Gateway d’IA Cloudflare
x-i18n:
    generated_at: "2026-04-30T07:43:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7c567076a5b3fea0f09f44d772c0858aed2a4813f91f1cc9f87b0da39c2e5db
    source_path: providers/cloudflare-ai-gateway.md
    workflow: 16
---

Cloudflare AI Gateway se place devant les API des fournisseurs et vous permet d’ajouter des analytics, de la mise en cache et des contrôles. Pour Anthropic, OpenClaw utilise l’API Messages d’Anthropic via votre point de terminaison Gateway.

| Propriété     | Valeur                                                                                   |
| ------------- | ---------------------------------------------------------------------------------------- |
| Fournisseur   | `cloudflare-ai-gateway`                                                                  |
| URL de base   | `https://gateway.ai.cloudflare.com/v1/<account_id>/<gateway_id>/anthropic`               |
| Modèle par défaut | `cloudflare-ai-gateway/claude-sonnet-4-6`                                            |
| Clé d’API     | `CLOUDFLARE_AI_GATEWAY_API_KEY` (votre clé d’API fournisseur pour les requêtes via le Gateway) |

<Note>
Pour les modèles Anthropic routés via Cloudflare AI Gateway, utilisez votre **clé d’API Anthropic** comme clé fournisseur.
</Note>

Lorsque le mode de réflexion est activé pour les modèles Anthropic Messages, OpenClaw supprime les tours de préremplissage finaux de l’assistant avant d’envoyer la charge utile via Cloudflare AI Gateway.
Anthropic rejette le préremplissage des réponses avec la réflexion étendue, tandis que le préremplissage ordinaire sans réflexion reste disponible.

## Bien démarrer

<Steps>
  <Step title="Définir la clé d’API fournisseur et les détails du Gateway">
    Lancez l’onboarding et choisissez l’option d’authentification Cloudflare AI Gateway :

    ```bash
    openclaw onboard --auth-choice cloudflare-ai-gateway-api-key
    ```

    Cela vous demande votre ID de compte, votre ID de Gateway et votre clé d’API.

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

Pour les configurations scriptées ou CI, passez toutes les valeurs sur la ligne de commande :

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
    Si vous avez activé l’authentification Gateway dans Cloudflare, ajoutez l’en-tête `cf-aig-authorization`. Cela s’ajoute à votre clé d’API fournisseur.

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
    L’en-tête `cf-aig-authorization` authentifie auprès du Gateway Cloudflare lui-même, tandis que la clé d’API fournisseur (par exemple, votre clé Anthropic) authentifie auprès du fournisseur en amont.
    </Tip>

  </Accordion>

  <Accordion title="Note sur l’environnement">
    Si le Gateway s’exécute comme daemon (launchd/systemd), assurez-vous que `CLOUDFLARE_AI_GATEWAY_API_KEY` est disponible pour ce processus.

    <Warning>
    Une clé présente uniquement dans `~/.profile` n’aidera pas un daemon launchd/systemd, sauf si cet environnement y est également importé. Définissez la clé dans `~/.openclaw/.env` ou via `env.shellEnv` pour garantir que le processus Gateway peut la lire.
    </Warning>

  </Accordion>
</AccordionGroup>

## Liens connexes

<CardGroup cols={2}>
  <Card title="Sélection du modèle" href="/fr/concepts/model-providers" icon="layers">
    Choisir les fournisseurs, les références de modèles et le comportement de basculement.
  </Card>
  <Card title="Dépannage" href="/fr/help/troubleshooting" icon="wrench">
    Dépannage général et FAQ.
  </Card>
</CardGroup>
