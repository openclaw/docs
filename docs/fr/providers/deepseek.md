---
read_when:
    - Vous souhaitez utiliser DeepSeek avec OpenClaw
    - Vous avez besoin de la variable d’environnement de clé API ou du choix d’authentification CLI
summary: Configuration de DeepSeek (authentification + sélection du modèle)
title: DeepSeek
x-i18n:
    generated_at: "2026-04-25T13:55:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1fd89511faea8b961b7d6c5175143b9b8f0ba606ae24a49f276d9346de1cb8c3
    source_path: providers/deepseek.md
    workflow: 15
---

[DeepSeek](https://www.deepseek.com) fournit de puissants modèles d’IA avec une API compatible OpenAI.

| Propriété | Valeur                     |
| -------- | -------------------------- |
| Fournisseur | `deepseek`              |
| Authentification | `DEEPSEEK_API_KEY` |
| API      | Compatible OpenAI          |
| URL de base | `https://api.deepseek.com` |

## Premiers pas

<Steps>
  <Step title="Obtenir votre clé API">
    Créez une clé API sur [platform.deepseek.com](https://platform.deepseek.com/api_keys).
  </Step>
  <Step title="Exécuter l’onboarding">
    ```bash
    openclaw onboard --auth-choice deepseek-api-key
    ```

    Cela vous invitera à fournir votre clé API et définira `deepseek/deepseek-v4-flash` comme modèle par défaut.

  </Step>
  <Step title="Vérifier que les modèles sont disponibles">
    ```bash
    openclaw models list --provider deepseek
    ```

    Pour inspecter le catalogue statique intégré sans nécessiter une Gateway en cours d’exécution,
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
Si la Gateway s’exécute comme démon (launchd/systemd), assurez-vous que `DEEPSEEK_API_KEY`
est disponible pour ce processus (par exemple dans `~/.openclaw/.env` ou via
`env.shellEnv`).
</Warning>

## Catalogue intégré

| Référence du modèle         | Nom               | Entrée | Contexte  | Sortie max | Notes                                      |
| --------------------------- | ----------------- | ------ | --------- | ---------- | ------------------------------------------ |
| `deepseek/deepseek-v4-flash` | DeepSeek V4 Flash | text   | 1,000,000 | 384,000    | Modèle par défaut ; surface V4 compatible réflexion |
| `deepseek/deepseek-v4-pro`   | DeepSeek V4 Pro   | text   | 1,000,000 | 384,000    | Surface V4 compatible réflexion            |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | text   | 131,072   | 8,192      | Surface non réflexive DeepSeek V3.2        |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | text   | 131,072   | 65,536     | Surface V3.2 avec raisonnement             |

<Tip>
Les modèles V4 prennent en charge le contrôle `thinking` de DeepSeek. OpenClaw relit également
le `reasoning_content` de DeepSeek lors des tours de suivi afin que les sessions de réflexion avec appels d’outils puissent se poursuivre.
</Tip>

## Réflexion et outils

Les sessions de réflexion DeepSeek V4 ont un contrat de relecture plus strict que la plupart des
fournisseurs compatibles OpenAI : lorsqu’un message assistant avec réflexion activée inclut
des appels d’outils, DeepSeek s’attend à ce que le `reasoning_content` de l’assistant précédent soit renvoyé
dans la requête de suivi. OpenClaw gère cela dans le plugin DeepSeek,
de sorte que l’utilisation normale d’outils sur plusieurs tours fonctionne avec `deepseek/deepseek-v4-flash` et
`deepseek/deepseek-v4-pro`.

Si vous basculez une session existante depuis un autre fournisseur compatible OpenAI vers un
modèle DeepSeek V4, les anciens tours d’appel d’outils de l’assistant peuvent ne pas avoir de
`reasoning_content` DeepSeek natif. OpenClaw remplit ce champ manquant pour les requêtes de réflexion DeepSeek V4
afin que le fournisseur puisse accepter l’historique relu des appels d’outils
sans nécessiter `/new`.

Lorsque la réflexion est désactivée dans OpenClaw (y compris la sélection **None** de l’interface),
OpenClaw envoie à DeepSeek `thinking: { type: "disabled" }` et retire le
`reasoning_content` relu de l’historique sortant. Cela maintient les sessions
avec réflexion désactivée sur le chemin DeepSeek non réflexif.

Utilisez `deepseek/deepseek-v4-flash` pour le chemin rapide par défaut. Utilisez
`deepseek/deepseek-v4-pro` lorsque vous voulez le modèle V4 plus puissant et pouvez accepter
un coût ou une latence plus élevés.

## Tests en direct

La suite de modèles en direct directe inclut DeepSeek V4 dans l’ensemble de modèles moderne. Pour
exécuter uniquement les vérifications directes du modèle DeepSeek V4 :

```bash
OPENCLAW_LIVE_PROVIDERS=deepseek \
OPENCLAW_LIVE_MODELS="deepseek/deepseek-v4-flash,deepseek/deepseek-v4-pro" \
pnpm test:live src/agents/models.profiles.live.test.ts
```

Cette vérification en direct confirme que les deux modèles V4 peuvent s’exécuter et que les tours de suivi
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

## Liens connexes

<CardGroup cols={2}>
  <Card title="Sélection du modèle" href="/fr/concepts/model-providers" icon="layers">
    Choisir les fournisseurs, les références de modèles et le comportement de basculement.
  </Card>
  <Card title="Référence de configuration" href="/fr/gateway/configuration-reference" icon="gear">
    Référence complète de configuration pour les agents, les modèles et les fournisseurs.
  </Card>
</CardGroup>
