---
read_when:
    - Audit des raisons pour lesquelles la refactorisation de l’entrée des canaux a ajouté trop de code
    - Déplacement des politiques de routage, de commande, d’événement, d’activation ou de groupe d’accès depuis les plugins intégrés vers le noyau
    - Vérifier si un utilitaire d’entrée de canal supprime réellement le code du plugin intégré
sidebarTitle: Ingress core deletion
summary: Plan orienté suppression pour déplacer dans le cœur le code de liaison répété d’entrée des canaux.
title: Plan de suppression du noyau d’entrée
x-i18n:
    generated_at: "2026-05-11T20:54:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 71afcf5d4f58c57ecfe7b388325279700a723ec1fcd926f644095106b662c3d0
    source_path: refactor/ingress-core.md
    workflow: 16
---

# Plan de suppression du noyau d’entrée

La refonte de l’entrée n’est pas saine tant qu’elle ajoute des milliers de lignes nettes. La centralisation dans le noyau ne compte que lorsque le code de production des plugins groupés diminue et que l’ancienne compatibilité du SDK tiers est confinée aux adaptateurs SDK/noyau.

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

Les plugins groupés ne doivent pas retraduire l’entrée en formes locales `AccessResult`, `GroupAccessDecision`, `CommandAuthDecision`, `DmCommandAccess` ou `{ allowed, reasonCode }`, sauf si ce type fait partie de l’API publique du plugin.

## Budget

Mesuré par rapport à la base de fusion de la PR avec `origin/main`, fichiers non suivis inclus.

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

La suppression de commentaires seuls ne compte pas comme nettoyage. Le passage de budget précédent était trop généreux, car il incluait des commentaires explicatifs QQBot restaurés ; ce document suit uniquement les déplacements de code exécutable, de documentation et de tests.

Remesurer après chaque vague de nettoyage :

```sh
base=$(git merge-base HEAD origin/main)
git diff --shortstat "$base"
git diff --numstat "$base" -- src/channels/message-access src/plugin-sdk extensions | sort -nr -k1 | head -n 80
pnpm lint:extensions:no-deprecated-channel-access
```

## Diagnostic

La première passe a ajouté le noyau d’entrée partagé, puis a laissé trop d’autorisation locale aux plugins à côté :

```text
platform facts
  -> shared ingress state and decision
  -> plugin-local DTO or legacy projection
  -> plugin-local if/else ladder
```

Cela duplique le modèle. Le code de production du noyau a augmenté d’environ 3 376 lignes, tandis que le code de production des plugins groupés a diminué de 1 240 lignes. C’est mieux que la première passe, mais ce n’est pas dans le budget minimal. Le correctif reste axé d’abord sur la suppression :

- supprimer les DTO de plugin qui ne font que renommer des champs d’entrée
- supprimer les tests qui ne vérifient que la forme de l’enveloppe
- ajouter des assistants noyau uniquement lorsque le même patch supprime du code de plugin groupé
- garder l’ancienne compatibilité SDK uniquement dans les adaptateurs SDK/noyau
- reconditionner le noyau une fois que la suppression des enveloppes expose la forme stable

## Points chauds

Fichiers de production groupés positifs qui doivent encore diminuer :

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

La branche n’est pas encore dans le budget minimal. Le travail restant pertinent pour la revue doit supprimer le flux d’autorisation répété, l’échafaudage de tour ou les tests d’enveloppe avant d’ajouter une autre abstraction noyau.

## Lecture actuelle du code

La jonction noyau saine existe déjà dans `src/channels/message-access/runtime.ts` : elle possède les adaptateurs d’identité, les listes d’autorisation effectives, les lectures du magasin d’appairage, les descripteurs de route, les préréglages de commandes/événements, les groupes d’accès et la projection finale résolue `ResolvedChannelMessageIngress`.

La croissance restante est surtout de la glue de plugin superposée à cette jonction :

- `extensions/telegram/src/ingress.ts` enveloppe les décisions noyau dans des assistants de commandes/événements propres à Telegram, puis les sites d’appel transmettent encore des listes d’autorisation normalisées et des listes de propriétaires précalculées.
- `extensions/discord/src/monitor/dm-command-auth.ts`, `extensions/feishu/src/policy.ts`, `extensions/googlechat/src/monitor-access.ts` et `extensions/matrix/src/matrix/monitor/access-state.ts` conservent encore des DTO de politique locaux ou des noms de décision historiques à côté de l’entrée.
- `extensions/signal/src/monitor/access-policy.ts` garde correctement la normalisation d’identité Signal et les réponses d’appairage locales, mais possède encore une jonction d’enveloppe qui doit se réduire à une consommation directe de l’entrée.
- `extensions/nextcloud-talk/src/inbound.ts`, `extensions/irc/src/inbound.ts`, `extensions/qa-channel/src/inbound.ts`, `extensions/zalo/src/monitor.ts` et `extensions/zalouser/src/monitor.ts` répètent encore l’assemblage route/enveloppe/tour qui peut être déplacé vers des assistants de tour partagés hors du noyau d’entrée.

