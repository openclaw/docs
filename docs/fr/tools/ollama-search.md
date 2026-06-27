---
read_when:
    - Vous voulez utiliser Ollama pour web_search
    - Vous voulez un fournisseur web_search sans clé
    - Vous voulez utiliser la recherche Web Ollama hébergée avec OLLAMA_API_KEY
    - Vous avez besoin d’instructions de configuration pour la recherche Web Ollama
summary: Recherche Web Ollama via un hôte Ollama local ou l’API Ollama hébergée
title: Recherche web Ollama
x-i18n:
    generated_at: "2026-06-27T18:19:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4a30a6a2ed78d0d5f680ca2894e5e015cf99fbae2bcad4601727bbc9f560c124
    source_path: tools/ollama-search.md
    workflow: 16
---

OpenClaw prend en charge **Recherche web Ollama** comme fournisseur `web_search` intégré. Il
utilise l’API de recherche web d’Ollama et renvoie des résultats structurés avec des titres, des URL
et des extraits.

Pour Ollama local ou auto-hébergé, cette configuration ne nécessite pas de clé d’API par
défaut. Elle nécessite toutefois :

- un hôte Ollama joignable depuis OpenClaw
- `ollama signin`

Pour la recherche hébergée directe, définissez l’URL de base du fournisseur Ollama sur `https://ollama.com`
et fournissez une vraie `OLLAMA_API_KEY`.

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
  <Step title="Choisir Recherche web Ollama">
    Exécutez :

    ```bash
    openclaw configure --section web
    ```

    Sélectionnez ensuite **Recherche web Ollama** comme fournisseur.

  </Step>
</Steps>

Si vous utilisez déjà Ollama pour les modèles, Recherche web Ollama réutilise le même
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

Si vous configurez déjà Ollama comme fournisseur de modèles, le fournisseur de recherche web peut
réutiliser cet hôte à la place :

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

Le fournisseur de modèles Ollama utilise `baseUrl` comme clé canonique. Le fournisseur de recherche web prend également en charge `baseURL` sur `models.providers.ollama` pour la compatibilité avec les exemples de configuration de style SDK OpenAI.

Si aucune URL de base Ollama explicite n’est définie, OpenClaw utilise `http://127.0.0.1:11434`.

Si votre hôte Ollama attend une authentification bearer, OpenClaw réutilise
`models.providers.ollama.apiKey` (ou l’authentification fournisseur correspondante adossée à l’environnement)
pour les requêtes vers cet hôte configuré.

Recherche web Ollama hébergée directe :

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

## Notes

- Aucun champ de clé d’API spécifique à la recherche web n’est requis pour ce fournisseur.
- Si l’hôte Ollama est protégé par authentification, OpenClaw réutilise la clé d’API du fournisseur
  Ollama normal lorsqu’elle est présente.
- Si `baseUrl` vaut `https://ollama.com`, OpenClaw appelle
  `https://ollama.com/api/web_search` directement et envoie la clé d’API Ollama configurée
  comme authentification bearer.
- Si l’hôte configuré n’expose pas la recherche web et que `OLLAMA_API_KEY` est défini,
  OpenClaw peut se rabattre sur `https://ollama.com/api/web_search` sans envoyer
  cette clé d’environnement à l’hôte local.
- OpenClaw avertit pendant la configuration si Ollama est injoignable ou si vous n’êtes pas connecté, mais
  il ne bloque pas la sélection.
- OpenClaw ne sélectionne pas automatiquement Recherche web Ollama lorsqu’aucun fournisseur authentifié
  de priorité plus élevée n’est configuré ; choisissez-le explicitement avec
  `tools.web.search.provider: "ollama"`.
- Les hôtes du daemon Ollama local utilisent le point de terminaison proxy local
  `/api/experimental/web_search`, qui signe et transfère vers Ollama Cloud.
- Les hôtes `https://ollama.com` utilisent directement le point de terminaison hébergé public
  `/api/web_search` avec une authentification par clé d’API bearer.

## Connexe

- [Vue d’ensemble de la recherche web](/fr/tools/web) -- tous les fournisseurs et l’auto-détection
- [Ollama](/fr/providers/ollama) -- configuration des modèles Ollama et modes cloud/local
