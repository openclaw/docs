---
read_when:
    - Je wilt dat OpenClaw herbruikbare procedures leert van afgeronde gesprekken
    - Je beslist of je autonome voorstellen voor Skills wilt inschakelen
    - Je moet inzicht krijgen in de veiligheid, kosten, geschiktheid of probleemoplossing van zelflerende systemen
sidebarTitle: Self-learning
summary: Laat OpenClaw herbruikbare Skills voorstellen op basis van correcties en substantieel voltooid werk
title: Zelflerend
x-i18n:
    generated_at: "2026-07-16T16:39:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b10618c1a64441bdf0ba58f03e02972bdf2b1d59643a78358910594f8139ccb8
    source_path: tools/self-learning.md
    workflow: 16
---

Door zelfleren kan OpenClaw bruikbaar bewijs uit gesprekken omzetten in openstaande
[Skill Workshop](/nl/tools/skill-workshop)-voorstellen. Het traint geen modelgewichten,
bewerkt geen actieve skills en wijzigt het gedrag van agents niet stilzwijgend. Elke geleerde
procedure blijft openstaan totdat een beheerder deze beoordeelt en toepast.

Zelfleren is **standaard uitgeschakeld**. Schakel het alleen in wanneer een extra
modeluitvoering op de achtergrond en beoordeling van transcripten geschikt zijn voor jouw werkruimte.

## Zelfleren inschakelen

Open in de Control UI **Plugins → Workshop** en schakel **Zelfleren** in. De
wijziging wordt onmiddellijk van kracht; wanneer een andere configuratieschrijver het
bestand heeft bijgewerkt, vernieuwt de Control UI de configuratiemomentopname en probeert deze de schakelaar opnieuw in te stellen zonder
de pagina of Gateway opnieuw te laden.

Gebruik de CLI:

```bash
openclaw config set skills.workshop.autonomous.enabled true --strict-json
```

Of bewerk `~/.openclaw/openclaw.json`:

```json5
{
  skills: {
    workshop: {
      autonomous: {
        enabled: true,
      },
    },
  },
}
```

Schakel het weer uit met:

```bash
openclaw config set skills.workshop.autonomous.enabled false --strict-json
```

Door gebruikers aangevraagde creatie van skills, `/learn` en handmatige Skill Workshop-bewerkingen
blijven werken terwijl zelfleren is uitgeschakeld.

## Eerdere sessies handmatig beoordelen

Handmatige beoordeling van de geschiedenis is het conservatieve alternatief voor autonome vastlegging.
Open **Plugins → Workshop** in de Control UI en selecteer **Skillideeën zoeken**.
Hierdoor wordt `skills.workshop.autonomous.enabled` niet gewijzigd.

Elke scan:

- begint met de nieuwste nog niet beoordeelde sessies en gaat achteruit;
- beoordeelt maximaal 20 substantiële sessies met ten minste zes modelbeurten;
- slaat Cron-, Heartbeat-, hook-, subagent-, ACP-, Plugin-eigen en interne beoordelingssessies
  over;
- redigeert herkende geheimen en begrenst de transcriptbundel voordat deze
  naar het geconfigureerde model van de geselecteerde agent wordt verzonden;
- hanteert dezelfde hoge drempel als autonome ervaringsbeoordeling; en
- kan maximaal drie openstaande voorstellen maken of herzien, maar nooit actieve skills.

De Workshop rapporteert het cumulatieve aantal sessies, het datumbereik en de gevonden ideeën.
Selecteer **Eerder werk scannen** voor het volgende oudere venster. Wanneer de cursor
het begin van de in aanmerking komende geschiedenis bereikt, verandert de actie in **Nieuw werk scannen**.
OpenClaw bewaart alleen cursor- en dekkingsmetadata in de gedeelde statusdatabase;
het maakt geen tweede transcriptarchief.

Sessies worden alleen gescand wanneer OpenClaw het eigenaarschap ervan kan aantonen en
inhoud van externe hooks kan uitsluiten. Na een upgrade kan het huidige transcript van vóór de upgrade
lokaal worden geclassificeerd, maar geroteerde transcripten van vóór de upgrade zonder herkomstgegevens
per uitvoering worden overgeslagen. Nieuwe transcripten behouden deze herkomstgegevens na rotatie.

Handmatige scans brengen nog steeds kosten van de modelprovider met zich mee en verzenden in aanmerking komende gespreksinhoud
naar de geconfigureerde provider. Gebruik ze alleen wanneer die beoordeling past bij de
privacy- en gegevensverwerkingsvereisten van de werkruimte.

## Wat OpenClaw kan leren

Zelfleren kent twee conservatieve paden:

1. **Directe instructies en correcties.** OpenClaw detecteert duurzame formuleringen
   zoals ‘vanaf nu’, ‘de volgende keer’ en correcties op een mislukte aanpak.
   Wanneer zelfleren is ingeschakeld, kan het die signalen omzetten in openstaande voorstellen
   zonder op een andere prompt te wachten. Dit deterministische pad kan verwante
   instructies groeperen in maximaal drie voorstellen, zich richten op een beschrijfbare werkruimteskill
   of een eigen gerelateerd openstaand voorstel herzien. Het wordt ook uitgevoerd na mislukte beurten,
   omdat het de instructies van de gebruiker vastlegt in plaats van de voltooiing te beoordelen.
