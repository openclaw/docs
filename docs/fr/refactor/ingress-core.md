---
read_when:
    - Audit des raisons pour lesquelles la refactorisation de l’entrée du canal a ajouté trop de code
    - Déplacement des politiques de route, de commande, d’événement, d’activation ou de groupe d’accès des Plugins intégrés vers le noyau
    - Vérification de la suppression effective du code de Plugin groupé par un utilitaire d’ingress de canal
sidebarTitle: Ingress core deletion
summary: Plan axé sur la suppression pour déplacer dans le cœur le code de liaison répété pour l’entrée des canaux.
title: Plan de suppression du cœur d’entrée
x-i18n:
    generated_at: "2026-05-12T00:59:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1fdf1e7c9636d02c48c4b5d2b4a51470317dd64e2270c7fae779777c0d787afc
    source_path: refactor/ingress-core.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# Plan de suppression du cœur d’ingress

La refactorisation de l’ingress n’est pas saine si elle ajoute des milliers de lignes nettes. La centralisation dans le cœur ne compte que lorsque le code de production des Plugins intégrés diminue et que l’ancienne compatibilité SDK tierce est confinée aux shims SDK/cœur.

Forme d’exécution souhaitée :

```text
bundled plugin event
  -> extract platform facts locally
  -> resolve shared ingress once when facts are available
  -> branch on generic ingress projections/outcomes
  -> perform platform side effects locally

old third-party helper
  -> SDK compatibility shim
  -> shared ingress-compatible projection where possible
  -> old return shape preserved
```

Les Plugins intégrés ne doivent pas retraduire l’ingress en formes locales `AccessResult`, `GroupAccessDecision`, `CommandAuthDecision`, `DmCommandAccess` ou `{ allowed, reasonCode }`, sauf si ce type fait partie de l’API publique des Plugins.

## Budget

Mesuré par rapport au merge-base de la PR avec `origin/main`, fichiers non suivis inclus.

```text
merge-base            1671e7532adb

current:
core production       +3,922 / -546    = +3,376
docs                  +601 / -17       = +584
other                 +145 / -2        = +143
plugin production     +4,148 / -5,388  = -1,240
tests                 +2,326 / -2,414  = -88
total                 +11,142 / -8,367 = +2,775

required:
plugin production     <= -1,500
core production       <= +1,500, or paid for by larger plugin deletion
tests                 <= +1,000
total                 <= +2,000

stretch:
plugin production     <= -2,500
core production       <= +1,200
total                 <= 0
```

Nettoyage minimal restant :

```text
plugin production     needs 260 more net deleted lines
total                 needs 775 more net deleted lines
core production       still +1,876 over standalone budget, unless paid down by plugin deletion
```

La suppression de commentaires seule ne compte pas comme nettoyage. Le passage budgétaire précédent était trop généreux, car il incluait des commentaires explicatifs QQBot restaurés ; ce document suit uniquement les déplacements de code exécutable, de documentation et de tests.

Remesurer après chaque vague de nettoyage :

```sh
base=$(git merge-base HEAD origin/main)
git diff --shortstat "$base"
git diff --numstat "$base" -- src/channels/message-access src/plugin-sdk extensions | sort -nr -k1 | head -n 80
pnpm lint:extensions:no-deprecated-channel-access
```

## Diagnostic

Le premier passage a ajouté le noyau d’ingress partagé, puis a laissé trop d’autorisation locale aux Plugins à côté de celui-ci :

```text
platform facts
  -> shared ingress state and decision
  -> plugin-local DTO or legacy projection
  -> plugin-local if/else ladder
```

Cela duplique le modèle. La production du cœur a augmenté d’environ 3 376 lignes, tandis que la production des Plugins intégrés a diminué de 1 240 lignes. C’est mieux que le premier passage, mais ce n’est pas dans le budget minimal. Le correctif reste axé sur la suppression :

- supprimer les DTO de Plugins qui ne font que renommer des champs d’ingress
- supprimer les tests qui ne vérifient que la forme des wrappers
- ajouter des helpers cœur uniquement lorsque le même patch supprime du code de Plugins intégrés
- garder l’ancienne compatibilité SDK uniquement dans les shims SDK/cœur
- recompacter le cœur une fois que la suppression des wrappers révèle la forme stable

