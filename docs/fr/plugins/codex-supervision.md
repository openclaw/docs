---
read_when:
    - Vous souhaitez que les sessions Codex Desktop ou CLI apparaissent dans OpenClaw
    - Vous devez créer une branche à partir d’une session Codex locale enregistrée ou inactive, ou l’archiver.
    - Vous exposez les sessions Codex et l’historique des transcriptions à partir de nœuds appairés
sidebarTitle: Codex supervision
summary: Parcourez les sessions Codex natives non archivées et les transcriptions paginées sur les nœuds OpenClaw
title: Superviser les sessions Codex
x-i18n:
    generated_at: "2026-07-12T15:38:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: e9378214df3f400b793b4a2c7bd91fb607a73910d4046f69d26debe308869df6
    source_path: plugins/codex-supervision.md
    workflow: 16
---

La supervision de Codex est une fonctionnalité optionnelle du plugin officiel `codex`. Elle
affiche les sessions sources non archivées de Codex Desktop et de la CLI provenant de
l’ordinateur du Gateway et des ordinateurs appairés ayant donné leur accord dans la barre latérale
habituelle des sessions et le volet Chat.

La version initiale maintient volontairement un périmètre de responsabilité restreint :

- Une session locale stockée ou inactive peut créer un Chat OpenClaw verrouillé sur un modèle à partir
  de son historique persistant et limité de messages utilisateur et assistant. Le premier message crée
  un embranchement d’instantané natif, puis démarre le fil complet de l’environnement Codex avec exactement
  le modèle et le fournisseur que Codex App Server a sélectionnés pour cet embranchement. Lors des tours
  suivants, la paire persistante du fil natif canonique est restaurée, tandis que la liaison supervisée
  empêche OpenClaw de lui substituer un autre environnement d’exécution, modèle ou mécanisme de repli.
  Un contrôle Codex natif distinct peut toujours modifier cette paire persistante. Un embranchement déjà
  créé ouvre son Chat existant.
- L’activité en direct d’une session stockée découverte depuis un autre processus Codex est inconnue.
  Elle peut créer un embranchement ou être archivée uniquement après confirmation par l’opérateur
  qu’aucun autre client Codex ne l’utilise.
- Une source active reste visible, mais ne peut pas créer d’embranchement ni être archivée tant que
  son tour actuel n’est pas terminé. Si elle possède déjà un Chat supervisé, **Ouvrir le Chat**
  reste disponible.
- Une session sur un Node appairé expose sa transcription persistante au moyen de lectures App Server
  limitées et paginées par curseur. La poursuite à distance nécessite
  un futur pont de Node avec diffusion en continu ; l’archivage à distance nécessite en outre
  un bail de propriété de l’exécuteur ou un mécanisme de cloisonnement équivalent.
- Les sessions archivées ne sont pas répertoriées. Une session locale stockée ou inactive ne peut être
  archivée qu’après confirmation par l’opérateur qu’aucun autre client Codex ne l’utilise.

## Avant de commencer

- Installez le plugin officiel `@openclaw/codex` sur le Gateway. L’application OpenClaw
  pour macOS peut l’installer lorsque vous activez les fonctionnalités Codex ; les installations CLI peuvent
  exécuter `openclaw plugins install @openclaw/codex`.
- Installez Codex Desktop ou la CLI Codex et connectez-vous sur chaque ordinateur dont
  vous souhaitez répertorier les sessions.
- Appairez les ordinateurs distants comme Nodes OpenClaw. Chaque ordinateur doit donner son accord localement ;
  activer la supervision uniquement sur le Gateway n’autorise pas un autre Node.
- Utilisez un Gateway contrôlé par son propriétaire. Les titres de session, les répertoires de travail et les branches
  Git peuvent révéler des informations sensibles sur les projets.

## Activer la supervision

