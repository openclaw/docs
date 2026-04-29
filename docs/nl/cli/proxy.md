---
read_when:
    - Je moet OpenClaw-transportverkeer lokaal vastleggen voor foutopsporing
    - Je wilt debug-proxysessies, blobs of ingebouwde querypresets inspecteren
summary: CLI-referentie voor `openclaw proxy`, de lokale debugproxy en inspecteur voor vastleggingen
title: Proxy
x-i18n:
    generated_at: "2026-04-29T22:34:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7af5c596fb36f67e3fcffaff14dcbb4eabbcff0b95174ac6058a097ec9fd715f
    source_path: cli/proxy.md
    workflow: 16
---

# `openclaw proxy`

Voer de lokale expliciete debugproxy uit en inspecteer vastgelegd verkeer.

Dit is een debugopdracht voor onderzoek op transportniveau. De opdracht kan een
lokale proxy starten, een onderliggende opdracht uitvoeren met vastlegging ingeschakeld, vastlegsessies weergeven,
veelvoorkomende verkeerspatronen bevragen, vastgelegde blobs lezen en lokale vastleggingsgegevens
opschonen.

## Opdrachten

```bash
openclaw proxy start [--host <host>] [--port <port>]
openclaw proxy run [--host <host>] [--port <port>] -- <cmd...>
openclaw proxy coverage
openclaw proxy sessions [--limit <count>]
openclaw proxy query --preset <name> [--session <id>]
openclaw proxy blob --id <blobId>
openclaw proxy purge
```

## Queryvoorinstellingen

`openclaw proxy query --preset <name>` accepteert:

- `double-sends`
- `retry-storms`
- `cache-busting`
- `ws-duplicate-frames`
- `missing-ack`
- `error-bursts`

## Opmerkingen

- `start` gebruikt standaard `127.0.0.1`, tenzij `--host` is ingesteld.
- `run` start een lokale debugproxy en voert daarna de opdracht na `--` uit.
- Vastleggingen zijn lokale debuggegevens; gebruik `openclaw proxy purge` wanneer u klaar bent.

## Gerelateerd

- [CLI-referentie](/nl/cli)
- [Vertrouwde proxy-authenticatie](/nl/gateway/trusted-proxy-auth)
