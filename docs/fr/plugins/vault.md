---
read_when:
    - Vous souhaitez qu’OpenClaw lise les clés API depuis HashiCorp Vault
    - Vous configurez des SecretRefs sur une machine locale ou un serveur
    - Vous devez configurer les identifiants du fournisseur de modèles gérés par Vault
summary: Utilisez le Plugin Vault intégré pour résoudre les SecretRefs depuis HashiCorp Vault
title: SecretRefs du coffre-fort
x-i18n:
    generated_at: "2026-07-12T15:48:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: c1fa4895414e8cf44bb4ada191a7f7aa7b4eeda58f16be04d0c77080b7af96e3
    source_path: plugins/vault.md
    workflow: 16
---

# SecretRefs Vault

Le plugin Vault intégré permet à OpenClaw de résoudre les SecretRefs `exec` depuis
HashiCorp Vault au démarrage et lors du rechargement du Gateway. OpenClaw stocke les
références Vault dans la configuration, conserve les valeurs résolues dans l’instantané
des secrets en mémoire et ne réécrit pas les clés d’API résolues dans `openclaw.json`.

Utilisez cette fonctionnalité si vous exécutez déjà Vault ou si vous souhaitez que les clés
des fournisseurs de modèles résident en dehors des fichiers de configuration d’OpenClaw.
Pour le modèle d’exécution des SecretRefs, consultez
[Gestion des secrets](/fr/gateway/secrets).

## Avant de commencer

Vous avez besoin des éléments suivants :

- OpenClaw avec le plugin `vault` intégré disponible
- un serveur Vault accessible
- une authentification Vault capable de produire un jeton client disposant d’un accès en lecture aux
  chemins de secrets qu’OpenClaw doit résoudre
- l’environnement qui démarre le Gateway doit inclure `VAULT_ADDR` et soit
  `VAULT_TOKEN`, soit `OPENCLAW_VAULT_AUTH_METHOD=token_file` avec `VAULT_TOKEN_FILE`,
  soit une connexion JWT/Kubernetes configurée

Le résolveur communique avec Vault par HTTP depuis Node. Le Gateway n’a pas besoin de la
CLI Vault pour résoudre les SecretRefs.

Activez le plugin intégré avant d’exécuter les commandes `openclaw vault` :

```bash
openclaw plugins enable vault
```

## Stocker une clé de fournisseur dans Vault

Par défaut, OpenClaw utilise KV v2 monté sur `secret`, conformément aux exemples
du serveur de développement Vault. Pour un environnement Vault de production, définissez
`OPENCLAW_VAULT_KV_MOUNT` sur votre chemin de montage KV réel avant de créer les identifiants
SecretRef. Avec les valeurs par défaut d’OpenClaw, cet identifiant SecretRef :

```text
providers/openrouter/apiKey
```

lit ce champ Vault :

```text
secret/data/providers/openrouter -> apiKey
```

Une façon de le créer avec la CLI Vault consiste à exécuter :

```bash
export OPENROUTER_API_KEY=<openrouter-api-key>
vault kv put secret/providers/openrouter apiKey="$OPENROUTER_API_KEY"
```

Utilisez pour OpenClaw un jeton client à portée limitée, et non un jeton racine. Pour la
structure KV v2 par défaut, une politique minimale pour les clés de fournisseurs de modèles
ressemble à ceci :

```hcl
path "secret/data/providers/*" {
  capabilities = ["read"]
}
```

## Rendre Vault accessible au Gateway

Pour un Gateway local non conteneurisé, exportez les paramètres Vault dans le même shell
que celui qui démarre OpenClaw. La méthode d’authentification par défaut lit un jeton client
Vault depuis `VAULT_TOKEN` :

```bash
export VAULT_ADDR=https://vault.example.com
export VAULT_TOKEN=<vault-client-token>
```

Si Vault Agent écrit un fichier récepteur de jeton, utilisez l’authentification par fichier
de jeton :

```bash
export VAULT_ADDR=https://vault.example.com
export OPENCLAW_VAULT_AUTH_METHOD=token_file
export VAULT_TOKEN_FILE=/vault/secrets/token
```

Pour un serveur Vault signé par une autorité de certification privée, installez cette
autorité dans le magasin de confiance de l’hôte et activez la confiance système de Node :

```bash
export NODE_USE_SYSTEM_CA=1
```

Ou fournissez directement un ensemble de certificats PEM :

```bash
export NODE_EXTRA_CA_CERTS=/path/to/vault-ca.pem
```

Ces variables doivent être présentes au démarrage d’OpenClaw. Le plugin Vault les transmet
à son processus de résolution.

Pour une authentification JWT non interactive, utilisez un fichier JWT de charge de travail
et un rôle Vault de type `jwt` :

