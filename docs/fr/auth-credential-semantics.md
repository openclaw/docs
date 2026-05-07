---
read_when:
    - Travail sur la résolution des profils d’authentification ou le routage des identifiants
    - Débogage des échecs d’authentification des modèles ou de l’ordre des profils
summary: Sémantique canonique d’éligibilité et de résolution des identifiants pour les profils d’authentification
title: Sémantique des identifiants d’authentification
x-i18n:
    generated_at: "2026-05-07T13:13:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2d916ff95ca2ac1fe21e66f64b887b1df1e6b97d7dcc681e5bb9a9dee8ce9473
    source_path: auth-credential-semantics.md
    workflow: 16
---

Ce document définit la sémantique canonique d’éligibilité et de résolution des identifiants utilisée dans :

- `resolveAuthProfileOrder`
- `resolveApiKeyForProfile`
- `models status --probe`
- `doctor-auth`

L’objectif est de maintenir l’alignement entre le comportement au moment de la sélection et le comportement à l’exécution.

## Codes de raison stables de sonde

- `ok`
- `excluded_by_auth_order`
- `missing_credential`
- `invalid_expires`
- `expired`
- `unresolved_ref`
- `no_model`

## Identifiants de jeton

Les identifiants de jeton (`type: "token"`) prennent en charge `token` et/ou `tokenRef` en ligne.

### Règles d’éligibilité

1. Un profil de jeton est inéligible lorsque `token` et `tokenRef` sont tous deux absents.
2. `expires` est facultatif.
3. Si `expires` est présent, il doit être un nombre fini supérieur à `0`.
4. Si `expires` est invalide (`NaN`, `0`, négatif, non fini ou de type incorrect), le profil est inéligible avec `invalid_expires`.
5. Si `expires` est dans le passé, le profil est inéligible avec `expired`.
6. `tokenRef` ne contourne pas la validation de `expires`.

### Règles de résolution

1. La sémantique du résolveur correspond à la sémantique d’éligibilité pour `expires`.
2. Pour les profils éligibles, le contenu du jeton peut être résolu depuis une valeur en ligne ou `tokenRef`.
3. Les références non résolubles produisent `unresolved_ref` dans la sortie de `models status --probe`.

## Portabilité des copies d’agent

L’héritage d’authentification des agents se fait par lecture transparente. Lorsqu’un agent n’a pas de profil local, il
peut résoudre les profils depuis le magasin de l’agent par défaut/principal à l’exécution sans
copier le contenu secret dans son propre `auth-profiles.json`.

Les flux de copie explicites, tels que `openclaw agents add`, utilisent cette politique de portabilité :

- Les profils `api_key` sont portables sauf si `copyToAgents: false`.
- Les profils `token` sont portables sauf si `copyToAgents: false`.
- Les profils `oauth` ne sont pas portables par défaut, car les jetons d’actualisation peuvent être
  à usage unique ou sensibles à la rotation.
- Les flux OAuth détenus par un fournisseur peuvent s’inscrire avec `copyToAgents: true` uniquement lorsque
  la copie du contenu d’actualisation entre agents est connue comme sûre.

Les profils non portables restent disponibles par héritage en lecture transparente sauf si
l’agent cible se connecte séparément et crée son propre profil local.

## Routes d’authentification configurées uniquement

Les entrées `auth.profiles` avec `mode: "aws-sdk"` sont des métadonnées de routage, pas des
identifiants stockés. Elles sont valides lorsque le fournisseur cible utilise
`models.providers.<id>.auth: "aws-sdk"` ou la route AWS SDK par défaut intégrée
d’Amazon Bedrock. Ces identifiants de profil peuvent apparaître dans `auth.order` et les
remplacements de session même lorsqu’aucune entrée correspondante n’existe dans `auth-profiles.json`.

N’écrivez pas `type: "aws-sdk"` dans `auth-profiles.json`. Si une installation héritée
possède un tel marqueur, `openclaw doctor --fix` le déplace vers `auth.profiles` et
supprime le marqueur du magasin d’identifiants.

## Filtrage explicite de l’ordre d’authentification

- Lorsque `auth.order.<provider>` ou le remplacement d’ordre du magasin d’authentification est défini pour un
  fournisseur, `models status --probe` ne sonde que les identifiants de profil qui restent dans l’ordre
  d’authentification résolu pour ce fournisseur.
- Un profil stocké pour ce fournisseur qui est omis de l’ordre explicite n’est pas
  essayé silencieusement plus tard. La sortie de sonde le signale avec
  `reasonCode: excluded_by_auth_order` et le détail
  `Excluded by auth.order for this provider.`

## Résolution de la cible de sonde

- Les cibles de sonde peuvent provenir de profils d’authentification, d’identifiants d’environnement ou de
  `models.json`.
- Si un fournisseur dispose d’identifiants mais qu’OpenClaw ne peut pas résoudre de modèle
  sondable candidat pour lui, `models status --probe` signale `status: no_model` avec
  `reasonCode: no_model`.

## Découverte d’identifiants de CLI externes

- Les identifiants utilisés uniquement à l’exécution et détenus par des CLI externes ne sont découverts que lorsque le
  fournisseur, l’environnement d’exécution ou le profil d’authentification est dans le périmètre de l’opération actuelle, ou
  lorsqu’un profil local stocké pour cette source externe existe déjà.
- Les appelants du magasin d’authentification doivent choisir un mode explicite de découverte de CLI externe :
  `none` pour l’authentification persistée/Plugin uniquement, `existing` pour actualiser les profils de CLI externe
  déjà stockés, ou `scoped` pour un ensemble concret de fournisseurs/profils.
- Les chemins en lecture seule/de statut transmettent `allowKeychainPrompt: false` ; ils utilisent uniquement les
  identifiants de CLI externes sauvegardés par fichier et ne lisent ni ne réutilisent les résultats du trousseau macOS.

## Garde-fou de politique OAuth SecretRef

- L’entrée SecretRef est réservée aux identifiants statiques.
- Si un identifiant de profil est `type: "oauth"`, les objets SecretRef ne sont pas pris en charge pour le contenu d’identifiant de ce profil.
- Si `auth.profiles.<id>.mode` est `"oauth"`, l’entrée `keyRef`/`tokenRef` adossée à SecretRef pour ce profil est rejetée.
- Les violations sont des échecs bloquants dans les chemins de résolution d’authentification au démarrage/rechargement.

## Messagerie compatible avec l’héritage

Pour la compatibilité des scripts, les erreurs de sonde conservent cette première ligne inchangée :

`Auth profile credentials are missing or expired.`

Des détails lisibles par l’humain et des codes de raison stables peuvent être ajoutés sur les lignes suivantes.

## Connexe

- [Gestion des secrets](/fr/gateway/secrets)
- [Stockage de l’authentification](/fr/concepts/oauth)
