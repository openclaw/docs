---
read_when:
    - Vous rencontrez des problèmes de connectivité ou d’authentification et souhaitez des solutions guidées
    - Vous avez effectué une mise à jour et souhaitez une vérification rapide.
summary: Référence de la CLI pour `openclaw doctor` (vérifications d’intégrité + réparations guidées)
title: Docteur
x-i18n:
    generated_at: "2026-07-16T13:06:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 322af63f52a3d864e46da332353ca921a4462e13fa849986d936524759f80ccc
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

Contrôles d’intégrité et corrections rapides pour le Gateway, les canaux, les plugins, les Skills, le routage des modèles, l’état local et les migrations de configuration. Utilisez cette commande lorsqu’un élément ne se comporte pas comme prévu et que vous souhaitez qu’une seule commande explique le problème.

Voir aussi :

- Dépannage : [Dépannage](/fr/gateway/troubleshooting)
- Audit de sécurité : [Sécurité](/fr/gateway/security)

## Modes

Doctor propose cinq modes :

| Mode                      | Commande                                  | Comportement                                                                                       |
| ------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Inspection                | `openclaw doctor`                        | Contrôles destinés aux utilisateurs et invites guidées.                                           |
| Réparation                | `openclaw doctor --fix`                        | Applique les réparations prises en charge, avec des invites sauf si la réparation non interactive est sûre. |
| Lint                      | `openclaw doctor --lint`                        | Résultats structurés en lecture seule pour la CI, les vérifications préalables et les contrôles de revue. |
| Maintenance SQLite partagée | `openclaw doctor --state-sqlite compact`                      | Crée explicitement un point de contrôle, compacte et vérifie la base de données canonique de l’état partagé. |
| Migration SQLite des sessions | `openclaw doctor --session-sqlite <mode>`                   | Inspecte, importe, valide, compacte, récupère ou restaure l’état des sessions.                     |

Privilégiez `--lint` lorsqu’une automatisation nécessite un résultat stable. Privilégiez `--fix` lorsqu’un opérateur humain souhaite que Doctor modifie la configuration ou l’état.

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

Pour les autorisations propres à un canal, utilisez les sondes de canal plutôt que `doctor` :

```bash
openclaw channels capabilities --channel discord --target channel:<channel-id>
openclaw channels status --probe
```

`channels capabilities` indique les autorisations effectives du bot pour une cible de canal précise. `channels status --probe` audite tous les canaux configurés et toutes les cibles de connexion automatique aux canaux vocaux.

## Options

