---
read_when:
    - Implémentation de fonctionnalités de l’app macOS
    - Modification du cycle de vie de la gateway ou du pont de nœud sur macOS
summary: App compagnon macOS OpenClaw (barre des menus + courtier gateway)
title: App macOS
x-i18n:
    generated_at: "2026-04-25T13:51:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 852c93694ebb4ac083b9a44c2e4d6e40274e6e7f3aa6fa664a8eba1a82aaf5b1
    source_path: platforms/macos.md
    workflow: 15
---

L’app macOS est le **compagnon de barre des menus** pour OpenClaw. Elle gère les permissions,
gère/se connecte à la Gateway localement (launchd ou manuel), et expose les
fonctionnalités macOS à l’agent comme un nœud.

## Ce qu’elle fait

- Affiche des notifications natives et l’état dans la barre des menus.
- Gère les invites TCC (Notifications, Accessibilité, Enregistrement d’écran, Microphone,
  Reconnaissance vocale, Automatisation/AppleScript).
- Exécute ou connecte la Gateway (locale ou distante).
- Expose des outils réservés à macOS (Canvas, Camera, Screen Recording, `system.run`).
- Démarre le service hôte de nœud local en mode **distant** (launchd), et l’arrête en mode **local**.
- Peut éventuellement héberger **PeekabooBridge** pour l’automatisation de l’interface utilisateur.
- Installe la CLI globale (`openclaw`) sur demande via npm, pnpm ou bun (l’app préfère npm, puis pnpm, puis bun ; Node reste le runtime Gateway recommandé).

## Mode local vs distant

- **Local** (par défaut) : l’app se connecte à une Gateway locale déjà en cours d’exécution si elle existe ;
  sinon elle active le service launchd via `openclaw gateway install`.
- **Distant** : l’app se connecte à une Gateway via SSH/Tailscale et ne démarre jamais
  un processus local.
  L’app démarre le **service hôte de nœud** local afin que la Gateway distante puisse atteindre ce Mac.
  L’app ne lance pas la Gateway comme processus enfant.
  La découverte de Gateway préfère désormais les noms Tailscale MagicDNS aux IP brutes de tailnet,
  afin que l’app Mac se rétablisse plus fiablement lorsque les IP de tailnet changent.

## Contrôle Launchd

L’app gère un LaunchAgent par utilisateur étiqueté `ai.openclaw.gateway`
(ou `ai.openclaw.<profile>` lors de l’utilisation de `--profile`/`OPENCLAW_PROFILE` ; l’ancien `com.openclaw.*` est toujours déchargé).

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

Remplacez l’étiquette par `ai.openclaw.<profile>` lorsque vous exécutez un profil nommé.

Si le LaunchAgent n’est pas installé, activez-le depuis l’app ou exécutez
`openclaw gateway install`.

## Fonctionnalités de nœud (mac)

L’app macOS se présente comme un nœud. Commandes courantes :

- Canvas : `canvas.present`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot`, `canvas.a2ui.*`
- Camera : `camera.snap`, `camera.clip`
- Écran : `screen.snapshot`, `screen.record`
- Système : `system.run`, `system.notify`

Le nœud signale une map `permissions` afin que les agents puissent décider de ce qui est autorisé.

Service de nœud + IPC de l’app :

- Lorsque le service hôte de nœud headless est en cours d’exécution (mode distant), il se connecte à la WebSocket Gateway en tant que nœud.
- `system.run` s’exécute dans l’app macOS (contexte UI/TCC) via une socket Unix locale ; les invites + la sortie restent dans l’app.

Diagramme (SCI) :

```
Gateway -> Node Service (WS)
                 |  IPC (UDS + token + HMAC + TTL)
                 v
             Mac App (UI + TCC + system.run)
```

## Approbations d’exécution (`system.run`)

`system.run` est contrôlé par les **approbations d’exécution** dans l’app macOS (Réglages → Approbations d’exécution).
Les paramètres security + ask + allowlist sont stockés localement sur le Mac dans :

```
~/.openclaw/exec-approvals.json
```

Exemple :

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

Remarques :

- Les entrées `allowlist` sont des motifs glob pour les chemins binaires résolus, ou des noms de commande simples pour les commandes invoquées via PATH.
- Le texte brut de commande shell qui contient une syntaxe de contrôle ou d’expansion shell (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) est traité comme une absence de correspondance dans la liste d’autorisations et nécessite une approbation explicite (ou l’ajout du binaire shell à la liste d’autorisations).
- Le choix « Always Allow » dans l’invite ajoute cette commande à la liste d’autorisations.
- Les remplacements d’environnement de `system.run` sont filtrés (supprime `PATH`, `DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`) puis fusionnés avec l’environnement de l’app.
- Pour les wrappers shell (`bash|sh|zsh ... -c/-lc`), les remplacements d’environnement à portée de requête sont réduits à une petite liste d’autorisations explicite (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Pour les décisions « toujours autoriser » en mode liste d’autorisations, les wrappers de distribution connus (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) conservent les chemins de l’exécutable interne au lieu des chemins du wrapper. Si le déballage n’est pas sûr, aucune entrée de liste d’autorisations n’est conservée automatiquement.

## Liens profonds

L’app enregistre le schéma d’URL `openclaw://` pour les actions locales.

