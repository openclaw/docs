---
read_when:
    - Je wilt vanuit scripts één agentbeurt uitvoeren (en eventueel het antwoord afleveren)
summary: CLI-referentie voor `openclaw agent` (één agentbeurt verzenden via de Gateway)
title: Agent
x-i18n:
    generated_at: "2026-07-12T08:43:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2e137c037a2fa58ac6534adbf1603218fc695e4c61e6c3118ce2c4ec6f1f2143
    source_path: cli/agent.md
    workflow: 16
---

# `openclaw agent`

Voer één agentbeurt uit via de Gateway. Valt terug op de ingebedde agent als de Gateway-aanvraag mislukt; geef `--local` door om direct ingebedde uitvoering af te dwingen.

Geef ten minste één sessieselector door: `--to`, `--session-key`, `--session-id` of `--agent`.

Zie ook: [Verzendtool voor agents](/nl/tools/agent-send)

## Opties

- `-m, --message <text>`: berichtinhoud
- `--message-file <path>`: lees de berichtinhoud uit een UTF-8-bestand
- `-t, --to <dest>`: ontvanger die wordt gebruikt om de sessiesleutel af te leiden
- `--session-key <key>`: expliciete sessiesleutel voor routering
- `--session-id <id>`: expliciete sessie-id
- `--agent <id>`: agent-id; overschrijft routeringskoppelingen
- `--model <id>`: modeloverschrijving voor deze uitvoering (`provider/model` of model-id)
- `--thinking <level>`: denkniveau van de agent (`off`, `minimal`, `low`, `medium`, `high`, plus door de provider ondersteunde aangepaste niveaus zoals `xhigh`, `adaptive` of `max`)
- `--verbose <on|off>`: uitgebreidheidsniveau voor de sessie opslaan
- `--channel <channel>`: afleveringskanaal; laat weg om het hoofdkanaal van de sessie te gebruiken
- `--reply-to <target>`: overschrijving van het afleveringsdoel
- `--reply-channel <channel>`: overschrijving van het afleveringskanaal
- `--reply-account <id>`: overschrijving van het afleveringsaccount
- `--local`: voer de ingebedde agent rechtstreeks uit (nadat het pluginregister vooraf is geladen)
- `--deliver`: stuur het antwoord terug naar het geselecteerde kanaal/doel
- `--timeout <seconds>`: overschrijf de time-out van de agent (standaard 600, of `agents.defaults.timeoutSeconds`); `0` schakelt de time-out uit
- `--json`: voer JSON uit

## Voorbeelden

```bash
openclaw agent --to +15555550123 --message "status update" --deliver
openclaw agent --agent ops --message "Summarize logs"
openclaw agent --agent ops --message-file ./task.md
openclaw agent --agent ops --model openai/gpt-5.4 --message "Summarize logs"
openclaw agent --session-key agent:ops:incident-42 --message "Summarize status"
openclaw agent --agent ops --session-key incident-42 --message "Summarize status"
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json
openclaw agent --agent ops --message "Generate report" --deliver --reply-channel slack --reply-to "#reports"
openclaw agent --agent ops --message "Run locally" --local
```

## Opmerkingen