| Option                          | Effet                                                                                                                                                                                   |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--no-workspace-suggestions`              | Désactive les suggestions de mémoire et de recherche de l’espace de travail.                                                                                                            |
| `--yes`              | Accepte les valeurs par défaut sans afficher d’invite.                                                                                                                                  |
| `--repair` / `--fix` | Applique les réparations recommandées ne concernant pas les services sans afficher d’invite (`--fix` est un alias). Les installations et réécritures du service Gateway nécessitent toujours une confirmation interactive ou des commandes `gateway` explicites. |
| `--force`              | Applique les réparations agressives, notamment le remplacement de la configuration personnalisée des services.                                                                          |
| `--non-interactive`              | S’exécute sans invite ; uniquement les migrations sûres et les réparations ne concernant pas les services.                                                                              |
| `--generate-gateway-token`              | Génère et configure un jeton de Gateway.                                                                                                                                                |
| `--allow-exec`              | Autorise Doctor à exécuter les SecretRefs `exec` configurées lors de la vérification des secrets.                                                                           |
| `--deep`              | Analyse les services système à la recherche d’installations supplémentaires du Gateway ; signale les récents transferts de redémarrage du superviseur du Gateway.                       |
| `--lint`              | Exécute les contrôles d’intégrité modernisés en lecture seule et émet des résultats de diagnostic.                                                                                      |
| `--post-upgrade`              | Exécute les sondes de compatibilité des plugins après une mise à niveau ; les résultats sont écrits sur la sortie standard ; code de sortie 1 si un résultat de niveau erreur est présent. |
| `--state-sqlite <mode>`              | Exécute explicitement la maintenance SQLite de l’état partagé. Le seul mode est `compact`.                                                                                     |
| `--session-sqlite <mode>`              | Exécute le mode ciblé de migration SQLite des sessions : `inspect`, `dry-run`, `import`, `validate`, `compact`, `recover` ou `restore`. |
| `--session-sqlite-store <path>`              | Avec `--session-sqlite` : sélectionne le chemin d’un stockage `sessions.json` hérité.                                                                                                |
| `--session-sqlite-agent <id>`              | Avec `--session-sqlite` : sélectionne un agent configuré.                                                                                                                               |
| `--session-sqlite-all-agents`              | Avec `--session-sqlite` : sélectionne les stockages d’agents configurés et détectés.                                                                                                    |
| `--github-issue`              | Avec `--session-sqlite recover` : prépare un rapport de problème openclaw/openclaw assaini ; Doctor le crée avec `gh` après `--yes` ou une confirmation interactive. |
| `--json`              | Avec `--lint` : résultats JSON. Avec `--post-upgrade` : `{ probesRun, findings }`. Avec `--state-sqlite` ou `--session-sqlite` : rapport de maintenance au format JSON.       |
| `--severity-min <level>`              | Avec `--lint` : masque les résultats inférieurs à `info`, `warning` ou `error`.                                                              |
| `--all`              | Avec `--lint` : exécute tous les contrôles enregistrés, y compris les contrôles facultatifs exclus de l’ensemble par défaut.                                                   |
| `--skip <id>`              | Avec `--lint` : ignore un identifiant de contrôle. Répétable.                                                                                                                  |
| `--only <id>`              | Avec `--lint` : exécute uniquement les identifiants de contrôle indiqués. Répétable.                                                                                           |

`--severity-min`, `--all`, `--only` et `--skip` ne sont acceptés qu’avec `--lint` ; `--json` est accepté avec `--lint`, `--post-upgrade`, `--state-sqlite` et `--session-sqlite`.

## Mode lint

`openclaw doctor --lint` est en lecture seule : aucune invite, aucune réparation et aucune réécriture de la configuration ou de l’état.

```bash
openclaw doctor --lint
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --json
openclaw doctor --lint --all
openclaw doctor --lint --allow-exec
openclaw doctor --lint --only core/doctor/gateway-config --json
openclaw doctor --lint --only core/doctor/local-audio-acceleration --severity-min info
```

La sortie destinée aux utilisateurs est compacte :

```text
doctor --lint: 6 contrôle(s) exécuté(s), 1 résultat(s)
  [warning] core/doctor/gateway-config gateway.mode - gateway.mode n’est pas défini ; le démarrage du Gateway sera bloqué.
    correction : Exécutez `openclaw configure` et définissez le mode du Gateway (local/distant), ou exécutez `openclaw config set gateway.mode local`.
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
      "fixHint": "Exécutez `openclaw configure` et définissez le mode du Gateway (local/distant), ou exécutez `openclaw config set gateway.mode local`."
    }
  ]
}
```

Codes de sortie :

| Code | Signification                                                                 |
| ---- | ----------------------------------------------------------------------------- |
| `0` | Aucun résultat égal ou supérieur au seuil de gravité sélectionné.             |
| `1` | Au moins un résultat atteint le seuil sélectionné.                            |
| `2` | Échec de la commande ou de l’exécution avant la production des résultats du lint. |

`--severity-min` détermine à la fois les résultats affichés et le seuil de sortie : `openclaw doctor --lint --severity-min error` peut ne rien afficher et renvoyer `0` même si des résultats `info`/`warning` de gravité inférieure existent.

`--all` détermine les contrôles sélectionnés avant le filtrage par gravité. L’exécution du lint par défaut exclut les contrôles approfondis, historiques ou plus susceptibles de révéler des résidus hérités réparables ; utilisez `--all` pour obtenir l’inventaire complet. `--only <id>` est le sélecteur le plus précis et peut exécuter n’importe quel contrôle enregistré à partir de son identifiant.

`core/doctor/local-audio-acceleration` indique la commande STT locale sélectionnée automatiquement, les preuves distinctes des backends disponibles, demandés et observés, ainsi que l’ordre de repli, sans charger de modèle vocal. Il émet un résultat informatif ; incluez donc `--severity-min info` pour l’afficher.

## Contrôles d’intégrité structurés

Les contrôles modernes de Doctor utilisent un contrat simple en deux parties :

```ts
detect(ctx, scope?) -> HealthFinding[]
repair?(ctx, findings) -> HealthRepairResult
```

`detect()` alimente `doctor --lint`. `repair()` est facultatif et ne s’exécute que sous `doctor --fix` / `doctor --repair`. Les contrôles qui n’ont pas encore migré vers cette structure utilisent toujours l’ancien flux de contribution de Doctor.

Les contextes de réparation peuvent contenir des demandes `dryRun`/`diff` ; les résultats de réparation peuvent renvoyer des `diffs` structurées (modifications de configuration ou de fichiers) et des `effects` structurés (effets secondaires liés aux services, aux processus, aux paquets, à l’état ou autres), afin que les contrôles convertis puissent évoluer vers `doctor --fix --dry-run` sans déplacer la planification des mutations dans `detect()`.

`repair()` signale `status: "repaired" | "skipped" | "failed"` (l’absence de statut signifie `repaired`). Lorsque la réparation renvoie `skipped` ou `failed`, doctor signale la raison et ignore la validation pour cette vérification. Après une réparation réussie, doctor réexécute `detect()` en se limitant aux constats réparés ; si le constat est toujours présent, doctor signale un avertissement de réparation au lieu de considérer la modification comme terminée.

Un constat comprend :

| Champ             | Objectif                                                |
| ----------------- | ------------------------------------------------------ |
| `checkId`         | Identifiant stable pour les filtres d’exclusion/de sélection exclusive et les listes d’autorisation de CI.     |
| `severity`        | `info`, `warning` ou `error`.                         |
| `message`         | Description du problème lisible par un humain.                      |
| `path`            | Chemin de configuration, de fichier ou logique, lorsqu’il est disponible.          |
| `line` / `column` | Emplacement source, lorsqu’il est disponible.                        |
| `ocPath`          | Adresse `oc://` précise lorsqu’une vérification peut en indiquer une. |
| `fixHint`         | Action suggérée à l’opérateur ou résumé de la réparation.           |

