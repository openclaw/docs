---
read_when:
    - Vous rencontrez des problèmes de connectivité ou d’authentification et souhaitez être guidé pour les résoudre
    - Vous avez effectué une mise à jour et souhaitez une vérification rapide de cohérence.
summary: Référence de la CLI pour `openclaw doctor` (vérifications d’intégrité + réparations guidées)
title: Docteur
x-i18n:
    generated_at: "2026-07-12T15:10:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 4e616fd0843183167662292acf501297f44520050b664796fbb15a117cb68905
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Contrôles d’intégrité et corrections rapides pour le Gateway, les canaux, les plugins, les Skills, le routage des modèles, l’état local et les migrations de configuration. Utilisez cette commande dès qu’un élément ne fonctionne pas comme prévu et que vous souhaitez qu’une seule commande explique le problème.

Voir aussi :

- Dépannage : [Dépannage](/fr/gateway/troubleshooting)
- Audit de sécurité : [Sécurité](/fr/gateway/security)

## Modes

Doctor propose cinq modes :

| Mode                          | Commande                                  | Comportement                                                                                                                        |
| ----------------------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Inspection                    | `openclaw doctor`                         | Contrôles destinés aux humains et invites guidées.                                                                                  |
| Réparation                    | `openclaw doctor --fix`                   | Applique les réparations prises en charge, avec des invites sauf si une réparation non interactive est sûre.                        |
| Lint                          | `openclaw doctor --lint`                  | Résultats structurés en lecture seule pour la CI, les vérifications préalables et les contrôles de revue.                            |
| Maintenance SQLite partagée   | `openclaw doctor --state-sqlite compact`  | Crée explicitement un point de contrôle, compacte et vérifie la base de données canonique d’état partagé.                            |
| Migration SQLite des sessions | `openclaw doctor --session-sqlite <mode>` | Inspecte, importe, valide, compacte, récupère ou restaure l’état des sessions.                                                       |

Privilégiez `--lint` lorsque l’automatisation nécessite un résultat stable. Privilégiez `--fix` lorsqu’un opérateur humain souhaite que Doctor modifie la configuration ou l’état.

## Exemples

```bash
openclaw doctor
openclaw doctor --lint
openclaw doctor --lint --json
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --all
openclaw doctor --lint --allow-exec
openclaw doctor --deep
openclaw doctor --fix
openclaw doctor --fix --non-interactive
openclaw doctor --generate-gateway-token
openclaw doctor --post-upgrade
openclaw doctor --post-upgrade --json
openclaw doctor --state-sqlite compact
openclaw doctor --state-sqlite compact --json
openclaw doctor --session-sqlite inspect --session-sqlite-all-agents
openclaw doctor --session-sqlite dry-run --session-sqlite-agent main --json
openclaw doctor --session-sqlite import --session-sqlite-all-agents
openclaw doctor --session-sqlite validate --session-sqlite-all-agents --json
openclaw doctor --session-sqlite compact --session-sqlite-all-agents
openclaw doctor --session-sqlite recover --github-issue
openclaw doctor --session-sqlite restore --session-sqlite-all-agents
```

Pour les autorisations propres aux canaux, utilisez les sondes de canal plutôt que `doctor` :

```bash
openclaw channels capabilities --channel discord --target channel:<channel-id>
openclaw channels status --probe
```

`channels capabilities` indique les autorisations effectives du bot pour une cible de canal précise. `channels status --probe` audite tous les canaux configurés et les cibles de connexion automatique aux canaux vocaux.

## Options

