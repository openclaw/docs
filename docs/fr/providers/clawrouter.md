---
read_when:
    - Vous souhaitez une seule clé gérée pour plusieurs fournisseurs de modèles
    - Vous avez besoin de la découverte des modèles ou du suivi des quotas de ClawRouter dans OpenClaw
summary: Acheminer les modèles associés aux identifiants via ClawRouter et afficher les quotas gérés
title: ClawRouter
x-i18n:
    generated_at: "2026-07-12T03:14:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b9a83253b5de3022bb3d3113427e5183f4ac537161ed75723fec0dafc33ebb00
    source_path: providers/clawrouter.md
    workflow: 16
---

ClawRouter fournit à OpenClaw une clé unique, limitée par une politique, pour plusieurs
fournisseurs de modèles en amont. Le plugin `clawrouter` intégré découvre uniquement
les modèles autorisés pour cette clé, achemine chaque modèle via son protocole déclaré
et présente le budget de la clé ainsi que son utilisation agrégée dans les interfaces
d’utilisation d’OpenClaw.

Les identifiants en amont et le transfert propre à chaque fournisseur restent dans ClawRouter :
vous n’avez donc jamais à installer ni à authentifier chaque plugin de fournisseur en amont sur
l’hôte OpenClaw. Le plugin est fourni avec OpenClaw (`enabledByDefault: true`) ;
vous avez seulement besoin d’un identifiant ClawRouter délivré.

| Propriété            | Valeur                                           |
| -------------------- | ------------------------------------------------ |
| Fournisseur          | `clawrouter`                                     |
| Plugin               | intégré (inclus dans OpenClaw)                   |
| Authentification     | `CLAWROUTER_API_KEY`                             |
| URL par défaut       | `https://clawrouter.openclaw.ai`                 |
| Catalogue de modèles | Limité par l’identifiant via `/v1/catalog`       |
| Quotas               | Budget mensuel et utilisation via `/v1/usage`    |

## Prise en main

<Steps>
  <Step title="Obtenir un identifiant limité">
    Demandez à votre administrateur ClawRouter un identifiant dont la politique inclut
    les fournisseurs, les modèles et le budget mensuel que vous devez utiliser. Les identifiants
    ne sont révélés qu’une seule fois lors de leur délivrance.
  </Step>
  <Step title="Configurer OpenClaw">
    ```bash
    export CLAWROUTER_API_KEY="..."
    openclaw onboard --auth-choice clawrouter-api-key
    openclaw plugins enable clawrouter
    ```

    `clawrouter` est intégré et activé par défaut. Si votre configuration définit
    `plugins.allow`, ajoutez `clawrouter` à cette liste avant de l’activer. Pour un
    déploiement personnalisé, définissez `models.providers.clawrouter.baseUrl` sur
    l’origine de ClawRouter ; la valeur par défaut est `https://clawrouter.openclaw.ai`.

  </Step>
  <Step title="Répertorier les modèles accordés">
    ```bash
    openclaw models list --all --provider clawrouter
    ```

    Utilisez les références de modèles renvoyées exactement comme elles sont affichées.
    Elles conservent l’espace de noms en amont, par exemple
    `clawrouter/openai/gpt-5.5`, `clawrouter/anthropic/claude-sonnet-4-6` ou
    `clawrouter/google/gemini-3.5-flash`. Si `agents.defaults.models` est une
    liste d’autorisation dans votre configuration, ajoutez-y chaque référence ClawRouter sélectionnée.

  </Step>
  <Step title="Sélectionner un modèle">
    ```bash
    openclaw models set clawrouter/<provider>/<model>
    ```

    Vous pouvez également sélectionner un modèle renvoyé pour une seule exécution avec
    `openclaw agent --model clawrouter/<provider>/<model> --message "..."`.

  </Step>
</Steps>

## Déploiement non interactif administré

Conservez la clé du proxy dans le mécanisme d’injection de secrets de la charge de travail
et stockez uniquement une SecretRef dans `openclaw.json`. Les champs administrés canoniques sont :