Les vérifications doctor modernisées du cœur restent rattachées à la contribution doctor ordonnée qui possède leur comportement humain `doctor` / `doctor --fix`. Le registre partagé de santé structurée constitue le point d’extension : les vérifications intégrées et celles adossées à des plugins s’exécutent après les vérifications doctor du cœur une fois que leur package propriétaire les a enregistrées dans le chemin de commande actif. `openclaw/plugin-sdk/health` expose le même contrat aux auteurs de plugins.

## Sélection des vérifications

```bash
openclaw doctor --lint --only core/doctor/gateway-config --json
openclaw doctor --lint --skip core/doctor/skills-readiness
openclaw doctor --lint --all --skip core/doctor/session-locks
```

`--only` et `--skip` acceptent des identifiants de vérification complets et peuvent être répétés. Si un identifiant `--only` n’est pas enregistré, aucune vérification ne s’exécute pour cet identifiant ; utilisez `checksRun`/`checksSkipped` dans la sortie pour confirmer qu’une porte ciblée sélectionne les vérifications attendues.

## Mode post-mise à niveau

`openclaw doctor --post-upgrade` exécute des sondes de compatibilité des plugins destinées à être enchaînées après une compilation ou une mise à niveau. Les constats sont envoyés vers la sortie standard ; le code de sortie vaut 1 si un constat possède `level: "error"`. Ajoutez `--json` pour obtenir une enveloppe lisible par machine (`{ probesRun, findings }`), adaptée à la CI, à la skill communautaire `fork-upgrade` et à d’autres outils de test rapide post-mise à niveau. Si l’index des plugins installés est absent ou mal formé, le mode JSON émet tout de même l’enveloppe avec un constat d’erreur `plugin.index_unavailable`.

Le démarrage d’une image de conteneur constitue l’exception au déroulement habituel « exécuter doctor après
la mise à jour ». Lorsque `openclaw gateway run` démarre avec une nouvelle version d’OpenClaw, il
exécute des réparations sûres de l’état et des plugins avant de signaler qu’il est prêt. Si la réparation ne peut pas
se terminer en toute sécurité, le démarrage s’interrompt et vous indique d’exécuter une fois la même image avec
`openclaw doctor --fix` sur le même état et la même configuration montés avant de redémarrer
normalement le conteneur.

## Compaction SQLite de l’état partagé

`openclaw doctor --state-sqlite compact` est une opération de maintenance hors ligne explicite pour
la base de données canonique d’état partagé située à
`<state-dir>/state/openclaw.sqlite`. Elle n’accepte pas de chemin de base de données
arbitraire, n’est jamais invoquée par le fonctionnement normal du Gateway et ne fait pas partie de
`openclaw doctor --fix`. La commande acquiert le même verrou de propriété de l’état que
le démarrage du Gateway et le conserve pendant la validation, la création de points de contrôle, `VACUUM` et
les contrôles d’intégrité finaux. Elle refuse de s’exécuter lorsqu’un Gateway ou une autre
commande de maintenance SQLite détient ce verrou. Le verrou d’état reste actif lorsque
`OPENCLAW_ALLOW_MULTI_GATEWAY=1` ignore l’instance unique du Gateway propre à la configuration, de sorte qu’un
shell d’opérateur n’a pas besoin d’hériter de l’environnement du service Gateway pour
que la maintenance le détecte.

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
2. Valide la version de schéma actuellement prise en charge et
   `schema_meta.role = "global"` avant de créer un point de contrôle ou de modifier le fichier.
