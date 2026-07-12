---
read_when:
    - Vous souhaitez utiliser LongCat-2.0 avec OpenClaw
    - Vous avez besoin de la clé API LongCat ou des limites du modèle
summary: Configuration de l’API LongCat pour LongCat-2.0
title: LongCat
x-i18n:
    generated_at: "2026-07-12T15:53:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 7c447f9c42e6547a69d2124debcb685c32fe59de29bfc551e18e791d9f280584
    source_path: providers/longcat.md
    workflow: 16
---

[LongCat](https://longcat.ai) fournit une API hébergée pour LongCat-2.0, un
modèle de raisonnement conçu pour le codage et les charges de travail agentiques. OpenClaw fournit le
plugin `longcat` officiel pour le point de terminaison compatible avec OpenAI de LongCat.

| Propriété         | Valeur                                      |
| ----------------- | ------------------------------------------- |
| Fournisseur       | `longcat`                                   |
| Authentification  | `LONGCAT_API_KEY`                           |
| API               | Chat Completions compatible avec OpenAI     |
| URL de base       | `https://api.longcat.chat/openai`           |
| Modèle            | `longcat/LongCat-2.0`                       |
| Contexte          | 1,048,576 tokens                            |
| Sortie maximale   | 131,072 tokens                              |
| Entrée            | Texte                                       |

## Installer le plugin

Installez le paquet officiel, puis redémarrez le Gateway :

```bash
openclaw plugins install @openclaw/longcat-provider
openclaw gateway restart
```

## Prise en main

<Steps>
  <Step title="Créer une clé API">
    Connectez-vous à la [plateforme API LongCat](https://longcat.chat/platform/) et
    créez une clé sur la page [API Keys](https://longcat.chat/platform/api_keys).
  </Step>
  <Step title="Exécuter l’intégration initiale">
    ```bash
    openclaw onboard --auth-choice longcat-api-key
    ```
  </Step>
  <Step title="Vérifier le modèle">
    ```bash
    openclaw models list --provider longcat
    ```
  </Step>
</Steps>

L’intégration initiale ajoute le catalogue hébergé et sélectionne `longcat/LongCat-2.0` lorsqu’aucun
modèle principal n’est déjà configuré.

### Configuration non interactive

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice longcat-api-key \
  --longcat-api-key "$LONGCAT_API_KEY"
```

## Comportement du raisonnement

LongCat propose un contrôle binaire de la réflexion. OpenClaw associe les niveaux de réflexion activés
à `thinking: { type: "enabled" }` et `/think off` à
`thinking: { type: "disabled" }`. LongCat ne documente actuellement pas
`reasoning_effort`, OpenClaw ne l’envoie donc pas.

LongCat renvoie le raisonnement dans `reasoning_content`. OpenClaw préserve ce champ
lors de la relecture des tours d’appels d’outils de l’assistant afin que les sessions agentiques
multi-tours conservent la structure de message attendue par le fournisseur.

## Tarification

Le catalogue intégré utilise les tarifs à l’usage de LongCat en USD par million
de tokens : 0,75 $ pour les entrées non mises en cache, 0,015 $ pour les entrées mises en cache et 2,95 $ pour les sorties. LongCat peut
proposer des remises temporaires ; la [page de tarification](https://longcat.chat/platform/docs/Pricing/LongCat-2.0.html)
et vos relevés de facturation font foi.

## LongCat-2.0 auto-hébergé

Le fournisseur `longcat` cible l’API hébergée de LongCat. Pour les poids ouverts sur
[Hugging Face](https://huggingface.co/meituan-longcat/LongCat-2.0), servez le
modèle au moyen d’un environnement d’exécution compatible avec OpenAI et utilisez plutôt le fournisseur
[vLLM](/fr/providers/vllm) ou [SGLang](/fr/providers/sglang) existant d’OpenClaw.

Conservez l’identifiant exact du modèle de l’environnement d’exécution dans le catalogue du fournisseur auto-hébergé ;
n’acheminez pas un déploiement local via `longcat/LongCat-2.0`.

## Dépannage

<AccordionGroup>
  <Accordion title="La clé fonctionne dans un shell, mais pas dans le Gateway">
    Les processus Gateway gérés par un démon n’héritent pas de toutes les variables du shell
    interactif. Placez `LONGCAT_API_KEY` dans `~/.openclaw/.env`, configurez-la au moyen de
    l’intégration initiale ou utilisez une référence de secret approuvée.
  </Accordion>

  <Accordion title="Les requêtes échouent avec 402 ou 429">
    `402` signifie que le compte ne dispose pas d’un quota de tokens suffisant. `429` signifie que la clé
    API a atteint une limite de débit. Consultez l’[utilisation de LongCat](https://longcat.chat/platform/usage)
    et relancez les requêtes limitées après le délai d’attente imposé par le fournisseur.
  </Accordion>

  <Accordion title="Le modèle n’apparaît pas">
    Exécutez `openclaw plugins list` et vérifiez que le plugin `longcat` est
    activé, puis exécutez `openclaw models list --provider longcat`.
  </Accordion>
</AccordionGroup>

## Ressources associées

<CardGroup cols={2}>
  <Card title="Fournisseurs de modèles" href="/fr/concepts/model-providers" icon="layers">
    Configuration des fournisseurs, références de modèles et comportement de basculement.
  </Card>
  <Card title="Documentation de l’API LongCat" href="https://longcat.chat/platform/docs/" icon="arrow-up-right-from-square">
    Points de terminaison de l’API hébergée, authentification, limites et exemples.
  </Card>
  <Card title="Fiche du modèle LongCat-2.0" href="https://huggingface.co/meituan-longcat/LongCat-2.0" icon="arrow-up-right-from-square">
    Architecture, conseils de déploiement et détails du modèle.
  </Card>
  <Card title="Secrets" href="/fr/gateway/secrets" icon="key">
    Stockez les identifiants du fournisseur sans incorporer de texte en clair dans la configuration.
  </Card>
</CardGroup>
