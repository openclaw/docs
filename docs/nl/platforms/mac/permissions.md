---
read_when:
    - Ontbrekende of vastgelopen macOS-machtigingenprompts debuggen
    - Beslissen of Toegankelijkheid aan node of een CLI-runtime moet worden verleend
    - De macOS-app verpakken of ondertekenen
    - App-bundel-ID's of installatiepaden wijzigen
summary: Persistentie van macOS-machtigingen (TCC) en ondertekeningsvereisten
title: macOS-machtigingen
x-i18n:
    generated_at: "2026-06-27T17:48:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7b7e21c53bff16c3023e2b6509894717c3d0ef96524951b0d0c5975d2fc91019
    source_path: platforms/mac/permissions.md
    workflow: 16
---

macOS-machtigingen zijn kwetsbaar. TCC koppelt een machtiging aan de
codehandtekening, bundle-ID en het pad op schijf van de app. Als een daarvan verandert,
behandelt macOS de app als nieuw en kan het prompts laten vervallen of verbergen.

## Vereisten voor stabiele machtigingen

- Zelfde pad: voer de app uit vanaf een vaste locatie (voor OpenClaw, `dist/OpenClaw.app`).
- Zelfde bundle-ID: het wijzigen van de bundle-ID maakt een nieuwe machtigingsidentiteit aan.
- Ondertekende app: niet-ondertekende of ad-hoc ondertekende builds behouden geen machtigingen.
- Consistente handtekening: gebruik een echt Apple Development- of Developer ID-certificaat
  zodat de handtekening stabiel blijft tussen rebuilds.

Ad-hoc handtekeningen genereren bij elke build een nieuwe identiteit. macOS vergeet eerdere
machtigingen, en prompts kunnen volledig verdwijnen totdat de verouderde vermeldingen worden gewist.

## Toegankelijkheidsmachtigingen voor Node- en CLI-runtimes

Geef Toegankelijkheid bij voorkeur aan OpenClaw.app, Peekaboo.app of een andere ondertekende
helper met een eigen bundle-ID in plaats van aan een generieke `node`-binary.

macOS TCC verleent Toegankelijkheid aan de code-identiteit van het proces dat het ziet. Als een
Homebrew-, nvm-, pnpm- of npm-workflow ervoor zorgt dat een gedeeld `node`-uitvoerbaar bestand
Toegankelijkheid ontvangt, kan elk JavaScript-pakket dat via datzelfde
uitvoerbare bestand wordt gestart GUI-automatiseringsrechten erven.

Beschouw een `node`-vermelding in Systeeminstellingen als brede toestemming voor die Node-runtime,
niet als toestemming voor één npm-pakket. Geef geen Toegankelijkheid aan
`node`, tenzij je elk script en pakket vertrouwt dat via precies die
Node-installatie wordt gestart.

Als je per ongeluk Toegankelijkheid aan `node` hebt gegeven, verwijder die vermelding dan uit
Systeeminstellingen -> Privacy en beveiliging -> Toegankelijkheid. Geef daarna machtiging aan de ondertekende
app of helper die UI-automatisering hoort te beheren.

## Herstelchecklist wanneer prompts verdwijnen

1. Sluit de app af.
2. Verwijder de app-vermelding in Systeeminstellingen -> Privacy en beveiliging.
3. Start de app opnieuw vanaf hetzelfde pad en verleen de machtigingen opnieuw.
4. Als de prompt nog steeds niet verschijnt, reset dan TCC-vermeldingen met `tccutil` en probeer het opnieuw.
5. Sommige machtigingen verschijnen pas opnieuw na een volledige herstart van macOS.

Voorbeeldresets (vervang de bundle-ID waar nodig):

```bash
sudo tccutil reset Accessibility ai.openclaw.mac
sudo tccutil reset ScreenCapture ai.openclaw.mac
sudo tccutil reset AppleEvents
```

## Machtigingen voor bestanden en mappen (Bureaublad/Documenten/Downloads)

macOS kan ook Bureaublad, Documenten en Downloads afschermen voor terminal- en achtergrondprocessen. Als het lezen van bestanden of het weergeven van mappen blijft hangen, geef dan toegang aan dezelfde procescontext die de bestandsbewerkingen uitvoert (bijvoorbeeld Terminal/iTerm, een door LaunchAgent gestarte app of een SSH-proces).

Workaround: verplaats bestanden naar de OpenClaw-workspace (`~/.openclaw/workspace`) als je machtigingen per map wilt vermijden.

Als je machtigingen test, onderteken dan altijd met een echt certificaat. Ad-hoc
builds zijn alleen acceptabel voor snelle lokale runs waarbij machtigingen niet van belang zijn.

## Gerelateerd

- [macOS-app](/nl/platforms/macos)
- [macOS-ondertekening](/nl/platforms/mac/signing)