| Option                          | Effet                                                                                                                                                                                                                          |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `--no-workspace-suggestions`    | Désactive les suggestions de mémoire et de recherche de l’espace de travail.                                                                                                                                                    |
| `--yes`                         | Accepte les valeurs par défaut sans invite.                                                                                                                                                                                     |
| `--repair` / `--fix`            | Applique les réparations recommandées hors service sans invite (`--fix` est un alias). Les installations ou réécritures du service Gateway nécessitent toujours une confirmation interactive ou des commandes `gateway` explicites. |
| `--force`                       | Applique des réparations agressives, y compris l’écrasement d’une configuration de service personnalisée.                                                                                                                       |
| `--non-interactive`             | S’exécute sans invite ; uniquement les migrations sûres et les réparations hors service.                                                                                                                                        |
| `--generate-gateway-token`      | Génère et configure un jeton de Gateway.                                                                                                                                                                                        |
| `--allow-exec`                  | Autorise Doctor à exécuter les `exec` SecretRefs configurées lors de la vérification des secrets.                                                                                                                               |
| `--deep`                        | Analyse les services système pour rechercher des installations supplémentaires du Gateway ; signale les récents transferts de redémarrage du superviseur du Gateway.                                                           |
| `--lint`                        | Exécute les contrôles d’intégrité modernisés en lecture seule et produit des résultats de diagnostic.                                                                                                                           |
| `--post-upgrade`                | Exécute les sondes de compatibilité des plugins après la mise à niveau ; les résultats sont envoyés vers stdout ; code de sortie 1 si un résultat de niveau erreur est présent.                                                  |
| `--state-sqlite <mode>`         | Exécute une maintenance SQLite explicite de l’état partagé. Le seul mode est `compact`.                                                                                                                                         |
| `--session-sqlite <mode>`       | Exécute le mode de migration SQLite ciblé des sessions : `inspect`, `dry-run`, `import`, `validate`, `compact`, `recover` ou `restore`.                                                                                          |
| `--session-sqlite-store <path>` | Avec `--session-sqlite` : sélectionne le chemin d’un magasin `sessions.json` hérité.                                                                                                                                             |
| `--session-sqlite-agent <id>`   | Avec `--session-sqlite` : sélectionne un agent configuré.                                                                                                                                                                       |
| `--session-sqlite-all-agents`   | Avec `--session-sqlite` : sélectionne les magasins d’agents configurés et découverts.                                                                                                                                            |
| `--github-issue`                | Avec `--session-sqlite recover` : prépare un rapport de problème openclaw/openclaw nettoyé ; Doctor le crée avec `gh` après `--yes` ou une confirmation interactive.                                                             |
| `--json`                        | Avec `--lint` : résultats JSON. Avec `--post-upgrade` : `{ probesRun, findings }`. Avec `--state-sqlite` ou `--session-sqlite` : rapport de maintenance au format JSON.                                                           |
| `--severity-min <level>`        | Avec `--lint` : ignore les résultats dont le niveau est inférieur à `info`, `warning` ou `error`.                                                                                                                               |
| `--all`                         | Avec `--lint` : exécute tous les contrôles enregistrés, y compris ceux à activation explicite exclus de l’ensemble par défaut.                                                                                                  |
| `--skip <id>`                   | Avec `--lint` : ignore un identifiant de contrôle. Répétable.                                                                                                                                                                   |
| `--only <id>`                   | Avec `--lint` : exécute uniquement les identifiants de contrôle indiqués. Répétable.                                                                                                                                            |

`--severity-min`, `--all`, `--only` et `--skip` ne sont acceptés qu’avec `--lint` ; `--json` est accepté avec `--lint`, `--post-upgrade`, `--state-sqlite` et `--session-sqlite`.

## Mode Lint

`openclaw doctor --lint` est en lecture seule : aucune invite, aucune réparation, aucune réécriture de la configuration ou de l’état.

```bash
openclaw doctor --lint
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --json
openclaw doctor --lint --all
openclaw doctor --lint --allow-exec
openclaw doctor --lint --only core/doctor/gateway-config --json
openclaw doctor --lint --only core/doctor/local-audio-acceleration --severity-min info
```

La sortie destinée aux humains est concise :

```text
doctor --lint : 6 contrôle(s) exécuté(s), 1 résultat(s)
  [warning] core/doctor/gateway-config gateway.mode - gateway.mode n’est pas défini ; le démarrage du Gateway sera bloqué.
    correction : exécutez `openclaw configure` et définissez le mode du Gateway (local/remote), ou `openclaw config set gateway.mode local`.
```

La sortie JSON constitue l’interface de script :

```json
{
  "ok": false,
  "checksRun": 5,
  "checksSkipped": 0,
  "findings": [
    {
      "checkId": "core/doctor/gateway-config",
      "severity": "warning",
      "message": "gateway.mode n’est pas défini ; le démarrage du Gateway sera bloqué.",
      "path": "gateway.mode",
      "fixHint": "Exécutez `openclaw configure` et définissez le mode du Gateway (local/remote), ou `openclaw config set gateway.mode local`."
    }
  ]
}
```

Codes de sortie :

| Code | Signification                                                                 |
| ---- | ----------------------------------------------------------------------------- |
| `0`  | Aucun résultat égal ou supérieur au seuil de gravité sélectionné.             |
| `1`  | Au moins un résultat atteint le seuil sélectionné.                             |
| `2`  | Échec de la commande ou de l’exécution avant la production des résultats Lint. |

`--severity-min` détermine à la fois les résultats affichés et le seuil de sortie : `openclaw doctor --lint --severity-min error` peut ne rien afficher et se terminer avec le code `0`, même lorsque des résultats `info`/`warning` de moindre gravité existent.

