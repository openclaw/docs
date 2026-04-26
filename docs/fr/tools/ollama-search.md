---
read_when:
    - Vous souhaitez utiliser Ollama pour `web_search`
    - Vous souhaitez un fournisseur `web_search` sans clé
    - Vous avez besoin d’un guide de configuration pour la recherche web Ollama
summary: Recherche Web Ollama via votre hôte Ollama configuré
title: Recherche web Ollama
x-i18n:
    generated_at: "2026-04-26T11:40:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: dadee473d4e0674d9261b93adb1ddf77221e949d385fb522ccb630ed0e73d340
    source_path: tools/ollama-search.md
    workflow: 15
---

OpenClaw prend en charge **Ollama Web Search** comme fournisseur `web_search` intégré. Il
utilise l’API de recherche web d’Ollama et renvoie des résultats structurés avec titres, URL
et extraits.

Contrairement au fournisseur de modèles Ollama, cette configuration ne nécessite pas de clé API par
défaut. Elle exige toutefois :

- un hôte Ollama accessible depuis OpenClaw
- `ollama signin`

## Configuration

<Steps>
  <Step title="Démarrer Ollama">
    Assurez-vous qu’Ollama est installé et en cours d’exécution.
  </Step>
  <Step title="Se connecter">
    Exécutez :

    ```bash
    ollama signin
    ```

  </Step>
  <Step title="Choisir Ollama Web Search">
    Exécutez :

    ```bash
    openclaw configure --section web
    ```

    Sélectionnez ensuite **Ollama Web Search** comme fournisseur.

  </Step>
</Steps>

Si vous utilisez déjà Ollama pour les modèles, Ollama Web Search réutilise le même
hôte configuré.

## Config

```json5
{
  tools: {
    web: {
      search: {
        provider: "ollama",
      },
    },
  },
}
```

Remplacement facultatif de l’hôte Ollama :

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "http://ollama-host:11434",
      },
    },
  },
}
```

Si aucune URL de base Ollama explicite n’est définie, OpenClaw utilise `http://127.0.0.1:11434`.

Si votre hôte Ollama attend une authentification bearer, OpenClaw réutilise
`models.providers.ollama.apiKey` (ou l’authentification du fournisseur correspondante adossée à l’environnement)
pour les requêtes de recherche web également.

## Remarques

- Aucun champ de clé API spécifique à la recherche web n’est requis pour ce fournisseur.
- Si l’hôte Ollama est protégé par authentification, OpenClaw réutilise la clé API du fournisseur
  Ollama normale lorsqu’elle est présente.
- OpenClaw affiche un avertissement pendant la configuration si Ollama est inaccessible ou non connecté, mais
  cela ne bloque pas la sélection.
- L’auto-détection à l’exécution peut se rabattre sur Ollama Web Search lorsqu’aucun fournisseur
  authentifié de priorité supérieure n’est configuré.
- Le fournisseur utilise l’endpoint `/api/web_search` d’Ollama.

## Liens associés

- [Vue d’ensemble de la recherche web](/fr/tools/web) -- tous les fournisseurs et l’auto-détection
- [Ollama](/fr/providers/ollama) -- configuration des modèles Ollama et modes cloud/local
