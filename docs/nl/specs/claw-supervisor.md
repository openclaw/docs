---
read_when:
    - Codex-vloottoezicht ontwerpen
    - OpenClaw-tools bouwen die Codex-sessies lezen, sturen of starten
    - Kiezen tussen lokale, Cloudflare- en VPS-implementatie voor supervised Codex
summary: Fleet-toezichtplan voor Codex app-server-sessies die door OpenClaw worden aangestuurd.
title: Claw-toezichthouder
x-i18n:
    generated_at: "2026-06-27T18:21:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ecdd58730011c94796c6df1d757606aad7112d2f36f30921541ac7f5d46ad91f
    source_path: specs/claw-supervisor.md
    workflow: 16
---

# Claw-supervisor

## Doel

Met Claw-supervisor kan één altijd actieve OpenClaw-instantie een vloot Codex-sessies bewaken en aansturen zonder de normale Codex-gebruikerservaring te wijzigen. Een gebruiker kan via SSH inloggen op een host, Codex starten, in de TUI werken, en de supervisor toch de sessie laten lezen, sturen, onderbreken, gerelateerde sessies laten starten en overdrachten laten accepteren. Codex-sessies kunnen ook via MCP terugbellen naar OpenClaw.

## Productmodel

Codex blijft het primaire werkvlak. OpenClaw superviseert Codex in plaats van Codex te verbergen in een ondoorzichtige OpenClaw-subagent.

De OpenClaw-Plugin heet `codex-supervisor`. `crabfleet` blijft het implementatie-
en hostvlootprofiel voor CRAB-machines in plaats van de herbruikbare Plugin-naam.

Het model heeft drie rollen:

- Door mens gekoppelde Codex: een normale interactieve Codex-TUI die via een gedeelde app-server wordt gestart.
- Autonome Codex: een Codex-app-serverthread die door de supervisor is gestart en waaraan een mens later kan koppelen.
- Supervisor-Claw: een altijd actieve OpenClaw-agent met tools voor vlootstatus, transcriptlezing, sturing, onderbreking, starten en overdracht.

OpenClaw mag intern zijn bestaande subagentmechanisme gebruiken, maar het externe contract is een koppelbare Codex-sessie met een Codex-thread-id.

## Architectuur

```text
user SSH session
  -> codex --remote unix://... or ws://...
      -> local codex app-server daemon
          <-> host sidecar / supervisor connector
              <-> OpenClaw fleet supervisor
                  <-> supervisor MCP exposed back to Codex
```

Elke Codex-capabele host draait:

- Codex-app-serverdaemon.
- Een launcher die interactieve Codex altijd met `--remote` start.
- Een connector die app-serverendpoints en live threads bij de supervisor registreert.

De supervisor draait:

- Endpointregister.
- Sessieregister.
- Codex-app-server JSON-RPC-clientpool.
- MCP-server voor Codex-naar-Claw-aanroepen.
- OpenClaw-tools voor Claw-naar-Codex-besturing.
- Beleidsengine voor autonome acties, goedkeuringen en luspreventie.

## Codex App-Server-contract

Gebruik Codex app-server-API's als canoniek besturingsvlak:

- `initialize`, `initialized`
- `thread/loaded/list`
- `thread/list`
- `thread/read`
- `thread/resume`
- `thread/start`
- `turn/start`
- `turn/steer`
- `turn/interrupt`
- `model/list`

Interactieve Codex moet worden gestart met `codex --remote <endpoint>`, zodat de TUI en supervisor met dezelfde app-server verbinden. Losstaande `codex exec` is vandaag geen live-gedeelde sessie; gebruik app-server-API's voor autonoom werk totdat Codex `exec --remote` ondersteunt.

## Sessieregister

Supervisor bewaart één record per waargenomen Codex-thread:

```json
{
  "sessionId": "codex-thread-id",
  "endpointId": "host-a",
  "host": "host-a.example",
  "workspace": "/workspace/repo",
  "repo": "owner/repo",
  "branch": "feature/example",
  "source": "vscode",
  "status": "idle",
  "humanAttached": true,
  "lastSeenAt": "2026-05-28T10:00:00.000Z",
  "summary": "Short working-state summary"
}
```

