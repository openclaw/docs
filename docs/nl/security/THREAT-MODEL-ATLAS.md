---
read_when:
    - Beoordelen van de beveiligingshouding of dreigingsscenario's
    - Werken aan beveiligingsfuncties of auditreacties
summary: OpenClaw-dreigingsmodel in kaart gebracht volgens het MITRE ATLAS-framework
title: Dreigingsmodel (MITRE ATLAS)
x-i18n:
    generated_at: "2026-04-29T23:18:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: d929addb829b92d650ef6caecb267fb154f6f9f7d28be7aa87851569931f5228
    source_path: security/THREAT-MODEL-ATLAS.md
    workflow: 16
---

# OpenClaw-dreigingsmodel v1.0

## MITRE ATLAS-framework

**Versie:** 1.0-draft
**Laatst bijgewerkt:** 2026-02-04
**Methodologie:** MITRE ATLAS + gegevensstroomdiagrammen
**Framework:** [MITRE ATLAS](https://atlas.mitre.org/) (Adversarial Threat Landscape for AI Systems)

### Frameworkvermelding

Dit dreigingsmodel is gebaseerd op [MITRE ATLAS](https://atlas.mitre.org/), het industriestandaardframework voor het documenteren van vijandige dreigingen voor AI/ML-systemen. ATLAS wordt onderhouden door [MITRE](https://www.mitre.org/) in samenwerking met de AI-beveiligingsgemeenschap.

**Belangrijke ATLAS-bronnen:**

- [ATLAS-technieken](https://atlas.mitre.org/techniques/)
- [ATLAS-tactieken](https://atlas.mitre.org/tactics/)
- [ATLAS-casestudy's](https://atlas.mitre.org/studies/)
- [ATLAS GitHub](https://github.com/mitre-atlas/atlas-data)
- [Bijdragen aan ATLAS](https://atlas.mitre.org/resources/contribute)

### Bijdragen aan dit dreigingsmodel

Dit is een levend document dat wordt onderhouden door de OpenClaw-community. Zie [CONTRIBUTING-THREAT-MODEL.md](/nl/security/CONTRIBUTING-THREAT-MODEL) voor richtlijnen voor bijdragen:

- Nieuwe dreigingen melden
- Bestaande dreigingen bijwerken
- Aanvalsketens voorstellen
- Mitigaties voorstellen

---

## 1. Inleiding

### 1.1 Doel

Dit dreigingsmodel documenteert vijandige dreigingen voor het OpenClaw AI-agentplatform en de ClawHub Skill-marktplaats, met gebruik van het MITRE ATLAS-framework dat specifiek is ontworpen voor AI/ML-systemen.

### 1.2 Bereik

| Component              | Opgenomen | Opmerkingen                                      |
| ---------------------- | --------- | ------------------------------------------------ |
| OpenClaw Agent Runtime | Ja        | Uitvoering van kernagent, toolaanroepen, sessies |
| Gateway                | Ja        | Authenticatie, routering, kanaalintegratie       |
| Kanaalintegraties      | Ja        | WhatsApp, Telegram, Discord, Signal, Slack, enz. |
| ClawHub Marketplace    | Ja        | Publicatie, moderatie en distributie van Skills  |
| MCP-servers            | Ja        | Externe toolproviders                            |
| Gebruikersapparaten    | Gedeeltelijk | Mobiele apps, desktopclients                  |

### 1.3 Buiten bereik

Niets valt expliciet buiten het bereik van dit dreigingsmodel.

---

## 2. Systeemarchitectuur

### 2.1 Vertrouwensgrenzen

```
┌─────────────────────────────────────────────────────────────────┐
│                    UNTRUSTED ZONE                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  WhatsApp   │  │  Telegram   │  │   Discord   │  ...         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│         │                │                │                      │
└─────────┼────────────────┼────────────────┼──────────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│                 TRUST BOUNDARY 1: Channel Access                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      GATEWAY                              │   │
│  │  • Device Pairing (1h DM / 5m node grace period)           │   │
│  │  • AllowFrom / AllowList validation                       │   │
│  │  • Token/Password/Tailscale auth                          │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 TRUST BOUNDARY 2: Session Isolation              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   AGENT SESSIONS                          │   │
│  │  • Session key = agent:channel:peer                       │   │
│  │  • Tool policies per agent                                │   │
│  │  • Transcript logging                                     │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 TRUST BOUNDARY 3: Tool Execution                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  EXECUTION SANDBOX                        │   │
│  │  • Docker sandbox OR Host (exec-approvals)                │   │
│  │  • Node remote execution                                  │   │
│  │  • SSRF protection (DNS pinning + IP blocking)            │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 TRUST BOUNDARY 4: External Content               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              FETCHED URLs / EMAILS / WEBHOOKS             │   │
│  │  • External content wrapping (XML tags)                   │   │
│  │  • Security notice injection                              │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 TRUST BOUNDARY 5: Supply Chain                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      CLAWHUB                              │   │
│  │  • Skill publishing (semver, SKILL.md required)           │   │
│  │  • Pattern-based moderation flags                         │   │
│  │  • VirusTotal scanning (coming soon)                      │   │
│  │  • GitHub account age verification                        │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Gegevensstromen

| Stroom | Bron    | Bestemming | Gegevens           | Bescherming          |
| ------ | ------- | ---------- | ------------------ | -------------------- |
| F1     | Kanaal  | Gateway    | Gebruikersberichten | TLS, AllowFrom      |
| F2     | Gateway | Agent      | Gerouteerde berichten | Sessie-isolatie    |
| F3     | Agent   | Tools      | Toolaanroepen      | Beleidsafdwinging    |
| F4     | Agent   | Extern     | web_fetch requests | SSRF-blokkering      |
| F5     | ClawHub | Agent      | Skill-code         | Moderatie, scanning  |
| F6     | Agent   | Kanaal     | Antwoorden         | Uitvoerfiltering     |

---

## 3. Dreigingsanalyse per ATLAS-tactiek

### 3.1 Verkenning (AML.TA0002)

#### T-RECON-001: Ontdekking van agent-eindpunten

| Kenmerk                 | Waarde                                                               |
| ----------------------- | -------------------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0006 - Actief scannen                                           |
| **Beschrijving**        | Aanvaller scant naar blootgestelde OpenClaw Gateway-eindpunten       |
| **Aanvalsvector**       | Netwerkscanning, Shodan-query's, DNS-enumeratie                      |
| **Getroffen componenten** | Gateway, blootgestelde API-eindpunten                              |
| **Huidige mitigaties**  | Tailscale-authoptie, standaard binden aan loopback                   |
| **Restrisico**          | Middelgroot - openbare gateways zijn vindbaar                        |
| **Aanbevelingen**       | Beveiligde implementatie documenteren, rate limiting toevoegen aan ontdekkingseindpunten |

#### T-RECON-002: Peilen van kanaalintegraties

| Kenmerk                 | Waarde                                                                       |
| ----------------------- | ----------------------------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0006 - Actief scannen                                                    |
| **Beschrijving**        | Aanvaller peilt berichtenkanalen om door AI beheerde accounts te identificeren |
| **Aanvalsvector**       | Testberichten sturen, responspatronen observeren                              |
| **Getroffen componenten** | Alle kanaalintegraties                                                       |
| **Huidige mitigaties**  | Geen specifieke                                                               |
| **Restrisico**          | Laag - Beperkte waarde van ontdekking alleen                                  |
| **Aanbevelingen**       | Overweeg randomisatie van responstiming                                       |

---

### 3.2 Initiële toegang (AML.TA0004)

#### T-ACCESS-001: Onderschepping van koppelingscode

| Kenmerk                 | Waarde                                                                                                                |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0040 - Toegang tot AI-modelinferentie-API                                                                         |
| **Beschrijving**        | Aanvaller onderschept koppelingscode tijdens respijtperiode voor koppeling (1 u voor DM-kanaalkoppeling, 5 min voor Node-koppeling) |
| **Aanvalsvector**       | Meekijken over de schouder, netwerk-sniffing, social engineering                                                       |
| **Getroffen componenten** | Apparaatkoppelingssysteem                                                                                           |
| **Huidige mitigaties**  | Vervalt na 1 u (DM-koppeling) / 5 min (Node-koppeling), codes verzonden via bestaand kanaal                            |
| **Restrisico**          | Middel - Respijtperiode is exploiteerbaar                                                                              |
| **Aanbevelingen**       | Verkort de respijtperiode, voeg een bevestigingsstap toe                                                               |

#### T-ACCESS-002: AllowFrom-spoofing

| Kenmerk                 | Waarde                                                                                |
| ----------------------- | -------------------------------------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0040 - Toegang tot AI-modelinferentie-API                                         |
| **Beschrijving**        | Aanvaller spooft toegestane afzenderidentiteit in kanaal                               |
| **Aanvalsvector**       | Afhankelijk van kanaal - spoofing van telefoonnummers, imitatie van gebruikersnamen    |
| **Getroffen componenten** | AllowFrom-validatie per kanaal                                                       |
| **Huidige mitigaties**  | Kanaalspecifieke identiteitsverificatie                                                |
| **Restrisico**          | Middel - Sommige kanalen zijn kwetsbaar voor spoofing                                  |
| **Aanbevelingen**       | Documenteer kanaalspecifieke risico's, voeg waar mogelijk cryptografische verificatie toe |

#### T-ACCESS-003: Tokendiefstal

| Kenmerk                 | Waarde                                                        |
| ----------------------- | -------------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0040 - Toegang tot AI-modelinferentie-API                 |
| **Beschrijving**        | Aanvaller steelt authenticatietokens uit configuratiebestanden |
| **Aanvalsvector**       | Malware, onbevoegde apparaattoegang, blootstelling van configuratieback-ups |
| **Getroffen componenten** | ~/.openclaw/credentials/, configuratieopslag                 |
| **Huidige mitigaties**  | Bestandsmachtigingen                                          |
| **Restrisico**          | Hoog - Tokens worden in platte tekst opgeslagen               |
| **Aanbevelingen**       | Implementeer tokenversleuteling in rust, voeg tokenrotatie toe |

---

### 3.3 Uitvoering (AML.TA0005)

#### T-EXEC-001: Directe promptinjectie

| Kenmerk                 | Waarde                                                                                         |
| ----------------------- | ----------------------------------------------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0051.000 - LLM-promptinjectie: direct                                                      |
| **Beschrijving**        | Aanvaller stuurt gemanipuleerde prompts om agentgedrag te manipuleren                           |
| **Aanvalsvector**       | Kanaalberichten met vijandige instructies                                                       |
| **Getroffen componenten** | Agent-LLM, alle invoeroppervlakken                                                            |
| **Huidige mitigaties**  | Patroondetectie, omwikkeling van externe content                                                |
| **Restrisico**          | Kritiek - Alleen detectie, geen blokkering; geavanceerde aanvallen omzeilen dit                 |
| **Aanbevelingen**       | Implementeer meerlaagse verdediging, uitvoervalidatie, gebruikersbevestiging voor gevoelige acties |

#### T-EXEC-002: Indirecte promptinjectie

| Kenmerk                 | Waarde                                                          |
| ----------------------- | ---------------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0051.001 - LLM-promptinjectie: indirect                    |
| **Beschrijving**        | Aanvaller sluit kwaadaardige instructies in opgehaalde content in |
| **Aanvalsvector**       | Kwaadaardige URL's, vergiftigde e-mails, gecompromitteerde webhooks |
| **Getroffen componenten** | web_fetch, e-mailinname, externe gegevensbronnen               |
| **Huidige mitigaties**  | Contentomwikkeling met XML-tags en beveiligingsmelding          |
| **Restrisico**          | Hoog - LLM kan wrapperinstructies negeren                       |
| **Aanbevelingen**       | Implementeer contentsanering, gescheiden uitvoeringscontexten   |

#### T-EXEC-003: Injectie van toolargumenten

| Kenmerk                 | Waarde                                                        |
| ----------------------- | -------------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0051.000 - LLM-promptinjectie: direct                     |
| **Beschrijving**        | Aanvaller manipuleert toolargumenten via promptinjectie        |
| **Aanvalsvector**       | Gemanipuleerde prompts die toolparameterwaarden beïnvloeden    |
| **Getroffen componenten** | Alle toolaanroepen                                           |
| **Huidige mitigaties**  | Exec-goedkeuringen voor gevaarlijke opdrachten                 |
| **Restrisico**          | Hoog - Vertrouwt op het oordeel van de gebruiker               |
| **Aanbevelingen**       | Implementeer argumentvalidatie, geparametriseerde toolaanroepen |

#### T-EXEC-004: Omzeiling van Exec-goedkeuring

| Kenmerk                 | Waarde                                                      |
| ----------------------- | ------------------------------------------------------------ |
| **ATLAS-ID**            | AML.T0043 - Vijandige gegevens maken                         |
| **Beschrijving**        | Aanvaller maakt opdrachten die de goedkeuringsallowlist omzeilen |
| **Aanvalsvector**       | Opdrachtobfuscatie, misbruik van aliassen, padmanipulatie    |
| **Getroffen componenten** | exec-approvals.ts, opdrachtallowlist                       |
| **Huidige mitigaties**  | Allowlist + vraagmodus                                       |
| **Restrisico**          | Hoog - Geen opdrachtsanering                                 |
| **Aanbevelingen**       | Implementeer opdrachtnormalisatie, breid blocklist uit       |

---

### 3.4 Persistentie (AML.TA0006)

#### T-PERSIST-001: Installatie van kwaadaardige Skill

| Kenmerk                 | Waarde                                                                     |
| ----------------------- | --------------------------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0010.001 - Compromittering van de toeleveringsketen: AI-software       |
| **Beschrijving**        | Aanvaller publiceert kwaadaardige Skill naar ClawHub                        |
| **Aanvalsvector**       | Account aanmaken, Skill publiceren met verborgen kwaadaardige code          |
| **Getroffen componenten** | ClawHub, laden van Skills, agentuitvoering                                |
| **Huidige mitigaties**  | Verificatie van leeftijd van GitHub-account, patroongebaseerde moderatievlaggen |
| **Restrisico**          | Kritiek - Geen sandboxing, beperkte beoordeling                             |
| **Aanbevelingen**       | VirusTotal-integratie (in uitvoering), sandboxing van Skills, communitybeoordeling |

#### T-PERSIST-002: Vergiftiging van Skill-updates

| Kenmerk                 | Waarde                                                          |
| ----------------------- | ---------------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0010.001 - Compromittering van de toeleveringsketen: AI-software |
| **Beschrijving**        | Aanvaller compromitteert populaire Skill en pusht kwaadaardige update |
| **Aanvalsvector**       | Accountcompromittering, social engineering van Skill-eigenaar   |
| **Getroffen componenten** | ClawHub-versionering, flows voor automatische updates          |
| **Huidige mitigaties**  | Versiefingerprinting                                            |
| **Restrisico**          | Hoog - Automatische updates kunnen kwaadaardige versies ophalen |
| **Aanbevelingen**       | Implementeer ondertekening van updates, rollbackmogelijkheid, versiepinning |

#### T-PERSIST-003: Manipulatie van agentconfiguratie

| Kenmerk                 | Waarde                                                           |
| ----------------------- | ----------------------------------------------------------------- |
| **ATLAS-ID**            | AML.T0010.002 - Compromittering van de toeleveringsketen: gegevens |
| **Beschrijving**        | Aanvaller wijzigt agentconfiguratie om toegang te behouden        |
| **Aanvalsvector**       | Wijziging van configuratiebestanden, injectie van instellingen    |
| **Getroffen componenten** | Agentconfiguratie, toolbeleid                                   |
| **Huidige mitigaties**  | Bestandsmachtigingen                                             |
| **Restrisico**          | Middel - Vereist lokale toegang                                  |
| **Aanbevelingen**       | Integriteitsverificatie van configuratie, auditlogging voor configuratiewijzigingen |

---

### 3.5 Verdedigingsontwijking (AML.TA0007)

#### T-EVADE-001: Omzeiling van moderatiepatronen

| Kenmerk                 | Waarde                                                                  |
| ----------------------- | ------------------------------------------------------------------------ |
| **ATLAS-ID**            | AML.T0043 - Vijandige gegevens maken                                     |
| **Beschrijving**        | Aanvaller maakt Skill-content om moderatiepatronen te ontwijken          |
| **Aanvalsvector**       | Unicode-homogliefen, coderingstrucs, dynamisch laden                     |
| **Getroffen componenten** | ClawHub moderation.ts                                                  |
| **Huidige mitigaties**  | Patroongebaseerde FLAG_RULES                                             |
| **Restrisico**          | Hoog - Eenvoudige regex wordt gemakkelijk omzeild                        |
| **Aanbevelingen**       | Voeg gedragsanalyse toe (VirusTotal Code Insight), AST-gebaseerde detectie |

#### T-EVADE-002: Ontsnappen uit contentwrapper

| Kenmerk                | Waarde                                                    |
| ---------------------- | --------------------------------------------------------- |
| **ATLAS-ID**           | AML.T0043 - Vijandige gegevens creëren                    |
| **Beschrijving**       | Aanvaller maakt inhoud die ontsnapt uit XML-wrappercontext |
| **Aanvalsvector**      | Tagmanipulatie, contextverwarring, overschrijven van instructies |
| **Getroffen componenten** | Wrapping van externe inhoud                            |
| **Huidige mitigaties** | XML-tags + beveiligingsmelding                           |
| **Restrisico**         | Gemiddeld - Nieuwe ontsnappingen worden regelmatig ontdekt |
| **Aanbevelingen**      | Meerdere wrapperlagen, validatie aan de uitvoerzijde      |

---

### 3.6 Discovery (AML.TA0008)

#### T-DISC-001: Toolinventarisatie

| Kenmerk                | Waarde                                                |
| ---------------------- | ----------------------------------------------------- |
| **ATLAS-ID**           | AML.T0040 - Toegang tot AI-modelinferentie-API        |
| **Beschrijving**       | Aanvaller inventariseert beschikbare tools via prompts |
| **Aanvalsvector**      | Query's in de stijl van "What tools do you have?"     |
| **Getroffen componenten** | Agent-toolregister                                 |
| **Huidige mitigaties** | Geen specifiek                                        |
| **Restrisico**         | Laag - Tools zijn doorgaans gedocumenteerd            |
| **Aanbevelingen**      | Overweeg controles voor toolzichtbaarheid             |

#### T-DISC-002: Extractie van sessiegegevens

| Kenmerk                | Waarde                                                |
| ---------------------- | ----------------------------------------------------- |
| **ATLAS-ID**           | AML.T0040 - Toegang tot AI-modelinferentie-API        |
| **Beschrijving**       | Aanvaller extraheert gevoelige gegevens uit sessiecontext |
| **Aanvalsvector**      | Query's als "What did we discuss?", contextverkenning |
| **Getroffen componenten** | Sessietranscripten, contextvenster                 |
| **Huidige mitigaties** | Sessie-isolatie per afzender                          |
| **Restrisico**         | Gemiddeld - Gegevens binnen de sessie zijn toegankelijk |
| **Aanbevelingen**      | Implementeer redactie van gevoelige gegevens in context |

---

### 3.7 Verzameling & Exfiltratie (AML.TA0009, AML.TA0010)

#### T-EXFIL-001: Gegevensdiefstal via web_fetch

| Kenmerk                | Waarde                                                                  |
| ---------------------- | ----------------------------------------------------------------------- |
| **ATLAS-ID**           | AML.T0009 - Verzameling                                                 |
| **Beschrijving**       | Aanvaller exfiltreert gegevens door agent opdracht te geven ze naar externe URL te sturen |
| **Aanvalsvector**      | Promptinjectie waardoor agent gegevens POST naar server van aanvaller   |
| **Getroffen componenten** | web_fetch-tool                                                       |
| **Huidige mitigaties** | SSRF-blokkering voor interne netwerken                                  |
| **Restrisico**         | Hoog - Externe URL's toegestaan                                         |
| **Aanbevelingen**      | Implementeer URL-allowlisting, bewustzijn van gegevensclassificatie     |

#### T-EXFIL-002: Ongeautoriseerd berichten verzenden

| Kenmerk                | Waarde                                                            |
| ---------------------- | ----------------------------------------------------------------- |
| **ATLAS-ID**           | AML.T0009 - Verzameling                                           |
| **Beschrijving**       | Aanvaller zorgt dat agent berichten met gevoelige gegevens verzendt |
| **Aanvalsvector**      | Promptinjectie waardoor agent aanvaller een bericht stuurt        |
| **Getroffen componenten** | Berichtentool, kanaalintegraties                               |
| **Huidige mitigaties** | Gating voor uitgaande berichten                                   |
| **Restrisico**         | Gemiddeld - Gating kan worden omzeild                             |
| **Aanbevelingen**      | Vereis expliciete bevestiging voor nieuwe ontvangers              |

#### T-EXFIL-003: Verzamelen van inloggegevens

| Kenmerk                | Waarde                                                   |
| ---------------------- | -------------------------------------------------------- |
| **ATLAS-ID**           | AML.T0009 - Verzameling                                  |
| **Beschrijving**       | Kwaadwillende skill verzamelt inloggegevens uit agentcontext |
| **Aanvalsvector**      | Skill-code leest omgevingsvariabelen, configuratiebestanden |
| **Getroffen componenten** | Uitvoeringsomgeving van Skill                         |
| **Huidige mitigaties** | Geen specifiek voor Skills                              |
| **Restrisico**         | Kritiek - Skills draaien met agentrechten                |
| **Aanbevelingen**      | Sandboxing van Skills, isolatie van inloggegevens        |

---

### 3.8 Impact (AML.TA0011)

#### T-IMPACT-001: Ongeautoriseerde opdrachtuitvoering

| Kenmerk                | Waarde                                               |
| ---------------------- | ---------------------------------------------------- |
| **ATLAS-ID**           | AML.T0031 - Integriteit van AI-model ondermijnen     |
| **Beschrijving**       | Aanvaller voert willekeurige opdrachten uit op gebruikerssysteem |
| **Aanvalsvector**      | Promptinjectie gecombineerd met omzeiling van exec-goedkeuring |
| **Getroffen componenten** | Bash-tool, opdrachtuitvoering                     |
| **Huidige mitigaties** | Exec-goedkeuringen, Docker-sandboxoptie              |
| **Restrisico**         | Kritiek - Hostuitvoering zonder sandbox              |
| **Aanbevelingen**      | Gebruik standaard sandbox, verbeter goedkeurings-UX  |

#### T-IMPACT-002: Uitputting van resources (DoS)

| Kenmerk                | Waarde                                              |
| ---------------------- | --------------------------------------------------- |
| **ATLAS-ID**           | AML.T0031 - Integriteit van AI-model ondermijnen    |
| **Beschrijving**       | Aanvaller put API-tegoed of rekenresources uit      |
| **Aanvalsvector**      | Geautomatiseerde berichtenstroom, dure toolaanroepen |
| **Getroffen componenten** | Gateway, agentsessies, API-provider             |
| **Huidige mitigaties** | Geen                                                |
| **Restrisico**         | Hoog - Geen rate limiting                           |
| **Aanbevelingen**      | Implementeer snelheidslimieten per afzender, kostenbudgetten |

#### T-IMPACT-003: Reputatieschade

| Kenmerk                | Waarde                                                   |
| ---------------------- | -------------------------------------------------------- |
| **ATLAS-ID**           | AML.T0031 - Integriteit van AI-model ondermijnen         |
| **Beschrijving**       | Aanvaller zorgt dat agent schadelijke/aanstootgevende inhoud verstuurt |
| **Aanvalsvector**      | Promptinjectie die ongepaste antwoorden veroorzaakt      |
| **Getroffen componenten** | Uitvoergeneratie, kanaalberichten                    |
| **Huidige mitigaties** | Inhoudsbeleid van LLM-provider                           |
| **Restrisico**         | Gemiddeld - Providerfilters zijn niet perfect            |
| **Aanbevelingen**      | Filterlaag voor uitvoer, gebruikerscontroles             |

---

## 4. Analyse van de ClawHub-toeleveringsketen

### 4.1 Huidige beveiligingscontroles

| Controle             | Implementatie              | Effectiviteit                                        |
| -------------------- | -------------------------- | ---------------------------------------------------- |
| Leeftijd GitHub-account | `requireGitHubAccountAge()` | Gemiddeld - Verhoogt de drempel voor nieuwe aanvallers |
| Paden opschonen      | `sanitizePath()`           | Hoog - Voorkomt path traversal                       |
| Validatie bestandstype | `isTextFile()`           | Gemiddeld - Alleen tekstbestanden, maar die kunnen nog steeds kwaadaardig zijn |
| Groottelimieten      | Totaal bundel van 50 MB    | Hoog - Voorkomt uitputting van resources             |
| Vereiste SKILL.md    | Verplichte readme          | Lage beveiligingswaarde - Alleen informatief         |
| Patroonmoderatie     | FLAG_RULES in moderation.ts | Laag - Gemakkelijk te omzeilen                       |
| Moderatiestatus      | Veld `moderationStatus`    | Gemiddeld - Handmatige beoordeling mogelijk          |

### 4.2 Moderatievlagpatronen

Huidige patronen in `moderation.ts`:

```javascript
// Known-bad identifiers
/(keepcold131\/ClawdAuthenticatorTool|ClawdAuthenticatorTool)/i

// Suspicious keywords
/(malware|stealer|phish|phishing|keylogger)/i
/(api[-_ ]?key|token|password|private key|secret)/i
/(wallet|seed phrase|mnemonic|crypto)/i
/(discord\.gg|webhook|hooks\.slack)/i
/(curl[^\n]+\|\s*(sh|bash))/i
/(bit\.ly|tinyurl\.com|t\.co|goo\.gl|is\.gd)/i
```

**Beperkingen:**

- Controleert alleen slug, displayName, summary, frontmatter, metadata, bestandspaden
- Analyseert de daadwerkelijke skill-code-inhoud niet
- Eenvoudige regex is gemakkelijk te omzeilen met obfuscatie
- Geen gedragsanalyse

### 4.3 Geplande verbeteringen

| Verbetering            | Status                                | Impact                                                                |
| ---------------------- | ------------------------------------- | --------------------------------------------------------------------- |
| VirusTotal-integratie  | In uitvoering                         | Hoog - Gedragsanalyse met Code Insight                                |
| Communityrapportage    | Gedeeltelijk (tabel `skillReports` bestaat) | Gemiddeld                                                        |
| Auditlogging           | Gedeeltelijk (tabel `auditLogs` bestaat) | Gemiddeld                                                          |
| Badgesysteem           | Geïmplementeerd                       | Gemiddeld - `highlighted`, `official`, `deprecated`, `redactionApproved` |

---

## 5. Risicomatrix

### 5.1 Waarschijnlijkheid versus impact

| Dreigings-ID   | Waarschijnlijkheid | Impact   | Risiconiveau | Prioriteit |
| -------------- | ------------------ | -------- | ------------ | ---------- |
| T-EXEC-001     | Hoog               | Kritiek  | **Kritiek**  | P0         |
| T-PERSIST-001  | Hoog               | Kritiek  | **Kritiek**  | P0         |
| T-EXFIL-003    | Gemiddeld          | Kritiek  | **Kritiek**  | P0         |
| T-IMPACT-001   | Gemiddeld          | Kritiek  | **Hoog**     | P1         |
| T-EXEC-002     | Hoog               | Hoog     | **Hoog**     | P1         |
| T-EXEC-004     | Gemiddeld          | Hoog     | **Hoog**     | P1         |
| T-ACCESS-003   | Gemiddeld          | Hoog     | **Hoog**     | P1         |
| T-EXFIL-001    | Gemiddeld          | Hoog     | **Hoog**     | P1         |
| T-IMPACT-002   | Hoog               | Gemiddeld | **Hoog**    | P1         |
| T-EVADE-001    | Hoog               | Gemiddeld | **Gemiddeld** | P2       |
| T-ACCESS-001   | Laag               | Hoog     | **Gemiddeld** | P2        |
| T-ACCESS-002   | Laag               | Hoog     | **Gemiddeld** | P2        |
| T-PERSIST-002  | Laag               | Hoog     | **Gemiddeld** | P2        |

### 5.2 Kritieke aanvalsketens

**Aanvalsketen 1: Gegevensdiefstal op basis van Skills**

```
T-PERSIST-001 → T-EVADE-001 → T-EXFIL-003
(Publish malicious skill) → (Evade moderation) → (Harvest credentials)
```

**Aanvalsketen 2: Promptinjectie naar RCE**

```
T-EXEC-001 → T-EXEC-004 → T-IMPACT-001
(Inject prompt) → (Bypass exec approval) → (Execute commands)
```

**Aanvalsketen 3: Indirecte injectie via opgehaalde inhoud**

```
T-EXEC-002 → T-EXFIL-001 → External exfiltration
(Poison URL content) → (Agent fetches & follows instructions) → (Data sent to attacker)
```

---

## 6. Samenvatting van aanbevelingen

### 6.1 Onmiddellijk (P0)

| ID    | Aanbeveling                                | Behandelt                  |
| ----- | ------------------------------------------ | -------------------------- |
| R-001 | Voltooi de VirusTotal-integratie           | T-PERSIST-001, T-EVADE-001 |
| R-002 | Implementeer skill-sandboxing              | T-PERSIST-001, T-EXFIL-003 |
| R-003 | Voeg uitvoervalidatie toe voor gevoelige acties | T-EXEC-001, T-EXEC-002     |

### 6.2 Korte termijn (P1)

| ID    | Aanbeveling                              | Behandelt    |
| ----- | ---------------------------------------- | ------------ |
| R-004 | Implementeer snelheidsbeperking          | T-IMPACT-002 |
| R-005 | Voeg versleuteling van tokens in rust toe | T-ACCESS-003 |
| R-006 | Verbeter de UX en validatie voor exec-goedkeuring | T-EXEC-004   |
| R-007 | Implementeer URL-allowlisting voor web_fetch | T-EXFIL-001  |

### 6.3 Middellange termijn (P2)

| ID    | Aanbeveling                                        | Behandelt     |
| ----- | -------------------------------------------------- | ------------- |
| R-008 | Voeg cryptografische kanaalverificatie toe waar mogelijk | T-ACCESS-002  |
| R-009 | Implementeer verificatie van config-integriteit    | T-PERSIST-003 |
| R-010 | Voeg update-ondertekening en versie-pinning toe    | T-PERSIST-002 |

---

## 7. Bijlagen

### 7.1 ATLAS-techniekmapping

| ATLAS-ID      | Technieknaam                   | OpenClaw-dreigingen                                             |
| ------------- | ------------------------------ | ---------------------------------------------------------------- |
| AML.T0006     | Actief scannen                 | T-RECON-001, T-RECON-002                                         |
| AML.T0009     | Verzameling                    | T-EXFIL-001, T-EXFIL-002, T-EXFIL-003                            |
| AML.T0010.001 | Toeleveringsketen: AI-software | T-PERSIST-001, T-PERSIST-002                                     |
| AML.T0010.002 | Toeleveringsketen: data        | T-PERSIST-003                                                    |
| AML.T0031     | AI-modelintegriteit aantasten  | T-IMPACT-001, T-IMPACT-002, T-IMPACT-003                         |
| AML.T0040     | API-toegang voor AI-modelinferentie | T-ACCESS-001, T-ACCESS-002, T-ACCESS-003, T-DISC-001, T-DISC-002 |
| AML.T0043     | Adversariële data maken        | T-EXEC-004, T-EVADE-001, T-EVADE-002                             |
| AML.T0051.000 | LLM-promptinjectie: direct     | T-EXEC-001, T-EXEC-003                                           |
| AML.T0051.001 | LLM-promptinjectie: indirect   | T-EXEC-002                                                       |

### 7.2 Belangrijke beveiligingsbestanden

| Pad                                 | Doel                        | Risiconiveau |
| ----------------------------------- | --------------------------- | ------------ |
| `src/infra/exec-approvals.ts`       | Logica voor opdrachtgoedkeuring | **Kritiek** |
| `src/gateway/auth.ts`               | Gateway-authenticatie       | **Kritiek** |
| `src/infra/net/ssrf.ts`             | SSRF-bescherming            | **Kritiek** |
| `src/security/external-content.ts`  | Beperking van promptinjectie | **Kritiek** |
| `src/agents/sandbox/tool-policy.ts` | Handhaving van toolbeleid   | **Kritiek** |
| `src/routing/resolve-route.ts`      | Sessie-isolatie             | **Middel**   |

### 7.3 Woordenlijst

| Term                 | Definitie                                                 |
| -------------------- | --------------------------------------------------------- |
| **ATLAS**            | MITRE's Adversarial Threat Landscape for AI Systems       |
| **ClawHub**          | OpenClaw's skill-marktplaats                              |
| **Gateway**          | OpenClaw's laag voor berichtroutering en authenticatie    |
| **MCP**              | Model Context Protocol - interface voor toolproviders     |
| **Prompt Injection** | Aanval waarbij kwaadaardige instructies in invoer zijn ingebed |
| **Skill**            | Downloadbare extensie voor OpenClaw-agenten               |
| **SSRF**             | Server-Side Request Forgery                               |

---

_Dit dreigingsmodel is een levend document. Meld beveiligingsproblemen aan security@openclaw.ai_

## Gerelateerd

- [Formele verificatie](/nl/security/formal-verification)
- [Bijdragen aan het dreigingsmodel](/nl/security/CONTRIBUTING-THREAT-MODEL)
