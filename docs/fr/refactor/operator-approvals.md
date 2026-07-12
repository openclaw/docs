---
read_when:
    - Modification du cycle de vie des approbations d’exécution ou de Plugin, du stockage, du protocole ou de l’autorisation
    - Ajout de liens d’approbation ou de contrôles d’approbation natifs à un canal
    - Projection des approbations des sessions enfants dans les vues parentes ou d’orchestration
summary: Conception d’approbations persistantes, accessibles par lien profond, dans l’interface de contrôle, les applications natives, les canaux et les sessions parentes
title: Approbations des opérateurs sur plusieurs surfaces
x-i18n:
    generated_at: "2026-07-12T15:47:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 3f3dfc5d503d46bfc7a5eb94960baf2a81216ac973ef1bb1e6a0ef63f0bec6d5
    source_path: refactor/operator-approvals.md
    workflow: 16
---

# Approbations opérateur multisurfaces

Cette conception suit [#103505](https://github.com/openclaw/openclaw/issues/103505). Elle remplace l’autorité d’approbation locale au processus par un cycle de vie unique, géré par le Gateway et adossé à SQLite. Chaque approbation d’exécution ou de plugin/outil gérée par le Gateway reçoit un ID stable, une route Control UI authentifiée, une résolution atomique où la première réponse l’emporte, ainsi que des projections réservées aux opérateurs vers les flux de sa session source et de ses sessions ancêtres.

Les actions intégrées et les liens profonds coexistent. Il n’existe aucun commutateur de mode d’approbation.

## Objectifs

- Un objet d’approbation durable unique pour les contrôles d’exécution et de plugin/outil.
- Route `${controlUiBasePath}/approve/{approvalId}` stable.
- Résolution depuis toute Control UI autorisée, toute application native ou toute surface de canal.
- Comportement atomique où la première réponse l’emporte sur les surfaces concurrentes.
- Nouvelles tentatives identiques idempotentes ; les réponses tardives contradictoires ne peuvent pas remplacer la réponse gagnante.
- Les expirations de délai, verdicts de confiance mal formés, routes manquantes, annulations et redémarrages échouent en mode fermé.
- Les événements de demande et terminaux atteignent la session source ainsi que tous les propriétaires parents/orchestrateurs concernés.
- Les canaux reçoivent des actions typées d’approbation et de navigation ; les données de rappel du transport restent privées au canal.
- Les méthodes Gateway existantes d’exécution/plugin restent compatibles tandis que leur implémentation converge vers un service unique.

## Hors objectifs

- Persister ou reprendre l’exécution bloquée de l’outil elle-même après le redémarrage du Gateway.
- Faire d’un ID ou d’une URL d’approbation un identifiant d’accès.
- Ajouter des demandes d’approbation aux transcriptions visibles par le modèle ou réveiller les agents parents.
- Déplacer la politique d’approbation, les commandes du produit ou l’autorisation des réviseurs dans les plugins de canal.
- Cloner l’état d’approbation par canal, appareil ou ancêtre.
- Reconcevoir les listes d’autorisation d’exécution, la composition des politiques de plugin ou la persistance de `allow-always`, sauf lorsque cela est nécessaire pour rendre les résultats terminaux non ambigus.
- Rendre une TUI intégrée sans Gateway accessible à distance dans la première version. Elle reste uniquement locale et doit échouer en mode fermé lorsqu’aucun réviseur n’existe.

## Référence préalable au déploiement et carte des éléments probants

Ce tableau consigne l’état de l’implémentation lors de l’ouverture de #103505. Les sections de déploiement ci-dessous suivent les ajouts successifs du registre durable, des actions typées, de la page de lien profond et du client natif, construits sur cette référence.

| Surface           | Point d’entrée et propriétaire de référence                                                                                                                     | Comportement de référence et lacune                                                                                                                                                               |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Exécution d’agent | `src/agents/bash-tools.exec-approval-request.ts`, `src/agents/bash-tools.exec-host-shared.ts`                                                                   | L’enregistrement en deux phases `exec.approval.*` empêche une course précoce avec `/approve`, mais une expiration de délai peut encore devenir une autorisation via `askFallback`.                 |
| Contrôle d’outil de plugin | `src/agents/agent-tools.before-tool-call.ts`                                                                                                            | Demande `plugin.approval.*` ; `timeoutBehavior: "allow"` peut approuver un contrôle dont le délai a expiré. Le mode intégré dispose d’une autorité locale au processus distincte dans `src/infra/embedded-plugin-approval-broker.ts`. |
| Contrôle de Node de plugin | `src/gateway/node-invoke-plugin-policy.ts`                                                                                                             | Crée et diffuse directement par l’intermédiaire du gestionnaire de plugins, dupliquant une partie du cycle de vie des méthodes serveur.                                                          |
| Autorité du Gateway | `src/gateway/server-aux-handlers.ts`, `src/gateway/exec-approval-manager.ts`, `src/gateway/server-methods/approval-shared.ts`                                  | Des gestionnaires d’exécution et de plugin distincts utilisent des tables locales au processus. Les entrées terminales persistent pendant 15 secondes. La première réponse ne l’emporte qu’au sein d’un seul processus. |
| Protocole du Gateway | `packages/gateway-protocol/src/schema/exec-approvals.ts`, `packages/gateway-protocol/src/schema/plugin-approvals.ts`, `src/gateway/methods/core-descriptors.ts` | L’exécution possède une opération `get` réservée aux demandes en attente ; le plugin n’a pas d’opération `get` ; il n’existe aucune recherche terminale indépendante du type pour un lien profond. |
| Distribution      | `src/infra/exec-approval-channel-runtime.ts`, `src/infra/approval-native-runtime.ts`, `src/infra/approval-handler-runtime.ts`                                   | Prend en charge le routage vers l’origine, les messages privés aux approbateurs, la relecture des demandes en attente, les gestionnaires natifs et le nettoyage terminal en cours de processus. Un ajout ultérieur distinct apporte une réconciliation terminale durable. |
| Actions portables | `src/interactive/payload.ts`, `src/plugin-sdk/interactive-runtime.ts`, `src/plugin-sdk/approval-reply-runtime.ts`                                               | Les boutons d’approbation sont des actions de commande contenant `/approve ...` ; les cibles URL et Web App sont des champs de bouton non typés.                                                  |
| Telegram          | `extensions/telegram/src/approval-handler.runtime.ts`, `extensions/telegram/src/button-types.ts`                                                                | Le moteur de rendu analyse le texte de la commande pour reconnaître la sémantique d’approbation avant de produire des données de rappel privées.                                                |
| Control UI        | `ui/src/app/exec-approval.ts`, `ui/src/app/overlays.ts`, `ui/src/components/exec-approval.ts`                                                                   | L’interface d’approbation est une fenêtre modale globale. `ui/src/app-route-paths.ts` et `ui/src/app-routes.ts` utilisent des routes exactes et redirigent les chemins inconnus vers Chat.       |
| Propriété de session | `src/agents/subagent-registry.types.ts`, `src/agents/subagent-registry-read.ts`, `src/config/sessions/types.ts`                                              | La propriété par le contrôleur, le demandeur, le parent explicite et le lanceur historique existe, mais les événements d’approbation ne sont pas projetés vers ces flux de session.              |
| État partagé      | `src/state/openclaw-state-schema.sql`, `src/state/openclaw-state-db.ts`                                                                                         | Les transactions immédiates et mises à jour conditionnelles Kysely existantes prennent en charge une comparaison-échange durable dans `state/openclaw.sqlite`.                                  |

Les tests actuels représentatifs comprennent `src/gateway/exec-approval-manager.test.ts`, `src/gateway/server-methods/approval-shared.test.ts`, `src/agents/bash-tools.exec-gateway-approval.e2e.test.ts`, `extensions/telegram/src/approval-handler.runtime.test.ts` et `ui/src/e2e/approval-flow.e2e.test.ts`.

Le SDK de plugin reste l’unique frontière entre les canaux et les plugins. Les modifications apportées à l’exécution et à la présentation des approbations doivent être exportées par les sous-chemins existants `src/plugin-sdk/approval-*.ts` et `src/plugin-sdk/interactive-runtime.ts` ; le code de production des plugins ne doit pas importer les composants internes du Gateway.

## Travaux antérieurs

Omnigent fournit une expérience utilisateur et une sémantique d’échec utiles :

- [`approval.py`](https://github.com/omnigent-ai/omnigent/blob/46e3cd9754c3b8567f7b09f4d19b6249dabe0e80/omnigent/runtime/policies/approval.py) met ASK en attente, applique des délais d’expiration par politique et considère uniquement une acceptation exacte comme une approbation.
- [`sessions.py`](https://github.com/omnigent-ai/omnigent/blob/46e3cd9754c3b8567f7b09f4d19b6249dabe0e80/omnigent/server/routes/sessions.py) contient le contrôle du banc d’essai natif côté serveur ainsi que la projection des demandes et résolutions vers les ancêtres.
- [`ApprovePage.tsx`](https://github.com/omnigent-ai/omnigent/blob/46e3cd9754c3b8567f7b09f4d19b6249dabe0e80/web/src/pages/ApprovePage.tsx) fournit la page autonome d’approbation mobile.

Ne reprenez pas sans recul son affirmation concernant le stockage. L’état actif actuel des demandes en attente est local au processus dans [`_elicitation_registry.py`](https://github.com/omnigent-ai/omnigent/blob/46e3cd9754c3b8567f7b09f4d19b6249dabe0e80/omnigent/server/_elicitation_registry.py), et la table inutilisée des demandes en attente est supprimée par [`e3b1f2a4c9d7_drop_pending_tool_calls_table.py`](https://github.com/omnigent-ai/omnigent/blob/46e3cd9754c3b8567f7b09f4d19b6249dabe0e80/omnigent/db/migrations/versions/e3b1f2a4c9d7_drop_pending_tool_calls_table.py). OpenClaw va délibérément plus loin : SQLite fait autorité et chaque transition terminale est une opération de comparaison-échange en base de données.

## Architecture et propriété

Le Gateway possède le cycle de vie :

1. Un agent, un hook de plugin ou une politique de Node fournit une demande propre à son type et une liaison d’exécution locale au processus.
2. Le Gateway la valide et construit une projection assainie destinée au réviseur.
3. Le service d’approbation calcule une audience composée de la source et de ses propriétaires, insère la ligne canonique, puis enregistre l’attente dans le processus.
4. Après l’insertion durable, le Gateway publie les événements d’approbation existants, les projections de session, les notifications de canal et les notifications push natives.
5. Chaque surface effectue la résolution par l’intermédiaire du même service.
6. Le service valide une transition terminale unique, réveille l’attente d’exécution et publie les projections terminales.
7. L’échec de distribution d’un événement n’annule jamais la décision validée ; les clients récupèrent l’état par `approval.get` ou par relecture de la liste.

Frontières de propriété :

- `src/gateway/` : service d’approbation, autorisation, adaptateurs RPC, construction des URL, cycle de vie des attentes et publication des événements.
- `src/state/` : schéma partagé et types Kysely générés.
- `src/infra/` : modèles de vue d’approbation assainis et construction de présentations portables.
- `src/agents/` : demande, attente et application du verdict renvoyé ; aucune persistance.
- `src/channels/` et `extensions/*` : affichage des actions typées, autorisation des utilisateurs du canal, encodage des rappels privés et mise à jour des contrôles distribués.
- `src/plugin-sdk/` : contrats publics d’approbation et de présentation uniquement.
- `ui/` : page autonome et clients existants de file d’attente/fenêtre modale.

L’attente dans le processus constitue un mécanisme de notification, et non une autorité. L’enregistrement insère la ligne et installe l’attente de façon synchrone avant de publier la demande, de sorte qu’aucun résolveur ne puisse s’intercaler entre ces étapes. Chaque résolveur ultérieur valide d’abord la décision via SQLite avant de satisfaire cette attente.

## Enregistrement persistant

Ajoutez une table `operator_approvals` unique à la base de données d’état partagée.

| Colonne                                            | Objectif                                                                                                                                                                                                                  |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `approval_id`                                      | ID canonique globalement unique. Conservez les ID d’exécution existants et les ID `plugin:` pour assurer la compatibilité du protocole, mais ne déduisez jamais le type à partir du préfixe.                               |
| `resolution_ref`                                   | Localisateur base64url SHA-256 complet et unique pour les rappels de transport qui ne peuvent pas contenir l’ID canonique. Il ne constitue ni une autorisation ni un ID d’URL publique.                                   |
| `kind`                                             | Discriminateur fermé `exec \| plugin`.                                                                                                                                                                                    |
| `status`                                           | État fermé `pending \| allowed \| denied \| expired \| cancelled`.                                                                                                                                                        |
| `presentation_json`                                | Projection destinée au réviseur, validée et étiquetée par type. Les requêtes d’exécution brutes, les liaisons de commandes et les charges utiles des rappels restent locales au processus.                                |
| `source_agent_id`, `source_session_key`            | Identité source et ancre de projection de la session. La clé de session est durable, contrairement à l’UUID de session soumis à rotation.                                                                                |
| `audience_session_keys_json`                       | Tableau JSON ordonné et dédupliqué, produit par le parcours de propriété borné en largeur d’abord. Les événements de demande et terminaux utilisent ce même instantané.                                                   |
| `requested_by_device_id`, `requested_by_client_id` | Métadonnées durables relatives au demandeur et à l’audit. L’ID de connexion reste en mémoire et ne constitue pas un principal inter-surface.                                                                              |
| `reviewer_device_ids_json`                         | Appareils réviseurs explicitement ciblés facultatifs, fournis uniquement par l’environnement d’exécution d’approbation de confiance.                                                                                     |
| `runtime_epoch`                                    | Époque du processus propriétaire de l’exécution mise en attente ; utilisée pour annuler les lignes orphelines après un redémarrage.                                                                                       |
| `created_at_ms`, `expires_at_ms`, `updated_at_ms`  | Informations temporelles faisant autorité.                                                                                                                                                                               |
| `decision`                                         | Décision explicite de l’utilisateur, lorsqu’elle existe.                                                                                                                                                                  |
| `terminal_reason`                                  | Motif fermé tel que `user`, `timeout`, `malformed-verdict`, `no-route`, `run-aborted` ou `gateway-restart`.                                                                                                              |
| `resolved_at_ms`, `resolver_kind`, `resolver_id`   | Gagnant et identité d’audit conservés côté serveur. Les projections destinées aux réviseurs omettent les identifiants bruts du décideur.                                                                                  |
| `consumed_at_ms`, `consumed_by`                    | Protection distincte contre la réexécution pour `allow-once` ; la consommation ne doit pas effacer la décision enregistrée.                                                                                              |

Index requis :

- unique `(resolution_ref)` ; les insertions rejettent également toute ambiguïté inter-colonnes entre `approval_id` et `resolution_ref`
- `(status, expires_at_ms)`
- `(source_session_key, created_at_ms DESC)`
- `(resolved_at_ms)` pour la purge selon la durée de conservation

Les tableaux d’audience sont petits et bornés. La relecture filtrée par session sélectionne d’abord les lignes en attente visibles via Kysely, puis décode et filtre les tableaux d’audience bornés dans le code de l’application ; elle n’utilise ni correspondance de chaînes ni requêtes JSON en SQL brut.

Conservez les lignes terminales pendant 30 jours, conformément à la durée de conservation des métadonnées d’audit dans `src/audit/audit-event-store.ts`. La purge est une politique de maintenance fixe, et non une nouvelle surface de configuration. La base de données constitue un état privé local du plan de contrôle, mais les API destinées aux réviseurs ne doivent jamais exposer l’intégralité de la requête stockée ni la liaison d’exécution.

## Machine à états et comparaison-échange

Seules les transitions suivantes sont valides :

- `pending -> allowed` : `allow-once` ou `allow-always` explicite.
- `pending -> denied` : refus explicite, verdict terminal malformé provenant d’une source de confiance ou absence de route de livraison.
- `pending -> expired` : échéance faisant autorité atteinte.
- `pending -> cancelled` : abandon de l’exécution, arrêt gracieux ou récupération des éléments orphelins après redémarrage.

Chaque état terminal autre que l’autorisation produit un verdict effectif de refus.

La résolution utilise une transaction SQLite immédiate et une mise à jour conditionnelle Kysely équivalente à :

```sql
UPDATE operator_approvals
SET status = ?, decision = ?, terminal_reason = ?, resolved_at_ms = ?
WHERE approval_id = ?
  AND status = 'pending'
  AND expires_at_ms > ?;
```

Si la mise à jour n’affecte aucune ligne, la même transaction lit l’enregistrement :

- Introuvable ou non autorisé : renvoyez « introuvable » ; ne révélez pas son existence.
- Toujours en attente, mais l’échéance est atteinte : effectuez une comparaison-échange vers `expired`, puis renvoyez cette ligne terminale.
- Même décision enregistrée : renvoyez un succès idempotent avec le gagnant enregistré.
- Décision différente : l’API unifiée renvoie `applied: false` avec le gagnant enregistré ; les adaptateurs hérités conservent `APPROVAL_ALREADY_RESOLVED` lorsque leur contrat publié l’exige.
- Tout état terminal : ne le modifiez jamais.

`now == expires_at_ms` signifie que l’élément a expiré. L’heure du Gateway fait autorité.

L’exécution `allow-once` utilise une seconde comparaison-échange sur `consumed_at_ms IS NULL`, liée au contexte exact existant de commande ou d’exécution système. La ligne d’approbation reste un enregistrement d’audit après sa consommation.

Les entrées HTTP/RPC malformées qui ne peuvent pas être authentifiées ou identifier une approbation sont rejetées sans modification et ne peuvent jamais accorder une approbation. Un verdict terminal malformé reçu d’un harnais ou d’un processus d’attente de confiance pour une approbation connue entraîne une transition vers `denied`.

## API du Gateway

Ajoutez des méthodes destinées aux réviseurs indépendantes du type :

| Méthode                                   | Contrat                                                                                                                                                                                                                                                                                             |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `approval.get { id }`                     | Renvoie une projection visible en attente ou terminale conservée.                                                                                                                                                                                                                                    |
| `approval.resolve { id, kind, decision }` | Accepte l’ID canonique ou la référence de transport de taille fixe, puis exécute l’autorisation, la validation du type et de la décision autorisée, la réconciliation de l’échéance et la comparaison-échange terminale. La réponse contient toujours l’ID canonique. |

Après une comparaison-échange réussie, renvoyez immédiatement la projection validée. Les événements hérités, les relais de canaux et les mécanismes de finalisation par notification push sont des opérations de suivi au mieux ; une surface lente ou défaillante ne doit ni retarder ni annuler la réponse gagnante.

La validation des requêtes propre à chaque type reste dans `exec.approval.request` et `plugin.approval.request`. Les méthodes existantes `exec.approval.get/list/waitDecision/resolve` et `plugin.approval.list/waitDecision/resolve` deviennent des adaptateurs de frontière de protocole vers le service canonique, car elles font partie de l’API Gateway publiée. Les appelants internes migrent vers le service dans la même modification.

Une projection destinée aux réviseurs est une union étiquetée :

```ts
type OperatorApproval = {
  id: string;
  status: OperatorApprovalStatus;
  presentation:
    | { kind: "exec"; commandText: string /* aperçu sécurisé de l’exécution */ }
    | { kind: "plugin"; title: string; description: string /* aperçu sécurisé du plugin */ };
  // champs communs du cycle de vie
};
```

Le chemin stable est dérivé, et non persisté. `approval.get` renvoie `urlPath` ; les surfaces qui connaissent une origine publique approuvée peuvent également recevoir une `url` absolue. Les instantanés destinés aux réviseurs omettent les clés de session source et d’audience. Le Gateway conserve ces clés de routage côté serveur pour la projection `session.approval` distincte.

## Événements et actions portables

La PR 1 préserve les noms d’événements, les charges utiles et les filtres de destinataires existants au niveau des enregistrements :

- `exec.approval.requested`
- `exec.approval.resolved`
- `plugin.approval.requested`
- `plugin.approval.resolved`

Ces événements hérités peuvent contenir l’intégralité de la requête d’exécution et ne doivent donc pas être diffusés à tous les clients relevant des approbations. La PR 5 ajoute des champs de cycle de vie étiquetés (`status`, `sourceSessionKey`, `urlPath`, les métadonnées terminales et un `kind` au niveau de la présentation) au moyen de la projection assainie du cycle de vie, au lieu d’élargir la diffusion des événements hérités.

Ajoutez un événement de projection `session.approval` relevant des approbations. Publiez une seule fois l’événement canonique avec les clés d’audience persistées ; les abonnés à une session exacte reçoivent le même événement pour chaque clé correspondante :

- `sessionKey` : flux recevant la projection.
- `sourceSessionKey` : enfant ou source ayant déclenché le contrôle.
- `phase` : `pending \| terminal`, discriminée en fonction de l’état de l’approbation.
- une projection `OperatorApproval` sécurisée.

Les clients choisissent de s’y abonner avec `sessions.messages.subscribe { key, agentId?, includeApprovals: true }`. La réponse de réussite ajoute un `approvalReplay` contenant jusqu’à 1,000 approbations actuellement en attente pour cette clé de flux exacte, que le client abonné est également autorisé à réviser au niveau de l’enregistrement. `truncated: false` rend la relecture filtrée faisant autorité, et les clients qui se reconnectent remplacent par celle-ci leur ensemble local d’éléments en attente ; `truncated: true` signale une surcharge, et les clients doivent conserver les entrées locales non vues jusqu’à ce qu’une recherche canonique ou des événements ultérieurs du cycle de vie les résolvent. Une expiration durable découverte ultérieurement pendant la relecture émet des pierres tombales terminales uniquement aux audiences abonnées et autorisées au niveau de l’enregistrement, avant le renvoi du nouvel instantané. `operator.admin` peut choisir de s’y abonner directement ; les clients aux droits plus restreints nécessitent à la fois une identité d’appareil appairée et `operator.approvals`. L’abonnement à une session seul n’accorde jamais la visibilité sur les approbations.

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

Le cœur construit des actions de décision typées et un lien de révision distinct lorsqu’une origine absolue approuvée de la Control UI est disponible. Les canaux encodent une action d’approbation dans leur propre format de rappel et envoient la résolution au service canonique. Un rappel utilise l’ID canonique exact lorsqu’il tient dans le format ; sinon, il utilise le `resolution_ref` unique à condensat complet de la ligne. La référence n’est qu’une clé de recherche compacte : l’authentification normale du Gateway, l’autorisation au niveau de l’enregistrement, le type explicite, la validation de la décision autorisée, la réconciliation de l’échéance et la comparaison-échange où la première réponse l’emporte continuent de s’appliquer. Les canaux ne doivent ni tronquer les ID, ni résoudre des préfixes de hachage, ni analyser le texte `/approve`, ni déduire le type à partir du préfixe d’un ID.

Conservez `button.url`, `button.webApp` et les contrôles d’approbation fondés sur des commandes comme entrées de compatibilité obsolètes du SDK de plugin. Normalisez-les à la frontière du SDK ; migrez chaque appelant interne intégré dans la même PR. `/approve {id} {decision}` reste une solution de secours textuelle ainsi qu’une commande CLI/de discussion, et non le contrat sémantique du bouton.

## Control UI

La route est `${basePath}/approve/{approvalId}`. L’ID est le seul paramètre de chemin ; l’identité de la session source provient de l’enregistrement.

Parce que le routeur actuel possède des routes statiques exactes et réécrit les chemins inconnus vers Chat, détectez ce lien profond dans `ui/src/app/bootstrap.ts` avant la normalisation habituelle des routes. Réutilisez la configuration normale du Gateway et de l’authentification, mais affichez une page d’approbation autonome en dehors de l’enveloppe de la barre latérale et de la fenêtre modale globale.

Le document appartient au Gateway qui a servi son URL. Sa connexion initiale ignore la sélection persistante du Gateway distant de l’application complète, sans modifier ni copier les paramètres de cette sélection ; seule l’authentification reste limitée à la session du Gateway serveur. Une authentification native de confiance ou un remplacement `gatewayUrl` confirmé séparément peut le rediriger. Le cœur réserve l’espace de noms à un segment `/approve` avant les routes HTTP des plugins et la détection des extensions statiques, y compris pour les ID se terminant par `.json` ou `.js` ; lorsque la mise à disposition de la Control UI est désactivée, la route réservée échoue de manière fermée avec `404`. Conservez la page dans le paquet principal de la Control UI afin que l’échec d’un fragment chargé à la demande ne laisse pas une décision de sécurité bloquée sur un indicateur de chargement.

États de la page :

- chargement
- authentification requise
- en attente
- résolution en cours
- approuvée ou refusée ici
- résolue ailleurs
- expirée
- annulée
- interdite/introuvable
- erreur de connexion avec possibilité de réessayer

La page appelle la RPC du Gateway, et non une seconde API REST non authentifiée. Une actualisation du navigateur relit l’état durable. Elle ne place jamais les identifiants du Gateway dans l’URL, la requête ou le fragment.

## Autorisation et confidentialité

L’URL est un localisateur, pas une autorité. La résolution nécessite :

1. une connexion authentifiée au Gateway ;
2. `operator.approvals` ou `operator.admin` ;
3. une autorisation du réviseur au niveau de l’enregistrement.

Règles au niveau de l’enregistrement :

- `operator.admin` peut effectuer la révision.
- `reviewer_device_ids` fait autorité lorsqu’il est présent. Seul un appareil
  `operator.approvals` appairé figurant dans la liste peut effectuer la révision ;
  l’appareil demandeur ne dispose d’aucun accès implicite, sauf s’il figure
  également dans la liste.
- Sans liste explicite de réviseurs, l’appareil `operator.approvals` appairé
  demandeur peut effectuer la révision de son propre enregistrement.
- Les enregistrements véritablement hérités, sans association à un demandeur ou
  à un réviseur, conservent une visibilité étendue pour les appareils appairés,
  afin que les mises à niveau ne bloquent pas les tâches déjà en attente.
- Les environnements d’exécution internes sans appareil peuvent résoudre, mais
  pas lire, via la connexion d’environnement d’exécution d’approbation limitée.
  Cette autorité provient uniquement du jeton d’environnement d’exécution
  authentifié par le serveur ; les champs publics `approval.resolve` ne peuvent
  pas la créer.
- La propriété de la connexion active du demandeur reste valide pour les
  adaptateurs hérités ; elle n’est jamais déduite d’un nom de client
  correspondant.
- L’appartenance à l’audience modifie uniquement la présentation. Elle n’élargit
  jamais l’autorisation.

`approval.get` expose uniquement la projection assainie destinée au réviseur et omet les clés internes de routage de la source et de l’audience. L’événement `session.approval` de la PR 5 transporte son unique `sessionKey` de destination ainsi que `sourceSessionKey`, après que le Gateway a appliqué côté serveur l’instantané persistant de l’audience. Les événements exec/plugin existants conservent leur charge utile historique et leurs destinataires restreints jusqu’à la migration des consommateurs. La requête exécutable, l’association de commande et la continuation restent uniquement dans le mécanisme d’attente local au processus. La ligne durable contient la présentation sûre ainsi que les métadonnées de cycle de vie, de routage et d’audit ; elle ne stocke jamais les valeurs brutes de l’environnement, les identifiants, les en-têtes d’authentification ni les données de rappel du canal.

## Projection de l’audience

Calculez l’audience une seule fois avant l’insertion et conservez l’instantané ordonné. La propriété forme un graphe, et non systématiquement une chaîne à parent unique : un enfant peut avoir à la fois un contrôleur actuel et un demandeur initial, et ces propriétaires peuvent mener à des racines différentes.

Utilisez un parcours en largeur déterministe :

1. Initialisez la file avec la clé de session source.
2. Pour chaque clé retirée de la file, lisez la dernière ligne du registre des sous-agents et ajoutez à la file les deux arêtes de propriété distinctes dans un ordre fixe : `controllerSessionKey`, puis `requesterSessionKey`.
3. Lorsqu’une ligne de registre exploitable existe, ne suivez pas également la filiation de l’entrée de session, qui peut être obsolète après une réorientation. Sinon, ajoutez à la file l’unique arête de repli actuelle `parentSessionKey ?? spawnedBy`.
4. Normalisez et dédupliquez lors de l’ajout à la file afin que le premier chemin, le plus court, l’emporte.
5. Arrêtez-vous à 64 clés uniques ; cette limite de taille de l’audience borne également la profondeur du parcours.

La source du registre est `src/agents/subagent-registry-read.ts` ; les champs de propriété sont définis dans `src/agents/subagent-registry.types.ts`. Les champs de repli de session sont définis dans `src/config/sessions/types.ts`.

Les projections de demande et de terminaison utilisent la même audience conservée, même si la propriété du focus ou du contrôleur change pendant que l’approbation est en attente. Cela garantit le nettoyage terminal de chaque flux de session de l’audience ayant reçu la projection de la demande. La résolution cible toujours l’identifiant d’approbation source ; les sessions de l’audience ne reçoivent jamais d’état d’approbation cloné. Le nettoyage des messages de canal transférés reste l’opération de suivi distincte liée au localisateur de livraison ci-dessous.

N’écrivez pas de messages dans la transcription, n’injectez pas de prompts système, ne démarrez pas de tours de propriétaire et n’émettez pas `sessions.changed` uniquement pour une approbation.

## Convergence des surfaces de livraison

Les gestionnaires d’approbation natifs conservent déjà les entrées de leurs messages livrés suffisamment longtemps pour remplacer ou désactiver les contrôles actifs. Les messages d’approbation génériques transférés ignorent actuellement le `MessageReceipt` ; une décision prise sur une autre surface peut donc laisser leurs anciens contrôles dans un état qui semble toujours en attente. Un suivi distinct comble cette lacune au moyen d’une table enfant `operator_approval_deliveries` dans la base de données d’état partagée.

Chaque ligne stocke l’ID d’approbation, un ID de livraison unique, le canal, le compte et la route exacte, un localisateur de message privé au canal, de taille limitée et validé selon le format JSON, les horodatages de livraison et l’état de finalisation. Elle ne stocke jamais de données de rappel, de jetons de décision ni de demandes d’approbation brutes. Le canal est responsable de l’encodage du localisateur et de la modification du message ; le cœur est responsable de l’état canonique, de la sélection des cibles, de la stratégie de nouvelle tentative et du texte terminal de repli.

L’enregistrement de la livraison et la résolution terminale gèrent les accès concurrents en toute sécurité :

1. Après qu’un envoi en attente a renvoyé son reçu, insérez le localisateur de livraison et lisez l’état de l’approbation parente dans une même transaction.
2. Si l’approbation parente est déjà dans un état terminal, planifiez une finalisation terminale immédiate au lieu de laisser la livraison tardive en attente.
3. Chaque transition terminale validée planifie séparément toutes les lignes de livraison non finalisées ; les diffusions pouvant être abandonnées ne constituent pas le déclencheur.
4. Un finaliseur de canal signale `replaced`, `retired` ou `unsupported`. Le statut « remplacé » supprime un message terminal en double ; le statut « retiré » envoie le suivi terminal existant ; une absence de prise en charge ou un échec déclenche un repli sans annuler le CAS d’approbation.
5. Au démarrage, les approbations terminales comportant des livraisons inachevées sont retentées, ce qui rend le nettoyage résilient aux redémarrages du Gateway.

Ce cycle de vie du transport est un hook facultatif de l’adaptateur de livraison, et non un moteur de rendu ni une action de message exposée au modèle. Les messages QQ C2C/de groupe ne disposent actuellement d’aucune API de modification, de suppression ou d’effacement du clavier ; cet adaptateur reste non pris en charge et ne peut afficher l’état canonique qu’après un clic ultérieur, jusqu’à ce que le transport dispose d’une API de mutation.

## Sémantique du redémarrage, du délai d’expiration et du routage

La persistance SQLite n’implique pas la reprise de l’exécution. Les liaisons de commandes/outils restent en mémoire, car elles peuvent contenir des informations d’exécution sensibles sur le plan de la sécurité et ne constituent pas un contrat de tâche pouvant être reprise.

Au démarrage du Gateway :

- générer une nouvelle époque d’exécution ;
- faire passer atomiquement les lignes en attente des époques antérieures à l’état `cancelled` avec le motif `gateway-restart` ;
- conserver les lignes afin que leurs URL expliquent ce qui s’est passé ;
- ne jamais exécuter une approbation ultérieure en l’absence de liaison d’exécution.

Les minuteurs sont des optimisations de réveil. L’autorité sur l’échéance est stockée dans `expires_at_ms` ; les lectures, les attentes et les résolutions exécutent toutes la réconciliation des expirations.

Comportement strict final :

- expiration du délai -> `expired`, refuser ;
- aucune route -> `denied`, refuser ;
- abandon de l’exécution -> `cancelled`, refuser ;
- verdict approuvé mal formé -> `denied`, refuser ;
- seule une décision explicite d’autorisation permise -> `allowed`.

Le comportement exec actuellement livré reste en conflit avec ce contrat :

- `src/agents/bash-tools.exec-host-shared.ts` peut appliquer `askFallback`.
- `docs/tools/exec-approvals.md` et `docs/cli/approvals.md` documentent cette surface.

Les approbations de Plugin échouent désormais de manière restrictive en cas d’expiration du délai ou de verdict mal formé ; l’ancien
champ `timeoutBehavior` reste accepté, mais est ignoré. Le suivi relatif à la
sémantique stricte d’exec doit mettre à jour ensemble le code, les types, la documentation, les tests et le journal des modifications, avec
une revue explicite par les responsables et l’équipe de sécurité. `askFallback` peut continuer à décrire
la sélection de la politique avant la barrière pendant la migration, mais ne doit pas transformer
l’expiration du délai d’un enregistrement en attente créé en approbation.

## Plan de compatibilité

- Protocole Gateway additif ; aucune augmentation de version du protocole.
- Préserver les méthodes et événements exec/Plugin existants à la frontière externe.
- Conserver les identifiants existants, y compris les préfixes `plugin:`, mais cesser d’utiliser les préfixes comme informations de type.
- Conserver le comportement de la commande textuelle `/approve`.
- Conserver les anciens champs d’URL de bouton/Web App et les actions de commande comme entrées de compatibilité du SDK de Plugin ; la nouvelle sortie du cœur est typée.
- Migrer tous les canaux intégrés et les appelants internes dans la même modification des actions typées.
- Ajouter une entrée au journal des modifications pour la nouvelle URL/page et pour la modification ultérieure du comportement d’expiration du délai.
- Ne pas ajouter de paramètre de mode de sollicitation.

## Déploiement

### PR 1 : cycle de vie durable

- Cette note de conception.
- Schéma SQLite partagé, génération Kysely, stockage et élagage après 30 jours.
- Service d’approbation du Gateway, passerelle d’attente d’exécution et gestion des éléments orphelins après redémarrage.
- `approval.get/resolve` unifié.
- Adaptateurs de méthodes exec/Plugin.
- Tests de priorité à la première réponse, d’idempotence, d’expiration, d’autorisation et de consommation.
- Aucun changement du comportement de l’interface utilisateur ou des canaux pour le moment.

### PR 2 : actions typées et rappels de canaux

- Actions typées d’approbation, d’URL et de Web App.
- Générateurs de présentation du cœur et exportations du SDK de Plugin.
- Encodage des rappels privé au transport avec type de propriétaire explicite.
- Références de rappel durables de taille fixe pour les identifiants canoniques dépassant les limites du transport.
- Migration des canaux intégrés pour abandonner l’inférence à partir du texte de commande et de l’identifiant d’approbation.
- Vérité canonique de la première réponse sur la surface activée et mises à jour terminales natives actives au mieux ; la finalisation durable des messages de canal reste un suivi.
- Tests du SDK et des canaux intégrés.

### PR 3 : lien profond vers l’interface de contrôle

- Page d’approbation authentifiée autonome et routage de démarrage tenant compte du chemin de base.
- Liaison au Gateway de service sans modifier la sélection distante enregistrée par l’opérateur.
- Espace de noms HTTP d’approbation détenu par le cœur, y compris pour les identifiants de type ressource.
- Charge utile d’URL créée par le Gateway et interrogation de l’état en attente jusqu’à la livraison des événements de cycle de vie.
- Preuves pour la largeur mobile, la reconnexion, les réponses concurrentes, le rechargement et le chemin monté.

### PR 4 : clients natifs

- Les surfaces de revue iOS et Android utilisent `approval.get/resolve` en tenant compte du type ; watchOS relaie les invites et décisions sûres pour le réviseur via l’iPhone jumelé.
- La Watch propose les décisions exec prises en charge par son contrat de relais compact : autoriser une fois et refuser.
- La vérité terminale canonique de la première réponse remplace l’état local de tentative de décision.
- Les accusés de réception de résolution perdus ou ambigus figent les contrôles jusqu’à la relecture canonique.
- Les instances Gateway v4 précédemment livrées conservent la revue exec grâce à un mécanisme de repli limité vers l’ancienne méthode ; l’état terminal conservé entre les surfaces nécessite les méthodes unifiées.
- Les avertissements destinés au réviseur et le contexte du propriétaire restent visibles sur iPhone, Watch et Android.
- Tests unitaires natifs, compilation et preuves propres aux plateformes.

### PR 5 : propagation du cycle de vie aux ancêtres

- Livraison des états en attente/terminaux de `session.approval` à partir de l’instantané d’audience persisté dans la PR 1.
- Abonnement à la session exacte, rejeu lors de la reconnexion et marqueurs terminaux de suppression sans mutation de la transcription ni réveil de l’agent.
- Les rappels de cycle de vie s’exécutent après l’insertion durable/CAS et ne deviennent jamais l’autorité d’approbation.
- Preuves pour les sous-agents imbriqués et la reconnexion.

### PR 6 : comportement restrictif par défaut

- Migrer `node-invoke-plugin-policy.ts` et le courtier de Plugin intégré pour éliminer l’autorité dupliquée.
- Sémantique stricte de l’expiration du délai, des données mal formées, de l’absence de route, de la liaison et de la consommation de l’autorisation unique.
- Déprécier les paramètres permissifs d’expiration du délai déjà livrés sans les respecter une fois qu’une demande est en attente.
- Preuves de concurrence entre plusieurs surfaces et d’injection de défaillances.

### Suivi : nettoyage durable des messages distants

- Conserver les localisateurs de livraison transférée et finaliser chaque message de canal livré après un redémarrage.
- Maintenir ce cycle de vie du transport séparé de l’autorité d’approbation canonique et des actions de présentation typées.

## Tests

Couverture ciblée requise :

- La réouverture de SQLite préserve les projections en attente et finales.
- Deux résolveurs simultanés produisent exactement un gagnant CAS.
- Une nouvelle tentative avec la même décision réussit de manière idempotente ; une nouvelle tentative conflictuelle renvoie le gagnant enregistré.
- Une résolution à l’échéance ou après celle-ci ne peut pas approuver.
- `allow-once` ne peut être consommé qu’une seule fois, sans effacer l’état d’audit final.
- Le démarrage annule les époques d’exécution antérieures.
- Une consultation et une résolution non autorisées ne révèlent pas l’existence de l’enregistrement.
- Comportement de la liste d’autorisation explicite des réviseurs et de l’autorisation générale associée `operator.approvals`.
- Les anciennes méthodes d’exécution et de Plugin partagent le même stockage.
- Schémas de demande, de liste, de consultation et de résolution du Gateway, ainsi que charges utiles d’événements additives.
- Normalisation des actions typées, rendu de secours, exports du SDK et commutateurs des canaux intégrés.
- L’encodage des rappels Telegram contient des données privées au transport et aucune inférence à partir de chaînes de commande.
- Enfant direct, propriétaires contrôleur/demandeur ramifiés, propriétaires imbriqués, réaffectation, repli sur le champ de session, cycle et limite de taille de l’audience.
- Les tableaux d’audience demandée et finale sont identiques.
- Les projections des propriétaires n’entraînent aucune modification de la transcription ni aucun réveil de l’agent.
- La route de l’interface de contrôle fonctionne sur `/` et sur un chemin de base configuré ; l’actualisation affiche l’état réel en attente ou final.
- Les réponses simultanées de l’interface de contrôle et de Telegram produisent un seul gagnant et indiquent « résolu ailleurs » au perdant.
- Les identifiants d’approbation natifs et les identifiants de propriétaire du Gateway préservent exactement les octets UTF-8 lors du routage et de la réconciliation.
- La négociation de la famille RPC native fixe une seule famille canonique ou ancienne par route de Gateway admise et ne revient jamais silencieusement à une version antérieure après utilisation.
- La perte des accusés de réception de résolution native bloque les actions jusqu’à la relecture canonique ; l’échec de la relecture ne peut ni fabriquer un gagnant ni accuser réception d’une actualisation de la Watch.
- La corrélation des demandes d’instantané de la Watch n’est acceptée que pour le propriétaire de Gateway associé exact et après une relecture canonique terminée sur l’iPhone.
- Preuve du parcours utilisateur via Testbox/Crabbox, comprenant une page d’approbation adaptée à la largeur d’un mobile, le nettoyage des actions Telegram et un aller-retour attente/résolution/perdant tardif sur Android, iPhone et Watch.

## Observabilité

Émettre des journaux de transition structurés et sans contenu, avec l’identifiant d’approbation, le type, la clé de session source, l’état, la raison et la latence. Ne jamais journaliser l’aperçu ni la liaison brute.

Suivre :

- le nombre de demandes par type ;
- le nombre d’états finaux par type/état/raison ;
- la jauge des demandes en attente ;
- la latence entre la demande et l’état final ;
- les résultats des courses de résolution : gagnant, nouvelle tentative idempotente, conflit, expiration ;
- le nombre de routes de livraison et les refus dus à l’absence de route ;
- les annulations des éléments orphelins au démarrage ;
- la taille de l’audience.

Une transition validée constitue une réussite même si la livraison ultérieure de l’événement échoue. Les abonnés au cycle de vie récupèrent via la relecture de la PR 5 et la consultation canonique. La finalisation durable des messages de canal reste le suivi distinct mentionné ci-dessus.

## Décisions en suspens

1. **Origine de l’interface de contrôle accessible depuis l’extérieur.** Chaque instantané contient le `urlPath` relatif stable. Une URL absolue ne peut être annoncée qu’à partir d’un emplacement Tailscale Serve/Funnel mis en cache après la réussite de l’exposition du Gateway ; `allowedOrigins`, les en-têtes Host des requêtes, `gateway.remote.url` et les candidats loopback/LAN destinés uniquement à l’affichage ne sont pas des origines canoniques. Telegram peut utiliser son enveloppe Mini App authentifiée pour conserver le chemin d’approbation pendant l’amorçage. Les proxys inverses arbitraires restent limités aux chemins relatifs jusqu’à l’existence d’un contrat explicite d’URL publique ayant fait l’objet d’un examen distinct. Ne jamais laisser un canal deviner l’origine.
2. **Transition de compatibilité pour le délai d’expiration strict de l’exécution.** Les délais d’expiration des approbations de Plugin échouent désormais en mode fermé et `timeoutBehavior` est obsolète. Le contrat livré restant `askFallback` nécessite un examen explicite par les responsables et l’équipe de sécurité, une entrée dans le journal des modifications, de la documentation ainsi qu’une décision de migration ou d’obsolescence avant qu’il cesse d’autoriser l’exécution après l’expiration d’une demande en attente.
3. **Mode intégré sans Gateway.** Recommandation : le conserver initialement en local uniquement, puis en faire un client du service canonique lorsqu’un Gateway existe. Ne pas annoncer de lien profond qu’aucun serveur ne peut résoudre.
