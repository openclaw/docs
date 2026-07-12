---
read_when:
    - De Gateway-agent een Mac-bureaublad laten zien en bedienen
    - Activering, machtigingen of veiligheid bij computergebruik
    - De Node-opdracht computer.act of de uitvoerders ervan uitbreiden
summary: Agentgestuurde desktopbediening op een gekoppelde macOS-node via de computertool en de node-opdracht computer.act
title: Computergebruik
x-i18n:
    generated_at: "2026-07-12T09:05:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2457d15a59857ffd9c7b160ea4ebed85c8372754abfc7bf75faafc963ecb6547
    source_path: nodes/computer-use.md
    workflow: 16
---

Computergebruik laat de Gateway-agent een gekoppeld **macOS**-bureaublad zien en bedienen: de agent maakt een schermafbeelding met de bestaande Node-opdracht `screen.snapshot` en bestuurt de aanwijzer en het toetsenbord via één gevaarlijke Node-opdracht, `computer.act`. De actieset volgt de kernacties voor computergebruik van Anthropic; de optionele zoomfunctie `computer_20251124` wordt niet beschikbaar gesteld. Een model met beeldverwerking bestuurt dit via het ingebouwde agenthulpmiddel `computer`.

De agent verzendt één uniforme opdracht, `computer.act`, en kan niet zien hoe een Node deze uitvoert. Een macOS-Node voert `computer.act` binnen het proces uit met ingebedde Peekaboo-services en beperkte CoreGraphics-primitieven (juiste TCC-machtigingen, geen extra proces). Andere platforms kunnen dezelfde opdracht later uitvoeren zonder het contract voor de agent te wijzigen.

## Vereisten

- Een gekoppelde **macOS**-Node (de OpenClaw-app voor macOS die in Node-modus wordt uitgevoerd).
- De macOS-appinstelling **Computerbesturing toestaan** ingeschakeld (standaard: uit).
- De macOS-machtiging **Toegankelijkheid** verleend aan OpenClaw (voor invoer via aanwijzer/toetsenbord) en de machtiging **Schermopname** (voor `screen.snapshot`).
- De opdracht `computer.act` geactiveerd op de Gateway (deze is gevaarlijk en standaard gedeactiveerd).
- Een agentmodel met beeldverwerking.
- Een hulpmiddelenbeleid dat `computer` beschikbaar stelt. Het standaardprofiel `coding` doet dit niet. Voeg `computer` toe aan `tools.alsoAllow`; agents in een sandbox hebben dit ook nodig in `tools.sandbox.tools.alsoAllow`.

## Het agenthulpmiddel `computer`

Het ingebouwde hulpmiddel `computer` accepteert één actie per aanroep. Coördinaten zijn niet-negatieve gehele pixels in de meest recente schermafbeelding; de Node zet deze om in beeldschermpunten. Acties met coördinaten moeten de `frameId` uit het resultaat van de schermafbeelding meesturen en een expliciete `screenIndex` moet overeenkomen met dat frame. OpenClaw neemt ook een door de Node uitgegeven beeldschermidentiteit uit de schermafbeelding mee in de actie, zodat bij het opnieuw verbinden van een beeldscherm of een wijziging van de geometrie de actie veilig wordt geweigerd in plaats van stilzwijgend opnieuw op dezelfde index te worden gericht. Deze controles weigeren gegokte tokens en tokens van een ander geleverd frame of beeldscherm. Een token garandeert niet dat de inhoud nog actueel is: apps kunnen pixels op hetzelfde beeldscherm na de opname wijzigen. Maak daarom een nieuwe schermafbeelding wanneer de situatie mogelijk is veranderd.

- Lezen: `screenshot`.
- Aanwijzer: `left_click`, `right_click`, `middle_click`, `double_click`, `triple_click`, `mouse_move`, `left_click_drag` (met `startCoordinate`), `left_mouse_down`, `left_mouse_up`.
- Scrollen: `scroll` met `scrollDirection` (`up|down|left|right`) en `scrollAmount` (muiswielstappen).
- Toetsenbord: `type` (tekst), `key` (combinatie zoals `cmd+shift+t` of `Return`), `hold_key` (`text`-combinatie die `duration` seconden wordt ingedrukt).
- Tempo: `wait` (`duration` seconden).

Modificatietoetsen worden via het veld `text` meegegeven bij klik- en scrollacties (`shift`, `ctrl`, `alt`, `cmd`). Na een invoeractie retourneert het hulpmiddel een nieuwe schermafbeelding, zodat het model het resultaat kan waarnemen. Als meer dan één Node met computerbesturing is verbonden, geef dan expliciet `node` op.

