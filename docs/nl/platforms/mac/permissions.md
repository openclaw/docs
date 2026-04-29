---
read_when:
    - Foutopsporing bij ontbrekende of vastgelopen macOS-toestemmingsprompts
    - De macOS-app verpakken of ondertekenen
    - Bundle-ID's of app-installatiepaden wijzigen
summary: Persistentie van macOS-machtigingen (TCC) en ondertekeningsvereisten
title: macOS-machtigingen
x-i18n:
    generated_at: "2026-04-29T23:00:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: c9ee8ee6409577094a0ba1bc4a50c73560741c12cbb1b3c811cb684ac150e05e
    source_path: platforms/mac/permissions.md
    workflow: 16
---

macOS-toestemmingsverleningen zijn kwetsbaar. TCC koppelt een verleende toestemming aan de
codehandtekening, bundel-ID en het pad op schijf van de app. Als een daarvan verandert,
behandelt macOS de app als nieuw en kan het toestemmingsvragen verwijderen of verbergen.

## Vereisten voor stabiele toestemmingen

- Zelfde pad: voer de app uit vanaf een vaste locatie (voor OpenClaw, `dist/OpenClaw.app`).
- Zelfde bundel-ID: het wijzigen van de bundel-ID maakt een nieuwe toestemmingsidentiteit aan.
- Ondertekende app: niet-ondertekende of ad-hoc ondertekende builds behouden toestemmingen niet.
- Consistente handtekening: gebruik een echt Apple Development- of Developer ID-certificaat
  zodat de handtekening stabiel blijft tussen rebuilds.

Ad-hoc handtekeningen genereren bij elke build een nieuwe identiteit. macOS vergeet eerdere
verleningen, en toestemmingsvragen kunnen volledig verdwijnen totdat de verouderde vermeldingen zijn gewist.

## Herstelchecklist wanneer toestemmingsvragen verdwijnen

1. Sluit de app af.
2. Verwijder de app-vermelding in Systeeminstellingen -> Privacy en beveiliging.
3. Start de app opnieuw vanaf hetzelfde pad en verleen de toestemmingen opnieuw.
4. Als de toestemmingsvraag nog steeds niet verschijnt, reset dan TCC-vermeldingen met `tccutil` en probeer het opnieuw.
5. Sommige toestemmingen verschijnen pas opnieuw na een volledige macOS-herstart.

Voorbeeldresets (vervang de bundel-ID waar nodig):

```bash
sudo tccutil reset Accessibility ai.openclaw.mac
sudo tccutil reset ScreenCapture ai.openclaw.mac
sudo tccutil reset AppleEvents
```

## Bestands- en maptoestemmingen (Bureaublad/Documenten/Downloads)

macOS kan ook Bureaublad, Documenten en Downloads afschermen voor terminal-/achtergrondprocessen. Als het lezen van bestanden of het weergeven van mappen blijft hangen, verleen dan toegang aan dezelfde procescontext die bestandsbewerkingen uitvoert (bijvoorbeeld Terminal/iTerm, een door LaunchAgent gestarte app of een SSH-proces).

Tijdelijke oplossing: verplaats bestanden naar de OpenClaw-werkruimte (`~/.openclaw/workspace`) als je toestemmingen per map wilt vermijden.

Als je toestemmingen test, onderteken dan altijd met een echt certificaat. Ad-hoc
builds zijn alleen acceptabel voor snelle lokale runs waarbij toestemmingen er niet toe doen.

## Gerelateerd

- [macOS-app](/nl/platforms/macos)
- [macOS-ondertekening](/nl/platforms/mac/signing)