## Points chauds

Fichiers de production intégrés positifs qui doivent encore diminuer :

```text
extensions/telegram/src/ingress.ts                        +126
extensions/discord/src/monitor/dm-command-auth.ts         +101
extensions/signal/src/monitor/access-policy.ts             +92
extensions/feishu/src/policy.ts                            +85
extensions/slack/src/monitor/auth.ts                       +64
extensions/googlechat/src/monitor-access.ts                +59
extensions/nextcloud-talk/src/inbound.ts                   +51
extensions/matrix/src/matrix/monitor/access-state.ts       +49
extensions/irc/src/inbound.ts                              +44
extensions/imessage/src/monitor/inbound-processing.ts      +36
extensions/qa-channel/src/inbound.ts                       +34
extensions/qqbot/src/bridge/sdk-adapter.ts                 +33
extensions/tlon/src/monitor/utils.ts                       +30
extensions/twitch/src/access-control.ts                    +22
extensions/qqbot/src/engine/commands/slash-command-handler.ts +20
extensions/telegram/src/bot-handlers.runtime.ts            +19
```

La branche n’est pas encore dans le budget minimal. Le travail restant pertinent pour la revue doit supprimer le flux d’autorisation répété, l’échafaudage de tours ou les tests de wrappers avant d’ajouter une autre abstraction cœur.

## Lecture actuelle du code

Le seam cœur sain existe déjà dans `src/channels/message-access/runtime.ts` : il possède les adaptateurs d’identité, les allowlists effectives, les lectures du store d’appariement, les descripteurs de route, les préréglages de commande/événement, les groupes d’accès et la projection finale résolue `ResolvedChannelMessageIngress`.

La croissance restante correspond surtout à la glue des Plugins superposée à ce seam :

- `extensions/telegram/src/ingress.ts` encapsule les décisions du cœur dans des helpers de commande/événement propres à Telegram, puis les sites d’appel passent encore des allowlists normalisées et des listes de propriétaires précalculées.
- `extensions/discord/src/monitor/dm-command-auth.ts`, `extensions/feishu/src/policy.ts`, `extensions/googlechat/src/monitor-access.ts` et `extensions/matrix/src/matrix/monitor/access-state.ts` conservent encore des DTO de stratégie locaux ou des noms de décision hérités à côté de l’ingress.
- `extensions/signal/src/monitor/access-policy.ts` garde correctement la normalisation d’identité Signal et les réponses d’appariement localement, mais possède encore un seam de wrapper qui devrait se replier vers une consommation directe de l’ingress.
- `extensions/nextcloud-talk/src/inbound.ts`, `extensions/irc/src/inbound.ts`, `extensions/qa-channel/src/inbound.ts`, `extensions/zalo/src/monitor.ts` et `extensions/zalouser/src/monitor.ts` répètent encore l’assemblage route/enveloppe/tour, qui peut être déplacé vers des helpers de tour partagés en dehors du noyau d’ingress.

Conclusion : déplacer davantage de code dans le cœur n’est utile que si cela supprime ces couches de wrappers de Plugins dans le même patch. Ajouter une autre abstraction tout en laissant les retours de wrappers en place répète l’erreur.

## Frontière

Le cœur possède la stratégie générique :

- normalisation et correspondance des allowlists
- expansion des groupes d’accès et diagnostics
- lectures d’allowlist DM dans le store d’appariement
- portes de route, expéditeur, commande, événement et activation
- mappage d’admission : dispatch, drop, skip, observe, pairing
- état expurgé, décisions, diagnostics et projections de compatibilité SDK
- descripteurs génériques réutilisables pour l’identité, la route, la commande, l’événement, l’activation et les résultats

Les Plugins possèdent les faits de transport et les effets de bord :

- authenticité du webhook/socket/requête
- extraction d’identité de plateforme et recherches API
- valeurs par défaut de stratégie propres au canal
- livraison des défis d’appariement, réponses, accusés de réception, réactions, saisie, médias, historique, configuration, doctor, statut, journaux et texte visible par l’utilisateur