Conclusion : déplacer davantage de code dans le noyau n’est utile que si cela supprime ces couches d’enveloppe de plugin dans le même patch. Ajouter une autre abstraction tout en laissant les retours d’enveloppe en place répète l’erreur.

## Frontière

Le noyau possède la politique générique :

- normalisation et correspondance des listes d’autorisation
- expansion des groupes d’accès et diagnostics
- lectures des listes d’autorisation DM du magasin d’appairage
- portes de route, d’expéditeur, de commande, d’événement et d’activation
- mappage d’admission : dispatch, drop, skip, observe, pairing
- état masqué, décisions, diagnostics et projections de compatibilité SDK
- descripteurs génériques réutilisables pour l’identité, la route, la commande, l’événement, l’activation et les résultats

Les plugins possèdent les faits de transport et les effets de bord :

- authenticité webhook/socket/requête
- extraction d’identité de plateforme et recherches API
- valeurs par défaut de politique propres au canal
- envoi des défis d’appairage, réponses, accusés de réception, réactions, saisie, médias, historique, configuration, doctor, statut, journaux et texte visible par l’utilisateur

Le noyau doit rester agnostique au canal : aucun Discord, Slack, Telegram, Matrix, salle, guilde, espace, client API ni valeur par défaut propre à un plugin dans `src/channels/message-access`.

## Règle d’acceptation

Chaque nouvel assistant noyau doit supprimer immédiatement du code de production de plugin groupé.

```text
one bundled caller        reject; keep plugin-local
two bundled callers       accept only if plugin production LOC drops
three or more callers     plugin deletion must be at least 2x new core LOC
compatibility-only helper SDK/core shim only; never bundled hot paths
```

Arrêter et reconcevoir si :

- le nombre de lignes de production des plugins augmente
- les tests croissent plus vite que la production ne diminue
- un chemin critique groupé renvoie un DTO qui ne fait que renommer `ResolvedChannelMessageIngress`
- un assistant noyau a besoin d’un identifiant de canal, d’un objet de plateforme, d’un client API ou d’une valeur par défaut propre au canal

## Lots de travail

1. Geler le budget.
   Mettre les LOC dans la PR, garder le lint d’entrée obsolète au vert et inclure les LOC avant/après dans les commits de nettoyage.

2. Supprimer les jonctions DTO minces.
   Remplacer les retours d’enveloppe locaux aux plugins par `ResolvedChannelMessageIngress`, `senderAccess`, `commandAccess`, `routeAccess` ou `ingress` directement. Commencer par QQBot, Telegram, Slack, Discord, Signal, Feishu, Matrix, iMessage et Tlon. Supprimer les tests de forme d’enveloppe ; garder les tests de comportement.

3. Ajouter la classification des résultats uniquement avec des suppressions.
   Un classifieur générique peut exposer `dispatch`, `pairing-required`, `skip-activation`, `drop-command`, `drop-route`, `drop-sender` et `drop-ingress`. Il doit dériver du graphe de décision, pas des chaînes de raison, et migrer au moins trois plugins dans le même patch.

4. Ajouter des constructeurs de descripteurs de route uniquement avec des suppressions.
   Les assistants génériques de cible de route et d’expéditeur de route ne sont acceptables que s’ils réduisent immédiatement les plugins lourds en routes : Google Chat, IRC, Microsoft Teams, Nextcloud Talk, Mattermost, Slack, Zalo et Zalo Personal.

5. Ajouter des préréglages de commande/événement uniquement avec des suppressions.
   Centraliser les formes de commande texte, commande native, rappel et sujet d’origine. Les consommateurs de commandes doivent être non autorisés par défaut lorsqu’aucune porte de commande n’a été exécutée ; les événements ne doivent pas démarrer l’appairage.

6. Ajouter des préréglages d’identité uniquement lorsqu’ils suppriment du code standard.
   Les assistants d’identifiant stable, d’identifiant stable plus alias, de téléphone/e164 et d’identifiants multiples sont autorisés lorsque les valeurs brutes n’entrent que dans l’entrée de l’adaptateur et que l’état masqué conserve des identifiants/nombres opaques.

