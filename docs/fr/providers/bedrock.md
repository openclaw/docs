---
read_when:
    - Vous souhaitez utiliser des modèles Amazon Bedrock avec OpenClaw
    - Vous devez configurer les identifiants AWS et la région pour les appels aux modèles
summary: Utiliser les modèles Amazon Bedrock (API Converse) avec OpenClaw
title: Amazon Bedrock
x-i18n:
    generated_at: "2026-05-11T20:51:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: fb5a131a11b98dca68746cd6dfef8f36f1fdcbfbb985730176b334083574dc89
    source_path: providers/bedrock.md
    workflow: 16
---

OpenClaw peut utiliser les modèles **Amazon Bedrock** via le fournisseur de streaming **Bedrock Converse** de pi-ai. L’authentification Bedrock utilise la **chaîne d’identifiants par défaut de l’AWS SDK**, et non une clé API.

| Propriété | Valeur                                                       |
| -------- | ----------------------------------------------------------- |
| Fournisseur | `amazon-bedrock`                                            |
| API      | `bedrock-converse-stream`                                   |
| Authentification     | Identifiants AWS (variables d’environnement, configuration partagée ou rôle d’instance) |
| Région   | `AWS_REGION` ou `AWS_DEFAULT_REGION` (par défaut : `us-east-1`) |

## Premiers pas

Choisissez votre méthode d’authentification préférée et suivez les étapes de configuration.

<Tabs>
  <Tab title="Access keys / env vars">
    **Idéal pour :** machines de développement, CI ou hôtes où vous gérez directement les identifiants AWS.

    <Steps>
      <Step title="Set AWS credentials on the gateway host">
        ```bash
        export AWS_ACCESS_KEY_ID="AKIA..."
        export AWS_SECRET_ACCESS_KEY="..."
        export AWS_REGION="us-east-1"
        # Optional:
        export AWS_SESSION_TOKEN="..."
        export AWS_PROFILE="your-profile"
        # Optional (Bedrock API key/bearer token):
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```
      </Step>
      <Step title="Add a Bedrock provider and model to your config">
        Aucun `apiKey` n’est requis. Configurez le fournisseur avec `auth: "aws-sdk"` :

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
      <Step title="Verify models are available">
        ```bash
        openclaw models list
        ```
      </Step>
    </Steps>

    <Tip>
    Avec l’authentification par marqueur d’environnement (`AWS_ACCESS_KEY_ID`, `AWS_PROFILE` ou `AWS_BEARER_TOKEN_BEDROCK`), OpenClaw active automatiquement le fournisseur Bedrock implicite pour la découverte des modèles sans configuration supplémentaire.
    </Tip>

  </Tab>

  <Tab title="EC2 instance roles (IMDS)">
    **Idéal pour :** les instances EC2 avec un rôle IAM attaché, utilisant le service de métadonnées d’instance pour l’authentification.

    <Steps>
      <Step title="Enable discovery explicitly">
        Lors de l’utilisation d’IMDS, OpenClaw ne peut pas détecter l’authentification AWS uniquement à partir des marqueurs d’environnement ; vous devez donc l’activer explicitement :

        ```bash
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1
        ```
      </Step>
      <Step title="Optionally add an env marker for auto mode">
        Si vous voulez également que le chemin d’auto-détection par marqueur d’environnement fonctionne (par exemple, pour les surfaces `openclaw status`) :

        ```bash
        export AWS_PROFILE=default
        export AWS_REGION=us-east-1
        ```

        Vous n’avez **pas** besoin d’une fausse clé API.
      </Step>
      <Step title="Verify models are discovered">
        ```bash
        openclaw models list
        ```
      </Step>
    </Steps>

    <Warning>
    Le rôle IAM attaché à votre instance EC2 doit disposer des autorisations suivantes :

    - `bedrock:InvokeModel`
    - `bedrock:InvokeModelWithResponseStream`
    - `bedrock:ListFoundationModels` (pour la découverte automatique)
    - `bedrock:ListInferenceProfiles` (pour la découverte des profils d’inférence)

    Ou attachez la stratégie gérée `AmazonBedrockFullAccess`.
    </Warning>

    <Note>
    Vous n’avez besoin de `AWS_PROFILE=default` que si vous voulez spécifiquement un marqueur d’environnement pour le mode automatique ou les surfaces de statut. Le chemin réel d’authentification de l’exécution Bedrock utilise la chaîne par défaut de l’AWS SDK ; l’authentification par rôle d’instance IMDS fonctionne donc même sans marqueurs d’environnement.
    </Note>

  </Tab>
