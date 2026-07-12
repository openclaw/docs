---
read_when:
    - Conception du comportement de découverte, de reprise ou d’archivage des sessions Codex
    - Modification de l’interface utilisateur native du catalogue de sessions ou des RPC du Gateway
    - Extension de la supervision de Codex aux nœuds appariés
summary: Architecture et périmètre du produit pour superviser les sessions Codex natives depuis OpenClaw.
title: Supervision de Codex
x-i18n:
    generated_at: "2026-07-12T15:50:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 78528afd31c18fc84e0adb6479a688da7df6d0a5c04e539d253c84d3a17a5f53
    source_path: specs/codex-supervision.md
    workflow: 16
---

# Supervision de Codex

## Objectif

La supervision de Codex permet à un opérateur OpenClaw de découvrir les sessions Codex natives et,
lorsque cela ne présente aucun risque, de créer une branche locale par l’intermédiaire de l’interface Chat habituelle d’OpenClaw.
Codex App Server reste propriétaire du fil de discussion et de la boucle du modèle. OpenClaw fournit le
catalogue du parc, l’interface opérateur authentifiée, la liaison des sessions et la distribution aux canaux.

La fonctionnalité appartient au plugin officiel `codex`. Il n’existe aucun plugin
Supervisor distinct ni de seconde implémentation du protocole Codex.

## Périmètre du produit

Le catalogue est enregistré dès que le plugin Codex est actif. Activez les outils de
supervision destinés aux agents avec :

```text
plugins.entries.codex.config.supervision.enabled = true
```

Le produit initial actif est volontairement plus restreint que le plan à long terme
pour le parc :

- Répertorier uniquement les fils de discussion Codex non archivés.
- Regrouper les lignes locales et celles des nœuds appairés ayant accepté de participer selon une identité d’hôte stable.
- Créer une branche Chat normale, verrouillée sur le modèle, à partir d’un fil de discussion stocké ou inactif local au Gateway,
  démarrer son fil de discussion complet du harnais Codex au premier tour, ou ouvrir le Chat
  créé pour une branche antérieure.
- Archiver un fil de discussion stocké ou inactif local au Gateway uniquement après confirmation explicite
  qu’aucun autre exécuteur n’est présent.
- Afficher les sources locales actives sans commandes de création de branche ni d’archivage, tout en
  permettant l’ouverture d’un Chat supervisé existant.
- Afficher les lignes les plus récentes de chaque hôte dans la barre latérale principale, conserver le catalogue complet sur
  la page des sessions et fournir des lectures de transcription bornées et paginées par curseur pour
  les lignes locales et celles des nœuds appairés.
- Isoler les défaillances du catalogue par hôte.

Le catalogue constitue la collection non archivée. Une ligne qu’il contient peut néanmoins avoir un
état de tour inactif, actif, `notLoaded` ou en erreur.

La supervision destinée aux agents reste facultative. L’intégration guidée tente de l’installer et de l’activer
après la détection réussie de l’installation native de Codex et lorsque le backend d’inférence sélectionné
réussit sa vérification en direct, indépendamment du backend principal choisi par l’utilisateur.
La supervision ne s’active que lorsque cette configuration opportuniste du plugin
réussit. Un plugin explicitement désactivé, un blocage par une politique ou
`supervision.enabled: false` reste déterminant pour les outils de supervision, mais
ne désactive pas le catalogue des sessions de l’opérateur.

## Propriété

Le plugin `codex` possède tous les comportements de Codex App Server :

- découverte des points de terminaison et cycle de vie des connexions
- initialisation du protocole et vérifications de version
- liste, lecture, reprise, archivage et gestion des événements des fils de discussion
- passerelles d’approbation et de saisie utilisateur
- liaisons des fils de discussion natifs aux sessions OpenClaw
- application exclusive du modèle et du harnais Codex après la continuation

La Control UI et le Gateway consomment ce service appartenant au plugin. Ils ne lisent pas
directement les fichiers de déploiement Codex et n’implémentent pas un autre client App Server.

La topologie locale par défaut est :