7. Partager l’assemblage de tour autorisé.
   Hors du noyau d’entrée, supprimer l’échafaudage répété route/session/enveloppe/contexte/réponse de QA Channel, IRC, Nextcloud Talk, Zalo et Zalo Personal. Le noyau peut posséder le séquencement route/session/enveloppe/dispatch ; les plugins gardent la livraison et le contexte propre au canal.

8. Confiner la compatibilité.
   Les assistants SDK obsolètes restent compatibles au niveau source, mais les chemins critiques groupés ne doivent pas importer les façades d’entrée ou d’authentification de commande obsolètes. Les tests de compatibilité doivent utiliser de faux plugins tiers, pas les internes des plugins groupés.

9. Reconditionner le noyau.
   Après la suppression des enveloppes, fusionner les modules à usage unique, supprimer les exports inutilisés, déplacer la projection de compatibilité hors des chemins critiques et conserver des tests ciblés pour l’identité, la route, la commande/événement, l’activation, les groupes d’accès et les adaptateurs de compatibilité.

## Vagues de suppression

Les exécuter dans l’ordre. Chaque vague doit réduire les LOC de production groupée.

1. Réduction des enveloppes, delta plugin attendu : -400 à -600.
   Remplacer les types de résultat locaux aux plugins `resolveXAccess`, `resolveXCommandAccess` et `accessFromIngress` par des lectures directes depuis `ResolvedChannelMessageIngress`. Premières cibles : auth de commande DM Discord, politique Feishu, état d’accès Matrix, entrée Telegram, politique d’accès Signal, adaptateur SDK QQBot.

2. Assistants de résultats partagés, delta plugin attendu : -200 à -350.
   Ajouter un classifieur générique seulement s’il supprime les échelles répétées `shouldBlockControlCommand`, appairage, saut d’activation, blocage de route et blocage d’expéditeur dans au moins trois plugins.

3. Constructeurs de descripteurs de route, delta plugin attendu : -200 à -350.
   Déplacer l’assemblage répété de cible de route et de descripteur d’expéditeur de route dans des assistants noyau. Premières cibles : Google Chat, IRC, Microsoft Teams, Nextcloud Talk, Mattermost, Slack, Zalo, Zalo Personal.

4. Partage d’assemblage de tour, delta plugin attendu : -250 à -450.
   Utiliser un séquencement commun route/session/enveloppe/dispatch pour les plugins entrants simples. Premières cibles : QA Channel, IRC, Nextcloud Talk, Zalo, Zalo Personal.

5. Reconditionnement du noyau, delta noyau attendu : -300 à -700.
   Une fois que les plugins consomment directement les projections d’exécution, supprimer les modules à usage unique, refusionner les petits fichiers dans `runtime.ts` ou des fichiers frères ciblés, et garder les fichiers de compatibilité SDK séparés des chemins critiques groupés.

6. Élagage des tests, delta test attendu : -300 à -600.
   Supprimer les tests qui ne vérifient que les formes d’enveloppe supprimées. Garder les tests de comportement pour le refus de commande, le repli de groupe, la correspondance sujet d’origine, le saut d’activation, les groupes d’accès, l’appairage et le masquage.

Forme d’atterrissage minimale attendue après ces vagues :

```text
plugin production     <= -1,500
core production       about +1,800 to +2,200 before final repack
tests                 <= +500
total                 <= +2,000
```

## Ne pas déplacer

Ne déplacez pas les valeurs par défaut de configuration de plateforme, l’UX de configuration, le texte doctor/fix, les recherches API,
les vérifications de présence du propriétaire Slack, la gestion des alias/vérifications Matrix, l’analyse des callbacks Telegram, l’analyse de syntaxe des commandes, l’enregistrement des commandes natives, l’analyse des charges utiles de réaction, les réponses d’association, les réponses de commande, les accusés de réception, la saisie, les médias, l’historique
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

Utilisez Testbox pour les portes de validation larges des changements et la preuve de suite complète une fois que la tendance LOC est
dans le budget.

Chaque lot de travail consigne :

- LOC avant/après par catégorie
- wrappers Plugin supprimés
- nouveaux LOC d’assistants core, le cas échéant
- tests ciblés exécutés
- liste des hotspots restants

## Critères de sortie

- les imports de production groupés n’utilisent aucune façade channel-access ou command-auth obsolète
- le code de compatibilité est isolé dans les coutures SDK/core
- les Plugins groupés consomment directement les projections d’ingress ou les résultats génériques
- les LOC de production des Plugins sont au moins en négatif net de 1 500 par rapport à `origin/main`
- les LOC de production core sont <= +1 500, ou tout dépassement est compensé tant que le total reste
  <= +2 000
- des tests représentatifs couvrent la rédaction, le routage, les commandes/événements, l’activation,
  les access-groups et le comportement de repli propre au canal