La configuration guidée `openclaw onboard` et la configuration initiale sous macOS tentent d’installer et
d’activer la supervision de Codex après avoir détecté une installation native de Codex et
activé avec succès le moteur d’inférence sélectionné. Codex n’a pas besoin d’être
le moteur principal. La supervision devient disponible lorsque cette activation opportuniste
du plugin réussit. La disponibilité d’App Server est vérifiée lors de la première
connexion de la supervision. Une désactivation explicite du plugin Codex ou un blocage par stratégie
empêche l’activation opportuniste, et une configuration explicite existante
`supervision.enabled: false` désactive les outils de supervision accessibles aux agents ; le
catalogue de l’opérateur reste enregistré chaque fois que le plugin Codex est actif.
Les installations existantes peuvent activer manuellement la même fonctionnalité :

Activez le plugin `codex` et sa fonctionnalité de supervision dans `openclaw.json` :

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          supervision: {
            enabled: true,
          },
        },
      },
    },
  },
}
```

Si `plugins.allow` est présent, incluez `codex`. Redémarrez le Gateway après
avoir modifié l’activation du plugin.

Sans paramètres de connexion `appServer` explicites, la supervision utilise une connexion
de supervision stdio gérée distincte vers le répertoire personnel Codex natif de l’utilisateur. L’environnement
Codex ordinaire reste limité à l’agent par défaut. Cela rend les sessions natives
visibles dans les deux applications sans que les tours OpenClaw ordinaires partagent
l’état Codex natif. Définissez explicitement `appServer.homeScope: "user"` si l’environnement
doit également partager cet état. La supervision respecte les paramètres de connexion
`appServer` explicites au lieu de les remplacer par sa valeur locale par défaut utilisant le répertoire personnel de l’utilisateur.

Un Chat adopté depuis le groupe **Codex** de la barre latérale n’est pas une session d’environnement ordinaire.
Sa liaison de supervision privée utilise la connexion de supervision pour les lectures
de la source, la création de l’embranchement canonique, l’injection de l’historique et chaque tour ultérieur. Avec
la connexion locale par défaut, cela préserve le répertoire personnel Codex natif de l’utilisateur, son authentification
et la configuration de son fournisseur sans modifier la valeur par défaut des autres sessions.

Pour la connexion locale de supervision par défaut, le stockage est partagé avec les clients
Codex natifs. OpenClaw ne suppose pas qu’un autre client partage le même processus
App Server actif, et la propriété de l’état natif est locale au processus. Il traite donc
un fil que son App Server de supervision signale comme `notLoaded` comme
**Stockée / activité inconnue**, et non comme inactive.

Appliquez le même accord sur chaque hôte de Node sans interface dont les sessions doivent apparaître.
L’application OpenClaw native pour macOS lit le même paramètre local lorsqu’elle annonce
son catalogue Codex au Gateway appairé. Ce catalogue Mac natif appairé prend uniquement en charge
la valeur par défaut ou une configuration explicite `appServer.transport: "stdio"` avec
`appServer.homeScope: "user"` non défini ou explicite. `command`, `args` et `clearEnv` sont
respectés pour ce processus stdio. Si la configuration du Mac sélectionne `"unix"`,
`"websocket"` ou `homeScope: "agent"`, l’application n’annonce ni la fonctionnalité de catalogue
ni la commande, et une invocation directe obsolète échoue au lieu d’exposer
le répertoire personnel Codex de l’utilisateur ou de lancer un autre App Server stdio local.

Une commande de Node nouvellement annoncée modifie la surface des commandes approuvées du Node.
Approuvez la mise à jour depuis l’hôte du Gateway :

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
```

Les sessions Codex non archivées apparaissent également dans la barre latérale principale de l’interface de contrôle,
regroupées par hôte. Sélectionnez-en une pour lire sa transcription persistante. La visionneuse utilise la dernière
API Codex `thread/turns/list` avec `itemsView: "full"` et charge au maximum 20 tours
par requête ; **Charger les anciens éléments de la transcription** suit le curseur App Server opaque de la dernière page.
Les pages chargées sont affichées dans l’ordre chronologique. La visionneuse ne charge jamais
un historique `thread/read` sans limite. Une page dépassant le plafond de sécurité de transport de 20 MiB échoue
de manière sécurisée au lieu de mettre en péril la connexion du Node ou du Gateway.

