---
read_when:
    - Vous souhaitez utiliser la préversion de Tencent Hy3 avec OpenClaw
    - Vous devez configurer la clé API TokenHub
summary: Configuration de Tencent Cloud TokenHub pour la préversion Hy3
title: Tencent Cloud (TokenHub)
x-i18n:
    generated_at: "2026-05-06T07:36:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: a194e10b0e77e2567e6835f08d1cc0fa2a32fa8d37b1851fb83024b172a03fe3
    source_path: providers/tencent.md
    workflow: 16
---

Tencent Cloud est fourni comme Plugin fournisseur groupé dans OpenClaw. Il donne accès à Tencent Hy3 preview via le point de terminaison TokenHub (`tencent-tokenhub`) avec une API compatible OpenAI.

| Propriété        | Valeur                                                |
| ---------------- | ----------------------------------------------------- |
| ID fournisseur   | `tencent-tokenhub`                                    |
| Plugin           | groupé, `enabledByDefault: true`                      |
| Variable d’environnement d’authentification | `TOKENHUB_API_KEY`                 |
| Indicateur d’onboarding | `--auth-choice tokenhub-api-key`                |
| Indicateur CLI direct | `--tokenhub-api-key <key>`                       |
| API              | compatible OpenAI (`openai-completions`)              |
| URL de base par défaut | `https://tokenhub.tencentmaas.com/v1`           |
| URL de base globale | `https://tokenhub-intl.tencentmaas.com/v1` (remplacement) |
| Modèle par défaut | `tencent-tokenhub/hy3-preview`                       |

## Démarrage rapide

<Steps>
  <Step title="Créer une clé API TokenHub">
    Créez une clé API dans Tencent Cloud TokenHub. Si vous choisissez un périmètre d’accès limité pour la clé, incluez **Hy3 preview** dans les modèles autorisés.
  </Step>
  <Step title="Exécuter l’onboarding">
    <CodeGroup>

```bash Onboarding
openclaw onboard --auth-choice tokenhub-api-key
```

```bash Indicateur direct
openclaw onboard --non-interactive \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY"
```

```bash Env uniquement
export TOKENHUB_API_KEY=...
```

    </CodeGroup>

  </Step>
  <Step title="Vérifier le modèle">
    ```bash
    openclaw models list --provider tencent-tokenhub
    ```
  </Step>
</Steps>

## Configuration non interactive

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice tokenhub-api-key \
  --tokenhub-api-key "$TOKENHUB_API_KEY" \
  --skip-health \
  --accept-risk
```

## Catalogue intégré

| Réf. du modèle                | Nom                    | Entrée | Contexte | Sortie max. | Notes                      |
| ------------------------------ | ---------------------- | ------ | -------- | ----------- | -------------------------- |
| `tencent-tokenhub/hy3-preview` | Hy3 preview (TokenHub) | texte  | 256,000  | 64,000      | Par défaut ; raisonnement activé |

Hy3 preview est le grand modèle de langage MoE de Tencent Hunyuan pour le raisonnement, le suivi d’instructions en contexte long, le code et les workflows d’agents. Les exemples compatibles OpenAI de Tencent utilisent `hy3-preview` comme ID de modèle et prennent en charge les appels d’outils standard de chat completions ainsi que `reasoning_effort`.

<Tip>
  L’ID du modèle est `hy3-preview`. Ne le confondez pas avec les modèles `HY-3D-*` de Tencent, qui sont des API de génération 3D et ne sont pas le modèle de chat OpenClaw configuré par ce fournisseur.
</Tip>

## Tarification par paliers

Le catalogue groupé fournit des métadonnées de coût par paliers qui s’adaptent à la longueur de la fenêtre d’entrée, afin que les estimations de coût soient renseignées sans remplacements manuels.

| Plage de tokens d’entrée | Tarif d’entrée | Tarif de sortie | Lecture du cache |
| ------------------------ | -------------- | --------------- | ---------------- |
| 0 - 16,000               | 0.176          | 0.587           | 0.059            |
| 16,000 - 32,000          | 0.235          | 0.939           | 0.088            |
| 32,000+                  | 0.293          | 1.173           | 0.117            |

Les tarifs sont indiqués par million de tokens en USD, tels qu’annoncés par Tencent. Remplacez la tarification sous `models.providers.tencent-tokenhub` uniquement lorsque vous avez besoin d’une surface différente.

## Configuration avancée

<AccordionGroup>
  <Accordion title="Remplacement du point de terminaison">
    OpenClaw utilise par défaut le point de terminaison Tencent Cloud `https://tokenhub.tencentmaas.com/v1`. Tencent documente également un point de terminaison TokenHub international :

    ```bash
    openclaw config set models.providers.tencent-tokenhub.baseUrl "https://tokenhub-intl.tencentmaas.com/v1"
    ```

    Remplacez le point de terminaison uniquement lorsque votre compte TokenHub ou votre région l’exige.

  </Accordion>

  <Accordion title="Disponibilité de l’environnement pour le démon">
    Si le Gateway s’exécute comme service géré (launchd, systemd, Docker), `TOKENHUB_API_KEY` doit être visible par ce processus. Définissez-le dans `~/.openclaw/.env` ou via `env.shellEnv` afin que les environnements launchd, systemd ou Docker exec puissent le lire.

    <Warning>
      Les clés définies uniquement dans `~/.profile` ne sont pas visibles par les processus Gateway gérés. Utilisez le fichier d’environnement ou le point d’intégration de configuration pour une disponibilité persistante.
    </Warning>

  </Accordion>
</AccordionGroup>

## Associés

<CardGroup cols={2}>
  <Card title="Fournisseurs de modèles" href="/fr/concepts/model-providers" icon="layers">
    Choisir les fournisseurs, les références de modèles et le comportement de basculement.
  </Card>
  <Card title="Référence de configuration" href="/fr/gateway/configuration" icon="gear">
    Schéma de configuration complet, y compris les paramètres des fournisseurs.
  </Card>
  <Card title="Tencent TokenHub" href="https://cloud.tencent.com/product/tokenhub" icon="arrow-up-right-from-square">
    Page produit TokenHub de Tencent Cloud.
  </Card>
  <Card title="Fiche du modèle Hy3 preview" href="https://huggingface.co/tencent/Hy3-preview" icon="square-poll-horizontal">
    Détails et benchmarks de Tencent Hunyuan Hy3 preview.
  </Card>
</CardGroup>
