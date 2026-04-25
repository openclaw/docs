---
read_when:
    - Mettre à niveau une installation Matrix existante
    - Migrer l’historique Matrix chiffré et l’état de l’appareil
summary: Comment OpenClaw met à niveau l’ancien Plugin Matrix sur place, y compris les limites de récupération de l’état chiffré et les étapes de récupération manuelle.
title: Migration Matrix
x-i18n:
    generated_at: "2026-04-25T13:49:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3c35794d7d56d2083905fe4a478463223813b6c901c5c67935fbb9670b51f225
    source_path: install/migrating-matrix.md
    workflow: 15
---

Cette page couvre les mises à niveau depuis l’ancien Plugin public `matrix` vers l’implémentation actuelle.

Pour la plupart des utilisateurs, la mise à niveau se fait sur place :

- le Plugin reste `@openclaw/matrix`
- le canal reste `matrix`
- votre configuration reste sous `channels.matrix`
- les identifiants mis en cache restent sous `~/.openclaw/credentials/matrix/`
- l’état d’exécution reste sous `~/.openclaw/matrix/`

Vous n’avez pas besoin de renommer des clés de configuration ni de réinstaller le Plugin sous un nouveau nom.

## Ce que la migration fait automatiquement

Lorsque la Gateway démarre, et lorsque vous exécutez [`openclaw doctor --fix`](/fr/gateway/doctor), OpenClaw essaie de réparer automatiquement l’ancien état Matrix.
Avant toute étape de migration Matrix exploitable qui modifie l’état sur disque, OpenClaw crée ou réutilise un snapshot de récupération ciblé.

Lorsque vous utilisez `openclaw update`, le déclencheur exact dépend de la manière dont OpenClaw est installé :

- les installations depuis les sources exécutent `openclaw doctor --fix` pendant le flux de mise à jour, puis redémarrent la Gateway par défaut
- les installations via un gestionnaire de paquets mettent à jour le paquet, exécutent un passage doctor non interactif, puis s’appuient sur le redémarrage par défaut de la Gateway pour que le démarrage puisse terminer la migration Matrix
- si vous utilisez `openclaw update --no-restart`, la migration Matrix adossée au démarrage est différée jusqu’à ce que vous exécutiez plus tard `openclaw doctor --fix` et redémarriez la Gateway

La migration automatique couvre :

- la création ou la réutilisation d’un snapshot avant migration sous `~/Backups/openclaw-migrations/`
- la réutilisation de vos identifiants Matrix mis en cache
- la conservation de la même sélection de compte et de la configuration `channels.matrix`
- le déplacement du plus ancien magasin de synchronisation Matrix plat vers l’emplacement actuel à portée de compte
- le déplacement du plus ancien magasin crypto Matrix plat vers l’emplacement actuel à portée de compte lorsque le compte cible peut être résolu en toute sécurité
- l’extraction d’une clé de déchiffrement de sauvegarde des clés de salon Matrix précédemment enregistrée depuis l’ancien magasin crypto rust, lorsque cette clé existe localement
- la réutilisation de la racine de stockage à hash de jeton existante la plus complète pour le même compte Matrix, homeserver et utilisateur lorsque le jeton d’accès change plus tard
- l’analyse des racines de stockage sœurs à hash de jeton pour trouver des métadonnées en attente de restauration de l’état chiffré lorsque le jeton d’accès Matrix a changé mais que l’identité du compte/de l’appareil est restée la même
- la restauration des clés de salon sauvegardées dans le nouveau magasin crypto au prochain démarrage de Matrix

Détails du snapshot :