3. Exige un `wal_checkpoint(TRUNCATE)` non occupé. Arrêtez tout processus OpenClaw
   restant et réessayez si le point de contrôle est occupé.
4. Définit `auto_vacuum` sur `INCREMENTAL`, exécute un `VACUUM` complet, puis crée
   de nouveau un point de contrôle.
5. Exécute `quick_check`, `integrity_check` et `foreign_key_check`, puis
   réapplique les autorisations réservées au propriétaire à la base de données et aux fichiers annexes SQLite.

La sortie JSON indique les tailles de la base de données et du WAL, les pages de la liste libre, la taille des pages et
la valeur `auto_vacuum` avant et après la compaction, ainsi que les octets récupérés et les
résultats `quick_check` et `integrity_check`. `foreign_key_check` est appliqué
en mode fermé en cas d’échec et ne possède aucun champ de réussite distinct. SQLite indique `auto_vacuum` sous la forme
`0` pour aucun, `1` pour complet et `2` pour incrémentiel.

La compaction échoue sans modification lorsque le schéma est ancien, plus récent que la
version d’OpenClaw en cours d’exécution ou appartient à une base de données d’agent. Exécutez d’abord
`openclaw doctor --fix` pour un schéma d’état partagé plus ancien. Restaurez une
sauvegarde compatible ou mettez à niveau OpenClaw pour un schéma plus récent.

## Migration SQLite des sessions

OpenClaw importe automatiquement les anciennes lignes de session et l’historique des transcriptions dans la base de données
SQLite de chaque agent lors du démarrage du Gateway et pendant
`openclaw doctor --fix`. `openclaw doctor --session-sqlite <mode>` est l’outil
ciblé d’inspection et de validation de cette migration. Les lignes de session actuelles de l’environnement d’exécution
résident dans
`~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`. Les anciens
fichiers `sessions.json` sont des sources de migration. Les fichiers JSONL de transcription actifs sont
importés et archivés hors du répertoire des sessions actives après une
importation réussie ; les fichiers JSONL du niveau d’archivage restent des artefacts d’assistance, et non des
solutions de repli pour l’environnement d’exécution.

Modes :

| Mode       | Comportement                                                                                                               |
| ---------- | ---------------------------------------------------------------------------------------------------------------------- |
| `inspect`  | Lit le nombre d’éléments anciens et SQLite, ainsi que les fichiers JSONL non référencés, sans effectuer d’importation.                                       |
| `dry-run`  | Analyse les entrées anciennes et les fichiers JSONL de transcription, compte les lignes importables et signale les problèmes sans écrire de lignes SQLite. |
| `import`   | Importe les entrées anciennes et les événements de transcription dans SQLite pour les cibles sélectionnées.                                      |
| `validate` | Compare les sources anciennes sélectionnées aux lignes SQLite et au nombre d’événements de transcription.                                   |
| `compact`  | Crée un point de contrôle et exécute VACUUM sur les bases de données SQLite des agents sélectionnés afin de récupérer les pages libres après des suppressions importantes ou un nettoyage des archives.    |
| `recover`  | Restaure la dernière exécution de migration ayant échoué, valide ses cibles et prépare un rapport de problème GitHub expurgé.            |
| `restore`  | Restaure les artefacts de transcription archivés à partir des manifestes de migration enregistrés sans supprimer les données SQLite.                  |

Sélecteurs :

- Par défaut : le stockage configuré de l’agent par défaut, lorsque ce fichier de stockage ancien existe.
- `--session-sqlite-agent <id>` : un agent configuré.
- `--session-sqlite-all-agents` : les stockages d’agents configurés ainsi que les stockages d’agents découverts.
- `--session-sqlite-store <path>` : un chemin explicite vers un ancien `sessions.json`.

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
un historique important. `validate` se termine avec un code différent de zéro lorsqu’une entrée ancienne sélectionnée est
absente de SQLite, qu’un identifiant de session diffère ou que le nombre d’événements de transcription diffère.
Lorsque vous utilisez `--session-sqlite-store <path>`, vérifiez que le rapport contient le
nombre de cibles attendu ; un chemin explicite vers un stockage inexistant ne sélectionne aucune cible.

