---
read_when:
    - Implémenter des fonctionnalités d’application macOS
    - Modification du cycle de vie du gateway ou du pontage de nœuds sur macOS
summary: Application compagnon macOS OpenClaw (barre de menus + courtier Gateway)
title: application macOS
x-i18n:
    generated_at: "2026-06-27T17:44:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4e637a1ae5ca66dfb6255fb6a233436ae0cf04b972f96446e8dc3d703486c9fa
    source_path: platforms/macos.md
    workflow: 16
---

L’application macOS est le **compagnon de barre de menus** pour OpenClaw. Elle gère les autorisations,
gère/se rattache au Gateway localement (launchd ou manuel), et expose les
capacités macOS à l’agent en tant que nœud.

## Ce qu’elle fait

- Affiche les notifications natives et l’état dans la barre de menus.
- Gère les invites TCC (Notifications, Accessibilité, Enregistrement de l’écran, Microphone,
  Reconnaissance vocale, Automatisation/AppleScript).
- Exécute le Gateway ou s’y connecte (local ou distant).
- Expose les outils réservés à macOS (Canvas, Caméra, Enregistrement de l’écran, `system.run`).
- Démarre le service d’hôte de nœud local en mode **distant** (launchd), et l’arrête en mode **local**.
- Héberge éventuellement **PeekabooBridge** pour l’automatisation de l’interface utilisateur.
- Installe la CLI globale (`openclaw`) sur demande via npm, pnpm ou bun (l’application préfère npm, puis pnpm, puis bun ; Node reste l’environnement d’exécution recommandé pour le Gateway).

## Mode local ou distant

- **Local** (par défaut) : l’application se rattache à un Gateway local en cours d’exécution s’il est présent ;
  sinon, elle active le service launchd via `openclaw gateway install`.
- **Distant** : l’application se connecte à un Gateway via SSH/Tailscale et ne démarre jamais
  de processus local.
  L’application démarre le **service d’hôte de nœud** local afin que le Gateway distant puisse atteindre ce Mac.
  L’application ne lance pas le Gateway comme processus enfant.
  La découverte du Gateway privilégie désormais les noms Tailscale MagicDNS plutôt que les IP tailnet brutes,
  afin que l’application Mac récupère de manière plus fiable lorsque les IP tailnet changent.

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

