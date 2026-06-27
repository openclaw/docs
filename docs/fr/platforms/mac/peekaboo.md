---
read_when:
    - Héberger PeekabooBridge dans OpenClaw.app
    - Intégration de Peekaboo via Swift Package Manager
    - Modification du protocole/des chemins PeekabooBridge
    - Choisir entre PeekabooBridge, Codex Computer Use et cua-driver MCP
summary: Intégration de PeekabooBridge pour l’automatisation de l’interface utilisateur macOS
title: Passerelle Peekaboo
x-i18n:
    generated_at: "2026-06-27T17:43:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2343f90e500664b302236a6dabadfe64a24cedd13e57b4e234e70d4fad640c21
    source_path: platforms/mac/peekaboo.md
    workflow: 16
---

OpenClaw peut héberger **PeekabooBridge** comme courtier local d’automatisation de l’interface utilisateur, sensible aux autorisations. Cela permet à la CLI `peekaboo` de piloter l’automatisation de l’interface utilisateur tout en réutilisant les autorisations TCC de l’application macOS.

## Ce que c’est (et ce que ce n’est pas)

- **Hôte** : OpenClaw.app peut agir comme hôte PeekabooBridge.
- **Client** : utilisez la CLI `peekaboo` (pas de surface `openclaw ui ...` séparée).
- **Interface utilisateur** : les superpositions visuelles restent dans Peekaboo.app ; OpenClaw est un hôte courtier léger.

## Relation avec Computer Use

OpenClaw dispose de trois voies de contrôle du bureau, et elles restent volontairement séparées :

- **Hôte PeekabooBridge** : OpenClaw.app peut héberger le socket PeekabooBridge local.
  La CLI `peekaboo` reste le client et utilise les autorisations macOS d’OpenClaw.app pour les primitives d’automatisation Peekaboo, telles que les captures d’écran, les clics, les menus, les boîtes de dialogue, les actions Dock et la gestion des fenêtres.
- **Codex Computer Use** : le plugin `codex` intégré prépare le serveur d’application Codex, vérifie que le serveur MCP `computer-use` de Codex est disponible, puis laisse Codex gérer les appels d’outils natifs de contrôle du bureau pendant les tours en mode Codex. OpenClaw ne relaie pas ces actions via PeekabooBridge.
- **MCP `cua-driver` direct** : OpenClaw peut enregistrer le serveur `cua-driver mcp` amont de TryCua comme serveur MCP normal. Cela fournit aux agents les propres schémas du pilote CUA et son flux de travail pid/fenêtre/index d’élément, sans routage via la marketplace Codex ni le socket PeekabooBridge.

Utilisez Peekaboo lorsque vous souhaitez disposer de la large surface d’automatisation macOS et de l’hôte de pont sensible aux autorisations d’OpenClaw.app. Utilisez Codex Computer Use lorsqu’un agent en mode Codex doit s’appuyer sur le plugin natif computer-use de Codex. Utilisez directement `cua-driver mcp` lorsque vous souhaitez exposer le pilote CUA à tout runtime géré par OpenClaw comme serveur MCP normal.

## Activer le pont

Dans l’application macOS :

- Réglages → **Activer Peekaboo Bridge**

Lorsque cette option est activée, OpenClaw démarre un serveur de socket UNIX local. Si elle est désactivée, l’hôte est arrêté et `peekaboo` se rabattra sur les autres hôtes disponibles.

## Ordre de découverte du client

Les clients Peekaboo essaient généralement les hôtes dans cet ordre :

1. Peekaboo.app (expérience utilisateur complète)
2. Claude.app (si installée)
3. OpenClaw.app (courtier léger)

Utilisez `peekaboo bridge status --verbose` pour voir quel hôte est actif et quel chemin de socket est utilisé. Vous pouvez le remplacer avec :

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## Sécurité et autorisations

- Le pont valide les **signatures de code des appelants** ; une liste d’autorisation de TeamID est appliquée (TeamID de l’hôte Peekaboo + TeamID de l’application OpenClaw).
- Préférez l’identité de pont/application signée à un runtime `node` générique pour l’accessibilité.
  Accorder l’accessibilité à `node` permet à tout package lancé par cet exécutable Node d’hériter de l’accès à l’automatisation de l’interface graphique ; voir
  [autorisations macOS](/fr/platforms/mac/permissions#accessibility-grants-for-node-and-cli-runtimes).
- Les requêtes expirent après environ 10 secondes.
- Si les autorisations requises sont manquantes, le pont renvoie un message d’erreur clair au lieu de lancer Réglages Système.

## Comportement des instantanés (automatisation)

Les instantanés sont stockés en mémoire et expirent automatiquement après une courte fenêtre.
Si vous avez besoin d’une conservation plus longue, capturez-les à nouveau depuis le client.

## Dépannage

- Si `peekaboo` signale « bridge client is not authorized », assurez-vous que le client est correctement signé ou exécutez l’hôte avec `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` en mode **débogage** uniquement.
- Si aucun hôte n’est trouvé, ouvrez l’une des applications hôtes (Peekaboo.app ou OpenClaw.app) et confirmez que les autorisations sont accordées.

## Connexe

- [application macOS](/fr/platforms/macos)
- [autorisations macOS](/fr/platforms/mac/permissions)