- OpenClaw écrit un fichier marqueur dans `~/.openclaw/matrix/migration-snapshot.json` après un snapshot réussi afin que les passes ultérieures de démarrage et de réparation puissent réutiliser la même archive.
- Ces snapshots automatiques de migration Matrix sauvegardent uniquement la configuration + l’état (`includeWorkspace: false`).
- Si Matrix n’a qu’un état de migration avec avertissement uniquement, par exemple parce que `userId` ou `accessToken` manque encore, OpenClaw ne crée pas encore le snapshot car aucune mutation Matrix n’est exploitable.
- Si l’étape de snapshot échoue, OpenClaw ignore la migration Matrix pour cette exécution au lieu de modifier l’état sans point de récupération.

À propos des mises à niveau multi-comptes :

- le plus ancien magasin Matrix plat (`~/.openclaw/matrix/bot-storage.json` et `~/.openclaw/matrix/crypto/`) provient d’une disposition à magasin unique, donc OpenClaw ne peut le migrer que vers une seule cible de compte Matrix résolue
- les anciens magasins Matrix déjà à portée de compte sont détectés et préparés par compte Matrix configuré

## Ce que la migration ne peut pas faire automatiquement

L’ancien Plugin public Matrix ne créait **pas** automatiquement de sauvegardes des clés de salon Matrix. Il persistait l’état crypto local et demandait la vérification de l’appareil, mais il ne garantissait pas que vos clés de salon étaient sauvegardées sur le homeserver.

Cela signifie que certaines installations chiffrées ne peuvent être migrées que partiellement.

OpenClaw ne peut pas récupérer automatiquement :

- les clés de salon locales uniquement qui n’ont jamais été sauvegardées
- l’état chiffré lorsque le compte Matrix cible ne peut pas encore être résolu parce que `homeserver`, `userId` ou `accessToken` ne sont pas encore disponibles
- la migration automatique d’un magasin Matrix plat partagé lorsque plusieurs comptes Matrix sont configurés mais que `channels.matrix.defaultAccount` n’est pas défini
- les installations de chemin de Plugin personnalisé qui sont épinglées à un chemin de dépôt au lieu du paquet Matrix standard
- une clé de récupération manquante lorsque l’ancien magasin contenait des clés sauvegardées mais ne conservait pas la clé de déchiffrement localement

Portée actuelle des avertissements :

- les installations de chemin de Plugin Matrix personnalisé sont signalées à la fois par le démarrage de la Gateway et par `openclaw doctor`

Si votre ancienne installation avait un historique chiffré uniquement local qui n’a jamais été sauvegardé, certains anciens messages chiffrés peuvent rester illisibles après la mise à niveau.

## Flux de mise à niveau recommandé

1. Mettez à jour OpenClaw et le Plugin Matrix normalement.
   Préférez un simple `openclaw update` sans `--no-restart` afin que le démarrage puisse terminer immédiatement la migration Matrix.
2. Exécutez :

   ```bash
   openclaw doctor --fix
   ```

   Si Matrix a un travail de migration exploitable, doctor créera ou réutilisera d’abord le snapshot avant migration et affichera le chemin de l’archive.

3. Démarrez ou redémarrez la Gateway.
4. Vérifiez l’état actuel de vérification et de sauvegarde :

   ```bash
   openclaw matrix verify status
   openclaw matrix verify backup status
   ```

5. Si OpenClaw vous indique qu’une clé de récupération est nécessaire, exécutez :

   ```bash
   openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"
   ```

6. Si cet appareil n’est toujours pas vérifié, exécutez :

   ```bash
   openclaw matrix verify device "<your-recovery-key>"
   ```

   Si la clé de récupération est acceptée et que la sauvegarde est utilisable, mais que `Cross-signing verified`
   vaut toujours `no`, terminez l’auto-vérification depuis un autre client Matrix :

   ```bash
   openclaw matrix verify self
   ```

   Acceptez la demande dans un autre client Matrix, comparez les émojis ou les décimales,
   et tapez `yes` uniquement lorsqu’ils correspondent. La commande se termine avec succès uniquement
   après que `Cross-signing verified` devient `yes`.

