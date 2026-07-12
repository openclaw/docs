---
read_when:
    - Foutopsporing voor ontbrekende of vastgelopen macOS-toestemmingsvragen
    - Beslissen of u toegankelijkheid wilt verlenen aan Node of een CLI-runtime
    - De macOS-app verpakken of ondertekenen
    - Bundle-ID's of installatiepaden van apps wijzigen
summary: Persistentie van macOS-machtigingen (TCC) en ondertekeningsvereisten
title: macOS-machtigingen
x-i18n:
    generated_at: "2026-07-12T09:06:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c8431a1d5a27aed00c50c5d6c8c36554cf766051dfdccea677d0523bbc4189d4
    source_path: platforms/mac/permissions.md
    workflow: 16
---

macOS-machtigingen zijn kwetsbaar. TCC koppelt een machtiging aan de codehandtekening, bundel-ID en locatie op schijf van de app. Als een daarvan verandert, beschouwt macOS de app als nieuw en worden prompts mogelijk verwijderd of verborgen.

## Vereisten voor stabiele machtigingen

- Hetzelfde pad: voer de app uit vanaf een vaste locatie (voor OpenClaw: `dist/OpenClaw.app`).
- Dezelfde bundel-ID: de bundel-ID van OpenClaw is `ai.openclaw.mac`; als u deze wijzigt, ontstaat een nieuwe machtigingsidentiteit.
- Ondertekende app: bij niet-ondertekende of ad-hoc ondertekende builds blijven machtigingen niet behouden.
- Consistente handtekening: gebruik een echt Apple Development- of Developer ID-certificaat, zodat de handtekening bij nieuwe builds hetzelfde blijft.

Ad-hochandtekeningen genereren bij elke build een nieuwe identiteit. macOS vergeet eerdere machtigingen en prompts kunnen volledig verdwijnen totdat de verouderde vermeldingen zijn gewist.

## Toegankelijkheidsmachtigingen voor Node- en CLI-runtimes

Geef bij voorkeur toegankelijkheidstoegang aan OpenClaw.app, Peekaboo.app of een andere ondertekende helper met een eigen bundel-ID, in plaats van aan een algemeen `node`-binair bestand.

macOS TCC verleent toegankelijkheidstoegang aan de code-identiteit van het proces dat het waarneemt. Als een workflow met Homebrew, nvm, pnpm of npm ertoe leidt dat een gedeeld uitvoerbaar `node`-bestand toegankelijkheidstoegang krijgt, kan elk JavaScript-pakket dat via datzelfde uitvoerbare bestand wordt gestart, bevoegdheden voor GUI-automatisering overnemen.

Beschouw een vermelding voor `node` in System Settings als een brede machtiging voor die Node-runtime, niet als een machtiging voor één npm-pakket. Verleen geen toegankelijkheidstoegang aan `node`, tenzij u elk script en pakket vertrouwt dat via precies die Node-installatie wordt gestart.

Als u per ongeluk toegankelijkheidstoegang aan `node` hebt verleend, verwijdert u die vermelding via System Settings -> Privacy & Security -> Accessibility. Verleen de machtiging vervolgens aan de ondertekende app of helper die verantwoordelijk moet zijn voor UI-automatisering.

## Herstelcontrolelijst wanneer prompts verdwijnen

1. Sluit de app.
2. Verwijder de appvermelding in System Settings -> Privacy & Security.
3. Start de app opnieuw vanaf hetzelfde pad en verleen de machtigingen opnieuw.
4. Als de prompt nog steeds niet verschijnt, stelt u de TCC-vermeldingen opnieuw in met `tccutil` en probeert u het opnieuw.
5. Sommige machtigingen verschijnen pas opnieuw nadat macOS volledig opnieuw is opgestart.

Voorbeelden van opnieuw instellen (met de bundel-ID van OpenClaw, `ai.openclaw.mac`):

```bash
sudo tccutil reset Accessibility ai.openclaw.mac
sudo tccutil reset ScreenCapture ai.openclaw.mac
sudo tccutil reset AppleEvents
```

## Machtigingen voor bestanden en mappen (Bureaublad/Documenten/Downloads)

macOS kan ook de toegang tot Bureaublad, Documenten en Downloads beperken voor terminal- en achtergrondprocessen. Als het lezen van bestanden of weergeven van mapinhoud blijft hangen, verleent u toegang aan dezelfde procescontext die de bestandsbewerkingen uitvoert (bijvoorbeeld Terminal/iTerm, een door LaunchAgent gestarte app of een SSH-proces).

Tijdelijke oplossing: verplaats bestanden naar de OpenClaw-werkruimte (`~/.openclaw/workspace`) als u machtigingen per map wilt vermijden.

Als u machtigingen test, moet u altijd ondertekenen met een echt certificaat. Ad-hocbuilds zijn alleen geschikt voor snelle lokale uitvoeringen waarbij machtigingen niet van belang zijn.

## Gerelateerd

- [macOS-app](/nl/platforms/macos)
- [macOS-ondertekening](/nl/platforms/mac/signing)