</Tabs>

## Découverte automatique des modèles

OpenClaw peut découvrir automatiquement les modèles Bedrock qui prennent en charge le **streaming**
et la **sortie texte**. La découverte utilise `bedrock:ListFoundationModels` et
`bedrock:ListInferenceProfiles`, et les résultats sont mis en cache (par défaut : 1 heure).

Comment le fournisseur implicite est activé :

- Si `plugins.entries.amazon-bedrock.config.discovery.enabled` vaut `true`,
  OpenClaw tentera la découverte même lorsqu’aucun marqueur d’environnement AWS n’est présent.
- Si `plugins.entries.amazon-bedrock.config.discovery.enabled` n’est pas défini,
  OpenClaw n’ajoute automatiquement le
  fournisseur Bedrock implicite que lorsqu’il voit l’un de ces marqueurs d’authentification AWS :
  `AWS_BEARER_TOKEN_BEDROCK`, `AWS_ACCESS_KEY_ID` +
  `AWS_SECRET_ACCESS_KEY` ou `AWS_PROFILE`.
- Le chemin réel d’authentification de l’exécution Bedrock utilise toujours la chaîne par défaut de l’AWS SDK ; la configuration partagée, le SSO et l’authentification par rôle d’instance IMDS peuvent donc fonctionner même lorsque la découverte
  nécessitait `enabled: true` pour être activée.

<Note>
Pour les entrées explicites `models.providers["amazon-bedrock"]`, OpenClaw peut toujours résoudre tôt l’authentification Bedrock par marqueur d’environnement à partir de marqueurs d’environnement AWS tels que `AWS_BEARER_TOKEN_BEDROCK`, sans forcer le chargement complet de l’authentification d’exécution. Le chemin réel d’authentification des appels de modèle utilise toujours la chaîne par défaut de l’AWS SDK.
</Note>

<AccordionGroup>
  <Accordion title="Discovery config options">
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

    | Option | Par défaut | Description |
    | ------ | ------- | ----------- |
    | `enabled` | auto | En mode automatique, OpenClaw n’active le fournisseur Bedrock implicite que lorsqu’il voit un marqueur d’environnement AWS pris en charge. Définissez `true` pour forcer la découverte. |
    | `region` | `AWS_REGION` / `AWS_DEFAULT_REGION` / `us-east-1` | Région AWS utilisée pour les appels d’API de découverte. |
    | `providerFilter` | (tous) | Correspond aux noms de fournisseurs Bedrock (par exemple `anthropic`, `amazon`). |
    | `refreshInterval` | `3600` | Durée du cache en secondes. Définissez sur `0` pour désactiver la mise en cache. |
    | `defaultContextWindow` | `32000` | Fenêtre de contexte utilisée pour les modèles découverts (remplacez-la si vous connaissez les limites de votre modèle). |
    | `defaultMaxTokens` | `4096` | Nombre maximal de jetons de sortie utilisé pour les modèles découverts (remplacez-le si vous connaissez les limites de votre modèle). |

  </Accordion>
</AccordionGroup>

## Configuration rapide (chemin AWS)

Cette procédure crée un rôle IAM, attache les autorisations Bedrock, associe
le profil d’instance et active la découverte OpenClaw sur l’hôte EC2.

```bash
# 1. Create IAM role and instance profile
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

# 2. Attach to your EC2 instance
aws ec2 associate-iam-instance-profile \
  --instance-id i-xxxxx \
  --iam-instance-profile Name=EC2-Bedrock-Access

# 3. On the EC2 instance, enable discovery explicitly
openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1

# 4. Optional: add an env marker if you want auto mode without explicit enable
echo 'export AWS_PROFILE=default' >> ~/.bashrc
echo 'export AWS_REGION=us-east-1' >> ~/.bashrc
source ~/.bashrc

# 5. Verify models are discovered
openclaw models list
```

## Configuration avancée