`--all` détermine les contrôles sélectionnés avant le filtrage par gravité. L’exécution Lint par défaut exclut les contrôles approfondis, historiques ou davantage susceptibles de révéler des résidus hérités réparables ; utilisez `--all` pour obtenir l’inventaire complet. `--only <id>` est le sélecteur le plus précis et peut exécuter n’importe quel contrôle enregistré à partir de son identifiant.

`core/doctor/local-audio-acceleration` indique la commande STT locale sélectionnée automatiquement, les éléments probants distincts relatifs aux backends compatibles, demandés et observés, ainsi que l’ordre de repli, sans charger de modèle vocal. Il produit un résultat informatif ; incluez donc `--severity-min info` pour l’afficher.

## Contrôles d’intégrité structurés

Les contrôles Doctor modernes utilisent un petit contrat scindé :

```ts
detect(ctx, scope?) -> HealthFinding[]
repair?(ctx, findings) -> HealthRepairResult
```

`detect()` alimente `doctor --lint`. `repair()` est facultatif et ne s’exécute qu’avec `doctor --fix` / `doctor --repair`. Les contrôles qui n’ont pas encore migré vers cette forme utilisent toujours le flux hérité de contribution à Doctor.

Les contextes de réparation peuvent contenir des demandes `dryRun`/`diff` ; les résultats de réparation peuvent renvoyer des `diffs` structurés (modifications de configuration ou de fichiers) et des `effects` (effets secondaires sur un service, un processus, un paquet, l’état ou autres). Les contrôles convertis peuvent ainsi évoluer vers `doctor --fix --dry-run` sans déplacer la planification des mutations dans `detect()`.

`repair()` signale `status: "repaired" | "skipped" | "failed"` (l’absence de statut signifie `repaired`). Lorsque la réparation renvoie `skipped` ou `failed`, Doctor indique la raison et ignore la validation de ce contrôle. Après une réparation réussie, Doctor réexécute `detect()` avec une portée limitée aux résultats réparés ; si le résultat est toujours présent, Doctor signale un avertissement de réparation au lieu de considérer la modification comme terminée.

Un résultat comprend :

| Champ             | Objectif                                               |
| ----------------- | ------------------------------------------------------ |
| `checkId`         | Identifiant stable pour les filtres skip/only et les listes d’autorisation CI. |
| `severity`        | `info`, `warning` ou `error`.                          |
| `message`         | Description du problème lisible par un humain.         |
| `path`            | Chemin de configuration, de fichier ou chemin logique, lorsqu’il est disponible. |
| `line` / `column` | Emplacement dans la source, lorsqu’il est disponible.  |
| `ocPath`          | Adresse `oc://` précise lorsqu’une vérification peut en désigner une. |
| `fixHint`         | Action suggérée à l’opérateur ou résumé de la réparation. |

Les vérifications modernisées du doctor du cœur restent rattachées à la contribution doctor ordonnée qui gère leur comportement visible dans `doctor` / `doctor --fix`. Le registre partagé et structuré d’état de santé constitue le point d’extension : les vérifications intégrées et celles fournies par des plugins s’exécutent après les vérifications du doctor du cœur, une fois que leur package propriétaire les a enregistrées dans le chemin de commande actif. `openclaw/plugin-sdk/health` expose le même contrat aux auteurs de plugins.

## Sélection des vérifications

```bash
openclaw doctor --lint --only core/doctor/gateway-config --json
openclaw doctor --lint --skip core/doctor/skills-readiness
openclaw doctor --lint --all --skip core/doctor/session-locks
```

`--only` et `--skip` acceptent les identifiants complets des vérifications et peuvent être répétés. Si un identifiant `--only` n’est pas enregistré, aucune vérification ne s’exécute pour cet identifiant ; utilisez `checksRun`/`checksSkipped` dans la sortie pour confirmer qu’un contrôle ciblé sélectionne les vérifications attendues.

## Mode post-mise à niveau

`openclaw doctor --post-upgrade` exécute des sondes de compatibilité des plugins afin de permettre leur enchaînement après une compilation ou une mise à niveau. Les constats sont envoyés vers stdout ; le code de sortie est 1 si au moins un constat possède `level: "error"`. Ajoutez `--json` pour obtenir une enveloppe lisible par machine (`{ probesRun, findings }`), adaptée à la CI, au skill communautaire `fork-upgrade` et aux autres outils de test rapide post-mise à niveau. Si l’index des plugins installés est absent ou mal formé, le mode JSON émet tout de même l’enveloppe avec un constat d’erreur `plugin.index_unavailable`.