Le cœur doit rester indépendant des canaux : pas de valeur par défaut propre à Discord, Slack, Telegram, Matrix, salle, guilde, espace, client API ou Plugin dans `src/channels/message-access`.

## Règle d’acceptation

Chaque nouveau helper cœur doit supprimer immédiatement du code de production de Plugins intégrés.

```text
one bundled caller        reject; keep plugin-local
two bundled callers       accept only if plugin production LOC drops
three or more callers     plugin deletion must be at least 2x new core LOC
compatibility-only helper SDK/core shim only; never bundled hot paths
```

Arrêter et reconcevoir si :

- les LOC de production des Plugins augmentent
- les tests croissent plus vite que la production ne diminue
- un chemin chaud intégré retourne un DTO qui ne fait que renommer `ResolvedChannelMessageIngress`
- un helper cœur a besoin d’un identifiant de canal, d’un objet de plateforme, d’un client API ou d’une valeur par défaut propre au canal

## Lots de travail

1. Geler le budget.
   Mettre les LOC dans la PR, garder le lint d’ingress obsolète au vert et inclure les LOC avant/après dans les commits de nettoyage.

2. Supprimer les seams DTO minces.
   Remplacer les retours de wrappers locaux aux Plugins par `ResolvedChannelMessageIngress`, `senderAccess`, `commandAccess`, `routeAccess` ou `ingress` directement. Commencer par QQBot, Telegram, Slack, Discord, Signal, Feishu, Matrix, iMessage et Tlon. Supprimer les tests de forme de wrapper ; garder les tests de comportement.

3. Ajouter la classification des résultats uniquement avec des suppressions.
   Un classificateur générique peut exposer `dispatch`, `pairing-required`, `skip-activation`, `drop-command`, `drop-route`, `drop-sender` et `drop-ingress`. Il doit dériver du graphe de décision, pas des chaînes de raison, et migrer au moins trois Plugins dans le même patch.

4. Ajouter des builders de descripteurs de route uniquement avec des suppressions.
   Les helpers génériques de cible de route et d’expéditeur de route sont acceptables uniquement s’ils réduisent immédiatement les Plugins lourds en routes : Google Chat, IRC, Microsoft Teams, Nextcloud Talk, Mattermost, Slack, Zalo et Zalo Personal.

5. Ajouter des préréglages commande/événement uniquement avec des suppressions.
   Centraliser les formes text-command, native-command, callback et origin-subject. Les consommateurs de commandes doivent utiliser par défaut non autorisé lorsqu’aucune porte de commande n’a été exécutée ; les événements ne doivent pas lancer d’appariement.

6. Ajouter des préréglages d’identité uniquement lorsqu’ils retirent du boilerplate.
   Les helpers d’identifiant stable, d’identifiant stable plus alias, de téléphone/e164 et de multi-identifiant sont autorisés lorsque les valeurs brutes n’entrent que dans l’entrée de l’adaptateur et que l’état expurgé conserve des identifiants/nombres opaques.

7. Partager l’assemblage des tours autorisés.
   En dehors du noyau d’ingress, supprimer l’échafaudage répété route/session/enveloppe/réponse de QA Channel, IRC, Nextcloud Talk, Zalo et Zalo Personal. Le cœur peut posséder le séquencement route/session/enveloppe/dispatch ; les Plugins gardent la livraison et le contexte propre au canal.

8. Confiner la compatibilité.
   Les helpers SDK obsolètes restent compatibles au niveau source, mais les chemins chauds intégrés ne doivent pas importer les façades d’ingress ou de command-auth obsolètes. Les tests de compatibilité doivent utiliser de faux Plugins tiers, pas les internes des Plugins intégrés.

9. Recompacter le cœur.
   Après la suppression des wrappers, replier les modules à usage unique, supprimer les exports inutilisés, déplacer la projection de compatibilité hors des chemins chauds et garder des tests ciblés pour l’identité, la route, la commande/événement, l’activation, les groupes d’accès et les shims de compatibilité.

## Vagues de suppression

Les exécuter dans l’ordre. Chaque vague doit réduire les LOC de production intégrée.