Schermafbeeldingen blijven **uitsluitend voor het model**: ze worden nooit automatisch naar het chatkanaal verzonden. Behandel alle inhoud op het scherm als niet-vertrouwde invoer; het hulpmiddel waarschuwt het model om geen instructies op het scherm te volgen die strijdig zijn met het verzoek van de gebruiker.

## De Node-opdracht `computer.act`

`computer.act` is de enige Node-opdracht waarlangs het hulpmiddel invoer doorstuurt (`node.invoke` met `command: "computer.act"`). Deze is:

- **Standaard gevaarlijk**: opgenomen in de ingebouwde gevaarlijke Node-opdrachten en uitgesloten van de runtime-toelatingslijst totdat deze expliciet wordt geactiveerd. Een macOS-Node kan de opdracht bij het koppelen wel declareren, zodat het oppervlak eenmalig wordt goedgekeurd.
- Momenteel **alleen voor macOS**: uitsluitend beschikbaar gesteld door een macOS-Node waarop **Computerbesturing toestaan** is ingeschakeld.

Leesacties hergebruiken `screen.snapshot`; er is geen tweede opnamepad. Zie [Camera- en scherm-Nodes](/nl/nodes/camera) voor de gedeelde opnameopdracht.

## Inschakelen en activeren

1. Schakel in de macOS-app **Instellingen → Computerbesturing toestaan** in. Open vervolgens **Instellingen → Machtigingen** en verleen **Toegankelijkheid** en **Schermopname** in de Systeeminstellingen van macOS.
2. Keur de bijgewerkte koppeling goed op de Gateway (een nieuwe opdracht dwingt opnieuw koppelen af).
3. Stel het hulpmiddel beschikbaar aan de agent met beeldverwerking. Voor het standaardprofiel `coding`:

   ```json5
   {
     tools: {
       alsoAllow: ["computer"],
       // Agents in een sandbox hebben deze tweede controle ook nodig:
       sandbox: { tools: { alsoAllow: ["computer"] } },
     },
   }
   ```

4. Activeer `computer.act` voor een begrensde periode. De Plugin `phone-control` stelt een groep `computer` beschikbaar:

   ```text
   /phone arm computer 30m
   /phone status
   /phone disarm
   ```

   Voor activering is `operator.admin` (of de eigenaar) vereist en de activering verloopt automatisch. De verouderde groep `/phone arm all` sluit bureaubladbesturing bewust uit; gebruik de expliciete groep `computer`. Activering bepaalt alleen wat de Gateway mag aanroepen; de macOS-app handhaaft nog steeds de instelling **Computerbesturing toestaan** en de machtigingen van het besturingssysteem.

Voeg voor permanente autorisatie `computer.act` toe aan `gateway.nodes.allowCommands` **en verwijder deze uit** `gateway.nodes.denyCommands`; de weigeringslijst heeft voorrang. Permanente autorisatie verloopt niet automatisch. Vermeldingen die al vóór `/phone arm` aanwezig waren, blijven na `/phone disarm` bestaan; zet een tijdelijke toekenning niet om in een permanente terwijl deze actief is.

Autorisatie is bewust opgesplitst in inschakeling en gebruik. Voor het activeren of permanent configureren van `computer.act` is beheerdersbevoegdheid vereist. Zodra de opdracht is geactiveerd, kan een geverifieerde operator met `operator.write` `computer.act` via `node.invoke` aanroepen totdat de toekenning verloopt of wordt gedeactiveerd; er is geen beheerderscontrole per actie. Het goedkeuren van een Node die `computer.act` declareert, registreert alleen het oppervlak zodat dit later kan worden geactiveerd en maakt de aanroep op zichzelf niet mogelijk.

## Veiligheid

- Vóór autorisatie moeten alle lagen overeenstemmen: hulpmiddelenbeleid, opdrachtbeleid van de Gateway, macOS-instelling, Toegankelijkheid en Schermopname. Na activering worden acties zonder bevestiging per actie uitgevoerd totdat de activering verloopt of `/phone disarm` wordt uitgevoerd.
- Tekstinvoer wordt één grafeem tegelijk verzonden. Annuleren, verbreken van de verbinding, pauzeren, uitschakelen of vervangen van het eindpunt stopt de invoer vóór het volgende grafeem, zodat het verouderde restant niet alsnog wordt ingevoerd.
- Schermafbeeldingen zijn uitsluitend voor het model en worden nooit automatisch naar de chat verzonden (issue [#44759](https://github.com/openclaw/openclaw/issues/44759)).
- Behandel scherminhoud als niet-vertrouwd; deze kan promptinjectie bevatten.

## Relatie tot andere manieren van bureaubladbesturing

Dit is het door de agent aangestuurde pad. Zie [Peekaboo-bridge](/nl/platforms/mac/peekaboo) voor de relatie met de PeekabooBridge-host, Codex Computer Use en de rechtstreekse `cua-driver`-MCP.
