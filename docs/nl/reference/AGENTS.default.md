---
read_when:
    - Een nieuwe OpenClaw-agentsessie starten
    - Standaard-Skills inschakelen of controleren
summary: Standaardinstructies voor OpenClaw-agenten en overzicht van Skills voor de configuratie van de persoonlijke assistent
title: Standaard-AGENTS.md
x-i18n:
    generated_at: "2026-07-12T09:22:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 645342f8c6e2805135817cf4bbc2c8bd1d57066054ed671eda93876b2762ffb1
    source_path: reference/AGENTS.default.md
    workflow: 16
---

## Eerste uitvoering (aanbevolen)

OpenClaw-agents gebruiken een werkruimtemap. Standaard: `~/.openclaw/workspace` (configureerbaar via `agents.defaults.workspace`, ondersteunt `~`).

1. Maak de werkruimte:

```bash
mkdir -p ~/.openclaw/workspace
```

2. Kopieer de standaardwerkruimtesjablonen ernaartoe:

```bash
cp docs/reference/templates/AGENTS.md ~/.openclaw/workspace/AGENTS.md
cp docs/reference/templates/SOUL.md ~/.openclaw/workspace/SOUL.md
cp docs/reference/templates/TOOLS.md ~/.openclaw/workspace/TOOLS.md
```

3. Optioneel: gebruik de lijst met persoonlijke-assistent-Skills uit dit bestand in plaats van de algemene sjabloon:

```bash
cp docs/reference/AGENTS.default.md ~/.openclaw/workspace/AGENTS.md
```

4. Optioneel: verwijs naar een andere werkruimte:

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

## Standaardveiligheidsinstellingen

- Dump geen mappen of geheimen in de chat.
- Voer geen destructieve opdrachten uit tenzij daar expliciet om wordt gevraagd.
- Inspecteer eerst de bestaande toestand voordat je configuratie of planners wijzigt (crontab, systemd-eenheden, nginx-configuraties, shell-rc-bestanden) en behoud of voeg deze standaard samen.
- Stuur geen gedeeltelijke of gestreamde antwoorden naar externe berichtenkanalen (alleen definitieve antwoorden).

## Voorcontrole op bestaande oplossingen

Controleer voordat je een aangepast systeem, functie, werkstroom, hulpmiddel, integratie of automatisering voorstelt of bouwt of er opensourceprojecten, onderhouden bibliotheken, bestaande OpenClaw-plugins of gratis platforms zijn die het al goed genoeg oplossen. Geef daaraan de voorkeur wanneer ze voldoen. Bouw alleen iets aangepast wanneer bestaande opties ongeschikt, te duur, niet onderhouden, onveilig of niet-conform zijn, of wanneer de gebruiker expliciet om maatwerk vraagt. Vermijd aanbevelingen voor betaalde diensten tenzij de gebruiker expliciet toestemming geeft voor uitgaven. Houd dit lichtgewicht: een voorcontrole, geen onderzoeksopdracht.

## Sessiestart (vereist)

- Lees `SOUL.md`, `USER.md` en vandaag+gisteren in `memory/` voordat je antwoordt.
- Lees `MEMORY.md` wanneer dit aanwezig is.

## Ziel (vereist)

- `SOUL.md` definieert identiteit, toon en grenzen. Houd het actueel.
- Vertel het de gebruiker als je `SOUL.md` wijzigt.
- Je bent elke sessie een nieuwe instantie; continuïteit bevindt zich in deze bestanden.

## Gedeelde ruimten (aanbevolen)

- Je bent niet de stem van de gebruiker; wees voorzichtig in groepschats of openbare kanalen.
- Deel geen privégegevens, contactgegevens of interne notities.

## Geheugensysteem (aanbevolen)

- Dagelijks logboek: `memory/YYYY-MM-DD.md` (maak indien nodig `memory/`).
- Langetermijngeheugen: `MEMORY.md` voor duurzame feiten, voorkeuren en beslissingen.
- `memory.md` in kleine letters is alleen invoer voor verouderd herstel; bewaar niet opzettelijk beide hoofdbestanden.
- Lees bij het starten van een sessie vandaag + gisteren + `MEMORY.md` wanneer dit aanwezig is.
- Lees geheugenbestanden voordat je erin schrijft; schrijf alleen concrete updates, nooit lege tijdelijke aanduidingen.
- Leg vast: beslissingen, voorkeuren, beperkingen, openstaande zaken.
- Vermijd geheimen tenzij daar expliciet om wordt gevraagd.

## Hulpmiddelen en Skills

- Hulpmiddelen bevinden zich in Skills; volg de `SKILL.md` van elke Skill wanneer je die nodig hebt.
- Bewaar omgevingsspecifieke notities in `TOOLS.md` (notities voor Skills).

## Back-uptip (aanbevolen)

Behandel deze werkruimte als het geheugen van de assistent: maak er een git-repository van (bij voorkeur privé), zodat er een back-up wordt gemaakt van `AGENTS.md` en de geheugenbestanden.

