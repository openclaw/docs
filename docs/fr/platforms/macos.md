---
read_when:
    - Implémentation des fonctionnalités de l’application macOS
    - Modification du cycle de vie du Gateway ou du pontage Node sur macOS
summary: Application compagnon OpenClaw pour macOS (barre des menus + courtier Gateway)
title: Application macOS
x-i18n:
    generated_at: "2026-05-06T07:32:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: cc67a88303073bb771fcec09e7366f710a6bd5500f584f8782232deaa69e599d
    source_path: platforms/macos.md
    workflow: 16
---

L’application macOS est le **compagnon de la barre des menus** pour OpenClaw. Elle gère les autorisations,
gère/se connecte au Gateway localement (launchd ou manuel) et expose les
capacités macOS à l’agent sous forme de Node.

## Ce qu’elle fait

- Affiche les notifications natives et l’état dans la barre des menus.
- Gère les invites TCC (Notifications, Accessibilité, Enregistrement de l’écran, Microphone,
  Reconnaissance vocale, Automatisation/AppleScript).
- Exécute le Gateway ou s’y connecte (local ou distant).
- Expose les outils propres à macOS (Canvas, Camera, Enregistrement de l’écran, `system.run`).
- Démarre le service hôte Node local en mode **distant** (launchd), et l’arrête en mode **local**.
- Héberge éventuellement **PeekabooBridge** pour l’automatisation de l’interface utilisateur.
- Installe la CLI globale (`openclaw`) sur demande via npm, pnpm ou bun (l’application préfère npm, puis pnpm, puis bun ; Node reste le runtime de Gateway recommandé).

## Mode local ou distant

- **Local** (par défaut) : l’application se connecte à un Gateway local en cours d’exécution s’il est présent ;
  sinon, elle active le service launchd via `openclaw gateway install`.
- **Distant** : l’application se connecte à un Gateway via SSH/Tailscale et ne démarre jamais
  de processus local.
  L’application démarre le **service hôte Node** local afin que le Gateway distant puisse joindre ce Mac.
  L’application ne lance pas le Gateway comme processus enfant.
  La découverte du Gateway préfère désormais les noms Tailscale MagicDNS aux adresses IP tailnet brutes,
  ce qui permet à l’application Mac de récupérer plus fiablement lorsque les adresses IP tailnet changent.

## Contrôle launchd

L’application gère un LaunchAgent par utilisateur libellé `ai.openclaw.gateway`
(ou `ai.openclaw.<profile>` lors de l’utilisation de `--profile`/`OPENCLAW_PROFILE` ; l’ancien `com.openclaw.*` est toujours déchargé).

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

Remplacez le libellé par `ai.openclaw.<profile>` lors de l’exécution d’un profil nommé.

Si le LaunchAgent n’est pas installé, activez-le depuis l’application ou exécutez
`openclaw gateway install`.

## Capacités Node (Mac)

L’application macOS se présente comme un Node. Commandes courantes :

- Canvas : `canvas.present`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot`, `canvas.a2ui.*`
- Camera : `camera.snap`, `camera.clip`
- Écran : `screen.snapshot`, `screen.record`
- Système : `system.run`, `system.notify`

Le Node signale une carte `permissions` afin que les agents puissent déterminer ce qui est autorisé.

Service Node + IPC de l’application :

- Lorsque le service hôte Node sans interface est en cours d’exécution (mode distant), il se connecte au WS du Gateway comme Node.
- `system.run` s’exécute dans l’application macOS (contexte UI/TCC) via un socket Unix local ; les invites et la sortie restent dans l’application.

Schéma (SCI) :

```
Gateway -> Node Service (WS)
                 |  IPC (UDS + token + HMAC + TTL)
                 v
             Mac App (UI + TCC + system.run)
```

## Approbations d’exécution (system.run)

`system.run` est contrôlé par les **approbations d’exécution** dans l’application macOS (Réglages → Approbations d’exécution).
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

- Les entrées `allowlist` sont des motifs glob pour les chemins de binaires résolus, ou des noms de commandes nus pour les commandes invoquées via PATH.
- Le texte brut de commande shell qui contient une syntaxe de contrôle ou d’expansion shell (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) est traité comme un échec de correspondance de la liste d’autorisation et nécessite une approbation explicite (ou l’ajout du binaire shell à la liste d’autorisation).
- Choisir « Toujours autoriser » dans l’invite ajoute cette commande à la liste d’autorisation.
- Les substitutions d’environnement de `system.run` sont filtrées (suppression de `PATH`, `DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`), puis fusionnées avec l’environnement de l’application.
- Pour les wrappers shell (`bash|sh|zsh ... -c/-lc`), les substitutions d’environnement limitées à la requête sont réduites à une petite liste d’autorisation explicite (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Pour les décisions d’autorisation permanente en mode liste d’autorisation, les wrappers de répartition connus (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) conservent les chemins des exécutables internes plutôt que les chemins des wrappers. Si le déballage n’est pas sûr, aucune entrée de liste d’autorisation n’est conservée automatiquement.

## Liens profonds

L’application enregistre le schéma d’URL `openclaw://` pour les actions locales.

