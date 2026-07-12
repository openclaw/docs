---
read_when:
    - IPC-contracten of IPC van de menubalk-app bewerken
summary: macOS-IPC-architectuur voor de OpenClaw-app, Gateway-Node-transport en PeekabooBridge
title: macOS-IPC
x-i18n:
    generated_at: "2026-07-12T09:05:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 39e11af2bb9348d1c1f6e4fe6be95e825d23d5c1aa66e32dae713a89afb12b4f
    source_path: platforms/mac/xpc.md
    workflow: 16
---

# OpenClaw macOS-IPC-architectuur

Een lokale Unix-socket verbindt de Node-hostservice met de macOS-app voor uitvoeringsgoedkeuringen en `system.run`. Er bestaat een `openclaw-mac`-debug-CLI (`apps/macos/Sources/OpenClawMacCLI`) voor detectie- en verbindingscontroles; agentacties verlopen nog steeds via de Gateway-WebSocket en `node.invoke`. Het door Node ondersteunde `computer.act`-pad voert ingebedde Peekaboo-automatisering in hetzelfde proces uit; zelfstandige Peekaboo-clients gebruiken PeekabooBridge.

## Doelen

- Eén exemplaar van de GUI-app dat al het werk beheert waarvoor TCC-toegang nodig is (meldingen, schermopname, microfoon, spraak, AppleScript).
- Een beperkt automatiseringsoppervlak: Gateway- en Node-opdrachten, `computer.act` binnen hetzelfde proces, plus PeekabooBridge voor zelfstandige clients voor UI-automatisering.
- Voorspelbare machtigingen: altijd dezelfde ondertekende bundel-ID, gestart door launchd, zodat TCC-toekenningen behouden blijven.

## Werking

### Gateway- en Node-transport

- De app voert de Gateway uit (lokale modus) en maakt er verbinding mee als een Node.
- Agentacties worden uitgevoerd via `node.invoke` (bijvoorbeeld `system.run`, `system.notify`, `canvas.*`).
- Node-opdrachten omvatten `canvas.*`, `camera.snap`, `camera.clip`, `screen.snapshot`, `screen.record`, `computer.act`, `system.run` en `system.notify`.
- De Node rapporteert een `permissions`-toewijzing, zodat agents kunnen zien of toegang tot scherm, camera, microfoon, spraak, automatisering of toegankelijkheid beschikbaar is.

### Node-service en app-IPC

- Een headless Node-hostservice maakt verbinding met de Gateway-WebSocket.
- `system.run`-verzoeken worden via een lokale Unix-socket (`ExecApprovalsSocket.swift`) doorgestuurd naar de macOS-app.
- De app voert de opdracht uit binnen de UI-context, vraagt zo nodig om bevestiging en retourneert de uitvoer.

Diagram (SCI):

```text
Agent -> Gateway -> Node-service (WS)
                      |  IPC (UDS + token + HMAC + TTL)
                      v
                  Mac-app (UI + TCC + system.run)
```

### PeekabooBridge (UI-automatisering)

- De ingebouwde agenttool `computer` gebruikt deze socket **niet**. Een gekoppelde macOS-Node voert `computer.act` uit in het app-proces met ingebedde Peekaboo-services.
- UI-automatisering gebruikt een afzonderlijke UNIX-socket (`~/Library/Application Support/OpenClaw/<socket>`) en het JSON-protocol van PeekabooBridge.
- Voorkeursvolgorde voor hosts (clientzijde): Peekaboo.app -> Claude.app -> OpenClaw.app -> lokale uitvoering.
- Beveiliging: bridgehosts vereisen een TeamID op de toelatingslijst (de meegeleverde `PeekabooBridgeHostCoordinator` staat een vast team plus het eigen ondertekeningsteam van de app toe); een uitsluitend voor DEBUG bestemde uitwijkmogelijkheid voor dezelfde UID wordt beveiligd door `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` (Peekaboo-conventie).
- Zie [Gebruik van PeekabooBridge](/nl/platforms/mac/peekaboo) voor details.

## Operationele processen

- Herstarten/opnieuw bouwen: `scripts/restart-mac.sh` beëindigt bestaande exemplaren, bouwt opnieuw met Swift, verpakt de app opnieuw en start deze opnieuw. Het detecteert automatisch een beschikbare ondertekeningsidentiteit en valt terug op `--no-sign` als er geen wordt gevonden; geef `--sign` door om ondertekening te vereisen (mislukt als er geen sleutel beschikbaar is) of `--no-sign` om het niet-ondertekende pad af te dwingen. `SIGN_IDENTITY` uit de omgeving wordt verwijderd op het ondertekende pad, zodat de eigen automatische identiteitsdetectie van `scripts/codesign-mac-app.sh` het certificaat selecteert.
- Eén exemplaar: de app controleert `NSWorkspace.runningApplications` op een dubbele bundel-ID en sluit af als er meer dan één exemplaar wordt gevonden (`isDuplicateInstance()` in `MenuBar.swift`).

## Opmerkingen over beveiliging

- Vereis bij voorkeur een overeenkomende TeamID voor alle bevoorrechte oppervlakken.
- PeekabooBridge: `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` (alleen DEBUG) kan aanroepers met dezelfde UID toestaan voor lokale ontwikkeling.
- Alle communicatie blijft uitsluitend lokaal; er worden geen netwerksockets beschikbaar gesteld.
- TCC-prompts zijn uitsluitend afkomstig van de GUI-appbundel; houd de ondertekende bundel-ID stabiel tussen nieuwe builds.
- Beveiliging van de socket voor uitvoeringsgoedkeuringen: bestandsmodus `0600`, gedeeld token, controle van de UID van de peer (`getpeereid`), HMAC-SHA256-uitdaging en -antwoord, en een korte TTL voor verzoeken.

## Gerelateerd

- [macOS-app](/nl/platforms/macos)
- [macOS-IPC-stroom (uitvoeringsgoedkeuringen)](/nl/tools/exec-approvals-advanced#macos-ipc-flow)
