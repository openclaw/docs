---
read_when: You want agent sessions to run on ephemeral cloud machines instead of the Gateway host, or you are configuring cloudWorkers profiles.
sidebarTitle: Cloud Workers
status: active
summary: 'Répartir les sessions sur des machines cloud éphémères : provisionnement, environnement d’exécution des workers, inférence via proxy et diffusion en continu des résultats'
title: Workers cloud
x-i18n:
    generated_at: "2026-07-16T13:10:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c20b3b4f1408ed3ef0beb155a207f99476323cf67eba7b44931eec32c79e52be
    source_path: gateway/cloud-workers.md
    workflow: 16
---

Les workers cloud permettent à une session d’exécuter sa boucle d’agent sur une machine cloud éphémère, tandis que tout ce qui concerne la session reste à son emplacement habituel : visible dans la barre latérale, diffusé en direct, avec la transcription détenue par le Gateway. Le Gateway réserve une machine, y installe une copie épinglée d’OpenClaw, y synchronise l’espace de travail de la session et confie la boucle de tours à un processus `openclaw worker` restreint. Les appels au modèle sont relayés par le Gateway, de sorte que les identifiants du fournisseur ne quittent jamais votre machine, et la mise en cache des prompts continue de fonctionner, car le fournisseur voit un flux continu unique.

Lorsque le travail est terminé (ou que la machine tombe en panne), celle-ci est supprimée. L’état durable — transcription, commits de l’espace de travail, enregistrements de placement — réside auprès du Gateway.

<Note>
Les workers cloud sont facultatifs et invisibles tant que vous n’avez pas configuré de profil. Les installations non configurées ne présentent aucun nouveau RPC, paramètre de configuration ni élément d’interface.
</Note>

## Répartition de l’exécution

| Élément                                                 | Emplacement                                                                         |
| ------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Boucle d’agent + outils (`exec`, `read`, `write`, `edit`, …) | Machine du worker cloud                                                                 |
| Inférence du modèle et identifiants du fournisseur                | Gateway (relayés par la référence `{provider, model}`)                               |
| Transcription (durable, stockage de session)                     | Gateway                                                                          |
| Diffusion en direct dans la barre latérale                         | Distribution par le Gateway, alimentée par le flux d’événements rejouable du worker                      |
| Historique Git de l’espace de travail                                   | Créé sur la machine sans identifiants ; le Gateway adopte les commits et prend en charge le push/la PR |

La machine ne nécessite aucun port entrant, à l’exception de `sshd` : le Gateway établit une connexion sortante par SSH épinglé, et un tunnel inverse ramène le WebSocket du worker. Le fournisseur Crabbox intégré impose la route SSH publique et désactive l’inscription Tailscale gérée. L’accès Internet sortant dépend de la politique du fournisseur ; le profil AWS par défaut peut accéder à Internet, sauf si vous restreignez son réseau ou son groupe de sécurité.

## Prérequis

