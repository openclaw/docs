---
read_when:
    - Een nieuwe assistentinstantie onboarden
    - Veiligheids-/machtigingsimplicaties beoordelen
summary: Handleiding van begin tot eind voor het draaien van OpenClaw als persoonlijke assistent met veiligheidswaarschuwingen
title: Persoonlijke assistent instellen
x-i18n:
    generated_at: "2026-04-29T23:19:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: b0614272f9a2b30e0900c55b39a8bd6a2b71b9f5d5fbf0fe00c534b91193e6a0
    source_path: start/openclaw.md
    workflow: 16
---

# Een persoonlijke assistent bouwen met OpenClaw

OpenClaw is een zelfgehoste Gateway die Discord, Google Chat, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo en meer verbindt met AI-agenten. Deze gids behandelt de installatie voor een "persoonlijke assistent": een speciaal WhatsApp-nummer dat zich gedraagt als je altijd beschikbare AI-assistent.

## ⚠️ Veiligheid eerst

Je plaatst een agent in een positie waarin deze het volgende kan doen:

- opdrachten uitvoeren op je machine (afhankelijk van je toolbeleid)
- bestanden lezen/schrijven in je werkruimte
- berichten terugsturen via WhatsApp/Telegram/Discord/Mattermost en andere meegeleverde kanalen

Begin conservatief:

- Stel altijd `channels.whatsapp.allowFrom` in (draai nooit open voor de hele wereld op je persoonlijke Mac).
- Gebruik een speciaal WhatsApp-nummer voor de assistent.
- Heartbeats staan nu standaard op elke 30 minuten. Schakel dit uit totdat je de installatie vertrouwt door `agents.defaults.heartbeat.every: "0m"` in te stellen.

## Vereisten

- OpenClaw geïnstalleerd en geonboard — zie [Aan de slag](/nl/start/getting-started) als je dit nog niet hebt gedaan
- Een tweede telefoonnummer (SIM/eSIM/prepaid) voor de assistent

## De setup met twee telefoons (aanbevolen)

Dit is wat je wilt:

```mermaid
flowchart TB
    A["<b>Your Phone (personal)<br></b><br>Your WhatsApp<br>+1-555-YOU"] -- message --> B["<b>Second Phone (assistant)<br></b><br>Assistant WA<br>+1-555-ASSIST"]
    B -- linked via QR --> C["<b>Your Mac (openclaw)<br></b><br>AI agent"]
```

Als je je persoonlijke WhatsApp aan OpenClaw koppelt, wordt elk bericht aan jou "agentinvoer". Dat is zelden wat je wilt.

## Snelle start in 5 minuten

1. Koppel WhatsApp Web (toont QR; scan met de assistenttelefoon):

```bash
openclaw channels login
```

2. Start de Gateway (laat deze draaien):

```bash
openclaw gateway --port 18789
```

3. Plaats een minimale configuratie in `~/.openclaw/openclaw.json`:

```json5
{
  gateway: { mode: "local" },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

Stuur nu vanaf je toegestane telefoon een bericht naar het assistentnummer.

Wanneer onboarding is voltooid, opent OpenClaw automatisch het dashboard en print het een schone (niet-getokeniseerde) link. Als het dashboard om auth vraagt, plak je het geconfigureerde gedeelde geheim in de instellingen van de Control UI. Onboarding gebruikt standaard een token (`gateway.auth.token`), maar wachtwoordauthenticatie werkt ook als je `gateway.auth.mode` hebt gewijzigd naar `password`. Later opnieuw openen: `openclaw dashboard`.

## Geef de agent een werkruimte (AGENTS)

OpenClaw leest bedieningsinstructies en "geheugen" uit de werkruimtemap.

Standaard gebruikt OpenClaw `~/.openclaw/workspace` als agentwerkruimte en maakt deze automatisch aan (plus de starterbestanden `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`) tijdens setup/eerste agentrun. `BOOTSTRAP.md` wordt alleen aangemaakt wanneer de werkruimte helemaal nieuw is (het zou niet moeten terugkomen nadat je het verwijdert). `MEMORY.md` is optioneel (wordt niet automatisch aangemaakt); wanneer aanwezig, wordt het geladen voor normale sessies. Subagentsessies injecteren alleen `AGENTS.md` en `TOOLS.md`.

<Tip>
Behandel deze map als het geheugen van OpenClaw en maak er een git-repo van (bij voorkeur privé), zodat je `AGENTS.md` en geheugenbestanden worden geback-upt. Als git is geïnstalleerd, worden volledig nieuwe werkruimtes automatisch geïnitialiseerd.
</Tip>

```bash
openclaw setup
```

Volledige werkruimte-indeling + back-upgids: [Agentwerkruimte](/nl/concepts/agent-workspace)
Geheugenworkflow: [Geheugen](/nl/concepts/memory)

Optioneel: kies een andere werkruimte met `agents.defaults.workspace` (ondersteunt `~`).

```json5
{
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
    },
  },
}
```

Als je al je eigen werkruimtebestanden vanuit een repo levert, kun je het aanmaken van bootstrapbestanden volledig uitschakelen:

```json5
{
  agents: {
    defaults: {
      skipBootstrap: true,
    },
  },
}
```

## De configuratie die er "een assistent" van maakt

OpenClaw gebruikt standaard een goede assistentsetup, maar meestal wil je het volgende afstemmen:

- persona/instructies in [`SOUL.md`](/nl/concepts/soul)
- denkstandaarden (indien gewenst)
- heartbeats (zodra je het vertrouwt)

Voorbeeld:

```json5
{
  logging: { level: "info" },
  agent: {
    model: "anthropic/claude-opus-4-6",
    workspace: "~/.openclaw/workspace",
    thinkingDefault: "high",
    timeoutSeconds: 1800,
    // Start with 0; enable later.
    heartbeat: { every: "0m" },
  },
  channels: {
    whatsapp: {
      allowFrom: ["+15555550123"],
      groups: {
        "*": { requireMention: true },
      },
    },
  },
  routing: {
    groupChat: {
      mentionPatterns: ["@openclaw", "openclaw"],
    },
  },
  session: {
    scope: "per-sender",
    resetTriggers: ["/new", "/reset"],
    reset: {
      mode: "daily",
      atHour: 4,
      idleMinutes: 10080,
    },
  },
}
```

## Sessies en geheugen

- Sessiebestanden: `~/.openclaw/agents/<agentId>/sessions/{{SessionId}}.jsonl`
- Sessiemetadata (tokengebruik, laatste route, enzovoort): `~/.openclaw/agents/<agentId>/sessions/sessions.json` (legacy: `~/.openclaw/sessions/sessions.json`)
- `/new` of `/reset` start een nieuwe sessie voor die chat (configureerbaar via `resetTriggers`). Als dit los wordt verzonden, bevestigt OpenClaw de reset zonder het model aan te roepen.
- `/compact [instructions]` comprimeert de sessiecontext en rapporteert het resterende contextbudget.

## Heartbeats (proactieve modus)

Standaard voert OpenClaw elke 30 minuten een heartbeat uit met de prompt:
`Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
Stel `agents.defaults.heartbeat.every: "0m"` in om uit te schakelen.

