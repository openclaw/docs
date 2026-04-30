---
read_when:
    - Implémentation des fonctionnalités de l’application macOS
    - Modification du cycle de vie du Gateway ou du pontage de Node sur macOS
summary: Application compagnon OpenClaw pour macOS (barre des menus + courtier Gateway)
title: application macOS
x-i18n:
    generated_at: "2026-04-30T07:36:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2ed98cd4865f2117728d4349c9be99d9c2e20f4d86a77c80f5ba0b5520eb81cd
    source_path: platforms/macos.md
    workflow: 16
---

L’app macOS est le **compagnon de barre de menus** d’OpenClaw. Elle gère les autorisations,
administre/se connecte au Gateway localement (launchd ou manuel), et expose les
capacités macOS à l’agent en tant que nœud.

## Ce qu’elle fait

- Affiche des notifications natives et l’état dans la barre de menus.
- Gère les invites TCC (Notifications, Accessibilité, Enregistrement d’écran, Microphone,
  Reconnaissance vocale, Automation/AppleScript).
- Lance le Gateway ou s’y connecte (local ou distant).
- Expose des outils propres à macOS (Canvas, Caméra, Enregistrement d’écran, `system.run`).
- Démarre le service hôte de nœud local en mode **distant** (launchd), et l’arrête en mode **local**.
- Héberge éventuellement **PeekabooBridge** pour l’automatisation de l’interface utilisateur.
- Installe la CLI globale (`openclaw`) sur demande via npm, pnpm ou bun (l’app privilégie npm, puis pnpm, puis bun ; Node reste le runtime recommandé pour le Gateway).

## Mode local ou distant

- **Local** (par défaut) : l’app se connecte à un Gateway local en cours d’exécution s’il existe ;
  sinon, elle active le service launchd via `openclaw gateway install`.
- **Distant** : l’app se connecte à un Gateway via SSH/Tailscale et ne démarre jamais
  de processus local.
  L’app démarre le **service hôte de nœud** local pour que le Gateway distant puisse atteindre ce Mac.
  L’app ne lance pas le Gateway comme processus enfant.
  La découverte du Gateway privilégie désormais les noms Tailscale MagicDNS plutôt que les IP tailnet brutes,
  ce qui permet à l’app Mac de récupérer plus fiablement lorsque les IP tailnet changent.

## Contrôle launchd

L’app gère un LaunchAgent par utilisateur nommé `ai.openclaw.gateway`
(ou `ai.openclaw.<profile>` lors de l’utilisation de `--profile`/`OPENCLAW_PROFILE` ; l’ancien `com.openclaw.*` est toujours déchargé).

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

Remplacez le libellé par `ai.openclaw.<profile>` lors de l’exécution d’un profil nommé.

Si le LaunchAgent n’est pas installé, activez-le depuis l’app ou exécutez
`openclaw gateway install`.

## Capacités Node (Mac)

L’app macOS se présente comme un nœud. Commandes courantes :

- Canvas : `canvas.present`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot`, `canvas.a2ui.*`
- Caméra : `camera.snap`, `camera.clip`
- Écran : `screen.snapshot`, `screen.record`
- Système : `system.run`, `system.notify`

Le nœud signale une carte `permissions` afin que les agents puissent décider ce qui est autorisé.

Service Node + IPC de l’app :

- Lorsque le service hôte de nœud sans interface est en cours d’exécution (mode distant), il se connecte au WS du Gateway en tant que nœud.
- `system.run` s’exécute dans l’app macOS (contexte UI/TCC) via un socket Unix local ; les invites et la sortie restent dans l’app.

Diagramme (SCI) :

```
Gateway -> Node Service (WS)
                 |  IPC (UDS + token + HMAC + TTL)
                 v
             Mac App (UI + TCC + system.run)
```

## Approbations d’exécution (system.run)

`system.run` est contrôlé par les **approbations d’exécution** dans l’app macOS (Réglages → Approbations d’exécution).
La sécurité, les demandes et la liste d’autorisation sont stockées localement sur le Mac dans :

```
~/.openclaw/exec-approvals.json
```

Exemple :

```json
{
  "version": 1,
  "defaults": {
    "security": "deny",
    "ask": "on-miss"
  },
  "agents": {
    "main": {
      "security": "allowlist",
      "ask": "on-miss",
      "allowlist": [{ "pattern": "/opt/homebrew/bin/rg" }]
    }
  }
}
```

Notes :

- Les entrées `allowlist` sont des motifs glob pour les chemins binaires résolus, ou des noms de commandes simples pour les commandes appelées via PATH.
- Le texte brut d’une commande shell contenant une syntaxe de contrôle ou d’expansion du shell (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) est traité comme un échec de la liste d’autorisation et exige une approbation explicite (ou l’ajout du binaire du shell à la liste d’autorisation).
- Choisir « Toujours autoriser » dans l’invite ajoute cette commande à la liste d’autorisation.
- Les remplacements d’environnement de `system.run` sont filtrés (suppression de `PATH`, `DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`), puis fusionnés avec l’environnement de l’app.
- Pour les wrappers shell (`bash|sh|zsh ... -c/-lc`), les remplacements d’environnement limités à la requête sont réduits à une petite liste d’autorisation explicite (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Pour les décisions d’autorisation permanente en mode liste d’autorisation, les wrappers de dispatch connus (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) conservent les chemins des exécutables internes au lieu des chemins des wrappers. Si le déballage n’est pas sûr, aucune entrée de liste d’autorisation n’est conservée automatiquement.

## Liens profonds

L’app enregistre le schéma d’URL `openclaw://` pour les actions locales.

