---
read_when:
    - Travail sur la résolution des profils d’authentification ou l’acheminement des identifiants
    - Débogage des échecs d’authentification du modèle ou de l’ordre des profils
summary: Sémantique canonique d’éligibilité et de résolution des identifiants pour les profils d’authentification
title: Sémantique des identifiants d’authentification
x-i18n:
    generated_at: "2026-07-12T02:21:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6b0516b1bb23f400d5ac5fd39a628736034440216ac22823eef061b38564dff0
    source_path: auth-credential-semantics.md
    workflow: 16
---

Cette sémantique maintient l’alignement entre le comportement d’authentification lors de la sélection et celui à l’exécution. Elle est partagée par :

- `resolveAuthProfileOrder` (ordre des profils)
- `resolveApiKeyForProfile` (résolution des identifiants à l’exécution)
- `openclaw models status --probe`
- les vérifications d’authentification d’`openclaw doctor` (`doctor-auth`)

## Codes de motif de sondage stables

Les résultats de sondage comportent une catégorie `status` (`ok`, `auth`, `rate_limit`, `billing`, `timeout`, `format`, `unknown`, `no_model`), ainsi qu’un `reasonCode` stable lorsque le sondage n’a jamais atteint un appel de modèle :

| `reasonCode`             | Signification                                                                                         |
| ------------------------ | ----------------------------------------------------------------------------------------------------- |
| `excluded_by_auth_order` | Profil omis de l’ordre d’authentification explicite de son fournisseur.                               |
| `missing_credential`     | Aucun identifiant intégré ni aucune SecretRef n’est configuré.                                        |
| `expired`                | La valeur `expires` du jeton est passée.                                                              |
| `invalid_expires`        | `expires` n’est pas un horodatage Unix valide, positif et exprimé en millisecondes.                    |
| `unresolved_ref`         | La SecretRef configurée n’a pas pu être résolue.                                                      |
| `ineligible_profile`     | Le profil est incompatible avec la configuration du fournisseur (y compris une clé d’entrée malformée). |
| `no_model`               | Des identifiants existent, mais aucun modèle candidat pouvant être sondé n’a été résolu.               |

Les vérifications d’éligibilité renvoient `ok` comme code de motif pour les identifiants utilisables.

## Identifiants par jeton

Les identifiants par jeton (`type: "token"`) prennent en charge `token` intégré et/ou `tokenRef`.

### Règles d’éligibilité

1. Un profil de jeton est inéligible lorsque `token` et `tokenRef` sont tous deux absents (`missing_credential`).
2. `expires` est facultatif. Lorsqu’il est présent, il doit s’agir d’un nombre fini de millisecondes depuis l’époque Unix, supérieur à `0` et inférieur ou égal à l’horodatage maximal de `Date` en JavaScript (8640000000000000).
3. Si `expires` est invalide (type incorrect, `NaN`, `0`, valeur négative, non finie ou supérieure à ce maximum), le profil est inéligible avec `invalid_expires`.
4. Si `expires` est dans le passé, le profil est inéligible avec `expired`.
5. `tokenRef` ne permet pas de contourner la validation d’`expires`.

### Règles de résolution

1. La sémantique du résolveur correspond à celle de l’éligibilité pour `expires`.
2. Pour les profils éligibles, le contenu du jeton peut être résolu à partir de la valeur intégrée ou de `tokenRef`.
3. Les références impossibles à résoudre produisent `unresolved_ref` dans la sortie de `models status --probe`.

## Portabilité des copies d’agents

L’héritage de l’authentification des agents fonctionne par lecture transparente. Lorsqu’un agent ne possède aucun profil local, il résout à l’exécution les profils depuis le magasin de l’agent principal/par défaut, sans copier les données secrètes dans son propre magasin d’identifiants (`agents/<agentId>/agent/openclaw-agent.sqlite`).

Les flux de copie explicites, tels que `openclaw agents add`, appliquent cette politique de portabilité :

- Les profils `api_key` et `token` sont portables, sauf si `copyToAgents: false`.
- Les profils `oauth` ne sont pas portables par défaut, car les jetons d’actualisation peuvent être à usage unique ou sensibles à la rotation.
- Les flux OAuth appartenant au fournisseur peuvent activer cette portabilité avec `copyToAgents: true` uniquement lorsque la copie des données d’actualisation entre agents est réputée sûre ; cette activation ne s’applique que lorsque le profil contient des données d’accès/d’actualisation intégrées.