De lokale implementatie kan de meeste velden afleiden uit Codex-threadmetadata. Vlootimplementatie moet records verrijken met hostidentiteit, status van gebruikerskoppeling, git-status en gezondheid van de sidecar.

## MCP-oppervlak voor Codex

Elke gesuperviseerde Codex krijgt een MCP-server met de naam `openclaw-codex-supervisor`.

Tools:

- `codex_sessions_list`: lijst zichtbare Codex-sessies.
- `codex_session_read`: lees één transcript.
- `codex_session_send`: stuur een bericht naar een inactieve thread of stuur een actieve thread bij.
- `codex_session_interrupt`: onderbreek de actieve beurt.
- `codex_endpoint_probe`: verifieer endpointconnectiviteit.
- `claw_report_progress`: publiceer de huidige taakstatus naar de supervisor.
- `claw_ask`: vraag de supervisor om hulp of delegatie.
- `codex_spawn`: maak een nieuwe autonome Codex-sessie.
- `codex_handoff`: vraag overname door een mens of peer aan.

Resources:

- `codex://sessions`
- `codex://sessions/{sessionId}`
- `codex://sessions/{sessionId}/transcript`

## Claw-besturingsoppervlak

De altijd actieve Claw krijgt dezelfde primitieven als interne tools:

- sessies en endpoints weergeven
- transcripties lezen
- tekst sturen/bijsturen
- actief werk onderbreken
- nieuwe sessies starten
- sessies samenvatten en toewijzen
- instructies uitzenden naar een gefilterde groep
- sessies markeren als geblokkeerd, klaar of verlaten

Toolgedrag:

- Als een doelthread inactief is, wordt `codex_session_send` gekoppeld aan `turn/start`.
- Als een doelthread actief is en een lopende beurt-id zichtbaar is, wordt deze gekoppeld aan `turn/steer`.
- Als de actieve beurt niet kan worden geïdentificeerd, faalt de tool gesloten in plaats van een ongerelateerde beurt te maken.
- Door Codex blootgestelde MCP-schrijfbewerkingen blijven uitgeschakeld tenzij een vertrouwd alleen-supervisorbeleid ze inschakelt.
- Ruwe transcriptlezingen blijven uitgeschakeld tenzij een vertrouwd alleen-supervisorbeleid ze inschakelt.
- Autonome goedkeuring weigert standaard tool-/bestandgoedkeuringen tenzij een expliciet beleid iets anders zegt.

## Startflow

Interactieve hostlogin:

1. Gebruiker SSH't naar een CRAB-host.
2. SSH-service start of verifieert `codex app-server daemon start`.
3. Loginwrapper start `codex --remote unix:// --cd <workspace>`.
4. Hostconnector registreert endpoint en geladen thread.
5. Supervisor verstuurt een vlootevent met hoge prioriteit: nieuwe Codex-sessie, workspace, door mens gekoppelde status, huidige taakpreview.
6. Supervisor-Claw kan direct lezen en sturen.

Autonoom starten:

1. Supervisor selecteert host en workspace.
2. Hostconnector opent of hervat een Codex-app-serverthread.
3. Supervisor start de eerste beurt met taaktekst en MCP-configuratie.
4. Sessieregister markeert deze als autonoom en koppelbaar.
5. Een mens kan later koppelen met `codex --remote <endpoint> resume <threadId>` zodra Codex die exacte UX ondersteunt, of via de huidige hervattingsflow op dezelfde app-server.

## Implementatie

Voorkeursbesturingsvlak:

- Hostconnectors houden uitgaande WebSocket-verbindingen met de supervisor open.
- Supervisorstatus leeft in OpenClaw Gateway-opslag.
- Codex-app-server blijft lokaal op elke host; stel nooit een ruwe niet-geauthenticeerde app-server bloot aan het openbare internet.

Haalbaarheid van Cloudflare:

- Goed voor register, durable objects, WebSocket-fan-in, lichtgewicht eventroutering en openbare MCP-/gatewayendpoints.
- Op zichzelf niet genoeg voor directe private hostbesturing, omdat Workers geen willekeurige private Unix-sockets of local loopback-app-servers kunnen bellen.
- Gebruik Cloudflare wanneer elke hostconnector via uitgaande WebSocket naar huis belt.

