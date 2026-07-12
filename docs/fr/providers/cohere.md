---
read_when:
    - Vous souhaitez utiliser Cohere avec OpenClaw
    - Vous avez besoin de la variable d’environnement de clé API Cohere ou de l’option d’authentification de la CLI.
summary: Configuration de Cohere (authentification + sélection du modèle)
title: Cohere
x-i18n:
    generated_at: "2026-07-12T15:43:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: fee46bf80609bd5e8211d6be507713f4de178653941effb81ebae48d8bb6528a
    source_path: providers/cohere.md
    workflow: 16
---

[Cohere](https://cohere.com) fournit une inférence compatible avec OpenAI via son API de compatibilité. OpenClaw intègre le fournisseur Cohere pendant sa transition vers l’externalisation et le publie également en tant que Plugin externe officiel.

| Propriété                    | Valeur                                                       |
| ---------------------------- | ------------------------------------------------------------ |
| Identifiant du fournisseur   | `cohere`                                                     |
| Plugin                       | intégré pendant la transition ; paquet externe officiel      |
| Variable d’environnement d’authentification | `COHERE_API_KEY`                                |
| Option d’intégration         | `--auth-choice cohere-api-key`                               |
| Option CLI directe           | `--cohere-api-key <key>`                                     |
| API                          | compatible avec OpenAI (`openai-completions`)                |
| URL de base                  | `https://api.cohere.ai/compatibility/v1`                     |
| Modèle par défaut            | `cohere/command-a-plus-05-2026`                              |
| Fenêtre de contexte          | 128,000 tokens                                               |

## Catalogue intégré

| Référence du modèle                  | Entrée      | Contexte | Sortie maximale | Remarques                                                       |
| ------------------------------------ | ----------- | -------- | --------------- | --------------------------------------------------------------- |
| `cohere/command-a-plus-05-2026`      | texte, image | 128,000 | 64,000          | Modèle par défaut ; modèle agentique et de raisonnement phare    |
| `cohere/command-a-03-2025`           | texte       | 256,000  | 8,000           | Modèle Command A précédent                                      |
| `cohere/command-a-reasoning-08-2025` | texte       | 256,000  | 32,000          | Raisonnement agentique et utilisation d’outils                  |
| `cohere/command-a-vision-07-2025`    | texte, image | 128,000 | 8,000           | Analyse visuelle et documentaire ; aucune utilisation d’outils |
| `cohere/north-mini-code-1-0`         | texte, image | 256,000 | 64,000          | Codage agentique ; raisonnement ; limites gratuites             |

Les modèles Cohere capables de raisonnement prennent en charge deux modes de raisonnement de l’API de compatibilité. OpenClaw associe **désactivé** à `none` et chaque niveau de réflexion activé à `high`. Command A Vision ne prend pas en charge l’utilisation d’outils ; OpenClaw maintient donc les outils de l’agent désactivés pour ce modèle.

## Prise en main

1. Cohere est fourni avec les paquets OpenClaw actuels. S’il est absent, installez le paquet externe et redémarrez le Gateway :

```bash
openclaw plugins install @openclaw/cohere-provider
openclaw gateway restart
```

2. Créez une clé API Cohere.
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

L’intégration définit Cohere comme modèle principal uniquement si aucun modèle principal n’est déjà configuré.

## Configuration par variable d’environnement uniquement

Rendez `COHERE_API_KEY` accessible au processus du Gateway, puis sélectionnez le modèle Cohere :

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
Si le Gateway s’exécute en tant que démon ou dans Docker, définissez `COHERE_API_KEY` pour ce service. L’exporter uniquement dans un shell interactif ne la rend pas accessible à un Gateway déjà en cours d’exécution.
</Note>

## Rubriques connexes

- [Fournisseurs de modèles](/fr/concepts/model-providers)
- [CLI des modèles](/fr/cli/models)
- [Répertoire des fournisseurs](/fr/providers/index)