Ouvrez le groupe **Codex** dans la barre latérale habituelle des sessions. Il répertorie les mêmes sessions
regroupées par hôte. **Charger plus de sessions** ajoute la page suivante de chaque hôte qui
possède des lignes plus anciennes, et ces lignes ajoutées persistent lors des actualisations périodiques de la barre latérale.
Chaque page de recherche renvoyée analyse un nombre limité de pages natives par hôte au lieu
d’envoyer la requête à App Server, car la recherche native peut également correspondre
aux aperçus des transcriptions.

La disponibilité de l’hôte et l’état du fil sont distincts. **Hors ligne** ou **Indisponible**
décrit l’actualisation d’un hôte ; un hôte indisponible ne renvoie aucune nouvelle ligne de session et
ne remplace pas l’état natif d’un fil par `offline`. Les lignes de session utilisent des états Codex
tels que `idle`, `active`, `notLoaded` ou une erreur. L’échec d’un hôte ne
masque pas les résultats des hôtes opérationnels.

## Utiliser la CLI de l’opérateur

La CLI du terminal expose le même catalogue non archivé ainsi que les actions d’embranchement
et d’archivage locales au Gateway :

```bash
openclaw codex sessions [--search <text>] [--host <id>] [--limit <count>] [--cursor <cursor>] [--json] [--url <url>] [--token <token>] [--timeout <ms>] [--expect-final]
openclaw codex continue <thread-id> [--json] [--url <url>] [--token <token>] [--timeout <ms>] [--expect-final]
openclaw codex archive <thread-id> --confirm-no-other-runner [--json] [--url <url>] [--token <token>] [--timeout <ms>] [--expect-final]
```

Options de `openclaw codex sessions` :

- `--search <text>` recherche les titres de session sans tenir compte de la casse.
- `--host <id>` limite la réponse à un hôte de catalogue stable, tel que
  `gateway:local` ou `node:<node-id>`.
- `--limit <count>` définit de 1 à 100 lignes par hôte ; la valeur par défaut est 50.
- `--cursor <cursor>` poursuit la pagination d’un hôte et nécessite donc `--host`.
- `--json` affiche la réponse structurée du Gateway.

Les trois commandes héritent de `--url`, `--token` et `--timeout <ms>` du
client Gateway. La liste des sessions utilise par défaut 75,000 ms afin que les catalogues
de Nodes appairés démarrés à froid puissent terminer leur chargement ; les commandes de poursuite et d’archivage utilisent par défaut 30,000 ms. Elles exposent également l’option partagée
`--expect-final`, qui ne modifie pas ces RPC de supervision unaires.
Chaque commande nécessite la portée Gateway `operator.write`.
La sortie standard `-h, --help` est disponible pour chaque sous-commande.
Il n’existe aucune option d’affichage des éléments archivés ou d’inclusion des éléments archivés. `sessions` peut répertorier les hôtes
appairés, mais `continue` et `archive` ciblent toujours `gateway:local` ; les lignes appairées
peuvent uniquement être répertoriées. L’archivage nécessite toujours `--confirm-no-other-runner`.

Ces commandes shell sont distinctes des commandes d’exécution `/codex` dans le Chat.
`/codex threads [filter]` répertorie les fils App Server disponibles pour la connexion
de la conversation actuelle. `/codex sessions --host <node>` répertorie les fichiers de session de la CLI
Codex pouvant être repris sur un Node, et non le catalogue de la flotte de supervision. `/codex
resume` et `/codex bind` associent la conversation actuelle au lieu de créer un
embranchement supervisé sûr, et un Chat supervisé verrouillé sur un modèle rejette ces
modifications de liaison. Il n’existe aucune commande d’exécution `/codex continue` ou `/codex archive`.

