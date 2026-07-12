---
read_when:
    - Vous validez le basculement du stockage SQLite de la voie 3 sur un Gateway actif
    - Vous devez distinguer la dérive attendue des anciens fichiers JSONL des défaillances d’exécution.
    - Vous développez ou examinez le banc de test E2E SQLite en conditions réelles piloté par un agent
summary: Conception de la preuve en conditions réelles du Gateway pour le basculement des sessions/transcriptions SQLite du parcours 3
title: Harness E2E SQLite en conditions réelles du parcours 3
x-i18n:
    generated_at: "2026-07-12T15:57:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 2749bf47cb4967bc80a5ed37a12f2a553f3b388ed8cd90cfb3217e1b5e8afae9
    source_path: reference/path3-live-sqlite-e2e-harness.md
    workflow: 16
---

Le banc d’essai E2E SQLite en conditions réelles du parcours 3 prouve que le Gateway utilise SQLite comme
stockage canonique des sessions et des transcriptions, tandis que les anciens fichiers JSONL restent
des données d’entrée de migration ou des éléments d’archive. Il s’agit d’un banc d’essai de validation destiné aux responsables de maintenance, et non d’un
diagnostic utilisateur normal.

Après qu’un Gateway a traité du trafic postérieur à la migration, la parité avec les anciens fichiers JSONL n’est
plus un indicateur valide de l’état d’exécution. Un Gateway correctement migré peut avoir
des lignes de transcription SQLite dont le nombre diffère de celui des anciens fichiers JSONL, car les nouveaux tours
ne doivent faire progresser que SQLite. Le banc d’essai en conditions réelles doit donc mesurer le comportement du Gateway,
l’évolution des lignes SQLite, l’absence d’activité des anciens fichiers et l’état des journaux à chaque
étape.

## Forme de la commande

La commande prévue en conditions réelles est :

```bash
node scripts/path3-live-sqlite-e2e.mjs \
  --url http://127.0.0.1:18789 \
  --agent main \
  --session-key agent:main:path3-live-e2e:<timestamp> \
  --json
```

La commande se connecte à un Gateway déjà en cours d’exécution. Elle ne démarre, n’arrête,
n’importe ni ne relance la migration, sauf si un mode de migration explicite est ajouté
ultérieurement. Une variante pour la CI ou un environnement local isolé peut utiliser
`test/helpers/openclaw-test-instance.ts`, mais le parcours de validation en conditions réelles doit inspecter
le véritable Gateway de l’opérateur et sa base de données SQLite réelle propre à chaque agent.

## Validation isolée de la CLI compilée

L’exécuteur de validation de la CLI compilée initialise un stockage de sessions existant isolé, démarre le
Gateway recompilé et prouve qu’au démarrage, les sessions existantes actives sont importées dans
SQLite avant le début des lectures à l’exécution. Il ne doit pas exécuter `openclaw doctor --fix`
avant le premier démarrage du Gateway, car cela validerait le parcours de migration manuelle
au lieu du parcours de mise à niveau dont bénéficient les utilisateurs au premier démarrage après la bascule.

Après l’importation au démarrage, la validation isolée peut exécuter
`openclaw doctor --session-sqlite inspect` et
`openclaw doctor --session-sqlite validate` comme éléments de diagnostic. Ces
commandes doctor ne pilotent pas la migration pour la validation de la mise à niveau au démarrage.
Des scénarios distincts d’importation par doctor doivent initialiser d’anciens fichiers de transcription ainsi que
des fichiers annexes de trajectoire et vérifier que doctor archive ces éléments tandis que SQLite
reste canonique.

## Contrôles préalables

Les contrôles préalables collectent un état de référence et échouent avant l’envoi d’un tour de validation si le
Gateway n’est pas utilisable :

- `GET /health` et l’état détaillé du Gateway doivent indiquer un Gateway en cours d’exécution et
  accessible.
- Les versions de la CLI et du Gateway doivent correspondre à la branche testée.
- Le banc d’essai enregistre un curseur de journal pour le fichier journal actif du Gateway.
- Le banc d’essai enregistre le nombre de lignes des tables SQLite propres à chaque agent pour `sessions`,
  `session_entries`, `transcript_events`, `transcript_event_identities` et
  `session_routes`.
- Le banc d’essai enregistre `mtime`, `size` et l’existence des anciens fichiers
  `sessions.json`, des fichiers JSONL référencés et des chemins JSONL potentiels de la session de validation.
- `lsof -p <gateway-pid>` doit afficher les descripteurs de la base de données SQLite, du WAL et du SHM, sans descripteur actif
  de fichier `.jsonl` ou `sessions.json`.

`openclaw doctor --session-sqlite validate` est fourni uniquement à titre informatif en mode réel.
Après du trafic postérieur à la bascule, il peut signaler un écart attendu par rapport aux anciens fichiers. Le
banc d’essai doit utiliser la sortie de doctor pour la classification et l’inventaire de migration,
et non comme oracle de réussite ou d’échec à l’exécution.

## Scénario piloté par l’agent

Le scénario en conditions réelles utilise une clé de session de validation dédiée et pilote le Gateway
par les parcours RPC publics chaque fois que possible. Un tour d’agent doit suffire pour
exercer la persistance ordinaire, mais la validation complète doit couvrir les interfaces 3.1b
qui nécessitaient auparavant des vérifications individuelles en conditions réelles :

- Tour de discussion ordinaire : créer ou réutiliser la session de validation, envoyer une véritable
  invite à l’agent, attendre le résultat final de l’assistant et vérifier `chat.history` ou
  la projection équivalente du Gateway.
