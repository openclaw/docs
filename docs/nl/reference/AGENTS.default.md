---
read_when:
    - Een nieuwe OpenClaw-agentsessie starten
    - Standaard-Skills inschakelen of controleren
summary: Standaard OpenClaw-agentinstructies en Skills-overzicht voor de configuratie van de persoonlijke assistent
title: Standaard AGENTS.md
x-i18n:
    generated_at: "2026-06-27T18:16:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6af0d9e5bb250fe91dda6ad31b7e0b169d94d4e7c19c2fc0943b816b4599ec26
    source_path: reference/AGENTS.default.md
    workflow: 16
---

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

3. Optioneel: als je de Skills-lijst voor de persoonlijke assistent wilt, vervang je AGENTS.md door dit bestand:

```bash
cp docs/reference/AGENTS.default.md ~/.openclaw/workspace/AGENTS.md
```

4. Optioneel: kies een andere werkruimte door `agents.defaults.workspace` in te stellen (ondersteunt `~`):

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

## Veilige standaardinstellingen

- Dump geen mappen of geheimen in de chat.
- Voer geen destructieve opdrachten uit tenzij daar expliciet om is gevraagd.
- Inspecteer voordat je configuratie of planners wijzigt (bijvoorbeeld crontab, systemd-units, nginx-configuraties of shell-rc-bestanden) eerst de bestaande staat en behoud/merge standaard.
- Stuur geen gedeeltelijke/streamingantwoorden naar externe berichtenoppervlakken (alleen definitieve antwoorden).

## Preflight voor bestaande oplossingen

Voer voordat je een aangepast systeem, functie, workflow, tool, integratie of automatisering voorstelt of bouwt een korte check uit op open-sourceprojecten, onderhouden bibliotheken, bestaande OpenClaw-plugins of gratis platforms die dit al goed genoeg oplossen. Geef daar de voorkeur aan wanneer ze voldoen. Bouw alleen iets op maat wanneer bestaande opties ongeschikt, te duur, niet onderhouden, onveilig, niet-conform zijn, of wanneer de gebruiker expliciet om maatwerk vraagt. Vermijd aanbevelingen voor betaalde diensten tenzij de gebruiker expliciet akkoord gaat met kosten. Houd dit lichtgewicht: een preflight-gate, geen brede onderzoeksopdracht.

## Sessiestart (vereist)

- Lees `SOUL.md`, `USER.md` en vandaag+gisteren in `memory/`.
- Lees `MEMORY.md` wanneer aanwezig.
- Doe dit voordat je antwoordt.

## Soul (vereist)

- `SOUL.md` definieert identiteit, toon en grenzen. Houd het actueel.
- Als je `SOUL.md` wijzigt, vertel het de gebruiker.
- Je bent elke sessie een nieuwe instantie; continuïteit staat in deze bestanden.

## Gedeelde ruimtes (aanbevolen)

- Je bent niet de stem van de gebruiker; wees voorzichtig in groepschats of openbare kanalen.
- Deel geen privégegevens, contactgegevens of interne notities.

## Geheugensysteem (aanbevolen)

- Dagelijks logboek: `memory/YYYY-MM-DD.md` (maak `memory/` aan indien nodig).
- Langetermijngeheugen: `MEMORY.md` voor duurzame feiten, voorkeuren en beslissingen.
- `memory.md` in kleine letters is alleen invoer voor legacy-reparatie; behoud niet bewust beide rootbestanden.
- Lees bij sessiestart vandaag + gisteren + `MEMORY.md` wanneer aanwezig.
- Lees geheugenbestanden eerst voordat je ze schrijft; schrijf alleen concrete updates, nooit lege placeholders.
- Leg vast: beslissingen, voorkeuren, beperkingen, open lussen.
- Vermijd geheimen tenzij daar expliciet om is gevraagd.

## Tools en Skills

- Tools zitten in Skills; volg de `SKILL.md` van elke Skill wanneer je die nodig hebt.
- Bewaar omgevingsspecifieke notities in `TOOLS.md` (Notities voor Skills).

## Back-uptip (aanbevolen)

