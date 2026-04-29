---
read_when:
    - Een nieuwe OpenClaw-agentensessie starten
    - Standaard Skills inschakelen of controleren
summary: Standaard OpenClaw-agentinstructies en Skills-overzicht voor de configuratie van de persoonlijke assistent
title: Standaard AGENTS.md
x-i18n:
    generated_at: "2026-04-29T23:14:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: 839368a09c60ac6b7cd403e6ecd86dd0cafd01de8c8b70a1d919cf7daf6d51af
    source_path: reference/AGENTS.default.md
    workflow: 16
---

# AGENTS.md - OpenClaw Persoonlijke Assistent (standaard)

## Eerste uitvoering (aanbevolen)

OpenClaw gebruikt een speciale werkruimtemap voor de agent. Standaard: `~/.openclaw/workspace` (configureerbaar via `agents.defaults.workspace`).

1. Maak de werkruimte aan (als die nog niet bestaat):

```bash
mkdir -p ~/.openclaw/workspace
```

2. Kopieer de standaard werkruimtesjablonen naar de werkruimte:

```bash
cp docs/reference/templates/AGENTS.md ~/.openclaw/workspace/AGENTS.md
cp docs/reference/templates/SOUL.md ~/.openclaw/workspace/SOUL.md
cp docs/reference/templates/TOOLS.md ~/.openclaw/workspace/TOOLS.md
```

3. Optioneel: als je de Skills-lijst voor de persoonlijke assistent wilt, vervang AGENTS.md door dit bestand:

```bash
cp docs/reference/AGENTS.default.md ~/.openclaw/workspace/AGENTS.md
```

4. Optioneel: kies een andere werkruimte door `agents.defaults.workspace` in te stellen (ondersteunt `~`):

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

## Veiligheidsinstellingen

- Dump geen mappen of geheimen in de chat.
- Voer geen destructieve opdrachten uit tenzij daar expliciet om wordt gevraagd.
- Stuur geen gedeeltelijke/streaming-antwoorden naar externe berichtoppervlakken (alleen definitieve antwoorden).

## Sessiestart (vereist)

- Lees `SOUL.md`, `USER.md` en vandaag+gisteren in `memory/`.
- Lees `MEMORY.md` wanneer aanwezig.
- Doe dit voordat je reageert.

## Ziel (vereist)

- `SOUL.md` definieert identiteit, toon en grenzen. Houd het actueel.
- Als je `SOUL.md` wijzigt, vertel het de gebruiker.
- Je bent elke sessie een nieuwe instantie; continuïteit leeft in deze bestanden.

## Gedeelde ruimtes (aanbevolen)

- Je bent niet de stem van de gebruiker; wees voorzichtig in groepschats of openbare kanalen.
- Deel geen privégegevens, contactgegevens of interne notities.

## Geheugensysteem (aanbevolen)

- Dagelijks logboek: `memory/YYYY-MM-DD.md` (maak `memory/` aan indien nodig).
- Langetermijngeheugen: `MEMORY.md` voor duurzame feiten, voorkeuren en beslissingen.
- Kleine letters `memory.md` is alleen legacy-reparatie-invoer; houd niet bewust beide rootbestanden bij.
- Lees bij sessiestart vandaag + gisteren + `MEMORY.md` wanneer aanwezig.
- Leg vast: beslissingen, voorkeuren, beperkingen, openstaande punten.
- Vermijd geheimen tenzij daar expliciet om wordt gevraagd.

## Tools en Skills

- Tools leven in Skills; volg de `SKILL.md` van elke Skill wanneer je die nodig hebt.
- Bewaar omgevingsspecifieke notities in `TOOLS.md` (Notities voor Skills).

## Back-uptip (aanbevolen)

