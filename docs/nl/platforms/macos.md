---
read_when:
    - macOS-appfuncties implementeren
    - Gateway-levenscyclus of Node-bridging wijzigen op macOS
summary: Begeleidende OpenClaw-app voor macOS (menubalk + Gateway-broker)
title: macOS-app
x-i18n:
    generated_at: "2026-05-06T09:24:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: cc67a88303073bb771fcec09e7366f710a6bd5500f584f8782232deaa69e599d
    source_path: platforms/macos.md
    workflow: 16
---

De macOS-app is de **menubalkbegeleider** voor OpenClaw. Deze beheert machtigingen,
beheert/verbindt lokaal met de Gateway (launchd of handmatig), en stelt macOS-
mogelijkheden beschikbaar aan de agent als een Node.

## Wat het doet

- Toont native meldingen en status in de menubalk.
- Beheert TCC-prompts (Meldingen, Toegankelijkheid, Schermopname, Microfoon,
  Spraakherkenning, Automatisering/AppleScript).
- Start de Gateway of maakt er verbinding mee (lokaal of extern).
- Stelt macOS-specifieke tools beschikbaar (Canvas, Camera, Schermopname, `system.run`).
- Start de lokale Node-hostservice in **remote** modus (launchd), en stopt deze in **lokale** modus.
- Host optioneel **PeekabooBridge** voor UI-automatisering.
- Installeert de globale CLI (`openclaw`) op verzoek via npm, pnpm of bun (de app geeft de voorkeur aan npm, daarna pnpm en daarna bun; Node blijft de aanbevolen Gateway-runtime).

## Lokale versus remote modus

- **Lokaal** (standaard): de app verbindt met een actieve lokale Gateway als die aanwezig is;
  anders schakelt deze de launchd-service in via `openclaw gateway install`.
- **Remote**: de app maakt verbinding met een Gateway via SSH/Tailscale en start nooit
  een lokaal proces.
  De app start de lokale **Node-hostservice** zodat de remote Gateway deze Mac kan bereiken.
  De app start de Gateway niet als onderliggend proces.
  Gateway-detectie geeft nu de voorkeur aan Tailscale MagicDNS-namen boven onbewerkte tailnet-IP's,
  zodat de Mac-app betrouwbaarder herstelt wanneer tailnet-IP's veranderen.

## Launchd-besturing

De app beheert een LaunchAgent per gebruiker met het label `ai.openclaw.gateway`
(of `ai.openclaw.<profile>` wanneer `--profile`/`OPENCLAW_PROFILE` wordt gebruikt; verouderde `com.openclaw.*` wordt nog steeds ontladen).

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

Vervang het label door `ai.openclaw.<profile>` wanneer je een benoemd profiel gebruikt.

Als de LaunchAgent niet is geïnstalleerd, schakel deze dan in vanuit de app of voer
`openclaw gateway install` uit.

## Node-mogelijkheden (Mac)

De macOS-app presenteert zichzelf als een Node. Veelgebruikte opdrachten:

- Canvas: `canvas.present`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot`, `canvas.a2ui.*`
- Camera: `camera.snap`, `camera.clip`
- Scherm: `screen.snapshot`, `screen.record`
- Systeem: `system.run`, `system.notify`

De Node rapporteert een `permissions`-map zodat agents kunnen bepalen wat is toegestaan.

Node-service + app-IPC:

- Wanneer de headless Node-hostservice actief is (remote modus), maakt deze als Node verbinding met de Gateway-WS.
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

Opmerkingen:

- `allowlist`-vermeldingen zijn glob-patronen voor opgeloste binaire paden, of kale opdrachtnamen voor opdrachten die via PATH worden aangeroepen.
- Onbewerkte shellopdrachttekst die shellbesturing of uitbreidingssyntaxis bevat (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) wordt behandeld als een allowlist-misser en vereist expliciete goedkeuring (of het toestaan van de shell-binary).
- Het kiezen van "Altijd toestaan" in de prompt voegt die opdracht toe aan de allowlist.
- Omgevingsoverschrijvingen voor `system.run` worden gefilterd (verwijdert `PATH`, `DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`) en daarna samengevoegd met de omgeving van de app.
- Voor shell-wrappers (`bash|sh|zsh ... -c/-lc`) worden aanvraaggebonden omgevingsoverschrijvingen teruggebracht tot een kleine expliciete allowlist (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Voor altijd-toestaan-beslissingen in allowlist-modus behouden bekende dispatch-wrappers (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) interne uitvoerbare paden in plaats van wrapperpaden. Als uitpakken niet veilig is, wordt er niet automatisch een allowlist-vermelding opgeslagen.

## Deeplinks

De app registreert het URL-schema `openclaw://` voor lokale acties.

