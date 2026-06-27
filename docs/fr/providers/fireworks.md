---
read_when:
    - Vous voulez utiliser Fireworks avec OpenClaw
    - Vous avez besoin de la variable d’environnement de clé API Fireworks ou de l’ID de modèle par défaut
    - Vous déboguez le comportement de Kimi avec le raisonnement désactivé sur Fireworks
summary: Configuration de Fireworks (authentification + sélection du modèle)
title: Fireworks
x-i18n:
    generated_at: "2026-06-27T18:04:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7413ec9ea192921ce9b9ec51da5b0b9ff1030feeef192afbefc938ed200e192e
    source_path: providers/fireworks.md
    workflow: 16
---

[Fireworks](https://fireworks.ai) expose des modèles open-weight et routés via une API compatible OpenAI. Installez le plugin fournisseur Fireworks officiel pour utiliser deux modèles Kimi pré-catalogués ainsi que n’importe quel modèle ou identifiant de routeur Fireworks à l’exécution.

| Propriété               | Valeur                                                 |
| ----------------------- | ------------------------------------------------------ |
| Identifiant fournisseur | `fireworks` (alias : `fireworks-ai`)                   |
| Package                 | `@openclaw/fireworks-provider`                         |
| Variable d’env auth     | `FIREWORKS_API_KEY`                                    |
| Option d’onboarding     | `--auth-choice fireworks-api-key`                      |
| Option CLI directe      | `--fireworks-api-key <key>`                            |
| API                     | compatible OpenAI (`openai-completions`)               |
| URL de base             | `https://api.fireworks.ai/inference/v1`                |
| Modèle par défaut       | `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` |
| Alias par défaut        | `Kimi K2.5 Turbo`                                      |

## Premiers pas

<Steps>
  <Step title="Installer le plugin">
    ```bash
    openclaw plugins install @openclaw/fireworks-provider
    ```
  </Step>
  <Step title="Définir la clé API Fireworks">
    <CodeGroup>

```bash Onboarding
openclaw onboard --auth-choice fireworks-api-key
```

```bash Option directe
openclaw onboard --non-interactive \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY"
```

```bash Env uniquement
export FIREWORKS_API_KEY=fw-...
```

    </CodeGroup>

    L’onboarding enregistre la clé pour le fournisseur `fireworks` dans vos profils d’authentification et définit le routeur Kimi K2.5 Turbo **Fire Pass** comme modèle par défaut.

  </Step>
  <Step title="Vérifier que le modèle est disponible">
    ```bash
    openclaw models list --provider fireworks
    ```

    La liste doit inclure `Kimi K2.6` et `Kimi K2.5 Turbo (Fire Pass)`. Si `FIREWORKS_API_KEY` n’est pas résolue, `openclaw models status --json` signale l’identifiant manquant sous `auth.unusableProfiles`.

  </Step>
</Steps>

## Configuration non interactive

Pour les installations scriptées ou CI, transmettez tout sur la ligne de commande :

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY" \
  --skip-health \
  --accept-risk
```

## Catalogue intégré

| Référence du modèle                                      | Nom                         | Entrée       | Contexte | Sortie max | Thinking                   |
| -------------------------------------------------------- | --------------------------- | ------------ | -------- | ---------- | -------------------------- |
| `fireworks/accounts/fireworks/models/kimi-k2p6`          | Kimi K2.6                   | texte + image | 262,144  | 262,144    | Désactivé de force         |
| `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`   | Kimi K2.5 Turbo (Fire Pass) | texte + image | 256,000  | 256,000    | Désactivé de force (défaut) |

<Note>
  OpenClaw fixe tous les modèles Kimi Fireworks sur `thinking: off` parce que Fireworks rejette les paramètres de thinking Kimi en production. Router le même modèle directement via [Moonshot](/fr/providers/moonshot) préserve la sortie de raisonnement Kimi. Consultez les [modes de thinking](/fr/tools/thinking) pour basculer entre fournisseurs.
</Note>

## Identifiants de modèles Fireworks personnalisés

OpenClaw accepte n’importe quel modèle ou identifiant de routeur Fireworks à l’exécution. Utilisez l’identifiant exact affiché par Fireworks et préfixez-le avec `fireworks/`. La résolution dynamique clone le modèle Fire Pass (entrée texte + image, API compatible OpenAI, coût par défaut nul) et désactive automatiquement le thinking lorsque l’identifiant correspond au motif Kimi. Les identifiants dynamiques GLM sont marqués texte uniquement, sauf si vous configurez une entrée de modèle personnalisée avec une entrée image.

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "fireworks/accounts/fireworks/models/<your-model-id>",
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Fonctionnement du préfixage des identifiants de modèle">
    Chaque référence de modèle Fireworks dans OpenClaw commence par `fireworks/`, suivi de l’identifiant exact ou du chemin de routeur de la plateforme Fireworks. Par exemple :

    - Modèle routeur : `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`
    - Modèle direct : `fireworks/accounts/fireworks/models/<model-name>`

    OpenClaw supprime le préfixe `fireworks/` lors de la construction de la requête API et envoie le chemin restant au point de terminaison Fireworks comme champ `model` compatible OpenAI.

  </Accordion>

  <Accordion title="Pourquoi le thinking est désactivé de force pour Kimi">
    Fireworks K2.6 renvoie une erreur 400 si la requête contient des paramètres `reasoning_*`, même si Kimi prend en charge le thinking via l’API propre à Moonshot. La stratégie du fournisseur (`extensions/fireworks/thinking-policy.ts`) annonce uniquement le niveau de thinking `off` pour les identifiants de modèles Kimi, afin que les bascules manuelles `/think` et les surfaces de stratégie fournisseur restent alignées avec le contrat d’exécution.

    Pour utiliser le raisonnement Kimi de bout en bout, configurez le [fournisseur Moonshot](/fr/providers/moonshot) et routez le même modèle via celui-ci.

  </Accordion>

  <Accordion title="Disponibilité de l’environnement pour le démon">
    Si le Gateway s’exécute comme service géré (launchd, systemd, Docker), la clé Fireworks doit être visible par ce processus, et pas seulement par votre shell interactif.

    <Warning>
      Une clé exportée uniquement dans un shell interactif n’aidera pas un démon launchd ou systemd, sauf si cet environnement y est également importé. Définissez la clé dans `~/.openclaw/.env` ou via `env.shellEnv` pour la rendre lisible depuis le processus gateway.
    </Warning>

    Sous macOS, `openclaw gateway install` raccorde déjà `~/.openclaw/.env` au fichier d’environnement LaunchAgent. Relancez l’installation (ou `openclaw doctor --fix`) après la rotation de la clé.

  </Accordion>
</AccordionGroup>

## Liens associés

<CardGroup cols={2}>
  <Card title="Fournisseurs de modèles" href="/fr/concepts/model-providers" icon="layers">
    Choix des fournisseurs, références de modèles et comportement de bascule.
  </Card>
  <Card title="Modes de thinking" href="/fr/tools/thinking" icon="brain">
    Niveaux `/think`, stratégies de fournisseurs et routage des modèles capables de raisonnement.
  </Card>
  <Card title="Moonshot" href="/fr/providers/moonshot" icon="moon">
    Exécutez Kimi avec une sortie de thinking native via l’API propre à Moonshot.
  </Card>
  <Card title="Dépannage" href="/fr/help/troubleshooting" icon="wrench">
    Dépannage général et FAQ.
  </Card>
</CardGroup>
