---
read_when:
    - Vous souhaitez utiliser Cohere avec OpenClaw
    - Vous devez utiliser la variable d’environnement de la clé d’API Cohere ou choisir l’authentification via la CLI.
summary: Configuration de Cohere (authentification + sélection du modèle)
title: Cohere
x-i18n:
    generated_at: "2026-07-12T03:01:32Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fee46bf80609bd5e8211d6be507713f4de178653941effb81ebae48d8bb6528a
    source_path: providers/cohere.md
    workflow: 16
---

[Cohere](https://cohere.com) fournit une inférence compatible avec OpenAI via son API de compatibilité. OpenClaw inclut le fournisseur Cohere pendant sa transition vers l’externalisation et le publie également sous forme de plugin externe officiel.

| Propriété                 | Valeur                                                        |
| ------------------------- | ------------------------------------------------------------- |
| Identifiant du fournisseur | `cohere`                                                      |
| Plugin                    | inclus pendant la transition ; paquet externe officiel        |
| Variable d’environnement d’authentification | `COHERE_API_KEY`                              |
| Option d’intégration      | `--auth-choice cohere-api-key`                                |
| Option CLI directe        | `--cohere-api-key <key>`                                      |
| API                       | compatible avec OpenAI (`openai-completions`)                  |
| URL de base               | `https://api.cohere.ai/compatibility/v1`                       |
| Modèle par défaut         | `cohere/command-a-plus-05-2026`                                |
| Fenêtre de contexte       | 128 000 jetons                                                 |

## Catalogue intégré

| Référence du modèle                   | Entrée       | Contexte | Sortie maximale | Remarques                                                        |
| ------------------------------------- | ------------ | -------- | --------------- | ---------------------------------------------------------------- |
| `cohere/command-a-plus-05-2026`       | texte, image | 128 000  | 64 000          | Modèle par défaut ; modèle agentique et de raisonnement phare     |
| `cohere/command-a-03-2025`            | texte        | 256 000  | 8 000           | Modèle Command A précédent                                       |
| `cohere/command-a-reasoning-08-2025`  | texte        | 256 000  | 32 000          | Raisonnement agentique et utilisation d’outils                   |
| `cohere/command-a-vision-07-2025`     | texte, image | 128 000  | 8 000           | Vision et analyse de documents ; aucune utilisation d’outils     |
| `cohere/north-mini-code-1-0`          | texte, image | 256 000  | 64 000          | Programmation agentique ; raisonnement ; limites gratuites       |

Les modèles Cohere capables de raisonnement prennent en charge deux modes de raisonnement de l’API de compatibilité. OpenClaw associe **désactivé** à `none` et chaque niveau de réflexion activé à `high`. Command A Vision ne prend pas en charge l’utilisation d’outils ; OpenClaw désactive donc les outils d’agent pour ce modèle.

## Bien démarrer

1. Cohere est fourni avec les paquets OpenClaw actuels. S’il est absent, installez le paquet externe et redémarrez le Gateway :

```bash
openclaw plugins install @openclaw/cohere-provider
openclaw gateway restart
```

2. Créez une clé d’API Cohere.
3. Exécutez l’intégration :

```bash
openclaw onboard --non-interactive \
  --auth-choice cohere-api-key \
  --cohere-api-key "$COHERE_API_KEY"
```

4. Vérifiez que le catalogue est disponible :

```bash
openclaw models list --provider cohere
```

L’intégration ne définit Cohere comme modèle principal que si aucun modèle principal n’est déjà configuré.

## Configuration uniquement par variables d’environnement

Rendez `COHERE_API_KEY` accessible au processus Gateway, puis sélectionnez le modèle Cohere :

```json5
{
  agents: {
    defaults: {
      model: { primary: "cohere/command-a-plus-05-2026" },
    },
  },
}
```

<Note>
Si le Gateway s’exécute en tant que démon ou dans Docker, définissez `COHERE_API_KEY` pour ce service. Son export uniquement dans un shell interactif ne la rend pas accessible à un Gateway déjà en cours d’exécution.
</Note>

## Pages associées

- [Fournisseurs de modèles](/fr/concepts/model-providers)
- [CLI des modèles](/fr/cli/models)
- [Répertoire des fournisseurs](/fr/providers/index)
