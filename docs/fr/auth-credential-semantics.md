---
read_when:
    - Travail sur la résolution des profils d’authentification ou le routage des identifiants
    - Débogage des échecs d’authentification du modèle ou de l’ordre des profils
summary: Sémantique canonique d’éligibilité et de résolution des identifiants pour les profils d’authentification
title: Sémantique des identifiants d’authentification
x-i18n:
    generated_at: "2026-06-27T17:08:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 591c0384e1d43512252aaa7b362141b6bc93183b30b5847168758f86127f0663
    source_path: auth-credential-semantics.md
    workflow: 16
---

Ce document définit les sémantiques canoniques d’éligibilité et de résolution des identifiants utilisées dans :

- `resolveAuthProfileOrder`
- `resolveApiKeyForProfile`
- `models status --probe`
- `doctor-auth`

L’objectif est de maintenir l’alignement entre le comportement au moment de la sélection et le comportement à l’exécution.

## Codes de motif de sonde stables

- `ok`
- `excluded_by_auth_order`
- `missing_credential`
- `invalid_expires`
- `expired`
- `unresolved_ref`
- `no_model`

## Identifiants par jeton

Les identifiants par jeton (`type: "token"`) prennent en charge `token` et/ou `tokenRef` en ligne.

### Règles d’éligibilité

1. Un profil de jeton est inéligible lorsque `token` et `tokenRef` sont tous deux absents.
2. `expires` est facultatif.
3. Si `expires` est présent, il doit être un nombre fini supérieur à `0`.
4. Si `expires` est invalide (`NaN`, `0`, négatif, non fini ou de type incorrect), le profil est inéligible avec `invalid_expires`.
5. Si `expires` est dans le passé, le profil est inéligible avec `expired`.
6. `tokenRef` ne contourne pas la validation de `expires`.

### Règles de résolution

1. Les sémantiques du résolveur correspondent aux sémantiques d’éligibilité pour `expires`.
2. Pour les profils éligibles, le matériau de jeton peut être résolu depuis une valeur en ligne ou `tokenRef`.
3. Les références impossibles à résoudre produisent `unresolved_ref` dans la sortie de `models status --probe`.

## Portabilité des copies d’agent

L’héritage d’authentification des agents est en lecture traversante. Lorsqu’un agent n’a aucun profil local, il
peut résoudre des profils depuis le magasin de l’agent par défaut/principal à l’exécution sans
copier de matériau secret dans son propre `auth-profiles.json`.

Les flux de copie explicites, tels que `openclaw agents add`, utilisent cette politique de portabilité :

- Les profils `api_key` sont portables sauf si `copyToAgents: false`.
- Les profils `token` sont portables sauf si `copyToAgents: false`.
- Les profils `oauth` ne sont pas portables par défaut, car les jetons d’actualisation peuvent être
  à usage unique ou sensibles à la rotation.
- Les flux OAuth détenus par le fournisseur peuvent s’inscrire explicitement avec `copyToAgents: true` uniquement lorsque
  la copie du matériau d’actualisation entre agents est réputée sûre.

Les profils non portables restent disponibles via l’héritage en lecture traversante sauf si
l’agent cible se connecte séparément et crée son propre profil local.

## Routes d’authentification uniquement en configuration

Les entrées `auth.profiles` avec `mode: "aws-sdk"` sont des métadonnées de routage, et non des identifiants
stockés. Elles sont valides lorsque le fournisseur cible utilise
`models.providers.<id>.auth: "aws-sdk"` ou la route AWS SDK de configuration Amazon Bedrock détenue par le plugin.
Ces identifiants de profil peuvent apparaître dans `auth.order` et les remplacements
de session même lorsqu’aucune entrée correspondante n’existe dans `auth-profiles.json`.

N’écrivez pas `type: "aws-sdk"` dans `auth-profiles.json`. Si une installation héritée
possède un tel marqueur, `openclaw doctor --fix` le déplace vers `auth.profiles` et
supprime le marqueur du magasin d’identifiants.

## Filtrage explicite de l’ordre d’authentification

- Lorsque `auth.order.<provider>` ou le remplacement d’ordre du magasin d’authentification est défini pour un
  fournisseur, `models status --probe` ne sonde que les identifiants de profil qui restent dans l’ordre
  d’authentification résolu pour ce fournisseur.
- Un profil stocké pour ce fournisseur qui est omis de l’ordre explicite n’est
  pas essayé silencieusement plus tard. La sortie de la sonde le signale avec
  `reasonCode: excluded_by_auth_order` et le détail
  `Excluded by auth.order for this provider.`

## Résolution des cibles de sonde

- Les cibles de sonde peuvent provenir de profils d’authentification, d’identifiants d’environnement ou de
  `models.json`.
- Si un fournisseur dispose d’identifiants mais qu’OpenClaw ne peut pas résoudre de modèle
  sondable candidat pour celui-ci, `models status --probe` signale `status: no_model` avec
  `reasonCode: no_model`.

## Découverte des identifiants de CLI externes

- Les identifiants utilisables uniquement à l’exécution détenus par des CLI externes sont découverts uniquement lorsque le
  fournisseur, l’environnement d’exécution ou le profil d’authentification est dans le périmètre de l’opération en cours, ou
  lorsqu’un profil local stocké pour cette source externe existe déjà.
- Les appelants du magasin d’authentification doivent choisir un mode explicite de découverte de CLI externe :
  `none` pour l’authentification persistée/plugin uniquement, `existing` pour actualiser les profils de CLI externes déjà
  stockés, ou `scoped` pour un ensemble concret de fournisseurs/profils.
- Les chemins en lecture seule/d’état transmettent `allowKeychainPrompt: false` ; ils utilisent uniquement les
  identifiants de CLI externes adossés à des fichiers et ne lisent ni ne réutilisent les résultats du trousseau macOS.

## Garde-fou de politique SecretRef OAuth

- L’entrée SecretRef est destinée uniquement aux identifiants statiques.
- Si un identifiant de profil est `type: "oauth"`, les objets SecretRef ne sont pas pris en charge pour le matériau d’identification de ce profil.
- Si `auth.profiles.<id>.mode` est `"oauth"`, l’entrée `keyRef`/`tokenRef` adossée à SecretRef pour ce profil est rejetée.
- Les violations sont des échecs stricts dans les chemins de résolution d’authentification au démarrage/rechargement.

## Messagerie compatible avec l’héritage

Pour la compatibilité des scripts, les erreurs de sonde conservent cette première ligne inchangée :

`Auth profile credentials are missing or expired.`

Des détails lisibles par l’humain et des codes de motif stables peuvent être ajoutés sur les lignes suivantes.

## Connexe

- [Gestion des secrets](/fr/gateway/secrets)
- [Stockage d’authentification](/fr/concepts/oauth)