## Créer un embranchement depuis une session locale

Choisissez **Poursuivre en tant qu’embranchement** sur une ligne stockée ou inactive de l’ordinateur du Gateway.
OpenClaw crée une entrée Chat normale, reproduit un historique limité de messages utilisateur et assistant
jusqu’au dernier tour terminal persistant de la source (terminé, interrompu ou
échoué), enregistre un embranchement d’environnement en attente et ouvre le Chat. Le sélecteur générique de modèle
est verrouillé, mais aucun modèle ni fournisseur concret n’a encore été sélectionné. La
source n’est pas reprise et le fil d’environnement canonique n’est pas encore démarré.
Répéter l’action ouvre le Chat existant au lieu de créer un autre
embranchement.

La copie conserve la partie visible la plus récente qui respecte les trois limites : au maximum 200
messages utilisateur ou assistant, 512 KiB de texte UTF-8 au total et 64 KiB par
message. Les messages trop volumineux sont tronqués avec un marqueur, et les messages plus anciens sont
omis lorsqu’une limite est atteinte. Une entrée d’image ou d’image locale devient l’espace réservé littéral
`[Image attachment]` ; les données d’image et les chemins locaux ne sont pas copiés.

Envoyez le premier message Chat normal pour commencer le travail. L’environnement Codex installe les
véritables gestionnaires d’approbation, de sollicitation, d’événement et de remise. Il utilise un embranchement
natif temporaire sur la connexion de supervision afin de figer l’instantané de la source sans
fournir de remplacement de modèle ou de fournisseur. Codex App Server les sélectionne tous deux à partir de sa
configuration native actuelle et renvoie la sélection réelle. Sur cette même
connexion, OpenClaw démarre le fil canonique de l’environnement complet ayant pour source `appServer`
avec son répertoire de travail actuel et sa stratégie d’exécution, en utilisant exactement la paire renvoyée, injecte
l’historique visible limité et archive l’embranchement temporaire. Le fil canonique
dispose de toute la surface d’outils de l’environnement OpenClaw. Il s’agit d’un embranchement de l’historique visible, et non
d’un clone complet de l’exécution native : le raisonnement, les appels d’outils et les résultats d’outils de la source sont
omis. Ce tour et tous les suivants restent sur la connexion Codex supervisée
plutôt que sur un autre environnement d’exécution de modèle OpenClaw ou sur l’environnement ordinaire du répertoire personnel de l’agent.

La sélection renvoyée ne prouve pas quel était le modèle historique de la source. Si la
configuration native actuelle diffère du modèle enregistré pour le dernier tour de la source,
Codex émet son avertissement habituel de différence de modèle. OpenClaw utilise la
paire renvoyée pour démarrer le fil canonique. Codex conserve le modèle et le
fournisseur natifs de ce fil canonique, et les reprises ultérieures les préservent, car
OpenClaw omet les remplacements de modèle et de fournisseur. Si le fil canonique est modifié
au moyen d’un contrôle Codex natif distinct, OpenClaw accepte la sélection persistante de Codex.
OpenClaw ne lui substitue jamais son modèle externe ni sa chaîne de repli.

Le Chat supervisé verrouillé sur un modèle ne peut pas être supprimé, changer de modèle, utiliser `/new`
ou `/reset`, invoquer l’action de réinitialisation de session du Gateway, ni utiliser l’action générique
**Dupliquer la session**. Les commandes de modification `/codex model <model>`, `/codex
bind`, `/codex resume` (y compris une session de Node avec `--bind here`) et
`/codex detach` ou `/codex unbind` sont également rejetées, car elles remplaceraient
ou supprimeraient la liaison native verrouillée. La requête `/codex model`, ainsi que `/codex fast`,
`/codex permissions` et `/codex threads`, restent disponibles. Démarrez une autre
session ordinaire lorsque vous souhaitez utiliser un autre modèle ou un nouveau fil.

