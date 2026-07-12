---
read_when:
    - Vous souhaitez utiliser Ollama pour `web_search`
    - Vous souhaitez un fournisseur web_search sans clé
    - Vous souhaitez utiliser Ollama Web Search hébergé avec OLLAMA_API_KEY
    - Vous avez besoin d’instructions pour configurer Ollama Web Search
summary: Recherche web Ollama via un hôte Ollama local ou l’API Ollama hébergée
title: Recherche web Ollama
x-i18n:
    generated_at: "2026-07-12T03:10:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: edbbd887841339ab4c0c62ab7682a22fe99434a788957a91989fce6942187e9a
    source_path: tools/ollama-search.md
    workflow: 16
---

OpenClaw prend en charge **Ollama Web Search** comme fournisseur `web_search` intégré, qui renvoie les titres, les URL et des extraits provenant de l’API de recherche web d’Ollama.

Par défaut, Ollama local ou auto-hébergé ne nécessite aucune clé API ; il requiert un hôte Ollama accessible ainsi que `ollama signin`. La recherche hébergée directe (sans Ollama local) nécessite `baseUrl: "https://ollama.com"` et une véritable clé `OLLAMA_API_KEY`.

## Configuration

<Steps>
  <Step title="Démarrer Ollama">
    Vérifiez qu’Ollama est installé et en cours d’exécution.
  </Step>
  <Step title="Se connecter">
    ```bash
    ollama signin
    ```
  </Step>
  <Step title="Choisir Ollama Web Search">
    ```bash
    openclaw configure --section web
    ```

    Sélectionnez **Ollama Web Search** comme fournisseur.

  </Step>
</Steps>

Si vous utilisez déjà Ollama pour les modèles, Ollama Web Search réutilise le même hôte configuré.

<Note>
  OpenClaw ne sélectionne jamais automatiquement Ollama Web Search à la place d’un fournisseur avec identifiants de priorité supérieure ; vous devez le choisir explicitement avec `tools.web.search.provider: "ollama"`.
</Note>

## Configuration

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

Remplacement facultatif de l’hôte, limité à la recherche web :

```json5
{
  plugins: {
    entries: {
      ollama: {
        config: {
          webSearch: {
            baseUrl: "http://ollama-host:11434",
          },
        },
      },
    },
  },
}
```

Vous pouvez aussi réutiliser l’hôte déjà configuré pour le fournisseur de modèles Ollama :

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

`models.providers.ollama.baseUrl` est la clé canonique ; le fournisseur de recherche web y accepte également `baseURL` pour assurer la compatibilité avec les exemples de configuration de style SDK OpenAI. Si rien n’est défini, OpenClaw utilise par défaut `http://127.0.0.1:11434`.

Ollama Web Search hébergé direct (sans Ollama local) :

```json5
{
  models: {
    providers: {
      ollama: {
        baseUrl: "https://ollama.com",
        apiKey: "OLLAMA_API_KEY",
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "ollama",
      },
    },
  },
}
```

## Authentification et routage des requêtes

- Il n’existe aucun champ de clé API propre à la recherche web ; le fournisseur réutilise `models.providers.ollama.apiKey` (ou l’authentification correspondante du fournisseur issue de l’environnement) lorsque l’hôte configuré est protégé par authentification.
- Ordre de résolution de l’hôte : `plugins.entries.ollama.config.webSearch.baseUrl` → `models.providers.ollama.baseUrl` (ou `baseURL`) → `http://127.0.0.1:11434`.
- Si l’hôte résolu est `https://ollama.com`, OpenClaw appelle directement `https://ollama.com/api/web_search` en utilisant la clé API comme authentification par jeton porteur.
- Sinon, OpenClaw appelle d’abord le point de terminaison du proxy local `/api/experimental/web_search` (qui signe la requête et la transmet à Ollama Cloud), puis se replie sur `/api/web_search` sur le même hôte. Si les deux échouent et que `OLLAMA_API_KEY` est définie, il réessaie une fois auprès de `https://ollama.com/api/web_search` avec cette clé, sans l’envoyer à l’hôte local.
- OpenClaw affiche un avertissement pendant la configuration si Ollama est inaccessible ou si aucune session n’y est ouverte, mais n’empêche pas la sélection du fournisseur.

## Voir aussi

- [Présentation de la recherche web](/fr/tools/web) -- tous les fournisseurs et la détection automatique
- [Ollama](/fr/providers/ollama) -- configuration des modèles Ollama et modes cloud/local
