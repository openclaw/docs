---
read_when:
    - Vous voulez utiliser GitHub Copilot comme fournisseur de modèles
    - Vous avez besoin du flux `openclaw models auth login-github-copilot`
summary: Se connecter à GitHub Copilot depuis OpenClaw à l’aide du flux d’appareil ou de l’importation de jeton non interactive
title: GitHub Copilot
x-i18n:
    generated_at: "2026-05-11T20:52:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 32268f86bc3e9d4f4d09d105c78c0fc9527aaebd8251865899711e86b25391e5
    source_path: providers/github-copilot.md
    workflow: 16
---

GitHub Copilot est l’assistant de codage IA de GitHub. Il donne accès aux modèles
Copilot pour votre compte et votre forfait GitHub. OpenClaw peut utiliser Copilot comme fournisseur
de modèles de deux manières différentes.

## Deux façons d’utiliser Copilot dans OpenClaw

<Tabs>
  <Tab title="Fournisseur intégré (github-copilot)">
    Utilisez le flux natif de connexion par appareil pour obtenir un jeton GitHub, puis l’échanger contre
    des jetons API Copilot lorsque OpenClaw s’exécute. C’est le chemin **par défaut** et le plus simple,
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

        Ou dans la configuration :

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
    Choisissez cette option si vous exécutez déjà Copilot Proxy dans VS Code ou si vous devez effectuer le routage
    par son intermédiaire. Vous devez activer le plugin et garder l’extension VS Code en cours d’exécution.
    </Note>

  </Tab>
</Tabs>

## Indicateurs facultatifs

| Indicateur      | Description                                                |
| --------------- | ---------------------------------------------------------- |
| `--yes`         | Ignore l’invite de confirmation                            |
| `--set-default` | Applique aussi le modèle par défaut recommandé du fournisseur |

```bash
# Skip confirmation
openclaw models auth login-github-copilot --yes

# Login and set the default model in one step
openclaw models auth login --provider github-copilot --method device --set-default
```

## Intégration non interactive

Si vous disposez déjà d’un jeton d’accès OAuth GitHub pour Copilot, importez-le pendant
la configuration headless avec `openclaw onboard --non-interactive` :

```bash
openclaw onboard --non-interactive --accept-risk \
  --auth-choice github-copilot \
  --github-copilot-token "$COPILOT_GITHUB_TOKEN" \
  --skip-channels --skip-health
```

Vous pouvez aussi omettre `--auth-choice` ; le passage de `--github-copilot-token` déduit le
choix d’authentification du fournisseur GitHub Copilot. Si l’indicateur est omis, l’intégration se rabat
sur `COPILOT_GITHUB_TOKEN`, `GH_TOKEN`, puis `GITHUB_TOKEN`. Utilisez
`--secret-input-mode ref` avec `COPILOT_GITHUB_TOKEN` défini pour stocker un
`tokenRef` adossé à l’environnement au lieu d’un texte en clair dans `auth-profiles.json`.