### `openclaw://agent`

Déclenche une requête Gateway `agent`.
__OC_I18N_900004__
Paramètres de requête :

- `message` (requis)
- `sessionKey` (facultatif)
- `thinking` (facultatif)
- `deliver` / `to` / `channel` (facultatif)
- `timeoutSeconds` (facultatif)
- `key` (facultatif, clé du mode sans surveillance)

Sécurité :

- Sans `key`, l’app demande une confirmation.
- Sans `key`, l’app impose une limite courte sur le message pour l’invite de confirmation et ignore `deliver` / `to` / `channel`.
- Avec une `key` valide, l’exécution est sans surveillance (destiné aux automatisations personnelles).

## Flux d’onboarding (typique)

1. Installez et lancez **OpenClaw.app**.
2. Terminez la checklist des permissions (invites TCC).
3. Assurez-vous que le mode **Local** est actif et que la Gateway est en cours d’exécution.
4. Installez la CLI si vous souhaitez un accès terminal.

## Emplacement du répertoire d’état (macOS)

Évitez de placer votre répertoire d’état OpenClaw dans iCloud ou d’autres dossiers synchronisés par le cloud.
Les chemins synchronisés peuvent ajouter de la latence et parfois provoquer des courses de verrouillage/synchronisation de fichiers pour
les sessions et les identifiants.

Préférez un chemin d’état local non synchronisé tel que :
__OC_I18N_900005__
Si `openclaw doctor` détecte l’état sous :

- `~/Library/Mobile Documents/com~apple~CloudDocs/...`
- `~/Library/CloudStorage/...`

il avertira et recommandera de revenir vers un chemin local.

## Workflow de build & développement (natif)

- `cd apps/macos && swift build`
- `swift run OpenClaw` (ou Xcode)
- Packager l’app : `scripts/package-mac-app.sh`

## Déboguer la connectivité gateway (CLI macOS)

Utilisez la CLI de débogage pour exercer la même négociation WebSocket Gateway et la même logique de découverte
que l’app macOS, sans lancer l’app.
__OC_I18N_900006__
Options de connexion :

- `--url <ws://host:port>` : remplace la configuration
- `--mode <local|remote>` : résout depuis la configuration (par défaut : config ou local)
- `--probe` : force une nouvelle sonde d’intégrité
- `--timeout <ms>` : délai d’expiration de la requête (par défaut : `15000`)
- `--json` : sortie structurée pour les comparaisons

Options de découverte :

- `--include-local` : inclure les gateways qui seraient filtrées comme « locales »
- `--timeout <ms>` : fenêtre globale de découverte (par défaut : `2000`)
- `--json` : sortie structurée pour les comparaisons

Conseil : comparez avec `openclaw gateway discover --json` pour voir si le
pipeline de découverte de l’app macOS (`local.` plus le domaine étendu configuré, avec
replis zone étendue et Tailscale Serve) diffère de
la découverte basée sur `dns-sd` de la CLI Node.

## Mécanique de connexion distante (tunnels SSH)

Lorsque l’app macOS s’exécute en mode **distant**, elle ouvre un tunnel SSH afin que les composants d’interface locaux
puissent parler à une Gateway distante comme si elle était sur localhost.

### Tunnel de contrôle (port WebSocket Gateway)

- **Objectif :** vérifications d’intégrité, état, Web Chat, configuration et autres appels du plan de contrôle.
- **Port local :** le port Gateway (par défaut `18789`), toujours stable.
- **Port distant :** le même port Gateway sur l’hôte distant.
- **Comportement :** pas de port local aléatoire ; l’app réutilise un tunnel sain existant
  ou le redémarre si nécessaire.
- **Forme SSH :** `ssh -N -L <local>:127.0.0.1:<remote>` avec les options BatchMode +
  ExitOnForwardFailure + keepalive.
- **Signalement IP :** le tunnel SSH utilise loopback, donc la gateway verra l’IP du nœud
  comme `127.0.0.1`. Utilisez le transport **Direct (ws/wss)** si vous voulez que la véritable IP client
  apparaisse (voir [accès distant macOS](/fr/platforms/mac/remote)).

Pour les étapes de configuration, voir [accès distant macOS](/fr/platforms/mac/remote). Pour les détails du protocole,
voir [Protocole Gateway](/fr/gateway/protocol).

## Documentation associée

- [Guide opérationnel de la gateway](/fr/gateway)
- [Gateway (macOS)](/fr/platforms/mac/bundled-gateway)
- [Permissions macOS](/fr/platforms/mac/permissions)
- [Canvas](/fr/platforms/mac/canvas)