<AccordionGroup>
  <Accordion title="Inference profiles">
    OpenClaw découvre les **profils d’inférence régionaux et globaux** avec
    les modèles de fondation. Lorsqu’un profil correspond à un modèle de fondation connu, le
    profil hérite des capacités de ce modèle (fenêtre de contexte, nombre maximal de jetons,
    raisonnement, vision) et la bonne région de requête Bedrock est injectée
    automatiquement. Cela signifie que les profils Claude interrégionaux fonctionnent sans
    remplacements manuels du fournisseur.

    Les ID de profil d’inférence ressemblent à `us.anthropic.claude-opus-4-6-v1:0` (régional)
    ou `anthropic.claude-opus-4-6-v1:0` (global). Si le modèle sous-jacent figure déjà
    dans les résultats de découverte, le profil hérite de son ensemble complet de capacités ;
    sinon des valeurs par défaut sûres s’appliquent.

    Aucune configuration supplémentaire n’est nécessaire. Tant que la découverte est activée et que le principal IAM
    dispose de `bedrock:ListInferenceProfiles`, les profils apparaissent aux côtés
    des modèles de fondation dans `openclaw models list`.

  </Accordion>

  <Accordion title="Service tier">
    Certains modèles Bedrock prennent en charge un paramètre `service_tier` pour optimiser le coût
    ou la latence. Les niveaux suivants sont disponibles :

    | Niveau | Description |
    |------|-------------|
    | `default` | Niveau Bedrock standard |
    | `flex` | Traitement à tarif réduit pour les charges de travail pouvant tolérer une latence plus longue |
    | `priority` | Traitement prioritaire pour les charges de travail sensibles à la latence |
    | `reserved` | Capacité réservée pour les charges de travail en régime stable |

    Définissez `serviceTier` (ou `service_tier`) via `agents.defaults.params` pour
    les requêtes de modèles Bedrock, ou par modèle dans
    `agents.defaults.models["<model-key>"].params` :

    ```json5
    {
      agents: {
        defaults: {
          params: {
            serviceTier: "flex", // applies to all models
          },
          models: {
            "amazon-bedrock/mistral.mistral-large-3-675b-instruct": {
              params: {
                serviceTier: "priority", // per-model override
              },
            },
          },
        },
      },
    }
    ```

    Les valeurs valides sont `default`, `flex`, `priority` et `reserved`. Tous les
    modèles ne prennent pas en charge tous les niveaux — si un niveau non pris en charge est demandé, Bedrock
    renverra une erreur de validation. Remarque : le message d’erreur est quelque peu trompeur ;
    il peut indiquer « The provided model identifier is invalid » au lieu de signaler
    un niveau de service non pris en charge. Si vous voyez cette erreur, vérifiez si le modèle
    prend en charge le niveau demandé.

  </Accordion>

  <Accordion title="Claude Opus 4.7 temperature">
    Bedrock rejette le paramètre `temperature` pour Claude Opus 4.7. OpenClaw
    omet automatiquement `temperature` pour toute référence Bedrock Opus 4.7, y compris
    les ID de modèle de fondation, les profils d’inférence nommés, les profils d’inférence
    d’application dont le modèle sous-jacent se résout en Opus 4.7 via
    `bedrock:GetInferenceProfile`, et les variantes pointées `opus-4.7` avec
    des préfixes de région facultatifs (`us.`, `eu.`, `ap.`, `apac.`, `au.`, `jp.`,
    `global.`). Aucun réglage de configuration n’est requis, et l’omission s’applique à la fois à
    l’objet d’options de requête et au champ de charge utile `inferenceConfig`.
  </Accordion>

  <Accordion title="Garde-fous">
    Vous pouvez appliquer les [garde-fous Amazon Bedrock](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html)
    à tous les appels de modèles Bedrock en ajoutant un objet `guardrail` à la
    configuration du plugin `amazon-bedrock`. Les garde-fous vous permettent d’appliquer le filtrage de contenu,
    le refus de sujets, les filtres de mots, les filtres d’informations sensibles et les
    vérifications d’ancrage contextuel.

    ```json5
    {
      plugins: {
        entries: {
          "amazon-bedrock": {
            config: {
              guardrail: {
                guardrailIdentifier: "abc123", // guardrail ID or full ARN
                guardrailVersion: "1", // version number or "DRAFT"
                streamProcessingMode: "sync", // optional: "sync" or "async"
                trace: "enabled", // optional: "enabled", "disabled", or "enabled_full"
              },
            },
          },
        },
      },
    }
    ```

    | Option | Obligatoire | Description |
    | ------ | -------- | ----------- |
    | `guardrailIdentifier` | Oui | ID du garde-fou (par exemple `abc123`) ou ARN complet (par exemple `arn:aws:bedrock:us-east-1:123456789012:guardrail/abc123`). |
    | `guardrailVersion` | Oui | Numéro de version publiée, ou `"DRAFT"` pour le brouillon de travail. |
    | `streamProcessingMode` | Non | `"sync"` ou `"async"` pour l’évaluation du garde-fou pendant le streaming. S’il est omis, Bedrock utilise sa valeur par défaut. |
    | `trace` | Non | `"enabled"` ou `"enabled_full"` pour le débogage ; omettez-le ou définissez `"disabled"` pour la production. |

    <Warning>
    Le principal IAM utilisé par le Gateway doit disposer de l’autorisation `bedrock:ApplyGuardrail` en plus des autorisations d’appel standard.
    </Warning>

  </Accordion>

  <Accordion title="Embeddings pour la recherche mémoire">
    Bedrock peut également servir de fournisseur d’embeddings pour la
    [recherche mémoire](/fr/concepts/memory-search). Cette configuration est distincte de celle du
    fournisseur d’inférence -- définissez `agents.defaults.memorySearch.provider` sur `"bedrock"` :

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "bedrock",
            model: "amazon.titan-embed-text-v2:0", // default
          },
        },
      },
    }
    ```

    Les embeddings Bedrock utilisent la même chaîne d’identifiants AWS SDK que l’inférence (rôles
    d’instance, SSO, clés d’accès, configuration partagée et identité Web). Aucune clé API n’est
    nécessaire. Lorsque `provider` vaut `"auto"`, Bedrock est détecté automatiquement si cette
    chaîne d’identifiants se résout correctement.

    Les modèles d’embedding pris en charge incluent Amazon Titan Embed (v1, v2), Amazon Nova
    Embed, Cohere Embed (v3, v4) et TwelveLabs Marengo. Consultez la
    [référence de configuration de la mémoire -- Bedrock](/fr/reference/memory-config#bedrock-embedding-config)
    pour obtenir la liste complète des modèles et les options de dimensions.

  </Accordion>

  <Accordion title="Notes et mises en garde">
    - Bedrock nécessite que **l’accès au modèle** soit activé dans votre compte/région AWS.
    - La découverte automatique nécessite les autorisations `bedrock:ListFoundationModels` et
      `bedrock:ListInferenceProfiles`.
    - Si vous utilisez le mode automatique, définissez l’un des marqueurs d’environnement d’authentification AWS pris en charge sur l’hôte du
      Gateway. Si vous préférez l’authentification IMDS/configuration partagée sans marqueurs d’environnement, définissez
      `plugins.entries.amazon-bedrock.config.discovery.enabled: true`.
    - OpenClaw expose la source des identifiants dans cet ordre : `AWS_BEARER_TOKEN_BEDROCK`,
      puis `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`, puis `AWS_PROFILE`, puis la
      chaîne AWS SDK par défaut.
    - La prise en charge du raisonnement dépend du modèle ; consultez la fiche du modèle Bedrock pour connaître
      les capacités actuelles.
    - Si vous préférez un flux de clé géré, vous pouvez également placer un proxy compatible OpenAI
      devant Bedrock et le configurer comme fournisseur OpenAI à la place.
  </Accordion>
</AccordionGroup>

## Connexe

<CardGroup cols={2}>
  <Card title="Sélection de modèle" href="/fr/concepts/model-providers" icon="layers">
    Choix des fournisseurs, des références de modèles et du comportement de basculement.
  </Card>
  <Card title="Recherche mémoire" href="/fr/concepts/memory-search" icon="magnifying-glass">
    Embeddings Bedrock pour la configuration de la recherche mémoire.
  </Card>
  <Card title="Référence de configuration de la mémoire" href="/fr/reference/memory-config#bedrock-embedding-config" icon="database">
    Liste complète des modèles d’embedding Bedrock et options de dimensions.
  </Card>
  <Card title="Dépannage" href="/fr/help/troubleshooting" icon="wrench">
    Dépannage général et FAQ.
  </Card>
</CardGroup>