VPS-terugval:

- Gebruik een Hetzner-service wanneer langdurige procesbesturing, SSH-tunnels, private netwerkrouting of lokale bestandssysteemtoegang nodig is.
- Houd hetzelfde protocol: hostconnectors uitgaand, supervisorregister centraal, Codex-app-server lokaal.

## Beveiliging

- Standaardbinding is lokale Unix-socket.
- Externe app-server gebruikt token- of ondertekende bearer-authenticatie.
- Hostconnector authenticeert bij supervisor met een scoped hosttoken.
- Supervisortools dwingen beleid per sessie af: lezen, sturen, onderbreken, starten, goedkeuring.
- Cross-agentberichten bevatten `originSessionId`; zelf-echo wordt gedropt.
- Uitzenden vereist een expliciet filter en begrensd aantal doelen.
- Transcriptlezingen redigeren geheimen bij de OpenClaw-grens.
- Goedkeuringsaanvragen worden standaard geweigerd voor door supervisor geïnitieerde beurten, tenzij beleid ze toestaat.

## Implementatieplan

Fase 1: Lokale supervisor-MVP

- Voeg Codex-app-server JSON-RPC-client toe voor stdio-proxy en WebSocket-endpoints.
- Voeg supervisorendpoint-/sessieregister toe.
- Voeg MCP-tools toe: lijst, lezen, sturen, onderbreken, testen.
- Voeg lokale env-configuratie voor endpoints toe.
- Voeg nep-app-servertests en één live lokale app-server-smoke toe.

Fase 2: OpenClaw-integratie

- Registreer supervisortools in de `codex-supervisor`-Plugin.
- Injecteer supervisor-MCP in Codex-threadconfiguratie.
- Voeg sessiesamenvattingen toe aan agentcontext.
- Voeg eventmeldingen toe wanneer nieuwe Codex-threads verschijnen.
- Voeg beleidsconfiguratie toe voor autonoom sturen/onderbreken/starten.

Fase 3: Vlootconnector

- Host-sidecar registreert app-serverendpoint, hostmetadata, git-/workspacemetadata en status van menselijke koppeling.
- Voeg uitgaande WebSocket-connector toe voor Cloudflare- of VPS-besturingsvlak.
- Voeg opnieuw verbinden, Heartbeat en opschoning van verouderde sessies toe.
- Voeg CRAB SSH-launcherwrapper toe.

Fase 4: Autonome werking

- Voeg flows toe voor starten/hervatten/overnemen.
- Voeg uitzending en delegatie toe.
- Voeg voortgangsrapportages en taakstatussamenvattingen toe.
- Voeg luspreventie en snelheidslimieten toe.
- Voeg dashboardweergaven toe.

Fase 5: Multi-Claw

- Shard sessies per groep.
- Voeg leiderschap/lease toe voor elke sessie.
- Voeg auditlog en replay toe.
- Voeg escalatie tussen Claw-groepen toe.

## Acceptatietests

- Een mens start Codex-TUI via een gedeelde app-server.
- Supervisor toont de live thread via `thread/loaded/list`.
- Supervisor leest transcript via `thread/read`.
- Supervisor stuurt tekst naar een inactieve thread via `turn/start`.
- Supervisor stuurt een actieve thread bij via `turn/steer`.
- Supervisoronderbreking stopt een actieve beurt via `turn/interrupt`.
- Codex roept supervisor-MCP aan en toont peer-sessies.
- Een autonome Codex wordt gestart en later door een mens gekoppeld.
- Verloren hostconnector markeert sessies als verouderd zonder geschiedenis te verwijderen.

## Open vragen

- Exacte Codex-TUI-koppelings-UX voor een app-serverthread die zonder TUI is gestart.
- Of Codex `exec --remote` moet toevoegen voor headless live-gedeelde runs.
- Eigenaar van duurzame status: OpenClaw Gateway-DB, Cloudflare Durable Object of VPS-database.
- Granulariteit van goedkeuringsbeleid voor door supervisor geïnitieerde beurten.
- Hoeveel transcriptsamenvatting in de altijd actieve Claw-context moet worden geïnjecteerd versus als tool/resource bewaard.
