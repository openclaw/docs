---
read_when:
    - Vous souhaitez utiliser Featherless AI avec OpenClaw
    - Vous avez besoin de la variable d’environnement de la clé d’API Featherless ou du format de référence du modèle
summary: Configuration de Featherless AI, sélection du modèle et appel d’outils
title: Featherless AI
x-i18n:
    generated_at: "2026-07-12T15:42:15Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 9112f7e65b4089bf96933c632d0b62f7fb87d42998d985ca85eb92dc392636b6
    source_path: providers/featherless.md
    workflow: 16
---

[Featherless AI](https://featherless.ai) fournit des modèles ouverts via une API compatible avec OpenAI. OpenClaw installe Featherless en tant que Plugin fournisseur externe officiel et conserve un catalogue intégré restreint, tout en acceptant à l’exécution les identifiants de modèles exacts de Featherless.

| Propriété                         | Valeur                                   |
| --------------------------------- | ---------------------------------------- |
| Identifiant du fournisseur        | `featherless`                            |
| Paquet                            | `@openclaw/featherless-provider`         |
| Variable d’environnement d’authentification | `FEATHERLESS_API_KEY`           |
| Option d’intégration              | `--auth-choice featherless-api-key`      |
| Option CLI directe                | `--featherless-api-key <key>`            |
| API                               | Compatible avec OpenAI (`openai-completions`) |
| URL de base                       | `https://api.featherless.ai/v1`          |
| Modèle par défaut                 | `featherless/Qwen/Qwen3-32B`             |

## Configuration

Installez le Plugin et redémarrez le Gateway :

```bash
openclaw plugins install @openclaw/featherless-provider
openclaw gateway restart
```

Exécutez l’intégration :

```bash
openclaw onboard --auth-choice featherless-api-key
```

Pour une configuration non interactive :

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice featherless-api-key \
  --featherless-api-key "$FEATHERLESS_API_KEY"
```

Vous pouvez également rendre la clé accessible au processus du Gateway :

```bash
export FEATHERLESS_API_KEY="<your-featherless-api-key>" # pragma: allowlist secret
```

Vérifiez le fournisseur :

```bash
openclaw models list --provider featherless
```

## Modèle par défaut

Le Plugin utilise `Qwen/Qwen3-32B` comme valeur par défaut de configuration, car Featherless documente la prise en charge native des appels d’outils pour la famille Qwen 3. OpenClaw configure sa fenêtre de contexte de 32,768 jetons, une limite de sortie prudente de 4,096 jetons et les contrôles de réflexion du modèle de discussion Qwen.

Les champs de coût du catalogue sont définis sur zéro, car Featherless prend en charge plusieurs modes de facturation et OpenClaw n’intègre pas de tarifs propres au forfait du compte ni de tarification par requête.

## Autres modèles Featherless

Utilisez l’identifiant de modèle Featherless exact après le préfixe de fournisseur `featherless/` :

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "featherless/moonshotai/Kimi-K2-Instruct",
      },
    },
  },
}
```

OpenClaw ne copie délibérément pas l’intégralité de l’index public des modèles Featherless dans le sélecteur. Cet index est volumineux et ne fournit pas suffisamment de métadonnées structurées sur les capacités pour classer en toute sécurité chaque modèle de texte, de vision, d’intégration vectorielle et de raisonnement. Les identifiants inconnus sont donc résolus avec des valeurs par défaut prudentes, limitées au texte et sans raisonnement : une fenêtre de contexte de 4,096 jetons et une limite de sortie de 1,024 jetons.

Ajoutez une entrée de modèle explicite pour le fournisseur lorsqu’un modèle nécessite des métadonnées différentes :

```json5
{
  models: {
    mode: "merge",
    providers: {
      featherless: {
        baseUrl: "https://api.featherless.ai/v1",
        apiKey: "${FEATHERLESS_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "google/gemma-3-27b-it",
            name: "Gemma 3 27B",
            input: ["text", "image"],
            reasoning: false,
            contextWindow: 32768,
            maxTokens: 4096,
          },
        ],
      },
    },
  },
}
```

Consultez le catalogue de modèles de Featherless pour vérifier la disponibilité actuelle des modèles et leurs étiquettes de capacités avant d’ajouter des métadonnées personnalisées.

## Dépannage

- `401` ou `403` : vérifiez que `FEATHERLESS_API_KEY` est visible par le processus du Gateway, ou exécutez de nouveau l’intégration.
- Modèle inconnu : utilisez après le préfixe `featherless/` l’identifiant exact de Featherless, en respectant la casse.
- Appels d’outils renvoyés sous forme de texte : choisissez une famille de modèles pour laquelle Featherless documente les appels de fonctions natifs, comme Qwen 3.
- Le Gateway géré ne voit pas la clé : placez-la dans `~/.openclaw/.env` ou dans une autre source d’environnement chargée par le service, puis redémarrez le Gateway.

## Pages connexes

- [Fournisseurs de modèles](/fr/concepts/model-providers)
- [Tous les fournisseurs](/fr/providers/index)
- [Modes de réflexion](/fr/tools/thinking)