Le démarrage d’une image de conteneur constitue l’exception au processus habituel « exécuter doctor après
la mise à jour ». Lorsque `openclaw gateway run` démarre avec une nouvelle version d’OpenClaw, il
exécute des réparations sûres de l’état et des plugins avant de signaler qu’il est prêt. Si la réparation ne peut pas
se terminer en toute sécurité, le démarrage s’interrompt et vous indique d’exécuter une fois la même image avec
`openclaw doctor --fix` sur le même état et la même configuration montés avant de redémarrer
normalement le conteneur.

## Compaction SQLite de l’état partagé

`openclaw doctor --state-sqlite compact` est une opération explicite de maintenance hors ligne pour
la base de données canonique de l’état partagé située à
`<state-dir>/state/openclaw.sqlite`. Elle n’accepte pas un chemin de base de données
arbitraire, n’est jamais invoquée lors du fonctionnement normal du Gateway et ne fait pas partie de
`openclaw doctor --fix`.

Arrêtez le Gateway et créez d’abord une sauvegarde vérifiée :

```bash
openclaw gateway stop
openclaw backup create --verify
openclaw doctor --state-sqlite compact --json
openclaw gateway start
```

La commande :

1. Exige un fichier ordinaire au chemin canonique de l’état partagé. Une base de données
   absente est signalée comme `skipped` et la commande se termine avec succès.
2. Valide la version actuelle prise en charge du schéma et
   `schema_meta.role = "global"` avant d’effectuer un point de contrôle ou de modifier le fichier.
3. Exige un `wal_checkpoint(TRUNCATE)` non occupé. Arrêtez tout processus OpenClaw
   restant et réessayez si le point de contrôle est occupé.
4. Définit `auto_vacuum` sur `INCREMENTAL`, exécute un `VACUUM` complet et effectue
   un nouveau point de contrôle.
5. Exécute `quick_check`, `integrity_check` et `foreign_key_check`, puis
   réapplique les autorisations réservées au propriétaire à la base de données et aux fichiers annexes SQLite.

La sortie JSON indique les tailles de la base de données et du WAL, le nombre de pages de la liste libre, la taille des pages et
la valeur `auto_vacuum` avant et après la compaction, ainsi que le nombre d’octets récupérés et les
résultats de `quick_check` et `integrity_check`. `foreign_key_check` est appliqué
selon un principe de fermeture en cas d’échec et ne possède pas de champ de réussite distinct. SQLite indique `auto_vacuum`
avec `0` pour aucun, `1` pour complet et `2` pour incrémentiel.

La compaction échoue sans modification lorsque le schéma est ancien, plus récent que la
version d’OpenClaw en cours d’exécution ou appartient à une base de données d’agent. Exécutez d’abord
`openclaw doctor --fix` pour un ancien schéma d’état partagé. Restaurez une
sauvegarde compatible ou mettez OpenClaw à niveau pour un schéma plus récent.

## Migration SQLite des sessions

OpenClaw importe automatiquement les anciennes lignes de session et l’historique des transcriptions dans la
base de données SQLite de chaque agent lors du démarrage du Gateway et pendant
`openclaw doctor --fix`. `openclaw doctor --session-sqlite <mode>` est l’outil
ciblé d’inspection et de validation de cette migration. Les lignes de session utilisées par l’exécution
actuelle se trouvent dans
`~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`. Les anciens fichiers
`sessions.json` constituent les sources de migration. Les fichiers JSONL de transcription actifs sont
importés puis archivés hors du répertoire des sessions actives après une
importation réussie ; les fichiers JSONL du niveau d’archivage restent des artefacts d’assistance, et non des
solutions de repli pour l’exécution.

Modes :

| Mode       | Comportement                                                                                                           |
| ---------- | ---------------------------------------------------------------------------------------------------------------------- |
| `inspect`  | Lit les décomptes de l’ancien stockage et de SQLite, ainsi que les fichiers JSONL non référencés, sans effectuer d’importation. |
| `dry-run`  | Analyse les entrées anciennes et les fichiers JSONL de transcription, compte les lignes importables et signale les problèmes sans écrire de lignes SQLite. |
| `import`   | Importe les entrées anciennes et les événements de transcription dans SQLite pour les cibles sélectionnées.           |
| `validate` | Compare les sources anciennes sélectionnées aux lignes SQLite et aux décomptes d’événements de transcription.         |
| `compact`  | Effectue un point de contrôle et un VACUUM des bases de données SQLite des agents sélectionnés afin de récupérer les pages libres après des suppressions importantes ou un nettoyage des archives. |
| `recover`  | Restaure la dernière exécution de migration ayant échoué, valide ses cibles et prépare un rapport de problème GitHub expurgé. |
| `restore`  | Restaure les artefacts de transcription archivés à partir des manifestes de migration enregistrés sans supprimer les données SQLite. |