Maintenez la supervision activée pour ce Chat. Si la supervision est désactivée ou si sa
liaison de connexion enregistrée devient indisponible ou incohérente, le tour échoue
de manière sécurisée au lieu de basculer vers une session ordinaire du répertoire d’accueil de l’agent.

La désactivation ou la désinstallation du plugin `codex` ne libère pas cette propriété et
ne rend pas le Chat admissible à un autre modèle. Le Chat verrouillé reste conservé mais
indisponible ; réinstallez ou réactivez le même plugin et redémarrez le Gateway pour
le reprendre. Ce comportement délibérément sécurisé empêche un nettoyage de rétention ou une
indisponibilité temporaire du plugin de rendre silencieusement orpheline la liaison native.

L’outil d’agent `codex_threads` respecte la même limite. Il ne peut pas associer une
autre duplication ni archiver le fil natif lié au Chat. La liste et la lecture des
métadonnées uniquement restent disponibles. La lecture brute des transcriptions nécessite `allowRawTranscripts`.
Lorsque l’accès brut est désactivé, `codex_threads` rejette également la recherche dans la liste, car
la recherche native inclut des aperçus de transcription ; l’interface de contrôle et la CLI de l’opérateur
fournissent toujours une recherche limitée aux titres. Le renommage, la désarchivation, la duplication détachée et
l’archivage d’un fil non lié et sans propriétaire nécessitent
`allowWriteControls`. Aucune de ces options ne contourne la liaison verrouillée.

OpenClaw ne s’abonne pas aux demandes d’approbation et n’y répond pas lorsqu’il se contente de répertorier
le fil source ou d’afficher le Chat en attente. Le démarrage d’un fil canonique distinct
du harnais au premier tour permet à un autre processus Codex de conserver la propriété de la
source sans créer de rédacteurs de déploiement concurrents.

La source CLI ou VS Code d’origine reste visible pour les clients natifs et le
catalogue OpenClaw. La branche canonique est enregistrée comme fil Codex natif, mais
son type de source est `appServer` ; Codex Desktop ou un autre client natif peut filtrer
ce type de source, de sorte que l’apparition de la branche elle-même dans chaque
vue d’historique native n’est pas garantie.

Une ligne active signalée par l’App Server d’OpenClaw ne peut pas démarrer une nouvelle branche. Attendez
la fin du tour actuel et actualisez le catalogue. Codex App Server
sérialise les mutations au sein d’un même processus, mais ne fournit ni exécuteur exclusif
interprocessus ni bail de propriété des approbations.

Pour une ligne **Enregistrée / activité inconnue**, le miroir du Chat et l’instantané épinglé
du premier tour utilisent l’état de Codex jusqu’au dernier tour terminal conservé. Le fil
source n’est ni repris, ni interrompu, ni archivé. Si un autre processus exécute un
tour en cours, ses derniers travaux en cours d’exécution peuvent ne pas figurer dans la branche.

## Archiver une session locale

Choisissez **Archiver** sur une ligne locale au Gateway enregistrée ou inactive, puis confirmez qu’aucun
autre client Codex ni exécuteur OpenClaw n’utilise ce fil ou ses
descendants engendrés. OpenClaw relit l’état local au processus, ne poursuit que pour
`idle` ou `notLoaded`, appelle l’opération native d’archivage de Codex et supprime la
session de la liste des éléments non archivés. Codex natif tente également d’archiver les
descendants engendrés par le fil.

L’archivage est indisponible lorsque la nouvelle lecture signale que la session est active ou en
état d’erreur, lorsqu’elle appartient à un Node appairé ou lorsqu’un Chat supervisé
nouvellement créé possède encore une branche en attente provenant de cette source. Envoyez le
premier message du Chat pour matérialiser sa branche canonique avant d’archiver la source.
L’archivage est également bloqué lorsqu’OpenClaw sait qu’une liaison active possède le
fil cible exact ou un descendant engendré non archivé. OpenClaw suit la
requête expérimentale de descendants de Codex sur chaque page ; une réponse non valide,
un échec de requête, un curseur ou un fil répété, ou l’épuisement de la limite de sécurité entraîne
le rejet de l’archivage.

