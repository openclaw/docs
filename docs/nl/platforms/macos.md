---
read_when:
    - macOS-appfuncties implementeren
    - Gateway-levenscyclus of node-bridging wijzigen op macOS
summary: OpenClaw macOS-begeleidende app (menubalk + gateway-broker)
title: macOS-app
x-i18n:
    generated_at: "2026-06-27T17:49:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4e637a1ae5ca66dfb6255fb6a233436ae0cf04b972f96446e8dc3d703486c9fa
    source_path: platforms/macos.md
    workflow: 16
---

De macOS-app is de **menubalk-app** voor OpenClaw. Deze beheert machtigingen,
beheert of koppelt lokaal aan de Gateway (launchd of handmatig), en stelt macOS-
mogelijkheden beschikbaar aan de agent als een node.

## Wat het doet

- Toont native meldingen en status in de menubalk.
- Beheert TCC-prompts (Meldingen, Toegankelijkheid, Schermopname, Microfoon,
  Spraakherkenning, Automatisering/AppleScript).
- Draait of verbindt met de Gateway (lokaal of extern).
- Stelt macOS-specifieke tools beschikbaar (Canvas, Camera, Schermopname, `system.run`).
- Start de lokale node-hostservice in **remote** modus (launchd), en stopt deze in **local** modus.
- Host optioneel **PeekabooBridge** voor UI-automatisering.
- Installeert de globale CLI (`openclaw`) op verzoek via npm, pnpm of bun (de app geeft de voorkeur aan npm, daarna pnpm, daarna bun; Node blijft de aanbevolen Gateway-runtime).

## Lokale versus externe modus

- **Local** (standaard): de app koppelt aan een draaiende lokale Gateway als die aanwezig is;
  anders schakelt deze de launchd-service in via `openclaw gateway install`.
- **Remote**: de app verbindt met een Gateway via SSH/Tailscale en start nooit
  een lokaal proces.
  De app start de lokale **node-hostservice** zodat de externe Gateway deze Mac kan bereiken.
  De app start de Gateway niet als een childproces.
  Gateway-detectie geeft nu de voorkeur aan Tailscale MagicDNS-namen boven ruwe tailnet-IP's,
  zodat de Mac-app betrouwbaarder herstelt wanneer tailnet-IP's veranderen.

## Launchd-beheer

De app beheert een LaunchAgent per gebruiker met label `ai.openclaw.gateway`
(of `ai.openclaw.<profile>` bij gebruik van `--profile`/`OPENCLAW_PROFILE`; legacy `com.openclaw.*` wordt nog steeds ontladen).

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

Vervang het label door `ai.openclaw.<profile>` wanneer je een benoemd profiel gebruikt.

Als de LaunchAgent niet is geïnstalleerd, schakel deze dan in vanuit de app of voer
`openclaw gateway install` uit.

