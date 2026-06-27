---
read_when:
    - Vous souhaitez utiliser GitHub Copilot comme fournisseur de modèle
    - Vous avez besoin du flux `openclaw models auth login-github-copilot`
    - Vous choisissez entre le fournisseur Copilot intégré, le harness Copilot SDK et Copilot Proxy
summary: Connectez-vous à GitHub Copilot depuis OpenClaw à l’aide du flux d’appareil ou de l’importation non interactive de jeton
title: GitHub Copilot
x-i18n:
    generated_at: "2026-06-27T18:04:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a0cd7103ec880592b1f4506ed844abe788f53040f3751e7034daf9aafedc2f94
    source_path: providers/github-copilot.md
    workflow: 16
---

GitHub Copilot est l’assistant de codage IA de GitHub. Il donne accès aux modèles Copilot
pour votre compte et votre offre GitHub. OpenClaw peut utiliser Copilot comme fournisseur
de modèles ou runtime d’agent de trois façons différentes.

## Trois façons d’utiliser Copilot dans OpenClaw

<Tabs>
  <Tab title="Fournisseur intégré (github-copilot)">
    Utilisez le flux natif de connexion par appareil pour obtenir un jeton GitHub, puis l’échanger contre
    des jetons d’API Copilot lorsque OpenClaw s’exécute. C’est le chemin **par défaut** et le plus simple,
    car il ne nécessite pas VS Code.

    <Steps>
      <Step title="Exécuter la commande de connexion">
        ```bash
        openclaw models auth login-github-copilot
        ```

        Vous serez invité à consulter une URL et à saisir un code à usage unique. Gardez le
        terminal ouvert jusqu’à la fin de l’opération.
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

  <Tab title="Plugin de harnais SDK Copilot (copilot)">
    Installez le plugin externe `@openclaw/copilot` lorsque vous voulez que la
    CLI et le SDK Copilot de GitHub prennent en charge la boucle d’agent de bas niveau pour certains
    modèles `github-copilot/*`.

    ```bash
    openclaw plugins install clawhub:@openclaw/copilot
    ```

    Activez ensuite le runtime pour un modèle ou un fournisseur :

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

    Choisissez cette option lorsque vous voulez des sessions Copilot CLI natives, un état de fil
    géré par le SDK et une Compaction prise en charge par Copilot pour ces tours d’agent. Consultez
    [Harnais SDK Copilot](/fr/plugins/copilot) pour le contrat de runtime complet.

  </Tab>

  <Tab title="Plugin Copilot Proxy (copilot-proxy)">
    Utilisez l’extension VS Code **Copilot Proxy** comme pont local. OpenClaw communique avec
    le point de terminaison `/v1` du proxy et utilise la liste de modèles que vous y configurez.

    <Note>
    Choisissez cette option si vous exécutez déjà Copilot Proxy dans VS Code ou si vous devez passer
    par lui. Vous devez activer le plugin et garder l’extension VS Code en cours d’exécution.
    </Note>

  </Tab>
</Tabs>

## Indicateurs facultatifs

| Indicateur      | Description                                         |
| --------------- | --------------------------------------------------- |
| `--yes`         | Ignorer l’invite de confirmation                    |
| `--set-default` | Appliquer aussi le modèle par défaut recommandé du fournisseur |

```bash
# Skip confirmation
openclaw models auth login-github-copilot --yes

# Login and set the default model in one step
openclaw models auth login --provider github-copilot --method device --set-default
```

## Intégration non interactive

Si vous disposez déjà d’un jeton d’accès OAuth GitHub pour Copilot, importez-le pendant
la configuration sans interface avec `openclaw onboard --non-interactive` :

```bash
openclaw onboard --non-interactive --accept-risk \
  --auth-choice github-copilot \
  --github-copilot-token "$COPILOT_GITHUB_TOKEN" \
  --skip-channels --skip-health
```