```text
Codex Desktop -> App Server stdio privé -> répertoire personnel Codex de l’utilisateur
                                             ^
Plugin Codex d’OpenClaw -> connexion App Server de supervision
  (utilise par défaut un stdio géré dans le répertoire personnel de l’utilisateur ; les paramètres appServer explicites sont respectés)
  -> catalogue passif des sources et lecture
  -> épinglage de l’instantané -> branche canonique de source appServer
  -> injection de l’historique visible et chaque tour ultérieur du Chat supervisé

Sessions Codex OpenClaw ordinaires -> stdio géré dans le répertoire personnel de l’agent par défaut
  -> fils de discussion ordinaires du harnais complet -> Chat OpenClaw et distribution aux canaux
```

L’activation de la supervision ne modifie pas le harnais Codex ordinaire : il reste
limité à l’agent par défaut. La connexion de supervision distincte utilise par défaut
un stdio géré dans le répertoire personnel de l’utilisateur, afin que ses opérations de catalogue et d’instantané voient les fils de discussion natifs
stockés. Les paramètres de connexion `appServer` explicites sont respectés. Lorsque
`homeScope` n’est pas défini, la connexion de supervision le résout en `"user"` pour stdio
ou Unix et en `"agent"` pour WebSocket. Définissez explicitement `appServer.homeScope: "user"`
uniquement lorsque le harnais ordinaire doit également partager le répertoire personnel Codex natif.
Un Chat adopté depuis le groupe Codex de la barre latérale constitue l’exception : sa liaison privée
de supervision maintient les lectures de la source, la création de la branche canonique et les tours
ultérieurs sur la connexion de supervision. L’état en direct et la propriété restent
locaux au processus ; un fil de discussion inconnu du processus de supervision d’OpenClaw est `notLoaded`
même lorsque Codex Desktop l’exécute activement.

Codex dispose d’un démon local canonique expérimental avec un contrat d’amorçage distinct
géré par le programme d’installation. Cette fonctionnalité ne doit pas amorcer, revendiquer
ni supposer implicitement ce démon.

## Flux du catalogue

La méthode générique du Gateway `sessions.catalog.list` délègue au fournisseur de catalogue `codex`,
qui demande toujours `archived: false` ainsi que les types de sources interactives `cli` et `vscode`.
Elle combine :

1. Les résultats locaux au Gateway de `thread/list` provenant de l’App Server de supervision,
   qui utilise par défaut un stdio géré dans le répertoire personnel de l’utilisateur.
2. Les résultats `codex.appServer.threads.list.v1` de chaque nœud connecté ayant accepté de participer.

La sélection de la transcription utilise `thread/turns/list` avec `itemsView: "full"` localement ou
la commande versionnée `codex.appServer.thread.turns.list.v1` sur le nœud
sélectionné. Chaque réponse contient au maximum 20 tours persistés ainsi que des curseurs opaques
vers l’avant et l’arrière. La Control UI demande les pages de la plus récente à la plus ancienne, affiche chaque page dans
l’ordre chronologique et ajoute les pages plus anciennes au début. Elle ne revient jamais à une lecture
`thread/read` non bornée. OpenClaw rejette également toute page d’éléments sérialisée dépassant
20 MiB avant qu’elle puisse traverser le transport du nœud ou du Gateway.

L’implémentation native du nœud macOS appairé prend uniquement en charge une valeur non définie/par défaut ou
`appServer.transport: "stdio"` explicite avec une portée de supervision non définie/par défaut ou
`appServer.homeScope: "user"` explicite. Elle transmet les valeurs configurées `command`, `args`
et `clearEnv` normalisée au processus enfant. Avec `"unix"`, `"websocket"`
ou `homeScope: "agent"` explicite, elle n’annonce ni la capacité de catalogue
ni la commande ; l’invocation directe échoue également de manière fermée. Elle ne doit jamais exposer le répertoire personnel
Codex de l’utilisateur pour une configuration limitée à l’agent ni substituer un stdio local à un
point de terminaison explicite.

La projection du catalogue normalise les identifiants, le titre, le cwd, l’état, les indicateurs d’attente
active, les horodatages, la source, le fournisseur du modèle, la version de Codex et la branche Git. Elle
ne renvoie pas d’aperçus de transcription, de tours, de chemins de déploiement, de chemins du répertoire personnel Codex,
de dépôts Git distants, de SHA de commits, de points de terminaison bruts ni d’erreurs App Server brutes. Les réponses de
transcription contiennent uniquement la page d’éléments App Server explicitement demandée et ses
curseurs opaques.