Sélecteurs :

- Par défaut : le stockage configuré de l’agent par défaut, lorsque ce fichier de stockage ancien existe.
- `--session-sqlite-agent <id>` : un agent configuré.
- `--session-sqlite-all-agents` : les stockages d’agents configurés ainsi que les stockages d’agents découverts.
- `--session-sqlite-store <path>` : un chemin explicite vers un ancien fichier `sessions.json`.

Séquence d’inspection manuelle :

```bash
openclaw doctor --session-sqlite inspect --session-sqlite-all-agents
openclaw doctor --session-sqlite dry-run --session-sqlite-all-agents --json
openclaw doctor --session-sqlite import --session-sqlite-all-agents
openclaw doctor --session-sqlite validate --session-sqlite-all-agents --json
openclaw doctor --session-sqlite compact --session-sqlite-all-agents
openclaw doctor --session-sqlite recover --github-issue
```

Sauvegardez le répertoire d’état d’OpenClaw avant d’exécuter `import` sur une installation contenant
un historique important. `validate` renvoie un code de sortie différent de zéro lorsqu’une entrée ancienne sélectionnée est
absente de SQLite, qu’un identifiant de session diffère ou que le nombre d’événements d’une transcription diffère.
Lorsque vous utilisez `--session-sqlite-store <path>`, vérifiez que le rapport contient le
nombre de cibles attendu ; un chemin explicite vers un stockage inexistant ne sélectionne aucune cible.

Les suppressions SQLite récupèrent d’abord les pages à l’intérieur de la base de données ; elles ne réduisent pas nécessairement
immédiatement la taille du fichier de base de données. Après avoir supprimé ou archivé des
transcriptions volumineuses, exécutez `openclaw doctor --session-sqlite compact --session-sqlite-all-agents`
pour effectuer un point de contrôle des fichiers WAL, exécuter `VACUUM` et indiquer les tailles
de la base de données et du WAL avant et après l’opération. La compaction exige un fichier ordinaire utilisant le schéma
d’agent actuel, les métadonnées persistantes du propriétaire de l’agent sélectionné et l’absence de descripteur ouvert dans le processus
doctor. Il s’agit d’une maintenance hors ligne explicite : arrêtez d’abord le Gateway afin que les écritures
normales ne puissent pas entrer en concurrence avec le point de contrôle ou `VACUUM`.

Chaque importation écrit un manifeste sous
`~/.openclaw/session-sqlite-migration-runs/` avant de déplacer les artefacts de transcription
vers l’archive. Si le démarrage signale l’échec d’une migration SQLite des sessions après le
déplacement des artefacts, exécutez la récupération :

```bash
openclaw doctor --session-sqlite recover --github-issue
```

La récupération sélectionne le dernier manifeste de migration ayant échoué, restaure uniquement les
artefacts archivés par ce manifeste, valide les cibles concernées, actualise les
rapports expurgés `.failure.md` et `.failure.json`, et prépare le corps d’un problème GitHub
qui exclut le contenu des transcriptions, l’environnement brut, les secrets et les
configurations sans limite de taille. Lorsqu’il n’existe aucun manifeste de migration ayant échoué, mais qu’une base de données SQLite
d’un agent sélectionné est corrompue, n’est pas une base de données ou possède des fichiers annexes de journal sans base de données
principale, la récupération copie l’ensemble complet des fichiers dans un répertoire temporaire
d’inspection. SQLite peut annuler un journal actif valide dans cette copie jetable
avant l’exécution de `quick_check`, `integrity_check` et `foreign_key_check`, tandis que les
fichiers forensiques d’origine restent intacts. Les échecs des vérifications d’intégrité ou les fichiers annexes
orphelins préservent les fichiers DB, WAL, SHM et de journal d’annulation en renommant
tout l’ensemble découvert avec un même suffixe `.corrupt-<timestamp>`. En cas d’échec
intercepté du renommage, les fichiers déjà déplacés sont remis en place avant le signalement de l’échec, afin qu’un
ensemble de fichiers récupérable ne soit pas divisé silencieusement. Arrêtez le Gateway avant la récupération ;
la copie ou le renommage d’un ensemble de fichiers SQLite en cours de modification est dangereux et se comporte
différemment selon les systèmes d’exploitation. Avec `--github-issue --yes`, doctor utilise
la CLI GitHub pour créer le problème dans `openclaw/openclaw` ; sans confirmation,
il écrit le rapport d’assistance local et affiche une URL de problème préremplie.

