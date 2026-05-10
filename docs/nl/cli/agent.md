---
read_when:
    - Je wilt één agentbeurt uitvoeren vanuit scripts (optioneel een antwoord afleveren)
summary: CLI-referentie voor `openclaw agent` (één agentbeurt verzenden via de Gateway)
title: Agent
x-i18n:
    generated_at: "2026-05-10T19:27:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: ae5c2f895cadf70a6253e49a3c7c698a04840a24231076cf8ef5bab340162f52
    source_path: cli/agent.md
    workflow: 16
---

# `openclaw agent`

Voer een agent-turn uit via de Gateway (gebruik `--local` voor ingebed).
Gebruik `--agent <id>` om direct een geconfigureerde agent te targeten.

Geef ten minste één sessieselector door:

- `--to <dest>`
- `--session-id <id>`
- `--agent <id>`

Gerelateerd:

- Agent-verzendtool: [Agent verzenden](/nl/tools/agent-send)

## Opties

- `-m, --message <text>`: vereiste berichtinhoud
- `-t, --to <dest>`: ontvanger die wordt gebruikt om de sessiesleutel af te leiden
- `--session-id <id>`: expliciete sessie-id
- `--agent <id>`: agent-id; overschrijft routeringsbindings
- `--model <id>`: modeloverschrijving voor deze run (`provider/model` of model-id)
- `--thinking <level>`: denkniveau van de agent (`off`, `minimal`, `low`, `medium`, `high`, plus door providers ondersteunde aangepaste niveaus zoals `xhigh`, `adaptive` of `max`)
- `--verbose <on|off>`: behoud uitgebreidheidsniveau voor de sessie
- `--channel <channel>`: afleverkanaal; laat weg om het hoofdkanaal van de sessie te gebruiken
- `--reply-to <target>`: overschrijving van afleverdoel
- `--reply-channel <channel>`: overschrijving van afleverkanaal
- `--reply-account <id>`: overschrijving van afleveraccount
- `--local`: voer de ingebedde agent direct uit (na preload van het pluginregister)
- `--deliver`: stuur het antwoord terug naar het geselecteerde kanaal/doel
- `--timeout <seconds>`: overschrijf de agent-time-out (standaard 600 of configuratiewaarde)
- `--json`: voer JSON uit

## Voorbeelden

```bash
openclaw agent --to +15555550123 --message "status update" --deliver
openclaw agent --agent ops --message "Summarize logs"
openclaw agent --agent ops --model openai/gpt-5.4 --message "Summarize logs"
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json
openclaw agent --agent ops --message "Generate report" --deliver --reply-channel slack --reply-to "#reports"
openclaw agent --agent ops --message "Run locally" --local
```

## Notities

