---
read_when:
    - Vous voulez utiliser Fireworks avec OpenClaw
    - Il vous faut la variable d’environnement de clé d’API Fireworks ou l’identifiant du modèle par défaut
    - Vous déboguez le comportement de Kimi avec le raisonnement désactivé sur Fireworks
summary: Configuration de Fireworks (authentification + sélection du modèle)
title: Feux d’artifice
x-i18n:
    generated_at: "2026-05-06T07:35:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3a7dcaf6c7e1c004436213e67bc2262992ee1307cdaa5c290225345782f4cbfa
    source_path: providers/fireworks.md
    workflow: 16
---

[Fireworks](https://fireworks.ai) expose des modèles à pondérations ouvertes et routés via une API compatible OpenAI. OpenClaw inclut un Plugin de fournisseur Fireworks groupé, livré avec deux modèles Kimi pré-catalogués, et accepte n’importe quel modèle Fireworks ou id de routeur Fireworks à l’exécution.

| Propriété             | Valeur                                                 |
| --------------------- | ------------------------------------------------------ |
| Id du fournisseur     | `fireworks` (alias : `fireworks-ai`)                   |
| Plugin                | groupé, `enabledByDefault: true`                       |
| Variable d’env. auth  | `FIREWORKS_API_KEY`                                    |
| Option d’intégration  | `--auth-choice fireworks-api-key`                      |
| Option CLI directe    | `--fireworks-api-key <key>`                            |
| API                   | compatible OpenAI (`openai-completions`)               |
| URL de base           | `https://api.fireworks.ai/inference/v1`                |
| Modèle par défaut     | `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` |
| Alias par défaut      | `Kimi K2.5 Turbo`                                      |

## Bien démarrer

<Steps>
  <Step title="Définir la clé API Fireworks">
    <CodeGroup>

```bash Intégration
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

    L’intégration stocke la clé pour le fournisseur `fireworks` dans vos profils d’authentification et définit le routeur **Fire Pass** Kimi K2.5 Turbo comme modèle par défaut.

  </Step>
  <Step title="Vérifier que le modèle est disponible">
    ```bash
    openclaw models list --provider fireworks
    ```

    La liste doit inclure `Kimi K2.6` et `Kimi K2.5 Turbo (Fire Pass)`. Si `FIREWORKS_API_KEY` n’est pas résolu, `openclaw models status --json` signale l’identifiant manquant sous `auth.unusableProfiles`.

  </Step>
</Steps>

## Configuration non interactive

Pour les installations scriptées ou CI, passez tout sur la ligne de commande :

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY" \
  --skip-health \
  --accept-risk
```

## Catalogue intégré

| Réf. du modèle                                        | Nom                         | Entrée       | Contexte | Sortie max | Réflexion                     |
| ----------------------------------------------------- | --------------------------- | ------------ | -------- | ---------- | ----------------------------- |
| `fireworks/accounts/fireworks/models/kimi-k2p6`       | Kimi K2.6                   | texte + image | 262,144  | 262,144    | Désactivée de force           |
| `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` | Kimi K2.5 Turbo (Fire Pass) | texte + image | 256,000  | 256,000    | Désactivée de force (défaut)  |

<Note>
  OpenClaw fixe tous les modèles Kimi Fireworks à `thinking: off`, car Fireworks rejette les paramètres de réflexion Kimi en production. Router le même modèle directement via [Moonshot](/fr/providers/moonshot) préserve la sortie de raisonnement Kimi. Consultez les [modes de réflexion](/fr/tools/thinking) pour basculer entre les fournisseurs.
</Note>

## Ids de modèles Fireworks personnalisés

OpenClaw accepte n’importe quel modèle Fireworks ou id de routeur Fireworks à l’exécution. Utilisez l’id exact affiché par Fireworks et préfixez-le avec `fireworks/`. La résolution dynamique clone le modèle Fire Pass (entrée texte + image, API compatible OpenAI, coût par défaut nul) et désactive automatiquement la réflexion lorsque l’id correspond au motif Kimi.

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
  <Accordion title="Fonctionnement du préfixage des ids de modèles">
    Chaque référence de modèle Fireworks dans OpenClaw commence par `fireworks/`, suivi de l’id exact ou du chemin de routeur issu de la plateforme Fireworks. Par exemple :

    - Modèle de routeur : `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`
    - Modèle direct : `fireworks/accounts/fireworks/models/<model-name>`

    OpenClaw supprime le préfixe `fireworks/` lors de la construction de la requête API et envoie le chemin restant au point de terminaison Fireworks comme champ `model` compatible OpenAI.

  </Accordion>

  <Accordion title="Pourquoi la réflexion est désactivée de force pour Kimi">
    Fireworks K2.6 renvoie une erreur 400 si la requête contient des paramètres `reasoning_*`, même si Kimi prend en charge la réflexion via l’API propre à Moonshot. La stratégie groupée (`extensions/fireworks/thinking-policy.ts`) annonce uniquement le niveau de réflexion `off` pour les ids de modèles Kimi, afin que les bascules manuelles `/think` et les surfaces de stratégie fournisseur restent alignées avec le contrat d’exécution.

    Pour utiliser le raisonnement Kimi de bout en bout, configurez le [fournisseur Moonshot](/fr/providers/moonshot) et routez le même modèle via celui-ci.

  </Accordion>

  <Accordion title="Disponibilité de l’environnement pour le démon">
    Si le Gateway s’exécute comme service géré (launchd, systemd, Docker), la clé Fireworks doit être visible par ce processus, et pas seulement par votre shell interactif.

    <Warning>
      Une clé présente uniquement dans `~/.profile` n’aidera pas un démon launchd ou systemd, sauf si cet environnement y est également importé. Définissez la clé dans `~/.openclaw/.env` ou via `env.shellEnv` pour la rendre lisible depuis le processus gateway.
    </Warning>

    Sur macOS, `openclaw gateway install` connecte déjà `~/.openclaw/.env` au fichier d’environnement LaunchAgent. Réexécutez l’installation (ou `openclaw doctor --fix`) après la rotation de la clé.

  </Accordion>
</AccordionGroup>

## Liens connexes

<CardGroup cols={2}>
  <Card title="Fournisseurs de modèles" href="/fr/concepts/model-providers" icon="layers">
    Choisir les fournisseurs, les références de modèles et le comportement de bascule.
  </Card>
  <Card title="Modes de réflexion" href="/fr/tools/thinking" icon="brain">
    Niveaux `/think`, stratégies fournisseur et routage de modèles capables de raisonnement.
  </Card>
  <Card title="Moonshot" href="/fr/providers/moonshot" icon="moon">
    Exécuter Kimi avec une sortie de réflexion native via l’API propre à Moonshot.
  </Card>
  <Card title="Dépannage" href="/fr/help/troubleshooting" icon="wrench">
    Dépannage général et FAQ.
  </Card>
</CardGroup>