Les défaillances d’hôte restent locales à chaque résultat d’hôte. Un nœud hors ligne ou un App Server
local indisponible n’efface pas les hôtes opérationnels de la page. La connectivité est une
propriété de l’hôte, et non un état du fil de discussion : un résultat d’hôte en échec ne contient aucune
ligne de session récente et ne projette pas `offline` sur les fils de discussion natifs.

La découverte du catalogue est passive. La liste ou la lecture des métadonnées ne doit pas appeler
`thread/resume`, abonner le client OpenClaw aux requêtes de fil de discussion en direct ni
répondre à une approbation.

La recherche porte uniquement sur le titre et ne tient pas compte de la casse. Pour chaque page de catalogue renvoyée, le
Gateway et le Mac appairé analysent un nombre borné de pages natives sans transmettre
la requête à App Server, car la recherche native peut également correspondre aux aperçus de transcription.
Le curseur natif renvoyé permet aux appelants de poursuivre l’analyse.

## Périmètre de la CLI opérateur

Le plugin enregistre trois commandes shell reposant sur le Gateway :

```text
openclaw codex sessions [--search <text>] [--host <id>] [--limit <count>] [--cursor <cursor>] [--json] [gateway-options]
openclaw codex continue <thread-id> [--json] [gateway-options]
openclaw codex archive <thread-id> --confirm-no-other-runner [--json] [gateway-options]
```

`[gateway-options]` correspond à `--url <url>`, `--token <token>`, `--timeout <ms>` et
à l’option héritée `--expect-final`. La liste des sessions utilise par défaut 75,000 ms ;
la continuation et l’archivage utilisent par défaut 30,000 ms ;
`--expect-final` n’a aucun effet supplémentaire pour ces RPC unaires. La recherche de sessions
porte uniquement sur le titre et ne tient pas compte de la casse ; chaque réponse analyse une chaîne bornée de pages
natives, et `--cursor` poursuit avec les résultats plus anciens. La limite par défaut est de 50 par hôte
et accepte les valeurs de 1 à 100, et un curseur nécessite une destination `--host`
stable. Aucune commande n’accepte
d’option archived/include-archived. Seule `sessions` peut cibler des hôtes appairés ;
`continue` et `archive` envoient toujours `hostId: "gateway:local"`, et l’archivage
nécessite l’indicateur de confirmation explicite.

L’espace de noms du shell n’est pas l’espace de noms d’exécution `/codex` dans le Chat. En
particulier, `/codex sessions --host <node>` répertorie les fichiers de session de la CLI Codex sur un
nœud, `/codex threads` répertorie les fils de discussion App Server de la connexion de la conversation
actuelle, et `/codex resume` ou `/codex bind` modifie la liaison de cette conversation.
Ces commandes ne remplacent pas `sessions.catalog.continue`, et il n’existe
aucune commande d’exécution `/codex continue` ou `/codex archive`.

## Continuation locale

Pour une ligne stockée ou inactive locale au Gateway, l’interface appelle
`sessions.catalog.continue` avec `catalogId: "codex"` ainsi que les identifiants de l’hôte et du fil de discussion.
Le plugin :

1. Réutilise le Chat supervisé existant lorsque la source en possède déjà un.
2. Sinon, projette l’historique borné de l’utilisateur et de l’assistant jusqu’au dernier tour
   terminal persisté de la source (terminé, interrompu ou en échec) dans un nouveau
   Chat OpenClaw et enregistre une branche du harnais en attente.
3. Stocke la politique de verrouillage en attente limitée aux modèles Codex, et non une sélection concrète de modèle ou
   de fournisseur, ainsi que la portée privée de la connexion de supervision, puis
   renvoie la `sessionKey` OpenClaw.

La projection de l’historique sélectionne la portion la plus récente des messages visibles de l’utilisateur et de l’assistant,
avec des limites strictes de 200 messages, de 512 KiB de texte UTF-8 au total et de
64 KiB par message. Elle remplace les entrées d’image et d’image locale par
`[Image attachment]`, ne copie jamais les charges utiles ni les chemins des images, et omet le raisonnement,
les appels d’outils et les résultats d’outils.