7. Si vous abandonnez intentionnellement un ancien historique irrécupérable et voulez une nouvelle base de sauvegarde pour les futurs messages, exécutez :

   ```bash
   openclaw matrix verify backup reset --yes
   ```

8. Si aucune sauvegarde de clé côté serveur n’existe encore, créez-en une pour les récupérations futures :

   ```bash
   openclaw matrix verify bootstrap
   ```

## Comment fonctionne la migration chiffrée

La migration chiffrée est un processus en deux étapes :

1. Le démarrage ou `openclaw doctor --fix` crée ou réutilise le snapshot avant migration si la migration chiffrée est exploitable.
2. Le démarrage ou `openclaw doctor --fix` inspecte l’ancien magasin crypto Matrix via l’installation active du Plugin Matrix.
3. Si une clé de déchiffrement de sauvegarde est trouvée, OpenClaw l’écrit dans le nouveau flux de clé de récupération et marque la restauration des clés de salon comme en attente.
4. Au prochain démarrage de Matrix, OpenClaw restaure automatiquement les clés de salon sauvegardées dans le nouveau magasin crypto.

Si l’ancien magasin signale des clés de salon qui n’ont jamais été sauvegardées, OpenClaw avertit au lieu de prétendre que la récupération a réussi.

## Messages courants et leur signification

### Messages de mise à niveau et de détection

`Matrix plugin upgraded in place.`

- Signification : l’ancien état Matrix sur disque a été détecté et migré vers la disposition actuelle.
- Que faire : rien, sauf si la même sortie inclut aussi des avertissements.

`Matrix migration snapshot created before applying Matrix upgrades.`

- Signification : OpenClaw a créé une archive de récupération avant de modifier l’état Matrix.
- Que faire : conservez le chemin d’archive affiché jusqu’à ce que vous confirmiez le succès de la migration.

`Matrix migration snapshot reused before applying Matrix upgrades.`

- Signification : OpenClaw a trouvé un marqueur de snapshot de migration Matrix existant et a réutilisé cette archive au lieu de créer une sauvegarde en double.
- Que faire : conservez le chemin d’archive affiché jusqu’à ce que vous confirmiez le succès de la migration.

`Legacy Matrix state detected at ... but channels.matrix is not configured yet.`

- Signification : un ancien état Matrix existe, mais OpenClaw ne peut pas le mapper à un compte Matrix actuel parce que Matrix n’est pas configuré.
- Que faire : configurez `channels.matrix`, puis relancez `openclaw doctor --fix` ou redémarrez la Gateway.

`Legacy Matrix state detected at ... but the new account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- Signification : OpenClaw a trouvé un ancien état, mais il ne peut toujours pas déterminer la racine exacte du compte/de l’appareil actuel.
- Que faire : démarrez la Gateway une fois avec une connexion Matrix fonctionnelle, ou relancez `openclaw doctor --fix` après que les identifiants mis en cache existent.

`Legacy Matrix state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- Signification : OpenClaw a trouvé un magasin Matrix plat partagé, mais refuse de deviner quel compte Matrix nommé doit le recevoir.
- Que faire : définissez `channels.matrix.defaultAccount` sur le compte voulu, puis relancez `openclaw doctor --fix` ou redémarrez la Gateway.

`Matrix legacy sync store not migrated because the target already exists (...)`

- Signification : le nouvel emplacement à portée de compte possède déjà un magasin de synchronisation ou crypto, donc OpenClaw ne l’a pas écrasé automatiquement.
- Que faire : vérifiez que le compte actuel est le bon avant de supprimer ou déplacer manuellement la cible en conflit.

`Failed migrating Matrix legacy sync store (...)` ou `Failed migrating Matrix legacy crypto store (...)`

- Signification : OpenClaw a essayé de déplacer l’ancien état Matrix mais l’opération sur le système de fichiers a échoué.
- Que faire : inspectez les permissions du système de fichiers et l’état du disque, puis relancez `openclaw doctor --fix`.