- Gateway-modus valt terug op de ingebedde agent wanneer de Gateway-aanvraag mislukt. Gebruik `--local` om ingebedde uitvoering direct af te dwingen.
- `--local` laadt nog steeds eerst het pluginregister vooraf, zodat door plugins geleverde providers, tools en kanalen beschikbaar blijven tijdens ingebedde runs.
- `--local` en ingebedde fallback-runs worden behandeld als eenmalige runs. Gebundelde MCP-loopbackbronnen en warme Claude-stdio-sessies die voor dat lokale proces zijn geopend, worden na het antwoord opgeruimd, zodat gescripte aanroepen lokale kindprocessen niet actief houden.
- Door de Gateway ondersteunde runs laten MCP-loopbackbronnen die eigendom zijn van de Gateway onder het draaiende Gateway-proces staan; oudere clients kunnen nog steeds de historische opschoonvlag verzenden, maar de Gateway accepteert die als een compatibiliteits-no-op.
- `--channel`, `--reply-channel` en `--reply-account` beïnvloeden antwoordaflevering, niet sessieroutering.
- `--json` houdt stdout gereserveerd voor de JSON-respons. Gateway-, plugin- en ingebedde-fallbackdiagnostiek worden naar stderr gerouteerd, zodat scripts stdout direct kunnen parsen.
- Ingebedde-fallback-JSON bevat `meta.transport: "embedded"` en `meta.fallbackFrom: "gateway"`, zodat scripts fallback-runs kunnen onderscheiden van Gateway-runs.
- Als de Gateway een agent-run accepteert maar de CLI een time-out krijgt tijdens het wachten op het uiteindelijke antwoord, gebruikt ingebedde fallback een nieuwe expliciete `gateway-fallback-*`-sessie-/run-id en rapporteert `meta.fallbackReason: "gateway_timeout"` plus de fallback-sessievelden. Dit voorkomt een race met de transcriptvergrendeling die eigendom is van de Gateway, of het stilzwijgend vervangen van de oorspronkelijke gerouteerde conversatiesessie.
- Wanneer deze opdracht regeneratie van `models.json` triggert, worden door SecretRef beheerde providerreferenties bewaard als niet-geheime markers (bijvoorbeeld namen van omgevingsvariabelen, `secretref-env:ENV_VAR_NAME` of `secretref-managed`), niet als opgeloste geheime platte tekst.
- Marker-schrijfacties zijn bron-autoritair: OpenClaw bewaart markers uit de actieve bronconfiguratiesnapshot, niet uit opgeloste runtime-geheimwaarden.

## JSON-afleverstatus

Wanneer `--json --deliver` wordt gebruikt, kan de CLI-JSON-respons `deliveryStatus` op topniveau bevatten, zodat scripts onderscheid kunnen maken tussen afgeleverde, onderdrukte, gedeeltelijke en mislukte verzendingen:

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

`deliveryStatus.status` is een van `sent`, `suppressed`, `partial_failed` of `failed`. `suppressed` betekent dat aflevering opzettelijk niet is verzonden, bijvoorbeeld omdat een berichtverzendhook deze heeft geannuleerd of omdat er geen zichtbaar resultaat was; het is nog steeds een terminale uitkomst zonder retry. `partial_failed` betekent dat ten minste één payload is verzonden voordat een latere payload mislukte. `failed` betekent dat er geen duurzame verzending is voltooid of dat de afleverpreflight is mislukt.

Door de Gateway ondersteunde CLI-responsen behouden ook de ruwe Gateway-resultaatvorm, waarbij hetzelfde object beschikbaar is op `result.deliveryStatus`.

Veelvoorkomende velden:

- `requested`: altijd `true` wanneer het object aanwezig is.
- `attempted`: `true` nadat het duurzame verzendpad is uitgevoerd; `false` voor preflightfouten of geen zichtbare payloads.
- `succeeded`: `true`, `false` of `"partial"`; `"partial"` hoort bij `status: "partial_failed"`.
- `reason`: een lowercase snake-case reden uit duurzame aflevering of preflightvalidatie. Bekende redenen zijn onder meer `cancelled_by_message_sending_hook`, `no_visible_payload`, `no_visible_result`, `channel_resolved_to_internal`, `unknown_channel`, `invalid_delivery_target` en `no_delivery_target`; mislukte duurzame verzendingen kunnen ook de mislukte fase rapporteren. Behandel onbekende waarden als ondoorzichtig omdat de set kan uitbreiden.
- `resultCount`: aantal resultaten van kanaalverzendingen wanneer beschikbaar.
- `sentBeforeError`: `true` wanneer een gedeeltelijke fout ten minste één payload vóór de fout heeft verzonden.
- `error`: boolean `true` voor mislukte of gedeeltelijk mislukte verzendingen.
- `errorMessage`: alleen opgenomen wanneer een onderliggende afleverfoutmelding wordt vastgelegd. Preflightfouten bevatten `error` en `reason`, maar geen `errorMessage`.
- `payloadOutcomes`: optionele resultaten per payload met `index`, `status`, `reason`, `resultCount`, `error`, `stage`, `sentBeforeError` of hookmetadata wanneer beschikbaar.

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Agent-runtime](/nl/concepts/agent)
