---
read_when:
    - macOS-appfuncties implementeren
    - Gateway-levenscyclus of Node-overbrugging wijzigen op macOS
summary: OpenClaw macOS-companion-app (menubalk + Gateway-broker)
title: macOS-app
x-i18n:
    generated_at: "2026-04-29T23:00:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2ed98cd4865f2117728d4349c9be99d9c2e20f4d86a77c80f5ba0b5520eb81cd
    source_path: platforms/macos.md
    workflow: 16
---

De macOS-app is de **menubalk‑begeleider** voor OpenClaw. De app beheert machtigingen,
beheert/hecht lokaal aan de Gateway (launchd of handmatig), en stelt macOS-
mogelijkheden beschikbaar aan de agent als een node.

## Wat de app doet

- Toont native meldingen en status in de menubalk.
- Beheert TCC-prompts (Meldingen, Toegankelijkheid, Schermopname, Microfoon,
  Spraakherkenning, Automatisering/AppleScript).
- Voert de Gateway uit of maakt er verbinding mee (lokaal of extern).
- Stelt macOS-specifieke tools beschikbaar (Canvas, Camera, Schermopname, `system.run`).
- Start de lokale node-hostservice in **remote** modus (launchd), en stopt deze in **local** modus.
- Host optioneel **PeekabooBridge** voor UI-automatisering.
- Installeert de globale CLI (`openclaw`) op verzoek via npm, pnpm of bun (de app geeft de voorkeur aan npm, daarna pnpm, daarna bun; Node blijft de aanbevolen Gateway-runtime).

## Lokale versus remote modus

- **Local** (standaard): de app hecht aan een draaiende lokale Gateway als die aanwezig is;
  anders schakelt de app de launchd-service in via `openclaw gateway install`.
- **Remote**: de app maakt verbinding met een Gateway via SSH/Tailscale en start nooit
  een lokaal proces.
  De app start de lokale **node-hostservice** zodat de remote Gateway deze Mac kan bereiken.
  De app spawnt de Gateway niet als childproces.
  Gateway-detectie geeft nu de voorkeur aan Tailscale MagicDNS-namen boven ruwe tailnet-IP's,
  waardoor de Mac-app betrouwbaarder herstelt wanneer tailnet-IP's veranderen.

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

## Node-mogelijkheden (mac)

De macOS-app presenteert zichzelf als een node. Veelgebruikte opdrachten:

- Canvas: `canvas.present`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot`, `canvas.a2ui.*`
- Camera: `camera.snap`, `camera.clip`
- Scherm: `screen.snapshot`, `screen.record`
- Systeem: `system.run`, `system.notify`

De node rapporteert een `permissions`-map zodat agents kunnen bepalen wat is toegestaan.

Node-service + app-IPC:

- Wanneer de headless node-hostservice draait (remote modus), maakt deze verbinding met de Gateway-WS als een node.
- `system.run` wordt uitgevoerd in de macOS-app (UI/TCC-context) via een lokale Unix-socket; prompts + uitvoer blijven in de app.

Diagram (SCI):

```
Gateway -> Node Service (WS)
                 |  IPC (UDS + token + HMAC + TTL)
                 v
             Mac App (UI + TCC + system.run)