`restore` reste l’opération d’annulation de plus bas niveau. Elle utilise les enregistrements
`sourcePath -> archivePath` du manifeste, replace les artefacts archivés uniquement lorsque le
chemin d’origine est absent, signale les conflits lorsque les deux chemins existent et laisse
la base de données SQLite en place.

### Rétrogradation après la migration SQLite des sessions

Avant de démarrer une ancienne version d’OpenClaw reposant sur des fichiers, restaurez les
anciens artefacts de transcription archivés :

```bash
openclaw doctor --session-sqlite restore --session-sqlite-all-agents
```

Les anciennes versions lisent les entrées de `sessions.json` et les chemins `sessionFile` enregistrés
dans ces entrées. Après la migration SQLite, les importations réussies déplacent les transcriptions JSONL
actives dans `session-sqlite-import-archive/`, de sorte que l’ancien environnement d’exécution ne peut pas
accéder à cet historique tant que la restauration n’a pas replacé les artefacts consignés dans le manifeste à
leurs chemins d’origine.

La restauration ne supprime pas les données SQLite. Les sessions créées après le basculement vers SQLite
existent uniquement dans SQLite et n’apparaîtront pas dans l’ancien environnement d’exécution. Si vous effectuez
ultérieurement une nouvelle mise à niveau, exécutez la séquence normale de validation de la migration ci-dessus afin qu’OpenClaw puisse
comparer les artefacts anciens restaurés aux lignes SQLite avant l’importation.

## Remarques

