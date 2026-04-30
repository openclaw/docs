---
read_when:
    - Vous souhaitez utiliser GitHub Copilot comme fournisseur de modèles
    - Vous avez besoin du flux `openclaw models auth login-github-copilot`
summary: Connectez-vous à GitHub Copilot depuis OpenClaw à l’aide du flux d’appareil ou de l’importation de jeton non interactive
title: GitHub Copilot
x-i18n:
    generated_at: "2026-04-30T07:43:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2ebcee41d4a3fffff8f20072e99e6dbb57baa2d9ec7eddad1d426ee37805597c
    source_path: providers/github-copilot.md
    workflow: 16
---

GitHub Copilot est l’assistant de codage IA de GitHub. Il donne accès aux modèles
Copilot pour votre compte et votre forfait GitHub. OpenClaw peut utiliser Copilot comme
fournisseur de modèles de deux manières différentes.

## Deux façons d’utiliser Copilot dans OpenClaw

<Tabs>
  <Tab title="Fournisseur intégré (github-copilot)">
    Utilisez le flux natif de connexion par appareil pour obtenir un jeton GitHub, puis l’échanger contre des
    jetons API Copilot lorsque OpenClaw s’exécute. C’est le chemin **par défaut** et le plus simple
    parce qu’il ne nécessite pas VS Code.

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

  <Tab title="Plugin Copilot Proxy (copilot-proxy)">
    Utilisez l’extension VS Code **Copilot Proxy** comme pont local. OpenClaw communique avec
    le point de terminaison `/v1` du proxy et utilise la liste de modèles que vous y configurez.

    <Note>
    Choisissez cette option si vous exécutez déjà Copilot Proxy dans VS Code ou si vous devez passer
    par celui-ci. Vous devez activer le Plugin et garder l’extension VS Code en cours d’exécution.
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

Vous pouvez également omettre `--auth-choice` ; le passage de `--github-copilot-token` déduit le
choix d’authentification du fournisseur GitHub Copilot. Si l’indicateur est omis, l’intégration se rabat
sur `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, puis `GITHUB_TOKEN`. Utilisez
`--secret-input-mode ref` avec `COPILOT_GITHUB_TOKEN` défini pour stocker un
`tokenRef` basé sur une variable d’environnement au lieu de texte brut dans `auth-profiles.json`.

<AccordionGroup>
  <Accordion title="TTY interactif requis">
    Le flux de connexion par appareil nécessite un TTY interactif. Exécutez-le directement dans un
    terminal, et non dans un script non interactif ou un pipeline CI.
  </Accordion>

  <Accordion title="La disponibilité des modèles dépend de votre forfait">
    La disponibilité des modèles Copilot dépend de votre forfait GitHub. Si un modèle est
    rejeté, essayez un autre ID (par exemple `github-copilot/gpt-4.1`).
  </Accordion>

  <Accordion title="Sélection du transport">
    Les ID de modèles Claude utilisent automatiquement le transport Anthropic Messages. Les modèles GPT,
    o-series et Gemini conservent le transport OpenAI Responses. OpenClaw
    sélectionne le bon transport selon la référence du modèle.
  </Accordion>

  <Accordion title="Compatibilité des requêtes">
    OpenClaw envoie des en-têtes de requête de style IDE Copilot sur les transports Copilot,
    y compris les tours de suivi intégrés pour la Compaction, les résultats d’outils et les images. Il
    n’active pas la continuation Responses au niveau du fournisseur pour Copilot, sauf si
    ce comportement a été vérifié avec l’API de Copilot.
  </Accordion>

  <Accordion title="Ordre de résolution des variables d’environnement">
    OpenClaw résout l’authentification Copilot à partir des variables d’environnement dans l’ordre de
    priorité suivant :

    | Priorité | Variable              | Notes                            |
    | -------- | --------------------- | -------------------------------- |
    | 1        | `COPILOT_GITHUB_TOKEN` | Priorité la plus élevée, spécifique à Copilot |
    | 2        | `GH_TOKEN`            | Jeton GitHub CLI (repli)         |
    | 3        | `GITHUB_TOKEN`        | Jeton GitHub standard (le plus bas) |

    Lorsque plusieurs variables sont définies, OpenClaw utilise celle ayant la priorité la plus élevée.
    Le flux de connexion par appareil (`openclaw models auth login-github-copilot`) stocke
    son jeton dans le magasin des profils d’authentification et prend le pas sur toutes les variables
    d’environnement.

  </Accordion>

  <Accordion title="Stockage des jetons">
    La connexion stocke un jeton GitHub dans le magasin des profils d’authentification et l’échange
    contre un jeton API Copilot lorsque OpenClaw s’exécute. Vous n’avez pas besoin de gérer le
    jeton manuellement.
  </Accordion>
</AccordionGroup>

<Warning>
La commande de connexion par appareil nécessite un TTY interactif. Utilisez l’intégration non interactive
lorsque vous devez effectuer une configuration sans interface.
</Warning>

## Embeddings de recherche mémoire

GitHub Copilot peut également servir de fournisseur d’embeddings pour la
[recherche mémoire](/fr/concepts/memory-search). Si vous avez un abonnement Copilot et
que vous êtes connecté, OpenClaw peut l’utiliser pour les embeddings sans clé API distincte.

### Détection automatique

Lorsque `memorySearch.provider` vaut `"auto"` (valeur par défaut), GitHub Copilot est essayé
à la priorité 15 -- après les embeddings locaux mais avant OpenAI et les autres fournisseurs
payants. Si un jeton GitHub est disponible, OpenClaw découvre les modèles
d’embeddings disponibles depuis l’API Copilot et choisit automatiquement le meilleur.

### Configuration explicite

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

1. OpenClaw résout votre jeton GitHub (depuis les variables d’environnement ou le profil d’authentification).
2. Il l’échange contre un jeton API Copilot de courte durée.
3. Il interroge le point de terminaison `/models` de Copilot pour découvrir les modèles d’embeddings disponibles.
4. Il choisit le meilleur modèle (préfère `text-embedding-3-small`).
5. Il envoie les requêtes d’embeddings au point de terminaison `/embeddings` de Copilot.

La disponibilité des modèles dépend de votre forfait GitHub. Si aucun modèle d’embeddings n’est
disponible, OpenClaw ignore Copilot et essaie le fournisseur suivant.

## Connexe

<CardGroup cols={2}>
  <Card title="Sélection des modèles" href="/fr/concepts/model-providers" icon="layers">
    Choix des fournisseurs, des références de modèles et du comportement de basculement.
  </Card>
  <Card title="OAuth et authentification" href="/fr/gateway/authentication" icon="key">
    Détails d’authentification et règles de réutilisation des identifiants.
  </Card>
</CardGroup>