<AccordionGroup>
  <Accordion title="TTY interactive requise">
    Le flux de connexion par appareil nécessite une TTY interactive. Exécutez-le directement dans un
    terminal, et non dans un script non interactif ou un pipeline CI.
  </Accordion>

  <Accordion title="La disponibilité des modèles dépend de votre forfait">
    La disponibilité des modèles Copilot dépend de votre forfait GitHub. Si un modèle est
    rejeté, essayez un autre ID (par exemple `github-copilot/gpt-4.1`).
  </Accordion>

  <Accordion title="Actualisation du catalogue en direct depuis l’API Copilot">
    Une fois que le chemin d’authentification par connexion d’appareil (ou variable d’environnement) a résolu un jeton GitHub,
    OpenClaw actualise le catalogue de modèles à la demande depuis `${baseUrl}/models`
    (le même point de terminaison que VS Code Copilot utilise), de sorte que le runtime suit
    les droits par compte et les fenêtres de contexte exactes sans renouvellement du manifeste.
    Les modèles Copilot nouvellement publiés deviennent visibles sans mise à niveau d’OpenClaw,
    et les fenêtres de contexte reflètent les limites réelles propres à chaque modèle
    (p. ex. 400 k pour la série gpt-5.x, 1 M pour les variantes internes
    `claude-opus-*-1m`).

    Le catalogue statique intégré reste le repli visible lorsque la découverte
    est désactivée, que l’utilisateur n’a pas de profil d’authentification GitHub, que l’échange de jeton
    échoue ou que l’appel HTTPS `/models` renvoie une erreur. Pour vous désinscrire et vous appuyer entièrement
    sur le catalogue statique du manifeste (scénarios hors ligne / isolés) :

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
    sélectionne le transport correct en fonction de la référence du modèle.
  </Accordion>

  <Accordion title="Compatibilité des requêtes">
    OpenClaw envoie des en-têtes de requête de style IDE Copilot sur les transports Copilot,
    y compris pour les tours de suivi intégrés de Compaction, de résultats d’outils et d’images. Il
    n’active pas la continuation Responses au niveau du fournisseur pour Copilot, sauf si
    ce comportement a été vérifié avec l’API de Copilot.
  </Accordion>

  <Accordion title="Ordre de résolution des variables d’environnement">
    OpenClaw résout l’authentification Copilot depuis les variables d’environnement selon l’ordre de
    priorité suivant :

    | Priorité | Variable              | Notes                                  |
    | -------- | --------------------- | -------------------------------------- |
    | 1        | `COPILOT_GITHUB_TOKEN` | Priorité la plus élevée, propre à Copilot |
    | 2        | `GH_TOKEN`            | Jeton GitHub CLI (repli)               |
    | 3        | `GITHUB_TOKEN`        | Jeton GitHub standard (le plus bas)    |

    Lorsque plusieurs variables sont définies, OpenClaw utilise celle qui a la priorité la plus élevée.
    Le flux de connexion par appareil (`openclaw models auth login-github-copilot`) stocke
    son jeton dans le magasin de profils d’authentification et prime sur toutes les variables
    d’environnement.

  </Accordion>

  <Accordion title="Stockage du jeton">
    La connexion stocke un jeton GitHub dans le magasin de profils d’authentification et l’échange
    contre un jeton API Copilot lorsque OpenClaw s’exécute. Vous n’avez pas besoin de gérer le
    jeton manuellement.
  </Accordion>
</AccordionGroup>

<Warning>
La commande de connexion par appareil nécessite une TTY interactive. Utilisez l’intégration
non interactive lorsque vous avez besoin d’une configuration headless.
</Warning>

## Embeddings de recherche mémoire

GitHub Copilot peut aussi servir de fournisseur d’embeddings pour la
[recherche mémoire](/fr/concepts/memory-search). Si vous avez un abonnement Copilot et que
vous êtes connecté, OpenClaw peut l’utiliser pour les embeddings sans clé API distincte.

### Détection automatique

Lorsque `memorySearch.provider` vaut `"auto"` (la valeur par défaut), GitHub Copilot est essayé
à la priorité 15 -- après les embeddings locaux, mais avant OpenAI et les autres
fournisseurs payants. Si un jeton GitHub est disponible, OpenClaw découvre les
modèles d’embeddings disponibles depuis l’API Copilot et choisit automatiquement le meilleur.

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
2. L’échange contre un jeton API Copilot à durée de vie courte.
3. Interroge le point de terminaison `/models` de Copilot pour découvrir les modèles d’embeddings disponibles.
4. Choisit le meilleur modèle (préfère `text-embedding-3-small`).
5. Envoie les requêtes d’embeddings au point de terminaison `/embeddings` de Copilot.

La disponibilité des modèles dépend de votre forfait GitHub. Si aucun modèle d’embeddings n’est
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
