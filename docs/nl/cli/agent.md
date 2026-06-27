---
read_when:
    - Je wilt één agentbeurt uitvoeren vanuit scripts (eventueel het antwoord afleveren)
summary: CLI-referentie voor `openclaw agent` (één agentbeurt verzenden via de Gateway)
title: Agent
x-i18n:
    generated_at: "2026-06-27T17:17:58Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: be2aad94ba288d14b4b18086dae54eb10c1cd0a6c7b27a836d07f39200e651d8
    source_path: cli/agent.md
    workflow: 16
---

# `openclaw agent`

Voer een agent-turn uit via de Gateway (gebruik `--local` voor ingebed).
Gebruik `--agent <id>` om direct een geconfigureerde agent te targeten.

Geef ten minste één sessieselector door:

- `--to <dest>`
- `--session-key <key>`
- `--session-id <id>`
- `--agent <id>`

Gerelateerd:

- Agent-verzendtool: [Agent verzenden](/nl/tools/agent-send)

## Opties

- `-m, --message <text>`: berichttekst
- `--message-file <path>`: lees de berichttekst uit een UTF-8-bestand
- `-t, --to <dest>`: ontvanger die wordt gebruikt om de sessiesleutel af te leiden
- `--session-key <key>`: expliciete sessiesleutel om voor routering te gebruiken
- `--session-id <id>`: expliciete sessie-id
- `--agent <id>`: agent-id; overschrijft routeringsbindings
- `--model <id>`: modeloverschrijving voor deze run (`provider/model` of model-id)
- `--thinking <level>`: denkniveau van de agent (`off`, `minimal`, `low`, `medium`, `high`, plus door de provider ondersteunde aangepaste niveaus zoals `xhigh`, `adaptive` of `max`)
- `--verbose <on|off>`: behoud het verbose-niveau voor de sessie
- `--channel <channel>`: bezorgkanaal; laat weg om het hoofdsessiekanaal te gebruiken
- `--reply-to <target>`: overschrijving van bezorgdoel
- `--reply-channel <channel>`: overschrijving van bezorgkanaal
- `--reply-account <id>`: overschrijving van bezorgaccount
- `--local`: voer de ingebedde agent direct uit (na vooraf laden van het pluginregister)
- `--deliver`: stuur het antwoord terug naar het geselecteerde kanaal/doel
- `--timeout <seconds>`: overschrijf de agent-time-out (standaard 600 of configuratiewaarde)
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

- Geef exact één van `--message` of `--message-file` door. `--message-file` behoudt meerregelige bestandsinhoud na het verwijderen van een optionele UTF-8-BOM, en wijst bestanden af die geen geldige UTF-8 zijn.
- Gateway-modus valt terug op de ingebedde agent wanneer het Gateway-verzoek mislukt. Gebruik `--local` om ingebedde uitvoering vooraf af te dwingen.
- `--local` laadt nog steeds eerst het pluginregister vooraf, zodat door plugins geleverde providers, tools en kanalen beschikbaar blijven tijdens ingebedde runs.
- `--local` en ingebedde fallback-runs worden behandeld als eenmalige runs. Gebundelde MCP-loopbackresources en warme Claude-stdio-sessies die voor dat lokale proces zijn geopend, worden na het antwoord beëindigd, zodat scripted aanroepen geen lokale child-processen actief houden.
- Gateway-ondersteunde runs laten MCP-loopbackresources die eigendom zijn van de Gateway onder het draaiende Gateway-proces staan; oudere clients kunnen nog steeds de historische opschoonvlag verzenden, maar de Gateway accepteert die als een compatibele no-op.
- `--channel`, `--reply-channel` en `--reply-account` beïnvloeden antwoordbezorging, niet sessieroutering.
- `--session-key` selecteert een expliciete sessiesleutel. Agent-geprefixt sleutels moeten `agent:<agent-id>:<session-key>` gebruiken, en `--agent` moet overeenkomen met de agent-id van de sleutel wanneer beide worden opgegeven. Kale niet-sentinel-sleutels worden binnen `--agent` gescoped wanneer die is opgegeven, of anders naar de geconfigureerde standaardagent; bijvoorbeeld, `--agent ops --session-key incident-42` routeert naar `agent:ops:incident-42`. Letterlijke `global` en `unknown` blijven alleen ongescoped wanneer geen `--agent` is opgegeven; in dat geval gebruiken ingebedde fallback en store-eigenaarschap de geconfigureerde standaardagent.
- `--json` houdt stdout gereserveerd voor de JSON-respons. Diagnostiek van Gateway, Plugin en ingebedde fallback wordt naar stderr gerouteerd zodat scripts stdout direct kunnen parsen.
- JSON van ingebedde fallback bevat `meta.transport: "embedded"` en `meta.fallbackFrom: "gateway"` zodat scripts fallback-runs kunnen onderscheiden van Gateway-runs.
- Als de Gateway een agent-run accepteert maar de CLI een time-out krijgt tijdens het wachten op het definitieve antwoord, gebruikt ingebedde fallback een nieuwe expliciete `gateway-fallback-*` sessie-/run-id en rapporteert `meta.fallbackReason: "gateway_timeout"` plus de fallback-sessievelden. Dit voorkomt racen met de transcriptlock die eigendom is van de Gateway of het stilzwijgend vervangen van de oorspronkelijke gerouteerde gesprekssessie.
- Voor Gateway-ondersteunde runs onderbreken `SIGTERM` en `SIGINT` het wachtende CLI-verzoek. Als de Gateway de run al heeft geaccepteerd, verzendt de CLI ook `chat.abort` voor die geaccepteerde run-id voordat deze afsluit. Lokale `--local`-runs en ingebedde fallback-runs ontvangen hetzelfde afbreeksignaal, maar verzenden geen `chat.abort`. Als een dubbele `--run-id` de Gateway bereikt terwijl de oorspronkelijke agent-run nog actief is, rapporteert de dubbele respons `status: "in_flight"` en drukt de niet-JSON-CLI een stderr-diagnose af in plaats van een leeg antwoord. Houd voor externe cron/systemd-wrappers een buitenste harde kill-achtervang aan, zoals `timeout -k 60 600 openclaw agent ...`, zodat de supervisor het proces nog steeds kan opruimen als afsluiten niet kan leegstromen.
- Wanneer deze opdracht regeneratie van `models.json` triggert, worden door SecretRef beheerde providerreferenties bewaard als niet-geheime markers (bijvoorbeeld env-var-namen, `secretref-env:ENV_VAR_NAME` of `secretref-managed`), niet als opgeloste geheime plaintext.
- Markerwrites zijn bronautoritair: OpenClaw bewaart markers uit de actieve bronconfiguratiesnapshot, niet uit opgeloste runtimegeheimwaarden.

