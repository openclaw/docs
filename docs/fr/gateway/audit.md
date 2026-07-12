---
read_when:
    - Vous avez besoin d’un enregistrement durable des actions du Gateway sans stocker le contenu.
    - Vous décidez si vous souhaitez activer l’audit du cycle de vie des messages
    - Vous devez expliquer ce que les enregistrements d’audit prouvent et ne prouvent pas.
summary: Historique d’audit limité aux métadonnées pour les exécutions d’agents, les actions d’outils et les cycles de vie des messages avec consentement explicite
title: Historique d’audit
x-i18n:
    generated_at: "2026-07-12T15:24:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 1005b214a674f0f888d759837bd627be458cefcf9ed61bda722499333361dc45
    source_path: gateway/audit.md
    workflow: 16
---

# Historique d’audit

Le Gateway conserve un registre d’audit borné, contenant uniquement des métadonnées, dans la base de données d’état partagée d’OpenClaw. Il répond à des questions opérationnelles telles que « quel agent s’est exécuté, quand et comment son exécution s’est-elle terminée », « quelles actions d’outil une exécution a-t-elle effectuées » et, lorsque l’audit des messages est activé, « un message entrant accepté a-t-il atteint le dispatching » et « un message sortant a-t-il atteint un état final de livraison ».

Le registre stocke l’identité, l’ordre, la provenance, l’action, l’état et des codes de résultat normalisés. Il ne stocke jamais les prompts, le corps des messages, les arguments ou résultats des outils, les pièces jointes, les noms de fichiers, les URL, la sortie des commandes ni le texte brut des erreurs.

## Familles d’enregistrements

Les événements d’exécution et d’outil sont enregistrés chaque fois que l’audit est activé (comportement par défaut). Les événements du cycle de vie des messages sont facultatifs et désactivés par défaut.

| Famille          | Actions                                                  | Par défaut |
| ---------------- | -------------------------------------------------------- | ---------- |
| Exécutions d’agent | `agent.run.started`, `agent.run.finished`                | activé     |
| Actions d’outil  | `tool.action.started`, `tool.action.finished`            | activé     |
| Messages         | `message.inbound.processed`, `message.outbound.finished` | désactivé  |

Chaque enregistrement comporte un identifiant d’événement stable, une séquence de registre monotone, un horodatage du cycle de vie, un acteur, une action, un état, `schemaVersion: 1` et `redaction: "metadata_only"`. Consultez [Enregistrements d’audit](/fr/cli/audit) pour la référence complète des champs et les filtres de requête.

## Événements du cycle de vie des messages