Les requêtes de lecture, d’énumération des descendants et d’archivage ne constituent pas une opération
conditionnelle unique ; un tour peut donc toujours démarrer entre elles. L’état de l’App Server
n’est pas non plus partagé entre des processus indépendants. La confirmation constitue donc la
limite de sécurité pour les clients inconnus et cette condition de concurrence : quittez ou vérifiez
autrement chaque autre client avant de confirmer. Restaurez un fil archivé avec Codex
Desktop, la CLI Codex ou un flux de gestion native des fils autorisé par le propriétaire ;
il réapparaît après sa désarchivation.

```bash
codex unarchive <thread-id>
```

## Comprendre les limites des Nodes appairés

Les Nodes appairés exposent les commandes versionnées en lecture seule
`codex.appServer.threads.list.v1` et
`codex.appServer.thread.turns.list.v1`. Le Gateway reçoit des métadonnées normalisées
et des pages de transcription limitées explicitement demandées, jamais les points de terminaison bruts de l’App Server.
Le transport actuel d’invocation du Node fonctionne uniquement en mode requête/réponse ; il ne peut donc pas prendre en charge
le cycle de vie de longue durée des événements, des approbations et de la diffusion en continu requis par le harnais Codex.

Pour cette raison, les lignes distantes restent visibles, mais ne proposent ni **Continuer** ni
**Archiver**, même lorsque le fil distant est inactif. Utilisez Codex sur cet ordinateur
jusqu’à ce qu’il existe un pont d’exécution avec diffusion en continu côté Node pour la poursuite et une
limite sûre de propriété de l’exécuteur pour l’archivage.

## Métadonnées et autorisations

Les lignes du catalogue peuvent inclure :

- les identifiants de fil et de session
- le titre et le répertoire de travail
- l’état actuel et les indicateurs d’attente active
- les horodatages de création, de mise à jour et d’activité
- la source, le fournisseur du modèle, la version de la CLI Codex et la branche Git

La projection du catalogue exclut les aperçus de transcription, les tours, les chemins de déploiement,
le chemin du répertoire d’accueil de Codex, les dépôts Git distants, les SHA de commit et les erreurs brutes de l’App Server. L’accès au catalogue
et la lecture des transcriptions dans l’interface de contrôle nécessitent la portée Gateway `operator.write`,
car l’agrégation du parc utilise le chemin standard `node.invoke`, même si
les deux commandes du Node sont en lecture seule.

`supervision.allowRawTranscripts` et `supervision.allowWriteControls` régissent
les outils autonomes d’agent et les outils MCP indépendants. Les deux valent `false` par défaut. Lorsque
la supervision est activée, `codex_threads` supprime les aperçus de transcription et les tours des
résultats de liste et de lecture des métadonnées uniquement, sauf si les transcriptions brutes sont autorisées ; une
lecture incluant les tours échoue de manière sécurisée. Chaque duplication, renommage, archivage et désarchivage
nécessite les contrôles d’écriture. Ces options ne limitent pas l’affichage authentifié des
transcriptions dans l’interface de contrôle et ne contournent pas les vérifications de liaison, d’hôte, d’état ou de confirmation.

### Outils de compatibilité

Le plugin officiel `codex` conserve les cinq noms d’outils Supervisor livrés pour
les agents existants et les clients MCP indépendants :

- `codex_endpoint_probe`
- `codex_sessions_list`
- `codex_session_read`
- `codex_session_send`
- `codex_session_interrupt`

