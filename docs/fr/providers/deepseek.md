---
read_when:
    - Vous souhaitez utiliser DeepSeek avec OpenClaw
    - Vous avez besoin de la variable d’environnement de clé d’API ou du choix d’authentification CLI
summary: Configuration de DeepSeek (authentification + sélection du modèle)
title: DeepSeek
x-i18n:
    generated_at: "2026-04-30T16:29:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6fbc7bd4de14000eaa5c42b17eb8c9312321ed02ac1667e60774ead3f1749eb4
    source_path: providers/deepseek.md
    workflow: 16
---

[DeepSeek](https://www.deepseek.com) fournit de puissants modèles d’IA avec une API compatible OpenAI.

| Propriété | Valeur                     |
| --------- | -------------------------- |
| Fournisseur | `deepseek`               |
| Authentification | `DEEPSEEK_API_KEY` |
| API       | compatible OpenAI          |
| URL de base | `https://api.deepseek.com` |

## Premiers pas

<Steps>
  <Step title="Obtenir votre clé API">
    Créez une clé API sur [platform.deepseek.com](https://platform.deepseek.com/api_keys).
  </Step>
  <Step title="Exécuter la configuration initiale">
    ```bash
    openclaw onboard --auth-choice deepseek-api-key
    ```

    Cela demandera votre clé API et définira `deepseek/deepseek-v4-flash` comme modèle par défaut.

  </Step>
  <Step title="Vérifier que les modèles sont disponibles">
    ```bash
    openclaw models list --provider deepseek
    ```

    Pour inspecter le catalogue statique intégré sans nécessiter un Gateway en cours d’exécution,
    utilisez :

    ```bash
    openclaw models list --all --provider deepseek
    ```

  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Configuration non interactive">
    Pour les installations scriptées ou sans interface, passez directement tous les indicateurs :

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
Si le Gateway s’exécute comme démon (launchd/systemd), assurez-vous que `DEEPSEEK_API_KEY`
est disponible pour ce processus (par exemple, dans `~/.openclaw/.env` ou via
`env.shellEnv`).
</Warning>

## Catalogue intégré

| Référence de modèle          | Nom               | Entrée | Contexte  | Sortie max. | Notes                                      |
| ---------------------------- | ----------------- | ------ | --------- | ----------- | ------------------------------------------ |
| `deepseek/deepseek-v4-flash` | DeepSeek V4 Flash | texte  | 1,000,000 | 384,000     | Modèle par défaut ; surface V4 compatible avec la réflexion |
| `deepseek/deepseek-v4-pro`   | DeepSeek V4 Pro   | texte  | 1,000,000 | 384,000     | Surface V4 compatible avec la réflexion    |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | texte  | 131,072   | 8,192       | Surface DeepSeek V3.2 sans réflexion       |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | texte  | 131,072   | 65,536      | Surface V3.2 avec raisonnement activé      |

<Tip>
Les modèles V4 prennent en charge le contrôle `thinking` de DeepSeek. OpenClaw rejoue aussi
le `reasoning_content` DeepSeek lors des tours de suivi afin que les sessions de réflexion avec appels
d’outils puissent continuer.
Utilisez `/think xhigh` ou `/think max` avec les modèles DeepSeek V4 pour demander
le `reasoning_effort` maximal de DeepSeek.
</Tip>

## Réflexion et outils

Les sessions de réflexion DeepSeek V4 ont un contrat de rejeu plus strict que la plupart
des fournisseurs compatibles OpenAI : après qu’un tour avec réflexion activée utilise des outils, DeepSeek
s’attend à ce que les messages d’assistant rejoués depuis ce tour incluent
`reasoning_content` dans les requêtes de suivi. OpenClaw gère cela dans le
Plugin DeepSeek, donc l’utilisation normale des outils sur plusieurs tours fonctionne avec
`deepseek/deepseek-v4-flash` et `deepseek/deepseek-v4-pro`.

Si vous basculez une session existante depuis un autre fournisseur compatible OpenAI vers un
modèle DeepSeek V4, les anciens tours d’appels d’outils de l’assistant peuvent ne pas avoir de
`reasoning_content` DeepSeek natif. OpenClaw renseigne ce champ manquant dans les messages
d’assistant rejoués pour les requêtes de réflexion DeepSeek V4 afin que le fournisseur puisse accepter
l’historique sans nécessiter `/new`.

Lorsque la réflexion est désactivée dans OpenClaw (y compris la sélection **Aucun** dans l’interface),
OpenClaw envoie `thinking: { type: "disabled" }` à DeepSeek et retire le
`reasoning_content` rejoué de l’historique sortant. Cela maintient les sessions
sans réflexion sur le chemin DeepSeek sans réflexion.

Utilisez `deepseek/deepseek-v4-flash` pour le chemin rapide par défaut. Utilisez
`deepseek/deepseek-v4-pro` lorsque vous voulez le modèle V4 plus puissant et pouvez accepter
un coût ou une latence plus élevés.

## Tests en conditions réelles

La suite de modèles en conditions réelles directes inclut DeepSeek V4 dans l’ensemble de modèles modernes. Pour
exécuter uniquement les vérifications de modèles directs DeepSeek V4 :

```bash
OPENCLAW_LIVE_PROVIDERS=deepseek \
OPENCLAW_LIVE_MODELS="deepseek/deepseek-v4-flash,deepseek/deepseek-v4-pro" \
pnpm test:live src/agents/models.profiles.live.test.ts
```

Cette vérification en conditions réelles confirme que les deux modèles V4 peuvent terminer et que les tours de suivi
réflexion/outil préservent la charge utile de rejeu requise par DeepSeek.

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

## Associé

<CardGroup cols={2}>
  <Card title="Sélection du modèle" href="/fr/concepts/model-providers" icon="layers">
    Choisir les fournisseurs, les références de modèle et le comportement de basculement.
  </Card>
  <Card title="Référence de configuration" href="/fr/gateway/configuration-reference" icon="gear">
    Référence complète de configuration pour les agents, les modèles et les fournisseurs.
  </Card>
</CardGroup>
