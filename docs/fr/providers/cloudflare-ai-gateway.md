---
read_when:
    - Vous souhaitez utiliser Cloudflare AI Gateway avec OpenClaw
    - Vous avez besoin de l’ID du compte, de l’ID du Gateway ou de la variable d’environnement de la clé API.
summary: Configuration de Cloudflare AI Gateway (authentification + sélection du modèle)
title: Gateway IA de Cloudflare
x-i18n:
    generated_at: "2026-07-12T02:59:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 02c7785616e7aee645bb3fc41ef6a3585e1f2f9d886fab1a06231e497effd045
    source_path: providers/cloudflare-ai-gateway.md
    workflow: 16
---

[Cloudflare AI Gateway](https://developers.cloudflare.com/ai-gateway/) se place devant les API des fournisseurs et ajoute des fonctions d’analyse, de mise en cache et de contrôle. Pour Anthropic, OpenClaw utilise l’API Anthropic Messages via votre point de terminaison Gateway.

| Propriété         | Valeur                                                                                                     |
| ----------------- | ---------------------------------------------------------------------------------------------------------- |
| Fournisseur       | `cloudflare-ai-gateway`                                                                                    |
| Plugin            | paquet externe officiel (`@openclaw/cloudflare-ai-gateway-provider`)                                       |
| URL de base       | `https://gateway.ai.cloudflare.com/v1/<account_id>/<gateway_id>/anthropic`                                 |
| Modèle par défaut | `cloudflare-ai-gateway/claude-sonnet-4-6`                                                                  |
| Clé API           | `CLOUDFLARE_AI_GATEWAY_API_KEY` (votre clé API de fournisseur pour les requêtes transmises via le Gateway) |

<Note>
Pour les modèles Anthropic acheminés via Cloudflare AI Gateway, utilisez votre **clé API Anthropic** comme clé du fournisseur.
</Note>

Lorsque le raisonnement est activé pour les modèles Anthropic Messages, OpenClaw supprime les
tours de préremplissage finaux de l’assistant avant d’envoyer la charge utile via Cloudflare AI Gateway.
Anthropic refuse le préremplissage des réponses avec le raisonnement étendu, tandis que le
préremplissage ordinaire sans raisonnement reste disponible.

## Installer le Plugin

Installez le Plugin officiel, puis redémarrez le Gateway :

```bash
openclaw plugins install @openclaw/cloudflare-ai-gateway-provider
openclaw gateway restart
```

## Prise en main

<Steps>
  <Step title="Définir la clé API du fournisseur et les informations du Gateway">
    Lancez la configuration initiale et choisissez l’option d’authentification Cloudflare AI Gateway :

    ```bash
    openclaw onboard --auth-choice cloudflare-ai-gateway-api-key
    ```

    Vous serez invité à saisir votre identifiant de compte, l’identifiant du Gateway et votre clé API.

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

Pour les configurations automatisées ou d’intégration continue, transmettez toutes les valeurs sur la ligne de commande :

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
    Si vous avez activé l’authentification du Gateway dans Cloudflare, ajoutez l’en-tête `cf-aig-authorization`. Celui-ci s’utilise **en plus de** votre clé API de fournisseur.

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
    L’en-tête `cf-aig-authorization` permet de s’authentifier auprès du Gateway Cloudflare lui-même, tandis que la clé API du fournisseur (par exemple, votre clé Anthropic) permet de s’authentifier auprès du fournisseur en amont.
    </Tip>

  </Accordion>

  <Accordion title="Remarque sur l’environnement">
    Si le Gateway s’exécute en tant que démon (launchd/systemd), assurez-vous que `CLOUDFLARE_AI_GATEWAY_API_KEY` est accessible à ce processus.

    <Warning>
    Une clé exportée uniquement dans un shell interactif ne sera pas accessible à un démon launchd/systemd, sauf si cet environnement y est également importé. Définissez la clé dans `~/.openclaw/.env` ou via `env.shellEnv` afin que le processus du Gateway puisse la lire.
    </Warning>

  </Accordion>
</AccordionGroup>

## Ressources connexes

<CardGroup cols={2}>
  <Card title="Sélection du modèle" href="/fr/concepts/model-providers" icon="layers">
    Choix des fournisseurs, des références de modèles et du comportement de basculement.
  </Card>
  <Card title="Dépannage" href="/fr/help/troubleshooting" icon="wrench">
    Dépannage général et FAQ.
  </Card>
</CardGroup>