### `openclaw://agent`

Déclenche une requête `agent` auprès du Gateway.
__OC_I18N_900004__
Paramètres de requête :

- `message` (obligatoire)
- `sessionKey` (facultatif)
- `thinking` (facultatif)
- `deliver` / `to` / `channel` (facultatif)
- `timeoutSeconds` (facultatif)
- `key` (clé facultative pour le mode sans surveillance)

Sécurité :

- Sans `key`, l’app demande une confirmation.
- Sans `key`, l’app impose une courte limite de message pour l’invite de confirmation et ignore `deliver` / `to` / `channel`.
- Avec une `key` valide, l’exécution se fait sans surveillance (destinée aux automatisations personnelles).

## Parcours d’intégration (typique)

1. Installez et lancez **OpenClaw.app**.
2. Complétez la liste de contrôle des autorisations (invites TCC).
3. Assurez-vous que le mode **Local** est actif et que le Gateway est en cours d’exécution.
4. Installez la CLI si vous souhaitez un accès depuis le terminal.

## Emplacement du répertoire d’état (macOS)

Évitez de placer votre répertoire d’état OpenClaw dans iCloud ou d’autres dossiers synchronisés avec le cloud.
Les chemins appuyés par la synchronisation peuvent ajouter de la latence et provoquer occasionnellement des courses de verrouillage/synchronisation de fichiers pour
les sessions et les identifiants.

Préférez un chemin d’état local non synchronisé, par exemple :
__OC_I18N_900005__
Si `openclaw doctor` détecte un état sous :

- `~/Library/Mobile Documents/com~apple~CloudDocs/...`
- `~/Library/CloudStorage/...`

il affichera un avertissement et recommandera de revenir à un chemin local.

## Workflow de build et de développement (natif)

- `cd apps/macos && swift build`
- `swift run OpenClaw` (ou Xcode)
- Créer le package de l’app : `scripts/package-mac-app.sh`

## Déboguer la connectivité du Gateway (CLI macOS)

Utilisez la CLI de débogage pour exercer la même négociation WebSocket et la même logique de découverte du Gateway
que celles utilisées par l’app macOS, sans lancer l’app.
__OC_I18N_900006__
Options de connexion :

- `--url <ws://host:port>` : remplacer la configuration
- `--mode <local|remote>` : résoudre depuis la configuration (par défaut : configuration ou local)
- `--probe` : forcer une nouvelle sonde de santé
- `--timeout <ms>` : délai d’expiration de la requête (par défaut : `15000`)
- `--json` : sortie structurée pour les comparaisons

Options de découverte :

- `--include-local` : inclure les gateways qui seraient filtrés comme « locaux »
- `--timeout <ms>` : fenêtre globale de découverte (par défaut : `2000`)
- `--json` : sortie structurée pour les comparaisons

<Tip>
Comparez avec `openclaw gateway discover --json` pour voir si le pipeline de découverte de l’app macOS (`local.` plus le domaine étendu configuré, avec solutions de repli étendues et Tailscale Serve) diffère de la découverte basée sur `dns-sd` de la CLI Node.
</Tip>

## Plomberie de connexion distante (tunnels SSH)

Lorsque l’app macOS fonctionne en mode **Distant**, elle ouvre un tunnel SSH afin que les composants d’interface utilisateur locaux
puissent communiquer avec un Gateway distant comme s’il était sur localhost.

### Tunnel de contrôle (port WebSocket du Gateway)

- **Objectif :** contrôles de santé, état, Web Chat, configuration et autres appels du plan de contrôle.
- **Port local :** le port du Gateway (par défaut `18789`), toujours stable.
- **Port distant :** le même port du Gateway sur l’hôte distant.
- **Comportement :** pas de port local aléatoire ; l’app réutilise un tunnel sain existant
  ou le redémarre si nécessaire.
- **Forme SSH :** `ssh -N -L <local>:127.0.0.1:<remote>` avec BatchMode +
  ExitOnForwardFailure + options keepalive.
- **Signalement d’IP :** le tunnel SSH utilise loopback, le gateway verra donc l’IP du nœud
  comme `127.0.0.1`. Utilisez le transport **Direct (ws/wss)** si vous voulez que la véritable IP client
  apparaisse (voir [accès distant macOS](/fr/platforms/mac/remote)).

Pour les étapes de configuration, consultez [accès distant macOS](/fr/platforms/mac/remote). Pour les détails du protocole,
consultez [protocole Gateway](/fr/gateway/protocol).

## Docs associées

- [Runbook Gateway](/fr/gateway)
- [Gateway (macOS)](/fr/platforms/mac/bundled-gateway)
- [Autorisations macOS](/fr/platforms/mac/permissions)
- [Canvas](/fr/platforms/mac/canvas)