L’interface accède au Chat normal avec cette clé de session. Aucun fil de discussion canonique du harnais
n’existe encore. Lors du premier tour normal du Chat, le harnais installe les véritables
gestionnaires Codex d’approbation, de sollicitation, d’événements et de distribution, puis :

1. Utilise la connexion de supervision pour appeler la commande native `thread/fork` sans remplacement
   du modèle ni du fournisseur et épingle l’instantané persisté de la source. L’état actuel de
   `ConfigManager` de Codex sélectionne le modèle et le fournisseur, et la réponse du fork
   indique la paire réelle. Si le modèle diffère du dernier modèle enregistré
   dans la source, Codex émet son avertissement normal de différence de modèle.
2. Sur cette même connexion, démarre le fil de discussion canonique du harnais Codex complet avec
   `threadSource: "appServer"`, le cwd, la politique, la configuration et l’environnement d’OpenClaw,
   l’ensemble complet des outils du harnais OpenClaw, et exactement le modèle et le fournisseur
   renvoyés par le fork pour ce démarrage initial.
3. Injecte l’historique borné visible de l’utilisateur et de l’assistant par cette
   connexion, valide la liaison canonique sans supprimer sa portée de supervision,
   exécute le tour et archive le fork temporaire.

Avant le premier tour, le Chat est une branche en attente verrouillée avec un miroir visible
de l’historique ; ensuite, chaque tour du modèle s’exécute par l’intermédiaire du fil de discussion canonique du
harnais Codex sur la connexion de supervision. La branche n’est pas un clone complet du déploiement
natif : le raisonnement, les appels d’outils et les résultats d’outils de la source sont délibérément
omis. Si l’épinglage de l’instantané ou la création du fil de discussion canonique échoue, la branche
en attente reste réessayable. Une concurrence de liaison, une supervision désactivée ou une connexion
de supervision indisponible ou incompatible entraîne un échec fermé avant l’exécution du tour
au lieu de revenir au harnais ordinaire du répertoire personnel de l’agent.

Cela garantit une sélection appartenant à Codex, et non la conservation du modèle
historique de la source. La paire renvoyée par le fork est utilisée pour démarrer le fil de discussion
canonique, et Codex conserve le modèle et le fournisseur natifs de ce fil. Les reprises ultérieures
omettent les remplacements de modèle et de fournisseur OpenClaw, afin que Codex restaure la paire persistée.
Si un contrôle Codex natif distinct modifie le fil de discussion canonique, OpenClaw accepte
cette sélection native persistée. Le modèle OpenClaw externe et la chaîne de repli
ne s’y substituent jamais.

Les changements de modèle, la suppression de session et les opérations de réinitialisation/création de session échouent de manière sûre
pour le Chat supervisé verrouillé sur un modèle. Les opérations de mutation `/codex model <model>`, `/codex
bind`, `/codex resume` (y compris `--bind here` du Node) et `/codex detach` ou
`/codex unbind` échouent également de manière sûre, car elles remplacent ou effacent la liaison. La
requête `/codex model` et les commandes `/codex fast`, `/codex permissions` et `/codex
threads` restent disponibles. L’outil d’agent `codex_threads` ne peut pas rattacher un nouveau
fork ni archiver le thread natif lié. La liste et la lecture des seules métadonnées restent
disponibles ; les champs de transcription nécessitent `supervision.allowRawTranscripts`, tandis que
le renommage, la désarchivation, le fork détaché et l’archivage d’un thread sans rapport nécessitent
`supervision.allowWriteControls`. Aucune de ces options ne peut remplacer la liaison verrouillée.
La suppression ou la réinitialisation de l’entrée OpenClaw supprimerait autrement la liaison
native et créerait ou autoriserait un thread générique derrière une session ayant l’apparence de Codex.
La maintenance de la rétention préserve donc les entrées verrouillées sur un modèle, même lorsqu’elles
dépassent les limites ordinaires d’âge, de nombre ou de budget disque. La désactivation ou la désinstallation du
Plugin propriétaire conserve également le verrou et le marqueur de propriété du Plugin. Le Chat reste
indisponible et échoue de manière sûre jusqu’à ce que le même Plugin soit réactivé ; le nettoyage ne le
convertit jamais en session de modèle ordinaire.

