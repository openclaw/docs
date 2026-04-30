---
read_when:
    - Travailler sur la résolution des profils d’authentification ou le routage des identifiants
    - Débogage des échecs d’authentification du modèle ou de l’ordre des profils
summary: Sémantique canonique d’éligibilité et de résolution des identifiants pour les profils d’authentification
title: Sémantique des identifiants d’authentification
x-i18n:
    generated_at: "2026-04-30T21:02:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 39b9f96159d5a7b793983d07c37a73139a0904abbbc8831267807d6acf5c0037
    source_path: auth-credential-semantics.md
    workflow: 16
---

Ce document définit la sémantique canonique d’éligibilité et de résolution des identifiants utilisée dans :

- `resolveAuthProfileOrder`
- `resolveApiKeyForProfile`
- `models status --probe`
- `doctor-auth`

L’objectif est d’aligner le comportement au moment de la sélection et à l’exécution.

## Codes de motif de vérification stables

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

1. Un profil de jeton n’est pas éligible lorsque `token` et `tokenRef` sont tous deux absents.
2. `expires` est facultatif.
3. Si `expires` est présent, il doit être un nombre fini supérieur à `0`.
4. Si `expires` est invalide (`NaN`, `0`, négatif, non fini ou de type incorrect), le profil n’est pas éligible avec `invalid_expires`.
5. Si `expires` est dans le passé, le profil n’est pas éligible avec `expired`.
6. `tokenRef` ne contourne pas la validation de `expires`.

### Règles de résolution

1. La sémantique du résolveur correspond à la sémantique d’éligibilité pour `expires`.
2. Pour les profils éligibles, le contenu du jeton peut être résolu depuis une valeur en ligne ou `tokenRef`.
3. Les références non résolubles produisent `unresolved_ref` dans la sortie de `models status --probe`.

## Portabilité de la copie d’agent

L’héritage d’authentification d’agent est en lecture traversante. Lorsqu’un agent n’a aucun profil local, il peut résoudre les profils depuis le magasin d’agents par défaut/principal à l’exécution sans copier le contenu secret dans son propre `auth-profiles.json`.

Les flux de copie explicites, comme `openclaw agents add`, utilisent cette politique de portabilité :

- Les profils `api_key` sont portables sauf si `copyToAgents: false`.
- Les profils `token` sont portables sauf si `copyToAgents: false`.
- Les profils `oauth` ne sont pas portables par défaut, car les jetons d’actualisation peuvent être à usage unique ou sensibles à la rotation.
- Les flux OAuth détenus par le fournisseur peuvent s’inscrire avec `copyToAgents: true` uniquement lorsqu’il est établi que la copie du contenu d’actualisation entre agents est sûre.

Les profils non portables restent disponibles par héritage en lecture traversante, sauf si l’agent cible se connecte séparément et crée son propre profil local.

## Filtrage explicite de l’ordre d’authentification

- Lorsque `auth.order.<provider>` ou le remplacement de l’ordre du magasin d’authentification est défini pour un fournisseur, `models status --probe` vérifie uniquement les identifiants de profil qui restent dans l’ordre d’authentification résolu pour ce fournisseur.
- Un profil stocké pour ce fournisseur qui est omis de l’ordre explicite n’est pas essayé silencieusement plus tard. La sortie de vérification le signale avec `reasonCode: excluded_by_auth_order` et le détail `Excluded by auth.order for this provider.`

## Résolution de la cible de vérification

- Les cibles de vérification peuvent provenir de profils d’authentification, d’identifiants d’environnement ou de `models.json`.
- Si un fournisseur dispose d’identifiants mais qu’OpenClaw ne peut pas résoudre pour lui un modèle candidat vérifiable, `models status --probe` signale `status: no_model` avec `reasonCode: no_model`.

## Découverte des identifiants de CLI externe

- Les identifiants d’exécution uniquement détenus par des CLI externes sont découverts uniquement lorsque le fournisseur, l’exécution ou le profil d’authentification est dans le périmètre de l’opération actuelle, ou lorsqu’un profil local stocké existe déjà pour cette source externe.
- Les appelants du magasin d’authentification doivent choisir un mode explicite de découverte de CLI externe : `none` pour l’authentification persistée/Plugin uniquement, `existing` pour actualiser les profils de CLI externe déjà stockés, ou `scoped` pour un ensemble concret de fournisseurs/profils.
- Les chemins en lecture seule/de statut passent `allowKeychainPrompt: false` ; ils utilisent uniquement les identifiants de CLI externe adossés à des fichiers et ne lisent ni ne réutilisent les résultats du trousseau macOS.

## Garde de politique OAuth SecretRef

- L’entrée SecretRef est réservée aux identifiants statiques.
- Si un identifiant de profil est `type: "oauth"`, les objets SecretRef ne sont pas pris en charge pour le contenu d’identifiant de ce profil.
- Si `auth.profiles.<id>.mode` vaut `"oauth"`, l’entrée `keyRef`/`tokenRef` adossée à SecretRef pour ce profil est rejetée.
- Les violations sont des échecs bloquants dans les chemins de résolution d’authentification au démarrage/rechargement.

## Messagerie compatible avec l’héritage

Pour la compatibilité des scripts, les erreurs de vérification conservent cette première ligne inchangée :

`Auth profile credentials are missing or expired.`

Des détails lisibles par l’humain et des codes de motif stables peuvent être ajoutés sur les lignes suivantes.

## Associés

- [Gestion des secrets](/fr/gateway/secrets)
- [Stockage de l’authentification](/fr/concepts/oauth)