Les suppressions SQLite récupèrent d’abord des pages à l’intérieur de la base de données ; elles ne réduisent pas nécessairement
immédiatement la taille du fichier de base de données. Après avoir supprimé ou archivé des
transcriptions volumineuses, exécutez `openclaw doctor --session-sqlite compact --session-sqlite-all-agents`
pour créer des points de contrôle des fichiers WAL, exécuter `VACUUM` et indiquer les tailles de la base de données et du WAL
avant et après. La compaction exige un fichier ordinaire utilisant le schéma d’agent actuel, les
métadonnées persistantes du propriétaire de l’agent sélectionné et aucune ressource ouverte dans le processus
doctor. Les modes destructifs `import`, `compact`, `recover` et `restore`
conservent le même verrou de propriété de l’état que le démarrage du Gateway pendant toute leur opération ;
`inspect`, `dry-run` et `validate` restent en lecture seule et ne l’acquièrent pas. Arrêtez
d’abord le Gateway. Les modes destructifs échouent au lieu d’entrer en concurrence avec des écritures actives ou
avec une autre commande de maintenance. Une cible destructive `--session-sqlite-store`
doit se trouver dans le répertoire d’état actif ; définissez `OPENCLAW_STATE_DIR` sur
le répertoire d’état propriétaire du stockage avant d’effectuer la maintenance d’une autre installation.
Les cibles existantes liées par un lien physique sont rejetées, car un autre chemin peut partager le
même inode de base de données hors du répertoire d’état verrouillé. Les mêmes contrôles de propriété
couvrent les fichiers annexes SQLite WAL, de mémoire partagée et de journal d’annulation.

Chaque importation écrit un manifeste sous
`~/.openclaw/session-sqlite-migration-runs/` avant de déplacer les artefacts de transcription
dans l’archive. Si le démarrage signale l’échec d’une migration SQLite de session après
le déplacement des artefacts, exécutez la récupération :

```bash
openclaw doctor --session-sqlite recover --github-issue
```

La récupération sélectionne le dernier manifeste de migration ayant échoué, restaure uniquement les
artefacts archivés du manifeste, valide les cibles concernées, actualise les
rapports expurgés `.failure.md` et `.failure.json`, et prépare un corps de problème GitHub
qui exclut le contenu des transcriptions, l’environnement brut, les secrets et les
configurations sans limites. Lorsqu’aucun manifeste de migration ayant échoué n’existe, mais qu’une base de données SQLite
d’un agent sélectionné est corrompue, n’est pas une base de données ou possède des fichiers annexes de journal sans
base de données principale, la récupération copie l’ensemble complet des fichiers dans un répertoire temporaire
d’inspection. SQLite peut annuler un journal actif valide dans cette copie jetable
avant l’exécution de `quick_check`, `integrity_check` et `foreign_key_check`, tandis que les
fichiers judiciaires d’origine restent intacts. Les contrôles d’intégrité ayant échoué ou les fichiers annexes
orphelins préservent les fichiers DB, WAL, SHM et de journal d’annulation en renommant
tout l’ensemble découvert avec un seul suffixe `.corrupt-<timestamp>`. En cas d’échec de renommage intercepté,
les fichiers déjà déplacés sont remis à leur emplacement avant le signalement de l’échec, afin qu’un
ensemble de fichiers récupérable ne soit pas silencieusement scindé. Arrêtez le Gateway avant la récupération ;
la copie ou le renommage d’un ensemble de fichiers SQLite en cours de modification est dangereux et se comporte
différemment selon les systèmes d’exploitation. Avec `--github-issue --yes`, doctor utilise
la CLI GitHub pour créer le problème dans `openclaw/openclaw` ; sans confirmation,
il écrit le rapport d’assistance local et affiche une URL de problème préremplie.

`restore` reste l’opération d’annulation de plus bas niveau. Elle utilise les enregistrements
`sourcePath -> archivePath` du manifeste, replace les artefacts archivés uniquement lorsque le
chemin d’origine est absent, signale les conflits lorsque les deux chemins existent et laisse
la base de données SQLite en place.

### Rétrogradation après la migration SQLite des sessions

Avant de démarrer une ancienne version d’OpenClaw utilisant des fichiers, restaurez les
anciens artefacts de transcription archivés :