`Legacy Matrix encrypted state detected at ... but channels.matrix is not configured yet.`

- Signification : OpenClaw a trouvé un ancien magasin Matrix chiffré, mais il n’y a pas de configuration Matrix actuelle pour l’y rattacher.
- Que faire : configurez `channels.matrix`, puis relancez `openclaw doctor --fix` ou redémarrez la Gateway.

`Legacy Matrix encrypted state detected at ... but the account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- Signification : le magasin chiffré existe, mais OpenClaw ne peut pas décider en toute sécurité à quel compte/appareil actuel il appartient.
- Que faire : démarrez la Gateway une fois avec une connexion Matrix fonctionnelle, ou relancez `openclaw doctor --fix` après que les identifiants mis en cache soient disponibles.

`Legacy Matrix encrypted state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- Signification : OpenClaw a trouvé un ancien magasin crypto partagé plat, mais refuse de deviner quel compte Matrix nommé doit le recevoir.
- Que faire : définissez `channels.matrix.defaultAccount` sur le compte voulu, puis relancez `openclaw doctor --fix` ou redémarrez la Gateway.

`Matrix migration warnings are present, but no on-disk Matrix mutation is actionable yet. No pre-migration snapshot was needed.`

- Signification : OpenClaw a détecté un ancien état Matrix, mais la migration est encore bloquée par des données d’identité ou d’identifiants manquantes.
- Que faire : terminez la connexion Matrix ou la configuration, puis relancez `openclaw doctor --fix` ou redémarrez la Gateway.

`Legacy Matrix encrypted state was detected, but the Matrix plugin helper is unavailable. Install or repair @openclaw/matrix so OpenClaw can inspect the old rust crypto store before upgrading.`

- Signification : OpenClaw a trouvé un ancien état Matrix chiffré, mais n’a pas pu charger le point d’entrée helper du Plugin Matrix qui inspecte normalement ce magasin.
- Que faire : réinstallez ou réparez le Plugin Matrix (`openclaw plugins install @openclaw/matrix`, ou `openclaw plugins install ./path/to/local/matrix-plugin` pour une copie de dépôt), puis relancez `openclaw doctor --fix` ou redémarrez la Gateway.

`Matrix plugin helper path is unsafe: ... Reinstall @openclaw/matrix and try again.`

- Signification : OpenClaw a trouvé un chemin de fichier helper qui s’échappe de la racine du Plugin ou échoue aux vérifications de limites du Plugin, et a donc refusé de l’importer.
- Que faire : réinstallez le Plugin Matrix depuis un chemin de confiance, puis relancez `openclaw doctor --fix` ou redémarrez la Gateway.

`- Failed creating a Matrix migration snapshot before repair: ...`

`- Skipping Matrix migration changes for now. Resolve the snapshot failure, then rerun "openclaw doctor --fix".`

- Signification : OpenClaw a refusé de modifier l’état Matrix parce qu’il n’a pas pu créer d’abord le snapshot de récupération.
- Que faire : résolvez l’erreur de sauvegarde, puis relancez `openclaw doctor --fix` ou redémarrez la Gateway.

`Failed migrating legacy Matrix client storage: ...`

- Signification : le mécanisme de secours côté client Matrix a trouvé un ancien stockage plat, mais le déplacement a échoué. OpenClaw interrompt désormais ce mécanisme de secours au lieu de démarrer silencieusement avec un nouveau magasin.
- Que faire : inspectez les permissions du système de fichiers ou les conflits, conservez l’ancien état intact, puis réessayez après avoir corrigé l’erreur.

`Matrix is installed from a custom path: ...`

- Signification : Matrix est épinglé à une installation par chemin, donc les mises à jour standard ne le remplacent pas automatiquement par le paquet Matrix standard du dépôt.
- Que faire : réinstallez avec `openclaw plugins install @openclaw/matrix` lorsque vous voulez revenir au Plugin Matrix par défaut.

