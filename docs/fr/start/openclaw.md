---
read_when:
    - Intégration d’une nouvelle instance d’assistant
    - Examen des implications en matière de sécurité et d’autorisations
summary: Guide de bout en bout pour exécuter OpenClaw en tant qu’assistant personnel, avec des mises en garde de sécurité
title: Configuration de l’assistant personnel
x-i18n:
    generated_at: "2026-04-30T07:49:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: b0614272f9a2b30e0900c55b39a8bd6a2b71b9f5d5fbf0fe00c534b91193e6a0
    source_path: start/openclaw.md
    workflow: 16
---

# Créer un assistant personnel avec OpenClaw

OpenClaw est une Gateway auto-hébergée qui connecte Discord, Google Chat, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo, et d’autres services à des agents d’IA. Ce guide couvre la configuration « assistant personnel » : un numéro WhatsApp dédié qui se comporte comme votre assistant IA toujours disponible.

## ⚠️ La sécurité d’abord

Vous placez un agent en position de :

- exécuter des commandes sur votre machine (selon votre politique d’outils)
- lire/écrire des fichiers dans votre espace de travail
- renvoyer des messages via WhatsApp/Telegram/Discord/Mattermost et d’autres canaux intégrés

Commencez prudemment :

- Définissez toujours `channels.whatsapp.allowFrom` (n’exécutez jamais un accès ouvert à tous sur votre Mac personnel).
- Utilisez un numéro WhatsApp dédié pour l’assistant.
- Les Heartbeats s’exécutent désormais par défaut toutes les 30 minutes. Désactivez-les jusqu’à ce que vous fassiez confiance à la configuration en définissant `agents.defaults.heartbeat.every: "0m"`.

## Prérequis

- OpenClaw installé et initialisé — consultez [Bien démarrer](/fr/start/getting-started) si vous ne l’avez pas encore fait
- Un second numéro de téléphone (SIM/eSIM/prépayé) pour l’assistant

## La configuration à deux téléphones (recommandée)

Vous voulez ceci :

```mermaid
flowchart TB
    A["<b>Your Phone (personal)<br></b><br>Your WhatsApp<br>+1-555-YOU"] -- message --> B["<b>Second Phone (assistant)<br></b><br>Assistant WA<br>+1-555-ASSIST"]
    B -- linked via QR --> C["<b>Your Mac (openclaw)<br></b><br>AI agent"]
```

Si vous associez votre WhatsApp personnel à OpenClaw, chaque message qui vous est envoyé devient une « entrée agent ». C’est rarement ce que vous voulez.

## Démarrage rapide en 5 minutes

1. Associez WhatsApp Web (affiche un QR code ; scannez-le avec le téléphone de l’assistant) :

```bash
openclaw channels login
```

2. Démarrez la Gateway (laissez-la en cours d’exécution) :

```bash
openclaw gateway --port 18789
```

3. Placez une configuration minimale dans `~/.openclaw/openclaw.json` :

```json5
{
  gateway: { mode: "local" },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

Envoyez maintenant un message au numéro de l’assistant depuis votre téléphone autorisé.

Lorsque l’initialisation se termine, OpenClaw ouvre automatiquement le tableau de bord et affiche un lien propre (sans jeton). Si le tableau de bord demande une authentification, collez le secret partagé configuré dans les paramètres de l’interface de contrôle. L’initialisation utilise un jeton par défaut (`gateway.auth.token`), mais l’authentification par mot de passe fonctionne aussi si vous avez basculé `gateway.auth.mode` sur `password`. Pour rouvrir plus tard : `openclaw dashboard`.

## Donner un espace de travail à l’agent (AGENTS)

OpenClaw lit les instructions d’exécution et la « mémoire » depuis son répertoire d’espace de travail.

Par défaut, OpenClaw utilise `~/.openclaw/workspace` comme espace de travail de l’agent, et le crée (ainsi que les fichiers de départ `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`) automatiquement lors de la configuration ou de la première exécution de l’agent. `BOOTSTRAP.md` n’est créé que lorsque l’espace de travail est tout neuf (il ne doit pas réapparaître après sa suppression). `MEMORY.md` est facultatif (non créé automatiquement) ; lorsqu’il est présent, il est chargé pour les sessions normales. Les sessions de sous-agent n’injectent que `AGENTS.md` et `TOOLS.md`.

<Tip>
Traitez ce dossier comme la mémoire d’OpenClaw et faites-en un dépôt git (idéalement privé) afin que vos fichiers `AGENTS.md` et de mémoire soient sauvegardés. Si git est installé, les espaces de travail tout neufs sont initialisés automatiquement.
</Tip>

```bash
openclaw setup
```

Disposition complète de l’espace de travail + guide de sauvegarde : [Espace de travail de l’agent](/fr/concepts/agent-workspace)
Flux de travail de mémoire : [Mémoire](/fr/concepts/memory)

Facultatif : choisissez un autre espace de travail avec `agents.defaults.workspace` (prend en charge `~`).

```json5
{
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
    },
  },
}
```

Si vous fournissez déjà vos propres fichiers d’espace de travail depuis un dépôt, vous pouvez désactiver entièrement la création des fichiers d’amorçage :

```json5
{
  agents: {
    defaults: {
      skipBootstrap: true,
    },
  },
}
```

## La configuration qui en fait « un assistant »

OpenClaw utilise par défaut une bonne configuration d’assistant, mais vous voudrez généralement ajuster :

- la personnalité/les instructions dans [`SOUL.md`](/fr/concepts/soul)
- les valeurs par défaut de réflexion (si souhaité)
- les Heartbeats (une fois que vous lui faites confiance)

Exemple :

```json5
{
  logging: { level: "info" },
  agent: {
    model: "anthropic/claude-opus-4-6",
    workspace: "~/.openclaw/workspace",
    thinkingDefault: "high",
    timeoutSeconds: 1800,
    // Start with 0; enable later.
    heartbeat: { every: "0m" },
  },
  channels: {
    whatsapp: {
      allowFrom: ["+15555550123"],
      groups: {
        "*": { requireMention: true },
      },
    },
  },
  routing: {
    groupChat: {
      mentionPatterns: ["@openclaw", "openclaw"],
    },
  },
  session: {
    scope: "per-sender",
    resetTriggers: ["/new", "/reset"],
    reset: {
      mode: "daily",
      atHour: 4,
      idleMinutes: 10080,
    },
  },
}
```

## Sessions et mémoire

- Fichiers de session : `~/.openclaw/agents/<agentId>/sessions/{{SessionId}}.jsonl`
- Métadonnées de session (utilisation des jetons, dernière route, etc.) : `~/.openclaw/agents/<agentId>/sessions/sessions.json` (hérité : `~/.openclaw/sessions/sessions.json`)
- `/new` ou `/reset` démarre une nouvelle session pour cette discussion (configurable via `resetTriggers`). S’il est envoyé seul, OpenClaw confirme la réinitialisation sans invoquer le modèle.
- `/compact [instructions]` compacte le contexte de session et indique le budget de contexte restant.

## Heartbeats (mode proactif)

Par défaut, OpenClaw exécute un Heartbeat toutes les 30 minutes avec l’invite :
`Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
Définissez `agents.defaults.heartbeat.every: "0m"` pour le désactiver.