Les profils non portables restent disponibles par héritage en lecture transparente, sauf si l’agent cible se connecte séparément et crée son propre profil local.

## Routes d’authentification définies uniquement dans la configuration

Les entrées `auth.profiles` avec `mode: "aws-sdk"` sont des métadonnées de routage, et non des identifiants stockés. Elles sont valides lorsque le fournisseur cible utilise `models.providers.<id>.auth: "aws-sdk"`, la route écrite par la configuration d’Amazon Bedrock appartenant au Plugin. Ces identifiants de profil peuvent figurer dans `auth.order` et les remplacements de session, même lorsqu’aucune entrée correspondante n’existe dans le magasin d’identifiants.

N’écrivez pas `type: "aws-sdk"` dans le magasin d’identifiants ; les identifiants stockés sont uniquement de type `api_key`, `token` ou `oauth`. Si un ancien fichier `auth-profiles.json` contient un tel marqueur, `openclaw doctor --fix` le déplace vers `auth.profiles` et le supprime du magasin.

## Filtrage par ordre d’authentification explicite

- Lorsque `auth.order.<provider>` ou le remplacement de l’ordre du magasin d’authentification est défini pour un fournisseur, `models status --probe` ne sonde que les identifiants de profil qui restent dans l’ordre d’authentification résolu pour ce fournisseur. Le remplacement stocké prévaut sur la configuration `auth.order`.
- Un profil stocké pour ce fournisseur, mais omis de l’ordre explicite, n’est pas essayé silencieusement par la suite. La sortie du sondage le signale avec `reasonCode: excluded_by_auth_order` et le détail `Excluded by auth.order for this provider.`

## Résolution de la cible du sondage

- Les cibles de sondage peuvent provenir des profils d’authentification, des identifiants d’environnement ou de `models.json` (`source` du résultat : `profile`, `env`, `models.json`).
- Si un fournisseur possède des identifiants, mais qu’OpenClaw ne peut résoudre aucun modèle candidat pouvant être sondé, `models status --probe` signale `status: no_model` avec `reasonCode: no_model`.

## Détection des identifiants de CLI externes

- Les identifiants disponibles uniquement à l’exécution et appartenant à des CLI externes (Claude CLI pour `claude-cli`, Codex CLI pour `openai`, MiniMax CLI pour `minimax-portal`) ne sont détectés que lorsque le fournisseur, l’environnement d’exécution ou le profil d’authentification entre dans le périmètre de l’opération en cours, ou lorsqu’un profil local stocké existe déjà pour cette source externe.
- Les appelants du magasin d’authentification choisissent un mode explicite de détection des CLI externes : `none` pour l’authentification persistée/du Plugin uniquement, `existing` pour actualiser les profils de CLI externes déjà stockés, ou `scoped` pour un ensemble concret de fournisseurs/profils.
- Les chemins en lecture seule/de statut transmettent `allowKeychainPrompt: false` ; ils utilisent uniquement les identifiants des CLI externes stockés dans des fichiers et ne lisent ni ne réutilisent les résultats du trousseau macOS.

## Garde de politique OAuth pour SecretRef

Les entrées SecretRef sont réservées aux identifiants statiques. Les identifiants OAuth sont modifiables à l’exécution (les flux d’actualisation enregistrent les jetons après rotation) ; des données OAuth adossées à SecretRef répartiraient donc l’état modifiable entre plusieurs magasins.

- Si l’identifiant d’un profil est de `type: "oauth"`, les objets SecretRef sont rejetés pour tous les champs de données d’identification de ce profil.
- Si `auth.profiles.<id>.mode` vaut `"oauth"`, les entrées `keyRef`/`tokenRef` adossées à SecretRef sont rejetées pour ce profil.
- Les violations entraînent des échecs définitifs (erreurs levées) dans les chemins de préparation des secrets au démarrage/rechargement et de résolution des profils.

## Messages compatibles avec les anciennes versions

Pour assurer la compatibilité des scripts, la première ligne des erreurs de sondage reste inchangée :

`Auth profile credentials are missing or expired.`

Des détails lisibles et le code de motif stable suivent sur les lignes suivantes sous la forme `↳ Auth reason [code]: ...`.

## Voir aussi

- [Gestion des secrets](/fr/gateway/secrets)
- [Stockage de l’authentification](/fr/concepts/oauth)