Als je deze werkruimte behandelt als het “geheugen” van Clawd, maak er dan een git-repo van (idealiter privé), zodat `AGENTS.md` en je geheugenbestanden worden geback-upt.

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md
git commit -m "Add Clawd workspace"
# Optional: add a private remote + push
```

## Wat OpenClaw doet

- Draait WhatsApp Gateway + Pi coding agent zodat de assistent chats kan lezen/schrijven, context kan ophalen en Skills kan uitvoeren via de host-Mac.
- macOS-app beheert machtigingen (schermopname, meldingen, microfoon) en stelt de `openclaw` CLI beschikbaar via de meegeleverde binary.
- Directe chats worden standaard samengevoegd in de `main`-sessie van de agent; groepen blijven geïsoleerd als `agent:<agentId>:<channel>:group:<id>` (rooms/kanalen: `agent:<agentId>:<channel>:channel:<id>`); Heartbeats houden achtergrondtaken actief.

## Core Skills (inschakelen in Instellingen → Skills)

- **mcporter** — Toolserver-runtime/CLI voor het beheren van externe Skill-backends.
- **Peekaboo** — Snelle macOS-screenshots met optionele AI-visieanalyse.
- **camsnap** — Leg frames, clips of bewegingsmeldingen vast van RTSP/ONVIF-beveiligingscamera's.
- **oracle** — OpenAI-ready agent-CLI met sessieherhaling en browserbesturing.
- **eightctl** — Beheer je slaap vanaf de terminal.
- **imsg** — Verstuur, lees en stream iMessage en SMS.
- **wacli** — WhatsApp CLI: synchroniseren, zoeken, verzenden.
- **discord** — Discord-acties: reageren, stickers, polls. Gebruik `user:<id>`- of `channel:<id>`-doelen (losse numerieke id's zijn dubbelzinnig).
- **gog** — Google Suite CLI: Gmail, Agenda, Drive, Contacten.
- **spotify-player** — Terminal-Spotify-client om afspelen te zoeken/wachtrij te beheren/bedienen.
- **sag** — ElevenLabs-spraak met mac-achtige say-UX; streamt standaard naar speakers.
- **Sonos CLI** — Bedien Sonos-speakers (ontdekken/status/afspelen/volume/groepering) vanuit scripts.
- **blucli** — Speel BluOS-spelers af, groepeer ze en automatiseer ze vanuit scripts.
- **OpenHue CLI** — Philips Hue-lichtbediening voor scènes en automatiseringen.
- **OpenAI Whisper** — Lokale spraak-naar-tekst voor snelle dictaten en voicemailtranscripties.
- **Gemini CLI** — Google Gemini-modellen vanaf de terminal voor snelle vraag-en-antwoord.
- **agent-tools** — Hulpprogrammatoolkit voor automatiseringen en helperscripts.

## Gebruiksnotities

- Geef voor scripting de voorkeur aan de `openclaw` CLI; de Mac-app handelt machtigingen af.
- Voer installaties uit vanaf het tabblad Skills; het verbergt de knop als er al een binary aanwezig is.
- Houd Heartbeats ingeschakeld zodat de assistent herinneringen kan plannen, inboxen kan monitoren en camera-opnames kan activeren.
- Canvas-UI draait schermvullend met native overlays. Plaats kritieke bedieningselementen niet in de bovenlinker-/bovenrechter-/onderranden; voeg expliciete gutters toe in de lay-out en vertrouw niet op safe-area-insets.
- Gebruik voor browsergestuurde verificatie `openclaw browser` (tabs/status/screenshot) met het door OpenClaw beheerde Chrome-profiel.
- Gebruik voor DOM-inspectie `openclaw browser eval|query|dom|snapshot` (en `--json`/`--out` wanneer je machine-uitvoer nodig hebt).
- Gebruik voor interacties `openclaw browser click|type|hover|drag|select|upload|press|wait|navigate|back|evaluate|run` (click/type vereisen snapshot-refs; gebruik `evaluate` voor CSS-selectors).

## Gerelateerd

- [Agentwerkruimte](/nl/concepts/agent-workspace)
- [Agentruntime](/nl/concepts/agent)