```

## Exec-goedkeuringen (system.run)

`system.run` wordt beheerd door **Exec-goedkeuringen** in de macOS-app (Instellingen → Exec-goedkeuringen).
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

Opmerkingen:

- `allowlist`-vermeldingen zijn globpatronen voor opgeloste binaire paden, of kale opdrachtnamen voor opdrachten die via PATH worden aangeroepen.
- Ruwe shellopdrachttekst die shellbesturings- of expansiesyntaxis bevat (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) wordt behandeld als een allowlist-mis en vereist expliciete goedkeuring (of het allowlisten van de shellbinary).
- Het kiezen van “Altijd toestaan” in de prompt voegt die opdracht toe aan de allowlist.
- Omgevingsoverschrijvingen voor `system.run` worden gefilterd (verwijdert `PATH`, `DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`) en daarna samengevoegd met de omgeving van de app.
- Voor shellwrappers (`bash|sh|zsh ... -c/-lc`) worden request-gebonden omgevingsoverschrijvingen teruggebracht tot een kleine expliciete allowlist (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Voor altijd-toestaan-beslissingen in allowlist-modus worden bij bekende dispatchwrappers (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) de paden van de interne uitvoerbare bestanden vastgelegd in plaats van de wrapperpaden. Als uitpakken niet veilig is, wordt er niet automatisch een allowlist-vermelding vastgelegd.

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
- Met een geldige `key` verloopt de run onbeheerd (bedoeld voor persoonlijke automatiseringen).

## Onboardingflow (gebruikelijk)

1. Installeer en start **OpenClaw.app**.
2. Voltooi de machtigingenchecklist (TCC-prompts).
3. Zorg dat **Local** modus actief is en dat de Gateway draait.
4. Installeer de CLI als je terminaltoegang wilt.

## Plaatsing van state-directory (macOS)

Plaats je OpenClaw-state-directory niet in iCloud of andere cloudgesynchroniseerde mappen.
Paden met synchronisatie kunnen latency toevoegen en soms bestandsvergrendelings-/synchronisatieraces veroorzaken voor
sessies en inloggegevens.

Geef de voorkeur aan een lokaal, niet-gesynchroniseerd state-pad zoals:
__OC_I18N_900005__
Als `openclaw doctor` state detecteert onder:

- `~/Library/Mobile Documents/com~apple~CloudDocs/...`
- `~/Library/CloudStorage/...`

wordt er gewaarschuwd en aanbevolen terug te gaan naar een lokaal pad.

## Build- en dev-workflow (native)

- `cd apps/macos && swift build`
- `swift run OpenClaw` (of Xcode)
- App verpakken: `scripts/package-mac-app.sh`

## Gateway-connectiviteit debuggen (macOS CLI)

Gebruik de debug-CLI om dezelfde Gateway-WebSocket-handshake en detectielogica
te testen die de macOS-app gebruikt, zonder de app te starten.
__OC_I18N_900006__
Connect-opties:

- `--url <ws://host:port>`: configuratie overschrijven
- `--mode <local|remote>`: oplossen vanuit configuratie (standaard: configuratie of lokaal)
- `--probe`: een nieuwe health probe afdwingen
- `--timeout <ms>`: requesttimeout (standaard: `15000`)
- `--json`: gestructureerde uitvoer voor diffen

Discovery-opties:

- `--include-local`: gateways opnemen die als “lokaal” zouden worden gefilterd
- `--timeout <ms>`: algemeen detectievenster (standaard: `2000`)
- `--json`: gestructureerde uitvoer voor diffen

<Tip>
Vergelijk met `openclaw gateway discover --json` om te zien of de detectiepipeline van de macOS-app (`local.` plus het geconfigureerde wide-area-domein, met wide-area- en Tailscale Serve-fallbacks) verschilt van de op `dns-sd` gebaseerde detectie van de Node-CLI.
</Tip>

## Plumbing voor remote verbindingen (SSH-tunnels)

Wanneer de macOS-app in **Remote** modus draait, opent deze een SSH-tunnel zodat lokale UI-
componenten met een remote Gateway kunnen praten alsof die op localhost stond.

### Controltunnel (Gateway-WebSocket-poort)

- **Doel:** health checks, status, Web Chat, configuratie en andere control-plane-aanroepen.
- **Lokale poort:** de Gateway-poort (standaard `18789`), altijd stabiel.
- **Remote poort:** dezelfde Gateway-poort op de remote host.
- **Gedrag:** geen willekeurige lokale poort; de app hergebruikt een bestaande gezonde tunnel
  of herstart deze indien nodig.
- **SSH-vorm:** `ssh -N -L <local>:127.0.0.1:<remote>` met BatchMode +
  ExitOnForwardFailure + keepalive-opties.
- **IP-rapportage:** de SSH-tunnel gebruikt loopback, dus de Gateway ziet het node-
  IP als `127.0.0.1`. Gebruik **Direct (ws/wss)** transport als je wilt dat het echte client-
  IP verschijnt (zie [macOS remote toegang](/nl/platforms/mac/remote)).

Zie [macOS remote toegang](/nl/platforms/mac/remote) voor installatiestappen. Zie [Gateway-protocol](/nl/gateway/protocol) voor protocol-
details.

## Gerelateerde docs

- [Gateway-runbook](/nl/gateway)
- [Gateway (macOS)](/nl/platforms/mac/bundled-gateway)
- [macOS-machtigingen](/nl/platforms/mac/permissions)
- [Canvas](/nl/platforms/mac/canvas)