### `openclaw://agent`

Déclenche une requête `agent` auprès du Gateway.
__OC_I18N_900004__
Paramètres de requête :

- `message` (obligatoire)
- `sessionKey` (facultatif)
- `thinking` (facultatif)
- `deliver` / `to` / `channel` (facultatif)
- `timeoutSeconds` (facultatif)
- `key` (clé de mode sans surveillance facultative)

Sécurité :

- Sans `key`, l’application demande une confirmation.
- Sans `key`, l’application applique une courte limite de message pour l’invite de confirmation et ignore `deliver` / `to` / `channel`.
- Avec une `key` valide, l’exécution se fait sans surveillance (prévue pour les automatisations personnelles).

## Parcours d’intégration (typique)

1. Installez et lancez **OpenClaw.app**.
2. Terminez la liste de vérification des autorisations (invites TCC).
3. Vérifiez que le mode **Local** est actif et que le Gateway est en cours d’exécution.
4. Installez la CLI si vous voulez un accès depuis le terminal.

## Emplacement du répertoire d’état (macOS)

Évitez de placer votre répertoire d’état OpenClaw dans iCloud ou d’autres dossiers synchronisés avec le cloud.
Les chemins adossés à la synchronisation peuvent ajouter de la latence et provoquer occasionnellement des courses de verrouillage/synchronisation de fichiers pour
les sessions et les identifiants.

Préférez un chemin d’état local non synchronisé, par exemple :
__OC_I18N_900005__
Si `openclaw doctor` détecte l’état sous :

- `~/Library/Mobile Documents/com~apple~CloudDocs/...`
- `~/Library/CloudStorage/...`

il avertira et recommandera de revenir à un chemin local.

## Workflow de build et de développement (natif)

- `cd apps/macos && swift build`
- `swift run OpenClaw` (ou Xcode)
- Empaqueter l’application : `scripts/package-mac-app.sh`

## Déboguer la connectivité du Gateway (CLI macOS)

Utilisez la CLI de débogage pour exercer la même poignée de main WebSocket du Gateway et la même logique de découverte
que l’application macOS, sans lancer l’application.
__OC_I18N_900006__
Options de connexion :

- `--url <ws://host:port>` : remplacer la configuration
- `--mode <local|remote>` : résoudre depuis la configuration (par défaut : configuration ou local)
- `--probe` : forcer une nouvelle sonde de santé
- `--timeout <ms>` : délai d’expiration de la requête (par défaut : `15000`)
- `--json` : sortie structurée pour comparaison

Options de découverte :

- `--include-local` : inclure les gateways qui seraient filtrés comme « locaux »
- `--timeout <ms>` : fenêtre globale de découverte (par défaut : `2000`)
- `--json` : sortie structurée pour comparaison

<Tip>
Comparez avec `openclaw gateway discover --json` pour voir si le pipeline de découverte de l’application macOS (`local.` plus le domaine longue portée configuré, avec des replis longue portée et Tailscale Serve) diffère de la découverte basée sur `dns-sd` de la CLI Node.
</Tip>

## Plomberie de connexion distante (tunnels SSH)

Lorsque l’application macOS fonctionne en mode **Distant**, elle ouvre un tunnel SSH afin que les composants d’interface locaux
puissent communiquer avec un Gateway distant comme s’il était sur localhost.

### Tunnel de contrôle (port WebSocket du Gateway)

- **Objectif :** contrôles de santé, état, Web Chat, configuration et autres appels du plan de contrôle.
- **Port local :** le port du Gateway (par défaut `18789`), toujours stable.
- **Port distant :** le même port du Gateway sur l’hôte distant.
- **Comportement :** aucun port local aléatoire ; l’application réutilise un tunnel sain existant
  ou le redémarre si nécessaire.
- **Forme SSH :** `ssh -N -L <local>:127.0.0.1:<remote>` avec BatchMode +
  ExitOnForwardFailure + options keepalive.
- **Signalement de l’IP :** le tunnel SSH utilise le loopback, donc le gateway verra l’adresse IP du Node
  comme `127.0.0.1`. Utilisez le transport **Direct (ws/wss)** si vous voulez que la véritable IP du client
  apparaisse (voir [accès distant macOS](/fr/platforms/mac/remote)).

Pour les étapes de configuration, consultez [accès distant macOS](/fr/platforms/mac/remote). Pour les détails du protocole,
consultez [protocole du Gateway](/fr/gateway/protocol).

## Docs associées

- [Runbook du Gateway](/fr/gateway)
- [Gateway (macOS)](/fr/platforms/mac/bundled-gateway)
- [Autorisations macOS](/fr/platforms/mac/permissions)
- [Canvas](/fr/platforms/mac/canvas)
