---
read_when:
    - Vous souhaitez utiliser GitHub Copilot comme fournisseur de modèles
    - Vous avez besoin du flux `openclaw models auth login-github-copilot`
    - Vous choisissez entre le fournisseur Copilot intégré, le harnais du SDK Copilot et Copilot Proxy
summary: Connectez-vous à GitHub Copilot depuis OpenClaw à l’aide du flux d’appareil ou de l’importation non interactive d’un jeton
title: GitHub Copilot
x-i18n:
    generated_at: "2026-07-12T03:15:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e731d46dd387bbecb0219c4ec3e319fb8d07fd4017da8035561f110501587ad4
    source_path: providers/github-copilot.md
    workflow: 16
---

GitHub Copilot est l’assistant de codage IA de GitHub. Il donne accès aux modèles
Copilot associés à votre compte et à votre offre GitHub. OpenClaw peut utiliser
Copilot comme fournisseur de modèles ou environnement d’exécution d’agent de
trois manières différentes.

## Trois manières d’utiliser Copilot dans OpenClaw

<Tabs>
  <Tab title="Fournisseur intégré (github-copilot)">
    Utilisez le flux natif de connexion par appareil pour obtenir un jeton GitHub,
    puis l’échanger contre des jetons d’API Copilot lors de l’exécution d’OpenClaw.
    Il s’agit de la méthode **par défaut** et la plus simple, car elle ne nécessite
    pas VS Code.

    <Steps>
      <Step title="Exécuter la commande de connexion">
        ```bash
        openclaw models auth login-github-copilot
        ```

        Vous serez invité à consulter une URL et à saisir un code à usage unique.
        Gardez le terminal ouvert jusqu’à la fin de l’opération.
      </Step>
      <Step title="Définir un modèle par défaut">
        ```bash
        openclaw models set github-copilot/claude-opus-4.7
        ```

        Ou dans la configuration :

        ```json5
        {
          agents: {
            defaults: { model: { primary: "github-copilot/claude-opus-4.7" } },
          },
        }
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Plugin de harnais du SDK Copilot (copilot)">
    Installez le Plugin externe `@openclaw/copilot` lorsque vous souhaitez que
    la CLI et le SDK Copilot de GitHub gèrent la boucle d’agent de bas niveau
    pour certains modèles `github-copilot/*`.

    ```bash
    openclaw plugins install @openclaw/copilot
    ```

    Activez ensuite l’environnement d’exécution pour un modèle ou un fournisseur :

    ```json5
    {
      agents: {
        defaults: {
          model: "github-copilot/gpt-5.5",
          models: {
            "github-copilot/gpt-5.5": {
              agentRuntime: { id: "copilot" },
            },
          },
        },
      },
    }
    ```

    Choisissez cette option si vous souhaitez des sessions natives de la CLI
    Copilot, un état des fils de discussion géré par le SDK et une Compaction
    gérée par Copilot pour ces tours d’agent. Sans l’activation explicite
    d’`agentRuntime`, les modèles `github-copilot/*` continuent d’utiliser le
    fournisseur intégré. Consultez le [harnais du SDK Copilot](/fr/plugins/copilot)
    pour connaître l’intégralité du contrat d’exécution.

  </Tab>

  <Tab title="Plugin Copilot Proxy (copilot-proxy)">
    Utilisez l’extension VS Code **Copilot Proxy** comme passerelle locale.
    OpenClaw communique avec le point de terminaison `/v1` du proxy
    (`http://localhost:3000/v1` par défaut) et utilise la liste de modèles que
    vous configurez.

    Le Plugin `copilot-proxy` est fourni avec OpenClaw et activé par défaut.
    Configurez l’URL de base et les identifiants de modèle avec :

    ```bash
    openclaw models auth login --provider copilot-proxy --set-default
    ```

    <Note>
    Choisissez cette option si vous exécutez déjà Copilot Proxy dans VS Code ou
    devez acheminer les requêtes par son intermédiaire. L’extension VS Code doit
    rester en cours d’exécution.
    </Note>

  </Tab>
</Tabs>

## GitHub Enterprise (résidence des données)

Si votre organisation utilise un locataire GitHub Enterprise avec résidence des
données (un hôte `*.ghe.com` tel que `your-org.ghe.com`), Copilot réside sur des
points de terminaison propres au locataire plutôt que sur le service public
`github.com`. OpenClaw propose cette option d’authentification de manière native,
afin que vous n’ayez pas à modifier manuellement les URL.

<Steps>
  <Step title="Choisir l’option d’authentification Enterprise">
    Lors de l’intégration ou dans `openclaw models auth`, choisissez
    **GitHub Copilot (Enterprise / data residency)**. Vous serez invité à saisir
    votre domaine Enterprise, par exemple `your-org.ghe.com`, puis la connexion
    par appareil s’effectuera auprès de ce locataire.

    Saisissez uniquement la racine du locataire (`your-org.ghe.com`). Les hôtes
    de service dérivés tels que `api.your-org.ghe.com` ou
    `copilot-api.your-org.ghe.com` ne sont pas acceptés ; OpenClaw déduit
    automatiquement ces points de terminaison à partir de la racine du locataire.

    ```bash
    openclaw models auth login --provider github-copilot --method device-enterprise
    ```

  </Step>
  <Step title="Le domaine est enregistré dans la configuration">
    L’hôte choisi est stocké dans les paramètres du fournisseur, afin que les
    actualisations ultérieures du jeton et les complétions ciblent
    automatiquement le locataire :

    ```json5
    {
      models: {
        providers: {
          "github-copilot": { params: { githubDomain: "your-org.ghe.com" } },
        },
      },
    }
    ```

  </Step>
</Steps>

Le flux par appareil, l’échange de jetons et les complétions sont respectivement
résolus vers `https://your-org.ghe.com/login/device/code`,
`https://api.your-org.ghe.com/copilot_internal/v2/token` et
`https://copilot-api.your-org.ghe.com`. Les jetons de résidence des données
portent une marque du locataire et aucune indication de proxy ; l’URL de base
des complétions se rabat donc sur l’hôte Copilot du locataire plutôt que sur le
point de terminaison public.

<Note>
Tout changement de domaine relance systématiquement la connexion par appareil.
Si vous disposez déjà d’un jeton Copilot enregistré et choisissez un autre
domaine (`github.com` public ↔ locataire `*.ghe.com`, ou passage d’un locataire
à un autre), OpenClaw ne réutilise pas le jeton existant : il impose une nouvelle
connexion afin que le jeton soit limité au domaine écrit dans la configuration.
Une nouvelle connexion pour le *même* domaine propose toujours de réutiliser le
jeton actuel. Le retour au service public `github.com` efface le `githubDomain`
enregistré afin que la configuration revienne à la valeur par défaut.
</Note>

<Note>
La variable d’environnement `COPILOT_GITHUB_DOMAIN` remplace le domaine résolu
pour tous les chemins Copilot qui le déterminent : la connexion Enterprise par
appareil (`--method device-enterprise`), le raccourci autonome
`openclaw models auth login-github-copilot`, l’actualisation des jetons, les
plongements et les complétions. Définissez-la sur votre hôte `*.ghe.com` pour les
configurations entièrement sans interface ou en CI. Laissez-la non définie, et
le paramètre de configuration absent, pour utiliser le service public
`github.com`. Les connexions enregistrent le domaine pour lequel le jeton a été
émis, et l’effacent lors d’une connexion au service public `github.com`, afin
que l’acheminement reste correct même après la suppression de la variable
d’environnement.
</Note>

## Indicateurs facultatifs

| Commande                                                               | Indicateur      | Description                                                        |
| ---------------------------------------------------------------------- | --------------- | ------------------------------------------------------------------ |
| `openclaw models auth login-github-copilot`                            | `--yes`         | Remplacer un profil d’authentification existant sans confirmation  |
| `openclaw models auth login --provider github-copilot --method device` | `--set-default` | Appliquer également le modèle par défaut recommandé du fournisseur |

```bash
# Ignorer la confirmation de reconnexion
openclaw models auth login-github-copilot --yes

# Se connecter et définir le modèle par défaut en une seule étape
openclaw models auth login --provider github-copilot --method device --set-default
```

## Intégration non interactive

Le flux de connexion par appareil nécessite un TTY interactif. Pour une
configuration sans interface, importez un jeton d’accès OAuth GitHub existant
avec `openclaw onboard --non-interactive` :

```bash
openclaw onboard --non-interactive --accept-risk \
  --auth-choice github-copilot \
  --github-copilot-token "$COPILOT_GITHUB_TOKEN" \
  --skip-channels --skip-health
```

Vous pouvez également omettre `--auth-choice` ; le passage de
`--github-copilot-token` permet de déduire l’option d’authentification du
fournisseur GitHub Copilot. Si l’indicateur est omis, l’intégration utilise,
dans l’ordre, `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, puis `GITHUB_TOKEN`. Utilisez
`--secret-input-mode ref` avec `COPILOT_GITHUB_TOKEN` défini pour stocker un
`tokenRef` adossé à une variable d’environnement plutôt que du texte en clair
dans `auth-profiles.json`.

<AccordionGroup>
  <Accordion title="TTY interactif requis">
    Le flux de connexion par appareil nécessite un TTY interactif. Exécutez-le
    directement dans un terminal, et non dans un script non interactif ou un
    pipeline CI.
  </Accordion>

  <Accordion title="La disponibilité des modèles dépend de votre offre">
    La disponibilité des modèles Copilot dépend de votre offre GitHub. Si un
    modèle est refusé, essayez un autre identifiant, par exemple
    `github-copilot/gpt-5.5`. Consultez les
    [modèles pris en charge par offre Copilot](https://docs.github.com/en/copilot/reference/ai-models/supported-models#supported-ai-models-per-copilot-plan)
    de GitHub pour obtenir la liste actuelle des modèles.
  </Accordion>

  <Accordion title="Actualisation en direct du catalogue depuis l’API Copilot">
    Une fois que le chemin d’authentification par connexion d’appareil ou
    variable d’environnement a résolu un jeton GitHub, OpenClaw actualise à la
    demande le catalogue de modèles depuis `${baseUrl}/models`, le même point de
    terminaison que celui utilisé par VS Code Copilot. L’environnement
    d’exécution suit ainsi les droits propres au compte et les fenêtres de
    contexte exactes, sans modification répétée du manifeste. Les modèles
    Copilot nouvellement publiés deviennent visibles sans mise à niveau
    d’OpenClaw, et les fenêtres de contexte reflètent les limites réelles de
    chaque modèle, par exemple 400 000 pour la série gpt-5.x et 1 million pour
    les variantes internes `claude-opus-*-1m`.

    Le catalogue statique fourni reste la solution de repli visible lorsque la
    découverte est désactivée, que l’utilisateur ne possède aucun profil
    d’authentification GitHub, que l’échange de jetons échoue ou que l’appel
    HTTPS à `/models` génère une erreur. Pour désactiver cette fonctionnalité et
    vous appuyer entièrement sur le catalogue statique du manifeste dans les
    scénarios hors ligne ou isolés du réseau :

    ```json5
    {
      plugins: {
        entries: {
          "github-copilot": {
            config: { discovery: { enabled: false } },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Sélection du transport">
    Les identifiants de modèles Claude utilisent automatiquement le transport
    Anthropic Messages. Les modèles Gemini utilisent le transport OpenAI Chat
    Completions ; les modèles GPT et de la série o conservent le transport
    OpenAI Responses. OpenClaw sélectionne le transport approprié en fonction
    de la référence du modèle.
  </Accordion>

  <Accordion title="Compatibilité des requêtes">
    OpenClaw envoie des en-têtes de requête de type IDE Copilot sur les
    transports Copilot, notamment les versions de l’éditeur et du Plugin VS Code
    ainsi que l’identifiant d’intégration `vscode-chat`. Il marque les tours de
    suivi des résultats d’outils comme initiés par l’agent et définit l’en-tête
    de vision Copilot lorsqu’un tour contient une image en entrée.
  </Accordion>

  <Accordion title="Ordre de résolution des variables d’environnement">
    OpenClaw résout l’authentification Copilot à partir des variables
    d’environnement selon l’ordre de priorité suivant :

    | Priorité | Variable               | Remarques                                  |
    | -------- | ---------------------- | ------------------------------------------ |
    | 1        | `COPILOT_GITHUB_TOKEN` | Priorité la plus élevée, propre à Copilot  |
    | 2        | `GH_TOKEN`             | Jeton de la CLI GitHub, utilisé en repli   |
    | 3        | `GITHUB_TOKEN`         | Jeton GitHub standard, priorité la plus basse |

    Lorsque plusieurs variables sont définies, OpenClaw utilise celle dont la
    priorité est la plus élevée. Le flux de connexion par appareil
    (`openclaw models auth login-github-copilot`) stocke son jeton dans le
    magasin de profils d’authentification et prévaut sur toutes les variables
    d’environnement.

  </Accordion>

  <Accordion title="Stockage des jetons">
    La connexion stocke un jeton GitHub dans le magasin de profils
    d’authentification, sous l’identifiant de profil `github-copilot:github`, et
    l’échange contre un jeton d’API Copilot à courte durée de vie lors de
    l’exécution d’OpenClaw. Vous n’avez pas besoin de gérer manuellement le jeton.
  </Accordion>
</AccordionGroup>

## Plongements pour la recherche en mémoire

GitHub Copilot peut également servir de fournisseur de plongements pour la
[recherche en mémoire](/fr/concepts/memory-search). Si vous disposez d’un abonnement
Copilot et vous êtes connecté, OpenClaw peut l’utiliser pour les plongements
sans clé d’API distincte.

### Configuration

Définissez explicitement `memorySearch.provider` pour utiliser les plongements
GitHub Copilot. Si un jeton GitHub est disponible, OpenClaw découvre les modèles
de plongement disponibles depuis l’API Copilot et sélectionne automatiquement
le meilleur.

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "github-copilot",
        // Facultatif : remplacer le modèle découvert automatiquement
        model: "text-embedding-3-small",
      },
    },
  },
}
```

### Fonctionnement

1. OpenClaw résout votre jeton GitHub à partir des variables d’environnement ou
   du profil d’authentification.
2. Il l’échange contre un jeton d’API Copilot à courte durée de vie.
3. Il interroge le point de terminaison `/models` de Copilot pour découvrir les
   modèles de plongement disponibles.
4. Il sélectionne le meilleur modèle selon l’ordre de préférence suivant :
   `text-embedding-3-small`, `text-embedding-3-large`,
   `text-embedding-ada-002`.
5. Il envoie les requêtes de plongement au point de terminaison `/embeddings`
   de Copilot.

La disponibilité des modèles dépend de votre offre GitHub. Si aucun modèle de
plongement n’est disponible, OpenClaw ignore Copilot et essaie le fournisseur
suivant.

## Voir aussi

<CardGroup cols={2}>
  <Card title="Sélection du modèle" href="/fr/concepts/model-providers" icon="layers">
    Choix des fournisseurs, des références de modèles et du comportement de basculement.
  </Card>
  <Card title="OAuth et authentification" href="/fr/gateway/authentication" icon="key">
    Détails de l’authentification et règles de réutilisation des identifiants.
  </Card>
</CardGroup>