- Un Plugin de fournisseur de workers. Le Plugin `crabbox` intégré pilote la CLI [Crabbox](https://github.com/openclaw/crabbox), qui gère les réservations auprès de plusieurs backends cloud (AWS, Hetzner et autres). Le binaire `crabbox` doit se trouver dans `PATH` (ou définissez `settings.binary`), avec les identifiants du fournisseur déjà configurés. L’admission AWS nécessite Crabbox 0.38.1 ou une version ultérieure.
- Pour les workers Crabbox AWS, la valeur effective de `aws.instanceProfile` doit être vide. Le fournisseur vérifie `crabbox config show --json` avant l’allocation, puis exige que `crabbox inspect --json` indique `providerMetadata.instanceProfileAttached: false` à partir de la valeur EC2 `DescribeInstances`. Les réservations dotées d’un rôle d’instance ou dépourvues de métadonnées faisant autorité sont arrêtées et rejetées.
- Node.js sur la machine réservée. Les images cloud minimales en sont généralement dépourvues — installez-le dans la commande `setup` du profil.
- Une session disposant d’un worktree géré appartenant à la session (créez-en un avec `worktree: true`). La répartition déplace le contenu de ce worktree ; les répertoires ordinaires sont synchronisés sous forme de miroir de manifeste.

## Configuration

Ajoutez un profil sous `cloudWorkers.profiles` dans `openclaw.json` :

```json
{
  "cloudWorkers": {
    "profiles": {
      "aws": {
        "provider": "crabbox",
        "install": "bundle",
        "settings": {
          "provider": "aws",
          "class": "standard",
          "ttl": "8h",
          "idleTimeout": "45m",
          "setup": "test -x /usr/bin/node || (curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt-get install -y nodejs)"
        }
      }
    }
  }
}
```

Champs du profil :

| Clé        | Signification                                                                                                                                                                                                                                        |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider` | Identifiant du fournisseur de workers enregistré par un Plugin (`crabbox` pour le Plugin intégré).                                                                                                                                                                  |
| `install`  | `bundle` (par défaut) fournit la version du Gateway en cours d’exécution ; `npm` installe la version publiée exacte du Gateway avec une intégrité épinglée. `npm` exige que le Gateway s’exécute à partir d’une version publiée empaquetée.                                                      |
| `settings` | JSON appartenant au fournisseur. Pour Crabbox : `provider` (backend), `class` (classe de machine), `ttl`, `idleTimeout` (durées Go), ainsi que les valeurs facultatives `setup` et le chemin absolu `binary`. OpenClaw impose le SSH public et désactive Tailscale géré pour ces réservations. |
| `lifetime` | Politique stockée facultative (`idleTimeoutMinutes`, `maxLifetimeMinutes`).                                                                                                                                                                           |

### La commande de configuration

`settings.setup` s’exécute sur la machine réservée une fois qu’elle est prête pour SSH et avant l’installation d’OpenClaw. Elle s’exécute à **chaque** tentative de provisionnement (y compris lors des reprises après une répartition interrompue) ; elle doit donc être idempotente — protégez les installations par une vérification `command -v`/`test -x`, comme dans l’exemple. Si la configuration échoue, le fournisseur arrête la réservation et la répartition échoue de manière sûre ; aucune machine partiellement configurée ne reste en fonctionnement.

### Canaux d’installation

- **`bundle`** empaquette le `dist` du Gateway en cours d’exécution, un `package.json` élagué et tous les paquets de l’espace de travail référencés par la build, le tout couvert par une empreinte de contenu. La machine vérifie le bundle intact à l’aide de cette empreinte, puis installe les dépendances npm de production (scripts désactivés). Cela permet d’exécuter une build de développement sur un worker.
- **`npm`** vérifie que la version existe dans le registre public, épingle son intégrité SHA-512 et installe `openclaw@<version>` correspondant exactement au Gateway.

## Répartition d’une session

Dans l’interface de contrôle, ouvrez **New Session**, choisissez un agent dont le runtime configuré est OpenClaw, sélectionnez une cible **Cloud · profile** configurée dans le menu **Where**, puis démarrez la tâche. La sélection du cloud active automatiquement le worktree géré requis ; le Gateway crée la session, termine la répartition, puis envoie le premier tour. Le badge du serveur dans la barre latérale de la session indique l’état durable du placement. Les cibles cloud ne sont pas proposées pour les catalogues de sessions CLI externes.

Le flux RPC équivalent est le suivant :

Créez une session avec un worktree géré, puis répartissez-la (le RPC nécessite `operator.admin` et n’existe que lorsque des profils sont configurés) :

Les workers cloud exécutent le runtime d’agent OpenClaw. Choisissez un `openai/*` ou un autre modèle qui se résout vers ce runtime ; les sessions configurées pour un runtime CLI externe tel que `claude-cli` ne peuvent pas être réparties.

```bash
openclaw gateway call sessions.create \
  --params '{"key":"agent:main:big-refactor","worktree":true,"cwd":"/path/to/repo","worktreeName":"big-refactor"}'

openclaw gateway call sessions.dispatch \
  --timeout 1500000 \
  --params '{"key":"agent:main:big-refactor","profileId":"aws"}'
```

`sessions.dispatch` ferme l’admission des tours locaux, attend la fin du travail actif, provisionne la réservation, exécute la configuration, initialise OpenClaw, synchronise l’espace de travail et se termine lorsque le placement atteint la propriété du worker `active`. Prévoyez plusieurs minutes pour la première répartition ; les réservations et les installations sont mises en cache lorsque le fournisseur le permet. Ensuite, interagissez avec la session comme d’habitude — les tours sont automatiquement acheminés vers le worker.

Les tours terminés du worker réconcilient les fichiers admissibles de l’espace de travail, dans les limites de taille, avec le worktree géré de la session avant la libération de la revendication du tour. L’événement terminal du worker crée une barrière durable de résultat en attente avant d’être acquitté, de sorte que la récupération après redémarrage du Gateway rapatrie l’espace de travail distant avant que le nettoyage des tours obsolètes puisse détruire son propriétaire. La réconciliation authentifie le manifeste du worker et s’arrête en cas de divergence locale au lieu d’écraser l’un ou l’autre côté. Avant de modifier les fichiers, le Gateway enregistre un journal de restauration limité dans sa base de données d’état SQLite ; une nouvelle tentative récupère ce journal après l’interruption d’un processus Gateway. Les résultats de l’espace de travail suivent la sémantique des fichiers Git : les fichiers ordinaires, les bits d’exécution, les liens symboliques, les ajouts, les modifications et les suppressions sont conservés, contrairement aux répertoires vides et aux autres modes de répertoire. Les objets de commit distants ne sont pas conservés ; les modifications de fichiers qui en résultent restent dans le worktree géré pour la révision et le commit habituels.

Lorsque le travail est terminé et qu’aucun tour n’est en cours, ouvrez le menu de la session et choisissez **Stop cloud worker…**. Le Gateway effectue une dernière réconciliation de l’espace de travail avant de détruire l’environnement. Un placement déjà dans l’état `draining` ou `reconciling` termine sa suppression ; attendez que son badge passe à `reclaimed` avant de supprimer la session.

Pour un worker attaché défectueux ou incontrôlable, un opérateur peut appeler `environments.destroy` avec `{ "force": true }` en dernier recours. La suppression forcée marque durablement le placement comme ayant échoué et abandonne tout résultat distant non réconcilié avant de détruire l’environnement.

Le RPC administratif équivalent est le suivant :

```bash
openclaw gateway call sessions.reclaim \
  --timeout 600000 \
  --params '{"key":"agent:main:big-refactor"}'
```

Le placement progresse dans une machine à états durable (`local → requested → provisioning → syncing → starting → active`), de sorte qu’un redémarrage du Gateway au milieu d’une répartition déclenche une réconciliation au lieu de laisser des machines orphelines. L’échec d’un tour de modèle maintient le placement actif disponible pour une nouvelle tentative. Si la réconciliation entrante de l’espace de travail échoue, le worker reste également actif afin que l’opérateur puisse résoudre le conflit local et réessayer sans perdre le résultat distant ; les échecs du cycle de vie font en revanche passer le placement à un état d’erreur ou de récupération et conservent la fin de leurs diagnostics.

## Modèle de sécurité

- **Accès entrant fermé pour les workers.** Les workers communiquent au moyen d’un protocole dédié sur le socket tunnelisé, avec une liste fermée de méthodes autorisées — un worker ne peut pas appeler les RPC d’opérateur.
- **Identifiants générés, hachés au repos.** Chaque répartition génère un identifiant de worker ; le Gateway n’en stocke que l’empreinte. La rotation des identifiants et le cloisonnement par époque du propriétaire garantissent qu’il n’existe au maximum qu’un seul propriétaire actif par session — un worker obsolète qui se reconnecte est isolé, jamais fusionné.
- **Épinglage de la clé d’hôte.** Le fournisseur doit exposer la clé d’hôte SSH de la machine lors du provisionnement ; l’initialisation se connecte avec un épinglage strict et échoue de manière sûre en son absence.
- **Aucun identifiant permanent de modèle, de forge ou de cloud sur la machine.** L’authentification du modèle reste sur le Gateway (l’inférence transite par la référence `{provider, model}`), les commits Git de l’espace de travail sont créés sans identifiants de forge, et les métadonnées de réservation Crabbox AWS sont vérifiées de manière faisant autorité afin de détecter un rôle d’instance avant la configuration. Veillez également à ce que les commandes de configuration ne contiennent aucun identifiant.
- **Trafic sortant géré par le fournisseur.** Le tunnel inverse supprime tout besoin pour OpenClaw d’accéder directement au modèle, mais OpenClaw ne modifie pas les pare-feu du fournisseur. Restreignez le trafic sortant auprès du fournisseur de workers lorsque la tâche l’exige.
- **Transcriptions durables, traitées exactement une fois.** Le worker valide les lots de transcription au moyen d’un protocole de comparaison et d’échange appliqué à la feuille de la session ; une base obsolète interrompt immédiatement l’exécution au lieu de dupliquer ou de rebaser une sortie payante.

## Résolution des problèmes

- **`sessions.dispatch` est une méthode inconnue** — aucun `cloudWorkers.profiles` n’est configuré, ou l’appelant ne dispose pas de `operator.admin`.
- **« Les tours des workers cloud nécessitent le runtime OpenClaw »** — choisissez un modèle dont le runtime configuré est OpenClaw. Les runtimes CLI externes tels que `claude-cli` ne prennent pas en charge l’inférence des workers.
- **« L’amorçage du worker nécessite Node.js sur l’hôte loué »** — ajoutez une installation de Node à `settings.setup` (voir ci-dessus).
- **L’attestation du rôle d’instance AWS échoue** — effacez `aws.instanceProfile` (ainsi que `CRABBOX_AWS_INSTANCE_PROFILE`, s’il est défini). Installez Crabbox 0.38.1 ou une version ultérieure ; les anciens binaires n’exposent pas le contrat `providerMetadata.instanceProfileAttached` faisant autorité, requis pour l’admission AWS.
- **La répartition échoue avec une erreur du fournisseur** — l’enregistrement de placement et `environments.list` conservent la dernière erreur, y compris la fin de stderr de la configuration ou de l’amorçage. Les machines sont détruites en cas d’échec ; cette fin de journal constitue donc la principale source d’analyse forensique.
- **Expiration du délai côté client lors de la répartition** — `openclaw gateway call` utilise par défaut un délai de 10s ; définissez généreusement `--timeout` (la répartition continue côté serveur dans tous les cas, et une nouvelle tentative pendant le provisionnement est rejetée avec `session cannot dispatch from placement provisioning`).
- **Gestion des baux** — `crabbox list --provider <backend>` affiche les baux actifs ; `crabbox stop --provider <backend> --id <lease>` en libère un manuellement. Les baux inactifs expirent selon la valeur `idleTimeout` du profil.

## Pages connexes

- [Isolation en bac à sable](/fr/gateway/sandboxing) — réduction du rayon d’impact lors de l’exécution locale d’outils
- [CLI des sessions](/fr/cli/sessions) — inspection des sessions stockées
- [Référence de configuration](/fr/gateway/configuration-reference)
