---
read_when:
    - Je wilt opgeslagen trans samenvattingen vanuit de terminal lezen
    - Je hebt het pad naar een Markdown-samenvatting van transcripties nodig
    - Je debugt de opslagindeling van de kerntranscripten
summary: CLI-referentie voor `openclaw transcripts` (opgeslagen transcripties weergeven, tonen en lokaliseren)
title: Transcripties-CLI
x-i18n:
    generated_at: "2026-07-12T08:44:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dde02e924339c64cf6acd5c4b6162785dcfccf4a1df2aac0d9d52d5306511579
    source_path: cli/transcripts.md
    workflow: 16
---

# `openclaw transcripts`

Alleen-lezeninspectie voor transcripties die door de agenttool `transcripts` zijn geschreven.
Opname, import en samenvatting worden uitgevoerd via die tool, niet via deze CLI.

Artefacten bevinden zich in de statusmap:

```text
$OPENCLAW_STATE_DIR/transcripts/YYYY-MM-DD/<session>/
  metadata.json
  transcript.jsonl
  summary.json
  summary.md
```

De standaardstatusmap is `~/.openclaw`; overschrijf deze met `OPENCLAW_STATE_DIR`.
De datummap is gebaseerd op de begintijd van de sessie; de sessiemap is
een bestandssysteemveilige slug die is afgeleid van de sessie-id.

## Opdrachten

```bash
openclaw transcripts list
openclaw transcripts show <session>
openclaw transcripts show YYYY-MM-DD/<session>
openclaw transcripts path <session>
openclaw transcripts path YYYY-MM-DD/<session>
openclaw transcripts path <session> --dir
openclaw transcripts path <session> --metadata
openclaw transcripts path <session> --transcript
openclaw transcripts list --json
openclaw transcripts show <session> --json
openclaw transcripts path <session> --json
```

| Opdracht                      | Beschrijving                                           |
| ----------------------------- | ------------------------------------------------------ |
| `list`                        | Opgeslagen sessies weergeven.                          |
| `show <session>`              | De opgeslagen `summary.md` afdrukken.                  |
| `path <session>`              | Het pad naar `summary.md` afdrukken.                   |
| `path <session> --dir`        | De sessiemap afdrukken.                                |
| `path <session> --metadata`   | `metadata.json` afdrukken.                             |
| `path <session> --transcript` | `transcript.jsonl` afdrukken.                          |
| `--json`                      | Machineleesbare uitvoer afdrukken (elke subopdracht).  |

`<session>` accepteert een losse sessie-id of een datumgekwalificeerde selector
(`YYYY-MM-DD/<session>`). Gebruik de gekwalificeerde vorm wanneer dezelfde sessie-id
op meer dan één dag voorkomt, bijvoorbeeld `openclaw transcripts show
2026-05-22/standup`. Standaard bevatten sessie-id's een tijdstempel en een willekeurig
achtervoegsel; geef een sessie alleen een vaste id als die id binnen de dag uniek is.

## Uitvoer

`list` drukt per sessie één door tabs gescheiden regel af: selector, begintijd, titel,
pad naar samenvatting.

```text
2026-05-22/standup  2026-05-22T09:00:00.000Z  Wekelijks werkoverleg  /Users/user/.openclaw/transcripts/2026-05-22/standup/summary.md
```

De selector is de veiligste waarde om terug te geven aan `show` of `path`.

`list --json` retourneert objecten met `sessionId`, `selector`, `date`, `title`,
`startedAt`, `stoppedAt`, `source`, `path`, `summaryPath`, `hasSummary`.

`show --json` retourneert de opgeslagen sessiemetadata, selector, sessiemap,
het pad naar de samenvatting en de Markdown-tekst van de samenvatting.

`path --json` retourneert het geselecteerde pad en of dat bestand bestaat.

## Meerdere sessies per dag

Sessies worden eerst op datum en daarna op sessie-id gegroepeerd. Tien vergaderingen
op één dag worden tien mappen naast elkaar:

```text
~/.openclaw/transcripts/2026-05-22/
  transcript-2026-05-22T09-00-00-000Z-a1b2c3d4/
  transcript-2026-05-22T10-30-00-000Z-b2c3d4e5/
  standup/
```

Gebruik standaard gegenereerde id's voor automatisering. Gebruik alleen een vaste id zoals
`standup` wanneer deze op dezelfde datum niet opnieuw wordt gebruikt.

## Ontbrekende samenvattingen

Live sessies schrijven `summary.md` wanneer de sessie stopt; geïmporteerde transcripties
schrijven dit bestand direct na het importeren. Een sessie kan zonder samenvatting in
`list` verschijnen terwijl de opname nog actief is, als een provider tijdens het stoppen
is mislukt of als metadata is geschreven voordat er uitingen binnenkwamen.

Gebruik `path <session> --transcript` om de onbewerkte alleen-toevoegen-transcriptie te
inspecteren, of voer de actie `summarize` van de tool `transcripts` uit om de
Markdown-samenvatting opnieuw te genereren.

## Configuratie

Opname vereist expliciete inschakeling (live bronnen kunnen deelnemen en vergaderaudio opnemen).
Schakel deze als volgt in:

```json
{
  "transcripts": {
    "enabled": true,
    "maxUtterances": 2000
  }
}
```

- `enabled` (standaard `false`): schakel de tool in.
- `maxUtterances` (standaard `2000`, begrensd op 1-10000): grootte van de uitingenbuffer per
  sessie.

Configureer automatisch startende bronnen met `transcripts.autoStart`. Elke vermelding wordt
ingeschakeld door aanwezig te zijn; laat een vermelding weg om die bron uit te schakelen. `discord-voice`
is de meegeleverde bron met ondersteuning voor automatisch starten en vereist `guildId` en
`channelId`:

```json
{
  "transcripts": {
    "enabled": true,
    "autoStart": [
      {
        "providerId": "discord-voice",
        "guildId": "1234567890",
        "channelId": "2345678901"
      }
    ]
  }
}
```
