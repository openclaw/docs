---
read_when:
    - Mise à niveau d’une installation Matrix existante
    - Migration de l’historique chiffré de Matrix et de l’état de l’appareil
summary: Comment OpenClaw met à niveau sur place le précédent Plugin Matrix, notamment les limites de récupération de l’état chiffré et les étapes de récupération manuelle.
title: Migration Matrix
x-i18n:
    generated_at: "2026-07-12T15:03:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 33d5ac134338c8032ca1507ceee6eade2d37b3c86f0045fb883304ad208cd5e5
    source_path: channels/matrix-migration.md
    workflow: 16
---

Effectuez la mise à niveau depuis l’ancien plugin public `matrix` vers l’implémentation actuelle.

Pour la plupart des utilisateurs, la mise à niveau est déjà prise en charge :

- le plugin reste `@openclaw/matrix`
- le canal reste `matrix`
- votre configuration reste sous `channels.matrix`
- les identifiants mis en cache restent sous `~/.openclaw/credentials/matrix/`
- l’état d’exécution reste sous `~/.openclaw/matrix/`

Vous n’avez pas besoin de renommer les clés de configuration ni de réinstaller le plugin sous un nouveau nom.
Le paquet racine `openclaw` n’intègre plus le code d’exécution Matrix ni les
dépendances du SDK Matrix. Si `openclaw channels status` indique que Matrix est configuré, mais que le
plugin n’est pas installé, exécutez `openclaw doctor --fix` ou
`openclaw plugins install @openclaw/matrix` ; n’installez pas les paquets du SDK Matrix
dans le paquet racine OpenClaw.

## Ce que la migration effectue automatiquement

La migration Matrix s’exécute lorsque vous lancez [`openclaw doctor --fix`](/fr/gateway/doctor), ainsi qu’en solution de repli lorsque le client Matrix démarre et trouve encore un état annexe basé sur des fichiers à côté de son stockage SQLite.

La migration automatique couvre les éléments suivants :

- la réutilisation de vos identifiants Matrix mis en cache
- la conservation de la même sélection de compte et de la configuration `channels.matrix`
- l’importation de l’état annexe basé sur des fichiers (cache de synchronisation `bot-storage.json`, `recovery-key.json`, `legacy-crypto-migration.json`, instantanés IndexedDB) dans l’état SQLite de Matrix ; les fichiers migrés sont archivés avec le suffixe `.migrated`
- la réutilisation de la racine de stockage de hachages de jetons existante la plus complète pour le même compte Matrix, serveur d’accueil, utilisateur et appareil lorsque le jeton d’accès change ultérieurement

## Mise à niveau depuis des versions d’OpenClaw antérieures à 2026.4

Les versions allant jusqu’à la série 2026.6 migraient également la disposition Matrix
plate d’origine à stockage unique (`~/.openclaw/matrix/bot-storage.json` plus
`~/.openclaw/matrix/crypto/`) et préparaient la récupération de l’état chiffré depuis
l’ancien stockage cryptographique Rust. Les versions actuelles n’incluent plus cette migration.

Si vous mettez à niveau une installation qui utilise encore la disposition plate, commencez par
passer à une version 2026.6, exécutez `openclaw doctor --fix`, puis démarrez le Gateway
une fois afin de migrer le stockage plat et toutes les clés de salon récupérables. Passez ensuite
à la dernière version.

L’ancien plugin public Matrix ne créait **pas** automatiquement de sauvegardes des clés de salon Matrix. Si votre ancienne installation contenait un historique chiffré uniquement local qui n’a jamais été sauvegardé, certains anciens messages chiffrés peuvent rester illisibles après la mise à niveau, quel que soit le chemin de migration.

## Procédure de mise à niveau recommandée

1. Mettez à jour OpenClaw et le plugin Matrix normalement.
2. Exécutez :

   ```bash
   openclaw doctor --fix
   ```

3. Démarrez ou redémarrez le Gateway.
4. Vérifiez l’état actuel de la vérification et de la sauvegarde :

   ```bash
   openclaw matrix verify status
   openclaw matrix verify backup status
   ```