### Messages de récupération de l’état chiffré

`matrix: restored X/Y room key(s) from legacy encrypted-state backup`

- Signification : les clés de salon sauvegardées ont été restaurées avec succès dans le nouveau magasin crypto.
- Que faire : généralement rien.

`matrix: N legacy local-only room key(s) were never backed up and could not be restored automatically`

- Signification : certaines anciennes clés de salon n’existaient que dans l’ancien magasin local et n’avaient jamais été téléversées dans la sauvegarde Matrix.
- Que faire : attendez-vous à ce qu’une partie de l’ancien historique chiffré reste indisponible, sauf si vous pouvez récupérer manuellement ces clés depuis un autre client vérifié.

`Legacy Matrix encrypted state for account "..." has backed-up room keys, but no local backup decryption key was found. Ask the operator to run "openclaw matrix verify backup restore --recovery-key <key>" after upgrade if they have the recovery key.`

- Signification : une sauvegarde existe, mais OpenClaw n’a pas pu récupérer automatiquement la clé de récupération.
- Que faire : exécutez `openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"`.

`Failed inspecting legacy Matrix encrypted state for account "..." (...): ...`

- Signification : OpenClaw a trouvé l’ancien magasin chiffré, mais n’a pas pu l’inspecter de manière suffisamment sûre pour préparer la récupération.
- Que faire : relancez `openclaw doctor --fix`. Si cela se répète, conservez intact l’ancien répertoire d’état et effectuez la récupération à l’aide d’un autre client Matrix vérifié plus `openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"`.

`Legacy Matrix backup key was found for account "...", but .../recovery-key.json already contains a different recovery key. Leaving the existing file unchanged.`

- Signification : OpenClaw a détecté un conflit de clé de sauvegarde et a refusé d’écraser automatiquement le fichier actuel de clé de récupération.
- Que faire : vérifiez quelle clé de récupération est correcte avant de réessayer une commande de restauration.

`Legacy Matrix encrypted state for account "..." cannot be fully converted automatically because the old rust crypto store does not expose all local room keys for export.`

- Signification : c’est la limite stricte de l’ancien format de stockage.
- Que faire : les clés sauvegardées peuvent toujours être restaurées, mais l’historique chiffré local uniquement peut rester indisponible.

`matrix: failed restoring room keys from legacy encrypted-state backup: ...`

- Signification : le nouveau Plugin a tenté une restauration mais Matrix a renvoyé une erreur.
- Que faire : exécutez `openclaw matrix verify backup status`, puis réessayez avec `openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"` si nécessaire.

### Messages de récupération manuelle

`Backup key is not loaded on this device. Run 'openclaw matrix verify backup restore' to load it and restore old room keys.`

- Signification : OpenClaw sait que vous devriez avoir une clé de sauvegarde, mais elle n’est pas active sur cet appareil.
- Que faire : exécutez `openclaw matrix verify backup restore`, ou passez `--recovery-key` si nécessaire.

`Store a recovery key with 'openclaw matrix verify device <key>', then run 'openclaw matrix verify backup restore'.`

- Signification : cet appareil n’a pas actuellement la clé de récupération stockée.
- Que faire : vérifiez d’abord l’appareil avec votre clé de récupération, puis restaurez la sauvegarde.

`Backup key mismatch on this device. Re-run 'openclaw matrix verify device <key>' with the matching recovery key.`

- Signification : la clé stockée ne correspond pas à la sauvegarde Matrix active.
- Que faire : réexécutez `openclaw matrix verify device "<your-recovery-key>"` avec la clé correcte.

Si vous acceptez de perdre l’ancien historique chiffré irrécupérable, vous pouvez à la place réinitialiser la
base de sauvegarde actuelle avec `openclaw matrix verify backup reset --yes`. Lorsque le
secret de sauvegarde stocké est corrompu, cette réinitialisation peut aussi recréer le stockage des secrets afin que la
nouvelle clé de sauvegarde puisse se charger correctement après redémarrage.

