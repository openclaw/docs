---
read_when:
    - Hébergement de PeekabooBridge dans OpenClaw.app
    - Intégration de Peekaboo via Swift Package Manager
    - Modification du protocole/des chemins de PeekabooBridge
    - Choisir entre PeekabooBridge, Codex Computer Use et cua-driver MCP
summary: Intégration de PeekabooBridge pour l’automatisation de l’interface utilisateur sur macOS
title: Passerelle coucou
x-i18n:
    generated_at: "2026-05-06T07:31:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 724bc6f29b991eb824df01d2b23e87b5d5cf32eb5ebaa0cbbc321dd8fca53c9e
    source_path: platforms/mac/peekaboo.md
    workflow: 16
---

OpenClaw peut héberger **PeekabooBridge** comme courtier local d’automatisation d’interface utilisateur tenant compte des autorisations. Cela permet à la CLI `peekaboo` de piloter l’automatisation de l’interface utilisateur tout en réutilisant les autorisations TCC de l’application macOS.

## Ce que c’est (et ce que ce n’est pas)

- **Hôte** : OpenClaw.app peut agir comme hôte PeekabooBridge.
- **Client** : utilisez la CLI `peekaboo` (pas de surface `openclaw ui ...` distincte).
- **Interface utilisateur** : les superpositions visuelles restent dans Peekaboo.app ; OpenClaw est un hôte courtier léger.

## Relation avec l’utilisation de l’ordinateur

OpenClaw dispose de trois chemins de contrôle du bureau, et ils restent volontairement séparés :

- **Hôte PeekabooBridge** : OpenClaw.app peut héberger le socket PeekabooBridge local.
  La CLI `peekaboo` reste le client et utilise les autorisations macOS d’OpenClaw.app pour les primitives d’automatisation Peekaboo telles que les captures d’écran, les clics, les menus, les boîtes de dialogue, les actions du Dock et la gestion des fenêtres.
- **Utilisation de l’ordinateur par Codex** : le Plugin `codex` intégré prépare le serveur d’application Codex, vérifie que le serveur MCP `computer-use` de Codex est disponible, puis laisse Codex prendre en charge les appels d’outils natifs de contrôle du bureau pendant les tours en mode Codex. OpenClaw ne relaie pas ces actions via PeekabooBridge.
- **MCP `cua-driver` direct** : OpenClaw peut enregistrer le serveur `cua-driver mcp` amont de TryCua comme serveur MCP normal. Cela donne aux agents les schémas propres au pilote CUA et le flux de travail pid/fenêtre/index-d’élément sans passer par la place de marché Codex ni par le socket PeekabooBridge.

Utilisez Peekaboo lorsque vous voulez la vaste surface d’automatisation macOS et l’hôte de pont tenant compte des autorisations d’OpenClaw.app. Utilisez l’utilisation de l’ordinateur par Codex lorsqu’un agent en mode Codex doit s’appuyer sur le Plugin natif `computer-use` de Codex. Utilisez directement `cua-driver mcp` lorsque vous voulez exposer le pilote CUA à n’importe quel environnement d’exécution géré par OpenClaw comme serveur MCP normal.

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

- Le pont valide les **signatures de code des appelants** ; une liste d’autorisation de TeamIDs est appliquée (TeamID de l’hôte Peekaboo + TeamID de l’application OpenClaw).
- Les requêtes expirent après environ 10 secondes.
- Si les autorisations requises sont absentes, le pont renvoie un message d’erreur clair au lieu de lancer Réglages Système.

## Comportement des instantanés (automatisation)

Les instantanés sont stockés en mémoire et expirent automatiquement après une courte période.
Si vous avez besoin d’une conservation plus longue, effectuez une nouvelle capture depuis le client.

## Dépannage

- Si `peekaboo` signale "bridge client is not authorized", assurez-vous que le client est correctement signé ou exécutez l’hôte avec `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` en mode **debug** uniquement.
- Si aucun hôte n’est trouvé, ouvrez l’une des applications hôtes (Peekaboo.app ou OpenClaw.app) et confirmez que les autorisations sont accordées.

## Associés

- [application macOS](/fr/platforms/macos)
- [autorisations macOS](/fr/platforms/mac/permissions)