5. Placez la clé de récupération du compte Matrix que vous réparez dans une variable d’environnement propre à ce compte. Pour un seul compte par défaut, `MATRIX_RECOVERY_KEY` convient. Pour plusieurs comptes, utilisez une variable par compte, par exemple `MATRIX_RECOVERY_KEY_ASSISTANT`, et ajoutez `--account assistant` à la commande.

6. Si OpenClaw vous indique qu’une clé de récupération est nécessaire, exécutez la commande pour le compte correspondant :

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify backup restore --recovery-key-stdin --account assistant
   ```

7. Si cet appareil n’est toujours pas vérifié, exécutez la commande pour le compte correspondant :

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify device --recovery-key-stdin --account assistant
   ```

   Si la clé de récupération est acceptée et que la sauvegarde est utilisable, mais que `Cross-signing verified`
   vaut toujours `no`, effectuez l’auto-vérification depuis un autre client Matrix :

   ```bash
   openclaw matrix verify self
   ```

   Acceptez la demande dans un autre client Matrix, comparez les emoji ou les nombres décimaux,
   et saisissez `yes` uniquement s’ils correspondent. La commande attend que l’identité Matrix
   soit entièrement approuvée avant de signaler la réussite.

8. Si vous abandonnez volontairement l’ancien historique irrécupérable et souhaitez une nouvelle base de référence de sauvegarde pour les futurs messages, exécutez :

   ```bash
   openclaw matrix verify backup reset --yes
   ```

   Ajoutez `--rotate-recovery-key` uniquement si l’ancienne clé de récupération ne doit plus permettre de déverrouiller la nouvelle sauvegarde.

9. S’il n’existe encore aucune sauvegarde de clés côté serveur, créez-en une pour les récupérations futures :

   ```bash
   openclaw matrix verify bootstrap
   ```

## Messages courants et leur signification

`Failed migrating legacy Matrix client storage: ...`

- Signification : la solution de repli côté client Matrix a trouvé un état annexe basé sur des fichiers, mais l’importation dans SQLite a échoué. OpenClaw annule les déplacements terminés et interrompt cette solution de repli au lieu de démarrer silencieusement avec un nouveau stockage.
- Que faire : vérifiez les autorisations du système de fichiers ou les conflits, conservez l’ancien état intact, puis réessayez après avoir corrigé l’erreur.

`Matrix is installed from a custom path: ...`

- Signification : Matrix est épinglé à une installation depuis un chemin, les mises à jour de la branche principale ne le remplacent donc pas automatiquement par le paquet Matrix par défaut.
- Que faire : réinstallez-le avec `openclaw plugins install @openclaw/matrix` lorsque vous souhaitez revenir au plugin Matrix par défaut.

`Matrix is installed from a custom path that no longer exists: ...`

- Signification : l’enregistrement d’installation de votre plugin pointe vers un chemin local qui n’existe plus.
- Que faire : réinstallez-le avec `openclaw plugins install @openclaw/matrix` ou, si vous exécutez OpenClaw depuis une copie de travail du dépôt, avec `openclaw plugins install ./path/to/local/matrix-plugin`. `openclaw doctor --fix` peut également supprimer pour vous les références obsolètes au plugin Matrix.

### Messages de récupération manuelle

`openclaw matrix verify status` et `openclaw matrix verify backup status` affichent une ligne `Backup issue:` ainsi que des instructions `Next steps:` lorsque la sauvegarde des clés de salon n’est pas saine sur cet appareil :

