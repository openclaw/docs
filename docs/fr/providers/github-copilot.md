---
read_when:
    - Vous voulez utiliser GitHub Copilot comme fournisseur de modèles
    - Vous avez besoin du flux `openclaw models auth login-github-copilot`
summary: Se connecter à GitHub Copilot depuis OpenClaw en utilisant le flux d’appareil
title: GitHub Copilot
x-i18n:
    generated_at: "2026-04-25T13:55:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4b5361f196bbb27ba74f281b4665eaaba770d3532eae2d02f76a14f44d3b4618
    source_path: providers/github-copilot.md
    workflow: 15
---

GitHub Copilot est l’assistant de codage IA de GitHub. Il fournit l’accès aux
modèles Copilot pour votre compte GitHub et votre offre. OpenClaw peut utiliser Copilot comme
fournisseur de modèles de deux façons différentes.

## Deux façons d’utiliser Copilot dans OpenClaw

<Tabs>
  <Tab title="Fournisseur intégré (github-copilot)">
    Utilisez le flux natif de connexion par appareil pour obtenir un jeton GitHub, puis l’échanger contre
    des jetons API Copilot lorsque OpenClaw s’exécute. C’est le chemin **par défaut** et le plus simple
    car il ne nécessite pas VS Code.

    <Steps>
      <Step title="Exécuter la commande de connexion">
        ```bash
        openclaw models auth login-github-copilot
        ```

        Il vous sera demandé de visiter une URL et de saisir un code à usage unique. Gardez le
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
    le endpoint `/v1` du proxy et utilise la liste de modèles que vous y configurez.

    <Note>
    Choisissez cette option si vous exécutez déjà Copilot Proxy dans VS Code ou si vous devez router
    à travers lui. Vous devez activer le Plugin et maintenir l’extension VS Code en cours d’exécution.
    </Note>

  </Tab>
</Tabs>

## Drapeaux facultatifs

| Drapeau         | Description                                              |
| --------------- | -------------------------------------------------------- |
| `--yes`         | Ignorer l’invite de confirmation                         |
| `--set-default` | Appliquer aussi le modèle par défaut recommandé du fournisseur |

```bash
# Ignorer la confirmation
openclaw models auth login-github-copilot --yes

# Se connecter et définir le modèle par défaut en une seule étape
openclaw models auth login --provider github-copilot --method device --set-default
```

<AccordionGroup>
  <Accordion title="TTY interactif requis">
    Le flux de connexion par appareil requiert un TTY interactif. Exécutez-le directement dans un
    terminal, et non dans un script non interactif ou un pipeline CI.
  </Accordion>

  <Accordion title="La disponibilité des modèles dépend de votre offre">
    La disponibilité des modèles Copilot dépend de votre offre GitHub. Si un modèle est
    rejeté, essayez un autre ID (par exemple `github-copilot/gpt-4.1`).
  </Accordion>

  <Accordion title="Sélection du transport">
    Les ID de modèle Claude utilisent automatiquement le transport Anthropic Messages. Les modèles GPT,
    série o et Gemini conservent le transport OpenAI Responses. OpenClaw
    sélectionne le bon transport en fonction de la référence de modèle.
  </Accordion>

  <Accordion title="Compatibilité des requêtes">
    OpenClaw envoie des en-têtes de requête de type IDE Copilot sur les transports Copilot,
    y compris pour les tours intégrés de Compaction, de résultat d’outil et de suivi d’image. Il
    n’active pas la continuation Responses au niveau fournisseur pour Copilot à moins que
    ce comportement n’ait été vérifié par rapport à l’API de Copilot.
  </Accordion>

  <Accordion title="Ordre de résolution des variables d’environnement">
    OpenClaw résout l’auth Copilot à partir des variables d’environnement dans l’ordre de
    priorité suivant :

    | Priorité | Variable               | Remarques                         |
    | -------- | ---------------------- | --------------------------------- |
    | 1        | `COPILOT_GITHUB_TOKEN` | Priorité la plus élevée, spécifique à Copilot |
    | 2        | `GH_TOKEN`             | Jeton GitHub CLI (fallback)       |
    | 3        | `GITHUB_TOKEN`         | Jeton GitHub standard (priorité la plus basse) |

    Lorsque plusieurs variables sont définies, OpenClaw utilise celle de plus haute priorité.
    Le flux de connexion par appareil (`openclaw models auth login-github-copilot`) stocke
    son jeton dans le magasin de profils d’auth et a priorité sur toutes les variables
    d’environnement.

  </Accordion>

  <Accordion title="Stockage des jetons">
    La connexion stocke un jeton GitHub dans le magasin de profils d’auth et l’échange
    contre un jeton API Copilot lorsque OpenClaw s’exécute. Vous n’avez pas besoin de gérer le
    jeton manuellement.
  </Accordion>
</AccordionGroup>

<Warning>
Nécessite un TTY interactif. Exécutez la commande de connexion directement dans un terminal, et non
dans un script headless ou une tâche CI.
</Warning>

## Embeddings de recherche mémoire

GitHub Copilot peut également servir de fournisseur d’embeddings pour
[la recherche mémoire](/fr/concepts/memory-search). Si vous avez un abonnement Copilot et
êtes connecté, OpenClaw peut l’utiliser pour les embeddings sans clé API séparée.

### Détection automatique

Lorsque `memorySearch.provider` vaut `"auto"` (valeur par défaut), GitHub Copilot est essayé
avec une priorité de 15 — après les embeddings locaux mais avant OpenAI et d’autres
fournisseurs payants. Si un jeton GitHub est disponible, OpenClaw découvre les modèles
d’embeddings disponibles depuis l’API Copilot et choisit automatiquement le meilleur.

### Configuration explicite

```json5
{
  agents: {
    defaults: {
      memorySearch: {
        provider: "github-copilot",
        // Facultatif : remplacer le modèle auto-découvert
        model: "text-embedding-3-small",
      },
    },
  },
}
```

### Fonctionnement

1. OpenClaw résout votre jeton GitHub (à partir des variables d’environnement ou du profil d’auth).
2. L’échange contre un jeton API Copilot de courte durée.
3. Interroge le endpoint Copilot `/models` pour découvrir les modèles d’embeddings disponibles.
4. Choisit le meilleur modèle (préfère `text-embedding-3-small`).
5. Envoie les requêtes d’embedding au endpoint Copilot `/embeddings`.

La disponibilité des modèles dépend de votre offre GitHub. Si aucun modèle d’embedding n’est
disponible, OpenClaw ignore Copilot et essaie le fournisseur suivant.

## Lié

<CardGroup cols={2}>
  <Card title="Sélection de modèle" href="/fr/concepts/model-providers" icon="layers">
    Choisir les fournisseurs, les références de modèle et le comportement de failover.
  </Card>
  <Card title="OAuth et auth" href="/fr/gateway/authentication" icon="key">
    Détails d’auth et règles de réutilisation des identifiants.
  </Card>
</CardGroup>
