---
read_when:
    - Vous souhaitez utiliser les modèles Amazon Bedrock avec OpenClaw
    - Vous devez configurer les identifiants et la région AWS pour les appels de modèle
summary: Utiliser les modèles Amazon Bedrock (API Converse) avec OpenClaw
title: Amazon Bedrock
x-i18n:
    generated_at: "2026-07-12T15:43:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: fda4f5ab8ffcd68012cf78fbedb9fabec36d9742f16518ea4dd38418b2220b7b
    source_path: providers/bedrock.md
    workflow: 16
---

OpenClaw peut utiliser les modèles **Amazon Bedrock** via son fournisseur de streaming **Bedrock Converse**. L’authentification Bedrock utilise la **chaîne d’identifiants par défaut du SDK AWS**, et non une clé API.

| Propriété    | Valeur                                                                  |
| ------------ | ----------------------------------------------------------------------- |
| Fournisseur  | `amazon-bedrock`                                                        |
| API          | `bedrock-converse-stream`                                               |
| Auth         | Identifiants AWS (variables d’environnement, configuration partagée ou rôle d’instance) |
| Région       | `AWS_REGION` ou `AWS_DEFAULT_REGION` (valeur par défaut : `us-east-1`)  |

## Bien démarrer

Choisissez votre méthode d’authentification préférée et suivez les étapes de configuration.

<Tabs>
  <Tab title="Clés d’accès / variables d’environnement">
    **Idéal pour :** les machines de développement, la CI ou les hôtes sur lesquels vous gérez directement les identifiants AWS.

    <Steps>
      <Step title="Définir les identifiants AWS sur l’hôte du Gateway">
        ```bash
        export AWS_ACCESS_KEY_ID="EXAMPLE_AWS_ACCESS_KEY_ID"
        export AWS_SECRET_ACCESS_KEY="..."
        export AWS_REGION="us-east-1"
        # Facultatif :
        export AWS_SESSION_TOKEN="..."
        export AWS_PROFILE="your-profile"
        # Facultatif (clé API/jeton porteur Bedrock) :
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```
      </Step>
      <Step title="Ajouter un fournisseur et un modèle Bedrock à votre configuration">
        Aucune `apiKey` n’est requise. Configurez le fournisseur avec `auth: "aws-sdk"` :

        ```json5
        {
          models: {
            providers: {
              "amazon-bedrock": {
                baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
                api: "bedrock-converse-stream",
                auth: "aws-sdk",
                models: [
                  {
                    id: "us.anthropic.claude-opus-4-6-v1:0",
                    name: "Claude Opus 4.6 (Bedrock)",
                    reasoning: true,
                    input: ["text", "image"],
                    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                    contextWindow: 200000,
                    maxTokens: 8192,
                  },
                ],
              },
            },
          },
          agents: {
            defaults: {
              model: { primary: "amazon-bedrock/us.anthropic.claude-opus-4-6-v1:0" },
            },
          },
        }
        ```
      </Step>
      <Step title="Vérifier que les modèles sont disponibles">
        ```bash
        openclaw models list
        ```
      </Step>
    </Steps>

    <Tip>
    Avec l’authentification par marqueur d’environnement (`AWS_ACCESS_KEY_ID`, `AWS_PROFILE` ou `AWS_BEARER_TOKEN_BEDROCK`), OpenClaw active automatiquement le fournisseur Bedrock implicite pour la découverte des modèles, sans configuration supplémentaire.
    </Tip>

  </Tab>

  <Tab title="Rôles d’instance EC2 (IMDS)">
    **Idéal pour :** les instances EC2 auxquelles un rôle IAM est associé et qui utilisent le service de métadonnées d’instance pour l’authentification.

    <Steps>
      <Step title="Activer explicitement la découverte">
        Lors de l’utilisation d’IMDS, OpenClaw ne peut pas détecter l’authentification AWS à partir des seuls marqueurs d’environnement ; vous devez donc l’activer explicitement :

        ```bash
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1
        ```
      </Step>
      <Step title="Ajouter éventuellement un marqueur d’environnement pour le mode automatique">
        Si vous souhaitez également que le mécanisme de détection automatique par marqueur d’environnement fonctionne (par exemple, pour les surfaces de `openclaw status`) :

        ```bash
        export AWS_PROFILE=default
        export AWS_REGION=us-east-1
        ```

        Vous n’avez **pas** besoin d’une fausse clé API.
      </Step>
      <Step title="Vérifier que les modèles sont découverts">
        ```bash
        openclaw models list
        ```
      </Step>
    </Steps>

    <Warning>
    Le rôle IAM associé à votre instance EC2 doit disposer des autorisations suivantes :

    - `bedrock:InvokeModel`
    - `bedrock:InvokeModelWithResponseStream`
    - `bedrock:ListFoundationModels` (pour la découverte automatique)
    - `bedrock:ListInferenceProfiles` (pour la découverte des profils d’inférence)

    Vous pouvez également associer la politique gérée `AmazonBedrockFullAccess`.
    </Warning>

    <Note>
    Vous n’avez besoin de `AWS_PROFILE=default` que si vous souhaitez spécifiquement disposer d’un marqueur d’environnement pour le mode automatique ou les surfaces d’état. Le chemin d’authentification réel de l’environnement d’exécution Bedrock utilise la chaîne par défaut du SDK AWS ; l’authentification par rôle d’instance IMDS fonctionne donc même sans marqueurs d’environnement.
    </Note>

  </Tab>