```bash
openclaw doctor --session-sqlite restore --session-sqlite-all-agents
```

Les anciennes versions lisent les entrées `sessions.json` et les chemins `sessionFile` enregistrés
dans ces entrées. Après la migration SQLite, les importations réussies déplacent les transcriptions JSONL
actives dans `session-sqlite-import-archive/`. L’ancien environnement d’exécution ne peut donc pas
consulter cet historique tant que la restauration n’a pas replacé les artefacts consignés dans le manifeste
à leurs emplacements d’origine.

La restauration ne supprime pas les données SQLite. Les sessions créées après le basculement vers SQLite
existent uniquement dans SQLite et n’apparaîtront pas dans l’ancien environnement d’exécution. Si vous
effectuez ultérieurement une nouvelle mise à niveau, exécutez la séquence normale de validation de la migration ci-dessus afin qu’OpenClaw puisse
comparer les artefacts hérités restaurés aux lignes SQLite avant l’importation.

## Remarques

- En mode Nix (`OPENCLAW_NIX_MODE=1`), les vérifications en lecture seule de doctor fonctionnent toujours, mais `doctor --fix`, `doctor --repair`, `doctor --yes` et `doctor --generate-gateway-token` sont désactivés, car `openclaw.json` est immuable. Modifiez plutôt la source Nix de cette installation ; pour nix-openclaw, consultez le [Démarrage rapide](https://github.com/openclaw/nix-openclaw#quick-start) centré sur l’agent.
- Les invites interactives (corrections du trousseau/OAuth, etc.) ne s’exécutent que lorsque stdin est un TTY et que `--non-interactive` n’est **pas** défini. Les exécutions sans interface (Cron, Telegram, sans terminal) ignorent les invites.
- Les exécutions non interactives de `doctor` ignorent le chargement anticipé des plugins afin que les contrôles d’intégrité sans interface restent rapides. Les sessions interactives chargent toujours les surfaces de plugins requises par le flux hérité de contrôle d’intégrité et de réparation.
- `--lint` est plus strict que `--non-interactive` : toujours en lecture seule, sans aucune invite et sans jamais appliquer les migrations sûres. Utilisez `doctor --fix` ou `doctor --repair` pour autoriser doctor à apporter des modifications.
- Par défaut, doctor n’exécute pas les SecretRefs `exec` lors de la vérification des secrets. Utilisez `--allow-exec` (avec ou sans `--lint`) uniquement lorsque vous souhaitez intentionnellement que doctor exécute ces résolveurs de secrets configurés.
- Toute écriture de configuration (y compris une réparation `--fix`) fait tourner une sauvegarde vers `~/.openclaw/openclaw.json.bak` (avec un anneau numéroté de `.bak.1` à `.bak.4`). `--fix` supprime également les clés de configuration inconnues signalées par la validation du schéma et répertorie chaque suppression ; cette opération est ignorée lorsqu’une mise à jour est en cours, afin que l’état de mise à niveau partiellement écrit ne soit pas supprimé avant la fin de sa migration.
- Définissez `OPENCLAW_SERVICE_REPAIR_POLICY=external` lorsqu’un autre superviseur gère le cycle de vie du Gateway. Doctor continue de signaler l’état du Gateway et du service et applique les réparations sans rapport avec le service, mais ignore l’installation, le démarrage, le redémarrage et l’amorçage du service ainsi que le nettoyage des anciens services.
- Sous Linux, doctor ignore les unités systemd supplémentaires inactives semblables à un Gateway et ne réécrit pas les métadonnées de commande ou de point d’entrée d’un service Gateway systemd en cours d’exécution pendant la réparation. Arrêtez d’abord le service ou utilisez `openclaw gateway install --force` pour remplacer le lanceur actif.
- `doctor --fix --non-interactive` signale les définitions de service Gateway manquantes ou obsolètes, mais ne les installe ni ne les réécrit en dehors du mode de réparation de mise à jour. Exécutez `openclaw gateway install` pour un service manquant ou `openclaw gateway install --force` pour remplacer le lanceur.
- Les contrôles d’intégrité de l’état détectent les fichiers de transcription orphelins dans le répertoire des sessions. Leur archivage sous `.deleted.<timestamp>` nécessite une confirmation interactive ; `--fix`, `--yes` et les exécutions sans interface les laissent en place.
- Doctor analyse `~/.openclaw/cron/jobs.json` (ou `cron.store`) pour rechercher les anciennes structures de tâches Cron et les réécrit avant d’importer les lignes canoniques dans SQLite.
- Doctor signale les tâches Cron comportant une substitution explicite `payload.model`, notamment le nombre d’espaces de noms de fournisseurs et les divergences par rapport à `agents.defaults.model`, afin que les tâches planifiées qui n’héritent pas du modèle par défaut soient visibles lors des investigations relatives à l’authentification ou à la facturation.
- Doctor signale les tâches Cron toujours marquées comme étant en cours d’exécution (`state.runningAtMs`), ce qui peut conduire `openclaw cron list` à les afficher comme `running`. Ce contrôle est en lecture seule : si aucun Gateway n’exécute actuellement une tâche marquée, le prochain démarrage du service Cron enregistre l’exécution interrompue et efface le marqueur.
- Sous Linux, doctor émet un avertissement lorsque la crontab de l’utilisateur exécute encore l’ancien `~/.openclaw/bin/ensure-whatsapp.sh` non maintenu, qui peut signaler incorrectement `Gateway inactive` lorsque Cron ne dispose pas de l’environnement du bus utilisateur systemd.
- Lorsque WhatsApp est activé, doctor recherche une boucle d’événements dégradée du Gateway alors que des clients `openclaw-tui` locaux sont toujours en cours d’exécution. `doctor --fix` arrête uniquement les clients TUI locaux vérifiés, afin que les réponses WhatsApp ne restent pas en attente derrière des boucles obsolètes d’actualisation de la TUI.
- Doctor réécrit les anciennes références de modèles `codex/*` et `openai-codex/*` en références `openai/*` canoniques dans les modèles principaux, les modèles de secours, les listes d’autorisation de modèles, les modèles de génération d’images et de vidéos, les substitutions de Heartbeat, de sous-agent et de Compaction, les hooks, les substitutions de modèles de canaux, les charges utiles Cron et les épingles obsolètes de routage de sessions ou de transcriptions. `--fix` fusionne également, lorsque cela ne présente aucun risque, les anciennes configurations `models.providers.codex` et `models.providers.openai-codex`, migre les anciens profils d’authentification `openai-codex:*` et les entrées `auth.order.openai-codex` vers `openai:*`, déplace l’intention Codex vers des entrées `agentRuntime.id: "codex"` limitées au fournisseur et au modèle, supprime les épingles d’environnement d’exécution obsolètes portant sur l’ensemble d’un agent ou d’une session et conserve le routage d’authentification Codex des références d’agents OpenAI réparées au lieu d’utiliser directement l’authentification par clé d’API OpenAI.
- Doctor signale les listes `auth.order.<provider>` non vides dont tous les profils référencés ont disparu alors que des identifiants compatibles sont enregistrés. `doctor --fix` supprime uniquement ces substitutions obsolètes et rétablit la sélection automatique des identifiants par agent ; les ordres explicitement vides, les listes partiellement valides et les ordres ne disposant d’aucun identifiant compatible enregistré restent inchangés. Si un magasin d’authentification SQLite actif est illisible ou mal formé, doctor explique pourquoi cette réparation a été ignorée. Redémarrez un Gateway en cours d’exécution avant de revérifier l’état de l’authentification si son mode de rechargement de la configuration n’applique pas automatiquement l’écriture.
- Doctor nettoie l’ancien état de préparation des dépendances de plugins issu des versions antérieures d’OpenClaw et recrée le lien vers le paquet hôte `openclaw` pour les plugins npm gérés qui le déclarent comme dépendance homologue. Il répare également les plugins téléchargeables manquants référencés par la configuration (`plugins.entries`, canaux configurés, paramètres de fournisseur ou de recherche configurés, environnements d’exécution d’agents configurés). Pendant les mises à jour de paquets, doctor ignore la réparation des plugins par le gestionnaire de paquets jusqu’à la fin du remplacement du paquet ; réexécutez ensuite `openclaw doctor --fix` si un plugin configuré doit encore être restauré. Si un téléchargement échoue, doctor signale l’erreur d’installation et conserve l’entrée du plugin configuré en vue de la prochaine tentative de réparation.
- Doctor répare la configuration obsolète des plugins en supprimant les identifiants de plugins manquants de `plugins.allow`/`plugins.deny`/`plugins.entries`, ainsi que les configurations de canaux, les cibles de Heartbeat et les substitutions de modèles de canaux correspondantes devenues orphelines, lorsque la découverte des plugins fonctionne correctement.
- Doctor met en quarantaine la configuration de plugin non valide en désactivant l’entrée `plugins.entries.<id>` concernée et en supprimant sa charge utile `config` non valide. Le démarrage du Gateway ignore déjà uniquement ce plugin défectueux, de sorte que les autres plugins et canaux continuent de fonctionner.
- Doctor supprime l’ancien `plugins.entries.codex.config.codexDynamicToolsProfile` retiré ; le serveur d’application Codex conserve toujours les outils d’espace de travail natifs de Codex dans leur état natif.
- Doctor migre automatiquement l’ancienne configuration Talk plate (`talk.voiceId`, `talk.modelId` et autres) vers `talk.provider` + `talk.providers.<provider>`. Les exécutions répétées de `doctor --fix` ne signalent et n’appliquent plus la normalisation Talk lorsque la seule différence concerne l’ordre des clés d’objet.
- Doctor inclut un contrôle de préparation de la recherche en mémoire et peut recommander `openclaw configure --section model` lorsque les identifiants d’intégration sont manquants.
- Doctor émet un avertissement lorsqu’aucun propriétaire de commandes n’est configuré. Le propriétaire de commandes est le compte de l’opérateur humain autorisé à exécuter les commandes réservées au propriétaire et à approuver les actions dangereuses. L’association par message privé permet uniquement à une personne de communiquer avec le bot ; si vous avez approuvé un expéditeur avant la mise en place de l’amorçage du premier propriétaire, définissez explicitement `commands.ownerAllowFrom`.
- Doctor affiche une note d’information lorsque des agents en mode Codex sont configurés et que des ressources personnelles de la CLI Codex existent dans le répertoire personnel Codex de l’opérateur. Les lancements locaux du serveur d’application Codex utilisent des répertoires personnels isolés pour chaque agent ; installez d’abord le plugin Codex si nécessaire, puis utilisez `openclaw migrate plan codex` pour inventorier les ressources qui doivent être promues délibérément.
- Doctor émet un avertissement lorsque des Skills autorisées pour l’agent par défaut ne sont pas disponibles dans l’environnement d’exécution actuel (binaires, variables d’environnement ou configuration manquants, ou exigences du système d’exploitation non satisfaites). `doctor --fix` peut désactiver ces Skills indisponibles avec `skills.entries.<skill>.enabled=false` ; installez ou configurez plutôt le prérequis manquant si vous souhaitez conserver la Skill active.
- Si le mode bac à sable est activé, mais que Docker n’est pas disponible, doctor affiche un avertissement très explicite accompagné de mesures correctives (`install Docker` ou `openclaw config set agents.defaults.sandbox.mode off`).
- Si d’anciens fichiers de registre ou répertoires de fragments du bac à sable sont présents (`~/.openclaw/sandbox/containers.json`, `~/.openclaw/sandbox/browsers.json`, `~/.openclaw/sandbox/containers/` ou `~/.openclaw/sandbox/browsers/`), doctor les signale ; `--fix` migre les entrées valides vers SQLite et met en quarantaine les anciens fichiers non valides.
- Si `gateway.auth.token`/`gateway.auth.password` sont gérés par SecretRef et indisponibles dans le chemin de commande actuel, doctor affiche un avertissement en lecture seule et n’écrit aucun identifiant de secours en texte clair. Pour les SecretRefs reposant sur exec, doctor ignore leur exécution, sauf si `--allow-exec` est présent.
- Si l’inspection d’une SecretRef de canal échoue dans un chemin de correction, doctor poursuit son exécution et affiche un avertissement au lieu de quitter prématurément.
- Après les migrations du répertoire d’état, doctor émet un avertissement lorsque les comptes Telegram ou Discord par défaut activés dépendent d’un mécanisme de secours par variables d’environnement et que `TELEGRAM_BOT_TOKEN` ou `DISCORD_BOT_TOKEN` n’est pas disponible pour le processus doctor.
- La résolution automatique des noms d’utilisateur `allowFrom` de Telegram (`doctor --fix`) nécessite un jeton Telegram résolvable dans le chemin de commande actuel. Si l’inspection du jeton n’est pas disponible, doctor affiche un avertissement et ignore la résolution automatique pour cette exécution.

## macOS : substitutions d’environnement `launchctl`

Si vous avez précédemment exécuté `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (ou `...PASSWORD`), cette valeur remplace votre fichier de configuration et peut provoquer des erreurs persistantes « unauthorized ».

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## Pages connexes

- [Référence de la CLI](/fr/cli)
- [Doctor du Gateway](/fr/gateway/doctor)