- Si `HEARTBEAT.md` existe mais est effectivement vide (uniquement des lignes vides et des en-têtes Markdown comme `# Heading`), OpenClaw ignore l’exécution du Heartbeat pour économiser les appels API.
- Si le fichier est absent, le Heartbeat s’exécute quand même et le modèle décide quoi faire.
- Si l’agent répond avec `HEARTBEAT_OK` (éventuellement avec un court ajout ; consultez `agents.defaults.heartbeat.ackMaxChars`), OpenClaw supprime la livraison sortante pour ce Heartbeat.
- Par défaut, la livraison des Heartbeats vers les cibles de type message direct `user:<id>` est autorisée. Définissez `agents.defaults.heartbeat.directPolicy: "block"` pour supprimer la livraison vers les cibles directes tout en gardant les exécutions de Heartbeat actives.
- Les Heartbeats exécutent des tours complets d’agent — des intervalles plus courts consomment davantage de jetons.

```json5
{
  agent: {
    heartbeat: { every: "30m" },
  },
}
```

## Médias entrants et sortants

Les pièces jointes entrantes (images/audio/documents) peuvent être exposées à votre commande via des modèles :

- `{{MediaPath}}` (chemin du fichier temporaire local)
- `{{MediaUrl}}` (pseudo-URL)
- `{{Transcript}}` (si la transcription audio est activée)

Pièces jointes sortantes de l’agent : incluez `MEDIA:<path-or-url>` sur sa propre ligne (sans espaces). Exemple :

```
Here’s the screenshot.
MEDIA:https://example.com/screenshot.png
```

OpenClaw les extrait et les envoie comme médias avec le texte.

Le comportement des chemins locaux suit le même modèle de confiance de lecture de fichiers que l’agent :

- Si `tools.fs.workspaceOnly` vaut `true`, les chemins locaux `MEDIA:` sortants restent limités à la racine temporaire d’OpenClaw, au cache média, aux chemins de l’espace de travail de l’agent et aux fichiers générés par le bac à sable.
- Si `tools.fs.workspaceOnly` vaut `false`, les chemins locaux `MEDIA:` sortants peuvent utiliser des fichiers locaux de l’hôte que l’agent est déjà autorisé à lire.
- Les envois locaux depuis l’hôte n’autorisent toujours que les médias et les types de documents sûrs (images, audio, vidéo, PDF et documents Office). Les fichiers en texte brut et ceux qui ressemblent à des secrets ne sont pas traités comme des médias envoyables.

Cela signifie que les images/fichiers générés en dehors de l’espace de travail peuvent maintenant être envoyés lorsque votre politique fs autorise déjà ces lectures, sans rouvrir l’exfiltration arbitraire de pièces jointes texte de l’hôte.

## Liste de vérification opérationnelle

```bash
openclaw status          # local status (creds, sessions, queued events)
openclaw status --all    # full diagnosis (read-only, pasteable)
openclaw status --deep   # asks the gateway for a live health probe with channel probes when supported
openclaw health --json   # gateway health snapshot (WS; default can return a fresh cached snapshot)
```

Les journaux se trouvent sous `/tmp/openclaw/` (par défaut : `openclaw-YYYY-MM-DD.log`).

## Étapes suivantes

- WebChat : [WebChat](/fr/web/webchat)
- Opérations de Gateway : [Runbook de Gateway](/fr/gateway)
- Cron + réveils : [Tâches Cron](/fr/automation/cron-jobs)
- Compagnon de barre de menus macOS : [Application macOS OpenClaw](/fr/platforms/macos)
- Application de nœud iOS : [Application iOS](/fr/platforms/ios)
- Application de nœud Android : [Application Android](/fr/platforms/android)
- État Windows : [Windows (WSL2)](/fr/platforms/windows)
- État Linux : [Application Linux](/fr/platforms/linux)
- Sécurité : [Sécurité](/fr/gateway/security)

## Associés

- [Bien démarrer](/fr/start/getting-started)
- [Configuration](/fr/start/setup)
- [Vue d’ensemble des canaux](/fr/channels)