</Tabs>

## Découverte automatique des modèles

OpenClaw peut découvrir automatiquement les modèles Bedrock qui prennent en charge la **diffusion en continu** et la **sortie de texte**. La découverte utilise `bedrock:ListFoundationModels` et `bedrock:ListInferenceProfiles`, et les résultats sont mis en cache (valeur par défaut : 1 heure).

Activation du fournisseur implicite :

- Si `plugins.entries.amazon-bedrock.config.discovery.enabled` vaut `true`,
  OpenClaw tente la découverte même en l’absence de marqueur d’environnement AWS.
- Si `plugins.entries.amazon-bedrock.config.discovery.enabled` n’est pas défini,
  OpenClaw n’ajoute automatiquement le
  fournisseur Bedrock implicite que lorsqu’il détecte l’un des marqueurs d’authentification AWS suivants :
  `AWS_BEARER_TOKEN_BEDROCK`, `AWS_ACCESS_KEY_ID` +
  `AWS_SECRET_ACCESS_KEY` ou `AWS_PROFILE`.
- Le chemin d’authentification réel de l’environnement d’exécution Bedrock utilise toujours la chaîne par défaut du SDK AWS ; la
  configuration partagée, le SSO et l’authentification par rôle d’instance IMDS peuvent donc fonctionner même lorsque la découverte
  nécessitait `enabled: true` pour être activée explicitement.

<Note>
Pour les entrées explicites `models.providers["amazon-bedrock"]`, OpenClaw peut toujours résoudre de manière anticipée l’authentification Bedrock par marqueur d’environnement à partir de marqueurs d’environnement AWS tels que `AWS_BEARER_TOKEN_BEDROCK`, sans forcer le chargement complet de l’authentification de l’environnement d’exécution. Le chemin d’authentification réel des appels de modèle utilise toujours la chaîne par défaut du SDK AWS.
</Note>