| Objectif                   | Champ de configuration ou d’environnement                                    |
| -------------------------- | ----------------------------------------------------------------------------- |
| Origine du routeur         | `models.providers.clawrouter.baseUrl`                                         |
| Identifiant                | `models.providers.clawrouter.apiKey` -> SecretRef d’environnement             |
| Valeur du secret           | `CLAWROUTER_API_KEY` dans l’environnement du processus Gateway                |
| Modèle par défaut          | `agents.defaults.model.primary` -> `clawrouter/<provider>/<model>`            |
| Étiquette de charge        | `models.providers.clawrouter.headers.X-ClawRouter-Project-Id` (facultatif)    |

Par exemple, un contrôleur de déploiement peut gérer ce correctif JSON5 :

```json5
{
  plugins: {
    entries: { clawrouter: { enabled: true } },
  },
  models: {
    providers: {
      clawrouter: {
        baseUrl: "https://clawrouter.internal.example",
        apiKey: {
          source: "env",
          provider: "default",
          id: "CLAWROUTER_API_KEY",
        },
        headers: {
          "X-ClawRouter-Project-Id": "fakeco",
        },
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "clawrouter/openai/gpt-5.5" },
    },
  },
}
```

Si le déploiement définit `plugins.allow`, conservez ses entrées existantes et ajoutez
`clawrouter`. Validez et appliquez sans assistant interactif :

```bash
openclaw config patch --file ./clawrouter.patch.json5 --dry-run --json
openclaw config patch --file ./clawrouter.patch.json5
```

La simulation résout la SecretRef, mais n’affiche jamais sa valeur. Pour renouveler
l’identifiant, mettez à jour le Secret externe qui fournit `CLAWROUTER_API_KEY` et
redémarrez la charge de travail Gateway afin de charger le nouvel environnement du processus.
Le fichier de configuration et la référence du modèle ne changent pas.

