---
read_when:
    - Hébergement de PeekabooBridge dans OpenClaw.app
    - Intégration de Peekaboo via Swift Package Manager
    - Modification du protocole/des chemins de PeekabooBridge
    - Choisir entre PeekabooBridge, Codex Computer Use et cua-driver MCP
summary: Intégration de PeekabooBridge pour l’automatisation de l’interface utilisateur macOS
title: Pont Peekaboo
x-i18n:
    generated_at: "2026-07-16T13:30:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 24d4187b2f5c5f11f44a24e25b350adaa3b068f24dce640ec695d52eb61f8e9a
    source_path: platforms/mac/peekaboo.md
    workflow: 16
---

OpenClaw peut héberger **PeekabooBridge** en tant que courtier local d’automatisation de l’interface utilisateur tenant compte des autorisations (`PeekabooBridgeHostCoordinator`, reposant sur le paquet Swift `steipete/Peekaboo`). Cela permet à la CLI `peekaboo` de piloter l’automatisation de l’interface utilisateur tout en réutilisant les autorisations TCC de l’application macOS.

## Ce que c’est (et ce que ce n’est pas)

- **Hôte** : OpenClaw.app peut servir d’hôte PeekabooBridge.
- **Client** : la CLI `peekaboo` (il n’existe pas d’interface `openclaw ui ...` distincte).
- **Interface utilisateur** : les superpositions visuelles restent dans Peekaboo.app ; OpenClaw sert d’hôte courtier léger.

## Relation avec les autres modes de contrôle du bureau

OpenClaw propose quatre modes de contrôle du bureau qui restent intentionnellement distincts :

- **Hôte PeekabooBridge** : OpenClaw.app héberge le socket PeekabooBridge local. La CLI `peekaboo` est le client et utilise les autorisations macOS d’OpenClaw.app pour les captures d’écran, les clics, les menus, les boîtes de dialogue, les actions du Dock et la gestion des fenêtres.
- **Utilisation de l’ordinateur pilotée par l’agent (`computer.act`)** : l’outil `computer` intégré à l’agent du Gateway effectue des captures d’écran via `screen.snapshot` et pilote le pointeur et le clavier au moyen de la commande Node dangereuse `computer.act`. Un Node macOS exécute `computer.act` dans le processus à l’aide des services d’automatisation Peekaboo intégrés exposés par ce pont, ainsi que de primitives CoreGraphics restreintes, sans passer par le socket PeekabooBridge ni par la CLI `peekaboo`. Consultez [Utilisation de l’ordinateur](/fr/nodes/computer-use).
- **Codex Computer Use** : le Plugin `codex` intégré vérifie le Plugin MCP `computer-use` de Codex et peut l’installer (`extensions/codex/src/app-server/computer-use.ts`), puis permet à Codex de gérer les appels d’outils natifs de contrôle du bureau pendant les interactions en mode Codex. OpenClaw ne transmet pas ces actions par l’intermédiaire de PeekabooBridge.
- **MCP `cua-driver` direct** : OpenClaw peut enregistrer le serveur `cua-driver mcp` en amont de TryCua comme serveur MCP standard, ce qui fournit aux agents les schémas propres au pilote CUA et son flux de travail fondé sur les PID, les fenêtres et les index d’éléments, sans passer par la place de marché Codex ni par le socket PeekabooBridge.

Utilisez Peekaboo pour bénéficier de l’ensemble étendu des fonctions d’automatisation macOS par l’intermédiaire de l’hôte de pont d’OpenClaw.app tenant compte des autorisations. Utilisez le contrôle de l’ordinateur piloté par l’agent lorsque l’agent du Gateway doit voir et contrôler le bureau au moyen d’une commande Node `computer.act` uniforme que tout modèle de vision peut piloter. Utilisez Codex Computer Use lorsqu’un agent en mode Codex doit s’appuyer sur le Plugin natif de Codex. Utilisez directement `cua-driver mcp` pour exposer le pilote CUA à tout environnement d’exécution géré par OpenClaw en tant que serveur MCP standard.

## Activer le pont

Dans l’application macOS : **Settings -> Enable Peekaboo Bridge**. L’option nécessite que **Allow Computer Control** soit activé, puisque les deux accordent l’automatisation locale de l’interface utilisateur ; lorsque Computer Control est désactivé, l’option est indisponible et l’hôte ne s’exécute pas. Pour piloter Peekaboo sans Computer Control, exécutez plutôt la propre application Mac de Peekaboo en tant qu’hôte.

Lorsqu’il est activé (et que Computer Control l’est également), OpenClaw démarre un serveur de socket UNIX local à l’emplacement `~/Library/Application Support/OpenClaw/<socket-name>`. S’il est désactivé, l’hôte s’arrête et `peekaboo` se rabat sur les autres hôtes disponibles. Le coordinateur maintient également des liens symboliques de sockets hérités (`clawdbot`, `clawdis`, `moltbot` sous Application Support) pointant vers le socket actuel pour les anciennes installations de `peekaboo`.

## Ordre de détection des clients

Les clients Peekaboo essaient généralement les hôtes dans l’ordre suivant :

1. Peekaboo.app (expérience utilisateur complète)
2. Claude.app (si installé)
3. OpenClaw.app (courtier léger)

Utilisez `peekaboo bridge status --verbose` pour savoir quel hôte est actif et quel chemin de socket est utilisé. Pour le remplacer :

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## Sécurité et autorisations

- Le pont valide les **signatures de code des appelants** ; une liste d’autorisation de TeamIDs est appliquée (le TeamID de l’hôte Peekaboo ainsi que celui de l’application en cours d’exécution).
- Pour l’accessibilité, privilégiez l’identité signée du pont ou de l’application plutôt qu’un environnement d’exécution `node` générique. Accorder l’accessibilité à `node` permet à tout paquet lancé par cet exécutable Node d’hériter de l’accès à l’automatisation de l’interface graphique ; consultez [Autorisations macOS](/fr/platforms/mac/permissions#accessibility-grants-for-node-and-cli-runtimes).
- Les requêtes expirent après 10 secondes (`requestTimeoutSec: 10`).
- Si les autorisations requises sont absentes, le pont renvoie un message d’erreur explicite au lieu d’ouvrir System Settings.

## Comportement des instantanés (automatisation)

Les instantanés sont conservés en mémoire avec une durée de validité de 10 minutes et une limite de 50 instantanés (`InMemorySnapshotManager`) ; les artefacts ne sont pas supprimés lors du nettoyage. Si une conservation plus longue est nécessaire, effectuez une nouvelle capture depuis le client.

## Dépannage

- Si `peekaboo` signale « bridge client is not authorized », vérifiez que le client est correctement signé ou exécutez l’hôte avec `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` en mode **debug** uniquement.
- Si aucun hôte n’est trouvé, ouvrez l’une des applications hôtes (Peekaboo.app ou OpenClaw.app) et vérifiez que les autorisations sont accordées.

## Voir aussi

- [Application macOS](/fr/platforms/macos)
- [Autorisations macOS](/fr/platforms/mac/permissions)