<AccordionGroup>
  <Accordion title="Options de configuration de la découverte">
    Les options de configuration se trouvent sous `plugins.entries.amazon-bedrock.config.discovery` :

    ```json5
    {
      plugins: {
        entries: {
          "amazon-bedrock": {
            config: {
              discovery: {
                enabled: true,
                region: "us-east-1",
                providerFilter: ["anthropic", "amazon"],
                refreshInterval: 3600,
                defaultContextWindow: 32000,
                defaultMaxTokens: 4096,
              },
            },
          },
        },
      },
    }
    ```

    | Option | Valeur par défaut | Description |
    | ------ | ----------------- | ----------- |
    | `enabled` | automatique | En mode automatique, OpenClaw n’active le fournisseur Bedrock implicite que lorsqu’il détecte un marqueur d’environnement AWS pris en charge. Définissez cette option sur `true` pour forcer la découverte. |
    | `region` | `AWS_REGION` / `AWS_DEFAULT_REGION` / `us-east-1` | Région AWS utilisée pour les appels à l’API de découverte. |
    | `providerFilter` | (tous) | Correspond aux noms de fournisseurs Bedrock (par exemple `anthropic`, `amazon`). |
    | `refreshInterval` | `3600` | Durée du cache en secondes. Définissez cette option sur `0` pour désactiver la mise en cache. |
    | `defaultContextWindow` | `32000` | Fenêtre de contexte utilisée pour les modèles découverts dont les limites de jetons sont inconnues (remplacez cette valeur si vous connaissez les limites de votre modèle). |
    | `defaultMaxTokens` | `4096` | Nombre maximal de jetons de sortie utilisé pour les modèles découverts dont les limites de jetons sont inconnues (remplacez cette valeur si vous connaissez les limites de votre modèle). |

  </Accordion>

  <Accordion title="Fenêtre de contexte et limites maximales de jetons">
    Les API Bedrock `ListFoundationModels` et `GetFoundationModel` ne renvoient aucune
    métadonnée sur les limites de jetons, mais uniquement l’identifiant, le nom, les modalités et l’état du cycle de vie
    du modèle. OpenClaw fournit une table de correspondance des fenêtres de contexte et des limites de sortie
    connues pour les modèles Bedrock populaires (Claude, Nova, Llama, Mistral, DeepSeek
    et d’autres), afin que la gestion des sessions, les seuils de Compaction et
    la détection des dépassements de contexte fonctionnent correctement pour ces modèles.

    Les modèles découverts qui ne figurent pas dans la table utilisent `defaultContextWindow`
    et `defaultMaxTokens` comme valeurs de repli. Si les limites précises d’un modèle que vous utilisez sont absentes,
    remplacez-les à l’aide d’une entrée explicite
    `models.providers["amazon-bedrock"].models`.

  </Accordion>
</AccordionGroup>

## Configuration rapide (parcours AWS)

Cette procédure crée un rôle IAM, lui associe les autorisations Bedrock, associe
le profil d’instance et active la découverte OpenClaw sur l’hôte EC2.

```bash
# 1. Créer le rôle IAM et le profil d’instance
aws iam create-role --role-name EC2-Bedrock-Access \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "ec2.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }'

aws iam attach-role-policy --role-name EC2-Bedrock-Access \
  --policy-arn arn:aws:iam::aws:policy/AmazonBedrockFullAccess

aws iam create-instance-profile --instance-profile-name EC2-Bedrock-Access
aws iam add-role-to-instance-profile \
  --instance-profile-name EC2-Bedrock-Access \
  --role-name EC2-Bedrock-Access

# 2. L’associer à votre instance EC2
aws ec2 associate-iam-instance-profile \
  --instance-id i-xxxxx \
  --iam-instance-profile Name=EC2-Bedrock-Access

# 3. Sur l’instance EC2, activer explicitement la découverte
openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1

# 4. Facultatif : ajouter un marqueur d’environnement si vous souhaitez utiliser le mode automatique sans activation explicite
echo 'export AWS_PROFILE=default' >> ~/.bashrc
echo 'export AWS_REGION=us-east-1' >> ~/.bashrc
source ~/.bashrc

# 5. Vérifier que les modèles sont découverts
openclaw models list
```

## Configuration avancée