```bash
export VAULT_ADDR=https://vault.example.com
export OPENCLAW_VAULT_AUTH_METHOD=jwt
export OPENCLAW_VAULT_AUTH_MOUNT=jwt
export OPENCLAW_VAULT_AUTH_ROLE=openclaw
export OPENCLAW_VAULT_JWT_FILE=/var/run/secrets/tokens/vault
```

Le fichier JWT doit être un jeton de charge de travail projeté, par exemple un jeton de compte
de service Kubernetes dont l’audience est acceptée par le rôle Vault.
La connexion OIDC interactive dans un navigateur est utile aux utilisateurs, mais l’exécution
du Gateway nécessite une connexion JWT non interactive ou un fichier de jeton.

Pour la méthode d’authentification Kubernetes de Vault, utilisez `kubernetes`. Elle est destinée
aux Gateways exécutés en tant que Pods ; le montage par défaut est `kubernetes` et le fichier JWT
par défaut correspond au chemin standard du jeton de compte de service :

```bash
export VAULT_ADDR=https://vault.example.com
export OPENCLAW_VAULT_AUTH_METHOD=kubernetes
export OPENCLAW_VAULT_AUTH_ROLE=openclaw
```

Définissez `OPENCLAW_VAULT_AUTH_MOUNT` uniquement si l’authentification Kubernetes de Vault
est montée ailleurs que dans `auth/kubernetes`. Définissez `OPENCLAW_VAULT_JWT_FILE` uniquement
si le jeton du compte de service est projeté dans un chemin personnalisé.

Paramètres facultatifs :

```bash
export VAULT_NAMESPACE=<namespace-name>
export OPENCLAW_VAULT_KV_MOUNT=secret
export OPENCLAW_VAULT_KV_VERSION=2
```

Vérifiez ce que le shell actuel peut détecter :

```bash
openclaw vault status
```

Lorsque plusieurs fournisseurs de secrets adossés à Vault sont configurés, sélectionnez-en un
par alias :

```bash
openclaw vault status --provider-alias corp-vault
```

`openclaw vault status` n’affiche jamais `VAULT_TOKEN` ; il indique uniquement si le jeton,
le fichier de jeton et le fichier JWT sont définis.

<Warning>
Si le Gateway s’exécute en tant que service, LaunchAgent, unité systemd, tâche planifiée ou
conteneur, cet environnement d’exécution doit recevoir les mêmes variables Vault.
La définition de variables dans un shell interactif ne valide que ce shell, et non le
Gateway déjà en cours d’exécution.
</Warning>

## Générer et appliquer un plan SecretRef

Créez un plan qui associe la clé d’API du fournisseur de modèles OpenRouter à Vault :

```bash
openclaw vault setup \
  --plan-out ./vault-secrets-plan.json \
  --openrouter-id providers/openrouter/apiKey
```

Appliquez et vérifiez le plan :

```bash
openclaw secrets apply --from ./vault-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from ./vault-secrets-plan.json --allow-exec
openclaw secrets audit --check --allow-exec
openclaw secrets reload
```

Utilisez `--allow-exec`, car le plugin Vault effectue la résolution par l’intermédiaire d’un
fournisseur de SecretRefs exec géré par OpenClaw.

Si le Gateway n’est pas encore en cours d’exécution, démarrez-le normalement après avoir
appliqué le plan au lieu d’exécuter `openclaw secrets reload`.

## Configurer davantage de clés de fournisseurs

Raccourcis intégrés :

```bash
openclaw vault setup --openai-id providers/openai/apiKey
openclaw vault setup --anthropic-id providers/anthropic/apiKey
openclaw vault setup --openrouter-id providers/openrouter/apiKey
```

Plusieurs clés de fournisseurs dans un même plan :

```bash
openclaw vault setup \
  --plan-out ./vault-secrets-plan.json \
  --openai-id providers/openai/apiKey \
  --anthropic-id providers/anthropic/apiKey \
  --openrouter-id providers/openrouter/apiKey
```

Pour les fournisseurs intégrés sans raccourci, ou les fournisseurs de modèles compatibles
avec OpenAI et personnalisés déjà configurés, utilisez `--provider-key` :

```bash
openclaw vault setup \
  --plan-out ./vault-secrets-plan.json \
  --provider-key local-openai=providers/local-openai/apiKey \
  --provider-key groq=providers/groq/apiKey
```

Chaque `--provider-key <provider=id>` écrit une SecretRef dans
`models.providers.<provider>.apiKey`. Pour les fournisseurs personnalisés, cette option ne crée
pas les paramètres `baseUrl`, `api` ou `models` du fournisseur ; configurez-les d’abord.

Utilisez `--target <path=id>` pour tout chemin cible SecretRef connu :