Définissez [`audit.messages`](/fr/gateway/configuration-reference#audit) pour choisir ce qui est enregistré, puis redémarrez le Gateway :

- `off` (par défaut) : aucun enregistrement de message.
- `direct` : uniquement les messages des conversations directes.
- `all` : messages directs, de groupe et de canal.

Deux limites faisant autorité produisent des enregistrements de messages :

- Les lignes **entrantes** sont écrites lorsqu’un message accepté atteint le dispatching du cœur, y compris les résultats de traitement des doublons et les résultats finaux.
- Les lignes **sortantes** sont écrites lorsque la livraison durable partagée atteint un résultat final : envoyé, supprimé, échoué ou explicitement `unknown` pour les envois ambigus en raison d’un plantage. Les résultats de récupération de file d’attente et de mise en file des messages non distribuables sont inclus. Chaque charge utile de réponse logique d’origine produit une ligne finale ; le découpage et la distribution vers plusieurs adaptateurs sont agrégés dans `resultCount`.

### Classification du type de conversation

Le mode `direct` constitue une limite de confidentialité ; un message n’est donc classé comme conversation directe que lorsque les informations de destination le prouvent : le chemin d’envoi a déclaré le type de conversation de destination, ou la route de session de livraison nomme exactement le canal et le pair auxquels la livraison est destinée. Des signaux plus faibles, tels que l’état de la politique ou la conversation d’origine, peuvent classer un message comme `group` (et l’exclure de la collecte `direct`), mais ne peuvent jamais lui attribuer la classification `direct`. Les messages dont le caractère direct ne peut pas être prouvé sont classés `unknown` et ne sont pas enregistrés en mode `direct`. Les canaux qui ne déclarent pas les types de discussion peuvent donc enregistrer moins de lignes en mode `direct` qu’en mode `all`.

## Modèle de confidentialité

Les lignes de messages ne stockent jamais les identifiants bruts des plateformes. Les identifiants de compte, de conversation, de message et de cible, lorsque la corrélation est disponible, sont exportés uniquement sous forme de pseudonymes à clé propres à l’installation (`hmac-sha256:v1:<keyId>:<digest>`) :

- La clé HMAC est générée lors de la première utilisation, est séparée par domaine pour chaque type d’identifiant et réside dans la même base de données d’état que le registre.
- Les pseudonymes sont stables au sein d’une installation, de sorte que les lignes concernant la même conversation puissent être corrélées sans révéler l’identifiant de la plateforme.
- Il s’agit d’une **corrélation, et non d’une anonymisation** : toute personne disposant d’un accès en lecture à la base de données d’état possède également la clé et peut tester des identifiants bruts candidats par rapport aux pseudonymes. Les exportations RPC et CLI n’incluent jamais la clé.
- Si le matériel de clé est absent ou corrompu alors que des lignes de messages sont conservées, le Gateway échoue de manière sécurisée et abandonne les nouveaux enregistrements de messages au lieu d’effectuer silencieusement une rotation vers une nouvelle clé, ce qui scinderait la corrélation.

Les enregistrements d’exécution et d’outil conservent `sessionKey` et `sessionId` pour la corrélation ; les clés de session canoniques peuvent elles-mêmes contenir des identifiants de compte ou de pair de plateforme. Les enregistrements de messages omettent intentionnellement ces deux champs.

Les exportations d’audit restent des métadonnées opérationnelles sensibles, même sans contenu : les horaires, les canaux, les résultats et les pseudonymes stables peuvent permettre de corréler l’activité. Protégez les exportations avec les mêmes contrôles d’accès et pratiques de conservation que les autres enregistrements d’exploitation.

## Limites de couverture et de preuve

Le registre fonctionne au mieux et est délibérément borné. Considérez-le comme une preuve de ce qui a été enregistré, et non comme une preuve de ce qui s’est produit :

- **L’absence d’une ligne ne prouve rien.** Les rejets entrants avant admission, les envois provenant de processus CLI sans enregistreur Gateway actif et les chemins locaux aux plugins ou d’envoi direct qui contournent la livraison durable partagée ne laissent aucun enregistrement.
- Les écritures passent par un processus de travail en arrière-plan borné ; une défaillance du processus ou la saturation de la file d’attente entraîne l’abandon d’enregistrements et la journalisation d’un avertissement opérationnel.
- Les envois sortants ambigus en raison d’un plantage sont enregistrés comme `unknown` plutôt que d’avoir des résultats inventés.

Ce registre facilite le débogage et l’examen opérationnel. Il ne constitue pas une archive de conformité sans perte ; si vous en avez besoin, utilisez un système externe alimenté par [OpenTelemetry](/fr/gateway/opentelemetry) ou par des outils propres aux canaux.

## Stockage, conservation et migration

Les enregistrements résident dans la base de données d’état partagée (`state/openclaw.sqlite`) et sont écrits en dehors du chemin critique de livraison. Les requêtes ne renvoient jamais d’enregistrements datant de plus de 30 jours, et le registre est limité à 100,000 lignes ; les lignes expirées sont supprimées au démarrage, lors de la maintenance horaire et au cours des écritures ultérieures. La maintenance de la conservation continue de s’exécuter même lorsque la collecte est désactivée.

La mise à niveau depuis un Gateway utilisant l’ancien registre limité aux exécutions et aux outils migre automatiquement le schéma au démarrage (ou via `openclaw doctor --fix`) ; les lignes existantes et leurs séquences de registre sont conservées.

## Interrogation

- CLI : [`openclaw audit`](/fr/cli/audit) avec des filtres par agent, session, exécution, type, état, direction, canal, bornes temporelles et pagination par curseur.
- RPC du Gateway : `audit.activity.list` (requiert `operator.read`) renvoie l’union versionnée V1 des événements d’activité ; le RPC `audit.list` livré reste inchangé pour les anciens clients d’exécution et d’outil. Consultez le [Protocole du Gateway](/fr/gateway/protocol#audit-ledger-rpc).

## Contenu associé

- [CLI des enregistrements d’audit](/fr/cli/audit)
- [Référence de configuration](/fr/gateway/configuration-reference#audit)
- [Protocole du Gateway](/fr/gateway/protocol#audit-ledger-rpc)
- [OpenTelemetry](/fr/gateway/opentelemetry)