- Identité de transcription : vérifier que le même marqueur apparaît dans l’historique du Gateway et dans
  les lignes de transcription SQLite, y compris dans les lignes d’identité d’événement stables lorsqu’elles sont présentes.
- Accesseurs des métadonnées de session : lire la session de validation et certaines sessions réelles
  existantes au moyen des accesseurs de Gateway/session, puis les comparer aux lignes SQLite.
- Projection de la modification de session : appliquer une modification réversible des métadonnées de modèle/session à
  la session de validation, puis vérifier que la ligne projetée et la réponse du Gateway concordent.
- Cycle de vie du point de contrôle de Compaction : répertorier, dériver et restaurer un point de contrôle uniquement
  sur la session de validation ou sur une session de test synthétique créée par le banc d’essai.
- Récupération après redémarrage : exécuter le parcours sécurisé du marqueur de récupération sur une session de validation
  contrôlée ou une instance de test isolée ; le mode réel ne peut exécuter cette étape que lorsque
  l’ensemble de sessions cible est explicite et réversible.
- Cycle de vie du nettoyage : supprimer ou réinitialiser la session de validation, puis vérifier les lignes de
  cycle de vie SQLite et l’état de la transcription archivée.

Les interfaces propres aux transports qui ne peuvent pas être exercées en toute sécurité sur le Gateway réel de l’opérateur,
telles que les entrées WhatsApp ou d’appels vocaux, doivent utiliser des sondes d’exécution au niveau du propriétaire
sur le même contrat SQLite plutôt que de simuler un transport externe.

## Assertions par étape

Chaque étape capture l’état avant et après, puis écrit un enregistrement d’assertion
structuré :

- Le nombre de lignes SQLite n’augmente qu’aux endroits attendus.
- Les lignes d’exécution de trajectoire augmentent pour les sessions de validation adossées à un marqueur qui enregistrent
  des événements d’exécution.
- La ligne de la session de validation possède les valeurs attendues pour `session_id`, l’état, les horodatages,
  les métadonnées et les lignes de routage.
- La projection de l’historique/session du Gateway correspond à la fin de la transcription SQLite.
- Aucun fichier JSONL de session de validation n’est créé ni modifié.
- Aucun fichier annexe `.trajectory.jsonl`, `.trajectory-path.json` ou
  `trajectory/<session>.jsonl` dérivé d’un marqueur n’est créé pour la session de validation.
- Les anciens fichiers JSONL existants et `sessions.json` restent inchangés, sauf si
  l’étape est explicitement une opération de migration hors ligne ou d’archivage.
- Le processus Gateway n’ouvre aucun descripteur de fichier `.jsonl` ou `sessions.json`.
- Les journaux produits depuis le curseur précédent ne contiennent aucun `ERROR`, `FATAL`, `SQLITE_`,
  `no such column`, message d’indisponibilité du stockage de sessions, échec de récupération après redémarrage ou
  avertissement de rapprochement des transcriptions, sauf si le scénario l’autorise explicitement.

L’analyse des journaux fait partie du contrat de réussite ou d’échec. Un Gateway qui répond aux contrôles
d’état mais émet des erreurs de schéma SQLite ou des échecs répétés de rapprochement des transcriptions
n’est pas validé pour le parcours 3.

## Artefact de validation

Le banc d’essai doit écrire les éléments de validation sous `.artifacts/path3-live-e2e/<timestamp>/`
et les exclure de git :

- `summary.json` : arguments de la commande, version du Gateway, résultat, assertion ayant échoué et
  chemins des artefacts.
- `sqlite-before.json` et `sqlite-after.json` : nombres de lignes et lignes de validation
  sélectionnées.
- `legacy-files.json` : existence des anciens fichiers, `mtime`, taille et indication de modification
  de chaque fichier.
- `gateway-log-scan.json` : plage des curseurs, lignes de journal correspondantes et décisions
  relatives à la liste d’autorisation.
- `events.jsonl` : observations ordonnées par étape, adaptées aux commentaires de validation de la PR.

La validation de la PR doit résumer ces artefacts au lieu de coller des
transcriptions complètes ou le contenu de messages privés.

## Règles de sécurité

- Le mode réel ne doit jamais réimporter les anciens fichiers JSONL pendant l’exécution du Gateway.
- Le mode réel ne doit pas modifier les sessions autres que celles de validation, sauf pour des sondes de réparation
  réversibles et explicitement sélectionnées.
- Toute étape de migration destructive ou étendue nécessite une sauvegarde récente de la
  base de données SQLite concernée et du répertoire des anciennes sessions.
- Les sauvegardes doivent être limitées à la base de données de l’agent ou au répertoire de session concernés et réutilisées
  au cours d’une même exécution de validation afin d’éviter une croissance illimitée de l’espace disque utilisé.
- L’étape de nettoyage ne doit laisser aucune session de validation, aucun fichier JSONL de validation ni aucun ancien
  fichier modifié, sauf si l’appelant transmet `--keep-artifacts`.

## Résultat concluant

Une exécution réelle concluante signifie que le Gateway a accepté un véritable flux de session piloté par un agent,
que tout l’état canonique observé se trouvait dans SQLite, que les anciens fichiers d’exécution sont restés
inactifs et que les journaux sont restés exempts d’erreurs pendant la fenêtre mesurée. Cela ne signifie pas
que la parité avec les anciens fichiers JSONL reste intacte après du trafic réel ; un écart en conditions réelles est attendu
dès lors que SQLite constitue le stockage canonique.