`codex_sessions_list` ne charge que les éléments chargés par défaut ; il n’existe aucun paramètre `loaded_only`.
Définissez `include_stored: true` pour lire également les lignes enregistrées non archivées dans
la base de données d’état de Codex. La limite facultative `max_stored_sessions` vaut 200 par défaut
et accepte de 1 à 1,000 lignes par point de terminaison. Elle ne limite pas les lignes chargées.
Sans autorisation d’accès aux transcriptions brutes, les résultats de liste omettent les noms,
les aperçus et les erreurs détaillées des points de terminaison dérivés des transcriptions.
`codex_session_read` nécessite `allowRawTranscripts` ; `include_turns: true`
demande en outre les tours à Codex.

`codex_session_send` et `codex_session_interrupt` nécessitent
`allowWriteControls`. L’envoi accepte `mode: "auto" | "start" | "steer"`, mais
`"start"` est toujours refusé et `"auto"` comme `"steer"` ne peuvent que piloter un
tour actif lisible. Un fil inactif est refusé avec une instruction invitant à utiliser **Sessions
Codex**, où le harnais complet installe les gestionnaires d’approbation et d’outils avant
la poursuite. L’interruption nécessite également un tour actif lisible. Ces outils
ne reprennent ni ne démarrent un fil source inactif.

`openclaw doctor --fix` déplace une entrée `codex-supervisor` retirée, ses champs de point de terminaison
et d’autorisation, ainsi que les références de stratégie d’autorisation/refus du plugin, vers le plugin officiel
`codex` sans remplacer les paramètres canoniques explicites. L’adaptateur MCP de
compatibilité indépendant continue de charger les cinq mêmes outils depuis ce
plugin ; les anciennes variables d’environnement de stratégie ne s’appliquent qu’au sein de cet
adaptateur approuvé.

Pour tous les champs de configuration de la supervision, consultez la
[référence du harnais Codex](/fr/plugins/codex-harness-reference#supervision).

## Résolution des problèmes

**Aucune session n’apparaît :** vérifiez que `@openclaw/codex` est installé, que le
plugin et `supervision.enabled` sont tous deux activés, que la liste d’autorisation actuelle des plugins permet
`codex` et que les sessions ne sont pas archivées. Redémarrez le Gateway ou le Node après
avoir modifié l’activation.

**Continuer est désactivé :** une ligne non mappée est active, appartient à un Node appairé,
son hôte est hors ligne ou une autre action est en attente. Les lignes locales au Gateway enregistrées et inactives
proposent **Continuer comme branche** au lieu d’une prise de contrôle non sécurisée du fil exact. Une ligne
qui possède déjà un Chat supervisé propose **Ouvrir le Chat**.

**Archiver est désactivé :** l’archivage est disponible pour les lignes locales au Gateway enregistrées/à activité inconnue et
inactives après confirmation qu’aucun autre exécuteur n’est présent. Les lignes actives, en erreur,
hors ligne, associées à un Node appairé, avec une branche en attente ou dont le propriétaire exact de la liaison est connu restent
en lecture seule pour l’archivage.

**Une session archivée a disparu :** ce comportement est attendu. La page de supervision ne comporte
aucune vue des archives. Exécutez `codex unarchive <thread-id>` ou utilisez Codex Desktop pour
l’afficher de nouveau.

**L’ancienne configuration `codex-supervisor` subsiste :** exécutez `openclaw doctor --fix`. Doctor
déplace l’entrée de plugin retirée et les références de stratégie de plugin associées vers
`plugins.entries.codex.config.supervision` sans remplacer les paramètres Codex explicites.

## Pages connexes

- [Harnais Codex](/fr/plugins/codex-harness)
- [Référence du harnais Codex](/fr/plugins/codex-harness-reference)
- [Environnement d’exécution du harnais Codex](/fr/plugins/codex-harness-runtime)
- [Architecture de supervision Codex](/fr/specs/codex-supervision)
- [Nodes](/fr/nodes)
- [Sécurité du Gateway](/fr/gateway/security)