Als de Gateway herhaaldelijk minuten tot uren verdwijnt en alleen hervat wanneer je de Control UI aanraakt of via SSH inlogt op de host, zie dan de probleemoplossingsnotitie voor macOS Maintenance Sleep / `ENETDOWN`-crashes en de respawn-beschermingspoort van launchd in [Gateway-probleemoplossing](/nl/gateway/troubleshooting#macos-gateway-silently-stops-responding-then-resumes-when-you-touch-the-dashboard).

## Node-mogelijkheden (mac)

De macOS-app presenteert zichzelf als een node. Veelgebruikte commando's:

- Canvas: `canvas.present`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot`, `canvas.a2ui.*`
- Camera: `camera.snap`, `camera.clip`
- Scherm: `screen.snapshot`, `screen.record`
- Systeem: `system.run`, `system.notify`

De node rapporteert een `permissions`-map zodat agents kunnen bepalen wat is toegestaan.

Node-service + app-IPC:

- Wanneer de headless node-hostservice draait (remote modus), verbindt deze met de Gateway WS als een node.
- `system.run` wordt uitgevoerd in de macOS-app (UI/TCC-context) via een lokale Unix-socket; prompts + uitvoer blijven in de app.

Diagram (SCI):

```
Gateway -> Node Service (WS)
                 |  IPC (UDS + token + HMAC + TTL)
                 v
             Mac App (UI + TCC + system.run)
```

## Uitvoeringsgoedkeuringen (system.run)

`system.run` wordt beheerd door **Uitvoeringsgoedkeuringen** in de macOS-app (Instellingen → Uitvoeringsgoedkeuringen).
Beveiliging + vragen + allowlist worden lokaal op de Mac opgeslagen in:

```
~/.openclaw/exec-approvals.json
```

Voorbeeld:

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

Notities:

- `allowlist`-vermeldingen zijn globpatronen voor opgeloste binaire paden, of kale commandonamen voor commando's die via PATH worden aangeroepen.
- Ruwe shellcommandotekst die shellbesturing of uitbreidingssyntaxis bevat (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) wordt behandeld als een allowlist-mis en vereist expliciete goedkeuring (of het toevoegen van de shellbinary aan de allowlist).
- Het kiezen van "Altijd toestaan" in de prompt voegt dat commando toe aan de allowlist.
- Omgevingsoverschrijvingen van `system.run` worden gefilterd (verwijdert `PATH`, `DYLD_*`, `LD_*`, `BASHOPTS`, `FPATH`, `KSH_ENV`, `NODE_OPTIONS`, `NODE_REDIRECT_WARNINGS`, `NODE_REPL_EXTERNAL_MODULE`, `NODE_REPL_HISTORY`, `NODE_V8_COVERAGE`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`, `TCLLIBPATH`) en daarna samengevoegd met de omgeving van de app.
- Voor shellwrappers (`bash|sh|zsh ... -c/-lc`) worden request-gebonden omgevingsoverschrijvingen teruggebracht tot een kleine expliciete allowlist (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Voor beslissingen voor altijd toestaan in allowlist-modus bewaren bekende dispatchwrappers (`env`, `flock`, `nice`, `nohup`, `stdbuf`, `timeout`) interne uitvoerbare paden in plaats van wrapperpaden. Als uitpakken niet veilig is, wordt er niet automatisch een allowlist-vermelding bewaard.

## Deep links

De app registreert het `openclaw://`-URL-schema voor lokale acties.

### `openclaw://agent`

Activeert een Gateway-`agent`-request.
__OC_I18N_900004__
Queryparameters:

- `message` (vereist)
- `sessionKey` (optioneel)
- `thinking` (optioneel)
- `deliver` / `to` / `channel` (optioneel)
- `timeoutSeconds` (optioneel)
- `key` (optionele sleutel voor onbeheerde modus)

Veiligheid:

- Zonder `key` vraagt de app om bevestiging.
- Zonder `key` handhaaft de app een korte berichtlimiet voor de bevestigingsprompt en negeert `deliver` / `to` / `channel`.
- Met een geldige `key` draait de run onbeheerd (bedoeld voor persoonlijke automatiseringen).

## Onboardingstroom (typisch)

1. Installeer en start **OpenClaw.app**.
2. Voltooi de machtigingenchecklist (TCC-prompts).
3. Zorg dat de **Local** modus actief is en dat de Gateway draait.
4. Installeer de CLI als je terminaltoegang wilt.

## Plaatsing van state-map (macOS)

Plaats je OpenClaw-state-map niet in iCloud of andere cloudgesynchroniseerde mappen.
Door synchronisatie ondersteunde paden kunnen latency toevoegen en soms file-lock/synchronisatieraces veroorzaken voor
sessies en aanmeldgegevens.

Geef de voorkeur aan een lokaal niet-gesynchroniseerd state-pad zoals:
__OC_I18N_900005__
Als `openclaw doctor` state detecteert onder:

- `~/Library/Mobile Documents/com~apple~CloudDocs/...`
- `~/Library/CloudStorage/...`

waarschuwt het en raadt het aan terug te verplaatsen naar een lokaal pad.

## Build- en dev-workflow (native)

- `cd apps/macos && swift build`
- `swift run OpenClaw` (of Xcode)
- App verpakken: `scripts/package-mac-app.sh`

## Gateway-connectiviteit debuggen (macOS CLI)

Gebruik de debug-CLI om dezelfde Gateway WebSocket-handshake en detectie-
logica te oefenen die de macOS-app gebruikt, zonder de app te starten.
__OC_I18N_900006__
Verbindingsopties:

- `--url <ws://host:port>`: configuratie overschrijven
- `--mode <local|remote>`: oplossen vanuit configuratie (standaard: configuratie of lokaal)
- `--probe`: een nieuwe healthprobe forceren
- `--timeout <ms>`: requesttime-out (standaard: `15000`)
- `--json`: gestructureerde uitvoer voor diffing

Detectieopties:

- `--include-local`: gateways opnemen die als "lokaal" zouden worden gefilterd
- `--timeout <ms>`: totale detectieperiode (standaard: `2000`)
- `--json`: gestructureerde uitvoer voor diffing

<Tip>
Vergelijk met `openclaw gateway discover --json` om te zien of de detectiepipeline van de macOS-app (`local.` plus het geconfigureerde wide-area-domein, met wide-area- en Tailscale Serve-fallbacks) verschilt van de op `dns-sd` gebaseerde detectie van de Node CLI.
</Tip>

## Externe verbindingsplumbing (SSH-tunnels)

Wanneer de macOS-app in **Remote** modus draait, opent deze een SSH-tunnel zodat lokale UI-
componenten met een externe Gateway kunnen praten alsof die op localhost staat.

### Beheertunnel (Gateway WebSocket-poort)

- **Doel:** healthchecks, status, Web Chat, configuratie en andere control-plane-aanroepen.
- **Lokale poort:** de Gateway-poort (standaard `18789`), altijd stabiel.
- **Externe poort:** dezelfde Gateway-poort op de externe host.
- **Gedrag:** geen willekeurige lokale poort; de app hergebruikt een bestaande gezonde tunnel
  of herstart deze indien nodig.
- **SSH-vorm:** `ssh -N -L <local>:127.0.0.1:<remote>` met BatchMode +
  ExitOnForwardFailure + keepalive-opties.
- **IP-rapportage:** de SSH-tunnel gebruikt loopback, dus de Gateway ziet het node-
  IP als `127.0.0.1`. Gebruik **Direct (ws/wss)** transport als je wilt dat het echte client-
  IP verschijnt (zie [externe macOS-toegang](/nl/platforms/mac/remote)).

Voor instelstappen, zie [externe macOS-toegang](/nl/platforms/mac/remote). Voor protocol-
details, zie [Gateway-protocol](/nl/gateway/protocol).

## Gerelateerde docs

- [Gateway-runbook](/nl/gateway)
- [Gateway (macOS)](/nl/platforms/mac/bundled-gateway)
- [macOS-machtigingen](/nl/platforms/mac/permissions)
- [Canvas](/nl/platforms/mac/canvas)
