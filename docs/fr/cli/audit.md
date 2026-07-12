---
read_when:
    - Vous devez déterminer qui a exécuté un agent ou un outil, quand il a été exécuté et comment son exécution s’est terminée.
    - Vous avez besoin de métadonnées de cycle de vie des messages entrants ou sortants, sans contenu
    - Vous avez besoin d’un export d’activité limité et compatible avec la suppression des données sensibles
summary: Référence de la CLI pour les enregistrements d’audit du cycle de vie des exécutions, des outils et des messages contenant uniquement des métadonnées
title: Journaux d’audit
x-i18n:
    generated_at: "2026-07-12T15:13:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: da9df6f388b0a24c3b79d755fa59d047cce99262bc6d9c890be7a83da75693a8
    source_path: cli/audit.md
    workflow: 16
---

# `openclaw audit`

Interrogez le registre d’audit du Gateway, limité aux métadonnées, pour les exécutions d’agents, les actions d’outils et les enregistrements facultatifs du cycle de vie des messages.

Le registre est activé par défaut pour les événements d’exécution et d’outil. Définissez
[`audit.enabled: false`](/fr/gateway/configuration-reference#audit), puis redémarrez le
Gateway pour arrêter tout nouvel enregistrement d’événement. Les enregistrements de messages sont désactivés séparément par
défaut ; définissez `audit.messages` sur `direct` ou `all`, puis redémarrez le Gateway pour
les enregistrer. Les enregistrements existants restent interrogeables jusqu’à leur expiration (30 jours).

Le registre est distinct des transcriptions de conversations : il enregistre l’identité,
l’ordre, la provenance, l’action, l’état et les codes de résultat normalisés, mais ne
stocke jamais le contenu, et les identifiants de messages apparaissent uniquement sous forme de
pseudonymes à clé locaux à l’installation. [L’historique d’audit](/fr/gateway/audit) décrit le modèle de données complet,
la sémantique de confidentialité, les limites de stockage et de conservation ainsi que les limites de couverture ; cette page
présente l’interface de commande.

```bash
openclaw audit
openclaw audit --agent main --status failed
openclaw audit --session "agent:main:main" --after 2026-07-01T00:00:00Z
openclaw audit --run 8c69f72e-8b11-4c54-98d5-1a3dd67450c3
openclaw audit --kind tool_action --limit 50 --json
openclaw audit --kind message --direction outbound --channel telegram --json
```

## Filtres

- `--agent <id>` : identifiant exact de l’agent
- `--session <key>` : clé de session exacte
- `--run <id>` : identifiant exact de l’exécution
- `--kind <kind>` : `agent_run`, `tool_action` ou `message`
- `--status <status>` : `started`, `succeeded`, `failed`, `cancelled`,
  `timed_out`, `blocked` ou `unknown`
- `--direction <direction>` : direction du message, `inbound` ou `outbound`
- `--channel <channel>` : canal de message exact
- `--after <timestamp>` / `--before <timestamp>` : horodatage ISO inclusif ou
  millisecondes Unix
- `--limit <count>` : taille de page de 1 à 500 ; valeur par défaut : `100`
- `--cursor <sequence>` : poursuivre une requête précédente triée du plus récent au plus ancien
- `--json` : afficher la page limitée au format JSON

La CLI interroge la RPC d’activité versionnée afin qu’une seule commande affiche l’intégralité du
registre configuré. La sortie texte affiche l’heure, le type, la direction, le canal, l’état,
l’agent, l’exécution et l’action. Une provenance de message manquante est affichée sous la forme `-` ; OpenClaw
n’invente pas d’identifiants d’agent ou d’exécution. Les actions d’outils affichent également le nom de l’outil. La sortie
JSON inclut `nextCursor` lorsqu’une autre page existe. Transmettez cette valeur à
`--cursor` pour continuer sans réordonner les enregistrements qui arrivent pendant la pagination.

Ces exportations restent des métadonnées opérationnelles sensibles, même si le corps des messages
et les champs d’identité bruts des messages sont absents. Les identifiants d’agent, de session et d’exécution, la chronologie,
les canaux, les résultats et les références HMAC stables peuvent permettre de corréler l’activité. Protégez-les
avec les mêmes contrôles d’accès et pratiques de conservation que les autres enregistrements
opérationnels.

## Événements enregistrés

Le Gateway projette les flux de cycle de vie fiables en six actions :

- `agent.run.started`
- `agent.run.finished`
- `tool.action.started`
- `tool.action.finished`
- `message.inbound.processed`
- `message.outbound.finished`

Chaque enregistrement renvoyé possède un identifiant d’événement stable, une séquence de registre
croissante de façon monotone, un horodatage de cycle de vie, un acteur, une action, un état, un
marqueur `schemaVersion: 1`, une séquence source et `redaction: "metadata_only"`.
La provenance de l’agent, de la session et de l’exécution ainsi que les champs propres à l’événement sont présents uniquement lorsque
la source fiable les fournit. Les enregistrements de messages omettent intentionnellement
`sessionKey` et `sessionId` ; les filtres `--session` s’appliquent donc uniquement aux enregistrements d’exécution et d’outil.

Les enregistrements terminaux d’exécution et d’outil distinguent la réussite, l’échec, l’annulation,
l’expiration du délai et les blocages par stratégie au moyen d’états et de codes d’erreur fermés. `unknown` est un
résultat explicite autre qu’une réussite lorsqu’un environnement d’exécution en amont n’expose pas de
résultat terminal faisant autorité. Les identifiants d’appels d’outils sont exportés uniquement sous forme d’empreintes
stables. Les noms d’outils doivent respecter le contrat de nom compact présenté au modèle ;
les autres valeurs deviennent `unknown`.

Les enregistrements de messages ajoutent la direction, le canal, le type de conversation, le résultat et,
facultativement, le type de livraison, l’étape de l’échec, la durée, le nombre de résultats, le code de
motif normalisé ainsi que les pseudonymes à clé du compte, de la conversation, du message et de la cible. La
limite entrante actuelle couvre les messages acceptés qui atteignent la distribution du cœur,
y compris les doublons du cœur et les résultats terminaux du traitement. La limite
sortante écrit une ligne terminale par charge utile de réponse logique d’origine qui atteint
la livraison durable partagée ; le découpage en segments et la diffusion par les adaptateurs sont agrégés dans
`resultCount`. Les envois en file d’attente pouvant être retentés ou ambigus ne sont enregistrés qu’après qu’un
accusé de réception, une lettre morte ou une réconciliation rend le résultat terminal.
Les chemins locaux aux Plugins et les chemins d’envoi direct qui contournent ces limites partagées ne sont
pas encore couverts ; l’absence d’une ligne ne prouve pas qu’aucun message n’a existé.

Le registre d’audit ne remplace pas les transcriptions, l’historique des tâches, l’historique des exécutions Cron
ni les journaux. Il fournit un petit index inter-exécutions pour les questions des opérateurs sans
copier le contenu des conversations dans un autre stockage.

Pour les lignes entrantes, `durationMs` mesure la distribution du cœur et `resultCount` compte
les charges utiles finalisées d’outil, de blocage et de réponse placées en file d’attente. Pour les lignes sortantes,
`durationMs` inclut la prise en charge de la livraison jusqu’à son état terminal (et donc
le temps d’attente en file), tandis que `resultCount` compte les envois physiques identifiés sur la
plateforme. Lorsqu’il est présent, `deliveryKind` décrit la charge utile effective après les hooks et
après le rendu ; les lignes supprimées et celles rendues ambiguës par un plantage l’omettent.

## RPC du Gateway

`audit.activity.list` nécessite `operator.read` et accepte les mêmes filtres. Cette méthode
renvoie l’union nommée des événements d’activité V1, notamment les enregistrements d’exécution, d’outil, de message entrant
et de message sortant.

```bash
openclaw gateway call audit.activity.list --params '{"channel":"telegram","limit":50}'
```

Le résultat est `{ "events": AuditActivityEventV1[], "nextCursor"?: string }`.
Les résultats sont triés du plus récent au plus ancien et limités à 500 enregistrements par requête.

La RPC `audit.list` livrée reste inchangée pour les anciens clients d’exécution et d’outil. Lorsque
`audit.activity.list` n’est pas disponible sur un Gateway plus ancien, la CLI réessaie avec
`audit.list` uniquement si chaque filtre demandé est pris en charge par cette ancienne méthode. `--kind message`,
`--direction` et `--channel` échouent avec un message demandant une mise à niveau sur un Gateway plus ancien
au lieu d’être ignorés silencieusement.

## Pages connexes

- [Historique d’audit](/fr/gateway/audit)
- [Protocole du Gateway](/fr/gateway/protocol#audit-ledger-rpc)
- [Sessions](/fr/cli/sessions)
- [Tâches](/fr/cli/tasks)
- [Tâches Cron](/fr/automation/cron-jobs)
