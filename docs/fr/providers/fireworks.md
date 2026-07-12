---
read_when:
    - Vous souhaitez utiliser Fireworks avec OpenClaw
    - Vous avez besoin de la variable d’environnement de la clé API Fireworks ou de l’identifiant du modèle par défaut
    - Vous déboguez le comportement de Kimi avec le mode de réflexion désactivé sur Fireworks
summary: Configuration de Fireworks (authentification + sélection du modèle)
title: Fireworks
x-i18n:
    generated_at: "2026-07-12T15:44:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 15feed0730ec65d943f103824468490be6616478ece80bedfeb9ad8137506180
    source_path: providers/fireworks.md
    workflow: 16
---

[Fireworks](https://fireworks.ai) expose des modèles à poids ouverts et routés via une API compatible avec OpenAI. Installez le plugin fournisseur Fireworks officiel pour utiliser deux modèles Kimi pré-répertoriés ainsi que tout identifiant de modèle ou de routeur Fireworks lors de l’exécution.

| Propriété                 | Valeur                                                 |
| ------------------------- | ------------------------------------------------------ |
| Identifiant du fournisseur | `fireworks` (alias : `fireworks-ai`)                  |
| Paquet                    | `@openclaw/fireworks-provider`                         |
| Variable d’environnement d’authentification | `FIREWORKS_API_KEY`                    |
| Option d’intégration      | `--auth-choice fireworks-api-key`                      |
| Option CLI directe        | `--fireworks-api-key <key>`                            |
| API                       | Compatible avec OpenAI (`openai-completions`)          |
| URL de base               | `https://api.fireworks.ai/inference/v1`                |
| Modèle par défaut         | `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` |
| Alias par défaut          | `Kimi K2.5 Turbo`                                      |

## Bien démarrer

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

```bash Direct flag
openclaw onboard --non-interactive \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY"
```

```bash Env only
export FIREWORKS_API_KEY=fw-...
```

    </CodeGroup>

    L’intégration enregistre la clé pour le fournisseur `fireworks` dans vos profils d’authentification et définit le routeur Kimi K2.5 Turbo **Fire Pass** comme modèle par défaut.

  </Step>
  <Step title="Vérifier que le modèle est disponible">
    ```bash
    openclaw models list --provider fireworks
    ```

    La liste doit inclure `Kimi K2.6` et `Kimi K2.5 Turbo (Fire Pass)`. Si `FIREWORKS_API_KEY` n’est pas résolue, `openclaw models status --json` signale l’identifiant d’authentification manquant sous `auth.unusableProfiles`.

  </Step>
</Steps>

## Configuration non interactive

Pour les installations automatisées ou dans un environnement CI, transmettez tous les paramètres sur la ligne de commande :

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY" \
  --skip-health \
  --accept-risk
```

## Catalogue intégré

| Référence du modèle                                    | Nom                         | Entrée        | Contexte | Sortie maximale | Réflexion                    |
| ------------------------------------------------------ | --------------------------- | ------------- | -------- | --------------- | ---------------------------- |
| `fireworks/accounts/fireworks/models/kimi-k2p6`        | Kimi K2.6                   | texte + image | 262,144  | 262,144         | Désactivée de force          |
| `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` | Kimi K2.5 Turbo (Fire Pass) | texte + image | 256,000  | 256,000         | Désactivée de force (défaut) |

<Note>
  OpenClaw fixe tous les modèles Kimi de Fireworks sur `thinking: off`, car Kimi sur Fireworks peut divulguer la chaîne de raisonnement dans la réponse visible, sauf si la requête désactive explicitement la réflexion. Le routage direct du même modèle via [Moonshot](/fr/providers/moonshot) préserve la sortie de raisonnement de Kimi. Consultez les [modes de réflexion](/fr/tools/thinking) pour basculer entre les fournisseurs.
</Note>

## Identifiants de modèles Fireworks personnalisés

OpenClaw accepte tout identifiant de modèle ou de routeur Fireworks lors de l’exécution. Utilisez l’identifiant exact affiché par Fireworks et préfixez-le avec `fireworks/`. La résolution dynamique clone le modèle Fire Pass (entrée texte + image, API compatible avec OpenAI, coût par défaut nul) et désactive automatiquement la réflexion lorsque l’identifiant correspond au motif Kimi. Les identifiants dynamiques GLM sont marqués comme prenant uniquement en charge le texte, sauf si vous configurez une entrée de modèle personnalisée avec une entrée image.

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
  <Accordion title="Fonctionnement du préfixe des identifiants de modèles">
    Chaque référence de modèle Fireworks dans OpenClaw commence par `fireworks/`, suivi de l’identifiant ou du chemin de routeur exact provenant de la plateforme Fireworks. Par exemple :

    - Modèle de routeur : `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`
    - Modèle direct : `fireworks/accounts/fireworks/models/<model-name>`

    OpenClaw retire le préfixe `fireworks/` lors de la construction de la requête API et envoie le chemin restant au point de terminaison Fireworks dans le champ `model` compatible avec OpenAI.

  </Accordion>

  <Accordion title="Pourquoi la réflexion est désactivée de force pour Kimi">
    Fireworks fournit Kimi sans canal de raisonnement distinct, de sorte que la chaîne de raisonnement peut apparaître dans le flux `content` visible. Pour chaque requête Kimi sur Fireworks, OpenClaw envoie `thinking: { type: "disabled" }` et retire `reasoning`, `reasoning_effort` et `reasoningEffort` de la charge utile (`extensions/fireworks/stream.ts`). La politique du fournisseur (`extensions/fireworks/thinking-policy.ts`) n’annonce que le niveau de réflexion `off` pour les identifiants de modèles Kimi, afin que les changements manuels via `/think` et les surfaces de politique du fournisseur restent alignés sur le contrat d’exécution.

    Pour utiliser le raisonnement de Kimi de bout en bout, configurez le [fournisseur Moonshot](/fr/providers/moonshot) et acheminez le même modèle par son intermédiaire.

  </Accordion>

  <Accordion title="Disponibilité de l’environnement pour le démon">
    Si le Gateway s’exécute en tant que service géré (launchd, systemd, Docker), la clé Fireworks doit être visible par ce processus, et pas seulement par votre shell interactif.

    <Warning>
      Une clé exportée uniquement dans un shell interactif ne sera pas accessible à un démon launchd ou systemd, sauf si cet environnement y est également importé. Définissez la clé dans `~/.openclaw/.env` ou via `env.shellEnv` afin qu’elle soit lisible par le processus Gateway.
    </Warning>

    OpenClaw charge `~/.openclaw/.env` lors du chargement de la configuration, de sorte que les clés qui y sont enregistrées sont accessibles aux services Gateway gérés sur toutes les plateformes. Redémarrez le Gateway (ou réexécutez `openclaw doctor --fix`) après avoir renouvelé la clé.

  </Accordion>
</AccordionGroup>

## Ressources associées

<CardGroup cols={2}>
  <Card title="Fournisseurs de modèles" href="/fr/concepts/model-providers" icon="layers">
    Choix des fournisseurs, des références de modèles et du comportement de basculement.
  </Card>
  <Card title="Modes de réflexion" href="/fr/tools/thinking" icon="brain">
    Niveaux de `/think`, politiques des fournisseurs et routage des modèles capables de raisonnement.
  </Card>
  <Card title="Moonshot" href="/fr/providers/moonshot" icon="moon">
    Exécutez Kimi avec une sortie de réflexion native via l’API propre à Moonshot.
  </Card>
  <Card title="Dépannage" href="/fr/help/troubleshooting" icon="wrench">
    Dépannage général et FAQ.
  </Card>
</CardGroup>
