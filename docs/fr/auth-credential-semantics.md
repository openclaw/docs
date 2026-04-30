---
read_when:
    - Travail sur la résolution des profils d’authentification ou le routage des identifiants
    - Débogage des échecs d’authentification du modèle ou de l’ordre des profils
summary: Sémantique canonique d’éligibilité et de résolution des identifiants pour les profils d’authentification
title: Sémantique des identifiants d’authentification
x-i18n:
    generated_at: "2026-04-30T07:11:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0525a71d3f08b7aa95e2f06acc6c23d87cd92d6b5fe4fc050ecf2b7caff84b3f
    source_path: auth-credential-semantics.md
    workflow: 16
---

Ce document définit les sémantiques canoniques d’éligibilité et de résolution des identifiants utilisées dans :

- `resolveAuthProfileOrder`
- `resolveApiKeyForProfile`
- `models status --probe`
- `doctor-auth`

L’objectif est de maintenir alignés les comportements au moment de la sélection et à l’exécution.

## Codes de motif stables de la vérification

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
3. Si `expires` est présent, ce doit être un nombre fini supérieur à `0`.
4. Si `expires` est invalide (`NaN`, `0`, négatif, non fini ou de type incorrect), le profil est inéligible avec `invalid_expires`.
5. Si `expires` est dans le passé, le profil est inéligible avec `expired`.
6. `tokenRef` ne contourne pas la validation de `expires`.

### Règles de résolution

1. Les sémantiques du résolveur correspondent aux sémantiques d’éligibilité pour `expires`.
2. Pour les profils éligibles, le contenu du jeton peut être résolu depuis une valeur en ligne ou `tokenRef`.
3. Les références impossibles à résoudre produisent `unresolved_ref` dans la sortie de `models status --probe`.

## Portabilité de la copie d’agent

L’héritage d’authentification des agents est en lecture traversante. Lorsqu’un agent n’a pas de profil local, il
peut résoudre les profils depuis le magasin de l’agent par défaut/principal à l’exécution sans
copier de contenu secret dans son propre `auth-profiles.json`.

Les flux de copie explicites, comme `openclaw agents add`, utilisent cette politique de portabilité :

- Les profils `api_key` sont portables sauf si `copyToAgents: false`.
- Les profils `token` sont portables sauf si `copyToAgents: false`.
- Les profils `oauth` ne sont pas portables par défaut, car les jetons de rafraîchissement peuvent être
  à usage unique ou sensibles à la rotation.
- Les flux OAuth possédés par un fournisseur peuvent s’y inscrire avec `copyToAgents: true` uniquement lorsque
  la copie du contenu de rafraîchissement entre agents est connue comme sûre.

Les profils non portables restent disponibles via l’héritage en lecture traversante sauf si
l’agent cible se connecte séparément et crée son propre profil local.

## Filtrage explicite de l’ordre d’authentification

- Lorsque `auth.order.<provider>` ou la substitution d’ordre du magasin d’authentification est défini pour un
  fournisseur, `models status --probe` ne vérifie que les identifiants de profil qui restent dans
  l’ordre d’authentification résolu pour ce fournisseur.
- Un profil stocké pour ce fournisseur qui est omis de l’ordre explicite n’est
  pas essayé silencieusement plus tard. La sortie de vérification le signale avec
  `reasonCode: excluded_by_auth_order` et le détail
  `Excluded by auth.order for this provider.`

## Résolution des cibles de vérification

- Les cibles de vérification peuvent provenir des profils d’authentification, des identifiants d’environnement ou de
  `models.json`.
- Si un fournisseur dispose d’identifiants mais qu’OpenClaw ne peut pas résoudre de candidat de modèle
  vérifiable pour lui, `models status --probe` signale `status: no_model` avec
  `reasonCode: no_model`.

## Découverte des identifiants de CLI externe

- Les identifiants uniquement à l’exécution possédés par des CLI externes sont découverts uniquement lorsque le
  fournisseur, l’environnement d’exécution ou le profil d’authentification est dans le périmètre de l’opération en cours, ou
  lorsqu’un profil local stocké pour cette source externe existe déjà.
- Les chemins en lecture seule/d’état transmettent `allowKeychainPrompt: false` ; ils utilisent uniquement les
  identifiants de CLI externe adossés à des fichiers et ne lisent ni ne réutilisent les résultats du trousseau macOS.

## Garde de politique SecretRef OAuth

- L’entrée SecretRef est réservée aux identifiants statiques.
- Si l’identifiant d’un profil est `type: "oauth"`, les objets SecretRef ne sont pas pris en charge pour le contenu d’identifiant de ce profil.
- Si `auth.profiles.<id>.mode` vaut `"oauth"`, l’entrée `keyRef`/`tokenRef` adossée à SecretRef pour ce profil est rejetée.
- Les violations sont des échecs bloquants dans les chemins de résolution d’authentification au démarrage/rechargement.

## Messages compatibles avec l’héritage

Pour la compatibilité des scripts, les erreurs de vérification conservent cette première ligne inchangée :

`Auth profile credentials are missing or expired.`

Des détails lisibles par les humains et des codes de motif stables peuvent être ajoutés sur les lignes suivantes.

## Connexe

- [Gestion des secrets](/fr/gateway/secrets)
- [Stockage de l’authentification](/fr/concepts/oauth)