2. **Ervaringsbeoordeling.** Na een succesvolle, substantiële voorgrondbeurt
   kan OpenClaw het voltooide werk beoordelen op een herbruikbare hersteltechniek of
   een stabiele procedure die ten minste twee toekomstige model- of toolrondgangen
   zou voorkomen.

Goede kandidaten zijn onder andere:

- een betrouwbaar herstel na herhaalde tool- of modelfouten;
- een niet voor de hand liggende volgordevoorwaarde die een terugkerende fout voorkwam;
- een stabiele workflow met meerdere stappen waarvoor herhaalde verkenning nodig was; of
- een herbruikbare preflight die meerdere toekomstige aanroepen zou voorkomen.

De beoordelaar moet zich onthouden bij routinematig succesvol werk, eenmalige verzoeken,
persoonlijke feiten, eenvoudige voorkeuren, tijdelijke omgevingsfouten, algemeen
advies, niet-onderbouwde negatieve beweringen en geheimen.

## Wanneer ervaringsbeoordeling wordt uitgevoerd

Ervaringsbeoordeling wordt opzettelijk uitgesteld en begrensd:

- De voorgrondbeurt moet succesvol worden voltooid.
- De huidige beurt moet ten minste tien modeliteraties bevatten.
- Cron-, Heartbeat-, geheugen-, overloop-, hook-, subagent- en beoordelingssessies zijn
  uitgesloten.
- De voorgronduitvoering moet een provider en model hebben bepaald en daadwerkelijk
  toegang hebben gehad tot `skill_workshop`.
- OpenClaw wacht na voltooiing 30 seconden. Een latere voorgrondvoltooiing in
  dezelfde sessie start die stille periode opnieuw.
- Als een agent- of antwoorduitvoering nog actief is, wacht de beoordeling nog eens 30 seconden.
- Er wordt slechts één ervaringsbeoordeling tegelijk uitgevoerd.
- Uitgestelde beoordeling is proceslokaal Gateway-werk. De Gateway moet actief blijven
  tijdens het inactiviteitsvenster; eenmalige lokale en CLI-ondersteunde runtimes bewaren
  onvoldoende context over het traject en de beschikbaarheid van tools om dit in te plannen.

Het antwoord op de voorgrond wordt nooit vertraagd om te leren. Een mislukte of niet in aanmerking komende
beurt start geen ervaringsbeoordeling, hoewel directe gebruikerscorrecties
nog steeds als suggestie kunnen worden aangeboden wanneer autonomie is uitgeschakeld.

## Wat de beoordelaar ontvangt

De achtergrondbeoordelaar ontvangt alleen de huidige beurt, vanaf het meest
recente gebruikersbericht. Het weergegeven traject is beperkt tot 60,000 tekens;
indien nodig bewaart OpenClaw het eerste bericht en het nieuwste bewijs en
markeert het weggelaten middendeel.

De beoordelaar hergebruikt de bepaalde provider en het bepaalde model. Deze hergebruikt het authenticatieprofiel van de voorgrond
wanneer die identiteit beschikbaar is en schakelt model-fallbacks uit. De
beoordeling start daarom een extra modeluitvoering bij de geconfigureerde provider.
Die uitvoering kan meer dan één providerverzoek doen wanneer deze een voorstel inspecteert of opstelt.
De prijsstelling en gegevensverwerkingsvoorwaarden van de provider zijn op dezelfde manier van toepassing als op de
voorgrondbeurt.

Voordat OpenClaw begint, laadt het de huidige runtimeconfiguratie opnieuw en controleert het opnieuw het
effectieve sandbox- en toolbeleid voor het oorspronkelijke gesprek. Als de uitvoering
in een sandbox plaatsvindt, het beleid `skill_workshop` niet meer toestaat of vereiste runtimefeiten
ontbreken, wordt de beoordeling veilig afgebroken en wordt er niets gemaakt.

<Warning>
  Door zelfleren in te schakelen, mag in aanmerking komende gespreksinhoud, waaronder toolinvoer
  en resultaten van de huidige beurt, naar de geselecteerde modelprovider worden
  verzonden voor één extra beoordeling. Schakel dit niet in voor een werkruimte waarin
  die beoordeling in strijd zou zijn met de vereisten voor gegevensverwerking.
</Warning>

## Veiligheid van voorstellen

De beoordelaar wordt uitgevoerd in een geïsoleerde sessie met een bewust beperkt
tooloppervlak:

- Deze kan alleen Workshop-voorstellen vermelden of inspecteren en één
  openstaand voorstel maken of herzien.
- Deze kan geen actieve skill bijwerken, een voorstel toepassen, afwijzen of in quarantaine plaatsen,
  een bericht verzenden of algemene agenttools gebruiken.
- Eén mutatiebudget wordt gedeeld tussen modelpogingen, zodat een beoordeling maximaal
  één voorstel kan maken of herzien.
