---
read_when:
    - Vous souhaitez utiliser DeepSeek avec OpenClaw
    - Vous devez fournir la variable d’environnement de clé API ou le choix d’authentification CLI
summary: Configuration de DeepSeek (authentification + sélection du modèle)
title: DeepSeek
x-i18n:
    generated_at: "2026-04-30T07:43:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: e84d989a7cba8d259779ac02293718050ce51efe6ce2bdbfacb9e22bbfd294ef
    source_path: providers/deepseek.md
    workflow: 16
---

[DeepSeek](https://www.deepseek.com) fournit de puissants modèles d’IA avec une API compatible avec OpenAI.

| Propriété | Valeur                     |
| --------- | -------------------------- |
| Fournisseur | `deepseek`               |
| Authentification | `DEEPSEEK_API_KEY` |
| API       | compatible avec OpenAI     |
| URL de base | `https://api.deepseek.com` |

## Premiers pas

<Steps>
  <Step title="Obtenez votre clé API">
    Créez une clé API sur [platform.deepseek.com](https://platform.deepseek.com/api_keys).
  </Step>
  <Step title="Exécutez la configuration initiale">
    ```bash
    openclaw onboard --auth-choice deepseek-api-key
    ```

    Cette commande vous demandera votre clé API et définira `deepseek/deepseek-v4-flash` comme modèle par défaut.

  </Step>
  <Step title="Vérifiez que les modèles sont disponibles">
    ```bash
    openclaw models list --provider deepseek
    ```

    Pour inspecter le catalogue statique intégré sans nécessiter de Gateway en cours d’exécution,
    utilisez :

    ```bash
    openclaw models list --all --provider deepseek
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Configuration non interactive">
    Pour les installations scriptées ou sans interface, transmettez directement tous les indicateurs :

    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice deepseek-api-key \
      --deepseek-api-key "$DEEPSEEK_API_KEY" \
      --skip-health \
      --accept-risk
    ```

  </Accordion>
</AccordionGroup>

<Warning>
Si le Gateway s’exécute comme un démon (launchd/systemd), assurez-vous que `DEEPSEEK_API_KEY`
est disponible pour ce processus (par exemple, dans `~/.openclaw/.env` ou via
`env.shellEnv`).
</Warning>

## Catalogue intégré

| Référence du modèle          | Nom               | Entrée | Contexte  | Sortie max. | Notes                                      |
| ---------------------------- | ----------------- | ------ | --------- | ----------- | ------------------------------------------ |
| `deepseek/deepseek-v4-flash` | DeepSeek V4 Flash | text   | 1,000,000 | 384,000     | Modèle par défaut ; surface V4 compatible avec la réflexion |
| `deepseek/deepseek-v4-pro`   | DeepSeek V4 Pro   | text   | 1,000,000 | 384,000     | Surface V4 compatible avec la réflexion    |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | text   | 131,072   | 8,192       | Surface DeepSeek V3.2 sans réflexion       |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | text   | 131,072   | 65,536      | Surface V3.2 avec raisonnement activé      |

<Tip>
Les modèles V4 prennent en charge le contrôle `thinking` de DeepSeek. OpenClaw rejoue également
le `reasoning_content` de DeepSeek lors des tours suivants afin que les sessions de réflexion avec des appels
d’outils puissent continuer.
</Tip>

## Réflexion et outils

Les sessions de réflexion DeepSeek V4 ont un contrat de relecture plus strict que la plupart des
fournisseurs compatibles avec OpenAI : après qu’un tour avec réflexion activée utilise des outils, DeepSeek
s’attend à ce que les messages d’assistant rejoués depuis ce tour incluent
`reasoning_content` dans les requêtes suivantes. OpenClaw gère cela dans le
Plugin DeepSeek, donc l’utilisation normale d’outils sur plusieurs tours fonctionne avec
`deepseek/deepseek-v4-flash` et `deepseek/deepseek-v4-pro`.

Si vous basculez une session existante d’un autre fournisseur compatible avec OpenAI vers un
modèle DeepSeek V4, les anciens tours d’appels d’outils de l’assistant peuvent ne pas avoir de
`reasoning_content` DeepSeek natif. OpenClaw renseigne ce champ manquant lors de la relecture des
messages d’assistant pour les requêtes de réflexion DeepSeek V4 afin que le fournisseur puisse accepter
l’historique sans nécessiter `/new`.

Lorsque la réflexion est désactivée dans OpenClaw (y compris la sélection **Aucune** de l’interface),
OpenClaw envoie à DeepSeek `thinking: { type: "disabled" }` et retire le
`reasoning_content` rejoué de l’historique sortant. Cela maintient les
sessions avec réflexion désactivée sur le chemin DeepSeek sans réflexion.

Utilisez `deepseek/deepseek-v4-flash` pour le chemin rapide par défaut. Utilisez
`deepseek/deepseek-v4-pro` lorsque vous voulez le modèle V4 plus puissant et pouvez accepter
un coût ou une latence plus élevés.

## Tests en direct

La suite directe de modèles en direct inclut DeepSeek V4 dans l’ensemble de modèles moderne. Pour
exécuter uniquement les vérifications de modèles directs DeepSeek V4 :

```bash
OPENCLAW_LIVE_PROVIDERS=deepseek \
OPENCLAW_LIVE_MODELS="deepseek/deepseek-v4-flash,deepseek/deepseek-v4-pro" \
pnpm test:live src/agents/models.profiles.live.test.ts
```

Cette vérification en direct confirme que les deux modèles V4 peuvent terminer et que les tours de suivi
réflexion/outils préservent la charge utile de relecture exigée par DeepSeek.

## Exemple de configuration

```json5
{
  env: { DEEPSEEK_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "deepseek/deepseek-v4-flash" },
    },
  },
}
```

## Articles connexes

<CardGroup cols={2}>
  <Card title="Sélection du modèle" href="/fr/concepts/model-providers" icon="layers">
    Choix des fournisseurs, des références de modèles et du comportement de basculement.
  </Card>
  <Card title="Référence de configuration" href="/fr/gateway/configuration-reference" icon="gear">
    Référence complète de configuration pour les agents, modèles et fournisseurs.
  </Card>
</CardGroup>