`Backup trust chain is not verified on this device. Re-run 'openclaw matrix verify device <key>'.`

- Signification : la sauvegarde existe, mais cet appareil ne fait pas encore suffisamment confiance à la chaîne de cross-signing.
- Que faire : réexécutez `openclaw matrix verify device "<your-recovery-key>"`.

`Matrix recovery key is required`

- Signification : vous avez tenté une étape de récupération sans fournir de clé de récupération alors qu’elle était requise.
- Que faire : relancez la commande avec votre clé de récupération.

`Invalid Matrix recovery key: ...`

- Signification : la clé fournie n’a pas pu être analysée ou ne correspond pas au format attendu.
- Que faire : réessayez avec la clé de récupération exacte provenant de votre client Matrix ou du fichier de clé de récupération.

`Matrix recovery key was applied, but this device still lacks full Matrix identity trust.`

- Signification : OpenClaw a pu appliquer la clé de récupération, mais Matrix n’a toujours pas
  établi une confiance complète dans l’identité de cross-signing pour cet appareil. Vérifiez la
  sortie de la commande pour `Recovery key accepted`, `Backup usable`,
  `Cross-signing verified` et `Device verified by owner`.
- Que faire : exécutez `openclaw matrix verify self`, acceptez la demande dans un autre
  client Matrix, comparez le SAS, et tapez `yes` uniquement lorsqu’il correspond. La
  commande attend la confiance complète dans l’identité Matrix avant de signaler le succès. Utilisez
  `openclaw matrix verify bootstrap --recovery-key "<your-recovery-key>" --force-reset-cross-signing`
  uniquement lorsque vous voulez intentionnellement remplacer l’identité actuelle de cross-signing.

`Matrix key backup is not active on this device after loading from secret storage.`

- Signification : le stockage des secrets n’a pas produit de session de sauvegarde active sur cet appareil.
- Que faire : vérifiez d’abord l’appareil, puis revérifiez avec `openclaw matrix verify backup status`.

`Matrix crypto backend cannot load backup keys from secret storage. Verify this device with 'openclaw matrix verify device <key>' first.`

- Signification : cet appareil ne peut pas restaurer depuis le stockage des secrets tant que la vérification de l’appareil n’est pas terminée.
- Que faire : exécutez d’abord `openclaw matrix verify device "<your-recovery-key>"`.

### Messages d’installation de Plugin personnalisé

`Matrix is installed from a custom path that no longer exists: ...`

- Signification : votre enregistrement d’installation du Plugin pointe vers un chemin local qui n’existe plus.
- Que faire : réinstallez avec `openclaw plugins install @openclaw/matrix`, ou si vous travaillez depuis une copie de dépôt, `openclaw plugins install ./path/to/local/matrix-plugin`.

## Si l’historique chiffré ne revient toujours pas

Exécutez ces vérifications dans l’ordre :

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
openclaw matrix verify backup restore --recovery-key "<your-recovery-key>" --verbose
```

Si la sauvegarde est restaurée avec succès mais qu’il manque encore l’historique de certains anciens salons, ces clés manquantes n’ont probablement jamais été sauvegardées par l’ancien Plugin.

## Si vous voulez repartir de zéro pour les futurs messages

Si vous acceptez de perdre l’ancien historique chiffré irrécupérable et ne voulez qu’une base de sauvegarde propre pour l’avenir, exécutez ces commandes dans l’ordre :

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Si l’appareil n’est toujours pas vérifié après cela, terminez la vérification depuis votre client Matrix en comparant les émojis SAS ou les codes décimaux et en confirmant qu’ils correspondent.

## Pages liées

- [Matrix](/fr/channels/matrix)
- [Doctor](/fr/gateway/doctor)
- [Migration](/fr/install/migrating)
- [Plugins](/fr/tools/plugin)
