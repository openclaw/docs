---
read_when:
    - Vous souhaitez utiliser Ollama pour web_search
    - Vous voulez un fournisseur web_search sans clé
    - Vous souhaitez utiliser la recherche Web Ollama hébergée avec OLLAMA_API_KEY
    - Vous avez besoin d’instructions de configuration pour Ollama Web Search
summary: Recherche web Ollama via un hôte Ollama local ou l’API Ollama hébergée
title: Recherche web Ollama
x-i18n:
    generated_at: "2026-04-30T07:53:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: e626ee38b80fc66aa33589f030f9b420cf27848faed2183912ade17cb222771b
    source_path: tools/ollama-search.md
    workflow: 16
---

OpenClaw prend en charge **Ollama Web Search** comme fournisseur `web_search` intégré. Il
utilise l’API de recherche Web d’Ollama et renvoie des résultats structurés avec des titres, des URL
et des extraits.

Pour Ollama local ou auto-hébergé, cette configuration ne nécessite pas de clé API par
défaut. Elle nécessite toutefois :

- un hôte Ollama accessible depuis OpenClaw
- `ollama signin`

Pour une recherche hébergée directe, définissez l’URL de base du fournisseur Ollama sur `https://ollama.com`
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

Si vous configurez déjà Ollama comme fournisseur de modèles, le fournisseur de recherche Web peut
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

Le fournisseur de modèles Ollama utilise `baseUrl` comme clé canonique. Le fournisseur de recherche Web prend également en charge `baseURL` sur `models.providers.ollama` pour la compatibilité avec les exemples de configuration de style SDK OpenAI.

Si aucune URL de base Ollama explicite n’est définie, OpenClaw utilise `http://127.0.0.1:11434`.

Si votre hôte Ollama attend une authentification bearer, OpenClaw réutilise
`models.providers.ollama.apiKey` (ou l’authentification de fournisseur correspondante adossée à l’environnement)
pour les requêtes vers cet hôte configuré.

Ollama Web Search hébergé direct :

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

- Aucun champ de clé API propre à la recherche Web n’est requis pour ce fournisseur.
- Si l’hôte Ollama est protégé par authentification, OpenClaw réutilise la clé API normale du fournisseur Ollama
  lorsqu’elle est présente.
- Si `baseUrl` vaut `https://ollama.com`, OpenClaw appelle
  `https://ollama.com/api/web_search` directement et envoie la clé API Ollama configurée
  comme authentification bearer.
- Si l’hôte configuré n’expose pas la recherche Web et que `OLLAMA_API_KEY` est définie,
  OpenClaw peut se rabattre sur `https://ollama.com/api/web_search` sans envoyer
  cette clé d’environnement à l’hôte local.
- OpenClaw avertit pendant la configuration si Ollama est inaccessible ou si vous n’êtes pas connecté, mais
  ne bloque pas la sélection.
- La détection automatique à l’exécution peut se rabattre sur Ollama Web Search lorsqu’aucun fournisseur
  avec identifiants à priorité plus élevée n’est configuré.
- Les hôtes du démon Ollama local utilisent le point de terminaison proxy local
  `/api/experimental/web_search`, qui signe et transmet à Ollama Cloud.
- Les hôtes `https://ollama.com` utilisent directement le point de terminaison hébergé public
  `/api/web_search` avec une authentification par clé API bearer.

## Associé

- [Présentation de la recherche Web](/fr/tools/web) -- tous les fournisseurs et la détection automatique
- [Ollama](/fr/providers/ollama) -- configuration des modèles Ollama et modes cloud/local