Vous pouvez aussi omettre `--auth-choice` ; passer `--github-copilot-token` déduit le
choix d’authentification du fournisseur GitHub Copilot. Si l’indicateur est omis, l’intégration se
rabatrra sur `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, puis `GITHUB_TOKEN`. Utilisez
`--secret-input-mode ref` avec `COPILOT_GITHUB_TOKEN` défini pour stocker un
`tokenRef` adossé à une variable d’environnement au lieu d’un texte en clair dans `auth-profiles.json`.

<AccordionGroup>
  <Accordion title="TTY interactif requis">
    Le flux de connexion par appareil nécessite un TTY interactif. Exécutez-le directement dans un
    terminal, et non dans un script non interactif ou un pipeline CI.
  </Accordion>

  <Accordion title="La disponibilité des modèles dépend de votre offre">
    La disponibilité des modèles Copilot dépend de votre offre GitHub. Si un modèle est
    rejeté, essayez un autre ID (par exemple `github-copilot/gpt-5.5`). Consultez
    les [modèles pris en charge par offre Copilot](https://docs.github.com/en/copilot/reference/ai-models/supported-models#supported-ai-models-per-copilot-plan)
    de GitHub pour la liste actuelle des modèles.
  </Accordion>

  <Accordion title="Actualisation du catalogue en direct depuis l’API Copilot">
    Une fois que le chemin d’authentification par connexion d’appareil (ou variable d’environnement) a résolu un jeton GitHub,
    OpenClaw actualise le catalogue de modèles à la demande depuis `${baseUrl}/models`
    (le même point de terminaison que celui utilisé par VS Code Copilot), afin que le runtime suive
    les droits propres au compte et les fenêtres de contexte exactes sans
    modification du manifeste. Les modèles Copilot récemment publiés deviennent visibles sans mise à niveau
    d’OpenClaw, et les fenêtres de contexte reflètent les limites réelles par modèle
    (par exemple 400k pour la série gpt-5.x, 1M pour les variantes internes
    `claude-opus-*-1m`).

    Le catalogue statique intégré reste la solution de repli visible lorsque la découverte
    est désactivée, que l’utilisateur n’a aucun profil d’authentification GitHub, que l’échange de jeton
    échoue ou que l’appel HTTPS `/models` renvoie une erreur. Pour vous désinscrire et vous appuyer entièrement
    sur le catalogue de manifeste statique (scénarios hors ligne / isolés) :

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
    Les ID de modèles Claude utilisent automatiquement le transport Anthropic Messages. Les modèles GPT,
    o-series et Gemini conservent le transport OpenAI Responses. OpenClaw
    sélectionne le bon transport en fonction de la référence du modèle.
  </Accordion>

  <Accordion title="Compatibilité des requêtes">
    OpenClaw envoie des en-têtes de requête de style IDE Copilot sur les transports Copilot,
    y compris pour les tours de Compaction intégrée, de résultats d’outils et de suivi d’images. Il
    n’active pas la continuation Responses au niveau du fournisseur pour Copilot, sauf si
    ce comportement a été vérifié avec l’API de Copilot.
  </Accordion>

  <Accordion title="Ordre de résolution des variables d’environnement">
    OpenClaw résout l’authentification Copilot à partir des variables d’environnement dans l’ordre de
    priorité suivant :

    | Priorité | Variable              | Remarques                        |
    | -------- | --------------------- | -------------------------------- |
    | 1        | `COPILOT_GITHUB_TOKEN` | Priorité la plus élevée, spécifique à Copilot |
    | 2        | `GH_TOKEN`            | Jeton GitHub CLI (repli)         |
    | 3        | `GITHUB_TOKEN`        | Jeton GitHub standard (le plus bas) |

    Lorsque plusieurs variables sont définies, OpenClaw utilise celle ayant la priorité la plus élevée.
    Le flux de connexion par appareil (`openclaw models auth login-github-copilot`) stocke
    son jeton dans le magasin de profils d’authentification et prévaut sur toutes les variables
    d’environnement.

  </Accordion>

  <Accordion title="Stockage des jetons">
    La connexion stocke un jeton GitHub dans le magasin de profils d’authentification et l’échange
    contre un jeton d’API Copilot lorsque OpenClaw s’exécute. Vous n’avez pas besoin de gérer le
    jeton manuellement.
  </Accordion>
</AccordionGroup>

<Warning>
La commande de connexion par appareil nécessite un TTY interactif. Utilisez l’intégration non interactive
lorsque vous avez besoin d’une configuration sans interface.
</Warning>

## Embeddings de recherche en mémoire

GitHub Copilot peut également servir de fournisseur d’embeddings pour la
[recherche en mémoire](/fr/concepts/memory-search). Si vous avez un abonnement Copilot et
que vous êtes connecté, OpenClaw peut l’utiliser pour les embeddings sans clé d’API séparée.

### Configuration

Définissez explicitement `memorySearch.provider` pour utiliser les embeddings GitHub Copilot. Si un
jeton GitHub est disponible, OpenClaw découvre les modèles d’embedding disponibles depuis
l’API Copilot et choisit automatiquement le meilleur.

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "github-copilot",
        // Optional: override the auto-discovered model
        model: "text-embedding-3-small",
      },
    },
  },
}
```

### Fonctionnement

1. OpenClaw résout votre jeton GitHub (à partir des variables d’environnement ou du profil d’authentification).
2. Il l’échange contre un jeton d’API Copilot de courte durée.
3. Il interroge le point de terminaison `/models` de Copilot pour découvrir les modèles d’embedding disponibles.
4. Il choisit le meilleur modèle (avec une préférence pour `text-embedding-3-small`).
5. Il envoie les requêtes d’embedding au point de terminaison `/embeddings` de Copilot.

La disponibilité des modèles dépend de votre offre GitHub. Si aucun modèle d’embedding n’est
disponible, OpenClaw ignore Copilot et essaie le fournisseur suivant.

## Connexe

<CardGroup cols={2}>
  <Card title="Sélection des modèles" href="/fr/concepts/model-providers" icon="layers">
    Choisir les fournisseurs, les références de modèles et le comportement de basculement.
  </Card>
  <Card title="OAuth et authentification" href="/fr/gateway/authentication" icon="key">
    Détails d’authentification et règles de réutilisation des identifiants.
  </Card>
</CardGroup>