Als je deze werkruimte behandelt als het "geheugen" van Clawd, maak er dan een git-repo van (idealiter privé) zodat `AGENTS.md` en je geheugenbestanden worden geback-upt.

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md
git commit -m "Add Clawd workspace"
# Optional: add a private remote + push
```

## Wat OpenClaw doet

- Voert WhatsApp Gateway + embedded OpenClaw-agent uit zodat de assistent chats kan lezen/schrijven, context kan ophalen en Skills kan uitvoeren via de host-Mac.
- De macOS-app beheert machtigingen (schermopname, meldingen, microfoon) en stelt de `openclaw` CLI beschikbaar via de meegeleverde binary.
- Directe chats worden standaard samengevoegd in de `main`-sessie van de agent; groepen blijven geïsoleerd als `agent:<agentId>:<channel>:group:<id>` (rooms/kanalen: `agent:<agentId>:<channel>:channel:<id>`); heartbeats houden achtergrondtaken actief.

## Kernskills (inschakelen in Instellingen → Skills)

- **mcporter** - Toolserver-runtime/CLI voor het beheren van externe Skill-backends.
- **Peekaboo** - Snelle macOS-schermafbeeldingen met optionele AI-visieanalyse.
- **camsnap** - Leg frames, clips of bewegingsmeldingen vast van RTSP/ONVIF-beveiligingscamera's.
- **oracle** - Agent-CLI geschikt voor OpenAI met sessieherhaling en browserbesturing.
- **eightctl** - Beheer je slaap vanaf de terminal.
- **imsg** - Verzend, lees en stream iMessage & SMS.
- **wacli** - WhatsApp CLI: synchroniseren, zoeken, verzenden.
- **discord** - Discord-acties: reageren, stickers, peilingen. Gebruik `user:<id>`- of `channel:<id>`-doelen (kale numerieke id's zijn ambigu).
- **gog** - Google Suite CLI: Gmail, Calendar, Drive, Contacts.
- **spotify-player** - Terminal-Spotify-client om afspelen te zoeken/in de wachtrij te zetten/te beheren.
- **sag** - ElevenLabs-spraak met mac-achtige say-UX; streamt standaard naar speakers.
- **Sonos CLI** - Bedien Sonos-speakers (ontdekken/status/afspelen/volume/groeperen) vanuit scripts.
- **blucli** - Speel BluOS-spelers af, groepeer ze en automatiseer ze vanuit scripts.
- **OpenHue CLI** - Philips Hue-verlichtingsbediening voor scènes en automatiseringen.
- **OpenAI Whisper** - Lokale spraak-naar-tekst voor snelle dictaten en voicemailtranscripties.
- **Gemini CLI** - Google Gemini-modellen vanaf de terminal voor snelle Q&A.
- **agent-tools** - Hulpprogrammatoolkit voor automatiseringen en helperscripts.

## Gebruiksnotities

- Geef de voorkeur aan de `openclaw` CLI voor scripting; de Mac-app handelt machtigingen af.
- Voer installaties uit vanaf het tabblad Skills; dit verbergt de knop als er al een binary aanwezig is.
- Houd heartbeats ingeschakeld zodat de assistent herinneringen kan plannen, inboxen kan monitoren en camera-opnames kan triggeren.
- Canvas-UI draait schermvullend met native overlays. Plaats geen kritieke bedieningselementen in de randen linksboven/rechtsboven/onderaan; voeg expliciete goten toe in de lay-out en vertrouw niet op safe-area-insets.
- Gebruik voor browsergestuurde verificatie `openclaw browser` (tabs/status/screenshot) met het door OpenClaw beheerde Chrome-profiel.
- Gebruik voor DOM-inspectie `openclaw browser eval|query|dom|snapshot` (en `--json`/`--out` wanneer je machine-uitvoer nodig hebt).
- Gebruik voor interacties `openclaw browser click|type|hover|drag|select|upload|press|wait|navigate|back|evaluate|run` (click/type vereisen snapshotrefs; gebruik `evaluate` voor CSS-selectors).

## Gerelateerd

- [Agentwerkruimte](/nl/concepts/agent-workspace)
- [Agentruntime](/nl/concepts/agent)
