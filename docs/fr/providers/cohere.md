---
read_when:
    - Vous voulez utiliser Cohere avec OpenClaw
    - Vous avez besoin de la variable d’environnement de clé API Cohere ou du choix d’authentification CLI
summary: Configuration de Cohere (authentification + sélection du modèle)
title: Cohere
x-i18n:
    generated_at: "2026-06-27T18:03:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 76365a5d358bd5576d83a24d62ef30e203ee204bca90a2e50c56cc4c549b52af
    source_path: providers/cohere.md
    workflow: 16
---

[Cohere](https://cohere.com) fournit une inférence compatible avec OpenAI via son API Compatibility. OpenClaw embarque le fournisseur Cohere pendant sa transition d’externalisation et le publie également comme Plugin externe officiel avec le catalogue de modèles Command A.

| Propriété            | Valeur                                             |
| -------------------- | -------------------------------------------------- |
| ID du fournisseur    | `cohere`                                           |
| Plugin               | embarqué pendant la transition ; paquet externe officiel |
| Variable d’env d’auth | `COHERE_API_KEY`                                   |
| Option d’onboarding  | `--auth-choice cohere-api-key`                     |
| Option CLI directe   | `--cohere-api-key <key>`                           |
| API                  | compatible avec OpenAI (`openai-completions`)      |
| URL de base          | `https://api.cohere.ai/compatibility/v1`           |
| Modèle par défaut    | `cohere/command-a-03-2025`                         |

## Démarrer

1. Cohere est inclus dans les paquets OpenClaw actuels. S’il n’est pas disponible, installez le paquet externe et redémarrez le Gateway :

```bash
openclaw plugins install @openclaw/cohere-provider
openclaw gateway restart
```

2. Créez une clé API Cohere.
3. Exécutez l’onboarding :

```bash
openclaw onboard --non-interactive \
  --auth-choice cohere-api-key \
  --cohere-api-key "$COHERE_API_KEY"
```

4. Confirmez que le catalogue est disponible :

```bash
openclaw models list --provider cohere
```

Le modèle par défaut n’est défini que lorsqu’aucun modèle principal n’est déjà configuré.

## Configuration uniquement par environnement

Rendez `COHERE_API_KEY` disponible pour le processus Gateway, puis sélectionnez le modèle Cohere :

```json5
{
  agents: {
    defaults: {
      model: { primary: "cohere/command-a-03-2025" },
    },
  },
}
```

<Note>
Si le Gateway s’exécute comme démon ou dans Docker, configurez `COHERE_API_KEY` pour ce service. L’exporter uniquement dans un shell interactif ne la rend pas disponible pour un Gateway déjà en cours d’exécution.
</Note>

## Voir aussi

- [Fournisseurs de modèles](/fr/concepts/model-providers)
- [CLI des modèles](/fr/cli/models)
- [Répertoire des fournisseurs](/fr/providers)