- Geef precies één van `--message` of `--message-file` door. `--message-file` verwijdert een voorafgaande UTF-8-BOM en behoudt inhoud met meerdere regels; bestanden die geen geldige UTF-8 bevatten, worden geweigerd.
- Slash-opdrachten (bijvoorbeeld `/compact`) kunnen niet via `--message` worden uitgevoerd. De CLI weigert ze en verwijst in plaats daarvan naar de specifieke opdracht (`openclaw sessions compact <key>` voor Compaction).
- Uitvoeringen met `--local` en ingebedde terugval zijn eenmalig: gebundelde MCP-loopbackbronnen en warme Claude-stdio-sessies die voor de uitvoering zijn geopend, worden na het antwoord beëindigd, zodat gescripte aanroepen geen lokale onderliggende processen actief laten. Uitvoeringen via de Gateway houden MCP-loopbackbronnen die eigendom zijn van de Gateway onder het actieve Gateway-proces.
- Wanneer `--agent`, `--channel` en `--to` samen worden gebruikt, volgt de sessieroutering de canonieke ontvanger van het kanaal en `session.dmScope`. Kanalen met een stabiele ontvangersidentiteit die uitsluitend voor uitgaande berichten wordt gebruikt, gebruiken een providersessie die is geïsoleerd van de hoofdsessie van de agent. `--reply-channel` en `--reply-account` zijn alleen van invloed op de aflevering.
- `--session-key` selecteert een expliciete sessiesleutel. Sleutels met een agentvoorvoegsel moeten `agent:<agent-id>:<session-key>` gebruiken en `--agent` moet overeenkomen met de agent-id van de sleutel wanneer beide zijn opgegeven. Kale sleutels die geen sentinel zijn, worden gekoppeld aan `--agent` wanneer deze is opgegeven, of anders aan de geconfigureerde standaardagent; `--agent ops --session-key incident-42` routeert bijvoorbeeld naar `agent:ops:incident-42`. De letterlijke sleutels `global` en `unknown` blijven alleen buiten een bereik wanneer geen `--agent` is opgegeven.
- `--json` reserveert stdout voor het JSON-antwoord; diagnostiek van de Gateway, plugins en ingebedde terugval gaat naar stderr, zodat scripts stdout rechtstreeks kunnen parseren.
- JSON van ingebedde terugval bevat `meta.transport: "embedded"` en `meta.fallbackFrom: "gateway"`, zodat scripts een terugvaluitvoering kunnen detecteren.
- Als de Gateway een uitvoering accepteert maar de CLI tijdens het wachten op het definitieve antwoord een time-out bereikt, gebruikt de ingebedde terugval een nieuwe sessie-/uitvoerings-id met `gateway-fallback-*` en rapporteert deze `meta.fallbackReason: "gateway_timeout"` plus de sessievelden van de terugval, in plaats van te concurreren met het transcript dat eigendom is van de Gateway of de oorspronkelijke sessie stilzwijgend te vervangen.
- `SIGTERM`/`SIGINT` onderbreken een wachtende aanvraag via de Gateway; als de Gateway de uitvoering al heeft geaccepteerd, verzendt de CLI vóór het afsluiten ook `chat.abort` voor die uitvoerings-id. Uitvoeringen met `--local` en ingebedde terugval ontvangen hetzelfde signaal, maar verzenden geen `chat.abort`. Als de interne sleutel voor het ontdubbelen van uitvoeringen al een actieve uitvoering voor deze sessie heeft, rapporteert het antwoord `status: "in_flight"` en drukt de CLI zonder JSON een diagnostisch bericht af naar stderr in plaats van een leeg antwoord. Houd voor externe Cron-/systemd-wrappers een harde beëindigingsoptie aan, zoals `timeout -k 60 600 openclaw agent ...`, zodat het beheerproces het proces kan opruimen als het afsluiten niet kan worden voltooid.
- Wanneer deze opdracht het opnieuw genereren van `models.json` activeert, worden door SecretRef beheerde providerreferenties opgeslagen als niet-geheime markeringen (bijvoorbeeld namen van omgevingsvariabelen, `secretref-env:ENV_VAR_NAME` of `secretref-managed`), nooit als ontsleutelde geheime platte tekst. Markeringen worden geschreven vanuit de actieve momentopname van de bronconfiguratie, niet vanuit ontsleutelde geheime runtimewaarden.

## JSON-afleveringsstatus

Met `--json --deliver` bevat het JSON-antwoord van de CLI het veld `deliveryStatus` op het hoogste niveau, zodat scripts onderscheid kunnen maken tussen afgeleverde, onderdrukte, gedeeltelijke en mislukte verzendingen:

```json
{
  "payloads": [{ "text": "Report ready", "mediaUrl": null }],
  "meta": { "durationMs": 1200 },
  "deliveryStatus": {
    "requested": true,
    "attempted": true,
    "status": "sent",
    "succeeded": true,
    "resultCount": 1
  }
}
```

CLI-antwoorden via de Gateway behouden ook de onbewerkte resultaatstructuur van de Gateway in `result.deliveryStatus`.

`deliveryStatus.status` is een van de volgende waarden:

| Status           | Betekenis                                                                                                                                                        |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sent`           | De aflevering is voltooid.                                                                                                                                        |
| `suppressed`     | De aflevering is bewust niet verzonden (bijvoorbeeld omdat een hook voor het verzenden van berichten deze heeft geannuleerd of omdat er geen zichtbaar resultaat was). Definitief, niet opnieuw proberen. |
| `partial_failed` | Er is ten minste één payload verzonden voordat een latere payload mislukte.                                                                                        |
| `failed`         | Er is geen duurzame verzending voltooid of de voorafgaande afleveringscontrole is mislukt.                                                                         |

Veelvoorkomende velden:

- `requested`: altijd `true` wanneer het object aanwezig is.
- `attempted`: `true` zodra het duurzame verzendpad is uitgevoerd; `false` bij fouten in de voorafgaande controle of wanneer er geen zichtbare payloads zijn.
- `succeeded`: `true`, `false` of `"partial"`; `"partial"` hoort bij `status: "partial_failed"`.
- `reason`: reden in kleine letters en snake_case uit de duurzame aflevering of voorafgaande validatie. Bekende waarden zijn onder meer `cancelled_by_message_sending_hook`, `no_visible_payload`, `no_visible_result`, `channel_resolved_to_internal`, `unknown_channel`, `invalid_delivery_target` en `no_delivery_target`; mislukte duurzame verzendingen kunnen ook de mislukte fase rapporteren. Behandel onbekende waarden als ondoorzichtig, omdat de verzameling kan worden uitgebreid.
- `resultCount`: aantal verzendresultaten van het kanaal, indien beschikbaar.
- `sentBeforeError`: `true` wanneer bij een gedeeltelijke mislukking ten minste één payload is verzonden voordat de fout optrad.
- `error`: `true` voor mislukte of gedeeltelijk mislukte verzendingen.
- `errorMessage`: alleen aanwezig wanneer een onderliggende afleveringsfoutmelding is vastgelegd. Fouten in de voorafgaande controle bevatten `error`/`reason`, maar geen `errorMessage`.
- `payloadOutcomes`: optionele resultaten per payload met `index`, `status`, `reason`, `resultCount`, `error`, `stage`, `sentBeforeError` of hookmetagegevens indien beschikbaar.

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Agentruntime](/nl/concepts/agent)
