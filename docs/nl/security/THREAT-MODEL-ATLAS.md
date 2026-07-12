---
read_when:
    - Beveiligingsstatus of dreigingsscenario's beoordelen
    - Werken aan beveiligingsfuncties of auditreacties
summary: OpenClaw-dreigingsmodel gekoppeld aan het MITRE ATLAS-framework
title: Dreigingsmodel (MITRE ATLAS)
x-i18n:
    generated_at: "2026-07-12T09:24:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c88ffdef850bd2afaf835baab2555304c914a0be1df6b6b9109e0f55d1448392
    source_path: security/THREAT-MODEL-ATLAS.md
    workflow: 16
---

**Versie:** 1.0-concept | **Framework:** [MITRE ATLAS](https://atlas.mitre.org/) (dreigingslandschap van aanvallen op AI-systemen) + gegevensstroomdiagrammen

Dit dreigingsmodel beschrijft vijandige bedreigingen voor het OpenClaw-platform voor AI-agenten en de ClawHub-marktplaats voor Skills. Het is een levend document dat wordt onderhouden door de OpenClaw-community. Zie [Bijdragen aan het dreigingsmodel](/nl/security/CONTRIBUTING-THREAT-MODEL) voor informatie over het melden van nieuwe bedreigingen, voorstellen van aanvalsketens of suggereren van risicobeperkende maatregelen.

**Belangrijkste ATLAS-bronnen:** [Technieken](https://atlas.mitre.org/techniques/) | [Tactieken](https://atlas.mitre.org/tactics/) | [Casestudy's](https://atlas.mitre.org/studies/) | [ATLAS GitHub](https://github.com/mitre-atlas/atlas-data) | [Bijdragen aan ATLAS](https://atlas.mitre.org/resources/contribute)

---

## 1. Reikwijdte

| Component                   | Opgenomen     | Opmerkingen                                      |
| --------------------------- | ------------- | ------------------------------------------------ |
| OpenClaw-agentruntime       | Ja            | Uitvoering van kernagent, toolaanroepen, sessies |
| Gateway                     | Ja            | Authenticatie, routering, kanaalintegratie       |
| Kanaalintegraties           | Ja            | WhatsApp, Telegram, Discord, Signal, Slack, enz. |
| ClawHub-marktplaats         | Ja            | Publicatie, moderatie en distributie van Skills  |
| MCP-servers                 | Ja            | Externe toolproviders                            |
| Gebruikersapparaten         | Gedeeltelijk  | Mobiele apps, desktopclients                     |

Meldingen buiten de reikwijdte en patronen van fout-positieve meldingen (blootstelling aan het openbare internet, aanvalsketens die uitsluitend uit promptinjectie bestaan zonder omzeiling van een grens, onderling onvertrouwde beheerders die één Gateway-host delen en andere gevallen) worden opgesomd in [`SECURITY.md`](https://github.com/openclaw/openclaw/blob/main/SECURITY.md); dat bestand is de actuele gezaghebbende bron voor de reikwijdte van kwetsbaarheidsmeldingen, niet deze pagina.

## 2. Systeemarchitectuur

### 2.1 Vertrouwensgrenzen

```text
┌─────────────────────────────────────────────────────────────────┐
│                    ONVERTROUWDE ZONE                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  WhatsApp   │  │  Telegram   │  │   Discord   │  ...         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│         │                │                │                      │
└─────────┼────────────────┼────────────────┼──────────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│                 VERTROUWENSGRENS 1: Kanaaltoegang                │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      GATEWAY                              │   │
│  │  • Apparaatkoppeling (TTL van 1 u voor DM-koppeling /     │   │
│    5 min. voor Node-koppeling)                               │   │
│  │  • Validatie van AllowFrom / toelatingslijst              │   │
│  │  • Authenticatie via token / wachtwoord / Tailscale       │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 VERTROUWENSGRENS 2: Sessiescheiding              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   AGENTSESSIES                            │   │
│  │  • Sessiesleutel = agent:kanaal:peer                      │   │
│  │  • Toolbeleid per agent                                   │   │
│  │  • Transcriptregistratie                                  │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 VERTROUWENSGRENS 3: Tooluitvoering               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  UITVOERINGSSANDBOX                       │   │
│  │  • Docker-sandbox (standaard) of host (exec-goedkeuringen)│   │
│  │  • Externe uitvoering via Node                            │   │
│  │  • SSRF-bescherming (DNS-vastzetting + IP-blokkering)     │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 VERTROUWENSGRENS 4: Externe inhoud               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │        OPGEHAALDE URL'S / E-MAILS / WEBHOOKS             │   │
│  │  • Omhulling van externe inhoud (XML-tags met willekeurige│   │
│    grens)                                                    │   │
│  │  • Injectie van beveiligingsmelding                       │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 VERTROUWENSGRENS 5: Toeleveringsketen            │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      CLAWHUB                              │   │
│  │  • Publicatie van Skills (semver, SKILL.md vereist)       │   │
│  │  • Moderatiescan op statische patronen en AST-nabije      │   │
│    structuren                                                │   │
│  │  • LLM-gebaseerde agentische risicobeoordeling +          │   │
│    VirusTotal-scan                                           │   │
│  │  • Verificatie van leeftijd GitHub-account (14 dagen)     │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Gegevensstromen

| Stroom | Bron    | Bestemming | Gegevens               | Bescherming             |
| ------ | ------- | ---------- | ---------------------- | ----------------------- |
| F1     | Kanaal  | Gateway    | Gebruikersberichten    | TLS, AllowFrom          |
| F2     | Gateway | Agent      | Gerouteerde berichten  | Sessiescheiding         |
| F3     | Agent   | Tools      | Toolaanroepen           | Beleidsafdwinging        |
| F4     | Agent   | Extern     | `web_fetch`-verzoeken  | SSRF-blokkering         |
| F5     | ClawHub | Agent      | Skill-code              | Moderatie, scannen      |
| F6     | Agent   | Kanaal     | Antwoorden              | Uitvoerfiltering        |

---

## 3. Dreigingsanalyse per ATLAS-tactiek

### 3.1 Verkenning (AML.TA0002)

#### T-RECON-001: Detectie van agenteindpunten

| Kenmerk                  | Waarde                                                                       |
| ------------------------ | ---------------------------------------------------------------------------- |
| **ATLAS-ID**             | AML.T0006 - Actief scannen                                                   |
| **Beschrijving**         | Aanvaller scant op blootgestelde OpenClaw Gateway-eindpunten                 |
| **Aanvalsvector**        | Netwerkscans, Shodan-query's, DNS-inventarisatie                             |
| **Getroffen componenten**| Gateway, blootgestelde API-eindpunten                                        |
| **Huidige maatregelen**  | Authenticatieoptie via Tailscale, standaard gebonden aan local loopback      |
| **Restrisico**           | Gemiddeld - openbare Gateways zijn vindbaar                                  |
| **Aanbevelingen**        | Documenteer veilige implementatie, voeg frequentiebeperking toe aan detectie-eindpunten |

#### T-RECON-002: Kanaalintegraties aftasten

| Kenmerk                   | Waarde                                                               |
| ------------------------- | -------------------------------------------------------------------- |
| **ATLAS-ID**              | AML.T0006 - Actief scannen                                           |
| **Beschrijving**          | Aanvaller tast berichtkanalen af om door AI beheerde accounts te identificeren |
| **Aanvalsvector**         | Testberichten verzenden, antwoordpatronen observeren                  |
| **Getroffen componenten** | Alle kanaalintegraties                                                |
| **Huidige maatregelen**   | Geen specifieke                                                      |
| **Restrisico**            | Laag - ontdekking alleen heeft beperkte waarde                       |
| **Aanbevelingen**         | Overweeg randomisatie van antwoordtijden                              |

---

### 3.2 Initiële toegang (AML.TA0004)

#### T-ACCESS-001: Onderschepping van koppelingscode

| Kenmerk                 | Waarde                                                                                                         |
| ----------------------- | -------------------------------------------------------------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0040 - Toegang tot API voor AI-modelinferentie                                                            |
| **Beschrijving**        | Aanvaller onderschept een koppelingscode tijdens het koppelingsvenster (1 u voor DM/algemene koppeling, 5 min. voor Node-koppeling) |
| **Aanvalsvector**       | Meekijken over de schouder, netwerkverkeer afluisteren, social engineering                                     |
| **Getroffen onderdelen** | Systeem voor apparaatkoppeling                                                                                |
| **Huidige mitigaties**  | TTL van 1 u (DM/algemene koppeling), TTL van 5 min. (Node-koppeling); codes worden via het bestaande kanaal verzonden |
| **Restrisico**          | Gemiddeld - koppelingsvenster kan worden misbruikt                                                             |
| **Aanbevelingen**       | Verkort het koppelingsvenster, voeg een bevestigingsstap toe                                                    |

#### T-ACCESS-002: AllowFrom-spoofing

| Kenmerk                 | Waarde                                                                                     |
| ----------------------- | ------------------------------------------------------------------------------------------ |
| **ATLAS-ID**            | AML.T0040 - Toegang tot API voor AI-modelinferentie                                        |
| **Beschrijving**        | Aanvaller vervalst de identiteit van een toegestane afzender op een kanaal                 |
| **Aanvalsvector**       | Kanaalafhankelijk - vervalsing van telefoonnummers, imitatie van gebruikersnamen           |
| **Getroffen onderdelen** | AllowFrom-validatie per kanaal                                                             |
| **Huidige mitigaties**  | Kanaalspecifieke identiteitsverificatie                                                     |
| **Restrisico**          | Gemiddeld - sommige kanalen blijven kwetsbaar voor spoofing                                |
| **Aanbevelingen**       | Documenteer kanaalspecifieke risico's, voeg waar mogelijk cryptografische verificatie toe  |

#### T-ACCESS-003: Tokendiefstal

| Kenmerk                 | Waarde                                                                       |
| ----------------------- | ---------------------------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0040 - Toegang tot API voor AI-modelinferentie                           |
| **Beschrijving**        | Aanvaller steelt authenticatietokens uit configuratie-/referentiebestanden    |
| **Aanvalsvector**       | Malware, ongeautoriseerde toegang tot apparaten, blootstelling van configuratieback-ups |
| **Getroffen onderdelen** | Opslag van kanaal-/providerreferenties, configuratieopslag                   |
| **Huidige mitigaties**  | Bestandsmachtigingen                                                          |
| **Restrisico**          | Hoog - tokens worden als platte tekst op schijf opgeslagen                    |
| **Aanbevelingen**       | Implementeer versleuteling van opgeslagen tokens, voeg tokenrotatie toe       |

---

### 3.3 Uitvoering (AML.TA0005)

#### T-EXEC-001: Directe promptinjectie

| Kenmerk                 | Waarde                                                                                                                                                     |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0051.000 - LLM-promptinjectie: direct                                                                                                                 |
| **Beschrijving**        | Aanvaller verzendt speciaal opgestelde prompts om het gedrag van de agent te manipuleren                                                                   |
| **Aanvalsvector**       | Kanaalberichten met vijandige instructies                                                                                                                  |
| **Getroffen onderdelen** | LLM van de agent, alle invoeroppervlakken                                                                                                                  |
| **Huidige mitigaties**  | Patroondetectie, omhulling van externe inhoud; wordt zonder omzeiling van een beveiligingsgrens beschouwd als buiten het bereik van kwetsbaarheidsmeldingen (zie `SECURITY.md`) |
| **Restrisico**          | Kritiek - alleen detectie, geen blokkering; geavanceerde aanvallen omzeilen deze                                                                            |
| **Aanbevelingen**       | Uitvoervalidatie en gebruikersbevestiging voor gevoelige acties, als extra laag boven op de bestaande detectie                                             |

#### T-EXEC-002: Indirecte promptinjectie

| Kenmerk                 | Waarde                                                                                                                        |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0051.001 - LLM-promptinjectie: indirect                                                                                   |
| **Beschrijving**        | Aanvaller sluit schadelijke instructies in opgehaalde inhoud in                                                                |
| **Aanvalsvector**       | Schadelijke URL's, vergiftigde e-mails, gecompromitteerde webhooks                                                             |
| **Getroffen onderdelen** | `web_fetch`, verwerking van e-mail, externe gegevensbronnen                                                                   |
| **Huidige mitigaties**  | Inhoudsomsluiting met willekeurige XML-achtige grensmarkeringen, normalisatie van homoglieven/speciale tokens en een beveiligingsmelding |
| **Restrisico**          | Hoog - het LLM kan de omsluitingsinstructies nog steeds negeren                                                                |
| **Aanbevelingen**       | Afzonderlijke uitvoeringscontexten voor omsloten inhoud                                                                         |

#### T-EXEC-003: Injectie van toolargumenten

| Kenmerk                 | Waarde                                                                  |
| ----------------------- | ----------------------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0051.000 - LLM-promptinjectie: direct                              |
| **Beschrijving**        | Aanvaller manipuleert toolargumenten via promptinjectie                  |
| **Aanvalsvector**       | Speciaal opgestelde prompts die de waarden van toolparameters beïnvloeden |
| **Getroffen onderdelen** | Alle toolaanroepen                                                     |
| **Huidige mitigaties**  | Uitvoeringsgoedkeuringen voor gevaarlijke opdrachten                    |
| **Restrisico**          | Hoog - berust op het oordeel van de gebruiker                           |
| **Aanbevelingen**       | Argumentvalidatie, geparametriseerde toolaanroepen                       |

#### T-EXEC-004: Omzeiling van uitvoeringsgoedkeuring

| Kenmerk                 | Waarde                                                                                                                                                                                        |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0043 - Vijandige gegevens opstellen                                                                                                                                                       |
| **Beschrijving**        | Aanvaller stelt opdrachten op die de toelatingslijst voor goedkeuring omzeilen                                                                                                                |
| **Aanvalsvector**       | Verhulling van opdrachten, misbruik van aliassen, padmanipulatie                                                                                                                               |
| **Getroffen onderdelen** | `src/infra/exec-approvals*.ts`, toelatingslijst voor opdrachten                                                                                                                               |
| **Huidige mitigaties**  | Toelatingslijst + vraagmodus, plus normalisatie van opdrachten (uitpakken van dispatch-wrappers, detectie van inline-evaluatie, analyse van shellketens)                                      |
| **Restrisico**          | Hoog - normalisatie beperkt maar elimineert de omzeiling via verhulling niet; bevindingen die alleen pariteitsverschillen tussen uitvoeringspaden betreffen, gelden als versterking en niet als kwetsbaarheden (zie `SECURITY.md`) |
| **Aanbevelingen**       | Blijf de dekking van opdrachtnormalisatie uitbreiden voor nieuwe verhullingstechnieken                                                                                                        |

---

### 3.4 Persistentie (AML.TA0006)

#### T-PERSIST-001: Installatie van schadelijke skill

| Kenmerk                 | Waarde                                                                                                                                |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0010.001 - Compromittering van de toeleveringsketen: AI-software                                                                 |
| **Beschrijving**        | Aanvaller publiceert een schadelijke skill op ClawHub                                                                                  |
| **Aanvalsvector**       | Account aanmaken, skill met verborgen schadelijke code publiceren                                                                      |
| **Getroffen onderdelen** | ClawHub, laden van skills, uitvoering door de agent                                                                                   |
| **Huidige mitigaties**  | Verificatie van de leeftijd van het GitHub-account, statische patroon-/AST-gerelateerde scans, LLM-gebaseerde agentische risicobeoordeling, VirusTotal-scans |
| **Restrisico**          | Hoog - er bestaan detectielagen, maar skills worden nog steeds uitgevoerd met agentbevoegdheden en zonder uitvoeringssandboxing        |
| **Aanbevelingen**       | Sandboxing van skilluitvoering, uitgebreidere beoordeling door de gemeenschap                                                          |

#### T-PERSIST-002: Vergiftiging van skillupdates

| Kenmerk                 | Waarde                                                                            |
| ----------------------- | --------------------------------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0010.001 - Compromittering van de toeleveringsketen: AI-software             |
| **Beschrijving**        | Aanvaller compromitteert een populaire skill en pusht een schadelijke update       |
| **Aanvalsvector**       | Compromittering van accounts, social engineering van de eigenaar van de skill      |
| **Getroffen onderdelen** | ClawHub-versiebeheer, automatische updateprocessen                                |
| **Huidige mitigaties**  | Versievingerafdrukken, moderatie/scans worden opnieuw uitgevoerd voor nieuwe versies |
| **Restrisico**          | Hoog - automatische updates kunnen schadelijke versies ophalen voordat de beoordeling is voltooid |
| **Aanbevelingen**       | Ondertekening van updates, terugdraaimogelijkheid, versie vastzetten               |

#### T-PERSIST-003: Manipulatie van agentconfiguratie

| Kenmerk                 | Waarde                                                                 |
| ----------------------- | ---------------------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0010.002 - Compromittering van de toeleveringsketen: gegevens     |
| **Beschrijving**        | Aanvaller wijzigt de agentconfiguratie om toegang te behouden           |
| **Aanvalsvector**       | Wijziging van configuratiebestanden, injectie van instellingen         |
| **Getroffen onderdelen** | Agentconfiguratie, toolbeleid                                          |
| **Huidige maatregelen** | Bestandsmachtigingen                                                    |
| **Restrisico**          | Gemiddeld - vereist lokale toegang                                      |
| **Aanbevelingen**       | Integriteitsverificatie van configuratie, auditlogboek voor configuratiewijzigingen |

---

### 3.5 Omzeiling van verdediging (AML.TA0007)

#### T-EVADE-001: Omzeiling van moderatiepatronen

| Kenmerk                 | Waarde                                                                                       |
| ----------------------- | -------------------------------------------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0043 - Manipulatiebestendige gegevens creëren                                           |
| **Beschrijving**        | Aanvaller maakt inhoud voor een skill die de moderatiecontroles van ClawHub omzeilt           |
| **Aanvalsvector**       | Unicode-homografen, coderingstrucs, dynamisch laden                                           |
| **Getroffen onderdelen** | Moderatie-/scanpijplijn van ClawHub                                                         |
| **Huidige maatregelen** | Statische patroonregels, AST-gerelateerde codescans, LLM-beoordeling van agentische risico's, VirusTotal |
| **Restrisico**          | Gemiddeld - nieuwe versluiering kan gelaagde heuristieken nog steeds omzeilen                 |
| **Aanbevelingen**       | Blijf het corpus met patronen en gedrag uitbreiden wanneer nieuwe omzeilingen worden ontdekt  |

#### T-EVADE-002: Ontsnapping uit inhoudswrapper

| Kenmerk                 | Waarde                                                                                                                   |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **ATLAS-ID**            | AML.T0043 - Manipulatiebestendige gegevens creëren                                                                       |
| **Beschrijving**        | Aanvaller maakt inhoud die ontsnapt uit de context van de wrapper voor externe inhoud                                    |
| **Aanvalsvector**       | Manipulatie van tags, contextverwarring, overschrijving van instructies                                                  |
| **Getroffen onderdelen** | Wrapping van externe inhoud                                                                                             |
| **Huidige maatregelen** | Willekeurige XML-achtige grensmarkeringen en beveiligingsmelding, plus detectie van markeringsspoofing met homografen of witruimtevarianten |
| **Restrisico**          | Gemiddeld - nieuwe ontsnappingsmethoden worden regelmatig ontdekt                                                        |
| **Aanbevelingen**       | Validatie aan de uitvoerzijde naast wrapping aan de invoerzijde                                                          |

---

### 3.6 Verkenning (AML.TA0008)

#### T-DISC-001: Inventarisatie van tools

| Kenmerk                 | Waarde                                                    |
| ----------------------- | --------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0040 - Toegang tot API voor AI-modelinferentie       |
| **Beschrijving**        | Aanvaller inventariseert beschikbare tools via prompts    |
| **Aanvalsvector**       | Vragen in de trant van "Welke tools heb je?"              |
| **Getroffen onderdelen** | Toolregister van de agent                                |
| **Huidige maatregelen** | Geen specifieke                                           |
| **Restrisico**          | Laag - tools zijn doorgaans gedocumenteerd                |
| **Aanbevelingen**       | Overweeg beheer van de zichtbaarheid van tools            |

#### T-DISC-002: Extractie van sessiegegevens

| Kenmerk                 | Waarde                                                     |
| ----------------------- | ---------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0040 - Toegang tot API voor AI-modelinferentie        |
| **Beschrijving**        | Aanvaller extraheert gevoelige gegevens uit de sessiecontext |
| **Aanvalsvector**       | Vragen zoals "Wat hebben we besproken?", contextonderzoek  |
| **Getroffen onderdelen** | Sessietranscripten, contextvenster                         |
| **Huidige maatregelen** | Sessiescheiding per afzender (`agent:channel:peer`-sleutel) |
| **Restrisico**          | Gemiddeld - gegevens binnen de sessie zijn bewust toegankelijk |
| **Aanbevelingen**       | Redactie van gevoelige gegevens in de context              |

---

### 3.7 Verzameling en exfiltratie (AML.TA0009, AML.TA0010)

#### T-EXFIL-001: Gegevensdiefstal via web_fetch

| Kenmerk                 | Waarde                                                                                   |
| ----------------------- | ---------------------------------------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0009 - Verzameling                                                                  |
| **Beschrijving**        | Aanvaller exfiltreert gegevens door de agent opdracht te geven deze naar een externe URL te sturen |
| **Aanvalsvector**       | Promptinjectie waardoor de agent gegevens via POST naar een server van de aanvaller stuurt |
| **Getroffen onderdelen** | Tool `web_fetch`                                                                        |
| **Huidige maatregelen** | SSRF-blokkering voor interne/privénetwerken (DNS-vastzetting en IP-blokkering)            |
| **Restrisico**          | Hoog - willekeurige externe URL's blijven toegestaan                                      |
| **Aanbevelingen**       | Toegestane URL-lijst, bewustzijn van gegevensclassificatie                                |

#### T-EXFIL-002: Ongeautoriseerd verzenden van berichten

| Kenmerk                 | Waarde                                                                        |
| ----------------------- | ----------------------------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0009 - Verzameling                                                       |
| **Beschrijving**        | Aanvaller zorgt dat de agent berichten met gevoelige gegevens verzendt        |
| **Aanvalsvector**       | Promptinjectie waardoor de agent de aanvaller een bericht stuurt              |
| **Getroffen onderdelen** | Berichtentool, kanaalintegraties                                              |
| **Huidige maatregelen** | Toegangscontrole voor uitgaande berichten                                     |
| **Restrisico**          | Gemiddeld - toegangscontrole kan worden omzeild                               |
| **Aanbevelingen**       | Expliciete bevestiging voor nieuwe ontvangers                                 |

#### T-EXFIL-003: Verzameling van inloggegevens

| Kenmerk                 | Waarde                                                                                                                                                            |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0009 - Verzameling                                                                                                                                           |
| **Beschrijving**        | Kwaadaardige skill verzamelt inloggegevens uit de agentcontext                                                                                                    |
| **Aanvalsvector**       | Skillcode leest omgevingsvariabelen en configuratiebestanden                                                                                                      |
| **Getroffen onderdelen** | Uitvoeringsomgeving van skills                                                                                                                                    |
| **Huidige maatregelen** | Scannen door ClawHub op inloggegevenspatronen (hardgecodeerde geheimen, toegang tot omgevingsvariabelen met inloggegevens gecombineerd met netwerkverzendingen); geen uitvoeringssandbox voor skills tijdens runtime |
| **Restrisico**          | Kritiek - skills worden uitgevoerd met de bevoegdheden van de agent                                                                                                |
| **Aanbevelingen**       | Uitvoeringssandbox voor skills, isolatie van inloggegevens                                                                                                         |

---

### 3.8 Impact (AML.TA0011)

#### T-IMPACT-001: Ongeautoriseerde opdrachtuitvoering

| Kenmerk                 | Waarde                                                                                                      |
| ----------------------- | ----------------------------------------------------------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0031 - Integriteit van AI-model aantasten                                                              |
| **Beschrijving**        | Aanvaller voert willekeurige opdrachten uit op het systeem van de gebruiker                                 |
| **Aanvalsvector**       | Promptinjectie gecombineerd met omzeiling van goedkeuring voor uitvoering                                   |
| **Getroffen onderdelen** | Bash-tool, opdrachtuitvoering                                                                               |
| **Huidige maatregelen** | Goedkeuringen voor uitvoering, Docker-sandboxoptie (standaard runtimebackend)                                |
| **Restrisico**          | Kritiek - uitvoering op de host is mogelijk wanneer de sandbox is uitgeschakeld                             |
| **Aanbevelingen**       | Verbeter de gebruikerservaring voor goedkeuringen; implementaties zonder sandbox blijven een bewuste keuze van de beheerder en worden als zodanig gedocumenteerd |

#### T-IMPACT-002: Uitputting van hulpbronnen (DoS)

| Kenmerk                 | Waarde                                                  |
| ----------------------- | ------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0031 - Integriteit van AI-model aantasten          |
| **Beschrijving**        | Aanvaller put API-tegoeden of rekenresources uit        |
| **Aanvalsvector**       | Geautomatiseerde berichtenstroom, dure toolaanroepen    |
| **Getroffen onderdelen** | Gateway, agentsessies, API-provider                     |
| **Huidige maatregelen** | Geen                                                    |
| **Restrisico**          | Hoog - geen snelheidsbeperking per afzender             |
| **Aanbevelingen**       | Snelheidslimieten per afzender, kostenbudgetten         |

#### T-IMPACT-003: Reputatieschade

| Kenmerk                 | Waarde                                                          |
| ----------------------- | --------------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0031 - Integriteit van AI-model aantasten                  |
| **Beschrijving**        | Aanvaller zorgt dat de agent schadelijke of aanstootgevende inhoud verzendt |
| **Aanvalsvector**       | Promptinjectie die ongepaste antwoorden veroorzaakt             |
| **Getroffen onderdelen** | Uitvoergeneratie, kanaalberichten                               |
| **Huidige maatregelen** | Inhoudsbeleid van de LLM-provider                                |
| **Restrisico**          | Gemiddeld - providerfilters zijn niet perfect                    |
| **Aanbevelingen**       | Filterlaag voor uitvoer, gebruikersinstellingen                  |

---

## 4. Analyse van de ClawHub-toeleveringsketen

### 4.1 Huidige beveiligingsmaatregelen

| Beheersmaatregel                | Implementatie                                                                         | Effectiviteit                                                             |
| ------------------------------ | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Leeftijd GitHub-account        | `requireGitHubAccountAge()` (minimaal 14 dagen)                                       | Gemiddeld - verhoogt de drempel voor nieuwe aanvallers                     |
| Padopschoning                  | `sanitizePath()`                                                                      | Hoog - voorkomt padtraversatie                                             |
| Bestandstypevalidatie          | `isTextFile()`                                                                        | Gemiddeld - alleen tekstbestanden worden gescand, maar blijven misbruikbaar |
| Groottelimieten                | Totale bundel van 50 MB (`MAX_PUBLISH_TOTAL_BYTES`)                                   | Hoog - voorkomt uitputting van bronnen                                     |
| Vereist SKILL.md               | Verplicht leesmij-bestand bij publicatie                                               | Lage beveiligingswaarde - uitsluitend informatief                          |
| Statische + AST-gerelateerde scanning | Patroonengine voor uitvoering, exfiltratie, het verzamelen van inloggegevens, versluiering en meer | Gemiddeld-hoog - dekt veel bekende misbruikpatronen, maar blijft patroongebaseerd |
| Agentische risicobeoordeling op basis van een LLM | Door een beveiligingsprompt gestuurd oordeel bij publicatie                          | Gemiddeld-hoog - detecteert gedrag dat statische patronen missen            |
| VirusTotal-scanning            | Gekoppeld aan publicatie- en herscanprocessen voor Skills en pakketreleases, afhankelijk van de API-sleutel van de beheerder | Hoog indien ingeschakeld - detectie door statische engines                  |
| Moderatiestatus                | Veld `moderationStatus`                                                               | Gemiddeld - handmatige beoordeling mogelijk                                |

### 4.2 Beperkingen van moderatie

De statische scanning van ClawHub inspecteert rechtstreeks de code-inhoud van Skills (niet alleen slug/metadata/frontmatter) en controleert onder meer op gevaarlijke uitvoeringsaanroepen, dynamische code-uitvoering, het verzamelen van inloggegevens, exfiltratiepatronen en versluierde payloads. Bekende tekortkomingen:

- Patroongebaseerde detectie kan nog steeds worden omzeild met voldoende nieuwe versluieringstechnieken.
- Beoordeling op basis van een LLM en VirusTotal-scanning zijn afhankelijk van ingeschakelde API-sleutels/configuratie aan de beheerderszijde.
- Er is geen uitvoeringssandbox die een geïnstalleerde Skill isoleert van de eigen bevoegdheden van de agent.

### 4.3 Badges

Skills en pakketten hebben door moderators toegewezen badges: `highlighted`, `official`, `deprecated`, `redactionApproved` (alleen Skills). Meldingen vanuit de community (`skillReports`) en auditlogboekregistratie (`auditLogs`) ondersteunen moderatieworkflows.

---

## 5. Risicomatrix

### 5.1 Waarschijnlijkheid tegenover impact

| Dreigings-ID  | Waarschijnlijkheid | Impact   | Risiconiveau | Prioriteit |
| ------------- | ------------------- | -------- | ------------ | ---------- |
| T-EXEC-001    | Hoog                | Kritiek  | **Kritiek**  | P0         |
| T-PERSIST-001 | Hoog                | Kritiek  | **Kritiek**  | P0         |
| T-EXFIL-003   | Gemiddeld           | Kritiek  | **Kritiek**  | P0         |
| T-IMPACT-001  | Gemiddeld           | Kritiek  | **Hoog**     | P1         |
| T-EXEC-002    | Hoog                | Hoog     | **Hoog**     | P1         |
| T-EXEC-004    | Gemiddeld           | Hoog     | **Hoog**     | P1         |
| T-ACCESS-003  | Gemiddeld           | Hoog     | **Hoog**     | P1         |
| T-EXFIL-001   | Gemiddeld           | Hoog     | **Hoog**     | P1         |
| T-IMPACT-002  | Hoog                | Gemiddeld | **Hoog**    | P1         |
| T-EVADE-001   | Hoog                | Gemiddeld | **Gemiddeld** | P2        |
| T-ACCESS-001  | Laag                | Hoog     | **Gemiddeld** | P2        |
| T-ACCESS-002  | Laag                | Hoog     | **Gemiddeld** | P2        |
| T-PERSIST-002 | Laag                | Hoog     | **Gemiddeld** | P2        |

### 5.2 Aanvalsketens voor kritieke paden

**Keten 1: gegevensdiefstal via een Skill**

```text
T-PERSIST-001 → T-EVADE-001 → T-EXFIL-003
(Kwaadaardige Skill publiceren) → (Moderatie omzeilen) → (Inloggegevens verzamelen)
```

**Keten 2: promptinjectie naar externe code-uitvoering**

```text
T-EXEC-001 → T-EXEC-004 → T-IMPACT-001
(Prompt injecteren) → (Goedkeuring voor uitvoering omzeilen) → (Opdrachten uitvoeren)
```

**Keten 3: indirecte injectie via opgehaalde inhoud**

```text
T-EXEC-002 → T-EXFIL-001 → Externe exfiltratie
(URL-inhoud vergiftigen) → (Agent haalt inhoud op en volgt instructies) → (Gegevens worden naar aanvaller verzonden)
```

---

## 6. Samenvatting van aanbevelingen

### 6.1 Onmiddellijk (P0)

| ID    | Aanbeveling                                          | Adresseert                 |
| ----- | ---------------------------------------------------- | -------------------------- |
| R-002 | Implementeer sandboxing voor de uitvoering van Skills | T-PERSIST-001, T-EXFIL-003 |
| R-003 | Voeg uitvoervalidatie toe voor gevoelige acties      | T-EXEC-001, T-EXEC-002     |

### 6.2 Korte termijn (P1)

| ID    | Aanbeveling                                                                      | Adresseert   |
| ----- | -------------------------------------------------------------------------------- | ------------ |
| R-004 | Implementeer snelheidsbeperking per afzender                                      | T-IMPACT-002 |
| R-005 | Voeg versleuteling van opgeslagen tokens toe                                     | T-ACCESS-003 |
| R-006 | Verbeter de gebruikerservaring voor goedkeuring van uitvoering en breid opdrachtnormalisatie verder uit | T-EXEC-004 |
| R-007 | Implementeer een toelatingslijst voor URL's voor `web_fetch`                     | T-EXFIL-001  |

### 6.3 Middellange termijn (P2)

| ID    | Aanbeveling                                                  | Adresseert    |
| ----- | ------------------------------------------------------------ | ------------- |
| R-008 | Voeg waar mogelijk cryptografische kanaalverificatie toe     | T-ACCESS-002  |
| R-009 | Implementeer integriteitsverificatie van de configuratie     | T-PERSIST-003 |
| R-010 | Voeg ondertekening van updates en versievergrendeling toe    | T-PERSIST-002 |

---

## 7. Bijlagen

### 7.1 Toewijzing van ATLAS-technieken

| ATLAS-ID      | Naam van techniek                       | OpenClaw-dreigingen                                              |
| ------------- | --------------------------------------- | ---------------------------------------------------------------- |
| AML.T0006     | Actieve scanning                        | T-RECON-001, T-RECON-002                                         |
| AML.T0009     | Verzameling                             | T-EXFIL-001, T-EXFIL-002, T-EXFIL-003                            |
| AML.T0010.001 | Toeleveringsketen: AI-software          | T-PERSIST-001, T-PERSIST-002                                     |
| AML.T0010.002 | Toeleveringsketen: gegevens             | T-PERSIST-003                                                    |
| AML.T0031     | Integriteit van AI-model aantasten      | T-IMPACT-001, T-IMPACT-002, T-IMPACT-003                         |
| AML.T0040     | Toegang tot API voor AI-modelinferentie | T-ACCESS-001, T-ACCESS-002, T-ACCESS-003, T-DISC-001, T-DISC-002 |
| AML.T0043     | Vijandige gegevens vervaardigen         | T-EXEC-004, T-EVADE-001, T-EVADE-002                             |
| AML.T0051.000 | LLM-promptinjectie: direct              | T-EXEC-001, T-EXEC-003                                           |
| AML.T0051.001 | LLM-promptinjectie: indirect            | T-EXEC-002                                                       |

### 7.2 Belangrijkste beveiligingsbestanden

| Pad                                 | Doel                                  | Risiconiveau |
| ----------------------------------- | ------------------------------------- | ------------ |
| `src/infra/exec-approvals.ts`       | Logica voor opdrachtgoedkeuring       | **Kritiek**  |
| `src/gateway/auth.ts`               | Gateway-authenticatie                 | **Kritiek**  |
| `src/infra/net/ssrf.ts`             | SSRF-bescherming                      | **Kritiek**  |
| `src/security/external-content.ts`  | Beperking van promptinjectie          | **Kritiek**  |
| `src/agents/sandbox/tool-policy.ts` | Toestaan/weigeren-beleid voor sandboxtools | **Kritiek** |
| `src/routing/resolve-route.ts`      | Sessie-isolatie/routering             | **Gemiddeld** |

### 7.3 Woordenlijst

| Term                 | Definitie                                                    |
| -------------------- | ------------------------------------------------------------ |
| **ATLAS**            | MITRE's landschap van vijandige dreigingen voor AI-systemen  |
| **ClawHub**          | Marktplaats voor OpenClaw-Skills                             |
| **Gateway**          | Laag voor berichtroutering en authenticatie van OpenClaw     |
| **MCP**              | Model Context Protocol - interface voor toolproviders        |
| **Promptinjectie**   | Aanval waarbij kwaadaardige instructies in invoer zijn ingebed |
| **Skill**            | Downloadbare uitbreiding voor OpenClaw-agenten               |
| **SSRF**             | Vervalsing van serverzijdeverzoeken                           |

---

_Dit dreigingsmodel is een levend document. Meld beveiligingsproblemen via `security@openclaw.ai` of bekijk de [vertrouwenspagina](https://trust.openclaw.ai)._

## Gerelateerd

- [Bijdragen aan het dreigingsmodel](/nl/security/CONTRIBUTING-THREAT-MODEL)
- [Incidentrespons](/nl/security/incident-response)
- [Netwerkproxy](/nl/security/network-proxy)
- [Formele verificatie](/nl/security/formal-verification)