### `openclaw://agent`

Activeert een Gateway-`agent`-verzoek.
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
- Zonder `key` dwingt de app een korte berichtlimiet af voor de bevestigingsprompt en negeert `deliver` / `to` / `channel`.
- Met een geldige `key` wordt de run onbeheerd uitgevoerd (bedoeld voor persoonlijke automatiseringen).

## Onboardingproces (typisch)

1. Installeer en start **OpenClaw.app**.
2. Voltooi de machtigingenchecklist (TCC-prompts).
3. Zorg ervoor dat **Lokale** modus actief is en de Gateway draait.
4. Installeer de CLI als je terminaltoegang wilt.

## Plaatsing van statusmap (macOS)

Plaats je OpenClaw-statusmap niet in iCloud of andere cloudgesynchroniseerde mappen.
Door synchronisatie ondersteunde paden kunnen latentie toevoegen en soms bestandsvergrendelings-/synchronisatieraces veroorzaken voor
sessies en referenties.

Geef de voorkeur aan een lokaal, niet-gesynchroniseerd statuspad zoals:
__OC_I18N_900005__
Als `openclaw doctor` status detecteert onder:

- `~/Library/Mobile Documents/com~apple~CloudDocs/...`
- `~/Library/CloudStorage/...`

wordt een waarschuwing getoond en wordt aanbevolen terug te gaan naar een lokaal pad.

## Bouw- en ontwikkelworkflow (native)

- `cd apps/macos && swift build`
- `swift run OpenClaw` (of Xcode)
- App verpakken: `scripts/package-mac-app.sh`

## Gateway-connectiviteit debuggen (macOS-CLI)

Gebruik de debug-CLI om dezelfde Gateway-WebSocket-handshake en detectie-
logica uit te voeren die de macOS-app gebruikt, zonder de app te starten.
__OC_I18N_900006__
Verbindingsopties:

- `--url <ws://host:port>`: configuratie overschrijven
- `--mode <local|remote>`: oplossen vanuit configuratie (standaard: configuratie of lokaal)
- `--probe`: een nieuwe statusprobe afdwingen
- `--timeout <ms>`: aanvraagtime-out (standaard: `15000`)
- `--json`: gestructureerde uitvoer voor vergelijken

Detectieopties:

- `--include-local`: gateways opnemen die als "lokaal" zouden worden gefilterd
- `--timeout <ms>`: algemeen detectievenster (standaard: `2000`)
- `--json`: gestructureerde uitvoer voor vergelijken

<Tip>
Vergelijk met `openclaw gateway discover --json` om te zien of de detectiepijplijn van de macOS-app (`local.` plus het geconfigureerde wide-area domein, met fallbacks voor wide-area en Tailscale Serve) verschilt van de op `dns-sd` gebaseerde detectie van de Node-CLI.
</Tip>

## Remote verbindingsplumbing (SSH-tunnels)

Wanneer de macOS-app in **Remote** modus draait, opent deze een SSH-tunnel zodat lokale UI-
componenten met een remote Gateway kunnen communiceren alsof die op localhost draait.

### Besturingstunnel (Gateway-WebSocket-poort)

- **Doel:** statuscontroles, status, Web Chat, configuratie en andere control-plane-aanroepen.
- **Lokale poort:** de Gateway-poort (standaard `18789`), altijd stabiel.
- **Remote poort:** dezelfde Gateway-poort op de remote host.
- **Gedrag:** geen willekeurige lokale poort; de app hergebruikt een bestaande gezonde tunnel
  of start deze opnieuw als dat nodig is.
- **SSH-vorm:** `ssh -N -L <local>:127.0.0.1:<remote>` met BatchMode +
  ExitOnForwardFailure + keepalive-opties.
- **IP-rapportage:** de SSH-tunnel gebruikt local loopback, dus de gateway ziet het Node-
  IP als `127.0.0.1`. Gebruik **Direct (ws/wss)** transport als je wilt dat het echte client-
  IP verschijnt (zie [remote toegang voor macOS](/nl/platforms/mac/remote)).

Zie [remote toegang voor macOS](/nl/platforms/mac/remote) voor installatiestappen. Zie [Gateway-protocol](/nl/gateway/protocol) voor protocol-
details.

## Gerelateerde documentatie

- [Gateway-runbook](/nl/gateway)
- [Gateway (macOS)](/nl/platforms/mac/bundled-gateway)
- [macOS-machtigingen](/nl/platforms/mac/permissions)
- [Canvas](/nl/platforms/mac/canvas)