<AccordionGroup>
  <Accordion title="Profils d’inférence">
    OpenClaw découvre les **profils d’inférence régionaux et globaux** en même temps que
    les modèles de fondation. Lorsqu’un profil correspond à un modèle de fondation connu, le
    profil hérite des capacités de ce modèle (fenêtre de contexte, nombre maximal de jetons,
    raisonnement, vision) et la région de requête Bedrock appropriée est injectée
    automatiquement. Les profils Claude interrégionaux fonctionnent ainsi sans remplacement
    manuel du fournisseur. Les profils globaux interrégionaux (`global.*`) sont affichés
    en premier dans `openclaw models list`, car ils offrent généralement une meilleure capacité
    et un basculement automatique.

    Les identifiants de profil d’inférence ressemblent à `us.anthropic.claude-opus-4-6-v1:0` (régional)
    ou `anthropic.claude-opus-4-6-v1:0` (global). Si le modèle sous-jacent figure déjà
    dans les résultats de découverte, le profil hérite de l’ensemble de ses capacités ;
    sinon, des valeurs par défaut sûres s’appliquent.

    Aucune configuration supplémentaire n’est nécessaire. Tant que la découverte est activée et que le principal IAM
    dispose de `bedrock:ListInferenceProfiles`, les profils apparaissent aux côtés
    des modèles de fondation dans `openclaw models list`.

  </Accordion>

  <Accordion title="Niveau de service">
    Certains modèles Bedrock prennent en charge un paramètre `service_tier` permettant d’optimiser les coûts
    ou la latence. Les niveaux suivants sont disponibles :

    | Niveau | Description |
    |--------|-------------|
    | `default` | Niveau Bedrock standard |
    | `flex` | Traitement à tarif réduit pour les charges de travail pouvant tolérer une latence plus longue |
    | `priority` | Traitement prioritaire pour les charges de travail sensibles à la latence |
    | `reserved` | Capacité réservée pour les charges de travail stables |

    Définissez `serviceTier` (ou `service_tier`) via `agents.defaults.params` pour
    les requêtes de modèles Bedrock, ou par modèle dans
    `agents.defaults.models["<model-key>"].params` :

    ```json5
    {
      agents: {
        defaults: {
          params: {
            serviceTier: "flex", // s’applique à tous les modèles
          },
          models: {
            "amazon-bedrock/mistral.mistral-large-3-675b-instruct": {
              params: {
                serviceTier: "priority", // remplacement par modèle
              },
            },
          },
        },
      },
    }
    ```

    Les valeurs valides sont `default`, `flex`, `priority` et `reserved`. Claude
    Fable 5 et Sonnet 5 prennent uniquement en charge le niveau `default` ; OpenClaw émet
    un avertissement et ignore les niveaux `flex`, `priority` ou `reserved` demandés pour ces modèles. Pour
    les autres modèles, tous les niveaux ne sont pas pris en charge par chaque modèle -- un niveau non pris en charge
    renvoie une erreur de validation Bedrock, et le message d’erreur peut être
    trompeur (par exemple « The provided model identifier is invalid »
    au lieu d’indiquer que le niveau est en cause). Si cette erreur apparaît, vérifiez
    si le modèle prend en charge le niveau demandé.

  </Accordion>

  <Accordion title="Température de Claude Opus 4.7 et 4.8">
    Bedrock rejette le paramètre `temperature` pour Claude Opus 4.7 et Opus
    4.8. OpenClaw omet automatiquement `temperature` pour toute référence Bedrock
    correspondante, y compris les identifiants de modèles de fondation, les profils d’inférence nommés, les profils
    d’inférence d’application dont le modèle sous-jacent est résolu en Opus 4.7/4.8 via
    `bedrock:GetInferenceProfile`, ainsi que les variantes `opus-4.7`/`opus-4.8` avec points
    et préfixes de région facultatifs (`us.`, `eu.`, `ap.`, `apac.`, `au.`, `jp.`,
    `global.`). Aucun paramètre de configuration n’est requis, et cette omission s’applique à la fois
    à l’objet d’options de la requête et au champ `inferenceConfig` de la charge utile.
  </Accordion>

  <Accordion title="Claude Fable 5">
    Utilisez `amazon-bedrock/anthropic.claude-fable-5` dans `us-east-1`, ou les
    identifiants d’inférence régionaux tels que `us.anthropic.claude-fable-5`.
    OpenClaw applique la fenêtre de contexte de 1M de Fable, la limite de sortie de 128K, le
    raisonnement adaptatif toujours actif et la correspondance des niveaux d’effort pris en charge. `/think off` et
    `/think minimal` correspondent à `low` ; les contrôles de température et de choix forcé des outils
    sont omis, comme pour la route Opus 4.7/4.8. La sortie en streaming est différée
    jusqu’à ce que Bedrock renvoie un état terminal, afin que les refus en cours de streaming
    n’exposent pas de texte partiel.

    AWS exige un consentement explicite à la conservation des données via `provider_data_share` avant
    que Fable soit disponible. Les invites et les réponses sont partagées avec Anthropic et
    conservées jusqu’à 30 jours à des fins de confiance et de sécurité. Consultez et configurez
    la [conservation des données Bedrock](https://docs.aws.amazon.com/bedrock/latest/userguide/data-retention.html)
    avant d’activer le modèle.

  </Accordion>

  <Accordion title="Claude Mythos 5">
    Claude Mythos 5 est disponible via Bedrock uniquement pour les comptes disposant de
    l’approbation d’accès limité requise. OpenClaw reconnaît le modèle de fondation
    `anthropic.claude-mythos-5` ainsi que les profils d’inférence régionaux ou globaux tels
    que `us.anthropic.claude-mythos-5`.

    OpenClaw applique la fenêtre de contexte de 1,000,000 jetons, la limite de sortie de
    128,000 jetons, l’entrée d’images, la mise en cache des invites, le streaming sécurisé en cas de refus et les
    niveaux d’effort natifs. Le raisonnement adaptatif est toujours activé : `/think off` et
    `/think minimal` correspondent à `low`, tandis que `xhigh` et `max` restent disponibles.
    Les valeurs personnalisées d’échantillonnage et de choix forcé des outils sont omises.

  </Accordion>

  <Accordion title="Claude Sonnet 5">
    AWS documente Sonnet 5 pour les points de terminaison
    [`bedrock-runtime` et `bedrock-mantle`](https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-anthropic-claude-sonnet-5.html).
    OpenClaw reconnaît le modèle de fondation Bedrock
    `anthropic.claude-sonnet-5` ainsi que les profils d’inférence régionaux ou globaux tels
    que `us.anthropic.claude-sonnet-5`. Il applique la fenêtre de contexte de 1,000,000 jetons,
    la limite de sortie de 128,000 jetons, l’entrée d’images, les niveaux d’effort natifs,
    la mise en cache des invites et le streaming sécurisé en cas de refus.

    Bedrock maintient le raisonnement adaptatif activé pour Sonnet 5. OpenClaw utilise
    `high` par défaut ; `/think off` et `/think minimal` correspondent à `low`, car cette route
    ne peut pas désactiver le raisonnement. Les valeurs personnalisées de température et de choix forcé des outils
    sont omises tant que le raisonnement adaptatif est actif.

  </Accordion>

  <Accordion title="Garde-fous">
    Vous pouvez appliquer les [garde-fous Amazon Bedrock](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html)
    à tous les appels de modèles Bedrock en ajoutant un objet `guardrail` à la
    configuration du Plugin `amazon-bedrock`. Les garde-fous permettent d’imposer le filtrage du contenu,
    le refus de sujets, des filtres de mots, des filtres d’informations sensibles et des contrôles
    d’ancrage contextuel.

    ```json5
    {
      plugins: {
        entries: {
          "amazon-bedrock": {
            config: {
              guardrail: {
                guardrailIdentifier: "abc123", // identifiant du garde-fou ou ARN complet
                guardrailVersion: "1", // numéro de version ou "DRAFT"
                streamProcessingMode: "sync", // facultatif : "sync" ou "async"
                trace: "enabled", // facultatif : "enabled", "disabled" ou "enabled_full"
              },
            },
          },
        },
      },
    }
    ```

    `guardrailIdentifier` et `guardrailVersion` sont obligatoires.

    | Option | Description |
    | ------ | ----------- |
    | `guardrailIdentifier` | Identifiant du garde-fou (par ex. `abc123`) ou ARN complet (par ex. `arn:aws:bedrock:us-east-1:123456789012:guardrail/abc123`). |
    | `guardrailVersion` | Numéro de version publiée, ou `"DRAFT"` pour le brouillon de travail. |
    | `streamProcessingMode` | `"sync"` ou `"async"` pour l’évaluation du garde-fou pendant le streaming. Si cette option est omise, Bedrock utilise sa valeur par défaut. |
    | `trace` | `"enabled"` ou `"enabled_full"` pour le débogage ; omettez cette option ou définissez-la sur `"disabled"` en production. |

    <Warning>
    Le principal IAM utilisé par le Gateway doit disposer de l’autorisation `bedrock:ApplyGuardrail` en plus des autorisations d’appel standard.
    </Warning>

  </Accordion>

  <Accordion title="Vectorisations pour la recherche en mémoire">
    Bedrock peut également servir de fournisseur de vectorisations pour la
    [recherche en mémoire](/fr/concepts/memory-search). Cette configuration est distincte de celle du
    fournisseur d’inférence -- définissez `agents.defaults.memorySearch.provider` sur `"bedrock"` :

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "bedrock",
            model: "amazon.titan-embed-text-v2:0", // valeur par défaut
          },
        },
      },
    }
    ```

    Les vectorisations Bedrock utilisent la même chaîne d’identifiants AWS SDK que l’inférence (rôles
    d’instance, SSO, clés d’accès, configuration partagée et identité web). Aucune clé d’API n’est
    nécessaire.

    Les modèles de vectorisation pris en charge comprennent Amazon Titan Embed (v1, v2), Amazon Nova
    Embed, Cohere Embed (v3, v4) et TwelveLabs Marengo. Consultez la
    [référence de configuration de la mémoire -- Bedrock](/fr/reference/memory-config#bedrock-embedding-config)
    pour obtenir la liste complète des modèles et les options de dimension.

  </Accordion>

  <Accordion title="Remarques et mises en garde">
    - Bedrock exige que **l’accès au modèle** soit activé dans votre compte/région AWS.
    - La découverte automatique nécessite les autorisations `bedrock:ListFoundationModels` et
      `bedrock:ListInferenceProfiles`.
    - Si vous utilisez le mode automatique, définissez l’un des marqueurs d’environnement d’authentification AWS pris en charge sur
      l’hôte du Gateway. Si vous préférez l’authentification IMDS/configuration partagée sans marqueurs d’environnement, définissez
      `plugins.entries.amazon-bedrock.config.discovery.enabled: true`.
    - OpenClaw présente la source des identifiants dans cet ordre : `AWS_BEARER_TOKEN_BEDROCK`,
      puis `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`, puis `AWS_PROFILE`, puis la
      chaîne AWS SDK par défaut.
    - La prise en charge du raisonnement dépend du modèle ; consultez la fiche du modèle Bedrock pour connaître
      les fonctionnalités actuelles.
    - Si vous préférez un flux de clés géré, vous pouvez également placer un proxy compatible avec OpenAI
      devant Bedrock et le configurer comme fournisseur OpenAI.
  </Accordion>
</AccordionGroup>

## Contenu associé

<CardGroup cols={2}>
  <Card title="Sélection du modèle" href="/fr/concepts/model-providers" icon="layers">
    Choix des fournisseurs, des références de modèles et du comportement de basculement.
  </Card>
  <Card title="Recherche en mémoire" href="/fr/concepts/memory-search" icon="magnifying-glass">
    Vectorisations Bedrock pour la configuration de la recherche en mémoire.
  </Card>
  <Card title="Référence de configuration de la mémoire" href="/fr/reference/memory-config#bedrock-embedding-config" icon="database">
    Liste complète des modèles de vectorisation Bedrock et options de dimension.
  </Card>
  <Card title="Dépannage" href="/fr/help/troubleshooting" icon="wrench">
    Dépannage général et FAQ.
  </Card>
</CardGroup>
