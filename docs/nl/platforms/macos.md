---
read_when:
    - De macOS-app installeren
    - Kiezen tussen lokale en externe Gateway-modus op macOS
    - Op zoek naar downloads van releases van de macOS-app
summary: Installeer en gebruik de OpenClaw-menubalkapp voor macOS
title: macOS-app
x-i18n:
    generated_at: "2026-07-16T16:03:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c6aaf107eb564dd8a444069fee31bb190efe41da9f26b3c52f42fdbbcaf8690c
    source_path: platforms/macos.md
    workflow: 16
---

De macOS-app is de **menubalkassistent** van OpenClaw: een systeemeigen statusmenu, macOS-
toestemmingsvragen, meldingen, WebChat, spraakinvoer, Canvas en
door de Mac gehoste Node-tools zoals `system.run`.

Alleen de CLI en Gateway nodig? Begin met [Aan de slag](/nl/start/getting-started).

## Downloaden

Download builds van de macOS-app via [OpenClaw-releases op GitHub](https://github.com/openclaw/openclaw/releases).
Wanneer een release onderdelen voor de macOS-app bevat, zoek je naar:

- `OpenClaw-<version>.dmg` (aanbevolen)
- `OpenClaw-<version>.zip`

Sommige releases bevatten alleen onderdelen voor de CLI, bewijsmateriaal of Windows. Als de nieuwste release
geen onderdeel voor de macOS-app bevat, gebruik je de nieuwste release die dat wel bevat, of bouw je vanuit de broncode met
[macOS-ontwikkelomgeving](/nl/platforms/mac/dev-setup).

## Eerste gebruik

1. Installeer en start **OpenClaw.app**.
2. Kies **This Mac** voor een lokale Gateway of maak verbinding met een externe Gateway.
3. Wacht terwijl de app de bijpassende CLI-runtime installeert. In de lokale modus wordt ook
   de Gateway geïnstalleerd en gestart.
4. Breng inferentie tot stand met een live modelcontrole. Nadat deze is geslaagd, handelt OpenClaw
   de resterende configuratie af.
5. Voltooi de controlelijst voor macOS-toestemmingen en stuur het testbericht voor de ingebruikname.

Als de app een bestaande Gateway bereikt waarvan de standaardagent een geconfigureerd
model heeft, beschouwt de app die Gateway als reeds geconfigureerd, slaat de ingebruikname van de provider en
OpenClaw over en opent het dashboard. Als de Gateway geen verbinding kan maken of de
standaardagent geen model heeft, blijft de ingebruikname van inferentie beschikbaar voor
herstel.

Gebruik [Aan de slag](/nl/start/getting-started) voor het configuratietraject van de CLI/Gateway.
Gebruik [macOS-toestemmingen](/nl/platforms/mac/permissions) om toestemmingen te herstellen.

## Updates

De updatekaart van het dashboard vermeldt wat de app bijwerkt:

- **Mac-app + Gateway bijwerken** betekent dat de ondertekende app eigenaar is van de lokale door launchd
  beheerde Gateway. Sparkle werkt eerst de app bij; nadat de app opnieuw is gestart, wordt de
  Gateway automatisch bijgewerkt en opnieuw gestart met de bijpassende versie, waarna de
  verbinding wordt gecontroleerd.
- **Gateway bijwerken** betekent dat de app verbonden is met een externe Gateway, een handmatig
  beheerde lokale Gateway of een andere installatie waarvan de app geen eigenaar is. De knop
  voert de normale updateprocedure van die Gateway uit in plaats van de Mac-app te wijzigen.

Een mislukte gecoördineerde update blijft in het configuratievenster staan met opties om het opnieuw te proberen,
de [updatehandleiding](/nl/install/updating) te openen en Discord-acties uit te voeren. Automatisch herstel
downgradet nooit een nieuwere Gateway en overschrijft nooit een `extended-stable`-kanaalpin.

Na een geslaagde update zoekt de app naar de meest recent door een mens gebruikte
directe sessie op het hoogste niveau en geeft de betreffende agent een eenmalige updategebeurtenis. Heartbeat-
en Cron-activiteit beïnvloeden deze keuze niet. De agent kan je vervolgens weer verwelkomen
vanuit het gesprek dat je waarschijnlijk als laatste gebruikte. In de externe modus
werkt de app alleen de lokale Mac Node-runtime bij en wordt de melding overgeslagen wanneer de
externe Gateway ouder is dan de app.

Sparkle volgt de instelling `update.channel` van de Gateway. Met `beta` en `dev` meld je je aan
voor bètaversies van de app; `stable`, `extended-stable` en ontbrekende of onbekende waarden
blijven stabiele app-builds gebruiken.

## Dashboardlinks openen

Wanneer je in het ingebouwde dashboard van de macOS-app op een externe weblink klikt, wordt deze geopend in een aanpasbare browserzijbalk die de helft van de vensterbreedte beslaat, terwijl de dashboardnavigatie zichtbaar blijft. Versleep de scheidingslijn om een andere breedte te kiezen; de app onthoudt deze. Elke link wordt in een eigen tabblad geopend, de tabbladbalk verschijnt wanneer meerdere pagina's geopend zijn en als je opnieuw op dezelfde link klikt, wordt het bestaande tabblad hergebruikt. Versleep tabbladen om ze opnieuw te ordenen, sluit ze met de sluitknop van het tabblad of met een klik op de middelste muisknop en klik met de rechtermuisknop op een tabblad voor **Open in Default Browser**, **Copy Link**, **Reload**, **Close Tab** en **Close Other Tabs**. Met de knoppen Vorige/Volgende in de titelbalk van het venster en veegbewegingen op het trackpad navigeer je door de geschiedenis van het dashboard; met de eigen knoppen Vorige/Volgende van de zijbalk navigeer je door de geschiedenis van het actieve tabblad. De zijbalk bevat ook knoppen voor opnieuw laden, openen in de standaardbrowser en sluiten.

De knoppen in de titelbalk volgen de zijbalk van de app: wanneer deze is uitgeklapt, staan Vorige/Volgende aan de rechterrand ervan, naast de knop om de zijbalk in of uit te schakelen; wanneer deze is ingeklapt, maken ze plaats voor een zoekknop (opent het opdrachtenpalet) en een knop voor een nieuwe sessie.

Klik met de rechtermuisknop op een externe link om **Open in Sidebar**, **Open in Default Browser** of **Copy Link** te kiezen. Klikken met modificatietoetsen en door de gebruiker geactiveerde links naar een nieuw venster vanuit het dashboard blijven in de standaardbrowser openen; links naar een nieuw venster in de zijbalk worden als nieuwe zijbalktabbladen geopend. Reguliere, in de browser gehoste pagina's van de Control UI behouden het normale gedrag van de browser voor links en contextmenu's.

## Browseraanmeldingen importeren

Wanneer de browserzijbalk voor het eerst wordt geopend terwijl de app met een lokale Gateway werkt, toont het dashboard een wegklikbare banner als er op de Mac een profiel uit de Chrome-familie met cookies aanwezig is. De banner biedt aan om die cookies te kopiëren naar een geïsoleerd beheerd profiel dat agents gebruiken om te browsen. Kies een profiel via het bedieningselement **Import** (Touch ID kan vereist zijn); de voortgang en het aantal geïmporteerde cookies worden op dezelfde plek weergegeven en alleen cookies worden gekopieerd — wachtwoorden verlaten de bronbrowser nooit. Als je de banner wegklikt, wordt die keuze vastgelegd; via **Settings → General → Browser login → Import…** kun je deze optie op elk gewenst moment opnieuw weergeven. Zie [Browser](/nl/cli/browser) voor de onderliggende importprocedure en de `browser.allowSystemProfileImport`-voorwaarde.

## Een Gateway-modus kiezen

| Modus  | Gebruik deze wanneer                                                            | Detailpagina                                       |
| ------ | ------------------------------------------------------------------------------- | ------------------------------------------------- |
| Lokaal | Deze Mac moet de Gateway uitvoeren en met launchd actief houden.                | [Gateway op macOS](/nl/platforms/mac/bundled-gateway) |
| Extern | Een andere host voert de Gateway uit; deze Mac beheert deze via SSH, LAN of Tailnet. | [Externe bediening](/nl/platforms/mac/remote)      |

Voor beide modi is een geïnstalleerde `openclaw`-CLI vereist, omdat de app de
runtime van de Node-host daarvan hergebruikt. Op een nieuwe Mac installeert de app automatisch de bijpassende CLI; in de lokale
modus wordt vervolgens de Gateway-wizard gestart, terwijl de externe modus verbinding maakt met de geselecteerde
Gateway zonder een tweede lokale Gateway te starten.
Zie [Gateway op macOS](/nl/platforms/mac/bundled-gateway) voor handmatig herstel.

## Wat de app beheert

- Status in de menubalk, meldingen, statuscontrole en WebChat.
- macOS-toestemmingsvragen voor scherm, microfoon, spraak, automatisering en toegankelijkheid.
- Eén Mac Node die systeemeigen Canvas, camera-/schermopname, meldingen,
  locatie en computerbesturing combineert met de systeem-, browser-,
  Plugin-, Skills- en MCP-opdrachten van de CLI-Node-host.
- Vragen om uitvoeringstoestemming voor door de Mac gehoste opdrachten.
- Uitvoering binnen de app-context voor goedgekeurde shellopdrachten, waarbij de macOS-
  toeschrijving van toestemmingen aan de app behouden blijft terwijl de CLI-runtime het gedeelde Node-beleid beheert.
- SSH-tunnels in de externe modus of rechtstreekse Gateway-verbindingen.

De app vervangt de algemene documentatie van de Gateway of CLI **niet**. Gateway-
configuratie, providers, plugins, kanalen, tools en beveiliging staan in hun
eigen documentatie.

## Detailpagina's voor macOS

| Taak                                      | Lezen                                                                                       |
| ----------------------------------------- | ------------------------------------------------------------------------------------------- |
| De CLI/Gateway-service installeren of fouten opsporen | [Gateway op macOS](/nl/platforms/mac/bundled-gateway)                               |
| Status buiten met de cloud gesynchroniseerde mappen houden | [Gateway op macOS](/nl/platforms/mac/bundled-gateway#state-directory-on-macos)     |
| Problemen met appdetectie en verbindingen oplossen | [Gateway op macOS](/nl/platforms/mac/bundled-gateway#debug-app-connectivity)            |
| Het gedrag van launchd begrijpen          | [Levenscyclus van de Gateway](/nl/platforms/mac/child-process)                                 |
| Toestemmings- of ondertekenings-/TCC-problemen oplossen | [macOS-toestemmingen](/nl/platforms/mac/permissions)                              |
| Detecteren welke Mac je het laatst hebt gebruikt | [Aanwezigheid van actieve computer](/nl/nodes/presence)                                  |
| Verbinding maken met een externe Gateway  | [Externe bediening](/nl/platforms/mac/remote)                                                  |
| Status in de menubalk en statuscontroles bekijken | [Menubalk](/nl/platforms/mac/menu-bar), [Statuscontroles](/nl/platforms/mac/health)          |
| De ingebouwde chatinterface gebruiken     | [WebChat](/nl/platforms/mac/webchat)                                                           |
| Stemactivatie of indrukken-om-te-praten gebruiken | [Stemactivatie](/nl/platforms/mac/voicewake)                                            |
| Canvas en Canvas-deeplinks gebruiken      | [Canvas](/nl/platforms/mac/canvas)                                                             |
| PeekabooBridge hosten voor UI-automatisering | [Peekaboo-bridge](/nl/platforms/mac/peekaboo)                                               |
| Goedkeuringen voor opdrachten configureren | [Uitvoeringsgoedkeuringen](/nl/tools/exec-approvals), [geavanceerde details](/nl/tools/exec-approvals-advanced) |
| Mac Node-opdrachten en app-IPC inspecteren | [macOS-IPC](/nl/platforms/mac/xpc)                                                            |
| Logboeken vastleggen                      | [macOS-logboekregistratie](/nl/platforms/mac/logging)                                          |
| Bouwen vanuit de broncode                 | [macOS-ontwikkelomgeving](/nl/platforms/mac/dev-setup)                                         |

## Gerelateerd

- [Platformen](/nl/platforms)
- [Aan de slag](/nl/start/getting-started)
- [Gateway](/nl/gateway)
- [Uitvoeringsgoedkeuringen](/nl/tools/exec-approvals)