## JSON-bezorgstatus

Wanneer `--json --deliver` wordt gebruikt, kan de CLI-JSON-respons `deliveryStatus` op topniveau bevatten, zodat scripts onderscheid kunnen maken tussen verzonden, onderdrukte, gedeeltelijke en mislukte verzendingen:

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

`deliveryStatus.status` is één van `sent`, `suppressed`, `partial_failed` of `failed`. `suppressed` betekent dat bezorging opzettelijk niet is verzonden, bijvoorbeeld omdat een hook voor berichtverzending deze heeft geannuleerd of omdat er geen zichtbaar resultaat was; het is nog steeds een terminale uitkomst zonder nieuwe poging. `partial_failed` betekent dat ten minste één payload is verzonden voordat een latere payload mislukte. `failed` betekent dat geen duurzame verzending is voltooid of dat de bezorgpreflight is mislukt.

Gateway-ondersteunde CLI-responsen behouden ook de ruwe Gateway-resultaatvorm, waarbij hetzelfde object beschikbaar is op `result.deliveryStatus`.

Veelvoorkomende velden:

- `requested`: altijd `true` wanneer het object aanwezig is.
- `attempted`: `true` nadat het duurzame verzendpad is uitgevoerd; `false` voor preflightfouten of geen zichtbare payloads.
- `succeeded`: `true`, `false` of `"partial"`; `"partial"` hoort bij `status: "partial_failed"`.
- `reason`: een snake-case-reden in kleine letters uit duurzame bezorging of preflightvalidatie. Bekende redenen zijn `cancelled_by_message_sending_hook`, `no_visible_payload`, `no_visible_result`, `channel_resolved_to_internal`, `unknown_channel`, `invalid_delivery_target` en `no_delivery_target`; mislukte duurzame verzendingen kunnen ook de mislukte fase rapporteren. Behandel onbekende waarden als opaak omdat de set kan uitbreiden.
- `resultCount`: aantal kanaalverzendresultaten wanneer beschikbaar.
- `sentBeforeError`: `true` wanneer een gedeeltelijke fout ten minste één payload vóór de fout heeft verzonden.
- `error`: boolean `true` voor mislukte of gedeeltelijk mislukte verzendingen.
- `errorMessage`: alleen opgenomen wanneer een onderliggend bezorgfoutbericht wordt vastgelegd. Preflightfouten bevatten `error` en `reason`, maar geen `errorMessage`.
- `payloadOutcomes`: optionele resultaten per payload met `index`, `status`, `reason`, `resultCount`, `error`, `stage`, `sentBeforeError` of hookmetadata wanneer beschikbaar.

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Agent-runtime](/nl/concepts/agent)
