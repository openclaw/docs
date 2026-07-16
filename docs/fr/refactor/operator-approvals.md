---
read_when:
    - Modification du cycle de vie, du stockage, du protocole ou de l’autorisation des approbations d’exécution ou de Plugin
    - Ajout de liens d’approbation ou de contrôles d’approbation natifs à un canal
    - Projection des approbations des sessions enfants dans les vues parentes ou de l’orchestrateur
summary: Conception d’approbations persistantes accessibles par lien profond dans l’interface de contrôle, les applications natives, les canaux et les sessions parentes
title: Approbations des opérateurs sur plusieurs surfaces
x-i18n:
    generated_at: "2026-07-16T13:46:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9defdaada1911df1184f64429e1787c4881e735c433d6dbc30a5946e11cc7cce
    source_path: refactor/operator-approvals.md
    workflow: 16
---

# Approbations des opérateurs sur plusieurs surfaces

Cette conception suit [#103505](https://github.com/openclaw/openclaw/issues/103505). Elle remplace l’autorité d’approbation locale au processus par un cycle de vie unique, détenu par le Gateway et adossé à SQLite. Chaque approbation d’exécution ou de plugin/outil détenue par le Gateway reçoit un identifiant stable, une route Control UI authentifiée, une résolution atomique où la première réponse l’emporte, ainsi que des projections réservées aux opérateurs vers les flux de sa session source et de ses sessions parentes.

Les actions intégrées et les liens profonds coexistent. Il n’existe aucun sélecteur de mode d’approbation.

## Objectifs

- Un objet d’approbation durable unique pour les barrières d’exécution et de plugin/outil.
- Route `${controlUiBasePath}/approve/{approvalId}` stable.
- Résolution depuis toute Control UI autorisée, toute application native autorisée ou toute surface de canal autorisée.
- Comportement atomique où la première réponse l’emporte sur les surfaces concurrentes.
- Nouvelles tentatives identiques idempotentes ; les réponses tardives contradictoires ne peuvent pas écraser la réponse gagnante.
- Les expirations, les verdicts de confiance mal formés, les routes manquantes, les annulations et les redémarrages échouent en mode fermé.
- Les événements de demande et terminaux atteignent la session source ainsi que tous les propriétaires parents/orchestrateurs concernés.
- Les canaux reçoivent des actions typées d’approbation et de navigation ; les données de rappel du transport restent privées au canal.
- Les méthodes Gateway existantes d’exécution et de plugin restent compatibles tandis que leur implémentation converge vers un service unique.

## Non-objectifs

- Persister ou reprendre l’exécution bloquée de l’outil elle-même après un redémarrage du Gateway.
- Faire d’un identifiant ou d’une URL d’approbation un identifiant d’accès de type bearer.
- Ajouter les demandes d’approbation aux transcriptions visibles par le modèle ou réveiller les agents parents.
- Déplacer la politique d’approbation, les commandes du produit ou l’autorisation des réviseurs dans les plugins de canal.
- Cloner l’état d’approbation par canal, appareil ou ancêtre.
- Reconcevoir les listes d’autorisation d’exécution, la composition des politiques de plugin ou la persistance de `allow-always`, sauf lorsque cela est nécessaire pour rendre les résultats terminaux non ambigus.
- Rendre une TUI intégrée sans Gateway accessible à distance dès la première étape. Elle reste locale uniquement et doit échouer en mode fermé lorsqu’aucun réviseur n’existe.

## Référence avant déploiement et carte des preuves

Ce tableau consigne l’état de l’implémentation lors de l’ouverture de #103505. Les sections de déploiement ci-dessous suivent le registre durable, les actions typées, la page de lien profond et les étapes relatives aux clients natifs construites sur cette référence.

| Surface           | Point d’entrée et propriétaire de référence                                                                                                                                  | Comportement de référence et lacune                                                                                                                                                                    |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Exécution de l’agent        | `src/agents/bash-tools.exec-approval-request.ts`, `src/agents/bash-tools.exec-host-shared.ts`                                                                   | L’enregistrement en deux phases de `exec.approval.*` empêche une course précoce de `/approve`, mais l’expiration peut encore se transformer en autorisation par l’intermédiaire de `askFallback`.                                                        |
| Barrière d’outil de plugin  | `src/agents/agent-tools.before-tool-call.ts`                                                                                                                    | Demande `plugin.approval.*` ; `timeoutBehavior: "allow"` peut approuver une barrière expirée. Le mode intégré possède une autorité distincte, locale au processus, dans `src/infra/embedded-plugin-approval-broker.ts`. |
| Barrière de Node de plugin  | `src/gateway/node-invoke-plugin-policy.ts`                                                                                                                      | Crée et diffuse directement par l’intermédiaire du gestionnaire de plugins, ce qui duplique une partie du cycle de vie de la méthode serveur.                                                                                 |
| Autorité du Gateway | `src/gateway/server-aux-handlers.ts`, `src/gateway/exec-approval-manager.ts`, `src/gateway/server-methods/approval-shared.ts`                                   | Des gestionnaires distincts pour l’exécution et les plugins utilisent des tables locales au processus. Les entrées terminales subsistent pendant 15 secondes. La règle selon laquelle la première réponse l’emporte ne s’applique qu’au sein d’un seul processus.                                          |
| Protocole du Gateway  | `packages/gateway-protocol/src/schema/exec-approvals.ts`, `packages/gateway-protocol/src/schema/plugin-approvals.ts`, `src/gateway/methods/core-descriptors.ts` | L’exécution dispose de `get` uniquement pour les éléments en attente ; le plugin ne dispose d’aucun `get` ; aucune consultation terminale indépendante du type n’existe pour un lien profond.                                                                                   |
| Livraison          | `src/infra/exec-approval-channel-runtime.ts`, `src/infra/approval-native-runtime.ts`, `src/infra/approval-handler-runtime.ts`                                   | Prend en charge le routage vers l’origine, les messages privés aux approbateurs, la relecture des éléments en attente, les gestionnaires natifs et le nettoyage terminal en cours de processus. Un suivi distinct ajoute la réconciliation terminale durable.                          |
| Actions portables  | `src/interactive/payload.ts`, `src/plugin-sdk/interactive-runtime.ts`, `src/plugin-sdk/approval-reply-runtime.ts`                                               | Les boutons d’approbation sont des actions de commande contenant `/approve ...` ; les cibles d’URL et d’application Web sont des champs de bouton non typés.                                                                           |
| Telegram          | `extensions/telegram/src/approval-handler.runtime.ts`, `extensions/telegram/src/button-types.ts`                                                                | Le moteur de rendu analyse le texte de la commande afin de reconnaître la sémantique d’approbation avant de produire des données de rappel privées.                                                                                     |
| Control UI        | `ui/src/app/exec-approval.ts`, `ui/src/app/overlays.ts`, `ui/src/components/exec-approval.ts`                                                                   | L’interface d’approbation est une boîte de dialogue modale globale. `ui/src/app-route-paths.ts` et `ui/src/app-routes.ts` utilisent des routes exactes et réécrivent les chemins inconnus vers Chat.                                                    |
| Propriété des sessions | `src/agents/subagent-registry.types.ts`, `src/agents/subagent-registry-read.ts`, `src/config/sessions/types.ts`                                                 | Les propriétés du contrôleur, du demandeur, du parent explicite et du lancement hérité existent, mais les événements d’approbation ne sont pas projetés vers ces flux de session.                                                    |
| État partagé      | `src/state/openclaw-state-schema.sql`, `src/state/openclaw-state-db.ts`                                                                                         | Les transactions immédiates existantes et les mises à jour conditionnelles Kysely prennent en charge la comparaison et l’échange durables dans `state/openclaw.sqlite`.                                                                   |

Les tests actuels représentatifs comprennent `src/gateway/exec-approval-manager.test.ts`, `src/gateway/server-methods/approval-shared.test.ts`, `src/agents/bash-tools.exec-gateway-approval.e2e.test.ts`, `extensions/telegram/src/approval-handler.runtime.test.ts` et `ui/src/e2e/approval-flow.e2e.test.ts`.

Le SDK de plugin reste l’unique frontière pour les canaux et les plugins. Les modifications apportées à l’exécution et à la présentation des approbations doivent être exportées par les sous-chemins existants `src/plugin-sdk/approval-*.ts` et `src/plugin-sdk/interactive-runtime.ts` ; le code de production des plugins ne doit pas importer les composants internes du Gateway.

## Travaux antérieurs

Omnigent fournit une expérience utilisateur et une sémantique d’échec utiles :

- [`approval.py`](https://github.com/omnigent-ai/omnigent/blob/46e3cd9754c3b8567f7b09f4d19b6249dabe0e80/omnigent/runtime/policies/approval.py) met ASK en attente, applique des délais d’expiration par politique et ne considère qu’une acceptation exacte comme une approbation.
- [`sessions.py`](https://github.com/omnigent-ai/omnigent/blob/46e3cd9754c3b8567f7b09f4d19b6249dabe0e80/omnigent/server/routes/sessions.py) contient la barrière du harnais natif côté serveur ainsi que la projection de la demande et de la résolution vers les ancêtres.
- [`ApprovePage.tsx`](https://github.com/omnigent-ai/omnigent/blob/46e3cd9754c3b8567f7b09f4d19b6249dabe0e80/web/src/pages/ApprovePage.tsx) fournit la page autonome d’approbation mobile.

Ne reprenez pas sans recul son affirmation concernant le stockage. L’état actif actuel des éléments en attente est local au processus dans [`_elicitation_registry.py`](https://github.com/omnigent-ai/omnigent/blob/46e3cd9754c3b8567f7b09f4d19b6249dabe0e80/omnigent/server/_elicitation_registry.py), et la table inutilisée des éléments en attente est supprimée par [`e3b1f2a4c9d7_drop_pending_tool_calls_table.py`](https://github.com/omnigent-ai/omnigent/blob/46e3cd9754c3b8567f7b09f4d19b6249dabe0e80/omnigent/db/migrations/versions/e3b1f2a4c9d7_drop_pending_tool_calls_table.py). OpenClaw va délibérément plus loin : SQLite fait autorité et chaque transition terminale est une comparaison et un échange en base de données.

## Architecture et propriété

Le Gateway détient le cycle de vie :

1. Un agent, un hook de plugin ou une politique de Node fournit une demande propre au type et une liaison d’exécution locale au processus.
2. Le Gateway la valide et construit une projection assainie destinée au réviseur.
3. Le service d’approbation calcule une audience de source/propriétaires, insère la ligne canonique, puis enregistre l’attente en cours de processus.
4. Après l’insertion durable, le Gateway publie les événements d’approbation existants, les projections de session, les notifications de canal et les notifications push natives.
5. Chaque surface effectue la résolution par l’intermédiaire du même service.
6. Le service valide une transition terminale unique, réveille l’attente d’exécution et publie les projections terminales.
7. L’échec de livraison d’un événement n’annule jamais la décision validée ; les clients récupèrent par l’intermédiaire de `approval.get` ou de la relecture de la liste.

Frontières de propriété :

- `src/gateway/` : service d’approbation, autorisation, adaptateurs RPC, construction des URL, cycle de vie des attentes et publication des événements.
- `src/state/` : schéma partagé et types Kysely générés.
- `src/infra/` : modèles de vue d’approbation assainis et construction d’une présentation portable.
- `src/agents/` : demander, attendre et appliquer le verdict renvoyé ; aucune persistance.
- `src/channels/` et `extensions/*` : afficher les actions typées, autoriser les utilisateurs du canal, encoder les rappels privés et mettre à jour les contrôles livrés.
- `src/plugin-sdk/` : contrats publics d’approbation et de présentation uniquement.
- `ui/` : page autonome et clients existants de file d’attente/boîte de dialogue modale.

L’attente en cours de processus est un mécanisme de notification, et non une autorité. L’enregistrement insère la ligne et installe l’attente de manière synchrone avant de publier la demande, de sorte qu’un résolveur ne puisse pas s’intercaler entre ces étapes. Chaque résolveur ultérieur effectue la validation par l’intermédiaire de SQLite avant de satisfaire cette attente.

## Enregistrement persistant

Ajoutez une table `operator_approvals` unique à la base de données d’état partagée.

| Colonne                                             | Objectif                                                                                                                                       |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `approval_id`                                      | ID canonique globalement unique. Conservez les ID d’exécution existants et les ID `plugin:` pour assurer la compatibilité du protocole, mais ne déduisez jamais le type à partir du préfixe.      |
| `resolution_ref`                                   | Localisateur base64url SHA-256 complet et unique pour les rappels de transport qui ne peuvent pas contenir l’ID canonique. Il ne constitue ni une autorisation ni un ID d’URL publique. |
| `kind`                                             | Discriminateur `exec \| plugin` fermé.                                                                                                        |
| `status`                                           | État `pending \| allowed \| denied \| expired \| cancelled` fermé.                                                                          |
| `presentation_json`                                | Projection validée et étiquetée par type destinée au réviseur. Les requêtes d’exécution brutes, les liaisons de commandes et les charges utiles de rappel restent locales au processus.               |
| `source_agent_id`, `source_session_key`            | Identité de la source et ancre de projection de la session. La clé de session est durable, contrairement à l’UUID de session renouvelé.                                          |
| `audience_session_keys_json`                       | Tableau JSON ordonné et dédupliqué, produit par le parcours de propriété borné en largeur d’abord. Les événements de demande et terminaux utilisent ce même instantané. |
| `requested_by_device_id`, `requested_by_client_id` | Métadonnées durables du demandeur et d’audit. L’ID de connexion reste en mémoire et ne constitue pas un principal commun aux différentes surfaces.                                         |
| `reviewer_device_ids_json`                         | Appareils de réviseurs explicitement ciblés facultatifs, fournis uniquement par l’environnement d’exécution d’approbation de confiance.                                                  |
| `runtime_epoch`                                    | Époque du processus propriétaire de l’exécution mise en attente ; utilisée pour annuler les lignes orphelines après un redémarrage.                                                     |
| `created_at_ms`, `expires_at_ms`, `updated_at_ms`  | Informations temporelles faisant autorité.                                                                                                                         |
| `decision`                                         | Décision explicite de l’utilisateur lorsqu’elle existe.                                                                                                       |
| `terminal_reason`                                  | Motif fermé tel que `user`, `timeout`, `malformed-verdict`, `no-route`, `run-aborted` ou `gateway-restart`.                                |
| `resolved_at_ms`, `resolver_kind`, `resolver_id`   | Identité du gagnant et d’audit conservée côté serveur. Les projections destinées aux réviseurs omettent les identifiants bruts du résolveur.                                           |
| `consumed_at_ms`, `consumed_by`                    | Protection distincte contre la réexécution pour `allow-once` ; la consommation ne doit pas effacer la décision enregistrée.                                                       |

Index requis :

| Index                                      | Objectif                                                                     |
| ------------------------------------------ | --------------------------------------------------------------------------- |
| unique `(resolution_ref)`                  | Rejeter lors de l’insertion toute ambiguïté `approval_id`/`resolution_ref` entre colonnes. |
| `(status, expires_at_ms)`                  | Trouver les approbations en attente et rapprocher les échéances faisant autorité.               |
| `(source_session_key, created_at_ms DESC)` | Réexécuter les approbations récentes pour une session source.                             |
| `(resolved_at_ms)`                         | Purger les approbations terminales conservées conformément à la politique de conservation fixe.  |

Les tableaux d’audience sont petits et bornés. La réexécution filtrée par session sélectionne d’abord les lignes en attente visibles avec Kysely, puis décode et filtre les tableaux d’audience bornés dans le code de l’application ; elle n’utilise ni correspondance de chaînes ni requêtes JSON SQL brutes.

Conservez les lignes terminales pendant 30 jours, conformément à la durée de conservation des métadonnées d’audit dans `src/audit/audit-event-store.ts`. La purge relève d’une politique de maintenance fixe, et non d’une nouvelle surface de configuration. La base de données constitue un état privé du plan de contrôle local, mais les API destinées aux réviseurs ne doivent jamais exposer l’intégralité de la requête stockée ni la liaison d’exécution.

## Machine à états et comparaison-échange

Seules les transitions suivantes sont valides :

- `pending -> allowed` : `allow-once` ou `allow-always` explicite.
- `pending -> denied` : refus explicite, verdict terminal mal formé provenant d’une source de confiance ou absence de voie de livraison.
- `pending -> expired` : échéance faisant autorité atteinte.
- `pending -> cancelled` : abandon de l’exécution, arrêt normal ou récupération des éléments orphelins après redémarrage.

Tout état terminal non autorisé produit comme verdict effectif un refus.

La résolution utilise une transaction SQLite immédiate et une mise à jour conditionnelle Kysely équivalente à :

```sql
UPDATE operator_approvals
SET status = ?, decision = ?, terminal_reason = ?, resolved_at_ms = ?
WHERE approval_id = ?
  AND status = 'pending'
  AND expires_at_ms > ?;
```

Si la mise à jour ne modifie aucune ligne, la même transaction lit l’enregistrement :

- Absent ou non autorisé : renvoyer « introuvable » ; ne pas révéler son existence.
- Toujours en attente, mais échéance atteinte : appliquer une comparaison-échange vers `expired`, puis renvoyer cette ligne terminale.
- Même décision enregistrée : renvoyer une réussite idempotente avec le gagnant enregistré.
- Décision différente : l’API unifiée renvoie `applied: false` avec le gagnant enregistré ; les adaptateurs hérités conservent `APPROVAL_ALREADY_RESOLVED` lorsque leur contrat publié l’exige.
- Tout état terminal : ne jamais le modifier.

`now == expires_at_ms` est expiré. L’heure du Gateway fait autorité.

L’exécution de `allow-once` utilise une seconde comparaison-échange sur `consumed_at_ms IS NULL`, liée au contexte exact existant de commande ou d’exécution système. La ligne d’approbation reste un enregistrement d’audit après sa consommation.

Une entrée HTTP/RPC mal formée qui ne peut pas être authentifiée ou identifier une approbation est rejetée sans modification et ne peut jamais approuver. Un verdict terminal mal formé reçu d’un harnais ou d’un processus d’attente de confiance pour une approbation connue déclenche une transition vers `denied`.

## API du Gateway

Ajoutez des méthodes destinées aux réviseurs indépendantes du type :

| Méthode                                    | Contrat                                                                                                                                                                                                            |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `approval.get { id }`                     | Renvoie une projection visible en attente ou terminale conservée.                                                                                                                                                          |
| `approval.resolve { id, kind, decision }` | Accepte l’ID canonique ou la référence de transport de taille fixe, puis exécute l’autorisation, la validation du type et de la décision autorisée, le rapprochement de l’échéance et la comparaison-échange terminale. La réponse contient toujours l’ID canonique. |

Après une comparaison-échange réussie, renvoyez immédiatement la projection validée. Les événements hérités, les transmetteurs de canaux et les mécanismes de finalisation par notification push sont des opérations de suivi au mieux ; une surface lente ou défaillante ne doit ni retarder ni annuler la réponse gagnante.

La validation des requêtes propre à chaque type reste dans `exec.approval.request` et `plugin.approval.request`. Les éléments existants `exec.approval.get/list/waitDecision/resolve` et `plugin.approval.list/waitDecision/resolve` deviennent des adaptateurs de frontière de protocole vers le service canonique, car ils font partie de l’API Gateway publiée. Les appelants internes migrent vers le service dans la même modification.

Une projection destinée aux réviseurs est une union étiquetée :

```ts
type OperatorApproval = {
  id: string;
  status: OperatorApprovalStatus;
  presentation:
    | { kind: "exec"; commandText: string /* aperçu sûr de l’exécution */ }
    | { kind: "plugin"; title: string; description: string /* aperçu sûr du plugin */ };
  // champs communs du cycle de vie
};
```

Le chemin stable est dérivé et non conservé. `approval.get` renvoie `urlPath` ; les surfaces qui connaissent une origine publique approuvée peuvent également recevoir un `url` absolu. Les instantanés destinés aux réviseurs omettent les clés de session de la source et de l’audience. Le Gateway conserve ces clés de routage côté serveur pour la projection `session.approval` distincte.

## Événements et actions portables

La PR 1 conserve les noms d’événements, les charges utiles et les filtres de destinataires existants au niveau des enregistrements tels qu’ils ont été publiés :

- `exec.approval.requested`
- `exec.approval.resolved`
- `plugin.approval.requested`
- `plugin.approval.resolved`

Ces événements hérités peuvent contenir la requête d’exécution complète ; ils ne doivent donc pas être diffusés à tous les clients associés aux approbations. La PR 5 ajoute des champs de cycle de vie étiquetés (`status`, `sourceSessionKey`, `urlPath`, les métadonnées terminales et un `kind` au niveau de la présentation) au moyen de la projection de cycle de vie assainie, au lieu d’élargir la diffusion des événements hérités.

Ajoutez un événement de projection `session.approval` limité aux approbations. Publiez une fois l’événement canonique avec les clés d’audience conservées ; les abonnés à une session exacte reçoivent le même événement pour chaque clé correspondante :

- `sessionKey` : flux recevant la projection.
- `sourceSessionKey` : enfant/source ayant déclenché le contrôle.
- `phase` : `pending \| terminal`, discriminé selon l’état de l’approbation.
- une projection sûre `OperatorApproval`.

Les clients s’abonnent explicitement avec `sessions.messages.subscribe { key, agentId?, includeApprovals: true }`. La réponse positive ajoute un `approvalReplay` contenant jusqu’à 1 000 approbations actuellement en attente pour cette clé de flux exacte, que le client abonné est également autorisé à examiner au niveau de l’enregistrement. `truncated: false` rend la réexécution filtrée déterminante, et les clients qui se reconnectent remplacent leur ensemble local d’éléments en attente par celui-ci ; `truncated: true` constitue un signal de surcharge, et les clients doivent conserver les entrées locales non vues jusqu’à ce que la recherche canonique ou des événements de cycle de vie ultérieurs les résolvent. Une expiration durable ultérieure découverte pendant la réexécution émet des marqueurs de suppression terminaux uniquement vers les audiences abonnées et autorisées au niveau de l’enregistrement, avant le renvoi du nouvel instantané. `operator.admin` peut s’abonner directement ; les clients à portée plus restreinte nécessitent à la fois une identité d’appareil appairé et `operator.approvals`. L’abonnement à une session seul n’accorde jamais la visibilité sur les approbations.

Enregistrez l’événement sous `operator.approvals` dans `src/gateway/server-broadcast.ts`. La projection est observationnelle : elle n’ajoute jamais de lignes à la transcription, n’émet pas `sessions.changed` et ne réveille pas un agent.

Étendez `MessagePresentationAction` dans `src/interactive/payload.ts` :

```ts
type MessagePresentationAction =
  | { type: "command"; command: string }
  | { type: "callback"; value: string }
  | {
      type: "approval";
      approvalId: string;
      approvalKind: "exec" | "plugin";
      decision: ExecApprovalDecision;
    }
  | { type: "url"; url: string }
  | { type: "web-app"; url: string };
```

Core construit des actions de décision typées et un lien Review distinct lorsqu’une origine absolue approuvée de Control UI est disponible. Les canaux encodent une action d’approbation dans leur propre format de rappel et envoient la résolution au service canonique. Un rappel utilise l’ID canonique exact lorsqu’il tient dans le format ; sinon, il utilise le condensat complet unique de la ligne `resolution_ref`. La référence n’est qu’une clé de recherche compacte : l’authentification Gateway normale, l’autorisation de l’enregistrement, le type explicite, la validation des décisions autorisées, la réconciliation des échéances et le CAS de la première réponse s’appliquent toujours. Les canaux ne doivent pas tronquer les ID, résoudre des préfixes de hachage, analyser le texte `/approve`, ni déduire le type d’un préfixe d’ID.

Conservez `button.url`, `button.webApp` et les contrôles d’approbation adossés à des commandes comme entrées de compatibilité obsolètes du SDK de Plugin. Normalisez-les à la frontière du SDK ; migrez chaque appelant interne intégré dans la même PR. `/approve {id} {decision}` reste une solution de repli textuelle et une commande CLI/de discussion, et non le contrat sémantique du bouton.

## Control UI

La route est `${basePath}/approve/{approvalId}`. L’ID est le seul paramètre de chemin ; l’identité de la session source provient de l’enregistrement.

Comme le routeur actuel possède des routes statiques exactes et réécrit les chemins inconnus vers Chat, détectez ce lien profond dans `ui/src/app/bootstrap.ts` avant la normalisation habituelle des routes. Réutilisez la configuration Gateway/d’authentification normale, mais affichez une page d’approbation autonome en dehors de l’enveloppe avec barre latérale et de la fenêtre modale globale.

Le document appartient au Gateway qui a servi son URL. Sa connexion initiale ignore la sélection persistante du Gateway distant de l’application complète sans modifier ni copier les paramètres de cette sélection ; seule l’authentification reste limitée à la session du Gateway serveur. Une authentification native de confiance ou un remplacement `gatewayUrl` confirmé séparément peut le rediriger. Core réserve l’espace de noms à un segment `/approve` avant les routes HTTP des Plugins et la détection des extensions statiques, y compris les ID se terminant par `.json` ou `.js` ; lorsque la diffusion de Control UI est désactivée, la route réservée échoue de manière fermée avec `404`. Conservez la page dans le bundle principal de Control UI afin que l’échec d’un fragment chargé à la demande ne laisse pas une décision de sécurité bloquée sur un indicateur de chargement.

États de la page :

- chargement
- authentification requise
- en attente
- résolution en cours
- approuvé ou refusé ici
- résolu ailleurs
- expiré
- annulé
- interdit/introuvable
- erreur de connexion avec nouvelle tentative

La page appelle le RPC du Gateway, et non une seconde API REST non authentifiée. L’actualisation du navigateur relit l’état durable. Elle ne place jamais les identifiants du Gateway dans l’URL, la requête ou le fragment.

## Autorisation et confidentialité

L’URL est un localisateur, pas une autorité. La résolution nécessite :

1. une connexion Gateway authentifiée ;
2. `operator.approvals` ou `operator.admin` ;
3. une autorisation du réviseur au niveau de l’enregistrement.

Règles au niveau de l’enregistrement :

- `operator.admin` peut effectuer la révision.
- `reviewer_device_ids` fait autorité lorsqu’il est présent. Seul un appareil
  `operator.approvals` appairé et répertorié peut effectuer la révision ; l’appareil demandeur ne dispose d’aucun
  accès implicite, sauf s’il figure également dans la liste.
- En l’absence de liste explicite de réviseurs, l’appareil demandeur
  `operator.approvals` appairé peut réviser son propre enregistrement.
- Les enregistrements véritablement anciens sans association à un demandeur ou à un réviseur conservent une large
  visibilité pour les appareils appairés afin que les mises à niveau ne bloquent pas les travaux déjà en attente.
- Les environnements d’exécution internes sans appareil peuvent résoudre, mais pas lire, via la connexion
  d’environnement d’exécution d’approbation limitée. Cette autorité provient uniquement du
  jeton d’environnement d’exécution authentifié par le serveur ; les champs publics `approval.resolve` ne peuvent pas
  le créer.
- La propriété de la connexion active du demandeur reste valide pour les anciens adaptateurs ; elle n’est
  jamais déduite d’un nom de client correspondant.
- L’appartenance à l’audience modifie uniquement la présentation. Elle n’élargit jamais l’autorisation.

`approval.get` expose uniquement la projection assainie destinée au réviseur et omet les clés internes de routage de la source et de l’audience. L’événement `session.approval` de la PR 5 transporte sa destination unique `sessionKey`, ainsi que `sourceSessionKey`, après que le Gateway a appliqué côté serveur l’instantané d’audience persistant. Les événements exec/Plugin existants conservent leur charge utile historique et leurs destinataires restreints jusqu’à la migration des consommateurs. La requête exécutable, la liaison de commande et la continuation restent uniquement dans l’attente locale au processus. La ligne durable contient la présentation sûre ainsi que les métadonnées de cycle de vie, de routage et d’audit ; elle ne stocke jamais les valeurs brutes de l’environnement, les identifiants, les en-têtes d’authentification ni les données de rappel des canaux.

## Projection de l’audience

Calculez l’audience une seule fois avant l’insertion et conservez l’instantané ordonné. La propriété forme un graphe, et pas toujours une chaîne parentale unique : un enfant peut avoir à la fois un contrôleur actuel et un demandeur d’origine, et ces propriétaires peuvent mener à des racines différentes.

Utilisez un parcours déterministe en largeur :

1. Initialisez la file d’attente avec la clé de la session source.
2. Pour chaque clé retirée de la file, lisez la dernière ligne du registre des sous-agents et ajoutez à la file les deux arêtes de propriété distinctes dans un ordre fixe : `controllerSessionKey`, puis `requesterSessionKey`.
3. Lorsqu’une ligne de registre exploitable existe, ne suivez pas également la filiation de l’entrée de session, qui peut être obsolète après un changement de direction. Sinon, ajoutez à la file l’unique arête de repli actuelle `parentSessionKey ?? spawnedBy`.
4. Normalisez et dédupliquez lors de l’ajout à la file afin que le premier chemin, le plus court, l’emporte.
5. Arrêtez-vous à 64 clés uniques ; ce plafond de taille de l’audience limite également la profondeur du parcours.

La source du registre est `src/agents/subagent-registry-read.ts` ; les champs de propriété sont définis dans `src/agents/subagent-registry.types.ts`. Les champs de repli de session sont définis dans `src/config/sessions/types.ts`.

Les projections de demande et d’état terminal utilisent la même audience persistante, même si la propriété du focus/contrôleur change pendant que l’approbation est en attente. Cela garantit le nettoyage terminal de chaque flux de session de l’audience ayant reçu la projection de la demande. La résolution cible toujours l’ID d’approbation source ; les sessions de l’audience ne reçoivent jamais d’état d’approbation cloné. Le nettoyage des messages de canal transférés reste le suivi distinct du localisateur de livraison décrit ci-dessous.

N’écrivez pas de messages de transcription, n’injectez pas de prompts système, ne lancez pas de tours de propriétaire et n’émettez pas `sessions.changed` uniquement pour une approbation.

## Convergence des surfaces de livraison

Les gestionnaires d’approbation natifs conservent déjà leurs entrées de messages livrés assez longtemps pour remplacer ou retirer les contrôles actifs. Les messages d’approbation génériques transférés ignorent actuellement `MessageReceipt`, de sorte qu’une décision prise sur une autre surface peut laisser leurs anciens contrôles affichés comme étant en attente. Un suivi distinct comble cette lacune avec une table enfant `operator_approval_deliveries` dans la base de données d’état partagée.

Chaque ligne stocke l’ID d’approbation, un ID de livraison unique, le canal/compte/la route exacte, un localisateur de message privé au canal, de taille limitée et validé en JSON, les horodatages de livraison et l’état de finalisation. Elle ne stocke jamais les données de rappel, les jetons de décision ni les demandes d’approbation brutes. Le canal possède l’encodage du localisateur et la mutation du message ; Core possède l’état canonique, la sélection de la cible, la stratégie de nouvelle tentative et le texte terminal de repli.

L’enregistrement de la livraison et la résolution terminale gèrent les conditions de concurrence en toute sécurité :

1. Après qu’un envoi en attente a renvoyé son reçu, insérez le localisateur de livraison et lisez l’état de l’approbation parente dans une même transaction.
2. Si le parent est déjà dans un état terminal, planifiez une finalisation immédiate au lieu de laisser la livraison tardive en attente.
3. Chaque transition terminale validée planifie séparément toutes les lignes de livraison non finalisées ; les diffusions pouvant être abandonnées ne constituent pas le déclencheur.
4. Un finaliseur de canal signale `replaced`, `retired` ou `unsupported`. Le remplacement supprime un message terminal en double ; le retrait envoie le suivi terminal existant ; l’absence de prise en charge ou un échec déclenche la solution de repli sans annuler le CAS de l’approbation.
5. Au démarrage, les approbations terminales comportant des livraisons inachevées font l’objet de nouvelles tentatives, ce qui rend le nettoyage résilient à un redémarrage du Gateway.

Ce cycle de vie du transport est un hook facultatif d’adaptateur de livraison, et non un moteur de rendu ni une action de message destinée au modèle. Les messages QQ C2C/de groupe ne disposent actuellement d’aucune API de modification, de suppression ou d’effacement du clavier ; cet adaptateur reste non pris en charge et ne peut afficher la vérité canonique qu’après un clic ultérieur, jusqu’à ce que le transport obtienne une API de mutation.

## Sémantique du redémarrage, du délai d’expiration et des routes

La persistance SQLite n’implique pas la reprise de l’exécution. Les liaisons de commande/d’outil restent en mémoire, car elles peuvent contenir des informations sensibles à la sécurité sur l’environnement d’exécution et ne constituent pas un contrat de tâche reprenable.

Au démarrage du Gateway :

- générez une nouvelle époque d’environnement d’exécution ;
- faites passer atomiquement les lignes en attente d’époques antérieures à `cancelled` avec le motif `gateway-restart` ;
- conservez les lignes afin que leurs URL expliquent ce qui s’est passé ;
- n’exécutez jamais une approbation ultérieure en l’absence de liaison d’environnement d’exécution.

Les minuteurs sont des optimisations de réveil. L’échéance faisant autorité est stockée dans `expires_at_ms` ; les lectures, les attentes et les résolutions exécutent toutes la réconciliation des expirations.

Comportement strict final :

- délai d’expiration -> `expired`, refuser ;
- aucune route -> `denied`, refuser ;
- abandon de l’exécution -> `cancelled`, refuser ;
- verdict de confiance mal formé -> `denied`, refuser ;
- seule une décision explicite d’autorisation permise -> `allowed`.

Le comportement exec actuellement livré reste en conflit avec ce contrat :

- `src/agents/bash-tools.exec-host-shared.ts` peut appliquer `askFallback`.
- `docs/tools/exec-approvals.md` et `docs/cli/approvals.md` documentent cette surface.

Les approbations de Plugins échouent désormais de manière fermée en cas d’expiration du délai et de verdicts mal formés ; l’ancien
champ `timeoutBehavior` reste accepté, mais est ignoré. Le suivi de la sémantique stricte
d’exec doit mettre à jour conjointement le code, les types, la documentation, les tests et le journal des modifications, avec
une révision explicite du propriétaire/de la sécurité. `askFallback` peut continuer à décrire
la sélection de la stratégie avant le contrôle pendant la migration, mais ne doit pas transformer en approbation
l’expiration du délai d’un enregistrement en attente déjà créé.

## Plan de compatibilité

- Protocole Gateway additif ; aucune augmentation de version du protocole.
- Conservez les méthodes et événements exec/Plugin existants à la frontière externe.
- Conservez les ID existants, y compris les préfixes `plugin:`, mais cessez d’utiliser les préfixes comme informations de type.
- Conservez le comportement de la commande textuelle `/approve`.
- Conservez les anciens champs d’URL/Web App des boutons et les actions de commande comme entrées de compatibilité du SDK de Plugin ; la nouvelle sortie de Core est typée.
- Migrez tous les canaux intégrés et les appelants internes dans la même modification des actions typées.
- Ajoutez une entrée au journal des modifications pour la nouvelle URL/page et pour la modification ultérieure du comportement à l’expiration du délai.
- N’ajoutez pas de paramètre de mode de sollicitation.

## Déploiement

### PR 1 : cycle de vie durable

- La présente note de conception.
- Schéma SQLite partagé, génération Kysely, stockage et élagage après 30 jours.
- Service d’approbation du Gateway, pont vers l’attente de l’environnement d’exécution et gestion des éléments orphelins après redémarrage.
- `approval.get/resolve` unifié.
- Adaptateurs de méthodes exec/Plugin.
- Tests de priorité à la première réponse, d’idempotence, d’expiration, d’autorisation et de consommation.
- Aucun changement de comportement de l’interface utilisateur ou des canaux pour l’instant.

### PR 2 : actions typées et rappels des canaux

- Actions typées d’approbation, d’URL et de Web App.
- Constructeurs de présentation du cœur et exports du SDK de Plugin.
- Encodage de rappel privé au transport avec un type de propriétaire explicite.
- Références de rappel durables de taille fixe pour les identifiants canoniques dépassant les limites du transport.
- Migration des canaux intégrés pour abandonner l’inférence à partir du texte de commande et de l’identifiant d’approbation.
- Vérité canonique de la première réponse sur la surface utilisée et mises à jour terminales natives actives au mieux ; la terminalisation durable des messages de canal reste un suivi ultérieur.
- Tests du SDK et des canaux intégrés.

### PR 3 : lien profond de l’interface de contrôle

- Page d’approbation autonome et authentifiée, et routage au démarrage tenant compte du chemin de base.
- Liaison au Gateway de service sans modifier la sélection distante enregistrée par l’opérateur.
- Espace de noms HTTP d’approbation détenu par le cœur, y compris les identifiants ressemblant à des ressources.
- Charge utile d’URL créée par le Gateway et interrogation de l’état en attente jusqu’à la livraison des événements de cycle de vie.
- Preuves pour la largeur mobile, la reconnexion, les réponses concurrentes, le rechargement et le chemin monté.

### PR 4 : clients natifs

- Les surfaces de révision iOS et Android utilisent `approval.get/resolve` en tenant compte du type ; watchOS relaie des invites et des décisions sûres pour le réviseur via l’iPhone jumelé.
- La Watch propose les décisions d’exécution prises en charge par son contrat de relais compact : autoriser une fois et refuser.
- La vérité terminale canonique de la première réponse remplace l’état local de tentative de décision.
- Les accusés de réception de résolution perdus ou ambigus figent les contrôles jusqu’à la relecture canonique.
- Les instances Gateway v4 précédemment publiées conservent la révision d’exécution grâce à un repli étroit vers l’ancienne méthode ; la conservation de l’état terminal entre les surfaces nécessite les méthodes unifiées.
- Les avertissements destinés au réviseur et le contexte du propriétaire restent visibles sur iPhone, Watch et Android.
- Preuves unitaires, de compilation et de plateforme pour les clients natifs.

### PR 5 : propagation du cycle de vie aux ancêtres

- Livraison des états en attente/terminaux de `session.approval` à partir de l’instantané d’audience conservé dans la PR 1.
- Abonnement à la session exacte, relecture à la reconnexion et pierres tombales terminales sans mutation de la transcription ni réveil de l’agent.
- Les rappels de cycle de vie s’exécutent après l’insertion durable/CAS et ne deviennent jamais l’autorité d’approbation.
- Preuves pour les sous-agents imbriqués et la reconnexion.

### PR 6 : comportement fermé en cas d’échec

- Migrer `node-invoke-plugin-policy.ts` et le courtier de Plugin intégré pour éliminer l’autorité dupliquée.
- Sémantique stricte pour l’expiration, les données mal formées, l’absence de route, la liaison et la consommation d’une autorisation unique.
- Déprécier les paramètres permissifs d’expiration publiés sans les respecter après la mise en attente d’une demande.
- Preuves par contention multisurface et injection de défaillances.

### Suivi : nettoyage durable des messages distants

- Conserver les localisateurs des livraisons transférées et terminaliser chaque message de canal livré après un redémarrage.
- Maintenir ce cycle de vie du transport séparé de l’autorité d’approbation canonique et des actions de présentation typées.

## Tests

Couverture ciblée requise :

- La réouverture de SQLite préserve les projections en attente et terminales.
- Deux résolveurs simultanés produisent exactement un gagnant CAS.
- Une nouvelle tentative avec la même décision réussit de manière idempotente ; une nouvelle tentative conflictuelle renvoie le gagnant enregistré.
- Une résolution à l’échéance ou après celle-ci ne peut pas approuver.
- `allow-once` ne peut être consommé qu’une seule fois sans effacer l’état d’audit terminal.
- Le démarrage annule les anciennes époques d’exécution.
- La consultation et la résolution non autorisées ne révèlent pas l’existence de l’enregistrement.
- Liste d’autorisation explicite des réviseurs et comportement général de `operator.approvals` jumelé.
- Les anciennes méthodes d’exécution et de Plugin partagent le même magasin.
- Schémas de demande/liste/consultation/résolution du Gateway et charges utiles d’événements additives.
- Normalisation des actions typées, rendu de repli, exports du SDK et basculements des canaux intégrés.
- L’encodage des rappels Telegram contient des données privées au transport et aucune inférence à partir d’une chaîne de commande.
- Enfant direct, propriétaires de contrôleur/demandeur ramifiés, propriétaires imbriqués, réaffectation, repli sur le champ de session, cycle et plafond de taille de l’audience.
- Les tableaux d’audience demandée et terminale sont identiques.
- Les projections des propriétaires ne provoquent aucune mutation de la transcription ni aucun réveil de l’agent.
- La route de l’interface de contrôle fonctionne à `/` et avec un chemin de base configuré ; l’actualisation affiche la vérité en attente ou terminale.
- Des réponses simultanées dans l’interface de contrôle et Telegram affichent un seul gagnant et « résolu ailleurs » pour le perdant.
- Les identifiants d’approbation natifs et les identifiants de propriétaire du Gateway préservent exactement les octets UTF-8 lors du routage et de la réconciliation.
- La négociation de la famille RPC native fixe une seule famille canonique ou ancienne par route Gateway admise et ne revient jamais silencieusement à une version antérieure après utilisation.
- Les accusés de réception natifs de résolution perdus figent les actions jusqu’à la relecture canonique ; un échec de relecture ne peut ni fabriquer un gagnant ni accuser réception d’une actualisation de la Watch.
- La corrélation des demandes d’instantané de la Watch n’est acceptée que pour le propriétaire Gateway jumelé exact et après une relecture canonique terminée sur l’iPhone.
- Preuve du parcours utilisateur via Testbox/Crabbox, comprenant une page d’approbation adaptée à la largeur mobile, le nettoyage des actions Telegram et un aller-retour en attente/résolution/perdant tardif sur Android, iPhone et Watch.

## Observabilité

Émettre des journaux structurés de transition, sans contenu, avec l’identifiant d’approbation, le type, la clé de session source, l’état, la raison et la latence. Ne jamais journaliser l’aperçu ni la liaison brute.

Suivre :

- le nombre de demandes par type ;
- le nombre d’états terminaux par type/état/raison ;
- la jauge des éléments en attente ;
- la latence entre la demande et l’état terminal ;
- les résultats des courses de résolution : gagnant, nouvelle tentative idempotente, conflit, expiration ;
- le nombre de routes de livraison et les refus pour absence de route ;
- les annulations d’orphelins au démarrage ;
- la taille de l’audience.

Une transition validée constitue un succès même si la livraison ultérieure de l’événement échoue. Les abonnés au cycle de vie récupèrent grâce à la relecture de la PR 5 et à la consultation canonique. La terminalisation durable des messages de canal reste le suivi distinct indiqué ci-dessus.

## Décisions en suspens

1. **Origine de l’interface de contrôle accessible depuis l’extérieur.** Chaque instantané transporte le chemin relatif stable `urlPath`. Une URL absolue ne peut être annoncée qu’à partir d’un emplacement Tailscale Serve/Funnel mis en cache après la réussite de l’exposition du Gateway ; `allowedOrigins`, les en-têtes Host des requêtes, `gateway.remote.url` et les candidats de bouclage/LAN destinés uniquement à l’affichage ne sont pas des origines canoniques. Telegram peut utiliser son enveloppe Mini App authentifiée pour conserver le chemin d’approbation pendant l’amorçage. Les proxys inverses arbitraires restent limités aux chemins relatifs jusqu’à l’existence d’un contrat explicite d’URL publique examiné séparément. Ne jamais laisser un canal deviner l’origine.
2. **Transition de compatibilité vers l’expiration stricte des exécutions.** Les expirations d’approbation de Plugin échouent désormais en mode fermé et `timeoutBehavior` est déprécié. Le contrat publié restant `askFallback` nécessite un examen explicite par le propriétaire et l’équipe de sécurité, un changelog, de la documentation et une décision de migration/dépréciation avant de cesser d’autoriser l’exécution après l’expiration d’une demande en attente.
3. **Mode intégré sans Gateway.** Recommandation : le limiter initialement au fonctionnement local, puis en faire un client du service canonique lorsqu’un Gateway existe. Ne pas annoncer de lien profond qu’aucun serveur ne peut résoudre.