- Het beoordeelde traject wordt behandeld als niet-vertrouwd bewijs, niet als instructies
  voor de achtergrondagent.
- Skill Workshop scant de inhoud van voorstellen en weigert herkende letterlijke
  aanmeldgegevens voordat de voorstelstatus wordt opgeslagen.

De normale Workshop-limieten blijven van toepassing, waaronder `maxPending`, `maxSkillBytes`,
beperkingen voor ondersteuningsbestanden, scannercontroles en uitsluitend schrijven naar de werkruimte. De
instelling `approvalPolicy: "auto"` geeft de achtergrondbeoordelaar geen toegang
tot levenscyclusacties.

## Geleerde voorstellen beoordelen

Zelfleren produceert dezelfde openstaande voorstellen als handmatig Workshop-gebruik.
Inspecteer ze voordat je ze toepast:

```bash
openclaw skills workshop list
openclaw skills workshop inspect <proposal-id>
openclaw skills workshop apply <proposal-id>
```

Herzie voorstellen die nuttig maar nog niet gereed zijn, wijs ze af of plaats ze in quarantaine:

```bash
openclaw skills workshop revise <proposal-id> --proposal ./PROPOSAL.md
openclaw skills workshop reject <proposal-id> --reason "Te specifiek"
openclaw skills workshop quarantine <proposal-id> --reason "Beveiligingsbeoordeling vereist"
```

Toepassen is de enige bewerking die een actieve `SKILL.md` schrijft. Zie
[Skill Workshop](/nl/tools/skill-workshop) voor het volledige levenscyclus- en opslagmodel.

## Configuratie

| Instelling                                  | Standaard | Effect op zelfleren                                                                                                               |
| ------------------------------------------ | -------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `skills.workshop.autonomous.enabled`       | `false`  | Schakelt directe vastlegging van correcties en uitgestelde ervaringsbeoordeling in.                                                |
| `skills.workshop.approvalPolicy`           | `"auto"` | Regelt goedkeuringsprompts voor normale, door agents geïnitieerde levenscyclusacties; dit breidt de rechten van de achtergrondbeoordelaar niet uit. |
| `skills.workshop.maxPending`               | `50`     | Beperkt het aantal openstaande en in quarantaine geplaatste voorstellen per werkruimte.                                           |
| `skills.workshop.maxSkillBytes`            | `40000`  | Beperkt de grootte van de voorsteltekst in bytes.                                                                                  |
| `skills.workshop.allowSymlinkTargetWrites` | `false`  | Is alleen van invloed op het toepassen; zelfleren schrijft zelf voorstelstatus, geen actieve skilldoelen.                          |

Zie voor het volledige schema, de bereiken en gerelateerde skillinstellingen
[Skills-configuratie](/nl/tools/skills-config#workshop-skills-workshop).

## Probleemoplossing

### Er verschijnt geen voorstel na een lange beurt

Controleer al het volgende:

1. `skills.workshop.autonomous.enabled` is `true` in de actieve Gateway-configuratie.
2. De beurt is geslaagd en bevatte ten minste tien modeliteraties na het meest
   recente gebruikersbericht.
3. Het gesprek was een normale voorgronduitvoering, geen geplande, geheugen-,
   hook- of subagentuitvoering.
4. De oorspronkelijke uitvoering had toegang tot `skill_workshop` en vond niet plaats in een sandbox.
5. Het systeem bleef lang genoeg inactief voor de uitgestelde beoordeling.
6. Het langlopende Gateway-proces bleef actief tijdens het inactiviteitsvenster; een
   eenmalige lokale opdracht wacht niet op uitgestelde beoordeling.

Een kwalificerende beoordeling levert mogelijk nog steeds geen voorstel op. Onthouding is het verwachte
resultaat wanneer het bewijs de drempel voor een herbruikbare procedure niet haalt.

### Doctor meldt dat de Workshop-tool verborgen is

Wanneer zelfleren is ingeschakeld, controleert `openclaw doctor` of het effectieve
toolbeleid van de standaardagent `skill_workshop` toestaat. Volg de gemelde
wijziging voor `tools.allow` of `tools.alsoAllow`, of schakel zelfleren uit.

### Er verschijnen te veel voorstellen met weinig waarde

Schakel zelfleren uit en blijf `/learn` of expliciete Workshop-verzoeken gebruiken:

```bash
openclaw config set skills.workshop.autonomous.enabled false --strict-json
```

Openstaande voorstellen blijven beoordeelbaar nadat de functie is uitgeschakeld. Het uitschakelen
van zelfleren past ze niet toe, wijst ze niet af en verwijdert ze niet.

## Gerelateerd

- [Skill Workshop](/nl/tools/skill-workshop) voor beoordeling, goedkeuring en
  opslag van voorstellen
- [Skills maken](/nl/tools/creating-skills) voor handmatig gemaakte skills en
  de structuur van `SKILL.md`
- [Skills-configuratie](/nl/tools/skills-config) voor alle instellingen van `skills.*`
- [Skills-CLI](/nl/cli/skills) voor Workshop- en curatoropdrachten
