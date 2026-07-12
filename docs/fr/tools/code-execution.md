---
read_when:
    - Vous souhaitez activer ou configurer `code_execution`
    - Vous souhaitez une analyse à distance sans accès au shell local
    - Vous souhaitez combiner x_search ou web_search avec une analyse Python à distance
summary: 'code_execution : exécuter une analyse Python distante dans un bac à sable avec xAI'
title: Exécution de code
x-i18n:
    generated_at: "2026-07-12T03:11:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1ab391daed9154f113535e6d241c45d5c08c22abdc012148a9f0f2ae5ec548b3
    source_path: tools/code-execution.md
    workflow: 16
---

`code_execution` exécute une analyse Python distante en environnement isolé sur l’API Responses de xAI
(`https://api.x.ai/v1/responses`, le même point de terminaison qu’utilise `x_search`). Il est
enregistré par le plugin `xai` intégré dans le cadre du contrat `tools`.

<Warning>
  `code_execution` s’exécute sur les serveurs de xAI. xAI facture 5 $ pour 1 000 appels d’outil,
  auxquels s’ajoutent les jetons d’entrée et de sortie du modèle.
</Warning>

| Propriété            | Valeur                                                                                     |
| -------------------- | ------------------------------------------------------------------------------------------ |
| Nom de l’outil       | `code_execution`                                                                           |
| Plugin fournisseur   | `xai` (intégré, `enabledByDefault: true`)                                                   |
| Authentification     | Profil d’authentification xAI, `XAI_API_KEY` ou `plugins.entries.xai.config.webSearch.apiKey` |
| Modèle par défaut    | `grok-4.3`                                                                                 |
| Délai par défaut     | 30 secondes                                                                                |
| `maxTurns` par défaut | non défini (xAI applique sa propre limite interne)                                         |

Utilisez-le pour les calculs, la mise en tableau, les statistiques rapides et les analyses
de type graphique, notamment avec les données renvoyées par `x_search` ou `web_search`. Il n’a
accès ni aux fichiers locaux, ni à votre shell, ni à votre dépôt, ni aux appareils associés, et il ne
conserve aucun état entre les appels. Considérez donc chaque appel comme une analyse éphémère, et non
comme une session de notebook. Pour obtenir des données X récentes, exécutez d’abord
[`x_search`](/fr/tools/web#x_search), puis transmettez-lui le résultat.

Pour une exécution locale, utilisez plutôt [`exec`](/fr/tools/exec).

## Configuration

<Steps>
  <Step title="Fournir les identifiants xAI">
    OAuth nécessite un abonnement SuperGrok ou X Premium admissible
    (vérification par code d’appareil, ce qui permet de l’utiliser depuis des hôtes distants sans
    rappel localhost) :

    ```bash
    openclaw models auth login --provider xai --method oauth
    ```

    Lors d’une nouvelle installation, le même choix est disponible pendant la configuration initiale :

    ```bash
    openclaw onboard --install-daemon --auth-choice xai-oauth
    ```

    Ou avec une clé d’API :

    ```bash
    openclaw models auth login --provider xai --method api-key
    export XAI_API_KEY=xai-...
    ```

    Ou via la configuration :

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              webSearch: {
                apiKey: "xai-...",
              },
            },
          },
        },
      },
    }
    ```

    Chacune de ces trois méthodes permet également d’utiliser `x_search` et la fonction
    `web_search` de Grok.

  </Step>

  <Step title="Activer et ajuster code_execution">
    Lorsque `enabled` est omis, `code_execution` est exposé uniquement si le fournisseur du
    modèle actif est `xai` et que les identifiants xAI peuvent être résolus. Pour un modèle actif
    dont le fournisseur non-xAI est connu, définissez
    `plugins.entries.xai.config.codeExecution.enabled` sur `true` afin d’activer explicitement
    l’utilisation entre fournisseurs. Si le fournisseur du modèle actif est absent ou non résolu,
    l’outil reste masqué. Définissez `enabled` sur `false` pour le désactiver pour tous les
    fournisseurs. Les identifiants xAI sont toujours requis.

    Utilisez le même bloc pour remplacer le modèle, la limite de tours ou le délai d’expiration :

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              codeExecution: {
                enabled: true, // requis pour un fournisseur de modèle non-xAI connu
                model: "grok-4.3", // remplace le modèle d’exécution de code xAI par défaut
                maxTurns: 2,            // limite facultative du nombre de tours internes de l’outil
                timeoutSeconds: 30,     // délai d’expiration de la requête (valeur par défaut : 30)
              },
            },
          },
        },
      },
    }
    ```

  </Step>

  <Step title="Redémarrer le Gateway">
    ```bash
    openclaw gateway restart
    ```

    `code_execution` apparaît dans la liste des outils de l’agent une fois que le plugin xAI
    s’est réenregistré et que les vérifications ci-dessus concernant le fournisseur, l’activation
    et l’authentification ont réussi.

  </Step>
</Steps>

## Utilisation

Indiquez explicitement l’objectif de l’analyse ; l’outil accepte un seul paramètre `task`.
Envoyez donc la demande complète et toutes les données intégrées dans une seule invite :

```text
Utilisez code_execution pour calculer la moyenne mobile sur 7 jours de ces nombres : ...
```

```text
Utilisez x_search pour trouver les publications mentionnant OpenClaw cette semaine, puis utilisez code_execution pour les compter par jour.
```

```text
Utilisez web_search pour recueillir les derniers résultats des benchmarks d’IA, puis utilisez code_execution pour comparer les variations en pourcentage.
```

## Erreurs

Sans authentification, l’outil renvoie une erreur JSON structurée (et non une
exception levée), ce qui permet à l’agent de se corriger lui-même :

```json
{
  "error": "missing_xai_api_key",
  "message": "code_execution nécessite des identifiants xAI. Exécutez `openclaw onboard --auth-choice xai-oauth` pour vous connecter avec Grok, exécutez `openclaw onboard --auth-choice xai-api-key`, définissez `XAI_API_KEY` dans l’environnement du Gateway ou configurez `plugins.entries.xai.config.webSearch.apiKey`.",
  "docs": "https://docs.openclaw.ai/tools/code-execution"
}
```

## Contenu associé

<CardGroup cols={2}>
  <Card title="Outil Exec" href="/fr/tools/exec" icon="terminal">
    Exécution locale du shell sur votre machine ou un Node associé.
  </Card>
  <Card title="Approbations Exec" href="/fr/tools/exec-approvals" icon="shield">
    Politique d’autorisation ou de refus pour l’exécution du shell.
  </Card>
  <Card title="Outils web" href="/fr/tools/web" icon="globe">
    `web_search`, `x_search` et `web_fetch`.
  </Card>
  <Card title="Fournisseur xAI" href="/fr/providers/xai" icon="microchip">
    Modèles Grok, recherche web/X et configuration de l’exécution de code.
  </Card>
</CardGroup>