Cette action ne reprend ni ne modifie jamais la source. Le fork temporaire épingle un
instantané ; il ne constitue pas le thread de continuation durable. Le démarrage d’un thread de harnais
canonique distinct au premier tour empêche OpenClaw de devenir un
rédacteur concurrent de la source simplement parce que l’état local au processus n’a pas détecté un
tour appartenant à Desktop. Le miroir de l’historique visible et l’instantané épinglé peuvent omettre du travail
qui n’est pas encore terminé dans une source active. La source CLI ou VS Code
d’origine reste admissible dans les catalogues natif et OpenClaw. La branche canonique
reste un thread Codex natif dans le magasin de supervision, mais les clients natifs
peuvent filtrer son type de source `appServer` ; la visibilité dans Codex Desktop n’est donc pas
un contrat.

## Comportement de l’archivage

Pour une ligne stockée ou inactive locale au Gateway, `sessions.catalog.archive` avec
`catalogId: "codex"` nécessite
une valeur explicite `confirmNoOtherRunner: true`, relit l’état local au processus
actuel, ne poursuit que pour `idle` ou `notLoaded`, appelle la commande native `thread/archive`
et ne renvoie un succès qu’après l’acceptation de l’opération par Codex. La ligne quitte alors
le catalogue non archivé.

Un état actif ou d’erreur issu de la nouvelle lecture entraîne le refus de l’archivage. Il en va de même pour une
branche supervisée en cours d’initialisation ou en attente issue de la source : le premier tour de Chat
doit matérialiser sa branche canonique avant que la source puisse être archivée. Un
propriétaire de liaison OpenClaw actif connu pour la cible exacte ou tout descendant créé
non archivé entraîne également le refus de l’archivage. OpenClaw pagine la relation expérimentale
`thread/list ancestorThreadId` de Codex et échoue de manière sûre en cas d’erreur de requête ou de réponse,
de cycle de curseur ou de thread, et d’épuisement de la limite de sécurité. L’archivage natif peut
arrêter le travail chargé du parent et des descendants ; l’archivage n’est donc pas un raccourci
d’interruption. Les appels de lecture, d’énumération des descendants et d’archivage ne sont pas atomiques.
Un client indépendant peut encore posséder ou démarrer du travail sur une ligne qui semble inactive ou
`notLoaded` localement. La confirmation qu’aucun autre exécuteur n’existe couvre les clients inconnus et
cette condition de concurrence jusqu’à ce que Codex dispose d’un archivage conditionnel ou d’un bail interprocessus.
L’archivage d’un Node appairé est interdit.

Le catalogue Codex ne comporte aucune vue des éléments archivés. Un thread restauré avec
`thread/unarchive` dans une autre surface Codex autorisée par le propriétaire redevient admissible
dans le catalogue non archivé.

## Sécurité des threads actifs

Codex sérialise les mutations d’un thread entre les clients d’un même App Server, mais il
n’expose aucun bail exclusif interprocessus pour l’exécuteur ou le propriétaire des approbations.
Des App Servers stdio indépendants peuvent ajouter du contenu au même déroulé, tandis que chacun ne voit
que son propre état en mémoire. Les demandes d’approbation peuvent également parvenir à chaque abonné
d’un serveur, la première réponse valide mettant fin à la demande.

Par conséquent :

- les clients de catalogue passifs ne s’abonnent pas aux approbations et ne les refusent pas automatiquement
- les lignes actuellement signalées comme actives n’exposent ni nouvelle branche ni option d’archivage
- une source non mappée devient une branche de l’historique visible dont le thread de harnais
  canonique ne reprend jamais la source
- `notLoaded` est affiché comme une activité inconnue et ne peut être archivé qu’après
  confirmation éclairée qu’aucun autre exécuteur n’existe
- l’archivage local nécessite cette confirmation ainsi qu’une nouvelle lecture indiquant `idle` ou `notLoaded`,
  tout en reconnaissant la condition de concurrence du protocole entre la lecture et l’archivage