```bash
cd ~/.openclaw/workspace
git init
git add AGENTS.md
git commit -m "Add workspace"
# Optioneel: voeg een privéremote toe en push
```

## Wat OpenClaw doet

- Voert een Gateway voor berichtenkanalen uit (WhatsApp, Telegram, Discord, Signal, iMessage, Slack en meer), plus een ingebouwde agent, zodat de assistent chats kan lezen en schrijven, context kan ophalen en Skills kan uitvoeren via de hostmachine.
- De macOS-app beheert machtigingen (schermopname, meldingen, microfoon) en stelt de `openclaw`-CLI beschikbaar via het meegeleverde binaire bestand.
- Directe chats worden standaard samengevoegd in de `main`-sessie van de agent; groepen en kanalen/ruimten krijgen hun eigen sessiesleutels. Zie [Kanaalroutering](/nl/channels/channel-routing) voor de exacte sleutelindelingen. Heartbeats houden achtergrondtaken actief.

## Kern-Skills (inschakelen via Settings → Skills)

Voorbeeldlijst voor een werkruimte voor een persoonlijke assistent; vervang Skills door de Skills die bij je configuratie passen.

- **mcporter** - runtime/CLI voor hulpmiddelservers om externe Skill-backends te beheren.
- **Peekaboo** - snelle macOS-schermafbeeldingen met optionele AI-beeldanalyse.
- **camsnap** - leg beelden, clips of bewegingsmeldingen vast van RTSP-/ONVIF-beveiligingscamera's.
- **oracle** - agent-CLI voor OpenAI met sessieherhaling en browserbesturing.
- **eightctl** - beheer je slaap via de terminal.
- **imsg** - verstuur, lees en stream iMessage en sms.
- **wacli** - WhatsApp-CLI: synchroniseren, zoeken, verzenden.
- **discord** - Discord-acties: reacties, stickers, peilingen. Gebruik doelen van het type `user:<id>` of `channel:<id>` (losse numerieke id's zijn dubbelzinnig).
- **gog** - CLI voor Google Suite: Gmail, Calendar, Drive, Contacts.
- **spotify-player** - Spotify-client voor de terminal om afspelen te zoeken, in de wachtrij te plaatsen en te bedienen.
- **sag** - spraak van ElevenLabs met een macOS-achtige gebruikservaring voor `say`; streamt standaard naar luidsprekers.
- **Sonos CLI** - bedien Sonos-luidsprekers (detectie/status/afspelen/volume/groepering) vanuit scripts.
- **blucli** - speel af op, groepeer en automatiseer BluOS-spelers vanuit scripts.
- **OpenHue CLI** - bediening van Philips Hue-verlichting voor scènes en automatiseringen.
- **OpenAI Whisper** - lokale spraak-naar-tekst voor snel dicteren en transcripties van voicemail.
- **Gemini CLI** - Google Gemini-modellen vanuit de terminal voor snelle vragen en antwoorden.
- **agent-tools** - hulppakket voor automatiseringen en ondersteunende scripts.

## Gebruiksopmerkingen

- Geef voor scripts de voorkeur aan de `openclaw`-CLI; de desktopapp verwerkt machtigingen.
- Voer installaties uit vanaf het tabblad Skills; de installatieknop is verborgen zodra een vereist binair bestand al aanwezig is.
- Houd Heartbeats ingeschakeld, zodat de assistent herinneringen kan plannen, inboxen kan bewaken en cameraopnamen kan activeren.
- De Canvas-UI wordt op volledig scherm uitgevoerd met systeemeigen overlays. Plaats essentiële bedieningselementen niet aan de linker-, rechter- of onderrand; voeg expliciete marges aan de lay-out toe in plaats van te vertrouwen op marges voor veilige gebieden.
- Gebruik voor browsergestuurde verificatie de CLI `openclaw browser` (meegeleverde `browser`-Plugin) met het door OpenClaw beheerde Chrome-/Brave-/Edge-/Chromium-profiel.
- Beheren: `status`, `doctor [--deep]`, `start [--headless]`, `stop`, `tabs`, `tab [new|select|close]`, `open <url>`, `focus <id>`, `close <id>`.
- Inspecteren: `screenshot [--full-page|--ref|--labels]`, `snapshot [--format ai|aria|--interactive|--efficient]`, `console`, `errors`, `requests`, `pdf`, `responsebody`.
- Handelen: `navigate`, `click <ref>`, `type <ref> <text>`, `press`, `hover`, `drag`, `select`, `upload`, `download`, `fill`, `dialog`, `wait`, `evaluate --fn <js>`, `highlight`. Acties vereisen een `ref` uit `snapshot` (CSS-selectors worden niet geaccepteerd voor acties); gebruik `evaluate` wanneer je doelen wilt aanwijzen zoals met `document.querySelector`.
- Voeg `--json` toe aan elke inspectieopdracht voor machineleesbare uitvoer.

## Gerelateerd

- [Agentwerkruimte](/nl/concepts/agent-workspace)
- [Agentruntime](/nl/concepts/agent)
- [Kanaalroutering](/nl/channels/channel-routing)
