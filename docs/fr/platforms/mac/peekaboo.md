---
read_when:
    - Hébergement de PeekabooBridge dans OpenClaw.app
    - Intégration de Peekaboo via Swift Package Manager
    - Modification du protocole/des chemins de PeekabooBridge
    - Choisir entre PeekabooBridge, Codex Computer Use et cua-driver MCP
summary: Intégration de PeekabooBridge pour l’automatisation de l’interface utilisateur macOS
title: Passerelle coucou
x-i18n:
    generated_at: "2026-04-30T07:36:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 92effdd6cfe4002fff2b8cd1092999f837e93694acf110eaebd30648b0a6946e
    source_path: platforms/mac/peekaboo.md
    workflow: 16
---

OpenClaw peut héberger **PeekabooBridge** comme courtier local d’automatisation d’interface utilisateur tenant compte des autorisations. Cela permet à la CLI `peekaboo` de piloter l’automatisation de l’interface utilisateur tout en réutilisant les autorisations TCC de l’application macOS.

## Ce que c’est (et ce que ce n’est pas)

- **Hôte** : OpenClaw.app peut agir comme hôte PeekabooBridge.
- **Client** : utilisez la CLI `peekaboo` (pas de surface `openclaw ui ...` distincte).
- **Interface utilisateur** : les superpositions visuelles restent dans Peekaboo.app ; OpenClaw est un hôte courtier léger.

## Relation avec Computer Use

OpenClaw dispose de trois chemins de contrôle du bureau, qui restent intentionnellement séparés :

- **Hôte PeekabooBridge** : OpenClaw.app peut héberger le socket PeekabooBridge local.
  La CLI `peekaboo` reste le client et utilise les autorisations macOS d’OpenClaw.app pour les primitives d’automatisation Peekaboo telles que les captures d’écran, les clics, les menus, les boîtes de dialogue, les actions du Dock et la gestion des fenêtres.
- **Codex Computer Use** : le plugin `codex` fourni prépare le serveur d’application Codex, vérifie que le serveur MCP `computer-use` de Codex est disponible, puis laisse Codex posséder les appels d’outils natifs de contrôle du bureau pendant les tours en mode Codex. OpenClaw ne relaie pas ces actions via PeekabooBridge.
- **MCP `cua-driver` direct** : OpenClaw peut enregistrer le serveur `cua-driver mcp` amont de TryCua comme serveur MCP normal. Cela donne aux agents les schémas propres au pilote CUA et le flux de travail pid/fenêtre/index d’élément, sans routage via la marketplace Codex ni le socket PeekabooBridge.

Utilisez Peekaboo lorsque vous voulez la large surface d’automatisation macOS et l’hôte de pont d’OpenClaw.app tenant compte des autorisations. Utilisez Codex Computer Use lorsqu’un agent en mode Codex doit s’appuyer sur le plugin natif de computer-use de Codex. Utilisez `cua-driver mcp` direct lorsque vous voulez exposer le pilote CUA à n’importe quel runtime géré par OpenClaw comme serveur MCP normal.

## Activer le pont

Dans l’application macOS :

- Réglages → **Activer Peekaboo Bridge**

Lorsqu’il est activé, OpenClaw démarre un serveur de socket UNIX local. S’il est désactivé, l’hôte est arrêté et `peekaboo` se rabattra sur les autres hôtes disponibles.

## Ordre de découverte des clients

Les clients Peekaboo essaient généralement les hôtes dans cet ordre :

1. Peekaboo.app (expérience utilisateur complète)
2. Claude.app (si installé)
3. OpenClaw.app (courtier léger)

Utilisez `peekaboo bridge status --verbose` pour voir quel hôte est actif et quel chemin de socket est utilisé. Vous pouvez le remplacer avec :

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## Sécurité et autorisations

- Le pont valide les **signatures de code des appelants** ; une liste d’autorisation de TeamIDs est appliquée (TeamID de l’hôte Peekaboo + TeamID de l’application OpenClaw).
- Les requêtes expirent après environ 10 secondes.
- Si des autorisations requises sont manquantes, le pont renvoie un message d’erreur clair au lieu de lancer Réglages Système.

## Comportement des instantanés (automatisation)

Les instantanés sont stockés en mémoire et expirent automatiquement après une courte fenêtre.
Si vous avez besoin d’une conservation plus longue, capturez à nouveau depuis le client.

## Dépannage

- Si `peekaboo` signale « le client du pont n’est pas autorisé », assurez-vous que le client est correctement signé ou exécutez l’hôte avec `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` en mode **debug** uniquement.
- Si aucun hôte n’est trouvé, ouvrez l’une des applications hôtes (Peekaboo.app ou OpenClaw.app) et confirmez que les autorisations sont accordées.

## Connexe

- [application macOS](/fr/platforms/macos)
- [autorisations macOS](/fr/platforms/mac/permissions)