- En mode Nix (`OPENCLAW_NIX_MODE=1`), les vérifications en lecture seule de doctor fonctionnent toujours, mais `doctor --fix`, `doctor --repair`, `doctor --yes` et `doctor --generate-gateway-token` sont désactivés, car `openclaw.json` est immuable. Modifiez plutôt la source Nix de cette installation ; pour nix-openclaw, utilisez le [Démarrage rapide](https://github.com/openclaw/nix-openclaw#quick-start), qui privilégie les agents.
- Les invites interactives (correctifs du trousseau/OAuth, etc.) ne s’exécutent que lorsque stdin est un TTY et que `--non-interactive` n’est **pas** défini. Les exécutions sans interface (cron, Telegram, sans terminal) ignorent les invites.
- Les exécutions non interactives de `doctor` ignorent le chargement anticipé des plugins afin que les vérifications d’intégrité sans interface restent rapides. Les sessions interactives chargent toujours les surfaces de plugins nécessaires à l’ancien flux de vérification d’intégrité et de réparation.
- `--lint` est plus strict que `--non-interactive` : il est toujours en lecture seule, n’affiche jamais d’invite et n’applique jamais de migrations sûres. Utilisez `doctor --fix` ou `doctor --repair` lorsque vous souhaitez que doctor apporte des modifications.
- Par défaut, doctor n’exécute pas les SecretRefs `exec` lors de la vérification des secrets. Utilisez `--allow-exec` (avec ou sans `--lint`) uniquement lorsque vous souhaitez intentionnellement que doctor exécute ces résolveurs de secrets configurés.
- Toute écriture de configuration (y compris une réparation avec `--fix`) fait tourner une sauvegarde vers `~/.openclaw/openclaw.json.bak` (avec un cycle numéroté de `.bak.1` à `.bak.4`). `--fix` supprime également les clés de configuration inconnues signalées par la validation du schéma, en répertoriant chaque suppression ; cette opération est ignorée pendant une mise à jour afin que l’état de mise à niveau partiellement écrit ne soit pas supprimé avant la fin de sa migration.
- Définissez `OPENCLAW_SERVICE_REPAIR_POLICY=external` lorsqu’un autre superviseur gère le cycle de vie du Gateway. Doctor continue de signaler l’état du Gateway et du service et d’appliquer les réparations hors service, mais ignore l’installation, le démarrage, le redémarrage et l’amorçage du service, ainsi que le nettoyage de l’ancien service.
- Sous Linux, doctor ignore les unités systemd supplémentaires inactives semblables à un Gateway et ne réécrit pas les métadonnées de commande ou de point d’entrée d’un service Gateway systemd en cours d’exécution pendant la réparation. Arrêtez d’abord le service ou utilisez `openclaw gateway install --force` pour remplacer le lanceur actif.
- `doctor --fix --non-interactive` signale les définitions de service Gateway manquantes ou obsolètes, mais ne les installe ni ne les réécrit en dehors du mode de réparation de mise à jour. Exécutez `openclaw gateway install` pour un service manquant ou `openclaw gateway install --force` pour remplacer le lanceur.
- Les vérifications d’intégrité de l’état détectent les fichiers de transcription orphelins dans le répertoire des sessions. Leur archivage sous la forme `.deleted.<timestamp>` nécessite une confirmation interactive ; `--fix`, `--yes` et les exécutions sans interface les laissent en place.
- Doctor analyse `~/.openclaw/cron/jobs.json` (ou `cron.store`) à la recherche d’anciennes structures de tâches cron et les réécrit avant d’importer les lignes canoniques dans SQLite.
- Doctor signale les tâches cron avec un remplacement explicite de `payload.model`, y compris le nombre d’espaces de noms de fournisseurs et les divergences avec `agents.defaults.model`, afin que les tâches planifiées qui n’héritent pas du modèle par défaut soient visibles lors des investigations sur l’authentification ou la facturation.
- Doctor signale les tâches cron toujours marquées comme étant en cours (`state.runningAtMs`), ce qui peut amener `openclaw cron list` à les afficher comme `running`. Cette vérification est en lecture seule : si aucun Gateway n’exécute actuellement une tâche marquée, le prochain démarrage du service cron enregistre l’exécution interrompue et efface le marqueur.
- Sous Linux, doctor avertit lorsque la crontab de l’utilisateur exécute encore l’ancien script non maintenu `~/.openclaw/bin/ensure-whatsapp.sh`, qui peut signaler à tort `Gateway inactive` lorsque cron ne dispose pas de l’environnement du bus utilisateur systemd.
- Lorsque WhatsApp est activé, doctor vérifie si la boucle d’événements du Gateway est dégradée alors que des clients `openclaw-tui` locaux sont toujours en cours d’exécution. `doctor --fix` arrête uniquement les clients TUI locaux vérifiés afin que les réponses WhatsApp ne soient pas mises en attente derrière des boucles d’actualisation TUI obsolètes.
- Doctor réécrit les références de modèles héritées `openai-codex/*` en références canoniques `openai/*` dans les modèles principaux, les modèles de secours, les modèles de génération d’images et de vidéos, les remplacements de heartbeat, de sous-agent et de compaction, les hooks, les remplacements de modèles de canaux et les anciens épinglages de routes de session. `--fix` migre également les profils d’authentification hérités `openai-codex:*` et les entrées `auth.order.openai-codex` vers `openai:*`, déplace l’intention Codex vers les entrées `agentRuntime.id: "codex"` limitées au fournisseur et au modèle, supprime les anciens épinglages d’environnement d’exécution pour l’ensemble de l’agent ou la session, et conserve les références d’agents OpenAI réparées sur le routage d’authentification Codex plutôt que sur l’authentification directe par clé API OpenAI.
- Doctor signale les listes non vides `auth.order.<provider>` dont tous les profils référencés ont disparu alors que des identifiants compatibles sont stockés. `doctor --fix` supprime uniquement ces remplacements obsolètes, rétablissant la sélection automatique des identifiants par agent ; les ordres explicitement vides, les listes partiellement actives et les ordres sans identifiant stocké compatible restent inchangés. Si un magasin d’authentification SQLite actif est illisible ou mal formé, doctor explique pourquoi cette réparation a été ignorée. Redémarrez un Gateway en cours d’exécution avant de revérifier l’état de l’authentification si son mode de rechargement de la configuration n’applique pas automatiquement l’écriture.
- Doctor nettoie l’ancien état de préparation des dépendances de plugins issu de versions antérieures d’OpenClaw et recrée le lien vers le paquet hôte `openclaw` pour les plugins npm gérés qui le déclarent comme dépendance homologue. Il répare également les plugins téléchargeables manquants référencés par la configuration (`plugins.entries`, canaux configurés, paramètres de fournisseur/recherche configurés, environnements d’exécution d’agent configurés). Pendant les mises à jour de paquets, doctor ignore la réparation des plugins par le gestionnaire de paquets jusqu’à la fin du remplacement du paquet ; réexécutez ensuite `openclaw doctor --fix` si un plugin configuré doit encore être restauré. Si un téléchargement échoue, doctor signale l’erreur d’installation et conserve l’entrée du plugin configuré pour la prochaine tentative de réparation.
- Doctor répare la configuration obsolète des plugins en supprimant les identifiants de plugins manquants de `plugins.allow`/`plugins.deny`/`plugins.entries`, ainsi que la configuration de canal correspondante devenue orpheline, les cibles de heartbeat et les remplacements de modèles de canaux, lorsque la découverte des plugins fonctionne correctement.
- Doctor met en quarantaine la configuration de plugin non valide en désactivant l’entrée `plugins.entries.<id>` concernée et en supprimant sa charge utile `config` non valide. Le démarrage du Gateway ignore déjà uniquement ce plugin défectueux afin que les autres plugins et canaux continuent de fonctionner.
- Doctor supprime l’option retirée `plugins.entries.codex.config.codexDynamicToolsProfile` ; le serveur d’application Codex conserve toujours les outils d’espace de travail natifs de Codex sous leur forme native.
- Doctor migre automatiquement l’ancienne configuration Talk à plat (`talk.voiceId`, `talk.modelId` et les options associées) vers `talk.provider` + `talk.providers.<provider>`. Les exécutions répétées de `doctor --fix` ne signalent ni n’appliquent plus la normalisation de Talk lorsque la seule différence réside dans l’ordre des clés de l’objet.
- Doctor inclut une vérification de l’état de préparation de la recherche en mémoire et peut recommander `openclaw configure --section model` lorsque les identifiants d’intégration vectorielle sont manquants.
- Doctor avertit lorsqu’aucun propriétaire de commandes n’est configuré. Le propriétaire de commandes est le compte de l’opérateur humain autorisé à exécuter les commandes réservées au propriétaire et à approuver les actions dangereuses. L’association par message privé permet uniquement à une personne de parler au bot ; si vous avez approuvé un expéditeur avant l’existence de l’amorçage du premier propriétaire, définissez explicitement `commands.ownerAllowFrom`.
- Doctor affiche une note d’information lorsque des agents en mode Codex sont configurés et que des ressources personnelles de la CLI Codex existent dans le répertoire personnel Codex de l’opérateur. Les lancements locaux du serveur d’application Codex utilisent des répertoires personnels isolés par agent ; installez d’abord le plugin Codex si nécessaire, puis utilisez `openclaw migrate plan codex` pour inventorier les ressources qui doivent être promues délibérément.
- Doctor avertit lorsque des compétences autorisées pour l’agent par défaut ne sont pas disponibles dans l’environnement d’exécution actuel (binaires, variables d’environnement, configuration ou exigences du système d’exploitation manquants). `doctor --fix` peut désactiver ces compétences indisponibles avec `skills.entries.<skill>.enabled=false` ; installez ou configurez plutôt l’exigence manquante si vous souhaitez conserver la compétence active.
- Si le mode bac à sable est activé mais que Docker n’est pas disponible, doctor affiche un avertissement très explicite avec une solution (`install Docker` ou `openclaw config set agents.defaults.sandbox.mode off`).
- Si d’anciens fichiers de registre ou répertoires de fragments du bac à sable sont présents (`~/.openclaw/sandbox/containers.json`, `~/.openclaw/sandbox/browsers.json`, `~/.openclaw/sandbox/containers/` ou `~/.openclaw/sandbox/browsers/`), doctor les signale ; `--fix` migre les entrées valides vers SQLite et met en quarantaine les anciens fichiers non valides.
- Si `gateway.auth.token`/`gateway.auth.password` sont gérés par SecretRef et indisponibles dans le chemin de commande actuel, doctor affiche un avertissement en lecture seule et n’écrit pas d’identifiants de secours en texte clair. Pour les SecretRefs reposant sur exec, doctor ignore l’exécution sauf si `--allow-exec` est présent.
- Si l’inspection d’une SecretRef de canal échoue dans un chemin de correction, doctor poursuit son exécution et affiche un avertissement au lieu de s’arrêter prématurément.
- Après les migrations du répertoire d’état, doctor avertit lorsque les comptes Telegram ou Discord par défaut activés dépendent d’une valeur de secours provenant de l’environnement et que `TELEGRAM_BOT_TOKEN` ou `DISCORD_BOT_TOKEN` n’est pas disponible pour le processus doctor.
- La résolution automatique des noms d’utilisateur Telegram dans `allowFrom` (`doctor --fix`) nécessite un jeton Telegram pouvant être résolu dans le chemin de commande actuel. Si l’inspection du jeton n’est pas disponible, doctor affiche un avertissement et ignore la résolution automatique pour cette exécution.

## macOS : remplacements d’environnement `launchctl`

Si vous avez précédemment exécuté `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (ou `...PASSWORD`), cette valeur remplace votre fichier de configuration et peut provoquer des erreurs persistantes « unauthorized ».

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Voir aussi

- [Référence de la CLI](/fr/cli)
- [Diagnostic du Gateway](/fr/gateway/doctor)