L’interruption et le transfert entre plusieurs clients sont des décisions produit futures. Elles ne sont pas
implicites dans l’affichage d’une ligne active.

## Limite des Nodes appairés

L’invocation de Node fonctionne actuellement uniquement en mode requête/réponse. Elle peut renvoyer en toute sécurité des
métadonnées de catalogue bornées et des pages de tours de transcription, mais elle ne peut pas transporter le flux d’événements
de longue durée, les demandes d’approbation, les appels d’outils, l’annulation et les deltas de l’assistant
nécessaires à une exécution du harnais Codex.

Le contrat du Node prend donc en charge les pages de liste et de tours de transcription. Les lignes
distantes restent lisibles, mais **Continuer** et **Archiver** sont indisponibles, quel que soit l’état d’inactivité. Une
véritable continuation distante nécessite un exécuteur côté Node et un pont de diffusion en continu qui
préserve les mêmes invariants d’approbation et de liaison que le harnais local.

## Autorisations

Chaque ordinateur donne son consentement localement. L’activation du Gateway n’autorise pas un autre
Node à lire ses métadonnées Codex. La capacité du Node doit satisfaire aux règles normales d’appairage
et d’approbation de la politique de commandes.

La liste de la flotte et l’affichage des transcriptions utilisent la portée Gateway `operator.write`
car ils invoquent des Nodes appairés. La continuation et l’archivage locaux sont des
actions d’opérateur authentifiées et restent soumis aux vérifications de l’hôte et de l’état.

L’accès par agent autonome et par MCP autonome est distinct. Les contrats d’outils fournis
`codex_endpoint_probe`, `codex_sessions_list`, `codex_session_read`,
`codex_session_send` et `codex_session_interrupt` restent la propriété du Plugin
`codex`. Lorsque la supervision est activée, les lectures de transcription brutes de `codex_threads`
et les champs de liste dérivés des transcriptions nécessitent également
`supervision.allowRawTranscripts` ; chaque fork, renommage, archivage
ou désarchivage de `codex_threads` nécessite `supervision.allowWriteControls`. Les deux politiques sont
désactivées par défaut.

## Compatibilité

`openclaw doctor --fix` migre la configuration fournie `plugins.entries.codex-supervisor`,
y compris les points de terminaison et les politiques de transcription/écriture, ainsi que les références
d’autorisation/refus de Plugins, vers
`plugins.entries.codex.config.supervision`. Les valeurs de destination canoniques explicites
prévalent en cas de conflit. Le code d’exécution utilise uniquement la forme canonique du Plugin `codex`
après la migration.

Le Plugin officiel conserve exactement cinq outils de compatibilité Supervisor :
`codex_endpoint_probe`, `codex_sessions_list`, `codex_session_read`,
`codex_session_send` et `codex_session_interrupt`. Par défaut, la liste des sessions
est limitée aux sessions chargées ; il n’existe aucun paramètre `loaded_only`. `include_stored: true` ajoute
les lignes non archivées de la base de données d’état, limitées par point de terminaison par `max_stored_sessions`
(valeur par défaut : 200, plage acceptée : 1 à 1,000) ; les lignes chargées ne sont pas limitées par ce
paramètre. Les champs dérivés des transcriptions et les lectures restent soumis à
`allowRawTranscripts` ; l’envoi et l’interruption restent soumis à `allowWriteControls`.

L’envoi de compatibilité ne démarre ni ne reprend jamais un thread inactif. `mode: "start"` est
toujours refusé ; `"auto"` et `"steer"` ne pilotent qu’un tour actif lisible.
L’interruption nécessite également un tour actif lisible. La continuation inactive est dirigée
vers le catalogue Codex natif afin que le harnais complet gère les approbations, les outils et la liaison.
L’adaptateur MCP autonome hérité résout ces mêmes outils depuis le Plugin officiel
et constitue le seul chemin qui respecte les variables d’environnement de politique héritées conservées.

L’interface utilisateur du catalogue de juillet, la méthode Gateway, la capacité du Node et l’enregistrement CLI
n’avaient pas été fournis sous l’ancien identifiant de Plugin. Ils passent directement sous la propriété de `codex`
sans seconde façade d’exécution.

## Travaux futurs

