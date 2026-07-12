---
read_when:
    - Vous souhaitez utiliser Chutes avec OpenClaw
    - Vous avez besoin de la procédure de configuration OAuth ou par clé API
    - Vous souhaitez modifier le modèle par défaut, les alias ou le comportement de découverte
summary: Configuration de Chutes (OAuth ou clé API, découverte des modèles, alias)
title: Chutes
x-i18n:
    generated_at: "2026-07-12T15:41:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: dafa96c4a56b9d38d033b87cc077d359cb71adaf1ca41a0ab6b6cc77b66484a7
    source_path: providers/chutes.md
    workflow: 16
---

[Chutes](https://chutes.ai) expose des catalogues de modèles open source via une
API compatible avec OpenAI. OpenClaw prend en charge l’authentification OAuth par navigateur et par clé API.

| Propriété                  | Valeur                                                  |
| -------------------------- | ------------------------------------------------------- |
| Fournisseur                | `chutes`                                                |
| Plugin                     | paquet externe officiel (`@openclaw/chutes-provider`)   |
| API                        | compatible avec OpenAI                                  |
| URL de base                | `https://llm.chutes.ai/v1`                              |
| Authentification           | OAuth ou clé API (voir ci-dessous)                      |
| Variables d’environnement d’exécution | `CHUTES_API_KEY`, `CHUTES_OAUTH_TOKEN`       |

`CHUTES_OAUTH_TOKEN` fournit directement un jeton d’accès OAuth déjà obtenu
(par exemple dans un environnement CI), sans passer par le flux interactif dans le navigateur ci-dessous.

## Installer le Plugin

```bash
openclaw plugins install @openclaw/chutes-provider
openclaw gateway restart
```

## Prise en main

Les deux méthodes définissent `chutes/zai-org/GLM-4.7-TEE` comme modèle par défaut et enregistrent
le catalogue Chutes.

<Tabs>
  <Tab title="OAuth">
    <Steps>
      <Step title="Exécuter le flux d’intégration OAuth">
        ```bash
        openclaw onboard --auth-choice chutes
        ```
        OpenClaw lance localement le flux dans le navigateur ou, sur les hôtes distants/sans interface graphique,
        affiche une URL et demande de coller l’URL de redirection. Les jetons OAuth sont automatiquement actualisés par l’intermédiaire
        des profils d’authentification OpenClaw.
      </Step>
    </Steps>
  </Tab>
  <Tab title="Clé API">
    <Steps>
      <Step title="Obtenir une clé API">
        Créez une clé sur
        [chutes.ai/settings/api-keys](https://chutes.ai/settings/api-keys).
      </Step>
      <Step title="Exécuter le flux d’intégration par clé API">
        ```bash
        openclaw onboard --auth-choice chutes-api-key
        ```
      </Step>
    </Steps>
  </Tab>
</Tabs>

## Comportement de la découverte

Lorsque des identifiants d’authentification Chutes sont disponibles, OpenClaw interroge `GET /v1/models` avec ces
identifiants et utilise les modèles découverts, mis en cache pendant 5 minutes pour chaque
identifiant. Si une clé a expiré ou n’est pas autorisée (HTTP 401), OpenClaw réessaie une fois
sans identifiants. Si la découverte ne renvoie toujours aucune ligne, échoue ou renvoie tout
autre statut autre que 2xx, OpenClaw utilise à la place le catalogue statique intégré (la découverte
par clé API et celle par OAuth suivent ce même chemin). Si la découverte échoue au démarrage, le
catalogue statique est utilisé automatiquement.

## Alias par défaut

OpenClaw enregistre trois alias pratiques pour le catalogue Chutes :

| Alias           | Modèle cible                                          |
| --------------- | ----------------------------------------------------- |
| `chutes-fast`   | `chutes/zai-org/GLM-4.7-FP8`                          |
| `chutes-pro`    | `chutes/deepseek-ai/DeepSeek-V3.2-TEE`                |
| `chutes-vision` | `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506` |

## Catalogue de démarrage intégré

Le catalogue de secours intégré contient 47 modèles. Voici un échantillon représentatif des références actuelles :

| Référence du modèle                                  |
| ----------------------------------------------------- |
| `chutes/zai-org/GLM-4.7-TEE`                          |
| `chutes/zai-org/GLM-5-TEE`                            |
| `chutes/deepseek-ai/DeepSeek-V3.2-TEE`                |
| `chutes/deepseek-ai/DeepSeek-R1-0528-TEE`             |
| `chutes/moonshotai/Kimi-K2.5-TEE`                     |
| `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506` |
| `chutes/Qwen/Qwen3-Coder-Next-TEE`                    |
| `chutes/openai/gpt-oss-120b-TEE`                      |

Exécutez `openclaw models list --all --provider chutes` pour obtenir la liste complète.

## Exemple de configuration

```json5
{
  agents: {
    defaults: {
      model: { primary: "chutes/zai-org/GLM-4.7-TEE" },
      models: {
        "chutes/zai-org/GLM-4.7-TEE": { alias: "Chutes GLM 4.7" },
        "chutes/deepseek-ai/DeepSeek-V3.2-TEE": { alias: "Chutes DeepSeek V3.2" },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Personnalisation d’OAuth">
    Personnalisez le flux OAuth avec des variables d’environnement facultatives :

    | Variable | Rôle |
    | -------- | ------- |
    | `CHUTES_CLIENT_ID` | ID du client OAuth (demandé s’il n’est pas défini) |
    | `CHUTES_CLIENT_SECRET` | Secret du client OAuth |
    | `CHUTES_OAUTH_REDIRECT_URI` | URI de redirection (valeur par défaut : `http://127.0.0.1:1456/oauth-callback`) |
    | `CHUTES_OAUTH_SCOPES` | Portées séparées par des espaces (valeur par défaut : `openid profile chutes:invoke`) |

    Consultez la [documentation OAuth de Chutes](https://chutes.ai/docs/sign-in-with-chutes/overview)
    pour connaître les exigences relatives à l’application de redirection et obtenir de l’aide.

  </Accordion>

  <Accordion title="Remarques">
    - Les modèles Chutes sont enregistrés sous la forme `chutes/<model-id>`.
    - Chutes ne communique pas l’utilisation des jetons pendant la diffusion en continu (`supportsUsageInStreaming: false`) ; les totaux d’utilisation s’affichent néanmoins une fois la diffusion terminée.

  </Accordion>
</AccordionGroup>

## Voir aussi

<CardGroup cols={2}>
  <Card title="Sélection du modèle" href="/fr/concepts/model-providers" icon="layers">
    Règles des fournisseurs, références de modèles et comportement de basculement.
  </Card>
  <Card title="Référence de configuration" href="/fr/gateway/configuration-reference" icon="gear">
    Schéma de configuration complet, y compris les paramètres des fournisseurs.
  </Card>
  <Card title="Chutes" href="https://chutes.ai" icon="arrow-up-right-from-square">
    Tableau de bord Chutes et documentation de l’API.
  </Card>
  <Card title="Clés API Chutes" href="https://chutes.ai/settings/api-keys" icon="key">
    Créez et gérez les clés API Chutes.
  </Card>
</CardGroup>