| Problème de sauvegarde                                                 | Signification                                      | Correctif                                                                                                                                 |
| --------------------------------------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `no room-key backup exists on the homeserver`                         | aucune source depuis laquelle effectuer une restauration | `openclaw matrix verify bootstrap` pour créer une sauvegarde des clés de salon                                                             |
| `backup decryption key is not loaded on this device`                  | la clé existe, mais n’est pas active ici           | `openclaw matrix verify backup restore` ; si la clé ne peut toujours pas être chargée, transmettez la clé de récupération via `--recovery-key-stdin` |
| `backup decryption key could not be loaded from secret storage (...)` | le chargement depuis le stockage des secrets a échoué ou n’est pas pris en charge | transmettez la clé de récupération : `printf '%s\n' "$MATRIX_RECOVERY_KEY" \| openclaw matrix verify backup restore --recovery-key-stdin` |
| `backup key mismatch (...)`                                           | la clé stockée ne correspond pas à la sauvegarde active du serveur | réexécutez `verify backup restore --recovery-key-stdin` avec la clé de la sauvegarde active du serveur, ou `verify backup reset --yes` pour une nouvelle base de référence |
| `backup signature chain is not trusted by this device`                | l’appareil n’approuve pas encore la chaîne de signature croisée | `verify device --recovery-key-stdin`, puis `verify self` depuis un autre client vérifié si l’approbation reste incomplète                  |
| `backup exists but is not active on this device`                      | une sauvegarde existe sur le serveur, mais la session locale est inactive | vérifiez d’abord l’appareil, puis revérifiez avec `openclaw matrix verify backup status`                                                   |
| `backup trust state could not be fully determined`                    | les diagnostics n’ont pas permis de conclure       | `openclaw matrix verify status --verbose`                                                                                                 |

Autres erreurs de récupération :

`Matrix recovery key is required`

- Signification : vous avez tenté une étape de récupération sans fournir de clé de récupération alors qu’elle était requise.
- Que faire : réexécutez la commande avec `--recovery-key-stdin`, par exemple `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`.

`Invalid Matrix recovery key: ...`

- Signification : la clé fournie n’a pas pu être analysée ou ne correspondait pas au format attendu.
- Que faire : réessayez avec la clé de récupération exacte provenant de votre client Matrix ou de l’exportation de la clé de récupération.

`Matrix recovery key was applied, but this device still lacks full Matrix identity trust.`

- Signification : la clé de récupération a déverrouillé des données de sauvegarde utilisables, mais Matrix n’a pas établi une approbation complète de l’identité par signature croisée pour cet appareil. Recherchez dans la sortie de la commande `Recovery key accepted`, `Backup usable`, `Cross-signing verified` et `Device verified by owner`.
- Que faire : exécutez `openclaw matrix verify self`, acceptez la demande dans un autre client Matrix, comparez le SAS et saisissez `yes` uniquement s’il correspond. Utilisez `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify bootstrap --recovery-key-stdin --force-reset-cross-signing` uniquement si vous souhaitez volontairement remplacer l’identité de signature croisée actuelle.

Si vous acceptez de perdre l’ancien historique chiffré irrécupérable, vous pouvez plutôt réinitialiser la
base de référence de sauvegarde actuelle avec `openclaw matrix verify backup reset --yes`. Lorsque le
secret de sauvegarde stocké est défectueux, cette réinitialisation répare également le stockage des secrets afin que la
nouvelle clé de sauvegarde puisse être chargée correctement après le redémarrage.

## Si l’historique chiffré ne revient toujours pas

Exécutez ces vérifications dans l’ordre :

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin --verbose
```

Si la sauvegarde est restaurée correctement, mais que l’historique manque encore dans certains anciens salons, ces clés manquantes n’ont probablement jamais été sauvegardées par l’ancien plugin.

## Si vous souhaitez repartir de zéro pour les futurs messages

Si vous acceptez de perdre l’ancien historique chiffré irrécupérable et souhaitez uniquement disposer d’une base de référence de sauvegarde propre pour la suite, exécutez ces commandes dans l’ordre :

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

Si l’appareil n’est toujours pas vérifié après cela, terminez la vérification depuis votre client Matrix en comparant les emoji SAS ou les codes décimaux et en confirmant qu’ils correspondent.

## Voir aussi

- [Matrix](/fr/channels/matrix) : configuration du canal.
- [Règles push Matrix](/fr/channels/matrix-push-rules) : routage des notifications.
- [Doctor](/fr/gateway/doctor) : contrôle d’intégrité et déclencheur de migration automatique.
- [Guide de migration](/fr/install/migrating) : tous les chemins de migration (déplacements entre machines, importations entre systèmes).
- [Plugins](/fr/tools/plugin) : installation et enregistrement des plugins.
