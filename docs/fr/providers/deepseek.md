---
read_when:
    - Vous voulez utiliser DeepSeek avec OpenClaw
    - Vous avez besoin de la variable d’environnement de clé API ou du choix d’authentification CLI
summary: Configuration de DeepSeek (authentification + sélection du modèle)
title: DeepSeek
x-i18n:
    generated_at: "2026-06-27T18:04:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0446f78e1cb6412034ca18b0db49f2f3a1958e91a013661b3056bf3687fc2d09
    source_path: providers/deepseek.md
    workflow: 16
---

[DeepSeek](https://www.deepseek.com) fournit des modèles d’IA puissants avec une API compatible avec OpenAI.

| Propriété | Valeur                     |
| --------- | -------------------------- |
| Fournisseur | `deepseek`               |
| Authentification | `DEEPSEEK_API_KEY`  |
| API       | Compatible avec OpenAI     |
| URL de base | `https://api.deepseek.com` |

## Installer le Plugin

Installez le Plugin officiel, puis redémarrez Gateway :

```bash
openclaw plugins install @openclaw/deepseek-provider
openclaw gateway restart
```

## Premiers pas

<Steps>
  <Step title="Obtenir votre clé API">
    Créez une clé API sur [platform.deepseek.com](https://platform.deepseek.com/api_keys).
  </Step>
  <Step title="Lancer l’onboarding">
    ```bash
    openclaw onboard --auth-choice deepseek-api-key
    ```

    Cela vous demandera votre clé API et définira `deepseek/deepseek-v4-flash` comme modèle par défaut.

  </Step>
  <Step title="Vérifier que les modèles sont disponibles">
    ```bash
    openclaw models list --provider deepseek
    ```

    Pour inspecter le catalogue statique du Plugin sans nécessiter un Gateway en cours d’exécution,
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
Si Gateway s’exécute comme un démon (launchd/systemd), assurez-vous que `DEEPSEEK_API_KEY`
est disponible pour ce processus (par exemple, dans `~/.openclaw/.env` ou via
`env.shellEnv`).
</Warning>

## Catalogue intégré

| Référence du modèle          | Nom               | Entrée | Contexte  | Sortie max. | Notes                                      |
| ---------------------------- | ----------------- | ------ | --------- | ----------- | ------------------------------------------ |
| `deepseek/deepseek-v4-flash` | DeepSeek V4 Flash | texte  | 1,000,000 | 384,000     | Modèle par défaut ; surface V4 compatible avec la réflexion |
| `deepseek/deepseek-v4-pro`   | DeepSeek V4 Pro   | texte  | 1,000,000 | 384,000     | Surface V4 compatible avec la réflexion    |
| `deepseek/deepseek-chat`     | DeepSeek Chat     | texte  | 131,072   | 8,192       | Surface DeepSeek V3.2 sans réflexion       |
| `deepseek/deepseek-reasoner` | DeepSeek Reasoner | texte  | 131,072   | 65,536      | Surface V3.2 avec raisonnement activé      |

<Tip>
Les modèles V4 prennent en charge le contrôle `thinking` de DeepSeek. OpenClaw rejoue également
le `reasoning_content` de DeepSeek lors des tours de suivi afin que les sessions de réflexion avec appels
d’outils puissent continuer.
Utilisez `/think xhigh` ou `/think max` avec les modèles DeepSeek V4 pour demander le
`reasoning_effort` maximal de DeepSeek.
</Tip>

## Réflexion et outils

Les sessions de réflexion DeepSeek V4 ont un contrat de relecture plus strict que la plupart des
fournisseurs compatibles avec OpenAI : après qu’un tour avec réflexion activée utilise des outils, DeepSeek
s’attend à ce que les messages assistant rejoués depuis ce tour incluent
`reasoning_content` dans les requêtes de suivi. OpenClaw gère cela dans le
Plugin DeepSeek, donc l’utilisation normale d’outils sur plusieurs tours fonctionne avec
`deepseek/deepseek-v4-flash` et `deepseek/deepseek-v4-pro`.

Si vous basculez une session existante d’un autre fournisseur compatible avec OpenAI vers un
modèle DeepSeek V4, les anciens tours d’appels d’outils de l’assistant peuvent ne pas avoir de
`reasoning_content` DeepSeek natif. OpenClaw renseigne ce champ manquant lors de la relecture des
messages assistant pour les requêtes de réflexion DeepSeek V4 afin que le fournisseur puisse accepter
l’historique sans nécessiter `/new`.

Lorsque la réflexion est désactivée dans OpenClaw (y compris la sélection **Aucun** de l’interface),
OpenClaw envoie à DeepSeek `thinking: { type: "disabled" }` et supprime le
`reasoning_content` rejoué de l’historique sortant. Cela maintient les sessions sans réflexion
sur le chemin DeepSeek sans réflexion.

Utilisez `deepseek/deepseek-v4-flash` comme chemin rapide par défaut. Utilisez
`deepseek/deepseek-v4-pro` lorsque vous voulez le modèle V4 plus puissant et pouvez accepter
un coût ou une latence plus élevés.

## Tests live

La suite de modèles live directe inclut DeepSeek V4 dans l’ensemble de modèles moderne. Pour
exécuter uniquement les vérifications de modèles directs DeepSeek V4 :

```bash
OPENCLAW_LIVE_PROVIDERS=deepseek \
OPENCLAW_LIVE_MODELS="deepseek/deepseek-v4-flash,deepseek/deepseek-v4-pro" \
pnpm test:live src/agents/models.profiles.live.test.ts
```

Cette vérification live confirme que les deux modèles V4 peuvent terminer et que les tours de suivi
avec réflexion/outils préservent la charge utile de relecture requise par DeepSeek.

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

## Connexe

<CardGroup cols={2}>
  <Card title="Sélection de modèle" href="/fr/concepts/model-providers" icon="layers">
    Choisir les fournisseurs, les références de modèles et le comportement de basculement.
  </Card>
  <Card title="Référence de configuration" href="/fr/gateway/configuration-reference" icon="gear">
    Référence complète de configuration pour les agents, les modèles et les fournisseurs.
  </Card>
</CardGroup>
