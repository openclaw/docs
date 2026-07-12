---
read_when:
    - Vous souhaitez utiliser Tencent hy3 avec OpenClaw
    - Vous devez configurer la clé API TokenHub ou TokenPlan
summary: Configuration de Tencent Cloud TokenHub et TokenPlan pour hy3
title: Tencent Cloud (TokenHub / TokenPlan)
x-i18n:
    generated_at: "2026-07-12T03:17:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5c2ffb8ab824539c7765d38e4332c30a6dd371fdc19be825f2ad9af0197fa256
    source_path: providers/tencent.md
    workflow: 16
---

Installez le Plugin fournisseur officiel de Tencent Cloud pour accéder à Tencent Hy3 via deux points de terminaison — TokenHub (`tencent-tokenhub`) et TokenPlan (`tencent-tokenplan`) — à l’aide d’une API compatible avec OpenAI.

| Propriété                                | Valeur                                                |
| ---------------------------------------- | ----------------------------------------------------- |
| Identifiants des fournisseurs            | `tencent-tokenhub`, `tencent-tokenplan`               |
| Paquet                                   | `@openclaw/tencent-provider`                          |
| Variable d’environnement d’authentification TokenHub  | `TOKENHUB_API_KEY`                       |
| Variable d’environnement d’authentification TokenPlan | `TOKENPLAN_API_KEY`                      |
| Option d’intégration TokenHub            | `--auth-choice tokenhub-api-key`                      |
| Option d’intégration TokenPlan           | `--auth-choice tokenplan-api-key`                     |
| Option CLI directe TokenHub              | `--tokenhub-api-key <key>`                            |
| Option CLI directe TokenPlan             | `--tokenplan-api-key <key>`                           |
| API                                      | Compatible avec OpenAI (`openai-completions`)         |
| URL de base TokenHub                     | `https://tokenhub.tencentmaas.com/v1`                 |
| URL de base globale TokenHub             | `https://tokenhub-intl.tencentmaas.com/v1` (remplacement) |
| URL de base TokenPlan                    | `https://api.lkeap.cloud.tencent.com/plan/v3`         |
| Modèle par défaut                        | `tencent-tokenhub/hy3`                                |

## Démarrage rapide

<Steps>
  <Step title="Créer une clé API Tencent">
    Créez une clé API pour Tencent Cloud TokenHub et TokenPlan. Si vous choisissez une portée d’accès limitée pour la clé, incluez **hy3** (ainsi que **hy3 preview** si vous prévoyez de l’utiliser sur TokenHub) dans les modèles autorisés.
  </Step>
  <Step title="Lancer l’intégration">
    <CodeGroup>

```bash Intégration TokenHub
openclaw onboard --auth-choice tokenhub-api-key
```

```bash Option directe TokenHub
openclaw onboard --non-interactive \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY"
```

```bash Intégration TokenPlan
openclaw onboard --auth-choice tokenplan-api-key
```

```bash Option directe TokenPlan
openclaw onboard --non-interactive \
  --auth-choice tokenplan-api-key \
  --tokenplan-api-key "$TOKENPLAN_API_KEY"
```

```bash Variables d’environnement uniquement
export TOKENHUB_API_KEY=...
export TOKENPLAN_API_KEY=...
```

    </CodeGroup>

  </Step>
  <Step title="Vérifier le modèle">
    ```bash
    openclaw models list --provider tencent-tokenhub
    openclaw models list --provider tencent-tokenplan
    ```
  </Step>
</Steps>

## Configuration non interactive

```bash
# TokenHub
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY" \
  --skip-health \
  --accept-risk

# TokenPlan
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice tokenplan-api-key \
  --tokenplan-api-key "$TOKENPLAN_API_KEY" \
  --skip-health \
  --accept-risk
```

<Note>
`--accept-risk` est obligatoire avec `--non-interactive`.
</Note>

## Catalogue intégré

| Référence du modèle             | Nom                    | Entrée | Contexte | Sortie maximale | Remarques               |
| ------------------------------- | ---------------------- | ------ | -------- | --------------- | ----------------------- |
| `tencent-tokenhub/hy3-preview`  | hy3 preview (TokenHub) | texte  | 256,000  | 64,000          | raisonnement activé     |
| `tencent-tokenhub/hy3`          | hy3 (TokenHub)         | texte  | 256,000  | 64,000          | raisonnement activé     |
| `tencent-tokenplan/hy3`         | hy3 (TokenPlan)        | texte  | 256,000  | 64,000          | raisonnement activé     |

hy3 est le grand modèle de langage MoE de Tencent Hunyuan destiné au raisonnement, au suivi d’instructions avec un contexte long, au code et aux flux de travail d’agents. Les exemples compatibles avec OpenAI de Tencent utilisent `hy3` comme identifiant de modèle et prennent en charge les appels d’outils standard de l’API Chat Completions ainsi que `reasoning_effort`.

<Tip>
  L’identifiant du modèle est `hy3`. Ne le confondez pas avec les modèles `HY-3D-*` de Tencent, qui sont des API de génération 3D et non le modèle de conversation OpenClaw configuré par ce fournisseur.
</Tip>

## Configuration avancée

<AccordionGroup>
  <Accordion title="Remplacement du point de terminaison">
    Le catalogue intégré d’OpenClaw utilise le point de terminaison Tencent Cloud `https://tokenhub.tencentmaas.com/v1`. Remplacez-le uniquement si votre compte ou votre région TokenHub en exige un autre :

    ```bash
    openclaw config set models.providers.tencent-tokenhub.baseUrl "https://your-endpoint/v1"
    ```

  </Accordion>

  <Accordion title="Disponibilité des variables d’environnement pour le démon">
    Si le Gateway s’exécute en tant que service géré (launchd, systemd, Docker), `TOKENHUB_API_KEY` et `TOKENPLAN_API_KEY` doivent être visibles par ce processus. Définissez-les dans `~/.openclaw/.env` ou via `env.shellEnv` afin que les environnements d’exécution de launchd, systemd ou Docker puissent les lire.

    <Warning>
      Les clés exportées uniquement dans un shell interactif ne sont pas visibles par les processus Gateway gérés. Utilisez le fichier d’environnement ou le point de configuration pour assurer leur disponibilité persistante.
    </Warning>

  </Accordion>
</AccordionGroup>

## Ressources associées

<CardGroup cols={2}>
  <Card title="Fournisseurs de modèles" href="/fr/concepts/model-providers" icon="layers">
    Choix des fournisseurs, des références de modèles et du comportement de basculement.
  </Card>
  <Card title="Référence de configuration" href="/fr/gateway/configuration-reference" icon="gear">
    Schéma de configuration complet, y compris les paramètres des fournisseurs.
  </Card>
  <Card title="Tencent TokenHub" href="https://cloud.tencent.com/product/tokenhub" icon="arrow-up-right-from-square">
    Page du produit TokenHub de Tencent Cloud.
  </Card>
  <Card title="Fiche du modèle Hy3 preview" href="https://huggingface.co/tencent/Hy3-preview" icon="square-poll-horizontal">
    Détails et évaluations comparatives de Tencent Hunyuan Hy3 preview.
  </Card>
</CardGroup>