- Als `HEARTBEAT.md` bestaat maar effectief leeg is (alleen lege regels en markdownkoppen zoals `# Heading`), slaat OpenClaw de heartbeatrun over om API-calls te besparen.
- Als het bestand ontbreekt, draait de heartbeat nog steeds en beslist het model wat er moet gebeuren.
- Als de agent antwoordt met `HEARTBEAT_OK` (optioneel met korte padding; zie `agents.defaults.heartbeat.ackMaxChars`), onderdrukt OpenClaw uitgaande levering voor die heartbeat.
- Standaard is heartbeatlevering naar DM-achtige `user:<id>`-doelen toegestaan. Stel `agents.defaults.heartbeat.directPolicy: "block"` in om levering aan directe doelen te onderdrukken terwijl heartbeatruns actief blijven.
- Heartbeats voeren volledige agentbeurten uit — kortere intervallen verbruiken meer tokens.

```json5
{
  agent: {
    heartbeat: { every: "30m" },
  },
}
```

## Media in en uit

Binnenkomende bijlagen (afbeeldingen/audio/documenten) kunnen via templates aan je opdracht worden aangeboden:

- `{{MediaPath}}` (lokaal tijdelijk bestandspad)
- `{{MediaUrl}}` (pseudo-URL)
- `{{Transcript}}` (als audiotranscriptie is ingeschakeld)

Uitgaande bijlagen van de agent: neem `MEDIA:<path-or-url>` op een eigen regel op (geen spaties). Voorbeeld:

```
Here’s the screenshot.
MEDIA:https://example.com/screenshot.png
```

OpenClaw extraheert deze en stuurt ze als media mee met de tekst.

Gedrag voor lokale paden volgt hetzelfde vertrouwensmodel voor bestandslezen als de agent:

- Als `tools.fs.workspaceOnly` `true` is, blijven uitgaande lokale `MEDIA:`-paden beperkt tot de tijdelijke root van OpenClaw, de mediacache, agentwerkruimtepaden en door de sandbox gegenereerde bestanden.
- Als `tools.fs.workspaceOnly` `false` is, kan uitgaande `MEDIA:` host-lokale bestanden gebruiken die de agent al mag lezen.
- Host-lokale verzending staat nog steeds alleen media en veilige documenttypen toe (afbeeldingen, audio, video, PDF en Office-documenten). Platte tekst en geheimachtig ogende bestanden worden niet behandeld als verzendbare media.

Dat betekent dat gegenereerde afbeeldingen/bestanden buiten de werkruimte nu kunnen worden verzonden wanneer je fs-beleid die leesacties al toestaat, zonder willekeurige exfiltratie van host-tekstbijlagen opnieuw mogelijk te maken.

## Operationele checklist

```bash
openclaw status          # local status (creds, sessions, queued events)
openclaw status --all    # full diagnosis (read-only, pasteable)
openclaw status --deep   # asks the gateway for a live health probe with channel probes when supported
openclaw health --json   # gateway health snapshot (WS; default can return a fresh cached snapshot)
```

Logs staan onder `/tmp/openclaw/` (standaard: `openclaw-YYYY-MM-DD.log`).

## Volgende stappen

- WebChat: [WebChat](/nl/web/webchat)
- Gateway-beheer: [Gateway-runbook](/nl/gateway)
- Cron + wakeups: [Cron-taken](/nl/automation/cron-jobs)
- macOS-menubalkcompanion: [OpenClaw macOS-app](/nl/platforms/macos)
- iOS-node-app: [iOS-app](/nl/platforms/ios)
- Android-node-app: [Android-app](/nl/platforms/android)
- Windows-status: [Windows (WSL2)](/nl/platforms/windows)
- Linux-status: [Linux-app](/nl/platforms/linux)
- Beveiliging: [Beveiliging](/nl/gateway/security)

## Gerelateerd

- [Aan de slag](/nl/start/getting-started)
- [Setup](/nl/start/setup)
- [Kanalenoverzicht](/nl/channels)
