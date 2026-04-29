---
read_when:
    - Je wilt één agentbeurt vanuit scripts uitvoeren (optioneel een antwoord afleveren)
summary: CLI-referentie voor `openclaw agent` (één agentbeurt verzenden via de Gateway)
title: Agent
x-i18n:
    generated_at: "2026-04-29T22:29:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: b77668949040933c5281f2f183e48cc2593d09252470483b9ae38dcffd13d071
    source_path: cli/agent.md
    workflow: 16
---

# `openclaw agent`

Voer een agentbeurt uit via de Gateway (gebruik `--local` voor ingebed).
Gebruik `--agent <id>` om direct een geconfigureerde agent te targeten.

Geef ten minste één sessieselector door:

- `--to <dest>`
- `--session-id <id>`
- `--agent <id>`

Gerelateerd:

- Agent-verzendtool: [Agent verzenden](/nl/tools/agent-send)

## Opties

- `-m, --message <text>`: vereiste berichttekst
- `-t, --to <dest>`: ontvanger die wordt gebruikt om de sessiesleutel af te leiden
- `--session-id <id>`: expliciete sessie-id
- `--agent <id>`: agent-id; overschrijft routeringskoppelingen
- `--model <id>`: modeloverschrijving voor deze run (`provider/model` of model-id)
- `--thinking <level>`: denkniveau van agent (`off`, `minimal`, `low`, `medium`, `high`, plus door providers ondersteunde aangepaste niveaus zoals `xhigh`, `adaptive` of `max`)
- `--verbose <on|off>`: uitgebreid niveau voor de sessie behouden
- `--channel <channel>`: afleverkanaal; laat weg om het hoofdsessiekanaal te gebruiken
- `--reply-to <target>`: overschrijving van afleverdoel
- `--reply-channel <channel>`: overschrijving van afleverkanaal
- `--reply-account <id>`: overschrijving van afleveraccount
- `--local`: voer de ingebedde agent direct uit (na vooraf laden van het Plugin-register)
- `--deliver`: stuur het antwoord terug naar het geselecteerde kanaal/doel
- `--timeout <seconds>`: overschrijf agenttime-out (standaard 600 of configuratiewaarde)
- `--json`: JSON uitvoeren

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

- Gateway-modus valt terug op de ingebedde agent wanneer de Gateway-aanvraag mislukt. Gebruik `--local` om ingebedde uitvoering vooraf af te dwingen.
- `--local` laadt nog steeds eerst het Plugin-register vooraf, zodat door Plugins geleverde providers, tools en kanalen beschikbaar blijven tijdens ingebedde runs.
- `--local` en ingebedde fallback-runs worden behandeld als eenmalige runs. Gebundelde MCP-loopbackresources en warme Claude-stdio-sessies die voor dat lokale proces zijn geopend, worden na het antwoord beëindigd, zodat gescripte aanroepen lokale childprocessen niet actief houden.
- Door Gateway ondersteunde runs laten Gateway-eigen MCP-loopbackresources onder het actieve Gateway-proces staan; oudere clients kunnen nog steeds de historische opruimvlag sturen, maar de Gateway accepteert die als een compatibiliteits-no-op.
- `--channel`, `--reply-channel` en `--reply-account` beïnvloeden antwoordaflevering, niet sessieroutering.
- `--json` houdt stdout gereserveerd voor de JSON-respons. Gateway-, Plugin- en ingebedde-fallbackdiagnostiek wordt naar stderr gerouteerd, zodat scripts stdout direct kunnen parsen.
- JSON van ingebedde fallback bevat `meta.transport: "embedded"` en `meta.fallbackFrom: "gateway"`, zodat scripts fallback-runs kunnen onderscheiden van Gateway-runs.
- Als de Gateway een agentrun accepteert maar de CLI een time-out krijgt tijdens het wachten op het definitieve antwoord, gebruikt ingebedde fallback een nieuwe expliciete `gateway-fallback-*` sessie-/run-id en rapporteert `meta.fallbackReason: "gateway_timeout"` plus de fallback-sessievelden. Dit voorkomt een race met de Gateway-eigen transcriptvergrendeling of het stilzwijgend vervangen van de oorspronkelijke gerouteerde gesprekssessie.
- Wanneer deze opdracht `models.json`-regeneratie activeert, worden door SecretRef beheerde providerreferenties opgeslagen als niet-geheime markers (bijvoorbeeld env-var-namen, `secretref-env:ENV_VAR_NAME` of `secretref-managed`), niet als opgeloste geheime platte tekst.
- Markerwrites zijn bron-autoritatief: OpenClaw behoudt markers uit de actieve bronconfiguratiesnapshot, niet uit opgeloste runtime-geheimwaarden.

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Agentruntime](/nl/concepts/agent)
