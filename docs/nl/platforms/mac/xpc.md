---
read_when:
    - IPC-contracten of IPC van de menubalk-app bewerken
summary: macOS IPC-architectuur voor OpenClaw-app, gateway-node-transport en PeekabooBridge
title: macOS-IPC
x-i18n:
    generated_at: "2026-06-28T00:13:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 436ea0a01dc544d246b4f2f506a2950fd05b36a8cf79f6f03cffe2843eef8c0d
    source_path: platforms/mac/xpc.md
    workflow: 16
---

# OpenClaw macOS IPC-architectuur

**Huidig model:** een lokale Unix-socket verbindt de **Node-hostservice** met de **macOS-app** voor uitvoeringsgoedkeuringen + `system.run`. Er bestaat een `openclaw-mac` debug-CLI voor discovery-/verbindingscontroles; agentacties lopen nog steeds via de Gateway WebSocket en `node.invoke`. UI-automatisering gebruikt PeekabooBridge.

## Doelen

- Eén GUI-appinstantie die al het TCC-gerelateerde werk beheert (meldingen, schermopname, microfoon, spraak, AppleScript).
- Een klein oppervlak voor automatisering: Gateway + Node-opdrachten, plus PeekabooBridge voor UI-automatisering.
- Voorspelbare rechten: altijd dezelfde ondertekende bundel-ID, gestart door launchd, zodat TCC-toekenningen behouden blijven.

## Hoe het werkt

### Gateway + Node-transport

- De app draait de Gateway (lokale modus) en verbindt ermee als een Node.
- Agentacties worden uitgevoerd via `node.invoke` (bijv. `system.run`, `system.notify`, `canvas.*`).
- Veelvoorkomende Mac-Node-opdrachten zijn `canvas.*`, `camera.snap`, `camera.clip`,
  `screen.snapshot`, `screen.record`, `system.run` en `system.notify`.
- De Node rapporteert een `permissions`-map zodat agents kunnen zien of toegang tot scherm,
  camera, microfoon, spraak, automatisering of toegankelijkheid beschikbaar is.

### Node-service + app-IPC

- Een headless Node-hostservice maakt verbinding met de Gateway WebSocket.
- `system.run`-aanvragen worden via een lokale Unix-socket doorgestuurd naar de macOS-app.
- De app voert de opdracht uit in UI-context, vraagt zo nodig om toestemming en retourneert uitvoer.

Diagram (SCI):

```
Agent -> Gateway -> Node Service (WS)
                      |  IPC (UDS + token + HMAC + TTL)
                      v
                  Mac App (UI + TCC + system.run)
```

### PeekabooBridge (UI-automatisering)

- UI-automatisering gebruikt een aparte UNIX-socket met de naam `bridge.sock` en het PeekabooBridge JSON-protocol.
- Hostvoorkeursvolgorde (client-side): Peekaboo.app → Claude.app → OpenClaw.app → lokale uitvoering.
- Beveiliging: bridge-hosts vereisen een toegestane TeamID; het DEBUG-only noodpad voor dezelfde UID wordt bewaakt door `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` (Peekaboo-conventie).
- Zie: [PeekabooBridge-gebruik](/nl/platforms/mac/peekaboo) voor details.

## Operationele flows

- Herstarten/opnieuw bouwen: `SIGN_IDENTITY="Apple Development: <Developer Name> (<TEAMID>)" scripts/restart-mac.sh`
  - Beëindigt bestaande instanties
  - Swift-build + pakket
  - Schrijft/bootstrap/kickstart de LaunchAgent
- Eén instantie: de app sluit vroegtijdig af als er al een andere instantie met dezelfde bundel-ID actief is.

## Hardening-opmerkingen

- Geef er de voorkeur aan een TeamID-match te vereisen voor alle bevoorrechte oppervlakken.
- PeekabooBridge: `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` (alleen DEBUG) kan lokale ontwikkelaars met dezelfde UID toestaan.
- Alle communicatie blijft alleen lokaal; er worden geen netwerksockets blootgesteld.
- TCC-prompts komen alleen uit de GUI-appbundel; houd de ondertekende bundel-ID stabiel tussen rebuilds.
- IPC-hardening: socketmodus `0600`, token, peer-UID-controles, HMAC challenge/response, korte TTL.

## Gerelateerd

- [macOS-app](/nl/platforms/macos)
- [macOS IPC-flow (uitvoeringsgoedkeuringen)](/nl/tools/exec-approvals-advanced#macos-ipc-flow)