```bash
openclaw vault setup \
  --target channels.telegram.botToken=channels/telegram/botToken \
  --target models.providers.openai.headers.x-api-key=providers/openai/proxyKey \
  --target auth-profiles:main:profiles.openai.key=providers/openai/apiKey
```

Les chemins cibles seuls s’appliquent à `openclaw.json`. Utilisez
`auth-profiles:<agentId>:<path>` pour les cibles `auth-profiles.json` existantes.
Le chemin cible doit être une cible SecretRef OpenClaw enregistrée. La commande de configuration
ne crée pas de secrets nommés arbitraires dans OpenClaw ; Vault reste le magasin de secrets et
OpenClaw stocke uniquement des SecretRefs dans les champs de configuration pris en charge.

## Format des identifiants SecretRef

Les identifiants SecretRef Vault suivent cette convention :

```text
<vault-secret-path>/<field>
```

Exemples :

| Identifiant SecretRef         | Lecture Vault KV v2 par défaut     | Champ renvoyé |
| ----------------------------- | ---------------------------------- | ------------- |
| `providers/openrouter/apiKey` | `secret/data/providers/openrouter` | `apiKey`      |
| `providers/openai/apiKey`     | `secret/data/providers/openai`     | `apiKey`      |
| `teams/agent-prod/openrouter` | `secret/data/teams/agent-prod`     | `openrouter`  |

Le champ Vault renvoyé doit être une chaîne de caractères.

Pour KV v1, définissez :

```bash
export OPENCLAW_VAULT_KV_VERSION=1
```

`providers/openrouter/apiKey` lit alors :

```text
secret/providers/openrouter -> apiKey
```

## Ce qu’OpenClaw stocke

L’application d’un plan de configuration Vault stocke un fournisseur géré par un plugin :

```json
{
  "source": "exec",
  "pluginIntegration": {
    "pluginId": "vault",
    "integrationId": "vault"
  }
}
```

Les champs d’identifiants d’accès pointent vers ce fournisseur :

```json
{ "source": "exec", "provider": "vault", "id": "providers/openrouter/apiKey" }
```

La valeur résolue réside uniquement dans l’instantané actif des secrets d’exécution.

## Conteneurs et déploiements gérés

Les Gateways conteneurisés utilisent toujours le même plugin et la même configuration SecretRef.
Le conteneur doit recevoir :

- `VAULT_ADDR`
- une source d’authentification :
  - `VAULT_TOKEN`
  - `OPENCLAW_VAULT_AUTH_METHOD=token_file` avec `VAULT_TOKEN_FILE`
  - `OPENCLAW_VAULT_AUTH_METHOD=jwt` avec `OPENCLAW_VAULT_AUTH_MOUNT`,
    `OPENCLAW_VAULT_AUTH_ROLE` et `OPENCLAW_VAULT_JWT_FILE`
  - `OPENCLAW_VAULT_AUTH_METHOD=kubernetes` avec `OPENCLAW_VAULT_AUTH_ROLE` ; vous pouvez
    éventuellement remplacer `OPENCLAW_VAULT_AUTH_MOUNT` ou `OPENCLAW_VAULT_JWT_FILE`
- éventuellement `VAULT_NAMESPACE`, `OPENCLAW_VAULT_KV_MOUNT` et
  `OPENCLAW_VAULT_KV_VERSION`

Avec Kubernetes, privilégiez `OPENCLAW_VAULT_AUTH_METHOD=kubernetes`
lorsque l’authentification Kubernetes de Vault est configurée pour le cluster. Utilisez
`OPENCLAW_VAULT_AUTH_METHOD=jwt` uniquement si Vault est configuré pour traiter le cluster
comme un émetteur JWT/OIDC générique. Ces deux options sont préférables au stockage d’un jeton
Vault à longue durée de vie dans un Secret Kubernetes. Les déploiements avec un conteneur
auxiliaire Vault Agent ou un injecteur peuvent utiliser `token_file` à la place.

Pour les configurations Vault mutualisées, conservez le routage des locataires dans la politique
Vault et la configuration du déploiement. OpenClaw n’exige aucun montage, rôle ou chemin fixe :
chaque environnement de Gateway peut définir ses propres `OPENCLAW_VAULT_KV_MOUNT`,
`OPENCLAW_VAULT_AUTH_ROLE` et identifiants SecretRef. Si un même Gateway partagé doit résoudre
simultanément différents utilisateurs Vault, utilisez des fournisseurs exec configurés
manuellement qui encapsulent des environnements d’authentification distincts, ou répartissez les
locataires entre plusieurs environnements de Gateway avec des environnements Vault séparés.

## Pages associées

- [Gestion des secrets](/fr/gateway/secrets)
- [`openclaw secrets`](/fr/cli/secrets)
- [Inventaire des plugins](/fr/plugins/plugin-inventory)