- exécuteur de diffusion en continu côté Node et pont d’événements pour la continuation distante
- baux explicites d’exécuteur et de propriétaire des approbations pour le transfert simultané entre clients
- archivage distant après la mise en place d’un bail de propriété de l’exécuteur ou d’un cloisonnement équivalent
- interruption et observation plus riche des sessions actives
- transfert audité entre Codex Desktop, la CLI et OpenClaw

La consultation des éléments archivés ne fait pas partie de la barre latérale de supervision prévue. Les surfaces
Codex natives restent le moyen de récupération des threads archivés.

## Tests d’acceptation

- L’activation de la supervision répertorie les sessions locales non archivées.
- Les sessions archivées n’apparaissent jamais dans la réponse du catalogue ni dans l’interface utilisateur.
- Les hôtes sains restent visibles lorsqu’un autre hôte échoue ; un hôte indisponible
  ne renvoie aucune ligne récente au lieu d’inventer un état de session hors ligne.
- Une ligne locale stockée ou inactive crée un miroir de Chat avec un verrou de
  modèle/exécution exclusif à Codex ; le premier tour épingle un instantané temporaire et démarre le
  thread canonique du harnais complet, et une nouvelle utilisation de Continuer ouvre le Chat existant.
- Le premier tour omet les substitutions de modèle/fournisseur sur le fork de l’instantané et épingle
  le démarrage canonique à la paire exacte renvoyée par Codex, même lorsque Codex avertit
  que son modèle actuel diffère du dernier modèle enregistré de la source.
- Les liaisons supervisées en attente et validées utilisent la connexion de supervision pour
  l’accès à la source, la création de la branche canonique et chaque tour ultérieur ; les sessions
  Codex ordinaires restent limitées à l’agent.
- Les reprises ultérieures omettent les substitutions OpenClaw de modèle/fournisseur, préservent la
  sélection persistée canonique de Codex, acceptent des modifications natives distinctes apportées à ce thread
  et ne substituent jamais le modèle OpenClaw externe ni la chaîne de repli.
- La désactivation de la supervision ou la perte du cycle de vie de la liaison/connexion échoue de manière sûre
  au lieu de déplacer le Chat vers le harnais ordinaire du répertoire personnel de l’agent.
- Un Chat supervisé verrouillé sur un modèle ne peut pas être supprimé tant qu’il protège la liaison
  native.
- Le Chat reflète au maximum 200 messages utilisateur et assistant, 512 KiB au total et
  64 KiB par message. Les images deviennent des espaces réservés ; le raisonnement de la source, les appels d’outils,
  les résultats d’outils, les charges utiles d’images et les chemins locaux ne sont pas clonés.
- Le flux de branche ne reprend jamais le thread source.
- La source d’origine reste admissible dans les deux catalogues. La branche native canonique
  utilise le type de source `appServer` et son apparition dans Codex Desktop n’est pas garantie.
- Les sources locales actives ne peuvent pas créer de branche ni être archivées ; un Chat
  supervisé existant peut toujours être ouvert.
- Les lignes dont l’activité est inconnue peuvent créer une branche sans confirmation ; leur archivage nécessite
  une confirmation explicite qu’aucun autre exécuteur n’existe.
- Une source comportant une branche supervisée en cours d’initialisation ou en attente ne peut pas être archivée
  tant que le premier tour de Chat n’a pas matérialisé la branche canonique.
- Un propriétaire de liaison actif connu pour la cible exacte ou tout descendant créé
  non archivé bloque l’archivage ; les échecs d’énumération des descendants échouent de manière sûre, et
  la confirmation explicite reste responsable des clients inconnus et de la
  condition de concurrence entre l’état et l’archivage.
- L’archivage local confirmé d’une ligne stockée ou inactive supprime la ligne après le succès de l’opération native.
- Les lignes de Nodes appairés restent visibles sans Continuer ni Archiver.
- La liste passive ne s’abonne jamais aux approbations de threads et n’y répond jamais.
- La configuration Supervisor héritée est migrée vers la forme de configuration Codex canonique.
- La liste héritée est limitée aux sessions chargées par défaut, l’énumération des sessions stockées respecte sa limite
  par point de terminaison, et l’envoi de compatibilité ne démarre ni ne reprend jamais un thread inactif.