Pour un Gateway Docker autonome compilé depuis les sources, ClawRouter est déjà inclus dans
l’environnement d’exécution racine. Sélectionnez uniquement le plugin de canal nécessitant un paquet distinct,
par exemple `OPENCLAW_EXTENSIONS=clickclack`, `slack` ou `msteams` ; consultez
[les images compilées depuis les sources avec des plugins sélectionnés](/fr/install/docker#source-built-images-with-selected-plugins).
Les déploiements sous forme d’archive ou d’appliance doivent empaqueter les mêmes sources intégrées via leur
propre chaîne de production d’artefacts plutôt que d’utiliser l’image OCI.

## Préparation et preuve en conditions réelles

Ces vérifications prouvent des limites différentes ; ne substituez pas l’une à l’autre :

```bash
# Santé du processus ClawRouter uniquement ; aucun identifiant ni modèle en amont n’est sollicité.
curl -fsS https://clawrouter.internal.example/v1/health

# Préparation au démarrage du Gateway OpenClaw uniquement ; aucun appel de modèle n’est effectué.
curl -fsS http://127.0.0.1:18789/readyz

# Découverte du catalogue limitée par l’identifiant.
openclaw models list --all --provider clawrouter --json

# Sonde minimale d’inférence réelle via le fournisseur ClawRouter configuré.
openclaw models status --probe --probe-provider clawrouter --probe-max-tokens 8 --json

# Test canari de la charge de travail utilisant une référence exacte de modèle accordé.
openclaw agent --agent main \
  --model clawrouter/openai/gpt-5.5 \
  --message "Reply exactly: CLAWROUTER_CANARY_OK" \
  --json
```

Utilisez un modèle renvoyé par le catalogue limité plutôt que de copier aveuglément
le modèle d’exemple. Une réponse réussie de `/readyz` signifie que le Gateway peut traiter
des requêtes ; elle n’affirme pas que ClawRouter, son identifiant ou un fournisseur en amont
est prêt. La sonde de modèle et le test canari de l’agent constituent les preuves d’inférence.

Pour un diagnostic en conditions réelles, lancez le test canari et examinez les journaux standard du Gateway.
Les diagnostics existants du transport de modèle, limités aux métadonnées, émettent des lignes de cette forme :

```text
[model-fetch] start provider=clawrouter api=openai-responses model=openai/gpt-5.5 method=POST url=https://clawrouter.internal.example/v1/responses
[model-fetch] response provider=clawrouter api=openai-responses model=openai/gpt-5.5 status=200
```

Le plugin envoie des en-têtes `X-ClawRouter-Client`, `X-ClawRouter-Agent-Id` et
`X-ClawRouter-Session-Id` de longueur limitée lorsque ces identifiants sont disponibles. Il associe également
le `callId` de diagnostic de l’appel de modèle (`<run-id>:model:<n>`) à
`X-Request-ID`, afin qu’un événement d’appel de modèle OpenClaw puisse être rapproché de la
piste d’audit de ClawRouter limitée aux métadonnées. Les valeurs respectant la limite de
128 caractères de l’identifiant de requête sont identiques. Les valeurs plus longues conservent
le suffixe `:model:<n>` et un hachage déterministe afin que les différents appels restent
limités en longueur et puissent être rapprochés. Les métadonnées statiques du déploiement,
telles que `X-ClawRouter-Project-Id`, peuvent être définies dans la table `headers` du fournisseur.
Les en-têtes d’attribution de l’agent et de la session conservent leur limite distincte de
256 caractères. Les identifiants automatiques de requête contenant des caractères absents du jeu
d’identifiants ASCII de ClawRouter utilisent la même forme déterministe et limitée.
Les en-têtes configurés explicitement, y compris toute variante de casse de `X-Request-ID`, ont priorité
sur les valeurs automatiques. Le diagnostic du transport enregistre les métadonnées de routage et de réponse ;
il ne consigne ni identifiants, ni identifiants de requête, ni invites, ni réponses générées.
L’événement d’audit propre à ClawRouter fournit le fournisseur en amont sélectionné et
l’état de conservation du contenu.

## Découverte des modèles

`GET /v1/catalog` renvoie `{ providers: [...] }`, où chaque entrée de fournisseur
répertorie ses propres `models[]` (avec l’identifiant en amont, les fonctionnalités et la tarification) ainsi que
les routes de requête qu’il prend en charge. OpenClaw ne fournit pas une seconde liste fixe de
modèles ClawRouter. Un modèle du catalogue est présenté comme modèle OpenClaw lorsque :

- la politique de l’identifiant autorise son fournisseur ;
- le modèle du catalogue annonce une fonctionnalité LLM prise en charge (`llm.responses`,
  `llm.chat`, `llm.messages` ou `llm.stream` avec une route de diffusion en continu
  correspondante) ; et
- le fournisseur expose une route correspondante pour l’un des transports ci-dessous.

L’ajout d’un modèle à un fournisseur ClawRouter pris en charge ne nécessite aucune version d’OpenClaw :
la prochaine actualisation du catalogue (mis en cache pendant 60 secondes pour chaque portée d’identifiant)
le découvre. Un modèle nécessitant un nouveau protocole filaire exige d’abord sa prise en charge par le plugin.

## Protocoles et plugins de fournisseurs

ClawRouter gère les identifiants en amont ; son catalogue indique à OpenClaw quel
transport utiliser, de sorte que vous n’installez jamais le plugin d’authentification de chaque entreprise en amont.

| Fonctionnalité/route du catalogue                          | Transport OpenClaw       |
| ---------------------------------------------------------- | ------------------------ |
| `llm.responses` (fournisseur compatible avec OpenAI)       | `openai-responses`       |
| `llm.chat` (fournisseur compatible avec OpenAI)            | `openai-completions`     |
| `llm.messages` + route `anthropic.messages`                | `anthropic-messages`     |
| `llm.stream` + route `google.generate_content` en continu  | `google-generative-ai`   |

Le plugin applique également les politiques correspondantes de relecture et de schéma d’outils pour ces
familles (compatibilité des schémas d’outils OpenAI/DeepSeek/Gemini ; politiques natives de
relecture Anthropic et Google Gemini). Un fournisseur du catalogue exposant uniquement un
format de requête non pris en charge n’est volontairement pas présenté comme un modèle de texte
OpenClaw. Normalisez ces fournisseurs vers l’un des contrats pris en charge dans
ClawRouter plutôt que d’envoyer une charge utile incompatible.

## Quotas et utilisation

La réponse `/v1/usage` de ClawRouter alimente les interfaces habituelles d’utilisation
des fournisseurs d’OpenClaw : totaux des requêtes, des jetons et des dépenses, ainsi qu’une
fenêtre budgétaire mensuelle lorsque la clé comporte une limite. Les clés sans comptage affichent
tout de même l’utilisation agrégée, sans fenêtre de pourcentage.

La recherche du quota utilise la même clé limitée que la découverte des modèles. Un échec
de la recherche du quota ne bloque pas l’exécution du modèle.

Consultez l’instantané en conditions réelles avec :

```bash
openclaw status --usage
openclaw models status
```

Le même instantané du fournisseur est disponible pour `/status` dans la discussion et dans l’interface
d’utilisation d’OpenClaw. Le budget s’applique à l’ensemble de la politique ; les requêtes effectuées
par un autre client utilisant la même politique ClawRouter peuvent donc modifier le pourcentage restant.

## Résolution des problèmes

| Symptôme                                      | Vérification                                                                                                                                                                |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Aucun modèle ClawRouter                       | Vérifiez que le plugin est activé et autorisé par `plugins.allow`, puis que l’identifiant est actif et autorise au moins un fournisseur prêt.                               |
| Un modèle ClawRouter configuré est absent     | Examinez ses fonctionnalités et ses routes dans `/v1/catalog`. Les contrats de transport non pris en charge sont volontairement filtrés.                                    |
| `Unknown model: clawrouter/...`               | Ajoutez la référence exacte du catalogue à `agents.defaults.models` lorsque cette table de configuration est utilisée comme liste d’autorisation.                          |
| `401` ou `403` du catalogue ou de l’utilisation | Délivrez à nouveau l’identifiant ClawRouter ou modifiez sa portée ; OpenClaw ne se rabat pas sur les clés des fournisseurs en amont.                                       |
| Échec de l’appel du modèle après sa découverte | Vérifiez la connexion du fournisseur et l’état du service en amont dans ClawRouter, puis réessayez une fois son état de préparation rétabli.                               |
| L’utilisation comporte des totaux, mais aucun pourcentage | La politique est sans comptage ; ajoutez un budget mensuel dans ClawRouter pour afficher une fenêtre de pourcentage.                                            |

## Comportement de sécurité

- La découverte du catalogue est limitée à la clé de proxy configurée et mise en cache par périmètre d’identifiants (répertoire de l’agent, répertoire de l’espace de travail, identifiant du profil d’authentification et URL de base).
- La clé de proxy est jointe uniquement lors de l’envoi de la requête ; elle n’est pas stockée dans les métadonnées du modèle.
- Les valeurs d’attribution automatique et de corrélation des requêtes sont débarrassées des espaces superflus et rejetées si elles contiennent des caractères de contrôle avant l’envoi. Les valeurs d’attribution sont limitées à 256 caractères ; les identifiants de requête sont limités à 128.
- Les diagnostics de transport des modèles contiennent uniquement des métadonnées et n’incluent jamais la clé de proxy ni le contenu du modèle.
- Les identifiants des modèles Anthropic et Gemini natifs sont remplacés par leurs identifiants en amont uniquement lors de l’envoi.
- Les entrées de catalogue non prises en charge ou non autorisées sont rejetées par défaut et ne peuvent pas être sélectionnées.

## Contenu associé

<CardGroup cols={2}>
  <Card title="Fournisseurs de modèles" href="/fr/concepts/model-providers" icon="layers">
    Configuration des fournisseurs et sélection des modèles.
  </Card>
  <Card title="Suivi de l’utilisation" href="/fr/concepts/usage-tracking" icon="chart-line">
    Interfaces d’utilisation et d’état d’OpenClaw.
  </Card>
</CardGroup>