Si le Gateway disparaît de façon répétée pendant plusieurs minutes ou heures et ne reprend que lorsque vous touchez l’interface Control UI ou vous connectez en SSH à l’hôte, consultez la note de dépannage pour les plantages macOS Maintenance Sleep / `ENETDOWN` et le mécanisme de protection contre la réapparition de launchd dans [Dépannage du Gateway](/fr/gateway/troubleshooting#macos-gateway-silently-stops-responding-then-resumes-when-you-touch-the-dashboard).

## Capacités du Node (mac)

L’application macOS se présente comme un nœud. Commandes courantes :

- Canvas : `canvas.present`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot`, `canvas.a2ui.*`
- Caméra : `camera.snap`, `camera.clip`
- Écran : `screen.snapshot`, `screen.record`
- Système : `system.run`, `system.notify`

Le nœud signale une carte `permissions` afin que les agents puissent décider ce qui est autorisé.

Service Node + IPC de l’application :

- Lorsque le service d’hôte de nœud sans interface est en cours d’exécution (mode distant), il se connecte au WS du Gateway comme nœud.
- `system.run` s’exécute dans l’application macOS (contexte UI/TCC) via un socket Unix local ; les invites et la sortie restent dans l’application.

Diagramme (SCI) :

```
Gateway -> Node Service (WS)
                 |  IPC (UDS + token + HMAC + TTL)
                 v
             Mac App (UI + TCC + system.run)
```

## Approbations d’exécution (system.run)

`system.run` est contrôlé par les **Approbations d’exécution** dans l’application macOS (Réglages → Approbations d’exécution).
La sécurité, la demande et la liste d’autorisation sont stockées localement sur le Mac dans :

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

Remarques :

- Les entrées `allowlist` sont des motifs glob pour les chemins binaires résolus, ou des noms de commande nus pour les commandes appelées via PATH.
- Le texte brut d’une commande shell qui contient une syntaxe de contrôle ou d’expansion du shell (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) est traité comme un échec de correspondance de la liste d’autorisation et nécessite une approbation explicite (ou l’ajout du binaire du shell à la liste d’autorisation).
- Choisir « Toujours autoriser » dans l’invite ajoute cette commande à la liste d’autorisation.
- Les substitutions d’environnement de `system.run` sont filtrées (suppression de `PATH`, `DYLD_*`, `LD_*`, `BASHOPTS`, `FPATH`, `KSH_ENV`, `NODE_OPTIONS`, `NODE_REDIRECT_WARNINGS`, `NODE_REPL_EXTERNAL_MODULE`, `NODE_REPL_HISTORY`, `NODE_V8_COVERAGE`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`, `TCLLIBPATH`), puis fusionnées avec l’environnement de l’application.
- Pour les enveloppes shell (`bash|sh|zsh ... -c/-lc`), les substitutions d’environnement limitées à la requête sont réduites à une petite liste d’autorisation explicite (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Pour les décisions d’autorisation permanente en mode liste d’autorisation, les enveloppes de dispatch connues (`env`, `flock`, `nice`, `nohup`, `stdbuf`, `timeout`) conservent les chemins des exécutables internes plutôt que les chemins des enveloppes. Si le désenveloppement n’est pas sûr, aucune entrée de liste d’autorisation n’est conservée automatiquement.

## Liens profonds

L’application enregistre le schéma d’URL `openclaw://` pour les actions locales.

### `openclaw://agent`

Déclenche une requête `agent` du Gateway.
__OC_I18N_900004__
Paramètres de requête :

- `message` (obligatoire)
- `sessionKey` (facultatif)
- `thinking` (facultatif)
- `deliver` / `to` / `channel` (facultatif)
- `timeoutSeconds` (facultatif)
- `key` (clé facultative du mode sans surveillance)

Sécurité :

- Sans `key`, l’application demande une confirmation.
- Sans `key`, l’application applique une limite courte de message pour l’invite de confirmation et ignore `deliver` / `to` / `channel`.
- Avec une `key` valide, l’exécution se fait sans surveillance (destinée aux automatisations personnelles).

## Parcours d’intégration (typique)

1. Installez et lancez **OpenClaw.app**.
2. Terminez la liste de contrôle des autorisations (invites TCC).
3. Assurez-vous que le mode **Local** est actif et que le Gateway est en cours d’exécution.
4. Installez la CLI si vous voulez accéder au terminal.

## Emplacement du répertoire d’état (macOS)

Évitez de placer le répertoire d’état OpenClaw dans iCloud ou d’autres dossiers synchronisés dans le cloud.
Les chemins reposant sur la synchronisation peuvent ajouter de la latence et provoquer occasionnellement des conflits de verrouillage/synchronisation de fichiers pour
les sessions et les identifiants.

Préférez un chemin d’état local non synchronisé tel que :
__OC_I18N_900005__
Si `openclaw doctor` détecte un état sous :

- `~/Library/Mobile Documents/com~apple~CloudDocs/...`
- `~/Library/CloudStorage/...`

il avertira et recommandera de revenir à un chemin local.

## Flux de build et de développement (natif)

- `cd apps/macos && swift build`
- `swift run OpenClaw` (ou Xcode)
- Paqueter l’application : `scripts/package-mac-app.sh`

## Déboguer la connectivité au Gateway (CLI macOS)

Utilisez la CLI de débogage pour exercer la même négociation WebSocket du Gateway et la même logique de découverte
que celles utilisées par l’application macOS, sans lancer l’application.
__OC_I18N_900006__
Options de connexion :

- `--url <ws://host:port>` : remplacer la configuration
- `--mode <local|remote>` : résoudre depuis la configuration (par défaut : configuration ou local)
- `--probe` : forcer une nouvelle sonde de santé
- `--timeout <ms>` : délai d’expiration de la requête (par défaut : `15000`)
- `--json` : sortie structurée pour la comparaison

Options de découverte :

- `--include-local` : inclure les gateways qui seraient filtrés comme « locaux »
- `--timeout <ms>` : fenêtre globale de découverte (par défaut : `2000`)
- `--json` : sortie structurée pour la comparaison

<Tip>
Comparez avec `openclaw gateway discover --json` pour voir si le pipeline de découverte de l’application macOS (`local.` plus le domaine longue portée configuré, avec des solutions de repli longue portée et Tailscale Serve) diffère de la découverte du Node CLI basée sur `dns-sd`.
</Tip>

## Plomberie de connexion distante (tunnels SSH)

Lorsque l’application macOS s’exécute en mode **Distant**, elle ouvre un tunnel SSH afin que les composants
d’interface locaux puissent communiquer avec un Gateway distant comme s’il était sur localhost.

### Tunnel de contrôle (port WebSocket du Gateway)

- **Objectif :** contrôles de santé, état, Web Chat, configuration et autres appels du plan de contrôle.
- **Port local :** le port du Gateway (par défaut `18789`), toujours stable.
- **Port distant :** le même port du Gateway sur l’hôte distant.
- **Comportement :** aucun port local aléatoire ; l’application réutilise un tunnel sain existant
  ou le redémarre si nécessaire.
- **Forme SSH :** `ssh -N -L <local>:127.0.0.1:<remote>` avec BatchMode +
  ExitOnForwardFailure + options keepalive.
- **Signalement IP :** le tunnel SSH utilise local loopback, donc le gateway verra l’IP du nœud
  comme `127.0.0.1`. Utilisez le transport **Direct (ws/wss)** si vous voulez que la véritable IP du client
  apparaisse (voir [Accès distant macOS](/fr/platforms/mac/remote)).

Pour les étapes de configuration, voir [Accès distant macOS](/fr/platforms/mac/remote). Pour les détails du protocole,
voir [Protocole Gateway](/fr/gateway/protocol).

## Documentation associée

- [Runbook Gateway](/fr/gateway)
- [Gateway (macOS)](/fr/platforms/mac/bundled-gateway)
- [Autorisations macOS](/fr/platforms/mac/permissions)
- [Canvas](/fr/platforms/mac/canvas)