1. Repli des wrappers, delta attendu côté Plugins : -400 à -600.
   Remplacer les types de résultat locaux aux Plugins `resolveXAccess`, `resolveXCommandAccess` et `accessFromIngress` par des lectures directes de `ResolvedChannelMessageIngress`. Premières cibles : autorisation des commandes DM Discord, stratégie Feishu, état d’accès Matrix, ingress Telegram, stratégie d’accès Signal, adaptateur SDK QQBot.

2. Helpers de résultats partagés, delta attendu côté Plugins : -200 à -350.
   Ajouter un seul classificateur générique uniquement s’il supprime les échelles répétées `shouldBlockControlCommand`, pairing, activation skip, route block et sender block dans au moins trois Plugins.

3. Builders de descripteurs de route, delta attendu côté Plugins : -200 à -350.
   Déplacer l’assemblage répété des descripteurs de cible de route et d’expéditeur de route dans des helpers cœur. Premières cibles : Google Chat, IRC, Microsoft Teams, Nextcloud Talk, Mattermost, Slack, Zalo, Zalo Personal.

4. Partage de l’assemblage de tours, delta attendu côté Plugins : -250 à -450.
   Utiliser un séquencement commun route/session/enveloppe/dispatch pour les Plugins entrants simples. Premières cibles : QA Channel, IRC, Nextcloud Talk, Zalo, Zalo Personal.

5. Recompactage du cœur, delta attendu côté cœur : -300 à -700.
   Après que les Plugins consomment directement les projections d’exécution, supprimer les modules à usage unique, fusionner les petits fichiers dans `runtime.ts` ou des fichiers frères ciblés, et garder les fichiers de compatibilité SDK séparés des chemins chauds intégrés.

6. Élagage des tests, delta attendu côté tests : -300 à -600.
   Supprimer les tests qui ne vérifient que les formes de wrappers supprimées. Garder les tests de comportement pour le refus de commande, le fallback de groupe, la correspondance origin-subject, l’activation skip, les groupes d’accès, l’appariement et l’expurgation.

Forme minimale attendue à l’atterrissage après ces vagues :

```text
plugin production     <= -1,500
core production       about +1,800 to +2,200 before final repack
tests                 <= +500
total                 <= +2,000
```

## Ne pas déplacer

Ne déplacez pas les valeurs par défaut de configuration de plateforme, l’UX de configuration, le texte de doctor/fix, les recherches API,
les contrôles de présence du propriétaire Slack, la gestion des alias/de la vérification Matrix, l’analyse des callbacks Telegram,
l’analyse de la syntaxe des commandes, l’enregistrement des commandes natives, l’analyse des payloads de réaction, les réponses d’appairage, les réponses aux commandes, les accusés de réception, l’indication de saisie, les médias, l’historique
ou les journaux.

## Vérification

Boucle locale ciblée :

```sh
pnpm lint:extensions:no-deprecated-channel-access
pnpm test src/channels/message-access/message-access.test.ts src/plugin-sdk/channel-ingress-runtime.test.ts src/plugin-sdk/access-groups.test.ts
pnpm test extensions/<changed-plugin>/src/...
pnpm plugin-sdk:api:check
pnpm config:docs:check
pnpm check:docs
git diff --check
```

Utilisez Testbox pour les gates de changements larges/la preuve de suite complète une fois que la tendance LOC est
dans le budget.

Chaque lot de travail consigne :

- LOC avant/après par catégorie
- wrappers de Plugin supprimés
- nouveaux LOC d’assistant core, le cas échéant
- tests ciblés exécutés
- liste restante des points sensibles

## Critères De Sortie

- les imports de production groupés n’utilisent aucune façade obsolète d’accès aux canaux ou d’authentification des commandes
- le code de compatibilité est isolé aux coutures SDK/core
- les plugins groupés consomment directement les projections d’ingress ou les résultats génériques
- les LOC de production des plugins sont négatifs d’au moins 1 500 en net par rapport à `origin/main`
- les LOC de production core sont `<= +1,500`, ou tout excédent est compensé tout en maintenant le total
  à `<= +2,000`
- des tests représentatifs couvrent la rédaction, la route, les commandes/événements, l’activation,
  les groupes d’accès et le comportement de repli propre au canal
